import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CanonicalEventStore } from "../src/event-store";
import { buildLifecycleEvents, buildPaiRunPlan, createPaiSessionId, recordPaiRunLifecycle } from "../src/session-wrapper";

let runtimeHome: string | undefined;

afterEach(() => {
  if (runtimeHome) rmSync(runtimeHome, { recursive: true, force: true });
  runtimeHome = undefined;
});

describe("pai-run session wrapper", () => {
  test("creates canonical session IDs before launch", () => {
    expect(createPaiSessionId("123e4567-e89b-12d3-a456-426614174000")).toBe("pai_123e4567e89b12d3a456426614174000");
  });

  test("preserves native command and args while adding session environment", () => {
    const plan = buildPaiRunPlan({
      target: "opencode",
      args: ["run", "task"],
      cwd: "/workspace/project",
      runtimeHome: "/tmp/pai-runtime",
      projectId: "git:abc123",
      sessionId: "pai_test_session",
      baseEnv: { PATH: "/usr/bin", EMPTY: undefined },
    });

    expect(plan.launch.command).toBe("opencode");
    expect(plan.launch.args).toEqual(["run", "task"]);
    expect(plan.launch.env.PATH).toBe("/usr/bin");
    expect(plan.launch.env.EMPTY).toBeUndefined();
    expect(plan.launch.env.PAI_SESSION_ID).toBe("pai_test_session");
    expect(plan.launch.env.PAI_RUNTIME_HOME).toBe("/tmp/pai-runtime");
    expect(plan.launch.env.PAI_HARNESS).toBe("opencode");
    expect(plan.launch.env.PAI_TARGET_CLI).toBe("opencode");
    expect(plan.launch.env.PAI_PROJECT_ID).toBe("git:abc123");
    expect(plan.dry_run_default).toBe(true);
  });

  test("reports degraded capabilities explicitly", () => {
    const plan = buildPaiRunPlan({ target: "pi", sessionId: "pai_pi", baseEnv: {} });
    const missing = plan.degraded_capability_events.map((event) => event.missing_capability);

    expect(missing).toContain("can_observe_tool_output");
    expect(missing).toContain("can_observe_final_response");
    expect(missing).toContain("can_attach_native_session_id");
  });

  test("builds lifecycle events without invoking live CLIs", () => {
    const plan = buildPaiRunPlan({ target: "codex", sessionId: "pai_codex", baseEnv: {} });
    const events = buildLifecycleEvents(plan);

    expect(events[0].event_type).toBe("session.start");
    expect(events[1].event_type).toBe("session.launch");
    expect(events.at(-1)?.event_type).toBe("session.stop");
    expect(events.some((event) => event.event_type === "session.degraded_capability")).toBe(true);
    expect(events.every((event) => !("payloads" in event))).toBe(true);
  });

  test("CLI defaults to dry-run launch planning", () => {
    const result = Bun.spawnSync([process.execPath, "src/cli/pai-run.ts", "codex", "--help"], {
      cwd: import.meta.dir.replace(/\/tests$/, ""),
      stdout: "pipe",
      stderr: "pipe",
    });
    const output = JSON.parse(new TextDecoder().decode(result.stdout));

    expect(result.exitCode).toBe(0);
    expect(output.mode).toBe("dry-run");
    expect(output.plan.launch.command).toBe("codex");
    expect(output.plan.launch.args).toEqual(["--help"]);
  });

  test("records start, launch, stop, and degraded capability events", () => {
    runtimeHome = mkdtempSync(join(tmpdir(), "pai-run-"));
    const store = new CanonicalEventStore({ runtimeHome });
    const plan = buildPaiRunPlan({ target: "pi", runtimeHome, sessionId: "pai_record", baseEnv: {} });

    try {
      const results = recordPaiRunLifecycle(plan, store);
      const stored = store.listEvents();

      expect(results.every((result) => result.status === "accepted")).toBe(true);
      expect(stored.map((event) => event.event_type)).toEqual([
        "session.start",
        "session.launch",
        "session.degraded_capability",
        "session.degraded_capability",
        "session.degraded_capability",
        "session.stop",
      ]);
      expect(stored.every((event) => event.pai_session_id === "pai_record")).toBe(true);
      expect(stored.every((event) => event.harness === "pi")).toBe(true);
      expect(stored.every((event) => !("payload" in event))).toBe(true);
    } finally {
      store.close();
    }
  });
});
