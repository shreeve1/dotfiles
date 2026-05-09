import { createHash } from "node:crypto";
import { buildRuntimePaths } from "./runtime-paths";
import { createPaiSessionId } from "./session-wrapper";
import { evaluatePolicy, type AdapterCapabilities, type PolicyActionType } from "./policy";
import { prepareEventForDestination } from "./redaction";
import { renderInstallPlanFixture, validateInstallPlan, type InstallPlan } from "./installer-contract";
import type { EventIngestInput } from "./event-store";

export const CODEX_HOOK_EVENTS = [
  "SessionStart",
  "UserPromptSubmit",
  "PreToolUse",
  "PostToolUse",
  "Stop",
  "SessionEnd",
  "LoadContext",
  "WorkSync",
] as const;

export type CodexHookEvent = (typeof CODEX_HOOK_EVENTS)[number];

export type CodexHookTemplate = {
  event: CodexHookEvent;
  command: string;
  legacy_compatible: true;
};

export type CodexSessionResolutionInput = {
  env?: Record<string, string | undefined>;
  codexSessionId?: string;
  seed?: Parameters<typeof createPaiSessionId>[0];
};

export type CodexSessionResolution = {
  pai_session_id: string;
  source: "pai_run" | "codex_hook" | "native_adapter";
  managed_event: "session.attached_to_pai_run" | "session.attached_to_codex_hook" | "session.created_by_native_adapter";
};

export type CodexHookInputContract = {
  hook_event_name?: string;
  session_id?: string;
  turn_id?: string;
  cwd?: string;
  prompt?: string;
  tool_name?: string;
  tool_input?: unknown;
  tool_output?: unknown;
  last_assistant_message?: string;
};

export type CodexHookObservation = {
  hook_event: CodexHookEvent;
  pai_session_id: string;
  sequence: number;
  timestamp: string;
  adapter_version?: string;
  cwd?: string;
  project_id?: string;
  prompt?: string;
  tool_name?: string;
  tool_input?: string;
  tool_output?: string;
  final_response?: string;
  legacy_memory_root?: string;
};

export type CodexBridgeCompatibility = {
  legacy_memory_root: ".codex/pai/MEMORY";
  canonical_memory_root: "~/.pai/memory";
  bridge_read_required: true;
  canonical_writes_only: true;
};

export type CodexPrdCompatibility = {
  prd_first_enforcement_preserved: true;
  isa_migration_complete: false;
};

export type CodexTracerTemplate = {
  install_plan: InstallPlan;
  install_plan_valid: boolean;
  hook_templates: CodexHookTemplate[];
  bridge_compatibility: CodexBridgeCompatibility;
  prd_compatibility: CodexPrdCompatibility;
  live_config_mutation_allowed: false;
  auth_or_approval_mutation_allowed: false;
};

const CODEX_ADAPTER_VERSION = "codex-tracer/0.1.0";
const CODEX_LEGACY_MEMORY_ROOT = ".codex/pai/MEMORY" as const;

const CODEX_CAPABILITIES: AdapterCapabilities = {
  can_inject_context: false,
  can_block_tool: true,
  can_request_confirmation: false,
  can_observe_tool_input: true,
  can_observe_tool_output: true,
  can_observe_final_response: true,
  can_set_environment: true,
  can_attach_native_session_id: false,
};

const DEFAULT_HOOK_TEMPLATES: CodexHookTemplate[] = [
  { event: "SessionStart", command: "bun ~/.pai/adapters/codex/tracer.ts --event SessionStart", legacy_compatible: true },
  { event: "UserPromptSubmit", command: "bun ~/.pai/adapters/codex/tracer.ts --event UserPromptSubmit", legacy_compatible: true },
  { event: "PostToolUse", command: "bun ~/.pai/adapters/codex/tracer.ts --event PostToolUse", legacy_compatible: true },
  { event: "Stop", command: "bun ~/.pai/adapters/codex/tracer.ts --event Stop", legacy_compatible: true },
];

export function resolveCodexPaiSession(input: CodexSessionResolutionInput = {}): CodexSessionResolution {
  const existing = input.env?.PAI_SESSION_ID;
  if (existing) {
    return {
      pai_session_id: existing,
      source: "pai_run",
      managed_event: "session.attached_to_pai_run",
    };
  }

  if (input.codexSessionId) {
    return {
      pai_session_id: `pai_codex_${hash(input.codexSessionId).slice(0, 32)}`,
      source: "codex_hook",
      managed_event: "session.attached_to_codex_hook",
    };
  }

  return {
    pai_session_id: createPaiSessionId(input.seed),
    source: "native_adapter",
    managed_event: "session.created_by_native_adapter",
  };
}

export function codexBridgeCompatibility(): CodexBridgeCompatibility {
  return {
    legacy_memory_root: CODEX_LEGACY_MEMORY_ROOT,
    canonical_memory_root: "~/.pai/memory",
    bridge_read_required: true,
    canonical_writes_only: true,
  };
}

