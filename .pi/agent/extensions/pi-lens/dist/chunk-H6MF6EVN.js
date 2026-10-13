import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  getLazyInstallAttempt,
  tryLazyInstall
} from "./chunk-OXXKQCSV.js";
import {
  findingsResult,
  finishParsedRun,
  formatToolFailure,
  hasUsableResult,
  isRunnerClaimSource,
  isRunnerSkipReason,
  parseToolRun,
  skipUnlessToolRan
} from "./chunk-2CD5RS6M.js";
import {
  stripAnsi
} from "./chunk-FC4RP4I2.js";
import {
  spawnFailedWithNoOutput
} from "./chunk-UZ3TUTRV.js";
import {
  goClient
} from "./chunk-XMSXXAHW.js";
import {
  isTrivyEnabled,
  resolveSeverityFloor
} from "./chunk-77M37OKR.js";
import {
  rustClient
} from "./chunk-MRXKYPCS.js";
import {
  coveringLaneAvailable,
  createAvailabilityChecker,
  createCwdCachedProbe,
  getDispatchAvailabilityGeneration,
  lspPrimaryCoversFile,
  recordAvailabilityProbeOverrun,
  resolveAdoptedRootCommand,
  resolveAvailableOrInstall,
  resolveCommandArgsWithInstallFallback,
  resolveLocalFirstAsync,
  resolveRunnerCwd as resolveRunnerCwd2,
  resolveToolCommand,
  resolveToolCommandWithInstallFallback,
  resolveVendorToolCommand
} from "./chunk-YSZNHOBY.js";
import {
  biomeConfigArgs,
  findCompiledClassesDir,
  getAutofixCapability,
  getJstsLintPolicyForCwd,
  getLinterPolicyForCwd,
  getRubocopCommand,
  hasEslintConfig,
  hasGolangciConfig,
  hasJavaBuildDescriptor,
  hasMypyConfig,
  hasPhpstanConfig,
  hasSqlfluffConfig,
  hasStylelintConfig,
  hasVitePlusConfig,
  hasYamllintConfig,
  markdownlintConfigArgs,
  ruffConfigArgs
} from "./chunk-RPLINGVB.js";
import {
  importFactProvider
} from "./chunk-XCJN5IJU.js";
import {
  functionFactProvider
} from "./chunk-76MWC2K6.js";
import {
  extractFactsFromTree
} from "./chunk-GXW6K4YJ.js";
import {
  computeImpactCascade
} from "./chunk-2B73ZPOK.js";
import {
  buildOrUpdateGraph,
  clearReviewGraphWorkspaceCache,
  fileContentProvider
} from "./chunk-YYOIQFRS.js";
import {
  MAX_BLOCKING_RULE_COMPLEXITY,
  RUNTIME_CONFIG,
  applyDispositions,
  applyDispositionsMultiFile,
  buildEffectiveAstGrepCatalog,
  calculateRuleComplexity,
  classifyDefect,
  classifyDiagnostic,
  classifyDiagnosticTier,
  clearPendingAuxiliaryCoverage,
  enabledAuxiliaryLspServerIds,
  exceedsLspSyncLimits,
  fetchTsserverProjectIdentity,
  getLSPService,
  getRunnerTimeoutFloorMs,
  hasAnyDispositionMarks,
  hasAuxiliaryLspPublishedForRoot,
  hasPendingAuxiliaryCoverage,
  isOverlyBroadPattern,
  isRuleIgnoredForPath,
  isStructuredRule,
  recordDiagnostics,
  recordNapiFallbackCoverage,
  recordRunner,
  retagAuxiliaryDiagnostics,
  touchCoverageGap,
  tryWarmAttachedCodeActions,
  tryWarmAttachedDiagnostics
} from "./chunk-M6HSLBWY.js";
import {
  mapWithConcurrency
} from "./chunk-XIMYZ3JA.js";
import {
  LSP_SERVERS,
  getAstGrepRuleSources,
  registerRunnerId,
  resolveAnalysisRoot
} from "./chunk-EU63SDCG.js";
import {
  augmentPythonEnvironment,
  detectPythonEnvironment
} from "./chunk-FCSOVF55.js";
import {
  loadProjectSnapshot,
  readJsonCache,
  readJsonCacheAsync
} from "./chunk-ZXYDQ3TZ.js";
import {
  BUNDLED_QUERIES_ROOT,
  classifyTreeSitterWasmError,
  computeRuleFilesFingerprint,
  firstChildOfType,
  getBundledQueriesRootHealth,
  getSharedTreeSitterClient,
  isDisabledQueryFilePath,
  isTreeSitterWasmAborted,
  logTreeSitter,
  markTreeSitterWasmAborted,
  queriesForLanguage,
  queryLoader,
  reportBundledResourceDirHealth,
  resetTreeSitterClientLoadState,
  resolveTreeSitterLanguage,
  ruleFilesForLanguage,
  ruleSourceLanguages,
  walk
} from "./chunk-QHJ6DQ2R.js";
import {
  buildModuleGraph,
  clearModuleGraphCache
} from "./chunk-GBPP5P7X.js";
import {
  WORD_INDEX_MAX_BYTES,
  deserializeWordIndex,
  logWordIndex,
  removeWordIndexDocumentAsync,
  scheduleWordIndexPersist,
  updateWordIndexDocumentForEdit
} from "./chunk-SAEFPSB6.js";
import {
  PathKeyedMap
} from "./chunk-Z3CCVDUB.js";
import {
  WARM_CODE_ACTION_LOOKUP_LIMIT,
  contentHash,
  resolveRunnerPath
} from "./chunk-L3BLXZG7.js";
import {
  isSpawnableCommand
} from "./chunk-ACXEQZOU.js";
import {
  logRunnerAdvisoryOnce,
  resolveRunnerCwd,
  resolveRunnerCwdWithReason
} from "./chunk-Q7DUK4LX.js";
import {
  findLocalBinUpwards,
  localBinPath
} from "./chunk-AW7R2GWG.js";
import {
  createAvailabilityProbeFlight,
  getIsolatedNpxSpawnOptions,
  probeToolAsync
} from "./chunk-RWWYJ623.js";
import {
  classifyProbeFailure,
  createAvailabilityLatch,
  describeInstallAttempt,
  describeUnavailability,
  isLatchingOutcome,
  logAvailabilityDecision,
  startHostStallSampler,
  transientRetryDelayMs
} from "./chunk-VRZP76YM.js";
import {
  getLspCapableKinds,
  getPrimaryDispatchGroup,
  resolveLanguageRootForFile
} from "./chunk-QOBUHWHX.js";
import {
  getGlobalPiLensDir,
  getProjectDataDir,
  isInSpawnTimeoutCooldown,
  isTestFile,
  loadPiLensGlobalConfig,
  noteSpawnTimeout,
  resolvePiLensFlag,
  safeSpawnAsync
} from "./chunk-C34ZXZ7O.js";
import {
  detectFileKind
} from "./chunk-PHDMFAKM.js";
import {
  classifyGeneratedOrArtifactDetailed,
  detectFileRole,
  loadPiLensProjectConfig,
  resolvePiLensConfig
} from "./chunk-2BBLFX75.js";
import {
  findNearestDirWithAnyBasename,
  findNearestDirWithMarker,
  getPiLensGlobalConfigPath
} from "./chunk-XVF2VVXP.js";
import {
  getProjectTrustState,
  projectTrustDenialReason
} from "./chunk-ZANLILYD.js";
import {
  killedForOutputCap,
  truncatedByOutputCap,
  writeFileAtomic
} from "./chunk-2EECBNC5.js";
import {
  incrementDegradationCount,
  recordDegradationOnce
} from "./chunk-JAU72XNY.js";
import {
  createSubsystemLogger,
  logExtension
} from "./chunk-XTMJ7XDT.js";
import {
  logLatency,
  phaseFinished,
  phaseStarted
} from "./chunk-QQNQ7SJW.js";
import {
  createNdjsonLogger,
  getGlobalPiLensLogDir,
  getMaxLogSizeMB,
  isTestMode
} from "./chunk-AOHZU2BM.js";
import {
  FactStore,
  setFactStoreEvictionReporter
} from "./chunk-CHOW74WE.js";
import {
  BoundedLruCache
} from "./chunk-ABBOA7UD.js";
import {
  findNearestContaining,
  isAbsoluteFilePath,
  isUnderDir,
  isWindowsPath,
  normalizeEphemeralMapKey,
  normalizeLoggedPath,
  normalizeMapKey,
  pathsEqual,
  toProjectRelativePath
} from "./chunk-N2H3ZPZY.js";

// dist/clients/mcp/analyze.js
import * as fs19 from "node:fs";
import * as path50 from "node:path";

// dist/clients/cache-manager.js
import * as fs from "node:fs";
import * as path from "node:path";
var DEFAULT_MAX_AGE_MS = 30 * 60 * 1e3;
var DEFAULT_TURN_STATE = {
  files: {},
  turnCycles: 0,
  maxCycles: 3,
  lastUpdated: ""
};
var MCP_TURN_STATE_OWNER_ID = `mcp-${process.pid}`;
var TURN_OWNER_STALE_MS = 30 * 60 * 1e3;
var TURN_SESSION_PARTITION_TTL_MS = 30 * 60 * 1e3;
var MAX_TURN_SESSION_PARTITIONS = 16;
function getLensDir(cwd) {
  return getProjectDataDir(cwd);
}
function getCacheDir(cwd) {
  return path.join(getLensDir(cwd), "cache");
}
function getTurnStatePath(cwd) {
  return path.join(getLensDir(cwd), "turn-state.json");
}
var CacheManager = class {
  log;
  constructor(verbose = false) {
    this.log = verbose ? createSubsystemLogger("cache") : () => {
    };
  }
  /**
   * Convert a file path to a stable turn-state key.
   * Uses normalized absolute paths first, then stores cwd-relative keys when possible.
   */
  toTurnStateKey(filePath, cwd) {
    const cwdNorm = normalizeMapKey(path.resolve(cwd));
    const fileNorm = normalizeMapKey(path.resolve(cwd, filePath));
    const rel = path.relative(cwdNorm, fileNorm).replace(/\\/g, "/");
    if (!rel || rel === ".")
      return fileNorm;
    if (rel === ".." || rel.startsWith("../"))
      return fileNorm;
    return rel;
  }
  /**
   * Get turn-state entry for a file path using normalized lookup.
   */
  /**
   * #2504: is this path inside the PROJECT the worklist belongs to?
   *
   * Routed through `isUnderDir` (which normalises via `normalizeFilePath`) so
   * the answer is separator- and case-form independent, the same key rule
   * every other turn-state map obeys.
   *
   * The root is the PROJECT root, not the caller's `cwd` (#2504 review round
   * 2, F1). The two coincide for every producer whose `cwd` IS the session
   * root, but not for `clients/lsp-mutation.ts`: `tools/lsp-navigation.ts`
   * threads a `cwd`-scoped context for a call issued from a sub-package
   * directory, so a monorepo-wide server's edit on a SIBLING package is
   * inside the project and outside that `cwd`. Judging it against `cwd`
   * dropped exactly the server-initiated edits #2450/#2479 exist to record.
   * This is the same root `isRecordableProjectPath` (clients/file-utils.ts)
   * is given at that call site — one predicate root, taken from
   * `runtime.projectRoot`, not two that can disagree.
   */
  isTurnStatePathWithinRoot(filePath, projectRoot) {
    const root = path.resolve(projectRoot);
    const abs = path.resolve(root, filePath);
    if (normalizeMapKey(abs) === normalizeMapKey(root))
      return false;
    return isUnderDir(abs, root);
  }
  getTurnFileState(filePath, cwd) {
    const state = this.readTurnState(cwd);
    const key2 = this.toTurnStateKey(filePath, cwd);
    return state.files[key2];
  }
  // ---- Scanner Cache ----
  /**
   * The ONE staleness rule both scanner reads apply (#3274): the envelope's
   * age in ms when it is inside `maxAgeMs`, or `null` — having logged the
   * stale verdict — when it is not.
   *
   * Extracted rather than copied into {@link readCacheAsync} because the TTL
   * boundary is exactly what the two seams must not disagree about while
   * #3300 migrates callers across: a delivery that read one store through
   * each method would otherwise be able to see it fresh and stale at once.
   */
  freshAgeMs(scanner, meta, maxAgeMs) {
    const age = Date.now() - new Date(meta.timestamp).getTime();
    if (age > maxAgeMs) {
      this.log(`Cache stale: ${scanner} (age: ${Math.round(age / 1e3)}s, max: ${maxAgeMs / 1e3}s)`);
      return null;
    }
    return age;
  }
  /**
   * Read a scanner cache entry WITHOUT blocking the event loop (#3274).
   *
   * `readCache` below is synchronous: two `existsSync` plus two
   * `readFileSync`+`JSON.parse`, all of which complete during ARGUMENT
   * EVALUATION. `bounded()` (`clients/deadline-utils.ts`) takes a promise, so
   * a hook that wrapped the sync read registered a budget that could never be
   * spent — probed on #3274 with an already-aborted signal and `ms: 0`:
   * `bounded()` returned `undefined` and the read had already parsed its JSON.
   * This sibling suspends on `fs.promises`, so the turn_end budget and the
   * hook's `ctx.signal` can actually abandon it.
   *
   * Same outcomes as the sync seam — an envelope, or `null` for missing,
   * stale, corrupt or unreadable — and the same parser
   * (`readJsonCacheAsync`, the async sibling in `clients/json-cache-read.ts`;
   * there is no second parser). ONE deliberate difference, in the verbose log
   * only: a missing store is reported as `Cache miss: <scanner> — <err>` from
   * the read's own ENOENT instead of a preceding `existsSync` pair, because
   * the pair is half the blocking cost this method exists to remove.
   */
  async readCacheAsync(scanner, cwd, maxAgeMs = DEFAULT_MAX_AGE_MS) {
    const cachePath = path.join(getCacheDir(cwd), `${scanner}.json`);
    const metaPath = path.join(getCacheDir(cwd), `${scanner}.meta.json`);
    const onReadError = (err) => {
      this.log(`Cache miss: ${scanner} \u2014 ${err}`);
    };
    const meta = await readJsonCacheAsync(metaPath, (parsed) => parsed, onReadError);
    if (meta === void 0)
      return null;
    const age = this.freshAgeMs(scanner, meta, maxAgeMs);
    if (age === null)
      return null;
    const data = await readJsonCacheAsync(cachePath, (parsed) => parsed, onReadError);
    if (data === void 0)
      return null;
    this.log(`Cache hit: ${scanner} (age: ${Math.round(age / 1e3)}s)`);
    return { data, meta };
  }
  /**
   * Read a scanner cache entry. Returns null if not found or stale.
   *
   * Synchronous, and therefore unboundable on a hook path — see
   * {@link readCacheAsync}, and the `sync-hook-read` population in
   * `tests/config/hook-await-bounds.test.ts` that counts the callers still
   * on it. #3300 migrates them and deletes this method in its last slice.
   */
  readCache(scanner, cwd, maxAgeMs = DEFAULT_MAX_AGE_MS) {
    const cachePath = path.join(getCacheDir(cwd), `${scanner}.json`);
    const metaPath = path.join(getCacheDir(cwd), `${scanner}.meta.json`);
    if (!fs.existsSync(cachePath) || !fs.existsSync(metaPath)) {
      this.log(`Cache miss: ${scanner} (files don't exist)`);
      return null;
    }
    try {
      const onReadError = (err) => {
        this.log(`Cache read error: ${scanner} \u2014 ${err}`);
      };
      const meta = readJsonCache(metaPath, (parsed) => parsed, onReadError);
      if (meta === void 0)
        return null;
      const age = this.freshAgeMs(scanner, meta, maxAgeMs);
      if (age === null)
        return null;
      const data = readJsonCache(cachePath, (parsed) => parsed, onReadError);
      if (data === void 0)
        return null;
      this.log(`Cache hit: ${scanner} (age: ${Math.round(age / 1e3)}s)`);
      return { data, meta };
    } catch (err) {
      this.log(`Cache read error: ${scanner} \u2014 ${err}`);
      return null;
    }
  }
  /**
   * Write a scanner cache entry.
   */
  writeCache(scanner, data, cwd, extraMeta) {
    const cacheDir = getCacheDir(cwd);
    fs.mkdirSync(cacheDir, { recursive: true });
    const cachePath = path.join(cacheDir, `${scanner}.json`);
    const metaPath = path.join(cacheDir, `${scanner}.meta.json`);
    const meta = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      ...extraMeta
    };
    writeFileAtomic(cachePath, JSON.stringify(data, null, 2), {
      bestEffort: false
    });
    writeFileAtomic(metaPath, JSON.stringify(meta, null, 2), {
      bestEffort: false
    });
    this.log(`Cache written: ${scanner}`);
  }
  /** Inspect a cache without changing the behavior of readCache consumers. */
  inspectCache(scanner, cwd, maxAgeMs = DEFAULT_MAX_AGE_MS) {
    const cachePath = path.join(getCacheDir(cwd), `${scanner}.json`);
    const metaPath = path.join(getCacheDir(cwd), `${scanner}.meta.json`);
    for (const cachePathname of [cachePath, metaPath]) {
      try {
        fs.statSync(cachePathname);
      } catch (err) {
        if (err.code === "ENOENT")
          return "missing";
        return "unreadable";
      }
    }
    try {
      const meta = readJsonCache(metaPath, (parsed) => parsed);
      if (!meta || typeof meta.timestamp !== "string")
        return "malformed";
      const timestamp = new Date(meta.timestamp).getTime();
      if (!Number.isFinite(timestamp))
        return "malformed";
      const age = Date.now() - timestamp;
      if (age < 0 || age > maxAgeMs)
        return age < 0 ? "malformed" : "stale";
      const data = readJsonCache(cachePath, (parsed) => parsed);
      return data === void 0 ? "malformed" : "fresh";
    } catch {
      return "unreadable";
    }
  }
  /**
   * Check if a cache entry is fresh (exists and not expired).
   */
  isCacheFresh(scanner, cwd, maxAgeMs = DEFAULT_MAX_AGE_MS) {
    const metaPath = path.join(getCacheDir(cwd), `${scanner}.meta.json`);
    if (!fs.existsSync(metaPath))
      return false;
    try {
      const meta = readJsonCache(metaPath, (parsed) => parsed);
      if (meta === void 0)
        return false;
      const age = Date.now() - new Date(meta.timestamp).getTime();
      return age <= maxAgeMs;
    } catch {
      return false;
    }
  }
  /**
   * Clear a specific cache entry.
   */
  clearCache(scanner, cwd) {
    const cachePath = path.join(getCacheDir(cwd), `${scanner}.json`);
    const metaPath = path.join(getCacheDir(cwd), `${scanner}.meta.json`);
    for (const p of [cachePath, metaPath]) {
      try {
        fs.unlinkSync(p);
      } catch (err) {
        if (err.code !== "ENOENT") {
          this.log(`Failed to delete ${p}: ${err}`);
        }
      }
    }
  }
  // ---- Turn State ----
  /**
   * Read turn state. Returns default if not found.
   */
  readTurnState(cwd, sessionId) {
    return this.resolveTurnStatePartition(cwd, sessionId).state;
  }
  /**
   * Reserve a secondary's durable partition at turn start. The legacy
   * envelope may still be ownerless before the first write, so the write
   * itself cannot infer that this session is concurrent from persisted state.
   */
  ensureSecondaryTurnStatePartition(cwd, sessionId) {
    const envelope = this.readTurnStateEnvelope(cwd);
    if (envelope.sessions?.[sessionId])
      return;
    const secondary = {
      ...DEFAULT_TURN_STATE,
      files: {},
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
      sessionId,
      owner: {
        kind: "pi",
        id: sessionId,
        pid: process.pid,
        lastSeen: (/* @__PURE__ */ new Date()).toISOString()
      }
    };
    this.writeTurnState({
      ...envelope,
      sessions: { ...envelope.sessions, [sessionId]: secondary }
    }, cwd);
  }
  /** Resolve the persisted primary/secondary turn-state partition. */
  resolveTurnStatePartition(cwd, sessionId) {
    const envelope = this.readTurnStateEnvelope(cwd);
    const persistedSecondary = sessionId === void 0 ? void 0 : envelope.sessions?.[sessionId];
    const primary2 = sessionId === void 0 || envelope.owner === void 0 && persistedSecondary === void 0 || envelope.owner?.kind === "pi" && envelope.owner.id === sessionId;
    const isSecondary = !primary2 && (persistedSecondary !== void 0 || envelope.owner?.kind === "pi" && envelope.owner.pid === process.pid);
    const state = primary2 ? envelope : persistedSecondary ?? {
      ...DEFAULT_TURN_STATE,
      files: {},
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
    };
    return {
      envelope,
      state,
      isSecondary,
      persist: (next) => {
        if (isSecondary && sessionId !== void 0) {
          this.writeTurnState({
            ...envelope,
            sessions: { ...envelope.sessions, [sessionId]: next }
          }, cwd);
        } else
          this.writeTurnState(next, cwd);
      },
      remove: () => {
        if (!isSecondary || sessionId === void 0)
          return;
        const { [sessionId]: _retired, ...remaining } = envelope.sessions ?? {};
        this.writeTurnState({ ...envelope, sessions: remaining }, cwd);
      }
    };
  }
  readTurnStateEnvelope(cwd) {
    const statePath = getTurnStatePath(cwd);
    if (!fs.existsSync(statePath)) {
      return {
        ...DEFAULT_TURN_STATE,
        files: {},
        lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    const state = readJsonCache(statePath, (parsed) => parsed);
    const envelope = state ?? {
      ...DEFAULT_TURN_STATE,
      files: {},
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (!envelope.sessions)
      return envelope;
    const now = Date.now();
    const liveEntries = Object.entries(envelope.sessions).filter(([, partition]) => {
      const updated = Date.parse(partition.lastUpdated ?? "");
      return Number.isFinite(updated) && now - updated <= TURN_SESSION_PARTITION_TTL_MS;
    });
    liveEntries.sort(([, left], [, right]) => Date.parse(right.lastUpdated) - Date.parse(left.lastUpdated));
    const sessions = Object.fromEntries(liveEntries.slice(0, MAX_TURN_SESSION_PARTITIONS));
    if (Object.keys(sessions).length !== Object.keys(envelope.sessions).length) {
      const pruned = { ...envelope, sessions };
      writeFileAtomic(statePath, JSON.stringify(pruned, null, 2));
      return pruned;
    }
    return envelope;
  }
  /**
   * Write turn state.
   */
  writeTurnState(state, cwd) {
    const lensDir = getLensDir(cwd);
    fs.mkdirSync(lensDir, { recursive: true });
    const statePath = getTurnStatePath(cwd);
    state.lastUpdated = (/* @__PURE__ */ new Date()).toISOString();
    writeFileAtomic(statePath, JSON.stringify(state, null, 2));
  }
  /** Return whether a writer may read/write this workspace worklist. */
  getTurnStateAccess(cwd, owner) {
    const state = this.readTurnState(cwd);
    const hasFiles = Object.keys(state.files ?? {}).length > 0;
    if (!state.owner) {
      if (!state.sessionId || state.sessionId === owner.id) {
        if (hasFiles && this.turnStatePredatesSession(state, owner)) {
          return "available";
        }
        return "owned";
      }
      return "available";
    }
    if (state.owner.kind === owner.kind && state.owner.id === owner.id) {
      return "owned";
    }
    if (!hasFiles)
      return "owned";
    return this.isTurnStateOwnerStale(state.owner) ? "available" : "foreign-live";
  }
  /**
   * #2504: true when this worklist was last written before the asking
   * session began. `lastUpdated` is restamped by `writeTurnState` on EVERY
   * write (add/clear/cycle), so a live session's own worklist is always
   * newer than its start; only a carried-over file can be older. An
   * unparseable stamp is treated as stale — a worklist we cannot date is
   * exactly the legacy shape this gate exists to evict.
   */
  turnStatePredatesSession(state, owner) {
    const startedAt = owner.sessionStartedAt;
    if (startedAt === void 0 || !Number.isFinite(startedAt))
      return false;
    const lastUpdated = Date.parse(state.lastUpdated ?? "");
    if (!Number.isFinite(lastUpdated))
      return true;
    return lastUpdated < startedAt;
  }
  isTurnStateOwnerStale(owner) {
    if (owner.pid > 0 && owner.pid !== process.pid) {
      try {
        process.kill(owner.pid, 0);
        return false;
      } catch {
        return true;
      }
    }
    const lastSeen = Date.parse(owner.lastSeen);
    return !Number.isFinite(lastSeen) || Date.now() - lastSeen > TURN_OWNER_STALE_MS;
  }
  /**
   * Add or update a file's modified ranges in turn state.
   * Merges overlapping ranges. `sessionId:null` deliberately preserves the
   * current owner; callers must provide an explicit owner id to claim a stale
   * worklist.
   */
  addModifiedRange(filePath, range, importsChanged, cwd, sessionId, ownerKind = "pi", projectRoot, analysisRootMode) {
    if (analysisRootMode !== void 0 && analysisRootMode !== "session" && analysisRootMode !== "linked-worktree")
      return this.readTurnState(cwd);
    const containmentRoot = projectRoot ?? cwd;
    if (!this.isTurnStatePathWithinRoot(filePath, containmentRoot)) {
      this.log(`turn-state: rejected out-of-project path ${filePath} (project root ${containmentRoot})`);
      return this.readTurnState(cwd);
    }
    const partition = this.resolveTurnStatePartition(cwd, sessionId !== null ? sessionId : void 0);
    const useSessionPartition = partition.isSecondary && ownerKind === "pi" && sessionId != null;
    const state = useSessionPartition ? partition.state : partition.envelope;
    if (sessionId) {
      const owner = {
        kind: ownerKind,
        id: sessionId,
        pid: process.pid,
        lastSeen: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (!useSessionPartition && this.getTurnStateAccess(cwd, owner) === "foreign-live")
        return state;
      state.sessionId = sessionId;
      state.owner = owner;
    }
    const normalizedPath = this.toTurnStateKey(filePath, cwd);
    const existing = state.files[normalizedPath];
    if (existing) {
      existing.modifiedRanges = this.mergeRanges([
        ...existing.modifiedRanges,
        range
      ]);
      existing.importsChanged = existing.importsChanged || importsChanged;
      existing.lastEdit = (/* @__PURE__ */ new Date()).toISOString();
    } else {
      state.files[normalizedPath] = {
        modifiedRanges: [range],
        importsChanged,
        lastEdit: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    if (useSessionPartition)
      partition.persist(state);
    else
      this.writeTurnState(state, cwd);
    return state;
  }
  /**
   * Clear turn state (after turn_end processes it).
   */
  clearTurnState(cwd, owner, sessionId) {
    const partition = this.resolveTurnStatePartition(cwd, sessionId);
    if (sessionId !== void 0 && partition.isSecondary) {
      if (partition.envelope.sessions?.[sessionId])
        partition.remove();
      return true;
    }
    const currentState = partition.envelope;
    const isCurrentOwner = this.getTurnStateAccess(cwd, owner) !== "foreign-live";
    if (!isCurrentOwner && process.pid !== currentState.owner?.pid)
      return false;
    const state = {
      ...DEFAULT_TURN_STATE,
      files: {},
      // fresh object — DEFAULT_TURN_STATE.files can be polluted by addModifiedRange
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
      sessionId: owner.id,
      owner: {
        kind: owner.kind,
        id: owner.id,
        pid: process.pid,
        lastSeen: (/* @__PURE__ */ new Date()).toISOString(),
        sessionStartedAt: owner.sessionStartedAt
      }
    };
    this.writeTurnState(state, cwd);
    return true;
  }
  /**
   * Increment turn cycle counter.
   */
  incrementTurnCycle(cwd, owner, sessionId) {
    const partition = this.resolveTurnStatePartition(cwd, sessionId);
    const state = partition.state;
    if (sessionId !== void 0 && state.owner?.id !== sessionId)
      return state;
    const isCurrentOwner = this.getTurnStateAccess(cwd, owner) !== "foreign-live";
    if (!isCurrentOwner && process.pid !== state.owner?.pid)
      return state;
    state.turnCycles++;
    partition.persist(state);
    return state;
  }
  /**
   * Check if max cycles exceeded.
   */
  isMaxCyclesExceeded(cwd, sessionId) {
    const state = this.readTurnState(cwd, sessionId);
    return state.turnCycles >= state.maxCycles;
  }
  /**
   * Get files that need jscpd re-scan (any edit).
   * Only returns source code files jscpd can meaningfully analyse.
   */
  getFilesForJscpd(cwd, sessionId) {
    const state = this.readTurnState(cwd, sessionId);
    return Object.keys(state.files).filter((f) => /\.(ts|tsx|js|jsx|mjs|cjs|py|go|rs|rb|java|cs|php|cpp|c|h|hpp|swift|kt)$/.test(f));
  }
  /**
   * Get files that need madge re-scan (imports changed).
   */
  getFilesForMadge(cwd, sessionId) {
    const state = this.readTurnState(cwd, sessionId);
    return Object.entries(state.files).filter(([, f]) => f.importsChanged).map(([p]) => p);
  }
  // ---- Utilities ----
  /**
   * Merge overlapping or adjacent ranges.
   */
  mergeRanges(ranges) {
    if (ranges.length === 0)
      return [];
    const sorted = [...ranges].sort((a, b) => a.start - b.start);
    const merged = [sorted[0]];
    for (const current of sorted.slice(1)) {
      const last = merged[merged.length - 1];
      if (current.start <= last.end + 1) {
        last.end = Math.max(last.end, current.end);
      } else {
        merged.push({ ...current });
      }
    }
    return merged;
  }
  /**
   * Check if a line falls within any modified range.
   */
  isLineInModifiedRange(line, ranges) {
    return ranges.some((r) => r.start <= line && line <= r.end);
  }
};

// dist/clients/diagnostic-logger.js
import * as path2 from "node:path";
function getLogDir() {
  return path2.join(getGlobalPiLensLogDir(), "logs");
}
function getLogFile() {
  const date = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  return path2.join(getLogDir(), `${date}.jsonl`);
}
var _logger = null;
function getDiagnosticLogger() {
  if (!_logger) {
    _logger = createDiagnosticLogger();
  }
  return _logger;
}
function createDiagnosticLogger() {
  const writer2 = createNdjsonLogger({
    filePath: () => getLogFile(),
    maxBytes: getMaxLogSizeMB() * 1024 * 1024,
    backupPath: () => getLogFile().replace(/\.jsonl$/, ".rotated.jsonl")
  });
  return {
    log(entry) {
      if (isTestMode()) {
        return;
      }
      writer2.log(entry);
    },
    logCaught(d, context, shownInline = false) {
      this.log({
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        tool: d.tool || "unknown",
        ruleId: d.rule || d.id || "unknown",
        severity: d.severity || "warning",
        language: d.language || "unknown",
        filePath: d.filePath,
        line: d.line || 1,
        column: d.column || 1,
        message: d.message || "",
        caughtByPipeline: true,
        shownInline,
        autoFixed: false,
        shownToAgent: shownInline,
        agentFixed: false,
        unresolved: true,
        model: context.model,
        sessionId: context.sessionId,
        turnIndex: context.turnIndex,
        writeIndex: context.writeIndex
      });
    },
    async flush() {
      await writer2.flush();
    }
  };
}

// dist/clients/dispatch/dispatcher.js
import * as fs3 from "node:fs";
import * as path4 from "node:path";

// dist/clients/dispatch/rule-id-normalize.js
import * as fs2 from "node:fs";
import * as path3 from "node:path";
function deriveRuleIdLanguageSuffixes(ruleRoot) {
  const suffixes = /* @__PURE__ */ new Set();
  const visit = (dir) => {
    let entries;
    try {
      entries = fs2.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const entryPath = path3.join(dir, entry.name);
      if (entry.isDirectory())
        visit(entryPath);
      else {
        const match = /-([a-z0-9]+)\.ya?ml$/i.exec(entry.name);
        if (match)
          suffixes.add(match[1].toLowerCase());
      }
    }
  };
  visit(ruleRoot);
  return suffixes;
}
var bundledCodeRabbitRules = getAstGrepRuleSources().find((source) => source.origin === "bundled" && source.tier === "secondary");
var RULE_ID_LANGUAGE_SUFFIXES = /* @__PURE__ */ new Set(["js"]);
if (bundledCodeRabbitRules) {
  for (const suffix of deriveRuleIdLanguageSuffixes(bundledCodeRabbitRules.dir)) {
    RULE_ID_LANGUAGE_SUFFIXES.add(suffix);
  }
}
var LSP_SOURCE_PREFIXES = ["ast-grep:", "shuck:"];
function normalizeRuleId(ruleId) {
  let normalized = ruleId;
  for (const prefix of LSP_SOURCE_PREFIXES) {
    if (normalized.startsWith(prefix)) {
      normalized = normalized.slice(prefix.length);
      break;
    }
  }
  for (const suffix of RULE_ID_LANGUAGE_SUFFIXES) {
    if (normalized.endsWith(`-${suffix}`)) {
      normalized = normalized.slice(0, -(suffix.length + 1));
    }
  }
  return normalized;
}

// dist/clients/dispatch/inline-suppressions.js
var SUPPRESS_RE = /(?:\/\/|#)\s*pi-lens-ignore:\s*(.+)/;
var TRAILING_REASON_RE = /(?:\s+--\s+|\s+—\s+|:\s+).+$/u;
function splitInlineSuppressionPayload(payload) {
  const reasonMatch = TRAILING_REASON_RE.exec(payload);
  const trailingReason = reasonMatch?.[0];
  if (reasonMatch === null || trailingReason === void 0) {
    return { ruleList: payload, trailingReason: "" };
  }
  return {
    ruleList: payload.slice(0, reasonMatch.index),
    trailingReason
  };
}
function parseInlineSuppressionRuleIds(payload) {
  const { ruleList } = splitInlineSuppressionPayload(payload);
  return ruleList.split(",").map((rule) => rule.trim()).filter(Boolean);
}
function applyInlineSuppressions(diagnostics, content) {
  if (!content || !diagnostics.length)
    return diagnostics;
  const suppressed = /* @__PURE__ */ new Set();
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = SUPPRESS_RE.exec(lines[i]);
    if (!m)
      continue;
    const payload = m[1];
    if (payload === void 0)
      continue;
    const rules2 = parseInlineSuppressionRuleIds(payload);
    const suppressedLine = i + 1;
    const nextLine = i + 2;
    for (const ruleId of rules2) {
      for (const key2 of /* @__PURE__ */ new Set([ruleId, normalizeRuleId(ruleId)])) {
        suppressed.add(`${suppressedLine}:${key2}`);
        suppressed.add(`${nextLine}:${key2}`);
      }
    }
  }
  if (suppressed.size === 0)
    return diagnostics;
  return diagnostics.filter((d) => {
    const rawId = d.rule ?? d.id ?? "";
    const line = d.line ?? 1;
    if (suppressed.has(`${line}:${rawId}`))
      return false;
    const normId = normalizeRuleId(rawId);
    return normId === rawId || !suppressed.has(`${line}:${normId}`);
  });
}

// dist/clients/dispatch/plan.js
function primary(kind) {
  const group = getPrimaryDispatchGroup(kind, true);
  if (!group) {
    throw new Error(`Missing primary dispatch group for ${kind}`);
  }
  return group;
}
var LANGUAGE_CAPABILITY_MATRIX = {
  jsts: {
    name: "JavaScript/TypeScript Linting",
    capabilities: ["types", "security", "smells", "format", "lint"],
    writeGroups: [
      primary("jsts"),
      { mode: "all", runnerIds: ["tree-sitter"], filterKinds: ["jsts"] },
      { mode: "all", runnerIds: ["fact-rules"], filterKinds: ["jsts"] },
      { mode: "all", runnerIds: ["ast-grep-napi"], filterKinds: ["jsts"] },
      {
        mode: "fallback",
        runnerIds: ["eslint", "oxlint", "biome-check-json"],
        filterKinds: ["jsts"]
      }
    ]
  },
  python: {
    name: "Python Linting",
    capabilities: ["types", "lint", "smells"],
    writeGroups: [
      primary("python"),
      { mode: "fallback", runnerIds: ["ruff-lint"], filterKinds: ["python"] },
      { mode: "fallback", runnerIds: ["mypy"], filterKinds: ["python"] },
      { mode: "all", runnerIds: ["tree-sitter"], filterKinds: ["python"] },
      { mode: "all", runnerIds: ["fact-rules"], filterKinds: ["python"] }
    ]
  },
  go: {
    name: "Go Linting",
    capabilities: ["types", "lint", "smells"],
    writeGroups: [
      primary("go"),
      { mode: "fallback", runnerIds: ["golangci-lint"], filterKinds: ["go"] },
      { mode: "all", runnerIds: ["tree-sitter"], filterKinds: ["go"] },
      { mode: "all", runnerIds: ["fact-rules"], filterKinds: ["go"] }
    ]
  },
  rust: {
    name: "Rust Linting",
    capabilities: ["types", "lint", "smells"],
    writeGroups: [
      primary("rust"),
      { mode: "all", runnerIds: ["tree-sitter"], filterKinds: ["rust"] },
      { mode: "all", runnerIds: ["fact-rules"], filterKinds: ["rust"] }
    ]
  },
  ruby: {
    name: "Ruby Linting",
    capabilities: ["types", "lint", "smells"],
    writeGroups: [
      primary("ruby"),
      { mode: "fallback", runnerIds: ["rubocop"], filterKinds: ["ruby"] },
      { mode: "all", runnerIds: ["tree-sitter"], filterKinds: ["ruby"] },
      { mode: "all", runnerIds: ["fact-rules"], filterKinds: ["ruby"] }
    ]
  },
  cxx: {
    name: "C/C++ Linting",
    capabilities: ["types", "lint", "smells"],
    writeGroups: [
      primary("cxx"),
      { mode: "all", runnerIds: ["tree-sitter"], filterKinds: ["cxx"] }
    ]
  },
  cmake: {
    name: "CMake Processing",
    capabilities: ["lint"],
    writeGroups: [
      primary("cmake"),
      { mode: "all", runnerIds: ["fact-rules"], filterKinds: ["cmake"] }
    ]
  },
  fish: {
    name: "Fish Script Formatting",
    capabilities: ["format"],
    writeGroups: [primary("fish")]
  },
  shell: {
    name: "Shell Script Linting",
    capabilities: ["lint", "security", "format"],
    writeGroups: [
      primary("shell"),
      { mode: "all", runnerIds: ["shfmt"], filterKinds: ["shell"] },
      { mode: "all", runnerIds: ["fact-rules"], filterKinds: ["shell"] }
    ]
  },
  json: {
    name: "JSON Processing",
    capabilities: ["format", "lint"],
    writeGroups: [
      primary("json"),
      { mode: "all", runnerIds: ["trivy-config"], filterKinds: ["json"] }
    ]
  },
  markdown: {
    name: "Markdown Processing",
    capabilities: ["docs", "format", "lint"],
    writeGroups: [
      primary("markdown"),
      { mode: "all", runnerIds: ["markdownlint"], filterKinds: ["markdown"] }
    ]
  },
  css: {
    name: "CSS Processing",
    capabilities: ["format", "lint"],
    writeGroups: [
      primary("css"),
      { mode: "all", runnerIds: ["tree-sitter"], filterKinds: ["css"] },
      { mode: "all", runnerIds: ["ast-grep-napi"], filterKinds: ["css"] }
    ]
  },
  yaml: {
    name: "YAML Processing",
    capabilities: ["format", "lint"],
    writeGroups: [
      primary("yaml"),
      { mode: "all", runnerIds: ["actionlint"], filterKinds: ["yaml"] }
    ]
  },
  "helm-template": {
    name: "Helm Template Linting",
    capabilities: ["lint"],
    writeGroups: [primary("helm-template")]
  },
  sql: {
    name: "SQL Processing",
    capabilities: ["format", "lint"],
    writeGroups: [primary("sql")]
  },
  html: {
    name: "HTML Linting",
    capabilities: ["lint"],
    writeGroups: [
      primary("html"),
      { mode: "all", runnerIds: ["ast-grep-napi"], filterKinds: ["html"] }
    ]
  },
  docker: {
    name: "Dockerfile Linting",
    capabilities: ["lint"],
    writeGroups: [primary("docker")]
  },
  php: {
    name: "PHP Linting",
    capabilities: ["types", "lint"],
    writeGroups: [
      primary("php"),
      { mode: "all", runnerIds: ["tree-sitter"], filterKinds: ["php"] }
    ]
  },
  powershell: {
    name: "PowerShell Linting",
    capabilities: ["lint"],
    writeGroups: [primary("powershell")]
  },
  prisma: {
    name: "Prisma Schema Linting",
    capabilities: ["types", "lint"],
    writeGroups: [primary("prisma")]
  },
  csharp: {
    name: "C# Linting",
    capabilities: ["types", "lint"],
    writeGroups: [
      primary("csharp"),
      { mode: "all", runnerIds: ["tree-sitter"], filterKinds: ["csharp"] }
    ]
  },
  fsharp: {
    name: "F# Linting",
    capabilities: ["types", "lint"],
    writeGroups: [primary("fsharp")]
  },
  java: {
    name: "Java Linting",
    capabilities: ["types", "lint"],
    writeGroups: [primary("java")]
  },
  kotlin: {
    name: "Kotlin Linting",
    capabilities: ["types", "lint", "format", "smells"],
    writeGroups: [
      primary("kotlin"),
      { mode: "fallback", runnerIds: ["detekt"], filterKinds: ["kotlin"] }
    ]
  },
  lean: {
    name: "Lean 4 Diagnostics",
    capabilities: ["types", "lint"],
    writeGroups: [primary("lean")]
  },
  swift: {
    name: "Swift Linting",
    capabilities: ["types", "lint"],
    writeGroups: [primary("swift")]
  },
  dart: {
    name: "Dart Linting",
    capabilities: ["types", "lint"],
    writeGroups: [primary("dart")]
  },
  lua: {
    name: "Lua Linting",
    capabilities: ["types", "lint"],
    writeGroups: [primary("lua")]
  },
  zig: {
    name: "Zig Linting",
    capabilities: ["types", "lint"],
    writeGroups: [primary("zig")]
  },
  haskell: {
    name: "Haskell Linting",
    capabilities: ["types", "lint"],
    writeGroups: [primary("haskell")]
  },
  elixir: {
    name: "Elixir Linting",
    capabilities: ["types", "lint"],
    writeGroups: [primary("elixir")]
  },
  gleam: {
    name: "Gleam Linting",
    capabilities: ["types", "lint"],
    writeGroups: [primary("gleam")]
  },
  ocaml: {
    name: "OCaml Linting",
    capabilities: ["types", "lint"],
    writeGroups: [primary("ocaml")]
  },
  clojure: {
    name: "Clojure Linting",
    capabilities: ["types", "lint"],
    writeGroups: [primary("clojure")]
  },
  cue: {
    name: "CUE Linting",
    capabilities: ["types", "lint"],
    writeGroups: [primary("cue")]
  },
  terraform: {
    name: "Terraform Linting",
    capabilities: ["types", "lint", "security"],
    writeGroups: [primary("terraform")]
  },
  terragrunt: {
    name: "Terragrunt Linting",
    capabilities: ["lint", "format"],
    writeGroups: [primary("terragrunt")]
  },
  nix: {
    name: "Nix Linting",
    capabilities: ["types", "lint"],
    writeGroups: [primary("nix")]
  },
  toml: {
    name: "TOML Linting",
    capabilities: ["lint", "format"],
    writeGroups: [primary("toml")]
  }
};
function toWritePlan(entry) {
  return {
    name: entry.name,
    capabilities: entry.capabilities,
    groups: [...entry.writeGroups]
  };
}
var TOOL_PLANS = Object.fromEntries(Object.entries(LANGUAGE_CAPABILITY_MATRIX).map(([kind, entry]) => [
  kind,
  toWritePlan(entry)
]));
function getToolPlan(kind) {
  return TOOL_PLANS[kind];
}

// dist/clients/dispatch/collect-later-tier.js
var COLLECT_LATER_THRESHOLD_MS = 5e3;
var slowRunners = /* @__PURE__ */ new Map();
function key(projectRoot, runnerId) {
  return `${normalizeMapKey(projectRoot)}\0${runnerId}`;
}
function classifyObservedRunner(projectRoot, runnerId) {
  return slowRunners.has(key(projectRoot, runnerId)) ? "collect-later" : "inline";
}
function observeRunnerLatency(options) {
  const normalizedProjectRoot = normalizeMapKey(options.projectRoot);
  const runnerKey = key(normalizedProjectRoot, options.runnerId);
  if (options.timedOut === true || options.durationMs > COLLECT_LATER_THRESHOLD_MS) {
    slowRunners.set(runnerKey, {
      projectRoot: normalizedProjectRoot,
      runnerId: options.runnerId
    });
    return "collect-later";
  }
  slowRunners.delete(runnerKey);
  return "inline";
}
function resetObservedRunnerLatency() {
  slowRunners.clear();
}

// dist/clients/dispatch/pending-runner-findings.js
var pending = [];
function settledSnapshot(entry) {
  return {
    filePath: entry.filePath,
    cwd: entry.cwd,
    projectRoot: entry.projectRoot,
    runnerId: entry.runnerId,
    markedAtMs: entry.markedAtMs,
    writeIndex: entry.writeIndex,
    // #3758/#3813: carry the producer's handle so a requeued snapshot keeps
    // the scope that owned it, and the gate's peek can fence with it.
    session: entry.session,
    sessionId: entry.sessionId,
    result: entry.result
  };
}
var MAX_PENDING_RUNNER_FINDINGS = 50;
function ownedByLiveSession(entry, site) {
  if (entry.session === void 0)
    return true;
  return entry.session.guardedWrite(`${site}:${entry.runnerId}:${entry.filePath}`, () => true) !== void 0;
}
function deferRunnerFindings(entry) {
  const { session, sessionId, ...owned } = entry;
  if (session !== void 0 && session.guardedWrite(`${entry.runnerId}:${entry.filePath}`, () => true) === void 0) {
    void entry.promise.catch(() => void 0);
    return;
  }
  const tracked = {
    ...owned,
    session,
    sessionId,
    settled: false
  };
  void tracked.promise.then((result) => {
    tracked.result = result;
    tracked.settled = true;
  }, (error) => {
    tracked.result = {
      status: "failed",
      diagnostics: [],
      semantic: "warning",
      failureKind: "exception",
      failureMessage: String(error).slice(0, 200)
    };
    tracked.settled = true;
  });
  track(tracked);
}
function requeueRunnerFindings(entry) {
  const { result, ...owned } = entry;
  track({
    ...owned,
    session: entry.session,
    sessionId: entry.sessionId,
    promise: Promise.resolve(result),
    settled: true,
    result
  });
}
function track(tracked) {
  pending.push(tracked);
  if (pending.length > MAX_PENDING_RUNNER_FINDINGS) {
    const evicted = pending.shift();
    if (evicted) {
      incrementDegradationCount({
        kind: "runner-findings-evicted",
        subject: `${evicted.runnerId}:${evicted.filePath}`,
        reason: `pending runner cap ${MAX_PENDING_RUNNER_FINDINGS}`
      });
    }
  }
}
async function drainPendingRunnerFindings(maxWaitMs = 2e3, currentSession, currentSessionId) {
  if (pending.length === 0)
    return [];
  const current = pending.splice(0, pending.length);
  const results = [];
  if (maxWaitMs === 0)
    await Promise.resolve();
  if (maxWaitMs > 0 && current.some((entry) => !entry.settled)) {
    await new Promise((resolve44) => {
      const timer = setTimeout(resolve44, maxWaitMs);
      timer.unref?.();
    });
  }
  for (const entry of current) {
    if (!ownedByLiveSession(entry, "turn-end"))
      continue;
    if (currentSessionId !== void 0 && entry.sessionId !== void 0 && entry.sessionId !== currentSessionId) {
      pending.push(entry);
      continue;
    }
    if (currentSession !== void 0 && entry.session !== void 0 && entry.session.generation !== currentSession.generation) {
      pending.push(entry);
      continue;
    }
    if (entry.settled && entry.result) {
      results.push(settledSnapshot(entry));
    } else {
      pending.push(entry);
    }
  }
  return results;
}
function dropStaleRunnerFindings(entry) {
  if (!entry.result)
    return;
  incrementDegradationCount({
    kind: "runner-findings-stale",
    subject: `${entry.runnerId}:${entry.filePath}`,
    reason: "completed result was older than the latest file edit"
  });
}
function resetPendingRunnerFindings() {
  pending.length = 0;
}
function pendingRunnerFindingsSize() {
  return pending.length;
}

// dist/clients/dispatch/adopted-root-runners.js
var ADOPTED_ROOT_RUNNER_ALLOWLIST = [
  "fish-indent",
  "php-lint"
];
var ADMITTED = new Set(ADOPTED_ROOT_RUNNER_ALLOWLIST);
function isAdoptedRootRunnerAdmitted(runnerId) {
  return ADMITTED.has(runnerId);
}
function filterGroupsForAdoptedRoot(groups) {
  const filtered = [];
  for (const group of groups) {
    const runnerIds = [];
    for (const runnerId of group.runnerIds) {
      if (isAdoptedRootRunnerAdmitted(runnerId))
        runnerIds.push(runnerId);
    }
    if (runnerIds.length === 0)
      continue;
    filtered.push(runnerIds.length === group.runnerIds.length ? group : { ...group, runnerIds });
  }
  return filtered;
}

// dist/clients/dispatch/rule-policy.js
function resolvedRulePolicyMap(root) {
  const resolved = resolvePiLensConfig({
    cwd: root,
    globalDir: getGlobalPiLensDir(),
    globalConfigPath: getPiLensGlobalConfigPath()
  });
  return rulePolicyMapFromConfig(resolved.value.rules);
}
function ruleIgnoredForPath(ruleId, filePath, root, policyMap) {
  const normalized = normalizeRuleId(ruleId);
  const patterns = [];
  for (const [configuredId, entry] of Object.entries(policyMap ?? {})) {
    if (normalizeRuleId(configuredId) !== normalized || !entry?.ignorePaths)
      continue;
    patterns.push(...entry.ignorePaths);
  }
  if (patterns.length === 0)
    return false;
  return isRuleIgnoredForPath(filePath, root, patterns);
}
function evaluateRulePolicy(ruleId, policyMap) {
  if (!policyMap)
    return { dropped: false };
  const raw = ruleId || "";
  const norm = normalizeRuleId(raw);
  if (scanList(policyMap, (e) => e.disable, raw, norm).matched) {
    return { dropped: true };
  }
  const select = scanList(policyMap, (e) => e.select, raw, norm);
  return { dropped: select.sawEntry && !select.matched };
}
function scanList(policyMap, pick, raw, norm) {
  let sawEntry = false;
  for (const entry of Object.values(policyMap)) {
    for (const candidate of (entry && pick(entry)) ?? []) {
      sawEntry = true;
      if (matchesRule(candidate, raw, norm))
        return { matched: true, sawEntry };
    }
  }
  return { matched: false, sawEntry };
}
function matchesRule(entry, raw, normalized) {
  if (entry === raw)
    return true;
  return normalizeRuleId(entry) === normalized;
}
function applyRulePolicy(diagnostics, policyMap, options) {
  if (!policyMap)
    return diagnostics;
  let hasFilter = false;
  for (const rawEntry of Object.values(policyMap)) {
    if (!rawEntry || typeof rawEntry !== "object" || Array.isArray(rawEntry)) {
      continue;
    }
    const entry = rawEntry;
    if ((entry.disable?.length ?? 0) > 0 || (entry.select?.length ?? 0) > 0 || (entry.ignorePaths?.length ?? 0) > 0) {
      hasFilter = true;
      break;
    }
  }
  if (!hasFilter)
    return diagnostics;
  return diagnostics.filter((d) => {
    const ruleId = d.rule ?? d.code;
    if (!ruleId)
      return true;
    const filePath = d.filePath ?? options.filePath;
    if (filePath && ruleIgnoredForPath(ruleId, filePath, options.root, policyMap))
      return false;
    const { dropped } = evaluateRulePolicy(ruleId, policyMap);
    return !dropped;
  });
}
function rulePolicyMapFromConfig(rules2) {
  if (!rules2)
    return void 0;
  let built;
  for (const [key2, rawEntry] of Object.entries(rules2)) {
    if (!rawEntry || typeof rawEntry !== "object" || Array.isArray(rawEntry)) {
      continue;
    }
    const entry = rawEntry;
    const hasDisable = (entry.disable?.length ?? 0) > 0;
    const hasSelect = (entry.select?.length ?? 0) > 0;
    const hasIgnorePaths = (entry.ignorePaths?.length ?? 0) > 0;
    if (!hasDisable && !hasSelect && !hasIgnorePaths)
      continue;
    built ??= {};
    built[key2] = {
      ...hasDisable ? { disable: entry.disable } : {},
      ...hasSelect ? { select: entry.select } : {},
      ...hasIgnorePaths ? { ignorePaths: entry.ignorePaths } : {}
    };
  }
  return built;
}

// dist/clients/dispatch/tool-profile.js
var DEFAULT_TOOL_PROFILE = {
  dedupPriority: 50,
  lintLike: false
};
var TOOL_PROFILE_MAP = {
  "tree-sitter:silent-error": { dedupPriority: 200, lintLike: false },
  lsp: { dedupPriority: 120, lintLike: false },
  eslint: { dedupPriority: 110, lintLike: true },
  biome: { dedupPriority: 100, lintLike: true },
  "biome-check-json": { dedupPriority: 100, lintLike: true },
  "tree-sitter": { dedupPriority: 90, lintLike: false },
  "ast-grep-napi": { dedupPriority: 80, lintLike: false },
  "ast-grep": { dedupPriority: 80, lintLike: false },
  "ruff-lint": { dedupPriority: 95, lintLike: true },
  oxlint: { dedupPriority: 95, lintLike: true },
  rubocop: { dedupPriority: 95, lintLike: true },
  "go-vet": { dedupPriority: 95, lintLike: true },
  "golangci-lint": { dedupPriority: 95, lintLike: true },
  "rust-clippy": { dedupPriority: 95, lintLike: true },
  shellcheck: { dedupPriority: 95, lintLike: true },
  opengrep: { dedupPriority: 105, lintLike: false },
  "trivy-config": { dedupPriority: 105, lintLike: false }
};
function getToolProfile(tool, defectClass) {
  const t = tool.toLowerCase();
  if (defectClass === "silent-error" && t === "tree-sitter") {
    return TOOL_PROFILE_MAP["tree-sitter:silent-error"];
  }
  return TOOL_PROFILE_MAP[t] ?? DEFAULT_TOOL_PROFILE;
}

// dist/clients/dispatch/utils/format-utils.js
var EMOJI = {
  blocking: "\u{1F534}",
  warning: "\u{1F7E1}",
  fixed: "\u2705",
  info: "\u2139\uFE0F",
  silent: "\u{1F4CA}",
  none: ""
};
function formatDiagnostic(d) {
  const line = d.line ? `L${d.line}: ` : "";
  const indented = d.message.split("\n").join("\n  ");
  const fix = d.fixSuggestion ? `
    \u{1F4A1} Fix: ${d.fixSuggestion}` : "";
  return `  ${line}${indented}${fix}`;
}
var DELTA_UNUSED_PROMOTION_NOTE = "new in this edit \u2192 blocks in delta mode; pre-existing unused declarations only advise.";
function formatPromotionNotes(diagnostics) {
  const notes = /* @__PURE__ */ new Set();
  for (const d of diagnostics) {
    if (d.promotionNote)
      notes.add(d.promotionNote);
  }
  if (notes.size === 0)
    return "";
  return [...notes].map((note) => `  \u2139\uFE0F ${note}
`).join("");
}
function formatDiagnostics(diagnostics, semantic, maxDisplay = 10) {
  if (diagnostics.length === 0)
    return "";
  const emoji = EMOJI[semantic] ?? EMOJI.warning;
  let output = "";
  if (semantic === "blocking") {
    output += `
${emoji} STOP \u2014 ${diagnostics.length} issue(s) must be fixed:
`;
  } else if (semantic === "warning") {
    output += `
${emoji} ${diagnostics.length} warning(s):
`;
  } else if (semantic === "fixed") {
    output += `
${emoji} Auto-fixed ${diagnostics.length} issue(s):
`;
  }
  for (const d of diagnostics.slice(0, maxDisplay)) {
    output += `${formatDiagnostic(d)}
`;
  }
  if (diagnostics.length > maxDisplay) {
    output += `  ... and ${diagnostics.length - maxDisplay} more
`;
  }
  output += formatPromotionNotes(diagnostics);
  return output;
}

// dist/clients/dispatch/dispatcher.js
var dispatcherProbeFlights = createAvailabilityProbeFlight({ generation: () => getDispatchAvailabilityGeneration() });
var RunnerRegistry = class {
  runners = /* @__PURE__ */ new Map();
  register(runner) {
    if (this.runners.has(runner.id))
      return;
    this.runners.set(runner.id, runner);
    registerRunnerId(runner.id);
  }
  get(id) {
    return this.runners.get(id);
  }
  getForKind(kind, filePath) {
    const matching = [];
    const isTest = filePath ? isTestFile(filePath) : false;
    for (const runner of this.runners.values()) {
      if (isTest && runner.skipTestFiles)
        continue;
      if (runnerAppliesToKind(runner, kind)) {
        matching.push(runner);
      }
    }
    return matching.sort((a, b) => a.priority - b.priority);
  }
  list() {
    return Array.from(this.runners.values());
  }
  clear() {
    this.runners.clear();
  }
};
function runnerAppliesToKind(runner, kind) {
  return runner.appliesTo.length === 0 || kind !== void 0 && runner.appliesTo.includes(kind);
}
function normalizeCacheKey(cmd) {
  const normalized = cmd.replace(/\.(cmd|exe)$/i, "").toLowerCase();
  return `session.toolCache.${normalized}`;
}
var TOOL_PROBE_TIMEOUT_MS = 5e3;
function transientRetryKey(command) {
  return `${normalizeCacheKey(command)}.retryAt`;
}
function transientAttemptsKey(command) {
  return `${normalizeCacheKey(command)}.transientAttempts`;
}
async function checkToolAvailability(command, facts) {
  const key2 = normalizeCacheKey(command);
  const cached = facts.getSessionFact(key2);
  if (cached !== void 0) {
    return cached;
  }
  const retryAt = facts.getSessionFact(transientRetryKey(command));
  if (retryAt !== void 0 && Date.now() < retryAt)
    return false;
  if (!await isSpawnableCommand(command)) {
    facts.setSessionFact(key2, false);
    return false;
  }
  try {
    const sampler = startHostStallSampler();
    const startedAt = Date.now();
    let result;
    let hostStallMs;
    let probeJoined = false;
    try {
      const shared = dispatcherProbeFlights.run(`dispatcher:${key2}`, () => probeToolAsync(command, ["--version"], {
        timeout: TOOL_PROBE_TIMEOUT_MS
      }));
      probeJoined = shared.joined;
      result = await shared.promise;
    } finally {
      hostStallMs = sampler.stop();
    }
    const elapsedMs = Date.now() - startedAt;
    recordAvailabilityProbeOverrun(command, key2, elapsedMs, TOOL_PROBE_TIMEOUT_MS, result.failure);
    if (result.status === 0) {
      facts.setSessionFact(key2, true);
      facts.setSessionFact(transientRetryKey(command), 0);
      facts.setSessionFact(transientAttemptsKey(command), 0);
      logAvailabilityDecision({
        tool: command,
        verdict: "available",
        outcome: "success",
        cause: "ok",
        elapsedMs,
        latched: true,
        classifiedBy: probeJoined ? "joined" : "probe",
        hostStallMs,
        budgetMs: TOOL_PROBE_TIMEOUT_MS
      });
      return true;
    }
    const { outcome, cause, evidence } = classifyProbeFailure(result, {
      hostStallMs,
      unclassifiedFailureOutcome: "missing"
    });
    let retryAfterMs;
    if (outcome === "transient") {
      const attempts = (facts.getSessionFact(transientAttemptsKey(command)) ?? 0) + 1;
      facts.setSessionFact(transientAttemptsKey(command), attempts);
      retryAfterMs = transientRetryDelayMs(attempts, cause);
      facts.setSessionFact(transientRetryKey(command), Date.now() + retryAfterMs);
    } else {
      facts.setSessionFact(key2, false);
      facts.setSessionFact(transientAttemptsKey(command), 0);
    }
    logAvailabilityDecision({
      tool: command,
      verdict: "unavailable",
      outcome,
      cause,
      elapsedMs,
      latched: outcome !== "transient",
      hostStallMs,
      ...retryAfterMs !== void 0 && { retryAfterMs },
      budgetMs: TOOL_PROBE_TIMEOUT_MS,
      classifiedBy: probeJoined ? "joined" : "probe",
      evidence
    });
    return false;
  } catch {
    facts.setSessionFact(key2, false);
    return false;
  }
}
function readFilePrefix(filePath, maxBytes = 4096) {
  let fd;
  try {
    fd = fs3.openSync(filePath, "r");
    const buffer = Buffer.alloc(maxBytes);
    const bytesRead = fs3.readSync(fd, buffer, 0, maxBytes, 0);
    return buffer.subarray(0, bytesRead).toString("utf8");
  } catch {
    return void 0;
  } finally {
    if (fd !== void 0) {
      try {
        fs3.closeSync(fd);
      } catch {
      }
    }
  }
}
function createDispatchContext(filePath, cwd, pi, facts, blockingOnly, modifiedRanges, projectRoot, writeIndex, telemetryModel, telemetryProvider, sessionGeneration, sessionId, analysisRootMode) {
  const absoluteFilePath = resolveRunnerPath(cwd, filePath);
  const normalizedProjectRoot = normalizeMapKey(path4.resolve(projectRoot ?? cwd));
  const normalizedCwd = normalizeMapKey(resolveLanguageRootForFile(absoluteFilePath, cwd));
  const normalizedFilePath = normalizeMapKey(absoluteFilePath);
  const kindFilePath = !isWindowsPath(filePath) && filePath.includes("\\") ? path4.resolve(cwd, filePath) : absoluteFilePath;
  const kind = detectFileKind(kindFilePath);
  const contentPrefix = readFilePrefix(normalizedFilePath);
  const fileRole = detectFileRole(normalizedFilePath, contentPrefix);
  const generatedDetail = fileRole === "generated" ? classifyGeneratedOrArtifactDetailed(normalizedFilePath, {
    content: contentPrefix,
    includeDeclarations: false
  }) : void 0;
  const projectConfig = loadPiLensProjectConfig(normalizedCwd);
  const rulePolicy = resolvedRulePolicyMap(normalizedProjectRoot);
  return {
    filePath: normalizedFilePath,
    projectRoot: normalizedProjectRoot,
    cwd: normalizedCwd,
    kind,
    fileRole,
    analysisRootMode,
    generatedEvidence: generatedDetail?.evidence,
    generatedLineShapeMean: generatedDetail?.lineShapeMean,
    pi,
    autofix: false,
    deltaMode: !pi.getFlag("no-delta"),
    facts,
    projectConfig,
    rulePolicy,
    blockingOnly,
    modifiedRanges,
    writeIndex,
    sessionGeneration,
    sessionId,
    telemetryModel,
    telemetryProvider,
    toolCwdMemo: {},
    async hasTool(command) {
      return checkToolAvailability(command, facts);
    },
    log(message, level) {
      logExtension({
        subsystem: "dispatch",
        // exactOptionalPropertyTypes: an omitted level must stay omitted.
        ...level !== void 0 && { level },
        message,
        metadata: { filePath: normalizedFilePath, kind }
      });
    }
  };
}
function filterDelta(after, before, keyFn) {
  const beforeSet = new Set((before ?? []).map(keyFn));
  const afterSet = new Set(after.map(keyFn));
  const fixed = (before ?? []).filter((d) => !afterSet.has(keyFn(d)));
  const newItems = after.filter((d) => !beforeSet.has(keyFn(d)));
  return { new: newItems, fixed };
}
function semanticRank(semantic) {
  if (semantic === "blocking")
    return 4;
  if (semantic === "warning")
    return 3;
  if (semantic === "fixed")
    return 2;
  if (semantic === "silent")
    return 1;
  return 0;
}
function toolPriority(tool, defectClass) {
  return getToolProfile(tool, defectClass).dedupPriority;
}
function dedupeOverlappingDiagnostics(diagnostics) {
  const byKey = /* @__PURE__ */ new Map();
  for (const d of diagnostics) {
    const defectClass = d.defectClass ?? classifyDiagnostic(d);
    const line = d.line ?? 1;
    const column = d.column ?? 1;
    const ruleKey = d.rule || d.id || "unknown";
    const key2 = `${d.filePath}:${line}:${column}:${defectClass}:${ruleKey}`;
    const current = byKey.get(key2);
    if (!current) {
      byKey.set(key2, { ...d, defectClass });
      continue;
    }
    const currScore = semanticRank(current.semantic) * 100 + toolPriority(current.tool, defectClass);
    const nextScore = semanticRank(d.semantic) * 100 + toolPriority(d.tool, defectClass);
    if (nextScore > currScore) {
      byKey.set(key2, { ...d, defectClass });
    }
  }
  return [...byKey.values()];
}
function suppressLintOverlapsWithLsp(diagnostics) {
  const lspBySpanClass = /* @__PURE__ */ new Set();
  const lspByLine = /* @__PURE__ */ new Set();
  const isLintTool = (tool) => {
    return getToolProfile(tool).lintLike;
  };
  for (const d of diagnostics) {
    if (d.tool !== "lsp")
      continue;
    const line = d.line ?? 1;
    const defectClass = d.defectClass ?? classifyDiagnostic(d);
    lspBySpanClass.add(`${d.filePath}:${line}:${defectClass}`);
    lspByLine.add(`${d.filePath}:${line}`);
  }
  if (lspByLine.size === 0)
    return diagnostics;
  return diagnostics.filter((d) => {
    if (d.tool === "lsp")
      return true;
    if (!isLintTool(d.tool))
      return true;
    if (d.semantic === "blocking" || d.severity === "error")
      return true;
    const line = d.line ?? 1;
    const defectClass = d.defectClass ?? classifyDiagnostic(d);
    const key2 = `${d.filePath}:${line}:${defectClass}`;
    if (lspBySpanClass.has(key2))
      return false;
    if (defectClass === "unknown") {
      return !lspByLine.has(`${d.filePath}:${line}`);
    }
    return true;
  });
}
function suppressTrivyConfigDockerOverlap(diagnostics) {
  const hadolintLines = /* @__PURE__ */ new Set();
  for (const d of diagnostics) {
    if (d.tool === "hadolint") {
      hadolintLines.add(`${d.filePath}:${d.line ?? 1}`);
    }
  }
  if (hadolintLines.size === 0)
    return diagnostics;
  return diagnostics.filter((d) => d.tool !== "trivy-config" || !hadolintLines.has(`${d.filePath}:${d.line ?? 1}`));
}
function isUnusedValueDiagnostic(d) {
  const raw = `${d.id ?? ""} ${d.rule ?? ""} ${d.message ?? ""}`.toLowerCase();
  if (raw.includes("no-unused"))
    return true;
  if (/\b(6133|6192|6196)\b/.test(raw))
    return true;
  const rule = String(d.rule ?? "").toLowerCase();
  if (rule.includes("unused"))
    return true;
  const message = d.message.toLowerCase();
  return message.includes("is declared but its value is never read") || message.includes("is assigned a value but never used") || message.includes("declared but never used") || message.includes("unused");
}
function promoteDeltaUnusedToBlockers(diagnostics) {
  return diagnostics.map((d) => {
    if (!isUnusedValueDiagnostic(d))
      return d;
    if (d.semantic === "blocking" || d.severity === "error")
      return d;
    return {
      ...d,
      severity: "error",
      semantic: "blocking",
      promotionNote: DELTA_UNUSED_PROMOTION_NOTE,
      fixSuggestion: d.fixSuggestion ?? "Remove the unused declaration or rename with '_' prefix if intentionally unused."
    };
  });
}
function buildCoverageNotice(ctx, runnerLatencies, dedupe) {
  if (!ctx.kind)
    return void 0;
  const lspEnabled = !ctx.pi.getFlag("no-lsp");
  const primary2 = getPrimaryDispatchGroup(ctx.kind, lspEnabled);
  if (!primary2 || primary2.runnerIds.length === 0)
    return void 0;
  const relevant = runnerLatencies.filter((r) => primary2.runnerIds.includes(r.runnerId));
  if (relevant.length === 0)
    return void 0;
  const unconfirmedServerIds = [
    ...new Set(relevant.flatMap((r) => r.unconfirmedServerIds ?? []))
  ];
  if (unconfirmedServerIds.length > 0) {
    const deferredIds = new Set(relevant.flatMap((r) => r.deferredServerIds ?? []));
    const markerFor = (ids) => {
      const shown = ids.slice(0, 4);
      const remainder = ids.length - shown.length;
      return `${shown.join(", ")}${remainder > 0 ? ` +${remainder}` : ""}`;
    };
    const deferredServerIds = unconfirmedServerIds.filter((id) => deferredIds.has(id));
    const silentServerIds = unconfirmedServerIds.filter((id) => !deferredIds.has(id));
    const dedupeSet = (ids) => [...new Set(ids)].map(normalizeEphemeralMapKey).sort((a, b) => Number(a > b) - Number(a < b)).join(",");
    const onceKey2 = `${ctx.kind}:${ctx.filePath}:${dedupeSet(silentServerIds)}|${dedupeSet(deferredServerIds)}`;
    if (dedupe) {
      if (coverageNoticeSeen.has(onceKey2))
        return void 0;
      coverageNoticeSeen.add(onceKey2);
    }
    const coverageParts = [];
    if (deferredServerIds.length > 0) {
      coverageParts.push(`coverage: ${markerFor(deferredServerIds)} deferred \u2014 diagnostics are incomplete; findings arrive at turn end if the scan lands.`);
    }
    if (silentServerIds.length > 0) {
      coverageParts.push(`coverage: ${markerFor(silentServerIds)} silent \u2014 diagnostics are incomplete (not a clean result).`);
    }
    return {
      id: `coverage-partial:${ctx.kind}:${path4.basename(ctx.filePath)}`,
      message: coverageParts.join("\n"),
      filePath: ctx.filePath,
      severity: "warning",
      semantic: "warning",
      tool: "pi-lens"
    };
  }
  const primaryHasCoverage = relevant.some(hasUsableResult);
  if (primaryHasCoverage)
    return void 0;
  const primaryStillInFlight = relevant.some((r) => r.status === "pending" || r.status === "deferred");
  if (primaryStillInFlight)
    return void 0;
  const plan = getToolPlan(ctx.kind);
  const fallbackRunnerIds = new Set((plan?.groups ?? []).filter((group) => !group.runnerIds.every((runnerId) => primary2.runnerIds.includes(runnerId))).flatMap((group) => group.runnerIds).filter((runnerId) => !primary2.runnerIds.includes(runnerId)));
  const STRUCTURAL_RUNNERS = /* @__PURE__ */ new Set([
    "tree-sitter",
    "ast-grep-napi",
    "spellcheck",
    "fact-rules",
    "opengrep"
  ]);
  const TYPE_CAPABLE_FALLBACK_RUNNERS = /* @__PURE__ */ new Set(["mypy"]);
  const anyFallbackHasCoverage = runnerLatencies.some((r) => fallbackRunnerIds.has(r.runnerId) && !STRUCTURAL_RUNNERS.has(r.runnerId) && hasUsableResult(r) && (!plan?.capabilities.includes("types") || TYPE_CAPABLE_FALLBACK_RUNNERS.has(r.runnerId)));
  if (anyFallbackHasCoverage)
    return void 0;
  const onceKey = `${ctx.kind}:${ctx.filePath}`;
  if (dedupe) {
    if (coverageNoticeSeen.has(onceKey))
      return void 0;
    coverageNoticeSeen.add(onceKey);
  }
  return {
    id: `coverage-unavailable:${ctx.kind}:${path4.basename(ctx.filePath)}`,
    message: `Pi-lens ${ctx.kind} analysis unavailable \u2014 a language tool is missing, timed out, or failed to run, or the LSP server isn't ready yet, so this file was not fully checked (not a clean result).`,
    filePath: ctx.filePath,
    severity: "warning",
    semantic: "warning",
    tool: "pi-lens"
  };
}
var latencyReports = [];
var coverageNoticeSeen = /* @__PURE__ */ new Set();
var generatedSkipRecorded = /* @__PURE__ */ new Set();
function getLatencyReports() {
  return [...latencyReports];
}
function clearCoverageNoticeState() {
  coverageNoticeSeen.clear();
  generatedSkipRecorded.clear();
}
async function runGroup(ctx, group, registry, onRunnerResult) {
  const diagnostics = [];
  const latencies = [];
  let hadBlocker = false;
  const runnerIds = group.filterKinds ? group.runnerIds.filter((id) => {
    const runner = registry.get(id);
    return runner && ctx.kind && group.filterKinds?.includes(ctx.kind);
  }) : group.runnerIds;
  const semantic = group.semantic ?? "warning";
  for (const runnerId of runnerIds) {
    const runnerStart = Date.now();
    const runner = registry.get(runnerId);
    if (!runner) {
      latencies.push({
        runnerId,
        startTime: runnerStart,
        endTime: Date.now(),
        durationMs: 0,
        status: "skipped",
        diagnosticCount: 0,
        semantic: "unknown"
      });
      logLatency({
        type: "runner",
        filePath: ctx.filePath,
        runnerId,
        durationMs: 0,
        status: "not_registered",
        diagnosticCount: 0,
        semantic: "unknown"
      });
      continue;
    }
    if (runner.skipTestFiles && isTestFile(ctx.filePath)) {
      latencies.push({
        runnerId,
        startTime: runnerStart,
        endTime: Date.now(),
        durationMs: Date.now() - runnerStart,
        status: "test_file_skipped",
        diagnosticCount: 0,
        semantic: "none"
      });
      logLatency({
        type: "runner",
        filePath: ctx.filePath,
        runnerId,
        durationMs: 0,
        status: "test_file_skipped",
        diagnosticCount: 0,
        semantic: "none"
      });
      continue;
    }
    const appliesToCurrentKind = runnerAppliesToKind(runner, ctx.kind);
    if (!appliesToCurrentKind) {
      const runnerEnd2 = Date.now();
      latencies.push({
        runnerId,
        startTime: runnerStart,
        endTime: runnerEnd2,
        durationMs: 0,
        status: "skipped",
        diagnosticCount: 0,
        semantic: "unknown"
      });
      logLatency({
        type: "runner",
        filePath: ctx.filePath,
        runnerId,
        durationMs: 0,
        status: "skipped",
        diagnosticCount: 0,
        semantic: "unknown",
        metadata: { reason: "applies_to", kind: ctx.kind }
      });
      continue;
    }
    let shouldRun = true;
    if (runner.when) {
      try {
        shouldRun = await runner.when(ctx);
      } catch (error) {
        ctx.log(`Runner ${runner.id} precondition failed: ${error}`);
        shouldRun = false;
      }
    }
    if (!shouldRun) {
      latencies.push({
        runnerId,
        startTime: runnerStart,
        endTime: Date.now(),
        durationMs: Date.now() - runnerStart,
        status: "when_skipped",
        diagnosticCount: 0,
        semantic: runner.id
      });
      logLatency({
        type: "runner",
        filePath: ctx.filePath,
        runnerId,
        durationMs: 0,
        status: "when_skipped",
        diagnosticCount: 0,
        semantic: "when_condition"
      });
      continue;
    }
    const projectRoot = ctx.projectRoot ?? ctx.cwd;
    const observedTier = ctx.writeIndex === void 0 ? "inline" : classifyObservedRunner(projectRoot, runner.id);
    if (observedTier === "collect-later") {
      const markedAtMs = Date.now();
      const deferred = runRunner(ctx, runner, semantic).then((result2) => {
        const durationMs = Date.now() - markedAtMs;
        const tier2 = observeRunnerLatency({
          projectRoot,
          runnerId: runner.id,
          durationMs,
          timedOut: result2.failureKind === "timeout"
        });
        if (tier2 !== observedTier) {
          logLatency({
            type: "phase",
            filePath: ctx.filePath,
            phase: "runner_collect_later_tier_flip",
            durationMs: 0,
            metadata: {
              runnerId: runner.id,
              from: observedTier,
              to: tier2,
              projectRoot
            }
          });
        }
        if (tier2 === "collect-later") {
          incrementDegradationCount({
            kind: "runner-collect-later",
            subject: `${projectRoot}:${runner.id}`,
            reason: `observed ${durationMs}ms, threshold ${COLLECT_LATER_THRESHOLD_MS}ms`
          });
        }
        logLatency({
          type: "runner",
          filePath: ctx.filePath,
          runnerId: runner.id,
          startedAt: new Date(markedAtMs).toISOString(),
          durationMs,
          status: result2.status,
          diagnosticCount: result2.diagnostics.length,
          semantic: result2.semantic ?? semantic,
          metadata: {
            tier: "collect-later",
            delivered: "turn_end",
            ...failureRowMetadata(result2)
          }
        });
        return result2;
      });
      deferRunnerFindings({
        filePath: ctx.filePath,
        cwd: ctx.cwd,
        projectRoot,
        runnerId: runner.id,
        markedAtMs,
        writeIndex: ctx.writeIndex,
        promise: deferred,
        session: ctx.sessionGeneration,
        sessionId: ctx.sessionId
      });
      latencies.push({
        runnerId: runner.id,
        startTime: runnerStart,
        endTime: runnerStart,
        durationMs: 0,
        status: "pending",
        diagnosticCount: 0,
        semantic
      });
      recordRunner(ctx.filePath, runner.id, "pending", 0, 0, ctx.writeIndex);
      logLatency({
        type: "runner",
        filePath: ctx.filePath,
        runnerId: runner.id,
        durationMs: 0,
        status: "pending",
        diagnosticCount: 0,
        semantic,
        metadata: { tier: "collect-later", delivered: "turn_end" }
      });
      continue;
    }
    const result = await runRunner(ctx, runner, semantic);
    onRunnerResult?.(runnerId, result);
    const runnerEnd = Date.now();
    const duration = runnerEnd - runnerStart;
    const tier = ctx.writeIndex === void 0 ? "inline" : observeRunnerLatency({
      projectRoot,
      runnerId: runner.id,
      durationMs: duration,
      timedOut: result.failureKind === "timeout"
    });
    if (tier !== observedTier) {
      logLatency({
        type: "phase",
        filePath: ctx.filePath,
        phase: "runner_collect_later_tier_flip",
        durationMs: 0,
        metadata: {
          runnerId: runner.id,
          from: observedTier,
          to: tier,
          projectRoot
        }
      });
    }
    if (tier === "collect-later") {
      incrementDegradationCount({
        kind: "runner-collect-later",
        subject: `${projectRoot}:${runner.id}`,
        reason: `observed ${duration}ms, threshold ${COLLECT_LATER_THRESHOLD_MS}ms`
      });
    }
    const skipReason = result.status === "skipped" && isRunnerSkipReason(result.skipReason) ? result.skipReason : void 0;
    const claimSource = result.status === "skipped" && isRunnerClaimSource(result.claimSource) ? result.claimSource : void 0;
    latencies.push({
      runnerId,
      startTime: runnerStart,
      endTime: runnerEnd,
      durationMs: duration,
      status: result.status,
      diagnosticCount: result.diagnostics.length,
      semantic: result.semantic ?? semantic,
      ...result.failureKind !== void 0 && {
        failureKind: result.failureKind
      },
      ...skipReason !== void 0 && {
        skipReason
      },
      ...claimSource !== void 0 && {
        claimSource
      },
      ...result.unconfirmedServerIds !== void 0 && {
        unconfirmedServerIds: result.unconfirmedServerIds
      },
      ...result.deferredServerIds !== void 0 && {
        deferredServerIds: result.deferredServerIds
      }
    });
    logLatency({
      type: "runner",
      filePath: ctx.filePath,
      runnerId,
      startedAt: new Date(runnerStart).toISOString(),
      durationMs: duration,
      status: result.status,
      diagnosticCount: result.diagnostics.length,
      semantic: result.semantic ?? semantic,
      diagnostics: result.diagnostics.length > 0 ? result.diagnostics.map((d) => ({
        rule: d.rule,
        message: d.message.slice(0, 120),
        line: d.line,
        semantic: d.semantic
      })) : void 0,
      metadata: failureRowMetadata(result) ?? (skipReason ? { skipReason, ...claimSource !== void 0 && { claimSource } } : void 0)
    });
    recordRunner(ctx.filePath, runnerId, result.status, result.diagnostics.length, duration, ctx.writeIndex);
    diagnostics.push(...result.diagnostics);
    const resultSemantic = result.semantic ?? semantic;
    if (resultSemantic === "blocking" && result.diagnostics.length > 0 || result.diagnostics.some((d) => d.semantic === "blocking")) {
      hadBlocker = true;
    }
    if (group.mode === "fallback" && result.status === "succeeded") {
      break;
    }
  }
  return { diagnostics, latencies, hadBlocker };
}
async function dispatchForFile(ctx, groups, registry, onRunnerResult, options) {
  const _overallStart = Date.now();
  if (ctx.analysisRootMode === "adopted") {
    const planned = groups.flatMap((g) => g.runnerIds);
    groups = filterGroupsForAdoptedRoot(groups);
    const admitted = new Set(groups.flatMap((g) => g.runnerIds));
    logLatency({
      type: "phase",
      filePath: ctx.filePath,
      phase: "dispatch_adopted_root_allowlist",
      durationMs: 0,
      metadata: {
        admissionList: ADOPTED_ROOT_RUNNER_ALLOWLIST.join(","),
        admitted: groups.flatMap((g) => g.runnerIds).join(","),
        refused: planned.flatMap((id) => admitted.has(id) ? [] : [id]).join(","),
        noAdmittedRunner: groups.length === 0
      }
    });
    if (groups.length === 0) {
      return {
        diagnostics: [],
        blockers: [],
        warnings: [],
        baselineWarningCount: 0,
        fixed: [],
        resolvedCount: 0,
        output: "",
        blockerOutput: "",
        hasBlockers: false
      };
    }
  }
  if (ctx.fileRole === "generated") {
    const evidence = ctx.generatedEvidence;
    const lineShapeMean = ctx.generatedLineShapeMean;
    if (!generatedSkipRecorded.has(ctx.filePath)) {
      generatedSkipRecorded.add(ctx.filePath);
      logLatency({
        type: "phase",
        filePath: ctx.filePath,
        phase: "dispatch_skipped_generated",
        durationMs: 0,
        metadata: {
          evidence: evidence ?? "unknown",
          ...lineShapeMean !== void 0 && { lineShapeMean }
        }
      });
    }
    return {
      diagnostics: [],
      blockers: [],
      warnings: [],
      baselineWarningCount: 0,
      fixed: [],
      resolvedCount: 0,
      output: "",
      blockerOutput: "",
      hasBlockers: false
    };
  }
  const allDiagnostics = [];
  let stopped = false;
  const runnerLatencies = [];
  const allRunnerIds = groups.flatMap((g) => g.runnerIds);
  logLatency({
    type: "phase",
    filePath: ctx.filePath,
    phase: "dispatch_start",
    durationMs: 0,
    metadata: {
      groupCount: groups.length,
      kind: ctx.kind,
      runners: allRunnerIds.join(",")
    }
  });
  const groupResults = await Promise.all(groups.map((group) => runGroup(ctx, group, registry, onRunnerResult)));
  const baselinePathSafe = isAbsoluteFilePath(ctx.filePath);
  if (ctx.deltaMode && !baselinePathSafe) {
    recordDegradationOnce({
      kind: "dispatch-non-absolute-baseline-path",
      subject: ctx.filePath,
      reason: "dispatchForFile requires an absolute ctx.filePath to key the delta baseline (refs #2489)"
    });
  }
  const baselineAbsKey = `session.baseline.${ctx.filePath}`;
  const previousBaseline = ctx.deltaMode && baselinePathSafe ? ctx.facts.getBoundedSessionFact(baselineAbsKey) : void 0;
  const baselineWarnings = previousBaseline?.filter((d) => d.semantic === "warning" || d.semantic === "none");
  const baselineWarningCount = baselineWarnings?.length ?? 0;
  for (const { diagnostics: groupDiags, latencies, hadBlocker } of groupResults) {
    runnerLatencies.push(...latencies);
    allDiagnostics.push(...groupDiags);
    if (hadBlocker)
      stopped = true;
  }
  const dedupedDiagnostics = dedupeOverlappingDiagnostics(allDiagnostics);
  const fileContent = ctx.facts.getFileFact(ctx.filePath, "file.content") ?? "";
  const rulePolicy = ctx.rulePolicy ?? rulePolicyMapFromConfig(loadPiLensProjectConfig(ctx.projectRoot ?? ctx.cwd).rules);
  const applyOutputFilters = (diags) => {
    const dockerOverlap = suppressTrivyConfigDockerOverlap(diags);
    const overlap = suppressLintOverlapsWithLsp(dockerOverlap);
    const inline = applyInlineSuppressions(overlap, fileContent);
    const disposition = applyDispositions(inline, ctx.projectRoot ?? ctx.cwd, ctx.filePath, fileContent);
    return applyRulePolicy(disposition, rulePolicy, {
      root: ctx.projectRoot ?? ctx.cwd,
      filePath: ctx.filePath
    });
  };
  let visibleDiagnostics = applyOutputFilters(dedupedDiagnostics);
  let resolvedCount = 0;
  if (ctx.deltaMode && previousBaseline) {
    const filtered = filterDelta(visibleDiagnostics, applyOutputFilters(previousBaseline), (d) => d.id);
    visibleDiagnostics = promoteDeltaUnusedToBlockers(filtered.new);
    resolvedCount = filtered.fixed.length;
  }
  if (ctx.deltaMode && baselinePathSafe) {
    ctx.facts.setBoundedSessionFact(baselineAbsKey, [...dedupedDiagnostics]);
  }
  const blockers = visibleDiagnostics.filter((d) => d.semantic === "blocking");
  const warnings = visibleDiagnostics.filter((d) => d.semantic === "warning" || d.semantic === "none");
  const fixedItems = visibleDiagnostics.filter((d) => d.semantic === "fixed");
  const worklogIdentity = {
    model: ctx.telemetryModel,
    provider: ctx.telemetryProvider
  };
  if (fixedItems.length > 0) {
    import("./chunk-6SDEP3AJ.js").then(({ appendToWorklog }) => {
      appendToWorklog(ctx.cwd, fixedItems, true, worklogIdentity);
    }).catch(() => {
    });
  }
  const fixableWarnings = warnings.filter((d) => d.fixable);
  if (fixableWarnings.length > 0) {
    import("./chunk-6SDEP3AJ.js").then(({ appendToWorklog }) => {
      appendToWorklog(ctx.cwd, fixableWarnings, false, worklogIdentity);
    }).catch(() => {
    });
  }
  const inlineBlockers = blockers;
  const inlineFixed = fixedItems;
  const coverageNotice = buildCoverageNotice(ctx, runnerLatencies, options?.dedupeCoverageNotice ?? true);
  const blockerOutput = formatDiagnostics(inlineBlockers, "blocking");
  let output = blockerOutput;
  output += formatDiagnostics(inlineFixed, "fixed");
  if (coverageNotice) {
    output += formatDiagnostics([coverageNotice], "warning", 1);
    warnings.push(coverageNotice);
  }
  const pendingRunners = runnerLatencies.filter((runner) => runner.status === "pending").map((runner) => runner.runnerId);
  if (pendingRunners.length > 0) {
    output += `
\u23F3 Pending runners (reported at turn end): ${pendingRunners.join(", ")}
`;
  }
  const overallEnd = Date.now();
  const latencyReport = {
    filePath: ctx.filePath,
    fileKind: ctx.kind,
    overallStartMs: _overallStart,
    overallEndMs: overallEnd,
    totalDurationMs: overallEnd - _overallStart,
    runners: runnerLatencies,
    stoppedEarly: stopped,
    totalDiagnostics: visibleDiagnostics.length,
    blockers: blockers.length,
    warnings: warnings.length
  };
  latencyReports.push(latencyReport);
  if (latencyReports.length > 100) {
    latencyReports.shift();
  }
  const sumMs = runnerLatencies.reduce((s, r) => s + r.durationMs, 0);
  const wallClockMs = latencyReport.totalDurationMs;
  logLatency({
    type: "tool_result",
    filePath: ctx.filePath,
    durationMs: wallClockMs,
    wallClockMs,
    sumMs,
    parallelGainMs: Math.max(0, sumMs - wallClockMs),
    result: "dispatch_complete",
    metadata: {
      runners: runnerLatencies.map((r) => ({
        id: r.runnerId,
        startedAt: new Date(r.startTime).toISOString(),
        duration: r.durationMs,
        status: r.status
      })),
      totalDiagnostics: visibleDiagnostics.length,
      blockers: blockers.length,
      // #2489 round 2: distinguishes a delta baseline HIT (a prior snapshot
      // was read for this file this session) from a MISS (first dispatch, or
      // the non-absolute-path guard above skipped the read) — `dispatch_start`
      // (above, `metadata: { groupCount, kind, runners }`) fires before the
      // baseline read ever runs and cannot carry either value.
      baselineHit: previousBaseline !== void 0,
      baselineWarningCount
    }
  });
  return {
    latencyReport,
    diagnostics: visibleDiagnostics,
    blockers,
    warnings,
    baselineWarningCount,
    fixed: fixedItems,
    resolvedCount,
    output,
    blockerOutput,
    hasBlockers: blockers.length > 0
  };
}
var RUNNER_TIMEOUT_MS = RUNTIME_CONFIG.dispatch.runnerTimeoutMs;
function looksLikeDiagnosticCodePath(value) {
  if (!value)
    return false;
  const text = value.trim();
  if (!text)
    return false;
  const base = path4.basename(text.replace(/\\/g, "/"));
  if (/^lsp:\d+(?::\d+)?$/i.test(text) || /^lsp:\d+(?::\d+)?$/i.test(base)) {
    return true;
  }
  if (/^similarity[-:]/i.test(text) || /^similarity[-:]/i.test(base)) {
    return true;
  }
  if (/^[a-z-]+:\d+(?::\d+)?$/i.test(text) || /^[a-z-]+:\d+(?::\d+)?$/i.test(base)) {
    return true;
  }
  return false;
}
function normalizeDiagnosticFilePath(ctx, rawPath) {
  if (typeof rawPath === "string" && looksLikeDiagnosticCodePath(rawPath)) {
    ctx.log(`runner path normalization: ignored diagnostic code-like path '${rawPath}', using current file`);
    return resolveRunnerPath(ctx.cwd, ctx.filePath);
  }
  return resolveRunnerPath(ctx.cwd, rawPath || ctx.filePath);
}
function failureRowMetadata(result) {
  return result.status === "failed" && result.failureKind ? {
    failureKind: result.failureKind,
    failureMessage: result.failureMessage
  } : void 0;
}
async function runRunner(ctx, runner, defaultSemantic) {
  const timeoutMs = Math.max(runner.timeoutMs ?? RUNNER_TIMEOUT_MS, getRunnerTimeoutFloorMs());
  let timer;
  const phaseToken = phaseStarted(runner.id);
  try {
    const result = await Promise.race([
      runner.run(ctx).finally(() => clearTimeout(timer)),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Runner ${runner.id} timed out after ${timeoutMs}ms`)), timeoutMs);
      })
    ]);
    const diagnostics = result.diagnostics.map((d) => ({
      ...d,
      filePath: normalizeDiagnosticFilePath(ctx, d.filePath)
    }));
    return {
      ...result,
      diagnostics,
      semantic: result.semantic ?? defaultSemantic
    };
  } catch (error) {
    clearTimeout(timer);
    ctx.log(`Runner ${runner.id} failed: ${error}`);
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: "failed",
      diagnostics: [],
      semantic: defaultSemantic,
      failureKind: message.includes("timed out") ? "timeout" : "exception",
      failureMessage: message.slice(0, 200)
    };
  } finally {
    phaseFinished(phaseToken);
  }
}

// dist/clients/cascade-budget.js
function cascadeSettleWaitMs() {
  const raw = Number(process.env.PI_LENS_CASCADE_SETTLE_WAIT_MS);
  return Number.isFinite(raw) && raw >= 0 ? raw : 5e3;
}
var MIN_NEIGHBOUR_BUDGET = RUNTIME_CONFIG.pipeline.cascadeMaxFiles;
var DEFAULT_NEIGHBOUR_BUDGET = 40;
var CASCADE_NEIGHBOUR_BUDGET = Math.max(MIN_NEIGHBOUR_BUDGET, Number.parseInt(process.env.PI_LENS_CASCADE_NEIGHBOUR_BUDGET ?? "40", 10) || DEFAULT_NEIGHBOUR_BUDGET);
var NEIGHBOUR_BUDGET_OVERRIDDEN = process.env.PI_LENS_CASCADE_NEIGHBOUR_BUDGET !== void 0 && CASCADE_NEIGHBOUR_BUDGET !== DEFAULT_NEIGHBOUR_BUDGET;

// dist/clients/dispatch/utils/lsp-diagnostics.js
function convertLspDiagnostics(diags, filePath, options = {}) {
  const tool = options.tool ?? "lsp";
  return diags.filter((d) => d.range?.start?.line !== void 0).map((d, idx) => {
    const severityMap = {
      1: "error",
      2: "warning",
      4: "hint"
    };
    const severity = severityMap[d.severity] ?? "info";
    const semantic = d.severity === 1 ? "blocking" : d.severity === 2 ? "warning" : "none";
    const code = String(d.code ?? "unknown");
    const source = d.source ?? tool;
    const hasSuggestion = options.fixSuggestionByIndex?.has(idx) ?? false;
    return {
      id: `${tool}:${code}:${d.range.start.line}`,
      message: d.message,
      filePath,
      line: d.range.start.line + 1,
      column: d.range.start.character + 1,
      severity,
      semantic,
      tool,
      rule: `${source}:${code}`,
      fixable: hasSuggestion,
      autoFixAvailable: false,
      fixKind: hasSuggestion ? "suggestion" : void 0,
      fixSuggestion: options.fixSuggestionByIndex?.get(idx),
      scanOrigin: options.scanOrigin
    };
  });
}

// dist/clients/dispatch/finding-policy.js
function applyFindingPolicy(diagnostics, options) {
  const inlineKept = applyInlineSuppressions(diagnostics, options.content);
  const disposed = filterDisposed(inlineKept, options);
  return {
    kept: applyRulePolicy(disposed, options.policyMap, {
      root: options.cwd,
      filePath: options.filePath
    }),
    inlineKept
  };
}
function loadProjectRulePolicyMap(cwd) {
  return resolvedRulePolicyMap(cwd);
}
function filterDisposed(diagnostics, options) {
  const identities = options.identities;
  if (!identities) {
    return applyDispositions(diagnostics, options.cwd, options.filePath, options.content);
  }
  if (!diagnostics.length || !hasAnyDispositionMarks(options.cwd)) {
    return diagnostics;
  }
  const expanded = diagnostics.flatMap((diagnostic) => identities(diagnostic).map((identity) => ({
    diagnostic,
    candidate: {
      ...identity,
      message: diagnostic.message,
      ...diagnostic.line !== void 0 && { line: diagnostic.line },
      ...diagnostic.semantic !== void 0 && {
        semantic: diagnostic.semantic
      }
    }
  })));
  const survivors = new Set(applyDispositions(expanded.map((entry) => entry.candidate), options.cwd, options.filePath, options.content));
  const disposed = /* @__PURE__ */ new Set();
  for (const entry of expanded) {
    if (!survivors.has(entry.candidate))
      disposed.add(entry.diagnostic);
  }
  return disposed.size === 0 ? diagnostics : diagnostics.filter((diagnostic) => !disposed.has(diagnostic));
}
function probeIdentities(canonical, raw) {
  const rendered = [
    [canonical.tool, canonical.rule]
  ];
  if (raw !== void 0 && (raw.source !== void 0 || raw.code !== void 0)) {
    rendered.push([
      raw.source,
      raw.code === void 0 ? void 0 : String(raw.code)
    ]);
  }
  return expandRenderedIdentities(rendered);
}
function renderedRuleIdentities(diagnostic) {
  return expandRenderedIdentities([[diagnostic.tool, diagnostic.rule]]);
}
function inlineBlockerIdentities(diagnostic) {
  return expandRenderedIdentities([
    [diagnostic.tool, diagnostic.rule],
    [void 0, void 0]
  ]);
}
function applyPushedFindingPolicy(findings, options) {
  const { kept } = applyFindingPolicy(findings, {
    cwd: options.cwd,
    filePath: options.filePath,
    content: options.content ?? "",
    // mtime-cached, so several files in one drain cost one stat.
    policyMap: loadProjectRulePolicyMap(options.cwd),
    identities: renderedRuleIdentities
  });
  return { kept, suppressed: findings.length - kept.length };
}
function expandRenderedIdentities(rendered) {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  for (const [tool, rule] of rendered) {
    for (const candidateTool of [tool, void 0]) {
      const key2 = `${candidateTool ?? ""}\0${rule ?? ""}`;
      if (seen.has(key2))
        continue;
      seen.add(key2);
      out.push({
        ...candidateTool !== void 0 && { tool: candidateTool },
        ...rule !== void 0 && { rule }
      });
    }
  }
  return out;
}
function applyLspFindingPolicy(diagnostics, options) {
  if (!diagnostics.length)
    return { kept: diagnostics, inlineKept: diagnostics };
  const content = options.content ?? "";
  const anchored = [];
  for (const diagnostic of diagnostics) {
    if (diagnostic.range?.start?.line !== void 0)
      anchored.push(diagnostic);
  }
  if (!anchored.length)
    return { kept: diagnostics, inlineKept: diagnostics };
  const converted = convertLspDiagnostics(anchored, options.filePath);
  retagAuxiliaryDiagnostics(converted, anchored, content, {
    cwd: options.cwd,
    fileRole: options.fileRole
  });
  const rawByConverted = /* @__PURE__ */ new Map();
  for (const [index, diagnostic] of converted.entries()) {
    const raw = anchored[index];
    if (raw !== void 0)
      rawByConverted.set(diagnostic, raw);
  }
  const { kept, inlineKept } = applyFindingPolicy(converted, {
    cwd: options.cwd,
    filePath: options.filePath,
    content,
    policyMap: options.policyMap,
    identities: (diagnostic) => probeIdentities(diagnostic, rawByConverted.get(diagnostic))
  });
  const survivorsOf = (survivors) => {
    if (survivors.length === converted.length)
      return diagnostics;
    const keptConverted = new Set(survivors);
    const dropped = /* @__PURE__ */ new Set();
    for (const [diagnostic, raw] of rawByConverted) {
      if (!keptConverted.has(diagnostic))
        dropped.add(raw);
    }
    return diagnostics.filter((d) => !dropped.has(d));
  };
  return { kept: survivorsOf(kept), inlineKept: survivorsOf(inlineKept) };
}
function filterFindingsByDisposition(findings, cwd, toDiagnostic3) {
  if (findings.length === 0)
    return { kept: findings, suppressed: 0 };
  const candidates = findings.flatMap((finding) => {
    const diagnostic = toDiagnostic3(finding);
    return renderedRuleIdentities(diagnostic).map((identity) => ({
      finding,
      candidate: {
        filePath: diagnostic.filePath,
        message: diagnostic.message,
        ...diagnostic.line !== void 0 && { line: diagnostic.line },
        ...diagnostic.semantic !== void 0 && {
          semantic: diagnostic.semantic
        },
        ...identity.tool !== void 0 && { tool: identity.tool },
        ...identity.rule !== void 0 && { rule: identity.rule }
      }
    }));
  });
  const survivors = new Set(applyDispositionsMultiFile(candidates.map((c) => c.candidate), cwd, (d) => d.filePath));
  const disposed = /* @__PURE__ */ new Set();
  for (const candidate of candidates) {
    if (!survivors.has(candidate.candidate))
      disposed.add(candidate.finding);
  }
  const kept = disposed.size === 0 ? findings : findings.filter((finding) => !disposed.has(finding));
  return { kept, suppressed: findings.length - kept.length };
}

// dist/clients/finding-delivery-gate.js
var MS_PER_MINUTE = 6e4;
function markUnreconciledFindings(findings) {
  return findings.map((finding) => ({ ...finding, stale: true }));
}
function formatCacheAgeLabel(scannedAt, nowMs = Date.now()) {
  if (scannedAt === void 0 || scannedAt === null || scannedAt === "") {
    return "scan age unknown";
  }
  const scannedAtMs = typeof scannedAt === "number" ? scannedAt : Date.parse(scannedAt);
  if (!Number.isFinite(scannedAtMs))
    return "scan age unknown";
  const ageMs = Math.max(0, nowMs - scannedAtMs);
  const ageMinutes = Math.round(ageMs / MS_PER_MINUTE);
  if (ageMinutes < 1)
    return "scanned <1m ago";
  if (ageMinutes < 60)
    return `scanned ${ageMinutes}m ago`;
  const ageHours = Math.floor(ageMinutes / 60);
  const remMinutes = ageMinutes % 60;
  return remMinutes === 0 ? `scanned ${ageHours}h ago` : `scanned ${ageHours}h ${remMinutes}m ago`;
}
function admitsProjectWideFindings(sessionRole) {
  return sessionRole === "primary";
}
function gated(file, description, gates, evidence, extra = {}) {
  return { mode: "gated", file, description, gates, evidence, ...extra };
}
function labeled(file, description, reason, ageSource, evidence = [], extra = {}) {
  return {
    mode: "labeled",
    file,
    description,
    reason,
    ageSource,
    evidence,
    ...extra
  };
}
var RUNTIME_TURN_FILE = "clients/runtime-turn.ts";
var LENS_DIAGNOSTICS_FILE = "tools/lens-diagnostics.ts";
var DELIVERY_SURFACES = {
  // #1892 (lane extraction): both secrets tiers are rendered by the secrets
  // LANE (`clients/turn-end/lanes/secrets.ts`), so `clients/runtime-turn.ts`
  // no longer reads `.live`/`.stale` itself — the arm it can still be pinned
  // to is the whole gated store object it hands the lane. That is WEAKER than
  // the previous `gitleaksGate.live,` pin (it no longer says which partition
  // feeds which tier) and the loss is deliberate: the live/stale split is a
  // lane rule now, pinned behaviourally instead, by
  // `tests/clients/runtime-turn-finding-freshness.test.ts` ("keeps an
  // unmodified file's finding as a full-severity blocker" / "DEMOTES a
  // finding whose file was edited after the scan — kept, no line") and the
  // committed witness goldens under `tests/fixtures/witness/`. What the pin
  // still proves is what this registry exists for: the rows the tier renders
  // came out of a real `gateFindingsByPathFreshness` call and not out of a
  // hand-built object (the R2 binding chain in
  // `tests/clients/finding-delivery-gate.test.ts` walks
  // `gitleaksGate` → `scannerGates` → the call).
  "runtime-turn:secrets-gitleaks": gated(RUNTIME_TURN_FILE, "Turn-end \u{1F534} secrets blocker, gitleaks cache.", ["gateFindingsByPathFreshness"], ["gitleaksGate,"]),
  "runtime-turn:secrets-trivy": gated(RUNTIME_TURN_FILE, "Turn-end \u{1F534} secrets blocker, trivy secrets cache.", ["gateFindingsByPathFreshness"], ["trivySecretsGate,"]),
  "runtime-turn:govulncheck-advisory": gated(RUNTIME_TURN_FILE, "Turn-end \u{1F6E1}\uFE0F Go CVE advisory (call-site line only).", ["gateFindingsByPathFreshness"], ["scannerGates.govulncheck"]),
  // Two tagged seams (the stale and live render branches below the same
  // `sweepInlineBlockerFreshness` call) legitimately share one evidence
  // occurrence — evidenceMin: 2 tells the exclusive-assignment check both
  // are expected claimants, not a rogue seam contesting the real one.
  "runtime-turn:unresolved-inline-blocker": gated(
    RUNTIME_TURN_FILE,
    "Turn-end re-surfaced unresolved inline blockers.",
    ["sweepInlineBlockerFreshness"],
    // #1790: the call now passes `additionalEntries` (widget-store rows) as a
    // third argument, so the literal is the call's opening rather than the
    // whole single-line invocation.
    ["sweepInlineBlockerFreshness(runtime, cwd, {"],
    { evidenceMin: 2 }
  ),
  // The same shared gate call and the same two stores as the live secrets
  // tier — one lane renders both tiers, so this surface has no gate call and
  // no arm read of its own; see the note above the live tier for what the pin
  // does and does not prove.
  "runtime-turn:stale-secrets-tier": gated(RUNTIME_TURN_FILE, "Turn-end \u{1F511} demoted-secrets tier (drifted since scan).", ["gateFindingsByPathFreshness"], ["gitleaksGate,", "trivySecretsGate,"]),
  // The evidence below is the literal header FRAGMENT including the
  // interpolation — proves the label is actually rendered, not merely
  // computed and discarded (review round F1's "deleted the age
  // interpolations" attack).
  "runtime-turn:trivy-critical-blocker": labeled(RUNTIME_TURN_FILE, "Turn-end \u{1F534} CRITICAL dependency CVE blocker (trivy).", "Package-pinned finding with no cited file:line to stat \u2014 freshness has nothing to check drift against. The session_start cache can be arbitrarily old, so its age is stated instead. Also routes through `filterFindingsByDisposition` (#1625) first \u2014 a suppressed/false-positive finding never reaches this render, so the age label and the disposition filter compose rather than substitute for each other.", "TrivyResult.scannedAt", ["CRITICAL dependency CVEs (trivy, ${trivyAgeLabel}"]),
  "runtime-turn:trivy-cve-advisory": labeled(RUNTIME_TURN_FILE, "Turn-end \u{1F6E1}\uFE0F non-critical dependency CVE advisory (trivy).", "Same package-pinned shape and #1625 disposition composition as the CRITICAL blocker above.", "TrivyResult.scannedAt", ["Dependency CVEs (trivy, ${trivyAgeLabel}"]),
  "runtime-turn:trivy-license-advisory": labeled(RUNTIME_TURN_FILE, "Turn-end \u{1F4DC} dependency license-risk advisory (trivy).", "Same package-pinned shape as the CRITICAL blocker above.", "TrivyResult.scannedAt", ["Dependency license risk (trivy, ${trivyAgeLabel}"]),
  "runtime-turn:dead-code-advisory": labeled(RUNTIME_TURN_FILE, "Turn-end dead-code delta advisory (knip/vulture/etc).", "The delta shown is computed from THIS turn's own analyze() call, diffed against the previous cache \u2014 never a replay of a stale cache.", "live"),
  "runtime-turn:knip-blocker": labeled(RUNTIME_TURN_FILE, "Turn-end \u{1F534} Knip unresolved-imports/deps blocker.", "Same shape as the dead-code advisory: `await knipClient.analyze(cwd, ...)` runs fresh THIS turn, diffed against the previous cache and filtered to files edited this turn \u2014 never a replay of a stale cache.", "live"),
  "runtime-turn:knip-advisory": labeled(RUNTIME_TURN_FILE, "Turn-end \u26A0\uFE0F Knip newly-unused-exports advisory.", "Same live-this-turn shape as the Knip blocker above.", "live"),
  "runtime-turn:actionable-warnings-advisory": labeled(RUNTIME_TURN_FILE, "Turn-end actionable-warnings advisory (ast-grep etc).", "`peekActionableWarnings` reads `_actionableWarningsThisTurn` \u2014 recorded fresh from this turn's own dispatch, never a cross-turn cache.", "live"),
  "runtime-turn:code-quality-warnings-advisory": labeled(RUNTIME_TURN_FILE, "Turn-end code-quality-warnings advisory.", "`peekCodeQualityWarnings` reads `_codeQualityWarningsThisTurn` \u2014 the same per-turn accumulator shape as actionable-warnings above.", "live"),
  "runtime-turn:disposition-suppressed-notice": labeled(RUNTIME_TURN_FILE, "Turn-end running disposition-suppressed-count notice (#1616).", "A live running total accumulated from this turn's own gate/disposition calls above (`dispositionSuppressedTotal`) \u2014 telemetry ABOUT the other gated surfaces, not a cache of its own.", "live"),
  // #2001/#2002 collect-later: findings an auxiliary LSP published AFTER its
  // aux-grace window expired, probed from the client cache at the next
  // turn_end. Gated on the mark timestamp: a cited file deleted or edited
  // since the mark drops its findings (never delivered before, and the
  // drifting edit already re-touched the file — a fresh pending pair
  // supersedes this one), with both drop arms counted in the
  // `late_auxiliary_findings` latency record rather than silenced.
  //
  // #3102: freshness is only half the gate. The survivors also take the shared
  // `clients/dispatch/finding-policy.ts` stack (inline `pi-lens-ignore` →
  // stored dispositions → `.pi-lens.json` rule policy) the per-edit dispatcher,
  // `mode=full` and the `source=lsp` probe lane apply — without it a finding
  // the agent marked `false-positive` re-reported on every drain. Per #3088
  // round-2 F4, the evidence is the CALL TEXT of that filter, which exists
  // nowhere else in this file: a bare `applyFindingPolicy` would also be
  // satisfied by an import line or an unrelated caller.
  "runtime-turn:late-auxiliary-findings": gated(
    RUNTIME_TURN_FILE,
    "Turn-end late-auxiliary LSP findings (collect-later probe of aux client caches whose grace window expired).",
    // #3248: the open-coded `applyFindingPolicy(...)` here and the identical
    // one the late-RUNNER lane needed are now one `applyPushedFindingPolicy`
    // call, so the gate and the evidence name that call. Same stack, same
    // identities — only the spelling moved.
    ["gateFindingsByPathFreshness", "applyPushedFindingPolicy"],
    ['"late-auxiliary-findings": {', "applyPushedFindingPolicy(gate.live, {"]
  ),
  "runtime-turn:late-runner-findings": gated(
    RUNTIME_TURN_FILE,
    "Turn-end CLI runner findings collected after the post-write path.",
    // #3248: this lane was the last push surface with no disposition stage;
    // it routes through the same shared policy call as its late-auxiliary
    // twin. #3814: the freshness gate and that policy call now live in ONE
    // verdict, `judgeDeferredRunnerFindings` (clients/deferred-runner-blockers.ts),
    // which the commit gate calls too; this lane's proof is that it asks that
    // verdict. That the verdict itself runs both seams is pinned by behaviour
    // (`tests/index-3814-deferred-blocker-gate.test.ts`: a stale answer and a
    // marked finding each stop blocking, one mutation each).
    ["judgeDeferredRunnerFindings"],
    ["judgeDeferredRunnerFindings("],
    { evidenceMin: 2 }
  ),
  "runtime-turn:cascade-blocker": labeled(RUNTIME_TURN_FILE, "Turn-end \u{1F9EA} cascade neighbor blocker.", "Cascade results settle synchronously this turn where possible (`settleCascadeRuns`), but an unsettled compute can carry over to a later turn (bounded by a carry cap) \u2014 a carried-over result renders with an explicit `(carried N turns \xB7 scanned Xm ago)` label (#3167, #3168 F3), so the agent can tell it from a fresh observation.", "live", ["cascadeCarrySuffix("], { evidenceMin: 1 }),
  "runtime-turn:cascade-coverage-advisory": labeled(RUNTIME_TURN_FILE, "Turn-end cascade-coverage-gap advisories (graph/binding/budget).", "Explains what the cascade check could NOT confirm this turn \u2014 not a finding with a cited path, an absence-of-coverage disclosure computed from this turn's own indeterminate-run list. An advisory computed from a carried indeterminate run is labeled `(carried N turns \xB7 <age>)` (#3167, #3168 F4 \u2014 dropped on mixed carried/fresh buckets). The age half reads `scan age unknown` on this surface today: no indeterminate-run producer stamps `observedAt` (only the resolved-found plumb does, `clients/cascade-format.ts`), and one unstamped carried run collapses the whole bucket's age rather than claiming the stamped runs' (#3168 F13). The carry COUNT is always real.", "live", ["withCarryLabel("], { evidenceMin: 3 }),
  // #3102: the cold-neighbour cascade run is BUILT here, in the quiet-window
  // reconcile (`onResolvedFound` in index.ts), a turn earlier than the
  // `runtime-turn:cascade-blocker` render that finally carries it — so it is
  // its own delivery lane, and it was the one that rendered raw LSP findings
  // with no policy filter at all. The evidence is the CALL TEXT of the shared
  // filter (#3088 round-2 F4): a bare `applyFindingPolicy` would also be
  // satisfied by the import line.
  "cascade-format:resolved-found-run": gated("clients/cascade-format.ts", "Cold-neighbour ERROR diagnostics formatted into the turn-end cascade run by `buildResolvedFoundCascadeRun` (quiet-window reconcile of a cascade touch that skipped its in-lane wait).", ["applyFindingPolicy"], ["applyFindingPolicy(retained, {"]),
  // #3157: the IN-LANE cascade — a different delivery lane from the
  // quiet-window run above, and the one #3102's sweep cleared WRONGLY. Its four
  // display sites (passive cold snapshot, fresh touch, touch-error fallback,
  // degraded fallback) assemble `CascadeNeighborResult.diagnostics` and reach
  // the agent through `formatCascadeNeighborDiagnostics` without ever entering
  // the dispatcher's `applyOutputFilters` pipeline: the sweep's file-level
  // verdict ("the per-edit dispatch path, which already filters in
  // dispatcher.ts") was true only of the per-edit RUNNER output in
  // `runners/lsp.ts`, which is a different call site in a different file.
  //
  // Evidence is the CALL TEXT (#3088 round-2 F4), counted: `cascadeDisplay(` is
  // the one seam all four sites route through, so `evidenceMin: 4` is the count
  // of display sites in the file and dropping ANY of them back to a raw
  // `convertLspDiagnostics` reds this suite. Identity-stubbing the callee
  // instead is caught behaviourally — it reds twelve cases in
  // `tests/clients/inlane-cascade-finding-policy.test.ts`, which is a stronger
  // signal than the R2 proximity heuristic. Residual, stated: a FIFTH display
  // site that open-codes the conversion keeps the count at 4 and is caught by
  // review, not by this row.
  "dispatch-integration:in-lane-cascade": gated("clients/dispatch/integration.ts", "In-lane per-edit cascade neighbour ERROR diagnostics, rendered into the turn-end cascade block by `computeCascadeForFile`.", ["applyCascadeDisplayPolicy"], ["cascadeDisplay("], { evidenceMin: 4 }),
  "runtime-turn:call-graph-advisory": labeled(RUNTIME_TURN_FILE, "Turn-end \u{1F4CA} call-graph impact advisory.", "`runtime.callGraph` is a session-lifetime in-memory structure; this round does not verify or gate ITS OWN freshness policy (how/when it incorporates edits made earlier in the session).", "live", [], {
    status: "partial",
    partialReason: "call-graph freshness/invalidation policy is out of this PR's scope \u2014 tracked as a follow-up, not silently assumed fresh."
  }),
  // #3088 round 2 F4: this row used to name `applyDispositions`/`applyRulePolicy`
  // with whole-file evidence literals. Once #3088 folded mode=full's stack onto
  // `applyFindingPolicy`, those two literals survived only in UNRELATED
  // mode=delta helpers in the same file, so deleting the entire policy stack out
  // of `applyInlineSuppressionsToSummaries` left this gate — and the ratchet —
  // green while five behaviour cases redded. The evidence is now the call text
  // of the merge's own filter, which exists nowhere else in the file.
  "lens-diagnostics:mode-full": gated(LENS_DIAGNOSTICS_FILE, "`lens_diagnostics mode=full` report.", ["applyFindingPolicy", "reconcileProjectDiagnosticsSnapshot"], [
    "applyFindingPolicy(summary.diagnostics, {",
    "reconcileProjectDiagnosticsSnapshot("
  ]),
  "lens-diagnostics:mode-all": gated(LENS_DIAGNOSTICS_FILE, "`lens_diagnostics mode=all` report (widget-state read).", ["reconcileStaleWidgetFiles", "reconcileStaleWidgetDependencyBlockers"], ["reconcileStaleWidgetFiles(", "reconcileStaleWidgetDependencyBlockers("]),
  // #1634 review round F3: this was the most important gap — the tool's
  // DEFAULT mode rendered cached `file:line` findings with zero freshness
  // check. `applyDeltaFreshnessGate` (this file's sibling in
  // tools/lens-diagnostics.ts) now routes the actionable/quality-warnings
  // caches through the shared gate using each report's own `generatedAt`.
  // Round R3: mode=delta has a THIRD arm — the persisted project-diagnostics
  // delta report, rendered by `appendProjectDiagnosticsDeltaLines` — which
  // carried the identical unfixed shape. It now gates the same way, against
  // its own `generatedAt`.
  "lens-diagnostics:mode-delta": gated(LENS_DIAGNOSTICS_FILE, "`lens_diagnostics mode=delta` report (the tool's DEFAULT mode) \u2014 re-serves the actionable-warnings/code-quality-warnings caches AND the persisted project-diagnostics delta report.", ["gateFindingsByPathFreshness"], [
    '"lens-diagnostics-delta": {',
    "applyDeltaFreshnessGate(",
    '"lens-diagnostics-delta-project": {'
  ]),
  "widget-state:footer": gated("clients/widget-state.ts", "TUI footer blocking/error/warning tally.", ["reconcileStaleWidgetFiles", "isBlocking"], ["isBlocking(diagnostic)", "reconcileStaleWidgetFiles()"]),
  "agent-nudge:context-message": labeled("clients/agent-nudge.ts", "Post-edit file-touch nudge injected via `context`.", "Not a scanner finding store: no severity, no cited line, no cache \u2014 the accumulator is drained and cleared at the moment of injection, so the content IS the current state by construction.", "live"),
  "test-runner-delivery:custom-entry": labeled("clients/test-runner-delivery.ts", "Post-agent test-runner failures in a non-context custom entry.", "The cache remains authoritative for pull diagnostics and the commit guard; this surface appends only after provenance validation and an idle recheck.", "live"),
  "project-diagnostics:persisted-snapshot": gated(LENS_DIAGNOSTICS_FILE, "Cross-session persisted project-diagnostics snapshot read.", ["reconcileProjectDiagnosticsSnapshot"], ["reconcileProjectDiagnosticsSnapshot("]),
  // ── #2028: the remaining agent-facing surfaces ──────────────────────────
  // Registered after #2028's root-cause review found the 🔴 STOP block
  // rendering stale/deleted-file blockers because its surface was never in
  // this registry — the exact "gated or labeled, never neither" gap this
  // module exists to close.
  "tool-call:stop-blocker": gated("clients/pipeline.ts", "Per-edit \u{1F534} STOP blocker output appended to the write/edit tool result.", ["dropFindingsForMissingPaths"], ['store: "stop-blocker"']),
  // The freshness stack itself (own-file mtime + reverse-dependency mtimes
  // via isEntryFresh, plus the #1095 content binding) lives inside
  // clients/lsp/workspace-diagnostics-cache.ts; the two evidence calls are
  // the tool's literal entry points into that gated path.
  "lsp-diagnostics:tool-output": gated("tools/lsp-diagnostics.ts", "`lsp_diagnostics` batch/directory sweep results. Cache hits replay through the shared workspace-diagnostics cache: createWorkspaceDiagnosticsCacheContext is the tool's entry, and its lookup() applies the #671/#672 freshness stack (own-file mtime + reverse-dependency mtimes via isEntryFresh) plus the #1095 content binding. #3088: every route out of this tool \u2014 fresh, cache replay, single file, directory \u2014 also passes applyProbeFindingPolicy, the stored-disposition / .pi-lens.json rule-policy / inline pi-lens-ignore stack the per-edit dispatch path and mode=full apply.", [
    "createWorkspaceDiagnosticsCacheContext",
    "isEntryFresh",
    "cacheCtx.lookup",
    "applyProbeFindingPolicy"
  ], [
    "createWorkspaceDiagnosticsCacheContext(resolvedCwd)",
    "cacheCtx.lookup(file, scopeKey)",
    "applyProbeFindingPolicy("
  ]),
  "git-guard:commit-blocked": labeled("clients/git-guard.ts", "Git-guard commit/push \u{1F534} COMMIT BLOCKED verdict (--lens-guard).", "Synchronous preflight rejection returned inline with the failed git command. The blocker map it reads is refreshed at decision time: the gate first judges settled collect-later runner answers through the freshness gate and the finding policy (#3814), so a stale answer cannot block.", "live"),
  "shared-checkout-guard:worktree-mutation-blocked": labeled("clients/shared-checkout-guard.ts", "Shared-checkout \u{1F534} WORKING-TREE CHANGE BLOCKED verdict (--lens-checkout-guard).", "Synchronous preflight rejection returned inline with the failed git command. Both inputs are read at decision time \u2014 the instance registry and `git status` \u2014 so no stored finding is replayed and nothing can go stale between detection and delivery.", "live"),
  "read-guard-tool-lines:preflight-errors": labeled("clients/read-guard-tool-lines.ts", "Read-guard hashline BLOCKED / RE-READ REQUIRED / PARTIAL APPLY / ALREADY APPLIED preflight errors (#2402).", "Computed fresh per edit attempt and returned as that attempt's rejection \u2014 no cached findings are replayed, so there is no staleness window. The PARTIAL APPLY and ALREADY APPLIED variants describe the same attempt's commit outcome; applied-edit recognition reads RuntimeCoordinator's session-scoped record, which resets with the session.", "live"),
  "mutating-tool:adapter-preflight-errors": labeled("clients/mutating-tool.ts", "Shape-adapter BLOCKED preflight errors for hashline edit inputs the adapter recognized but could not resolve to a range (#2423).", "Computed fresh from the tool input on each attempt and returned as that attempt's rejection, so there is no staleness window. The adapters read only the call's own arguments; nothing cached is replayed.", "live"),
  "tool-call:duplicate-export-blocker": labeled("clients/runtime-tool-call.ts", "Duplicate-export STOP rejection returned inline with the failed edit.", "Synchronous preflight rejection computed per edit attempt; no stored state.", "live"),
  "agent-behavior:thrashing-notice": labeled("clients/agent-behavior-client.ts", "In-result thrashing/blind-write detection notice.", "Ephemeral notice computed at detection time inside the same tool result \u2014 no persistence and no cache, so nothing can be stale.", "live")
};

// dist/clients/cascade-format.js
function cascadeCarrySuffix(carriedTurns, observedAt) {
  if (carriedTurns === void 0 || carriedTurns < 1)
    return void 0;
  const noun = carriedTurns === 1 ? "turn" : "turns";
  return `(carried ${carriedTurns} ${noun} \xB7 ${formatCacheAgeLabel(observedAt)})`;
}

// dist/clients/cascade-logger.js
import * as path5 from "node:path";
var CASCADE_LOG_DIR = getGlobalPiLensLogDir();
var CASCADE_LOG_FILE = path5.join(CASCADE_LOG_DIR, "cascade.log");
var writer = createNdjsonLogger({
  filePath: CASCADE_LOG_FILE,
  maxBytes: getMaxLogSizeMB() * 1024 * 1024
});
function logCascade(entry) {
  if (isTestMode()) {
    return;
  }
  writer.log({
    ts: (/* @__PURE__ */ new Date()).toISOString(),
    ...entry,
    filePath: normalizeLoggedPath(entry.filePath)
  });
}

// dist/clients/diagnostic-tracker.js
var _tracker = null;
function getDiagnosticTracker() {
  if (!_tracker) {
    _tracker = createDiagnosticTracker();
  }
  return _tracker;
}
function createDiagnosticTracker() {
  const shown = /* @__PURE__ */ new Map();
  const occurrenceCounts = /* @__PURE__ */ new Map();
  let totalShown = 0;
  let totalAutoFixed = 0;
  let totalAgentFixed = 0;
  const key2 = (filePath, ruleId, line) => `${filePath}:${ruleId}:${line}`;
  return {
    trackShown(diagnostics) {
      for (const d of diagnostics) {
        const ruleId = d.rule || d.id || "unknown";
        const line = d.line || 1;
        const k = key2(d.filePath, ruleId, line);
        occurrenceCounts.set(k, (occurrenceCounts.get(k) ?? 0) + 1);
        if (!shown.has(k)) {
          shown.set(k, {
            ruleId,
            filePath: d.filePath,
            line,
            shownAt: /* @__PURE__ */ new Date(),
            autoFixed: false,
            agentFixed: false
          });
          totalShown++;
        }
      }
    },
    trackAutoFixed(count) {
      if (count > 0) {
        totalAutoFixed += count;
      }
    },
    trackAgentFixed(count) {
      if (count > 0) {
        totalAgentFixed += count;
      }
    },
    getStats() {
      const ruleCounts = /* @__PURE__ */ new Map();
      const rulePaths = /* @__PURE__ */ new Map();
      for (const entry of shown.values()) {
        ruleCounts.set(entry.ruleId, (ruleCounts.get(entry.ruleId) || 0) + 1);
        if (!rulePaths.has(entry.ruleId))
          rulePaths.set(entry.ruleId, /* @__PURE__ */ new Set());
        rulePaths.get(entry.ruleId)?.add(entry.filePath);
      }
      const topViolations = [...ruleCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([ruleId, count]) => ({
        ruleId,
        count,
        samplePaths: [...rulePaths.get(ruleId) ?? /* @__PURE__ */ new Set()].sort((a, b) => a.localeCompare(b)).slice(0, 3)
      }));
      const repeatOffenders = [...occurrenceCounts.entries()].filter(([, count]) => count >= 2).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, count]) => {
        const parts = k.split(":");
        const lineStr = parts.pop() ?? "1";
        const ruleId = parts.pop() ?? "unknown";
        const filePath = parts.join(":");
        return {
          key: k,
          ruleId,
          filePath,
          line: Number.parseInt(lineStr, 10) || 1,
          count
        };
      });
      return {
        totalShown,
        totalAutoFixed,
        totalAgentFixed,
        totalUnresolved: totalShown - totalAutoFixed - totalAgentFixed,
        topViolations,
        repeatOffenders
      };
    },
    reset() {
      shown.clear();
      occurrenceCounts.clear();
      totalShown = 0;
      totalAutoFixed = 0;
      totalAgentFixed = 0;
    }
  };
}

// dist/clients/lsp/cascade-tier.js
var OUTSTANDING_TOUCH_MAX_AGE_MS = 15 * 6e4;
var _outstandingTouches = /* @__PURE__ */ new Map();
var _expiredSinceLastSweep = 0;
var _evictedSinceLastSweep = 0;
function resetCascadeTierSessionState() {
  _outstandingTouches.clear();
  _expiredSinceLastSweep = 0;
  _evictedSinceLastSweep = 0;
}

// dist/clients/dispatch/runners/ast-grep-napi.js
import * as fs4 from "node:fs";
import * as path6 from "node:path";

// dist/clients/deps/ast-grep-napi.js
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
var _require = createRequire(import.meta.url);
function loadAstGrepNapi() {
  try {
    const entry = _require.resolve("@ast-grep/napi");
    return import(pathToFileURL(entry).href);
  } catch {
    return import("@ast-grep/napi");
  }
}

// dist/clients/dispatch/priorities.js
var PRIORITY = {
  LSP_PRIMARY: 4,
  LSP_FALLBACK: 5,
  FORMAT_AND_LINT_PRIMARY: 10,
  LINT_SECONDARY: 12,
  STRUCTURAL_ANALYSIS: 14,
  SPECIALIZED_ANALYSIS: 15,
  GENERAL_ANALYSIS: 20,
  YAML_LINT: 22,
  SQL_LINT: 24,
  DOC_QUALITY: 30,
  ARCHITECTURE: 40,
  DEEP_LANGUAGE_ANALYSIS: 50
};

// dist/clients/dispatch/runners/ast-grep-napi.js
var defaultUnsupportedLanguageLog = /* @__PURE__ */ new Set();
var UNSUPPORTED_RULE_ID_SAMPLE_SIZE = 5;
function resetAstGrepUnsupportedLanguageLog() {
  defaultUnsupportedLanguageLog.clear();
}
var sg;
var sgLoadPromise;
var sgSessionHold = false;
var sgHoldReason;
var TRANSIENT_ERRNO_ALLOWLIST = /* @__PURE__ */ new Set([
  "EMFILE",
  "EBUSY",
  "EAGAIN",
  "EPERM",
  "ETXTBSY"
]);
var KNOWN_GENUINE_NATIVE_LOAD_MESSAGES = [
  /cannot find native binding/i,
  /failed to load native binding/i
];
function collectErrorChain(err) {
  const codes = [];
  const messages = [];
  let current = err;
  const seen = /* @__PURE__ */ new Set();
  while (current !== void 0 && current !== null && !seen.has(current)) {
    seen.add(current);
    if (current instanceof Error) {
      messages.push(current.message);
      const code = current.code;
      if (typeof code === "string")
        codes.push(code);
      current = current.cause;
    } else {
      messages.push(String(current));
      break;
    }
  }
  return { codes, messages };
}
function classifyAstGrepLoadFailure(err) {
  const { codes, messages } = collectErrorChain(err);
  const hasKnownGenuineMessage = messages.some((message) => KNOWN_GENUINE_NATIVE_LOAD_MESSAGES.some((pattern) => pattern.test(message)));
  if (hasKnownGenuineMessage)
    return "genuine";
  const hasTransientErrno = codes.some((code) => TRANSIENT_ERRNO_ALLOWLIST.has(code));
  return hasTransientErrno ? "transient" : "genuine";
}
function recordAstGrepUnavailableOnce(reason) {
  recordDegradationOnce({
    kind: "ast-grep-napi-unavailable",
    subject: "ast-grep-napi",
    reason: reason === "genuine" ? "native addon failed to load (durable for this session)" : "native addon load hit a transient error (durable for this session \u2014 see sgSessionHold doc)"
  });
}
async function loadSg() {
  if (sg)
    return sg;
  if (sgLoadPromise)
    return sgLoadPromise;
  if (sgSessionHold) {
    recordAstGrepUnavailableOnce(sgHoldReason ?? "genuine");
    return void 0;
  }
  const task = (async () => {
    try {
      const loaded = await loadAstGrepNapi();
      sg = loaded;
      return loaded;
    } catch (err) {
      const reason = classifyAstGrepLoadFailure(err);
      sgSessionHold = true;
      sgHoldReason = reason;
      recordAstGrepUnavailableOnce(reason);
      return void 0;
    }
  })();
  sgLoadPromise = task;
  void task.finally(() => {
    if (sgLoadPromise === task)
      sgLoadPromise = void 0;
  });
  return task;
}
function resetAstGrepNapiLoadState() {
  sgSessionHold = false;
  sgHoldReason = void 0;
}
var NAPI_LANGUAGE_BINDINGS = [
  // `.mts`/`.cts` and `.mjs`/`.cjs` are the same two grammars under a
  // module-system-flavored extension; leaving them off the old hand list meant
  // the whole catalog went dark on every ES/CommonJS module file (#2215).
  {
    ruleLanguage: "typescript",
    napiExport: "ts",
    extensions: [".ts", ".mts", ".cts"]
  },
  { ruleLanguage: "tsx", napiExport: "tsx", extensions: [".tsx"] },
  {
    ruleLanguage: "javascript",
    napiExport: "js",
    // `.jsx` stays on the `js` grammar it has always used here. The addon
    // also exports a separate `jsx`, but switching to it is a matching
    // change, not a coverage one, and belongs with its own fixtures.
    extensions: [".js", ".jsx", ".mjs", ".cjs"]
  },
  { ruleLanguage: "css", napiExport: "css", extensions: [".css"] },
  { ruleLanguage: "html", napiExport: "html", extensions: [".html", ".htm"] }
];
var BINDING_BY_EXTENSION = new Map(NAPI_LANGUAGE_BINDINGS.flatMap((binding) => binding.extensions.map((ext) => [ext, binding])));
var SUPPORTED_RULE_LANGUAGES = NAPI_LANGUAGE_BINDINGS.map((binding) => binding.ruleLanguage);
var AST_GREP_LSP_ONLY_RULE_LANGUAGES = [
  "c",
  "cpp",
  "csharp",
  "go",
  "java",
  "kotlin",
  "php",
  "python",
  "ruby",
  "rust",
  "scala",
  "swift"
];
var LSP_ONLY_RULE_LANGUAGES = new Set(AST_GREP_LSP_ONLY_RULE_LANGUAGES);
function deliveryRouteForRuleLanguage(ruleLanguage) {
  if (SUPPORTED_RULE_LANGUAGES.includes(ruleLanguage))
    return "napi";
  return LSP_ONLY_RULE_LANGUAGES.has(ruleLanguage) ? "ast-grep-lsp-cli" : "unclassified";
}
function skipRouteFor(key2) {
  return key2.startsWith("mismatch:") ? "napi" : deliveryRouteForRuleLanguage(key2);
}
var MAX_MATCHES_PER_RULE = 10;
var MAX_TOTAL_DIAGNOSTICS = 50;
var LINTER_OVERLAP = /* @__PURE__ */ new Set([
  "getter-return",
  "no-array-constructor",
  "no-async-promise-executor",
  "no-await-in-loop",
  "no-case-declarations",
  "no-compare-neg-zero",
  "no-cond-assign",
  "no-constant-condition",
  "no-constructor-return",
  "no-dupe-args",
  "no-dupe-keys",
  "no-extra-boolean-cast",
  "no-new-symbol",
  "no-new-wrappers",
  "no-prototype-builtins"
]);
var NON_SUPPRESSIBLE = /* @__PURE__ */ new Set([
  "empty-catch",
  "no-discarded-error",
  "unchecked-throwing-call"
]);
function defaultFixSuggestion(defectClass, ruleId) {
  if (defectClass === "silent-error") {
    return "Handle the error path explicitly: log context and rethrow or return a typed error result.";
  }
  if (defectClass === "secrets") {
    return "Remove hardcoded secret material and load values from env/secret manager.";
  }
  if (defectClass === "injection") {
    return "Avoid dynamic execution/interpolation here; use parameterized APIs or strict allowlists.";
  }
  if (defectClass === "async-misuse") {
    return "Make async flow explicit: await consistently and handle rejection/error paths.";
  }
  if (ruleId.includes("unsafe") || ruleId.includes("security")) {
    return "Refactor to a safer API usage with explicit validation and bounded behavior.";
  }
  return "Refactor this pattern to the safer equivalent used in the codebase.";
}
function explicitRuleFixSuggestion(rule) {
  const raw = (rule.fix ?? rule.note ?? "").trim();
  if (!raw)
    return void 0;
  const oneLine = raw.replace(/\s+/g, " ").trim();
  return oneLine.length > 240 ? `${oneLine.slice(0, 237)}...` : oneLine;
}
function normalizeRuleId2(ruleId) {
  return ruleId.replace(/-js$/, "");
}
function canHandle(filePath) {
  return BINDING_BY_EXTENSION.has(path6.extname(filePath).toLowerCase());
}
function ruleLanguageForFile(filePath) {
  return BINDING_BY_EXTENSION.get(path6.extname(filePath).toLowerCase())?.ruleLanguage;
}
function getLang(filePath, sgModule) {
  const binding = BINDING_BY_EXTENSION.get(path6.extname(filePath).toLowerCase());
  if (!binding)
    return void 0;
  const lang = sgModule[binding.napiExport];
  if (!lang) {
    recordDegradationOnce({
      kind: "ast-grep-napi-language-unavailable",
      subject: binding.ruleLanguage,
      reason: `@ast-grep/napi exposes no "${binding.napiExport}" grammar; every ${binding.ruleLanguage} rule is skipped in-process this session`
    });
  }
  return lang;
}
var MAX_SCRIPT_BODIES_EVALUATED = 64;
var MAX_SCRIPT_BODY_BYTES_EVALUATED = 128 * 1024;
function computeLineStartsUtf16(content) {
  const starts = [0];
  for (let i = 0; i < content.length; i++) {
    if (content.charCodeAt(i) === 10)
      starts.push(i + 1);
  }
  return starts;
}
function filePositionForIndex(lineStarts, index) {
  let lo = 0;
  let hi = lineStarts.length - 1;
  while (lo < hi) {
    const mid = lo + hi + 1 >> 1;
    if (lineStarts[mid] <= index)
      lo = mid;
    else
      hi = mid - 1;
  }
  return { line: lo, column: index - lineStarts[lo] };
}
function collectHtmlScriptInjections(htmlRoot, sgModule) {
  const addon = sgModule;
  if (!addon.js) {
    return {
      injections: [],
      scriptElementCount: 0,
      bodiesEvaluated: 0,
      truncatedBodies: 0,
      parseFailures: 0,
      missingJsGrammar: true,
      htmlScanFailure: false
    };
  }
  let scripts;
  try {
    scripts = htmlRoot.findAll({ rule: { kind: "script_element" } });
  } catch {
    return {
      injections: [],
      scriptElementCount: 0,
      bodiesEvaluated: 0,
      truncatedBodies: 0,
      parseFailures: 0,
      missingJsGrammar: false,
      htmlScanFailure: true
    };
  }
  let scriptElementCount = 0;
  const candidates = [];
  for (const element of scripts) {
    scriptElementCount += 1;
    let raw;
    for (const child of element.children()) {
      if (child.kind() === "raw_text") {
        raw = child;
        break;
      }
    }
    if (!raw)
      continue;
    const body = raw.text();
    if (!body.trim())
      continue;
    candidates.push({
      body,
      startIndex: raw.range().start.index
    });
  }
  let budgetedBytes = 0;
  const selected = [];
  let truncatedBodies = 0;
  for (const candidate of candidates) {
    const bytes = Buffer.byteLength(candidate.body, "utf8");
    if (selected.length >= MAX_SCRIPT_BODIES_EVALUATED || budgetedBytes + bytes > MAX_SCRIPT_BODY_BYTES_EVALUATED) {
      truncatedBodies += 1;
      continue;
    }
    selected.push(candidate);
    budgetedBytes += bytes;
  }
  const injections = [];
  let parseFailures = 0;
  for (const candidate of selected) {
    try {
      const root = addon.js.parse(candidate.body).root();
      injections.push({
        body: candidate.body,
        startIndex: candidate.startIndex,
        root
      });
    } catch {
      parseFailures += 1;
    }
  }
  return {
    injections,
    scriptElementCount,
    bodiesEvaluated: selected.length,
    truncatedBodies,
    parseFailures,
    missingJsGrammar: false,
    htmlScanFailure: false
  };
}
function emitHtmlScriptDegradations(filePath, result) {
  if (result.missingJsGrammar) {
    recordDegradationOnce({
      kind: "ast-grep-napi-html-js-grammar-missing",
      subject: filePath,
      reason: "addon exposes no js grammar; embedded <script> coverage dropped"
    });
  }
  if (result.htmlScanFailure) {
    recordDegradationOnce({
      kind: "ast-grep-napi-html-script-scan-failed",
      subject: filePath,
      reason: "script_element enumeration failed; embedded <script> coverage dropped"
    });
  }
  if (result.parseFailures > 0) {
    incrementDegradationCount({
      kind: "ast-grep-napi-html-script-parse-failed",
      subject: filePath,
      reason: `${result.parseFailures} of ${result.bodiesEvaluated} script bodies refused to parse as JS`,
      metadata: {
        scriptElementCount: result.scriptElementCount,
        parseFailures: result.parseFailures
      }
    });
  }
  if (result.truncatedBodies > 0) {
    incrementDegradationCount({
      kind: "ast-grep-napi-html-script-budget",
      subject: filePath,
      reason: `script budget truncated coverage: ${result.bodiesEvaluated}/${result.scriptElementCount} bodies evaluated, ${result.truncatedBodies} dropped`,
      metadata: {
        scriptElementCount: result.scriptElementCount,
        bodiesEvaluated: result.bodiesEvaluated,
        truncatedBodies: result.truncatedBodies
      }
    });
  }
}
function duplicateRuleIds(rules2) {
  const counts = /* @__PURE__ */ new Map();
  for (const rule of rules2) {
    counts.set(rule.id, (counts.get(rule.id) ?? 0) + 1);
  }
  return Array.from(counts).filter(([, count]) => count > 1).map(([id]) => id).sort((a, b) => a.localeCompare(b));
}
function appendDuplicateRuleDiagnostics(diagnostics, duplicateIds, source, filePath, maxTotalDiagnostics) {
  const sourceLabel = `${source.origin} ${source.tier} rules`;
  for (const ruleId of duplicateIds) {
    diagnostics.push({
      id: `ast-grep-napi-config-duplicate-${source.origin}-${source.tier}-${ruleId}`,
      message: `Duplicate ast-grep rule id "${ruleId}" in ${sourceLabel}`,
      filePath,
      line: 1,
      column: 1,
      severity: "error",
      semantic: "blocking",
      tool: "ast-grep-napi",
      rule: ruleId,
      defectClass: "correctness",
      fixable: false,
      autoFixAvailable: false,
      fixSuggestion: `Give every rule in ${sourceLabel} a unique id`
    });
    if (diagnostics.length >= maxTotalDiagnostics)
      return true;
  }
  return false;
}
var DIAGNOSTIC_SEVERITY_TIERS = /* @__PURE__ */ new Set([
  "error",
  "warning",
  "info",
  "hint"
]);
function normalizeRuleSeverity(raw) {
  const tier = raw;
  return tier && DIAGNOSTIC_SEVERITY_TIERS.has(tier) ? tier : "warning";
}
function evaluateAstGrepRules(filePath, rootNode, cwd, kind, options = {}) {
  const maxMatchesPerRule = options.maxMatchesPerRule ?? MAX_MATCHES_PER_RULE;
  const maxTotalDiagnostics = options.maxTotalDiagnostics ?? MAX_TOTAL_DIAGNOSTICS;
  const blockingOnly = options.blockingOnly === true;
  const log = options.log;
  const unsupportedLanguageLog = options.unsupportedLanguageLog ?? defaultUnsupportedLanguageLog;
  const diagnostics = [];
  const suppressLinterOverlap = kind === "jsts" && hasEslintConfig(cwd);
  const fileLang = ruleLanguageForFile(filePath);
  const htmlCollection = fileLang === "html" && options.content !== void 0 && options.sgModule !== void 0 ? collectHtmlScriptInjections(rootNode, options.sgModule) : {
    injections: [],
    scriptElementCount: 0,
    bodiesEvaluated: 0,
    truncatedBodies: 0,
    parseFailures: 0,
    missingJsGrammar: false,
    htmlScanFailure: false
  };
  const htmlInjections = htmlCollection.injections;
  emitHtmlScriptDegradations(filePath, htmlCollection);
  const fileLineStarts = htmlInjections.length > 0 && options.content !== void 0 ? computeLineStartsUtf16(options.content) : [];
  const newlyUnsupported = /* @__PURE__ */ new Map();
  const flushUnsupportedRuleSkips = () => {
    if (newlyUnsupported.size === 0)
      return;
    const firstSeenLanguages = Array.from(newlyUnsupported.entries()).filter(([language]) => !unsupportedLanguageLog.has(language));
    for (const [language] of firstSeenLanguages) {
      unsupportedLanguageLog.add(language);
    }
    if (firstSeenLanguages.length === 0) {
      newlyUnsupported.clear();
      return;
    }
    for (const [language] of firstSeenLanguages)
      unsupportedLanguageLog.add(language);
    logLatency({
      type: "phase",
      phase: "astgrep_napi_unsupported_rules_skipped",
      filePath,
      durationMs: 0,
      metadata: {
        skippedByLanguage: Object.fromEntries(firstSeenLanguages.map(([language, ruleIds]) => [
          language,
          {
            count: ruleIds.length,
            ruleIds: ruleIds.slice(0, UNSUPPORTED_RULE_ID_SAMPLE_SIZE),
            // #2215: a skip count alone says a rule did not run and
            // nothing about whether it runs anywhere else. `route` names
            // the delivery path (`ast-grep-lsp-cli` for the twelve
            // grammar-less catalog languages); `unclassified` means rules
            // ship for a language nobody decided a route for, which is the
            // class this issue closed regrowing.
            route: skipRouteFor(language),
            // #2347 observability: on an HTML file the per-language skip
            // count is only part of the picture — `mismatch:*->html`
            // entries name a rule family that never enters scripts, and
            // `htmlInlineScriptCount` says whether the file offered any
            // script bodies to enter. A `javascript->html` mismatch here
            // is necessarily `0` (JS rules RUN when scripts exist), so the
            // field makes "no injection target" distinguishable from the
            // same key on a plain non-HTML file, keeping the residual
            // coverage gap countable in production.
            ...fileLang === "html" ? { htmlInlineScriptCount: htmlInjections.length } : {}
          }
        ]))
      }
    });
    newlyUnsupported.clear();
  };
  const ignoreRoot = options.projectRoot ?? cwd;
  const catalog = buildEffectiveAstGrepCatalog(ignoreRoot);
  for (const { source, rules: rules2 } of catalog.sources) {
    const duplicates = duplicateRuleIds(rules2);
    if (appendDuplicateRuleDiagnostics(diagnostics, duplicates, source, filePath, maxTotalDiagnostics)) {
      flushUnsupportedRuleSkips();
      return diagnostics;
    }
    const duplicateSet = new Set(duplicates);
    for (const rule of rules2) {
      if (duplicateSet.has(rule.id))
        continue;
      if (catalog.effectiveRules.get(rule.id)?.rule !== rule)
        continue;
      if (ruleIgnoredForPath(rule.id, filePath, ignoreRoot, options.rulePolicy))
        continue;
      if (blockingOnly && rule.severity !== "error")
        continue;
      if (isRuleIgnoredForPath(filePath, ignoreRoot, rule.ignores))
        continue;
      if (suppressLinterOverlap && LINTER_OVERLAP.has(normalizeRuleId2(rule.id)) && !NON_SUPPRESSIBLE.has(normalizeRuleId2(rule.id))) {
        continue;
      }
      if (rule.rule && isOverlyBroadPattern(rule.rule.pattern) && !isStructuredRule(rule)) {
        continue;
      }
      const lang = rule.language?.toLowerCase();
      if (lang && !SUPPORTED_RULE_LANGUAGES.includes(lang)) {
        if (!unsupportedLanguageLog.has(lang)) {
          const ids = newlyUnsupported.get(lang) ?? [];
          ids.push(rule.id);
          newlyUnsupported.set(lang, ids);
        }
        continue;
      }
      const runsInsideHtmlScript = fileLang === "html" && lang === "javascript" && htmlInjections.length > 0;
      if (lang && fileLang && lang !== fileLang) {
        const runsAsTsOnTsx = fileLang === "tsx" && lang === "typescript";
        if (!runsAsTsOnTsx && !runsInsideHtmlScript) {
          const key2 = `mismatch:${lang}->${fileLang}`;
          if (!unsupportedLanguageLog.has(key2)) {
            const ids = newlyUnsupported.get(key2) ?? [];
            ids.push(rule.id);
            newlyUnsupported.set(key2, ids);
          }
          continue;
        }
      }
      if (blockingOnly && rule.rule) {
        const complexity = calculateRuleComplexity(rule.rule);
        if (complexity > MAX_BLOCKING_RULE_COMPLEXITY) {
          continue;
        }
      }
      if (!rule.rule)
        continue;
      try {
        const scopes = runsInsideHtmlScript ? htmlInjections.map((injection) => ({
          root: injection.root,
          position(match) {
            const start = match.range().start;
            return filePositionForIndex(fileLineStarts, injection.startIndex + start.index);
          }
        })) : [
          {
            root: rootNode,
            position(match) {
              const start = match.range().start;
              return { line: start.line, column: start.column };
            }
          }
        ];
        const nativeConfig = { rule: rule.rule };
        if (rule.constraints)
          nativeConfig.constraints = rule.constraints;
        if (rule.utils)
          nativeConfig.utils = rule.utils;
        const collected = [];
        let rejectLogged = false;
        for (const scope of scopes) {
          let found;
          try {
            found = scope.root.findAll(nativeConfig);
          } catch (err) {
            if (!rejectLogged) {
              rejectLogged = true;
              log?.(`ast-grep-napi: rule "${rule.id}" rejected by native engine (${err instanceof Error ? err.message : String(err)})`);
            }
            continue;
          }
          for (const match of found) {
            if (collected.length >= maxMatchesPerRule)
              break;
            collected.push({ match, position: scope.position(match) });
          }
          if (collected.length >= maxMatchesPerRule)
            break;
        }
        for (const { position } of collected) {
          if (diagnostics.length >= maxTotalDiagnostics)
            break;
          const severity = normalizeRuleSeverity(rule.severity);
          const semantic = severity === "error" ? "blocking" : "warning";
          const defectClass = classifyDefect(rule.id, "ast-grep-napi", rule.message || rule.id);
          const ruleFix = explicitRuleFixSuggestion(rule);
          diagnostics.push({
            id: `ast-grep-napi-${position.line}-${rule.id}`,
            message: `[${rule.metadata?.category || "slop"}] ${rule.message || rule.id}`,
            filePath,
            line: position.line + 1,
            column: position.column + 1,
            severity,
            semantic,
            tool: "ast-grep-napi",
            rule: rule.id,
            defectClass,
            fixable: !!ruleFix,
            autoFixAvailable: false,
            fixKind: ruleFix ? "suggestion" : void 0,
            fixSuggestion: semantic === "blocking" ? ruleFix ?? defaultFixSuggestion(defectClass, rule.id) : ruleFix
          });
        }
        if (diagnostics.length >= maxTotalDiagnostics)
          break;
      } catch {
      }
    }
  }
  flushUnsupportedRuleSkips();
  return diagnostics;
}
var astGrepNapiRunner = {
  id: "ast-grep-napi",
  appliesTo: ["jsts", "css", "html"],
  priority: PRIORITY.SPECIALIZED_ANALYSIS,
  skipTestFiles: true,
  async run(ctx) {
    if (!canHandle(ctx.filePath)) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const astGrepLspEnabled = enabledAuxiliaryLspServerIds((f) => ctx.pi?.getFlag?.(f)).includes("ast-grep");
    const astGrepLspPublished = astGrepLspEnabled ? await hasAuxiliaryLspPublishedForRoot("ast-grep", ctx.filePath) : false;
    if (astGrepLspEnabled && astGrepLspPublished) {
      if (hasPendingAuxiliaryCoverage(ctx.filePath, "ast-grep")) {
        incrementDegradationCount({
          kind: "aux-runner-findings-lost",
          subject: "ast-grep",
          // #3704/#3696: retain the complete diagnostic before the
          // unbounded file path reaches truncateForLedger.
          reason: `Gate B skipped napi: pending late-auxiliary pair from an EARLIER touch remains undelivered while prior publication satisfies per-file gate (file: ${ctx.filePath})`
        });
      }
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const sgModule = await loadSg();
    if (!sgModule) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    if (!fs4.existsSync(ctx.filePath)) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const lang = getLang(ctx.filePath, sgModule);
    if (!lang) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    let stats;
    try {
      stats = fs4.statSync(ctx.filePath);
    } catch {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    if (stats.size > 1024 * 1024) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    let content;
    const contentFromFacts = ctx.facts.getFileFact(ctx.filePath, "file.content");
    if (contentFromFacts !== void 0 && contentFromFacts !== null) {
      content = contentFromFacts;
    } else {
      try {
        content = fs4.readFileSync(ctx.filePath, "utf-8");
      } catch {
        return { status: "skipped", diagnostics: [], semantic: "none" };
      }
    }
    let root;
    try {
      root = lang.parse(content);
    } catch {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    let rootNode;
    try {
      rootNode = root.root();
    } catch {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const runningAsLspSubstitute = astGrepLspEnabled && !astGrepLspPublished;
    if (runningAsLspSubstitute) {
      recordNapiFallbackCoverage(ctx.filePath);
      clearPendingAuxiliaryCoverage(ctx.filePath, "ast-grep");
    }
    const diagnostics = evaluateAstGrepRules(ctx.filePath, rootNode, ctx.cwd, ctx.kind, {
      blockingOnly: runningAsLspSubstitute ? false : ctx.blockingOnly,
      projectRoot: ctx.projectRoot,
      rulePolicy: ctx.rulePolicy,
      log: (message) => ctx.log(message),
      content,
      sgModule
    });
    if (runningAsLspSubstitute) {
      const bySeverity = {};
      for (const d of diagnostics) {
        bySeverity[d.severity] = (bySeverity[d.severity] ?? 0) + 1;
      }
      logLatency({
        type: "phase",
        phase: "astgrep_napi_substitute_floor",
        filePath: ctx.filePath,
        durationMs: 0,
        metadata: {
          floor: "lsp-equivalent",
          ctxBlockingOnly: ctx.blockingOnly === true,
          diagnosticCount: diagnostics.length,
          bySeverity
        }
      });
    }
    const hasBlocking = diagnostics.some((d) => d.semantic === "blocking");
    let semantic = "none";
    if (hasBlocking) {
      semantic = "blocking";
    } else if (diagnostics.length > 0) {
      semantic = "warning";
    }
    return findingsResult(diagnostics, {
      status: hasBlocking ? "failed" : "succeeded",
      semantic
    });
  }
};
var ast_grep_napi_default = astGrepNapiRunner;

// dist/clients/review-graph/service.js
var CHANGED_SYMBOLS_PREFIX = "session.reviewGraph.changedSymbols:";
var ENTITY_SNAPSHOT_PREFIX = "session.reviewGraph.entitySnapshot:";
async function buildOrUpdateGraph2(cwd, changedFiles, facts, seqHint) {
  return buildOrUpdateGraph(cwd, changedFiles, facts, seqHint);
}
function computeImpactCascade2(graph, changedFile, cwd) {
  const moduleGraph = cwd ? buildModuleGraph(cwd) : null;
  return computeImpactCascade(graph, changedFile, moduleGraph);
}
function recordEntitySnapshotDiff(facts, filePath, nextSnapshot) {
  if (!isAbsoluteFilePath(filePath)) {
    recordDegradationOnce({
      kind: "review-graph-non-absolute-entity-path",
      subject: filePath,
      reason: "recordEntitySnapshotDiff requires an absolute filePath (refs #2477)"
    });
    return { added: [], removed: [], modified: [] };
  }
  const normalizedFilePath = normalizeMapKey(filePath);
  const snapshotKey = `${ENTITY_SNAPSHOT_PREFIX}${normalizedFilePath}`;
  const changedSymbolsKey = `${CHANGED_SYMBOLS_PREFIX}${normalizedFilePath}`;
  const stored = facts.getBoundedSessionFact(snapshotKey);
  if (stored === void 0 && facts.wasBoundedSessionFactEvicted(snapshotKey)) {
    facts.setBoundedSessionFact(snapshotKey, new Map(nextSnapshot));
    facts.setBoundedSessionFact(changedSymbolsKey, []);
    return { added: [], removed: [], modified: [] };
  }
  const prev = stored ?? /* @__PURE__ */ new Map();
  const added = [];
  const removed = [];
  const modified = [];
  for (const [key2, value] of nextSnapshot.entries()) {
    if (!prev.has(key2))
      added.push(key2);
    else if (prev.get(key2) !== value)
      modified.push(key2);
  }
  for (const key2 of prev.keys()) {
    if (!nextSnapshot.has(key2))
      removed.push(key2);
  }
  const changedSymbols = [
    ...new Set([...added, ...modified, ...removed].map((key2) => key2.split(":")[1]).filter(Boolean))
  ];
  facts.setBoundedSessionFact(snapshotKey, new Map(nextSnapshot));
  facts.setBoundedSessionFact(changedSymbolsKey, changedSymbols);
  return { added, removed, modified };
}

// dist/clients/dispatch/fact-scheduler.js
function scheduleProviders(providers2) {
  if (providers2.length <= 1)
    return providers2.slice();
  const factToProvider = /* @__PURE__ */ new Map();
  for (const p of providers2) {
    for (const key2 of p.provides) {
      factToProvider.set(key2, p);
    }
  }
  const inDegree = /* @__PURE__ */ new Map();
  const dependents = /* @__PURE__ */ new Map();
  for (const p of providers2) {
    if (!inDegree.has(p.id))
      inDegree.set(p.id, 0);
    if (!dependents.has(p.id))
      dependents.set(p.id, /* @__PURE__ */ new Set());
  }
  for (const p of providers2) {
    const seenDeps = /* @__PURE__ */ new Set();
    for (const req of p.requires) {
      const dep = factToProvider.get(req);
      if (dep && dep.id !== p.id && !seenDeps.has(dep.id)) {
        seenDeps.add(dep.id);
        inDegree.set(p.id, (inDegree.get(p.id) ?? 0) + 1);
        dependents.get(dep.id).add(p.id);
      }
    }
  }
  const idToProvider = new Map(providers2.map((p) => [p.id, p]));
  let wave = providers2.filter((p) => (inDegree.get(p.id) ?? 0) === 0).sort((a, b) => a.id.localeCompare(b.id));
  const result = [];
  while (wave.length > 0) {
    const nextWave = [];
    for (const p of wave) {
      result.push(p);
      for (const depId of dependents.get(p.id) ?? []) {
        const newDegree = (inDegree.get(depId) ?? 0) - 1;
        inDegree.set(depId, newDegree);
        if (newDegree === 0) {
          nextWave.push(idToProvider.get(depId));
        }
      }
    }
    nextWave.sort((a, b) => a.id.localeCompare(b.id));
    wave = nextWave;
  }
  if (result.length < providers2.length) {
    const cycleParticipants = providers2.filter((p) => !result.includes(p)).map((p) => p.id).sort((a, b) => a.localeCompare(b));
    throw new Error(`Cycle detected among FactProviders: ${cycleParticipants.join(", ")}`);
  }
  return result;
}

// dist/clients/dispatch/fact-runner.js
var providers = [];
function registerProvider(p) {
  providers.push(p);
}
async function runProviders(ctx) {
  const applicable = providers.filter((p) => p.appliesTo(ctx));
  const ordered = scheduleProviders(applicable);
  for (const provider of ordered) {
    const allPresent = provider.provides.every((key2) => ctx.facts.hasFileFact(ctx.filePath, key2));
    if (allPresent)
      continue;
    await provider.run(ctx, ctx.facts);
  }
}

// dist/clients/dispatch/facts/comment-facts.js
var commentFactProvider = {
  id: "fact.file.comments",
  provides: ["file.comments"],
  requires: ["file.content"],
  appliesTo(ctx) {
    return /\.tsx?$/.test(ctx.filePath);
  },
  async run(ctx, store) {
    await extractFactsFromTree(ctx, store, commentFactProvider.id, { "file.comments": [] }, (root) => {
      const comments = [];
      walk(root, (node) => {
        if (node.type === "comment") {
          comments.push({
            line: node.startPosition.row + 1,
            text: node.text
          });
        }
      });
      return { "file.comments": comments };
    });
  }
};

// dist/clients/dispatch/facts/try-catch-facts.js
function hasAssignmentExpression(node) {
  if (!node)
    return false;
  let found = false;
  walk(node, (n) => {
    if (n.type === "assignment_expression")
      found = true;
  });
  return found;
}
function isOnlyWhitespaceOrComments(text) {
  let stripped = text.replace(/\/\*[\s\S]*?\*\//g, "");
  stripped = stripped.replace(/\/\/[^\n]*/g, "");
  return stripped.trim().length === 0;
}
var DEFAULT_VALUE_PATTERN = /\breturn\s+(null|undefined|false|true|0|""|''|``|\[\]|\{\}|new\s+\w+\(\))/;
var STRUCTURED_ERROR_PATTERN = /\breturn\s+\{[^}]*(?:success\s*:\s*false|error\s*:)/;
var EXPLAINING_COMMENT_PATTERN = /(?:\/\/\s*\S.{3,}|\/\*\s*\S[\s\S]{3,}?\*\/)/;
var FS_PROBE_PATTERN = /\b(?:existsSync|statSync|lstatSync|readFileSync|accessSync)\b/;
var DB_PATTERN = /\b(?:query|execute|findOne|findMany|findById|insert|update|delete|select|prisma\.|knex\.|sequelize\.)/;
var NETWORK_PATTERN = /\b(?:fetch|axios|http\.|https\.|request\.|got\.|undici\.)/;
var FS_PATTERN = /\b(?:readFileSync?|writeFileSync?|appendFileSync?|readdirSync?|mkdirSync?|statSync?|unlinkSync?|existsSync|accessSync?|copyFileSync?|renameSync?)\b/;
var PROCESS_PATTERN = /\b(?:spawn|exec|execSync|spawnSync|child_process\.)\b/;
function detectBoundaryCategory(tryText) {
  if (DB_PATTERN.test(tryText))
    return "db";
  if (NETWORK_PATTERN.test(tryText))
    return "network";
  if (FS_PATTERN.test(tryText))
    return "fs";
  if (PROCESS_PATTERN.test(tryText))
    return "process";
  return "none";
}
function detectTryResolvesLocalValues(tryText) {
  const hasAwait = /\bawait\b/.test(tryText);
  const hasIO = DB_PATTERN.test(tryText) || NETWORK_PATTERN.test(tryText) || FS_PATTERN.test(tryText) || PROCESS_PATTERN.test(tryText);
  return !hasAwait && !hasIO;
}
var tryCatchFactProvider = {
  id: "tryCatchFacts",
  provides: ["file.tryCatchSummaries"],
  requires: ["file.content"],
  appliesTo(ctx) {
    return /\.tsx?$/.test(ctx.filePath);
  },
  async run(ctx, store) {
    await extractFactsFromTree(ctx, store, tryCatchFactProvider.id, { "file.tryCatchSummaries": [] }, (root) => {
      const summaries = [];
      walk(root, (node) => {
        if (node.type !== "try_statement")
          return;
        const tryBlock = firstChildOfType(node, "statement_block");
        const catchClause = firstChildOfType(node, "catch_clause");
        if (!tryBlock || !catchClause)
          return;
        const tryText = tryBlock.text;
        const tryResolvesLocalValues = detectTryResolvesLocalValues(tryText);
        const boundaryCategory = detectBoundaryCategory(tryText);
        const paramNode = firstChildOfType(catchClause, "identifier");
        const catchParam = paramNode ? paramNode.text : null;
        const catchBody = firstChildOfType(catchClause, "statement_block");
        const bodyText = catchBody ? catchBody.text.replace(/^\{/, "").replace(/\}$/, "").trim() : "";
        const isEmpty = isOnlyWhitespaceOrComments(bodyText);
        const hasRethrow = /\bthrow\b/.test(bodyText);
        const hasLogging = /\bconsole\.(log|warn|error)\b/.test(bodyText) || /\blogger\./.test(bodyText);
        const catchReturnsDefault = DEFAULT_VALUE_PATTERN.test(bodyText);
        const catchReturnsStructuredError = STRUCTURED_ERROR_PATTERN.test(bodyText);
        const isDocumentedLocalFallback = EXPLAINING_COMMENT_PATTERN.test(bodyText);
        const catchHasFallbackAssignment = hasAssignmentExpression(catchBody);
        const catchLogsOnly = hasLogging && !hasRethrow && !catchReturnsDefault && !catchReturnsStructuredError && !/\b(?:set|update|notify|emit|dispatch|resolve|reject)\b/.test(bodyText);
        const isFilesystemExistenceProbe = boundaryCategory === "fs" && FS_PROBE_PATTERN.test(tryText) && catchReturnsDefault;
        summaries.push({
          line: catchClause.startPosition.row + 1,
          column: catchClause.startPosition.column + 1,
          catchParam,
          bodyText,
          isEmpty,
          hasRethrow,
          hasLogging,
          catchLogsOnly,
          catchReturnsDefault,
          catchReturnsStructuredError,
          isDocumentedLocalFallback,
          catchHasFallbackAssignment,
          tryResolvesLocalValues,
          isFilesystemExistenceProbe,
          boundaryCategory
        });
      });
      return { "file.tryCatchSummaries": summaries };
    });
  }
};

// dist/clients/dispatch/runners/actionlint.js
import path7 from "node:path";
var actionlint = createAvailabilityChecker("actionlint", ".exe");
function isGitHubWorkflowFile(filePath) {
  const normalized = filePath.replace(/\\/g, "/");
  return /(^|\/)\.github\/workflows\/[^/]+\.ya?ml$/i.test(normalized);
}
function toDiagnostic(issue, filePath) {
  const line = issue.line && issue.line > 0 ? issue.line : 1;
  const column = issue.column && issue.column > 0 ? issue.column : 1;
  const rule = issue.kind || "actionlint";
  const message = issue.message || "GitHub Actions workflow issue";
  const idMessage = message.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 80);
  return {
    id: `actionlint-${rule}-${line}-${column}-${idMessage}`,
    message,
    filePath,
    line,
    column,
    severity: "error",
    semantic: "blocking",
    tool: "actionlint",
    rule,
    defectClass: "correctness",
    matchedText: issue.snippet
  };
}
function parseActionlintJson(raw, filePath, cwd) {
  const trimmed = raw.trim();
  if (!trimmed)
    return [];
  const absTarget = path7.resolve(cwd, filePath);
  const isTarget = (issue) => !issue.filepath || pathsEqual(path7.resolve(cwd, issue.filepath), absTarget);
  try {
    const parsed = JSON.parse(trimmed);
    const issues = Array.isArray(parsed) ? parsed : [parsed];
    return issues.flatMap((issue) => isTarget(issue) ? [toDiagnostic(issue, filePath)] : []);
  } catch {
    const diagnostics = [];
    for (const line of trimmed.split(/\r?\n/)) {
      if (!line.trim())
        continue;
      try {
        const parsed = JSON.parse(line);
        if (!isTarget(parsed))
          continue;
        diagnostics.push(toDiagnostic(parsed, filePath));
      } catch {
      }
    }
    return diagnostics;
  }
}
var actionlintRunner = {
  id: "actionlint",
  appliesTo: ["yaml"],
  priority: PRIORITY.YAML_LINT + 1,
  skipTestFiles: false,
  when(ctx) {
    return isGitHubWorkflowFile(ctx.filePath);
  },
  async run(ctx) {
    const cwd = resolveRunnerCwd(ctx, "actionlint");
    let cmd = null;
    if (await actionlint.isAvailableAsync(cwd)) {
      cmd = actionlint.getCommand(cwd);
    } else {
      cmd = await resolveToolCommandWithInstallFallback(cwd, "actionlint");
    }
    if (!cmd)
      return { status: "skipped", diagnostics: [], semantic: "none" };
    const relativeFilePath = path7.relative(cwd, ctx.filePath) || ctx.filePath;
    const result = await safeSpawnAsync(cmd, ["-format", "{{json .}}", relativeFilePath], {
      cwd,
      timeout: 15e3
    });
    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
    const parsed = parseToolRun("actionlint", {
      result,
      output,
      // EXIT TABLE (actionlint 1.7.7 measured fixture): 0 clean; 1 findings; 2 error; other nonzero rejected.
      exitCodes: { ran: [1, 2] }
    }, (raw) => parseActionlintJson(raw, ctx.filePath, cwd));
    if (parsed.skipped)
      return parsed.skipped;
    return finishParsedRun({
      tool: "actionlint",
      ctx,
      result,
      diagnostics: parsed.diagnostics,
      classify: () => ({ status: "failed", semantic: "blocking" })
    });
  }
};
var actionlint_default = actionlintRunner;

// dist/clients/dispatch/runners/biome-check.js
import * as path8 from "node:path";
function normalizeBiomeSeverity(raw) {
  switch (raw) {
    case "error":
      return "error";
    case "info":
      return "info";
    case "hint":
      return "hint";
    case "warning":
      return "warning";
    default:
      return "warning";
  }
}
function biomeRuleNameFromCategory(category) {
  if (!category?.startsWith("lint/"))
    return void 0;
  const parts = category.split("/");
  return parts[parts.length - 1] || void 0;
}
function parseBiomeJson(raw, filePath, cwd, fixKindByRule) {
  try {
    const result = JSON.parse(raw);
    const diagnostics = result.diagnostics || [];
    const autofix = getAutofixCapability("biome");
    const absTarget = path8.resolve(cwd, filePath);
    return {
      diagnostics: diagnostics.flatMap((d) => {
        if (d.location?.path && !pathsEqual(path8.resolve(cwd, d.location.path), absTarget))
          return [];
        {
          const ruleName = biomeRuleNameFromCategory(d.category);
          const fixKind = ruleName ? fixKindByRule?.get(ruleName) : void 0;
          const isFixable = fixKind === "safe" || fixKind === "unsafe";
          return [
            {
              id: `biome:${d.category}:${d.location.start.line}`,
              message: d.message,
              filePath,
              line: d.location.start.line,
              column: d.location.start.column,
              severity: normalizeBiomeSeverity(d.severity),
              semantic: d.severity === "error" ? "blocking" : "warning",
              tool: "biome",
              rule: d.category,
              fixable: isFixable,
              // Mirrors `biomeClient.fixFileAsync`'s own `lint --write` call
              // (no `--unsafe`, clients/biome-client.ts): the pipeline only
              // ever applies SAFE fixes, so only "safe" earns autoFixAvailable.
              autoFixAvailable: fixKind === "safe" && (autofix?.safePipelineAutofix ?? false),
              fixKind: isFixable && autofix?.fixKind !== "none" ? autofix?.fixKind : void 0
            }
          ];
        }
      })
    };
  } catch (err) {
    return {
      diagnostics: [],
      parseError: err instanceof Error ? err.message : String(err)
    };
  }
}
var biomeFixKindCache = /* @__PURE__ */ new Map();
var BIOME_FIX_KIND_PATTERN = /^-\s*Fix:\s*(safe|unsafe)\s*$/m;
var BIOME_NO_FIX_PATTERN = /^-\s*No fix available\.\s*$/m;
var EXPLAIN_CONCURRENCY = 4;
async function resolveBiomeFixKinds(cmd, cwd, categories) {
  const resolved = /* @__PURE__ */ new Map();
  const ruleNames = /* @__PURE__ */ new Set();
  for (const category of categories) {
    const ruleName = biomeRuleNameFromCategory(category);
    if (ruleName)
      ruleNames.add(ruleName);
  }
  const toResolve = [];
  for (const ruleName of ruleNames) {
    const cacheKey = `${cmd}::${ruleName}`;
    const cached = biomeFixKindCache.get(cacheKey);
    if (cached === void 0) {
      toResolve.push(ruleName);
    } else {
      resolved.set(ruleName, cached);
    }
  }
  await mapWithConcurrency(toResolve, EXPLAIN_CONCURRENCY, async (ruleName) => {
    const cacheKey = `${cmd}::${ruleName}`;
    const spawned = await safeSpawnAsync(cmd, ["explain", ruleName], {
      timeout: 1e4,
      cwd
    });
    if (spawned.error || spawned.status !== 0) {
      incrementDegradationCount({
        kind: "biome-explain-unavailable",
        subject: ruleName,
        reason: spawned.error ? `spawn failed: ${spawned.error}` : `explain exited ${spawned.status}`
      });
      resolved.set(ruleName, "none");
      return;
    }
    const stdout = spawned.stdout || "";
    const fixMatch = stdout.match(BIOME_FIX_KIND_PATTERN);
    if (fixMatch) {
      const kind = fixMatch[1] === "safe" ? "safe" : "unsafe";
      biomeFixKindCache.set(cacheKey, kind);
      resolved.set(ruleName, kind);
      return;
    }
    if (BIOME_NO_FIX_PATTERN.test(stdout)) {
      biomeFixKindCache.set(cacheKey, "none");
      resolved.set(ruleName, "none");
      return;
    }
    incrementDegradationCount({
      kind: "biome-explain-unavailable",
      subject: ruleName,
      reason: "explain output matched neither the Fix nor No-fix pattern"
    });
    resolved.set(ruleName, "none");
  });
  return resolved;
}
var biomeCheckJsonRunner = {
  id: "biome-check-json",
  appliesTo: ["jsts"],
  priority: PRIORITY.FORMAT_AND_LINT_PRIMARY,
  async run(ctx) {
    const cwd = resolveRunnerCwd2(ctx, "biome");
    const policy = getJstsLintPolicyForCwd(cwd);
    if (!policy.hasBiomeConfig && policy.hasExplicitNonBiomeLinter) {
      return {
        status: "skipped",
        diagnostics: [],
        semantic: "none",
        skipReason: "configured-non-biome-linter"
      };
    }
    const cmd = await resolveToolCommandWithInstallFallback(cwd, "biome");
    if (!cmd) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const configArg = biomeConfigArgs(cwd);
    const checkResult = await safeSpawnAsync(cmd, [
      "lint",
      "--reporter=json",
      "--no-errors-on-unmatched",
      ...configArg,
      ctx.filePath
    ], { timeout: 3e4, cwd });
    if (checkResult.error) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    let fixKindByRule;
    if (checkResult.status === 0 || checkResult.status === 1) {
      let categories = [];
      try {
        const preParsed = JSON.parse(checkResult.stdout || "{}");
        categories = (preParsed.diagnostics || []).map((d) => d.category);
      } catch {
        categories = [];
      }
      fixKindByRule = await resolveBiomeFixKinds(cmd, cwd, categories);
    }
    const parsed = checkResult.status === 0 || checkResult.status === 1 ? parseBiomeJson(checkResult.stdout || "", ctx.filePath, cwd, fixKindByRule) : { diagnostics: [] };
    if (parsed.parseError) {
      const raw = checkResult.stdout || checkResult.stderr || "";
      const preview = raw.replace(/\s+/g, " ").slice(0, 160);
      const message = "Biome JSON parse failed: " + parsed.parseError + (preview ? " (output preview: " + preview + ")" : "");
      return {
        status: "failed",
        diagnostics: [
          {
            id: "biome:parse-error:1",
            message,
            filePath: ctx.filePath,
            line: 1,
            column: 1,
            severity: "warning",
            semantic: "warning",
            tool: "biome"
          }
        ],
        semantic: "warning",
        failureKind: "parser_error",
        failureMessage: message.slice(0, 200)
      };
    }
    return finishParsedRun({
      tool: "biome",
      ctx,
      result: checkResult,
      diagnostics: parsed.diagnostics
    });
  }
};
var biome_check_default = biomeCheckJsonRunner;

// dist/clients/dispatch/runners/cpp-check.js
import * as fs5 from "node:fs";
import * as path9 from "node:path";
var compilerCheckers = {
  clang: createAvailabilityChecker("clang", ".exe"),
  gcc: createAvailabilityChecker("gcc", ".exe"),
  cc: createAvailabilityChecker("cc", ".exe"),
  "clang++": createAvailabilityChecker("clang++", ".exe"),
  "g++": createAvailabilityChecker("g++", ".exe"),
  "c++": createAvailabilityChecker("c++", ".exe"),
  cl: createAvailabilityChecker("cl", ".exe")
};
var C_SOURCE_EXTENSIONS = /* @__PURE__ */ new Set([".c"]);
var C_HEADER_EXTENSIONS = /* @__PURE__ */ new Set([".h"]);
var CPP_SOURCE_EXTENSIONS = /* @__PURE__ */ new Set([
  ".c++",
  ".cc",
  ".cp",
  ".cpp",
  ".cxx",
  ".c++m",
  ".cppm",
  ".cxxm",
  ".ixx",
  ".cu",
  ".hip",
  ".mm",
  ".clcpp"
]);
var CPP_HEADER_EXTENSIONS = /* @__PURE__ */ new Set([
  ".hh",
  ".hpp",
  ".hxx",
  ".inl",
  ".ipp",
  ".tpp",
  ".txx"
]);
function headerLooksLikeCpp(absPath) {
  try {
    const content = fs5.readFileSync(absPath, "utf-8");
    return /\b(namespace|template|class|constexpr|concept|using)\b|std::|\b(public|private|protected)\s*:/.test(content);
  } catch {
    return false;
  }
}
function getGccLikeCandidates(absPath) {
  const ext = path9.extname(absPath).toLowerCase();
  const cMode = C_SOURCE_EXTENSIONS.has(ext) || C_HEADER_EXTENSIONS.has(ext) && !headerLooksLikeCpp(absPath);
  const cppMode = CPP_SOURCE_EXTENSIONS.has(ext) || CPP_HEADER_EXTENSIONS.has(ext);
  if (cMode) {
    const cArgs = C_HEADER_EXTENSIONS.has(ext) ? ["-x", "c-header", "-fsyntax-only", absPath] : ["-x", "c", "-fsyntax-only", absPath];
    return [
      { key: "clang", args: cArgs },
      { key: "gcc", args: cArgs },
      { key: "cc", args: cArgs }
    ];
  }
  if (cppMode || ext) {
    return [
      { key: "clang++", args: ["-fsyntax-only", absPath] },
      { key: "g++", args: ["-fsyntax-only", absPath] },
      { key: "c++", args: ["-fsyntax-only", absPath] }
    ];
  }
  return [];
}
async function resolveCompiler(absPath, cwd) {
  for (const candidate of getGccLikeCandidates(absPath)) {
    const checker = compilerCheckers[candidate.key];
    if (await checker.isAvailableAsync(cwd)) {
      const command = checker.getCommand(cwd) ?? candidate.key;
      return { command, args: candidate.args, flavor: "gcc" };
    }
  }
  const clChecker = compilerCheckers.cl;
  const clCmd = clChecker.getCommand(cwd);
  if (clCmd) {
    return {
      command: clCmd,
      args: ["/nologo", "/Zs", absPath],
      flavor: "msvc"
    };
  }
  const clProbe = await probeToolAsync("cl", [], { timeout: 5e3 });
  if (!clProbe.error && clProbe.status !== null) {
    return {
      command: "cl",
      args: ["/nologo", "/Zs", absPath],
      flavor: "msvc"
    };
  }
  return void 0;
}
function parseGccLikeOutput(raw, filePath, cwd) {
  const diagnostics = [];
  const absTarget = path9.resolve(cwd, filePath);
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^(.*?):(\d+):(?:(\d+):)?\s*(fatal error|error|warning|note):\s+(.+)$/i);
    if (!match)
      continue;
    const [, sourcePath, lineStr, colStr, severityLabel, message] = match;
    if (!pathsEqual(path9.resolve(cwd, sourcePath.trim()), absTarget))
      continue;
    const severity = severityLabel.toLowerCase().includes("error") ? "error" : "warning";
    diagnostics.push({
      id: `cpp-check-${severityLabel}-${lineStr}-${colStr || "1"}`,
      message: message.trim(),
      filePath,
      line: Number.parseInt(lineStr, 10) || 1,
      column: Number.parseInt(colStr || "1", 10) || 1,
      severity,
      // This single-file syntax check has no compile database, include path,
      // or build flags. It can inform, but cannot prove a project blocker.
      semantic: "warning",
      tool: "cpp-check",
      rule: severityLabel.toLowerCase(),
      fixable: false
    });
  }
  return diagnostics;
}
function parseMsvcOutput(raw, filePath, cwd) {
  const diagnostics = [];
  const absTarget = path9.resolve(cwd, filePath);
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^(.*)\((\d+)(?:,(\d+))?\):\s*(fatal error|error|warning)\s+([A-Z]+\d+):\s+(.+)$/i);
    if (!match)
      continue;
    const [, sourcePath, lineStr, colStr, severityLabel, rule, message] = match;
    if (!pathsEqual(path9.resolve(cwd, sourcePath.trim()), absTarget))
      continue;
    const severity = severityLabel.toLowerCase().includes("error") ? "error" : "warning";
    diagnostics.push({
      id: `cpp-check-${rule}-${lineStr}-${colStr || "1"}`,
      message: `[${rule}] ${message.trim()}`,
      filePath,
      line: Number.parseInt(lineStr, 10) || 1,
      column: Number.parseInt(colStr || "1", 10) || 1,
      severity,
      // MSVC is invoked with the same context-free single-file contract.
      semantic: "warning",
      tool: "cpp-check",
      rule,
      fixable: false
    });
  }
  return diagnostics;
}
var cppCheckRunner = {
  id: "cpp-check",
  appliesTo: ["cxx"],
  priority: PRIORITY.GENERAL_ANALYSIS,
  skipTestFiles: false,
  async run(ctx) {
    const cwd = resolveRunnerCwd(ctx, "cpp-check");
    const absPath = path9.resolve(cwd, ctx.filePath);
    const compiler = await resolveCompiler(absPath, cwd);
    if (!compiler) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const result = await safeSpawnAsync(compiler.command, compiler.args, {
      cwd,
      timeout: 3e4
    });
    const raw = `${result.stdout ?? ""}
${result.stderr ?? ""}`.trim();
    const parsed = parseToolRun("cpp-check", {
      result,
      output: raw,
      // EXIT TABLE (gcc/clang 13 measured fixture): 0 clean; 1 findings; 2 error; other nonzero rejected.
      exitCodes: { ran: [1, 2] }
    }, (output) => compiler.flavor === "msvc" ? parseMsvcOutput(output, ctx.filePath, cwd) : parseGccLikeOutput(output, ctx.filePath, cwd));
    if (parsed.skipped)
      return parsed.skipped;
    return finishParsedRun({
      tool: "cpp-check",
      ctx,
      result,
      diagnostics: parsed.diagnostics,
      classify: (diagnostics) => ({
        status: diagnostics.some((d) => d.severity === "error") ? "failed" : "succeeded",
        semantic: "warning"
      })
    });
  }
};
var cpp_check_default = cppCheckRunner;

// dist/clients/dispatch/runners/credo.js
import * as path10 from "node:path";
import * as fs6 from "node:fs";
var CREDO_PROBE_BUDGET_MS = 1e4;
var probeCredo = createCwdCachedProbe((cwd) => safeSpawnAsync("mix", ["credo", "--version"], {
  timeout: CREDO_PROBE_BUDGET_MS,
  cwd
}), { tool: "credo", budgetMs: CREDO_PROBE_BUDGET_MS });
function parseCredoJson(raw, fallbackPath, cwd) {
  try {
    const output = JSON.parse(raw);
    return (output.issues ?? []).map((issue) => ({
      id: `credo:${issue.check}:${issue.line_no}`,
      message: `[${issue.check}] ${issue.message}`,
      filePath: issue.filename && issue.filename.trim() ? path10.isAbsolute(issue.filename) ? issue.filename : path10.resolve(cwd, issue.filename) : fallbackPath,
      line: issue.line_no,
      column: issue.column ?? 1,
      severity: issue.priority <= 10 ? "error" : "warning",
      semantic: issue.priority <= 10 ? "blocking" : "warning",
      tool: "credo",
      rule: issue.check,
      fixable: false
    }));
  } catch {
    return [];
  }
}
function hasMixExs(cwd) {
  return fs6.existsSync(path10.join(cwd, "mix.exs"));
}
var credoRunner = {
  id: "credo",
  appliesTo: ["elixir"],
  priority: PRIORITY.GENERAL_ANALYSIS,
  skipTestFiles: false,
  async run(ctx) {
    const cwd = resolveRunnerCwd(ctx, "credo");
    if (!hasMixExs(cwd)) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    if (!await probeCredo(cwd)) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const absPath = path10.resolve(cwd, ctx.filePath);
    const result = await safeSpawnAsync("mix", ["credo", "--format", "json", "--strict", absPath], { timeout: 3e4, cwd });
    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
    const parsed = parseToolRun("credo", {
      result,
      output,
      // EXIT TABLE (Credo 1.7 measured fixture): 0 clean; 1 findings; 2 error; other nonzero rejected.
      exitCodes: { ran: [1, 2] }
    }, (raw) => parseCredoJson(raw, ctx.filePath, cwd));
    if (parsed.skipped)
      return parsed.skipped;
    return finishParsedRun({
      tool: "credo",
      ctx,
      result,
      diagnostics: parsed.diagnostics
    });
  }
};
var credo_default = credoRunner;

// dist/clients/dispatch/runners/cue-vet.js
import * as fs7 from "node:fs";
import * as path11 from "node:path";
var cue = createAvailabilityChecker("cue", ".exe", ["version"]);
function parseCueVetOutput(raw) {
  const errors = [];
  let current = null;
  for (const rawLine of raw.split(/\r?\n/)) {
    if (!rawLine.trim())
      continue;
    if (/^\s/.test(rawLine)) {
      if (current) {
        const loc = rawLine.trim().match(/^(.+):(\d+):(\d+)$/);
        if (loc) {
          current.locations.push({
            file: loc[1],
            line: Number.parseInt(loc[2], 10),
            column: Number.parseInt(loc[3], 10)
          });
        }
      }
      continue;
    }
    if (current)
      errors.push(current);
    current = { message: rawLine.replace(/:\s*$/, "").trim(), locations: [] };
  }
  if (current)
    errors.push(current);
  return errors;
}
function directoryScopeUnavailable(raw) {
  return /build constraints exclude all CUE files/.test(raw) || // The trailing location cue reports (`in "."` vs `in "two-packages"`)
  // depends on how it resolves the vet cwd, not on the shape of the
  // failure — verified both forms against the real binary — so only the
  // structural "found packages X and Y" part is matched.
  /found packages ".+"\s*\(.+\)\s+and\s+".+"\s*\(.+\)\s+in\s+".*"/.test(raw);
}
function hasPackageClause(content) {
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("@"))
      continue;
    return /^package\s+[A-Za-z_]\w*\b/.test(trimmed);
  }
  return false;
}
function locationMatchesFile(location, absTarget, vetCwd) {
  return pathsEqual(path11.resolve(vetCwd, location.file), absTarget);
}
function toDiagnostic2(id, message, fileName, line, column) {
  return {
    id,
    message: message || "cue vet reported an error",
    filePath: fileName,
    line,
    column,
    severity: "error",
    semantic: "blocking",
    tool: "cue-vet",
    rule: "vet",
    fixable: false
  };
}
function filterToTouchedFile(errors, fileName, vetCwd) {
  if (errors.length === 0)
    return void 0;
  const absTarget = path11.resolve(vetCwd, fileName);
  const withLocation = errors.filter((error) => error.locations.length > 0);
  const unattributable = errors.filter((error) => error.locations.length === 0);
  if (withLocation.length === 0)
    return void 0;
  const diagnostics = [];
  for (const error of withLocation) {
    const match = error.locations.find((location) => locationMatchesFile(location, absTarget, vetCwd));
    if (!match)
      continue;
    diagnostics.push(toDiagnostic2(`cue-vet-${diagnostics.length + 1}-${match.line}`, error.message, fileName, match.line, match.column));
  }
  for (const error of unattributable) {
    diagnostics.push(toDiagnostic2(`cue-vet-unattributed-${diagnostics.length + 1}`, error.message, fileName, 1, 1));
  }
  return diagnostics;
}
var cueVetRunner = {
  id: "cue-vet",
  appliesTo: ["cue"],
  priority: PRIORITY.GENERAL_ANALYSIS,
  skipTestFiles: false,
  timeoutMs: 3e4,
  async run(ctx) {
    const cwd = resolveRunnerCwd(ctx, "cue-vet");
    let cmd = null;
    if (await cue.isAvailableAsync(cwd)) {
      cmd = cue.getCommand(cwd);
    } else {
      cmd = await resolveAvailableOrInstall(cue, "cue", cwd);
    }
    if (!cmd)
      return { status: "skipped", diagnostics: [], semantic: "none" };
    const absPath = path11.resolve(cwd, ctx.filePath);
    const fileDir = path11.dirname(absPath);
    const fileName = path11.basename(absPath);
    const singleFileArgs = ["vet", "-c=false", `./${fileName}`];
    let touchedContent = null;
    try {
      touchedContent = fs7.readFileSync(absPath, "utf8");
    } catch {
      touchedContent = null;
    }
    const touchedIsPackageLess = touchedContent !== null && !hasPackageClause(touchedContent);
    let result;
    if (touchedIsPackageLess) {
      result = await safeSpawnAsync(cmd, [...singleFileArgs], {
        cwd: fileDir,
        timeout: 3e4
      });
    } else {
      result = await safeSpawnAsync(cmd, ["vet", "-c=false", "."], {
        cwd: fileDir,
        timeout: 3e4
      });
      if (!spawnFailedWithNoOutput(result, `${result.stdout}${result.stderr}`) && result.status !== 0 && directoryScopeUnavailable(`${result.stdout || ""}${result.stderr || ""}`)) {
        result = await safeSpawnAsync(cmd, [...singleFileArgs], {
          cwd: fileDir,
          timeout: 3e4
        });
      }
    }
    if (spawnFailedWithNoOutput(result, `${result.stdout}${result.stderr}`)) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    if (result.status === 0) {
      return { status: "succeeded", diagnostics: [], semantic: "none" };
    }
    const raw = `${result.stdout || ""}
${result.stderr || ""}`.trim();
    const errors = parseCueVetOutput(raw);
    const filtered = filterToTouchedFile(errors, fileName, fileDir);
    if (filtered === void 0) {
      const message = raw.slice(0, 300) || "cue vet exited non-zero";
      return {
        status: "failed",
        diagnostics: [
          {
            id: "cue-vet-unparsed",
            message,
            filePath: ctx.filePath,
            line: 1,
            column: 1,
            severity: "error",
            semantic: "blocking",
            tool: "cue-vet",
            rule: "vet",
            fixable: false
          }
        ],
        semantic: "blocking",
        failureKind: "unconfirmed_output",
        failureMessage: message.slice(0, 200)
      };
    }
    if (filtered.length === 0) {
      return { status: "succeeded", diagnostics: [], semantic: "none" };
    }
    return findingsResult(filtered, { status: "failed", semantic: "blocking" });
  }
};
var cue_vet_default = cueVetRunner;

// dist/clients/dispatch/runners/dart-analyze.js
import * as path12 from "node:path";
var dart = createAvailabilityChecker("dart", ".exe");
var flutter = createAvailabilityChecker("flutter", ".bat");
var DART_FIXABLE_RULES = /* @__PURE__ */ new Set([
  // const / final canonicalization
  "prefer_const_constructors",
  "prefer_const_constructors_in_immutables",
  "prefer_const_declarations",
  "prefer_const_literals_to_create_immutables",
  "prefer_final_fields",
  "prefer_final_in_for_each",
  "prefer_final_locals",
  "prefer_final_parameters",
  "unnecessary_const",
  "unnecessary_final",
  "unnecessary_new",
  // null-aware / null safety modernization
  "avoid_init_to_null",
  "avoid_null_checks_in_equality_operators",
  "avoid_returning_null_for_void",
  "null_closures",
  "prefer_if_null_operators",
  "prefer_null_aware_operators",
  "unnecessary_null_aware_assignments",
  "unnecessary_null_in_if_null_operators",
  // string / quoting / interpolation
  "prefer_adjacent_string_concatenation",
  "prefer_interpolation_to_compose_strings",
  "prefer_single_quotes",
  "unnecessary_brace_in_string_interps",
  "unnecessary_string_escapes",
  "unnecessary_string_interpolations",
  "use_raw_strings",
  "use_string_buffers",
  // collection literals / spread / where
  "prefer_collection_literals",
  "prefer_contains",
  "prefer_for_elements_to_map_fromiterable",
  "prefer_inlined_adds",
  "prefer_int_literals",
  "prefer_iterable_whereType",
  "prefer_is_empty",
  "prefer_is_not_empty",
  "prefer_is_not_operator",
  "prefer_spread_collections",
  "use_collection_literals_when_possible",
  // types / generics / function syntax
  "omit_local_variable_types",
  "prefer_expression_function_bodies",
  "prefer_function_declarations_over_variables",
  "prefer_generic_function_type_aliases",
  "prefer_typing_uninitialized_variables",
  "prefer_void_to_null",
  "type_init_formals",
  "use_function_type_syntax_for_parameters",
  // redundancy / cleanup
  "avoid_redundant_argument_values",
  "avoid_unused_constructor_parameters",
  "empty_catches",
  "empty_constructor_bodies",
  "unnecessary_lambdas",
  "unnecessary_overrides",
  "unnecessary_parenthesis",
  "unnecessary_this",
  // imports / sorting / formatting
  "combinators_ordering",
  "directives_ordering",
  "prefer_relative_imports",
  "sort_child_properties_last",
  "slash_for_doc_comments",
  // flutter-specific deterministic rewrites
  "sized_box_for_whitespace",
  "use_decorated_box",
  "use_full_hex_values_for_flutter_colors",
  "use_key_in_widget_constructors",
  "use_named_constants",
  "use_super_parameters",
  // misc
  "prefer_conditional_assignment",
  "prefer_equal_for_default_values",
  "prefer_initializing_formals",
  "avoid_void_async",
  "unawaited_futures",
  "use_rethrow_when_possible"
]);
function parseDartMachineOutput(raw, filePath, cwd) {
  const diagnostics = [];
  const absTarget = path12.resolve(cwd, filePath);
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim())
      continue;
    const parts = line.split("|");
    if (parts.length < 8)
      continue;
    const [severityStr, , code, file, lineStr, colStr, , ...messageParts] = parts;
    const message = messageParts.join("|").trim();
    const lineNum = parseInt(lineStr, 10);
    const colNum = parseInt(colStr, 10);
    if (!pathsEqual(path12.resolve(cwd, file?.trim() ?? ""), absTarget))
      continue;
    const severity = severityStr?.trim().toLowerCase() === "error" ? "error" : "warning";
    const ruleId = code?.trim() ?? "dart";
    const fixable = DART_FIXABLE_RULES.has(ruleId);
    diagnostics.push({
      id: `dart-${ruleId}-${lineNum}-${colNum}`,
      message: `[${ruleId}] ${message}`,
      filePath,
      line: lineNum || 1,
      column: colNum || 1,
      severity,
      semantic: severity === "error" ? "blocking" : "warning",
      tool: "dart",
      rule: ruleId,
      defectClass: "style",
      fixable,
      fixSuggestion: fixable ? "Run `dart fix --apply` to apply the deterministic auto-correction for this rule." : void 0
    });
  }
  return diagnostics;
}
var dartAnalyzeRunner = {
  id: "dart-analyze",
  appliesTo: ["dart"],
  priority: PRIORITY.GENERAL_ANALYSIS,
  skipTestFiles: false,
  async run(ctx) {
    const cwd = resolveRunnerCwd(ctx, "dart-analyze");
    const absPath = path12.resolve(cwd, ctx.filePath);
    const dartAvailable = await dart.isAvailableAsync(cwd);
    const flutterAvailable = !dartAvailable && await flutter.isAvailableAsync(cwd);
    if (!dartAvailable && !flutterAvailable) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const cmd = dartAvailable ? dart.getCommand(cwd) : flutter.getCommand(cwd);
    const args = dartAvailable ? ["analyze", "--format=machine", absPath] : ["analyze", "--machine", absPath];
    const result = await safeSpawnAsync(cmd, args, { cwd, timeout: 3e4 });
    const raw = (result.stderr || "") + (result.stdout || "");
    const parsed = parseToolRun("dart-analyze", {
      result,
      output: raw,
      // EXIT TABLE (Dart 3.5 measured fixture): 0 clean; 1 findings; 2 error; other nonzero rejected.
      exitCodes: { ran: [1, 2] }
    }, (out) => parseDartMachineOutput(out, ctx.filePath, cwd));
    if (parsed.skipped)
      return parsed.skipped;
    return finishParsedRun({
      tool: "dart-analyze",
      ctx,
      result,
      diagnostics: parsed.diagnostics
    });
  }
};
var dart_analyze_default = dartAnalyzeRunner;

// dist/clients/dispatch/runners/detekt.js
import * as fs8 from "node:fs";
import * as path13 from "node:path";
var detekt = createAvailabilityChecker("detekt", ".bat");
var DETEKT_CONFIG_CANDIDATES = [
  "detekt.yml",
  ".detekt.yml",
  path13.join("config", "detekt", "detekt.yml"),
  path13.join("detekt", "detekt.yml")
];
var DETEKT_FIXABLE_RULES = /* @__PURE__ */ new Set([
  // formatting (ktlint wrapper) — every rule supports autocorrect
  "AnnotationOnSeparateLine",
  "AnnotationSpacing",
  "ArgumentListWrapping",
  "BlockCommentInitialStarAlignment",
  "ChainWrapping",
  "CommentSpacing",
  "CommentWrapping",
  "EnumEntryNameCase",
  "Filename",
  "FinalNewline",
  "ImportOrdering",
  "Indentation",
  "MaximumLineLength",
  "ModifierListSpacing",
  "ModifierOrdering",
  "MultiLineIfElse",
  "NoBlankLineBeforeRbrace",
  "NoBlankLinesInChainedMethodCalls",
  "NoConsecutiveBlankLines",
  "NoEmptyClassBody",
  "NoEmptyFirstLineInMethodBlock",
  "NoLineBreakAfterElse",
  "NoLineBreakBeforeAssignment",
  "NoMultipleSpaces",
  "NoSemicolons",
  "NoTrailingSpaces",
  "NoUnitReturn",
  "NoUnusedImports",
  "NoWildcardImports",
  "PackageName",
  "ParameterListWrapping",
  "SpacingAroundAngleBrackets",
  "SpacingAroundColon",
  "SpacingAroundComma",
  "SpacingAroundCurly",
  "SpacingAroundDot",
  "SpacingAroundDoubleColon",
  "SpacingAroundKeyword",
  "SpacingAroundOperators",
  "SpacingAroundParens",
  "SpacingAroundRangeOperator",
  "SpacingAroundUnaryOperator",
  "SpacingBetweenDeclarationsWithAnnotations",
  "SpacingBetweenDeclarationsWithComments",
  "StringTemplate",
  "TrailingCommaOnCallSite",
  "TrailingCommaOnDeclarationSite",
  "TypeArgumentListSpacing",
  "TypeParameterListSpacing",
  "UnnecessaryParenthesesBeforeTrailingLambda",
  "Wrapping",
  // style / comments — these implement autoCorrect in their detekt rule classes
  "OptionalUnit",
  "OptionalAbstractKeyword",
  "ProtectedMemberInFinalClass",
  "UnnecessaryParentheses",
  "UnusedImports",
  "UnusedPrivateClass",
  "RedundantVisibilityModifierRule"
]);
function findDetektConfig(cwd) {
  for (const candidate of DETEKT_CONFIG_CANDIDATES) {
    const full = path13.join(cwd, candidate);
    if (fs8.existsSync(full))
      return full;
  }
  return void 0;
}
function parseDetektOutput(raw, filePath, cwd) {
  const diagnostics = [];
  const pattern = /^(.+?):(\d+):(\d+): (error|warning): (.+?)(?:\s+\[([^\]]+)\])?$/gm;
  const absTarget = path13.resolve(cwd, filePath);
  for (const match of raw.matchAll(pattern)) {
    const [, file, lineStr, colStr, level, message, rule] = match;
    if (!pathsEqual(path13.resolve(cwd, file.trim()), absTarget))
      continue;
    const severity = level === "error" ? "error" : "warning";
    const lineNum = Number.parseInt(lineStr, 10);
    const colNum = Number.parseInt(colStr, 10);
    const ruleId = rule ?? "detekt";
    const fixable = rule ? DETEKT_FIXABLE_RULES.has(rule) : false;
    diagnostics.push({
      id: `detekt-${ruleId}-${lineNum}-${colNum}`,
      message: rule ? `[${rule}] ${message}` : message,
      filePath,
      line: lineNum,
      column: colNum,
      severity,
      semantic: severity === "error" ? "blocking" : "warning",
      tool: "detekt",
      rule: ruleId,
      defectClass: "style",
      fixable,
      fixSuggestion: fixable ? "Run `detekt --auto-correct` to apply the deterministic auto-correction for this rule." : void 0
    });
  }
  return diagnostics;
}
var detektRunner = {
  id: "detekt",
  appliesTo: ["kotlin"],
  priority: PRIORITY.GENERAL_ANALYSIS,
  timeoutMs: 9e4,
  skipTestFiles: false,
  async run(ctx) {
    const cwd = resolveRunnerCwd(ctx, "detekt");
    const policy = getLinterPolicyForCwd(ctx.filePath, cwd);
    if (policy && !policy.preferredRunners.includes("detekt")) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const configPath = findDetektConfig(cwd);
    if (!configPath) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const cmd = await detekt.isAvailableAsync(cwd) ? detekt.getCommand(cwd) : null;
    if (!cmd)
      return { status: "skipped", diagnostics: [], semantic: "none" };
    const absPath = path13.resolve(cwd, ctx.filePath);
    const result = await safeSpawnAsync(cmd, ["--input", absPath, "--config", configPath], { cwd, timeout: 6e4 });
    const raw = `${result.stdout ?? ""}${result.stderr ?? ""}`;
    const run = parseToolRun("detekt", {
      result,
      output: raw,
      // EXIT TABLE (detekt 1.23 measured fixture): 0 clean; 1 findings; 2 error; other nonzero rejected.
      exitCodes: { ran: [1, 2] }
    }, (out) => parseDetektOutput(out, ctx.filePath, cwd));
    if (run.skipped)
      return run.skipped;
    const diagnostics = run.diagnostics;
    if (diagnostics.length === 0) {
      return { status: "succeeded", diagnostics: [], semantic: "none" };
    }
    const hasErrors = diagnostics.some((d) => d.severity === "error");
    return findingsResult(diagnostics, {
      status: hasErrors ? "failed" : "succeeded",
      semantic: hasErrors ? "blocking" : "warning"
    });
  }
};
var detekt_default = detektRunner;

// dist/clients/dispatch/runners/dotnet-build.js
import * as fs9 from "node:fs";
import * as path14 from "node:path";
var dotnet = createAvailabilityChecker("dotnet", ".exe");
function findProjectTarget(cwd) {
  const entries = fs9.readdirSync(cwd);
  const solution = entries.find((entry) => /\.(sln|slnx)$/i.test(entry));
  if (solution)
    return solution;
  return entries.find((entry) => /\.(csproj)$/i.test(entry));
}
function isDotnetRuleId(value) {
  if (value.length < 2)
    return false;
  let sawDigit = false;
  for (const char of value) {
    const code = char.charCodeAt(0);
    const isLetter = code >= 65 && code <= 90 || code >= 97 && code <= 122;
    const isDigit = code >= 48 && code <= 57;
    if (isDigit) {
      sawDigit = true;
      continue;
    }
    if (!isLetter || sawDigit)
      return false;
  }
  return sawDigit;
}
function parseDotnetDiagnosticLine(line) {
  const lower = line.toLowerCase();
  const fileEnd = lower.lastIndexOf(".cs(");
  if (fileEnd < 0)
    return null;
  const reportedFile = line.slice(0, fileEnd + 3).trim();
  let cursor = fileEnd + 4;
  const lineStart = cursor;
  while (cursor < line.length && line.charCodeAt(cursor) >= 48 && line.charCodeAt(cursor) <= 57) {
    cursor += 1;
  }
  if (cursor === lineStart || line[cursor] !== ",")
    return null;
  const lineStr = line.slice(lineStart, cursor);
  cursor += 1;
  const colStart = cursor;
  while (cursor < line.length && line.charCodeAt(cursor) >= 48 && line.charCodeAt(cursor) <= 57) {
    cursor += 1;
  }
  if (cursor === colStart || line.slice(cursor, cursor + 3) !== "): ")
    return null;
  const colStr = line.slice(colStart, cursor);
  cursor += 3;
  const tailLower = line.slice(cursor).toLowerCase();
  let severityLabel;
  if (tailLower.startsWith("error ")) {
    severityLabel = "error";
    cursor += "error ".length;
  } else if (tailLower.startsWith("warning ")) {
    severityLabel = "warning";
    cursor += "warning ".length;
  } else {
    return null;
  }
  const colon = line.indexOf(":", cursor);
  if (colon < 0)
    return null;
  const rule = line.slice(cursor, colon).trim();
  if (!isDotnetRuleId(rule))
    return null;
  let message = line.slice(colon + 1).trim();
  if (message.endsWith("]")) {
    const projectSuffix = message.lastIndexOf(" [");
    if (projectSuffix >= 0)
      message = message.slice(0, projectSuffix).trimEnd();
  }
  return { reportedFile, lineStr, colStr, severityLabel, rule, message };
}
function parseDotnetBuildOutput(raw, filePath, cwd) {
  const diagnostics = [];
  const absTarget = path14.resolve(cwd, filePath);
  for (const line of raw.split(/\r?\n/)) {
    const parsed = parseDotnetDiagnosticLine(line);
    if (!parsed)
      continue;
    const { reportedFile, lineStr, colStr, severityLabel, rule, message } = parsed;
    if (!pathsEqual(path14.resolve(cwd, reportedFile), absTarget))
      continue;
    const severity = severityLabel.toLowerCase() === "error" ? "error" : "warning";
    const lineNum = Number.parseInt(lineStr, 10) || 1;
    const colNum = Number.parseInt(colStr, 10) || 1;
    diagnostics.push({
      id: `dotnet-build-${rule}-${lineNum}-${colNum}`,
      message: `[${rule}] ${message.trim()}`,
      filePath,
      line: lineNum,
      column: colNum,
      severity,
      semantic: severity === "error" ? "blocking" : "warning",
      tool: "dotnet-build",
      rule,
      fixable: false
    });
  }
  return diagnostics;
}
var dotnetBuildRunner = {
  id: "dotnet-build",
  appliesTo: ["csharp"],
  priority: PRIORITY.GENERAL_ANALYSIS,
  timeoutMs: 9e4,
  skipTestFiles: false,
  async run(ctx) {
    const cwd = resolveRunnerCwd(ctx, "dotnet-build");
    if (!await dotnet.isAvailableAsync(cwd)) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const cmd = dotnet.getCommand(cwd);
    if (!cmd) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const target = findProjectTarget(cwd);
    if (!target) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const result = await safeSpawnAsync(cmd, ["build", target, "--nologo", "--verbosity", "minimal"], {
      cwd,
      timeout: 6e4
    });
    const raw = `${result.stdout ?? ""}
${result.stderr ?? ""}`.trim();
    const parsed = parseToolRun("dotnet-build", {
      result,
      output: raw,
      // EXIT TABLE (.NET SDK 8 measured fixture): 0 clean; 1 findings; 2 error; other nonzero rejected.
      exitCodes: { ran: [1, 2] }
    }, (output) => parseDotnetBuildOutput(output, ctx.filePath, cwd));
    if (parsed.skipped)
      return parsed.skipped;
    return finishParsedRun({
      tool: "dotnet-build",
      ctx,
      result,
      diagnostics: parsed.diagnostics,
      classify: (diagnostics) => {
        const hasErrors = diagnostics.some((d) => d.severity === "error");
        return {
          status: hasErrors ? "failed" : "succeeded",
          semantic: hasErrors ? "blocking" : "warning"
        };
      }
    });
  }
};
var dotnet_build_default = dotnetBuildRunner;

// dist/clients/dispatch/runners/elixir-check.js
import * as fs10 from "node:fs";
import * as path15 from "node:path";
var mix = createAvailabilityChecker("mix", ".bat");
var elixirc = createAvailabilityChecker("elixirc", ".bat");
function hasMixExs2(cwd) {
  return fs10.existsSync(path15.join(cwd, "mix.exs"));
}
var ELIXIR_SNIPPET_LOCATION = /└─\s+(.+?):(\d+)(?::(\d+))?(?::|$)/;
function parseElixirOutput(raw, filePath, cwd = process.cwd()) {
  const diagnostics = [];
  const resolvedTarget = path15.resolve(cwd, filePath);
  const lines = raw.split(/\r?\n/);
  const matchesTarget = (sourcePath) => pathsEqual(path15.resolve(cwd, sourcePath.trim()), resolvedTarget);
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (line.length > 2e3)
      continue;
    const syntax = line.match(/^\*\* \(([^)]+)\)\s+(.+?):(\d+):(?:(\d+):)?\s*(.+)$/);
    if (syntax) {
      const [, kind, sourcePath2, lineStr2, colStr2, message2] = syntax;
      if (!matchesTarget(sourcePath2))
        continue;
      diagnostics.push({
        id: `elixir-check-${kind}-${lineStr2}-${colStr2 || "1"}`,
        message: `[${kind}] ${message2.trim()}`,
        filePath,
        line: Number.parseInt(lineStr2, 10) || 1,
        column: Number.parseInt(colStr2 || "1", 10) || 1,
        severity: "error",
        semantic: "blocking",
        tool: "elixir-check",
        rule: kind,
        fixable: false
      });
      continue;
    }
    const header = line.match(/^\s*(error|warning):\s+(.+)$/);
    if (!header)
      continue;
    const [, severityLabel, message] = header;
    const severity = severityLabel === "error" ? "error" : "warning";
    let located = false;
    for (let lookahead = index + 1; lookahead < lines.length && lookahead <= index + 12; lookahead++) {
      const next = lines[lookahead];
      if (/^\s*(error|warning):\s+/.test(next))
        break;
      const snippet = next.match(ELIXIR_SNIPPET_LOCATION);
      if (snippet) {
        const [, sourcePath2, lineStr2, colStr2] = snippet;
        if (matchesTarget(sourcePath2)) {
          diagnostics.push({
            id: `elixir-check-${severity}-${lineStr2}-${colStr2 || "1"}`,
            message: severity === "error" ? `[error] ${message.trim()}` : message.trim(),
            filePath,
            line: Number.parseInt(lineStr2, 10) || 1,
            column: Number.parseInt(colStr2 || "1", 10) || 1,
            severity,
            semantic: severity === "error" ? "blocking" : "warning",
            tool: "elixir-check",
            rule: severity === "error" ? "error" : "warning",
            fixable: false
          });
        }
        located = true;
        break;
      }
    }
    if (located)
      continue;
    const location = lines[index + 1]?.match(/^\s+(.+?):(\d+):(?:(\d+):)?$/);
    if (!location)
      continue;
    const [, sourcePath, lineStr, colStr] = location;
    if (!matchesTarget(sourcePath))
      continue;
    diagnostics.push({
      id: `elixir-check-${severity}-${lineStr}-${colStr || "1"}`,
      message: severity === "error" ? `[error] ${message.trim()}` : message.trim(),
      filePath,
      line: Number.parseInt(lineStr, 10) || 1,
      column: Number.parseInt(colStr || "1", 10) || 1,
      severity,
      semantic: severity === "error" ? "blocking" : "warning",
      tool: "elixir-check",
      rule: severity === "error" ? "error" : "warning",
      fixable: false
    });
  }
  return diagnostics;
}
var elixirCheckRunner = {
  id: "elixir-check",
  appliesTo: ["elixir"],
  priority: PRIORITY.GENERAL_ANALYSIS,
  skipTestFiles: false,
  async run(ctx) {
    const cwd = resolveRunnerCwd(ctx, "elixir-check");
    const absPath = path15.resolve(cwd, ctx.filePath);
    let command;
    let args = [];
    if (hasMixExs2(cwd) && await mix.isAvailableAsync(cwd)) {
      command = "mix";
      args = ["compile", "--warnings-as-errors"];
    } else if (await elixirc.isAvailableAsync(cwd)) {
      const outDir = path15.join(getProjectDataDir(cwd), "elixir-check");
      fs10.mkdirSync(outDir, { recursive: true });
      command = "elixirc";
      args = ["-o", outDir, absPath];
    }
    if (!command) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const result = await safeSpawnAsync(command, args, {
      cwd,
      timeout: 3e4
    });
    const raw = `${result.stderr || ""}
${result.stdout || ""}`;
    const hasProjectContext = command === "mix";
    const parsed = parseToolRun("elixir-check", {
      result,
      output: raw,
      // EXIT TABLE (Elixir 1.16 measured fixture): 0 clean; 1 findings; 2 error; other nonzero rejected.
      exitCodes: { ran: [1, 2] }
    }, (out) => parseElixirOutput(out, ctx.filePath, cwd).map((d) => hasProjectContext ? d : {
      ...d,
      // A direct elixirc invocation cannot resolve Mix dependencies.
      // Standalone findings inform the agent, but cannot block it.
      semantic: "warning"
    }));
    if (parsed.skipped)
      return parsed.skipped;
    return finishParsedRun({
      tool: "elixir-check",
      ctx,
      result,
      diagnostics: parsed.diagnostics,
      classify: (diagnostics) => {
        const hasBlocking = diagnostics.some((d) => d.semantic === "blocking");
        return {
          status: hasBlocking ? "failed" : "succeeded",
          semantic: hasBlocking ? "blocking" : "warning"
        };
      }
    });
  }
};
var elixir_check_default = elixirCheckRunner;

// dist/clients/dispatch/runners/eslint.js
import * as path16 from "node:path";
var ESLINT_PROBE_BUDGET_MS = 5e3;
function makeEslintProbe(cmd) {
  return createCwdCachedProbe((cwd) => safeSpawnAsync(cmd, ["--version"], {
    timeout: ESLINT_PROBE_BUDGET_MS,
    cwd
  }), {
    tool: "eslint",
    budgetMs: ESLINT_PROBE_BUDGET_MS,
    flightKeyComponent: cmd
  });
}
var eslintAvailabilityByCmd = /* @__PURE__ */ new Map();
function getEslintProbe(cmd) {
  const existing = eslintAvailabilityByCmd.get(cmd);
  if (existing)
    return existing;
  const created = makeEslintProbe(cmd);
  eslintAvailabilityByCmd.set(cmd, created);
  return created;
}
function parseEslintJson(raw, filePath, cwd) {
  try {
    const results = JSON.parse(raw);
    const autofix = getAutofixCapability("eslint");
    const diagnostics = [];
    const absTarget = path16.resolve(cwd, filePath);
    for (const fileResult of results) {
      if (fileResult.filePath && !pathsEqual(path16.resolve(cwd, fileResult.filePath), absTarget))
        continue;
      for (const msg of fileResult.messages) {
        const severity = msg.severity === 2 ? "error" : "warning";
        diagnostics.push({
          id: `eslint:${msg.ruleId ?? "unknown"}:${msg.line}`,
          message: msg.ruleId ? `${msg.ruleId}: ${msg.message}` : msg.message,
          filePath,
          line: msg.line ?? 1,
          column: msg.column ?? 1,
          severity,
          semantic: severity === "error" ? "blocking" : "warning",
          tool: "eslint",
          rule: msg.ruleId ?? void 0,
          fixable: !!msg.fix,
          autoFixAvailable: !!msg.fix && (autofix?.safePipelineAutofix ?? false),
          fixKind: !!msg.fix && autofix?.fixKind !== "none" ? autofix?.fixKind : void 0
        });
      }
    }
    return { diagnostics };
  } catch (err) {
    return {
      diagnostics: [],
      parseError: err instanceof Error ? err.message : String(err)
    };
  }
}
var eslintRunner = {
  id: "eslint",
  appliesTo: ["jsts"],
  priority: PRIORITY.LINT_SECONDARY,
  async run(ctx) {
    const cwd = resolveRunnerCwd(ctx, "eslint");
    const userHasConfig = hasEslintConfig(cwd);
    if (!userHasConfig) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const cmd = resolveToolCommand(cwd, "eslint") ?? "eslint";
    if (!await getEslintProbe(cmd)(cwd)) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const result = await safeSpawnAsync(cmd, ["--format", "json", "--no-error-on-unmatched-pattern", ctx.filePath], { timeout: 3e4, cwd });
    const stdout = result.stdout ?? "";
    let raw = stdout;
    if (raw.length === 0 && result.status !== 0) {
      raw = result.stderr || "";
    }
    const parsed = parseToolRun("eslint", {
      result,
      output: raw,
      // EXIT TABLE (ESLint 9.10 docs https://eslint.org/docs/latest/use/command-line-interface): 0 clean; 1 findings; 2 fatal findings/error; other nonzero rejected.
      exitCodes: { ran: [1, 2] }
    }, (rawOutput) => parseEslintJson(rawOutput, ctx.filePath, cwd).diagnostics);
    if (parsed.skipped)
      return parsed.skipped;
    return finishParsedRun({
      tool: "eslint",
      ctx,
      result,
      diagnostics: parsed.diagnostics
    });
  }
};
var eslint_default = eslintRunner;

// dist/clients/dispatch/fact-rule-runner.js
var rules = [];
function registerRule(r) {
  rules.push(r);
}
function evaluateRules(ctx) {
  const diagnostics = [];
  for (const rule of rules) {
    if (!rule.appliesTo(ctx))
      continue;
    const results = rule.evaluate(ctx, ctx.facts);
    diagnostics.push(...results);
  }
  return diagnostics;
}

// dist/clients/dispatch/runners/fact-rules.js
var factRulesRunner = {
  id: "fact-rules",
  appliesTo: ["jsts", "python", "go", "rust", "ruby", "shell", "cmake"],
  priority: PRIORITY.GENERAL_ANALYSIS + 1,
  async run(ctx) {
    const diagnostics = evaluateRules(ctx);
    if (diagnostics.length === 0) {
      return { status: "succeeded", diagnostics: [], semantic: "none" };
    }
    const hasBlocking = diagnostics.some((d) => d.semantic === "blocking" || d.severity === "error");
    return findingsResult(diagnostics, {
      status: hasBlocking ? "failed" : "succeeded",
      semantic: hasBlocking ? "blocking" : "warning"
    });
  }
};
var fact_rules_default = factRulesRunner;

// dist/clients/dispatch/runners/gleam-check.js
import * as path17 from "node:path";
var gleam = createAvailabilityChecker("gleam", ".exe");
var GLEAM_LOCUS = /^\s*┌─\s+(.+?):(\d+):(\d+)$/;
var GLEAM_HEADER = /^\s*(error|warning):\s*(.+?)\s*$/;
var GLEAM_LABEL = /^\s*│\s*\^+\s*(.*?)\s*$/;
function gleamBlocks(lines) {
  const blocks = [];
  for (const line of lines) {
    const header = line.match(GLEAM_HEADER);
    if (header)
      blocks.push({ header, body: [] });
    else
      blocks.at(-1)?.body.push(line);
  }
  return blocks;
}
function gleamMessage(title, body) {
  const labels = body.flatMap((line) => line.match(GLEAM_LABEL)?.[1]?.trim() || []);
  return labels.length > 0 ? `${title} \u2014 ${labels.join(" ")}` : title;
}
function parseGleamOutput(raw, filePath, cwd) {
  const diagnostics = [];
  const absTarget = path17.resolve(cwd, filePath);
  const lines = stripAnsi(raw).split(/\r?\n/);
  for (const { header, body } of gleamBlocks(lines)) {
    const severity = header[1] === "warning" ? "warning" : "error";
    const title = `${header[1]}: ${header[2]}`;
    const location = body.find((line) => GLEAM_LOCUS.test(line))?.match(GLEAM_LOCUS);
    if (!location)
      continue;
    const [, sourcePath, lineStr, colStr] = location;
    if (!pathsEqual(path17.resolve(cwd, sourcePath.trim()), absTarget))
      continue;
    diagnostics.push({
      id: `gleam-check-${lineStr}-${colStr}`,
      message: gleamMessage(title, body),
      filePath,
      line: Number.parseInt(lineStr, 10) || 1,
      column: Number.parseInt(colStr, 10) || 1,
      severity,
      semantic: severity === "error" ? "blocking" : "warning",
      tool: "gleam",
      rule: "gleam-check",
      fixable: false
    });
  }
  return diagnostics;
}
function firstOutputLine(result) {
  return `${result.stderr || ""}
${result.stdout || ""}`.trim().split(/\r?\n/, 1)[0].slice(0, 200);
}
var gleamCheckRunner = {
  id: "gleam-check",
  appliesTo: ["gleam"],
  priority: PRIORITY.GENERAL_ANALYSIS,
  skipTestFiles: false,
  async run(ctx) {
    const cwd = resolveRunnerCwd(ctx, "gleam-check");
    if (!await gleam.isAvailableAsync(cwd)) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const cmd = gleam.getCommand(cwd);
    const result = await safeSpawnAsync(cmd, ["check"], {
      cwd,
      timeout: 3e4
    });
    if (result.error && !result.stdout && !result.stderr) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const diagnostics = parseGleamOutput(`${result.stderr || ""}
${result.stdout || ""}`, ctx.filePath, cwd);
    if (diagnostics.length === 0) {
      if (result.status && result.status !== 0) {
        const message = firstOutputLine(result) || "gleam check exited non-zero without structured diagnostics";
        return {
          status: "failed",
          diagnostics: [
            {
              id: "gleam-check-nonzero-no-diagnostics",
              message,
              filePath: ctx.filePath,
              severity: "error",
              semantic: "blocking",
              tool: "gleam",
              rule: "gleam-check",
              fixable: false
            }
          ],
          semantic: "blocking",
          failureKind: "unconfirmed_output",
          failureMessage: message.slice(0, 200)
        };
      }
      return { status: "succeeded", diagnostics: [], semantic: "none" };
    }
    return findingsResult(diagnostics, {
      status: "failed",
      semantic: "blocking"
    });
  }
};
var gleam_check_default = gleamCheckRunner;

// dist/clients/dispatch/runners/go-vet.js
import { relative as relative2, resolve as resolve14, sep, posix } from "node:path";

// dist/clients/dispatch/runners/utils/diagnostic-parsers.js
import * as path18 from "node:path";
function createLineParser(config) {
  return (raw, filePath, cwd) => {
    const diagnostics = [];
    const absTarget = path18.resolve(cwd, filePath);
    const clean = config.stripAnsi !== false ? stripAnsi(raw) : raw;
    const lines = clean.split("\n").filter((l) => l.trim());
    for (const line of lines) {
      const match = line.match(config.regex);
      if (!match)
        continue;
      const reported = match[1];
      if (reported && !pathsEqual(path18.resolve(cwd, reported), absTarget))
        continue;
      const lineNum = parseInt(match[2], 10);
      const colNum = parseInt(match[3], 10);
      const severity = config.getSeverity ? config.getSeverity(line, match) : "warning";
      const fixable = typeof config.fixable === "function" ? config.fixable(match) : config.fixable ?? false;
      const autoFixAvailable = typeof config.autoFixAvailable === "function" ? config.autoFixAvailable(match) : config.autoFixAvailable ?? false;
      const fixKind = typeof config.fixKind === "function" ? config.fixKind(match) : config.fixKind;
      diagnostics.push({
        id: config.generateId(match),
        message: config.extractMessage(match),
        filePath,
        line: lineNum,
        column: colNum,
        severity,
        semantic: severity === "error" ? "blocking" : "warning",
        tool: config.tool,
        rule: config.extractRule?.(match),
        defectClass: config.defectClass,
        fixable,
        autoFixAvailable,
        fixKind
      });
    }
    return diagnostics;
  };
}
var ruffAutofix = getAutofixCapability("ruff");
var parseRuffOutput = createLineParser({
  tool: "ruff",
  regex: /^(.+?):(\d+):(\d+):\s*(\w+)\s*(.+)/,
  extractMessage: (m) => `${m[4]}: ${m[5]}`,
  // CODE: message
  extractRule: (m) => m[4],
  generateId: (m) => `ruff-${m[4]}`,
  fixable: true,
  // Ruff can fix most issues
  autoFixAvailable: ruffAutofix?.safePipelineAutofix ?? false,
  fixKind: ruffAutofix?.fixKind === "none" ? void 0 : ruffAutofix?.fixKind
});
var parseGoVetOutput = createLineParser({
  tool: "go-vet",
  regex: /^(.+?):(\d+):(\d+):\s*(.+)/,
  extractMessage: (m) => m[4],
  generateId: (m) => `go-vet-${m[2]}`,
  defectClass: "correctness"
});

// dist/clients/dispatch/runners/go-vet.js
var goVetRunner = {
  id: "go-vet",
  appliesTo: ["go"],
  priority: PRIORITY.SPECIALIZED_ANALYSIS,
  timeoutMs: 4e4,
  async run(ctx) {
    const goExe = await goClient.findGoPathAsync();
    if (!goExe) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const cwd = resolveRunnerCwd(ctx, "go-vet");
    const fileRel = relative2(cwd, ctx.filePath).split(sep).join(posix.sep);
    const pkgPath = fileRel.startsWith("../") ? (
      // File isn't under ctx.cwd (unexpected — ctx.cwd is the go.mod root).
      // Vet the root package as a safe fallback rather than emit `./../x`;
      // the filename filter below still prevents mis-attribution.
      "."
    ) : fileRel.includes("/") ? "./" + fileRel.slice(0, fileRel.lastIndexOf("/")) : ".";
    const result = await safeSpawnAsync(goExe, ["vet", pkgPath], {
      timeout: 3e4,
      cwd
    });
    const raw = stripAnsi(result.stdout + result.stderr);
    const parsableLines = raw.split("\n").filter((line) => /^.+?:\d+:\d+:/.test(line)).join("\n");
    const skipped = skipUnlessToolRan("go-vet", {
      result,
      output: parsableLines
    });
    if (skipped)
      return skipped;
    if (result.status === 0 && !raw.trim()) {
      return { status: "succeeded", diagnostics: [], semantic: "none" };
    }
    const absTarget = resolve14(ctx.filePath);
    const relevant = raw.split("\n").filter((line) => {
      const m = line.match(/^(.+?):(\d+):(\d+):\s*(.+)/);
      return m != null && pathsEqual(resolve14(cwd, m[1].trim()), absTarget);
    }).join("\n");
    const diagnostics = parseGoVetOutput(relevant, ctx.filePath, cwd);
    return diagnostics.length > 0 ? findingsResult(diagnostics, { status: "failed", semantic: "warning" }) : { status: "succeeded", diagnostics: [], semantic: "none" };
  }
};
var go_vet_default = goVetRunner;

// dist/clients/dispatch/runners/golangci-lint.js
import * as path19 from "node:path";
var golangci = createAvailabilityChecker("golangci-lint", ".exe");
function describeReplacement(replacement) {
  if (!replacement)
    return void 0;
  if (replacement.Inline?.NewString !== void 0) {
    return `Replace with: ${replacement.Inline.NewString}`;
  }
  if (replacement.NeedOnlyDelete)
    return "Delete this code";
  if (replacement.NewLines && replacement.NewLines.length > 0) {
    const preview = replacement.NewLines[0].trim();
    const hint = replacement.NewLines.length > 1 ? ` (+${replacement.NewLines.length - 1} more lines)` : "";
    return `Replace with: ${preview}${hint}`;
  }
  return "Apply golangci-lint suggested fix";
}
function parseGolangciJson(raw, filePath, cwd) {
  try {
    const output = JSON.parse(raw);
    if (!output.Issues)
      return [];
    const absFile = path19.resolve(cwd, filePath);
    return output.Issues.filter((issue) => pathsEqual(path19.resolve(cwd, issue.Pos.Filename), absFile)).map((issue) => {
      const severity = issue.Severity === "error" ? "error" : "warning";
      const fixSuggestion = describeReplacement(issue.Replacement);
      return {
        id: `golangci:${issue.FromLinter}:${issue.Pos.Line}`,
        message: `${issue.FromLinter}: ${issue.Text}`,
        filePath,
        line: issue.Pos.Line,
        column: issue.Pos.Column,
        severity,
        semantic: severity === "error" ? "blocking" : "warning",
        tool: "golangci-lint",
        rule: issue.FromLinter,
        defectClass: "correctness",
        fixable: Boolean(issue.Replacement),
        fixSuggestion
      };
    });
  } catch {
    return [];
  }
}
var golangciRunner = {
  id: "golangci-lint",
  appliesTo: ["go"],
  priority: PRIORITY.GENERAL_ANALYSIS,
  timeoutMs: 9e4,
  async run(ctx) {
    const cwd = resolveRunnerCwd(ctx, "golangci-lint");
    const policy = getLinterPolicyForCwd(ctx.filePath, cwd);
    if (policy && !policy.preferredRunners.includes("golangci-lint")) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    if (!hasGolangciConfig(cwd)) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const cmd = await resolveAvailableOrInstall(golangci, "golangci-lint", cwd);
    if (!cmd)
      return { status: "skipped", diagnostics: [], semantic: "none" };
    const result = await safeSpawnAsync(cmd, ["run", "--out-format=json", ctx.filePath], { timeout: 6e4, cwd });
    const raw = (result.stdout ?? "").length > 0 ? result.stdout ?? "" : result.status !== 0 ? result.stderr || "" : "";
    const parsed = parseToolRun("golangci-lint", {
      result,
      output: raw,
      // EXIT TABLE (golangci-lint 1.60 docs https://golangci-lint.run/docs/welcome/quick-start/): 0 clean; 1 findings; 2 error; 3 error; 4 error; 5 error; other nonzero rejected.
      exitCodes: { ran: [1, 2, 3, 4, 5] }
    }, (raw2) => parseGolangciJson(raw2, ctx.filePath, cwd));
    if (parsed.skipped)
      return parsed.skipped;
    return finishParsedRun({
      tool: "golangci-lint",
      ctx,
      result,
      diagnostics: parsed.diagnostics
    });
  }
};
var golangci_lint_default = golangciRunner;

// dist/clients/dispatch/runners/hadolint.js
import * as path20 from "node:path";
var hadolint = createAvailabilityChecker("hadolint", ".exe");
function parseHadolintOutput(raw, filePath, cwd) {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed))
      return [];
    const absTarget = path20.resolve(cwd, filePath);
    return parsed.flatMap((item) => {
      if (item.file && !pathsEqual(path20.resolve(cwd, item.file), absTarget))
        return [];
      const severity = item.level === "error" ? "error" : "warning";
      return [
        {
          id: `hadolint-${item.code}-${item.line}`,
          message: `[${item.code}] ${item.message}`,
          filePath,
          line: item.line,
          column: item.column ?? 1,
          severity,
          semantic: severity === "error" ? "blocking" : "warning",
          tool: "hadolint",
          rule: item.code,
          fixable: false
        }
      ];
    });
  } catch {
    return [];
  }
}
var hadolintRunner = {
  id: "hadolint",
  appliesTo: ["docker"],
  priority: PRIORITY.GENERAL_ANALYSIS,
  skipTestFiles: false,
  async run(ctx) {
    const cwd = resolveRunnerCwd(ctx, "hadolint");
    const policy = getLinterPolicyForCwd(ctx.filePath, cwd);
    if (policy && !policy.preferredRunners.includes("hadolint")) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    let cmd = null;
    if (await hadolint.isAvailableAsync(cwd)) {
      cmd = hadolint.getCommand(cwd);
    } else {
      cmd = await resolveToolCommandWithInstallFallback(cwd, "hadolint");
    }
    if (!cmd) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const result = await safeSpawnAsync(cmd, ["--format", "json", "--no-fail", path20.resolve(cwd, ctx.filePath)], { cwd });
    const run = parseToolRun("hadolint", {
      result,
      // EXIT TABLE (Hadolint 2.12 measured fixture): 0 clean; 1 findings; 2 error; other nonzero rejected.
      exitCodes: { ran: [1, 2] }
    }, (out) => parseHadolintOutput(out, ctx.filePath, cwd));
    if (run.skipped)
      return run.skipped;
    const diagnostics = run.diagnostics;
    return finishParsedRun({
      tool: "hadolint",
      ctx,
      result,
      diagnostics,
      classify: (diagnostics2) => {
        const hasErrors = diagnostics2.some((d) => d.severity === "error");
        return {
          status: "failed",
          semantic: hasErrors ? "blocking" : "warning"
        };
      }
    });
  }
};
var hadolint_default = hadolintRunner;

// dist/clients/dispatch/runners/helm-lint.js
import * as path21 from "node:path";
var helm = createAvailabilityChecker("helm", ".exe");
var inFlightByChartRoot = new PathKeyedMap(normalizeMapKey);
var HELM_LINT_TIMEOUT_MS = 3e4;
var MAX_HELM_LINT_OUTPUT_BYTES = 8 * 1024 * 1024;
var SKIPPED = {
  status: "skipped",
  diagnostics: [],
  semantic: "none"
};
function isWithin(root, candidate) {
  const relative5 = path21.relative(normalizeMapKey(root), normalizeMapKey(candidate));
  return relative5 === "" || !relative5.startsWith(`..${path21.sep}`) && relative5 !== ".." && !path21.isAbsolute(relative5);
}
function diagnosticLocation(message, chartRoot) {
  const location = message.match(/(?:^|\s)([^:\r\n]+\.(?:ya?ml|tpl|json))(?::(\d+))?(?::\d+)?(?::|\s)/i);
  if (!location) {
    return { filePath: path21.join(chartRoot, "Chart.yaml"), message };
  }
  const candidate = path21.resolve(chartRoot, location[1]);
  return {
    filePath: isWithin(chartRoot, candidate) ? candidate : path21.join(chartRoot, "Chart.yaml"),
    line: location[2] ? Number(location[2]) : void 0,
    message
  };
}
function parseHelmLintOutput(raw, chartRoot) {
  const diagnostics = [];
  for (const line of raw.split(/\r?\n/)) {
    const match = line.trim().match(/^\[(INFO|WARNING|ERROR)\]\s*(.+)$/);
    if (!match) {
      const last = diagnostics[diagnostics.length - 1];
      if (last && /^\s+\S/.test(line)) {
        last.message += `
${line.trim()}`;
      }
      continue;
    }
    const level = match[1];
    const location = diagnosticLocation(match[2].trim(), chartRoot);
    const severity = level === "ERROR" ? "error" : level === "WARNING" ? "warning" : "info";
    diagnostics.push({
      id: `helm-lint-${diagnostics.length + 1}-${level.toLowerCase()}`,
      message: location.message,
      filePath: location.filePath,
      line: location.line,
      column: 1,
      severity,
      semantic: severity === "error" ? "blocking" : "warning",
      tool: "helm-lint",
      rule: level.toLowerCase(),
      fixable: false
    });
  }
  return diagnostics;
}
function failedResult(kind, message) {
  return {
    status: "failed",
    diagnostics: [],
    semantic: "warning",
    failureKind: kind,
    failureMessage: message.slice(0, 200)
  };
}
async function lintChart(chartRoot, cwd) {
  const cmd = await resolveAvailableOrInstall(helm, "helm", cwd);
  if (!cmd) {
    const outcome = helm.getOutcome(cwd);
    return {
      status: "failed",
      diagnostics: [],
      semantic: "warning",
      failureKind: "unavailable",
      failureMessage: `helm unavailable (${outcome ?? "unknown"})`
    };
  }
  const result = await safeSpawnAsync(cmd, ["lint", chartRoot], {
    cwd,
    timeout: HELM_LINT_TIMEOUT_MS,
    deadlineAt: Date.now() + HELM_LINT_TIMEOUT_MS,
    resourceLabel: "helm-lint",
    maxOutputBytes: MAX_HELM_LINT_OUTPUT_BYTES
  });
  if (truncatedByOutputCap(result)) {
    return failedResult("parser_error", "helm lint output was truncated before parsing completed");
  }
  const output = [result.stdout, result.stderr].filter(Boolean).join("\n");
  const diagnostics = parseHelmLintOutput(output, chartRoot);
  const typedFailure = result.spawnFailure?.kind;
  if (typedFailure) {
    const failureKind = typedFailure === "tool-not-found" ? "unavailable" : typedFailure === "timeout" ? "timeout" : typedFailure === "killed" && result.failure === "aborted" ? "aborted" : "server_error";
    return failedResult(failureKind, result.error?.message || `helm lint ${typedFailure}`);
  }
  if (result.failure) {
    return failedResult(result.failure === "timeout" ? "timeout" : result.failure, result.error?.message || `helm lint ${result.failure}`);
  }
  const hasErrorDiagnostic = diagnostics.some((diagnostic) => diagnostic.severity === "error");
  if (result.status !== 0 && !hasErrorDiagnostic) {
    return failedResult(output.trim() ? "parser_error" : "server_error", output.trim() || "helm lint exited without an error diagnostic");
  }
  return {
    status: "succeeded",
    diagnostics,
    semantic: diagnostics.some((item) => item.severity === "error") ? "blocking" : diagnostics.length > 0 ? "warning" : "none"
  };
}
var helmLintRunner = {
  id: "helm-lint",
  appliesTo: ["yaml", "helm-template"],
  priority: PRIORITY.GENERAL_ANALYSIS,
  skipTestFiles: false,
  timeoutMs: 35e3,
  async run(ctx) {
    const cwd = resolveRunnerCwd(ctx, "helm");
    const workspaceRoot = path21.resolve(ctx.projectRoot ?? ctx.cwd);
    const startDir = path21.dirname(path21.resolve(ctx.filePath));
    const discovered = findNearestDirWithMarker(startDir, "chartYamlPath");
    if (!discovered)
      return SKIPPED;
    const chartRoot = path21.resolve(discovered);
    if (!isWithin(workspaceRoot, chartRoot))
      return SKIPPED;
    const existing = inFlightByChartRoot.get(chartRoot);
    if (existing)
      return existing;
    const promise = lintChart(chartRoot, cwd).finally(() => {
      if (inFlightByChartRoot.get(chartRoot) === promise)
        inFlightByChartRoot.delete(chartRoot);
    });
    inFlightByChartRoot.set(chartRoot, promise);
    return promise;
  }
};
var helm_lint_default = helmLintRunner;

// dist/clients/dispatch/runners/helm-render.js
import * as fs11 from "node:fs";
import * as os from "node:os";
import * as path22 from "node:path";
var helm2 = createAvailabilityChecker("helm", ".exe");
var trivy = createAvailabilityChecker("trivy", ".exe");
var inFlightByChartRoot2 = new PathKeyedMap(normalizeMapKey);
var RENDER_TIMEOUT_MS = 3e4;
var TRIVY_TIMEOUT_MS = 45e3;
var MAX_RENDERED_FILES = 400;
var MAX_REPORT_BYTES = 8 * 1024 * 1024;
var MAX_RENDER_OUTPUT_BYTES = 8 * 1024 * 1024;
var SKIPPED2 = {
  status: "skipped",
  diagnostics: [],
  semantic: "none"
};
function isWithin2(root, candidate) {
  const relative5 = path22.relative(normalizeMapKey(root), normalizeMapKey(candidate));
  return relative5 === "" || !relative5.startsWith(`..${path22.sep}`) && relative5 !== ".." && !path22.isAbsolute(relative5);
}
function isHelmRenderEnabled(workspaceRoot) {
  try {
    const config = loadPiLensProjectConfig(workspaceRoot);
    const helmConfig = config.raw?.helm;
    return helmConfig?.renderValidation?.enabled === true;
  } catch {
    return false;
  }
}
function resolveTemplateSource(sourceRef, chartRoot, realChartRoot) {
  const segments = sourceRef.split(/[\\/]+/).filter((segment) => segment && segment !== ".");
  if (segments.length < 2)
    return null;
  const candidate = path22.resolve(chartRoot, ...segments.slice(1));
  if (!isWithin2(chartRoot, candidate))
    return null;
  try {
    if (!fs11.lstatSync(candidate).isFile())
      return null;
    const root = realChartRoot ?? fs11.realpathSync(chartRoot);
    if (!isWithin2(root, fs11.realpathSync(candidate)))
      return null;
  } catch {
    return null;
  }
  return candidate;
}
function canonicalChartRoot(chartRoot) {
  try {
    return fs11.realpathSync(chartRoot);
  } catch {
    return chartRoot;
  }
}
function chartYaml(chartRoot) {
  return path22.join(chartRoot, "Chart.yaml");
}
var HELM_INSTALL_HINT = "https://helm.sh/docs/intro/install/";
var TRIVY_INSTALL_HINT = "https://trivy.dev/latest/getting-started/installation/";
var SOURCE_ANNOTATION = /^#\s*Source:\s*(\S+)\s*$/m;
var TEMPLATE_EXTENSION = /\.(?:ya?ml|tpl)$/i;
function extractTemplateRef(line) {
  for (const token of line.split(/[\s(),<>"']+/)) {
    const parts = token.split(":");
    const ref = parts[0];
    if (!ref.includes("/"))
      continue;
    if (!TEMPLATE_EXTENSION.test(ref))
      continue;
    const lineNumber = /^\d+$/.test(parts[1] ?? "") ? Number(parts[1]) : void 0;
    return { ref, line: lineNumber };
  }
  return null;
}
function mapRenderedToSource(options) {
  const { chartRoot, realChartRoot } = options;
  const annotation = SOURCE_ANNOTATION.exec(options.renderedContent);
  if (annotation) {
    const resolved = resolveTemplateSource(annotation[1], chartRoot, realChartRoot);
    if (resolved)
      return { filePath: resolved, mapped: true };
  }
  const relative5 = path22.relative(options.outputDir, options.renderedPath);
  if (relative5 && !relative5.startsWith("..")) {
    const resolved = resolveTemplateSource(relative5, chartRoot, realChartRoot);
    if (resolved)
      return { filePath: resolved, mapped: true };
  }
  return { filePath: chartYaml(chartRoot), mapped: false };
}
function parseHelmTemplateFailure(raw, chartRoot) {
  const diagnostics = [];
  const text = raw.trim();
  const realRoot = canonicalChartRoot(chartRoot);
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("Error:"))
      continue;
    const location = extractTemplateRef(trimmed);
    const resolved = location ? resolveTemplateSource(location.ref, chartRoot, realRoot) : null;
    const chartName = path22.basename(chartRoot);
    diagnostics.push({
      id: `helm-render-error-${diagnostics.length + 1}`,
      message: resolved ? trimmed : `${trimmed} (helm template failed for chart ${chartName})`,
      filePath: resolved ?? chartYaml(chartRoot),
      line: resolved ? location?.line ?? 1 : 1,
      column: 1,
      severity: "error",
      semantic: "blocking",
      tool: "helm-render",
      rule: "render-failed",
      fixable: false
    });
  }
  if (diagnostics.length === 0) {
    diagnostics.push({
      id: "helm-render-error-1",
      message: `helm template failed: ${(text || "no output").slice(0, 400)}`,
      filePath: chartYaml(chartRoot),
      line: 1,
      column: 1,
      severity: "error",
      semantic: "blocking",
      tool: "helm-render",
      rule: "render-failed",
      fixable: false
    });
  }
  return diagnostics;
}
function checkManifestShape(options) {
  const diagnostics = [];
  const documents = options.renderedContent.split(/^---\s*$/m);
  documents.forEach((document, index) => {
    const meaningful = document.split(/\r?\n/).filter((line) => line.trim() && !line.trim().startsWith("#"));
    if (meaningful.length === 0)
      return;
    const missing = [];
    if (!/^apiVersion:\s*\S/m.test(document))
      missing.push("apiVersion");
    if (!/^kind:\s*\S/m.test(document))
      missing.push("kind");
    if (missing.length === 0)
      return;
    const where = options.sourceMapped ? `rendered ${options.renderedRelativePath}` : `rendered ${options.renderedRelativePath} (source template could not be resolved)`;
    diagnostics.push({
      id: `helm-render-shape-${options.renderedRelativePath}-${index}`,
      message: `Rendered document ${index + 1} is missing ${missing.join(" and ")} \u2014 it is not a Kubernetes object (${where}).`,
      filePath: options.sourcePath,
      line: 1,
      column: 1,
      severity: "warning",
      semantic: "warning",
      tool: "helm-render",
      rule: "manifest-shape",
      fixable: false
    });
  });
  return diagnostics;
}
function parseRenderedTrivyOutput(raw, locate) {
  if (!raw.trim()) {
    return { understood: false, diagnostics: [], problem: "empty report" };
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      understood: false,
      diagnostics: [],
      problem: "report was not valid JSON"
    };
  }
  const results = parsed?.Results;
  if (!Array.isArray(results)) {
    return {
      understood: false,
      diagnostics: [],
      problem: "report carried no Results array"
    };
  }
  const diagnostics = [];
  for (const entry of results) {
    if (!entry || typeof entry !== "object")
      continue;
    const target = entry.Target;
    const rows = entry.Misconfigurations;
    if (!Array.isArray(rows))
      continue;
    const located = locate(typeof target === "string" ? target : "");
    for (const row of rows) {
      if (!row || typeof row !== "object")
        continue;
      const misconfig = row;
      const id = typeof misconfig.ID === "string" ? misconfig.ID : void 0;
      if (!id)
        continue;
      const cause = misconfig.CauseMetadata ?? {};
      const renderedLine = typeof cause.StartLine === "number" && cause.StartLine > 0 ? cause.StartLine : void 0;
      const severity = typeof misconfig.Severity === "string" ? misconfig.Severity.toUpperCase() : "UNKNOWN";
      const title = typeof misconfig.Title === "string" && misconfig.Title ? misconfig.Title : id;
      const resolution = typeof misconfig.Resolution === "string" && misconfig.Resolution ? ` ${misconfig.Resolution}` : "";
      const at = renderedLine ? `${located.detail}:${renderedLine}` : located.detail;
      diagnostics.push({
        id: `helm-render-${id}-${diagnostics.length + 1}`,
        message: `[${id}] ${title} (${severity}) in ${at}.${resolution}`.trim(),
        filePath: located.filePath,
        line: 1,
        column: 1,
        severity: severity === "CRITICAL" ? "error" : "warning",
        semantic: severity === "CRITICAL" ? "blocking" : "warning",
        defectClass: "safety",
        tool: "helm-render",
        rule: id,
        fixable: false
      });
    }
  }
  return { understood: true, diagnostics };
}
function helmUnavailableResult(cwd) {
  const verdict = helm2.getVerdict(cwd);
  return {
    status: "failed",
    diagnostics: [],
    semantic: "warning",
    // One failureKind for both arms — a consumer must read this as "the runner
    // could not start", never as a chart finding. Whether the absence is
    // durable or a probe timeout is the MESSAGE's job, and the availability
    // seam has already logged the decision with its honest cause.
    failureKind: "unavailable",
    failureMessage: describeUnavailability({
      tool: "helm",
      installHint: HELM_INSTALL_HINT,
      outcome: verdict.outcome,
      cause: verdict.cause,
      elapsedMs: verdict.elapsedMs,
      retryAfterMs: verdict.retryAtMs ? Math.max(0, verdict.retryAtMs - Date.now()) : void 0
    }).slice(0, 300)
  };
}
function failedResult2(kind, message) {
  return {
    status: "failed",
    diagnostics: [],
    semantic: "warning",
    failureKind: kind,
    failureMessage: message.slice(0, 200)
  };
}
var OUR_RENDER_FLAGS = ["--output-dir"];
function rejectedOurInvocation(output) {
  if (!output)
    return null;
  const complaint = /unknown flag|unknown shorthand flag|flag provided but not defined|unknown command|unrecognized (?:flag|option)/i.test(output);
  if (!complaint)
    return null;
  for (const flag of OUR_RENDER_FLAGS) {
    if (output.includes(flag))
      return flag;
  }
  return null;
}
function spawnFailureKind(result) {
  const typed = result.spawnFailure?.kind;
  if (typed === "tool-not-found")
    return "unavailable";
  if (typed === "timeout" || result.failure === "timeout")
    return "timeout";
  if (typed === "killed" || result.failure === "aborted")
    return "aborted";
  if (result.failure)
    return "server_error";
  return null;
}
function collectRenderedFiles(root) {
  const files = [];
  const stack = [root];
  let truncated = false;
  while (stack.length > 0 && !truncated) {
    const dir = stack.pop();
    let entries;
    try {
      entries = fs11.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = path22.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile() && /\.ya?ml$/i.test(entry.name)) {
        if (files.length >= MAX_RENDERED_FILES) {
          truncated = true;
          break;
        }
        files.push(full);
      }
    }
  }
  return {
    files: files.sort((left, right) => left.localeCompare(right)),
    truncated
  };
}
function summarize(diagnostics) {
  let semantic = "none";
  if (diagnostics.some((item) => item.severity === "error")) {
    semantic = "blocking";
  } else if (diagnostics.length > 0) {
    semantic = "warning";
  }
  return { status: "succeeded", diagnostics, semantic };
}
function readRenderedTree(outputDir, chartRoot) {
  const manifests = [];
  const walk2 = collectRenderedFiles(outputDir);
  const realChartRoot = canonicalChartRoot(chartRoot);
  let unreadable = 0;
  for (const renderedPath of walk2.files) {
    let content;
    try {
      content = fs11.readFileSync(renderedPath, "utf-8");
    } catch {
      unreadable += 1;
      continue;
    }
    const mapping = mapRenderedToSource({
      renderedContent: content,
      renderedPath,
      outputDir,
      chartRoot,
      realChartRoot
    });
    manifests.push({
      renderedPath,
      relativePath: path22.relative(outputDir, renderedPath),
      content,
      sourcePath: mapping.filePath,
      sourceMapped: mapping.mapped
    });
  }
  return { manifests, truncated: walk2.truncated, unreadable };
}
function coverageGap(chartRoot, rule, message) {
  return {
    id: `helm-render-${rule}`,
    message,
    filePath: chartYaml(chartRoot),
    line: 1,
    column: 1,
    severity: "info",
    semantic: "warning",
    tool: "helm-render",
    rule,
    fixable: false
  };
}
async function runIacPass(options) {
  const { chartRoot, cwd, outputDir } = options;
  const trivyCmd = await resolveAvailableOrInstall(trivy, "trivy", cwd);
  if (!trivyCmd) {
    const verdict = trivy.getVerdict(cwd);
    return [
      coverageGap(chartRoot, "iac-pass-unavailable", `Rendered-manifest IaC checks did not run: ${describeUnavailability({
        tool: "trivy",
        installHint: TRIVY_INSTALL_HINT,
        outcome: verdict.outcome,
        cause: verdict.cause,
        elapsedMs: verdict.elapsedMs
      })}`)
    ];
  }
  const scan = await safeSpawnAsync(trivyCmd, [
    "config",
    // `--quiet` alone suppresses both the progress bar and log output.
    // `--no-progress` is NOT a `config` subcommand flag (unlike `fs`,
    // which does accept it) — trivy 0.73.0 exits 1 with 7662 bytes of
    // usage text on stdout ("FATAL unknown flag: --no-progress") when
    // it's passed here, which the exit-status check below now catches,
    // but the flag itself made every real invocation of this pass fail
    // before it ever scanned a rendered manifest (refs #1757; verified
    // against the real installed binary, not assumed).
    "--quiet",
    "--format",
    "json",
    "--severity",
    resolveSeverityFloor(cwd).join(","),
    outputDir
  ], {
    cwd,
    timeout: TRIVY_TIMEOUT_MS,
    deadlineAt: Date.now() + TRIVY_TIMEOUT_MS,
    resourceLabel: "helm-render-trivy",
    // The report is the whole rendered tree's misconfigurations; cap what we
    // hold in memory rather than trusting the chart's size (shape 9).
    maxOutputBytes: MAX_REPORT_BYTES
  });
  if (truncatedByOutputCap(scan)) {
    return [
      coverageGap(chartRoot, "iac-report-unreadable", `Rendered-manifest IaC checks did not run: the trivy report exceeded ${MAX_REPORT_BYTES} bytes and was truncated before parsing.`)
    ];
  }
  const scanFailure = spawnFailureKind(scan);
  if (scanFailure || scan.status !== 0) {
    const why = scanFailure ?? `exit ${scan.status}`;
    const detail = (scan.stderr || scan.error?.message || "no output").slice(0, 200);
    return [
      coverageGap(chartRoot, "iac-pass-failed", `Rendered-manifest IaC checks failed to complete (${why}): ${detail}`)
    ];
  }
  const sourceByRendered = new PathKeyedMap(normalizeMapKey);
  for (const manifest of options.manifests) {
    sourceByRendered.set(manifest.renderedPath, {
      filePath: manifest.sourcePath,
      detail: manifest.relativePath
    });
  }
  const report = parseRenderedTrivyOutput(scan.stdout || "", (target) => {
    const hit = sourceByRendered.get(path22.resolve(outputDir, target));
    return hit ?? {
      filePath: chartYaml(chartRoot),
      detail: target || "rendered manifest"
    };
  });
  if (!report.understood) {
    return [
      coverageGap(chartRoot, "iac-report-unreadable", `Rendered-manifest IaC checks produced no readable result (${report.problem}), so the manifests are UNSCANNED rather than clean.`)
    ];
  }
  return report.diagnostics;
}
function logRenderPass(filePath, chartRoot, startedAt, metadata) {
  logLatency({
    type: "phase",
    phase: "helm_render_pass",
    filePath,
    durationMs: Date.now() - startedAt,
    metadata: { chartRoot, ...metadata }
  });
}
function discardScratchDir(outputDir, filePath, remove = (target) => fs11.rmSync(target, { recursive: true, force: true })) {
  try {
    remove(outputDir);
  } catch (error) {
    logLatency({
      type: "phase",
      phase: "helm_render_scratch_leak",
      filePath,
      durationMs: 0,
      metadata: {
        outputDir,
        error: error instanceof Error ? error.message : String(error)
      }
    });
  }
}
async function renderAndValidate(chartRoot, cwd, filePath) {
  const startedAt = Date.now();
  const helmCmd = await resolveAvailableOrInstall(helm2, "helm", cwd);
  if (!helmCmd)
    return helmUnavailableResult(cwd);
  const outputDir = fs11.mkdtempSync(path22.join(os.tmpdir(), "pi-lens-helm-render-"));
  try {
    const render = await safeSpawnAsync(helmCmd, ["template", "pi-lens-render", chartRoot, "--output-dir", outputDir], {
      cwd,
      timeout: RENDER_TIMEOUT_MS,
      deadlineAt: Date.now() + RENDER_TIMEOUT_MS,
      resourceLabel: "helm-render",
      maxOutputBytes: MAX_RENDER_OUTPUT_BYTES
    });
    const renderOutput = [render.stdout, render.stderr].filter(Boolean).join("\n");
    const renderCapped = truncatedByOutputCap(render);
    if (killedForOutputCap(render)) {
      logRenderPass(filePath, chartRoot, startedAt, {
        outcome: "render-truncated",
        diagnostics: 1
      });
      return summarize([
        coverageGap(chartRoot, "render-truncated", `helm template produced more than ${MAX_RENDER_OUTPUT_BYTES} bytes and was stopped mid-render, so the rendered manifests are UNCHECKED rather than clean.`)
      ]);
    }
    const startupFailure = spawnFailureKind(render);
    if (startupFailure) {
      logRenderPass(filePath, chartRoot, startedAt, {
        outcome: "runner-failed",
        failureKind: startupFailure
      });
      return failedResult2(startupFailure, render.error?.message || `helm template ${startupFailure}`);
    }
    if (render.status !== 0) {
      const ourFlag = rejectedOurInvocation(renderOutput);
      if (ourFlag) {
        logRenderPass(filePath, chartRoot, startedAt, {
          outcome: "runner-failed",
          failureKind: "invocation_rejected",
          flag: ourFlag
        });
        return failedResult2("invocation_rejected", `helm rejected pi-lens's own invocation (${ourFlag}); this is a helm/pi-lens compatibility problem, not a chart defect: ${renderOutput.trim().slice(0, 160)}`);
      }
      const diagnostics2 = parseHelmTemplateFailure(renderOutput, chartRoot);
      if (renderCapped) {
        diagnostics2.push(coverageGap(chartRoot, "render-truncated", "helm template output was truncated, so this failure report may be incomplete."));
      }
      logRenderPass(filePath, chartRoot, startedAt, {
        outcome: "render-failed",
        diagnostics: diagnostics2.length
      });
      return summarize(diagnostics2);
    }
    const tree = readRenderedTree(outputDir, chartRoot);
    const diagnostics = [];
    for (const manifest of tree.manifests) {
      diagnostics.push(...checkManifestShape({
        renderedContent: manifest.content,
        renderedRelativePath: manifest.relativePath,
        sourcePath: manifest.sourcePath,
        sourceMapped: manifest.sourceMapped
      }));
    }
    if (renderCapped) {
      diagnostics.push(coverageGap(chartRoot, "render-output-truncated", `helm template printed more than ${MAX_RENDER_OUTPUT_BYTES} bytes and its stdout was truncated. The rendered manifests were still validated from disk; only helm's own progress output was lost.`));
    }
    if (tree.truncated) {
      diagnostics.push(coverageGap(chartRoot, "render-truncated", `This chart rendered more than ${MAX_RENDERED_FILES} manifests; only the first ${MAX_RENDERED_FILES} were validated, so the rest are UNCHECKED rather than clean.`));
    }
    if (tree.unreadable > 0) {
      diagnostics.push(coverageGap(chartRoot, "rendered-file-unreadable", `${tree.unreadable} rendered manifest(s) could not be read back from the scratch directory and are UNCHECKED rather than clean.`));
    }
    if (tree.manifests.length === 0) {
      diagnostics.push(coverageGap(chartRoot, "render-empty", "helm template succeeded but produced no manifests to validate, so this chart is UNVALIDATED rather than clean. Check whether the chart's values disable every template."));
    }
    const iacRequested = isTrivyEnabled(cwd);
    if (iacRequested) {
      diagnostics.push(...await runIacPass({
        chartRoot,
        cwd,
        outputDir,
        manifests: tree.manifests
      }));
    }
    logRenderPass(filePath, chartRoot, startedAt, {
      outcome: "rendered",
      manifests: tree.manifests.length,
      truncated: tree.truncated,
      unreadable: tree.unreadable,
      iacRequested,
      diagnostics: diagnostics.length
    });
    return summarize(diagnostics);
  } finally {
    discardScratchDir(outputDir, filePath);
  }
}
var helmRenderRunner = {
  id: "helm-render",
  appliesTo: ["yaml", "helm-template"],
  priority: PRIORITY.GENERAL_ANALYSIS,
  skipTestFiles: false,
  timeoutMs: RENDER_TIMEOUT_MS + TRIVY_TIMEOUT_MS + 1e4,
  async run(ctx) {
    const cwd = resolveRunnerCwd(ctx, "helm-render");
    const workspaceRoot = path22.resolve(ctx.projectRoot ?? cwd);
    if (!isHelmRenderEnabled(workspaceRoot))
      return SKIPPED2;
    const startDir = path22.dirname(path22.resolve(ctx.filePath));
    const discovered = findNearestDirWithMarker(startDir, "chartYamlPath");
    if (!discovered)
      return SKIPPED2;
    const chartRoot = path22.resolve(discovered);
    if (!isWithin2(workspaceRoot, chartRoot))
      return SKIPPED2;
    if (getProjectTrustState() === "untrusted") {
      logRenderPass(ctx.filePath, chartRoot, Date.now(), {
        outcome: "refused-untrusted"
      });
      return summarize([
        coverageGap(chartRoot, "render-untrusted", `Helm rendered-manifest validation did not run: ${projectTrustDenialReason() ?? "project trust denied"}. Rendering executes this chart's own templates, so it needs host trust in addition to the \`helm.renderValidation.enabled\` switch \u2014 and that switch is a tracked file a cloned repository can set for itself.`)
      ]);
    }
    const existing = inFlightByChartRoot2.get(chartRoot);
    if (existing)
      return existing;
    const promise = renderAndValidate(chartRoot, cwd, ctx.filePath).finally(() => {
      if (inFlightByChartRoot2.get(chartRoot) === promise)
        inFlightByChartRoot2.delete(chartRoot);
    });
    inFlightByChartRoot2.set(chartRoot, promise);
    return promise;
  }
};
var helm_render_default = helmRenderRunner;

// dist/clients/dispatch/runners/htmlhint.js
import * as path23 from "node:path";
var htmlhint = createAvailabilityChecker("htmlhint");
var HTMLHINT_RULES = {
  "tag-pair": true,
  "attr-no-duplication": true,
  "tagname-lowercase": true,
  "doctype-first": false,
  "spec-char-escape": true,
  "id-unique": true
};
function parseHtmlhintOutput(raw, filePath, cwd) {
  const diagnostics = [];
  const absTarget = path23.resolve(cwd, filePath);
  const lineRe = /^(.+?):(\d+):(\d+): (.+?) \[(error|warning)\/([^\]]+)\]/;
  for (const line of raw.split("\n")) {
    const match = line.match(lineRe);
    if (!match)
      continue;
    if (!pathsEqual(path23.resolve(cwd, match[1]), absTarget))
      continue;
    const lineNum = parseInt(match[2], 10);
    const col = parseInt(match[3], 10);
    const message = match[4].trim();
    const level = match[5];
    const rule = match[6].trim();
    const severity = level === "error" ? "error" : "warning";
    diagnostics.push({
      id: `htmlhint-${rule}-${lineNum}`,
      message,
      filePath,
      line: lineNum,
      column: col,
      severity,
      semantic: severity === "error" ? "blocking" : "warning",
      tool: "htmlhint",
      rule,
      fixable: false
    });
  }
  return diagnostics;
}
var htmlhintRunner = {
  id: "htmlhint",
  appliesTo: ["html"],
  priority: PRIORITY.GENERAL_ANALYSIS,
  skipTestFiles: false,
  async run(ctx) {
    const cwd = resolveRunnerCwd(ctx, "htmlhint");
    const policy = getLinterPolicyForCwd(ctx.filePath, cwd);
    if (policy && !policy.preferredRunners.includes("htmlhint")) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    let cmd = null;
    if (await htmlhint.isAvailableAsync(cwd)) {
      cmd = htmlhint.getCommand(cwd);
    } else {
      cmd = await resolveToolCommandWithInstallFallback(cwd, "htmlhint");
    }
    if (!cmd) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const rulesArg = Object.entries(HTMLHINT_RULES).flatMap(([rule, enabled]) => enabled === true ? [rule] : []).join(",");
    const result = await safeSpawnAsync(cmd, [
      "--rules",
      rulesArg,
      "--format",
      "unix",
      path23.resolve(cwd, ctx.filePath)
    ], { cwd });
    const output = result.stdout || result.stderr || "";
    const run = parseToolRun("htmlhint", {
      result,
      output,
      // EXIT TABLE (HTMLHint 1.1 measured fixture): 0 clean; 1 findings; 2 error; other nonzero rejected.
      exitCodes: { ran: [1, 2] }
    }, (out) => parseHtmlhintOutput(out, ctx.filePath, cwd));
    if (run.skipped)
      return run.skipped;
    const diagnostics = run.diagnostics;
    return finishParsedRun({
      tool: "htmlhint",
      ctx,
      result,
      diagnostics,
      classify: (diagnostics2) => {
        const hasErrors = diagnostics2.some((d) => d.severity === "error");
        return {
          status: "failed",
          semantic: hasErrors ? "blocking" : "warning"
        };
      }
    });
  }
};
var htmlhint_default = htmlhintRunner;

// dist/clients/dispatch/runners/javac.js
import * as path24 from "node:path";
var javac = createAvailabilityChecker("javac", ".exe");
function parseJavacOutput(raw, filePath, cwd) {
  const diagnostics = [];
  const lines = raw.split(/\r?\n/);
  const absTarget = path24.resolve(cwd, filePath);
  for (const line of lines) {
    const match = line.match(/^(.*?\.java):(\d+):\s+(error|warning):\s+(.+)$/i);
    if (!match)
      continue;
    const [, reportedFile, lineStr, severityLabel, message] = match;
    if (!pathsEqual(path24.resolve(cwd, reportedFile.trim()), absTarget))
      continue;
    const severity = severityLabel.toLowerCase() === "error" ? "error" : "warning";
    const lineNum = Number.parseInt(lineStr, 10) || 1;
    diagnostics.push({
      id: `javac-${severity}-${lineNum}-${message}`,
      message: message.trim(),
      filePath,
      line: lineNum,
      column: 1,
      severity,
      // A standalone single-file javac run has no project classpath. It can
      // report useful syntax/type evidence, but it cannot prove a blocker.
      semantic: "warning",
      tool: "javac",
      rule: "compile",
      fixable: false
    });
  }
  return diagnostics;
}
var javacRunner = {
  id: "javac",
  appliesTo: ["java"],
  priority: PRIORITY.GENERAL_ANALYSIS,
  skipTestFiles: false,
  async run(ctx) {
    const cwd = resolveRunnerCwd(ctx, "javac");
    const absPath = path24.resolve(cwd, ctx.filePath);
    if (hasJavaBuildDescriptor(path24.dirname(absPath), ctx.projectRoot ?? ctx.cwd)) {
      ctx.log?.("javac: skipped \u2014 file is inside a Maven/Gradle project; a classpath-less compile would emit false positives");
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    if (!await javac.isAvailableAsync(cwd)) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const cmd = javac.getCommand(cwd);
    if (!cmd) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const result = await safeSpawnAsync(cmd, ["-Xlint:none", "-proc:none", absPath], {
      cwd,
      timeout: 3e4
    });
    const raw = `${result.stdout ?? ""}
${result.stderr ?? ""}`.trim();
    const parsed = parseToolRun("javac", {
      result,
      output: raw,
      // EXIT TABLE (javac 21 docs https://docs.oracle.com/en/java/javase/21/docs/specs/man/javac.html): 0 clean; 1 findings; 2 error; other nonzero rejected.
      exitCodes: { ran: [1, 2] }
    }, (output) => parseJavacOutput(output, ctx.filePath, cwd));
    if (parsed.skipped)
      return parsed.skipped;
    return finishParsedRun({
      tool: "javac",
      ctx,
      result,
      diagnostics: parsed.diagnostics,
      classify: (diagnostics) => ({
        status: diagnostics.some((d) => d.severity === "error") ? "failed" : "succeeded",
        semantic: "warning"
      })
    });
  }
};
var javac_default = javacRunner;

// dist/clients/dispatch/runners/ktlint.js
import * as path25 from "node:path";
var ktlint = createAvailabilityChecker("ktlint", ".exe");
var KTLINT_EXIT_CODES = { ran: [1, 2, 3] };
function normalizeKtlintResults(parsed) {
  if (Array.isArray(parsed)) {
    return parsed;
  }
  if (parsed && typeof parsed === "object" && Array.isArray(parsed.errors)) {
    return [parsed];
  }
  return null;
}
function parseKtlintOutput(raw, filePath, cwd) {
  try {
    const parsed = normalizeKtlintResults(JSON.parse(raw));
    if (!parsed)
      return null;
    const autofix = getAutofixCapability("ktlint");
    const diagnostics = [];
    const absTarget = path25.resolve(cwd, filePath);
    for (const result of parsed) {
      if (result.file && !pathsEqual(path25.resolve(cwd, result.file), absTarget))
        continue;
      for (const err of result.errors ?? []) {
        diagnostics.push({
          id: `ktlint-${err.ruleId}-${err.line}-${err.col}`,
          message: `[${err.ruleId}] ${err.detail}`,
          filePath,
          line: err.line,
          column: err.col,
          severity: "warning",
          semantic: "warning",
          tool: "ktlint",
          rule: err.ruleId,
          fixable: true,
          autoFixAvailable: autofix?.safePipelineAutofix ?? false,
          fixKind: autofix?.fixKind === "none" ? void 0 : autofix?.fixKind
        });
      }
    }
    return diagnostics;
  } catch {
    return null;
  }
}
var ktlintRunner = {
  id: "ktlint",
  appliesTo: ["kotlin"],
  priority: PRIORITY.FORMAT_AND_LINT_PRIMARY,
  skipTestFiles: false,
  async run(ctx) {
    const cwd = resolveRunnerCwd(ctx, "ktlint");
    const policy = getLinterPolicyForCwd(ctx.filePath, cwd);
    if (policy && !policy.preferredRunners.includes("ktlint")) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    let cmd = null;
    if (await ktlint.isAvailableAsync(cwd)) {
      cmd = ktlint.getCommand(cwd);
    } else {
      cmd = await resolveToolCommandWithInstallFallback(cwd, "ktlint");
    }
    if (!cmd)
      return { status: "skipped", diagnostics: [], semantic: "none" };
    const absPath = path25.resolve(cwd, ctx.filePath);
    const result = await safeSpawnAsync(cmd, ["--reporter=json", absPath], {
      cwd,
      timeout: 3e4
    });
    const run = parseToolRun("ktlint", {
      result,
      output: `${result.stdout ?? ""}
${result.stderr ?? ""}`,
      exitCodes: KTLINT_EXIT_CODES
    }, (output) => parseKtlintOutput(output, ctx.filePath, cwd) ?? []);
    if (run.skipped)
      return run.skipped;
    return finishParsedRun({
      tool: "ktlint",
      ctx,
      result,
      diagnostics: run.diagnostics
    });
  }
};
var ktlint_default = ktlintRunner;

// dist/clients/lsp/inferred-project.js
import * as path26 from "node:path";
var INFERRED_PROJECT_MARKER = "not in any tsconfig project \u2014 checked with inferred settings";
var TS_PROJECT_EXTENSIONS = /* @__PURE__ */ new Set([
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs"
]);
var TYPESCRIPT_DIAGNOSTIC_SOURCES = /* @__PURE__ */ new Set(["typescript", "ts", "tsserver"]);
function isTsProjectFile(filePath) {
  return TS_PROJECT_EXTENSIONS.has(path26.extname(filePath).toLowerCase());
}
function isTypeScriptSourcedDiagnostic(d) {
  return TYPESCRIPT_DIAGNOSTIC_SOURCES.has((d.source ?? "").toLowerCase());
}
function suggestTsconfigInclude(filePath, cwd) {
  const relative5 = toProjectRelativePath(filePath, cwd);
  if (path26.posix.isAbsolute(relative5) || /^[A-Za-z]:/.test(relative5)) {
    const dir = relative5.slice(0, relative5.lastIndexOf("/"));
    return dir ? `${dir}/**` : relative5;
  }
  const segments = relative5.split("/").filter(Boolean);
  return segments.length > 1 ? `${segments[0]}/**` : relative5;
}
function inferredProjectNotice(filePath, cwd) {
  return `[${INFERRED_PROJECT_MARKER}; add ${suggestTsconfigInclude(filePath, cwd)} to a tsconfig for authoritative checking]`;
}
function applyInferredProjectDemotion(diagnostics, filePath, cwd) {
  if (!diagnostics.some(isDemotableDiagnostic))
    return diagnostics;
  const notice = inferredProjectNotice(filePath, cwd);
  return diagnostics.map((d) => isDemotableDiagnostic(d) ? { ...d, severity: 2, message: `${d.message} ${notice}` } : d);
}
function isDemotableDiagnostic(d) {
  return d.severity === 1 && isTypeScriptSourcedDiagnostic(d);
}
async function demoteInferredProjectDiagnostics(diagnostics, options) {
  const { filePath, cwd, service } = options;
  if (!isTsProjectFile(filePath))
    return diagnostics;
  if (!diagnostics.some(isDemotableDiagnostic))
    return diagnostics;
  if (options.signal?.aborted)
    return diagnostics;
  const fetchIdentity = options.fetchIdentity ?? fetchTsserverProjectIdentity;
  const cache = options.identityCache;
  let identity;
  if (cache?.has(filePath)) {
    identity = cache.get(filePath);
  } else {
    identity = await fetchIdentity(service, filePath);
    cache?.set(filePath, identity);
  }
  if (identity?.projectKind !== "inferred")
    return diagnostics;
  return applyInferredProjectDemotion(diagnostics, filePath, cwd);
}
var INFERRED_PROJECT_PROBE_BUDGET = 300;
async function demoteInferredProjectSweepResults(results, cwd, service, signal) {
  if (typeof service?.executeReadOnlyCommandOnLiveClient !== "function") {
    return results;
  }
  const startedAt = Date.now();
  const identityCache = /* @__PURE__ */ new Map();
  const out = [];
  let demotedFiles = 0;
  let demotedDiagnostics = 0;
  let budgetExhausted = false;
  let aborted = false;
  for (const result of results) {
    const diagnostics = result.diagnostics ?? [];
    if (signal?.aborted) {
      aborted = true;
      out.push(result);
      continue;
    }
    if (identityCache.size >= INFERRED_PROJECT_PROBE_BUDGET && !identityCache.has(result.filePath)) {
      budgetExhausted = true;
      out.push(result);
      continue;
    }
    const demoted = await demoteInferredProjectDiagnostics(diagnostics, {
      filePath: result.filePath,
      cwd,
      service,
      identityCache,
      signal
    });
    if (demoted === diagnostics) {
      out.push(result);
      continue;
    }
    demotedFiles += 1;
    demotedDiagnostics += demoted.filter((d, i) => d !== diagnostics[i]).length;
    out.push({ ...result, diagnostics: demoted });
  }
  if (demotedFiles > 0 || budgetExhausted || aborted) {
    logLatency({
      type: "phase",
      phase: "lsp_inferred_project_demote",
      filePath: cwd,
      durationMs: Date.now() - startedAt,
      metadata: {
        filesConsidered: results.length,
        filesProbed: identityCache.size,
        demotedFiles,
        demotedDiagnostics,
        budgetExhausted,
        aborted
      }
    });
  }
  return out;
}

// dist/clients/dispatch/runners/utils.js
import * as fs12 from "node:fs";
function readFileContent(filePath) {
  try {
    return fs12.readFileSync(filePath, "utf-8");
  } catch {
    return void 0;
  }
}

// dist/clients/dispatch/runners/lsp.js
var LSP_SPAWN_BUDGET_MS = RUNTIME_CONFIG.pipeline.lspSpawnBudgetMs;
var LSP_DIAGNOSTICS_WAIT_MS = 2500;
var MAX_CODE_ACTION_TITLES = 3;
var LSP_COLD_SPAWN_MARGIN_MS = 5e3;
var LSP_RUNNER_TIMEOUT_MS = Math.max(LSP_SPAWN_BUDGET_MS, ...LSP_SERVERS.map((server) => server.clientWaitTimeoutMs ?? 0)) + LSP_DIAGNOSTICS_WAIT_MS + LSP_COLD_SPAWN_MARGIN_MS;
function normalizeActionTitle(title) {
  return title.replace(/\s+/g, " ").trim();
}
function buildCodeActionSuggestion(actions) {
  if (!actions.length)
    return void 0;
  const quickFixes = actions.filter((action) => action.kind?.startsWith("quickfix"));
  if (!quickFixes.length)
    return void 0;
  const titles = Array.from(new Set(quickFixes.map((action) => normalizeActionTitle(action.title)).filter((title) => title.length > 0))).slice(0, MAX_CODE_ACTION_TITLES);
  if (!titles.length)
    return void 0;
  return `LSP quick fixes: ${titles.join("; ")}`;
}
var lspRunner = {
  id: "lsp",
  // Derived from LANGUAGE_POLICY, never hand-maintained: the copy this
  // replaced had drifted (fish was lspCapable but absent, so getForKind
  // answered that no LSP runs on fish). Registering a language as lspCapable
  // is now the only step this seam needs (#1545).
  appliesTo: getLspCapableKinds(),
  priority: PRIORITY.LSP_PRIMARY,
  timeoutMs: LSP_RUNNER_TIMEOUT_MS,
  async run(ctx) {
    const diagnosticPath = resolveRunnerPath(ctx.cwd, ctx.filePath);
    if (ctx.pi.getFlag("no-lsp")) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const lspService = getLSPService();
    if (!lspService.supportsLSP(ctx.filePath)) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    let lspDiags = [];
    let serverFailed = false;
    let lspClientReady = true;
    let diagnosticsInconclusive = false;
    let inconclusiveServerIds = [];
    let unconfirmedServerIds = [];
    let deferredServerIds = [];
    let usedWarmAttach = false;
    let failureReason = "";
    const readStamp = performance.now();
    const content = readFileContent(ctx.filePath);
    if (!content) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    if (exceedsLspSyncLimits(content).tooLarge) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const auxiliaryServerIds = enabledAuxiliaryLspServerIds((f) => ctx.pi.getFlag(f));
    try {
      const attached = await tryWarmAttachedDiagnostics(ctx.filePath, content, Math.max(LSP_SPAWN_BUDGET_MS, LSP_DIAGNOSTICS_WAIT_MS));
      usedWarmAttach = attached?.available === true;
      const touched = attached?.available ? {
        diags: attached.response.diagnostics,
        ...attached.response.unconfirmedServerIds !== void 0 && {
          unconfirmedServerIds: attached.response.unconfirmedServerIds
        }
      } : await lspService.touchFile(ctx.filePath, content, {
        diagnostics: "document",
        collectDiagnostics: true,
        clientScope: auxiliaryServerIds.length > 0 ? "with-auxiliary" : "primary",
        auxiliaryServerIds,
        maxClientWaitMs: LSP_SPAWN_BUDGET_MS,
        maxDiagnosticsWaitMs: LSP_DIAGNOSTICS_WAIT_MS,
        source: "dispatch-lsp-runner",
        readStamp
      });
      if (touched === void 0) {
        lspClientReady = false;
      } else {
        lspDiags = touched.diags;
        diagnosticsInconclusive = touched.inconclusive === true;
        inconclusiveServerIds = touched.inconclusiveServerIds ?? [];
        unconfirmedServerIds = [
          .../* @__PURE__ */ new Set([
            ...touchCoverageGap(touched),
            ...diagnosticsInconclusive ? inconclusiveServerIds : []
          ])
        ];
        deferredServerIds = touched.deferredServerIds ?? [];
        if (diagnosticsInconclusive && touched.binding?.boundToCurrentDisk === false) {
          const unconfirmed = new Set(unconfirmedServerIds);
          const currentContentDiags = [];
          for (const diagnostic of lspDiags) {
            if (diagnostic.serverId !== void 0 && !unconfirmed.has(diagnostic.serverId)) {
              currentContentDiags.push(diagnostic);
            }
          }
          lspDiags = currentContentDiags;
        }
      }
    } catch (err) {
      serverFailed = true;
      failureReason = err instanceof Error ? err.message : String(err);
      if (failureReason.includes("spawn") || failureReason.includes("exited") || failureReason.includes("connection") || failureReason.includes("JSON RPC")) {
        logExtension({
          subsystem: "lsp-runner",
          message: `LSP server failed for ${diagnosticPath}: ${failureReason}`,
          metadata: { filePath: diagnosticPath }
        });
      }
    }
    if (serverFailed) {
      return {
        status: "failed",
        failureKind: "server_error",
        failureMessage: failureReason.slice(0, 200),
        diagnostics: [
          {
            id: `lsp:server-error:0`,
            message: `LSP server failed: ${failureReason}`,
            filePath: diagnosticPath,
            line: 1,
            column: 1,
            severity: "error",
            semantic: "warning",
            // Don't block - fallback to other runners
            tool: "lsp"
          }
        ],
        semantic: "warning"
      };
    }
    if (!lspClientReady) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    if (diagnosticsInconclusive && lspDiags.length === 0) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    if (lspDiags.length === 0) {
      if (deferredServerIds.length > 0) {
        return {
          status: "deferred",
          diagnostics: [],
          semantic: "none",
          unconfirmedServerIds: [...unconfirmedServerIds],
          deferredServerIds: [...deferredServerIds]
        };
      }
      if (unconfirmedServerIds.length > 0) {
        return {
          status: "skipped",
          diagnostics: [],
          semantic: "none",
          unconfirmedServerIds: [...unconfirmedServerIds]
        };
      }
      return {
        status: "succeeded",
        diagnostics: [],
        semantic: "none",
        rawOutput: "no-diagnostics"
      };
    }
    const rawValidLspDiags = lspDiags.filter((d) => d.range?.start?.line !== void 0);
    const validLspDiags = usedWarmAttach ? rawValidLspDiags : await demoteInferredProjectDiagnostics(rawValidLspDiags, {
      filePath: diagnosticPath,
      cwd: ctx.cwd,
      service: lspService
    });
    const fixSuggestionByIndex = /* @__PURE__ */ new Map();
    const blockingDiagIndexes = rawValidLspDiags.map((d, idx) => ({ d, idx })).filter(({ d }) => d.severity === 1).slice(0, WARM_CODE_ACTION_LOOKUP_LIMIT);
    if (usedWarmAttach) {
      const ranges = blockingDiagIndexes.map(({ d }) => ({
        start: d.range.start,
        end: d.range.end ?? d.range.start
      }));
      const result = await tryWarmAttachedCodeActions(ctx.filePath, contentHash(content), ranges, LSP_DIAGNOSTICS_WAIT_MS);
      if (result?.available) {
        result.response.actions.forEach((actions, responseIndex) => {
          const diagnosticIndex = blockingDiagIndexes[responseIndex]?.idx;
          const suggestion = buildCodeActionSuggestion(actions);
          if (diagnosticIndex !== void 0 && suggestion) {
            fixSuggestionByIndex.set(diagnosticIndex, suggestion);
          }
        });
      }
    } else {
      await Promise.all(blockingDiagIndexes.map(async ({ d, idx }) => {
        try {
          const start = d.range.start;
          const end = d.range.end ?? d.range.start;
          const actions = await lspService.codeAction(ctx.filePath, start.line, start.character, end.line, end.character);
          const suggestion = buildCodeActionSuggestion(actions);
          if (suggestion) {
            fixSuggestionByIndex.set(idx, suggestion);
          }
        } catch {
        }
      }));
    }
    const diagnostics = convertLspDiagnostics(validLspDiags, diagnosticPath, { fixSuggestionByIndex });
    const keptDiagnostics = retagAuxiliaryDiagnostics(diagnostics, validLspDiags, content, { cwd: ctx.cwd, fileRole: ctx.fileRole });
    const hasErrors = keptDiagnostics.some((d) => d.semantic === "blocking");
    const resultSemantic = hasErrors ? "blocking" : keptDiagnostics.length > 0 ? "warning" : "none";
    return {
      // "failed" here means the file has blocking type errors — the check ran
      // fine; findingsResult tags it so it never reads as a runner crash.
      ...findingsResult(keptDiagnostics, {
        status: hasErrors ? "failed" : deferredServerIds.length > 0 ? "deferred" : "succeeded",
        semantic: resultSemantic
      }),
      ...unconfirmedServerIds.length > 0 && {
        unconfirmedServerIds: [...unconfirmedServerIds]
      },
      ...deferredServerIds.length > 0 && {
        deferredServerIds: [...deferredServerIds]
      }
    };
  }
};
var lsp_default = lspRunner;

// dist/clients/dispatch/runners/markdownlint.js
import * as path27 from "node:path";
var markdownlint = createAvailabilityChecker("markdownlint-cli2", ".cmd", [
  "--no-globs",
  "-"
]);
var MARKDOWNLINT_EXIT_CODES = { ran: [1] };
var MARKDOWNLINT_FIXABLE_RULES = /* @__PURE__ */ new Set([
  "MD001",
  "MD004",
  "MD005",
  "MD007",
  "MD009",
  "MD010",
  "MD011",
  "MD012",
  "MD014",
  "MD018",
  "MD019",
  "MD020",
  "MD021",
  "MD022",
  "MD023",
  "MD026",
  "MD027",
  "MD030",
  "MD031",
  "MD032",
  "MD034",
  "MD037",
  "MD038",
  "MD039",
  "MD044",
  "MD047",
  "MD049",
  "MD050",
  "MD053",
  "MD058"
]);
function parseMarkdownlintOutput(raw, filePath, cwd) {
  const diagnostics = [];
  const absTarget = path27.resolve(cwd, filePath);
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim())
      continue;
    const match = line.match(/^(.*?):(\d+)(?::(\d+))?\s+(?:error|warning)?\s*(MD\d+\/[\w/-]+)\s+(.+)$/);
    if (!match)
      continue;
    const [, reported, lineNum, col, ruleCode, message] = match;
    if (reported && !pathsEqual(path27.resolve(cwd, reported), absTarget))
      continue;
    const ruleName = ruleCode.split("/")[0];
    const fixable = MARKDOWNLINT_FIXABLE_RULES.has(ruleName);
    diagnostics.push({
      id: `markdownlint-${lineNum}-${ruleName}`,
      message: `[${ruleCode}] ${message}`,
      filePath,
      line: Number(lineNum),
      column: col ? Number(col) : 1,
      severity: "warning",
      semantic: "warning",
      tool: "markdownlint",
      rule: ruleName,
      fixable,
      fixSuggestion: fixable ? "Run `markdownlint-cli2 --fix` to apply the deterministic auto-correction for this rule." : void 0
    });
  }
  return diagnostics;
}
var markdownlintRunner = {
  id: "markdownlint",
  appliesTo: ["markdown"],
  priority: PRIORITY.DOC_QUALITY,
  skipTestFiles: false,
  async run(ctx) {
    const cwd = resolveRunnerCwd(ctx, "markdownlint");
    const policy = getLinterPolicyForCwd(ctx.filePath, cwd);
    if (policy && !policy.preferredRunners.includes("markdownlint")) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    let cmd = null;
    if (await markdownlint.isAvailableAsync(cwd)) {
      cmd = markdownlint.getCommand(cwd);
    } else {
      cmd = await resolveToolCommandWithInstallFallback(cwd, "markdownlint");
    }
    if (!cmd)
      return { status: "skipped", diagnostics: [], semantic: "none" };
    if (isInSpawnTimeoutCooldown(cmd)) {
      logRunnerAdvisoryOnce(ctx, "markdownlint", cwd, `markdownlint: ${cmd} is cooling down after a spawn timeout \u2014 skipping (one bounded failure budget per edit)`);
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const configArgs = markdownlintConfigArgs(cwd);
    const result = await safeSpawnAsync(cmd, [...configArgs, ctx.filePath], {
      timeout: 15e3,
      cwd
    });
    if (result.failure === "timeout") {
      noteSpawnTimeout({
        tool: "markdownlint",
        command: cmd,
        phase: "lint",
        durationMs: 15e3,
        teardown: result.timeoutTeardown
      });
    }
    const raw = `${result.stdout ?? ""}${result.stderr ?? ""}`;
    const run = parseToolRun("markdownlint", { result, output: raw, exitCodes: MARKDOWNLINT_EXIT_CODES }, (out) => parseMarkdownlintOutput(out, ctx.filePath, cwd));
    if (run.skipped)
      return run.skipped;
    const diagnostics = run.diagnostics;
    return finishParsedRun({
      tool: "markdownlint",
      ctx,
      result,
      diagnostics,
      classify: () => ({ status: "succeeded", semantic: "warning" })
    });
  }
};
var markdownlint_default = markdownlintRunner;

// dist/clients/dispatch/runners/mypy.js
import * as path28 from "node:path";
var mypy = createAvailabilityChecker("mypy", "");
var MYPY_EXIT_CODES = { ran: [1, 2] };
function parseMypyOutput(raw, fallbackPath, cwd) {
  const diagnostics = [];
  const linePattern = /^(.+?):(\d+)(?::(\d+))?:\s*(error|warning|note):\s*(.+?)(?:\s+\[([^\]]+)\])?$/gm;
  for (const match of raw.matchAll(linePattern)) {
    const [, file, lineNum, col, level, message, errorCode] = match;
    if (!lineNum || !level || !message)
      continue;
    if (level === "note")
      continue;
    const severity = level === "error" ? "error" : "warning";
    const rule = errorCode ?? "mypy";
    const filePath = file && file.trim() ? path28.isAbsolute(file) ? file : path28.resolve(cwd, file) : fallbackPath;
    diagnostics.push({
      id: `mypy-${lineNum}-${rule}`,
      message: errorCode ? `[${errorCode}] ${message}` : message,
      filePath,
      line: Number(lineNum),
      column: col ? Number(col) : 1,
      severity,
      semantic: severity === "error" ? "blocking" : "warning",
      tool: "mypy",
      rule,
      defectClass: "correctness"
    });
  }
  return diagnostics;
}
var mypyRunner = {
  id: "mypy",
  appliesTo: ["python"],
  priority: PRIORITY.GENERAL_ANALYSIS,
  skipTestFiles: false,
  async run(ctx) {
    const cwd = resolveRunnerCwd(ctx, "mypy");
    if (!hasMypyConfig(cwd)) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    let cmd = null;
    if (await mypy.isAvailableAsync(cwd)) {
      cmd = mypy.getCommand(cwd);
    } else {
      cmd = await resolveToolCommandWithInstallFallback(cwd, "mypy");
    }
    if (!cmd)
      return { status: "skipped", diagnostics: [], semantic: "none" };
    const result = await safeSpawnAsync(cmd, ["--no-error-summary", "--show-column-numbers", ctx.filePath], { timeout: 3e4, cwd });
    const raw = `${result.stdout ?? ""}${result.stderr ?? ""}`;
    const run = parseToolRun("mypy", { result, output: result.stdout, exitCodes: MYPY_EXIT_CODES }, (out) => parseMypyOutput(out, ctx.filePath, cwd), { parseOutput: raw });
    if (run.skipped)
      return run.skipped;
    const diagnostics = run.diagnostics;
    return finishParsedRun({
      tool: "mypy",
      ctx,
      result,
      diagnostics
    });
  }
};
var mypy_default = mypyRunner;

// dist/clients/dispatch/runners/oxlint.js
import * as path29 from "node:path";
var MAX_OXLINT_OUTPUT_BYTES = 8 * 1024 * 1024;
var OXLINT_NO_FILES = /* @__PURE__ */ Symbol("oxlint-no-files");
var OXLINT_NO_FILES_UNCONFIRMED = /* @__PURE__ */ Symbol("oxlint-no-files-unconfirmed");
var OXLINT_NO_FILES_BANNER = "No files found to lint. Please check your paths and ignore patterns.";
var OXLINT_NO_FILES_REPORT_KEYS = /* @__PURE__ */ new Set([
  "diagnostics",
  "number_of_files",
  "number_of_rules",
  "threads_count",
  "start_time"
]);
function resolveLocalVp(cwd) {
  return localBinPath(findLocalBinUpwards("vp", cwd)) ?? null;
}
async function resolveVitePlusCommand(cwd) {
  const local = resolveLocalVp(cwd);
  if (local)
    return local;
  const version = await safeSpawnAsync("vp", ["--version"], {
    timeout: 5e3,
    cwd
  });
  return !version.error && version.status === 0 ? "vp" : null;
}
var oxlintRunner = {
  id: "oxlint",
  appliesTo: ["jsts"],
  priority: PRIORITY.LINT_SECONDARY,
  skipTestFiles: false,
  async run(ctx) {
    const cwd = resolveRunnerCwd(ctx, "oxlint");
    const policy = getJstsLintPolicyForCwd(cwd);
    if (!policy.preferredRunners.includes("oxlint")) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    let cmd = null;
    let args;
    if (hasVitePlusConfig(cwd)) {
      cmd = await resolveVitePlusCommand(cwd);
    }
    if (cmd) {
      args = ["lint", "--format", "json", ctx.filePath];
    } else {
      const oxlintCmd = resolveToolCommand(cwd, "oxlint") ?? "oxlint";
      cmd = await ctx.hasTool(oxlintCmd) ? oxlintCmd : await resolveToolCommandWithInstallFallback(cwd, "oxlint");
      args = ["--format", "json", ctx.filePath];
    }
    if (!cmd) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const result = await safeSpawnAsync(cmd, args, {
      cwd,
      timeout: 3e4,
      maxOutputBytes: MAX_OXLINT_OUTPUT_BYTES
    });
    const stdout = result.stdout ?? "";
    const stderr = result.stderr ?? "";
    const parsedOutput = stdout + stderr;
    const noFilesDecision = decideOxlintNoFiles(result, stdout, stderr);
    const parsedRun = parseToolRun("oxlint", {
      result,
      output: parsedOutput,
      // EXIT TABLE (oxlint 0.8 measured fixture): 0 clean; 1 findings; 2 error; other nonzero rejected.
      exitCodes: { ran: [1, 2] }
    }, () => {
      if (noFilesDecision.kind === "expected-no-files") {
        return [OXLINT_NO_FILES];
      }
      if (noFilesDecision.kind === "unconfirmed-no-files" && result.status === 0) {
        return [OXLINT_NO_FILES_UNCONFIRMED];
      }
      let parsed = parseOxlintJson(stdout, ctx.filePath, cwd);
      if (parsed.length === 0 && stdout.length > 0) {
        parsed = parseOxlintUnix(parsedOutput, ctx.filePath, cwd);
      }
      return parsed;
    }, { parseOutput: parsedOutput });
    if (parsedRun.skipped)
      return parsedRun.skipped;
    if (parsedRun.diagnostics.includes(OXLINT_NO_FILES)) {
      return {
        status: "skipped",
        diagnostics: [],
        semantic: "none",
        skipReason: "no-files-matched"
      };
    }
    if (parsedRun.diagnostics.includes(OXLINT_NO_FILES_UNCONFIRMED)) {
      const reason = noFilesDecision.kind === "unconfirmed-no-files" ? noFilesDecision.reason : "status-zero";
      return {
        status: "failed",
        diagnostics: [
          {
            id: `oxlint:no-files-unconfirmed:${reason}`,
            message: `oxlint no-files report was not canonical (${reason})`,
            filePath: ctx.filePath,
            line: 1,
            column: 1,
            severity: "warning",
            semantic: "warning",
            tool: "oxlint"
          }
        ],
        semantic: "warning",
        failureKind: "unconfirmed_output",
        failureMessage: `no-files-${reason}`
      };
    }
    const diagnostics = parsedRun.diagnostics.filter((diagnostic) => diagnostic !== OXLINT_NO_FILES && diagnostic !== OXLINT_NO_FILES_UNCONFIRMED);
    return finishParsedRun({
      tool: "oxlint",
      ctx,
      result,
      diagnostics,
      classify: (diagnostics2) => {
        const hasBlocking = diagnostics2.some((d) => d.semantic === "blocking");
        return {
          status: !hasBlocking && result.status === 0 ? "succeeded" : "failed",
          semantic: hasBlocking ? "blocking" : "warning"
        };
      }
    });
  }
};
function oxlintProcessState(result) {
  const failureKind = result.spawnFailure?.kind;
  if (truncatedByOutputCap(result))
    return "truncated";
  if (result.failure === "timeout" || failureKind === "timeout")
    return "timeout";
  if (result.failure === "aborted" || failureKind === "killed")
    return "killed";
  if (result.signal || result.failure === "signal")
    return "signal";
  if (result.failure === "spawn" || result.error)
    return "spawn";
  return "normal";
}
function isNonnegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}
function isPositiveInteger(value) {
  return Number.isInteger(value) && value >= 1;
}
function isNonnegativeFinite(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}
function decideOxlintNoFiles(result, stdout, stderr) {
  const processState = oxlintProcessState(result);
  if (processState !== "normal") {
    return {
      kind: "unconfirmed-no-files",
      reason: `process-${processState}`
    };
  }
  const jsonStart = stdout.indexOf("{");
  const bannerText = (jsonStart === -1 ? stdout : stdout.slice(0, jsonStart)).trim();
  const banner = bannerText === OXLINT_NO_FILES_BANNER ? "exact" : /no files found.+lint/i.test(bannerText) ? "near" : "missing";
  let report;
  let jsonMalformed = jsonStart === -1;
  if (jsonStart !== -1) {
    try {
      const parsed = JSON.parse(stdout.slice(jsonStart));
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        report = parsed;
      } else {
        jsonMalformed = true;
      }
    } catch {
      jsonMalformed = true;
    }
  }
  const hasFileCount = report !== void 0 && Object.prototype.hasOwnProperty.call(report, "number_of_files");
  const fileCount = report?.number_of_files;
  const hasNoFilesEvidence = banner !== "missing" || hasFileCount && (fileCount === 0 || !isNonnegativeInteger(fileCount));
  if (!hasNoFilesEvidence)
    return { kind: "ordinary-report" };
  if (result.status == null) {
    return { kind: "unconfirmed-no-files", reason: "status-null" };
  }
  if (result.status === 0) {
    return { kind: "unconfirmed-no-files", reason: "status-zero" };
  }
  if (result.status !== 1) {
    return { kind: "unconfirmed-no-files", reason: "status-other" };
  }
  if (stderr.trim().length > 0) {
    return { kind: "unconfirmed-no-files", reason: "stderr-nonempty" };
  }
  if (banner === "near") {
    return { kind: "unconfirmed-no-files", reason: "banner-near" };
  }
  if (banner === "missing") {
    return { kind: "unconfirmed-no-files", reason: "banner-missing" };
  }
  if (jsonMalformed || !report) {
    return { kind: "unconfirmed-no-files", reason: "json-malformed" };
  }
  const keys = Object.keys(report);
  if (keys.some((key2) => !OXLINT_NO_FILES_REPORT_KEYS.has(key2))) {
    return { kind: "unconfirmed-no-files", reason: "json-unknown-key" };
  }
  if (OXLINT_NO_FILES_REPORT_KEYS.size !== keys.length || [...OXLINT_NO_FILES_REPORT_KEYS].some((key2) => !Object.prototype.hasOwnProperty.call(report, key2))) {
    return { kind: "unconfirmed-no-files", reason: "json-missing-key" };
  }
  if (!Array.isArray(report.diagnostics) || !isNonnegativeInteger(report.number_of_files) || !isNonnegativeInteger(report.number_of_rules) || !isPositiveInteger(report.threads_count) || !isNonnegativeFinite(report.start_time)) {
    return {
      kind: "unconfirmed-no-files",
      reason: "json-known-field-invalid"
    };
  }
  if (report.diagnostics.length > 0) {
    return { kind: "unconfirmed-no-files", reason: "diagnostics-nonempty" };
  }
  if (report.number_of_files !== 0) {
    return { kind: "unconfirmed-no-files", reason: "files-nonzero" };
  }
  return { kind: "expected-no-files" };
}
function extractOxlintRule(code) {
  if (!code)
    return "unknown";
  const open = code.indexOf("(");
  if (open === -1)
    return code;
  const close = code.indexOf(")", open + 1);
  if (close === -1 || close === open + 1)
    return code;
  return code.slice(open + 1, close);
}
function parseOxlintJson(raw, filePath, cwd) {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("{"))
    return [];
  let parsed;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed.diagnostics))
    return [];
  const diagnostics = [];
  const absTarget = path29.resolve(cwd, filePath);
  for (const d of parsed.diagnostics) {
    if (!d.filename || !pathsEqual(path29.resolve(cwd, d.filename), absTarget)) {
      continue;
    }
    const rule = extractOxlintRule(d.code);
    const label = d.labels?.[0]?.span;
    const lineNum = label?.line ?? 1;
    const colNum = label?.column ?? 1;
    const severity = d.severity === "error" ? "error" : "warning";
    const help = d.help?.trim();
    diagnostics.push({
      id: `oxlint-${rule}-${lineNum}`,
      message: `${d.message ?? "oxlint issue"} (${rule})`,
      filePath,
      line: lineNum,
      column: colNum,
      severity,
      semantic: severity === "error" ? "blocking" : "warning",
      tool: "oxlint",
      rule,
      // Oxlint's help text is rule-specific guidance ("Remove the debugger
      // statement", "Consider removing this declaration"). Surface it as a
      // fix suggestion so the warning becomes actionable instead of falling
      // silently into code-quality.
      fixSuggestion: help && help.length > 0 ? help : void 0
    });
  }
  return diagnostics;
}
function parseOxlintUnix(raw, filePath, cwd) {
  const diagnostics = [];
  const absTarget = path29.resolve(cwd, filePath);
  for (const line of raw.split("\n")) {
    const match = line.match(/^(.+):(\d+):(\d+):\s*(.+?)\s*\(([^)]+)\)$/);
    if (match) {
      const [, reportedPath, lineStr, _col, message, rule] = match;
      if (!reportedPath || !lineStr || !message || !rule)
        continue;
      if (!pathsEqual(path29.resolve(cwd, reportedPath), absTarget))
        continue;
      diagnostics.push({
        id: `oxlint-${rule}-${lineStr}`,
        message: `${message} (${rule})`,
        filePath,
        line: parseInt(lineStr, 10),
        severity: "warning",
        semantic: "warning",
        tool: "oxlint",
        rule
      });
    }
  }
  return diagnostics;
}
var oxlint_default = oxlintRunner;

// dist/clients/dispatch/runners/php-lint.js
import * as path30 from "node:path";
var PHP_LINT_EXIT_CODES = { ran: [1, 255] };
var php = createAvailabilityChecker("php", ".exe");
function parsePhpLintOutput(raw, filePath, cwd) {
  const output = raw.trim();
  if (!output || !/(?:PHP )?Parse error:/i.test(output))
    return [];
  const lineMatch = output.match(/on line (\d+)/i);
  const messageMatch = output.match(/PHP Parse error:\s*(.+?)(?:\s+in\s+(.+?)\s+on line \d+)?$/im) ?? output.match(/Parse error:\s*(.+?)(?:\s+in\s+(.+?)\s+on line \d+)?$/im);
  const reported = messageMatch?.[2]?.trim();
  if (reported && !pathsEqual(path30.resolve(cwd, reported), path30.resolve(cwd, filePath)))
    return [];
  return [
    {
      id: `php-lint:${lineMatch?.[1] ?? "1"}`,
      message: messageMatch?.[1]?.trim() ?? output,
      filePath,
      line: lineMatch ? Number.parseInt(lineMatch[1], 10) : 1,
      column: 1,
      severity: "error",
      semantic: "blocking",
      tool: "php-lint",
      rule: "syntax",
      fixable: false
    }
  ];
}
var phpLintRunner = {
  id: "php-lint",
  appliesTo: ["php"],
  priority: PRIORITY.GENERAL_ANALYSIS,
  skipTestFiles: false,
  async run(ctx) {
    const cwd = resolveRunnerCwd(ctx, "php-lint");
    const cmd = ctx.analysisRootMode === "adopted" ? resolveAdoptedRootCommand("php", ctx, cwd) : await php.isAvailableAsync(cwd) ? php.getCommand(cwd) : null;
    if (!cmd)
      return { status: "skipped", diagnostics: [], semantic: "none" };
    const absPath = path30.resolve(cwd, ctx.filePath);
    const result = await safeSpawnAsync(cmd, ["-l", absPath], {
      timeout: 15e3,
      cwd
    });
    const run = parseToolRun("php-lint", {
      result,
      output: `${result.stdout ?? ""}
${result.stderr ?? ""}`,
      exitCodes: PHP_LINT_EXIT_CODES
    }, (output) => parsePhpLintOutput(output, ctx.filePath, cwd));
    if (run.skipped)
      return run.skipped;
    return finishParsedRun({
      tool: "php-lint",
      ctx,
      result,
      diagnostics: run.diagnostics,
      classify: () => ({ status: "failed", semantic: "blocking" })
    });
  }
};
var php_lint_default = phpLintRunner;

// dist/clients/dispatch/runners/phpstan.js
import * as path31 from "node:path";
var PHPSTAN_EXIT_CODES = { ran: [1] };
var phpstan = createAvailabilityChecker("phpstan", ".phar");
function parsePhpstanJson(raw, fallbackPath, cwd) {
  try {
    const output = JSON.parse(raw);
    const diagnostics = [];
    for (const [file, fileErrors] of Object.entries(output.files ?? {})) {
      const filePath = file && file.trim() ? path31.isAbsolute(file) ? file : path31.resolve(cwd, file) : fallbackPath;
      for (const err of fileErrors?.messages ?? []) {
        diagnostics.push({
          id: `phpstan:${err.line ?? 1}:${err.message.slice(0, 40)}`,
          message: err.message,
          filePath,
          line: err.line ?? 1,
          column: 1,
          severity: "error",
          semantic: "blocking",
          tool: "phpstan",
          rule: err.identifier || "phpstan",
          fixable: false
        });
      }
    }
    for (const message of output.errors ?? []) {
      if (typeof message !== "string" || !message.trim())
        continue;
      diagnostics.push({
        id: `phpstan:global:${message.slice(0, 40)}`,
        message,
        filePath: fallbackPath,
        line: 1,
        column: 1,
        severity: "error",
        semantic: "blocking",
        tool: "phpstan",
        rule: "phpstan/analysis",
        fixable: false
      });
    }
    return diagnostics;
  } catch {
    return [];
  }
}
async function resolvePhpstan(cwd) {
  if (await phpstan.isAvailableAsync(cwd))
    return phpstan.getCommand(cwd);
  return resolveVendorToolCommand(cwd, "phpstan", ".bat");
}
var phpstanRunner = {
  id: "phpstan",
  appliesTo: ["php"],
  priority: PRIORITY.GENERAL_ANALYSIS,
  skipTestFiles: false,
  async run(ctx) {
    const cwd = resolveRunnerCwd(ctx, "phpstan");
    const policy = getLinterPolicyForCwd(ctx.filePath, cwd);
    if (policy && !policy.preferredRunners.includes("phpstan")) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    if (!hasPhpstanConfig(cwd)) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const cmd = await resolvePhpstan(cwd);
    if (!cmd)
      return { status: "skipped", diagnostics: [], semantic: "none" };
    const absPath = path31.resolve(cwd, ctx.filePath);
    const result = await safeSpawnAsync(cmd, ["analyse", "--error-format=json", "--no-progress", absPath], { timeout: 3e4, cwd });
    const run = parseToolRun("phpstan", { result, exitCodes: PHPSTAN_EXIT_CODES }, (out) => parsePhpstanJson(out, ctx.filePath, cwd), { parseOutput: result.stdout ?? "" });
    if (run.skipped)
      return run.skipped;
    const diagnostics = run.diagnostics;
    return finishParsedRun({
      tool: "phpstan",
      ctx,
      result,
      diagnostics,
      classify: () => ({ status: "failed", semantic: "blocking" })
    });
  }
};
var phpstan_default = phpstanRunner;

// dist/clients/dispatch/runners/prisma-validate.js
import * as path32 from "node:path";
var PRISMA_VALIDATION_REPORT = /\bValidation Error Count:\s*\d+/;
function parsePrismaValidateOutput(raw, filePath) {
  const output = raw.split("\n").map((line) => line.trim()).filter(Boolean).filter((line) => !line.startsWith("Environment variables loaded")).filter((line) => !line.startsWith("Prisma schema loaded")).join(" ");
  if (!output)
    return [];
  const message = output.match(/Error:\s*(.+)$/i)?.[1]?.trim() ?? output.match(/Validation Error Count:\s*\d+\s*(.+)$/i)?.[1]?.trim() ?? output;
  const lineMatch = output.match(/:(\d+)(?::\d+)?\b/);
  return [
    {
      id: `prisma-validate:${lineMatch?.[1] ?? "1"}`,
      message,
      filePath,
      line: lineMatch ? Number.parseInt(lineMatch[1], 10) : 1,
      column: 1,
      severity: "error",
      semantic: "blocking",
      tool: "prisma-validate",
      rule: "schema",
      fixable: false
    }
  ];
}
var prismaValidateRunner = {
  id: "prisma-validate",
  appliesTo: ["prisma"],
  priority: PRIORITY.GENERAL_ANALYSIS,
  skipTestFiles: false,
  async run(ctx) {
    const cwd = resolveRunnerCwd(ctx, "prisma-validate");
    const resolved = await resolveLocalFirstAsync("prisma", cwd);
    const absPath = path32.resolve(cwd, ctx.filePath);
    const result = await safeSpawnAsync(resolved.cmd, [...resolved.args, "validate", "--schema", absPath], {
      timeout: 2e4,
      // ONE neutral-cwd seam for npx fallbacks (#4193, #4268 acceptance 3),
      // an override of the resolver's project cwd that the scan can still see.
      cwd,
      ...resolved.cmd === "npx" ? getIsolatedNpxSpawnOptions() : {}
    });
    if (result.error && !result.stdout && !result.stderr) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    if (result.status === 0) {
      return { status: "succeeded", diagnostics: [], semantic: "none" };
    }
    const output = `${result.stdout ?? ""}
${result.stderr ?? ""}`;
    const diagnostics = parsePrismaValidateOutput(output, ctx.filePath);
    if (diagnostics.length === 0) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    return finishParsedRun({
      tool: "prisma-validate",
      ctx,
      result,
      // #3781: only prisma's own validation report is findings. Any other
      // nonzero output (npm's E404 when `npx --no prisma` has nothing to
      // run) is a tool that never validated, and goes to the shared
      // parse-error arm instead of becoming a blocking "schema" finding.
      diagnostics: PRISMA_VALIDATION_REPORT.test(output) ? diagnostics : [],
      classify: () => ({ status: "failed", semantic: "blocking" })
    });
  }
};
var prisma_validate_default = prismaValidateRunner;

// dist/clients/dispatch/runners/psscriptanalyzer.js
import * as fs13 from "node:fs/promises";
import * as os2 from "node:os";
import * as path33 from "node:path";
var PS_SCRIPT = `
param([string]$FilePath)
Import-Module PSScriptAnalyzer -ErrorAction Stop
$results = @(Invoke-ScriptAnalyzer -Path $FilePath | Select-Object RuleName,@{N='Severity';E={$_.Severity.ToString()}},Line,Column,Message)
if ($results.Count -eq 0) { Write-Output '[]'; exit 0 }
$results | ConvertTo-Json -Depth 3 -Compress
`.trim();
var PS_TIMEOUT_MS = 3e4;
function spawnPs(cmd, args, options) {
  const { timeoutMs = PS_TIMEOUT_MS, cwd } = options;
  return safeSpawnAsync(cmd, args, {
    cwd,
    timeout: timeoutMs,
    resourceLabel: "psscriptanalyzer"
  });
}
var psCmdLatch = createAvailabilityLatch();
var psAnalyzerLatchByCmd = /* @__PURE__ */ new Map();
var psExecLatchByCmd = /* @__PURE__ */ new Map();
var psCmd = null;
function notePsDecision(latch, tool, verdict) {
  let retryAfterMs;
  if (verdict.available) {
    latch.noteAvailable();
  } else {
    const delay = latch.noteUnavailable(verdict.outcome, verdict.cause);
    if (delay > 0)
      retryAfterMs = delay;
  }
  logAvailabilityDecision({
    tool,
    verdict: verdict.available ? "available" : "unavailable",
    outcome: verdict.available ? "success" : verdict.outcome,
    cause: verdict.available ? "ok" : verdict.cause,
    elapsedMs: verdict.elapsedMs,
    latched: verdict.available || isLatchingOutcome(verdict.outcome),
    classifiedBy: "probe",
    hostStallMs: verdict.hostStallMs,
    ...retryAfterMs !== void 0 && { retryAfterMs },
    budgetMs: PS_TIMEOUT_MS
  });
}
function resetPsScriptAnalyzerAvailability() {
  psCmdLatch.reset();
  psAnalyzerLatchByCmd.clear();
  psExecLatchByCmd.clear();
  psCmd = null;
}
async function resolvePowerShellCmd() {
  const memo = psCmdLatch.read();
  if (memo !== null)
    return memo ? psCmd : null;
  let transient = null;
  let rejected = null;
  let elapsedTotalMs = 0;
  let stallTotalMs = 0;
  for (const candidate of ["pwsh", "powershell"]) {
    const sampler = startHostStallSampler();
    const startedAt = Date.now();
    const result = await probeToolAsync(candidate, ["-NoProfile", "-NonInteractive", "-Command", "exit 0"], { timeout: PS_TIMEOUT_MS, resourceLabel: "psscriptanalyzer" });
    const hostStallMs = sampler.stop();
    const elapsedMs = Date.now() - startedAt;
    elapsedTotalMs += elapsedMs;
    stallTotalMs += hostStallMs;
    if (!result.error && result.status === 0) {
      psCmd = candidate;
      notePsDecision(psCmdLatch, "powershell", {
        available: true,
        elapsedMs,
        hostStallMs
      });
      return candidate;
    }
    const classified = classifyProbeFailure(result, { hostStallMs });
    if (classified.outcome === "transient")
      transient ??= classified;
    else if (classified.outcome !== "missing")
      rejected ??= classified;
  }
  psCmd = null;
  const verdict = transient ?? rejected ?? {
    outcome: "missing",
    cause: "not-found"
  };
  notePsDecision(psCmdLatch, "powershell", {
    available: false,
    outcome: verdict.outcome,
    cause: verdict.cause,
    elapsedMs: elapsedTotalMs,
    hostStallMs: stallTotalMs
  });
  return null;
}
async function checkModuleAvailable(cmd) {
  let latch = psAnalyzerLatchByCmd.get(cmd);
  if (!latch) {
    latch = createAvailabilityLatch();
    psAnalyzerLatchByCmd.set(cmd, latch);
  }
  const memo = latch.read();
  if (memo !== null)
    return memo;
  const sampler = startHostStallSampler();
  const startedAt = Date.now();
  const result = await probeToolAsync(cmd, [
    "-NoProfile",
    "-NonInteractive",
    "-Command",
    "if (Get-Module -ListAvailable PSScriptAnalyzer) { exit 0 } else { exit 1 }"
  ], { timeout: PS_TIMEOUT_MS, resourceLabel: "psscriptanalyzer" });
  const hostStallMs = sampler.stop();
  const elapsedMs = Date.now() - startedAt;
  if (!result.error && result.status === 0) {
    notePsDecision(latch, "psscriptanalyzer", {
      available: true,
      elapsedMs,
      hostStallMs
    });
    return true;
  }
  const moduleAbsent = result.status === 1 && !result.failure && !result.error;
  const classified = classifyProbeFailure(result, {
    hostStallMs,
    ...moduleAbsent && { unclassifiedFailureOutcome: "missing" }
  });
  let { outcome, cause } = classified;
  if (!moduleAbsent && outcome !== "transient") {
    outcome = "transient";
    cause = "probe-rejected";
  }
  notePsDecision(latch, "psscriptanalyzer", {
    available: false,
    outcome,
    cause,
    elapsedMs,
    hostStallMs
  });
  return false;
}
function parsePSAnalyzerOutput(raw, filePath) {
  const trimmed = raw.trim();
  if (!trimmed)
    return null;
  if (trimmed === "[]")
    return [];
  let parsed;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return null;
  }
  const items = Array.isArray(parsed) ? parsed : [parsed];
  return items.filter((item) => item.Message && item.Line).map((item) => {
    const sev = (item.Severity ?? "Warning").toLowerCase();
    const severity = sev === "error" || sev === "parseerror" ? "error" : sev === "information" ? "info" : "warning";
    const rule = item.RuleName ?? "PSScriptAnalyzer";
    return {
      id: `psscriptanalyzer-${rule}-${item.Line}`,
      message: `[${rule}] ${item.Message}`,
      filePath,
      line: item.Line,
      column: item.Column ?? 1,
      severity,
      semantic: severity === "error" ? "blocking" : "warning",
      tool: "psscriptanalyzer",
      rule,
      fixable: false
    };
  });
}
var psScriptAnalyzerRunner = {
  id: "psscriptanalyzer",
  appliesTo: ["powershell"],
  priority: PRIORITY.GENERAL_ANALYSIS,
  skipTestFiles: false,
  async run(ctx) {
    const cmd = await resolvePowerShellCmd();
    if (!cmd)
      return { status: "skipped", diagnostics: [], semantic: "none" };
    if (!await checkModuleAvailable(cmd)) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    let execLatch = psExecLatchByCmd.get(cmd);
    if (!execLatch) {
      execLatch = createAvailabilityLatch();
      psExecLatchByCmd.set(cmd, execLatch);
    }
    if (execLatch.read() === false) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const cwd = resolveRunnerCwd(ctx, "psscriptanalyzer");
    const absPath = path33.resolve(cwd, ctx.filePath);
    const tmpScript = path33.join(os2.tmpdir(), `pi-lens-psa-${process.pid}.ps1`);
    await fs13.writeFile(tmpScript, PS_SCRIPT, "utf-8");
    try {
      const sampler = startHostStallSampler();
      const startedAt = Date.now();
      const result = await spawnPs(cmd, [
        "-NoProfile",
        "-NonInteractive",
        "-File",
        tmpScript,
        "-FilePath",
        absPath
      ], { timeoutMs: PS_TIMEOUT_MS, cwd });
      const hostStallMs = sampler.stop();
      const elapsedMs = Date.now() - startedAt;
      if (result.status === null) {
        const classified = classifyProbeFailure(result, { hostStallMs });
        let { outcome, cause } = classified;
        if (outcome !== "transient") {
          outcome = "transient";
          cause = "probe-rejected";
        }
        notePsDecision(execLatch, "psscriptanalyzer-exec", {
          available: false,
          outcome,
          cause,
          elapsedMs,
          hostStallMs
        });
        incrementDegradationCount({
          kind: "grammar-blocked",
          subject: "psscriptanalyzer",
          reason: `PowerShell (${cmd}) -File analysis exited with no status -- crash or signal-killed process`
        });
        return { status: "skipped", diagnostics: [], semantic: "none" };
      }
      if (result.status !== 0) {
        const stderrText = result.stderr ?? "";
        const policyDenied = /securityerror/i.test(stderrText) && (/execution polic(y|ies)/i.test(stderrText) || /running scripts is disabled/i.test(stderrText) || /unauthorizedaccess/i.test(stderrText));
        const classified = classifyProbeFailure(result, { hostStallMs });
        let { outcome, cause } = classified;
        if (policyDenied) {
          outcome = "non-installable";
          cause = "policy-denied";
        } else if (outcome !== "transient") {
          outcome = "transient";
          cause = "probe-rejected";
        }
        notePsDecision(execLatch, "psscriptanalyzer-exec", {
          available: false,
          outcome,
          cause,
          elapsedMs,
          hostStallMs
        });
        incrementDegradationCount({
          kind: "grammar-blocked",
          subject: "psscriptanalyzer",
          reason: policyDenied ? `PowerShell execution policy blocked -File analysis for ${cmd}: ${stderrText.trim().split("\n")[0] || "SecurityError"}` : `PowerShell -File analysis for ${cmd} exited ${result.status}: ${stderrText.trim().slice(0, 200) || "no stderr"}`
        });
        return { status: "skipped", diagnostics: [], semantic: "none" };
      }
      if (execLatch.read() === null) {
        notePsDecision(execLatch, "psscriptanalyzer-exec", {
          available: true,
          elapsedMs,
          hostStallMs
        });
      }
      const diagnostics = parsePSAnalyzerOutput(result.stdout, ctx.filePath);
      if (diagnostics === null) {
        const unreadableReason = result.stdout.trim() ? "unparseable" : "empty";
        logAvailabilityDecision({
          tool: "psscriptanalyzer-stdout",
          verdict: "unavailable",
          outcome: "transient",
          cause: "empty-result",
          elapsedMs,
          latched: false,
          hostStallMs,
          budgetMs: PS_TIMEOUT_MS,
          // A read of the process's own stdout, not classifyProbeFailure, is
          // what decided this (#2209).
          classifiedBy: "caller"
        });
        incrementDegradationCount({
          kind: "grammar-blocked",
          subject: "psscriptanalyzer",
          reason: `PowerShell -File analysis for ${cmd} exited 0 but stdout was ${unreadableReason}`
        });
        return { status: "skipped", diagnostics: [], semantic: "none" };
      }
      if (diagnostics.length === 0) {
        return { status: "succeeded", diagnostics: [], semantic: "none" };
      }
      const hasErrors = diagnostics.some((d) => d.severity === "error");
      return findingsResult(diagnostics, {
        status: hasErrors ? "failed" : "succeeded",
        semantic: hasErrors ? "blocking" : "warning"
      });
    } finally {
      await fs13.unlink(tmpScript).catch(() => {
      });
    }
  }
};
var psscriptanalyzer_default = psScriptAnalyzerRunner;

// dist/clients/dispatch/runners/pyright.js
var pyright = createAvailabilityChecker("pyright", ".exe");
var pyrightRunner = {
  id: "pyright",
  appliesTo: ["python"],
  priority: PRIORITY.LSP_FALLBACK,
  timeoutMs: 75e3,
  async run(ctx) {
    if (!ctx.pi.getFlag("no-lsp")) {
      const lspService = getLSPService();
      await lspService.getClientForFile(ctx.filePath);
    }
    const cwd = resolveRunnerCwd(ctx, "pyright");
    let cmd = null;
    if (await pyright.isAvailableAsync(cwd)) {
      cmd = pyright.getCommand(cwd);
    }
    if (!cmd) {
      const installedPath = await resolveAvailableOrInstall(pyright, "pyright", cwd);
      if (installedPath)
        cmd = installedPath;
    }
    if (!cmd) {
      const { findCommandAsync } = await import("./chunk-67WMNWEE.js");
      const foundCmd = await findCommandAsync("pyright");
      if (foundCmd)
        cmd = foundCmd;
    }
    if (!cmd) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const pythonEnvironment = await detectPythonEnvironment(cwd);
    const env = augmentPythonEnvironment(process.env, pythonEnvironment);
    const result = await safeSpawnAsync(cmd, ["--outputjson", ctx.filePath], {
      timeout: 6e4,
      cwd,
      env
    });
    if (result.error) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const output = (result.stdout || "").trim();
    if (!output) {
      return finishParsedRun({
        tool: "pyright",
        ctx,
        result,
        diagnostics: []
      });
    }
    try {
      const data = JSON.parse(output);
      const diagnostics = parsePyrightOutput(data, ctx.filePath);
      return finishParsedRun({
        tool: "pyright",
        ctx,
        result,
        diagnostics,
        classify: (diagnostics2) => {
          const hasErrors = diagnostics2.some((d) => d.severity === "error");
          return {
            status: hasErrors ? "failed" : "succeeded",
            semantic: hasErrors ? "blocking" : "warning"
          };
        }
      });
    } catch {
      logExtension({
        subsystem: "runner:pyright",
        message: `JSON parse failed for ${ctx.filePath} \u2014 raw output: ${output.slice(0, 200)}`,
        metadata: { filePath: ctx.filePath }
      });
      return {
        status: "failed",
        diagnostics: [],
        semantic: "none",
        rawOutput: output.slice(0, 500)
      };
    }
  }
};
function normalizePyrightSeverity(raw) {
  switch (raw) {
    case "error":
      return "error";
    case "information":
      return "info";
    // "warning" and any unrecognized value fall back below — the tier
    // every pyright diagnostic reported at before this fix, so reviving
    // the info tier never silently demotes an existing finding. There is
    // no separate `case "warning"` branch: it would be redundant with
    // this default and unprovable as its own branch.
    default:
      return "warning";
  }
}
function parsePyrightOutput(data, _filePath) {
  const diagnostics = [];
  const generalDiags = data.generalDiagnostics || [];
  for (const diag of generalDiags) {
    const start = diag.range?.start;
    diagnostics.push({
      id: `pyright-${diag.rule || start?.line || "unknown"}`,
      message: diag.message || "Type error",
      filePath: diag.file || _filePath,
      line: (start?.line ?? 0) + 1,
      column: (start?.character ?? 0) + 1,
      severity: normalizePyrightSeverity(diag.severity),
      // Blocking classification stays error-only — reviving the info tier
      // must never widen what fails a turn.
      semantic: diag.severity === "error" ? "blocking" : "warning",
      tool: "pyright",
      rule: diag.rule
    });
  }
  return diagnostics;
}
var pyright_default = pyrightRunner;

// dist/clients/dispatch/runners/rubocop.js
import * as path34 from "node:path";
var SEVERITY_MAP = {
  fatal: "error",
  error: "error",
  warning: "warning",
  convention: "warning",
  refactor: "info"
};
function parseRubocopJson(raw, filePath, cwd) {
  try {
    const output = JSON.parse(raw);
    const autofix = getAutofixCapability("rubocop");
    const diagnostics = [];
    const absTarget = path34.resolve(cwd, filePath);
    for (const file of output.files) {
      if (file.path && !pathsEqual(path34.resolve(cwd, file.path), absTarget))
        continue;
      for (const offense of file.offenses) {
        const severity = SEVERITY_MAP[offense.severity] ?? "warning";
        diagnostics.push({
          id: `rubocop:${offense.cop_name}:${offense.location.line}`,
          message: `${offense.cop_name}: ${offense.message}`,
          filePath,
          line: offense.location.line,
          column: offense.location.column,
          severity,
          semantic: severity === "error" ? "blocking" : "warning",
          tool: "rubocop",
          rule: offense.cop_name,
          fixable: offense.correctable,
          autoFixAvailable: offense.correctable && (autofix?.safePipelineAutofix ?? false),
          fixKind: offense.correctable && autofix?.fixKind !== "none" ? autofix?.fixKind : void 0
        });
      }
    }
    return diagnostics;
  } catch {
    return [];
  }
}
var rubocopRunner = {
  id: "rubocop",
  appliesTo: ["ruby"],
  priority: PRIORITY.FORMAT_AND_LINT_PRIMARY,
  async run(ctx) {
    const cwd = resolveRunnerCwd(ctx, "rubocop");
    const policy = getLinterPolicyForCwd(ctx.filePath, cwd);
    if (policy && !policy.preferredRunners.includes("rubocop")) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const resolved = await resolveCommandArgsWithInstallFallback(getRubocopCommand(cwd), "rubocop", cwd, ["--version"], 1e4);
    if (!resolved) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const { cmd, args } = resolved;
    const result = await safeSpawnAsync(cmd, [...args, "--format", "json", "--no-color", ctx.filePath], { timeout: 3e4, cwd });
    const run = parseToolRun("rubocop", {
      result,
      // Classify both streams so stderr-only failures reach the parse-error
      // path, while parseOutput keeps RuboCop's native JSON parser on stdout.
      output: `${result.stdout}${result.stderr}`,
      exitCodes: { ran: [1, 2] }
    }, (output) => parseRubocopJson(output, ctx.filePath, cwd), { parseOutput: result.stdout });
    if (run.skipped)
      return run.skipped;
    return finishParsedRun({
      tool: "rubocop",
      ctx,
      result,
      diagnostics: run.diagnostics
    });
  }
};
var rubocop_default = rubocopRunner;

// dist/clients/dispatch/runners/ruff.js
var ruff = createAvailabilityChecker("ruff", ".exe");
function parseRuffJson(raw, filePath) {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed))
      return [];
    const autofix = getAutofixCapability("ruff");
    return parsed.map((item, index) => {
      const severity = item.severity === "error" ? "error" : "warning";
      const code = item.code || "ruff";
      const toolFixable = Boolean(item.fix);
      return {
        id: `ruff-${code}-${item.location?.row ?? index + 1}`,
        message: item.message || code,
        filePath: item.filename || filePath,
        line: item.location?.row ?? 1,
        column: item.location?.column ?? 1,
        severity,
        semantic: severity === "error" ? "blocking" : "warning",
        tool: "ruff",
        rule: code,
        fixable: toolFixable,
        autoFixAvailable: toolFixable && (autofix?.safePipelineAutofix ?? false),
        fixKind: toolFixable && autofix?.fixKind !== "none" ? autofix?.fixKind : void 0
      };
    });
  } catch {
    return [];
  }
}
var ruffRunner = {
  id: "ruff-lint",
  appliesTo: ["python"],
  priority: PRIORITY.FORMAT_AND_LINT_PRIMARY,
  async run(ctx) {
    const cwd = resolveRunnerCwd2(ctx, "ruff");
    const policy = getLinterPolicyForCwd(ctx.filePath, cwd);
    if (policy && !policy.preferredRunners.includes("ruff-lint")) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const cmd = await resolveAvailableOrInstall(ruff, "ruff", cwd);
    if (!cmd) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const configArgs = ruffConfigArgs(cwd);
    const checkResult = await safeSpawnAsync(cmd, ["check", "--output-format", "json", ...configArgs, ctx.filePath], { cwd, timeout: 3e4 });
    const raw = stripAnsi(checkResult.stdout + checkResult.stderr);
    const run = parseToolRun("ruff", { result: checkResult, output: raw, exitCodes: { ran: [1, 2] } }, (output) => {
      const diagnostics = parseRuffJson(output, ctx.filePath);
      return diagnostics.length > 0 ? diagnostics : parseRuffOutput(output, ctx.filePath, cwd);
    });
    if (run.skipped)
      return run.skipped;
    return finishParsedRun({
      tool: "ruff",
      ctx,
      result: checkResult,
      diagnostics: run.diagnostics
    });
  }
};
var ruff_default = ruffRunner;

// dist/clients/dispatch/runners/rust-clippy.js
import { isAbsolute as isAbsolute6, resolve as resolve30 } from "node:path";
var CLIPPY_PROBE_BUDGET_MS = 8e3;
var clippyProbeRevision = 0;
var makeClippyProbe = (cargoExe, flightKeyComponent = cargoExe) => createCwdCachedProbe((cwd) => safeSpawnAsync(cargoExe, ["clippy", "--version"], {
  timeout: CLIPPY_PROBE_BUDGET_MS,
  cwd
}), {
  tool: "clippy",
  budgetMs: CLIPPY_PROBE_BUDGET_MS,
  flightKeyComponent
});
var clippyAvailabilityByCargo = /* @__PURE__ */ new Map();
function getClippyProbe(cargoExe) {
  return clippyAvailabilityByCargo.get(cargoExe) ?? refreshClippyProbe(cargoExe);
}
function refreshClippyProbe(cargoExe) {
  const created = makeClippyProbe(cargoExe, `${cargoExe}#refresh-${++clippyProbeRevision}`);
  clippyAvailabilityByCargo.set(cargoExe, created);
  return created;
}
var rustClippyRunner = {
  id: "rust-clippy",
  appliesTo: ["rust"],
  priority: PRIORITY.SPECIALIZED_ANALYSIS,
  timeoutMs: 9e4,
  async run(ctx) {
    const cargoExe = await rustClient.findCargoPathAsync();
    if (!cargoExe) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const clippyProbe = getClippyProbe(cargoExe);
    if (!await clippyProbe(ctx.cwd)) {
      if (clippyProbe.getVerdict(ctx.cwd).outcome === "transient") {
        return { status: "skipped", diagnostics: [], semantic: "none" };
      }
      await tryLazyInstall("rust-clippy", ctx.cwd);
      const refreshedProbe = refreshClippyProbe(cargoExe);
      if (!await refreshedProbe(ctx.cwd)) {
        const verdict = refreshedProbe.getVerdict(ctx.cwd);
        logAvailabilityDecision({
          tool: "rust-clippy",
          verdict: "unavailable",
          outcome: verdict.outcome ?? "missing",
          cause: verdict.cause ?? "not-found",
          classifiedBy: "caller",
          evidence: describeInstallAttempt(getLazyInstallAttempt("rust-clippy", ctx.cwd)),
          elapsedMs: 0,
          latched: false
        });
        return { status: "skipped", diagnostics: [], semantic: "none" };
      }
    }
    const cargoResolution = resolveRunnerCwdWithReason(ctx, "rust-clippy");
    const cargoDir = cargoResolution.cwd;
    if (cargoResolution.marker !== "Cargo.toml") {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const result = await safeSpawnAsync(cargoExe, ["clippy", "--message-format=json", "-q"], {
      timeout: 6e4,
      cwd: cargoDir
    });
    const raw = stripAnsi(result.stdout + result.stderr);
    if (result.status === 0 && !raw.trim()) {
      return { status: "succeeded", diagnostics: [], semantic: "none" };
    }
    const allDiagnostics = parseClippyOutput(raw, ctx.filePath, cargoDir);
    const hasRecognizedCargoOutput = raw.split("\n").some((line) => {
      try {
        const reason = JSON.parse(line).reason;
        return reason === "build-finished" || reason === "compiler-artifact" || reason === "compiler-message" || reason === "build-script-executed";
      } catch {
        return false;
      }
    });
    const absEdited = resolve30(ctx.filePath);
    const diagnostics = allDiagnostics.filter((d) => pathsEqual(resolve30(cargoDir, d.filePath), absEdited));
    const hasBlocking = diagnostics.some((d) => d.semantic === "blocking");
    const semantic = hasBlocking ? "blocking" : diagnostics.length > 0 ? "warning" : "none";
    if (result.error || result.failure) {
      return {
        status: "failed",
        diagnostics,
        semantic,
        failureKind: result.failure === "timeout" || result.spawnFailure?.kind === "timeout" ? "timeout" : "server_error",
        rawOutput: raw.substring(0, 500)
      };
    }
    if (allDiagnostics.length === 0 && !(result.status === 0 && hasRecognizedCargoOutput)) {
      return {
        status: "failed",
        diagnostics: [],
        semantic: "warning",
        rawOutput: raw.substring(0, 500)
      };
    }
    return {
      status: "succeeded",
      diagnostics,
      semantic
    };
  }
};
function normalizeClippyLevel(raw) {
  if (raw === "error")
    return "error";
  if (typeof raw === "string" && raw.startsWith("error: internal compiler error")) {
    return "error";
  }
  if (raw === "note")
    return "hint";
  if (raw === "help")
    return "info";
  return "warning";
}
function findMachineApplicableSpan(spans) {
  return spans.find((s) => typeof s.suggested_replacement === "string" && s.suggestion_applicability === "MachineApplicable");
}
function parseClippyOutput(raw, fallbackPath, cargoDir) {
  const diagnostics = [];
  const lines = raw.split("\n").filter((l) => l.trim());
  for (const line of lines) {
    try {
      const msg = JSON.parse(line);
      if (msg.reason !== "compiler-message")
        continue;
      const message = msg.message;
      if (!message)
        continue;
      const spans = message.spans ?? [];
      const span = spans[0];
      if (!span)
        continue;
      const fixableSpan = findMachineApplicableSpan(spans);
      const rawFile = span.file || span.file_name;
      const filePath = rawFile ? cargoDir && !isAbsolute6(rawFile) ? resolve30(cargoDir, rawFile) : rawFile : fallbackPath;
      const normalizedSeverity = normalizeClippyLevel(message.level);
      diagnostics.push({
        id: `clippy-${message.code?.code || "unknown"}`,
        message: message.message || "Clippy warning",
        filePath,
        line: span.line_start || 0,
        column: span.column_start || 0,
        severity: normalizedSeverity,
        semantic: normalizedSeverity === "error" ? "blocking" : "warning",
        tool: "rust-clippy",
        rule: message.code?.code,
        defectClass: "correctness",
        fixable: fixableSpan !== void 0,
        fixSuggestion: fixableSpan?.suggested_replacement
      });
    } catch {
    }
  }
  return diagnostics;
}
var rust_clippy_default = rustClippyRunner;

// dist/clients/dispatch/runners/spotbugs.js
import * as fs14 from "node:fs";
import * as os3 from "node:os";
import * as path35 from "node:path";
var java = createAvailabilityChecker("java", ".exe", ["-version"]);
var spotbugs = createAvailabilityChecker("spotbugs", ".bat", ["-version"]);
var MAX_DIAGNOSTICS = 50;
var MAX_XML_BYTES = 4 * 1024 * 1024;
var scanCache = new BoundedLruCache(32);
function classesSignature(classesDir) {
  let count = 0;
  let newest = 0;
  const stack = [classesDir];
  while (stack.length > 0) {
    const dir = stack.pop();
    if (!dir)
      break;
    let entries;
    try {
      entries = fs14.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = path35.join(dir, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile() && entry.name.endsWith(".class")) {
        count++;
        try {
          const m = fs14.statSync(full).mtimeMs;
          if (m > newest)
            newest = m;
        } catch {
        }
      }
    }
  }
  return `${count}:${newest}`;
}
function mapCategory(category) {
  switch (category.toUpperCase()) {
    case "CORRECTNESS":
    case "MT_CORRECTNESS":
      return "correctness";
    case "SECURITY":
      return "safety";
    case "PERFORMANCE":
    case "BAD_PRACTICE":
    case "STYLE":
    case "I18N":
    case "EXPERIMENTAL":
      return "style";
    default:
      return "correctness";
  }
}
function mapSeverity(priority) {
  switch (priority) {
    case "1":
      return "error";
    case "3":
      return "info";
    default:
      return "warning";
  }
}
function attr(attrs, name) {
  const m = new RegExp(`\\b${name}="([^"]*)"`).exec(attrs);
  return m ? m[1] : void 0;
}
function firstSentence(text) {
  const trimmed = text.replace(/\s+/g, " ").trim();
  const dot = trimmed.indexOf(". ");
  return (dot > 0 ? trimmed.slice(0, dot + 1) : trimmed).slice(0, 300);
}
function parseSpotbugsXml(raw) {
  const xml = raw.length > MAX_XML_BYTES ? raw.slice(0, MAX_XML_BYTES) : raw;
  const diagnostics = [];
  const blockRe = /<BugInstance\b([^>]*)>([\s\S]*?)<\/BugInstance>/g;
  let block;
  let index = 0;
  while ((block = blockRe.exec(xml)) !== null) {
    if (diagnostics.length >= MAX_DIAGNOSTICS)
      break;
    const headAttrs = block[1];
    const body = block[2];
    const type = attr(headAttrs, "type") || "SPOTBUGS";
    const priority = attr(headAttrs, "priority") || "2";
    const category = attr(headAttrs, "category") || "CORRECTNESS";
    let filePath;
    let line = 1;
    const slRe = /<SourceLine\b([^>]*?)\/?>/g;
    let sl;
    while ((sl = slRe.exec(body)) !== null) {
      const slAttrs = sl[1];
      const start = attr(slAttrs, "start");
      const sourcepath = attr(slAttrs, "sourcepath");
      const sourcefile = attr(slAttrs, "sourcefile");
      if (!start || !(sourcepath || sourcefile))
        continue;
      filePath = sourcepath || sourcefile;
      line = Number(start) || 1;
      if (attr(slAttrs, "primary") === "true")
        break;
    }
    if (!filePath)
      continue;
    const longMsgMatch = /<LongMessage>([\s\S]*?)<\/LongMessage>/.exec(body);
    const shortMsgMatch = /<ShortMessage>([\s\S]*?)<\/ShortMessage>/.exec(body);
    const longMsg = longMsgMatch ? decodeXmlEntities(longMsgMatch[1].trim()) : "";
    const shortMsg = shortMsgMatch ? decodeXmlEntities(shortMsgMatch[1].trim()) : "";
    const message = shortMsg || longMsg || type;
    const fixSuggestion = longMsg ? firstSentence(longMsg) : void 0;
    diagnostics.push({
      id: `spotbugs:${type}:${path35.basename(filePath)}:${line}:${index}`,
      message: `[${type}] ${message}`,
      filePath,
      line,
      column: 1,
      severity: mapSeverity(priority),
      // Bug patterns are advisory by default (not always exploitable); a user
      // can promote to blocking via config. So semantic stays "warning".
      semantic: "warning",
      tool: "spotbugs",
      rule: type,
      defectClass: mapCategory(category),
      fixable: false,
      autoFixAvailable: false,
      fixKind: fixSuggestion ? "suggestion" : void 0,
      fixSuggestion
    });
    index++;
  }
  return diagnostics;
}
function decodeXmlEntities(s) {
  return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
}
var spotbugsRunner = {
  id: "spotbugs",
  appliesTo: ["java", "kotlin"],
  priority: PRIORITY.DEEP_LANGUAGE_ANALYSIS,
  async run(ctx) {
    const cwd = resolveRunnerCwd(ctx, "spotbugs");
    const classesDir = findCompiledClassesDir(cwd);
    if (!classesDir) {
      ctx.log?.("spotbugs: Java project detected but no compiled .class files found \u2014 run `mvn compile` / `gradle build` first");
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    if (!await java.isAvailableAsync(cwd)) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const signature = classesSignature(classesDir);
    const cached = scanCache.get(classesDir);
    if (cached && cached.signature === signature) {
      return {
        status: "succeeded",
        diagnostics: cached.diagnostics,
        semantic: cached.diagnostics.length > 0 ? "warning" : "none"
      };
    }
    const cmd = await resolveAvailableOrInstall(spotbugs, "spotbugs", cwd);
    if (!cmd)
      return { status: "skipped", diagnostics: [], semantic: "none" };
    const tmpXml = path35.join(os3.tmpdir(), `pi-lens-spotbugs-${process.pid}-${Date.now()}.xml`);
    const result = await safeSpawnAsync(cmd, [
      "-textui",
      "-xml:withMessages",
      "-low",
      "-longBugCodes",
      "-output",
      tmpXml,
      classesDir
    ], { cwd, timeout: 12e4 });
    let xml = "";
    try {
      xml = fs14.readFileSync(tmpXml, "utf8");
    } catch {
      if (result.error || (result.status ?? 0) > 1) {
        return {
          status: "failed",
          diagnostics: [],
          semantic: "none",
          rawOutput: (result.stderr || "").slice(0, 500)
        };
      }
      return { status: "succeeded", diagnostics: [], semantic: "none" };
    } finally {
      try {
        fs14.rmSync(tmpXml, { force: true });
      } catch {
      }
    }
    const diagnostics = parseSpotbugsXml(xml);
    scanCache.set(classesDir, { signature, diagnostics });
    return {
      status: "succeeded",
      diagnostics,
      semantic: diagnostics.length > 0 ? "warning" : "none"
    };
  }
};
var spotbugs_default = spotbugsRunner;

// dist/clients/dispatch/runners/shellcheck.js
import * as fs15 from "node:fs";
import * as path36 from "node:path";
var shellcheck = createAvailabilityChecker("shellcheck", ".exe");
var SHELLCHECK_DIALECTS = [
  "sh",
  "bash",
  "dash",
  "ksh",
  "busybox"
];
var SHEBANG_REGEXP = /^#!(.+)/;
var SHEBANG_INTERPRETER_REGEXP = /^[/](?:[^ /]+[/])*(?:env +(?:-S +)?)?([^ /]+)/;
var SHELLCHECK_SHELL_OR_EMPTY_REGEXP = /^\s*(?:#\s*shellcheck\s+(?:\S+\s+)*shell=(\w+)|#|$)/;
var DIALECT_SNIFF_BYTES = 4096;
function parseShebang(content) {
  const match = SHEBANG_REGEXP.exec(content);
  if (!match || !match[1])
    return null;
  const interpreter = SHEBANG_INTERPRETER_REGEXP.exec(match[1].trim());
  if (!interpreter || !interpreter[1])
    return null;
  return interpreter[1].trim();
}
function parseShellDirective(content) {
  for (const line of content.split("\n")) {
    const match = SHELLCHECK_SHELL_OR_EMPTY_REGEXP.exec(line);
    if (match === null)
      break;
    if (match[1])
      return match[1].trim();
  }
  return null;
}
function resolveShellFileDialect(filePath) {
  let content;
  try {
    content = fs15.readFileSync(filePath)?.subarray(0, DIALECT_SNIFF_BYTES).toString("utf8");
  } catch {
    return { shebang: null, directive: null, dialect: "bash" };
  }
  const directive = parseShellDirective(content);
  const shebang = parseShebang(content);
  const parsed = directive ?? shebang ?? (path36.extname(filePath).toLowerCase() === ".zsh" ? "zsh" : null);
  return {
    shebang,
    directive,
    dialect: parsed ?? "bash"
  };
}
function findShellcheckConfig(cwd) {
  const local = path36.join(cwd, ".shellcheckrc");
  if (fs15.existsSync(local))
    return local;
  let current = path36.resolve(cwd);
  while (true) {
    const candidate = path36.join(current, ".shellcheckrc");
    if (fs15.existsSync(candidate))
      return candidate;
    const parent = path36.dirname(current);
    if (parent === current)
      break;
    current = parent;
  }
  return void 0;
}
function parseShellcheckOutput(raw, filePath, cwd) {
  const diagnostics = [];
  const absTarget = path36.resolve(cwd, filePath);
  if (!raw.trim()) {
    return diagnostics;
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return diagnostics;
    }
    for (const item of parsed) {
      if (!item.message || !item.line)
        continue;
      if (!item.file || !pathsEqual(path36.resolve(cwd, item.file), absTarget))
        continue;
      const severityMap = {
        error: "error",
        warning: "warning",
        info: "info",
        style: "info"
      };
      const severity = severityMap[item.level || "warning"] || "warning";
      const ruleCode = item.code ? `SC${item.code}` : "unknown";
      diagnostics.push({
        id: `shellcheck-${item.line}-${ruleCode}`,
        message: `[${ruleCode}] ${item.message}`,
        filePath,
        line: item.line,
        column: item.column || 1,
        severity,
        semantic: severity === "error" ? "blocking" : "warning",
        tool: "shellcheck",
        rule: ruleCode,
        fixable: !!item.fix,
        autoFixAvailable: false,
        fixKind: item.fix ? "suggestion" : void 0
      });
    }
  } catch {
    return diagnostics;
  }
  return diagnostics;
}
var shellcheckRunner = {
  id: "shellcheck",
  appliesTo: ["shell"],
  priority: PRIORITY.GENERAL_ANALYSIS,
  skipTestFiles: false,
  // Shell scripts in test directories should still be checked
  async run(ctx) {
    const cwd = resolveRunnerCwd(ctx, "shellcheck");
    const cover = lspPrimaryCoversFile(ctx, "shellcheck");
    if (cover && await coveringLaneAvailable(ctx, cover) && await ctx.hasTool("shellcheck")) {
      return {
        status: "skipped",
        diagnostics: [],
        semantic: "none",
        skipReason: "covered-by-primary",
        // WHO claimed (#3968 F2): declared (the row's own covers, gated
        // on the custom row's own command) or builtin-fact.
        claimSource: cover.claimSource
      };
    }
    const dialectInfo = resolveShellFileDialect(ctx.filePath);
    if (!SHELLCHECK_DIALECTS.includes(dialectInfo.dialect)) {
      return {
        status: "skipped",
        diagnostics: [],
        semantic: "none",
        skipReason: "dialect-unsupported"
      };
    }
    let cmd = null;
    if (await shellcheck.isAvailableAsync(cwd)) {
      cmd = shellcheck.getCommand(cwd);
    } else {
      const managed = await resolveAvailableOrInstall(shellcheck, "shellcheck", cwd);
      if (managed)
        cmd = managed;
    }
    if (!cmd)
      return { status: "skipped", diagnostics: [], semantic: "none" };
    const args = ["--format", "json"];
    if (!dialectInfo.shebang && !dialectInfo.directive) {
      args.push("--shell", dialectInfo.dialect);
    }
    const configPath = findShellcheckConfig(ctx.cwd);
    if (!configPath) {
      args.push("--severity", "info");
    }
    args.push(ctx.filePath);
    const result = await safeSpawnAsync(cmd, args, { cwd, timeout: 15e3 });
    if (result.status === 0 && !result.stdout?.trim()) {
      return { status: "succeeded", diagnostics: [], semantic: "none" };
    }
    const raw = result.stdout + result.stderr;
    const diagnostics = parseShellcheckOutput(raw, ctx.filePath, cwd);
    return finishParsedRun({
      tool: "shellcheck",
      ctx,
      result,
      diagnostics
    });
  }
};
var shellcheck_default = shellcheckRunner;

// dist/clients/dispatch/runners/fish-indent.js
var fishIndent = createAvailabilityChecker("fish_indent");
var fishIndentRunner = {
  id: "fish-indent",
  appliesTo: ["fish"],
  priority: PRIORITY.FORMAT_AND_LINT_PRIMARY,
  skipTestFiles: false,
  async run(ctx) {
    const cwd = resolveRunnerCwd(ctx, "fish-indent");
    const cmd = ctx.analysisRootMode === "adopted" ? resolveAdoptedRootCommand("fish_indent", ctx, cwd) : await fishIndent.isAvailableAsync(cwd) ? fishIndent.getCommand(cwd) : null;
    if (!cmd)
      return { status: "skipped", diagnostics: [], semantic: "none" };
    const result = await safeSpawnAsync(cmd, ["--check", ctx.filePath], {
      timeout: 1e4,
      cwd
    });
    if (result.status === 0) {
      return { status: "succeeded", diagnostics: [], semantic: "none" };
    }
    const stderrLine = (result.stderr ?? "").split("\n").find((l) => l.trim());
    if (stderrLine) {
      const lineMatch = stderrLine.match(/\(line\s+(\d+)\)/);
      const line = lineMatch ? Number(lineMatch[1]) : 1;
      const diagnostics2 = [
        {
          id: `fish-indent-parse-${ctx.filePath}`,
          message: `fish_indent: ${stderrLine.trim()}`,
          filePath: ctx.filePath,
          line,
          column: 1,
          severity: "error",
          semantic: "blocking",
          tool: "fish-indent",
          rule: "fish-indent-parse-error"
        }
      ];
      return findingsResult(diagnostics2, {
        status: "failed",
        semantic: "blocking"
      });
    }
    const diagnostics = [
      {
        id: `fish-indent-format-${ctx.filePath}`,
        message: "Fish script is not formatted \u2014 run `fish_indent -w` to fix",
        filePath: ctx.filePath,
        line: 1,
        column: 1,
        severity: "warning",
        semantic: "warning",
        tool: "fish-indent",
        rule: "fish-indent-unformatted",
        fixable: true,
        autoFixAvailable: false,
        fixKind: "manual"
      }
    ];
    return { status: "succeeded", diagnostics, semantic: "warning" };
  }
};
var fish_indent_default = fishIndentRunner;

// dist/clients/dispatch/runners/shfmt.js
var shfmt = createAvailabilityChecker("shfmt", ".exe");
function hasEditorConfig(cwd) {
  return findNearestContaining(cwd, [".editorconfig"]) !== void 0;
}
var shfmtRunner = {
  id: "shfmt",
  appliesTo: ["shell"],
  priority: PRIORITY.FORMAT_AND_LINT_PRIMARY,
  skipTestFiles: false,
  async run(ctx) {
    const cwd = resolveRunnerCwd(ctx, "shfmt");
    let cmd = null;
    if (await shfmt.isAvailableAsync(cwd)) {
      cmd = shfmt.getCommand(cwd);
    } else {
      const installed = await resolveAvailableOrInstall(shfmt, "shfmt", cwd);
      if (!installed) {
        return { status: "skipped", diagnostics: [], semantic: "none" };
      }
      cmd = installed;
    }
    if (!cmd)
      return { status: "skipped", diagnostics: [], semantic: "none" };
    const result = await safeSpawnAsync(cmd, ["--diff", ctx.filePath], {
      timeout: 1e4,
      cwd
    });
    if (result.status === 0) {
      return { status: "succeeded", diagnostics: [], semantic: "none" };
    }
    if ((result.status ?? 2) > 1) {
      const errMsg = (result.stderr ?? "").split("\n")[0].trim();
      const diagnostics2 = [
        {
          id: `shfmt-parse-${ctx.filePath}`,
          message: errMsg ? `shfmt parse error: ${errMsg}` : "shfmt: failed to parse shell script",
          filePath: ctx.filePath,
          line: 1,
          column: 1,
          severity: "error",
          semantic: "blocking",
          tool: "shfmt",
          rule: "shfmt-parse-error"
        }
      ];
      return findingsResult(diagnostics2, {
        status: "failed",
        semantic: "blocking"
      });
    }
    if (!hasEditorConfig(cwd)) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const diffOutput = result.stdout ?? result.stderr ?? "";
    let line = 1;
    const lineMatch = diffOutput.match(/^@@\s+-(\d+)/m);
    if (lineMatch)
      line = Number(lineMatch[1]);
    const diagnostics = [
      {
        id: `shfmt-format-${ctx.filePath}`,
        message: "Shell script is not formatted \u2014 run `shfmt -w` to fix",
        filePath: ctx.filePath,
        line,
        column: 1,
        severity: "warning",
        semantic: "warning",
        tool: "shfmt",
        rule: "shfmt-unformatted",
        fixable: true,
        autoFixAvailable: false,
        fixKind: "manual"
      }
    ];
    return { status: "succeeded", diagnostics, semantic: "warning" };
  }
};
var shfmt_default = shfmtRunner;

// dist/clients/dispatch/runners/spellcheck.js
import * as path37 from "node:path";
var typos = createAvailabilityChecker("typos", ".exe");
var TYPOS_EXIT_CODES = { ran: [2] };
function parseTyposOutput(raw, filePath, cwd) {
  const diagnostics = [];
  const absTarget = path37.resolve(cwd, filePath);
  if (!raw.trim()) {
    return diagnostics;
  }
  const lines = raw.trim().split("\n").filter((l) => l.trim());
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (!parsed.typo || !parsed.line_num)
        continue;
      if (parsed.path && !pathsEqual(path37.resolve(cwd, parsed.path), absTarget))
        continue;
      const corrections = parsed.corrections?.join(", ") || "no suggestions";
      const message = `Typo: "${parsed.typo}" \u2192 ${corrections}`;
      diagnostics.push({
        id: `typos-${parsed.line_num}-${parsed.typo}`,
        message,
        filePath,
        line: parsed.line_num,
        column: 1,
        // typos-cli doesn't provide column, just byte offset
        severity: "warning",
        semantic: "warning",
        tool: "typos",
        rule: "typo",
        fixable: !!parsed.corrections?.length,
        autoFixAvailable: false,
        fixKind: parsed.corrections?.length ? "suggestion" : void 0,
        fixSuggestion: parsed.corrections?.[0]
      });
    } catch (err) {
      void err;
    }
  }
  return diagnostics;
}
var spellcheckRunner = {
  id: "spellcheck",
  appliesTo: ["markdown"],
  priority: PRIORITY.DOC_QUALITY,
  skipTestFiles: false,
  // Check docs in test files too
  async run(ctx) {
    const cwd = resolveRunnerCwd2(ctx, "spellcheck/typos");
    if (!await typos.isAvailableAsync(cwd)) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const args = ["--format", "json", ctx.filePath];
    const result = await safeSpawnAsync(typos.getCommand(cwd), args, {
      cwd,
      timeout: 15e3
    });
    const run = parseToolRun("spellcheck", { result, exitCodes: TYPOS_EXIT_CODES }, (out) => parseTyposOutput(out, ctx.filePath, cwd), { parseOutput: `${result.stdout ?? ""}${result.stderr ?? ""}` });
    if (run.skipped)
      return run.skipped;
    const diagnostics = run.diagnostics;
    if (diagnostics.length === 0) {
      return { status: "succeeded", diagnostics: [], semantic: "none" };
    }
    return findingsResult(diagnostics, {
      status: "failed",
      semantic: "warning"
    });
  }
};
var spellcheck_default = spellcheckRunner;

// dist/clients/dispatch/runners/sqlfluff.js
import * as path38 from "node:path";
var sqlfluff = createAvailabilityChecker("sqlfluff", ".exe");
var SQLFLUFF_EXIT_CODES = { ran: [1] };
var SQLFLUFF_FIXABLE_RULES = /* @__PURE__ */ new Set([
  // Layout — pure formatting
  "LT01",
  "LT02",
  "LT03",
  "LT04",
  "LT05",
  "LT06",
  "LT07",
  "LT08",
  "LT09",
  "LT10",
  "LT11",
  "LT12",
  "LT13",
  // Capitalisation — pure formatting
  "CP01",
  "CP02",
  "CP03",
  "CP04",
  "CP05",
  // Aliasing — safe formatting / unused-alias removal
  "AL01",
  "AL05",
  "AL06",
  "AL07",
  "AL08",
  "AL09",
  // Convention — safe formatting / equivalent rewrites
  "CV01",
  "CV02",
  "CV06",
  "CV07",
  "CV10",
  "CV11",
  // References — quoting / qualifier formatting
  "RF02",
  "RF04",
  "RF05",
  "RF06",
  // Structure — only deterministic-safe simplifications
  "ST01",
  "ST02"
]);
function parseSqlfluffOutput(raw, filePath, cwd) {
  if (!raw.trim())
    return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed))
      return [];
    const diagnostics = [];
    const absTarget = path38.resolve(cwd, filePath);
    for (const item of parsed) {
      if (item.filepath && !pathsEqual(path38.resolve(cwd, item.filepath), absTarget))
        continue;
      for (const v of item.violations ?? []) {
        if (!v.description)
          continue;
        const code = v.code ?? "SQL";
        const fixable = SQLFLUFF_FIXABLE_RULES.has(code);
        diagnostics.push({
          id: `sqlfluff-${v.line_no ?? 1}-${v.line_pos ?? 1}-${code}`,
          message: `[${code}] ${v.description}`,
          filePath,
          line: v.line_no ?? 1,
          column: v.line_pos ?? 1,
          severity: "warning",
          semantic: "warning",
          tool: "sqlfluff",
          rule: code,
          fixable,
          fixSuggestion: fixable ? "Run `sqlfluff fix` to apply the deterministic auto-correction for this rule." : void 0
        });
      }
    }
    return diagnostics;
  } catch {
    return [];
  }
}
var sqlfluffRunner = {
  id: "sqlfluff",
  appliesTo: ["sql"],
  priority: PRIORITY.SQL_LINT,
  skipTestFiles: false,
  async run(ctx) {
    const cwd = resolveRunnerCwd(ctx, "sqlfluff");
    const policy = getLinterPolicyForCwd(ctx.filePath, cwd);
    if (policy && !policy.preferredRunners.includes("sqlfluff")) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const hasConfig = hasSqlfluffConfig(cwd);
    if (!hasConfig) {
      logRunnerAdvisoryOnce(ctx, "sqlfluff", cwd, "sqlfluff: no config detected, using ANSI dialect defaults");
    }
    let cmd = null;
    if (await sqlfluff.isAvailableAsync(cwd)) {
      cmd = sqlfluff.getCommand(cwd);
    } else {
      cmd = await resolveToolCommandWithInstallFallback(cwd, "sqlfluff");
    }
    if (!cmd)
      return { status: "skipped", diagnostics: [], semantic: "none" };
    const args = ["lint", "--format", "json"];
    if (!hasConfig) {
      args.push("--dialect", "ansi");
    }
    args.push(ctx.filePath);
    const result = await safeSpawnAsync(cmd, args, {
      timeout: 2e4,
      cwd
    });
    const run = parseToolRun("sqlfluff", { result, exitCodes: SQLFLUFF_EXIT_CODES }, (out) => parseSqlfluffOutput(out, ctx.filePath, cwd), { parseOutput: result.stdout ?? "" });
    if (run.skipped)
      return run.skipped;
    const diagnostics = run.diagnostics;
    return finishParsedRun({
      tool: "sqlfluff",
      ctx,
      result,
      diagnostics,
      classify: () => ({ status: "failed", semantic: "warning" })
    });
  }
};
var sqlfluff_default = sqlfluffRunner;

// dist/clients/dispatch/runners/stylelint.js
import * as path39 from "node:path";
var stylelint = createAvailabilityChecker("stylelint", ".cmd");
var STYLELINT_EXIT_CODES = { ran: [1, 2] };
function stylelintReport(stdout, stderr) {
  for (const stream of [stdout, stderr]) {
    if (stream?.trimStart().startsWith("["))
      return stream;
  }
  return "";
}
var STYLELINT_FIXABLE_RULES = /* @__PURE__ */ new Set([
  // whitespace / spacing — formatter-style, always safe
  "block-no-empty",
  "color-hex-length",
  "declaration-block-no-duplicate-properties",
  "declaration-block-no-redundant-longhand-properties",
  "declaration-block-no-shorthand-property-overrides",
  "declaration-block-single-line-max-declarations",
  "font-family-name-quotes",
  "function-url-quotes",
  "length-zero-no-unit",
  "media-feature-name-no-vendor-prefix",
  "no-descending-specificity",
  "no-duplicate-at-import-rules",
  "no-duplicate-selectors",
  "no-empty-source",
  "no-eol-whitespace",
  "no-extra-semicolons",
  "no-invalid-double-slash-comments",
  "no-missing-end-of-source-newline",
  "number-leading-zero",
  "number-no-trailing-zeros",
  "property-no-vendor-prefix",
  "selector-attribute-quotes",
  "selector-no-vendor-prefix",
  "selector-pseudo-element-colon-notation",
  "selector-type-case",
  "shorthand-property-no-redundant-values",
  "string-quotes",
  "value-no-vendor-prefix"
]);
function parseStylelintJson(raw, filePath, cwd) {
  try {
    const results = JSON.parse(raw);
    const diagnostics = [];
    const absTarget = path39.resolve(cwd, filePath);
    for (const result of results) {
      if (result.source && !pathsEqual(path39.resolve(cwd, result.source), absTarget))
        continue;
      for (const w of result.warnings) {
        const severity = w.severity === "error" ? "error" : "warning";
        const fixable = STYLELINT_FIXABLE_RULES.has(w.rule);
        diagnostics.push({
          id: `stylelint-${w.line}-${w.rule}`,
          message: `[${w.rule}] ${w.text.replace(/\s*\(stylelint.*?\)$/, "")}`,
          filePath,
          line: w.line,
          column: w.column,
          severity,
          semantic: severity === "error" ? "blocking" : "warning",
          tool: "stylelint",
          rule: w.rule,
          fixable,
          fixSuggestion: fixable ? "Run `stylelint --fix` to apply the deterministic auto-correction for this rule." : void 0
        });
      }
    }
    return diagnostics;
  } catch {
    return [];
  }
}
var stylelintRunner = {
  id: "stylelint",
  appliesTo: ["css"],
  priority: PRIORITY.FORMAT_AND_LINT_PRIMARY,
  skipTestFiles: false,
  async run(ctx) {
    const cwd = resolveRunnerCwd(ctx, "stylelint");
    const policy = getLinterPolicyForCwd(ctx.filePath, cwd);
    if (policy && !policy.preferredRunners.includes("stylelint")) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const fileDir = path39.dirname(path39.resolve(cwd, ctx.filePath));
    const hasConfig = hasStylelintConfig(fileDir) || hasStylelintConfig(cwd);
    if (!hasConfig) {
      logRunnerAdvisoryOnce(ctx, "stylelint", cwd, "stylelint: no config detected, running with default rules");
    }
    let cmd = null;
    if (await stylelint.isAvailableAsync(cwd)) {
      cmd = stylelint.getCommand(cwd);
    } else {
      cmd = await resolveToolCommandWithInstallFallback(cwd, "stylelint");
    }
    if (!cmd)
      return { status: "skipped", diagnostics: [], semantic: "none" };
    const result = await safeSpawnAsync(cmd, ["--formatter", "json", ctx.filePath], { timeout: 2e4, cwd });
    const raw = stylelintReport(result.stdout, result.stderr);
    const run = parseToolRun("stylelint", { result, output: raw, exitCodes: STYLELINT_EXIT_CODES }, (out) => parseStylelintJson(out, ctx.filePath, cwd));
    if (run.skipped)
      return run.skipped;
    const diagnostics = run.diagnostics;
    return finishParsedRun({
      tool: "stylelint",
      ctx,
      result,
      diagnostics
    });
  }
};
var stylelint_default = stylelintRunner;

// dist/clients/dispatch/runners/swiftlint.js
import * as path40 from "node:path";
var swiftlint = createAvailabilityChecker("swiftlint", ".exe");
var SWIFTLINT_FIXABLE_RULES = /* @__PURE__ */ new Set([
  "closing_brace",
  "colon",
  "comma",
  "comma_inheritance",
  "control_statement",
  "duplicate_imports",
  "empty_collection_literal",
  "empty_enum_arguments",
  "empty_parameters",
  "empty_parentheses_with_trailing_closure",
  "empty_string",
  "explicit_init",
  "file_header",
  "joined_default_parameter",
  "legacy_constant",
  "legacy_constructor",
  "legacy_hashing",
  "legacy_nsgeometry_functions",
  "mark",
  "modifier_order",
  "no_extension_access_modifier",
  "no_space_in_method_call",
  "number_separator",
  "opening_brace",
  "operator_usage_whitespace",
  "prefer_zero_over_explicit_init",
  "private_over_fileprivate",
  "protocol_property_accessors_order",
  "redundant_discardable_let",
  "redundant_nil_coalescing",
  "redundant_objc_attribute",
  "redundant_optional_initialization",
  "redundant_string_enum_value",
  "redundant_type_annotation",
  "redundant_void_return",
  "return_arrow_whitespace",
  "self_in_property_initialization",
  "shorthand_operator",
  "sorted_imports",
  "statement_position",
  "trailing_comma",
  "trailing_newline",
  "trailing_semicolon",
  "trailing_whitespace",
  "unneeded_break_in_switch",
  "unneeded_parentheses_in_closure_argument",
  "unused_capture_list",
  "vertical_parameter_alignment",
  "vertical_whitespace",
  "vertical_whitespace_between_cases",
  "vertical_whitespace_closing_braces",
  "vertical_whitespace_opening_braces",
  "void_function_in_ternary",
  "void_return",
  "yoda_condition"
]);
function parseSwiftLintOutput(raw, filePath, cwd) {
  const diagnostics = [];
  if (!raw.trim())
    return diagnostics;
  const absTarget = path40.resolve(cwd, filePath);
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed))
      return diagnostics;
    for (const item of parsed) {
      if (!item.reason)
        continue;
      if (item.file && !pathsEqual(path40.resolve(cwd, item.file), absTarget))
        continue;
      const severityMap = {
        error: "error",
        warning: "warning",
        info: "info"
      };
      const severity = severityMap[item.severity?.toLowerCase() ?? ""] ?? "warning";
      const ruleId = item.rule_id ?? "swiftlint";
      const fixable = SWIFTLINT_FIXABLE_RULES.has(ruleId);
      diagnostics.push({
        id: `swiftlint-${item.line}-${ruleId}`,
        message: `[${ruleId}] ${item.reason}`,
        filePath,
        line: item.line ?? 1,
        column: item.character ?? 1,
        severity,
        semantic: severity === "error" ? "blocking" : "warning",
        tool: "swiftlint",
        rule: ruleId,
        defectClass: "style",
        fixable,
        fixSuggestion: fixable ? "Run `swiftlint --fix` to apply the deterministic auto-correction for this rule." : void 0
      });
    }
  } catch {
    return diagnostics;
  }
  return diagnostics;
}
var swiftlintRunner = {
  id: "swiftlint",
  appliesTo: ["swift"],
  priority: PRIORITY.GENERAL_ANALYSIS,
  skipTestFiles: false,
  async run(ctx) {
    const cwd = resolveRunnerCwd(ctx, "swiftlint");
    let cmd = null;
    if (await swiftlint.isAvailableAsync(cwd)) {
      cmd = swiftlint.getCommand(cwd);
    } else {
      cmd = await resolveToolCommandWithInstallFallback(cwd, "swiftlint");
    }
    if (!cmd)
      return { status: "skipped", diagnostics: [], semantic: "none" };
    const result = await safeSpawnAsync(cmd, ["--reporter", "json", path40.resolve(cwd, ctx.filePath)], { cwd, timeout: 15e3 });
    const run = parseToolRun("swiftlint", {
      result,
      // EXIT TABLE (SwiftLint 0.56 measured fixture): 0 clean; 1 findings; 2 error; other nonzero rejected.
      exitCodes: { ran: [1, 2] }
    }, (out) => parseSwiftLintOutput(out, ctx.filePath, cwd));
    if (run.skipped)
      return run.skipped;
    const diagnostics = run.diagnostics;
    if (diagnostics.length === 0) {
      return { status: "succeeded", diagnostics: [], semantic: "none" };
    }
    const hasBlocking = diagnostics.some((d) => d.semantic === "blocking");
    return findingsResult(diagnostics, {
      status: hasBlocking ? "failed" : "succeeded",
      semantic: hasBlocking ? "blocking" : "warning"
    });
  }
};
var swiftlint_default = swiftlintRunner;

// dist/clients/dispatch/runners/taplo.js
import * as path41 from "node:path";
var taplo = createAvailabilityChecker("taplo", ".exe");
var TAPLO_EXIT_CODES = { ran: [1] };
var HEADER_PATTERN = /^\s*(error|warning):(.*)$/;
var LOCATION_LEAD = "\u250C\u2500";
var LOCATION_PATTERN = /^\s*┌─\s+(.+?):(\d+):(\d+)$/;
function parseTaploOutput(raw, filePath, cwd) {
  const diagnostics = [];
  const absTarget = path41.resolve(cwd, filePath);
  const lines = stripAnsi(raw ?? "").split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const header = HEADER_PATTERN.exec(lines[i].trimEnd());
    if (!header)
      continue;
    const severityWord = header[1];
    const summary = header[2].trim();
    if (!summary)
      continue;
    let line = null;
    let column = 1;
    for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
      if (!lines[j].includes(LOCATION_LEAD))
        continue;
      const location = LOCATION_PATTERN.exec(lines[j].trimEnd());
      if (!location)
        continue;
      if (!pathsEqual(path41.resolve(cwd, location[1].trim()), absTarget))
        continue;
      line = Number.parseInt(location[2], 10) || 1;
      column = Number.parseInt(location[3], 10) || 1;
      break;
    }
    if (line === null)
      continue;
    const severity = severityWord === "warning" ? "warning" : "error";
    diagnostics.push({
      id: `taplo-${severity}-${line}-${column}`,
      message: summary,
      filePath,
      line,
      column,
      severity,
      semantic: severity === "error" ? "blocking" : "warning",
      tool: "taplo",
      rule: `taplo/${severity}`,
      fixable: false
    });
  }
  return diagnostics;
}
var taploRunner = {
  id: "taplo",
  appliesTo: ["toml"],
  priority: PRIORITY.FORMAT_AND_LINT_PRIMARY,
  skipTestFiles: false,
  async run(ctx) {
    const cwd = resolveRunnerCwd(ctx, "taplo");
    const policy = getLinterPolicyForCwd(ctx.filePath, cwd);
    if (policy && !policy.preferredRunners.includes("taplo")) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const cover = lspPrimaryCoversFile(ctx, "taplo");
    if (cover && await coveringLaneAvailable(ctx, cover)) {
      return {
        status: "skipped",
        diagnostics: [],
        semantic: "none",
        // The closed skip taxonomy — the shellcheck lane named its skip
        // since #3968; this lane's identical skip was bare, reading as
        // an unexplained empty output on the delivery surfaces
        // (defect shape 10). F2 adds the claim's provenance beside it.
        skipReason: "covered-by-primary",
        claimSource: cover.claimSource
      };
    }
    let cmd = localBinPath(findLocalBinUpwards("taplo", cwd)) ?? null;
    if (!cmd) {
      if (await taplo.isAvailableAsync(cwd)) {
        cmd = taplo.getCommand(cwd);
      } else {
        cmd = await resolveToolCommandWithInstallFallback(cwd, "taplo");
      }
    }
    if (!cmd)
      return { status: "skipped", diagnostics: [], semantic: "none" };
    const absPath = path41.resolve(cwd, ctx.filePath);
    const result = await safeSpawnAsync(cmd, ["check", "--colors", "never", absPath], { cwd, timeout: 15e3 });
    const raw = result.stderr?.trim() ? result.stderr : result.stdout ?? "";
    const run = parseToolRun("taplo", { result, output: raw, exitCodes: TAPLO_EXIT_CODES }, (out) => parseTaploOutput(out, ctx.filePath, cwd), { skipWhenParsedNothing: true });
    if (run.skipped)
      return run.skipped;
    const diagnostics = run.diagnostics;
    if (diagnostics.length === 0) {
      return { status: "succeeded", diagnostics: [], semantic: "none" };
    }
    return findingsResult(diagnostics, {
      status: "failed",
      semantic: "blocking"
    });
  }
};
var taplo_default = taploRunner;

// dist/clients/dispatch/runners/terragrunt.js
import * as path42 from "node:path";
var terragrunt = createAvailabilityChecker("terragrunt", ".exe");
function normalizeSeverity(raw) {
  if (typeof raw === "number")
    return raw === 1 ? "error" : "warning";
  if (typeof raw === "string" && raw.toLowerCase() === "error")
    return "error";
  return "warning";
}
function toRawDiagnostics(parsed) {
  if (Array.isArray(parsed))
    return parsed;
  if (!parsed || typeof parsed !== "object")
    return [];
  const invalidFiles = parsed.invalid_files;
  if (!Array.isArray(invalidFiles))
    return [];
  return invalidFiles.flatMap((f) => Array.isArray(f?.diagnostics) ? f.diagnostics : []);
}
function parseTerragruntOutput(raw, filePath, absPath = path42.resolve(filePath)) {
  if (!raw.trim())
    return [];
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  const unitDir = path42.dirname(absPath);
  const diagnostics = [];
  for (const d of toRawDiagnostics(parsed)) {
    if (!d || typeof d !== "object")
      continue;
    const diagFile = d.range?.filename;
    if (diagFile && !pathsEqual(path42.resolve(unitDir, diagFile), absPath))
      continue;
    const line = d.range?.start?.line ?? 1;
    const column = d.range?.start?.column ?? 1;
    const severity = normalizeSeverity(d.severity);
    const message = d.summary ?? d.detail ?? "terragrunt hcl validate error";
    const idMessage = message.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 80);
    diagnostics.push({
      id: `terragrunt-hclvalidate-${line}-${column}-${idMessage}`,
      message,
      filePath,
      line,
      column,
      severity,
      semantic: severity === "error" ? "blocking" : "warning",
      tool: "terragrunt",
      fixable: false
    });
  }
  return diagnostics;
}
var SKIPPED3 = {
  status: "skipped",
  diagnostics: [],
  semantic: "none"
};
var terragruntRunner = {
  id: "terragrunt",
  appliesTo: ["terragrunt"],
  priority: PRIORITY.GENERAL_ANALYSIS,
  skipTestFiles: false,
  async run(ctx) {
    const cwd = resolveRunnerCwd(ctx, "terragrunt");
    const policy = getLinterPolicyForCwd(ctx.filePath, cwd);
    if (policy && !policy.preferredRunners.includes("terragrunt"))
      return SKIPPED3;
    let cmd = null;
    if (await terragrunt.isAvailableAsync(cwd)) {
      cmd = terragrunt.getCommand(cwd);
    } else {
      const managed = await resolveAvailableOrInstall(terragrunt, "terragrunt", cwd);
      if (managed)
        cmd = managed;
    }
    if (!cmd)
      return SKIPPED3;
    const absPath = path42.resolve(cwd, ctx.filePath);
    const fileDir = path42.dirname(absPath);
    const result = await safeSpawnAsync(cmd, ["hcl", "validate", "--json", "--non-interactive"], { cwd: fileDir, timeout: 3e4 });
    if (spawnFailedWithNoOutput(result))
      return SKIPPED3;
    const diagnostics = parseTerragruntOutput(result.stdout || "", ctx.filePath, absPath);
    return finishParsedRun({
      tool: "terragrunt",
      ctx,
      result,
      diagnostics,
      classify: (diagnostics2) => {
        const hasErrors = diagnostics2.some((d) => d.severity === "error");
        return {
          status: hasErrors ? "failed" : "succeeded",
          semantic: hasErrors ? "blocking" : "warning"
        };
      }
    });
  }
};
var terragrunt_default = terragruntRunner;

// dist/clients/dispatch/runners/tflint.js
import * as path43 from "node:path";
var tflint = createAvailabilityChecker("tflint", ".exe");
var TFLINT_CONFIG = ".tflint.hcl";
function findTflintConfig(fileDir) {
  if (process.env.TFLINT_CONFIG_FILE)
    return null;
  const dir = findNearestDirWithAnyBasename(fileDir, [TFLINT_CONFIG]);
  return dir ? path43.join(dir, TFLINT_CONFIG) : null;
}
function parseTflintOutput(raw, filePath, toolCwd) {
  try {
    const parsed = JSON.parse(raw);
    const issues = parsed.issues ?? [];
    const absTarget = path43.resolve(toolCwd, filePath);
    return issues.flatMap((issue) => {
      if (issue.range?.filename && !pathsEqual(path43.resolve(toolCwd, issue.range.filename), absTarget))
        return [];
      const severity = issue.rule.severity === "error" ? "error" : "warning";
      return [
        {
          id: `tflint-${issue.rule.name}-${issue.range.start.line}`,
          message: `[${issue.rule.name}] ${issue.message}`,
          filePath,
          line: issue.range.start.line,
          column: issue.range.start.column,
          severity,
          semantic: severity === "error" ? "blocking" : "warning",
          tool: "tflint",
          rule: issue.rule.name,
          fixable: false
        }
      ];
    });
  } catch {
    return [];
  }
}
var tflintRunner = {
  id: "tflint",
  appliesTo: ["terraform"],
  priority: PRIORITY.GENERAL_ANALYSIS,
  skipTestFiles: false,
  async run(ctx) {
    const cwd = resolveRunnerCwd(ctx, "tflint");
    const policy = getLinterPolicyForCwd(ctx.filePath, cwd);
    if (policy && !policy.preferredRunners.includes("tflint")) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    let cmd = null;
    if (await tflint.isAvailableAsync(cwd)) {
      cmd = tflint.getCommand(cwd);
    } else {
      const managed = await resolveAvailableOrInstall(tflint, "tflint", cwd);
      if (managed)
        cmd = managed;
    }
    if (!cmd)
      return { status: "skipped", diagnostics: [], semantic: "none" };
    const absPath = path43.resolve(cwd, ctx.filePath);
    const fileDir = path43.dirname(absPath);
    const args = [
      "--format=json",
      "--no-color",
      `--filter=${path43.basename(absPath)}`
    ];
    const configPath = findTflintConfig(fileDir);
    if (configPath)
      args.push(`--config=${configPath}`);
    const result = await safeSpawnAsync(cmd, args, {
      cwd: fileDir,
      timeout: 3e4
    });
    const run = parseToolRun("tflint", {
      result,
      // EXIT TABLE (TFLint 0.52 measured fixture): 0 clean; 1 error; 2 findings; other nonzero rejected.
      exitCodes: { ran: [1, 2] }
    }, (out) => parseTflintOutput(out, absPath, fileDir));
    if (run.skipped)
      return run.skipped;
    const diagnostics = run.diagnostics;
    return finishParsedRun({
      tool: "tflint",
      ctx,
      result,
      diagnostics,
      classify: (diagnostics2) => {
        const hasErrors = diagnostics2.some((d) => d.severity === "error");
        return {
          status: hasErrors ? "failed" : "succeeded",
          semantic: hasErrors ? "blocking" : "warning"
        };
      }
    });
  }
};
var tflint_default = tflintRunner;

// dist/clients/dispatch/runners/trivy-config.js
import * as fs16 from "node:fs";
import * as path44 from "node:path";
var trivy2 = createAvailabilityChecker("trivy", ".exe");
function looksLikeKubernetesManifest(content) {
  for (const doc of content.split(/^---\s*$/m)) {
    if (/^apiVersion:\s*\S/m.test(doc) && /^kind:\s*\S/m.test(doc)) {
      return true;
    }
  }
  return false;
}
function looksLikeCloudFormationTemplate(content) {
  if (/AWSTemplateFormatVersion/.test(content))
    return true;
  if (/Transform:\s*(\[.*)?["']?AWS::Serverless/.test(content))
    return true;
  return /Type["']?\s*:\s*["']?(AWS|Custom|Alexa)::/.test(content);
}
function normalizeSeverity2(raw) {
  const s = typeof raw === "string" ? raw.toUpperCase() : "";
  if (s === "CRITICAL" || s === "HIGH" || s === "MEDIUM" || s === "LOW") {
    return s;
  }
  return "UNKNOWN";
}
function parseTrivyConfigOutput(raw, filePath, cwd = process.cwd()) {
  if (!raw.trim())
    return [];
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  const results = parsed?.Results;
  if (!Array.isArray(results))
    return [];
  const diagnostics = [];
  const absTarget = path44.resolve(cwd, filePath);
  for (const resultEntry of results) {
    if (!resultEntry || typeof resultEntry !== "object")
      continue;
    const target = resultEntry.Target;
    if (typeof target !== "string" || !pathsEqual(path44.resolve(cwd, target), absTarget))
      continue;
    const rows = resultEntry.Misconfigurations;
    if (!Array.isArray(rows))
      continue;
    for (const row of rows) {
      if (!row || typeof row !== "object")
        continue;
      const m = row;
      const id = typeof m.ID === "string" ? m.ID : void 0;
      if (!id)
        continue;
      const cause = m.CauseMetadata ?? {};
      const line = typeof cause.StartLine === "number" && cause.StartLine > 0 ? cause.StartLine : 1;
      const severity = normalizeSeverity2(m.Severity);
      const title = typeof m.Title === "string" ? m.Title : id;
      const resolution = typeof m.Resolution === "string" && m.Resolution ? ` ${m.Resolution}` : "";
      diagnostics.push({
        id: `trivy-config-${id}-${line}`,
        message: `[${id}] ${title} (${severity}).${resolution}`.trim(),
        filePath,
        line,
        column: 1,
        severity: severity === "CRITICAL" ? "error" : "warning",
        semantic: severity === "CRITICAL" ? "blocking" : "warning",
        defectClass: "safety",
        tool: "trivy-config",
        rule: id,
        fixable: false
      });
    }
  }
  return diagnostics;
}
var trivyConfigRunner = {
  id: "trivy-config",
  appliesTo: ["docker", "yaml", "terraform", "json"],
  priority: PRIORITY.GENERAL_ANALYSIS,
  skipTestFiles: false,
  async run(ctx) {
    const cwd = resolveRunnerCwd(ctx, "trivy-config");
    if (!isTrivyEnabled(cwd)) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const absPath = path44.resolve(cwd, ctx.filePath);
    if (ctx.kind === "yaml" || ctx.kind === "json") {
      let content = "";
      try {
        content = fs16.readFileSync(absPath, "utf-8");
      } catch {
        return { status: "skipped", diagnostics: [], semantic: "none" };
      }
      const isManifest = ctx.kind === "yaml" ? looksLikeKubernetesManifest(content) || looksLikeCloudFormationTemplate(content) : looksLikeCloudFormationTemplate(content);
      if (!isManifest) {
        return { status: "skipped", diagnostics: [], semantic: "none" };
      }
    }
    let cmd = null;
    if (await trivy2.isAvailableAsync(cwd)) {
      cmd = trivy2.getCommand(cwd);
    } else {
      const managed = await resolveAvailableOrInstall(trivy2, "trivy", cwd);
      if (managed)
        cmd = managed;
    }
    if (!cmd)
      return { status: "skipped", diagnostics: [], semantic: "none" };
    const severities = resolveSeverityFloor(cwd).join(",");
    const result = await safeSpawnAsync(cmd, [
      "config",
      // `--quiet` alone suppresses both the progress bar and log output.
      // `--no-progress` is NOT a `config` subcommand flag (unlike `fs`,
      // which does accept it) — trivy 0.73.0 exits 1 on the rejected
      // flag, but prints its full usage/help text (thousands of bytes)
      // to STDOUT before the FATAL line on stderr. That stdout is
      // non-empty, so an empty-output-only guard did not catch it: the
      // help text failed to JSON-parse, `parseTrivyConfigOutput`
      // returned `[]`, and this reported `{ status: "succeeded",
      // diagnostics: [] }` — a clean scan — on every single real
      // invocation (refs #1757; verified against the real installed
      // binary, not assumed).
      "--quiet",
      "--format",
      "json",
      "--severity",
      severities,
      absPath
    ], { cwd, timeout: 6e4 });
    if (result.error || result.status !== 0) {
      incrementDegradationCount({
        kind: "runner-empty-result",
        subject: absPath,
        reason: formatToolFailure({
          tool: "trivy config",
          status: result.status,
          signal: result.signal,
          stderr: result.stderr || result.error?.message,
          stdout: result.stdout
        })
      });
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const diagnostics = parseTrivyConfigOutput(result.stdout || "", ctx.filePath, cwd);
    if (diagnostics.length === 0) {
      return { status: "succeeded", diagnostics: [], semantic: "none" };
    }
    const hasBlocking = diagnostics.some((d) => d.semantic === "blocking");
    return findingsResult(diagnostics, {
      status: hasBlocking ? "failed" : "succeeded",
      semantic: hasBlocking ? "blocking" : "warning"
    });
  }
};
var trivy_config_default = trivyConfigRunner;

// dist/clients/dispatch/runners/vale.js
import * as fs17 from "node:fs";
import * as path45 from "node:path";
var vale = createAvailabilityChecker("vale", ".exe");
function findValeConfig(cwd) {
  const local = path45.join(cwd, ".vale.ini");
  if (fs17.existsSync(local))
    return local;
  let current = path45.resolve(cwd);
  while (true) {
    const candidate = path45.join(current, ".vale.ini");
    if (fs17.existsSync(candidate))
      return candidate;
    const parent = path45.dirname(current);
    if (parent === current)
      break;
    current = parent;
  }
  return void 0;
}
function parseValeOutput(raw, filePath, cwd) {
  const diagnostics = [];
  if (!raw.trim())
    return diagnostics;
  const absTarget = path45.resolve(cwd, filePath);
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object")
      return diagnostics;
    for (const [reported, alerts] of Object.entries(parsed)) {
      if (!Array.isArray(alerts))
        continue;
      if (reported && !pathsEqual(path45.resolve(cwd, reported), absTarget))
        continue;
      for (const alert of alerts) {
        if (!alert.Message)
          continue;
        const severityMap = {
          error: "error",
          warning: "warning",
          info: "info",
          suggestion: "info"
        };
        const severity = severityMap[alert.Severity?.toLowerCase() ?? ""] ?? "warning";
        diagnostics.push({
          id: `vale-${alert.Line}-${alert.Check ?? "unknown"}`,
          message: `[${alert.Check ?? "vale"}] ${alert.Message}`,
          filePath,
          line: alert.Line ?? 1,
          column: alert.Span?.[0] ?? 1,
          severity,
          semantic: severity === "error" ? "blocking" : "warning",
          tool: "vale",
          rule: alert.Check ?? "vale",
          fixable: false
        });
      }
    }
  } catch {
    return diagnostics;
  }
  return diagnostics;
}
var valeRunner = {
  id: "vale",
  appliesTo: ["markdown"],
  priority: PRIORITY.DOC_QUALITY,
  skipTestFiles: false,
  async run(ctx) {
    const cwd = resolveRunnerCwd(ctx, "vale");
    if (!findValeConfig(cwd)) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    let cmd = null;
    if (await vale.isAvailableAsync(cwd)) {
      cmd = vale.getCommand(cwd);
    } else {
      cmd = await resolveToolCommandWithInstallFallback(cwd, "vale");
    }
    if (!cmd)
      return { status: "skipped", diagnostics: [], semantic: "none" };
    const result = await safeSpawnAsync(cmd, ["--output", "JSON", ctx.filePath], { cwd, timeout: 15e3 });
    const run = parseToolRun("vale", {
      result,
      // EXIT TABLE (Vale 3.9.6 docs https://vale.sh/docs/topics/metrics/): 0 clean; 1 findings; 2 error; other nonzero rejected.
      exitCodes: { ran: [1, 2] }
    }, (raw) => parseValeOutput(raw, ctx.filePath, cwd));
    if (run.skipped)
      return run.skipped;
    const diagnostics = run.diagnostics;
    if (diagnostics.length === 0) {
      return { status: "succeeded", diagnostics: [], semantic: "none" };
    }
    const hasBlocking = diagnostics.some((d) => d.semantic === "blocking");
    return findingsResult(diagnostics, {
      status: hasBlocking ? "failed" : "succeeded",
      semantic: hasBlocking ? "blocking" : "warning"
    });
  }
};
var vale_default = valeRunner;

// dist/clients/dispatch/runners/tree-sitter.js
import * as path47 from "node:path";

// dist/clients/cache/rule-cache.js
import * as fs18 from "node:fs";
import * as path46 from "node:path";
var CACHE_VERSION = "v7";
function reportBundledRulesRootHealth() {
  reportBundledResourceDirHealth("tree-sitter-queries-dir-missing", BUNDLED_QUERIES_ROOT, getBundledQueriesRootHealth(), "bundled tree-sitter query rules");
}
var RuleCache = class {
  cacheFile;
  cacheDir;
  language;
  constructor(language, rootDir = process.cwd()) {
    this.language = language;
    reportBundledRulesRootHealth();
    this.cacheDir = path46.join(getProjectDataDir(rootDir), "cache");
    this.cacheFile = path46.join(this.cacheDir, `${language}-rules-${CACHE_VERSION}.json`);
  }
  ensureCacheDir() {
    if (!fs18.existsSync(this.cacheDir)) {
      fs18.mkdirSync(this.cacheDir, { recursive: true });
    }
  }
  computeRuleHash(ruleFiles) {
    return computeRuleFilesFingerprint(ruleFiles);
  }
  get(ruleFiles) {
    try {
      this.ensureCacheDir();
      if (!fs18.existsSync(this.cacheFile))
        return null;
      const currentHash = this.computeRuleHash(ruleFiles);
      const cached = readJsonCache(this.cacheFile, (parsed) => {
        const entry = parsed;
        if (entry.version !== CACHE_VERSION || entry.ruleHash !== currentHash) {
          return void 0;
        }
        return entry;
      });
      return cached ?? null;
    } catch {
      return null;
    }
  }
  set(ruleFiles, queries) {
    try {
      this.ensureCacheDir();
      const entry = {
        version: CACHE_VERSION,
        timestamp: Date.now(),
        ruleHash: this.computeRuleHash(ruleFiles),
        queries
      };
      writeFileAtomic(this.cacheFile, JSON.stringify(entry, null, 2));
      this.pruneStaleVersions();
    } catch {
    }
  }
  // Orphaned `<language>-rules-v<N>.json` files from a prior CACHE_VERSION
  // (e.g. v3 entries left behind by the #448 v3→v4 bump) never got cleaned up
  // on their own — nothing ever read or removed them again once the version
  // bumped. Delete every sibling for this language that isn't the current file.
  pruneStaleVersions() {
    const currentName = path46.basename(this.cacheFile);
    const pattern = new RegExp(`^${this.language}-rules-v\\d+\\.json$`);
    let dirents;
    try {
      dirents = fs18.readdirSync(this.cacheDir);
    } catch {
      return;
    }
    for (const name of dirents) {
      if (name === currentName || !pattern.test(name))
        continue;
      try {
        fs18.unlinkSync(path46.join(this.cacheDir, name));
      } catch {
      }
    }
  }
  clear() {
    try {
      if (fs18.existsSync(this.cacheFile)) {
        fs18.unlinkSync(this.cacheFile);
      }
    } catch {
    }
  }
};

// dist/clients/dispatch/runners/tree-sitter.js
var blastCooldownByFile = /* @__PURE__ */ new Map();
var BLAST_COOLDOWN_MS = 5e3;
function runBlastRadiusInBackground(cwd, filePath, languageId, facts) {
  void (async () => {
    try {
      const graph = await buildOrUpdateGraph2(cwd, [filePath], facts);
      const impact = computeImpactCascade2(graph, filePath, cwd);
      logTreeSitter({
        phase: "blast_radius",
        filePath,
        languageId,
        metadata: {
          changedSymbols: impact.changedSymbols,
          neighborFiles: impact.neighborFiles,
          directImporters: impact.directImporters,
          directCallers: impact.directCallers,
          riskFlags: impact.riskFlags
        }
      });
    } catch {
    }
  })();
}
var JSTS_SHARED_ENTITY_QUERIES = [
  {
    id: "entity-jsts-function",
    kind: "function",
    query: "(function_declaration name: (identifier) @NAME)"
  },
  {
    id: "entity-jsts-method",
    kind: "method",
    query: "(method_definition name: (property_identifier) @NAME)"
  },
  {
    id: "entity-jsts-arrow",
    kind: "function",
    query: "(lexical_declaration (variable_declarator name: (identifier) @NAME value: [(arrow_function) (function_expression)]))"
  }
];
var TS_STRUCTURAL_ENTITY_QUERIES = [
  {
    id: "entity-ts-interface",
    kind: "interface",
    query: "(interface_declaration name: (type_identifier) @NAME)"
  },
  {
    id: "entity-ts-type",
    kind: "type",
    query: "(type_alias_declaration name: (type_identifier) @NAME)"
  },
  {
    id: "entity-ts-enum",
    kind: "enum",
    query: "(enum_declaration name: (identifier) @NAME)"
  }
];
var ENTITY_QUERIES = {
  typescript: [
    // class name node differs between TS (type_identifier) and JS (identifier)
    {
      id: "entity-ts-class",
      kind: "class",
      query: "(class_declaration name: (type_identifier) @NAME)"
    },
    ...JSTS_SHARED_ENTITY_QUERIES,
    ...TS_STRUCTURAL_ENTITY_QUERIES
  ],
  javascript: [
    {
      id: "entity-js-class",
      kind: "class",
      query: "(class_declaration name: (identifier) @NAME)"
    },
    ...JSTS_SHARED_ENTITY_QUERIES
  ],
  python: [
    {
      id: "entity-py-function",
      kind: "function",
      query: "(function_definition name: (identifier) @NAME)"
    },
    {
      id: "entity-py-class",
      kind: "class",
      query: "(class_definition name: (identifier) @NAME)"
    }
  ],
  go: [
    {
      id: "entity-go-function",
      kind: "function",
      query: "(function_declaration name: (identifier) @NAME)"
    },
    {
      id: "entity-go-method",
      kind: "method",
      query: "(method_declaration name: (field_identifier) @NAME)"
    },
    {
      id: "entity-go-type",
      kind: "type",
      query: "(type_spec name: (type_identifier) @NAME)"
    }
  ],
  rust: [
    {
      id: "entity-rs-function",
      kind: "function",
      query: "(function_item name: (identifier) @NAME)"
    },
    {
      id: "entity-rs-struct",
      kind: "struct",
      query: "(struct_item name: (type_identifier) @NAME)"
    },
    {
      id: "entity-rs-enum",
      kind: "enum",
      query: "(enum_item name: (type_identifier) @NAME)"
    },
    // trait changes break all implementors — critical for blast-radius
    {
      id: "entity-rs-trait",
      kind: "trait",
      query: "(trait_item name: (type_identifier) @NAME)"
    },
    {
      id: "entity-rs-type",
      kind: "type",
      query: "(type_item name: (type_identifier) @NAME)"
    }
  ],
  ruby: [
    {
      id: "entity-rb-method",
      kind: "method",
      query: "(method name: (identifier) @NAME)"
    },
    // singleton methods (def self.foo) — class-level, miss changes without this
    {
      id: "entity-rb-singleton-method",
      kind: "method",
      query: "(singleton_method name: (identifier) @NAME)"
    },
    {
      id: "entity-rb-class",
      kind: "class",
      query: "(class name: (constant) @NAME)"
    },
    {
      id: "entity-rb-module",
      kind: "module",
      query: "(module name: (constant) @NAME)"
    }
  ],
  c: [
    {
      id: "entity-c-function",
      kind: "function",
      query: "(function_definition declarator: (function_declarator declarator: (identifier) @NAME))"
    },
    {
      id: "entity-c-typedef",
      kind: "type",
      query: "(type_definition declarator: (type_identifier) @NAME)"
    },
    {
      id: "entity-c-struct",
      kind: "struct",
      query: "(struct_specifier name: (type_identifier) @NAME)"
    },
    {
      id: "entity-c-enum",
      kind: "enum",
      query: "(enum_specifier name: (type_identifier) @NAME)"
    }
  ],
  cpp: [
    {
      id: "entity-cpp-function",
      kind: "function",
      query: "(function_definition declarator: (function_declarator declarator: (identifier) @NAME))"
    },
    {
      id: "entity-cpp-class",
      kind: "class",
      query: "(class_specifier name: (type_identifier) @NAME)"
    },
    {
      id: "entity-cpp-struct",
      kind: "struct",
      query: "(struct_specifier name: (type_identifier) @NAME)"
    },
    {
      id: "entity-cpp-namespace",
      kind: "namespace",
      query: "(namespace_definition name: (namespace_identifier) @NAME)"
    }
  ]
};
async function extractEntitySnapshot(client, filePath, languageId, contentOverride) {
  const defs = ENTITY_QUERIES[languageId] ?? [];
  const snapshot = /* @__PURE__ */ new Map();
  for (const def of defs) {
    const matches = await client.runQueryOnFile(
      {
        id: def.id,
        name: def.id,
        severity: "info",
        category: "entity",
        language: languageId,
        message: "",
        query: def.query,
        metavars: ["NAME"],
        has_fix: false,
        filePath: ""
      },
      filePath,
      languageId,
      { maxResults: 200 },
      // Parse the same buffer content the diagnostics phase used (#885).
      // Without this, unsaved buffers snapshot stale disk content and
      // thrash the parse-cache entry the rule walk just populated.
      contentOverride
    );
    for (const match of matches) {
      const name = match.captures.NAME?.trim();
      if (!name)
        continue;
      const key2 = `${def.kind}:${name}`;
      snapshot.set(key2, `${match.line}:${match.matchedText.slice(0, 400)}`);
    }
  }
  return snapshot;
}
var SILENT_ERROR_QUERY_IDS = /* @__PURE__ */ new Set([
  "empty-catch",
  "python-empty-except",
  "ruby-empty-rescue",
  "go-bare-error",
  "no-discarded-error"
]);
function defaultFixSuggestion2(defectClass, ruleId) {
  if (defectClass === "silent-error") {
    return "Handle the error path explicitly: add logging/telemetry and rethrow or return a typed error result.";
  }
  if (defectClass === "secrets") {
    return "Move secret material to environment/secret manager and read it at runtime.";
  }
  if (defectClass === "injection") {
    return "Replace dynamic execution/string interpolation with parameterized or allowlisted operations.";
  }
  if (defectClass === "async-misuse") {
    return "Restructure async flow to handle errors and sequencing deterministically (await/try-catch or explicit concurrency control).";
  }
  if (ruleId.includes("unwrap")) {
    return "Replace unwrap() with explicit error handling (match/if-let) or propagate with ?.";
  }
  return "Refactor this pattern to a safer, explicit form matching project conventions.";
}
function isLineInModifiedRanges(line, ranges) {
  if (!ranges || ranges.length === 0)
    return true;
  return ranges.some((r) => line >= r.start && line <= r.end);
}
function getTotalLinesChanged(ranges) {
  if (!ranges || ranges.length === 0)
    return 0;
  return ranges.reduce((total, r) => total + (r.end - r.start + 1), 0);
}
var ENTITY_EXTRACTION_LINE_THRESHOLD = 5;
var treeSitterRunner = {
  id: "tree-sitter",
  appliesTo: [
    "jsts",
    "python",
    "go",
    "rust",
    "ruby",
    "cxx",
    "csharp",
    "php",
    "css"
  ],
  priority: PRIORITY.STRUCTURAL_ANALYSIS,
  skipTestFiles: false,
  // Run on test files too (structural issues matter there)
  async run(ctx) {
    const client = getSharedTreeSitterClient();
    logTreeSitter({ phase: "runner_start", filePath: ctx.filePath });
    if (!client || !client.isAvailable()) {
      logTreeSitter({
        phase: "runner_skip",
        filePath: ctx.filePath,
        reason: isTreeSitterWasmAborted() ? "wasm_aborted" : "client_unavailable",
        status: "skipped"
      });
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const initialized = await client.init();
    if (!initialized) {
      logTreeSitter({
        phase: "runner_skip",
        filePath: ctx.filePath,
        reason: "client_init_failed",
        status: "skipped"
      });
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const filePath = ctx.filePath;
    const ext = path47.extname(filePath).toLowerCase();
    const languageId = resolveTreeSitterLanguage(filePath);
    if (!languageId) {
      logTreeSitter({
        phase: "runner_skip",
        filePath: ctx.filePath,
        reason: `unsupported_extension:${ext}`,
        status: "skipped"
      });
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    let languageQueries = [];
    const cache = new RuleCache(languageId, ctx.cwd);
    const ruleFiles = ruleFilesForLanguage(languageId, ctx.cwd);
    const cached = cache.get(ruleFiles);
    let cacheHit = false;
    if (cached) {
      cacheHit = true;
      languageQueries = cached.queries.map((q) => ({
        ...q,
        has_fix: q.has_fix ?? false,
        filePath: q.filePath ?? ""
      })).filter((q) => !isDisabledQueryFilePath(q.filePath));
    } else {
      await queryLoader.loadQueries(ctx.cwd, { force: true });
      languageQueries = queriesForLanguage(new Map(ruleSourceLanguages(languageId).map((lang) => [
        lang,
        queryLoader.getQueriesForLanguage(lang)
      ])), languageId);
      cache.set(ruleFiles, languageQueries.map((q) => ({
        id: q.id,
        name: q.name,
        severity: q.severity,
        language: q.language,
        message: q.message,
        query: q.query,
        metavars: q.metavars,
        post_filter: q.post_filter,
        post_filter_params: q.post_filter_params,
        defect_class: q.defect_class,
        inline_tier: q.inline_tier,
        skip_test_files: q.skip_test_files,
        ignore_paths: q.ignore_paths,
        has_fix: q.has_fix,
        fix_action: q.fix_action,
        filePath: q.filePath
      })));
    }
    if (languageQueries.length === 0) {
      logTreeSitter({
        phase: "runner_complete",
        filePath,
        languageId,
        status: "succeeded",
        diagnostics: 0,
        blocking: 0,
        queryCount: 0,
        effectiveQueryCount: 0
      });
      return { status: "succeeded", diagnostics: [], semantic: "none" };
    }
    const fileIsTest = isTestFile(filePath);
    const ignoreRoot = ctx.projectRoot ?? ctx.cwd;
    const effectiveQueries = (ctx.blockingOnly ? languageQueries.filter((q) => q.inline_tier !== "review") : languageQueries).filter((q) => !(fileIsTest && q.skip_test_files) && !isRuleIgnoredForPath(filePath, ignoreRoot, q.ignore_paths) && !ruleIgnoredForPath(q.id, filePath, ignoreRoot, ctx.rulePolicy));
    logTreeSitter({
      phase: "queries_loaded",
      filePath,
      languageId,
      queryCount: languageQueries.length,
      effectiveQueryCount: effectiveQueries.length,
      cacheHit,
      metadata: { blockingOnly: !!ctx.blockingOnly }
    });
    if (effectiveQueries.length === 0) {
      return { status: "succeeded", diagnostics: [], semantic: "none" };
    }
    const contentFromFacts = ctx.facts.getFileFact(filePath, "file.content");
    const contentOverride = contentFromFacts !== void 0 && contentFromFacts !== null ? contentFromFacts : void 0;
    const diagnostics = [];
    try {
      const found = await client.runQueriesOnFile(effectiveQueries, filePath, languageId, { maxResults: 10 }, contentOverride);
      for (const { queryDef: query, match } of found) {
        const { line, column } = match;
        const isSeverityBlocking = query.severity === "error" || query.inline_tier === "blocking" || SILENT_ERROR_QUERY_IDS.has(query.id);
        if (ctx.blockingOnly && isSeverityBlocking && !isLineInModifiedRanges(line, ctx.modifiedRanges)) {
          continue;
        }
        const semantic = query.severity === "error" ? "blocking" : query.severity === "warning" ? "warning" : "none";
        const defectClass = query.defect_class ?? classifyDefect(query.id, "tree-sitter", query.message);
        const suggestion = query.has_fix && query.fix_action ? `${query.fix_action} this statement` : semantic === "blocking" ? defaultFixSuggestion2(defectClass, query.id) : void 0;
        const hasSuggestedFix = !!query.has_fix;
        diagnostics.push({
          id: `tree-sitter:${query.id}:${line}`,
          message: query.message.replace(/\{\{(\w+)\}\}/g, (_, name) => match.captures[name]?.trim() ?? `{{${name}}}`),
          filePath,
          line,
          column,
          severity: query.severity,
          semantic,
          tool: "tree-sitter",
          rule: query.id,
          defectClass,
          // Surface fix intent to agent — tree-sitter never auto-applies;
          // linters (biome/ruff/eslint) own the autofix phase.
          fixable: hasSuggestedFix,
          autoFixAvailable: false,
          fixKind: hasSuggestedFix ? "suggestion" : void 0,
          fixSuggestion: suggestion,
          matchedText: match.matchedText || void 0,
          astNodeType: match.nodeType || void 0
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (classifyTreeSitterWasmError(err) === "abort") {
        markTreeSitterWasmAborted();
        logTreeSitter({
          phase: "query_error",
          filePath,
          languageId,
          error: "wasm_aborted_fatal",
          metadata: { queryIds: effectiveQueries.map((q) => q.id) }
        });
      } else {
        logTreeSitter({
          phase: "query_error",
          filePath,
          languageId,
          error: msg,
          metadata: { queryIds: effectiveQueries.map((q) => q.id) }
        });
      }
    }
    const totalLinesChanged = getTotalLinesChanged(ctx.modifiedRanges);
    const skipEntityExtraction = ctx.modifiedRanges != null && ctx.modifiedRanges.length > 0 && totalLinesChanged < ENTITY_EXTRACTION_LINE_THRESHOLD;
    if (!skipEntityExtraction) {
      try {
        const snapshot = await extractEntitySnapshot(client, filePath, languageId, contentOverride);
        const diff = recordEntitySnapshotDiff(ctx.facts, filePath, snapshot);
        const changedEntityKeys = [
          ...diff.added,
          ...diff.modified,
          ...diff.removed
        ];
        if (changedEntityKeys.length > 0) {
          logTreeSitter({
            phase: "entity_diff",
            filePath,
            languageId,
            metadata: {
              added: diff.added,
              modified: diff.modified,
              removed: diff.removed,
              totalChanged: changedEntityKeys.length
            }
          });
          const lastBlast = blastCooldownByFile.get(filePath) ?? 0;
          if (Date.now() - lastBlast < BLAST_COOLDOWN_MS) {
            logTreeSitter({
              phase: "blast_radius",
              filePath,
              languageId,
              metadata: { skipped: "cooldown", cooldownMs: BLAST_COOLDOWN_MS }
            });
          } else {
            blastCooldownByFile.set(filePath, Date.now());
            runBlastRadiusInBackground(ctx.cwd, filePath, languageId, ctx.facts);
          }
        }
      } catch {
      }
    }
    if (diagnostics.length === 0) {
      if (!isTreeSitterWasmAborted() && !client.getLanguage(languageId)) {
        logTreeSitter({
          phase: "runner_skip",
          filePath,
          languageId,
          reason: "grammar_unavailable",
          status: "skipped"
        });
        return { status: "skipped", diagnostics: [], semantic: "none" };
      }
      logTreeSitter({
        phase: "runner_complete",
        filePath,
        languageId,
        status: "succeeded",
        diagnostics: 0,
        blocking: 0,
        queryCount: languageQueries.length,
        effectiveQueryCount: effectiveQueries.length
      });
      return { status: "succeeded", diagnostics: [], semantic: "none" };
    }
    const hasBlocking = diagnostics.some((d) => d.semantic === "blocking");
    const blockingCount = diagnostics.filter((d) => d.semantic === "blocking").length;
    logTreeSitter({
      phase: "runner_complete",
      filePath,
      languageId,
      status: hasBlocking ? "failed" : "succeeded",
      diagnostics: diagnostics.length,
      blocking: blockingCount,
      queryCount: languageQueries.length,
      effectiveQueryCount: effectiveQueries.length
    });
    return findingsResult(diagnostics, {
      status: hasBlocking ? "failed" : "succeeded",
      semantic: hasBlocking ? "blocking" : "warning"
    });
  }
};
var tree_sitter_default = treeSitterRunner;

// dist/clients/dispatch/runners/yamllint.js
import * as path48 from "node:path";
var yamllint = createAvailabilityChecker("yamllint", ".exe");
function parseYamllintParsable(raw, filePath, cwd) {
  const diagnostics = [];
  const absTarget = path48.resolve(cwd, filePath);
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim())
      continue;
    const match = line.match(/^(.*?):(\d+):(\d+):\s*\[(error|warning)\]\s*(.*?)\s*\(([^)]+)\)\s*$/i);
    if (!match)
      continue;
    if (!pathsEqual(path48.resolve(cwd, match[1]), absTarget))
      continue;
    const severity = match[4].toLowerCase() === "error" ? "error" : "warning";
    diagnostics.push({
      id: `yamllint-${match[2]}-${match[3]}-${match[6]}`,
      message: `[${match[6]}] ${match[5]}`,
      filePath,
      line: Number(match[2]),
      column: Number(match[3]),
      severity,
      semantic: severity === "error" ? "blocking" : "warning",
      tool: "yamllint",
      rule: match[6]
    });
  }
  return diagnostics;
}
var yamllintRunner = {
  id: "yamllint",
  appliesTo: ["yaml"],
  priority: PRIORITY.YAML_LINT,
  skipTestFiles: false,
  async run(ctx) {
    const cwd = resolveRunnerCwd2(ctx, "yamllint");
    const policy = getLinterPolicyForCwd(ctx.filePath, cwd);
    if (policy && !policy.preferredRunners.includes("yamllint")) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const hasConfig = hasYamllintConfig(cwd);
    if (!hasConfig) {
      logRunnerAdvisoryOnce(ctx, "yamllint", cwd, "yamllint: no config detected, running with default rules");
    }
    let cmd = null;
    if (await yamllint.isAvailableAsync(cwd)) {
      cmd = yamllint.getCommand(cwd);
    } else {
      cmd = await resolveToolCommandWithInstallFallback(cwd, "yamllint");
    }
    if (!cmd)
      return { status: "skipped", diagnostics: [], semantic: "none" };
    const result = await safeSpawnAsync(cmd, ["-f", "parsable", ctx.filePath], {
      cwd,
      timeout: 15e3
    });
    const raw = `${result.stdout ?? ""}${result.stderr ?? ""}`;
    const run = parseToolRun("yamllint", {
      result,
      output: result.stdout,
      // EXIT TABLE (yamllint 1.35 docs https://yamllint.readthedocs.io/en/stable/): 0 clean; 1 findings; 2 error; other nonzero rejected.
      exitCodes: { ran: [1, 2] }
    }, (out) => parseYamllintParsable(out, ctx.filePath, cwd), { parseOutput: raw });
    if (run.skipped)
      return run.skipped;
    const diagnostics = run.diagnostics;
    return finishParsedRun({
      tool: "yamllint",
      ctx,
      result,
      diagnostics
    });
  }
};
var yamllint_default = yamllintRunner;

// dist/clients/dispatch/runners/zig-check.js
import * as path49 from "node:path";
var zig = createAvailabilityChecker("zig", ".exe", ["version"]);
function parseZigOutput(raw, filePath, cwd) {
  const diagnostics = [];
  const absTarget = path49.resolve(cwd, filePath);
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^(.*?):(\d+):(\d+):\s*(error|warning|note):\s*(.+)$/);
    if (!match)
      continue;
    const [, rawFile, lineStr, colStr, level, message] = match;
    if (!pathsEqual(path49.resolve(cwd, rawFile.trim()), absTarget))
      continue;
    const severity = level === "error" ? "error" : "warning";
    diagnostics.push({
      id: `zig-${level}-${lineStr}-${colStr}`,
      message,
      filePath,
      line: Number.parseInt(lineStr, 10) || 1,
      column: Number.parseInt(colStr, 10) || 1,
      severity,
      // `zig build-exe <file>` does not load build.zig module/import context.
      // Its findings are useful evidence, but cannot prove a project blocker.
      semantic: "warning",
      tool: "zig",
      rule: `zig-${level}`,
      fixable: false
    });
  }
  return diagnostics;
}
var zigCheckRunner = {
  id: "zig-check",
  appliesTo: ["zig"],
  priority: PRIORITY.GENERAL_ANALYSIS,
  skipTestFiles: false,
  async run(ctx) {
    const cwd = resolveRunnerCwd(ctx, "zig-check");
    if (!await zig.isAvailableAsync(cwd)) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const cmd = zig.getCommand(cwd);
    const absPath = path49.resolve(cwd, ctx.filePath);
    const result = await safeSpawnAsync(cmd, ["build-exe", absPath, "-fno-emit-bin"], { cwd, timeout: 3e4 });
    if (result.error && !result.stdout && !result.stderr) {
      return { status: "skipped", diagnostics: [], semantic: "none" };
    }
    const raw = `${result.stdout || ""}
${result.stderr || ""}`;
    const parsed = parseToolRun("zig-check", {
      result,
      output: raw,
      // EXIT TABLE (Zig 0.13 measured fixture): 0 clean; 1 findings; 2 error; other nonzero rejected.
      exitCodes: { ran: [1, 2] }
    }, (output) => parseZigOutput(output, ctx.filePath, cwd));
    if (parsed.skipped)
      return parsed.skipped;
    return finishParsedRun({
      tool: "zig-check",
      ctx,
      result,
      diagnostics: parsed.diagnostics,
      classify: (diagnostics) => ({
        status: diagnostics.some((d) => d.severity === "error") ? "failed" : "succeeded",
        semantic: "warning"
      })
    });
  }
};
var zig_check_default = zigCheckRunner;

// dist/clients/dispatch/runners/index.js
function registerDefaultRunners(registry) {
  registry.register(lsp_default);
  registry.register(pyright_default);
  registry.register(biome_check_default);
  registry.register(ast_grep_napi_default);
  registry.register(tree_sitter_default);
  registry.register(ruff_default);
  registry.register(shellcheck_default);
  registry.register(spotbugs_default);
  registry.register(eslint_default);
  registry.register(oxlint_default);
  registry.register(golangci_lint_default);
  registry.register(rubocop_default);
  registry.register(spellcheck_default);
  registry.register(yamllint_default);
  registry.register(actionlint_default);
  registry.register(sqlfluff_default);
  registry.register(go_vet_default);
  registry.register(rust_clippy_default);
  registry.register(markdownlint_default);
  registry.register(mypy_default);
  registry.register(stylelint_default);
  registry.register(swiftlint_default);
  registry.register(shfmt_default);
  registry.register(fish_indent_default);
  registry.register(fact_rules_default);
  registry.register(htmlhint_default);
  registry.register(hadolint_default);
  registry.register(helm_lint_default);
  registry.register(helm_render_default);
  registry.register(vale_default);
  registry.register(php_lint_default);
  registry.register(psscriptanalyzer_default);
  registry.register(prisma_validate_default);
  registry.register(ktlint_default);
  registry.register(detekt_default);
  registry.register(tflint_default);
  registry.register(terragrunt_default);
  registry.register(trivy_config_default);
  registry.register(taplo_default);
  registry.register(dart_analyze_default);
  registry.register(javac_default);
  registry.register(dotnet_build_default);
  registry.register(cpp_check_default);
  registry.register(zig_check_default);
  registry.register(gleam_check_default);
  registry.register(credo_default);
  registry.register(elixir_check_default);
  registry.register(phpstan_default);
  registry.register(cue_vet_default);
}

// dist/clients/dispatch/rules/async-noise.js
var asyncNoiseRule = {
  id: "async-noise",
  requires: ["file.functionSummaries"],
  appliesTo(ctx) {
    return /\.tsx?$/.test(ctx.filePath) && !isTestFile(ctx.filePath);
  },
  evaluate(ctx, store) {
    const summaries = store.getFileFact(ctx.filePath, "file.functionSummaries");
    if (!summaries)
      return [];
    const diagnostics = [];
    const ASYNC_INTERFACE_PATTERN = /^(on[A-Z]|handle[A-Z]|before[A-Z]|after[A-Z]|setup|teardown|init|dispose|connect|disconnect|open|close|start|stop|run|execute|invoke|dispatch|middleware)/;
    for (const fn of summaries) {
      if (fn.isAsync && !fn.hasAwait && !fn.hasReturnAwaitCall && !fn.isPassThroughWrapper && !fn.hasExplicitPromiseReturnType && !ASYNC_INTERFACE_PATTERN.test(fn.name) && // Skip single-statement functions — likely interface stubs or thin wrappers
      fn.statementCount > 1) {
        diagnostics.push({
          id: `async-noise:${ctx.filePath}:${fn.line}:${fn.column}`,
          tool: "fact-rules",
          filePath: ctx.filePath,
          line: fn.line,
          column: fn.column,
          severity: "warning",
          semantic: "warning",
          message: `Async function '${fn.name}' has no await and appears to add async noise`,
          rule: "async-noise"
        });
      }
    }
    return diagnostics;
  }
};

// dist/clients/dispatch/rules/async-unnecessary-wrapper.js
var asyncUnnecessaryWrapperRule = {
  id: "async-unnecessary-wrapper",
  requires: ["file.functionSummaries"],
  appliesTo(ctx) {
    return /\.tsx?$/.test(ctx.filePath);
  },
  evaluate(ctx, store) {
    const fns = store.getFileFact(ctx.filePath, "file.functionSummaries") ?? [];
    const diagnostics = [];
    for (const f of fns) {
      if (!f.isAsync || !f.isPassThroughWrapper || f.hasAwait)
        continue;
      diagnostics.push({
        id: `async-unnecessary-wrapper:${ctx.filePath}:${f.line}`,
        tool: "fact-rules",
        rule: "async-unnecessary-wrapper",
        filePath: ctx.filePath,
        line: f.line,
        column: f.column,
        severity: "warning",
        semantic: "warning",
        message: `'${f.name}' is async but has no await and just forwards to '${f.passThroughTarget}' \u2014 the async keyword is unnecessary and wraps the return in an extra Promise`
      });
    }
    return diagnostics;
  }
};

// dist/clients/dispatch/rules/cors-wildcard.js
var corsWildcardRule = {
  id: "cors-wildcard",
  requires: ["file.content"],
  appliesTo(ctx) {
    return /\.(tsx?|py|go)$/.test(ctx.filePath);
  },
  evaluate(ctx, store) {
    const content = store.getFileFact(ctx.filePath, "file.content");
    if (!content)
      return [];
    const diagnostics = [];
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^\s*(?:\/\/|\*|#|\/)/.test(line))
        continue;
      const isWildcard = (
        // TS/JS: header assignment or cors() call
        /["']Access-Control-Allow-Origin["']/.test(line) && /["']\*["']/.test(line) || /origin\s*:\s*["']\*["']/.test(line) || /cors\s*\(/.test(line) && /\*/.test(line) || // Python (FastAPI CORSMiddleware / Flask-CORS):
        // wildcard allow_origins/origins assignment
        /(?:allow_origins|origins)\s*=\s*["']\*["']/.test(line) || // wildcard allow_origins/origins array assignment
        /(?:allow_origins|origins)\s*=\s*[[(]["']\*["']/.test(line) || // Go (gin-cors, chi-cors, gorilla):
        // AllowAllOrigins enabled
        /AllowAllOrigins\s*:\s*true/.test(line) || // wildcard AllowOrigins/AllowedOrigins slice
        // Use [^*\n]{0,60} instead of .* to prevent super-linear backtracking
        /Allow(?:ed)?Origins[^*\n]{0,60}\*/.test(line)
      );
      if (isWildcard) {
        diagnostics.push({
          id: `cors-wildcard:${ctx.filePath}:${i + 1}`,
          tool: "fact-rules",
          rule: "cors-wildcard",
          filePath: ctx.filePath,
          line: i + 1,
          column: 1,
          severity: "error",
          semantic: "blocking",
          message: "CORS wildcard origin (*) allows any website to make credentialed requests \u2014 restrict to known origins"
        });
      }
    }
    return diagnostics;
  }
};

// dist/clients/dispatch/rules/error-obscuring.js
var errorObscuringRule = {
  id: "error-obscuring",
  requires: ["file.tryCatchSummaries"],
  appliesTo(ctx) {
    return /\.tsx?$/.test(ctx.filePath);
  },
  evaluate(ctx, store) {
    const summaries = store.getFileFact(ctx.filePath, "file.tryCatchSummaries");
    if (!summaries)
      return [];
    const diagnostics = [];
    for (const s of summaries) {
      if (!s.isEmpty && !s.hasRethrow && s.catchParam !== null && !s.bodyText.includes(s.catchParam)) {
        diagnostics.push({
          id: `error-obscuring:${ctx.filePath}:${s.line}:${s.column}`,
          tool: "fact-rules",
          rule: "error-obscuring",
          filePath: ctx.filePath,
          line: s.line,
          column: s.column,
          severity: "warning",
          semantic: "warning",
          message: `Catch block catches '${s.catchParam}' but never references it \u2014 the error is obscured`
        });
      }
    }
    return diagnostics;
  }
};

// dist/clients/dispatch/rules/error-swallowing.js
var errorSwallowingRule = {
  id: "error-swallowing",
  requires: ["file.tryCatchSummaries"],
  appliesTo(ctx) {
    return /\.tsx?$/.test(ctx.filePath);
  },
  evaluate(ctx, store) {
    const summaries = store.getFileFact(ctx.filePath, "file.tryCatchSummaries");
    if (!summaries)
      return [];
    const diagnostics = [];
    for (const s of summaries) {
      if (s.isEmpty && !s.isDocumentedLocalFallback && s.boundaryCategory !== "fs") {
        diagnostics.push({
          id: `error-swallowing:${ctx.filePath}:${s.line}:${s.column}`,
          tool: "fact-rules",
          rule: "error-swallowing",
          filePath: ctx.filePath,
          line: s.line,
          column: s.column,
          severity: "error",
          semantic: "blocking",
          message: `Empty catch block silently swallows errors`
        });
      }
    }
    return diagnostics;
  }
};

// dist/clients/dispatch/rules/framework-call-noise.js
var EXPECT_CHAIN_PREFIX = "expect(";
var TEST_LIFECYCLE_NAMES = /* @__PURE__ */ new Set([
  "it",
  "test",
  "describe",
  "beforeeach",
  "aftereach",
  "beforeall",
  "afterall"
]);
var TEST_LIFECYCLE_PREFIXES = ["it.", "test.", "describe."];
var MOCK_LIBRARY_PREFIXES = ["vi.", "jest."];
function isTestFrameworkNoiseCall(call) {
  const lower = call.toLowerCase();
  if (lower === "expect" || lower.startsWith(EXPECT_CHAIN_PREFIX))
    return true;
  if (TEST_LIFECYCLE_NAMES.has(lower))
    return true;
  if (TEST_LIFECYCLE_PREFIXES.some((p) => lower.startsWith(p)))
    return true;
  if (MOCK_LIBRARY_PREFIXES.some((p) => lower.startsWith(p)))
    return true;
  return false;
}
function isTestSuiteOrganizer(calls) {
  return calls.some((call) => {
    const lower = call.toLowerCase();
    const base = lower.split("(")[0].split(".")[0];
    return base === "it" || base === "test" || base === "describe";
  });
}

// dist/clients/dispatch/rules/high-complexity.js
var DEFAULT_HIGH_COMPLEXITY_THRESHOLD = 15;
var DEFAULT_HIGH_COMPLEXITY_DEPTH_THRESHOLD = 6;
var ccThreshold = DEFAULT_HIGH_COMPLEXITY_THRESHOLD;
var depthThreshold = DEFAULT_HIGH_COMPLEXITY_DEPTH_THRESHOLD;
var highComplexityRule = {
  id: "high-complexity",
  requires: ["file.functionSummaries"],
  appliesTo(ctx) {
    return /\.tsx?$/.test(ctx.filePath);
  },
  evaluate(ctx, store) {
    const fns = store.getFileFact(ctx.filePath, "file.functionSummaries") ?? [];
    const diagnostics = [];
    const configuredCcThreshold = ctx.projectConfig?.rules["high-complexity"]?.threshold;
    const activeCcThreshold = configuredCcThreshold ?? ccThreshold;
    for (const f of fns) {
      if (isTestSuiteOrganizer(f.outgoingCalls))
        continue;
      const ccBreached = f.cyclomaticComplexity >= activeCcThreshold;
      const depthBreached = f.maxNestingDepth >= depthThreshold;
      if (!ccBreached && !depthBreached)
        continue;
      const parts = [];
      if (ccBreached)
        parts.push(`cyclomatic complexity ${f.cyclomaticComplexity}`);
      if (depthBreached)
        parts.push(`nesting depth ${f.maxNestingDepth}`);
      diagnostics.push({
        id: `high-complexity:${ctx.filePath}:${f.line}`,
        tool: "fact-rules",
        rule: "high-complexity",
        filePath: ctx.filePath,
        line: f.line,
        column: f.column,
        severity: "warning",
        semantic: "warning",
        message: `'${f.name}' has ${parts.join(" and ")} \u2014 consider breaking it up`
      });
    }
    return diagnostics;
  }
};

// dist/clients/dispatch/rules/high-fan-out.js
var DEFAULT_HIGH_FAN_OUT_THRESHOLD = 20;
var fanOutThreshold = DEFAULT_HIGH_FAN_OUT_THRESHOLD;
var highFanOutRule = {
  id: "high-fan-out",
  requires: ["file.functionSummaries"],
  appliesTo(ctx) {
    return /\.tsx?$/.test(ctx.filePath);
  },
  evaluate(ctx, store) {
    const fns = store.getFileFact(ctx.filePath, "file.functionSummaries") ?? [];
    const diagnostics = [];
    const configuredFanOutThreshold = ctx.projectConfig?.rules["high-fan-out"]?.threshold;
    const activeFanOutThreshold = configuredFanOutThreshold ?? fanOutThreshold;
    for (const f of fns) {
      if (isTestSuiteOrganizer(f.outgoingCalls))
        continue;
      const meaningful = f.outgoingCalls.filter((c) => {
        const lower = c.toLowerCase();
        return !lower.startsWith("console.") && !lower.startsWith("math.") && !lower.startsWith("json.") && !lower.startsWith("object.") && !lower.startsWith("array.") && !lower.startsWith("string(") && !lower.startsWith("number(") && !lower.startsWith("boolean(") && !lower.startsWith("error(") && c !== "resolve" && c !== "reject" && c !== "next" && c !== "done" && !isTestFrameworkNoiseCall(c);
      });
      if (meaningful.length < activeFanOutThreshold)
        continue;
      diagnostics.push({
        id: `high-fan-out:${ctx.filePath}:${f.line}`,
        tool: "fact-rules",
        rule: "high-fan-out",
        filePath: ctx.filePath,
        line: f.line,
        column: f.column,
        severity: "warning",
        semantic: "warning",
        message: `'${f.name}' calls ${meaningful.length} distinct functions \u2014 coordination smell, consider splitting responsibilities`
      });
    }
    return diagnostics;
  }
};

// dist/clients/dispatch/rules/high-import-coupling.js
var IMPORT_COUPLING_THRESHOLD = 15;
var IMPORT_COUPLING_EXEMPT = /[/\\](index|integration)\.[cm]?tsx?$/;
var highImportCouplingRule = {
  id: "high-import-coupling",
  requires: ["file.imports"],
  appliesTo(ctx) {
    return /\.tsx?$/.test(ctx.filePath);
  },
  evaluate(ctx, store) {
    if (IMPORT_COUPLING_EXEMPT.test(ctx.filePath))
      return [];
    const imports = store.getFileFact(ctx.filePath, "file.imports") ?? [];
    const sources = new Set(imports.map((i) => i.source));
    const count = sources.size;
    if (count <= IMPORT_COUPLING_THRESHOLD)
      return [];
    return [
      {
        id: `high-import-coupling:${ctx.filePath}:1:1`,
        tool: "fact-rules",
        rule: "high-import-coupling",
        filePath: ctx.filePath,
        line: 1,
        column: 1,
        severity: "warning",
        semantic: "warning",
        message: `File imports from ${count} distinct modules (threshold: ${IMPORT_COUPLING_THRESHOLD}) \u2014 split responsibilities`
      }
    ];
  }
};

// dist/clients/dispatch/rules/missing-error-propagation.js
var missingErrorPropagationRule = {
  id: "missing-error-propagation",
  requires: ["file.functionSummaries", "file.tryCatchSummaries"],
  appliesTo(ctx) {
    return /\.tsx?$/.test(ctx.filePath);
  },
  evaluate(ctx, store) {
    const fns = store.getFileFact(ctx.filePath, "file.functionSummaries") ?? [];
    const catches = store.getFileFact(ctx.filePath, "file.tryCatchSummaries") ?? [];
    const diagnostics = [];
    const asyncFns = fns.filter((f) => f.isAsync && !f.isPassThroughWrapper);
    for (const f of asyncFns) {
      const nextFnLine = fns.filter((g) => g.line > f.line).reduce((min, g) => Math.min(min, g.line), Infinity);
      const relevantCatches = catches.filter((c) => c.line >= f.line && c.line < nextFnLine);
      for (const c of relevantCatches) {
        if (c.isEmpty || c.hasRethrow)
          continue;
        if (!c.hasLogging)
          continue;
        if (c.catchReturnsDefault)
          continue;
        if (c.catchReturnsStructuredError)
          continue;
        if (c.isDocumentedLocalFallback)
          continue;
        if (c.isFilesystemExistenceProbe)
          continue;
        if (/\b(serverFailed|failed|error)\s*=/.test(c.bodyText))
          continue;
        diagnostics.push({
          id: `missing-error-propagation:${ctx.filePath}:${c.line}`,
          tool: "fact-rules",
          rule: "missing-error-propagation",
          filePath: ctx.filePath,
          line: c.line,
          column: c.column,
          severity: "warning",
          semantic: "warning",
          message: `Catch block in async '${f.name}' logs the error but doesn't rethrow \u2014 callers receive undefined and assume success`
        });
      }
    }
    return diagnostics;
  }
};

// dist/clients/dispatch/rules/no-commented-credentials.js
var CREDENTIAL_PATTERNS = [
  /password\s*[:=]\s*["'][^"']{3,}/i,
  /(?:api[_-]?key|secret|token)\s*[:=]\s*["'][^"']{6,}/i,
  /(?:aws|gcp|azure)[_-]?(?:key|secret|token)\s*[:=]\s*["'][^"']{6,}/i
];
var CREDENTIALS_EXEMPT = /[/\\](secrets?[-_]?(scanner|detect|check)|scanner|fixture|mock)[^/\\]*\.(tsx?|ya?ml|json|env)$/i;
function isCommentLine(line) {
  return line.startsWith("//") || line.startsWith("#") || line.startsWith("*");
}
var commentedCredentialsRule = {
  id: "no-commented-credentials",
  requires: ["file.content"],
  appliesTo(ctx) {
    return /\.(tsx?|py|go|rb|ya?ml|json|env)$/.test(ctx.filePath) && !CREDENTIALS_EXEMPT.test(ctx.filePath);
  },
  evaluate(ctx, store) {
    const content = store.getFileFact(ctx.filePath, "file.content");
    if (!content)
      return [];
    const diagnostics = [];
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trimStart();
      if (!isCommentLine(line))
        continue;
      for (const p of CREDENTIAL_PATTERNS) {
        if (p.test(line)) {
          diagnostics.push({
            id: `no-commented-credentials:${ctx.filePath}:${i + 1}`,
            tool: "fact-rules",
            rule: "no-commented-credentials",
            filePath: ctx.filePath,
            line: i + 1,
            column: 1,
            severity: "error",
            semantic: "blocking",
            message: "Possible credential in commented-out code \u2014 remove it and rotate the secret"
          });
          break;
        }
      }
    }
    return diagnostics;
  }
};

// dist/clients/dispatch/rules/pass-through-wrappers.js
var ALIAS_COMMENT_RE = /\b(alias|backward\s*compat|backwards\s*compat|compatibility|shim|adapter)\b/i;
function hasAliasCommentNear(line, comments) {
  return comments.some((comment) => comment.line >= line - 2 && comment.line <= line && ALIAS_COMMENT_RE.test(comment.text));
}
var passThroughWrappersRule = {
  id: "pass-through-wrappers",
  requires: ["file.functionSummaries", "file.comments"],
  appliesTo(ctx) {
    return /\.tsx?$/.test(ctx.filePath) && !isTestFile(ctx.filePath);
  },
  evaluate(ctx, store) {
    const summaries = store.getFileFact(ctx.filePath, "file.functionSummaries");
    const comments = store.getFileFact(ctx.filePath, "file.comments");
    if (!summaries || !comments)
      return [];
    const diagnostics = [];
    for (const fn of summaries) {
      if (!fn.isPassThroughWrapper || fn.statementCount !== 1 || fn.isBoundaryWrapper) {
        continue;
      }
      if (hasAliasCommentNear(fn.line, comments))
        continue;
      diagnostics.push({
        id: `pass-through-wrapper:${ctx.filePath}:${fn.line}:${fn.column}`,
        tool: "fact-rules",
        filePath: ctx.filePath,
        line: fn.line,
        column: fn.column,
        severity: "warning",
        semantic: "warning",
        rule: "pass-through-wrappers",
        message: `Function '${fn.name}' is a trivial pass-through wrapper`
      });
    }
    return diagnostics;
  }
};

// dist/clients/dispatch/rules/placeholder-comments.js
var PLACEHOLDER_PATTERNS = [
  /add\s+more\s+validation/i,
  /handle\s+(additional|more)\s+cases?/i,
  /can\s+be\s+extended\s+in\s+the\s+future/i,
  /extend\s+this\s+(logic|function|method|handler|module)/i,
  /customize\s+this\s+(logic|behavior|function|method|handler)/i,
  /future\s+enhancement/i,
  /implement\s+.+\s+here/i
];
var placeholderCommentsRule = {
  id: "placeholder-comments",
  requires: ["file.comments"],
  appliesTo(ctx) {
    return /\.tsx?$/.test(ctx.filePath) && !isTestFile(ctx.filePath);
  },
  evaluate(ctx, store) {
    const comments = store.getFileFact(ctx.filePath, "file.comments");
    if (!comments)
      return [];
    const diagnostics = [];
    for (const comment of comments) {
      const matched = PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(comment.text));
      if (!matched)
        continue;
      diagnostics.push({
        id: `placeholder-comments:${ctx.filePath}:${comment.line}:1`,
        tool: "fact-rules",
        filePath: ctx.filePath,
        line: comment.line,
        column: 1,
        severity: "warning",
        semantic: "warning",
        rule: "placeholder-comments",
        message: "Placeholder comment detected. Prefer comments that describe current behavior over future intent."
      });
    }
    return diagnostics;
  }
};

// dist/clients/dispatch/rules/unsafe-boundary.js
var IO_NAMESPACE_PREFIXES = [
  "db.",
  "prisma.",
  "knex.",
  "mongoose.",
  "sequelize.",
  "http.",
  "https.",
  "net.",
  "dns.",
  "redis.",
  "mongo.",
  "pg.",
  "mysql.",
  "s3.",
  "storage.",
  "bucket.",
  "fs.promises."
];
var IO_EXACT_CALLEES = /* @__PURE__ */ new Set([
  "fetch",
  "axios",
  "got",
  "request",
  "spawn",
  "exec",
  "execSync",
  "spawnSync",
  "readFile",
  "writeFile",
  "appendFile",
  "readdir",
  "mkdir",
  "unlink",
  "stat"
]);
var CC_THRESHOLD = 6;
function callsToBoundary(outgoingCalls) {
  for (const callee of outgoingCalls) {
    const lower = callee.toLowerCase();
    if (IO_EXACT_CALLEES.has(lower))
      return callee;
    if (IO_NAMESPACE_PREFIXES.some((p) => lower.startsWith(p)))
      return callee;
  }
  return void 0;
}
function hasCatchCoverage(fn, catches) {
  if (fn.outgoingCalls.some((c) => c === "resolve" || c === "reject"))
    return true;
  return catches.some((c) => {
    if (c.line < fn.line)
      return false;
    if (c.isEmpty)
      return false;
    if (c.hasRethrow || c.hasLogging || c.catchParam === null)
      return true;
    if (/\breturn\b/.test(c.bodyText))
      return true;
    if (c.catchHasFallbackAssignment)
      return true;
    return false;
  });
}
var unsafeBoundaryRule = {
  id: "unsafe-boundary",
  requires: ["file.functionSummaries", "file.tryCatchSummaries"],
  appliesTo(ctx) {
    return /\.tsx?$/.test(ctx.filePath);
  },
  evaluate(ctx, store) {
    const fns = store.getFileFact(ctx.filePath, "file.functionSummaries") ?? [];
    const catches = store.getFileFact(ctx.filePath, "file.tryCatchSummaries") ?? [];
    const diagnostics = [];
    for (const f of fns) {
      if (!f.isAsync)
        continue;
      if (f.isPassThroughWrapper)
        continue;
      if (f.cyclomaticComplexity < CC_THRESHOLD)
        continue;
      const boundaryCalle = callsToBoundary(f.outgoingCalls);
      if (!boundaryCalle)
        continue;
      if (hasCatchCoverage(f, catches))
        continue;
      diagnostics.push({
        id: `unsafe-boundary:${ctx.filePath}:${f.line}`,
        tool: "fact-rules",
        rule: "unsafe-boundary",
        filePath: ctx.filePath,
        line: f.line,
        column: f.column,
        severity: "warning",
        semantic: "warning",
        message: `'${f.name}' is async, calls '${boundaryCalle}', has complexity ${f.cyclomaticComplexity}, but no try/catch \u2014 unhandled rejection risk`
      });
    }
    return diagnostics;
  }
};

// dist/clients/dispatch/integration.js
registerProvider(fileContentProvider);
registerProvider(tryCatchFactProvider);
registerProvider(functionFactProvider);
registerProvider(commentFactProvider);
registerProvider(importFactProvider);
registerRule(errorObscuringRule);
registerRule(errorSwallowingRule);
registerRule(asyncNoiseRule);
registerRule(passThroughWrappersRule);
registerRule(placeholderCommentsRule);
registerRule(highComplexityRule);
registerRule(unsafeBoundaryRule);
registerRule(asyncUnnecessaryWrapperRule);
registerRule(missingErrorPropagationRule);
registerRule(highFanOutRule);
registerRule(highImportCouplingRule);
registerRule(corsWildcardRule);
registerRule(commentedCredentialsRule);
function applyProjectLensConfig(cwd) {
  return loadPiLensProjectConfig(cwd);
}
var sessionFacts = new FactStore("dispatch");
setFactStoreEvictionReporter((subject, axis, reason) => {
  if (axis === "pinned-over-budget") {
    recordDegradationOnce({
      kind: "fact-store-pinned-over-budget",
      subject,
      reason
    });
    return;
  }
  recordDegradationOnce({
    kind: "fact-store-capacity-eviction",
    subject: `${subject}:${axis}`,
    reason
  });
});
var sessionRunnerRegistry = new RunnerRegistry();
registerDefaultRunners(sessionRunnerRegistry);
var LSP_CAPABLE_KINDS = new Set(getLspCapableKinds());
var FACT_RULE_IDS = /* @__PURE__ */ new Set([
  "error-obscuring",
  "error-swallowing",
  "async-noise",
  "pass-through-wrappers",
  "placeholder-comments",
  "high-complexity",
  "unsafe-boundary",
  "async-unnecessary-wrapper",
  "missing-error-propagation",
  "high-fan-out",
  "commented-out-code",
  "duplicate-string-literal",
  "function-in-loop",
  "cors-wildcard",
  "dynamic-regexp",
  "max-switch-cases",
  "no-commented-credentials",
  "no-boolean-params",
  "high-import-coupling",
  "no-complex-conditionals"
]);
var sessionSlopRuleCounts = /* @__PURE__ */ new Map();
var sessionSlopDiagnosticCount = 0;
var sessionWrittenLineCount = 0;
var astGrepWarnDebounceTimers = /* @__PURE__ */ new Map();
var AST_GREP_WARN_DEBOUNCE_MS = 2e3;
function scheduleAstGrepWarningScan(filePath, cwd, pi, logContext) {
  const existing = astGrepWarnDebounceTimers.get(filePath);
  if (existing)
    clearTimeout(existing);
  const timer = setTimeout(() => {
    astGrepWarnDebounceTimers.delete(filePath);
    void runAstGrepWarningScan(filePath, cwd, pi, logContext).catch(() => {
    });
  }, AST_GREP_WARN_DEBOUNCE_MS);
  astGrepWarnDebounceTimers.set(filePath, timer);
}
async function runAstGrepWarningScan(filePath, cwd, pi, logContext, facts = sessionFacts) {
  const ctx = createDispatchContext(filePath, cwd, pi, facts, false);
  if (ctx.kind !== "jsts")
    return;
  facts.beginDispatchFor(ctx.filePath);
  try {
    const group = {
      mode: "all",
      runnerIds: ["ast-grep"],
      filterKinds: ["jsts"]
    };
    await runProviders(ctx);
    const result = await dispatchForFile(ctx, [group], sessionRunnerRegistry);
    if (result.diagnostics.length === 0)
      return;
    const logger = getDiagnosticLogger();
    for (const d of result.diagnostics) {
      logger.logCaught(d, logContext, false);
    }
  } finally {
    facts.endDispatchFor(ctx.filePath);
  }
}
function resetSessionSlopScore() {
  sessionSlopRuleCounts.clear();
  sessionSlopDiagnosticCount = 0;
  sessionWrittenLineCount = 0;
}
function detectFactRuleId(diagnostic) {
  if (diagnostic.rule && FACT_RULE_IDS.has(diagnostic.rule)) {
    return diagnostic.rule;
  }
  if (diagnostic.tool && FACT_RULE_IDS.has(diagnostic.tool)) {
    return diagnostic.tool;
  }
  if (diagnostic.id) {
    const prefix = diagnostic.id.split(":", 1)[0];
    if (FACT_RULE_IDS.has(prefix)) {
      return prefix;
    }
  }
  return void 0;
}
function trackSessionSlopStats(ctx, diagnostics) {
  const lineCount = ctx.facts.getFileFact(ctx.filePath, "file.lineCount");
  if (typeof lineCount === "number" && Number.isFinite(lineCount) && lineCount > 0) {
    sessionWrittenLineCount += lineCount;
  }
  for (const diagnostic of diagnostics) {
    const ruleId = detectFactRuleId(diagnostic);
    if (!ruleId)
      continue;
    sessionSlopDiagnosticCount += 1;
    sessionSlopRuleCounts.set(ruleId, (sessionSlopRuleCounts.get(ruleId) ?? 0) + 1);
  }
}
var SPOTBUGS_SUPPORTED_KINDS = /* @__PURE__ */ new Set(["java", "kotlin"]);
function withSpotbugsGroup(kind, groups, ctx) {
  if (!SPOTBUGS_SUPPORTED_KINDS.has(kind))
    return groups;
  if (!ctx.pi.getFlag("lens-spotbugs"))
    return groups;
  if (!hasJavaBuildDescriptor(ctx.cwd) || !findCompiledClassesDir(ctx.cwd)) {
    return groups;
  }
  if (groups.some((group) => group.runnerIds.includes("spotbugs")))
    return groups;
  return [
    ...groups,
    {
      mode: "all",
      runnerIds: ["spotbugs"],
      filterKinds: [kind],
      semantic: "warning"
    }
  ];
}
function withPrimaryPolicyGroup(kind, groups, pi) {
  const lspEnabled = !pi.getFlag("no-lsp");
  const normalizedGroups = lspEnabled ? groups : groups.map((group) => {
    const runnerIds = group.runnerIds.filter((id) => id !== "lsp");
    if (runnerIds.length === 0)
      return null;
    return {
      ...group,
      runnerIds
    };
  }).filter((group) => group !== null);
  const primary2 = getPrimaryDispatchGroup(kind, lspEnabled);
  if (!primary2)
    return normalizedGroups;
  const alreadyHasPrimary = normalizedGroups.some((group) => {
    if (group.mode !== primary2.mode)
      return false;
    if (group.runnerIds.length !== primary2.runnerIds.length)
      return false;
    return group.runnerIds.every((id, index) => primary2.runnerIds[index] === id);
  });
  if (alreadyHasPrimary)
    return normalizedGroups;
  return [primary2, ...normalizedGroups];
}
function getDispatchGroupsForKind(kind, pi) {
  const plan = TOOL_PLANS[kind];
  if (!plan) {
    const lspEnabled = !pi.getFlag("no-lsp");
    const policyGroup = getPrimaryDispatchGroup(kind, lspEnabled);
    if (policyGroup)
      return [policyGroup];
    if (lspEnabled && LSP_CAPABLE_KINDS.has(kind)) {
      return [
        { mode: "all", runnerIds: ["lsp"], filterKinds: [kind] }
      ];
    }
    return [];
  }
  return withPrimaryPolicyGroup(kind, plan.groups, pi);
}
function resetDispatchBaselines(cwd) {
  if (cwd)
    applyProjectLensConfig(cwd);
  resetAstGrepUnsupportedLanguageLog();
  resetAstGrepNapiLoadState();
  resetTreeSitterClientLoadState();
  sessionFacts.clearAll();
  resetSessionSlopScore();
  clearCoverageNoticeState();
  clearReviewGraphWorkspaceCache();
  clearReverseDepsIndexCache();
  clearModuleGraphCache();
  recentlyCleanNeighborCache.clear();
  primaryFilesThisTurn.clear();
  cascadeSessionStats = {
    runs: 0,
    diagnosticsSurfaced: 0,
    coldSnapshotTouches: 0
  };
  for (const timer of astGrepWarnDebounceTimers.values())
    clearTimeout(timer);
  astGrepWarnDebounceTimers.clear();
}
var cascadeSessionStats = {
  runs: 0,
  diagnosticsSurfaced: 0,
  coldSnapshotTouches: 0
};
var recentlyCleanNeighborCache = /* @__PURE__ */ new Map();
var primaryFilesThisTurn = /* @__PURE__ */ new Set();
var MAX_PER_FILE = RUNTIME_CONFIG.pipeline.cascadeMaxDiagnosticsPerFile;
var MAX_FILES = RUNTIME_CONFIG.pipeline.cascadeMaxFiles;
var MAX_POLICY_INPUT_PER_FILE = MAX_PER_FILE * 4;
var reverseDepsIndexCache = /* @__PURE__ */ new Map();
var REVERSE_DEPS_IDLE_EVICT_MS_DEFAULT = 20 * 6e4;
function deleteReverseDepsEntry(key2) {
  const entry = reverseDepsIndexCache.get(key2);
  if (entry?.idleTimer !== void 0)
    clearTimeout(entry.idleTimer);
  if (entry)
    entry.idleTimer = void 0;
  reverseDepsIndexCache.delete(key2);
}
function clearReverseDepsIndexCache() {
  for (const key2 of reverseDepsIndexCache.keys())
    deleteReverseDepsEntry(key2);
}
var CASCADE_TRANSITIVE_DEPTH = Math.max(1, Number.parseInt(process.env.PI_LENS_CASCADE_TRANSITIVE_DEPTH ?? "2", 10) || 2);
var CASCADE_GRAPH_KINDS = /* @__PURE__ */ new Set([
  "jsts",
  "python",
  "go",
  "rust",
  "ruby",
  "cxx"
]);
async function dispatchLintWithResult(filePath, cwd, pi, modifiedRanges, logContext, options) {
  const ctx = createDispatchContext(filePath, cwd, pi, sessionFacts, options?.blockingOnly ?? true, modifiedRanges, options?.projectRoot, options?.writeIndex, options?.telemetryModel, options?.telemetryProvider, options?.sessionGeneration, options?.sessionId, options?.analysisRootMode);
  sessionFacts.clearFileFactsFor(ctx.filePath);
  try {
    const kind = ctx.kind;
    if (!kind) {
      return {
        diagnostics: [],
        blockers: [],
        warnings: [],
        baselineWarningCount: 0,
        fixed: [],
        resolvedCount: 0,
        output: "",
        blockerOutput: "",
        hasBlockers: false
      };
    }
    const groups = withSpotbugsGroup(kind, getDispatchGroupsForKind(kind, pi), ctx);
    if (groups.length === 0) {
      return {
        diagnostics: [],
        blockers: [],
        warnings: [],
        baselineWarningCount: 0,
        fixed: [],
        resolvedCount: 0,
        output: "",
        blockerOutput: "",
        hasBlockers: false
      };
    }
    await runProviders(ctx);
    const result = await dispatchForFile(
      ctx,
      groups,
      sessionRunnerRegistry,
      void 0,
      // exactOptionalPropertyTypes: omit the key rather than pass
      // `undefined`, which the target option type rejects (#3791).
      {
        ...options?.dedupeCoverageNotice !== void 0 && {
          dedupeCoverageNotice: options.dedupeCoverageNotice
        }
      }
    );
    trackSessionSlopStats(ctx, result.diagnostics);
    if (kind === "jsts" && logContext) {
      scheduleAstGrepWarningScan(filePath, cwd, pi, logContext);
    }
    return result;
  } finally {
    sessionFacts.endDispatchFor(ctx.filePath);
  }
}
async function getAvailableRunners(filePath) {
  const kind = detectFileKind(filePath);
  if (!kind)
    return [];
  const normalizedPath = filePath.replace(/\\/g, "/");
  const pathForFilter = normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`;
  const runners = sessionRunnerRegistry.getForKind(kind, pathForFilter);
  return runners.map((r) => r.id);
}

// dist/clients/mcp/host-shim.js
function createMcpHost(overrides, projectRoot = process.cwd()) {
  const config = loadPiLensGlobalConfig();
  const projectConfig = loadPiLensProjectConfig(projectRoot);
  return {
    getFlag(name, filePath) {
      if (overrides && Object.hasOwn(overrides, name)) {
        return overrides[name];
      }
      return resolvePiLensFlag(name, void 0, config, projectConfig, filePath, projectRoot);
    }
  };
}

// dist/clients/mcp/analyze.js
var warmGraphFacts = new FactStore("mcp-analyze");
var DEFAULT_WORD_INDEX_IDLE_EVICT_MS = 20 * 6e4;
var DEFAULT_WORD_INDEX_MAX_WARM_ROOTS = 8;
var warmWordIndexes = new PathKeyedMap(normalizeMapKey);
function positiveEnv(name, fallback) {
  const parsed = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}
function idleEvictMs() {
  return positiveEnv("PI_LENS_WORD_INDEX_IDLE_EVICT_MS", DEFAULT_WORD_INDEX_IDLE_EVICT_MS);
}
function maxWarmRoots() {
  return positiveEnv("PI_LENS_WORD_INDEX_MAX_WARM_ROOTS", DEFAULT_WORD_INDEX_MAX_WARM_ROOTS);
}
function clearWarmWordIndexTimer(entry) {
  if (entry.timer)
    clearTimeout(entry.timer);
  entry.timer = void 0;
}
function evictWarmWordIndex(key2, entry, reason) {
  if (entry.leases > 0 || warmWordIndexes.get(key2) !== entry)
    return false;
  clearWarmWordIndexTimer(entry);
  warmWordIndexes.delete(key2);
  logWordIndex({
    phase: "warm_cache_evicted",
    cwd: key2,
    trigger: "mcp",
    reason
  });
  return true;
}
function scheduleWarmWordIndexIdleEviction(key2, entry) {
  clearWarmWordIndexTimer(entry);
  const generation = ++entry.generation;
  const timer = setTimeout(() => {
    entry.timer = void 0;
    if (warmWordIndexes.get(key2) !== entry || entry.generation !== generation)
      return;
    if (!evictWarmWordIndex(key2, entry, "idle"))
      scheduleWarmWordIndexIdleEviction(key2, entry);
  }, idleEvictMs());
  timer.unref?.();
  entry.timer = timer;
}
function enforceWarmWordIndexLruCap() {
  while (warmWordIndexes.size > maxWarmRoots()) {
    const victim = [...warmWordIndexes.entries()].filter(([, entry]) => entry.leases === 0).sort(([, a], [, b]) => a.lastUsedAt - b.lastUsedAt)[0];
    if (!victim || !evictWarmWordIndex(victim[0], victim[1], "lru"))
      return;
  }
}
function acquireWarmWordIndex(cwd) {
  const key2 = path50.resolve(cwd);
  let entry = warmWordIndexes.get(key2);
  if (!entry) {
    const snapshot = loadProjectSnapshot(key2);
    const index = deserializeWordIndex(snapshot?.wordIndex) ?? void 0;
    entry = {
      index: index?.forward ? index : void 0,
      timer: void 0,
      leases: 0,
      lastUsedAt: Date.now(),
      generation: 0
    };
    warmWordIndexes.set(key2, entry);
  }
  entry.leases++;
  entry.lastUsedAt = Date.now();
  scheduleWarmWordIndexIdleEviction(key2, entry);
  enforceWarmWordIndexLruCap();
  let released = false;
  return {
    index: entry.index,
    release() {
      if (released)
        return;
      released = true;
      entry.leases = Math.max(0, entry.leases - 1);
      entry.lastUsedAt = Date.now();
      if (warmWordIndexes.get(key2) === entry) {
        scheduleWarmWordIndexIdleEviction(key2, entry);
        enforceWarmWordIndexLruCap();
      }
    }
  };
}
function _resetWarmWordIndexCacheForTests() {
  for (const entry of warmWordIndexes.values())
    clearWarmWordIndexTimer(entry);
  warmWordIndexes.clear();
}
function _getWarmWordIndexCacheStateForTests() {
  return {
    size: warmWordIndexes.size,
    keys: [...warmWordIndexes.keys()],
    timers: [...warmWordIndexes.values()].flatMap((entry) => entry.timer ? [entry.timer] : [])
  };
}
var WARMUP_CLIENT_WAIT_MS = 1e4;
var WARMUP_DIAGNOSTICS_WAIT_MS = 6e3;
function summarizeWarningTiers(warnings) {
  let advisories = 0;
  for (const w of warnings) {
    if (classifyDiagnosticTier(w) === "advisory")
      advisories++;
  }
  return { warnings: warnings.length - advisories, advisories };
}
function listDiagnosticsForCounts(result) {
  const listedIds = new Set(result.diagnostics.map((d) => d.id));
  return [
    ...result.diagnostics,
    ...result.warnings.filter((w) => !listedIds.has(w.id))
  ];
}
function toMcpDiagnostic(diagnostic) {
  return {
    line: diagnostic.line,
    column: diagnostic.column,
    severity: diagnostic.severity,
    semantic: diagnostic.semantic,
    tool: diagnostic.tool,
    rule: diagnostic.rule,
    code: diagnostic.code,
    message: diagnostic.message,
    fixable: diagnostic.fixable,
    fixSuggestion: diagnostic.fixSuggestion
  };
}
async function warmLspForFile(absPath, host) {
  if (host.getFlag("no-lsp"))
    return;
  const lspService = getLSPService();
  if (!lspService.supportsLSP(absPath))
    return;
  let content;
  try {
    content = fs19.readFileSync(absPath, "utf8");
  } catch {
    return;
  }
  try {
    await lspService.touchFile(absPath, content, {
      diagnostics: "document",
      collectDiagnostics: true,
      clientScope: "primary",
      maxClientWaitMs: WARMUP_CLIENT_WAIT_MS,
      maxDiagnosticsWaitMs: WARMUP_DIAGNOSTICS_WAIT_MS,
      source: "mcp-warmup"
    });
  } catch {
  }
}
async function analyzeFile(filePath, cwd, options = {}) {
  const absPath = path50.isAbsolute(filePath) ? filePath : path50.resolve(cwd, filePath);
  const host = createMcpHost({ "no-delta": true, ...options.flags }, cwd);
  const observedAt = Date.now();
  if (options.warmLsp !== false) {
    await warmLspForFile(absPath, host);
  }
  const start = Date.now();
  const result = await dispatchLintWithResult(absPath, cwd, host, void 0, void 0, {
    blockingOnly: options.blockingOnly ?? false,
    analysisRootMode: resolveAnalysisRoot(absPath, cwd),
    // #3791: this is a pull surface. Each call is an independent question,
    // so the synthetic coverage notice must come back on every call rather
    // than being latched once per session by the dispatcher — otherwise a
    // second pull of an unanalysable file reads as a false clean. The pi
    // push surface keeps its once-per-session latch (the default).
    dedupeCoverageNotice: false
  });
  const durationMs = Date.now() - start;
  if (options.record !== false) {
    recordDiagnostics(normalizeMapKey(absPath), result.diagnostics, void 0, observedAt);
    if (result.diagnostics.length > 0) {
      getDiagnosticTracker().trackShown(result.diagnostics);
    }
  }
  if (options.registerTurnState) {
    try {
      const lineCount = fs19.readFileSync(absPath, "utf8").split("\n").length;
      new CacheManager().addModifiedRange(absPath, { start: 1, end: lineCount }, true, cwd, options.ownerId ?? MCP_TURN_STATE_OWNER_ID, "mcp");
    } catch {
    }
  }
  if (options.updateGraph && !result.hasBlockers) {
    const fileKind = detectFileKind(absPath);
    if (fileKind && CASCADE_GRAPH_KINDS.has(fileKind)) {
      try {
        await buildOrUpdateGraph2(cwd, [absPath], warmGraphFacts);
      } catch {
      }
    }
    const warmLease = acquireWarmWordIndex(cwd);
    const warmIndex = warmLease.index;
    try {
      if (warmIndex) {
        try {
          const content = fs19.readFileSync(absPath, "utf8");
          const byteLength = Buffer.byteLength(content, "utf-8");
          if (byteLength > WORD_INDEX_MAX_BYTES) {
            await removeWordIndexDocumentAsync(warmIndex, absPath);
          } else {
            await updateWordIndexDocumentForEdit(warmIndex, {
              path: absPath,
              content
            });
          }
          scheduleWordIndexPersist(cwd, warmIndex);
        } catch {
        }
      }
    } finally {
      warmLease.release();
    }
  }
  const latencyReport = result.latencyReport;
  const listedDiagnostics = listDiagnosticsForCounts(result);
  const lspRunner2 = latencyReport?.runners.find((runner) => runner.runnerId === "lsp");
  const lsp = lspRunner2 ? {
    // `deferred` means the runner entered the LSP path but its auxiliary
    // coverage is delivered later, so it still counts as ran here. The
    // status remains available to surfaces that need the coverage detail.
    ran: lspRunner2.status !== "skipped" && lspRunner2.status !== "when_skipped" && lspRunner2.status !== "test_file_skipped",
    status: lspRunner2.status,
    ...lspRunner2.failureKind !== void 0 && {
      failureKind: lspRunner2.failureKind
    },
    diagnosticCount: lspRunner2.diagnosticCount,
    durationMs: lspRunner2.durationMs
  } : void 0;
  return {
    filePath: absPath,
    cwd,
    fileKind: latencyReport?.fileKind,
    durationMs,
    hasBlockers: result.hasBlockers,
    counts: {
      diagnostics: listedDiagnostics.length,
      blockers: result.blockers.length,
      // #2420: `result.warnings` is the dispatch warnings bucket
      // (`semantic:"warning"|"none"`), which still carries `hint`/`info`-tier
      // findings folded in by the runner's severity→semantic map. Project
      // them out through the shared tier policy so the model sees real
      // warnings and advisories separately.
      ...summarizeWarningTiers(result.warnings),
      fixed: result.fixed.length
    },
    lsp,
    diagnostics: listedDiagnostics.map(toMcpDiagnostic),
    latency: latencyReport ? {
      totalDurationMs: latencyReport.totalDurationMs,
      stoppedEarly: latencyReport.stoppedEarly,
      runners: latencyReport.runners.map((runner) => ({
        runnerId: runner.runnerId,
        durationMs: runner.durationMs,
        status: runner.status,
        diagnosticCount: runner.diagnosticCount,
        failureKind: runner.failureKind
      }))
    } : void 0
  };
}

export {
  MCP_TURN_STATE_OWNER_ID,
  CacheManager,
  getDiagnosticTracker,
  normalizeRuleId,
  getToolPlan,
  resetObservedRunnerLatency,
  requeueRunnerFindings,
  drainPendingRunnerFindings,
  dropStaleRunnerFindings,
  resetPendingRunnerFindings,
  pendingRunnerFindingsSize,
  applyRulePolicy,
  DELTA_UNUSED_PROMOTION_NOTE,
  formatDiagnostics,
  createDispatchContext,
  getLatencyReports,
  cascadeSettleWaitMs,
  convertLspDiagnostics,
  applyFindingPolicy,
  loadProjectRulePolicyMap,
  inlineBlockerIdentities,
  applyPushedFindingPolicy,
  applyLspFindingPolicy,
  filterFindingsByDisposition,
  markUnreconciledFindings,
  formatCacheAgeLabel,
  admitsProjectWideFindings,
  cascadeCarrySuffix,
  logCascade,
  resetCascadeTierSessionState,
  loadSg,
  canHandle,
  getLang,
  evaluateAstGrepRules,
  runProviders,
  evaluateRules,
  demoteInferredProjectDiagnostics,
  demoteInferredProjectSweepResults,
  resetPsScriptAnalyzerAvailability,
  resetDispatchBaselines,
  getAvailableRunners,
  createMcpHost,
  acquireWarmWordIndex,
  _resetWarmWordIndexCacheForTests,
  _getWarmWordIndexCacheStateForTests,
  summarizeWarningTiers,
  analyzeFile
};
