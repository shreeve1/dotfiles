import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);

// dist/clients/bounded-cache.js
var BoundedFifoMap = class {
  entries = /* @__PURE__ */ new Map();
  maxEntries;
  constructor(maxEntries) {
    this.maxEntries = maxEntries;
  }
  get(key) {
    return this.entries.get(key);
  }
  has(key) {
    return this.entries.has(key);
  }
  /**
   * Insert or update `key` without reordering. Evicts the oldest
   * (insertion-order) entries once the map exceeds capacity.
   *
   * Returns the evicted `[key, value]` pairs, oldest first — callers with
   * eviction-side bookkeeping use the return value instead of hand-rolling
   * `keys().next().value` (#2442). The VALUE is returned, not just the key,
   * because the eviction-coupled sites need it: `tree-sitter-cache.ts` has to
   * retire the dropped entry's WASM-heap tree (#417/#890) and
   * `tree-sitter-client.ts` has to `delete()` the dropped compiled query.
   * Handing back only the key would force those sites to read the value out
   * of the map before eviction — i.e. to hand-roll the block this class
   * exists to delete.
   */
  set(key, value) {
    this.entries.set(key, value);
    return this.evictOverflow();
  }
  /**
   * Change the capacity ceiling, evicting down to it immediately when it
   * shrinks. Returns the evicted `[key, value]` pairs, oldest first, on the
   * same contract as {@link set} — a caller with a DYNAMIC cap (an env-read
   * ceiling, `TreeCache.setMaxSize`) needs the shrink to free the same
   * resources an ordinary overflow frees.
   */
  setMaxEntries(maxEntries) {
    this.maxEntries = maxEntries;
    return this.evictOverflow();
  }
  /** Current capacity ceiling. */
  getMaxEntries() {
    return this.maxEntries;
  }
  /** Drop oldest-first until within capacity. The one eviction block. */
  evictOverflow() {
    const evicted = [];
    while (this.entries.size > this.maxEntries) {
      const oldest = this.entries.entries().next().value;
      if (oldest === void 0)
        break;
      this.entries.delete(oldest[0]);
      evicted.push(oldest);
    }
    return evicted;
  }
  delete(key) {
    return this.entries.delete(key);
  }
  clear() {
    this.entries.clear();
  }
  get size() {
    return this.entries.size;
  }
  keys() {
    return this.entries.keys();
  }
  values() {
    return this.entries.values();
  }
  entriesArray() {
    return [...this.entries.entries()];
  }
  [Symbol.iterator]() {
    return this.entries[Symbol.iterator]();
  }
};
var BoundedSet = class {
  entries;
  constructor(maxEntries) {
    this.entries = new BoundedFifoMap(maxEntries);
  }
  has(value) {
    return this.entries.has(value);
  }
  /**
   * Insert `value` without reordering an already-present member. Evicts the
   * oldest (insertion-order) members once the set exceeds capacity.
   *
   * Returns the evicted values, oldest first — see the class doc for why a
   * call site consumes this instead of hand-rolling the drop.
   */
  add(value) {
    return this.entries.set(value, true).map(([evicted]) => evicted);
  }
  /**
   * Change the capacity ceiling, evicting down to it immediately when it
   * shrinks. Returns the evicted values, oldest first, on the same contract
   * as {@link add}.
   */
  setMaxEntries(maxEntries) {
    return this.entries.setMaxEntries(maxEntries).map(([evicted]) => evicted);
  }
  /** Current capacity ceiling. */
  getMaxEntries() {
    return this.entries.getMaxEntries();
  }
  delete(value) {
    return this.entries.delete(value);
  }
  clear() {
    this.entries.clear();
  }
  get size() {
    return this.entries.size;
  }
  values() {
    return this.entries.keys();
  }
  [Symbol.iterator]() {
    return this.entries.keys();
  }
};
var BoundedLruCache = class extends BoundedFifoMap {
  /**
   * Read and promote to most-recently-used.
   *
   * A stored `undefined` value is NOT promoted — the hit is indistinguishable
   * from a miss on this signature, and pre-#2442 `BoundedLruCache` behaved
   * the same way. No caller stores `undefined`; the note exists so a future
   * one does not assume otherwise.
   */
  get(key) {
    const value = this.entries.get(key);
    if (value !== void 0) {
      this.entries.delete(key);
      this.entries.set(key, value);
    }
    return value;
  }
  /** Insert or update `key`, moving it to the most-recently-used position. */
  set(key, value) {
    this.entries.delete(key);
    return super.set(key, value);
  }
};

export {
  BoundedFifoMap,
  BoundedSet,
  BoundedLruCache
};
