import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CanonicalMemoryStore } from "../src/memory-store";
import { CanonicalEventStore } from "../src/event-store";
import {
  OPENCODE_PLUGIN_RESPONSIBILITIES,
  buildOpenCodeDegradedCapabilityEvent,
  buildOpenCodeDirectLaunchEvent,
  buildOpenCodeRetrievalContext,
  buildOpenCodeTracerTemplate,
  checkOpenCodePluginOrdering,
  mapOpenCodePluginObservationToEvent,
  opencodeTracerRuntimeTemplatePath,
  resolveOpenCodePaiSession,
} from "../src/opencode-tracer";

let runtimeHome: string | undefined;

afterEach(() => {
  if (runtimeHome) rmSync(runtimeHome, { recursive: true, force: true });
  runtimeHome = undefined;
});

describe("OpenCode adapter tracer", () => {
  test("documents responsibility ownership without double-owned duties", () => {
    expect(OPENCODE_PLUGIN_RESPONSIBILITIES).toContainEqual({ responsibility: "event_emission", owner: "shared_adapter", plugin: "pai-opencode-tracer" });
    expect(OPENCODE_PLUGIN_RESPONSIBILITIES).toContainEqual({ responsibility: "retrieval", owner: "shared_adapter", plugin: "pai-opencode-tracer" });
    expect(OPENCODE_PLUGIN_RESPONSIBILITIES).toContainEqual({ responsibility: "routing", owner: "existing_plugin", plugin: "pai-mode-router" });
    expect(OPENCODE_PLUGIN_RESPONSIBILITIES).toContainEqual({ responsibility: "isa_sync", owner: "existing_plugin", plugin: "pai-isa-sync" });
    expect(OPENCODE_PLUGIN_RESPONSIBILITIES).toContainEqual({ responsibility: "containment", owner: "existing_plugin", plugin: "pai-containment-guard" });
  });

  test("keeps observed OpenCode plugin order idempotent", () => {
    const plugins = [
      "opencode-openai-codex-auth",
      "file://{env:HOME}/.config/opencode/plugins/terminal-bell",
      "file://{env:HOME}/.config/opencode/plugins/pai-mode-router",
      "file://{env:HOME}/.config/opencode/plugins/pai-checkpoint-per-isc",
      "file://{env:HOME}/.config/opencode/plugins/pai-isa-sync",
      "file://{env:HOME}/.config/opencode/plugins/pai-containment-guard",
      "file://{env:HOME}/.config/opencode/plugins/pai-config-audit",
      "file://{env:HOME}/.config/opencode/plugins/pai-reflection-loop",
      "@tarquinen/opencode-dcp@latest",
      "@mcmunder/opencode-git-memory",
    ];

    expect(checkOpenCodePluginOrdering(plugins)).toEqual({
      duplicate_context_injection: false,
      duplicate_isa_sync: false,
      conflicting_containment: false,
      ordered_plugins: plugins,
    });
  });

  test("renders install templates without mutating live OpenCode config", () => {
    const template = buildOpenCodeTracerTemplate();
    expect(template.live_config_mutation_allowed).toBe(false);
    expect(template.install_plan.target_cli).toBe("opencode");
    expect(template.install_plan_valid).toBe(true);
    expect(template.hook_templates.some((hook) => hook.command.includes("~/.pai/adapters/opencode/tracer.ts"))).toBe(true);
    expect(template.install_plan.files_to_change[0].path).toBe("~/.config/opencode/opencode.json");
    expect(template.install_plan.live_config_mutation_allowed).toBe(false);
    expect(JSON.stringify(template)).not.toContain("plugin ordering mutation");
  });

  test("attaches existing PAI sessions and creates direct-launch sessions", () => {
    expect(resolveOpenCodePaiSession({ env: { PAI_SESSION_ID: "pai_existing" } })).toEqual({
      pai_session_id: "pai_existing",
      source: "pai_run",
      managed_event: "session.attached_to_pai_run",
    });

    const direct = resolveOpenCodePaiSession({ seed: "123e4567-e89b-12d3-a456-426614174000" });
    expect(direct.pai_session_id).toBe("pai_123e4567e89b12d3a456426614174000");
    expect(buildOpenCodeDirectLaunchEvent(direct, "2026-05-09T00:00:00.000Z").event_type).toBe("session.created_by_native_adapter");
  });

  test("maps observations to canonical redacted events without raw payloads", () => {
    const events = [
      mapOpenCodePluginObservationToEvent({ event: "UserPromptSubmit", pai_session_id: "pai_oc", sequence: 1, timestamp: "2026-05-09T00:00:00.000Z", prompt: "token=not-a-real-token" }),
      mapOpenCodePluginObservationToEvent({ event: "ToolCall", pai_session_id: "pai_oc", sequence: 2, timestamp: "2026-05-09T00:00:01.000Z", tool_input: "read .env.local" }),
      mapOpenCodePluginObservationToEvent({ event: "Retrieval", pai_session_id: "pai_oc", sequence: 3, timestamp: "2026-05-09T00:00:02.000Z", retrieval_context: "trusted context" }),
      mapOpenCodePluginObservationToEvent({ event: "Stop", pai_session_id: "pai_oc", sequence: 4, timestamp: "2026-05-09T00:00:03.000Z" }),
    ];

    expect(events.map((event) => event.event_type)).toEqual(["prompt.submit", "tool.call", "memory.retrieval", "session.stop"]);
    for (const event of events) {
      expect(event.harness).toBe("opencode");
      expect(event.policy_decision_id).toStartWith("policy:");
      expect("payloads" in event).toBe(false);
    }
    expect(JSON.stringify(events)).not.toContain("not-a-real-token");
    expect(JSON.stringify(events)).not.toContain(".env.local");
  });

  test("uses trust-gated memory context for retrieval", () => {
    runtimeHome = mkdtempSync(join(tmpdir(), "pai-opencode-memory-"));
    const store = new CanonicalMemoryStore({ runtimeHome });
    store.addMemory({
      memory_id: "mem-good",
      type: "projects",
      scope: "git:abc123",
      source_event_ids: ["event-good"],
      provenance: { harness: "opencode" },
      confidence: 0.96,
      assertion_type: "verified",
      trust_level: "high",
      review_status: "accepted",
      content: "Use canonical memory context.",
    });
    store.addMemory({
      memory_id: "mem-low",
      type: "projects",
      scope: "git:abc123",
      source_event_ids: ["event-low"],
      provenance: { harness: "opencode" },
      confidence: 0.3,
      assertion_type: "observed",
      trust_level: "low",
      review_status: "accepted",
      content: "Do not inject this.",
    });

    const context = buildOpenCodeRetrievalContext(store, { projectId: "git:abc123", limit: 5 });
    expect(context.memories.map((memory) => memory.memory_id)).toEqual(["mem-good"]);
    expect(context.content).toContain("event-good");
    expect(context.content).not.toContain("Do not inject this");
    store.close();
  });

  test("emits degraded capability events when plugin surfaces cannot enforce", () => {
    const event = buildOpenCodeDegradedCapabilityEvent({
      pai_session_id: "pai_oc",
      source: "native_adapter",
      managed_event: "session.created_by_native_adapter",
    }, "can_block_tool", "2026-05-09T00:00:00.000Z");

    expect(event.event_type).toBe("policy.degraded");
    expect(event.redaction_status).toBe("clean");
    expect(event.policy_decision_id).toBe("policy:pai_oc:policy.degraded:1");
    expect("payloads" in event).toBe(false);
  });

  test("ingests tracer events as canonical payload-free envelopes", () => {
    runtimeHome = mkdtempSync(join(tmpdir(), "pai-opencode-events-"));
    const store = new CanonicalEventStore({ runtimeHome });
    const event = mapOpenCodePluginObservationToEvent({
      event: "ToolCall",
      pai_session_id: "pai_oc",
      sequence: 7,
      timestamp: "2026-05-09T00:00:00.000Z",
      tool_input: "safe input",
    });

    const result = store.ingest(event, { writeJsonl: false });
    expect(result.status).toBe("accepted");
    expect(result.envelope.event_type).toBe("tool.call");
    expect(result.envelope.harness).toBe("opencode");
    expect("payload" in result.envelope).toBe(false);
    store.close();
  });

  test("runtime template path stays under runtime-local PAI adapter directory", () => {
    expect(opencodeTracerRuntimeTemplatePath("/tmp/pai-runtime")).toBe("/tmp/pai-runtime/adapters/opencode/tracer.ts");
  });
});
