import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);

// dist/clients/single-flight.js
function createSingleFlight(options = {}) {
  const { generation: readGeneration, coalesceTrailing = false } = options;
  const flights = /* @__PURE__ */ new Map();
  const currentGeneration = () => readGeneration?.() ?? 0;
  const release = (key, flight) => {
    if (flights.get(key) !== flight)
      return;
    flights.delete(key);
  };
  const run = (key, fn) => {
    const existing = flights.get(key);
    if (existing && existing.generation === currentGeneration()) {
      if (coalesceTrailing)
        existing.rerunRequested = true;
      return existing.promise;
    }
    let settle;
    let fail;
    const promise = new Promise((resolve, reject) => {
      settle = resolve;
      fail = reject;
    });
    const flight = {
      promise,
      generation: currentGeneration(),
      rerunRequested: false
    };
    const chain = async () => {
      let result = await fn();
      while (flight.rerunRequested) {
        flight.rerunRequested = false;
        result = await fn();
      }
      return result;
    };
    flights.set(key, flight);
    chain().then((value) => {
      release(key, flight);
      settle(value);
    }, (error) => {
      release(key, flight);
      fail(error);
    });
    return flight.promise;
  };
  return {
    run,
    has: (key) => flights.has(key),
    size: () => flights.size,
    clear: () => flights.clear()
  };
}

export {
  createSingleFlight
};
