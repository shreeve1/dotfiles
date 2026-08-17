import * as path from "node:path";
import { isTestMode } from "./env-utils.js";
import { getGlobalPiLensDir } from "./file-utils.js";
import { createNdjsonLogger } from "./ndjson-logger.js";
const READ_GUARD_LOG_DIR = getGlobalPiLensDir();
const READ_GUARD_LOG_FILE = path.join(READ_GUARD_LOG_DIR, "read-guard.log");
const READ_GUARD_LOG_BACKUP_FILE = path.join(READ_GUARD_LOG_DIR, "read-guard.log.1");
const MAX_LOG_BYTES = Math.max(128 * 1024, Number.parseInt(process.env.PI_LENS_READ_GUARD_MAX_BYTES ?? "1048576", 10) ||
    1048576);
const writer = createNdjsonLogger({
    filePath: READ_GUARD_LOG_FILE,
    maxBytes: MAX_LOG_BYTES,
    backupPath: READ_GUARD_LOG_BACKUP_FILE,
});
const VERBOSE_READ_GUARD_LOG = process.env.PI_LENS_READ_GUARD_VERBOSE === "1" ||
    process.env.PI_LENS_READ_GUARD_LOG === "verbose";
const LOG_ALLOWED_EDITS = process.env.PI_LENS_READ_GUARD_LOG_ALLOWS === "1";
const SNAPSHOT_LOG_SETTING = (process.env.PI_LENS_READ_GUARD_LOG_SNAPSHOTS ?? "1").toLowerCase();
const LOG_SNAPSHOT_VALIDATION = !["0", "false", "off"].includes(SNAPSHOT_LOG_SETTING);
export const MAX_EDIT_BATCH_ITEMS = 100;
let generatedCorrelationCounter = 0;
function sanitizeCorrelationId(value) {
    if (typeof value !== "string" && typeof value !== "number")
        return undefined;
    const sanitized = String(value)
        .trim()
        .replace(/[^a-zA-Z0-9._:-]/g, "_")
        .slice(0, 64);
    return sanitized.length > 0 ? sanitized : undefined;
}
/** Prefer the host call token; otherwise create a bounded per-process token. */
export function getReadGuardCorrelationId(event) {
    const value = (event ?? {});
    const details = (value.details ?? {});
    for (const candidate of [
        details.readGuardCorrelationId,
        details.toolCallId,
        value.toolCallId,
        value.callId,
        value.requestId,
        value.id,
    ]) {
        const sanitized = sanitizeCorrelationId(candidate);
        if (sanitized)
            return sanitized;
    }
    generatedCorrelationCounter =
        (generatedCorrelationCounter + 1) % 1_000_000;
    return `rg-${Date.now().toString(36)}-${generatedCorrelationCounter}`;
}
function validIndexes(indexes) {
    return indexes.filter((index) => Number.isInteger(index) && index >= 0);
}
export function boundedEditIndexes(indexes) {
    return [...new Set(validIndexes(indexes))].slice(0, MAX_EDIT_BATCH_ITEMS);
}
export function boundedIndexesForCount(count) {
    const boundedCount = Math.max(0, Math.floor(count));
    return Array.from({ length: Math.min(boundedCount, MAX_EDIT_BATCH_ITEMS) }, (_, index) => index);
}
export function formatBoundedEditIndexes(indexes) {
    return boundedEditIndexes(indexes)
        .map((index) => `edits[${index}]`)
        .join(", ");
}
export function createReadGuardEditBatchSummary(args) {
    const requestedSource = validIndexes(args.requestedIndexes);
    const resolvedSource = validIndexes(args.resolvedIndexes ?? []);
    const rejectedSource = (args.rejectedReasons ?? []).filter((entry) => Number.isInteger(entry.index) && entry.index >= 0);
    const appliedSource = validIndexes(args.appliedIndexes ?? []);
    const requestedIndexes = boundedEditIndexes(requestedSource);
    const resolvedIndexes = boundedEditIndexes(resolvedSource);
    const rejectedReasons = rejectedSource.slice(0, MAX_EDIT_BATCH_ITEMS);
    const rejectedIndexes = boundedEditIndexes(rejectedSource.map((entry) => entry.index));
    const appliedIndexes = boundedEditIndexes(appliedSource);
    const participantSource = (args.participantIds ?? []).filter((id) => typeof id === "string" && id.length > 0);
    const participantIds = [...new Set(participantSource)].slice(0, MAX_EDIT_BATCH_ITEMS);
    const commitStatus = args.commitStatus ?? "not_attempted";
    const postEditStatus = args.postEditStatus ?? "not_run";
    const terminalStatus = args.terminalStatus ??
        (postEditStatus === "failed" || commitStatus === "failed"
            ? "failed"
            : commitStatus === "not_attempted" && rejectedSource.length > 0
                ? "blocked"
                : commitStatus === "no_changes"
                    ? "skipped"
                    : "success");
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
        participantIds,
        participantTotal: args.participantTotal ?? participantSource.length,
        participantIdsTruncated: (args.participantTotal ?? participantSource.length) > participantIds.length,
        indexesTruncated: (args.requestedTotal ?? requestedSource.length) > requestedIndexes.length ||
            (args.resolvedTotal ?? resolvedSource.length) > resolvedIndexes.length ||
            (args.rejectedTotal ?? rejectedSource.length) > rejectedIndexes.length ||
            (args.appliedTotal ?? appliedSource.length) > appliedIndexes.length,
        commitStatus,
        postEditStatus,
        terminalStatus,
        durationMs: Math.max(0, Math.min(args.durationMs ?? 0, 86_400_000)),
    };
}
function shouldLogEvent(event) {
    if (VERBOSE_READ_GUARD_LOG)
        return true;
    if (event === "edit_allowed")
        return LOG_ALLOWED_EDITS;
    if (event === "range_snapshot_validation")
        return LOG_SNAPSHOT_VALIDATION;
    return (event === "edit_blocked" ||
        event === "edit_warned" ||
        event === "exemption_added" ||
        event === "oldtext_not_found" ||
        event === "oldtext_duplicate" ||
        event === "oldtext_indent_autopatched" ||
        event === "oldtext_trailing_ws_autopatched" ||
        event === "oldtext_escape_autopatched" ||
        event === "edit_range_relocated" ||
        event === "edit_preflight_blocked" ||
        event === "edit_partial_apply" ||
        event === "edit_partial_apply_skipped" ||
        event === "edit_post_edit_pipeline_failed" ||
        event === "edit_batch_summary" ||
        event === "edit_batch_summary_overflow" ||
        event === "touched_lines_missing");
}
const MAX_TELEMETRY_STRING = 512;
const MAX_TELEMETRY_KEYS = 64;
function boundTelemetryValue(value, pathName, depth) {
    if (typeof value === "string") {
        return value.length > MAX_TELEMETRY_STRING
            ? {
                value: `${value.slice(0, MAX_TELEMETRY_STRING)}…`,
                truncated: true,
                arrayTotals: {},
            }
            : { value, truncated: false, arrayTotals: {} };
    }
    if (Array.isArray(value)) {
        const sampled = value.slice(0, MAX_EDIT_BATCH_ITEMS);
        const bounded = sampled.map((item, index) => boundTelemetryValue(item, `${pathName}[${index}]`, depth + 1));
        const arrayTotals = value.length > MAX_EDIT_BATCH_ITEMS
            ? { [pathName || "array"]: value.length }
            : {};
        let truncated = value.length > MAX_EDIT_BATCH_ITEMS;
        for (const item of bounded) {
            truncated ||= item.truncated;
            Object.assign(arrayTotals, item.arrayTotals);
        }
        return {
            value: bounded.map((item) => item.value),
            truncated,
            arrayTotals,
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
export function logReadGuardEvent(entry) {
    if (isTestMode() || !shouldLogEvent(entry.event)) {
        return;
    }
    const rawMetadata = entry.correlationId
        ? { ...(entry.metadata ?? {}), correlationId: entry.correlationId }
        : entry.metadata;
    const bounded = boundTelemetryValue(rawMetadata, "metadata", 0);
    const metadata = bounded.truncated && bounded.value && typeof bounded.value === "object"
        ? {
            ...bounded.value,
            telemetryTruncated: true,
            telemetryArrayTotals: bounded.arrayTotals,
        }
        : bounded.value && typeof bounded.value === "object"
            ? bounded.value
            : undefined;
    const { correlationId: _correlationId, ...logEntry } = entry;
    writer.log({ ts: new Date().toISOString(), ...logEntry, metadata });
}
export function getReadGuardLogPath() {
    return READ_GUARD_LOG_FILE;
}
/** Resolve once all enqueued read-guard writes are on disk (tests/shutdown). */
export function flushReadGuardLog() {
    return writer.flush();
}
