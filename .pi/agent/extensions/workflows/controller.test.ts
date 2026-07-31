import assert from "node:assert/strict";
import { test } from "node:test";
import { RunController } from "./controller.ts";

const delay = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

test("RunController reserves calls synchronously and caps global fanout", async () => {
  const controller = new RunController(undefined, 4);
  let active = 0;
  let peak = 0;
  const tasks = Array.from({ length: 12 }, (_, index) =>
    controller.schedule(async () => {
      active++;
      peak = Math.max(peak, active);
      await delay(5);
      active--;
      return index;
    }),
  );
  assert.deepEqual(
    await Promise.all(tasks),
    Array.from({ length: 12 }, (_, i) => i),
  );
  assert.equal(peak, 4);
  assert.equal(await controller.settle(), true);
});

test("RunController honours concurrency above the previous 4-task floor", async () => {
  const controller = new RunController(undefined, 8);
  let active = 0;
  let peak = 0;
  const tasks = Array.from({ length: 8 }, (_, index) =>
    controller.schedule(async () => {
      active++;
      peak = Math.max(peak, active);
      await delay(10);
      active--;
      return index;
    }),
  );
  assert.deepEqual(
    await Promise.all(tasks),
    Array.from({ length: 8 }, (_, i) => i),
  );
  assert.equal(peak, 8);
  assert.equal(await controller.settle(), true);
});

test("RunController propagates invocation cancellation without aborting the run", async () => {
  const controller = new RunController(undefined, 1);
  const invocation = new AbortController();
  const pending = controller.schedule(
    (signal) =>
      new Promise<string>((resolve) => {
        signal.addEventListener("abort", () => resolve("stopped"), {
          once: true,
        });
      }),
    invocation.signal,
  );

  invocation.abort(new Error("Workflow agent request was cancelled"));
  await assert.rejects(pending, /request was cancelled/);
  assert.equal(controller.signal.aborted, false);
  assert.equal(await controller.schedule(async () => "recovered"), "recovered");
  assert.equal(await controller.settle(), true);
});

test("RunController refuses over-budget calls without aborting the run", async () => {
  const controller = new RunController(undefined, 2, 3);
  // Work scheduled while the budget still had room must survive: the whole
  // point of a soft refusal is that a script can reduce what it already has.
  const early = controller.schedule(async () => "early");
  const alsoEarly = Array.from({ length: 2 }, () =>
    controller.schedule(async () => "queued"),
  );
  await assert.rejects(
    controller.schedule(async () => "too many"),
    /exceeded the limit of 3 agent calls/,
  );
  assert.equal(controller.maxAgentCalls, 3);
  assert.equal(controller.refusedCalls, 1);
  // The regression guard: an over-budget call rejects on its own; it must not
  // take the run down with it.
  assert.equal(controller.signal.aborted, false);
  assert.equal(await early, "early");
  assert.deepEqual(await Promise.all(alsoEarly), ["queued", "queued"]);
  assert.equal(await controller.settle({ abort: true }), true);
});

test("RunController aborts a script that ignores the budget refusals", async () => {
  const controller = new RunController(undefined, 2, 3);
  for (let i = 0; i < 3; i++) {
    assert.equal(await controller.schedule(async () => "ok"), "ok");
  }

  const blocker = controller.schedule(
    (signal) =>
      new Promise<void>((resolve) =>
        signal.addEventListener("abort", () => resolve(), { once: true }),
      ),
  );
  await assert.rejects(blocker, /exceeded the limit of 3 agent calls/);

  // Refusals up to and including maxCalls leave the run alive.
  for (let i = 2; i <= 3; i++) {
    await assert.rejects(
      controller.schedule(async () => "refused"),
      /exceeded the limit of 3 agent calls/,
    );
    assert.equal(controller.refusedCalls, i);
    assert.equal(controller.signal.aborted, false);
  }

  // One past the grace window trips the runaway guard.
  await assert.rejects(
    controller.schedule(async () => "refused"),
    /exceeded the limit of 3 agent calls/,
  );
  assert.equal(controller.refusedCalls, 4);
  assert.equal(controller.signal.aborted, true);
  assert.match(
    String(controller.signal.reason),
    /ignored the agent-call budget/,
  );

  // Once aborted, queued work rejects via the cleared semaphore.
  const results = await Promise.allSettled([
    controller.schedule(async () => "after abort"),
  ]);
  assert.ok(results.every((result) => result.status === "rejected"));
  assert.equal(await controller.settle({ abort: true }), true);
});

