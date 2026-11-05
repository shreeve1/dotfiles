#!/usr/bin/env node
import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  analyzeFile
} from "../chunk-LSFXZLPW.js";
import "../chunk-MC6VB2E5.js";
import "../chunk-AGGUWKRK.js";
import "../chunk-PKSUMEPT.js";
import "../chunk-3O5EII3W.js";
import "../chunk-ZKLTNLAW.js";
import "../chunk-KZ4ALBCH.js";
import "../chunk-JPRDTY5S.js";
import "../chunk-RGGH6M34.js";
import "../chunk-RZG472YW.js";
import "../chunk-4W52ZKZX.js";
import "../chunk-BUZIQDFS.js";
import "../chunk-DIWK3LBC.js";
import "../chunk-ZFORSIED.js";
import "../chunk-5F3XF3SX.js";
import "../chunk-FRLAUP2B.js";
import "../chunk-6YUNI7B5.js";
import "../chunk-7TNILKGY.js";
import "../chunk-4B2YFN4U.js";
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
import "../chunk-BHWW6FAX.js";
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
import "../chunk-4BKU7PV3.js";
import "../chunk-GMROJJRN.js";
import "../chunk-NXL4FFQQ.js";

// dist/mcp/worker.js
function arg(name) {
  const prefix = `--${name}=`;
  const found = process.argv.find((value) => value.startsWith(prefix));
  return found ? found.slice(prefix.length) : void 0;
}
async function main() {
  setProjectTrustState("trusted");
  logExtension({
    subsystem: "project-trust",
    level: "debug",
    message: "mcp-worker: workspace trust belongs to the MCP client; pi trust not consulted"
  });
  const file = arg("file");
  const cwd = arg("cwd") ?? process.cwd();
  if (!file) {
    process.stderr.write("worker: --file is required\n");
    process.exit(2);
  }
  let flags;
  const flagsRaw = arg("flags");
  if (flagsRaw) {
    try {
      flags = JSON.parse(flagsRaw);
    } catch {
      process.stderr.write("worker: --flags must be valid JSON\n");
      process.exit(2);
    }
  }
  const result = await analyzeFile(file, cwd, { flags });
  process.stdout.write(JSON.stringify(result), () => process.exit(0));
}
main().catch((err) => {
  process.stderr.write(`worker failed: ${err.message}
`);
  process.exit(1);
});
