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
} from "../chunk-YYOIQFRS.js";
import "../chunk-3MED75HT.js";
import "../chunk-M6HSLBWY.js";
import "../chunk-IBGIOBEE.js";
import "../chunk-XIMYZ3JA.js";
import "../chunk-EU63SDCG.js";
import "../chunk-VWCXW2E7.js";
import "../chunk-FCSOVF55.js";
import "../chunk-PNQDPDRC.js";
import "../chunk-ZXYDQ3TZ.js";
import "../chunk-5W3R6LFT.js";
import {
  isTreeSitterWasmAborted
} from "../chunk-QHJ6DQ2R.js";
import "../chunk-Z54ZSOBZ.js";
import "../chunk-724UL2TJ.js";
import "../chunk-QOZXJ4NA.js";
import "../chunk-GBPP5P7X.js";
import "../chunk-P7266HLM.js";
import "../chunk-MQLUAEOC.js";
import "../chunk-52FUZI6K.js";
import "../chunk-SAEFPSB6.js";
import "../chunk-GAEGEPOC.js";
import "../chunk-Z3CCVDUB.js";
import "../chunk-L3BLXZG7.js";
import "../chunk-2BEMIWEW.js";
import "../chunk-ACXEQZOU.js";
import "../chunk-Q7DUK4LX.js";
import "../chunk-AW7R2GWG.js";
import "../chunk-RWWYJ623.js";
import "../chunk-VRZP76YM.js";
import "../chunk-QOBUHWHX.js";
import "../chunk-QILIYSJF.js";
import "../chunk-6C7JWPCP.js";
import "../chunk-5NGR67U5.js";
import "../chunk-C34ZXZ7O.js";
import "../chunk-BW5KFIQC.js";
import "../chunk-QYF5S6P6.js";
import "../chunk-PHDMFAKM.js";
import "../chunk-2BBLFX75.js";
import "../chunk-XVF2VVXP.js";
import {
  setProjectTrustState
} from "../chunk-ZANLILYD.js";
import "../chunk-2EECBNC5.js";
import "../chunk-JAU72XNY.js";
import {
  logExtension
} from "../chunk-XTMJ7XDT.js";
import "../chunk-JMYYOTQG.js";
import "../chunk-QQNQ7SJW.js";
import "../chunk-AOHZU2BM.js";
import "../chunk-LJDODBBZ.js";
import {
  FactStore
} from "../chunk-CHOW74WE.js";
import "../chunk-ABBOA7UD.js";
import "../chunk-N2H3ZPZY.js";
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
