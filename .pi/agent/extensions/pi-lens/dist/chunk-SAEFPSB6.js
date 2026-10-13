import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  getWordIndexMaxFilesDerived
} from "./chunk-GAEGEPOC.js";
import {
  PathKeyedMap
} from "./chunk-Z3CCVDUB.js";
import {
  createSingleFlight
} from "./chunk-BW5KFIQC.js";
import {
  createDeadline,
  forEachCooperatively,
  yieldIfOverBudget
} from "./chunk-QYF5S6P6.js";
import {
  KIND_EXTENSIONS
} from "./chunk-PHDMFAKM.js";
import {
  isTestFileName
} from "./chunk-2BBLFX75.js";
import {
  incrementDegradationCount
} from "./chunk-JAU72XNY.js";
import {
  logLatency
} from "./chunk-QQNQ7SJW.js";
import {
  createNdjsonLogger,
  getGlobalPiLensLogDir,
  getMaxLogSizeMB,
  isTestMode
} from "./chunk-AOHZU2BM.js";
import {
  isAtOrAboveHomeDir,
  normalizeEphemeralMapKey,
  normalizeFilePath
} from "./chunk-N2H3ZPZY.js";

// dist/clients/word-index.js
import * as fs from "node:fs";
import * as path2 from "node:path";

// dist/clients/persist-debounce.js
function createDebounceScheduler(args) {
  const { write, debounceMs } = args;
  const pending = /* @__PURE__ */ new Map();
  const timers = /* @__PURE__ */ new Map();
  function flush(key) {
    const payload = pending.get(key);
    if (payload === void 0)
      return;
    pending.delete(key);
    const timer = timers.get(key);
    if (timer) {
      clearTimeout(timer);
      timers.delete(key);
    }
    write(key, payload);
  }
  function flushAll() {
    for (const key of pending.keys())
      flush(key);
  }
  function schedule(key, payload) {
    pending.set(key, payload);
    const debounce = debounceMs();
    const existing = timers.get(key);
    if (existing)
      clearTimeout(existing);
    if (debounce === 0) {
      flush(key);
      return;
    }
    const timer = setTimeout(() => flush(key), debounce);
    if (typeof timer.unref === "function")
      timer.unref();
    timers.set(key, timer);
  }
  return { schedule, flush, flushAll };
}

// dist/clients/word-index-store.js
var WORD_POSTING_ENTRY_BYTES = 8;
var WORD_POSTING_LIST_OVERHEAD_BYTES = 160;
var DEFAULT_POSTING_CAPACITY_ENTRIES = 2;
var WordPostingList = class _WordPostingList {
  /**
   * The `Int32Array` these postings live in. Either private to this list, or —
   * after {@link compactPostingsIntoArena} — a SHARED arena in which this list
   * owns the half-open lane range `[laneStart, laneStart + capacityEntries*2)`.
   * Held as an offset rather than a `subarray` view on purpose: 37,500 views
   * cost 2.5 MB of `JSTypedArray` headers on this repository's corpus, and two
   * integer fields are free by comparison.
   */
  lanes;
  laneStart = 0;
  capacityEntries;
  entryCount = 0;
  /**
   * The canonical instance of this list’s token.
   *
   * The tokenizer allocates a FRESH string for every occurrence
   * (`toLowerCase()`, `split()`), and a `Map` key is not addressable, so
   * every structure that stores a token name would otherwise hold its own
   * copy. The forward index does exactly that, once per (document, token):
   * 536,978 separate strings, measured at 17 MB on this repository’s corpus.
   * Holding the first-seen instance here gives every later writer one
   * addressable canonical string to point at, with no second interning map
   * to keep in step with the postings map.
   */
  token;
  constructor(token, capacityEntries = DEFAULT_POSTING_CAPACITY_ENTRIES) {
    this.token = token;
    this.capacityEntries = Math.max(1, capacityEntries);
    this.lanes = new Int32Array(this.capacityEntries * 2);
  }
  /** Number of postings held. */
  get length() {
    return this.entryCount;
  }
  /** This list's share of backing store, its own spare capacity included. */
  get byteLength() {
    return this.capacityEntries * WORD_POSTING_ENTRY_BYTES;
  }
  fileIdAt(entry) {
    return this.lanes[this.laneStart + entry * 2];
  }
  lineAt(entry) {
    return this.lanes[this.laneStart + entry * 2 + 1];
  }
  /**
   * Grow so at least `entries` postings fit without another reallocation. The
   * grown store is always PRIVATE: a list that outgrows its arena slice must
   * not write past it into the next token's postings.
   *
   * Returns `true` when it allocated a fresh private store, so the index can
   * keep an O(1) running tally of distinct backing stores instead of rebuilding
   * a `Set` over the whole vocabulary on every edit (#2117).
   */
  reserve(entries) {
    if (entries <= this.capacityEntries)
      return false;
    const grown = new Int32Array(entries * 2);
    grown.set(this.lanes.subarray(this.laneStart, this.laneStart + this.entryCount * 2));
    this.lanes = grown;
    this.laneStart = 0;
    this.capacityEntries = entries;
    return true;
  }
  push(fileId, line) {
    if (this.entryCount === this.capacityEntries) {
      this.reserve(Math.max(DEFAULT_POSTING_CAPACITY_ENTRIES, this.capacityEntries * 2));
    }
    const at = this.laneStart + this.entryCount * 2;
    this.lanes[at] = fileId;
    this.lanes[at + 1] = line;
    this.entryCount += 1;
  }
  /**
   * Re-home this list's lanes into `arena` at lane index `offset`, returning
   * the offset past the range it now owns. Used only by
   * {@link compactPostingsIntoArena}, which sizes the arena from the same
   * entry counts, so the range always fits.
   */
  adoptArena(arena, offset) {
    const width = this.entryCount * 2;
    for (let i = 0; i < width; i += 1) {
      arena[offset + i] = this.lanes[this.laneStart + i];
    }
    this.lanes = arena;
    this.laneStart = offset;
    this.capacityEntries = this.entryCount;
    return offset + width;
  }
  /**
   * A new list with every posting for `fileId` removed, exactly sized. Returns
   * a fresh list rather than mutating in place because the incremental refresh
   * stages removals off to the side and publishes them without an await, and
   * because an untouched token's list must keep its reference identity.
   */
  withoutFile(fileId) {
    let surviving = 0;
    for (let i = 0; i < this.entryCount; i += 1) {
      if (this.fileIdAt(i) !== fileId)
        surviving += 1;
    }
    const next = new _WordPostingList(this.token, Math.max(1, surviving));
    for (let i = 0; i < this.entryCount; i += 1) {
      if (this.fileIdAt(i) === fileId)
        continue;
      next.push(this.fileIdAt(i), this.lineAt(i));
    }
    return next;
  }
  /**
   * The backing store these lanes live in. Exposed so a memory guard can prove
   * the arena is shared rather than inferring it from a heap delta; nothing in
   * the index reads it.
   */
  get backingStore() {
    return this.lanes;
  }
  /** Build a list from flat `[fileId, line, …]` lanes, exactly sized. */
  static fromLanes(token, lanes) {
    const entries = Math.floor(lanes.length / 2);
    const list = new _WordPostingList(token, Math.max(1, entries));
    for (let i = 0; i < entries; i += 1) {
      list.push(lanes[i * 2], lanes[i * 2 + 1]);
    }
    return list;
  }
};
function compactPostingsIntoArena(postings) {
  let lanes = 0;
  for (const list of postings.values())
    lanes += list.length * 2;
  if (lanes === 0)
    return;
  const arena = new Int32Array(lanes);
  let offset = 0;
  for (const list of postings.values())
    offset = list.adoptArena(arena, offset);
}
async function compactPostingsIntoArenaCooperatively(postings, options) {
  const planned = [];
  let lanes = 0;
  for (const [token, list] of postings) {
    const width = list.length * 2;
    planned.push({ token, list, width });
    lanes += width;
  }
  if (lanes === 0)
    return;
  const arena = new Int32Array(lanes);
  let offset = 0;
  const deadline = options?.deadline ?? createDeadline(8);
  for (const plan of planned) {
    if (postings.get(plan.token) === plan.list && plan.list.length * 2 === plan.width && offset + plan.width <= arena.length) {
      offset = plan.list.adoptArena(arena, offset);
    }
    if (deadline.expired()) {
      await options?.beforeYield?.();
      await yieldIfOverBudget(deadline);
    }
  }
}
function countPostingBackingStores(postings) {
  const stores = /* @__PURE__ */ new Set();
  for (const list of postings.values())
    stores.add(list.backingStore);
  return stores.size;
}
function countPostingEntries(store) {
  let count = 0;
  for (const list of store.postings.values())
    count += list.length;
  return count;
}
function estimateWordIndexStoreBytes(store) {
  let bytes = 0;
  const backingStores = /* @__PURE__ */ new Set();
  for (const list of store.postings.values()) {
    backingStores.add(list.backingStore);
    bytes += WORD_POSTING_LIST_OVERHEAD_BYTES;
  }
  for (const backingStore of backingStores)
    bytes += backingStore.byteLength;
  for (const entry of store.forward?.values() ?? []) {
    bytes += entry.estimatedBytes;
  }
  return bytes;
}
var WordForwardEntry = class _WordForwardEntry {
  tokenNames;
  lineCounts;
  constructor(tokenNames, lineCounts) {
    this.tokenNames = tokenNames;
    this.lineCounts = lineCounts;
  }
  /** Distinct tokens recorded for this document. */
  get size() {
    return this.tokenNames.length;
  }
  /**
   * Distinct-line count for `token`, or `undefined`. Linear in the document's
   * token count: the hot paths iterate this entry, they do not probe it, so a
   * hash table would cost 40 bytes an entry to serve lookups nobody makes.
   */
  get(token) {
    const at = this.tokenNames.indexOf(token);
    return at === -1 ? void 0 : this.lineCounts[at];
  }
  keys() {
    return this.tokenNames[Symbol.iterator]();
  }
  *entries() {
    for (let i = 0; i < this.tokenNames.length; i += 1) {
      yield [this.tokenNames[i], this.lineCounts[i]];
    }
  }
  [Symbol.iterator]() {
    return this.entries();
  }
  /** Estimated resident bytes: packed lanes plus fixed headers. */
  get estimatedBytes() {
    return this.tokenNames.length * WORD_FORWARD_ENTRY_BYTES + WORD_POSTING_LIST_OVERHEAD_BYTES;
  }
  /** Pack a tokenizer tally. Insertion order is preserved. */
  static fromTally(tally) {
    const tokenNames = [];
    tokenNames.length = tally.size;
    const lineCounts = new Int32Array(tally.size);
    let i = 0;
    for (const [token, count] of tally) {
      tokenNames[i] = token;
      lineCounts[i] = count;
      i += 1;
    }
    return new _WordForwardEntry(tokenNames, lineCounts);
  }
};
var WORD_FORWARD_ENTRY_BYTES = 8;
var WordIndexFileTable = class {
  idByKey = /* @__PURE__ */ new Map();
  pathById = [];
  freeIds = [];
  /** Live file count. */
  get size() {
    return this.idByKey.size;
  }
  /** Width of the id space, live plus recycled. Bounded growth is the point. */
  get idSpaceWidth() {
    return this.pathById.length;
  }
  /**
   * Id for `key`, allocating one on first sight. First writer wins on the
   * display path, matching the interning the boxed representation had: a
   * second walk spelling of the same file reuses the first spelling's id and
   * does not re-write the stored display path.
   */
  intern(key, displayPath) {
    const existing = this.idByKey.get(key);
    if (existing !== void 0)
      return existing;
    const id = this.freeIds.pop() ?? this.pathById.length;
    this.pathById[id] = displayPath;
    this.idByKey.set(key, id);
    return id;
  }
  idFor(key) {
    return this.idByKey.get(key);
  }
  pathFor(id) {
    return this.pathById[id];
  }
  /** Drop `key` and recycle its id. Returns the freed id, or `undefined`. */
  release(key) {
    const id = this.idByKey.get(key);
    if (id === void 0)
      return void 0;
    this.idByKey.delete(key);
    this.pathById[id] = void 0;
    this.freeIds.push(id);
    return id;
  }
};

