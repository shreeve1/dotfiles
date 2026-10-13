import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  shouldRecurseIntoDir,
  walkTreeRecursiveSync,
  walkTreeStackAsync
} from "./chunk-5NGR67U5.js";
import {
  getProjectIgnoreMatcher
} from "./chunk-C34ZXZ7O.js";
import {
  KIND_EXTENSIONS,
  isCodeKindFile
} from "./chunk-PHDMFAKM.js";
import {
  classifyGeneratedOrArtifactDetailed,
  isDeclarationFile
} from "./chunk-2BBLFX75.js";
import {
  logLatency
} from "./chunk-QQNQ7SJW.js";
import {
  toPositiveFinite
} from "./chunk-AOHZU2BM.js";
import {
  BoundedLruCache
} from "./chunk-ABBOA7UD.js";
import {
  normalizeEphemeralMapKey,
  normalizeFilePath
} from "./chunk-N2H3ZPZY.js";

// dist/clients/source-filter.js
import * as fs2 from "node:fs";
import * as path2 from "node:path";

// dist/clients/slow-fs.js
import * as fs from "node:fs";
import * as path from "node:path";
var DEFAULT_SLOW_FS_THRESHOLD_US = 500;
var PROBE_SAMPLE_CAP = 15;
function resolveThresholdMicros() {
  const envValue = toPositiveFinite(process.env.PI_LENS_SLOW_FS_THRESHOLD_US);
  return envValue > 0 ? envValue : DEFAULT_SLOW_FS_THRESHOLD_US;
}
function median(values) {
  if (values.length === 0)
    return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}
function probeSlowFs(rootDir) {
  try {
    const resolvedRoot = path.resolve(rootDir);
    const entries = fs.readdirSync(resolvedRoot).slice(0, PROBE_SAMPLE_CAP);
    if (entries.length === 0) {
      return { slow: false, medianStatMicros: 0, samples: 0 };
    }
    const samplesMicros = [];
    for (const entry of entries) {
      const fullPath = path.join(resolvedRoot, entry);
      const startedAt = process.hrtime.bigint();
      try {
        fs.statSync(fullPath);
      } catch {
        continue;
      }
      const elapsedNs = process.hrtime.bigint() - startedAt;
      samplesMicros.push(Number(elapsedNs) / 1e3);
    }
    if (samplesMicros.length === 0) {
      return { slow: false, medianStatMicros: 0, samples: 0 };
    }
    const medianStatMicros = median(samplesMicros);
    const threshold = resolveThresholdMicros();
    return {
      slow: medianStatMicros > threshold,
      medianStatMicros,
      samples: samplesMicros.length
    };
  } catch {
    return { slow: false, medianStatMicros: 0, samples: 0 };
  }
}
var slowFsVerdictCache = new BoundedLruCache(32);
function getSlowFsVerdict(cwd) {
  if (process.env.PI_LENS_ALLOW_SLOW_FS_SCAN === "1") {
    return { slow: false, medianStatMicros: 0, samples: 0 };
  }
  if (process.env.PI_LENS_FORCE_SLOW_FS === "1") {
    return { slow: true, medianStatMicros: 0, samples: 0 };
  }
  const key = normalizeFilePath(path.resolve(cwd));
  const cached = slowFsVerdictCache.get(key);
  if (cached)
    return cached;
  const result = probeSlowFs(cwd);
  slowFsVerdictCache.set(key, result);
  return result;
}
function isSlowFs(cwd) {
  return getSlowFsVerdict(cwd).slow;
}
var SLOW_FS_REDUCED_MAX_FILES = 500;
function slowFsDegradationNotice() {
  return "slow filesystem detected (set PI_LENS_ALLOW_SLOW_FS_SCAN=1 to override)";
}