export function codexPrdCompatibility(): CodexPrdCompatibility {
  return {
    prd_first_enforcement_preserved: true,
    isa_migration_complete: false,
  };
}

export function buildCodexTracerTemplate(): CodexTracerTemplate {
  const installPlan = renderInstallPlanFixture("codex");
  return {
    install_plan: installPlan,
    install_plan_valid: validateInstallPlan(installPlan).valid,
    hook_templates: DEFAULT_HOOK_TEMPLATES,
    bridge_compatibility: codexBridgeCompatibility(),
    prd_compatibility: codexPrdCompatibility(),
    live_config_mutation_allowed: false,
    auth_or_approval_mutation_allowed: false,
  };
}

export function mapCodexHookInputToObservation(input: CodexHookInputContract, resolution: CodexSessionResolution, sequence = 1, timestamp = new Date().toISOString()): CodexHookObservation {
  const hookEventName = input.hook_event_name ?? "";
  const hookEvent = isCodexHookEvent(hookEventName) ? hookEventName : "PostToolUse";
  return {
    hook_event: hookEvent,
    pai_session_id: resolution.pai_session_id,
    sequence,
    timestamp,
    cwd: input.cwd,
    prompt: input.prompt,
    tool_name: input.tool_name,
    tool_input: stringifyPayload(input.tool_input),
    tool_output: stringifyPayload(input.tool_output),
    final_response: input.last_assistant_message,
    legacy_memory_root: CODEX_LEGACY_MEMORY_ROOT,
  };
}

export function mapCodexHookObservationToEvent(observation: CodexHookObservation): EventIngestInput {
  const eventType = codexEventType(observation);
  const redacted = prepareEventForDestination("sqlite", {
    event_id: `${observation.pai_session_id}:${eventType}:${observation.sequence}`,
    pai_session_id: observation.pai_session_id,
    harness: "codex",
    event_type: eventType,
    timestamp: observation.timestamp,
    sequence: observation.sequence,
    adapter_version: observation.adapter_version ?? CODEX_ADAPTER_VERSION,
    payloads: {
      prompt: observation.prompt ?? "",
      tool_input: observation.tool_input ?? "",
      tool_output: observation.tool_output ?? "",
      model_response: observation.final_response ?? "",
    },
  });
  const policy = evaluatePolicy({
    request_id: `${redacted.event_id}:policy`,
    pai_session_id: observation.pai_session_id,
    harness: "codex",
    event_type: eventType,
    action_type: codexPolicyActionType(eventType),
    cwd: observation.cwd,
    project_id: observation.project_id,
    subject: { summary: redacted.payload_summary || eventType, labels: redacted.taint_labels },
    adapter_capabilities: CODEX_CAPABILITIES,
    sensitivity: redacted.sensitivity,
    redaction_status: redacted.redaction_status,
  });

  return {
    ...redacted,
    cwd: observation.cwd,
    project_id: observation.project_id,
    capabilities: CODEX_CAPABILITIES,
    policy_decision_id: policy.policy_decision_id,
  };
}

export function buildCodexDirectLaunchEvent(resolution: CodexSessionResolution, timestamp: string): EventIngestInput {
  return mapCodexHookObservationToEvent({
    hook_event: "SessionStart",
    pai_session_id: resolution.pai_session_id,
    sequence: 1,
    timestamp,
    prompt: resolution.managed_event,
  });
}

export function codexTracerRuntimeTemplatePath(runtimeHome?: string) {
  return `${buildRuntimePaths(runtimeHome).home}/adapters/codex/tracer.ts`;
}

function codexEventType(observation: CodexHookObservation) {
  if (observation.prompt === "session.created_by_native_adapter") return "session.created_by_native_adapter";
  if (observation.prompt === "session.attached_to_codex_hook") return "session.attached_to_codex_hook";
  switch (observation.hook_event) {
    case "SessionStart":
    case "LoadContext":
      return "session.start";
    case "UserPromptSubmit":
      return "prompt.submit";
    case "PreToolUse":
      return "policy.pre_tool_use";
    case "PostToolUse":
    case "WorkSync":
      return "tool.post_use";
    case "Stop":
    case "SessionEnd":
      return "session.stop";
  }
}

function codexPolicyActionType(eventType: string): PolicyActionType {
  if (eventType.startsWith("prompt")) return "prompt";
  if (eventType.startsWith("policy")) return "tool_call";
  if (eventType.startsWith("tool")) return "tool_call";
  if (eventType === "session.stop") return "final_response";
  return "adapter_start";
}

function stringifyPayload(value: unknown) {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function isCodexHookEvent(event: string): event is CodexHookEvent {
  return (CODEX_HOOK_EVENTS as readonly string[]).includes(event);
}
