import { buildRuntimePaths } from "./runtime-paths";
import { buildPaiRunPlan, buildLifecycleEvents, type PaiRunPlan, type PaiRunPlanOptions } from "./session-wrapper";
import { evaluatePolicy, type AdapterCapabilities, type PolicyActionType } from "./policy";
import { prepareEventForDestination } from "./redaction";
import { renderInstallPlanFixture, validateInstallPlan, type InstallPlan } from "./installer-contract";
import type { EventIngestInput } from "./event-store";

export const PI_WRAPPER_LIFECYCLE_EVENTS = [
  "session.start",
  "session.launch",
  "session.degraded_capability",
  "session.stop",
] as const;

export const PI_DEFERRED_EXTENSION_POINTS = [
  "deep_pi_typescript_extension",
  "tool_output_observation",
  "final_response_observation",
  "native_session_id_attachment",
] as const;

export const PI_FORBIDDEN_AUTH_PATHS = [
  ".pi/agent/auth.json",
  "~/.pi/agent/auth.json",
] as const;

export type PiWrapperLifecycleEvent = (typeof PI_WRAPPER_LIFECYCLE_EVENTS)[number];
export type PiDeferredExtensionPoint = (typeof PI_DEFERRED_EXTENSION_POINTS)[number];

export const PI_ADAPTER_VERSION = "pi-tracer/0.1.0";

export const PI_CAPABILITIES: AdapterCapabilities = {
  can_inject_context: true,
  can_block_tool: true,
  can_request_confirmation: true,
  can_observe_tool_input: true,
  can_observe_tool_output: false,
  can_observe_final_response: false,
  can_set_environment: true,
  can_attach_native_session_id: false,
};

export type PiWrapperObservationEvent = "WrapperStart" | "WrapperStop" | "WrapperExit" | "DegradedCapability";

export type PiWrapperObservation = {
  event: PiWrapperObservationEvent;
  pai_session_id: string;
  sequence: number;
  timestamp: string;
  cwd?: string;
  project_id?: string;
  exit_code?: number;
  missing_capability?: keyof AdapterCapabilities;
  reason?: string;
};

export type PiWrapperTracerTemplate = {
  install_plan: InstallPlan;
  install_plan_valid: boolean;
  wrapper_lifecycle_events: typeof PI_WRAPPER_LIFECYCLE_EVENTS;
  deferred_extension_points: typeof PI_DEFERRED_EXTENSION_POINTS;
  forbidden_auth_paths: typeof PI_FORBIDDEN_AUTH_PATHS;
  hook_templates: never[];
  live_config_mutation_allowed: false;
  auth_file_access_allowed: false;
  deep_extension_allowed: false;
};

export type PiAuthAccessAssertion = {
  ok: boolean;
  violations: Array<{ path: string; matched: string }>;
};

export type PiWrapperRunPlanOptions = Omit<PaiRunPlanOptions, "target">;

export function buildPiWrapperTracerTemplate(): PiWrapperTracerTemplate {
  const installPlan = renderInstallPlanFixture("pi");
  return {
    install_plan: installPlan,
    install_plan_valid: validateInstallPlan(installPlan).valid,
    wrapper_lifecycle_events: PI_WRAPPER_LIFECYCLE_EVENTS,
    deferred_extension_points: PI_DEFERRED_EXTENSION_POINTS,
    forbidden_auth_paths: PI_FORBIDDEN_AUTH_PATHS,
    hook_templates: [],
    live_config_mutation_allowed: false,
    auth_file_access_allowed: false,
    deep_extension_allowed: false,
  };
}

export function buildPiWrapperRunPlan(options: PiWrapperRunPlanOptions = {}): PaiRunPlan {
  return buildPaiRunPlan({ ...options, target: "pi" });
}

export function buildPiWrapperLifecycleEvents(plan: PaiRunPlan) {
  if (plan.target !== "pi") {
    throw new Error(`buildPiWrapperLifecycleEvents requires target=pi, got ${plan.target}.`);
  }
  return buildLifecycleEvents(plan);
}

