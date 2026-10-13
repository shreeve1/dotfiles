import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  WORD_INDEX_FORMAT_VERSION,
  WORD_INDEX_MAX_BYTES,
  WordIndexQueryError,
  _resetWordIndexBuildGuardForTests,
  buildWordIndex,
  buildWordIndexAsync,
  buildWordIndexQueryFilter,
  centralityFromReverseDeps,
  collectWordIndexDocs,
  countWordIndexPostingEntries,
  deserializeWordIndex,
  estimateWordIndexResidentBytes,
  flushWordIndexPersistsForTests,
  flushWordIndexRecompactionsForTests,
  getLastWordIndexSerializeWork,
  getWordIndexBuildStatus,
  getWordIndexWireBytes,
  parseWordIndexQuery,
  recordPersistedWordIndexWireBytes,
  refreshWordIndexIncrementally,
  releaseWordIndexMemoAtSettle,
  removeWordIndexDocument,
  removeWordIndexDocumentAsync,
  scheduleWordIndexPersist,
  searchWordIndex,
  serializeWordIndex,
  splitIdentifier,
  tokenizeLine,
  triggerBackgroundWordIndexBuild,
  updateWordIndexDocument,
  updateWordIndexDocumentAsync,
  updateWordIndexDocumentForEdit,
  wordIndexKey,
  wordIndexPostingHits
} from "./chunk-SAEFPSB6.js";
import "./chunk-GAEGEPOC.js";
import "./chunk-Z3CCVDUB.js";
import "./chunk-BW5KFIQC.js";
import "./chunk-QYF5S6P6.js";
import "./chunk-PHDMFAKM.js";
import "./chunk-2BBLFX75.js";
import "./chunk-XVF2VVXP.js";
import "./chunk-JAU72XNY.js";
import "./chunk-XTMJ7XDT.js";
import "./chunk-JMYYOTQG.js";
import "./chunk-QQNQ7SJW.js";
import "./chunk-AOHZU2BM.js";
import "./chunk-ABBOA7UD.js";
import "./chunk-N2H3ZPZY.js";
import "./chunk-NXL4FFQQ.js";
export {
  WORD_INDEX_FORMAT_VERSION,
  WORD_INDEX_MAX_BYTES,
  WordIndexQueryError,
  _resetWordIndexBuildGuardForTests,
  buildWordIndex,
  buildWordIndexAsync,
  buildWordIndexQueryFilter,
  centralityFromReverseDeps,
  collectWordIndexDocs,
  countWordIndexPostingEntries,
  deserializeWordIndex,
  estimateWordIndexResidentBytes,
  flushWordIndexPersistsForTests,
  flushWordIndexRecompactionsForTests,
  getLastWordIndexSerializeWork,
  getWordIndexBuildStatus,
  getWordIndexWireBytes,
  parseWordIndexQuery,
  recordPersistedWordIndexWireBytes,
  refreshWordIndexIncrementally,
  releaseWordIndexMemoAtSettle,
  removeWordIndexDocument,
  removeWordIndexDocumentAsync,
  scheduleWordIndexPersist,
  searchWordIndex,
  serializeWordIndex,
  splitIdentifier,
  tokenizeLine,
  triggerBackgroundWordIndexBuild,
  updateWordIndexDocument,
  updateWordIndexDocumentAsync,
  updateWordIndexDocumentForEdit,
  wordIndexKey,
  wordIndexPostingHits
};
