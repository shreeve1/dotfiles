import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  DEPRECATED_CONFIG_SURFACES
} from "./chunk-JMYYOTQG.js";
import {
  logLatency
} from "./chunk-QQNQ7SJW.js";
import {
  isAtOrAboveHomeDir,
  isWindowsPath,
  nameMatchesMarkerGlob,
  normalizeFilePath,
  realpathOrResolve,
  walkUpDirs
} from "./chunk-N2H3ZPZY.js";

// dist/clients/workspace-topology.js
import * as fs2 from "node:fs";
import * as os2 from "node:os";
import * as path2 from "node:path";

// dist/clients/config-locations.js
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

// dist/clients/error-class.js
function errorClassName(error) {
  return error instanceof Error ? error.name : "unknown error";
}

// dist/clients/config-locations.js
var CANONICAL_PROJECT_CONFIG_FILE = ".pi-lens.json";
var CANONICAL_GLOBAL_CONFIG_FILE = "config.json";
var LSP_NAMESPACE_KEY = "lsp";
var GLOBAL_SURFACE_PREFIX = "~/.pi-lens/";
var LEGACY_FILE_SURFACES = DEPRECATED_CONFIG_SURFACES.filter((row) => row.kind === "file").map((row) => row.surface);
var LEGACY_ROOT_LSP_KEYS = DEPRECATED_CONFIG_SURFACES.filter((row) => row.kind === "key").map((row) => row.surface);
function isLspScoped(relativePath) {
  const base = path.posix.basename(relativePath.replace(/\\/g, "/"));
  return base === "lsp.json" || base === "pi-lsp.json";
}
function legacyLocation(relativePath, surface) {
  return {
    relativePath,
    surface,
    legacy: true,
    lspScoped: isLspScoped(relativePath)
  };
}
var PROJECT_CONFIG_LOCATIONS = [
  legacyLocation("pi-lens.json", "pi-lens.json"),
  legacyLocation("pi-lsp.json", "pi-lsp.json"),
  legacyLocation(path.posix.join(".pi-lens", "lsp.json"), ".pi-lens/lsp.json"),
  {
    relativePath: CANONICAL_PROJECT_CONFIG_FILE,
    legacy: false,
    lspScoped: false
  }
];
var PROJECT_CONFIG_BASENAMES = PROJECT_CONFIG_LOCATIONS.filter((location) => !location.lspScoped).map((location) => location.relativePath).reverse();
var GLOBAL_CONFIG_LOCATIONS = [
  legacyLocation("lsp.json", `${GLOBAL_SURFACE_PREFIX}lsp.json`),
  {
    relativePath: CANONICAL_GLOBAL_CONFIG_FILE,
    legacy: false,
    lspScoped: false
  }
];
var DECLARED_LEGACY_FILE_SURFACES = [
  ...PROJECT_CONFIG_LOCATIONS,
  ...GLOBAL_CONFIG_LOCATIONS
].filter((location) => location.legacy).map((location) => location.surface);
function configSearchDirs(startDir, homeDir = os.homedir()) {
  const dirs = [];
  for (const dir of walkUpDirs(startDir)) {
    if (isAtOrAboveHomeDir(dir, homeDir))
      break;
    dirs.push(dir);
  }
  return dirs;
}
function defaultGlobalConfigExists(file) {
  try {
    return fs.statSync(file).isFile();
  } catch (error) {
    if (error.code === "ENOENT")
      return false;
    throw error;
  }
}
function agentConfigPathFor(agentDir) {
  return isWindowsPath(agentDir) ? path.win32.join(path.win32.resolve(agentDir), "extensions", "pi-lens.json") : path.join(path.resolve(agentDir), "extensions", "pi-lens.json");
}
function resolveGlobalConfigLocation(options) {
  const owned = options !== void 0;
  const homeDir = options?.homeDir ?? os.homedir();
  const legacyDefault = path.join(homeDir, ".pi-lens", CANONICAL_GLOBAL_CONFIG_FILE);
  const override = process.env.PI_LENS_CONFIG_PATH;
  if (override) {
    return { path: path.resolve(override), source: "pi-lens-config-path" };
  }
  let probeError;
  const probe = (file) => {
    try {
      return (options?.exists ?? defaultGlobalConfigExists)(file) ? "present" : "absent";
    } catch (error) {
      probeError = error;
      return "error";
    }
  };
  const agentDir = owned ? void 0 : process.env.PI_CODING_AGENT_DIR?.trim();
  const agentPath = agentDir ? agentConfigPathFor(agentDir) : void 0;
  const legacyProbe = probe(legacyDefault);
  if (legacyProbe === "present") {
    if (agentPath !== void 0 && probe(agentPath) === "present") {
      return {
        path: legacyDefault,
        source: "legacy-default-existing",
        shadowedPath: agentPath
      };
    }
    return { path: legacyDefault, source: "legacy-default-existing" };
  }
  if (legacyProbe === "error") {
    return {
      path: legacyDefault,
      source: "legacy-default-unprobed",
      existsProbeFailed: {
        path: legacyDefault,
        errorClassName: errorClassName(probeError)
      }
    };
  }
  if (agentPath !== void 0) {
    const agentProbe = probe(agentPath);
    if (agentProbe === "present") {
      return { path: agentPath, source: "pi-coding-agent-dir" };
    }
    if (agentProbe === "error") {
      return {
        path: agentPath,
        source: "pi-coding-agent-dir-unprobed",
        existsProbeFailed: {
          path: agentPath,
          errorClassName: errorClassName(probeError)
        }
      };
    }
  }
  return { path: legacyDefault, source: "canonical-default" };
}
var memoizedGlobalConfigResolution;
function globalConfigEnvFingerprint() {
  return JSON.stringify([
    process.env.PI_LENS_CONFIG_PATH,
    process.env.PI_CODING_AGENT_DIR
  ]);
}
function getProductionGlobalConfigResolution() {
  const fingerprint = globalConfigEnvFingerprint();
  if (memoizedGlobalConfigResolution?.fingerprint !== fingerprint) {
    memoizedGlobalConfigResolution = {
      fingerprint,
      resolution: resolveGlobalConfigLocation()
    };
  }
  return memoizedGlobalConfigResolution.resolution;
}
function getPiLensGlobalConfigPath(homeDir) {
  return homeDir === void 0 ? getProductionGlobalConfigResolution().path : resolveGlobalConfigLocation({ homeDir }).path;
}
function isResolvedGlobalConfigPath(candidate) {
  return recognizedGlobalConfigPaths().has(canonicalPathIdentity(candidate));
}
function canonicalPathIdentity(candidate) {
  if (isWindowsPath(candidate)) {
    return normalizeFilePath(path.win32.resolve(candidate));
  }
  return normalizeFilePath(realpathOrResolve(candidate));
}
var recognizedCache;
function recognizedGlobalConfigPaths() {
  const fingerprint = globalConfigEnvFingerprint();
  if (recognizedCache?.fingerprint !== fingerprint) {
    const paths = /* @__PURE__ */ new Set();
    const override = process.env.PI_LENS_CONFIG_PATH;
    if (override)
      paths.add(canonicalPathIdentity(path.resolve(override)));
    paths.add(canonicalPathIdentity(path.join(os.homedir(), ".pi-lens", CANONICAL_GLOBAL_CONFIG_FILE)));
    const agentDir = process.env.PI_CODING_AGENT_DIR?.trim();
    if (agentDir)
      paths.add(canonicalPathIdentity(agentConfigPathFor(agentDir)));
    recognizedCache = { fingerprint, paths };
  }
  return recognizedCache.paths;
}

