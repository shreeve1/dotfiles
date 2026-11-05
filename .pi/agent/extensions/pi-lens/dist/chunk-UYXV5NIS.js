import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);

// dist/clients/background-write-drains.js
var REGISTRY_KEY = /* @__PURE__ */ Symbol.for("pi-lens.background-write-drains.v1");
var host = globalThis;
function registry() {
  const existing = host[REGISTRY_KEY];
  if (existing instanceof Set)
    return existing;
  const fresh = /* @__PURE__ */ new Set();
  host[REGISTRY_KEY] = fresh;
  return fresh;
}
function registerBackgroundWriteDrain(drain) {
  registry().add(drain);
}

export {
  registerBackgroundWriteDrain
};
