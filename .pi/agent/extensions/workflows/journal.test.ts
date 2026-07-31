import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  agentCallKey,
  appendJournalEntry,
  createReplayIndex,
  HASHED_OPTION_KEYS,
  readJournal,
  type JournalEntry,
} from "./journal.ts";

function freshDir(): string {
  return mkdtempSync(join(tmpdir(), "pi-workflow-journal-"));
}

const CTX = { launchCwd: "/x", defaultModelId: "a", defaultThinking: "medium" };

function baseEntry(overrides: Partial<JournalEntry> = {}): JournalEntry {
  return {
    key: "k",
    seq: 1,
    index: 1,
    label: "a",
    ok: true,
    result: { ok: true, output: "hi" },
    finishedAt: 1,
    ...overrides,
  };
}

test("agentCallKey is stable for identical inputs and returns full sha256 hex", () => {
  const a = agentCallKey("hello", { model: "a", cwd: "/x" }, CTX);
  const b = agentCallKey("hello", { model: "a", cwd: "/x" }, CTX);
  assert.equal(a, b);
  assert.match(a, /^[a-f0-9]{64}$/);
});

test("agentCallKey differs on different prompts", () => {
  const a = agentCallKey("hello", { model: "a" }, CTX);
  const b = agentCallKey("world", { model: "a" }, CTX);
  assert.notEqual(a, b);
});

test("agentCallKey is invariant to top-level option key order", () => {
  const a = agentCallKey("p", { model: "a", cwd: "/x" }, CTX);
  const b = agentCallKey("p", { cwd: "/x", model: "a" }, CTX);
  assert.equal(a, b);
});

test("agentCallKey is invariant to nested option key order (recursive sorting)", () => {
  const a = agentCallKey(
    "p",
    { schema: { type: "object", properties: { a: {}, b: {} } } },
    CTX,
  );
  const b = agentCallKey(
    "p",
    { schema: { properties: { b: {}, a: {} }, type: "object" } },
    CTX,
  );
  assert.equal(a, b);
});

test("agentCallKey excludes label/phase and includes model/schema", () => {
  const base = { model: "a", schema: { x: 1 } };
  const a = agentCallKey("p", base, CTX);
  const withLabel = agentCallKey("p", { ...base, label: "alpha" }, CTX);
  const withPhase = agentCallKey("p", { ...base, phase: "p1" }, CTX);
  const relabeled = agentCallKey("p", { ...base, label: "beta" }, CTX);
  const rephased = agentCallKey("p", { ...base, phase: "p2" }, CTX);
  assert.equal(a, withLabel, "label must not affect the key");
  assert.equal(a, withPhase, "phase must not affect the key");
  assert.equal(withLabel, relabeled, "label value must not affect the key");
  assert.equal(withPhase, rephased, "phase value must not affect the key");

  const differentModel = agentCallKey("p", { ...base, model: "b" }, CTX);
  const differentSchema = agentCallKey("p", { ...base, schema: { x: 2 } }, CTX);
  assert.notEqual(a, differentModel, "model must affect the key");
  assert.notEqual(a, differentSchema, "schema must affect the key");
});

test("agentCallKey changes when launchCwd differs (cross-project guard)", () => {
  const a = agentCallKey(
    "p",
    { model: "a" },
    {
      launchCwd: "/proj/a",
      defaultModelId: "a",
    },
  );
  const b = agentCallKey(
    "p",
    { model: "a" },
    {
      launchCwd: "/proj/b",
      defaultModelId: "a",
    },
  );
  assert.notEqual(a, b);
});

test("agentCallKey changes when defaultModelId differs", () => {
  const a = agentCallKey(
    "p",
    { model: undefined },
    {
      launchCwd: "/x",
      defaultModelId: "model-a",
    },
  );
  const b = agentCallKey(
    "p",
    { model: undefined },
    {
      launchCwd: "/x",
      defaultModelId: "model-b",
    },
  );
  assert.notEqual(a, b);
});

test("agentCallKey changes when defaultThinking differs", () => {
  const a = agentCallKey(
    "p",
    {},
    {
      launchCwd: "/x",
      defaultModelId: "a",
      defaultThinking: "low",
    },
  );
  const b = agentCallKey(
    "p",
    {},
    {
      launchCwd: "/x",
      defaultModelId: "a",
      defaultThinking: "high",
    },
  );
  assert.notEqual(a, b);
});

test("agentCallKey drops undefined context fields when computing the key", () => {
  // Two contexts that differ only in fields the caller chose not to set
  // (both undefined) must hash identically — same omission, same hash.
  const a = agentCallKey("p", {}, { launchCwd: "/x" });
  const b = agentCallKey(
    "p",
    {},
    {
      launchCwd: "/x",
      defaultModelId: undefined,
      defaultThinking: undefined,
    },
  );
  assert.equal(a, b);
});

test("agentCallKey changes when defaultProvider differs (same id, different provider)", () => {
  // Two parent models can share an `id` across providers (e.g. the same
  // model name offered by both anthropic and an openai-compatible mirror).
  // Without the provider in the key, a provider-only change would replay a
  // result produced by the wrong provider.
  const a = agentCallKey(
    "p",
    {},
    {
      launchCwd: "/x",
      defaultProvider: "anthropic",
      defaultModelId: "claude-sonnet-4-6",
      defaultThinking: "medium",
    },
  );
  const b = agentCallKey(
    "p",
    {},
    {
      launchCwd: "/x",
      defaultProvider: "openai",
      defaultModelId: "claude-sonnet-4-6",
      defaultThinking: "medium",
    },
  );
  assert.notEqual(a, b);
});

