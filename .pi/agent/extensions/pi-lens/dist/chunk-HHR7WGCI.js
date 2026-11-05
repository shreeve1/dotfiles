import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  getGlobalPiLensDir
} from "./chunk-WMDUT4KH.js";
import {
  getTurnId
} from "./chunk-VLQ7UKZH.js";
import {
  BoundedFifoMap
} from "./chunk-GMROJJRN.js";

// dist/clients/custom-rule-locations.js
import * as path from "node:path";
function getUserRuleRoot() {
  return path.join(getGlobalPiLensDir(), "rules");
}
var RULE_CORPUS_CYCLE_ENTRIES = 16;
var ruleCorpusCycleFingerprints = new BoundedFifoMap(RULE_CORPUS_CYCLE_ENTRIES);
var cycleSlot;
function ruleCorpusFingerprintForCycle(family, root, compute, force = false) {
  const cycle = getTurnId();
  if (!force && cycleSlot !== void 0 && cycleSlot.cycle === cycle && cycleSlot.family === family && cycleSlot.root === root) {
    return cycleSlot.fingerprint;
  }
  const key = `${cycle}\0${family}\0${root}`;
  let fingerprint = force ? void 0 : ruleCorpusCycleFingerprints.get(key);
  if (fingerprint === void 0) {
    fingerprint = compute(root);
    ruleCorpusCycleFingerprints.set(key, fingerprint);
  }
  cycleSlot = { cycle, family, root, fingerprint };
  return fingerprint;
}

export {
  getUserRuleRoot,
  ruleCorpusFingerprintForCycle
};
