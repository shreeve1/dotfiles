/**
 * Persistent NDJSON trace of word-index build / refresh / persist outcomes
 * (#926 durable reporting, extended for #958 incremental cross-session refresh).
 *
 * Every word-index signal used to ride solely on the optional `dbg` callback
 * threaded through runtime-session / word-index. `dbg` varies by host and is a
 * documented no-op in the MCP host (clients/mcp/session.ts's `dbg: noop`) —
 * exactly the host where `pilens_symbol_search` READS this index. So the one
 * decision that governs a query's freshness (full rebuild vs incremental
 * refresh, and how many docs were refreshed/dropped/skipped/reused, whether the
 * index is `truncated`, #928) and the one failure that silently corrupts every
 * later query (a swallowed snapshot persist) were invisible precisely where
 * they mattered — the same blind spot bus-events-logger.ts and
 * review-graph-logger.ts were created to close.
 *
 * This gives the word index the same durable trace those siblings have via the
 * shared `createNdjsonLogger` writer (self-registers for log-cleanup rotation),
 * with `isTestMode()` gating writes off inside the test runner. Callers log
 * DIRECTLY here — never through `dbg` — so the trace exists regardless of the
 * host's `dbg` wiring.
 */
import * as path from "node:path";
import { isTestMode } from "./env-utils.js";
import { getGlobalPiLensDir } from "./file-utils.js";
import { getMaxLogSizeMB } from "./log-cleanup.js";
import { createNdjsonLogger } from "./ndjson-logger.js";
const WORD_INDEX_LOG_FILE = path.join(getGlobalPiLensDir(), "word-index.log");
const writer = createNdjsonLogger({
    filePath: WORD_INDEX_LOG_FILE,
    maxBytes: getMaxLogSizeMB() * 1024 * 1024,
});
export function logWordIndex(entry) {
    if (isTestMode()) {
        return;
    }
    writer.log({ ts: new Date().toISOString(), ...entry });
}
export function getWordIndexLogPath() {
    return WORD_INDEX_LOG_FILE;
}
/** Resolve once all enqueued word-index writes are on disk (tests/shutdown). */
export function flushWordIndexLog() {
    return writer.flush();
}
