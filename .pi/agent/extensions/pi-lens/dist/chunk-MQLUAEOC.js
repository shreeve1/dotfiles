import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  logLatency
} from "./chunk-QQNQ7SJW.js";
import {
  getProcessSingleton
} from "./chunk-AOHZU2BM.js";

// dist/clients/lsp/workspace-sweep-hold.js
var SWEEP_IDLE_SAFETY_MARGIN_MS = 6e4;
var WORKSPACE_SWEEP_HOLD_FAMILY = "lsp.workspace-sweep-hold";
var WORKSPACE_SWEEP_HOLD_VERSION = 1;
function state() {
  return getProcessSingleton(WORKSPACE_SWEEP_HOLD_FAMILY, WORKSPACE_SWEEP_HOLD_VERSION, () => ({ holds: /* @__PURE__ */ new Map(), nextHoldId: 1, idleWaiters: [] }));
}
function flushIdleWaitersIfEmpty() {
  const current = state();
  if (current.holds.size > 0)
    return;
  if (current.idleWaiters.length === 0)
    return;
  const waiters = current.idleWaiters;
  current.idleWaiters = [];
  for (const waiter of waiters) {
    try {
      waiter();
    } catch {
    }
  }
}
function getWorkspaceSweepMaxHoldAgeMs() {
  return getFullScanWallClockMs() + SWEEP_IDLE_SAFETY_MARGIN_MS;
}
function reapStaleHolds() {
  const current = state();
  if (current.holds.size === 0)
    return;
  const maxAgeMs = getWorkspaceSweepMaxHoldAgeMs();
  const now = Date.now();
  for (const [holdId, acquiredAt] of current.holds) {
    const ageMs = now - acquiredAt;
    if (ageMs <= maxAgeMs)
      continue;
    current.holds.delete(holdId);
    logLatency({
      type: "phase",
      phase: "lsp_workspace_sweep_hold_force_released",
      filePath: "",
      durationMs: ageMs,
      metadata: { holdId, maxHoldAgeMs: maxAgeMs }
    });
  }
  flushIdleWaitersIfEmpty();
}
function acquireWorkspaceSweepHold() {
  const current = state();
  const holdId = current.nextHoldId++;
  current.holds.set(holdId, Date.now());
  return () => {
    if (!state().holds.delete(holdId))
      return;
    flushIdleWaitersIfEmpty();
  };
}
function isWorkspaceSweepActive() {
  reapStaleHolds();
  return state().holds.size > 0;
}
function runWhenWorkspaceSweepIdle(cb) {
  reapStaleHolds();
  const current = state();
  if (current.holds.size === 0) {
    cb();
    return;
  }
  current.idleWaiters.push(cb);
}
function clearWorkspaceSweepHoldForSessionStart() {
  const current = state();
  if (current.holds.size === 0)
    return;
  logLatency({
    type: "phase",
    phase: "lsp_workspace_sweep_hold_session_reset",
    filePath: "",
    durationMs: 0,
    metadata: { clearedHolds: current.holds.size }
  });
  current.holds.clear();
  flushIdleWaitersIfEmpty();
}
function getFullScanWallClockMs() {
  const raw = Number(process.env.PI_LENS_LENS_DIAGNOSTICS_FULL_TIMEOUT_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : 3e5;
}

// dist/clients/lsp/service-singleton.js
var LSP_SERVICE_FAMILY = "lsp.service";
var LSP_SERVICE_VERSION = 2;
function state2() {
  return getProcessSingleton(LSP_SERVICE_FAMILY, LSP_SERVICE_VERSION, () => ({
    service: null,
    generationHandoff: void 0,
    lifecycle: void 0
  }), (value) => {
    const previous = value;
    const service = previous.service;
    if (!service || typeof service.shutdown !== "function")
      return;
    void Promise.resolve(service.shutdown({
      fast: true,
      reason: "process_singleton_reset"
    })).catch(() => void 0);
  });
}
function configureLspServiceLifecycle(lifecycle) {
  state2().lifecycle = lifecycle;
}
function getOwnedLspService() {
  const current = state2();
  if (!current.lifecycle) {
    throw new Error("LSP service lifecycle is not configured");
  }
  if (!current.service) {
    current.service = current.lifecycle.create(current.generationHandoff);
  }
  return current.service;
}
function peekOwnedLspService() {
  return state2().service ?? void 0;
}
function resetOwnedLspService(options = {}) {
  const current = state2();
  if (options.reason === "session_start") {
    clearWorkspaceSweepHoldForSessionStart();
  }
  current.lifecycle?.beforeReset(options);
  const retiringService = current.service;
  current.service = null;
  if (!retiringService || !current.lifecycle)
    return;
  const teardown = current.lifecycle.destroy(retiringService, options);
  const pending = current.generationHandoff ? [current.generationHandoff, teardown] : [teardown];
  const handoff = Promise.allSettled(pending).then(() => void 0);
  current.generationHandoff = handoff;
  void handoff.then(() => {
    if (current.generationHandoff === handoff)
      current.generationHandoff = void 0;
  });
}

export {
  SWEEP_IDLE_SAFETY_MARGIN_MS,
  acquireWorkspaceSweepHold,
  isWorkspaceSweepActive,
  runWhenWorkspaceSweepIdle,
  getFullScanWallClockMs,
  configureLspServiceLifecycle,
  getOwnedLspService,
  peekOwnedLspService,
  resetOwnedLspService
};
