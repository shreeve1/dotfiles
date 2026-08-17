/**
 * Warm side-channel for the push path. The MCP server is a long-lived process
 * with a warm LSP, but its stdio is owned by the MCP client — so the
 * PostToolUse-hook bin can't reach it that way. Instead the server listens on a
 * local IPC endpoint (Unix domain socket / Windows named pipe), and the hook
 * connects to it to get LSP-complete diagnostics from the warm process instead
 * of running its own cold analysis.
 *
 * This module is the CLIENT + the shared path derivation + the one-shot line
 * reader the server wires into its socket (deliberately light: node:net +
 * type-only result, so the bin can try the warm path WITHOUT loading the
 * dispatch graph). The analysis engine lives in mcp/server.ts. If the warm
 * path is unavailable, the client resolves `undefined` and the caller falls
 * back to cold local analysis.
 */
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as net from "node:net";
import * as os from "node:os";
import * as path from "node:path";
import { writeFileAtomic } from "../atomic-write.js";
export const WARM_DIAGNOSTICS_SCHEMA_VERSION = 1;
export const WARM_CODE_ACTION_LOOKUP_LIMIT = 6;
/**
 * Stable per-workspace endpoint path. The server (from its launch cwd) and the
 * hook (from the PostToolUse cwd) must resolve the same path — both hash the
 * resolved root (lowercased for case-insensitive filesystems), so when they're
 * the same project they meet. Mismatch → the client just falls back to cold.
 */
export function ipcPathForCwd(cwd) {
    const hash = workspaceHash(cwd);
    if (process.platform === "win32") {
        return `\\\\.\\pipe\\pi-lens-mcp-${hash}`;
    }
    return path.join(os.tmpdir(), `pi-lens-mcp-${hash}.sock`);
}
/**
 * The single stable per-workspace id both endpoint derivations key on. Every
 * per-workspace side-channel name (socket/pipe, turn-end status file) must come
 * from HERE, so the hook process and the server process cannot drift apart.
 */
function workspaceHash(cwd) {
    const root = path.resolve(cwd).toLowerCase();
    // sha256 (not for security — just a stable short id for the IPC socket/pipe
    // name keyed by cwd; sha256 over sha1 keeps SonarCloud's weak-hash check quiet)
    return crypto.createHash("sha256").update(root).digest("hex").slice(0, 16);
}
/** PID-scoped endpoint used by pi sessions. The legacy MCP analyze endpoint
 * remains workspace-scoped for compatibility with the PostToolUse hook. */
export function diagnosticsIpcPathForCwd(cwd, pid) {
    const base = ipcPathForCwd(cwd);
    if (process.platform === "win32")
        return `${base}-diagnostics-${pid}`;
    return base.replace(/\.sock$/, `-diagnostics-${pid}.sock`);
}
export function contentHash(content) {
    return crypto.createHash("sha256").update(content).digest("hex");
}
/**
 * Shared one-shot request/response transport for the tagged IPC routes (#822):
 * connect to `endpoint`, write one JSON line, read one JSON line back,
 * classify. The endpoint is PID-scoped for the warm-attach routes and
 * workspace-scoped for the hook bin's turn-end route. The per-route `validate`
 * callback returns a failure reason for an on-time but unusable reply (schema
 * skew, staleness) or `undefined` to accept it; transport failures map
 * uniformly to timeout/ipc-error. One transport, N routes — the clients cannot
 * drift apart.
 */
