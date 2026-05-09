import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CanonicalMemoryStore, MEMORY_TYPES, type ProposedMemoryInput } from "../src/memory-store";

let runtimeHome: string | undefined;

afterEach(() => {
  if (runtimeHome) rmSync(runtimeHome, { recursive: true, force: true });
  runtimeHome = undefined;
});

describe("CanonicalMemoryStore", () => {
  test("initializes versioned memory migrations and typed stores", () => {
    const store = createStore();
    expect(store.appliedMigrations()).toEqual([{ version: 1 }, { version: 2 }]);
    expect(store.typedStoreNames().map((entry) => entry.type)).toEqual([...MEMORY_TYPES]);
    expect(store.typedStoreNames().every((entry) => entry.path.startsWith(join(runtimeHome!, "memory")))).toBe(true);
    store.close();
  });

  test("preserves memory provenance and source event references", () => {
    const store = createStore();
    const record = store.addMemory(memoryFixture({
      memory_id: "mem-project-1",
      source_event_ids: ["event-1", "event-2"],
      provenance: { harness: "opencode", project_id: "git:abc123", source: "review" },
    }));

    expect(record.source_event_ids).toEqual(["event-1", "event-2"]);
    expect(record.provenance).toEqual({ harness: "opencode", project_id: "git:abc123", source: "review" });
    expect(store.getMemory("mem-project-1")?.provenance).toEqual(record.provenance);
    store.close();
  });

  test("supports proposed memory review queue state transitions", () => {
    const store = createStore();
    store.addMemory(memoryFixture({ memory_id: "mem-review", review_status: "proposed" }));
    const review = store.enqueueReview({
      review_id: "review-1",
      memory_id: "mem-review",
      proposed_diff: "+ remember safe project fact",
      source_event_ids: ["event-review"],
    });

    expect(review.state).toBe("proposed");
    expect(store.decideReview("review-1", "deferred").state).toBe("deferred");
    expect(store.getMemory("mem-review")?.review_status).toBe("deferred");
    expect(store.decideReview("review-1", "accepted").state).toBe("accepted");
    expect(store.getMemory("mem-review")?.review_status).toBe("accepted");
    store.close();
  });

  test("bars low-trust and inferred memories from instruction injection eligibility", () => {
    const store = createStore();
    store.addMemory(memoryFixture({ memory_id: "mem-accepted", trust_level: "high", assertion_type: "verified", review_status: "accepted" }));
    store.addMemory(memoryFixture({ memory_id: "mem-low", trust_level: "low", assertion_type: "verified", review_status: "accepted" }));
    store.addMemory(memoryFixture({ memory_id: "mem-inferred", trust_level: "high", assertion_type: "inferred", review_status: "accepted" }));
    store.addMemory(memoryFixture({ memory_id: "mem-proposed", trust_level: "high", assertion_type: "verified", review_status: "proposed" }));

    expect(store.listInstructionEligibleMemories().map((memory) => memory.memory_id)).toEqual(["mem-accepted"]);
    store.close();
  });

  test("filters eligible memories by project scope and memory type", () => {
    const store = createStore();
    store.addMemory(memoryFixture({ memory_id: "mem-project", type: "projects", scope: "git:project-a", review_status: "accepted" }));
    store.addMemory(memoryFixture({ memory_id: "mem-tool", type: "tools", scope: "git:project-a", review_status: "accepted" }));
    store.addMemory(memoryFixture({ memory_id: "mem-other", type: "projects", scope: "git:project-b", review_status: "accepted" }));

    expect(store.listInstructionEligibleMemories({ projectId: "git:project-a", type: "projects" }).map((memory) => memory.memory_id)).toEqual([
      "mem-project",
    ]);
    store.close();
  });

  test("searches memories with FTS and metadata filters", () => {
    const store = createStore();
    store.addMemory(memoryFixture({
      memory_id: "mem-alpha",
      type: "projects",
      scope: "git:project-a",
      provenance: { harness: "opencode" },
      confidence: 0.95,
      trust_level: "high",
      content: "Alpha project prefers small memory context blocks.",
    }));
    store.addMemory(memoryFixture({
      memory_id: "mem-beta",
      type: "tools",
      scope: "git:project-a",
      provenance: { harness: "codex" },
      confidence: 0.65,
      trust_level: "medium",
      content: "Beta tool note mentions memory blocks.",
    }));
    store.addMemory(memoryFixture({
      memory_id: "mem-gamma",
      scope: "git:project-b",
      provenance: { harness: "opencode" },
      content: "Gamma unrelated preference.",
    }));

    expect(store.searchMemories({ query: "blocks", projectId: "git:project-a", minConfidence: 0.9, trustLevel: "high", harness: "opencode" }).map((memory) => memory.memory_id)).toEqual([
      "mem-alpha",
    ]);
    store.close();
  });

  test("builds bounded context with provenance metadata from eligible memories only", () => {
    const store = createStore();
    store.addMemory(memoryFixture({ memory_id: "mem-good", source_event_ids: ["event-good"], content: "Use terse status summaries." }));
    store.addMemory(memoryFixture({ memory_id: "mem-low", trust_level: "low", content: "Do not inject this low trust memory." }));
    store.addMemory(memoryFixture({ memory_id: "mem-inferred", assertion_type: "inferred", content: "Do not inject this inferred memory." }));

    const block = store.buildContextBlock({ projectId: "git:abc123", limit: 5 });

    expect(block.memories.map((memory) => memory.memory_id)).toEqual(["mem-good"]);
    expect(block.memories[0].source_event_ids).toEqual(["event-good"]);
    expect(block.content).toContain("mem-good");
    expect(block.content).toContain("event-good");
    expect(block.content).not.toContain("low trust");
    expect(block.content).not.toContain("inferred");
    store.close();
  });

  test("lists proposed review queue items with diff previews", () => {
    const store = createStore();
    store.addMemory(memoryFixture({ memory_id: "mem-review-list", review_status: "proposed" }));
    store.enqueueReview({
      review_id: "review-list",
      memory_id: "mem-review-list",
      proposed_diff: "+ remember reviewed project convention",
      source_event_ids: ["event-review-list"],
    });

    expect(store.listReviewQueue().map((review) => review.review_id)).toEqual(["review-list"]);
    expect(store.listReviewQueue()[0].proposed_diff).toContain("remember reviewed");
    store.close();
  });
});

function createStore() {
  runtimeHome = mkdtempSync(join(tmpdir(), "pai-memory-store-"));
  return new CanonicalMemoryStore({ runtimeHome });
}

function memoryFixture(overrides: Partial<ProposedMemoryInput> = {}): ProposedMemoryInput {
  return {
    memory_id: "mem-1",
    type: "projects",
    scope: "git:abc123",
    source_event_ids: ["event-1"],
    provenance: { harness: "opencode" },
    confidence: 0.91,
    assertion_type: "verified",
    trust_level: "high",
    review_status: "accepted",
    content: "Project prefers bounded context blocks.",
    expires_at: undefined,
    revalidation_rule: "revalidate after major harness change",
    ...overrides,
  };
}
