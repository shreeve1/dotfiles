import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  recordDegradationOnce
} from "./chunk-JAU72XNY.js";

// dist/clients/deadline-utils.js
function combineAbortSignals(...signals) {
  const live = signals.filter((s) => s !== void 0);
  if (live.length <= 1)
    return live[0];
  if (typeof AbortSignal.any === "function")
    return AbortSignal.any(live);
  const controller = new AbortController();
  for (const s of live) {
    if (s.aborted) {
      controller.abort(s.reason);
      break;
    }
    s.addEventListener("abort", () => controller.abort(s.reason), {
      once: true
    });
  }
  return controller.signal;
}
function withDeadline(promise, options) {
  const onTimeout = options.onTimeout ?? "reject";
  const onReject = options.onReject ?? "propagate";
  const ms = options.ms ?? (options.deadlineAt !== void 0 ? options.deadlineAt - Date.now() : 0);
  if (ms <= 0) {
    promise.catch(() => {
    });
    return onTimeout === "undefined" ? Promise.resolve(void 0) : Promise.reject(new Error(`Timeout after ${Math.max(0, ms)}ms`));
  }
  const base = onReject === "undefined" ? promise.catch(() => void 0) : promise;
  if (onReject === "propagate")
    promise.catch(() => {
    });
  let timer;
  const timeoutPromise = new Promise((resolve, reject) => {
    timer = setTimeout(() => {
      if (onTimeout === "undefined")
        resolve(void 0);
      else
        reject(new Error(`Timeout after ${ms}ms`));
    }, ms);
  });
  return Promise.race([base, timeoutPromise]).finally(() => {
    if (timer)
      clearTimeout(timer);
  });
}
function withTimeout(promise, timeoutMs) {
  return withDeadline(promise, { ms: timeoutMs });
}
var BOUND_ABORTED = /* @__PURE__ */ Symbol("pi-lens/bounded/aborted");
async function bounded(promise, options) {
  const { signal, shutdownSignal, hook, label } = options;
  const ms = Number.isFinite(options.ms) ? Math.max(0, options.ms) : 0;
  const startedAt = Date.now();
  const boxed = promise.then((value) => ({ value }));
  void boxed.catch(() => {
  });
  let cause;
  let timer;
  let onCallerAbort;
  let onShutdownAbort;
  const abandoned = new Promise((resolve) => {
    const fire = (reason) => {
      cause ??= reason;
      resolve(BOUND_ABORTED);
    };
    if (signal?.aborted)
      return fire("caller-abort");
    if (shutdownSignal?.aborted)
      return fire("shutdown");
    if (ms <= 0)
      return fire("deadline");
    timer = setTimeout(() => fire("deadline"), ms);
    timer.unref?.();
    onCallerAbort = () => fire("caller-abort");
    signal?.addEventListener("abort", onCallerAbort, { once: true });
    if (shutdownSignal) {
      onShutdownAbort = () => fire("shutdown");
      shutdownSignal.addEventListener("abort", onShutdownAbort, {
        once: true
      });
    }
  });
  try {
    const settled = await Promise.race([boxed, abandoned]);
    if (settled !== BOUND_ABORTED)
      return settled.value;
    const elapsedMs = Date.now() - startedAt;
    const fired = cause ?? "deadline";
    if (fired === "deadline" || fired === "shutdown") {
      recordDegradationOnce({
        kind: fired === "deadline" ? "hook-await-exceeded" : "hook-await-abandoned",
        subject: `${hook}:${label}`,
        reason: fired === "deadline" ? `exceeded ${ms}ms budget after ${elapsedMs}ms` : `abandoned after ${elapsedMs}ms: session is shutting down (budget ${ms}ms)`,
        metadata: { hook, label, budgetMs: ms, elapsedMs, cause: fired }
      });
    }
    return void 0;
  } finally {
    if (timer !== void 0)
      clearTimeout(timer);
    if (onCallerAbort)
      signal?.removeEventListener("abort", onCallerAbort);
    if (onShutdownAbort) {
      shutdownSignal?.removeEventListener("abort", onShutdownAbort);
    }
  }
}

// dist/clients/hook-budgets.js
var HOOK_WALL_BUDGET_MS = Object.freeze({
  /** Visible startup work; the user is watching a progress line. */
  session_start: 5e3,
  /** Pure bookkeeping — nothing here may await (#2523 contract). */
  turn_start: 0,
  /** Measured p50 3687 ms / p90 14246 ms today. The gap IS the issue. */
  turn_end: 3e3,
  /** Measured p90 10043 ms today, from one unbounded pipeline re-entry. */
  agent_end: 1e3,
  /** The designated place for settled-time sweeps; the widest non-edit budget. */
  agent_settled: 1e4,
  /** Read/Grep/Glob/Bash: must never await analyzer bootstrap (AC5). */
  tool_result_read_only: 500,
  /** The ONLY path the contract lets block the host, and only this long. */
  tool_result_edit: 1e4,
  /** Replacement teardown is synchronous so its successor ordering is preserved (#3881). */
  session_shutdown: 0,
  /** The maintainer amendment permits quit-only sink draining before process exit (#2523). */
  session_shutdown_quit: 500,
  /** Synchronous message contribution; the host is blocked on the answer. */
  context: 0,
  /** Fork bookkeeping; the session is being replaced under it. */
  session_before_fork: 0
});
var HOOK_BUDGET_KEYS = Object.keys(HOOK_WALL_BUDGET_MS);

export {
  combineAbortSignals,
  withDeadline,
  withTimeout,
  bounded,
  HOOK_WALL_BUDGET_MS
};
