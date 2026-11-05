import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  GRAPH_PERSIST_MAX_ELEMENTS_DEFAULT,
  REVIEW_GRAPH_VERSION,
  _getReviewGraphCacheStateForTests,
  _getReviewGraphRebuildCountersForTests,
  _getReviewGraphWorkspaceCacheKeysForTests,
  _getReviewGraphWorkspaceGraphForTests,
  _persistedCoverageForTests,
  _readReviewGraphCheckpointForTests,
  _resetCwdWorktreeMismatchLogForTests,
  _resetReviewGraphBuildAttemptsForTests,
  _resetReviewGraphExtractorCacheForTests,
  _resetReviewGraphRebuildCountersForTests,
  _resetReviewGraphSizeSkipTtlForTests,
  _resetReviewGraphSizeSkipVerdictsForTests,
  _resetReviewGraphSourcePathMemoForTests,
  _resetReviewGraphStageSweepForTests,
  _setLastGraphBuildInfoForTests,
  _setReviewGraphBuildGateForTests,
  _setReviewGraphEntryBudgetForTests,
  _setReviewGraphEntryCounterForTests,
  _setReviewGraphWorkspaceEntryForTests,
  _setSessionReviewGraphFactForTests,
  buildOrUpdateGraph,
  captureReviewGraphStructuralIr,
  clearGraphCache,
  clearReviewGraphWorkspaceCache,
  estimateReviewGraphStoreBytes,
  extractSymbolsAndRefsFromGraph,
  flushReviewGraphPersist,
  flushReviewGraphPersistsForExitForTests,
  flushReviewGraphPersistsForTests,
  formatReviewGraphRevisionDriftNote,
  getCachedReviewGraph,
  getCheckpointOffloadCountForTests,
  getGraphBuildInfoForGraph,
  getGraphImportChanges,
  getGraphSourceFiles,
  getLastGraphBuildInfo,
  getLastReviewGraphBuildAttempt,
  getReviewGraphCacheIdentity,
  getReviewGraphPersistWorkerHeapStatistics,
  getReviewGraphRevisionDrift,
  getReviewGraphSizeSkipVerdict,
  getReviewGraphWorkerFallbackReasonForTests,
  getReviewGraphWorkspaceCacheSnapshot,
  graphBuildInfoIsTrustworthy,
  graphWasmTrapDetail,
  isGraphBuildInFlight,
  isReviewGraphMigrationNeeded,
  mapKindToTreeSitterLanguage,
  refreshReviewGraphPersistWorkerHeapStatistics,
  resetReviewGraphPersistWorkerForTests,
  reviewGraphCachePath,
  terminateReviewGraphPersistWorkerForTests,
  waitForReviewGraphPersistsForTests
} from "./chunk-4B2YFN4U.js";
import "./chunk-3MED75HT.js";
import "./chunk-PKLB2XJL.js";
import "./chunk-2BKUFQKR.js";
import "./chunk-GIRBSBGL.js";
import "./chunk-XIMYZ3JA.js";
import "./chunk-XYLC35E4.js";
import "./chunk-DYRZGUMA.js";
import "./chunk-FHEV6T4L.js";
import "./chunk-ZZDIOAAJ.js";
import "./chunk-VOXTCULR.js";
import "./chunk-5W3R6LFT.js";
import "./chunk-35WKJWO5.js";
import "./chunk-CUDD35TW.js";
import "./chunk-7ANZ7XDD.js";
import "./chunk-WC6WRNQT.js";
import "./chunk-BHWW6FAX.js";
import "./chunk-Z54ZSOBZ.js";
import "./chunk-HHR7WGCI.js";
import "./chunk-HKIL6DCL.js";
import "./chunk-PPKECBPP.js";
import "./chunk-6HWVI6MI.js";
import "./chunk-5RNB4HVK.js";
import "./chunk-CKEQFGLT.js";
import "./chunk-JYLOYTZD.js";
import "./chunk-HUAM7QG3.js";
import "./chunk-HXFUTMX2.js";
import "./chunk-CZL44WFN.js";
import "./chunk-VPLBLWFO.js";
import "./chunk-2BEMIWEW.js";
import "./chunk-IJYGIDF4.js";
import "./chunk-BQG2QFVO.js";
import "./chunk-IYVYZQRL.js";
import "./chunk-VOP4PJKA.js";
import "./chunk-JBP7KESM.js";
import "./chunk-UYXV5NIS.js";
import "./chunk-JZRP4DGP.js";
import "./chunk-SDFKOLSF.js";
import "./chunk-BBET6HD6.js";
import "./chunk-G6JKM4O7.js";
import "./chunk-O2ARHQKF.js";
import "./chunk-WMDUT4KH.js";
import "./chunk-AWQWXSW4.js";
import "./chunk-QYF5S6P6.js";
import "./chunk-G5GV2Q7K.js";
import "./chunk-X35S7HSB.js";
import "./chunk-SQC7K3SP.js";
import "./chunk-JE6HKLC7.js";
import "./chunk-2453RRJ2.js";
import "./chunk-WQV6BI4Q.js";
import "./chunk-S26LC76R.js";
import "./chunk-565VRUP4.js";
import "./chunk-VLQ7UKZH.js";
import "./chunk-LJDODBBZ.js";
import "./chunk-4BKU7PV3.js";
import "./chunk-GMROJJRN.js";
import "./chunk-NXL4FFQQ.js";
export {
  GRAPH_PERSIST_MAX_ELEMENTS_DEFAULT,
  REVIEW_GRAPH_VERSION,
  _getReviewGraphCacheStateForTests,
  _getReviewGraphRebuildCountersForTests,
  _getReviewGraphWorkspaceCacheKeysForTests,
  _getReviewGraphWorkspaceGraphForTests,
  _persistedCoverageForTests,
  _readReviewGraphCheckpointForTests,
  _resetCwdWorktreeMismatchLogForTests,
  _resetReviewGraphBuildAttemptsForTests,
  _resetReviewGraphExtractorCacheForTests,
  _resetReviewGraphRebuildCountersForTests,
  _resetReviewGraphSizeSkipTtlForTests,
  _resetReviewGraphSizeSkipVerdictsForTests,
  _resetReviewGraphSourcePathMemoForTests,
  _resetReviewGraphStageSweepForTests,
  _setLastGraphBuildInfoForTests,
  _setReviewGraphBuildGateForTests,
  _setReviewGraphEntryBudgetForTests,
  _setReviewGraphEntryCounterForTests,
  _setReviewGraphWorkspaceEntryForTests,
  _setSessionReviewGraphFactForTests,
  buildOrUpdateGraph,
  captureReviewGraphStructuralIr,
  clearGraphCache,
  clearReviewGraphWorkspaceCache,
  estimateReviewGraphStoreBytes,
  extractSymbolsAndRefsFromGraph,
  flushReviewGraphPersist,
  flushReviewGraphPersistsForExitForTests,
  flushReviewGraphPersistsForTests,
  formatReviewGraphRevisionDriftNote,
  getCachedReviewGraph,
  getCheckpointOffloadCountForTests,
  getGraphBuildInfoForGraph,
  getGraphImportChanges,
  getGraphSourceFiles,
  getLastGraphBuildInfo,
  getLastReviewGraphBuildAttempt,
  getReviewGraphCacheIdentity,
  getReviewGraphPersistWorkerHeapStatistics,
  getReviewGraphRevisionDrift,
  getReviewGraphSizeSkipVerdict,
  getReviewGraphWorkerFallbackReasonForTests,
  getReviewGraphWorkspaceCacheSnapshot,
  graphBuildInfoIsTrustworthy,
  graphWasmTrapDetail,
  isGraphBuildInFlight,
  isReviewGraphMigrationNeeded,
  mapKindToTreeSitterLanguage,
  refreshReviewGraphPersistWorkerHeapStatistics,
  resetReviewGraphPersistWorkerForTests,
  reviewGraphCachePath,
  terminateReviewGraphPersistWorkerForTests,
  waitForReviewGraphPersistsForTests
};
