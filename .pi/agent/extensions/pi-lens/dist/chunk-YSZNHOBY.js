import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  getToolCommandSpec,
  shouldAutoInstallTool
} from "./chunk-RPLINGVB.js";
import {
  BUILTIN_SERVER_RUNNER_COVERS,
  getServersForFileWithConfig,
  isAuxiliary,
  resolveAnalysisRootPath
} from "./chunk-EU63SDCG.js";
import {
  emitBounded
} from "./chunk-FCSOVF55.js";
import {
  PathKeyedMap
} from "./chunk-Z3CCVDUB.js";
import {
  ensureTool,
  findManagedToolBinary,
  getInstallAttempt,
  getLastEnsureResolutionSource,
  getToolInstallStrategy,
  isSpawnableCommand,
  logSessionStart,
  resetPathWalkMemo
} from "./chunk-ACXEQZOU.js";
import {
  resolveToolCwd
} from "./chunk-Q7DUK4LX.js";
import {
  VENDOR_BIN_DIRS,
  VENV_BIN_DIRS,
  findGlobalBinary,
  findLocalBinAt,
  findLocalBinUpwards,
  localBinPath
} from "./chunk-AW7R2GWG.js";
import {
  createAvailabilityProbeFlight,
  probeToolAsync
} from "./chunk-RWWYJ623.js";
import {
  classifyProbeFailure,
  createAvailabilityLatch,
  describeInstallAttempt,
  describeProbeEvidence,
  isLatchingOutcome,
  logAvailabilityDecision,
  startHostStallSampler,
  transientRetryDelayMs
} from "./chunk-VRZP76YM.js";
import {
  createGenerationSource,
  getGlobalPiLensDir,
  isInSpawnTimeoutCooldown,
  resolveWindowsCommandForEnvironment,
  safeSpawnAsync
} from "./chunk-C34ZXZ7O.js";
import {
  getProjectTrustState
} from "./chunk-ZANLILYD.js";
import {
  compareOrdinal,
  incrementDegradationCount
} from "./chunk-JAU72XNY.js";
import {
  isUnderDir,
  normalizeEphemeralMapKey,
  normalizeMapKey
} from "./chunk-N2H3ZPZY.js";

