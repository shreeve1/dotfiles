import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  BoundedLruCache
} from "./chunk-ABBOA7UD.js";
import {
  normalizeMapKey
} from "./chunk-N2H3ZPZY.js";

// dist/clients/dispatch/fact-store.js
var capacityEvictionReporter;
function setFactStoreEvictionReporter(reporter) {
  capacityEvictionReporter = reporter;
}
function getFactStoreEvictionReporter() {
  return capacityEvictionReporter;
}
var MAX_FILE_FACT_RECORDS = 1024;
var MAX_FILE_FACT_CONTENT_BYTES = 64 * 1024 * 1024;
var MAX_SESSION_FACT_RECORDS = 4096;
var FactStore = class {
  subject;
  // Insertion order is eviction order: the oldest-used record is evicted first.
  fileFacts = /* @__PURE__ */ new Map();
  sessionFacts = /* @__PURE__ */ new Map();
  // Bounded sibling of `sessionFacts` for per-file-keyed session facts (#2282).
  // True LRU: every fetch (get or create, see getBoundedSessionFact) refreshes
  // recency, so the oldest-UNUSED record is evicted first, not merely the
  // oldest-inserted.
  boundedSessionFacts = new BoundedLruCache(MAX_SESSION_FACT_RECORDS);
  // Keys evicted from `boundedSessionFacts` and not written since, so a reader
  // can tell "evicted" from "never seen" (#2282). Same cap, same FIFO order.
  evictedSessionFactKeys = /* @__PURE__ */ new Set();
  // Pin refcount per file. A file is exempt from capacity eviction while its
  // count is > 0. Refcounted, not a Set, so two overlapping dispatches of the
  // same file both hold the pin until BOTH settle (#2243 item 2).
  pinnedFiles = /* @__PURE__ */ new Map();
  // Running UTF-8 byte total for file.content only. Maintaining it at every
  // mutation keeps getFileFact/setFileFact O(1) amortized; never scan the map
  // to decide whether the byte budget is exceeded.
  retainedContentBytes = 0;
  // Subset of retainedContentBytes held by currently pinned files (#2247
  // review F2). Maintained incrementally the same way — a scan over
  // `pinnedFiles` looks small in isolation, but `evictColdFileFacts` calls it
  // on EVERY unpinned insert for as long as pinned bytes stay over budget, so
  // a scan there would re-walk a large pinned file's full string on every
  // single write admitted during that window. Keeping a running total avoids
  // reintroducing exactly the scan `retainedContentBytes` exists to avoid.
  pinnedContentBytesTotal = 0;
  /**
   * @param subject Discriminates this store's capacity-eviction telemetry
   *   from every other production FactStore's (#2243 review round 3, F1).
   *   Production callers pass a label naming the store (e.g. `"dispatch"`,
   *   `"runtime-session-call-graph"`); the default is only for call sites
   *   that never wired a reporter and tests that don't care.
   */
  constructor(subject = "session-fact-store") {
    this.subject = subject;
  }
  // All file-keyed methods normalize the path internally via normalizeMapKey().
  // Callers always pass raw/resolved paths — normalization is not their concern.
  getFileFact(filePath, factId) {
    return this.touchFileFacts(normalizeMapKey(filePath))?.get(factId);
  }
  setFileFact(filePath, factId, value) {
    const key = normalizeMapKey(filePath);
    let facts = this.touchFileFacts(key);
    if (!facts) {
      facts = /* @__PURE__ */ new Map();
      this.fileFacts.set(key, facts);
    }
    if (factId === "file.content") {
      const delta = this.contentBytes(value) - this.contentBytes(facts.get(factId));
      this.retainedContentBytes += delta;
      if (this.pinnedFiles.has(key))
        this.pinnedContentBytesTotal += delta;
    }
    facts.set(factId, value);
    this.evictColdFileFacts();
  }
  hasFileFact(filePath, factId) {
    return this.fileFacts.get(normalizeMapKey(filePath))?.has(factId) ?? false;
  }
  /** Drop one file fact without disturbing the file's derived facts.
   *  Removes the per-file entry too when the deleted fact was its last value. */
  deleteFileFact(filePath, factId) {
    const key = normalizeMapKey(filePath);
    const facts = this.fileFacts.get(key);
    if (!facts)
      return;
    if (factId === "file.content") {
      const dropped = this.contentBytes(facts.get(factId));
      this.retainedContentBytes -= dropped;
      if (this.pinnedFiles.has(key))
        this.pinnedContentBytesTotal -= dropped;
    }
    facts.delete(factId);
    if (facts.size === 0)
      this.fileFacts.delete(key);
  }
  /** Clear facts for one specific file only, and mark the file's dispatch as
   *  begun. Use at the start of each per-file dispatch call.
   *  Preserves facts for other files computed in the same turn.
   *  Normalizes filePath internally — callers pass raw paths.
   *  Pins the file against capacity eviction until the matching
   *  {@link endDispatchFor} runs in the dispatch's settle path (#2243 item 2).
   *  Every `clearFileFactsFor` MUST be paired with an `endDispatchFor`. */
  clearFileFactsFor(filePath) {
    const key = normalizeMapKey(filePath);
    this.deleteFileFactsRecord(key);
    this.pinFile(key);
  }
  /** Pin a file against capacity eviction for the duration of a dispatch,
   *  WITHOUT clearing its existing facts. Pairs with {@link endDispatchFor}
   *  exactly like {@link clearFileFactsFor} does.
   *
   *  #2243 review round 3 (F5): `clearFileFactsFor`'s clear+re-derive is
   *  right for a dispatch driven by a fresh edit, but the debounced
   *  ast-grep warning scan runs ~2s AFTER the inline dispatch for that same
   *  edit already re-derived every fact for this exact file — a second
   *  clear there bought nothing but ~51ms of redundant re-parsing across
   *  all five providers (measured; a warm-cache read is ~1ms). Use this
   *  where the facts are very likely already fresh: `runProviders` still
   *  re-derives any fact this file is missing (a genuine miss, e.g. the
   *  fact was evicted meanwhile), so a read never depends on staleness. */
  beginDispatchFor(filePath) {
    this.pinFile(normalizeMapKey(filePath));
  }
  /** Release the pin a {@link clearFileFactsFor} or {@link beginDispatchFor}
   *  took for one file's dispatch. Call once per matching call, from the
   *  dispatch's finally/settle path, so the pin set tracks dispatches
   *  actually in flight rather than the last N files touched (#2243 item 2). */
  endDispatchFor(filePath) {
    this.unpinFile(normalizeMapKey(filePath));
    this.evictColdFileFacts();
  }
  /** Clear one file's facts WITHOUT pinning. For sequential single-store scans
   *  (project-diagnostics) that own their store and race no concurrent walk:
   *  pinning there would exempt every scanned file from the capacity cap and
   *  defeat it. Normalizes filePath internally. */
  dropFileFacts(filePath) {
    this.deleteFileFactsRecord(normalizeMapKey(filePath));
  }
  /** LRU touch: re-inserting an existing record moves it to the end of the
   *  eviction order, so a record still in use is not the next victim. */
  touchFileFacts(key) {
    const facts = this.fileFacts.get(key);
    if (!facts)
      return void 0;
    this.fileFacts.delete(key);
    this.fileFacts.set(key, facts);
    return facts;
  }
  pinFile(key) {
    const count = this.pinnedFiles.get(key) ?? 0;
    if (count === 0) {
      this.pinnedContentBytesTotal += this.contentBytes(this.fileFacts.get(key)?.get("file.content"));
    }
    this.pinnedFiles.set(key, count + 1);
  }
  unpinFile(key) {
    const count = this.pinnedFiles.get(key);
    if (count === void 0)
      return;
    if (count <= 1) {
      this.pinnedFiles.delete(key);
      this.pinnedContentBytesTotal -= this.contentBytes(this.fileFacts.get(key)?.get("file.content"));
    } else {
      this.pinnedFiles.set(key, count - 1);
    }
  }
  /** Drop least-recently-used records past either cap, skipping the files whose
   *  dispatch pinned them. Pinned content counts toward the byte total, but is
   *  never evicted before endDispatchFor. Pins survive until clearAll.
   *
   *  #2247 review F2: a leaked (or several overlapping) pin(s) can put pinned
   *  bytes over budget ON THEIR OWN. Evicting every unpinned record can never
   *  bring the total back under budget in that state — before this guard, the
   *  loop below evicted each newly inserted unpinned record on the very next
   *  call (it was always the sole remaining unpinned key), so unpinned writes
   *  never retained anything: a silent, permanent collapse for the rest of
   *  the process. Once byte pressure is unpinned-bytes-driven-only, stop
   *  evicting and admit unpinned inserts as-is — best-effort under pin
   *  pressure — and record the state distinctly so it is visible instead of
   *  inferred from "the store stopped retaining anything". */
  evictColdFileFacts() {
    if (!this.overCapacity())
      return;
    for (const key of this.fileFacts.keys()) {
      if (this.pinnedFiles.has(key))
        continue;
      const axis = this.capacityAxis();
      if (axis === "bytes" && this.pinnedContentBytesTotal > MAX_FILE_FACT_CONTENT_BYTES) {
        this.reportPinnedOverBudget();
        return;
      }
      this.deleteFileFactsRecord(key);
      this.reportCapacityEviction(key, axis);
      if (!this.overCapacity())
        return;
    }
  }
  overCapacity() {
    return this.fileFacts.size > MAX_FILE_FACT_RECORDS || this.retainedContentBytes > MAX_FILE_FACT_CONTENT_BYTES;
  }
  capacityAxis() {
    return this.fileFacts.size > MAX_FILE_FACT_RECORDS ? "count" : "bytes";
  }
  contentBytes(value) {
    return typeof value === "string" ? Buffer.byteLength(value, "utf8") : 0;
  }
  deleteFileFactsRecord(key) {
    const facts = this.fileFacts.get(key);
    if (!facts)
      return;
    const dropped = this.contentBytes(facts.get("file.content"));
    this.retainedContentBytes -= dropped;
    if (this.pinnedFiles.has(key))
      this.pinnedContentBytesTotal -= dropped;
    this.fileFacts.delete(key);
  }
  // #2243 item 4: the cap silently drops a fact a live dispatch may read back
  // as "" (dispatcher.ts reads `file.content` with `?? ""`). Emit through the
  // injected reporter so the drop is visible in the ledger instead of being
  // inferred from a downstream symptom. integration.ts routes this to
  // `recordDegradationOnce` keyed on THIS store's `subject` (#2243 review
  // round 3, F1), so the ledger's own per-kind+subject dedupe yields exactly
  // ONE record per session PER STORE (re-arming at session_start when the
  // ledger resets) — no latch or generation compare here, so fact-store
  // keeps no session-scoped state to forget to re-arm.
  reportCapacityEviction(evictedKey, axis) {
    capacityEvictionReporter?.(this.subject, axis, axis === "count" ? `file-fact store axis=count exceeded ${MAX_FILE_FACT_RECORDS} records; evicted least-recently-used fact for ${evictedKey}` : `file-fact store axis=bytes exceeded ${MAX_FILE_FACT_CONTENT_BYTES} retained content bytes; evicted least-recently-used fact for ${evictedKey}`);
  }
  // #2247 review F2: pinned bytes alone exceeding budget is not an eviction —
  // nothing is dropped — so it is reported through a distinct axis rather
  // than reusing `reportCapacityEviction`'s "evicted least-recently-used
  // fact for X" language, which would misdescribe what happened.
  reportPinnedOverBudget() {
    const pinnedBytes = this.pinnedContentBytesTotal;
    capacityEvictionReporter?.(this.subject, "pinned-over-budget", `file-fact store pinned content bytes (${pinnedBytes}) exceed the ${MAX_FILE_FACT_CONTENT_BYTES}-byte budget; unpinned inserts are admitted without eviction until a pin releases`);
  }
  /** Running UTF-8 byte total for retained `file.content` values. Exposed so
   *  tests can crosscheck it against a fresh sum over retained records
   *  (#2247 review F3) — the running total is maintained incrementally on
   *  every insert/delete path rather than recomputed, so a subtraction
   *  dropped from one of those paths would otherwise drift silently. */
  getRetainedContentBytes() {
    return this.retainedContentBytes;
  }
  /** Running UTF-8 byte total for the pinned SUBSET of retained
   *  `file.content` values. Exposed so tests can crosscheck it against a
   *  fresh sum over `pinnedFiles ∩ fileFacts` (#2247 review F4) — like
   *  `retainedContentBytes`, it is maintained incrementally on the pin
   *  0→1 transition, the unpin 1→0 transition, content overwrite/delete,
   *  and `clearAll`, so a drop from any one of those paths would
   *  otherwise drift silently instead of failing loudly. */
  getPinnedContentBytes() {
    return this.pinnedContentBytesTotal;
  }
  getSessionFact(factId) {
    return this.sessionFacts.get(factId);
  }
  setSessionFact(factId, value) {
    this.sessionFacts.set(factId, value);
  }
  hasSessionFact(factId) {
    return this.sessionFacts.has(factId);
  }
  /** Bounded counterpart to {@link getSessionFact} for per-file-keyed session
   *  facts (#2282) — session baselines, cascade baselines, review-graph entity
   *  snapshots. LRU touch: a read moves the record off the eviction end. */
  getBoundedSessionFact(factId) {
    if (!this.boundedSessionFacts.has(factId))
      return void 0;
    return this.boundedSessionFacts.get(factId);
  }
  /** Bounded counterpart to {@link setSessionFact}. Callers use this instead
   *  of `setSessionFact` for any family that mints one key per file/entity
   *  touched, so the store's count stays bounded across a large batch instead
   *  of retaining one entry per distinct path for the process lifetime. */
  setBoundedSessionFact(factId, value) {
    this.evictedSessionFactKeys.delete(factId);
    const evicted = this.boundedSessionFacts.set(factId, value);
    for (const [oldestKey] of evicted) {
      this.evictedSessionFactKeys.add(oldestKey);
      while (this.evictedSessionFactKeys.size > MAX_SESSION_FACT_RECORDS) {
        const oldestTombstone = this.evictedSessionFactKeys.values().next().value;
        if (oldestTombstone === void 0)
          break;
        this.evictedSessionFactKeys.delete(oldestTombstone);
      }
      capacityEvictionReporter?.(this.subject, "session-count", `session-fact store axis=count exceeded ${MAX_SESSION_FACT_RECORDS} records; evicted least-recently-used fact for ${oldestKey}`);
    }
  }
  hasBoundedSessionFact(factId) {
    return this.boundedSessionFacts.has(factId);
  }
  /** True when this key held a bounded session fact that capacity eviction
   *  dropped and nothing has rewritten since (#2282). Readers whose "absent"
   *  branch is not a safe default — the review-graph entity snapshot, where
   *  absent would read as "every symbol is new" — use this to tell an evicted
   *  key from one this session has never seen. */
  wasBoundedSessionFactEvicted(factId) {
    return this.evictedSessionFactKeys.has(factId);
  }
  /** O(1) entry count for memory-attribution sampling (#2282 Observability):
   *  the fixed-vocabulary map plus the bounded per-file map, so a caller gets
   *  this store's whole `sessionFacts` footprint in one number. */
  getSessionFactEntryCount() {
    return this.sessionFacts.size + this.boundedSessionFacts.size;
  }
  /** Call on session reset only. Clears everything including tool cache and baselines. */
  clearAll() {
    this.fileFacts.clear();
    this.sessionFacts.clear();
    this.boundedSessionFacts.clear();
    this.evictedSessionFactKeys.clear();
    this.pinnedFiles.clear();
    this.retainedContentBytes = 0;
    this.pinnedContentBytesTotal = 0;
  }
};

export {
  setFactStoreEvictionReporter,
  getFactStoreEvictionReporter,
  FactStore
};