// dist/clients/source-filter.js
function createArtifactProbeCache() {
  return /* @__PURE__ */ new Map();
}
function probeExists(filePath, cache) {
  if (!cache)
    return fs2.existsSync(filePath);
  const key = normalizeEphemeralMapKey(filePath);
  const cached = cache.get(key);
  if (cached !== void 0)
    return cached;
  const result = fs2.existsSync(filePath);
  cache.set(key, result);
  return result;
}
var SOURCE_PRECEDENCE = {
  ".ts": [".js", ".jsx", ".mjs", ".cjs"],
  ".tsx": [".jsx", ".js", ".mjs", ".cjs"],
  ".mts": [".mjs", ".js", ".jsx", ".cjs"],
  ".cts": [".cjs", ".js", ".jsx", ".mjs"],
  ".vue": [".js", ".mjs"],
  ".svelte": [".js", ".mjs"],
  ".coffee": [".js"]
};
function sourceTwinCandidates(filePath) {
  const ext = path2.extname(filePath).toLowerCase();
  const stem = filePath.slice(0, filePath.length - ext.length);
  const sourceExts = ext === ".mjs" ? [".mts", ".ts", ".tsx", ".cts"] : ext === ".cjs" ? [".cts", ".ts", ".tsx", ".mts"] : ext === ".jsx" ? (
    // Deliberately retain the broad fallback: a .jsx next to a .ts
    // is treated as a build artifact even without a .tsx sibling.
    [".tsx", ".ts", ".mts", ".cts"]
  ) : ext === ".js" ? [".ts", ".tsx", ".mts", ".cts"] : [];
  return sourceExts.map((sourceExt) => `${stem}${sourceExt}`);
}
function canonicalSourceTwin(filePath, availableFiles, excludedFiles) {
  for (const candidate of sourceTwinCandidates(filePath)) {
    if (availableFiles.has(candidate) && !excludedFiles?.has(candidate)) {
      return candidate;
    }
  }
  return filePath;
}
var ALL_SCANNABLE_EXTENSIONS = [
  .../* @__PURE__ */ new Set([
    ...Object.values(KIND_EXTENSIONS).flat(),
    ...Object.keys(SOURCE_PRECEDENCE)
  ])
];
var DEFAULT_MAX_SOURCE_FILES = 2e4;
var DEFAULT_MAX_SCAN_ENTRIES = 2e5;
function createKeptFilesAccumulator(maxFiles, prioritizeCodeKinds) {
  if (!prioritizeCodeKinds) {
    const files = [];
    return {
      push: (file) => void files.push(file),
      isFull: () => files.length >= maxFiles,
      list: () => files
    };
  }
  const codeFiles = [];
  const otherFiles = [];
  return {
    push(file) {
      if (isCodeKindFile(file))
        codeFiles.push(file);
      else if (otherFiles.length < maxFiles)
        otherFiles.push(file);
    },
    isFull: () => codeFiles.length >= maxFiles,
    list: () => [...codeFiles, ...otherFiles].slice(0, maxFiles)
  };
}
function createSourceWalkSkipCounters() {
  return {
    generatedOrArtifactSkips: 0,
    buildArtifactSkips: 0,
    generatedDirSkips: 0,
    generatedNameOverrides: 0,
    generatedNameOnlySkips: 0
  };
}
function logSourceWalkSkipsIfAny(rootDir, counters) {
  if (counters.generatedOrArtifactSkips === 0 && counters.buildArtifactSkips === 0 && counters.generatedDirSkips === 0 && counters.generatedNameOverrides === 0) {
    return;
  }
  logLatency({
    type: "phase",
    phase: "source_walk_skip_summary",
    filePath: rootDir,
    durationMs: 0,
    metadata: {
      generatedOrArtifactSkips: counters.generatedOrArtifactSkips,
      buildArtifactSkips: counters.buildArtifactSkips,
      generatedDirSkips: counters.generatedDirSkips,
      generatedNameOverrides: counters.generatedNameOverrides,
      generatedNameOnlySkips: counters.generatedNameOnlySkips
    }
  });
}
function classifySkipGeneratedOrArtifact(filePath, options) {
  const includeDeclarations = options?.includeDeclarationFiles === true;
  if (options?.includeGenerated === true) {
    return !includeDeclarations && isDeclarationFile(filePath) ? { verdict: "generated", evidence: "strong" } : { verdict: "clean" };
  }
  return classifyGeneratedOrArtifactDetailed(filePath, {
    readContentHeader: options?.inspectGeneratedHeaders !== false,
    includeDeclarations: !includeDeclarations
  });
}
function shouldSkipGeneratedOrArtifact(filePath, options) {
  return classifySkipGeneratedOrArtifact(filePath, options).verdict === "generated";
}
function getBasename(filePath) {
  const ext = path2.extname(filePath);
  return path2.basename(filePath, ext);
}
function getDir(filePath) {
  return path2.dirname(filePath);
}
function findSourceSibling(filePath, probeCache) {
  for (const candidate of sourceTwinCandidates(filePath)) {
    if (probeExists(candidate, probeCache))
      return candidate;
  }
  const ext = path2.extname(filePath).toLowerCase();
  const dir = getDir(filePath);
  const base = getBasename(filePath);
  for (const [sourceExt, shadowedExts] of Object.entries(SOURCE_PRECEDENCE)) {
    if (!sourceExtsForCompiledExt(sourceExt).length && shadowedExts.includes(ext)) {
      const siblingPath = path2.join(dir, base + sourceExt);
      if (probeExists(siblingPath, probeCache))
        return siblingPath;
    }
  }
  return null;
}
function sourceExtsForCompiledExt(sourceExt) {
  return sourceExt === ".ts" || sourceExt === ".tsx" || sourceExt === ".mts" || sourceExt === ".cts" ? [sourceExt] : [];
}
function isBuildArtifact(filePath, probeCache) {
  return findSourceSibling(filePath, probeCache) !== null;
}
function filterSourceFiles(filePaths, options) {
  const keep = [];
  const skipReasons = /* @__PURE__ */ new Map();
  const probeCache = createArtifactProbeCache();
  for (const filePath of filePaths) {
    const sourceSibling = findSourceSibling(filePath, probeCache);
    if (sourceSibling) {
      skipReasons.set(filePath, sourceSibling);
    } else if (shouldSkipGeneratedOrArtifact(filePath, options)) {
      skipReasons.set(filePath, "generated-or-artifact");
    } else {
      keep.push(filePath);
    }
  }
  return keep;
}
function resolveFiniteCap(raw, fallback) {
  return typeof raw === "number" && Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : fallback;
}
function resolveCollectionConfig(rootDir, options, config) {
  const requestedMax = resolveFiniteCap(options?.maxFiles, DEFAULT_MAX_SOURCE_FILES);
  const maxFiles = config?.clampForSlowFsSyncWalk === true && isSlowFs(rootDir) ? Math.min(requestedMax, SLOW_FS_REDUCED_MAX_FILES) : requestedMax;
  return {
    ignoreMatcher: getProjectIgnoreMatcher(rootDir),
    extraExcludePatterns: options?.excludeDirs ?? [],
    extensions: new Set(options?.extensions || ALL_SCANNABLE_EXTENSIONS),
    maxFiles,
    maxScanEntries: resolveFiniteCap(options?.maxScanEntries, DEFAULT_MAX_SCAN_ENTRIES),
    options
  };
}
function classifyEntry(entry, fullPath, cfg, probeCache, skipCounters) {
  const { ignoreMatcher, extraExcludePatterns, extensions, options } = cfg;
  if (entry.isDirectory()) {
    const canRecurse = shouldRecurseIntoDir(
      entry,
      fullPath,
      {
        ignoreMatcher,
        extraExcludeDirs: extraExcludePatterns,
        skipGeneratedArtifactDirs: options?.includeGenerated !== true,
        followSymlinks: options?.followSymlinks === true
      },
      // #1107 phase 2: counts one event per PRUNED DIRECTORY, not per file
      // inside it — see `generatedDirSkips`'s doc on `SourceCollectionResult`.
      skipCounters ? () => {
        skipCounters.generatedDirSkips += 1;
      } : void 0
    );
    if (!canRecurse)
      return {};
    return { recurseInto: fullPath };
  }
  if (entry.isFile()) {
    const ext = path2.extname(entry.name).toLowerCase();
    if (!extensions.has(ext))
      return {};
    if (ignoreMatcher.isIgnored(fullPath, false))
      return {};
    if (isBuildArtifact(fullPath, probeCache)) {
      if (skipCounters)
        skipCounters.buildArtifactSkips += 1;
      return {};
    }
    const classification = classifySkipGeneratedOrArtifact(fullPath, options);
    if (classification.verdict === "generated") {
      if (skipCounters) {
        skipCounters.generatedOrArtifactSkips += 1;
        if (classification.evidence === "name-only") {
          skipCounters.generatedNameOnlySkips += 1;
        }
      }
      return {};
    }
    if (classification.verdict === "override" && skipCounters) {
      skipCounters.generatedNameOverrides += 1;
    }
    return { keepFile: fullPath };
  }
  return {};
}
function createEntryBudget(limit) {
  return { visited: 0, limit, exceeded: false };
}
function chargeEntryBudget(budget) {
  if (budget.exceeded)
    return false;
  budget.visited += 1;
  if (budget.visited > budget.limit)
    budget.exceeded = true;
  return !budget.exceeded;
}
function collectSourceFilesWithBudget(dir, options) {
  const rootDir = path2.resolve(dir);
  const cfg = resolveCollectionConfig(rootDir, options, {
    clampForSlowFsSyncWalk: true
  });
  const kept = createKeptFilesAccumulator(cfg.maxFiles, options?.prioritizeCodeKinds === true);
  const probeCache = createArtifactProbeCache();
  const budget = createEntryBudget(cfg.maxScanEntries);
  const skipCounters = createSourceWalkSkipCounters();
  walkTreeRecursiveSync(rootDir, (entry, fullPath) => {
    if (kept.isFull())
      return "stop";
    if (!chargeEntryBudget(budget))
      return "stop";
    const { recurseInto, keepFile } = classifyEntry(entry, fullPath, cfg, probeCache, skipCounters);
    if (recurseInto)
      return "recurse";
    if (keepFile)
      kept.push(keepFile);
    return "skip";
  });
  logSourceWalkSkipsIfAny(rootDir, skipCounters);
  return {
    files: kept.list(),
    entryBudgetExceeded: budget.exceeded,
    generatedOrArtifactSkips: skipCounters.generatedOrArtifactSkips,
    buildArtifactSkips: skipCounters.buildArtifactSkips,
    generatedDirSkips: skipCounters.generatedDirSkips,
    generatedNameOverrides: skipCounters.generatedNameOverrides,
    generatedNameOnlySkips: skipCounters.generatedNameOnlySkips
  };
}
function collectSourceFiles(dir, options) {
  return collectSourceFilesWithBudget(dir, options).files;
}
async function collectSourceFilesAsync(dir, options) {
  return (await collectSourceFilesWithBudgetAsync(dir, options)).files;
}
async function collectSourceFilesWithBudgetAsync(dir, options) {
  const rootDir = path2.resolve(dir);
  const cfg = resolveCollectionConfig(rootDir, options);
  const kept = createKeptFilesAccumulator(cfg.maxFiles, options?.prioritizeCodeKinds === true);
  const probeCache = createArtifactProbeCache();
  const budget = createEntryBudget(cfg.maxScanEntries);
  const skipCounters = createSourceWalkSkipCounters();
  await walkTreeStackAsync(rootDir, (entry, fullPath) => {
    options?.onEntryVisited?.();
    if (!chargeEntryBudget(budget))
      return "stop";
    const { recurseInto, keepFile } = classifyEntry(entry, fullPath, cfg, probeCache, skipCounters);
    if (recurseInto)
      return "recurse";
    if (keepFile) {
      kept.push(keepFile);
      if (kept.isFull())
        return "stop";
    }
    return "skip";
  }, {
    // 50 entries/chunk keeps the worst-case synchronous burst under ~40ms
    // even on a cold scan where every kept file pays the 4 KB generated-
    // header read (measured on a 2k-file fixture). Larger values regress
    // past the ~50ms event-loop budget; see PERF-AUDIT.md.
    budgetMs: Math.max(1, options?.budgetMs ?? 8),
    // #703: prime the tracked-files set once before the walk so a tracked
    // file matching a `.gitignore`/global pattern still surfaces. Fail-open
    // on no-git/spawn failure.
    beforeWalk: () => cfg.ignoreMatcher.ensureTrackedIndex()
  });
  logSourceWalkSkipsIfAny(rootDir, skipCounters);
  return {
    files: kept.list(),
    entryBudgetExceeded: budget.exceeded,
    generatedOrArtifactSkips: skipCounters.generatedOrArtifactSkips,
    buildArtifactSkips: skipCounters.buildArtifactSkips,
    generatedDirSkips: skipCounters.generatedDirSkips,
    generatedNameOverrides: skipCounters.generatedNameOverrides,
    generatedNameOnlySkips: skipCounters.generatedNameOnlySkips
  };
}
function getFilterStats(allFiles, filteredFiles) {
  const skipped = allFiles.length - filteredFiles.length;
  const byType = {};
  for (const file of allFiles) {
    if (!filteredFiles.includes(file)) {
      const ext = path2.extname(file).toLowerCase();
      byType[ext] = (byType[ext] || 0) + 1;
    }
  }
  return {
    total: allFiles.length,
    kept: filteredFiles.length,
    skipped,
    byType
  };
}

export {
  getSlowFsVerdict,
  isSlowFs,
  slowFsDegradationNotice,
  createArtifactProbeCache,
  SOURCE_PRECEDENCE,
  sourceTwinCandidates,
  canonicalSourceTwin,
  ALL_SCANNABLE_EXTENSIONS,
  DEFAULT_MAX_SOURCE_FILES,
  DEFAULT_MAX_SCAN_ENTRIES,
  findSourceSibling,
  isBuildArtifact,
  filterSourceFiles,
  collectSourceFilesWithBudget,
  collectSourceFiles,
  collectSourceFilesAsync,
  collectSourceFilesWithBudgetAsync,
  getFilterStats
};