// dist/clients/word-index-logger.js
import * as path from "node:path";
var WORD_INDEX_LOG_FILE = path.join(getGlobalPiLensLogDir(), "word-index.log");
var writer = createNdjsonLogger({
  filePath: WORD_INDEX_LOG_FILE,
  maxBytes: getMaxLogSizeMB() * 1024 * 1024
});
function logWordIndex(entry) {
  if (isTestMode()) {
    return;
  }
  writer.log({
    ts: (/* @__PURE__ */ new Date()).toISOString(),
    ...entry,
    cwd: normalizeFilePath(entry.cwd)
  });
}

// dist/clients/word-index.js
var wordIndexKey = normalizeEphemeralMapKey;
var STOPWORDS = /* @__PURE__ */ new Set([
  "the",
  "and",
  "for",
  "let",
  "var",
  "const",
  "function",
  "return",
  "if",
  "else",
  "import",
  "export",
  "from",
  "class",
  "interface",
  "type",
  "enum",
  "new",
  "this",
  "self",
  "void",
  "null",
  "true",
  "false",
  "async",
  "await",
  "public",
  "private",
  "protected",
  "static",
  "def",
  "fn",
  "func",
  "struct",
  "impl",
  "pub",
  "use",
  "mod",
  "in",
  "of",
  "as",
  "is",
  "not",
  "with"
]);
var VENDOR_DIR_RE = /(^|[\\/])(?:tests?|__tests__|spec|specs|__mocks__|vendor|node_modules|examples?|fixtures?|\.git|dist|build|coverage)([\\/]|$)/i;
var DOC_FILE_RE = /\.(?:md|mdx|markdown|json|json5|jsonc|txt|rst|lock|ya?ml|toml|csv)$/i;
var TEST_VENDOR_PENALTY = 0.3;
var DOC_FILE_PENALTY = 0.5;
var BM25_K1 = 1.2;
var BM25_B = 0.75;
function isTestOrVendor(file) {
  return isTestFileName(file) || VENDOR_DIR_RE.test(file);
}
function isDocFile(file) {
  return DOC_FILE_RE.test(file);
}
function splitIdentifier(identifier) {
  const parts = /* @__PURE__ */ new Set();
  const whole = identifier.toLowerCase();
  if (whole.length >= 2 && !STOPWORDS.has(whole))
    parts.add(whole);
  for (const chunk of identifier.split(/[^A-Za-z0-9]+/)) {
    if (!chunk)
      continue;
    const spaced = chunk.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[A-Z](?=[A-Z][a-z])/g, "$& ").replace(/([A-Za-z])([0-9])/g, "$1 $2").replace(/([0-9])([A-Za-z])/g, "$1 $2");
    for (const sub of spaced.split(/\s+/)) {
      const token = sub.toLowerCase();
      if (token.length >= 2 && !STOPWORDS.has(token))
        parts.add(token);
    }
  }
  return [...parts];
}
function tokenizeLine(line) {
  const tokens = [];
  const matches = line.match(/[A-Za-z_$][A-Za-z0-9_$]*/g);
  if (!matches)
    return tokens;
  for (const match of matches) {
    for (const token of splitIdentifier(match))
      tokens.push(token);
  }
  return tokens;
}
var WORD_INDEX_BUILD_YIELD_BUDGET_MS = 8;
var WORD_INDEX_LONG_LINE_YIELD_CHARS = 4096;
function createEmptyWordIndex(truncated) {
  return {
    postings: /* @__PURE__ */ new Map(),
    fileTable: new WordIndexFileTable(),
    docLengths: new PathKeyedMap(wordIndexKey),
    totalTokens: 0,
    docCount: 0,
    truncated,
    forward: new PathKeyedMap(wordIndexKey),
    fileMtimes: new PathKeyedMap(wordIndexKey),
    fileSizes: new PathKeyedMap(wordIndexKey),
    replacementStats: { count: 0, totalMs: 0, maxMs: 0 },
    dirtyFiles: /* @__PURE__ */ new Set(),
    postingStoreCount: 0,
    recompactFlight: createSingleFlight()
  };
}
function countWordIndexPostingEntries(index) {
  return countPostingEntries(index);
}
function estimateWordIndexResidentBytes(index) {
  return estimateWordIndexStoreBytes(index);
}
function recordOrphanWordIndexFileId(fileId, token, seam) {
  incrementDegradationCount({
    kind: "word-index-orphan-file-id",
    subject: `fileId:${fileId}`,
    reason: `${seam} dropped a posting for token "${token}": the file table has no path for this id`
  });
}
function wordIndexPostingHits(index, token) {
  const list = index.postings.get(token);
  if (!list)
    return [];
  const hits = [];
  for (let i = 0; i < list.length; i += 1) {
    const fileId = list.fileIdAt(i);
    const file = index.fileTable.pathFor(fileId);
    if (file === void 0) {
      recordOrphanWordIndexFileId(fileId, token, "decode");
      continue;
    }
    hits.push({ file, line: list.lineAt(i) });
  }
  return hits;
}
function compactWordIndexPostings(index) {
  compactPostingsIntoArena(index.postings);
  index.postingStoreCount = countPostingBackingStores(index.postings);
}
function notePostingStoresAllocated(index, count) {
  index.postingStoreCount = (index.postingStoreCount ?? 0) + count;
}
var WORD_INDEX_RECOMPACT_STORE_FLOOR = 64;
var WORD_INDEX_RECOMPACT_STORE_FRACTION = 0.1;
function wordIndexRecompactThreshold(index) {
  return Math.max(WORD_INDEX_RECOMPACT_STORE_FLOOR, Math.floor(index.postings.size * WORD_INDEX_RECOMPACT_STORE_FRACTION));
}
async function recompactWordIndexPostingsIfNeeded(index, root) {
  const threshold = wordIndexRecompactThreshold(index);
  const beforeStores = countPostingBackingStores(index.postings);
  if (beforeStores <= threshold) {
    index.postingStoreCount = beforeStores;
    return;
  }
  const beforeBytes = estimateWordIndexResidentBytes(index);
  await compactPostingsIntoArenaCooperatively(index.postings);
  const afterStores = countPostingBackingStores(index.postings);
  index.postingStoreCount = afterStores;
  const afterBytes = estimateWordIndexResidentBytes(index);
  const firstForRoot = incrementDegradationCount({
    kind: "word-index-arena-recompact",
    subject: path2.resolve(root),
    reason: `arena store threshold ${threshold} exceeded`,
    metadata: { beforeBytes, afterBytes, beforeStores, afterStores }
  });
  if (firstForRoot) {
    logWordIndex({
      phase: "incremental_refresh",
      cwd: path2.resolve(root),
      trigger: "incremental_refresh",
      reason: `arena_recompact beforeBytes=${beforeBytes} afterBytes=${afterBytes} beforeStores=${beforeStores} afterStores=${afterStores}`
    });
  }
}
function enqueueWordIndexRecompact(index, root) {
  if ((index.postingStoreCount ?? 0) <= wordIndexRecompactThreshold(index)) {
    return Promise.resolve();
  }
  const flight = index.recompactFlight ??= createSingleFlight();
  return flight.run("recompact", () => enqueueAsyncWordIndexOperation(index, () => recompactWordIndexPostingsIfNeeded(index, root)));
}
function scheduleWordIndexRecompact(index, filePath) {
  void enqueueWordIndexRecompact(index, path2.dirname(filePath));
}
async function flushWordIndexRecompactionsForTests(index) {
  await (asyncWordIndexOperations.get(index) ?? Promise.resolve());
}
function recordWordIndexReplacement(index, startedAt) {
  const stats = index.replacementStats ?? { count: 0, totalMs: 0, maxMs: 0 };
  const durationMs = Math.max(0, Date.now() - startedAt);
  stats.count += 1;
  stats.totalMs += durationMs;
  stats.maxMs = Math.max(stats.maxMs, durationMs);
  index.replacementStats = stats;
}
function internWordIndexFile(index, filePath) {
  return index.fileTable.intern(wordIndexKey(filePath), filePath);
}
function appendWordIndexPostings(index, filePath, perTokenHits) {
  const fileId = internWordIndexFile(index, filePath);
  const tokenLineCounts = /* @__PURE__ */ new Map();
  for (const [token, lineNumbers] of perTokenHits) {
    let list = index.postings.get(token);
    if (list) {
      if (list.reserve(list.length + lineNumbers.length)) {
        notePostingStoresAllocated(index, 1);
      }
    } else {
      list = new WordPostingList(token, lineNumbers.length);
      index.postings.set(token, list);
      notePostingStoresAllocated(index, 1);
    }
    tokenLineCounts.set(list.token, lineNumbers.length);
    for (const line of lineNumbers)
      list.push(fileId, line);
  }
  return tokenLineCounts;
}
function commitWordIndexDocumentReplacement(index, doc, perTokenHits, docLength, startedAt) {
  const tokenLineCounts = appendWordIndexPostings(index, doc.path, perTokenHits);
  index.docLengths.set(doc.path, docLength);
  index.forward.set(doc.path, WordForwardEntry.fromTally(tokenLineCounts));
  index.fileMtimes.set(doc.path, -1);
  index.fileSizes.set(doc.path, Buffer.byteLength(doc.content, "utf-8"));
  index.dirtyFiles?.add(wordIndexKey(doc.path));
  index.totalTokens += docLength;
  index.docCount += 1;
  recordWordIndexReplacement(index, startedAt);
}
function indexWordLine(index, fileId, line, lineNumber, tokenLineCounts) {
  const lineTokens = tokenizeLine(line);
  const seenOnLine = /* @__PURE__ */ new Set();
  for (const token of lineTokens) {
    if (seenOnLine.has(token))
      continue;
    seenOnLine.add(token);
    let list = index.postings.get(token);
    if (!list) {
      list = new WordPostingList(token, 1);
      index.postings.set(token, list);
    }
    list.push(fileId, lineNumber);
    const canonical = list.token;
    tokenLineCounts.set(canonical, (tokenLineCounts.get(canonical) ?? 0) + 1);
  }
  return lineTokens.length;
}
function finishWordIndexDocument(index, doc, docLength, tokenLineCounts) {
  index.docLengths.set(doc.path, docLength);
  index.forward?.set(doc.path, WordForwardEntry.fromTally(tokenLineCounts));
  index.fileMtimes.set(doc.path, doc.mtimeMs ?? 0);
  index.fileSizes.set(doc.path, doc.size ?? Buffer.byteLength(doc.content, "utf-8"));
  index.dirtyFiles?.add(wordIndexKey(doc.path));
  index.totalTokens += docLength;
  index.docCount += 1;
}
function indexWordDocument(index, doc) {
  const fileId = internWordIndexFile(index, doc.path);
  const lines = doc.content.split(/\r?\n/);
  const tokenLineCounts = /* @__PURE__ */ new Map();
  let docLength = 0;
  for (let i = 0; i < lines.length; i += 1) {
    docLength += indexWordLine(index, fileId, lines[i], i + 1, tokenLineCounts);
  }
  finishWordIndexDocument(index, doc, docLength, tokenLineCounts);
}
function buildWordIndex(files) {
  const index = createEmptyWordIndex(files.truncated ?? false);
  for (const doc of files)
    indexWordDocument(index, doc);
  compactWordIndexPostings(index);
  return index;
}
async function buildWordIndexAsync(files, shouldContinue = () => true) {
  const index = createEmptyWordIndex(files.truncated ?? false);
  const deadline = createDeadline(WORD_INDEX_BUILD_YIELD_BUDGET_MS);
  for (const doc of files) {
    if (!shouldContinue())
      throw new Error("word index build superseded");
    const fileId = internWordIndexFile(index, doc.path);
    const lines = doc.content.split(/\r?\n/);
    const tokenLineCounts = /* @__PURE__ */ new Map();
    let docLength = 0;
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      docLength += indexWordLine(index, fileId, line, i + 1, tokenLineCounts);
      if (line.length >= WORD_INDEX_LONG_LINE_YIELD_CHARS || deadline.expired()) {
        await yieldIfOverBudget(deadline);
        if (!shouldContinue())
          throw new Error("word index build superseded");
      }
    }
    finishWordIndexDocument(index, doc, docLength, tokenLineCounts);
    if (deadline.expired() && await yieldIfOverBudget(deadline)) {
      if (!shouldContinue())
        throw new Error("word index build superseded");
    }
  }
  compactWordIndexPostings(index);
  return index;
}
function removeWordIndexDocument(index, filePath) {
  if (!index.forward)
    return false;
  const tokenLineCounts = index.forward.get(filePath);
  if (!tokenLineCounts)
    return false;
  const removedKey = wordIndexKey(filePath);
  const removedId = index.fileTable.idFor(removedKey);
  if (removedId === void 0)
    return false;
  for (const token of tokenLineCounts.keys()) {
    const list = index.postings.get(token);
    if (!list)
      continue;
    const next = list.withoutFile(removedId);
    if (next.length > 0) {
      index.postings.set(token, next);
      notePostingStoresAllocated(index, 1);
    } else
      index.postings.delete(token);
  }
  const docLength = index.docLengths.get(filePath) ?? 0;
  index.docLengths.delete(filePath);
  index.forward.delete(filePath);
  index.fileMtimes.delete(filePath);
  index.fileSizes.delete(filePath);
  index.dirtyFiles?.add(wordIndexKey(filePath));
  index.fileTable.release(removedKey);
  index.totalTokens -= docLength;
  index.docCount = Math.max(0, index.docCount - 1);
  return true;
}
function updateWordIndexDocument(index, doc) {
  if (!index.forward)
    return false;
  const startedAt = Date.now();
  if (index.forward.has(doc.path)) {
    removeWordIndexDocument(index, doc.path);
  }
  const lines = doc.content.split(/\r?\n/);
  const perTokenHits = /* @__PURE__ */ new Map();
  let docLength = 0;
  for (let i = 0; i < lines.length; i += 1) {
    const lineTokens = tokenizeLine(lines[i]);
    docLength += lineTokens.length;
    const seenOnLine = /* @__PURE__ */ new Set();
    for (const token of lineTokens) {
      if (seenOnLine.has(token))
        continue;
      seenOnLine.add(token);
      const arr = perTokenHits.get(token);
      if (arr)
        arr.push(i + 1);
      else
        perTokenHits.set(token, [i + 1]);
    }
  }
  commitWordIndexDocumentReplacement(index, doc, perTokenHits, docLength, startedAt);
  scheduleWordIndexRecompact(index, doc.path);
  return true;
}
var asyncWordIndexOperations = /* @__PURE__ */ new WeakMap();
function enqueueAsyncWordIndexOperation(index, operation) {
  const previous = asyncWordIndexOperations.get(index) ?? Promise.resolve();
  const run = previous.catch(() => void 0).then(operation);
  const settled = run.then(() => void 0, () => void 0);
  asyncWordIndexOperations.set(index, settled);
  return run.finally(() => {
    if (asyncWordIndexOperations.get(index) === settled) {
      asyncWordIndexOperations.delete(index);
    }
  });
}
async function stageWordIndexDocumentRemoval(index, filePath, shouldContinue) {
  if (!index.forward)
    return void 0;
  const tokenLineCounts = index.forward.get(filePath);
  if (!tokenLineCounts)
    return void 0;
  const removedKey = wordIndexKey(filePath);
  const removedId = index.fileTable.idFor(removedKey);
  if (removedId === void 0)
    return void 0;
  const postings = /* @__PURE__ */ new Map();
  const deadline = createDeadline(WORD_INDEX_BUILD_YIELD_BUDGET_MS);
  for (const token of tokenLineCounts.keys()) {
    if (!shouldContinue())
      throw new Error("word index refresh superseded");
    const list = index.postings.get(token);
    if (!list)
      continue;
    const survivors = list.withoutFile(removedId);
    postings.set(token, survivors.length > 0 ? survivors : void 0);
    if (deadline.expired() && await yieldIfOverBudget(deadline)) {
      if (!shouldContinue())
        throw new Error("word index refresh superseded");
    }
  }
  return { postings, docLength: index.docLengths.get(filePath) ?? 0 };
}
function commitWordIndexDocumentRemoval(index, filePath, staged) {
  for (const [token, list] of staged.postings) {
    if (list) {
      index.postings.set(token, list);
      notePostingStoresAllocated(index, 1);
    } else
      index.postings.delete(token);
  }
  index.docLengths.delete(filePath);
  index.forward?.delete(filePath);
  index.fileMtimes.delete(filePath);
  index.fileSizes.delete(filePath);
  index.dirtyFiles?.add(wordIndexKey(filePath));
  index.fileTable.release(wordIndexKey(filePath));
  index.totalTokens -= staged.docLength;
  index.docCount = Math.max(0, index.docCount - 1);
}
async function removeWordIndexDocumentAsync(index, filePath, shouldContinue = () => true) {
  return enqueueAsyncWordIndexOperation(index, async () => {
    const staged = await stageWordIndexDocumentRemoval(index, filePath, shouldContinue);
    if (!staged)
      return false;
    if (!shouldContinue())
      throw new Error("word index refresh superseded");
    commitWordIndexDocumentRemoval(index, filePath, staged);
    return true;
  });
}
async function updateWordIndexDocumentForEdit(index, doc) {
  const updated = await updateWordIndexDocumentAsync(index, doc);
  if (updated)
    scheduleWordIndexRecompact(index, doc.path);
  return updated;
}
async function updateWordIndexDocumentAsync(index, doc, shouldContinue = () => true) {
  return enqueueAsyncWordIndexOperation(index, () => updateWordIndexDocumentAsyncUnsafe(index, doc, shouldContinue));
}
async function updateWordIndexDocumentAsyncUnsafe(index, doc, shouldContinue) {
  if (!index.forward)
    return false;
  const startedAt = Date.now();
  const removal = index.forward.has(doc.path) ? await stageWordIndexDocumentRemoval(index, doc.path, shouldContinue) : void 0;
  if (index.forward.has(doc.path) && !removal)
    return false;
  const perTokenHits = /* @__PURE__ */ new Map();
  let docLength = 0;
  const lines = doc.content.split(/\r?\n/);
  await forEachCooperatively(lines, (line, i) => {
    const lineTokens = tokenizeLine(line);
    docLength += lineTokens.length;
    const seenOnLine = /* @__PURE__ */ new Set();
    for (const token of lineTokens) {
      if (seenOnLine.has(token))
        continue;
      seenOnLine.add(token);
      const arr = perTokenHits.get(token);
      if (arr)
        arr.push(i + 1);
      else
        perTokenHits.set(token, [i + 1]);
    }
  }, {
    budgetMs: WORD_INDEX_BUILD_YIELD_BUDGET_MS,
    shouldContinue,
    abortMessage: "word index refresh superseded"
  });
  if (!shouldContinue())
    throw new Error("word index refresh superseded");
  if (removal)
    commitWordIndexDocumentRemoval(index, doc.path, removal);
  commitWordIndexDocumentReplacement(index, doc, perTokenHits, docLength, startedAt);
  return true;
}
var WORD_INDEX_MAX_BYTES = 512 * 1024;
async function collectWordIndexDocs(root, shouldContinue = () => true, preflightFiles) {
  const { collectSourceFilesAsync } = await import("./chunk-4W4VLAPJ.js");
  const maxFiles = preflightFiles?.length ?? getWordIndexMaxFilesDerived(root);
  const files = preflightFiles ? preflightFiles.map((file) => file.path) : await collectSourceFilesAsync(root, {
    maxFiles,
    prioritizeCodeKinds: true
  });
  const truncated = preflightFiles?.truncated ?? files.length === maxFiles;
  const docs = Object.assign([], { truncated, skipped: 0 });
  if (!shouldContinue())
    return docs;
  const deadline = createDeadline(WORD_INDEX_BUILD_YIELD_BUDGET_MS);
  for (const file of files.slice(0, maxFiles)) {
    if (!shouldContinue())
      return docs;
    try {
      const stat = fs.statSync(file);
      if (stat.size <= WORD_INDEX_MAX_BYTES) {
        docs.push({
          path: file,
          content: fs.readFileSync(file, "utf-8"),
          mtimeMs: stat.mtimeMs,
          size: stat.size
        });
      } else {
        docs.skipped += 1;
      }
    } catch {
      docs.skipped += 1;
    }
    if (deadline.expired() && await yieldIfOverBudget(deadline)) {
      if (!shouldContinue())
        return docs;
    }
  }
  return docs;
}
var WORD_INDEX_STAT_CONCURRENCY = 8;
var WORD_INDEX_INCREMENTAL_CHURN_THRESHOLD = 0.3;
var WORD_INDEX_DENSE_REFRESH_MIN_DOCUMENTS = 32;
var WORD_INDEX_FILE_READ_TOKEN_COST = 300;
var WORD_INDEX_POSTING_SCAN_TOKEN_COST = 0.2;
async function refreshWordIndexIncrementally(index, root, shouldContinue = () => true, options = {}) {
  if (!index.forward || !index.fileMtimes || !index.fileSizes) {
    return {
      mode: "full-required",
      reason: "missing-incremental-metadata",
      timings: { sourceWalkMs: 0, statWalkMs: 0, refreshReadsMs: 0 }
    };
  }
  const { collectSourceFilesAsync } = await import("./chunk-4W4VLAPJ.js");
  const maxFiles = getWordIndexMaxFilesDerived(root);
  const sourceWalkStartMs = Date.now();
  const walked = await collectSourceFilesAsync(root, {
    maxFiles,
    prioritizeCodeKinds: true
  });
  const sourceWalkMs = Date.now() - sourceWalkStartMs;
  if (!shouldContinue())
    throw new Error("word index refresh superseded");
  const current = /* @__PURE__ */ new Map();
  const statWalkStartMs = Date.now();
  const statFile = options.statFile ?? ((file) => fs.promises.stat(file));
  const requestedConcurrency = options.statConcurrency ?? WORD_INDEX_STAT_CONCURRENCY;
  const statConcurrency = Number.isFinite(requestedConcurrency) && requestedConcurrency > 0 ? Math.max(1, Math.floor(requestedConcurrency)) : WORD_INDEX_STAT_CONCURRENCY;
  const statResults = [];
  statResults.length = walked.length;
  let cursor = 0;
  let superseded = false;
  const worker = async () => {
    while (true) {
      if (!shouldContinue()) {
        superseded = true;
        return;
      }
      const slot = cursor++;
      if (slot >= walked.length)
        return;
      const file = walked[slot];
      try {
        const stat = await statFile(file);
        if (stat.size <= WORD_INDEX_MAX_BYTES) {
          statResults[slot] = {
            path: file,
            mtimeMs: stat.mtimeMs,
            size: stat.size
          };
        }
      } catch {
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(statConcurrency, walked.length) }, () => worker()));
  if (superseded || !shouldContinue()) {
    throw new Error("word index refresh superseded");
  }
  const statWalkMs = Date.now() - statWalkStartMs;
  for (const result of statResults) {
    if (result)
      current.set(wordIndexKey(result.path), result);
  }
  const timings = { sourceWalkMs, statWalkMs, refreshReadsMs: 0 };
  const preflightFiles = Object.assign([...current.values()], {
    truncated: walked.length === maxFiles
  });
  const oldSet = new Set([...index.docLengths.keys()].map(wordIndexKey));
  let changedSet = 0;
  for (const key of oldSet)
    if (!current.has(key))
      changedSet++;
  for (const key of current.keys())
    if (!oldSet.has(key))
      changedSet++;
  const denominator = Math.max(oldSet.size, current.size, 1);
  if (changedSet / denominator > WORD_INDEX_INCREMENTAL_CHURN_THRESHOLD) {
    return {
      mode: "full-required",
      reason: "file-set-churn",
      preflightFiles,
      timings
    };
  }
  let staleDocuments = 0;
  for (const { path: file, mtimeMs, size } of current.values()) {
    if (index.fileMtimes.get(file) !== mtimeMs || (index.fileSizes.get(file) ?? -1) !== size) {
      staleDocuments += 1;
    }
  }
  let postingEntries = 0;
  let weightedPostingEntries = 0;
  for (const list of index.postings.values()) {
    postingEntries += list.length;
    weightedPostingEntries += list.length * list.length;
  }
  const expectedPostingLength = postingEntries > 0 ? weightedPostingEntries / postingEntries : 0;
  let distinctTokenEntries = 0;
  for (const tokenLineCounts of index.forward.values()) {
    distinctTokenEntries += tokenLineCounts.size;
  }
  const expectedDocumentTokens = index.docCount > 0 ? distinctTokenEntries / index.docCount : 0;
  const estimatedIncrementalWork = staleDocuments * (expectedDocumentTokens * expectedPostingLength * WORD_INDEX_POSTING_SCAN_TOKEN_COST + WORD_INDEX_FILE_READ_TOKEN_COST);
  const estimatedFullRebuildWork = index.totalTokens + current.size * WORD_INDEX_FILE_READ_TOKEN_COST;
  if (staleDocuments >= WORD_INDEX_DENSE_REFRESH_MIN_DOCUMENTS && staleDocuments / Math.max(current.size, 1) > WORD_INDEX_INCREMENTAL_CHURN_THRESHOLD || estimatedIncrementalWork > estimatedFullRebuildWork) {
    return {
      mode: "full-required",
      reason: "stale-document-churn",
      preflightFiles,
      timings
    };
  }
  const deadline = createDeadline(WORD_INDEX_BUILD_YIELD_BUDGET_MS);
  let dropped = 0;
  for (const key of oldSet) {
    if (!current.has(key)) {
      if (!await removeWordIndexDocumentAsync(index, key, shouldContinue)) {
        throw new Error(`failed to drop word-index document: ${key}`);
      }
      dropped++;
    }
  }
  let refreshed = 0;
  let skipped = 0;
  const refreshReadsStartMs = Date.now();
  for (const { path: file, mtimeMs, size } of current.values()) {
    if (index.fileMtimes.get(file) !== mtimeMs || (index.fileSizes.get(file) ?? -1) !== size) {
      let content;
      try {
        content = fs.readFileSync(file, "utf-8");
      } catch {
        skipped++;
        continue;
      }
      if (!await updateWordIndexDocumentAsync(index, { path: file, content }, shouldContinue)) {
        throw new Error(`failed to refresh word-index document: ${file}`);
      }
      index.fileMtimes.set(file, mtimeMs);
      index.fileSizes.set(file, size);
      refreshed++;
    }
    if (deadline.expired() && await yieldIfOverBudget(deadline)) {
      if (!shouldContinue())
        throw new Error("word index refresh superseded");
    }
  }
  timings.refreshReadsMs = Date.now() - refreshReadsStartMs;
  await enqueueWordIndexRecompact(index, root);
  index.truncated = walked.length === maxFiles;
  return {
    mode: "incremental",
    refreshed,
    dropped,
    skipped,
    reused: current.size - refreshed - skipped,
    timings
  };
}
var WORD_INDEX_QUERY_FILTER_KEYS = [
  "lang",
  "file",
  "ext"
];
var WordIndexQueryError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "WordIndexQueryError";
  }
};
var WORD_INDEX_FILTER_TOKEN_RE = /^(-)?([A-Za-z][A-Za-z0-9_-]*):(.+)$/;
function parseWordIndexQuery(query) {
  const filters = [];
  const termParts = [];
  for (const raw of query.split(/\s+/)) {
    if (!raw)
      continue;
    const match = raw.match(WORD_INDEX_FILTER_TOKEN_RE);
    if (!match) {
      termParts.push(raw);
      continue;
    }
    const [, negation, keyRaw, value] = match;
    const key = keyRaw.toLowerCase();
    if (!value) {
      termParts.push(raw);
      continue;
    }
    if (!WORD_INDEX_QUERY_FILTER_KEYS.includes(key)) {
      termParts.push(raw);
      continue;
    }
    filters.push({
      key,
      value,
      negated: negation === "-"
    });
  }
  return { terms: termParts.join(" "), filters };
}
function resolveLangExtensions(value) {
  const kind = value.toLowerCase();
  const extensions = KIND_EXTENSIONS[kind];
  if (!extensions) {
    const known = Object.keys(KIND_EXTENSIONS).sort((a, b) => a < b ? -1 : a > b ? 1 : 0).join(", ");
    throw new WordIndexQueryError(`Unknown lang: "${value}" in word-index query \u2014 supported languages: ${known}.`);
  }
  return extensions;
}
function normalizeExtFilterValue(value) {
  return `.${value.replace(/^\.+/, "").toLowerCase()}`;
}
function resolveWordIndexFilter(filter) {
  if (filter.key === "lang") {
    const extensions = resolveLangExtensions(filter.value);
    return {
      key: filter.key,
      negated: filter.negated,
      test: (file) => extensions.includes(path2.extname(file).toLowerCase())
    };
  }
  if (filter.key === "ext") {
    const normalized = normalizeExtFilterValue(filter.value);
    return {
      key: filter.key,
      negated: filter.negated,
      test: (file) => path2.extname(file).toLowerCase() === normalized
    };
  }
  const needle = wordIndexKey(filter.value);
  return {
    key: filter.key,
    negated: filter.negated,
    test: (_file, displayPath) => displayPath.includes(needle)
  };
}
function buildWordIndexQueryFilter(filters) {
  if (filters.length === 0)
    return void 0;
  const resolved = filters.map(resolveWordIndexFilter);
  const positivesByKey = /* @__PURE__ */ new Map();
  const negatives = [];
  for (const r of resolved) {
    if (r.negated) {
      negatives.push(r);
      continue;
    }
    const group = positivesByKey.get(r.key) ?? [];
    group.push(r);
    positivesByKey.set(r.key, group);
  }
  return (file) => {
    const displayPath = wordIndexKey(file);
    for (const negative of negatives) {
      if (negative.test(file, displayPath))
        return false;
    }
    for (const group of positivesByKey.values()) {
      if (!group.some((r) => r.test(file, displayPath)))
        return false;
    }
    return true;
  };
}
function combineFileFilters(a, b) {
  if (!a)
    return b;
  if (!b)
    return a;
  return (file) => a(file) && b(file);
}
function searchWordIndex(index, query, options = {}) {
  const { demoteTestVendor = true, demoteDocs = true, centrality, limit = 20, fileFilter } = options;
  const parsedQuery = parseWordIndexQuery(query);
  const queryFilter = buildWordIndexQueryFilter(parsedQuery.filters);
  const combinedFilter = combineFileFilters(fileFilter, queryFilter);
  const queryTokens = [...new Set(tokenizeLine(parsedQuery.terms))];
  if (queryTokens.length === 0)
    return [];
  const docCount = index.docCount || 1;
  const avgDocLength = index.totalTokens / docCount || 1;
  const scores = /* @__PURE__ */ new Map();
  for (const token of queryTokens) {
    const posting = index.postings.get(token);
    if (!posting)
      continue;
    const linesByFileId = /* @__PURE__ */ new Map();
    for (let i = 0; i < posting.length; i += 1) {
      const fileId = posting.fileIdAt(i);
      const arr = linesByFileId.get(fileId);
      if (arr)
        arr.push(posting.lineAt(i));
      else
        linesByFileId.set(fileId, [posting.lineAt(i)]);
    }
    const docFrequency = linesByFileId.size;
    const idf = Math.log(1 + (docCount - docFrequency + 0.5) / (docFrequency + 0.5));
    for (const [fileId, lines] of linesByFileId) {
      const file = index.fileTable.pathFor(fileId);
      if (file === void 0) {
        recordOrphanWordIndexFileId(fileId, token, "search");
        continue;
      }
      if (combinedFilter && !combinedFilter(file))
        continue;
      const termFrequency = lines.length;
      const docLength = index.docLengths.get(file) ?? avgDocLength;
      const denominator = termFrequency + BM25_K1 * (1 - BM25_B + BM25_B * (docLength / avgDocLength));
      const termScore = idf * (termFrequency * (BM25_K1 + 1) / denominator);
      const entry = scores.get(file) ?? {
        score: 0,
        hits: 0,
        lines: /* @__PURE__ */ new Set()
      };
      entry.score += termScore;
      entry.hits += termFrequency;
      for (const line of lines)
        entry.lines.add(line);
      scores.set(file, entry);
    }
  }
  const results = [];
  for (const [file, entry] of scores) {
    let score = entry.score;
    if (demoteTestVendor && isTestOrVendor(file))
      score *= TEST_VENDOR_PENALTY;
    if (demoteDocs && isDocFile(file))
      score *= DOC_FILE_PENALTY;
    const connections = centrality?.get(file);
    if (connections && connections > 0) {
      score *= 1 + Math.log(1 + connections) / 4;
    }
    results.push({
      file,
      score,
      hits: entry.hits,
      lines: [...entry.lines].sort((a, b) => a - b)
    });
  }
  results.sort((a, b) => b.score - a.score || a.file.localeCompare(b.file));
  return results.slice(0, Math.max(0, limit));
}
function centralityFromReverseDeps(index, reverseDeps, normalizeKey = (file) => file) {
  const centrality = /* @__PURE__ */ new Map();
  if (!reverseDeps)
    return centrality;
  for (const file of index.docLengths.keys()) {
    const importers = reverseDeps[normalizeKey(file)];
    if (importers && importers.length > 0) {
      centrality.set(file, importers.length);
    }
  }
  return centrality;
}
var WORD_INDEX_FORMAT_VERSION = 2;
var WORD_INDEX_INT32_MAX = 2147483647;
var WORD_INDEX_PACKED_FILE_ID_MAX = 4194303;
function isCanonicalWordIndexNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && Number.isSafeInteger(value) && !Object.is(value, -0);
}
function isCanonicalWordIndexToken(token) {
  return typeof token === "string" && token.length >= 2 && token === token.toLowerCase() && /^[a-z0-9_$]+$/.test(token) && !STOPWORDS.has(token);
}
var serializedWordIndexCaches = /* @__PURE__ */ new WeakMap();
var serializedWordIndexSources = /* @__PURE__ */ new WeakMap();
function getWordIndexWireBytes(index) {
  return serializedWordIndexCaches.get(index)?.wireBytes ?? null;
}
function recordPersistedWordIndexWireBytes(serialized, wireBytes) {
  if (!serialized || wireBytes === void 0)
    return;
  const index = serializedWordIndexSources.get(serialized);
  const cache = index && serializedWordIndexCaches.get(index);
  if (cache?.serialized === serialized)
    cache.wireBytes = wireBytes;
}
var DEFAULT_WORD_INDEX_MEMO_BACKSTOP_MS = 10 * 6e4;
var MAX_TIMER_DELAY_MS = 2147483647;
function wordIndexMemoBackstopMs() {
  const raw = Number(process.env.PI_LENS_WORD_INDEX_MEMO_BACKSTOP_MS);
  return Number.isFinite(raw) && raw > 0 ? Math.min(raw, MAX_TIMER_DELAY_MS) : DEFAULT_WORD_INDEX_MEMO_BACKSTOP_MS;
}
function retainSerializedWordIndex(index, entry) {
  const prior = serializedWordIndexCaches.get(index);
  if (prior)
    clearTimeout(prior.backstopTimer);
  serializedWordIndexCaches.set(index, entry);
  const ref = new WeakRef(index);
  const timer = setTimeout(() => {
    const target = ref.deref();
    if (target)
      releaseWordIndexMemo(target, "backstop");
  }, wordIndexMemoBackstopMs());
  timer.unref?.();
  entry.backstopTimer = timer;
}
function releaseWordIndexMemo(index, trigger) {
  const memo = serializedWordIndexCaches.get(index);
  if (!memo)
    return;
  clearTimeout(memo.backstopTimer);
  serializedWordIndexCaches.delete(index);
  logLatency({
    type: "phase",
    phase: "word_index_memo_released",
    filePath: "<pi-lens>",
    durationMs: 0,
    metadata: { trigger, files: memo.serialized.files.length }
  });
}
function releaseWordIndexMemoAtSettle(index) {
  releaseWordIndexMemo(index, "settle");
  index.releaseMemoAfterPersist = true;
}
var _lastSerializeWork;
function getLastWordIndexSerializeWork() {
  return _lastSerializeWork;
}
function serializeWordIndexFull(index) {
  const files = [...index.docLengths.keys()];
  const slotByFileId = /* @__PURE__ */ new Map();
  files.forEach((file, i) => {
    const fileId = index.fileTable.idFor(wordIndexKey(file));
    if (fileId !== void 0)
      slotByFileId.set(fileId, i);
  });
  const postings = [];
  for (const [token, list] of index.postings) {
    const flat = [];
    for (let i = 0; i < list.length; i += 1) {
      const slot = slotByFileId.get(list.fileIdAt(i));
      if (slot === void 0)
        continue;
      flat.push(slot, list.lineAt(i));
    }
    if (flat.length > 0)
      postings.push([token, flat]);
  }
  const forward = index.forward ? files.map((file, i) => [
    i,
    [...index.forward.get(file)?.entries() ?? []]
  ]) : void 0;
  const serialized = {
    version: WORD_INDEX_FORMAT_VERSION,
    files,
    postings,
    docLengths: files.map((file) => index.docLengths.get(file) ?? 0),
    totalTokens: index.totalTokens,
    indexedFileCount: index.docCount,
    truncated: index.truncated,
    fileMtimes: files.map((file) => index.fileMtimes.get(file) ?? 0),
    fileSizes: files.map((file) => index.fileSizes.get(file) ?? 0),
    forward
  };
  const tokensByFile = /* @__PURE__ */ new Map();
  if (index.forward) {
    for (const file of files) {
      tokensByFile.set(wordIndexKey(file), new Set(index.forward.get(file)?.keys() ?? []));
    }
  }
  _lastSerializeWork = {
    affectedTokenCount: postings.length,
    tookFullPath: true
  };
  return {
    serialized,
    slotByFileId,
    tokensByFile,
    wireBytes: null
  };
}
function serializeWordIndexIncrementally(index, cache) {
  const files = [...index.docLengths.keys()];
  const priorFiles = cache.serialized.files;
  const currentKeys = new Set(files.map(wordIndexKey));
  const priorKeys = new Set(priorFiles.map(wordIndexKey));
  if ([...priorKeys].some((key) => !currentKeys.has(key))) {
    return serializeWordIndexFull(index);
  }
  const dirty = index.dirtyFiles;
  if (dirty && dirty.size * 2 > files.length) {
    return serializeWordIndexFull(index);
  }
  const filesInWireOrder = [
    ...priorFiles,
    ...files.filter((file) => !priorKeys.has(wordIndexKey(file)))
  ];
  if (!dirty || dirty.size === 0) {
    _lastSerializeWork = { affectedTokenCount: 0, tookFullPath: false };
    return cache;
  }
  const slotByFileId = new Map(cache.slotByFileId);
  for (let i = priorFiles.length; i < filesInWireOrder.length; i += 1) {
    const fileId = index.fileTable.idFor(wordIndexKey(filesInWireOrder[i]));
    if (fileId !== void 0)
      slotByFileId.set(fileId, i);
  }
  const postings = cache.serialized.postings.slice();
  const postingAt = /* @__PURE__ */ new Map();
  postings.forEach(([token], i) => postingAt.set(token, i));
  const removedTokens = /* @__PURE__ */ new Set();
  const tokensByFile = new Map(cache.tokensByFile);
  const fileByKey = new Map(filesInWireOrder.map((file) => [wordIndexKey(file), file]));
  const affectedTokens = /* @__PURE__ */ new Set();
  for (const fileKey of dirty) {
    const file = fileByKey.get(fileKey);
    const oldTokens = tokensByFile.get(fileKey) ?? /* @__PURE__ */ new Set();
    const currentEntry = file === void 0 ? void 0 : index.forward?.get(file);
    const currentTokens = new Set(currentEntry?.keys() ?? []);
    for (const token of oldTokens)
      affectedTokens.add(token);
    for (const token of currentTokens)
      affectedTokens.add(token);
    if (file === void 0)
      tokensByFile.delete(fileKey);
    else
      tokensByFile.set(fileKey, currentTokens);
  }
  for (const token of affectedTokens) {
    const list = index.postings.get(token);
    const flat = [];
    if (list) {
      for (let i = 0; i < list.length; i += 1) {
        const slot = slotByFileId.get(list.fileIdAt(i));
        if (slot !== void 0)
          flat.push(slot, list.lineAt(i));
      }
    }
    const at = postingAt.get(token);
    if (flat.length === 0) {
      if (at !== void 0)
        removedTokens.add(token);
    } else if (at === void 0) {
      postings.push([token, flat]);
      postingAt.set(token, postings.length - 1);
    } else {
      postings[at] = [postings[at][0], flat];
    }
  }
  const compactedPostings = removedTokens.size ? postings.filter(([token]) => !removedTokens.has(token)) : postings;
  const forward = index.forward ? cache.serialized.forward?.slice().map((entry) => [entry[0], entry[1]]) ?? [] : void 0;
  for (const fileKey of dirty) {
    const file = fileByKey.get(fileKey);
    const fileId = file === void 0 ? void 0 : index.fileTable.idFor(wordIndexKey(file));
    const slot = fileId === void 0 ? void 0 : slotByFileId.get(fileId);
    if (slot === void 0 || !forward || file === void 0)
      continue;
    forward[slot] = [slot, [...index.forward?.get(file)?.entries() ?? []]];
  }
  const serialized = {
    ...cache.serialized,
    files: filesInWireOrder,
    postings: compactedPostings,
    docLengths: filesInWireOrder.map((file) => index.docLengths.get(file) ?? 0),
    fileMtimes: filesInWireOrder.map((file) => index.fileMtimes.get(file) ?? 0),
    fileSizes: filesInWireOrder.map((file) => index.fileSizes.get(file) ?? 0),
    forward,
    totalTokens: index.totalTokens,
    indexedFileCount: index.docCount,
    truncated: index.truncated
  };
  _lastSerializeWork = {
    affectedTokenCount: affectedTokens.size,
    tookFullPath: false
  };
  return {
    serialized,
    slotByFileId,
    tokensByFile,
    wireBytes: null
  };
}
function serializeWordIndex(index) {
  const prior = serializedWordIndexCaches.get(index);
  const cache = prior ? serializeWordIndexIncrementally(index, prior) : serializeWordIndexFull(index);
  retainSerializedWordIndex(index, cache);
  serializedWordIndexSources.set(cache.serialized, index);
  index.dirtyFiles?.clear();
  return cache.serialized;
}
function deserializeWordIndex(data) {
  if (!data || data.version !== WORD_INDEX_FORMAT_VERSION || !Array.isArray(data.files) || !Array.isArray(data.postings) || !Array.isArray(data.docLengths) || !Array.isArray(data.fileMtimes)) {
    return null;
  }
  let canonical = data.docLengths.length === data.files.length && data.fileMtimes.length === data.files.length;
  let needsDeepSanitize = !Array.isArray(data.forward);
  if (needsDeepSanitize)
    canonical = false;
  const fileKeys = /* @__PURE__ */ new Set();
  for (const file of data.files) {
    if (typeof file !== "string")
      return null;
    const key = wordIndexKey(file);
    if (fileKeys.has(key)) {
      canonical = false;
      needsDeepSanitize = true;
    }
    fileKeys.add(key);
  }
  const docLengths = new PathKeyedMap(wordIndexKey);
  const fileTable = new WordIndexFileTable();
  const fileIdBySlot = data.files.map((file) => fileTable.intern(wordIndexKey(file), file));
  const slotByFileId = /* @__PURE__ */ new Map();
  fileIdBySlot.forEach((fileId, slot) => {
    if (!slotByFileId.has(fileId))
      slotByFileId.set(fileId, slot);
  });
  const fileMtimes = new PathKeyedMap(wordIndexKey);
  const fileSizes = new PathKeyedMap(wordIndexKey);
  data.files.forEach((file, i) => {
    const value = data.docLengths[i];
    if (!isCanonicalWordIndexNumber(value) || value < 0)
      canonical = false;
    docLengths.set(file, isCanonicalWordIndexNumber(value) && value >= 0 ? value : 0);
  });
  data.files.forEach((file, i) => {
    const value = data.fileMtimes[i];
    if (typeof value !== "number" || !Number.isFinite(value))
      canonical = false;
    fileMtimes.set(file, typeof value === "number" && Number.isFinite(value) ? value : 0);
  });
  if (Array.isArray(data.fileSizes) && data.fileSizes.length === data.files.length) {
    data.files.forEach((file, i) => {
      const value = data.fileSizes?.[i];
      if (!isCanonicalWordIndexNumber(value) || value < 0)
        canonical = false;
      fileSizes.set(file, isCanonicalWordIndexNumber(value) && value >= 0 ? value : 0);
    });
  } else {
    canonical = false;
  }
  const postings = /* @__PURE__ */ new Map();
  const postingTokens = /* @__PURE__ */ new Set();
  const postingFileCounts = /* @__PURE__ */ new Map();
  for (const posting of data.postings) {
    if (!Array.isArray(posting) || posting.length !== 2) {
      canonical = false;
      needsDeepSanitize = true;
      continue;
    }
    const [token, flat] = posting;
    if (!isCanonicalWordIndexToken(token) || postingTokens.has(token) || !Array.isArray(flat) || flat.length === 0 || flat.length % 2 !== 0) {
      canonical = false;
      needsDeepSanitize = true;
      continue;
    }
    postingTokens.add(token);
    const lanes = [];
    const seenPairs = /* @__PURE__ */ new Set();
    const observedCounts = /* @__PURE__ */ new Map();
    for (let i = 0; i < flat.length; i += 2) {
      const slot = flat[i];
      const line = flat[i + 1];
      if (!isCanonicalWordIndexNumber(slot) || slot < 0 || slot >= fileIdBySlot.length || !isCanonicalWordIndexNumber(line) || line < 1 || line > WORD_INDEX_INT32_MAX) {
        canonical = false;
        needsDeepSanitize = true;
        continue;
      }
      const fileId = fileIdBySlot[slot];
      const pairKey = fileId <= WORD_INDEX_PACKED_FILE_ID_MAX ? fileId * (WORD_INDEX_INT32_MAX + 1) + line : `${fileId}:${line}`;
      if (seenPairs.has(pairKey)) {
        canonical = false;
        needsDeepSanitize = true;
      }
      seenPairs.add(pairKey);
      lanes.push(fileId, line);
      observedCounts.set(fileId, (observedCounts.get(fileId) ?? 0) + 1);
    }
    if (lanes.length === 0)
      continue;
    const list = WordPostingList.fromLanes(token, lanes);
    postings.set(token, list);
    postingFileCounts.set(token, observedCounts);
  }
  compactPostingsIntoArena(postings);
  let forward;
  if (Array.isArray(data.forward)) {
    const candidate = data.files.map(() => /* @__PURE__ */ new Map());
    const forwardTotals = /* @__PURE__ */ new Map();
    if (data.forward.length !== data.files.length)
      canonical = false;
    if (data.forward.length !== data.files.length)
      needsDeepSanitize = true;
    for (const [entryIndex, entry] of data.forward.entries()) {
      if (!Array.isArray(entry) || entry.length !== 2) {
        canonical = false;
        needsDeepSanitize = true;
        continue;
      }
      const [fileIdx, tokenCounts] = entry;
      if (!isCanonicalWordIndexNumber(fileIdx) || fileIdx !== entryIndex || fileIdx < 0 || fileIdx >= data.files.length || !Array.isArray(tokenCounts)) {
        canonical = false;
        needsDeepSanitize = true;
        continue;
      }
      for (const pair of tokenCounts) {
        if (!Array.isArray(pair) || pair.length !== 2 || !isCanonicalWordIndexToken(pair[0]) || !isCanonicalWordIndexNumber(pair[1]) || pair[1] < 1 || pair[1] > WORD_INDEX_INT32_MAX || candidate[fileIdx].has(pair[0])) {
          canonical = false;
          needsDeepSanitize = true;
          continue;
        }
        candidate[fileIdx].set(pair[0], pair[1]);
        forwardTotals.set(pair[0], (forwardTotals.get(pair[0]) ?? 0) + pair[1]);
      }
    }
    let forwardMatchesPostings = true;
    for (const [token, list] of postings) {
      if (forwardTotals.get(token) !== list.length) {
        forwardMatchesPostings = false;
      }
      const observed = postingFileCounts.get(token);
      if (!observed) {
        forwardMatchesPostings = false;
        continue;
      }
      for (const [fileId, count] of observed) {
        const slot = slotByFileId.get(fileId);
        if (slot === void 0 || candidate[slot].get(token) !== count) {
          forwardMatchesPostings = false;
        }
      }
    }
    for (const token of forwardTotals.keys()) {
      if (!postingTokens.has(token))
        forwardMatchesPostings = false;
    }
    if (!forwardMatchesPostings)
      canonical = false;
    if (!forwardMatchesPostings)
      needsDeepSanitize = true;
    forward = new PathKeyedMap(wordIndexKey);
    for (let i = 0; i < data.files.length; i += 1) {
      forward.set(data.files[i], WordForwardEntry.fromTally(candidate[i]));
    }
  } else if (Object.prototype.hasOwnProperty.call(data, "forward")) {
    canonical = false;
    needsDeepSanitize = true;
  }
  if (needsDeepSanitize) {
    const actualForwardCounts = data.files.map(() => /* @__PURE__ */ new Map());
    for (const [token, list] of postings) {
      const seenPairs = /* @__PURE__ */ new Set();
      const sanitized = new WordPostingList(token, list.length);
      for (let i = 0; i < list.length; i += 1) {
        const fileId = list.fileIdAt(i);
        const line = list.lineAt(i);
        const pairKey = `${fileId}:${line}`;
        if (seenPairs.has(pairKey))
          continue;
        seenPairs.add(pairKey);
        sanitized.push(fileId, line);
        const slot = slotByFileId.get(fileId);
        if (slot !== void 0) {
          const counts = actualForwardCounts[slot];
          counts.set(token, (counts.get(token) ?? 0) + 1);
        }
      }
      postings.set(token, sanitized);
    }
    compactPostingsIntoArena(postings);
    if (Array.isArray(data.forward)) {
      forward = new PathKeyedMap(wordIndexKey);
      for (let i = 0; i < data.files.length; i += 1) {
        const canonicalSlot = slotByFileId.get(fileIdBySlot[i]) ?? i;
        forward.set(data.files[i], WordForwardEntry.fromTally(actualForwardCounts[canonicalSlot]));
      }
    }
  }
  const expectedTotalTokens = [...docLengths.values()].reduce((total, length) => total + length, 0);
  const totalTokens = isCanonicalWordIndexNumber(expectedTotalTokens) ? expectedTotalTokens : 0;
  if (!isCanonicalWordIndexNumber(data.totalTokens) || data.totalTokens !== totalTokens) {
    canonical = false;
  }
  if (typeof data.indexedFileCount !== "number" || data.indexedFileCount !== docLengths.size) {
    canonical = false;
  }
  if (typeof data.truncated !== "boolean")
    canonical = false;
  const index = {
    postings,
    fileTable,
    docLengths,
    totalTokens,
    docCount: docLengths.size,
    truncated: data.truncated === true,
    forward,
    fileMtimes,
    fileSizes,
    // Postings were just packed into one arena above, so the running gate
    // starts from the exact post-compaction store count (#2117).
    postingStoreCount: countPostingBackingStores(postings),
    recompactFlight: createSingleFlight(),
    // A deserialized index is a fresh object distinct from whichever index
    // produced `data`. Without this, every per-edit dirty mark on a
    // session-start reload (#2068) is a no-op against `undefined`, and
    // serializeWordIndexIncrementally's `!dirty` branch then returns the
    // stale cached wire view forever, silently dropping every later edit
    // from the persisted snapshot.
    dirtyFiles: /* @__PURE__ */ new Set()
  };
  const tokensByFile = /* @__PURE__ */ new Map();
  if (forward) {
    for (const file of data.files) {
      tokensByFile.set(wordIndexKey(file), new Set(forward.get(file)?.keys() ?? []));
    }
  }
  if (canonical) {
    retainSerializedWordIndex(index, {
      serialized: data,
      slotByFileId,
      tokensByFile,
      wireBytes: null
    });
  }
  return index;
}
var buildStatuses = /* @__PURE__ */ new Map();
function getWordIndexBuildStatus(cwd) {
  return buildStatuses.get(path2.resolve(cwd));
}
function _resetWordIndexBuildGuardForTests() {
  buildStatuses.clear();
}
function triggerBackgroundWordIndexBuild(cwd, dbg, options = {}) {
  const key = path2.resolve(cwd);
  if (isAtOrAboveHomeDir(key, options.homeDir)) {
    const reason = `root at/above home directory (${key})`;
    dbg?.(`word-index cold-build: skipped \u2014 ${reason}`);
    logWordIndex({
      phase: "cold_build_refused",
      cwd: key,
      trigger: "cold_query",
      reason
    });
    const status2 = { state: "refused", reason };
    buildStatuses.set(key, status2);
    return status2;
  }
  const current = buildStatuses.get(key);
  if (current?.state === "building")
    return current;
  const status = { state: "building" };
  buildStatuses.set(key, status);
  void (async () => {
    const startMs = Date.now();
    try {
      const { loadProjectSnapshot, saveProjectSnapshot, PROJECT_SNAPSHOT_VERSION } = await import("./chunk-UXGETRP4.js");
      const docs = await collectWordIndexDocs(key);
      const index = await buildWordIndexAsync(docs);
      const existing = loadProjectSnapshot(key);
      const snapshot = existing ?? {
        version: PROJECT_SNAPSHOT_VERSION,
        projectRoot: key,
        generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        seq: 0,
        files: {},
        symbols: {},
        reverseDeps: {},
        cachedExports: []
      };
      snapshot.generatedAt = (/* @__PURE__ */ new Date()).toISOString();
      snapshot.wordIndex = serializeWordIndex(index);
      saveProjectSnapshot(key, snapshot);
      dbg?.(`word-index cold-build: ${index.docCount} files, ${index.postings.size} tokens (${Date.now() - startMs}ms)`);
      logWordIndex({
        phase: "cold_build",
        cwd: key,
        trigger: "cold_query",
        durationMs: Date.now() - startMs,
        indexedFileCount: index.docCount,
        tokens: index.postings.size,
        postingEntries: countWordIndexPostingEntries(index),
        residentBytes: estimateWordIndexResidentBytes(index),
        truncated: index.truncated,
        skipped: docs.skipped
      });
      buildStatuses.delete(key);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      buildStatuses.set(key, { state: "failed", reason });
      dbg?.(`word-index cold-build: failed: ${reason}`);
      logWordIndex({
        phase: "cold_build_failed",
        cwd: key,
        trigger: "cold_query",
        durationMs: Date.now() - startMs,
        error: reason
      });
    }
  })();
  return status;
}
var WORD_INDEX_PERSIST_DEBOUNCE_MS_DEFAULT = 1500;
function wordIndexPersistDebounceMs() {
  const raw = Number(process.env.PI_LENS_WORD_INDEX_PERSIST_DEBOUNCE_MS);
  return Number.isFinite(raw) && raw >= 0 ? raw : WORD_INDEX_PERSIST_DEBOUNCE_MS_DEFAULT;
}
var wordIndexPersistScheduler;
function getWordIndexPersistScheduler() {
  if (wordIndexPersistScheduler)
    return wordIndexPersistScheduler;
  wordIndexPersistScheduler = createDebounceScheduler({
    debounceMs: wordIndexPersistDebounceMs,
    write(_key, pending) {
      void writeWordIndexSnapshot(pending.cwd, pending.index, pending.dbg);
    }
  });
  return wordIndexPersistScheduler;
}
async function writeWordIndexSnapshot(cwd, index, dbg) {
  const persistStartedAt = Date.now();
  try {
    const { loadProjectSnapshot, saveProjectSnapshot, PROJECT_SNAPSHOT_VERSION } = await import("./chunk-UXGETRP4.js");
    const existing = loadProjectSnapshot(cwd);
    const snapshot = existing ?? {
      version: PROJECT_SNAPSHOT_VERSION,
      projectRoot: path2.resolve(cwd),
      generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      seq: 0,
      files: {},
      symbols: {},
      reverseDeps: {},
      cachedExports: []
    };
    snapshot.generatedAt = (/* @__PURE__ */ new Date()).toISOString();
    const serializeStartedAt = performance.now();
    snapshot.wordIndex = serializeWordIndex(index);
    const serializeMs = performance.now() - serializeStartedAt;
    saveProjectSnapshot(cwd, snapshot);
    if (index.releaseMemoAfterPersist) {
      index.releaseMemoAfterPersist = false;
      releaseWordIndexMemo(index, "post_settle_persist");
    }
    const writeMs = performance.now() - serializeStartedAt - serializeMs;
    dbg?.(`word-index persist: ${index.docCount} files, ${index.postings.size} tokens`);
    logWordIndex({
      phase: "persist_succeeded",
      cwd: path2.resolve(cwd),
      trigger: "per_edit",
      durationMs: Date.now() - persistStartedAt,
      serializeMs,
      writeMs,
      indexedFileCount: index.docCount,
      tokens: index.postings.size,
      postingEntries: countWordIndexPostingEntries(index),
      residentBytes: estimateWordIndexResidentBytes(index),
      replacementCount: index.replacementStats?.count ?? 0,
      totalReplacementMs: index.replacementStats?.totalMs ?? 0,
      maxReplacementMs: index.replacementStats?.maxMs ?? 0
    });
    index.replacementStats = { count: 0, totalMs: 0, maxMs: 0 };
  } catch (err) {
    dbg?.(`word-index persist: failed: ${err}`);
    logWordIndex({
      phase: "persist_failed",
      cwd: path2.resolve(cwd),
      trigger: "per_edit",
      indexedFileCount: index.docCount,
      error: err instanceof Error ? err.message : String(err)
    });
  }
}
function scheduleWordIndexPersist(cwd, index, dbg) {
  const key = path2.resolve(cwd);
  index.releaseMemoAfterPersist = false;
  getWordIndexPersistScheduler().schedule(key, { cwd: key, index, dbg });
}
function flushWordIndexPersistsForTests() {
  getWordIndexPersistScheduler().flushAll();
}

