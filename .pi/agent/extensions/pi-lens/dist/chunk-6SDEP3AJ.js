import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  getProjectDataDir
} from "./chunk-C34ZXZ7O.js";
import "./chunk-2BBLFX75.js";
import "./chunk-XVF2VVXP.js";
import "./chunk-2EECBNC5.js";
import "./chunk-JAU72XNY.js";
import "./chunk-XTMJ7XDT.js";
import "./chunk-JMYYOTQG.js";
import "./chunk-QQNQ7SJW.js";
import {
  redactSecrets
} from "./chunk-AOHZU2BM.js";
import "./chunk-LJDODBBZ.js";
import "./chunk-ABBOA7UD.js";
import "./chunk-N2H3ZPZY.js";
import "./chunk-NXL4FFQQ.js";

// dist/clients/fix-worklog.js
import * as fs from "node:fs";
import * as path from "node:path";
function getWorklogPath(cwd) {
  return path.join(getProjectDataDir(cwd), "worklog.jsonl");
}
function appendToWorklog(cwd, diagnostics, autoFixed, identity) {
  if (diagnostics.length === 0)
    return;
  const worklogPath = getWorklogPath(cwd);
  try {
    fs.mkdirSync(path.dirname(worklogPath), { recursive: true });
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const model = identity?.model?.trim() || void 0;
    const provider = identity?.provider?.trim() || void 0;
    const lines = diagnostics.map((d) => {
      const entry = {
        timestamp,
        filePath: d.filePath,
        rule: d.rule ?? d.id ?? "unknown",
        tool: d.tool,
        message: d.message,
        line: d.line ?? 1,
        column: d.column,
        fixable: d.fixable ?? false,
        fixSuggestion: d.fixSuggestion,
        autoFixed,
        model,
        provider
      };
      return JSON.stringify(entry);
    }).join("\n") + "\n";
    fs.appendFileSync(worklogPath, redactSecrets(lines), "utf8");
  } catch {
  }
}
function readWorklog(cwd) {
  const worklogPath = getWorklogPath(cwd);
  try {
    const raw = fs.readFileSync(worklogPath, "utf8");
    return raw.split(/\r?\n/).filter(Boolean).flatMap((line) => {
      try {
        return [JSON.parse(line)];
      } catch {
        return [];
      }
    });
  } catch {
    return [];
  }
}
function summarizeWorklog(cwd) {
  const entries = readWorklog(cwd);
  const byRule = /* @__PURE__ */ new Map();
  let totalAutoFixed = 0;
  let totalFixable = 0;
  for (const e of entries) {
    const r = byRule.get(e.rule) ?? { count: 0, autoFixed: 0 };
    r.count++;
    if (e.autoFixed) {
      r.autoFixed++;
      totalAutoFixed++;
    }
    if (e.fixable)
      totalFixable++;
    byRule.set(e.rule, r);
  }
  return {
    totalAutoFixed,
    totalFixable,
    byRule: [...byRule.entries()].map(([rule, v]) => ({ rule, ...v })).sort((a, b) => b.count - a.count)
  };
}
export {
  appendToWorklog,
  getWorklogPath,
  readWorklog,
  summarizeWorklog
};
