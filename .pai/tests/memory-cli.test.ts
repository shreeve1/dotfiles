import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CanonicalMemoryStore, type ProposedMemoryInput } from "../src/memory-store";

let runtimeHome: string | undefined;

afterEach(() => {
  if (runtimeHome) rmSync(runtimeHome, { recursive: true, force: true });
  runtimeHome = undefined;
});

describe("pai-memory CLI", () => {
  test("search returns FTS matches without live external dependencies", () => {
    const store = createSeededStore();
    store.addMemory(memoryFixture({ memory_id: "mem-cli-search", content: "CLI search finds durable memory conventions." }));
    store.close();

    const result = runPaiMemory("search", "durable", "--runtime-home", runtimeHome!, "--project", "git:abc123", "--type", "projects", "--confidence", "0.8", "--trust", "high", "--harness", "opencode");
    const payload = JSON.parse(result.stdout.toString()) as { memories: Array<{ memory_id: string }> };

    expect(result.exitCode).toBe(0);
    expect(payload.memories.map((memory) => memory.memory_id)).toEqual(["mem-cli-search"]);
  });

  test("context returns bounded trust-gated memories with provenance", () => {
    const store = createSeededStore();
    store.addMemory(memoryFixture({ memory_id: "mem-context", source_event_ids: ["event-context"], content: "Context may include this accepted memory." }));
    store.addMemory(memoryFixture({ memory_id: "mem-low", trust_level: "low", content: "Low trust must stay out of context." }));
    store.close();

    const result = runPaiMemory("context", "--runtime-home", runtimeHome!, "--project", "git:abc123", "--limit", "5");
    const payload = JSON.parse(result.stdout.toString()) as { memories: Array<{ memory_id: string; source_event_ids: string[] }>; content: string };

    expect(result.exitCode).toBe(0);
    expect(payload.memories.map((memory) => memory.memory_id)).toEqual(["mem-context"]);
    expect(payload.memories[0].source_event_ids).toEqual(["event-context"]);
    expect(payload.content).toContain("event-context");
    expect(payload.content).not.toContain("Low trust");
  });

  test("review lists and updates local runtime queue items", () => {
    const store = createSeededStore();
    store.addMemory(memoryFixture({ memory_id: "mem-review-cli", review_status: "proposed" }));
    store.enqueueReview({
      review_id: "review-cli",
      memory_id: "mem-review-cli",
      proposed_diff: "+ accept this reviewed memory",
      source_event_ids: ["event-review-cli"],
    });
    store.close();

    const listed = runPaiMemory("review", "list", "--runtime-home", runtimeHome!);
    const listedPayload = JSON.parse(listed.stdout.toString()) as { reviews: Array<{ review_id: string; proposed_diff: string; confidence: number; assertion_type: string; trust_level: string }> };
    expect(listed.exitCode).toBe(0);
    expect(listedPayload.reviews[0].review_id).toBe("review-cli");
    expect(listedPayload.reviews[0].proposed_diff).toContain("accept this");
    expect(listedPayload.reviews[0].confidence).toBe(0.94);
    expect(listedPayload.reviews[0].assertion_type).toBe("verified");
    expect(listedPayload.reviews[0].trust_level).toBe("high");

    const accepted = runPaiMemory("review", "accept", "review-cli", "--runtime-home", runtimeHome!);
    const acceptedPayload = JSON.parse(accepted.stdout.toString()) as { review: { state: string } };
    expect(accepted.exitCode).toBe(0);
    expect(acceptedPayload.review.state).toBe("accepted");

    const reopened = new CanonicalMemoryStore({ runtimeHome });
    expect(reopened.getMemory("mem-review-cli")?.review_status).toBe("accepted");
    reopened.close();
  });
});

