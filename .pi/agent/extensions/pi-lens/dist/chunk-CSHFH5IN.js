import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  isTestMode
} from "./chunk-AOHZU2BM.js";

// dist/clients/scanner-temp-root.js
import * as os from "node:os";
function scannerReportParentDir() {
  if (!isTestMode() && process.env.PI_LENS_TEST_SCANNER_HARNESS !== "1")
    return os.tmpdir();
  const override = process.env.PI_LENS_TEST_SCANNER_TMPDIR?.trim();
  return override && override.length > 0 ? override : os.tmpdir();
}

export {
  scannerReportParentDir
};
