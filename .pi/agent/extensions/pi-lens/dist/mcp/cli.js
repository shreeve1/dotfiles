#!/usr/bin/env node
import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  buildOrUpdateGraph,
  flushReviewGraphPersist,
  getGraphBuildInfoForGraph,
  getLastGraphBuildInfo,
  getLastReviewGraphBuildAttempt,
  graphWasmTrapDetail,
  reviewGraphCachePath
} from "../chunk-4B2YFN4U.js";
import "../chunk-3MED75HT.js";
import "../chunk-PKLB2XJL.js";
import "../chunk-2BKUFQKR.js";
import "../chunk-GIRBSBGL.js";
import "../chunk-XIMYZ3JA.js";
import "../chunk-XYLC35E4.js";
import "../chunk-DYRZGUMA.js";
import "../chunk-FHEV6T4L.js";
import "../chunk-ZZDIOAAJ.js";
import "../chunk-VOXTCULR.js";
import "../chunk-5W3R6LFT.js";
import "../chunk-35WKJWO5.js";
import "../chunk-CUDD35TW.js";
import "../chunk-7ANZ7XDD.js";
import "../chunk-WC6WRNQT.js";
import {
  isTreeSitterWasmAborted
} from "../chunk-BHWW6FAX.js";
import "../chunk-Z54ZSOBZ.js";
import "../chunk-HHR7WGCI.js";
import "../chunk-HKIL6DCL.js";
import "../chunk-PPKECBPP.js";
import "../chunk-6HWVI6MI.js";
import "../chunk-5RNB4HVK.js";
import "../chunk-CKEQFGLT.js";
import "../chunk-JYLOYTZD.js";
import "../chunk-HUAM7QG3.js";
import "../chunk-HXFUTMX2.js";
import "../chunk-CZL44WFN.js";
import "../chunk-VPLBLWFO.js";
import "../chunk-2BEMIWEW.js";
import "../chunk-IJYGIDF4.js";
import "../chunk-BQG2QFVO.js";
import "../chunk-IYVYZQRL.js";
import "../chunk-VOP4PJKA.js";
import "../chunk-JBP7KESM.js";
import "../chunk-UYXV5NIS.js";
import "../chunk-JZRP4DGP.js";
import "../chunk-SDFKOLSF.js";
import "../chunk-BBET6HD6.js";
import "../chunk-G6JKM4O7.js";
import "../chunk-O2ARHQKF.js";
import "../chunk-WMDUT4KH.js";
import "../chunk-AWQWXSW4.js";
import "../chunk-QYF5S6P6.js";
import "../chunk-G5GV2Q7K.js";
import "../chunk-X35S7HSB.js";
import "../chunk-SQC7K3SP.js";
import {
  setProjectTrustState
} from "../chunk-JE6HKLC7.js";
import "../chunk-2453RRJ2.js";
import {
  logExtension
} from "../chunk-WQV6BI4Q.js";
import "../chunk-S26LC76R.js";
import "../chunk-565VRUP4.js";
import "../chunk-VLQ7UKZH.js";
import "../chunk-LJDODBBZ.js";
import {
  FactStore
} from "../chunk-4BKU7PV3.js";
import "../chunk-GMROJJRN.js";
import "../chunk-NXL4FFQQ.js";

