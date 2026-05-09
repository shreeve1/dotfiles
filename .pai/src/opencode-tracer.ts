import { createHash } from "node:crypto";
import { buildRuntimePaths } from "./runtime-paths";
import { createPaiSessionId } from "./session-wrapper";
import { evaluatePolicy, type AdapterCapabilities, type PolicyActionType } from "./policy";
import { prepareEventForDestination } from "./redaction";
import { renderInstallPlanFixture, validateInstallPlan, type InstallPlan } from "./installer-contract";
import { CanonicalMemoryStore, type MemoryContextBlock, type MemoryContextOptions } from "./memory-store";
import type { EventIngestInput } from "./event-store";

export const OPENCODE_PLUGIN_RESPONSIBILITIES = [
  { responsibility: "routing", owner: "existing_plugin", plugin: "pai-mode-router" },
  { responsibility: "isa_sync", owner: "existing_plugin", plugin: "pai-isa-sync" },
  { responsibility: "containment", owner: "existing_plugin", plugin: "pai-containment-guard" },
  { responsibility: "event_emission", owner: "shared_adapter", plugin: "pai-opencode-tracer" },
  { responsibility: "retrieval", owner: "shared_adapter", plugin: "pai-opencode-tracer" },
  { responsibility: "reflection", owner: "pai_dream", plugin: "pai-reflection-loop" },
  { responsibility: "config_audit", owner: "existing_plugin", plugin: "pai-config-audit" },
] as const;

export const OPENCODE_PLUGIN_EVENTS = ["SessionStart", "UserPromptSubmit", "ToolCall", "PolicyDecision", "Stop", "Retrieval"] as const;

export type OpenCodeResponsibility = (typeof OPENCODE_PLUGIN_RESPONSIBILITIES)[number]["responsibility"];
export type OpenCodeResponsibilityOwner = "existing_plugin" | "shared_adapter" | "pai_dream";
export type OpenCodePluginEvent = (typeof OPENCODE_PLUGIN_EVENTS)[number];

export type OpenCodePluginOrderingCheck = {
  duplicate_context_injection: boolean;
  duplicate_isa_sync: boolean;
  conflicting_containment: boolean;
  ordered_plugins: string[];
};

export type OpenCodeSessionResolutionInput = {
  env?: Record<string, string | undefined>;
  opencodeSessionId?: string;
  seed?: Parameters<typeof createPaiSessionId>[0];
};

export type OpenCodeSessionResolution = {
  pai_session_id: string;
  source: "pai_run" | "opencode_plugin" | "native_adapter";
  managed_event: "session.attached_to_pai_run" | "session.attached_to_opencode_plugin" | "session.created_by_native_adapter";
};

export type OpenCodePluginObservation = {
  event: OpenCodePluginEvent;
  pai_session_id: string;
  sequence: number;
  timestamp: string;
  cwd?: string;
  project_id?: string;
  prompt?: string;
  tool_name?: string;
  tool_input?: string;
  tool_output?: string;
  decision?: string;
  retrieval_context?: string;
  plugin_surface?: string;
};

export type OpenCodeTracerTemplate = {
  install_plan: InstallPlan;
  install_plan_valid: boolean;
  responsibility_matrix: typeof OPENCODE_PLUGIN_RESPONSIBILITIES;
  hook_templates: Array<{ event: OpenCodePluginEvent; command: string }>;
  live_config_mutation_allowed: false;
};

export const OPENCODE_ADAPTER_VERSION = "opencode-tracer/0.1.0";

export const OPENCODE_CAPABILITIES: AdapterCapabilities = {
  can_inject_context: true,
  can_block_tool: false,
  can_request_confirmation: false,
  can_observe_tool_input: true,
  can_observe_tool_output: true,
  can_observe_final_response: true,
  can_set_environment: true,
  can_attach_native_session_id: false,
};

const TEMPLATE_HOOKS: OpenCodeTracerTemplate["hook_templates"] = [
  { event: "SessionStart", command: "bun ~/.pai/adapters/opencode/tracer.ts --event SessionStart" },
  { event: "UserPromptSubmit", command: "bun ~/.pai/adapters/opencode/tracer.ts --event UserPromptSubmit" },
  { event: "ToolCall", command: "bun ~/.pai/adapters/opencode/tracer.ts --event ToolCall" },
  { event: "PolicyDecision", command: "bun ~/.pai/adapters/opencode/tracer.ts --event PolicyDecision" },
  { event: "Retrieval", command: "pai-memory context --project $PAI_PROJECT_ID" },
  { event: "Stop", command: "bun ~/.pai/adapters/opencode/tracer.ts --event Stop" },
];

export function resolveOpenCodePaiSession(input: OpenCodeSessionResolutionInput = {}): OpenCodeSessionResolution {
  const inheritedSession = input.env?.PAI_SESSION_ID;
  if (inheritedSession) {
    return {
      pai_session_id: inheritedSession,
      source: "pai_run",
      managed_event: "session.attached_to_pai_run",
    };
  }

  if (input.opencodeSessionId) {
    return {
      pai_session_id: `pai_opencode_${hash(input.opencodeSessionId).slice(0, 32)}`,
      source: "opencode_plugin",
      managed_event: "session.attached_to_opencode_plugin",
    };
  }

  return {
    pai_session_id: createPaiSessionId(input.seed),
    source: "native_adapter",
    managed_event: "session.created_by_native_adapter",
  };
}

