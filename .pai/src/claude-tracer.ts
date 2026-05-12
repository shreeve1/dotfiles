import { createPaiSessionId } from "./session-wrapper";
import { buildRuntimePaths } from "./runtime-paths";
import { evaluatePolicy, type AdapterCapabilities, type PolicyActionType } from "./policy";
import { prepareEventForDestination } from "./redaction";
import { renderInstallPlanFixture, validateInstallPlan, type InstallPlan } from "./installer-contract";
import type { EventIngestInput } from "./event-store";

export const CLAUDE_HOOK_EVENTS = [
  "SessionStart",
  "UserPromptSubmit",
  "PreToolUse",
  "PostToolUse",
  "Stop",
  "SessionEnd",
] as const;

export type ClaudeHookEvent = (typeof CLAUDE_HOOK_EVENTS)[number];

export type ClaudeHookCommand = {
  event: ClaudeHookEvent;
  matcher?: string;
  command: string;
};

export type ClaudeSettingsLike = {
  hooks?: Record<string, Array<{ matcher?: string; hooks?: Array<{ type?: string; command?: string }> }>>;
};

export type ClaudeSessionResolutionInput = {
  env?: Record<string, string | undefined>;
  seed?: Parameters<typeof createPaiSessionId>[0];
};

export type ClaudeSessionResolution = {
  pai_session_id: string;
  source: "pai_run" | "native_adapter";
  managed_event: "session.attached_to_pai_run" | "session.created_by_native_adapter";
};

export type ClaudeHookObservation = {
  hook_event: ClaudeHookEvent;
  matcher?: string;
  command?: string;
  pai_session_id: string;
  sequence: number;
  timestamp: string;
  adapter_version?: string;
  cwd?: string;
  project_id?: string;
  payload_summary?: string;
};

export type ClaudeTracerTemplate = {
  install_plan: InstallPlan;
  install_plan_valid: boolean;
  hook_templates: ClaudeHookCommand[];
  live_config_mutation_allowed: false;
};

const CLAUDE_ADAPTER_VERSION = "claude-tracer/0.1.0";

const CLAUDE_CAPABILITIES: AdapterCapabilities = {
  can_inject_context: true,
  can_block_tool: true,
  can_request_confirmation: true,
  can_observe_tool_input: true,
  can_observe_tool_output: true,
  can_observe_final_response: true,
  can_set_environment: true,
  can_attach_native_session_id: true,
};

export const CLAUDE_STOP_DISTILL_COMMAND =
  "( pai-memory distill --quiet & disown ) >/dev/null 2>&1";

const DEFAULT_TEMPLATE_HOOKS: ClaudeHookCommand[] = [
  { event: "SessionStart", command: "bun ~/.pai/adapters/claude/tracer.ts --event SessionStart" },
  { event: "UserPromptSubmit", command: "bun ~/.pai/adapters/claude/tracer.ts --event UserPromptSubmit" },
  { event: "PreToolUse", matcher: "*", command: "bun ~/.pai/adapters/claude/tracer.ts --event PreToolUse --matcher '*'" },
  { event: "PostToolUse", matcher: "*", command: "bun ~/.pai/adapters/claude/tracer.ts --event PostToolUse --matcher '*'" },
  { event: "Stop", command: "bun ~/.pai/adapters/claude/tracer.ts --event Stop" },
  { event: "Stop", command: CLAUDE_STOP_DISTILL_COMMAND },
];

export function resolveClaudePaiSession(input: ClaudeSessionResolutionInput = {}): ClaudeSessionResolution {
  const existing = input.env?.PAI_SESSION_ID;
  if (existing) {
    return {
      pai_session_id: existing,
      source: "pai_run",
      managed_event: "session.attached_to_pai_run",
    };
  }

  return {
    pai_session_id: createPaiSessionId(input.seed),
    source: "native_adapter",
    managed_event: "session.created_by_native_adapter",
  };
}