// dist/mcp/cli.js
import * as fs from "node:fs";
import * as path from "node:path";
process.env.PI_LENS_GRAPH_PERSIST_DEBOUNCE_MS = "3600000";
function cwdArg() {
  const equals = process.argv.find((arg) => arg.startsWith("--cwd="));
  if (equals)
    return equals.slice("--cwd=".length);
  const index = process.argv.indexOf("--cwd");
  if (index >= 0) {
    const value = process.argv[index + 1];
    if (!value || value.startsWith("-"))
      throw new Error("--cwd requires a directory");
    return value;
  }
  return process.cwd();
}
var FAILED = /* @__PURE__ */ Symbol("build-graph-failed");
function fail(reason) {
  process.stderr.write(`pi-lens build-graph failed: ${reason}
`);
  process.exitCode = 1;
  throw FAILED;
}
async function buildGraph() {
  const cwd = path.resolve(cwdArg());
  let stat;
  try {
    stat = fs.statSync(cwd);
  } catch (err) {
    fail(`cannot access cwd ${cwd}: ${err.message}`);
  }
  if (!stat.isDirectory())
    fail(`cwd is not a directory: ${cwd}`);
  const startedAt = Date.now();
  const graph = await buildOrUpdateGraph(cwd, [], new FactStore("mcp-cli"));
  const attempt = getLastReviewGraphBuildAttempt(cwd);
  if (!attempt || attempt.outcome !== "succeeded") {
    fail(attempt?.reason ?? attempt?.outcome ?? "build produced no result");
  }
  const persisted = flushReviewGraphPersist(cwd);
  if (!persisted.ok) {
    const buildInfo = getLastGraphBuildInfo();
    const snapshotPath = reviewGraphCachePath(cwd);
    if (!buildInfo.graphChanged && fs.existsSync(snapshotPath)) {
      const bytes = fs.statSync(snapshotPath).size;
      const durationMs2 = Date.now() - startedAt;
      process.stdout.write(`pi-lens build-graph: snapshot already current (mode=${buildInfo.mode}) files=${graph.fileNodes.size} nodes=${graph.nodes.size} edges=${graph.edges.length} jsonBytes=${bytes} durationMs=${durationMs2}
`);
      return;
    }
    fail(persisted.reason ?? "graph snapshot was not persisted");
  }
  const durationMs = Date.now() - startedAt;
  const coverage = persisted.coverage;
  const wasmTrappedFiles = getGraphBuildInfoForGraph(graph).wasmTrappedFiles ?? 0;
  const wasmAborted = isTreeSitterWasmAborted();
  if (wasmAborted || wasmTrappedFiles > 0) {
    const degraded = wasmAborted ? "review graph degraded \u2014 tree-sitter disabled for this process until restart" : graphWasmTrapDetail(wasmTrappedFiles);
    const recovery = wasmAborted ? "" : "those files were skipped and are re-extracted on the next build; ";
    process.stdout.write(`pi-lens build-graph: ${degraded}; ${recovery}` + (coverage?.partial ? `PARTIAL persist (cap=${coverage.cap} exceeded) persistedNodes=${coverage.persistedNodes}/${coverage.totalNodes} persistedEdges=${coverage.persistedEdges}/${coverage.totalEdges} ` : "") + `files=${graph.fileNodes.size} nodes=${graph.nodes.size} edges=${graph.edges.length} elements=${persisted.elements} jsonBytes=${persisted.bytes} durationMs=${durationMs}
`);
    return;
  }
  if (coverage?.partial) {
    process.stdout.write(`pi-lens build-graph: PARTIAL persist (cap=${coverage.cap} exceeded) files=${graph.fileNodes.size} nodes=${graph.nodes.size} edges=${graph.edges.length} persistedNodes=${coverage.persistedNodes}/${coverage.totalNodes} persistedEdges=${coverage.persistedEdges}/${coverage.totalEdges} elements=${persisted.elements} jsonBytes=${persisted.bytes} durationMs=${durationMs}
`);
    return;
  }
  process.stdout.write(`pi-lens build-graph: files=${graph.fileNodes.size} nodes=${graph.nodes.size} edges=${graph.edges.length} elements=${persisted.elements} jsonBytes=${persisted.bytes} durationMs=${durationMs}
`);
}
async function main() {
  setProjectTrustState("trusted");
  logExtension({
    subsystem: "project-trust",
    level: "debug",
    message: "build-graph: workspace trust belongs to the calling client; pi trust not consulted"
  });
  const command = process.argv[2];
  if (command !== "build-graph") {
    fail("usage: pi-lens build-graph [--cwd <dir>]");
  }
  await buildGraph();
}
main().catch((err) => {
  if (err === FAILED)
    return;
  process.stderr.write(`pi-lens build-graph failed: ${err instanceof Error ? err.message : String(err)}
`);
  process.exitCode = 1;
});
