import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  parseSymbolKey
} from "./chunk-WOA4LN2R.js";
import "./chunk-3MED75HT.js";
import {
  isBuildArtifact
} from "./chunk-6C7JWPCP.js";
import "./chunk-5NGR67U5.js";
import {
  getProjectDataDir
} from "./chunk-C34ZXZ7O.js";
import "./chunk-QYF5S6P6.js";
import "./chunk-PHDMFAKM.js";
import {
  detectFileRole
} from "./chunk-2BBLFX75.js";
import "./chunk-XVF2VVXP.js";
import {
  writeFileAtomic
} from "./chunk-2EECBNC5.js";
import "./chunk-JAU72XNY.js";
import "./chunk-XTMJ7XDT.js";
import "./chunk-JMYYOTQG.js";
import "./chunk-QQNQ7SJW.js";
import "./chunk-AOHZU2BM.js";
import "./chunk-LJDODBBZ.js";
import "./chunk-ABBOA7UD.js";
import {
  isExternalOrVendorFile
} from "./chunk-N2H3ZPZY.js";
import "./chunk-NXL4FFQQ.js";

// dist/clients/codebase-model.js
import * as fs from "node:fs";
import * as path from "node:path";
var DEFAULT_CODEBASE_MODEL_TOKEN_BUDGET = 1500;
var MAX_CALLS_PER_SYMBOL = 10;
var MIN_IN_DEGREE = 0.5;
var CODEBASE_MODEL_VERSION = 1;
function inferKind(symbolKey) {
  const parsed = parseSymbolKey(symbolKey);
  if (parsed.kind === "class")
    return "class";
  if (parsed.kind === "method" || parsed.symbolName?.includes("."))
    return "method";
  return /^[A-Z]/.test(parsed.symbolName ?? "") ? "class" : "function";
}
function estimateTokens(entry) {
  const text = [
    entry.name,
    entry.file,
    entry.calls.join(","),
    entry.calledBy.join(",")
  ].join(" ");
  return Math.ceil(text.length / 4) + 5;
}
function buildCodebaseModel(graph, cwd, budget = DEFAULT_CODEBASE_MODEL_TOKEN_BUDGET, identity) {
  const modelIdentity = identity ?? {
    reviewGraphVersion: graph.builtAt || "call-graph-unknown",
    reviewGraphSignature: graph.builtAt || "call-graph-unknown"
  };
  const ranked = [...graph.inDegree.entries()].filter(([, score]) => score >= MIN_IN_DEGREE).sort(([, a], [, b]) => b - a);
  const entries = [];
  let totalTokens = 0;
  const seenNames = /* @__PURE__ */ new Set();
  for (const [calleeKey, inDegree] of ranked) {
    if (totalTokens >= budget)
      break;
    const parsedCallee = parseSymbolKey(calleeKey);
    const name = parsedCallee.symbolName ?? calleeKey;
    const filePath = parsedCallee.filePath;
    const fileRole = detectFileRole(filePath);
    if (fileRole === "test" || fileRole === "generated" || isExternalOrVendorFile(filePath, cwd) || isBuildArtifact(filePath)) {
      continue;
    }
    if (seenNames.has(name))
      continue;
    seenNames.add(name);
    const calls = [...graph.callees.get(calleeKey) ?? /* @__PURE__ */ new Set()].map((k) => parseSymbolKey(k).symbolName ?? k).filter(Boolean).slice(0, MAX_CALLS_PER_SYMBOL);
    const calledBy = [...graph.callers.get(calleeKey) ?? /* @__PURE__ */ new Set()].map((k) => parseSymbolKey(k).symbolName ?? k).filter((n) => !n.startsWith("file:")).slice(0, MAX_CALLS_PER_SYMBOL);
    const file = filePath ? path.relative(cwd, filePath).replace(/\\/g, "/") : "unknown";
    const draft = {
      file,
      name,
      kind: inferKind(calleeKey),
      calls,
      calledBy,
      inDegree
    };
    const tokens = estimateTokens(draft);
    if (totalTokens + tokens > budget)
      continue;
    entries.push({ ...draft, tokens });
    totalTokens += tokens;
  }
  const allFiles = new Set([...graph.callers.keys(), ...graph.callees.keys()].map((k) => parseSymbolKey(k).filePath).filter(Boolean));
  return {
    version: CODEBASE_MODEL_VERSION,
    reviewGraphVersion: modelIdentity.reviewGraphVersion,
    reviewGraphSignature: modelIdentity.reviewGraphSignature,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    totalSymbols: graph.inDegree.size,
    totalFiles: allFiles.size,
    entries,
    totalTokens
  };
}
function cacheFilePath(cwd) {
  return path.join(getProjectDataDir(cwd), "cache", "codebase-model.json");
}
function metaFilePath(cwd) {
  return path.join(getProjectDataDir(cwd), "cache", "codebase-model.meta.json");
}
function saveCodebaseModel(cwd, model) {
  const cacheFile = cacheFilePath(cwd);
  try {
    fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
    writeFileAtomic(cacheFile, JSON.stringify(model));
    writeFileAtomic(metaFilePath(cwd), JSON.stringify({
      savedAt: (/* @__PURE__ */ new Date()).toISOString(),
      entryCount: model.entries.length,
      totalTokens: model.totalTokens
    }));
  } catch {
  }
}
function loadCodebaseModel(cwd, expectedIdentity) {
  try {
    const raw = JSON.parse(fs.readFileSync(cacheFilePath(cwd), "utf-8"));
    if (raw.version !== CODEBASE_MODEL_VERSION || typeof raw.reviewGraphVersion !== "string" || raw.reviewGraphVersion.length === 0 || typeof raw.reviewGraphSignature !== "string" || raw.reviewGraphSignature.length === 0 || typeof raw.generatedAt !== "string" || !Array.isArray(raw.entries))
      return void 0;
    if (raw.reviewGraphVersion !== expectedIdentity.reviewGraphVersion || raw.reviewGraphSignature !== expectedIdentity.reviewGraphSignature)
      return void 0;
    return raw;
  } catch {
    return void 0;
  }
}
export {
  CODEBASE_MODEL_VERSION,
  DEFAULT_CODEBASE_MODEL_TOKEN_BUDGET,
  buildCodebaseModel,
  loadCodebaseModel,
  saveCodebaseModel
};
