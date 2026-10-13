import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);

// dist/clients/map-with-concurrency.js
async function mapWithConcurrency(items, concurrency, mapper, signal) {
  if (items.length === 0)
    return [];
  let nextIndex = 0;
  const workerCount = Math.max(1, Math.min(concurrency, items.length));
  const results = /* @__PURE__ */ new Map();
  const worker = async () => {
    while (true) {
      if (signal?.aborted)
        return;
      const index = nextIndex++;
      if (index >= items.length)
        return;
      results.set(index, await mapper(items[index]));
    }
  };
  const workers = Array.from({ length: workerCount }, () => worker());
  await Promise.all(workers);
  return [...results.entries()].sort(([left], [right]) => left - right).map(([, result]) => result);
}

export {
  mapWithConcurrency
};
