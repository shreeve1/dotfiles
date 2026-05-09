import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CanonicalEventStore } from "../src/event-store";
import {
  buildCodexDirectLaunchEvent,
  buildCodexTracerTemplate,
  codexBridgeCompatibility,
  codexPrdCompatibility,
  codexTracerRuntimeTemplatePath,
  mapCodexHookInputToObservation,
  mapCodexHookObservationToEvent,
  resolveCodexPaiSession,
} from "../src/codex-tracer";

describe("Codex adapter tracer", () => {
  test("attaches to PAI_SESSION_ID when launched through pai-run", () => {
    const resolution = resolveCodexPaiSession({ env: { PAI_SESSION_ID: "pai_existing" } });

    expect(resolution).toEqual({
      pai_session_id: "pai_existing",
      source: "pai_run",
      managed_event: "session.attached_to_pai_run",
    });
  });

  test("attaches to Codex hook session IDs without exposing raw session IDs", () => {
    const resolution = resolveCodexPaiSession({ env: {}, codexSessionId: "codex-native-session-123" });

    expect(resolution.pai_session_id).toStartWith("pai_codex_");
    expect(resolution.pai_session_id).not.toContain("codex-native-session-123");
    expect(resolution.source).toBe("codex_hook");
    expect(resolution.managed_event).toBe("session.attached_to_codex_hook");
  });

  test("creates managed native sessions for direct Codex launches", () => {
    const resolution = resolveCodexPaiSession({ env: {}, seed: "123e4567-e89b-12d3-a456-426614174000" });
    const event = buildCodexDirectLaunchEvent(resolution, "2026-05-09T00:00:00.000Z");

    expect(resolution.pai_session_id).toBe("pai_123e4567e89b12d3a456426614174000");
    expect(resolution.source).toBe("native_adapter");
    expect(event.event_type).toBe("session.created_by_native_adapter");
    expect(event.harness).toBe("codex");
    expect("payloads" in event).toBe(false);
  });

  test("maps Codex hook input contracts into canonical redacted events", () => {
    const resolution = resolveCodexPaiSession({ codexSessionId: "codex-session" });
    const inputs = [
      { hook_event_name: "UserPromptSubmit", prompt: "prompt token=not-a-real-token" },
      { hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command: "pwd" } },
      { hook_event_name: "PostToolUse", tool_name: "Bash", tool_output: "output" },
      { hook_event_name: "Stop", last_assistant_message: "final" },
    ];
    const events = inputs.map((input, index) => mapCodexHookObservationToEvent(mapCodexHookInputToObservation(
      { ...input, cwd: "/workspace/project" },
      resolution,
      index + 1,
      `2026-05-09T00:00:0${index + 1}.000Z`,
    )));

    expect(events.map((event) => event.event_type)).toEqual(["prompt.submit", "policy.pre_tool_use", "tool.post_use", "session.stop"]);
    expect(events.every((event) => event.harness === "codex")).toBe(true);
    expect(events.every((event) => event.policy_decision_id?.startsWith("policy:"))).toBe(true);
    expect(JSON.stringify(events)).not.toContain("not-a-real-token");
    expect(events.every((event) => !("payloads" in event))).toBe(true);
  });

  test("renders installable templates without auth or approval mutation", () => {
    const template = buildCodexTracerTemplate();
    const planText = JSON.stringify(template.install_plan);

    expect(template.live_config_mutation_allowed).toBe(false);
    expect(template.auth_or_approval_mutation_allowed).toBe(false);
    expect(template.install_plan.target_cli).toBe("codex");
    expect(template.install_plan_valid).toBe(true);
    expect(planText).not.toContain("auth.json");
    expect(planText).not.toContain("approval_policy");
    expect(template.hook_templates.every((hook) => hook.legacy_compatible)).toBe(true);
    expect(template.hook_templates.some((hook) => hook.command.includes("~/.pai/adapters/codex/tracer.ts"))).toBe(true);
  });

  test("preserves bridge-read compatibility and PRD-first enforcement", () => {
    expect(codexBridgeCompatibility()).toEqual({
      legacy_memory_root: ".codex/pai/MEMORY",
      canonical_memory_root: "~/.pai/memory",
      bridge_read_required: true,
      canonical_writes_only: true,
    });
    expect(codexPrdCompatibility()).toEqual({
      prd_first_enforcement_preserved: true,
      isa_migration_complete: false,
    });
  });

  test("ingested tracer events write canonical PAI envelopes", () => {
    const runtimeHome = mkdtempSync(join(tmpdir(), "pai-codex-tracer-"));
    const store = new CanonicalEventStore({ dbPath: ":memory:", trailPath: join(runtimeHome, "events.jsonl") });
    try {
      const event = mapCodexHookObservationToEvent(mapCodexHookInputToObservation(
        { hook_event_name: "PostToolUse", session_id: "codex-session", tool_name: "Bash", tool_output: "done" },
        resolveCodexPaiSession({ codexSessionId: "codex-session" }),
      ));
      const result = store.ingest(event, { writeJsonl: false });

      expect(result.status).toBe("accepted");
      expect(result.envelope.harness).toBe("codex");
      expect(result.envelope.event_type).toBe("tool.post_use");
      expect("payload" in result.envelope).toBe(false);
    } finally {
      store.close();
      rmSync(runtimeHome, { recursive: true, force: true });
    }
  });

  test("runtime template path stays under runtime-local PAI adapter directory", () => {
    expect(codexTracerRuntimeTemplatePath("/tmp/pai-runtime")).toBe("/tmp/pai-runtime/adapters/codex/tracer.ts");
  });
});
