/**
 * Shared write-plumbing for the hand-rolled NDJSON debug loggers in clients/.
 *
 * One buffered async writer replaces eight drifting copies of append+rotate.
 * `log()`/`append()` are synchronous-call, async-write: they enqueue a
 * serialized line and a single in-flight `fs.promises.appendFile` drains the
 * queue — no `appendFileSync` on the per-edit hot path (latency-logger alone
 * fired ~10–20 sync appends per edit, #454/#361/#368).
 *
 * Errors are swallowed best-effort, matching every current logger. A
 * best-effort SYNC flush is registered on `process.on("exit")` (appendFileSync
 * is fine at exit — not the hot path; no child spawning, #234). Normal drains
 * use promise-based mkdir/append/truncate, while rotation stays synchronous
 * inside the already-deferred drain so it cannot race a flushSync rename. A
 * The shared writer state uses the `NDJSON_GLOBAL_STATE_SCHEMA` protocol:
 * version 1 (the 6a8a0994 shape) is upgraded in place to current version 2,
 * retaining its queues while replacing stale exit flushers. A pre-7e4b9120
 * private-queue shape is fenced rather than adopted, because its queues cannot
 * be migrated safely.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { normalizeFilePath } from "./path-utils.js";
import { redactSecrets } from "./redact/secrets.js";
function resolve(v) {
    return typeof v === "function" ? v() : v;
}
function runBestEffort(operation) {
    try {
        operation();
    }
    catch {
        return;
    }
}
const NDJSON_GLOBAL_STATE_SCHEMA = "pi-lens.ndjson-logger.state";
const NDJSON_LEGACY_GLOBAL_STATE_VERSION = 1;
const NDJSON_GLOBAL_STATE_VERSION = 2;
const NDJSON_GLOBAL_STATE_KEY = Symbol.for("pi-lens.ndjson-logger.state");
const globalStateHost = globalThis;
const existingGlobalState = globalStateHost[NDJSON_GLOBAL_STATE_KEY];
function isSharedWriterState(value) {
    if (!value || typeof value !== "object")
        return false;
    const candidate = value;
    const knownSchema = candidate.schema === undefined ||
        candidate.schema === NDJSON_GLOBAL_STATE_SCHEMA;
    const knownVersion = candidate.version === undefined ||
        candidate.version === NDJSON_LEGACY_GLOBAL_STATE_VERSION ||
        candidate.version === NDJSON_GLOBAL_STATE_VERSION;
    return (knownSchema &&
        knownVersion &&
        candidate.writers instanceof Map &&
        candidate.exitFlushers instanceof Set &&
        candidate.registeredLogFiles instanceof Set &&
        typeof candidate.exitHandlerRegistered === "boolean");
}
function isLegacyGlobalState(value) {
    if (!value || typeof value !== "object")
        return false;
    const candidate = value;
    return (candidate.exitFlushers instanceof Set &&
        candidate.registeredLogFiles instanceof Set &&
        typeof candidate.exitHandlerRegistered === "boolean");
}
let ndjsonGlobalState;
let legacyGlobalState;
if (isSharedWriterState(existingGlobalState)) {
    // The 7e4b9120 graph had no version marker and 6a8a0994 used version 1.
    // Both shapes are bridgeable: retain their queues, but replace every stale
    // exit flusher with a closure from this module graph. A current state is
    // left untouched so it keeps exactly one canonical flusher per writer.
    const needsFlusherMigration = existingGlobalState.schema !== NDJSON_GLOBAL_STATE_SCHEMA ||
        existingGlobalState.version !== NDJSON_GLOBAL_STATE_VERSION;
    if (needsFlusherMigration) {
        for (const state of existingGlobalState.writers.values()) {
            const staleExitFlusher = state.exitFlusher;
            const currentExitFlusher = () => flushStateSync(state);
            state.exitFlusher = currentExitFlusher;
            existingGlobalState.exitFlushers.delete(staleExitFlusher);
            existingGlobalState.exitFlushers.add(currentExitFlusher);
        }
    }
    existingGlobalState.schema = NDJSON_GLOBAL_STATE_SCHEMA;
    existingGlobalState.version = NDJSON_GLOBAL_STATE_VERSION;
    ndjsonGlobalState = existingGlobalState;
}
else if (existingGlobalState === undefined) {
    ndjsonGlobalState = (globalStateHost[NDJSON_GLOBAL_STATE_KEY] = {
        schema: NDJSON_GLOBAL_STATE_SCHEMA,
        version: NDJSON_GLOBAL_STATE_VERSION,
        writers: new Map(),
        exitFlushers: new Set(),
        exitHandlerRegistered: false,
        registeredLogFiles: new Set(),
    });
}
else if (isLegacyGlobalState(existingGlobalState)) {
    // Do not mutate or replace this state: its private queues and exit flusher
    // closures are not observable, so adopting it would falsely claim safety.
    // New facades fail closed in requireCurrentGlobalState().
    legacyGlobalState = existingGlobalState;
}
const exitFlushers = ndjsonGlobalState?.exitFlushers ??
    legacyGlobalState?.exitFlushers ??
    new Set();
const registeredLogFiles = ndjsonGlobalState?.registeredLogFiles ??
    legacyGlobalState?.registeredLogFiles ??
    new Set();
/** Test-only view of the canonical per-file exit flushers (see ndjson-logger.test.ts). */
export function _exitFlushersForTest() {
    return exitFlushers;
}
// Auto-derived retention coverage (clients/log-cleanup.ts): every *static*
// filePath a createNdjsonLogger instance is constructed with self-registers
// here at module-load time — the moment latency-logger.ts, bus-events-logger.ts,
// etc. call createNdjsonLogger(), the sweep in log-cleanup.ts picks the file up
// automatically. No second hand-maintained list to forget (the exact mistake
// that left actionable-warnings/ast-grep-tools/dead-code, then bus-events.log,
// unrotated — see log-cleanup.ts's module doc).
//
// A *lazy* filePath (a resolver function, e.g. diagnostic-logger's date-keyed
// `logs/{date}.jsonl`) is deliberately NOT registered: those already live
// under the `logs/` subdirectory and are covered by log-cleanup's separate
// `*.jsonl` daily-log sweep, not the single-file rotation list.
/** Every absolute path registered by a static-filePath createNdjsonLogger instance. */
export function getRegisteredLogFiles() {
    return registeredLogFiles;
}
/** Test-only reset — each test file gets a clean registry (see ndjson-logger.test.ts). */
export function _resetRegisteredLogFilesForTest() {
    registeredLogFiles.clear();
}
function requireCurrentGlobalState() {
    if (ndjsonGlobalState)
        return ndjsonGlobalState;
    throw new Error("createNdjsonLogger: incompatible module graph state; a pre-7e4b9120 " +
        "logger graph may still own private queues. Restart the process before " +
        "loading the current logger graph");
}
function registerWriter(state) {
    const globalState = requireCurrentGlobalState();
    if (!exitFlushers.has(state.exitFlusher))
        exitFlushers.add(state.exitFlusher);
    if (!globalState.exitHandlerRegistered) {
        globalState.exitHandlerRegistered = true;
        process.on("exit", () => {
            for (const flush of exitFlushers)
                runBestEffort(flush);
        });
    }
}
function normalizeLogPath(file) {
    return normalizeFilePath(path.resolve(file));
}
function assertCompatibleWriterOptions(existing, maxBytes, backupPath) {
    if (existing.maxBytes === maxBytes && existing.backupPath === backupPath)
        return;
    throw new Error(`createNdjsonLogger: incompatible options for shared path ${existing.file}; ` +
        `the first writer's maxBytes/backupPath must be reused`);
}
function applyQueueItemSync(state, item) {
    ensureDirSync(state);
    runBestEffort(() => {
        if (item.kind === "truncate") {
            fs.writeFileSync(state.file, "");
        }
        else {
            rotateIfNeeded(state);
            fs.appendFileSync(state.file, item.line);
        }
    });
}
function flushStateSync(state) {
    // Drain the in-memory queue synchronously — safe at process exit.
    // The in-flight async batch is INCLUDED even though its appendFile may
    // also land: if the process dies before the threadpool issues that
    // write, skipping the prefix would drop the whole batch. The per-line
    // writer deliberately traded duplicate lines at exit for never-drops
    // (#935 review) — keep that trade. If a late in-flight append crosses a
    // truncate, the post-truncate operations are replayed after that append
    // completes so pre-truncate data cannot be reintroduced.
    const inFlight = state.inFlightBatch;
    const inFlightAtHead = inFlight !== null &&
        inFlight.every((item, index) => state.queue[index] === item);
    const repairStart = inFlightAtHead
        ? inFlight?.[0]?.kind === "truncate"
            ? 0
            : state.queue.findIndex((item) => item.kind === "truncate")
        : -1;
    if (state.syncRepairItems) {
        state.syncRepairItems.push(...state.queue);
    }
    else if (repairStart >= 0) {
        state.syncRepairItems = state.queue.slice(repairStart);
    }
    while (state.queue.length > 0) {
        const item = state.queue.shift();
        applyQueueItemSync(state, item);
    }
}
function createWriterState(file, maxBytes, backupPath) {
    const globalState = requireCurrentGlobalState();
    const existing = globalState.writers.get(file);
    if (existing) {
        // A partially initialized global state from another graph still needs to
        // be enrolled, but it must never get a second queue or exit flusher.
        assertCompatibleWriterOptions(existing, maxBytes, backupPath);
        if (!exitFlushers.has(existing.exitFlusher))
            registerWriter(existing);
        return existing;
    }
    const state = {};
    state.file = file;
    state.maxBytes = maxBytes;
    state.backupPath = backupPath;
    state.queue = [];
    state.drainPromise = null;
    state.inFlightBatch = null;
    state.syncRepairItems = null;
    state.ensuredDir = false;
    state.exitFlusher = () => flushStateSync(state);
    globalState.writers.set(file, state);
    registerWriter(state);
    return state;
}
function ensureDirSync(state) {
    if (state.ensuredDir)
        return;
    runBestEffort(() => {
        fs.mkdirSync(path.dirname(state.file), { recursive: true });
        state.ensuredDir = true;
    });
}
async function ensureDirAsync(state) {
    if (state.ensuredDir)
        return;
    try {
        await fs.promises.mkdir(path.dirname(state.file), { recursive: true });
        state.ensuredDir = true;
    }
    catch {
        // telemetry is best-effort
    }
}
function rotateIfNeeded(state) {
    if (state.maxBytes === undefined)
        return;
    try {
        const size = fs.statSync(state.file).size;
        if (size < state.maxBytes)
            return;
        const backup = state.backupPath ?? `${state.file}.1`;
        runBestEffort(() => fs.rmSync(backup, { force: true }));
        fs.renameSync(state.file, backup);
    }
    catch {
        // no file yet, or rename raced — nothing to rotate
    }
}
async function applyQueueItemAsync(state, item) {
    await ensureDirAsync(state);
    try {
        if (item.kind === "truncate") {
            await fs.promises.writeFile(state.file, "");
        }
        else {
            // Rotation is deliberately synchronous here. This function is only
            // reached from the already-deferred drain, and keeping stat/rm/rename
            // in one synchronous section prevents flushSync from racing a late
            // async rename after it has written new data.
            rotateIfNeeded(state);
            await fs.promises.appendFile(state.file, item.line);
        }
    }
    catch {
        // telemetry is best-effort
    }
}
async function drainLoop(state) {
    // Peek, write, then remove — an item stays in the queue until it is on
    // disk, so a teardown flushSync (which abandons this async loop) never
    // drops an item this loop had already dequeued but not yet written.
    while (state.queue.length > 0) {
        const item = state.queue[0];
        await ensureDirAsync(state);
        const truncateIndex = item.kind === "line"
            ? state.queue.findIndex((queued) => queued.kind === "truncate")
            : 0;
        const pendingEnd = truncateIndex === -1 ? state.queue.length : truncateIndex;
        const pending = item.kind === "truncate"
            ? [item]
            : state.queue.slice(0, pendingEnd);
        state.inFlightBatch = pending;
        try {
            if (item.kind === "truncate") {
                await fs.promises.writeFile(state.file, "");
            }
            else {
                // Rotation is kept synchronous inside the deferred drain. The
                // append remains async, but no awaited rotation step can run after
                // flushSync has written to the active file.
                rotateIfNeeded(state);
                await fs.promises.appendFile(state.file, pending
                    .map((queued) => queued.line)
                    .join(""));
            }
        }
        catch {
            // telemetry is best-effort
        }
        for (const written of pending) {
            // flushSync may have drained this prefix while the append is in
            // flight. Never remove newer items from a later enqueue.
            if (state.queue[0] !== written)
                break;
            state.queue.shift();
        }
        if (state.inFlightBatch === pending) {
            state.inFlightBatch = null;
            const repairItems = state.syncRepairItems;
            state.syncRepairItems = null;
            if (repairItems) {
                for (const repairItem of repairItems) {
                    await applyQueueItemAsync(state, repairItem);
                }
            }
        }
    }
}
function drain(state) {
    // Serialize: a single in-flight drain owns the canonical per-file queue.
    // This guard lives in global state, so module re-evaluation cannot create a
    // second drainer for the same path.
    if (!state.drainPromise) {
        state.drainPromise = Promise.resolve()
            .then(() => drainLoop(state))
            .finally(() => {
            state.drainPromise = null;
        });
    }
    return state.drainPromise;
}
export function createNdjsonLogger(options) {
    const states = new Set();
    // Static logger paths are canonicalized once. Lazy diagnostic paths are
    // resolved at enqueue time, but each resolved raw path is canonicalized only
    // once (normally once per date), keeping realpath work off the hot path.
    const canonicalPaths = new Map();
    const staticFile = typeof options.filePath === "string"
        ? normalizeLogPath(options.filePath)
        : undefined;
    const staticBackupPath = typeof options.backupPath === "string" && options.maxBytes !== undefined
        ? normalizeLogPath(options.backupPath)
        : undefined;
    function canonicalPath(file) {
        const raw = path.resolve(file);
        const cached = canonicalPaths.get(raw);
        if (cached)
            return cached;
        const normalized = normalizeLogPath(raw);
        canonicalPaths.set(raw, normalized);
        return normalized;
    }
    function stateForCall() {
        const file = staticFile ?? canonicalPath(resolve(options.filePath));
        const backupPath = options.maxBytes !== undefined && options.backupPath
            ? (staticBackupPath ?? canonicalPath(resolve(options.backupPath)))
            : undefined;
        const state = createWriterState(file, options.maxBytes, backupPath);
        states.add(state);
        return state;
    }
    if (staticFile !== undefined) {
        const state = stateForCall();
        registeredLogFiles.add(state.file);
    }
    function enqueue(item) {
        const state = stateForCall();
        state.queue.push(item);
        void drain(state);
    }
    return {
        log(obj) {
            const serialized = String(JSON.stringify(obj));
            enqueue({
                kind: "line",
                line: `${redactSecrets(serialized)}\n`,
            });
        },
        append(line) {
            enqueue({ kind: "line", line: `${redactSecrets(line)}\n` });
        },
        truncate() {
            enqueue({ kind: "truncate" });
        },
        async flush() {
            await Promise.all([...states].map((state) => drain(state)));
        },
        flushSync() {
            for (const state of states)
                flushStateSync(state);
        },
    };
}
