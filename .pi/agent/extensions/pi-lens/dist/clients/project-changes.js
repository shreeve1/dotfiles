import * as fs from "node:fs";
import * as path from "node:path";
import { getProjectDataDir } from "./file-utils.js";
import { normalizeMapKey } from "./path-utils.js";
export function getProjectChangeLogPath(cwd) {
    return path.join(getProjectDataDir(cwd), "change-log.jsonl");
}
function parseChangeLine(line) {
    try {
        const parsed = JSON.parse(line);
        if (typeof parsed.seq !== "number" ||
            typeof parsed.fileSeq !== "number" ||
            typeof parsed.filePath !== "string" ||
            typeof parsed.source !== "string") {
            return undefined;
        }
        return {
            seq: parsed.seq,
            timestamp: parsed.timestamp ?? new Date(0).toISOString(),
            sessionId: parsed.sessionId ?? "unknown",
            turnIndex: parsed.turnIndex ?? 0,
            source: parsed.source,
            filePath: parsed.filePath,
            fileSeq: parsed.fileSeq,
            changedRange: parsed.changedRange,
        };
    }
    catch {
        return undefined;
    }
}
export function readProjectChanges(cwd) {
    const logPath = getProjectChangeLogPath(cwd);
    try {
        const content = fs.readFileSync(logPath, "utf-8");
        return content
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
            .map(parseChangeLine)
            .filter((entry) => Boolean(entry));
    }
    catch {
        return [];
    }
}
export function readChangesSince(cwd, seq, maxEntries = 200) {
    const limit = Math.max(1, maxEntries);
    return readProjectChanges(cwd)
        .filter((entry) => entry.seq > seq)
        .sort((a, b) => a.seq - b.seq)
        .slice(-limit);
}
// Test-observable count of the EXPENSIVE per-entry folds (each one does a
// `path.resolve` + `normalizeMapKey`/`realpathSync.native` syscall). Lets the
// #1019 equivalence tests prove the partial path folds strictly FEWER entries
// than the full replay for the same log — i.e. that the bound actually holds —
// without a brittle spy on the path helpers.
let _sequenceFoldCountForTests = 0;
export function getSequenceFoldCountForTests() {
    return _sequenceFoldCountForTests;
}
export function resetSequenceFoldCountForTests() {
    _sequenceFoldCountForTests = 0;
}
function foldEntry(entry, fileSeqByPath) {
    _sequenceFoldCountForTests++;
    const key = normalizeMapKey(path.resolve(entry.filePath));
    fileSeqByPath.set(key, Math.max(fileSeqByPath.get(key) ?? 0, entry.fileSeq));
}
function fullReplay(entries) {
    let projectSeq = 0;
    const fileSeqByPath = new Map();
    for (const entry of entries) {
        projectSeq = Math.max(projectSeq, entry.seq);
        foldEntry(entry, fileSeqByPath);
    }
    return { projectSeq, fileSeqByPath };
}
/**
 * Attempt the bounded partial replay: hydrate `base` (pre-normalized keys, no
 * `realpath` cost) and fold ONLY entries with `seq > base.sinceSeq`. Returns
 * `null` — signalling the caller to fall back to a full replay — whenever the
 * base cannot be trusted to be byte-identical to a full replay:
 *
 *  - `base.sinceSeq` is AHEAD of the log's max seq (the log was truncated /
 *    rotated below the snapshot, or the snapshot seq is simply ahead). Serving
 *    the base would over-report the seq; the full replay reflects the real log.
 *
 * The result is provably equal to a full replay under the append-only,
 * single-writer invariant (`base` == fold of the log up to `sinceSeq`): every
 * historical file's seq is already in `base`, and folding the strictly-newer
 * entries with the SAME `Math.max` the full replay uses reproduces the max over
 * the whole log for both `projectSeq` and each file. `Math.max` makes the fold
 * order-independent, so gaps / out-of-order entries are handled exactly as the
 * full replay handles them.
 */
function partialReplay(entries, base) {
    let logMaxSeq = 0;
    for (const entry of entries) {
        if (entry.seq > logMaxSeq)
            logMaxSeq = entry.seq;
    }
    // Snapshot ahead of / newer than the log (truncation, rotation, or a stale
    // log): the base describes a state the log no longer backs — never serve it.
    if (base.sinceSeq > logMaxSeq)
        return null;
    const fileSeqByPath = new Map(base.fileSeqByPath);
    let projectSeq = Math.max(0, base.projectSeq);
    for (const entry of entries) {
        if (entry.seq <= base.sinceSeq)
            continue; // covered by the base
        projectSeq = Math.max(projectSeq, entry.seq);
        foldEntry(entry, fileSeqByPath);
    }
    return { projectSeq, fileSeqByPath };
}
/**
 * Compute the current `{ projectSeq, fileSeqByPath }` from the append-only
 * change log. With no `base`, this is a full replay of the entire log. With a
 * snapshot-embedded `base` (#1019), it folds only entries newer than
 * `base.sinceSeq` on top of the base — O(changes since snapshot) instead of
 * O(entire log) — and transparently falls back to a full replay when the base
 * cannot be trusted (see `partialReplay`). A legacy/stale/missing snapshot
 * simply passes no `base` (or one the guard rejects), so correctness never
 * depends on the optimization being applicable.
 */
export function readLatestProjectSequence(cwd, base) {
    const entries = readProjectChanges(cwd);
    if (base) {
        const partial = partialReplay(entries, base);
        if (partial)
            return partial;
    }
    return fullReplay(entries);
}
export function appendProjectChange(cwd, entry) {
    const logPath = getProjectChangeLogPath(cwd);
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.appendFileSync(logPath, `${JSON.stringify(entry)}\n`, "utf-8");
}
