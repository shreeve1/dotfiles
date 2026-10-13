import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  getStartupScanMaxSourceFilesDerived
} from "./chunk-GAEGEPOC.js";
import {
  shouldRecurseIntoDir,
  walkTreeStackAsync,
  walkTreeStackSync
} from "./chunk-5NGR67U5.js";
import {
  getProjectIgnoreMatcher
} from "./chunk-C34ZXZ7O.js";
import {
  getDirectoryMarkers,
  registerWorkspaceTopologyReset
} from "./chunk-XVF2VVXP.js";
import {
  lazyEnvNumber
} from "./chunk-AOHZU2BM.js";
import {
  BoundedLruCache
} from "./chunk-ABBOA7UD.js";
import {
  isAtOrAboveHomeDir,
  normalizeMapKey
} from "./chunk-N2H3ZPZY.js";

// dist/clients/startup-scan.js
import * as os from "node:os";
import * as path from "node:path";
var PROJECT_ROOT_MARKERS = [
  ".git",
  "package.json",
  "pyproject.toml",
  "Cargo.toml",
  "go.mod",
  "composer.json"
];
var MAX_STARTUP_SCAN_ENTRIES = 5e4;
var SOURCE_FILE_PATTERN = /\.(ts|tsx|js|jsx|py|go|rs|rb)$/;
var DEFAULT_STARTUP_SCAN_VERDICT_TTL_MS = 24 * 60 * 60 * 1e3;
var _ttl = lazyEnvNumber("PI_LENS_STARTUP_SCAN_VERDICT_TTL_MS", DEFAULT_STARTUP_SCAN_VERDICT_TTL_MS);
var getStartupScanVerdictTtlMs = _ttl.get;
var _resetStartupScanVerdictTtlForTests = _ttl._resetForTests;
var _maxEntries = lazyEnvNumber("PI_LENS_STARTUP_SCAN_MAX_ENTRIES", MAX_STARTUP_SCAN_ENTRIES);
var getStartupScanMaxEntries = _maxEntries.get;
var _resetStartupScanMaxEntriesForTests = _maxEntries._resetForTests;
function isStartupScanVerdictFresh(verdict, now = Date.now()) {
  if (verdict.reason !== "too-many-source-files" && verdict.reason !== "too-many-entries")
    return true;
  if (typeof verdict.computedAt !== "number")
    return false;
  if (verdict.maxProjectFiles !== getStartupScanMaxSourceFilesDerived(verdict.cwd))
    return false;
  if (verdict.maxScanEntries !== getStartupScanMaxEntries())
    return false;
  return now - verdict.computedAt < getStartupScanVerdictTtlMs();
}
function findNearestProjectRoot(startDir) {
  let current = path.resolve(startDir);
  while (true) {
    const entryNames = getDirectoryMarkers(current).entryNames;
    if (PROJECT_ROOT_MARKERS.some((marker) => entryNames.has(marker))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current)
      return null;
    current = parent;
  }
}
function makeSourceCountVisitor(state, ignoreMatcher, limit, maxEntries) {
  return (entry, fullPath) => {
    state.visited += 1;
    if (entry.isDirectory()) {
      const recurse = shouldRecurseIntoDir(entry, fullPath, {
        ignoreMatcher,
        followSymlinks: true
      });
      if (state.visited >= maxEntries) {
        state.entryBudgetExceeded = true;
        return "stop";
      }
      return recurse ? "recurse" : "skip";
    }
    if (entry.isFile() && SOURCE_FILE_PATTERN.test(entry.name) && !ignoreMatcher.isIgnored(fullPath, false)) {
      state.count += 1;
      if (state.count > limit)
        return "stop";
    }
    if (state.visited >= maxEntries) {
      state.entryBudgetExceeded = true;
      return "stop";
    }
    return "skip";
  };
}
function walkSourceCount(dir, limit, maxEntries) {
  const state = {
    count: 0,
    visited: 0,
    entryBudgetExceeded: false
  };
  const rootDir = path.resolve(dir);
  const ignoreMatcher = getProjectIgnoreMatcher(rootDir);
  walkTreeStackSync(rootDir, makeSourceCountVisitor(state, ignoreMatcher, limit, maxEntries));
  return { count: state.count, entryBudgetExceeded: state.entryBudgetExceeded };
}
function countSourceFilesWithinLimit(dir, limit) {
  return walkSourceCount(dir, limit, Number.POSITIVE_INFINITY).count;
}
var startupScanContextCache = new BoundedLruCache(32);
registerWorkspaceTopologyReset(() => startupScanContextCache.clear());
function startupScanCacheKey(cwd, options) {
  return [
    normalizeMapKey(path.resolve(cwd)),
    options.homeDir ? normalizeMapKey(path.resolve(options.homeDir)) : "",
    options.maxSourceFiles ?? "",
    options.maxScanEntries ?? ""
  ].join("|");
}
var __testing = { startupScanCacheKey };
function resolveStartupScanContext(cwd, options = {}) {
  const cacheKey = startupScanCacheKey(cwd, options);
  const cached = startupScanContextCache.get(cacheKey);
  if (cached)
    return cached;
  const result = {
    ...computeStartupScanContext(cwd, options),
    computedAt: Date.now()
  };
  startupScanContextCache.set(cacheKey, result);
  return result;
}
function computeStartupScanContext(cwd, options = {}) {
  const resolvedCwd = path.resolve(cwd);
  const homeDir = path.resolve(options.homeDir ?? os.homedir());
  const maxSourceFiles = options.maxSourceFiles ?? getStartupScanMaxSourceFilesDerived(resolvedCwd);
  const maxScanEntries = options.maxScanEntries ?? getStartupScanMaxEntries();
  const projectRoot = findNearestProjectRoot(resolvedCwd);
  if (!projectRoot) {
    return {
      cwd: resolvedCwd,
      scanRoot: resolvedCwd,
      projectRoot: null,
      canWarmCaches: false,
      reason: isAtOrAboveHomeDir(resolvedCwd, homeDir) ? "home-dir" : "no-project-root"
    };
  }
  if (isAtOrAboveHomeDir(projectRoot, homeDir)) {
    return {
      cwd: resolvedCwd,
      scanRoot: projectRoot,
      projectRoot,
      canWarmCaches: false,
      reason: "home-dir"
    };
  }
  const { count: sourceFileCount, entryBudgetExceeded } = walkSourceCount(projectRoot, maxSourceFiles, maxScanEntries);
  if (sourceFileCount > maxSourceFiles || entryBudgetExceeded) {
    return {
      cwd: resolvedCwd,
      scanRoot: projectRoot,
      projectRoot,
      canWarmCaches: false,
      reason: entryBudgetExceeded ? "too-many-entries" : "too-many-source-files",
      sourceFileCount,
      maxProjectFiles: maxSourceFiles,
      maxScanEntries
    };
  }
  return {
    cwd: resolvedCwd,
    scanRoot: projectRoot,
    projectRoot,
    canWarmCaches: true,
    sourceFileCount
  };
}
async function walkSourceCountAsync(dir, limit, maxEntries, opts = {}) {
  const state = {
    count: 0,
    visited: 0,
    entryBudgetExceeded: false
  };
  const rootDir = path.resolve(dir);
  const ignoreMatcher = getProjectIgnoreMatcher(rootDir);
  await walkTreeStackAsync(rootDir, makeSourceCountVisitor(state, ignoreMatcher, limit, maxEntries), {
    // Yield every 100 entries by default. Empirically each yield costs
    // ~0.1ms of overhead and a 2k-file project produces ~20 yields, so the
    // total async overhead is well under 5ms while keeping per-burst sync
    // work under 50ms (the perceptual threshold for "instant" keystrokes).
    budgetMs: opts.budgetMs ?? 8,
    // #703: prime the tracked-files set ONCE before the walk (not per file)
    // so a tracked file matching a `.gitignore`/global pattern isn't dropped
    // from the startup source-file count. Fail-open: resolves even when git
    // is absent, and `isIgnored` degrades to pattern-only if this never
    // resolves before a caller inspects results.
    beforeWalk: () => ignoreMatcher.ensureTrackedIndex()
  });
  return { count: state.count, entryBudgetExceeded: state.entryBudgetExceeded };
}
async function countSourceFilesWithinLimitAsync(dir, limit, opts = {}) {
  return (await walkSourceCountAsync(dir, limit, Number.POSITIVE_INFINITY, opts)).count;
}
async function resolveStartupScanContextAsync(cwd, options = {}) {
  const cacheKey = startupScanCacheKey(cwd, options);
  const cached = startupScanContextCache.get(cacheKey);
  if (cached)
    return cached;
  const resolvedCwd = path.resolve(cwd);
  const homeDir = path.resolve(options.homeDir ?? os.homedir());
  const maxSourceFiles = options.maxSourceFiles ?? getStartupScanMaxSourceFilesDerived(resolvedCwd);
  const maxScanEntries = options.maxScanEntries ?? getStartupScanMaxEntries();
  const projectRoot = findNearestProjectRoot(resolvedCwd);
  let result;
  if (!projectRoot) {
    result = {
      cwd: resolvedCwd,
      scanRoot: resolvedCwd,
      projectRoot: null,
      canWarmCaches: false,
      reason: isAtOrAboveHomeDir(resolvedCwd, homeDir) ? "home-dir" : "no-project-root"
    };
  } else if (isAtOrAboveHomeDir(projectRoot, homeDir)) {
    result = {
      cwd: resolvedCwd,
      scanRoot: projectRoot,
      projectRoot,
      canWarmCaches: false,
      reason: "home-dir"
    };
  } else {
    const { count: sourceFileCount, entryBudgetExceeded } = await walkSourceCountAsync(projectRoot, maxSourceFiles, maxScanEntries);
    if (sourceFileCount > maxSourceFiles || entryBudgetExceeded) {
      result = {
        cwd: resolvedCwd,
        scanRoot: projectRoot,
        projectRoot,
        canWarmCaches: false,
        reason: entryBudgetExceeded ? "too-many-entries" : "too-many-source-files",
        sourceFileCount,
        maxProjectFiles: maxSourceFiles,
        maxScanEntries
      };
    } else {
      result = {
        cwd: resolvedCwd,
        scanRoot: projectRoot,
        projectRoot,
        canWarmCaches: true,
        sourceFileCount
      };
    }
  }
  result = { ...result, computedAt: Date.now() };
  startupScanContextCache.set(cacheKey, result);
  return result;
}

export {
  MAX_STARTUP_SCAN_ENTRIES,
  getStartupScanVerdictTtlMs,
  _resetStartupScanVerdictTtlForTests,
  getStartupScanMaxEntries,
  _resetStartupScanMaxEntriesForTests,
  isStartupScanVerdictFresh,
  findNearestProjectRoot,
  countSourceFilesWithinLimit,
  __testing,
  resolveStartupScanContext,
  countSourceFilesWithinLimitAsync,
  resolveStartupScanContextAsync
};