test("RunController accumulates cost and aborts when maxCost exceeded", async () => {
  const controller = new RunController(undefined, undefined, undefined, {
    maxCost: 0.05,
  });
  controller.recordUsage({ cost: 0.03 });
  assert.equal(controller.signal.aborted, false);
  assert.equal(controller.spentCost, 0.03);
  controller.recordUsage({ cost: 0.04 });
  assert.equal(controller.signal.aborted, true);
  assert.match(String(controller.signal.reason), /cost budget/);
  assert.equal(await controller.settle({ abort: true }), true);
});

test("RunController aborts when maxTokens exceeded", async () => {
  const controller = new RunController(undefined, undefined, undefined, {
    maxTokens: 1_000,
  });
  controller.recordUsage({ input: 800, output: 0 });
  assert.equal(controller.signal.aborted, false);
  assert.equal(controller.spentTokens, 800);
  controller.recordUsage({ input: 300, output: 100 });
  assert.equal(controller.signal.aborted, true);
  assert.match(String(controller.signal.reason), /token budget/);
  assert.equal(await controller.settle({ abort: true }), true);
});

test("RunController rejects schedule when maxDurationMs already exceeded", async () => {
  const controller = new RunController(undefined, undefined, undefined, {
    maxDurationMs: 1,
  });
  await delay(5);
  await assert.rejects(
    controller.schedule(async () => "should not run"),
    /exceeded its duration budget/,
  );
  assert.equal(controller.signal.aborted, true);
  assert.match(
    String(controller.signal.reason),
    /exceeded its duration budget/,
  );
  assert.equal(await controller.settle({ abort: true }), true);
});

test("RunController with no budget behaves exactly as before", async () => {
  const controller = new RunController();
  assert.equal(controller.spentCost, 0);
  assert.equal(controller.spentTokens, 0);
  assert.equal(await controller.schedule(async () => 42), 42);
  assert.equal(controller.signal.aborted, false);
  // Negative / NaN fields are still numeric, but no budget gate is set so
  // they never trip the abort.
  controller.recordUsage({ cost: -1, input: Number.NaN });
  assert.equal(controller.spentCost, -1);
  assert.equal(controller.spentTokens, 0);
  assert.equal(controller.signal.aborted, false);
  assert.equal(await controller.settle(), true);
});

test("RunController aborts via wall-clock timer when maxDurationMs elapses with no further calls", async () => {
  const controller = new RunController(undefined, undefined, undefined, {
    maxDurationMs: 20,
  });
  assert.equal(controller.signal.aborted, false);
  await delay(40);
  assert.equal(controller.signal.aborted, true);
  assert.match((controller.signal.reason as Error).message, /duration budget/);
  assert.equal(await controller.settle({ abort: true }), true);
});

test("RunController duration timer is cleared on settle (zero-task path)", async () => {
  const c = new RunController(undefined, undefined, undefined, {
    maxDurationMs: 20,
  });
  await c.settle(); // no tasks were scheduled → zero-task settle branch
  await new Promise((r) => setTimeout(r, 40)); // past the deadline
  assert.equal(c.signal.aborted, false); // timer was cleared, no spurious abort
});

test("RunController duration timer is cleared on settle (after an active task)", async () => {
  const c = new RunController(undefined, undefined, undefined, {
    maxDurationMs: 20,
  });
  await c.schedule(async () => "ok"); // one task runs and completes
  await c.settle();
  await new Promise((r) => setTimeout(r, 40)); // past the deadline
  assert.equal(c.signal.aborted, false); // timer cleared despite the deadline passing
});