// dist/clients/dispatch/runners/utils/runner-helpers.js
import * as fs from "node:fs";
import * as path from "node:path";
import { delimiter, resolve as resolveCommandPath } from "node:path";
import { fileURLToPath } from "node:url";
function lspPrimaryCoversFile(ctx, runnerId) {
  if (ctx.pi?.getFlag?.("no-lsp"))
    return void 0;
  const primary = getServersForFileWithConfig(ctx.filePath).find((s) => !isAuxiliary(s));
  if (!primary)
    return void 0;
  const fact = primary.custom ? void 0 : BUILTIN_SERVER_RUNNER_COVERS.get(primary.id);
  const covers = primary.covers ?? fact?.runnerIds;
  if (!covers?.includes(runnerId))
    return void 0;
  const gateCommands = fact ? fact.gateCommands : primary.custom ? primary.command ? [primary.command] : void 0 : [];
  if (gateCommands === void 0)
    return void 0;
  return {
    serverId: primary.id,
    gateCommands,
    claimSource: fact ? "builtin-fact" : "declared"
  };
}
async function coveringLaneAvailable(ctx, cover) {
  for (const gate of cover.gateCommands) {
    if (!await ctx.hasTool(gate))
      return false;
  }
  return true;
}
var _realThisDir = (() => {
  if (typeof __dirname !== "undefined")
    return __dirname;
  return path.dirname(fileURLToPath(import.meta.url));
})();
var _managedToolsDir = path.join(getGlobalPiLensDir(), "tools");
function managedNodeToolCandidates(tool) {
  const base = path.join(getGlobalPiLensDir(), "tools", "node_modules", ".bin", tool);
  return process.platform === "win32" ? [`${base}.cmd`, `${base}.exe`, base] : [base];
}
var managedBinaryVerdicts = /* @__PURE__ */ new Map();
var managedVerifyInFlight = /* @__PURE__ */ new Map();
var MANAGED_VERIFY_TIMEOUT_MS = 5e3;
var MANAGED_VERIFY_COOLDOWN_MS = 6e4;
var MANAGED_VERIFY_COOLDOWN_MAX_MS = 15 * 6e4;
function managedVerifyCooldownMs(attempts) {
  return Math.min(MANAGED_VERIFY_COOLDOWN_MAX_MS, MANAGED_VERIFY_COOLDOWN_MS * 2 ** (attempts - 1));
}
async function runManagedVerification(candidate, stamp, priorAttempts, generation, verificationArgs = ["--version"]) {
  let transient = false;
  let ok;
  try {
    const { verifyToolBinary } = await import("./probes/installer.js");
    ok = await verifyToolBinary(candidate, void 0, () => {
      transient = true;
    }, MANAGED_VERIFY_TIMEOUT_MS, verificationArgs);
  } catch {
    transient = true;
    ok = false;
  }
  if (!ok && transient) {
    const attempts = priorAttempts + 1;
    generation.guardedWrite(stamp, () => {
      managedBinaryVerdicts.set(stamp, {
        verdict: "unverified",
        attempts,
        retryAtMs: Date.now() + managedVerifyCooldownMs(attempts)
      });
    });
    return "unverified";
  }
  generation.guardedWrite(stamp, () => {
    managedBinaryVerdicts.set(stamp, { verdict: ok ? "ok" : "broken" });
  });
  if (!ok) {
    logSessionStart(`dispatch availability: managed shim ${candidate} exists but does not run; falling through to PATH`);
  }
  return ok ? "ok" : "broken";
}
async function verifyManagedCandidate(candidate, verificationArgs = ["--version"]) {
  let stamp;
  try {
    const stat = fs.statSync(candidate);
    stamp = `${candidate}:${stat.mtimeMs}:${stat.size}`;
  } catch {
    return "absent";
  }
  const memo = managedBinaryVerdicts.get(stamp);
  let priorAttempts = 0;
  if (memo) {
    if (memo.verdict !== "unverified")
      return memo.verdict;
    if (Date.now() < memo.retryAtMs)
      return "unverified";
    priorAttempts = memo.attempts;
  }
  const existing = managedVerifyInFlight.get(stamp);
  if (existing)
    return existing;
  const generation = availabilityGeneration.capture();
  const probe = runManagedVerification(candidate, stamp, priorAttempts, generation, verificationArgs).finally(() => {
    generation.guardedWrite(stamp, () => {
      if (managedVerifyInFlight.get(stamp) === probe) {
        managedVerifyInFlight.delete(stamp);
      }
    });
  });
  managedVerifyInFlight.set(stamp, probe);
  return probe;
}
async function findManagedNodeToolBinary(tool, verificationArgs = ["--version"]) {
  for (const candidate of managedNodeToolCandidates(tool)) {
    const verdict = await verifyManagedCandidate(candidate, verificationArgs);
    if (verdict === "ok" || verdict === "unverified")
      return candidate;
  }
  return null;
}
async function findManagedReleaseBinary(tool, verificationArgs = ["--version"]) {
  const candidate = await findManagedToolBinary(tool);
  if (!candidate)
    return null;
  const verdict = await verifyManagedCandidate(candidate, verificationArgs);
  return verdict === "ok" || verdict === "unverified" ? candidate : null;
}
function resolveAdoptedRootCommand(command, ctx, cwd) {
  const candidates = managedNodeToolCandidates(command);
  let selected = candidates.find((candidate) => candidate && fs.existsSync(candidate));
  if (!selected) {
    if (process.platform === "win32") {
      selected = resolveWindowsCommandForEnvironment(command, cwd, process.env)?.resolvedPath;
    } else {
      selected = (process.env.PATH ?? "").split(delimiter).map((dir) => resolveCommandPath(cwd, dir, command)).find((candidate) => {
        try {
          fs.accessSync(candidate, fs.constants.X_OK);
          return fs.statSync(candidate).isFile();
        } catch {
          return false;
        }
      });
    }
  }
  if (!selected)
    return null;
  try {
    const binary = fs.realpathSync.native(selected);
    const session = ctx.projectRoot ?? ctx.cwd;
    const adopted = resolveAnalysisRootPath(ctx.filePath, session);
    if (!adopted)
      return null;
    const roots = [adopted, session].map((root) => fs.realpathSync.native(root));
    if (roots.some((root) => binary === root || isUnderDir(binary, root) || isUnderDir(selected, root))) {
      emitBounded("adopted_root_binary_refused", `${ctx.filePath}:${command}:${binary}`, {
        filePath: ctx.filePath,
        durationMs: 0,
        metadata: { command, binary }
      }, {
        ledgerKind: "adopted-root-binary-refused",
        risingEdgePer: "identity"
      });
      return null;
    }
    return binary;
  } catch {
    return null;
  }
}
function createVenvFinder(command, windowsExt = "", verificationArgs = ["--version"], allowProjectLocal = true) {
  return async (cwd) => {
    if (allowProjectLocal) {
      const venvBin = localBinPath(findLocalBinAt(command, cwd, {
        windowsExt,
        binDirs: VENV_BIN_DIRS
      }));
      if (venvBin)
        return { path: venvBin, rung: "venv" };
    }
    const managed = await findManagedNodeToolBinary(command, verificationArgs);
    if (managed)
      return { path: managed, rung: "managed-dir" };
    const release = await findManagedReleaseBinary(command, verificationArgs);
    if (release)
      return { path: release, rung: "managed-release" };
    return { path: command, rung: "path" };
  };
}
async function resolveManagedToolClient(options) {
  const probed = await options.probe();
  if (probed.outcome !== "missing")
    return probed;
  if (!shouldAutoInstallTool(options.toolId))
    return probed;
  const state = installStateFor(options.cwd, options.toolId);
  if (state.suppressed)
    return probed;
  const installed = await ensureTool(options.toolId);
  if (!installed) {
    noteInstallFailure(options.toolId, options.cwd);
    return probed;
  }
  const value = await options.acceptInstalled(installed);
  if (value === null) {
    noteInstallFailure(options.toolId, options.cwd);
    return { outcome: "non-installable" };
  }
  noteInstallSuccess(options.toolId, options.cwd);
  return { outcome: "success", value };
}
async function getManagedToolEnvironment(_toolId, cwd) {
  let env;
  try {
    const { getToolEnvironment } = await import("./probes/installer.js");
    env = await getToolEnvironment();
  } catch {
    env = { ...process.env };
  }
  if (!cwd)
    return env;
  if (getProjectTrustState() !== "trusted")
    return env;
  const separator = process.platform === "win32" ? ";" : ":";
  const currentPath = env.PATH || env.Path || process.env.PATH || "";
  const localBin = path.join(cwd, "node_modules", ".bin");
  const augmentedPath = `${localBin}${separator}${currentPath}`;
  return {
    ...env,
    PATH: augmentedPath,
    ...process.platform === "win32" ? { Path: augmentedPath } : {}
  };
}
async function discoverManagedTool(toolId) {
  return await ensureTool(toolId, { allowInstall: false }) ?? null;
}
var installAttemptsByCwd = new PathKeyedMap(normalizeMapKey);
var resolveInstallInFlightByCwd = new PathKeyedMap(normalizeEphemeralMapKey);
var correctedAvailabilityByCwd = new PathKeyedMap(normalizeMapKey);
var uncorrectedEmissionsByCwd = new PathKeyedMap(normalizeMapKey);
var latchedUnavailableByCwd = new PathKeyedMap(normalizeMapKey);
var availabilityGeneration = createGenerationSource("dispatch-availability");
var getDispatchAvailabilityGeneration = () => availabilityGeneration.current();
var checkerProbeFlights = createAvailabilityProbeFlight({ generation: getDispatchAvailabilityGeneration });
function recordAvailabilityProbeOverrun(tool, key, elapsedMs, budgetMs, failure) {
  if (budgetMs === void 0 || elapsedMs <= budgetMs)
    return;
  if (failure === "timeout" && elapsedMs <= budgetMs * 2)
    return;
  incrementDegradationCount({
    kind: "availability-probe-overrun",
    subject: `${tool}:${key}`,
    reason: `probe took ${Math.round(elapsedMs)}ms; budget was ${Math.round(budgetMs)}ms`
  });
}
function installStateFor(cwd, toolId) {
  let states = installAttemptsByCwd.get(cwd);
  if (!states) {
    states = /* @__PURE__ */ new Map();
    installAttemptsByCwd.set(cwd, states);
  }
  let state = states.get(toolId);
  if (!state) {
    state = { attempts: 0, suppressed: false };
    states.set(toolId, state);
  }
  return state;
}
function noteInstallFailure(toolId, cwd) {
  const state = installStateFor(cwd, toolId);
  state.attempts += 1;
  state.suppressed = true;
  logSessionStart(`dispatch availability ${toolId}: install attempt ${state.attempts} failed; suppressing retries until the next session or a successful install`);
}
function noteInstallSuccess(toolId, cwd) {
  const states = installAttemptsByCwd.get(cwd);
  states?.delete(toolId);
  if (states?.size === 0)
    installAttemptsByCwd.delete(cwd);
}
function hasId(map, cwd, id) {
  return map.get(cwd)?.has(id) ?? false;
}
function addId(map, cwd, id) {
  let ids = map.get(cwd);
  if (!ids) {
    ids = /* @__PURE__ */ new Set();
    map.set(cwd, ids);
  }
  ids.add(id);
}
function deleteIds(map, cwd, ids) {
  const existing = map.get(cwd);
  if (!existing)
    return;
  for (const id of ids)
    existing.delete(id);
  if (existing.size === 0)
    map.delete(cwd);
}
function hasCorrectedAvailability(cwd, toolId) {
  return hasId(correctedAvailabilityByCwd, cwd, toolId);
}
function noteAvailabilityCorrected(cwd, toolId) {
  addId(correctedAvailabilityByCwd, cwd, toolId);
}
function noteLatchedUnavailable(cwd, tool) {
  addId(latchedUnavailableByCwd, cwd, tool);
}
function clearLatchedUnavailable(cwd, ...tools) {
  deleteIds(latchedUnavailableByCwd, cwd, tools);
}
function latchKeysFor(toolId, command) {
  const keys = [toolId];
  if (command)
    keys.push(command, path.basename(command));
  return keys;
}
function hasLatchedUnavailable(cwd, tools) {
  return tools.some((tool) => hasId(latchedUnavailableByCwd, cwd, tool));
}
function sourceTagForToolId(toolId) {
  switch (getToolInstallStrategy(toolId)) {
    case "npm":
      return "managed-dir";
    case "pip":
      return "pip-user";
    case "github":
      return "github-release";
    case "archive":
      return "archive-dist";
    case "maven":
      return "maven-jar";
    default:
      return void 0;
  }
}
function describeManagedResolution(tool, resolution) {
  if (resolution.rung !== "managed-dir" && resolution.rung !== "managed-release") {
    return {};
  }
  const source = sourceTagForToolId(tool);
  return {
    binary: path.basename(resolution.path),
    ...source !== void 0 && { source }
  };
}
function resolvedTagForAttempt(toolId, attempt) {
  if (attempt?.outcome === "declined" || attempt?.outcome === "skipped") {
    return "declined";
  }
  return getLastEnsureResolutionSource(toolId) === "path" ? "path" : "cache";
}
function emitCompensatingAvailableRow(cwd, toolId, installStartedAt, installedPath, latchKeys) {
  if (hasCorrectedAvailability(cwd, toolId))
    return;
  const correctsLatchedRow = hasLatchedUnavailable(cwd, latchKeys);
  if (correctsLatchedRow) {
    noteAvailabilityCorrected(cwd, toolId);
    clearLatchedUnavailable(cwd, ...latchKeys);
  } else {
    if (hasId(uncorrectedEmissionsByCwd, cwd, toolId))
      return;
    addId(uncorrectedEmissionsByCwd, cwd, toolId);
  }
  const attempt = getInstallAttempt(toolId);
  const installEvidence = describeInstallAttempt(attempt);
  const evidence = {
    ...installEvidence,
    binary: path.basename(installedPath),
    source: sourceTagForToolId(toolId),
    // Set alongside any non-"succeeded" outcome: the path is truthy but
    // nothing ran this call, so it came from an already-known-good answer
    // rather than a fresh attempt (#1612 review F2).
    ...installEvidence.install !== "succeeded" && {
      resolved: resolvedTagForAttempt(toolId, attempt)
    },
    // The whole point of the memo split, on the record: a reader can tell a
    // row that cleared a latched `unavailable` from one that corrected
    // nothing, without re-deriving it from the surrounding rows (#1674
    // review F4).
    correctsLatchedRow
  };
  logAvailabilityDecision({
    tool: toolId,
    verdict: "available",
    outcome: "success",
    cause: "ok",
    elapsedMs: Date.now() - installStartedAt,
    // `checker.reset()`/a fresh probe just cleared whatever cache stood
    // behind this call, so nothing is actually held pinned the instant
    // this row is written — the very next probe starts fresh
    // (#1612 review F3). Writing `true` here would claim a durability
    // this call doesn't have.
    latched: false,
    classifiedBy: "caller",
    evidence
  }, cwd);
}
function resetDispatchAvailabilityState() {
  installAttemptsByCwd.clear();
  resolveInstallInFlightByCwd.clear();
  correctedAvailabilityByCwd.clear();
  uncorrectedEmissionsByCwd.clear();
  latchedUnavailableByCwd.clear();
  managedBinaryVerdicts.clear();
  managedVerifyInFlight.clear();
  resetPathWalkMemo();
  availabilityGeneration.bump();
  checkerProbeFlights.clear();
  cwdProbeFlights.clear();
}
function createAvailabilityChecker(command, windowsExt = "", versionArgs = ["--version"], options = {}) {
  const cacheByCwd = new PathKeyedMap(normalizeEphemeralMapKey);
  const inFlightByCwd = new PathKeyedMap(normalizeEphemeralMapKey);
  let checkerGeneration = availabilityGeneration.current();
  let checkerFlightGeneration = 0;
  const findCommand = createVenvFinder(command, windowsExt, versionArgs, options.allowProjectLocal !== false);
  function ensureCurrentGeneration() {
    if (checkerGeneration === availabilityGeneration.current())
      return;
    cacheByCwd.clear();
    inFlightByCwd.clear();
    checkerGeneration = availabilityGeneration.current();
    checkerFlightGeneration++;
  }
  const reset = () => {
    cacheByCwd.clear();
    inFlightByCwd.clear();
    checkerGeneration = availabilityGeneration.current();
    checkerFlightGeneration++;
  };
  function getCache(cwd) {
    ensureCurrentGeneration();
    const key = path.resolve(cwd || process.cwd());
    const existing = cacheByCwd.get(key);
    if (existing)
      return existing;
    const created = {
      available: null,
      command: null,
      outcome: null,
      cause: null,
      elapsedMs: 0,
      retryAtMs: 0,
      transientAttempts: 0
    };
    cacheByCwd.set(key, created);
    return created;
  }
  function noteDecision(cache, resolvedCwd, verdict) {
    cache.available = verdict.available;
    cache.outcome = verdict.outcome;
    cache.cause = verdict.cause;
    cache.elapsedMs = verdict.elapsedMs;
    let retryAfterMs;
    if (verdict.available) {
      cache.retryAtMs = 0;
      cache.transientAttempts = 0;
    } else if (isLatchingOutcome(verdict.outcome)) {
      cache.retryAtMs = 0;
      cache.transientAttempts = 0;
    } else {
      cache.transientAttempts += 1;
      retryAfterMs = transientRetryDelayMs(cache.transientAttempts, verdict.cause);
      cache.retryAtMs = Date.now() + retryAfterMs;
    }
    const latched = verdict.available || isLatchingOutcome(verdict.outcome);
    if (!verdict.available && latched) {
      noteLatchedUnavailable(resolvedCwd, command);
    } else if (verdict.available) {
      clearLatchedUnavailable(resolvedCwd, ...latchKeysFor(command));
    }
    logAvailabilityDecision({
      tool: command,
      verdict: verdict.available ? "available" : "unavailable",
      outcome: verdict.outcome,
      cause: verdict.cause,
      elapsedMs: verdict.elapsedMs,
      latched,
      // Every caller passes this (#2209); a direct key, not a conditional
      // spread, keeps it visible to the call-shaped classifiedBy sweep.
      classifiedBy: verdict.classifiedBy,
      ...verdict.evidence !== void 0 && { evidence: verdict.evidence },
      ...verdict.hostStallMs !== void 0 && {
        hostStallMs: verdict.hostStallMs
      },
      ...retryAfterMs !== void 0 && { retryAfterMs },
      budgetMs: options.probeTimeout ?? 5e3
    }, resolvedCwd);
  }
  async function isAvailableAsync(cwd) {
    ensureCurrentGeneration();
    const resolvedCwd = cwd || process.cwd();
    const cache = getCache(resolvedCwd);
    if (cache.available === false) {
      if (cache.outcome !== "transient")
        return false;
      if (Date.now() < cache.retryAtMs)
        return false;
      cache.available = null;
    }
    if (cache.available === true && cache.command) {
      if (await isSpawnableCommand(cache.command))
        return true;
      cache.available = null;
      cache.command = null;
      cache.outcome = null;
      cache.cause = null;
    }
    const key = path.resolve(resolvedCwd);
    const existing = inFlightByCwd.get(key);
    if (existing)
      return existing;
    const promiseGeneration = checkerGeneration;
    let promise;
    promise = (async () => {
      const fastPath = await options.fastPath?.();
      if (fastPath) {
        cache.command = fastPath;
        noteDecision(cache, resolvedCwd, {
          available: true,
          outcome: "success",
          cause: "fast-path",
          elapsedMs: 0,
          // Caller-asserted, and justifiably: an on-disk shim IS the tool, so
          // there is no spawn to derive anything from (#1500).
          classifiedBy: "caller"
        });
        return true;
      }
      try {
        const cwdStat = await fs.promises.stat(resolvedCwd);
        if (!cwdStat.isDirectory()) {
          noteDecision(cache, resolvedCwd, {
            available: false,
            outcome: "non-installable",
            cause: "bad-cwd",
            elapsedMs: 0,
            // The workspace is gone. Asserted from a stat, not a probe, and it
            // must never read as "the tool is missing" (#1500).
            classifiedBy: "caller"
          });
          return false;
        }
      } catch {
        noteDecision(cache, resolvedCwd, {
          available: false,
          outcome: "non-installable",
          cause: "bad-cwd",
          elapsedMs: 0,
          classifiedBy: "caller"
        });
        return false;
      }
      const resolveStartedAt = Date.now();
      const resolution = await findCommand(resolvedCwd);
      const cmd = resolution.path;
      const resolveMs = Date.now() - resolveStartedAt;
      if (isInSpawnTimeoutCooldown(cmd)) {
        noteDecision(cache, resolvedCwd, {
          available: false,
          outcome: "transient",
          cause: "probe-timeout",
          elapsedMs: 0,
          classifiedBy: "caller",
          evidence: {
            command: cmd,
            status: null
          }
        });
        return false;
      }
      const env = await options.environment?.(resolvedCwd);
      const stallSampler = startHostStallSampler();
      const startedAt = Date.now();
      let result;
      let hostStallMs;
      let probeJoined = false;
      try {
        const shared = checkerProbeFlights.run(`checker:${command}|${versionArgs.join("|")}|${key}|${checkerFlightGeneration}|${windowsExt}|${cmd}|${JSON.stringify(Object.entries(env ?? {}).sort(([a], [b]) => compareOrdinal(a, b)))}`, () => safeSpawnAsync(cmd, versionArgs, {
          timeout: options.probeTimeout ?? 5e3,
          cwd: resolvedCwd,
          env,
          input: ""
        }));
        probeJoined = shared.joined;
        result = await shared.promise;
      } finally {
        hostStallMs = stallSampler.stop();
      }
      const elapsedMs = Date.now() - startedAt;
      recordAvailabilityProbeOverrun(command, resolvedCwd, elapsedMs, options.probeTimeout ?? 5e3, result.failure);
      if (!result.error && result.status === 0) {
        cache.command = cmd;
        noteDecision(cache, resolvedCwd, {
          available: true,
          outcome: "success",
          cause: "ok",
          elapsedMs,
          hostStallMs,
          classifiedBy: probeJoined ? "joined" : "probe",
          evidence: {
            ...describeProbeEvidence(result),
            ...describeManagedResolution(command, resolution),
            resolveMs
          }
        });
        return true;
      }
      const { outcome, cause, evidence } = classifyProbeFailure(result, {
        hostStallMs,
        unclassifiedFailureOutcome: options.unclassifiedFailureOutcome
      });
      if (result.spawnFailure?.kind === "tool-not-found")
        resetPathWalkMemo();
      noteDecision(cache, resolvedCwd, {
        available: false,
        outcome,
        cause,
        elapsedMs,
        hostStallMs,
        classifiedBy: probeJoined ? "joined" : "probe",
        evidence
      });
      return false;
    })().finally(() => {
      if (checkerGeneration === promiseGeneration && inFlightByCwd.get(key) === promise) {
        inFlightByCwd.delete(key);
      }
    });
    inFlightByCwd.set(key, promise);
    return promise;
  }
  function getCommand(cwd) {
    ensureCurrentGeneration();
    const cache = getCache(cwd || process.cwd());
    return cache.command;
  }
  function getOutcome(cwd) {
    ensureCurrentGeneration();
    return getCache(cwd || process.cwd()).outcome;
  }
  function getVerdict(cwd) {
    ensureCurrentGeneration();
    const cache = getCache(cwd || process.cwd());
    return {
      outcome: cache.outcome,
      cause: cache.cause,
      elapsedMs: cache.elapsedMs,
      latched: cache.available !== false || isLatchingOutcome(cache.outcome ?? "missing"),
      retryAtMs: cache.retryAtMs
    };
  }
  return { isAvailableAsync, getCommand, getOutcome, getVerdict, reset };
}
var cwdProbeFlights = createAvailabilityProbeFlight({
  generation: getDispatchAvailabilityGeneration
});
function createCwdCachedProbe(probe, options) {
  const latchByCwd = new PathKeyedMap(normalizeEphemeralMapKey);
  const inFlightByCwd = new PathKeyedMap(normalizeEphemeralMapKey);
  let probeGeneration = availabilityGeneration.current();
  function clear() {
    latchByCwd.clear();
    inFlightByCwd.clear();
  }
  function ensureCurrentGeneration() {
    if (probeGeneration === availabilityGeneration.current())
      return;
    clear();
    probeGeneration = availabilityGeneration.current();
  }
  function latchFor(key) {
    const existing = latchByCwd.get(key);
    if (existing)
      return existing;
    const created = createAvailabilityLatch();
    latchByCwd.set(key, created);
    return created;
  }
  function note(latch, key, verdict) {
    let retryAfterMs;
    if (verdict.available) {
      latch.noteAvailable(verdict.cause);
    } else {
      const delay = latch.noteUnavailable(verdict.outcome, verdict.cause);
      if (delay > 0)
        retryAfterMs = delay;
    }
    const latched = verdict.available || isLatchingOutcome(verdict.outcome);
    if (!verdict.available && latched) {
      noteLatchedUnavailable(key, options.tool);
    } else if (verdict.available) {
      clearLatchedUnavailable(key, ...latchKeysFor(options.tool));
    }
    logAvailabilityDecision({
      tool: options.tool,
      verdict: verdict.available ? "available" : "unavailable",
      outcome: verdict.outcome,
      cause: verdict.cause,
      elapsedMs: verdict.elapsedMs,
      latched,
      hostStallMs: verdict.hostStallMs,
      ...retryAfterMs !== void 0 && { retryAfterMs },
      ...options.budgetMs !== void 0 && { budgetMs: options.budgetMs },
      // Every verdict here is derived from the probe this seam just ran.
      classifiedBy: verdict.classifiedBy ?? "probe",
      ...verdict.evidence !== void 0 && { evidence: verdict.evidence }
    }, key);
  }
  const run = (cwd) => {
    ensureCurrentGeneration();
    const key = path.resolve(cwd || process.cwd());
    const latch = latchFor(key);
    const memo = latch.read();
    if (memo !== null)
      return Promise.resolve(memo);
    const existing = inFlightByCwd.get(key);
    if (existing)
      return existing;
    const promiseGeneration = probeGeneration;
    let promise;
    promise = (async () => {
      const stallSampler = startHostStallSampler();
      const startedAt = Date.now();
      let result;
      let thrown;
      let probeJoined = false;
      try {
        const shared = cwdProbeFlights.run(`cwd:${options.tool}|${options.flightKeyComponent ?? ""}|${key}`, () => probe(key));
        probeJoined = shared.joined;
        result = await shared.promise;
      } catch (error) {
        thrown = error;
      }
      const hostStallMs = stallSampler.stop();
      const elapsedMs = Date.now() - startedAt;
      const shape = result ?? {
        error: thrown instanceof Error ? thrown : new Error(String(thrown))
      };
      recordAvailabilityProbeOverrun(options.tool, key, elapsedMs, options.budgetMs, shape.failure);
      if (result && !result.error && result.status === 0) {
        note(latch, key, {
          available: true,
          outcome: "success",
          cause: "ok",
          elapsedMs,
          hostStallMs,
          classifiedBy: probeJoined ? "joined" : "probe",
          evidence: describeProbeEvidence(result, options.tool)
        });
        return true;
      }
      const { outcome, cause, evidence } = classifyProbeFailure(shape, {
        hostStallMs,
        command: options.tool,
        unclassifiedFailureOutcome: options.unclassifiedFailureOutcome
      });
      note(latch, key, {
        available: false,
        outcome,
        cause,
        elapsedMs,
        hostStallMs,
        classifiedBy: probeJoined ? "joined" : "probe",
        evidence
      });
      return false;
    })().finally(() => {
      if (probeGeneration === promiseGeneration && inFlightByCwd.get(key) === promise) {
        inFlightByCwd.delete(key);
      }
    });
    inFlightByCwd.set(key, promise);
    return promise;
  };
  const cached = run;
  cached.getVerdict = (cwd) => {
    ensureCurrentGeneration();
    const latch = latchFor(path.resolve(cwd || process.cwd()));
    const outcome = latch.getOutcome();
    return {
      outcome,
      cause: latch.getCause(),
      elapsedMs: 0,
      // Read the OUTCOME, never `read()`: `read()` answers `null` both for a
      // cwd that was never probed and for a transient verdict whose cooldown
      // expired, and `!== false` turned both of those into `latched: true` —
      // the opposite of the truth in the expired case.
      latched: outcome !== null && isLatchingOutcome(outcome),
      retryAtMs: latch.getRetryAtMs()
    };
  };
  cached.reset = () => {
    clear();
    probeGeneration = availabilityGeneration.current();
  };
  return cached;
}
function resolveNodeToolCommand(cwd, toolName, windowsExt = ".cmd") {
  const local = localBinPath(findLocalBinAt(toolName, cwd, { windowsExt }));
  if (local)
    return local;
  return toolName;
}
function resolveToolCommand(cwd, toolId) {
  const spec = getToolCommandSpec(toolId);
  if (!spec)
    return null;
  return resolveNodeToolCommand(cwd, spec.command, spec.windowsExt ?? ".cmd");
}
function resolveVendorToolCommand(cwd, toolName, windowsExt = ".bat") {
  return localBinPath(findLocalBinUpwards(toolName, cwd, {
    windowsExt,
    binDirs: VENDOR_BIN_DIRS
  })) ?? null;
}
async function resolveToolCommandWithInstallFallback(cwd, toolId, timeout = 5e3) {
  const spec = getToolCommandSpec(toolId);
  if (!spec)
    return null;
  return resolveCommandWithInstallFallback(resolveToolCommand(cwd, toolId) ?? spec.command, spec.managedToolId ?? toolId, cwd, spec.versionArgs ?? ["--version"], timeout);
}
async function verifyOrInstallCommand(command, toolId, cwd, versionArgs = ["--version"], timeout = 5e3) {
  const spawnable = await isSpawnableCommand(command);
  if (spawnable) {
    const versionCheck = await safeSpawnAsync(command, versionArgs, {
      timeout,
      cwd,
      input: ""
    });
    if (!versionCheck.error && versionCheck.status === 0) {
      return command;
    }
    return null;
  }
  if (!shouldAutoInstallTool(toolId))
    return null;
  const state = installStateFor(cwd, toolId);
  if (state.suppressed)
    return null;
  const installStartedAt = Date.now();
  const installed = await ensureTool(toolId);
  if (installed) {
    noteInstallSuccess(toolId, cwd);
    emitCompensatingAvailableRow(cwd, toolId, installStartedAt, installed, latchKeysFor(toolId, command));
    return installed;
  }
  noteInstallFailure(toolId, cwd);
  return null;
}
async function resolveCommandArgsWithInstallFallback(command, toolId, cwd, versionArgs = ["--version"], timeout = 5e3) {
  const versionCheck = await safeSpawnAsync(command.cmd, [...command.args, ...versionArgs], { timeout, cwd, input: "" });
  if (!versionCheck.error && versionCheck.status === 0) {
    return command;
  }
  const installed = await verifyOrInstallCommand(command.cmd, toolId, cwd, versionArgs, timeout);
  if (!installed) {
    return null;
  }
  if (installed === command.cmd) {
    return command;
  }
  return { cmd: installed, args: [] };
}
async function resolveCommandWithInstallFallback(command, toolId, cwd, versionArgs = ["--version"], timeout = 5e3) {
  return verifyOrInstallCommand(command, toolId, cwd, versionArgs, timeout);
}
async function resolveAvailableOrInstallUnshared(checker, toolId, cwd) {
  const available = await checker.isAvailableAsync(cwd);
  if (available) {
    return checker.getCommand(cwd);
  }
  if (checker.getOutcome?.(cwd) !== "missing")
    return null;
  if (!shouldAutoInstallTool(toolId))
    return null;
  const state = installStateFor(cwd, toolId);
  if (state.suppressed) {
    return null;
  }
  const installStartedAt = Date.now();
  const installed = await ensureTool(toolId);
  if (installed) {
    noteInstallSuccess(toolId, cwd);
    checker.reset?.();
    noteLatchedUnavailable(cwd, toolId);
    emitCompensatingAvailableRow(cwd, toolId, installStartedAt, installed, latchKeysFor(toolId, checker.getCommand(cwd) ?? void 0));
    return installed;
  }
  noteInstallFailure(toolId, cwd);
  return null;
}
function resolveAvailableOrInstall(checker, toolId, cwd) {
  const key = normalizeEphemeralMapKey(cwd);
  let byTool = resolveInstallInFlightByCwd.get(key);
  if (!byTool) {
    byTool = /* @__PURE__ */ new Map();
    resolveInstallInFlightByCwd.set(key, byTool);
  }
  const existing = byTool.get(toolId);
  if (existing)
    return existing;
  const generation = availabilityGeneration.capture();
  const promise = resolveAvailableOrInstallUnshared(checker, toolId, cwd).finally(() => {
    generation.guardedWrite(`${toolId}@${key}`, () => {
      const current = resolveInstallInFlightByCwd.get(key);
      if (current?.get(toolId) === promise) {
        current.delete(toolId);
        if (current.size === 0)
          resolveInstallInFlightByCwd.delete(key);
      }
    });
  });
  byTool.set(toolId, promise);
  return promise;
}
var sgLatch = createAvailabilityLatch();
var sgCmd = null;
var sgCmdArgs = [];
var sgAvailableInFlight = null;
var sgAvailabilityGeneration = availabilityGeneration.current();
function ensureCurrentSgGeneration() {
  if (sgAvailabilityGeneration === availabilityGeneration.current())
    return;
  sgLatch.reset();
  sgCmd = null;
  sgCmdArgs = [];
  sgAvailableInFlight = null;
  sgAvailabilityGeneration = availabilityGeneration.current();
}
function getSgCommand() {
  ensureCurrentSgGeneration();
  return {
    cmd: sgCmd ?? "npx",
    args: sgCmdArgs.length ? sgCmdArgs : ["--no", "--package", "@ast-grep/cli", "--", "ast-grep"]
  };
}
async function resolveLocalFirstAsync(toolName, cwd, windowsExt = ".cmd") {
  const local = localBinPath(findLocalBinAt(toolName, cwd, { windowsExt }));
  if (local)
    return { cmd: local, args: [] };
  const globalBin = await findGlobalBinary(toolName, windowsExt);
  if (globalBin)
    return { cmd: globalBin, args: [] };
  const globalCheck = await probeToolAsync(toolName, ["--version"], {
    timeout: 3e3
  });
  if (!globalCheck.error && globalCheck.status === 0) {
    return { cmd: toolName, args: [] };
  }
  return { cmd: "npx", args: ["--no", toolName] };
}
var pyright = createAvailabilityChecker("pyright", ".exe");
var ruff = createAvailabilityChecker("ruff", ".exe");
var biome = createAvailabilityChecker("biome");
function resolveRunnerCwd(ctx, tool) {
  return resolveToolCwd("runner", tool, ctx.filePath, ctx).cwd;
}

export {
  lspPrimaryCoversFile,
  coveringLaneAvailable,
  findManagedNodeToolBinary,
  resolveAdoptedRootCommand,
  resolveManagedToolClient,
  getManagedToolEnvironment,
  discoverManagedTool,
  getDispatchAvailabilityGeneration,
  recordAvailabilityProbeOverrun,
  resetDispatchAvailabilityState,
  createAvailabilityChecker,
  createCwdCachedProbe,
  resolveToolCommand,
  resolveVendorToolCommand,
  resolveToolCommandWithInstallFallback,
  resolveCommandArgsWithInstallFallback,
  resolveAvailableOrInstall,
  getSgCommand,
  resolveLocalFirstAsync,
  resolveRunnerCwd
};
