import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CanonicalEventStore, type EventIngestInput } from "../src/event-store";
import {
  DREAM_FUTURE_PROVIDER_OPTIONS,
  DeterministicDreamProvider,
  LocalRulesDreamProvider,
  runDreamPipeline,
  type DreamProvider,
} from "../src/dream-pipeline";
import { CanonicalMemoryStore } from "../src/memory-store";
import type { AdapterCapabilities } from "../src/policy";
import { prepareEventForDestination } from "../src/redaction";

const capabilities: AdapterCapabilities = {
  can_inject_context: true,
  can_block_tool: true,
  can_request_confirmation: true,
  can_observe_tool_input: true,
  can_observe_tool_output: true,
  can_observe_final_response: true,
  can_set_environment: true,
  can_attach_native_session_id: true,
};

let runtimeHome: string | undefined;

afterEach(() => {
  if (runtimeHome) rmSync(runtimeHome, { recursive: true, force: true });
  runtimeHome = undefined;
});

describe("provider-agnostic dream pipeline", () => {
  test("consumes only redacted canonical events and rejects raw payload fields", () => {
    const { eventStore, memoryStore } = createStores();
    const safe = eventStore.ingest(eventFixture("evt-safe", 1)).envelope;
    const unsafe = { ...safe, event_id: "evt-unsafe", payloads: { prompt: "raw secret" } } as typeof safe & { payloads: { prompt: string } };

    const result = runDreamPipeline(memoryStore, [safe, unsafe], {
      provider: new DeterministicDreamProvider(),
      now: "2026-05-09T00:00:00.000Z",
    });

    expect(result.proposed).toHaveLength(1);
    expect(result.skipped_events).toEqual([{ event_id: "evt-unsafe", reason: "Dream event evt-unsafe contains raw payload fields" }]);
    expect(JSON.stringify(result.proposed[0].memory)).not.toContain("raw secret");
    eventStore.close();
    memoryStore.close();
  });

  test("supports deterministic test double and local offline providers", () => {
    const { eventStore, memoryStore } = createStores();
    const event = eventStore.ingest(eventFixture("evt-provider", 1)).envelope;

    const deterministic = runDreamPipeline(memoryStore, [event], {
      provider: new DeterministicDreamProvider(),
      now: "2026-05-09T00:00:00.000Z",
    });
    const local = runDreamPipeline(memoryStore, [eventStore.ingest(eventFixture("evt-provider-2", 2)).envelope], {
      provider: new LocalRulesDreamProvider(),
      now: "2026-05-09T00:00:00.000Z",
    });

    expect(deterministic.mode).toBe("deterministic-test-double");
    expect(local.mode).toBe("local-offline-rules");
    eventStore.close();
    memoryStore.close();
  });

  test("documents Claude inference as future provider but does not enable it", () => {
    expect(DREAM_FUTURE_PROVIDER_OPTIONS).toEqual([
      {
        provider: "claude-inference",
        status: "future-option",
        enabled_by_default: false,
        enablement_issue: "#019",
      },
    ]);
  });

  test("provider failures do not corrupt accepted memories or review queues", () => {
    const { eventStore, memoryStore } = createStores();
    memoryStore.addMemory({
      memory_id: "mem-accepted",
      type: "work",
      scope: "git:abc123",
      source_event_ids: ["evt-existing"],
      provenance: { harness: "opencode" },
      confidence: 0.99,
      assertion_type: "verified",
      trust_level: "high",
      review_status: "accepted",
      content: "Existing accepted memory remains untouched.",
    });

    const failingProvider: DreamProvider = {
      name: "failing-test-provider",
      mode: "deterministic-test-double",
      distill() {
        throw new Error("provider unavailable");
      },
    };

    expect(() => runDreamPipeline(memoryStore, [eventStore.ingest(eventFixture("evt-fail", 1)).envelope], { provider: failingProvider })).toThrow("provider unavailable");
    expect(memoryStore.getMemory("mem-accepted")?.review_status).toBe("accepted");
    expect(memoryStore.listReviewQueue()).toEqual([]);
    eventStore.close();
    memoryStore.close();
  });

  test("proposed memories include provenance confidence assertion trust and review status", () => {
    const { eventStore, memoryStore } = createStores();
    const result = runDreamPipeline(memoryStore, [eventStore.ingest(eventFixture("evt-memory", 1)).envelope], {
      provider: new LocalRulesDreamProvider(),
      projectId: "git:project-override",
      now: "2026-05-09T00:00:00.000Z",
    });

    const proposed = result.proposed[0];
    expect(proposed.memory).toMatchObject({
      scope: "git:project-override",
      source_event_ids: ["evt-memory"],
      confidence: 0.62,
      assertion_type: "observed",
      trust_level: "low",
      review_status: "proposed",
    });
    expect(proposed.memory.provenance).toMatchObject({
      harness: "opencode",
      source: "pai-dream",
      dream_provider: "local-offline-rules",
      dream_mode: "local-offline-rules",
    });
    expect(proposed.review.state).toBe("proposed");
    eventStore.close();
    memoryStore.close();
  });
});

function createStores() {
  runtimeHome = mkdtempSync(join(tmpdir(), "pai-dream-"));
  return {
    eventStore: new CanonicalEventStore({ runtimeHome }),
    memoryStore: new CanonicalMemoryStore({ runtimeHome }),
  };
}

function eventFixture(eventId: string, sequence: number): EventIngestInput {
  return {
    ...prepareEventForDestination("dream", {
      event_id: eventId,
      pai_session_id: "session-dream",
      harness: "opencode",
      event_type: "prompt.submit",
      timestamp: `2026-05-09T00:00:${String(sequence).padStart(2, "0")}.000Z`,
      sequence,
      adapter_version: "opencode-test",
      payloads: {
        prompt: "Project convention: keep dream proposals review-gated. token=not-a-real-token",
      },
    }),
    project_id: "git:abc123",
    capabilities,
  };
}