export function extractActiveClaudeHooks(settings: ClaudeSettingsLike): ClaudeHookCommand[] {
  const hooks = settings.hooks ?? {};
  const commands: ClaudeHookCommand[] = [];

  for (const [event, groups] of Object.entries(hooks)) {
    if (!isClaudeHookEvent(event)) continue;
    for (const group of groups ?? []) {
      for (const hook of group.hooks ?? []) {
        if (hook.type === "command" && hook.command) {
          commands.push({ event, matcher: group.matcher, command: hook.command });
        }
      }
    }
  }

  return commands;
}

export function buildClaudeTracerTemplate(activeSettings: ClaudeSettingsLike = {}): ClaudeTracerTemplate {
  const installPlan = renderInstallPlanFixture("claude");
  const activeHooks = extractActiveClaudeHooks(activeSettings);

  return {
    install_plan: installPlan,
    install_plan_valid: validateInstallPlan(installPlan).valid,
    hook_templates: [...activeHooks, ...DEFAULT_TEMPLATE_HOOKS],
    live_config_mutation_allowed: false,
  };
}

export function mapClaudeHookObservationToEvent(observation: ClaudeHookObservation): EventIngestInput {
  const eventType = claudeEventType(observation);
  const redacted = prepareEventForDestination("sqlite", {
    event_id: `${observation.pai_session_id}:${eventType}:${observation.sequence}`,
    pai_session_id: observation.pai_session_id,
    harness: "claude",
    event_type: eventType,
    timestamp: observation.timestamp,
    sequence: observation.sequence,
    adapter_version: observation.adapter_version ?? CLAUDE_ADAPTER_VERSION,
    payloads: {
      tool_input: observation.payload_summary ?? `${observation.hook_event} ${observation.matcher ?? ""}`.trim(),
      command: observation.command ?? "",
    },
  });
  const policy = evaluatePolicy({
    request_id: `${redacted.event_id}:policy`,
    pai_session_id: observation.pai_session_id,
    harness: "claude",
    event_type: eventType,
    action_type: claudePolicyActionType(eventType),
    cwd: observation.cwd,
    project_id: observation.project_id,
    subject: { summary: redacted.payload_summary || eventType, labels: redacted.taint_labels },
    adapter_capabilities: CLAUDE_CAPABILITIES,
    sensitivity: redacted.sensitivity,
    redaction_status: redacted.redaction_status,
  });

  return {
    ...redacted,
    cwd: observation.cwd,
    project_id: observation.project_id,
    capabilities: CLAUDE_CAPABILITIES,
    policy_decision_id: policy.policy_decision_id,
  };
}

export function buildClaudeDirectLaunchEvent(resolution: ClaudeSessionResolution, timestamp: string): EventIngestInput {
  return mapClaudeHookObservationToEvent({
    hook_event: "SessionStart",
    pai_session_id: resolution.pai_session_id,
    sequence: 1,
    timestamp,
    payload_summary: resolution.managed_event,
  });
}

export function claudeTracerRuntimeTemplatePath(runtimeHome?: string) {
  return `${buildRuntimePaths(runtimeHome).home}/adapters/claude/tracer.ts`;
}

function claudeEventType(observation: ClaudeHookObservation) {
  switch (observation.hook_event) {
    case "SessionStart":
      return observation.payload_summary === "session.created_by_native_adapter"
        ? "session.created_by_native_adapter"
        : "session.start";
    case "UserPromptSubmit":
      return "prompt.submit";
    case "PreToolUse":
      return "policy.pre_tool_use";
    case "PostToolUse":
      return "tool.post_use";
    case "Stop":
    case "SessionEnd":
      return "session.stop";
  }
}

function claudePolicyActionType(eventType: string): PolicyActionType {
  if (eventType.startsWith("prompt")) return "prompt";
  if (eventType.startsWith("policy")) return "tool_call";
  if (eventType.startsWith("tool")) return "tool_call";
  if (eventType === "session.stop") return "final_response";
  return "adapter_start";
}

function isClaudeHookEvent(event: string): event is ClaudeHookEvent {
  return (CLAUDE_HOOK_EVENTS as readonly string[]).includes(event);
}
