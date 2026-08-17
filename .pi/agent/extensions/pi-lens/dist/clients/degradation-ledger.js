/** Bounded, process-local telemetry for behavior degraded during one session. */
import { logExtension } from "./extension-log.js";
const ENTRIES_PER_KIND = 20;
const MAX_DISTINCT_KINDS = 32;
const OVERFLOW_KIND = "other";
const groups = new Map();
const onceKeys = new Set();
const tallies = new Map();
export function recordDegradation(record) {
    try {
        const kind = boundedKind(record.kind);
        const subject = truncateForLedger(record.subject);
        const reason = truncateForLedger(record.reason);
        let group = groups.get(kind);
        if (!group) {
            group = { count: 0, entries: [] };
            groups.set(kind, group);
        }
        group.count += 1;
        // Bounded at RECORD time (#1366 review): reasons carry arbitrary error
        // text; a 10KB message must never become a 10KB health line or a 10KB
        // retained string.
        group.entries.push({ subject, reason });
        if (group.entries.length > ENTRIES_PER_KIND)
            group.entries.shift();
    }
    catch (error) {
        debugLedgerFailure("record", error);
        // Telemetry must never break the observed path.
    }
}
/** Record at most once per kind/subject during the current session. */
export function recordDegradationOnce(record) {
    try {
        const kind = boundedKind(record.kind);
        const subject = truncateForLedger(record.subject);
        const key = `${kind}\0${subject}`;
        if (onceKeys.has(key))
            return;
        onceKeys.add(key);
        recordDegradation({ kind, subject, reason: record.reason });
    }
    catch (error) {
        debugLedgerFailure("record-once", error);
        // Telemetry must never break the observed path.
    }
}
/**
 * Count a repeated degradation while retaining one latest-reason entry per
 * kind/subject. The group count remains the exact event total.
 */
export function incrementDegradationCount(record) {
    try {
        const kind = boundedKind(record.kind);
        const subject = truncateForLedger(record.subject);
        const reason = truncateForLedger(record.reason);
        const key = `${kind}\0${subject}`;
        const count = (tallies.get(key) ?? 0) + 1;
        tallies.set(key, count);
        let group = groups.get(kind);
        if (!group) {
            group = { count: 0, entries: [] };
            groups.set(kind, group);
        }
        group.count += 1;
        const entry = { subject, reason: truncateForLedger(`${reason} (count: ${count})`) };
        const existing = group.entries.findIndex((candidate) => candidate.subject === subject);
        if (existing >= 0)
            group.entries.splice(existing, 1);
        group.entries.push(entry);
        if (group.entries.length > ENTRIES_PER_KIND)
            group.entries.shift();
    }
    catch (error) {
        debugLedgerFailure("increment", error);
        // Telemetry must never break the observed path.
    }
}
/** Detached snapshot, grouped in first-seen kind order. */
const LEDGER_FIELD_MAX = 200;
function normalizeForLedger(value) {
    return String(value ?? "unknown");
}
function boundedKind(value) {
    const kind = truncateForLedger(value);
    if (groups.has(kind) || kind === OVERFLOW_KIND)
        return kind;
    // Keep one slot available for all kinds beyond the cardinality bound.
    return groups.size < MAX_DISTINCT_KINDS - 1 ? kind : OVERFLOW_KIND;
}
function truncateForLedger(value) {
    const text = normalizeForLedger(value);
    return text.length > LEDGER_FIELD_MAX
        ? `${text.slice(0, LEDGER_FIELD_MAX)}…`
        : text;
}
export function getDegradationSummary() {
    return [...groups.entries()].map(([kind, group]) => ({
        kind,
        count: group.count,
        droppedCount: group.count - group.entries.length,
        latestReasons: group.entries.map((entry) => ({ ...entry })),
    }));
}
function isRenderableSummary(value) {
    if (!Array.isArray(value))
        return false;
    return value.every((group) => {
        if (group === null || typeof group !== "object")
            return false;
        const candidate = group;
        return (typeof candidate.kind === "string" &&
            typeof candidate.count === "number" &&
            Array.isArray(candidate.latestReasons) &&
            candidate.latestReasons.every((entry) => entry !== null &&
                typeof entry === "object" &&
                typeof entry.subject === "string" &&
                typeof entry.reason === "string"));
    });
}
export function renderDegradationLines(summary = getDegradationSummary()) {
    if (!isRenderableSummary(summary))
        return [];
    if (summary.length === 0)
        return [];
    return [
        "Degradations:",
        ...summary.map((group) => {
            const latest = group.latestReasons.at(-1);
            return `  ⚠ ${group.kind}: ${group.count}${latest ? ` — ${latest.subject}: ${latest.reason}` : ""}`;
        }),
    ];
}
function debugLedgerFailure(operation, error) {
    try {
        logExtension({
            subsystem: "degradation-ledger",
            level: "debug",
            message: `${operation} failed: ${error instanceof Error ? error.message : String(error)}`,
        });
    }
    catch {
        // Debug logging must not compromise the non-fatal telemetry contract.
    }
}
/** Session-boundary/test reset. */
export function resetDegradationLedger() {
    groups.clear();
    onceKeys.clear();
    tallies.clear();
}
export const DEGRADATION_ENTRIES_PER_KIND = ENTRIES_PER_KIND;
export const DEGRADATION_MAX_DISTINCT_KINDS = MAX_DISTINCT_KINDS;
