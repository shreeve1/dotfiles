import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  DEFAULT_MAX_OUTPUT_BYTES,
  writeFileAtomic
} from "./chunk-2EECBNC5.js";
import {
  incrementDegradationCount
} from "./chunk-JAU72XNY.js";
import {
  normalizeMapKey
} from "./chunk-N2H3ZPZY.js";

// dist/clients/mcp/ipc.js
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as net from "node:net";
import * as os from "node:os";
import * as path from "node:path";
var WARM_DIAGNOSTICS_SCHEMA_VERSION = 1;
var WARM_CODE_ACTION_LOOKUP_LIMIT = 6;
function ipcPathForCwd(cwd, platform = process.platform) {
  const hash = workspaceHash(cwd, platform);
  if (platform === "win32") {
    return `\\\\.\\pipe\\pi-lens-mcp-${hash}`;
  }
  return path.join(os.tmpdir(), `pi-lens-mcp-${hash}.sock`);
}
function workspaceHash(cwd, platform = process.platform) {
  const resolved = path.resolve(cwd);
  const root = platform === "win32" || platform === "darwin" ? resolved.toLowerCase() : resolved;
  return crypto.createHash("sha256").update(root).digest("hex").slice(0, 16);
}
function diagnosticsIpcPathForCwd(cwd, pid, platform = process.platform) {
  const base = ipcPathForCwd(cwd, platform);
  if (platform === "win32")
    return `${base}-diagnostics-${pid}`;
  return base.replace(/\.sock$/, `-diagnostics-${pid}.sock`);
}
function isNoListenerError(error) {
  const code = error?.code;
  return code === "ENOENT" || code === "ECONNREFUSED";
}
function contentHash(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}
function requestOverWarmIpc(endpoint, timeoutMs, buildRequest, validate) {
  return new Promise((resolve3) => {
    let settled = false;
    const finish = (value) => {
      if (settled)
        return;
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      resolve3(value);
    };
    const deadlineAt = Date.now() + timeoutMs;
    const socket = net.createConnection(endpoint);
    socket.setEncoding("utf8");
    const timer = setTimeout(() => finish({ available: false, reason: "timeout" }), timeoutMs);
    timer.unref();
    socket.on("connect", () => {
      socket.write(`${JSON.stringify(buildRequest(deadlineAt))}
`);
    });
    socket.on("data", createWarmIpcLineReader((line) => {
      try {
        const message = JSON.parse(line);
        const result = message.result;
        if (message.error || !result) {
          finish({ available: false, reason: "ipc-error" });
          return;
        }
        const reason = validate(result, deadlineAt);
        if (reason === void 0) {
          finish({ available: true, response: result });
        } else {
          finish({ available: false, reason });
        }
      } catch {
        finish({ available: false, reason: "schema-mismatch" });
      }
    }, {
      label: "warm-diagnostics-reply",
      onOverflow: () => finish({ available: false, reason: "ipc-error" })
    }));
    socket.on("error", (error) => finish({
      available: false,
      reason: isNoListenerError(error) ? "no-listener" : "ipc-error"
    }));
    socket.on("close", () => finish({ available: false, reason: "ipc-error" }));
  });
}
function requestWarmDiagnostics(cwd, incumbentPid, file, content, timeoutMs) {
  const expectedHash = contentHash(content);
  return requestOverWarmIpc(diagnosticsIpcPathForCwd(cwd, incumbentPid), timeoutMs, (deadlineAt) => ({
    route: "diagnostics",
    version: WARM_DIAGNOSTICS_SCHEMA_VERSION,
    file,
    cwd,
    content,
    contentHash: expectedHash,
    deadlineAt
  }), (result, deadlineAt) => {
    if (result.route !== "diagnostics" || result.version !== WARM_DIAGNOSTICS_SCHEMA_VERSION) {
      return "schema-mismatch";
    }
    if (!result.fresh || result.inconclusive || result.contentHash !== expectedHash || result.servedAt > deadlineAt) {
      return "stale-answer";
    }
    return void 0;
  });
}
function requestWarmCodeActions(cwd, incumbentPid, file, expectedContentHash, ranges, timeoutMs) {
  return requestOverWarmIpc(diagnosticsIpcPathForCwd(cwd, incumbentPid), timeoutMs, (deadlineAt) => ({
    route: "code-actions",
    version: WARM_DIAGNOSTICS_SCHEMA_VERSION,
    file,
    cwd,
    contentHash: expectedContentHash,
    ranges,
    deadlineAt
  }), (result, deadlineAt) => {
    if (result.route !== "code-actions" || result.version !== WARM_DIAGNOSTICS_SCHEMA_VERSION || !Array.isArray(result.actions) || result.actions.length !== ranges.length || result.actions.some((actions) => !Array.isArray(actions))) {
      return "schema-mismatch";
    }
    if (result.contentHash !== expectedContentHash || result.servedAt > deadlineAt) {
      return "stale-answer";
    }
    return void 0;
  });
}
var WARM_TURN_END_SCHEMA_VERSION = 2;
async function requestWarmTurnEnd(cwd, timeoutMs = 55e3) {
  const startedAt = Date.now();
  const first = await requestOverWarmIpc(ipcPathForCwd(cwd), timeoutMs, () => ({
    route: "turn-end",
    version: WARM_TURN_END_SCHEMA_VERSION,
    cwd
  }), (result) => result.route === "turn-end" && result.version === WARM_TURN_END_SCHEMA_VERSION ? void 0 : "schema-mismatch");
  if (!first.available || !first.response.deliveryId)
    return first;
  const remainingMs = timeoutMs - (Date.now() - startedAt);
  if (remainingMs <= 0)
    return { available: false, reason: "timeout" };
  const ack = await requestOverWarmIpc(ipcPathForCwd(cwd), remainingMs, () => ({
    route: "turn-end-ack",
    version: WARM_TURN_END_SCHEMA_VERSION,
    cwd,
    deliveryId: first.response.deliveryId
  }), (result) => result.route === "turn-end-ack" && result.acknowledged === true ? void 0 : "ipc-error");
  return ack.available ? { available: true, response: first.response } : { available: false, reason: ack.reason };
}
function turnEndStatusPathForCwd(cwd, platform = process.platform) {
  return path.join(os.tmpdir(), `pi-lens-turn-end-${workspaceHash(cwd, platform)}.json`);
}
function readTurnEndStatus(cwd, platform = process.platform) {
  try {
    const raw = fs.readFileSync(turnEndStatusPathForCwd(cwd, platform), "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object")
      return void 0;
    return {
      ran: typeof parsed.ran === "number" ? parsed.ran : 0,
      skipped: typeof parsed.skipped === "number" ? parsed.skipped : 0,
      failed: typeof parsed.failed === "number" ? parsed.failed : 0,
      lastSkipReason: parsed.lastSkipReason,
      lastRunAt: parsed.lastRunAt,
      lastSkipAt: parsed.lastSkipAt,
      lastFailureOperation: parsed.lastFailureOperation,
      lastFailureReason: parsed.lastFailureReason,
      lastFailureAt: parsed.lastFailureAt
    };
  } catch {
    return void 0;
  }
}
function recordTurnEndOutcome(cwd, outcome, platform = process.platform) {
  try {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const previous = readTurnEndStatus(cwd, platform) ?? {
      ran: 0,
      skipped: 0,
      failed: 0
    };
    let next;
    if ("failed" in outcome) {
      next = {
        ...previous,
        failed: previous.failed + 1,
        lastFailureOperation: outcome.operation,
        lastFailureReason: outcome.reason,
        lastFailureAt: now
      };
    } else {
      next = outcome.ran ? { ...previous, ran: previous.ran + 1, lastRunAt: now } : {
        ...previous,
        skipped: previous.skipped + 1,
        lastSkipReason: outcome.reason,
        lastSkipAt: now
      };
    }
    writeFileAtomic(turnEndStatusPathForCwd(cwd, platform), `${JSON.stringify(next)}
`);
  } catch {
  }
}
function requestWarmAnalyze(cwd, file, timeoutMs = 3e4) {
  return new Promise((resolve3) => {
    let settled = false;
    const finish = (value) => {
      if (settled)
        return;
      settled = true;
      clearTimeout(timer);
      resolve3(value);
    };
    const socket = net.createConnection(ipcPathForCwd(cwd));
    socket.setEncoding("utf8");
    const timer = setTimeout(() => {
      socket.destroy();
      finish(void 0);
    }, timeoutMs);
    timer.unref();
    socket.on("connect", () => {
      const request = { file, cwd };
      socket.write(`${JSON.stringify(request)}
`);
    });
    socket.on("data", createWarmIpcLineReader((line) => {
      try {
        const message = JSON.parse(line);
        finish(message.error ? void 0 : message.result);
      } catch {
        finish(void 0);
      }
      socket.end();
    }, {
      label: "warm-analyze-reply",
      // `finish` here only clears the timer and resolves — unlike
      // `requestOverWarmIpc`'s, which destroys the socket itself — so the
      // peer that misframed would otherwise keep an open connection and
      // keep writing into a reader that ignores it.
      onOverflow: () => {
        socket.destroy();
        finish(void 0);
      }
    }));
    socket.on("error", () => finish(void 0));
    socket.on("close", () => finish(void 0));
  });
}
var MAX_FRAMED_LINE_BYTES = DEFAULT_MAX_OUTPUT_BYTES;
function createWarmIpcLineReader(onLine, options) {
  let buffer = "";
  let bufferedBytes = 0;
  let dispatched = false;
  let resyncing = false;
  const overflow = (frameBytes, awaitingNewline) => {
    buffer = "";
    bufferedBytes = 0;
    resyncing = awaitingNewline;
    if (options.continuous !== true)
      dispatched = true;
    incrementDegradationCount({
      kind: "ipc-frame-overflow",
      subject: options.label,
      reason: `discarded ${awaitingNewline ? "an unterminated" : "a complete"} line at ${frameBytes} bytes (limit ${MAX_FRAMED_LINE_BYTES})`,
      metadata: {
        limitBytes: MAX_FRAMED_LINE_BYTES,
        overflowBytes: frameBytes,
        terminated: !awaitingNewline
      }
    });
    options.onOverflow?.();
  };
  return (chunk) => {
    if (dispatched)
      return;
    let from = 0;
    if (resyncing) {
      const end = chunk.indexOf("\n");
      if (end === -1)
        return;
      resyncing = false;
      from = end + 1;
    }
    let newline = chunk.indexOf("\n", from);
    while (newline !== -1) {
      const segment = chunk.slice(from, newline);
      from = newline + 1;
      const frameBytes = bufferedBytes + Buffer.byteLength(segment);
      if (frameBytes > MAX_FRAMED_LINE_BYTES) {
        overflow(frameBytes, false);
        if (dispatched)
          return;
        newline = chunk.indexOf("\n", from);
        continue;
      }
      const line = buffer + segment;
      buffer = "";
      bufferedBytes = 0;
      if (options.continuous !== true) {
        dispatched = true;
        onLine(line);
        return;
      }
      onLine(line);
      newline = chunk.indexOf("\n", from);
    }
    if (from < chunk.length) {
      const rest = chunk.slice(from);
      buffer += rest;
      bufferedBytes += Buffer.byteLength(rest);
    }
    if (bufferedBytes <= MAX_FRAMED_LINE_BYTES)
      return;
    overflow(bufferedBytes, true);
  };
}
function createWarmIpcRequestQueue() {
  let chain = Promise.resolve();
  return {
    enqueue(work) {
      const next = chain.then(work);
      chain = next.catch(() => void 0);
      return next;
    }
  };
}