function requestOverWarmIpc(endpoint, timeoutMs, buildRequest, validate) {
    return new Promise((resolve) => {
        let settled = false;
        const finish = (value) => {
            if (settled)
                return;
            settled = true;
            clearTimeout(timer);
            socket.destroy();
            resolve(value);
        };
        const deadlineAt = Date.now() + timeoutMs;
        const socket = net.createConnection(endpoint);
        socket.setEncoding("utf8");
        let buffer = "";
        const timer = setTimeout(() => finish({ available: false, reason: "timeout" }), timeoutMs);
        timer.unref();
        socket.on("connect", () => {
            socket.write(`${JSON.stringify(buildRequest(deadlineAt))}\n`);
        });
        socket.on("data", (chunk) => {
            buffer += chunk;
            const newline = buffer.indexOf("\n");
            if (newline === -1)
                return;
            try {
                const message = JSON.parse(buffer.slice(0, newline));
                const result = message.result;
                if (message.error || !result) {
                    finish({ available: false, reason: "ipc-error" });
                    return;
                }
                const reason = validate(result, deadlineAt);
                if (reason === undefined) {
                    finish({ available: true, response: result });
                }
                else {
                    finish({ available: false, reason });
                }
            }
            catch {
                finish({ available: false, reason: "schema-mismatch" });
            }
        });
        socket.on("error", () => finish({ available: false, reason: "ipc-error" }));
        socket.on("close", () => finish({ available: false, reason: "ipc-error" }));
    });
}
export function requestWarmDiagnostics(cwd, incumbentPid, file, content, timeoutMs) {
    const expectedHash = contentHash(content);
    return requestOverWarmIpc(diagnosticsIpcPathForCwd(cwd, incumbentPid), timeoutMs, (deadlineAt) => ({
        route: "diagnostics",
        version: WARM_DIAGNOSTICS_SCHEMA_VERSION,
        file,
        cwd,
        content,
        contentHash: expectedHash,
        deadlineAt,
    }), (result, deadlineAt) => {
        if (result.route !== "diagnostics" ||
            result.version !== WARM_DIAGNOSTICS_SCHEMA_VERSION) {
            return "schema-mismatch";
        }
        if (!result.fresh ||
            result.inconclusive ||
            result.contentHash !== expectedHash ||
            result.servedAt > deadlineAt) {
            return "stale-answer";
        }
        return undefined;
    });
}
export function requestWarmCodeActions(cwd, incumbentPid, file, expectedContentHash, ranges, timeoutMs) {
    return requestOverWarmIpc(diagnosticsIpcPathForCwd(cwd, incumbentPid), timeoutMs, (deadlineAt) => ({
        route: "code-actions",
        version: WARM_DIAGNOSTICS_SCHEMA_VERSION,
        file,
        cwd,
        contentHash: expectedContentHash,
        ranges,
        deadlineAt,
    }), (result, deadlineAt) => {
        if (result.route !== "code-actions" ||
            result.version !== WARM_DIAGNOSTICS_SCHEMA_VERSION ||
            !Array.isArray(result.actions) ||
            result.actions.length !== ranges.length ||
            result.actions.some((actions) => !Array.isArray(actions))) {
            return "schema-mismatch";
        }
        if (result.contentHash !== expectedContentHash ||
            result.servedAt > deadlineAt) {
            return "stale-answer";
        }
        return undefined;
    });
}
// v2 adds an explicit receipt acknowledgement. A v1 server must reject rather
// than consume a pass without the new delivery contract.
export const WARM_TURN_END_SCHEMA_VERSION = 2;
/**
 * Ask the warm server to run pi-lens's real turn-end pass. Execution and
 * delivery are separate: the first one-shot connection returns a capability,
 * then a second one-shot connection acknowledges receipt. If the client
 * deadline or either connection loses, the server leaves the durable finding
 * cache untouched for a later Stop. 55 s expires inside Claude Code's 60 s hook
 * timeout.
 */
