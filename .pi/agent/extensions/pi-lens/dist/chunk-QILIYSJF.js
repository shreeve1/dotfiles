import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  collectSourceFiles,
  collectSourceFilesAsync
} from "./chunk-6C7JWPCP.js";

// dist/clients/scan-utils.js
function getSourceFiles(dir, _isTsProject) {
  return collectSourceFiles(dir);
}
function getSourceFilesAsync(dir, _isTsProject) {
  return collectSourceFilesAsync(dir);
}

export {
  getSourceFiles,
  getSourceFilesAsync
};