// dist/clients/freshness-cadence.js
var FRESHNESS_CADENCE_MS = 2e3;

// dist/clients/workspace-topology.js
var MAX_WALK_DEPTH = 64;
var PI_LENS_CONFIG_BASENAMES = PROJECT_CONFIG_BASENAMES;
var dirMarkerCache = /* @__PURE__ */ new Map();
var topologyDerivedCacheResets = [];
function registerWorkspaceTopologyReset(reset) {
  topologyDerivedCacheResets.push(reset);
}
var walkCache = /* @__PURE__ */ new Map();
var TOPOLOGY_MAX_DIR_ENTRIES = 256;
var TOPOLOGY_MAX_WALK_ENTRIES = 512;
var TOPOLOGY_IDLE_EVICT_MS_DEFAULT = 20 * 6e4;
function topologyIdleEvictMs() {
  const value = Number.parseInt(process.env.PI_LENS_WORKSPACE_TOPOLOGY_IDLE_EVICT_MS ?? "", 10);
  return Number.isSafeInteger(value) && value > 0 ? value : TOPOLOGY_IDLE_EVICT_MS_DEFAULT;
}
function deleteDirMarker(key) {
  const entry = dirMarkerCache.get(key);
  if (entry?.idleTimer)
    clearTimeout(entry.idleTimer);
  dirMarkerCache.delete(key);
}
function deleteWalk(key) {
  const entry = walkCache.get(key);
  if (entry?.idleTimer)
    clearTimeout(entry.idleTimer);
  walkCache.delete(key);
}
function touchDirMarker(key, entry) {
  entry.lastUsedAt = Date.now();
  if (entry.idleTimer)
    clearTimeout(entry.idleTimer);
  const stamp = entry.lastUsedAt;
  entry.idleTimer = setTimeout(() => {
    if (dirMarkerCache.get(key) === entry && entry.lastUsedAt === stamp)
      deleteDirMarker(key);
  }, topologyIdleEvictMs());
  entry.idleTimer.unref?.();
}
function touchWalk(key, entry) {
  entry.lastUsedAt = Date.now();
  if (entry.idleTimer)
    clearTimeout(entry.idleTimer);
  const stamp = entry.lastUsedAt;
  entry.idleTimer = setTimeout(() => {
    if (walkCache.get(key) === entry && entry.lastUsedAt === stamp)
      deleteWalk(key);
  }, topologyIdleEvictMs());
  entry.idleTimer.unref?.();
}
function resetWorkspaceTopology() {
  for (const key of dirMarkerCache.keys())
    deleteDirMarker(key);
  for (const key of walkCache.keys())
    deleteWalk(key);
  for (const reset of topologyDerivedCacheResets)
    reset();
}
function safeDirMtimeMs(dir) {
  try {
    return fs2.statSync(dir).mtimeMs;
  } catch {
    return -1;
  }
}
function safeIsFile(filePath) {
  try {
    return fs2.statSync(filePath).isFile();
  } catch {
    return false;
  }
}
function getDirectoryMarkers(dir) {
  const resolvedDir = path2.resolve(dir);
  const dirMtimeMs = safeDirMtimeMs(resolvedDir);
  const cached = dirMarkerCache.get(resolvedDir);
  if (cached && cached.dirMtimeMs === dirMtimeMs) {
    touchDirMarker(resolvedDir, cached);
    return cached.markers;
  }
  let entries = [];
  try {
    entries = fs2.readdirSync(resolvedDir, { withFileTypes: true });
  } catch {
    entries = [];
  }
  const present = new Set(entries.map((e) => e.name));
  const fileNames = new Set(entries.filter((entry2) => entry2.isFile() || entry2.isSymbolicLink()).map((entry2) => entry2.name));
  const resolveMarker = (basename) => {
    if (!present.has(basename))
      return void 0;
    const candidate = path2.join(resolvedDir, basename);
    return safeIsFile(candidate) ? candidate : void 0;
  };
  const piLensConfigPath = resolveMarker(PI_LENS_CONFIG_BASENAMES[0]) ?? resolveMarker(PI_LENS_CONFIG_BASENAMES[1]);
  const markers = {
    dir: resolvedDir,
    dirMtimeMs,
    entryNames: present,
    entryFileNames: fileNames,
    piLensConfigPath,
    tsconfigPath: resolveMarker("tsconfig.json"),
    packageJsonPath: resolveMarker("package.json"),
    pnpmWorkspaceYamlPath: resolveMarker("pnpm-workspace.yaml"),
    cargoTomlPath: resolveMarker("Cargo.toml"),
    goWorkPath: resolveMarker("go.work"),
    chartYamlPath: resolveMarker("Chart.yaml")
  };
  const entry = { dirMtimeMs, markers, lastUsedAt: Date.now() };
  const outgoing = dirMarkerCache.get(resolvedDir);
  if (outgoing?.idleTimer !== void 0) {
    clearTimeout(outgoing.idleTimer);
    outgoing.idleTimer = void 0;
  }
  dirMarkerCache.set(resolvedDir, entry);
  touchDirMarker(resolvedDir, entry);
  while (dirMarkerCache.size > TOPOLOGY_MAX_DIR_ENTRIES) {
    const victim = [...dirMarkerCache.entries()].sort(([, a], [, b]) => a.lastUsedAt - b.lastUsedAt)[0];
    if (!victim)
      break;
    deleteDirMarker(victim[0]);
  }
  return markers;
}
function walkCacheKey(startDir, markerKey) {
  return `${path2.resolve(startDir)}\0${markerKey}`;
}
function dirMtimesStillFresh(dirMtimes) {
  return dirMtimes.every(({ dir, mtimeMs }) => safeDirMtimeMs(dir) === mtimeMs);
}
function dirMtimesStillFreshAsync(dirMtimes) {
  return Promise.all(dirMtimes.map(({ dir }) => dirMtimeMsAsync(dir))).then((current) => dirMtimes.every(({ mtimeMs }, index) => current[index] === mtimeMs));
}
function dirMtimeMsAsync(dir) {
  return fs2.promises.stat(dir).then((stats) => stats.mtimeMs, () => -1);
}
function dirMtimeRecordsAsync(dirs) {
  return Promise.all(dirs.map((dir) => dirMtimeMsAsync(dir).then((mtimeMs) => ({ dir, mtimeMs }))));
}
function unknownDirMtimeRecords(dirs) {
  return dirs.map((dir) => ({ dir, mtimeMs: Number.NaN }));
}
function walkToNearestMatch(startDir, cacheSuffix, matches, capMetadata, homeDir) {
  const key = walkCacheKey(startDir, cacheSuffix);
  const cached = walkCache.get(key);
  if (cached) {
    const startDirMtime = cached.dirMtimes[0];
    const isFresh = cached.dir === void 0 ? startDirMtime !== void 0 && Date.now() - cached.walkedAtMs < FRESHNESS_CADENCE_MS && safeDirMtimeMs(startDirMtime.dir) === startDirMtime.mtimeMs : dirMtimesStillFresh(cached.dirMtimes);
    if (isFresh) {
      touchWalk(key, cached);
      return cached.dir;
    }
  }
  const dirMtimes = [];
  let found;
  let depth = 0;
  for (const dir of walkUpDirs(startDir)) {
    if (isAtOrAboveHomeDir(dir, homeDir))
      break;
    if (depth >= MAX_WALK_DEPTH) {
      logLatency({
        type: "phase",
        filePath: startDir,
        phase: "workspace-topology-walk-cap",
        durationMs: 0,
        metadata: { ...capMetadata, depth, homeDir }
      });
      break;
    }
    const markers = getDirectoryMarkers(dir);
    dirMtimes.push({ dir, mtimeMs: markers.dirMtimeMs });
    if (matches(markers)) {
      found = dir;
      break;
    }
    depth += 1;
  }
  const walkedAtMs = Date.now();
  const entry = {
    dir: found,
    dirMtimes,
    walkedAtMs,
    lastUsedAt: walkedAtMs
  };
  const outgoing = walkCache.get(key);
  if (outgoing?.idleTimer !== void 0) {
    clearTimeout(outgoing.idleTimer);
    outgoing.idleTimer = void 0;
  }
  walkCache.set(key, entry);
  touchWalk(key, entry);
  while (walkCache.size > TOPOLOGY_MAX_WALK_ENTRIES) {
    const victim = [...walkCache.entries()].sort(([, a], [, b]) => a.lastUsedAt - b.lastUsedAt)[0];
    if (!victim)
      break;
    deleteWalk(victim[0]);
  }
  return found;
}
function findNearestDirWithMarker(startDir, markerKey, homeDir = os2.homedir()) {
  return walkToNearestMatch(startDir, markerKey, (markers) => Boolean(markers[markerKey]), { markerKey }, homeDir);
}
function hasBasenameMarker(markers, basename) {
  if (basename.includes("/") || basename.includes("\\")) {
    return fs2.existsSync(path2.join(markers.dir, basename));
  }
  if (basename.includes("*")) {
    return [...markers.entryFileNames].some((entryName) => nameMatchesMarkerGlob(entryName, basename));
  }
  return markers.entryNames.has(basename);
}
function findNearestDirWithAnyBasename(startDir, basenames, homeDir = os2.homedir()) {
  if (basenames.length === 0)
    return void 0;
  return walkToNearestMatch(startDir, `any:${basenames.join(String.fromCodePoint(1))}`, (markers) => basenames.some((basename) => hasBasenameMarker(markers, basename)), { basenames }, homeDir);
}
function findPiLensConfigMarkerInDir(dir) {
  const markers = getDirectoryMarkers(dir);
  if (!markers.piLensConfigPath)
    return void 0;
  if (isResolvedGlobalConfigPath(markers.piLensConfigPath))
    return void 0;
  const stat = (() => {
    try {
      return fs2.statSync(markers.piLensConfigPath);
    } catch {
      return void 0;
    }
  })();
  if (!stat?.isFile())
    return void 0;
  return {
    path: markers.piLensConfigPath,
    dir: markers.dir,
    mtimeMs: stat.mtimeMs,
    size: stat.size
  };
}
function findGoverningTsconfigDir(startDir, homeDir = os2.homedir()) {
  return findNearestDirWithMarker(startDir, "tsconfigPath", homeDir);
}
function getWorkspaceManifestMarkers(dir) {
  const markers = getDirectoryMarkers(dir);
  return {
    hasPnpmWorkspaceYaml: markers.pnpmWorkspaceYamlPath !== void 0,
    hasGoWork: markers.goWorkPath !== void 0,
    hasCargoToml: markers.cargoTomlPath !== void 0,
    hasPackageJson: markers.packageJsonPath !== void 0
  };
}

export {
  errorClassName,
  CANONICAL_PROJECT_CONFIG_FILE,
  CANONICAL_GLOBAL_CONFIG_FILE,
  LSP_NAMESPACE_KEY,
  LEGACY_ROOT_LSP_KEYS,
  PROJECT_CONFIG_LOCATIONS,
  PROJECT_CONFIG_BASENAMES,
  GLOBAL_CONFIG_LOCATIONS,
  configSearchDirs,
  getProductionGlobalConfigResolution,
  getPiLensGlobalConfigPath,
  isResolvedGlobalConfigPath,
  canonicalPathIdentity,
  FRESHNESS_CADENCE_MS,
  registerWorkspaceTopologyReset,
  resetWorkspaceTopology,
  getDirectoryMarkers,
  dirMtimesStillFresh,
  dirMtimesStillFreshAsync,
  dirMtimeRecordsAsync,
  unknownDirMtimeRecords,
  findNearestDirWithMarker,
  findNearestDirWithAnyBasename,
  findPiLensConfigMarkerInDir,
  findGoverningTsconfigDir,
  getWorkspaceManifestMarkers
};
