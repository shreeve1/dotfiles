import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  getGlobalPiLensDir
} from "./chunk-WMDUT4KH.js";

// dist/clients/opengrep-rule-pack.js
import * as fs from "node:fs";
import * as path from "node:path";
var OPENGREP_REGISTRY_PACK_URL = "https://semgrep.dev/c/auto";
function cachedOpengrepPackPath() {
  return path.join(getGlobalPiLensDir(), "rules", "opengrep-registry.yaml");
}
function resolveOpengrepRulePack() {
  const cached = cachedOpengrepPackPath();
  try {
    if (fs.statSync(cached).size > 0)
      return cached;
  } catch {
  }
  return void 0;
}
function stripPackRuleIdPrefix(checkId, packPath) {
  const prefix = `${path.dirname(packPath).replace(/^[\\/]+/, "").replace(/[\\/:]+/g, ".")}.`;
  return checkId.startsWith(prefix) ? checkId.slice(prefix.length) : checkId;
}

export {
  OPENGREP_REGISTRY_PACK_URL,
  cachedOpengrepPackPath,
  resolveOpengrepRulePack,
  stripPackRuleIdPrefix
};
