import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);

// dist/clients/hard-failure-summary.js
function isHardFailureSummary(summary) {
  return /(timed out|killed|SIGTERM|SIGKILL|SIGABRT)/i.test(summary);
}
var HARD_FAILURE_BACKOFF_MS = 30 * 60 * 1e3;
var HardFailureStamps = class {
  stamps = /* @__PURE__ */ new Map();
  /** A success lifts the root's stamp; a timeout or kill sets it. */
  settle(key, result) {
    if (result.success)
      this.stamps.delete(key);
    else if (isHardFailureSummary(result.summary)) {
      this.stamps.set(key, { at: Date.now(), summary: result.summary });
    }
  }
  /** The summary of the root's last timeout or kill while it is recent; `null` otherwise. */
  recent(key) {
    const stamp = this.stamps.get(key);
    if (!stamp)
      return null;
    if (Date.now() - stamp.at > HARD_FAILURE_BACKOFF_MS) {
      this.stamps.delete(key);
      return null;
    }
    return stamp.summary;
  }
  clear() {
    this.stamps.clear();
  }
};

export {
  isHardFailureSummary,
  HardFailureStamps
};