export {
  logWordIndex,
  wordIndexKey,
  splitIdentifier,
  tokenizeLine,
  countWordIndexPostingEntries,
  estimateWordIndexResidentBytes,
  wordIndexPostingHits,
  flushWordIndexRecompactionsForTests,
  buildWordIndex,
  buildWordIndexAsync,
  removeWordIndexDocument,
  updateWordIndexDocument,
  removeWordIndexDocumentAsync,
  updateWordIndexDocumentForEdit,
  updateWordIndexDocumentAsync,
  WORD_INDEX_MAX_BYTES,
  collectWordIndexDocs,
  refreshWordIndexIncrementally,
  WordIndexQueryError,
  parseWordIndexQuery,
  buildWordIndexQueryFilter,
  searchWordIndex,
  centralityFromReverseDeps,
  WORD_INDEX_FORMAT_VERSION,
  getWordIndexWireBytes,
  recordPersistedWordIndexWireBytes,
  releaseWordIndexMemoAtSettle,
  getLastWordIndexSerializeWork,
  serializeWordIndex,
  deserializeWordIndex,
  getWordIndexBuildStatus,
  _resetWordIndexBuildGuardForTests,
  triggerBackgroundWordIndexBuild,
  scheduleWordIndexPersist,
  flushWordIndexPersistsForTests
};
