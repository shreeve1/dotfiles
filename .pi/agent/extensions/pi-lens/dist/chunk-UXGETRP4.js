import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  PROJECT_SNAPSHOT_MAX_WARM_ROOTS,
  PROJECT_SNAPSHOT_VERSION,
  SNAPSHOT_PARSE_CACHE_MAX,
  _failedSnapshotPersistKeysForTests,
  _getAuthoritativeSnapshotCacheKeysForTests,
  _projectSnapshotParseCacheRetainsWordIndexForTests,
  _resetProjectSnapshotParseCacheForTests,
  _seedFailedSnapshotPersistForTests,
  _seedSnapshotParseCacheForTests,
  _seedSuccessfulSnapshotPersistForTests,
  _snapshotParseCacheGetForTests,
  _snapshotParseCacheKeysForTests,
  _stripTopLevelJsonKeysForTests,
  _successfulSnapshotPersistGetForTests,
  _successfulSnapshotPersistKeysForTests,
  buildProjectSnapshotFromRuntime,
  flushProjectSnapshotPersistsForTests,
  getLastNarrowParseDigestForTests,
  getProjectSnapshotLegacyPath,
  getProjectSnapshotMetaPath,
  getProjectSnapshotPath,
  getProjectSnapshotPersistErrorForTests,
  getProjectSnapshotPersistStateForTests,
  getProjectSnapshotPersistWorkerHeapStatistics,
  getSnapshotBodyReadCountForTests,
  hydrateRuntimeFromProjectSnapshot,
  hydrateRuntimeFromProjectSnapshotIfIdle,
  isProjectSnapshotFresh,
  isProjectSnapshotMetaStale,
  loadProjectSnapshot,
  loadProjectSnapshotExportsAndRules,
  loadProjectSnapshotWithoutWordIndex,
  readProjectSnapshotMeta,
  refreshProjectSnapshotPersistWorkerHeapStatistics,
  resetLastNarrowParseDigestForTests,
  resetProjectSnapshotPersistWorkerForTests,
  resetSnapshotBodyReadCountForTests,
  runSnapshotPersistExitFlushForTests,
  saveProjectSnapshot,
  saveRuntimeProjectSnapshot,
  setProjectSnapshotGenerationGateForTests,
  setProjectSnapshotPromotionSeamForTests,
  terminateProjectSnapshotPersistWorkerForTests,
  waitForProjectSnapshotPersistsForTests
} from "./chunk-ZXYDQ3TZ.js";
import "./chunk-SAEFPSB6.js";
import "./chunk-GAEGEPOC.js";
import "./chunk-Z3CCVDUB.js";
import "./chunk-2BEMIWEW.js";
import "./chunk-C34ZXZ7O.js";
import "./chunk-BW5KFIQC.js";
import "./chunk-QYF5S6P6.js";
import "./chunk-PHDMFAKM.js";
import "./chunk-2BBLFX75.js";
import "./chunk-XVF2VVXP.js";
import "./chunk-2EECBNC5.js";
import "./chunk-JAU72XNY.js";
import "./chunk-XTMJ7XDT.js";
import "./chunk-JMYYOTQG.js";
import "./chunk-QQNQ7SJW.js";
import "./chunk-AOHZU2BM.js";
import "./chunk-LJDODBBZ.js";
import "./chunk-ABBOA7UD.js";
import "./chunk-N2H3ZPZY.js";
import "./chunk-NXL4FFQQ.js";
export {
  PROJECT_SNAPSHOT_MAX_WARM_ROOTS,
  PROJECT_SNAPSHOT_VERSION,
  SNAPSHOT_PARSE_CACHE_MAX,
  _failedSnapshotPersistKeysForTests,
  _getAuthoritativeSnapshotCacheKeysForTests,
  _projectSnapshotParseCacheRetainsWordIndexForTests,
  _resetProjectSnapshotParseCacheForTests,
  _seedFailedSnapshotPersistForTests,
  _seedSnapshotParseCacheForTests,
  _seedSuccessfulSnapshotPersistForTests,
  _snapshotParseCacheGetForTests,
  _snapshotParseCacheKeysForTests,
  _stripTopLevelJsonKeysForTests,
  _successfulSnapshotPersistGetForTests,
  _successfulSnapshotPersistKeysForTests,
  buildProjectSnapshotFromRuntime,
  flushProjectSnapshotPersistsForTests,
  getLastNarrowParseDigestForTests,
  getProjectSnapshotLegacyPath,
  getProjectSnapshotMetaPath,
  getProjectSnapshotPath,
  getProjectSnapshotPersistErrorForTests,
  getProjectSnapshotPersistStateForTests,
  getProjectSnapshotPersistWorkerHeapStatistics,
  getSnapshotBodyReadCountForTests,
  hydrateRuntimeFromProjectSnapshot,
  hydrateRuntimeFromProjectSnapshotIfIdle,
  isProjectSnapshotFresh,
  isProjectSnapshotMetaStale,
  loadProjectSnapshot,
  loadProjectSnapshotExportsAndRules,
  loadProjectSnapshotWithoutWordIndex,
  readProjectSnapshotMeta,
  refreshProjectSnapshotPersistWorkerHeapStatistics,
  resetLastNarrowParseDigestForTests,
  resetProjectSnapshotPersistWorkerForTests,
  resetSnapshotBodyReadCountForTests,
  runSnapshotPersistExitFlushForTests,
  saveProjectSnapshot,
  saveRuntimeProjectSnapshot,
  setProjectSnapshotGenerationGateForTests,
  setProjectSnapshotPromotionSeamForTests,
  terminateProjectSnapshotPersistWorkerForTests,
  waitForProjectSnapshotPersistsForTests
};
