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

test("RunController enforces call budget and aborts queued tasks", async () => {
  const controller = new RunController(undefined, 1, 3);
  const blocker = controller.schedule(
    (signal) =>
      new Promise<void>((resolve) =>
        signal.addEventListener("abort", () => resolve(), { once: true }),
      ),
  );
  const queued = Array.from({ length: 2 }, () =>
    controller.schedule(async () => "queued"),
  );
  await assert.rejects(
    controller.schedule(async () => "too many"),
    /exceeded the limit of 3 agent calls/,
  );
  assert.equal(controller.maxAgentCalls, 3);
  // Schedule calls past the budget must abort the run, not just reject the
  // call. A rejected-only behavior would let a runaway `while(true) await
  // agent()` loop forever — the controller must hard-abort so the parent
  // loop sees the aborted signal.
  assert.equal(controller.signal.aborted, true);
  assert.match(String(controller.signal.reason), /agent-call budget/);
  // The blocker IIFE was in flight when the budget aborted synchronously
  // inside schedule(); its task never starts, so the schedule promise
  // rejects with the abort reason rather than hanging. Queued tasks reject
  // the same way via the cleared semaphore.
  await assert.rejects(blocker, /agent-call budget/);
  const results = await Promise.allSettled(queued);
  assert.ok(results.every((result) => result.status === "rejected"));
  assert.equal(await controller.settle({ abort: true }), true);
});
