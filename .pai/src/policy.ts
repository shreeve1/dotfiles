import type { AdapterName } from "./config";
import type { RedactionStatus, SensitivityLabel } from "./redaction";

export const POLICY_ACTIONS = ["allow", "deny", "confirm", "warn", "redact", "degrade"] as const;

export const POLICY_ACTION_TYPES = [
  "command",
  "file_read",
  "file_write",
  "tool_call",
  "prompt",
  "final_response",
  "adapter_start",
] as const;

export const POLICY_SEVERITIES = ["info", "warning", "critical"] as const;

export const ADAPTER_CAPABILITY_KEYS = [
  "can_inject_context",
  "can_block_tool",
  "can_request_confirmation",
  "can_observe_tool_input",
  "can_observe_tool_output",
  "can_observe_final_response",
  "can_set_environment",
  "can_attach_native_session_id",
] as const;

export type PolicyAction = (typeof POLICY_ACTIONS)[number];
export type PolicyActionType = (typeof POLICY_ACTION_TYPES)[number];
export type PolicySeverity = (typeof POLICY_SEVERITIES)[number];
export type AdapterCapabilityKey = (typeof ADAPTER_CAPABILITY_KEYS)[number];

export type AdapterCapabilities = Record<AdapterCapabilityKey, boolean>;

export type RedactedSubject = {
  summary: string;
  labels?: SensitivityLabel[];
};

export type PolicyRequest = {
  request_id: string;
  pai_session_id?: string;
  harness: AdapterName;
  event_type: string;
  action_type: PolicyActionType;
  cwd?: string;
  project_id?: string;
  subject?: RedactedSubject;
  adapter_capabilities: AdapterCapabilities;
  sensitivity: SensitivityLabel;
  redaction_status: RedactionStatus;
};

export type DegradedPolicyEvent = {
  event_type: "policy.degraded";
  request_id: string;
  harness: AdapterName;
  missing_capability: AdapterCapabilityKey;
  reason: string;
};

export type PolicyResponse = {
  policy_decision_id: string;
  action: PolicyAction;
  reason: string;
  severity: PolicySeverity;
  required_capability?: AdapterCapabilityKey;
  user_message?: string;
  audit_event_required: boolean;
  degraded_event?: DegradedPolicyEvent;
};

export const POLICY_CONTRACT_SCHEMAS = {
  PolicyRequest: {
    required: [
      "request_id",
      "harness",
      "event_type",
      "action_type",
      "adapter_capabilities",
      "sensitivity",
      "redaction_status",
    ],
    optional: ["pai_session_id", "cwd", "project_id", "subject"],
  },
  PolicyResponse: {
    required: ["policy_decision_id", "action", "reason", "severity", "audit_event_required"],
    optional: ["required_capability", "user_message", "degraded_event"],
  },
  AdapterCapabilities: {
    required: ADAPTER_CAPABILITY_KEYS,
    optional: [],
  },
} as const;

function decisionId(request: PolicyRequest) {
  return `policy:${request.request_id}`;
}

function degraded(request: PolicyRequest, missing: AdapterCapabilityKey, reason: string, severity: PolicySeverity): PolicyResponse {
  return {
    policy_decision_id: decisionId(request),
    action: "degrade",
    reason,
    severity,
    required_capability: missing,
    audit_event_required: true,
    degraded_event: {
      event_type: "policy.degraded",
      request_id: request.request_id,
      harness: request.harness,
      missing_capability: missing,
      reason,
    },
  };
}

function eventMentions(request: PolicyRequest, ...needles: string[]) {
  const haystack = `${request.event_type} ${request.action_type}`.toLowerCase();
  return needles.some((needle) => haystack.includes(needle));
}

export function evaluatePolicy(request: PolicyRequest): PolicyResponse {
  if (request.redaction_status === "blocked") {
    return {
      policy_decision_id: decisionId(request),
      action: request.adapter_capabilities.can_block_tool ? "deny" : "degrade",
      reason: "Blocked redaction status cannot proceed silently.",
      severity: "critical",
      required_capability: request.adapter_capabilities.can_block_tool ? undefined : "can_block_tool",
      audit_event_required: true,
      degraded_event: request.adapter_capabilities.can_block_tool
        ? undefined
        : {
            event_type: "policy.degraded",
            request_id: request.request_id,
            harness: request.harness,
            missing_capability: "can_block_tool",
            reason: "Blocked redaction status cannot proceed silently.",
          },
    };
  }

  if (eventMentions(request, "memory", "logging")) {
    if (!request.adapter_capabilities.can_observe_tool_output) {
      return degraded(request, "can_observe_tool_output", "Memory/logging capture is degraded because tool output is not observable.", "warning");
    }

    return {
      policy_decision_id: decisionId(request),
      action: "allow",
      reason: "Memory/logging event can proceed.",
      severity: "info",
      audit_event_required: false,
    };
  }

  if (eventMentions(request, "inject", "context")) {
    if (!request.adapter_capabilities.can_inject_context) {
      return degraded(request, "can_inject_context", "Context injection is degraded because the adapter cannot inject context.", "warning");
    }

    return {
      policy_decision_id: decisionId(request),
      action: "allow",
      reason: "Context injection can proceed.",
      severity: "info",
      audit_event_required: false,
    };
  }

  if (request.action_type === "final_response" && !request.adapter_capabilities.can_observe_final_response) {
    return {
      policy_decision_id: decisionId(request),
      action: "warn",
      reason: "Final response cannot be observed by this adapter.",
      severity: "warning",
      required_capability: "can_observe_final_response",
      audit_event_required: true,
    };
  }

  if (eventMentions(request, "security") || request.sensitivity === "secret") {
    if (!request.adapter_capabilities.can_block_tool && !request.adapter_capabilities.can_request_confirmation) {
      return degraded(request, "can_block_tool", "Security-sensitive policy cannot be enforced by this adapter.", "critical");
    }

    return {
      policy_decision_id: decisionId(request),
      action: request.adapter_capabilities.can_request_confirmation ? "confirm" : "deny",
      reason: "Security-sensitive policy requires an explicit enforcement path.",
      severity: "critical",
      required_capability: request.adapter_capabilities.can_request_confirmation ? "can_request_confirmation" : "can_block_tool",
      audit_event_required: true,
    };
  }

  if (eventMentions(request, "destructive") || request.action_type === "command" || request.action_type === "file_write") {
    if (request.adapter_capabilities.can_request_confirmation) {
      return {
        policy_decision_id: decisionId(request),
        action: "confirm",
        reason: "Destructive action requires confirmation.",
        severity: "critical",
        required_capability: "can_request_confirmation",
        audit_event_required: true,
      };
    }

    if (request.adapter_capabilities.can_block_tool) {
      return {
        policy_decision_id: decisionId(request),
        action: "deny",
        reason: "Destructive action is denied because confirmation is unavailable.",
        severity: "critical",
        required_capability: "can_block_tool",
        audit_event_required: true,
      };
    }

    return degraded(request, "can_block_tool", "Destructive action cannot be blocked or confirmed by this adapter.", "critical");
  }

  if (request.redaction_status === "redacted") {
    return {
      policy_decision_id: decisionId(request),
      action: "redact",
      reason: "Payload was redacted before policy evaluation.",
      severity: "warning",
      audit_event_required: true,
    };
  }

  return {
    policy_decision_id: decisionId(request),
    action: "allow",
    reason: "No policy restriction matched.",
    severity: "info",
    audit_event_required: false,
  };
}
