import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  loadPiLensProjectConfig
} from "./chunk-2BBLFX75.js";
import {
  lazyEnvNumber,
  toPositiveFinite
} from "./chunk-AOHZU2BM.js";

// dist/clients/project-scale.js
var DEFAULT_PROJECT_SCALE_BASE = 2e3;
var _envBase = lazyEnvNumber("PI_LENS_MAX_PROJECT_FILES", DEFAULT_PROJECT_SCALE_BASE);
function getProjectScaleBase(cwd) {
  if (cwd) {
    const config = loadPiLensProjectConfig(cwd);
    const configBase = toPositiveFinite(config.maxProjectFiles);
    if (configBase > 0)
      return Math.floor(configBase);
  }
  return _envBase.get();
}
var PROJECT_SCALE_RATIOS = {
  /** project-diagnostics scanner: files kept. 0.25 * 2,000 = 500. */
  projectDiagnosticsScanner: 0.25,
  /** review graph: files kept. 0.5 * 2,000 = 1,000. */
  reviewGraph: 0.5,
  /** startup scan: source files counted. 1.25 * 2,000 = 2,500. */
  startupScan: 1.25,
  /** jscpd: directory entries visited (its own gate, not source-filter's). 3 * 2,000 = 6,000. */
  jscpd: 3,
  /** word index: files indexed. 3 * 2,000 = 6,000. */
  wordIndex: 3
};
function deriveBudget(ratio, cwd) {
  return Math.max(1, Math.round(getProjectScaleBase(cwd) * ratio));
}
function getProjectDiagnosticsScannerMaxFiles(cwd) {
  return deriveBudget(PROJECT_SCALE_RATIOS.projectDiagnosticsScanner, cwd);
}
var REVIEW_GRAPH_LINEAR_CEILING_BASE = 4e3;
var REVIEW_GRAPH_TAPER_SCALE = 8e3;
var REVIEW_GRAPH_HARD_CEILING = 5e3;
function taperedReviewGraphMaxFiles(base) {
  const linearValue = base * PROJECT_SCALE_RATIOS.reviewGraph;
  if (base <= REVIEW_GRAPH_LINEAR_CEILING_BASE) {
    return Math.max(1, Math.round(linearValue));
  }
  const boundaryValue = REVIEW_GRAPH_LINEAR_CEILING_BASE * PROJECT_SCALE_RATIOS.reviewGraph;
  const excess = base - REVIEW_GRAPH_LINEAR_CEILING_BASE;
  const taperedExtra = (REVIEW_GRAPH_HARD_CEILING - boundaryValue) * (excess / (excess + REVIEW_GRAPH_TAPER_SCALE));
  return Math.max(1, Math.round(boundaryValue + taperedExtra));
}
function getReviewGraphMaxFilesDerived(cwd) {
  if (cwd) {
    const config = loadPiLensProjectConfig(cwd);
    const configOverride = config.reviewGraph?.maxFiles;
    if (configOverride !== void 0)
      return configOverride;
  }
  return taperedReviewGraphMaxFiles(getProjectScaleBase(cwd));
}
function getStartupScanMaxSourceFilesDerived(cwd) {
  return deriveBudget(PROJECT_SCALE_RATIOS.startupScan, cwd);
}
function getJscpdMaxEntriesDerived(cwd) {
  return deriveBudget(PROJECT_SCALE_RATIOS.jscpd, cwd);
}
function getWordIndexMaxFilesDerived(cwd) {
  return deriveBudget(PROJECT_SCALE_RATIOS.wordIndex, cwd);
}

export {
  getProjectDiagnosticsScannerMaxFiles,
  getReviewGraphMaxFilesDerived,
  getStartupScanMaxSourceFilesDerived,
  getJscpdMaxEntriesDerived,
  getWordIndexMaxFilesDerived
};
