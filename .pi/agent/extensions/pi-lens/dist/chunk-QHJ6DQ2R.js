import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  resolveWebTreeSitterPackageDir
} from "./chunk-Z54ZSOBZ.js";
import {
  EXTENSION_TO_GRAMMAR,
  getUserRuleRoot,
  ruleCorpusFingerprintForCycle
} from "./chunk-724UL2TJ.js";
import {
  getPackageRoot,
  js_yaml_default,
  resolvePackagePath
} from "./chunk-QOZXJ4NA.js";
import {
  transientRetryDelayMs
} from "./chunk-VRZP76YM.js";
import {
  getProjectIgnoreMatcher,
  isExcludedDirName
} from "./chunk-C34ZXZ7O.js";
import {
  notifyUserDegradation
} from "./chunk-2BBLFX75.js";
import {
  assertInstallAllowed,
  getProjectTrustGeneration
} from "./chunk-ZANLILYD.js";
import {
  writeFileAtomic
} from "./chunk-2EECBNC5.js";
import {
  compareOrdinal,
  escapeRegExp,
  getDegradationLedgerGeneration,
  incrementDegradationCount,
  recordDegradation,
  recordDegradationOnce
} from "./chunk-JAU72XNY.js";
import {
  createNdjsonLogger,
  getGlobalPiLensLogDir,
  getMaxLogSizeMB,
  isTestMode
} from "./chunk-AOHZU2BM.js";
import {
  BoundedFifoMap
} from "./chunk-ABBOA7UD.js";
import {
  normalizeFilePath,
  normalizeLoggedPath
} from "./chunk-N2H3ZPZY.js";

// dist/clients/tree-sitter-logger.js
import * as path from "node:path";
var TREE_SITTER_LOG_DIR = getGlobalPiLensLogDir();
var TREE_SITTER_LOG_FILE = path.join(TREE_SITTER_LOG_DIR, "tree-sitter.log");
var writer = createNdjsonLogger({
  filePath: TREE_SITTER_LOG_FILE,
  maxBytes: getMaxLogSizeMB() * 1024 * 1024
});
var CACHE_COUNTER_KEYS = [
  "lookups",
  "hits",
  "misses",
  "coldMisses",
  "capacityMisses",
  "contentChangedMisses",
  "mtimeMisses",
  "statFailedMisses",
  "sets",
  "replacements",
  "evictions",
  "clears",
  "ghostHistoryDrops",
  "parserInvocations",
  "parserDurationMs",
  "parserFailures"
];
function logTreeSitter(entry) {
  if (isTestMode()) {
    return;
  }
  writer.log({
    ts: (/* @__PURE__ */ new Date()).toISOString(),
    ...entry,
    filePath: normalizeLoggedPath(entry.filePath)
  });
}
function logTreeSitterCacheStats(options) {
  const delta = Object.fromEntries(CACHE_COUNTER_KEYS.map((key) => [key, options.stats[key]]));
  logTreeSitter({
    phase: "cache_stats",
    filePath: options.filePath,
    durationMs: options.durationMs,
    metadata: {
      scope: options.scope,
      fileCount: options.fileCount,
      hitRate: delta.lookups > 0 ? delta.hits / delta.lookups : null,
      delta,
      resident: {
        size: options.stats.size,
        maxSize: options.stats.maxSize,
        totalBytes: options.stats.totalBytes,
        totalLines: options.stats.totalLines
      },
      astGrep: options.astGrep
    }
  });
}
function logTreeSitterDiagnostic(entry) {
  logTreeSitter({
    phase: "diagnostic",
    filePath: entry.filePath ?? "<tree-sitter>",
    ...entry.languageId ? { languageId: entry.languageId } : {},
    status: entry.level ?? "error",
    reason: entry.message,
    metadata: { subsystem: entry.subsystem, ...entry.metadata }
  });
}

// dist/clients/tree-sitter-client.js
import { AsyncLocalStorage } from "node:async_hooks";
import * as crypto3 from "node:crypto";
import * as fs5 from "node:fs";
import { createRequire as createRequire2 } from "node:module";
import * as path4 from "node:path";

// dist/clients/deps/web-tree-sitter.js
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
var _require = createRequire(import.meta.url);
function loadWebTreeSitter() {
  try {
    const entry = _require.resolve("web-tree-sitter");
    return import(pathToFileURL(entry).href);
  } catch {
    return import("web-tree-sitter");
  }
}

// dist/clients/grammar-source.js
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path2 from "node:path";
var TREE_SITTER_WASMS_VERSION = "0.1.13";
var GRAMMAR_CDN_BASE = `https://unpkg.com/tree-sitter-wasms@${TREE_SITTER_WASMS_VERSION}/out`;
var GRAMMAR_SOURCE_OVERRIDES = {
  "tree-sitter-lua.wasm": {
    package: "@tree-sitter-grammars/tree-sitter-lua",
    version: "0.4.1",
    url: "https://unpkg.com/@tree-sitter-grammars/tree-sitter-lua@0.4.1/tree-sitter-lua.wasm"
  },
  "tree-sitter-yaml.wasm": {
    package: "@tree-sitter-grammars/tree-sitter-yaml",
    version: "0.7.1",
    url: "https://unpkg.com/@tree-sitter-grammars/tree-sitter-yaml@0.7.1/tree-sitter-yaml.wasm"
  },
  "tree-sitter-bash.wasm": {
    package: "tree-sitter-bash",
    version: "0.25.1",
    url: "https://unpkg.com/tree-sitter-bash@0.25.1/tree-sitter-bash.wasm"
  }
};
function grammarSourceUrl(filename) {
  return GRAMMAR_SOURCE_OVERRIDES[filename]?.url ?? `${GRAMMAR_CDN_BASE}/${filename}`;
}
var VENDORED_GRAMMARS = {
  "tree-sitter-cue.wasm": {
    repo: "https://github.com/eonpatapon/tree-sitter-cue",
    commit: "dd7b90e0770ff18070c515937ba3c3d6d93db00e",
    license: "MIT",
    buildCommand: "npx tree-sitter-cli build --wasm"
  }
};
function isVendoredGrammar(filename) {
  return Object.hasOwn(VENDORED_GRAMMARS, filename);
}
function vendoredGrammarRefusal(filename) {
  return {
    ok: false,
    retryable: false,
    reason: `${filename} is built in-house and ships in vendor/grammars/; it has no download source, so a missing copy means the install is incomplete.`
  };
}
function vendoredGrammarsDir() {
  return path2.join(getPackageRoot(import.meta.url), "vendor", "grammars");
}
var LANGUAGE_TO_GRAMMAR = {
  typescript: "tree-sitter-typescript.wasm",
  tsx: "tree-sitter-tsx.wasm",
  javascript: "tree-sitter-javascript.wasm",
  python: "tree-sitter-python.wasm",
  rust: "tree-sitter-rust.wasm",
  go: "tree-sitter-go.wasm",
  java: "tree-sitter-java.wasm",
  kotlin: "tree-sitter-kotlin.wasm",
  dart: "tree-sitter-dart.wasm",
  c: "tree-sitter-c.wasm",
  cpp: "tree-sitter-cpp.wasm",
  elixir: "tree-sitter-elixir.wasm",
  ruby: "tree-sitter-ruby.wasm",
  bash: "tree-sitter-bash.wasm",
  csharp: "tree-sitter-c_sharp.wasm",
  css: "tree-sitter-css.wasm",
  html: "tree-sitter-html.wasm",
  json: "tree-sitter-json.wasm",
  lua: "tree-sitter-lua.wasm",
  ocaml: "tree-sitter-ocaml.wasm",
  php: "tree-sitter-php.wasm",
  swift: "tree-sitter-swift.wasm",
  toml: "tree-sitter-toml.wasm",
  vue: "tree-sitter-vue.wasm",
  yaml: "tree-sitter-yaml.wasm",
  zig: "tree-sitter-zig.wasm",
  cue: "tree-sitter-cue.wasm"
};
var GRAMMAR_FILES = [
  ...new Set(Object.values(LANGUAGE_TO_GRAMMAR))
];
var BLOCKED_GRAMMARS = {
  "tree-sitter-swift.wasm": {
    blocked: ({ isV8, nodeMajor }) => isV8 && nodeMajor >= 24,
    reason: "tree-sitter-swift crashes the runtime on Node >= 24 (V8 Turboshaft WASM OOM, #423/#432); skipped so the process degrades gracefully instead of aborting."
  }
};
function currentGrammarRuntime() {
  const m = /^v?(\d+)/.exec(process.versions?.node ?? "");
  return {
    nodeMajor: m ? Number(m[1]) : 0,
    isV8: !process.versions.bun && Boolean(process.versions.v8),
    platform: process.platform
  };
}
function grammarBlockReason(filename, rt = currentGrammarRuntime()) {
  if (process.env.PILENS_UNSAFE_FORCE_GRAMMAR_LOAD === "1")
    return null;
  const block = BLOCKED_GRAMMARS[filename];
  return block?.blocked(rt) ? block.reason : null;
}
var WASM_MAGIC = [0, 97, 115, 109];
function hasWasmMagic(bytes) {
  if (bytes.length < WASM_MAGIC.length)
    return false;
  return WASM_MAGIC.every((byte, i) => bytes[i] === byte);
}
function fileHasWasmMagic(filePath) {
  let fd;
  try {
    fd = fs.openSync(filePath, "r");
    const head = Buffer.alloc(WASM_MAGIC.length);
    const read = fs.readSync(fd, head, 0, head.length, 0);
    return read === head.length && hasWasmMagic(head);
  } catch {
    return false;
  } finally {
    if (fd !== void 0) {
      try {
        fs.closeSync(fd);
      } catch {
      }
    }
  }
}
var HTML_PREFIXES = ["<!doctype html", "<html", "<head", "<?xml"];
function describeNonWasmBody(bytes) {
  if (bytes.length === 0) {
    return "The download returned an empty body (0 bytes) instead of a wasm module.";
  }
  const head = Buffer.from(bytes.subarray(0, Math.min(16, bytes.length))).toString("latin1");
  const lead = head.trimStart().toLowerCase();
  const shape = HTML_PREFIXES.some((prefix) => lead.startsWith(prefix)) ? "an HTML page (a captive portal or proxy intercepted the request)" : "non-wasm data";
  const magic = Buffer.from(bytes.subarray(0, WASM_MAGIC.length)).toString("hex").replace(/../g, "$& ").trim();
  return `The download returned ${shape} \u2014 ${bytes.length} bytes starting ${magic}, not a wasm module.`;
}
var manifestOverride;
var cachedManifest;
function grammarManifestPath() {
  return path2.join(getPackageRoot(import.meta.url), "scripts", "grammars.lock.json");
}
function resolveGrammarManifest() {
  if (manifestOverride !== void 0)
    return manifestOverride;
  if (cachedManifest !== void 0)
    return cachedManifest;
  try {
    const raw = fs.readFileSync(grammarManifestPath(), "utf-8");
    cachedManifest = JSON.parse(raw);
  } catch {
    cachedManifest = null;
  }
  return cachedManifest;
}
function loadGrammarManifest() {
  const manifest = resolveGrammarManifest();
  if (manifest === null) {
    recordDegradationOnce({
      kind: "grammar-blocked",
      subject: "grammars.lock.json",
      reason: "the pinned sha256 manifest is unavailable \u2014 runtime grammar downloads fall back to the weaker Content-Length check (or no integrity check at all for a source with neither)."
    });
  }
  return manifest;
}
function sha256Hex(data) {
  return `sha256:${createHash("sha256").update(data).digest("hex")}`;
}
function pinnedGrammarHash(filename) {
  return loadGrammarManifest()?.grammars[filename];
}
function grammarFileSha256(filePath) {
  try {
    return sha256Hex(fs.readFileSync(filePath));
  } catch {
    return void 0;
  }
}
function shortHash(hash) {
  const hex = hash.startsWith("sha256:") ? hash.slice("sha256:".length) : hash;
  return `sha256:${hex.slice(0, 12)}\u2026`;
}
async function downloadGrammarDetailed(destDir, filename) {
  if (isVendoredGrammar(filename))
    return vendoredGrammarRefusal(filename);
  try {
    fs.mkdirSync(destDir, { recursive: true });
    const res = await fetch(grammarSourceUrl(filename));
    if (!res.ok) {
      const retryable = res.status !== 404 && res.status !== 410;
      return { ok: false, retryable };
    }
    const data = Buffer.from(await res.arrayBuffer());
    if (!hasWasmMagic(data)) {
      return { ok: false, retryable: true, reason: describeNonWasmBody(data) };
    }
    const declaredLength = res.headers.get("content-length");
    if (declaredLength !== null) {
      const expectedBytes = Number.parseInt(declaredLength, 10);
      if (Number.isFinite(expectedBytes) && expectedBytes !== data.length) {
        return {
          ok: false,
          retryable: true,
          reason: `The download reported Content-Length: ${expectedBytes} but only ${data.length} bytes arrived \u2014 a truncated transfer.`
        };
      }
    }
    const expectedHash = loadGrammarManifest()?.grammars[filename];
    if (expectedHash) {
      const actualHash = sha256Hex(data);
      if (actualHash !== expectedHash) {
        return {
          ok: false,
          retryable: true,
          reason: `The download's sha256 (${shortHash(actualHash)}) does not match the pinned manifest (${shortHash(expectedHash)}) \u2014 a corrupt or truncated transfer.`
        };
      }
    }
    writeFileAtomic(path2.join(destDir, filename), data, { bestEffort: false });
    return { ok: true, retryable: true };
  } catch {
    return { ok: false, retryable: true };
  }
}

// dist/clients/tree-sitter-cache.js
import * as crypto from "node:crypto";
import * as fs2 from "node:fs";
var TREE_RETIREMENT_GRACE_MICROTASKS = 4;
var TREE_CACHE_COUNTER_KEYS = [
  "lookups",
  "hits",
  "coldMisses",
  "capacityMisses",
  "contentChangedMisses",
  "mtimeMisses",
  "statFailedMisses",
  "sets",
  "replacements",
  "evictions",
  "clears",
  "ghostHistoryDrops"
];
function createTreeCacheCounters() {
  return Object.fromEntries(TREE_CACHE_COUNTER_KEYS.map((key) => [key, 0]));
}
var TREE_CACHE_DEFAULT_MAX_SIZE = 50;
var TREE_CACHE_SCAN_CAPACITY_CEILING = 500;
function deriveScanTreeCacheCapacity(fileCount, currentMaxSize) {
  const envRaw = process.env.PI_LENS_TREE_SITTER_CACHE_SCAN_CAP;
  const envValue = envRaw !== void 0 ? Number.parseInt(envRaw, 10) : Number.NaN;
  const ceiling = Number.isSafeInteger(envValue) && envValue > 0 ? envValue : TREE_CACHE_SCAN_CAPACITY_CEILING;
  const target = Math.min(Math.max(fileCount, TREE_CACHE_DEFAULT_MAX_SIZE), ceiling);
  return Math.max(currentMaxSize, target);
}
var TreeCache = class {
  // BoundedFifoMap, not BoundedLruCache, even though eviction here IS true
  // LRU: recency is refreshed by this class's own explicit `delete`+`set`
  // touch on a VALIDATED hit (see `get`), and only there. A `get` that
  // promoted on every read would also promote entries `get` goes on to
  // reject (content-hash mismatch returns null without removing), silently
  // changing which entry eviction targets (#2442 review F7).
  cache = new BoundedFifoMap(TREE_CACHE_DEFAULT_MAX_SIZE);
  recentlyEvicted;
  evictionHistoryMax;
  debug;
  counters = createTreeCacheCounters();
  counterObserver;
  treeErrorObserver;
  constructor(maxSize = TREE_CACHE_DEFAULT_MAX_SIZE, debug = false, evictionHistoryMax = 4096, counterObserver, treeErrorObserver) {
    this.cache.setMaxEntries(Math.max(1, Math.floor(maxSize)));
    this.evictionHistoryMax = Math.max(1, Math.floor(evictionHistoryMax));
    this.recentlyEvicted = new BoundedFifoMap(this.evictionHistoryMax);
    this.counterObserver = counterObserver;
    this.treeErrorObserver = treeErrorObserver;
    this.debug = debug ? (msg) => logTreeSitterDiagnostic({
      subsystem: "tree-cache",
      level: "debug",
      message: msg
    }) : () => {
    };
  }
  recordCounter(key, amount = 1) {
    this.counters[key] += amount;
    this.counterObserver?.(key, amount);
  }
  /** Current capacity ceiling (entry count, not bytes — see class docstring). */
  getMaxSize() {
    return this.cache.getMaxEntries();
  }
  /**
   * Resize the capacity ceiling (#1715). Growing only changes the bound —
   * existing entries are untouched. Shrinking evicts the LRU tail down to
   * the new size through the same `removeEntry` path eviction uses, so a
   * shrink still frees every dropped tree's WASM heap (#417) instead of
   * silently orphaning it. `n` is floored at 1: a cache that can hold zero
   * entries can never record a hit.
   */
  setMaxSize(n) {
    this.retireEvicted(this.cache.setMaxEntries(Math.max(1, Math.floor(n))));
  }
  /**
   * Book-keep entries the bounded map dropped: ghost history, the eviction
   * counter, and the WASM-heap tree retirement (#417/#890) that made this
   * cache's eviction side-effect-coupled in the first place. One
   * implementation, shared by the two paths that can overflow
   * ({@link setMaxSize} and {@link set}) — the shape `BoundedFifoMap.set`'s
   * `[key, value]` return exists to enable (#2442 review F7).
   */
  retireEvicted(evicted) {
    for (const [key, cached] of evicted) {
      this.rememberEviction(key, cached);
      this.recordCounter("evictions");
      this.retireTree(cached.tree);
      this.debug(`Evicted: ${key}`);
    }
  }
  /**
   * Free a tree-sitter Tree's WASM-heap allocation.
   *
   * web-tree-sitter Trees live in the WASM heap; JS GC reclaims only the wrapper,
   * so the underlying memory leaks unless `tree.delete()` is called explicitly
   * (no FinalizationRegistry auto-free in 0.25). Guarded — a tree may already be
   * deleted, or `delete()` may throw on a corrupt/aborted runtime. Retirement is
   * deferred so direct parse callers resume before deletion; consumers still
   * traverse without another await, or use the cache-safe callback API (#417).
   * The eviction target is the least-recently-used entry (get() re-inserts
   * hits), never the just-parsed tree still in a caller's hand.
   */
  // biome-ignore lint/suspicious/noExplicitAny: web-tree-sitter Tree
  freeTree(tree) {
    try {
      if (tree && typeof tree.delete === "function")
        tree.delete();
    } catch (error) {
      this.treeErrorObserver?.(error);
    }
  }
  retireTree(tree) {
    let remaining = TREE_RETIREMENT_GRACE_MICROTASKS;
    const retire = () => {
      if (remaining-- > 0) {
        queueMicrotask(retire);
        return;
      }
      this.freeTree(tree);
    };
    queueMicrotask(retire);
  }
  /** Remove a cache entry and retire its WASM tree after current consumers run. */
  removeEntry(key) {
    const cached = this.cache.get(key);
    if (cached)
      this.retireTree(cached.tree);
    this.cache.delete(key);
  }
  rememberEviction(key, cached) {
    this.recentlyEvicted.delete(key);
    const dropped = this.recentlyEvicted.set(key, cached.contentHash);
    if (dropped.length > 0)
      this.recordCounter("ghostHistoryDrops");
  }
  /**
   * Generate hash for file content
   */
  hashContent(content) {
    return crypto.createHash("sha256").update(content).digest("hex").slice(0, 16);
  }
  /**
   * Get cache key for a file
   */
  getCacheKey(filePath, languageId) {
    return `${languageId}:${normalizeFilePath(filePath)}`;
  }
  /**
   * Check if tree is cached and valid.
   *
   * When `content` is provided the content hash is AUTHORITATIVE: a hash match
   * is a hit regardless of mtime, and the entry's stat metadata is refreshed
   * so a save-without-change (same bytes, newer mtime) does not masquerade as
   * a disk modification (#890). The mtime check remains the freshness signal
   * only on the content-less path, where nothing else can prove the cached
   * tree current (`mtimeMisses`). A stat failure invalidates on both paths —
   * a deleted file's entry is dead weight and its WASM tree should be freed.
   *
   * Every hit re-inserts the entry (raw Map delete+set — NOT removeEntry,
   * which would retire the live tree) so eviction is true LRU (#890).
   */
  get(filePath, content, languageId) {
    this.recordCounter("lookups");
    const key = this.getCacheKey(filePath, languageId);
    const cached = this.cache.get(key);
    if (!cached) {
      const evictedHash = this.recentlyEvicted.get(key);
      if (evictedHash !== void 0 && content !== void 0 && evictedHash === this.hashContent(content)) {
        this.recordCounter("capacityMisses");
      } else {
        this.recordCounter("coldMisses");
      }
      this.debug(`Cache miss: ${filePath}`);
      return null;
    }
    if (content !== void 0) {
      const contentHash = this.hashContent(content);
      if (cached.contentHash !== contentHash) {
        this.recordCounter("contentChangedMisses");
        this.debug(`Content changed: ${filePath} (${cached.lineCount} \u2192 ${content.split("\n").length} lines)`);
        return null;
      }
    }
    try {
      const stats = fs2.statSync(filePath);
      if (content !== void 0) {
        if (stats.mtimeMs !== cached.lastModified) {
          cached.lastModified = stats.mtimeMs;
          this.debug(`Refreshed mtime on hash-matched entry: ${filePath}`);
        }
      } else if (stats.mtimeMs !== cached.lastModified) {
        this.recordCounter("mtimeMisses");
        this.debug(`File modified on disk: ${filePath}`);
        this.removeEntry(key);
        return null;
      }
    } catch {
      this.recordCounter("statFailedMisses");
      this.removeEntry(key);
      return null;
    }
    this.cache.delete(key);
    this.cache.set(key, cached);
    this.recordCounter("hits");
    this.debug(`Cache hit: ${filePath} (${cached.lineCount} lines)`);
    return cached.tree;
  }
  /**
   * Store parsed tree in cache
   */
  set(filePath, content, languageId, tree) {
    this.recordCounter("sets");
    const key = this.getCacheKey(filePath, languageId);
    const contentHash = this.hashContent(content);
    this.recentlyEvicted.delete(key);
    if (this.cache.has(key)) {
      this.recordCounter("replacements");
      this.removeEntry(key);
    }
    let mtime = 0;
    try {
      mtime = fs2.statSync(filePath).mtimeMs;
    } catch {
    }
    this.retireEvicted(this.cache.set(key, {
      tree,
      contentHash,
      languageId,
      fileSize: Buffer.byteLength(content, "utf8"),
      lineCount: content.split("\n").length,
      lastModified: mtime
    }));
    this.debug(`Cached: ${filePath} (${content.split("\n").length} lines)`);
  }
  /**
   * Clear entire cache
   */
  clear() {
    this.recordCounter("clears");
    for (const entry of this.cache.values()) {
      this.retireTree(entry.tree);
    }
    this.cache.clear();
    this.recentlyEvicted.clear();
    this.debug("Cache cleared");
  }
  /**
   * Get cache statistics
   */
  getStats() {
    let totalLines = 0;
    let totalBytes = 0;
    for (const entry of this.cache.values()) {
      totalLines += entry.lineCount;
      totalBytes += entry.fileSize;
    }
    return {
      ...this.counters,
      size: this.cache.size,
      maxSize: this.cache.getMaxEntries(),
      totalLines,
      totalBytes,
      misses: this.counters.lookups - this.counters.hits
    };
  }
};

// dist/clients/tree-sitter-navigator.js
var TreeSitterNavigator = class {
  /**
   * Find parent node of a specific type
   */
  findParent(node, type) {
    let current = node.parent;
    const types = Array.isArray(type) ? type : [type];
    while (current) {
      if (types.includes(current.type)) {
        return current;
      }
      current = current.parent;
    }
    return null;
  }
  /**
   * Check if node is inside a specific type of parent
   */
  isInside(node, type) {
    return this.findParent(node, type) !== null;
  }
  /**
   * Get all ancestors of a node
   */
  getAncestors(node) {
    const ancestors = [];
    let current = node.parent;
    while (current) {
      ancestors.push(current);
      current = current.parent;
    }
    return ancestors;
  }
  /**
   * Detect if we're in a test block (it, describe, test, etc.)
   */
  isInTestBlock(node) {
    const testPatterns = [
      "call_expression"
      // it(), describe(), test()
    ];
    let current = node.parent;
    while (current) {
      if (testPatterns.includes(current.type)) {
        const callName = this.getCallName(current);
        if (callName && /^\b(it|describe|test|before|after|beforeEach|afterEach)\b/.test(callName)) {
          return true;
        }
      }
      current = current.parent;
    }
    return false;
  }
  /**
   * Get the name of a call expression (e.g., "it" from it("test", ...))
   */
  getCallName(node) {
    if (node.type !== "call_expression")
      return null;
    const func = node.children[0];
    if (!func)
      return null;
    if (func.type === "identifier") {
      return func.text;
    }
    if (func.type === "member_expression") {
      const parts = [];
      for (const child of func.children) {
        if (child.type === "identifier" || child.type === "property_identifier") {
          parts.push(child.text);
        }
      }
      return parts.join(".");
    }
    return null;
  }
  /**
   * Detect if we're inside a try/catch block
   * Use as post_filter: not_in_try_catch to enforce "must be wrapped"
   */
  isInTryCatch(node) {
    return this.isInside(node, ["try_statement", "begin", "rescue"]);
  }
  /**
   * Detect if we're inside a loop (for, while, forEach)
   */
  isInLoop(node) {
    return this.isInside(node, [
      "for_statement",
      "while_statement",
      "do_statement",
      "for_in_statement",
      "for_of_statement"
    ]);
  }
  /**
   * Detect if we're in an async context (async function or contains await)
   */
  isInAsyncContext(node) {
    const functionTypes = [
      "function_declaration",
      "function_expression",
      "arrow_function",
      "method_definition"
    ];
    let current = node.parent;
    while (current) {
      if (functionTypes.includes(current.type)) {
        if (current.children?.some((c) => c.text === "async")) {
          return true;
        }
      }
      current = current.parent;
    }
    return false;
  }
  /**
   * Get scope chain (list of function/block scopes enclosing this node)
   */
  getScopeChain(node) {
    const chain = [];
    let current = node.parent;
    while (current) {
      if ([
        "function_declaration",
        "function_expression",
        "arrow_function",
        "method_definition",
        "block",
        "statement_block"
      ].includes(current.type)) {
        const name = this.getNodeName(current);
        if (name) {
          chain.push(name);
        } else {
          chain.push(`<${current.type}>`);
        }
      }
      current = current.parent;
    }
    return chain;
  }
  /**
   * Get name of a function/class node
   */
  getNodeName(node) {
    for (const child of node.children || []) {
      if (child.type === "identifier" && child.isNamed) {
        return child.text;
      }
    }
    if (node.type === "method_definition") {
      const nameNode = node.children?.find((c) => c.type === "property_identifier");
      return nameNode?.text || null;
    }
    return null;
  }
  /**
   * Check if a variable is shadowed in current scope
   */
  isShadowed(node, varName) {
    let current = node.parent;
    while (current) {
      if (["variable_declaration", "lexical_declaration"].includes(current.type)) {
        const declarator = current.children?.find((c) => c.type === "variable_declarator");
        if (declarator) {
          const idNode = declarator.children?.find((c) => c.type === "identifier");
          if (idNode?.text === varName) {
            return true;
          }
        }
      }
      if ([
        "function_declaration",
        "function_expression",
        "arrow_function",
        "method_definition"
      ].includes(current.type)) {
        const params = current.children?.find((c) => c.type === "formal_parameters");
        if (params) {
          for (const param of params.children || []) {
            if (param.type === "identifier" && param.text === varName) {
              return true;
            }
          }
        }
      }
      current = current.parent;
    }
    return false;
  }
  /**
   * Get comprehensive scope context for a node
   */
  getScopeContext(node) {
    const ancestors = this.getAncestors(node);
    const functionDepth = ancestors.filter((a) => [
      "function_declaration",
      "function_expression",
      "arrow_function",
      "method_definition"
    ].includes(a.type)).length;
    return {
      isTestBlock: this.isInTestBlock(node),
      isLoop: this.isInLoop(node),
      isAsync: this.isInAsyncContext(node),
      functionDepth,
      scopeChain: this.getScopeChain(node)
    };
  }
  /**
   * Find sibling nodes (nodes at the same level)
   */
  getSiblings(node) {
    if (!node.parent)
      return [];
    return node.parent.children?.filter((c) => c !== node) || [];
  }
  /**
   * Get previous sibling
   */
  getPreviousSibling(node) {
    if (!node.parent)
      return null;
    const siblings = node.parent.children || [];
    const index = siblings.indexOf(node);
    if (index > 0) {
      return siblings[index - 1];
    }
    return null;
  }
  /**
   * Get next sibling
   */
  getNextSibling(node) {
    if (!node.parent)
      return null;
    const siblings = node.parent.children || [];
    const index = siblings.indexOf(node);
    if (index >= 0 && index < siblings.length - 1) {
      return siblings[index + 1];
    }
    return null;
  }
};