export function buildOpenCodeTracerTemplate(): OpenCodeTracerTemplate {
  const installPlan = renderInstallPlanFixture("opencode");
  const validation = validateInstallPlan(installPlan);
  return {
    install_plan: installPlan,
    install_plan_valid: validation.valid,
    responsibility_matrix: OPENCODE_PLUGIN_RESPONSIBILITIES,
    hook_templates: TEMPLATE_HOOKS,
    live_config_mutation_allowed: false,
  };
}

export function checkOpenCodePluginOrdering(plugins: string[]): OpenCodePluginOrderingCheck {
  return {
    duplicate_context_injection: countMatching(plugins, ["pai-opencode-tracer", "pai-memory-context", "pai-context-injector"]) > 1,
    duplicate_isa_sync: countMatching(plugins, ["pai-opencode-tracer", "pai-isa-sync"]) > 1 && owns("isa_sync") === "shared_adapter",
    conflicting_containment: countMatching(plugins, ["pai-opencode-tracer", "pai-containment-guard"]) > 1 && owns("containment") === "shared_adapter",
    ordered_plugins: [...plugins],
  };
}

export function buildOpenCodeRetrievalContext(
  store: Pick<CanonicalMemoryStore, "buildContextBlock">,
  options: MemoryContextOptions = {},
): MemoryContextBlock {
  return store.buildContextBlock(options);
}

export function buildOpenCodeDegradedCapabilityEvent(
  resolution: OpenCodeSessionResolution,
  missingCapability: keyof AdapterCapabilities,
  timestamp = new Date().toISOString(),
): EventIngestInput {
  return mapOpenCodePluginObservationToEvent({
    event: "PolicyDecision",
    pai_session_id: resolution.pai_session_id,
    sequence: 1,
    timestamp,
    decision: `degraded:${missingCapability}`,
    plugin_surface: missingCapability,
  });
}

export function mapOpenCodePluginObservationToEvent(observation: OpenCodePluginObservation): EventIngestInput {
  const eventType = opencodeEventType(observation);
  const redacted = prepareEventForDestination("sqlite", {
    event_id: `${observation.pai_session_id}:${eventType}:${observation.sequence}`,
    pai_session_id: observation.pai_session_id,
    harness: "opencode",
    event_type: eventType,
    timestamp: observation.timestamp,
    sequence: observation.sequence,
    adapter_version: OPENCODE_ADAPTER_VERSION,
    payloads: {
      prompt: observation.prompt ?? "",
      tool_input: observation.tool_input ?? observation.retrieval_context ?? "",
      tool_output: observation.tool_output ?? observation.decision ?? "",
    },
  });
  const policy = evaluatePolicy({
    request_id: redacted.event_id,
    pai_session_id: redacted.pai_session_id,
    harness: "opencode",
    event_type: redacted.event_type,
    action_type: opencodePolicyActionType(observation.event),
    cwd: observation.cwd,
    project_id: observation.project_id,
    adapter_capabilities: OPENCODE_CAPABILITIES,
    sensitivity: redacted.sensitivity,
    redaction_status: redacted.redaction_status,
  });

  return {
    ...redacted,
    cwd: observation.cwd,
    project_id: observation.project_id,
    capabilities: OPENCODE_CAPABILITIES,
    policy_decision_id: policy.policy_decision_id,
  };
}

export function buildOpenCodeDirectLaunchEvent(
  resolution: OpenCodeSessionResolution,
  timestamp = new Date().toISOString(),
): EventIngestInput {
  return mapOpenCodePluginObservationToEvent({
    event: "SessionStart",
    pai_session_id: resolution.pai_session_id,
    sequence: 1,
    timestamp,
    prompt: resolution.managed_event,
  });
}

export function opencodeTracerRuntimeTemplatePath(runtimeHome?: string) {
  return `${buildRuntimePaths(runtimeHome).home}/adapters/opencode/tracer.ts`;
}

function opencodeEventType(observation: OpenCodePluginObservation) {
  if (observation.prompt === "session.created_by_native_adapter") return "session.created_by_native_adapter";
  if (observation.prompt === "session.attached_to_opencode_plugin") return "session.attached_to_opencode_plugin";
  switch (observation.event) {
    case "SessionStart":
      return "session.start";
    case "UserPromptSubmit":
      return "prompt.submit";
    case "ToolCall":
      return "tool.call";
    case "PolicyDecision":
      return "policy.degraded";
    case "Retrieval":
      return "memory.retrieval";
    case "Stop":
      return "session.stop";
  }
}

function opencodePolicyActionType(event: OpenCodePluginEvent): PolicyActionType {
  switch (event) {
    case "UserPromptSubmit":
      return "prompt";
    case "ToolCall":
    case "PolicyDecision":
      return "tool_call";
    case "Retrieval":
      return "tool_call";
    case "Stop":
      return "final_response";
    case "SessionStart":
      return "adapter_start";
  }
}

function owns(responsibility: OpenCodeResponsibility): OpenCodeResponsibilityOwner {
  return OPENCODE_PLUGIN_RESPONSIBILITIES.find((entry) => entry.responsibility === responsibility)!.owner;
}

function countMatching(plugins: string[], needles: string[]) {
  return plugins.filter((plugin) => needles.some((needle) => plugin.includes(needle))).length;
}

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
