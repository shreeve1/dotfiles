import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  getProjectDataDir
} from "./chunk-C34ZXZ7O.js";
import {
  createNdjsonLogger,
  getGlobalPiLensLogDir,
  getProcessSingleton,
  getTurnId,
  isTestMode
} from "./chunk-AOHZU2BM.js";
import {
  BoundedFifoMap
} from "./chunk-ABBOA7UD.js";
import {
  normalizeFilePath,
  normalizeMapKey
} from "./chunk-N2H3ZPZY.js";

// dist/clients/hashline-anchor.js
var HASHLINE_ANCHOR_LENGTH = 3;
var ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
var HASH_SPACE = ALPHABET.length ** HASHLINE_ANCHOR_LENGTH;
var HASH_PROBE_STRIDE = ALPHABET.length ** 2 + ALPHABET.length + 1;
var BITSET_WORDS = Math.ceil(HASH_SPACE / 32);
var MAX_ANCHOR_FILE_BYTES = 4 * 1024 * 1024;
var ANCHOR_INDEX_CACHE_LIMIT = 8;
var ANCHOR_INDEX_CACHE = new BoundedFifoMap(ANCHOR_INDEX_CACHE_LIMIT);

// dist/clients/mutation-attribution.js
import * as fs from "node:fs";
import * as path from "node:path";
var MUTATION_ATTRIBUTION_FILE_VERSION = 1;
var MUTATION_ATTRIBUTION_FILE = "observed-mutating-tools.json";
var MUTATION_ATTRIBUTION_MAX_TOOLS = 64;
var ATTRIBUTION_FAMILY = "mutation-attribution";
var ATTRIBUTION_VERSION = 2;
function state() {
  return getProcessSingleton(ATTRIBUTION_FAMILY, ATTRIBUTION_VERSION, () => ({
    session: new BoundedFifoMap(MUTATION_ATTRIBUTION_MAX_TOOLS),
    fromDisk: void 0,
    primedCwd: void 0
  }));
}
function attributionFilePath(cwd) {
  return path.join(getProjectDataDir(cwd), MUTATION_ATTRIBUTION_FILE);
}
function isPersistedEntry(entry) {
  const candidate = entry;
  return typeof candidate?.name === "string" && candidate.name.length > 0 && typeof candidate.observations === "number";
}
function readPersisted(cwd) {
  try {
    const raw = fs.readFileSync(attributionFilePath(cwd), "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed?.version !== MUTATION_ATTRIBUTION_FILE_VERSION)
      return void 0;
    if (!Array.isArray(parsed.tools))
      return void 0;
    return {
      version: MUTATION_ATTRIBUTION_FILE_VERSION,
      tools: parsed.tools.filter(isPersistedEntry).slice(0, MUTATION_ATTRIBUTION_MAX_TOOLS).map((entry) => ({
        name: entry.name,
        observations: entry.observations,
        lastSeen: typeof entry.lastSeen === "number" ? entry.lastSeen : 0
      }))
    };
  } catch {
    return void 0;
  }
}
function primePersistedMutationAttribution(cwd) {
  const current = state();
  current.primedCwd = cwd;
  current.fromDisk = /* @__PURE__ */ new Set();
  if (!cwd)
    return;
  const file = readPersisted(cwd);
  if (!file)
    return;
  for (const entry of file.tools)
    current.fromDisk.add(entry.name);
}
function resetMutationAttribution() {
  const current = state();
  current.session.clear();
  current.fromDisk = void 0;
  current.primedCwd = void 0;
}

// dist/clients/read-guard-logger.js
import * as path3 from "node:path";

// dist/clients/finding-identity.js
import { createHash } from "node:crypto";
import * as path2 from "node:path";
var FINDING_ID_HASH_LENGTH = 12;
function normalizeMessage(message) {
  return message.replace(/\s+/g, " ").trim().toLowerCase();
}
function hashText(value, length = FINDING_ID_HASH_LENGTH) {
  return createHash("sha256").update(value).digest("hex").slice(0, length);
}
function relativeFile(filePath, cwd) {
  const canonicalCwd = normalizeMapKey(cwd);
  const canonicalFile = normalizeMapKey(filePath);
  const rel = path2.relative(canonicalCwd, canonicalFile).replace(/\\/g, "/");
  return rel && !rel.startsWith("..") ? rel : canonicalFile;
}
function stableFindingId(prefix, args) {
  const joined = [
    relativeFile(args.filePath, args.cwd),
    ...args.parts.map((part) => part === void 0 || part === null ? "" : String(part))
  ].join("|");
  return `${prefix}${hashText(joined)}`;
}

// dist/clients/read-guard-logger.js
var READ_GUARD_LOG_DIR = getGlobalPiLensLogDir();
var READ_GUARD_LOG_FILE = path3.join(READ_GUARD_LOG_DIR, "read-guard.log");
var READ_GUARD_LOG_BACKUP_FILE = path3.join(READ_GUARD_LOG_DIR, "read-guard.log.1");
var MAX_LOG_BYTES = Math.max(128 * 1024, Number.parseInt(process.env.PI_LENS_READ_GUARD_MAX_BYTES ?? "1048576", 10) || 1048576);
var writer = createNdjsonLogger({
  filePath: READ_GUARD_LOG_FILE,
  maxBytes: MAX_LOG_BYTES,
  backupPath: READ_GUARD_LOG_BACKUP_FILE
});
var VERBOSE_READ_GUARD_LOG = process.env.PI_LENS_READ_GUARD_VERBOSE === "1" || process.env.PI_LENS_READ_GUARD_LOG === "verbose";
var LOG_ALLOWED_EDITS = process.env.PI_LENS_READ_GUARD_LOG_ALLOWS === "1";
var SNAPSHOT_LOG_SETTING = (process.env.PI_LENS_READ_GUARD_LOG_SNAPSHOTS ?? "1").toLowerCase();
var LOG_SNAPSHOT_VALIDATION = !["0", "false", "off"].includes(SNAPSHOT_LOG_SETTING);
var MAX_EDIT_BATCH_ITEMS = 100;
var generatedCorrelationCounter = 0;
var CORRELATION_ID_MAX = 64;
var CORRELATION_ID_HASH_LENGTH = 16;
function sanitizeCorrelationId(value) {
  if (typeof value !== "string" && typeof value !== "number")
    return void 0;
  const trimmed = String(value).trim();
  const sanitized = trimmed.replace(/[^a-zA-Z0-9._:-]/g, "_");
  if (sanitized.length <= CORRELATION_ID_MAX) {
    return sanitized.length > 0 ? sanitized : void 0;
  }
  const prefixLength = CORRELATION_ID_MAX - CORRELATION_ID_HASH_LENGTH - 1;
  return `${sanitized.slice(0, prefixLength)}-${hashText(trimmed, CORRELATION_ID_HASH_LENGTH)}`;
}
function getReadGuardCorrelationId(event) {
  const value = event ?? {};
  const details = value.details ?? {};
  for (const candidate of [
    details.readGuardCorrelationId,
    details.toolCallId,
    value.toolCallId,
    value.callId,
    value.requestId,
    value.id
  ]) {
    const sanitized = sanitizeCorrelationId(candidate);
    if (sanitized)
      return sanitized;
  }
  generatedCorrelationCounter = (generatedCorrelationCounter + 1) % 1e6;
  return `rg-${Date.now().toString(36)}-${generatedCorrelationCounter}`;
}
function validIndexes(indexes) {
  return indexes.filter((index) => Number.isInteger(index) && index >= 0);
}
function boundedEditIndexes(indexes) {
  return [...new Set(validIndexes(indexes))].slice(0, MAX_EDIT_BATCH_ITEMS);
}
function createReadGuardEditBatchSummary(args) {
  const requestedSource = validIndexes(args.requestedIndexes);
  const resolvedSource = validIndexes(args.resolvedIndexes ?? []);
  const rejectedSource = (args.rejectedReasons ?? []).filter((entry) => Number.isInteger(entry.index) && entry.index >= 0);
  const appliedSource = validIndexes(args.appliedIndexes ?? []);
  const alreadyAppliedSource = validIndexes(args.alreadyAppliedIndexes ?? []);
  const requestedIndexes = boundedEditIndexes(requestedSource);
  const resolvedIndexes = boundedEditIndexes(resolvedSource);
  const rejectedReasons = rejectedSource.slice(0, MAX_EDIT_BATCH_ITEMS);
  const rejectedIndexes = boundedEditIndexes(rejectedSource.map((entry) => entry.index));
  const appliedIndexes = boundedEditIndexes(appliedSource);
  const alreadyAppliedIndexes = boundedEditIndexes(alreadyAppliedSource);
  const participantSource = (args.participantIds ?? []).filter((id) => typeof id === "string" && id.length > 0);
  const participantIds = [...new Set(participantSource)].slice(0, MAX_EDIT_BATCH_ITEMS);
  const commitStatus = args.commitStatus ?? "not_attempted";
  const postEditStatus = args.postEditStatus ?? "not_run";
  const terminalStatus = args.terminalStatus ?? (postEditStatus === "failed" || commitStatus === "failed" ? "failed" : commitStatus === "not_attempted" && rejectedSource.length > 0 ? "blocked" : commitStatus === "no_changes" ? "skipped" : "success");
  return {
    requestedCount: requestedSource.length,
    requestedTotal: args.requestedTotal ?? requestedSource.length,
    requestedIndexes,
    resolvedCount: resolvedSource.length,
    resolvedTotal: args.resolvedTotal ?? resolvedSource.length,
    resolvedIndexes,
    rejectedCount: rejectedSource.length,
    rejectedTotal: args.rejectedTotal ?? rejectedSource.length,
    rejectedIndexes,
    rejectedReasons,
    appliedCount: appliedSource.length,
    appliedTotal: args.appliedTotal ?? appliedSource.length,
    appliedIndexes,
    alreadyAppliedCount: alreadyAppliedSource.length,
    alreadyAppliedTotal: args.alreadyAppliedTotal ?? alreadyAppliedSource.length,
    alreadyAppliedIndexes,
    participantIds,
    participantTotal: args.participantTotal ?? participantSource.length,
    participantIdsTruncated: (args.participantTotal ?? participantSource.length) > participantIds.length,
    indexesTruncated: (args.requestedTotal ?? requestedSource.length) > requestedIndexes.length || (args.resolvedTotal ?? resolvedSource.length) > resolvedIndexes.length || (args.rejectedTotal ?? rejectedSource.length) > rejectedIndexes.length || (args.appliedTotal ?? appliedSource.length) > appliedIndexes.length || (args.alreadyAppliedTotal ?? alreadyAppliedSource.length) > alreadyAppliedIndexes.length,
    commitStatus,
    postEditStatus,
    terminalStatus,
    durationMs: Math.max(0, Math.min(args.durationMs ?? 0, 864e5))
  };
}
function shouldLogEvent(event) {
  if (VERBOSE_READ_GUARD_LOG)
    return true;
  if (event === "edit_allowed")
    return LOG_ALLOWED_EDITS;
  if (event === "range_snapshot_validation")
    return LOG_SNAPSHOT_VALIDATION;
  return event === "edit_blocked" || event === "edit_warned" || event === "exemption_added" || event === "oldtext_not_found" || event === "oldtext_duplicate" || event === "oldtext_indent_autopatched" || event === "oldtext_trailing_ws_autopatched" || event === "oldtext_escape_autopatched" || event === "edit_range_relocated" || event === "edit_preflight_blocked" || event === "edit_partial_apply" || event === "edit_partial_apply_skipped" || // #2402: pre-write batch rejections and recognized exact retries are the
  // two new partial-apply outcomes; each is rare by construction.
  event === "edit_partial_apply_rejected" || event === "edit_already_applied_retry" || event === "edit_post_edit_pipeline_failed" || event === "edit_batch_summary" || event === "edit_batch_summary_overflow" || event === "touched_lines_missing" || // #1913: read-guard record-cap evictions are rare by construction (only
  // READ_GUARD_MAX_RECORDS_PER_FILE overflow triggers one), so this trim
  // record bypasses the per-read verbosity gate — a live eviction
  // regression must be visible without PI_LENS_READ_GUARD_VERBOSE=1.
  event === "read_cap_trimmed" || // #1918: the record-cap trim's population siblings — whole-file
  // eviction under real pressure (file cap or an external delete) and
  // the per-file edits-cap trim. Idle-timeout eviction is deliberately
  // EXCLUDED from this event (see read-guard.ts's evictFile doc
  // comment) — it's routine housekeeping, not a fault, and its
  // per-file cardinality is unbounded in a healthy session — except
  // when it drops a write record (#3520), once per file per session.
  // Same rarity argument as #1913 for the reasons that DO fire: each is
  // rising-edge gated once per file per session, so always-on
  // visibility costs nothing.
  event === "read_file_evicted" || event === "edits_cap_trimmed" || // #4131: a file's authorship ended because another writer changed its
  // bytes. Once per authorship episode: the retired file needs a read or
  // a known-content write before a writer can author it again.
  event === "authorship_retired";
}
var MAX_TELEMETRY_STRING = 512;
var MAX_TELEMETRY_KEYS = 64;
function boundTelemetryValue(value, pathName, depth) {
  if (typeof value === "string") {
    return value.length > MAX_TELEMETRY_STRING ? {
      value: `${value.slice(0, MAX_TELEMETRY_STRING)}\u2026`,
      truncated: true,
      arrayTotals: {}
    } : { value, truncated: false, arrayTotals: {} };
  }
  if (Array.isArray(value)) {
    const sampled = value.slice(0, MAX_EDIT_BATCH_ITEMS);
    const bounded = sampled.map((item, index) => boundTelemetryValue(item, `${pathName}[${index}]`, depth + 1));
    const arrayTotals2 = value.length > MAX_EDIT_BATCH_ITEMS ? { [pathName || "array"]: value.length } : {};
    let truncated2 = value.length > MAX_EDIT_BATCH_ITEMS;
    for (const item of bounded) {
      truncated2 ||= item.truncated;
      Object.assign(arrayTotals2, item.arrayTotals);
    }
    return {
      value: bounded.map((item) => item.value),
      truncated: truncated2,
      arrayTotals: arrayTotals2
    };
  }
  if (!value || typeof value !== "object" || depth >= 4) {
    return { value, truncated: false, arrayTotals: {} };
  }
  const output = {};
  let truncated = false;
  const arrayTotals = {};
  for (const [key, child] of Object.entries(value).slice(0, MAX_TELEMETRY_KEYS)) {
    const bounded = boundTelemetryValue(child, pathName ? `${pathName}.${key}` : key, depth + 1);
    output[key] = bounded.value;
    truncated ||= bounded.truncated;
    Object.assign(arrayTotals, bounded.arrayTotals);
  }
  if (Object.keys(value).length > MAX_TELEMETRY_KEYS)
    truncated = true;
  return { value: output, truncated, arrayTotals };
}
function logReadGuardEvent(entry) {
  if (isTestMode() || !shouldLogEvent(entry.event)) {
    return;
  }
  const rawMetadata = entry.correlationId ? { ...entry.metadata, correlationId: entry.correlationId } : entry.metadata;
  const bounded = boundTelemetryValue(rawMetadata, "metadata", 0);
  const metadata = bounded.truncated && bounded.value && typeof bounded.value === "object" ? {
    ...bounded.value,
    telemetryTruncated: true,
    telemetryArrayTotals: bounded.arrayTotals
  } : bounded.value && typeof bounded.value === "object" ? bounded.value : void 0;
  const { correlationId: _correlationId, ...logEntry } = entry;
  writer.log({
    ts: (/* @__PURE__ */ new Date()).toISOString(),
    ...logEntry,
    turnId: getTurnId(),
    filePath: normalizeFilePath(logEntry.filePath),
    metadata
  });
}

// dist/clients/mutating-tool.js
var BUILTIN_MUTATING_TOOLS = /* @__PURE__ */ new Map([
  ["write", "write"],
  ["edit", "edit"]
]);
function isMutatingToolName(toolName) {
  return BUILTIN_MUTATING_TOOLS.has(toolName);
}
var RESOLVED_RANGE_CARRY_LIMIT = 64;
var RESOLVED_RANGE_CARRY = new BoundedFifoMap(RESOLVED_RANGE_CARRY_LIMIT);

export {
  normalizeMessage,
  hashText,
  stableFindingId,
  sanitizeCorrelationId,
  getReadGuardCorrelationId,
  createReadGuardEditBatchSummary,
  logReadGuardEvent,
  primePersistedMutationAttribution,
  resetMutationAttribution,
  isMutatingToolName
};