// dist/clients/python-provenance.js
var SUMMARY_BY_ROOT = /* @__PURE__ */ new WeakMap();
var TRAVERSAL_VISIT_CAP = 5e4;
var TRAVERSAL_DEPTH_CAP = 128;
var EXPRESSION_DEPTH_CAP = 8;
var BINDING_SCAN_DEPTH_CAP = 32;
var ANCESTOR_DEPTH_CAP = 64;
var PYTHON_SQLALCHEMY_RECEIVER_NAMES = /* @__PURE__ */ new Set([
  "session",
  "db_session",
  "async_session",
  "sync_session"
]);
var PYTHON_SQLALCHEMY_STATEMENT_BUILDERS = /* @__PURE__ */ new Set(["select", "insert", "update", "delete"]);
var FROM_IMPORT_PROVENANCE = /* @__PURE__ */ new Map([
  ["sqlalchemy.orm:Session", "sqlalchemy-session"],
  ["sqlalchemy.ext.asyncio:AsyncSession", "sqlalchemy-session"],
  ["psycopg:sql", "psycopg-sql-module"],
  ["psycopg2:sql", "psycopg-sql-module"],
  ["psycopg.sql:SQL", "psycopg-sql-constructor"],
  ["psycopg2.sql:SQL", "psycopg-sql-constructor"],
  ["psycopg.sql:Identifier", "psycopg-identifier-constructor"],
  ["psycopg2.sql:Identifier", "psycopg-identifier-constructor"]
]);
var PLAIN_PACKAGE_PROVENANCE = /* @__PURE__ */ new Map([
  ["sqlalchemy", "sqlalchemy-module"],
  ["psycopg", "psycopg-package"],
  ["psycopg2", "psycopg-package"]
]);
function nodeKey(node) {
  return `${node.type}:${node.startIndex}:${node.endIndex}`;
}
function namedChildren(node) {
  return (node.children ?? []).filter((child) => child.isNamed);
}
function calleeNode(call) {
  if (call.type !== "call")
    return void 0;
  return call.childForFieldName?.("function") ?? namedChildren(call)[0];
}
function directNamedChild(node, type) {
  return namedChildren(node).find((child) => child.type === type);
}
var BINDING_TARGET_CONTAINER_TYPES = /* @__PURE__ */ new Set([
  "tuple",
  "pattern_list",
  "list",
  "list_pattern",
  "tuple_pattern",
  "starred_expression",
  "list_splat_pattern",
  "dictionary_splat_pattern"
]);
var BINDING_TARGET_REFERENCE_TYPES = /* @__PURE__ */ new Set(["attribute", "subscript"]);
var BINDING_PATTERN_CONTAINER_TYPES = /* @__PURE__ */ new Set([
  "case_pattern",
  "as_pattern",
  "union_pattern",
  "list_pattern",
  "tuple_pattern",
  "list_splat_pattern",
  "dictionary_splat_pattern",
  "class_pattern"
]);
var BINDING_PATTERN_REFERENCE_TYPES = /* @__PURE__ */ new Set([
  "attribute",
  "qualified_pattern"
]);
function scanBindingNames(node, mode, scan, depth = 0) {
  if (!node || depth > BINDING_SCAN_DEPTH_CAP) {
    scan.unknown = true;
    return;
  }
  const descend = (child, next) => scanBindingNames(child, next, scan, depth + 1);
  if (node.type === "as_pattern_target") {
    descend(namedChildren(node)[0], "target");
    return;
  }
  if (mode === "as") {
    for (const child of namedChildren(node))
      descend(child, "as");
    return;
  }
  if (node.type === "identifier") {
    if (node.text !== "_")
      scan.names.push(node.text);
    return;
  }
  if (mode === "pattern") {
    if (node.type === "dotted_name") {
      if (!node.text.includes(".") && node.text !== "_") {
        scan.names.push(node.text);
      }
      return;
    }
    if (BINDING_PATTERN_REFERENCE_TYPES.has(node.type))
      return;
    if (node.type === "keyword_pattern") {
      const value = namedChildren(node).slice(1);
      if (value.length !== 1)
        scan.unknown = true;
      else
        descend(value[0], "pattern");
      return;
    }
    if (BINDING_PATTERN_CONTAINER_TYPES.has(node.type)) {
      for (const child of namedChildren(node))
        descend(child, "pattern");
      return;
    }
    scan.unknown = true;
    return;
  }
  if (BINDING_TARGET_REFERENCE_TYPES.has(node.type))
    return;
  if (BINDING_TARGET_CONTAINER_TYPES.has(node.type)) {
    for (const child of namedChildren(node))
      descend(child, "target");
    return;
  }
  scan.unknown = true;
}
function collectBindingNames(node, mode) {
  const scan = { names: [], unknown: false };
  scanBindingNames(node, mode, scan);
  return scan;
}
function parseImportBinding(node, isFrom) {
  if (node.type === "aliased_import") {
    const children = namedChildren(node);
    const source = children[0]?.text;
    const local2 = children.at(-1);
    return source && local2?.type === "identifier" ? { source, local: local2.text } : void 0;
  }
  if (node.type !== "dotted_name" && node.type !== "identifier") {
    return void 0;
  }
  if (isFrom)
    return { source: node.text, local: node.text };
  const local = node.text.split(".")[0];
  return local ? { source: node.text, local } : void 0;
}
function directAnnotationName(parameter) {
  if (parameter.type !== "typed_parameter" && parameter.type !== "typed_default_parameter") {
    return void 0;
  }
  const type = directNamedChild(parameter, "type");
  const children = type ? namedChildren(type) : [];
  return children.length === 1 && children[0]?.type === "identifier" ? children[0].text : void 0;
}
function parameterName(parameter) {
  if (parameter.type === "identifier")
    return parameter.text;
  return directNamedChild(parameter, "identifier")?.text;
}
function markInvalid(state) {
  state.invalid = true;
}
function addBinding(state, name, functionChain) {
  state.bindingCounts.set(name, (state.bindingCounts.get(name) ?? 0) + 1);
  for (const fn of functionChain) {
    const key = nodeKey(fn);
    const bindings = state.functionBindings.get(key) ?? /* @__PURE__ */ new Map();
    bindings.set(name, (bindings.get(name) ?? 0) + 1);
    state.functionBindings.set(key, bindings);
  }
}
function addTarget(state, target, functionChain) {
  const extracted = collectBindingNames(target, "target");
  if (extracted.unknown)
    markInvalid(state);
  for (const name of extracted.names)
    addBinding(state, name, functionChain);
}
function recordFunctionParameters(node, state) {
  const annotations = /* @__PURE__ */ new Map();
  const parameters = directNamedChild(node, "parameters");
  for (const parameter of namedChildren(parameters ?? node)) {
    const name = parameterName(parameter);
    if (!name) {
      if (parameter.type !== "list_splat_pattern")
        markInvalid(state);
      continue;
    }
    addBinding(state, name, state.functionChain);
    const annotation = directAnnotationName(parameter);
    if (annotation)
      annotations.set(name, annotation);
  }
  state.functionAnnotations.set(nodeKey(node), annotations);
}
function recordFunctionDefinition(node, state) {
  recordFunctionParameters(node, state);
  recordDefinitionBinding(node, state);
}
function recordLambdaParameters(node, state) {
  const parameters = directNamedChild(node, "lambda_parameters");
  for (const parameter of namedChildren(parameters ?? node)) {
    const name = parameterName(parameter);
    if (name)
      addBinding(state, name, state.functionChain);
    else
      markInvalid(state);
  }
}
function recordImportBindings(node, state) {
  const isFrom = node.type === "import_from_statement";
  const children = namedChildren(node);
  const moduleName = isFrom ? children[0]?.text : void 0;
  if (node.text.includes("*") || isFrom && !moduleName)
    markInvalid(state);
  for (const part of isFrom ? children.slice(1) : children) {
    const binding = parseImportBinding(part, isFrom);
    if (!binding) {
      markInvalid(state);
      continue;
    }
    addBinding(state, binding.local, state.functionChain);
    if (!state.moduleDirect)
      continue;
    const provenance = isFrom ? FROM_IMPORT_PROVENANCE.get(`${moduleName}:${binding.source}`) : PLAIN_PACKAGE_PROVENANCE.get(binding.source);
    if (provenance) {
      state.imports.set(binding.local, {
        name: binding.local,
        provenance,
        endIndex: node.endIndex
      });
    }
  }
}
function recordTargetBinding(node, state) {
  addTarget(state, node.childForFieldName?.("left") ?? namedChildren(node)[0], state.functionChain);
}
function recordAssignmentValue(node, state) {
  recordTargetBinding(node, state);
  const target = node.childForFieldName?.("left") ?? namedChildren(node)[0];
  const value = node.childForFieldName?.("right") ?? namedChildren(node).at(-1);
  if (target?.type !== "identifier" || !value || value === target)
    return;
  state.assignments.set(target.text, value);
}
function recordAsPatternBinding(node, state) {
  const extracted = collectBindingNames(node, "as");
  if (extracted.unknown)
    markInvalid(state);
  for (const name of extracted.names)
    addBinding(state, name, state.functionChain);
}
function recordDeleteTargets(node, state) {
  for (const child of namedChildren(node)) {
    addTarget(state, child, state.functionChain);
  }
}
function recordCaseBindings(node, state) {
  const extracted = collectBindingNames(directNamedChild(node, "case_pattern"), "pattern");
  if (extracted.unknown)
    markInvalid(state);
  for (const name of extracted.names)
    addBinding(state, name, state.functionChain);
}
function recordDeclarationBindings(node, state) {
  for (const child of namedChildren(node)) {
    addBinding(state, child.text, state.functionChain);
  }
}
function recordDefinitionBinding(node, state) {
  const name = directNamedChild(node, "identifier")?.text;
  if (name)
    addBinding(state, name, state.parentFunctionChain);
  else
    markInvalid(state);
}
function recordTypeAliasBinding(node, state) {
  const name = directNamedChild(node, "type")?.children?.find((child) => child.type === "identifier")?.text;
  if (name)
    addBinding(state, name, state.functionChain);
  else
    markInvalid(state);
}
var DYNAMIC_NAMESPACE_BUILTINS = /* @__PURE__ */ new Set([
  "exec",
  "eval",
  "globals",
  "locals",
  "vars"
]);
function recordDynamicNamespaceHazard(node, state) {
  const callee = calleeNode(node);
  if (callee?.type === "identifier" && DYNAMIC_NAMESPACE_BUILTINS.has(callee.text)) {
    markInvalid(state);
  }
}
var SUMMARY_NODE_RECORDERS = Object.freeze({
  function_definition: recordFunctionDefinition,
  class_definition: recordDefinitionBinding,
  lambda: recordLambdaParameters,
  import_from_statement: recordImportBindings,
  import_statement: recordImportBindings,
  assignment: recordAssignmentValue,
  augmented_assignment: recordTargetBinding,
  named_expression: recordTargetBinding,
  for_statement: recordTargetBinding,
  for_in_clause: recordTargetBinding,
  with_item: recordAsPatternBinding,
  except_clause: recordAsPatternBinding,
  except_group_clause: recordAsPatternBinding,
  delete_statement: recordDeleteTargets,
  case_clause: recordCaseBindings,
  type_alias_statement: recordTypeAliasBinding,
  global_statement: recordDeclarationBindings,
  nonlocal_statement: recordDeclarationBindings,
  call: recordDynamicNamespaceHazard
});
var Summary = class {
  invalid;
  imports;
  bindingCounts;
  assignments;
  functions;
  constructor(root) {
    const state = {
      imports: /* @__PURE__ */ new Map(),
      bindingCounts: /* @__PURE__ */ new Map(),
      assignments: /* @__PURE__ */ new Map(),
      functionBindings: /* @__PURE__ */ new Map(),
      functionAnnotations: /* @__PURE__ */ new Map(),
      invalid: false,
      visits: 0,
      functionChain: [],
      parentFunctionChain: [],
      moduleDirect: false
    };
    const visit = (node, depth, moduleDirect, activeFunctions) => {
      if (++state.visits > TRAVERSAL_VISIT_CAP || depth > TRAVERSAL_DEPTH_CAP) {
        markInvalid(state);
        return;
      }
      if (node.hasError || node.type === "ERROR" || node.type === "MISSING") {
        markInvalid(state);
        return;
      }
      const functionChain = node.type === "function_definition" ? [...activeFunctions, node] : activeFunctions;
      state.functionChain = functionChain;
      state.parentFunctionChain = activeFunctions;
      state.moduleDirect = moduleDirect;
      const recorder = SUMMARY_NODE_RECORDERS[node.type];
      if (recorder)
        recorder(node, state);
      for (const child of node.children ?? []) {
        visit(child, depth + 1, node === root, functionChain);
      }
    };
    visit(root, 0, false, []);
    this.invalid = state.invalid;
    this.imports = state.imports;
    this.bindingCounts = state.bindingCounts;
    this.assignments = state.assignments;
    this.functions = new Map([...state.functionAnnotations.entries()].map(([key, annotations]) => [
      key,
      {
        parameterAnnotations: annotations,
        bindingCounts: state.functionBindings.get(key) ?? /* @__PURE__ */ new Map()
      }
    ]));
  }
  provenanceFor(name, reference) {
    const candidate = this.boundOnce(name) ? this.imports.get(name) : void 0;
    return candidate && candidate.endIndex <= reference.startIndex ? candidate.provenance : null;
  }
  boundOnce(name) {
    return !this.invalid && (this.bindingCounts.get(name) ?? 0) === 1;
  }
  singleAssignmentValue(name, reference) {
    if (!this.boundOnce(name))
      return null;
    const value = this.assignments.get(name);
    return value && value.endIndex <= reference.startIndex ? value : null;
  }
  isFunctionLocalName(reference) {
    if (this.invalid || reference.type !== "identifier")
      return true;
    let current = reference.parent;
    for (let depth = 0; current && depth < ANCESTOR_DEPTH_CAP; depth++) {
      if (current.type === "function_definition") {
        const summary = this.functions.get(nodeKey(current));
        if (!summary)
          return true;
        if ((summary.bindingCounts.get(reference.text) ?? 0) > 0)
          return true;
      }
      current = current.parent;
    }
    return false;
  }
  isSqlAlchemySessionReceiver(receiver) {
    if (this.invalid || receiver.type !== "identifier")
      return false;
    let current = receiver.parent;
    for (let depth = 0; current && depth < ANCESTOR_DEPTH_CAP; depth++) {
      if (current.type === "function_definition") {
        const summary = this.functions.get(nodeKey(current));
        if (!summary)
          return false;
        const annotation = summary.parameterAnnotations.get(receiver.text);
        return annotation !== void 0 && (summary.bindingCounts.get(receiver.text) ?? 0) === 1 && this.provenanceFor(annotation, receiver) === "sqlalchemy-session";
      }
      current = current.parent;
    }
    return false;
  }
};
function getPythonProvenanceSummary(root) {
  const cached = SUMMARY_BY_ROOT.get(root);
  if (cached)
    return cached;
  const summary = new Summary(root);
  SUMMARY_BY_ROOT.set(root, summary);
  return summary;
}
function expressionProvenance(node, summary, depth = 0) {
  if (!node || depth > EXPRESSION_DEPTH_CAP)
    return null;
  if (node.type === "identifier")
    return summary.provenanceFor(node.text, node);
  if (node.type !== "attribute")
    return null;
  const object = node.childForFieldName?.("object") ?? namedChildren(node)[0];
  const attribute = node.childForFieldName?.("attribute") ?? namedChildren(node).at(-1);
  const provenance = expressionProvenance(object, summary, depth + 1);
  if (provenance === "psycopg-package" && attribute?.text === "sql") {
    return "psycopg-sql-module";
  }
  if (provenance === "psycopg-sql-module") {
    if (attribute?.text === "SQL")
      return "psycopg-sql-constructor";
    if (attribute?.text === "Identifier")
      return "psycopg-identifier-constructor";
  }
  return null;
}
function isSafePsycopgIdentifierComposition(node, root) {
  if (node?.type !== "call" || !root)
    return false;
  const summary = getPythonProvenanceSummary(root);
  if (summary.invalid)
    return false;
  const formatCallee = node.childForFieldName?.("function") ?? namedChildren(node)[0];
  if (formatCallee?.type !== "attribute")
    return false;
  const formatChildren = namedChildren(formatCallee);
  const hasFormatMethod = formatChildren.some((child) => child.text === "format");
  const sqlConstructor = formatChildren.find((child) => child.type === "call");
  if (!hasFormatMethod || !sqlConstructor)
    return false;
  const constructorCallee = sqlConstructor.childForFieldName?.("function") ?? namedChildren(sqlConstructor)[0];
  if (expressionProvenance(constructorCallee, summary) !== "psycopg-sql-constructor")
    return false;
  const templateArgs = namedChildren(directNamedChild(sqlConstructor, "argument_list") ?? sqlConstructor).filter((child) => child.type !== "comment");
  if (templateArgs.length !== 1 || templateArgs[0]?.type !== "string" || namedChildren(templateArgs[0]).some((child) => child.type === "interpolation"))
    return false;
  const formatArgs = namedChildren(directNamedChild(node, "argument_list") ?? node).filter((child) => child.type !== "comment");
  if (formatArgs.length === 0)
    return false;
  return formatArgs.every((argument) => {
    if (argument.type !== "call")
      return false;
    const callee = argument.childForFieldName?.("function") ?? namedChildren(argument)[0];
    return expressionProvenance(callee, summary) === "psycopg-identifier-constructor";
  });
}
function isProvenSqlAlchemySessionReceiver(receiver, root) {
  return !!receiver && !!root && getPythonProvenanceSummary(root).isSqlAlchemySessionReceiver(receiver);
}
function isStaticStringLiteral(node) {
  return node?.type === "string" && !namedChildren(node).some((child) => child.type === "interpolation");
}
function callArguments(call) {
  return namedChildren(directNamedChild(call, "argument_list") ?? call).filter((child) => child.type !== "comment");
}
var COMPOSED_SQL_NODE_TYPES = /* @__PURE__ */ new Set([
  "string",
  "concatenated_string",
  "binary_operator"
]);
function carriesComposedSql(node, depth = 0) {
  if (!node)
    return false;
  if (depth > EXPRESSION_DEPTH_CAP)
    return true;
  if (COMPOSED_SQL_NODE_TYPES.has(node.type))
    return true;
  if (node.type !== "call")
    return false;
  const callee = calleeNode(node);
  if (callee?.type === "attribute") {
    const object = callee.childForFieldName?.("object") ?? namedChildren(callee)[0];
    if (carriesComposedSql(object, depth + 1))
      return true;
  }
  return callArguments(node).some((argument) => carriesComposedSql(argument, depth + 1));
}
function builderCalleeName(call, summary) {
  const callee = calleeNode(call);
  if (callee?.type === "identifier")
    return callee.text;
  if (callee?.type !== "attribute")
    return void 0;
  const object = callee.childForFieldName?.("object") ?? namedChildren(callee)[0];
  if (expressionProvenance(object, summary) !== "sqlalchemy-module") {
    return void 0;
  }
  const attribute = callee.childForFieldName?.("attribute") ?? namedChildren(callee).at(-1);
  return attribute?.type === "identifier" ? attribute.text : void 0;
}
function isStatementBuilderCall(node, summary) {
  if (node?.type !== "call")
    return false;
  const name = builderCalleeName(node, summary);
  if (!name)
    return false;
  const args = callArguments(node);
  if (name === "text") {
    return args.length === 1 && isStaticStringLiteral(args[0]);
  }
  if (!PYTHON_SQLALCHEMY_STATEMENT_BUILDERS.has(name))
    return false;
  return !args.some((argument) => carriesComposedSql(argument));
}
function isSqlAlchemyStatementArgument(node, root) {
  if (!node || !root)
    return false;
  const summary = getPythonProvenanceSummary(root);
  if (isStatementBuilderCall(node, summary))
    return true;
  if (node.type !== "identifier")
    return false;
  const bound = summary.singleAssignmentValue(node.text, node);
  return isStatementBuilderCall(bound ?? void 0, summary);
}
function isSqlAlchemyEntityQueryArgument(node, root) {
  if (!node || !root)
    return false;
  const summary = getPythonProvenanceSummary(root);
  if (isStatementBuilderCall(node, summary))
    return true;
  if (carriesComposedSql(node))
    return false;
  if (node.type !== "identifier")
    return true;
  return !summary.isFunctionLocalName(node);
}

// dist/clients/tree-sitter-query-loader.js
import * as fs4 from "node:fs";
import * as crypto2 from "node:crypto";
import * as path3 from "node:path";

// dist/clients/bundled-resource-health.js
import * as fs3 from "node:fs";
function classifyBundledResourceDir(dir, countEntries = (d) => fs3.readdirSync(d).length) {
  let entryCount;
  try {
    entryCount = countEntries(dir);
  } catch (error) {
    const fsErrorCode = error?.code ?? "UNKNOWN";
    if (fsErrorCode === "ENOENT")
      return { status: "absent" };
    return { status: "unreadable", fsErrorCode };
  }
  return entryCount > 0 ? { status: "healthy", entryCount } : { status: "empty" };
}
function describeBundledResourceHealth(health, dir, emptyDescription = `${dir} exists but holds nothing`) {
  switch (health.status) {
    case "absent":
      return `no such directory: ${dir}`;
    case "unreadable":
      return `cannot read ${dir} (${health.fsErrorCode})`;
    case "empty":
      return emptyDescription;
    default:
      return `${dir}: unexpected health status`;
  }
}
function reportBundledResourceDirHealth(kind, dir, health, label, reasonOverride, notifyMessage) {
  if (health.status === "healthy")
    return;
  const reason = reasonOverride ?? describeBundledResourceHealth(health, dir);
  const isFirstOccurrence = incrementDegradationCount({
    kind,
    subject: dir,
    reason,
    metadata: health.status === "unreadable" ? { fsErrorCode: health.fsErrorCode } : void 0
  });
  if (isFirstOccurrence) {
    notifyUserDegradation(notifyMessage ?? `pi-lens: ${label} unavailable \u2014 ${reason}.`, "warning");
  }
}