describe("pai-memory CLI portable export/import", () => {
  test("[T.3.1] export-portable --dry-run returns counts without writing a file", () => {
    const store = createSeededStore();
    store.addMemory(memoryFixture({ memory_id: "mem-cli-export-dry", content: "Durable export sample.", review_status: "accepted" }));
    store.close();

    const exportPath = join(runtimeHome!, "exports", "accepted-memories.json");
    const result = runPaiMemory("export-portable", "--dry-run", "--runtime-home", runtimeHome!, "--output", exportPath);
    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout.toString()) as { dry_run: boolean; output: string | null; record_count: number };
    expect(payload.dry_run).toBe(true);
    expect(payload.output).toBeNull();
    expect(payload.record_count).toBe(1);
    expect(existsSync(exportPath)).toBe(false);
  });

  test("[T.3.2] export-portable --output writes valid deterministic JSON", () => {
    const store = createSeededStore();
    store.addMemory(memoryFixture({ memory_id: "mem-cli-real-export", content: "Real export.", review_status: "accepted" }));
    store.close();

    const exportPath = join(runtimeHome!, "exports", "accepted-memories.json");
    const first = runPaiMemory("export-portable", "--runtime-home", runtimeHome!, "--output", exportPath);
    expect(first.exitCode).toBe(0);
    expect(existsSync(exportPath)).toBe(true);
    const firstContent = readFileSync(exportPath, "utf8");

    const second = runPaiMemory("export-portable", "--runtime-home", runtimeHome!, "--output", exportPath);
    expect(second.exitCode).toBe(0);
    const secondContent = readFileSync(exportPath, "utf8");
    expect(secondContent).toBe(firstContent);
    const parsed = JSON.parse(firstContent) as { schema_version: number; memories: Array<{ memory_id: string }> };
    expect(parsed.schema_version).toBe(1);
    expect(parsed.memories.map((memory) => memory.memory_id)).toEqual(["mem-cli-real-export"]);
  });

  test("[T.3.3/T.3.5] import-portable --dry-run reports actions without creating SQLite when runtime is fresh", () => {
    runtimeHome = mkdtempSync(join(tmpdir(), "pai-memory-cli-import-dry-"));
    const exportPath = join(runtimeHome, "fixture.json");
    writeFileSync(exportPath, JSON.stringify({
      schema_version: 1,
      metadata: { default_portable_types: ["profile", "projects", "tools", "learning", "procedures"], source_harnesses: ["opencode"], record_count: 1 },
      memories: [{
        memory_id: "mem-cli-import-dry",
        type: "projects",
        scope: "git:abc",
        source_event_ids: ["event-dry"],
        provenance: { harness: "opencode" },
        confidence: 0.91,
        assertion_type: "verified",
        trust_level: "high",
        review_status: "accepted",
        content: "Dry-run import preview.",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      }],
    }));

    const freshRuntime = mkdtempSync(join(tmpdir(), "pai-memory-cli-import-fresh-"));
    const result = runPaiMemory("import-portable", "--dry-run", "--input", exportPath, "--runtime-home", freshRuntime);
    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout.toString()) as { dry_run: boolean; would_import: string[]; total: number };
    expect(payload.dry_run).toBe(true);
    expect(payload.would_import).toEqual(["mem-cli-import-dry"]);
    expect(payload.total).toBe(1);
    expect(existsSync(join(freshRuntime, "memory", "memories.sqlite"))).toBe(false);
    rmSync(freshRuntime, { recursive: true, force: true });
  });

  test("[T.3.4] import-portable --input rehydrates records into a fresh runtime home", () => {
    runtimeHome = mkdtempSync(join(tmpdir(), "pai-memory-cli-import-real-"));
    const exportPath = join(runtimeHome, "fixture.json");
    writeFileSync(exportPath, JSON.stringify({
      schema_version: 1,
      metadata: { default_portable_types: ["profile", "projects", "tools", "learning", "procedures"], source_harnesses: ["opencode"], record_count: 1 },
      memories: [{
        memory_id: "mem-cli-import-real",
        type: "projects",
        scope: "git:abc",
        source_event_ids: ["event-real"],
        provenance: { harness: "opencode" },
        confidence: 0.94,
        assertion_type: "verified",
        trust_level: "high",
        review_status: "accepted",
        content: "Rehydrated memory.",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      }],
    }));

    const result = runPaiMemory("import-portable", "--input", exportPath, "--runtime-home", runtimeHome);
    expect(result.exitCode).toBe(0);
    const payload = JSON.parse(result.stdout.toString()) as { imported: string[]; skipped: unknown[]; total: number; conflict_policy: string };
    expect(payload.imported).toEqual(["mem-cli-import-real"]);
    expect(payload.skipped).toEqual([]);
    expect(payload.total).toBe(1);
    expect(payload.conflict_policy).toBe("local-wins");

    const reopened = new CanonicalMemoryStore({ runtimeHome });
    expect(reopened.getMemory("mem-cli-import-real")?.content).toBe("Rehydrated memory.");
    reopened.close();
  });

  test("[T.3.6] export-portable --type work exits non-zero with a clear portable-type error", () => {
    runtimeHome = mkdtempSync(join(tmpdir(), "pai-memory-cli-work-"));
    const result = runPaiMemory("export-portable", "--type", "work", "--runtime-home", runtimeHome);
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr.toString()).toContain("not portable");
  });
});

function createSeededStore() {
  runtimeHome = mkdtempSync(join(tmpdir(), "pai-memory-cli-"));
  return new CanonicalMemoryStore({ runtimeHome });
}

function runPaiMemory(...args: string[]) {
  return Bun.spawnSync([process.execPath, "src/cli/pai-memory.ts", ...args], {
    cwd: join(import.meta.dir, ".."),
    stdout: "pipe",
    stderr: "pipe",
  });
}

function memoryFixture(overrides: Partial<ProposedMemoryInput> = {}): ProposedMemoryInput {
  return {
    memory_id: "mem-cli",
    type: "projects",
    scope: "git:abc123",
    source_event_ids: ["event-cli"],
    provenance: { harness: "opencode" },
    confidence: 0.94,
    assertion_type: "verified",
    trust_level: "high",
    review_status: "accepted",
    content: "Project prefers reviewed context blocks.",
    ...overrides,
  };
}