// dist/clients/dispatch/runner-context.js
import * as fs2 from "node:fs";
import * as path2 from "node:path";
function resolveAgainstAncestors(cwd, filePath) {
  if (path2.isAbsolute(filePath)) {
    return path2.resolve(filePath);
  }
  const normalizedRelative = filePath.replace(/\\/g, "/");
  const cwdBaseName = path2.basename(path2.resolve(cwd)).replace(/\\/g, "/");
  if (cwdBaseName && (normalizedRelative === cwdBaseName || normalizedRelative.startsWith(`${cwdBaseName}/`))) {
    const trimmedRelative = normalizedRelative === cwdBaseName ? "" : normalizedRelative.slice(cwdBaseName.length + 1);
    const trimmedCandidate = trimmedRelative ? path2.resolve(cwd, trimmedRelative) : path2.resolve(cwd);
    if (fs2.existsSync(trimmedCandidate)) {
      return trimmedCandidate;
    }
  }
  const directCandidate = path2.resolve(cwd, filePath);
  if (fs2.existsSync(directCandidate)) {
    return directCandidate;
  }
  let current = path2.resolve(cwd);
  const { root } = path2.parse(current);
  while (current !== root) {
    const parent = path2.dirname(current);
    if (parent === current)
      break;
    const candidate = path2.resolve(parent, filePath);
    if (fs2.existsSync(candidate)) {
      return candidate;
    }
    current = parent;
  }
  return directCandidate;
}
function resolveRunnerPath(cwd, filePath) {
  return normalizeMapKey(resolveAgainstAncestors(cwd, filePath));
}
function toRunnerDisplayPath(cwd, filePath) {
  const cwdKey = normalizeMapKey(path2.resolve(cwd));
  const fileKey = resolveRunnerPath(cwd, filePath);
  const relative2 = path2.relative(cwdKey, fileKey).replace(/\\/g, "/");
  if (relative2 && relative2 !== "." && !relative2.startsWith("../")) {
    return relative2;
  }
  return fileKey;
}

// dist/clients/freshness.js
var MTIME_DRIFT_TOLERANCE_MS = 50;
function freshnessFromMtime(input) {
  const tolerance = input.toleranceMs ?? MTIME_DRIFT_TOLERANCE_MS;
  if (input.mtimeMs === void 0) {
    return { verdict: "indeterminate", reason: "no-mtime-evidence" };
  }
  return input.mtimeMs > input.referenceMs + tolerance ? { verdict: "stale", reason: "modified-after-reference" } : { verdict: "fresh" };
}

export {
  resolveRunnerPath,
  toRunnerDisplayPath,
  freshnessFromMtime,
  WARM_CODE_ACTION_LOOKUP_LIMIT,
  ipcPathForCwd,
  diagnosticsIpcPathForCwd,
  contentHash,
  requestWarmDiagnostics,
  requestWarmCodeActions,
  WARM_TURN_END_SCHEMA_VERSION,
  requestWarmTurnEnd,
  readTurnEndStatus,
  recordTurnEndOutcome,
  requestWarmAnalyze,
  createWarmIpcLineReader,
  createWarmIpcRequestQueue
};
