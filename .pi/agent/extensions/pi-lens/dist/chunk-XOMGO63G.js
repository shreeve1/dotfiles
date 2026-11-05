import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  releaseManagedToolRefreshSlot,
  reserveManagedToolRefreshSlot
} from "./chunk-UXVNL3D7.js";
import {
  stripAnsi
} from "./chunk-6HWVI6MI.js";
import {
  OPENGREP_REGISTRY_PACK_URL,
  cachedOpengrepPackPath
} from "./chunk-5RNB4HVK.js";
import {
  HOOK_WALL_BUDGET_MS
} from "./chunk-CKEQFGLT.js";
import {
  bounded
} from "./chunk-JYLOYTZD.js";
import {
  acquireManagedInstallGate,
  commitDurableStoreAsync,
  findManagedToolBinary,
  getManagedToolsDir,
  getRefreshableManagedTools,
  invalidateManagedToolResolution,
  isManagedToolPresent,
  logSessionStart,
  npmToolNeedsPostinstall,
  refreshManagedTool,
  resolveManagedNpmBinPath,
  verifyToolBinary
} from "./chunk-BQG2QFVO.js";
import "./chunk-IYVYZQRL.js";
import {
  pmBinary,
  resolveNodePackageManager,
  updateArgs
} from "./chunk-VOP4PJKA.js";
import "./chunk-JBP7KESM.js";
import "./chunk-UYXV5NIS.js";
import "./chunk-JZRP4DGP.js";
import "./chunk-SDFKOLSF.js";
import "./chunk-BBET6HD6.js";
import "./chunk-G6JKM4O7.js";
import "./chunk-O2ARHQKF.js";
import {
  safeSpawnAsync
} from "./chunk-WMDUT4KH.js";
import "./chunk-AWQWXSW4.js";
import "./chunk-QYF5S6P6.js";
import "./chunk-G5GV2Q7K.js";
import "./chunk-X35S7HSB.js";
import "./chunk-SQC7K3SP.js";
import {
  writeFileAtomicAsync
} from "./chunk-JE6HKLC7.js";
import {
  recordDegradationOnce
} from "./chunk-2453RRJ2.js";
import "./chunk-WQV6BI4Q.js";
import "./chunk-S26LC76R.js";
import "./chunk-565VRUP4.js";
import {
  isTestMode
} from "./chunk-VLQ7UKZH.js";
import "./chunk-LJDODBBZ.js";
import "./chunk-GMROJJRN.js";
import "./chunk-NXL4FFQQ.js";

// dist/clients/installer/managed-tool-refresh.js
import * as crypto from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";
var STATE_FILENAME = ".refresh-state.json";
var STATE_VERSION = 1;
var DEFAULT_INTERVAL_MS = 7 * 24 * 60 * 60 * 1e3;
var DEFAULT_RETRY_INTERVAL_MS = 24 * 60 * 60 * 1e3;
var DEFAULT_MAX_PER_SESSION = 1;
var DEFAULT_TIMEOUT_MS = 12e4;
function numericEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === void 0)
    return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}
