import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  createAvailabilityProbeFlight,
  probeToolAsync
} from "./chunk-RWWYJ623.js";
import {
  classifyProbeFailure,
  createAvailabilityLatch,
  isTransientDecision,
  logAvailabilityDecision,
  startHostStallSampler
} from "./chunk-VRZP76YM.js";
import {
  createGenerationSource,
  safeSpawnAsync
} from "./chunk-C34ZXZ7O.js";
import {
  getProjectTrustState
} from "./chunk-ZANLILYD.js";
import {
  recordDegradationOnce
} from "./chunk-JAU72XNY.js";
import {
  logExtension
} from "./chunk-XTMJ7XDT.js";
import {
  isAtOrAboveHomeDir,
  isUnderDir,
  walkUpDirs
} from "./chunk-N2H3ZPZY.js";

// dist/clients/package-manager.js
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { resolve as resolvePath } from "node:path";
var PREFERENCE = [
  "npm",
  "pnpm",
  "yarn",
  "bun"
];
var packageManagerProbeFlights = createAvailabilityProbeFlight();
function onWindows() {
  return process.platform === "win32";
}
function isNodePackageManager(value) {
  return value === "npm" || value === "pnpm" || value === "yarn" || value === "bun";
}
function detectNodePackageManager(targetPath) {
  if (fs.existsSync(path.join(targetPath, "bun.lockb")) || fs.existsSync(path.join(targetPath, "bun.lock"))) {
    return "bun";
  }
  if (fs.existsSync(path.join(targetPath, "pnpm-lock.yaml"))) {
    return "pnpm";
  }
  if (fs.existsSync(path.join(targetPath, "yarn.lock"))) {
    return "yarn";
  }
  if (fs.existsSync(path.join(targetPath, "package-lock.json"))) {
    return "npm";
  }
  return readPackageManagerField(targetPath);
}
function readPackageManagerField(targetPath) {
  try {
    const pkgPath = path.join(targetPath, "package.json");
    if (!fs.existsSync(pkgPath))
      return void 0;
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    if (typeof pkg.packageManager !== "string")
      return void 0;
    const name = pkg.packageManager.split("@")[0].trim().toLowerCase();
    return isNodePackageManager(name) ? name : void 0;
  } catch {
    return void 0;
  }
}
var PROBE_TIMEOUT_MS = 5e3;
var availabilityLatches = /* @__PURE__ */ new Map();
function getLatch(pm) {
  let latch = availabilityLatches.get(pm);
  if (!latch) {
    latch = createAvailabilityLatch();
    availabilityLatches.set(pm, latch);
  }
  return latch;
}
async function probeAvailability(pm) {
  const latch = getLatch(pm);
  const startedAt = Date.now();
  const finder = onWindows() ? "where" : "which";
  const sampler = startHostStallSampler();
  let result;
  let hostStallMs;
  try {
    result = await probeToolAsync(finder, [pm], { timeout: PROBE_TIMEOUT_MS });
  } finally {
    hostStallMs = sampler.stop();
  }
  const elapsedMs = Date.now() - startedAt;
  if (result.status === 0 && !result.error) {
    latch.noteAvailable();
    logAvailabilityDecision({
      tool: pm,
      verdict: "available",
      outcome: "success",
      cause: "ok",
      elapsedMs,
      latched: true,
      hostStallMs,
      budgetMs: PROBE_TIMEOUT_MS,
      classifiedBy: "probe"
    });
    return true;
  }
  const { outcome, cause, evidence } = classifyProbeFailure(result, {
    hostStallMs,
    // Preserve pre-#1496 meaning for anything the classifier can't place: a
    // present manager that rejects its probe is durable, same as before.
    unclassifiedFailureOutcome: "missing"
  });
  const retryAfterMs = latch.noteUnavailable(outcome, cause);
  logAvailabilityDecision({
    tool: pm,
    verdict: "unavailable",
    outcome,
    cause,
    elapsedMs,
    latched: outcome !== "transient",
    hostStallMs,
    ...retryAfterMs > 0 && { retryAfterMs },
    budgetMs: PROBE_TIMEOUT_MS,
    classifiedBy: "probe",
    evidence
  });
  return false;
}
function isAvailable(pm, onTransient) {
  const latch = getLatch(pm);
  const reportIfTransient = (result) => {
    if (!result && isTransientDecision({ outcome: latch.getOutcome() })) {
      onTransient?.();
    }
    return result;
  };
  const memo = latch.read();
  if (memo !== null)
    return Promise.resolve(reportIfTransient(memo));
  const shared = packageManagerProbeFlights.run(`package-manager:${pm}`, () => probeAvailability(pm));
  return shared.promise.then(reportIfTransient);
}
function _resetPackageManagerCache() {
  packageManagerCacheGeneration.bump();
  availabilityLatches.clear();
  packageManagerProbeFlights.clear();
  globalBinDirCache.clear();
  globalBinDirProbeFlights.clear();
}
async function resolveNodePackageManager(cwd = process.cwd()) {
  const declared = detectNodePackageManager(cwd);
  if (declared && await isAvailable(declared)) {
    return declared;
  }
  for (const pm of PREFERENCE) {
    if (await isAvailable(pm))
      return pm;
  }
  return "npm";
}
function pmBinary(pm) {
  if (!onWindows())
    return pm;
  return pm === "bun" ? "bun.exe" : `${pm}.cmd`;
}
function runScriptArgs(script) {
  return ["run", script];
}
function installArgs(pm, pkg, options = {}) {
  const args = [pm === "npm" ? "install" : "add"];
  if (options.ignoreScripts)
    args.push("--ignore-scripts");
  if (options.legacyPeerDeps && pm === "npm")
    args.push("--legacy-peer-deps");
  args.push(pkg);
  return args;
}
function updateArgs(pm, pkg, options = {}) {
  const args = [pm === "yarn" ? "upgrade" : "update"];
  if (options.ignoreScripts)
    args.push("--ignore-scripts");
  args.push(pkg);
  return args;
}
var globalBinDirCache = /* @__PURE__ */ new Map();
var packageManagerCacheGeneration = createGenerationSource("package-manager-global-bin");
var globalBinDirProbeFlights = createAvailabilityProbeFlight();
async function globalBinDirsFor(pm) {
  const cached = globalBinDirCache.get(pm);
  if (cached)
    return cached;
  const generation = packageManagerCacheGeneration.capture();
  const shared = globalBinDirProbeFlights.run(pm, () => probeGlobalBinDirs(pm, generation));
  return shared.promise;
}
async function probeGlobalBinDirs(pm, generation) {
  if (pm === "bun") {
    const base = process.env.BUN_INSTALL || path.join(os.homedir(), ".bun");
    const dirs2 = [path.join(base, "bin")];
    generation.guardedWrite(pm, () => {
      globalBinDirCache.set(pm, dirs2);
    });
    return dirs2;
  }
  const query = pm === "npm" ? ["config", "get", "prefix"] : pm === "pnpm" ? ["bin", "-g"] : ["global", "bin"];
  const res = await safeSpawnAsync(pmBinary(pm), query, { timeout: 5e3 });
  if (res.status !== 0 || res.error)
    return [];
  const out = res.stdout.trim();
  if (!out)
    return [];
  const dirs = pm === "npm" ? [onWindows() ? out : path.join(out, "bin")] : [out];
  generation.guardedWrite(pm, () => {
    globalBinDirCache.set(pm, dirs);
  });
  return dirs;
}
async function allAvailableGlobalBinDirs(onTransient) {
  const dirs = [];
  const seen = /* @__PURE__ */ new Set();
  for (const pm of PREFERENCE) {
    if (!await isAvailable(pm, onTransient))
      continue;
    for (const dir of await globalBinDirsFor(pm)) {
      const normalized = path.resolve(dir);
      if (seen.has(normalized))
        continue;
      seen.add(normalized);
      dirs.push(normalized);
    }
  }
  return dirs;
}
async function findGlobalBinary(command, windowsExt = ".cmd") {
  const candidates = onWindows() ? [`${command}${windowsExt}`, `${command}.exe`, command] : [command];
  try {
    for (const binDir of await allAvailableGlobalBinDirs()) {
      for (const name of candidates) {
        const full = path.join(binDir, name);
        if (fs.existsSync(full))
          return full;
      }
    }
  } catch {
  }
  return void 0;
}
var NODE_MODULES_BIN_DIRS = [
  path.join("node_modules", ".bin")
];
var VENDOR_BIN_DIRS = [path.join("vendor", "bin")];
var VENV_BIN_DIRS = [
  path.join(".venv", "bin"),
  path.join("venv", "bin"),
  path.join(".venv", "Scripts"),
  path.join("venv", "Scripts")
];
var PROJECT_LOCAL_BIN_DIRS = [
  ...NODE_MODULES_BIN_DIRS,
  ...VENDOR_BIN_DIRS,
  ...VENV_BIN_DIRS
];
function localBinPath(value) {
  return typeof value === "string" ? value : void 0;
}
function refuseLocalBin(tool, root) {
  const trust = getProjectTrustState();
  const resolvedRoot = resolvePath(root);
  const subject = `project-local-binary:${resolvedRoot}:${tool}`;
  if (recordDegradationOnce({
    kind: "trust-refusal",
    subject,
    reason: `project-local binary refused: pi project trust is ${trust}`
  })) {
    logExtension({
      subsystem: "project-trust",
      level: "warn",
      message: "project-local binary refused: mark the project trusted in pi or upgrade pi",
      metadata: { tool, root: resolvedRoot, trust }
    });
  }
  return { kind: "refused-by-trust", tool, root: resolvedRoot, trust };
}
function isProjectLocalBinPath(resolvedCommand, cwd) {
  for (const ancestor of walkUpDirs(cwd)) {
    if (isAtOrAboveHomeDir(ancestor, os.homedir()))
      break;
    if (PROJECT_LOCAL_BIN_DIRS.some((binDir) => isUnderDir(resolvedCommand, path.join(ancestor, binDir))))
      return true;
  }
  return false;
}
function expandCandidateNames(tools, windowsExt, isWindows) {
  return isWindows && windowsExt !== "" ? tools.flatMap((tool) => [`${tool}${windowsExt}`, tool]) : [...tools];
}
function* matchesInDir(dir, names, binDirs) {
  for (const name of names) {
    for (const binDir of binDirs) {
      const full = path.join(dir, binDir, name);
      if (fs.existsSync(full))
        yield full;
    }
  }
}
function* localBinMatches(tools, startDir, options) {
  const { windowsExt = ".cmd", homeDir = os.homedir(), binDirs = NODE_MODULES_BIN_DIRS, isWindows = onWindows(), ceiling = true } = options;
  const names = expandCandidateNames(tools, windowsExt, isWindows);
  for (const dir of walkUpDirs(startDir)) {
    if (ceiling && isAtOrAboveHomeDir(dir, homeDir))
      return;
    yield* matchesInDir(dir, names, binDirs);
  }
}
function findLocalBinUpwards(tool, startDir, options = {}) {
  const match = localBinMatches([tool], startDir, options).next().value;
  if (match === void 0 || options.ceiling === false)
    return match;
  if (getProjectTrustState() !== "trusted")
    return refuseLocalBin(tool, startDir);
  return match;
}
function findLocalBinsAt(tools, dir, options = {}) {
  const { windowsExt = ".cmd", binDirs = NODE_MODULES_BIN_DIRS, isWindows = onWindows() } = options;
  const names = expandCandidateNames(tools, windowsExt, isWindows);
  const matches = [...matchesInDir(path.resolve(dir), names, binDirs)];
  if (matches.length === 0 || getProjectTrustState() === "trusted")
    return matches;
  return [refuseLocalBin(tools.join(","), dir)];
}
function findLocalBinAt(tool, dir, options = {}) {
  const match = findLocalBinsAt([tool], dir, options)[0];
  return match;
}
async function findNodeToolBinary(tool, cwd, windowsExt = ".cmd") {
  return localBinPath(findLocalBinUpwards(tool, cwd, { windowsExt })) ?? await findGlobalBinary(tool, windowsExt);
}

export {
  _resetPackageManagerCache,
  resolveNodePackageManager,
  pmBinary,
  runScriptArgs,
  installArgs,
  updateArgs,
  allAvailableGlobalBinDirs,
  findGlobalBinary,
  VENDOR_BIN_DIRS,
  VENV_BIN_DIRS,
  localBinPath,
  isProjectLocalBinPath,
  findLocalBinUpwards,
  findLocalBinsAt,
  findLocalBinAt,
  findNodeToolBinary
};
