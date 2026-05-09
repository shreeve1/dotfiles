import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildPaiRunPlan } from "../src/session-wrapper";
import {
  PI_FORBIDDEN_AUTH_PATHS,
  PI_DEFERRED_EXTENSION_POINTS,
  assertNoPiAuthFileAccess,
  buildPiDegradedCapabilityEvent,
  buildPiWrapperLifecycleEvents,
  buildPiWrapperRunPlan,
  buildPiWrapperTracerTemplate,
  mapPiWrapperObservationToEvent,
  piTracerRuntimeTemplatePath,
} from "../src/pi-tracer";

describe("Pi wrapper tracer", () => {
  test("pai-run pi launches with canonical session env and wrapper lifecycle events", () => {
    const plan = buildPiWrapperRunPlan({
      sessionId: "pai_pi_test",
      runtimeHome: "/tmp/pai-pi-runtime",
      projectId: "git:abc123",
      baseEnv: {},
      cwd: "/tmp/work",
    });

    expect(plan.target).toBe("pi");
    expect(plan.launch.command).toBe("pi");
    expect(plan.launch.env.PAI_SESSION_ID).toBe("pai_pi_test");
    expect(plan.launch.env.PAI_HARNESS).toBe("pi");
    expect(plan.launch.env.PAI_TARGET_CLI).toBe("pi");
    expect(plan.launch.env.PAI_PROJECT_ID).toBe("git:abc123");

    const events = buildPiWrapperLifecycleEvents(plan);
    const eventTypes = events.map((event) => event.event_type);
    expect(eventTypes).toContain("session.start");
    expect(eventTypes).toContain("session.launch");
    expect(eventTypes).toContain("session.stop");
    for (const event of events) {
      expect(event.harness).toBe("pi");
      expect("payload" in event).toBe(false);
    }
  });

  test("records redacted metadata and degraded capabilities for unsupported lifecycle events", () => {
    const plan = buildPaiRunPlan({ target: "pi", sessionId: "pai_pi_caps", runtimeHome: "/tmp/pai-pi-runtime", baseEnv: {} });
    const degradedReports = [...plan.degraded_capability_events.map((entry) => entry.missing_capability)].sort();
    expect(degradedReports).toEqual((["can_attach_native_session_id", "can_observe_final_response", "can_observe_tool_output"] as const).slice().sort());

    const lifecycle = buildPiWrapperLifecycleEvents(plan);
    const degraded = lifecycle.filter((event) => event.event_type === "session.degraded_capability");
    expect(degraded.length).toBe(3);
    for (const event of degraded) {
      expect(event.harness).toBe("pi");
      expect(event.redaction_status === "clean" || event.redaction_status === "redacted").toBe(true);
      expect("payload" in event).toBe(false);
    }

    const explicit = buildPiDegradedCapabilityEvent("pai_pi_caps", "can_observe_tool_output", {
      sequence: 7,
      timestamp: "2026-05-09T00:00:00.000Z",
      reason: "Pi wrapper has no tool output stream.",
    });
    expect(explicit.event_type).toBe("session.degraded_capability");
    expect(explicit.harness).toBe("pi");
    expect(explicit.policy_decision_id).toStartWith("policy:");
    expect("payload" in explicit).toBe(false);
  });

  test("never reads .pi/agent/auth.json or any equivalent provider credential file", () => {
    const sourcePath = join(import.meta.dir, "..", "src", "pi-tracer.ts");
    const source = readFileSync(sourcePath, "utf8");

    expect(source).not.toContain("readFileSync(\".pi/agent/auth.json\"");
    expect(source).not.toContain("readFile(\".pi/agent/auth.json\"");
    expect(source).not.toContain("readFileSync(\"~/.pi/agent/auth.json\"");
    expect(source).not.toMatch(/(?:open|readFile|readFileSync|createReadStream)\([^)]*\.pi\/agent\/auth\.json/);
    expect(source).not.toMatch(/(?:glob|readdir|readdirSync)\([^)]*\.pi\/agent/);

    const template = buildPiWrapperTracerTemplate();
    expect(template.auth_file_access_allowed).toBe(false);
    for (const file of template.install_plan.files_to_change) {
      expect(file.path).not.toContain("auth.json");
      expect(file.backup_path).not.toContain("auth.json");
    }
    for (const symlink of template.install_plan.symlink_actions) {
      expect(symlink.link_path).not.toContain("auth.json");
      expect(symlink.target_path).not.toContain("auth.json");
    }
  });

  test("auth-access assertion rejects forbidden paths and accepts safe paths", () => {
    expect(assertNoPiAuthFileAccess(["/tmp/pai-runtime/events.sqlite", "src/pi-tracer.ts"]).ok).toBe(true);

    const failure = assertNoPiAuthFileAccess([
      "src/pi-tracer.ts",
      "/home/user/.pi/agent/auth.json",
    ]);
    expect(failure.ok).toBe(false);
    expect(failure.violations.map((violation) => violation.matched)).toContain(".pi/agent/auth.json");

    expect(PI_FORBIDDEN_AUTH_PATHS).toContain(".pi/agent/auth.json");
  });

  test("deeper Pi TypeScript extension is explicitly deferred until lifecycle boundaries are proven", () => {
    const template = buildPiWrapperTracerTemplate();
    expect(template.deep_extension_allowed).toBe(false);
    expect(template.hook_templates).toEqual([]);
    expect(template.deferred_extension_points).toEqual(PI_DEFERRED_EXTENSION_POINTS);
    expect(PI_DEFERRED_EXTENSION_POINTS).toContain("deep_pi_typescript_extension");
    expect(template.live_config_mutation_allowed).toBe(false);
    expect(template.install_plan.target_cli).toBe("pi");
    expect(template.install_plan_valid).toBe(true);
  });

  test("maps wrapper observations to canonical redacted envelopes", () => {
    const start = mapPiWrapperObservationToEvent({
      event: "WrapperStart",
      pai_session_id: "pai_pi",
      sequence: 1,
      timestamp: "2026-05-09T00:00:00.000Z",
      cwd: "/tmp/work",
    });
    const exit = mapPiWrapperObservationToEvent({
      event: "WrapperExit",
      pai_session_id: "pai_pi",
      sequence: 2,
      timestamp: "2026-05-09T00:00:01.000Z",
      exit_code: 1,
    });

    expect(start.event_type).toBe("session.start");
    expect(exit.event_type).toBe("session.degraded_capability");
    expect(start.harness).toBe("pi");
    expect(exit.harness).toBe("pi");
    expect("payload" in start).toBe(false);
    expect("payload" in exit).toBe(false);
  });

  test("runtime template path stays under runtime-local PAI adapter directory", () => {
    expect(piTracerRuntimeTemplatePath("/tmp/pai-runtime")).toBe("/tmp/pai-runtime/adapters/pi/tracer.ts");
  });
});