function refreshIntervalMs() {
  return numericEnv("PI_LENS_TOOL_REFRESH_INTERVAL_MS", DEFAULT_INTERVAL_MS);
}
function retryIntervalMs() {
  return numericEnv("PI_LENS_TOOL_REFRESH_RETRY_MS", DEFAULT_RETRY_INTERVAL_MS);
}
function maxPerSession() {
  return numericEnv("PI_LENS_TOOL_REFRESH_MAX_PER_SESSION", DEFAULT_MAX_PER_SESSION);
}
function refreshTimeoutMs() {
  return numericEnv("PI_LENS_INSTALL_TIMEOUT_MS", DEFAULT_TIMEOUT_MS);
}
function emptyState() {
  return { version: STATE_VERSION, tools: {} };
}
function getManagedToolRefreshStatePath() {
  return path.join(getManagedToolsDir(), STATE_FILENAME);
}
function parseEntry(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return void 0;
  }
  const candidate = value;
  if (typeof candidate.checkedAt !== "number")
    return void 0;
  if (!Number.isFinite(candidate.checkedAt))
    return void 0;
  return {
    checkedAt: candidate.checkedAt,
    ...typeof candidate.version === "string" && {
      version: candidate.version
    },
    ...typeof candidate.resolutionId === "string" && {
      resolutionId: candidate.resolutionId
    },
    ...typeof candidate.etag === "string" && { etag: candidate.etag },
    ...candidate.failed === true && { failed: true }
  };
}
function parseState(contents) {
  const parsed = JSON.parse(contents);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("refresh-state root is not an object");
  }
  const rawTools = parsed.tools;
  if (!rawTools || typeof rawTools !== "object" || Array.isArray(rawTools)) {
    throw new Error("refresh-state.tools is not an object");
  }
  const tools = {};
  for (const [toolId, value] of Object.entries(rawTools)) {
    const entry = parseEntry(value);
    if (entry)
      tools[toolId] = entry;
  }
  return { version: STATE_VERSION, tools };
}
async function readManagedToolRefreshState() {
  let contents;
  try {
    contents = await fs.readFile(getManagedToolRefreshStatePath(), "utf-8");
  } catch (err) {
    const code = err.code;
    if (code === "ENOENT")
      return { status: "empty", state: emptyState() };
    return { status: "unreadable", reason: code ?? "read error" };
  }
  try {
    return { status: "ok", state: parseState(contents) };
  } catch (err) {
    return { status: "unreadable", reason: err.message };
  }
}
async function writeRefreshStamp(toolId, entry, options = {}) {
  try {
    await fs.mkdir(getManagedToolsDir(), { recursive: true });
    const committed = await commitDurableStoreAsync({
      path: getManagedToolRefreshStatePath(),
      deserialize: (contents) => {
        if (contents === void 0)
          return emptyState();
        try {
          return parseState(contents);
        } catch {
          return emptyState();
        }
      },
      merge: (disk) => {
        const current = disk.tools[toolId];
        if (options.retainNewerSuccess === true && entry.failed === true && current !== void 0 && current.failed !== true && current.checkedAt >= entry.checkedAt) {
          return disk;
        }
        disk.tools[toolId] = entry;
        return disk;
      },
      serialize: (disk) => JSON.stringify(disk, null, 2),
      waitMs: 2e3,
      retryMs: 25,
      staleMs: 6e4,
      timeoutMessage: "Timed out waiting for managed-tool refresh-state lock",
      onContention: "skip-log",
      logContention: () => {
        logSessionStart(`managed-tool-refresh ${toolId}: stamp deferred because another process owns the lock`);
      }
    });
    if (committed !== void 0 && committed.tools[toolId] !== entry) {
      logSessionStart(`managed-tool-refresh ${toolId}: kept a newer successful stamp (checkedAt ${committed.tools[toolId]?.checkedAt ?? "unknown"}) \u2014 this failure does not replace it`);
    }
  } catch (err) {
    recordDegradationOnce({
      kind: "managed-tool-refresh",
      subject: toolId,
      reason: `stamp write failed: ${err.message}`
    });
    logSessionStart(`managed-tool-refresh ${toolId}: stamp write failed (${err.message})`);
  }
}
async function stampManagedToolInstall(toolId, resolutionId, now = Date.now()) {
  await writeRefreshStamp(toolId, {
    checkedAt: now,
    ...resolutionId !== void 0 && { resolutionId }
  });
}
async function stampManagedToolInstalled(toolId, packageName, now = Date.now()) {
  const version = await readInstalledVersion(packageName);
  await writeRefreshStamp(toolId, {
    checkedAt: now,
    ...version !== void 0 && { version }
  });
}
async function installedRefreshCandidates() {
  const candidates = [];
  for (const tool of getRefreshableManagedTools()) {
    if (!await isManagedToolPresent(tool.toolId))
      continue;
    candidates.push({
      toolId: tool.toolId,
      strategy: tool.strategy,
      checkArgs: tool.checkArgs,
      verificationTimeoutMs: tool.verificationTimeoutMs ?? 1e4,
      ...tool.packageName !== void 0 && { packageName: tool.packageName },
      ...tool.binaryName !== void 0 && { binaryName: tool.binaryName },
      ...tool.packageEntryOf !== void 0 && {
        packageEntryOf: tool.packageEntryOf
      }
    });
  }
  const byPackage = /* @__PURE__ */ new Map();
  const distinct = [];
  for (const candidate of candidates) {
    if (candidate.strategy !== "npm" || !candidate.packageName) {
      distinct.push(candidate);
      continue;
    }
    const existing = byPackage.get(candidate.packageName);
    if (existing) {
      existing.coveredToolIds?.push(candidate.toolId);
      continue;
    }
    const representative = { ...candidate, coveredToolIds: [candidate.toolId] };
    byPackage.set(candidate.packageName, representative);
    distinct.push(representative);
  }
  return distinct;
}
function selectStaleTools(candidates, state, now) {
  const interval = refreshIntervalMs();
  const retry = retryIntervalMs();
  const due = candidates.filter((candidate) => {
    return (candidate.coveredToolIds ?? [candidate.toolId]).some((toolId) => {
      const entry = state.tools[toolId];
      if (!entry)
        return true;
      const cooldown = entry.failed ? retry : interval;
      return now - entry.checkedAt >= cooldown;
    });
  });
  return due.sort((a, b) => {
    const aAt = Math.min(...(a.coveredToolIds ?? [a.toolId]).map((toolId) => state.tools[toolId]?.checkedAt ?? 0));
    const bAt = Math.min(...(b.coveredToolIds ?? [b.toolId]).map((toolId) => state.tools[toolId]?.checkedAt ?? 0));
    return aAt !== bAt ? aAt - bAt : a.toolId.localeCompare(b.toolId);
  });
}
async function readInstalledVersion(packageName) {
  try {
    const raw = await fs.readFile(path.join(getManagedToolsDir(), "node_modules", packageName, "package.json"), "utf-8");
    const parsed = JSON.parse(raw);
    const version = parsed?.version;
    return typeof version === "string" ? version : void 0;
  } catch {
    return void 0;
  }
}
async function refreshOne(candidate, entry, now) {
  return candidate.strategy === "npm" ? refreshNpmOne(candidate, now) : refreshNonNpmOne(candidate, entry, now);
}
async function refreshNonNpmOne(candidate, entry, now) {
  const previousVersion = entry?.version;
  const startedAt = Date.now();
  const attempt = await refreshManagedTool(candidate.toolId, {
    ...entry?.resolutionId !== void 0 && {
      resolutionId: entry.resolutionId
    },
    ...entry?.etag !== void 0 && { etag: entry.etag },
    ...previousVersion !== void 0 && { version: previousVersion }
  });
  const elapsedMs = Date.now() - startedAt;
  if (!attempt.ok) {
    if (attempt.declined) {
      logSessionStart(`managed-tool-refresh ${candidate.toolId}: ${candidate.strategy} refresh declined after ${elapsedMs}ms (${attempt.reason ?? "unknown"}) \u2014 no stamp written, retried next session`);
      return {
        toolId: candidate.toolId,
        strategy: candidate.strategy,
        ...candidate.packageName !== void 0 && {
          packageName: candidate.packageName
        },
        previousVersion,
        currentVersion: previousVersion,
        changed: false,
        verified: false,
        ok: false,
        attempted: false
      };
    }
    invalidateManagedToolResolution(candidate.toolId);
    recordDegradationOnce({
      kind: "managed-tool-refresh",
      subject: candidate.toolId,
      reason: `${candidate.strategy} refresh failed: ${attempt.reason ?? "unknown"}`
    });
    logSessionStart(`managed-tool-refresh ${candidate.toolId}: ${candidate.strategy} refresh failed after ${elapsedMs}ms \u2014 keeping ${previousVersion ?? "installed"} (${attempt.reason ?? "unknown"})`);
    await writeRefreshStamp(candidate.toolId, {
      checkedAt: now,
      failed: true,
      ...previousVersion !== void 0 && { version: previousVersion },
      ...entry?.resolutionId !== void 0 && {
        resolutionId: entry.resolutionId
      }
      // Deliberately NOT carrying `entry.etag` forward: a stamp that replays
      // the validator of a run whose download failed would get a 304 next
      // time and skip the install that never happened.
    }, { retainNewerSuccess: true });
    return {
      toolId: candidate.toolId,
      strategy: candidate.strategy,
      ...candidate.packageName !== void 0 && {
        packageName: candidate.packageName
      },
      previousVersion,
      currentVersion: previousVersion,
      changed: false,
      // No spawn to verify for the non-npm strategies — a failed refresh never
      // touched the installed copy, so there is nothing new to check.
      verified: false,
      ok: false,
      attempted: true
    };
  }
  const currentVersion = attempt.version;
  const changed = !attempt.unchanged;
  await writeRefreshStamp(candidate.toolId, {
    checkedAt: now,
    ...currentVersion !== void 0 && { version: currentVersion },
    ...attempt.resolutionId !== void 0 && {
      resolutionId: attempt.resolutionId
    },
    ...attempt.etag !== void 0 && { etag: attempt.etag }
  });
  logSessionStart(changed ? `managed-tool-refresh ${candidate.toolId}: ${previousVersion ?? "unknown"} \u2192 ${currentVersion ?? "unknown"} via ${candidate.strategy} (${elapsedMs}ms)` : `managed-tool-refresh ${candidate.toolId}: unchanged at ${currentVersion ?? previousVersion ?? "unknown"} via ${candidate.strategy} (${elapsedMs}ms)`);
  return {
    toolId: candidate.toolId,
    strategy: candidate.strategy,
    ...candidate.packageName !== void 0 && {
      packageName: candidate.packageName
    },
    previousVersion,
    currentVersion,
    changed,
    // `refreshManagedTool` already verifies the artifact it just wrote
    // (`verifyRefreshedArtifact` for github/archive/maven, the `--version`
    // probe for pip/gem) — `ok: true` here already means "and it runs".
    verified: true,
    ok: true,
    attempted: true
  };
}
async function refreshNpmOne(candidate, now) {
  const packageName = candidate.packageName;
  const gateStartedAt = Date.now();
  const gate = await acquireManagedInstallGate(`managed tool refresh: ${candidate.toolId}`);
  if (!gate.ok) {
    logSessionStart(`managed-tool-refresh ${candidate.toolId}: npm refresh declined after ${Date.now() - gateStartedAt}ms (${gate.reason ?? "unknown"}) \u2014 no stamp written, retried next session`);
    return {
      toolId: candidate.toolId,
      strategy: "npm",
      packageName,
      changed: false,
      verified: false,
      ok: false,
      attempted: false
    };
  }
  try {
    return await performNpmRefresh(candidate, packageName, now);
  } finally {
    await gate.release?.();
  }
}
async function performNpmRefresh(candidate, packageName, now) {
  const toolsDir = getManagedToolsDir();
  const previousVersion = await readInstalledVersion(packageName);
  const pm = await resolveNodePackageManager(toolsDir);
  const testNpmScript = process.env.PI_LENS_TEST_MODE === "1" ? process.env.PI_LENS_TEST_NPM_SCRIPT : void 0;
  const command = testNpmScript ? process.execPath : pmBinary(pm);
  const args = [
    ...testNpmScript ? [testNpmScript] : [],
    ...updateArgs(pm, packageName, {
      ignoreScripts: !npmToolNeedsPostinstall(packageName)
    })
  ];
  const startedAt = Date.now();
  const spawned = await safeSpawnAsync(command, args, {
    cwd: toolsDir,
    timeout: refreshTimeoutMs(),
    ignoreAmbientSignal: true,
    lifetimeCoupled: true
  });
  const elapsedMs = Date.now() - startedAt;
  if (spawned.status !== 0 || spawned.error) {
    const reason = (spawned.error?.message ?? spawned.stderr ?? "").slice(0, 200);
    const coveredIds = candidate.coveredToolIds?.join(",") ?? candidate.toolId;
    const onDisk = await readInstalledVersion(packageName);
    invalidateManagedToolResolution(candidate.toolId);
    recordDegradationOnce({
      kind: "managed-tool-refresh",
      subject: candidate.toolId,
      reason: `package ${packageName}, covered ids ${coveredIds}; ${pm} update failed: ${reason || "non-zero exit"}`
    });
    logSessionStart(`managed-tool-refresh ${candidate.toolId}: ${pm} update failed after ${elapsedMs}ms \u2014 package ${packageName}, covered ids ${coveredIds}; on disk now ${onDisk ?? "unreadable"} (was ${previousVersion ?? "unknown"}); resolution cache cleared for re-probe (${reason || "non-zero exit"})`);
    await writeRefreshStamp(candidate.toolId, {
      checkedAt: now,
      failed: true,
      ...onDisk !== void 0 && { version: onDisk }
    }, { retainNewerSuccess: true });
    return {
      toolId: candidate.toolId,
      strategy: "npm",
      packageName,
      previousVersion,
      currentVersion: onDisk,
      changed: onDisk !== void 0 && onDisk !== previousVersion,
      verified: false,
      ok: false,
      attempted: true
    };
  }
  const currentVersion = await readInstalledVersion(packageName);
  const changed = currentVersion !== void 0 && currentVersion !== previousVersion;
  invalidateManagedToolResolution(candidate.toolId);
  const binaryName = candidate.binaryName;
  const binPath = resolveManagedNpmBinPath(binaryName);
  const verified = await verifyToolBinary(
    binPath,
    void 0,
    void 0,
    candidate.verificationTimeoutMs,
    candidate.checkArgs,
    // #2722: the same verification the install used. Without this the daily
    // refresh would demand a `--version` verdict from a server that can never
    // give one — a ~4 MB doomed spawn that stamps the refresh failed forever.
    candidate.packageEntryOf
  );
  if (!verified) {
    const coveredIds = candidate.coveredToolIds?.join(",") ?? candidate.toolId;
    recordDegradationOnce({
      kind: "managed-tool-refresh",
      subject: candidate.toolId,
      reason: `package ${packageName}, covered ids ${coveredIds}; binary failed verification after ${pm} update (${previousVersion ?? "unknown"} \u2192 ${currentVersion ?? "unknown"})`
    });
    logSessionStart(`managed-tool-refresh ${candidate.toolId}: ${pm} update ran but ${binPath} failed verification \u2014 package ${packageName}, covered ids ${coveredIds}; resolution cache cleared for re-probe (${elapsedMs}ms)`);
    await writeRefreshStamp(candidate.toolId, {
      checkedAt: now,
      failed: true,
      ...currentVersion !== void 0 && { version: currentVersion }
    }, { retainNewerSuccess: true });
    return {
      toolId: candidate.toolId,
      strategy: "npm",
      packageName: candidate.packageName,
      previousVersion,
      currentVersion,
      changed,
      verified: false,
      ok: false,
      attempted: true
    };
  }
  await writeRefreshStamp(candidate.toolId, {
    checkedAt: now,
    ...currentVersion !== void 0 && { version: currentVersion }
  });
  logSessionStart(changed ? `managed-tool-refresh ${candidate.toolId}: ${previousVersion ?? "unknown"} \u2192 ${currentVersion} via ${pm} update, verified; package ${packageName}, covered ids ${candidate.coveredToolIds?.join(",") ?? candidate.toolId} (${elapsedMs}ms)` : `managed-tool-refresh ${candidate.toolId}: unchanged at ${currentVersion ?? previousVersion ?? "unknown"}; package ${packageName}, covered ids ${candidate.coveredToolIds?.join(",") ?? candidate.toolId} (${elapsedMs}ms)`);
  return {
    toolId: candidate.toolId,
    strategy: "npm",
    packageName,
    previousVersion,
    currentVersion,
    changed,
    verified: true,
    ok: true,
    attempted: true
  };
}
var refreshInFlight = null;
var noopTap = () => {
};
function runManagedToolRefresh(now = Date.now(), options = {}) {
  const joined = refreshInFlight;
  if (joined) {
    logSessionStart("managed-tool-refresh: joining the refresh already in flight");
    return joined;
  }
  const run = executeManagedToolRefresh(now, noopTap).then(async (outcome) => {
    if (options.rulePack !== false)
      await refreshOpengrepRulePack(now);
    return outcome;
  }).finally(() => {
    refreshInFlight = null;
  });
  refreshInFlight = run;
  return run;
}
function runManagedToolRefreshForExploration(now, tap) {
  return executeManagedToolRefresh(now, tap);
}
async function executeManagedToolRefresh(now, tap = noopTap) {
  if (process.env.PI_LENS_DISABLE_TOOL_REFRESH === "1") {
    return { skipped: "disabled", refreshed: [] };
  }
  if (!reserveManagedToolRefreshSlot(maxPerSession())) {
    return { skipped: "session-budget", refreshed: [] };
  }
  let held = 1;
  const releaseReservation = () => {
    while (held > 0) {
      releaseManagedToolRefreshSlot();
      held -= 1;
    }
  };
  try {
    const candidates = await installedRefreshCandidates();
    await tap();
    if (candidates.length === 0) {
      releaseReservation();
      return { skipped: "no-candidates", refreshed: [] };
    }
    const read = await readManagedToolRefreshState();
    await tap();
    if (read.status === "unreadable") {
      releaseReservation();
      recordDegradationOnce({
        kind: "managed-tool-refresh",
        subject: "refresh-state",
        reason: `refresh state unreadable (${read.reason}); skipping refresh this session`
      });
      logSessionStart(`managed-tool-refresh: state unreadable (${read.reason}) \u2014 no tool refreshed this session`);
      return { skipped: "state-unreadable", refreshed: [] };
    }
    const stale = selectStaleTools(candidates, read.state, now);
    if (stale.length === 0) {
      releaseReservation();
      return { skipped: "nothing-due", refreshed: [] };
    }
    const stalePackages = /* @__PURE__ */ new Set();
    const distinctStale = stale.filter((candidate) => {
      if (candidate.strategy !== "npm" || !candidate.packageName)
        return true;
      if (stalePackages.has(candidate.packageName))
        return false;
      stalePackages.add(candidate.packageName);
      return true;
    });
    const want = Math.min(maxPerSession(), distinctStale.length);
    while (held < want && reserveManagedToolRefreshSlot(maxPerSession())) {
      held += 1;
    }
    let allowance = held;
    const refreshed = [];
    for (const candidate of distinctStale) {
      if (allowance <= 0)
        break;
      allowance -= 1;
      held -= 1;
      try {
        const result = await refreshOne(candidate, read.state.tools[candidate.toolId], now);
        refreshed.push(result);
        if (result.attempted && candidate.coveredToolIds) {
          for (const toolId of candidate.coveredToolIds) {
            if (toolId === candidate.toolId)
              continue;
            await bounded(writeRefreshStamp(toolId, {
              checkedAt: now,
              ...result.currentVersion !== void 0 && {
                version: result.currentVersion
              },
              ...result.ok ? {} : { failed: true }
            }, { retainNewerSuccess: true }), {
              ms: HOOK_WALL_BUDGET_MS.session_start,
              // The unref'd timer runs after session_start returns, so no
              // live turn signal belongs to this background refresh.
              signal: void 0,
              hook: "session_start",
              label: "writeRefreshStamp:covered-tool"
            });
          }
        }
        await tap();
      } catch (err) {
        recordDegradationOnce({
          kind: "managed-tool-refresh",
          subject: candidate.toolId,
          reason: `refresh threw: ${err.message}`
        });
      }
    }
    return { refreshed };
  } finally {
    releaseReservation();
  }
}
var OPENGREP_PACK_STAMP_ID = "opengrep-rules";
var PACK_FETCH_TIMEOUT_MS = 6e4;
var PACK_VALIDATE_TIMEOUT_MS = 18e4;
var PACK_MAX_BYTES = 16 * 1024 * 1024;
var PACK_MIN_RULES = 100;
function opengrepPackUrl() {
  if (isTestMode()) {
    return process.env.PI_LENS_TEST_OPENGREP_PACK_URL;
  }
  return OPENGREP_REGISTRY_PACK_URL;
}
async function downloadOpengrepPack(url) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(PACK_FETCH_TIMEOUT_MS),
    // `identity` is load-bearing: semgrep.dev/c/auto answers a client that
    // accepts gzip (Node's fetch does by default) with the rule set as JSON,
    // and one that does not with YAML (measured 2026-10-23). The CLI loads
    // either from a `.yaml` file; the language server loads the JSON as zero
    // rules and publishes empty diagnostics, which would turn a cached pack
    // into a silent clean scan.
    headers: { "User-Agent": "pi-lens/1.0", "Accept-Encoding": "identity" }
  });
  if (!res.ok)
    throw new Error(`HTTP ${res.status}`);
  if (!res.body)
    throw new Error("empty response body");
  const chunks = [];
  let total = 0;
  const reader = res.body.getReader();
  for (; ; ) {
    const { done, value } = await reader.read();
    if (done)
      break;
    total += value.byteLength;
    if (total > PACK_MAX_BYTES) {
      await reader.cancel();
      throw new Error(`body exceeds ${PACK_MAX_BYTES} bytes`);
    }
    chunks.push(value);
  }
  const bytes = Buffer.concat(chunks);
  if (bytes.toString("utf-8", 0, 64).trimStart().startsWith("{"))
    throw new Error("registry answered JSON, not the YAML rule file");
  return bytes;
}
async function validateOpengrepPack(binary, candidate) {
  const spawned = await safeSpawnAsync(binary, ["scan", "--validate", "--config", candidate, "--disable-version-check"], {
    cwd: path.dirname(candidate),
    timeout: PACK_VALIDATE_TIMEOUT_MS,
    ignoreAmbientSignal: true,
    lifetimeCoupled: true
  });
  if (spawned.status !== 0) {
    const detail = spawned.stderr.trim() || spawned.failure || `exit ${spawned.status}`;
    return `opengrep --validate failed: ${detail}`.slice(0, 240);
  }
  const count = /(\d+) rule\(s\)/.exec(stripAnsi(`${spawned.stdout}
${spawned.stderr}`));
  const rules = count ? Number(count[1]) : 0;
  if (rules < PACK_MIN_RULES) {
    return `opengrep --validate reported ${count ? rules : "no"} rules (floor ${PACK_MIN_RULES})`;
  }
  return void 0;
}
var PACK_CANDIDATE_MAX_AGE_MS = 60 * 60 * 1e3;
async function sweepStaleCandidates(finalPath) {
  const dir = path.dirname(finalPath);
  const prefix = `${path.basename(finalPath)}.candidate-`;
  try {
    for (const name of await fs.readdir(dir)) {
      if (!name.startsWith(prefix))
        continue;
      const file = path.join(dir, name);
      const { mtimeMs } = await fs.stat(file);
      if (Date.now() - mtimeMs > PACK_CANDIDATE_MAX_AGE_MS)
        await fs.rm(file, { force: true });
    }
  } catch (err) {
    logSessionStart(`managed-tool-refresh ${OPENGREP_PACK_STAMP_ID}: could not sweep stale candidates (${err.message})`);
  }
}
async function refreshOpengrepRulePack(now = Date.now()) {
  try {
    if (process.env.PI_LENS_DISABLE_TOOL_REFRESH === "1")
      return "skipped";
    const url = opengrepPackUrl();
    if (!url)
      return "skipped";
    const binary = await findManagedToolBinary("opengrep");
    if (!binary)
      return "skipped";
    const read = await readManagedToolRefreshState();
    if (read.status === "unreadable") {
      recordDegradationOnce({
        kind: "managed-tool-refresh",
        subject: "refresh-state",
        reason: `refresh state unreadable (${read.reason}); skipping refresh this session`
      });
      return "skipped";
    }
    const entry = read.state.tools[OPENGREP_PACK_STAMP_ID];
    if (entry && now - entry.checkedAt < (entry.failed ? retryIntervalMs() : refreshIntervalMs())) {
      return "skipped";
    }
    const declined = async (phase) => {
      logSessionStart(`managed-tool-refresh ${OPENGREP_PACK_STAMP_ID}: declined (${phase}) \u2014 no stamp written, retried next session`);
      return "declined";
    };
    const pre = await acquireManagedInstallGate(`managed tool refresh: ${OPENGREP_PACK_STAMP_ID}`);
    if (!pre.ok)
      return declined(pre.reason ?? "unknown");
    await pre.release?.();
    const finalPath = cachedOpengrepPackPath();
    const candidate = `${finalPath}.candidate-${process.pid}-${crypto.randomBytes(4).toString("hex")}`;
    const startedAt = Date.now();
    try {
      await fs.mkdir(path.dirname(finalPath), { recursive: true });
      await sweepStaleCandidates(finalPath);
      const bytes = await downloadOpengrepPack(url);
      const digest = crypto.createHash("sha256").update(bytes).digest("hex");
      let current;
      try {
        current = await fs.readFile(finalPath);
      } catch (err) {
        if (err.code !== "ENOENT")
          throw err;
      }
      if (current && crypto.createHash("sha256").update(current).digest("hex") === digest) {
        await writeRefreshStamp(OPENGREP_PACK_STAMP_ID, {
          checkedAt: now,
          version: digest.slice(0, 12)
        });
        logSessionStart(`managed-tool-refresh ${OPENGREP_PACK_STAMP_ID}: unchanged at ${digest.slice(0, 12)} (${Date.now() - startedAt}ms)`);
        return "unchanged";
      }
      await writeFileAtomicAsync(candidate, bytes, { bestEffort: false });
      const rejected = await validateOpengrepPack(binary, candidate);
      if (rejected)
        throw new Error(rejected);
      const swap = await acquireManagedInstallGate(`managed tool refresh: ${OPENGREP_PACK_STAMP_ID} (swap)`);
      if (!swap.ok)
        return await declined(swap.reason ?? "unknown");
      try {
        const after = await readManagedToolRefreshState();
        const latest = after.status === "ok" ? after.state.tools[OPENGREP_PACK_STAMP_ID] : void 0;
        if (latest && !latest.failed && latest.checkedAt !== entry?.checkedAt) {
          logSessionStart(`managed-tool-refresh ${OPENGREP_PACK_STAMP_ID}: another process refreshed first \u2014 keeping its pack`);
          return "skipped";
        }
        await fs.rename(candidate, finalPath);
        await writeRefreshStamp(OPENGREP_PACK_STAMP_ID, {
          checkedAt: now,
          version: digest.slice(0, 12)
        });
      } finally {
        await swap.release?.();
      }
      logSessionStart(`managed-tool-refresh ${OPENGREP_PACK_STAMP_ID}: cached pack now ${digest.slice(0, 12)} (${bytes.byteLength} bytes, ${Date.now() - startedAt}ms)`);
      return "refreshed";
    } catch (err) {
      const reason = err.message;
      recordDegradationOnce({
        kind: "managed-tool-refresh",
        subject: OPENGREP_PACK_STAMP_ID,
        reason: `rule pack refresh failed: ${reason}`
      });
      logSessionStart(`managed-tool-refresh ${OPENGREP_PACK_STAMP_ID}: refresh failed after ${Date.now() - startedAt}ms \u2014 keeping the current pack (${reason})`);
      await writeRefreshStamp(
        OPENGREP_PACK_STAMP_ID,
        {
          checkedAt: now,
          failed: true,
          ...entry?.version !== void 0 && { version: entry.version }
        },
        // A winner that stamped while this attempt was validating keeps its
        // `{checkedAt, version}` and its weekly cadence (shape 21).
        { retainNewerSuccess: true }
      );
      return "failed";
    } finally {
      try {
        await fs.rm(candidate, { force: true });
      } catch (err) {
        logSessionStart(`managed-tool-refresh ${OPENGREP_PACK_STAMP_ID}: could not remove ${candidate} (${err.message})`);
      }
    }
  } catch (err) {
    recordDegradationOnce({
      kind: "managed-tool-refresh",
      subject: OPENGREP_PACK_STAMP_ID,
      reason: `rule pack refresh threw: ${err.message}`
    });
    return "failed";
  }
}
export {
  getManagedToolRefreshStatePath,
  readManagedToolRefreshState,
  refreshOpengrepRulePack,
  runManagedToolRefresh,
  runManagedToolRefreshForExploration,
  selectStaleTools,
  stampManagedToolInstall,
  stampManagedToolInstalled
};
