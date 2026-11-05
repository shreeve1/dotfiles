import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  parseSymbolKey
} from "./chunk-L3CLUGDY.js";
import {
  isTestRoleCollateral
} from "./chunk-AGGUWKRK.js";
import "./chunk-3MED75HT.js";
import "./chunk-WMDUT4KH.js";
import "./chunk-X35S7HSB.js";
import "./chunk-SQC7K3SP.js";
import "./chunk-JE6HKLC7.js";
import "./chunk-2453RRJ2.js";
import "./chunk-WQV6BI4Q.js";
import "./chunk-S26LC76R.js";
import "./chunk-565VRUP4.js";
import "./chunk-VLQ7UKZH.js";
import "./chunk-LJDODBBZ.js";
import "./chunk-GMROJJRN.js";
import "./chunk-NXL4FFQQ.js";

// dist/clients/project-diagnostics/runner-adapters/call-graph-impact.js
import * as path from "node:path";
function resolveImpactFile(cwd, filePath) {
  return path.isAbsolute(filePath) ? filePath : path.resolve(cwd, filePath);
}
function displayName(key) {
  return parseSymbolKey(key).symbolName ?? key;
}
function severityFor(severity) {
  if (severity === "WillBreak") {
    return {
      severity: "warning",
      message: "Direct caller of a symbol edited this turn \u2014 verify this call site still matches its new signature/behavior."
    };
  }
  if (severity === "MayBreak") {
    return {
      severity: "info",
      message: "Indirect caller (one hop) of a symbol edited this turn \u2014 worth a quick check."
    };
  }
  return null;
}
var SEVERITY_RANK = {
  error: 3,
  warning: 2,
  info: 1,
  hint: 0
};
function callGraphImpactToProjectDiagnostics(cwd, findings) {
  const byKey = /* @__PURE__ */ new Map();
  for (const { calleeKey, results } of findings) {
    const calleeName = displayName(calleeKey);
    for (const result of results) {
      const mapped = severityFor(result.severity);
      if (!mapped)
        continue;
      const { filePath } = parseSymbolKey(result.symbolKey);
      if (!filePath)
        continue;
      const resolvedFile = resolveImpactFile(cwd, filePath);
      if (isTestRoleCollateral(resolvedFile))
        continue;
      const dedupeKey = `${resolvedFile}:${result.symbolKey}`;
      const existing = byKey.get(dedupeKey);
      if (existing && SEVERITY_RANK[existing.severity] >= SEVERITY_RANK[mapped.severity]) {
        continue;
      }
      const callerName = displayName(result.symbolKey);
      byKey.set(dedupeKey, {
        filePath: resolvedFile,
        severity: mapped.severity,
        semantic: "warning",
        tool: "call-graph",
        runner: "call-graph",
        rule: `call-graph:${result.severity.toLowerCase()}`,
        message: `${mapped.message} (${callerName} calls edited symbol '${calleeName}')`,
        source: "project-scan"
      });
    }
  }
  return [...byKey.values()];
}
export {
  callGraphImpactToProjectDiagnostics
};
