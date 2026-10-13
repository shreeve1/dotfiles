import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  buildSymbolId
} from "./chunk-3MED75HT.js";
import {
  RUNTIME_CONFIG,
  TreeSitterSymbolExtractor,
  buildReverseDependencyIndexFromGraph,
  getLSPService,
  jsTsCandidatePaths,
  rankFilesByReverseDependencyCentrality,
  resolveAliasedImport,
  resolveImportToFiles,
  resolveProjectReferenceImport,
  resolveWorkspacePackageImport,
  symbolExtractionGrammar
} from "./chunk-M6HSLBWY.js";
import {
  createGitIdentityResolver,
  resolveGitIdentity
} from "./chunk-PNQDPDRC.js";
import {
  readWorkerHeapStatistics
} from "./chunk-ZXYDQ3TZ.js";
import {
  buildQualifiedName,
  findOwnerName
} from "./chunk-5W3R6LFT.js";
import {
  classifyTreeSitterWasmError,
  getSharedTreeSitterClient,
  logTreeSitterCacheStats,
  withTreeSitterRoot
} from "./chunk-QHJ6DQ2R.js";
import {
  getReviewGraphMaxFilesDerived
} from "./chunk-GAEGEPOC.js";
import {
  collectSourceFilesWithBudgetAsync
} from "./chunk-6C7JWPCP.js";
import {
  collectUntrackedIgnoredIds,
  getProjectDataDir,
  isStaleStageFile
} from "./chunk-C34ZXZ7O.js";
import {
  KIND_EXTENSIONS,
  detectFileKind
} from "./chunk-PHDMFAKM.js";
import {
  detectFileRole
} from "./chunk-2BBLFX75.js";
import {
  writeFileAtomic
} from "./chunk-2EECBNC5.js";
import {
  compareOrdinal,
  escapeRegExp,
  incrementDegradationCount
} from "./chunk-JAU72XNY.js";
import {
  logLatency
} from "./chunk-QQNQ7SJW.js";
import {
  createNdjsonLogger,
  getGlobalPiLensLogDir,
  getMaxLogSizeMB,
  getTurnId,
  isTestMode,
  lazyEnvNumber
} from "./chunk-AOHZU2BM.js";
import {
  FactStore
} from "./chunk-CHOW74WE.js";
import {
  BoundedFifoMap,
  BoundedLruCache
} from "./chunk-ABBOA7UD.js";
import {
  isAtOrAboveHomeDir,
  isUnderDir,
  normalizeFilePath,
  normalizeMapKey,
  toProjectRelativePath
} from "./chunk-N2H3ZPZY.js";

