import assert from "node:assert/strict";
import { test } from "node:test";
import {
  matchPendingCheckpoint,
  parseBudgetArg,
  resolveCheckpointReplay,
} from "./index.ts";
import { RunController } from "./controller.ts";

test("parseBudgetArg: undefined input → undefined output", () => {
  assert.equal(parseBudgetArg(undefined), undefined);
});

test("parseBudgetArg: empty object → empty budget (no fields)", () => {
  assert.deepEqual(parseBudgetArg({}), {});
});

test("parseBudgetArg: single maxCost preserved", () => {
  assert.deepEqual(parseBudgetArg({ maxCost: 1.5 }), { maxCost: 1.5 });
});

test("parseBudgetArg: non-number fields dropped", () => {
  assert.deepEqual(
    parseBudgetArg({ maxCost: "x", maxTokens: 100 } as {
      maxCost?: number;
      maxTokens?: number;
      maxDurationMs?: number;
    }),
    { maxTokens: 100 },
  );
});

test("parseBudgetArg: all three fields preserved", () => {
  assert.deepEqual(
    parseBudgetArg({ maxCost: 0.5, maxTokens: 2_000, maxDurationMs: 10_000 }),
    { maxCost: 0.5, maxTokens: 2_000, maxDurationMs: 10_000 },
  );
});

test("matchPendingCheckpoint: empty map → undefined", () => {
  const pending = new Map<number, { name: string }>();
  assert.equal(matchPendingCheckpoint(pending, "any"), undefined);
});

test("matchPendingCheckpoint: single match returns its id", () => {
  const pending = new Map<number, { name: string }>([[7, { name: "alpha" }]]);
  assert.equal(matchPendingCheckpoint(pending, "alpha"), 7);
});

test("matchPendingCheckpoint: no match → undefined", () => {
  const pending = new Map<number, { name: string }>([[7, { name: "alpha" }]]);
  assert.equal(matchPendingCheckpoint(pending, "beta"), undefined);
});

test("matchPendingCheckpoint: two entries with same name → first inserted id (FIFO)", () => {
  const pending = new Map<number, { name: string }>([
    [11, { name: "alpha" }],
    [22, { name: "alpha" }],
  ]);
  assert.equal(matchPendingCheckpoint(pending, "alpha"), 11);
});

test("matchPendingCheckpoint: distinct names match the right one", () => {
  const pending = new Map<number, { name: string }>([
    [1, { name: "alpha" }],
    [2, { name: "beta" }],
    [3, { name: "gamma" }],
  ]);
  assert.equal(matchPendingCheckpoint(pending, "beta"), 2);
});

test("resolveCheckpointReplay: replayDecision 'approved' works in foreground", () => {
  assert.deepEqual(
    resolveCheckpointReplay({
      replayDecision: "approved",
      background: false,
    }),
    { action: "replay", decision: "approved" },
  );
});

test("resolveCheckpointReplay: replayDecision 'rejected' works in background", () => {
  assert.deepEqual(
    resolveCheckpointReplay({
      replayDecision: "rejected",
      background: true,
    }),
    { action: "replay", decision: "rejected" },
  );
});

test("resolveCheckpointReplay: no replayDecision + background → prompt", () => {
  assert.deepEqual(resolveCheckpointReplay({ background: true }), {
    action: "prompt",
  });
});

test("resolveCheckpointReplay: no replayDecision + foreground → reject-foreground", () => {
  assert.deepEqual(resolveCheckpointReplay({ background: false }), {
    action: "reject-foreground",
  });
});

test("integration: parseBudgetArg → RunController cost budget aborts on overrun", () => {
  const controller = new RunController(
    undefined,
    undefined,
    undefined,
    parseBudgetArg({ maxCost: 0.01 }),
  );
  assert.equal(controller.signal.aborted, false);
  controller.recordUsage({ cost: 0.02 });
  assert.equal(controller.signal.aborted, true);
  assert.match(String(controller.signal.reason), /cost budget/);
  void controller.settle({ abort: true });
});

test("integration: parseBudgetArg(undefined) → no cost budget, no abort", () => {
  const controller = new RunController(
    undefined,
    undefined,
    undefined,
    parseBudgetArg(undefined),
  );
  controller.recordUsage({ cost: 999 });
  assert.equal(controller.signal.aborted, false);
  void controller.settle();
});
