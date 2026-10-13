import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  BoundedFifoMap
} from "./chunk-ABBOA7UD.js";

// dist/clients/path-keyed-map.js
var PathKeyedMap = class {
  normalize;
  store;
  /**
   * `maxEntries` bounds the map with insertion-order (FIFO) eviction, on
   * `BoundedFifoMap` — the repo's one eviction implementation (#2442). Omit
   * it for an unbounded map. A path-keyed map that needs a bound gets it
   * here rather than hand-rolling `keys().next().value` at the call site,
   * which is what `PartialApplyRecordStore` did before #2442's review round.
   *
   * FIFO, not LRU, and evicting AFTER the write, not before: a `set` of an
   * already-resident path is an update, and must not drop an unrelated file
   * to make room for a key that needs none.
   */
  constructor(normalize, maxEntries) {
    this.normalize = normalize;
    this.store = maxEntries === void 0 ? /* @__PURE__ */ new Map() : new BoundedFifoMap(maxEntries);
  }
  get size() {
    return this.store.size;
  }
  get(path) {
    return this.store.get(this.normalize(path))?.value;
  }
  has(path) {
    return this.store.has(this.normalize(path));
  }
  set(path, value) {
    this.store.set(this.normalize(path), { displayPath: path, value });
    return this;
  }
  delete(path) {
    if (this.store.delete(this.normalize(path)))
      return true;
    for (const [key, entry] of this.store) {
      if (entry.displayPath !== path)
        continue;
      this.store.delete(key);
      return true;
    }
    return false;
  }
  clear() {
    this.store.clear();
  }
  *keys() {
    for (const entry of this.store.values())
      yield entry.displayPath;
  }
  *values() {
    for (const entry of this.store.values())
      yield entry.value;
  }
  *entries() {
    for (const entry of this.store.values())
      yield [entry.displayPath, entry.value];
  }
  forEach(callback) {
    for (const entry of this.store.values()) {
      callback(entry.value, entry.displayPath, this);
    }
  }
  [Symbol.iterator]() {
    return this.entries();
  }
};

export {
  PathKeyedMap
};
