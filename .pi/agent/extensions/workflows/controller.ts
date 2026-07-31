import { resolveConcurrency, resolveMaxAgentCalls } from "./config.ts";

export const RUN_SHUTDOWN_TIMEOUT_MS = 8_000;

function abortError(signal: AbortSignal) {
  return signal.reason instanceof Error
    ? signal.reason
    : new Error("Workflow was aborted");
}

class Semaphore {
  private active = 0;
  private readonly limit: number;
  private queue: Array<{
    resolve: () => void;
    reject: (error: Error) => void;
    signal: AbortSignal;
    onAbort: () => void;
  }> = [];

  constructor(limit: number) {
    this.limit = limit;
  }

  acquire(signal: AbortSignal) {
    if (signal.aborted) return Promise.reject(abortError(signal));
    if (this.active < this.limit) {
      this.active++;
      return Promise.resolve();
    }
    return new Promise<void>((resolve, reject) => {
      const waiter = {
        resolve: () => {
          signal.removeEventListener("abort", onAbort);
          this.active++;
          resolve();
        },
        reject,
        signal,
        onAbort: () => {},
      };
      const onAbort = () => {
        const index = this.queue.indexOf(waiter);
        if (index >= 0) this.queue.splice(index, 1);
        reject(abortError(signal));
      };
      waiter.onAbort = onAbort;
      this.queue.push(waiter);
      signal.addEventListener("abort", onAbort, { once: true });
    });
  }

  release() {
    this.active = Math.max(0, this.active - 1);
    while (this.queue.length > 0) {
      const waiter = this.queue.shift()!;
      if (waiter.signal.aborted) {
        waiter.signal.removeEventListener("abort", waiter.onAbort);
        waiter.reject(abortError(waiter.signal));
        continue;
      }
      waiter.resolve();
      return;
    }
  }

  clear() {
    const queued = this.queue;
    this.queue = [];
    for (const waiter of queued) {
      waiter.signal.removeEventListener("abort", waiter.onAbort);
      waiter.reject(abortError(waiter.signal));
    }
  }
}

/** Cumulative run budget for cost (USD), tokens (input+output), and wall duration. */
export interface RunBudget {
  maxCost?: number;
  maxTokens?: number;
  maxDurationMs?: number;
}

/** Drop non-number / NaN / Infinity / non-positive budget fields so they
 *  behave as if unset. Defensive: callers should never see half-normalized
 *  budgets, and TypeBox validation already filters most junk upstream. */
function normalizeBudget(budget?: RunBudget): RunBudget {
  const out: RunBudget = {};
  if (!budget || typeof budget !== "object") return out;
  if (
    typeof budget.maxCost === "number" &&
    Number.isFinite(budget.maxCost) &&
    budget.maxCost > 0
  ) {
    out.maxCost = budget.maxCost;
  }
  if (
    typeof budget.maxTokens === "number" &&
    Number.isFinite(budget.maxTokens) &&
    budget.maxTokens > 0
  ) {
    out.maxTokens = budget.maxTokens;
  }
  if (
    typeof budget.maxDurationMs === "number" &&
    Number.isFinite(budget.maxDurationMs) &&
    budget.maxDurationMs > 0
  ) {
    out.maxDurationMs = budget.maxDurationMs;
  }
  return out;
}

/** Owns every agent task and the run-wide fanout/abort budget. */
export class RunController {
  private readonly abortController = new AbortController();
  private readonly maxCalls: number;
  private readonly semaphore: Semaphore;
  private readonly budget: RunBudget;
  private readonly startedAt = Date.now();
  private runningCost = 0;
  private runningTokens = 0;
  private readonly tasks = new Set<Promise<unknown>>();
  private callCount = 0;
  private overBudgetCalls = 0;
  private sealed = false;
  private parentAbort?: () => void;
  private parentSignal?: AbortSignal;
  private durationTimer?: ReturnType<typeof setTimeout>;

  constructor(
    parentSignal?: AbortSignal,
    concurrency = resolveConcurrency(),
    maxCalls = resolveMaxAgentCalls(),
    budget?: RunBudget,
  ) {
    this.maxCalls = Math.max(1, Math.floor(maxCalls));
    this.semaphore = new Semaphore(Math.max(1, Math.floor(concurrency)));
    this.budget = normalizeBudget(budget);
    if (this.budget.maxDurationMs !== undefined) {
      this.durationTimer = setTimeout(() => {
        this.abort("Workflow exceeded its duration budget");
      }, this.budget.maxDurationMs);
      this.durationTimer.unref?.();
    }
    if (parentSignal) {
      this.parentSignal = parentSignal;
      this.parentAbort = () => this.abort("Parent operation was aborted");
      if (parentSignal.aborted) this.parentAbort();
      else
        parentSignal.addEventListener("abort", this.parentAbort, {
          once: true,
        });
    }
  }

  get signal() {
    return this.abortController.signal;
  }

  get calls() {
    return this.callCount;
  }

