import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  deserializeWordIndex,
  recordPersistedWordIndexWireBytes,
  serializeWordIndex
} from "./chunk-SAEFPSB6.js";
import {
  fingerprintProjectSnapshotJson
} from "./chunk-2BEMIWEW.js";
import {
  getProjectDataDir,
  isStaleStageFile,
  withGenerationLockSync
} from "./chunk-C34ZXZ7O.js";
import {
  writeFileAtomic
} from "./chunk-2EECBNC5.js";
import {
  incrementDegradationCount
} from "./chunk-JAU72XNY.js";
import {
  logLatency
} from "./chunk-QQNQ7SJW.js";
import {
  BoundedFifoMap
} from "./chunk-ABBOA7UD.js";
import {
  normalizeMapKey
} from "./chunk-N2H3ZPZY.js";

// dist/clients/project-snapshot.js
import * as fs3 from "node:fs";
import * as path2 from "node:path";
import { fileURLToPath } from "node:url";
import { Worker } from "node:worker_threads";
import { gunzipSync, gzipSync } from "node:zlib";

// dist/clients/json-cache-read.js
import * as fs from "node:fs";
import { promises as fsPromises } from "node:fs";
function readJsonCache(path3, validate, onError) {
  try {
    const parsed = JSON.parse(fs.readFileSync(path3, "utf-8"));
    return validate(parsed);
  } catch (err) {
    try {
      onError?.(err);
    } catch {
    }
    return void 0;
  }
}
async function readJsonCacheAsync(path3, validate, onError) {
  try {
    const raw = await fsPromises.readFile(path3, "utf-8");
    const parsed = JSON.parse(raw);
    return validate(parsed);
  } catch (err) {
    try {
      onError?.(err);
    } catch {
    }
    return void 0;
  }
}

