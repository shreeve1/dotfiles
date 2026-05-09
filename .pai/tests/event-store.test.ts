import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { CanonicalEventStore, EVENT_STORE_MIGRATIONS, type EventIngestInput } from "../src/event-store";
import { prepareEventForDestination } from "../src/redaction";
import type { AdapterCapabilities } from "../src/policy";

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

let runtimeHome: string;
let store: CanonicalEventStore;

beforeEach(() => {
  runtimeHome = mkdtempSync(join(tmpdir(), "pai-event-store-"));
  store = new CanonicalEventStore({ runtimeHome });
});

afterEach(() => {
  store.close();
  rmSync(runtimeHome, { recursive: true, force: true });
});

describe("canonical event ingest", () => {
  test("initializes versioned migrations and SQLite WAL mode", () => {
    expect(EVENT_STORE_MIGRATIONS.map((migration) => migration.version)).toEqual([1]);
    expect(store.appliedMigrations()).toEqual([{ version: 1 }]);
    expect(store.journalMode().journal_mode).toBe("wal");
  });

  test("stores canonical redacted event envelopes without raw payloads", () => {
    const result = store.ingest(eventFixture("evt-1", "session-1", 1, "claude"));

    expect(result.status).toBe("accepted");
    expect(result.envelope).toMatchObject({
      schema_version: "pai.event.v1",
      event_id: "evt-1",
      pai_session_id: "session-1",
      harness: "claude",
      event_type: "lifecycle.prompt",
      sequence: 1,
      project_id: "git:abc123",
      ingest_status: "accepted",
      redaction_status: "redacted",
      policy_decision_id: "policy:evt-1",
      capabilities,
    });
    expect("payload" in result.envelope).toBe(false);
    expect(JSON.stringify(result.envelope)).not.toContain("not-a-real-token");
    expect(store.listEvents()).toHaveLength(1);
  });

  test("appends redacted JSONL only after successful SQLite ingest", () => {
    const result = store.ingest(eventFixture("evt-jsonl", "session-jsonl", 1, "opencode"));
    const trail = readFileSync(store.trailPath, "utf8");

    expect(result.status).toBe("accepted");
    expect(trail).toContain("evt-jsonl");
    expect(trail).toContain('"ingest_status":"accepted"');
    expect(trail).toContain("[REDACTED:generic_assignment_secret]");
    expect(trail).not.toContain("not-a-real-token");
    expect(trail).not.toContain('"payloads"');
  });

  test("can write explicit pending JSONL markers for interrupted ingest windows", () => {
    store.writePendingJsonlMarker({ event_id: "evt-pending", pai_session_id: "session-pending", sequence: 1 }, "sqlite-before-jsonl");

    const marker = JSON.parse(readFileSync(store.trailPath, "utf8"));
    expect(marker).toEqual({
      schema_version: "pai.event.v1",
      event_id: "evt-pending",
      pai_session_id: "session-pending",
      sequence: 1,
      ingest_status: "pending",
      reason: "sqlite-before-jsonl",
    });
  });

  test("is idempotent by event_id and by session sequence", () => {
    expect(store.ingest(eventFixture("evt-dupe", "session-dupe", 1, "codex")).status).toBe("accepted");
    expect(store.ingest(eventFixture("evt-dupe", "session-dupe", 1, "codex")).status).toBe("replayed");
    expect(store.ingest(eventFixture("evt-different-id", "session-dupe", 1, "codex")).status).toBe("replayed");
    expect(store.listEvents()).toHaveLength(1);
  });

  test("reconciles SQLite events missing from JSONL after interrupted writes", () => {
    store.writePendingJsonlMarker({ event_id: "evt-recover", pai_session_id: "session-recover", sequence: 1 }, "before-sqlite-commit");
    store.ingest(eventFixture("evt-recover", "session-recover", 1, "pai"), { writeJsonl: false });

    const reconciliation = store.reconcileJsonlTrail();
    const trail = readFileSync(store.trailPath, "utf8");

    expect(reconciliation).toEqual({ missing_jsonl_events: ["evt-recover"], appended: 1 });
    expect(trail).toContain('"ingest_status":"pending"');
    expect(trail).toContain('"ingest_status":"accepted"');
    expect(trail).toContain("evt-recover");
    expect(trail).not.toContain("not-a-real-token");
  });

  test("handles concurrent harness-shaped fixture writes", async () => {
    const harnesses = ["claude", "codex", "opencode", "pi", "pai"] as const;
    await Promise.all(
      harnesses.map(async (harness, index) => {
        const localStore = new CanonicalEventStore({ runtimeHome });
        try {
          return localStore.ingest(eventFixture(`evt-${harness}`, "session-concurrent", index + 1, harness));
        } finally {
          localStore.close();
        }
      }),
    );

    expect(store.listEvents().map((event) => event.harness)).toEqual(["claude", "codex", "opencode", "pi", "pai"]);
  });

  test("preserves ordered session events and recovery metadata", () => {
    store.ingest(eventFixture("evt-order-2", "session-order", 2, "claude"));
    store.ingest(eventFixture("evt-order-1", "session-order", 1, "claude"));

    expect(store.listEvents().map((event) => [event.event_id, event.sequence, event.parent_event_id])).toEqual([
      ["evt-order-1", 1, "parent-event"],
      ["evt-order-2", 2, "parent-event"],
    ]);
  });
});

function eventFixture(
  eventId: string,
  sessionId: string,
  sequence: number,
  harness: EventIngestInput["harness"],
): EventIngestInput {
  return {
    ...prepareEventForDestination("sqlite", {
      event_id: eventId,
      pai_session_id: sessionId,
      harness,
      event_type: "lifecycle.prompt",
      timestamp: `2026-05-09T00:00:${String(sequence).padStart(2, "0")}.000Z`,
      sequence,
      adapter_version: `${harness}-test`,
      payloads: {
        prompt: "token=not-a-real-token",
      },
    }),
    cwd: "/redacted/display-only",
    project_id: "git:abc123",
    parent_event_id: "parent-event",
    turn_id: "turn-1",
    tool_call_id: "tool-1",
    actor_id: "ralph-test",
    capabilities,
    policy_decision_id: `policy:${eventId}`,
  };
}
