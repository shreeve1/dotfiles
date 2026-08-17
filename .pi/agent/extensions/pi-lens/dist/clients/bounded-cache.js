/** Small insertion-ordered LRU used for process-lifetime memo tables. */
export class BoundedLruCache {
    maxEntries;
    entries = new Map();
    constructor(maxEntries) {
        this.maxEntries = maxEntries;
    }
    get(key) {
        const value = this.entries.get(key);
        if (value !== undefined) {
            this.entries.delete(key);
            this.entries.set(key, value);
        }
        return value;
    }
    has(key) { return this.entries.has(key); }
    set(key, value) {
        this.entries.delete(key);
        this.entries.set(key, value);
        while (this.entries.size > this.maxEntries) {
            const oldest = this.entries.keys().next().value;
            if (oldest === undefined)
                break;
            this.entries.delete(oldest);
        }
    }
    delete(key) { return this.entries.delete(key); }
    clear() { this.entries.clear(); }
    get size() { return this.entries.size; }
    keys() { return this.entries.keys(); }
    values() { return this.entries.values(); }
    entriesArray() { return [...this.entries.entries()]; }
    [Symbol.iterator]() { return this.entries[Symbol.iterator](); }
}
