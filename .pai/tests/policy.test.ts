import { describe, expect, test } from "bun:test";
import {
  ADAPTER_CAPABILITY_KEYS,
  POLICY_ACTIONS,
  POLICY_CONTRACT_SCHEMAS,
  evaluatePolicy,
  type AdapterCapabilities,
  type PolicyRequest,
} from "../src/policy";

const allCapabilities: AdapterCapabilities = {
  can_inject_context: true,
  can_block_tool: true,
  can_request_confirmation: true,
  can_observe_tool_input: true,
  can_observe_tool_output: true,
  can_observe_final_response: true,
  can_set_environment: true,
  can_attach_native_session_id: true,
};

function request(overrides: Partial<PolicyRequest>): PolicyRequest {
  return {
    request_id: "req-1",
    pai_session_id: "session-1",
    harness: "opencode",
    event_type: "tool.call",
    action_type: "tool_call",
    adapter_capabilities: allCapabilities,
    sensitivity: "public",
    redaction_status: "clean",
    ...overrides,
  };
}

describe("policy contract", () => {
  test("documents canonical schemas and policy actions", () => {
    expect(POLICY_ACTIONS).toEqual(["allow", "deny", "confirm", "warn", "redact", "degrade"]);
    expect(POLICY_CONTRACT_SCHEMAS.PolicyRequest.required).toContain("adapter_capabilities");
    expect(POLICY_CONTRACT_SCHEMAS.PolicyResponse.required).toContain("audit_event_required");
    expect(POLICY_CONTRACT_SCHEMAS.AdapterCapabilities.required).toEqual(ADAPTER_CAPABILITY_KEYS);
  });

  test("covers Claude destructive fixture with confirmation", () => {
    const response = evaluatePolicy(request({
      harness: "claude",
      event_type: "destructive.command",
      action_type: "command",
    }));

    expect(response.action).toBe("confirm");
    expect(response.required_capability).toBe("can_request_confirmation");
    expect(response.audit_event_required).toBe(true);
  });

  test("covers Codex security fixture with explicit degraded event", () => {
    const response = evaluatePolicy(request({
      harness: "codex",
      event_type: "security.tool_call",
      sensitivity: "secret",
      adapter_capabilities: {
        ...allCapabilities,
        can_block_tool: false,
        can_request_confirmation: false,
      },
    }));

    expect(response.action).toBe("degrade");
    expect(response.severity).toBe("critical");
    expect(response.required_capability).toBe("can_block_tool");
    expect(response.degraded_event).toEqual({
      event_type: "policy.degraded",
      request_id: "req-1",
      harness: "codex",
      missing_capability: "can_block_tool",
      reason: "Security-sensitive policy cannot be enforced by this adapter.",
    });
  });

  test("covers OpenCode memory fixture with fail-open degraded behavior", () => {
    const response = evaluatePolicy(request({
      harness: "opencode",
      event_type: "memory.write",
      action_type: "tool_call",
      adapter_capabilities: {
        ...allCapabilities,
        can_observe_tool_output: false,
      },
    }));

    expect(response.action).toBe("degrade");
    expect(response.severity).toBe("warning");
    expect(response.required_capability).toBe("can_observe_tool_output");
    expect(response.degraded_event?.harness).toBe("opencode");
  });

  test("covers Pi injection fixture with fail-open degraded behavior", () => {
    const response = evaluatePolicy(request({
      harness: "pi",
      event_type: "context.inject",
      action_type: "prompt",
      adapter_capabilities: {
        ...allCapabilities,
        can_inject_context: false,
      },
    }));

    expect(response.action).toBe("degrade");
    expect(response.severity).toBe("warning");
    expect(response.required_capability).toBe("can_inject_context");
    expect(response.degraded_event?.harness).toBe("pi");
  });

  test("returns warn and redact policy actions for non-blocking cases", () => {
    const warn = evaluatePolicy(request({
      action_type: "final_response",
      adapter_capabilities: {
        ...allCapabilities,
        can_observe_final_response: false,
      },
    }));
    const redact = evaluatePolicy(request({ redaction_status: "redacted" }));

    expect(warn.action).toBe("warn");
    expect(redact.action).toBe("redact");
  });
});