// dist/clients/project-conventions.js
import * as fs2 from "node:fs";
import * as path from "node:path";
function readPackageJson(cwd) {
  const pkgPath = path.join(cwd, "package.json");
  try {
    const raw = fs2.readFileSync(pkgPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return void 0;
  }
}
function hasDep(pkg, name) {
  if (!pkg)
    return false;
  return Boolean(pkg.dependencies?.[name] ?? pkg.devDependencies?.[name] ?? pkg.peerDependencies?.[name]);
}
function fileExists(cwd, ...segments) {
  try {
    return fs2.existsSync(path.join(cwd, ...segments));
  } catch {
    return false;
  }
}
function dirExists(cwd, ...segments) {
  try {
    const target = path.join(cwd, ...segments);
    const stat = fs2.statSync(target);
    return stat.isDirectory();
  } catch {
    return false;
  }
}
function detectReact(_cwd, pkg) {
  const signals = [];
  if (hasDep(pkg, "react"))
    signals.push("package.json:dependencies.react");
  if (hasDep(pkg, "react-dom"))
    signals.push("package.json:dependencies.react-dom");
  if (hasDep(pkg, "@types/react"))
    signals.push("package.json:devDependencies.@types/react");
  if (signals.length === 0)
    return void 0;
  const confidence = hasDep(pkg, "react-dom") ? "high" : "medium";
  return { id: "react", confidence, signals };
}
function detectNext(cwd, pkg) {
  const signals = [];
  if (hasDep(pkg, "next"))
    signals.push("package.json:dependencies.next");
  for (const candidate of [
    "next.config.js",
    "next.config.mjs",
    "next.config.ts"
  ]) {
    if (fileExists(cwd, candidate))
      signals.push(candidate);
  }
  if (dirExists(cwd, "src", "pages"))
    signals.push("src/pages/");
  else if (dirExists(cwd, "pages"))
    signals.push("pages/");
  if (dirExists(cwd, "src", "app"))
    signals.push("src/app/");
  else if (dirExists(cwd, "app"))
    signals.push("app/");
  if (signals.length === 0)
    return void 0;
  const confidence = hasDep(pkg, "next") && signals.some((s) => s.startsWith("next.config.")) ? "high" : hasDep(pkg, "next") ? "medium" : "low";
  return { id: "next", confidence, signals };
}
function detectVite(cwd, pkg) {
  const signals = [];
  if (hasDep(pkg, "vite"))
    signals.push("package.json:devDependencies.vite");
  for (const candidate of [
    "vite.config.ts",
    "vite.config.js",
    "vite.config.mjs",
    "vite.config.mts"
  ]) {
    if (fileExists(cwd, candidate))
      signals.push(candidate);
  }
  if (signals.length === 0)
    return void 0;
  const confidence = hasDep(pkg, "vite") && signals.some((s) => s.startsWith("vite.config.")) ? "high" : "medium";
  return { id: "vite", confidence, signals };
}
function detectVitest(cwd, pkg) {
  const signals = [];
  if (hasDep(pkg, "vitest"))
    signals.push("package.json:devDependencies.vitest");
  for (const candidate of [
    "vitest.config.ts",
    "vitest.config.js",
    "vitest.config.mjs",
    "vitest.config.mts"
  ]) {
    if (fileExists(cwd, candidate))
      signals.push(candidate);
  }
  if (signals.length === 0)
    return void 0;
  const confidence = hasDep(pkg, "vitest") ? "high" : "medium";
  return { id: "vitest", confidence, signals };
}
var AGENT_DOC_CANDIDATES = [
  "AGENTS.md",
  "CLAUDE.md",
  ".cursorrules"
];
function summarizeAgentDocs(cwd) {
  const docs = [];
  for (const candidate of AGENT_DOC_CANDIDATES) {
    const abs = path.join(cwd, candidate);
    try {
      const raw = fs2.readFileSync(abs, "utf-8");
      const lineCount = raw.split(/\r?\n/).length;
      docs.push({ filePath: candidate, lineCount });
    } catch {
    }
  }
  return docs;
}
function detectProjectConventions(cwd) {
  let cwdExists = false;
  try {
    cwdExists = fs2.statSync(cwd).isDirectory();
  } catch {
    cwdExists = false;
  }
  if (!cwdExists) {
    return { frameworks: [], testRunners: [], buildTools: [], agentDocs: [] };
  }
  const pkg = readPackageJson(cwd);
  const detectors = [detectReact, detectNext, detectVite, detectVitest];
  const frameworks = [];
  for (const detector of detectors) {
    const detection = detector(cwd, pkg);
    if (detection)
      frameworks.push(detection);
  }
  const testRunners = [];
  if (frameworks.some((f) => f.id === "vitest"))
    testRunners.push("vitest");
  const buildTools = [];
  if (frameworks.some((f) => f.id === "vite"))
    buildTools.push("vite");
  if (frameworks.some((f) => f.id === "next"))
    buildTools.push("next");
  const agentDocs = summarizeAgentDocs(cwd);
  return { frameworks, testRunners, buildTools, agentDocs };
}

// dist/clients/persist-worker-stats.js
async function readWorkerHeapStatistics(worker) {
  const stats = await worker.getHeapStatistics();
  return {
    heapUsedBytes: stats.used_heap_size,
    heapTotalBytes: stats.total_heap_size,
    heapSizeLimitBytes: stats.heap_size_limit
  };
}

// dist/clients/project-snapshot.js
var PROJECT_SNAPSHOT_VERSION = 2;
function parseSequenceIndex(value) {
  if (!value || typeof value !== "object")
    return void 0;
  const index = value;
  if (typeof index.projectSeq !== "number")
    return void 0;
  if (!Array.isArray(index.fileSeqByPath))
    return void 0;
  const fileSeqByPath = index.fileSeqByPath.filter((entry) => Array.isArray(entry) && typeof entry[0] === "string" && typeof entry[1] === "number");
  return { projectSeq: index.projectSeq, fileSeqByPath };
}
function getProjectSnapshotPath(cwd) {
  return path2.join(getProjectDataDir(cwd), "cache", "project-snapshot.json.gz");
}
function getProjectSnapshotLegacyPath(cwd) {
  return path2.join(getProjectDataDir(cwd), "cache", "project-snapshot.json");
}
function getProjectSnapshotMetaPath(cwd) {
  return path2.join(getProjectDataDir(cwd), "cache", "project-snapshot.meta.json");
}
var INCOMPLETE_STORED_SEQ = -2;
function storedSeq(snapshot) {
  return snapshot.incomplete ? { seq: INCOMPLETE_STORED_SEQ, incompleteSeq: snapshot.seq } : { seq: snapshot.seq };
}
function storedSnapshot(snapshot) {
  if (!snapshot.incomplete)
    return snapshot;
  const stored = { ...snapshot };
  delete stored.incomplete;
  return { ...stored, ...storedSeq(snapshot) };
}
function readStoredSeq(stored) {
  if (typeof stored.incompleteSeq === "number") {
    return { seq: stored.incompleteSeq, incomplete: true };
  }
  return typeof stored.seq === "number" ? { seq: stored.seq } : null;
}
function isProjectSnapshotFresh(snapshot, currentProjectSeq, unlockedThrough = 0) {
  return !!snapshot && snapshot.version === PROJECT_SNAPSHOT_VERSION && !snapshot.incomplete && (snapshot.logEntries ?? 0) >= unlockedThrough && snapshot.seq === currentProjectSeq;
}
function parseSnapshot(value) {
  if (!value || typeof value !== "object")
    return null;
  const snapshot = value;
  if (snapshot.version !== PROJECT_SNAPSHOT_VERSION)
    return null;
  if (typeof snapshot.projectRoot !== "string")
    return null;
  if (typeof snapshot.generatedAt !== "string")
    return null;
  const stored = readStoredSeq(value);
  if (!stored)
    return null;
  if (!Array.isArray(snapshot.cachedExports))
    return null;
  return {
    version: PROJECT_SNAPSHOT_VERSION,
    projectRoot: snapshot.projectRoot,
    generatedAt: snapshot.generatedAt,
    seq: stored.seq,
    files: snapshot.files ?? {},
    symbols: snapshot.symbols ?? {},
    reverseDeps: snapshot.reverseDeps ?? {},
    cachedExports: snapshot.cachedExports.filter((entry) => Array.isArray(entry) && typeof entry[0] === "string" && typeof entry[1] === "string"),
    ...stored.incomplete ? { incomplete: true } : {},
    logEntries: typeof snapshot.logEntries === "number" ? snapshot.logEntries : void 0,
    sequenceIndex: parseSequenceIndex(snapshot.sequenceIndex),
    wordIndex: snapshot.wordIndex,
    projectRulesScan: snapshot.projectRulesScan,
    startupScan: snapshot.startupScan,
    languageProfile: snapshot.languageProfile,
    conventions: snapshot.conventions
  };
}
function parseSnapshotMeta(value) {
  if (!value || typeof value !== "object")
    return null;
  const meta = value;
  if (typeof meta.version !== "number")
    return null;
  const stored = readStoredSeq(value);
  if (!stored)
    return null;
  return {
    timestamp: typeof meta.timestamp === "string" ? meta.timestamp : "",
    version: meta.version,
    seq: stored.seq,
    fingerprint: typeof meta.fingerprint === "string" && /^[a-f0-9]{64}$/.test(meta.fingerprint) ? meta.fingerprint : void 0,
    gzBytes: typeof meta.gzBytes === "number" && Number.isInteger(meta.gzBytes) && meta.gzBytes > 0 ? meta.gzBytes : void 0,
    ...stored.incomplete ? { incomplete: true } : {},
    logEntries: typeof meta.logEntries === "number" ? meta.logEntries : void 0,
    sequenceIndex: parseSequenceIndex(meta.sequenceIndex)
  };
}
function readProjectSnapshotMeta(cwd) {
  const meta = readJsonCache(getProjectSnapshotMetaPath(cwd), (parsed) => parseSnapshotMeta(parsed) ?? void 0);
  return meta ?? null;
}
function isProjectSnapshotMetaStale(meta, currentProjectSeq, unlockedThrough = 0) {
  return meta.version !== PROJECT_SNAPSHOT_VERSION || meta.incomplete === true || (meta.logEntries ?? 0) < unlockedThrough || meta.seq !== currentProjectSeq;
}
var SNAPSHOT_PARSE_CACHE_MAX = 4;
var SNAPSHOT_PARSE_CACHE_MAX_BYTES = 24 * 1024 * 1024;
var snapshotParseCache = new BoundedFifoMap(SNAPSHOT_PARSE_CACHE_MAX);
function withoutWordIndex(snapshot) {
  if (!snapshot?.wordIndex)
    return snapshot;
  const { wordIndex: _releasedPostings, ...stripped } = snapshot;
  return stripped;
}
function cacheParsedSnapshot(snapshotPath, entry) {
  snapshotParseCache.delete(snapshotPath);
  snapshotParseCache.set(snapshotPath, entry);
}
var authoritativeSnapshots = /* @__PURE__ */ new Map();
var PROJECT_SNAPSHOT_MAX_WARM_ROOTS = 8;
var PROJECT_SNAPSHOT_IDLE_EVICT_MS_DEFAULT = 20 * 6e4;
function projectSnapshotIdleEvictMs() {
  const value = Number.parseInt(process.env.PI_LENS_PROJECT_SNAPSHOT_IDLE_EVICT_MS ?? "", 10);
  return Number.isSafeInteger(value) && value > 0 ? value : PROJECT_SNAPSHOT_IDLE_EVICT_MS_DEFAULT;
}
function clearAuthoritativeSnapshotTimer(entry) {
  if (entry.idleTimer)
    clearTimeout(entry.idleTimer);
  entry.idleTimer = void 0;
}
function deleteAuthoritativeSnapshot(key) {
  const entry = authoritativeSnapshots.get(key);
  if (entry)
    clearAuthoritativeSnapshotTimer(entry);
  authoritativeSnapshots.delete(key);
}
function scheduleAuthoritativeSnapshotEviction(key, entry) {
  clearAuthoritativeSnapshotTimer(entry);
  const generation = entry.lastUsedAt;
  entry.idleTimer = setTimeout(() => {
    entry.idleTimer = void 0;
    if (authoritativeSnapshots.get(key) !== entry || entry.lastUsedAt !== generation)
      return;
    deleteAuthoritativeSnapshot(key);
  }, projectSnapshotIdleEvictMs());
  entry.idleTimer.unref?.();
}
function touchAuthoritativeSnapshot(key, entry) {
  entry.lastUsedAt = Date.now();
  scheduleAuthoritativeSnapshotEviction(key, entry);
}
function enforceAuthoritativeSnapshotCap() {
  while (authoritativeSnapshots.size > PROJECT_SNAPSHOT_MAX_WARM_ROOTS) {
    const victim = [...authoritativeSnapshots.entries()].sort(([, a], [, b]) => a.lastUsedAt - b.lastUsedAt)[0];
    if (!victim)
      return;
    clearAuthoritativeSnapshotTimer(victim[1]);
    deleteAuthoritativeSnapshot(victim[0]);
  }
}
function _getAuthoritativeSnapshotCacheKeysForTests() {
  return [...authoritativeSnapshots.entries()].sort(([, a], [, b]) => a.lastUsedAt - b.lastUsedAt).map(([key]) => key);
}
function _resetProjectSnapshotParseCacheForTests() {
  snapshotParseCache.clear();
  for (const entry of authoritativeSnapshots.values())
    clearAuthoritativeSnapshotTimer(entry);
  authoritativeSnapshots.clear();
}
function _projectSnapshotParseCacheRetainsWordIndexForTests() {
  return [...snapshotParseCache.values()].some((entry) => entry.snapshot?.wordIndex !== void 0);
}
function resolveSnapshotBodyPath(cwd) {
  const gzPath = getProjectSnapshotPath(cwd);
  try {
    const stat = fs3.statSync(gzPath);
    return { path: gzPath, gz: true, mtimeMs: stat.mtimeMs, size: stat.size };
  } catch {
  }
  const legacyPath = getProjectSnapshotLegacyPath(cwd);
  try {
    const stat = fs3.statSync(legacyPath);
    return {
      path: legacyPath,
      gz: false,
      mtimeMs: stat.mtimeMs,
      size: stat.size
    };
  } catch {
    return null;
  }
}
var _snapshotBodyReadCountForTests = 0;
function getSnapshotBodyReadCountForTests() {
  return _snapshotBodyReadCountForTests;
}
function resetSnapshotBodyReadCountForTests() {
  _snapshotBodyReadCountForTests = 0;
}
function readSnapshotBody(bodyPath, gz) {
  _snapshotBodyReadCountForTests++;
  if (!gz) {
    const snapshot = readJsonCache(bodyPath, (parsed) => parseSnapshot(parsed) ?? void 0) ?? null;
    let rawBytes = 0;
    try {
      rawBytes = fs3.statSync(bodyPath).size;
    } catch {
    }
    return { snapshot, rawBytes };
  }
  try {
    const json = gunzipSync(fs3.readFileSync(bodyPath)).toString("utf-8");
    const snapshot = parseSnapshot(JSON.parse(json)) ?? null;
    return { snapshot, rawBytes: Buffer.byteLength(json) };
  } catch (err) {
    logLatency({
      type: "phase",
      phase: "project_snapshot_body_corrupt",
      filePath: bodyPath,
      durationMs: 0,
      metadata: { error: err instanceof Error ? err.message : String(err) }
    });
    return { snapshot: null, rawBytes: 0 };
  }
}
function skipJsonValue(text, start) {
  let i = start;
  while (i < text.length && /\s/.test(text[i]))
    i++;
  const ch = text[i];
  if (ch === '"') {
    i++;
    while (i < text.length) {
      if (text[i] === "\\") {
        i += 2;
        continue;
      }
      if (text[i] === '"') {
        i++;
        break;
      }
      i++;
    }
    return i;
  }
  if (ch === "{" || ch === "[") {
    const open = ch;
    const close = open === "{" ? "}" : "]";
    let depth = 0;
    let inString = false;
    for (; i < text.length; i++) {
      const c = text[i];
      if (inString) {
        if (c === "\\") {
          i++;
          continue;
        }
        if (c === '"')
          inString = false;
        continue;
      }
      if (c === '"') {
        inString = true;
        continue;
      }
      if (c === open)
        depth++;
      else if (c === close) {
        depth--;
        if (depth === 0) {
          i++;
          break;
        }
      }
    }
    return i;
  }
  while (i < text.length && !",}]".includes(text[i]))
    i++;
  return i;
}
function stripTopLevelJsonKeys(text, keysToStrip) {
  const objStart = text.indexOf("{");
  if (objStart === -1)
    return text;
  let out = text.slice(0, objStart + 1);
  let i = objStart + 1;
  let wroteField = false;
  while (i < text.length) {
    while (i < text.length && /\s/.test(text[i]))
      i++;
    if (text[i] === "}" || i >= text.length) {
      out += text.slice(i);
      break;
    }
    if (text[i] === ",") {
      i++;
      continue;
    }
    const keyStart = i;
    const keyTextEnd = skipJsonValue(text, keyStart);
    let key;
    try {
      key = JSON.parse(text.slice(keyStart, keyTextEnd));
    } catch {
      return text;
    }
    let j = keyTextEnd;
    while (j < text.length && /\s/.test(text[j]))
      j++;
    const valueStart = j + 1;
    const valueEnd = skipJsonValue(text, valueStart);
    if (!keysToStrip.has(key)) {
      out += (wroteField ? "," : "") + text.slice(keyStart, valueEnd);
      wroteField = true;
    }
    i = valueEnd;
  }
  return out;
}
function _stripTopLevelJsonKeysForTests(text, keysToStrip) {
  return stripTopLevelJsonKeys(text, new Set(keysToStrip));
}
var HEAVY_SNAPSHOT_KEYS = /* @__PURE__ */ new Set([
  "wordIndex",
  "files",
  "symbols",
  "reverseDeps"
]);
var NARROW_DIGEST_HEAVY_KEY_LITERALS = [
  "wordIndex",
  "files",
  "symbols",
  "reverseDeps"
];
var _lastNarrowParseDigestForTests;
function getLastNarrowParseDigestForTests() {
  return _lastNarrowParseDigestForTests;
}
function resetLastNarrowParseDigestForTests() {
  _lastNarrowParseDigestForTests = void 0;
}
function parseExportsAndRulesOnly(json) {
  const narrowed = stripTopLevelJsonKeys(json, HEAVY_SNAPSHOT_KEYS);
  _lastNarrowParseDigestForTests = {
    length: narrowed.length,
    containsHeavyKey: NARROW_DIGEST_HEAVY_KEY_LITERALS.some((key) => narrowed.includes(`"${key}":`))
  };
  const parsed = JSON.parse(narrowed);
  if (parsed.version !== PROJECT_SNAPSHOT_VERSION)
    return null;
  const stored = readStoredSeq(parsed);
  if (!stored)
    return null;
  if (!Array.isArray(parsed.cachedExports))
    return null;
  return {
    version: PROJECT_SNAPSHOT_VERSION,
    seq: stored.seq,
    ...stored.incomplete ? { incomplete: true } : {},
    logEntries: typeof parsed.logEntries === "number" ? parsed.logEntries : void 0,
    cachedExports: parsed.cachedExports.filter((entry) => Array.isArray(entry) && typeof entry[0] === "string" && typeof entry[1] === "string"),
    projectRulesScan: parsed.projectRulesScan
  };
}
function readSnapshotExportsAndRulesBody(bodyPath, gz) {
  try {
    const json = gz ? gunzipSync(fs3.readFileSync(bodyPath)).toString("utf-8") : fs3.readFileSync(bodyPath, "utf-8");
    return parseExportsAndRulesOnly(json);
  } catch (err) {
    logLatency({
      type: "phase",
      phase: "project_snapshot_body_corrupt",
      filePath: bodyPath,
      durationMs: 0,
      metadata: {
        error: err instanceof Error ? err.message : String(err),
        narrow: true
      }
    });
    return null;
  }
}
function loadProjectSnapshotExportsAndRules(cwd) {
  const key = normalizeMapKey(cwd);
  const body = resolveSnapshotBodyPath(cwd);
  const authoritative = authoritativeSnapshots.get(key);
  if (authoritative) {
    const notSuperseded = body === null || body.mtimeMs <= authoritative.knownMtime && body.size === authoritative.knownSize;
    if (notSuperseded) {
      const { version, seq, incomplete, logEntries, cachedExports, projectRulesScan } = authoritative.snapshot;
      return {
        version,
        seq,
        ...incomplete ? { incomplete } : {},
        logEntries,
        cachedExports,
        projectRulesScan
      };
    }
  }
  if (!body)
    return null;
  return readSnapshotExportsAndRulesBody(body.path, body.gz);
}
function loadProjectSnapshotInternal(cwd, requireWordIndex) {
  const key = normalizeMapKey(cwd);
  const body = resolveSnapshotBodyPath(cwd);
  const authoritative = authoritativeSnapshots.get(key);
  if (authoritative) {
    const notSuperseded = body === null || body.mtimeMs <= authoritative.knownMtime && body.size === authoritative.knownSize;
    if (notSuperseded) {
      touchAuthoritativeSnapshot(key, authoritative);
      return authoritative.snapshot;
    }
    deleteAuthoritativeSnapshot(key);
  }
  if (!body) {
    snapshotParseCache.delete(getProjectSnapshotPath(cwd));
    return null;
  }
  const cacheKey = body.path;
  const cached = snapshotParseCache.get(cacheKey);
  if (cached && cached.mtimeMs === body.mtimeMs && cached.size === body.size) {
    if (!requireWordIndex || !cached.snapshot || cached.snapshot.wordIndex) {
      return cached.snapshot;
    }
  }
  const { snapshot, rawBytes } = readSnapshotBody(body.path, body.gz);
  const cacheSnapshot = withoutWordIndex(snapshot);
  if (rawBytes > 0 && (rawBytes <= SNAPSHOT_PARSE_CACHE_MAX_BYTES || snapshot?.wordIndex)) {
    cacheParsedSnapshot(cacheKey, {
      mtimeMs: body.mtimeMs,
      size: body.size,
      snapshot: cacheSnapshot
    });
  } else {
    snapshotParseCache.delete(cacheKey);
  }
  return snapshot;
}
function loadProjectSnapshot(cwd) {
  return loadProjectSnapshotInternal(cwd, true);
}
function loadProjectSnapshotWithoutWordIndex(cwd) {
  return loadProjectSnapshotInternal(cwd, false);
}
var _snapshotGenerationStates = /* @__PURE__ */ new Map();
var _successfulSnapshotPersists = new BoundedFifoMap(PROJECT_SNAPSHOT_MAX_WARM_ROOTS);
var _failedSnapshotPersists = new BoundedFifoMap(PROJECT_SNAPSHOT_MAX_WARM_ROOTS);
var _activeSnapshotPersists = /* @__PURE__ */ new Map();
var _queuedSnapshotPersists = /* @__PURE__ */ new Map();
var _snapshotWorkerRequests = /* @__PURE__ */ new Map();
var _snapshotPersistWorker;
var _snapshotWorkerRequestId = 0;
var _snapshotWorkerDisabled = false;
var _snapshotGenerationGateEnabledForTests = true;
var _snapshotPromotionSeamForTests;
var _lastSnapshotPersistErrorForTests;
var _snapshotExiting = false;
var _snapshotWorkerBodyWritesForTests = 0;
var _snapshotPersistWorkerHeapStatistics = null;
function refreshProjectSnapshotPersistWorkerHeapStatistics() {
  const worker = _snapshotPersistWorker;
  if (!worker || typeof worker.getHeapStatistics !== "function") {
    return Promise.resolve();
  }
  return readWorkerHeapStatistics(worker).then((stats) => {
    if (_snapshotPersistWorker === worker)
      _snapshotPersistWorkerHeapStatistics = stats;
  }).catch(() => {
  });
}
function getProjectSnapshotPersistWorkerHeapStatistics() {
  return _snapshotPersistWorkerHeapStatistics;
}
function snapshotWorkerEnabled() {
  const raw = process.env.PI_LENS_SNAPSHOT_PERSIST_SYNC;
  return !(raw === "1" || raw === "true");
}
function pendingSnapshotIsCurrent(pending) {
  return !_snapshotGenerationGateEnabledForTests || _snapshotGenerationStates.get(pending.key)?.generation === pending.generation;
}
function rememberSuccessfulSnapshotPersist(key, record) {
  _successfulSnapshotPersists.delete(key);
  _successfulSnapshotPersists.set(key, record);
}
function assessSnapshotBodyIntegrity(meta, body) {
  if (meta.gzBytes === void 0) {
    return { outcome: "legacy-meta", actualBytes: body.size };
  }
  if (!body.gz || body.size !== meta.gzBytes) {
    return {
      outcome: "size-mismatch",
      expectedGzBytes: meta.gzBytes,
      actualBytes: body.size
    };
  }
  return {
    outcome: "ok",
    expectedGzBytes: meta.gzBytes,
    actualBytes: body.size
  };
}
function noteSnapshotBodyIntegrityWithheld(args) {
  incrementDegradationCount({
    kind: "snapshot-integrity",
    subject: args.gzPath,
    reason: args.verdict
  });
  logLatency({
    type: "phase",
    phase: "project_snapshot_body_integrity",
    filePath: args.gzPath,
    durationMs: 0,
    metadata: {
      outcome: "dedupe_withheld",
      reason: args.verdict,
      ...args.seq !== void 0 ? { seq: args.seq } : {},
      ...args.expectedGzBytes === void 0 ? {} : { expectedGzBytes: args.expectedGzBytes },
      actualBytes: args.actualBytes
    }
  });
}
function noteSnapshotSkipRefused(args) {
  logLatency({
    type: "phase",
    phase: "project_snapshot_body_integrity",
    filePath: args.gzPath,
    durationMs: 0,
    metadata: {
      outcome: "skip_refused_rewrite",
      reason: args.verdict,
      seq: args.seq
    }
  });
}
function snapshotPersistBaselinesFor(cwd, key) {
  const local = _successfulSnapshotPersists.get(key);
  const meta = readProjectSnapshotMeta(cwd);
  const body = resolveSnapshotBodyPath(cwd);
  if (!meta?.fingerprint || !body) {
    if (!body)
      _successfulSnapshotPersists.delete(key);
    return { fingerprints: [] };
  }
  const integrity = assessSnapshotBodyIntegrity(meta, body);
  if (integrity.outcome !== "ok") {
    noteSnapshotBodyIntegrityWithheld({
      gzPath: getProjectSnapshotPath(cwd),
      verdict: integrity.outcome,
      seq: meta.seq,
      expectedGzBytes: integrity.expectedGzBytes,
      actualBytes: integrity.actualBytes
    });
    return { fingerprints: [] };
  }
  const durable = {
    seq: meta.seq,
    fingerprint: meta.fingerprint,
    generatedAt: meta.timestamp,
    generation: _snapshotGenerationStates.get(key)?.generation ?? 0,
    gzBytes: meta.gzBytes
  };
  const fingerprints = [durable.fingerprint];
  if (local && local.fingerprint !== durable.fingerprint) {
    fingerprints.push(local.fingerprint);
  }
  return { durable, fingerprints, integrity: "ok" };
}
function seedSnapshotPersistBaselineFromDurable(key, durable) {
  if (!durable || _successfulSnapshotPersists.has(key))
    return;
  rememberSuccessfulSnapshotPersist(key, durable);
}
function writeProjectSnapshotMeta(metaPath, snapshot, bodyRecord) {
  writeFileAtomic(metaPath, JSON.stringify({
    timestamp: bodyRecord?.generatedAt ?? snapshot.generatedAt,
    version: snapshot.version,
    ...storedSeq(snapshot),
    ...bodyRecord ? {
      fingerprint: bodyRecord.fingerprint,
      ...bodyRecord.gzBytes === void 0 ? {} : { gzBytes: bodyRecord.gzBytes }
    } : {},
    logEntries: snapshot.logEntries,
    ...snapshot.sequenceIndex ? { sequenceIndex: snapshot.sequenceIndex } : {}
  }), { bestEffort: false });
}
function recordSnapshotPersistFailure(pending, error, bodyPersisted = false) {
  _lastSnapshotPersistErrorForTests = error;
  _failedSnapshotPersists.set(pending.key, {
    seq: pending.snapshot.seq,
    generation: pending.generation
  });
  deleteAuthoritativeSnapshot(pending.key);
  logLatency({
    type: "phase",
    phase: "project_snapshot_persist_failed",
    filePath: pending.gzPath,
    durationMs: 0,
    metadata: {
      error,
      seq: pending.snapshot.seq,
      outcome: bodyPersisted ? "metadata_repair_required" : "failed",
      ...bodyPersisted ? { bodyPersisted: true } : {}
    }
  });
}
function logSnapshotPersistSuccess(pending, fingerprint, stats) {
  rememberSuccessfulSnapshotPersist(pending.key, {
    seq: pending.snapshot.seq,
    fingerprint,
    generatedAt: pending.snapshot.generatedAt,
    generation: pending.generation,
    rawBytes: stats.rawBytes,
    gzBytes: stats.gzBytes
  });
  _failedSnapshotPersists.delete(pending.key);
  logLatency({
    type: "phase",
    phase: "project_snapshot_persist",
    filePath: pending.gzPath,
    durationMs: stats.serializeMs + stats.writeMs,
    metadata: { seq: pending.snapshot.seq, outcome: "executed", ...stats }
  });
}
function logSnapshotPersistDecision(args) {
  logLatency({
    type: "phase",
    phase: "project_snapshot_persist_decision",
    filePath: getProjectSnapshotPath(args.cwd),
    durationMs: 0,
    metadata: {
      seq: args.seq,
      decision: args.decision,
      ...args.fingerprint ? { fingerprint: args.fingerprint.slice(0, 12) } : {},
      ...args.avoidedRawBytes === void 0 ? {} : { avoidedRawBytes: args.avoidedRawBytes },
      ...args.avoidedGzipBytes === void 0 ? {} : { avoidedGzipBytes: args.avoidedGzipBytes },
      ...args.diskSeq === void 0 ? {} : { diskSeq: args.diskSeq }
    }
  });
}
function reconcileAuthoritativeAfterWrite(pending, rawBytes) {
  const entry = authoritativeSnapshots.get(pending.key);
  if (!entry || entry.snapshot !== pending.snapshot)
    return;
  if (pending.snapshot.wordIndex) {
    try {
      const stat = fs3.statSync(pending.gzPath);
      cacheParsedSnapshot(pending.gzPath, {
        mtimeMs: stat.mtimeMs,
        size: stat.size,
        snapshot: withoutWordIndex(pending.snapshot)
      });
    } catch {
    }
    deleteAuthoritativeSnapshot(pending.key);
    logLatency({
      type: "phase",
      phase: "project_snapshot_word_index_released",
      filePath: pending.gzPath,
      durationMs: 0,
      metadata: { rawBytes }
    });
    return;
  }
  if (rawBytes > SNAPSHOT_PARSE_CACHE_MAX_BYTES) {
    logLatency({
      type: "phase",
      phase: "project_snapshot_authoritative_dropped_oversized",
      filePath: pending.gzPath,
      durationMs: 0,
      metadata: { rawBytes, maxBytes: SNAPSHOT_PARSE_CACHE_MAX_BYTES }
    });
    deleteAuthoritativeSnapshot(pending.key);
    return;
  }
  try {
    const stat = fs3.statSync(pending.gzPath);
    entry.knownMtime = stat.mtimeMs;
    entry.knownSize = stat.size;
  } catch {
  }
}
function finalizeProjectSnapshotMeta(pending, record) {
  try {
    writeProjectSnapshotMeta(getProjectSnapshotMetaPath(pending.cwd), pending.snapshot, record);
    return true;
  } catch (err) {
    recordSnapshotPersistFailure(pending, err instanceof Error ? err.message : String(err), true);
    return false;
  }
}
function completeSnapshotPersist(pending) {
  if (_activeSnapshotPersists.get(pending.key) !== pending)
    return;
  _activeSnapshotPersists.delete(pending.key);
  if (_snapshotExiting)
    return;
  const queued = _queuedSnapshotPersists.get(pending.key);
  if (!queued)
    return;
  _queuedSnapshotPersists.delete(pending.key);
  dispatchSnapshotPersist(queued);
}
var SNAPSHOT_CACHE_LOCK = { staleMs: 5e3, waitMs: 500 };
function withSnapshotCacheLock(gzPath, purpose, op) {
  const result = withGenerationLockSync(`${gzPath}.locks`, SNAPSHOT_CACHE_LOCK, op);
  if (!result.held) {
    const code = result.cause?.code;
    incrementDegradationCount({
      kind: "project-snapshot-lock-unavailable",
      subject: gzPath,
      reason: `${purpose} skipped: ${code ? `lock failed (${code})` : "lock wait ran out"}`
    });
  }
  return result;
}
function promoteSnapshotBody(pending, body, record) {
  const dropStage = () => {
    if ("stagePath" in body)
      fs3.rmSync(body.stagePath, { force: true });
  };
  const locked = withSnapshotCacheLock(pending.gzPath, "body promotion", () => {
    const onDisk = readProjectSnapshotMeta(pending.cwd);
    if (onDisk && onDisk.seq > pending.snapshot.seq) {
      dropStage();
      return onDisk.seq;
    }
    if ("stagePath" in body)
      fs3.renameSync(body.stagePath, pending.gzPath);
    else
      writeFileAtomic(pending.gzPath, body.gzip, { bestEffort: false });
    fs3.rmSync(pending.legacyPath, { force: true });
    return finalizeProjectSnapshotMeta(pending, record);
  });
  if (!locked.held) {
    dropStage();
    recordSnapshotPersistFailure(pending, "project snapshot cache lock unavailable");
    return false;
  }
  if (typeof locked.value === "boolean")
    return locked.value;
  deleteAuthoritativeSnapshot(pending.key);
  logSnapshotPersistDecision({
    cwd: pending.cwd,
    seq: pending.snapshot.seq,
    decision: "superseded_on_disk",
    diskSeq: locked.value
  });
  return false;
}
function serializeSnapshotBody(snapshot) {
  const started = performance.now();
  const stored = storedSnapshot(snapshot);
  const spliced = stored.wordIndex === void 0 ? void 0 : spliceWordIndexBody(stored);
  const bytes = spliced?.bytes ?? new TextEncoder().encode(JSON.stringify(stored));
  return {
    bytes,
    serializeMs: performance.now() - started,
    wordIndexWireBytes: spliced?.wordIndexWireBytes
  };
}
var WORD_INDEX_PLACEHOLDER = `\0pi-lens-word-index-${process.pid}-${Date.now()}\0`;
var WORD_INDEX_KEY_JSON = '"wordIndex":';
var WORD_INDEX_PLACEHOLDER_JSON = `${WORD_INDEX_KEY_JSON}${JSON.stringify(WORD_INDEX_PLACEHOLDER)}`;
function spliceWordIndexBody(stored) {
  const marker = WORD_INDEX_PLACEHOLDER_JSON;
  const head = JSON.stringify({ ...stored, wordIndex: WORD_INDEX_PLACEHOLDER });
  const at = head.indexOf(marker);
  if (at < 0)
    return void 0;
  const prefix = head.slice(0, at + WORD_INDEX_KEY_JSON.length);
  const suffix = head.slice(at + marker.length);
  const wordIndex = JSON.stringify(stored.wordIndex);
  const prefixBytes = Buffer.byteLength(prefix);
  const wordIndexWireBytes = Buffer.byteLength(wordIndex);
  const bytes = new Uint8Array(prefixBytes + wordIndexWireBytes + Buffer.byteLength(suffix));
  const encoder = new TextEncoder();
  encoder.encodeInto(prefix, bytes.subarray(0, prefixBytes));
  encoder.encodeInto(wordIndex, bytes.subarray(prefixBytes, prefixBytes + wordIndexWireBytes));
  encoder.encodeInto(suffix, bytes.subarray(prefixBytes + wordIndexWireBytes));
  return { bytes, wordIndexWireBytes };
}
function writeSnapshotBodyOnMainThread(pending, reason) {
  if (!pendingSnapshotIsCurrent(pending)) {
    completeSnapshotPersist(pending);
    return;
  }
  if (reason) {
    logLatency({
      type: "phase",
      phase: "project_snapshot_worker_fallback",
      filePath: pending.gzPath,
      durationMs: 0,
      metadata: {
        reason,
        seq: pending.snapshot.seq,
        degraded: reason !== "exit_hook"
      }
    });
  }
  try {
    const { bytes, serializeMs, wordIndexWireBytes } = serializeSnapshotBody(pending.snapshot);
    pending.wordIndexWireBytes = wordIndexWireBytes;
    const rawBytes = bytes.byteLength;
    const fingerprint = fingerprintProjectSnapshotJson(bytes, pending.snapshot.generatedAt);
    if (pending.dedupeFingerprints.includes(fingerprint)) {
      const current = snapshotPersistBaselinesFor(pending.cwd, pending.key);
      if (current.integrity === "ok") {
        const prior = current.durable ?? pending.durablePersist;
        if (authoritativeSnapshots.get(pending.key)?.snapshot === pending.snapshot) {
          deleteAuthoritativeSnapshot(pending.key);
        }
        logSnapshotPersistDecision({
          cwd: pending.cwd,
          seq: pending.snapshot.seq,
          fingerprint,
          decision: "skipped_unchanged",
          avoidedRawBytes: rawBytes,
          avoidedGzipBytes: prior?.gzBytes
        });
        return;
      }
      if (current.integrity !== void 0) {
        noteSnapshotSkipRefused({
          gzPath: pending.gzPath,
          verdict: current.integrity,
          seq: pending.snapshot.seq
        });
      }
    }
    const writeStarted = performance.now();
    const gzip = gzipSync(bytes);
    fs3.mkdirSync(path2.dirname(pending.gzPath), { recursive: true });
    const promoted = promoteSnapshotBody(pending, { gzip }, {
      fingerprint,
      generatedAt: pending.snapshot.generatedAt,
      gzBytes: gzip.byteLength
    });
    if (!promoted)
      return;
    recordPersistedWordIndexWireBytes(pending.snapshot.wordIndex, pending.wordIndexWireBytes);
    reconcileAuthoritativeAfterWrite(pending, rawBytes);
    logSnapshotPersistSuccess(pending, fingerprint, {
      rawBytes,
      gzBytes: gzip.byteLength,
      serializeMs,
      writeMs: performance.now() - writeStarted,
      offloaded: false
    });
    if (reason)
      _lastSnapshotPersistErrorForTests = reason;
  } catch (err) {
    recordSnapshotPersistFailure(pending, err instanceof Error ? err.message : String(err));
  } finally {
    completeSnapshotPersist(pending);
  }
}
function dispatchMainThreadWriteThroughSeam(pending, reason) {
  if (_snapshotPromotionSeamForTests) {
    void _snapshotPromotionSeamForTests().then(() => writeSnapshotBodyOnMainThread(pending, reason));
    return;
  }
  writeSnapshotBodyOnMainThread(pending, reason);
}
function handleSnapshotWorkerResult(result) {
  const pending = _snapshotWorkerRequests.get(result.id);
  if (!pending) {
    fs3.rmSync(result.stagePath, { force: true });
    return;
  }
  _snapshotWorkerRequests.delete(result.id);
  if (result.error || result.rawBytes === void 0 || result.gzBytes === void 0 || result.serializeMs === void 0 || result.writeMs === void 0 || result.semanticFingerprint === void 0) {
    fs3.rmSync(result.stagePath, { force: true });
    dispatchMainThreadWriteThroughSeam(pending, result.error ?? "invalid worker result");
    return;
  }
  if (!result.skippedUnchanged)
    _snapshotWorkerBodyWritesForTests++;
  if (_snapshotGenerationGateEnabledForTests && _snapshotGenerationStates.get(pending.key)?.generation !== result.generation) {
    fs3.rmSync(result.stagePath, { force: true });
    completeSnapshotPersist(pending);
    return;
  }
  if (result.skippedUnchanged) {
    const baselines = snapshotPersistBaselinesFor(pending.cwd, pending.key);
    if (baselines.integrity !== "ok") {
      if (baselines.integrity !== void 0) {
        noteSnapshotSkipRefused({
          gzPath: pending.gzPath,
          verdict: baselines.integrity,
          seq: pending.snapshot.seq
        });
      }
      dispatchMainThreadWriteThroughSeam(pending, "snapshot body integrity regressed");
      return;
    }
    const prior = baselines.durable ?? pending.durablePersist;
    if (authoritativeSnapshots.get(pending.key)?.snapshot === pending.snapshot) {
      deleteAuthoritativeSnapshot(pending.key);
    }
    logSnapshotPersistDecision({
      cwd: pending.cwd,
      seq: pending.snapshot.seq,
      fingerprint: result.semanticFingerprint,
      decision: "skipped_unchanged",
      avoidedRawBytes: result.rawBytes,
      avoidedGzipBytes: prior?.gzBytes
    });
    completeSnapshotPersist(pending);
    return;
  }
  try {
    const promoted = promoteSnapshotBody(pending, { stagePath: result.stagePath }, {
      fingerprint: result.semanticFingerprint,
      generatedAt: pending.snapshot.generatedAt,
      gzBytes: result.gzBytes
    });
    if (!promoted) {
      completeSnapshotPersist(pending);
      return;
    }
    recordPersistedWordIndexWireBytes(pending.snapshot.wordIndex, pending.wordIndexWireBytes);
    reconcileAuthoritativeAfterWrite(pending, result.rawBytes);
    logSnapshotPersistSuccess(pending, result.semanticFingerprint, {
      rawBytes: result.rawBytes,
      gzBytes: result.gzBytes,
      serializeMs: pending.serializeMs ?? result.serializeMs,
      writeMs: result.writeMs,
      offloaded: true
    });
    completeSnapshotPersist(pending);
  } catch (err) {
    fs3.rm(result.stagePath, { force: true }, () => {
    });
    dispatchMainThreadWriteThroughSeam(pending, err instanceof Error ? err.message : String(err));
  }
}
function dispatchSnapshotPersist(pending) {
  const baselines = snapshotPersistBaselinesFor(pending.cwd, pending.key);
  pending.durablePersist = baselines.durable;
  pending.dedupeFingerprints = baselines.fingerprints;
  seedSnapshotPersistBaselineFromDurable(pending.key, baselines.durable);
  _activeSnapshotPersists.set(pending.key, pending);
  if (!snapshotWorkerEnabled()) {
    dispatchMainThreadWriteThroughSeam(pending, void 0);
    return;
  }
  const worker = getSnapshotPersistWorker();
  if (!worker) {
    dispatchMainThreadWriteThroughSeam(pending, "persist worker unavailable");
    return;
  }
  let serialized;
  try {
    serialized = serializeSnapshotBody(pending.snapshot);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    incrementDegradationCount({
      kind: "project-snapshot-serialize-failed",
      subject: pending.gzPath,
      reason: `snapshot body serialization failed: ${message}`
    });
    recordSnapshotPersistFailure(pending, message);
    completeSnapshotPersist(pending);
    return;
  }
  pending.serializeMs = serialized.serializeMs;
  pending.wordIndexWireBytes = serialized.wordIndexWireBytes;
  const id = ++_snapshotWorkerRequestId;
  _snapshotWorkerRequests.set(id, pending);
  const request = {
    id,
    generation: pending.generation,
    stagePath: pending.stagePath,
    data: serialized.bytes,
    generatedAt: pending.snapshot.generatedAt,
    priorFingerprints: pending.dedupeFingerprints,
    testDelayMs: process.env.NODE_ENV === "test" ? Number(process.env.PI_LENS_TEST_SNAPSHOT_PERSIST_WORKER_DELAY_MS) || void 0 : void 0
  };
  try {
    worker.postMessage(request, [serialized.bytes.buffer]);
  } catch (err) {
    _snapshotWorkerRequests.delete(id);
    dispatchMainThreadWriteThroughSeam(pending, err instanceof Error ? err.message : String(err));
  }
}
function handleSnapshotWorkerDeath(reason) {
  _snapshotPersistWorker = void 0;
  _snapshotPersistWorkerHeapStatistics = null;
  _snapshotWorkerDisabled = true;
  const requests = [..._snapshotWorkerRequests.values()];
  _snapshotWorkerRequests.clear();
  for (const pending of requests)
    dispatchMainThreadWriteThroughSeam(pending, reason);
}
function resolveSnapshotPersistWorkerPath() {
  const candidates = [
    new URL("./project-snapshot-persist-worker.js", import.meta.url),
    new URL("./workers/project-snapshot-persist-worker.js", import.meta.url),
    new URL("../workers/project-snapshot-persist-worker.js", import.meta.url)
  ];
  for (const url of candidates) {
    try {
      const resolved = fileURLToPath(url);
      if (fs3.existsSync(resolved))
        return resolved;
    } catch {
    }
  }
  return void 0;
}
function getSnapshotPersistWorker() {
  if (_snapshotWorkerDisabled)
    return void 0;
  if (_snapshotPersistWorker)
    return _snapshotPersistWorker;
  try {
    const workerPath = resolveSnapshotPersistWorkerPath();
    if (workerPath === void 0) {
      handleSnapshotWorkerDeath("persist worker script not found in any layout");
      return void 0;
    }
    const worker = new Worker(workerPath);
    worker.on("message", (result) => {
      if (_snapshotPromotionSeamForTests) {
        void _snapshotPromotionSeamForTests().then(() => handleSnapshotWorkerResult(result));
        return;
      }
      handleSnapshotWorkerResult(result);
    });
    worker.on("error", (err) => handleSnapshotWorkerDeath(err.message));
    worker.on("exit", (code) => {
      if (_snapshotPersistWorker === worker) {
        _snapshotPersistWorker = void 0;
        _snapshotPersistWorkerHeapStatistics = null;
      }
      const stranded = [..._snapshotWorkerRequests.values()];
      if (stranded.length > 0) {
        _snapshotWorkerRequests.clear();
        for (const pending of stranded) {
          dispatchMainThreadWriteThroughSeam(pending, `persist worker exited with code ${code}`);
        }
      }
      if (code !== 0)
        _snapshotWorkerDisabled = true;
    });
    worker.unref();
    _snapshotPersistWorker = worker;
    return worker;
  } catch (err) {
    handleSnapshotWorkerDeath(err instanceof Error ? err.message : String(err));
    return void 0;
  }
}
var _sweptSnapshotStageDirs = /* @__PURE__ */ new Set();
function sweepStaleSnapshotStageFiles(cacheDir) {
  if (_sweptSnapshotStageDirs.has(cacheDir))
    return;
  _sweptSnapshotStageDirs.add(cacheDir);
  fs3.readdir(cacheDir, (err, entries) => {
    if (err)
      return;
    for (const entry of entries) {
      if (!isStaleStageFile(entry, "project-snapshot.json.gz.stage-"))
        continue;
      fs3.rm(path2.join(cacheDir, entry), { force: true }, () => {
      });
    }
  });
}
function flushSnapshotPersistsAtExit() {
  _snapshotExiting = true;
  const latestByKey = /* @__PURE__ */ new Map();
  for (const pending of _snapshotWorkerRequests.values()) {
    latestByKey.set(pending.key, pending);
  }
  for (const pending of _queuedSnapshotPersists.values()) {
    const prior = latestByKey.get(pending.key);
    if (!prior || prior.generation <= pending.generation) {
      latestByKey.set(pending.key, pending);
    }
  }
  _snapshotWorkerRequests.clear();
  _queuedSnapshotPersists.clear();
  _activeSnapshotPersists.clear();
  for (const pending of latestByKey.values()) {
    writeSnapshotBodyOnMainThread(pending, "exit_hook");
  }
  void _snapshotPersistWorker?.terminate();
}
var _snapshotExitHookInstalled = false;
function ensureSnapshotPersistExitHook() {
  if (_snapshotExitHookInstalled)
    return;
  _snapshotExitHookInstalled = true;
  process.once("exit", flushSnapshotPersistsAtExit);
}
function runSnapshotPersistExitFlushForTests() {
  flushSnapshotPersistsAtExit();
}
function saveProjectSnapshot(cwd, snapshot) {
  const gzPath = getProjectSnapshotPath(cwd);
  const legacyPath = getProjectSnapshotLegacyPath(cwd);
  const metaPath = getProjectSnapshotMetaPath(cwd);
  const cacheDir = path2.dirname(gzPath);
  const key = normalizeMapKey(cwd);
  fs3.mkdirSync(cacheDir, { recursive: true });
  const baselines = snapshotPersistBaselinesFor(cwd, key);
  const priorPersist = baselines.durable;
  logSnapshotPersistDecision({
    cwd,
    seq: snapshot.seq,
    decision: "requested"
  });
  if (_failedSnapshotPersists.delete(key)) {
    logSnapshotPersistDecision({ cwd, seq: snapshot.seq, decision: "retry" });
  }
  withSnapshotCacheLock(gzPath, "admission meta write", () => {
    const onDisk = readProjectSnapshotMeta(cwd);
    if (!onDisk || onDisk.seq < snapshot.seq) {
      writeProjectSnapshotMeta(metaPath, snapshot);
    }
  });
  const priorBody = resolveSnapshotBodyPath(cwd);
  const knownMtime = priorBody ? priorBody.mtimeMs : Number.NEGATIVE_INFINITY;
  const knownSize = priorBody ? priorBody.size : Number.NEGATIVE_INFINITY;
  const authoritativeEntry = {
    snapshot,
    knownMtime,
    knownSize,
    lastUsedAt: Date.now()
  };
  const previousAuthoritativeEntry = authoritativeSnapshots.get(key);
  if (previousAuthoritativeEntry)
    clearAuthoritativeSnapshotTimer(previousAuthoritativeEntry);
  authoritativeSnapshots.set(key, authoritativeEntry);
  scheduleAuthoritativeSnapshotEviction(key, authoritativeEntry);
  enforceAuthoritativeSnapshotCap();
  snapshotParseCache.delete(gzPath);
  const generationState = _snapshotGenerationStates.get(key);
  const generation = generationState?.seq === snapshot.seq ? generationState.generation : (generationState?.generation ?? 0) + 1;
  _snapshotGenerationStates.set(key, { generation, seq: snapshot.seq });
  const stagePath = `${gzPath}.stage-${process.pid}-${generation}`;
  const pending = {
    key,
    cwd,
    gzPath,
    legacyPath,
    stagePath,
    snapshot,
    generation,
    durablePersist: priorPersist,
    dedupeFingerprints: baselines.fingerprints
  };
  sweepStaleSnapshotStageFiles(cacheDir);
  ensureSnapshotPersistExitHook();
  if (_activeSnapshotPersists.has(key)) {
    _queuedSnapshotPersists.set(key, pending);
    logSnapshotPersistDecision({
      cwd,
      seq: snapshot.seq,
      decision: "coalesced"
    });
    return;
  }
  dispatchSnapshotPersist(pending);
}
async function waitForProjectSnapshotPersistsForTests() {
  for (let attempts = 0; attempts < 200 && (_snapshotWorkerRequests.size > 0 || _activeSnapshotPersists.size > 0 || _queuedSnapshotPersists.size > 0); attempts++) {
    await new Promise((resolve2) => setTimeout(resolve2, 10));
  }
}
function flushProjectSnapshotPersistsForTests() {
  const requests = [..._snapshotWorkerRequests.values()];
  _snapshotWorkerRequests.clear();
  for (const pending of requests) {
    dispatchMainThreadWriteThroughSeam(pending, void 0);
  }
}
async function terminateProjectSnapshotPersistWorkerForTests() {
  const worker = _snapshotPersistWorker;
  if (worker)
    await worker.terminate();
}
function resetProjectSnapshotPersistWorkerForTests() {
  _snapshotWorkerDisabled = false;
  _snapshotGenerationGateEnabledForTests = true;
  _snapshotPromotionSeamForTests = void 0;
  _snapshotPersistWorker = void 0;
  _snapshotPersistWorkerHeapStatistics = null;
  _snapshotWorkerRequests.clear();
  _snapshotGenerationStates.clear();
  _successfulSnapshotPersists.clear();
  _failedSnapshotPersists.clear();
  _activeSnapshotPersists.clear();
  _queuedSnapshotPersists.clear();
  _snapshotExiting = false;
  _snapshotWorkerBodyWritesForTests = 0;
  _lastSnapshotPersistErrorForTests = void 0;
}
function getProjectSnapshotPersistStateForTests(cwd) {
  const key = normalizeMapKey(cwd);
  return {
    active: _activeSnapshotPersists.has(key),
    queued: _queuedSnapshotPersists.has(key),
    successfulFingerprint: _successfulSnapshotPersists.get(key)?.fingerprint,
    workerBodyWrites: _snapshotWorkerBodyWritesForTests
  };
}
function setProjectSnapshotGenerationGateForTests(enabled) {
  _snapshotGenerationGateEnabledForTests = enabled;
}
function setProjectSnapshotPromotionSeamForTests(seam) {
  _snapshotPromotionSeamForTests = seam;
}
function getProjectSnapshotPersistErrorForTests() {
  return _lastSnapshotPersistErrorForTests;
}
function _seedSnapshotParseCacheForTests(key, entry) {
  cacheParsedSnapshot(key, entry);
}
function _snapshotParseCacheKeysForTests() {
  return [...snapshotParseCache.keys()];
}
function _snapshotParseCacheGetForTests(key) {
  return snapshotParseCache.get(key) !== void 0;
}
function _seedSuccessfulSnapshotPersistForTests(key, record) {
  rememberSuccessfulSnapshotPersist(key, record);
}
function _successfulSnapshotPersistKeysForTests() {
  return [..._successfulSnapshotPersists.keys()];
}
function _successfulSnapshotPersistGetForTests(key) {
  return _successfulSnapshotPersists.get(key) !== void 0;
}
function _seedFailedSnapshotPersistForTests(key, record) {
  _failedSnapshotPersists.set(key, record);
}
function _failedSnapshotPersistKeysForTests() {
  return [..._failedSnapshotPersists.keys()];
}
function buildProjectSnapshotFromRuntime(args) {
  const incomplete = args.runtime.viewMissesLoggedEntries;
  return {
    version: PROJECT_SNAPSHOT_VERSION,
    projectRoot: normalizeMapKey(path2.resolve(args.cwd)),
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    seq: args.runtime.projectSeq,
    ...incomplete ? { incomplete: true } : {},
    logEntries: args.runtime.viewLogEntries,
    files: {},
    symbols: {},
    reverseDeps: {},
    cachedExports: [...args.runtime.cachedExports.entries()].sort((a, b) => a[0].localeCompare(b[0])),
    // #1019: capture the runtime's live sequence index AT this seq. The runtime
    // is seeded from the change log at session start and bumped in lockstep with
    // every append, so `getFileSeqEntries()` IS the fold of the log up to
    // `projectSeq` — and its keys are already `normalizeMapKey(path.resolve())`,
    // the exact form the change-log replay produces.
    sequenceIndex: incomplete ? void 0 : {
      projectSeq: args.runtime.projectSeq,
      fileSeqByPath: args.runtime.getFileSeqEntries()
    },
    wordIndex: args.runtime.wordIndex ? serializeWordIndex(args.runtime.wordIndex) : void 0,
    projectRulesScan: args.runtime.projectRulesScan,
    startupScan: args.startupScan,
    languageProfile: args.languageProfile,
    conventions: args.conventions
  };
}
function hydrateRuntimeFromProjectSnapshot(runtime, snapshot) {
  runtime.cachedExports.clear();
  for (const [name, filePath] of snapshot.cachedExports) {
    runtime.cachedExports.set(name, filePath);
  }
  if (snapshot.projectRulesScan) {
    runtime.projectRulesScan = snapshot.projectRulesScan;
  }
  runtime.wordIndex = deserializeWordIndex(snapshot.wordIndex);
}
function hydrateRuntimeFromProjectSnapshotIfIdle(runtime, snapshot) {
  let hydratedAnything = false;
  if (runtime.cachedExports.size === 0 && snapshot.cachedExports.length > 0) {
    runtime.cachedExports.clear();
    for (const [name, filePath] of snapshot.cachedExports) {
      runtime.cachedExports.set(name, filePath);
    }
    hydratedAnything = true;
  }
  if (!runtime.projectRulesScan.hasCustomRules && runtime.projectRulesScan.rules.length === 0 && snapshot.projectRulesScan) {
    runtime.projectRulesScan = snapshot.projectRulesScan;
    hydratedAnything = true;
  }
  return hydratedAnything;
}
function saveRuntimeProjectSnapshot(args) {
  try {
    if (typeof args.runtime.projectSeq !== "number")
      return;
    const existing = loadProjectSnapshot(args.cwd);
    let conventions = args.conventions ?? existing?.conventions;
    if (!conventions) {
      try {
        conventions = detectProjectConventions(args.cwd);
      } catch (err) {
        args.dbg?.(`project_snapshot: convention detection failed: ${err}`);
      }
    }
    const snapshot = buildProjectSnapshotFromRuntime({
      ...args,
      startupScan: args.startupScan ?? existing?.startupScan,
      languageProfile: args.languageProfile ?? existing?.languageProfile,
      conventions
    });
    if (existing) {
      snapshot.files = existing.files ?? {};
      snapshot.symbols = existing.symbols ?? {};
      snapshot.reverseDeps = existing.reverseDeps ?? {};
      if (!snapshot.wordIndex && existing.wordIndex && existing.seq === snapshot.seq && (snapshot.incomplete || !existing.incomplete)) {
        snapshot.wordIndex = existing.wordIndex;
      }
    }
    saveProjectSnapshot(args.cwd, snapshot);
    args.dbg?.(`project_snapshot: saved seq=${snapshot.seq} exports=${snapshot.cachedExports.length}`);
  } catch (err) {
    args.dbg?.(`project_snapshot: save failed: ${err}`);
  }
}

export {
  readJsonCache,
  readJsonCacheAsync,
  readWorkerHeapStatistics,
  PROJECT_SNAPSHOT_VERSION,
  getProjectSnapshotPath,
  getProjectSnapshotLegacyPath,
  getProjectSnapshotMetaPath,
  isProjectSnapshotFresh,
  readProjectSnapshotMeta,
  isProjectSnapshotMetaStale,
  SNAPSHOT_PARSE_CACHE_MAX,
  PROJECT_SNAPSHOT_MAX_WARM_ROOTS,
  _getAuthoritativeSnapshotCacheKeysForTests,
  _resetProjectSnapshotParseCacheForTests,
  _projectSnapshotParseCacheRetainsWordIndexForTests,
  getSnapshotBodyReadCountForTests,
  resetSnapshotBodyReadCountForTests,
  _stripTopLevelJsonKeysForTests,
  getLastNarrowParseDigestForTests,
  resetLastNarrowParseDigestForTests,
  loadProjectSnapshotExportsAndRules,
  loadProjectSnapshot,
  loadProjectSnapshotWithoutWordIndex,
  refreshProjectSnapshotPersistWorkerHeapStatistics,
  getProjectSnapshotPersistWorkerHeapStatistics,
  runSnapshotPersistExitFlushForTests,
  saveProjectSnapshot,
  waitForProjectSnapshotPersistsForTests,
  flushProjectSnapshotPersistsForTests,
  terminateProjectSnapshotPersistWorkerForTests,
  resetProjectSnapshotPersistWorkerForTests,
  getProjectSnapshotPersistStateForTests,
  setProjectSnapshotGenerationGateForTests,
  setProjectSnapshotPromotionSeamForTests,
  getProjectSnapshotPersistErrorForTests,
  _seedSnapshotParseCacheForTests,
  _snapshotParseCacheKeysForTests,
  _snapshotParseCacheGetForTests,
  _seedSuccessfulSnapshotPersistForTests,
  _successfulSnapshotPersistKeysForTests,
  _successfulSnapshotPersistGetForTests,
  _seedFailedSnapshotPersistForTests,
  _failedSnapshotPersistKeysForTests,
  buildProjectSnapshotFromRuntime,
  hydrateRuntimeFromProjectSnapshot,
  hydrateRuntimeFromProjectSnapshotIfIdle,
  saveRuntimeProjectSnapshot
};
