import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  recordDegradationOnce
} from "./chunk-2453RRJ2.js";

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
function untilAborted(work, signal, aborted) {
  if (!signal)
    return work;
  if (signal.aborted)
    return Promise.race([work, Promise.resolve(aborted)]);
  let onAbort;
  const abortedPromise = new Promise((resolve) => {
    onAbort = () => resolve(aborted);
    signal.addEventListener("abort", onAbort, { once: true });
  });
  return Promise.race([work, abortedPromise]).finally(() => {
    if (onAbort)
      signal.removeEventListener("abort", onAbort);
  });
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

export {
  combineAbortSignals,
  untilAborted,
  withDeadline,
  withTimeout,
  bounded
};