  get refusedCalls() {
    return this.overBudgetCalls;
  }

  get maxAgentCalls() {
    return this.maxCalls;
  }

  get spentCost() {
    return this.runningCost;
  }

  get spentTokens() {
    return this.runningTokens;
  }

  /** Record one agent call's usage and trip the cost/token budget if either
   *  cumulative total now exceeds its configured cap. Missing / non-number /
   *  non-finite fields default to 0 so partial usage objects are safe. */
  recordUsage(usage: { cost?: number; input?: number; output?: number }): void {
    const finiteNumber = (value: unknown) =>
      typeof value === "number" && Number.isFinite(value) ? value : 0;
    const cost = finiteNumber(usage?.cost);
    const input = finiteNumber(usage?.input);
    const output = finiteNumber(usage?.output);
    this.runningCost += cost;
    this.runningTokens += input + output;
    if (
      this.budget.maxCost !== undefined &&
      this.runningCost > this.budget.maxCost
    ) {
      this.abort("Workflow exceeded its cost budget");
    }
    if (
      this.budget.maxTokens !== undefined &&
      this.runningTokens > this.budget.maxTokens
    ) {
      this.abort("Workflow exceeded its token budget");
    }
  }

  schedule<T>(
    task: (signal: AbortSignal) => Promise<T>,
    invocationSignal?: AbortSignal,
  ): Promise<T> {
    if (this.sealed) return Promise.reject(new Error("Workflow is settling"));
    if (this.signal.aborted) return Promise.reject(abortError(this.signal));
    if (
      this.budget.maxDurationMs !== undefined &&
      Date.now() - this.startedAt > this.budget.maxDurationMs
    ) {
      this.abort("Workflow exceeded its duration budget");
      return Promise.reject(new Error("Workflow exceeded its duration budget"));
    }
    if (this.callCount >= this.maxCalls) {
      // Reject the individual call so a script can still reduce what it has
      // and return. But a script that ignores the rejections (a runaway
      // `while (true) await agent()`) would spin forever, so once the number
      // of refused calls exceeds the budget itself the run is aborted. The
      // grace is deliberately far wider than any legitimate fan-out: a script
      // that fans out N thunks past the cap sees N ordinary failed results.
      this.overBudgetCalls++;
      if (this.overBudgetCalls > this.maxCalls) {
        this.abort("Workflow ignored the agent-call budget");
      }
      return Promise.reject(
        new Error(
          `Workflow exceeded the limit of ${this.maxCalls} agent calls`,
        ),
      );
    }
    this.callCount++;

    const running = (async () => {
      const taskAbort = new AbortController();
      const onRunAbort = () => taskAbort.abort(this.signal.reason);
      const onInvocationAbort = () => taskAbort.abort(invocationSignal?.reason);
      this.signal.addEventListener("abort", onRunAbort, { once: true });
      invocationSignal?.addEventListener("abort", onInvocationAbort, {
        once: true,
      });
      if (this.signal.aborted) onRunAbort();
      else if (invocationSignal?.aborted) onInvocationAbort();

      let acquired = false;
      try {
        await this.semaphore.acquire(taskAbort.signal);
        acquired = true;
        if (taskAbort.signal.aborted) throw abortError(taskAbort.signal);
        const result = await task(taskAbort.signal);
        if (invocationSignal?.aborted) throw abortError(invocationSignal);
        return result;
      } finally {
        this.signal.removeEventListener("abort", onRunAbort);
        invocationSignal?.removeEventListener("abort", onInvocationAbort);
        if (acquired) this.semaphore.release();
      }
    })();
    this.tasks.add(running);
    void running.finally(() => this.tasks.delete(running)).catch(() => {});
    return running;
  }

  abort(reason = "Workflow was aborted") {
    if (!this.signal.aborted) this.abortController.abort(new Error(reason));
    this.semaphore.clear();
  }

  /** Seal the task registry and wait a bounded time for every task to settle. */
  async settle(options: { abort?: boolean; timeoutMs?: number } = {}) {
    this.sealed = true;
    if (options.abort) this.abort();
    const tasks = [...this.tasks];
    if (tasks.length === 0) {
      this.detachParent();
      return true;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<false>((resolve) => {
      timer = setTimeout(
        () => resolve(false),
        options.timeoutMs ?? RUN_SHUTDOWN_TIMEOUT_MS,
      );
      timer.unref?.();
    });
    const settled = Promise.allSettled(tasks).then(() => true as const);
    const completed = await Promise.race([settled, timeout]);
    if (timer) clearTimeout(timer);
    this.detachParent();
    return completed;
  }

  private detachParent() {
    if (this.durationTimer) {
      clearTimeout(this.durationTimer);
      this.durationTimer = undefined;
    }
    if (this.parentAbort) {
      this.parentSignal?.removeEventListener("abort", this.parentAbort);
    }
    this.parentAbort = undefined;
    this.parentSignal = undefined;
  }
}
