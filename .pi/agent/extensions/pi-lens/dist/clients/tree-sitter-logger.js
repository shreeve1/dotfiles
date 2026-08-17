import * as path from "node:path";
import { isTestMode } from "./env-utils.js";
import { getGlobalPiLensDir } from "./file-utils.js";
import { createNdjsonLogger } from "./ndjson-logger.js";
import { getMaxLogSizeMB } from "./log-cleanup.js";
const TREE_SITTER_LOG_DIR = getGlobalPiLensDir();
const TREE_SITTER_LOG_FILE = path.join(TREE_SITTER_LOG_DIR, "tree-sitter.log");
const writer = createNdjsonLogger({
    filePath: TREE_SITTER_LOG_FILE,
    maxBytes: getMaxLogSizeMB() * 1024 * 1024,
});
const CACHE_COUNTER_KEYS = [
    "lookups",
    "hits",
    "misses",
    "coldMisses",
    "capacityMisses",
    "contentChangedMisses",
    "mtimeMisses",
    "statFailedMisses",
    "sets",
    "replacements",
    "evictions",
    "clears",
    "ghostHistoryDrops",
    "parserInvocations",
    "parserDurationMs",
    "parserFailures",
];
export function logTreeSitter(entry) {
    if (isTestMode()) {
        return;
    }
    writer.log({ ts: new Date().toISOString(), ...entry });
}
export function logTreeSitterCacheStats(options) {
    const delta = Object.fromEntries(CACHE_COUNTER_KEYS.map((key) => [key, options.stats[key]]));
    logTreeSitter({
        phase: "cache_stats",
        filePath: options.filePath,
        durationMs: options.durationMs,
        metadata: {
            scope: options.scope,
            fileCount: options.fileCount,
            hitRate: delta.lookups > 0 ? delta.hits / delta.lookups : null,
            delta,
            resident: {
                size: options.stats.size,
                maxSize: options.stats.maxSize,
                totalBytes: options.stats.totalBytes,
                totalLines: options.stats.totalLines,
            },
        },
    });
}
/**
 * The tree-sitter stack's terminal-safe diagnostic sink (#1333).
 *
 * pi owns the terminal, so nothing under `clients/` may `console.error`. The
 * tree-sitter subsystem already owns `tree-sitter.log`, so its diagnostics stay
 * there rather than moving to the generic `extension.log` — one log per
 * subsystem, per the AGENTS.md logger invariant.
 *
 * `filePath` is optional because several of these fire process-wide (WASM
 * abort, grammar fetch, rule compile) with no file in hand.
 */
export function logTreeSitterDiagnostic(entry) {
    logTreeSitter({
        phase: "diagnostic",
        filePath: entry.filePath ?? "<tree-sitter>",
        ...(entry.languageId ? { languageId: entry.languageId } : {}),
        status: entry.level ?? "error",
        reason: entry.message,
        metadata: { subsystem: entry.subsystem, ...(entry.metadata ?? {}) },
    });
}
export function getTreeSitterLogPath() {
    return TREE_SITTER_LOG_FILE;
}
/** Resolve once all enqueued tree-sitter writes are on disk (tests/shutdown). */
export function flushTreeSitterLog() {
    return writer.flush();
}
