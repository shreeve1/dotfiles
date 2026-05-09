import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CanonicalEventStore } from "../src/event-store";
import {
  buildClaudeDirectLaunchEvent,
  buildClaudeTracerTemplate,
  claudeTracerRuntimeTemplatePath,
  extractActiveClaudeHooks,
  mapClaudeHookObservationToEvent,
  resolveClaudePaiSession,
} from "../src/claude-tracer";

describe("Claude adapter tracer", () => {
  test("attaches to PAI_SESSION_ID when launched through pai-run", () => {
    const resolution = resolveClaudePaiSession({ env: { PAI_SESSION_ID: "pai_existing" } });

    expect(resolution).toEqual({
      pai_session_id: "pai_existing",
      source: "pai_run",
      managed_event: "session.attached_to_pai_run",
    });
  });

  test("creates managed native sessions for direct Claude launches", () => {
    const resolution = resolveClaudePaiSession({ env: {}, seed: "123e4567-e89b-12d3-a456-426614174000" });
    const event = buildClaudeDirectLaunchEvent(resolution, "2026-05-09T00:00:00.000Z");

    expect(resolution.pai_session_id).toBe("pai_123e4567e89b12d3a456426614174000");
    expect(resolution.source).toBe("native_adapter");
    expect(event.event_type).toBe("session.created_by_native_adapter");
    expect(event.pai_session_id).toBe(resolution.pai_session_id);
    expect("payloads" in event).toBe(false);
  });

  test("maps active Claude hook observations into canonical redacted events", () => {
    const observations = [
      { hook_event: "SessionStart", sequence: 1, payload_summary: "start" },
      { hook_event: "UserPromptSubmit", sequence: 2, payload_summary: "prompt token=not-a-real-token" },
      { hook_event: "PreToolUse", matcher: "Bash", sequence: 3, payload_summary: "policy check" },
      { hook_event: "PostToolUse", matcher: "Bash", sequence: 4, payload_summary: "tool output" },
      { hook_event: "Stop", sequence: 5, payload_summary: "stop" },
    ] as const;
    const events = observations.map((observation) => mapClaudeHookObservationToEvent({
      ...observation,
      pai_session_id: "pai_claude",
      timestamp: `2026-05-09T00:00:0${observation.sequence}.000Z`,
      cwd: "/workspace/project",
      project_id: "git:abc123",
    }));

    expect(events.map((event) => event.event_type)).toEqual([
      "session.start",
      "prompt.submit",
      "policy.pre_tool_use",
      "tool.post_use",
      "session.stop",
    ]);
    expect(events.every((event) => event.harness === "claude")).toBe(true);
    expect(events.every((event) => event.policy_decision_id?.startsWith("policy:"))).toBe(true);
    expect(JSON.stringify(events)).not.toContain("not-a-real-token");
    expect(events.every((event) => !("payloads" in event))).toBe(true);
  });

  test("preserves active hook commands in installable templates without live mutation", () => {
    const activeSettings = {
      hooks: {
        PreToolUse: [
          { matcher: "Bash", hooks: [{ type: "command", command: "${PAI_DIR}/hooks/SecurityValidator.hook.ts" }] },
        ],
        UserPromptSubmit: [
          { hooks: [{ type: "command", command: "${PAI_DIR}/hooks/UpdateTabTitle.hook.ts" }] },
        ],
        ImaginaryDocumentedHook: [
          { hooks: [{ type: "command", command: "should-not-be-used" }] },
        ],
      },
    };

    const template = buildClaudeTracerTemplate(activeSettings);
    const commands = template.hook_templates.map((hook) => hook.command);

    expect(template.live_config_mutation_allowed).toBe(false);
    expect(template.install_plan.target_cli).toBe("claude");
    expect(template.install_plan_valid).toBe(true);
    expect(commands).toContain("${PAI_DIR}/hooks/SecurityValidator.hook.ts");
    expect(commands).toContain("${PAI_DIR}/hooks/UpdateTabTitle.hook.ts");
    expect(commands).not.toContain("should-not-be-used");
    expect(commands.some((command) => command.includes("~/.pai/adapters/claude/tracer.ts"))).toBe(true);
  });

  test("extracts only active installed Claude hooks", () => {
    const hooks = extractActiveClaudeHooks({
      hooks: {
        SessionStart: [{ hooks: [{ type: "command", command: "start.ts" }] }],
        Stop: [{ hooks: [{ type: "command", command: "stop.ts" }, { type: "not-command", command: "ignored.ts" }] }],
        MadeUpHook: [{ hooks: [{ type: "command", command: "ignored.ts" }] }],
      },
    });

    expect(hooks).toEqual([
      { event: "SessionStart", matcher: undefined, command: "start.ts" },
      { event: "Stop", matcher: undefined, command: "stop.ts" },
    ]);
  });

  test("ingested tracer events remain canonical and payload-free", () => {
    const runtimeHome = mkdtempSync(join(tmpdir(), "pai-claude-tracer-"));
    const store = new CanonicalEventStore({ dbPath: ":memory:", trailPath: join(runtimeHome, "events.jsonl") });
    try {
      const event = mapClaudeHookObservationToEvent({
        hook_event: "PreToolUse",
        matcher: "Bash",
        command: "${PAI_DIR}/hooks/SecurityValidator.hook.ts",
        pai_session_id: "pai_ingest",
        sequence: 1,
        timestamp: "2026-05-09T00:00:00.000Z",
        payload_summary: "policy check",
      });
      const result = store.ingest(event, { writeJsonl: false });

      expect(result.status).toBe("accepted");
      expect(result.envelope.event_type).toBe("policy.pre_tool_use");
      expect(result.envelope.harness).toBe("claude");
      expect("payload" in result.envelope).toBe(false);
    } finally {
      store.close();
      rmSync(runtimeHome, { recursive: true, force: true });
    }
  });

  test("runtime template path stays under runtime-local PAI adapter directory", () => {
    expect(claudeTracerRuntimeTemplatePath("/tmp/pai-runtime")).toBe("/tmp/pai-runtime/adapters/claude/tracer.ts");
  });
});
