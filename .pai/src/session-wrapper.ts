import { randomUUID } from "node:crypto";
import { CanonicalEventStore, type EventIngestResult } from "./event-store";
import { buildRuntimePaths } from "./runtime-paths";
import { evaluatePolicy, type AdapterCapabilities } from "./policy";
import { prepareEventForDestination, type RedactedPaiEvent } from "./redaction";
import type { AdapterName } from "./config";

export const PAI_RUN_TARGETS = ["claude", "codex", "opencode", "pi"] as const;
export const PAI_RUN_SHARED_MEMORY_WRITERS = ["opencode", "pi"] as const;

export type PaiRunTarget = (typeof PAI_RUN_TARGETS)[number];

export type PaiRunPlanOptions = {
  target: PaiRunTarget;
  args?: string[];
  cwd?: string;
  runtimeHome?: string;
  projectId?: string;
  sessionId?: string;
  now?: string;
  baseEnv?: Record<string, string | undefined>;
};

export type PaiRunLaunchPlan = {
  command: string;
  args: string[];
  env: Record<string, string>;
};

export type DegradedCapabilityReport = {
  missing_capability: keyof AdapterCapabilities;
  reason: string;
};

export type PaiRunPlan = {
  pai_session_id: string;
  target: PaiRunTarget;
  cwd?: string;
  runtime_home: string;
  project_id?: string;
  adapter_version: string;
  capabilities: AdapterCapabilities;
  shared_memory_writer_enabled: boolean;
  disabled_reason?: string;
  launch: PaiRunLaunchPlan;
  lifecycle_events: Array<"session.start" | "session.launch" | "session.stop">;
  degraded_capability_events: DegradedCapabilityReport[];
  dry_run_default: true;
};

export type PaiRunLifecycleStore = {
  ingest(input: Parameters<CanonicalEventStore["ingest"]>[0]): EventIngestResult;
};

const ADAPTER_VERSION = "pai-run/0.1.0";

const TARGET_COMMANDS: Record<PaiRunTarget, string> = {
  claude: "claude",
  codex: "codex",
  opencode: "opencode",
  pi: "pi",
};

const TARGET_CAPABILITIES: Record<PaiRunTarget, AdapterCapabilities> = {
  claude: allCapabilities(true),
  codex: {
    ...allCapabilities(true),
    can_inject_context: false,
    can_attach_native_session_id: false,
  },
  opencode: allCapabilities(true),
  pi: {
    ...allCapabilities(true),
    can_observe_tool_output: false,
    can_observe_final_response: false,
    can_attach_native_session_id: false,
  },
};

export const TARGET_SHARED_MEMORY_STATUS: Record<PaiRunTarget, { enabled: boolean; reason?: string }> = {
  claude: { enabled: false, reason: "Claude is a historical adapter and not an active shared-memory writer." },
  codex: { enabled: false, reason: "Codex is a historical adapter and not an active shared-memory writer." },
  opencode: { enabled: true },
  pi: { enabled: true },
};

export function createPaiSessionId(seed = randomUUID()) {
  return `pai_${seed.replace(/[^a-zA-Z0-9]/g, "")}`;
}

export function buildPaiRunPlan(options: PaiRunPlanOptions): PaiRunPlan {
  const runtimeHome = buildRuntimePaths(options.runtimeHome).home;
  const paiSessionId = options.sessionId ?? createPaiSessionId();
  const target = options.target;
  const capabilities = TARGET_CAPABILITIES[target];
  const sharedMemoryStatus = TARGET_SHARED_MEMORY_STATUS[target];
  const env = withSessionEnv(options.baseEnv ?? process.env, {
    paiSessionId,
    runtimeHome,
    target,
    projectId: options.projectId,
  });

  return {
    pai_session_id: paiSessionId,
    target,
    cwd: options.cwd,
    runtime_home: runtimeHome,
    project_id: options.projectId,
    adapter_version: ADAPTER_VERSION,
    capabilities,
    shared_memory_writer_enabled: sharedMemoryStatus.enabled,
    disabled_reason: sharedMemoryStatus.reason,
    launch: {
      command: TARGET_COMMANDS[target],
      args: [...(options.args ?? [])],
      env,
    },
    lifecycle_events: sharedMemoryStatus.enabled ? ["session.start", "session.launch", "session.stop"] : [],
    degraded_capability_events: degradedCapabilities(capabilities),
    dry_run_default: true,
  };
}