test("agentCallKey is stable when defaultProvider is absent on both sides", () => {
  // Same omission => same hash: two contexts that both omit defaultProvider
  // (one explicitly undefined, one just missing the field) must hash equal,
  // so legacy callers that never set provider keep replaying against
  // themselves.
  const a = agentCallKey("p", {}, { launchCwd: "/x", defaultModelId: "a" });
  const b = agentCallKey(
    "p",
    {},
    {
      launchCwd: "/x",
      defaultModelId: "a",
      defaultProvider: undefined,
    },
  );
  assert.equal(a, b);
});

test("agentCallKey allowlist exposes the expected fields and no others", () => {
  assert.deepEqual(
    [...HASHED_OPTION_KEYS],
    ["model", "provider", "effort", "schema", "writable", "cwd"],
  );
});

test("append + read round-trip preserves entries in seq order", () => {
  const dir = freshDir();
  try {
    appendJournalEntry(
      dir,
      baseEntry({
        key: "k1",
        seq: 2,
        index: 2,
        label: "b",
        result: { ok: true, output: "two" },
      }),
    );
    appendJournalEntry(
      dir,
      baseEntry({
        key: "k0",
        seq: 1,
        index: 1,
        label: "a",
        result: { ok: true, output: "one" },
      }),
    );
    const entries = readJournal(dir);
    assert.equal(entries.length, 2);
    assert.equal(entries[0].seq, 1);
    assert.equal(entries[1].seq, 2);
    assert.deepEqual(entries[0].result, { ok: true, output: "one" });
    assert.deepEqual(entries[1].result, { ok: true, output: "two" });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("readJournal returns [] when the file does not exist", () => {
  const dir = freshDir();
  try {
    assert.deepEqual(readJournal(dir), []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("readJournal drops a torn/invalid final line and keeps earlier entries", () => {
  const dir = freshDir();
  try {
    const valid = JSON.stringify(
      baseEntry({ key: "k1", seq: 1, finishedAt: 1 }),
    );
    writeFileSync(join(dir, "journal.jsonl"), `${valid}\n{this is not json`);
    const entries = readJournal(dir);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].key, "k1");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("readJournal drops a mid-file bad line and everything after it", () => {
  const dir = freshDir();
  try {
    const good1 = JSON.stringify(
      baseEntry({ key: "k1", seq: 1, finishedAt: 1 }),
    );
    const bad = JSON.stringify({ key: "wrong", seq: 2 }); // missing required fields
    const good3 = JSON.stringify(
      baseEntry({ key: "k3", seq: 3, index: 3, label: "c", finishedAt: 3 }),
    );
    writeFileSync(
      join(dir, "journal.jsonl"),
      [good1, bad, good3].join("\n") + "\n",
    );
    const entries = readJournal(dir);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].seq, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("createReplayIndex skips ok:false entries", () => {
  const entries: JournalEntry[] = [
    baseEntry({ key: "k1", seq: 1, finishedAt: 1, ok: true }),
    baseEntry({
      key: "k2",
      seq: 2,
      index: 2,
      label: "b",
      finishedAt: 2,
      ok: false,
    }),
    baseEntry({
      key: "k1",
      seq: 3,
      index: 3,
      label: "c",
      finishedAt: 3,
      ok: true,
    }),
  ];
  const replay = createReplayIndex(entries);
  assert.equal(replay.remaining(), 2);
  const first = replay.take("k1");
  assert.ok(first);
  assert.equal(first.seq, 1);
  const second = replay.take("k1");
  assert.ok(second);
  assert.equal(second.seq, 3);
  assert.equal(replay.take("k1"), undefined);
  assert.equal(replay.take("k2"), undefined, "ok:false must be skipped");
});

test("createReplayIndex hands out duplicate keys FIFO and returns undefined when exhausted", () => {
  const entries: JournalEntry[] = [
    baseEntry({ key: "k", seq: 1, finishedAt: 1 }),
    baseEntry({ key: "k", seq: 2, index: 2, label: "b", finishedAt: 2 }),
    baseEntry({ key: "k", seq: 3, index: 3, label: "c", finishedAt: 3 }),
  ];
  const replay = createReplayIndex(entries);
  const takenSeqs: number[] = [];
  while (true) {
    const entry = replay.take("k");
    if (!entry) break;
    takenSeqs.push(entry.seq);
  }
  assert.deepEqual(takenSeqs, [1, 2, 3]);
  assert.equal(replay.take("k"), undefined);
});

test("createReplayIndex.remaining() decrements as entries are taken", () => {
  const entries: JournalEntry[] = [
    baseEntry({ key: "a", seq: 1, finishedAt: 1 }),
    baseEntry({ key: "b", seq: 2, index: 2, label: "b", finishedAt: 2 }),
  ];
  const replay = createReplayIndex(entries);
  assert.equal(replay.remaining(), 2);
  replay.take("a");
  assert.equal(replay.remaining(), 1);
  replay.take("b");
  assert.equal(replay.remaining(), 0);
});

test("appendJournalEntry does not throw when the write fails", () => {
  const dir = freshDir();
  try {
    const obstacle = join(dir, "obstacle");
    writeFileSync(obstacle, "I am a file, not a directory");
    // runDir's parent is a regular file, so mkdirSync must fail.
    const runDir = join(obstacle, "journal");
    assert.doesNotThrow(() =>
      appendJournalEntry(runDir, baseEntry({ key: "k", seq: 1 })),
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