export async function requestWarmTurnEnd(cwd, timeoutMs = 55_000) {
    const startedAt = Date.now();
    const first = await requestOverWarmIpc(ipcPathForCwd(cwd), timeoutMs, () => ({
        route: "turn-end",
        version: WARM_TURN_END_SCHEMA_VERSION,
        cwd,
    }), (result) => result.route === "turn-end" &&
        result.version === WARM_TURN_END_SCHEMA_VERSION
        ? undefined
        : "schema-mismatch");
    if (!first.available || !first.response.deliveryId)
        return first;
    const remainingMs = timeoutMs - (Date.now() - startedAt);
    if (remainingMs <= 0)
        return { available: false, reason: "timeout" };
    const ack = await requestOverWarmIpc(ipcPathForCwd(cwd), remainingMs, () => ({
        route: "turn-end-ack",
        version: WARM_TURN_END_SCHEMA_VERSION,
        cwd,
        deliveryId: first.response.deliveryId,
    }), (result) => result.route === "turn-end-ack" && result.acknowledged === true
        ? undefined
        : "ipc-error");
    return ack.available
        ? { available: true, response: first.response }
        : { available: false, reason: ack.reason };
}
/** Per-workspace status file, keyed by the same hash as the IPC endpoint. */
export function turnEndStatusPathForCwd(cwd) {
    return path.join(os.tmpdir(), `pi-lens-turn-end-${workspaceHash(cwd)}.json`);
}
export function readTurnEndStatus(cwd) {
    try {
        const raw = fs.readFileSync(turnEndStatusPathForCwd(cwd), "utf8");
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object")
            return undefined;
        return {
            ran: typeof parsed.ran === "number" ? parsed.ran : 0,
            skipped: typeof parsed.skipped === "number" ? parsed.skipped : 0,
            lastSkipReason: parsed.lastSkipReason,
            lastRunAt: parsed.lastRunAt,
            lastSkipAt: parsed.lastSkipAt,
        };
    }
    catch {
        // never written, unreadable, or corrupt — "no turn-end activity recorded"
        return undefined;
    }
}
/**
 * Append one turn-end outcome from the hook process. Never throws.
 *
 * Read-modify-write against a shared per-workspace tmpdir file: two Stop
 * hooks for the same workspace can race this concurrently (separate
 * processes, no lock). `writeFileAtomic` only closes the *publication* half
 * of that — it guarantees this write's own staging+rename can't torn-read
 * (parse-fail and reset counters) or hit a Windows sharing violation against
 * a concurrent writer's rename. It does NOT fix the read-modify-write race
 * itself: two overlapping calls can still both read the same `previous` and
 * publish from it, silently dropping one increment. That's accepted here —
 * this is bounded best-effort telemetry (self-heals, errors already
 * swallowed below), and a lock on this path isn't worth it.
 */
export function recordTurnEndOutcome(cwd, outcome) {
    try {
        const now = new Date().toISOString();
        const previous = readTurnEndStatus(cwd) ?? { ran: 0, skipped: 0 };
        const next = outcome.ran
            ? { ...previous, ran: previous.ran + 1, lastRunAt: now }
            : {
                ...previous,
                skipped: previous.skipped + 1,
                lastSkipReason: outcome.reason,
                lastSkipAt: now,
            };
        writeFileAtomic(turnEndStatusPathForCwd(cwd), `${JSON.stringify(next)}\n`);
    }
    catch {
        // telemetry only — a read-only tmpdir must not break the Stop hook
    }
}
/**
 * Ask the warm server to analyze a file. Resolves the server's result, or
 * `undefined` on ANY failure (no server, refused, stale socket, timeout, bad
 * response) so the caller transparently falls back to cold local analysis.
 */
export function requestWarmAnalyze(cwd, file, timeoutMs = 30_000) {
    return new Promise((resolve) => {
        let settled = false;
        const finish = (value) => {
            if (settled)
                return;
            settled = true;
            clearTimeout(timer);
            resolve(value);
        };
        const socket = net.createConnection(ipcPathForCwd(cwd));
        socket.setEncoding("utf8");
        let buffer = "";
        const timer = setTimeout(() => {
            socket.destroy();
            finish(undefined);
        }, timeoutMs);
        timer.unref();
        socket.on("connect", () => {
            const request = { file, cwd };
            socket.write(`${JSON.stringify(request)}\n`);
        });
        socket.on("data", (chunk) => {
            buffer += chunk;
            const newline = buffer.indexOf("\n");
            if (newline === -1)
                return;
            try {
                const message = JSON.parse(buffer.slice(0, newline));
                finish(message.error ? undefined : message.result);
            }
            catch {
                finish(undefined);
            }
            socket.end();
        });
        // No server / connection refused / reset → cold fallback.
        socket.on("error", () => finish(undefined));
        socket.on("close", () => finish(undefined));
    });
}
/**
 * One-shot line reader for the warm IPC socket (#1219). The clients write
 * exactly one newline-terminated request per connection and read one reply, so
 * the server must dispatch at most one line and ignore anything after it — a
 * `data` handler that keeps re-reading the same buffered line re-dispatches
 * the request on stray bytes. Returns the handler to attach to the socket's
 * `data` event.
 */
export function createWarmIpcLineReader(onLine) {
    let buffer = "";
    let dispatched = false;
    return (chunk) => {
        if (dispatched)
            return;
        buffer += chunk;
        const newline = buffer.indexOf("\n");
        if (newline === -1)
            return;
        dispatched = true;
        onLine(buffer.slice(0, newline));
    };
}
export function createWarmIpcRequestQueue() {
    let chain = Promise.resolve();
    return {
        enqueue(work) {
            const next = chain.then(work);
            chain = next.catch(() => undefined);
            return next;
        },
    };
}