export function recordPaiRunLifecycle(plan: PaiRunPlan, store: PaiRunLifecycleStore = new CanonicalEventStore({ runtimeHome: plan.runtime_home })) {
  const events = buildLifecycleEvents(plan);
  return events.map((event) => store.ingest(event));
}

export function buildLifecycleEvents(plan: PaiRunPlan) {
  if (!plan.shared_memory_writer_enabled) return [];

  const timestamp = new Date().toISOString();
  let sequence = 1;
  const events = [
    lifecycleEvent(plan, "session.start", sequence++, timestamp),
    lifecycleEvent(plan, "session.launch", sequence++, timestamp),
  ];

  for (const degraded of plan.degraded_capability_events) {
    events.push(lifecycleEvent(plan, "session.degraded_capability", sequence++, timestamp, degraded));
  }

  events.push(lifecycleEvent(plan, "session.stop", sequence++, timestamp));
  return events;
}

function lifecycleEvent(
  plan: PaiRunPlan,
  eventType: string,
  sequence: number,
  timestamp: string,
  degraded?: DegradedCapabilityReport,
) {
  const eventId = degraded
    ? `${plan.pai_session_id}:${eventType}:${degraded.missing_capability}`
    : `${plan.pai_session_id}:${eventType}`;
  const redacted = prepareEventForDestination("sqlite", {
    event_id: eventId,
    pai_session_id: plan.pai_session_id,
    harness: plan.target,
    event_type: eventType,
    timestamp,
    sequence,
    adapter_version: plan.adapter_version,
    payloads: {
      tool_input: degraded ? `${degraded.missing_capability}: ${degraded.reason}` : `${plan.target} ${eventType}`,
    },
  });
  const policy = evaluatePolicy({
    request_id: `${eventId}:policy`,
    pai_session_id: plan.pai_session_id,
    harness: plan.target as AdapterName,
    event_type: eventType,
    action_type: "adapter_start",
    cwd: plan.cwd,
    project_id: plan.project_id,
    subject: { summary: redacted.payload_summary || eventType, labels: redacted.taint_labels },
    adapter_capabilities: plan.capabilities,
    sensitivity: redacted.sensitivity,
    redaction_status: redacted.redaction_status,
  });

  return {
    ...redacted,
    cwd: plan.cwd,
    project_id: plan.project_id,
    capabilities: plan.capabilities,
    policy_decision_id: policy.policy_decision_id,
  } satisfies RedactedPaiEvent & Parameters<CanonicalEventStore["ingest"]>[0];
}

function withSessionEnv(
  baseEnv: Record<string, string | undefined>,
  session: { paiSessionId: string; runtimeHome: string; target: PaiRunTarget; projectId?: string },
) {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(baseEnv)) {
    if (typeof value === "string") env[key] = value;
  }

  env.PAI_SESSION_ID = session.paiSessionId;
  env.PAI_RUNTIME_HOME = session.runtimeHome;
  env.PAI_HARNESS = session.target;
  env.PAI_TARGET_CLI = session.target;
  if (session.projectId) env.PAI_PROJECT_ID = session.projectId;
  return env;
}

function degradedCapabilities(capabilities: AdapterCapabilities) {
  return Object.entries(capabilities)
    .filter(([, enabled]) => !enabled)
    .map(([missing_capability]) => ({
      missing_capability: missing_capability as keyof AdapterCapabilities,
      reason: `Adapter does not support ${missing_capability}.`,
    }));
}

function allCapabilities(value: boolean): AdapterCapabilities {
  return {
    can_inject_context: value,
    can_block_tool: value,
    can_request_confirmation: value,
    can_observe_tool_input: value,
    can_observe_tool_output: value,
    can_observe_final_response: value,
    can_set_environment: value,
    can_attach_native_session_id: value,
  };
}
