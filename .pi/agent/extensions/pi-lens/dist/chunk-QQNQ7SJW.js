import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  createNdjsonLogger,
  getGlobalPiLensLogDir,
  getMaxLogSizeMB,
  getTurnId,
  isTestMode
} from "./chunk-AOHZU2BM.js";
import {
  normalizeLoggedPath
} from "./chunk-N2H3ZPZY.js";

// dist/clients/latency-logger.js
import * as path from "node:path";
var LATENCY_LOG_DIR = getGlobalPiLensLogDir();
var LATENCY_LOG_FILE = path.join(LATENCY_LOG_DIR, "latency.log");
var writer = createNdjsonLogger({
  filePath: LATENCY_LOG_FILE,
  maxBytes: getMaxLogSizeMB() * 1024 * 1024
});
var RECENT_PHASE_CAP = 5;
var recentPhases = [];
var LAST_PHASE_EXCLUDED = /* @__PURE__ */ new Set([
  "loop_block",
  "lsp_typescript_project_identity",
  "advisory_provenance_decision",
  "authoritative_content_attachment_decision",
  "agent_end_deferred_mutation_drain",
  "agent_end_deferred_mutation_requeue",
  "session_end_bus_rollup",
  "cache_usage_summary",
  "test_runner_failed_target_state",
  "turn_end_test_selection",
  "lsp_aux_wait_outcome",
  "tool_set_mutation",
  "availability_decision",
  "finding_dead_path_drop",
  "finding_stale_line_demote",
  "finding_path_stat_budget_exhausted",
  "lsp_scanner_coverage_gap",
  "lsp_notify_resync_deferred",
  "lsp_notify_write_late_landed",
  "lsp_notify_stall_cpu_busy",
  "degradation_ledger",
  "path_attribution_verified_rollup",
  "concurrent_session_bind_rollup",
  "auxiliary_readiness",
  "lsp_empty_first_publish_held",
  "lsp_diagnostics_fence",
  "lsp_rules_refreshed",
  "read_guard_conversation_read",
  "read_widening_note",
  "session_handoff_slot",
  "session_handoff_adopt",
  "session_store_action",
  "session_end_fence_rollup",
  "format_late_resync_chained"
]);
var liveBrackets = /* @__PURE__ */ new Map();
var closedBrackets = [];
function phaseStarted(phase) {
  const token = { phase, startedAt: (/* @__PURE__ */ new Date()).toISOString() };
  liveBrackets.set(token, true);
  return token;
}
function phaseFinished(token) {
  if (!liveBrackets.delete(token))
    return;
  closedBrackets = [
    {
      phase: token.phase,
      startedAt: token.startedAt,
      closedAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    ...closedBrackets
  ].slice(0, RECENT_PHASE_CAP);
}
var oncePerSessionPhases = /* @__PURE__ */ new Set();
var sessionRecordSeq = 0;
function mintSessionRecordId() {
  sessionRecordSeq += 1;
  return `${process.pid.toString(36)}-${Date.now().toString(36)}-${sessionRecordSeq.toString(36)}`;
}
var sessionRecordId = mintSessionRecordId();
function currentSessionRecordId() {
  return sessionRecordId;
}
function claimKey(phase, scope) {
  return `${phase}\0${scope}`;
}
function claimPhaseOncePerSession(phase, scope) {
  const key = claimKey(phase, scope);
  if (oncePerSessionPhases.has(key))
    return false;
  oncePerSessionPhases.add(key);
  return true;
}
function releasePhaseClaim(phase, scope) {
  oncePerSessionPhases.delete(claimKey(phase, scope));
}
function logLatency(entry) {
  const ts = (/* @__PURE__ */ new Date()).toISOString();
  if (entry.type === "phase" && entry.phase && !LAST_PHASE_EXCLUDED.has(entry.phase)) {
    recentPhases = [
      { phase: entry.phase, ts, metadata: entry.metadata },
      ...recentPhases
    ].slice(0, RECENT_PHASE_CAP);
  }
  if (isTestMode()) {
    return;
  }
  writer.log({
    ...entry,
    ts,
    pid: process.pid,
    turnId: entry.turnId ?? getTurnId(),
    filePath: normalizeLoggedPath(entry.filePath)
  });
}

export {
  phaseStarted,
  phaseFinished,
  currentSessionRecordId,
  claimPhaseOncePerSession,
  releasePhaseClaim,
  logLatency
};