// dist/clients/tree-sitter-query-loader.js
var BUNDLED_QUERIES_ROOT = resolvePackagePath(import.meta.url, "rules", "tree-sitter-queries");
var cachedBundledQueriesRootHealth;
var cachedBundledQueriesRootHealthGeneration;
function getBundledQueriesRootHealth() {
  const generation = getDegradationLedgerGeneration();
  if (cachedBundledQueriesRootHealth === void 0 || cachedBundledQueriesRootHealthGeneration !== generation) {
    cachedBundledQueriesRootHealthGeneration = generation;
    cachedBundledQueriesRootHealth = classifyBundledResourceDir(BUNDLED_QUERIES_ROOT);
  }
  return cachedBundledQueriesRootHealth;
}
function isDisabledQueryDirectoryName(name) {
  return name.endsWith("-disabled");
}
function getQueryLanguageKey(directoryName) {
  return isDisabledQueryDirectoryName(directoryName) ? directoryName.slice(0, -"-disabled".length) : directoryName;
}
var TYPESCRIPT_RULE_HEIRS = /* @__PURE__ */ new Set(["tsx"]);
function ruleSourceLanguages(languageId) {
  return TYPESCRIPT_RULE_HEIRS.has(languageId) ? [languageId, "typescript"] : [languageId];
}
function ruleFilesForLanguage(languageId, rootDir = process.cwd()) {
  const resolvedRoot = path3.resolve(rootDir);
  const files = /* @__PURE__ */ new Set();
  for (const lang of ruleSourceLanguages(languageId)) {
    for (const dir of [
      path3.join(resolvedRoot, "rules", "tree-sitter-queries", lang),
      path3.join(getUserRuleRoot(), "tree-sitter-queries", lang),
      path3.join(BUNDLED_QUERIES_ROOT, lang)
    ]) {
      if (!fs4.existsSync(dir))
        continue;
      for (const f of fs4.readdirSync(dir)) {
        if (f.endsWith(".yml"))
          files.add(path3.join(dir, f));
      }
    }
  }
  if (files.size === 0) {
    const health = getBundledQueriesRootHealth();
    if (health.status !== "healthy") {
      reportBundledResourceDirHealth("tree-sitter-queries-dir-missing", BUNDLED_QUERIES_ROOT, health, "bundled tree-sitter query rules");
    }
  }
  return [...files];
}
function computeRuleFilesFingerprint(ruleFiles) {
  const hash = crypto2.createHash("sha256");
  for (const file of [...ruleFiles].sort(compareOrdinal)) {
    const resolved = path3.resolve(file);
    if (!fs4.existsSync(resolved))
      continue;
    const stat = fs4.statSync(resolved);
    hash.update(`${file}:${stat.mtimeMs}:${stat.size}`);
    if (resolved !== BUNDLED_QUERIES_ROOT && !resolved.startsWith(BUNDLED_QUERIES_ROOT + path3.sep)) {
      hash.update(fs4.readFileSync(resolved));
    }
  }
  return hash.digest("hex").slice(0, 16);
}
function computeMutableRuleFingerprint(rootDir) {
  const files = [];
  for (const queriesDir of [
    path3.join(path3.resolve(rootDir), "rules", "tree-sitter-queries"),
    path3.join(getUserRuleRoot(), "tree-sitter-queries")
  ]) {
    if (!fs4.existsSync(queriesDir))
      continue;
    let languages;
    try {
      languages = fs4.readdirSync(queriesDir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const language of languages) {
      if (!language.isDirectory())
        continue;
      let names;
      try {
        names = fs4.readdirSync(path3.join(queriesDir, language.name));
      } catch {
        continue;
      }
      for (const name of names) {
        if (name.endsWith(".yml")) {
          files.push(path3.join(queriesDir, language.name, name));
        }
      }
    }
  }
  const hash = crypto2.createHash("sha256");
  for (const filePath of files.sort(compareOrdinal)) {
    hash.update(filePath);
    hash.update("\0");
    let content;
    try {
      content = fs4.readFileSync(filePath, "utf-8");
    } catch {
      hash.update("missing");
      hash.update("\0");
      continue;
    }
    hash.update(content);
    hash.update("\0");
  }
  return hash.digest("hex").slice(0, 16);
}
function queriesForLanguage(queries, languageId) {
  const enabled = (langId) => (queries.get(langId) ?? []).filter((q) => !isDisabledQueryFilePath(q.filePath));
  return ruleSourceLanguages(languageId).flatMap((langId) => enabled(langId));
}
function str(value) {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? String(value) : void 0;
}
function isDisabledQueryFilePath(filePath) {
  const normalized = filePath.replaceAll("\\", "/");
  const parts = normalized.split("/").filter(Boolean);
  const parent = parts.length >= 2 ? parts[parts.length - 2] : "";
  return isDisabledQueryDirectoryName(parent);
}
var TreeSitterQueryLoader = class {
  queries = /* @__PURE__ */ new Map();
  loaded = false;
  loadedRoot = null;
  loadedRuleFingerprint = null;
  verbose;
  /**
   * This root's per-file parse failures, remembered across the memoized
   * (no-`force`) `loadQueries` path so a later session's ledger can carry
   * the same row without re-parsing every file (#3070 N1).
   */
  parseFailures = /* @__PURE__ */ new Map();
  /**
   * Generation (`getDegradationLedgerGeneration()`) at which `parseFailures`
   * was last replayed into the ledger — the same generation-keyed memo
   * idiom `getBundledQueriesRootHealth` above uses, applied here so a
   * memoized `loadQueries` return still re-arms `recordDegradationOnce` once
   * per session rather than only in the session that actually parsed.
   */
  parseFailuresReplayedGeneration;
  constructor(verbose = false) {
    this.verbose = verbose;
  }
  /** Debug logging helper */
  dbg(msg) {
    if (this.verbose) {
      logTreeSitterDiagnostic({
        subsystem: "query-loader",
        level: "debug",
        message: msg
      });
    }
  }
  /**
   * One degradation-ledger record per malformed rule file per session
   * (#3054 review F1). The old hand-rolled scanner tolerated almost any
   * line-level mistake and still produced SOME parsed shape; `yaml.load`
   * correctly throws on realistic authoring mistakes the scanner shrugged
   * off (a colon in an unquoted scalar, a tab in list indentation, a
   * duplicate key, an unclosed quote, a bare `@` value — fuzzed over 800
   * corruptions of one shipped query: 139 that loaded before now skip, 0
   * the other way). Before this, the only sink on that skip path was
   * `dbg()`, gated behind `verbose` — both production instantiations
   * (this file's `queryLoader` singleton and `tree-sitter-client.ts`'s
   * `new TreeSitterQueryLoader()`) construct with the `verbose = false`
   * default — so a silently-dropped custom rule had no surviving signal.
   */
  recordQueryParseFailure(filePath, reason) {
    this.parseFailures.set(filePath, reason);
    recordDegradationOnce({
      kind: "tree-sitter-query-parse-failed",
      subject: filePath,
      reason
    });
  }
  /**
   * Replay every remembered per-file parse failure into the CURRENT
   * session's ledger, at most once per ledger generation (#3070 N1). A
   * memoized `loadQueries` return skips `parseQueryFile` entirely, so
   * without this replay the `tree-sitter-query-parse-failed` record only
   * ever reached the FIRST session that actually parsed — `resetDegradationLedger`
   * (wired into `handleSessionStart`) clears the once-keys every session,
   * but the loader instance and its `parseFailures` memo are kept across
   * sessions (`clients/tree-sitter-shared.ts:39`), the same shape
   * `getBundledQueriesRootHealth` above already re-probes per generation.
   */
  replayQueryParseFailures() {
    const generation = getDegradationLedgerGeneration();
    if (this.parseFailuresReplayedGeneration === generation)
      return;
    this.parseFailuresReplayedGeneration = generation;
    for (const [filePath, reason] of this.parseFailures) {
      recordDegradationOnce({
        kind: "tree-sitter-query-parse-failed",
        subject: filePath,
        reason
      });
    }
  }
  /**
   * Load all queries from the rules/tree-sitter-queries directory.
   *
   * Returns the in-memory memo when the same root is already loaded and the
   * mutable corpus's content fingerprint is unchanged. That fingerprint is
   * computed at most once per dispatch cycle and reused by every later call
   * in the cycle (`ruleCorpusFingerprintForCycle`), so routine re-scans and
   * structural searches do no filesystem work at all on the warm path
   * (#4212 round 4; rounds 2 and 3 each paid for per-call detection). An edit
   * made during a cycle is therefore seen by the NEXT cycle — or earlier, by
   * any `force: true` call, which republishes the fresh value into the cycle.
   *
   * `force: true` re-reads from disk regardless — the dispatch runner's
   * RuleCache-miss path: a miss means the content fingerprint moved, so
   * without `force` the memo could hand back pre-edit rules to be persisted
   * under the fresh fingerprint (#878).
   */
  async loadQueries(rootDir = process.cwd(), options = {}) {
    const resolvedRoot = path3.resolve(rootDir);
    const ruleFingerprint = ruleCorpusFingerprintForCycle("tree-sitter", resolvedRoot, computeMutableRuleFingerprint, options.force);
    if (!options.force && this.loaded && this.loadedRoot === resolvedRoot && this.loadedRuleFingerprint === ruleFingerprint) {
      this.replayQueryParseFailures();
      return this.queries;
    }
    this.queries.clear();
    this.parseFailures.clear();
    this.loaded = false;
    const queryDirs = [
      .../* @__PURE__ */ new Set([
        path3.join(resolvedRoot, "rules", "tree-sitter-queries"),
        path3.join(getUserRuleRoot(), "tree-sitter-queries"),
        resolvePackagePath(import.meta.url, "rules", "tree-sitter-queries")
      ])
    ];
    for (const queriesDir of queryDirs) {
      if (!fs4.existsSync(queriesDir)) {
        this.dbg(`Queries directory not found: ${queriesDir}`);
        continue;
      }
      const languageDirs = fs4.readdirSync(queriesDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
      for (const lang of languageDirs) {
        const langDir = path3.join(queriesDir, lang);
        const languageKey = getQueryLanguageKey(lang);
        const queryFiles = fs4.readdirSync(langDir).filter((f) => f.endsWith(".yml"));
        const langQueries = this.queries.get(languageKey) ?? [];
        for (const file of queryFiles) {
          const filePath = path3.join(langDir, file);
          const query = this.parseQueryFile(filePath, languageKey);
          if (query) {
            if (!langQueries.some((existing) => existing.id === query.id)) {
              langQueries.push(query);
            }
          }
        }
        if (langQueries.length > 0) {
          this.queries.set(languageKey, langQueries);
          this.dbg(`Loaded ${langQueries.length} queries for ${languageKey}`);
        }
      }
    }
    this.loaded = true;
    this.loadedRoot = resolvedRoot;
    this.loadedRuleFingerprint = ruleFingerprint;
    this.parseFailuresReplayedGeneration = getDegradationLedgerGeneration();
    return this.queries;
  }
  /**
   * Parse a single YAML query file
   */
  parseQueryFile(filePath, language) {
    try {
      const content = fs4.readFileSync(filePath, "utf-8");
      const parsed = this.parseYaml(content);
      const id = str(parsed.id);
      const query = typeof parsed.query === "string" ? parsed.query : void 0;
      if (!id || !query) {
        this.dbg(`Invalid query file: ${filePath}`);
        this.recordQueryParseFailure(filePath, !id ? `'id' is missing or not a scalar (got ${typeof parsed.id})` : `'query' is missing or not a string (got ${typeof parsed.query})`);
        return null;
      }
      return {
        id,
        name: str(parsed.name) || id,
        severity: this.parseSeverity(parsed.severity),
        category: str(parsed.category) || "general",
        language: str(parsed.language) || language,
        message: str(parsed.message) || `Pattern: ${id}`,
        description: str(parsed.description) || void 0,
        query,
        metavars: Array.isArray(parsed.metavars) ? parsed.metavars.map(String) : this.extractMetavars(query),
        post_filter: str(parsed.post_filter) || void 0,
        // biome-ignore lint/suspicious/noExplicitAny: Post filter params
        post_filter_params: parsed.post_filter_params,
        defect_class: str(parsed.defect_class) || void 0,
        inline_tier: str(parsed.inline_tier) || void 0,
        skip_test_files: parsed.skip_test_files === true,
        ignore_paths: Array.isArray(parsed.ignore_paths) ? parsed.ignore_paths.map(String) : void 0,
        // Parse predicates if present
        predicates: Array.isArray(parsed.predicates) ? parsed.predicates.map((p) => ({
          type: p.type,
          var: p.var,
          value: p.value
        })) : void 0,
        tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : void 0,
        cwe: Array.isArray(parsed.cwe) ? parsed.cwe.map(String) : void 0,
        owasp: Array.isArray(parsed.owasp) ? parsed.owasp.map(String) : void 0,
        confidence: str(parsed.confidence) || void 0,
        has_fix: parsed.has_fix === true || parsed.has_fix === "true",
        fix_action: str(parsed.fix_action) || void 0,
        filePath
      };
    } catch (err) {
      this.dbg(`Failed to parse ${filePath}: ${err}`);
      this.recordQueryParseFailure(filePath, err instanceof Error ? err.message : String(err));
      return null;
    }
  }
  /**
   * Parse a query file's YAML with `js-yaml` — the same real parser
   * `clients/dispatch/runners/yaml-rule-parser.ts` uses for ast-grep rules
   * (#206: a hand-rolled line scanner flattened nested structures there; the
   * hand-rolled scanner this loader carried made the identical mistake,
   * twice over — its inline `[a, b]` array branch unquoted list items but
   * its multi-line `- item` branch did not, so `console-statement.yml`'s
   * quoted `ignore_paths` glob parsed with the quote marks attached and the
   * #965 carve-out never matched a path, #3041/#3046). A genuine syntax
   * error throws, caught by `parseQueryFile`'s `try`/`catch`; a
   * syntactically valid but wrong-shaped document (a bare scalar, a list,
   * `null`) is cast here and skipped by `parseQueryFile`'s `id`/`query`
   * type check below — property access on a non-object primitive never
   * throws in JS, so no separate `typeof parsed !== "object"` guard is
   * needed here (#3054 review F3: that guard was vacuous — deleting it
   * reds nothing, every case it caught was already caught one frame up).
   */
  parseYaml(content) {
    return js_yaml_default.load(content);
  }
  /**
   * Parse severity string to valid type
   */
  parseSeverity(value) {
    if (value === "error")
      return "error";
    if (value === "warning")
      return "warning";
    if (value === "info")
      return "info";
    return "warning";
  }
  /**
   * Extract @VAR patterns from query string
   */
  extractMetavars(query) {
    const matches = query.match(/@([A-Z_][A-Z0-9_]*)/g);
    if (!matches)
      return [];
    return [...new Set(matches.map((m) => m.slice(1)))];
  }
  /**
   * Get queries for a specific language
   */
  getQueriesForLanguage(language) {
    const all = this.queries.get(language) || [];
    return all.filter((q) => !isDisabledQueryFilePath(q.filePath));
  }
  /**
   * Get a specific query by ID
   */
  getQueryById(id) {
    for (const langQueries of this.queries.values()) {
      const query = langQueries.find((q) => q.id === id);
      if (query)
        return query;
    }
    return void 0;
  }
  /**
   * Find matching query for a pattern string
   */
  findMatchingQuery(pattern, language) {
    const langQueries = this.getQueriesForLanguage(language);
    for (const query of langQueries) {
      if (pattern.includes(query.id))
        return query;
      switch (query.id) {
        case "empty-catch":
          if (pattern.includes("empty-catch") || pattern.includes("catch {}"))
            return query;
          break;
        case "debugger-statement":
          if (pattern.includes("debugger"))
            return query;
          break;
        case "await-in-loop":
          if (pattern.includes("await-in-loop") || pattern.includes("await"))
            return query;
          break;
        case "hardcoded-secrets":
          if (pattern.includes("hardcoded") || pattern.includes("api_key") || pattern.includes("password"))
            return query;
          break;
        case "dangerously-set-inner-html":
          if (pattern.includes("dangerously") || pattern.includes("innerHTML"))
            return query;
          break;
        case "nested-ternary":
          if (pattern.includes("ternary") || pattern.includes("? :"))
            return query;
          break;
        case "no-eval":
          if (pattern.includes("eval") && !pattern.includes("console"))
            return query;
          break;
        case "deep-promise-chain":
          if (pattern.includes(".then") && pattern.includes(".catch"))
            return query;
          break;
        case "console-statement":
          if (pattern.includes("console") && !pattern.includes("test"))
            return query;
          break;
        case "long-parameter-list":
          if (pattern.includes("PARAMS"))
            return query;
          break;
        // Python queries
        case "bare-except":
          if (pattern.includes("bare-except") || pattern.includes("except:"))
            return query;
          break;
        case "mutable-default-arg":
          if (pattern.includes("mutable") || pattern.includes("default"))
            return query;
          break;
        case "wildcard-import":
          if (pattern.includes("wildcard") || pattern.includes("import *"))
            return query;
          break;
        case "eval-exec":
          if (pattern.includes("eval") || pattern.includes("exec"))
            return query;
          break;
        case "is-vs-equals":
          if (pattern.includes("is") || pattern.includes("equals"))
            return query;
          break;
        case "unreachable-except":
          if (pattern.includes("unreachable") || pattern.includes("except"))
            return query;
          break;
      }
    }
    return void 0;
  }
  /**
   * Get all loaded queries
   */
  getAllQueries() {
    const all = [];
    for (const queries of this.queries.values()) {
      all.push(...queries);
    }
    return all;
  }
  /**
   * Reload queries from disk
   */
  async reload() {
    this.queries.clear();
    this.loaded = false;
    await this.loadQueries();
  }
};
var queryLoader = new TreeSitterQueryLoader();

// dist/clients/tree-sitter-client.js
var _require2 = createRequire2(import.meta.url);
var TREE_SITTER_MAX_SCAN_FILES = 2e4;
var QUERY_BATCH_MAX_LOAD_FAILURES = 3;
var NO_NESTED_ANCHOR_VISIT_CAP = 1e4;
var PYTHON_SQL_SINK_METHODS = /* @__PURE__ */ new Set([
  "execute",
  "executemany",
  "query",
  "raw"
]);
var TYPESCRIPT_SQL_KNOWN_PACKAGES = /* @__PURE__ */ new Set([
  "pg",
  "mysql2",
  "better-sqlite3",
  "knex",
  "@prisma/client"
]);
var TYPESCRIPT_SQL_IMPORTS = /* @__PURE__ */ new WeakMap();
function wasmQueryInput(queryKey) {
  return { languageId: "query", source: queryKey };
}
var NOT_PARSED = { parsed: false };
function createParserCounters() {
  return {
    parserInvocations: 0,
    parserDurationMs: 0,
    parserFailures: 0
  };
}
function grammarWriteBlockedReason(dir) {
  let probe = dir;
  while (!fs5.existsSync(probe)) {
    const parent = path4.dirname(probe);
    if (parent === probe)
      return "ENOENT";
    probe = parent;
  }
  try {
    fs5.accessSync(probe, fs5.constants.W_OK);
    return void 0;
  } catch (err) {
    return err?.code ?? "EACCES";
  }
}
function grammarFileStamp(filePath) {
  try {
    const stat = fs5.statSync(filePath);
    return stat.isFile() ? `${stat.size}:${stat.mtimeMs}` : void 0;
  } catch {
    return void 0;
  }
}
var UNRESOLVED_IMPORT_MESSAGE = "resolved is not a function";
var WASM_TRAP_MESSAGES = [
  "memory access out of bounds",
  "table index is out of bounds",
  "null function or function signature mismatch"
];
function classifyTreeSitterWasmError(thrown) {
  const message = thrown instanceof Error ? thrown.message : String(thrown);
  if (message.includes("Aborted") || message.includes("abort()")) {
    return "abort";
  }
  const { WebAssembly } = globalThis;
  if (thrown instanceof WebAssembly.RuntimeError)
    return "trap";
  if (thrown instanceof TypeError && message === UNRESOLVED_IMPORT_MESSAGE) {
    return "trap";
  }
  return WASM_TRAP_MESSAGES.some((trap) => message.includes(trap)) ? "trap" : void 0;
}
var WASM_TRAP_BUDGET = 3;
var GRAMMAR_TRAP_LATCH_THRESHOLD = WASM_TRAP_BUDGET - 1;
var RESOLUTION_ERROR_CODES = /* @__PURE__ */ new Set([
  "ERR_MODULE_NOT_FOUND",
  "MODULE_NOT_FOUND",
  "ERR_INVALID_MODULE_SPECIFIER",
  "ERR_UNSUPPORTED_DIR_IMPORT",
  "ENOENT",
  "EMFILE",
  "EBUSY",
  "EAGAIN",
  "EPERM",
  "ETXTBSY"
]);
function collectErrorCodes(err) {
  const codes = [];
  let current = err;
  const seen = /* @__PURE__ */ new Set();
  while (current instanceof Error && !seen.has(current)) {
    seen.add(current);
    const code = current.code;
    if (typeof code === "string")
      codes.push(code);
    current = current.cause;
  }
  return codes;
}
function classifyWebTreeSitterLoadFailure(err) {
  const codes = collectErrorCodes(err);
  return codes.some((code) => RESOLUTION_ERROR_CODES.has(code)) ? "resolution" : "evaluation";
}
var TreeSitterClient = class _TreeSitterClient {
  initialized = false;
  initPromise = null;
  /**
   * Set when `loadWebTreeSitter()` itself rejects with an EVALUATION-shaped
   * error (#1592, review round 2 F1/F2) — `classifyWebTreeSitterLoadFailure`
   * above draws that line. That call is a dynamic `import()` of a fixed
   * resolved URL, and Node's ESM loader permanently memoizes a module
   * record that threw during evaluation — a later `import()` of the SAME
   * URL from a later `init()` call would just replay the cached rejection,
   * not re-attempt the load. Without this latch, every `withTreeSitterRoot()`
   * call (one per file parse) would re-invoke `init()`, see `initPromise`
   * cleared by the previous attempt's `finally`, and dynamically re-import —
   * a dead retry on the hot path. A RESOLUTION-shaped rejection does NOT
   * set this: it leaves `initPromise` cleared as before, so the next
   * `init()` call retries for real, because that class of failure can
   * plausibly clear before the next call arrives.
   *
   * SESSION-scoped, not process-lifetime (round 2 F2, the #1567/#1575
   * `sgSessionHold` precedent): re-armed by `resetLoadStateForSession()`,
   * wired into `resetDispatchBaselines()` via `tree-sitter-shared.ts`'s
   * `resetTreeSitterClientLoadState()`. Re-arming does not guarantee the
   * next attempt succeeds — if the process itself didn't restart between
   * sessions, Node's module cache is unchanged and the replay will just
   * fail fast again — but it gives a fresh degradation record for the new
   * session (the ledger's own `onceKeys` are cleared at session_start too)
   * instead of silently reusing a stale verdict forever, and it does let a
   * genuinely fixed install (process WAS restarted) recover.
   *
   * Distinct from `wasmAborted`, which stays process-lifetime and is
   * deliberately NOT included in the session reset: that flag means the
   * Emscripten WASM heap itself aborted mid-use — a runtime that DID load
   * and then corrupted its own memory. Reusing that heap after a "session"
   * boundary that isn't an actual process restart is not a retry, it's
   * operating on data already documented (tree-sitter-shared.ts) as
   * requiring a real restart to recover. `webTreeSitterLoadFailed` only
   * ever covers a runtime that never loaded in the first place, so nothing
   * corrupted survives a re-arm.
   */
  webTreeSitterLoadFailed = false;
  languages = /* @__PURE__ */ new Map();
  parsers = /* @__PURE__ */ new Map();
  treeCache;
  navigator = new TreeSitterNavigator();
  grammarsDir;
  /** In-flight lazy grammar fetches, keyed by wasm filename. Evicted on
   * settle (#1536) — a rejected/false attempt must not be remembered as the
   * permanent answer for the session; only concurrent demands during the
   * SAME probe share it. */
  grammarEnsurePromises = /* @__PURE__ */ new Map();
  /** Epoch ms before which a failed grammar download is not retried
   * (#1536). A transient download failure — offline, DNS hiccup, CDN blip —
   * says nothing durable about the grammar, so it gets a bounded cooldown
   * (the `transientRetryDelayMs` shape from availability-policy.ts) instead
   * of latching for the process lifetime. */
  grammarRetryAtMs = /* @__PURE__ */ new Map();
  /**
   * Grammar path → the `size:mtimeMs` stamp at which its wasm preamble was
   * verified (#1548). A POSITIVE-only memo, so the steady-state resolve costs
   * one `stat` (which the old `existsSync` already paid) and re-reads the
   * header only when the stamp moves. Stamped rather than a bare `Set`
   * because a memo that never expires is defect-shape 6: the file it vouches
   * for can be replaced under it. Failures are deliberately NOT memoized — a
   * poisoned path must be re-examined on the next resolve so a successful
   * re-download over it is picked up immediately.
   */
  verifiedGrammarPaths = /* @__PURE__ */ new Map();
  /**
   * Grammar path → the `size:mtimeMs` stamp at which `Language.load` failed
   * on it despite passing the wasm-preamble check (#1564) — e.g. a truncated
   * download whose first four bytes are a genuine `\0asm` preamble but whose
   * body decodes short ("Code section extends past end of the module"). The
   * preamble check alone can't see this; only a real decode attempt can.
   * `resolveGrammarFile` treats a path recorded here (at the SAME stamp) as
   * absent, so the next demand re-fetches instead of reusing the same broken
   * file forever. Stamped so a fresh download (new mtime) is re-examined
   * rather than permanently distrusted — same shape as `verifiedGrammarPaths`.
   */
  decodeFailedGrammarPaths = /* @__PURE__ */ new Map();
  /**
   * Grammar path → the `size:mtimeMs` stamp at which its bytes were verified
   * to match the CURRENTLY PINNED sha256 manifest (#1760). Positive-only,
   * same discipline as `verifiedGrammarPaths`: the hash is computed once per
   * stamp (not per parse), and a stamp change — a fresh download — forces a
   * re-check rather than trusting a memo made for different bytes.
   */
  verifiedGrammarVersionAt = /* @__PURE__ */ new Map();
  /**
   * Grammar path → the `size:mtimeMs` stamp at which it was found to no
   * longer match the pinned manifest hash — a version bump
   * (`TREE_SITTER_WASMS_VERSION`, or a `SOURCE_OVERRIDES` entry), or on-disk
   * corruption (#1760). `resolveGrammarFile` treats a path recorded here (at
   * the SAME stamp) as absent, exactly like `decodeFailedGrammarPaths`, so
   * the next demand re-fetches instead of serving the stale/corrupt file for
   * the rest of the process's life. A fresh download (new stamp) is
   * re-examined rather than permanently distrusted.
   */
  staleGrammarVersionAt = /* @__PURE__ */ new Map();
  /**
   * Paths already reported as version-stale THIS SESSION, to log/record them
   * once each (#1801 review F1). Deliberately separate from
   * `staleGrammarVersionAt`: that map is a pure hash-verdict memo whose whole
   * point is to persist for the process's life (re-hashing an unchanged file
   * is exactly what it exists to avoid), so it must never double as a report
   * gate — a gate riding on process-lifetime state can't re-arm at a session
   * boundary. Cleared in `refreshGrammarSessionLatches`, mirroring
   * `poisonedGrammarPaths`.
   */
  staleReportedGrammarPaths = /* @__PURE__ */ new Set();
  /** Paths already reported as non-wasm, to log/record them once each. */
  poisonedGrammarPaths = /* @__PURE__ */ new Set();
  /** Consecutive download failures per grammar, for the exponential
   * cooldown; reset on success. */
  grammarFailureAttempts = /* @__PURE__ */ new Map();
  /**
   * Retry delay (ms) last SHOWN to the user for this grammar, or `-1` for a
   * durable (non-retryable) failure already announced. The cooldown lets
   * the ensure loop retry silently in the background — only the delay's
   * FIRST appearance, and any later escalation the user was never told
   * about, needs to interrupt them (#1536 review F6): a fresh 30s cooldown
   * re-notifies the same as an escalated 300s one once it's a genuinely new
   * number, but two consecutive 30s cooldowns (identical, nothing new to
   * say) do not. Absence means "not yet notified this streak."
   *
   * Session-scoped (#1536 review F5): cleared whenever the degradation
   * ledger's own generation moves past `grammarNotificationsLedgerGen`,
   * mirroring `trustBlockedGrammarNotifications` below — a lazy
   * compare-at-use-time against a monotonic counter, not a listener. Tied to
   * the LEDGER's generation (bumped by `resetDegradationLedger`, which
   * `handleSessionStart` calls first thing) rather than trust, since this
   * is a session boundary, not a trust transition.
   */
  grammarLastNotifiedDelayMs = /* @__PURE__ */ new Map();
  grammarNotificationsLedgerGen = getDegradationLedgerGeneration();
  trustBlockedGrammarNotifications = /* @__PURE__ */ new Set();
  trustNotificationsGeneration = getProjectTrustGeneration();
  // biome-ignore lint/suspicious/noExplicitAny: Optional dependency loaded dynamically
  ParserClass = null;
  // biome-ignore lint/suspicious/noExplicitAny: Language loader from module
  LanguageLoader = null;
  // Declared BEFORE the two caches below: a static read by an instance field
  // initializer must already be initialized (TS2729).
  static QUERY_CACHE_MAX_ENTRIES = 256;
  static QUERY_BATCH_CACHE_MAX_ENTRIES = 256;
  // biome-ignore lint/suspicious/noExplicitAny: Compiled query cache by language+pattern hash
  // BoundedFifoMap, not BoundedLruCache: recency here is refreshed by this
  // class's own explicit delete+set on both the read and the write path (see
  // cacheQuery and the two lookup sites) — exactly the raw-`Map` discipline
  // the FIFO map documents. A get() that promoted on its own would change
  // which entry eviction targets (#2442 review F5/F7).
  queryCache = new BoundedFifoMap(_TreeSitterClient.QUERY_CACHE_MAX_ENTRIES);
  /** Combined multi-rule queries by language + rule-set identity (null = don't retry). */
  queryBatchCache = new BoundedFifoMap(_TreeSitterClient.QUERY_BATCH_CACHE_MAX_ENTRIES);
  /** Concurrent callers share one native batch build per cache key. */
  queryBatchBuilds = /* @__PURE__ */ new Map();
  /** Advances whenever a successful query input heal can invalidate a build. */
  queryBatchHealEpoch = 0;
  /** Raw and batch cache keys represented by each bounded entry (#3834). */
  queryBatchInputs = /* @__PURE__ */ new Map();
  queryCacheCap() {
    const value = Number.parseInt(process.env.PI_LENS_TREE_SITTER_QUERY_CACHE_CAP ?? "", 10);
    return Number.isSafeInteger(value) && value > 0 ? value : _TreeSitterClient.QUERY_CACHE_MAX_ENTRIES;
  }
  queryBatchCacheCap() {
    const value = Number.parseInt(process.env.PI_LENS_TREE_SITTER_QUERY_BATCH_CACHE_CAP ?? "", 10);
    return Number.isSafeInteger(value) && value > 0 ? value : _TreeSitterClient.QUERY_BATCH_CACHE_MAX_ENTRIES;
  }
  // biome-ignore lint/suspicious/noExplicitAny: compiled query objects
  cacheQuery(key, value) {
    this.queryCache.delete(key);
    const evicted = this.queryCache.setMaxEntries(this.queryCacheCap());
    evicted.push(...this.queryCache.set(key, value));
    for (const [, dropped] of evicted)
      dropped?.query?.delete?.();
  }
  cacheQueryBatch(key, value, inputKeys = []) {
    const replaced = this.queryBatchCache.get(key);
    this.queryBatchCache.delete(key);
    if (replaced)
      this.retireQueryBatch(replaced);
    const evicted = this.queryBatchCache.setMaxEntries(this.queryBatchCacheCap());
    evicted.push(...this.queryBatchCache.set(key, value));
    for (const [evictedKey] of evicted)
      this.queryBatchInputs.delete(evictedKey);
    this.queryBatchInputs.set(key, new Set(inputKeys));
    for (const [, dropped] of evicted)
      this.retireQueryBatch(dropped);
  }
  disposeQueryBatch(batch) {
    if (batch.disposed)
      return;
    batch.disposed = true;
    batch.query?.delete?.();
  }
  retireQueryBatch(batch) {
    if (!batch)
      return;
    batch.retired = true;
    if (batch.users === 0) {
      this.disposeQueryBatch(batch);
    } else {
      incrementDegradationCount({
        kind: "wasm-query-batch-disposal-deferred",
        subject: "web-tree-sitter",
        reason: "deferred batch disposal while a scan is active"
      });
    }
  }
  retainQueryBatch(batch) {
    batch.users++;
  }
  releaseQueryBatch(batch) {
    batch.users--;
    if (batch.retired && batch.users === 0)
      this.disposeQueryBatch(batch);
  }
  /**
   * Move the leases counted at join onto the batch they were built for, and
   * mark the build decided (#4207 F9). Runs in the same synchronous section
   * that publishes the batch, so a batch is never visible to a heal without
   * its consumers' leases: the heal then defers disposal to the last release
   * instead of deleting the native Query under scans that are about to run it
   * and silently report zero findings. A later joiner reads `lease.batch` and
   * retains directly, because the counter is drained.
   */
  takeQueryBatchLeases(lease, batch) {
    lease.batch = batch;
    if (!batch)
      return null;
    batch.users += lease.count;
    lease.count = 0;
    return batch;
  }
  /** Consecutive grammar-load failures per batch key — bounds load retries (#889). */
  queryBatchLoadFailures = /* @__PURE__ */ new Map();
  queryLoader = new TreeSitterQueryLoader();
  verbose;
  parserCounters = createParserCounters();
  parseCacheMeasurement = new AsyncLocalStorage();
  activeMeasurements = 0;
  onWasmAbort;
  wasmAborted = false;
  /** Traps absorbed so far. Process-lifetime like `wasmAborted`: the heap
   * outlives sessions, so no session reset may re-arm it (#3605). */
  wasmTraps = 0;
  /** Traps already counted, so one that passes two report sites (the
   * extractor's `queryMatches`, then `parseFileAndUse`) costs one unit. */
  reportedTraps = /* @__PURE__ */ new WeakSet();
  /** Traps per input (#3605). An input's first trap spends budget; its second
   * charges the input, which is then skipped until its content changes. Only
   * a trap that spends budget (or escalates) adds an entry, so the map never
   * holds more than `WASM_TRAP_BUDGET + 1`. */
  trappedInputs = /* @__PURE__ */ new Map();
  /** Distinct input keys that trapped (first trap) and have not healed, by
   * language. Process-lifetime. A key enters only on a trap, a first trap
   * spends budget, and the budget aborts the process after `WASM_TRAP_BUDGET + 1`
   * of them, so at most that many keys exist across all languages. */
  grammarTrapInputs = /* @__PURE__ */ new Map();
  /** Grammars retired for the process after repeated scanner traps. */
  retiredGrammars = /* @__PURE__ */ new Map();
  /** The input `parseFileAndUse` is consuming. That region is synchronous, so
   * a report nested in it (the extractor's `queryMatches`) is charged to it. */
  activeWasmInput;
  grammarDirResolutionDeps;
  constructor(verbose = false, onWasmAbort, grammarDirResolutionDeps) {
    this.grammarDirResolutionDeps = grammarDirResolutionDeps ?? {
      resolveAsset: (asset) => this.resolveWebTreeSitterAsset(asset),
      resolvePackage: (specifier) => _require2.resolve(specifier),
      packageRoot: () => getPackageRoot(import.meta.url),
      cwd: () => process.cwd()
    };
    this.grammarsDir = this.findGrammarsDir();
    this.verbose = verbose;
    this.onWasmAbort = onWasmAbort;
    this.treeCache = new TreeCache(50, verbose, 4096, (key, amount) => {
      const measurement = this.parseCacheMeasurement.getStore();
      if (measurement)
        measurement[key] += amount;
    }, (error) => this.reportWasmAbort(error));
  }
  recordParserCounter(key, amount = 1) {
    this.parserCounters[key] += amount;
    const measurement = this.parseCacheMeasurement.getStore();
    if (measurement)
      measurement[key] += amount;
  }
  /**
   * True when the wasm runtime is dead: `error` is an abort, or the trap past
   * {@link WASM_TRAP_BUDGET}. Either poisons the process. A trap within the
   * budget recycles the parsers and the tree cache, is counted, and returns
   * false, so each caller keeps its own non-fatal path (#3605). A trap on an
   * `input` that has trapped before is charged to that input instead: no
   * budget, no recycle.
   */
  reportWasmAbort(thrown, input = this.activeWasmInput) {
    const failure = classifyTreeSitterWasmError(thrown);
    if (!failure)
      return false;
    const message = thrown instanceof Error ? thrown.message : String(thrown);
    if (failure === "trap") {
      if (typeof thrown === "object" && thrown !== null) {
        if (this.reportedTraps.has(thrown))
          return this.wasmAborted;
        this.reportedTraps.add(thrown);
      }
      if (input) {
        const key = this.wasmInputKey(input);
        this.countGrammarTrapInput(input.languageId, key);
        const entry = this.trappedInputs.get(key);
        if (entry) {
          entry.traps++;
          incrementDegradationCount({
            kind: "wasm-trap",
            subject: "web-tree-sitter",
            reason: `input charged: ${message}`
          });
          return false;
        }
        this.trappedInputs.set(key, {
          traps: 1,
          by: input.caller,
          source: input.languageId === "query" ? input.source : void 0
        });
      }
      if (++this.wasmTraps <= WASM_TRAP_BUDGET) {
        incrementDegradationCount({
          kind: "wasm-trap",
          subject: "web-tree-sitter",
          reason: message
        });
        this.parsers.clear();
        this.treeCache.clear();
        return false;
      }
    }
    if (!this.wasmAborted) {
      this.wasmAborted = true;
      recordDegradation({
        kind: "wasm-abort",
        subject: "web-tree-sitter",
        reason: failure === "trap" ? `${WASM_TRAP_BUDGET} wasm traps absorbed, next one: ${message}` : message
      });
      this.onWasmAbort?.();
    }
    return true;
  }
  /**
   * Count `key` as a distinct trapping input of `languageId`'s grammar and
   * retire the grammar at {@link GRAMMAR_TRAP_LATCH_THRESHOLD} of them (#4010).
   * The first trap of an input is what counts: most surfaces parse fresh bytes
   * per edit, so waiting for a retry would let distinct bad files spend the
   * whole budget first. A repeat trap of one input adds nothing (set), and
   * `clearWasmInput` removes the key when the trapper's own parse succeeds.
   */
  countGrammarTrapInput(languageId, key) {
    const grammarFile = LANGUAGE_TO_GRAMMAR[languageId];
    if (!grammarFile)
      return;
    let inputs = this.grammarTrapInputs.get(languageId);
    if (!inputs)
      this.grammarTrapInputs.set(languageId, inputs = /* @__PURE__ */ new Set());
    inputs.add(key);
    if (inputs.size >= GRAMMAR_TRAP_LATCH_THRESHOLD) {
      this.retiredGrammars.set(languageId, grammarFile);
      this.recordGrammarBlocked(grammarFile);
    }
  }
  wasmInputKey(input) {
    input.key ??= crypto3.createHash("sha256").update(input.languageId).update("\0").update(input.source).digest("hex");
    return input.key;
  }
  /** Traps charged to `input` so far; no hash while nothing has trapped. */
  wasmInputTraps(input) {
    if (!input || this.trappedInputs.size === 0)
      return 0;
    return this.trappedInputs.get(this.wasmInputKey(input))?.traps ?? 0;
  }
  /**
   * Forget `input`'s trap entry after it parsed or compiled successfully
   * (#3678 F-A). A trap can be a one-off on an otherwise healthy input, so a
   * stale entry would let the next one-off trap charge the input and skip it
   * for the rest of the process. The hash is already computed on this path,
   * and the map is non-empty; the process budget still bounds trap absorption.
   * Only a success by the entry's first trapper decays it (#3678 F2, F4): a
   * healthy consumer says nothing about another consumer's trap.
   */
  clearWasmInput(input, internalBatchHeal = false) {
    if (!input || this.trappedInputs.size === 0)
      return;
    const key = this.wasmInputKey(input);
    const entry = this.trappedInputs.get(key);
    const source = entry?.source;
    if (entry?.by === input.caller) {
      this.trappedInputs.delete(key);
      this.grammarTrapInputs.get(input.languageId)?.delete(key);
      if (!internalBatchHeal)
        this.queryBatchHealEpoch++;
      for (const [batchKey, batch] of this.queryBatchCache) {
        const inputs = this.queryBatchInputs.get(batchKey);
        if (!source || !inputs?.has(source))
          continue;
        this.queryBatchCache.delete(batchKey);
        this.queryBatchInputs.delete(batchKey);
        this.retireQueryBatch(batch);
      }
    }
  }
  /** The not-parsed outcome for `thrown` on `input` (#3605). */
  notParsed(thrown, input) {
    if (!input || classifyTreeSitterWasmError(thrown) !== "trap") {
      return NOT_PARSED;
    }
    return {
      parsed: false,
      wasmTrap: this.wasmInputTraps(input) > 1 ? "charged" : "retry"
    };
  }
  /**
   * O(1) runtime footprint counters (#1123 item 2 memory attribution): every
   * field is a `Map.size` read, never an iteration over the maps' contents.
   * `wasmMemoryBytes` is deliberately NOT included here — web-tree-sitter
   * 0.25.10's Emscripten `Module` (which owns the WASM linear memory /
   * `HEAPU8.buffer`) is a private closure variable in the package's
   * `bindings.ts` and is not exposed through any public export (`Parser`,
   * `Language`, `Query`, ...); reaching it would require either reflecting
   * into the package's internal module state (brittle across web-tree-sitter
   * versions/bundling) or overriding Emscripten's `wasmMemory` module option
   * at `Parser.init()` time with a hand-constructed `WebAssembly.Memory`
   * matching the library's own default page-count math (risks a memory-import
   * mismatch that would break ALL structural analysis, for an
   * observability-only feature). `process.memoryUsage().arrayBuffers` is the
   * process-wide proxy used instead (WASM linear memory backs an ArrayBuffer,
   * so it is included there) — see clients/memory-sampler.ts.
   */
  getRuntimeStats() {
    return {
      languagesLoaded: this.languages.size,
      parsersLoaded: this.parsers.size,
      queryCacheSize: this.queryCache.size,
      queryBatchCacheSize: this.queryBatchCache.size
    };
  }
  getParseCacheStats() {
    return {
      ...this.treeCache.getStats(),
      ...this.parserCounters
    };
  }
  /**
   * Grow the tree cache to span a full-project scan's working set (#1715).
   * The interactive default (50 entries) can't hold a mid/large project's
   * file count, so a second scan re-parses everything the first scan's LRU
   * evicted — live dogfood evidence showed every miss on a second 110-file
   * scan was a `capacityMisses` one. Bounded by
   * `TREE_CACHE_SCAN_CAPACITY_CEILING` (see `deriveScanTreeCacheCapacity`'s
   * heap-cost note) and monotonic — a smaller scan never shrinks a capacity
   * an earlier, larger one already grew.
   */
  ensureTreeCacheCapacity(fileCount) {
    this.treeCache.setMaxSize(deriveScanTreeCacheCapacity(fileCount, this.treeCache.getMaxSize()));
  }
  async withParseCacheMeasurement(work, onComplete) {
    const measurement = {
      ...createTreeCacheCounters(),
      ...createParserCounters()
    };
    this.activeMeasurements++;
    try {
      return await this.parseCacheMeasurement.run(measurement, async () => {
        try {
          return await work();
        } finally {
          const cacheStats = this.treeCache.getStats();
          try {
            onComplete({
              ...cacheStats,
              ...measurement,
              misses: measurement.lookups - measurement.hits
            });
          } catch {
          }
        }
      });
    } finally {
      if (--this.activeMeasurements === 0)
        this.parseCacheMeasurement.disable();
    }
  }
  /** Debug logging helper */
  dbg(msg) {
    if (this.verbose) {
      logTreeSitterDiagnostic({
        subsystem: "tree-sitter-client",
        level: "debug",
        message: msg
      });
    }
  }
  /**
   * web-tree-sitter's installed package directory, through the one shared
   * ladder in `scripts/lib/web-tree-sitter-dir.mjs` (#3409). Routed through
   * `grammarDirResolutionDeps` so the resolver context — the thing that
   * differs on a compiled host — stays the injected seam (#2112/#2136).
   */
  webTreeSitterPackageDir() {
    return resolveWebTreeSitterPackageDir({
      resolve: (specifier) => this.grammarDirResolutionDeps.resolvePackage(specifier),
      packageRoot: () => this.grammarDirResolutionDeps.packageRoot(),
      cwd: () => this.grammarDirResolutionDeps.cwd()
    });
  }
  /**
   * Resolve a web-tree-sitter asset path:
   * 1. the asset's own subpath, authoritative when the package `exports` it
   *    (`tree-sitter.wasm` is exported; `grammars` is NOT in 0.25.10, so this
   *    rung is dead for the grammars dir — #3409's second symptom);
   * 2. the asset inside the package directory the shared ladder resolves. That
   *    ladder's own last two rungs are the package-root walk (#20, for pi's
   *    temp-dir compile) and the cwd fallback this method used to spell out.
   */
  resolveWebTreeSitterAsset(asset) {
    try {
      const resolved = this.grammarDirResolutionDeps.resolvePackage(`web-tree-sitter/${asset}`);
      if (fs5.existsSync(resolved))
        return resolved;
    } catch {
    }
    const pkgDir = this.webTreeSitterPackageDir();
    if (pkgDir) {
      const candidate = path4.join(pkgDir, asset);
      if (fs5.existsSync(candidate))
        return candidate;
    }
    return void 0;
  }
  /**
   * The `grammars/` dir bundled inside the pi-lens package (the core grammars
   * shipped in the tarball, so common languages parse offline on every package
   * manager). Resolved from the package root; cached. Absent in a source
   * checkout where `prepare` hasn't populated it.
   */
  _bundledGrammarsDir;
  bundledGrammarsDir() {
    if (this._bundledGrammarsDir)
      return this._bundledGrammarsDir;
    try {
      const dir = resolvePackagePath(import.meta.url, "grammars");
      if (fs5.existsSync(dir))
        this._bundledGrammarsDir = dir;
      return this._bundledGrammarsDir;
    } catch {
      return void 0;
    }
  }
  _vendoredGrammarsDir;
  /**
   * The committed `vendor/grammars` dir, if it exists. Cached only on a hit,
   * mirroring `bundledGrammarsDir`.
   */
  vendoredGrammarsDir() {
    if (this._vendoredGrammarsDir)
      return this._vendoredGrammarsDir;
    try {
      const dir = vendoredGrammarsDir();
      if (fs5.existsSync(dir))
        this._vendoredGrammarsDir = dir;
      return this._vendoredGrammarsDir;
    } catch {
      return void 0;
    }
  }
  /**
   * All directories that may hold grammar wasms, in precedence order: the
   * committed vendor dir, the bundled core dir, the resolved
   * `this.grammarsDir`, and the web-tree-sitter grammars dir (the lazy-fetch
   * write target). Deduped.
   *
   * `vendor/grammars` comes first because it is the ONLY source for a grammar
   * we build ourselves (`VENDORED_GRAMMARS`) — nothing downloads into the
   * later dirs for it, so a miss here is a miss everywhere.
   */
  grammarSourceDirs() {
    const dirs = [];
    const push = (d) => {
      if (d && !dirs.includes(d))
        dirs.push(d);
    };
    push(this.vendoredGrammarsDir());
    push(this.bundledGrammarsDir());
    push(this.grammarsDir || void 0);
    push(this.resolveWebTreeSitterAsset("grammars"));
    return dirs;
  }
  /**
   * Absolute path to `grammarFile` across all source dirs, else undefined.
   *
   * Existence is not enough (#1548): a file whose first four bytes aren't the
   * wasm preamble is not a grammar, and returning it would report the language
   * as available while every `Language.load` fails — the permanent-poisoning
   * shape this issue is about. #1548 stops NEW poisoned files from being
   * written, but a file poisoned before that shipped is already on disk, so
   * the resolve path has to reject it too: a rejected candidate is treated as
   * absent, which lets `ensureGrammar` re-download over it.
   */
  resolveGrammarFile(grammarFile) {
    for (const dir of this.grammarSourceDirs()) {
      const candidate = path4.join(dir, grammarFile);
      const stamp = grammarFileStamp(candidate);
      if (!stamp)
        continue;
      if (this.decodeFailedGrammarPaths.get(candidate) === stamp)
        continue;
      if (this.verifiedGrammarPaths.get(candidate) === stamp) {
        if (this.isGrammarVersionCurrent(candidate, grammarFile, stamp)) {
          return candidate;
        }
        continue;
      }
      if (fileHasWasmMagic(candidate)) {
        this.verifiedGrammarPaths.set(candidate, stamp);
        if (this.isGrammarVersionCurrent(candidate, grammarFile, stamp)) {
          return candidate;
        }
        continue;
      }
      this.verifiedGrammarPaths.delete(candidate);
      this.reportPoisonedGrammarFile(candidate, grammarFile);
    }
    return void 0;
  }
  /**
   * Clear the once-per-session grammar report gates when the degradation
   * ledger's own generation has moved (#1536 review F5). Lazy
   * compare-at-use-time against a monotonic counter, bumped by
   * `resetDegradationLedger`, which `handleSessionStart` calls first thing —
   * no listener, no retention. Every gate keyed to a SESSION rather than to
   * the process lives here, so a new one cannot forget to re-arm: a gate that
   * outlives the ledger it guards silently swallows the record it was only
   * ever meant to de-duplicate (#1560 review F1).
   */
  refreshGrammarSessionLatches() {
    const ledgerGen = getDegradationLedgerGeneration();
    if (ledgerGen === this.grammarNotificationsLedgerGen)
      return;
    this.grammarNotificationsLedgerGen = ledgerGen;
    this.grammarLastNotifiedDelayMs.clear();
    this.poisonedGrammarPaths.clear();
    this.staleReportedGrammarPaths.clear();
    for (const grammarFile of this.retiredGrammars.values()) {
      this.recordGrammarBlocked(grammarFile);
    }
  }
  recordGrammarBlocked(grammarFile) {
    recordDegradationOnce({
      kind: "grammar-blocked",
      subject: grammarFile,
      reason: `grammar retired after ${GRAMMAR_TRAP_LATCH_THRESHOLD} distinct WASM traps; structural analysis is unavailable for this language until restart`
    });
  }
  /**
   * Log + record a grammar file on disk that isn't a wasm module, once per
   * path per session. No user notification here: the caller goes on to attempt
   * a re-download, and `recordGrammarFailure` is what interrupts the user if
   * that also fails. A silent recovery should stay silent.
   */
  reportPoisonedGrammarFile(candidate, grammarFile) {
    this.refreshGrammarSessionLatches();
    if (this.poisonedGrammarPaths.has(candidate))
      return;
    this.poisonedGrammarPaths.add(candidate);
    logTreeSitterDiagnostic({
      subsystem: "tree-sitter-client",
      level: "warn",
      message: `ignoring ${candidate}: the file is not a wasm module (missing the \\0asm preamble) \u2014 most likely a captive-portal or proxy page written by an earlier download (#1548). pi-lens will treat the grammar as missing and try to fetch it again.`,
      metadata: { grammarFile, path: candidate, outcome: "not-wasm" }
    });
    incrementDegradationCount({
      kind: "grammar-blocked",
      subject: grammarFile,
      reason: "on-disk grammar file is not a wasm module \u2014 ignored, re-fetching"
    });
  }
  /**
   * Is the cached grammar at `candidate` (whose wasm preamble already passed)
   * still current against the pinned sha256 manifest (#1760)?
   *
   * A grammar downloaded once is never revisited when this repo bumps
   * `TREE_SITTER_WASMS_VERSION` or changes a `SOURCE_OVERRIDES` entry — the
   * cached file's name carries no version, so a stale build serves forever.
   * The check is cheap and NEVER touches the network: it compares the
   * on-disk sha256 (hashed once per `size:mtimeMs` stamp, memoized exactly
   * like `verifiedGrammarPaths` above so a hot parse loop never re-hashes an
   * unchanged file) against `pinnedGrammarHash`, which itself is a pure
   * in-memory manifest lookup. A mismatch also catches on-disk corruption,
   * which nothing detected before this.
   *
   * Vendored grammars (`VENDORED_GRAMMARS`) are skipped: they have no CDN
   * pin to drift against, and their bytes are already guarded by the
   * separate build-provenance check (`scripts/check-grammar-provenance.mjs`).
   * No pinned hash for this filename (manifest missing, or a grammar added
   * before `--write-manifest` was re-run) is treated as "can't verify" and
   * trusted, the same fallback `downloadGrammarDetailed`'s own hash check
   * already uses — never as a forced, unbounded refetch loop.
   */
  isGrammarVersionCurrent(candidate, grammarFile, stamp) {
    if (isVendoredGrammar(grammarFile))
      return true;
    if (this.staleGrammarVersionAt.get(candidate) === stamp) {
      this.reportStaleGrammarVersion(candidate, grammarFile);
      return false;
    }
    if (this.verifiedGrammarVersionAt.get(candidate) === stamp)
      return true;
    const pinnedHash = pinnedGrammarHash(grammarFile);
    if (!pinnedHash) {
      this.verifiedGrammarVersionAt.set(candidate, stamp);
      return true;
    }
    const actualHash = grammarFileSha256(candidate);
    if (actualHash === pinnedHash) {
      this.verifiedGrammarVersionAt.set(candidate, stamp);
      return true;
    }
    this.verifiedGrammarVersionAt.delete(candidate);
    this.staleGrammarVersionAt.set(candidate, stamp);
    this.reportStaleGrammarVersion(candidate, grammarFile);
    return false;
  }
  /**
   * Log + record a version-stale (or corrupt) cached grammar, once per path
   * per SESSION (#1801 review F1). Called from BOTH the memoized-stale path
   * and the fresh-mismatch path in `isGrammarVersionCurrent`, so the report
   * gate is independent of `staleGrammarVersionAt`'s own process-lifetime
   * memo — a grammar that is STILL stale in a later session must still emit
   * a fresh record into that session's ledger, exactly like
   * `reportPoisonedGrammarFile` already does for the non-wasm case.
   */
  reportStaleGrammarVersion(candidate, grammarFile) {
    this.refreshGrammarSessionLatches();
    if (this.staleReportedGrammarPaths.has(candidate))
      return;
    this.staleReportedGrammarPaths.add(candidate);
    logTreeSitterDiagnostic({
      subsystem: "tree-sitter-client",
      level: "warn",
      message: `ignoring ${candidate}: its sha256 no longer matches the pinned grammar manifest \u2014 the pinned tree-sitter-wasms version (or a SOURCE_OVERRIDES entry) moved since this file was downloaded. pi-lens will treat the grammar as missing and re-fetch the current build (#1760).`,
      metadata: { grammarFile, path: candidate, outcome: "stale-version" }
    });
    incrementDegradationCount({
      kind: "grammar-blocked",
      subject: grammarFile,
      reason: "cached grammar no longer matches the pinned manifest hash \u2014 ignored, re-fetching"
    });
  }
  /** Find tree-sitter grammar directory */
  findGrammarsDir(deps = this.grammarDirResolutionDeps) {
    const grammarsDir = deps.resolveAsset("grammars");
    if (grammarsDir && fs5.existsSync(path4.join(grammarsDir, "tree-sitter-typescript.wasm"))) {
      return grammarsDir;
    }
    try {
      const wasmsOut = path4.join(path4.dirname(deps.resolvePackage("tree-sitter-wasms/package.json")), "out");
      if (fs5.existsSync(wasmsOut))
        return wasmsOut;
    } catch {
    }
    const cwdWasms = path4.join(deps.cwd(), "node_modules", "tree-sitter-wasms", "out");
    if (fs5.existsSync(cwdWasms))
      return cwdWasms;
    return "";
  }
  /**
   * The directory where grammars SHOULD live (web-tree-sitter/grammars),
   * whether or not it exists yet — so we can create + populate it when the
   * postinstall download was skipped (pnpm/bun). Returns undefined if
   * web-tree-sitter itself can't be located.
   *
   * #3409: this used to resolve the BARE `web-tree-sitter` specifier and
   * nothing else, which throws MODULE_NOT_FOUND inside the `bun
   * build --compile` binary pi ships — so on every such host it returned
   * undefined and NO non-core grammar could ever be fetched. It now shares the
   * read path's ladder, whose first rung is a subpath that does resolve there.
   */
  grammarsWriteDir() {
    const pkgDir = this.webTreeSitterPackageDir();
    return pkgDir ? path4.join(pkgDir, "grammars") : void 0;
  }
  /**
   * Ensure a single grammar wasm is on disk, fetching it at runtime if the
   * postinstall didn't (pnpm/bun skip lifecycle scripts — the documented
   * build-scripts gap). Idempotent and de-duplicated per file. Best-effort:
   * a failed fetch (e.g. offline) degrades to "grammar unavailable", never
   * throws.
   */
  async ensureGrammar(grammarFile) {
    if (this.resolveGrammarFile(grammarFile)) {
      return true;
    }
    if (!assertInstallAllowed(`tree-sitter grammar fetch: ${grammarFile}`)) {
      const unavailable = `tree-sitter grammar '${grammarFile}' is unavailable because the project is not trusted; runtime grammar downloads are disabled until trust is granted.`;
      logTreeSitterDiagnostic({
        subsystem: "tree-sitter-client",
        message: unavailable,
        metadata: { grammarFile, outcome: "trust-gated" }
      });
      recordDegradation({
        kind: "grammar-blocked",
        subject: grammarFile,
        reason: "runtime grammar download blocked because project is untrusted"
      });
      const generation = getProjectTrustGeneration();
      if (generation !== this.trustNotificationsGeneration) {
        this.trustNotificationsGeneration = generation;
        this.trustBlockedGrammarNotifications.clear();
      }
      if (!this.trustBlockedGrammarNotifications.has(grammarFile)) {
        this.trustBlockedGrammarNotifications.add(grammarFile);
        notifyUserDegradation(`pi-lens: ${unavailable}`);
      }
      return false;
    }
    const inflight = this.grammarEnsurePromises.get(grammarFile);
    if (inflight)
      return inflight;
    const retryAt = this.grammarRetryAtMs.get(grammarFile);
    if (retryAt !== void 0 && Date.now() < retryAt) {
      return false;
    }
    const task = (async () => {
      try {
        return await this.fetchGrammar(grammarFile);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.recordGrammarFailure(
          grammarFile,
          `The runtime grammar fetch threw an unexpected error (${message}).`,
          /* retryable */
          true,
          "download-failed"
        );
        return false;
      }
    })();
    this.grammarEnsurePromises.set(grammarFile, task);
    void task.finally(() => {
      if (this.grammarEnsurePromises.get(grammarFile) === task) {
        this.grammarEnsurePromises.delete(grammarFile);
      }
    }).catch(() => {
    });
    return task;
  }
  /**
   * One grammar-fetch attempt: locate a writable dir, download, and record the
   * outcome. Split out of `ensureGrammar` so the whole body sits under one
   * try/catch that funnels any throw into `recordGrammarFailure` (#1548).
   */
  async fetchGrammar(grammarFile) {
    if (isVendoredGrammar(grammarFile)) {
      const { reason: reason2 } = vendoredGrammarRefusal(grammarFile);
      this.recordGrammarFailure(
        grammarFile,
        reason2 ?? `${grammarFile} is missing from vendor/grammars/.`,
        /* retryable */
        false
      );
      return false;
    }
    const dir = this.grammarsDir && fs5.existsSync(this.grammarsDir) ? this.grammarsDir : this.grammarsWriteDir();
    if (!dir) {
      this.recordGrammarFailure(
        grammarFile,
        "No grammars directory could be resolved for the runtime fetch: the web-tree-sitter package is not locatable from this runtime, from pi-lens's own package root, or from the working directory.",
        /* retryable */
        true,
        "write-dir-unresolvable"
      );
      return false;
    }
    const writeBlock = grammarWriteBlockedReason(dir);
    if (writeBlock) {
      this.recordGrammarFailure(
        grammarFile,
        `The grammars directory ${dir} cannot be written to (${writeBlock}), so the runtime fetch has nowhere to land.`,
        /* retryable */
        true,
        "write-dir-unwritable"
      );
      return false;
    }
    const { ok, retryable, reason } = await downloadGrammarDetailed(dir, grammarFile);
    if (ok) {
      if (!this.grammarsDir)
        this.grammarsDir = dir;
      this.grammarRetryAtMs.delete(grammarFile);
      this.grammarFailureAttempts.delete(grammarFile);
      this.grammarLastNotifiedDelayMs.delete(grammarFile);
      logTreeSitterDiagnostic({
        subsystem: "tree-sitter-client",
        level: "warn",
        message: `fetched missing tree-sitter grammar ${grammarFile} at runtime (install scripts were skipped by the package manager)`,
        metadata: { grammarFile, outcome: "fetched" }
      });
    } else {
      this.recordGrammarFailure(grammarFile, reason ?? "The package manager skipped install scripts and the runtime download failed.", retryable, "download-failed");
    }
    return ok;
  }
  /**
   * Record one failed grammar-ensure attempt: arm (or extend) the retry
   * cooldown, record the degradation, and notify the user at most once per
   * session per DISTINCT retry delay (#1536 review F1/F2/F4/F5/F6). Shared
   * by the "no writable directory" and "download failed" arms of
   * `ensureGrammar` — both are failures of the SAME ensure attempt, just
   * with a different point of failure.
   *
   * `cause` is that point of failure (#3409). It picks the REMEDY the user is
   * told and lands in the durable record, so `~/.pi-lens` forensics can tell
   * "this host has nowhere to write" from "this download failed" — the two
   * were one string, and the one it carried named build scripts and the
   * network for a cause that is neither.
   */
  recordGrammarFailure(grammarFile, detail, retryable, cause) {
    const attempts = (this.grammarFailureAttempts.get(grammarFile) ?? 0) + 1;
    this.grammarFailureAttempts.set(grammarFile, attempts);
    const retryDelayMs = retryable ? transientRetryDelayMs(attempts, "probe-timeout") : void 0;
    this.grammarRetryAtMs.set(grammarFile, retryDelayMs === void 0 ? Number.POSITIVE_INFINITY : Date.now() + retryDelayMs);
    const remedy = cause === "write-dir-unresolvable" ? `This is a packaging/module-resolution fault, not a download problem: reinstall pi-lens so its web-tree-sitter dependency is present, or drop the wasm into pi-lens's own grammars/ directory.` : cause === "write-dir-unwritable" ? `This is a filesystem-permission fault, not a download problem: make that directory writable for the user pi-lens runs as, or reinstall pi-lens as that user.` : retryable ? `if the problem persists, allow the package manager's build scripts (pnpm approve-builds / bun trustedDependencies) or restore network access.` : `Fix: reinstall with a manager that runs postinstall, allow its build scripts (pnpm approve-builds / bun trustedDependencies), or restore network access.`;
    const unavailable = `tree-sitter grammar '${grammarFile}' is unavailable \u2014 symbol search, module reports and structural rules for this language will be degraded. ${detail} ` + (retryable ? `pi-lens will retry automatically in ${Math.round(retryDelayMs / 1e3)}s; ` : `The grammar source reports it does not exist (not a network problem), so this will not resolve on retry. `) + remedy;
    logTreeSitterDiagnostic({
      subsystem: "tree-sitter-client",
      message: unavailable,
      metadata: {
        grammarFile,
        outcome: "unavailable",
        retryable,
        retryDelayMs,
        attempts,
        // Omitted, not defaulted, for the arms that are neither a fetch
        // destination nor a download verdict (a vendored grammar is never
        // downloaded; a decode failure happened AFTER a successful one), so
        // those records keep their pre-#3409 shape rather than carrying a
        // cause that is not true of them.
        ...cause ? { cause } : {}
      }
    });
    incrementDegradationCount({
      kind: "grammar-blocked",
      subject: grammarFile,
      // #1548: carry `detail` into the RETRYABLE reason too. All retryable
      // failures used to share one string, so the ledger could not tell an
      // offline laptop from a captive portal serving HTML — the two need
      // different user actions, and the ledger is what a bug report shows.
      reason: retryable ? `runtime grammar download failed \u2014 retryable (${detail.trim()})` : `runtime grammar download failed \u2014 durable (${detail.trim()})`
    });
    this.refreshGrammarSessionLatches();
    const notifyKey = retryDelayMs ?? -1;
    if (this.grammarLastNotifiedDelayMs.get(grammarFile) !== notifyKey) {
      this.grammarLastNotifiedDelayMs.set(grammarFile, notifyKey);
      notifyUserDegradation(`pi-lens: ${unavailable}`);
    }
  }
  /**
   * Record a `Language.load` failure on a file `resolveGrammarFile` had just
   * vouched for (#1564) — the diagnosis gap #1548 left open: the preamble
   * check proves the first four bytes are `\0asm`, not that the whole body
   * decodes. A decode error here (a truncated download, on-disk corruption)
   * is evidence the FILE is bad, so it gets the exact same treatment as an
   * ensure-time download failure: invalidate the resolve memo so the next
   * demand re-fetches instead of reusing the same broken file forever, and
   * reuse `recordGrammarFailure`'s cooldown/degradation/notification
   * machinery rather than hand-rolling a parallel one — a persistently
   * truncated CDN response would otherwise re-download and re-fail on every
   * single parse.
   *
   * A DURABLE decode failure (the bytes are complete and correct, but ABI-
   * incompatible with the installed `web-tree-sitter` — a version drift, not
   * a truncation) is classified `retryable` here too, same as everything
   * else this method sees: there is no way to tell "truncated" from "wrong
   * ABI" from the error message alone, so it re-downloads and re-fails once
   * per cooldown tier instead of latching forever. That is bounded by the
   * cooldown ladder (this never re-fetches faster than #1536's backoff) and
   * by `BLOCKED_GRAMMARS` for the narrower case that's fatal to the process
   * rather than just wrong (`grammar-source.ts`). The redownload only helps
   * if a fresh fetch could actually be a DIFFERENT (compatible) build,
   * which is exactly what the `grammar-source.test.ts` version/lock sync
   * guard (`lock.version === TREE_SITTER_WASMS_VERSION`) exists to keep
   * true — without it, a version bump with a stale lock would make every
   * redownload land the identical bytes and spin the ladder against a file
   * that can never pass.
   */
  recordGrammarLoadFailure(grammarPath, grammarFile, err) {
    const stamp = grammarFileStamp(grammarPath);
    this.verifiedGrammarPaths.delete(grammarPath);
    if (stamp)
      this.decodeFailedGrammarPaths.set(grammarPath, stamp);
    const message = err instanceof Error ? err.message : String(err);
    logTreeSitterDiagnostic({
      subsystem: "tree-sitter-client",
      level: "warn",
      message: `Language.load failed for ${grammarPath} even though the wasm preamble check passed (${message}) \u2014 most likely a truncated download (#1564). Treating the grammar as missing so the next demand re-fetches it.`,
      metadata: { grammarFile, path: grammarPath, outcome: "load-failed" }
    });
    this.recordGrammarFailure(
      grammarFile,
      `Language.load failed on a resolved grammar file (${message}).`,
      /* retryable */
      true
    );
  }
  /** Initialize tree-sitter WASM runtime */
  async init() {
    if (this.wasmAborted)
      return false;
    if (this.initialized)
      return true;
    if (this.webTreeSitterLoadFailed)
      return false;
    if (this.initPromise)
      return this.initPromise;
    this.initPromise = (async () => {
      try {
        let mod;
        try {
          mod = await loadWebTreeSitter();
        } catch (err) {
          const classification = classifyWebTreeSitterLoadFailure(err);
          if (classification === "evaluation") {
            this.webTreeSitterLoadFailed = true;
          }
          recordDegradationOnce({
            kind: "web-tree-sitter-load-failed",
            subject: "web-tree-sitter",
            reason: (err instanceof Error ? err.message : String(err)) + (classification === "resolution" ? " (resolution failure \u2014 retryable)" : " (evaluation failure \u2014 latched for the session)")
          });
          throw err;
        }
        const anyMod = mod;
        const ParserClass = anyMod.Parser || anyMod.default || anyMod;
        if (!ParserClass || typeof ParserClass.init !== "function") {
          this.dbg("Parser class not found or missing init method");
          return false;
        }
        this.ParserClass = ParserClass;
        this.LanguageLoader = mod.Language;
        const wasmPath = this.resolveWebTreeSitterAsset("tree-sitter.wasm");
        if (!wasmPath) {
          this.dbg("Could not resolve tree-sitter.wasm");
          return false;
        }
        const wasmDir = path4.dirname(wasmPath);
        this.dbg(`Looking for WASM at: ${wasmPath}, exists: ${fs5.existsSync(wasmPath)}`);
        await ParserClass.init({
          locateFile: (scriptName) => {
            const fullPath = path4.join(wasmDir, scriptName);
            this.dbg(`locateFile: ${scriptName} -> ${fullPath}`);
            return fullPath;
          }
        });
        this.initialized = true;
        return true;
      } catch (err) {
        this.reportWasmAbort(err);
        this.dbg(`Init error: ${err}`);
        return false;
      } finally {
        this.initPromise = null;
      }
    })();
    return this.initPromise;
  }
  /**
   * Re-arm the web-tree-sitter load latch for a new session (#1592 review
   * round 2 F2). Deliberately does NOT touch `wasmAborted` or `initialized`
   * — see `webTreeSitterLoadFailed`'s doc for why the abort case stays
   * process-lifetime, and a successful init has nothing to re-arm. Called
   * from `resetTreeSitterClientLoadState()` (tree-sitter-shared.ts), wired
   * into `resetDispatchBaselines()` beside `resetAstGrepNapiLoadState()`.
   */
  resetLoadStateForSession() {
    this.webTreeSitterLoadFailed = false;
    this.refreshGrammarSessionLatches();
  }
  /** Load language grammar */
  async loadLanguage(languageId) {
    if (this.wasmAborted)
      return null;
    this.dbg(`Loading language: ${languageId}`);
    if (this.retiredGrammars.has(languageId))
      return null;
    if (this.languages.has(languageId)) {
      this.dbg(`Language ${languageId} already loaded`);
      return this.languages.get(languageId);
    }
    if (!this.ParserClass) {
      this.dbg(`ParserClass not initialized`);
      return null;
    }
    const grammarFile = LANGUAGE_TO_GRAMMAR[languageId];
    if (!grammarFile) {
      this.dbg(`No grammar file for ${languageId}`);
      return null;
    }
    const blockReason = grammarBlockReason(grammarFile);
    if (blockReason) {
      this.dbg(`Grammar ${grammarFile} blocked on this runtime \u2014 ${blockReason}`);
      recordDegradation({
        kind: "grammar-blocked",
        subject: grammarFile,
        reason: blockReason
      });
      return null;
    }
    let grammarPath = this.resolveGrammarFile(grammarFile);
    if (!grammarPath) {
      if (await this.ensureGrammar(grammarFile)) {
        grammarPath = this.resolveGrammarFile(grammarFile);
      }
    }
    this.dbg(`Grammar path: ${grammarPath}, exists: ${grammarPath && fs5.existsSync(grammarPath)}`);
    if (!grammarPath || !fs5.existsSync(grammarPath)) {
      this.dbg(`Grammar file not found: ${grammarPath}`);
      return null;
    }
    try {
      if (!this.LanguageLoader?.load) {
        this.dbg(`LanguageLoader.load not available`);
        return null;
      }
      this.dbg(`Calling Language.load...`);
      const language = await this.LanguageLoader.load(grammarPath);
      this.dbg(`Language loaded: ${language?.name || "unknown"}`);
      if (language) {
        this.languages.set(languageId, language);
      }
      return language;
    } catch (err) {
      if (classifyTreeSitterWasmError(err) === "abort") {
        this.reportWasmAbort(err);
      } else {
        this.recordGrammarLoadFailure(grammarPath, grammarFile, err);
      }
      this.dbg(`Language load error: ${err}`);
      return null;
    }
  }
  /** Get or create parser for a language */
  async getParser(languageId) {
    if (this.wasmAborted)
      return null;
    if (this.parsers.has(languageId)) {
      return this.parsers.get(languageId);
    }
    const language = await this.loadLanguage(languageId);
    if (!language || !this.ParserClass)
      return null;
    const parser = new this.ParserClass();
    parser.setLanguage(language);
    this.parsers.set(languageId, parser);
    return parser;
  }
  /**
   * Parse a file and return the AST tree. The tree stays valid only until the
   * caller's next `await` — prefer `withParsedTree`, which extracts inside the
   * cache-safe window (#417/#675).
   */
  async parseFile(filePath, languageId, contentOverride) {
    const outcome = await this.parseFileAndUse(filePath, languageId, contentOverride, (tree) => tree, "parseFile");
    return outcome.parsed ? outcome.value : null;
  }
  async withParsedTree(filePath, languageId, contentOverride, consume, caller = "withParsedTree") {
    return this.parseFileAndUse(filePath, languageId, contentOverride, consume, caller);
  }
  async parseFileAndUse(filePath, languageId, contentOverride, consume, caller) {
    this.dbg(`Parsing ${filePath} with language ${languageId}`);
    const parser = await this.getParser(languageId);
    if (!parser) {
      this.dbg(`Failed to get parser for ${languageId}`);
      return NOT_PARSED;
    }
    let tree;
    let input;
    try {
      const content = contentOverride ?? fs5.readFileSync(filePath, "utf-8");
      this.dbg(`File content length: ${content.length}`);
      input = { languageId, source: content };
      if (this.wasmInputTraps(input) > 1) {
        return { parsed: false, wasmTrap: "charged" };
      }
      const cachedTree = this.treeCache.get(filePath, content, languageId);
      if (cachedTree) {
        this.dbg(`Using cached tree for ${filePath}`);
        tree = cachedTree;
      } else {
        const parseStartedAt = performance.now();
        this.recordParserCounter("parserInvocations");
        try {
          tree = parser.parse(content);
        } catch (err) {
          this.recordParserCounter("parserFailures");
          throw err;
        } finally {
          this.recordParserCounter("parserDurationMs", performance.now() - parseStartedAt);
        }
        this.dbg(`Parsed, root node type: ${tree.rootNode.type}`);
        this.treeCache.set(filePath, content, languageId, tree);
      }
    } catch (err) {
      this.reportWasmAbort(err, input);
      this.dbg(`Parse error: ${err}`);
      return this.notParsed(err, input);
    }
    this.clearWasmInput(input);
    input = { ...input, caller };
    try {
      this.activeWasmInput = input;
      const trapsBefore = this.wasmInputTraps(input);
      const value = consume(tree);
      if (this.wasmInputTraps(input) <= trapsBefore) {
        this.clearWasmInput(input);
      }
      return { parsed: true, value };
    } catch (thrown) {
      this.reportWasmAbort(thrown);
      if (classifyTreeSitterWasmError(thrown)) {
        return this.notParsed(thrown, input);
      }
      throw thrown;
    } finally {
      this.activeWasmInput = void 0;
    }
  }
  /**
   * Detect and extract injected content from template literals
   * Used for security analysis (SQL injection, unsafe regex, etc.)
   */
  extractInjections(filePath, content) {
    const injections = [];
    const sqlPattern = /\b(sql|query|execute)\s*`([^`]+)`/gi;
    let match;
    while ((match = sqlPattern.exec(content)) !== null) {
      const lines = content.slice(0, match.index).split("\n");
      injections.push({
        type: "sql",
        content: match[2],
        line: lines.length,
        column: lines[lines.length - 1].length
      });
    }
    const cssPattern = /\b(styled(?:\.\w+)?|css)\s*`([^`]+)`/gi;
    while ((match = cssPattern.exec(content)) !== null) {
      const lines = content.slice(0, match.index).split("\n");
      injections.push({
        type: "css",
        content: match[2],
        line: lines.length,
        column: lines[lines.length - 1].length
      });
    }
    const regexPattern = /new\s+RegExp\s*\(\s*`([^`]+)`/gi;
    while ((match = regexPattern.exec(content)) !== null) {
      const lines = content.slice(0, match.index).split("\n");
      injections.push({
        type: "regex",
        content: match[1],
        line: lines.length,
        column: lines[lines.length - 1].length
      });
    }
    this.dbg(`Found ${injections.length} injections in ${filePath}`);
    return injections;
  }
  /** Check if tree-sitter is available (a core grammar resolves somewhere). */
  isAvailable() {
    if (this.wasmAborted)
      return false;
    if (this.resolveGrammarFile("tree-sitter-typescript.wasm"))
      return true;
    const dir = this.findGrammarsDir();
    this.grammarsDir = dir;
    return !!dir && fs5.existsSync(dir);
  }
  /** Check if specific language is supported */
  async isLanguageSupported(languageId) {
    if (this.wasmAborted)
      return false;
    if (!this.initialized)
      await this.init();
    const language = await this.loadLanguage(languageId);
    return language !== null;
  }
  /** Get loaded language for symbol extraction */
  getLanguage(languageId) {
    if (this.wasmAborted || this.retiredGrammars.has(languageId))
      return null;
    return this.languages.get(languageId) || null;
  }
  // --- Structural Search ---
  /**
   * Search for a structural pattern in files
   *
   * @param pattern - Pattern with metavariables (e.g., "console.log($MSG)")
   * @param languageId - Language ID (typescript, python, etc.)
   * @param rootDir - Directory to search
   * @param options - Search options
   * @returns Array of matches with captures
   */
  async structuralSearch(pattern, languageId, rootDir, options = {}) {
    if (!this.initialized) {
      const ok = await this.init();
      if (!ok)
        return [];
    }
    try {
      await this.queryLoader.loadQueries(rootDir);
    } catch (err) {
      this.dbg(`Failed to load queries for ${rootDir}: ${err}`);
    }
    this.dbg(`Compiling pattern: ${pattern.slice(0, 50)}...`);
    const compiled = await this.compileQuery(pattern, languageId);
    if (!compiled) {
      this.dbg(`Pattern compilation failed`);
      return [];
    }
    this.dbg(`Pattern compiled, metavars: ${compiled.metavars.join(", ")}`);
    const files = this.collectFiles(rootDir, languageId, options.fileFilter);
    this.dbg(`Scanning ${files.length} files...`);
    const matches = [];
    const maxResults = options.maxResults ?? 50;
    for (const file of files) {
      if (matches.length >= maxResults)
        break;
      const fileMatches = await this.searchFileWithQuery(file, compiled.query, compiled.metavars, languageId, pattern, compiled.postFilter, compiled.postFilterParams);
      matches.push(...fileMatches);
    }
    return matches.slice(0, maxResults);
  }
  /**
   * Run a preloaded query definition against a single file.
   *
   * Optimized for dispatch runner usage to avoid per-query directory scans.
   */
  async runQueryOnFile(queryDef, filePath, languageId, options = {}, contentOverride) {
    if (!this.initialized) {
      const ok = await this.init();
      if (!ok)
        return [];
    }
    const compiled = await this.compileRawQuery(queryDef.id, queryDef.query, queryDef.metavars, languageId, queryDef.post_filter, queryDef.post_filter_params);
    if (!compiled)
      return [];
    const matches = await this.searchFileWithQuery(filePath, compiled.query, compiled.metavars, languageId, `${queryDef.id}\0${queryDef.query}`, compiled.postFilter, compiled.postFilterParams, contentOverride);
    const maxResults = options.maxResults ?? 50;
    return matches.slice(0, maxResults);
  }
  /**
   * Run a whole rule set against one file in a SINGLE tree walk (#675).
   *
   * Calling `runQueryOnFile` per rule re-walks the tree once per rule — ~34
   * walks per file on a project scan, measured at 3.3× the cost of one
   * combined query for byte-identical matches. Patterns are concatenated in
   * rule order and `match.patternIndex` maps back to the owning rule, so
   * per-rule metavars, predicates, post-filters and caps still apply and
   * results stay grouped in rule order. Rules that don't compile against this
   * language are dropped individually (never poisoning the batch), and a
   * combined query that fails to compile falls back to per-rule execution.
   */
  async runQueriesOnFile(queryDefs, filePath, languageId, options = {}, contentOverride) {
    if (queryDefs.length === 0)
      return [];
    if (!this.initialized) {
      const ok = await this.init();
      if (!ok)
        return [];
    }
    const maxResults = options.maxResults ?? 50;
    const batch = await this.compileQueryBatch(queryDefs, languageId, true);
    if (!batch) {
      const results2 = [];
      for (const queryDef of queryDefs) {
        const matches = await this.runQueryOnFile(queryDef, filePath, languageId, options, contentOverride);
        for (const match of matches)
          results2.push({ queryDef, match });
      }
      return results2;
    }
    const perQuery = /* @__PURE__ */ new Map();
    await this.parseFileAndUse(
      filePath,
      languageId,
      contentOverride,
      (tree) => {
        try {
          const rootNode = tree.rootNode;
          for (const match of batch.query.matches(rootNode)) {
            const owner = batch.ownerOfPattern[match.patternIndex];
            if (owner === void 0)
              continue;
            const bucket = perQuery.get(owner) ?? [];
            if (bucket.length >= maxResults)
              continue;
            const entry = batch.entries[owner];
            const captures = {};
            for (const capture of match.captures) {
              if (entry.metavars.includes(capture.name)) {
                captures[capture.name] = capture.node;
              }
            }
            if (!this.evaluatePredicates(batch.query, match))
              continue;
            if (entry.postFilter && !this.applyPostFilter(entry.postFilter, entry.postFilterParams, captures, rootNode)) {
              continue;
            }
            if (match.captures.length === 0)
              continue;
            const firstNode = match.captures[0].node;
            const textCaptures = {};
            for (const [name, node] of Object.entries(captures)) {
              textCaptures[name] = node.text;
            }
            bucket.push({
              file: filePath,
              line: firstNode.startPosition.row + 1,
              column: firstNode.startPosition.column + 1,
              matchedText: firstNode.text,
              nodeType: firstNode.type,
              captures: textCaptures
            });
            perQuery.set(owner, bucket);
          }
        } catch (err) {
          this.reportWasmAbort(err);
          this.dbg(`Batched query matching error: ${err}`);
        }
      },
      // #3678 F4: the scanner and the dispatch runner run different rule
      // sets under this one call site.
      `runQueriesOnFile\0${batch.key}`
    ).finally(() => this.releaseQueryBatch(batch));
    const results = [];
    for (let i = 0; i < batch.entries.length; i++) {
      for (const match of perQuery.get(i) ?? []) {
        results.push({ queryDef: batch.entries[i].queryDef, match });
      }
    }
    return results;
  }
  /**
   * Compile `queryDefs` into one multi-pattern Query for `languageId`, with a
   * pattern-index → rule map. Cached per language + rule-set identity.
   */
  async compileQueryBatch(queryDefs, languageId, retain = false) {
    const identity = crypto3.createHash("sha256").update(JSON.stringify(queryDefs)).digest("hex");
    const cacheKey = this.getQueryCacheKey(`batch:${identity}`, languageId);
    const cached = this.queryBatchCache.get(cacheKey);
    if (cached !== void 0) {
      this.queryBatchCache.delete(cacheKey);
      this.queryBatchCache.set(cacheKey, cached);
      if (retain && cached)
        this.retainQueryBatch(cached);
      return cached;
    }
    const inFlight = this.queryBatchBuilds.get(cacheKey);
    if (inFlight) {
      if (retain) {
        const decided = inFlight.lease.batch;
        if (decided === void 0)
          inFlight.lease.count++;
        else if (decided)
          this.retainQueryBatch(decided);
      }
      return inFlight.promise;
    }
    const lease = { count: retain ? 1 : 0, batch: void 0 };
    const promise = this.compileQueryBatchOnce(queryDefs, languageId, lease);
    const build = { promise, lease };
    this.queryBatchBuilds.set(cacheKey, build);
    try {
      return await promise;
    } finally {
      if (this.queryBatchBuilds.get(cacheKey) === build) {
        this.queryBatchBuilds.delete(cacheKey);
      }
    }
  }
  async compileQueryBatchOnce(queryDefs, languageId, lease) {
    const identity = crypto3.createHash("sha256").update(JSON.stringify(queryDefs)).digest("hex");
    const cacheKey = this.getQueryCacheKey(`batch:${identity}`, languageId);
    const inputKeys = [
      cacheKey,
      ...queryDefs.map((queryDef) => this.getQueryCacheKey(`raw:${queryDef.id}:${queryDef.query}`, languageId))
    ];
    const cached = this.queryBatchCache.get(cacheKey);
    if (cached !== void 0) {
      this.queryBatchCache.delete(cacheKey);
      this.queryBatchCache.set(cacheKey, cached);
      return this.takeQueryBatchLeases(lease, cached);
    }
    const healEpoch = this.queryBatchHealEpoch;
    const language = await this.loadLanguage(languageId);
    if (!language) {
      const failures = (this.queryBatchLoadFailures.get(cacheKey) ?? 0) + 1;
      if (failures >= QUERY_BATCH_MAX_LOAD_FAILURES) {
        this.dbg(`Batch: grammar for ${languageId} failed to load ${failures} times \u2014 caching miss`);
        this.queryBatchLoadFailures.delete(cacheKey);
        this.cacheQueryBatch(cacheKey, null, inputKeys);
      } else {
        this.queryBatchLoadFailures.set(cacheKey, failures);
      }
      return this.takeQueryBatchLeases(lease, null);
    }
    this.queryBatchLoadFailures.delete(cacheKey);
    let trapped = false;
    const batchInput = wasmQueryInput(cacheKey);
    const build = async () => {
      if (this.wasmInputTraps(batchInput) > 1)
        return null;
      const Query = (await loadWebTreeSitter()).Query;
      const entries = [];
      const sources = [];
      const ownerOfPattern = [];
      for (const queryDef of queryDefs) {
        let patternCount;
        const probeInput = wasmQueryInput(this.getQueryCacheKey(`raw:${queryDef.id}:${queryDef.query}`, languageId));
        if (this.wasmInputTraps(probeInput) > 1) {
          this.dbg(`Batch: skipping ${queryDef.id}, its compile trapped twice`);
          continue;
        }
        try {
          const probe = new Query(language, queryDef.query);
          patternCount = probe.patternCount();
          probe.delete?.();
          this.clearWasmInput(probeInput, true);
        } catch (err) {
          if (this.reportWasmAbort(err, probeInput))
            return null;
          if (classifyTreeSitterWasmError(err) === "trap")
            trapped = true;
          this.dbg(`Batch: skipping ${queryDef.id} for ${languageId}: ${err}`);
          this.reportQueryCompileFailure(queryDef.id, languageId, err);
          continue;
        }
        const owner = entries.length;
        entries.push({
          queryDef,
          metavars: queryDef.metavars ?? [],
          postFilter: queryDef.post_filter,
          postFilterParams: queryDef.post_filter_params
        });
        sources.push(queryDef.query);
        for (let i = 0; i < patternCount; i++)
          ownerOfPattern.push(owner);
      }
      if (entries.length === 0)
        return null;
      try {
        const query = new Query(language, sources.join("\n"));
        if (query.patternCount() !== ownerOfPattern.length) {
          this.dbg(`Batch pattern count mismatch for ${languageId} (${query.patternCount()} vs ${ownerOfPattern.length}) \u2014 falling back`);
          return null;
        }
        this.clearWasmInput(batchInput, true);
        return {
          query,
          entries,
          ownerOfPattern,
          key: cacheKey,
          users: 0,
          retired: false,
          disposed: false
        };
      } catch (err) {
        if (this.reportWasmAbort(err, batchInput))
          return null;
        if (classifyTreeSitterWasmError(err) === "trap")
          trapped = true;
        this.dbg(`Batch compile failed for ${languageId}: ${err}`);
        return null;
      }
    };
    const batch = await build();
    const published = !trapped && this.queryBatchHealEpoch === healEpoch;
    this.takeQueryBatchLeases(lease, batch);
    if (published) {
      this.cacheQueryBatch(cacheKey, batch, inputKeys);
    } else {
      this.retireQueryBatch(batch);
    }
    return batch;
  }
  /**
   * Convert pattern to tree-sitter query
   * First tries to load from query files, then falls back to inline patterns
   */
  patternToQuery(pattern, languageId) {
    const loadedQuery = this.queryLoader.findMatchingQuery(pattern, languageId);
    if (loadedQuery) {
      this.dbg(`Using loaded query: ${loadedQuery.id}`);
      return {
        query: loadedQuery.query,
        metavars: loadedQuery.metavars,
        postFilter: loadedQuery.post_filter,
        postFilterParams: loadedQuery.post_filter_params,
        queryDef: loadedQuery
      };
    }
    return this.getInlinePattern(pattern);
  }
  /**
   * Inline patterns as fallback when no query file matches
   */
  getInlinePattern(pattern) {
    if (pattern.includes("async function") && pattern.includes("$NAME")) {
      return {
        query: `(function_declaration
					"async"
					name: (identifier) @NAME
					parameters: (formal_parameters) @PARAMS
					body: (statement_block) @BODY)`,
        metavars: ["NAME", "PARAMS", "BODY"]
      };
    }
    if (pattern.includes("console")) {
      return {
        query: `(call_expression
					function: (member_expression
						object: (identifier) @OBJ (#eq? @OBJ "console")
						property: (property_identifier) @METHOD)
					arguments: (arguments) @ARGS)`,
        metavars: ["OBJ", "METHOD", "ARGS"]
      };
    }
    if (pattern.includes("function $NAME") && pattern.includes("PARAMS")) {
      return {
        query: `(function_declaration
					name: (identifier) @NAME
					parameters: (formal_parameters) @PARAMS
					body: (statement_block) @BODY)`,
        metavars: ["NAME", "PARAMS", "BODY"],
        postFilter: "count_params",
        postFilterParams: { min_params: 6 }
      };
    }
    if (pattern.includes(".then") && pattern.includes(".catch")) {
      return {
        query: `(call_expression
					function: (member_expression
						object: (call_expression
							function: (member_expression
								object: (call_expression
									function: (member_expression
										property: (property_identifier) @M1)
									arguments: (arguments))
								property: (property_identifier) @M2)
							arguments: (arguments))
						property: (property_identifier) @M3)
					arguments: (arguments))
					(#match? @M1 "^(then|catch)$")
					(#match? @M2 "^(then|catch)$")
					(#match? @M3 "^(then|catch)$")`,
        metavars: ["M1", "M2", "M3"]
      };
    }
    const simpleMatch = pattern.match(/\$([A-Z_][A-Z0-9_]*)/);
    if (simpleMatch) {
      const name = simpleMatch[1];
      return {
        query: `(identifier) @${name}`,
        metavars: [name]
      };
    }
    return { query: "", metavars: [] };
  }
  /**
   * Inject native tree-sitter predicates into S-expression query
   * This moves text filtering to WASM for better performance
   */
  /** Generate cache key for compiled query */
  getQueryCacheKey(pattern, languageId) {
    return `${languageId}:${pattern}`;
  }
  /** Compile a pattern into a tree-sitter Query with caching */
  async compileQuery(pattern, languageId) {
    const cacheKey = this.getQueryCacheKey(pattern, languageId);
    if (this.queryCache.has(cacheKey)) {
      this.dbg(`Query cache hit: ${cacheKey}`);
      const cached = this.queryCache.get(cacheKey);
      this.queryCache.delete(cacheKey);
      this.queryCache.set(cacheKey, cached);
      return cached;
    }
    const input = wasmQueryInput(cacheKey);
    if (this.wasmInputTraps(input) > 1)
      return null;
    const language = await this.loadLanguage(languageId);
    if (!language) {
      this.dbg(`Could not load language ${languageId}`);
      return null;
    }
    const { query: queryStr, metavars, postFilter, postFilterParams } = this.patternToQuery(pattern, languageId);
    this.dbg(`Query string: ${queryStr.slice(0, 100)}...`);
    try {
      const Query = (await loadWebTreeSitter()).Query;
      const query = new Query(language, queryStr);
      this.dbg(`Query compiled with ${query.patternCount()} patterns`);
      const result = { query, metavars, postFilter, postFilterParams };
      this.clearWasmInput(input);
      this.cacheQuery(cacheKey, result);
      return result;
    } catch (err) {
      this.reportWasmAbort(err, input);
      this.dbg(`Query compilation failed: ${err}`);
      return null;
    }
  }
  /** Compile a raw tree-sitter query string with caching */
  async compileRawQuery(queryId, queryStr, metavars, languageId, postFilter, postFilterParams) {
    const cacheKey = this.getQueryCacheKey(`raw:${queryId}:${queryStr}`, languageId);
    if (this.queryCache.has(cacheKey)) {
      const cached = this.queryCache.get(cacheKey);
      this.queryCache.delete(cacheKey);
      this.queryCache.set(cacheKey, cached);
      return cached;
    }
    const input = wasmQueryInput(cacheKey);
    if (this.wasmInputTraps(input) > 1)
      return null;
    const language = await this.loadLanguage(languageId);
    if (!language)
      return null;
    try {
      const Query = (await loadWebTreeSitter()).Query;
      const query = new Query(language, queryStr);
      const result = { query, metavars, postFilter, postFilterParams };
      this.clearWasmInput(input);
      this.cacheQuery(cacheKey, result);
      return result;
    } catch (err) {
      this.reportWasmAbort(err, input);
      this.dbg(`Raw query compilation failed (${queryId}): ${err}`);
      this.reportQueryCompileFailure(queryId, languageId, err);
      return null;
    }
  }
  reportedCompileFailures = /* @__PURE__ */ new Set();
  /** Warn once per rule+grammar pair whose query fails to compile — a silently-dead rule needs a trail. */
  reportQueryCompileFailure(ruleId, languageId, err) {
    const key = `${ruleId}:${languageId}`;
    if (this.reportedCompileFailures.has(key))
      return;
    this.reportedCompileFailures.add(key);
    logTreeSitterDiagnostic({
      subsystem: "tree-sitter-client",
      languageId,
      message: `tree-sitter rule '${ruleId}' failed to compile against '${languageId}' \u2014 matches for this rule are silently dropped rather than reported. Fix the query in the rule definition to re-enable it. (${err})`,
      metadata: { ruleId }
    });
  }
  hasChildToken(node, token) {
    return node.children?.some((child) => child.type === token || child.text === token);
  }
  /**
   * Collect names introduced by a parameter binding pattern.
   *
   * Binding-aware: only identifiers in a *binding* position are counted.
   * Two node shapes hold reference expressions rather than bindings and
   * must not be descended into:
   *  - `assignment_pattern` / `object_assignment_pattern` (`pattern = default`,
   *    e.g. `[a = b]` or `{a = b}`) — the `value`/`right` side is a default
   *    *expression*, not a new name (`b` in `{a = b}` is a reference).
   *  - `computed_property_name` (`[expr]:` in a destructuring pattern,
   *    e.g. `{[key]: a}`) — `expr` is a reference, not a binding.
   * Nested binding positions (destructured sub-patterns) are still walked
   * so renamed/duplicate collisions inside them are found.
   */
  bindingNames(node) {
    const names = /* @__PURE__ */ new Set();
    if (!node)
      return names;
    const stack = [node];
    while (stack.length > 0) {
      const current = stack.pop();
      if (current.type === "identifier")
        names.add(current.text);
      else if (current.type === "shorthand_property_identifier_pattern") {
        names.add(current.text);
      }
      if (current.type === "property_identifier" || current.type === "type_identifier" || current.type === "computed_property_name")
        continue;
      if (current.type === "assignment_pattern" || current.type === "object_assignment_pattern") {
        const left = current.childForFieldName?.("left");
        if (left)
          stack.push(left);
        continue;
      }
      stack.push(...current.children ?? []);
    }
    return names;
  }
  containsYieldInFunctionBody(node, root = node) {
    for (const child of node.children ?? []) {
      if (child.type === "yield")
        return true;
      if (child !== root && ["function_definition", "class_definition", "lambda"].includes(child.type)) {
        continue;
      }
      if (this.containsYieldInFunctionBody(child, root))
        return true;
    }
    return false;
  }
  /**
   * SQLAlchemy sessions are conventionally bound to one of a handful of
   * receiver names. Structural provenance (`python-provenance.ts`) proves the
   * annotated case; this name check keeps the far more common unannotated
   * `session.execute(stmt)` quiet, as it has been since the exemption was
   * added. Removing it regresses every codebase that never annotates.
   */
  isLikelySqlAlchemyReceiver(text) {
    const tail = text.split(".").pop() ?? text;
    return PYTHON_SQLALCHEMY_RECEIVER_NAMES.has(tail.toLowerCase());
  }
  /**
   * The body statements of a `switch_case`, in order. A switch_case's named
   * children are `[value, ...statements]` (its statements are direct children,
   * not a wrapping statement_block), so drop the leading `case <value>` and any
   * comments.
   */
  switchCaseBodyStatements(caseNode) {
    const named = (caseNode.children ?? []).filter((c) => c.isNamed && !c.type.includes("comment"));
    return named.slice(1);
  }
  /**
   * Whether a case body carries an intentional fallthrough marker comment
   * (`// fallthrough`, `// falls through`, …). Only a *trailing* marker is
   * honored: a comment attached to the case node after its body statements
   * (TypeScript), the case's next sibling in the switch body (JavaScript), or
   * one inside the trailing body statement's block. A comment in a nested
   * function or an earlier statement is not a marker for this case and must
   * not suppress a genuine fall-through. Only comment nodes are checked, never
   * the case value or statement text.
   */
  hasFallthroughMarker(caseNode) {
    const comments = [];
    const body = this.switchCaseBodyStatements(caseNode);
    const last = body[body.length - 1];
    const lastEnd = last?.endIndex ?? caseNode.startIndex;
    for (const c of caseNode.children ?? []) {
      if (c.type.includes("comment") && c.startIndex >= lastEnd) {
        comments.push(c);
      }
    }
    const siblings = (caseNode.parent?.children ?? []).filter((c) => c.isNamed);
    const index = siblings.findIndex((c) => c.startIndex === caseNode.startIndex);
    const next = index >= 0 ? siblings[index + 1] : void 0;
    if (next?.type.includes("comment"))
      comments.push(next);
    if (last) {
      const NESTED_FN = /* @__PURE__ */ new Set([
        "function_declaration",
        "function_expression",
        "arrow_function",
        "method_definition",
        "generator_function",
        "generator_function_declaration",
        "class_declaration"
      ]);
      const stack = [last];
      for (let visited = 0; stack.length > 0 && visited < 500; visited++) {
        const node = stack.pop();
        if (!node)
          break;
        if (node.type.includes("comment"))
          comments.push(node);
        if (!NESTED_FN.has(node.type)) {
          stack.push(...node.children ?? []);
        }
      }
    }
    return comments.some((c) => /falls?\s?through/i.test(c.text));
  }
  /**
   * Whether a statement terminates control flow (does not fall through to the
   * next statement). Handles terminators, trailing blocks, try/catch/finally,
   * and exhaustive if/else. Fail-safe: any unrecognized shape returns false
   * (falls through), so a blocking rule never under-reports. Depth-bounded so a
   * pathological nesting cannot blow the stack.
   */
  statementTerminates(node, depth = 0) {
    if (depth > 20)
      return false;
    const t = node.type;
    const TERMINATORS = /* @__PURE__ */ new Set([
      "break_statement",
      "return_statement",
      "throw_statement",
      "continue_statement"
    ]);
    if (TERMINATORS.has(t))
      return true;
    if (t === "statement_block" || t === "else_clause" || t === "catch_clause" || t === "finally_clause") {
      const inner = (node.children ?? []).filter((c) => c.isNamed && !c.type.includes("comment"));
      const last = inner[inner.length - 1];
      if (!last)
        return false;
      return this.statementTerminates(last, depth + 1);
    }
    if (t === "try_statement") {
      const tryBody = (node.children ?? []).find((c) => c.type === "statement_block");
      const tryTerminates = tryBody ? this.statementTerminates(tryBody, depth + 1) : false;
      const catches = (node.children ?? []).filter((c) => c.type === "catch_clause");
      const fin = (node.children ?? []).find((c) => c.type === "finally_clause");
      if (tryTerminates) {
        return catches.every((c) => this.statementTerminates(c, depth + 1));
      }
      return !!fin && this.statementTerminates(fin, depth + 1);
    }
    if (t === "if_statement") {
      const named = (node.children ?? []).filter((c) => c.isNamed && !c.type.includes("comment"));
      const consequence = named[1];
      const alternative = named[2];
      if (!consequence || !alternative)
        return false;
      return this.statementTerminates(consequence, depth + 1) && this.statementTerminates(alternative, depth + 1);
    }
    return false;
  }
  /**
   * Whether a `switch_case`'s next sibling is another label — `case "a": case
   * "b": handle()` groups two labels onto one body, which is idiomatic, not a
   * dead case.
   */
  nextSiblingIsSwitchLabel(caseNode) {
    const siblings = (caseNode.parent?.children ?? []).filter((c) => c.isNamed && !c.type.includes("comment"));
    const index = siblings.findIndex((c) => c.startIndex === caseNode.startIndex);
    const next = index >= 0 ? siblings[index + 1] : void 0;
    return next?.type === "switch_case" || next?.type === "switch_default";
  }
  /**
   * Whether a loop body contains a statement that can terminate the loop:
   * `return`/`throw` anywhere (they unwind past the loop), or a `break` that is
   * not swallowed by a nested loop/switch. Does not descend into nested
   * functions, whose `return` exits the function rather than the loop.
   */
  bodyHasLoopExit(node, insideNestedLoop) {
    const NESTS_BREAK = /* @__PURE__ */ new Set([
      "for_statement",
      "for_in_statement",
      "while_statement",
      "do_statement",
      "switch_statement"
    ]);
    const NESTED_FN = /* @__PURE__ */ new Set([
      "function_declaration",
      "function_expression",
      "arrow_function",
      "method_definition",
      "generator_function",
      "generator_function_declaration",
      "class_declaration"
    ]);
    for (const child of node.children ?? []) {
      const t = child.type;
      if (NESTED_FN.has(t))
        continue;
      if (t === "return_statement" || t === "throw_statement")
        return true;
      if (t === "break_statement") {
        const labeled = (child.children ?? []).some((c) => c.isNamed);
        if (!insideNestedLoop || labeled)
          return true;
      }
      if (this.bodyHasLoopExit(child, insideNestedLoop || NESTS_BREAK.has(t))) {
        return true;
      }
    }
    return false;
  }
  /**
   * Name of the binding a node's value flows into: the declared name of an
   * enclosing `variable_declarator`, or the left-hand side of an enclosing
   * `assignment_expression`. Returns "" if the node is not part of a binding
   * (the walk stops at function/block/program boundaries so it never reaches
   * out to an unrelated outer binding).
   */
  enclosingBindingName(node) {
    let cur = node?.parent;
    for (let depth = 0; cur && depth < 12; depth++) {
      const t = cur.type;
      if (t === "variable_declarator") {
        const name = cur.children?.find((c) => c.isNamed);
        return name?.text ?? "";
      }
      if (t === "assignment_expression") {
        return cur.children?.[0]?.text ?? "";
      }
      if (t === "statement_block" || t === "program" || t === "function_declaration" || t === "function_expression" || t === "arrow_function" || t === "method_definition") {
        return "";
      }
      cur = cur.parent;
    }
    return "";
  }
  /**
   * Resolves `name` (as used in the *same file*) to a provably fixed URL:
   * a `const` declarator whose initializer is a string literal, or a
   * template literal with no `${...}` substitutions.
   *
   * This is deliberately conservative — naming convention (e.g.
   * SCREAMING_SNAKE_CASE) proves nothing about provenance, so it is never
   * consulted here. Any of the following makes resolution fail (and the
   * caller must then treat the identifier as potentially tainted):
   *   - no declarator found for `name` in this file;
   *   - more than one declarator for `name` (ambiguous/shadowed — refuse
   *     rather than guess which one applies at the use site);
   *   - declared with `let`/`var` (not `const`);
   *   - the identifier is reassigned anywhere in the file
   *     (`name = ...`), even if the declaration itself is `const`-like in
   *     spirit — this also catches destructuring/compound-assignment
   *     edge cases conservatively since we only special-case a clean
   *     assignment_expression;
   *   - the initializer is not a plain string/no-substitution template
   *     literal (e.g. `process.env.X`, a function call, a member
   *     expression, another identifier).
   */
  resolvesToFileLiteralConst(name, rootNode) {
    const valueNode = this.resolveFileConstValueNode(name, rootNode);
    if (!valueNode)
      return false;
    return this.isFixedUrlLiteralExpr(valueNode);
  }
  /**
   * Resolves `name` to the initializer value node of its *single, clean*
   * file-local `const` declarator, or `null` when resolution must be refused.
   *
   * Refusal (returns `null`) on any of: no declarator; more than one
   * declarator (shadowed/ambiguous — don't guess); a `let`/`var` binding for
   * the same name anywhere; or a reassignment (`name = ...`) anywhere in the
   * file. This is the shared, provenance-safe gate used by every "provably
   * fixed value" check; callers inspect the returned value node themselves.
   */
  resolveFileConstValueNode(name, rootNode) {
    const constDeclarators = [];
    let hasNonConstBinding = false;
    let hasReassignment = false;
    const stack = [rootNode];
    while (stack.length > 0) {
      const node = stack.pop();
      if (!node)
        continue;
      if (node.type === "variable_declarator") {
        const nameNode = node.childForFieldName?.("name");
        if (nameNode?.type === "identifier" && nameNode.text === name) {
          const decl = node.parent;
          const isConst = decl?.type === "lexical_declaration" && (decl.children ?? []).some((c) => c.type === "const");
          if (isConst) {
            constDeclarators.push(node);
          } else {
            hasNonConstBinding = true;
          }
        }
      } else if (node.type === "assignment_expression" || node.type === "augmented_assignment_expression") {
        const left = node.childForFieldName?.("left");
        if (left?.type === "identifier" && left.text === name) {
          hasReassignment = true;
        } else if ((left?.type === "member_expression" || left?.type === "subscript_expression") && left.childForFieldName?.("object")?.type === "identifier" && left.childForFieldName?.("object")?.text === name) {
          const searchOnly = left.type === "member_expression" && left.childForFieldName?.("property")?.text === "search";
          if (!searchOnly) {
            hasReassignment = true;
          }
        }
      }
      for (const child of node.children ?? [])
        stack.push(child);
    }
    if (hasNonConstBinding || hasReassignment || constDeclarators.length !== 1) {
      return null;
    }
    return constDeclarators[0].childForFieldName?.("value") ?? null;
  }
  /**
   * True when `node` is a self-contained fixed URL string: a plain string
   * literal, or a template literal with no `${...}` substitutions.
   */
  isFixedUrlLiteralExpr(node) {
    if (node.type === "string")
      return true;
    if (node.type === "template_string") {
      return !(node.children ?? []).some((c) => c.type === "template_substitution");
    }
    return false;
  }
  /**
   * True when `name` is a binding introduced by an `import` in this file
   * (named/aliased/default/namespace). An import binding is immutable and its
   * value is fixed at module-load time from source — it is never request- or
   * attacker-scoped, so an imported base URL is treated as fixed. (Limitation:
   * we cannot see the exporting module, so an imported value that is itself
   * `process.env.X` in another file is not distinguished — an accepted, bounded
   * gap; direct env/param/request taint at the sink still fires.)
   */
  isImportedBinding(name, rootNode) {
    return this.importedAs(name, rootNode) !== null;
  }
  /**
   * If `name` is an import binding, returns the *imported* name (e.g. `URL`
   * for `import { URL as NodeURL }` → `importedAs("NodeURL") === "URL"`, and
   * `importedAs("URL") === "URL"`). Returns `null` when `name` is not imported.
   */
  importedAs(name, rootNode) {
    const stack = [rootNode];
    while (stack.length > 0) {
      const node = stack.pop();
      if (!node)
        continue;
      if (node.type === "import_specifier") {
        const nameNode = node.childForFieldName?.("name");
        const aliasNode = node.childForFieldName?.("alias");
        const local = (aliasNode ?? nameNode)?.text;
        if (local === name)
          return nameNode?.text ?? null;
      } else if (node.type === "namespace_import" || node.type === "import_clause") {
        for (const c of node.children ?? []) {
          if (c.type === "identifier" && c.text === name)
            return name;
        }
      }
      for (const child of node.children ?? [])
        stack.push(child);
    }
    return null;
  }
  /**
   * True when `base` (the second argument of `new URL(path, base)`) is a
   * provably fixed origin: a literal/substitution-free template, an identifier
   * resolving to a file-local literal `const` or an import binding, or a
   * template whose every `${…}` substitution is such an identifier. Anything
   * else (function params, `process.env.X`, member expressions, calls) fails.
   */
  isFixedUrlBaseExpr(base, rootNode) {
    if (base.type === "string")
      return true;
    if (base.type === "identifier") {
      return this.isFixedBaseIdentifier(base, rootNode);
    }
    if (base.type === "template_string") {
      for (const child of base.children ?? []) {
        if (child.type !== "template_substitution")
          continue;
        const inner = (child.children ?? []).find((c) => c.isNamed);
        if (!inner || inner.type !== "identifier" || !this.isFixedBaseIdentifier(inner, rootNode)) {
          return false;
        }
      }
      return true;
    }
    return false;
  }
  /**
   * True when the identifier `ident` (used as, or inside, a `new URL` base) is
   * a provably fixed origin AT ITS USE SITE. A file-local literal `const` is
   * only trusted when no nearer binding shadows it: `resolveFileConstValueNode`
   * already fails closed on any `let`/`var` of the same name and on multiple
   * `const` declarators, but function/method PARAMETERS are not variable
   * declarators and so slip past that gate — a request-tainted parameter base
   * would otherwise be exempted merely because an unrelated same-named
   * module-level `const` literal exists (#1008). So we additionally refuse the
   * file-const path when an enclosing function on the path from the use site to
   * the module root binds a parameter of the same name. Imported bindings stay
   * trusted unconditionally (imported-base-as-fixed is sound; see #1000).
   */
  isFixedBaseIdentifier(ident, rootNode) {
    const name = ident.text;
    if (!this.isShadowedByEnclosingParam(ident, name) && this.resolvesToFileLiteralConst(name, rootNode)) {
      return true;
    }
    return this.isImportedBinding(name, rootNode);
  }
  /**
   * True when some function/method/arrow on the ancestor chain of `node` (up to
   * the module root) binds a PARAMETER named `name` — i.e. `name` at `node`'s
   * location resolves to a parameter, not to an outer `const`. Only binding
   * positions are inspected (a parameter's `pattern`, including destructured
   * bindings); default-value expressions (`= expr`) are uses, not bindings, and
   * are skipped so an outer const referenced in a default is not mistaken for a
   * shadow. Fail-closed bias: unknown parameter shapes that surface a matching
   * identifier in a binding position are treated as a shadow.
   */
  isShadowedByEnclosingParam(node, name) {
    const FUNCTION_TYPES = /* @__PURE__ */ new Set([
      "function_declaration",
      "function_expression",
      "generator_function",
      "generator_function_declaration",
      "arrow_function",
      "method_definition"
    ]);
    let current = node.parent;
    while (current) {
      if (FUNCTION_TYPES.has(current.type)) {
        const bare = current.childForFieldName?.("parameter");
        if (bare?.type === "identifier" && bare.text === name)
          return true;
        const params = current.childForFieldName?.("parameters");
        if (params && this.paramsBindName(params, name))
          return true;
      }
      current = current.parent;
    }
    return false;
  }
  /** True when a `formal_parameters` node binds `name` in any binding position. */
  paramsBindName(params, name) {
    for (const param of params.children ?? []) {
      if (!param.isNamed)
        continue;
      const pattern = param.type === "required_parameter" || param.type === "optional_parameter" ? param.childForFieldName?.("pattern") : param;
      if (pattern && this.patternBindsName(pattern, name))
        return true;
    }
    return false;
  }
  /**
   * True when a binding pattern (`identifier`, or a destructuring
   * object/array/rest pattern) introduces `name`. Walks the pattern but skips
   * `assignment_pattern` default values (`= expr`), which are uses.
   */
  patternBindsName(pattern, name) {
    if (pattern.type === "identifier")
      return pattern.text === name;
    const stack = [pattern];
    while (stack.length > 0) {
      const n = stack.pop();
      if (!n)
        continue;
      if ((n.type === "identifier" || n.type === "shorthand_property_identifier_pattern") && n.text === name) {
        return true;
      }
      if (n.type === "assignment_pattern") {
        const left = n.childForFieldName?.("left") ?? n.children?.[0];
        if (left)
          stack.push(left);
        continue;
      }
      for (const c of n.children ?? [])
        stack.push(c);
    }
    return false;
  }
  /**
   * True when `name` resolves (same file) to a `const` initialized with
   * `new URL(<literalPath>, <fixedBase>)` — a fully fixed destination origin
   * and path. Query parameters added later via `url.searchParams.set(...)` do
   * not alter origin/path, so they never taint the destination. The `URL`
   * constructor may be imported under an alias (e.g. `NodeURL`).
   */
  resolvesToFixedNewUrlConst(name, rootNode) {
    const value = this.resolveFileConstValueNode(name, rootNode);
    if (!value || value.type !== "new_expression")
      return false;
    const ctor = value.childForFieldName?.("constructor");
    const ctorName = ctor?.text ?? "";
    const isUrlCtor = ctorName === "URL" || ctor?.type === "identifier" && this.importedAs(ctorName, rootNode) === "URL";
    if (!isUrlCtor)
      return false;
    const args = (value.childForFieldName?.("arguments")?.children ?? []).filter((c) => c.isNamed && c.type !== "comment");
    if (args.length === 0)
      return false;
    if (!this.isFixedUrlLiteralExpr(args[0]))
      return false;
    if (args.length === 1)
      return true;
    return this.isFixedUrlBaseExpr(args[1], rootNode);
  }
  /**
   * For a fetch URL argument of the form `u.toString()` (call_expression) or
   * `u.href` (member_expression), returns the receiver identifier name `u`
   * (only for the `toString`/`href` accessors a `URL` yields). Returns `null`
   * for any other shape so the caller falls through to taint heuristics.
   */
  newUrlBaseVarName(urlNode) {
    let member;
    if (urlNode.type === "call_expression") {
      member = urlNode.childForFieldName?.("function");
    } else if (urlNode.type === "member_expression") {
      member = urlNode;
    }
    if (!member || member.type !== "member_expression")
      return null;
    const prop = member.childForFieldName?.("property")?.text;
    if (prop !== "toString" && prop !== "href")
      return null;
    const object = member.childForFieldName?.("object");
    if (object?.type !== "identifier")
      return null;
    return object.text;
  }
  /**
   * `session.execute(select(...))` and friends pass a statement OBJECT, not a
   * SQL string: parameterized by construction, and far too noisy as blockers.
   */
  isSafeSqlAlchemyExpressionCall(node) {
    if (node.type !== "call")
      return false;
    const callee = node.children?.[0]?.text ?? "";
    const expression = node.text;
    for (const name of PYTHON_SQLALCHEMY_STATEMENT_BUILDERS) {
      if (callee === name || expression.startsWith(`${name}(`))
        return true;
    }
    return false;
  }
  /**
   * Post-filter predicate: returns true if the match should be kept, false to skip.
   * Each branch is an independent filter identified by name — flat dispatch, no nesting.
   */
  // biome-ignore lint/suspicious/noExplicitAny: postFilterParams is untyped per-filter config
  applyPostFilter(postFilter, postFilterParams, captures, rootNode) {
    function extractSlots(classNode) {
      const classText = classNode.text ?? "";
      if (!classText.includes("__slots__"))
        return null;
      const body = classNode.children?.find((c) => c.type === "block");
      if (!body)
        return null;
      const slots = [];
      for (const stmt of body.children ?? []) {
        if (stmt.type !== "expression_statement")
          continue;
        const assignment = stmt.children?.find((c) => c.type === "assignment");
        if (!assignment)
          continue;
        const lhsText = (assignment.children?.[0]?.text ?? "").trim();
        if (lhsText !== "__slots__")
          continue;
        const rhs = assignment.children?.[2];
        if (!rhs)
          continue;
        if (rhs.type === "string") {
          const s = (rhs.text ?? "").replace(/^["']|["']$/g, "");
          if (s)
            slots.push(s);
        } else if (rhs.type === "tuple" || rhs.type === "list") {
          for (const el of rhs.children ?? []) {
            if (!el.isNamed)
              continue;
            if (el.type === "string") {
              slots.push((el.text ?? "").replace(/^["']|["']$/g, ""));
            }
          }
        }
        break;
      }
      return slots;
    }
    switch (postFilter) {
      case "no_nested_anchor_chain": {
        try {
          const outer = captures.OUTER_ELEMENT;
          if (!outer) {
            this.reportPostFilterFailure(postFilter, "missing OUTER_ELEMENT capture");
            return true;
          }
          const isAnchorElement = (node) => {
            if (node.type !== "jsx_element")
              return false;
            const opening = node.childForFieldName?.("open_tag") ?? node.children?.find((child) => child.type === "jsx_opening_element");
            const name = opening?.childForFieldName?.("name") ?? opening?.children?.find((child) => child.type === "identifier");
            return name?.text === "a";
          };
          let visited = 0;
          let ancestor = outer.parent;
          while (ancestor) {
            if (++visited > NO_NESTED_ANCHOR_VISIT_CAP) {
              this.reportPostFilterFailure(postFilter, `ancestor walk exceeded ${NO_NESTED_ANCHOR_VISIT_CAP} nodes`);
              return true;
            }
            if (isAnchorElement(ancestor))
              return false;
            ancestor = ancestor.parent;
          }
          const pending = [...outer.children ?? []];
          while (pending.length > 0) {
            const node = pending.pop();
            if (!node)
              continue;
            if (++visited > NO_NESTED_ANCHOR_VISIT_CAP) {
              this.reportPostFilterFailure(postFilter, `descendant walk exceeded ${NO_NESTED_ANCHOR_VISIT_CAP} nodes`);
              return true;
            }
            if (isAnchorElement(node))
              return true;
            pending.push(...node.children ?? []);
          }
          return false;
        } catch (error) {
          const reason = error instanceof Error ? error.message : String(error);
          this.reportPostFilterFailure(postFilter, `tree walk failed${reason ? `: ${reason}` : ""}`);
          return true;
        }
      }
      case "differs_only_by_case": {
        try {
          const field = captures.FIELD?.text ?? "";
          const method = captures.METHOD?.text ?? "";
          return field !== method && field.toLocaleLowerCase() === method.toLocaleLowerCase();
        } catch {
          return true;
        }
      }
      case "in_default_package": {
        try {
          if (!rootNode)
            return true;
          return !(rootNode.children ?? []).some((node) => node.type === "package_declaration");
        } catch {
          return true;
        }
      }
      case "missing_mimetype_and_download_name": {
        try {
          const firstArg = captures.FIRST_ARG;
          if (!firstArg)
            return true;
          if (firstArg.type === "string")
            return false;
          const args = firstArg.parent;
          if (!args)
            return true;
          return !(args.children ?? []).some((node) => {
            if (node.type !== "keyword_argument")
              return false;
            const name = node.childForFieldName?.("name")?.text;
            return name === "mimetype" || name === "download_name";
          });
        } catch {
          return true;
        }
      }
      case "missing_super_call": {
        try {
          const body = captures.BODY;
          const method = captures.METHOD?.text ?? "";
          if (!body || !method)
            return true;
          const stack = [body];
          for (let visited = 0; stack.length > 0 && visited < 1e4; visited++) {
            const node = stack.pop();
            if (!node)
              break;
            if (node.type === "method_invocation" && node.childForFieldName?.("object")?.text === "super" && node.childForFieldName?.("name")?.text === method) {
              return false;
            }
            stack.push(...node.children ?? []);
          }
          return true;
        } catch {
          return true;
        }
      }
      case "no_assertion_call": {
        try {
          const body = captures.BODY;
          if (!body)
            return true;
          const assertionNames = /^(?:assert\w*|fail|verify|expect|check|assume\w*)$/i;
          const stack = [body];
          for (let visited = 0; stack.length > 0 && visited < 1e4; visited++) {
            const node = stack.pop();
            if (!node)
              break;
            if (node.type === "method_invocation") {
              const name = node.childForFieldName?.("name")?.text ?? "";
              if (assertionNames.test(name))
                return false;
            }
            stack.push(...node.children ?? []);
          }
          return true;
        } catch {
          return true;
        }
      }
      case "not_closed_or_try_with_resources": {
        try {
          const declaration = captures.DECL;
          const resource = captures.RESOURCE?.text ?? "";
          if (!declaration || !resource)
            return true;
          const scope = this.navigator.findParent(declaration, [
            "method_declaration",
            "constructor_declaration",
            "block"
          ]) ?? rootNode;
          if (!scope)
            return true;
          const resourceWord = new RegExp(`\\b${escapeRegExp(resource)}\\b`);
          const stack = [scope];
          for (let visited = 0; stack.length > 0 && visited < 1e4; visited++) {
            const node = stack.pop();
            if (!node)
              break;
            if (node.type === "method_invocation" && node.childForFieldName?.("object")?.text === resource && node.childForFieldName?.("name")?.text === "close") {
              return false;
            }
            if (node.type === "resource" && resourceWord.test(node.text ?? "")) {
              return false;
            }
            stack.push(...node.children ?? []);
          }
          return true;
        } catch {
          return true;
        }
      }
      case "same_method_no_base_case": {
        try {
          const method = captures.NAME?.text ?? "";
          if (!method || captures.RECURSE?.text !== method)
            return false;
          const call = captures.CALL;
          const declaration = call ? this.navigator.findParent(call, ["method_declaration"]) : void 0;
          if (!declaration)
            return true;
          const stack = [declaration];
          for (let visited = 0; stack.length > 0 && visited < 1e4; visited++) {
            const node = stack.pop();
            if (!node)
              break;
            if (node.type === "if_statement" || node.type === "switch_expression" || node.type === "switch_statement" || node.type === "while_statement" || node.type === "do_statement" || node.type === "for_statement" || node.type === "enhanced_for_statement" || node.type === "ternary_expression") {
              return false;
            }
            stack.push(...node.children ?? []);
          }
          return stack.length > 0 ? false : true;
        } catch {
          return true;
        }
      }
      case "memset_for_sensitive_data": {
        try {
          const destination = captures.DEST?.text ?? "";
          const value = captures.VALUE?.text?.trim() ?? "";
          if (!/^(?:0|0x0+|NULL|nullptr)$/.test(value))
            return false;
          return /(?:pass(?:word)?|passwd|secret|token|api_?key|private_?key|credential|auth|pin)/i.test(destination);
        } catch {
          return true;
        }
      }
      case "unsafe_regex_dynamic_identifier": {
        try {
          const interpolationNode = captures.INTERPOLATION;
          const interpolation = interpolationNode?.text ?? "";
          const identifier = interpolation.match(/^\$\{\s*([A-Za-z_$][\w$]*)\s*\}$/)?.[1];
          if (!identifier || !rootNode || !interpolationNode)
            return true;
          const useRow = interpolationNode.startPosition.row;
          const hasEscapeSignal = (text) => /\b(?:escape|Escape)\w*\s*\(/.test(text) || /\.\s*replace\s*\(\s*\//.test(text);
          let lastWriteRow = -1;
          let lastWriteSafe = false;
          const consider = (row, valueText) => {
            if (row >= useRow || row < lastWriteRow)
              return;
            lastWriteRow = row;
            lastWriteSafe = valueText !== void 0 && hasEscapeSignal(valueText);
          };
          const stack = [rootNode];
          while (stack.length > 0) {
            const node = stack.pop();
            if (!node)
              continue;
            if (node.type === "variable_declarator") {
              const name = node.childForFieldName?.("name");
              if (name?.text === identifier) {
                const initializer = node.childForFieldName?.("value");
                consider(node.startPosition.row, initializer?.text);
              }
            } else if (node.type === "assignment_expression") {
              const left = node.childForFieldName?.("left");
              if (left?.type === "identifier" && left.text === identifier) {
                const right = node.childForFieldName?.("right");
                consider(node.startPosition.row, right?.text);
              }
            }
            stack.push(...node.children);
          }
          return lastWriteRow >= 0 && lastWriteSafe ? false : true;
        } catch {
          return true;
        }
      }
      case "is_generator_with_valued_return": {
        const returnNode = captures.RETURN;
        const functionNode = captures.FUNCTION ?? (returnNode ? this.navigator.findParent(returnNode, ["function_definition"]) : void 0);
        if (!functionNode)
          return false;
        if (this.hasChildToken(functionNode, "async"))
          return false;
        return this.containsYieldInFunctionBody(functionNode);
      }
      case "count_params": {
        const paramsNode = captures.PARAMS;
        if (!paramsNode)
          return true;
        const paramCount = paramsNode.children.filter((c) => {
          if (c.type !== "required_parameter")
            return false;
          if (c.text.includes("="))
            return false;
          if (c.children?.some((ch) => ch.text === "?"))
            return false;
          return true;
        }).length;
        return paramCount >= (postFilterParams?.min_params ?? 6);
      }
      case "empty_body": {
        const bodyNode = captures.BODY;
        if (!bodyNode)
          return true;
        const meaningful = bodyNode.children.filter((c) => c.isNamed && c.type !== "comment" && c.type !== "line_comment" && c.type !== "block_comment");
        return meaningful.length === 0;
      }
      case "is_empty_block": {
        const caseNode = captures.CASE;
        if (!caseNode)
          return false;
        if (this.switchCaseBodyStatements(caseNode).length > 0)
          return false;
        return !this.nextSiblingIsSwitchLabel(caseNode);
      }
      case "no_break_or_return_in_body": {
        const bodyNode = captures.BODY;
        if (!bodyNode)
          return false;
        return !this.bodyHasLoopExit(bodyNode, false);
      }
      case "same_param_name": {
        const first = this.bindingNames(captures.PARAM1);
        const second = this.bindingNames(captures.NAME);
        return [...first].some((name) => second.has(name));
      }
      case "no_terminating_statement": {
        const caseNode = captures.CASE;
        if (!caseNode)
          return false;
        if (this.hasFallthroughMarker(caseNode))
          return false;
        const body = this.switchCaseBodyStatements(caseNode);
        if (body.length === 0)
          return false;
        return !this.statementTerminates(body[body.length - 1]);
      }
      case "no_break_or_return": {
        const bodyNode = captures.BODY;
        if (!bodyNode)
          return false;
        return !this.bodyHasLoopExit(bodyNode, false);
      }
      case "is_double_checked_locking": {
        const outer = captures.FIELD?.text;
        const inner = captures.FIELD2?.text;
        return !!outer && outer === inner;
      }
      case "shadows_parent_field": {
        const parentName = captures.PARENT?.text;
        const fieldName = captures.NAME?.text;
        if (!parentName || !fieldName)
          return false;
        let root = captures.NAME;
        while (root.parent)
          root = root.parent;
        const stack = [root];
        while (stack.length) {
          const node = stack.pop();
          if (node.type === "class_declaration" && node.childForFieldName?.("name")?.text === parentName) {
            const body = node.childForFieldName?.("body");
            for (const member of body?.children ?? []) {
              if (member.type !== "field_declaration")
                continue;
              for (const declarator of member.children ?? []) {
                if (declarator.type === "variable_declarator" && declarator.childForFieldName?.("name")?.text === fieldName) {
                  return true;
                }
              }
            }
          }
          for (const child of node.children ?? [])
            stack.push(child);
        }
        return false;
      }
      case "missing_break_between_cases": {
        const label = captures.LABEL;
        const group = label?.parent;
        if (!group)
          return false;
        const TERMINATORS = /* @__PURE__ */ new Set([
          "break_statement",
          "return_statement",
          "throw_statement",
          "continue_statement",
          "yield_statement"
        ]);
        for (const child of group.children ?? []) {
          if (TERMINATORS.has(child.type))
            return false;
        }
        return true;
      }
      case "scoped_lock_empty_args": {
        const decl = captures.DECL;
        if (!decl)
          return false;
        for (const sibling of decl.parent?.children ?? []) {
          if (sibling.type === "argument_list")
            return false;
        }
        return true;
      }
      case "calc_missing_spaces": {
        const text = captures.EXPR?.text ?? "";
        return /[\w%)][+-][\w.(]/.test(text);
      }
      case "bare_except_only": {
        const clauseNode = captures.CLAUSE;
        if (!clauseNode)
          return true;
        const hasExceptionSpec = clauseNode.children.some((c) => {
          if (!c.isNamed)
            return false;
          return c.type !== "block";
        });
        return !hasExceptionSpec;
      }
      case "eq_mod_fn": {
        const mod = captures.MOD?.text ?? "";
        const fn = captures.FN?.text ?? "";
        return mod === "threading" && fn === "Thread";
      }
      case "regex_first_arg_identifier": {
        const mod = captures.MOD?.text ?? "";
        if (mod !== "re")
          return false;
        const func = captures.FUNC?.text ?? "";
        if (!/^(compile|match|search|fullmatch|findall|finditer|sub|subn|split)$/.test(func)) {
          return false;
        }
        const argsNode = captures.ARGS;
        if (!argsNode)
          return false;
        const firstNamed = (argsNode.children ?? []).find((c) => c.isNamed);
        if (!firstNamed)
          return false;
        return firstNamed.type === "identifier";
      }
      case "open_mode_invalid": {
        const modeNode = captures.MODE;
        if (!modeNode)
          return false;
        const text = modeNode.text ?? "";
        const stripped = text.replace(/^["']|["']$/g, "");
        if (stripped.length === 0)
          return false;
        if (stripped.length === 1)
          return false;
        if (!/^[rwxabt+]+$/.test(stripped))
          return true;
        const validShape = /^[rwax][bt]?\+?$/;
        if (!validShape.test(stripped))
          return true;
        return false;
      }
      case "status_204_with_value_return": {
        const funcNode = captures.FUNC;
        const valNode = captures.VAL;
        if (!funcNode || !valNode)
          return false;
        if (Number(valNode.text ?? 0) !== 204)
          return false;
        const queue = [funcNode];
        while (queue.length > 0) {
          const node = queue.shift();
          if (node.type === "return_statement") {
            const hasValue = node.children.some((c) => c.isNamed && c.type !== "comment");
            if (hasValue)
              return true;
          }
          if (node.children)
            queue.push(...node.children);
        }
        return false;
      }
      case "has_mixed_async": {
        const bodyNode = captures.BODY;
        if (!bodyNode)
          return true;
        const bodyText = bodyNode.text;
        return bodyText.includes("await") && /\.\s*(then|catch)\s*\(/.test(bodyText);
      }
      case "format_arity_mismatch": {
        const formatNode = captures.FORMAT;
        const argsNode = captures.ARGS;
        if (!formatNode || !argsNode)
          return false;
        const fmtText = (formatNode.text ?? "").replace(/^["']|["']$/g, "");
        const fmt = fmtText;
        let placeholderCount = 0;
        const namedKeys = [];
        const positionalRegex = /%(?:\([^)]+\))?[#0\- +]*\d*(?:\.\d+)?[hlL]?[diouxXeEfFgGcrs%]/g;
        const positionalMatches = fmt.match(positionalRegex) ?? [];
        for (const m of positionalMatches) {
          if (m === "%%")
            continue;
          placeholderCount++;
          const namedMatch = m.match(/^%\(([^)]+)\)/);
          if (namedMatch)
            namedKeys.push(namedMatch[1]);
        }
        if (namedKeys.length > 0) {
          if (argsNode.type === "dictionary") {
            const dictKeys = [];
            for (const child of argsNode.children ?? []) {
              if (child.type === "pair" && child.children?.[0]) {
                dictKeys.push((child.children[0].text ?? "").replace(/^["']|["']$/g, ""));
              }
            }
            const missing = namedKeys.filter((k) => !dictKeys.includes(k));
            return missing.length > 0;
          }
          return true;
        }
        if (argsNode.type === "tuple") {
          const argCount = (argsNode.children ?? []).filter((c) => c.isNamed).length;
          if (argCount !== placeholderCount)
            return true;
        }
        return false;
      }
      case "aws_policy_public": {
        const policyNode = captures.POLICY;
        if (!policyNode)
          return false;
        const text = policyNode.text ?? "";
        const patterns = [
          /"Principal"\s*:\s*"\*"/,
          // direct wildcard
          /"Principal"\s*:\s*\{\s*"AWS"\s*:\s*"\*"\s*\}/,
          // AWS wildcard
          /"Effect"\s*:\s*"Allow"[\s\S]*?"Action"\s*:\s*"\*"[\s\S]*?"Resource"\s*:\s*"\*"/,
          // full admin
          /"Principal"\s*:\s*"\*"/
        ];
        return patterns.some((p) => p.test(text));
      }
      case "slots_attribute_mismatch": {
        const selfNode = captures.SELF;
        const attrNode = captures.ATTR;
        const methodNode = captures.METHOD;
        if (!selfNode || !attrNode || !methodNode)
          return false;
        if (selfNode.text !== "self")
          return false;
        const attrName = attrNode.text ?? "";
        let parent = methodNode.parent;
        while (parent && parent.type !== "class_definition") {
          parent = parent.parent;
        }
        if (!parent)
          return false;
        const slots = extractSlots(parent);
        if (slots === null || slots.length === 0)
          return false;
        return !slots.includes(attrName);
      }
      case "special_method_arity": {
        const nameNode = captures.NAME;
        const paramsNode = captures.PARAMS;
        if (!nameNode || !paramsNode)
          return false;
        const name = nameNode.text ?? "";
        const expected = {
          __del__: 0,
          __repr__: 0,
          __str__: 0,
          __hash__: 0,
          __bool__: 0,
          __len__: 0,
          __eq__: 1,
          __lt__: 1,
          __le__: 1,
          __gt__: 1,
          __ge__: 1,
          __ne__: 1
        };
        const expectedCount = expected[name];
        if (expectedCount === void 0)
          return false;
        const paramCount = (paramsNode.children ?? []).filter((c) => {
          if (c.type !== "identifier" && c.type !== "typed_parameter")
            return false;
          if (c.text.includes("="))
            return false;
          return true;
        }).length;
        return paramCount !== expectedCount + 1;
      }
      case "no_super_call": {
        const bodyNode = captures.BODY;
        if (!bodyNode)
          return true;
        return !/(?<!\/\/.*)super\s*\(/.test(bodyNode.text);
      }
      case "in_test_block": {
        const first = Object.values(captures)[0];
        return !!first && this.navigator.isInTestBlock(first);
      }
      case "not_in_test_block": {
        const first = Object.values(captures)[0];
        return !first || !this.navigator.isInTestBlock(first);
      }
      case "not_in_try_catch": {
        const first = Object.values(captures)[0];
        return !first || !this.navigator.isInTryCatch(first);
      }
      case "in_try_catch": {
        const first = Object.values(captures)[0];
        return !!first && this.navigator.isInTryCatch(first);
      }
      case "name_matches_param": {
        const nameNode = captures.NAME;
        const paramNode = captures.PARAM;
        return !!nameNode && !!paramNode && nameNode.text === paramNode.text;
      }
      case "not_in_function": {
        const first = Object.values(captures)[0];
        return !first || !this.navigator.isInside(first, [
          "function_definition",
          "function_declaration",
          "method_definition",
          "arrow_function"
        ]);
      }
      case "check_secret_pattern": {
        const varName = captures.VARNAME?.text ?? "";
        const varNameLower = varName.toLowerCase();
        if (varName === varName.toUpperCase() && /[A-Z]/.test(varName)) {
          return false;
        }
        return [
          /api[_-]?key/,
          /api[_-]?secret/,
          /password/,
          /passwd/,
          /secret/,
          /token/,
          /auth/,
          /private[_-]?key/,
          /access[_-]?token/,
          /credentials/,
          /aws[_-]?secret/,
          /github[_-]?token/,
          /client[_-]?secret/
        ].some((p) => p.test(varNameLower));
      }
      case "returns_error": {
        const first = Object.values(captures)[0];
        if (!first)
          return false;
        const funcNode = this.navigator.findParent(first, [
          "function_declaration",
          "method_declaration"
        ]);
        if (!funcNode)
          return false;
        const signature = String(funcNode.text ?? "").split("{", 1)[0]?.trim() ?? "";
        const returnPart = signature.match(/func\s*(?:\([^)]*\)\s*)?[A-Za-z_]\w*\s*\([^)]*\)\s*(.*)$/s)?.[1]?.trim() ?? "";
        return returnPart.length > 0 && /\berror\b/.test(returnPart);
      }
      case "python_empty_except": {
        const bodyNode = captures.BODY;
        if (!bodyNode)
          return true;
        return !bodyNode.children.some((c) => c.isNamed && c.type !== "pass_statement" && c.type !== "comment");
      }
      case "check_in_operator_types": {
        const target = captures.TARGET;
        if (!target)
          return false;
        return ["none", "true", "false", "integer", "float"].includes(target.type);
      }
      case "torchscript_super_call": {
        const call = captures.CALL;
        if (!call)
          return false;
        const isTorchScriptDecorated = (node) => {
          const decorated = node?.parent;
          if (!decorated || decorated.type !== "decorated_definition")
            return false;
          return (decorated.children ?? []).some((c) => c.type === "decorator" && /^@(torch\.jit\.script|jit\.script)$/.test(c.text ?? ""));
        };
        const methodNode = this.navigator.findParent(call, [
          "function_definition"
        ]);
        if (!methodNode)
          return false;
        const classNode = this.navigator.findParent(methodNode, [
          "class_definition"
        ]);
        return isTorchScriptDecorated(methodNode) || isTorchScriptDecorated(classNode);
      }
      case "exit_params_insufficient": {
        const params = captures.PARAMS;
        if (!params)
          return true;
        const named = (params.children ?? []).filter((c) => c.isNamed);
        if (named.some((c) => c.type === "list_splat_pattern" || c.type === "dictionary_splat_pattern")) {
          return false;
        }
        return named.length < 4;
      }
      case "ruby_empty_rescue": {
        const bodyNode = captures.BODY;
        if (!bodyNode)
          return true;
        return !bodyNode.children.some((c) => c.isNamed && !["comment", "nil", "nil_literal"].includes(c.type));
      }
      case "ts_command_injection_sink":
        return captures.MOD?.text === "child_process" && /^(exec|execSync)$/.test(captures.FN?.text ?? "");
      case "ts_sql_injection_sink": {
        const template = captures.TEMPLATE?.text ?? "";
        const rawPrefix = template.replace(/^`/, "").replace(/`$/, "").replace(/^(?:\s|\/\*[\s\S]*?\*\/|--[^\n]*(?:\n|$))*/, "");
        if (/^(?:SELECT[\s\S]*(?:\bFROM\b|\$\{)|INSERT\s+INTO\b|UPDATE\s+[\s\S]*\bSET\b|DELETE\s+FROM\b|CREATE\s+(?:OR\s+REPLACE\s+|TEMP(?:ORARY)?\s+|UNIQUE\s+|MATERIALIZED\s+)*(?:TABLE|INDEX|VIEW|SCHEMA|DATABASE|TRIGGER|FUNCTION|PROCEDURE|SEQUENCE|TYPE|EXTENSION)\b|DROP\s+(?:OR\s+REPLACE\s+|TEMP(?:ORARY)?\s+|UNIQUE\s+|MATERIALIZED\s+)*(?:TABLE|INDEX|VIEW|SCHEMA|DATABASE|TRIGGER|FUNCTION|PROCEDURE|SEQUENCE|TYPE|EXTENSION)\b|ALTER\s+(?:OR\s+REPLACE\s+|TEMP(?:ORARY)?\s+|UNIQUE\s+|MATERIALIZED\s+)*(?:TABLE|INDEX|VIEW|SCHEMA|DATABASE|TRIGGER|FUNCTION|PROCEDURE|SEQUENCE|TYPE|EXTENSION)\b|GRANT\b|REVOKE\b|WITH[\s\S]*\bSELECT\b|MERGE\s+INTO\b|TRUNCATE\s+TABLE\b|REPLACE\s+INTO\b)/i.test(rawPrefix))
          return true;
        if (!rootNode || !captures.OBJ)
          return false;
        let imported = TYPESCRIPT_SQL_IMPORTS.get(rootNode);
        if (!imported) {
          const names = /* @__PURE__ */ new Set();
          const stack = [rootNode];
          while (stack.length > 0) {
            const node = stack.pop();
            if (!node)
              continue;
            if (node.type === "import_statement") {
              const source = node.childForFieldName?.("source")?.text ?? "";
              const packageName = source.replace(/^['"]|['"]$/g, "");
              const isKnown = [...TYPESCRIPT_SQL_KNOWN_PACKAGES].some((pkg) => packageName === pkg || packageName.startsWith(`${pkg}/`));
              if (isKnown) {
                const importStack = [node];
                while (importStack.length > 0) {
                  const importNode = importStack.pop();
                  if (!importNode)
                    continue;
                  if (importNode.type === "identifier" || importNode.type === "import_specifier") {
                    names.add(importNode.text);
                  }
                  importStack.push(...importNode.children);
                }
              }
            }
            stack.push(...node.children);
          }
          const declarations = /* @__PURE__ */ new Map();
          const declarationStack = [rootNode];
          while (declarationStack.length > 0) {
            const node = declarationStack.pop();
            if (!node)
              continue;
            if (node.type === "variable_declarator") {
              const name = node.childForFieldName?.("name")?.text;
              const value = node.childForFieldName?.("value");
              if (name && value)
                declarations.set(name, value);
            }
            declarationStack.push(...node.children);
          }
          const resolvesKnownValue = (node, seen = /* @__PURE__ */ new Set()) => {
            if (node.type === "identifier") {
              if (names.has(node.text))
                return true;
              if (seen.has(node.text))
                return false;
              const value = declarations.get(node.text);
              if (!value)
                return false;
              seen.add(node.text);
              return resolvesKnownValue(value, seen);
            }
            if (node.type === "await_expression") {
              const value = node.children.find((child) => child.isNamed);
              return value ? resolvesKnownValue(value, seen) : false;
            }
            if (node.type === "new_expression") {
              const ctor = node.childForFieldName?.("constructor");
              return ctor ? resolvesKnownValue(ctor, seen) : false;
            }
            if (node.type === "call_expression") {
              const fn = node.childForFieldName?.("function");
              return fn ? resolvesKnownValue(fn, seen) : false;
            }
            return false;
          };
          let changed = true;
          while (changed) {
            changed = false;
            for (const [name, value] of declarations) {
              if (!names.has(name) && resolvesKnownValue(value)) {
                names.add(name);
                changed = true;
              }
            }
          }
          imported = names;
          TYPESCRIPT_SQL_IMPORTS.set(rootNode, imported);
        }
        const resolvesToKnownClient = (node) => {
          if (node.type === "identifier")
            return imported.has(node.text);
          if (node.type === "await_expression") {
            const value = node.children.find((child) => child.isNamed);
            return value ? resolvesToKnownClient(value) : false;
          }
          if (node.type === "new_expression") {
            const ctor = node.childForFieldName?.("constructor");
            return ctor ? resolvesToKnownClient(ctor) : false;
          }
          if (node.type === "call_expression") {
            const fn = node.childForFieldName?.("function");
            return fn ? resolvesToKnownClient(fn) : false;
          }
          return false;
        };
        return resolvesToKnownClient(captures.OBJ);
      }
      case "ts_ssrf_sink": {
        const fn = captures.FN?.text ?? "";
        const obj = captures.OBJ?.text ?? "";
        const urlText = captures.URL?.text ?? "";
        const allowedFns = /* @__PURE__ */ new Set([
          "fetch",
          "request",
          "get",
          "post",
          "put",
          "patch",
          "delete"
        ]);
        if (!allowedFns.has(fn))
          return false;
        if (rootNode && captures.URL?.type === "identifier" && this.resolvesToFileLiteralConst(urlText, rootNode)) {
          return false;
        }
        if (rootNode && captures.URL) {
          const urlVar = this.newUrlBaseVarName(captures.URL);
          if (urlVar && this.resolvesToFixedNewUrlConst(urlVar, rootNode)) {
            return false;
          }
        }
        const looksLikeExternalInput = urlText.includes(".") || /user|external|remote|input|target|webhook|callback|redirect|untrusted|arbitrary/i.test(urlText);
        if (!looksLikeExternalInput)
          return false;
        if (!obj)
          return fn === "fetch";
        return (/* @__PURE__ */ new Set([
          "axios",
          "http",
          "https",
          "got",
          "request",
          "superagent",
          "undici"
        ])).has(obj);
      }
      case "ts_weak_hash_algorithm":
        return captures.FN?.text === "createHash" && /^(md5|sha1)$/i.test(captures.ALG?.text ?? "");
      case "ts_insecure_random_source": {
        if (captures.OBJ?.text !== "Math" || captures.FN?.text !== "random")
          return false;
        const varName = this.enclosingBindingName(captures.CALL ?? captures.VAR);
        return /token|secret|password|key|nonce|salt|csrf|auth|session|credential|hash|otp|pin/i.test(varName);
      }
      case "ts_detached_async_call":
        return /(Async$|fetch$|request$)/.test(captures.FN?.text ?? "");
      case "incomplete_assertion": {
        const expectNode = captures.EXPECT;
        if (!expectNode)
          return false;
        const CHAI_PROPERTY_ASSERTIONS = /* @__PURE__ */ new Set([
          "true",
          "false",
          "null",
          "undefined",
          "empty",
          "NaN",
          "finite",
          "exist",
          "arguments",
          "extensible",
          "sealed",
          "frozen",
          "locked"
        ]);
        let current = expectNode.parent;
        if (!current)
          return false;
        current = current.parent;
        if (!current)
          return false;
        if (current.type === "expression_statement" || current.type === "return_statement")
          return true;
        let lastPropertyName = null;
        while (current && current.type === "member_expression") {
          const propNode = current.children?.find((c) => c.type === "property_identifier");
          if (propNode)
            lastPropertyName = propNode.text;
          const parent = current.parent;
          if (!parent)
            return false;
          if (parent.type === "expression_statement" || parent.type === "return_statement") {
            if (lastPropertyName && CHAI_PROPERTY_ASSERTIONS.has(lastPropertyName))
              return false;
            return true;
          }
          if (parent.type === "call_expression")
            return false;
          current = parent;
        }
        return false;
      }
      case "py_command_injection_sink": {
        const mod = captures.MOD?.text ?? "";
        const fn = captures.FN?.text ?? "";
        const kw = captures.KW?.text ?? "";
        return mod === "os" && /^(system|popen)$/.test(fn) || mod === "subprocess" && /^(run|Popen|call|check_output|check_call)$/.test(fn) && kw === "shell";
      }
      case "go_command_injection_sink":
        return captures.PKG?.text === "exec" && /^(Command|CommandContext)$/.test(captures.FN?.text ?? "") && /^"(sh|bash|zsh|cmd|powershell|pwsh)"$/.test(captures.SHELL?.text ?? "") && /^"(-c|\/c)"$/.test(captures.FLAG?.text ?? "");
      case "ruby_command_injection_sink":
        return /^(system|exec|spawn|popen|capture3|capture2|capture2e)$/.test(captures.FN?.text ?? "");
      case "py_ssrf_sink":
        return captures.MOD?.text === "requests" && /^(get|post|put|patch|delete|request|head|options)$/.test(captures.FN?.text ?? "");
      case "py_path_traversal_sink":
        return /^(open|read_text|read_bytes|write_text|write_bytes|remove|unlink|rmdir)$/.test(captures.FN?.text ?? "");
      case "go_path_traversal_sink":
        return /^(os|ioutil)$/.test(captures.PKG?.text ?? "") && /^(Open|OpenFile|ReadFile|WriteFile|Create|Remove|RemoveAll)$/.test(captures.FN?.text ?? "");
      case "py_sql_injection_sink": {
        const fn = captures.FN?.text ?? "";
        if (!PYTHON_SQL_SINK_METHODS.has(fn))
          return false;
        const sqlNode = captures.SQL;
        const receiver = captures.OBJ;
        if (fn === "execute" && this.isLikelySqlAlchemyReceiver(receiver?.text ?? "")) {
          return false;
        }
        if (sqlNode && this.isSafeSqlAlchemyExpressionCall(sqlNode)) {
          return false;
        }
        if (isProvenSqlAlchemySessionReceiver(receiver, rootNode)) {
          if (fn === "query" && isSqlAlchemyEntityQueryArgument(sqlNode, rootNode)) {
            return false;
          }
          if (fn === "execute" && isSqlAlchemyStatementArgument(sqlNode, rootNode)) {
            return false;
          }
        }
        if (isSafePsycopgIdentifierComposition(sqlNode, rootNode)) {
          return false;
        }
        return true;
      }
      case "go_sql_injection_sink":
        return /^(Query|QueryContext|QueryRow|QueryRowContext|Exec|ExecContext)$/.test(captures.DBFN?.text ?? "") && captures.FMTPKG?.text === "fmt" && captures.FMTFN?.text === "Sprintf";
      case "py_insecure_deserialization_sink":
        return /^(pickle|yaml)$/.test(captures.MOD?.text ?? "") && /^(load|loads|unsafe_load)$/.test(captures.FN?.text ?? "");
      case "ruby_insecure_deserialization_sink":
        return /^(Marshal|YAML|Psych)$/.test(captures.MOD?.text ?? "") && /^(load|unsafe_load)$/.test(captures.FN?.text ?? "");
      case "match_captures": {
        for (const [captureName, pattern] of Object.entries(postFilterParams ?? {})) {
          const node = captures[captureName];
          if (!node)
            return false;
          if (!new RegExp(pattern).test(node.text))
            return false;
        }
        return true;
      }
      case "case_range_single_value": {
        const start = captures.START?.text ?? "";
        const end = captures.END?.text ?? "";
        return start === end;
      }
      case "goto_jumps_backward": {
        const label = captures.LABEL;
        const gotoNode = captures.GOTO;
        if (!label || !gotoNode)
          return false;
        return label.startIndex < gotoNode.startIndex;
      }
      case "goto_targets_inner_block": {
        const target = captures.TARGET;
        if (!target)
          return false;
        let depth = 0;
        let node = target.parent;
        while (node) {
          if (node.type === "compound_statement")
            depth++;
          node = node.parent;
        }
        return depth >= 2;
      }
      case "c_memset_sensitive_arg": {
        const callNode = captures.CALL;
        if (!callNode || callNode.type !== "call_expression")
          return false;
        const argList = callNode.children?.find((c) => c.type === "argument_list");
        if (!argList)
          return false;
        const firstArg = argList.children?.find((c) => c.isNamed);
        if (!firstArg)
          return false;
        const argName = firstArg.text ?? "";
        return /password|secret|key|token|credential|auth|private|passwd|pin|salt|nonce|iv|seed/i.test(argName);
      }
      case "c_stdlib_name": {
        const name = captures.NAME?.text ?? "";
        const STDLIB_NAMES = /* @__PURE__ */ new Set([
          "malloc",
          "calloc",
          "realloc",
          "free",
          "alloca",
          "printf",
          "fprintf",
          "sprintf",
          "snprintf",
          "vprintf",
          "vfprintf",
          "vsprintf",
          "vsnprintf",
          "scanf",
          "fscanf",
          "sscanf",
          "vscanf",
          "vfscanf",
          "vsscanf",
          "strcpy",
          "strncpy",
          "strcat",
          "strncat",
          "strcmp",
          "strncmp",
          "strlen",
          "strchr",
          "strrchr",
          "strstr",
          "strerror",
          "memcpy",
          "memmove",
          "memset",
          "memcmp",
          "memchr",
          "fopen",
          "fclose",
          "fread",
          "fwrite",
          "fgets",
          "fputs",
          "getc",
          "putc",
          "getchar",
          "putchar",
          "exit",
          "abort",
          "assert",
          "errno",
          "abs",
          "labs",
          "llabs",
          "div",
          "ldiv",
          "lldiv",
          "atoi",
          "atol",
          "atoll",
          "strtol",
          "strtoll",
          "strtoul",
          "strtoull",
          "strtod",
          "strtof",
          "strtold",
          "qsort",
          "bsearch",
          "time",
          "clock",
          "difftime",
          "mktime",
          "strftime",
          "getenv",
          "setenv",
          "putenv",
          "system",
          "isalpha",
          "isdigit",
          "isalnum",
          "isspace",
          "isupper",
          "islower",
          "toupper",
          "tolower",
          "sizeof",
          "offsetof",
          "NULL",
          "EXIT_SUCCESS",
          "EXIT_FAILURE"
        ]);
        return STDLIB_NAMES.has(name);
      }
      case "c_octal_literal": {
        const num = captures.NUM?.text ?? "";
        return /^0[0-7]+$/.test(num);
      }
      case "c_noreturn_attr": {
        const attr = captures.ATTR?.text ?? "";
        return attr === "noreturn";
      }
      case "c_label_in_switch": {
        const stmt = captures.STMT;
        if (!stmt)
          return false;
        let node = stmt.parent;
        while (node) {
          if (node.type === "switch_statement")
            return true;
          node = node.parent;
        }
        return false;
      }
      default:
        this.reportMissingPostFilter(postFilter);
        return false;
    }
  }
  reportedMissingPostFilters = /* @__PURE__ */ new Set();
  reportedPostFilterFailures = /* @__PURE__ */ new Set();
  /** Keep a failed post-filter match and leave a bounded diagnostic trail. */
  reportPostFilterFailure(postFilter, reason) {
    if (this.reportedPostFilterFailures.has(postFilter))
      return;
    this.reportedPostFilterFailures.add(postFilter);
    logTreeSitterDiagnostic({
      subsystem: "tree-sitter-client",
      message: `tree-sitter rule post_filter '${postFilter}' failed \u2014 keeping the diagnostic (fail-open): ${reason}.`,
      metadata: { postFilter }
    });
  }
  /** Warn once per unimplemented post_filter — a silent rule needs a trail. */
  reportMissingPostFilter(postFilter) {
    if (this.reportedMissingPostFilters.has(postFilter))
      return;
    this.reportedMissingPostFilters.add(postFilter);
    logTreeSitterDiagnostic({
      subsystem: "tree-sitter-client",
      message: `tree-sitter rule post_filter '${postFilter}' is not implemented \u2014 matches for the rules using it are suppressed rather than reported unfiltered. Implement it in applyPostFilter (clients/tree-sitter-client.ts) to re-enable them.`,
      metadata: { postFilter }
    });
  }
  /**
   * Latch so the "textPredicates is malformed" diagnostic log line fires once
   * per `TreeSitterClient` instance for the life of the process (this client is
   * a process-wide singleton in production — see clients/tree-sitter-shared.ts),
   * not once per call. This gates ONLY the log line: process-wide log volume is
   * the concern here, not the user-facing degradation record below, which must
   * re-arm every session (see recordDegradationOnce) — including for a Query
   * object the LRU query cache (queryCache/queryBatchCache above) kept alive
   * across a session boundary, since the cache is evicted, never cleared.
   */
  textPredicatesInvalidLogged = false;
  /**
   * Typed accessor for `query.textPredicates`. If the property is missing or the
   * wrong shape — e.g. a future web-tree-sitter upgrade renames or removes it —
   * `query.textPredicates?.[i] ?? []` would silently mean "no predicates for this
   * pattern," passing every match through unfiltered. That's a silent fail-open on
   * #match?/#eq? predicates that rules rely on for correctness, and because this
   * runs for every match of every query, it would zero out ALL structural matches
   * across every language while pi-lens reports "no issues found." Fail loud (log
   * once per client instance, record a degradation so it reaches the user) and
   * closed (report the query has no usable predicates) instead of guessing.
   *
   * No WeakSet short-circuit for already-known-bad queries here (#1523 review
   * R1): `Array.isArray` is O(1), so memoizing it buys nothing, and a
   * process-lifetime WeakSet would make the SAME cached Query object (the query
   * cache is LRU-evicted, never cleared) skip straight past
   * `recordDegradationOnce` on every call after the first — which is exactly
   * what made the degradation record fail to re-arm across a session boundary
   * for a query the cache kept warm. `recordDegradationOnce` itself is called
   * unconditionally on every invalid check; the ledger's own once-per-kind/
   * subject dedupe (cleared by resetDegradationLedger, which handleSessionStart
   * calls first thing — clients/runtime-session.ts) is the single source of
   * truth for "how often does this actually get recorded."
   */
  // biome-ignore lint/suspicious/noExplicitAny: web-tree-sitter Query instances
  hasValidTextPredicates(query) {
    const valid = Array.isArray(query?.textPredicates);
    if (!valid) {
      if (!this.textPredicatesInvalidLogged) {
        this.textPredicatesInvalidLogged = true;
        logTreeSitterDiagnostic({
          subsystem: "tree-sitter-client",
          message: "web-tree-sitter Query.textPredicates is missing or not an array \u2014 #match?/#eq? predicates cannot be evaluated. Failing CLOSED: matches for this query are dropped rather than reported unfiltered.",
          metadata: { textPredicatesType: typeof query?.textPredicates }
        });
      }
      recordDegradationOnce({
        kind: "query-predicates-invalid",
        subject: "web-tree-sitter",
        reason: "Query.textPredicates is missing or not an array \u2014 #match?/#eq? predicates cannot be evaluated; structural matches relying on them are dropped fail-closed"
      });
    }
    return valid;
  }
  /**
   * Evaluate text predicates (#match?, #eq?) for a query match. web-tree-sitter
   * 0.25's `Query.matches()` DOES apply these predicates itself (probed on the
   * shipped grammars — see clients/tree-sitter-symbol-extractor.ts), so this is a
   * belt-and-braces re-filter, not a workaround for missing enforcement. It also
   * doubles as the fail-closed guard (#1523): if `query.textPredicates` is ever
   * missing or malformed, this drops the match instead of assuming it already
   * passed upstream.
   */
  // biome-ignore lint/suspicious/noExplicitAny: web-tree-sitter types
  evaluatePredicates(query, match) {
    if (!this.hasValidTextPredicates(query))
      return false;
    const predicates = query.textPredicates?.[match.patternIndex] ?? [];
    return predicates.every((fn) => fn(match.captures));
  }
  /** Search a single file using tree-sitter Query */
  async searchFileWithQuery(filePath, query, metavars, languageId, queryKey, postFilter, postFilterParams, contentOverride) {
    const matches = [];
    await this.parseFileAndUse(
      filePath,
      languageId,
      contentOverride,
      (tree) => {
        try {
          const rootNode = tree.rootNode;
          const queryMatches = query.matches(rootNode);
          for (const match of queryMatches) {
            const captures = {};
            for (const capture of match.captures) {
              if (metavars.includes(capture.name)) {
                captures[capture.name] = capture.node;
              }
            }
            if (!this.evaluatePredicates(query, match)) {
              continue;
            }
            if (postFilter && !this.applyPostFilter(postFilter, postFilterParams, captures, rootNode)) {
              continue;
            }
            if (match.captures.length > 0) {
              const firstNode = match.captures[0].node;
              const textCaptures = {};
              for (const [name, node] of Object.entries(captures)) {
                textCaptures[name] = node.text;
              }
              matches.push({
                file: filePath,
                line: firstNode.startPosition.row + 1,
                column: firstNode.startPosition.column + 1,
                matchedText: firstNode.text,
                nodeType: firstNode.type,
                captures: textCaptures
              });
            }
          }
          if (matches.length > 0) {
            this.dbg(`Found ${matches.length} matches in ${path4.basename(filePath)}`);
          }
        } catch (err) {
          this.reportWasmAbort(err);
          this.dbg(`Query matching error: ${err}`);
        }
      },
      // #3678 F4: every rule and pattern searched here is its own consumer.
      `runQueryOnFile\0${queryKey}`
    );
    return matches;
  }
  /** Collect source files for a language */
  collectFiles(dir, languageId, fileFilter) {
    const files = [];
    const extensions = this.getExtensionsForLanguage(languageId);
    const rootDir = path4.resolve(dir);
    const ignoreMatcher = getProjectIgnoreMatcher(rootDir);
    const scan = (d) => {
      if (files.length >= TREE_SITTER_MAX_SCAN_FILES)
        return;
      try {
        const entries = fs5.readdirSync(d, { withFileTypes: true });
        for (const entry of entries) {
          if (files.length >= TREE_SITTER_MAX_SCAN_FILES)
            return;
          const full = path4.join(d, entry.name);
          if (entry.isDirectory()) {
            if (isExcludedDirName(entry.name))
              continue;
            if (ignoreMatcher.isIgnored(full, true))
              continue;
            scan(full);
          } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
            if (ignoreMatcher.isIgnored(full, false))
              continue;
            if (!fileFilter || fileFilter(full)) {
              files.push(full);
            }
          }
        }
      } catch {
      }
    };
    scan(rootDir);
    return files;
  }
  /** Get file extensions for a language */
  getExtensionsForLanguage(languageId) {
    const mapping = {
      typescript: [".ts", ".mts", ".cts"],
      tsx: [".tsx"],
      javascript: [".js", ".mjs", ".cjs"],
      python: [".py"],
      rust: [".rs"],
      go: [".go"],
      java: [".java"],
      kotlin: [".kt", ".kts"],
      dart: [".dart"],
      c: [".c", ".h"],
      cpp: [".cpp", ".hpp", ".cc", ".hh"],
      elixir: [".ex", ".exs"],
      ruby: [".rb"]
    };
    return mapping[languageId] || [];
  }
};

// dist/clients/tree-sitter-shared.js
import * as path5 from "node:path";
var _shared = null;
var _wasmAborted = false;
var _wasmAbortedAt;
function getSharedTreeSitterClient() {
  if (_wasmAborted)
    return null;
  _shared ??= new TreeSitterClient(false, markTreeSitterWasmAborted);
  return _shared;
}
function isTreeSitterWasmAborted() {
  return _wasmAborted;
}
function resetTreeSitterClientLoadState() {
  _shared?.resetLoadStateForSession();
}
function getTreeSitterRuntimeStatus() {
  return {
    available: !_wasmAborted,
    wasmAborted: _wasmAborted,
    recovery: _wasmAborted ? "restart_required" : "not_required",
    ..._wasmAbortedAt ? { abortedAt: _wasmAbortedAt } : {}
  };
}
function markTreeSitterWasmAborted() {
  if (_wasmAborted)
    return;
  _wasmAborted = true;
  _wasmAbortedAt = (/* @__PURE__ */ new Date()).toISOString();
  _shared = null;
  notifyUserDegradation("pi-lens: tree-sitter WASM runtime aborted; structural analysis is disabled for this process. Restart the pi-lens extension/MCP server to recover.", "error");
  logTreeSitter({
    phase: "runtime_abort",
    filePath: process.cwd(),
    status: "degraded",
    reason: "wasm_aborted_restart_required",
    metadata: { abortedAt: _wasmAbortedAt }
  });
}
var EXT_TO_LANG = EXTENSION_TO_GRAMMAR;
function resolveTreeSitterLanguage(filePath) {
  return EXT_TO_LANG[path5.extname(filePath).toLowerCase()];
}
var COMPLEXITY_LANGUAGE_IDS = [
  "typescript",
  "tsx",
  "javascript",
  "python",
  "go",
  "rust"
];
function isComplexityLanguageId(languageId) {
  return COMPLEXITY_LANGUAGE_IDS.includes(languageId);
}
function isComplexitySupportedFile(filePath) {
  const languageId = resolveTreeSitterLanguage(filePath);
  return languageId !== void 0 && isComplexityLanguageId(languageId);
}
async function withTreeSitterRoot(filePath, content, consume, caller) {
  const languageId = resolveTreeSitterLanguage(filePath);
  const client = getSharedTreeSitterClient();
  if (!languageId || !client || !await client.init())
    return { parsed: false };
  return client.withParsedTree(filePath, languageId, content, (tree) => consume(tree.rootNode), caller);
}
function childrenOfType(node, type) {
  return (node.children ?? []).filter((c) => c && c.type === type);
}
function firstChildOfType(node, type) {
  return (node.children ?? []).find((c) => c && c.type === type);
}
function walk(node, visit) {
  visit(node);
  for (const child of node.children ?? []) {
    if (child)
      walk(child, visit);
  }
}

export {
  loadWebTreeSitter,
  logTreeSitter,
  logTreeSitterCacheStats,
  logTreeSitterDiagnostic,
  reportBundledResourceDirHealth,
  BUNDLED_QUERIES_ROOT,
  getBundledQueriesRootHealth,
  ruleSourceLanguages,
  ruleFilesForLanguage,
  computeRuleFilesFingerprint,
  queriesForLanguage,
  isDisabledQueryFilePath,
  queryLoader,
  wasmQueryInput,
  classifyTreeSitterWasmError,
  getSharedTreeSitterClient,
  isTreeSitterWasmAborted,
  resetTreeSitterClientLoadState,
  getTreeSitterRuntimeStatus,
  markTreeSitterWasmAborted,
  EXT_TO_LANG,
  resolveTreeSitterLanguage,
  isComplexityLanguageId,
  isComplexitySupportedFile,
  withTreeSitterRoot,
  childrenOfType,
  firstChildOfType,
  walk
};