// dist/clients/review-graph/builder.js
import { createHash as createHash2 } from "node:crypto";
import * as fs2 from "node:fs";
import * as path2 from "node:path";
import { Worker } from "node:worker_threads";
import { constants as zlibConstants, gunzipSync, gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";

// dist/clients/dispatch/facts/file-content.js
import * as fs from "node:fs/promises";
var fileContentProvider = {
  id: "fact.file.content",
  provides: ["file.content"],
  requires: [],
  appliesTo(_ctx) {
    return true;
  },
  async run(ctx, store) {
    let content;
    try {
      content = await fs.readFile(ctx.filePath, "utf-8");
    } catch {
      content = null;
    }
    store.setFileFact(ctx.filePath, "file.content", content);
  }
};

// dist/clients/feature-hints.js
function normalizeHintInput(value) {
  return value.replace(/\\/g, "/");
}
function hasHintToken(value, tokens) {
  const escaped = tokens.map((token) => escapeRegExp(token));
  const alternatives = escaped.join("|");
  return new RegExp(`(?:^|[/_.\\-\\s])(?:${alternatives})(?=[/_.\\-\\s]|$)`, "i").test(value) || new RegExp(`(?:^|(?<=[a-z0-9]))(?:${tokens.flatMap((token) => [
    token[0].toUpperCase() + token.slice(1),
    ...token === "openai" ? ["OpenAI"] : [],
    ...token === "github" ? ["GitHub"] : [],
    ...token === "gitlab" ? ["GitLab"] : []
  ]).join("|")})(?=[A-Z]|[/_.\\-\\s]|$)`).test(value);
}
function inferFeatureKind(nameOrPath) {
  const normalized = normalizeHintInput(nameOrPath);
  if (hasHintToken(normalized, [
    "config",
    "store",
    "db",
    "database",
    "github",
    "openai",
    "sync",
    "service"
  ])) {
    return "service";
  }
  if (/(^|[/_.\-\s])(cli|command|bin)([/_.\-\s]|$)/i.test(normalized)) {
    return "cli-command";
  }
  return "library";
}
function inferTrustBoundaries(nameOrPath) {
  const normalized = normalizeHintInput(nameOrPath);
  const boundaries = /* @__PURE__ */ new Set();
  if (hasHintToken(normalized, [
    "config",
    "store",
    "db",
    "database",
    "repo",
    "repository",
    "model",
    "migration"
  ])) {
    boundaries.add("filesystem");
    boundaries.add("database");
  }
  if (hasHintToken(normalized, [
    "github",
    "gitlab",
    "openai",
    "anthropic",
    "stripe",
    "slack",
    "sync",
    "webhook",
    "api",
    "client"
  ])) {
    boundaries.add("network");
    boundaries.add("external-api");
    boundaries.add("serialization");
  }
  if (/(^|[/_.\-\s])(cli|command|bin|exec|spawn|process|shell)([/_.\-\s]|$)/i.test(normalized)) {
    boundaries.add("user-input");
    boundaries.add("process-exec");
  }
  if (hasHintToken(normalized, [
    "auth",
    "login",
    "token",
    "session",
    "oauth",
    "jwt"
  ])) {
    boundaries.add("auth");
    boundaries.add("user-input");
  }
  return [...boundaries];
}
function featureHintMetadata(nameOrPath) {
  return {
    featureKind: inferFeatureKind(nameOrPath),
    trustBoundaries: inferTrustBoundaries(nameOrPath)
  };
}

// dist/clients/lsp-document-symbols.js
var LSP_DOCUMENT_SYMBOL_TIMEOUT_MS = 150;
var SYMBOL_KIND_NAMES = {
  1: "file",
  2: "module",
  3: "namespace",
  4: "package",
  5: "class",
  6: "method",
  7: "property",
  8: "field",
  9: "constructor",
  10: "enum",
  11: "interface",
  12: "function",
  13: "variable",
  14: "constant",
  15: "string",
  16: "number",
  17: "boolean",
  18: "array",
  19: "object",
  20: "key",
  21: "null",
  22: "enum-member",
  23: "struct",
  24: "event",
  25: "operator",
  26: "type-parameter"
};
function lspSymbolKindName(kind) {
  return SYMBOL_KIND_NAMES[kind] ?? `lsp-symbol-${kind}`;
}
async function getOpenDocumentSymbols(filePath, timeoutMs = LSP_DOCUMENT_SYMBOL_TIMEOUT_MS) {
  const spawned = await getLSPService().getWarmClientForFile(filePath);
  if (!spawned || !spawned.client.isDocumentOpen(filePath) || !spawned.client.getOperationSupport().documentSymbol) {
    return void 0;
  }
  let timer;
  try {
    return await Promise.race([
      spawned.client.documentSymbol(filePath),
      new Promise((resolve2) => {
        timer = setTimeout(() => resolve2(void 0), timeoutMs);
      })
    ]);
  } catch {
    return void 0;
  } finally {
    if (timer)
      clearTimeout(timer);
  }
}
function containerNameChain(symbol, allSymbols) {
  const chain = [];
  const seen = /* @__PURE__ */ new Set();
  let container = symbol.containerName;
  while (container && !seen.has(container) && chain.length < 10) {
    chain.unshift(container);
    seen.add(container);
    container = allSymbols?.find((candidate) => candidate.name === container)?.containerName;
  }
  return chain;
}

// dist/clients/project-scan-policy.js
function collectProjectSourceFilesWithBudgetAsync(rootDir, options) {
  return collectSourceFilesWithBudgetAsync(rootDir, options);
}

// dist/clients/review-graph-logger.js
import * as path from "node:path";
var REVIEW_GRAPH_LOG_DIR = getGlobalPiLensLogDir();
var REVIEW_GRAPH_LOG_FILE = path.join(REVIEW_GRAPH_LOG_DIR, "review-graph.log");
var writer = createNdjsonLogger({
  filePath: REVIEW_GRAPH_LOG_FILE,
  maxBytes: getMaxLogSizeMB() * 1024 * 1024,
  backupPath: `${REVIEW_GRAPH_LOG_FILE}.1`
});
function makeReviewGraphBuildMetadata(graph, options = {}) {
  return {
    ...options.buildId === void 0 ? {} : { buildId: options.buildId },
    ...graph.buildGeneration === void 0 ? {} : { graphGeneration: graph.buildGeneration },
    builtAt: graph.builtAt,
    ...options.projectSeq === void 0 ? {} : { projectSeq: options.projectSeq },
    ...options.seqHint === void 0 ? {} : { seqHint: options.seqHint },
    ...options.mode === void 0 ? {} : { mode: options.mode },
    sourceFiles: options.sourceFileCount ?? graph.fileNodes.size,
    ...options.sourceFileCountTruncated || graph.persistCoverage?.sourceFilesTruncated ? { sourceFilesTruncated: true } : {},
    ...options.pathNormalizeCalls === void 0 ? {} : { pathNormalizeCalls: options.pathNormalizeCalls },
    nodes: graph.nodes.size,
    edges: graph.edges.length,
    ...graph.persistCoverage ? { persistCoverage: graph.persistCoverage } : {}
  };
}
function logReviewGraph(entry) {
  if (isTestMode()) {
    return;
  }
  writer.log({
    ts: (/* @__PURE__ */ new Date()).toISOString(),
    ...entry,
    cwd: normalizeFilePath(entry.cwd),
    pid: process.pid,
    turnId: getTurnId()
  });
}
function flushReviewGraphLogSync() {
  writer.flushSync();
}

// dist/clients/review-graph/revision-drift.js
function formatReviewGraphRevisionDriftNote(drift) {
  return `Graph was built at commit ${drift.stampedHead.slice(0, 8)}; HEAD is now ${drift.currentHead.slice(0, 8)}. Results below reflect the earlier revision \u2014 run pilens_rebuild or re-analyze to refresh.`;
}

// dist/clients/review-graph/shared-extraction-ir.js
import { createHash } from "node:crypto";
function reviewGraphIrContentHash(content) {
  return createHash("sha256").update(content).digest("hex");
}
var MAX_ROOTS = 8;
var MAX_FILES_PER_ROOT = 2e4;
var roots = new BoundedFifoMap(MAX_ROOTS);
var accepted = 0;
var rejected = 0;
function rootKey(cwd) {
  return normalizeMapKey(cwd);
}
function publishReviewGraphFileIr(cwd, entry) {
  if (!entry.complete || !entry.structural)
    return;
  const key = rootKey(cwd);
  let files = roots.get(key);
  if (!files) {
    files = new BoundedFifoMap(MAX_FILES_PER_ROOT);
    roots.set(key, files);
  }
  const fileKey = normalizeMapKey(entry.filePath);
  files.delete(fileKey);
  files.set(fileKey, { ...entry, filePath: fileKey });
}
function getFreshReviewGraphFileIr(cwd, filePath, contentHash) {
  const files = roots.get(rootKey(cwd));
  const fileKey = normalizeMapKey(filePath);
  const entry = files?.get(fileKey);
  if (!entry)
    return void 0;
  if (entry.contentHash !== contentHash) {
    rejected++;
    return void 0;
  }
  files?.delete(fileKey);
  accepted++;
  return entry;
}
function clearReviewGraphFileIr(cwd) {
  if (cwd === void 0)
    roots.clear();
  else
    roots.delete(rootKey(cwd));
}

// dist/clients/review-graph/builder.js
var REVIEW_GRAPH_VERSION = "v8";
var MAIN_KINDS = /* @__PURE__ */ new Set([
  "jsts",
  "python",
  "go",
  "rust",
  "ruby",
  "cxx",
  // Languages added in #152: WASMs + symbol queries now available
  "java",
  "kotlin",
  "dart",
  "elixir",
  "csharp",
  "php",
  "swift",
  "lua",
  "ocaml",
  "zig",
  "shell"
]);
var MAIN_KIND_EXTENSIONS = Array.from(MAIN_KINDS).flatMap((kind) => KIND_EXTENSIONS[kind] ?? []);
var CHANGED_SYMBOLS_PREFIX = "session.reviewGraph.changedSymbols:";
var extractorCache = /* @__PURE__ */ new Map();
var REVIEW_GRAPH_MAX_WARM_WORKSPACES = 8;
var REVIEW_GRAPH_SOURCE_PATH_MEMO_ENTRIES = 16384;
var _sourcePathMemos = new BoundedLruCache(REVIEW_GRAPH_MAX_WARM_WORKSPACES);
function sourcePathMemo(cwd) {
  const key = normalizeMapKey(path2.resolve(cwd));
  const existing = _sourcePathMemos.get(key);
  if (existing)
    return existing;
  const memo = {
    cache: new BoundedLruCache(REVIEW_GRAPH_SOURCE_PATH_MEMO_ENTRIES),
    normalizeCalls: { value: 0 }
  };
  _sourcePathMemos.set(key, memo);
  return memo;
}
function normalizeGraphSourcePath(memo, raw) {
  const cached = memo.cache.get(raw);
  if (cached !== void 0)
    return cached;
  const normalized = normalizeMapKey(raw);
  if (fs2.existsSync(raw))
    memo.cache.set(raw, normalized);
  memo.normalizeCalls.value++;
  return normalized;
}
function _resetReviewGraphSourcePathMemoForTests() {
  _sourcePathMemos.clear();
}
var _buildCache = /* @__PURE__ */ new Map();
var _workspaceGraphCache = /* @__PURE__ */ new Map();
var REVIEW_GRAPH_IDLE_EVICT_MS_DEFAULT = 20 * 6e4;
var _workspaceCacheEpoch = 0;
var _workspaceCacheEpochs = /* @__PURE__ */ new Map();
function workspaceCacheEpoch(key) {
  return _workspaceCacheEpoch + (_workspaceCacheEpochs.get(key) ?? 0);
}
function reviewGraphIdleEvictMs() {
  const value = Number.parseInt(process.env.PI_LENS_REVIEW_GRAPH_IDLE_EVICT_MS ?? "", 10);
  return Number.isSafeInteger(value) && value > 0 ? value : REVIEW_GRAPH_IDLE_EVICT_MS_DEFAULT;
}
function clearWorkspaceGraphTimer(entry) {
  if (entry.idleTimer)
    clearTimeout(entry.idleTimer);
  entry.idleTimer = void 0;
}
function buildCacheWorkspaceKey(cwd) {
  return normalizeMapKey(path2.resolve(cwd));
}
function buildCacheKeyWorkspace(buildKey) {
  const separator = buildKey.indexOf("|");
  return separator >= 0 ? buildKey.slice(0, separator) : void 0;
}
function evictWorkspaceGraph(key, entry) {
  if (_workspaceGraphCache.get(key) !== entry)
    return;
  clearWorkspaceGraphTimer(entry);
  const buildWorkspace = buildCacheWorkspaceKey(key);
  for (const buildKey of _buildCache.keys()) {
    if (buildCacheKeyWorkspace(buildKey) === buildWorkspace) {
      _buildCache.delete(buildKey);
    }
  }
  _sourcePathMemos.delete(key);
  _workspaceCacheEpochs.set(key, (_workspaceCacheEpochs.get(key) ?? 0) + 1);
  _workspaceGraphCache.delete(key);
}
function scheduleWorkspaceGraphEviction(key, entry) {
  clearWorkspaceGraphTimer(entry);
  const epoch = workspaceCacheEpoch(key);
  entry.idleTimer = setTimeout(() => {
    entry.idleTimer = void 0;
    if (_workspaceGraphCache.get(key) !== entry || workspaceCacheEpoch(key) !== epoch)
      return;
    evictWorkspaceGraph(key, entry);
  }, reviewGraphIdleEvictMs());
  entry.idleTimer.unref?.();
}
function touchWorkspaceGraph(key) {
  const entry = _workspaceGraphCache.get(key);
  if (!entry)
    return;
  entry.lastUsedAt = Date.now();
  scheduleWorkspaceGraphEviction(key, entry);
}
var _wasmTrappedFiles = /* @__PURE__ */ new Map();
function stampWasmTrapped(entries, includeCharged) {
  let stamped;
  for (const [file, state] of _wasmTrappedFiles) {
    if ((includeCharged || state === "retry") && entries.has(file)) {
      stamped ??= new Map(entries);
      stamped.set(file, "wasm-trapped");
    }
  }
  return stamped ?? entries;
}
function stampWasmTrappedFiles(stored, includeCharged) {
  const fileSignatures = stampWasmTrapped(stored.fileSignatures, includeCharged);
  if (fileSignatures === stored.fileSignatures)
    return stored;
  return {
    ...stored,
    signature: sourceSignatureFromMap(fileSignatures),
    fileSignatures,
    fileHashes: stored.fileHashes && stampWasmTrapped(stored.fileHashes, includeCharged)
  };
}
function wasmTrappedFileCount(graph) {
  let count = 0;
  for (const file of _wasmTrappedFiles.keys()) {
    if (graph.fileNodes.has(file))
      count++;
  }
  return count;
}
function graphWasmTrapDetail(wasmTrappedFiles) {
  return `review graph degraded \u2014 tree-sitter wasm runtime failure in ${wasmTrappedFiles} file(s)`;
}
function setWorkspaceGraph(key, entry, epoch) {
  if (epoch !== void 0 && workspaceCacheEpoch(key) !== epoch)
    return false;
  const previous = _workspaceGraphCache.get(key);
  if (previous)
    clearWorkspaceGraphTimer(previous);
  const boundedGraph = retainedGraph(key, entry.graph);
  const resident = {
    ...stampWasmTrappedFiles(entry, false),
    graph: boundedGraph,
    lastUsedAt: Date.now()
  };
  _workspaceGraphCache.set(key, resident);
  scheduleWorkspaceGraphEviction(key, resident);
  while (_workspaceGraphCache.size > REVIEW_GRAPH_MAX_WARM_WORKSPACES) {
    const victim = [..._workspaceGraphCache.entries()].sort(([, a], [, b]) => a.lastUsedAt - b.lastUsedAt)[0];
    if (!victim)
      break;
    evictWorkspaceGraph(victim[0], victim[1]);
  }
  return true;
}
var _graphGenerationCounter = 0;
var _buildIdCounter = 0;
var SEQ_FASTPATH_MAX_CHANGES = 32;
var SEQ_FASTPATH_REVERIFY_MS = 5 * 6e4;
var SEQ_FASTPATH_REVERIFY_EVERY = 20;
function graphLogMetadata(graph, options = {}) {
  return makeReviewGraphBuildMetadata(graph, options);
}
function seqFastpathEnabled() {
  const raw = process.env.PI_LENS_GRAPH_SEQ_FASTPATH;
  return raw !== "0" && raw !== "false";
}
var _lastGraphBuildInfo = {
  reused: false,
  mode: "full",
  graphChanged: true
};
var _graphBuildInfoByGraph = /* @__PURE__ */ new WeakMap();
var _anyGraphStamped = false;
function setGraphBuildInfo(graph, info) {
  _lastGraphBuildInfo = info;
  _graphBuildInfoByGraph.set(graph, info);
  _anyGraphStamped = true;
}
function getGraphBuildInfoForGraph(graph) {
  return _graphBuildInfoByGraph.get(graph) ?? _lastGraphBuildInfo;
}
function graphBuildInfoIsTrustworthy(graph) {
  return _graphBuildInfoByGraph.has(graph) || !_anyGraphStamped;
}
function updateGraphBuildInfo(graph, patch) {
  const info = { ...getGraphBuildInfoForGraph(graph), ...patch };
  setGraphBuildInfo(graph, info);
  return info;
}
function clearGraphCache() {
  _buildCache.clear();
}
function clearReviewGraphWorkspaceCache(cwd) {
  if (cwd === void 0) {
    _buildCache.clear();
    for (const entry of _workspaceGraphCache.values())
      clearWorkspaceGraphTimer(entry);
    _workspaceGraphCache.clear();
    _sourcePathMemos.clear();
    _workspaceCacheEpoch++;
    _sizeSkipVerdicts.clear();
    _retainedGraphSites.clear();
  } else {
    const normalized = normalizeMapKey(cwd);
    const buildWorkspace = buildCacheWorkspaceKey(cwd);
    for (const key of _buildCache.keys()) {
      if (buildCacheKeyWorkspace(key) === buildWorkspace) {
        _buildCache.delete(key);
      }
    }
    const entry = _workspaceGraphCache.get(normalized);
    if (entry)
      clearWorkspaceGraphTimer(entry);
    _workspaceCacheEpochs.set(normalized, (_workspaceCacheEpochs.get(normalized) ?? 0) + 1);
    _workspaceGraphCache.delete(normalized);
    _sourcePathMemos.delete(normalized);
    _sizeSkipVerdicts.delete(normalized);
  }
  _lastGraphBuildInfo = { reused: false, mode: "full", graphChanged: true };
  _anyGraphStamped = false;
}
var _reviewGraphBuildGateForTests;
function _setReviewGraphBuildGateForTests(gate) {
  _reviewGraphBuildGateForTests = gate;
}
var REVIEW_GRAPH_NODE_RESIDENT_BYTES = 450.5;
var REVIEW_GRAPH_EDGE_RESIDENT_BYTES = 243;
function estimateReviewGraphStoreBytes(totalNodes, totalEdges) {
  return totalNodes * REVIEW_GRAPH_NODE_RESIDENT_BYTES + totalEdges * REVIEW_GRAPH_EDGE_RESIDENT_BYTES;
}
var GRAPH_MAX_IN_MEMORY_BYTES_DEFAULT = 512 * 1024 * 1024;
function graphMaxInMemoryBytes() {
  const raw = Number(process.env.PI_LENS_GRAPH_MAX_IN_MEMORY_BYTES);
  return Number.isFinite(raw) && raw > 0 ? raw : GRAPH_MAX_IN_MEMORY_BYTES_DEFAULT;
}
function retainedGraph(cwd, graph) {
  const nodes = graph.nodes.size;
  const edges = graph.edges.length;
  const bytes = estimateReviewGraphStoreBytes(nodes, edges);
  const budget = graphMaxInMemoryBytes();
  if (bytes <= budget)
    return graph;
  const elementCap = Math.max(1, Math.floor((nodes + edges) * budget / bytes));
  let capped = capGraphForPersist(cwd, graph, elementCap);
  if (capped.nodes.size === 0 && nodes > 0) {
    capped = headSliceGraph(graph, elementCap);
    incrementDegradationCount({
      kind: "review-graph-memory-cap-floor",
      subject: cwd,
      reason: `centrality selection retained 0 of ${nodes} nodes at cap ${elementCap}; fell back to a ${capped.nodes.size}-node head slice`
    });
  }
  const cappedNodes = capped.nodes.size;
  const cappedEdges = capped.edges.length;
  capped.persistCoverage = {
    ...capped.persistCoverage ?? graphCoverage(capped, elementCap),
    partial: true,
    capTrimmed: true
  };
  incrementDegradationCount({
    kind: "review-graph-memory-cap",
    subject: cwd,
    reason: `live graph ${nodes}n/${edges}e ~${Math.round(bytes / (1024 * 1024))}MiB over ${Math.round(budget / (1024 * 1024))}MiB budget; trimmed to ${cappedNodes}n/${cappedEdges}e ~${Math.round(estimateReviewGraphStoreBytes(cappedNodes, cappedEdges) / (1024 * 1024))}MiB`
  });
  return capped;
}
function headSliceGraph(graph, cap) {
  const nodeBudget = Math.max(1, Math.floor(cap * graph.nodes.size / (graph.nodes.size + graph.edges.length)));
  const keptIds = /* @__PURE__ */ new Set();
  for (const [id] of graph.nodes) {
    if (keptIds.size >= nodeBudget)
      break;
    keptIds.add(id);
  }
  const nodes = new Map([...graph.nodes].filter(([id]) => keptIds.has(id)));
  const edgeBudget = Math.max(0, cap - nodes.size);
  const edges = graph.edges.filter((edge) => keptIds.has(edge.from) && keptIds.has(edge.to)).slice(0, edgeBudget);
  const sliced = {
    ...graph,
    nodes,
    edges,
    edgesByFrom: /* @__PURE__ */ new Map(),
    edgesByTo: /* @__PURE__ */ new Map(),
    fileNodes: /* @__PURE__ */ new Map(),
    symbolNodesByFile: /* @__PURE__ */ new Map(),
    changedSymbolsByFile: /* @__PURE__ */ new Map(),
    persistCoverage: void 0
  };
  rebuildIndexes(sliced);
  return sliced;
}
function setSessionReviewGraphFact(cwd, facts, graph) {
  const retained = retainedGraph(cwd, graph);
  registerRetainedGraph(`fact:${cwd}`, retained);
  facts.setSessionFact("session.reviewGraph", retained);
}
var _retainedGraphSites = /* @__PURE__ */ new Map();
function registerRetainedGraph(site, graph) {
  for (const [key, ref] of _retainedGraphSites) {
    if (ref.deref() === void 0)
      _retainedGraphSites.delete(key);
  }
  _retainedGraphSites.set(site, new WeakRef(graph));
}
function getReviewGraphWorkspaceCacheSnapshot() {
  let totalNodes = 0;
  let totalEdges = 0;
  const counted = /* @__PURE__ */ new Set();
  const count = (graph) => {
    if (counted.has(graph))
      return;
    counted.add(graph);
    totalNodes += graph.nodes.size;
    totalEdges += graph.edges.length;
  };
  for (const entry of _workspaceGraphCache.values())
    count(entry.graph);
  for (const [key, ref] of _retainedGraphSites) {
    const graph = ref.deref();
    if (graph === void 0) {
      _retainedGraphSites.delete(key);
      continue;
    }
    count(graph);
  }
  return {
    cacheEntries: _workspaceGraphCache.size,
    totalNodes,
    totalEdges,
    residentBytes: estimateReviewGraphStoreBytes(totalNodes, totalEdges)
  };
}
function _getReviewGraphWorkspaceCacheKeysForTests() {
  return [..._workspaceGraphCache.entries()].sort(([, a], [, b]) => a.lastUsedAt - b.lastUsedAt).map(([key]) => key);
}
function _setReviewGraphWorkspaceEntryForTests(key, graph) {
  setWorkspaceGraph(key, {
    signature: "test",
    fileSignatures: /* @__PURE__ */ new Map(),
    graph
  });
}
function _setSessionReviewGraphFactForTests(cwd, facts, graph) {
  setSessionReviewGraphFact(cwd, facts, graph);
}
function _persistedCoverageForTests(coverage) {
  return stripProcessLocalCoverage(coverage);
}
function _getReviewGraphWorkspaceGraphForTests(key) {
  return _workspaceGraphCache.get(key)?.graph;
}
function _getReviewGraphCacheStateForTests(cwd) {
  const cached = _workspaceGraphCache.get(normalizeMapKey(cwd));
  if (!cached)
    return void 0;
  touchWorkspaceGraph(normalizeMapKey(cwd));
  return {
    signature: cached.signature,
    fileSignatures: new Map(cached.fileSignatures),
    fileHashes: cached.fileHashes ? new Map(cached.fileHashes) : void 0
  };
}
function getReviewGraphCacheIdentity(cwd, graph) {
  const cached = _workspaceGraphCache.get(normalizeMapKey(cwd));
  if (!cached)
    return void 0;
  touchWorkspaceGraph(normalizeMapKey(cwd));
  if (graph) {
    if (cached.buildGeneration === void 0 && graph.buildGeneration === void 0) {
      if (cached.graph !== graph)
        return void 0;
    } else if (cached.buildGeneration !== graph.buildGeneration) {
      return void 0;
    }
  }
  const version = graph?.version ?? cached.graph.version;
  if (typeof version !== "string" || version.length === 0 || typeof cached.signature !== "string") {
    return void 0;
  }
  return { version, signature: cached.signature };
}
var _cwdWorktreeCheckedCwds = /* @__PURE__ */ new Set();
function _resetCwdWorktreeMismatchLogForTests() {
  _cwdWorktreeCheckedCwds.clear();
}
function logCwdWorktreeMismatchOnce(cwd, resolveIdentity = resolveGitIdentity) {
  const key = normalizeMapKey(cwd);
  if (_cwdWorktreeCheckedCwds.has(key))
    return;
  _cwdWorktreeCheckedCwds.add(key);
  const identity = resolveIdentity(cwd);
  if (!identity)
    return;
  if (identity.worktreeRoot === normalizeFilePath(path2.resolve(cwd)))
    return;
  logLatency({
    type: "phase",
    phase: "review_graph_cwd_worktree_mismatch",
    filePath: cwd,
    durationMs: 0,
    metadata: { cwd, worktreeRoot: identity.worktreeRoot }
  });
}
function getLastGraphBuildInfo() {
  return _lastGraphBuildInfo;
}
function _setLastGraphBuildInfoForTests(info) {
  _lastGraphBuildInfo = info;
}
function ensureIndexed(graph) {
  if (graph.edges.length > 0 && graph.edgesByFrom.size === 0) {
    rebuildIndexes(graph);
  }
}
function getCachedReviewGraph(cwd) {
  const key = normalizeMapKey(cwd);
  if (getReviewGraphSizeSkipVerdict(cwd))
    return void 0;
  const cached = _workspaceGraphCache.get(key);
  if (cached) {
    touchWorkspaceGraph(key);
    ensureIndexed(cached.graph);
    return cached.graph;
  }
  const disk = loadPersistedGraph(cwd, {
    verifyWorktreeIdentity: true,
    allowPartial: true
  });
  if (!disk)
    return void 0;
  setWorkspaceGraph(key, {
    signature: disk.signature,
    fileSignatures: disk.fileSignatures,
    fileHashes: disk.fileHashes,
    graph: disk.graph,
    // Durable half of the drift fact. The current-HEAD half is never cached
    // beside it — see getReviewGraphRevisionDrift (#1961 review F3).
    ...disk.stampedHead ? { snapshotStampedHead: disk.stampedHead } : {}
  });
  return disk.graph;
}
function getReviewGraphRevisionDrift(cwd) {
  const entry = _workspaceGraphCache.get(normalizeMapKey(cwd));
  const stampedHead = entry?.snapshotStampedHead;
  if (!stampedHead)
    return void 0;
  const current = resolveGitIdentity(cwd);
  if (!current || current.headCommit === stampedHead)
    return void 0;
  return { stampedHead, currentHead: current.headCommit };
}
function makeCtx(filePath, cwd, facts) {
  return {
    filePath,
    cwd,
    kind: detectFileKind(filePath),
    fileRole: detectFileRole(filePath),
    pi: { getFlag: () => void 0 },
    autofix: false,
    deltaMode: false,
    facts,
    blockingOnly: false,
    modifiedRanges: void 0,
    hasTool: async () => false,
    log: () => {
    }
  };
}
function createEmptyGraph() {
  return {
    version: REVIEW_GRAPH_VERSION,
    builtAt: (/* @__PURE__ */ new Date()).toISOString(),
    nodes: /* @__PURE__ */ new Map(),
    edges: [],
    edgesByFrom: /* @__PURE__ */ new Map(),
    edgesByTo: /* @__PURE__ */ new Map(),
    fileNodes: /* @__PURE__ */ new Map(),
    symbolNodesByFile: /* @__PURE__ */ new Map(),
    changedSymbolsByFile: /* @__PURE__ */ new Map()
  };
}
function cloneGraph(graph) {
  return {
    version: graph.version,
    builtAt: graph.builtAt,
    nodes: new Map(graph.nodes),
    // Edges are immutable values: update paths replace/filter entries rather
    // than mutating them, so copying the array is sufficient isolation.
    edges: [...graph.edges],
    edgesByFrom: /* @__PURE__ */ new Map(),
    edgesByTo: /* @__PURE__ */ new Map(),
    fileNodes: /* @__PURE__ */ new Map(),
    symbolNodesByFile: /* @__PURE__ */ new Map(),
    changedSymbolsByFile: new Map(graph.changedSymbolsByFile),
    // Carry the partial-coverage marker so a clone can never silently pose as
    // a complete graph (#936 review). The build path additionally refuses a
    // partial base outright; this keeps any other cloner honest.
    persistCoverage: graph.persistCoverage
  };
}
function refreshGraphBuiltAt(graph) {
  graph.builtAt = (/* @__PURE__ */ new Date()).toISOString();
}
function sourceSignatureEntry(file) {
  try {
    const stat = fs2.statSync(file);
    return `${stat.size}:${stat.mtimeMs}`;
  } catch {
    return "missing";
  }
}
var STAT_YIELD_EVERY = 100;
var yieldToLoop = () => new Promise((resolve2) => setImmediate(resolve2));
async function sourceSignatureMapAsync(files) {
  const signatures = /* @__PURE__ */ new Map();
  let sinceYield = 0;
  for (const file of files) {
    signatures.set(file, sourceSignatureEntry(file));
    if (++sinceYield >= STAT_YIELD_EVERY) {
      sinceYield = 0;
      await yieldToLoop();
    }
  }
  return signatures;
}
function sourceSignatureFromMap(signatures) {
  return [...signatures.entries()].sort(([a], [b]) => compareOrdinal(a, b)).map(([file, signature]) => `${file}:${signature}`).join("|");
}
function contentHashEntry(file) {
  try {
    return createHash2("sha256").update(fs2.readFileSync(file)).digest("hex");
  } catch {
    return "missing";
  }
}
async function confirmContentChanged(candidates, previousHashes) {
  const prior = previousHashes ?? /* @__PURE__ */ new Map();
  const hashes = new Map(prior);
  const trulyChanged = [];
  let sinceYield = 0;
  for (const file of candidates) {
    const hash = contentHashEntry(file);
    hashes.set(file, hash);
    if (prior.get(file) !== hash)
      trulyChanged.push(file);
    if (++sinceYield >= STAT_YIELD_EVERY) {
      sinceYield = 0;
      await yieldToLoop();
    }
  }
  return { trulyChanged, hashes };
}
function diffSignatureMaps(previous, next) {
  const added = [];
  const changed = [];
  for (const [file, signature] of next) {
    const oldSignature = previous.get(file);
    if (oldSignature === void 0)
      added.push(file);
    else if (oldSignature !== signature)
      changed.push(file);
  }
  const removed = [];
  for (const file of previous.keys()) {
    if (!next.has(file))
      removed.push(file);
  }
  return { added, removed, changed };
}
function getReviewGraphMaxFiles(cwd) {
  const override = Number.parseInt(process.env.PI_LENS_REVIEW_GRAPH_MAX_FILES ?? "", 10);
  return Number.isFinite(override) && override > 0 ? override : getReviewGraphMaxFilesDerived(cwd);
}
function getReviewGraphMaxFileBytes() {
  const override = Number.parseInt(process.env.PI_LENS_REVIEW_GRAPH_MAX_FILE_BYTES ?? "", 10);
  return Number.isFinite(override) && override > 0 ? override : RUNTIME_CONFIG.reviewGraph.maxFileBytes;
}
function isWithinReviewGraphSizeLimit(file) {
  try {
    return fs2.statSync(file).size <= getReviewGraphMaxFileBytes();
  } catch {
    return false;
  }
}
var DEFAULT_REVIEW_GRAPH_SIZE_SKIP_TTL_MS = 15 * 6e4;
var _sizeSkipTtl = lazyEnvNumber("PI_LENS_REVIEW_GRAPH_SIZE_SKIP_TTL_MS", DEFAULT_REVIEW_GRAPH_SIZE_SKIP_TTL_MS);
var _resetReviewGraphSizeSkipTtlForTests = _sizeSkipTtl._resetForTests;
var _buildAttempts = /* @__PURE__ */ new Map();
function getLastReviewGraphBuildAttempt(cwd) {
  return _buildAttempts.get(normalizeMapKey(cwd));
}
function _resetReviewGraphBuildAttemptsForTests() {
  _buildAttempts.clear();
}
function recordBuildAttempt(cwd, outcome, reason, buildId) {
  const key = normalizeMapKey(cwd);
  const prior = _buildAttempts.get(key);
  if (prior?.buildId !== void 0 && (buildId === void 0 || buildId < prior.buildId)) {
    return;
  }
  _buildAttempts.set(key, {
    when: (/* @__PURE__ */ new Date()).toISOString(),
    outcome,
    ...buildId === void 0 ? {} : { buildId },
    ...reason ? { reason } : {}
  });
}
function recordPersistFailure(cwd, reason, error, pending, workerState) {
  const prior = _buildAttempts.get(normalizeMapKey(cwd));
  const pendingBuildId = pending?.graphMetadata.buildId;
  const belongsToCurrentBuild = pendingBuildId === void 0 || prior?.buildId === pendingBuildId;
  if (belongsToCurrentBuild && (prior === void 0 || prior.outcome === "succeeded")) {
    recordBuildAttempt(cwd, "succeeded", `graph built but persistence failed: ${error}`, pendingBuildId);
  }
  logReviewGraph({
    cwd,
    phase: "persist_failed",
    reason,
    error,
    ...pending ? {
      observability: persistObservability(pending, {
        status: "failed",
        reason: workerState?.fallbackReason ?? reason,
        workerStarted: workerState?.started,
        workerCompleted: workerState?.completed,
        ...workerState?.fallbackReason ? { workerFallback: true } : {}
      })
    } : {}
  });
}
var _sizeSkipVerdicts = /* @__PURE__ */ new Map();
function _resetReviewGraphSizeSkipVerdictsForTests() {
  _sizeSkipVerdicts.clear();
}
function recordReviewGraphSizeSkip(cwd, sourceFileCount, maxFileCount) {
  _sizeSkipVerdicts.set(normalizeMapKey(cwd), {
    sourceFileCount,
    maxFileCount,
    sourceFileCountTruncated: true,
    skippedAt: Date.now()
  });
}
function clearReviewGraphSizeSkip(cwd) {
  _sizeSkipVerdicts.delete(normalizeMapKey(cwd));
}
var REVIEW_GRAPH_SIZE_NEAR_MISS_RATIO = 0.05;
function isReviewGraphSizeNearMiss(sourceFileCount, maxFileCount) {
  return sourceFileCount > maxFileCount && sourceFileCount <= maxFileCount * (1 + REVIEW_GRAPH_SIZE_NEAR_MISS_RATIO);
}
function getReviewGraphSizeSkipVerdict(cwd, now = Date.now()) {
  const key = normalizeMapKey(cwd);
  const verdict = _sizeSkipVerdicts.get(key);
  if (!verdict)
    return void 0;
  if (now - verdict.skippedAt >= _sizeSkipTtl.get()) {
    _sizeSkipVerdicts.delete(key);
    return void 0;
  }
  return verdict;
}
var _reviewGraphEntryBudgetForTests;
function _setReviewGraphEntryBudgetForTests(maxScanEntries) {
  _reviewGraphEntryBudgetForTests = maxScanEntries;
}
var _reviewGraphEntryCounterForTests;
function _setReviewGraphEntryCounterForTests(counter) {
  _reviewGraphEntryCounterForTests = counter;
}
async function getGraphSourceFiles(cwd) {
  const sourceMemo = sourcePathMemo(cwd);
  const normalizeCallsBefore = sourceMemo.normalizeCalls.value;
  const maxGraphFiles = getReviewGraphMaxFiles(cwd);
  const { files: collected, entryBudgetExceeded } = await collectProjectSourceFilesWithBudgetAsync(cwd, {
    // Only walk graph-relevant extensions so the cap counts what the graph
    // keeps (post-filter), not JSON/YAML/MD noise it would discard anyway.
    extensions: MAIN_KIND_EXTENSIONS,
    maxFiles: maxGraphFiles + 1,
    ..._reviewGraphEntryBudgetForTests === void 0 ? {} : { maxScanEntries: _reviewGraphEntryBudgetForTests },
    ..._reviewGraphEntryCounterForTests === void 0 ? {} : { onEntryVisited: _reviewGraphEntryCounterForTests }
  });
  if (entryBudgetExceeded) {
    logLatency({
      type: "phase",
      phase: "review_graph_source_walk_entry_budget",
      filePath: cwd,
      durationMs: 0,
      metadata: { cwd, collectedFiles: collected.length }
    });
  }
  if (collected.length > maxGraphFiles) {
    return {
      files: collected,
      pathNormalizeCalls: sourceMemo.normalizeCalls.value - normalizeCallsBefore,
      sourceFileCount: collected.length,
      maxFileCount: maxGraphFiles,
      entryBudgetExceeded
    };
  }
  const result = [];
  let sinceYield = 0;
  for (const raw of collected) {
    const file = normalizeGraphSourcePath(sourceMemo, raw);
    const kind = detectFileKind(file);
    if (!!kind && MAIN_KINDS.has(kind) && detectFileRole(file) !== "test" && isWithinReviewGraphSizeLimit(file)) {
      result.push(file);
    }
    if (++sinceYield >= STAT_YIELD_EVERY) {
      sinceYield = 0;
      await yieldToLoop();
    }
  }
  return {
    files: result,
    pathNormalizeCalls: sourceMemo.normalizeCalls.value - normalizeCallsBefore,
    sourceFileCount: result.length,
    maxFileCount: maxGraphFiles,
    entryBudgetExceeded
  };
}
function addNode(graph, node) {
  const isNew = !graph.nodes.has(node.id);
  graph.nodes.set(node.id, node);
  if (node.kind === "file" && node.filePath) {
    graph.fileNodes.set(node.filePath, node.id);
    return;
  }
  if (isNew && node.kind === "symbol" && node.filePath) {
    const ids = graph.symbolNodesByFile.get(node.filePath) ?? [];
    ids.push(node.id);
    graph.symbolNodesByFile.set(node.filePath, ids);
  }
}
function indexEdge(graph, edge) {
  const from = graph.edgesByFrom.get(edge.from) ?? [];
  from.push(edge);
  graph.edgesByFrom.set(edge.from, from);
  const to = graph.edgesByTo.get(edge.to) ?? [];
  to.push(edge);
  graph.edgesByTo.set(edge.to, to);
}
function unindexEdge(graph, edge) {
  const from = graph.edgesByFrom.get(edge.from);
  if (from) {
    _rebuildCounters.removeOwnedEdgePositions += from.length;
    const at = from.indexOf(edge);
    if (at >= 0)
      from.splice(at, 1);
    if (from.length === 0)
      graph.edgesByFrom.delete(edge.from);
  }
  const to = graph.edgesByTo.get(edge.to);
  if (to) {
    _rebuildCounters.removeOwnedEdgePositions += to.length;
    const at = to.indexOf(edge);
    if (at >= 0)
      to.splice(at, 1);
    if (to.length === 0)
      graph.edgesByTo.delete(edge.to);
  }
}
function unindexEdges(graph, removedEdges) {
  const fromIds = /* @__PURE__ */ new Set();
  const toIds = /* @__PURE__ */ new Set();
  for (const edge of removedEdges) {
    fromIds.add(edge.from);
    toIds.add(edge.to);
  }
  for (const fromId of fromIds) {
    const bucket = graph.edgesByFrom.get(fromId);
    if (!bucket)
      continue;
    const kept = [];
    for (const edge of bucket) {
      _rebuildCounters.removeOwnedEdgePositions++;
      if (!removedEdges.has(edge))
        kept.push(edge);
    }
    if (kept.length === 0)
      graph.edgesByFrom.delete(fromId);
    else
      graph.edgesByFrom.set(fromId, kept);
  }
  for (const toId of toIds) {
    const bucket = graph.edgesByTo.get(toId);
    if (!bucket)
      continue;
    const kept = [];
    for (const edge of bucket) {
      _rebuildCounters.removeOwnedEdgePositions++;
      if (!removedEdges.has(edge))
        kept.push(edge);
    }
    if (kept.length === 0)
      graph.edgesByTo.delete(toId);
    else
      graph.edgesByTo.set(toId, kept);
  }
}
function addEdge(graph, edge) {
  graph.edges.push(edge);
  indexEdge(graph, edge);
}
function rebuildIndexes(graph) {
  graph.edgesByFrom = /* @__PURE__ */ new Map();
  graph.edgesByTo = /* @__PURE__ */ new Map();
  graph.fileNodes = /* @__PURE__ */ new Map();
  graph.symbolNodesByFile = /* @__PURE__ */ new Map();
  for (const node of graph.nodes.values()) {
    if (node.kind === "file" && node.filePath) {
      graph.fileNodes.set(node.filePath, node.id);
    }
    if (node.kind === "symbol" && node.filePath) {
      const ids = graph.symbolNodesByFile.get(node.filePath) ?? [];
      ids.push(node.id);
      graph.symbolNodesByFile.set(node.filePath, ids);
    }
  }
  for (const edge of graph.edges) {
    const from = graph.edgesByFrom.get(edge.from) ?? [];
    from.push(edge);
    graph.edgesByFrom.set(edge.from, from);
    const to = graph.edgesByTo.get(edge.to) ?? [];
    to.push(edge);
    graph.edgesByTo.set(edge.to, to);
  }
}
var GRAPH_CACHE_FILENAME = "review-graph.json.gz";
var LEGACY_GRAPH_CACHE_FILENAME = "review-graph.json";
var GRAPH_CHECKPOINT_FILENAME = "review-graph.checkpoint.json.gz";
function logSnapshotReadVerdict(cwd, phase, reason) {
  const verdict = phase === "snapshot_read_dropped" ? "dropped" : "drifted";
  const isRisingEdge = incrementDegradationCount({
    kind: "review-graph-snapshot-read",
    // Subject keeps BOTH discriminators, so aggregation still answers which
    // workspace and which verdict after the detailed records stop.
    subject: `${verdict}:${normalizeMapKey(cwd)}`,
    reason
  });
  if (!isRisingEdge)
    return;
  logReviewGraph({ cwd, phase, reason });
}
function loadPersistedGraph(cwd, opts, resolveIdentity = resolveGitIdentity) {
  const cacheDir = path2.join(getProjectDataDir(cwd), "cache");
  const cachePath = path2.join(cacheDir, GRAPH_CACHE_FILENAME);
  const legacyPath = path2.join(cacheDir, LEGACY_GRAPH_CACHE_FILENAME);
  try {
    const raw = fs2.existsSync(cachePath) ? gunzipSync(fs2.readFileSync(cachePath)).toString("utf-8") : fs2.readFileSync(legacyPath, "utf-8");
    const data = JSON.parse(raw);
    if (data.version !== REVIEW_GRAPH_VERSION || typeof data.signature !== "string" || typeof data.builtAt !== "string" || !Array.isArray(data.nodes) || !Array.isArray(data.edges))
      return null;
    if (data.coverage?.partial && !opts?.allowPartial)
      return null;
    let stampedHead;
    if (opts?.verifyWorktreeIdentity && data.gitStamp) {
      const current = resolveIdentity(cwd);
      if (current && current.worktreeRoot !== data.gitStamp.worktreeRoot) {
        logSnapshotReadVerdict(cwd, "snapshot_read_dropped", "worktree_mismatch");
        return null;
      }
      if (current && current.headCommit !== data.gitStamp.headCommit) {
        stampedHead = data.gitStamp.headCommit;
        logSnapshotReadVerdict(cwd, "snapshot_read_drifted", "head_moved");
      }
    }
    const graph = {
      version: data.version,
      builtAt: data.builtAt,
      nodes: new Map(data.nodes),
      edges: data.edges,
      edgesByFrom: /* @__PURE__ */ new Map(),
      edgesByTo: /* @__PURE__ */ new Map(),
      fileNodes: /* @__PURE__ */ new Map(),
      symbolNodesByFile: /* @__PURE__ */ new Map(),
      changedSymbolsByFile: /* @__PURE__ */ new Map(),
      persistCoverage: data.coverage
    };
    rebuildIndexes(graph);
    return {
      signature: data.signature,
      fileSignatures: new Map(data.fileSignatures ?? []),
      fileHashes: new Map(data.fileHashes ?? []),
      graph,
      ...stampedHead ? { stampedHead } : {}
    };
  } catch {
    return null;
  }
}
function getPersistedReviewGraphVersion(cwd) {
  const cacheDir = path2.join(getProjectDataDir(cwd), "cache");
  const cachePath = path2.join(cacheDir, GRAPH_CACHE_FILENAME);
  const legacyPath = path2.join(cacheDir, LEGACY_GRAPH_CACHE_FILENAME);
  if (fs2.existsSync(cachePath)) {
    let fd2;
    try {
      fd2 = fs2.openSync(cachePath, "r");
      const compressed = Buffer.alloc(4096);
      const n = fs2.readSync(fd2, compressed, 0, compressed.length, 0);
      const head = gunzipSync(compressed.subarray(0, n), {
        finishFlush: zlibConstants.Z_SYNC_FLUSH
      }).toString("utf-8");
      const match = head.match(/"version"\s*:\s*"([^"]+)"/);
      return match ? match[1] : null;
    } catch {
      return null;
    } finally {
      if (fd2 !== void 0) {
        try {
          fs2.closeSync(fd2);
        } catch {
        }
      }
    }
  }
  let fd;
  try {
    fd = fs2.openSync(legacyPath, "r");
    const buf = Buffer.alloc(200);
    const n = fs2.readSync(fd, buf, 0, 200, 0);
    const match = buf.toString("utf-8", 0, n).match(/"version"\s*:\s*"([^"]+)"/);
    return match ? match[1] : null;
  } catch {
    return null;
  } finally {
    if (fd !== void 0) {
      try {
        fs2.closeSync(fd);
      } catch {
      }
    }
  }
}
function isReviewGraphMigrationNeeded(cwd) {
  const version = getPersistedReviewGraphVersion(cwd);
  return version !== null && version !== REVIEW_GRAPH_VERSION;
}
var GRAPH_PERSIST_DEBOUNCE_MS_DEFAULT = 1500;
var GRAPH_PERSIST_MAX_ELEMENTS_DEFAULT = 5e5;
function graphPersistDebounceMs() {
  const raw = Number(process.env.PI_LENS_GRAPH_PERSIST_DEBOUNCE_MS);
  return Number.isFinite(raw) && raw >= 0 ? raw : GRAPH_PERSIST_DEBOUNCE_MS_DEFAULT;
}
function graphPersistMaxElements() {
  const raw = Number(process.env.PI_LENS_GRAPH_PERSIST_MAX_ELEMENTS);
  return Number.isFinite(raw) && raw > 0 ? raw : GRAPH_PERSIST_MAX_ELEMENTS_DEFAULT;
}
var _pendingPersist = /* @__PURE__ */ new Map();
var _persistTimers = /* @__PURE__ */ new Map();
var _persistGenerations = /* @__PURE__ */ new Map();
var _workerRequests = /* @__PURE__ */ new Map();
var _persistWorker;
var _persistWorkerRequestId = 0;
var _persistAttemptId = 0;
var _workerDisabled = false;
var _persistWorkerUnavailableReason;
var _lastWorkerFallbackReasonForTests;
var _persistWorkerHeapStatistics = null;
function refreshReviewGraphPersistWorkerHeapStatistics() {
  const worker = _persistWorker;
  if (!worker || typeof worker.getHeapStatistics !== "function") {
    return Promise.resolve();
  }
  return readWorkerHeapStatistics(worker).then((stats) => {
    if (_persistWorker === worker)
      _persistWorkerHeapStatistics = stats;
  }).catch(() => {
  });
}
function getReviewGraphPersistWorkerHeapStatistics() {
  return _persistWorkerHeapStatistics;
}
var _checkpointGenerations = /* @__PURE__ */ new Map();
var _checkpointWorkerRequests = /* @__PURE__ */ new Map();
var _checkpointOffloadCountForTests = 0;
function persistedData(pending) {
  return {
    version: pending.graph.version,
    builtAt: pending.graph.builtAt,
    signature: pending.signature,
    fileSignatures: Array.from(pending.fileSignatures.entries()),
    fileHashes: pending.fileHashes ? Array.from(pending.fileHashes.entries()) : void 0,
    nodes: Array.from(pending.graph.nodes.entries()),
    edges: pending.graph.edges,
    coverage: stripProcessLocalCoverage(pending.graph.persistCoverage),
    gitStamp: pending.gitStamp
  };
}
function stripProcessLocalCoverage(coverage) {
  if (!coverage?.capTrimmed)
    return coverage;
  const { capTrimmed: _capTrimmed, ...persisted } = coverage;
  return persisted;
}
function countRetainedSourceFiles(graph, sourceFilePaths) {
  if (sourceFilePaths === void 0)
    return graph.fileNodes.size;
  const sourceKeys = new Set(sourceFilePaths);
  let retained = 0;
  for (const filePath of sourceKeys) {
    if (graph.fileNodes.has(filePath))
      retained++;
  }
  return retained;
}
function graphCoverage(graph, cap, sourceFileCount = graph.persistCoverage?.totalFiles ?? graph.fileNodes.size, sourceFilesTruncated = graph.persistCoverage?.sourceFilesTruncated === true, sourceFilePaths) {
  const inherited = graph.persistCoverage;
  return {
    partial: inherited?.partial === true || sourceFilesTruncated,
    cap,
    totalNodes: graph.nodes.size,
    totalEdges: graph.edges.length,
    persistedNodes: graph.nodes.size,
    persistedEdges: graph.edges.length,
    totalFiles: sourceFileCount,
    persistedFiles: countRetainedSourceFiles(graph, sourceFilePaths),
    ...sourceFilesTruncated ? { sourceFilesTruncated: true } : {},
    ...inherited?.inProgress ? { inProgress: true } : {}
  };
}
function capGraphForPersist(cwd, graph, cap, options = {}) {
  const totalElements = graph.nodes.size + graph.edges.length;
  const nodeBudget = Math.max(1, Math.floor(cap * graph.nodes.size / totalElements));
  const reverseDeps = buildReverseDependencyIndexFromGraph({ cwd, graph });
  const rankedFiles = rankFilesByReverseDependencyCentrality(reverseDeps);
  const indexNodesByFile = (fold) => {
    const byFile = /* @__PURE__ */ new Map();
    for (const [id, node] of graph.nodes) {
      if (!node.filePath)
        continue;
      const fileKey = fold ? normalizeMapKey(node.filePath) : node.filePath;
      const ids = byFile.get(fileKey) ?? [];
      ids.push(id);
      byFile.set(fileKey, ids);
    }
    return byFile;
  };
  const reachableNodes = (byFile) => {
    let reached = 0;
    for (const filePath of rankedFiles)
      reached += byFile.get(filePath)?.length ?? 0;
    return reached;
  };
  let placeableNodes = 0;
  for (const node of graph.nodes.values())
    if (node.filePath)
      placeableNodes++;
  let nodeIdsByFile = indexNodesByFile(false);
  if (reachableNodes(nodeIdsByFile) < placeableNodes) {
    const folded = indexNodesByFile(true);
    if (reachableNodes(folded) > reachableNodes(nodeIdsByFile)) {
      nodeIdsByFile = folded;
    }
  }
  const keptIds = /* @__PURE__ */ new Set();
  for (const filePath of rankedFiles) {
    const ids = nodeIdsByFile.get(filePath) ?? [];
    if (ids.length === 0)
      continue;
    const effectiveNodeBudget = keptIds.size === 0 ? Math.max(nodeBudget, Math.min(cap, ids.length)) : nodeBudget;
    if (keptIds.size + ids.length > effectiveNodeBudget)
      continue;
    for (const id of ids)
      keptIds.add(id);
  }
  const nodes = new Map([...graph.nodes].filter(([id]) => keptIds.has(id)));
  const edgeBudget = Math.max(0, cap - nodes.size);
  const edges = graph.edges.filter((edge) => keptIds.has(edge.from) && keptIds.has(edge.to)).slice(0, edgeBudget);
  const coverage = {
    partial: true,
    cap,
    totalNodes: graph.nodes.size,
    totalEdges: graph.edges.length,
    persistedNodes: nodes.size,
    persistedEdges: edges.length,
    totalFiles: options.sourceFileCount ?? graph.persistCoverage?.totalFiles ?? graph.fileNodes.size,
    persistedFiles: 0,
    ...options.sourceFilesTruncated || graph.persistCoverage?.sourceFilesTruncated ? { sourceFilesTruncated: true } : {},
    ...graph.persistCoverage?.inProgress ? { inProgress: true } : {}
  };
  const capped = {
    ...graph,
    nodes,
    edges,
    edgesByFrom: /* @__PURE__ */ new Map(),
    edgesByTo: /* @__PURE__ */ new Map(),
    fileNodes: /* @__PURE__ */ new Map(),
    symbolNodesByFile: /* @__PURE__ */ new Map(),
    changedSymbolsByFile: /* @__PURE__ */ new Map(),
    persistCoverage: void 0
  };
  rebuildIndexes(capped);
  coverage.persistedFiles = countRetainedSourceFiles(capped, options.sourceFilePaths);
  capped.persistCoverage = coverage;
  return capped;
}
function persistObservability(pending, patch) {
  return {
    graph: pending.graphMetadata,
    persistence: { ...pending.persistenceMetadata, ...patch }
  };
}
function logPersistSuccess(key, pending, stats, workerState = { started: false, completed: false }) {
  logLatency({
    type: "phase",
    phase: "review_graph_persist",
    filePath: pending.cachePath,
    durationMs: stats.durationMs,
    metadata: { elements: pending.elementCount, ...stats }
  });
  logReviewGraph({
    cwd: key,
    phase: "persist_succeeded",
    elements: pending.elementCount,
    ...stats,
    durationMs: stats.durationMs,
    observability: persistObservability(pending, {
      status: "succeeded",
      workerStarted: workerState.started,
      workerCompleted: workerState.completed,
      ...workerState.fallback ? { workerFallback: true } : {}
    })
  });
}
function writePendingOnMainThread(key, pending, reason, workerState = { started: false, completed: false }) {
  const persistStarted = performance.now();
  const serializeStarted = performance.now();
  try {
    const json = JSON.stringify(persistedData(pending));
    const serializeMs = performance.now() - serializeStarted;
    const rawBytes = Buffer.byteLength(json);
    const writeStarted = performance.now();
    const gzip = gzipSync(json);
    fs2.mkdirSync(pending.cacheDir, { recursive: true });
    writeFileAtomic(pending.cachePath, gzip, { bestEffort: false });
    fs2.rmSync(path2.join(pending.cacheDir, LEGACY_GRAPH_CACHE_FILENAME), {
      force: true
    });
    logPersistSuccess(key, pending, {
      rawBytes,
      gzBytes: gzip.byteLength,
      serializeMs,
      writeMs: performance.now() - writeStarted,
      durationMs: performance.now() - persistStarted,
      offloaded: false
    }, {
      started: workerState.started,
      completed: workerState.completed,
      fallback: Boolean(reason)
    });
    if (reason) {
      _lastWorkerFallbackReasonForTests = reason;
      logReviewGraph({
        cwd: key,
        phase: "worker_fallback",
        reason: "worker_fallback",
        error: reason,
        offloaded: false,
        observability: persistObservability(pending, {
          status: "fallback",
          workerStarted: workerState.started,
          workerCompleted: workerState.completed,
          workerFallback: true,
          reason: workerState.fallbackReason ?? "worker_fallback"
        })
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    recordPersistFailure(key, "cache_write_failed", message, pending, workerState);
  }
}
function handleWorkerResult(result) {
  const checkpoint = _checkpointWorkerRequests.get(result.id);
  if (checkpoint) {
    handleCheckpointWorkerResult(checkpoint, result);
    return;
  }
  const request = _workerRequests.get(result.id);
  if (!request) {
    fs2.rm(result.stagePath, { force: true }, () => {
    });
    return;
  }
  _workerRequests.delete(result.id);
  const { key, pending } = request;
  const currentGeneration = _persistGenerations.get(key);
  if (currentGeneration !== result.generation) {
    try {
      fs2.rmSync(result.stagePath, { force: true });
    } catch (reapErr) {
      logReviewGraph({
        cwd: key,
        phase: "persist_failed",
        reason: `superseded-stage reap failed: ${String(reapErr)}`
      });
    }
    logReviewGraph({
      cwd: key,
      phase: "persist_skipped",
      reason: "superseded",
      observability: persistObservability(pending, {
        status: "superseded",
        supersededByGeneration: currentGeneration,
        reason: "newer_generation_scheduled",
        workerStarted: true,
        workerCompleted: true
      })
    });
    return;
  }
  if (result.error || result.rawBytes === void 0 || result.gzBytes === void 0 || result.serializeMs === void 0 || result.writeMs === void 0 || result.durationMs === void 0) {
    fs2.rm(result.stagePath, { force: true }, () => {
    });
    writePendingOnMainThread(key, pending, result.error ?? "invalid worker result", {
      started: true,
      completed: true,
      fallbackReason: result.error ? "worker_error" : "invalid_worker_result"
    });
    return;
  }
  try {
    fs2.renameSync(result.stagePath, pending.cachePath);
    fs2.rmSync(path2.join(pending.cacheDir, LEGACY_GRAPH_CACHE_FILENAME), {
      force: true
    });
    logPersistSuccess(key, pending, {
      rawBytes: result.rawBytes,
      gzBytes: result.gzBytes,
      serializeMs: result.serializeMs,
      writeMs: result.writeMs,
      durationMs: result.durationMs,
      offloaded: true
    }, { started: true, completed: true });
  } catch (err) {
    fs2.rm(result.stagePath, { force: true }, () => {
    });
    writePendingOnMainThread(key, pending, err instanceof Error ? err.message : String(err), {
      started: true,
      completed: true,
      fallbackReason: "promotion_failed"
    });
  }
}
function handleCheckpointWorkerResult(cp, result) {
  _checkpointWorkerRequests.delete(result.id);
  if (result.error || result.gzBytes === void 0) {
    logReviewGraph({
      cwd: cp.cwd,
      phase: "checkpoint_write_failed",
      reason: "worker_error",
      error: result.error ?? "worker returned no gz metrics"
    });
    fs2.rm(result.stagePath, { force: true }, () => {
    });
    return;
  }
  if (_checkpointGenerations.get(cp.cwd) !== cp.generation) {
    fs2.rm(result.stagePath, { force: true }, () => {
    });
    return;
  }
  try {
    fs2.renameSync(result.stagePath, cp.checkpointPath);
    logReviewGraph({
      cwd: cp.cwd,
      phase: "checkpoint_written",
      nodes: cp.nodes,
      edges: cp.edges,
      processed: cp.processed,
      target: cp.target,
      offloaded: true
    });
  } catch (err) {
    logReviewGraph({
      cwd: cp.cwd,
      phase: "checkpoint_write_failed",
      reason: "promote_failed",
      error: err instanceof Error ? err.message : String(err)
    });
    fs2.rm(result.stagePath, { force: true }, () => {
    });
  }
}
function handleWorkerDeath(reason) {
  _persistWorkerUnavailableReason = reason;
  _persistWorker = void 0;
  _persistWorkerHeapStatistics = null;
  _workerDisabled = true;
  const requests = [..._workerRequests.values()];
  _workerRequests.clear();
  for (const { key, pending } of requests) {
    if (_persistGenerations.get(key) !== pending.generation) {
      logReviewGraph({
        cwd: key,
        phase: "persist_skipped",
        reason: "superseded",
        observability: persistObservability(pending, {
          status: "superseded",
          supersededByGeneration: _persistGenerations.get(key),
          reason: "worker_death_after_newer_generation",
          workerStarted: true,
          workerCompleted: false
        })
      });
      continue;
    }
    writePendingOnMainThread(key, pending, reason, {
      started: true,
      completed: false,
      fallbackReason: "worker_death"
    });
  }
  const checkpoints = [..._checkpointWorkerRequests.values()];
  _checkpointWorkerRequests.clear();
  for (const cp of checkpoints) {
    logReviewGraph({
      cwd: cp.cwd,
      phase: "checkpoint_write_failed",
      reason: "worker_death",
      error: reason
    });
    fs2.rm(cp.stagePath, { force: true }, () => {
    });
  }
}
function resolvePersistWorkerPath() {
  const candidates = [
    new URL("./persist-worker.js", import.meta.url),
    new URL("./workers/review-graph-persist-worker.js", import.meta.url),
    new URL("../workers/review-graph-persist-worker.js", import.meta.url)
  ];
  for (const url of candidates) {
    try {
      const resolved = fileURLToPath(url);
      if (fs2.existsSync(resolved))
        return resolved;
    } catch {
    }
  }
  return void 0;
}
function getPersistWorker() {
  if (_workerDisabled)
    return void 0;
  if (_persistWorker)
    return _persistWorker;
  try {
    const workerPath = resolvePersistWorkerPath();
    if (workerPath === void 0) {
      handleWorkerDeath("persist worker script not found in any layout");
      return void 0;
    }
    const worker = new Worker(workerPath);
    worker.on("message", handleWorkerResult);
    worker.on("error", (err) => handleWorkerDeath(err.message));
    worker.on("exit", (code) => {
      if (_persistWorker !== worker)
        return;
      const hasPendingRequests = _workerRequests.size > 0 || _checkpointWorkerRequests.size > 0;
      if (code !== 0 || hasPendingRequests) {
        handleWorkerDeath(code !== 0 ? `persist worker exited with code ${code}` : "persist worker exited with pending requests");
      } else {
        _persistWorker = void 0;
        _persistWorkerHeapStatistics = null;
      }
    });
    worker.unref();
    _persistWorker = worker;
    return worker;
  } catch (err) {
    handleWorkerDeath(err instanceof Error ? err.message : String(err));
    return void 0;
  }
}
function writePending(key) {
  const pending = _pendingPersist.get(key);
  if (!pending)
    return;
  _pendingPersist.delete(key);
  const timer = _persistTimers.get(key);
  if (timer) {
    clearTimeout(timer);
    _persistTimers.delete(key);
  }
  const worker = getPersistWorker();
  if (!worker) {
    const unavailableReason = _persistWorkerUnavailableReason ?? "persist worker unavailable";
    writePendingOnMainThread(key, pending, unavailableReason, {
      started: false,
      completed: false,
      fallbackReason: unavailableReason
    });
    return;
  }
  const id = ++_persistWorkerRequestId;
  const stagePath = `${pending.cachePath}.stage-${process.pid}-${pending.generation}`;
  const request = {
    id,
    cwd: key,
    generation: pending.generation,
    stagePath,
    data: persistedData(pending),
    elements: pending.elementCount,
    testDelayMs: process.env.NODE_ENV === "test" ? Number(process.env.PI_LENS_TEST_PERSIST_WORKER_DELAY_MS) || void 0 : void 0
  };
  _workerRequests.set(id, { key, pending });
  worker.postMessage(request);
}
var _persistExitHookInstalled = false;
function flushPendingReviewGraphPersistsAtExit() {
  const keys = /* @__PURE__ */ new Set([
    ..._pendingPersist.keys(),
    ...[..._workerRequests.values()].map((request) => request.key)
  ]);
  for (const key of keys) {
    flushReviewGraphPersist(key, "exit_hook");
  }
  flushReviewGraphLogSync();
  void _persistWorker?.terminate();
}
function flushReviewGraphPersistsForExitForTests() {
  flushPendingReviewGraphPersistsAtExit();
}
function ensurePersistExitHook() {
  if (_persistExitHookInstalled)
    return;
  _persistExitHookInstalled = true;
  process.once("exit", flushPendingReviewGraphPersistsAtExit);
}
var _sweptStageDirs = /* @__PURE__ */ new Set();
var REVIEW_GRAPH_ARTIFACT_PREFIX = "review-graph.";
function sweepStaleStageFiles(cacheDir) {
  if (_sweptStageDirs.has(cacheDir))
    return;
  _sweptStageDirs.add(cacheDir);
  fs2.readdir(cacheDir, (err, entries) => {
    if (err)
      return;
    for (const entry of entries) {
      if (!isStaleStageFile(entry, REVIEW_GRAPH_ARTIFACT_PREFIX))
        continue;
      fs2.rm(path2.join(cacheDir, entry), { force: true }, () => {
      });
    }
  });
}
function _resetReviewGraphStageSweepForTests() {
  _sweptStageDirs.clear();
}
function persistGraph(cwd, signature, fileSignatures, fileHashes, graph, options = {}) {
  const totalElementCount = graph.nodes.size + graph.edges.length;
  const cap = graphPersistMaxElements();
  const sourceFileCount = options.sourceFileCount ?? fileSignatures.size;
  const sourceFilePaths = options.sourceFilePaths ?? fileSignatures.keys();
  const persistedGraph = totalElementCount > cap ? capGraphForPersist(cwd, graph, cap, {
    sourceFileCount,
    sourceFilesTruncated: options.sourceFilesTruncated,
    sourceFilePaths
  }) : {
    ...graph,
    persistCoverage: graphCoverage(graph, cap, sourceFileCount, options.sourceFilesTruncated, sourceFilePaths)
  };
  const elementCount = persistedGraph.nodes.size + persistedGraph.edges.length;
  const sourceWalkPartial = persistedGraph.persistCoverage?.sourceFilesTruncated === true;
  let persistReason;
  if (totalElementCount > cap) {
    const coverage = persistedGraph.persistCoverage;
    if (!coverage)
      return;
    logLatency({
      type: "phase",
      phase: "review_graph_persist",
      filePath: cwd,
      durationMs: 0,
      metadata: {
        partial: true,
        totalElements: totalElementCount,
        persistedElements: elementCount,
        cap
      }
    });
    persistReason = `persisted partial review graph (${elementCount}/${totalElementCount} elements; ${coverage.persistedNodes}/${coverage.totalNodes} nodes, ${coverage.persistedEdges}/${coverage.totalEdges} edges; ${cap} cap)`;
  } else if (sourceWalkPartial) {
    persistReason = "persisted partial review graph (source walk entry budget)";
  }
  const cacheDir = path2.join(getProjectDataDir(cwd), "cache");
  const cachePath = path2.join(cacheDir, GRAPH_CACHE_FILENAME);
  sweepStaleStageFiles(cacheDir);
  const gitStamp = (options.resolveIdentity ?? resolveGitIdentity)(cwd);
  const key = normalizeMapKey(cwd);
  const priorGeneration = _persistGenerations.get(key);
  const existingPending = _pendingPersist.get(key);
  const existingTimer = _persistTimers.get(key);
  const generation = (priorGeneration ?? 0) + 1;
  const attemptId = ++_persistAttemptId;
  const coalesced = Boolean(existingPending || existingTimer);
  _persistGenerations.set(key, generation);
  const graphMetadata = graphLogMetadata(persistedGraph, {
    ...options,
    sourceFileCount,
    sourceFileCountTruncated: persistedGraph.persistCoverage?.sourceFilesTruncated === true
  });
  const persistenceMetadata = {
    generation,
    attemptId,
    status: "scheduled",
    ...priorGeneration === void 0 ? {} : {
      supersededGeneration: priorGeneration,
      coalesced,
      reason: coalesced ? "debounced_coalescing" : "in_flight_supersession"
    }
  };
  const pending = {
    cacheDir,
    cachePath,
    // #3605: a restart re-extracts every trapped file.
    ...stampWasmTrappedFiles({ signature, fileSignatures, fileHashes }, true),
    graph: persistedGraph,
    gitStamp,
    elementCount,
    generation,
    attemptId,
    graphMetadata,
    persistenceMetadata
  };
  if (existingPending) {
    logReviewGraph({
      cwd: key,
      phase: "persist_skipped",
      reason: "superseded",
      observability: persistObservability(existingPending, {
        status: "superseded",
        supersededByGeneration: generation,
        reason: "newer_generation_scheduled",
        workerStarted: false,
        workerCompleted: false
      })
    });
  }
  _pendingPersist.set(key, pending);
  if (totalElementCount > cap || sourceWalkPartial) {
    logReviewGraph({
      cwd,
      phase: "persist_partial",
      reason: totalElementCount > cap ? "element_cap_exceeded" : "source_walk_entry_budget",
      elements: totalElementCount,
      persistedElements: elementCount,
      cap,
      observability: {
        graph: graphMetadata,
        persistence: persistenceMetadata
      }
    });
  }
  logReviewGraph({
    cwd,
    phase: "persist_scheduled",
    elements: elementCount,
    cap,
    observability: {
      graph: graphMetadata,
      persistence: persistenceMetadata
    }
  });
  ensurePersistExitHook();
  const debounce = graphPersistDebounceMs();
  const existing = _persistTimers.get(key);
  if (existing)
    clearTimeout(existing);
  if (debounce === 0) {
    writePending(key);
    return persistReason;
  }
  const timer = setTimeout(() => writePending(key), debounce);
  if (typeof timer.unref === "function")
    timer.unref();
  _persistTimers.set(key, timer);
  return persistReason;
}
var GRAPH_CHECKPOINT_EVERY_FILES_DEFAULT = 250;
var GRAPH_CHECKPOINT_MIN_INTERVAL_MS_DEFAULT = 5e3;
function graphCheckpointEveryFiles() {
  const raw = Number(process.env.PI_LENS_GRAPH_CHECKPOINT_EVERY_FILES);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : GRAPH_CHECKPOINT_EVERY_FILES_DEFAULT;
}
function graphCheckpointMinIntervalMs() {
  const raw = Number(process.env.PI_LENS_GRAPH_CHECKPOINT_MIN_INTERVAL_MS);
  return Number.isFinite(raw) && raw >= 0 ? raw : GRAPH_CHECKPOINT_MIN_INTERVAL_MS_DEFAULT;
}
function reviewGraphCheckpointPath(cwd) {
  return path2.join(getProjectDataDir(cwd), "cache", GRAPH_CHECKPOINT_FILENAME);
}
function hashIgnoredIds(ignoredIds) {
  if (ignoredIds === void 0)
    return "unavailable";
  const joined = [...ignoredIds].sort((a, b) => compareOrdinal(a, b)).join("\0");
  return createHash2("sha256").update(joined).digest("hex");
}
function buildReviewGraphCheckpointData(cwd, graph, processedHashes, targetFileCount, ignoredIds, resolveIdentity = resolveGitIdentity) {
  return {
    version: REVIEW_GRAPH_VERSION,
    builtAt: (/* @__PURE__ */ new Date()).toISOString(),
    inProgress: true,
    targetFileCount,
    processedFiles: Array.from(stampWasmTrapped(processedHashes, true)),
    ignoredIdsHash: hashIgnoredIds(ignoredIds),
    nodes: Array.from(graph.nodes.entries()),
    edges: graph.edges,
    gitStamp: resolveIdentity(cwd)
  };
}
function writeReviewGraphCheckpoint(cwd, graph, processedHashes, targetFileCount, ignoredIds, resolveIdentity = resolveGitIdentity) {
  const generation = (_checkpointGenerations.get(cwd) ?? 0) + 1;
  _checkpointGenerations.set(cwd, generation);
  let data;
  try {
    data = buildReviewGraphCheckpointData(cwd, graph, processedHashes, targetFileCount, ignoredIds, resolveIdentity);
  } catch {
    return;
  }
  const worker = _workerDisabled ? void 0 : getPersistWorker();
  if (!worker) {
    writeReviewGraphCheckpointSync(cwd, data, {
      nodes: graph.nodes.size,
      edges: graph.edges.length,
      processed: processedHashes.size,
      target: targetFileCount
    });
    return;
  }
  const checkpointPath = reviewGraphCheckpointPath(cwd);
  const cacheDir = path2.dirname(checkpointPath);
  try {
    fs2.mkdirSync(cacheDir, { recursive: true });
  } catch (err) {
    logReviewGraph({
      cwd,
      phase: "checkpoint_write_failed",
      reason: "mkdir_failed",
      error: err instanceof Error ? err.message : String(err)
    });
    return;
  }
  sweepStaleStageFiles(cacheDir);
  ensurePersistExitHook();
  const id = ++_persistWorkerRequestId;
  const stagePath = `${checkpointPath}.stage-${process.pid}-${generation}`;
  _checkpointWorkerRequests.set(id, {
    cwd,
    generation,
    checkpointPath,
    stagePath,
    nodes: graph.nodes.size,
    edges: graph.edges.length,
    processed: processedHashes.size,
    target: targetFileCount
  });
  const request = {
    id,
    cwd,
    generation,
    stagePath,
    data,
    elements: graph.nodes.size + graph.edges.length,
    testDelayMs: process.env.NODE_ENV === "test" ? Number(process.env.PI_LENS_TEST_PERSIST_WORKER_DELAY_MS) || void 0 : void 0
  };
  worker.postMessage(request);
  _checkpointOffloadCountForTests++;
}
function writeReviewGraphCheckpointSync(cwd, data, counts) {
  try {
    const gzip = gzipSync(JSON.stringify(data));
    fs2.mkdirSync(path2.dirname(reviewGraphCheckpointPath(cwd)), {
      recursive: true
    });
    writeFileAtomic(reviewGraphCheckpointPath(cwd), gzip, { bestEffort: true });
    logReviewGraph({
      cwd,
      phase: "checkpoint_written",
      nodes: counts.nodes,
      edges: counts.edges,
      processed: counts.processed,
      target: counts.target
    });
  } catch (err) {
    logReviewGraph({
      cwd,
      phase: "checkpoint_write_failed",
      reason: "sync_write_failed",
      error: err instanceof Error ? err.message : String(err)
    });
  }
}
function deleteReviewGraphCheckpoint(cwd) {
  _checkpointGenerations.set(cwd, (_checkpointGenerations.get(cwd) ?? 0) + 1);
  fs2.rm(reviewGraphCheckpointPath(cwd), { force: true }, () => {
  });
}
function loadReviewGraphCheckpoint(cwd, resolveIdentity = resolveGitIdentity) {
  const checkpointPath = reviewGraphCheckpointPath(cwd);
  let data;
  try {
    if (!fs2.existsSync(checkpointPath))
      return null;
    data = JSON.parse(gunzipSync(fs2.readFileSync(checkpointPath)).toString("utf-8"));
  } catch {
    logReviewGraph({ cwd, phase: "checkpoint_discarded", reason: "corrupt" });
    deleteReviewGraphCheckpoint(cwd);
    return null;
  }
  if (data.version !== REVIEW_GRAPH_VERSION || data.inProgress !== true) {
    logReviewGraph({
      cwd,
      phase: "checkpoint_discarded",
      reason: data.version !== REVIEW_GRAPH_VERSION ? "version_mismatch" : "not_in_progress"
    });
    deleteReviewGraphCheckpoint(cwd);
    return null;
  }
  if (data.gitStamp) {
    const current = resolveIdentity(cwd);
    if (current && current.worktreeRoot !== data.gitStamp.worktreeRoot) {
      logReviewGraph({
        cwd,
        phase: "checkpoint_discarded",
        reason: "worktree_mismatch"
      });
      deleteReviewGraphCheckpoint(cwd);
      return null;
    }
  }
  const totalNodes = data.nodes.length;
  const totalEdges = data.edges.length;
  const graph = {
    version: data.version,
    builtAt: data.builtAt,
    nodes: new Map(data.nodes),
    edges: data.edges,
    edgesByFrom: /* @__PURE__ */ new Map(),
    edgesByTo: /* @__PURE__ */ new Map(),
    fileNodes: /* @__PURE__ */ new Map(),
    symbolNodesByFile: /* @__PURE__ */ new Map(),
    changedSymbolsByFile: /* @__PURE__ */ new Map(),
    persistCoverage: {
      partial: true,
      inProgress: true,
      cap: 0,
      totalNodes,
      totalEdges,
      persistedNodes: totalNodes,
      persistedEdges: totalEdges,
      totalFiles: data.targetFileCount,
      persistedFiles: 0
    }
  };
  rebuildIndexes(graph);
  if (graph.persistCoverage) {
    graph.persistCoverage.persistedFiles = countRetainedSourceFiles(graph, data.processedFiles.map(([filePath]) => filePath));
  }
  return {
    graph,
    processedHashes: new Map(data.processedFiles),
    ignoredIdsHash: data.ignoredIdsHash,
    targetFileCount: data.targetFileCount
  };
}
function pruneOrphanNonFileNodes(graph) {
  const referenced = /* @__PURE__ */ new Set();
  for (const edge of graph.edges) {
    referenced.add(edge.from);
    referenced.add(edge.to);
  }
  for (const [id, node] of graph.nodes) {
    if (!node.filePath && !referenced.has(id))
      graph.nodes.delete(id);
  }
}
async function tryResumeFromCheckpoint(cwd, filesToBuild, ignoredIds, resolveIdentity = resolveGitIdentity) {
  const loaded = loadReviewGraphCheckpoint(cwd, resolveIdentity);
  if (!loaded)
    return null;
  if (loaded.ignoredIdsHash !== hashIgnoredIds(ignoredIds)) {
    logReviewGraph({
      cwd,
      phase: "checkpoint_discarded",
      reason: "ignored_ids_mismatch",
      processed: loaded.processedHashes.size,
      target: filesToBuild.length
    });
    deleteReviewGraphCheckpoint(cwd);
    return null;
  }
  const targetSet = new Set(filesToBuild);
  for (const file of loaded.processedHashes.keys()) {
    if (!targetSet.has(file)) {
      logReviewGraph({
        cwd,
        phase: "checkpoint_discarded",
        reason: "removed_file",
        processed: loaded.processedHashes.size,
        target: filesToBuild.length
      });
      deleteReviewGraphCheckpoint(cwd);
      return null;
    }
  }
  const reusableHashes = /* @__PURE__ */ new Map();
  const stale = [];
  let sinceYield = 0;
  for (const [file, priorHash] of loaded.processedHashes) {
    const currentHash = contentHashEntry(file);
    if (currentHash === priorHash)
      reusableHashes.set(file, currentHash);
    else
      stale.push(file);
    if (++sinceYield >= STAT_YIELD_EVERY) {
      sinceYield = 0;
      await yieldToLoop();
    }
  }
  if (reusableHashes.size === 0) {
    logReviewGraph({
      cwd,
      phase: "checkpoint_discarded",
      reason: "all_stale",
      stale: stale.length,
      target: filesToBuild.length
    });
    deleteReviewGraphCheckpoint(cwd);
    return null;
  }
  const graph = loaded.graph;
  const removedEdges = /* @__PURE__ */ new Set();
  for (const file of stale)
    removeFileOwnedGraphData(graph, file, removedEdges);
  if (removedEdges.size > 0) {
    unindexEdges(graph, removedEdges);
    graph.edges = graph.edges.filter((edge) => !removedEdges.has(edge));
  }
  pruneOrphanNonFileNodes(graph);
  graph.changedSymbolsByFile = /* @__PURE__ */ new Map();
  const remaining = filesToBuild.filter((file) => !reusableHashes.has(file));
  logReviewGraph({
    cwd,
    phase: "checkpoint_resumed",
    reused: reusableHashes.size,
    stale: stale.length,
    remaining: remaining.length,
    target: filesToBuild.length
  });
  return { graph, fileHashes: reusableHashes, remaining };
}
function _readReviewGraphCheckpointForTests(cwd) {
  const loaded = loadReviewGraphCheckpoint(cwd);
  if (!loaded)
    return null;
  return {
    inProgress: loaded.graph.persistCoverage?.inProgress === true,
    processedFiles: [...loaded.processedHashes.keys()],
    nodeCount: loaded.graph.nodes.size,
    edgeCount: loaded.graph.edges.length,
    persistCoverage: loaded.graph.persistCoverage
  };
}
function flushReviewGraphPersistsForTests() {
  for (const key of _pendingPersist.keys()) {
    const pending = _pendingPersist.get(key);
    if (!pending)
      continue;
    _pendingPersist.delete(key);
    const timer = _persistTimers.get(key);
    if (timer)
      clearTimeout(timer);
    _persistTimers.delete(key);
    writePendingOnMainThread(key, pending);
  }
}
async function waitForReviewGraphPersistsForTests() {
  for (let attempts = 0; attempts < 200 && (_workerRequests.size > 0 || _checkpointWorkerRequests.size > 0); attempts++) {
    await new Promise((resolve2) => setTimeout(resolve2, 10));
  }
}
async function terminateReviewGraphPersistWorkerForTests() {
  const worker = _persistWorker;
  if (worker)
    await worker.terminate();
}
function resetReviewGraphPersistWorkerForTests() {
  _workerDisabled = false;
  _persistWorker = void 0;
  _persistWorkerHeapStatistics = null;
  _persistWorkerUnavailableReason = void 0;
  _lastWorkerFallbackReasonForTests = void 0;
  _checkpointWorkerRequests.clear();
  _checkpointGenerations.clear();
  _checkpointOffloadCountForTests = 0;
}
function getCheckpointOffloadCountForTests() {
  return _checkpointOffloadCountForTests;
}
function getReviewGraphWorkerFallbackReasonForTests() {
  return _lastWorkerFallbackReasonForTests;
}
function reviewGraphCachePath(cwd) {
  return path2.join(getProjectDataDir(cwd), "cache", GRAPH_CACHE_FILENAME);
}
function flushReviewGraphPersist(cwd, source = "cli") {
  const key = normalizeMapKey(cwd);
  let pending = _pendingPersist.get(key);
  const removedWorkerRequests = [];
  let selectedWorkerRequest;
  for (const [id, request] of _workerRequests) {
    if (request.key !== key)
      continue;
    _workerRequests.delete(id);
    removedWorkerRequests.push(request.pending);
    if (!pending || request.pending.generation > pending.generation) {
      pending = request.pending;
      selectedWorkerRequest = request.pending;
    }
  }
  for (const removed of removedWorkerRequests) {
    if (!pending || removed.generation === pending.generation)
      continue;
    logReviewGraph({
      cwd: key,
      phase: "persist_skipped",
      reason: "superseded",
      observability: persistObservability(removed, {
        status: "superseded",
        supersededByGeneration: pending.generation,
        reason: "forced_flush_newest_generation",
        workerStarted: true,
        workerCompleted: false
      })
    });
  }
  const currentGeneration = _persistGenerations.get(key);
  if (pending && pending.generation !== currentGeneration) {
    logReviewGraph({
      cwd: key,
      phase: "persist_skipped",
      reason: "superseded",
      observability: persistObservability(pending, {
        status: "superseded",
        supersededByGeneration: currentGeneration,
        reason: "forced_flush_superseded",
        workerStarted: true,
        workerCompleted: false
      })
    });
    return {
      ok: false,
      reason: `queued snapshot generation ${pending.generation} was superseded by generation ${currentGeneration}`
    };
  }
  if (!pending) {
    return {
      ok: false,
      reason: "no graph snapshot was queued for persistence"
    };
  }
  _persistGenerations.set(key, Math.max(_persistGenerations.get(key) ?? 0, pending.generation) + 1);
  _pendingPersist.delete(key);
  const timer = _persistTimers.get(key);
  if (timer) {
    clearTimeout(timer);
    _persistTimers.delete(key);
  }
  const startedAt = performance.now();
  try {
    const serializeStarted = performance.now();
    const json = JSON.stringify(persistedData(pending));
    const serializeMs = performance.now() - serializeStarted;
    const rawBytes = Buffer.byteLength(json);
    const writeStarted = performance.now();
    const gzip = gzipSync(json);
    fs2.mkdirSync(pending.cacheDir, { recursive: true });
    writeFileAtomic(pending.cachePath, gzip, { bestEffort: false });
    fs2.rmSync(path2.join(pending.cacheDir, LEGACY_GRAPH_CACHE_FILENAME), {
      force: true
    });
    const writeMs = performance.now() - writeStarted;
    logLatency({
      type: "phase",
      phase: "review_graph_persist",
      filePath: pending.cachePath,
      durationMs: performance.now() - startedAt,
      metadata: {
        elements: pending.elementCount,
        rawBytes,
        gzBytes: gzip.byteLength,
        serializeMs,
        writeMs,
        offloaded: false
      }
    });
    logReviewGraph({
      cwd,
      phase: "persist_succeeded",
      durationMs: performance.now() - startedAt,
      elements: pending.elementCount,
      rawBytes,
      gzBytes: gzip.byteLength,
      serializeMs,
      writeMs,
      offloaded: false,
      observability: persistObservability(pending, {
        status: "succeeded",
        reason: source === "exit_hook" ? "exit_flush" : "forced_flush",
        workerStarted: selectedWorkerRequest !== void 0,
        workerCompleted: false
      })
    });
    return {
      ok: true,
      path: pending.cachePath,
      bytes: gzip.byteLength,
      elements: pending.elementCount,
      coverage: pending.graph.persistCoverage
    };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    recordPersistFailure(cwd, source === "exit_hook" ? "exit_flush_failed" : "forced_flush_failed", reason, pending, selectedWorkerRequest ? {
      started: true,
      completed: false,
      fallbackReason: "forced_flush_write_failed"
    } : void 0);
    return { ok: false, reason };
  }
}
function localImportToFile(cwd, filePath, source, ignoredIds) {
  if (!source.startsWith(".")) {
    const aliased = resolveAliasedImport(cwd, source, path2.dirname(filePath));
    const referenced = aliased.length ? [] : resolveProjectReferenceImport(cwd, source, path2.dirname(filePath));
    const resolved = aliased.length ? aliased : referenced.length ? referenced : resolveWorkspacePackageImport(cwd, source);
    for (const normalized of resolved) {
      if (ignoredIds?.has(normalized))
        continue;
      return normalized;
    }
    return void 0;
  }
  const root = path2.resolve(cwd);
  for (const candidate of jsTsCandidatePaths(filePath, source)) {
    if (!fs2.existsSync(candidate))
      continue;
    const normalized = normalizeMapKey(candidate);
    if (!isUnderDir(normalized, root))
      continue;
    if (ignoredIds?.has(normalized))
      continue;
    return normalized;
  }
  return void 0;
}
function upsertChangedSymbols(graph, facts, filePath) {
  if (detectFileRole(filePath) === "test")
    return;
  const normalized = normalizeMapKey(filePath);
  const changed = facts.getBoundedSessionFact(`${CHANGED_SYMBOLS_PREFIX}${normalized}`);
  if (changed && changed.length > 0) {
    graph.changedSymbolsByFile.set(normalized, [...changed]);
  } else {
    graph.changedSymbolsByFile.delete(normalized);
  }
}
async function ensureReviewGraphFacts(filePath, cwd, facts, contentOverride) {
  const ctx = makeCtx(filePath, cwd, facts);
  if (contentOverride === void 0) {
    await fileContentProvider.run(ctx, facts);
  } else {
    facts.setFileFact(filePath, "file.content", contentOverride);
  }
  try {
    const [{ importFactProvider }, { functionFactProvider }] = await Promise.all([
      import("./chunk-466Z26MG.js"),
      import("./chunk-LOP6GRPH.js")
    ]);
    await importFactProvider.run(ctx, facts);
    await functionFactProvider.run(ctx, facts);
  } catch (err) {
    logReviewGraph({
      cwd,
      phase: "build_skipped",
      reason: "structural_facts_disabled",
      error: err?.message ?? String(err)
    });
  }
}
function addJsTsFile(graph, cwd, filePath, facts, ignoredIds) {
  const normalized = normalizeMapKey(filePath);
  const hintPath = toProjectRelativePath(normalized, cwd);
  const content = facts.getFileFact(normalized, "file.content") ?? "";
  const fileNodeId = `file:${normalized}`;
  const warmCallCoverage = facts.getFileFact(normalized, "file.functionFactsCoverage") ?? "unavailable";
  const importCoverage = facts.getFileFact(normalized, "file.importFactsCoverage") ?? "unavailable";
  addNode(graph, {
    id: fileNodeId,
    kind: "file",
    language: "jsts",
    filePath: normalized,
    metadata: {
      lineCount: content.split("\n").length,
      extractionCoverage: {
        definitions: warmCallCoverage,
        references: warmCallCoverage,
        imports: importCoverage,
        calls: warmCallCoverage
      },
      ...featureHintMetadata(hintPath)
    }
  });
  const imports = facts.getFileFact(normalized, "file.imports") ?? [];
  const functions = facts.getFileFact(normalized, "file.functionSummaries") ?? [];
  for (const entry of imports) {
    const localFile = localImportToFile(cwd, normalized, entry.source, ignoredIds);
    if (localFile) {
      const targetId = `file:${localFile}`;
      if (!graph.nodes.has(targetId)) {
        addNode(graph, {
          id: targetId,
          kind: "file",
          language: detectFileKind(localFile) ?? "jsts",
          filePath: localFile
        });
      }
      addEdge(graph, { from: fileNodeId, to: targetId, kind: "imports" });
    } else {
      const targetId = `${entry.source.startsWith(".") ? "module" : "external"}:${entry.source}`;
      if (!graph.nodes.has(targetId)) {
        addNode(graph, {
          id: targetId,
          kind: entry.source.startsWith(".") ? "module" : "external",
          language: "jsts",
          metadata: { source: entry.source }
        });
      }
      addEdge(graph, { from: fileNodeId, to: targetId, kind: "imports" });
    }
  }
  const importedNameToFile = /* @__PURE__ */ new Map();
  for (const entry of imports) {
    const localFile = localImportToFile(cwd, normalized, entry.source, ignoredIds);
    if (!localFile)
      continue;
    for (const name of entry.names)
      importedNameToFile.set(name, localFile);
    if (entry.defaultName)
      importedNameToFile.set(entry.defaultName, localFile);
  }
  const methodsByQualifiedName = /* @__PURE__ */ new Map();
  for (const fn of functions) {
    const symbolId = buildSymbolId(normalized, fn.name, "function", fn.line);
    const qualifiedName = buildQualifiedName(fn.owner, fn.name);
    if (qualifiedName) {
      const existing = methodsByQualifiedName.get(qualifiedName) ?? [];
      existing.push(symbolId);
      methodsByQualifiedName.set(qualifiedName, existing);
    }
    addNode(graph, {
      id: symbolId,
      kind: "symbol",
      language: "jsts",
      filePath: normalized,
      symbolName: fn.name,
      symbolKind: "function",
      ...qualifiedName ? { qualifiedName } : {},
      exported: new RegExp(String.raw`export\s+(?:async\s+)?(?:function|const|let|var)\s+${escapeRegExp(fn.name)}\b`).test(content),
      metadata: {
        line: fn.line,
        endLine: fn.endLine,
        column: fn.column,
        cyclomaticComplexity: fn.cyclomaticComplexity,
        maxNestingDepth: fn.maxNestingDepth,
        isBoundaryWrapper: fn.isBoundaryWrapper,
        isPassThroughWrapper: fn.isPassThroughWrapper,
        ...featureHintMetadata(`${fn.name} ${hintPath}`)
      }
    });
    addEdge(graph, { from: fileNodeId, to: symbolId, kind: "contains" });
    addEdge(graph, { from: fileNodeId, to: symbolId, kind: "defines" });
  }
  for (const fn of functions) {
    const symbolId = buildSymbolId(normalized, fn.name, "function", fn.line);
    const memberCallTexts = /* @__PURE__ */ new Set();
    for (const site of fn.memberCallSites ?? []) {
      const callText = `${site.receiver}.${site.method}`;
      memberCallTexts.add(callText);
      const receiverClass = fn.receiverTypes?.[site.receiver];
      const candidates = receiverClass ? methodsByQualifiedName.get(`${receiverClass}.${site.method}`) ?? [] : [];
      if (candidates.length === 1) {
        addEdge(graph, {
          from: symbolId,
          to: candidates[0],
          kind: "calls",
          metadata: {
            unresolvedName: callText,
            receiver: site.receiver,
            receiverType: receiverClass
          },
          resolution: "receiver-type"
        });
        continue;
      }
      if (candidates.length > 1) {
        const qualifiedPlaceholderId = `symbol-qualified-name:${receiverClass}.${site.method}`;
        if (!graph.nodes.has(qualifiedPlaceholderId)) {
          addNode(graph, {
            id: qualifiedPlaceholderId,
            kind: "symbol",
            language: "jsts",
            symbolName: site.method,
            qualifiedName: `${receiverClass}.${site.method}`,
            metadata: {
              unresolvedName: callText,
              ambiguousCandidates: candidates.length
            }
          });
        }
        addEdge(graph, {
          from: symbolId,
          to: qualifiedPlaceholderId,
          kind: "calls",
          metadata: {
            unresolvedName: callText,
            receiver: site.receiver,
            receiverType: receiverClass
          },
          resolution: "name-only"
        });
        continue;
      }
      const externalId = `external:${callText}`;
      if (!graph.nodes.has(externalId)) {
        addNode(graph, {
          id: externalId,
          kind: "external",
          language: "jsts",
          metadata: { unresolvedName: callText }
        });
      }
      addEdge(graph, {
        from: symbolId,
        to: externalId,
        kind: "calls",
        metadata: { unresolvedName: callText }
      });
    }
    for (const callee of fn.outgoingCalls) {
      if (memberCallTexts.has(callee))
        continue;
      const targetId = callee.includes(".") ? `external:${callee}` : `symbol-name:${callee}`;
      if (!graph.nodes.has(targetId)) {
        addNode(graph, {
          id: targetId,
          kind: callee.includes(".") ? "external" : "symbol",
          language: "jsts",
          symbolName: callee.includes(".") ? void 0 : callee,
          metadata: { unresolvedName: callee }
        });
      }
      const importHintFile = !callee.includes(".") ? importedNameToFile.get(callee) : void 0;
      addEdge(graph, {
        from: symbolId,
        to: targetId,
        kind: "calls",
        metadata: {
          unresolvedName: callee,
          ...importHintFile ? { importHintFile } : {}
        },
        // A definite external call (`callee.includes(".")`) is never
        // ambiguous — no in-project candidate to collide with, so no
        // resolution marker. An in-project bare-name callee starts
        // "name-only" and resolveDeferredSymbolEdges below may upgrade it
        // to "import" (when importHintFile narrows it) or "exact" once
        // every file has been added.
        ...callee.includes(".") ? {} : { resolution: "name-only" }
      });
    }
  }
}
function mapKindToTreeSitterLanguage(kind, filePath) {
  return symbolExtractionGrammar(kind, filePath);
}
async function getExtractor(languageId) {
  if (extractorCache.has(languageId))
    return extractorCache.get(languageId);
  const client = getSharedTreeSitterClient();
  if (!client)
    return null;
  const extractor = new TreeSitterSymbolExtractor(languageId, client);
  const ok = await extractor.init();
  if (!ok) {
    extractorCache.set(languageId, null);
    return null;
  }
  extractorCache.set(languageId, extractor);
  return extractor;
}
async function extractTreeSitterSymbols(filePath, languageId, contentOverride) {
  const empty = {
    symbols: [],
    refs: [],
    imports: [],
    coverage: {
      definitions: "unavailable",
      references: "unavailable",
      imports: "unavailable"
    }
  };
  if (contentOverride === null)
    return empty;
  const treeSitterClient = getSharedTreeSitterClient();
  if (!treeSitterClient)
    return empty;
  const initialized = await treeSitterClient.init();
  if (!initialized)
    return empty;
  const extractor = await getExtractor(languageId);
  if (!extractor)
    return empty;
  const content = contentOverride ?? fs2.readFileSync(filePath, "utf-8");
  const extracted = await treeSitterClient.withParsedTree(filePath, languageId, content, (tree) => extractor.extract(tree, filePath, content), "review-graph");
  return extracted.parsed ? extracted.value : { ...empty, wasmTrap: extracted.wasmTrap };
}
async function captureReviewGraphStructuralIr(filePath, cwd, content, borrowed) {
  const kind = detectFileKind(filePath);
  if (!kind || !MAIN_KINDS.has(kind) || detectFileRole(filePath) === "test") {
    return { complete: true };
  }
  if (kind === "jsts") {
    const borrowable = borrowed.hasFileFact(filePath, "file.imports") && borrowed.hasFileFact(filePath, "file.reexports") && borrowed.hasFileFact(filePath, "file.functionSummaries") && borrowed.getFileFact(filePath, "file.content") === content;
    let facts = borrowed;
    if (!borrowable) {
      const run = new FactStore("review-graph-run");
      await ensureReviewGraphFacts(filePath, cwd, run, content);
      facts = run;
    }
    const parsed = await withTreeSitterRoot(filePath, content, () => true, "review-graph-ir");
    if (!parsed.parsed)
      return { complete: false };
    const functionCoverage = facts.getFileFact(filePath, "file.functionFactsCoverage") ?? "unavailable";
    const importCoverage = facts.getFileFact(filePath, "file.importFactsCoverage") ?? "unavailable";
    const coverage = {
      definitions: functionCoverage,
      references: functionCoverage,
      imports: importCoverage,
      calls: functionCoverage
    };
    if (Object.values(coverage).some((status) => status !== "complete")) {
      return { complete: false };
    }
    return {
      complete: true,
      structural: {
        kind: "jsts",
        imports: facts.getFileFact(filePath, "file.imports") ?? [],
        reexports: facts.getFileFact(filePath, "file.reexports") ?? [],
        functionSummaries: facts.getFileFact(filePath, "file.functionSummaries") ?? [],
        coverage
      }
    };
  }
  const languageId = mapKindToTreeSitterLanguage(kind, filePath);
  if (!languageId)
    return { complete: false };
  const client = getSharedTreeSitterClient();
  if (!client || !await client.init())
    return { complete: false };
  const extractor = await getExtractor(languageId);
  if (!extractor)
    return { complete: false };
  const result = await client.withParsedTree(filePath, languageId, content, (tree) => extractor.extract(tree, filePath, content), "review-graph");
  if (!result.parsed)
    return { complete: false };
  return {
    complete: true,
    structural: {
      kind: "tree-sitter",
      languageId,
      extracted: result.value
    }
  };
}
var SYMBOL_KIND_SPECIFICITY = {
  method: 2,
  property: 2
};
function dedupeSamePositionSymbols(symbols) {
  const bestByKey = /* @__PURE__ */ new Map();
  for (const symbol of symbols) {
    const key = `${symbol.name}0000${symbol.line}0000${symbol.column}`;
    const existing = bestByKey.get(key);
    if (!existing) {
      bestByKey.set(key, symbol);
      continue;
    }
    const existingScore = SYMBOL_KIND_SPECIFICITY[existing.kind] ?? 0;
    const candidateScore = SYMBOL_KIND_SPECIFICITY[symbol.kind] ?? 0;
    if (candidateScore > existingScore)
      bestByKey.set(key, symbol);
  }
  return [...bestByKey.values()];
}
function addTreeSitterFile(graph, cwd, filePath, languageId, extracted, ignoredIds) {
  const normalized = normalizeMapKey(filePath);
  const hintPath = toProjectRelativePath(normalized, cwd);
  const fileNodeId = `file:${normalized}`;
  addNode(graph, {
    id: fileNodeId,
    kind: "file",
    language: languageId,
    filePath: normalized,
    metadata: {
      ...featureHintMetadata(hintPath),
      extractionCoverage: extracted.coverage
    }
  });
  const dedupedSymbols = dedupeSamePositionSymbols(extracted.symbols);
  const containers = dedupedSymbols.map((s) => ({
    name: s.name,
    startLine: s.line,
    endLine: s.endLine ?? s.line
  }));
  for (const symbol of dedupedSymbols) {
    const symbolId = buildSymbolId(normalized, symbol.name, symbol.kind, symbol.line);
    const owner = findOwnerName(containers, symbol.line, symbol.endLine ?? symbol.line);
    const qualifiedName = buildQualifiedName(owner, symbol.name);
    addNode(graph, {
      id: symbolId,
      kind: "symbol",
      language: languageId,
      filePath: normalized,
      symbolName: symbol.name,
      symbolKind: symbol.kind,
      ...qualifiedName ? { qualifiedName } : {},
      exported: symbol.isExported,
      metadata: {
        line: symbol.line,
        endLine: symbol.endLine,
        column: symbol.column,
        signature: symbol.signature,
        ...featureHintMetadata(`${symbol.name} ${hintPath}`)
      }
    });
    addEdge(graph, { from: fileNodeId, to: symbolId, kind: "contains" });
    addEdge(graph, { from: fileNodeId, to: symbolId, kind: "defines" });
  }
  for (const ref of extracted.refs) {
    const refName = ref.symbolName ?? ref.symbolId;
    const targetId = `symbol-name:${refName}`;
    if (!graph.nodes.has(targetId)) {
      addNode(graph, {
        id: targetId,
        kind: "symbol",
        language: languageId,
        symbolName: refName,
        metadata: { unresolvedName: refName }
      });
    }
    addEdge(graph, {
      from: fileNodeId,
      to: targetId,
      kind: "references",
      metadata: {
        line: ref.line,
        column: ref.column,
        referenceKind: ref.referenceKind ?? "unknown"
      },
      // Always starts bare-name-only (the extractor has no scope/type info);
      // resolveDeferredSymbolEdges may upgrade this to "exact" below.
      resolution: "name-only"
    });
  }
  for (const imp of extracted.imports) {
    const resolved = resolveImportToFiles(cwd, filePath, languageId, imp.source).filter((target) => !ignoredIds?.has(target));
    if (resolved.length > 0) {
      for (const target of resolved) {
        const toNode = ensureFileNode(graph, target, cwd, mapKindToTreeSitterLanguage(detectFileKind(target), target) ?? languageId);
        addEdge(graph, {
          from: fileNodeId,
          to: toNode,
          kind: "imports",
          metadata: { line: imp.line, source: imp.source }
        });
      }
      continue;
    }
    const isRelative = imp.source.startsWith(".");
    const targetId = `${isRelative ? "module" : "external"}:${imp.source}`;
    if (!graph.nodes.has(targetId)) {
      addNode(graph, {
        id: targetId,
        kind: isRelative ? "module" : "external",
        language: languageId,
        metadata: { source: imp.source }
      });
    }
    addEdge(graph, {
      from: fileNodeId,
      to: targetId,
      kind: "imports",
      metadata: { line: imp.line }
    });
  }
}
function addLspFallbackSymbols(graph, filePath, languageId, symbols) {
  const normalized = normalizeMapKey(filePath);
  const fileNodeId = `file:${normalized}`;
  let added = 0;
  const flatOwnerIds = /* @__PURE__ */ new Map();
  for (const symbol of symbols) {
    const range = symbol.range ?? symbol.location?.range;
    if (!range)
      continue;
    const kind = lspSymbolKindName(symbol.kind);
    const id = buildSymbolId(normalized, symbol.name, kind, range.start.line + 1);
    flatOwnerIds.set(symbol.name, id);
    if (symbol.containerName) {
      flatOwnerIds.set(`${symbol.containerName}.${symbol.name}`, id);
    }
  }
  const visit = (items, parentId, ancestry) => {
    for (const symbol of items) {
      const range = symbol.range ?? symbol.location?.range;
      if (!range)
        continue;
      const line = range.start.line + 1;
      const kind = lspSymbolKindName(symbol.kind);
      const symbolId = buildSymbolId(normalized, symbol.name, kind, line);
      const owners = ancestry.length > 0 ? ancestry : containerNameChain(symbol, symbols);
      const qualifiedName = owners.length > 0 ? [...owners, symbol.name].join(".") : void 0;
      addNode(graph, {
        id: symbolId,
        kind: "symbol",
        language: languageId,
        filePath: normalized,
        symbolName: symbol.name,
        symbolKind: kind,
        ...qualifiedName ? { qualifiedName } : {},
        provenance: "lsp",
        metadata: {
          line,
          column: range.start.character,
          endLine: range.end.line + 1,
          ...featureHintMetadata(`${symbol.name} ${normalized}`)
        }
      });
      const resolvedParentId = ancestry.length === 0 && symbol.containerName ? flatOwnerIds.get(symbol.containerName) ?? parentId : parentId;
      addEdge(graph, {
        from: resolvedParentId,
        to: symbolId,
        kind: "contains"
      });
      addEdge(graph, { from: fileNodeId, to: symbolId, kind: "defines" });
      added++;
      if (symbol.children) {
        visit(symbol.children, symbolId, [...owners, symbol.name]);
      }
    }
  };
  visit(symbols, fileNodeId, []);
  return added;
}
function ensureFileNode(graph, filePath, cwd, languageId) {
  const normalized = normalizeMapKey(filePath);
  const hintPath = toProjectRelativePath(normalized, cwd);
  const existing = graph.fileNodes.get(normalized);
  if (existing)
    return existing;
  const fileNodeId = `file:${normalized}`;
  addNode(graph, {
    id: fileNodeId,
    kind: "file",
    language: languageId,
    filePath: normalized,
    metadata: featureHintMetadata(hintPath)
  });
  return fileNodeId;
}
function resolveCxxInclude(cwd, filePath, source) {
  const candidates = [
    path2.resolve(path2.dirname(filePath), source),
    path2.resolve(cwd, source),
    path2.resolve(cwd, "include", source),
    path2.resolve(cwd, "src", source)
  ];
  const root = path2.resolve(cwd);
  for (const candidate of candidates) {
    if (!candidate.startsWith(root + path2.sep) && candidate !== root)
      continue;
    if (fs2.existsSync(candidate) && detectFileKind(candidate) === "cxx") {
      return normalizeMapKey(candidate);
    }
  }
  return void 0;
}
function parseLocalCxxInclude(line) {
  let i = 0;
  while (i < line.length && (line[i] === " " || line[i] === "	"))
    i += 1;
  if (line[i] !== "#")
    return void 0;
  i += 1;
  while (i < line.length && (line[i] === " " || line[i] === "	"))
    i += 1;
  if (!line.startsWith("include", i))
    return void 0;
  i += "include".length;
  if (i >= line.length || line[i] !== " " && line[i] !== "	") {
    return void 0;
  }
  while (i < line.length && (line[i] === " " || line[i] === "	"))
    i += 1;
  if (line[i] !== '"')
    return void 0;
  i += 1;
  const start = i;
  while (i < line.length && line[i] !== '"')
    i += 1;
  if (i >= line.length || i === start)
    return void 0;
  return line.slice(start, i);
}
function addCxxIncludeEdges(graph, cwd, filePath, ignoredIds, contentOverride) {
  let content = contentOverride;
  if (content === void 0) {
    try {
      content = fs2.readFileSync(filePath, "utf-8");
    } catch {
      return;
    }
  }
  if (content === null)
    return;
  const fromNode = ensureFileNode(graph, filePath, cwd, "cpp");
  for (const line of content.split(/\r?\n/)) {
    const source = parseLocalCxxInclude(line);
    if (!source)
      continue;
    const target = resolveCxxInclude(cwd, filePath, source);
    if (!target || ignoredIds?.has(target))
      continue;
    const languageId = mapKindToTreeSitterLanguage("cxx", target) ?? "cpp";
    const toNode = ensureFileNode(graph, target, cwd, languageId);
    addEdge(graph, {
      from: fromNode,
      to: toNode,
      kind: "imports",
      metadata: { source }
    });
  }
}
function removeFileOwnedGraphData(graph, filePath, removedEdges) {
  const normalized = normalizeMapKey(filePath);
  const fileNodeId = graph.fileNodes.get(normalized) ?? `file:${normalized}`;
  const removedSymbolIds = new Set(graph.symbolNodesByFile.get(normalized));
  const removedIds = new Set(removedSymbolIds);
  if (graph.nodes.has(fileNodeId))
    removedIds.add(fileNodeId);
  const candidates = /* @__PURE__ */ new Set();
  for (const id of removedIds) {
    for (const edge of graph.edgesByFrom.get(id) ?? []) {
      _rebuildCounters.removeOwnedEdgeVisits++;
      candidates.add(edge);
    }
    for (const edge of graph.edgesByTo.get(id) ?? []) {
      _rebuildCounters.removeOwnedEdgeVisits++;
      candidates.add(edge);
    }
  }
  const preservedIncomingSymbolEdges = [];
  for (const edge of candidates) {
    if (removedEdges.has(edge))
      continue;
    const fromRemoved = removedIds.has(edge.from);
    if (!fromRemoved && edge.to === fileNodeId)
      continue;
    if (!fromRemoved && removedSymbolIds.has(edge.to)) {
      preservedIncomingSymbolEdges.push({ ...edge });
    }
    removedEdges.add(edge);
  }
  for (const id of removedIds) {
    const node = graph.nodes.get(id);
    graph.nodes.delete(id);
    if (!node?.filePath)
      continue;
    if (node.kind === "file") {
      if (graph.fileNodes.get(node.filePath) === id) {
        graph.fileNodes.delete(node.filePath);
      }
    } else if (node.kind === "symbol") {
      const ids = graph.symbolNodesByFile.get(node.filePath);
      if (!ids)
        continue;
      const at = ids.indexOf(id);
      if (at >= 0)
        ids.splice(at, 1);
      if (ids.length === 0)
        graph.symbolNodesByFile.delete(node.filePath);
    }
  }
  return preservedIncomingSymbolEdges;
}
async function addFileToGraph(graph, cwd, file, ignoredIds, contentOverride) {
  const kind = detectFileKind(file);
  if (!kind || !MAIN_KINDS.has(kind))
    return;
  if (detectFileRole(file) === "test")
    return;
  const contentHash = typeof contentOverride === "string" ? reviewGraphIrContentHash(contentOverride) : void 0;
  const sharedIr = contentHash ? getFreshReviewGraphFileIr(cwd, file, contentHash)?.structural : void 0;
  if (kind === "jsts") {
    const run = new FactStore("review-graph-run");
    if (sharedIr?.kind === "jsts") {
      run.setFileFact(file, "file.content", contentOverride ?? "");
      run.setFileFact(file, "file.imports", sharedIr.imports);
      run.setFileFact(file, "file.functionSummaries", sharedIr.functionSummaries);
      run.setFileFact(file, "file.functionFactsCoverage", sharedIr.coverage.calls);
      run.setFileFact(file, "file.importFactsCoverage", sharedIr.coverage.imports);
    } else {
      await ensureReviewGraphFacts(file, cwd, run, contentOverride);
    }
    addJsTsFile(graph, cwd, file, run, ignoredIds);
    return;
  }
  const languageId = mapKindToTreeSitterLanguage(kind, file);
  if (!languageId)
    return;
  const irExtracted = sharedIr?.kind === "tree-sitter" && sharedIr.languageId === languageId ? sharedIr.extracted : void 0;
  const extracted = irExtracted ?? await extractTreeSitterSymbols(file, languageId, contentOverride);
  if (extracted.wasmTrap)
    _wasmTrappedFiles.set(file, extracted.wasmTrap);
  else
    _wasmTrappedFiles.delete(file);
  addTreeSitterFile(graph, cwd, file, languageId, extracted, ignoredIds);
  if (extracted.symbols.length === 0) {
    const lspSymbols = await getOpenDocumentSymbols(file);
    const added = lspSymbols ? addLspFallbackSymbols(graph, file, languageId, lspSymbols) : 0;
    logReviewGraph({
      phase: "lsp_symbol_fallback",
      cwd,
      reason: lspSymbols ? added > 0 ? "added" : "empty-response" : "unavailable-or-failed",
      nodes: added
    });
  }
  if (kind === "cxx") {
    addCxxIncludeEdges(graph, cwd, file, ignoredIds, contentOverride);
  }
}
var _rebuildCounters = {
  restoreComparisons: 0,
  importTargetEdgeScans: 0,
  removeOwnedEdgeVisits: 0,
  removeOwnedEdgePositions: 0
};
function _getReviewGraphRebuildCountersForTests() {
  return { ..._rebuildCounters };
}
function _resetReviewGraphRebuildCountersForTests() {
  _rebuildCounters.restoreComparisons = 0;
  _rebuildCounters.importTargetEdgeScans = 0;
  _rebuildCounters.removeOwnedEdgeVisits = 0;
  _rebuildCounters.removeOwnedEdgePositions = 0;
}
function edgeIdentityKey(edge) {
  _rebuildCounters.restoreComparisons++;
  return JSON.stringify([edge.from, edge.kind, edge.metadata ?? {}]);
}
function restoreValidIncomingEdges(graph, edges) {
  const seenByTarget = /* @__PURE__ */ new Map();
  for (const edge of edges) {
    if (!graph.nodes.has(edge.from) || !graph.nodes.has(edge.to))
      continue;
    let seen = seenByTarget.get(edge.to);
    if (!seen) {
      seen = /* @__PURE__ */ new Set();
      for (const candidate of graph.edgesByTo.get(edge.to) ?? []) {
        seen.add(edgeIdentityKey(candidate));
      }
      seenByTarget.set(edge.to, seen);
    }
    const key = edgeIdentityKey(edge);
    if (seen.has(key))
      continue;
    seen.add(key);
    addEdge(graph, edge);
  }
}
function dedupeResolvedEdges(graph, replacements) {
  const resolvedEdges = new Set(replacements.map(([, after]) => after));
  const seenByTarget = /* @__PURE__ */ new Map();
  const removed = /* @__PURE__ */ new Set();
  for (const [, edge] of replacements) {
    if (removed.has(edge))
      continue;
    let seen = seenByTarget.get(edge.to);
    if (!seen) {
      seen = /* @__PURE__ */ new Set();
      for (const candidate of graph.edgesByTo.get(edge.to) ?? []) {
        if (!resolvedEdges.has(candidate)) {
          seen.add(edgeIdentityKey(candidate));
        }
      }
      seenByTarget.set(edge.to, seen);
    }
    const key = edgeIdentityKey(edge);
    if (seen.has(key)) {
      removed.add(edge);
      unindexEdge(graph, edge);
      continue;
    }
    seen.add(key);
  }
  if (removed.size > 0) {
    graph.edges = graph.edges.filter((edge) => !removed.has(edge));
  }
}
var _graphImportChanges = /* @__PURE__ */ new WeakMap();
function getGraphImportChanges(graph) {
  return _graphImportChanges.get(graph);
}
function importTargetsForFile(graph, filePath) {
  const normalized = normalizeMapKey(filePath);
  const fileNodeId = graph.fileNodes.get(normalized) ?? `file:${normalized}`;
  const targets = /* @__PURE__ */ new Set();
  for (const edge of graph.edgesByFrom.get(fileNodeId) ?? []) {
    _rebuildCounters.importTargetEdgeScans++;
    if (edge.kind !== "imports")
      continue;
    const target = graph.nodes.get(edge.to)?.filePath;
    if (target)
      targets.add(normalizeMapKey(target));
  }
  return [...targets].sort((a, b) => compareOrdinal(a, b));
}
async function updateGraphFiles(graph, cwd, files, facts, ignoredIds) {
  rebuildIndexes(graph);
  const prior = files.map((file) => ({
    filePath: normalizeMapKey(file),
    existedBefore: graph.fileNodes.has(normalizeMapKey(file)),
    priorTargets: importTargetsForFile(graph, file)
  }));
  const preservedIncoming = [];
  const removedEdges = /* @__PURE__ */ new Set();
  for (const file of files) {
    preservedIncoming.push(...removeFileOwnedGraphData(graph, file, removedEdges));
    await addFileToGraph(graph, cwd, file, ignoredIds);
  }
  if (removedEdges.size > 0) {
    unindexEdges(graph, removedEdges);
    graph.edges = graph.edges.filter((edge) => !removedEdges.has(edge));
  }
  restoreValidIncomingEdges(graph, preservedIncoming);
  resolveDeferredSymbolEdges(graph, false);
  graph.changedSymbolsByFile.clear();
  for (const file of files) {
    upsertChangedSymbols(graph, facts, file);
  }
  return prior.map(({ filePath, existedBefore, priorTargets }) => ({
    filePath,
    existedBefore,
    existsAfter: graph.fileNodes.has(filePath),
    priorTargets,
    newTargets: importTargetsForFile(graph, filePath)
  }));
}
function resolveDeferredSymbolEdges(graph, rebuild = true) {
  const symbolNameToIds = /* @__PURE__ */ new Map();
  for (const node of graph.nodes.values()) {
    if (node.kind !== "symbol" || !node.symbolName)
      continue;
    if (node.metadata?.unresolvedName)
      continue;
    const ids = symbolNameToIds.get(node.symbolName) ?? [];
    ids.push(node.id);
    symbolNameToIds.set(node.symbolName, ids);
  }
  const replacements = [];
  graph.edges = graph.edges.map((edge) => {
    const targetNode = graph.nodes.get(edge.to);
    if (!targetNode?.metadata?.unresolvedName)
      return edge;
    const candidates = symbolNameToIds.get(targetNode.symbolName ?? "") ?? [];
    const importHintFile = edge.metadata?.importHintFile;
    if (importHintFile) {
      const scoped = candidates.filter((id) => graph.nodes.get(id)?.filePath === importHintFile);
      if (scoped.length === 1) {
        const resolved = {
          ...edge,
          to: scoped[0],
          resolution: "import"
        };
        replacements.push([edge, resolved]);
        return resolved;
      }
    }
    if (candidates.length === 1) {
      const resolved = {
        ...edge,
        to: candidates[0],
        resolution: "exact"
      };
      replacements.push([edge, resolved]);
      return resolved;
    }
    return edge;
  });
  if (rebuild) {
    rebuildIndexes(graph);
    return;
  }
  if (replacements.length === 0)
    return;
  const affectedTargets = /* @__PURE__ */ new Set();
  for (const [before, after] of replacements) {
    const fromBucket = graph.edgesByFrom.get(before.from);
    if (fromBucket) {
      const at = fromBucket.indexOf(before);
      if (at >= 0)
        fromBucket[at] = after;
    }
    affectedTargets.add(before.to);
    affectedTargets.add(after.to);
  }
  for (const target of affectedTargets)
    graph.edgesByTo.set(target, []);
  for (const edge of graph.edges) {
    if (affectedTargets.has(edge.to))
      graph.edgesByTo.get(edge.to)?.push(edge);
  }
  for (const target of affectedTargets) {
    if (graph.edgesByTo.get(target)?.length === 0) {
      graph.edgesByTo.delete(target);
    }
  }
  dedupeResolvedEdges(graph, replacements);
}
function verifiedCacheFields(seqAtBuildStart) {
  return {
    builtAtProjectSeq: seqAtBuildStart,
    lastFullVerifyMs: Date.now(),
    fastPathSinceVerify: 0
  };
}
async function tryIncrementalFromCache(cached, ctx) {
  if (cached.fileSignatures.size === 0)
    return void 0;
  const { added, removed, changed } = diffSignatureMaps(cached.fileSignatures, ctx.fileSignatures);
  if (removed.length > 0)
    return void 0;
  if (added.length === 0 && changed.length === 0)
    return void 0;
  const { trulyChanged, hashes } = await confirmContentChanged(changed, cached.fileHashes);
  const filesToUpdate = [...added, ...trulyChanged];
  if (filesToUpdate.length === 0) {
    const generation2 = cached.buildGeneration ?? ++_graphGenerationCounter;
    const graph2 = cloneGraph(cached.graph);
    rebuildIndexes(graph2);
    graph2.changedSymbolsByFile.clear();
    for (const file of ctx.normalizedChanged) {
      upsertChangedSymbols(graph2, ctx.facts, file);
    }
    setWorkspaceGraph(ctx.normalizedCwd, {
      signature: ctx.signature,
      fileSignatures: new Map(ctx.fileSignatures),
      fileHashes: hashes,
      graph: cloneGraph(cached.graph),
      buildGeneration: generation2,
      ...verifiedCacheFields(ctx.seqAtBuildStart)
    }, ctx.cacheEpoch);
    setGraphBuildInfo(graph2, {
      reused: true,
      mode: "cached",
      graphChanged: false
    });
    graph2.buildGeneration = generation2;
    setSessionReviewGraphFact(ctx.cwd, ctx.facts, graph2);
    return graph2;
  }
  for (const file of added) {
    hashes.set(file, contentHashEntry(file));
  }
  const priorGeneration = cached.graph.buildGeneration;
  const graph = cloneGraph(cached.graph);
  const importChanges = await updateGraphFiles(graph, ctx.cwd, filesToUpdate, ctx.facts, ctx.ignoredIds);
  refreshGraphBuiltAt(graph);
  const generation = ++_graphGenerationCounter;
  graph.buildGeneration = generation;
  setWorkspaceGraph(ctx.normalizedCwd, {
    signature: ctx.signature,
    fileSignatures: new Map(ctx.fileSignatures),
    fileHashes: hashes,
    graph,
    buildGeneration: generation,
    ...verifiedCacheFields(ctx.seqAtBuildStart)
  }, ctx.cacheEpoch);
  const persistReason = persistGraph(ctx.cwd, ctx.signature, ctx.fileSignatures, hashes, graph, {
    buildId: ctx.buildId,
    projectSeq: ctx.seqAtBuildStart,
    seqHint: ctx.seqHint,
    mode: ctx.mode,
    resolveIdentity: ctx.resolveIdentity
  });
  setGraphBuildInfo(graph, {
    reused: true,
    mode: "incremental",
    ...persistReason ? { persistReason } : {},
    graphChanged: true
  });
  _graphImportChanges.set(graph, {
    fromGeneration: priorGeneration,
    changes: importChanges
  });
  setSessionReviewGraphFact(ctx.cwd, ctx.facts, graph);
  return graph;
}
function hasGraphKindExtension(file) {
  const kind = detectFileKind(file);
  return !!kind && MAIN_KINDS.has(kind) && detectFileRole(file) !== "test";
}
async function trySeqFastpath(cwd, buildId, normalizedCwd, normalizedChanged, facts, seqHint, seqAtBuildStart, ignoredIds, cacheEpoch, resolveIdentity) {
  const cached = _workspaceGraphCache.get(normalizedCwd);
  const cachedCoverage = cached?.graph.persistCoverage;
  if (cachedCoverage?.partial && cachedCoverage.capTrimmed !== true) {
    return { fallback: "partial-base" };
  }
  if (!cached || cached.builtAtProjectSeq === void 0) {
    return { fallback: "no-seq" };
  }
  const now = Date.now();
  const ageMs = cached.lastFullVerifyMs === void 0 ? Number.POSITIVE_INFINITY : now - cached.lastFullVerifyMs;
  const sinceVerify = cached.fastPathSinceVerify ?? 0;
  if (ageMs > SEQ_FASTPATH_REVERIFY_MS || sinceVerify >= SEQ_FASTPATH_REVERIFY_EVERY) {
    return { fallback: "verify-due" };
  }
  const changedSet = new Set(seqHint.getFilesChangedSince(cached.builtAtProjectSeq).map((file) => normalizeMapKey(file)));
  for (const file of normalizedChanged)
    changedSet.add(file);
  for (const file of _wasmTrappedFiles.keys()) {
    if (cached.fileSignatures.has(file))
      changedSet.add(file);
  }
  const changed = [...changedSet];
  if (changed.length > SEQ_FASTPATH_MAX_CHANGES) {
    return { fallback: "too-many-changes" };
  }
  const candidateFiles = [];
  for (const file of changed) {
    const known = cached.fileSignatures.has(file);
    let existsOnDisk = false;
    try {
      existsOnDisk = fs2.statSync(file).isFile();
    } catch {
      existsOnDisk = false;
    }
    if (!existsOnDisk) {
      if (known) {
        return { fallback: "removed-file" };
      }
      continue;
    }
    if (!known) {
      if (!hasGraphKindExtension(file))
        continue;
    }
    candidateFiles.push(file);
  }
  const candidateStats = candidateFiles.map((file) => [file, sourceSignatureEntry(file)]);
  const { trulyChanged, hashes } = await confirmContentChanged(candidateFiles, cached.fileHashes);
  if (trulyChanged.length === 0) {
    const graph2 = cloneGraph(cached.graph);
    rebuildIndexes(graph2);
    graph2.changedSymbolsByFile.clear();
    for (const file of normalizedChanged) {
      upsertChangedSymbols(graph2, facts, file);
    }
    const nextSignatures2 = new Map(cached.fileSignatures);
    for (const [file, stat] of candidateStats) {
      nextSignatures2.set(file, stat);
    }
    cached.signature = sourceSignatureFromMap(nextSignatures2);
    cached.fileSignatures = nextSignatures2;
    cached.fileHashes = hashes;
    cached.builtAtProjectSeq = seqAtBuildStart;
    cached.fastPathSinceVerify = sinceVerify + 1;
    const generation2 = cached.buildGeneration ??= ++_graphGenerationCounter;
    setGraphBuildInfo(graph2, {
      reused: true,
      mode: "seq-fastpath",
      graphChanged: false
    });
    graph2.buildGeneration = generation2;
    setSessionReviewGraphFact(cwd, facts, graph2);
    return { graph: graph2 };
  }
  const filesToUpdate = trulyChanged;
  const priorGeneration = cached.graph.buildGeneration;
  const graph = cloneGraph(cached.graph);
  let importChanges;
  try {
    importChanges = await updateGraphFiles(graph, cwd, filesToUpdate, facts, ignoredIds);
  } catch {
    return { fallback: "stat-error" };
  }
  refreshGraphBuiltAt(graph);
  const nextSignatures = new Map(cached.fileSignatures);
  for (const [file, stat] of candidateStats) {
    nextSignatures.set(file, stat);
  }
  const nextSignature = sourceSignatureFromMap(nextSignatures);
  const generation = ++_graphGenerationCounter;
  graph.buildGeneration = generation;
  setWorkspaceGraph(normalizedCwd, {
    signature: nextSignature,
    fileSignatures: nextSignatures,
    fileHashes: hashes,
    graph,
    buildGeneration: generation,
    // Build-start seq, not stamp-time: see verifiedCacheFields — a bump that
    // interleaved during updateGraphFiles' awaits must be re-diffed next build.
    builtAtProjectSeq: seqAtBuildStart,
    lastFullVerifyMs: cached.lastFullVerifyMs,
    fastPathSinceVerify: sinceVerify + 1
  }, cacheEpoch);
  const persistReason = persistGraph(cwd, nextSignature, nextSignatures, hashes, graph, {
    buildId,
    projectSeq: seqAtBuildStart,
    seqHint: true,
    mode: "seq-fastpath",
    resolveIdentity
  });
  setGraphBuildInfo(graph, {
    reused: true,
    mode: "seq-fastpath",
    ...persistReason ? { persistReason } : {},
    graphChanged: true
  });
  _graphImportChanges.set(graph, {
    fromGeneration: priorGeneration,
    changes: importChanges
  });
  setSessionReviewGraphFact(cwd, facts, graph);
  return { graph };
}
async function _doBuildGraph(cwd, changedFiles, facts, seqHint, buildId) {
  const resolveIdentity = createGitIdentityResolver();
  const normalizedCwd = normalizeMapKey(cwd);
  const cacheEpoch = workspaceCacheEpoch(normalizedCwd);
  if (_reviewGraphBuildGateForTests)
    await _reviewGraphBuildGateForTests();
  const normalizedChanged = changedFiles.map((file) => normalizeMapKey(file));
  const normalizedChangedSet = new Set(normalizedChanged);
  logCwdWorktreeMismatchOnce(cwd, resolveIdentity);
  if (isAtOrAboveHomeDir(path2.resolve(cwd))) {
    const graph2 = createEmptyGraph();
    for (const file of normalizedChanged) {
      upsertChangedSymbols(graph2, facts, file);
    }
    setGraphBuildInfo(graph2, {
      reused: false,
      mode: "skipped",
      skipReason: "unsafe_root",
      // #459: never persisted/reused, same as the too_many_files skip below —
      // treat as changed so dependents never trust stale derived state.
      graphChanged: true
    });
    setSessionReviewGraphFact(cwd, facts, graph2);
    return graph2;
  }
  const seqAtBuildStart = seqHint?.projectSeq();
  const ignoredIdsPromise = collectUntrackedIgnoredIds(cwd);
  let seqFastpathFallback;
  if (seqHint && seqAtBuildStart !== void 0 && seqFastpathEnabled()) {
    const fast = await trySeqFastpath(cwd, buildId, normalizedCwd, normalizedChanged, facts, seqHint, seqAtBuildStart, await ignoredIdsPromise, cacheEpoch, resolveIdentity);
    if ("graph" in fast)
      return fast.graph;
    seqFastpathFallback = fast.fallback;
  }
  const sourceCollection = await getGraphSourceFiles(cwd);
  const filesToBuild = sourceCollection.files;
  const sourceFileCount = sourceCollection.sourceFileCount;
  const pathNormalizeCalls = sourceCollection.pathNormalizeCalls;
  const sourceFilesTruncated = sourceCollection.entryBudgetExceeded;
  const ignoredIds = await ignoredIdsPromise;
  const maxGraphFiles = sourceCollection.maxFileCount;
  if (filesToBuild.length > maxGraphFiles) {
    const graph2 = createEmptyGraph();
    graph2.version = REVIEW_GRAPH_VERSION;
    graph2.builtAt = (/* @__PURE__ */ new Date()).toISOString();
    for (const file of normalizedChanged) {
      upsertChangedSymbols(graph2, facts, file);
    }
    recordReviewGraphSizeSkip(cwd, sourceFileCount, maxGraphFiles);
    logLatency({
      type: "phase",
      phase: "review_graph_size_skip",
      filePath: cwd,
      durationMs: 0,
      metadata: {
        cwd,
        sourceFileCount,
        maxFileCount: maxGraphFiles,
        sourceFileCountLabel: `more than ${maxGraphFiles} files`,
        sourceFileCountTruncated: true
      }
    });
    if (isReviewGraphSizeNearMiss(sourceFileCount, maxGraphFiles)) {
      logLatency({
        type: "phase",
        phase: "review_graph_size_near_miss",
        filePath: cwd,
        durationMs: 0,
        metadata: {
          cwd,
          maxFileCount: maxGraphFiles,
          sourceFileCount,
          sourceFileCountLabel: `more than ${maxGraphFiles} files`,
          sourceFileCountTruncated: true
        }
      });
    }
    setGraphBuildInfo(graph2, {
      reused: false,
      mode: "skipped",
      skipReason: "too_many_files",
      sourceFileCount,
      sourceFileCountTruncated: sourceFilesTruncated || filesToBuild.length > maxGraphFiles,
      maxFileCount: maxGraphFiles,
      pathNormalizeCalls,
      seqFastpathFallback,
      // #459: a fresh empty graph is returned every call on this path (never
      // persisted/reused) — treat it as changed so dependents never trust stale
      // derived state across skip/unskip transitions. Deliberately NOT stamped
      // with a buildGeneration: absent ⇒ derived caches rebuild every time.
      graphChanged: true
    });
    setSessionReviewGraphFact(cwd, facts, graph2);
    return graph2;
  }
  if (!sourceFilesTruncated)
    clearReviewGraphSizeSkip(cwd);
  const fileSignatures = await sourceSignatureMapAsync(filesToBuild);
  const signature = sourceSignatureFromMap(fileSignatures);
  let memCached = sourceFilesTruncated ? void 0 : _workspaceGraphCache.get(normalizedCwd);
  const memCoverage = memCached?.graph.persistCoverage;
  if (memCoverage?.partial && memCoverage.capTrimmed !== true) {
    memCached = void 0;
  }
  if (memCached?.signature === signature) {
    touchWorkspaceGraph(normalizedCwd);
    const graph2 = cloneGraph(memCached.graph);
    rebuildIndexes(graph2);
    graph2.changedSymbolsByFile.clear();
    for (const file of normalizedChanged) {
      upsertChangedSymbols(graph2, facts, file);
    }
    Object.assign(memCached, verifiedCacheFields(seqAtBuildStart));
    const generation2 = memCached.buildGeneration ??= ++_graphGenerationCounter;
    setGraphBuildInfo(graph2, {
      reused: true,
      mode: "cached",
      seqFastpathFallback,
      graphChanged: false
    });
    graph2.buildGeneration = generation2;
    setSessionReviewGraphFact(cwd, facts, graph2);
    return graph2;
  }
  if (memCached) {
    const incremental = await tryIncrementalFromCache(memCached, {
      cwd,
      buildId,
      seqHint: seqHint !== void 0,
      mode: "incremental",
      normalizedCwd,
      normalizedChanged,
      fileSignatures,
      signature,
      facts,
      seqAtBuildStart,
      ignoredIds,
      cacheEpoch,
      resolveIdentity
    });
    if (incremental) {
      updateGraphBuildInfo(incremental, { seqFastpathFallback });
      return incremental;
    }
  }
  const diskCached = sourceFilesTruncated ? null : loadPersistedGraph(cwd, void 0, resolveIdentity);
  if (diskCached?.signature === signature) {
    const graph2 = cloneGraph(diskCached.graph);
    rebuildIndexes(graph2);
    graph2.changedSymbolsByFile.clear();
    for (const file of normalizedChanged) {
      upsertChangedSymbols(graph2, facts, file);
    }
    const generation2 = ++_graphGenerationCounter;
    setWorkspaceGraph(normalizedCwd, {
      signature,
      fileSignatures: new Map(fileSignatures),
      fileHashes: diskCached.fileHashes,
      graph: cloneGraph(diskCached.graph),
      buildGeneration: generation2,
      ...verifiedCacheFields(seqAtBuildStart)
    }, cacheEpoch);
    setGraphBuildInfo(graph2, {
      reused: true,
      mode: "cached",
      seqFastpathFallback,
      graphChanged: false
    });
    graph2.buildGeneration = generation2;
    setSessionReviewGraphFact(cwd, facts, graph2);
    return graph2;
  }
  if (diskCached) {
    const incremental = await tryIncrementalFromCache({
      signature: diskCached.signature,
      fileSignatures: diskCached.fileSignatures,
      fileHashes: diskCached.fileHashes,
      graph: diskCached.graph
    }, {
      cwd,
      buildId,
      seqHint: seqHint !== void 0,
      mode: "incremental",
      normalizedCwd,
      normalizedChanged,
      fileSignatures,
      signature,
      facts,
      seqAtBuildStart,
      ignoredIds,
      resolveIdentity
    });
    if (incremental) {
      updateGraphBuildInfo(incremental, { seqFastpathFallback });
      return incremental;
    }
  }
  const resumed = sourceFilesTruncated ? null : await tryResumeFromCheckpoint(cwd, filesToBuild, ignoredIds, resolveIdentity);
  const graph = resumed?.graph ?? createEmptyGraph();
  const filesToExtract = resumed?.remaining ?? filesToBuild;
  const treeSitterClient = getSharedTreeSitterClient();
  treeSitterClient?.ensureTreeCacheCapacity(filesToExtract.length);
  const extractionStartedAt = Date.now();
  const fileHashes = resumed?.fileHashes ?? /* @__PURE__ */ new Map();
  const checkpointEvery = graphCheckpointEveryFiles();
  const checkpointMinIntervalMs = graphCheckpointMinIntervalMs();
  const testStopAfter = Number(process.env.PI_LENS_GRAPH_CHECKPOINT_TEST_STOP_AFTER);
  let filesSinceCheckpoint = 0;
  let lastCheckpointMs = Date.now();
  let extractedCount = 0;
  const extractFiles = async () => {
    for (const file of filesToExtract) {
      let content;
      try {
        const bytes = fs2.readFileSync(file);
        content = bytes.toString("utf-8");
        fileHashes.set(file, createHash2("sha256").update(bytes).digest("hex"));
      } catch {
        content = null;
        fileHashes.set(file, "missing");
      }
      await addFileToGraph(graph, cwd, file, ignoredIds, content);
      if (normalizedChangedSet.has(file)) {
        upsertChangedSymbols(graph, facts, file);
      }
      extractedCount++;
      filesSinceCheckpoint++;
      if (Number.isFinite(testStopAfter) && testStopAfter > 0 && extractedCount >= testStopAfter) {
        writeReviewGraphCheckpointSync(cwd, buildReviewGraphCheckpointData(cwd, graph, fileHashes, filesToBuild.length, ignoredIds, resolveIdentity), {
          nodes: graph.nodes.size,
          edges: graph.edges.length,
          processed: fileHashes.size,
          target: filesToBuild.length
        });
        throw new Error("__review_graph_checkpoint_test_abort__");
      }
      const remainingAfter = filesToExtract.length - extractedCount;
      if (filesSinceCheckpoint >= checkpointEvery && remainingAfter >= checkpointEvery && Date.now() - lastCheckpointMs >= checkpointMinIntervalMs) {
        writeReviewGraphCheckpoint(cwd, graph, fileHashes, filesToBuild.length, ignoredIds, resolveIdentity);
        filesSinceCheckpoint = 0;
        lastCheckpointMs = Date.now();
      }
    }
  };
  const extractAndDrainIr = async () => {
    try {
      await extractFiles();
    } finally {
      clearReviewGraphFileIr(cwd);
    }
  };
  if (treeSitterClient) {
    await treeSitterClient.withParseCacheMeasurement(extractAndDrainIr, (stats) => {
      logTreeSitterCacheStats({
        scope: "review_graph_full",
        filePath: cwd,
        fileCount: filesToBuild.length,
        durationMs: Date.now() - extractionStartedAt,
        stats,
        // #1982: this scope never runs an ast-grep pass (extraction is
        // tree-sitter only), so durationMs carries none and explicit
        // zeros keep every cache_stats record uniformly parseable.
        astGrep: { durationMs: 0, fileCount: 0 }
      });
    });
  } else {
    await extractAndDrainIr();
  }
  if (resumed) {
    for (const file of normalizedChangedSet) {
      if (resumed.fileHashes.has(file)) {
        upsertChangedSymbols(graph, facts, file);
      }
    }
  }
  resolveDeferredSymbolEdges(graph);
  graph.version = REVIEW_GRAPH_VERSION;
  graph.builtAt = (/* @__PURE__ */ new Date()).toISOString();
  graph.persistCoverage = sourceFilesTruncated ? graphCoverage(graph, graphPersistMaxElements(), sourceFileCount, true, filesToBuild) : void 0;
  deleteReviewGraphCheckpoint(cwd);
  const generation = ++_graphGenerationCounter;
  const retained = retainedGraph(cwd, graph);
  const wasCapped = retained !== graph;
  const graphSnapshot = wasCapped ? retained : cloneGraph(graph);
  if (!wasCapped)
    rebuildIndexes(graphSnapshot);
  graphSnapshot.buildGeneration = generation;
  setWorkspaceGraph(normalizedCwd, {
    signature,
    fileSignatures: new Map(fileSignatures),
    fileHashes,
    graph: graphSnapshot,
    buildGeneration: generation,
    ...verifiedCacheFields(seqAtBuildStart)
  }, cacheEpoch);
  const persistReason = persistGraph(cwd, signature, fileSignatures, fileHashes, graphSnapshot, {
    buildId,
    projectSeq: seqAtBuildStart,
    seqHint: seqHint !== void 0,
    mode: "full",
    sourceFileCount,
    sourceFilesTruncated,
    resolveIdentity
  });
  setGraphBuildInfo(graph, {
    reused: false,
    mode: "full",
    sourceFileCount,
    sourceFileCountTruncated: sourceFilesTruncated,
    pathNormalizeCalls,
    seqFastpathFallback,
    ...persistReason ? { persistReason } : {},
    graphChanged: true
  });
  graph.buildGeneration = generation;
  setSessionReviewGraphFact(cwd, facts, graphSnapshot);
  return graph;
}
function buildCacheKey(cwd, changedFiles) {
  return `${buildCacheWorkspaceKey(cwd)}|${[...changedFiles].sort((a, b) => compareOrdinal(a, b)).join(",")}`;
}
function isGraphBuildInFlight(cwd, changedFiles = []) {
  return _buildCache.has(buildCacheKey(cwd, changedFiles));
}
function buildOrUpdateGraph(cwd, changedFiles, facts, seqHint) {
  const cacheKey = buildCacheKey(cwd, changedFiles);
  const cached = _buildCache.get(cacheKey);
  if (cached)
    return cached;
  const startedAt = Date.now();
  const buildId = ++_buildIdCounter;
  recordBuildAttempt(cwd, "running", void 0, buildId);
  const startedProjectSeq = seqHint?.projectSeq();
  logReviewGraph({
    cwd,
    phase: "build_started",
    observability: {
      graph: {
        buildId,
        ...startedProjectSeq === void 0 ? {} : { projectSeq: startedProjectSeq },
        ...seqHint === void 0 ? {} : { seqHint: true },
        nodes: 0,
        edges: 0
      }
    }
  });
  const promise = _doBuildGraph(cwd, changedFiles, facts, seqHint, buildId).then((graph) => {
    let buildInfo = getGraphBuildInfoForGraph(graph);
    const wasmTrappedFiles = wasmTrappedFileCount(graph);
    if (wasmTrappedFiles > 0) {
      buildInfo = updateGraphBuildInfo(graph, { wasmTrappedFiles });
    }
    if (buildInfo.mode === "skipped") {
      const reason = buildInfo.skipReason ?? "skipped";
      recordBuildAttempt(cwd, "skipped", reason, buildId);
      logReviewGraph({
        cwd,
        phase: "build_skipped",
        reason,
        durationMs: Date.now() - startedAt,
        observability: {
          graph: graphLogMetadata(graph, {
            buildId,
            projectSeq: startedProjectSeq,
            seqHint: seqHint !== void 0,
            mode: buildInfo.mode,
            sourceFileCount: buildInfo.sourceFileCount,
            sourceFileCountTruncated: buildInfo.sourceFileCountTruncated,
            pathNormalizeCalls: buildInfo.pathNormalizeCalls
          })
        }
      });
    } else {
      const reason = buildInfo.persistReason;
      recordBuildAttempt(cwd, "succeeded", reason, buildId);
      logReviewGraph({
        cwd,
        phase: "build_succeeded",
        durationMs: Date.now() - startedAt,
        nodes: graph.nodes.size,
        edges: graph.edges.length,
        ...reason ? { reason } : {},
        observability: {
          graph: graphLogMetadata(graph, {
            buildId,
            projectSeq: startedProjectSeq,
            seqHint: seqHint !== void 0,
            mode: buildInfo.mode,
            sourceFileCount: buildInfo.sourceFileCount,
            sourceFileCountTruncated: buildInfo.sourceFileCountTruncated,
            pathNormalizeCalls: buildInfo.pathNormalizeCalls
          })
        }
      });
    }
    return graph;
  }).catch((err) => {
    const reason = err instanceof Error ? err.message : String(err);
    const wasmFailure = classifyTreeSitterWasmError(err);
    recordBuildAttempt(cwd, "failed", reason, buildId);
    logReviewGraph({
      cwd,
      phase: "build_failed",
      // #3605: an internal wasm failure, not a failed build.
      failureClass: wasmFailure ? `wasm-${wasmFailure}` : "error",
      reason,
      durationMs: Date.now() - startedAt,
      error: reason,
      observability: {
        graph: {
          buildId,
          ...seqHint === void 0 ? {} : { seqHint: true },
          nodes: 0,
          edges: 0
        }
      }
    });
    throw err;
  });
  _buildCache.set(cacheKey, promise);
  const release = () => {
    if (_buildCache.get(cacheKey) === promise)
      _buildCache.delete(cacheKey);
  };
  promise.then(release, release);
  return promise;
}
function extractSymbolsAndRefsFromGraph(graph) {
  const allSymbols = /* @__PURE__ */ new Map();
  const allRefs = /* @__PURE__ */ new Map();
  const nodeSymbols = /* @__PURE__ */ new Map();
  const coverage = {
    totalEvidence: 0,
    callsEvidence: 0,
    referencesEvidence: 0,
    eligibleEvidence: 0,
    resolvedEvidence: 0,
    unresolvedEvidence: 0,
    typeOnlyEvidence: 0,
    unsupportedEvidence: 0,
    sameFileEvidence: 0,
    duplicateEvidence: 0,
    complete: graph.persistCoverage?.partial !== true && graph.persistCoverage?.inProgress !== true,
    languages: {}
  };
  const numberMetadata = (node, key) => {
    const value = node?.metadata?.[key];
    return typeof value === "number" && Number.isFinite(value) ? value : void 0;
  };
  const symbolKind = (node) => {
    switch (node.symbolKind) {
      case "class":
      case "interface":
      case "type":
      case "variable":
      case "method":
      case "property":
      case "function":
        return node.symbolKind;
      default:
        return "function";
    }
  };
  for (const node of graph.nodes.values()) {
    if (node.kind !== "symbol" || !node.filePath || !node.symbolName)
      continue;
    const sym = {
      id: node.id,
      name: node.symbolName,
      kind: symbolKind(node),
      filePath: node.filePath,
      line: numberMetadata(node, "line") ?? 1,
      endLine: numberMetadata(node, "endLine"),
      column: numberMetadata(node, "column") ?? 1,
      isExported: node.exported === true
    };
    nodeSymbols.set(node.id, sym);
    const list = allSymbols.get(node.filePath) ?? [];
    list.push(sym);
    allSymbols.set(node.filePath, list);
  }
  const addRef = (ref) => {
    const list = allRefs.get(ref.filePath) ?? [];
    list.push(ref);
    allRefs.set(ref.filePath, list);
  };
  for (const edge of graph.edges) {
    if (edge.kind !== "calls" && edge.kind !== "references")
      continue;
    coverage.totalEvidence++;
    if (edge.kind === "calls")
      coverage.callsEvidence++;
    else
      coverage.referencesEvidence++;
    const fromNode = graph.nodes.get(edge.from);
    const targetNode = graph.nodes.get(edge.to);
    const callerFile = fromNode?.kind === "symbol" ? fromNode.filePath : fromNode?.kind === "file" ? fromNode.filePath : edge.from.startsWith("file:") ? edge.from.slice("file:".length) : void 0;
    if (!callerFile) {
      coverage.unsupportedEvidence++;
      continue;
    }
    const metadata = edge.metadata ?? {};
    const referenceKind = edge.kind === "calls" ? "call" : metadata.referenceKind === "call" ? "call" : metadata.referenceKind === "type" ? "type" : "unknown";
    const resolution = edge.resolution ?? (targetNode && !targetNode.metadata?.unresolvedName ? "exact" : "unresolved");
    const targetSymbol = nodeSymbols.get(edge.to);
    const targetName = targetNode?.symbolName ?? (edge.to.startsWith("symbol-name:") ? edge.to.slice("symbol-name:".length) : void 0);
    const line = typeof metadata.line === "number" ? metadata.line : numberMetadata(fromNode, "line") ?? 1;
    const column = typeof metadata.column === "number" ? metadata.column : numberMetadata(fromNode, "column") ?? 1;
    addRef({
      symbolId: targetName ? `${callerFile}:${targetName}` : edge.to,
      filePath: callerFile,
      line,
      column,
      evidenceKind: edge.kind,
      referenceKind,
      targetId: edge.to,
      callerSymbolId: fromNode?.kind === "symbol" ? fromNode.id : void 0,
      resolution,
      targetName,
      targetKind: targetNode?.symbolKind,
      targetFilePath: targetNode?.filePath,
      targetLine: numberMetadata(targetNode, "line"),
      targetColumn: numberMetadata(targetNode, "column")
    });
    if (referenceKind === "type")
      coverage.typeOnlyEvidence++;
    else if (referenceKind !== "call")
      coverage.unsupportedEvidence++;
    else if (!targetSymbol || resolution === "name-only" || resolution === "unresolved") {
      coverage.unresolvedEvidence++;
    } else {
      coverage.eligibleEvidence++;
      coverage.resolvedEvidence++;
    }
  }
  let sawRelevantFileNode = false;
  for (const node of graph.nodes.values()) {
    if (node.kind !== "file")
      continue;
    sawRelevantFileNode = true;
    const extraction = node.metadata?.extractionCoverage;
    const statuses = extraction ? Object.values(extraction) : [];
    const languageStatus = !extraction || statuses.length === 0 || statuses.includes("unavailable") ? "unavailable" : statuses.includes("partial") ? "partial" : "complete";
    if (languageStatus !== "complete")
      coverage.complete = false;
    if (node.language) {
      const prior = coverage.languages[node.language];
      coverage.languages[node.language] = prior === "unavailable" || languageStatus === "unavailable" ? "unavailable" : prior === "partial" || languageStatus === "partial" ? "partial" : languageStatus;
    }
  }
  if (!sawRelevantFileNode)
    coverage.complete = false;
  return { allSymbols, allRefs, coverage };
}

export {
  fileContentProvider,
  SYMBOL_KIND_NAMES,
  formatReviewGraphRevisionDriftNote,
  reviewGraphIrContentHash,
  publishReviewGraphFileIr,
  REVIEW_GRAPH_VERSION,
  _resetReviewGraphSourcePathMemoForTests,
  graphWasmTrapDetail,
  getGraphBuildInfoForGraph,
  graphBuildInfoIsTrustworthy,
  clearGraphCache,
  clearReviewGraphWorkspaceCache,
  _setReviewGraphBuildGateForTests,
  estimateReviewGraphStoreBytes,
  getReviewGraphWorkspaceCacheSnapshot,
  _getReviewGraphWorkspaceCacheKeysForTests,
  _setReviewGraphWorkspaceEntryForTests,
  _setSessionReviewGraphFactForTests,
  _persistedCoverageForTests,
  _getReviewGraphWorkspaceGraphForTests,
  _getReviewGraphCacheStateForTests,
  getReviewGraphCacheIdentity,
  _resetCwdWorktreeMismatchLogForTests,
  getLastGraphBuildInfo,
  _setLastGraphBuildInfoForTests,
  getCachedReviewGraph,
  getReviewGraphRevisionDrift,
  _resetReviewGraphSizeSkipTtlForTests,
  getLastReviewGraphBuildAttempt,
  _resetReviewGraphBuildAttemptsForTests,
  _resetReviewGraphSizeSkipVerdictsForTests,
  getReviewGraphSizeSkipVerdict,
  _setReviewGraphEntryBudgetForTests,
  _setReviewGraphEntryCounterForTests,
  getGraphSourceFiles,
  isReviewGraphMigrationNeeded,
  GRAPH_PERSIST_MAX_ELEMENTS_DEFAULT,
  refreshReviewGraphPersistWorkerHeapStatistics,
  getReviewGraphPersistWorkerHeapStatistics,
  flushReviewGraphPersistsForExitForTests,
  _resetReviewGraphStageSweepForTests,
  _readReviewGraphCheckpointForTests,
  flushReviewGraphPersistsForTests,
  waitForReviewGraphPersistsForTests,
  terminateReviewGraphPersistWorkerForTests,
  resetReviewGraphPersistWorkerForTests,
  getCheckpointOffloadCountForTests,
  getReviewGraphWorkerFallbackReasonForTests,
  reviewGraphCachePath,
  flushReviewGraphPersist,
  mapKindToTreeSitterLanguage,
  captureReviewGraphStructuralIr,
  _getReviewGraphRebuildCountersForTests,
  _resetReviewGraphRebuildCountersForTests,
  getGraphImportChanges,
  isGraphBuildInFlight,
  buildOrUpdateGraph,
  extractSymbolsAndRefsFromGraph
};
