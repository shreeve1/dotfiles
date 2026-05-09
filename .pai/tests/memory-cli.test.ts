import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
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
    const listedPayload = JSON.parse(listed.stdout.toString()) as { reviews: Array<{ review_id: string; proposed_diff: string }> };
    expect(listed.exitCode).toBe(0);
    expect(listedPayload.reviews[0].review_id).toBe("review-cli");
    expect(listedPayload.reviews[0].proposed_diff).toContain("accept this");

    const accepted = runPaiMemory("review", "accept", "review-cli", "--runtime-home", runtimeHome!);
    const acceptedPayload = JSON.parse(accepted.stdout.toString()) as { review: { state: string } };
    expect(accepted.exitCode).toBe(0);
    expect(acceptedPayload.review.state).toBe("accepted");

    const reopened = new CanonicalMemoryStore({ runtimeHome });
    expect(reopened.getMemory("mem-review-cli")?.review_status).toBe("accepted");
    reopened.close();
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
