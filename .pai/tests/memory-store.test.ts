import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  CanonicalMemoryStore,
  MEMORY_TYPES,
  PORTABLE_EXPORT_SCHEMA_VERSION,
  PORTABLE_MEMORY_TYPES,
  PortableMemoryTypeError,
  PortableSchemaError,
  type PortableExportDocument,
  type ProposedMemoryInput,
} from "../src/memory-store";
import { PortableMemoryOversizeError } from "../src/redaction";

let runtimeHome: string | undefined;

afterEach(() => {
  if (runtimeHome) rmSync(runtimeHome, { recursive: true, force: true });
  runtimeHome = undefined;
});

describe("CanonicalMemoryStore", () => {
  test("initializes versioned memory migrations and typed stores", () => {
    const store = createStore();
    expect(store.appliedMigrations()).toEqual([{ version: 1 }, { version: 2 }, { version: 3 }]);
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

describe("CanonicalMemoryStore portable export/import", () => {
  test("[T.1.1/T.1.2] exports accepted medium/high trust non-inferred memories and skips ineligible ones", () => {
    const store = createStore();
    store.addMemory(memoryFixture({ memory_id: "mem-accept-1", type: "projects", trust_level: "high", assertion_type: "verified", review_status: "accepted" }));
    store.addMemory(memoryFixture({ memory_id: "mem-accept-2", type: "tools", trust_level: "medium", assertion_type: "user-stated", review_status: "accepted" }));
    store.addMemory(memoryFixture({ memory_id: "mem-low", trust_level: "low", review_status: "accepted" }));
    store.addMemory(memoryFixture({ memory_id: "mem-inferred", assertion_type: "inferred", review_status: "accepted" }));
    store.addMemory(memoryFixture({ memory_id: "mem-proposed", review_status: "proposed" }));
    store.addMemory(memoryFixture({ memory_id: "mem-rejected", review_status: "rejected" }));

    const result = store.exportPortableMemories();
    expect(result.document.schema_version).toBe(PORTABLE_EXPORT_SCHEMA_VERSION);
    expect(result.document.metadata.default_portable_types).toEqual(PORTABLE_MEMORY_TYPES);
    expect(result.document.memories.map((memory) => memory.memory_id).sort()).toEqual(["mem-accept-1", "mem-accept-2"]);
    store.close();
  });

  test("[T.1.3] excludes type:work from default portable export", () => {
    const store = createStore();
    store.addMemory(memoryFixture({ memory_id: "mem-project", type: "projects", review_status: "accepted" }));
    store.addMemory(memoryFixture({ memory_id: "mem-work", type: "work", review_status: "accepted" }));

    const result = store.exportPortableMemories();
    expect(result.document.memories.map((memory) => memory.memory_id)).toEqual(["mem-project"]);
    store.close();
  });

  test("[T.1.4] export ordering is deterministic across repeated runs", () => {
    const store = createStore();
    store.addMemory(memoryFixture({ memory_id: "mem-z-tool", type: "tools", scope: "git:b", review_status: "accepted" }));
    store.addMemory(memoryFixture({ memory_id: "mem-a-project", type: "projects", scope: "git:a", review_status: "accepted" }));
    store.addMemory(memoryFixture({ memory_id: "mem-b-project", type: "projects", scope: "git:a", review_status: "accepted" }));
    store.addMemory(memoryFixture({ memory_id: "mem-a-procedures", type: "procedures", scope: "git:a", review_status: "accepted" }));

    const first = store.exportPortableMemories().document.memories.map((m) => m.memory_id);
    const second = store.exportPortableMemories().document.memories.map((m) => m.memory_id);
    expect(first).toEqual(second);
    expect(first).toEqual(["mem-a-procedures", "mem-a-project", "mem-b-project", "mem-z-tool"]);
    store.close();
  });

  test("[T.1.5] redacts secret-like content and denied paths without truncating normal memory content", () => {
    const store = createStore();
    store.addMemory(memoryFixture({
      memory_id: "mem-secret",
      content: "Use api_key=hunter2 carefully and avoid ~/.ssh/id_rsa references.",
      review_status: "accepted",
    }));
    store.addMemory(memoryFixture({
      memory_id: "mem-clean",
      content: "Plain durable preference about bounded context blocks.",
      review_status: "accepted",
    }));

    const result = store.exportPortableMemories();
    const secret = result.document.memories.find((memory) => memory.memory_id === "mem-secret");
    const clean = result.document.memories.find((memory) => memory.memory_id === "mem-clean");
    expect(secret?.content).toContain("[REDACTED:generic_assignment_secret]");
    expect(secret?.content).toMatch(/\[REDACTED_PATH:(ssh_secret|private_key_file)\]/);
    expect(secret?.content).not.toContain("hunter2");
    expect(secret?.content).not.toContain("id_rsa");
    expect(clean?.content).toBe("Plain durable preference about bounded context blocks.");
    expect(result.findings.redaction.some((finding) => finding.surface === "memory_content")).toBe(true);
    store.close();
  });

  test("[T.1.6] export rejects --type work with a portable type error", () => {
    const store = createStore();
    expect(() => store.exportPortableMemories({ type: "work" as never })).toThrow(PortableMemoryTypeError);
    store.close();
  });

  test("[T.1.7] export fails loudly on oversize portable content instead of truncating", () => {
    const store = createStore();
    const huge = "x".repeat(200);
    store.addMemory(memoryFixture({ memory_id: "mem-big", content: huge, review_status: "accepted" }));
    expect(() => store.exportPortableMemories({ maxPortableChars: 100 })).toThrow(PortableMemoryOversizeError);
    store.close();
  });

  test("[T.1 redaction extra] structurally redacts provenance secret-keyed fields", () => {
    const store = createStore();
    store.addMemory(memoryFixture({
      memory_id: "mem-prov-secret",
      provenance: { harness: "opencode", api_key: "plain-secret", nested: { token: "bear" } },
      review_status: "accepted",
    }));
    const result = store.exportPortableMemories();
    const record = result.document.memories[0];
    const provenance = record.provenance as Record<string, unknown>;
    expect(provenance.api_key).toBe("[REDACTED:secret_key_value]");
    const nested = provenance.nested as Record<string, unknown>;
    expect(nested.token).toBe("[REDACTED:secret_key_value]");
    expect(provenance.harness).toBe("opencode");
    store.close();
  });

  test("[T.2.1/T.2.2/T.2.5] import creates missing memories, skips collisions, and refreshes FTS", () => {
    const sourceHome = mkdtempSync(join(tmpdir(), "pai-memory-export-"));
    const sourceStore = new CanonicalMemoryStore({ runtimeHome: sourceHome });
    sourceStore.addMemory(memoryFixture({
      memory_id: "mem-import-1",
      content: "Bounded context blocks come from import.",
      review_status: "accepted",
    }));
    sourceStore.addMemory(memoryFixture({
      memory_id: "mem-import-2",
      content: "Second imported memory uses portable surface.",
      review_status: "accepted",
    }));
    const exported = sourceStore.exportPortableMemories();
    sourceStore.close();
    rmSync(sourceHome, { recursive: true, force: true });

    const targetStore = createStore();
    targetStore.addMemory(memoryFixture({
      memory_id: "mem-import-1",
      content: "Local existing memory; should win on collision.",
      review_status: "accepted",
    }));
    const importResult = targetStore.importPortableMemories(exported.document);
    expect(importResult.imported).toEqual(["mem-import-2"]);
    expect(importResult.skipped).toEqual([{ memory_id: "mem-import-1", reason: "exists_locally" }]);
    expect(importResult.total).toBe(2);
    expect(targetStore.getMemory("mem-import-1")?.content).toBe("Local existing memory; should win on collision.");
    expect(targetStore.getMemory("mem-import-2")?.content).toContain("Second imported memory");
    expect(targetStore.searchMemories({ query: "portable" }).map((memory) => memory.memory_id)).toContain("mem-import-2");
    targetStore.close();
  });

  test("[T.2.3] import preserves source provenance and adds runtime-only import metadata", () => {
    const store = createStore();
    const document: PortableExportDocument = {
      schema_version: PORTABLE_EXPORT_SCHEMA_VERSION,
      metadata: { default_portable_types: PORTABLE_MEMORY_TYPES, source_harnesses: ["opencode"], record_count: 1 },
      memories: [{
        memory_id: "mem-prov",
        type: "projects",
        scope: "git:abc",
        source_event_ids: ["event-prov-1"],
        provenance: { harness: "opencode", source: "review" },
        confidence: 0.9,
        assertion_type: "verified",
        trust_level: "high",
        review_status: "accepted",
        content: "Provenance-preserving import.",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      }],
    };
    store.importPortableMemories(document);
    const stored = store.getMemory("mem-prov");
    expect(stored?.provenance).toEqual({ harness: "opencode", source: "review" });
    expect(stored?.source_event_ids).toEqual(["event-prov-1"]);
    const runtime = store.getRuntimeMemoryMetadata("mem-prov");
    expect(runtime?.portable_import).toBeDefined();
    store.close();
  });

  test("[T.2.4] import rejects unsupported schema versions with a clear error", () => {
    const store = createStore();
    expect(() => store.importPortableMemories({ schema_version: 999, metadata: {}, memories: [] } as never)).toThrow(PortableSchemaError);
    store.close();
  });

  test("[T.2.6] re-export after import strips runtime-only import metadata", () => {
    const store = createStore();
    const document: PortableExportDocument = {
      schema_version: PORTABLE_EXPORT_SCHEMA_VERSION,
      metadata: { default_portable_types: PORTABLE_MEMORY_TYPES, source_harnesses: ["opencode"], record_count: 1 },
      memories: [{
        memory_id: "mem-reexport",
        type: "projects",
        scope: "git:abc",
        source_event_ids: ["event-re-1"],
        provenance: { harness: "opencode" },
        confidence: 0.92,
        assertion_type: "verified",
        trust_level: "high",
        review_status: "accepted",
        content: "Re-export must stay clean.",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      }],
    };
    store.importPortableMemories(document);
    const reExported = store.exportPortableMemories();
    const reRecord = reExported.document.memories[0];
    expect(reRecord.provenance).toEqual({ harness: "opencode" });
    expect((reRecord.provenance as Record<string, unknown>).portable_import).toBeUndefined();
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