export function mapPiWrapperObservationToEvent(observation: PiWrapperObservation): EventIngestInput {
  const eventType = piEventType(observation);
  const redacted = prepareEventForDestination("sqlite", {
    event_id: `${observation.pai_session_id}:${eventType}:${observation.sequence}`,
    pai_session_id: observation.pai_session_id,
    harness: "pi",
    event_type: eventType,
    timestamp: observation.timestamp,
    sequence: observation.sequence,
    adapter_version: PI_ADAPTER_VERSION,
    payloads: {
      tool_input: piPayloadSummary(observation),
    },
  });
  const policy = evaluatePolicy({
    request_id: `${redacted.event_id}:policy`,
    pai_session_id: redacted.pai_session_id,
    harness: "pi",
    event_type: redacted.event_type,
    action_type: piPolicyActionType(observation.event),
    cwd: observation.cwd,
    project_id: observation.project_id,
    subject: { summary: redacted.payload_summary || eventType, labels: redacted.taint_labels },
    adapter_capabilities: PI_CAPABILITIES,
    sensitivity: redacted.sensitivity,
    redaction_status: redacted.redaction_status,
  });

  return {
    ...redacted,
    cwd: observation.cwd,
    project_id: observation.project_id,
    capabilities: PI_CAPABILITIES,
    policy_decision_id: policy.policy_decision_id,
  };
}

export function buildPiDegradedCapabilityEvent(
  paiSessionId: string,
  missingCapability: keyof AdapterCapabilities,
  options: { sequence?: number; timestamp?: string; reason?: string; cwd?: string; project_id?: string } = {},
): EventIngestInput {
  return mapPiWrapperObservationToEvent({
    event: "DegradedCapability",
    pai_session_id: paiSessionId,
    sequence: options.sequence ?? 1,
    timestamp: options.timestamp ?? new Date().toISOString(),
    cwd: options.cwd,
    project_id: options.project_id,
    missing_capability: missingCapability,
    reason: options.reason ?? `Pi wrapper cannot enforce ${missingCapability}.`,
  });
}

export function assertNoPiAuthFileAccess(paths: ReadonlyArray<string>): PiAuthAccessAssertion {
  const violations: PiAuthAccessAssertion["violations"] = [];
  for (const candidate of paths) {
    for (const forbidden of PI_FORBIDDEN_AUTH_PATHS) {
      if (candidate.includes(forbidden)) {
        violations.push({ path: candidate, matched: forbidden });
      }
    }
  }
  return { ok: violations.length === 0, violations };
}

export function piTracerRuntimeTemplatePath(runtimeHome?: string) {
  return `${buildRuntimePaths(runtimeHome).home}/adapters/pi/tracer.ts`;
}

function piEventType(observation: PiWrapperObservation): string {
  switch (observation.event) {
    case "WrapperStart":
      return "session.start";
    case "WrapperStop":
      return "session.stop";
    case "WrapperExit":
      return observation.exit_code === 0 ? "session.stop" : "session.degraded_capability";
    case "DegradedCapability":
      return "session.degraded_capability";
  }
}

function piPolicyActionType(event: PiWrapperObservationEvent): PolicyActionType {
  switch (event) {
    case "WrapperStart":
      return "adapter_start";
    case "WrapperStop":
    case "WrapperExit":
      return "final_response";
    case "DegradedCapability":
      return "tool_call";
  }
}

function piPayloadSummary(observation: PiWrapperObservation): string {
  if (observation.event === "DegradedCapability") {
    return `${observation.missing_capability ?? "unknown_capability"}: ${observation.reason ?? "no reason"}`;
  }
  if (observation.event === "WrapperExit") {
    return `pi wrapper exit code=${observation.exit_code ?? "unknown"}`;
  }
  return `pi wrapper ${observation.event.toLowerCase()}`;
}
