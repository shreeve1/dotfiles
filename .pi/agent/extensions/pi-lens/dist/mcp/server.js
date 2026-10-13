#!/usr/bin/env node
import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  DEAD_CODE_DELTA_MAX_SHOWN,
  deadCodeIssueCount,
  deadCodeIssueKey,
  deadCodeIssues,
  formatDeadCodeDelta,
  stableFindingKey
} from "../chunk-OCAGUNBC.js";
import {
  clearFormatterCache
} from "../chunk-3W7IEVVL.js";
import {
  findNearestProjectRoot,
  isStartupScanVerdictFresh,
  resolveStartupScanContext
} from "../chunk-3VPVG5SU.js";
import {
  loadCallGraph
} from "../chunk-WOA4LN2R.js";
import {
  isHardFailureSummary
} from "../chunk-7U2IDNXN.js";
import {
  RUNNERS,
  formatRunDurationMs,
  isExcludedTestTarget,
  isRunnerErrorResult
} from "../chunk-VCO24T4L.js";
import {
  GovulncheckClient
} from "../chunk-SQ4TVJBR.js";
import {
  GitleaksClient,
  classifyAndFilterFindings
} from "../chunk-SS36ZX4J.js";
import "../chunk-ZGDGW2V3.js";
import {
  resetManagedToolRefreshSession
} from "../chunk-UXVNL3D7.js";
import {
  MAX_ADVISORY_AFFECTED_FILES,
  acknowledgeTestFindings,
  acknowledgeTurnEndFindings,
  advisoryPathKey,
  consumeSessionStartGuidance,
  consumeTestFindings,
  consumeTurnEndFindings,
  gateFindingsByPathFreshness,
  parseScannedAtMs,
  peekTestFindings,
  peekTurnEndFindings,
  snapshotAdvisoryProvenance,
  validateAdvisoryProvenance
} from "../chunk-KBG47GHP.js";
import {
  CacheManager,
  DELTA_UNUSED_PROMOTION_NOTE,
  MCP_TURN_STATE_OWNER_ID,
  acquireWarmWordIndex,
  admitsProjectWideFindings,
  analyzeFile,
  applyFindingPolicy,
  applyLspFindingPolicy,
  applyPushedFindingPolicy,
  applyRulePolicy,
  canHandle,
  cascadeCarrySuffix,
  cascadeSettleWaitMs,
  convertLspDiagnostics,
  createDispatchContext,
  createMcpHost,
  demoteInferredProjectDiagnostics,
  demoteInferredProjectSweepResults,
  drainPendingRunnerFindings,
  dropStaleRunnerFindings,
  evaluateAstGrepRules,
  evaluateRules,
  filterFindingsByDisposition,
  formatCacheAgeLabel,
  formatDiagnostics,
  getAvailableRunners,
  getDiagnosticTracker,
  getLang,
  getLatencyReports,
  getToolPlan,
  inlineBlockerIdentities,
  loadProjectRulePolicyMap,
  loadSg,
  logCascade,
  markUnreconciledFindings,
  normalizeRuleId,
  pendingRunnerFindingsSize,
  requeueRunnerFindings,
  resetCascadeTierSessionState,
  resetDispatchBaselines,
  resetObservedRunnerLatency,
  resetPendingRunnerFindings,
  resetPsScriptAnalyzerAvailability,
  runProviders
} from "../chunk-H6MF6EVN.js";
import {
  resetLazyInstallAttempts
} from "../chunk-OXXKQCSV.js";
import {
  isTestRoleCollateral
} from "../chunk-EJIUXPBX.js";
import {
  findingsResult,
  hasUsableResult
} from "../chunk-2CD5RS6M.js";
import "../chunk-FC4RP4I2.js";
import "../chunk-UZ3TUTRV.js";
import {
  resetGoAvailability
} from "../chunk-XMSXXAHW.js";
import {
  TrivyClient
} from "../chunk-77M37OKR.js";
import "../chunk-CSHFH5IN.js";
import "../chunk-VCHXCQFG.js";
import "../chunk-3EFKIGZN.js";
import {
  resetRustAvailability
} from "../chunk-MRXKYPCS.js";
import "../chunk-7DYBLXYA.js";
import "../chunk-AB3YYG6N.js";
import {
  getSgCommand,
  resetDispatchAvailabilityState,
  resolveManagedToolClient
} from "../chunk-YSZNHOBY.js";
import "../chunk-RPLINGVB.js";
import "../chunk-XCJN5IJU.js";
import "../chunk-76MWC2K6.js";
import "../chunk-GXW6K4YJ.js";
import "../chunk-2B73ZPOK.js";
import {
  SYMBOL_KIND_NAMES,
  captureReviewGraphStructuralIr,
  formatReviewGraphRevisionDriftNote,
  publishReviewGraphFileIr,
  reviewGraphIrContentHash
} from "../chunk-YYOIQFRS.js";
import {
  buildSymbolId
} from "../chunk-3MED75HT.js";
import {
  DEPENDENCY_DRIFT_MAX_DELIVERIES,
  MAX_LATE_AUX_REARMS,
  PAST_EOF_STALE_MARKER,
  RUNTIME_CONFIG,
  ReadGuard,
  STALE_LINE_MARKER,
  Text,
  TreeSitterSymbolExtractor,
  WriteOrderingGuard,
  anchorsForDiagnostic,
  applyAuxiliarySuppressions,
  applyDispositions,
  applyDispositionsMultiFile,
  applyWeakDispositions,
  applyWorkspaceEdit,
  armDeferredLspWork,
  attemptTsserverSyncDiagnostics,
  beginScope,
  buildScopeKey,
  canRearmPendingAuxiliary,
  classifyDiagnosticTier,
  clearAllSessions,
  countRetainedSuppressedRows,
  createFileTime,
  createLazyImport,
  createLiveBusEmitter,
  createWorkspaceDiagnosticsCacheContext,
  demotePastEofDiagnostics,
  drainPendingAuxCapEvictedCount,
  drainPendingAuxiliaryCoverage,
  drainRenderedDependencyDriftFilePaths,
  exceedsLspSyncLimits,
  findAuxiliaryProfileForSource,
  getActiveSessionId,
  getDisposition,
  getFileDiagnosticSummaries,
  getLSPService,
  getLspBudgetIdleTimeoutMs,
  getMutationBridge,
  getWidgetBlockingFilesForSweep,
  groupFilesByPrimaryServer,
  hasAnyDispositionMarks,
  hasStrictDispositionMarks,
  hashDiagnosticContent,
  incrementWidgetDependencyDriftDelivery,
  isAuxBacklogPublished,
  isBlocking,
  isPendingAuxiliaryPastRearmTtl,
  isWarmAttached,
  loadLspService,
  logBusEvent,
  markWidgetFileBlockersStale,
  newLspMutationCorrelationId,
  nextOrderTurn,
  pendingAuxiliaryCoverageSize,
  rearmPendingAuxiliaryCoverage,
  reconcileCorrelatedScanDiagnostics,
  reconcileScanDiagnostics,
  reconcileStaleWidgetDependencyBlockers,
  reconcileStaleWidgetFiles,
  recordLspMutationOutcome,
  recordRunner,
  recordStaleBusFailure,
  refuseStaleWorkspaceEdit,
  registerDeferredLspWork,
  resetLSPService,
  resetLspMutationNoBridgeDbgLatch,
  resetObservedMutationNet,
  resetOpaqueMutationState,
  resetPendingAuxiliaryCoverage,
  resetWorkspaceDiagnosticsCacheSession,
  resolveImportToFiles,
  resolveLiveBusEmitter,
  resyncDocumentOnPastEof,
  retagAuxiliaryDiagnostics,
  retireScope,
  retireWidgetDependencyDriftBlockers,
  runPerServerGroups,
  scopeCell,
  setSessionLanguages,
  shouldShortenLspIdleTimeout,
  summarizeWorkspaceEdit,
  sweepInlineBlockerFreshness,
  symbolExtractionGrammar,
  touchCompletedConfirmationPolicy,
  touchCoverageGap,
  tryWarmAttachedDiagnostics,
  widgetDiagnosticUri,
  workspaceEditTextPaths,
  writeOrderToken
} from "../chunk-M6HSLBWY.js";
import {
  hashText,
  normalizeMessage,
  primePersistedMutationAttribution,
  resetMutationAttribution,
  stableFindingId
} from "../chunk-IBGIOBEE.js";
import {
  mapWithConcurrency
} from "../chunk-XIMYZ3JA.js";
import {
  canWriteAnalysisRoot,
  classifyCascadeWaitTier,
  customServerSpecsOf,
  describeRootFallback,
  explainServersForFile,
  getAstGrepRuleFingerprint,
  getServersForFileWithConfig,
  initLSPConfig,
  isAuxiliary,
  isSameOrWithin,
  loadLSPConfig,
  lspConfigOf,
  primaryServerId,
  registerLSPConfig,
  resetDirectLspCommandAvailability,
  resetLSPCaseSensitivityState,
  resolveLspCwdForFile,
  shouldInitializeSessionRoot
} from "../chunk-EU63SDCG.js";
import "../chunk-VWCXW2E7.js";
import {
  emitBounded,
  hasAmbientPythonEnvironment,
  resetBoundedTelemetry
} from "../chunk-FCSOVF55.js";
import {
  resolveGitCheckout,
  resolveLinkedWorktreeOwner
} from "../chunk-PNQDPDRC.js";
import {
  PROJECT_SNAPSHOT_VERSION,
  getProjectSnapshotLegacyPath,
  getProjectSnapshotPath,
  hydrateRuntimeFromProjectSnapshot,
  hydrateRuntimeFromProjectSnapshotIfIdle,
  isProjectSnapshotFresh,
  isProjectSnapshotMetaStale,
  loadProjectSnapshot,
  loadProjectSnapshotExportsAndRules,
  loadProjectSnapshotWithoutWordIndex,
  readJsonCache,
  readProjectSnapshotMeta,
  saveRuntimeProjectSnapshot
} from "../chunk-ZXYDQ3TZ.js";
import "../chunk-5W3R6LFT.js";
import {
  EXT_TO_LANG,
  classifyTreeSitterWasmError,
  getSharedTreeSitterClient,
  getTreeSitterRuntimeStatus,
  isTreeSitterWasmAborted,
  logTreeSitter,
  logTreeSitterCacheStats,
  queriesForLanguage,
  queryLoader,
  reportBundledResourceDirHealth,
  resolveTreeSitterLanguage
} from "../chunk-QHJ6DQ2R.js";
import "../chunk-Z54ZSOBZ.js";
import {
  SCAN_LANGUAGE_PRIORITY,
  extensionsForLanguage,
  extensionsForLanguageToken,
  getUserRuleRoot,
  resolveLanguage
} from "../chunk-724UL2TJ.js";
import {
  dump,
  resolvePackagePath
} from "../chunk-QOZXJ4NA.js";
import "../chunk-GBPP5P7X.js";
import "../chunk-P7266HLM.js";
import {
  SWEEP_IDLE_SAFETY_MARGIN_MS,
  getFullScanWallClockMs,
  isWorkspaceSweepActive,
  runWhenWorkspaceSweepIdle
} from "../chunk-MQLUAEOC.js";
import {
  HOOK_WALL_BUDGET_MS,
  bounded,
  combineAbortSignals,
  withDeadline
} from "../chunk-52FUZI6K.js";
import {
  centralityFromReverseDeps,
  getWordIndexBuildStatus,
  logWordIndex,
  searchWordIndex,
  triggerBackgroundWordIndexBuild
} from "../chunk-SAEFPSB6.js";
import {
  getProjectDiagnosticsScannerMaxFiles
} from "../chunk-GAEGEPOC.js";
import {
  PathKeyedMap
} from "../chunk-Z3CCVDUB.js";
import {
  WARM_TURN_END_SCHEMA_VERSION,
  createWarmIpcLineReader,
  createWarmIpcRequestQueue,
  freshnessFromMtime,
  ipcPathForCwd,
  readTurnEndStatus,
  resolveRunnerPath,
  toRunnerDisplayPath
} from "../chunk-L3BLXZG7.js";
import "../chunk-2BEMIWEW.js";
import {
  commitDurableStore,
  resetResolvedPathCache,
  resetZizmorTokenAvailability
} from "../chunk-ACXEQZOU.js";
import {
  resolveToolCwd
} from "../chunk-Q7DUK4LX.js";
import {
  _resetPackageManagerCache,
  findGlobalBinary,
  pmBinary,
  resolveNodePackageManager,
  runScriptArgs
} from "../chunk-AW7R2GWG.js";
import {
  getIsolatedNpxSpawnOptions,
  probeToolAsync
} from "../chunk-RWWYJ623.js";
import {
  classifyProbeFailure,
  createAvailabilityLatch,
  describeInstallAttempt,
  logAvailabilityDecision,
  resetInstallRetryLatches,
  startHostStallSampler
} from "../chunk-VRZP76YM.js";
import {
  canRunStartupHeavyScans,
  detectProjectLanguageProfile,
  getDefaultStartupTools
} from "../chunk-QOBUHWHX.js";
import "../chunk-QILIYSJF.js";
import {
  collectSourceFilesWithBudgetAsync,
  getSlowFsVerdict,
  isSlowFs,
  slowFsDegradationNotice
} from "../chunk-6C7JWPCP.js";
import "../chunk-5NGR67U5.js";
import {
  displayProjectDataPath,
  drainProjectDataDirMigrations,
  getAmbientAbortSignal,
  getGlobalPiLensDir,
  getKnipIgnorePatterns,
  getProjectDataDir,
  getProjectIgnoreGlobs,
  getProjectIgnoreMatcher,
  getResourceFootprint,
  getSubagentIdentity,
  isExcludedDirName,
  isRecordableProjectPath,
  isSubagentSession,
  isTestFile,
  loadPiLensGlobalConfig,
  realIsPidAlive,
  resetProjectDataDirSessionState,
  resetSafeSpawnWindowsCommandCache,
  resetSpawnTimeoutCooldowns,
  safeSpawnAsync,
  subagentLightModeNotice,
  sweepAtomicWriteStages,
  sweepDeadEphemeralDataDirs,
  updateHeartbeat,
  withGenerationLockSync
} from "../chunk-C34ZXZ7O.js";
import {
  createSingleFlight
} from "../chunk-BW5KFIQC.js";
import {
  createDeadline,
  yieldIfOverBudget
} from "../chunk-QYF5S6P6.js";
import {
  detectFileKind
} from "../chunk-PHDMFAKM.js";
import {
  compareKeys,
  detectFileRole,
  loadPiLensProjectConfig,
  lspSectionOf,
  provenanceFor,
  provenanceView,
  resolvePiLensConfig,
  summarizeConfigResolution
} from "../chunk-2BBLFX75.js";
import {
  LSP_NAMESPACE_KEY,
  getPiLensGlobalConfigPath,
  resetWorkspaceTopology
} from "../chunk-XVF2VVXP.js";
import {
  getProjectTrustState,
  isToolInstallAllowedByTrust,
  projectTrustDenialReason,
  setProjectTrustState
} from "../chunk-ZANLILYD.js";
import {
  DEFAULT_MAX_OUTPUT_BYTES,
  createBoundedOutputSink,
  truncatedByOutputCap,
  writeFileAtomic
} from "../chunk-2EECBNC5.js";
import {
  LENS_TOOL_NAMES,
  TOOL_REGISTRY,
  compareOrdinal,
  escapeRegExp,
  getDegradationLedgerGeneration,
  getDegradationSummary,
  incrementDegradationCount,
  recordDegradationOnce,
  renderDegradationLines,
  resetDegradationLedger,
  resolveLensToolEnabled,
  resolveLensToolName,
  toolRegistryEntryForMcp
} from "../chunk-JAU72XNY.js";
import {
  createSubsystemLogger,
  flushExtensionLog,
  logExtension
} from "../chunk-XTMJ7XDT.js";
import "../chunk-JMYYOTQG.js";
import {
  claimPhaseOncePerSession,
  logLatency
} from "../chunk-QQNQ7SJW.js";
import {
  beginTurnContext,
  createNdjsonLogger,
  getGlobalPiLensLogDir,
  getProcessSingleton,
  isTestMode,
  runLogCleanup,
  setTurnContextSession
} from "../chunk-AOHZU2BM.js";
import "../chunk-LJDODBBZ.js";
import {
  FactStore
} from "../chunk-CHOW74WE.js";
import {
  BoundedFifoMap,
  BoundedLruCache
} from "../chunk-ABBOA7UD.js";
import {
  homeRelativePath,
  isAtOrAboveHomeDir,
  isUnderDir,
  minimatch,
  normalizeEphemeralMapKey,
  normalizeFilePath,
  normalizeMapKey,
  pathsEqual,
  realpathOrResolve,
  resolveHostToolPath,
  toProjectRelativePath,
  uriToPath
} from "../chunk-N2H3ZPZY.js";
import "../chunk-NXL4FFQQ.js";

// dist/mcp/server.js
import * as fs25 from "node:fs";
import * as net from "node:net";
import * as path39 from "node:path";
import { fileURLToPath as fileURLToPath3 } from "node:url";

// dist/tools/render-compact.js
import * as fs from "node:fs";
import * as path from "node:path";
import { randomUUID } from "node:crypto";
var MAX_RESULT_BYTES = 40 * 1024;
var COMPLETE_MCP_RESULT_INPUT_BUDGET_BYTES = 8 * 1024 * 1024;
var FOOTER_MAX_DIGITS = String(Number.MAX_SAFE_INTEGER).length;
var FOOTER_DIAG_LINE_MAX_CHARS = 200;
var FOOTER_DIAG_SECTION_MAX_BYTES = 1024;
var RESULT_FOOTER_RESERVE_BYTES = Buffer.byteLength(`

result error
${"x".repeat(FOOTER_DIAG_SECTION_MAX_BYTES)}
usage tokens=${"9".repeat(FOOTER_MAX_DIGITS)} elapsed-ms=${"9".repeat(FOOTER_MAX_DIGITS)} bytes=${"9".repeat(FOOTER_MAX_DIGITS)} truncated=false`, "utf8");
var RESULT_PAYLOAD_BUDGET_BYTES = MAX_RESULT_BYTES - RESULT_FOOTER_RESERVE_BYTES;
function renderHeadTail(text, maxBytes, markerFor) {
  const render3 = (kept) => {
    const head = Math.floor(kept / 2);
    const tail = kept - head;
    return `${text.slice(0, head)}${markerFor(head, tail)}${text.slice(text.length - tail)}`;
  };
  let low = 0;
  let high = text.length;
  while (low < high) {
    const kept = Math.ceil((low + high) / 2);
    if (Buffer.byteLength(render3(kept), "utf8") <= maxBytes)
      low = kept;
    else
      high = kept - 1;
  }
  return { text: render3(low), keptCharacters: low };
}
function boundToolText(text, maxBytes = MAX_RESULT_BYTES) {
  const totalBytes = Buffer.byteLength(text, "utf8");
  if (totalBytes <= maxBytes) {
    return { text, truncated: false, omittedCharacters: 0 };
  }
  const fullOutputPath = path.join(getGlobalPiLensLogDir(), `tool-result-${Date.now()}-${randomUUID()}.log`);
  fs.mkdirSync(path.dirname(fullOutputPath), { recursive: true });
  if (totalBytes > COMPLETE_MCP_RESULT_INPUT_BUDGET_BYTES) {
    const omittedBytes = totalBytes - COMPLETE_MCP_RESULT_INPUT_BUDGET_BYTES;
    recordDegradationOnce({
      kind: "mcp-complete-result-budget-exceeded",
      subject: "complete-result",
      reason: `${totalBytes} input bytes exceeded ${COMPLETE_MCP_RESULT_INPUT_BUDGET_BYTES}-byte budget`,
      metadata: {
        totalBytes,
        budgetBytes: COMPLETE_MCP_RESULT_INPUT_BUDGET_BYTES
      }
    });
    const logText = renderHeadTail(text, COMPLETE_MCP_RESULT_INPUT_BUDGET_BYTES, (head, tail) => {
      const keptBytes = Buffer.byteLength(`${text.slice(0, head)}${text.slice(text.length - tail)}`, "utf8");
      return `

[incomplete: ${totalBytes - keptBytes} bytes omitted, budget ${COMPLETE_MCP_RESULT_INPUT_BUDGET_BYTES}]

[Full output: ${fullOutputPath}]

`;
    });
    fs.writeFileSync(fullOutputPath, logText.text, "utf8");
    const output2 = renderHeadTail(logText.text, maxBytes, () => `

[incomplete: ${omittedBytes} bytes omitted, budget ${COMPLETE_MCP_RESULT_INPUT_BUDGET_BYTES}]

[Full output: ${fullOutputPath}]

`);
    return {
      text: output2.text,
      truncated: true,
      omittedCharacters: text.length - logText.keptCharacters,
      fullOutputPath
    };
  }
  fs.writeFileSync(fullOutputPath, text, "utf8");
  const output = renderHeadTail(text, maxBytes, (head, tail) => `

[${text.length - head - tail} characters omitted. Full output: ${fullOutputPath}]

`);
  return {
    text: output.text,
    truncated: true,
    omittedCharacters: text.length - output.keptCharacters,
    fullOutputPath
  };
}
var CONTRACT_FOOTER_TAIL_RE = /(?:^|\n)result (?:ok|error)\n(?:diag severity=[^\n]*\n)*usage tokens=\d+ elapsed-ms=\d+ bytes=(\d+) truncated=(true|false)$/;
function renderToolResultContract(result, delivery) {
  const normalized = {
    ...result,
    isError: result.isError === true
  };
  const content = result.content ?? [];
  const textBlocks = content.filter((block) => block.type === "text" && typeof block.text === "string").map((block) => block.text);
  if (textBlocks.length === 0)
    return normalized;
  const text = textBlocks.join("\n");
  if (CONTRACT_FOOTER_TAIL_RE.test(text))
    return normalized;
  const details = normalized.details;
  const diagLines = [];
  let diagSectionBytes = 0;
  if (Array.isArray(details?.diagnostics)) {
    for (const value of details.diagnostics) {
      if (!value || typeof value !== "object")
        continue;
      const severity = value.severity;
      if (typeof severity !== "string")
        continue;
      const line = `diag severity=${severity.slice(0, FOOTER_DIAG_LINE_MAX_CHARS)}`;
      const lineBytes = Buffer.byteLength(line, "utf8") + 1;
      if (diagSectionBytes + lineBytes > FOOTER_DIAG_SECTION_MAX_BYTES)
        break;
      diagLines.push(line);
      diagSectionBytes += lineBytes;
    }
  }
  const tokens = normalized.usage?.tokens ?? Math.ceil(Buffer.byteLength(text, "utf8") / 4);
  const elapsedMs = normalized.usage?.elapsedMs ?? 0;
  const deliveredBytes = delivery?.bytes ?? Buffer.byteLength(text, "utf8");
  const truncated = delivery?.truncated === true;
  const contractLines = [
    `result ${normalized.isError ? "error" : "ok"}`,
    ...diagLines,
    `usage tokens=${tokens} elapsed-ms=${elapsedMs} bytes=${deliveredBytes} truncated=${truncated ? "true" : "false"}`
  ];
  let lastTextIndex = -1;
  for (let index = content.length - 1; index >= 0; index--) {
    const block = content[index];
    if (block?.type === "text" && typeof block.text === "string") {
      lastTextIndex = index;
      break;
    }
  }
  if (lastTextIndex < 0)
    return normalized;
  return {
    ...normalized,
    content: content.map((block, index) => index === lastTextIndex && block.type === "text" ? { ...block, text: `${block.text}

${contractLines.join("\n")}` } : block)
  };
}
function boundResultPayload(result) {
  if (!result.content) {
    return { result, deliveredBytes: 0, truncated: false };
  }
  const joined = fullTextOf(result);
  const bound = boundToolText(joined, RESULT_PAYLOAD_BUDGET_BYTES);
  const firstText = result.content.findIndex((block) => block.type === "text" && typeof block.text === "string");
  let retainedText = false;
  const content = result.content.filter((block, index) => block.type !== "text" || typeof block.text !== "string" || index === firstText).map((block) => {
    if (block.type === "text" && typeof block.text === "string" && !retainedText) {
      retainedText = true;
      return { ...block, text: bound.text };
    }
    return block;
  });
  const deliveredBytes = Buffer.byteLength(fullTextOf({ content }), "utf8");
  return {
    result: { ...result, content },
    deliveredBytes,
    truncated: bound.truncated
  };
}
function renderToolText(summary, structured, compact = false) {
  const rawText = structured === void 0 ? summary : `${summary}

\`\`\`json
${JSON.stringify(structured, compact ? void 0 : null, compact ? void 0 : 2)}
\`\`\``;
  return {
    content: [{ type: "text", text: rawText }],
    details: structured
  };
}
function stripResultDetails(result) {
  const { details: _details, ...rest } = result;
  return rest;
}
function finalizeToolResultWithDelivery(result) {
  const normalized = { ...result, isError: result.isError === true };
  const existingText = fullTextOf(normalized);
  const existingFooter = CONTRACT_FOOTER_TAIL_RE.exec(existingText);
  if (existingFooter && Buffer.byteLength(existingText, "utf8") <= MAX_RESULT_BYTES) {
    return {
      result: normalized,
      deliveredBytes: Number(existingFooter[1]),
      truncated: existingFooter[2] === "true"
    };
  }
  const bound = boundResultPayload(normalized);
  const text = fullTextOf(bound.result);
  const keptFooter = CONTRACT_FOOTER_TAIL_RE.exec(text);
  if (keptFooter) {
    return {
      result: bound.result,
      deliveredBytes: Number(keptFooter[1]),
      truncated: keptFooter[2] === "true"
    };
  }
  const stamped = renderToolResultContract(bound.result, {
    bytes: bound.deliveredBytes,
    truncated: bound.truncated
  });
  return {
    result: stamped,
    deliveredBytes: bound.deliveredBytes,
    truncated: bound.truncated
  };
}
function finalizeToolResult(result) {
  return finalizeToolResultWithDelivery(result).result;
}
var PI_LENS_BLUE_FG = "\x1B[1m\x1B[38;2;96;165;250m";
var RESET_FG = "\x1B[39m\x1B[22m";
function fullTextOf(result) {
  return (result.content ?? []).filter((c) => c.type === "text" && typeof c.text === "string").map((c) => c.text).join("\n");
}
function selectCompactText(result, args, expanded, summarize) {
  const text = fullTextOf(result);
  if (expanded) {
    return {
      text: text || "(no output)",
      style: result.isError ? "error" : "output"
    };
  }
  const lineCount3 = text ? text.split("\n").length : 0;
  let summary;
  try {
    summary = summarize({
      details: result.details,
      args,
      isError: result.isError === true,
      text,
      lineCount: lineCount3
    });
  } catch {
    summary = text.split("\n")[0] ?? "";
  }
  return { text: summary, style: result.isError ? "error" : "brand" };
}
function paintCompact(style, text, theme) {
  if (style === "brand") {
    return `${PI_LENS_BLUE_FG}${text}${RESET_FG}`;
  }
  const color = style === "error" ? "error" : "toolOutput";
  return theme.fg(color, text);
}
function compactRenderResult(summarize) {
  return (result, options, theme, context) => {
    const component = context.lastComponent instanceof Text ? context.lastComponent : new Text("", 0, 0);
    const { text, style } = selectCompactText(result, context.args ?? {}, options.expanded === true, summarize);
    component.setText(paintCompact(style, text, theme));
    return component;
  };
}

// dist/clients/ast-grep-client.js
import * as fs4 from "node:fs";
import * as os2 from "node:os";
import * as path4 from "node:path";

// dist/clients/ast-grep-rule-manager.js
import * as fs2 from "node:fs";
import * as path2 from "node:path";
function candidateAstGrepRulesPaths(ruleDir) {
  return [
    path2.join(ruleDir, "ast-grep-rules", "rules"),
    path2.join(ruleDir, "rules"),
    ruleDir
  ];
}
function checkAstGrepRulesHealth(ruleDir) {
  const possiblePaths = candidateAstGrepRulesPaths(ruleDir);
  let rulesPath;
  for (const candidate of possiblePaths) {
    if (fs2.existsSync(candidate)) {
      rulesPath = candidate;
      break;
    }
  }
  if (!rulesPath) {
    try {
      fs2.readdirSync(ruleDir);
    } catch (error) {
      const fsErrorCode = error?.code;
      if (fsErrorCode && fsErrorCode !== "ENOENT") {
        return { status: "unreadable", fsErrorCode };
      }
    }
    return { status: "absent" };
  }
  let entries;
  try {
    entries = fs2.readdirSync(rulesPath).filter((f) => f.endsWith(".yml"));
  } catch (error) {
    const fsErrorCode = error?.code ?? "UNKNOWN";
    return { status: "unreadable", fsErrorCode };
  }
  return entries.length > 0 ? { status: "healthy", entryCount: entries.length } : { status: "empty" };
}
var AstGrepRuleManager = class {
  ruleDir;
  log;
  fingerprint;
  ruleDescriptions = null;
  ruleFingerprint = null;
  constructor(ruleDir, log, fingerprint = () => getAstGrepRuleFingerprint()) {
    this.ruleDir = ruleDir;
    this.log = log;
    this.fingerprint = fingerprint;
  }
  loadRuleDescriptions() {
    const fingerprint = this.fingerprint();
    if (this.ruleDescriptions !== null && this.ruleFingerprint === fingerprint)
      return this.ruleDescriptions;
    const descriptions = /* @__PURE__ */ new Map();
    const roots = Array.isArray(this.ruleDir) ? this.ruleDir : [this.ruleDir];
    const possiblePaths = roots.flatMap(candidateAstGrepRulesPaths);
    const rulesPaths = [];
    if (Array.isArray(this.ruleDir)) {
      for (const candidate of possiblePaths) {
        if (fs2.existsSync(candidate))
          rulesPaths.push(candidate);
      }
    } else {
      for (const candidate of possiblePaths) {
        if (!fs2.existsSync(candidate))
          continue;
        rulesPaths.push(candidate);
        break;
      }
    }
    const rulesPath = rulesPaths[0];
    if (!rulesPath) {
      this.log(`Rule descriptions: no rules directory found in ${possiblePaths.join(", ")}`);
      this.ruleDescriptions = descriptions;
      this.ruleFingerprint = fingerprint;
      return descriptions;
    }
    try {
      for (const resolvedPath of rulesPaths) {
        const files = fs2.readdirSync(resolvedPath).filter((f) => f.endsWith(".yml"));
        this.log(`Loaded ${files.length} rule descriptions from ${resolvedPath}`);
        for (const file of files) {
          const filePath = path2.join(resolvedPath, file);
          const content = fs2.readFileSync(filePath, "utf-8");
          const rule = this.parseRuleYaml(content);
          if (rule && !descriptions.has(rule.id))
            descriptions.set(rule.id, rule);
        }
      }
    } catch (err) {
      this.log(`Failed to load rule descriptions: ${err.message}`);
    }
    this.ruleDescriptions = descriptions;
    this.ruleFingerprint = fingerprint;
    return descriptions;
  }
  parseRuleYaml(content) {
    const result = {};
    const idMatch = content.match(/^id:\s*(.+)$/m);
    if (idMatch)
      result.id = idMatch[1].trim();
    const msgMatch = content.match(/^message:\s*"([^"]+)"/m) || content.match(/^message:\s*'([^']+)'/m) || content.match(/^message:\s*(.+)$/m);
    if (msgMatch)
      result.message = (msgMatch[3] || msgMatch[2] || msgMatch[1]).trim();
    const noteMatch = content.match(/^note:\s*\|([\s\S]*?)(?=^\w|\n\n|\nrule:)/m);
    if (noteMatch) {
      result.note = noteMatch[1].split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0).join(" ");
    }
    const sevMatch = content.match(/^severity:\s*(.+)$/m);
    if (sevMatch)
      result.severity = this.mapSeverity(sevMatch[1].trim());
    const gradeMatch = content.match(/Grade\s+(\d+\.\d+)/i);
    if (gradeMatch)
      result.grade = parseFloat(gradeMatch[1]);
    const fixMatch = content.match(/^fix:\s*\|?([\s\S]*?)(?=^\w|^rule:|Z)/m);
    if (fixMatch) {
      result.fix = fixMatch[1].split(/\r?\n/).map((line) => line.replace(/^\s*\|?\s*/, "")).filter((line) => line.length > 0).join("\n");
    }
    if (result.id && result.message) {
      return result;
    }
    return null;
  }
  mapSeverity(severity) {
    const lower = severity.toLowerCase();
    if (lower === "error")
      return "error";
    if (lower === "warning")
      return "warning";
    if (lower === "info")
      return "info";
    return "hint";
  }
};

// dist/clients/sg-runner.js
import * as fs3 from "node:fs";
import * as os from "node:os";
import * as path3 from "node:path";
function buildBashRunArgs(cmd, allArgs) {
  return ["-c", '"$0" "$@"', cmd, ...allArgs];
}
function sgExcludeArgsForProject(rootDir) {
  return getProjectIgnoreGlobs(rootDir).flatMap((glob) => [
    "--globs",
    `!${glob}`
  ]);
}
var DEFAULT_EXEC_TIMEOUT_MS = 3e4;
var PROBE_TIMEOUT_MS = 5e3;
var MAX_SG_OUTPUT_BYTES = 8 * 1024 * 1024;
function formatMetaVarCaptures(mv) {
  if (!mv)
    return void 0;
  const parts = [];
  for (const [name, node] of Object.entries(mv.single)) {
    if (node.text)
      parts.push(`$${name}=${node.text}`);
  }
  for (const [name, nodes] of Object.entries(mv.multi)) {
    if (nodes.length > 0) {
      const joined = nodes.map((n) => n.text).join("");
      if (joined)
        parts.push(`$$$${name}=${joined}`);
    }
  }
  for (const [name, value] of Object.entries(mv.transformed)) {
    if (value)
      parts.push(`@${name}=${value}`);
  }
  if (parts.length === 0)
    return void 0;
  return `  ${parts.join("  ")}`;
}
function tryParseSgMatches(stdout) {
  try {
    const parsed = JSON.parse(stdout);
    if (Array.isArray(parsed))
      return parsed;
    if (parsed !== null && typeof parsed === "object")
      return [parsed];
    return null;
  } catch {
    return null;
  }
}
function tryParseNonZeroSgMatches(result) {
  if (!result.stdout.trim())
    return null;
  return tryParseSgMatches(result.stdout.trim());
}
var SgRunner = class {
  log;
  sgPath = null;
  sgArgsPrefix = [];
  sgSpawnOptions;
  /**
   * Availability memo, backed by the shared transient-aware latch (#1476).
   *
   * Before this, one failed sweep over every candidate — timeouts included —
   * latched `false` for the life of the process AND ran a full auto-install
   * first. A host stall during warm-up therefore both disabled ast-grep until
   * restart and paid for an install nobody needed.
   */
  availabilityLatch = createAvailabilityLatch();
  /**
   * At-most-one sweep in flight, via the shared primitive (#1753). One
   * instance owns one question, so the key is a constant.
   */
  ensureFlight = createSingleFlight();
  /**
   * Whether a DIRECT candidate — one that would have been ast-grep itself —
   * failed for a transient reason in the current sweep. Only these block the
   * install: a slow `npx` says nothing about whether ast-grep is on this
   * machine, and letting it block turned "ast-grep is genuinely absent on a
   * slow host" into "ast-grep is never installed and npx is re-spawned every
   * sweep, forever".
   */
  sweepSawTransient = false;
  sweepTransientCause = "probe-timeout";
  /**
   * The DIRECT candidates that were unreachable, in ask order (#1568).
   *
   * The sweep returns at the first candidate that answers, so at the moment of
   * a win this is exactly the set of preferred tiers the winner did not beat on
   * the merits. Fallbacks are excluded on purpose: `npx` is asked before the
   * global-bin and platform-package tiers, and a slow `npx` says nothing about
   * a winner that is a real binary.
   *
   * Basenames, because a candidate can be an absolute global-bin or
   * platform-package path and this list is written to latency.log (#1568
   * review F3).
   */
  sweepUnreachable = [];
  /** A transient on the npx fallback: not evidence, but not nothing either. */
  sweepFallbackTransient = false;
  sweepFallbackCause = "probe-timeout";
  /** Host stall summed over every probe of the current sweep, ms. */
  sweepHostStallMs = 0;
  /**
   * Candidates — direct or fallback — that this sweep probed and found
   * DURABLY missing (real ENOENT/non-installable, not a stall) (#1593). The
   * retained-arm fallback below only sees whether SOME candidate stalled; this
   * list lets it also check whether the memoized winner itself is one of the
   * candidates this very sweep just disproved, rather than re-serving a
   * command that ENOENTed a moment ago because an unrelated sibling stalled.
   */
  sweepDurablyMissing = [];
  constructor(verbose = false) {
    this.log = verbose ? createSubsystemLogger("sg-runner") : () => {
    };
  }
  /**
   * Check if ast-grep CLI is available, auto-install if not.
   *
   * Re-entrancy safe: concurrent first-time callers share one flight, so
   * probing/auto-install isn't duplicated across session-start tasks. The
   * share and the clear-in-finally belong to `singleFlight` (#1753); this
   * method owns only the latch short-circuit above it. The sweep-local
   * bookkeeping `doEnsureAvailable` resets on entry is untouched — it is
   * per-sweep state, not concurrency state.
   */
  async ensureAvailable() {
    const memo = this.availabilityLatch.read();
    if (memo !== null)
      return memo;
    return this.ensureFlight.run("ast-grep", () => this.doEnsureAvailable());
  }
  async doEnsureAvailable() {
    const startedAt = Date.now();
    this.sweepSawTransient = false;
    this.sweepTransientCause = "probe-timeout";
    this.sweepUnreachable = [];
    this.sweepFallbackTransient = false;
    this.sweepFallbackCause = "probe-timeout";
    this.sweepHostStallMs = 0;
    this.sweepDurablyMissing = [];
    const trustedProject = getProjectTrustState() === "trusted";
    const pathCommand = await this.probeCommandCandidates([
      ...trustedProject ? [
        { cmd: "ast-grep", argsPrefix: [] },
        { cmd: "sg", argsPrefix: [] }
      ] : [],
      // The scoped npx fallback starts a Node process before it can answer, so
      // it is the candidate most likely to blow a 5 s budget on a cold or busy
      // box. Marked a fallback so its timeout cannot veto the install.
      {
        cmd: "npx",
        argsPrefix: ["--no", "--package", "@ast-grep/cli", "--", "ast-grep"],
        fallback: true
      }
    ]);
    if (pathCommand) {
      this.sgPath = pathCommand.cmd;
      this.sgArgsPrefix = pathCommand.argsPrefix;
      this.sgSpawnOptions = pathCommand.cmd === "npx" ? getIsolatedNpxSpawnOptions() : void 0;
      this.noteAvailable(startedAt, `ast-grep found on PATH: ${pathCommand.cmd}`);
      return true;
    }
    for (const name of ["ast-grep", "sg"]) {
      const globalBin = await findGlobalBinary(name);
      if (globalBin && await this.probeCommand(globalBin, [])) {
        this.sgPath = globalBin;
        this.sgArgsPrefix = [];
        this.noteAvailable(startedAt, `ast-grep found in global bin: ${globalBin}`);
        return true;
      }
    }
    const platformBinary = trustedProject ? await this.probePlatformPackageBinary() : void 0;
    if (platformBinary) {
      this.sgPath = platformBinary;
      this.sgArgsPrefix = [];
      this.noteAvailable(startedAt, `ast-grep found via platform package: ${platformBinary}`);
      return true;
    }
    if (process.platform === "darwin") {
      const brewBinary = await this.probeHomebrew();
      if (brewBinary) {
        this.sgPath = brewBinary;
        this.sgArgsPrefix = [];
        this.noteAvailable(startedAt, `ast-grep found via Homebrew: ${brewBinary}`);
        return true;
      }
    }
    if (this.sweepSawTransient) {
      if (this.availabilityLatch.isProvisional() && this.sgPath && !this.sweepDurablyMissing.includes(this.sgPath)) {
        this.noteAvailable(startedAt, `ast-grep re-probe stalled; keeping ${this.sgPath}`, { retained: true });
        return true;
      }
      this.log("ast-grep availability probe timed out; will retry (not installing)");
      return this.noteUnavailable(startedAt, "transient", this.sweepTransientCause);
    }
    const installed = await resolveManagedToolClient({
      toolId: "ast-grep",
      cwd: process.cwd(),
      probe: async () => ({ outcome: "missing" }),
      acceptInstalled: async (installedPath) => await this.probeCommand(installedPath, []) ? installedPath : null
    });
    if (installed.outcome === "success") {
      this.sgPath = installed.value;
      this.sgArgsPrefix = [];
      this.sgSpawnOptions = void 0;
      this.noteAvailable(startedAt, `ast-grep auto-installed: ${installed.value}`);
      return true;
    }
    if (this.sweepFallbackTransient) {
      return this.noteUnavailable(startedAt, "transient", this.sweepFallbackCause);
    }
    const { getInstallAttempt } = await import("../probes/installer.js");
    return this.noteUnavailable(startedAt, "missing", "not-found", describeInstallAttempt(getInstallAttempt("ast-grep"), {
      installedButRejected: installed.outcome === "non-installable"
    }), "caller");
  }
  /**
   * Record a successful sweep, with one decision record.
   *
   * The win is latched for the session UNLESS a direct candidate ahead of it
   * was unreachable (#1568). `sweepSawTransient` is set only by candidates the
   * sweep already asked, and the sweep returns at the first one that answers,
   * so at this point the flag means "a tier the winner is supposed to lose to
   * never got a fair hearing". Latching that pinned the session to
   * `npx` — a Node start per invocation — over a healthy
   * ast-grep on PATH, until the next restart. Provisional instead: served now,
   * re-swept once the stalled tier's cooldown expires.
   *
   * The install arm cannot reach here provisionally: `doEnsureAvailable`
   * returns before Step 4 whenever `sweepSawTransient` is set.
   *
   * `retained` marks the other provisional case (#1568 review F1): no candidate
   * answered at all, and the winner being reported is the one the previous
   * sweep found, kept rather than discarded on a timeout.
   */
  noteAvailable(startedAt, message, opts = {}) {
    const provisional = this.sweepSawTransient;
    let retryAfterMs = 0;
    if (provisional) {
      retryAfterMs = this.availabilityLatch.noteProvisionallyAvailable(this.sweepTransientCause);
    } else {
      this.availabilityLatch.noteAvailable();
    }
    this.log(message);
    logAvailabilityDecision({
      tool: "ast-grep",
      verdict: "available",
      outcome: "success",
      cause: provisional ? this.sweepTransientCause : "ok",
      elapsedMs: Date.now() - startedAt,
      latched: !provisional,
      classifiedBy: "probe",
      hostStallMs: this.sweepHostStallMs,
      budgetMs: PROBE_TIMEOUT_MS,
      ...provisional && {
        provisional: true,
        unreachablePreferred: [...this.sweepUnreachable],
        ...opts.retained === true && { retained: true },
        ...retryAfterMs > 0 && { retryAfterMs }
      }
    });
  }
  /**
   * Record a failed sweep. A `transient` outcome expires after a bounded
   * cooldown; anything else is remembered for the session, as before. The
   * elapsed/stall numbers describe the WHOLE sweep, because the verdict is
   * about the sweep rather than any single candidate — reporting zero here
   * would erase the evidence that cracked #1467.
   */
  noteUnavailable(startedAt, outcome, cause, evidence, classifiedBy = "probe") {
    const retryAfterMs = this.availabilityLatch.noteUnavailable(outcome, cause);
    logAvailabilityDecision({
      tool: "ast-grep",
      verdict: "unavailable",
      outcome,
      cause,
      elapsedMs: Date.now() - startedAt,
      latched: outcome !== "transient",
      hostStallMs: this.sweepHostStallMs,
      ...retryAfterMs > 0 && { retryAfterMs },
      budgetMs: PROBE_TIMEOUT_MS,
      classifiedBy,
      ...evidence !== void 0 && { evidence }
    });
    return false;
  }
  /**
   * Probe platform-specific @ast-grep/cli-{os}-{arch} npm packages.
   * These ship the binary at the package root (sg / sg.exe).
   */
  async probePlatformPackageBinary() {
    const { platform, arch } = process;
    const exeName = platform === "win32" ? "sg.exe" : "sg";
    const pkgSuffixes = [];
    if (platform === "linux" && arch === "x64")
      pkgSuffixes.push("linux-x64-gnu");
    if (platform === "linux" && arch === "arm64")
      pkgSuffixes.push("linux-arm64-gnu");
    if (platform === "darwin" && arch === "arm64")
      pkgSuffixes.push("darwin-arm64");
    if (platform === "darwin" && arch === "x64")
      pkgSuffixes.push("darwin-x64");
    if (platform === "win32" && arch === "x64")
      pkgSuffixes.push("win32-x64-msvc");
    if (platform === "win32" && arch === "arm64")
      pkgSuffixes.push("win32-arm64-msvc");
    const searchRoots = [];
    let dir = process.cwd();
    for (let depth = 0; depth < 5; depth++) {
      searchRoots.push(path3.join(dir, "node_modules"));
      const parent = path3.dirname(dir);
      if (parent === dir)
        break;
      dir = parent;
    }
    for (const suffix of pkgSuffixes) {
      const pkgName = `@ast-grep/cli-${suffix}`;
      for (const root of searchRoots) {
        const candidate = path3.join(root, pkgName, exeName);
        try {
          if (fs3.existsSync(candidate) && await this.probeCommand(candidate, [])) {
            return candidate;
          }
        } catch {
        }
      }
    }
    return void 0;
  }
  /**
   * Probe Homebrew installation (macOS only).
   * Runs `brew --prefix ast-grep` and checks the resulting bin directory.
   */
  async probeHomebrew() {
    try {
      const result = await safeSpawnAsync("brew", ["--prefix", "ast-grep"], {
        timeout: 3e3
      });
      if (result.error || result.status !== 0)
        return void 0;
      const prefix = result.stdout.trim();
      if (!prefix)
        return void 0;
      for (const name of ["ast-grep", "sg"]) {
        const candidate = path3.join(prefix, "bin", name);
        if (fs3.existsSync(candidate) && await this.probeCommand(candidate, [])) {
          return candidate;
        }
      }
    } catch {
    }
    return void 0;
  }
  isAstGrepVersionOutput(output) {
    return /\bast[- ]grep\b/i.test(output);
  }
  /**
   * Probe one candidate. A failure is CLASSIFIED, not merely counted: a
   * timeout/abort marks the whole sweep transient so the caller retries later
   * instead of installing and latching. A command that answers but is not
   * ast-grep (Linux `/usr/bin/sg` is util-linux) is a durable no.
   */
  async probeCommand(cmd, argsPrefix, fallback = false) {
    const sampler = startHostStallSampler();
    let result;
    let hostStallMs;
    try {
      result = cmd === "npx" ? await safeSpawnAsync(cmd, [...argsPrefix, "--version"], {
        ...getIsolatedNpxSpawnOptions(),
        timeout: PROBE_TIMEOUT_MS
      }) : await probeToolAsync(cmd, [...argsPrefix, "--version"], {
        timeout: PROBE_TIMEOUT_MS
      });
    } finally {
      hostStallMs = sampler.stop();
      this.sweepHostStallMs += hostStallMs;
    }
    if (!result.error && result.status === 0 && this.isAstGrepVersionOutput(`${result.stdout}
${result.stderr}`)) {
      return true;
    }
    const { outcome, cause } = classifyProbeFailure(result, { hostStallMs });
    if (outcome === "transient") {
      if (fallback) {
        this.sweepFallbackTransient = true;
        this.sweepFallbackCause = cause;
      } else {
        this.sweepSawTransient = true;
        this.sweepTransientCause = cause;
        const name = path3.basename(cmd);
        if (!this.sweepUnreachable.includes(name)) {
          this.sweepUnreachable.push(name);
        }
      }
    } else if (!this.sweepDurablyMissing.includes(cmd)) {
      this.sweepDurablyMissing.push(cmd);
    }
    return false;
  }
  async probeCommandCandidates(candidates) {
    for (const candidate of candidates) {
      if (await this.probeCommand(candidate.cmd, candidate.argsPrefix, candidate.fallback ?? false)) {
        return candidate;
      }
    }
    return void 0;
  }
  /**
   * Get the ast-grep command to use, plus any npx prefix arguments.
   */
  getSgCommand() {
    return {
      cmd: this.sgPath || "ast-grep",
      argsPrefix: this.sgArgsPrefix
    };
  }
  failureForSpawnResult(result) {
    if (result.failure === "aborted")
      return "aborted";
    switch (result.spawnFailure?.kind) {
      case "tool-not-found":
        return "unavailable";
      case "timeout":
        return "timeout";
      case "killed":
        return result.failure === "aborted" ? "aborted" : "cli-failure";
      case "cwd-unresolvable":
      case "permission-denied":
      case "spawn-failed":
      case void 0:
        return result.error ? "cli-failure" : void 0;
    }
  }
  formatPatternError(stderr, args) {
    if (stderr.includes("Multiple AST nodes are detected")) {
      return `Invalid AST pattern: The pattern appears to contain multiple AST nodes or is malformed.
Common causes:
  1. Missing parentheses: use it($TEST) not it"test"
  2. Raw text without structure: use console.log($MSG) not just "console.log"
  3. Unclosed quotes or brackets

Original error: ${stderr}`;
    }
    if (stderr.includes("Cannot parse query")) {
      return `Pattern syntax error: The pattern could not be parsed as valid code.
Tips:
  - Patterns must be valid ${args.includes("--lang") ? args[args.indexOf("--lang") + 1] : "language"} syntax
  - Use metavariables like $NAME, $ARGS for variable parts
  - Example: 'function $NAME($$$PARAMS) { $$$BODY }'

Original error: ${stderr}`;
    }
    return stderr;
  }
  async execRaw(args, timeout = DEFAULT_EXEC_TIMEOUT_MS, options = {}) {
    const command = this.getSgCommand();
    const result = await safeSpawnAsync(command.cmd, [...command.argsPrefix, ...args], {
      ...this.sgSpawnOptions,
      timeout,
      deadlineAt: options.deadlineAt,
      signal: options.signal,
      maxOutputBytes: MAX_SG_OUTPUT_BYTES
    });
    const failure = this.failureForSpawnResult(result);
    return {
      stdout: result.stdout,
      stderr: result.stderr,
      status: result.status,
      error: result.error?.message,
      failure,
      ...result.outputTruncated ? { outputTruncated: true } : {}
    };
  }
  /**
   * Run ast-grep asynchronously, return parsed matches. The Windows Git
   * Bash/MSYS path deliberately remains positional-argument based, but the
   * child itself now goes through safeSpawnAsync so cancellation, deadlines,
   * tree-kill, and output caps are shared with every other CLI runner.
   */
  async exec(args, options = {}) {
    const command = this.getSgCommand();
    const allArgs = [...command.argsPrefix, ...args];
    const isWindows = process.platform === "win32";
    const hasBash = Boolean(process.env.MSYSTEM || process.env.GIT_SHELL);
    const useBash = isWindows && hasBash;
    const result = await safeSpawnAsync(useBash ? "bash" : command.cmd, useBash ? buildBashRunArgs(command.cmd, allArgs) : allArgs, {
      ...this.sgSpawnOptions,
      timeout: DEFAULT_EXEC_TIMEOUT_MS,
      deadlineAt: options.deadlineAt,
      signal: options.signal,
      maxOutputBytes: MAX_SG_OUTPUT_BYTES
    });
    const empty = () => ({
      matches: [],
      totalMatches: 0,
      truncated: false
    });
    if (truncatedByOutputCap(result)) {
      return {
        ...empty(),
        error: "Failed to parse output: output was truncated"
      };
    }
    const spawnFailure = this.failureForSpawnResult(result);
    if (spawnFailure) {
      return {
        ...empty(),
        error: spawnFailure === "unavailable" ? "ast-grep CLI not found. Install: npm i -D @ast-grep/cli" : result.error?.message || "ast-grep CLI failed to start"
      };
    }
    if (result.status !== 0) {
      const stdout = result.stdout.trim();
      const stderr = result.stderr.trim();
      if (result.status === 1 && stdout) {
        const matches = tryParseNonZeroSgMatches(result);
        if (matches) {
          return {
            matches,
            totalMatches: matches.length,
            truncated: false
          };
        }
      }
      if (result.status === 1 && !stdout && !stderr)
        return empty();
      return {
        ...empty(),
        error: this.formatPatternError(stderr || `Command failed with exit code ${result.status}`, args)
      };
    }
    if (!result.stdout.trim())
      return empty();
    {
      const matches = tryParseSgMatches(result.stdout);
      if (matches) {
        return {
          matches,
          totalMatches: matches.length,
          truncated: false
        };
      }
      return { ...empty(), error: "Failed to parse output" };
    }
  }
  // --- Shared helpers for temp-dir rule scans ---
  prepareTempScan(ruleId, ruleYaml) {
    const sessionDir = fs3.mkdtempSync(path3.join(os.tmpdir(), `pi-lens-temp-${ruleId}-`));
    try {
      const rulesSubdir = path3.join(sessionDir, "rules");
      const configFile = path3.join(sessionDir, ".sgconfig.yml");
      fs3.mkdirSync(rulesSubdir, { recursive: true });
      fs3.writeFileSync(configFile, `ruleDirs:
  - ./rules
`);
      fs3.writeFileSync(path3.join(rulesSubdir, `${ruleId}.yml`), ruleYaml);
      return { sessionDir, configFile };
    } catch (error) {
      this.cleanupTempScan(sessionDir);
      throw error;
    }
  }
  cleanupTempScan(sessionDir) {
    try {
      fs3.rmSync(sessionDir, { recursive: true, force: true });
    } catch (err) {
      this.log(`Cleanup failed: ${err.message}`);
    }
  }
  interpretScanResult(result, args) {
    if (truncatedByOutputCap(result)) {
      return {
        matches: [],
        status: result.status,
        error: "Failed to parse ast-grep scan output: output was truncated",
        failure: "parse-failure"
      };
    }
    const failure = this.failureForSpawnResult(result);
    if (failure) {
      return {
        matches: [],
        status: result.status,
        error: result.error?.message || "ast-grep CLI failed to start",
        failure
      };
    }
    if (result.status !== 0) {
      const stdout = result.stdout.trim();
      const stderr = result.stderr.trim();
      if (result.status === 1 && stdout) {
        const matches = tryParseNonZeroSgMatches(result);
        if (matches) {
          return { matches, status: result.status };
        }
      }
      if (result.status === 1 && !stdout && !stderr) {
        return { matches: [], status: result.status };
      }
      return {
        matches: [],
        status: result.status,
        error: this.formatPatternError(stderr || `ast-grep scan failed with exit code ${result.status}`, args),
        failure: "cli-failure"
      };
    }
    if (!result.stdout.trim())
      return { matches: [], status: result.status };
    {
      const matches = tryParseSgMatches(result.stdout);
      if (matches) {
        return { matches, status: result.status };
      }
      return {
        matches: [],
        status: result.status,
        error: "Failed to parse ast-grep scan output: invalid JSON",
        failure: "parse-failure"
      };
    }
  }
  async tempScanDetailedAsync(dir, ruleId, ruleYaml, timeout = DEFAULT_EXEC_TIMEOUT_MS, options = {}) {
    let sessionDir;
    try {
      ({ sessionDir } = this.prepareTempScan(ruleId, ruleYaml));
      const configFile = path3.join(sessionDir, ".sgconfig.yml");
      const { cmd: sgCmd, args: sgPre } = getSgCommand();
      const result = await safeSpawnAsync(sgCmd, [
        ...sgPre,
        "scan",
        "--config",
        configFile,
        "--json",
        ...sgExcludeArgsForProject(dir),
        dir
      ], {
        ...sgCmd === "npx" ? getIsolatedNpxSpawnOptions() : {},
        timeout,
        deadlineAt: options.deadlineAt,
        signal: options.signal,
        maxOutputBytes: MAX_SG_OUTPUT_BYTES
      });
      return this.interpretScanResult(result, ["scan"]);
    } finally {
      if (sessionDir)
        this.cleanupTempScan(sessionDir);
    }
  }
  /** Backwards-compatible match-only wrapper for existing session scanners. */
  async tempScanAsync(dir, ruleId, ruleYaml, timeout = DEFAULT_EXEC_TIMEOUT_MS, options = {}) {
    const result = await this.tempScanDetailedAsync(dir, ruleId, ruleYaml, timeout, options);
    return result.matches;
  }
  /**
   * Run a rule scan with optional fix application.
   * Dry-run: --json (returns matches for preview).
   * Apply:   --update-all (writes fixes defined in the YAML `fix:` field).
   */
  async tempScanWithFixAsync(dir, ruleId, ruleYaml, applyFixes, timeout = DEFAULT_EXEC_TIMEOUT_MS, options = {}) {
    let sessionDir;
    try {
      ({ sessionDir } = this.prepareTempScan(ruleId, ruleYaml));
      const configFile = path3.join(sessionDir, ".sgconfig.yml");
      const { cmd: sgCmd, args: sgPre } = getSgCommand();
      const scanArgs = [
        ...sgPre,
        "scan",
        "--config",
        configFile,
        "--json",
        ...sgExcludeArgsForProject(dir),
        dir
      ];
      const spawnOptions = {
        ...sgCmd === "npx" ? getIsolatedNpxSpawnOptions() : {},
        timeout,
        deadlineAt: options.deadlineAt,
        signal: options.signal,
        maxOutputBytes: MAX_SG_OUTPUT_BYTES
      };
      if (!applyFixes) {
        const result = await safeSpawnAsync(sgCmd, scanArgs, spawnOptions);
        const scan2 = this.interpretScanResult(result, ["scan"]);
        return scan2.failure || scan2.error ? { matches: [], error: scan2.error } : { matches: scan2.matches };
      }
      const jsonResult = await safeSpawnAsync(sgCmd, scanArgs, spawnOptions);
      const scan = this.interpretScanResult(jsonResult, ["scan"]);
      if (scan.failure || scan.error) {
        return { matches: [], error: scan.error };
      }
      const applyResult = await safeSpawnAsync(sgCmd, [
        ...sgPre,
        "scan",
        "--config",
        configFile,
        "--update-all",
        ...sgExcludeArgsForProject(dir),
        dir
      ], spawnOptions);
      if (applyResult.error || applyResult.failure || applyResult.status !== 0) {
        return {
          matches: [],
          error: applyResult.error?.message || `ast-grep apply failed with exit code ${applyResult.status}`
        };
      }
      return { matches: scan.matches };
    } catch (err) {
      return { matches: [], error: String(err) };
    } finally {
      if (sessionDir)
        this.cleanupTempScan(sessionDir);
    }
  }
  /**
   * Format matches for display
   */
  formatMatches(matches, isDryRun = false, maxItems = 50, showModeIndicator = false) {
    if (matches.length === 0) {
      if (showModeIndicator) {
        return isDryRun ? "[DRY-RUN] No matches found." : "[NOT APPLIED] No matches found \u2014 nothing was changed. Run ast_grep_search to confirm the pattern matches before applying.";
      }
      return "No matches found";
    }
    const shown2 = matches.slice(0, maxItems);
    const lines = shown2.map((m) => {
      const loc = `${m.file}:${m.range.start.line + 1}:${m.range.start.column + 1}`;
      const text = m.text.length > 100 ? `${m.text.slice(0, 100)}...` : m.text;
      const langSuffix = m.language ? `  [${m.language}]` : "";
      const base = isDryRun && m.replacement ? `${loc}
  - ${text}
  + ${m.replacement}` : `${loc}: ${text}${langSuffix}`;
      const captures = formatMetaVarCaptures(m.metaVariables);
      return captures ? `${base}
${captures}` : base;
    });
    if (matches.length > maxItems) {
      lines.unshift(`Found ${matches.length} matches (showing first ${maxItems}):`);
    }
    if (showModeIndicator) {
      const prefix = isDryRun ? "[DRY-RUN]" : "[APPLIED]";
      const suffix = isDryRun ? "\n\n(Dry run \u2014 use apply=true to apply changes)" : "";
      return `${prefix} ${matches.length} replacement(s):

${lines.join("\n")}${suffix}`;
    }
    return lines.join("\n");
  }
};

// dist/clients/ast-grep-client.js
function reportAstGrepRulesHealth(bundledRuleDir) {
  const health = checkAstGrepRulesHealth(bundledRuleDir);
  logLatency({
    type: "phase",
    phase: "ast_grep_rules_resolved",
    filePath: bundledRuleDir,
    durationMs: 0,
    metadata: {
      status: health.status,
      entryCount: health.status === "healthy" ? health.entryCount : 0
    }
  });
  reportBundledResourceDirHealth("ast-grep-rules-dir-missing", bundledRuleDir, health, "ast-grep rule descriptions");
}
function recordAstGrepApply(matches, lineage, toolCallId) {
  const bridge = getMutationBridge();
  if (!bridge || matches.length === 0)
    return;
  const rangesByFile = /* @__PURE__ */ new Map();
  for (const match of matches) {
    const start = (match.range?.start?.line ?? 0) + 1;
    const end = Math.max(start, (match.range?.end?.line ?? 0) + 1);
    const existing = rangesByFile.get(match.file);
    if (existing)
      existing.push([start, end]);
    else
      rangesByFile.set(match.file, [[start, end]]);
  }
  for (const [filePath, editRanges] of rangesByFile) {
    bridge.recordMutation({
      // ast-grep echoes the spelling passed to its CLI. Resolve that
      // tool-relative spelling at the producer boundary, then use the
      // existing canonical path seam before recordability is checked (#4140).
      filePath: normalizeFilePath(path4.resolve(process.cwd(), filePath)),
      kind: "edit",
      editRanges,
      consumer: "ast_grep_replace",
      provenance: "observed",
      // #3763: the call's session, so an apply that lands after `/new`
      // writes none of the next session's state.
      ...lineage && { lineage },
      // #4187 R4-1: the apply rewrites every matched file, which an
      // `ast_grep_replace` call names only when its `paths` are files. The
      // call's own id lets the guard advance exactly the paths that call
      // checked, and end the authorship of every other file it rewrote.
      ...toolCallId !== void 0 && { toolCallId }
    });
  }
}
function extractDebugAst(raw) {
  const lines = raw.split(/\r?\n/);
  const start = lines.findIndex((line) => /^Debug (?:A|C)ST:/.test(line.trim()));
  if (start < 0)
    return void 0;
  const out = [];
  for (const line of lines.slice(start + 1)) {
    if (!line.trim())
      break;
    out.push(line);
  }
  return out.length > 0 ? out.join("\n") : void 0;
}
function lineStartOffsets(source) {
  const offsets = [0];
  for (let index = 0; index < source.length; index++) {
    if (source.charCodeAt(index) === 10)
      offsets.push(index + 1);
  }
  return offsets;
}
function snippetForRange(source, offsets, startLine0, startCol0, endLine0, endCol0) {
  const start = (offsets[startLine0] ?? 0) + startCol0;
  const end = (offsets[endLine0] ?? source.length) + endCol0;
  const text = source.slice(start, end).replace(/\s+/g, " ").trim();
  return text.length > 80 ? `${text.slice(0, 77)}...` : text;
}
var MAX_VALIDATE_PATTERN_CHARS = 2e4;
var MAX_VALIDATE_RULE_CHARS = 2e5;
var VALIDATION_SNIPPETS = {
  bash: { ext: "sh", source: "echo pi_lens_validate\n" },
  c: { ext: "c", source: "int main(void) { return 0; }\n" },
  cpp: { ext: "cpp", source: "int main() { return 0; }\n" },
  csharp: { ext: "cs", source: "class C { static void Main() {} }\n" },
  css: { ext: "css", source: ".pi-lens { color: black; }\n" },
  go: { ext: "go", source: "package main\nfunc main() {}\n" },
  html: { ext: "html", source: "<main>pi-lens</main>\n" },
  java: { ext: "java", source: "class Main { void run() {} }\n" },
  javascript: { ext: "js", source: "const piLensValidate = 1;\n" },
  json: { ext: "json", source: '{"piLensValidate":true}\n' },
  kotlin: { ext: "kt", source: "fun main() {}\n" },
  lua: { ext: "lua", source: "local pi_lens_validate = 1\n" },
  php: { ext: "php", source: "<?php $piLensValidate = 1;\n" },
  python: { ext: "py", source: "pi_lens_validate = 1\n" },
  ruby: { ext: "rb", source: "pi_lens_validate = 1\n" },
  rust: { ext: "rs", source: "fn main() {}\n" },
  tsx: { ext: "tsx", source: "export function App() { return <div />; }\n" },
  typescript: { ext: "ts", source: "const piLensValidate = 1;\n" },
  yaml: { ext: "yaml", source: "piLensValidate: true\n" }
};
function validationSnippetFor(language) {
  const key = language.toLowerCase().replace(/^"|"$/g, "");
  return VALIDATION_SNIPPETS[key] ?? {
    ext: key.replace(/[^a-z0-9_-]/gi, "") || "txt",
    source: "pi_lens_validate\n"
  };
}
function validateInputShape(value, maxChars, label) {
  if (value.includes("\0"))
    return `${label} contains NUL bytes`;
  if (value.length > maxChars) {
    return `${label} is too large (${value.length} chars, max ${maxChars})`;
  }
  return void 0;
}
function extractRuleLanguage(ruleYaml) {
  return /^[^\S\n\r\u2028\u2029]*language:\s*([^\s#]+)/im.exec(ruleYaml)?.[1];
}
function stderrHasError(stderr) {
  return stderr.split(/\r?\n/).some((line) => /^\s*(error|Error):/.test(line));
}
function formatDebugAst(tree, source) {
  const offsets = lineStartOffsets(source);
  return tree.split(/\r\n|\n/).map((line) => {
    const match = /^([ \t]*)([^ \t(][^(]*)? \((\d+),(\d+)\)-\((\d+),(\d+)\)$/.exec(line);
    if (!match)
      return line;
    const [, indent = "", label = "", startLine, startCol, endLine, endCol] = match;
    const sl = Number(startLine);
    const sc = Number(startCol);
    const el = Number(endLine);
    const ec = Number(endCol);
    const snippet = snippetForRange(source, offsets, sl, sc, el, ec);
    return `${indent}${label} [${sl + 1},${sc + 1}] - [${el + 1},${ec + 1}] ${JSON.stringify(snippet)}`;
  }).join("\n");
}
var AstGrepClient = class {
  ruleDir;
  log;
  ruleManager;
  runner;
  // #2636 review F3/F7:
  usingBundledRuleDirFallback;
  rulesHealthReportedGeneration;
  constructor(ruleDir, verbose = false) {
    const projectRuleDir = path4.join(process.cwd(), "rules");
    const hasProjectRuleDir = fs4.existsSync(projectRuleDir);
    this.usingBundledRuleDirFallback = !ruleDir && !hasProjectRuleDir;
    this.ruleDir = ruleDir || (hasProjectRuleDir ? projectRuleDir : resolvePackagePath(import.meta.url, "rules"));
    this.log = verbose ? createSubsystemLogger("ast-grep") : () => {
    };
    this.ensureRulesHealthReported();
    this.ruleManager = new AstGrepRuleManager(ruleDir ? this.ruleDir : [projectRuleDir, getUserRuleRoot(), this.ruleDir], this.log, () => getAstGrepRuleFingerprint(process.cwd()));
    this.runner = new SgRunner(verbose);
  }
  /**
   * #2636 review F3: `AstGrepClient` is a per-PROCESS singleton
   * (`index.ts`/`mcp/server.ts`/`clients/mcp/session.ts` each construct it
   * exactly once), but `resetDegradationLedger()` wipes the ledger's
   * once-per-subject latch on EVERY `session_start`
   * (`runtime-session.ts`'s `handleSessionStart`). A report that only ever
   * fires at construction is therefore invisible after the first session
   * boundary — `pilens_health` shows nothing for a bug that is still there
   * (shape 17's inverse: `resolveSkillPaths`/`ruleFilesForLanguage` avoid
   * this because pi calls them fresh per request, but `AstGrepClient` has
   * no such per-request re-entry).
   *
   * Re-checked against the ledger's own generation counter at the START of
   * every real scan entry point (`ensureAvailable`, called by every
   * `tools/ast-grep-*`/`ast-dump` handler before doing any work) — the same
   * pattern `clients/tree-sitter-client.ts`'s `refreshGrammarSessionLatches`
   * uses for its own per-instance session latches, adapted here: the
   * degradation ledger already re-arms its OWN once-per-subject dedup on
   * reset, so this method only has to decide WHETHER to call
   * `reportAstGrepRulesHealth` again, never re-implement the dedup itself.
   */
  ensureRulesHealthReported() {
    const generation = getDegradationLedgerGeneration();
    if (this.rulesHealthReportedGeneration === generation)
      return;
    this.rulesHealthReportedGeneration = generation;
    if (this.usingBundledRuleDirFallback) {
      reportAstGrepRulesHealth(this.ruleDir);
    }
  }
  /**
   * Check if ast-grep CLI is available, auto-install if not
   */
  ensureAvailable() {
    this.ensureRulesHealthReported();
    return this.runner.ensureAvailable();
  }
  /**
   * Replace using a raw YAML rule that includes a `fix:` field (Phase 3/4 of #125).
   * Dry-run returns matches for preview; apply writes fixes to disk.
   */
  async replaceWithRule(ruleYaml, paths, apply, options) {
    const allMatches = [];
    for (const scanPath of paths) {
      if (apply) {
        const preCheck = await this.tempScanDetailed(scanPath, ruleYaml);
        if (preCheck.failure || preCheck.error) {
          return {
            matches: allMatches,
            totalMatches: allMatches.length,
            applied: false,
            error: preCheck.error ?? "ast-grep preview failed"
          };
        }
        if (preCheck.matches.length === 0) {
          return {
            matches: [],
            totalMatches: 0,
            applied: false,
            stalePreview: true
          };
        }
      }
      const result = await this.runner.tempScanWithFixAsync(scanPath, "agent-rule", ruleYaml, apply);
      if (result.error) {
        return {
          matches: allMatches,
          totalMatches: allMatches.length,
          applied: false,
          error: result.error
        };
      }
      allMatches.push(...result.matches);
    }
    if (apply)
      recordAstGrepApply(allMatches, options?.lineage, options?.toolCallId);
    return {
      matches: allMatches,
      totalMatches: allMatches.length,
      applied: apply
    };
  }
  /**
   * Search using a raw YAML rule (Phase 4 of #125).
   * Routes through sg scan --config rather than sg run -p.
   * Each path is scanned independently; results are merged.
   */
  async tempScanDetailed(dir, ruleYaml, options = {}) {
    const detailed = this.runner.tempScanDetailedAsync;
    if (detailed) {
      return detailed.call(this.runner, dir, "agent-rule", ruleYaml, 3e4, options);
    }
    const matches = await this.runner.tempScanAsync(dir, "agent-rule", ruleYaml, 3e4, options);
    return { matches, status: 0 };
  }
  async searchWithRule(ruleYaml, paths, options = {}) {
    const allMatches = [];
    for (const scanPath of paths) {
      try {
        const results = await this.tempScanDetailed(scanPath, ruleYaml, options);
        if (results.failure || results.error) {
          return {
            matches: allMatches,
            totalMatches: allMatches.length,
            error: results.error || `ast-grep scan failed (${results.failure ?? "unknown failure"})`
          };
        }
        allMatches.push(...results.matches);
      } catch (err) {
        return {
          matches: allMatches,
          totalMatches: allMatches.length,
          error: String(err)
        };
      }
    }
    return { matches: allMatches, totalMatches: allMatches.length };
  }
  /**
   * Dump the parsed tree-sitter AST for a snippet using ast-grep CLI.
   */
  async dumpAst(source, lang, options = {}) {
    const tmpDir = fs4.mkdtempSync(path4.join(os2.tmpdir(), "pi-lens-ast-dump-"));
    const tmpFile = path4.join(tmpDir, `snippet.${lang.replace(/[^a-z0-9_-]/gi, "") || "txt"}`);
    try {
      fs4.writeFileSync(tmpFile, source, "utf-8");
      const mode = options.includeAnonymous ? "cst" : "ast";
      const result = await this.runner.execRaw([
        "run",
        "--lang",
        lang,
        "-p",
        source,
        `--debug-query=${mode}`,
        tmpFile
      ]);
      const raw = result.stderr || result.stdout;
      const tree = extractDebugAst(raw);
      if (tree)
        return { output: formatDebugAst(tree, source) };
      return {
        error: result.error || result.stderr.trim() || result.stdout.trim() || `ast-grep did not return a debug AST for language ${lang}`
      };
    } finally {
      fs4.rmSync(tmpDir, { recursive: true, force: true });
    }
  }
  async validatePattern(pattern, lang, options) {
    const shapeError = validateInputShape(pattern, MAX_VALIDATE_PATTERN_CHARS, "pattern");
    if (shapeError)
      return { valid: false, error: shapeError };
    const snippet = validationSnippetFor(lang);
    const tmpDir = fs4.mkdtempSync(path4.join(os2.tmpdir(), "pi-lens-sg-validate-"));
    const tmpFile = path4.join(tmpDir, `snippet.${snippet.ext}`);
    try {
      fs4.writeFileSync(tmpFile, snippet.source, "utf-8");
      const args = ["run", "-p", pattern, "--lang", lang, "--json=compact"];
      if (options?.selector)
        args.push("--selector", options.selector);
      if (options?.strictness)
        args.push("--strictness", options.strictness);
      args.push(tmpFile);
      const result = await this.runner.execRaw(args, 1e4, options);
      const stderr = result.stderr.trim();
      const stdout = result.stdout.trim();
      if (truncatedByOutputCap(result)) {
        return {
          valid: false,
          error: "ast-grep validation output was truncated"
        };
      }
      if (result.error)
        return { valid: false, error: result.error };
      if (result.status !== 0 && !(result.status === 1 && !stderr)) {
        return {
          valid: false,
          error: stderr || `ast-grep validation failed with exit code ${result.status}`
        };
      }
      if (stderrHasError(stderr))
        return { valid: false, error: stderr };
      const warning = stderr || stdout || void 0;
      return {
        valid: true,
        ...warning ? { warning } : {}
      };
    } finally {
      try {
        fs4.rmSync(tmpDir, { recursive: true, force: true });
      } catch {
      }
    }
  }
  async validateRule(ruleYaml, options = {}) {
    const shapeError = validateInputShape(ruleYaml, MAX_VALIDATE_RULE_CHARS, "rule");
    if (shapeError)
      return { valid: false, error: shapeError };
    const language = extractRuleLanguage(ruleYaml) ?? "typescript";
    const snippet = validationSnippetFor(language);
    const tmpDir = fs4.mkdtempSync(path4.join(os2.tmpdir(), "pi-lens-sg-rule-"));
    try {
      fs4.writeFileSync(path4.join(tmpDir, `snippet.${snippet.ext}`), snippet.source, "utf-8");
      const result = await this.tempScanDetailed(tmpDir, ruleYaml, options);
      if (result.failure || result.error) {
        return {
          valid: false,
          error: result.error || `ast-grep rule validation failed (${result.failure ?? "unknown failure"})`
        };
      }
      return { valid: true };
    } catch (err) {
      return { valid: false, error: String(err) };
    } finally {
      try {
        fs4.rmSync(tmpDir, { recursive: true, force: true });
      } catch {
      }
    }
  }
  /**
   * Syntax-only code outline via `ast-grep outline` (#311) — symbols, imports,
   * exports, and members for file or directory input. Raw, fast, no index/LSP;
   * complements module_report (which adds the cached graph's who-uses-this,
   * complexity, and blast radius). Returns parsed JSON; args go through
   * `execRaw` (execFile-style, no shell), so no interpolation risk.
   */
  async outline(paths, options = {}) {
    if (paths.length === 0)
      return { error: "no paths provided" };
    const args = ["outline", "--json=compact", "--color", "never"];
    if (options.lang)
      args.push("--lang", options.lang);
    if (options.items)
      args.push("--items", options.items);
    if (options.view)
      args.push("--view", options.view);
    if (options.types?.length)
      args.push("--type", options.types.join(","));
    if (options.match)
      args.push("--match", options.match);
    if (options.pubMembers)
      args.push("--pub-members");
    for (const glob of options.globs ?? [])
      args.push("--globs", glob);
    args.push(...paths);
    const result = await this.runner.execRaw(args);
    const raw = (result.stdout ?? "").trim();
    if (!raw) {
      return {
        error: result.error || result.stderr?.trim() || "ast-grep outline returned no output"
      };
    }
    try {
      return { output: JSON.parse(raw) };
    } catch (err) {
      return {
        error: `failed to parse ast-grep outline JSON: ${err instanceof Error ? err.message : String(err)}`
      };
    }
  }
  /**
   * Search for AST patterns in files
   */
  async search(pattern, lang, paths, options) {
    const args = ["run", "-p", pattern, "--lang", lang, "--json=compact"];
    if (options?.selector) {
      args.push("--selector", options.selector);
    }
    if (options?.context !== void 0) {
      args.push("--context", String(options.context));
    }
    if (options?.strictness) {
      args.push("--strictness", options.strictness);
    }
    args.push(...paths);
    const result = await this.runner.exec(args, options);
    return {
      matches: result.matches,
      totalMatches: result.totalMatches,
      truncated: result.truncated,
      error: result.error
    };
  }
  /**
   * Search and replace AST patterns
   */
  async replace(pattern, rewrite, lang, paths, apply = false, options) {
    const baseArgs = ["run", "-p", pattern, "-r", rewrite, "--lang", lang];
    if (options?.strictness) {
      baseArgs.push("--strictness", options.strictness);
    }
    if (!apply) {
      const result = await this.runner.exec([
        ...baseArgs,
        "--json=compact",
        ...paths
      ]);
      return {
        matches: result.matches,
        totalMatches: result.totalMatches,
        truncated: result.truncated,
        applied: false,
        error: result.error
      };
    }
    const preCheck = await this.runner.exec([
      ...baseArgs,
      "--json=compact",
      ...paths
    ]);
    if (preCheck.error) {
      return {
        matches: [],
        totalMatches: 0,
        truncated: false,
        applied: false,
        error: preCheck.error
      };
    }
    if (preCheck.matches.length === 0) {
      return {
        matches: [],
        totalMatches: 0,
        truncated: false,
        applied: false,
        stalePreview: true
      };
    }
    const applyResult = await this.runner.exec([
      ...baseArgs,
      "--update-all",
      ...paths
    ]);
    if (applyResult.error) {
      return {
        matches: [],
        totalMatches: 0,
        truncated: false,
        applied: false,
        error: applyResult.error
      };
    }
    recordAstGrepApply(preCheck.matches, options?.lineage, options?.toolCallId);
    return {
      matches: preCheck.matches,
      totalMatches: preCheck.totalMatches,
      truncated: preCheck.truncated,
      applied: true,
      error: void 0
    };
  }
  /**
   * Run a one-off scan with a temporary rule and configuration
   */
  async runTempScanAsync(dir, ruleId, ruleYaml, timeout = 3e4) {
    if (!await this.ensureAvailable())
      return [];
    return this.runner.tempScanAsync(dir, ruleId, ruleYaml, timeout);
  }
  /**
   * Find similar functions by comparing normalized AST structure
   */
  async findSimilarFunctions(dir, lang = "typescript") {
    const ruleYaml = `id: find-functions
language: ${lang}
rule:
  kind: function_declaration
severity: info
message: found
`;
    const matches = await this.runTempScanAsync(dir, "find-functions", ruleYaml);
    if (matches.length === 0)
      return [];
    return this.groupSimilarFunctions(matches);
  }
  groupSimilarFunctions(matches) {
    const grouped = /* @__PURE__ */ new Map();
    for (const item of matches) {
      const name = this.extractFunctionName(item.text);
      if (!name)
        continue;
      const signature = this.normalizeFunction(item.text);
      const line = (item.range?.start?.line || item.labels?.[0]?.range?.start?.line || 0) + 1;
      const group = grouped.get(signature) ?? [];
      group.push({ name, file: item.file, line });
      grouped.set(signature, group);
    }
    return Array.from(grouped.entries()).filter(([, functions]) => functions.length > 1).map(([pattern, functions]) => ({ pattern, functions }));
  }
  /**
   * Extract function name from match text
   */
  extractFunctionName(text) {
    return text.match(/function\s+(\w+)/)?.[1] ?? null;
  }
  normalizeFunction(text) {
    const normalizedText = text.replace(/function\s+\w+/, "function FN").replace(/\bconst\b|\blet\b|\bvar\b/g, "VAR").replace(/["'].*?["']/g, "STR").replace(/`[^`]*`/g, "TMPL").replace(/\b\d+\b/g, "NUM").replace(/\btrue\b|\bfalse\b/g, "BOOL").replace(/\/\/.*/g, "").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ").trim();
    const bodyMatch = normalizedText.match(/\{(.*)\}/);
    const body = bodyMatch ? bodyMatch[1].trim() : normalizedText;
    return body.slice(0, 200);
  }
  /**
   * Scan for exported function names in a directory
   */
  async scanExports(dir, lang = "typescript") {
    const exports = /* @__PURE__ */ new Map();
    const ruleYaml = `id: find-functions
language: ${lang}
rule:
  kind: function_declaration
severity: info
message: found
`;
    const matches = await this.runTempScanAsync(dir, "find-functions", ruleYaml, 15e3);
    this.log(`scanExports output length: ${matches.length}`);
    for (const item of matches) {
      const text = item.text || "";
      const nameMatch = text.match(/function\s+(\w+)/);
      if (nameMatch?.[1]) {
        this.log(`scanExports found: ${nameMatch[1]} in ${item.file}`);
        exports.set(nameMatch[1], item.file);
      }
    }
    return exports;
  }
  formatMatches(matches, isDryRun = false, showModeIndicator = false, maxItems = 50) {
    return this.runner.formatMatches(matches, isDryRun, maxItems, showModeIndicator);
  }
  /**
   * Format diagnostics for LLM consumption
   */
  formatDiagnostics(diags) {
    if (diags.length === 0)
      return "";
    const errors = diags.filter((d) => d.severity === "error");
    const warnings = diags.filter((d) => d.severity === "warning");
    const infos = diags.filter((d) => d.severity === "info");
    const hints = diags.filter((d) => d.severity === "hint");
    let output = `[ast-grep] ${diags.length} structural issue(s)`;
    if (errors.length)
      output += ` \u2014 ${errors.length} error(s)`;
    if (warnings.length)
      output += ` \u2014 ${warnings.length} warning(s)`;
    if (infos.length)
      output += ` \u2014 ${infos.length} info(s)`;
    if (hints.length)
      output += ` \u2014 ${hints.length} hint(s)`;
    output += ":\n";
    for (const d of diags.slice(0, 10)) {
      const loc = d.line === d.endLine ? `L${d.line}` : `L${d.line}-${d.endLine}`;
      const ruleInfo = d.ruleDescription ? `${d.rule}: ${d.ruleDescription.message}` : d.rule;
      const fix = d.fix || d.ruleDescription?.note ? " [fixable]" : "";
      output += `  ${ruleInfo} (${loc})${fix}
`;
      if (d.ruleDescription?.note) {
        const shortNote = d.ruleDescription.note.split(/\r?\n/)[0];
        output += `    \u2192 ${shortNote}
`;
      }
    }
    if (diags.length > 10) {
      output += `  ... and ${diags.length - 10} more
`;
    }
    return output;
  }
  getRuleDescription(ruleId) {
    return this.ruleManager.loadRuleDescriptions().get(ruleId);
  }
};

// dist/clients/lens-engine.js
import * as path29 from "node:path";

// dist/clients/project-diagnostics/scanner.js
import * as fs6 from "node:fs";
import * as path6 from "node:path";

// dist/clients/project-diagnostics/cache.js
import * as fs5 from "node:fs";
import * as path5 from "node:path";
var PROJECT_DIAGNOSTICS_CACHE_VERSION = 3;
var SNAPSHOT_CACHE_FILE = "project-diagnostics.json";
var DELTA_CACHE_FILE = "project-diagnostics-delta.json";
function cachePath(cwd, fileName) {
  return path5.join(getProjectDataDir(cwd), "cache", fileName);
}
function loadProjectDiagnosticsSnapshot(cwd) {
  return readJsonCache(cachePath(cwd, SNAPSHOT_CACHE_FILE), (parsed) => {
    if (!parsed || typeof parsed !== "object")
      return void 0;
    const snapshot = parsed;
    if (snapshot.version !== PROJECT_DIAGNOSTICS_CACHE_VERSION)
      return void 0;
    if (!Array.isArray(snapshot.diagnostics))
      return void 0;
    return snapshot;
  });
}
function saveProjectDiagnosticsSnapshot(cwd, snapshot) {
  const filePath = cachePath(cwd, SNAPSHOT_CACHE_FILE);
  fs5.mkdirSync(path5.dirname(filePath), { recursive: true });
  writeFileAtomic(filePath, JSON.stringify(snapshot, null, 2));
}
function loadProjectDiagnosticsDeltaReport(cwd) {
  return readJsonCache(cachePath(cwd, DELTA_CACHE_FILE), (parsed) => {
    if (!parsed || typeof parsed !== "object")
      return void 0;
    const report = parsed;
    if (report.version !== PROJECT_DIAGNOSTICS_CACHE_VERSION)
      return void 0;
    if (!Array.isArray(report.diagnostics))
      return void 0;
    return report;
  });
}
function writeProjectDiagnosticsDeltaReport(cwd, report) {
  const filePath = cachePath(cwd, DELTA_CACHE_FILE);
  fs5.mkdirSync(path5.dirname(filePath), { recursive: true });
  writeFileAtomic(filePath, JSON.stringify(report, null, 2));
}
function reconcileProjectDiagnosticsSnapshot(snapshot) {
  const scannedAtMs = Date.parse(snapshot.scannedAt);
  if (!Number.isFinite(scannedAtMs))
    return { snapshot, staleDropped: 0 };
  const staleByFile = /* @__PURE__ */ new Map();
  const isStale = (filePath) => {
    const cached = staleByFile.get(filePath);
    if (cached !== void 0)
      return cached;
    let stale;
    let stat;
    try {
      stat = fs5.statSync(filePath);
    } catch {
      stat = void 0;
    }
    const fingerprint = snapshot.fileFingerprints?.[filePath];
    if (fingerprint && stat) {
      stale = true;
      if (stat.size === fingerprint.sizeBytes) {
        try {
          stale = hashDiagnosticContent(fs5.readFileSync(filePath, "utf-8")) !== fingerprint.contentHash;
        } catch {
          stale = true;
        }
      }
      staleByFile.set(filePath, stale);
      return stale;
    }
    const verdict = freshnessFromMtime({
      mtimeMs: stat?.mtimeMs,
      referenceMs: scannedAtMs
    });
    stale = verdict.verdict !== "fresh";
    staleByFile.set(filePath, stale);
    return stale;
  };
  const kept = snapshot.diagnostics.filter((d) => !isStale(d.filePath));
  if (kept.length === snapshot.diagnostics.length) {
    return { snapshot, staleDropped: 0 };
  }
  const staleDropped = [...staleByFile.values()].filter(Boolean).length;
  return { snapshot: { ...snapshot, diagnostics: kept }, staleDropped };
}

// dist/clients/project-diagnostics/scanner.js
var AST_GREP_MAX_FILE_BYTES = 1024 * 1024;
var AST_GREP_SCAN_MAX_MATCHES_PER_RULE = 25;
var AST_GREP_SCAN_MAX_DIAGNOSTICS_PER_FILE = 100;
var FACT_RULE_EXTENSIONS = /* @__PURE__ */ new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs"
]);
var TREE_SITTER_EXT_TO_LANG = EXT_TO_LANG;
function normalizeSeverity(severity) {
  if (severity === "error" || severity === "warning" || severity === "hint") {
    return severity;
  }
  return severity === "info" ? "info" : "warning";
}
function normalizeSemantic(diagnostic) {
  if (diagnostic.semantic === "blocking")
    return "blocking";
  if (diagnostic.semantic === "warning")
    return "warning";
  return "none";
}
function fromDispatchDiagnostic(diagnostic, runner) {
  return {
    filePath: path6.resolve(diagnostic.filePath),
    line: diagnostic.line,
    column: diagnostic.column,
    severity: normalizeSeverity(diagnostic.severity),
    semantic: normalizeSemantic(diagnostic),
    tool: diagnostic.tool,
    runner,
    rule: diagnostic.rule,
    code: diagnostic.code,
    message: diagnostic.message,
    source: "project-scan"
  };
}
async function scanFileMajorRules(cwd, files, signal) {
  const client = getSharedTreeSitterClient();
  client?.ensureTreeCacheCapacity(files.length);
  const treeSitterReady = !!client && client.isAvailable() && await client.init();
  const queryMap = treeSitterReady ? await queryLoader.loadQueries(cwd) : void 0;
  const facts = new FactStore("project-diagnostics-scanner");
  const pi = { getFlag: () => void 0 };
  const treeSitter = [];
  const factRules = [];
  const astGrep = [];
  const fingerprints = {};
  const sgModule = await loadSg();
  let phaseOneFilesScanned = 0;
  let astGrepFilesScanned = 0;
  let astGrepDurationMs = 0;
  let filesScanned = 0;
  let wasmAborted = isTreeSitterWasmAborted();
  const ruleCoverage = /* @__PURE__ */ new Map();
  const hasTreeSitterRules = (langId) => {
    if (!queryMap || !client)
      return false;
    const memo = ruleCoverage.get(langId);
    if (memo !== void 0)
      return memo;
    const covered = queriesForLanguage(queryMap, langId).length > 0;
    ruleCoverage.set(langId, covered);
    return covered;
  };
  const scanTreeSitterFile = async (filePath, langId, content) => {
    if (!queryMap || !langId || !client || content === null)
      return;
    const queries = queriesForLanguage(queryMap, langId);
    try {
      const found = await client.runQueriesOnFile(queries, filePath, langId, { maxResults: 50 }, content);
      for (const { queryDef: query, match } of found) {
        treeSitter.push({
          filePath,
          line: match.line ?? 1,
          column: match.column,
          severity: query.severity === "error" ? "error" : query.severity,
          semantic: query.inline_tier === "blocking" || query.severity === "error" ? "blocking" : "warning",
          tool: "tree-sitter",
          runner: "tree-sitter",
          rule: query.id,
          message: query.message,
          source: "project-scan"
        });
      }
    } catch {
    }
  };
  const scanFactRulesFile = async (filePath, content) => {
    facts.dropFileFacts(filePath);
    facts.setFileFact(filePath, "file.content", content);
    const ctx = createDispatchContext(filePath, cwd, pi, facts, false);
    try {
      await runProviders(ctx);
      for (const diagnostic of evaluateRules(ctx)) {
        factRules.push(fromDispatchDiagnostic(diagnostic, "fact-rules"));
      }
    } catch {
    }
  };
  const scanAstGrepFile = (filePath, content, lang) => {
    const startedAt2 = Date.now();
    try {
      const rootNode = lang.parse(content).root();
      const fileDiagnostics = evaluateAstGrepRules(filePath, rootNode, cwd, detectFileKind(filePath), {
        maxMatchesPerRule: AST_GREP_SCAN_MAX_MATCHES_PER_RULE,
        maxTotalDiagnostics: AST_GREP_SCAN_MAX_DIAGNOSTICS_PER_FILE,
        content,
        sgModule
      });
      for (const diagnostic of fileDiagnostics) {
        astGrep.push(fromDispatchDiagnostic(diagnostic, "ast-grep-napi"));
      }
    } catch {
    } finally {
      astGrepFilesScanned++;
      astGrepDurationMs += Date.now() - startedAt2;
    }
  };
  const scan = async () => {
    for (const filePath of files) {
      if (signal?.aborted || isTreeSitterWasmAborted()) {
        wasmAborted ||= isTreeSitterWasmAborted();
        break;
      }
      if (isTestFile(filePath))
        continue;
      const ext = path6.extname(filePath);
      const grammarId = TREE_SITTER_EXT_TO_LANG[ext];
      const langId = grammarId && hasTreeSitterRules(grammarId) ? grammarId : void 0;
      const factEligible = FACT_RULE_EXTENSIONS.has(ext);
      let astGrepLang;
      if (sgModule && canHandle(filePath)) {
        try {
          if (fs6.statSync(filePath).size <= AST_GREP_MAX_FILE_BYTES) {
            astGrepLang = getLang(filePath, sgModule);
          }
        } catch {
        }
      }
      if (!langId && !factEligible && !astGrepLang)
        continue;
      if (langId || factEligible)
        phaseOneFilesScanned++;
      let content;
      let contentBytes;
      try {
        const buf = fs6.readFileSync(filePath);
        contentBytes = buf.length;
        content = buf.toString("utf-8");
      } catch {
        content = null;
        contentBytes = void 0;
      }
      const rowsBeforeFile = treeSitter.length + factRules.length + astGrep.length;
      try {
        await scanTreeSitterFile(filePath, langId, content);
        if (isTreeSitterWasmAborted()) {
          wasmAborted = true;
          break;
        }
        if (factEligible) {
          await scanFactRulesFile(filePath, content);
          if (isTreeSitterWasmAborted()) {
            wasmAborted = true;
            break;
          }
        }
        let graphIr;
        if (content !== null) {
          try {
            graphIr = await captureReviewGraphStructuralIr(filePath, cwd, content, facts);
          } catch {
            graphIr = { complete: false };
          }
          if (isTreeSitterWasmAborted()) {
            wasmAborted = true;
            break;
          }
        }
        if (signal?.aborted) {
          astGrep.length = 0;
          break;
        }
        if (astGrepLang && content !== null) {
          scanAstGrepFile(filePath, content, astGrepLang);
        }
        if (signal?.aborted)
          break;
        if (content !== null && graphIr?.complete && graphIr.structural) {
          publishReviewGraphFileIr(cwd, {
            filePath,
            contentHash: reviewGraphIrContentHash(content),
            ...graphIr
          });
        }
        if (content !== null && contentBytes !== void 0 && treeSitter.length + factRules.length + astGrep.length > rowsBeforeFile) {
          fingerprints[filePath] = {
            sizeBytes: contentBytes,
            contentHash: hashDiagnosticContent(content)
          };
        }
        filesScanned++;
      } finally {
        facts.dropFileFacts(filePath);
      }
    }
    if (wasmAborted) {
      astGrep.length = 0;
    }
  };
  if (!client) {
    await scan();
    return {
      treeSitter,
      factRules,
      astGrep,
      filesScanned,
      wasmAborted,
      fingerprints
    };
  }
  const startedAt = Date.now();
  await client.withParseCacheMeasurement(scan, (stats) => {
    logTreeSitterCacheStats({
      scope: "project_diagnostics_scan",
      filePath: cwd,
      fileCount: phaseOneFilesScanned,
      // The merged pass interleaves ast-grep with the phase-one consumers;
      // subtract its share so this metric stays comparable to the historical
      // phase-major scans.
      durationMs: Date.now() - startedAt - astGrepDurationMs,
      stats,
      // #1935 review: ast-grep's own cost is often a scan's most expensive
      // phase (production evidence: 13168ms over 86 files, the single
      // biggest contributor). Its duration is subtracted above so it stays
      // comparable to the historical phase-major scans; carry it here too
      // so it stays visible SOMEWHERE instead of disappearing when the
      // vacuous `project_diagnostics_ast_grep_scan` cache_stats record
      // (below) was removed.
      astGrep: {
        durationMs: astGrepDurationMs,
        fileCount: astGrepFilesScanned
      }
    });
  });
  return {
    treeSitter,
    factRules,
    astGrep,
    filesScanned,
    wasmAborted,
    fingerprints
  };
}
async function scanProjectDiagnostics(options) {
  const cwd = path6.resolve(options.cwd);
  const { signal } = options;
  if (!options.files && isAtOrAboveHomeDir(cwd, options.homeDir)) {
    return {
      version: PROJECT_DIAGNOSTICS_CACHE_VERSION,
      cwd,
      tier: options.tier,
      scannedAt: (/* @__PURE__ */ new Date()).toISOString(),
      diagnostics: [],
      filesScanned: 0,
      runners: [],
      unsafeRoot: true
    };
  }
  const maxFiles = Math.max(1, options.maxFiles ?? getProjectDiagnosticsScannerMaxFiles(cwd));
  const collected = options.files ? { files: options.files.slice(0, maxFiles), entryBudgetExceeded: false } : await collectSourceFilesWithBudgetAsync(cwd, {
    maxFiles,
    maxScanEntries: options.maxScanEntries,
    // #1107 phase 2 review: the actionable opt-out generatedSkipNotice
    // points a user at.
    includeGenerated: options.includeGenerated === true
  });
  const files = collected.files;
  const runners = [];
  const diagnostics = [];
  let fileFingerprints = {};
  let wasmAborted = false;
  let filesScanned = files.length;
  if (!signal?.aborted) {
    const scanned = await scanFileMajorRules(cwd, files, signal);
    diagnostics.push(...scanned.treeSitter, ...scanned.factRules);
    runners.push("tree-sitter", "fact-rules");
    wasmAborted = scanned.wasmAborted;
    if (wasmAborted)
      filesScanned = scanned.filesScanned;
    if (!signal?.aborted && !wasmAborted) {
      diagnostics.push(...scanned.astGrep);
      runners.push("ast-grep-napi");
    }
    const rowFiles = new Set(diagnostics.map((d) => d.filePath));
    fileFingerprints = Object.fromEntries(Object.entries(scanned.fingerprints).filter(([file]) => rowFiles.has(file)));
  }
  const snapshot = {
    version: PROJECT_DIAGNOSTICS_CACHE_VERSION,
    cwd,
    tier: options.tier,
    scannedAt: (/* @__PURE__ */ new Date()).toISOString(),
    diagnostics,
    filesScanned,
    runners,
    fileFingerprints
  };
  if (collected.entryBudgetExceeded)
    snapshot.scanTruncated = true;
  if (collected.generatedOrArtifactSkips) {
    snapshot.generatedFileSkips = collected.generatedOrArtifactSkips;
  }
  if (collected.generatedNameOnlySkips) {
    snapshot.generatedNameOnlySkips = collected.generatedNameOnlySkips;
  }
  if (collected.generatedDirSkips) {
    snapshot.generatedDirSkips = collected.generatedDirSkips;
  }
  if (wasmAborted) {
    snapshot.scanTruncated = true;
    snapshot.treeSitterStatus = "wasm_aborted_restart_required";
    logTreeSitter({
      phase: "runner_skip",
      filePath: cwd,
      status: "aborted",
      reason: "wasm_aborted_mid_scan",
      metadata: {
        scope: "project_diagnostics_scan",
        filesScanned,
        totalFiles: files.length,
        abortPoint: filesScanned + 1
      }
    });
  }
  if (signal?.aborted || options.files || wasmAborted)
    return snapshot;
  saveProjectDiagnosticsSnapshot(cwd, snapshot);
  return snapshot;
}

// dist/clients/mcp/review.js
import { spawn } from "node:child_process";
import { existsSync as existsSync4 } from "node:fs";
import { join as join6 } from "node:path";
function resolveRebuildScript(serverFilePath) {
  return serverFilePath.replace(/\\/g, "/").includes("/dist/") ? "build:dist" : "build";
}
function analyzeFileFresh(workerPath, file, cwd, options = {}, timeoutMs = 12e4) {
  return new Promise((resolve32) => {
    const args = [workerPath, `--file=${file}`, `--cwd=${cwd}`];
    if (options.flags)
      args.push(`--flags=${JSON.stringify(options.flags)}`);
    let child;
    try {
      child = spawn(process.execPath, args, {
        stdio: ["ignore", "pipe", "pipe"]
      });
    } catch (err) {
      resolve32({
        error: `failed to fork worker: ${err instanceof Error ? err.message : String(err)}`
      });
      return;
    }
    const stdout = createBoundedOutputSink();
    const stderr = createBoundedOutputSink();
    let settled = false;
    const finish = (outcome) => {
      if (settled)
        return;
      settled = true;
      clearTimeout(timer);
      resolve32(outcome);
    };
    const timer = setTimeout(() => {
      child.kill();
      finish({ error: `fresh analyze timed out after ${timeoutMs}ms` });
    }, timeoutMs);
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      if (settled)
        return;
      stdout.append(chunk);
      if (!stdout.truncated)
        return;
      incrementDegradationCount({
        kind: "spawn-output-cap-truncated",
        subject: "mcp-fresh-analyze",
        reason: `worker stdout reached the ${DEFAULT_MAX_OUTPUT_BYTES}-byte default cap after ${stdout.observedBytes} bytes; worker terminated`,
        metadata: {
          capBytes: DEFAULT_MAX_OUTPUT_BYTES,
          capSource: "default",
          observedBytes: stdout.observedBytes,
          killed: true
        }
      });
      try {
        child.kill();
      } catch {
      }
      finish({
        error: `worker output exceeded ${DEFAULT_MAX_OUTPUT_BYTES} bytes`
      });
    });
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => {
      if (settled)
        return;
      stderr.append(chunk);
    });
    child.on("error", (err) => finish({ error: `failed to fork worker: ${err.message}` }));
    child.on("close", (code) => {
      if (code !== 0) {
        finish({
          error: `worker exited ${code}: ${stderr.text.trim() || "(no stderr)"}`
        });
        return;
      }
      try {
        finish({ result: JSON.parse(stdout.text) });
      } catch {
        finish({
          error: `worker produced invalid JSON (${stderr.text.trim() || stdout.text.slice(0, 200)})`
        });
      }
    });
  });
}
function canRebuildPiLens(repoRoot) {
  const inNodeModules = /(^|[\\/])node_modules([\\/]|$)/i.test(repoRoot);
  return !inNodeModules && existsSync4(join6(repoRoot, "tsconfig.dist.json"));
}
var REBUILD_UNAVAILABLE_MESSAGE = "pilens_rebuild is unavailable in an installed pi-lens package. Rebuilding is only safe from a source checkout containing tsconfig.dist.json; reinstall or update pi-lens through your package manager instead.";
async function runRebuild(repoRoot, script, timeoutMs = 3e5) {
  const start = Date.now();
  if (!canRebuildPiLens(repoRoot)) {
    return {
      ok: false,
      script,
      durationMs: Date.now() - start,
      output: REBUILD_UNAVAILABLE_MESSAGE
    };
  }
  const packageManager = await resolveNodePackageManager(repoRoot);
  const res = await safeSpawnAsync(pmBinary(packageManager), runScriptArgs(script), {
    cwd: repoRoot,
    timeout: timeoutMs,
    ignoreAmbientSignal: true
  });
  const output = `${res.stdout}
${res.stderr}`.trim();
  return {
    ok: !res.error && res.status === 0,
    script,
    packageManager,
    durationMs: Date.now() - start,
    output: output.slice(-2e3)
  };
}
function summarizeScan(diagnostics) {
  const seen = /* @__PURE__ */ new Set();
  const deduped = [];
  const byRule = {};
  const byFile = {};
  for (const diagnostic of diagnostics) {
    const ruleId = diagnostic.rule ?? diagnostic.runner ?? diagnostic.tool ?? "unknown";
    const key = `${diagnostic.filePath}|${diagnostic.line ?? "?"}|${diagnostic.column ?? "?"}|${ruleId}`;
    if (seen.has(key))
      continue;
    seen.add(key);
    deduped.push(diagnostic);
    byRule[ruleId] = (byRule[ruleId] ?? 0) + 1;
    byFile[diagnostic.filePath] = (byFile[diagnostic.filePath] ?? 0) + 1;
  }
  return { deduped, byRule, byFile };
}

// dist/clients/mcp/session.js
import * as crypto from "node:crypto";
import * as fs18 from "node:fs";
import * as path25 from "node:path";

// dist/clients/bootstrap.js
var residentClients = null;
var bootstrapShutdown = false;
var bootstrapShutdownController = new AbortController();
var bootstrapFailureStrikes = 0;
var bootstrapLoadAttempts = 0;
var BOOTSTRAP_FLIGHT_KEY = "analyzer-bootstrap";
var bootstrapFlight = createSingleFlight();
var BOOTSTRAP_FAILURE_STRIKE_LIMIT = 3;
function degradedClient() {
  return new Proxy({}, {
    get(_target, prop) {
      if (typeof prop === "symbol" || prop === "then")
        return void 0;
      return () => void 0;
    }
  });
}
async function logBootstrapFailures(failures) {
  for (const { name, err } of failures) {
    logExtension({
      subsystem: "bootstrap",
      message: `analyzer "${name}" disabled (degraded mode): ${err?.message ?? String(err)}`,
      metadata: { analyzer: name }
    });
  }
  try {
    const { collectInstallDiagnostics, formatInstallDiagnostics } = await import("../chunk-NABLC7W3.js");
    logExtension({
      subsystem: "bootstrap",
      message: formatInstallDiagnostics(collectInstallDiagnostics(), failures[0]?.err),
      metadata: { kind: "install_diagnostics" }
    });
  } catch {
  }
}
async function buildBootstrapClients() {
  const failures = [];
  async function load(name, make) {
    try {
      return await make();
    } catch (err) {
      failures.push({ name, err });
      return degradedClient();
    }
  }
  async function loadList(name, make) {
    try {
      return await make();
    } catch (err) {
      failures.push({ name, err });
      return [];
    }
  }
  const [ruffClient, biomeClient, knipClient, todoScanner, jscpdClient, depChecker, testRunnerClient, metricsClient, complexityClient, goClient, govulncheckClient, gitleaksClient, trivyClient, opengrepClient, rustClient, agentBehaviorClient2, deadCodeClients] = await Promise.all([
    load("ruff", async () => new (await import("../chunk-T6CPIZNT.js")).RuffClient()),
    load("biome", async () => new (await import("../chunk-ZWFS3OEF.js")).BiomeClient()),
    load("knip", async () => new (await import("../chunk-YIUAVF7E.js")).KnipClient()),
    load("todo", async () => new (await import("../chunk-JSQFTSC6.js")).TodoScanner()),
    load("jscpd", async () => new (await import("../chunk-CMMHNUZ2.js")).JscpdClient()),
    load("dependency-checker", async () => new (await import("../chunk-EC47DWFA.js")).DependencyChecker()),
    load("test-runner", async () => new (await import("../chunk-XAGLWMJ4.js")).TestRunnerClient()),
    load("metrics", async () => new (await import("../chunk-N3X6Q4YT.js")).MetricsClient()),
    load("complexity", async () => new (await import("../chunk-VSSBEUFT.js")).ComplexityClient()),
    // The process-wide singleton, NOT a fresh instance (#2455 fix round 4,
    // F2). `handleSessionStart` reads this object for its "Active tools"
    // line while `resetGoAvailability` re-arms the singleton's latch; a
    // second instance here meant the reset never reached the surface a
    // user actually sees.
    load("go", async () => (await import("../chunk-Z527N6YQ.js")).goClient),
    load("govulncheck", async () => new (await import("../chunk-KDERNTCQ.js")).GovulncheckClient()),
    load("gitleaks", async () => new (await import("../chunk-XIJZVPD5.js")).GitleaksClient()),
    load("trivy", async () => new (await import("../chunk-FMSO6RDZ.js")).TrivyClient()),
    load("opengrep", async () => new (await import("../chunk-MXGY6KPT.js")).OpengrepClient()),
    // The process-wide singleton, for the same reason as "go" above.
    load("rust", async () => (await import("../chunk-BRGDSBJE.js")).rustClient),
    load("agent-behavior", async () => (await import("../chunk-23WOO7TX.js")).agentBehaviorClient),
    loadList("dead-code", async () => (await import("../chunk-6STA6Z7I.js")).getDeadCodeClients())
  ]);
  if (failures.length > 0)
    await logBootstrapFailures(failures);
  return {
    ruffClient,
    biomeClient,
    knipClient,
    todoScanner,
    jscpdClient,
    depChecker,
    testRunnerClient,
    metricsClient,
    complexityClient,
    goClient,
    govulncheckClient,
    gitleaksClient,
    trivyClient,
    opengrepClient,
    rustClient,
    agentBehaviorClient: agentBehaviorClient2,
    deadCodeClients
  };
}
var BootstrapUnavailableError = class extends Error {
  unavailableReason;
  constructor(unavailableReason, message) {
    super(message);
    this.name = "BootstrapUnavailableError";
    this.unavailableReason = unavailableReason;
  }
};
function residentBootstrapAccess(clients) {
  return {
    peek: () => clients,
    request: async () => clients
  };
}
function loadBootstrapClients() {
  if (residentClients)
    return Promise.resolve(residentClients);
  if (bootstrapShutdown && !bootstrapFlight.has(BOOTSTRAP_FLIGHT_KEY)) {
    return Promise.reject(new BootstrapUnavailableError("shutdown", "analyzer bootstrap declined: primary session is shutting down"));
  }
  if (bootstrapFailureStrikes >= BOOTSTRAP_FAILURE_STRIKE_LIMIT) {
    return Promise.reject(new BootstrapUnavailableError("latched", `analyzer bootstrap declined: ${bootstrapFailureStrikes} consecutive load failures`));
  }
  return bootstrapFlight.run(BOOTSTRAP_FLIGHT_KEY, async () => {
    const attempt = bootstrapLoadAttempts += 1;
    const startedAt = Date.now();
    let clients;
    try {
      clients = await buildBootstrapClients();
    } catch (err) {
      noteBootstrapBuildFailure(err);
      throw err;
    }
    bootstrapFailureStrikes = 0;
    residentClients = clients;
    logLatency({
      type: "phase",
      phase: "bootstrap_clients_load",
      filePath: process.cwd(),
      startedAt: new Date(startedAt).toISOString(),
      durationMs: Date.now() - startedAt,
      metadata: { attempt }
    });
    return clients;
  });
}
function noteBootstrapBuildFailure(err) {
  bootstrapFailureStrikes += 1;
  if (bootstrapFailureStrikes !== BOOTSTRAP_FAILURE_STRIKE_LIMIT)
    return;
  recordDegradationOnce({
    kind: "analyzer-bootstrap-latched",
    subject: BOOTSTRAP_FLIGHT_KEY,
    reason: `${BOOTSTRAP_FAILURE_STRIKE_LIMIT} consecutive load failures; no further builds this session: ${err?.message ?? String(err)}`
  });
}
function resetAnalyzerBootstrapSessionState() {
  bootstrapShutdown = false;
  bootstrapShutdownController = new AbortController();
  bootstrapFailureStrikes = 0;
}

// dist/clients/formatters-lazy.js
var lazyFormatters = createLazyImport(() => import("../chunk-RXCOMYPY.js"));
function warmFormatters() {
  return lazyFormatters.get();
}
function loadFormatters() {
  return warmFormatters();
}

// dist/clients/format-service.js
var globalFormatService = null;
var currentSessionID = null;
function resetFormatService() {
  void loadFormatters().then(({ clearFormatterRuntimeState }) => clearFormatterRuntimeState());
  globalFormatService = null;
  currentSessionID = null;
}

// dist/clients/runtime-coordinator.js
import { randomBytes } from "node:crypto";
import * as fs9 from "node:fs";
import * as path8 from "node:path";

// dist/clients/project-changes.js
import * as fs7 from "node:fs";
import * as path7 from "node:path";
function getProjectChangeLogPath(cwd) {
  return path7.join(getProjectDataDir(cwd), "change-log.jsonl");
}
function parseChangeLine(line) {
  try {
    const parsed = JSON.parse(line);
    if (typeof parsed.seq !== "number" || typeof parsed.fileSeq !== "number" || typeof parsed.filePath !== "string" || typeof parsed.source !== "string") {
      return void 0;
    }
    return {
      seq: parsed.seq,
      timestamp: parsed.timestamp ?? (/* @__PURE__ */ new Date(0)).toISOString(),
      sessionId: parsed.sessionId ?? "unknown",
      turnIndex: parsed.turnIndex ?? 0,
      source: parsed.source,
      filePath: parsed.filePath,
      fileSeq: parsed.fileSeq,
      changedRange: parsed.changedRange,
      ...parsed.unlocked === true ? { unlocked: true } : {}
    };
  } catch {
    return void 0;
  }
}
var changeLogCursors = new BoundedFifoMap(16);
function parseChangeLog(logPath, content) {
  const entries = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map(parseChangeLine).filter((entry) => Boolean(entry));
  const bytes = Buffer.byteLength(content.slice(0, content.lastIndexOf("\n") + 1));
  let maxSeq = 0;
  for (const entry of entries)
    maxSeq = Math.max(maxSeq, entry.seq);
  changeLogCursors.set(logPath, { bytes, maxSeq });
  return entries;
}
function readProjectChanges(cwd) {
  const logPath = getProjectChangeLogPath(cwd);
  try {
    return parseChangeLog(logPath, fs7.readFileSync(logPath, "utf-8"));
  } catch {
    return [];
  }
}
async function readProjectChangesAsync(cwd) {
  const logPath = getProjectChangeLogPath(cwd);
  try {
    return parseChangeLog(logPath, await fs7.promises.readFile(logPath, "utf-8"));
  } catch {
    return [];
  }
}
var _sequenceFoldCountForTests = 0;
function foldEntry(entry, fileSeqByPath) {
  _sequenceFoldCountForTests++;
  const key = normalizeMapKey(path7.resolve(entry.filePath));
  fileSeqByPath.set(key, Math.max(fileSeqByPath.get(key) ?? 0, entry.fileSeq));
}
function fullReplay(entries) {
  let projectSeq = 0;
  const fileSeqByPath = /* @__PURE__ */ new Map();
  for (const entry of entries) {
    projectSeq = Math.max(projectSeq, entry.seq);
    foldEntry(entry, fileSeqByPath);
  }
  return { projectSeq, fileSeqByPath };
}
function partialReplay(entries, base) {
  let logMaxSeq = 0;
  for (const entry of entries) {
    if (entry.seq > logMaxSeq)
      logMaxSeq = entry.seq;
  }
  if (base.sinceSeq > logMaxSeq)
    return null;
  const fileSeqByPath = new Map(base.fileSeqByPath);
  let projectSeq = Math.max(0, base.projectSeq);
  for (const entry of entries) {
    if (entry.seq <= base.sinceSeq)
      continue;
    projectSeq = Math.max(projectSeq, entry.seq);
    foldEntry(entry, fileSeqByPath);
  }
  return { projectSeq, fileSeqByPath };
}
function readLatestProjectSequence(cwd, base) {
  return replay(readProjectChanges(cwd), base);
}
function replay(entries, base) {
  let unlockedThrough = 0;
  entries.forEach((entry, index2) => {
    if (entry.unlocked)
      unlockedThrough = index2 + 1;
  });
  const index = base && unlockedThrough <= (base.logEntries ?? 0) && partialReplay(entries, base) || fullReplay(entries);
  return { ...index, logEntries: entries.length, unlockedThrough };
}
async function readLatestProjectSequenceAsync(cwd, base) {
  return replay(await readProjectChangesAsync(cwd), base);
}
function readChangeLogMaxSeq(logPath) {
  let fd;
  try {
    fd = fs7.openSync(logPath, "r");
  } catch (err) {
    if (err.code === "ENOENT")
      return 0;
    throw err;
  }
  try {
    const cursor = changeLogCursors.get(logPath) ?? { bytes: 0, maxSeq: 0 };
    const size = fs7.fstatSync(fd).size;
    if (size > cursor.bytes) {
      const tail = Buffer.alloc(size - cursor.bytes);
      const read = fs7.readSync(fd, tail, 0, tail.length, cursor.bytes);
      const complete = tail.subarray(0, read).lastIndexOf(10) + 1;
      for (const line of tail.subarray(0, complete).toString("utf-8").split("\n")) {
        const entry = line.trim() ? parseChangeLine(line) : void 0;
        if (entry && entry.seq > cursor.maxSeq)
          cursor.maxSeq = entry.seq;
      }
      cursor.bytes += complete;
    }
    changeLogCursors.set(logPath, cursor);
    return cursor.maxSeq;
  } finally {
    fs7.closeSync(fd);
  }
}
var CHANGE_LOG_LOCK = { staleMs: 5e3, waitMs: 500 };
function appendProjectChangeAllocated(cwd, build) {
  const logPath = getProjectChangeLogPath(cwd);
  fs7.mkdirSync(path7.dirname(logPath), { recursive: true });
  readChangeLogMaxSeq(logPath);
  const append = (locked) => {
    const entry = build(readChangeLogMaxSeq(logPath));
    const line = locked ? entry : { ...entry, unlocked: true };
    fs7.appendFileSync(logPath, `${JSON.stringify(line)}
`, "utf-8");
  };
  const result = withGenerationLockSync(`${logPath}.locks`, CHANGE_LOG_LOCK, () => append(true));
  if (result.held)
    return;
  const code = result.cause?.code;
  incrementDegradationCount({
    kind: "change-log-lock-unavailable",
    subject: logPath,
    reason: `appended unlocked: ${code ? `lock failed (${code})` : "lock wait ran out"}`
  });
  append(false);
}

// dist/clients/inline-blocker-fields.js
function inlineBlockerSources(blockers) {
  return [...new Set(blockers.map((d) => d.tool?.trim() || "unknown"))];
}
function inlineBlockerLines(blockers, filePath) {
  const own = normalizeEphemeralMapKey(filePath);
  return blockers.filter((d) => normalizeEphemeralMapKey(d.filePath) === own).map((d) => d.line).filter((line) => typeof line === "number");
}

// dist/clients/partial-edit-apply.js
import { createHash } from "node:crypto";
import * as fs8 from "node:fs";
var MAX_APPLIED_RECORDS_PER_FILE = 8;
var MAX_APPLIED_RECORD_FILES = 64;
function editPairDigest(oldText, newText) {
  return createHash("sha256").update(JSON.stringify([oldText, newText ?? ""]), "utf8").digest("hex");
}
var PartialApplyRecordStore = class {
  // Bounded on the PathKeyedMap itself (#2442): the file axis used to
  // hand-roll `keys().next().value` here, which also evicted an unrelated
  // file when a path ALREADY in the map was re-recorded at capacity.
  files = new PathKeyedMap(normalizeMapKey, MAX_APPLIED_RECORD_FILES);
  find(filePath, oldText, newText) {
    if (!oldText)
      return void 0;
    const pairDigest = editPairDigest(oldText, newText);
    const records = this.files.get(filePath) ?? [];
    return records.find((r) => r.pairDigest === pairDigest);
  }
  record(filePath, oldText, newText, contentHash) {
    if (!oldText)
      return;
    const pairDigest = editPairDigest(oldText, newText);
    const records = this.files.get(filePath) ?? [];
    const existing = records.findIndex((r) => r.pairDigest === pairDigest);
    if (existing >= 0)
      records.splice(existing, 1);
    const entry = {
      pairDigest,
      contentHash: contentHash ?? hashFile(filePath),
      appliedAtMs: Date.now()
    };
    if (records.length >= MAX_APPLIED_RECORDS_PER_FILE)
      records.shift();
    records.push(entry);
    this.files.set(filePath, records);
  }
  /**
   * Stamps the post-afterWrite file hash onto an existing record so a later
   * identical retry against the formatter-rewritten file is still recognized as
   * already-applied (#2402). No-op when the pair was never recorded.
   */
  noteAfterWriteHash(filePath, oldText, newText, afterWriteContentHash) {
    if (!oldText)
      return;
    const pairDigest = editPairDigest(oldText, newText);
    const record = this.files.get(filePath)?.find((r) => r.pairDigest === pairDigest);
    if (record)
      record.afterWriteContentHash = afterWriteContentHash;
  }
  clear() {
    this.files.clear();
  }
  get fileCount() {
    return this.files.size;
  }
};
var fileLock = createFileTime("partial-edit-apply");
function hashFile(filePath) {
  try {
    return createHash("sha256").update(fs8.readFileSync(filePath)).digest("hex");
  } catch {
    return void 0;
  }
}

// dist/clients/turn-summary.js
var TurnSummaryCollector = class {
  filesByKey = /* @__PURE__ */ new Map();
  getOrCreate(filePath) {
    const key = normalizeMapKey(filePath);
    let entry = this.filesByKey.get(key);
    if (!entry) {
      entry = { filePath, displayPath: filePath, events: [] };
      this.filesByKey.set(key, entry);
    }
    return entry;
  }
  record(filePath, event) {
    this.getOrCreate(filePath).events.push(event);
  }
  recordDiagnostic(filePath, args) {
    this.record(filePath, { kind: "diagnostic", ...args });
  }
  recordAutofix(filePath, args) {
    this.record(filePath, { kind: "autofix", ...args });
  }
  recordFormat(filePath, args) {
    this.record(filePath, { kind: "format", ...args });
  }
  isEmpty() {
    return this.filesByKey.size === 0;
  }
  /** Snapshot without clearing — used for tests/observability. */
  peek() {
    return [...this.filesByKey.values()];
  }
  clear() {
    this.filesByKey.clear();
  }
  /** Consume (snapshot + clear) the run's collection, building the details payload. */
  consume(turnIndex, toDisplayPath3) {
    const files = [...this.filesByKey.values()].map((entry) => ({
      ...entry,
      displayPath: toDisplayPath3 ? toDisplayPath3(entry.filePath) : entry.filePath
    }));
    this.filesByKey.clear();
    const counts = {
      diagnostics: 0,
      autofixes: 0,
      formats: 0,
      byTool: { diagnostic: {}, autofix: {}, format: {} }
    };
    for (const file of files) {
      for (const event of file.events) {
        if (event.kind === "diagnostic")
          counts.diagnostics++;
        else if (event.kind === "autofix")
          counts.autofixes++;
        else
          counts.formats++;
        const bucket = counts.byTool[event.kind];
        bucket[event.tool] = (bucket[event.tool] ?? 0) + 1;
      }
    }
    return { version: 1, turnIndex, files, counts };
  }
};

// dist/clients/model-provider.js
var KNOWN_PREFIXES = [
  ["claude-", "anthropic"],
  ["gpt-", "openai"],
  ["o1-", "openai"],
  ["o3-", "openai"],
  ["gemini-", "google"],
  ["llama-", "meta"],
  ["mistral-", "mistral"],
  ["mixtral-", "mistral"],
  ["command-", "cohere"]
];
function deriveProviderFromModelId(modelId) {
  const id = modelId?.trim().toLowerCase();
  if (!id)
    return "";
  const separators = [...id].filter((c) => c === "/" || c === ":").length;
  if (separators === 1) {
    const sep2 = id.includes("/") ? "/" : ":";
    const [providerPart, ...rest] = id.split(sep2);
    if (providerPart && rest.join(sep2).length > 0)
      return providerPart;
    return "";
  }
  if (separators > 1)
    return "";
  for (const [prefix, provider] of KNOWN_PREFIXES) {
    if (id.startsWith(prefix))
      return provider;
  }
  return "";
}

// dist/clients/runtime-coordinator.js
var MAX_PENDING_CASCADE_RUNS = 32;
function nextTelemetrySessionId() {
  const state = getProcessSingleton("runtime-coordinator-telemetry", 1, () => ({
    processId: randomBytes(6).toString("hex"),
    nextGeneration: 0
  }));
  return `lens-${state.processId}-${++state.nextGeneration}`;
}
var MAX_CUT_ADVISORY_LANES = 16;
var MAX_MUTATION_RECEIPTS = 512;
function recordViewIncomplete(cwd, cause) {
  const why = `the change log reached seq ${cause.logMaxSeq} while this runtime was at ${cause.ownSeq} (${cause.ownSeq === 0 ? "a sibling process, or a timed-out session_start read that seeded 0; see snapshot-sequence-read-timeout" : "a sibling process logged above it"})`;
  recordDegradationOnce({
    kind: "snapshot-view-incomplete",
    subject: path8.resolve(cwd),
    reason: `snapshots are stamped incomplete (never fresh) until the next seed from the change log: ${why}`
  });
}
var MAX_RESOLVED_BLOCKER_FILES = 10;
var TOOL_CALL_ATTRIBUTION_CAPACITY = 256;
var TOOL_CALL_ATTRIBUTION_TTL_MS = 5 * 6e4;
var TurnWarningsBySession = class {
  bySession = /* @__PURE__ */ new Map();
  add(sessionId, items) {
    let partition = this.bySession.get(sessionId);
    if (!partition) {
      partition = /* @__PURE__ */ new Map();
      this.bySession.set(sessionId, partition);
    }
    for (const item of items)
      partition.set(item.id, item);
  }
  peek(sessionId) {
    return [...this.bySession.get(sessionId)?.values() ?? []];
  }
  clear(sessionId) {
    this.bySession.delete(sessionId);
  }
};
var RuntimeCoordinator = class {
  _projectRoot = normalizeMapKey(process.cwd());
  // #3611: the session generation is this scope's ticket, drawn from one
  // process counter, so two coordinators (two entry evaluations) never hold
  // the same number (N4). The construction scope's ticket is the
  // coordinator's id on the `session_scope_transition` row.
  _scope = beginScope({ role: "primary" });
  _coordinatorId = this._scope.scopeId;
  _sessionStartedAt = Date.now();
  _errorDebtBaseline = null;
  _pipelineCrashCounts = /* @__PURE__ */ new Map();
  _cachedExports = /* @__PURE__ */ new Map();
  _startupScansInFlight = /* @__PURE__ */ new Map();
  _cascadeRuns = [];
  // #3813/#3901: items an item-bearing turn-end advisory showed and the cap
  // cut (knip, dead-code, call-graph impact), keyed by lane. Parked once,
  // taken once; see `parkCutAdvisoryItems`.
  _cutAdvisoryItems = new BoundedFifoMap(MAX_CUT_ADVISORY_LANES);
  _turnEndCascadeSettleStarts = /* @__PURE__ */ new Map();
  _nextCascadeSettleToken = 0;
  // Cascade computes are kicked off unawaited by the pipeline (#450); their
  // promises park here until turn_end drains them via settleCascadeRuns. Each is
  // guaranteed non-rejecting by the pipeline's .catch.
  _pendingCascadeRuns = [];
  _cascadeSessionStats = {
    runs: 0,
    diagnosticsSurfaced: 0,
    coldSnapshotTouches: 0
  };
  _complexityBaselines = /* @__PURE__ */ new Map();
  _fixedThisTurn = new PathKeyedMap(normalizeMapKey);
  _writtenThisTurn = new PathKeyedMap(normalizeMapKey);
  _autofixDemotedThisTurn = new PathKeyedMap(normalizeMapKey);
  _reportedThisTurn = /* @__PURE__ */ new Set();
  _mutationReceipts = [];
  _droppedMutationReceipts = 0;
  _projectRulesScan = {
    rules: [],
    hasCustomRules: false
  };
  /** Process-unique and monotonic across coordinator reloads (#4213). */
  _telemetrySessionId = nextTelemetrySessionId();
  _lifecycleReason;
  _hasStableSessionId = false;
  _telemetryModel = "unknown";
  // Raw model/provider identity, separate from the combined `provider/model`
  // display string above — worklog/disposition attribution (#1448) wants the
  // two fields apart, blank when the host never supplied them. `_telemetryProvider`
  // is the explicit host value when given, else derived from the model id
  // (deriveProviderFromModelId, blank on ambiguity — never guessed).
  _telemetryModelId = "";
  _telemetryProvider = "";
  // True once a host has supplied an explicit provider this session. An
  // explicit provider is never downgraded by a derivation from a later
  // model-only call; a DERIVED provider, by contrast, is re-derived on
  // every model-only call so a mid-session model switch (e.g. gpt-5-mini →
  // claude-sonnet-4-5) doesn't leave a stale provider from the old model.
  _telemetryProviderIsExplicit = false;
  _turnIndex = 0;
  /**
   * #3540 r2: the turn half of a write order token (`writeOrderToken`).
   * `beginTurn` advances it and `resetForSession` never restarts it: the
   * widget's write guards outlive a session reset (`/reload` keeps them),
   * so a later turn's token must outrank every earlier one in the process.
   * `_turnIndex` restarts per session for telemetry.
   * #3611 (N3): drawn from the process counter (`nextOrderTurn`), because a
   * `/reload` that re-evaluates the entry builds a new coordinator while the
   * widget module keeps its guards.
   */
  _writeOrderTurn = 0;
  _writeIndex = 0;
  /**
   * #3613 F2: the per-turn cap key of each concurrent session's current turn
   * (`turnKey`), and how many such turns have started. Entries go at the
   * session's shutdown (`forgetTurnSession`).
   */
  _foreignTurnKeys = /* @__PURE__ */ new Map();
  _foreignTurns = 0;
  /**
   * #3613 G1: every turn start on this coordinator, of any session, since the
   * session reset: what `_turnIndex` counted before #3613, kept for the
   * process-level turn cadences (`turnStartCount`).
   */
  _turnStarts = 0;
  _projectSeq = 0;
  // #3511: the highest logged seq this runtime's view is known to have missed
  // (a sibling process logged it above our seq); 0 when none. Cleared by a
  // seed from the log, or by a late read that covers it.
  _viewMissingThrough = 0;
  // #3511 review round 2: the change-log entries folded by this session's
  // seed or late merge. An `unlocked` entry after it may share a seq we
  // hold, so a snapshot stamped with it is judged against the log's tags.
  _viewLogEntries = 0;
  _turnStartProjectSeq = 0;
  _fileSeq = /* @__PURE__ */ new Map();
  // File key → the projectSeq value at that file's most recent bump (#451). Lets
  // the review-graph builder ask "which files changed since I last built?" and
  // skip its per-build O(project) walk+stat sweep when only pi-observed edits
  // occurred. Keyed identically to _fileSeq (normalizeMapKey + path.resolve).
  _fileLastProjectSeq = /* @__PURE__ */ new Map();
  _gitGuardHasBlockers = false;
  _gitGuardSummary = "";
  _gitGuardCacheUnknownReason;
  callGraph = null;
  wordIndex = null;
  _readGuard = null;
  _pendingDeferredMutations = new PathKeyedMap(normalizeMapKey);
  /** tool_call → tool_result path-attribution correlation (#1642). */
  _toolCallAttributions = new BoundedLruCache(TOOL_CALL_ATTRIBUTION_CAPACITY);
  /**
   * #3555: a widening rides its own correlation, with the same bound. Since
   * #4138 a read also carries a {@link ToolCallAttribution} (its origin cwd
   * is what a relative read path resolves against at tool_result); the
   * widening stays separate because it outlives a blocked call's attribution.
   */
  _readWidenings = new BoundedLruCache(TOOL_CALL_ATTRIBUTION_CAPACITY);
  _lspReadWarmState = /* @__PURE__ */ new Map();
  _pendingInlineBlockers = new PathKeyedMap(normalizeMapKey);
  /**
   * #3507: one per-path order for BOTH verbs on `_pendingInlineBlockers`,
   * the widget store's guard shape (`widget-state.ts` diagnosticsWriteGuard).
   * Pipelines of two same-file edits overlap under pi's parallel tools, so
   * an older run that settles last must neither erase nor replace the newer
   * run's verdict (#1198 invariants 1-2). The last applied token lives here,
   * not on the record, so it survives a clear.
   */
  _inlineBlockerWriteOrder = new WriteOrderingGuard();
  /**
   * #3218 criterion 2: inline blockers a fresh clean verdict retired this
   * turn, keyed by resolved path so a file is named once. Bounded at
   * `MAX_RESOLVED_BLOCKER_FILES`; the overflow is counted so the delivery can
   * still say "… and N more" (counting retire events past the cap). The
   * turn-end composer consumes it, so a retire is delivered exactly once; an
   * entry no turn_end delivered stays until one does, and session reset clears
   * it.
   */
  _resolvedBlockerFilesThisTurn = new PathKeyedMap(normalizeMapKey);
  _resolvedBlockerFilesDropped = 0;
  _actionableWarningsThisTurn = new TurnWarningsBySession();
  _codeQualityWarningsThisTurn = new TurnWarningsBySession();
  // #484: opt-in per-RUN summary of diagnostics/autofixes/formats,
  // accumulated across the run's turns and consumed once at the
  // agent_settled quiet window. The collector itself is always constructed
  // (cheap, empty Map) but callers gate recording behind the
  // `lens-turn-summary` flag so it's a true no-op when the feature is off.
  _turnSummary = new TurnSummaryCollector();
  // #2402/#1053: session-scoped applied-edit records for exact-retry
  // recognition. Both producers (partial-apply commit, full native-edit
  // success) write here; the preflight consults it before declaring an
  // oldText miss, so an identical retry never re-executes a committed write.
  partialApplyRecords = new PartialApplyRecordStore();
  resetForSession(startedAt = Date.now()) {
    const previous = this._scope;
    retireScope(previous, "superseded");
    this._scope = beginScope({
      role: "primary",
      parentScopeId: previous.scopeId,
      coordinatorId: this._coordinatorId
    });
    this._sessionStartedAt = startedAt;
    this._complexityBaselines.clear();
    this._pipelineCrashCounts.clear();
    this._cachedExports.clear();
    this.wordIndex = null;
    this._startupScansInFlight.clear();
    this._cascadeRuns = [];
    this._cutAdvisoryItems.clear();
    this._pendingCascadeRuns = [];
    this._turnEndCascadeSettleStarts.clear();
    this._cascadeSessionStats = {
      runs: 0,
      diagnosticsSurfaced: 0,
      coldSnapshotTouches: 0
    };
    this._fixedThisTurn.clear();
    this._writtenThisTurn.clear();
    this._autofixDemotedThisTurn.clear();
    this._reportedThisTurn.clear();
    this._mutationReceipts = [];
    this._droppedMutationReceipts = 0;
    this._actionableWarningsThisTurn.clear(this._telemetrySessionId);
    this._codeQualityWarningsThisTurn.clear(this._telemetrySessionId);
    this._telemetrySessionId = nextTelemetrySessionId();
    this._hasStableSessionId = false;
    this._telemetryModel = "unknown";
    this._telemetryModelId = "";
    this._telemetryProvider = "";
    this._telemetryProviderIsExplicit = false;
    this._turnIndex = 0;
    this._turnStarts = 0;
    this._writeIndex = 0;
    this._projectSeq = 0;
    this._viewMissingThrough = 0;
    this._viewLogEntries = 0;
    this._turnStartProjectSeq = 0;
    this._fileSeq.clear();
    this._fileLastProjectSeq.clear();
    this._gitGuardHasBlockers = false;
    this._gitGuardSummary = "";
    this._gitGuardCacheUnknownReason = void 0;
    this._readGuard = null;
    this._pendingDeferredMutations.clear();
    this._toolCallAttributions.clear();
    this._readWidenings.clear();
    this._lspReadWarmState.clear();
    this._pendingInlineBlockers.clear();
    this._inlineBlockerWriteOrder.clear();
    this._resolvedBlockerFilesThisTurn.clear();
    this._resolvedBlockerFilesDropped = 0;
    this._turnSummary.clear();
    this.partialApplyRecords.clear();
  }
  get sessionStartedAt() {
    return this._sessionStartedAt;
  }
  get cascadeSessionStats() {
    return this._cascadeSessionStats;
  }
  recordCascadeRun(diagnosticsSurfaced, coldSnapshotTouches) {
    this._cascadeSessionStats.runs += 1;
    this._cascadeSessionStats.diagnosticsSurfaced += diagnosticsSurfaced;
    this._cascadeSessionStats.coldSnapshotTouches += coldSnapshotTouches;
  }
  /**
   * Record the turn-end policy verdict on every live inline-blocker record
   * (#3248): `true` for a file whose every blocker the policy suppressed,
   * `false` for every other record in the map.
   *
   * ONE writer, rewriting the WHOLE axis each turn end, so the verdict can
   * never outlive the pass that made it: a record demoted since, or one whose
   * survivors came back because the file's bytes moved under a content-bound
   * anchor, is cleared by the same call that sets its sibling. A fresh
   * dispatch replaces the record wholesale (`recordInlineBlockers`), so a NEW
   * blocker is never born pre-suppressed (#1198 ordering).
   *
   * @returns how many records this call CHANGED — 0 means the gate's view of
   * the map is already what the policy just decided.
   */
  applyInlineBlockerPolicyVerdicts(suppressedFilePaths) {
    const suppressed = new Set(suppressedFilePaths.map((filePath) => path8.resolve(filePath)));
    let changed = 0;
    for (const [key, entry] of this._pendingInlineBlockers.entries()) {
      const policySuppressed = suppressed.has(path8.resolve(entry.filePath));
      if ((entry.policySuppressed ?? false) === policySuppressed)
        continue;
      this._pendingInlineBlockers.set(key, { ...entry, policySuppressed });
      changed += 1;
    }
    return changed;
  }
  updateGitGuardStatus(hasBlockers, output) {
    const blocking = this.getInlineBlockersSnapshot().filter((entry) => !entry.policySuppressed);
    this._gitGuardHasBlockers = hasBlockers || blocking.length > 0;
    if (!this._gitGuardHasBlockers) {
      this._gitGuardSummary = "";
      return;
    }
    const firstLine2 = output.split("\n").map((line) => line.trim()).find((line) => line.length > 0);
    const summaries = blocking.map((entry) => entry.summary.trim()).filter(Boolean);
    this._gitGuardSummary = (summaries[0] ?? firstLine2 ?? "Unresolved blockers detected").slice(0, 160);
  }
  get gitGuardHasBlockers() {
    return this._gitGuardHasBlockers;
  }
  get gitGuardSummary() {
    return this._gitGuardSummary;
  }
  markGitGuardCacheUnknown(reason) {
    this._gitGuardCacheUnknownReason = reason;
  }
  clearGitGuardCacheUnknown() {
    this._gitGuardCacheUnknownReason = void 0;
  }
  get gitGuardCacheUnknownReason() {
    return this._gitGuardCacheUnknownReason;
  }
  /**
   * Start a turn. `sessionId` is the turn's own session (its ctx's stable id);
   * omitted, or equal to this coordinator's session, the turn is the
   * coordinator's own. #3613 (S4, N2): a concurrent secondary's turn on this
   * coordinator advances only its own turn identity and its own per-turn
   * records. The turn counter, the write-order turn, the turn's change
   * window and the carried cascade runs are the primary's.
   */
  beginTurn(sessionId) {
    this._turnStarts += 1;
    const turnSession = this.turnSession(sessionId);
    if (turnSession !== this._telemetrySessionId) {
      beginTurnContext(turnSession);
      this._foreignTurns += 1;
      this._foreignTurnKeys.set(turnSession, this._turnIndex + this._foreignTurns / (this._foreignTurns + 1));
      this._actionableWarningsThisTurn.clear(turnSession);
      this._codeQualityWarningsThisTurn.clear(turnSession);
      return;
    }
    this._cascadeRuns = this._cascadeRuns.flatMap((run) => {
      const carriedTurns = (run.carriedTurns ?? 0) + 1;
      if (carriedTurns > 1) {
        logCascade({
          phase: "cascade_carry_over_drop",
          filePath: run.filePath,
          neighborCount: run.neighborCount,
          diagnosticCount: run.diagnosticCount,
          metadata: { carriedTurns, turnIndex: this._turnIndex }
        });
        return [];
      }
      return [{ ...run, carriedTurns }];
    });
    this._actionableWarningsThisTurn.clear(turnSession);
    this._codeQualityWarningsThisTurn.clear(turnSession);
    this._turnStartProjectSeq = this._projectSeq;
    this._turnIndex += 1;
    this._writeOrderTurn = nextOrderTurn();
    beginTurnContext(this._telemetrySessionId);
    this._writeIndex = 0;
    this._reportedThisTurn.clear();
    this._writtenThisTurn.clear();
    this._autofixDemotedThisTurn.clear();
  }
  /**
   * THE one mutation seam. Every producer of an in-project file mutation —
   * native write/edit, recognized bash writes, format/autofix, LSP workspace
   * edits, and (phase 2) opaque script-write recovery — records through here,
   * once: it bumps the seq store (`bumpFileSeq`), appends a bounded attributed
   * receipt, and optionally appends the durable change-log entry. Consumers
   * derive from `getFilesChangedSince` / `getMutationsSince`; no producer or
   * consumer may hand-roll a parallel bump+log pairing (#2000 phase 1).
   *
   * Receipt recording never throws; change-log append failures route to
   * `onAppendError` (default: swallowed) so telemetry cannot break dispatch.
   */
  recordProjectMutation(args) {
    let logged;
    if (args.cwd !== void 0) {
      try {
        const cwd = args.cwd;
        appendProjectChangeAllocated(cwd, (logMaxSeq) => {
          const ownSeq = this._projectSeq;
          logged = this.bumpFileSeq(args.filePath, logMaxSeq);
          if (this._viewMissingThrough > 0) {
            recordViewIncomplete(cwd, { ownSeq, logMaxSeq });
          }
          return {
            seq: logged.projectSeq,
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            sessionId: this.telemetrySessionId,
            turnIndex: this.turnIndex,
            source: args.source,
            filePath: path8.resolve(args.filePath),
            fileSeq: logged.fileSeq,
            changedRange: args.changedRange
          };
        });
      } catch (err) {
        args.onAppendError?.(err);
      }
    }
    const { projectSeq, fileSeq, key } = logged ?? this.bumpFileSeq(args.filePath);
    if (this._mutationReceipts.length >= MAX_MUTATION_RECEIPTS) {
      this._mutationReceipts.shift();
      this._droppedMutationReceipts += 1;
    }
    this._mutationReceipts.push({
      seq: projectSeq,
      // Reuse the bump's normalized key (a realpath syscall: ~200us on
      // Windows, ~1.8us on POSIX since #3098) — never re-derive it here.
      filePath: key,
      source: args.source,
      turnIndex: this._turnIndex,
      ts: Date.now()
    });
    return { projectSeq, fileSeq };
  }
  /**
   * Attributed mutations whose seq is strictly after `seq` — the receipt-level
   * counterpart of {@link getFilesChangedSince}. Bounded: entries evicted by
   * the ring cap are gone; compare `droppedMutationReceiptCount` against zero
   * before treating the result as a complete window.
   */
  getMutationsSince(seq) {
    return this._mutationReceipts.filter((r) => r.seq > seq).map((r) => ({ ...r }));
  }
  get droppedMutationReceiptCount() {
    return this._droppedMutationReceipts;
  }
  /**
   * Atomically records write/edit ordering before debounce can coalesce it.
   *
   * Takes the classified {@link MutationKind}, not a raw tool name (#2423):
   * an edit-shaped tool pi-lens does not name still demotes this file to the
   * deferred pass, which is the safe timing.
   */
  recordMutationToolReceipt(filePath, kind) {
    if (kind === "write") {
      this._writtenThisTurn.set(filePath, true);
    } else if (this._writtenThisTurn.has(filePath)) {
      this._autofixDemotedThisTurn.set(filePath, true);
      this._fixedThisTurn.delete(filePath);
    }
    return {
      autofixMode: kind === "edit" || this._autofixDemotedThisTurn.has(filePath) ? "deferred" : "immediate"
    };
  }
  get reportedThisTurn() {
    return this._reportedThisTurn;
  }
  nextWriteIndex() {
    this._writeIndex += 1;
    return this._writeIndex;
  }
  peekWriteIndex() {
    return this._writeIndex;
  }
  /**
   * #3540: draw the next write index as an order token that spans turns
   * (`writeOrderToken`), for a writer whose token is compared against
   * another turn's: the widget store and the inline-blocker retire.
   */
  nextWriteOrderToken() {
    return writeOrderToken(this._writeOrderTurn, this.nextWriteIndex());
  }
  setTelemetryIdentity(identity) {
    if (identity.sessionId && identity.sessionId.trim()) {
      this._telemetrySessionId = identity.sessionId.trim();
      setTurnContextSession(this._telemetrySessionId);
    }
    const model = identity.model?.trim();
    const provider = identity.provider?.trim();
    if (model && provider) {
      this._telemetryModel = `${provider}/${model}`;
    } else if (model) {
      this._telemetryModel = model;
    } else if (provider) {
      this._telemetryModel = provider;
    }
    if (model)
      this._telemetryModelId = model;
    if (provider) {
      this._telemetryProvider = provider;
      this._telemetryProviderIsExplicit = true;
    } else if (model && !this._telemetryProviderIsExplicit) {
      this._telemetryProvider = deriveProviderFromModelId(model);
    }
  }
  get telemetrySessionId() {
    return this._telemetrySessionId;
  }
  /**
   * Pin the session identity to pi's STABLE session id and record why this
   * session started (#190). Called AFTER {@link resetForSession} (which assigns
   * a fresh random id), so the stable id — when pi provides one via
   * `ctx.sessionManager.getSessionId()` — wins and survives a quit→resume.
   */
  setSessionLifecycle(args) {
    if (args.sessionId && args.sessionId.trim()) {
      this._telemetrySessionId = args.sessionId.trim();
      this._hasStableSessionId = true;
    }
    this._lifecycleReason = args.reason;
  }
  /** Why the current session started: new | resume | fork | reload | startup. */
  get sessionLifecycleReason() {
    return this._lifecycleReason;
  }
  /** True once a stable pi session id has been pinned (vs the random fallback). */
  get hasStableSessionId() {
    return this._hasStableSessionId;
  }
  get telemetryModel() {
    return this._telemetryModel;
  }
  /** Raw model id (never the combined `provider/model` display string), blank
   * when the host hasn't reported one this session. Worklog/disposition
   * attribution (#1448) reads this, not {@link telemetryModel}. */
  get telemetryModelId() {
    return this._telemetryModelId;
  }
  /** Explicit host-reported provider, or a conservative derivation from the
   * model id (see clients/model-provider.ts), blank when neither is known. */
  get telemetryProviderId() {
    return this._telemetryProvider;
  }
  get turnIndex() {
    return this._turnIndex;
  }
  /**
   * #3613 G1: the turn starts of every session on this coordinator since the
   * session reset. A process-level turn cadence (the memory sample, the
   * smells re-check) paces on it: an integer, so its `% N` gate is met, and
   * moved by a subagent's turns, which run inside one primary turn.
   */
  get turnStartCount() {
    return this._turnStarts;
  }
  /** #3540 r2: the order turn a write token is drawn in; never restarts. */
  get writeOrderTurn() {
    return this._writeOrderTurn;
  }
  get projectSeq() {
    return this._projectSeq;
  }
  /** True when a snapshot of this runtime must not claim `projectSeq` (#3511). */
  get viewMissesLoggedEntries() {
    return this._viewMissingThrough > 0;
  }
  /** The change-log entries this session's seed or merge folded (#3511). */
  get viewLogEntries() {
    return this._viewLogEntries;
  }
  get turnStartProjectSeq() {
    return this._turnStartProjectSeq;
  }
  seedProjectSequence(projectSeq, fileSeqByPath, logEntries = 0) {
    this._projectSeq = Math.max(0, Math.floor(projectSeq));
    this._viewMissingThrough = 0;
    this._viewLogEntries = logEntries;
    this._turnStartProjectSeq = this._projectSeq;
    this._fileSeq.clear();
    this._fileLastProjectSeq.clear();
    for (const [filePath, seq] of fileSeqByPath ?? []) {
      this._fileSeq.set(normalizeMapKey(path8.resolve(filePath)), Math.max(0, seq));
    }
  }
  /**
   * #3511 review B2: fold a late sequence read (session_start's deferred one,
   * after a timed-out read seeded 0) into a session that has already
   * advanced. Unlike `seedProjectSequence` it never lowers the seq or a
   * file's seq, and keeps the in-window changed-since marks. It clears the
   * incomplete mark only when the read reaches every entry the view missed:
   * locked allocation appends entries in rising seq order, so a read whose
   * max is at or above that seq saw all of them. An unlocked entry breaks
   * that order; readers catch it by its tag after the fold point, which the
   * merge only ever advances (review round 2).
   */
  mergeProjectSequence(projectSeq, fileSeqByPath, logEntries = 0) {
    this._projectSeq = Math.max(this._projectSeq, Math.floor(projectSeq));
    this._viewLogEntries = Math.max(this._viewLogEntries, logEntries);
    for (const [filePath, seq] of fileSeqByPath) {
      const key = normalizeMapKey(path8.resolve(filePath));
      this._fileSeq.set(key, Math.max(this._fileSeq.get(key) ?? 0, seq));
    }
    if (projectSeq >= this._viewMissingThrough)
      this._viewMissingThrough = 0;
  }
  bumpFileSeq(filePath, logMaxSeq = 0) {
    const key = normalizeMapKey(path8.resolve(filePath));
    if (logMaxSeq > this._projectSeq) {
      this._projectSeq = logMaxSeq;
      this._viewMissingThrough = Math.max(this._viewMissingThrough, logMaxSeq);
    }
    this._projectSeq += 1;
    const fileSeq = (this._fileSeq.get(key) ?? 0) + 1;
    this._fileSeq.set(key, fileSeq);
    this._fileLastProjectSeq.set(key, this._projectSeq);
    return { projectSeq: this._projectSeq, fileSeq, key };
  }
  /**
   * Files whose most recent bump happened AFTER `seq` — i.e. every file the
   * review graph would need to re-ingest to catch up from a build taken at
   * projectSeq `seq` (#451). Returns NORMALIZED keys (normalizeMapKey +
   * path.resolve), the same form the builder's fileSignatures map uses, so the
   * caller can compare without re-normalizing.
   */
  getFilesChangedSince(seq) {
    const changed = [];
    for (const [key, lastSeq] of this._fileLastProjectSeq) {
      if (lastSeq > seq)
        changed.push(key);
    }
    return changed;
  }
  getFileSeq(filePath) {
    return this._fileSeq.get(normalizeMapKey(path8.resolve(filePath))) ?? 0;
  }
  getFileSeqEntries() {
    return [...this._fileSeq.entries()];
  }
  get sessionGeneration() {
    return this._scope.scopeId;
  }
  /** #3611: the session scope this coordinator serves. */
  get sessionScope() {
    return this._scope;
  }
  /**
   * #3499: a handle on the current session, for a write that lands after an
   * await which can outlive the session (a fire-and-forget quiet window).
   * #3611: a `LineageHandle` on the current scope.
   */
  captureSessionGeneration() {
    return this._scope.capture();
  }
  isCurrentSession(generation) {
    return this._scope.scopeId === generation && this._scope.isLive();
  }
  markStartupScanInFlight(name, generation) {
    this._startupScansInFlight.set(name, generation);
  }
  clearStartupScanInFlight(name, generation) {
    const owner = this._startupScansInFlight.get(name);
    if (owner === generation) {
      this._startupScansInFlight.delete(name);
    }
  }
  isStartupScanInFlight(name) {
    return this._startupScansInFlight.has(name);
  }
  formatPipelineCrashNotice(filePath, err) {
    const key = path8.resolve(filePath);
    const count = (this._pipelineCrashCounts.get(key) ?? 0) + 1;
    this._pipelineCrashCounts.set(key, count);
    const message = err instanceof Error ? err.message : String(err);
    const shortMessage = message.split("\n")[0].slice(0, 220);
    const shouldSurface = count <= RUNTIME_CONFIG.crashNotice.alwaysShowFirstN || count % RUNTIME_CONFIG.crashNotice.showEveryNth === 0;
    if (!shouldSurface)
      return "";
    return [
      "\u26A0\uFE0F pi-lens pipeline crashed while analyzing this write.",
      `File: ${path8.basename(filePath)} | crash count this session: ${count}`,
      `Error: ${shortMessage}`,
      "Recovery: LSP service was reset. If this repeats, rerun with --no-lsp and report the file + stack."
    ].join("\n");
  }
  getCrashEntries() {
    return Array.from(this._pipelineCrashCounts.entries());
  }
  get projectRoot() {
    return this._projectRoot;
  }
  set projectRoot(value) {
    this._projectRoot = normalizeMapKey(value);
  }
  get errorDebtBaseline() {
    return this._errorDebtBaseline;
  }
  set errorDebtBaseline(value) {
    this._errorDebtBaseline = value;
  }
  get cachedExports() {
    return this._cachedExports;
  }
  appendCascadeRun(run) {
    this._cascadeRuns.push(run);
  }
  /**
   * #3512: `generation` is the session the compute was dispatched in. The
   * admitting handler awaits the pipeline first and can resume after a
   * same-cwd replacement's reset, so a capture taken here would name the new
   * session; it is therefore required. `filePath` is the edited file the
   * compute belongs to, the subject of a dropped admission's ledger row.
   */
  appendCascadePromise(p, generation, filePath, analysisRootMode = "session") {
    if (!canWriteAnalysisRoot(analysisRootMode))
      return;
    if (generation.guardedWrite(filePath, () => true) === void 0)
      return;
    if (this._pendingCascadeRuns.length < MAX_PENDING_CASCADE_RUNS) {
      this._pendingCascadeRuns.push(p);
      return;
    }
    recordDegradationOnce({
      kind: "cascade-pending-cap",
      subject: "runtime-coordinator",
      reason: `deferred cascade admission capped at ${MAX_PENDING_CASCADE_RUNS}`
    });
    void p.then((run) => generation.guardedWrite(run.filePath, () => this.appendCascadeRun(run))).catch(() => {
    });
  }
  /**
   * The active turn_end settle clock, or undefined outside that wait.
   *
   * #1462 review F-F: every cascade compute in flight on this coordinator
   * reads the SAME clock. `_turnEndCascadeSettleStarts` is keyed by settle
   * token so `settleCascadeRuns` can distinguish its own drain from a nested
   * one, but this getter always answers with the latest active window —
   * there is one turn_end per runtime, not one per caller. A cascade begun
   * moments before turn_end and one begun long before it both measure elapsed
   * time against the same start, which is correct: they are racing the same
   * settle wait and share its deadline, not separate ones.
   */
  getTurnEndCascadeSettleStart() {
    let latest;
    for (const start of this._turnEndCascadeSettleStarts.values())
      latest = start;
    return latest;
  }
  /**
   * Drain the deferred cascade computes kicked off this turn (#450), racing them
   * against a bounded wait. Fulfilled runs feed the same accumulator as inline
   * runs (appendCascadeRun). A promise still pending at the cap is retained so a
   * late-resolving compute is picked up on the next turn_end rather than lost.
   * The stored promises never reject (pipeline guarantees an "error" skip-run).
   */
  async settleCascadeRuns(maxWaitMs, settleOptions = {}) {
    const pending2 = this._pendingCascadeRuns;
    if (pending2.length === 0)
      return { settled: 0, timedOut: 0 };
    const { generation } = settleOptions;
    if (generation && generation.guardedWrite("cascade-settle", () => true) === void 0)
      return { settled: 0, timedOut: 0 };
    this._pendingCascadeRuns = [];
    const settleToken = settleOptions.trackTurnEndClock ? ++this._nextCascadeSettleToken : void 0;
    if (settleToken !== void 0) {
      this._turnEndCascadeSettleStarts.set(settleToken, Date.now());
    }
    try {
      const tracked = pending2.map((p) => {
        const entry = { done: false, promise: p };
        entry.promise = p.then((run) => {
          entry.done = true;
          entry.run = run;
          return run;
        });
        return entry;
      });
      const timeout = new Promise((resolve32) => {
        setTimeout(resolve32, maxWaitMs).unref?.();
      });
      await Promise.race([
        Promise.allSettled(tracked.map((t) => t.promise)),
        timeout
      ]);
      const commit = (subject, write) => {
        if (generation)
          generation.guardedWrite(subject, write);
        else
          write();
      };
      let settled = 0;
      let timedOut = 0;
      for (const entry of tracked) {
        const { run } = entry;
        if (entry.done && run) {
          commit(run.filePath, () => this.appendCascadeRun(run));
          settled += 1;
        } else {
          commit("cascade-pending", () => this._pendingCascadeRuns.push(entry.promise));
          timedOut += 1;
        }
      }
      return { settled, timedOut };
    } finally {
      if (settleToken !== void 0) {
        this._turnEndCascadeSettleStarts.delete(settleToken);
      }
    }
  }
  /**
   * #3813/#3901: park the items a lane's advisory showed and the turn-end cap
   * cut. Their producers have no queue to restore (the scan cache is
   * overwritten and the edited-file worklist retired before the cap runs), so
   * the lane re-checks each parked item against its next fresh run. Replaces
   * the lane's earlier entry. Returns the lane evicted to stay within
   * `MAX_CUT_ADVISORY_LANES`, if any.
   */
  parkCutAdvisoryItems(lane, items) {
    this._cutAdvisoryItems.delete(lane);
    if (items.length === 0)
      return [];
    return this._cutAdvisoryItems.set(lane, [...items]).map(([key]) => key);
  }
  /** Remove and return a lane's parked items: they are offered once. */
  takeCutAdvisoryItems(lane) {
    const items = this._cutAdvisoryItems.get(lane);
    this._cutAdvisoryItems.delete(lane);
    return items ?? [];
  }
  consumeCascadeRuns() {
    const runs = this._cascadeRuns;
    this._cascadeRuns = [];
    return runs;
  }
  /**
   * R1 (#1443 follow-up): non-destructive peek used by turn_end's read-only
   * fast path. A carried cascade run (or one still in flight) represents a
   * DELIVERY OPPORTUNITY, not turn activity — an agent that answers a question
   * without editing anything must still get yesterday's late finding. Before
   * this, the files-empty early return skipped `settleCascadeRuns` /
   * `consumeCascadeRuns` entirely on a read-only turn, so `beginTurn`'s next
   * carry pass saw the run as having survived a turn_start with no offsetting
   * drain and dropped it — burning the one-turn carry allowance on a turn that
   * never had a chance to deliver.
   */
  hasCascadeRuns() {
    return this._cascadeRuns.length > 0;
  }
  /**
   * Record a file's blocking verdict. Returns its freshness baseline, or
   * undefined when a newer dispatch of the same file already recorded or
   * cleared it (#3507). `recordedAtMs` is the pipeline's analysis read time
   * (#3503); a caller without one stamps now.
   */
  recordInlineBlockers(filePath, summary, writeIndex, sources, lines, contentBaseline, diagnostics, orderTurn = this._writeOrderTurn, recordedAtMs = Date.now()) {
    const writeOrder = writeOrderToken(orderTurn, writeIndex);
    if (!this._inlineBlockerWriteOrder.shouldWrite(normalizeMapKey(filePath), writeOrder))
      return void 0;
    this._resolvedBlockerFilesThisTurn.delete(filePath);
    this._pendingInlineBlockers.set(path8.resolve(filePath), {
      filePath,
      summary,
      writeIndex,
      writeOrder,
      sources,
      lines,
      diagnostics,
      recordedAtMs,
      stale: false,
      ...contentBaseline ? {
        recordedSize: contentBaseline.size,
        recordedHash: contentBaseline.sha256
      } : {}
    });
    return recordedAtMs;
  }
  /**
   * #3814: add a settled collect-later runner's blocking findings to the file's
   * inline-blocker record, the one channel the commit gate's latch
   * (`updateGitGuardStatus`) and the turn-end replay both read. A deferred
   * runner answers after `recordInlineBlockers` has run for its edit, so it
   * MERGES into the record instead of replacing it: the fast runners' blockers
   * for the same bytes stay.
   *
   * Idempotent by finding identity, because two callers hand the same answer
   * here: the commit gate (before turn end) and the turn-end drain (after).
   * Ordering needs no token of its own: the caller admits only answers the
   * path-freshness gate called current, and a later write to the file replaces
   * or clears the whole record (`recordInlineBlockers` / `clearInlineBlockers`).
   * A new record carries the analysed bytes' baseline, so a disposition verdict
   * on it is confirmable by the gate (`firstExpiredSuppressionVerdict`); a
   * merge keeps the existing baseline and its stale demotion. An existing
   * record with no structured diagnostics is left alone: the file already
   * blocks, and merging into text alone would drop it from the replay.
   *
   * @returns how many findings were new to the record (0 = a replay).
   */
  recordDeferredInlineBlockers(filePath, blocking, analysed) {
    const key = path8.resolve(filePath);
    const existing = this._pendingInlineBlockers.get(key);
    if (existing && !existing.diagnostics)
      return 0;
    const identity = (d) => JSON.stringify([d.tool, d.id, d.line, d.message]);
    const known = new Set((existing?.diagnostics ?? []).map(identity));
    const added = blocking.flatMap((d) => known.has(identity(d)) ? [] : [d]);
    if (added.length === 0)
      return 0;
    const diagnostics = [...existing?.diagnostics ?? [], ...added];
    this._pendingInlineBlockers.set(key, {
      ...existing ?? {
        filePath,
        recordedAtMs: analysed.recordedAtMs,
        stale: false,
        ...analysed.contentBaseline ? {
          recordedSize: analysed.contentBaseline.size,
          recordedHash: analysed.contentBaseline.sha256
        } : {}
      },
      summary: formatDiagnostics(diagnostics, "blocking").trim(),
      diagnostics,
      // The same two derivations the pipeline's writer uses: `lines` keeps only
      // this file's own rows, `sources` pins an untagged finding as "unknown".
      sources: [
        .../* @__PURE__ */ new Set([
          ...existing?.sources ?? [],
          ...inlineBlockerSources(added)
        ])
      ],
      lines: [
        ...existing?.lines ?? [],
        ...inlineBlockerLines(added, filePath)
      ],
      // The turn-end policy verdict was about the OLD set; the added findings
      // passed the policy already and the next turn end re-derives the rest.
      policySuppressed: false
    });
    return added.length;
  }
  /**
   * #3218 criterion 2: remember one file whose blocker a clean verdict just
   * retired, for the turn-end "Resolved" line. Called from the two retire
   * seams (`clearInlineBlockers` and `retireInlineBlockerOnConfirmedClean`)
   * with the record that was removed and the retiring write's order, so the
   * composer never has to re-derive the count from rendered text. Bounded at
   * `MAX_RESOLVED_BLOCKER_FILES`; the overflow is counted for the "… and N
   * more" tail.
   */
  noteResolvedBlockerFile(record, retiringWriteOrder, confirmedClean) {
    if (!this._resolvedBlockerFilesThisTurn.has(record.filePath) && this._resolvedBlockerFilesThisTurn.size >= MAX_RESOLVED_BLOCKER_FILES) {
      this._resolvedBlockerFilesDropped += 1;
      return;
    }
    this._resolvedBlockerFilesThisTurn.set(record.filePath, {
      filePath: record.filePath,
      blockerCount: record.diagnostics?.length ?? record.lines?.length ?? 1,
      // A write order token carries its turn above the write index
      // (`writeOrderToken`); the line names only the write.
      writeIndex: confirmedClean || retiringWriteOrder === void 0 ? void 0 : retiringWriteOrder % 2 ** 32,
      confirmedClean,
      turnIndex: this._turnIndex
    });
  }
  /**
   * Clear a file's verdict after a clean dispatch. Returns false when a newer
   * dispatch of the same file already recorded or cleared it (#3507), or when
   * `analysis` ran without authorship over the very bytes the record is about
   * (#4137 round 3). Such a run withholds the blocker channel (#3226), so its
   * clean result is no evidence against an authored verdict on the same bytes;
   * before this, an opaque recovery of bytes the agent authored cleared the
   * record whenever the already-analysed latch was gone (a concurrent
   * session's turn start, the session's own next turn), and turn end then
   * reported a false "Resolved". The refusal consumes no write order and is
   * counted as `blocker-clear-refused` per file key. A record with no
   * `recordedHash` (#2982: the file was unreadable or over the baseline cap at
   * record time) cannot be matched and is cleared as before.
   */
  clearInlineBlockers(filePath, writeIndex, orderTurn = this._writeOrderTurn, analysis) {
    const existing = this._pendingInlineBlockers.get(path8.resolve(filePath));
    if (existing && analysis && !analysis.authored && analysis.sha256 !== void 0 && existing.recordedHash === analysis.sha256) {
      incrementDegradationCount({
        kind: "blocker-clear-refused",
        subject: normalizeMapKey(filePath),
        reason: "an analysis without authorship read the bytes an authored verdict is about; its clean result does not retire the record (#4137)"
      });
      return false;
    }
    if (!this._inlineBlockerWriteOrder.shouldWrite(normalizeMapKey(filePath), writeOrderToken(orderTurn, writeIndex)))
      return false;
    if (existing) {
      this.noteResolvedBlockerFile(existing, writeOrderToken(orderTurn, writeIndex), false);
    }
    this._pendingInlineBlockers.delete(path8.resolve(filePath));
    return true;
  }
  /**
   * #1631: demote a cached blocker to stale without dropping it (#1419
   * demote-not-drop). Called by the turn-boundary freshness sweep when the
   * file or one of its forward imports drifted on disk after the verdict.
   * Idempotent: re-marking an already-stale entry (for ANY reason) is a
   * no-op — a `"past-eof"` demotion already took this record out of the
   * authoritative channel, and `sweepInlineBlockerFreshness` re-checks next
   * turn once that heals. Returns true only when this call transitioned the
   * entry to stale, so a caller can log the demotion exactly once.
   */
  markInlineBlockerStale(filePath, reason = "dependency-drift") {
    const key = path8.resolve(filePath);
    const existing = this._pendingInlineBlockers.get(key);
    if (!existing || existing.stale)
      return false;
    this._pendingInlineBlockers.set(key, {
      ...existing,
      stale: true,
      staleReason: reason
    });
    return true;
  }
  /**
   * #1641: re-derive the past-EOF demotion for one inline-blocker record.
   * Unlike {@link markInlineBlockerStale} (a one-way latch for the
   * dependency-drift gate), this RE-ARMS: called every turn end with the
   * gate's freshly-computed verdict, it can both demote (rising edge) and
   * heal (falling edge — a transient shrink-then-restore of the file). Never
   * touches a record a sibling gate demoted (`staleReason !== "past-eof"`
   * while `stale`) — composing with #1631's dependency-drift gate means each
   * gate only heals its own demotions. Returns true only on an actual
   * transition, so the caller logs/resyncs exactly once per edge.
   */
  setInlineBlockerPastEofStale(filePath, isPastEof) {
    const key = path8.resolve(filePath);
    const existing = this._pendingInlineBlockers.get(key);
    if (!existing)
      return false;
    if (existing.stale && existing.staleReason !== "past-eof")
      return false;
    const currentlyPastEof = !!existing.stale && existing.staleReason === "past-eof";
    if (currentlyPastEof === isPastEof)
      return false;
    this._pendingInlineBlockers.set(key, {
      ...existing,
      stale: isPastEof,
      staleReason: isPastEof ? "past-eof" : void 0
    });
    return true;
  }
  /**
   * #2982: re-derive the self-drift demotion for one inline-blocker record.
   *
   * Modelled on {@link setInlineBlockerPastEofStale}, not on
   * {@link markInlineBlockerStale}: it RE-ARMS rather than latching, so a
   * file whose bytes drift and then come back (a checkout, a revert, an
   * editor writing the original content) un-demotes on the next sweep
   * instead of staying demoted for the session. That re-arm is what lets
   * this axis skip the #1950 delivery cap entirely — a record that can heal
   * needs no bounded-noise retirement, and applying the cap here would walk
   * an ast-grep or tree-sitter security finding out of turn-end rendering
   * permanently (#2982 review).
   *
   * Composes with the sibling gates the same way they compose with each
   * other: it never touches a record another gate demoted, and never heals a
   * demotion it did not make. Returns true only on an actual transition, so
   * the caller counts exactly one edge.
   */
  setInlineBlockerSelfDriftStale(filePath, isSelfDrift) {
    const key = path8.resolve(filePath);
    const existing = this._pendingInlineBlockers.get(key);
    if (!existing)
      return false;
    if (existing.stale && existing.staleReason !== "self-drift")
      return false;
    const currentlySelfDrift = !!existing.stale && existing.staleReason === "self-drift";
    if (currentlySelfDrift === isSelfDrift)
      return false;
    const { staleReason: _cleared, ...rest } = existing;
    this._pendingInlineBlockers.set(key, {
      ...rest,
      stale: isSelfDrift,
      ...isSelfDrift ? { staleReason: "self-drift" } : {}
    });
    return true;
  }
  /**
   * #1944: retire a past-EOF demotion after its ONE degraded delivery.
   *
   * The past-EOF gate demotes and re-arms, but nothing ever retired the
   * record, so a blocker whose file shrank past the cited lines re-served on
   * every turn end for the rest of the session — measured live at 80+
   * minutes on session 01a0234c. The re-serve is unbounded, not the six
   * turns the first evidence window suggested.
   *
   * It is unbounded because the record cannot resolve itself. The two
   * clearing events (`clearInlineBlockers` on a later dispatch of the same
   * path, `retireInlineBlockerOnConfirmedClean` on a fresh clean verdict)
   * both need the file to be looked at again, and the agent has no reason to
   * look: the coordinates it was handed do not exist. "Re-run to confirm" is
   * an instruction this record makes impossible to follow.
   *
   * So the delivery surface retires it after serving it once, degraded. That
   * is a DROP, which #1419's demote-not-drop rule normally forbids; the
   * exception is narrow and stated here. The finding was already delivered
   * this turn with its dead coordinates annotated, and what remains is a
   * message pinned to a line the file does not have. `deadLines` is required
   * and must be non-empty, so a record stale for any OTHER reason, or
   * past-EOF with no identified dead line, still stands.
   *
   * @returns true when an entry was retired — the caller records it, so the
   * suppression is never silent (#1432 Gap 1).
   */
  retireDemotedPastEofBlocker(filePath, deadLines) {
    const key = this.pastEofRetireKey(filePath, deadLines);
    if (key === void 0)
      return false;
    this._pendingInlineBlockers.delete(key);
    return true;
  }
  /**
   * #3813: the retire rule of {@link retireDemotedPastEofBlocker}, without
   * the delete. The turn-end composer asks it at render time (to word the
   * retirement note) and only retires once the cap has let the delivery
   * through; the rule stays here, in one place.
   */
  wouldRetireDemotedPastEofBlocker(filePath, deadLines) {
    return this.pastEofRetireKey(filePath, deadLines) !== void 0;
  }
  /** The store key of the record the past-EOF retire rule admits, if any. */
  pastEofRetireKey(filePath, deadLines) {
    if (deadLines.length === 0)
      return void 0;
    const key = path8.resolve(filePath);
    const existing = this._pendingInlineBlockers.get(key);
    if (!existing)
      return void 0;
    if (!existing.stale)
      return void 0;
    return (existing.staleReason ?? "past-eof") === "past-eof" ? key : void 0;
  }
  /**
   * #1950 fix-round F1: read the current delivery count WITHOUT committing
   * an increment. `runtime-turn.ts` needs the count a delivery would reach
   * BEFORE it knows whether that delivery will actually reach the agent —
   * the turn-end signature dedupe (`turn-end-findings-last`) can suppress a
   * turn whose rendered content is identical to the last one, and a
   * suppressed turn must not advance the counter (the agent never saw it).
   * The caller peeks, renders the tentative body, and only calls
   * {@link incrementInlineBlockerStaleDelivery} once it knows the turn's
   * content is NOT being suppressed.
   */
  peekInlineBlockerStaleDeliveryCount(filePath) {
    const key = path8.resolve(filePath);
    return this._pendingInlineBlockers.get(key)?.staleDeliveryCount ?? 0;
  }
  /**
   * #1950: commit one more turn end that re-served this record while
   * `stale`. The caller (`runtime-turn.ts`) only calls this for a
   * `"dependency-drift"` demotion — a `"past-eof"` demotion retires after
   * its own single delivery (#1944, `retireDemotedPastEofBlocker`) and
   * never accumulates a count — and only AFTER confirming the turn's
   * content will not be suppressed by the signature dedupe (see
   * {@link peekInlineBlockerStaleDeliveryCount}), so this counts ACTUAL
   * deliveries the agent saw, not turn-end loop iterations. Returns the new
   * count, or 0 when there is no entry to count against (already retired,
   * or never recorded).
   */
  incrementInlineBlockerStaleDelivery(filePath) {
    const key = path8.resolve(filePath);
    const existing = this._pendingInlineBlockers.get(key);
    if (!existing)
      return 0;
    const next = (existing.staleDeliveryCount ?? 0) + 1;
    this._pendingInlineBlockers.set(key, {
      ...existing,
      staleDeliveryCount: next
    });
    return next;
  }
  /**
   * #1950: retire a dependency-drift demotion once it has been delivered
   * `DEPENDENCY_DRIFT_MAX_DELIVERIES` times with no re-run confirming or
   * clearing it. Unlike {@link retireDemotedPastEofBlocker}, the record is
   * NOT provably unrecoverable — its coordinates are still in bounds, and a
   * fresh dispatch of the file could still confirm or clear it. This is a
   * bounded-noise cap, not a "this can never resolve" verdict, and the
   * caller's ledger reason must say so (`demoted-finding-retired`'s "capped,
   * re-run can still confirm" vs. past-EOF's "retired, unrecoverable").
   *
   * Only ever touches this gate's OWN demotion (`staleReason ===
   * "dependency-drift"`) — a past-EOF demotion on the same file is that
   * gate's own record to retire, not this one's.
   *
   * @returns true when an entry was retired — the caller records it, so the
   * suppression is never silent (#1432 Gap 1).
   */
  retireDemotedDependencyDriftBlocker(filePath) {
    const key = path8.resolve(filePath);
    const existing = this._pendingInlineBlockers.get(key);
    if (!existing)
      return false;
    if (!existing.stale)
      return false;
    if (existing.staleReason !== "dependency-drift")
      return false;
    this._pendingInlineBlockers.delete(key);
    return true;
  }
  /**
   * Retire a file's inline blocker because a FRESH, content-bound diagnostic
   * verdict proved it gone (#1561).
   *
   * The map was invalidated by exactly two events: a later dispatch of the
   * SAME path returning no blockers, and that path ceasing to exist (#1245).
   * Neither covers the common case that produced #1561 — a blocker on file F
   * whose cause lives in file G. Fixing G re-dispatches G, not F, so F's
   * verdict was never re-taken and "Unresolved from this turn" was re-injected
   * for the rest of the session. In the live case the agent then ran
   * `lsp_diagnostics` on F, pi-lens answered "confirmed clean", and the
   * blocker was STILL re-served on the next three turn ends: #571 wired that
   * tool's confirmed result into the widget footer and stopped there.
   *
   * This is the seam #1198 invariant 4 left undecided, decided: an affirmative
   * clean from the authoritative current view retires the stale verdict.
   *
   * Ordering (#1198 invariants 1-2). Both stores draw from the same
   * `nextWriteIndex()` counter, ordered turn first (#3540: the counter
   * restarts at every turn), so when both sides are stamped the retire
   * requires the clean verdict to be strictly NEWER. A slow old clean that
   * settles after a fresh dispatch found real blockers must not erase them.
   * When either side is unstamped the two cannot be ordered at all; the fresh
   * confirmed verdict wins, because it is the only one of the two backed by an
   * actual observation of current content. Only production's single record site
   * is stamped, so in practice the unstamped branch is legacy callers/tests.
   *
   * COVERAGE (#1561 F1). A blocker is retired only by a verdict that can speak
   * for the tools that raised it. Inline blockers come from the whole dispatch,
   * not just the language server: `dispatcher.ts` collects every
   * `semantic === "blocking"` diagnostic across all runners, so eslint,
   * biome-check, actionlint, elixir/gleam-check and ast-grep security rules all
   * land in this map. A language-server check knows nothing about any of them,
   * so `coveredSources` must be a SUPERSET of the recorded sources or the entry
   * stands. This is a commit gate: a record whose provenance is unknown (no
   * `sources`) fails CLOSED and is never retired, because "we don't know what
   * raised this" must not resolve to "an LSP check can clear it".
   *
   * @returns true when an entry was retired — the caller logs it, so an
   * eviction is never silent (#1432 Gap 1).
   */
  retireInlineBlockerOnConfirmedClean(filePath, confirmedAtWriteOrder, coveredSources) {
    const key = path8.resolve(filePath);
    const existing = this._pendingInlineBlockers.get(key);
    if (!existing)
      return false;
    if (existing.writeOrder !== void 0 && confirmedAtWriteOrder !== void 0 && confirmedAtWriteOrder <= existing.writeOrder) {
      return false;
    }
    if (!existing.sources || existing.sources.length === 0)
      return false;
    const covered = new Set(coveredSources ?? []);
    if (!existing.sources.every((source) => covered.has(source)))
      return false;
    this.noteResolvedBlockerFile(existing, void 0, true);
    this._pendingInlineBlockers.delete(key);
    return true;
  }
  /**
   * #3218 criterion 2: a retirement no turn_end has delivered yet. The
   * read-only turn_end path uses it to fall through to the composer instead of
   * returning early, so a `lens_diagnostics` confirmation reaches the agent.
   */
  hasResolvedBlockerFiles() {
    return this._resolvedBlockerFilesThisTurn.size > 0;
  }
  /**
   * #3218 criterion 2: hand the turn-end composer the retired files it can
   * deliver, and remove exactly those, so a retire is delivered once. An entry
   * `holdBack` names STAYS for the next turn_end: the composer holds back a
   * file its own message still lists as unresolved (a retire that landed after
   * the blockers were snapshotted), because one message must never say both,
   * and a line that would not fit the message cap (called in list order).
   * The "… and N more" overflow count rides with a batch that lists files and
   * is otherwise kept, so a bare tail is never delivered.
   */
  consumeResolvedBlockerFiles(holdBack) {
    const files = [];
    const held = [];
    for (const entry of this._resolvedBlockerFilesThisTurn.values()) {
      (holdBack(entry) ? held : files).push(entry);
    }
    this._resolvedBlockerFilesThisTurn.clear();
    for (const entry of held) {
      this._resolvedBlockerFilesThisTurn.set(entry.filePath, entry);
    }
    if (files.length === 0)
      return { files, dropped: 0 };
    const dropped = this._resolvedBlockerFilesDropped;
    this._resolvedBlockerFilesDropped = 0;
    return { files, dropped };
  }
  reconcileInlineBlockers() {
    const survivors = [];
    for (const [displayPath, value] of this._pendingInlineBlockers.entries()) {
      if (fs9.existsSync(displayPath))
        survivors.push([displayPath, value]);
    }
    if (survivors.length !== this._pendingInlineBlockers.size) {
      this._pendingInlineBlockers.clear();
      for (const [displayPath, value] of survivors) {
        this._pendingInlineBlockers.set(displayPath, value);
      }
    }
  }
  /**
   * Stale-entry reconcile (#1245): a blocker recorded for a file that has
   * since been deleted can never be cleared — `clearInlineBlockers` fires
   * only on a LATER dispatch of the same path, which a deleted file never
   * gets. Every read of the blocker map (turn_end injection, git-guard
   * size/summary, `syncGitGuardRecord`) therefore drops entries whose file no
   * longer exists on disk: a blocker for a deleted file is stale by
   * definition (the agent cannot fix it), so it must not re-surface every
   * turn or gate a commit. The map is tiny (per-turn blockers) and reads are
   * bounded (once per turn_end / tool_result), so the probe cost is
   * negligible.
   */
  getInlineBlockersSnapshot() {
    this.reconcileInlineBlockers();
    return [...this._pendingInlineBlockers.values()];
  }
  consumeInlineBlockers() {
    const entries = this.getInlineBlockersSnapshot();
    this._pendingInlineBlockers.clear();
    return entries;
  }
  /**
   * #3613: the partition a per-turn record of `sessionId`'s turn lives in,
   * the rule {@link beginTurn} applies too: a turn with no session id of its
   * own is this coordinator's.
   */
  turnSession(sessionId) {
    return sessionId ?? this._telemetrySessionId;
  }
  recordActionableWarnings(warnings, sessionId) {
    this._actionableWarningsThisTurn.add(this.turnSession(sessionId), warnings);
  }
  peekActionableWarnings(sessionId) {
    return this._actionableWarningsThisTurn.peek(this.turnSession(sessionId));
  }
  clearActionableWarnings(sessionId) {
    this._actionableWarningsThisTurn.clear(this.turnSession(sessionId));
  }
  recordCodeQualityWarnings(warnings, sessionId) {
    this._codeQualityWarningsThisTurn.add(this.turnSession(sessionId), warnings);
  }
  peekCodeQualityWarnings(sessionId) {
    return this._codeQualityWarningsThisTurn.peek(this.turnSession(sessionId));
  }
  clearCodeQualityWarnings(sessionId) {
    this._codeQualityWarningsThisTurn.clear(this.turnSession(sessionId));
  }
  /**
   * #3613 F2: the key a per-turn cap (the observed-mutation budget, a
   * bounded-telemetry `capPerTurn`) uses for the current turn of `sessionId`.
   * This coordinator's own turn is its turn index, as before; a concurrent
   * session's turn is the key its own turn start drew, so each of its turns
   * re-arms and no two sessions' turns share a cap.
   */
  turnKey(sessionId) {
    const turnSession = this.turnSession(sessionId);
    if (turnSession === this._telemetrySessionId)
      return this._turnIndex;
    return this._foreignTurnKeys.get(turnSession) ?? this._turnIndex;
  }
  /**
   * #3613 G2: whether `key` is a live turn key: this coordinator's current
   * turn, or a live concurrent session's current one.
   */
  isLiveTurnKey(key) {
    if (key === this._turnIndex)
      return true;
    for (const live of this._foreignTurnKeys.values())
      if (live === key)
        return true;
    return false;
  }
  /**
   * #3613: a concurrent session's per-turn records end with its session, so
   * a subagent that shuts down before its turn end leaves no partition
   * behind. This coordinator's own records are reset by `resetForSession`.
   */
  forgetTurnSession(sessionId) {
    const turnSession = this.turnSession(sessionId);
    if (turnSession === this._telemetrySessionId)
      return;
    this._foreignTurnKeys.delete(turnSession);
    this._actionableWarningsThisTurn.clear(turnSession);
    this._codeQualityWarningsThisTurn.clear(turnSession);
  }
  /** #484: the per-run diagnostics/autofix/format collector (accumulates
   * across turns; consumed once at the agent_settled quiet window). Always
   * present; callers gate recording behind the `lens-turn-summary` opt-in
   * flag. */
  get turnSummary() {
    return this._turnSummary;
  }
  get complexityBaselines() {
    return this._complexityBaselines;
  }
  get fixedThisTurn() {
    const facade = {
      add: (filePath) => {
        this._fixedThisTurn.set(filePath, true);
        return facade;
      },
      has: (filePath) => this._fixedThisTurn.has(filePath),
      delete: (filePath) => this._fixedThisTurn.delete(filePath),
      clear: () => this._fixedThisTurn.clear()
    };
    return facade;
  }
  get projectRulesScan() {
    return this._projectRulesScan;
  }
  set projectRulesScan(value) {
    this._projectRulesScan = value;
  }
  get readGuard() {
    this._readGuard ??= new ReadGuard(this._telemetrySessionId, {}, this._scope);
    return this._readGuard;
  }
  /**
   * Record the canonical target `tool_call` resolved for `toolCallId`
   * (#1642). The paired `tool_result` claims this exactly once via
   * {@link takeToolCallAttribution} instead of re-deriving a path from its
   * own diff metadata.
   */
  recordToolCallAttribution(toolCallId, attribution) {
    this._toolCallAttributions.set(toolCallId, {
      ...attribution,
      recordedAt: Date.now()
    });
  }
  /** #3555: note the widening the tool_call applied to this read. */
  recordReadWidening(toolCallId, widening) {
    this._readWidenings.set(toolCallId, widening);
  }
  /** #3555: one-shot claim of a read's widening, as with an attribution. */
  takeReadWidening(toolCallId) {
    const widening = this._readWidenings.get(toolCallId);
    this._readWidenings.delete(toolCallId);
    return widening;
  }
  /** #3523: see {@link ToolCallAttribution.editInPlace}. */
  markToolCallEditInPlace(toolCallId) {
    const attribution = this._toolCallAttributions.get(toolCallId);
    if (attribution)
      attribution.editInPlace = true;
  }
  /** #3525: see {@link ToolCallAttribution.fileTimeStale}. */
  markToolCallFileTimeStale(toolCallId) {
    const attribution = this._toolCallAttributions.get(toolCallId);
    if (attribution)
      attribution.fileTimeStale = true;
  }
  /**
   * One-shot claim of a previously recorded tool-call attribution. Removed
   * on read: a given `tool_call`/`tool_result` pair correlates exactly once,
   * and leaving it behind would let a later, unrelated `tool_result` that
   * happens to reuse a stale id inherit a stranger's resolved path.
   *
   * An expired entry (older than `TOOL_CALL_ATTRIBUTION_TTL_MS`) is treated
   * as a miss and removed rather than returned — see the constant's doc.
   */
  takeToolCallAttribution(toolCallId) {
    const attribution = this._toolCallAttributions.get(toolCallId);
    if (attribution === void 0)
      return void 0;
    this._toolCallAttributions.delete(toolCallId);
    if (Date.now() - attribution.recordedAt > TOOL_CALL_ATTRIBUTION_TTL_MS) {
      return void 0;
    }
    return attribution;
  }
  /**
   * Queue one mutation kind for `filePath` at `agent_end`. Returns `true`
   * when this call created a pending entry or added a new kind, and `false`
   * for a same-kind re-touch. Callers publish each kind's first transition
   * without spamming repeated edits before `agent_end`.
   */
  deferMutation(filePath, cwd, toolName, turnStateCwd, kind, ownerSessionId, originCwd, readGuardBranchEpoch = this.readGuard.currentBranchEpoch, analysisRootMode = "session") {
    if (!canWriteAnalysisRoot(analysisRootMode))
      return false;
    const key = path8.resolve(filePath);
    const now = Date.now();
    const resolvedOriginCwd = originCwd ?? turnStateCwd;
    const existing = this._pendingDeferredMutations.get(key);
    if (existing) {
      existing.readGuardBranchEpoch = Math.max(existing.readGuardBranchEpoch, readGuardBranchEpoch);
      const addedKind = !existing.kinds.has(kind);
      existing.lastTouchedAt = now;
      existing.cwd = cwd;
      existing.turnStateCwd = turnStateCwd;
      existing.toolNames.add(toolName);
      existing.kinds.add(kind);
      existing.queuedTurnIndex = this._turnIndex;
      existing.queuedTurnId = `${this._telemetrySessionId}:${this._turnIndex}`;
      existing.ownerSessionId = ownerSessionId;
      existing.originCwd = resolvedOriginCwd;
      return addedKind;
    }
    this._pendingDeferredMutations.set(key, {
      filePath: key,
      cwd,
      turnStateCwd,
      firstTouchedAt: now,
      lastTouchedAt: now,
      toolNames: /* @__PURE__ */ new Set([toolName]),
      kinds: /* @__PURE__ */ new Set([kind]),
      queuedTurnIndex: this._turnIndex,
      queuedTurnId: `${this._telemetrySessionId}:${this._turnIndex}`,
      ownerSessionId,
      originCwd: resolvedOriginCwd,
      readGuardBranchEpoch
    });
    return true;
  }
  deferFormat(filePath, cwd, toolName, turnStateCwd, ownerSessionId, originCwd, analysisRootMode = "session") {
    return this.deferMutation(filePath, cwd, toolName, turnStateCwd, "format", ownerSessionId, originCwd, void 0, analysisRootMode);
  }
  /** Return the ownership identity of a queued format record for bus events. */
  deferredFormatIdentity(filePath) {
    const record = this._pendingDeferredMutations.get(path8.resolve(filePath));
    if (!record || !record.kinds.has("format"))
      return void 0;
    return {
      ownerSessionId: record.ownerSessionId,
      turnIndex: record.queuedTurnIndex,
      batchId: record.queuedTurnId
    };
  }
  get pendingDeferredFormatCount() {
    return this._pendingDeferredMutations.size;
  }
  get pendingDeferredMutationCount() {
    return this._pendingDeferredMutations.size;
  }
  /**
   * Legacy unconditional drain — still exposed for any caller that
   * genuinely wants "everything, no ownership check" (and for tests). New
   * flush call sites should prefer {@link claimDeferredFormatFiles}.
   */
  consumeDeferredFormatFiles() {
    const records = [...this._pendingDeferredMutations.values()];
    this._pendingDeferredMutations.clear();
    return records;
  }
  /**
   * Ownership-filtered drain (#791). Claims and removes only the records
   * this flush is entitled to:
   *  - `ownerSessionId` unset on the record, OR `currentSessionId` unset, OR
   *    they match → claimed as "same session" (the common case, and the
   *    fail-safe default when either side lacks a stable session id).
   *  - otherwise (both known, and they differ) the record belongs to a
   *    DIFFERENT session (e.g. a concurrent in-process secondary/subagent)
   *    and is left queued for its owner's own flush — UNLESS it has sat
   *    unclaimed longer than `staleAfterMs` (the owner presumably died), in
   *    which case this flush claims it as an orphan-recovery fallback ONLY
   *    when `currentOriginCwd` (this flush's own workspace/worktree) exactly
   *    matches the record's `originCwd` (the cwd it was actually queued
   *    under, #1642 F3 — NOT `turnStateCwd`, which is always the workspace
   *    root by design and so would match every session unconditionally). A
   *    mismatch means the record belongs to a DIFFERENT checkout/worktree
   *    than the one now running `agent_end` — claiming it across that
   *    boundary is exactly how a worktree's queued edit got formatted onto
   *    the parent checkout in the reported incident. It is left queued
   *    (NOT deleted) and logged instead: a legitimate crashed-session
   *    orphan from, say, a monorepo subdir must still be claimable later by
   *    a flush whose origin actually matches, or stay visible for
   *    observability — deleting it here would drop it forever with no
   *    origin ever able to reclaim it.
   *
   * Returns the claimed records, the left-queued mismatched-origin records,
   * and per-skipped record why it was left behind — callers use this for
   * `agent_end`'s latency-log provenance and for the "stale fallback
   * fired"/"orphan mismatch" log lines.
   */
  claimDeferredFormatFiles(currentSessionId, now, staleAfterMs, currentOriginCwd) {
    const claimed = [];
    const staleClaimed = [];
    const deferredToOwner = [];
    const droppedOrphans = [];
    for (const [key, record] of this._pendingDeferredMutations) {
      const sameSession = record.ownerSessionId === void 0 || currentSessionId === void 0 || record.ownerSessionId === currentSessionId;
      if (sameSession) {
        claimed.push(record);
        this._pendingDeferredMutations.delete(key);
        continue;
      }
      const age = now - record.lastTouchedAt;
      if (age > staleAfterMs) {
        const originMatches = currentOriginCwd === void 0 || pathsEqual(record.originCwd, currentOriginCwd);
        if (originMatches) {
          this._pendingDeferredMutations.delete(key);
          staleClaimed.push(record);
        } else {
          droppedOrphans.push(record);
        }
        continue;
      }
      deferredToOwner.push(record);
    }
    return { claimed, staleClaimed, deferredToOwner, droppedOrphans };
  }
  /** Return claimed records that were never started by an aborted drain. */
  requeueDeferredFormatFiles(records) {
    for (const record of records) {
      const key = path8.resolve(record.filePath);
      const existing = this._pendingDeferredMutations.get(key);
      if (existing) {
        for (const kind of record.kinds)
          existing.kinds.add(kind);
        for (const toolName of record.toolNames)
          existing.toolNames.add(toolName);
        existing.readGuardBranchEpoch = Math.max(existing.readGuardBranchEpoch, record.readGuardBranchEpoch);
        continue;
      }
      this._pendingDeferredMutations.set(key, {
        ...record,
        kinds: new Set(record.kinds),
        toolNames: new Set(record.toolNames)
      });
    }
  }
  claimDeferredMutations(currentSessionId, now, staleAfterMs, currentOriginCwd) {
    return this.claimDeferredFormatFiles(currentSessionId, now, staleAfterMs, currentOriginCwd);
  }
  requeueDeferredMutations(records) {
    this.requeueDeferredFormatFiles(records);
  }
  shouldWarmLspOnRead(filePath, maxAgeMs = 12e4) {
    const state = this._lspReadWarmState.get(path8.resolve(filePath));
    if (!state)
      return true;
    if (state.status === "warming")
      return false;
    return Date.now() - state.ts > maxAgeMs;
  }
  markLspReadWarmStarted(filePath) {
    this._lspReadWarmState.set(path8.resolve(filePath), {
      status: "warming",
      ts: Date.now()
    });
  }
  markLspReadWarmCompleted(filePath) {
    this._lspReadWarmState.set(path8.resolve(filePath), {
      status: "ready",
      ts: Date.now()
    });
  }
  clearLspReadWarmState(filePath) {
    this._lspReadWarmState.delete(path8.resolve(filePath));
  }
};

// dist/clients/runtime-session.js
import * as nodeFs from "node:fs";
import * as path13 from "node:path";

// dist/clients/message-end-attribution.js
var lastStableSessionId;
var previousSessionId;
function rotateMessageEndAttribution() {
  if (lastStableSessionId !== void 0) {
    previousSessionId = lastStableSessionId;
  }
  lastStableSessionId = void 0;
}

// dist/clients/dead-code-logger.js
import * as path9 from "node:path";
var LOG_DIR = getGlobalPiLensLogDir();
var LOG_FILE = path9.join(LOG_DIR, "dead-code.log");
var LOG_BACKUP_FILE = path9.join(LOG_DIR, "dead-code.log.1");
var MAX_LOG_BYTES = Math.max(128 * 1024, Number.parseInt(process.env.PI_LENS_DEAD_CODE_LOG_MAX_BYTES ?? "1048576", 10) || 1048576);
var writer = createNdjsonLogger({
  filePath: LOG_FILE,
  maxBytes: MAX_LOG_BYTES,
  backupPath: LOG_BACKUP_FILE
});
function logDeadCodeScan(event) {
  if (isTestMode())
    return;
  writer.log({ ts: (/* @__PURE__ */ new Date()).toISOString(), ...event });
}

// dist/clients/print-mode.js
function isPrintMode(argv = process.argv) {
  return argv.includes("--print") || argv.includes("-p");
}

// dist/clients/rules-scanner.js
import * as fs10 from "node:fs";
import * as path10 from "node:path";
var RULE_DIRS = [
  { dir: ".claude/rules", source: ".claude/rules" },
  { dir: ".agents/rules", source: ".agents/rules" }
];
var RULE_FILES = [
  { file: "CLAUDE.md", source: "root" },
  { file: "AGENTS.md", source: "root" },
  { file: ".cursorrules", source: "root" }
];
var RULES_SCAN_MAX_DEPTH = 8;
var RULES_SCAN_MAX_FILES = 500;
function findMarkdownFiles(dir, baseDir, depth = 0, collected = { count: 0 }) {
  const results = [];
  if (depth > RULES_SCAN_MAX_DEPTH)
    return results;
  if (!fs10.existsSync(dir))
    return results;
  const entries = fs10.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (collected.count >= RULES_SCAN_MAX_FILES)
      break;
    const fullPath = path10.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findMarkdownFiles(fullPath, baseDir, depth + 1, collected));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      collected.count += 1;
      results.push({
        source: path10.relative(baseDir, dir) || path10.basename(baseDir),
        name: entry.name,
        filePath: fullPath,
        relativePath: path10.relative(baseDir, fullPath).replace(/\\/g, "/")
      });
    }
  }
  return results;
}
function scanProjectRules(cwd) {
  const rules = [];
  for (const { dir, source } of RULE_DIRS) {
    const dirPath = path10.join(cwd, dir);
    if (fs10.existsSync(dirPath)) {
      const found = findMarkdownFiles(dirPath, path10.join(cwd, dir));
      for (const rule of found) {
        rules.push({
          source,
          name: rule.name,
          filePath: rule.filePath,
          relativePath: `${dir}/${rule.relativePath}`
        });
      }
    }
  }
  for (const { file, source } of RULE_FILES) {
    const filePath = path10.join(cwd, file);
    if (fs10.existsSync(filePath)) {
      rules.push({
        source,
        name: file,
        filePath,
        relativePath: file
      });
    }
  }
  return {
    rules,
    hasCustomRules: rules.length > 0
  };
}

// dist/clients/smells-rollup.js
import * as fs11 from "node:fs";
import * as path11 from "node:path";
var SMELLS_TAIL_BYTES_PER_FILE = 64 * 1024;
var SMELLS_ROLLING_WINDOW_MS = 24 * 60 * 6e4;
var SMELLS_THRESHOLDS = {
  staleCtxEmitFailed: 5,
  opengrepRespawn: 5
};
var SMELL_LABELS = {
  staleCtxEmitFailed: "stale-ctx emit_failed (bus-events.log)",
  opengrepRespawn: "opengrep respawn (latency.log)"
};
var SMELL_KEYS = ["staleCtxEmitFailed", "opengrepRespawn"];
function tailReadText(filePath, maxBytes) {
  let fd;
  try {
    fd = fs11.openSync(filePath, "r");
  } catch {
    return "";
  }
  try {
    const size = fs11.fstatSync(fd).size;
    const readBytes2 = Math.min(size, maxBytes);
    if (readBytes2 <= 0)
      return "";
    const start = size - readBytes2;
    const buf = Buffer.alloc(readBytes2);
    fs11.readSync(fd, buf, 0, readBytes2, start);
    const text = buf.toString("utf8");
    if (start <= 0)
      return text;
    const firstNewline = text.indexOf("\n");
    return firstNewline >= 0 ? text.slice(firstNewline + 1) : "";
  } catch {
    return "";
  } finally {
    try {
      fs11.closeSync(fd);
    } catch {
    }
  }
}
function countMatchingLines(text, predicate, sessionStartMs) {
  let count = 0;
  for (const line of text.split("\n")) {
    if (!line.trim())
      continue;
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    if (entry && typeof entry === "object" && (sessionStartMs === void 0 || isAtOrAfterSessionStart(entry, sessionStartMs)) && predicate(entry)) {
      count++;
    }
  }
  return count;
}
function isAtOrAfterSessionStart(entry, sessionStartMs) {
  const timestamp = typeof entry.ts === "string" ? Date.parse(entry.ts) : NaN;
  return Number.isFinite(timestamp) && timestamp >= sessionStartMs;
}
function isStaleCtxEmitFailed(entry) {
  return entry.outcome === "emit_failed" && typeof entry.error === "string" && entry.error.includes("stale after session replacement");
}
function isOpengrepRespawn(entry) {
  if (entry.phase !== "lsp_server_respawn")
    return false;
  const metadata = entry.metadata;
  return metadata?.serverId === "opengrep";
}
function countRecentSmells(root = getGlobalPiLensLogDir(), sessionStartMs) {
  const sinceMs = sessionStartMs ?? Date.now() - SMELLS_ROLLING_WINDOW_MS;
  const busTail = tailReadText(path11.join(root, "bus-events.log"), SMELLS_TAIL_BYTES_PER_FILE);
  const latencyTail = tailReadText(path11.join(root, "latency.log"), SMELLS_TAIL_BYTES_PER_FILE);
  return {
    staleCtxEmitFailed: countMatchingLines(busTail, isStaleCtxEmitFailed, sinceMs),
    opengrepRespawn: countMatchingLines(latencyTail, isOpengrepRespawn, sinceMs)
  };
}
function formatSmellsSessionStartLine(counts) {
  const bits = [];
  for (const key of SMELL_KEYS) {
    if (counts[key] >= SMELLS_THRESHOLDS[key]) {
      bits.push(`${SMELL_LABELS[key]} x${counts[key]}`);
    }
  }
  if (bits.length === 0)
    return null;
  const tailKb = Math.round(SMELLS_TAIL_BYTES_PER_FILE / 1024);
  return `session_start smells (last ${tailKb}KB tail): ${bits.join(", ")} \u2014 run \`npm run logs:smells\` for detail`;
}
var notifiedThisSession = /* @__PURE__ */ new Set();
function resetSmellsSessionState() {
  notifiedThisSession.clear();
}

// dist/clients/situational-tool-telemetry.js
var situationalTools = TOOL_REGISTRY.filter((tool) => "situational" in tool && tool.situational === true).map((tool) => tool.name);
var situationalToolSet = new Set(situationalTools);
var activated = /* @__PURE__ */ new Set();
var called = /* @__PURE__ */ new Set();
var sessionStarted = false;
var emitted = false;
var connectionEnded = false;
var sessionHost = "mcp";
function observe(set, name) {
  if (situationalToolSet.has(name)) {
    set.add(name);
  }
}
function clearObservations() {
  activated.clear();
  called.clear();
}
function observeSituationalToolCall(name) {
  observe(called, name);
}
function resetSituationalToolTelemetry() {
  if (sessionStarted)
    return;
  clearObservations();
  emitted = false;
}
function startSituationalToolTelemetrySession(host) {
  if (host === "mcp") {
    if (connectionEnded)
      return;
    if (sessionStarted)
      return;
    sessionHost = "mcp";
    clearObservations();
    emitted = false;
    sessionStarted = true;
    return;
  }
  if (sessionStarted) {
    sessionHost = "pi";
    return;
  }
  sessionHost = "pi";
  clearObservations();
  emitted = false;
  sessionStarted = true;
}
function endSituationalToolTelemetry() {
  if (!sessionStarted)
    return;
  emitSituationalDeadWeight();
  if (sessionHost === "mcp")
    connectionEnded = true;
  clearObservations();
  emitted = false;
  sessionStarted = false;
}
function emitSituationalDeadWeight() {
  if (emitted)
    return;
  emitted = true;
  const used = /* @__PURE__ */ new Set([...activated, ...called]);
  logExtension({
    subsystem: "tools",
    level: "debug",
    message: "situational tool dead weight",
    metadata: {
      tools: situationalTools.filter((name) => !used.has(name))
    }
  });
}

// dist/clients/deferred-test-targets.js
import * as path12 from "node:path";
var TEST_RUNNER_MAX_PERSISTED_TARGETS = 64;
function deferralEntryKey(entry) {
  return `${entry.sessionId ?? ""}\0${normalizeMapKey(path12.resolve(entry.testFile))}`;
}
function mergeDeferredTargets(existing, incoming) {
  const byKey = /* @__PURE__ */ new Map();
  for (const entry of [...existing, ...incoming]) {
    const key = deferralEntryKey(entry);
    const prior = byKey.get(key);
    if (prior && (prior.attempts ?? 0) >= (entry.attempts ?? 0))
      continue;
    byKey.set(key, entry);
  }
  return [...byKey.values()];
}
function boundDeferredTargets(entries, max, isOwn) {
  const foreign = [];
  const own = [];
  for (const entry of entries) {
    if (isOwn(entry))
      own.push(entry);
    else
      foreign.push(entry);
  }
  const ordered = [...foreign, ...own];
  if (ordered.length <= max)
    return ordered;
  return ordered.slice(-max);
}

// dist/clients/test-runner-delivery.js
var pending = /* @__PURE__ */ new Map();
function resetTestRunnerDelivery() {
  pending.clear();
}

// dist/clients/runtime-session.js
function notifyStartupWarmSkip(args) {
  if (!args.runtime.isCurrentSession(args.sessionGeneration))
    return;
  const reason = args.scan.reason;
  if (reason !== "too-many-source-files" && reason !== "too-many-entries") {
    return;
  }
  const bound = reason === "too-many-entries" ? {
    name: "maxScanEntries",
    value: args.scan.maxScanEntries,
    hint: `set PI_LENS_STARTUP_SCAN_MAX_ENTRIES=<n> to override the ${args.scan.maxScanEntries}-entry cap`
  } : {
    name: "maxProjectFiles",
    value: args.scan.maxProjectFiles,
    hint: `set maxProjectFiles in .pi-lens.json to override the ${args.scan.maxProjectFiles}-source-file cap`
  };
  recordDegradationOnce({
    kind: "startup-warm-skipped",
    subject: args.analysisRoot,
    reason: `${reason}; ${bound.name}=${bound.value}`,
    metadata: { reason, [bound.name]: bound.value }
  });
  args.notify(`\u{1F4E6} Project-size limits disabled background warm scans (heavy scans, TODO scan, LSP pre-warm) (${bound.hint}).`, "warning");
}
async function demandBootstrapDeps(deps, reason) {
  const clients = await deps.bootstrap.request(reason);
  if (!clients)
    return null;
  return { ...deps, ...clients };
}
var HOST_STALL_THRESHOLD_MS = 3e4;
function logHostReadyDelay(deps, cwd) {
  if (!deps.emitHostReadyDelay || deps.sessionStartMonotonicAt === void 0 || deps.extensionLoadedAt === void 0) {
    return;
  }
  const durationMs = Math.max(0, deps.sessionStartMonotonicAt - deps.extensionLoadedAt);
  logLatency({
    type: "phase",
    filePath: cwd,
    phase: "host_ready_delay",
    durationMs,
    metadata: {
      hostStallSuspected: durationMs > HOST_STALL_THRESHOLD_MS,
      sessionStart: "first-process-session",
      reason: deps.sessionReason
    }
  });
}
function resolveSnapshotRoot(cwd) {
  const resolvedCwd = path13.resolve(cwd);
  const nearest = findNearestProjectRoot(resolvedCwd);
  if (!nearest || isAtOrAboveHomeDir(nearest)) {
    return resolvedCwd;
  }
  return nearest;
}
function snapshotSequenceBase(root) {
  const meta = readProjectSnapshotMeta(root);
  if (!meta || meta.version !== PROJECT_SNAPSHOT_VERSION)
    return void 0;
  const index = meta.sequenceIndex;
  if (!index)
    return void 0;
  return {
    projectSeq: index.projectSeq,
    fileSeqByPath: index.fileSeqByPath,
    sinceSeq: meta.seq,
    logEntries: meta.logEntries ?? 0
  };
}
function recordSnapshotSequenceTimeout(args) {
  let reason = "sequence read timed out; no snapshot on disk";
  try {
    const stat = nodeFs.statSync(args.snapshotPath);
    reason = `sequence read timed out; snapshot age=${Math.round(Date.now() - stat.mtimeMs)}ms size=${stat.size}b`;
  } catch {
  }
  incrementDegradationCount({
    kind: "snapshot-sequence-read-timeout",
    subject: args.snapshotRoot,
    reason
  });
}
function retroactivelyHydrateAfterDeferredSequence(args) {
  return (latestSeq) => {
    const published = args.getWarmupOwnSnapshotRead();
    const snapshot = published !== void 0 ? published : loadProjectSnapshotExportsAndRules(args.snapshotRoot);
    if (!snapshot || snapshot.version !== PROJECT_SNAPSHOT_VERSION || snapshot.incomplete || (snapshot.logEntries ?? 0) < (latestSeq.unlockedThrough ?? 0) || snapshot.seq !== latestSeq.projectSeq) {
      return;
    }
    const hydrated = hydrateRuntimeFromProjectSnapshotIfIdle(args.runtime, snapshot);
    if (hydrated) {
      args.dbg(`session_start: deferred sequence read confirmed snapshot freshness \u2014 hydrating cachedExports/projectRulesScan late (seq=${snapshot.seq})`);
    } else {
      args.dbg(`session_start: deferred sequence read confirmed snapshot freshness (seq=${snapshot.seq}), but the runtime already has live state (warmup or another task got there first) \u2014 skipping late hydration to avoid clobbering it`);
    }
  };
}
function loadSnapshotBodyUnlessStale(args) {
  const meta = readProjectSnapshotMeta(args.root);
  if (meta && isProjectSnapshotMetaStale(meta, args.currentProjectSeq, args.unlockedThrough)) {
    args.dbg(`project_snapshot: meta gate stale (metaSeq=${meta.seq} metaVersion=${meta.version} current=${args.currentProjectSeq}) \u2014 skipping body parse`);
    return { snapshot: null, skippedStale: true };
  }
  return {
    snapshot: loadProjectSnapshot(args.root),
    skippedStale: false
  };
}
function describeSnapshotMiss(snapshot, currentProjectSeq, args) {
  if (args.skippedStale)
    return "stale-meta-gate";
  if (!snapshot)
    return args.bodyPresent ? "invalid-body" : "missing";
  if (snapshot.seq !== currentProjectSeq) {
    return `stale(seq=${snapshot.seq}, current=${currentProjectSeq})`;
  }
  if ((snapshot.logEntries ?? 0) < args.unlockedThrough) {
    return `unlocked-entry-after-fold(folded=${snapshot.logEntries ?? 0}, unlocked=${args.unlockedThrough})`;
  }
  return "incompatible";
}
function logProjectSnapshotProbe(args) {
  args.dbg(`project_snapshot: probe root=${args.root} path=${getProjectSnapshotPath(args.root)} currentSeq=${args.currentProjectSeq}`);
  if (isProjectSnapshotFresh(args.snapshot, args.currentProjectSeq, args.unlockedThrough)) {
    args.dbg(`project_snapshot: loaded seq=${args.snapshot.seq} exports=${args.snapshot.cachedExports.length} files=${Object.keys(args.snapshot.files ?? {}).length} reverseDeps=${Object.keys(args.snapshot.reverseDeps ?? {}).length} startupScan=${Boolean(args.snapshot.startupScan)} languageProfile=${Boolean(args.snapshot.languageProfile)}`);
  } else {
    args.dbg(`project_snapshot: miss reason=${args.missReason}`);
  }
}
function resolveStartupMode(projectConfig, globalConfig) {
  const envMode = (process.env.PI_LENS_STARTUP_MODE ?? "").trim().toLowerCase();
  if (envMode === "full" || envMode === "minimal" || envMode === "quick") {
    return envMode;
  }
  const configMode = projectConfig?.startup?.mode ?? globalConfig?.startup?.mode;
  if (configMode)
    return configMode;
  if (isPrintMode()) {
    return "quick";
  }
  return "full";
}
function sequenceReadBudgetMs() {
  const raw = Number(process.env.PI_LENS_SEQUENCE_READ_BUDGET_MS ?? 250);
  return Number.isFinite(raw) && raw > 0 ? raw : 250;
}
var UNKNOWN_PROJECT_SEQ = -1;
async function readSequenceWithBudget(args) {
  const { snapshotRoot, base, cwd, runtime, sessionGeneration, dbg, onDeferredSequenceResolved } = args;
  const readPromise = readLatestProjectSequenceAsync(snapshotRoot, base);
  let timeoutHandle;
  const timeoutPromise = new Promise((resolve32) => {
    timeoutHandle = setTimeout(() => resolve32({ timedOut: true }), sequenceReadBudgetMs());
    timeoutHandle.unref();
  });
  const raced = await Promise.race([
    readPromise.then((latestSeq) => ({ timedOut: false, latestSeq })),
    timeoutPromise
  ]);
  if (timeoutHandle)
    clearTimeout(timeoutHandle);
  if (!raced.timedOut) {
    return { latestSeq: raced.latestSeq, timedOut: false };
  }
  dbg(`session_start: sequence read exceeded ${sequenceReadBudgetMs()}ms budget \u2014 falling back to cold-start sequence`);
  if (!isPrintMode()) {
    readPromise.then((latestSeq) => {
      if (!runtime.isCurrentSession(sessionGeneration))
        return;
      if (runtime.projectSeq > 0) {
        const mergeStartedAt = Date.now();
        runtime.mergeProjectSequence?.(latestSeq.projectSeq, latestSeq.fileSeqByPath, latestSeq.logEntries);
        logLatency({
          type: "phase",
          phase: "session_start_sequence_read_deferred_reseed",
          filePath: cwd,
          startedAt: new Date(mergeStartedAt).toISOString(),
          durationMs: Date.now() - mergeStartedAt,
          metadata: {
            entries: latestSeq.fileSeqByPath.size,
            deferred: true,
            merged: true
          }
        });
        dbg(`session_start: deferred sequence read completed after an in-window edit \u2014 merged projectSeq=${latestSeq.projectSeq} into the advanced session (now ${runtime.projectSeq})`);
        return;
      }
      const reseedStartedAt = Date.now();
      runtime.seedProjectSequence?.(latestSeq.projectSeq, latestSeq.fileSeqByPath, latestSeq.logEntries);
      logLatency({
        type: "phase",
        phase: "session_start_sequence_read_deferred_reseed",
        filePath: cwd,
        startedAt: new Date(reseedStartedAt).toISOString(),
        durationMs: Date.now() - reseedStartedAt,
        metadata: { entries: latestSeq.fileSeqByPath.size, deferred: true }
      });
      dbg(`session_start: deferred sequence read completed \u2014 reseeded projectSeq=${latestSeq.projectSeq} fileSeqEntries=${latestSeq.fileSeqByPath.size}`);
      onDeferredSequenceResolved?.(latestSeq);
    }).catch((err) => {
      dbg(`session_start: deferred sequence read failed: ${err}`);
    });
  }
  return {
    latestSeq: { projectSeq: 0, fileSeqByPath: /* @__PURE__ */ new Map() },
    timedOut: true
  };
}
async function igniteWarmFiles(cwd, warmFiles, runtime, sessionGeneration, dbg) {
  try {
    dbg(`session_start lsp-warm: ${warmFiles.length} warm file(s) configured`);
    await initLSPConfig(cwd);
    if (!runtime.isCurrentSession(sessionGeneration))
      return;
    const lspService = (await loadLspService()).getLSPService();
    const total = warmFiles.length;
    let loaded = 0;
    let errors = 0;
    for (const relPath of warmFiles) {
      if (!runtime.isCurrentSession(sessionGeneration))
        return;
      const filePath = path13.isAbsolute(relPath) ? relPath : path13.resolve(cwd, relPath);
      if (!nodeFs.existsSync(filePath)) {
        dbg(`session_start lsp-warm: not found: ${relPath}`);
        errors++;
        continue;
      }
      try {
        const content = nodeFs.readFileSync(filePath, "utf-8");
        await lspService.touchFile(filePath, content, {
          diagnostics: "none",
          source: "startup-warm",
          clientScope: "primary",
          maxClientWaitMs: 2e3
        });
        loaded++;
      } catch (err) {
        dbg(`session_start lsp-warm: error ${relPath}: ${err}`);
        errors++;
      }
    }
    dbg(`session_start lsp-warm: ${loaded}/${total} opened (${errors} err)`);
  } catch (err) {
    dbg(`session_start lsp-warm: config/init error: ${err}`);
  }
}
async function igniteDominantLanguageWarm(cwd, runtime, sessionGeneration, dbg) {
  try {
    await initLSPConfig(cwd);
    if (!runtime.isCurrentSession(sessionGeneration))
      return;
    const lspService = (await loadLspService()).getLSPService();
    const { collectSourceFilesAsync } = await import("../chunk-4W4VLAPJ.js");
    const { CODE_KINDS, detectFileKind: detectFileKind2 } = await import("../chunk-FLKWCIZH.js");
    const files = await collectSourceFilesAsync(cwd, {
      inspectGeneratedHeaders: false
    });
    if (!runtime.isCurrentSession(sessionGeneration))
      return;
    const counts = /* @__PURE__ */ new Map();
    for (const f of files) {
      const kind = detectFileKind2(f);
      if (kind)
        counts.set(kind, (counts.get(kind) ?? 0) + 1);
    }
    if (counts.size === 0) {
      dbg("session_start lsp-warm: no detected languages to auto-warm");
      return;
    }
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const warmOrder = [
      ...ranked.filter(([kind]) => CODE_KINDS.has(kind)),
      ...ranked.filter(([kind]) => !CODE_KINDS.has(kind))
    ];
    for (const [kind] of warmOrder) {
      const sample = files.find((f) => detectFileKind2(f) === kind && lspService.supportsLSP(f));
      if (!sample)
        continue;
      const content = await nodeFs.promises.readFile(sample, "utf-8");
      if (!runtime.isCurrentSession(sessionGeneration))
        return;
      await lspService.touchFile(sample, content, {
        diagnostics: "none",
        source: "startup-warm-dominant",
        clientScope: "primary",
        maxClientWaitMs: 2e3
      });
      dbg(`session_start lsp-warm: dominant=${kind} via ${path13.basename(sample)}`);
      return;
    }
    dbg("session_start lsp-warm: no dominant-language LSP file found to warm");
  } catch (err) {
    dbg(`session_start lsp-warm: dominant warm error: ${err}`);
  }
}
function firePreinstallDefaults(ensureTool, dbg, startupDefaults) {
  for (const tool of startupDefaults) {
    const startedAt = Date.now();
    dbg(`session_start preinstall ${tool}: start`);
    ensureTool(tool).then((toolPath) => {
      if (toolPath) {
        dbg(`session_start: ${tool} ready at ${toolPath}`);
        dbg(`session_start preinstall ${tool}: success (${Date.now() - startedAt}ms)`);
      } else {
        dbg(`session_start: ${tool} installation unavailable`);
        dbg(`session_start preinstall ${tool}: unavailable (${Date.now() - startedAt}ms)`);
      }
    }).catch((err) => {
      dbg(`session_start: ${tool} pre-install error: ${err}`);
      dbg(`session_start preinstall ${tool}: error (${Date.now() - startedAt}ms)`);
    });
  }
}
var MANAGED_TOOL_REFRESH_DELAY_MS = 3e4;
function scheduleManagedToolRefresh(dbg) {
  const delayMs = Number(process.env.PI_LENS_TOOL_REFRESH_DELAY_MS ?? MANAGED_TOOL_REFRESH_DELAY_MS);
  const timer = setTimeout(() => {
    void (async () => {
      try {
        const refresh = await import("../chunk-5UCAH366.js");
        const outcome = await refresh.runManagedToolRefresh();
        if (outcome.skipped) {
          dbg(`session_start tool-refresh: skipped (${outcome.skipped})`);
          return;
        }
        for (const result of outcome.refreshed) {
          dbg(`session_start tool-refresh: ${result.toolId} ${result.ok ? "ok" : "failed"}${result.changed ? ` ${result.previousVersion ?? "unknown"} \u2192 ${result.currentVersion}` : " (unchanged)"}`);
        }
      } catch (err) {
        dbg(`session_start tool-refresh: error ${err}`);
      }
    })();
  }, Number.isFinite(delayMs) ? delayMs : MANAGED_TOOL_REFRESH_DELAY_MS);
  timer.unref?.();
}
async function probePrettierInstall(ensureTool, dbg, analysisRoot) {
  const pkgPath = path13.join(analysisRoot, "package.json");
  try {
    const raw = await nodeFs.promises.readFile(pkgPath, "utf-8");
    const pkg = JSON.parse(raw);
    const usesPrettier = !!pkg.devDependencies?.prettier || !!pkg.dependencies?.prettier || pkg.prettier !== void 0;
    if (usesPrettier) {
      dbg("session_start: project uses prettier, ensuring install...");
      ensureTool("prettier").then((p) => {
        if (p)
          dbg(`session_start: prettier ready at ${p}`);
        else
          dbg("session_start: prettier install failed silently");
      }).catch((err) => dbg(`session_start: prettier install error: ${err}`));
    }
  } catch {
  }
}
function scanOneTodoFile(scanner, filePath, items) {
  if (typeof scanner.scanFile !== "function")
    return;
  try {
    const result = scanner.scanFile(filePath);
    if (Array.isArray(result))
      items.push(...result);
  } catch {
  }
}
async function collectTodoBaselineItems(scanner, analysisRoot, stillCurrent) {
  const items = [];
  try {
    const { getSourceFilesAsync } = await import("../chunk-IZSHAIJ7.js");
    const files = await getSourceFilesAsync(analysisRoot, true);
    if (!stillCurrent())
      return items;
    const deadline = createDeadline(8);
    for (const file of files) {
      if (!stillCurrent())
        return items;
      scanOneTodoFile(scanner, file, items);
      await yieldIfOverBudget(deadline);
    }
  } catch {
    const todoResult = scanner.scanDirectory(analysisRoot);
    items.push(...todoResult.items);
  }
  return items;
}
async function buildOrRefreshWordIndex(args) {
  const { runtime, sessionGeneration, analysisRoot, snapshotRoot, dbg } = args;
  if (!runtime.isCurrentSession(sessionGeneration))
    return;
  const startMs = Date.now();
  let rebuildPreflightFiles;
  const latestSeq = readLatestProjectSequence(snapshotRoot, snapshotSequenceBase(snapshotRoot));
  const effectiveSeq = runtime.projectSeq ?? latestSeq.projectSeq;
  const snapshotLoadStartMs = Date.now();
  const snapshot = loadProjectSnapshot(snapshotRoot);
  const snapshotLoadMs = Date.now() - snapshotLoadStartMs;
  if (snapshot?.wordIndex) {
    const { deserializeWordIndex, refreshWordIndexIncrementally, countWordIndexPostingEntries: countWordIndexPostingEntries2, estimateWordIndexResidentBytes: estimateWordIndexResidentBytes2 } = await import("../chunk-WU567RSC.js");
    const deserializeStartMs = Date.now();
    const index = deserializeWordIndex(snapshot.wordIndex);
    const deserializeMs = Date.now() - deserializeStartMs;
    if (index) {
      try {
        const result = await refreshWordIndexIncrementally(index, analysisRoot, () => runtime.isCurrentSession(sessionGeneration));
        if (!runtime.isCurrentSession(sessionGeneration))
          return;
        if (result.mode === "full-required") {
          rebuildPreflightFiles = result.preflightFiles;
          dbg(`session_start word-index: incremental preflight selected full rebuild (${result.reason})`);
          logWordIndex({
            phase: "incremental_fallback",
            cwd: snapshotRoot,
            trigger: "session_start",
            reason: result.reason,
            phaseDurationsMs: {
              snapshotLoadMs,
              deserializeMs,
              ...result.timings
            }
          });
        } else {
          runtime.wordIndex = index;
          let snapshotSaveSyncMs = 0;
          if (!isProjectSnapshotFresh(snapshot, effectiveSeq, latestSeq.unlockedThrough) || result.refreshed > 0 || result.dropped > 0 || snapshot.wordIndex.truncated !== index.truncated) {
            const serializeSaveEnqueueStartMs = Date.now();
            saveRuntimeProjectSnapshot({ cwd: snapshotRoot, runtime, dbg });
            snapshotSaveSyncMs = Date.now() - serializeSaveEnqueueStartMs;
          }
          const phases = `snapshot-load=${snapshotLoadMs}ms, deserialize=${deserializeMs}ms, source-walk=${result.timings.sourceWalkMs}ms, stat-walk=${result.timings.statWalkMs}ms, refresh-reads=${result.timings.refreshReadsMs}ms, snapshot-save-sync=${snapshotSaveSyncMs}ms`;
          dbg(`session_start word-index: incremental (seq=${effectiveSeq}, refreshed=${result.refreshed}, dropped=${result.dropped}, skipped=${result.skipped}, reused=${result.reused}, ${Date.now() - startMs}ms, phases: ${phases})`);
          logWordIndex({
            phase: "incremental_refresh",
            cwd: snapshotRoot,
            trigger: "session_start",
            durationMs: Date.now() - startMs,
            indexedFileCount: index.docCount,
            tokens: index.postings.size,
            postingEntries: countWordIndexPostingEntries2(index),
            residentBytes: estimateWordIndexResidentBytes2(index),
            truncated: index.truncated,
            phaseDurationsMs: {
              snapshotLoadMs,
              deserializeMs,
              ...result.timings,
              snapshotSaveSyncMs
            },
            refreshed: result.refreshed,
            dropped: result.dropped,
            skipped: result.skipped,
            reused: result.reused
          });
          return result;
        }
      } catch (err) {
        if (!runtime.isCurrentSession(sessionGeneration)) {
          dbg("session_start word-index: incremental refresh superseded");
          return;
        }
        dbg(`session_start word-index: incremental refresh failed; falling back to full rebuild (${err})`);
        logWordIndex({
          phase: "incremental_fallback",
          cwd: snapshotRoot,
          trigger: "session_start",
          reason: err instanceof Error ? err.message : String(err),
          phaseDurationsMs: { snapshotLoadMs, deserializeMs }
        });
      }
    }
  }
  const { buildWordIndexAsync, collectWordIndexDocs, countWordIndexPostingEntries, estimateWordIndexResidentBytes } = await import("../chunk-WU567RSC.js");
  const docs = await collectWordIndexDocs(analysisRoot, () => runtime.isCurrentSession(sessionGeneration), rebuildPreflightFiles);
  if (!runtime.isCurrentSession(sessionGeneration))
    return;
  let rebuiltIndex;
  try {
    rebuiltIndex = await buildWordIndexAsync(docs, () => runtime.isCurrentSession(sessionGeneration));
  } catch (err) {
    if (!runtime.isCurrentSession(sessionGeneration)) {
      dbg("session_start word-index: rebuild superseded");
      return;
    }
    throw err;
  }
  if (!runtime.isCurrentSession(sessionGeneration))
    return;
  runtime.wordIndex = rebuiltIndex;
  saveRuntimeProjectSnapshot({ cwd: snapshotRoot, runtime, dbg });
  dbg(`session_start word-index: rebuilt (absent/stale, seq=${effectiveSeq}) ${runtime.wordIndex.docCount} files, ${runtime.wordIndex.postings.size} tokens (${Date.now() - startMs}ms)`);
  logWordIndex({
    phase: "full_rebuild",
    cwd: snapshotRoot,
    trigger: "session_start",
    durationMs: Date.now() - startMs,
    indexedFileCount: runtime.wordIndex.docCount,
    tokens: runtime.wordIndex.postings.size,
    postingEntries: countWordIndexPostingEntries(runtime.wordIndex),
    residentBytes: estimateWordIndexResidentBytes(runtime.wordIndex),
    truncated: runtime.wordIndex.truncated,
    skipped: docs.skipped
  });
  return {
    mode: "full",
    refreshed: runtime.wordIndex.docCount,
    dropped: 0,
    skipped: docs.skipped,
    reused: 0
  };
}
function scheduleStartupScans(deps, runtime, sessionGeneration, analysisRoot, snapshotRoot, languageProfile, dbg) {
  void (async () => {
    const resolved = await demandBootstrapDeps(deps, "session-start-scans");
    if (!resolved) {
      dbg("session_start scans: analyzer bootstrap unavailable \u2014 skipped");
      return;
    }
    scheduleStartupScansWithClients(resolved, runtime, sessionGeneration, analysisRoot, snapshotRoot, languageProfile, dbg);
  })();
}
function scheduleStartupScansWithClients(deps, runtime, sessionGeneration, analysisRoot, snapshotRoot, languageProfile, dbg) {
  const { todoScanner, cacheManager: cacheManager2, knipClient, jscpdClient, deadCodeClients, govulncheckClient, gitleaksClient, trivyClient, opengrepClient, astGrepClient: astGrepClient2, depChecker } = deps;
  const analyzerEnabled = (flag) => !deps.getFlag(flag);
  if (!analyzerEnabled("no-complexity")) {
    dbg("session_start complexity: skipped (disabled by config)");
    recordDegradationOnce({
      kind: "startup-analyzer-disabled",
      subject: "complexity",
      reason: "skipped (disabled by config)"
    });
  }
  const taskDeferMsByName = {
    "call-graph": 5e3,
    "codebase-model": 5200,
    "ast-grep exports": 5400,
    "project index": 5400
  };
  const runTask = (name, task) => {
    const queuedAt = Date.now();
    dbg(`session_start task ${name}: scheduled`);
    runtime.markStartupScanInFlight(name, sessionGeneration);
    const completion = new Promise((resolve32) => {
      const fire = () => {
        const startedAt = Date.now();
        dbg(`session_start task ${name}: start queuedMs=${startedAt - queuedAt}`);
        void task().then(() => {
          dbg(`session_start task ${name}: success runMs=${Date.now() - startedAt} queuedMs=${startedAt - queuedAt}`);
        }).catch((err) => {
          dbg(`session_start: ${name} background scan failed: ${err}`);
          dbg(`session_start task ${name}: failed runMs=${Date.now() - startedAt} queuedMs=${startedAt - queuedAt}`);
        }).finally(() => {
          runtime.clearStartupScanInFlight(name, sessionGeneration);
          dbg(`session_start task ${name}: end`);
          resolve32();
        });
      };
      const delay = taskDeferMsByName[name] ?? 0;
      if (delay > 0) {
        setTimeout(fire, delay).unref?.();
      } else {
        setImmediate(fire);
      }
    });
    return completion;
  };
  const canRunJsTsHeavyScans = canRunStartupHeavyScans(languageProfile, "jsts");
  const scanNames = ["todo", "dead-code"];
  if (canRunJsTsHeavyScans) {
    scanNames.push("knip", "jscpd", "ast-grep exports", "project index");
  }
  dbg(`session_start: launching background scans (${scanNames.join(", ")})`);
  void runTask("todo", async () => {
    if (!runtime.isCurrentSession(sessionGeneration))
      return;
    const items = await collectTodoBaselineItems(todoScanner, analysisRoot, () => runtime.isCurrentSession(sessionGeneration));
    if (!runtime.isCurrentSession(sessionGeneration))
      return;
    dbg(`session_start TODO scan: ${items.length} items (baseline stored)`);
    cacheManager2.writeCache("todo-baseline", { items }, analysisRoot);
  });
  if (!canRunJsTsHeavyScans) {
    dbg("session_start: skipping JS/TS startup scans (requires JS/TS language + project config)");
    return;
  }
  const isSubagent = isSubagentSession();
  const skipHeavyweightScans = isSlowFs(analysisRoot) || isSubagent;
  const runHeavyweightTask = (name, task) => {
    const flag = `no-${name}`;
    if (name !== "opengrep" && name !== "trivy" && !analyzerEnabled(flag)) {
      dbg(`session_start ${name}: skipped (disabled by config)`);
      recordDegradationOnce({
        kind: "startup-analyzer-disabled",
        subject: name,
        reason: "skipped (disabled by config)"
      });
      return;
    }
    if (skipHeavyweightScans)
      return;
    void runTask(name, task);
  };
  if (skipHeavyweightScans) {
    dbg(`session_start: skipping knip/jscpd/madge/dead-code/govulncheck/gitleaks/trivy/opengrep (${isSubagent ? "subagent" : "slow-fs"})`);
    deps.notify(`\u23ED\uFE0F Skipped background code-quality scans (knip/jscpd/madge/dead-code/govulncheck/gitleaks/trivy/opengrep): ${isSubagent ? subagentLightModeNotice() : slowFsDegradationNotice()}`, "info");
  }
  runHeavyweightTask("knip", async () => {
    if (!runtime.isCurrentSession(sessionGeneration))
      return;
    const cached = cacheManager2.readCache("knip", analysisRoot);
    if (cached) {
      if (!runtime.isCurrentSession(sessionGeneration))
        return;
      dbg(`session_start Knip: cache hit (${Math.round((Date.now() - new Date(cached.meta.timestamp).getTime()) / 1e3)}s ago)`);
    } else {
      const startMs = Date.now();
      const knipResult = await knipClient.analyze(analysisRoot, getKnipIgnorePatterns(), { projectSeq: runtime.projectSeq });
      if (!runtime.isCurrentSession(sessionGeneration))
        return;
      if (knipResult.success) {
        cacheManager2.writeCache("knip", knipResult, analysisRoot, {
          scanDurationMs: Date.now() - startMs
        });
      }
      dbg(`session_start Knip scan done (${Date.now() - startMs}ms)`);
    }
  });
  runHeavyweightTask("jscpd", async () => {
    if (await jscpdClient.ensureAvailable()) {
      if (!runtime.isCurrentSession(sessionGeneration))
        return;
      const isTsProject = nodeFs.existsSync(path13.join(analysisRoot, "tsconfig.json"));
      const scannerKey = isTsProject ? "jscpd-ts" : "jscpd";
      const cached = cacheManager2.readCache(scannerKey, analysisRoot);
      if (cached) {
        if (!runtime.isCurrentSession(sessionGeneration))
          return;
        dbg(`session_start jscpd: cache hit (${scannerKey})`);
      } else {
        const startMs = Date.now();
        const jscpdResult = await jscpdClient.scan(analysisRoot, void 0, void 0, isTsProject);
        if (!runtime.isCurrentSession(sessionGeneration))
          return;
        if (jscpdResult.success) {
          cacheManager2.writeCache(scannerKey, jscpdResult, analysisRoot, {
            scanDurationMs: Date.now() - startMs
          });
        }
        dbg(`session_start jscpd scan done (${Date.now() - startMs}ms, isTsProject=${isTsProject})`);
      }
    } else {
      if (!runtime.isCurrentSession(sessionGeneration))
        return;
      dbg("session_start jscpd: not available");
    }
  });
  runHeavyweightTask("dead-code", async () => {
    const applicable = deadCodeClients.filter((c) => c.detect(analysisRoot));
    if (applicable.length === 0)
      return;
    await Promise.all(applicable.map(async (client) => {
      if (!runtime.isCurrentSession(sessionGeneration))
        return void 0;
      const cacheKey = `dead-code-${client.id}`;
      const cached = cacheManager2.readCache(cacheKey, analysisRoot);
      if (cached) {
        dbg(`session_start dead-code(${client.id}): cache hit`);
        return void 0;
      }
      const startMs = Date.now();
      const result = await client.analyze(analysisRoot);
      if (!runtime.isCurrentSession(sessionGeneration))
        return void 0;
      if (result.success) {
        cacheManager2.writeCache(cacheKey, result, analysisRoot, {
          scanDurationMs: Date.now() - startMs
        });
      }
      logDeadCodeScan({
        language: client.language,
        success: result.success,
        cached: false,
        unusedExports: result.unusedExports.length,
        unusedFiles: result.unusedFiles.length,
        unusedDeps: result.unusedDeps.length,
        unlistedDeps: result.unlistedDeps.length,
        durationMs: result.durationMs ?? Date.now() - startMs,
        ...!result.success && { reason: result.summary }
      });
      dbg(`session_start dead-code(${client.id}) done (${Date.now() - startMs}ms, ${deadCodeIssueCount(result)} issues)`);
    }));
  });
  runHeavyweightTask("govulncheck", async () => {
    if (!GovulncheckClient.hasGoModule(analysisRoot)) {
      dbg("session_start govulncheck: no go.mod \u2014 skipped");
      return;
    }
    if (!await govulncheckClient.ensureAvailable()) {
      if (!runtime.isCurrentSession(sessionGeneration))
        return;
      dbg("session_start govulncheck: not installed (go install golang.org/x/vuln/cmd/govulncheck@latest)");
      return;
    }
    if (!runtime.isCurrentSession(sessionGeneration))
      return;
    const cached = cacheManager2.readCache("govulncheck", analysisRoot);
    if (cached) {
      if (!runtime.isCurrentSession(sessionGeneration))
        return;
      dbg(`session_start govulncheck: cache hit (${cached.data.findings.length} findings)`);
      return;
    }
    const startMs = Date.now();
    const result = await govulncheckClient.analyze(analysisRoot);
    if (!runtime.isCurrentSession(sessionGeneration))
      return;
    if (result.success) {
      cacheManager2.writeCache("govulncheck", result, analysisRoot, {
        scanDurationMs: Date.now() - startMs
      });
    }
    dbg(`session_start govulncheck: ${result.findings.length} reachable findings (${Date.now() - startMs}ms)`);
  });
  runHeavyweightTask("gitleaks", async () => {
    if (!GitleaksClient.hasGitleaksSignal(analysisRoot)) {
      dbg("session_start gitleaks: no opt-in signal \u2014 skipped");
      return;
    }
    if (!await gitleaksClient.ensureAvailable()) {
      if (!runtime.isCurrentSession(sessionGeneration))
        return;
      dbg("session_start gitleaks: not available (install failed?)");
      return;
    }
    if (!runtime.isCurrentSession(sessionGeneration))
      return;
    const cached = cacheManager2.readCache("gitleaks", analysisRoot);
    if (cached) {
      if (!runtime.isCurrentSession(sessionGeneration))
        return;
      dbg(`session_start gitleaks: cache hit (${cached.data.findings.length} findings)`);
      return;
    }
    const startMs = Date.now();
    const result = await gitleaksClient.scan(analysisRoot);
    if (!runtime.isCurrentSession(sessionGeneration))
      return;
    if (result.success) {
      cacheManager2.writeCache("gitleaks", result, analysisRoot, {
        scanDurationMs: Date.now() - startMs
      });
    }
    dbg(`session_start gitleaks: ${result.findings.length} findings (${Date.now() - startMs}ms)`);
  });
  runHeavyweightTask("opengrep", async () => {
    if (!await opengrepClient.ensureAvailable()) {
      if (!runtime.isCurrentSession(sessionGeneration))
        return;
      dbg("session_start opengrep: not available (install failed?)");
      return;
    }
    if (!runtime.isCurrentSession(sessionGeneration))
      return;
    const cached = cacheManager2.readCache("opengrep", analysisRoot);
    if (cached) {
      if (!runtime.isCurrentSession(sessionGeneration))
        return;
      dbg(`session_start opengrep: cache hit (${cached.data.findings.length} findings)`);
      return;
    }
    const startMs = Date.now();
    const result = await opengrepClient.scan(analysisRoot);
    if (!runtime.isCurrentSession(sessionGeneration))
      return;
    if (result.success) {
      cacheManager2.writeCache("opengrep", result, analysisRoot, {
        scanDurationMs: Date.now() - startMs
      });
    }
    dbg(`session_start opengrep: ${result.findings.length} findings (${Date.now() - startMs}ms)`);
  });
  runHeavyweightTask("madge", async () => {
    if (!await depChecker.ensureAvailable()) {
      if (!runtime.isCurrentSession(sessionGeneration))
        return;
      dbg("session_start madge: not available");
      return;
    }
    if (!runtime.isCurrentSession(sessionGeneration))
      return;
    const cached = cacheManager2.readCache("madge", analysisRoot);
    if (cached) {
      dbg(`session_start madge: cache hit (${cached.data.circular.length} cycles)`);
      return;
    }
    const startMs = Date.now();
    const result = await depChecker.scanProject(analysisRoot);
    if (!runtime.isCurrentSession(sessionGeneration))
      return;
    cacheManager2.writeCache("madge", result, analysisRoot, {
      scanDurationMs: Date.now() - startMs
    });
    dbg(`session_start madge: ${result.circular.length} circular dependency chain(s) (${Date.now() - startMs}ms)`);
  });
  runHeavyweightTask("trivy", async () => {
    if (!TrivyClient.shouldScan(analysisRoot)) {
      dbg("session_start trivy: not enabled / no dependency manifest \u2014 skipped");
      return;
    }
    if (!await trivyClient.ensureAvailable()) {
      if (!runtime.isCurrentSession(sessionGeneration))
        return;
      dbg("session_start trivy: not available (install failed?)");
      return;
    }
    if (!runtime.isCurrentSession(sessionGeneration))
      return;
    const cached = cacheManager2.readCache("trivy", analysisRoot);
    if (cached) {
      if (!runtime.isCurrentSession(sessionGeneration))
        return;
      dbg(`session_start trivy: cache hit (${cached.data.findings.length} findings)`);
      return;
    }
    const startMs = Date.now();
    const result = await trivyClient.scan(analysisRoot);
    if (!runtime.isCurrentSession(sessionGeneration))
      return;
    if (result.success) {
      cacheManager2.writeCache("trivy", result, analysisRoot, {
        scanDurationMs: Date.now() - startMs
      });
    }
    dbg(`session_start trivy: ${result.findings.length} CVE findings (${Date.now() - startMs}ms)`);
  });
  let callGraphIdentity;
  const callGraphTask = runTask("call-graph", async () => {
    const { FactStore: FactStore2 } = await import("../chunk-QGQ5CCCG.js");
    const { buildOrUpdateGraph, extractSymbolsAndRefsFromGraph, getReviewGraphCacheIdentity } = await import("../chunk-2VUQMUMT.js");
    const { buildCallGraph, saveCallGraph, loadCallGraph: loadCallGraph2 } = await import("../chunk-BKE7E7TC.js");
    if (!runtime.isCurrentSession(sessionGeneration))
      return;
    const startMs = Date.now();
    const sessionFacts = new FactStore2("runtime-session-call-graph");
    const graph = await buildOrUpdateGraph(analysisRoot, [], sessionFacts);
    if (!runtime.isCurrentSession(sessionGeneration))
      return;
    const identity = getReviewGraphCacheIdentity(analysisRoot, graph);
    if (!identity) {
      dbg("session_start call-graph: canonical review-graph identity unavailable");
      return;
    }
    callGraphIdentity = {
      reviewGraphVersion: identity.version,
      reviewGraphSignature: identity.signature
    };
    const cached = loadCallGraph2(snapshotRoot, {
      reviewGraphVersion: identity.version,
      reviewGraphSignature: identity.signature
    });
    if (cached) {
      runtime.callGraph = cached.graph;
      dbg(`session_start call-graph: loaded from cache (${cached.graph.edges.length} edges, ${cached.graph.callers.size} callee entries, ${Date.now() - startMs}ms)`);
      return;
    }
    const { allSymbols, allRefs, coverage } = extractSymbolsAndRefsFromGraph(graph);
    const callGraph = buildCallGraph(allSymbols, allRefs, coverage);
    runtime.callGraph = callGraph;
    saveCallGraph(snapshotRoot, callGraph, {
      reviewGraphVersion: identity.version,
      reviewGraphSignature: identity.signature
    });
    dbg(`session_start call-graph: built ${callGraph.edges.length} edges, ${callGraph.callers.size} callee entries (${Date.now() - startMs}ms)`);
  });
  void runTask("codebase-model", async () => {
    await callGraphTask;
    if (!runtime.isCurrentSession(sessionGeneration))
      return;
    if (!runtime.callGraph)
      return;
    const { buildCodebaseModel, saveCodebaseModel, DEFAULT_CODEBASE_MODEL_TOKEN_BUDGET } = await import("../chunk-TYM6OUIT.js");
    if (!callGraphIdentity)
      return;
    const model = buildCodebaseModel(runtime.callGraph, analysisRoot, DEFAULT_CODEBASE_MODEL_TOKEN_BUDGET, callGraphIdentity);
    saveCodebaseModel(snapshotRoot, model);
    const top3 = model.entries.slice(0, 3).map((e) => e.name).join(", ");
    dbg(`session_start codebase-model: ${model.entries.length} entries, ${model.totalTokens} tokens, top symbols: ${top3 || "(none)"}`);
  });
  void runTask("ast-grep-exports", async () => {
    if (await astGrepClient2.ensureAvailable()) {
      if (!runtime.isCurrentSession(sessionGeneration))
        return;
      const exports = await astGrepClient2.scanExports(analysisRoot, "typescript");
      if (!runtime.isCurrentSession(sessionGeneration))
        return;
      dbg(`session_start exports scan: ${exports.size} functions found`);
      for (const [name, file] of exports) {
        runtime.cachedExports.set(name, file);
      }
      saveRuntimeProjectSnapshot({ cwd: snapshotRoot, runtime, dbg });
    }
  });
  void runTask("word-index", async () => {
    await buildOrRefreshWordIndex({
      runtime,
      sessionGeneration,
      analysisRoot,
      snapshotRoot,
      dbg
    });
  });
}
function scheduleDeferredToolProbes(deps, languageProfile, startupDefaults, startupScansWillRun, dbg) {
  void (async () => {
    const resolved = await demandBootstrapDeps(deps, "session-start-tool-probes");
    if (!resolved) {
      dbg("session_start tools: analyzer bootstrap unavailable \u2014 no probes");
      return;
    }
    scheduleDeferredToolProbesWithClients(resolved, languageProfile, startupDefaults, startupScansWillRun, dbg);
  })();
}
function scheduleDeferredToolProbesWithClients(deps, languageProfile, startupDefaults, startupScansWillRun, dbg) {
  const { biomeClient, ruffClient, depChecker } = deps;
  const defaultTools = new Set(startupDefaults);
  const probes = [];
  if (languageProfile.present.jsts && !defaultTools.has("biome")) {
    probes.push(["biome", () => biomeClient.ensureAvailable()]);
  }
  if (languageProfile.present.python && !defaultTools.has("ruff")) {
    probes.push(["ruff", () => ruffClient.ensureAvailable()]);
  }
  if (startupScansWillRun) {
    probes.push(["madge", () => depChecker.ensureAvailable()]);
  }
  if (probes.length === 0) {
    dbg("session_start tools: no deferred availability probes needed");
    return;
  }
  void (async () => {
    const warmStart = Date.now();
    const results = await Promise.all(probes.map(async ([name, run]) => {
      try {
        return [name, await run()];
      } catch (err) {
        dbg(`session_start: ${name} availability check failed: ${err}`);
        return [name, false];
      }
    }));
    const summary = results.map(([name, ready]) => `${name}=${ready}`).join(" ");
    dbg(`session_start tools (deferred probes complete, ${Date.now() - warmStart}ms): ${summary}`);
  })();
}
function readSubstituteGuidance(isEnabled) {
  const units = [];
  if (isEnabled("symbol_search")) {
    units.push({ name: "symbol_search", role: "ranked identifier search" });
  }
  if (isEnabled("module_report")) {
    units.push({
      name: "module_report",
      role: "navigable outline/callback handles"
    });
  }
  const readSymbol2 = isEnabled("read_symbol");
  const readEnclosing2 = isEnabled("read_enclosing");
  if (readSymbol2 && readEnclosing2) {
    units.push({
      name: "read_symbol/read_enclosing",
      role: "exact body reads"
    });
  } else if (readSymbol2) {
    units.push({ name: "read_symbol", role: "exact body reads" });
  } else if (readEnclosing2) {
    units.push({ name: "read_enclosing", role: "exact body reads" });
  }
  if (units.length === 0)
    return void 0;
  const roles = units.map((unit) => unit.role);
  const roleTail = roles.length === 1 ? roles[0] : roles.length === 2 ? `${roles[0]}, then ${roles[1]}` : `${roles[0]}, then ${roles[1]} + ${roles[2]}`;
  return `\u2022 ${units.map((unit) => unit.name).join(" \u2192 ")} \u2014 ${roleTail}; cheaper than reading a whole file before editing.`;
}
function situationalGuidance(isEnabled) {
  const active = [];
  for (const name of [
    "lsp_navigation",
    "ast_grep_search",
    "ast_grep_replace"
  ]) {
    if (isEnabled(name))
      active.push(name);
  }
  if (active.length === 0)
    return void 0;
  let text = `\u2022 Situational (activate via pi_lens_activate_tools): ${active.join(", ")}.`;
  if (isEnabled("ast_grep_search")) {
    text += " Use ast_grep_search with dump=true to inspect AST nodes.";
  }
  return text;
}
function renderSessionStartGuidance(options = {}) {
  const disabled = new Set(options.disabledToolNames ?? []);
  const isEnabled = (name) => !disabled.has(name);
  const requirePreExistingFixes = options.requirePreExistingFixes !== false;
  const header = "\u{1F4CC} pi-lens active \u2014 automated checks run on every edit/write; " + (requirePreExistingFixes ? "blocking errors (including pre-existing) show inline and must be fixed." : "blocking errors you introduce must be fixed; pre-existing ones are only reported.");
  const bullets = [];
  if (isEnabled("lens_diagnostics")) {
    bullets.push("\u2022 lens_diagnostics \u2014 source=session reads cache; empty cache \u2260 clean; use source=lsp scope=paths for changed files with absent or stale findings (aggregate hosts: lens(action=diagnostics)).");
  }
  const readSubstitute = readSubstituteGuidance(isEnabled);
  if (readSubstitute)
    bullets.push(readSubstitute);
  const situational = situationalGuidance(isEnabled);
  if (situational)
    bullets.push(situational);
  const lines = [header];
  if (bullets.length > 0) {
    lines.push("Key tools (see each tool's own description for args):");
    lines.push(...bullets);
  }
  return [lines.join("\n")];
}
var SESSION_START_GUIDANCE = renderSessionStartGuidance();
async function handleSessionStart(deps) {
  resetDegradationLedger();
  let sessionGenerationAtStart = deps.runtime.sessionGeneration;
  resetAnalyzerBootstrapSessionState();
  resetProjectDataDirSessionState();
  resetTestRunnerDelivery();
  resetLspMutationNoBridgeDbgLatch();
  resetBoundedTelemetry();
  rotateMessageEndAttribution();
  const handlerEnteredAt = Date.now();
  const sessionStartMs = deps.sessionStartFiredAt ?? handlerEnteredAt;
  const cwdForTelemetry = deps.ctxCwd ?? process.cwd();
  if (deps.sessionStartFiredAt !== void 0) {
    logLatency({
      type: "phase",
      filePath: cwdForTelemetry,
      phase: "session_start_prehandler",
      startedAt: new Date(deps.sessionStartFiredAt).toISOString(),
      durationMs: (deps.handlerEnteredAt ?? handlerEnteredAt) - deps.sessionStartFiredAt,
      metadata: { reason: deps.sessionReason }
    });
  }
  let startupMode = resolveStartupMode(deps.projectConfig, deps.globalConfig);
  const processGlobals = globalThis;
  const isFirstSessionOfProcess = !processGlobals.__piLensFirstSessionDone;
  if (isFirstSessionOfProcess && process.env.PI_LENS_COLD_START_QUICK !== "0" && !process.env.PI_LENS_STARTUP_MODE && !deps.projectConfig?.startup?.mode && !deps.globalConfig?.startup?.mode) {
    startupMode = deps.startupModeOverride ?? "quick";
  }
  processGlobals.__piLensFirstSessionDone = true;
  let warmupOwnSnapshotRead;
  if (startupMode === "quick" && !isPrintMode() && process.env.PI_LENS_COLD_START_QUICK !== "0" && !processGlobals.__piLensWarmupScheduled) {
    processGlobals.__piLensWarmupScheduled = true;
    const warmupDelayMs = Number(process.env.PI_LENS_WARMUP_DELAY_MS ?? 2e3);
    const warmupCwd = deps.ctxCwd ?? process.cwd();
    const warmupDbg = deps.dbg;
    const warmupTimer = setTimeout(() => {
      const warmupStartedAt = Date.now();
      void (async () => {
        try {
          warmupDbg("warmup: starting background warmup");
          const scanContextStartedAt = Date.now();
          const startupScanModule = await import("../chunk-ZHFZWTZV.js");
          const languageProfileModule = await import("../chunk-R3PCY3YS.js");
          const warmupSnapshotRoot = resolveSnapshotRoot(warmupCwd);
          const cachedSnapshot = loadProjectSnapshot(warmupSnapshotRoot);
          warmupOwnSnapshotRead = cachedSnapshot ? {
            version: cachedSnapshot.version,
            seq: cachedSnapshot.seq,
            cachedExports: cachedSnapshot.cachedExports,
            projectRulesScan: cachedSnapshot.projectRulesScan
          } : null;
          const cachedVerdict = cachedSnapshot?.startupScan;
          let scan;
          if (cachedVerdict && startupScanModule.isStartupScanVerdictFresh(cachedVerdict)) {
            scan = { ...cachedVerdict, cwd: path13.resolve(warmupCwd) };
            warmupDbg(`warmup: scan-context reused from cache (canWarm=${scan.canWarmCaches}${scan.reason ? `, reason=${scan.reason}` : ""})`);
          } else {
            scan = await startupScanModule.resolveStartupScanContextAsync(warmupCwd);
            logLatency({
              type: "phase",
              phase: "session_start_scan_context_compute",
              filePath: warmupCwd,
              startedAt: new Date(scanContextStartedAt).toISOString(),
              durationMs: Date.now() - scanContextStartedAt,
              metadata: { mode: "quick-background" }
            });
            warmupDbg(`warmup: scan-context done in ${Date.now() - warmupStartedAt}ms (canWarm=${scan.canWarmCaches})`);
            saveRuntimeProjectSnapshot({
              cwd: warmupSnapshotRoot,
              runtime: deps.runtime,
              startupScan: scan,
              dbg: warmupDbg
            });
          }
          logLatency({
            type: "phase",
            phase: "warmup_scan_context",
            filePath: warmupCwd,
            startedAt: new Date(scanContextStartedAt).toISOString(),
            durationMs: Date.now() - scanContextStartedAt
          });
          if (!scan.canWarmCaches) {
            warmupDbg(`warmup: skipping language-profile (canWarm=false, reason=${scan.reason ?? "unknown"})`);
            notifyStartupWarmSkip({
              scan,
              analysisRoot: scan.projectRoot ?? warmupCwd,
              notify: deps.notify,
              runtime: deps.runtime,
              sessionGeneration: sessionGenerationAtStart
            });
            return;
          }
          const languageRoot = scan.projectRoot ?? warmupCwd;
          const languageProfileStartedAt = Date.now();
          await languageProfileModule.detectProjectLanguageProfileAsync(languageRoot);
          warmupDbg(`warmup: language-profile done in ${Date.now() - languageProfileStartedAt}ms`);
          logLatency({
            type: "phase",
            phase: "warmup_language_profile",
            filePath: warmupCwd,
            startedAt: new Date(languageProfileStartedAt).toISOString(),
            durationMs: Date.now() - languageProfileStartedAt
          });
          const wordIndexStartedAt = Date.now();
          const wordIndexResult = await buildOrRefreshWordIndex({
            runtime: deps.runtime,
            sessionGeneration: deps.runtime.sessionGeneration,
            analysisRoot: languageRoot,
            snapshotRoot: warmupSnapshotRoot,
            dbg: warmupDbg
          });
          warmupDbg(`warmup: word-index done in ${Date.now() - wordIndexStartedAt}ms`);
          logLatency({
            type: "phase",
            phase: "warmup_word_index",
            filePath: warmupCwd,
            startedAt: new Date(wordIndexStartedAt).toISOString(),
            durationMs: Date.now() - wordIndexStartedAt,
            metadata: wordIndexResult ? { ...wordIndexResult } : void 0
          });
          const lspPrewarmStartedAt = Date.now();
          if (deps.getFlag("no-lsp")) {
            warmupDbg("warmup: skipping LSP pre-warm (no-lsp)");
          } else if (isSubagentSession()) {
            warmupDbg("warmup: skipping LSP pre-warm (subagent session)");
          } else if (isWarmAttached()) {
            warmupDbg("warmup: skipping LSP pre-warm (attached to incumbent)");
          } else {
            const lspConfig = await loadLSPConfig(warmupCwd).catch(() => ({
              warmFiles: []
            }));
            const warmFiles = lspConfig.warmFiles ?? [];
            if (warmFiles.length > 0) {
              await igniteWarmFiles(warmupCwd, warmFiles, deps.runtime, deps.runtime.sessionGeneration, warmupDbg);
            } else {
              await igniteDominantLanguageWarm(languageRoot, deps.runtime, deps.runtime.sessionGeneration, warmupDbg);
            }
            logLatency({
              type: "phase",
              phase: "warmup_lsp_prewarm",
              filePath: warmupCwd,
              startedAt: new Date(lspPrewarmStartedAt).toISOString(),
              durationMs: Date.now() - lspPrewarmStartedAt
            });
            warmupDbg(`warmup: lsp-prewarm done in ${Date.now() - lspPrewarmStartedAt}ms`);
          }
          warmupDbg(`warmup: total ${Date.now() - warmupStartedAt}ms`);
        } catch (err) {
          warmupDbg(`warmup: error ${err}`);
          processGlobals.__piLensWarmupScheduled = false;
        } finally {
          logLatency({
            type: "phase",
            phase: "warmup_total",
            filePath: warmupCwd,
            startedAt: new Date(warmupStartedAt).toISOString(),
            durationMs: Date.now() - warmupStartedAt
          });
        }
      })();
    }, warmupDelayMs);
    warmupTimer.unref?.();
  }
  const allowBootstrapTasks = startupMode === "full";
  const quickMode = startupMode === "quick";
  const { ctxCwd, getFlag, notify, dbg, log, runtime, cacheManager: cacheManager2, ensureTool, cleanStaleTsBuildInfo, resetDispatchBaselines: resetDispatchBaselines2, resetLSPService: resetLSPService2 } = deps;
  let _phaseT = Date.now();
  const phase = (name) => {
    dbg(`session_start phase ${name}: ${Date.now() - _phaseT}ms`);
    _phaseT = Date.now();
  };
  deps.bootstrap.peek()?.metricsClient.reset();
  getDiagnosticTracker().reset();
  clearAllSessions();
  runtime.complexityBaselines.clear();
  resetDispatchBaselines2(ctxCwd);
  resetWorkspaceTopology();
  resetOpaqueMutationState();
  resetObservedMutationNet();
  resetMutationAttribution();
  primePersistedMutationAttribution(ctxCwd);
  resetPendingAuxiliaryCoverage();
  resetSafeSpawnWindowsCommandCache();
  resetDispatchAvailabilityState();
  resetObservedRunnerLatency();
  resetPendingRunnerFindings();
  resetSpawnTimeoutCooldowns();
  clearFormatterCache();
  resetZizmorTokenAvailability();
  resetGoAvailability();
  resetRustAvailability();
  resetPsScriptAnalyzerAvailability();
  resetInstallRetryLatches();
  resetLazyInstallAttempts();
  resetDirectLspCommandAvailability();
  resetLSPCaseSensitivityState();
  resetResolvedPathCache();
  _resetPackageManagerCache();
  resetManagedToolRefreshSession();
  resetSmellsSessionState();
  resetSituationalToolTelemetry();
  resetWorkspaceDiagnosticsCacheSession(sessionStartMs);
  deps.bootstrap.peek()?.knipClient.resetSessionState?.();
  resetCascadeTierSessionState();
  runtime.resetForSession(sessionStartMs);
  sessionGenerationAtStart = runtime.sessionGeneration;
  logLatency({
    type: "phase",
    phase: "session_start_runtime_reset",
    filePath: ctxCwd ?? process.cwd(),
    startedAt: new Date(handlerEnteredAt).toISOString(),
    durationMs: Date.now() - handlerEnteredAt,
    metadata: { mode: startupMode, reason: deps.sessionReason }
  });
  const cleanupCwd = ctxCwd ?? process.cwd();
  setImmediate(() => {
    const logCleanupStartedAt = Date.now();
    try {
      const logCleanup = runLogCleanup(dbg);
      logLatency({
        type: "phase",
        phase: "session_start_log_cleanup",
        filePath: cleanupCwd,
        startedAt: new Date(logCleanupStartedAt).toISOString(),
        durationMs: Date.now() - logCleanupStartedAt,
        metadata: {
          mode: startupMode,
          reason: deps.sessionReason,
          deferred: true
        }
      });
      if (logCleanup.cleaned > 0 || logCleanup.rotated > 0) {
        notify(`\u{1F9F9} ${logCleanup.report}`, "info");
      }
    } catch (err) {
      dbg(`session_start: deferred log cleanup failed: ${err}`);
    }
  });
  dbg(`session_start startup mode: ${startupMode}`);
  if (!getFlag("no-lsp")) {
    resetLSPService2({ fast: true, reason: "session_start" });
    dbg("session_start: LSP service reset");
    dbg("session_start: phase0 workspace diagnostics observation enabled (capability probe only)");
  }
  const hasWorkspaceCwd = typeof ctxCwd === "string" && ctxCwd.length > 0;
  const cwd = ctxCwd ?? process.cwd();
  const projectDataDir = getProjectDataDir(cwd);
  for (const migration of drainProjectDataDirMigrations()) {
    const targetName = path13.basename(migration.to);
    const hash = targetName.match(/([0-9a-f]{8})$/)?.[1] ?? "unknown";
    if (migration.outcome === "ephemeral") {
      recordDegradationOnce({
        kind: "data-dir-ephemeral",
        subject: hash,
        reason: "temporary checkout: project data lives in a process-owned directory and is not kept after exit"
      });
      continue;
    }
    recordDegradationOnce({
      kind: "data_dir_migrated",
      subject: hash,
      reason: migration.outcome === "renamed" ? "using hashed directory after renaming legacy directory" : migration.outcome === "coexisting" ? "using hashed directory because legacy and hashed directories both exist" : migration.outcome === "rename-failed" ? "using legacy directory after hashed-directory rename failure" : "using resolved directory after realpath fallback"
    });
  }
  const globalDir = getGlobalPiLensDir();
  void sweepAtomicWriteStages([
    projectDataDir,
    path13.join(projectDataDir, "cache"),
    path13.join(projectDataDir, "sessions"),
    globalDir,
    path13.join(globalDir, "bin"),
    path13.join(globalDir, "tools")
  ]).catch(() => {
  });
  void sweepDeadEphemeralDataDirs({ isPidAlive: realIsPidAlive }).catch(() => {
  });
  if (quickMode) {
    runtime.projectRoot = cwd;
    const sequenceReadStartedAt2 = Date.now();
    const snapshotRoot2 = resolveSnapshotRoot(cwd);
    const { latestSeq: latestSeq2, timedOut: timedOut2 } = await readSequenceWithBudget({
      snapshotRoot: snapshotRoot2,
      base: snapshotSequenceBase(snapshotRoot2),
      cwd,
      runtime,
      sessionGeneration: runtime.sessionGeneration,
      dbg,
      onDeferredSequenceResolved: retroactivelyHydrateAfterDeferredSequence({
        getWarmupOwnSnapshotRead: () => warmupOwnSnapshotRead,
        snapshotRoot: snapshotRoot2,
        runtime,
        dbg
      })
    });
    logLatency({
      type: "phase",
      phase: "session_start_sequence_read",
      filePath: cwd,
      startedAt: new Date(sequenceReadStartedAt2).toISOString(),
      durationMs: Date.now() - sequenceReadStartedAt2,
      metadata: { entries: latestSeq2.fileSeqByPath.size, timedOut: timedOut2 }
    });
    if (timedOut2) {
      recordSnapshotSequenceTimeout({
        snapshotRoot: snapshotRoot2,
        snapshotPath: getProjectSnapshotPath(snapshotRoot2)
      });
    }
    runtime.seedProjectSequence?.(latestSeq2.projectSeq, latestSeq2.fileSeqByPath, latestSeq2.logEntries);
    const effectiveSeq2 = runtime.projectSeq ?? latestSeq2.projectSeq;
    dbg(`session_start sequence: projectSeq=${effectiveSeq2} fileSeqEntries=${latestSeq2.fileSeqByPath.size}`);
    const freshnessSeq2 = timedOut2 ? UNKNOWN_PROJECT_SEQ : effectiveSeq2;
    const snapshotLoadStartedAt2 = Date.now();
    const snapshotPath2 = getProjectSnapshotPath(snapshotRoot2);
    let snapshotBytes2 = 0;
    try {
      snapshotBytes2 = nodeFs.statSync(snapshotPath2).size;
    } catch {
    }
    const snapshotBodyPresent2 = nodeFs.existsSync(snapshotPath2) || nodeFs.existsSync(getProjectSnapshotLegacyPath(snapshotRoot2));
    const snapshotGate2 = loadSnapshotBodyUnlessStale({
      root: snapshotRoot2,
      currentProjectSeq: freshnessSeq2,
      unlockedThrough: latestSeq2.unlockedThrough ?? 0,
      dbg
    });
    const snapshot2 = snapshotGate2.snapshot;
    const snapshotFresh2 = isProjectSnapshotFresh(snapshot2, freshnessSeq2, latestSeq2.unlockedThrough);
    const snapshotMissReason2 = describeSnapshotMiss(snapshot2, freshnessSeq2, {
      skippedStale: snapshotGate2.skippedStale,
      bodyPresent: snapshotBodyPresent2,
      unlockedThrough: latestSeq2.unlockedThrough ?? 0
    });
    logLatency({
      type: "phase",
      phase: "session_start_snapshot_load",
      filePath: cwd,
      startedAt: new Date(snapshotLoadStartedAt2).toISOString(),
      durationMs: Date.now() - snapshotLoadStartedAt2,
      metadata: {
        bytes: snapshotBytes2,
        fresh: snapshotFresh2,
        seq: snapshot2?.seq ?? null,
        reason: snapshotFresh2 ? void 0 : snapshotMissReason2,
        ...snapshotGate2.skippedStale ? { skippedStale: true } : {},
        ...timedOut2 ? { sequenceUnknown: true } : {}
      }
    });
    logProjectSnapshotProbe({
      dbg,
      root: snapshotRoot2,
      currentProjectSeq: freshnessSeq2,
      unlockedThrough: latestSeq2.unlockedThrough ?? 0,
      snapshot: snapshot2,
      missReason: snapshotMissReason2
    });
    if (snapshotFresh2) {
      hydrateRuntimeFromProjectSnapshot(runtime, snapshot2);
    }
    const quickTools = [];
    if (!getFlag("no-lsp")) {
      quickTools.push("LSP Service");
    }
    log(`Active tools: ${quickTools.join(", ")}`);
    dbg(`session_start tools: ${quickTools.join(", ") || "deferred (quick mode)"}`);
    dbg("session_start: quick mode active - skipping slow tool probes, language profiling, preinstall, scans, and error debt baseline");
    logLatency({
      type: "phase",
      phase: "session_start_skipped_steps",
      filePath: cwd,
      durationMs: 0,
      metadata: {
        mode: startupMode,
        reason: deps.sessionReason,
        // #1911 review F3: this `if (quickMode)` branch is an early return —
        // the whole quick path — so there is no enumerable list of "steps
        // run vs. skipped" this array could be derived from mechanically. It
        // is DESCRIPTIVE documentation of what the early return skips,
        // matching the `dbg()` line above word for word; keep both in sync by
        // hand if either changes. It also does NOT narrow under
        // `getFlag("no-lsp")` — quick mode skips the same five steps either
        // way; the LSP flag instead affects `quickTools` above, a separate
        // record.
        steps: [
          "slow_tool_probes",
          "language_profiling",
          "tool_preinstall",
          "startup_scans",
          "error_debt_baseline"
        ]
      }
    });
    const totalDurationMs2 = Date.now() - sessionStartMs;
    dbg(`session_start total: ${totalDurationMs2}ms (interactive path)`);
    logLatency({
      type: "phase",
      phase: "session_start_total",
      filePath: cwd,
      startedAt: new Date(sessionStartMs).toISOString(),
      durationMs: totalDurationMs2,
      metadata: {
        mode: startupMode,
        reason: deps.sessionReason,
        // #2129: the root-identity input decideSessionStart consulted,
        // alongside `mode` — every start reaching this line already
        // classified `primary`/`sequential-replacement` (a `secondary-root`
        // start returns before `handleSessionStart` is ever called).
        ...sessionStartDecisionMetadata(deps)
      }
    });
    logHostReadyDelay(deps, cwd);
    emitSmellsSessionStartLine(dbg, sessionStartMs);
    return;
  }
  const tools = [];
  if (!getFlag("no-lsp"))
    tools.push("LSP Service");
  if (allowBootstrapTasks && !getFlag("no-lsp")) {
    const cleaned = cleanStaleTsBuildInfo(ctxCwd ?? process.cwd());
    if (cleaned.length > 0) {
      notify(`\u{1F9F9} Deleted stale TypeScript build cache (${cleaned.map((f) => path13.basename(f)).join(", ")}) \u2014 phantom errors suppressed.`, "warning");
      dbg(`session_start: cleaned stale tsbuildinfo: ${cleaned.join(", ")}`);
    }
  }
  const sessionGeneration = runtime.sessionGeneration;
  const sequenceReadStartedAt = Date.now();
  const snapshotRoot = resolveSnapshotRoot(cwd);
  const { latestSeq, timedOut } = await readSequenceWithBudget({
    snapshotRoot,
    base: snapshotSequenceBase(snapshotRoot),
    cwd,
    runtime,
    sessionGeneration,
    dbg
  });
  logLatency({
    type: "phase",
    phase: "session_start_sequence_read",
    filePath: cwd,
    startedAt: new Date(sequenceReadStartedAt).toISOString(),
    durationMs: Date.now() - sequenceReadStartedAt,
    metadata: { entries: latestSeq.fileSeqByPath.size, timedOut }
  });
  if (timedOut) {
    recordSnapshotSequenceTimeout({
      snapshotRoot,
      snapshotPath: getProjectSnapshotPath(snapshotRoot)
    });
  }
  runtime.seedProjectSequence?.(latestSeq.projectSeq, latestSeq.fileSeqByPath, latestSeq.logEntries);
  const effectiveSeq = runtime.projectSeq ?? latestSeq.projectSeq;
  dbg(`session_start sequence: projectSeq=${effectiveSeq} fileSeqEntries=${latestSeq.fileSeqByPath.size}`);
  const freshnessSeq = timedOut ? UNKNOWN_PROJECT_SEQ : effectiveSeq;
  const snapshotLoadStartedAt = Date.now();
  const snapshotPath = getProjectSnapshotPath(snapshotRoot);
  let snapshotBytes = 0;
  try {
    snapshotBytes = nodeFs.statSync(snapshotPath).size;
  } catch {
  }
  const snapshotBodyPresent = nodeFs.existsSync(snapshotPath) || nodeFs.existsSync(getProjectSnapshotLegacyPath(snapshotRoot));
  const snapshotGate = loadSnapshotBodyUnlessStale({
    root: snapshotRoot,
    currentProjectSeq: freshnessSeq,
    unlockedThrough: latestSeq.unlockedThrough ?? 0,
    dbg
  });
  const snapshot = snapshotGate.snapshot;
  const snapshotFresh = isProjectSnapshotFresh(snapshot, freshnessSeq, latestSeq.unlockedThrough);
  const snapshotMissReason = describeSnapshotMiss(snapshot, freshnessSeq, {
    skippedStale: snapshotGate.skippedStale,
    bodyPresent: snapshotBodyPresent,
    unlockedThrough: latestSeq.unlockedThrough ?? 0
  });
  logLatency({
    type: "phase",
    phase: "session_start_snapshot_load",
    filePath: cwd,
    startedAt: new Date(snapshotLoadStartedAt).toISOString(),
    durationMs: Date.now() - snapshotLoadStartedAt,
    metadata: {
      bytes: snapshotBytes,
      fresh: snapshotFresh,
      seq: snapshot?.seq ?? null,
      reason: snapshotFresh ? void 0 : snapshotMissReason,
      ...snapshotGate.skippedStale ? { skippedStale: true } : {},
      ...timedOut ? { sequenceUnknown: true } : {}
    }
  });
  logProjectSnapshotProbe({
    dbg,
    root: snapshotRoot,
    currentProjectSeq: freshnessSeq,
    unlockedThrough: latestSeq.unlockedThrough ?? 0,
    snapshot,
    missReason: snapshotMissReason
  });
  const freshSnapshot = snapshotFresh ? snapshot : null;
  if (freshSnapshot) {
    hydrateRuntimeFromProjectSnapshot(runtime, freshSnapshot);
  }
  const cachedStartupScan = freshSnapshot?.startupScan && isStartupScanVerdictFresh(freshSnapshot.startupScan) ? freshSnapshot.startupScan : void 0;
  const startupScanSource = cachedStartupScan ? "snapshot" : "computed";
  let startupScan;
  if (cachedStartupScan) {
    startupScan = { ...cachedStartupScan, cwd: path13.resolve(cwd) };
  } else {
    const scanContextStartedAt = Date.now();
    startupScan = resolveStartupScanContext(cwd);
    logLatency({
      type: "phase",
      phase: "session_start_scan_context_compute",
      filePath: cwd,
      startedAt: new Date(scanContextStartedAt).toISOString(),
      durationMs: Date.now() - scanContextStartedAt,
      metadata: { mode: startupMode }
    });
  }
  phase("scan-context");
  dbg(`session_start scan-context source=${startupScanSource}`);
  const scanRoot = startupScan.projectRoot ?? cwd;
  const useScanRootForSignals = startupScan.canWarmCaches || startupScan.reason === "too-many-source-files" || startupScan.reason === "too-many-entries";
  const analysisRoot = useScanRootForSignals ? scanRoot : cwd;
  runtime.projectRoot = cwd;
  const languageProfileSource = freshSnapshot?.languageProfile ? "snapshot" : "computed";
  const languageProfile = freshSnapshot?.languageProfile ? freshSnapshot.languageProfile : detectProjectLanguageProfile(analysisRoot, startupScan.canWarmCaches ? void 0 : []);
  phase("language-profile");
  dbg(`session_start language-profile source=${languageProfileSource}`);
  dbg(`session_start cwd: ${cwd}`);
  dbg(`session_start scan root: ${scanRoot} (warmCaches=${startupScan.canWarmCaches}${startupScan.reason ? `, reason=${startupScan.reason}` : ""})`);
  dbg(`session_start analysis root: ${analysisRoot}`);
  dbg(`session_start workspace root: ${runtime.projectRoot}`);
  dbg(`session_start language profile: ${languageProfile.detectedKinds.join(", ") || "none"}`);
  dbg(`session_start language counts: ${JSON.stringify(languageProfile.counts)} configured=${JSON.stringify(languageProfile.configured)}`);
  dbg(`session_start workspace cwd available: ${hasWorkspaceCwd}`);
  if (useScanRootForSignals && analysisRoot !== cwd) {
    dbg(`session_start: monorepo analysis root override -> ${analysisRoot}`);
  }
  const slowFsVerdict = getSlowFsVerdict(analysisRoot);
  logLatency({
    type: "phase",
    phase: "slow_fs_probe",
    filePath: analysisRoot,
    durationMs: 0,
    metadata: {
      slow: slowFsVerdict.slow,
      medianStatMicros: slowFsVerdict.medianStatMicros,
      samples: slowFsVerdict.samples
    }
  });
  dbg(`session_start slow-fs probe: slow=${slowFsVerdict.slow} medianStatMicros=${slowFsVerdict.medianStatMicros.toFixed(1)} samples=${slowFsVerdict.samples}`);
  if (slowFsVerdict.slow) {
    notify(`\u{1F422} Slow filesystem detected (median ${slowFsVerdict.medianStatMicros.toFixed(0)}\xB5s/stat) \u2014 reduced-scan mode engaged (set PI_LENS_ALLOW_SLOW_FS_SCAN=1 to override).`, "warning");
  }
  const subagentSession = isSubagentSession();
  if (isWarmAttached()) {
    dbg("session_start lsp-warm: skipping pre-warm (attached to incumbent)");
  } else if (subagentSession) {
    const identity = getSubagentIdentity();
    logLatency({
      type: "phase",
      phase: "subagent_light_mode",
      filePath: analysisRoot,
      durationMs: 0,
      metadata: {
        runId: identity?.runId,
        agentName: identity?.agentName,
        marker: identity?.marker
      }
    });
    dbg(`session_start subagent light mode: engaged (marker=${identity?.marker ?? "unknown"} runId=${identity?.runId ?? "unknown"} agentName=${identity?.agentName ?? "unknown"})`);
  }
  const lensLspEnabled = !getFlag("no-lsp");
  const startupDefaults = getDefaultStartupTools(languageProfile).filter((tool) => {
    if ((tool === "typescript-language-server" || tool === "pyright") && !lensLspEnabled) {
      return false;
    }
    return true;
  });
  if (!allowBootstrapTasks) {
    dbg("session_start: skipping tool preinstall (startup mode)");
  } else if (startupDefaults.length > 0) {
    dbg(`session_start: pre-install defaults -> ${startupDefaults.join(", ")}`);
    firePreinstallDefaults(ensureTool, dbg, startupDefaults);
  } else {
    dbg("session_start: no language defaults selected for pre-install");
  }
  const startupScansEnabled = deps.projectConfig?.startup?.scans?.enabled ?? deps.globalConfig?.startup?.scans?.enabled ?? true;
  const startupScansWillRun = allowBootstrapTasks && startupScan.canWarmCaches && startupScansEnabled;
  const jstsHeavyScansWillRun = startupScansWillRun && canRunStartupHeavyScans(languageProfile, "jsts");
  if (allowBootstrapTasks) {
    scheduleDeferredToolProbes(deps, languageProfile, startupDefaults, jstsHeavyScansWillRun, dbg);
    scheduleManagedToolRefresh(dbg);
  }
  if (allowBootstrapTasks) {
    void probePrettierInstall(ensureTool, dbg, analysisRoot);
  } else {
    dbg("session_start: skipping prettier preinstall probe (startup mode)");
  }
  const summaryClients = await deps.bootstrap.request("session-start-tools");
  const detectedRunner = summaryClients?.testRunnerClient.detectRunner(analysisRoot);
  phase("test-runner-detect");
  if (detectedRunner)
    tools.push(`Test runner (${detectedRunner.runner})`);
  if (await summaryClients?.goClient.isGoAvailableAsync())
    tools.push("Go (go vet)");
  if (await summaryClients?.rustClient.isAvailableAsync())
    tools.push("Rust (cargo)");
  log(`Active tools: ${tools.join(", ")}`);
  dbg(`session_start tools: ${tools.join(", ")}`);
  const agentStartupGuidance = renderSessionStartGuidance({
    disabledToolNames: deps.disabledToolNames,
    requirePreExistingFixes: deps.globalConfig?.contextInjection?.requirePreExistingFixes
  });
  runtime.projectRulesScan = scanProjectRules(analysisRoot);
  saveRuntimeProjectSnapshot({
    cwd: snapshotRoot,
    runtime,
    startupScan,
    languageProfile,
    dbg
  });
  phase("project-rules");
  if (runtime.projectRulesScan.hasCustomRules) {
    const ruleCount = runtime.projectRulesScan.rules.length;
    const sources = [
      ...new Set(runtime.projectRulesScan.rules.map((r) => r.source))
    ];
    dbg(`session_start: found ${ruleCount} project rule(s) from ${sources.join(", ")}`);
  } else {
    dbg("session_start: no project rules found");
  }
  cacheManager2.writeCache("session-start-guidance", { content: agentStartupGuidance.join("\n") }, analysisRoot);
  if (!allowBootstrapTasks) {
    dbg("session_start: skipping startup background scans (startup mode)");
  } else if (!startupScansEnabled) {
    dbg("session_start: skipping startup background scans (disabled by config)");
    recordDegradationOnce({
      kind: "startup-analyzer-disabled",
      subject: "startup-scans",
      reason: "skipped (disabled by config)"
    });
  } else if (!startupScan.canWarmCaches) {
    dbg(`session_start: skipping heavy scans (${startupScan.reason ?? "unknown"})`);
    dbg(`session_start: skipping TODO scan (${startupScan.reason ?? "unknown"})`);
    notifyStartupWarmSkip({
      scan: startupScan,
      analysisRoot,
      notify,
      runtime,
      sessionGeneration
    });
  } else {
    scheduleStartupScans(deps, runtime, sessionGeneration, analysisRoot, snapshotRoot, languageProfile, dbg);
  }
  if (subagentSession) {
    dbg("session_start lsp-warm: skipping pre-warm (subagent session)");
  } else if (!getFlag("no-lsp") && allowBootstrapTasks) {
    setImmediate(() => {
      void loadLSPConfig(cwd).then((lspConfig) => {
        const warmFiles = lspConfig.warmFiles ?? [];
        dbg(`session_start lsp-config: loaded (${warmFiles.length} warm file(s) configured)`);
        if (warmFiles.length > 0) {
          igniteWarmFiles(cwd, warmFiles, runtime, sessionGeneration, dbg).catch((err) => dbg(`session_start lsp-warm: unhandled error: ${err}`));
        } else if (startupScan.canWarmCaches) {
          igniteDominantLanguageWarm(analysisRoot, runtime, sessionGeneration, dbg).catch((err) => dbg(`session_start lsp-warm: unhandled dominant error: ${err}`));
        } else {
          dbg(`session_start lsp-warm: skipping dominant-language auto-warm (${startupScan.reason ?? "unknown"})`);
        }
      });
    });
    phase("lsp-config");
  }
  setSessionLanguages(languageProfile.detectedKinds);
  const totalDurationMs = Date.now() - sessionStartMs;
  dbg(`session_start total: ${totalDurationMs}ms (interactive path; background tasks may continue)`);
  logLatency({
    type: "phase",
    phase: "session_start_total",
    filePath: cwd,
    startedAt: new Date(sessionStartMs).toISOString(),
    durationMs: totalDurationMs,
    metadata: {
      mode: startupMode,
      reason: deps.sessionReason,
      // #2129: see the quick-mode session_start_total record above.
      // Keep the full path's durable shape identical to quick mode.
      ...sessionStartDecisionMetadata(deps)
    }
  });
  logHostReadyDelay(deps, cwd);
  emitSmellsSessionStartLine(dbg, sessionStartMs);
}
function sessionStartDecisionMetadata(deps) {
  return {
    classification: deps.sessionStartClassification,
    sameRoot: deps.sessionStartSameRoot ?? "unknown",
    basis: deps.sessionStartBasis,
    gapMs: deps.sessionStartGapMs,
    lineageMatch: deps.sessionStartLineageMatch
  };
}
function emitSmellsSessionStartLine(dbg, sessionStartMs) {
  try {
    const line = formatSmellsSessionStartLine(countRecentSmells(void 0, sessionStartMs));
    if (line)
      dbg(line);
  } catch {
  }
}

// dist/clients/runtime-turn.js
import * as fs17 from "node:fs";
import * as path24 from "node:path";

// dist/clients/actionable-warnings.js
import { createHash as createHash2 } from "node:crypto";
import * as fs12 from "node:fs";
import * as path15 from "node:path";

// dist/clients/actionable-warnings-logger.js
import * as path14 from "node:path";
var AW_LOG_DIR = getGlobalPiLensLogDir();
var AW_LOG_FILE = path14.join(AW_LOG_DIR, "actionable-warnings.log");
var AW_LOG_BACKUP_FILE = path14.join(AW_LOG_DIR, "actionable-warnings.log.1");
var MAX_LOG_BYTES2 = Math.max(128 * 1024, Number.parseInt(process.env.PI_LENS_AW_LOG_MAX_BYTES ?? "1048576", 10) || 1048576);
var writer2 = createNdjsonLogger({
  filePath: AW_LOG_FILE,
  maxBytes: MAX_LOG_BYTES2,
  backupPath: AW_LOG_BACKUP_FILE
});
function logActionableWarningsEvent(entry) {
  if (isTestMode()) {
    return;
  }
  writer2.log({
    ts: (/* @__PURE__ */ new Date()).toISOString(),
    ...entry,
    ...entry.filePath !== void 0 ? { filePath: normalizeFilePath(entry.filePath) } : {}
  });
}

// dist/clients/actionable-warnings.js
var beforeWarningStateLockForTests = null;
function createActionableWarningId(args) {
  return stableFindingId("aw:", {
    cwd: args.cwd,
    filePath: args.filePath,
    parts: [
      args.tool,
      args.source,
      args.code,
      args.rule,
      normalizeMessage(args.message),
      args.line
    ]
  });
}
function legacyActionableWarningId(args) {
  const rel = path15.relative(args.cwd, args.filePath).replace(/\\/g, "/");
  const legacyRelativeFile = rel && !rel.startsWith("..") ? rel : normalizeMapKey(args.filePath);
  const parts = [
    legacyRelativeFile,
    args.tool ?? "",
    args.source ?? "",
    String(args.code ?? ""),
    args.rule ?? "",
    normalizeMessage(args.message),
    String(args.line ?? "")
  ];
  return `aw:${hashText(parts.join("|"), 10)}`;
}
function actionSafety(action) {
  const kind = action.kind ?? "";
  if (!kind.startsWith("quickfix"))
    return { eligible: false, reason: "not_quickfix" };
  if (!action.isPreferred)
    return { eligible: false, reason: "not_preferred" };
  if (!action.edit)
    return { eligible: false, reason: "no_edit" };
  if (action.command)
    return { eligible: false, reason: "has_command" };
  return { eligible: true };
}
function serializeAction(action) {
  const safety = actionSafety(action);
  return {
    title: action.title,
    kind: action.kind,
    isPreferred: action.isPreferred,
    hasEdit: Boolean(action.edit),
    hasCommand: Boolean(action.command),
    autoFixEligible: safety.eligible,
    skipReason: safety.reason
  };
}
function deserializeSuppressionState(contents) {
  try {
    const parsed = JSON.parse(contents ?? "");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}
function readSuppressionState(cwd) {
  const statePath = path15.join(getProjectDataDir(cwd), "cache", "actionable-warning-state.json");
  try {
    return deserializeSuppressionState(fs12.readFileSync(statePath, "utf8"));
  } catch {
    return {};
  }
}
function updateWarningState(cwd, warnings) {
  const statePath = path15.join(getProjectDataDir(cwd), "cache", "actionable-warning-state.json");
  fs12.mkdirSync(path15.dirname(statePath), { recursive: true });
  const hook = beforeWarningStateLockForTests;
  beforeWarningStateLockForTests = null;
  hook?.();
  commitDurableStore({
    path: statePath,
    deserialize: deserializeSuppressionState,
    merge: (state) => {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      state.warnings ??= {};
      for (const warning of warnings) {
        const legacyId = warning.legacyId;
        const legacyEntry = legacyId && legacyId !== warning.id ? state.warnings[legacyId] : void 0;
        const existing = state.warnings[warning.id] ?? legacyEntry ?? {};
        state.warnings[warning.id] = {
          ...existing,
          status: existing.status ?? "active",
          firstSeenAt: existing.firstSeenAt ?? now,
          lastSeenAt: now,
          seenCount: (existing.seenCount ?? 0) + 1
        };
        if (legacyEntry && legacyId)
          delete state.warnings[legacyId];
      }
      return state;
    },
    serialize: (state) => JSON.stringify(state, null, 2),
    waitMs: 2e3,
    retryMs: 10,
    timeoutMessage: "timed out acquiring actionable warning store lock",
    onContention: "skip-log",
    logContention: () => logActionableWarningsEvent({
      event: "warning_state_write_dropped",
      metadata: { reason: "lock_contention" }
    })
  });
}
function suppressionFor(cwd, id, args) {
  const state = readSuppressionState(cwd);
  const legacyId = legacyActionableWarningId({ cwd, ...args });
  const entry = state.warnings?.[id] ?? (legacyId !== id ? state.warnings?.[legacyId] : void 0);
  return {
    suppressed: entry?.status === "suppressed",
    reason: entry?.reason,
    legacyId
  };
}
function lineInModifiedRanges(line, ranges) {
  if (line === void 0)
    return true;
  if (ranges.length === 0)
    return true;
  return ranges.some((range) => line >= range.start - 2 && line <= range.end + 2);
}
function recordFromLspDiagnostic(diag, filePath, cwd) {
  const line = diag.range.start.line + 1;
  const column = diag.range.start.character + 1;
  const producer = diag.source && diag.source !== "lsp" ? diag.source : diag.serverId;
  const source = diag.source ?? "lsp";
  const code = diag.code === void 0 ? void 0 : String(diag.code);
  const identityArgs = {
    filePath,
    tool: producer ?? "lsp",
    source,
    code,
    message: diag.message,
    line
  };
  const id = createActionableWarningId({ cwd, ...identityArgs });
  const suppression = suppressionFor(cwd, id, identityArgs);
  return {
    id,
    filePath,
    displayPath: toRunnerDisplayPath(cwd, filePath),
    line,
    column,
    severity: "warning",
    tool: producer ?? "lsp",
    source,
    code,
    rule: code ? `${source}:${code}` : source,
    message: diag.message,
    actions: [],
    suppressed: suppression.suppressed,
    suppressionReason: suppression.reason,
    legacyId: suppression.legacyId,
    origin: "lsp"
  };
}
function mergeWarnings(records) {
  const byId = /* @__PURE__ */ new Map();
  for (const record of records) {
    const existing = byId.get(record.id);
    if (!existing) {
      byId.set(record.id, { ...record, actions: [...record.actions] });
      continue;
    }
    existing.origin = existing.origin === record.origin ? existing.origin : "merged";
    existing.fixSuggestion ??= record.fixSuggestion;
    existing.fixKind ??= record.fixKind;
    existing.autoFixAvailable ||= record.autoFixAvailable;
    const seenActions = new Set(existing.actions.map((a) => `${a.kind ?? ""}|${a.title}`));
    for (const action of record.actions) {
      const key = `${action.kind ?? ""}|${action.title}`;
      if (!seenActions.has(key)) {
        existing.actions.push(action);
        seenActions.add(key);
      }
    }
  }
  return [...byId.values()].sort((a, b) => a.displayPath.localeCompare(b.displayPath) || (a.line ?? 0) - (b.line ?? 0));
}
var ACTIONABLE_WARNINGS_LSP_FILE_CAP = 25;
var ACTIONABLE_WARNINGS_LSP_BUDGET_MS = 2500;
var ACTIONABLE_WARNINGS_DEFERRED_BUDGET_MS = 6e4;
var ACTIONABLE_WARNINGS_LSP_PULL_TIMEOUT_MS = 1e4;
var ACTIONABLE_WARNINGS_MAX_CODE_ACTIONS_PER_FILE = 25;
async function boundedLspCall(call, deps) {
  if (deps.signal?.aborted)
    return void 0;
  const remainingMs = deps.deadlineAt !== void 0 ? deps.deadlineAt - Date.now() : void 0;
  if (remainingMs !== void 0 && remainingMs <= 0)
    return void 0;
  const inner = bounded(call().then((value) => ({ value })), {
    // Always the FULL per-trip budget -- never clamped to the loop's own
    // residual. The residual is enforced below, off the ledger.
    ms: deps.pullTimeoutMs,
    // Optional for the in-band caller; `bounded()` reads a missing signal
    // as one that never aborts, so the deadline half stays live.
    signal: deps.signal,
    // From the deps, never a literal: the in-band and deferred loops must
    // key separately (#2557 review F3).
    hook: deps.site.hook,
    label: deps.site.label
  });
  const boxed = deps.deadlineAt !== void 0 ? await withDeadline(inner, {
    deadlineAt: deps.deadlineAt,
    onTimeout: "undefined"
  }) : await inner;
  return boxed?.value;
}
function boundedNumber(value, fallback) {
  return value !== void 0 && Number.isFinite(value) && value > 0 ? value : fallback;
}
async function buildActionableWarningsReport(args) {
  const cwd = path15.resolve(args.cwd);
  const records = [...args.dispatchWarnings];
  const lspService = getLSPService();
  const observedAtByPath = /* @__PURE__ */ new Map();
  const buildStartedAt = (/* @__PURE__ */ new Date()).toISOString();
  logActionableWarningsEvent({
    event: "report_started",
    sessionId: args.sessionId,
    metadata: {
      turnIndex: args.turnIndex,
      filesCount: args.files.length,
      dispatchWarningsCount: args.dispatchWarnings.length,
      deltaOnly: args.deltaOnly !== false,
      includeLspCodeActions: args.includeLspCodeActions
    }
  });
  if (args.includeLspCodeActions) {
    const fileCap = Math.floor(boundedNumber(args.lspFileCap, ACTIONABLE_WARNINGS_LSP_FILE_CAP));
    const budgetMs = boundedNumber(args.lspBudgetMs, ACTIONABLE_WARNINGS_LSP_BUDGET_MS);
    const eligible = [];
    let outsideRoot = 0;
    for (const file of args.files) {
      const filePath = path15.resolve(cwd, file);
      if (normalizeMapKey(filePath) === normalizeMapKey(cwd) || !isUnderDir(filePath, cwd)) {
        outsideRoot++;
        logActionableWarningsEvent({
          event: "lsp_file_skipped",
          sessionId: args.sessionId,
          filePath,
          metadata: { reason: "outside_project_root" }
        });
        continue;
      }
      if (!lspService.supportsLSP(filePath)) {
        logActionableWarningsEvent({
          event: "lsp_file_skipped",
          sessionId: args.sessionId,
          filePath,
          metadata: { reason: "no_lsp_support" }
        });
        continue;
      }
      eligible.push(filePath);
    }
    if (outsideRoot > 0) {
      args.dbg?.(`actionable_warnings: skipped ${outsideRoot} file(s) outside the project root`);
    }
    const capped = eligible.slice(0, fileCap);
    if (capped.length < eligible.length) {
      recordDegradationOnce({
        kind: "actionable-warnings-cap",
        subject: `${cwd}:file-cap`,
        reason: `LSP enrichment capped at ${fileCap} file(s); ${eligible.length - capped.length} modified file(s) were not checked for code actions this turn`
      });
    }
    const primed = [];
    const cold = [];
    for (const filePath of capped) {
      const content = fs12.existsSync(filePath) ? fs12.readFileSync(filePath, "utf-8") : void 0;
      const contentHash = content !== void 0 ? createHash2("sha256").update(content).digest("hex") : void 0;
      const cached = contentHash !== void 0 ? lspService.getLastKnownDiagnostics(filePath, contentHash) : void 0;
      (cached !== void 0 ? primed : cold).push({
        filePath,
        content,
        cached
      });
    }
    const deadline = Date.now() + budgetMs;
    const exhausted = () => args.signal?.aborted === true || Date.now() >= deadline;
    const pullTimeoutMs = boundedNumber(args.lspPullTimeoutMs, ACTIONABLE_WARNINGS_LSP_PULL_TIMEOUT_MS);
    const inBandDeps = {
      lspService,
      pullTimeoutMs,
      // #2504 review round 4 (F2). This is the AWAITED hook: the batch
      // budget has to bound what happens INSIDE a file, not only how many
      // files get started.
      deadlineAt: deadline,
      signal: args.signal,
      // This loop IS on the awaited hook, so its exceedances are turn_end's.
      site: { hook: "turn_end", label: "lspEnrichmentRoundTrip" }
    };
    let unchecked = 0;
    const runInBand = async (targets) => {
      for (const target of targets) {
        if (exhausted()) {
          unchecked += targets.length - targets.indexOf(target);
          break;
        }
        records.push(...await enrichFileFromLsp(cwd, args, target, inBandDeps));
        observedAtByPath.set(normalizeMapKey(target.filePath), (/* @__PURE__ */ new Date()).toISOString());
      }
    };
    await runInBand(primed);
    if (cold.length > 0 && primed.length === 0) {
      const deferredSignal = armDeferredLspWork();
      if (deferredSignal === void 0) {
        incrementDegradationCount({
          kind: "actionable-warnings-cap",
          subject: `${cwd}:deferral-declined`,
          // #2504 review round 4 (F1): the old wording ended "rather than
          // cancel it", which asserted a preservation that did not
          // happen -- the incumbent's report was then discarded whole by
          // the persisted-newer guard. With the per-file merge below it
          // is true, so it now says exactly WHAT survives and what does
          // not.
          reason: `an earlier deferred LSP pull is still running; ${cold.length} file(s) went unchecked for code actions this turn. What IS preserved is the incumbent loop's work: when it lands, its per-file entries are merged into whatever report is persisted then, for every file whose fileSeq has not advanced. This turn's own cold files are the loss, and nothing re-derives them -- the next report is a delta over a different file set`
        });
        logActionableWarningsEvent({
          event: "lsp_pull_deferral_declined",
          sessionId: args.sessionId,
          metadata: { turnIndex: args.turnIndex, files: cold.length }
        });
        args.dbg?.(`actionable_warnings: an earlier deferred LSP pull still holds the slot \u2014 skipping ${cold.length} fresh pull(s) this turn`);
      } else {
        const carried = [...records];
        const deferredArgs = args;
        const loopSignal = combineAbortSignals(args.signal, deferredSignal) ?? deferredSignal;
        const deferredDeps = {
          lspService,
          pullTimeoutMs,
          signal: loopSignal,
          // OFF the hook by construction: this loop is the answer to
          // turn_end's budget, not a spender of it, and it runs on its
          // own ACTIONABLE_WARNINGS_DEFERRED_BUDGET_MS deadline. Charging
          // its exceedances to `turn_end` would make the hook look over
          // budget for having correctly deferred the work (#2557 F3).
          site: {
            hook: "off_hook",
            label: "deferredLspEnrichmentRoundTrip"
          }
        };
        const deferredWork = (async () => {
          await new Promise((resolve32) => setTimeout(resolve32, 0));
          const deferredRecords = [...carried];
          const deferredDeadline = Date.now() + ACTIONABLE_WARNINGS_DEFERRED_BUDGET_MS;
          deferredDeps.deadlineAt = deferredDeadline;
          let deferredUnchecked = 0;
          let abortedMidLoop = false;
          for (const target of cold) {
            if (loopSignal.aborted || Date.now() >= deferredDeadline) {
              abortedMidLoop = loopSignal.aborted;
              deferredUnchecked += cold.length - cold.indexOf(target);
              break;
            }
            deferredRecords.push(...await enrichFileFromLsp(cwd, deferredArgs, target, deferredDeps));
            observedAtByPath.set(normalizeMapKey(target.filePath), (/* @__PURE__ */ new Date()).toISOString());
          }
          if (deferredUnchecked > 0) {
            recordDegradationOnce({
              kind: "actionable-warnings-cap",
              subject: `${cwd}:deferred-budget`,
              reason: `deferred LSP enrichment stopped early; ${deferredUnchecked} file(s) were not checked for code actions`
            });
          }
          if (abortedMidLoop || loopSignal.aborted) {
            logActionableWarningsEvent({
              event: "lsp_pull_aborted",
              sessionId: deferredArgs.sessionId,
              metadata: {
                turnIndex: deferredArgs.turnIndex,
                unchecked: deferredUnchecked
              }
            });
            return;
          }
          deferredArgs.onDeferredReport?.(assembleReport(cwd, deferredArgs, deferredRecords, {
            observedAtByPath,
            fallbackObservedAt: buildStartedAt
          }));
        })().catch((err) => {
          args.dbg?.(`actionable_warnings: deferred LSP pull failed: ${err}`);
        });
        registerDeferredLspWork(deferredSignal, deferredWork);
        logActionableWarningsEvent({
          event: "lsp_pull_deferred",
          sessionId: args.sessionId,
          metadata: { turnIndex: args.turnIndex, files: cold.length }
        });
        args.dbg?.(`actionable_warnings: no LSP cache primed this turn \u2014 deferring ${cold.length} fresh pull(s) off the turn_end hook`);
      }
    } else {
      await runInBand(cold);
    }
    if (unchecked > 0) {
      recordDegradationOnce({
        kind: "actionable-warnings-cap",
        subject: `${cwd}:wall-budget`,
        reason: `LSP enrichment hit its ${Math.round(budgetMs)}ms turn budget; ${unchecked} file(s) were not checked for code actions this turn`
      });
    }
  }
  return assembleReport(cwd, args, records, {
    observedAtByPath,
    fallbackObservedAt: buildStartedAt
  });
}
async function enrichFileFromLsp(cwd, args, target, deps) {
  const { lspService } = deps;
  const { filePath } = target;
  const out = [];
  let diags;
  let lspSource = "cache";
  if (target.cached !== void 0) {
    diags = target.cached;
  } else {
    if (deps.signal?.aborted) {
      logActionableWarningsEvent({
        event: "lsp_file_skipped",
        sessionId: args.sessionId,
        filePath,
        metadata: { reason: "aborted" }
      });
      return out;
    }
    try {
      if (target.content) {
        const opened = await boundedLspCall(async () => {
          await lspService.openFile(filePath, target.content);
          return true;
        }, deps);
        if (opened === void 0) {
          logActionableWarningsEvent({
            event: "lsp_file_skipped",
            sessionId: args.sessionId,
            filePath,
            metadata: {
              reason: deps.signal?.aborted ? "aborted" : "open_timeout",
              pullTimeoutMs: deps.pullTimeoutMs
            }
          });
          return out;
        }
      }
      const pulled = await boundedLspCall(() => lspService.getDiagnostics(filePath), deps);
      if (pulled === void 0) {
        logActionableWarningsEvent({
          event: "lsp_file_skipped",
          sessionId: args.sessionId,
          filePath,
          metadata: {
            reason: deps.signal?.aborted ? "aborted" : "pull_timeout",
            pullTimeoutMs: deps.pullTimeoutMs
          }
        });
        return out;
      }
      diags = pulled;
      lspSource = "fresh";
    } catch (err) {
      args.dbg?.(`actionable_warnings: LSP diagnostics failed for ${filePath}: ${err}`);
      logActionableWarningsEvent({
        event: "lsp_file_skipped",
        sessionId: args.sessionId,
        filePath,
        metadata: { reason: "lsp_error", error: String(err) }
      });
      return out;
    }
  }
  const ranges = args.modifiedRangesByFile.get(normalizeMapKey(filePath)) ?? [];
  const diagsWarning = diags.filter((d) => d.severity === 2);
  let deltaFiltered = 0;
  let enriched = 0;
  let actionPulls = 0;
  let actionCapped = 0;
  let budgetStopped = 0;
  for (const diag of diagsWarning) {
    if (deps.deadlineAt !== void 0 && Date.now() >= deps.deadlineAt) {
      budgetStopped = diagsWarning.length - diagsWarning.indexOf(diag);
      break;
    }
    const line = diag.range.start.line + 1;
    if (args.deltaOnly !== false && !lineInModifiedRanges(line, ranges)) {
      deltaFiltered++;
      continue;
    }
    if (actionPulls >= ACTIONABLE_WARNINGS_MAX_CODE_ACTIONS_PER_FILE) {
      actionCapped++;
      continue;
    }
    actionPulls++;
    const record = recordFromLspDiagnostic(diag, filePath, cwd);
    try {
      const actions = await boundedLspCall(() => lspService.codeAction(filePath, diag.range.start.line, diag.range.start.character, diag.range.end.line, diag.range.end.character), deps);
      record.actions = (actions ?? []).map(serializeAction).slice(0, 5);
    } catch (err) {
      args.dbg?.(`actionable_warnings: LSP codeAction failed for ${filePath}: ${err}`);
    }
    if (record.actions.length > 0) {
      out.push(record);
      enriched++;
    }
  }
  if (actionCapped > 0) {
    incrementDegradationCount({
      kind: "actionable-warnings-cap",
      subject: `${cwd}:code-action-fanout`,
      // #2504 review round 4 (S-2): "reported without fix actions" was
      // wrong in both halves. A capped warning is skipped BEFORE its record
      // is built, and a record with no action is dropped below anyway, so
      // it is not reported at all -- it never reaches the agent on this
      // channel.
      reason: `a file exceeded the ${ACTIONABLE_WARNINGS_MAX_CODE_ACTIONS_PER_FILE}-warning code-action cap; ${actionCapped} warning(s) in ${toRunnerDisplayPath(cwd, filePath)} were NOT reported this turn`
    });
  }
  if (budgetStopped > 0) {
    incrementDegradationCount({
      kind: "actionable-warnings-cap",
      subject: `${cwd}:in-file-budget`,
      reason: `the LSP enrichment wall budget expired part-way through a file; ${budgetStopped} warning(s) in ${toRunnerDisplayPath(cwd, filePath)} were NOT checked for fix actions`
    });
  }
  logActionableWarningsEvent({
    event: "lsp_file_checked",
    sessionId: args.sessionId,
    filePath,
    metadata: {
      diagsTotal: diags.length,
      diagsWarning: diagsWarning.length,
      deltaFiltered,
      enriched,
      actionCapped,
      budgetStopped,
      modifiedRangesCount: ranges.length,
      lspSource
    }
  });
  return out;
}
function assembleReport(cwd, args, records, stamps) {
  const merged = mergeWarnings(records);
  updateWarningState(cwd, merged);
  const reportWarnings = merged.map(({ legacyId: _legacyId, ...rest }) => rest);
  const byFile = /* @__PURE__ */ new Map();
  for (const warning of reportWarnings) {
    const arr = byFile.get(warning.filePath) ?? [];
    arr.push(warning);
    byFile.set(warning.filePath, arr);
  }
  const generatedAt = (/* @__PURE__ */ new Date()).toISOString();
  const files = [...byFile.entries()].map(([filePath, warnings]) => ({
    filePath,
    displayPath: toRunnerDisplayPath(cwd, filePath),
    fileSeq: args.fileSeqByPath?.get(normalizeMapKey(filePath)),
    // #2504 review round 5 (F2): the moment THIS file was observed. The
    // report-level stamp remains the assembly moment and is only the
    // last-resort fallback, for a caller that supplied no observations
    // at all.
    generatedAt: stamps?.observedAtByPath.get(normalizeMapKey(filePath)) ?? stamps?.fallbackObservedAt ?? generatedAt,
    branchEpoch: args.branchEpoch,
    branchScope: args.branchScope,
    warnings
  }));
  const summary = summarizeReportFiles(files);
  logActionableWarningsEvent({
    event: "report_complete",
    sessionId: args.sessionId,
    metadata: { turnIndex: args.turnIndex, summary }
  });
  return {
    generatedAt,
    scope: "turn_delta",
    sessionId: args.sessionId,
    turnIndex: args.turnIndex,
    projectSeqStart: args.projectSeqStart,
    projectSeqEnd: args.projectSeqEnd,
    deltaOnly: args.deltaOnly !== false,
    includeLspCodeActions: args.includeLspCodeActions,
    files,
    summary
  };
}
function summarizeReportFiles(files) {
  const warnings = files.flatMap((file) => file.warnings);
  const unsuppressed = warnings.filter((warning) => !warning.suppressed);
  const allActions = warnings.flatMap((warning) => warning.actions);
  const countTier = (tier) => unsuppressed.filter((warning) => warning.severity === tier).length;
  return {
    warnings: warnings.length,
    unsuppressed: unsuppressed.length,
    byTier: {
      warning: countTier("warning"),
      info: countTier("info"),
      hint: countTier("hint")
    },
    suppressed: warnings.filter((warning) => warning.suppressed).length,
    files: files.length,
    actions: allActions.length,
    autoFixEligible: allActions.filter((action) => action.autoFixEligible).length
  };
}
function writeActionableWarningsReport(cacheManager2, cwd, report) {
  cacheManager2.writeCache("actionable-warnings", report, cwd);
}
function mergeActionableWarningsReports(args) {
  const { persisted, incoming, origin } = args;
  const deferredPublish = origin === "deferred";
  const sessionMismatch = !deferredPublish && persisted?.sessionId !== void 0 && persisted.sessionId !== incoming.sessionId;
  const newerHalf = deferredPublish ? persisted?.files ?? [] : incoming.files;
  const olderHalf = deferredPublish ? incoming.files : persisted?.files ?? [];
  const newerReport = deferredPublish ? persisted : incoming;
  const olderReport = deferredPublish ? incoming : persisted;
  const byPath = /* @__PURE__ */ new Map();
  for (const entry of newerHalf) {
    byPath.set(normalizeMapKey(entry.filePath), entry);
  }
  const droppedFiles = [];
  let mergedFiles = 0;
  for (const entry of olderHalf) {
    if (!deferredPublish && entry.origin !== "deferred") {
      args.dbg?.(`actionable_warnings: in-band publish dropped ${entry.displayPath || entry.filePath} -- its carry-forward window (from an earlier deferred publish) already closed`);
      continue;
    }
    const key = normalizeMapKey(entry.filePath);
    const incumbent = byPath.get(key);
    const liveBaseline = args.getFileSeq !== void 0;
    const baselineSeq = args.getFileSeq?.(entry.filePath) ?? incumbent?.fileSeq;
    const stale = !deferredPublish && liveBaseline ? sessionMismatch || typeof entry.fileSeq === "number" && baselineSeq !== entry.fileSeq : typeof baselineSeq === "number" && typeof entry.fileSeq === "number" && baselineSeq > entry.fileSeq;
    if (stale) {
      droppedFiles.push(entry.displayPath || entry.filePath);
      continue;
    }
    mergedFiles++;
    const merged = incumbent ? incumbent.reVerified || incumbent.reVerifyIncomplete ? (
      // #3170: the runtime just RE-OBSERVED this file (the bounded
      // persistent-reverify pass) — the fresh observation supersedes
      // the carried entry instead of unioning with it: a converged
      // finding would otherwise survive its own supersession via the
      // id-union in `mergeWarnings`.
      {
        ...incumbent,
        fileSeq: incumbent.fileSeq ?? entry.fileSeq,
        generatedAt: olderStamp(incumbent.generatedAt ?? newerReport?.generatedAt, entry.generatedAt ?? olderReport?.generatedAt),
        warnings: incumbent.warnings
      }
    ) : {
      ...incumbent,
      fileSeq: incumbent.fileSeq ?? entry.fileSeq,
      generatedAt: olderStamp(incumbent.generatedAt ?? newerReport?.generatedAt, entry.generatedAt ?? olderReport?.generatedAt),
      branchEpoch: olderBranchEpoch(incumbent.branchEpoch, entry.branchEpoch),
      branchScope: incumbent.branchScope === entry.branchScope ? incumbent.branchScope : void 0,
      warnings: mergeWarnings([...incumbent.warnings, ...entry.warnings])
    } : { ...entry };
    if (deferredPublish) {
      merged.origin = "deferred";
    } else {
      merged.origin = void 0;
    }
    byPath.set(key, merged);
  }
  const files = [...byPath.values()];
  if (!deferredPublish) {
    return {
      report: { ...incoming, files, summary: summarizeReportFiles(files) },
      mergedFiles,
      droppedFiles,
      // sessionMismatch is a single flag for the whole call, not per-entry:
      // once true, every stale check above is forced true by the `||`, so
      // EITHER every drop in this batch is a session-boundary drop, OR none
      // are (droppedFiles is then purely fileSeq-mismatch drops).
      droppedForSessionMismatch: sessionMismatch && droppedFiles.length > 0
    };
  }
  const base = persisted ?? incoming;
  return {
    report: {
      ...base,
      // The report-level stamp is only the fallback for entries with none
      // of their own (a cache file from an older build), so it takes the
      // NEWER of the two; per-entry stamps carry the real ages.
      generatedAt: newerStamp(persisted?.generatedAt, incoming.generatedAt) ?? base.generatedAt,
      turnIndex: Math.max(base.turnIndex, incoming.turnIndex),
      projectSeqStart: minDefined(persisted?.projectSeqStart, incoming.projectSeqStart),
      // max, so a merged report never claims to be fresher OR staler than
      // the newest part it holds. checkActionableWarningsReportFresh still
      // demands exact equality with the live projectSeq and re-checks every
      // entry's fileSeq, so this widens nothing.
      projectSeqEnd: maxDefined(persisted?.projectSeqEnd, incoming.projectSeqEnd),
      includeLspCodeActions: base.includeLspCodeActions || incoming.includeLspCodeActions,
      files,
      summary: summarizeReportFiles(files)
    },
    mergedFiles,
    droppedFiles,
    // The deferred-publish path never sets sessionMismatch (gated by
    // `!deferredPublish` above), so its drops are always fileSeq-mismatch.
    droppedForSessionMismatch: false
  };
}
function publishActionableWarningsReport(cacheManager2, cwd, report, opts = {}) {
  const origin = opts.origin ?? "in-band";
  const persisted = cacheManager2.readCache("actionable-warnings", cwd, Number.MAX_SAFE_INTEGER)?.data;
  const merged = mergeActionableWarningsReports({
    persisted,
    incoming: report,
    origin,
    getFileSeq: opts.getFileSeq,
    dbg: opts.dbg
  });
  writeActionableWarningsReport(cacheManager2, cwd, merged.report);
  appendActionableWarningsHistory(cwd, report);
  if (merged.mergedFiles > 0) {
    opts.dbg?.(`actionable_warnings: ${origin} publish merged ${merged.mergedFiles} persisted file entry/entries`);
  }
  if (origin === "in-band" && merged.droppedFiles.length > 0) {
    const cause = merged.droppedForSessionMismatch ? "the publish crossed a session boundary" : "changed before this turn's in-band publish could keep them";
    const reason = `${merged.droppedFiles.length} carried-forward entries: findings are LOST on this channel; ${cause} (files: ${merged.droppedFiles.slice(0, 3).join(", ")}${merged.droppedFiles.length > 3 ? ", ..." : ""})`;
    incrementDegradationCount({
      kind: "actionable-warnings-inband-superseded",
      subject: `${path15.resolve(cwd)}:inband-carry-superseded`,
      reason
    });
    opts.dbg?.(`actionable_warnings: in-band publish dropped ${merged.droppedFiles.length} superseded carried-forward file entry/entries (${merged.droppedFiles.slice(0, 3).join(", ")}${merged.droppedFiles.length > 3 ? ", ..." : ""})`);
  }
  return merged;
}
function olderStamp(a, b) {
  if (a === void 0)
    return b;
  if (b === void 0)
    return a;
  const at = Date.parse(a);
  const bt = Date.parse(b);
  if (!Number.isFinite(at))
    return b;
  if (!Number.isFinite(bt))
    return a;
  return at <= bt ? a : b;
}
function newerStamp(a, b) {
  const older = olderStamp(a, b);
  if (a === void 0)
    return b;
  if (b === void 0)
    return a;
  return older === a ? b : a;
}
function olderBranchEpoch(a, b) {
  if (typeof a !== "number" || typeof b !== "number")
    return void 0;
  return Math.min(a, b);
}
function minDefined(a, b) {
  if (typeof a !== "number")
    return b;
  if (typeof b !== "number")
    return a;
  return Math.min(a, b);
}
function maxDefined(a, b) {
  if (typeof a !== "number")
    return b;
  if (typeof b !== "number")
    return a;
  return Math.max(a, b);
}
function writeDeferredActionableWarningsReport(args) {
  const { mergedFiles, droppedFiles } = publishActionableWarningsReport(args.cacheManager, args.cwd, args.report, { origin: "deferred", getFileSeq: args.getFileSeq, dbg: args.dbg });
  if (droppedFiles.length > 0) {
    incrementDegradationCount({
      kind: "actionable-warnings-deferred-superseded",
      subject: `${path15.resolve(args.cwd)}:deferred-file-superseded`,
      reason: `${droppedFiles.length} changed file(s): warnings are LOST; unchanged files were merged into the persisted report (files: ${droppedFiles.slice(0, 3).join(", ")}${droppedFiles.length > 3 ? ", ..." : ""})`
    });
    args.dbg?.(`turn_end: deferred actionable-warnings dropped ${droppedFiles.length} superseded file entry/entries`);
  }
  args.dbg?.(`turn_end: deferred actionable-warnings merged ${mergedFiles} file entry/entries into the persisted report`);
  return { mergedFiles, droppedFiles: droppedFiles.length };
}
function getActionableWarningsHistoryPath(cwd) {
  return path15.join(getProjectDataDir(cwd), "actionable-warnings.jsonl");
}
function appendActionableWarningsHistory(cwd, report) {
  const entries = [];
  for (const file of report.files) {
    if (file.reVerifyIncomplete)
      continue;
    for (const warning of file.warnings) {
      entries.push({
        timestamp: report.generatedAt,
        sessionId: report.sessionId,
        turnIndex: report.turnIndex,
        projectSeq: report.projectSeqEnd,
        filePath: warning.filePath,
        displayPath: warning.displayPath,
        fileSeq: file.fileSeq,
        line: warning.line,
        column: warning.column,
        severity: warning.severity,
        tool: warning.tool,
        source: warning.source,
        rule: warning.rule,
        code: warning.code,
        message: warning.message,
        fixKind: warning.fixKind,
        autoFixAvailable: warning.autoFixAvailable,
        actionCount: warning.actions.length,
        autoFixEligibleActionCount: warning.actions.filter((action) => action.autoFixEligible).length,
        suppressed: warning.suppressed,
        suppressionReason: warning.suppressionReason,
        origin: warning.origin,
        warningId: warning.id
      });
    }
  }
  if (entries.length === 0)
    return;
  const historyPath = getActionableWarningsHistoryPath(cwd);
  try {
    fs12.mkdirSync(path15.dirname(historyPath), { recursive: true });
    fs12.appendFileSync(historyPath, `${entries.map((entry) => JSON.stringify(entry)).join("\n")}
`, "utf8");
  } catch {
  }
}
function formatActionableWarningsAdvisory(report, cwd, host = "pi", filterBuiltReport) {
  const filtered = filterBuiltReport?.(report);
  const advisoryReport = filtered ? {
    ...report,
    files: filtered.files,
    summary: summarizeReportFiles(filtered.files)
  } : report;
  if (advisoryReport.summary.unsuppressed === 0)
    return void 0;
  const files = advisoryReport.files.filter((file) => file.warnings.some((warning) => !warning.suppressed));
  const fileList = files.slice(0, 5).map((file) => `  ${file.displayPath}: ${file.warnings.filter((warning) => !warning.suppressed).length}${file.reVerifyIncomplete ? " (re-verify incomplete)" : ""}`).join("\n");
  const more = files.length > 5 ? `
  ... and ${files.length - 5} more file(s)` : "";
  const safe = advisoryReport.summary.autoFixEligible > 0 ? ` ${advisoryReport.summary.autoFixEligible} appear to have conservative preferred quickfixes.` : "";
  const byTier = advisoryReport.summary.byTier;
  const quiet = byTier ? byTier.hint + byTier.info : 0;
  const tierLine = quiet > 0 ? `${quiet} of those are hint/info tier \u2014 style opinions, worth fixing only while you are already in that code.` : void 0;
  const reportPath = displayProjectDataPath(cwd, "cache", "actionable-warnings.json");
  const diagnosticsTool = resolveLensToolName("lens_diagnostics", host);
  return [
    `\u{1F7E1} Fixable warnings introduced this turn: ${advisoryReport.summary.unsuppressed}.${safe}`,
    filtered && filtered.suppressed > 0 ? `suppressed by disposition: ${filtered.suppressed} finding(s).` : void 0,
    tierLine,
    diagnosticsTool ? `Use ${diagnosticsTool} with mode=delta to inspect these warnings.` : void 0,
    fileList ? `Files:
${fileList}${more}` : void 0,
    "If continuing in these files, resolve warnings that are safe and relevant. Do not apply broad refactors unless requested.",
    `Raw report (only if you need the JSON): ${reportPath}`
  ].filter(Boolean).join("\n");
}

// dist/clients/code-quality-warnings.js
import * as fs13 from "node:fs";
import * as path16 from "node:path";
var TIER_BUDGET_ORDER = [
  "warning",
  "info",
  "hint"
];
function lineInModifiedRanges2(line, ranges) {
  if (line === void 0)
    return true;
  if (ranges.length === 0)
    return true;
  return ranges.some((range) => line >= range.start - 2 && line <= range.end + 2);
}
function buildCodeQualityWarningsReport(args) {
  const cwd = path16.resolve(args.cwd);
  const maxWarnings = Math.max(1, args.maxWarnings ?? 50);
  const byId = /* @__PURE__ */ new Map();
  for (const warning of args.warnings) {
    const ranges = args.modifiedRangesByFile.get(normalizeMapKey(warning.filePath)) ?? [];
    if (!lineInModifiedRanges2(warning.line, ranges))
      continue;
    byId.set(warning.id, warning);
  }
  const byDisplayOrder = (a, b) => a.displayPath.localeCompare(b.displayPath) || (a.line ?? 0) - (b.line ?? 0) || a.message.localeCompare(b.message);
  const candidates = [...byId.values()].sort(byDisplayOrder);
  const merged = [];
  for (const tier of TIER_BUDGET_ORDER) {
    for (const warning of candidates) {
      if (merged.length >= maxWarnings)
        break;
      if (warning.severity === tier)
        merged.push(warning);
    }
  }
  merged.sort(byDisplayOrder);
  const byFile = /* @__PURE__ */ new Map();
  for (const warning of merged) {
    const arr = byFile.get(warning.filePath) ?? [];
    arr.push(warning);
    byFile.set(warning.filePath, arr);
  }
  const files = [...byFile.entries()].map(([filePath, warnings]) => ({
    filePath,
    displayPath: toRunnerDisplayPath(cwd, filePath),
    fileSeq: args.fileSeqByPath?.get(normalizeMapKey(filePath)),
    warnings
  }));
  const ruleCounts = /* @__PURE__ */ new Map();
  for (const warning of merged) {
    const rule = warning.rule ?? warning.tool;
    ruleCounts.set(rule, (ruleCounts.get(rule) ?? 0) + 1);
  }
  const topRules = [...ruleCounts.entries()].map(([rule, count]) => ({ rule, count })).sort((a, b) => b.count - a.count || a.rule.localeCompare(b.rule)).slice(0, 8);
  return {
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    scope: "turn_delta",
    sessionId: args.sessionId,
    turnIndex: args.turnIndex,
    projectSeqStart: args.projectSeqStart,
    projectSeqEnd: args.projectSeqEnd,
    deltaOnly: true,
    files,
    summary: {
      warnings: merged.length,
      files: files.length,
      byTier: {
        warning: merged.filter((w) => w.severity === "warning").length,
        info: merged.filter((w) => w.severity === "info").length,
        hint: merged.filter((w) => w.severity === "hint").length
      },
      topRules
    }
  };
}
function writeCodeQualityWarningsReport(cacheManager2, cwd, report) {
  cacheManager2.writeCache("code-quality-warnings", report, cwd);
}
function getCodeQualityWarningsHistoryPath(cwd) {
  return path16.join(getProjectDataDir(cwd), "code-quality-warnings.jsonl");
}
function appendCodeQualityWarningsHistory(cwd, report) {
  const warnings = report.files.flatMap((file) => file.warnings.map((warning) => ({
    timestamp: report.generatedAt,
    sessionId: report.sessionId,
    turnIndex: report.turnIndex,
    projectSeq: report.projectSeqEnd,
    filePath: warning.filePath,
    displayPath: warning.displayPath,
    fileSeq: file.fileSeq,
    line: warning.line,
    column: warning.column,
    severity: warning.severity,
    tool: warning.tool,
    rule: warning.rule,
    code: warning.code,
    message: warning.message,
    category: warning.category,
    warningId: warning.id
  })));
  if (warnings.length === 0)
    return;
  const historyPath = getCodeQualityWarningsHistoryPath(cwd);
  try {
    fs13.mkdirSync(path16.dirname(historyPath), { recursive: true });
    fs13.appendFileSync(historyPath, `${warnings.map((entry) => JSON.stringify(entry)).join("\n")}
`, "utf8");
  } catch {
  }
}
function formatCodeQualityWarningsAdvisory(report, cwd, host = "pi") {
  if (report.summary.warnings === 0)
    return void 0;
  const topRules = report.summary.topRules.slice(0, 3).map((entry) => `${entry.rule}\xD7${entry.count}`).join(", ");
  const byTier = report.summary.byTier ?? { warning: 0, info: 0, hint: 0 };
  const tiers = byTier.hint || byTier.info ? [
    byTier.warning ? `${byTier.warning} warning` : void 0,
    byTier.info ? `${byTier.info} info` : void 0,
    byTier.hint ? `${byTier.hint} hint` : void 0
  ].filter(Boolean).join(", ") : "";
  const diagnosticsTool = resolveLensToolName("lens_diagnostics", host);
  return [
    `Code-quality warnings introduced/touched this turn: ${report.summary.warnings} across ${report.summary.files} file(s).`,
    tiers ? `By tier: ${tiers}. Hint and info are style opinions, not defects.` : void 0,
    topRules ? `Top rules: ${topRules}` : void 0,
    // #2521: tool route first (`mode=delta` covers the code-quality cache
    // as well as the actionable one), resolved path second.
    // #2535 F3: omit when unmapped on this host, never name a dead tool
    // (pinned available on both hosts; defensive only).
    diagnosticsTool ? `Use ${diagnosticsTool} with mode=delta to inspect these warnings.` : void 0,
    "No action required unless you are already refactoring these areas.",
    `Raw report (only if you need the JSON): ${displayProjectDataPath(cwd, "cache", "code-quality-warnings.json")}`
  ].filter(Boolean).join("\n");
}

// dist/clients/git-guard.js
import * as path17 from "node:path";

// dist/clients/read-guard-tool-lines.js
var MAX_FAILURE_TRACKER_SIZE = 200;
var recentOldTextFailures = new BoundedFifoMap(MAX_FAILURE_TRACKER_SIZE);

// dist/clients/deferred-runner-blockers.js
import { createHash as createHash3 } from "node:crypto";
import * as fs14 from "node:fs";
function judgeDeferredRunnerFindings(pending2, cwd, options = {}) {
  const findings = pending2.result?.diagnostics ?? [];
  if (findings.length === 0) {
    return { stale: 0, live: 0, kept: [], suppressed: 0, bytes: void 0 };
  }
  const { "late-runner-findings": gate3 } = gateFindingsByPathFreshness({
    cwd,
    sources: {
      "late-runner-findings": {
        findings,
        scannedAt: pending2.markedAtMs,
        citedPath: (finding) => finding.filePath
      }
    },
    ...options.quiet === true ? { quiet: true } : {}
  });
  if (gate3.live.length === 0) {
    return {
      stale: gate3.stale.length,
      live: 0,
      kept: [],
      suppressed: 0,
      bytes: void 0
    };
  }
  const bytes = readBytes(pending2.filePath);
  const { kept, suppressed } = applyPushedFindingPolicy(gate3.live, {
    cwd,
    filePath: pending2.filePath,
    content: bytes?.toString("utf-8")
  });
  return {
    stale: gate3.stale.length,
    live: gate3.live.length,
    kept,
    suppressed,
    bytes
  };
}
function recordDeferredRunnerBlockers(runtime, pending2, survivors, bytes) {
  const blocking = survivors.flatMap((d) => d.semantic === "blocking" ? [d] : []);
  if (blocking.length === 0)
    return 0;
  const recorded = runtime.recordDeferredInlineBlockers(pending2.filePath, blocking, {
    recordedAtMs: pending2.markedAtMs,
    ...bytes ? {
      contentBaseline: {
        size: bytes.byteLength,
        sha256: createHash3("sha256").update(bytes).digest("hex")
      }
    } : {}
  });
  if (recorded > 0)
    runtime.updateGitGuardStatus(false, "");
  return recorded;
}
function readBytes(filePath) {
  try {
    return fs14.readFileSync(filePath);
  } catch {
    return void 0;
  }
}

// dist/clients/git-guard.js
function resolveGuardPath(filePath, cwd) {
  return path17.resolve(cwd, filePath);
}
function guardPathKey(filePath, cwd) {
  return advisoryPathKey(filePath, cwd);
}
function capAffectedFiles(files, cwd) {
  const unique = [...new Set(files.map((file) => resolveGuardPath(file, cwd)))];
  return {
    files: unique.slice(0, MAX_ADVISORY_AFFECTED_FILES),
    truncated: unique.length > MAX_ADVISORY_AFFECTED_FILES
  };
}
var TURN_END_BLOCKER_SECTION = /^Unresolved from this turn — ([^\s].*?)(?: \(suppressed by disposition: \d+ finding\(s\)\))?:$/;
function blockerSectionFile(line) {
  const turnEndSection = TURN_END_BLOCKER_SECTION.exec(line);
  if (turnEndSection)
    return turnEndSection[1];
  if (/^\s/.test(line))
    return void 0;
  const separator = line.indexOf(": ");
  if (separator <= 0)
    return void 0;
  return line.slice(0, separator);
}
function blockingProvenance(blockerContent, blockingFiles, cwd) {
  if (typeof blockerContent !== "string" || blockerContent.length === 0)
    return void 0;
  if (!Array.isArray(blockingFiles))
    return void 0;
  if (blockingFiles.some((file) => typeof file !== "string" || file.trim().length === 0)) {
    return void 0;
  }
  const provenanceKeys = blockingFiles.map((file) => guardPathKey(file, cwd));
  const sectionKeys = [];
  let inSection = false;
  for (const line of blockerContent.split("\n")) {
    if (line.length === 0) {
      inSection = false;
      continue;
    }
    const file = blockerSectionFile(line);
    if (file === void 0) {
      if (!inSection)
        return void 0;
      continue;
    }
    sectionKeys.push(guardPathKey(file, cwd));
    inSection = true;
  }
  if (sectionKeys.length === 0)
    return void 0;
  return sectionKeys.every((key) => provenanceKeys.includes(key)) ? sectionKeys : void 0;
}
function isTurnEndFindingsCache(value) {
  if (!value || typeof value !== "object")
    return false;
  const record = value;
  return typeof record.content === "string" && typeof record.hasBlockers === "boolean" && Array.isArray(record.affectedFiles) && record.affectedFiles.every((file) => typeof file === "string") && typeof record.sessionId === "string" && typeof record.projectSeqStart === "number" && typeof record.projectSeqEnd === "number" && Number.isFinite(record.projectSeqStart) && Number.isFinite(record.projectSeqEnd) && !!record.fileSeqByPath && typeof record.fileSeqByPath === "object" && Object.values(record.fileSeqByPath).every((seq) => typeof seq === "number" && Number.isFinite(seq)) && !!record.fileContentHashes && typeof record.fileContentHashes === "object" && Object.values(record.fileContentHashes).every((hash) => typeof hash === "string") && (record.affectedFilesTruncated === void 0 || typeof record.affectedFilesTruncated === "boolean") && (record.blockingFiles === void 0 || Array.isArray(record.blockingFiles));
}
function cacheRecord(cacheManager2, cwd) {
  const entry = cacheManager2.readCache("turn-end-findings", cwd);
  return entry && isTurnEndFindingsCache(entry.data) ? entry.data : void 0;
}
function markCacheUnknown(runtime, reason) {
  runtime.markGitGuardCacheUnknown(reason);
}
function writeGitGuardRecord(cacheManager2, runtime, cwd, record) {
  const capped = capAffectedFiles(Array.isArray(record.affectedFiles) ? record.affectedFiles : [], cwd);
  const fileSeqByPath = { ...record.fileSeqByPath };
  for (const file of capped.files) {
    const key = guardPathKey(file, cwd);
    if (fileSeqByPath[key] === void 0) {
      fileSeqByPath[key] = runtime.getFileSeq(resolveGuardPath(file, cwd));
    }
  }
  const currentProvenance = snapshotAdvisoryProvenance({
    cwd,
    runtime,
    generation: 0,
    files: capped.files.map((file) => ({
      path: file,
      role: "affected"
    })),
    truncated: capped.truncated
  });
  const fileContentHashes = Object.fromEntries(currentProvenance.files.map((file) => [
    guardPathKey(file.path, cwd),
    file.sha256
  ]));
  const data = {
    ...record,
    affectedFiles: capped.files,
    affectedFilesTruncated: capped.truncated,
    fileSeqByPath,
    blockingFiles: Array.isArray(record.blockingFiles) ? capAffectedFiles(record.blockingFiles, cwd).files : void 0,
    fileContentHashes,
    provenance: record.provenance ?? currentProvenance
  };
  try {
    cacheManager2.writeCache("turn-end-findings", data, cwd);
    runtime.clearGitGuardCacheUnknown();
    return true;
  } catch {
    markCacheUnknown(runtime, "cache_write_failed");
    return false;
  }
}
function retireInlineBlockerAndResyncGuard(args) {
  const retired = args.runtime.retireInlineBlockerOnConfirmedClean(args.filePath, args.writeIndex, args.coveredSources);
  if (!retired)
    return false;
  args.runtime.updateGitGuardStatus(false, "");
  if (args.lensGuardEnabled) {
    syncGitGuardRecord(args.runtime, args.cacheManager, args.cwd, args.filePath);
  }
  return true;
}
function resyncGitGuardAfterInlinePolicy(args) {
  const changed = args.runtime.applyInlineBlockerPolicyVerdicts(args.suppressedFilePaths);
  if (args.suppressedFilePaths.length === 0 && changed === 0)
    return;
  args.runtime.updateGitGuardStatus(false, "");
}
function syncGitGuardRecord(runtime, cacheManager2, cwd, editedFilePath, analysisRootMode = "session") {
  if (!canWriteAnalysisRoot(analysisRootMode))
    return;
  const entries = (runtime.getInlineBlockersSnapshot?.() ?? []).filter((entry) => !entry.policySuppressed);
  const inspection = cacheManager2.inspectCache("turn-end-findings", cwd);
  const existing = cacheRecord(cacheManager2, cwd);
  if (existing && existing.sessionId !== runtime.telemetrySessionId && entries.length === 0) {
    markCacheUnknown(runtime, "session_mismatch");
    return;
  }
  if (!existing && inspection !== "missing" && entries.length === 0) {
    markCacheUnknown(runtime, `cache_${inspection}`);
    return;
  }
  const fileSeqByPath = {};
  for (const [filePath, seq] of runtime.getFileSeqEntries?.() ?? []) {
    fileSeqByPath[guardPathKey(filePath, cwd)] = seq;
  }
  const inlineFiles = entries.map((entry) => resolveGuardPath(entry.filePath, cwd));
  const existingBlockingFiles = existing?.blockingFiles ?? [];
  const blockerSections = existing?.blockerContent ? blockingProvenance(existing.blockerContent, existingBlockingFiles, cwd) : void 0;
  if (existing?.blockerContent && !blockerSections) {
    markCacheUnknown(runtime, "blocking_provenance_untrusted");
    return;
  }
  const editedKey = editedFilePath ? guardPathKey(editedFilePath, cwd) : void 0;
  const testFiles = existing?.testFailureFiles ?? [];
  const remainingBlockingFiles = editedKey && existingBlockingFiles.length > 0 ? existingBlockingFiles.filter((file) => guardPathKey(file, cwd) !== editedKey) : existingBlockingFiles;
  let affectedFiles = [...existing?.affectedFiles ?? [], ...inlineFiles];
  if (!entries.length && editedKey && existing) {
    const isStillTestFailure = testFiles.some((file) => guardPathKey(file, cwd) === editedKey);
    const isUnknownBlockingPath = existingBlockingFiles.length === 0 && !!existing.blockerContent;
    if (!isStillTestFailure && !isUnknownBlockingPath) {
      affectedFiles = affectedFiles.filter((file) => guardPathKey(file, cwd) !== editedKey);
    }
  }
  const clearedLastKnownBlocker = !entries.length && !!editedKey && !!blockerSections && blockerSections.every((key) => key === editedKey);
  const blockerContent = entries.length > 0 ? entries.map((entry) => `${entry.filePath}: ${entry.summary}`).join("\n") : clearedLastKnownBlocker ? void 0 : existing?.blockerContent;
  const hasTestFailures = existing?.testFailures === true;
  const hasBlockers = !!blockerContent || hasTestFailures;
  const content = [
    blockerContent,
    hasTestFailures ? existing?.testFailureContent : void 0
  ].filter((value) => !!value).join("\n\n");
  if (!hasBlockers && !content) {
    cacheManager2.clearCache("turn-end-findings", cwd);
    runtime.clearGitGuardCacheUnknown();
    return;
  }
  writeGitGuardRecord(cacheManager2, runtime, cwd, {
    content: content || existing?.content || "",
    blockerContent,
    blockingFiles: entries.length > 0 ? inlineFiles : remainingBlockingFiles,
    hasBlockers,
    affectedFiles,
    sessionId: runtime.telemetrySessionId,
    projectSeqStart: runtime.turnStartProjectSeq,
    projectSeqEnd: runtime.projectSeq,
    fileSeqByPath,
    fileContentHashes: {},
    consumed: false,
    testFailures: existing?.testFailures,
    testFailureContent: existing?.testFailureContent,
    testFailureFiles: existing?.testFailureFiles
  });
}
function mergeGitGuardTestFailure(cacheManager2, cwd, runtime, content, files) {
  const existing = cacheRecord(cacheManager2, cwd);
  const fileSeqByPath = {};
  for (const [filePath, seq] of runtime.getFileSeqEntries?.() ?? []) {
    fileSeqByPath[guardPathKey(filePath, cwd)] = seq;
  }
  const failedFiles = files.map((file) => resolveGuardPath(file, cwd));
  const blockerContent = existing?.blockerContent;
  const testFailureFiles = [
    ...existing?.testFailureFiles ?? [],
    ...failedFiles
  ].filter((file, index, all) => all.findIndex((candidate) => guardPathKey(candidate, cwd) === guardPathKey(file, cwd)) === index);
  writeGitGuardRecord(cacheManager2, runtime, cwd, {
    content: [blockerContent, content].filter(Boolean).join("\n\n"),
    blockerContent,
    blockingFiles: existing?.blockingFiles ?? [],
    testFailureContent: content,
    testFailureFiles,
    hasBlockers: true,
    affectedFiles: [...existing?.affectedFiles ?? [], ...failedFiles],
    sessionId: runtime.telemetrySessionId,
    projectSeqStart: runtime.turnStartProjectSeq,
    projectSeqEnd: runtime.projectSeq,
    fileSeqByPath,
    fileContentHashes: {},
    consumed: false,
    testFailures: true
  });
}
function clearGitGuardTestFailure(cacheManager2, cwd, runtime, passedFiles = []) {
  const existing = cacheRecord(cacheManager2, cwd);
  if (!existing?.testFailures)
    return;
  const passedKeys = new Set((passedFiles.length > 0 ? passedFiles : existing.testFailureFiles ?? []).map((file) => guardPathKey(file, cwd)));
  const remainingFiles = (existing.testFailureFiles ?? []).filter((file) => !passedKeys.has(guardPathKey(file, cwd)));
  const blockerContent = existing.blockerContent ?? "";
  if (!blockerContent && remainingFiles.length === 0) {
    cacheManager2.clearCache("turn-end-findings", cwd);
    return;
  }
  const blockingKeys = new Set((existing.blockingFiles ?? []).map((file) => guardPathKey(file, cwd)));
  const affectedFiles = existing.affectedFiles.filter((file) => blockingKeys.has(guardPathKey(file, cwd)) || remainingFiles.some((testFile) => guardPathKey(testFile, cwd) === guardPathKey(file, cwd)));
  writeGitGuardRecord(cacheManager2, runtime, cwd, {
    ...existing,
    content: blockerContent,
    blockerContent,
    affectedFiles,
    testFailures: remainingFiles.length > 0,
    testFailureContent: remainingFiles.length > 0 ? existing.testFailureContent : void 0,
    testFailureFiles: remainingFiles.length > 0 ? remainingFiles : void 0,
    hasBlockers: !!blockerContent || remainingFiles.length > 0,
    sessionId: runtime.telemetrySessionId,
    projectSeqStart: runtime.turnStartProjectSeq,
    projectSeqEnd: runtime.projectSeq,
    fileSeqByPath: Object.fromEntries(runtime.getFileSeqEntries().map(([filePath, seq]) => [guardPathKey(filePath, cwd), seq])),
    fileContentHashes: {}
  });
}

// dist/clients/secret-findings.js
var SECRET_RULE_PATTERN = /hardcoded|secret|password|credential/i;
function isSecretWarning(warning) {
  const id = `${warning.rule ?? ""} ${warning.code ?? ""}`;
  return SECRET_RULE_PATTERN.test(id);
}
function secretLocationKey(file, line) {
  return `${normalizeFilePath(file)}:${line}`;
}
function fromGitleaks(findings) {
  return findings.map((f) => ({
    file: f.file,
    line: f.startLine,
    sources: ["gitleaks"],
    rule: f.ruleId,
    description: f.description
  }));
}
function fromTrivySecrets(findings) {
  return findings.map((f) => ({
    file: f.file,
    line: f.line,
    sources: ["trivy"],
    rule: f.ruleId,
    description: f.title
  }));
}
function fromAstGrepWarnings(warnings) {
  const out = [];
  for (const w of warnings) {
    if (!isSecretWarning(w) || typeof w.line !== "number")
      continue;
    out.push({
      file: w.filePath,
      line: w.line,
      sources: ["ast-grep"],
      rule: w.rule ?? w.code ?? "hardcoded-secret",
      description: w.message
    });
  }
  return out;
}
var SOURCE_PRIORITY = {
  gitleaks: 0,
  trivy: 1,
  "ast-grep": 2
};
function sortSources(sources) {
  return [...new Set(sources)].sort((a, b) => SOURCE_PRIORITY[a] - SOURCE_PRIORITY[b]);
}
function dedupeSecretFindings(findings) {
  const byKey = /* @__PURE__ */ new Map();
  for (const f of findings) {
    const key = secretLocationKey(f.file, f.line);
    const incoming = sortSources(f.sources);
    const existed = byKey.get(key);
    if (!existed) {
      byKey.set(key, { ...f, sources: incoming });
      continue;
    }
    const existingTop = SOURCE_PRIORITY[existed.sources[0]];
    existed.sources = sortSources([...existed.sources, ...incoming]);
    if (SOURCE_PRIORITY[incoming[0]] < existingTop) {
      existed.rule = f.rule;
    }
    existed.description ??= f.description;
  }
  return [...byKey.values()];
}

// dist/clients/project-diagnostics/runner-adapters/govulncheck.js
import * as path18 from "node:path";
function govulncheckFindingToProjectDiagnostic(cwd, finding) {
  const frame = finding.trace?.find((f) => f.filename);
  const filePath = frame?.filename ? path18.isAbsolute(frame.filename) ? frame.filename : path18.resolve(cwd, frame.filename) : cwd;
  const fix = finding.fixedVersion ? ` (fixed in ${finding.fixedVersion})` : "";
  return {
    filePath,
    line: frame?.line,
    severity: "warning",
    semantic: "warning",
    tool: "govulncheck",
    runner: "govulncheck",
    rule: `govulncheck:${finding.osv}`,
    code: finding.packageName ?? finding.module,
    message: `Vulnerability ${finding.osv}: ${finding.summary ?? "reachable vulnerable dependency"}${fix}`,
    source: "project-scan"
  };
}
function govulncheckResultToProjectDiagnostics(cwd, result) {
  if (!result.success || result.findings.length === 0)
    return [];
  return result.findings.map((finding) => govulncheckFindingToProjectDiagnostic(cwd, finding));
}

// dist/clients/turn-end/lanes/govulncheck.js
async function collect(ctx) {
  const data = (await ctx.readScannerCache("govulncheck"))?.data;
  return {
    govulncheck: {
      findings: data?.findings ?? [],
      scannedAt: data?.scannedAt,
      citedPath: (finding) => finding.trace.find((frame) => frame.filename)?.filename,
      onMissing: "demote"
    }
  };
}
function gate(gates, ctx) {
  const stale = new Set(gates.govulncheck.stale);
  const filtered = filterFindingsByDisposition([...gates.govulncheck.live, ...gates.govulncheck.stale], ctx.cwd, (f) => govulncheckFindingToProjectDiagnostic(ctx.cwd, f));
  return {
    findings: filtered.kept,
    stale,
    suppressed: filtered.suppressed
  };
}
function render(kept, ctx) {
  const advisorySections = [];
  if (kept.findings.length) {
    const findings = kept.findings.slice(0, 5);
    let report = "\u{1F6E1}\uFE0F Go CVEs reachable from this code (govulncheck) \u2014 upgrade where possible:\n";
    for (const f of findings) {
      const callSite = f.trace.find((t) => t.filename);
      const stale = kept.stale.has(f);
      const where = callSite?.filename ? `${toRunnerDisplayPath(ctx.cwd, callSite.filename)}${!stale && callSite.line ? `:${callSite.line}` : ""}${stale ? ` ${STALE_LINE_MARKER}` : ""}` : f.module ?? f.packageName ?? "(module)";
      const fix = f.fixedVersion ? ` \u2014 upgrade to ${f.fixedVersion} or later` : " \u2014 no fix yet, track upstream";
      report += `  ${f.osv} (${where})${fix}
`;
    }
    if (kept.findings.length > findings.length) {
      report += `  \u2026 and ${kept.findings.length - findings.length} more
`;
    }
    advisorySections.push(report);
  }
  return {
    advisoryParts: advisorySections,
    dispositionSuppressed: { govulncheck: kept.suppressed }
  };
}
var govulncheckLane = {
  collect,
  gate,
  render
};

// dist/clients/project-diagnostics/runner-adapters/gitleaks.js
import * as path19 from "node:path";
function gitleaksFindingToProjectDiagnostic(cwd, finding) {
  const statusSuffix = finding.pathStatus ? ` [git: ${finding.pathStatus}]` : "";
  const isBlocking2 = finding.pathStatus !== "scratch" && finding.pathStatus !== "ignored" && finding.pathStatus !== "nested-repository";
  return {
    filePath: path19.isAbsolute(finding.file) ? finding.file : path19.resolve(cwd, finding.file),
    line: finding.startLine,
    severity: isBlocking2 ? "error" : "info",
    semantic: isBlocking2 ? "blocking" : "none",
    tool: "gitleaks",
    runner: "gitleaks",
    rule: `gitleaks:${finding.ruleId}`,
    message: `Potential secret: ${finding.description || finding.ruleId}${statusSuffix}`,
    source: "project-scan"
  };
}
function gitleaksResultToProjectDiagnostics(cwd, result) {
  if (!result.success || result.findings.length === 0)
    return [];
  return result.findings.map((finding) => gitleaksFindingToProjectDiagnostic(cwd, finding));
}

// dist/clients/project-diagnostics/runner-adapters/trivy.js
import * as path20 from "node:path";
function trivyFindingToProjectDiagnostic(cwd, finding) {
  const filePath = finding.target ? path20.isAbsolute(finding.target) ? finding.target : path20.resolve(cwd, finding.target) : cwd;
  const version = finding.installedVersion ? `@${finding.installedVersion}` : "";
  const fix = finding.fixedVersion ? ` (fixed in ${finding.fixedVersion})` : "";
  return {
    filePath,
    severity: "warning",
    semantic: "warning",
    tool: "trivy",
    runner: "trivy",
    rule: `trivy:${finding.vulnerabilityId}`,
    code: finding.pkgName,
    message: `${finding.severity} vulnerability ${finding.vulnerabilityId} in ${finding.pkgName}${version}${fix}`,
    source: "project-scan"
  };
}
function trivySecretFindingToProjectDiagnostic(cwd, finding) {
  return {
    filePath: path20.isAbsolute(finding.file) ? finding.file : path20.resolve(cwd, finding.file),
    line: finding.line,
    severity: "error",
    semantic: "blocking",
    tool: "trivy",
    runner: "trivy",
    rule: `trivy-secret:${finding.ruleId}`,
    message: `Potential secret: ${finding.title || finding.ruleId}`,
    source: "project-scan"
  };
}
function trivySecretsToProjectDiagnostics(cwd, secrets) {
  return secrets.map((finding) => trivySecretFindingToProjectDiagnostic(cwd, finding));
}
function trivyResultToProjectDiagnostics(cwd, result) {
  if (!result.success)
    return [];
  return [
    ...(result.findings ?? []).map((finding) => trivyFindingToProjectDiagnostic(cwd, finding)),
    // `secrets` defaults to `[]` here rather than assuming the field is
    // always present: `fetchFreshProjectDiagnostics` swallows a task
    // rejection into a silent "completed" outcome (its
    // `.catch(() => "completed")`), so an unguarded `.map` on a missing
    // field here would drop this lane's CVE diagnostics too, not just the
    // secrets — a caller-visible regression for a field this adapter
    // doesn't itself require.
    ...trivySecretsToProjectDiagnostics(cwd, result.secrets ?? [])
  ];
}

// dist/clients/turn-end/lanes/secrets.js
async function blockingGitleaksFindings(data, ctx) {
  const classification = await bounded(classifyAndFilterFindings(data?.findings ?? [], ctx.cwd), {
    ms: HOOK_WALL_BUDGET_MS.turn_end,
    signal: ctx.signal,
    hook: "turn_end",
    label: "classifyAndFilterFindings"
  });
  if (classification === void 0) {
    recordDegradationOnce({
      kind: "gitleaks_classification_timeout",
      subject: ctx.cwd,
      reason: "gitleaks classification exceeded the turn_end budget; retained raw findings to fail open"
    });
  }
  return (classification ?? data?.findings ?? []).filter((finding) => gitleaksFindingToProjectDiagnostic(ctx.cwd, finding).semantic === "blocking");
}
async function collect2(ctx) {
  const [gitleaksEntry, trivyEntry] = await Promise.all([
    ctx.readScannerCache("gitleaks"),
    ctx.readScannerCache("trivy")
  ]);
  const gitleaksData = gitleaksEntry?.data;
  const trivyData = trivyEntry?.data;
  return {
    gitleaks: {
      findings: await blockingGitleaksFindings(gitleaksData, ctx),
      citedPath: (finding) => finding.file,
      scannedAt: gitleaksData?.scannedAt
    },
    "trivy-secrets": {
      findings: trivyData?.secrets ?? [],
      citedPath: (finding) => finding.file,
      scannedAt: trivyData?.scannedAt
    }
  };
}
function gate2(gates, ctx) {
  const gitleaksLive = filterFindingsByDisposition(gates.gitleaks.live, ctx.cwd, (f) => gitleaksFindingToProjectDiagnostic(ctx.cwd, f));
  const gitleaksStale = filterFindingsByDisposition(gates.gitleaks.stale, ctx.cwd, (f) => gitleaksFindingToProjectDiagnostic(ctx.cwd, f));
  const trivyLive = filterFindingsByDisposition(gates["trivy-secrets"].live, ctx.cwd, (f) => trivySecretFindingToProjectDiagnostic(ctx.cwd, f));
  const trivyStale = filterFindingsByDisposition(gates["trivy-secrets"].stale, ctx.cwd, (f) => trivySecretFindingToProjectDiagnostic(ctx.cwd, f));
  return {
    gitleaksLive: gitleaksLive.kept,
    gitleaksStale: gitleaksStale.kept,
    trivyLive: trivyLive.kept,
    trivyStale: trivyStale.kept,
    suppressed: {
      gitleaks: gitleaksLive.suppressed + gitleaksStale.suppressed,
      "trivy-secrets": trivyLive.suppressed + trivyStale.suppressed
    }
  };
}
function render2(kept, ctx) {
  const sessionSecrets = dedupeSecretFindings([
    ...fromGitleaks(kept.gitleaksLive),
    ...fromTrivySecrets(kept.trivyLive)
  ]);
  const deliveredLocationKeys = new Set(sessionSecrets.map((f) => secretLocationKey(f.file, f.line)));
  const blockerSections = [];
  if (sessionSecrets.length) {
    const enriched = dedupeSecretFindings([
      ...sessionSecrets,
      ...fromAstGrepWarnings(ctx.peekActionableWarnings().filter(isSecretWarning)).filter((a) => deliveredLocationKeys.has(secretLocationKey(a.file, a.line)))
    ]);
    const shown2 = enriched.slice(0, 5);
    let report = "\u{1F534} STOP \u2014 hardcoded secrets detected. Rotate the credentials and remove them from source:\n";
    for (const f of shown2) {
      const where = `${toRunnerDisplayPath(ctx.cwd, f.file)}:${f.line}`;
      report += `  ${where} \u2014 ${f.rule} [${f.sources.join(" + ")}]${f.description ? `: ${f.description}` : ""}
`;
    }
    if (enriched.length > shown2.length) {
      report += `  \u2026 and ${enriched.length - shown2.length} more
`;
    }
    blockerSections.push(report);
  }
  const staleSecretEntries = [
    ...kept.gitleaksStale.map((f) => ({
      file: toRunnerDisplayPath(ctx.cwd, f.file),
      rule: f.ruleId,
      source: "gitleaks"
    })),
    ...kept.trivyStale.map((f) => ({
      file: toRunnerDisplayPath(ctx.cwd, f.file),
      rule: f.ruleId,
      source: "trivy"
    }))
  ];
  const staleSecrets = [
    ...new Map(staleSecretEntries.map((e) => [`${e.file}|${e.rule}|${e.source}`, e])).values()
  ];
  const staleSections = [];
  if (staleSecrets.length) {
    const shown2 = staleSecrets.slice(0, 5);
    let report = `\u{1F511} ACTION NEEDED \u2014 secrets were flagged in files that changed after the scan. ${STALE_LINE_MARKER}
The cached line numbers are no longer trustworthy, so they are withheld. Re-run a secrets scan to confirm or clear these:
`;
    for (const entry of shown2) {
      report += `  ${entry.file} \u2014 ${entry.rule} [${entry.source}]
`;
    }
    if (staleSecrets.length > shown2.length) {
      report += `  \u2026 and ${staleSecrets.length - shown2.length} more
`;
    }
    staleSections.push(report);
  }
  return {
    blockerParts: blockerSections,
    staleSecretParts: staleSections,
    dispositionSuppressed: kept.suppressed,
    deliveredLocationKeys
  };
}
var secretsLane = {
  collect: collect2,
  gate: gate2,
  render: render2
};

// dist/clients/turn-end/delivery-holds.js
function planDeliveryHolds(args) {
  const byPart = /* @__PURE__ */ new Map();
  for (const hold of args.holds) {
    const queue = byPart.get(hold.part);
    if (queue)
      queue.push(hold);
    else
      byPart.set(hold.part, [hold]);
  }
  const settled = [];
  let start = 0;
  for (const part of args.parts) {
    const end = start + part.text.length;
    const hold = byPart.get(part.raw)?.shift();
    if (hold) {
      const whole = end <= args.keptChars;
      const leadsOversized = start === 0;
      const reached = whole || leadsOversized;
      settled.push({
        hold,
        reached,
        keeps: reached || (hold.canHold?.() ?? true)
      });
    }
    start = end + args.separatorLength;
  }
  return {
    heldCount: settled.reduce((n, entry) => n + (entry.reached || !entry.keeps ? 0 : 1), 0),
    settle: ({ suppressed, isCurrentSession, onFault }) => {
      let delivered = 0;
      let held = 0;
      let dropped = 0;
      const live = isCurrentSession();
      for (const { hold, reached, keeps } of settled) {
        if (reached)
          delivered += 1;
        else if (keeps)
          held += 1;
        else
          dropped += 1;
        if (!live)
          continue;
        const run = reached ? suppressed && hold.skipOnSuppressed ? void 0 : hold.onDelivered : keeps ? hold.onHeld : hold.onDropped;
        if (!run)
          continue;
        try {
          run();
        } catch (cause) {
          onFault(cause);
        }
      }
      return { delivered, held, dropped };
    }
  };
}
function stillReportedParked(parked, current, keyOf, offeredKeys) {
  const parkedKeys = new Set(parked.map(keyOf));
  return current.filter((item) => parkedKeys.has(keyOf(item)) && !offeredKeys.has(keyOf(item)));
}

// dist/clients/knip-scan-roots.js
import { resolve as resolve13 } from "node:path";
var MAX_KNIP_ROOTS_PER_TURN = 3;
function resolveKnipScanRoots(sessionCwd, modifiedFiles) {
  const session = resolveGitCheckout(sessionCwd);
  if (!session || modifiedFiles.length === 0) {
    return { roots: [sessionCwd], overCap: [] };
  }
  let sessionOwnsEdit = false;
  const linked = [];
  for (const file of modifiedFiles) {
    const owner = resolveLinkedWorktreeOwner(session, resolve13(sessionCwd, file));
    if (owner === null) {
      sessionOwnsEdit = true;
    } else if (!linked.some((known) => pathsEqual(known.root, owner.root))) {
      linked.push(owner);
    }
  }
  const linkedRoots = linked.map((checkout) => checkout.spelledRoot);
  const roots = sessionOwnsEdit ? [sessionCwd, ...linkedRoots] : linkedRoots;
  return {
    roots: roots.slice(0, MAX_KNIP_ROOTS_PER_TURN),
    overCap: roots.slice(MAX_KNIP_ROOTS_PER_TURN)
  };
}

// dist/clients/project-diagnostics/runner-adapters/dead-code.js
import * as path21 from "node:path";
function deadCodeRunnerId(language) {
  return `dead-code-${language}`;
}
function deadCodeMessage(issue) {
  if (issue.category === "unlisted")
    return `Unlisted dependency ${issue.name}`;
  if (issue.category === "dependency")
    return `Unused dependency ${issue.name}`;
  if (issue.category === "file")
    return `Unused file ${issue.name}`;
  return `Unused ${issue.kind} ${issue.name}`;
}
function deadCodeIssueToProjectDiagnostic(cwd, issue, language) {
  const blocking = issue.category === "unlisted";
  return {
    filePath: issue.file ? path21.isAbsolute(issue.file) ? issue.file : path21.resolve(cwd, issue.file) : cwd,
    line: issue.line,
    severity: blocking ? "error" : "warning",
    semantic: blocking ? "blocking" : "warning",
    tool: "dead-code",
    runner: deadCodeRunnerId(language),
    rule: `dead-code:${issue.category}`,
    message: deadCodeMessage(issue),
    source: "project-scan"
  };
}
function deadCodeResultToProjectDiagnostics(cwd, result) {
  if (!result.success)
    return [];
  const issues = [
    ...result.unusedExports,
    ...result.unusedFiles,
    ...result.unusedDeps,
    ...result.unlistedDeps
  ];
  return issues.map((issue) => deadCodeIssueToProjectDiagnostic(cwd, issue, result.language));
}

// dist/clients/project-diagnostics/runner-adapters/knip.js
import * as path22 from "node:path";
function knipIssueFile(cwd, issue) {
  if (!issue.file)
    return cwd;
  return path22.isAbsolute(issue.file) ? issue.file : path22.resolve(cwd, issue.file);
}
function knipIssueMessage(issue) {
  if (issue.type === "unlisted") {
    return `Unlisted dependency ${issue.name}`;
  }
  if (issue.type === "bin") {
    return `Unlisted binary ${issue.name}`;
  }
  if (issue.type === "export") {
    return `Unused export ${issue.name}`;
  }
  if (issue.type === "enumMember") {
    return `Unused enum member ${issue.name}`;
  }
  if (issue.type === "file") {
    return `Unused file ${issue.name}`;
  }
  if (issue.type === "dependency" || issue.type === "devDependency") {
    return `Unused ${issue.type} ${issue.name}`;
  }
  return `${issue.type}: ${issue.name}`;
}
function knipIssueToProjectDiagnostic(cwd, issue) {
  const blocking = issue.type === "unlisted" || issue.type === "bin";
  return {
    filePath: knipIssueFile(cwd, issue),
    line: issue.line,
    severity: blocking ? "error" : "warning",
    semantic: blocking ? "blocking" : "warning",
    tool: "knip",
    runner: "knip",
    rule: `knip:${issue.type}`,
    code: issue.package,
    message: knipIssueMessage(issue),
    source: "project-scan"
  };
}
function knipIssuesToProjectDiagnostics(cwd, issues) {
  return issues.map((issue) => knipIssueToProjectDiagnostic(cwd, issue));
}

// dist/clients/lens-events.js
var LENS_EVENT_VERSION = 1;
var LENS_EVENT_NAMES = {
  analysisComplete: "pi-lens/analysis-complete",
  findings: "pi-lens/findings",
  turnFindings: "pi-lens/turn-findings"
};
var liveEmitter = createLiveBusEmitter();
function truncateText(value, maxChars) {
  if (value === void 0)
    return void 0;
  if (value.length <= maxChars)
    return value;
  return `${value.slice(0, maxChars)}\u2026`;
}
var _droppedEmitLogged = false;
var hasLoggedFailure = false;
function emitLensEvent(eventName, payload) {
  setImmediate(() => {
    const rawCwd = payload.cwd ?? process.cwd();
    const resolution = resolveLiveBusEmitter(liveEmitter, () => ({
      event: eventName,
      cwd: normalizeFilePath(rawCwd)
    }));
    if (resolution.outcome === "stale-session")
      return;
    if (resolution.outcome === "unwired") {
      if (!_droppedEmitLogged) {
        _droppedEmitLogged = true;
        logExtension({
          subsystem: "lens-events",
          level: "warn",
          message: `lens event dropped (no live bus): ${eventName} \u2014 further drops logged once per process`,
          metadata: { eventName }
        });
      }
      return;
    }
    const cwd = normalizeFilePath(rawCwd);
    try {
      resolution.emit(eventName, payload);
      hasLoggedFailure = false;
      logBusEvent({ event: eventName, outcome: "emitted", cwd });
    } catch (err) {
      logBusEvent({
        event: eventName,
        outcome: "emit_failed",
        cwd,
        error: String(err),
        ctxSource: resolution.ctxSource
      });
      if (!hasLoggedFailure) {
        hasLoggedFailure = true;
        recordStaleBusFailure(eventName, err);
      }
    }
  });
}
function emitLensTurnFindings(payload) {
  emitLensEvent(LENS_EVENT_NAMES.turnFindings, {
    version: LENS_EVENT_VERSION,
    source: "pi-lens",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    ...payload,
    content: truncateText(payload.content, 8e3) ?? ""
  });
}

// dist/clients/test-target-roots.js
import { dirname as dirname7 } from "node:path";
function createTurnEndTestRoots(sessionCwd) {
  const session = resolveGitCheckout(sessionCwd);
  const ownerByDir = /* @__PURE__ */ new Map();
  return (absoluteFile) => {
    if (session === null)
      return sessionCwd;
    const dir = dirname7(absoluteFile);
    let owner = ownerByDir.get(dir);
    if (owner === void 0) {
      owner = resolveLinkedWorktreeOwner(session, absoluteFile);
      ownerByDir.set(dir, owner);
    }
    return owner === null ? sessionCwd : owner.spelledRoot;
  };
}

// dist/clients/blocker-past-eof.js
function sweepInlineBlockerPastEof(runtime, cwd, options) {
  const counts = {
    total: 0,
    checked: 0,
    demoted: 0,
    deadLinesByPath: /* @__PURE__ */ new Map()
  };
  const resync = options?.resync ?? resyncDocumentOnPastEof;
  let entries;
  try {
    entries = runtime.getInlineBlockersSnapshot();
  } catch {
    return counts;
  }
  counts.total = entries.length;
  for (const entry of entries) {
    try {
      if (!entry.lines || entry.lines.length === 0)
        continue;
      if (entry.stale && entry.staleReason !== "past-eof")
        continue;
      counts.checked += 1;
      const probes = entry.lines.map((line) => ({
        line,
        stale: entry.stale,
        staleReason: entry.staleReason
      }));
      const { diagnostics } = demotePastEofDiagnostics({
        store: "inline-blocker",
        cwd,
        filePath: entry.filePath,
        diagnostics: probes,
        lineCountCache: options?.lineCountCache,
        resync
      });
      const isPastEof = diagnostics.some((d) => d.stale);
      if (isPastEof) {
        counts.deadLinesByPath.set(entry.filePath, diagnostics.filter((d) => d.stale).map((d) => d.line).filter((line) => typeof line === "number"));
      }
      const transitioned = runtime.setInlineBlockerPastEofStale(entry.filePath, isPastEof);
      if (!transitioned)
        continue;
      if (isPastEof)
        counts.demoted += 1;
    } catch {
    }
  }
  return counts;
}

// dist/clients/persistent-reverify.js
import * as fs15 from "node:fs";
var MAX_REVERIFY_FILES = 4;
var REVERIFY_BUDGET_MS = 3e3;
var TOUCH_SOURCE = "persistent_reverify";
function selectPersistentReverifyFiles(report, nowMs = Date.now()) {
  const candidates = [];
  let skippedChanged = 0;
  for (const entry of report.files) {
    if (entry.origin !== "deferred")
      continue;
    if (entry.warnings.some((w) => findAuxiliaryProfileForSource(w.source ?? "") !== void 0)) {
      continue;
    }
    const stamp = entry.generatedAt ? Date.parse(entry.generatedAt) : NaN;
    if (!Number.isFinite(stamp) || stamp > nowMs)
      continue;
    let mtimeMs;
    try {
      mtimeMs = fs15.statSync(entry.filePath).mtimeMs;
    } catch {
      continue;
    }
    if (mtimeMs > stamp) {
      skippedChanged += 1;
      continue;
    }
    if (candidates.length < MAX_REVERIFY_FILES)
      candidates.push(entry);
  }
  return { candidates, skippedChanged };
}
async function runPersistentReverify(args) {
  const started = Date.now();
  const deadlineAt = started + (args.budgetMs ?? REVERIFY_BUDGET_MS);
  const nowMs = args.nowMs ?? started;
  const { candidates, skippedChanged } = selectPersistentReverifyFiles(args.report, nowMs);
  const outcomes = [];
  const replacementFiles = [];
  let touched = 0;
  const buildArgs = {
    cwd: args.cwd,
    sessionId: args.report.sessionId,
    turnIndex: 0,
    files: [],
    modifiedRangesByFile: /* @__PURE__ */ new Map(),
    dispatchWarnings: [],
    includeLspCodeActions: true,
    deltaOnly: false,
    ...args.signal !== void 0 ? { signal: args.signal } : {},
    lspBudgetMs: REVERIFY_BUDGET_MS,
    dbg: () => {
    }
  };
  let processed = 0;
  for (const entry of candidates) {
    if (args.signal?.aborted || Date.now() >= deadlineAt)
      break;
    processed += 1;
    let content;
    try {
      content = fs15.readFileSync(entry.filePath, "utf-8");
    } catch {
      outcomes.push({
        filePath: entry.filePath,
        displayPath: entry.displayPath,
        outcome: "unconfirmed",
        dropped: 0,
        kept: entry.warnings.length
      });
      replacementFiles.push({ ...entry, reVerifyIncomplete: true });
      continue;
    }
    let touchedResult;
    try {
      touchedResult = await bounded(args.lspService.touchFile(entry.filePath, content, {
        diagnostics: "document",
        collectDiagnostics: true,
        source: TOUCH_SOURCE,
        clientScope: "primary"
      }), {
        ms: Math.max(250, deadlineAt - Date.now()),
        signal: args.signal,
        hook: "turn_end",
        label: "persistent_reverify_touch"
      });
    } catch {
      touchedResult = void 0;
    }
    if (touchedResult === void 0 || touchedResult.inconclusive === true || touchedResult.skipReason !== void 0 || (touchedResult.diagnosticsUnsupportedServerIds ?? []).length > 0 || !touchCompletedConfirmationPolicy(touchedResult)) {
      outcomes.push({
        filePath: entry.filePath,
        displayPath: entry.displayPath,
        outcome: "unconfirmed",
        dropped: 0,
        kept: entry.warnings.length
      });
      replacementFiles.push({ ...entry, reVerifyIncomplete: true });
      continue;
    }
    touched += 1;
    const freshRecords = await bounded(enrichFileFromLsp(args.cwd, buildArgs, { filePath: entry.filePath, cached: touchedResult.diags }, {
      lspService: args.lspService,
      pullTimeoutMs: 2e3,
      deadlineAt,
      ...args.signal !== void 0 ? { signal: args.signal } : {},
      site: { hook: "turn_end", label: "persistent_reverify" }
    }), {
      ms: Math.max(250, deadlineAt - Date.now()),
      signal: args.signal,
      hook: "turn_end",
      label: "persistent_reverify_enrich"
    }) ?? [];
    let dropped = 0;
    let kept = 0;
    for (const warning of entry.warnings) {
      const stillThere = freshRecords.some((record) => record.rule === warning.rule && record.message === warning.message);
      if (stillThere)
        kept += 1;
      else
        dropped += 1;
    }
    const outcome = freshRecords.length === 0 ? "clean" : dropped === 0 ? "reconfirmed" : "mixed";
    outcomes.push({
      filePath: entry.filePath,
      displayPath: entry.displayPath,
      outcome,
      dropped,
      kept
    });
    const { reVerifyIncomplete: _reVerifyIncomplete, ...entryWithoutIncomplete } = entry;
    replacementFiles.push({
      ...entryWithoutIncomplete,
      warnings: freshRecords,
      reVerified: true,
      generatedAt: new Date(nowMs).toISOString()
    });
  }
  logLatency({
    type: "phase",
    toolName: "turn_end",
    filePath: args.cwd,
    phase: "persistent_reverify",
    durationMs: Date.now() - started,
    metadata: {
      candidates: candidates.length,
      touched,
      clean: outcomes.filter((o) => o.outcome === "clean").length,
      reconfirmed: outcomes.filter((o) => o.outcome === "reconfirmed").length,
      mixed: outcomes.filter((o) => o.outcome === "mixed").length,
      unconfirmed: outcomes.filter((o) => o.outcome === "unconfirmed").length,
      skippedChanged,
      skippedBudget: candidates.length - processed
    }
  });
  return {
    outcomes,
    replacementFiles,
    candidates: candidates.length,
    touched,
    skippedChanged
  };
}

// dist/clients/inline-blocker-dispositions.js
import * as fs16 from "node:fs";
import * as path23 from "node:path";
function readCurrentContent(filePath) {
  try {
    return fs16.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}
function applyInlineBlockerPolicy(record, cwd) {
  const diagnostics = record.diagnostics;
  if (!diagnostics || diagnostics.length === 0) {
    if (hasAnyDispositionMarks(cwd)) {
      recordDegradationOnce({
        kind: "inline-blocker-unstructured",
        subject: `inline-blocker:${toRunnerDisplayPath(cwd, record.filePath)}`,
        reason: "record carries no structured diagnostics; disposition marks cannot be applied to its rendered summary"
      });
    }
    return {
      body: record.summary,
      candidates: 0,
      kept: 0,
      suppressed: 0,
      unstructured: true
    };
  }
  const byFile = /* @__PURE__ */ new Map();
  for (const diagnostic of diagnostics) {
    const owner = path23.resolve(cwd, diagnostic.filePath);
    const group = byFile.get(owner);
    if (group)
      group.push(diagnostic);
    else
      byFile.set(owner, [diagnostic]);
  }
  const policyMap = loadProjectRulePolicyMap(cwd);
  const dropped = /* @__PURE__ */ new Set();
  for (const [filePath, group] of byFile) {
    const { kept: kept2 } = applyFindingPolicy(group, {
      cwd,
      filePath,
      content: readCurrentContent(filePath),
      policyMap,
      identities: inlineBlockerIdentities
    });
    const survivors = new Set(kept2);
    for (const diagnostic of group) {
      if (!survivors.has(diagnostic))
        dropped.add(diagnostic);
    }
  }
  const kept = dropped.size === 0 ? [...diagnostics] : diagnostics.filter((diagnostic) => !dropped.has(diagnostic));
  return {
    body: kept.length === 0 ? void 0 : formatDiagnostics(kept, "blocking").trim(),
    candidates: diagnostics.length,
    kept: kept.length,
    suppressed: dropped.size,
    unstructured: false
  };
}
var IDENTITY_CAP = 10;
function summarizeInlineBlockerPolicy(entries) {
  const files = [];
  const tools = /* @__PURE__ */ new Set();
  let stale = 0;
  let candidates = 0;
  let kept = 0;
  let suppressed = 0;
  let unstructured = 0;
  for (const entry of entries) {
    for (const tool of entry.sources ?? [])
      tools.add(tool);
    if (entry.stale)
      stale += 1;
    const outcome = entry.outcome;
    if (outcome === void 0)
      continue;
    candidates += outcome.candidates;
    kept += outcome.kept;
    suppressed += outcome.suppressed;
    if (outcome.unstructured)
      unstructured += 1;
    if (outcome.suppressed > 0 && files.length < IDENTITY_CAP) {
      files.push(entry.displayPath);
    }
  }
  return {
    records: entries.length,
    stale,
    candidates,
    kept,
    dispositionSuppressed: suppressed,
    unstructured,
    files,
    tools: [...tools].slice(0, IDENTITY_CAP)
  };
}

// dist/clients/demoted-finding-render.js
var DEAD_LINE_ANNOTATION = "(line no longer exists)";
var AUTHORITY_REWRITES = [
  [
    /[^\S\n]*(?:🔴|⛔|❌)?[^\S\n]*STOP[^\S\n]*[—–-][^\S\n]*(\d+)[^\S\n]+issue\(s\)[^\S\n]+must be fixed:?/g,
    "$1 issue(s) were flagged before this file changed; the coordinates below may no longer exist:"
  ],
  [/(?:🔴|⛔|❌)[^\S\n]*STOP\b[^\S\n]*[—–-]?/g, "Previously flagged \u2014"],
  [/\bSTOP\b/g, "Previously flagged"],
  [/\bmust be fixed\b/g, "were flagged"]
];
var CITED_LINE_RE = /^([^\S\n]*)L(\d+)\b/;
var PROMOTION_NOTE_ROW = `  \u2139\uFE0F ${DELTA_UNUSED_PROMOTION_NOTE}`;
function splitBannerRegion(lines) {
  const firstCitedRow = lines.findIndex((line) => CITED_LINE_RE.test(line));
  if (firstCitedRow !== -1)
    return { bannerEnd: firstCitedRow };
  const firstNonBlank = lines.findIndex((line) => line.trim() !== "");
  return { bannerEnd: firstNonBlank === -1 ? 0 : firstNonBlank + 1 };
}
function degradeDemotedFindingBody(summary, options = {}) {
  const deadLines = new Set(options.deadLines ?? []);
  let authorityMarkersRemoved = 0;
  const sourceLines = summary.split("\n");
  const { bannerEnd } = splitBannerRegion(sourceLines);
  const degradedLines = sourceLines.map((line, index) => {
    if (index >= bannerEnd)
      return line;
    let rewritten = line;
    for (const [pattern, replacement] of AUTHORITY_REWRITES) {
      rewritten = rewritten.replace(pattern, (...args) => {
        authorityMarkersRemoved += 1;
        return replacement.replace(/\$(\d)/g, (_, digit) => String(args[Number(digit)] ?? ""));
      });
    }
    return rewritten;
  });
  const keptLines = degradedLines.filter((line) => line !== PROMOTION_NOTE_ROW);
  let body = keptLines.join("\n");
  const deadLinesAnnotated = [];
  if (deadLines.size > 0) {
    body = keptLines.map((line) => {
      const hit = CITED_LINE_RE.exec(line);
      if (!hit)
        return line;
      const cited = Number.parseInt(hit[2] ?? "", 10);
      if (!Number.isFinite(cited) || !deadLines.has(cited))
        return line;
      deadLinesAnnotated.push(cited);
      return `${hit[1] ?? ""}L${cited} ${DEAD_LINE_ANNOTATION}${line.slice(hit[0].length)}`;
    }).join("\n");
  }
  return { body, authorityMarkersRemoved, deadLinesAnnotated };
}
function formatRetirementNote(deadLines) {
  const cited = deadLines.length > 0 ? ` (cited ${deadLines.length === 1 ? "line" : "lines"} ${deadLines.join(", ")})` : "";
  return `Retired after this delivery${cited}: the file no longer has these lines, so this finding cannot be re-confirmed and will not be served again.`;
}
function formatDeliveryCapNote(deliveryCount) {
  return `Not shown again after ${deliveryCount} deliveries with no re-run: this finding may still be accurate, but re-serving it further adds no new information. A fresh dispatch of this file will re-confirm or clear it.`;
}

// dist/clients/runtime-turn.js
var LATE_AUX_COVERAGE_GAP_DETAIL_CAP_PER_TURN = 20;
var TEST_RUNNER_BATCH_CONCURRENCY = 4;
var TEST_RUNNER_MAX_TARGETS = 12;
var TURN_END_SELECTION_ROOT_ROWS = 8;
var TEST_RUNNER_BATCH_BUDGET_MS = 2e4;
var TEST_RUNNER_MAX_DEFERRALS = 2;
async function runTestTargetsBounded(args) {
  const results = [];
  if (args.targets.length === 0)
    return { results, deferred: [] };
  let stopReason;
  const batchAbort = new AbortController();
  let closed = false;
  const settledBeforeClose = /* @__PURE__ */ new Set();
  const budgetMs = Math.max(0, args.budgetMs);
  const deadline = Date.now() + budgetMs;
  const shouldStop = () => {
    if (stopReason !== void 0)
      return true;
    if (args.signal?.aborted) {
      stopReason = "abort";
      return true;
    }
    if (Date.now() >= deadline) {
      stopReason = "budget";
      return true;
    }
    return false;
  };
  const pool = mapWithConcurrency(args.targets.map((target, index) => ({ target, index })), Math.max(1, args.concurrency), async ({ target, index }) => {
    if (shouldStop())
      return;
    const running = args.run(target, batchAbort.signal);
    const stamp = running.then((value) => {
      if (closed)
        return;
      settledBeforeClose.add(index);
      results.push({ status: "fulfilled", value });
    }, (reason) => {
      if (closed)
        return;
      settledBeforeClose.add(index);
      results.push({ status: "rejected", reason });
    });
    await stamp;
  });
  void pool.catch(() => {
  });
  await new Promise((resolve32) => {
    let settled = false;
    const finish = (reason) => {
      if (settled)
        return;
      settled = true;
      if (reason !== void 0)
        stopReason ??= reason;
      closed = true;
      batchAbort.abort();
      clearTimeout(timer);
      args.signal?.removeEventListener("abort", onAbort);
      resolve32();
    };
    const onAbort = () => finish("abort");
    const timer = setTimeout(() => finish("budget"), budgetMs);
    timer.unref?.();
    if (args.signal?.aborted)
      finish("abort");
    else
      args.signal?.addEventListener("abort", onAbort, { once: true });
    void pool.then(() => finish(), () => finish());
  });
  return {
    results,
    deferred: args.targets.filter((_, index) => !settledBeforeClose.has(index)),
    stopReason
  };
}
function wouldPoisonCache(prev, next) {
  return !next.success && prev?.data.success === true;
}
var LATE_DEAD_CODE_SCANS = "dead-code-late-scans";
function lateDeadCodeScansOf(scope) {
  return scopeCell(scope, LATE_DEAD_CODE_SCANS, () => /* @__PURE__ */ new Map());
}
function joinedEarlierScan(result, askedAt) {
  return result.scannedAt !== void 0 && Date.parse(result.scannedAt) < askedAt;
}
function withRowForFailureWrite(scan, cacheManager2, cacheKey, cwd, startRow) {
  return scan.then((result) => result.success || startRow?.data.success === true ? { result, row: startRow } : cacheManager2.readCacheAsync(cacheKey, cwd).then((row) => ({ result, row })));
}
function lateDeadCodeScanKey(client, cwd) {
  return `${client.id}\0${cwd}`;
}
function deadCodeScanEvent(client, cwd, result, durationMs) {
  return {
    language: client.language,
    root: cwd,
    success: result.success,
    cached: false,
    unusedExports: result.unusedExports.length,
    unusedFiles: result.unusedFiles.length,
    unusedDeps: result.unusedDeps.length,
    unlistedDeps: result.unlistedDeps.length,
    durationMs: result.durationMs ?? durationMs,
    ...result.excludedWorktrees !== void 0 && {
      excludedWorktrees: result.excludedWorktrees
    },
    ...!result.success && { reason: result.summary }
  };
}
function dropLateDeadCodeScan(scans, key, client, reason) {
  scans.delete(key);
  incrementDegradationCount({
    kind: "dead-code-late-scan-dropped",
    subject: client.id,
    reason
  });
}
function parkLateDeadCodeScan(args) {
  const { scope, cacheManager: cacheManager2, client, cwd, cacheKey, startedAt } = args;
  const scans = lateDeadCodeScansOf(scope);
  const key = lateDeadCodeScanKey(client, cwd);
  const entry = {
    files: args.files,
    previousScan: args.previousScan,
    carry: /* @__PURE__ */ new Set(),
    settled: null,
    askedAt: startedAt
  };
  scans.set(key, entry);
  void withRowForFailureWrite(args.scan, cacheManager2, cacheKey, cwd, entry.previousScan ? { data: entry.previousScan } : null).then(({ result, row }) => {
    if (!scope.isLive()) {
      dropLateDeadCodeScan(scans, key, client, "session-ended");
      return;
    }
    const durationMs = Date.now() - startedAt;
    const cacheKept = wouldPoisonCache(row, result);
    if (!cacheKept) {
      cacheManager2.writeCache(cacheKey, result, cwd, {
        scanDurationMs: durationMs
      });
    }
    logDeadCodeScan({
      ...deadCodeScanEvent(client, cwd, result, durationMs),
      ...cacheKept && { cacheKept }
    });
    if (!result.success) {
      dropLateDeadCodeScan(scans, key, client, `scan-failed: ${result.summary}`);
      return;
    }
    entry.settled = result;
  }, (err) => dropLateDeadCodeScan(scans, key, client, `scan-threw: ${err}`));
}
var lspIdleResetTimeout = null;
var pendingSweepRearm = null;
function emitIdleResetReporterWarning(reportErr) {
  try {
    process.emitWarning(`pi-lens LSP idle reset error reporter failed: ${reportErr}`, { code: "PI_LENS_LSP_IDLE_RESET_REPORTER_FAILED" });
  } catch {
    void reportErr;
  }
}
function reportIdleResetError(onError, err) {
  try {
    onError?.(err);
  } catch (reportErr) {
    emitIdleResetReporterWarning(reportErr);
  }
}
function scheduleLSPIdleReset(resetFn, delayMs, options = {}) {
  if (lspIdleResetTimeout) {
    clearTimeout(lspIdleResetTimeout);
  }
  if (pendingSweepRearm) {
    pendingSweepRearm.cancelled = true;
    pendingSweepRearm = null;
  }
  lspIdleResetTimeout = setTimeout(() => {
    lspIdleResetTimeout = null;
    if (isWorkspaceSweepActive()) {
      const rearmToken = { cancelled: false };
      pendingSweepRearm = rearmToken;
      runWhenWorkspaceSweepIdle(() => {
        if (rearmToken.cancelled)
          return;
        if (pendingSweepRearm === rearmToken)
          pendingSweepRearm = null;
        scheduleLSPIdleReset(resetFn, delayMs, options);
      });
      return;
    }
    try {
      if (options.isCurrentSession && !options.isCurrentSession()) {
        return;
      }
      if (options.isPrimarySession && !options.isPrimarySession()) {
        return;
      }
      resetFn();
    } catch (err) {
      reportIdleResetError(options.onError, err);
    }
  }, delayMs);
  lspIdleResetTimeout.unref();
}
var DEFAULT_LSP_IDLE_RESET_MS = 24e4;
function sweepDerivedFloorMs() {
  return getFullScanWallClockMs() + SWEEP_IDLE_SAFETY_MARGIN_MS;
}
function getBaseLspIdleResetMs() {
  return Math.max(DEFAULT_LSP_IDLE_RESET_MS, sweepDerivedFloorMs());
}
function getShortenedLspIdleResetMs() {
  return Math.max(getLspBudgetIdleTimeoutMs(), sweepDerivedFloorMs());
}
function getEffectiveLspIdleResetMs() {
  return isSubagentSession() || shouldShortenLspIdleTimeout() ? getShortenedLspIdleResetMs() : getBaseLspIdleResetMs();
}
function cancelLSPIdleReset() {
  if (lspIdleResetTimeout) {
    clearTimeout(lspIdleResetTimeout);
    lspIdleResetTimeout = null;
  }
  if (pendingSweepRearm) {
    pendingSweepRearm.cancelled = true;
    pendingSweepRearm = null;
  }
}
function capTurnEndMessage(content, held = 0) {
  const maxLines = RUNTIME_CONFIG.turnEnd.maxLines;
  const maxChars = RUNTIME_CONFIG.turnEnd.maxChars;
  const marker = held > 0 ? `... (truncated; ${held} held for the next turn)` : "... (truncated)";
  let kept = content;
  let cut = false;
  const lines = kept.split("\n");
  if (lines.length > maxLines) {
    kept = lines.slice(0, maxLines).join("\n");
    cut = true;
  }
  if (kept.length > maxChars) {
    kept = sliceAtCodePointBoundaries(kept, 0, maxChars);
    cut = true;
  }
  return cut ? `${kept}
${marker}` : content;
}
function turnEndKeptChars(content) {
  const maxLines = RUNTIME_CONFIG.turnEnd.maxLines;
  const maxChars = RUNTIME_CONFIG.turnEnd.maxChars;
  const lines = content.split("\n");
  const kept = lines.length > maxLines ? lines.slice(0, maxLines).join("\n").length : content.length;
  return Math.min(kept, sliceAtCodePointBoundaries(content, 0, maxChars).length);
}
function sliceAtCodePointBoundaries(value, start, end) {
  if (start > 0 && start < value.length && isLowSurrogate(value.charCodeAt(start)) && isHighSurrogate(value.charCodeAt(start - 1))) {
    start += 1;
  }
  if (end > 0 && end < value.length && isLowSurrogate(value.charCodeAt(end)) && isHighSurrogate(value.charCodeAt(end - 1))) {
    end -= 1;
  }
  return value.slice(start, end);
}
function isHighSurrogate(codeUnit) {
  return codeUnit >= 55296 && codeUnit <= 56319;
}
function isLowSurrogate(codeUnit) {
  return codeUnit >= 56320 && codeUnit <= 57343;
}
var RESOLVED_SHARE_OF_CHARS = 0.4;
var RESOLVED_MAX_LINES = 5;
function formatWriteOrdinal(n) {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13)
    return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    // spellchecker:disable-line
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}
async function handleTurnEnd(deps) {
  const { ctxCwd, getFlag, dbg, runtime, cacheManager: cacheManager2, knipClient, deadCodeClients, depChecker, testRunnerClient, sessionId, host = "pi", owner, resetLSPService: resetLSPService2, resetFormatService: resetFormatService2 } = deps;
  const turnIndexAtDispatch = runtime.turnIndex;
  const clearOwnedTurnState = () => {
    if (runtime.turnIndex !== turnIndexAtDispatch) {
      dbg(`turn_end: retaining newer turn state (dispatch=${turnIndexAtDispatch}, current=${runtime.turnIndex})`);
      return;
    }
    cacheManager2.clearTurnState(cwd, currentOwner, isSecondarySession ? sessionId : void 0);
  };
  void updateHeartbeat().catch(() => {
  });
  const cwd = ctxCwd ?? process.cwd();
  const isSecondarySession = deps.sessionScope?.role === "secondary";
  const sessionRole = isSecondarySession ? "secondary" : "primary";
  const allowProjectWideFindings = admitsProjectWideFindings(sessionRole);
  const turnStateSessionId = isSecondarySession ? sessionId : void 0;
  let turnState = cacheManager2.readTurnState(cwd, turnStateSessionId);
  const currentOwner = {
    ...owner ?? {
      kind: "pi",
      id: sessionId ?? runtime.telemetrySessionId,
      pid: process.pid,
      lastSeen: (/* @__PURE__ */ new Date()).toISOString()
    },
    sessionStartedAt: owner?.sessionStartedAt ?? runtime.sessionStartedAt
  };
  const access = isSecondarySession ? "owned" : cacheManager2.getTurnStateAccess(cwd, currentOwner);
  const gateOwnerLabel = turnState.owner ? `${turnState.owner.kind}:${turnState.owner.id}` : turnState.sessionId ? `legacy:${turnState.sessionId}` : "none";
  const sameProcessPiSessionHandoff = access === "foreign-live" && currentOwner.kind === "pi" && turnState.owner?.kind === "pi" && turnState.owner.pid === process.pid && turnState.owner.id !== currentOwner.id;
  if (access === "foreign-live" && !sameProcessPiSessionHandoff) {
    dbg(`turn_end: foreign live owner retained (${turnState.owner?.kind ?? "legacy"}:${turnState.owner?.id ?? turnState.sessionId})`);
    return;
  }
  if (access === "available" && (turnState.files || turnState.owner || turnState.sessionId)) {
    dbg("turn_end: evicting stale turn-state owner");
    clearOwnedTurnState();
    turnState = cacheManager2.readTurnState(cwd, turnStateSessionId);
  }
  const ownFiles = Object.keys(turnState.files);
  const files = ownFiles;
  let widgetDemotedFindingsRetired = 0;
  for (const wPath of drainRenderedDependencyDriftFilePaths()) {
    const deliveryCount = incrementWidgetDependencyDriftDelivery(wPath);
    if (deliveryCount >= DEPENDENCY_DRIFT_MAX_DELIVERIES) {
      const capRetired = retireWidgetDependencyDriftBlockers(wPath);
      if (capRetired) {
        widgetDemotedFindingsRetired += 1;
        incrementDegradationCount({
          kind: "demoted-finding-retired",
          subject: `widget-blocker:${toRunnerDisplayPath(cwd, wPath)}`,
          reason: `capped after ${deliveryCount} deliveries with no re-run; hidden from the pi-lens footer, still listed by lens_diagnostics mode=all \u2014 re-run can still confirm`
        });
      }
    }
  }
  if (files.length === 0 && !runtime.hasCascadeRuns() && !isSecondarySession) {
    if (getFlag("lens-guard") && !runtime.gitGuardHasBlockers) {
      const guardRecord = cacheManager2.readCache("turn-end-findings", cwd)?.data;
      if (guardRecord?.sessionId === runtime.telemetrySessionId && guardRecord.testFailures !== true) {
        cacheManager2.clearCache("turn-end-findings", cwd);
      }
    }
    const idleResetMs = getEffectiveLspIdleResetMs();
    dbg(`turn_end: no modified files, scheduling LSP idle reset (${idleResetMs / 1e3}s)`);
    if (!getFlag("no-lsp")) {
      const sessionGeneration = runtime.sessionGeneration;
      scheduleLSPIdleReset(resetLSPService2, idleResetMs, {
        isCurrentSession: () => runtime.isCurrentSession(sessionGeneration),
        // #2157 fix round 2: a secondary (subagent) evaluation's own timer
        // must not release the primary's shared fleet — see the option's
        // doc comment on `scheduleLSPIdleReset`.
        isPrimarySession: () => {
          const activePrimarySessionId = getActiveSessionId();
          return activePrimarySessionId === void 0 || activePrimarySessionId === runtime.telemetrySessionId;
        },
        onError: (err) => dbg(`lsp idle reset failed: ${err}`)
      });
    }
    resetFormatService2();
    if (pendingRunnerFindingsSize() === 0 && !runtime.hasResolvedBlockerFiles())
      return;
  }
  if (files.length > 0 && (lspIdleResetTimeout || pendingSweepRearm)) {
    cancelLSPIdleReset();
    dbg("turn_end: cancelled pending LSP idle reset (active editing)");
  }
  dbg(`turn_end: ${files.length} file(s) modified, cycles: ${turnState.turnCycles}/${turnState.maxCycles}, access: ${access}, owner: ${gateOwnerLabel}`);
  if (cacheManager2.isMaxCyclesExceeded(cwd, turnStateSessionId)) {
    dbg("turn_end: max cycles exceeded, clearing state and forcing through");
    clearOwnedTurnState();
    runtime.fixedThisTurn.clear();
    resetFormatService2();
    return;
  }
  const turnEndStart = Date.now();
  const blockerParts = [];
  const staleSecretParts = [];
  const advisoryParts = [];
  const deliveryHolds = [];
  const turnScope = deps.sessionScope ?? runtime.sessionScope;
  const holdScope = runtime.captureSessionGeneration();
  const carryScope = sessionId ?? runtime.telemetrySessionId;
  const carryLane = (...parts) => [carryScope, ...parts].join(":");
  const takeParked = (lane) => holdScope.guardedWrite(`turn-end:${lane}`, () => runtime.takeCutAdvisoryItems(lane)) ?? [];
  const cutAdvisoryHold = (family, lane, part, shown2, isReOffer) => {
    const fresh = shown2.filter((item) => !isReOffer(item));
    const recordDropped = (reason) => {
      incrementDegradationCount({
        kind: "turn-end-advisory-carry-dropped",
        subject: family,
        reason
      });
    };
    return {
      part,
      canHold: () => fresh.length > 0,
      onHeld: () => {
        for (const evicted of runtime.parkCutAdvisoryItems(lane, fresh)) {
          recordDropped(`${evicted} evicted: more lanes had cut items parked than the carry bound keeps`);
        }
        if (fresh.length < shown2.length) {
          recordDropped("the cap cut items this lane had already re-offered once");
        }
      },
      onDropped: () => recordDropped("the cap cut a part that showed only items it had already re-offered once")
    };
  };
  const projectDiagnosticsDelta = [];
  const projectDiagnosticsSources = /* @__PURE__ */ new Set();
  const runnerFindingsStart = Date.now();
  const runnerDrainSignal = deps.signal;
  const deliverySessionId = sessionId ?? runtime.telemetrySessionId;
  const pendingRunnerFindings = await bounded(drainPendingRunnerFindings(0, runtime.sessionScope.capture(), deliverySessionId), {
    ms: HOOK_WALL_BUDGET_MS.turn_end,
    signal: runnerDrainSignal,
    hook: "turn_end",
    label: "drainPendingRunnerFindings"
  }) ?? [];
  let runnerFindingsDelivered = 0;
  let runnerFindingsStale = 0;
  let runnerFindingsFailed = 0;
  let runnerFindingsDropped = 0;
  let runnerBlockersRecorded = 0;
  let runnerFindingsDispositionSuppressed = 0;
  const runnerFindingsDeliveredIds = [];
  for (const pending2 of pendingRunnerFindings) {
    const result = pending2.result;
    if (!result)
      continue;
    recordRunner(pending2.filePath, pending2.runnerId, result.status, result.diagnostics.length, Date.now() - pending2.markedAtMs, pending2.writeIndex);
    if (result.status === "failed" && !hasUsableResult(result)) {
      runnerFindingsFailed += 1;
      const detail = result.failureMessage ? `: ${result.failureMessage}` : "";
      const failedNote = `\u274C Deferred runner ${pending2.runnerId} failed (${result.failureKind ?? "unknown"})${detail}`;
      deliveryHolds.push({
        part: failedNote,
        onHeld: () => requeueRunnerFindings({
          ...pending2,
          result: { ...result, diagnostics: [] }
        })
      });
      advisoryParts.push(failedNote);
    }
    const verdict = judgeDeferredRunnerFindings(pending2, cwd);
    runnerFindingsStale += verdict.stale;
    if (verdict.stale > 0) {
      dropStaleRunnerFindings(pending2);
      runnerFindingsDropped += 1;
    }
    if (verdict.live === 0)
      continue;
    const displayPath = toRunnerDisplayPath(cwd, pending2.filePath);
    const runnerKept = verdict.kept;
    runnerFindingsDispositionSuppressed += verdict.suppressed;
    if (runnerKept.length === 0) {
      continue;
    }
    runnerFindingsDelivered += runnerKept.length;
    runnerBlockersRecorded += recordDeferredRunnerBlockers(runtime, pending2, runnerKept, verdict.bytes);
    for (const finding of runnerKept) {
      if (runnerFindingsDeliveredIds.length < 50) {
        runnerFindingsDeliveredIds.push(finding.id);
      }
    }
    const advisoryKept = runnerKept.flatMap((finding) => finding.semantic === "blocking" ? [] : [finding]);
    if (advisoryKept.length === 0)
      continue;
    const lines = advisoryKept.map((finding) => `  ${displayPath}:${finding.line ?? 1}:${finding.column ?? 1} [${finding.rule ?? finding.id}] ${finding.message}`);
    const runnerSuppressedNote = verdict.suppressed > 0 ? `; suppressed by disposition: ${verdict.suppressed} finding(s)` : "";
    const lateRunnerPart = `\u23F1\uFE0F Late runner diagnostics (${pending2.runnerId} completed after the edit${runnerSuppressedNote}):
${lines.join("\n")}`;
    const { failureKind: _kind, failureMessage: _message, ...findingsOnly } = result;
    deliveryHolds.push({
      part: lateRunnerPart,
      onHeld: () => requeueRunnerFindings({
        ...pending2,
        result: findingsResult(advisoryKept, findingsOnly)
      })
    });
    advisoryParts.push(lateRunnerPart);
  }
  logLatency({
    type: "phase",
    toolName: "turn_end",
    filePath: cwd,
    phase: "late_runner_findings",
    durationMs: Date.now() - runnerFindingsStart,
    metadata: {
      pending: pendingRunnerFindings.length,
      delivered: runnerFindingsDelivered,
      stale: runnerFindingsStale,
      failed: runnerFindingsFailed,
      dropped: runnerFindingsDropped,
      blockersRecorded: runnerBlockersRecorded,
      dispositionSuppressed: runnerFindingsDispositionSuppressed,
      deliveredIds: runnerFindingsDeliveredIds
    }
  });
  const blockerPastEofStart = Date.now();
  const blockerPastEof = sweepInlineBlockerPastEof(runtime, cwd);
  logLatency({
    type: "phase",
    toolName: "turn_end",
    filePath: cwd,
    phase: "blocker_past_eof_sweep",
    durationMs: Date.now() - blockerPastEofStart,
    metadata: {
      total: blockerPastEof.total,
      checked: blockerPastEof.checked,
      demoted: blockerPastEof.demoted
      // #1944 review F3: `healed` is gone. Retirement makes the falling edge
      // unreachable on this store, so the field could only ever log zero —
      // see `BlockerPastEofCounts`.
    }
  });
  let demotedFindingsRetired = 0;
  const retirePastEofOnDelivery = (bPath, deadLines, displayPath) => () => {
    if (!runtime.retireDemotedPastEofBlocker(bPath, deadLines))
      return;
    runtime.updateGitGuardStatus(false, "");
    demotedFindingsRetired += 1;
    incrementDegradationCount({
      kind: "demoted-finding-retired",
      subject: `inline-blocker:${displayPath}`,
      reason: `file shrank past cited line(s) ${deadLines.join(", ")}; retired after one degraded delivery`
    });
  };
  const countDriftDeliveryOnDelivery = (bPath, displayPath) => () => {
    const deliveryCount = runtime.incrementInlineBlockerStaleDelivery(bPath);
    if (deliveryCount < DEPENDENCY_DRIFT_MAX_DELIVERIES)
      return;
    if (!runtime.retireDemotedDependencyDriftBlocker(bPath))
      return;
    runtime.updateGitGuardStatus(false, "");
    demotedFindingsRetired += 1;
    incrementDegradationCount({
      kind: "demoted-finding-retired",
      subject: `inline-blocker:${displayPath}`,
      reason: `capped after ${deliveryCount} deliveries with no re-run; re-run can still confirm`
    });
  };
  const blockerFreshnessStart = Date.now();
  const blockerFreshness = await sweepInlineBlockerFreshness(runtime, cwd, {
    // #2982: the hook's own signal, so the self axis's filesystem work is
    // bounded by the same abort everything else in this handler honours.
    ...deps.signal === void 0 ? {} : { signal: deps.signal },
    additionalEntries: getWidgetBlockingFilesForSweep().map((row) => ({
      filePath: row.filePath,
      recordedAtMs: row.recordedAtMs,
      demote: () => markWidgetFileBlockersStale(row.filePath, "dependency-drift")
    }))
  });
  logLatency({
    type: "phase",
    toolName: "turn_end",
    filePath: cwd,
    phase: "blocker_freshness_sweep",
    durationMs: Date.now() - blockerFreshnessStart,
    metadata: {
      total: blockerFreshness.total,
      kept: blockerFreshness.kept,
      revalidated: blockerFreshness.revalidated,
      alreadyStale: blockerFreshness.alreadyStale,
      truncatedImports: blockerFreshness.truncatedImports,
      selfHealed: blockerFreshness.selfHealed,
      selfUnverifiable: blockerFreshness.selfUnverifiable,
      hashBudgetExhausted: blockerFreshness.hashBudgetExhausted
    }
  });
  const unresolvedBlockers = runtime.getInlineBlockersSnapshot();
  const inlinePolicyEntries = [];
  const policySuppressedPaths = [];
  const inlinePolicyStart = Date.now();
  for (const record of unresolvedBlockers) {
    const { filePath: bPath, summary, stale, staleReason } = record;
    const displayPath = toRunnerDisplayPath(cwd, bPath);
    const tally = { displayPath, sources: record.sources };
    if (stale) {
      inlinePolicyEntries.push({ ...tally, stale: true });
      const deadLines = blockerPastEof.deadLinesByPath.get(bPath) ?? [];
      const degraded = degradeDemotedFindingBody(summary, { deadLines });
      const retires = runtime.wouldRetireDemotedPastEofBlocker(bPath, deadLines);
      let retirementNote;
      if (retires) {
        retirementNote = formatRetirementNote(deadLines);
      } else if (staleReason === "dependency-drift") {
        const tentativeCount = runtime.peekInlineBlockerStaleDeliveryCount(bPath) + 1;
        if (tentativeCount >= DEPENDENCY_DRIFT_MAX_DELIVERIES) {
          retirementNote = formatDeliveryCapNote(tentativeCount);
        }
      }
      const advisoryPart = `${STALE_LINE_MARKER} ${displayPath}:
${degraded.body}` + (retirementNote ? `
${retirementNote}` : "");
      advisoryParts.push(advisoryPart);
      if (retires) {
        deliveryHolds.push({
          part: advisoryPart,
          onDelivered: retirePastEofOnDelivery(bPath, deadLines, displayPath)
        });
      } else if (staleReason === "dependency-drift") {
        deliveryHolds.push({
          part: advisoryPart,
          onDelivered: countDriftDeliveryOnDelivery(bPath, displayPath),
          skipOnSuppressed: true
        });
      }
    } else {
      const policy = applyInlineBlockerPolicy(record, cwd);
      inlinePolicyEntries.push({ ...tally, stale: false, outcome: policy });
      if (policy.body === void 0) {
        policySuppressedPaths.push(bPath);
        continue;
      }
      const suppressedNote = policy.suppressed > 0 ? ` (suppressed by disposition: ${policy.suppressed} finding(s))` : "";
      blockerParts.push(`Unresolved from this turn \u2014 ${displayPath}${suppressedNote}:
${policy.body}`);
    }
  }
  const guardLatchBefore = runtime.gitGuardHasBlockers;
  resyncGitGuardAfterInlinePolicy({
    runtime,
    suppressedFilePaths: policySuppressedPaths
  });
  if (inlinePolicyEntries.length > 0) {
    logLatency({
      type: "phase",
      toolName: "turn_end",
      filePath: cwd,
      phase: "inline_blocker_policy",
      durationMs: Date.now() - inlinePolicyStart,
      metadata: {
        ...summarizeInlineBlockerPolicy(inlinePolicyEntries),
        // #3248: one row per TURN for the gate outcome, never per finding
        // — the flip is the event a reader needs to explain why a commit
        // that was blocked is now allowed.
        guardFilesSuppressed: policySuppressedPaths.length,
        guardLatchCleared: guardLatchBefore && !runtime.gitGuardHasBlockers
      }
    });
  }
  const cascadeSettleStart = Date.now();
  const cascadeSettleSignal = deps.signal;
  const { settled, timedOut } = await bounded(runtime.settleCascadeRuns(cascadeSettleWaitMs(), {
    trackTurnEndClock: true,
    generation: holdScope
  }), {
    ms: HOOK_WALL_BUDGET_MS.turn_end,
    signal: cascadeSettleSignal,
    hook: "turn_end",
    label: "settleCascadeRuns"
  }) ?? { settled: 0, timedOut: 0 };
  logLatency({
    type: "phase",
    toolName: "turn_end",
    filePath: cwd,
    phase: "cascade_settle_wait",
    durationMs: Date.now() - cascadeSettleStart,
    metadata: { settled, timedOut }
  });
  const t0 = Date.now();
  const cascadeRuns = (holdScope.guardedWrite("turn-end:cascade-runs", () => runtime.consumeCascadeRuns()) ?? []).filter((run) => {
    const originSeq = run.origin?.projectSeq;
    const originTurn = run.origin?.turnSeq;
    if (originSeq !== void 0) {
      const changedSince = runtime.getFilesChangedSince(originSeq);
      if (changedSince.length > 0) {
        const changedSet = new Set(changedSince);
        const primaryKey = normalizeMapKey(path24.resolve(run.filePath));
        const neighborKeys = [
          ...(run.result?.neighbors ?? []).map((n) => n.filePath),
          ...run.selectedNeighborPaths ?? []
        ].map((filePath) => normalizeMapKey(path24.resolve(filePath)));
        const supersededByOwnFile = changedSet.has(primaryKey) || neighborKeys.some((k) => changedSet.has(k));
        if (supersededByOwnFile) {
          logCascade({
            phase: "cascade_carry_over_drop",
            filePath: run.filePath,
            neighborCount: run.neighborCount,
            diagnosticCount: run.diagnosticCount,
            reason: "superseded_by_later_write",
            metadata: {
              originProjectSeq: originSeq,
              projectSeq: runtime.projectSeq,
              originTurnSeq: originTurn,
              turnIndex: runtime.turnIndex,
              carriedTurns: run.carriedTurns,
              changedFiles: changedSince
            }
          });
          return false;
        }
      }
    }
    return true;
  });
  const cascadeResults = cascadeRuns.flatMap((r) => r.result ? [r.result] : []);
  let carriedRunsRendered = 0;
  let labeledAdvisories = 0;
  const carriedMetaByResult = /* @__PURE__ */ new Map();
  const runByResult = /* @__PURE__ */ new Map();
  for (const r of cascadeRuns) {
    if (r.result)
      runByResult.set(r.result, r);
    if (r.result && (r.carriedTurns ?? 0) > 0 && r.carriedTurns !== void 0) {
      carriedMetaByResult.set(r.result, {
        carriedTurns: r.carriedTurns,
        observedAt: r.observedAt
      });
    }
  }
  const cascadeLogFilePath = cascadeResults[0]?.filePath ?? files[0] ?? cwd;
  if (cascadeResults.length > 0) {
    const seen = /* @__PURE__ */ new Map();
    for (const result of cascadeResults) {
      seen.set(normalizeMapKey(result.filePath), result);
    }
    const neighborOwner = /* @__PURE__ */ new Map();
    for (const result of [...seen.values()].reverse()) {
      const pk = normalizeMapKey(result.filePath);
      for (const n of result.neighbors) {
        const nk = normalizeMapKey(n.filePath);
        if (!neighborOwner.has(nk))
          neighborOwner.set(nk, pk);
      }
    }
    const parts = [];
    const sectionRuns = [];
    let injectedNeighborCount = 0;
    let injectedDiagnosticCount = 0;
    let suppressedByOwnership = 0;
    for (const result of seen.values()) {
      const pk = normalizeMapKey(result.filePath);
      const ownsAny = result.neighbors.some((n) => neighborOwner.get(normalizeMapKey(n.filePath)) === pk);
      if (ownsAny && result.formatted) {
        const carryMeta = carriedMetaByResult.get(result);
        const carrySuffix = cascadeCarrySuffix(carryMeta?.carriedTurns, carryMeta?.observedAt);
        parts.push(carrySuffix ? `${result.formatted}
${carrySuffix}` : result.formatted);
        if (carrySuffix)
          carriedRunsRendered += 1;
        const sectionRun = runByResult.get(result);
        if (sectionRun)
          sectionRuns.push(sectionRun);
        injectedNeighborCount += result.neighbors.length;
        injectedDiagnosticCount += result.neighbors.reduce((s, n) => s + n.diagnostics.length, 0);
      } else if (!ownsAny && result.formatted) {
        suppressedByOwnership++;
      }
    }
    const neighborFilesWithErrors = cascadeResults.flatMap((r) => r.neighbors).filter((n) => n.diagnostics.length > 0).map((n) => n.filePath);
    const uniqueNeighborFiles = [...new Set(neighborFilesWithErrors)];
    let testSuggestionCount = 0;
    if (uniqueNeighborFiles.length > 0 && typeof testRunnerClient.suggestTestFiles === "function") {
      const testSuggestions = testRunnerClient.suggestTestFiles(uniqueNeighborFiles, cwd);
      testSuggestionCount = testSuggestions.length;
      logCascade({
        phase: "cascade_test_targets",
        filePath: cascadeLogFilePath,
        neighborCount: uniqueNeighborFiles.length,
        metadata: {
          neighborFiles: uniqueNeighborFiles.slice(0, 10),
          suggestedTestFiles: testSuggestions.slice(0, 10).map((s) => s.testFile),
          runner: testSuggestions[0]?.runner,
          truncated: testSuggestions.length > 10,
          zeroSuggestions: testSuggestions.length === 0
        }
      });
      if (testSuggestions.length > 0) {
        const testLines = testSuggestions.slice(0, 5).map((s) => `  ${toRunnerDisplayPath(cwd, s.testFile)} (${s.runner})`);
        let testSection = `\u{1F9EA} Likely tests for affected neighbors:
${testLines.join("\n")}`;
        if (testSuggestions.length > 5) {
          testSection += `
  ... and ${testSuggestions.length - 5} more`;
        }
        parts.push(testSection);
      }
    }
    if (parts.length > 0) {
      const section = parts.join("\n\n");
      blockerParts.push(section);
      deliveryHolds.push({
        part: section,
        onHeld: () => {
          for (const run of sectionRuns)
            runtime.appendCascadeRun(run);
        }
      });
      logCascade({
        phase: "cascade_injected",
        filePath: cascadeLogFilePath,
        neighborCount: injectedNeighborCount,
        diagnosticCount: injectedDiagnosticCount,
        metadata: {
          sectionChars: section.length,
          testSuggestionCount,
          suppressedByOwnership
        }
      });
    }
    logCascade({
      phase: "cascade_turn_end",
      filePath: cascadeLogFilePath,
      neighborCount: cascadeResults.reduce((s, r) => s + r.neighbors.length, 0),
      diagnosticCount: cascadeResults.reduce((s, r) => s + r.neighbors.reduce((ns, n) => ns + n.diagnostics.length, 0), 0),
      metadata: {
        fileCount: cascadeResults.length,
        mergedResults: seen.size
      }
    });
  }
  const indeterminateRuns = cascadeRuns.filter((r) => r.indeterminate);
  if (indeterminateRuns.length > 0) {
    const buildAdvisory = (runs, frame) => {
      if (runs.length === 0)
        return void 0;
      const byDetail = /* @__PURE__ */ new Map();
      for (const r of runs) {
        const detail = r.indeterminate?.detail ?? frame.fallbackDetail(r);
        const files2 = byDetail.get(detail) ?? [];
        files2.push(toRunnerDisplayPath(cwd, r.filePath));
        byDetail.set(detail, files2);
      }
      const lines = [];
      for (const [detail, filesRaw] of byDetail) {
        const files2 = [...new Set(filesRaw)];
        const shown2 = files2.slice(0, 5).join(", ");
        const more = files2.length > 5 ? ` (+${files2.length - 5} more)` : "";
        lines.push(`  \u2022 ${detail}: ${shown2}${more}`);
      }
      const fileCount2 = new Set(runs.map((r) => normalizeMapKey(r.filePath))).size;
      const reasons = [...byDetail.keys()].join("; ");
      return `${frame.lead(fileCount2, reasons)}
${lines.join("\n")}`;
    };
    const graphRuns = indeterminateRuns.filter((r) => r.indeterminate?.reason !== "lsp_binding_rejected" && r.indeterminate?.reason !== "excluded_by_role" && r.indeterminate?.reason !== "budget_truncated" && r.indeterminate?.budget === void 0);
    const bindingRuns = indeterminateRuns.filter((r) => r.indeterminate?.reason === "lsp_binding_rejected" && r.indeterminate?.budget === void 0);
    const budgetRuns = indeterminateRuns.filter((r) => r.indeterminate?.reason === "budget_truncated" || r.indeterminate?.budget !== void 0);
    const withCarryLabel = (advisory, runs) => {
      if (advisory === void 0)
        return void 0;
      const carried = runs.filter((r) => (r.carriedTurns ?? 0) > 0);
      if (carried.length === 0 || carried.length !== runs.length) {
        return advisory;
      }
      const stamps = carried.map((r) => r.observedAt);
      const observedAt = stamps.every((s) => s !== void 0) ? Math.min(...stamps) : void 0;
      const suffix = cascadeCarrySuffix(carried[0]?.carriedTurns, observedAt);
      if (!suffix)
        return advisory;
      labeledAdvisories += 1;
      return `${advisory}
${suffix}`;
    };
    const holdAdvisory = (advisory, runs) => {
      if (advisory === void 0)
        return;
      deliveryHolds.push({
        part: advisory,
        onHeld: () => {
          for (const run of runs)
            runtime.appendCascadeRun({ ...run, result: void 0 });
        }
      });
    };
    const graphAdvisory = withCarryLabel(buildAdvisory(graphRuns, {
      lead: (fileCount2, reasons) => `Cascade could not compute downstream impact for ${fileCount2} edited file(s) this turn \u2014 the review graph was unavailable (${reasons}), so their dependents were not cascade-checked and a clean cascade result does not cover them.`,
      fallbackDetail: (r) => r.indeterminate?.reason === "missing_node" ? "changed file not in the review graph" : "review graph unavailable"
    }), graphRuns);
    if (graphAdvisory)
      advisoryParts.push(graphAdvisory);
    holdAdvisory(graphAdvisory, graphRuns);
    const bindingAdvisory = withCarryLabel(buildAdvisory(bindingRuns, {
      lead: (fileCount2, reasons) => `Cascade identified dependents for ${fileCount2} edited file(s) this turn, but their diagnostics could not be freshly confirmed (${reasons}) and were withheld \u2014 a clean cascade result does not cover them.`,
      fallbackDetail: () => "cascade diagnostics withheld (binding rejected)"
    }), bindingRuns);
    if (bindingAdvisory)
      advisoryParts.push(bindingAdvisory);
    holdAdvisory(bindingAdvisory, bindingRuns);
    const budgetAdvisory = withCarryLabel(buildAdvisory(budgetRuns, {
      lead: (fileCount2, reasons) => `Cascade checked the selected neighbors for ${fileCount2} edited file(s) this turn, but some eligible dependents were not checked because the cascade budget was exhausted (${reasons}); a clean cascade result does not cover them.`,
      fallbackDetail: (r) => {
        const budget = r.indeterminate?.budget;
        if (!budget)
          return "cascade budget omitted eligible dependents";
        const detail = `cascade budget checked ${budget.selectedCount} of ${budget.eligibleCount} eligible dependents (${budget.truncatedCount} omitted)`;
        return budget.transitiveTruncated ? `${detail}; transitive expansion was capped before all eligible dependents were enumerated` : detail;
      }
    }), budgetRuns);
    if (budgetAdvisory)
      advisoryParts.push(budgetAdvisory);
    holdAdvisory(budgetAdvisory, budgetRuns);
    const fileCount = new Set(indeterminateRuns.map((r) => normalizeMapKey(r.filePath))).size;
    const byFile = indeterminateRuns.map((r) => ({
      file: toRunnerDisplayPath(cwd, r.filePath),
      reason: r.indeterminate?.reason,
      ...r.indeterminate?.detail && { detail: r.indeterminate.detail },
      ...r.indeterminate?.budget && { budget: r.indeterminate.budget },
      ...r.indeterminate?.diagnostic && {
        diagnostic: r.indeterminate.diagnostic
      }
    }));
    logCascade({
      phase: "cascade_indeterminate",
      // The first indeterminate run's own file. `files[0] ?? cwd` survives only
      // as a last resort for a run with no path at all.
      filePath: indeterminateRuns[0]?.filePath ?? files[0] ?? cwd,
      metadata: {
        fileCount,
        reasons: indeterminateRuns.map((r) => r.indeterminate?.reason),
        byFile: byFile.slice(0, 20),
        ...byFile.length > 20 && { byFileTruncated: byFile.length - 20 }
      }
    });
  }
  if (carriedRunsRendered > 0 || labeledAdvisories > 0) {
    logCascade({
      phase: "cascade_carry_rendered",
      filePath: cascadeLogFilePath,
      metadata: { carriedRunsRendered, labeledAdvisories }
    });
  }
  const cascadeSkipped = {
    blockers: 0,
    non_code: 0,
    no_neighbors: 0,
    clean: 0,
    indeterminate: 0,
    error: 0
  };
  for (const r of cascadeRuns) {
    if (r.skipReason)
      cascadeSkipped[r.skipReason] = (cascadeSkipped[r.skipReason] ?? 0) + 1;
  }
  logLatency({
    type: "phase",
    toolName: "turn_end",
    filePath: cwd,
    phase: "cascade_merge",
    durationMs: Date.now() - t0,
    metadata: {
      runsTotal: cascadeRuns.length,
      resultCount: cascadeResults.length,
      neighborCount: cascadeRuns.reduce((s, r) => s + r.neighborCount, 0),
      diagnosticCount: cascadeRuns.reduce((s, r) => s + r.diagnosticCount, 0),
      skipped: cascadeSkipped
    }
  });
  const knipScan = resolveKnipScanRoots(cwd, files);
  for (const root of knipScan.overCap) {
    incrementDegradationCount({
      kind: "turn-end-knip-root-skipped",
      subject: "root-cap",
      reason: `${toRunnerDisplayPath(cwd, root)} not scanned: more than ${MAX_KNIP_ROOTS_PER_TURN} checkouts edited this turn`
    });
  }
  const KNOWN_SLOW_KNIP_GRACE_MS = 1;
  const KNIP_MAX_SHOWN = 5;
  const applyKnipResult = (scanRoot, prevKnip, knipResult, rowNow) => {
    const knipWouldPoison = wouldPoisonCache(rowNow, knipResult);
    if (knipWouldPoison) {
      dbg(`turn_end: keeping last good knip cache; this run failed: ${knipResult.summary}`);
    } else {
      cacheManager2.writeCache("knip", knipResult, scanRoot);
    }
    const knipMeta = {
      execution: knipResult.execution ?? "executed",
      success: knipResult.success,
      totalIssues: knipResult.issues.length,
      newIssues: 0,
      blockerIssues: 0,
      // #3248: bounded per-turn, on the row this lane already writes —
      // never one record per finding.
      dispositionSuppressed: 0,
      ...!knipResult.success && { reason: knipResult.summary },
      ...knipResult.failureKind && { failureKind: knipResult.failureKind },
      ...knipResult.nestedWorktrees !== void 0 && {
        nestedWorktrees: knipResult.nestedWorktrees,
        nestedFilesDropped: knipResult.nestedFilesDropped
      },
      ...knipWouldPoison && { cacheKept: true }
    };
    const knipBlockerLane = carryLane("knip", scanRoot, "blocker");
    const knipAdvisoryLane = carryLane("knip", scanRoot, "advisory");
    const parkedKnip = knipResult.success ? [
      ...takeParked(knipBlockerLane),
      ...takeParked(knipAdvisoryLane)
    ] : [];
    if (knipResult.success && knipResult.issues.length > 0) {
      const issueKey = (i) => stableFindingKey(i.type, i.file, i.name, i.package);
      const prevKeys = new Set((prevKnip?.data?.issues ?? []).map(issueKey));
      const modifiedSet = new Set(files.map((f) => resolveRunnerPath(cwd, f)));
      const newIssues = knipResult.issues.filter((issue) => {
        if (prevKeys.has(issueKey(issue)))
          return false;
        if (!issue.file)
          return false;
        const abs = resolveRunnerPath(scanRoot, issue.file);
        return modifiedSet.has(abs);
      });
      knipMeta.newIssues = newIssues.length;
      const reOffered = stillReportedParked(parkedKnip, knipResult.issues, issueKey, new Set(newIssues.map(issueKey)));
      const reOfferedKeys = new Set(reOffered.map(issueKey));
      if (reOffered.length > 0)
        knipMeta.reOffered = reOffered.length;
      if (newIssues.length > 0) {
        projectDiagnosticsDelta.push(...knipIssuesToProjectDiagnostics(scanRoot, newIssues));
        projectDiagnosticsSources.add("knip");
      }
      const knipPaired = [...newIssues, ...reOffered].flatMap((issue) => knipIssuesToProjectDiagnostics(scanRoot, [issue]).map((diagnostic) => ({
        issue,
        diagnostic
      })));
      const knipFiltered = filterFindingsByDisposition(knipPaired, cwd, (pair) => pair.diagnostic);
      const knipDeliverable = {
        kept: knipFiltered.kept.map((pair) => pair.issue),
        suppressed: knipFiltered.suppressed
      };
      knipMeta.dispositionSuppressed = knipDeliverable.suppressed;
      const displayPath = (issue) => issue.file ? toRunnerDisplayPath(cwd, resolveRunnerPath(scanRoot, issue.file)) : "(unknown)";
      const blockerIssues = knipDeliverable.kept.filter((i) => i.type === "unlisted" || i.type === "bin");
      knipMeta.blockerIssues = blockerIssues.length;
      if (blockerIssues.length > 0) {
        let report = "\u{1F534} New unresolved imports/deps in modified code (Knip):\n";
        let firstPath = null;
        for (const issue of blockerIssues.slice(0, KNIP_MAX_SHOWN)) {
          const display = displayPath(issue);
          if (!firstPath && display !== "(unknown)")
            firstPath = display;
          report += `  ${display}${issue.line ? `:${issue.line}` : ""} \u2014 ${issue.type}: ${issue.name}
`;
        }
        if (firstPath) {
          report += `  First location: ${firstPath}
`;
        }
        blockerParts.push(report);
        deliveryHolds.push(cutAdvisoryHold("knip", knipBlockerLane, report, blockerIssues.slice(0, KNIP_MAX_SHOWN), (issue) => reOfferedKeys.has(issueKey(issue))));
      }
      const unusedExportDelta = knipDeliverable.kept.filter((i) => i.type === "export" || i.type === "enumMember");
      if (unusedExportDelta.length > 0) {
        let report = "\u26A0\uFE0F Newly unused exports in files you edited \u2014 check if callers need updating (Knip):\n";
        for (const issue of unusedExportDelta.slice(0, KNIP_MAX_SHOWN)) {
          const display = displayPath(issue);
          report += `  ${display}${issue.line ? `:${issue.line}` : ""} \u2014 ${issue.name}
`;
        }
        advisoryParts.push(report);
        deliveryHolds.push(cutAdvisoryHold("knip", knipAdvisoryLane, report, unusedExportDelta.slice(0, KNIP_MAX_SHOWN), (issue) => reOfferedKeys.has(issueKey(issue))));
      }
    }
    return knipMeta;
  };
  const logKnipRow = (root, startedAt, metadata) => logLatency({
    type: "phase",
    toolName: "turn_end",
    filePath: root,
    phase: "knip",
    durationMs: Date.now() - startedAt,
    metadata
  });
  if (runtime.isStartupScanInFlight("knip")) {
    dbg("turn_end: skipping knip (startup scan still in flight)");
    logKnipRow(cwd, Date.now(), { skipped: true });
  } else {
    let budgetSpent = false;
    for (const scanRoot of knipScan.roots) {
      if (budgetSpent) {
        incrementDegradationCount({
          kind: "turn-end-knip-root-skipped",
          subject: "budget",
          reason: `${toRunnerDisplayPath(cwd, scanRoot)} not scanned: an earlier knip scan spent the turn_end budget`
        });
        continue;
      }
      const startedAt = Date.now();
      const prevKnip = cacheManager2.readCache("knip", scanRoot);
      const previousFailedHard = prevKnip && !prevKnip.data.success && !prevKnip.data.failureKind && isHardFailureSummary(prevKnip.data.summary);
      const abandonedFailure = previousFailedHard ? null : knipClient.recentHardFailure?.(scanRoot) ?? null;
      let metadata;
      if (previousFailedHard || abandonedFailure !== null) {
        const reason = previousFailedHard ? prevKnip.data.summary : abandonedFailure ?? "";
        dbg(`turn_end: skipping knip after recent failure: ${reason}`);
        metadata = { skipped: true, reason };
      } else {
        const remainingMs = Math.max(0, HOOK_WALL_BUDGET_MS.turn_end - (Date.now() - turnEndStart));
        const scanFloorMs = knipClient.scanFloorMs?.(scanRoot);
        const knownSlow = scanFloorMs !== void 0 && scanFloorMs > remainingMs;
        const scanned = await bounded(withRowForFailureWrite(knipClient.analyze(scanRoot, getKnipIgnorePatterns(), {
          projectSeq: runtime.projectSeq
        }), cacheManager2, "knip", scanRoot, prevKnip), {
          ms: knownSlow ? KNOWN_SLOW_KNIP_GRACE_MS : remainingMs,
          signal: deps.signal,
          hook: "turn_end",
          label: "knip"
        });
        if (scanned === void 0) {
          dbg(`turn_end: knip for ${scanRoot} outlived the turn_end budget`);
          const aborted = deps.signal?.aborted === true;
          const nestedWorktrees = knipClient.nestedWorktrees?.(scanRoot) ?? 0;
          metadata = {
            execution: "deferred",
            aborted,
            ...knownSlow && {
              reason: "scan-exceeds-budget",
              scanFloorMs
            },
            ...nestedWorktrees > 0 && { nestedWorktrees }
          };
          if (nestedWorktrees > 0 && !aborted) {
            incrementDegradationCount({
              kind: "turn-end-knip-nested-worktrees",
              subject: toRunnerDisplayPath(cwd, scanRoot),
              reason: `${nestedWorktrees} linked worktree(s) nested under the scan root: knip walks them as project files and the scan did not fit the turn_end budget; add their directory (for example /.worktrees/) to .gitignore to drop the cost`
            });
          }
        } else {
          metadata = applyKnipResult(scanRoot, prevKnip, scanned.result, scanned.row);
        }
      }
      budgetSpent = metadata.execution === "deferred" && (metadata.scanFloorMs === void 0 || metadata.aborted === true);
      logKnipRow(scanRoot, startedAt, metadata);
    }
  }
  const tDeadCode = Date.now();
  const deadCodeMeta = {};
  if (runtime.isStartupScanInFlight("dead-code")) {
    dbg("turn_end: skipping dead-code (startup scan still in flight)");
    deadCodeMeta.skipped = true;
    deadCodeMeta.reason = "startup_scan_in_flight";
  } else if (deadCodeClients.length === 0) {
    deadCodeMeta.reason = "no_clients";
  } else {
    let modifiedSet = null;
    const modifiedFiles = () => modifiedSet ??= new Set(files.map((f) => resolveRunnerPath(cwd, f)));
    let newIssueTotal = 0;
    let deadCodeDispositionSuppressed = 0;
    const reasons = [];
    const deliverDeadCodeDelta = (client, sources) => {
      const latest = sources.at(-1);
      if (latest === void 0)
        return;
      const result = latest.result;
      const deadCodeLane = carryLane("dead-code", client.id);
      const parkedDeadCode = takeParked(deadCodeLane);
      deadCodeMeta.totalIssues = (deadCodeMeta.totalIssues ?? 0) + deadCodeIssues(result).length;
      if (!sources.some((source) => source.previousScan?.success)) {
        reasons.push(`${client.id}:no_previous_scan`);
        return;
      }
      const newIssues = [];
      for (const source of sources) {
        if (!source.previousScan?.success)
          continue;
        const prevKeys = new Set(deadCodeIssues(source.previousScan).map(deadCodeIssueKey));
        for (const issue of deadCodeIssues(source.result)) {
          if (prevKeys.has(deadCodeIssueKey(issue)) || !issue.file)
            continue;
          if (source.modified.has(resolveRunnerPath(cwd, issue.file))) {
            newIssues.push(issue);
          }
        }
      }
      const reOffered = stillReportedParked(parkedDeadCode, deadCodeIssues(result), deadCodeIssueKey, new Set(newIssues.map(deadCodeIssueKey)));
      if (newIssues.length === 0 && reOffered.length === 0) {
        reasons.push(`${client.id}:clean`);
        return;
      }
      newIssueTotal += newIssues.length;
      if (newIssues.length > 0) {
        projectDiagnosticsDelta.push(...newIssues.map((issue) => deadCodeIssueToProjectDiagnostic(cwd, issue, result.language)));
        projectDiagnosticsSources.add("dead-code");
      }
      const deadCodeDeliverable = filterFindingsByDisposition([...newIssues, ...reOffered], cwd, (issue) => deadCodeIssueToProjectDiagnostic(cwd, issue, result.language));
      deadCodeDispositionSuppressed += deadCodeDeliverable.suppressed;
      if (deadCodeDeliverable.kept.length === 0) {
        reasons.push(`${client.id}:all_disposed`);
        return;
      }
      const deadCodePart = formatDeadCodeDelta(deadCodeDeliverable.kept, result.language);
      advisoryParts.push(deadCodePart);
      const reOfferedKeys = new Set(reOffered.map(deadCodeIssueKey));
      deliveryHolds.push(cutAdvisoryHold("dead-code", deadCodeLane, deadCodePart, deadCodeDeliverable.kept.slice(0, DEAD_CODE_DELTA_MAX_SHOWN), (issue) => reOfferedKeys.has(deadCodeIssueKey(issue))));
    };
    try {
      const lateScans = lateDeadCodeScansOf(turnScope);
      for (const client of deadCodeClients) {
        if (!client.detect(cwd)) {
          reasons.push(`${client.id}:not_detected`);
          continue;
        }
        const cacheKey = `dead-code-${client.id}`;
        const lateKey = lateDeadCodeScanKey(client, cwd);
        const sources = [];
        const late = lateScans.get(lateKey);
        let carried = /* @__PURE__ */ new Set();
        if (late?.settled) {
          lateScans.delete(lateKey);
          sources.push({
            result: late.settled,
            previousScan: late.previousScan,
            modified: late.files
          });
          carried = late.carry;
          reasons.push(`${client.id}:late_scan`);
          if (joinedEarlierScan(late.settled, late.askedAt)) {
            carried = /* @__PURE__ */ new Set([...late.carry, ...late.files]);
            reasons.push(`${client.id}:joined`);
          }
        }
        try {
          if (late && !late.settled) {
            for (const file of modifiedFiles())
              late.carry.add(file);
            reasons.push(`${client.id}:in_flight`);
            continue;
          }
          const scanFiles = /* @__PURE__ */ new Set([...modifiedFiles(), ...carried]);
          if (![...scanFiles].some((f) => client.owns(f))) {
            reasons.push(`${client.id}:no_owned_files`);
            continue;
          }
          const prev = cacheManager2.readCache(cacheKey, cwd);
          const previousFailedHard = prev && !prev.data.success && isHardFailureSummary(prev.data.summary);
          const abandonedFailure = previousFailedHard ? null : client.recentHardFailure?.(cwd) ?? null;
          if (previousFailedHard || abandonedFailure !== null) {
            const failure = previousFailedHard ? prev.data.summary : abandonedFailure ?? "";
            dbg(`turn_end: skipping dead-code after failure: ${failure}`);
            deadCodeMeta.skipped = true;
            reasons.push(`${client.id}:backoff:${failure}`);
            continue;
          }
          const startMs = Date.now();
          const scan = client.analyze(cwd);
          const settled2 = await bounded(withRowForFailureWrite(scan, cacheManager2, cacheKey, cwd, prev), {
            signal: deps.signal,
            hook: "turn_end",
            label: "dead-code",
            ms: Math.max(0, HOOK_WALL_BUDGET_MS.turn_end - (Date.now() - turnEndStart))
          });
          const joined = settled2 !== void 0 && joinedEarlierScan(settled2.result, startMs);
          if (settled2 === void 0 || joined) {
            if (joined) {
              reasons.push(`${client.id}:joined`);
            } else {
              dbg(`turn_end: dead-code(${client.id}) outlived the budget`);
              deadCodeMeta.execution = "deferred";
              deadCodeMeta.aborted = deps.signal?.aborted === true;
              reasons.push(`${client.id}:deferred`);
            }
            parkLateDeadCodeScan({
              scope: turnScope,
              cacheManager: cacheManager2,
              client,
              cwd,
              cacheKey,
              scan,
              startedAt: startMs,
              files: scanFiles,
              previousScan: prev?.data
            });
            if (joined)
              continue;
            break;
          }
          const { result } = settled2;
          const durationMs = Date.now() - startMs;
          if (wouldPoisonCache(settled2.row, result)) {
            dbg(`turn_end: keeping last good dead-code(${client.id}) cache; this run failed: ${result.summary}`);
            deadCodeMeta.cacheKept = true;
          } else {
            cacheManager2.writeCache(cacheKey, result, cwd, {
              scanDurationMs: durationMs
            });
          }
          logDeadCodeScan(deadCodeScanEvent(client, cwd, result, durationMs));
          deadCodeMeta.success = result.success;
          if (result.excludedWorktrees !== void 0) {
            deadCodeMeta.excludedWorktrees = (deadCodeMeta.excludedWorktrees ?? 0) + result.excludedWorktrees;
          }
          if (!result.success) {
            reasons.push(`${client.id}:scan_failed:${result.summary}`);
            continue;
          }
          sources.push({
            result,
            previousScan: prev?.data,
            modified: scanFiles
          });
        } catch (err) {
          dbg(`turn_end: dead-code(${client.id}) failed: ${err}`);
          reasons.push(`${client.id}:threw`);
        } finally {
          try {
            deliverDeadCodeDelta(client, sources);
          } catch (err) {
            dbg(`turn_end: dead-code(${client.id}) delivery failed: ${err}`);
            reasons.push(`${client.id}:threw`);
          }
        }
      }
    } catch (err) {
      dbg(`turn_end: dead-code block failed: ${err}`);
      reasons.push("block_threw");
    }
    deadCodeMeta.newIssues = newIssueTotal;
    deadCodeMeta.dispositionSuppressed = deadCodeDispositionSuppressed;
    if (reasons.length > 0)
      deadCodeMeta.reason = reasons.join(",");
  }
  logLatency({
    type: "phase",
    toolName: "turn_end",
    filePath: cwd,
    phase: "dead-code",
    durationMs: Date.now() - tDeadCode,
    metadata: deadCodeMeta
  });
  let dispositionSuppressedTotal = 0;
  const dispositionSuppressedByLane = {};
  function recordDispositionSuppressed(lane, count) {
    if (count <= 0)
      return;
    dispositionSuppressedTotal += count;
    dispositionSuppressedByLane[lane] = (dispositionSuppressedByLane[lane] ?? 0) + count;
  }
  const scannerCacheReads = /* @__PURE__ */ new Map();
  const scannerStoresUnread = [];
  function readScannerCache(scanner) {
    let pending2 = scannerCacheReads.get(scanner);
    if (pending2 === void 0) {
      pending2 = deps.signal?.aborted ? Promise.resolve(null) : bounded(cacheManager2.readCacheAsync(scanner, cwd), {
        ms: HOOK_WALL_BUDGET_MS.turn_end,
        signal: deps.signal,
        hook: "turn_end",
        label: `readScannerCache:${scanner}`
      }).then((entry) => {
        if (entry === void 0)
          scannerStoresUnread.push(scanner);
        return entry ?? null;
      });
      scannerCacheReads.set(scanner, pending2);
    }
    return pending2;
  }
  const laneCtx = {
    cwd,
    signal: deps.signal,
    readScannerCache,
    peekActionableWarnings: () => runtime.peekActionableWarnings(sessionId)
  };
  const govSources = await govulncheckLane.collect(laneCtx);
  const trivyCacheEntry = await readScannerCache("trivy");
  const secretsSources = await secretsLane.collect(laneCtx);
  if (scannerStoresUnread.length > 0) {
    logLatency({
      type: "phase",
      toolName: "turn_end",
      filePath: cwd,
      phase: "scanner_cache_read_abandoned",
      durationMs: 0,
      metadata: {
        stores: scannerStoresUnread.join("+"),
        aborted: deps.signal?.aborted === true
      }
    });
  }
  const scannerGates = gateFindingsByPathFreshness({
    cwd,
    sources: {
      ...govSources,
      ...secretsSources
    }
  });
  const govGate = scannerGates.govulncheck;
  const gitleaksGate = scannerGates.gitleaks;
  const trivySecretsGate = scannerGates["trivy-secrets"];
  const govDelivery = allowProjectWideFindings ? govulncheckLane.render(govulncheckLane.gate({ govulncheck: govGate }, laneCtx), laneCtx) : {};
  for (const [store, count] of Object.entries(govDelivery.dispositionSuppressed ?? {})) {
    recordDispositionSuppressed(store, count);
  }
  advisoryParts.push(...govDelivery.advisoryParts ?? []);
  const secretsDelivery = allowProjectWideFindings ? secretsLane.render(secretsLane.gate({
    gitleaks: gitleaksGate,
    "trivy-secrets": trivySecretsGate
  }, laneCtx), laneCtx) : {};
  for (const [store, count] of Object.entries(secretsDelivery.dispositionSuppressed ?? {})) {
    recordDispositionSuppressed(store, count);
  }
  const secretBlockedLocations = secretsDelivery.deliveredLocationKeys ?? /* @__PURE__ */ new Set();
  blockerParts.push(...secretsDelivery.blockerParts ?? []);
  staleSecretParts.push(...secretsDelivery.staleSecretParts ?? []);
  const trivyAgeLabel = formatCacheAgeLabel(trivyCacheEntry?.data?.scannedAt);
  const trivyFindingsFiltered = filterFindingsByDisposition(trivyCacheEntry?.data?.findings ?? [], cwd, (f) => trivyFindingToProjectDiagnostic(cwd, f));
  recordDispositionSuppressed("trivy", trivyFindingsFiltered.suppressed);
  if (trivyFindingsFiltered.kept.length) {
    const all = trivyFindingsFiltered.kept;
    const critical = all.filter((f) => f.severity === "CRITICAL");
    const advisory = all.filter((f) => f.severity !== "CRITICAL");
    const fmt = (f) => {
      const pkg = f.installedVersion ? `${f.pkgName}@${f.installedVersion}` : f.pkgName;
      const fix = f.fixedVersion ? ` \u2014 upgrade to ${f.fixedVersion} or later` : " \u2014 no fix yet, track upstream";
      return `  ${f.vulnerabilityId} (${pkg})${fix}
`;
    };
    if (critical.length) {
      const shown2 = critical.slice(0, 5);
      let report = `\u{1F534} STOP \u2014 CRITICAL dependency CVEs (trivy, ${trivyAgeLabel}). Upgrade before shipping:
`;
      for (const f of shown2)
        report += fmt(f);
      if (critical.length > shown2.length) {
        report += `  \u2026 and ${critical.length - shown2.length} more
`;
      }
      blockerParts.push(report);
    }
    if (advisory.length) {
      const shown2 = advisory.slice(0, 5);
      let report = `\u{1F6E1}\uFE0F Dependency CVEs (trivy, ${trivyAgeLabel}) \u2014 upgrade where possible:
`;
      for (const f of shown2)
        report += fmt(f);
      if (advisory.length > shown2.length) {
        report += `  \u2026 and ${advisory.length - shown2.length} more
`;
      }
      advisoryParts.push(report);
    }
  }
  const licenses = trivyCacheEntry?.data?.licenses ?? [];
  if (licenses.length) {
    const shown2 = licenses.slice(0, 5);
    let report = `\u{1F4DC} Dependency license risk (trivy, ${trivyAgeLabel}) \u2014 review for compliance:
`;
    for (const l of shown2) {
      const cat = l.category ? `, ${l.category}` : "";
      report += `  ${l.pkgName} \u2014 ${l.license} (${l.severity}${cat})
`;
    }
    if (licenses.length > shown2.length) {
      report += `  \u2026 and ${licenses.length - shown2.length} more
`;
    }
    advisoryParts.push(report);
  }
  if (dispositionSuppressedTotal > 0) {
    const byLane = Object.entries(dispositionSuppressedByLane).map(([lane, count]) => `${lane} ${count}`).join(", ");
    advisoryParts.push(`suppressed by disposition: ${dispositionSuppressedTotal} finding(s) dropped from this turn's gitleaks/govulncheck/trivy sections (${byLane}) (marked false-positive or won't-fix).`);
  }
  const t3 = Date.now();
  let madgeStats;
  const madgeAvailabilitySignal = deps.signal;
  if (getFlag("lens-turn-end-madge") && await bounded(depChecker.ensureAvailable(), {
    ms: HOOK_WALL_BUDGET_MS.turn_end,
    signal: madgeAvailabilitySignal,
    hook: "turn_end",
    label: "madge.ensureAvailable"
  })) {
    const madgeFiles = cacheManager2.getFilesForMadge(cwd, turnStateSessionId);
    if (madgeFiles.length > 0) {
      dbg(`turn_end: madge checking ${madgeFiles.length} file(s) for circular deps`);
      const absFiles = madgeFiles.map((file) => path24.resolve(cwd, file));
      const batch = await depChecker.checkFilesBatch(absFiles, cwd);
      const depResults = batch.results;
      madgeStats = batch.stats;
      for (const file of madgeFiles) {
        const absPath = path24.resolve(cwd, file);
        const depResult = depResults.get(absPath);
        if (!depResult)
          continue;
        if (depResult.hasCircular && depResult.circular.length > 0) {
          dbg(`turn_end: circular dependency note for ${file} (suppressed in blockers-only mode)`);
        }
      }
    }
  }
  logLatency({
    type: "phase",
    toolName: "turn_end",
    filePath: cwd,
    phase: "madge",
    durationMs: Date.now() - t3,
    // A ~0ms entry with no metadata is indistinguishable from "ran and was
    // fast" when re-analyzing the #766 tail — mark the skipped case.
    metadata: madgeStats ?? { skipped: true }
  });
  if (!getFlag("no-tests") && files.length > 0) {
    const seen = /* @__PURE__ */ new Set();
    const targets = [];
    const testRootFor = createTurnEndTestRoots(cwd);
    const candidates = [];
    const seenCandidateKeys = /* @__PURE__ */ new Set();
    for (const file of files) {
      const abs = resolveRunnerPath(cwd, file);
      const key = normalizeMapKey(abs);
      if (seenCandidateKeys.has(key))
        continue;
      seenCandidateKeys.add(key);
      candidates.push({ display: file, abs, isNeighbor: false });
    }
    for (const result of cascadeResults) {
      for (const neighbor of result.neighbors) {
        const abs = path24.isAbsolute(neighbor.filePath) ? neighbor.filePath : resolveRunnerPath(cwd, neighbor.filePath);
        const key = normalizeMapKey(abs);
        if (seenCandidateKeys.has(key))
          continue;
        seenCandidateKeys.add(key);
        candidates.push({ display: neighbor.filePath, abs, isNeighbor: true });
      }
    }
    const priorTestCache = cacheManager2.readCache("test-runner-findings", cwd)?.data;
    const carriedDeferred = priorTestCache?.deferredTargets ?? [];
    const turnSessionId = sessionId ?? runtime.telemetrySessionId;
    const isThisSession = (entry) => entry.sessionId === turnSessionId;
    const entryPathKey = (entry) => normalizeMapKey(path24.resolve(cwd, entry.testFile));
    const retiredCarry = (priorTestCache?.retiredTargets ?? []).filter(isThisSession);
    const retiredKeys = new Set(retiredCarry.map(entryPathKey));
    const resolvedDeferralKeys = /* @__PURE__ */ new Set();
    const heldDeferred = [];
    const boundPersisted = (entries, label) => {
      const bounded2 = boundDeferredTargets(entries, TEST_RUNNER_MAX_PERSISTED_TARGETS, isThisSession);
      if (bounded2.length !== entries.length) {
        dbg(`turn_end: ${label} test target list held ${entries.length} entries, bounded to the newest ${TEST_RUNNER_MAX_PERSISTED_TARGETS} (oldest foreign-session rows dropped)`);
      }
      return bounded2;
    };
    const writeTestFindings = (record, ownDeferred) => {
      const live = cacheManager2.readCache("test-runner-findings", cwd)?.data;
      const own = mergeDeferredTargets(heldDeferred, ownDeferred);
      const ownKeys = new Set(own.map(entryPathKey));
      const merged = mergeDeferredTargets(live?.deferredTargets ?? [], own).filter((entry) => {
        if (!isThisSession(entry))
          return true;
        const key = entryPathKey(entry);
        return !resolvedDeferralKeys.has(key) || ownKeys.has(key);
      });
      cacheManager2.writeCache("test-runner-findings", {
        ...record,
        deferredTargets: boundPersisted(merged, "deferred"),
        retiredTargets: boundPersisted(mergeDeferredTargets(live?.retiredTargets ?? [], retiredCarry), "retired")
      }, cwd);
    };
    let deadDeferred = 0;
    let heldOverCap = 0;
    let foreignDeferred = 0;
    let redispatchedDeferred = 0;
    let retiredThisTurn = 0;
    for (const carried of carriedDeferred) {
      const testFile = path24.resolve(cwd, carried.testFile);
      const carriedKey = normalizeMapKey(testFile);
      if (!isThisSession(carried)) {
        foreignDeferred++;
        continue;
      }
      if (seen.has(carriedKey)) {
        resolvedDeferralKeys.add(carriedKey);
        continue;
      }
      const attempts = carried.attempts ?? 0;
      if (attempts >= TEST_RUNNER_MAX_DEFERRALS) {
        resolvedDeferralKeys.add(carriedKey);
        if (!retiredKeys.has(carriedKey)) {
          retiredKeys.add(carriedKey);
          retiredThisTurn++;
          retiredCarry.push({
            testFile,
            runner: carried.runner,
            attempts,
            sessionId: turnSessionId
          });
          incrementDegradationCount({
            kind: "test-runner-batch-capped",
            subject: `${cwd}:deferral-exhausted`,
            reason: `test target was cut after ${attempts} turn(s) at the turn-end budget and is retired for this session \u2014 too slow for a per-turn batch; run it explicitly (target: ${path24.relative(cwd, testFile)})`
          });
          dbg(`turn_end: retiring deferred test target ${path24.relative(cwd, testFile)} after ${attempts} cut batch(es) \u2014 too slow for the turn-end budget, run it explicitly`);
        }
        continue;
      }
      const config = RUNNERS[carried.runner];
      const carriedRoot = testRootFor(testFile);
      if (!config || isExcludedTestTarget(testFile, carriedRoot) || !fs17.existsSync(testFile)) {
        resolvedDeferralKeys.add(carriedKey);
        deadDeferred++;
        continue;
      }
      if (targets.length >= TEST_RUNNER_MAX_TARGETS) {
        heldOverCap++;
        heldDeferred.push({
          testFile,
          runner: carried.runner,
          sourceFile: carried.sourceFile ?? testFile,
          attempts,
          sessionId: turnSessionId
        });
        continue;
      }
      resolvedDeferralKeys.add(carriedKey);
      seen.add(carriedKey);
      redispatchedDeferred++;
      targets.push({
        testFile,
        sourceFile: carried.sourceFile ?? testFile,
        runner: carried.runner,
        config,
        strategy: "deferred",
        testRoot: carriedRoot,
        deferralAttempts: attempts
      });
      dbg(`turn_end: re-running deferred test target ${path24.relative(cwd, testFile)} (${carried.runner}) from the previous turn's cut batch`);
    }
    if (deadDeferred > 0) {
      dbg(`turn_end: dropped ${deadDeferred} deferred test target(s) that no longer resolve (missing file, excluded, or unknown runner)`);
    }
    if (heldOverCap > 0) {
      dbg(`turn_end: held ${heldOverCap} deferred test target(s) over the per-turn cap of ${TEST_RUNNER_MAX_TARGETS} \u2014 kept on the deferral list for the next turn, attempts unchanged`);
    }
    if (foreignDeferred > 0) {
      dbg(`turn_end: ignored ${foreignDeferred} deferred test target(s) belonging to another session \u2014 left on the record for the session that cut them`);
    }
    if (carriedDeferred.length > 0) {
      logLatency({
        type: "phase",
        toolName: "turn_end",
        filePath: cwd,
        phase: "test_runner_deferral",
        durationMs: 0,
        metadata: {
          carried: carriedDeferred.length,
          redispatched: redispatchedDeferred,
          heldOverCap,
          retired: retiredThisTurn,
          dropped: deadDeferred,
          foreignSession: foreignDeferred,
          sessionId: turnSessionId
        }
      });
    }
    let overCapTargets = 0;
    let missingTargetFiles = 0;
    let excludedTargets = 0;
    let retiredSkips = 0;
    let noTestFile = 0;
    const candidatesByRoot = /* @__PURE__ */ new Map();
    for (const { display, abs, isNeighbor } of candidates) {
      const testRoot = testRootFor(abs);
      candidatesByRoot.set(testRoot, (candidatesByRoot.get(testRoot) ?? 0) + 1);
      const target = testRunnerClient.getTestRunTarget(abs, testRoot, runtime.turnIndex);
      const targetKey = target ? normalizeMapKey(target.testFile) : "";
      if (target && !seen.has(targetKey)) {
        seen.add(targetKey);
        if (retiredKeys.has(targetKey)) {
          retiredSkips++;
          dbg(`turn_end: ${display} \u2192 test target retired earlier this session (outran the turn-end batch budget), skipping spawn (${path24.relative(cwd, target.testFile)})`);
          continue;
        }
        if (isExcludedTestTarget(target.testFile, testRoot)) {
          excludedTargets++;
          dbg(`turn_end: ${display} \u2192 test target excluded by the built-in turn-end policy, skipping spawn (${path24.relative(cwd, target.testFile)})`);
          continue;
        }
        if (!fs17.existsSync(target.testFile)) {
          missingTargetFiles++;
          dbg(`turn_end: ${display} \u2192 test file missing, skipping spawn (${path24.relative(cwd, target.testFile)})`);
          continue;
        }
        if (targets.length >= TEST_RUNNER_MAX_TARGETS) {
          overCapTargets++;
          continue;
        }
        targets.push({ ...target, sourceFile: abs, testRoot });
        dbg(`turn_end: ${display} \u2192 test ${target.runner} ${path24.relative(cwd, target.testFile)} (${target.strategy}${isNeighbor ? ", cascade-neighbor" : ""})`);
      } else if (!target) {
        noTestFile++;
        dbg(`turn_end: ${display} \u2192 no test file found${isNeighbor ? " (cascade-neighbor)" : ""}`);
      }
    }
    if (excludedTargets > 0) {
      dbg(`turn_end: excluded ${excludedTargets} test target(s) by the built-in turn-end policy`);
    }
    if (retiredSkips > 0) {
      dbg(`turn_end: skipped ${retiredSkips} test target(s) retired earlier this session for outrunning the turn-end batch budget`);
    }
    if (missingTargetFiles > 0) {
      dbg(`turn_end: skipped ${missingTargetFiles} test target(s) whose file no longer exists`);
    }
    if (overCapTargets > 0) {
      recordDegradationOnce({
        kind: "test-runner-batch-capped",
        subject: cwd,
        reason: `turn touched more test targets than one turn may fire; ran ${TEST_RUNNER_MAX_TARGETS}, skipped ${overCapTargets} \u2014 re-run the remainder with lens_diagnostics or edit them in a smaller batch`
      });
      dbg(`turn_end: test target count capped at ${TEST_RUNNER_MAX_TARGETS}, ${overCapTargets} skipped`);
    }
    if (candidates.length > 0) {
      const selectedByRoot = /* @__PURE__ */ new Map();
      for (const target of targets) {
        selectedByRoot.set(target.testRoot, (selectedByRoot.get(target.testRoot) ?? 0) + 1);
      }
      const roots = [...candidatesByRoot.entries()].map(([root, candidateCount]) => ({
        root: root === cwd ? "." : toRunnerDisplayPath(cwd, root),
        candidates: candidateCount,
        selected: selectedByRoot.get(root) ?? 0
      }));
      emitBounded("turn_end_test_selection", `${cwd}:turn:${runtime.turnIndex}`, {
        filePath: cwd,
        durationMs: 0,
        metadata: {
          sessionId: turnSessionId,
          candidates: candidates.length,
          selected: targets.length,
          noTestFile,
          excluded: excludedTargets,
          missing: missingTargetFiles,
          overCap: overCapTargets,
          retired: retiredSkips,
          roots: roots.slice(0, TURN_END_SELECTION_ROOT_ROWS),
          rootsOmitted: Math.max(0, roots.length - TURN_END_SELECTION_ROOT_ROWS)
        }
      });
    }
    if (targets.length > 0) {
      for (const target of targets) {
        target.fileSeqAtRun = runtime.getFileSeq(target.sourceFile);
      }
      dbg(`turn_end: firing ${targets.length} test target(s) async (non-blocking, max ${TEST_RUNNER_BATCH_CONCURRENCY} concurrent)`);
      const firedAtTurn = runtime.turnIndex;
      const firedSessionId = turnSessionId;
      const testRunGeneration = (priorTestCache?.testRunGeneration ?? 0) + 1;
      const provenanceFiles = [
        ...candidates.map((candidate) => ({
          path: candidate.abs,
          role: "source"
        })),
        ...targets.map((target) => ({
          path: target.testFile,
          role: "test"
        }))
      ];
      const launchedFrom = snapshotAdvisoryProvenance({
        cwd,
        runtime,
        generation: testRunGeneration,
        files: provenanceFiles
      });
      writeTestFindings(
        {
          ...priorTestCache ?? { content: "" },
          testRunGeneration
        },
        // Consumed above into `targets` (or retired, or dropped). Anything
        // this turn HELD is re-asserted by the writer itself; the batch's own
        // outcome adds the NEW cut set below.
        []
      );
      runTestTargetsBounded({
        targets,
        concurrency: TEST_RUNNER_BATCH_CONCURRENCY,
        budgetMs: TEST_RUNNER_BATCH_BUDGET_MS,
        // Both bounds, per AGENTS.md: a wall budget AND the ambient
        // abort signal the rest of the spawn layer already honours.
        signal: getAmbientAbortSignal(),
        run: (t, batchSignal) => testRunnerClient.runTestFileAsync(t.testFile, t.testRoot, {
          runner: t.runner,
          config: t.config,
          turnIndex: firedAtTurn,
          // #2522 R2 F1: the BATCH's signal, so spending the 20s wall
          // budget kills this spawn rather than letting it run out its
          // own 60s timeout behind a batch that has already returned.
          signal: batchSignal,
          // #3871 r2: a failure in a linked worktree reads relative to the
          // session checkout (`.worktrees/x/tests/a.test.ts:12`), which
          // may hold a file at the worktree-relative path.
          displayRoot: cwd,
          // A worktree root without its own runner install is skipped, not
          // run through `npx` (a network fetch) or a bare interpreter.
          requireOwnInstall: t.testRoot !== cwd
        })
      }).then(({ results: batchResults, deferred, stopReason }) => {
        const settledResults = batchResults;
        const results = [];
        for (const result of settledResults) {
          if (!("value" in result) || !result.value.notRun) {
            results.push(result);
            continue;
          }
          const skippedRoot = targets.find((candidate) => candidate.testFile === result.value.file)?.testRoot ?? cwd;
          const ambientNote = result.value.runner === "pytest" && hasAmbientPythonEnvironment() ? "; ambient Python environments outside this checkout were not borrowed" : "";
          incrementDegradationCount({
            kind: "turn-end-test-root-skipped",
            subject: result.value.notRun,
            reason: `${toRunnerDisplayPath(cwd, skippedRoot)} has no ${result.value.runner} install of its own${ambientNote}; its tests were skipped rather than fetched through npx or run in another environment`
          });
          dbg(`turn_end: skipped ${toRunnerDisplayPath(cwd, result.value.file)}: ${result.value.notRun} in ${toRunnerDisplayPath(cwd, skippedRoot)}`);
        }
        const verdicts = results.flatMap((result) => {
          if (result.status === "rejected")
            return [];
          const target = targets.find((candidate) => candidate.testFile === result.value.file);
          return target ? [
            {
              file: result.value.file,
              sourceFile: target.sourceFile,
              runner: target.runner,
              fileSeq: target.fileSeqAtRun === void 0 ? {
                state: "unknown",
                reason: "sequence-unavailable"
              } : {
                state: "known",
                value: target.fileSeqAtRun
              }
            }
          ] : [];
        });
        const deferredTargets = deferred.map((t) => ({
          testFile: t.testFile,
          sourceFile: t.sourceFile,
          runner: t.runner,
          // One more cut batch for this target. Read back by the
          // selection loop above, which retires it at
          // TEST_RUNNER_MAX_DEFERRALS rather than carrying it forever.
          attempts: (t.deferralAttempts ?? 0) + 1,
          // #2522 R3 F5: stamped with the session that cut it, so the
          // next session re-arms this target instead of inheriting an
          // attempt count measured under a load it never saw.
          sessionId: firedSessionId
        }));
        if (deferred.length > 0) {
          incrementDegradationCount({
            kind: "test-runner-batch-capped",
            subject: `${cwd}:${stopReason ?? "incomplete"}`,
            reason: `test batch stopped early (${stopReason ?? "incomplete"}); ${deferred.length} target(s) killed or never dispatched, deferred to the next turn`
          });
          dbg(`turn_end: test batch stopped early (${stopReason ?? "incomplete"}), ${deferred.length} target(s) deferred to the next turn`);
        }
        const deferralNote = deferred.length > 0 ? `${deferred.length} test target(s) did not finish within the turn-end batch budget and are deferred to the next turn (they run first): ${deferredTargets.map((t) => path24.relative(cwd, t.testFile)).join(", ")}` : "";
        const supersededByNewerGeneration = (label) => {
          const current = cacheManager2.readCache("test-runner-findings", cwd)?.data;
          const currentGeneration = current?.testRunGeneration;
          if (currentGeneration !== void 0 && currentGeneration > testRunGeneration) {
            dbg(`turn_end: ${label}test generation ${testRunGeneration} superseded by ${currentGeneration}`);
            if (deferredTargets.length > 0) {
              writeTestFindings({ ...current ?? { content: "" } }, deferredTargets);
              dbg(`turn_end: ${label}carried ${deferredTargets.length} cut target(s) into the newer generation's deferral set`);
            }
            return true;
          }
          return false;
        };
        const publishedAgainst = snapshotAdvisoryProvenance({
          cwd,
          runtime,
          generation: testRunGeneration,
          files: provenanceFiles
        });
        const superseded = launchedFrom.revision.sessionId !== publishedAgainst.revision.sessionId || launchedFrom.revision.projectSeq !== publishedAgainst.revision.projectSeq || launchedFrom.revision.turnIndex !== publishedAgainst.revision.turnIndex || launchedFrom.files.some((file, index) => publishedAgainst.files[index]?.sha256 !== file.sha256 || publishedAgainst.files[index]?.path !== file.path);
        const stale = runtime.turnIndex !== firedAtTurn;
        const failures = [];
        const resultValues = [];
        let rejectedCount = 0;
        let hasRealFailure = false;
        for (const r of results) {
          if (r.status === "rejected") {
            rejectedCount++;
            emitBounded("test_runner_delivery", `${cwd}:generation:${testRunGeneration}:rejected`, {
              filePath: cwd,
              durationMs: 0,
              metadata: {
                outcome: "runner-promise-rejected",
                sessionId: firedSessionId,
                generation: testRunGeneration,
                targetCount: targets.length,
                droppedDetailCount: 0,
                reason: String(r.reason).slice(0, 500)
              }
            }, {
              ledgerKind: "test-runner-delivery",
              reason: "test runner promise rejected",
              capPerTurn: { limit: 8, turnIndex: firedAtTurn }
            });
            dbg(`turn_end: test run rejected \u2014 ${r.reason}`);
            continue;
          }
          resultValues.push(r.value);
          const { file, runner, passed, failed, duration, error } = r.value;
          if (failed > 0)
            hasRealFailure = true;
          const shortFile = path24.basename(file);
          const elapsed = formatRunDurationMs(duration);
          const verdict = failed > 0 ? "FAIL" : "PASS";
          const summary = isRunnerErrorResult(r.value) ? passed > 0 ? `error: ${error} (${passed} passed before)` : `error: ${error}` : `${verdict} ${passed}p/${failed}f (${elapsed})`;
          dbg(`turn_end: ${stale ? "[stale] " : ""}test ${runner} ${shortFile} \u2192 ${summary}`);
          if (failed > 0 || error) {
            if (error && String(r.value?.error ?? "").includes("Test file not found")) {
              continue;
            }
            const formatted = testRunnerClient.formatResult(r.value);
            if (formatted)
              failures.push(formatted);
          }
        }
        if (rejectedCount > 0) {
          failures.push(`Test runner rejected ${rejectedCount} promise(s) before producing a structured result.`);
        }
        if (failures.length > 0) {
          if (supersededByNewerGeneration(""))
            return;
          const content = [
            stale ? "[from a prior turn \u2014 the edit that triggered this run had already been superseded by the time results came back]" : "",
            failures.join("\n\n"),
            // A batch can BOTH find a real failure and be cut short.
            // The agent needs to see the failure AND that the run was
            // incomplete, or it reads a partial list as the full one.
            deferralNote
          ].filter(Boolean).join("\n\n");
          const runnerErrorOnly = !hasRealFailure;
          writeTestFindings({
            content,
            stale,
            results: resultValues,
            verdicts,
            testRunGeneration,
            launchedFrom,
            publishedAgainst,
            provenance: publishedAgainst,
            superseded,
            runnerErrorOnly
          }, deferredTargets);
          try {
            deps.onTestRunnerComplete?.({
              cwd,
              sessionId: firedSessionId,
              generation: testRunGeneration,
              targetCount: targets.length,
              hasFindings: true
            });
          } catch (deliveryErr) {
            dbg(`turn_end: test delivery staging failed \u2014 ${deliveryErr}`);
          }
          if (getFlag("lens-guard") && firedSessionId === runtime.telemetrySessionId) {
            const cleanFiles = resultValues.filter((value) => value.failed === 0 && !value.error).map((value) => value.file);
            if (cleanFiles.length > 0) {
              clearGitGuardTestFailure(cacheManager2, cwd, runtime, cleanFiles);
            }
            if (!runnerErrorOnly) {
              mergeGitGuardTestFailure(cacheManager2, cwd, runtime, content, resultValues.filter((value) => value.failed > 0).map((value) => value.file));
            } else {
              emitBounded("test_runner_delivery", `${cwd}:generation:${testRunGeneration}:runner-error-only`, {
                filePath: cwd,
                durationMs: 0,
                metadata: {
                  outcome: "runner-error-only-not-blocking",
                  sessionId: firedSessionId,
                  generation: testRunGeneration,
                  targetCount: targets.length,
                  droppedDetailCount: 0
                }
              }, {
                ledgerKind: "test-runner-delivery",
                reason: "runner-error-only batch kept off the --lens-guard blocker",
                capPerTurn: { limit: 8, turnIndex: firedAtTurn }
              });
            }
          }
          dbg(`turn_end: ${failures.length} test failure(s) cached for pull diagnostics and post-agent delivery${stale ? " (stale \u2014 turn advanced while tests ran)" : ""}`);
        } else if (deferred.length > 0) {
          if (supersededByNewerGeneration("deferred "))
            return;
          writeTestFindings({
            content: deferralNote,
            stale,
            results: resultValues,
            verdicts,
            testRunGeneration,
            launchedFrom,
            publishedAgainst,
            provenance: publishedAgainst,
            superseded,
            // Advisory framing: an unfinished batch is not a
            // failure the agent introduced, exactly like a runner
            // error. See `TestRunnerFindingsCache.runnerErrorOnly`.
            runnerErrorOnly: true
          }, deferredTargets);
          try {
            deps.onTestRunnerComplete?.({
              cwd,
              sessionId: firedSessionId,
              generation: testRunGeneration,
              targetCount: targets.length,
              hasFindings: true
            });
          } catch (deliveryErr) {
            dbg(`turn_end: test delivery staging failed \u2014 ${deliveryErr}`);
          }
          dbg(`turn_end: partial test batch \u2014 ${results.length} target(s) settled, ${deferred.length} deferred to the next turn; NOT recorded as a clean run`);
        } else if (results.length > 0) {
          if (supersededByNewerGeneration("clean "))
            return;
          writeTestFindings(
            {
              ...priorTestCache ?? { content: "" },
              content: "",
              stale: false,
              results: resultValues,
              testRunGeneration,
              launchedFrom,
              publishedAgainst,
              provenance: publishedAgainst,
              superseded
            },
            // Nothing was cut. This turn's own settled entries drop out;
            // I2 keeps every row this batch does not own — including a
            // concurrent older batch's hand-over.
            []
          );
          try {
            deps.onTestRunnerComplete?.({
              cwd,
              sessionId: firedSessionId,
              generation: testRunGeneration,
              targetCount: targets.length,
              hasFindings: false
            });
          } catch (deliveryErr) {
            dbg(`turn_end: test delivery staging failed \u2014 ${deliveryErr}`);
          }
          if (getFlag("lens-guard") && firedSessionId === runtime.telemetrySessionId) {
            clearGitGuardTestFailure(cacheManager2, cwd, runtime, resultValues.map((value) => value.file));
          }
          dbg(`turn_end: all tests passed${stale ? " (stale \u2014 turn advanced while tests ran)" : ""}`);
        }
      }).catch(() => {
      });
    } else if (carriedDeferred.length > 0) {
      writeTestFindings({ ...priorTestCache ?? { content: "" } }, []);
    }
  }
  if (runtime.errorDebtBaseline && files.length > 0) {
    dbg("turn_end: marking error debt check for next session");
    cacheManager2.writeCache("errorDebt", {
      pendingCheck: true,
      baselineTestsPassed: runtime.errorDebtBaseline.testsPassed
    }, cwd);
  }
  if (runtime.callGraph && files.length > 0) {
    const coverage = runtime.callGraph.coverage;
    if (!coverage || coverage.complete !== true) {
      advisoryParts.push("Call-graph impact was not emitted because call-graph extraction coverage is incomplete; the affected files may have unreported callers.");
    } else {
      const callGraphStart = Date.now();
      try {
        const { impact, formatImpact, parseSymbolKey } = await import("../chunk-BKE7E7TC.js");
        const { callGraphImpactToProjectDiagnostics } = await import("../chunk-6GFRNVYR.js");
        const impactLines = [];
        let callGraphDispositionSuppressed = 0;
        const impactFindings = [];
        const impactFiles = files.slice(0, 5);
        const impactFileKeys = new Set(impactFiles.map((file) => normalizeMapKey(resolveRunnerPath(cwd, file))));
        const reOfferedImpactFiles = takeParked(carryLane("call-graph")).filter((file) => !impactFileKeys.has(normalizeMapKey(resolveRunnerPath(cwd, file))));
        const shownImpactFiles = [];
        for (const filePath of [...impactFiles, ...reOfferedImpactFiles]) {
          const linesBefore = impactLines.length;
          const changedFileKey = normalizeMapKey(resolveRunnerPath(cwd, filePath));
          const fileCallerKeys = [...runtime.callGraph.callers.keys()].filter((k) => {
            const graphFilePath = parseSymbolKey(k).filePath;
            return normalizeMapKey(resolveRunnerPath(cwd, graphFilePath)) === changedFileKey;
          });
          for (const calleeKey of fileCallerKeys.slice(0, 3)) {
            const results = impact(runtime.callGraph, calleeKey).filter((r) => {
              const callerFile = parseSymbolKey(r.symbolKey).filePath;
              return !callerFile || !isTestRoleCollateral(resolveRunnerPath(cwd, callerFile));
            });
            if (results.length > 0) {
              impactFindings.push({ calleeKey, results });
              const markable = results.flatMap((result) => callGraphImpactToProjectDiagnostics(cwd, [
                { calleeKey, results: [result] }
              ]).map((diagnostic) => ({ result, diagnostic })));
              const filtered = filterFindingsByDisposition(markable, cwd, (entry) => entry.diagnostic);
              callGraphDispositionSuppressed += filtered.suppressed;
              const keptEntries = new Set(filtered.kept);
              const dropped = new Set(markable.filter((entry) => !keptEntries.has(entry)).map((entry) => entry.result));
              const survivors = dropped.size === 0 ? results : results.filter((r) => !dropped.has(r));
              const summary = survivors.length > 0 ? formatImpact(survivors, cwd) : "";
              if (summary)
                impactLines.push(`  ${parseSymbolKey(calleeKey).symbolName ?? calleeKey}: ${summary}`);
            }
          }
          if (impactLines.length > linesBefore)
            shownImpactFiles.push(filePath);
        }
        if (impactLines.length > 0) {
          const impactPart = `\u{1F4CA} Call-graph impact (changed symbols have callers):
${impactLines.join("\n")}`;
          advisoryParts.push(impactPart);
          deliveryHolds.push(cutAdvisoryHold("call-graph", carryLane("call-graph"), impactPart, shownImpactFiles, (file) => !impactFiles.includes(file)));
        }
        if (impactFindings.length > 0) {
          const impactDiagnostics = callGraphImpactToProjectDiagnostics(cwd, impactFindings);
          if (impactDiagnostics.length > 0) {
            projectDiagnosticsDelta.push(...impactDiagnostics);
            projectDiagnosticsSources.add("call-graph");
          }
        }
        if (impactFindings.length > 0 || callGraphDispositionSuppressed > 0) {
          logLatency({
            type: "phase",
            toolName: "turn_end",
            filePath: cwd,
            phase: "call_graph_impact",
            durationMs: Date.now() - callGraphStart,
            metadata: {
              callees: impactFindings.length,
              lines: impactLines.length,
              dispositionSuppressed: callGraphDispositionSuppressed
            }
          });
        }
      } catch {
      }
    }
  }
  if (projectDiagnosticsDelta.length > 0) {
    writeProjectDiagnosticsDeltaReport(cwd, {
      version: PROJECT_DIAGNOSTICS_CACHE_VERSION,
      cwd,
      generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      sessionId: runtime.telemetrySessionId,
      turnIndex: runtime.turnIndex,
      projectSeqStart: runtime.turnStartProjectSeq,
      projectSeqEnd: runtime.projectSeq,
      diagnostics: projectDiagnosticsDelta,
      sources: [...projectDiagnosticsSources].sort((a, b) => a.localeCompare(b))
    });
  }
  const t4 = Date.now();
  const modifiedRangesByFile = new Map(Object.entries(turnState.files).map(([file, state]) => [
    normalizeMapKey(resolveRunnerPath(cwd, file)),
    state.modifiedRanges
  ]));
  const getFileSeq = runtime.getFileSeq;
  const fileSeqByPath = /* @__PURE__ */ new Map();
  if (getFileSeq) {
    for (const file of files) {
      const filePath = normalizeMapKey(resolveRunnerPath(cwd, file));
      fileSeqByPath.set(filePath, getFileSeq.call(runtime, filePath));
    }
  }
  let reverify;
  if (getFlag("lens-actionable-warnings")) {
    const persistedReport = cacheManager2.readCache("actionable-warnings", cwd, Number.MAX_SAFE_INTEGER)?.data;
    if (persistedReport?.files?.some((entry) => entry.origin === "deferred")) {
      const reverifyLspService = getLSPService();
      if (reverifyLspService) {
        reverify = await bounded(runPersistentReverify({
          report: persistedReport,
          cwd,
          lspService: reverifyLspService,
          signal: getAmbientAbortSignal()
        }), {
          ms: HOOK_WALL_BUDGET_MS.turn_end,
          signal: getAmbientAbortSignal(),
          hook: "turn_end",
          label: "persistent_reverify"
        });
      }
    }
    try {
      const report = await buildActionableWarningsReport({
        cwd,
        sessionId: runtime.telemetrySessionId,
        turnIndex: runtime.turnIndex,
        files,
        modifiedRangesByFile,
        dispatchWarnings: runtime.peekActionableWarnings(sessionId),
        includeLspCodeActions: !!getFlag("lens-actionable-warning-actions"),
        projectSeqStart: runtime.turnStartProjectSeq,
        projectSeqEnd: runtime.projectSeq,
        // #3676: the quick fix credits its writes with this epoch.
        branchEpoch: runtime.readGuard.currentBranchEpoch,
        branchScope: runtime.readGuard.lineageKey,
        fileSeqByPath,
        deltaOnly: !getFlag("lens-actionable-warning-all"),
        dbg,
        // #2504: this call is AWAITED on the turn_end hook, so its cost is
        // terminal-blocking time. The file cap and wall budget are its
        // bounds; the abort signal is the second one AGENTS.md requires.
        signal: getAmbientAbortSignal(),
        // A cold-cache turn hands the fresh-pull loop back here, off the
        // hook — it lands in the same cache the in-band report goes to.
        onDeferredReport: (deferred) => {
          try {
            writeDeferredActionableWarningsReport({
              cacheManager: cacheManager2,
              cwd,
              report: deferred,
              // The LIVE per-file sequence at WRITE time is the
              // baseline the merge judges each entry against. The
              // runtime is the only thing that knows it: a file
              // edited into cleanliness by a later turn is absent
              // from the persisted report entirely.
              getFileSeq: getFileSeq ? (filePath) => getFileSeq.call(runtime, filePath) : void 0,
              dbg
            });
          } catch (deferErr) {
            dbg(`turn_end: deferred actionable-warnings write failed \u2014 ${deferErr}`);
          }
        }
      });
      if (reverify?.replacementFiles.length) {
        const replacementByPath = new Map(reverify.replacementFiles.map((file) => [
          normalizeMapKey(file.filePath),
          file
        ]));
        const files2 = (report.files ?? []).map((file) => replacementByPath.get(normalizeMapKey(file.filePath)) ?? file);
        for (const replacement of reverify.replacementFiles) {
          if (!files2.some((file) => normalizeMapKey(file.filePath) === normalizeMapKey(replacement.filePath))) {
            files2.push(replacement);
          }
        }
        report.files = files2;
      }
      const publishResult = publishActionableWarningsReport(cacheManager2, cwd, report, {
        origin: "in-band",
        getFileSeq: getFileSeq ? (filePath) => getFileSeq.call(runtime, filePath) : void 0,
        dbg
      });
      const advisory = formatActionableWarningsAdvisory(publishResult.report, cwd, host, (report2) => {
        let dispositionSuppressed = 0;
        const files2 = report2.files.map((file) => {
          const policy = filterFindingsByDisposition(file.warnings, cwd, (warning) => {
            const { line, column, rule, code } = warning;
            return {
              filePath: warning.filePath,
              severity: warning.severity,
              semantic: "warning",
              tool: warning.tool,
              runner: warning.tool,
              message: warning.message,
              source: warning.origin === "lsp" ? "lsp" : "dispatch",
              ...line === void 0 ? {} : { line: warning.line },
              ...column === void 0 ? {} : { column: warning.column },
              ...rule === void 0 ? {} : { rule: warning.rule },
              ...code === void 0 ? {} : { code }
            };
          });
          dispositionSuppressed += policy.suppressed;
          const kept = policy.kept.filter((warning) => !(isSecretWarning(warning) && typeof warning.line === "number" && secretBlockedLocations.has(secretLocationKey(warning.filePath, warning.line))));
          return kept.length > 0 ? { ...file, warnings: kept } : void 0;
        }).filter((file) => file !== void 0);
        recordDispositionSuppressed("actionable-warnings", dispositionSuppressed);
        return { files: files2, suppressed: dispositionSuppressed };
      });
      if (advisory)
        advisoryParts.push(advisory);
      logActionableWarningsEvent({
        event: advisory ? "advisory_injected" : "advisory_skipped",
        sessionId: runtime.telemetrySessionId,
        metadata: {
          turnIndex: runtime.turnIndex,
          // #2504 review round 7 (F2): the MERGED report, matching the
          // advisory text above it (round 6, a) -- a rescued deferred
          // entry lives only on `publishResult.report`, and the pre-merge
          // `report` this turn assembled undercounts it. This is the value
          // scripts/analyze-pi-lens-logs.mjs sums, so an undercount here is
          // a silent miscount there too.
          unsuppressed: publishResult.report.summary.unsuppressed
        }
      });
      logLatency({
        type: "phase",
        toolName: "turn_end",
        filePath: cwd,
        phase: "actionable_warnings_report",
        durationMs: Date.now() - t4,
        metadata: report.summary
      });
    } catch (err) {
      dbg(`turn_end: actionable warning report failed: ${err}`);
      logLatency({
        type: "phase",
        toolName: "turn_end",
        filePath: cwd,
        phase: "actionable_warnings_report",
        durationMs: Date.now() - t4,
        metadata: {
          failed: true,
          error: err instanceof Error ? err.message : String(err)
        }
      });
    }
  }
  const t5 = Date.now();
  try {
    const qualityWarningsByFile = /* @__PURE__ */ new Map();
    for (const warning of runtime.peekCodeQualityWarnings(sessionId)) {
      const group = qualityWarningsByFile.get(warning.filePath);
      if (group)
        group.push(warning);
      else
        qualityWarningsByFile.set(warning.filePath, [warning]);
    }
    const qualityWarnings = [];
    let qualityDispositionSuppressed = 0;
    for (const [filePath, group] of qualityWarningsByFile) {
      let content;
      try {
        content = fs17.readFileSync(filePath, "utf-8");
      } catch {
        content = void 0;
      }
      const { kept, suppressed } = applyPushedFindingPolicy(group, {
        cwd,
        filePath,
        content
      });
      qualityWarnings.push(...kept);
      qualityDispositionSuppressed += suppressed;
    }
    const qualityReport = buildCodeQualityWarningsReport({
      cwd,
      sessionId: runtime.telemetrySessionId,
      turnIndex: runtime.turnIndex,
      warnings: qualityWarnings,
      modifiedRangesByFile,
      projectSeqStart: runtime.turnStartProjectSeq,
      projectSeqEnd: runtime.projectSeq,
      fileSeqByPath
    });
    writeCodeQualityWarningsReport(cacheManager2, cwd, qualityReport);
    appendCodeQualityWarningsHistory(cwd, qualityReport);
    const advisory = formatCodeQualityWarningsAdvisory(qualityReport, cwd, host);
    if (advisory)
      advisoryParts.push(advisory);
    logLatency({
      type: "phase",
      toolName: "turn_end",
      filePath: cwd,
      phase: "code_quality_warnings_report",
      durationMs: Date.now() - t5,
      metadata: {
        ...qualityReport.summary,
        // #3248: bounded per-turn on this lane's own row.
        dispositionSuppressed: qualityDispositionSuppressed
      }
    });
  } catch (err) {
    dbg(`turn_end: code quality warning report failed: ${err}`);
    logLatency({
      type: "phase",
      toolName: "turn_end",
      filePath: cwd,
      phase: "code_quality_warnings_report",
      durationMs: Date.now() - t5,
      metadata: {
        failed: true,
        error: err instanceof Error ? err.message : String(err)
      }
    });
  }
  cacheManager2.incrementTurnCycle(cwd, currentOwner, turnStateSessionId);
  const lateAuxStart = Date.now();
  const lateAuxDrain = isSecondarySession ? {
    drainedPairs: drainPendingAuxiliaryCoverage(),
    lateAuxCapEvicted: drainPendingAuxCapEvictedCount()
  } : holdScope.guardedWrite("turn-end:late-aux", () => ({
    drainedPairs: drainPendingAuxiliaryCoverage(),
    lateAuxCapEvicted: drainPendingAuxCapEvictedCount()
  })) ?? { drainedPairs: [], lateAuxCapEvicted: 0 };
  const { drainedPairs, lateAuxCapEvicted } = lateAuxDrain;
  const rearmLateAux = (pair) => isSecondarySession ? (rearmPendingAuxiliaryCoverage(pair), true) : holdScope.guardedWrite(
    // One subject for the store (#4168 F3): the row's count carries how many.
    "turn-end:late-aux-rearm",
    () => {
      rearmPendingAuxiliaryCoverage(pair);
      return true;
    }
  ) === true;
  let lateAuxDelivered = 0;
  let lateAuxStale = 0;
  let lateAuxMissing = 0;
  let lateAuxRearmed = 0;
  let lateAuxBacklogPending = 0;
  let lateAuxClientGone = 0;
  let lateAuxProbeFailed = 0;
  let lateAuxCleanConfirmed = 0;
  let lateAuxExpired = 0;
  let lateAuxCeilingExhausted = 0;
  let lateAuxAnswered = 0;
  let lateAuxNotifyStallDemoted = 0;
  let lateAuxHoldRearmed = 0;
  let lateAuxHoldExpired = 0;
  let lateAuxHoldCeiling = 0;
  let lateAuxDispositionSuppressed = 0;
  let lateAuxAuxSuppressed = 0;
  const lateAuxCoverageGapPairs = [];
  let lateAuxCoverageGapDetailCount = 0;
  let lateAuxCoverageGapDropCount = 0;
  const lateAuxStuckPairs = [];
  if (drainedPairs.length > 0) {
    const lateObserverDeadline = Date.now() + HOOK_WALL_BUDGET_MS.turn_end;
    const byFile = /* @__PURE__ */ new Map();
    for (const pair of drainedPairs) {
      const list = byFile.get(pair.filePath);
      if (list)
        list.push(pair);
      else
        byFile.set(pair.filePath, [pair]);
    }
    try {
      const service = getLSPService();
      for (const [lateAuxPath, pairs] of byFile) {
        let cached;
        try {
          cached = await service.readCachedDiagnosticsForServers(lateAuxPath, new Set(pairs.map((p) => p.serverId)));
        } catch {
          lateAuxProbeFailed += pairs.length;
          for (const pair of pairs) {
            if (canRearmPendingAuxiliary(pair)) {
              if (rearmLateAux(pair))
                lateAuxRearmed += 1;
            } else if (isPendingAuxiliaryPastRearmTtl(pair)) {
              lateAuxExpired += 1;
            } else {
              lateAuxCeilingExhausted += 1;
            }
          }
          continue;
        }
        const displayLateAuxPath = toRunnerDisplayPath(cwd, lateAuxPath);
        let lateAuxContentRead = false;
        let lateAuxContentValue;
        const readLateAuxContent = () => {
          if (!lateAuxContentRead) {
            lateAuxContentRead = true;
            try {
              lateAuxContentValue = fs17.readFileSync(lateAuxPath, "utf-8");
            } catch {
              lateAuxContentValue = void 0;
            }
          }
          return lateAuxContentValue;
        };
        for (const pair of pairs) {
          const cachedEntry = cached.get(pair.serverId);
          if (cachedEntry === void 0) {
            lateAuxClientGone += 1;
            continue;
          }
          if (cachedEntry.notifyStallDemoted) {
            if (cachedEntry.demotedAt === void 0 || pair.markedAtMs > cachedEntry.demotedAt) {
              lateAuxClientGone += 1;
              continue;
            }
            lateAuxNotifyStallDemoted += 1;
            const pastTtl = isPendingAuxiliaryPastRearmTtl(pair);
            const atCeiling = (pair.rearmCount ?? 0) >= MAX_LATE_AUX_REARMS;
            if (!pastTtl && !atCeiling) {
              if (rearmLateAux(pair)) {
                lateAuxRearmed += 1;
                if (lateAuxStuckPairs.length < 20)
                  lateAuxStuckPairs.push({
                    filePath: pair.filePath,
                    serverId: pair.serverId
                  });
              }
            } else {
              if (pastTtl)
                lateAuxExpired += 1;
              else
                lateAuxCeilingExhausted += 1;
              lateAuxCoverageGapPairs.push({
                filePath: pair.filePath,
                serverId: pair.serverId
              });
            }
            continue;
          }
          const rawDiags = cachedEntry.diags;
          const backlogPending = !isAuxBacklogPublished(pair);
          if (backlogPending)
            lateAuxBacklogPending += 1;
          if (cachedEntry.publishedAt === void 0 || cachedEntry.publishedAt <= pair.markedAtMs || backlogPending) {
            if (canRearmPendingAuxiliary(pair)) {
              if (rearmLateAux(pair)) {
                lateAuxRearmed += 1;
                if (lateAuxStuckPairs.length < 20)
                  lateAuxStuckPairs.push({
                    filePath: pair.filePath,
                    serverId: pair.serverId
                  });
              }
            } else {
              if (isPendingAuxiliaryPastRearmTtl(pair))
                lateAuxExpired += 1;
              else
                lateAuxCeilingExhausted += 1;
            }
            continue;
          }
          if (typeof service.observeLateAuxiliaryAnswer === "function") {
            await bounded(service.observeLateAuxiliaryAnswer(lateAuxPath, pair.serverId, cachedEntry.publishedAt - pair.markedAtMs), {
              ms: Math.max(1, lateObserverDeadline - Date.now()),
              signal: deps.signal,
              hook: "turn_end",
              label: "observeLateAuxiliaryAnswer"
            });
          }
          if (rawDiags.length === 0) {
            lateAuxCleanConfirmed += 1;
            continue;
          }
          const anchored = rawDiags.filter((d) => d.range?.start?.line !== void 0);
          if (anchored.length === 0) {
            lateAuxMissing += rawDiags.length;
            lateAuxAnswered += 1;
            continue;
          }
          const lateAuxContent = readLateAuxContent();
          const converted = convertLspDiagnostics(anchored, lateAuxPath);
          const retained = retagAuxiliaryDiagnostics(converted, anchored, lateAuxContent ?? "", { cwd, fileRole: detectFileRole(lateAuxPath, lateAuxContent) });
          lateAuxAuxSuppressed += converted.length - retained.length;
          if (retained.length === 0) {
            lateAuxAnswered += 1;
            continue;
          }
          const { "late-auxiliary-findings": gate3 } = gateFindingsByPathFreshness({
            cwd,
            sources: {
              "late-auxiliary-findings": {
                findings: retained,
                scannedAt: pair.markedAtMs,
                citedPath: () => lateAuxPath
              }
            }
          });
          lateAuxStale += gate3.stale.length;
          lateAuxMissing += retained.length - gate3.live.length - gate3.stale.length;
          if (gate3.live.length === 0) {
            if (gate3.stale.length > 0) {
              if (canRearmPendingAuxiliary(pair)) {
                if (rearmLateAux(pair))
                  lateAuxRearmed += 1;
              } else if (isPendingAuxiliaryPastRearmTtl(pair)) {
                lateAuxExpired += 1;
              } else {
                lateAuxCeilingExhausted += 1;
              }
            } else {
              lateAuxAnswered += 1;
            }
            continue;
          }
          const { kept: lateAuxKept, suppressed: lateAuxSuppressedHere } = applyPushedFindingPolicy(gate3.live, {
            cwd,
            filePath: lateAuxPath,
            content: lateAuxContent
          });
          lateAuxDispositionSuppressed += lateAuxSuppressedHere;
          if (lateAuxKept.length === 0) {
            lateAuxAnswered += 1;
            continue;
          }
          const lines = lateAuxKept.map((f) => `  ${displayLateAuxPath}:${f.line}:${f.column} [${f.rule}] ${f.message}`);
          lateAuxDelivered += lateAuxKept.length;
          lateAuxAnswered += 1;
          const lateAuxSuppressedNote = lateAuxSuppressedHere > 0 ? `; suppressed by disposition: ${lateAuxSuppressedHere} finding(s)` : "";
          const lateAuxPart = `\u{1F550} Late auxiliary diagnostics (${pair.serverId} answered after its grace window${lateAuxSuppressedNote}):
${lines.join("\n")}`;
          advisoryParts.push(lateAuxPart);
          deliveryHolds.push({
            part: lateAuxPart,
            canHold: () => canRearmPendingAuxiliary(pair),
            onHeld: () => {
              rearmPendingAuxiliaryCoverage(pair);
              lateAuxHoldRearmed += 1;
            },
            onDropped: () => {
              if (isPendingAuxiliaryPastRearmTtl(pair))
                lateAuxHoldExpired += 1;
              else
                lateAuxHoldCeiling += 1;
              incrementDegradationCount({
                kind: "late-auxiliary-held-dropped",
                subject: `late-auxiliary:${pair.serverId}`,
                reason: "cut by the turn-end cap and past its re-arm bound, so not re-armed"
              });
            }
          });
        }
      }
    } catch (err) {
      dbg(`turn_end: late-auxiliary probe failed: ${err}`);
    }
    for (const pair of lateAuxCoverageGapPairs) {
      const normalizedPairPath = normalizeMapKey(pair.filePath);
      const emitted2 = emitBounded("lsp_scanner_coverage_gap", `${pair.serverId}:${normalizedPairPath}`, {
        filePath: normalizedPairPath,
        durationMs: 0,
        metadata: {
          source: "late-auxiliary",
          serverIds: [pair.serverId],
          reason: "notify-stall-replacement-unavailable",
          reRaised: true
        }
      }, {
        ledgerKind: "lsp-scanner-coverage-gap",
        reason: "notify-stall replacement was not available before late-coverage ceiling",
        capPerTurn: {
          limit: LATE_AUX_COVERAGE_GAP_DETAIL_CAP_PER_TURN,
          turnIndex: runtime.turnIndex
        }
      });
      if (emitted2)
        lateAuxCoverageGapDetailCount += 1;
      else
        lateAuxCoverageGapDropCount += 1;
    }
    logLatency({
      type: "phase",
      toolName: "turn_end",
      filePath: cwd,
      phase: "late_auxiliary_findings",
      durationMs: Date.now() - lateAuxStart,
      metadata: {
        pending: drainedPairs.length,
        pairCreated: drainedPairs.length + lateAuxCapEvicted,
        pendingAfter: pendingAuxiliaryCoverageSize(),
        delivered: lateAuxDelivered,
        stale: lateAuxStale,
        missing: lateAuxMissing,
        rearmed: lateAuxRearmed,
        backlogPending: lateAuxBacklogPending,
        clientGone: lateAuxClientGone,
        probeFailed: lateAuxProbeFailed,
        cleanConfirmed: lateAuxCleanConfirmed,
        expired: lateAuxExpired,
        ceilingExhausted: lateAuxCeilingExhausted,
        answered: lateAuxAnswered,
        dispositionSuppressed: lateAuxDispositionSuppressed,
        auxSuppressed: lateAuxAuxSuppressed,
        notifyStallDemoted: lateAuxNotifyStallDemoted,
        coverageGapReRaised: lateAuxCoverageGapPairs.length,
        coverageGapReRaisedDetailed: lateAuxCoverageGapDetailCount,
        coverageGapReRaisedDropped: lateAuxCoverageGapDropCount,
        capEvicted: lateAuxCapEvicted,
        stuckPairs: lateAuxStuckPairs
      }
    });
  }
  const unresolvedKeys = new Set(unresolvedBlockers.map((record) => normalizeMapKey(path24.resolve(record.filePath))));
  const formatResolvedTail = (dropped) => `\u2026 and ${dropped} more`;
  const resolvedTailMax = formatResolvedTail(Number.MAX_SAFE_INTEGER).length;
  const resolvedShareChars = Math.floor(RUNTIME_CONFIG.turnEnd.maxChars * RESOLVED_SHARE_OF_CHARS) - resolvedTailMax;
  const formatResolvedLine = (entry) => {
    const clause = entry.confirmedClean ? " confirmed clean" : entry.writeIndex === void 0 ? "" : ` cleared by the ${formatWriteOrdinal(entry.writeIndex)} write`;
    const label = entry.turnIndex === runtime.turnIndex ? "Resolved this turn" : "Resolved since the last report";
    const head = `${label}: `;
    const tail = ` (${entry.blockerCount} blocker(s)${clause})`;
    let display = toRunnerDisplayPath(cwd, entry.filePath);
    const room = resolvedShareChars - 1 - head.length - tail.length;
    if (display.length > room) {
      const keepHead = Math.ceil((room - 1) / 2);
      display = `${sliceAtCodePointBoundaries(display, 0, keepHead)}\u2026${sliceAtCodePointBoundaries(display, display.length - (room - 1 - keepHead), display.length)}`;
    }
    return `${head}${display}${tail}`;
  };
  const blockerText = blockerParts.join("\n\n");
  const blockerChars = blockerParts.length > 0 ? blockerText.length + 2 : 0;
  const blockerLines = blockerParts.length > 0 ? blockerText.split("\n").length + 1 : 0;
  const resolvedCharBudget = Math.min(resolvedShareChars, RUNTIME_CONFIG.turnEnd.maxChars - blockerChars - resolvedTailMax);
  const resolvedLineBudget = Math.min(RESOLVED_MAX_LINES, RUNTIME_CONFIG.turnEnd.maxLines - blockerLines) - 1;
  let resolvedChars = 0;
  let resolvedCount = 0;
  const { files: resolvedBlockerFileList, dropped: resolvedBlockerFilesDropped } = runtime.consumeResolvedBlockerFiles((entry) => {
    if (unresolvedKeys.has(normalizeMapKey(path24.resolve(entry.filePath))))
      return true;
    const cost = formatResolvedLine(entry).length + 1;
    if (resolvedCount > 0 && (resolvedCount >= resolvedLineBudget || resolvedChars + cost > resolvedCharBudget))
      return true;
    resolvedChars += cost;
    resolvedCount += 1;
    return false;
  });
  const resolvedLines = resolvedBlockerFileList.map(formatResolvedLine);
  if (resolvedBlockerFilesDropped > 0) {
    resolvedLines.push(formatResolvedTail(resolvedBlockerFilesDropped));
  }
  const resolvedParts = resolvedLines.length > 0 ? [resolvedLines.join("\n")] : [];
  const asIs = (raw) => ({ raw, text: raw });
  const composedParts = [
    // #3218 criterion 2: the resolution lines ride FIRST, inside their
    // sized share, so the cap cuts neither a consumed retirement
    // (review-3776-verify V1) nor a live blocker (review-3776-r3 W1).
    // They are not a finding tier (no gate applies to a just-cleared
    // verdict), only a status line, and they are part of the block content
    // so an otherwise empty turn still delivers them ONCE (the coordinator
    // consumed them).
    ...resolvedParts.map(asIs),
    ...blockerParts.map(asIs),
    ...staleSecretParts.map(asIs),
    // #3814: a blocking late-runner finding never reaches `advisoryParts`; it
    // rides the blocker replay, so every advisory part gets the label.
    ...advisoryParts.map((raw) => ({
      raw,
      text: `\u2139\uFE0F Advisory \u2014 no action required this turn:
${raw}`
    }))
  ];
  const findingParts = composedParts.map((part) => part.text);
  let heldSections = 0;
  if (findingParts.length > 0) {
    dbg(`turn_end: ${blockerParts.length} blocker section(s), ${advisoryParts.length} advisory section(s) found, persisting for next context`);
    const joined = findingParts.join("\n\n");
    const holdPlan = planDeliveryHolds({
      holds: deliveryHolds,
      parts: composedParts,
      keptChars: turnEndKeptChars(joined),
      separatorLength: "\n\n".length
    });
    const settleHolds = (suppressed) => {
      const outcome = holdPlan.settle({
        suppressed,
        isCurrentSession: () => holdScope.isCurrent(),
        onFault: (cause) => dbg(`turn_end: delivery hold failed: ${cause}`)
      });
      heldSections = outcome.held;
      if (lateAuxHoldRearmed + lateAuxHoldExpired + lateAuxHoldCeiling > 0) {
        logLatency({
          type: "phase",
          toolName: "turn_end",
          filePath: cwd,
          phase: "late_auxiliary_holds",
          durationMs: 0,
          metadata: {
            rearmed: lateAuxHoldRearmed,
            expired: lateAuxHoldExpired,
            ceilingExhausted: lateAuxHoldCeiling,
            pendingAfter: pendingAuxiliaryCoverageSize()
          }
        });
      }
      if (outcome.held > 0) {
        incrementDegradationCount({
          kind: "turn-end-sections-held",
          subject: "turn-end",
          reason: `${outcome.held} one-shot section(s) cut by the turn-end cap, kept pending for the next turn`
        });
      }
    };
    const content = capTurnEndMessage(joined, holdPlan.heldCount);
    const signature = `${files.slice().sort((a, b) => compareOrdinal(a, b)).join("|")}::${content}`;
    const last = cacheManager2.readCache("turn-end-findings-last", cwd);
    if (last?.data?.signature === signature && last?.data?.sessionId === runtime.telemetrySessionId && // #3813: a retirement is an event, not a persisting finding. The
    // coordinator already consumed these entries, so an identical
    // second retirement on consecutive turns (same file, count and
    // ordinal) would be consumed and never shown (#3776 verify r3 F6).
    resolvedBlockerFileList.length === 0) {
      dbg("turn_end: duplicate findings detected (same session), suppressing re-prompt");
      if (getFlag("lens-guard")) {
        const existingGuard = cacheManager2.readCache("turn-end-findings", cwd)?.data;
        if (existingGuard) {
          writeGitGuardRecord(cacheManager2, runtime, cwd, {
            ...existingGuard,
            content,
            blockerContent: blockerParts.length > 0 ? capTurnEndMessage(blockerParts.join("\n\n")) : void 0,
            hasBlockers: blockerParts.length > 0 || existingGuard.testFailures === true,
            blockingFiles: blockerParts.length > 0 ? existingGuard.affectedFiles : void 0,
            projectSeqStart: runtime.turnStartProjectSeq,
            projectSeqEnd: runtime.projectSeq,
            fileSeqByPath: Object.fromEntries(runtime.getFileSeqEntries().map(([filePath, seq]) => [
              normalizeMapKey(path24.resolve(filePath)),
              seq
            ])),
            fileContentHashes: {},
            consumed: false
          });
        }
      }
      settleHolds(true);
      clearOwnedTurnState();
      runtime.fixedThisTurn.clear();
      resetFormatService2();
      return;
    }
    settleHolds(false);
    const fileSeqByPath2 = {};
    for (const [filePath, seq] of runtime.getFileSeqEntries()) {
      fileSeqByPath2[normalizeMapKey(path24.resolve(filePath))] = seq;
    }
    if (getFlag("lens-guard")) {
      const existingGuard = cacheManager2.readCache("turn-end-findings", cwd)?.data;
      const blockingContent = blockerParts.length > 0 ? capTurnEndMessage(blockerParts.join("\n\n")) : void 0;
      const affectedFiles = [
        ...existingGuard?.affectedFiles ?? [],
        ...files.map((file) => resolveRunnerPath(cwd, file)),
        ...cascadeResults.flatMap((result) => result.neighbors.filter((neighbor) => neighbor.diagnostics.length > 0).map((neighbor) => resolveRunnerPath(cwd, neighbor.filePath)))
      ];
      writeGitGuardRecord(cacheManager2, runtime, cwd, {
        content: [content, existingGuard?.testFailureContent].filter((value) => !!value).join("\n\n"),
        blockerContent: blockingContent,
        blockingFiles: blockerParts.length > 0 ? affectedFiles : void 0,
        hasBlockers: !!blockingContent || existingGuard?.testFailures === true,
        affectedFiles,
        sessionId: runtime.telemetrySessionId,
        projectSeqStart: runtime.turnStartProjectSeq,
        projectSeqEnd: runtime.projectSeq,
        fileSeqByPath: fileSeqByPath2,
        fileContentHashes: {},
        consumed: false,
        testFailures: existingGuard?.testFailures,
        testFailureContent: existingGuard?.testFailureContent,
        testFailureFiles: existingGuard?.testFailureFiles
      });
    } else {
      const allAffectedFiles = [
        ...files.map((file) => resolveRunnerPath(cwd, file)),
        ...cascadeResults.flatMap((result) => result.neighbors.filter((neighbor) => neighbor.diagnostics.length > 0).map((neighbor) => resolveRunnerPath(cwd, neighbor.filePath)))
      ];
      const affectedFiles = [...new Set(allAffectedFiles)].slice(0, MAX_ADVISORY_AFFECTED_FILES);
      const affectedFilesTruncated = new Set(allAffectedFiles).size > affectedFiles.length;
      cacheManager2.writeCache("turn-end-findings", {
        content,
        affectedFiles,
        affectedFilesTruncated,
        provenance: snapshotAdvisoryProvenance({
          cwd,
          runtime,
          generation: 0,
          files: affectedFiles.map((file) => ({
            path: file,
            role: "affected"
          })),
          truncated: affectedFilesTruncated
        })
      }, cwd);
    }
    cacheManager2.writeCache("turn-end-findings-last", {
      signature,
      sessionId: runtime.telemetrySessionId,
      projectSeqStart: runtime.turnStartProjectSeq,
      projectSeqEnd: runtime.projectSeq
    }, cwd);
    emitLensTurnFindings({
      cwd,
      filePaths: files.map((file) => resolveRunnerPath(cwd, file)),
      sessionId: runtime.telemetrySessionId,
      turnIndex: runtime.turnIndex,
      blockerSections: blockerParts.length,
      advisorySections: advisoryParts.length,
      content
    });
  }
  if (blockerParts.length === 0) {
    clearOwnedTurnState();
    if (getFlag("lens-guard") && advisoryParts.length === 0 && staleSecretParts.length === 0 && // #3218 criterion 2: a resolved line is content worth delivering,
    // so it must not be erased by the no-blockers clean-up. The
    // reader clears it after delivery because `hasBlockers` is false.
    resolvedParts.length === 0 && !runtime.gitGuardHasBlockers) {
      const guardRecord = cacheManager2.readCache("turn-end-findings", cwd)?.data;
      if (guardRecord?.sessionId === runtime.telemetrySessionId && guardRecord.testFailures !== true) {
        cacheManager2.clearCache("turn-end-findings", cwd);
      }
    }
  }
  runtime.fixedThisTurn.clear();
  runtime.clearActionableWarnings(sessionId);
  runtime.clearCodeQualityWarnings(sessionId);
  if (demotedFindingsRetired > 0) {
    cacheManager2.clearCache("turn-end-findings-last", cwd);
  }
  logLatency({
    type: "tool_result",
    toolName: "turn_end",
    filePath: cwd,
    durationMs: Date.now() - turnEndStart,
    // #1622 review M2: a pending stale secret is NOT a clean turn. It gets its
    // own result rather than being promoted to `blockers_found`, which would
    // undo the demotion the freshness gate just made.
    result: blockerParts.length > 0 ? "blockers_found" : staleSecretParts.length > 0 ? "stale_secrets_pending" : "clean",
    metadata: {
      fileCount: files.length,
      blockerSections: blockerParts.length,
      staleSecretSections: staleSecretParts.length,
      advisorySections: advisoryParts.length,
      // #3218 criterion 2: how many files this turn LISTED as resolved
      // (held-back entries are not counted), and how many retire events
      // fell past the cap. The line itself is in the delivered content;
      // these make the feature visible in latency.log even when the block
      // is suppressed or the agent reads only telemetry.
      resolvedBlockerFiles: resolvedBlockerFileList.length,
      resolvedBlockerFilesDropped,
      // #3813: one-shot parts the cap cut that stay pending for the next turn.
      heldSections,
      // #1944 AC3: an empty advisory section on its own cannot say whether
      // the turn had nothing to report or dropped something. This counter
      // answers that from latency.log even when the payload is empty, and
      // the payload itself carries the retirement note when it is not.
      demotedFindingsRetired,
      // #2275: the widget-footer store's own dependency-drift retirements —
      // a separate surface/counter from `demotedFindingsRetired` above,
      // since a widget retirement never touches `advisoryParts` or the
      // `turn-end-findings-last` suppression cache the block below clears.
      widgetDemotedFindingsRetired
    }
  });
  resetFormatService2();
}

// dist/clients/mcp/session.js
var contextPromise;
var resolvedRuntime;
function getMcpSessionContext() {
  contextPromise ??= (async () => {
    const context = {
      runtime: new RuntimeCoordinator(),
      cacheManager: new CacheManager(),
      astGrepClient: new AstGrepClient(),
      clients: await loadBootstrapClients()
    };
    resolvedRuntime = context.runtime;
    return context;
  })().catch((err) => {
    contextPromise = void 0;
    throw err;
  });
  return contextPromise;
}
function peekMcpSessionRuntime() {
  return resolvedRuntime;
}
var noop = () => {
};
function joinMessages(consumed) {
  if (!consumed?.messages?.length)
    return void 0;
  return consumed.messages.map((message) => message.content).join("\n\n");
}
var degradedSessionStart = {
  aliveLspClients: 0
};
async function runSessionStartImpl(cwd) {
  startSituationalToolTelemetrySession("mcp");
  const ctx = await getMcpSessionContext();
  const host = createMcpHost(void 0, cwd);
  await bounded(handleSessionStart({
    ctxCwd: cwd,
    // The MCP server has no TUI keystroke latency to protect, so the
    // first-call-quick heuristic must not apply. Force "full" mode so
    // the dominant-language LSP pre-warm, scans, and error-debt baseline
    // all run on the first (and only) session_start of the process.
    // An explicit PI_LENS_STARTUP_MODE env var still wins (handled in
    // handleSessionStart — the override is only checked when the env var
    // is unset).
    startupModeOverride: "full",
    getFlag: host.getFlag,
    notify: noop,
    dbg: noop,
    log: noop,
    runtime: ctx.runtime,
    cacheManager: ctx.cacheManager,
    astGrepClient: ctx.astGrepClient,
    // The MCP server has already loaded the analyzer graph (an MCP call has
    // nothing to defer to), so it hands the handler the same one-shape seam
    // every other caller uses rather than a second, field-by-field shape.
    bootstrap: residentBootstrapAccess(ctx.clients),
    ensureTool: async (name) => (await import("../probes/installer.js")).ensureTool(name),
    cleanStaleTsBuildInfo: () => [],
    resetDispatchBaselines: (cwdArg) => resetDispatchBaselines(cwdArg ?? cwd),
    resetLSPService
  }), {
    ms: HOOK_WALL_BUDGET_MS.session_start,
    signal: void 0,
    hook: "session_start",
    label: "handleSessionStart"
  });
  const baseline = ctx.runtime.errorDebtBaseline;
  return {
    guidance: joinMessages(consumeSessionStartGuidance(ctx.cacheManager, cwd, "mcp")),
    errorDebtBaseline: baseline ? { testsPassed: baseline.testsPassed, buildPassed: baseline.buildPassed } : void 0,
    aliveLspClients: getLSPService().getAliveClientCount()
  };
}
function runSessionStart(cwd) {
  return bounded(runSessionStartImpl(cwd), {
    ms: HOOK_WALL_BUDGET_MS.session_start,
    signal: void 0,
    hook: "session_start",
    label: "mcp-session-start"
  }).then((outcome) => outcome ?? degradedSessionStart);
}
var degradedTurnEnd = {
  outcome: { filesRegistered: 0 },
  commit: () => {
  }
};
var TURN_END_DELIVERY_TTL_MS = 10 * 6e4;
var TURN_END_DELIVERY_MAX = 8;
var TURN_END_QUEUE_WAIT_MS = 5e3;
var TurnEndQueue = class {
  running = false;
  pending = [];
  enqueue(work, waitMs = TURN_END_QUEUE_WAIT_MS) {
    if (this.pending.length >= 1) {
      return Promise.reject(new Error("turn_end queue is busy"));
    }
    return new Promise((resolve32, reject) => {
      const item = {
        work,
        resolve: resolve32,
        reject,
        timer: setTimeout(() => {
          const index = this.pending.indexOf(item);
          if (index === -1)
            return;
          this.pending.splice(index, 1);
          reject(new Error("turn_end queue wait timed out"));
        }, waitMs)
      };
      item.timer.unref();
      this.pending.push(item);
      this.drain();
    });
  }
  drain() {
    if (this.running)
      return;
    const item = this.pending.shift();
    if (!item)
      return;
    clearTimeout(item.timer);
    this.running = true;
    void item.work().then(item.resolve, item.reject).finally(() => {
      this.running = false;
      this.drain();
    });
  }
  reset() {
    for (const item of this.pending.splice(0)) {
      clearTimeout(item.timer);
      item.reject(new Error("turn_end queue reset"));
    }
    this.running = false;
  }
};
var turnEndQueue = new TurnEndQueue();
var pendingTurnEndDeliveries = /* @__PURE__ */ new Map();
var inFlightIpcTurnEnds = /* @__PURE__ */ new Map();
async function runTurnEndNowImpl(cwd, files = [], deferredDelivery = false) {
  const ctx = await getMcpSessionContext();
  const host = createMcpHost(void 0, cwd);
  let registered = 0;
  for (const file of files) {
    const abs = path25.isAbsolute(file) ? file : path25.resolve(cwd, file);
    let lineCount3 = 1;
    try {
      lineCount3 = fs18.readFileSync(abs, "utf8").split("\n").length;
    } catch {
      continue;
    }
    ctx.cacheManager.addModifiedRange(abs, { start: 1, end: lineCount3 }, true, cwd, MCP_TURN_STATE_OWNER_ID, "mcp");
    registered++;
  }
  const owner = {
    kind: "mcp",
    id: MCP_TURN_STATE_OWNER_ID,
    pid: process.pid,
    lastSeen: (/* @__PURE__ */ new Date()).toISOString()
  };
  await handleTurnEnd({
    signal: void 0,
    ctxCwd: cwd,
    getFlag: host.getFlag,
    dbg: noop,
    runtime: ctx.runtime,
    cacheManager: ctx.cacheManager,
    knipClient: ctx.clients.knipClient,
    deadCodeClients: ctx.clients.deadCodeClients,
    depChecker: ctx.clients.depChecker,
    testRunnerClient: ctx.clients.testRunnerClient,
    host: "mcp",
    owner,
    resetLSPService,
    resetFormatService
  });
  const outcome = deferredDelivery ? {
    turnEnd: joinMessages(peekTurnEndFindings(ctx.cacheManager, cwd, ctx.runtime, true)),
    tests: joinMessages(peekTestFindings(ctx.cacheManager, cwd, ctx.runtime, true)),
    filesRegistered: registered
  } : {
    turnEnd: joinMessages(consumeTurnEndFindings(ctx.cacheManager, cwd, ctx.runtime)),
    tests: joinMessages(consumeTestFindings(ctx.cacheManager, cwd, ctx.runtime)),
    filesRegistered: registered
  };
  return {
    outcome,
    commit: () => {
      if (!deferredDelivery)
        return;
      acknowledgeTurnEndFindings(ctx.cacheManager, cwd);
      acknowledgeTestFindings(ctx.cacheManager, cwd);
    }
  };
}
function runTurnEndNow(cwd, files = [], deferredDelivery = false) {
  return bounded(runTurnEndNowImpl(cwd, files, deferredDelivery), {
    ms: HOOK_WALL_BUDGET_MS.turn_end,
    signal: void 0,
    hook: "turn_end",
    label: "mcp-turn-end"
  }).then((transaction) => transaction ?? degradedTurnEnd);
}
function runTurnEnd(cwd, files = []) {
  return turnEndQueue.enqueue(async () => (await runTurnEndNow(cwd, files)).outcome);
}
function hasTurnEndFindings(outcome) {
  return Boolean(outcome.turnEnd || outcome.tests);
}
function prunePendingTurnEndDeliveries(now = Date.now()) {
  for (const [deliveryId, delivery] of pendingTurnEndDeliveries) {
    if (now - delivery.createdAt >= TURN_END_DELIVERY_TTL_MS) {
      pendingTurnEndDeliveries.delete(deliveryId);
    }
  }
  while (pendingTurnEndDeliveries.size > TURN_END_DELIVERY_MAX) {
    const oldest = pendingTurnEndDeliveries.keys().next();
    if (oldest.done)
      break;
    pendingTurnEndDeliveries.delete(oldest.value);
  }
}
function pendingForCwd(cwd) {
  for (const [deliveryId, delivery] of pendingTurnEndDeliveries) {
    if (delivery.cwd === cwd)
      return [deliveryId, delivery];
  }
  return void 0;
}
function runTurnEndForIpc(cwd) {
  const inFlight = inFlightIpcTurnEnds.get(cwd);
  if (inFlight)
    return inFlight;
  const run = runTurnEndForIpcNow(cwd).finally(() => {
    if (inFlightIpcTurnEnds.get(cwd) === run)
      inFlightIpcTurnEnds.delete(cwd);
  });
  inFlightIpcTurnEnds.set(cwd, run);
  return run;
}
function runTurnEndForIpcNow(cwd) {
  return turnEndQueue.enqueue(async () => {
    prunePendingTurnEndDeliveries();
    const pending2 = pendingForCwd(cwd);
    if (pending2) {
      return {
        outcome: pending2[1].transaction.outcome,
        deliveryId: pending2[0]
      };
    }
    const ctx = await getMcpSessionContext();
    const cachedOutcome = {
      turnEnd: joinMessages(peekTurnEndFindings(ctx.cacheManager, cwd, ctx.runtime, true)),
      tests: joinMessages(peekTestFindings(ctx.cacheManager, cwd, ctx.runtime, true)),
      filesRegistered: 0
    };
    const transaction = hasTurnEndFindings(cachedOutcome) ? {
      outcome: cachedOutcome,
      commit: () => {
        acknowledgeTurnEndFindings(ctx.cacheManager, cwd);
        acknowledgeTestFindings(ctx.cacheManager, cwd);
      }
    } : await runTurnEndNow(cwd, [], true);
    if (!hasTurnEndFindings(transaction.outcome)) {
      return { outcome: transaction.outcome };
    }
    const deliveryId = crypto.randomUUID();
    pendingTurnEndDeliveries.set(deliveryId, {
      cwd,
      transaction,
      createdAt: Date.now()
    });
    prunePendingTurnEndDeliveries();
    return { outcome: transaction.outcome, deliveryId };
  });
}
function acknowledgeTurnEnd(cwd, deliveryId) {
  prunePendingTurnEndDeliveries();
  const delivery = pendingTurnEndDeliveries.get(deliveryId);
  if (!delivery || delivery.cwd !== cwd)
    return false;
  delivery.transaction.commit();
  pendingTurnEndDeliveries.delete(deliveryId);
  return true;
}

// dist/clients/module-report.js
import * as fs19 from "node:fs";
import * as path26 from "node:path";

// dist/clients/middle-man-analysis.js
var SELF_TOKEN = {
  typescript: { token: "this", sep: "." },
  tsx: { token: "this", sep: "." },
  javascript: { token: "this", sep: "." },
  java: { token: "this", sep: "." },
  kotlin: { token: "this", sep: "." },
  csharp: { token: "this", sep: "." },
  swift: { token: "this", sep: "." },
  dart: { token: "this", sep: "." },
  rust: { token: "self", sep: "." },
  python: { token: "self", sep: "." },
  ruby: { token: "self", sep: "." },
  php: { token: "$this", sep: "->" }
};
var INTENTIONAL_FORWARDER_NAME = /adapter|facade|proxy|wrapper|decorator/i;
var CONSTRUCTOR_NAMES = /* @__PURE__ */ new Set([
  "constructor",
  "__init__",
  "__new__",
  "initialize"
]);
var MIN_CANDIDATE_METHODS = 2;
var DELEGATION_RATIO_THRESHOLD = 0.9;
function buildForwardRegex(token, sep2) {
  const t = escapeRegExp(token);
  const s = escapeRegExp(sep2);
  return new RegExp(`^(?:return\\s+)?(?:await\\s+)?${t}${s}(\\w+)${s}(\\w+)\\(([^()]*)\\)\\s*;?$`);
}
function splitArgs(s) {
  const trimmed = s.trim();
  if (!trimmed)
    return [];
  return trimmed.split(",").map((a) => a.trim());
}
function paramNamesFromSignature(signature, languageId) {
  const inner = (signature ?? "").trim().replace(/^\(/, "").replace(/\)$/, "");
  if (inner.trim() === "")
    return [];
  if (inner.includes("{") || inner.includes("["))
    return void 0;
  const names = splitArgs(inner).filter((p) => p.length > 0).map((raw) => {
    let name = raw;
    const isRest = name.startsWith("...");
    name = name.replace(/^\.\.\./, "");
    name = name.split("=")[0].trim();
    name = name.split(":")[0].trim();
    name = name.replace(/\?$/, "");
    return isRest ? `...${name}` : name;
  });
  if (languageId === "python" && names[0] === "self")
    return names.slice(1);
  if (languageId === "python" && names[0] === "cls")
    return names.slice(1);
  return names;
}
function bodyStatementLines(lines, entry, isPython) {
  const raw = lines.slice(entry.startLine - 1, entry.endLine).join("\n");
  let body;
  if (isPython) {
    const nlIdx = raw.indexOf("\n");
    if (nlIdx === -1)
      return [];
    body = raw.slice(nlIdx + 1);
  } else {
    const braceIdx = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");
    if (braceIdx === -1 || lastBrace === -1 || lastBrace <= braceIdx)
      return [];
    body = raw.slice(braceIdx + 1, lastBrace);
  }
  return body.replace(/\/\*[\s\S]*?\*\//g, "").split("\n").map((l) => l.replace(/\/\/.*$/, "")).map((l) => isPython ? l.replace(/#.*$/, "") : l).map((l) => l.trim()).filter((l) => l.length > 0).filter((l) => !/^("""|''')/.test(l));
}
function isAccessorLine(rawLine) {
  return /^\s*(?:public\s+|private\s+|protected\s+|internal\s+|static\s+|override\s+|readonly\s+)*(?:get|set)\s+\w+\s*[/(]/.test(rawLine);
}
function analyzeMiddleMan(classEntry, lines, languageId) {
  if (!languageId)
    return void 0;
  const selfSpec = SELF_TOKEN[languageId];
  if (!selfSpec)
    return void 0;
  if (!classEntry.members || classEntry.members.length === 0)
    return void 0;
  const isPython = languageId === "python";
  const forwardRe = buildForwardRegex(selfSpec.token, selfSpec.sep);
  const className = classEntry.name;
  const candidates = classEntry.members.filter((m) => {
    if (m.kind !== "method")
      return false;
    if (CONSTRUCTOR_NAMES.has(m.name))
      return false;
    if (m.name === className || m.name === `~${className}`)
      return false;
    const rawLine = lines[m.startLine - 1] ?? "";
    if (isAccessorLine(rawLine))
      return false;
    return true;
  });
  if (candidates.length < MIN_CANDIDATE_METHODS)
    return void 0;
  let forwardingCount = 0;
  const fieldCounts = /* @__PURE__ */ new Map();
  for (const member of candidates) {
    const bodyLines = bodyStatementLines(lines, member, isPython);
    if (bodyLines.length !== 1)
      continue;
    const match = forwardRe.exec(bodyLines[0]);
    if (!match)
      continue;
    const [, field, calledMethod, argsText] = match;
    const paramNames = paramNamesFromSignature(member.signature, languageId);
    if (paramNames === void 0)
      continue;
    const args = splitArgs(argsText);
    if (args.length !== paramNames.length)
      continue;
    if (!args.every((a, i) => a === paramNames[i]))
      continue;
    void calledMethod;
    forwardingCount += 1;
    fieldCounts.set(field, (fieldCounts.get(field) ?? 0) + 1);
  }
  if (forwardingCount === 0)
    return void 0;
  if (fieldCounts.size !== 1)
    return void 0;
  const [delegateField] = [...fieldCounts.keys()];
  return {
    delegationRatio: forwardingCount / candidates.length,
    candidateCount: candidates.length,
    forwardingCount,
    delegateField
  };
}
function implementsInterface(lines, classEntry) {
  const declText = lines.slice(classEntry.startLine - 1, Math.min(classEntry.startLine + 1, lines.length)).join(" ");
  return /\bimplements\b/.test(declText);
}
function annotateMiddleMan(entries, content, languageId) {
  if (!languageId || !SELF_TOKEN[languageId])
    return;
  const lines = content.split(/\r?\n/);
  for (const entry of entries) {
    if (entry.kind !== "class")
      continue;
    if (INTENTIONAL_FORWARDER_NAME.test(entry.name))
      continue;
    if (implementsInterface(lines, entry))
      continue;
    const signal = analyzeMiddleMan(entry, lines, languageId);
    if (!signal)
      continue;
    if (signal.delegationRatio < DELEGATION_RATIO_THRESHOLD)
      continue;
    entry.delegationRatio = signal.delegationRatio;
    entry.flags = entry.flags ? [...entry.flags, "middle man"] : ["middle man"];
  }
}

// dist/clients/module-report.js
var MAX_MODULE_REPORT_REFS = 100;
function normalizeMaxRefsPerSymbol(value) {
  if (value === void 0 || !Number.isFinite(value))
    return 10;
  return Math.min(MAX_MODULE_REPORT_REFS, Math.max(1, Math.floor(value)));
}
function tsLangForFile(filePath, kind) {
  if (kind === "jsts") {
    return resolveTreeSitterLanguage(filePath) ?? "typescript";
  }
  return symbolExtractionGrammar(kind, filePath);
}
var extractorCache = /* @__PURE__ */ new Map();
async function getExtractor(languageId) {
  let cached = extractorCache.get(languageId);
  if (!cached) {
    cached = (async () => {
      const client = getSharedTreeSitterClient();
      if (!client)
        return null;
      const extractor = new TreeSitterSymbolExtractor(languageId, client);
      const ok = await extractor.init();
      return ok ? extractor : null;
    })().catch((err) => {
      extractorCache.delete(languageId);
      throw err;
    });
    extractorCache.set(languageId, cached);
  }
  return cached;
}
function diagnosticMessage(err) {
  return err instanceof Error ? err.message : String(err);
}
async function extractFile(absPath, languageId, content) {
  try {
    const tsClient = getSharedTreeSitterClient();
    if (!tsClient) {
      return {
        symbols: [],
        imports: [],
        callbacks: [],
        error: "tree-sitter runtime unavailable (wasm aborted)"
      };
    }
    const initialized = await tsClient.init();
    if (!initialized) {
      return {
        symbols: [],
        imports: [],
        callbacks: [],
        error: "tree-sitter runtime failed to initialize"
      };
    }
    const extractor = await getExtractor(languageId);
    const extracted = await tsClient.withParsedTree(absPath, languageId, content, (tree) => {
      const warnings = extractor ? [] : [`Symbol extractor not available for ${languageId}`];
      const result = extractor ? extractor.extract(tree, absPath, content) : { symbols: [], imports: [] };
      const owners = result.symbols.filter((candidate) => !candidate.local).map((candidate) => ({
        name: candidate.name,
        startLine: candidate.line,
        endLine: candidate.endLine ?? candidate.line
      }));
      let callbacks = [];
      let callbackError;
      try {
        callbacks = extractCallbacks(tree.rootNode, owners, languageId, warnings);
      } catch (thrown) {
        if (classifyTreeSitterWasmError(thrown)) {
          tsClient.reportWasmAbort(thrown);
          callbackError = `tree-sitter wasm runtime failure (${diagnosticMessage(thrown)})`;
        } else {
          callbackError = diagnosticMessage(thrown);
        }
      }
      return {
        symbols: result.symbols,
        imports: result.imports,
        callbacks,
        callbackError,
        warnings
      };
    }, "module-report");
    if (!extracted.parsed) {
      return {
        symbols: [],
        imports: [],
        callbacks: [],
        error: `tree-sitter failed to parse as ${languageId}`
      };
    }
    return extracted.value;
  } catch (err) {
    const message = diagnosticMessage(err);
    logLatency({
      type: "phase",
      phase: "module_report_extract_error",
      filePath: absPath,
      durationMs: 0,
      metadata: { error: message }
    });
    return { symbols: [], imports: [], callbacks: [], error: message };
  }
}
function readArgsFor(filePath, startLine, endLine) {
  const offset = Math.max(1, startLine);
  const limit = Math.max(1, endLine - startLine + 1);
  return { path: filePath, offset, limit };
}
function resolveUsedBy(graph, symbolNodeId, cap, projectRoot) {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  for (const edge of graph.edgesByTo.get(symbolNodeId) ?? []) {
    if (edge.kind !== "calls" && edge.kind !== "references")
      continue;
    const from = graph.nodes.get(edge.from);
    const rawFile = from?.filePath ?? (edge.from.startsWith("file:") ? edge.from.slice("file:".length) : "");
    if (!rawFile)
      continue;
    const file = toDisplayPath(rawFile, projectRoot);
    const symbol = from?.qualifiedName ?? from?.symbolName ?? "";
    const line = (typeof from?.metadata?.line === "number" ? from.metadata.line : void 0) ?? (typeof edge.metadata?.line === "number" ? edge.metadata.line : 0);
    const key = `${file} ${symbol} ${edge.kind}`;
    if (seen.has(key))
      continue;
    seen.add(key);
    out.push({
      file,
      symbol,
      line,
      relation: edge.kind,
      ...edge.resolution && edge.resolution !== "unresolved" ? { resolution: edge.resolution } : {}
    });
    if (out.length >= cap)
      break;
  }
  return out;
}
function toDisplayPath(p, projectRoot) {
  return toProjectRelativePath(p, projectRoot);
}
function collectImports(graph, normalizedPath, projectRoot) {
  const fileNodeId = graph.fileNodes.get(normalizedPath);
  const external = /* @__PURE__ */ new Set();
  const internal = /* @__PURE__ */ new Set();
  if (fileNodeId) {
    for (const edge of graph.edgesByFrom.get(fileNodeId) ?? []) {
      if (edge.kind !== "imports")
        continue;
      const target = graph.nodes.get(edge.to);
      if (!target)
        continue;
      if (target.kind === "external") {
        external.add(String(target.metadata?.source ?? edge.to));
      } else if (target.filePath) {
        internal.add(toDisplayPath(target.filePath, projectRoot));
      } else {
        internal.add(String(target.metadata?.source ?? edge.to));
      }
    }
  }
  return {
    external: [...external].sort((a, b) => a.localeCompare(b)),
    internal: [...internal].sort((a, b) => a.localeCompare(b))
  };
}
function looksInternal(source, languageId) {
  if (languageId === "c" || languageId === "cpp") {
    return !source.startsWith("<");
  }
  return source.startsWith(".") || source.startsWith("crate::") || source.startsWith("super::") || source.startsWith("self::");
}
function coldImports(imports, languageId, absPath, projectRoot) {
  const external = /* @__PURE__ */ new Set();
  const internal = /* @__PURE__ */ new Set();
  const warnings = [];
  for (const imp of imports) {
    let files = [];
    try {
      files = resolveImportToFiles(projectRoot, absPath, languageId, imp.source);
    } catch (err) {
      const message = diagnosticMessage(err);
      warnings.push(`Failed to resolve import "${imp.source}": ${message}`);
      logLatency({
        type: "phase",
        phase: "module_report_import_resolve_error",
        filePath: absPath,
        durationMs: 0,
        metadata: {
          import: imp.source,
          error: message
        }
      });
    }
    if (files.length > 0) {
      for (const f of files)
        internal.add(toDisplayPath(f, projectRoot));
    } else if (looksInternal(imp.source, languageId)) {
      internal.add(imp.source);
    } else {
      external.add(imp.source);
    }
  }
  return {
    external: [...external].sort((a, b) => a.localeCompare(b)),
    internal: [...internal].sort((a, b) => a.localeCompare(b)),
    warnings
  };
}
function toEntry(sym, normalizedPath, graph, maxRefs, projectRoot, fileKind) {
  const startLine = sym.line;
  const endLine = sym.endLine ?? sym.line;
  const idKind = fileKind === "jsts" ? "function" : sym.kind;
  const symbolNodeId = buildSymbolId(normalizedPath, sym.name, idKind, sym.line);
  const node = graph?.nodes.get(symbolNodeId);
  const metadata = node?.metadata ?? {};
  const complexity = typeof metadata.cyclomaticComplexity === "number" ? metadata.cyclomaticComplexity : void 0;
  const fanout = graph ? (graph.edgesByFrom.get(symbolNodeId) ?? []).filter((edge) => edge.kind === "calls").length : void 0;
  const nonPublic = sym.visibility === "private" || sym.visibility === "protected";
  const exported = (sym.isExported || !!node?.exported) && !nonPublic;
  const flags = [];
  if (sym.isAsync)
    flags.push("async");
  if (fanout !== void 0 && fanout >= 4)
    flags.push("high fanout");
  if (complexity !== void 0 && complexity >= 8)
    flags.push("high complexity");
  if (metadata.isBoundaryWrapper)
    flags.push("boundary wrapper");
  const usedBy = graph ? resolveUsedBy(graph, symbolNodeId, maxRefs, projectRoot) : void 0;
  return {
    name: sym.name,
    kind: sym.kind,
    startLine,
    endLine,
    exported,
    ...sym.visibility ? { visibility: sym.visibility } : {},
    ...sym.decorators?.length ? { decorators: sym.decorators } : {},
    signature: sym.signature,
    doc: sym.doc,
    fanout: fanout && fanout > 0 ? fanout : void 0,
    complexity,
    // Empty flags array would waste ~3-5 tokens per entry on a 41-symbol
    // outline (~200 tok total). Omit when there's nothing to report.
    ...flags.length > 0 ? { flags } : {},
    usedBy: usedBy && usedBy.length > 0 ? usedBy : void 0
  };
}
function nestEntries(entries) {
  const span = (e) => e.endLine - e.startLine;
  const containerOf = /* @__PURE__ */ new Map();
  for (const e of entries) {
    let best;
    for (const c of entries) {
      if (c === e)
        continue;
      const contains = c.startLine <= e.startLine && c.endLine >= e.endLine && span(c) > span(e);
      if (!contains)
        continue;
      if (!best || span(c) < span(best))
        best = c;
    }
    containerOf.set(e, best);
  }
  for (const e of entries) {
    const parent = containerOf.get(e);
    if (!parent)
      continue;
    if (!parent.members)
      parent.members = [];
    parent.members.push(e);
  }
  for (const e of entries) {
    if (e.members)
      e.members.sort((a, b) => a.startLine - b.startLine);
  }
  return entries.filter((e) => !containerOf.get(e));
}
function summarizeEntries(entries) {
  return entries.map((entry) => ({
    name: entry.name,
    kind: entry.kind,
    startLine: entry.startLine,
    endLine: entry.endLine,
    exported: entry.exported,
    ...entry.visibility ? { visibility: entry.visibility } : {},
    ...entry.signature ? { signature: entry.signature } : {},
    ...entry.doc ? { doc: entry.doc } : {},
    ...entry.flags ? { flags: entry.flags } : {},
    ...entry.members ? {
      members: entry.members.map((member) => ({
        name: member.name,
        kind: member.kind,
        startLine: member.startLine,
        endLine: member.endLine,
        exported: member.exported,
        ...member.visibility ? { visibility: member.visibility } : {},
        ...member.signature ? { signature: member.signature } : {},
        ...member.doc ? { doc: member.doc } : {}
      }))
    } : {}
  }));
}
function normalizeFocus(focus) {
  return (focus ?? "").toLowerCase().split(/[^a-z0-9_.]+/).map((part) => part.trim()).filter((part) => part.length >= 3).slice(0, 8);
}
function focusScore(text, terms) {
  if (terms.length === 0)
    return 0;
  const haystack = text.toLowerCase();
  return terms.reduce((score, term) => score + (haystack.includes(term) ? 6 : 0), 0);
}
function rankRecommendedReads(entries, callbacks = [], limit = 5, focus) {
  const focusTerms = normalizeFocus(focus);
  const scoredSymbols = entries.map((entry) => {
    const refs = entry.usedBy?.length ?? 0;
    const focus2 = focusScore([
      entry.name,
      entry.kind,
      entry.signature ?? "",
      entry.flags?.join(" ") ?? ""
    ].join(" "), focusTerms);
    const score = refs * 2 + (entry.complexity ?? 0) + (entry.exported ? 2 : 0) + (entry.flags?.includes("high complexity") ? 3 : 0) + focus2;
    return { kind: "symbol", entry, score, refs, focus: focus2 };
  });
  const scoredCallbacks = callbacks.map((callback) => {
    const flags = callback.flags ?? [];
    const focus2 = focusScore([
      callback.name,
      callback.kind,
      callback.signature ?? "",
      flags.join(" ")
    ].join(" "), focusTerms);
    const score = (flags.includes("captures ctx.ui") ? 8 : 0) + (flags.includes("captures ctx") ? 5 : 0) + (flags.includes("detached timer") ? 4 : 0) + (flags.includes("lifecycle") ? 3 : 0) + (callback.kind === "object_property_callback" ? 2 : 0) + (callback.kind === "assigned_callback" ? 1 : 0) + focus2;
    return { kind: "callback", callback, score, focus: focus2 };
  });
  const scored = [...scoredSymbols, ...scoredCallbacks].filter((item) => item.score > 0);
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((item) => {
    if (item.kind === "symbol") {
      const { entry, refs } = item;
      const reasons2 = [];
      if (item.focus > 0)
        reasons2.push("matches focus");
      if (entry.exported)
        reasons2.push("exported");
      if (refs > 0)
        reasons2.push(`used by ${refs}`);
      if (entry.complexity !== void 0 && entry.complexity >= 8) {
        reasons2.push(`complexity ${entry.complexity}`);
      }
      return {
        reason: reasons2.join(", ") || "public surface",
        symbol: entry.name,
        startLine: entry.startLine,
        endLine: entry.endLine
      };
    }
    const reasons = [];
    if (item.focus > 0)
      reasons.push("matches focus");
    if (item.callback.flags?.length)
      reasons.push(...item.callback.flags);
    if (item.callback.kind === "object_property_callback") {
      reasons.push("callback property");
    }
    if (item.callback.kind === "assigned_callback") {
      reasons.push("assigned callback");
    }
    return {
      reason: reasons.join(", ") || item.callback.kind,
      symbol: item.callback.name,
      startLine: item.callback.startLine,
      endLine: item.callback.endLine
    };
  });
}
var BLAST_RADIUS_FILE_CAP = 12;
var BLAST_RADIUS_DEFAULT_READ_LIMIT = 400;
function blastReadArgs(graph, normalizedFile) {
  const fileNodeId = graph.fileNodes.get(normalizedFile);
  const lineCount3 = fileNodeId ? graph.nodes.get(fileNodeId)?.metadata?.lineCount : void 0;
  const limit = typeof lineCount3 === "number" && lineCount3 > 0 ? lineCount3 : BLAST_RADIUS_DEFAULT_READ_LIMIT;
  return { path: normalizedFile, offset: 1, limit };
}
async function computeBlastRadius(graph, normalizedPath, projectRoot, maxDepth) {
  const { computeTransitiveImpact } = await import("../chunk-4UNXBNE2.js");
  const result = computeTransitiveImpact(graph, normalizedPath, { maxDepth });
  const byFile = /* @__PURE__ */ new Map();
  for (const hit of result.hits) {
    if (!hit.file)
      continue;
    const key = normalizeMapKey(hit.file);
    if (key === normalizedPath)
      continue;
    const cur = byFile.get(key) ?? {
      dependents: 0,
      minDepth: Number.POSITIVE_INFINITY,
      relations: /* @__PURE__ */ new Set()
    };
    cur.dependents += 1;
    cur.minDepth = Math.min(cur.minDepth, hit.depth);
    cur.relations.add(hit.relation);
    byFile.set(key, cur);
  }
  if (byFile.size === 0)
    return void 0;
  const files = [...byFile.entries()].map(([key, v]) => ({
    file: toDisplayPath(key, projectRoot),
    dependents: v.dependents,
    minDepth: v.minDepth,
    relations: [...v.relations].sort((a, b) => a.localeCompare(b)),
    read: blastReadArgs(graph, key)
  })).sort((a, b) => a.minDepth - b.minDepth || b.dependents - a.dependents || a.file.localeCompare(b.file)).slice(0, BLAST_RADIUS_FILE_CAP);
  return {
    truncated: result.truncated,
    maxDepth: result.maxDepthReached,
    files
  };
}
function nodeLine(node) {
  return node.startPosition.row + 1;
}
function nodeEndLine(node) {
  return node.endPosition.row + 1;
}
function firstLine(text) {
  return text.split(/\r?\n/, 1)[0]?.trim() ?? "";
}
function findNearestSymbolName(entries, startLine, endLine) {
  let best;
  for (const entry of entries) {
    if (entry.startLine > startLine || entry.endLine < endLine)
      continue;
    if (!best || entry.endLine - entry.startLine < best.endLine - best.startLine) {
      best = entry;
    }
  }
  return best?.name;
}
var INLINE_EXECUTABLE_NODE_KINDS = /* @__PURE__ */ new Set([
  // JavaScript / TypeScript
  "arrow_function",
  "function_expression",
  // Python
  "lambda",
  // Go
  "func_literal",
  // Rust
  "closure_expression",
  // Swift / Kotlin (trailing/lambda closures)
  "lambda_literal",
  // Other grammars use one of these for lambdas/anonymous functions.
  "lambda_expression",
  "anonymous_function"
]);
var ARGUMENT_CONTAINER_NODE_KINDS = /* @__PURE__ */ new Set([
  "arguments",
  "argument_list",
  "argument_list_expression"
]);
var CALL_NODE_KINDS = /* @__PURE__ */ new Set(["call_expression", "call"]);
function callNameForCallback(node) {
  const parent = node.parent;
  const call = ARGUMENT_CONTAINER_NODE_KINDS.has(parent?.type ?? "") ? parent?.parent : CALL_NODE_KINDS.has(parent?.type ?? "") ? parent : void 0;
  if (!call || !CALL_NODE_KINDS.has(call.type))
    return void 0;
  const callee = call.children.find((child) => !ARGUMENT_CONTAINER_NODE_KINDS.has(child.type));
  return callee?.text;
}
function eventNameForCallback(node) {
  const args = node.parent;
  if (args?.type !== "arguments")
    return void 0;
  const first = args.children.find((child) => child.type === "string" && nodeLine(child) <= nodeLine(node));
  return first?.text;
}
function propertyNameForCallback(node) {
  const parent = node.parent;
  if (parent?.type !== "pair" && parent?.type !== "key_value_pair") {
    return void 0;
  }
  const key = parent.children.find((child) => child !== node);
  return key?.text;
}
function assignedNameForCallback(node) {
  const parent = node.parent;
  if (!parent)
    return void 0;
  if (parent.type === "let_declaration" || parent.type === "variable_declarator") {
    return parent.children.find((child) => child.type === "identifier")?.text;
  }
  if (parent.type === "expression_list") {
    const declaration = parent.parent;
    if (declaration?.type !== "short_var_declaration")
      return void 0;
    const nameList = declaration.children.find((child) => child !== parent);
    return nameList?.children.find((child) => child.type === "identifier")?.text;
  }
  if (parent.type === "assignment") {
    return parent.children.find((child) => child.type === "identifier")?.text;
  }
  return void 0;
}
function ancestorOfType(node, types, maxHops = 6) {
  let current = node.parent;
  let hops = 0;
  while (current && hops < maxHops) {
    if (types.has(current.type))
      return current;
    current = current.parent;
    hops += 1;
  }
  return void 0;
}
function descendantOfType(node, type, maxDepth = 2) {
  if (maxDepth < 0)
    return void 0;
  for (const child of node.children ?? []) {
    if (child.type === type)
      return child;
    const found = descendantOfType(child, type, maxDepth - 1);
    if (found)
      return found;
  }
  return void 0;
}
function classifyGenericCallback(ctx) {
  const { node, callName, propertyName, assignedName } = ctx;
  let kind;
  if (callName === "setTimeout" || callName === "setInterval" || callName === "setImmediate") {
    kind = "timer_callback";
  } else if (callName === "pi.on" || callName?.endsWith(".on")) {
    kind = "event_handler";
  } else if (callName?.endsWith(".then") || callName?.endsWith(".catch") || callName?.endsWith(".finally")) {
    kind = "promise_callback";
  } else if (propertyName) {
    kind = "object_property_callback";
  } else if (assignedName) {
    kind = "assigned_callback";
  } else {
    kind = "callback";
  }
  const flags = [];
  if (node.text.trimStart().startsWith("async"))
    flags.push("async");
  if (/\bctx\s*\.\s*ui\b/.test(node.text))
    flags.push("captures ctx.ui");
  else if (/\bctx\b/.test(node.text))
    flags.push("captures ctx");
  if (kind === "timer_callback")
    flags.push("detached timer");
  if (kind === "event_handler")
    flags.push("lifecycle");
  const include = kind !== "callback" || !!propertyName || !!assignedName || flags.some((flag) => flag.startsWith("captures "));
  return { kind, ...flags.length > 0 ? { flags } : {}, include };
}
var jstsCallbackRules = {
  classify: (ctx) => classifyGenericCallback(ctx)
};
var GO_GOROUTINE_KINDS = /* @__PURE__ */ new Set(["go_statement"]);
var GO_DEFER_KINDS = /* @__PURE__ */ new Set(["defer_statement"]);
var goCallbackRules = {
  classify(ctx, owner) {
    if (ancestorOfType(ctx.node, GO_GOROUTINE_KINDS, 3)) {
      return {
        kind: "goroutine",
        flags: ["goroutine"],
        include: true,
        nameBase: owner ? `${owner}.goroutine` : "goroutine"
      };
    }
    if (ancestorOfType(ctx.node, GO_DEFER_KINDS, 3)) {
      return {
        kind: "deferred_callback",
        flags: ["deferred"],
        include: true,
        nameBase: owner ? `${owner}.defer` : "defer"
      };
    }
    return classifyGenericCallback(ctx);
  }
};
function withFlag(flags, flag) {
  const next = flags ? [...flags] : [];
  if (!next.includes(flag))
    next.push(flag);
  return next;
}
var pythonCallbackRules = {
  classify(ctx) {
    const base = classifyGenericCallback(ctx);
    const callName = ctx.callName ?? "";
    if (/(?:^|\.)(?:call_later|call_soon|call_at)$/.test(callName) || /(?:^|\.)Timer$/.test(callName)) {
      return {
        kind: "timer_callback",
        flags: withFlag(base.flags, "detached timer"),
        include: true
      };
    }
    if (callName.endsWith(".add_done_callback")) {
      return {
        kind: "future_callback",
        flags: withFlag(base.flags, "future completion"),
        include: true
      };
    }
    return base;
  }
};
var rustCallbackRules = {
  classify(ctx) {
    const base = classifyGenericCallback(ctx);
    const isMove = /^\s*(?:async\s+)?move\b/.test(ctx.node.text);
    const flags = isMove ? withFlag(base.flags, "move") : base.flags;
    const callName = ctx.callName ?? "";
    if (/(?:^|::|\.)spawn$/.test(callName)) {
      return {
        kind: "task",
        flags: withFlag(flags, "spawned"),
        include: true
      };
    }
    return {
      ...base,
      ...flags ? { flags } : {},
      include: base.include || isMove
    };
  }
};
var swiftCallbackRules = {
  classify(ctx) {
    const base = classifyGenericCallback(ctx);
    const node = ctx.node;
    const captureList = descendantOfType(node, "capture_list", 2);
    let weakSelf = false;
    if (captureList) {
      for (const item of captureList.children ?? []) {
        if (item.type !== "capture_list_item")
          continue;
        const own = item.children?.find((c) => c.type === "ownership_modifier");
        if (own && /\bself\b/.test(item.text))
          weakSelf = true;
      }
    }
    const refsSelf = /\bself\b/.test(node.text);
    let flags = base.flags;
    let include = base.include;
    if (weakSelf) {
      flags = withFlag(flags, "weak self");
      include = true;
    } else if (refsSelf) {
      flags = withFlag(flags, "captures self");
      include = true;
    }
    return { ...base, ...flags ? { flags } : {}, include };
  }
};
var cppCallbackRules = {
  classify(ctx) {
    const base = classifyGenericCallback(ctx);
    const capture = descendantOfType(ctx.node, "lambda_capture_specifier", 2);
    let flags = base.flags;
    let byRef = false;
    if (capture) {
      const def = capture.children?.find((c) => c.type === "lambda_default_capture");
      if (def?.text.includes("&")) {
        flags = withFlag(flags, "captures by reference");
        byRef = true;
      }
    }
    const callName = ctx.callName ?? "";
    if (/(?:^|::)(?:thread|async)$/.test(callName)) {
      return {
        kind: "task",
        flags: withFlag(flags, "spawned"),
        include: true
      };
    }
    return {
      ...base,
      ...flags ? { flags } : {},
      include: base.include || byRef
    };
  }
};
function lastCalleeSegment(text) {
  const m = String(text ?? "").trim().match(/([A-Za-z_$][\w$]*)\s*$/);
  return m ? m[1] : "";
}
var KOTLIN_COROUTINE_BUILDERS = /* @__PURE__ */ new Set([
  "launch",
  "async",
  "withContext",
  "runBlocking",
  "coroutineScope",
  "supervisorScope"
]);
var kotlinCallbackRules = {
  classify(ctx) {
    const base = classifyGenericCallback(ctx);
    const call = ancestorOfType(ctx.node, /* @__PURE__ */ new Set(["call_expression"]), 4);
    const callee = call?.children?.find((c) => c.type === "navigation_expression" || c.type === "simple_identifier");
    const name = lastCalleeSegment(callee?.text);
    if (KOTLIN_COROUTINE_BUILDERS.has(name)) {
      return {
        kind: "coroutine",
        flags: withFlag(base.flags, "coroutine"),
        include: true,
        nameBase: name
      };
    }
    return base;
  }
};
var JAVA_TASK_METHODS = /^(?:submit|execute|schedule|scheduleAtFixedRate|scheduleWithFixedDelay|invokeLater|invokeAndWait)$/;
var JAVA_LISTENER_METHODS = /^(?:add\w*Listener|set\w*Listener|subscribe|addCallback|then\w*)$/;
var javaCallbackRules = {
  classify(ctx) {
    const base = classifyGenericCallback(ctx);
    const obj = ancestorOfType(ctx.node, /* @__PURE__ */ new Set(["object_creation_expression"]), 3);
    const created = obj?.children?.find((c) => c.type === "type_identifier");
    if (created && created.text.endsWith("Thread")) {
      return {
        kind: "task",
        flags: withFlag(base.flags, "thread"),
        include: true,
        nameBase: `new ${created.text}`
      };
    }
    const inv = ancestorOfType(ctx.node, /* @__PURE__ */ new Set(["method_invocation"]), 3);
    if (inv) {
      const named = (inv.children ?? []).filter((c) => c.isNamed);
      const argIdx = named.findIndex((c) => c.type === "argument_list");
      const nameNode = argIdx > 0 ? named[argIdx - 1] : void 0;
      const name = nameNode?.type === "identifier" ? nameNode.text : "";
      if (JAVA_TASK_METHODS.test(name)) {
        return {
          kind: "task",
          flags: withFlag(base.flags, "submitted"),
          include: true,
          nameBase: name
        };
      }
      if (JAVA_LISTENER_METHODS.test(name)) {
        return {
          kind: "event_handler",
          flags: withFlag(base.flags, "listener"),
          include: true,
          nameBase: name
        };
      }
    }
    return base;
  }
};
var csharpCallbackRules = {
  classify(ctx) {
    const base = classifyGenericCallback(ctx);
    const parent = ctx.node.parent;
    if (parent?.type === "assignment_expression" && /\+=/.test(parent.text)) {
      return {
        kind: "event_handler",
        flags: withFlag(base.flags, "event +="),
        include: true
      };
    }
    const inv = ancestorOfType(ctx.node, /* @__PURE__ */ new Set(["invocation_expression"]), 4);
    if (inv) {
      const callee = inv.children?.find((c) => c.type === "member_access_expression" || c.type === "identifier");
      const name = lastCalleeSegment(callee?.text);
      if (/^(?:Run|StartNew|Start)$/.test(name)) {
        return {
          kind: "task",
          flags: withFlag(base.flags, "task"),
          include: true,
          nameBase: name
        };
      }
    }
    if (/^\s*async\b/.test(ctx.node.text)) {
      return {
        ...base,
        flags: withFlag(base.flags, "async"),
        include: true
      };
    }
    return base;
  }
};
var CALLBACK_RULES = {
  typescript: jstsCallbackRules,
  tsx: jstsCallbackRules,
  javascript: jstsCallbackRules,
  go: goCallbackRules,
  python: pythonCallbackRules,
  rust: rustCallbackRules,
  swift: swiftCallbackRules,
  cpp: cppCallbackRules,
  kotlin: kotlinCallbackRules,
  java: javaCallbackRules,
  csharp: csharpCallbackRules
};
function callbackRulesFor(languageId) {
  return (languageId ? CALLBACK_RULES[languageId] : void 0) ?? jstsCallbackRules;
}
function callbackSupportFor(languageId) {
  return languageId && CALLBACK_RULES[languageId] ? "tuned" : "generic";
}
function extractCallbacks(root, entries, languageId, warnings) {
  if (!root)
    return [];
  const rules = callbackRulesFor(languageId);
  const callbacks = [];
  const maxDepth = 1e3;
  let depthTruncated = false;
  const visit = (node, depth = 0) => {
    if (depth > maxDepth) {
      depthTruncated = true;
      return;
    }
    if (INLINE_EXECUTABLE_NODE_KINDS.has(node.type)) {
      const startLine = nodeLine(node);
      const endLine = nodeEndLine(node);
      const callName = callNameForCallback(node);
      const eventName = eventNameForCallback(node);
      const propertyName = propertyNameForCallback(node);
      const assignedName = assignedNameForCallback(node);
      const owner = findNearestSymbolName(entries, startLine, endLine);
      const cls = rules.classify({ node, callName, eventName, propertyName, assignedName }, owner);
      if (cls.include) {
        const base = cls.nameBase ?? (propertyName ? owner ? `${owner}.${propertyName}` : propertyName : assignedName ? owner ? `${owner}.${assignedName}` : assignedName : eventName && callName ? `${callName}(${eventName})` : callName ?? "callback");
        callbacks.push({
          name: `${base}@${startLine}`,
          kind: cls.kind,
          rawKind: node.type,
          startLine,
          endLine,
          signature: firstLine(node.text),
          ...owner ? { parentChain: [owner] } : {},
          ...cls.flags ? { flags: cls.flags } : {}
        });
      }
    }
    for (const child of node.children ?? [])
      visit(child, depth + 1);
  };
  visit(root);
  if (depthTruncated) {
    warnings?.push(`Callback extraction stopped at AST depth ${maxDepth}`);
  }
  const callbackCap = 25;
  if (callbacks.length > callbackCap) {
    warnings?.push(`Callback list truncated to ${callbackCap} of ${callbacks.length} entries`);
  }
  return callbacks.slice(0, callbackCap);
}
var CALL_GRAPH_DEFAULT_ENTRY_CAP = 20;
var CALL_GRAPH_MAX_ENTRY_CAP = 100;
function unavailableCallGraph(reason) {
  return {
    available: false,
    reason,
    callers: [],
    callees: [],
    truncated: false,
    coverage: { status: "unavailable", complete: false }
  };
}
function callGraphCoverage(coverage) {
  const languages = coverage.languages;
  const complete = coverage.complete && Object.values(languages ?? {}).every((status) => status === "complete");
  return {
    status: complete ? "complete" : "partial",
    complete,
    totalEvidence: coverage.totalEvidence,
    callsEvidence: coverage.callsEvidence,
    referencesEvidence: coverage.referencesEvidence,
    eligibleEvidence: coverage.eligibleEvidence,
    resolvedEvidence: coverage.resolvedEvidence,
    unresolvedEvidence: coverage.unresolvedEvidence,
    typeOnlyEvidence: coverage.typeOnlyEvidence,
    unsupportedEvidence: coverage.unsupportedEvidence,
    sameFileEvidence: coverage.sameFileEvidence,
    duplicateEvidence: coverage.duplicateEvidence,
    ...languages ? { languages } : {}
  };
}
function callGraphRelation(edge, kind, projectRoot) {
  const caller = kind === "caller";
  return {
    symbolId: caller ? edge.callerKey : edge.calleeKey,
    targetSymbolId: caller ? edge.calleeKey : edge.callerKey,
    file: toDisplayPath(caller ? edge.callerFile : edge.calleeFile, projectRoot),
    ...caller ? {
      symbol: edge.callerSymbol,
      kind: edge.callerKind,
      line: edge.callerLine
    } : {
      symbol: edge.calleeSymbol,
      kind: edge.calleeKind,
      line: edge.calleeLine
    },
    ...edge.evidenceKind ? { evidenceKind: edge.evidenceKind } : {},
    ...edge.resolution ? { resolution: edge.resolution } : {},
    ...edge.evidenceCount && edge.evidenceCount > 1 ? { evidenceCount: edge.evidenceCount } : {},
    ...edge.weight !== 1 ? { weight: edge.weight } : {}
  };
}
function readCallGraph(projectRoot, normalizedPath, maxEntries, graphFileCap, identity, reviewGraph) {
  if (graphFileCap !== void 0)
    return unavailableCallGraph("file-cap");
  if (!reviewGraph)
    return unavailableCallGraph("review-graph-missing");
  if (reviewGraph.persistCoverage?.partial || reviewGraph.persistCoverage?.inProgress) {
    return unavailableCallGraph("partial");
  }
  if (!identity)
    return unavailableCallGraph("identity-missing");
  if (!reviewGraph.fileNodes.has(normalizedPath))
    return unavailableCallGraph("stale");
  const cached = loadCallGraph(projectRoot, identity);
  if (!cached)
    return unavailableCallGraph("stale");
  const callers = [];
  const callees = [];
  for (const edge of cached.graph.edges) {
    if (normalizeMapKey(edge.calleeFile) === normalizedPath) {
      callers.push(callGraphRelation(edge, "caller", projectRoot));
    }
    if (normalizeMapKey(edge.callerFile) === normalizedPath) {
      callees.push(callGraphRelation(edge, "callee", projectRoot));
    }
  }
  const stable = (left, right) => left.targetSymbolId.localeCompare(right.targetSymbolId) || (left.line ?? 0) - (right.line ?? 0) || left.symbolId.localeCompare(right.symbolId);
  callers.sort(stable);
  callees.sort(stable);
  return {
    available: true,
    callers: callers.slice(0, maxEntries),
    callees: callees.slice(0, maxEntries),
    truncated: callers.length > maxEntries || callees.length > maxEntries,
    coverage: callGraphCoverage(cached.graph.coverage ?? {
      totalEvidence: cached.graph.totalRefs,
      callsEvidence: cached.graph.totalRefs,
      referencesEvidence: 0,
      eligibleEvidence: cached.graph.totalRefs,
      resolvedEvidence: cached.graph.totalRefs,
      unresolvedEvidence: cached.graph.unresolvedRefs,
      typeOnlyEvidence: 0,
      unsupportedEvidence: 0,
      sameFileEvidence: 0,
      duplicateEvidence: 0,
      complete: false
    })
  };
}
function unavailableReport(displayPath, error) {
  return {
    available: false,
    staleness: "unavailable",
    path: displayPath,
    ...error ? { error } : {},
    summary: { imports: 0, exports: 0, symbols: 0 },
    imports: { external: [], internal: [] },
    api: [],
    internal: [],
    callbacks: [],
    recommendedReads: [],
    semantic: { source: "none", references: false, implementations: false }
  };
}
async function moduleReport(file, cwd, options) {
  const startedAt = Date.now();
  const maxRefs = normalizeMaxRefsPerSymbol(options?.maxRefsPerSymbol);
  const maxCallGraphEntries = Math.min(CALL_GRAPH_MAX_ENTRY_CAP, Math.max(1, Math.floor(options?.maxCallGraphEntries ?? CALL_GRAPH_DEFAULT_ENTRY_CAP)));
  const absPath = path26.resolve(cwd, file);
  const normalizedPath = normalizeMapKey(absPath);
  let content;
  try {
    content = fs19.readFileSync(absPath, "utf-8");
  } catch {
    return unavailableReport(toDisplayPath(absPath, cwd));
  }
  const kind = detectFileKind(absPath);
  const languageId = tsLangForFile(absPath, kind);
  const lineCount3 = content.split(/\r?\n/).length;
  const { symbols: extracted, imports: extractedImports, callbacks, callbackError, error: extractionError, warnings: extractionWarnings } = languageId ? await extractFile(absPath, languageId, content) : {
    symbols: [],
    imports: [],
    callbacks: [],
    callbackError: void 0,
    error: void 0,
    warnings: void 0
  };
  if (extractionError) {
    return unavailableReport(toDisplayPath(absPath, cwd), extractionError);
  }
  let graph;
  let graphFileCap;
  let callGraphIdentity;
  let revisionDriftNote;
  try {
    const { getCachedReviewGraph, getReviewGraphCacheIdentity, getReviewGraphSizeSkipVerdict, getReviewGraphRevisionDrift, formatReviewGraphRevisionDriftNote: formatReviewGraphRevisionDriftNote2 } = await import("../chunk-2VUQMUMT.js");
    graph = getCachedReviewGraph(cwd);
    graphFileCap = getReviewGraphSizeSkipVerdict(cwd)?.maxFileCount;
    const drift = graph ? getReviewGraphRevisionDrift(cwd) : void 0;
    if (drift)
      revisionDriftNote = formatReviewGraphRevisionDriftNote2(drift);
    callGraphIdentity = graph ? (() => {
      const identity = getReviewGraphCacheIdentity(cwd, graph);
      return identity ? {
        reviewGraphVersion: identity.version,
        reviewGraphSignature: identity.signature
      } : void 0;
    })() : void 0;
  } catch {
    graph = void 0;
    callGraphIdentity = void 0;
  }
  const outlineSymbols = extracted.filter((sym) => !sym.local);
  const entries = outlineSymbols.map((sym) => toEntry(sym, normalizedPath, graph, maxRefs, cwd, kind));
  const topLevel = nestEntries(entries);
  annotateMiddleMan(entries, content, languageId);
  const api = topLevel.filter((entry) => entry.exported);
  const internal = topLevel.filter((entry) => !entry.exported);
  const warnings = [...extractionWarnings ?? []];
  if (revisionDriftNote)
    warnings.push(revisionDriftNote);
  if (callbackError) {
    warnings.push(`Failed to extract callbacks: ${callbackError}`);
    logLatency({
      type: "phase",
      phase: "module_report_callback_extract_error",
      filePath: absPath,
      durationMs: 0,
      metadata: { error: callbackError }
    });
  }
  if (graphFileCap !== void 0) {
    warnings.push(`who-uses-this is unavailable: review graph disabled because the project has more than ${graphFileCap} files (cap ${graphFileCap}) \u2014 raise maxProjectFiles in .pi-lens.json or set PI_LENS_REVIEW_GRAPH_MAX_FILES; for CI/cron, run npx pi-lens build-graph after configuring the cap`);
  }
  const warmImports = graph ? collectImports(graph, normalizedPath, cwd) : { external: [], internal: [] };
  const coldImportResult = warmImports.external.length + warmImports.internal.length > 0 || !languageId ? void 0 : coldImports(extractedImports, languageId, absPath, cwd);
  if (coldImportResult?.warnings.length)
    warnings.push(...coldImportResult.warnings);
  const imports = coldImportResult ? {
    external: coldImportResult.external,
    internal: coldImportResult.internal
  } : warmImports;
  const hasGraphNode = graph?.fileNodes.has(normalizedPath) ?? false;
  if (graph && !hasGraphNode) {
    warnings.push("who-uses-this is unavailable for this file: the cached review graph exists but has no node for it (likely added/changed after the graph was last built). Run pilens_rebuild to refresh it.");
  }
  const blastRadius = options?.blastRadius && graph && hasGraphNode ? await computeBlastRadius(graph, normalizedPath, cwd, Math.max(1, options.blastRadiusDepth ?? 3)) : void 0;
  const callGraph = options?.callGraph ? readCallGraph(cwd, normalizedPath, maxCallGraphEntries, graphFileCap, callGraphIdentity, graph) : void 0;
  const view = options?.view ?? "default";
  const summaryView = view === "summary";
  const compactView = view === "compact";
  let importsProvenance = "none";
  if (coldImportResult) {
    importsProvenance = "syntax";
  } else if (graph) {
    importsProvenance = "cached-review-graph";
  }
  const unavailableGraphProvenance = graphFileCap !== void 0 ? "unavailable:file-cap" : "none";
  const blastRadiusProvenance = blastRadius ? "cached-review-graph" : unavailableGraphProvenance;
  const callGraphProvenance = callGraph?.available ? "cached-call-graph" : callGraph?.reason === "file-cap" ? "unavailable:file-cap" : "none";
  const report = {
    available: entries.length > 0 || hasGraphNode,
    staleness: entries.length === 0 && !hasGraphNode ? "unavailable" : "fresh",
    path: toDisplayPath(absPath, cwd),
    language: kind ?? void 0,
    lineCount: lineCount3,
    summary: {
      imports: imports.external.length + imports.internal.length,
      exports: api.length,
      symbols: entries.length
    },
    imports,
    ...warnings.length > 0 ? { warnings } : {},
    api: summaryView ? summarizeEntries(api) : api,
    internal: summaryView ? summarizeEntries(internal) : internal,
    callbacks: summaryView ? [] : callbacks,
    callbackSupport: callbackSupportFor(languageId),
    recommendedReads: rankRecommendedReads(entries, callbacks, 5, options?.focus),
    ...summaryView ? { view: "summary" } : {},
    ...compactView ? { view: "compact" } : {},
    ...blastRadius && !summaryView ? { blastRadius } : {},
    ...callGraph ? { callGraph } : {},
    ...graph ? { graphBuiltAt: graph.builtAt } : {},
    provenance: {
      symbols: languageId ? "syntax" : "none",
      imports: importsProvenance,
      usedBy: hasGraphNode ? "cached-review-graph" : unavailableGraphProvenance,
      callbacks: languageId && !summaryView ? "heuristic-tree-sitter" : "none",
      ...options?.blastRadius ? { blastRadius: blastRadiusProvenance } : {},
      ...options?.callGraph ? { callGraph: callGraphProvenance } : {}
    },
    semantic: {
      // Provenance of who-uses-this / references. The AST review graph is the
      // only source on this read path; "graph-lsp" is reserved for #236 (LSP
      // writes provenance edges INTO the graph). Cold cache → "none".
      source: hasGraphNode ? "review-graph" : unavailableGraphProvenance,
      references: hasGraphNode,
      implementations: false
    }
  };
  logLatency({
    type: "phase",
    phase: "module_report",
    filePath: absPath,
    durationMs: Date.now() - startedAt,
    metadata: {
      graph: graph ? "cached" : "cold",
      symbols: entries.length,
      exported: api.length
    }
  });
  return report;
}
function padRange(startLine, endLine, width) {
  return `${startLine}-${endLine}`.padEnd(width);
}
var KIND_ABBREV = {
  function: "fn",
  method: "fn",
  class: "class",
  interface: "iface",
  type: "type",
  variable: "var",
  property: "prop"
};
function compactKind(kind) {
  return KIND_ABBREV[kind] ?? kind;
}
function compactUsedBySuffix(usedBy) {
  if (!usedBy || usedBy.length === 0)
    return "";
  const counts = /* @__PURE__ */ new Map();
  for (const u of usedBy)
    counts.set(u.file, (counts.get(u.file) ?? 0) + 1);
  const parts = [...counts.entries()].map(([file, n]) => n > 1 ? `${file}\xD7${n}` : file);
  return `  used-by: ${parts.join(", ")}`;
}
function compactEntryLine(entry, width) {
  const range = padRange(entry.startLine, entry.endLine, width);
  const kind = compactKind(entry.kind).padEnd(6);
  const sig = entry.signature ? `${entry.name}${entry.signature}` : entry.name;
  const flagsSuffix = entry.flags && entry.flags.length > 0 ? `  [${entry.flags.join(", ")}]` : "";
  const docSuffix = entry.doc ? `  \u2014 ${entry.doc}` : "";
  const usedBySuffix = compactUsedBySuffix(entry.usedBy);
  return `  ${range}${kind}${sig}${flagsSuffix}${usedBySuffix}${docSuffix}`;
}
function compactMemberLines(entry, width, indent) {
  if (!entry.members || entry.members.length === 0)
    return [];
  return entry.members.map((m) => `${indent}${compactEntryLine(m, width).slice(2)}`);
}
function compactCallbackLine(callback, width) {
  const range = padRange(callback.startLine, callback.endLine, width);
  const kind = callback.kind.padEnd(20);
  const flagsSuffix = callback.flags && callback.flags.length > 0 ? `  [${callback.flags.join(", ")}]` : "";
  const ownerSuffix = callback.parentChain?.length ? `  (in ${callback.parentChain.join(".")})` : "";
  return `  ${range}${kind}${callback.name}${flagsSuffix}${ownerSuffix}`;
}
function renderCompactModuleReport(report) {
  if (!report.available) {
    return `${report.path} \u2014 unavailable${report.error ? `: ${report.error}` : ""}`;
  }
  const allEntries = [...report.api, ...report.internal];
  const allRanges = allEntries.flatMap((e) => [e, ...e.members ?? []]);
  const width = Math.max(5, ...allRanges.map((e) => `${e.startLine}-${e.endLine}`.length), ...report.callbacks.map((c) => `${c.startLine}-${c.endLine}`.length)) + 2;
  const importsList = [...report.imports.internal, ...report.imports.external];
  const importsSuffix = importsList.length > 0 ? ` | imports: ${importsList.slice(0, 6).map((i) => baseNameNoExt(i)).join(", ")}${importsList.length > 6 ? ", \u2026" : ""}` : "";
  const lines = [
    `${report.path} ${report.language ?? "?"} ${report.lineCount ?? "?"}L \u2014 ${report.summary.symbols} symbols, ${report.summary.exports} exported${importsSuffix}`
  ];
  for (const warning of report.warnings ?? []) {
    lines.push(`WARNING: ${warning}`);
  }
  if (report.api.length > 0) {
    lines.push("API:");
    for (const entry of report.api) {
      lines.push(compactEntryLine(entry, width));
      lines.push(...compactMemberLines(entry, width, "    "));
    }
  }
  if (report.internal.length > 0) {
    lines.push("INTERNAL:");
    for (const entry of report.internal) {
      lines.push(compactEntryLine(entry, width));
      lines.push(...compactMemberLines(entry, width, "    "));
    }
  }
  if (report.callbacks.length > 0) {
    lines.push("CALLBACKS:");
    for (const callback of report.callbacks) {
      lines.push(compactCallbackLine(callback, width));
    }
  }
  if (report.callGraph) {
    const callGraph = report.callGraph;
    const suffix = callGraph.truncated ? " (truncated)" : "";
    lines.push("CALL GRAPH:");
    if (!callGraph.available) {
      lines.push(`  unavailable (${callGraph.reason ?? "unknown"})`);
    } else {
      lines.push(`  callers: ${callGraph.callers.length} \xB7 callees: ${callGraph.callees.length} \xB7 coverage: ${callGraph.coverage.status}${suffix}`);
    }
  }
  if (report.recommendedReads.length > 0) {
    lines.push("RECOMMENDED:");
    for (const r of report.recommendedReads) {
      lines.push(`  ${padRange(r.startLine, r.endLine, width)}${r.symbol ?? ""}  \u2014 ${r.reason}`);
    }
  }
  return lines.join("\n");
}
function baseNameNoExt(p) {
  const base = p.split(/[\\/]/).pop() ?? p;
  return base.replace(/\.[^./\\]+$/, "");
}
function selectMatch(candidates, kind) {
  if (candidates.length === 0)
    return {};
  const filtered = kind ? candidates.filter((c) => c.kind === kind) : candidates;
  const pool = filtered.length > 0 ? filtered : candidates;
  const match = pool[0];
  if (pool.length <= 1)
    return { match };
  return {
    match,
    ambiguous: {
      count: pool.length,
      kinds: [...new Set(pool.map((c) => c.kind))]
    }
  };
}
function resolveQualifiedMatch(symbols, qualifiedName, kind) {
  const dotIdx = qualifiedName.lastIndexOf(".");
  if (dotIdx <= 0 || dotIdx === qualifiedName.length - 1)
    return void 0;
  const parentName = qualifiedName.slice(0, dotIdx);
  const memberName = qualifiedName.slice(dotIdx + 1);
  const parent = symbols.find((candidate) => candidate.name === parentName);
  if (!parent)
    return void 0;
  const parentStart = parent.line;
  const parentEnd = parent.endLine ?? parent.line;
  const members = symbols.filter((candidate) => candidate !== parent && candidate.name === memberName && candidate.line >= parentStart && (candidate.endLine ?? candidate.line) <= parentEnd);
  if (members.length === 0)
    return void 0;
  return selectMatch(members, kind);
}
function levenshteinDistance(a, b) {
  const al = a.length;
  const bl = b.length;
  if (al === 0)
    return bl;
  if (bl === 0)
    return al;
  let prev = [];
  prev.length = bl + 1;
  let curr = [];
  curr.length = bl + 1;
  for (let j = 0; j <= bl; j++)
    prev[j] = j;
  for (let i = 1; i <= al; i++) {
    curr[0] = i;
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[bl];
}
function nameSimilarity(a, b) {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0)
    return 1;
  return 1 - levenshteinDistance(a.toLowerCase(), b.toLowerCase()) / maxLen;
}
var SIMILAR_NAME_MIN_SCORE = 0.45;
var SIMILAR_NAME_MAX_SUGGESTIONS = 3;
function suggestSimilarNames(candidates, target) {
  const unique = [...new Set(candidates)].filter((name) => name !== target);
  return unique.map((name) => ({ name, score: nameSimilarity(target, name) })).filter((entry) => entry.score >= SIMILAR_NAME_MIN_SCORE).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)).slice(0, SIMILAR_NAME_MAX_SUGGESTIONS).map((entry) => entry.name);
}
async function readSymbol(file, symbolName, cwd, options = {}) {
  const { kind: symbolKindFilter } = options;
  const startedAt = Date.now();
  const absPath = path26.resolve(cwd, file);
  const log = (found) => {
    logLatency({
      type: "phase",
      phase: "read_symbol",
      filePath: absPath,
      durationMs: Date.now() - startedAt,
      metadata: { symbol: symbolName, found }
    });
  };
  let content;
  try {
    content = fs19.readFileSync(absPath, "utf-8");
  } catch {
    log(false);
    return { found: false, path: absPath, name: symbolName };
  }
  const kind = detectFileKind(absPath);
  const languageId = tsLangForFile(absPath, kind);
  if (!languageId) {
    log(false);
    return { found: false, path: absPath, name: symbolName };
  }
  const { symbols, callbacks: allCallbacks, callbackError, error: extractionError, warnings: extractionWarnings } = await extractFile(absPath, languageId, content);
  if (extractionError) {
    log(false);
    return {
      found: false,
      path: absPath,
      name: symbolName,
      error: extractionError
    };
  }
  const lines = content.split(/\r?\n/);
  const qualified = resolveQualifiedMatch(symbols, symbolName, symbolKindFilter);
  const unqualifiedMatches = symbols.filter((candidate) => candidate.name === symbolName);
  const selection = qualified ?? selectMatch(unqualifiedMatches, symbolKindFilter);
  if (selection.match) {
    const sym = selection.match;
    const startLine = sym.docStartLine ?? sym.line;
    const endLine = sym.endLine ?? sym.line;
    const source2 = lines.slice(startLine - 1, endLine).join("\n");
    log(true);
    return {
      found: true,
      path: absPath,
      name: sym.name,
      kind: sym.kind,
      startLine,
      endLine,
      signature: sym.signature,
      source: source2,
      ...selection.ambiguous ? { ambiguous: selection.ambiguous } : {}
    };
  }
  if (callbackError) {
    const message = `Callback extraction failed: ${callbackError}`;
    logLatency({
      type: "phase",
      phase: "read_symbol_callback_extract_error",
      filePath: absPath,
      durationMs: Date.now() - startedAt,
      metadata: { symbol: symbolName, error: message }
    });
    log(false);
    return { found: false, path: absPath, name: symbolName, error: message };
  }
  const callbackWarnings = [...extractionWarnings ?? []];
  const callback = allCallbacks.find((candidate) => candidate.name === symbolName);
  if (!callback) {
    log(false);
    const corpus = [
      ...symbols.filter((candidate) => !candidate.local).map((c) => c.name),
      ...allCallbacks.map((c) => c.name)
    ];
    const suggestions = suggestSimilarNames(corpus, symbolName);
    return {
      found: false,
      path: absPath,
      name: symbolName,
      ...callbackWarnings.length > 0 ? { warnings: callbackWarnings } : {},
      ...suggestions.length > 0 ? { suggestions } : {}
    };
  }
  const source = lines.slice(callback.startLine - 1, callback.endLine).join("\n");
  log(true);
  return {
    found: true,
    path: absPath,
    name: callback.name,
    kind: callback.kind,
    startLine: callback.startLine,
    endLine: callback.endLine,
    signature: callback.signature,
    source
  };
}
function symbolMatchesKind(kind, filters) {
  if (filters.size === 0)
    return true;
  const normalized = kind.toLowerCase();
  if (filters.has(normalized))
    return true;
  if (filters.has("function") && normalized.includes("function"))
    return true;
  if (filters.has("method") && normalized.includes("method"))
    return true;
  if (filters.has("type") && ["class", "interface", "struct", "enum", "trait", "type"].includes(normalized)) {
    return true;
  }
  return false;
}
function callbackMatchesKind(kind, filters) {
  if (filters.size === 0)
    return true;
  const normalized = kind.toLowerCase();
  return filters.has(normalized) || filters.has("callback") || filters.has("closure") || filters.has("lambda") || normalized.includes("callback") && filters.has("function");
}
function symbolParentChain(symbol, symbols) {
  const chain = symbols.filter((candidate) => {
    if (candidate === symbol)
      return false;
    const start = candidate.line;
    const end = candidate.endLine ?? candidate.line;
    const symEnd = symbol.endLine ?? symbol.line;
    return start <= symbol.line && end >= symEnd && end - start > symEnd - symbol.line;
  }).sort((a, b) => a.line - b.line || (b.endLine ?? b.line) - b.line - ((a.endLine ?? a.line) - a.line)).map((candidate) => candidate.name);
  return chain.length > 0 ? chain : void 0;
}
function clampSliceRange(targetLine, startLine, endLine, limit) {
  const boundedLimit = Math.max(1, Math.min(endLine - startLine + 1, limit));
  let sliceStart = targetLine - Math.floor(boundedLimit / 2);
  sliceStart = Math.max(startLine, Math.min(sliceStart, endLine - boundedLimit + 1));
  return { startLine: sliceStart, endLine: sliceStart + boundedLimit - 1 };
}
function enclosingOutline(selected, symbols, callbacks, filters, filePath) {
  const items = [];
  for (const sym of symbols) {
    const startLine = sym.line;
    const endLine = sym.endLine ?? sym.line;
    if (startLine === selected.startLine && endLine === selected.endLine)
      continue;
    if (startLine < selected.startLine || endLine > selected.endLine)
      continue;
    if (!symbolMatchesKind(sym.kind, filters))
      continue;
    items.push({
      name: sym.name,
      kind: sym.kind,
      startLine,
      endLine,
      signature: sym.signature,
      parentChain: symbolParentChain(sym, symbols),
      read: readArgsFor(filePath, startLine, endLine)
    });
  }
  for (const callback of callbacks) {
    if (callback.startLine < selected.startLine || callback.endLine > selected.endLine)
      continue;
    if (!callbackMatchesKind(callback.kind, filters))
      continue;
    items.push({
      name: callback.name,
      kind: callback.kind,
      startLine: callback.startLine,
      endLine: callback.endLine,
      signature: callback.signature,
      parentChain: callback.parentChain,
      read: readArgsFor(filePath, callback.startLine, callback.endLine)
    });
  }
  return items.sort((a, b) => a.startLine - b.startLine || a.endLine - a.startLine - (b.endLine - b.startLine)).slice(0, 25);
}
async function readEnclosing(file, line, cwd, options) {
  const startedAt = Date.now();
  const absPath = path26.resolve(cwd, file);
  const targetLine = Math.max(1, Math.floor(line));
  const log = (found) => {
    logLatency({
      type: "phase",
      phase: "read_enclosing",
      filePath: absPath,
      durationMs: Date.now() - startedAt,
      metadata: { line: targetLine, found }
    });
  };
  let content;
  try {
    content = fs19.readFileSync(absPath, "utf-8");
  } catch {
    log(false);
    return { found: false, path: absPath, line: targetLine };
  }
  const kind = detectFileKind(absPath);
  const languageId = tsLangForFile(absPath, kind);
  if (!languageId) {
    log(false);
    return { found: false, path: absPath, line: targetLine };
  }
  const { symbols, callbacks, callbackError, error: extractionError, warnings: extractionWarnings } = await extractFile(absPath, languageId, content);
  if (extractionError) {
    log(false);
    return {
      found: false,
      path: absPath,
      line: targetLine,
      error: extractionError
    };
  }
  const filters = new Set((options?.kinds ?? []).map((value) => value.toLowerCase()));
  const warnings = [...extractionWarnings ?? []];
  if (callbackError) {
    const message = `Callback extraction failed: ${callbackError}`;
    warnings.push(message);
    logLatency({
      type: "phase",
      phase: "read_enclosing_callback_extract_error",
      filePath: absPath,
      durationMs: Date.now() - startedAt,
      metadata: { line: targetLine, error: message }
    });
  }
  const candidates = [];
  for (const sym of symbols.filter((candidate) => !candidate.local)) {
    const startLine = sym.line;
    const endLine = sym.endLine ?? sym.line;
    if (targetLine < startLine || targetLine > endLine)
      continue;
    if (!symbolMatchesKind(sym.kind, filters))
      continue;
    candidates.push({
      name: sym.name,
      kind: sym.kind,
      startLine,
      endLine,
      signature: sym.signature,
      parentChain: symbolParentChain(sym, symbols),
      priority: 1
    });
  }
  for (const callback of callbacks) {
    if (targetLine < callback.startLine || targetLine > callback.endLine)
      continue;
    if (!callbackMatchesKind(callback.kind, filters))
      continue;
    candidates.push({
      name: callback.name,
      kind: callback.kind,
      startLine: callback.startLine,
      endLine: callback.endLine,
      signature: callback.signature,
      parentChain: callback.parentChain,
      priority: 0
    });
  }
  candidates.sort((a, b) => {
    const span = a.endLine - a.startLine - (b.endLine - b.startLine);
    return span || a.priority - b.priority || a.startLine - b.startLine;
  });
  const selected = candidates[0];
  if (!selected) {
    log(false);
    return {
      found: false,
      path: absPath,
      line: targetLine,
      ...warnings.length > 0 ? { warnings } : {}
    };
  }
  const lines = content.split(/\r?\n/);
  const limit = selected.endLine - selected.startLine + 1;
  if (options?.maxLines && limit > options.maxLines) {
    const oversize = options.onOversize ?? "error";
    const base = {
      path: absPath,
      line: targetLine,
      name: selected.name,
      kind: selected.kind,
      startLine: selected.startLine,
      endLine: selected.endLine,
      signature: selected.signature,
      parentChain: selected.parentChain,
      enclosingStartLine: selected.startLine,
      enclosingEndLine: selected.endLine,
      ...warnings.length > 0 ? { warnings } : {}
    };
    if (oversize === "slice") {
      const sliceLimit = Math.max(1, Math.floor(options.aroundLine ?? options.maxLines ?? 80));
      const slice = clampSliceRange(targetLine, selected.startLine, selected.endLine, sliceLimit);
      const source2 = lines.slice(slice.startLine - 1, slice.endLine).join("\n");
      log(true);
      return {
        ...base,
        found: true,
        startLine: slice.startLine,
        endLine: slice.endLine,
        partial: true,
        selection: {
          strategy: "oversize-slice",
          source: "tree-sitter",
          confidence: "medium"
        },
        source: source2
      };
    }
    if (oversize === "outline") {
      log(false);
      return {
        ...base,
        found: false,
        selection: {
          strategy: "oversize-outline",
          source: "tree-sitter",
          confidence: "medium"
        },
        outline: enclosingOutline(selected, symbols, callbacks, filters, absPath),
        error: `Enclosing ${selected.kind} spans ${limit} lines, above maxLines ${options.maxLines}`
      };
    }
    log(false);
    return {
      ...base,
      found: false,
      error: `Enclosing ${selected.kind} spans ${limit} lines, above maxLines ${options.maxLines}`
    };
  }
  const source = lines.slice(selected.startLine - 1, selected.endLine).join("\n");
  log(true);
  return {
    found: true,
    path: absPath,
    line: targetLine,
    name: selected.name,
    kind: selected.kind,
    startLine: selected.startLine,
    endLine: selected.endLine,
    enclosingStartLine: selected.startLine,
    enclosingEndLine: selected.endLine,
    signature: selected.signature,
    parentChain: selected.parentChain,
    selection: {
      strategy: "range-containment",
      source: "tree-sitter",
      confidence: "high"
    },
    ...warnings.length > 0 ? { warnings } : {},
    source
  };
}

// dist/clients/project-report.js
import * as path27 from "node:path";
var DEFAULT_LIMIT = 10;
var STALE_THRESHOLD_MS = 15 * 6e4;
var LOW_COVERAGE_THRESHOLD = 0.8;
var DEAD_WEIGHT_DISCLAIMER = "Low confidence: dynamic imports, runtime registration, and test-only reachability all produce false positives here \u2014 verify with a real usage search (symbol_search/grep) before deleting anything listed.";
function clampLimit(limit) {
  return Math.max(1, Math.floor(limit ?? DEFAULT_LIMIT));
}
function toDisplayPath2(p, projectRoot) {
  return toProjectRelativePath(p, projectRoot);
}
function suggestedNext(displayPath) {
  return { tool: "module_report", path: displayPath };
}
function normalizeFocus2(focus) {
  return (focus ?? "").toLowerCase().split(/[^a-z0-9_.]+/).map((part) => part.trim()).filter((part) => part.length >= 3).slice(0, 8);
}
function focusScore2(text, terms) {
  if (terms.length === 0)
    return 0;
  const haystack = text.toLowerCase();
  return terms.reduce((score, term) => score + (haystack.includes(term) ? 6 : 0), 0);
}
function buildFileDegrees(graph) {
  const fanIn = /* @__PURE__ */ new Map();
  const fanOut = /* @__PURE__ */ new Map();
  for (const edge of graph.edges) {
    if (edge.kind !== "imports")
      continue;
    if (edge.from === edge.to)
      continue;
    const fromNode = graph.nodes.get(edge.from);
    const toNode = graph.nodes.get(edge.to);
    if (!fromNode || fromNode.kind !== "file")
      continue;
    if (!toNode || toNode.kind !== "file")
      continue;
    let outSet = fanOut.get(edge.from);
    if (!outSet) {
      outSet = /* @__PURE__ */ new Set();
      fanOut.set(edge.from, outSet);
    }
    outSet.add(edge.to);
    let inSet = fanIn.get(edge.to);
    if (!inSet) {
      inSet = /* @__PURE__ */ new Set();
      fanIn.set(edge.to, inSet);
    }
    inSet.add(edge.from);
  }
  return { fanIn, fanOut };
}
function computeTrust(graph, cwd, drift) {
  const filesCovered = graph.fileNodes.size;
  const snapshot = loadProjectSnapshotWithoutWordIndex(cwd);
  const snapshotFileCount = snapshot ? Object.keys(snapshot.files).length : 0;
  const persistedTotal = graph.persistCoverage?.totalFiles ?? 0;
  const filesTotal = Math.max(filesCovered, snapshotFileCount, persistedTotal);
  const coverage = filesTotal > 0 ? filesCovered / filesTotal : 1;
  let exact = 0;
  let imp = 0;
  let receiverType = 0;
  let nameOnly = 0;
  for (const edge of graph.edges) {
    if (edge.kind !== "calls" && edge.kind !== "references")
      continue;
    switch (edge.resolution) {
      case "exact":
        exact += 1;
        break;
      case "import":
        imp += 1;
        break;
      case "receiver-type":
        receiverType += 1;
        break;
      case "name-only":
        nameOnly += 1;
        break;
      default:
        break;
    }
  }
  const sampleSize = exact + imp + receiverType + nameOnly;
  const frac = (n) => sampleSize > 0 ? n / sampleSize : 0;
  const ageMs = Date.now() - Date.parse(graph.builtAt);
  const stale = Number.isFinite(ageMs) && ageMs > STALE_THRESHOLD_MS;
  const lowCoverage = coverage < LOW_COVERAGE_THRESHOLD || graph.persistCoverage?.partial === true;
  const notes = [];
  if (drift)
    notes.push(formatReviewGraphRevisionDriftNote(drift));
  if (stale) {
    const ageMin = Math.round(ageMs / 6e4);
    notes.push(`Graph is stale: built ${ageMin}m ago. Sections below may miss recent edits \u2014 run pilens_rebuild or re-analyze to refresh.`);
  }
  if (lowCoverage) {
    if (graph.persistCoverage?.partial) {
      const p = graph.persistCoverage;
      const totalFiles = p.totalFiles ?? filesCovered;
      const persistedFiles = p.persistedFiles ?? filesCovered;
      if (p.sourceFilesTruncated) {
        notes.push(`Partial source walk: at least ${totalFiles} source files were represented before the visited-entry budget stopped enumeration; ${persistedFiles} files are in this graph.`);
      } else {
        notes.push(`Partial persisted graph: ${p.persistedNodes}/${p.totalNodes} nodes, ${p.persistedEdges}/${p.totalEdges} edges, and ${persistedFiles}/${totalFiles} files were retained under the ${p.cap}-element cap \u2014 whole subsystems may be invisible below.`);
      }
    } else {
      notes.push(`Low coverage: only ${filesCovered}/${filesTotal} project files (${Math.round(coverage * 100)}%) are in the graph \u2014 whole subsystems may be invisible below.`);
    }
  }
  return {
    graphBuiltAt: graph.builtAt,
    filesCovered,
    filesTotal,
    coverage,
    resolution: {
      exact: frac(exact),
      import: frac(imp),
      receiverType: frac(receiverType),
      nameOnly: frac(nameOnly),
      sampleSize
    },
    stale,
    ...drift ? { revisionDrift: drift } : {},
    lowCoverage,
    persistCoverage: graph.persistCoverage?.partial ? graph.persistCoverage : void 0,
    notes
  };
}
function roleFor(graph, filePath) {
  const symbolIds = graph.symbolNodesByFile.get(filePath) ?? [];
  const scored = [];
  for (const symbolId of symbolIds) {
    const node = graph.nodes.get(symbolId);
    if (!node || !node.exported || !node.symbolName)
      continue;
    const refs = (graph.edgesByTo.get(symbolId) ?? []).filter((e) => e.kind === "calls" || e.kind === "references").length;
    scored.push({ name: node.qualifiedName ?? node.symbolName, refs });
  }
  scored.sort((a, b) => b.refs - a.refs);
  const top = scored.slice(0, 3).filter((s) => s.refs > 0);
  return top.length > 0 ? top.map((s) => s.name).join(", ") : void 0;
}
async function computeHubs(graph, degrees, cwd, limit, focusTerms) {
  const { computeTransitiveImpact } = await import("../chunk-4UNXBNE2.js");
  const ranked = [...graph.fileNodes.entries()].map(([filePath, fileNodeId]) => ({
    filePath,
    fileNodeId,
    fanIn: degrees.fanIn.get(fileNodeId)?.size ?? 0
  })).filter((f) => f.fanIn > 0).sort((a, b) => {
    const focusDelta = focusScore2(a.filePath, focusTerms) - focusScore2(b.filePath, focusTerms);
    if (focusDelta !== 0)
      return -focusDelta;
    return b.fanIn - a.fanIn || a.filePath.localeCompare(b.filePath);
  }).slice(0, limit);
  return ranked.map((f) => {
    const impact = computeTransitiveImpact(graph, f.filePath, { maxDepth: 3 });
    const display = toDisplayPath2(f.filePath, cwd);
    return {
      file: display,
      fanIn: f.fanIn,
      blastRadius: impact.hits.length,
      role: roleFor(graph, f.filePath),
      suggestedNext: suggestedNext(display)
    };
  });
}
function computeEntryPoints(graph, degrees, cwd, limit, focusTerms) {
  const candidates = [...graph.fileNodes.entries()].map(([filePath, fileNodeId]) => ({
    filePath,
    fanIn: degrees.fanIn.get(fileNodeId)?.size ?? 0,
    fanOut: degrees.fanOut.get(fileNodeId)?.size ?? 0
  })).filter((f) => f.fanIn === 0 && f.fanOut > 0).sort((a, b) => {
    const focusDelta = focusScore2(a.filePath, focusTerms) - focusScore2(b.filePath, focusTerms);
    if (focusDelta !== 0)
      return -focusDelta;
    return b.fanOut - a.fanOut || a.filePath.localeCompare(b.filePath);
  });
  const entryPointFiles = new Set(candidates.map((c) => c.filePath));
  const entryPoints = candidates.slice(0, limit).map((f) => {
    const display = toDisplayPath2(f.filePath, cwd);
    return {
      file: display,
      fanIn: f.fanIn,
      fanOut: f.fanOut,
      suggestedNext: suggestedNext(display)
    };
  });
  return { entryPoints, entryPointFiles };
}
var DOMINANCE_THRESHOLD = 0.4;
function directoryClusters(filePaths, cwd) {
  const segmentsOf = (filePath) => toDisplayPath2(filePath, cwd).split("/").filter(Boolean);
  const topCounts = /* @__PURE__ */ new Map();
  const perFileSegments = /* @__PURE__ */ new Map();
  for (const filePath of filePaths) {
    const segments = segmentsOf(filePath);
    perFileSegments.set(filePath, segments);
    const top = segments.length > 1 ? segments[0] : "(root)";
    topCounts.set(top, (topCounts.get(top) ?? 0) + 1);
  }
  const total = filePaths.length || 1;
  const dominant = new Set([...topCounts.entries()].filter(([, count]) => count / total >= DOMINANCE_THRESHOLD).map(([seg]) => seg));
  const clusterOf = /* @__PURE__ */ new Map();
  for (const filePath of filePaths) {
    const segments = perFileSegments.get(filePath) ?? [];
    if (segments.length <= 1) {
      clusterOf.set(filePath, "(root)");
      continue;
    }
    const top = segments[0];
    if (dominant.has(top) && segments.length > 2) {
      clusterOf.set(filePath, `${segments[0]}/${segments[1]}`);
    } else {
      clusterOf.set(filePath, top);
    }
  }
  return clusterOf;
}
function tarjanSCCs(nodes, adjacency) {
  let index = 0;
  const indices = /* @__PURE__ */ new Map();
  const lowlink = /* @__PURE__ */ new Map();
  const onStack = /* @__PURE__ */ new Set();
  const stack = [];
  const sccs = [];
  function strongConnect(v) {
    indices.set(v, index);
    lowlink.set(v, index);
    index += 1;
    stack.push(v);
    onStack.add(v);
    for (const w of adjacency.get(v) ?? []) {
      if (!indices.has(w)) {
        strongConnect(w);
        lowlink.set(v, Math.min(lowlink.get(v), lowlink.get(w)));
      } else if (onStack.has(w)) {
        lowlink.set(v, Math.min(lowlink.get(v), indices.get(w)));
      }
    }
    if (lowlink.get(v) === indices.get(v)) {
      const scc = [];
      let w;
      do {
        w = stack.pop();
        onStack.delete(w);
        scc.push(w);
      } while (w !== v);
      sccs.push(scc);
    }
  }
  for (const v of nodes) {
    if (!indices.has(v))
      strongConnect(v);
  }
  return sccs;
}
function computeSubsystems(graph, cwd, limit) {
  const filePaths = [...graph.fileNodes.keys()];
  const clusterOf = directoryClusters(filePaths, cwd);
  const fileNodeIdToCluster = /* @__PURE__ */ new Map();
  for (const [filePath, nodeId] of graph.fileNodes) {
    const cluster = clusterOf.get(filePath);
    if (cluster)
      fileNodeIdToCluster.set(nodeId, cluster);
  }
  const edgeCounts = /* @__PURE__ */ new Map();
  for (const edge of graph.edges) {
    if (edge.kind !== "imports")
      continue;
    const fromCluster = fileNodeIdToCluster.get(edge.from);
    const toCluster = fileNodeIdToCluster.get(edge.to);
    if (!fromCluster || !toCluster || fromCluster === toCluster)
      continue;
    const key = `${fromCluster}|${toCluster}`;
    edgeCounts.set(key, (edgeCounts.get(key) ?? 0) + 1);
  }
  const directories = [...new Set(clusterOf.values())].sort((a, b) => a.localeCompare(b));
  const edges = [...edgeCounts.entries()].map(([key, count]) => {
    const [from, to] = key.split("|");
    return { from, to, count };
  }).sort((a, b) => b.count - a.count || a.from.localeCompare(b.from));
  const seenPairs = /* @__PURE__ */ new Set();
  const violations = [];
  for (const edge of edges) {
    const pairKey = [edge.from, edge.to].sort((a, b) => a.localeCompare(b)).join("|");
    if (seenPairs.has(pairKey))
      continue;
    const reverseKey = `${edge.to}|${edge.from}`;
    const reverseCount = edgeCounts.get(reverseKey);
    if (reverseCount === void 0 || reverseCount === edge.count)
      continue;
    seenPairs.add(pairKey);
    if (edge.count < reverseCount) {
      violations.push({
        from: edge.from,
        to: edge.to,
        count: edge.count,
        dominantCount: reverseCount
      });
    } else {
      violations.push({
        from: edge.to,
        to: edge.from,
        count: reverseCount,
        dominantCount: edge.count
      });
    }
  }
  violations.sort((a, b) => b.count - a.count || a.from.localeCompare(b.from));
  const adjacency = /* @__PURE__ */ new Map();
  for (const dir of directories)
    adjacency.set(dir, /* @__PURE__ */ new Set());
  for (const edge of edges) {
    adjacency.get(edge.from)?.add(edge.to);
  }
  const sccs = tarjanSCCs(directories, adjacency).filter((scc) => scc.length > 1);
  const cycles = sccs.map((scc) => {
    const members = new Set(scc);
    let edgeCount = 0;
    for (const edge of edges) {
      if (members.has(edge.from) && members.has(edge.to))
        edgeCount += edge.count;
    }
    return { dirs: [...scc].sort((a, b) => a.localeCompare(b)), edgeCount };
  }).sort((a, b) => b.edgeCount - a.edgeCount);
  return {
    directories,
    edges: edges.slice(0, limit),
    cycles: cycles.slice(0, limit),
    violations: violations.slice(0, limit)
  };
}
function computeRiskHotspots(graph, degrees, cwd, limit, focusTerms) {
  const ranked = [...graph.fileNodes.entries()].map(([filePath, fileNodeId]) => {
    const symbolIds = graph.symbolNodesByFile.get(filePath) ?? [];
    let maxComplexity = 0;
    for (const symbolId of symbolIds) {
      const complexity = graph.nodes.get(symbolId)?.metadata?.cyclomaticComplexity;
      if (typeof complexity === "number" && complexity > maxComplexity) {
        maxComplexity = complexity;
      }
    }
    const fanIn = degrees.fanIn.get(fileNodeId)?.size ?? 0;
    return { filePath, fanIn, maxComplexity, score: fanIn * maxComplexity };
  }).filter((f) => f.score > 0).sort((a, b) => {
    const focusDelta = focusScore2(a.filePath, focusTerms) - focusScore2(b.filePath, focusTerms);
    if (focusDelta !== 0)
      return -focusDelta;
    return b.score - a.score || a.filePath.localeCompare(b.filePath);
  }).slice(0, limit);
  return ranked.map((f) => {
    const display = toDisplayPath2(f.filePath, cwd);
    return {
      file: display,
      fanIn: f.fanIn,
      maxComplexity: f.maxComplexity,
      score: f.score,
      suggestedNext: suggestedNext(display)
    };
  });
}
function computeDeadWeight(graph, degrees, entryPointFiles, cwd, limit) {
  const candidates = [...graph.fileNodes.entries()].filter(([filePath, nodeId]) => {
    if (entryPointFiles.has(filePath))
      return false;
    const fanIn = degrees.fanIn.get(nodeId)?.size ?? 0;
    return fanIn === 0;
  }).map(([filePath, fileNodeId]) => ({
    filePath,
    fanOut: degrees.fanOut.get(fileNodeId)?.size ?? 0
  })).sort((a, b) => a.fanOut - b.fanOut || a.filePath.localeCompare(b.filePath)).slice(0, limit);
  return {
    files: candidates.map((f) => {
      const display = toDisplayPath2(f.filePath, cwd);
      return { file: display, suggestedNext: suggestedNext(display) };
    }),
    disclaimer: DEAD_WEIGHT_DISCLAIMER
  };
}
var inFlightGraphBuilds = /* @__PURE__ */ new Set();
function triggerBackgroundGraphBuild(cwd, deps) {
  const key = normalizeMapKey(path27.resolve(cwd));
  if (inFlightGraphBuilds.has(key))
    return "already_running";
  const deduped = deps.isGraphBuildInFlight(key, []);
  inFlightGraphBuilds.add(key);
  const build = deps.buildOrUpdateGraph(key, [], new deps.FactStore()).catch(() => {
  });
  void build.finally(() => inFlightGraphBuilds.delete(key));
  return deduped ? "already_running" : "started";
}
async function projectReport(cwd, options) {
  const limit = clampLimit(options?.limit);
  const focusTerms = normalizeFocus2(options?.focus);
  const view = options?.view;
  const { getCachedReviewGraph, getReviewGraphSizeSkipVerdict, getLastReviewGraphBuildAttempt, buildOrUpdateGraph, isGraphBuildInFlight, getReviewGraphRevisionDrift } = await import("../chunk-2VUQMUMT.js");
  let graph;
  try {
    graph = getCachedReviewGraph(cwd);
  } catch {
    graph = void 0;
  }
  if (!graph) {
    let sizeSkip;
    try {
      sizeSkip = getReviewGraphSizeSkipVerdict(cwd);
    } catch {
      sizeSkip = void 0;
    }
    if (sizeSkip) {
      const lastBuildAttempt3 = getLastReviewGraphBuildAttempt(cwd);
      return {
        available: false,
        hint: `review graph disabled: project has more than ${sizeSkip.maxFileCount} files (cap ${sizeSkip.maxFileCount}) \u2014 raise maxProjectFiles in .pi-lens.json or set PI_LENS_REVIEW_GRAPH_MAX_FILES; for CI/cron, run npx pi-lens build-graph after configuring the cap`,
        ...lastBuildAttempt3 ? { lastBuildAttempt: lastBuildAttempt3 } : {},
        ...view ? { view } : {}
      };
    }
    const previousAttempt = getLastReviewGraphBuildAttempt(cwd);
    const { FactStore: FactStore2 } = await import("../chunk-QGQ5CCCG.js");
    const trigger = triggerBackgroundGraphBuild(cwd, {
      buildOrUpdateGraph,
      isGraphBuildInFlight,
      FactStore: FactStore2
    });
    const started = trigger === "started";
    const lastBuildAttempt2 = started ? getLastReviewGraphBuildAttempt(cwd) ?? previousAttempt : previousAttempt;
    const terminal = previousAttempt?.outcome === "failed" || previousAttempt?.outcome === "skipped";
    const cause = terminal ? `Review graph unavailable: ${previousAttempt?.reason ?? previousAttempt?.outcome}. ` : "";
    return {
      available: false,
      hint: started ? terminal ? `${cause}A retry was started.` : "No review graph cached for this workspace yet \u2014 a build was kicked off in the background; retry this call shortly." : `${cause}A build is already running for this workspace; retry this call shortly.`,
      ...lastBuildAttempt2 ? { lastBuildAttempt: lastBuildAttempt2 } : {},
      ...view ? { view } : {}
    };
  }
  const degrees = buildFileDegrees(graph);
  const trust = computeTrust(graph, cwd, getReviewGraphRevisionDrift(cwd));
  const hubs = await computeHubs(graph, degrees, cwd, limit, focusTerms);
  const { entryPoints, entryPointFiles } = computeEntryPoints(graph, degrees, cwd, limit, focusTerms);
  const subsystems = computeSubsystems(graph, cwd, limit);
  const riskHotspots = computeRiskHotspots(graph, degrees, cwd, limit, focusTerms);
  const deadWeight = computeDeadWeight(graph, degrees, entryPointFiles, cwd, limit);
  const lastBuildAttempt = getLastReviewGraphBuildAttempt(cwd);
  return {
    available: true,
    ...lastBuildAttempt ? { lastBuildAttempt } : {},
    ...view ? { view } : {},
    trust,
    hubs,
    entryPoints,
    subsystems,
    riskHotspots,
    deadWeight
  };
}
function fmtPct(n) {
  return `${Math.round(n * 100)}%`;
}
function renderCompactProjectReport(report) {
  if (!report.available) {
    return `project_report \u2014 unavailable${report.hint ? `: ${report.hint}` : ""}`;
  }
  const lines = [];
  if (report.lastBuildAttempt?.reason) {
    lines.push(`! build: ${report.lastBuildAttempt.reason}`);
  }
  const t = report.trust;
  if (t) {
    lines.push(`TRUST: built ${t.graphBuiltAt} \u2014 ${t.filesCovered}/${t.filesTotal} files (${fmtPct(t.coverage)} coverage)` + (t.resolution.sampleSize > 0 ? ` \u2014 resolution: exact ${fmtPct(t.resolution.exact)}, import ${fmtPct(t.resolution.import)}, receiver-type ${fmtPct(t.resolution.receiverType)}, name-only ${fmtPct(t.resolution.nameOnly)}` : " \u2014 no resolution-tagged edges yet"));
    for (const note of t.notes)
      lines.push(`  ! ${note}`);
  }
  if (report.hubs?.length) {
    lines.push("HUBS:");
    for (const h of report.hubs) {
      const role = h.role ? ` \u2014 ${h.role}` : "";
      lines.push(`  ${h.file}${role}; ${h.fanIn} importer(s), blastRadius ${h.blastRadius}`);
    }
  }
  if (report.entryPoints?.length) {
    lines.push("ENTRY POINTS:");
    for (const e of report.entryPoints) {
      lines.push(`  ${e.file}; fan-out ${e.fanOut}`);
    }
  }
  if (report.subsystems) {
    const s = report.subsystems;
    lines.push(`SUBSYSTEMS: ${s.directories.length} directories, ${s.edges.length} cross-dir edge group(s)`);
    if (s.cycles.length > 0) {
      lines.push("  CYCLES:");
      for (const c of s.cycles) {
        lines.push(`    ${c.dirs.join(" <-> ")} (${c.edgeCount} edges)`);
      }
    }
    if (s.violations.length > 0) {
      lines.push("  LAYERING VIOLATIONS:");
      for (const v of s.violations) {
        lines.push(`    ${v.from} -> ${v.to} (${v.count} edge(s), against the dominant ${v.to} -> ${v.from} direction, ${v.dominantCount} edge(s))`);
      }
    }
  }
  if (report.riskHotspots?.length) {
    lines.push("RISK HOTSPOTS:");
    for (const r of report.riskHotspots) {
      lines.push(`  ${r.file}; fan-in ${r.fanIn} \xD7 max complexity ${r.maxComplexity} = ${r.score}`);
    }
  }
  if (report.deadWeight) {
    lines.push(`DEAD WEIGHT (${report.deadWeight.disclaimer}):`);
    for (const d of report.deadWeight.files) {
      lines.push(`  ${d.file}`);
    }
    if (report.deadWeight.files.length === 0)
      lines.push("  (none found)");
  }
  return lines.join("\n");
}

// dist/clients/effective-config.js
import * as os3 from "node:os";
import * as path28 from "node:path";
function isEffectiveFileViewError(file) {
  return "error" in file;
}
function countBy(items, key) {
  const counts = {};
  for (const item of items) {
    const name = key(item);
    counts[name] = (counts[name] ?? 0) + 1;
  }
  return counts;
}
function redactServerSpec(entry) {
  if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
    return void 0;
  }
  const record = entry;
  const command = typeof record.command === "string" ? record.command : void 0;
  const args = Array.isArray(record.args) ? record.args : [];
  const env = typeof record.env === "object" && record.env !== null ? Object.keys(record.env).sort(compareOrdinal) : [];
  const rawCovers = record.covers;
  let covers;
  if (Array.isArray(rawCovers)) {
    covers = [];
    for (const member of rawCovers) {
      if (typeof member === "string")
        covers.push(member);
    }
  }
  return {
    ...command === void 0 ? {} : { command },
    argvCount: (command === void 0 ? 0 : 1) + args.length,
    envNames: env,
    ...covers === void 0 || covers.length === 0 ? {} : { covers }
  };
}
function provenanceOfSubtree(resolved, pointer) {
  const own = provenanceFor(resolved, pointer);
  if (own)
    return own;
  const prefix = `${pointer}/`;
  let best;
  for (const entry of resolved.provenance.values()) {
    if (!entry.key.startsWith(prefix))
      continue;
    if (!best || compareKeys(entry.key, best.key) < 0)
      best = entry;
  }
  return best;
}
function viewOf(entry, homeDir) {
  if (!entry)
    return void 0;
  return {
    key: entry.key,
    tier: entry.tier,
    ...entry.file === void 0 ? {} : { file: homeRelativePath(entry.file, homeDir) },
    ...entry.trust === void 0 ? {} : { trust: entry.trust }
  };
}
function decidedByOrNothing(entry) {
  return entry === void 0 ? {} : { decidedBy: entry };
}
async function effectiveConfig(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const homeDir = options.homeDir ?? os3.homedir();
  const resolveAt = (dir) => resolvePiLensConfig({
    cwd: dir,
    globalDir: getGlobalPiLensDir(),
    // Production resolution for the global tier — see loadLSPConfig's
    // comment (global-config-location PR, refs #2457).
    globalConfigPath: getPiLensGlobalConfigPath(),
    homeDir
  });
  const requestedFile = options.file === void 0 ? void 0 : path28.resolve(cwd, options.file);
  const fileOutsideCwd = requestedFile !== void 0 && !isSameOrWithin(cwd, requestedFile);
  const absolute = fileOutsideCwd ? void 0 : requestedFile;
  const resolution = resolveAt(absolute === void 0 ? cwd : path28.dirname(absolute));
  const resolved = {
    value: resolution.value,
    provenance: resolution.provenance
  };
  const summary = summarizeConfigResolution(resolution, homeDir);
  const homeRelativeCwd = homeRelativePath(cwd, homeDir);
  const view = {
    cwd: homeRelativeCwd,
    documents: summary.documents,
    provenance: provenanceView(resolved, homeDir).entries,
    provenanceCounts: summary.countsByTier,
    recordCounts: countBy(resolution.records, (record) => record.code),
    tools: LENS_TOOL_NAMES.map((name) => ({
      name,
      enabled: resolveLensToolEnabled(name, resolved.value, void 0, options.noTools)
    })),
    ...fileOutsideCwd ? {
      file: {
        error: `file is outside cwd (${homeRelativeCwd}); query with cwd set to the file's own workspace instead`
      }
    } : absolute === void 0 ? {} : {
      file: await fileView(
        absolute,
        resolved,
        homeDir,
        cwd,
        // The gates read the LSP slice of that SAME resolution, through
        // the same `registerLSPConfig` conversion `initLSPConfig` uses —
        // no session-root registration, no per-root config-store write
        // (P11/P12). Computed here rather than hoisted into a
        // `{ absolute, lspConfig }` struct (#2520): `absolute` is already
        // this branch's narrowed local, so the struct's own field was
        // carrying the same fact twice.
        registerLSPConfig(lspConfigOf(resolution.value, void 0, resolution.provenance))
      )
    }
  };
  return view;
}
function toolReason(selected, kind) {
  if (selected)
    return "selected";
  return kind === void 0 ? "no-dispatch-plan" : "not-registered-for-kind";
}
async function fileView(absolute, resolved, homeDir, workspaceCwd, lspConfig) {
  const language = resolveLanguage(absolute);
  const kind = detectFileKind(absolute);
  const section = lspSectionOf(resolved.value);
  const customServers = customServerSpecsOf(resolved.value);
  const denied = Array.isArray(section.disabledServers) ? section.disabledServers : [];
  const denyPointer = `/${LSP_NAMESPACE_KEY}/disabledServers`;
  const decidedByDeny = (id) => {
    const index = denied.indexOf(id);
    return viewOf(provenanceFor(resolved, index >= 0 ? `${denyPointer}/${index}` : denyPointer), homeDir);
  };
  const servers = explainServersForFile(absolute, lspConfig).map((entry) => {
    const spec = redactServerSpec(customServers[entry.server.id]);
    return {
      id: entry.server.id,
      selected: entry.selected,
      reason: entry.reason,
      ...entry.server.role === void 0 ? {} : { role: entry.server.role },
      ...entry.reason === "disabled-by-config" ? decidedByOrNothing(decidedByDeny(entry.server.id)) : {},
      ...spec === void 0 ? {} : {
        spec,
        ...entry.reason === "disabled-by-config" ? {} : {
          decidedBy: viewOf(provenanceOfSubtree(resolved, `/${LSP_NAMESPACE_KEY}/servers/${entry.server.id}`) ?? provenanceOfSubtree(resolved, `/servers/${entry.server.id}`), homeDir)
        }
      }
    };
  });
  const available = new Set(await getAvailableRunners(absolute));
  const planned = kind ? getToolPlan(kind)?.groups.flatMap((group) => group.runnerIds) ?? [] : [];
  const ids = [.../* @__PURE__ */ new Set([...planned, ...available])].sort(compareOrdinal);
  const tools = ids.map((id) => ({
    id,
    selected: available.has(id),
    reason: toolReason(available.has(id), kind),
    resolvedCwd: homeRelativePath(resolveToolCwd("runner", id, absolute, {
      cwd: workspaceCwd,
      suppressTelemetry: true
    }).cwd, homeDir)
  }));
  return {
    path: homeRelativePath(absolute, homeDir),
    ...language === void 0 ? {} : { language: language.id },
    ...kind === void 0 ? {} : { kind },
    servers,
    tools
  };
}

// dist/clients/lens-engine.js
function recentLatency(limit = 5, fileFilter) {
  let reports = getLatencyReports();
  if (fileFilter) {
    const needle = fileFilter.replace(/\\/g, "/");
    reports = reports.filter((report) => report.filePath.replace(/\\/g, "/").endsWith(needle));
  }
  return reports.slice(-limit).reverse();
}
function projectScan(cwd, maxFiles, includeGenerated) {
  return scanProjectDiagnostics({
    cwd,
    tier: "cheap",
    maxFiles,
    includeGenerated
  });
}
function scanTruncationNotice(snapshot) {
  if (!snapshot.scanTruncated)
    return void 0;
  if (snapshot.treeSitterStatus === "wasm_aborted_restart_required") {
    return `\u26A0 Scan stopped after ${snapshot.filesScanned} complete file(s): the tree-sitter WASM runtime aborted. Results are partial and were not cached; restart the pi-lens extension/MCP server to restore structural analysis.`;
  }
  return `\u26A0 Scan truncated at ${snapshot.filesScanned} file(s) \u2014 results are partial; raise maxProjectFiles in .pi-lens.json to scan fully.`;
}
function generatedSkipNotice(snapshot, host = "pi") {
  const files = snapshot.generatedNameOnlySkips ?? 0;
  const dirs = snapshot.generatedDirSkips ?? 0;
  if (files === 0 && dirs === 0)
    return void 0;
  const parts = [];
  if (files > 0)
    parts.push(`${files} file(s)`);
  if (dirs > 0)
    parts.push(`${dirs} director${dirs === 1 ? "y" : "ies"}`);
  const targets = [
    resolveLensToolName("project_scan", host),
    resolveLensToolName("lens_diagnostics", host)
  ].filter((tool) => tool !== void 0);
  const scanRef = targets.length > 0 ? ` to ${targets.join(" / ")}` : "";
  return `\u2139 ${parts.join(" and ")} excluded by generated-name heuristics with no confirming evidence \u2014 a real hand-written file/directory whose name looks generated (e.g. \`gen.ts\`, \`generated/\`) can be excluded too; pass includeGenerated: true${scanRef} to scan without this filter if you suspect a false skip.`;
}
function treeSitterRuntimeStatus() {
  return getTreeSitterRuntimeStatus();
}
function lspStatus() {
  const lsp = getLSPService();
  return {
    aliveClients: lsp.getAliveClientCount(),
    servers: lsp.getStatus(),
    brokenServers: lsp.getBrokenStatus()
  };
}
function renderLspBrokenStatusLines(brokenServers) {
  return brokenServers.map((server) => server.permanentlyBroken ? `  \u2717 ${server.serverId} \u2014 disabled after ${server.failures} failures (${server.root})` : `  \u2717 ${server.serverId} \u2014 cooling down after ${server.failures} failure(s) until ${new Date(server.cooldownUntil).toISOString()} (${server.root})`);
}
function diagnosticStats() {
  return getDiagnosticTracker().getStats();
}
function ensureLspConfig(cwd) {
  return initLSPConfig(cwd);
}
function resourceFootprint() {
  return getResourceFootprint();
}
function symbolSearchFileMatchesLang(file, lang) {
  const exts = extensionsForLanguageToken(lang);
  if (exts.length === 0)
    return false;
  return exts.includes(path29.extname(file).toLowerCase());
}
function fileMatchesPathGlobs(file, cwd, globs) {
  const rel = path29.relative(cwd, file).split(path29.sep).join("/");
  const options = { dot: true, nocase: process.platform === "win32" };
  return globs.some((raw) => {
    const pattern = raw.split("\\").join("/");
    return minimatch(rel, pattern, options) || minimatch(rel, `${pattern}/**`, options);
  });
}
function buildSymbolSearchFileFilter(cwd, options) {
  const paths = options.paths?.filter((p) => p.trim().length > 0);
  const lang = options.lang?.trim();
  if (!paths?.length && !lang)
    return void 0;
  return (file) => {
    if (paths?.length && !fileMatchesPathGlobs(file, cwd, paths))
      return false;
    if (lang && !symbolSearchFileMatchesLang(file, lang))
      return false;
    return true;
  };
}
function annotateSymbolSearchHitsWithGraph(hits, centrality, graph) {
  for (const hit of hits) {
    const normalized = normalizeMapKey(path29.resolve(hit.file));
    const fanIn = centrality.get(hit.file) ?? 0;
    let complexity;
    for (const symbolId of graph.symbolNodesByFile.get(normalized) ?? []) {
      const raw = graph.nodes.get(symbolId)?.metadata?.cyclomaticComplexity;
      if (typeof raw === "number" && (complexity === void 0 || raw > complexity)) {
        complexity = raw;
      }
    }
    hit.annotations = {
      fanIn,
      ...complexity !== void 0 ? { complexity } : {}
    };
  }
}
function toSymbolSearchHit(result) {
  const line = result.lines[0] ?? 1;
  return {
    file: result.file,
    score: result.score,
    hits: result.hits,
    startLine: line,
    endLine: line
  };
}
async function symbolSearch(query, cwd, limit = 20, options = {}) {
  const warmLease = acquireWarmWordIndex(cwd);
  const snapshot = loadProjectSnapshotWithoutWordIndex(cwd);
  const index = warmLease.index;
  if (!index) {
    warmLease.release();
    const priorStatus = getWordIndexBuildStatus(cwd);
    const status = priorStatus?.state === "refused" ? priorStatus : triggerBackgroundWordIndexBuild(cwd);
    const unavailableReason = priorStatus?.state === "failed" ? "last-build-failed" : status.state === "refused" ? "refused" : "building";
    const hint = unavailableReason === "refused" ? `Word index build was refused for safety: ${status.state === "refused" ? status.reason : "unsafe workspace root"}. Run symbol_search from inside a project directory.` : unavailableReason === "last-build-failed" ? `The last word index build failed: ${priorStatus?.state === "failed" ? priorStatus.reason : "unknown error"}. A retry is now running in the background.` : "Word index is building in the background for this workspace \u2014 retry this query shortly.";
    return {
      available: false,
      query,
      results: [],
      unavailableReason,
      hint
    };
  }
  let centrality;
  let results;
  try {
    centrality = centralityFromReverseDeps(index, snapshot?.reverseDeps, (file) => normalizeMapKey(path29.resolve(file)));
    const fileFilter = buildSymbolSearchFileFilter(cwd, options);
    results = searchWordIndex(index, query, { limit, centrality, fileFilter });
  } finally {
    warmLease.release();
  }
  const hits = results.map(toSymbolSearchHit);
  const { getCachedReviewGraph } = await import("../chunk-2VUQMUMT.js");
  const graph = getCachedReviewGraph(cwd);
  if (graph)
    annotateSymbolSearchHitsWithGraph(hits, centrality, graph);
  return {
    available: true,
    query,
    results: hits,
    coverage: { files: index.docCount, truncated: index.truncated === true },
    snapshotGeneratedAt: snapshot?.generatedAt
  };
}

// dist/clients/deps/typebox.js
import { Type } from "typebox";

// dist/clients/ast-grep-tool-logger.js
import * as path30 from "node:path";
var AG_LOG_DIR = getGlobalPiLensLogDir();
var AG_LOG_FILE = path30.join(AG_LOG_DIR, "ast-grep-tools.log");
var AG_LOG_BACKUP_FILE = path30.join(AG_LOG_DIR, "ast-grep-tools.log.1");
var MAX_LOG_BYTES3 = Math.max(128 * 1024, Number.parseInt(process.env.PI_LENS_AST_GREP_LOG_MAX_BYTES ?? "1048576", 10) || 1048576);
var writer3 = createNdjsonLogger({
  filePath: AG_LOG_FILE,
  maxBytes: MAX_LOG_BYTES3,
  backupPath: AG_LOG_BACKUP_FILE
});
var PATTERN_TRUNCATE_AT = 500;
var ERROR_TRUNCATE_AT = 300;
function truncate(value, max) {
  if (value === void 0)
    return void 0;
  if (value.length <= max)
    return value;
  return `${value.slice(0, max)}\u2026[truncated ${value.length - max} chars]`;
}
function classifyAstGrepError(errorMessage) {
  if (!errorMessage)
    return "other";
  const lower = errorMessage.toLowerCase();
  if (lower.includes("multiple ast nodes are detected") || lower.includes("the pattern appears to contain multiple ast nodes")) {
    return "multiple_ast_nodes";
  }
  if (lower.includes("cannot parse query") || lower.includes("pattern syntax error") || lower.includes("could not be parsed as valid code")) {
    return "cannot_parse_query";
  }
  if (lower.includes("cli not found") || lower.includes("enoent") || lower.includes("not installed")) {
    return "tool_not_found";
  }
  if (lower.includes("timed out") || lower.includes("timeout")) {
    return "timeout";
  }
  if (lower.includes("failed to parse output")) {
    return "json_parse_failed";
  }
  return "other";
}
function astGrepRemediationHint(kind) {
  switch (kind) {
    case "multiple_ast_nodes":
    case "cannot_parse_query":
      return null;
    case "tool_not_found":
      return "Hint: the ast-grep CLI is missing or not on PATH \u2014 install it with `npm i -D @ast-grep/cli`.";
    case "timeout":
      return "Hint: the operation timed out \u2014 scope `paths` to specific files/folders, or narrow the pattern.";
    case "json_parse_failed":
      return "Hint: ast-grep produced output that could not be parsed \u2014 retry with a simpler pattern; the installed CLI version may be incompatible.";
    default:
      return "Hint: verify the pattern is a single valid AST node for this `lang` (use ast_grep_search with dump=true to discover node kinds), or fall back to grep for plain-text search.";
  }
}
function logAstGrepToolEvent(event) {
  if (isTestMode())
    return;
  const payload = {
    ...event,
    pattern: truncate(event.pattern, PATTERN_TRUNCATE_AT) ?? "",
    patternLineCount: event.patternLineCount,
    rewrite: truncate(event.rewrite, PATTERN_TRUNCATE_AT),
    rewriteLineCount: event.rewriteLineCount,
    errorRaw: truncate(event.errorRaw, ERROR_TRUNCATE_AT)
  };
  writer3.log({ ts: (/* @__PURE__ */ new Date()).toISOString(), ...payload });
}

// dist/clients/ast-grep-yaml-synth.js
var MAX_SYNTHESIZED_PATTERN_CHARS = 4e3;
var MAX_NODE_KIND_CHARS = 80;
var NODE_KIND_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
function hasStructuralIntent(intent) {
  return !!(intent.nodeKind || intent.insideKind || intent.hasKind || intent.hasDescendantKind || intent.follows || intent.precedes);
}
function synthesizeReplaceRule(intent) {
  const base = synthesizeRule(intent);
  return `${base}fix: ${JSON.stringify(intent.rewrite)}
`;
}
function synthesizeRule(intent) {
  const hasPattern = !!intent.pattern?.trim();
  const hasNodeKind = !!intent.nodeKind?.trim();
  if (hasPattern === hasNodeKind) {
    throw new Error("provide exactly one of pattern or nodeKind");
  }
  const pattern = intent.pattern;
  if (hasPattern && pattern)
    assertSafePattern(pattern, "pattern");
  if (intent.hasKind?.trim() && intent.hasDescendantKind?.trim()) {
    throw new Error("hasKind and hasDescendantKind are mutually exclusive");
  }
  const language = canonicalLanguage(intent.lang);
  const rule = hasNodeKind ? { kind: assertSafeNodeKind(intent.nodeKind ?? "", "nodeKind") } : { pattern };
  if (intent.insideKind) {
    rule.inside = {
      kind: assertSafeNodeKind(intent.insideKind, "insideKind"),
      stopBy: "end"
    };
  }
  if (intent.hasKind) {
    rule.has = { kind: assertSafeNodeKind(intent.hasKind, "hasKind") };
  }
  if (intent.hasDescendantKind) {
    rule.has = {
      kind: assertSafeNodeKind(intent.hasDescendantKind, "hasDescendantKind"),
      stopBy: "end"
    };
  }
  if (intent.follows) {
    assertSafePattern(intent.follows, "follows");
    rule.follows = { pattern: intent.follows };
  }
  if (intent.precedes) {
    assertSafePattern(intent.precedes, "precedes");
    rule.precedes = { pattern: intent.precedes };
  }
  const doc = {
    id: "agent-rule",
    language,
    rule
  };
  return dump(doc, { lineWidth: -1 });
}
function assertSafePattern(value, field) {
  if (!value.trim()) {
    throw new Error(`${field} is required for YAML synthesis`);
  }
  if (value.length > MAX_SYNTHESIZED_PATTERN_CHARS) {
    throw new Error(`${field} is too long for YAML synthesis`);
  }
  if (value.includes("\0")) {
    throw new Error(`${field} contains a NUL byte`);
  }
}
function assertSafeNodeKind(value, field) {
  const kind = value.trim();
  if (kind.length === 0) {
    throw new Error(`${field} is required for YAML synthesis`);
  }
  if (kind.length > MAX_NODE_KIND_CHARS || !NODE_KIND_RE.test(kind)) {
    throw new Error(`${field} must be a single AST node kind like function_declaration`);
  }
  return kind;
}
function canonicalLanguage(lang) {
  const map = {
    typescript: "TypeScript",
    tsx: "Tsx",
    javascript: "JavaScript",
    jsx: "JavaScript",
    python: "Python",
    rust: "Rust",
    go: "Go",
    java: "Java",
    kotlin: "Kotlin",
    swift: "Swift",
    csharp: "CSharp",
    cpp: "Cpp",
    c: "C",
    ruby: "Ruby",
    php: "Php",
    dart: "Dart",
    elixir: "Elixir",
    lua: "Lua",
    ocaml: "OCaml",
    zig: "Zig",
    bash: "Bash",
    css: "Css",
    html: "Html",
    json: "Json",
    yaml: "Yaml",
    toml: "Toml",
    vue: "Vue"
  };
  return map[lang.toLowerCase()] ?? lang;
}

// dist/tools/shared.js
function resolveAstGrepPaths(paths, cwd) {
  const base = cwd || ".";
  const requested = paths?.length ? paths : [base];
  return requested.map((p) => resolveHostToolPath(p, base));
}
var LANGUAGES = [
  "bash",
  "c",
  "cpp",
  "csharp",
  "css",
  "elixir",
  "go",
  "haskell",
  "html",
  "java",
  "javascript",
  "json",
  "kotlin",
  "lua",
  "nix",
  "php",
  "python",
  "ruby",
  "rust",
  "scala",
  "swift",
  "tsx",
  "typescript",
  "yaml"
];

// dist/tools/ast-grep-replace.js
function errorTextWithHint(raw) {
  const hint = astGrepRemediationHint(classifyAstGrepError(raw));
  return hint ? `Error: ${raw}

${hint}` : `Error: ${raw}`;
}
function lineCount(value) {
  if (!value)
    return 0;
  let lines = 1;
  for (let i = 0; i < value.length; i++) {
    if (value.charCodeAt(i) === 10)
      lines++;
  }
  return lines;
}
function createAstGrepReplaceTool(astGrepClient2, captureLineage) {
  return {
    name: "ast_grep_replace",
    label: "AST Replace",
    description: 'Find and rewrite code by AST structure; preview by default. Example: `{pattern: "var $X", rewrite: "let $X", apply: false}`.',
    promptSnippet: "Preview an AST-aware code rewrite",
    renderResult: compactRenderResult(({ details, isError, text }) => {
      if (details?.stalePreview) {
        return `ast_grep_replace \u2014 stale preview, re-run with apply:false`;
      }
      if (isError) {
        return `ast_grep_replace \u2014 ${text.split("\n")[0] ?? "error"}`;
      }
      const n = details?.matchCount ?? 0;
      const state = details?.applied ? "applied" : "preview";
      return `ast_grep_replace \u2014 ${n} match${n === 1 ? "" : "es"}, ${state}`;
    }),
    parameters: Type.Object({
      pattern: Type.String({
        description: "AST pattern to match (be specific with context)"
      }),
      rewrite: Type.String({
        description: "Replacement using meta-variables from pattern"
      }),
      lang: Type.String({
        enum: [...LANGUAGES],
        description: "Target language"
      }),
      paths: Type.Optional(Type.Array(Type.String(), { description: "Specific files/folders" })),
      insideKind: Type.Optional(Type.String({
        description: "Restrict matches to nodes inside an ancestor of this AST node kind. Synthesizes a YAML rule."
      })),
      hasKind: Type.Optional(Type.String({
        description: 'Restrict matches to nodes whose immediate child has this AST node kind (ast-grep default stopBy: neighbor). Example: `hasKind: "await_expression"`.'
      })),
      hasDescendantKind: Type.Optional(Type.String({
        description: "Restrict matches to nodes containing this AST node kind anywhere in their descendants. Explicit recursive form (`stopBy: end`); use this instead of `hasKind` when nesting is not immediate."
      })),
      follows: Type.Optional(Type.String({
        description: "Restrict matches to nodes that immediately follow a sibling matching this pattern."
      })),
      precedes: Type.Optional(Type.String({
        description: "Restrict matches to nodes that immediately precede a sibling matching this pattern."
      })),
      apply: Type.Optional(Type.Boolean({ description: "Apply changes (default: false)" })),
      strictness: Type.Optional(Type.String({
        enum: ["smart", "relaxed", "ast", "cst", "signature", "template"],
        description: "Pattern matching strictness. 'smart' (default) ignores comments and whitespace. 'relaxed' also ignores unnamed nodes like punctuation. 'ast' ignores all whitespace."
      }))
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const lineage = captureLineage?.();
      const startedAt = Date.now();
      const { pattern, rewrite, paths, apply, strictness, insideKind, hasKind, hasDescendantKind, follows, precedes } = params;
      const lang = (params.lang ?? "").replace(/^"|"$/g, "");
      const pathsCount = paths?.length ?? 1;
      const applyFlag = apply ?? false;
      const resultMaxItems = ctx.resultMaxItems ?? 50;
      function logOutcome(outcome, details = {}) {
        try {
          logAstGrepToolEvent({
            tool: "ast_grep_replace",
            lang,
            pattern,
            patternLineCount: lineCount(pattern),
            rewrite,
            rewriteLineCount: lineCount(rewrite ?? ""),
            pathsCount,
            applied: applyFlag,
            outcome,
            errorKind: outcome === "error" ? classifyAstGrepError(details.errorRaw) : void 0,
            errorRaw: details.errorRaw,
            matchCount: details.matchCount ?? 0,
            truncated: details.truncated ?? false,
            durationMs: Date.now() - startedAt
          });
        } catch {
        }
      }
      if (!await astGrepClient2.ensureAvailable()) {
        logOutcome("error", { errorRaw: "ast-grep CLI not found" });
        return {
          content: [
            {
              type: "text",
              text: "ast-grep CLI not found. Install: npm i -D @ast-grep/cli"
            }
          ],
          isError: true,
          details: {}
        };
      }
      const searchPaths = resolveAstGrepPaths(paths, ctx.cwd);
      if (hasStructuralIntent({
        insideKind,
        hasKind,
        hasDescendantKind,
        follows,
        precedes
      })) {
        let ruleYaml;
        try {
          ruleYaml = synthesizeReplaceRule({
            pattern,
            lang,
            rewrite,
            insideKind,
            hasKind,
            hasDescendantKind,
            follows,
            precedes
          });
        } catch (err) {
          logOutcome("error", { errorRaw: String(err) });
          return {
            content: [
              {
                type: "text",
                text: `Error synthesizing rule: ${err}`
              }
            ],
            isError: true,
            details: {}
          };
        }
        const ruleResult = await astGrepClient2.replaceWithRule(ruleYaml, searchPaths, applyFlag, { lineage, toolCallId: _toolCallId });
        if (ruleResult.stalePreview) {
          logOutcome("error", { errorRaw: "stale_preview" });
          return {
            content: [
              {
                type: "text",
                text: "Stale preview \u2014 pattern no longer matches. Re-run with apply: false."
              }
            ],
            isError: true,
            details: { stalePreview: true }
          };
        }
        if (ruleResult.error) {
          logOutcome("error", { errorRaw: ruleResult.error });
          return {
            content: [
              {
                type: "text",
                text: errorTextWithHint(ruleResult.error)
              }
            ],
            isError: true,
            details: {}
          };
        }
        const output2 = astGrepClient2.formatMatches(ruleResult.matches, !applyFlag, true, resultMaxItems);
        logOutcome(ruleResult.matches.length === 0 ? "no_matches" : "success", {
          matchCount: ruleResult.matches.length
        });
        return {
          content: [{ type: "text", text: output2 }],
          details: {
            matchCount: ruleResult.matches.length,
            applied: applyFlag
          }
        };
      }
      const result = await astGrepClient2.replace(pattern, rewrite, lang, searchPaths, applyFlag, { strictness, lineage, toolCallId: _toolCallId });
      if (result.stalePreview) {
        logOutcome("error", { errorRaw: "stale_preview" });
        return {
          content: [
            {
              type: "text",
              text: "Stale preview \u2014 the pattern no longer matches any files. The file content has changed since your last apply: false preview. Re-run with apply: false to get a fresh preview before applying."
            }
          ],
          isError: true,
          details: { stalePreview: true }
        };
      }
      if (result.error) {
        logOutcome("error", { errorRaw: result.error });
        return {
          content: [
            { type: "text", text: errorTextWithHint(result.error) }
          ],
          isError: true,
          details: {}
        };
      }
      const isDryRun = !applyFlag;
      const output = astGrepClient2.formatMatches(
        result.matches,
        isDryRun,
        true,
        // showModeIndicator
        resultMaxItems
      );
      logOutcome(result.matches.length === 0 ? "no_matches" : "success", {
        matchCount: result.matches.length,
        truncated: result.truncated
      });
      return {
        content: [{ type: "text", text: output }],
        details: {
          matchCount: result.matches.length,
          totalMatches: result.totalMatches,
          truncated: result.truncated,
          applied: applyFlag
        }
      };
    }
  };
}

// dist/tools/ast-grep-search.js
function errorTextWithHint2(raw) {
  const hint = astGrepRemediationHint(classifyAstGrepError(raw));
  return hint ? `Error: ${raw}

${hint}` : `Error: ${raw}`;
}
function _telemetryErrorForTest(raw) {
  if (!raw)
    return void 0;
  return raw.replace(/\0/g, "\\0").slice(0, 2e3);
}
function _telemetryClassificationErrorForTest(raw) {
  return raw?.replace(/\0/g, "");
}
function toSearchReads(matches) {
  const out = [];
  for (const m of matches) {
    const span = toLineSpan(m);
    if (!span)
      continue;
    out.push({
      file: span.file,
      startLine: span.startLine,
      endLine: span.endLine
    });
  }
  return out;
}
var DEFAULT_PAGE_SIZE = 50;
var MAX_PAGE_SIZE = 200;
var MAX_PATHS = 200;
var AST_GREP_SEARCH_TIMEOUT_MS = 3e4;
function formatGroupedByFile(matches) {
  const byFile = /* @__PURE__ */ new Map();
  for (const m of matches) {
    if (!m.file)
      continue;
    const list = byFile.get(m.file);
    if (list)
      list.push(m);
    else
      byFile.set(m.file, [m]);
  }
  const total = matches.length;
  const fileCount = byFile.size;
  const lines = [
    `${fileCount} file${fileCount === 1 ? "" : "s"}, ${total} match${total === 1 ? "" : "es"}:`
  ];
  for (const [file, group] of byFile) {
    const locs = group.map((m) => {
      const line = (m.range?.start?.line ?? 0) + 1;
      const col = (m.range?.start?.column ?? 0) + 1;
      return `L${line}:${col}`;
    }).join(", ");
    lines.push(`${file} (${group.length}): ${locs}`);
  }
  return lines.join("\n");
}
var DEFAULT_READ_SLICE_MARGIN = 3;
var MAX_READ_SLICE_MARGIN = 20;
var MAX_RAW_RULE_CHARS = 1e5;
function rawRuleValidationError(rule) {
  if (rule === void 0)
    return null;
  if (rule.includes("\0"))
    return "rule contains a NUL byte";
  if (rule.length > MAX_RAW_RULE_CHARS)
    return "rule is too long";
  return null;
}
function patternValidationError(pattern) {
  if (pattern.includes("\0"))
    return "pattern contains a NUL byte";
  if (pattern.length > 4e3)
    return "pattern is too long";
  return null;
}
function toLineSpan(match) {
  const start = match.range?.start?.line;
  if (!match.file || typeof start !== "number")
    return null;
  const end = match.range?.end?.line;
  return {
    file: match.file,
    startLine: start + 1,
    endLine: (typeof end === "number" ? end : start) + 1
  };
}
function toMatchLocations(matches, contextLines) {
  const margin = typeof contextLines === "number" && Number.isFinite(contextLines) ? Math.min(MAX_READ_SLICE_MARGIN, Math.max(0, Math.floor(contextLines))) : DEFAULT_READ_SLICE_MARGIN;
  const out = [];
  for (const match of matches) {
    const span = toLineSpan(match);
    if (!span)
      continue;
    const offset = Math.max(1, span.startLine - margin);
    out.push({
      file: span.file,
      line: span.startLine,
      endLine: span.endLine,
      readSlice: {
        path: span.file,
        offset,
        limit: span.endLine - offset + 1 + margin
      }
    });
  }
  return out;
}
function suggestedDump(lang) {
  return {
    tool: "ast_grep_search",
    mode: "dump",
    lang,
    note: "Run ast_grep_search with dump=true on a small representative source snippet (not a whole file) to inspect AST node kinds before retrying the search."
  };
}
function lineCount2(value) {
  if (!value)
    return 0;
  let lines = 1;
  for (let i = 0; i < value.length; i++) {
    if (value.charCodeAt(i) === 10)
      lines++;
  }
  return lines;
}
function looksLikeRuleYamlOrPlainText(pattern) {
  const text = pattern.trim();
  if (!text)
    return true;
  const lower = text.toLowerCase();
  if (/(^|\n)\s*(id|language|rule|rules|kind|pattern|message|severity)\s*:/.test(lower)) {
    return true;
  }
  if (/\b(id|language|rule|rules|kind|pattern|message|severity)\s*:\s*[a-z0-9_-]+/i.test(text)) {
    return true;
  }
  if (/^[-*]\s+/.test(text))
    return true;
  const hasAstSignals = /[$(){}[\].;:'"`]/.test(text);
  const hasWhitespace = /\s/.test(text);
  if (hasWhitespace && !hasAstSignals)
    return true;
  return false;
}
function getPatternHint(pattern, lang, selector) {
  const src = pattern.trim();
  if (selector) {
    return `Hint: selector=${JSON.stringify(selector)} narrows the AST node kind searched; it does not extract fields from matches. Retry once without selector, or use a selector that is the outer node kind you want to match.`;
  }
  if (/\\[wWdDsSbB]/.test(src)) {
    return 'Hint: "\\w", "\\d", "\\s", "\\b" are regex escapes. ast-grep matches AST nodes, not text \u2014 use $VAR for identifiers, $$$ for node lists, or switch to grep for text search.';
  }
  if (/\[[a-zA-Z0-9]-[a-zA-Z0-9]\]/.test(src)) {
    return 'Hint: "[a-z]" and similar character classes are regex, not AST. Use $VAR to match any identifier, or switch to grep for text search.';
  }
  if (!src.includes("$") && /\w\.[*+]/.test(src)) {
    return 'Hint: ".*" and ".+" are regex wildcards. In ast-grep use $$$ for multiple AST nodes and $VAR for a single node. For text patterns, switch to grep.';
  }
  if (/^[-\w.*]+\|[-\w.*|]+$/.test(src)) {
    return 'Hint: "|" is regex alternation and does NOT work in ast-grep patterns. Options: (a) fire one ast_grep_search per alternative, or (b) switch to grep with a regex pattern like "foo|bar".';
  }
  if (lang === "python") {
    if ((src.startsWith("def ") || src.startsWith("async def ")) && src.endsWith(":")) {
      return `Hint: Remove trailing colon from Python patterns. Try: "${src.slice(0, -1)}"`;
    }
    if (src.startsWith("class ") && src.endsWith(":")) {
      return `Hint: Remove trailing colon from class patterns. Try: "${src.slice(0, -1)}"`;
    }
  }
  if (["javascript", "typescript", "tsx"].includes(lang)) {
    if (/^(export\s+)?(async\s+)?function\s+\$[A-Z_]+\s*$/i.test(src)) {
      return 'Hint: Function patterns need params and body. Try "function $NAME($$$) { $$$ }"';
    }
  }
  if (lang === "go") {
    if (/^func\s+\$[A-Z_]+\s*$/i.test(src)) {
      return 'Hint: Go function patterns need params and body. Try "func $NAME($$$) { $$$ }"';
    }
  }
  if (lang === "rust") {
    if (/^fn\s+\$[A-Z_]+\s*$/i.test(src)) {
      return 'Hint: Rust fn patterns need params and body. Try "fn $NAME($$$) { $$$ }"';
    }
  }
  return "Hint: No matches. Retry once with a smaller valid AST pattern scoped to the same paths (for example a call like `foo($$$ARGS)`, an import statement, or `function $NAME($$$ARGS) { $$$BODY }`). If you're actually looking for a name/usage rather than a structural pattern, prefer symbol_search (ranked identifier search) or module_report (file outline) over another AST retry; lsp_navigation findReferences finds exact call sites once you have a definition. If that also fails, use grep for text search, or ast_grep_search with dump=true on a small representative snippet to inspect node kinds.";
}
function astGrepDumpCompatibilityResult(params, surface) {
  return {
    content: [
      {
        type: "text",
        text: `The ast_grep_dump tool was retired. Call ${surface === "mcp" ? "pilens_" : ""}ast_grep_search with dump=true and put the snippet in pattern instead.`
      }
    ],
    isError: true,
    details: {
      compatibility: "ast_grep_dump -> ast_grep_search",
      call: {
        tool: surface === "mcp" ? "pilens_ast_grep_search" : "ast_grep_search",
        arguments: {
          dump: true,
          pattern: params.source,
          lang: params.lang
        }
      }
    }
  };
}
function createAstGrepSearchTool(astGrepClient2) {
  return {
    name: "ast_grep_search",
    label: "AST Search",
    description: "Search source by AST structure rather than text. Example: find calls with `console.log($MSG)`.",
    promptSnippet: "Search source by AST structure",
    renderResult: compactRenderResult(({ details, isError, text }) => {
      if (details?.validateOnly) {
        const mode = details.mode ?? "pattern";
        return details.valid ? `ast_grep_search \u2014 valid ${mode}` : `ast_grep_search \u2014 invalid ${mode}`;
      }
      if (isError) {
        return `ast_grep_search \u2014 ${text.split("\n")[0] ?? "error"}`;
      }
      const count = details?.matchCount ?? 0;
      const total = details?.totalMatches;
      const ofTotal = typeof total === "number" && total > count ? ` of ${total}` : "";
      const applied = details?.applied ? " (applied)" : "";
      return `ast_grep_search \u2014 ${count}${ofTotal} match${count === 1 && !ofTotal ? "" : "es"}${applied}`;
    }),
    parameters: Type.Object({
      dump: Type.Optional(Type.Boolean()),
      pattern: Type.Optional(Type.String({ description: "AST pattern." })),
      lang: Type.String({
        enum: [...LANGUAGES],
        description: "Target language"
      }),
      paths: Type.Optional(Type.Array(Type.String(), {
        maxItems: MAX_PATHS,
        description: "Files or directories to search."
      })),
      selector: Type.Optional(Type.String({
        description: "AST node kind filter."
      })),
      context: Type.Optional(Type.Number({
        description: "Context lines around matches."
      })),
      nodeKind: Type.Optional(Type.String({
        description: "AST node kind without a pattern."
      })),
      insideKind: Type.Optional(Type.String({
        description: "Ancestor AST node kind filter."
      })),
      hasKind: Type.Optional(Type.String({
        description: "Immediate-child AST node kind filter."
      })),
      hasDescendantKind: Type.Optional(Type.String({
        description: "Recursive descendant AST node kind filter."
      })),
      follows: Type.Optional(Type.String({
        description: "Preceding sibling pattern filter."
      })),
      precedes: Type.Optional(Type.String({
        description: "Following sibling pattern filter."
      })),
      rule: Type.Optional(Type.String({
        description: "Raw ast-grep YAML rule."
      })),
      skip: Type.Optional(Type.Number({
        description: "Matches to skip for pagination."
      })),
      maxMatches: Type.Optional(Type.Number({
        description: "Maximum matches to return."
      })),
      groupByFile: Type.Optional(Type.Boolean({
        description: "Group matches by file."
      })),
      strictness: Type.Optional(Type.String({
        enum: ["smart", "relaxed", "ast", "cst", "signature", "template"],
        description: "Pattern matching strictness."
      })),
      validateOnly: Type.Optional(Type.Boolean({
        description: "Validate without scanning."
      }))
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const abortSignal = combineAbortSignals(_signal, ctx.signal);
      const startedAt = Date.now();
      const deadlineAt = startedAt + AST_GREP_SEARCH_TIMEOUT_MS;
      const { paths, nodeKind, selector, context, skip, maxMatches, groupByFile, strictness, rule, insideKind, hasKind, hasDescendantKind, follows, precedes, validateOnly, dump: dump2 } = params;
      const pattern = typeof params.pattern === "string" ? params.pattern : "";
      const rawLang = typeof params.lang === "string" ? params.lang : "";
      const normalizedNodeKind = typeof nodeKind === "string" ? nodeKind.trim() : "";
      const skipOffset = Math.max(0, Math.floor(skip ?? 0));
      const lang = rawLang.replace(/^"|"$/g, "");
      const searchPathsCount = paths?.length ?? 1;
      const executionOptions = { signal: abortSignal, deadlineAt };
      const dumpMode = dump2 === true;
      function logOutcome(outcome, details = {}) {
        try {
          const errorRaw = _telemetryErrorForTest(details.errorRaw);
          const classificationError = _telemetryClassificationErrorForTest(details.errorRaw);
          logAstGrepToolEvent({
            tool: "ast_grep_search",
            lang,
            pattern,
            patternLineCount: lineCount2(pattern),
            pathsCount: searchPathsCount,
            outcome,
            errorKind: outcome === "error" ? classifyAstGrepError(classificationError) : void 0,
            errorRaw,
            matchCount: details.matchCount ?? 0,
            truncated: details.truncated ?? false,
            durationMs: Date.now() - startedAt
          });
        } catch (err) {
          try {
            process.emitWarning(`ast_grep_search telemetry failed: ${err}`, {
              code: "PI_LENS_AST_GREP_SEARCH_TELEMETRY_FAILED"
            });
          } catch {
            void err;
          }
        }
      }
      function abortError() {
        logOutcome("error", { errorRaw: "operation aborted" });
        return {
          content: [
            { type: "text", text: "Error: operation aborted" }
          ],
          isError: true,
          details: {}
        };
      }
      try {
        const rawRule = typeof rule === "string" ? rule : void 0;
        const hasRawRule = Boolean(rawRule?.trim());
        const hasPattern = Boolean(pattern.trim());
        const hasNodeKind = normalizedNodeKind.length > 0;
        const rawPaths = params.paths;
        if (rawPaths !== void 0 && (!Array.isArray(rawPaths) || rawPaths.length > MAX_PATHS || rawPaths.some((value) => typeof value !== "string"))) {
          const errorRaw = `paths must contain at most ${MAX_PATHS} string entries`;
          logOutcome("error", { errorRaw });
          return {
            content: [{ type: "text", text: `Error: ${errorRaw}` }],
            isError: true,
            details: {}
          };
        }
        const rawRuleError = rawRuleValidationError(rawRule);
        if (rawRuleError) {
          logOutcome("error", { errorRaw: rawRuleError });
          return {
            content: [
              { type: "text", text: `Error: ${rawRuleError}` }
            ],
            isError: true,
            details: {}
          };
        }
        if (!dumpMode && !hasPattern && !hasRawRule && !hasNodeKind) {
          logOutcome("error", {
            errorRaw: "pattern is required unless rule or nodeKind is provided"
          });
          return {
            content: [
              {
                type: "text",
                text: "Error: pattern is required unless rule or nodeKind is provided"
              }
            ],
            isError: true,
            details: {}
          };
        }
        const patternError = patternValidationError(pattern);
        if (pattern.trim() && patternError) {
          logOutcome("error", { errorRaw: patternError });
          return {
            content: [
              { type: "text", text: `Error: ${patternError}` }
            ],
            isError: true,
            details: {}
          };
        }
        if (!lang.trim()) {
          logOutcome("error", { errorRaw: "lang is required" });
          return {
            content: [
              { type: "text", text: "Error: lang is required" }
            ],
            isError: true,
            details: {}
          };
        }
        if (abortSignal?.aborted)
          return abortError();
        if (!await astGrepClient2.ensureAvailable()) {
          logOutcome("error", {
            errorRaw: "ast-grep CLI not found"
          });
          return {
            content: [
              {
                type: "text",
                text: "ast-grep CLI not found. Install: npm i -D @ast-grep/cli"
              }
            ],
            isError: true,
            details: {}
          };
        }
        if (abortSignal?.aborted)
          return abortError();
        if (dumpMode) {
          if (!pattern.trim()) {
            const errorRaw = "source is required when dump is true";
            logOutcome("error", { errorRaw });
            return {
              content: [{ type: "text", text: `Error: ${errorRaw}` }],
              isError: true,
              details: { mode: "dump", lang }
            };
          }
          const result2 = await astGrepClient2.dumpAst(pattern, lang);
          if (result2.error) {
            logOutcome("error", { errorRaw: result2.error });
            return {
              content: [
                { type: "text", text: `Error: ${result2.error}` }
              ],
              isError: true,
              details: { mode: "dump", lang }
            };
          }
          const output2 = result2.output ?? "";
          logOutcome("success", { matchCount: lineCount2(output2) });
          return {
            content: [{ type: "text", text: output2 }],
            details: {
              mode: "dump",
              lang,
              matchCount: lineCount2(output2),
              totalMatches: lineCount2(output2),
              truncated: false
            }
          };
        }
        if (!hasRawRule && hasPattern && looksLikeRuleYamlOrPlainText(pattern)) {
          logOutcome("error", {
            errorRaw: "pattern looks like rule YAML or plain text (rejected pre-spawn)"
          });
          return {
            content: [
              {
                type: "text",
                text: "Error: ast_grep_search expects a valid AST code pattern, not plain text/rule YAML. Use patterns like `function $NAME($$$ARGS) { $$$BODY }` or use grep/read for plain text diagnostics."
              }
            ],
            isError: true,
            details: {}
          };
        }
        if (!paths?.length && isAtOrAboveHomeDir(ctx.cwd || ".")) {
          logOutcome("error", {
            errorRaw: "defaulted cwd resolves at or above home directory"
          });
          return {
            content: [
              {
                type: "text",
                text: `Refused: no \`paths\` given and the working directory (${ctx.cwd || "."}) resolves at or above the home directory \u2014 searching it would scan every unrelated tree under your home. Pass explicit \`paths\`, or run from a project directory.`
              }
            ],
            isError: true,
            details: {}
          };
        }
        if (hasNodeKind && hasPattern) {
          const errorRaw = "nodeKind cannot be combined with pattern";
          logOutcome("error", { errorRaw });
          return {
            content: [{ type: "text", text: `Error: ${errorRaw}` }],
            isError: true,
            details: {}
          };
        }
        if (hasNodeKind && hasRawRule) {
          const errorRaw = "nodeKind cannot be combined with rule";
          logOutcome("error", { errorRaw });
          return {
            content: [{ type: "text", text: `Error: ${errorRaw}` }],
            isError: true,
            details: {}
          };
        }
        const searchPaths = resolveAstGrepPaths(paths, ctx.cwd);
        const PAGE_SIZE = Math.max(1, Math.min(MAX_PAGE_SIZE, Number.isFinite(maxMatches) ? Math.floor(maxMatches) : DEFAULT_PAGE_SIZE));
        let effectiveRule = hasRawRule ? rawRule : void 0;
        if (!effectiveRule && (hasNodeKind || hasStructuralIntent({
          nodeKind: normalizedNodeKind,
          insideKind,
          hasKind,
          hasDescendantKind,
          follows,
          precedes
        }))) {
          try {
            effectiveRule = synthesizeRule({
              pattern: hasPattern ? pattern : void 0,
              nodeKind: hasNodeKind ? normalizedNodeKind : void 0,
              lang,
              insideKind,
              hasKind,
              hasDescendantKind,
              follows,
              precedes
            });
          } catch (err) {
            logOutcome("error", { errorRaw: String(err) });
            return {
              content: [
                {
                  type: "text",
                  text: `Error synthesizing rule: ${err}`
                }
              ],
              isError: true,
              details: {}
            };
          }
        }
        if (validateOnly) {
          const validation = effectiveRule?.trim() ? await astGrepClient2.validateRule(effectiveRule, executionOptions) : await astGrepClient2.validatePattern(pattern, lang, {
            selector,
            strictness,
            ...executionOptions
          });
          if (!validation.valid) {
            logOutcome("error", { errorRaw: validation.error });
            return {
              content: [
                {
                  type: "text",
                  text: `Invalid ast-grep ${effectiveRule ? "rule" : "pattern"}: ${validation.error ?? "unknown error"}`
                }
              ],
              isError: true,
              details: { valid: false, validateOnly: true }
            };
          }
          logOutcome("success", { matchCount: 0 });
          const warning = "warning" in validation ? validation.warning : void 0;
          return {
            content: [
              {
                type: "text",
                text: `Valid ast-grep ${effectiveRule ? "rule" : "pattern"}.${warning ? ` Warning: ${warning}` : ""}`
              }
            ],
            details: {
              valid: true,
              validateOnly: true,
              mode: effectiveRule ? "rule" : "pattern",
              ...warning ? { warning } : {}
            }
          };
        }
        if (effectiveRule && effectiveRule.trim().length > 0) {
          if (abortSignal?.aborted)
            return abortError();
          const ruleResult = await astGrepClient2.searchWithRule(effectiveRule, searchPaths, executionOptions);
          if (abortSignal?.aborted)
            return abortError();
          if (ruleResult.error) {
            logOutcome("error", { errorRaw: ruleResult.error });
            return {
              content: [
                {
                  type: "text",
                  text: errorTextWithHint2(ruleResult.error)
                }
              ],
              isError: true,
              details: {}
            };
          }
          const afterSkip2 = ruleResult.matches.slice(skipOffset);
          const page2 = afterSkip2.slice(0, PAGE_SIZE);
          const hasMore2 = afterSkip2.length > PAGE_SIZE;
          const output2 = groupByFile ? formatGroupedByFile(page2) : astGrepClient2.formatMatches(page2, false, false, PAGE_SIZE);
          const paginationNote2 = hasMore2 && page2.length > 0 ? `

(Showing ${page2.length} of ${ruleResult.matches.length - skipOffset} remaining matches. Use skip=${skipOffset + PAGE_SIZE} for the next page.)` : "";
          logOutcome(page2.length === 0 ? "no_matches" : "success", {
            matchCount: page2.length,
            truncated: hasMore2
          });
          const matchLocations2 = toMatchLocations(page2, context);
          return {
            content: [
              { type: "text", text: `${output2}${paginationNote2}` }
            ],
            details: {
              matchCount: page2.length,
              totalMatches: ruleResult.totalMatches,
              truncated: hasMore2,
              hasMore: hasMore2,
              skip: skipOffset,
              groupByFile: groupByFile === true,
              // Lines shown to the agent — the read-guard registers these so a
              // follow-up edit to a match isn't blocked (#169). 1-based.
              searchReads: toSearchReads(page2),
              // Agent-facing follow-up handles for bounded context reads.
              matchLocations: matchLocations2,
              suggestedDump: page2.length === 0 ? suggestedDump(lang) : void 0
            }
          };
        }
        if (abortSignal?.aborted)
          return abortError();
        const result = await astGrepClient2.search(pattern, lang, searchPaths, {
          selector,
          context,
          strictness,
          ...executionOptions
        });
        if (abortSignal?.aborted)
          return abortError();
        if (result.error) {
          logOutcome("error", { errorRaw: result.error });
          return {
            content: [
              { type: "text", text: errorTextWithHint2(result.error) }
            ],
            isError: true,
            details: {}
          };
        }
        const afterSkip = result.matches.slice(skipOffset);
        const page = afterSkip.slice(0, PAGE_SIZE);
        const hasMore = afterSkip.length > PAGE_SIZE || result.truncated;
        const output = groupByFile ? formatGroupedByFile(page) : astGrepClient2.formatMatches(page, false, false, PAGE_SIZE);
        const hint = page.length === 0 && !result.error ? getPatternHint(pattern, lang, selector) : void 0;
        const paginationNote = hasMore && page.length > 0 ? `

(Showing ${page.length} of ${result.matches.length - skipOffset} remaining matches. Use skip=${skipOffset + PAGE_SIZE} for the next page.)` : "";
        const finalOutput = hint ? `${output}

${hint}` : `${output}${paginationNote}`;
        logOutcome(page.length === 0 ? "no_matches" : "success", {
          matchCount: page.length,
          truncated: hasMore
        });
        const matchLocations = toMatchLocations(page, context);
        return {
          content: [{ type: "text", text: finalOutput }],
          details: {
            matchCount: page.length,
            totalMatches: result.matches.length,
            truncated: hasMore,
            hasMore,
            skip: skipOffset,
            groupByFile: groupByFile === true,
            // Lines shown to the agent — registered as reads by the read-guard
            // so a follow-up edit to a match isn't blocked (#169). 1-based.
            searchReads: toSearchReads(page),
            // Agent-facing follow-up handles for bounded context reads.
            matchLocations,
            suggestedDump: page.length === 0 ? suggestedDump(lang) : void 0
          }
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logOutcome("error", { errorRaw: message });
        return {
          content: [{ type: "text", text: `Error: ${message}` }],
          isError: true,
          details: {}
        };
      }
    }
  };
}

// dist/tools/lens-diagnostics.js
import { promises as fs23 } from "node:fs";
import * as fsSync from "node:fs";
import * as path37 from "node:path";

// dist/clients/project-diagnostics/extractors.js
var WARM_TRIGGER = {
  knip: "runs at session-start",
  jscpd: "runs at session-start",
  madge: "runs at session-start",
  gitleaks: "runs at session-start (config opt-in), or on any git repo via mode=full (#608)",
  govulncheck: "runs at session-start (Go projects only)",
  opengrep: "runs at session-start",
  trivy: "runs at session-start",
  "dead-code": "runs at session-start (Python projects only)",
  "test-runner": "fires per-edit at turn_end (only after a source file with a discoverable test companion is edited)"
};
function warmTriggerFor(analyzerId) {
  return WARM_TRIGGER[analyzerId] ?? "runs at session-start";
}
function formatNotRunEntry(analyzerId, coldReasons) {
  const reason = coldReasons?.[analyzerId];
  return reason ? `${analyzerId} \u2014 not run (${reason})` : `${analyzerId} \u2014 not run (${warmTriggerFor(analyzerId)})`;
}
function formatCacheAge(ms) {
  if (!Number.isFinite(ms))
    return "age unknown";
  if (ms < 0)
    return "0m";
  const totalMinutes = Math.round(ms / 6e4);
  if (totalMinutes < 1)
    return "under 1m";
  if (totalMinutes < 60)
    return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours}h${minutes}m` : `${hours}h`;
}
function formatCacheAgeOld(ms) {
  const age = formatCacheAge(ms);
  return Number.isFinite(ms) ? `${age} old` : age;
}
function reasonFromAvailabilityVerdict(tool, verdict) {
  if (!verdict || verdict.outcome === null)
    return `${tool} binary unavailable`;
  const { outcome, cause } = verdict;
  if (outcome === "transient") {
    if (cause === "install-retry-exhausted") {
      return `${tool} install kept timing out and hit its retry ceiling this session (not reported missing)`;
    }
    const remainingMs = verdict.retryAtMs - Date.now();
    const remainingS = remainingMs > 0 ? Math.round(remainingMs / 1e3) : 0;
    return `${tool} availability probe \u2014 retry cooldown (${remainingS}s), not a missing install`;
  }
  if (outcome === "non-installable") {
    return `${tool} unavailable on this host (non-installable)`;
  }
  return `${tool} binary unavailable`;
}

// dist/clients/project-diagnostics/fresh-fetch.js
import * as fs21 from "node:fs";
import * as os4 from "node:os";
import * as path35 from "node:path";

// dist/clients/project-diagnostics/runner-adapters/jscpd.js
import * as path31 from "node:path";
function resolveClonePath(cwd, file) {
  return path31.isAbsolute(file) ? file : path31.resolve(cwd, file);
}
function jscpdCloneToProjectDiagnostics(cwd, clone) {
  const a = resolveClonePath(cwd, clone.fileA);
  const b = resolveClonePath(cwd, clone.fileB);
  const make = (filePath, line, otherFile, otherLine) => ({
    filePath,
    line,
    severity: "warning",
    semantic: "warning",
    tool: "jscpd",
    runner: "jscpd",
    rule: "jscpd:duplicate",
    message: `Duplicate code (${clone.lines} lines) \u2014 also at ${path31.relative(cwd, otherFile)}:${otherLine}`,
    source: "project-scan"
  });
  return [
    make(a, clone.startA, b, clone.startB),
    make(b, clone.startB, a, clone.startA)
  ];
}
function jscpdResultToProjectDiagnostics(cwd, result) {
  if (!result.success || result.clones.length === 0)
    return [];
  return result.clones.flatMap((clone) => jscpdCloneToProjectDiagnostics(cwd, clone));
}

// dist/clients/project-diagnostics/runner-adapters/madge.js
import * as path32 from "node:path";
function resolveCyclePath(cwd, file) {
  return path32.isAbsolute(file) ? file : path32.resolve(cwd, file);
}
function cycleMembers(dep) {
  return dep.path.length > 0 ? dep.path : [dep.file];
}
function circularDepToProjectDiagnostics(cwd, dep) {
  const members = cycleMembers(dep);
  const rendered = `${members.map((f) => path32.basename(f)).join(" \u2192 ")} \u2192 ${path32.basename(members[0] ?? "")}`;
  return members.map((file) => ({
    filePath: resolveCyclePath(cwd, file),
    severity: "warning",
    semantic: "warning",
    tool: "madge",
    runner: "madge",
    rule: "madge:circular",
    message: `Part of circular dependency: ${rendered}`,
    source: "project-scan"
  }));
}
function circularDepsToProjectDiagnostics(cwd, circular) {
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const dep of circular) {
    const key = cycleMembers(dep).map((f) => resolveCyclePath(cwd, f)).sort(compareOrdinal).join("|");
    if (seen.has(key))
      continue;
    seen.add(key);
    out.push(...circularDepToProjectDiagnostics(cwd, dep));
  }
  return out;
}

// dist/clients/project-diagnostics/runner-adapters/opengrep.js
import * as path33 from "node:path";
function severityFor(raw) {
  switch (raw.toUpperCase()) {
    case "ERROR":
      return { severity: "error", blocking: true };
    case "INFO":
      return { severity: "info", blocking: false };
    default:
      return { severity: "warning", blocking: false };
  }
}
function opengrepFindingToProjectDiagnostic(cwd, finding) {
  const { severity, blocking } = severityFor(finding.severity);
  const cweSuffix = finding.cwe?.length ? ` (${finding.cwe[0]})` : "";
  return {
    filePath: path33.isAbsolute(finding.path) ? finding.path : path33.resolve(cwd, finding.path),
    line: finding.startLine,
    column: finding.startCol,
    severity,
    semantic: blocking ? "blocking" : "warning",
    tool: "opengrep",
    runner: "opengrep",
    rule: `opengrep:${finding.checkId}`,
    message: `${finding.message}${cweSuffix}`,
    source: "project-scan"
  };
}
function opengrepResultToProjectDiagnostics(cwd, result) {
  if (!result.success || result.findings.length === 0)
    return [];
  return result.findings.map((finding) => opengrepFindingToProjectDiagnostic(cwd, finding));
}

// dist/clients/project-diagnostics/runner-adapters/runner-findings.js
import * as fs20 from "node:fs";
import * as path34 from "node:path";
function failureMessage(failure) {
  const firstLine2 = failure.message.split("\n")[0]?.slice(0, 300) ?? "";
  return firstLine2 ? `${failure.name}: ${firstLine2}` : failure.name;
}
var LOCATION_LINE_COL_RE = /:(\d+)(?::(\d+))?$/;
function parseLocation(location) {
  if (!location)
    return {};
  const match = LOCATION_LINE_COL_RE.exec(location);
  if (!match)
    return {};
  return {
    line: Number.parseInt(match[1], 10),
    ...match[2] ? { column: Number.parseInt(match[2], 10) } : {}
  };
}
function testResultToProjectDiagnostics(result, stale = false) {
  if (result.failed === 0 && !result.error)
    return [];
  const stalePrefix = stale ? "[stale \u2014 from a prior turn] " : "";
  if (result.failures.length > 0) {
    return result.failures.map((failure) => ({
      filePath: result.file,
      ...parseLocation(failure.location),
      severity: "error",
      semantic: "blocking",
      tool: "test-runner",
      runner: result.runner,
      rule: `test:${result.runner}`,
      message: `${stalePrefix}${failureMessage(failure)}`,
      source: "project-scan"
    }));
  }
  if (isRunnerErrorResult(result)) {
    return [
      {
        filePath: result.file,
        severity: "info",
        semantic: "none",
        tool: "test-runner",
        runner: result.runner,
        rule: `test:${result.runner}`,
        message: `${stalePrefix}Test run error: ${result.error}`,
        source: "project-scan"
      }
    ];
  }
  return [
    {
      filePath: result.file,
      severity: "error",
      semantic: "blocking",
      tool: "test-runner",
      runner: result.runner,
      rule: `test:${result.runner}`,
      message: `${stalePrefix}${result.failed} test(s) failed${result.error ? ` (runner also reported: ${result.error})` : ""}`,
      source: "project-scan"
    }
  ];
}
function testRunnerFindingsToProjectDiagnostics(cache, cwd, runtime) {
  if (!cache.results || cache.results.length === 0)
    return [];
  const validation = cwd ? validateAdvisoryProvenance(cache, cwd, runtime) : { status: "unknown", reasons: ["validation-context-missing"] };
  const root = cwd ?? process.cwd();
  const missingKeys = new Set((cache.provenance?.files ?? []).filter((file) => !fs20.existsSync(path34.resolve(root, file.path))).map((file) => advisoryPathKey(file.path, root)));
  const historical = cache.superseded === true || cache.stale === true || validation.status !== "current";
  return cache.results.filter((result) => !missingKeys.has(advisoryPathKey(result.file, root))).flatMap((result) => testResultToProjectDiagnostics(result, historical)).map((diagnostic) => historical ? {
    ...diagnostic,
    severity: "info",
    semantic: "none",
    message: diagnostic.message.startsWith("[stale") ? diagnostic.message : `[historical \u2014 re-run to confirm] ${diagnostic.message}`
  } : diagnostic);
}

// dist/clients/project-diagnostics/fresh-fetch.js
var ANALYZER_IDS = [
  "knip",
  "jscpd",
  "madge",
  "gitleaks",
  "govulncheck",
  "opengrep",
  "trivy",
  "dead-code",
  "test-runner"
];
function pushUnique(list, id) {
  if (!list.includes(id))
    list.push(id);
}
function laneObservedAtMs(scannedAt, startedAtMs) {
  return parseScannedAtMs(scannedAt) ?? startedAtMs;
}
async function fetchFreshProjectDiagnostics(cacheManager2, cwd, clients, signal, options = {}) {
  const requestedRoot = options.analysisRoot === void 0 ? cwd : path35.resolve(cwd, options.analysisRoot);
  let analysisRoot;
  let analysisRootValidation;
  if (options.analysisRoot !== void 0) {
    try {
      if (!fs21.statSync(requestedRoot).isDirectory()) {
        throw new Error("is not a directory");
      }
      analysisRoot = fs21.realpathSync(requestedRoot);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      const reason = `the explicit analysis root ${requestedRoot} is unavailable or ${detail}`;
      analysisRootValidation = {
        state: "undecided",
        root: requestedRoot,
        reason
      };
      incrementDegradationCount({
        kind: "lens-diagnostics-analysis-root-rejected",
        subject: requestedRoot,
        reason
      });
      return {
        analysisRootValidation,
        diagnostics: [],
        runners: [],
        analyzed: [],
        authoritativeCoverage: [],
        cold: [...ANALYZER_IDS],
        coldReasons: Object.fromEntries(ANALYZER_IDS.map((id) => [id, reason])),
        failed: [],
        timings: {},
        analysisRootError: reason
      };
    }
  } else {
    analysisRoot = realpathOrResolve(cwd);
  }
  const unsafeRootReason = "the analysis root resolves at or above the home directory; heavyweight analyzers refuse to walk from there (#747)";
  const homeRoot = realpathOrResolve(options.homeDir ?? os4.homedir());
  if (options.analysisRoot !== void 0) {
    const unsafeExplicitRoot = !isSameOrWithin(homeRoot, analysisRoot) || isSameOrWithin(analysisRoot, homeRoot);
    analysisRootValidation = unsafeExplicitRoot ? {
      state: "unsafe",
      root: analysisRoot,
      reason: "explicit analysis root must be strictly contained by the canonical home directory"
    } : { state: "safe", root: analysisRoot };
  } else if (isAtOrAboveHomeDir(analysisRoot, options.homeDir)) {
    analysisRootValidation = {
      state: "unsafe",
      root: analysisRoot,
      reason: unsafeRootReason
    };
  } else {
    analysisRootValidation = { state: "safe", root: analysisRoot };
  }
  if (analysisRootValidation.state !== "safe") {
    incrementDegradationCount({
      kind: "lens-diagnostics-analysis-root-rejected",
      subject: analysisRoot,
      reason: analysisRootValidation.reason
    });
    return {
      analysisRootValidation,
      diagnostics: [],
      runners: [],
      analyzed: [],
      authoritativeCoverage: [],
      cold: [...ANALYZER_IDS],
      coldReasons: Object.fromEntries(ANALYZER_IDS.map((id) => [id, unsafeRootReason])),
      failed: [],
      timings: {},
      unsafeRoot: analysisRootValidation.state === "unsafe"
    };
  }
  const diagnostics = [];
  const runners = [];
  const analyzed = [];
  const authoritativeCoverage = [];
  const cold = [];
  const coldReasons = {};
  const partial = [];
  const partialReasons = {};
  const failed = [];
  const timings = {};
  const cachedAgeMs = {};
  const settledIds = /* @__PURE__ */ new Set();
  let dispositionSuppressed = 0;
  const dispositionSuppressedByLane = {};
  function markCold(id, reason) {
    pushUnique(cold, id);
    coldReasons[id] = reason;
  }
  function markPartial(id, reason) {
    pushUnique(partial, id);
    partialReasons[id] = reason;
  }
  function record(id, adapted, elapsedMs, analysedRoot, analysis, observedAt) {
    if (analysedRoot) {
      pushUnique(analyzed, id);
      if (analysis?.analyzedFiles !== void 0) {
        const root = realpathOrResolve(analysisRoot);
        authoritativeCoverage.push({
          runnerId: id,
          root,
          files: new Set(analysis.analyzedFiles.map((file) => {
            return realpathOrResolve(file);
          }))
        });
        if (analysis.analyzedFiles.length === 0) {
          recordDegradationOnce({
            kind: "runner-coverage-empty",
            subject: `${id}:${root}`,
            reason: `${id} analysed this root but declared zero scanned files, so retained ${id} findings are kept rather than retired`
          });
        }
      }
    }
    timings[id] = (timings[id] ?? 0) + elapsedMs;
    const stamped = observedAt === void 0 ? adapted : adapted.map((diagnostic) => ({ ...diagnostic, observedAt }));
    const kept = applyDispositionsMultiFile(stamped, analysisRoot, (d) => d.filePath);
    const suppressedHere = adapted.length - kept.length;
    dispositionSuppressed += suppressedHere;
    if (suppressedHere > 0) {
      dispositionSuppressedByLane[id] = (dispositionSuppressedByLane[id] ?? 0) + suppressedHere;
    }
    if (kept.length > 0) {
      diagnostics.push(...kept);
      pushUnique(runners, id);
    }
  }
  function recordFailed(id, result) {
    failed.push({
      id,
      ..."reason" in result && result.reason !== void 0 ? { reason: result.reason } : {},
      summary: "summary" in result && typeof result.summary === "string" ? result.summary : "analyzer reported an unsuccessful run"
    });
  }
  function task(id, run) {
    return run().finally(() => settledIds.add(id));
  }
  const tasks = [
    // knip — always applicable to probe (KnipClient.analyze itself no-ops
    // when no project root marker is found, matching session_start).
    task("knip", async () => {
      const startMs = Date.now();
      const result = await clients.knipClient.analyze(analysisRoot, getKnipIgnorePatterns());
      if (!result.success) {
        recordFailed("knip", result);
        return;
      }
      if (result.analyzed !== true) {
        markCold("knip", result.summary ?? "knip did not analyse this root");
        return;
      }
      cacheManager2.writeCache("knip", result, analysisRoot, {
        scanDurationMs: Date.now() - startMs
      });
      record("knip", knipIssuesToProjectDiagnostics(analysisRoot, result.issues ?? []), Date.now() - startMs, true, result, laneObservedAtMs(result.scannedAt, startMs));
    }),
    // jscpd — duplicate code detection. Cache key varies with TS-project
    // detection, exactly mirroring session_start's own logic.
    task("jscpd", async () => {
      if (!await clients.jscpdClient.ensureAvailable()) {
        markCold("jscpd", reasonFromAvailabilityVerdict("jscpd", clients.jscpdClient.getAvailabilityVerdict?.()));
        return;
      }
      const isTsProject = fs21.existsSync(path35.join(analysisRoot, "tsconfig.json"));
      const scannerKey = isTsProject ? "jscpd-ts" : "jscpd";
      const startMs = Date.now();
      const result = await clients.jscpdClient.scan(analysisRoot, void 0, void 0, isTsProject);
      if (!result.success) {
        recordFailed("jscpd", result);
        return;
      }
      if (result.analyzed !== true) {
        markCold("jscpd", "jscpd did not analyse this root (no source files, or the scan produced no report)");
        return;
      }
      cacheManager2.writeCache(scannerKey, result, analysisRoot, {
        scanDurationMs: Date.now() - startMs
      });
      record("jscpd", jscpdResultToProjectDiagnostics(analysisRoot, result), Date.now() - startMs, true, result, laneObservedAtMs(result.scannedAt, startMs));
    }),
    // madge — circular-dependency detection.
    task("madge", async () => {
      if (!await clients.depChecker.ensureAvailable()) {
        markCold("madge", reasonFromAvailabilityVerdict("madge", clients.depChecker.getAvailabilityVerdict?.()));
        return;
      }
      const startMs = Date.now();
      const result = await clients.depChecker.scanProject(analysisRoot);
      cacheManager2.writeCache("madge", result, analysisRoot, {
        scanDurationMs: Date.now() - startMs
      });
      record("madge", circularDepsToProjectDiagnostics(analysisRoot, result.circular ?? []), Date.now() - startMs, result.analyzed === true, result, laneObservedAtMs(result.scannedAt, startMs));
    }),
    // gitleaks — committed-secrets detection. session_start/per-edit stay
    // config-gated per #130's strict default (GitleaksClient.hasGitleaksSignal),
    // but mode=full is an explicitly-requested comprehensive review — use
    // #130's own considered-but-unshipped "smart-default" tier instead (any
    // tracked git repo, GitleaksClient.hasGitRepo): gitleaks is cheap (~10MB
    // binary, no external DB pull) and findings are advisory-only, so the
    // stricter opt-in gate is needlessly conservative for this call. Refs #608
    // dogfooding finding that flagged gitleaks/trivy/govulncheck/dead-code as
    // "cold" on a project with no explicit gitleaks config.
    task("gitleaks", async () => {
      if (!GitleaksClient.hasGitRepo(analysisRoot)) {
        markCold("gitleaks", "not a git repository (no .git found)");
        return;
      }
      if (!await clients.gitleaksClient.ensureAvailable()) {
        markCold("gitleaks", reasonFromAvailabilityVerdict("gitleaks", clients.gitleaksClient.getAvailabilityVerdict?.()));
        return;
      }
      const startMs = Date.now();
      const result = await clients.gitleaksClient.scan(analysisRoot, {
        requireSignal: false
      });
      if (!result.success) {
        recordFailed("gitleaks", result);
        return;
      }
      cacheManager2.writeCache("gitleaks", result, analysisRoot, {
        scanDurationMs: Date.now() - startMs
      });
      record("gitleaks", gitleaksResultToProjectDiagnostics(analysisRoot, result), Date.now() - startMs, result.analyzed === true, result, laneObservedAtMs(result.scannedAt, startMs));
    }),
    // govulncheck — Go module CVE detection. Go-module-gated per #132.
    task("govulncheck", async () => {
      if (!GovulncheckClient.hasGoModule(analysisRoot)) {
        markCold("govulncheck", "no go.mod found (not a Go module)");
        return;
      }
      if (!await clients.govulncheckClient.ensureAvailable()) {
        markCold("govulncheck", isToolInstallAllowedByTrust() ? reasonFromAvailabilityVerdict("govulncheck", clients.govulncheckClient.getAvailabilityVerdict?.()) : projectTrustDenialReason() ?? "govulncheck binary unavailable");
        return;
      }
      const startMs = Date.now();
      const result = await clients.govulncheckClient.analyze(analysisRoot);
      if (!result.success) {
        recordFailed("govulncheck", result);
        return;
      }
      cacheManager2.writeCache("govulncheck", result, analysisRoot, {
        scanDurationMs: Date.now() - startMs
      });
      record("govulncheck", govulncheckResultToProjectDiagnostics(analysisRoot, result), Date.now() - startMs, result.analyzed === true, result, laneObservedAtMs(result.scannedAt, startMs));
    }),
    // opengrep — full-workspace semgrep-grade security/quality findings via a
    // single project-wide CLI scan (#584). Structurally always-on: mirrors
    // session_start (`runtime-session.ts`) and the LSP auxiliary's own
    // enablement (`OpengrepClient.resolveConfig` only picks WHICH rules run,
    // never whether opengrep runs at all), so unlike gitleaks/govulncheck/trivy
    // it carries NO static project-type gate — only an availability probe.
    // Re-entrancy-safe like the other SecurityScanClient-family analyzers:
    // `OpengrepClient.scan` routes through `SecurityScanClient.dedupeScan`, so a
    // call here that races the session_start whole-tree scan of the same root
    // JOINS the in-flight run instead of paying a second heavy scan (#883 single
    // source of truth — the exact wiring gitleaks/trivy use above). #585: this
    // was the one extractor registered in `extractors.ts` but MISSING here, so
    // opengrep scanned+cached yet nothing production read it back into
    // `lens_diagnostics mode=full` — the honesty gap (#533) this task closes.
    task("opengrep", async () => {
      if (!await clients.opengrepClient.ensureAvailable()) {
        markCold("opengrep", reasonFromAvailabilityVerdict("opengrep", clients.opengrepClient.getAvailabilityVerdict?.()));
        return;
      }
      const startMs = Date.now();
      const result = await clients.opengrepClient.scan(analysisRoot);
      if (!result.success) {
        recordFailed("opengrep", result);
        return;
      }
      if (result.analyzed !== true) {
        const reason = result.summary ?? result.reason ?? "opengrep did not analyse this root";
        if (result.partial)
          markPartial("opengrep", reason);
        else
          markCold("opengrep", reason);
        record("opengrep", opengrepResultToProjectDiagnostics(analysisRoot, result), Date.now() - startMs, false, result, laneObservedAtMs(result.scannedAt, startMs));
        return;
      }
      if (result.partial) {
        markPartial("opengrep", result.summary ?? result.reason ?? "opengrep scan coverage is incomplete");
        record("opengrep", opengrepResultToProjectDiagnostics(analysisRoot, result), Date.now() - startMs, true, result, laneObservedAtMs(result.scannedAt, startMs));
        return;
      }
      cacheManager2.writeCache("opengrep", result, analysisRoot, {
        scanDurationMs: Date.now() - startMs
      });
      record("opengrep", opengrepResultToProjectDiagnostics(analysisRoot, result), Date.now() - startMs, result.analyzed === true, result, laneObservedAtMs(result.scannedAt, startMs));
    }),
    // trivy — dependency CVE detection. Explicit opt-in per #131.
    task("trivy", async () => {
      if (!TrivyClient.shouldScan(analysisRoot)) {
        markCold("trivy", "not opted in (.pi-lens.json trivy.enabled) or no dependency manifest found");
        return;
      }
      if (!await clients.trivyClient.ensureAvailable()) {
        markCold("trivy", reasonFromAvailabilityVerdict("trivy", clients.trivyClient.getAvailabilityVerdict?.()));
        return;
      }
      const startMs = Date.now();
      const result = await clients.trivyClient.scan(analysisRoot);
      if (!result.success) {
        recordFailed("trivy", result);
        return;
      }
      cacheManager2.writeCache("trivy", result, analysisRoot, {
        scanDurationMs: Date.now() - startMs
      });
      record("trivy", trivyResultToProjectDiagnostics(analysisRoot, result), Date.now() - startMs, result.analyzed === true, result, laneObservedAtMs(result.scannedAt, startMs));
    }),
    // dead-code — cross-file dead-code for non-JS/TS languages (#127).
    // Each client self-gates via detect(); only matching-language projects
    // incur the whole-tree scan. Run the applicable ones in parallel too.
    task("dead-code", async () => {
      const applicable = clients.deadCodeClients.filter((c) => c.detect(analysisRoot));
      if (applicable.length === 0) {
        markCold("dead-code", "no dead-code client detected an applicable language for this project");
        return;
      }
      await Promise.all(applicable.map(async (client) => {
        const cacheKey = `dead-code-${client.id}`;
        const startMs = Date.now();
        const result = await client.analyze(analysisRoot);
        if (!result.success) {
          recordFailed("dead-code", result);
          return;
        }
        if (result.analyzed === true) {
          cacheManager2.writeCache(cacheKey, result, analysisRoot, {
            scanDurationMs: Date.now() - startMs
          });
        }
        const adapted = deadCodeResultToProjectDiagnostics(analysisRoot, result);
        record("dead-code", adapted, Date.now() - startMs, result.analyzed === true, result, laneObservedAtMs(result.scannedAt, startMs));
      }));
    }),
    // test-runner — CACHE-READ only, unlike every task above (#1004). Its
    // session cadence doesn't fit the "trigger-or-join a fresh run" shape the
    // rest of this module uses: the actual scan is the per-edit turn_end fire
    // in `runtime-turn.ts`, which only ever runs the (targeted, cascade-aware)
    // test files touched by THIS turn's edits — there is no "whole project"
    // test run to (re-)trigger here, and unconditionally spawning a full suite
    // on every mode=full call would be the exact "heavy re-run on every call"
    // cost this module's other tasks avoid via de-dupe/gating. So this task
    // instead peeks at the `"test-runner-findings"` cache turn_end already
    // wrote — the same cache key, the same adapter
    // (`testRunnerFindingsToProjectDiagnostics`), and the same cache-only
    // contract the pre-#585 `extractCachedProjectDiagnostics` registry's
    // "test-runner" row used (see extractors.ts's removal note) — before #585
    // dropped that reader without replacing this one row's semantics here.
    // Deliberately never calls `writeCache`: there is nothing fresher to write
    // back, only what turn_end already produced.
    //
    // No double-count / honesty gap (#533): explicit `pilens_turn_end`
    // delivery may call `consumeTestFindings` (`runtime-context.ts`) to
    // read-and-clear this SAME cache key once. Automatic Pi delivery uses a
    // non-context custom entry and never consumes this pull-diagnostics cache.
    // This task only ever reads (never clears) it, so it can't race that
    // consumption into re-delivering a message twice — at most it surfaces
    // the same underlying failures a second time, through a different
    // surface (the mode=full project snapshot) that was previously silently
    // empty for this analyzer. If `consumeTestFindings` already cleared the
    // cache before this runs, this task correctly sees nothing and reports
    // `cold` rather than inventing stale data.
    task("test-runner", async () => {
      const startMs = Date.now();
      const cached = cacheManager2.readCache("test-runner-findings", analysisRoot);
      if (!cached?.data) {
        markCold("test-runner", "no turn_end test-runner cache entry yet this session");
        return;
      }
      cachedAgeMs["test-runner"] = Date.now() - new Date(cached.meta.timestamp).getTime();
      record(
        "test-runner",
        testRunnerFindingsToProjectDiagnostics(cached.data, analysisRoot, options.runtime),
        Date.now() - startMs,
        // Never authoritative: this lane reads the cache turn_end wrote,
        // it never runs a suite over the root this call (#2154).
        false,
        void 0,
        // #3600: the batch's own launch stamp (`launchedFrom`), taken at
        // turn_end BEFORE the suite ran — the safe (at-or-before the read)
        // direction. `meta.timestamp` is the cache WRITE time, i.e. AFTER
        // the suite read its files, so an edit during the run would look
        // older than the row and escape the widget gate. A legacy entry
        // with no `launchedFrom` falls back to its write time, then to the
        // lane start, rather than dropping the row.
        laneObservedAtMs(cached.data.launchedFrom?.revision.capturedAt ?? cached.meta.timestamp, startMs)
      );
    })
  ];
  const allSettled = Promise.all(tasks).then(() => "completed").catch(() => "completed");
  const outcome = signal ? await Promise.race([
    allSettled,
    new Promise((resolve32) => {
      if (signal.aborted) {
        resolve32("aborted");
        return;
      }
      signal.addEventListener("abort", () => resolve32("aborted"), {
        once: true
      });
    })
  ]) : await allSettled;
  if (outcome === "aborted") {
    const abortedIds = ANALYZER_IDS.filter((id) => !settledIds.has(id));
    for (const id of abortedIds)
      pushUnique(cold, id);
    return {
      analysisRootValidation,
      diagnostics,
      runners,
      analyzed,
      authoritativeCoverage,
      cold,
      coldReasons,
      partial,
      partialReasons,
      failed,
      timings,
      cachedAgeMs,
      aborted: true,
      abortedIds,
      dispositionSuppressed,
      dispositionSuppressedByLane
    };
  }
  return {
    analysisRootValidation,
    diagnostics,
    runners,
    analyzed,
    authoritativeCoverage,
    cold,
    coldReasons,
    partial,
    partialReasons,
    failed,
    timings,
    cachedAgeMs,
    dispositionSuppressed,
    dispositionSuppressedByLane
  };
}

// dist/tools/scan-progress.js
function scanningSummaryLine(details, text) {
  const d = details;
  if (d?.phase !== "scanning")
    return null;
  return text || `Scanning\u2026 ${d.completed ?? 0}/${d.total ?? 0}`;
}
function renderScanProgress(completed, total, label = "Scanning project diagnostics") {
  const pct = total > 0 ? Math.min(100, Math.round(completed / total * 100)) : 0;
  const width = 20;
  const filled = Math.round(pct / 100 * width);
  const bar = "\u2588".repeat(filled) + "\u2591".repeat(Math.max(0, width - filled));
  return `${label}\u2026 [${bar}] ${completed}/${total} (${pct}%)`;
}
function makeProgressReporter(onUpdate, label, throttleMs = 250) {
  const emit = onUpdate;
  if (typeof emit !== "function")
    return void 0;
  let lastEmit = 0;
  return (completed, total) => {
    const now = Date.now();
    if (completed < total && now - lastEmit < throttleMs)
      return;
    lastEmit = now;
    emit({
      content: [
        { type: "text", text: renderScanProgress(completed, total, label) }
      ],
      details: { phase: "scanning", completed, total }
    });
  };
}

// dist/tools/lsp-diagnostics.js
import * as fs22 from "node:fs";
import * as path36 from "node:path";
var MAX_FILES = 100;
var MAX_BATCH_FILES = 100;
var MAX_DIAGNOSTICS = 200;
var DEFAULT_BATCH_CONCURRENCY = 8;
var MAX_BATCH_CONCURRENCY = 16;
var DEFAULT_BATCH_FILE_DEADLINE_MS = 15e3;
var SEVERITY_NAMES = {
  1: "error",
  2: "warning",
  3: "information",
  4: "hint"
};
var LSP_SEVERITY_FILTERS = [
  ...Object.values(SEVERITY_NAMES),
  "all"
];
function assertNeverBatchFileOutcome(value) {
  throw new Error(`Unhandled batch file outcome: ${String(value)}`);
}
function renderBatchOutcomeLines(outcomes, formatFile = (file) => file) {
  const lines = [];
  for (const outcome of outcomes) {
    switch (outcome.outcome) {
      case "too_large":
        lines.push(`${formatFile(outcome.file)}: ${outcome.reason ?? "file too large for LSP diagnostics"}`);
        break;
      case "clean":
      case "findings":
      case "unsupported":
      case "unavailable":
      case "failed":
      case "inconclusive":
        break;
      default:
        assertNeverBatchFileOutcome(outcome.outcome);
    }
  }
  return lines;
}
function batchFileDeadlineMs() {
  const raw = Number(process.env.PI_LENS_LSP_BATCH_FILE_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_BATCH_FILE_DEADLINE_MS;
}
function lspUnavailableMessage(filePath, health) {
  if (!health || !String(health.health ?? "").startsWith("no_clients")) {
    return void 0;
  }
  const candidates = health.candidateServerIds?.length ? ` candidates=${health.candidateServerIds.join(",")}` : "";
  const reason = (health.serverCountAttempted ?? 0) === 0 ? "no LSP server configured" : "no LSP client is currently ready";
  const stale = (health.mergedCount ?? 0) > 0 ? " Showing stale last-known diagnostics below." : " No diagnostics were collected.";
  return `LSP unavailable for ${filePath}: ${reason}; ready=${health.serverCountReady ?? 0}/${health.serverCountAttempted ?? 0}.${candidates}.${stale}`;
}
function boundedPositiveInt(value, fallback, min, max) {
  const parsed = typeof value === "number" ? Math.floor(value) : Number.NaN;
  if (!Number.isFinite(parsed))
    return fallback;
  return Math.max(min, Math.min(max, parsed));
}
function projectIgnorePredicate(root) {
  try {
    const matcher = getProjectIgnoreMatcher(root);
    return (fullPath, isDir) => matcher.isIgnored(fullPath, isDir);
  } catch {
    return () => false;
  }
}
async function collectFiles(dir, extensions, maxFiles, isIgnored = () => false) {
  const files = [];
  async function walk(current) {
    if (files.length >= maxFiles)
      return;
    let entries;
    try {
      entries = await fs22.promises.readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (files.length >= maxFiles)
        return;
      if (entry.isSymbolicLink())
        continue;
      const full = path36.join(current, entry.name);
      if (entry.isDirectory()) {
        if (!isExcludedDirName(entry.name) && !isIgnored(full, true))
          await walk(full);
      } else if (entry.isFile() && extensions.includes(path36.extname(full))) {
        if (isIgnored(full, false))
          continue;
        files.push(full);
      }
    }
  }
  await walk(dir);
  return files;
}
function createLspDiagnosticsTool(nextWriteIndex, onConfirmedNoBlockers, getService = getLSPService) {
  return {
    async execute(_toolCallId, params, _signal, onUpdate, ctx) {
      const signal = combineAbortSignals(_signal, ctx.signal);
      const onProgress = makeProgressReporter(onUpdate, "Scanning LSP diagnostics");
      const typedParams = params;
      const severity = typedParams.severity ?? "all";
      const cwd = ctx.cwd ?? process.cwd();
      const concurrency = boundedPositiveInt(typedParams.concurrency, DEFAULT_BATCH_CONCURRENCY, 1, MAX_BATCH_CONCURRENCY);
      const waitMs = typeof typedParams.waitMs === "number" && typedParams.waitMs >= 0 ? Math.floor(typedParams.waitMs) : void 0;
      const serverScope = typedParams.serverScope === "primary" ? "primary" : "all";
      const lspService = getService();
      if (!lspService) {
        return {
          content: [
            { type: "text", text: "LSP service not available." }
          ],
          isError: true,
          details: {}
        };
      }
      if (Array.isArray(typedParams.paths) && typedParams.paths.length > 0) {
        if (typedParams.paths.length > MAX_BATCH_FILES) {
          return {
            content: [
              {
                type: "text",
                text: `paths accepts at most ${MAX_BATCH_FILES} files; received ${typedParams.paths.length}.`
              }
            ],
            isError: true,
            details: { mode: "batch", filesChecked: 0 }
          };
        }
        const rawPaths = typedParams.paths.filter((entry) => typeof entry === "string" && entry.trim().length > 0);
        if (rawPaths.length !== typedParams.paths.length) {
          return {
            content: [
              {
                type: "text",
                text: "paths must contain non-empty file paths."
              }
            ],
            isError: true,
            details: { mode: "batch", filesChecked: 0 }
          };
        }
        const expanded = await expandPathsToFiles(cwd, rawPaths);
        if (expanded.files.length === 0) {
          const { listed, text } = describeDirectoriesWithoutFiles(expanded.directoriesWithoutFiles);
          return {
            content: [{ type: "text", text }],
            details: {
              mode: "batch",
              severity,
              filesChecked: 0,
              directoriesWithoutFiles: listed
            }
          };
        }
        return runBatchFileDiagnostics(expanded.files, severity, lspService, {
          concurrency,
          waitMs,
          signal,
          onProgress,
          nextWriteIndex,
          serverScope,
          cwd,
          onConfirmedNoBlockers
        }, expanded);
      }
      const rawPath = typedParams.path;
      if (!rawPath || rawPath.trim().length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "path or paths is required."
            }
          ],
          isError: true,
          details: {}
        };
      }
      const absPath = normalizeMapKey(path36.resolve(cwd, rawPath));
      let stat;
      try {
        stat = fs22.statSync(absPath);
      } catch {
        return {
          content: [
            { type: "text", text: `Path not found: ${absPath}` }
          ],
          isError: true,
          details: {}
        };
      }
      if (stat.isDirectory()) {
        return runDirectoryDiagnostics(absPath, severity, lspService, {
          concurrency,
          waitMs,
          signal,
          onProgress,
          nextWriteIndex,
          serverScope,
          cwd,
          onConfirmedNoBlockers
        });
      }
      return runFileDiagnostics(absPath, severity, lspService, waitMs, nextWriteIndex, serverScope, cwd, onConfirmedNoBlockers);
    }
  };
}
async function collectDiagnosticsForFile(absPath, lspService, scanRoot, waitMs, serverScope = "all") {
  let timedOut = false;
  let content;
  let touched;
  try {
    content = fs22.readFileSync(absPath, "utf-8");
    const contentLimit = exceedsLspSyncLimits(content);
    if (contentLimit.tooLarge) {
      const reason = `file too large for LSP diagnostics (${contentLimit.reason})`;
      recordDegradationOnce({
        kind: "lsp-diagnostics-file-too-large",
        subject: absPath,
        reason
      });
      return {
        diagnostics: [],
        timedOut: false,
        confirmedByTouch: false,
        unconfirmedServerIds: [],
        diagnosticsUnsupportedServerIds: [],
        content,
        tooLargeReason: reason
      };
    }
    if (isWarmAttached()) {
      const attachedBudgetMs = waitMs ?? 15e3;
      const attached = await tryWarmAttachedDiagnostics(absPath, content, attachedBudgetMs, "sweep");
      if (attached?.available) {
        const scopedDiagnostics = serverScope === "primary" ? attached.response.diagnostics.filter((item) => item.serverId === primaryServerId(absPath)) : attached.response.diagnostics;
        const filtered2 = applyAuxiliarySuppressions(scopedDiagnostics, content, {
          fileRole: detectFileRole(absPath, content),
          filePath: absPath,
          scanRoot
        });
        return {
          diagnostics: filtered2,
          timedOut: false,
          // #1253: the incumbent's touch carries the same confirmation
          // provenance a local touch does (an `available: true` answer is
          // already gated on `fresh && !inconclusive`, but that is NOT
          // evidence a silent-on-clean server was confirmed — only the
          // explicit flag is). The incumbent always touches with
          // `clientScope: "with-auxiliary"`, so this is an AGGREGATE
          // confirmation: it carries the same caveat all-scope local
          // touches do, and classic TypeScript still needs the primary-only
          // tsserver sync check below rather than this verdict.
          // #1470: `"partial"` counts, for the same reason the local touch
          // branch below accepts it — the incumbent's primary confirmed; only
          // a named auxiliary did not.
          confirmedByTouch: attached.response.confirmation !== void 0 && primaryServerId(absPath) !== "typescript",
          // #1470: the incumbent's narrowed verdict, carried as an explicit DTO
          // field across the socket. An older incumbent omits it → empty → the
          // pre-#1470 handling, unchanged.
          unconfirmedServerIds: attached.response.unconfirmedServerIds ?? [],
          diagnosticsUnsupportedServerIds: [],
          content
        };
      }
    }
    touched = await lspService.touchFile(absPath, content, {
      diagnostics: "document",
      collectDiagnostics: true,
      maxClientWaitMs: waitMs,
      source: "lsp_diagnostics",
      clientScope: serverScope,
      // #3405: the caller asked whether THIS file is clean right now, and the
      // content above was just read from disk — so it is the file's saved
      // state. Without the save a save-triggered server answers zero
      // diagnostics for every file in the query, which this path would report
      // as clean.
      saved: true
    });
    timedOut = touched?.inconclusive === true;
  } catch {
  }
  const diagnostics = touched !== void 0 ? touched.diags : await lspService.getDiagnostics(absPath, waitMs !== void 0 ? "document" : "full");
  const filtered = content !== void 0 ? applyAuxiliarySuppressions(diagnostics, content, {
    fileRole: detectFileRole(absPath, content),
    filePath: absPath,
    scanRoot
  }) : diagnostics;
  const binding = touched?.binding;
  const confirmedByTouch = touchCompletedConfirmationPolicy(touched);
  return {
    diagnostics: filtered,
    timedOut,
    skipReason: touched?.skipReason,
    confirmedByTouch,
    // #1470: only a touch that resolved clients contributes a coverage gap;
    // the getDiagnostics fallback never reports one, which is honest — that
    // path claims no confirmation at all.
    unconfirmedServerIds: touchCoverageGap(touched),
    diagnosticsUnsupportedServerIds: touched?.diagnosticsUnsupportedServerIds ?? [],
    content,
    binding
  };
}
function diagnosticsToFileDiags(file, diagnostics) {
  return diagnostics.map((d) => ({
    file,
    line: d.range?.start?.line,
    character: d.range?.start?.character,
    severity: d.severity,
    message: d.message,
    source: d.source,
    serverId: d.serverId,
    code: d.code
  }));
}
async function classifyEmptyResult(file, lspService) {
  try {
    const snapshots = await lspService.getCapabilitySnapshots(file);
    const tier = classifyCascadeWaitTier(lspService, file, snapshots);
    return tier === "tier3-silent" ? "unconfirmed" : "clean";
  } catch {
    return "clean";
  }
}
async function primaryRootFallback(file, cwd) {
  const seen = [];
  await resolveLspCwdForFile(file, cwd, (fallback) => seen.push(fallback));
  return seen.find((fallback) => fallback.requiresProjectRoot);
}
async function resolveEmptyResult(file, lspService) {
  try {
    const snapshots = await lspService.getCapabilitySnapshots(file);
    const tier = classifyCascadeWaitTier(lspService, file, snapshots);
    if (tier !== "tier3-silent") {
      return { confirmed: true, diagnostics: [] };
    }
    const syncDiagnostics = await attemptTsserverSyncDiagnostics(file, lspService);
    if (syncDiagnostics === void 0) {
      return { confirmed: false, diagnostics: [] };
    }
    return { confirmed: true, diagnostics: syncDiagnostics };
  } catch {
    return { confirmed: true, diagnostics: [] };
  }
}
function canTrustTouchConfirmation(file, serverScope, confirmedByTouch) {
  return confirmedByTouch && (serverScope === "primary" || primaryServerId(file) !== "typescript");
}
function coveredSourcesForCheck(file, serverScope, unconfirmedServerIds) {
  const unconfirmed = new Set(unconfirmedServerIds);
  const covered = /* @__PURE__ */ new Set();
  let servers = [];
  try {
    servers = getServersForFileWithConfig(file) ?? [];
  } catch {
    return [];
  }
  for (const server of servers) {
    const auxiliary = isAuxiliary(server);
    if (auxiliary && serverScope === "primary")
      continue;
    if (unconfirmed.has(server.id))
      continue;
    covered.add(auxiliary ? server.id : "lsp");
  }
  return [...covered];
}
function demoteInferredForFile(file, diagnostics, cwd, lspService) {
  return demoteInferredProjectDiagnostics(diagnostics, {
    filePath: file,
    cwd,
    service: lspService
  });
}
function applyProbeFindingPolicy(file, diagnostics, cwd, content, severity) {
  const started = Date.now();
  try {
    const result = applyLspFindingPolicy(diagnostics, {
      cwd,
      filePath: file,
      content,
      policyMap: loadProjectRulePolicyMap(cwd),
      fileRole: detectFileRole(file, content)
    });
    const inScopeBefore = applySeverityFilter(diagnostics, severity).length;
    const suppressed = inScopeBefore - applySeverityFilter(result.kept, severity).length;
    if (suppressed > 0) {
      logLatency({
        type: "phase",
        toolName: "lsp_diagnostics",
        filePath: file,
        phase: "lsp_probe_disposition_filter",
        durationMs: Date.now() - started,
        metadata: {
          suppressed,
          total: inScopeBefore,
          retainedSuppressed: countRetainedSuppressedRows(file)
        }
      });
    }
    return { kept: result.kept, inlineKept: result.inlineKept, suppressed };
  } catch (err) {
    recordDegradationOnce({
      kind: "lsp-probe-finding-policy",
      subject: cwd,
      reason: err instanceof Error ? err.message : String(err)
    });
    return { kept: diagnostics, inlineKept: diagnostics, suppressed: 0 };
  }
}
function replayContentForStrictMarks(file, cwd) {
  if (!hasStrictDispositionMarks(cwd))
    return void 0;
  try {
    return fs22.readFileSync(file, "utf-8");
  } catch {
    return void 0;
  }
}
function reconcileWidgetFromLspResult(file, rawDiags, confirmation, writeIndex, cwd, content, boundMismatch = false, observedAt) {
  const confirmed = (rawDiags.length > 0 || confirmation !== "unconfirmed") && !boundMismatch;
  if (!confirmed)
    return { confirmed: false, blocking: true };
  try {
    const diagnostics = convertLspDiagnostics(rawDiags, file, {
      scanOrigin: "lsp_diagnostics"
    });
    const retagged = retagAuxiliaryDiagnostics(diagnostics, rawDiags, content ?? "", { cwd, fileRole: detectFileRole(file, content) });
    const reconciled = reconcileScanDiagnostics(file, retagged, true, writeIndex, observedAt);
    if (!reconciled)
      return { confirmed: false, blocking: true };
    return { confirmed: true, blocking: retagged.some(isBlocking) };
  } catch {
    return { confirmed: false, blocking: true };
  }
}
async function collectFileDiagnosticResult(file, severity, lspService, waitMs, nextWriteIndex, serverScope = "all", cacheCtx, scopeKey, cwd = process.cwd(), onConfirmedNoBlockers) {
  const writeIndex = nextWriteIndex?.();
  const scannedAt = Date.now();
  let stat;
  try {
    stat = fs22.statSync(file);
    if (!stat.isFile()) {
      return { file, diagnostics: [], error: `${file}: not a file` };
    }
  } catch {
    return { file, diagnostics: [], error: `${file}: path not found` };
  }
  if (cacheCtx && scopeKey !== void 0) {
    const cached = cacheCtx.lookup(file, scopeKey);
    if (cached && cached.binding.boundToCurrentDisk !== false) {
      const confirmation2 = cached.diagnostics.length === 0 ? "clean" : void 0;
      const demotedCached = await demoteInferredForFile(file, cached.diagnostics, cwd, lspService);
      const cachedPolicy = applyProbeFindingPolicy(file, demotedCached, cwd, replayContentForStrictMarks(file, cwd), severity);
      const cachedDiags = cachedPolicy.kept;
      const filteredDiags2 = applySeverityFilter(cachedDiags, severity);
      reconcileWidgetFromLspResult(
        file,
        cachedDiags,
        confirmation2,
        writeIndex,
        cwd,
        void 0,
        // This branch only runs when the cache binding is not a mismatch
        // (guarded above), so boundMismatch is false; #1093's observedAt is
        // the cache entry's original scan time.
        false,
        cached.scannedAt
      );
      return {
        file,
        diagnostics: diagnosticsToFileDiags(file, filteredDiags2),
        confirmation: confirmation2,
        primaryServerId: primaryServerId(file),
        ...cachedPolicy.suppressed > 0 && {
          dispositionSuppressed: cachedPolicy.suppressed
        }
      };
    }
  }
  const { diagnostics: rawDiags, timedOut, confirmedByTouch, unconfirmedServerIds, diagnosticsUnsupportedServerIds, content: collectedContent, binding, tooLargeReason, skipReason } = await collectDiagnosticsForFile(file, lspService, cwd, waitMs, serverScope);
  if (tooLargeReason !== void 0) {
    return { file, diagnostics: [], outcome: "too_large", tooLargeReason };
  }
  const health = lspService.getDiagnosticsHealth?.(file);
  let effectiveRawDiags = rawDiags;
  let confirmation;
  if (diagnosticsUnsupportedServerIds.length > 0) {
    confirmation = void 0;
  } else if (skipReason !== void 0) {
    confirmation = "unconfirmed";
  } else if (timedOut) {
    if (applySeverityFilter(rawDiags, severity).length === 0) {
      confirmation = "unconfirmed";
    }
  } else if (canTrustTouchConfirmation(file, serverScope, confirmedByTouch)) {
    if (applySeverityFilter(rawDiags, severity).length === 0) {
      confirmation = "clean";
    }
  } else if (rawDiags.length === 0) {
    const resolved = await resolveEmptyResult(file, lspService);
    effectiveRawDiags = resolved.diagnostics;
    confirmation = resolved.confirmed ? resolved.diagnostics.length === 0 ? "clean" : void 0 : "unconfirmed";
  } else if (applySeverityFilter(rawDiags, severity).length === 0) {
    confirmation = await classifyEmptyResult(file, lspService);
  }
  const boundMismatch = binding?.boundToCurrentDisk === false;
  if (boundMismatch)
    confirmation = "unconfirmed";
  const rootFallback = confirmation === "clean" ? await primaryRootFallback(file, cwd) : void 0;
  if (rootFallback)
    confirmation = "unconfirmed";
  if (unconfirmedServerIds.length > 0 && confirmation === "clean") {
    confirmation = "unconfirmed";
  }
  effectiveRawDiags = await demoteInferredForFile(file, effectiveRawDiags, cwd, lspService);
  const policy = applyProbeFindingPolicy(file, effectiveRawDiags, cwd, collectedContent, severity);
  effectiveRawDiags = policy.kept;
  const filteredDiags = applySeverityFilter(effectiveRawDiags, severity);
  const verdict = reconcileWidgetFromLspResult(
    file,
    effectiveRawDiags,
    confirmation,
    writeIndex,
    cwd,
    collectedContent,
    boundMismatch,
    // #3505 r1 F1: the widget row is observed at the read, as the cache
    // entry recorded below is.
    scannedAt
  );
  if (verdict.confirmed && !verdict.blocking) {
    onConfirmedNoBlockers?.({
      filePath: file,
      writeIndex,
      coveredSources: coveredSourcesForCheck(file, serverScope, unconfirmedServerIds),
      cwd
    });
  }
  if (cacheCtx && scopeKey !== void 0 && confirmation !== "unconfirmed" && diagnosticsUnsupportedServerIds.length === 0 && unconfirmedServerIds.length === 0) {
    cacheCtx.record(file, scopeKey, policy.inlineKept, stat.mtimeMs, collectedContent !== void 0 ? hashDiagnosticContent(collectedContent) : void 0, stat.size, scannedAt);
  }
  return {
    file,
    diagnostics: diagnosticsToFileDiags(file, filteredDiags),
    unavailable: lspUnavailableMessage(file, health),
    confirmation,
    timedOut: confirmation === "unconfirmed" ? timedOut : void 0,
    ...rootFallback && { rootFallback },
    ...skipReason !== void 0 && { skipReason },
    primaryServerId: primaryServerId(file),
    diagnosticsUnsupported: diagnosticsUnsupportedServerIds.length > 0,
    ...policy.suppressed > 0 && {
      dispositionSuppressed: policy.suppressed
    }
  };
}
async function runFileDiagnostics(absPath, severity, lspService, waitMs, nextWriteIndex, serverScope = "all", cwd = process.cwd(), onConfirmedNoBlockers) {
  const writeIndex = nextWriteIndex?.();
  const observedAt = Date.now();
  const { diagnostics: rawDiags, timedOut, confirmedByTouch, unconfirmedServerIds, diagnosticsUnsupportedServerIds, content: collectedContent, binding, tooLargeReason, skipReason } = await collectDiagnosticsForFile(absPath, lspService, cwd, waitMs, serverScope);
  if (tooLargeReason !== void 0) {
    return {
      content: [{ type: "text", text: tooLargeReason }],
      details: {
        filePath: absPath,
        mode: "file",
        severity,
        serverScope,
        outcome: "too_large",
        tooLargeReason,
        diagnostics: [],
        totalDiagnostics: 0
      }
    };
  }
  const lspHealth = lspService.getDiagnosticsHealth?.(absPath);
  const unavailable = lspUnavailableMessage(absPath, lspHealth);
  let effectiveRawDiags = rawDiags;
  let confirmation;
  if (diagnosticsUnsupportedServerIds.length > 0) {
    confirmation = void 0;
  } else if (skipReason !== void 0) {
    confirmation = "unconfirmed";
  } else if (timedOut) {
    if (applySeverityFilter(rawDiags, severity).length === 0) {
      confirmation = "unconfirmed";
    }
  } else if (canTrustTouchConfirmation(absPath, serverScope, confirmedByTouch)) {
    if (applySeverityFilter(rawDiags, severity).length === 0) {
      confirmation = "clean";
    }
  } else if (rawDiags.length === 0) {
    const resolved = await resolveEmptyResult(absPath, lspService);
    effectiveRawDiags = resolved.diagnostics;
    confirmation = resolved.confirmed ? resolved.diagnostics.length === 0 ? "clean" : void 0 : "unconfirmed";
  } else if (applySeverityFilter(rawDiags, severity).length === 0) {
    confirmation = await classifyEmptyResult(absPath, lspService);
  }
  const boundMismatch = binding?.boundToCurrentDisk === false;
  if (boundMismatch)
    confirmation = "unconfirmed";
  const rootFallback = confirmation === "clean" ? await primaryRootFallback(absPath, cwd) : void 0;
  if (rootFallback)
    confirmation = "unconfirmed";
  const primaryCoverageGapOnly = unconfirmedServerIds.length > 0 && confirmation === "clean";
  if (primaryCoverageGapOnly)
    confirmation = "unconfirmed";
  effectiveRawDiags = await demoteInferredForFile(absPath, effectiveRawDiags, cwd, lspService);
  const policy = applyProbeFindingPolicy(absPath, effectiveRawDiags, cwd, collectedContent, severity);
  effectiveRawDiags = policy.kept;
  const filtered = applySeverityFilter(effectiveRawDiags, severity);
  const total = filtered.length;
  const truncated = total > MAX_DIAGNOSTICS;
  const limited = truncated ? filtered.slice(0, MAX_DIAGNOSTICS) : filtered;
  const unconfirmed = confirmation === "unconfirmed";
  const verdict = reconcileWidgetFromLspResult(absPath, effectiveRawDiags, confirmation, writeIndex, cwd, collectedContent, boundMismatch, observedAt);
  if (verdict.confirmed && !verdict.blocking) {
    onConfirmedNoBlockers?.({
      filePath: absPath,
      writeIndex,
      coveredSources: coveredSourcesForCheck(absPath, serverScope, unconfirmedServerIds),
      cwd
    });
  }
  const primaryId = primaryServerId(absPath);
  const primaryDiags = limited.filter((d) => d.serverId === primaryId);
  const auxiliaryDiags = limited.filter((d) => d.serverId !== primaryId);
  const primaryLine = (() => {
    if (diagnosticsUnsupportedServerIds.length > 0) {
      return `Primary LSP${primaryId ? ` (${primaryId})` : ""}: navigation-only \u2014 diagnostics unsupported (no pull provider or publish evidence).`;
    }
    if (timedOut) {
      return "Primary LSP: check timed out \u2014 NOT the same as 0 diagnostics; the file may still have errors that just hadn't been reported yet. Re-check after the server settles, or increase waitMs.";
    }
    if (rootFallback) {
      return `Primary LSP${primaryId ? ` (${primaryId})` : ""}: unconfirmed \u2014 ${describeRootFallback(rootFallback)}. NOT the same as 0 diagnostics; check the file from inside its project and re-run.`;
    }
    if (unconfirmed && !primaryCoverageGapOnly) {
      return `Primary LSP${primaryId ? ` (${primaryId})` : ""}: unconfirmed \u2014 cannot confirm clean (push-only, silent-on-clean, e.g. classic typescript-language-server never publishes on a clean re-check). NOT the same as 0 diagnostics; re-check after an edit, or use waitMs to wait longer.`;
    }
    if (primaryDiags.length === 0) {
      return `Primary LSP${primaryId ? ` (${primaryId})` : ""}: confirmed clean.`;
    }
    return `Primary LSP${primaryId ? ` (${primaryId})` : ""}: ${primaryDiags.length} diagnostic${primaryDiags.length === 1 ? "" : "s"}.`;
  })();
  const coverageLine = unconfirmedServerIds.length > 0 ? `Auxiliary coverage INCOMPLETE \u2014 ${[...unconfirmedServerIds].join(", ")} did not answer within the wait budget, so ${unconfirmedServerIds.length === 1 ? "its findings are" : "their findings are"} NOT included here. This is not a clean bill of health for ${unconfirmedServerIds.length === 1 ? "that scanner" : "those scanners"}; re-check after the next edit. waitMs can extend an ordinary wait, but it cannot override a session-demoted scanner.` : void 0;
  const suppressedLine = dispositionSuppressedLine(policy.suppressed);
  let text;
  if (total === 0) {
    text = [
      primaryLine,
      "",
      unavailable ?? "No auxiliary findings.",
      ...coverageLine ? [coverageLine] : [],
      ...suppressedLine ? [suppressedLine] : []
    ].join("\n");
  } else {
    const lines = [primaryLine, ""];
    if (primaryDiags.length > 0) {
      lines.push(...primaryDiags.map(formatDiag), "");
    }
    if (auxiliaryDiags.length > 0) {
      lines.push(`Auxiliary findings (${auxiliaryDiags.length}):`);
      lines.push(...auxiliaryDiags.map(formatDiag));
    }
    if (coverageLine)
      lines.push("", coverageLine);
    if (suppressedLine)
      lines.push("", suppressedLine);
    if (unavailable)
      lines.unshift(unavailable, "");
    if (truncated) {
      lines.unshift(`Found ${total} diagnostics (showing first ${MAX_DIAGNOSTICS}):`);
    }
    text = lines.join("\n");
  }
  return {
    content: [{ type: "text", text }],
    details: {
      filePath: absPath,
      mode: "file",
      severity,
      serverScope,
      ...unavailable ? { unavailable } : {},
      primaryServerId: primaryId,
      primaryDiagnosticsCount: primaryDiags.length,
      auxiliaryDiagnosticsCount: auxiliaryDiags.length,
      diagnostics: limited.map((d) => ({
        line: d.range?.start?.line,
        character: d.range?.start?.character,
        severity: d.severity,
        message: d.message,
        source: d.source,
        code: d.code
      })),
      totalDiagnostics: total,
      ...policy.suppressed > 0 && {
        dispositionSuppressed: policy.suppressed
      },
      truncated,
      unconfirmed,
      timedOut: unconfirmed ? timedOut : void 0,
      navigationOnlyFiles: diagnosticsUnsupportedServerIds.length > 0 ? 1 : void 0,
      ...skipReason !== void 0 && { skipReason },
      ...rootFallback && {
        rootFallbackReason: describeRootFallback(rootFallback)
      },
      // #1470: which servers this result does NOT speak for. Absent when it
      // speaks for all of them.
      ...unconfirmedServerIds.length > 0 && {
        unconfirmedServerIds: [...unconfirmedServerIds]
      },
      lspHealth,
      waitMs
    }
  };
}
function tallyConfirmation(results) {
  let clean = 0;
  let unconfirmed = 0;
  let timedOut = 0;
  const rootFallbackReasons = /* @__PURE__ */ new Set();
  let navigationOnly = 0;
  let tooLarge = 0;
  for (const result of results) {
    if (result.tooLargeReason) {
      tooLarge += 1;
      continue;
    }
    if (result.diagnosticsUnsupported) {
      navigationOnly += 1;
      continue;
    }
    if (result.diagnostics.length > 0)
      continue;
    if (result.confirmation === "unconfirmed") {
      unconfirmed += 1;
      if (result.timedOut)
        timedOut += 1;
      if (result.rootFallback) {
        rootFallbackReasons.add(describeRootFallback(result.rootFallback));
      }
    } else if (classifyBatchFileOutcome(result) === "clean") {
      clean += 1;
    }
  }
  return {
    clean,
    unconfirmed,
    timedOut,
    rootFallbackReasons: [...rootFallbackReasons],
    navigationOnly,
    tooLarge
  };
}
function classifyBatchFileOutcome(result) {
  if (result.error)
    return "failed";
  if (result.tooLargeReason)
    return "too_large";
  if (result.diagnosticsUnsupported)
    return "unsupported";
  if (result.timedOut || result.confirmation === "unconfirmed") {
    return "inconclusive";
  }
  if (result.diagnostics.length > 0)
    return "findings";
  if (result.unavailable) {
    return result.primaryServerId ? "unavailable" : "unsupported";
  }
  if (!result.primaryServerId)
    return "unsupported";
  return "clean";
}
function inconclusiveBatchResult(file, reason) {
  return {
    file,
    diagnostics: [],
    confirmation: "unconfirmed",
    timedOut: true,
    outcome: "inconclusive",
    inconclusiveReason: reason
  };
}
function unconfirmedReasonClause(unconfirmed, timedOut, rootFallbackReasons = []) {
  if (rootFallbackReasons.length > 0) {
    return `${rootFallbackReasons.join("; ")} (${unconfirmed} unconfirmed in all).`;
  }
  const silent = unconfirmed - timedOut;
  if (timedOut > 0 && silent > 0) {
    return `${timedOut} timed out (check didn't complete within budget) and ${silent} from a server that cannot confirm clean (push-only, silent-on-clean).`;
  }
  if (timedOut > 0) {
    return `${timedOut} timed out (check didn't complete within the wait budget).`;
  }
  return "from a server that cannot confirm clean (push-only, silent-on-clean; e.g. classic typescript-language-server does not publish on a clean re-check).";
}
async function collectBatchDiagnostics(files, severity, lspService, options) {
  const resolvedCwd = options.cwd ?? process.cwd();
  const cacheCtx = createWorkspaceDiagnosticsCacheContext(resolvedCwd);
  const scopeKey = buildScopeKey(options.serverScope ?? "all");
  const resultsByIndex = /* @__PURE__ */ new Map();
  let completed = 0;
  const pendingIndices = /* @__PURE__ */ new Map();
  files.forEach((file, index) => {
    const queue = pendingIndices.get(file);
    if (queue)
      queue.push(index);
    else
      pendingIndices.set(file, [index]);
  });
  const groups = groupFilesByPrimaryServer(files);
  await runPerServerGroups(groups, options.concurrency, async (group) => {
    if (options.signal?.aborted)
      return;
    const first = group.files[0];
    if (first && lspService && !isWarmAttached() && typeof lspService.ensureWarmForSweep === "function") {
      await lspService.ensureWarmForSweep(first, {
        signal: options.signal
      });
      if (options.signal?.aborted)
        return;
    }
    await mapWithConcurrency(group.files, 1, async (file) => {
      const index = pendingIndices.get(file).shift();
      const work = collectFileDiagnosticResult(file, severity, lspService, options.waitMs, options.nextWriteIndex, options.serverScope, cacheCtx, scopeKey, resolvedCwd, options.onConfirmedNoBlockers);
      const bounded2 = withDeadline(work, {
        ms: batchFileDeadlineMs(),
        onTimeout: "undefined",
        onReject: "undefined"
      });
      const result = options.signal ? await Promise.race([
        bounded2,
        new Promise((resolve32) => {
          if (options.signal?.aborted) {
            resolve32(void 0);
            return;
          }
          options.signal?.addEventListener("abort", () => resolve32(void 0), {
            once: true
          });
        })
      ]) : await bounded2;
      resultsByIndex.set(index, result ?? inconclusiveBatchResult(file, options.signal?.aborted ? "Batch aborted before this file completed." : `File check exceeded ${batchFileDeadlineMs()}ms.`));
      completed += 1;
      options.onProgress?.(completed, files.length);
    }, options.signal);
  }, options.signal);
  const results = [...resultsByIndex.entries()].sort(([left], [right]) => left - right).map(([, result]) => result);
  cacheCtx.persist();
  const fileErrors = results.flatMap((result) => result.error ? [result.error] : []);
  const lspHealthWarnings = results.flatMap((result) => result.unavailable ? [result.unavailable] : []);
  const allDiags = results.flatMap((result) => result.diagnostics);
  const total = allDiags.length;
  const truncated = total > MAX_DIAGNOSTICS;
  const display = truncated ? allDiags.slice(0, MAX_DIAGNOSTICS) : allDiags;
  const { clean, unconfirmed, timedOut, rootFallbackReasons } = tallyConfirmation(results);
  for (const result of results) {
    result.outcome = classifyBatchFileOutcome(result);
  }
  const outcomeCounts = Object.fromEntries([
    "clean",
    "findings",
    "unsupported",
    "unavailable",
    "failed",
    "too_large",
    "inconclusive"
  ].map((outcome) => [
    outcome,
    results.filter((result) => result.outcome === outcome).length
  ]));
  const primaryIdByFile = new Map(results.map((r) => [r.file, r.primaryServerId]));
  const primaryDisplay = display.filter((d) => d.serverId === primaryIdByFile.get(d.file));
  const auxiliaryDisplay = display.filter((d) => d.serverId !== primaryIdByFile.get(d.file));
  return {
    results,
    fileErrors,
    lspHealthWarnings,
    total,
    truncated,
    display,
    primaryDisplay,
    auxiliaryDisplay,
    clean,
    unconfirmed,
    timedOut,
    rootFallbackReasons,
    outcomeCounts,
    incompleteFiles: Math.max(0, files.length - results.length)
  };
}
async function expandPathsToFiles(cwd, rawPaths) {
  const explicitFiles = [];
  const directories = [];
  const seenFileKeys = /* @__PURE__ */ new Set();
  for (const entry of rawPaths) {
    const abs = normalizeMapKey(path36.resolve(cwd, entry));
    let stat;
    try {
      stat = fs22.statSync(abs);
    } catch {
    }
    if (stat?.isDirectory()) {
      directories.push(abs);
    } else {
      explicitFiles.push(abs);
      seenFileKeys.add(abs);
    }
  }
  const files = [...explicitFiles];
  const directoriesWithoutFiles = [];
  let capped = false;
  for (const directory of directories) {
    const collected = await collectDirectoryScanFiles(directory, MAX_FILES - files.length, seenFileKeys);
    capped ||= collected.capped;
    if (collected.eligible === 0)
      directoriesWithoutFiles.push(directory);
    for (const file of collected.files) {
      const key = normalizeMapKey(file);
      seenFileKeys.add(key);
      files.push(key);
    }
  }
  if (capped) {
    recordDegradationOnce({
      kind: "lsp-diagnostics-paths-cap",
      subject: cwd,
      reason: `paths directory expansion reached the ${MAX_FILES}-file cap; later entries were not checked`
    });
  }
  return { files, directoriesWithoutFiles, capped };
}
async function runBatchFileDiagnostics(absPaths, severity, lspService, options, scan = { capped: false, directoriesWithoutFiles: [] }) {
  const { capped, directoriesWithoutFiles } = scan;
  if (absPaths.length === 0) {
    return {
      content: [{ type: "text", text: "No file paths provided." }],
      isError: true,
      details: { mode: "batch", severity, filesChecked: 0 }
    };
  }
  const { results, fileErrors, lspHealthWarnings, total, truncated, display, primaryDisplay, auxiliaryDisplay, clean, unconfirmed, timedOut, rootFallbackReasons, outcomeCounts, incompleteFiles } = await collectBatchDiagnostics(absPaths, severity, lspService, options);
  const navigationOnly = results.filter((result) => result.diagnosticsUnsupported).length;
  const dispositionSuppressed = results.reduce((sum, result) => sum + (result.dispositionSuppressed ?? 0), 0);
  const lines = [
    `Files checked: ${results.length}${capped ? ` (capped at ${MAX_FILES})` : ""}`,
    `Total diagnostics: ${total}`,
    `Concurrency: ${options.concurrency}`
  ];
  if (options.waitMs !== void 0)
    lines.push(`Wait budget: ${options.waitMs}ms`);
  lines.push(`Outcomes: ${Object.entries(outcomeCounts).map(([outcome, count]) => `${outcome}=${count}`).join(", ")}`);
  const { listed: emptyListed, text: emptyText } = describeDirectoriesWithoutFiles(directoriesWithoutFiles);
  if (directoriesWithoutFiles.length > 0)
    lines.push("", emptyText);
  const notConfirmed = outcomeCounts.inconclusive + outcomeCounts.unavailable + outcomeCounts.unsupported + outcomeCounts.failed + outcomeCounts.too_large + incompleteFiles;
  if (notConfirmed > 0) {
    lines.push("", `Checks not confirmed: ${notConfirmed} (inconclusive/unavailable/unsupported/failed or not started).`);
  }
  if (incompleteFiles > 0) {
    lines.push("", `Batch incomplete: ${incompleteFiles} file${incompleteFiles === 1 ? "" : "s"} were not confirmed because the batch was aborted.`);
  }
  if (fileErrors.length > 0)
    lines.push("", "File errors:", ...fileErrors);
  const outcomeDetails = results.map((result) => ({
    file: result.file,
    outcome: result.outcome,
    reason: result.tooLargeReason ?? result.inconclusiveReason ?? result.error ?? result.unavailable
  }));
  const tooLargeLines = renderBatchOutcomeLines(outcomeDetails);
  if (tooLargeLines.length > 0) {
    lines.push("", "Files too large for LSP diagnostics:", ...tooLargeLines);
  }
  if (lspHealthWarnings.length > 0) {
    lines.push("", "LSP health warnings:", ...lspHealthWarnings.slice(0, 10));
  }
  if (unconfirmed > 0) {
    lines.push("", `${clean} file${clean === 1 ? "" : "s"} confirmed clean, ${unconfirmed} unconfirmed: ${unconfirmedReasonClause(unconfirmed, timedOut, rootFallbackReasons)} NOT the same as 0 diagnostics.`);
  }
  if (display.length === 0) {
    if (unconfirmed === 0 && outcomeCounts.clean === results.length) {
      lines.push("", "No diagnostics found.");
    }
  } else {
    if (primaryDisplay.length > 0) {
      lines.push("", `Primary findings (${primaryDisplay.length}):`);
      lines.push(...primaryDisplay.map(formatDisplayDiag));
    }
    if (auxiliaryDisplay.length > 0) {
      lines.push("", `Auxiliary findings (${auxiliaryDisplay.length}):`);
      lines.push(...auxiliaryDisplay.map(formatDisplayDiag));
    }
    if (truncated) {
      lines.push("", `... (${total - MAX_DIAGNOSTICS} more diagnostics not shown)`);
    }
  }
  const suppressedLine = dispositionSuppressedLine(dispositionSuppressed);
  if (suppressedLine)
    lines.push("", suppressedLine);
  return {
    content: [{ type: "text", text: lines.join("\n") }],
    details: {
      mode: "batch",
      severity,
      serverScope: options.serverScope ?? "all",
      filesChecked: results.length,
      ...capped ? { capped: true } : {},
      ...directoriesWithoutFiles.length > 0 ? { directoriesWithoutFiles: emptyListed } : {},
      concurrency: options.concurrency,
      waitMs: options.waitMs,
      diagnostics: display,
      primaryDiagnosticsCount: primaryDisplay.length,
      auxiliaryDiagnosticsCount: auxiliaryDisplay.length,
      totalDiagnostics: total,
      ...dispositionSuppressed > 0 && { dispositionSuppressed },
      truncated,
      cleanFiles: clean,
      unconfirmedFiles: unconfirmed,
      navigationOnlyFiles: navigationOnly > 0 ? navigationOnly : void 0,
      timedOutFiles: timedOut > 0 ? timedOut : void 0,
      outcomes: results.map((result) => ({
        file: result.file,
        outcome: result.outcome,
        reason: result.tooLargeReason ?? result.inconclusiveReason ?? result.error ?? result.unavailable,
        primaryDiagnosticsCount: result.diagnostics.filter((diagnostic) => diagnostic.serverId === result.primaryServerId).length,
        auxiliaryDiagnosticsCount: result.diagnostics.filter((diagnostic) => diagnostic.serverId !== result.primaryServerId).length
      })),
      outcomeCounts,
      incompleteFiles: incompleteFiles > 0 ? incompleteFiles : void 0,
      fileErrors: fileErrors.length > 0 ? fileErrors : void 0,
      lspHealthWarnings: lspHealthWarnings.length > 0 ? lspHealthWarnings : void 0
    }
  };
}
async function resolveDirectoryScanExtensions(hasMatch) {
  for (const family of SCAN_LANGUAGE_PRIORITY) {
    const exts = family.flatMap((languageId) => extensionsForLanguage(languageId));
    if (await hasMatch(exts)) {
      return exts;
    }
  }
  return void 0;
}
async function collectDirectoryScanFiles(absPath, maxFiles, seen = /* @__PURE__ */ new Set()) {
  const isIgnored = projectIgnorePredicate(absPath);
  let collectedFiles = [];
  await resolveDirectoryScanExtensions(async (exts) => {
    collectedFiles = await collectFiles(
      absPath,
      [...exts],
      // At most `seen.size` collected files can be dropped below, so this
      // walk still sees `maxFiles + 1` new files when the directory has them.
      maxFiles + seen.size + 1,
      isIgnored
    );
    return collectedFiles.length > 0;
  });
  const fresh = collectedFiles.flatMap((file) => seen.has(normalizeMapKey(file)) ? [] : [file]);
  return {
    files: fresh.slice(0, maxFiles),
    capped: fresh.length > maxFiles,
    // Raw count: a directory whose files are all `seen` is not empty.
    eligible: collectedFiles.length
  };
}
function describeDirectoriesWithoutFiles(directories) {
  const listed = directories.slice(0, 5);
  const more = directories.length - listed.length;
  return {
    listed,
    text: `No supported source files found in: ${listed.join(", ")}${more > 0 ? ` (+${more} more)` : ""}`
  };
}
async function runDirectoryDiagnostics(absPath, severity, lspService, options) {
  const { files: filesToProcess, capped: wasCapped } = await collectDirectoryScanFiles(absPath, MAX_FILES);
  if (filesToProcess.length === 0) {
    return {
      content: [
        {
          type: "text",
          text: describeDirectoriesWithoutFiles([absPath]).text
        }
      ],
      details: {
        filePath: absPath,
        mode: "directory",
        severity,
        filesScanned: 0
      }
    };
  }
  const { results, fileErrors, lspHealthWarnings, total, truncated, display, primaryDisplay, auxiliaryDisplay, clean, unconfirmed, timedOut, rootFallbackReasons, outcomeCounts } = await collectBatchDiagnostics(filesToProcess, severity, lspService, options);
  const navigationOnly = results.filter((result) => result.diagnosticsUnsupported).length;
  const dispositionSuppressed = results.reduce((sum, result) => sum + (result.dispositionSuppressed ?? 0), 0);
  const suppressedLine = dispositionSuppressedLine(dispositionSuppressed);
  const outcomeDetails = results.map((result) => ({
    file: result.file,
    outcome: result.outcome,
    reason: result.tooLargeReason ?? result.inconclusiveReason ?? result.error ?? result.unavailable
  }));
  const tooLargeLines = renderBatchOutcomeLines(outcomeDetails, (file) => path36.relative(absPath, file));
  let text;
  if (total === 0) {
    const cleanLine = unconfirmed > 0 ? `${clean} clean \xB7 ${unconfirmed} unconfirmed: ${unconfirmedReasonClause(unconfirmed, timedOut, rootFallbackReasons)} NOT the same as 0 diagnostics.` : "No diagnostics found.";
    text = [
      `Directory: ${absPath}`,
      `Files scanned: ${filesToProcess.length}${wasCapped ? ` (capped at ${MAX_FILES})` : ""}`,
      ...lspHealthWarnings.length > 0 ? [
        "LSP unavailable for one or more files:",
        ...lspHealthWarnings.slice(0, 10)
      ] : unconfirmed > 0 || outcomeCounts.clean === filesToProcess.length ? [cleanLine] : [],
      ...tooLargeLines.length > 0 ? ["", "Files too large for LSP diagnostics:", ...tooLargeLines] : [],
      ...suppressedLine ? ["", suppressedLine] : []
    ].join("\n");
  } else {
    const lines = [
      `Directory: ${absPath}`,
      `Files scanned: ${filesToProcess.length}${wasCapped ? ` (capped at ${MAX_FILES})` : ""}`,
      `Files with errors: ${new Set(display.map((d) => d.file)).size}`,
      `Total diagnostics: ${total}`,
      ...lspHealthWarnings.length > 0 ? ["", "LSP health warnings:", ...lspHealthWarnings.slice(0, 10)] : [],
      // #533/#570: the remaining clean-looking files in a mixed scan may
      // still be unconfirmed — say so even though the directory as a
      // whole found diagnostics elsewhere.
      ...unconfirmed > 0 ? [
        "",
        `${clean} other file${clean === 1 ? "" : "s"} confirmed clean, ${unconfirmed} unconfirmed: ` + unconfirmedReasonClause(unconfirmed, timedOut, rootFallbackReasons)
      ] : [],
      ""
    ];
    const toRelative = (d) => ({
      ...d,
      file: path36.relative(absPath, d.file)
    });
    if (primaryDisplay.length > 0) {
      lines.push(`Primary findings (${primaryDisplay.length}):`);
      lines.push(...primaryDisplay.map(toRelative).map(formatDisplayDiag));
      lines.push("");
    }
    if (auxiliaryDisplay.length > 0) {
      lines.push(`Auxiliary findings (${auxiliaryDisplay.length}):`);
      lines.push(...auxiliaryDisplay.map(toRelative).map(formatDisplayDiag));
    }
    if (truncated) {
      lines.push("", `... (${total - MAX_DIAGNOSTICS} more diagnostics not shown)`);
    }
    if (suppressedLine)
      lines.push("", suppressedLine);
    if (tooLargeLines.length > 0) {
      lines.push("", "Files too large for LSP diagnostics:", ...tooLargeLines);
    }
    text = lines.join("\n");
  }
  return {
    content: [{ type: "text", text }],
    details: {
      filePath: absPath,
      mode: "directory",
      severity,
      serverScope: options.serverScope ?? "all",
      filesScanned: filesToProcess.length,
      capped: wasCapped,
      diagnostics: display.map((d) => ({
        file: path36.relative(absPath, d.file),
        line: d.line,
        character: d.character,
        severity: d.severity,
        message: d.message,
        source: d.source,
        code: d.code
      })),
      primaryDiagnosticsCount: primaryDisplay.length,
      auxiliaryDiagnosticsCount: auxiliaryDisplay.length,
      totalDiagnostics: total,
      ...dispositionSuppressed > 0 && { dispositionSuppressed },
      truncated,
      cleanFiles: clean,
      unconfirmedFiles: unconfirmed,
      outcomes: outcomeDetails,
      outcomeCounts,
      navigationOnlyFiles: navigationOnly > 0 ? navigationOnly : void 0,
      timedOutFiles: timedOut > 0 ? timedOut : void 0,
      fileErrors: fileErrors.length > 0 ? fileErrors : void 0,
      lspHealthWarnings: lspHealthWarnings.length > 0 ? lspHealthWarnings : void 0,
      concurrency: options.concurrency,
      waitMs: options.waitMs
    }
  };
}
function dispositionSuppressedLine(suppressed) {
  if (suppressed <= 0)
    return void 0;
  return `suppressed by disposition: ${suppressed} finding(s) dropped from this result because they're marked false-positive/won't-fix, disabled by \`.pi-lens.json\` rule policy, or suppressed by an inline \`pi-lens-ignore\` comment. Not a clean verdict for those locations \u2014 they were found, then intentionally hidden.`;
}
function applySeverityFilter(diags, severity) {
  if (severity === "all")
    return diags;
  const maxLevel = {
    error: 1,
    warning: 2,
    information: 3,
    hint: 4
  };
  const max = maxLevel[severity] ?? 0;
  if (max === 0)
    return diags;
  return diags.filter((d) => (d.severity ?? 3) <= max);
}
function formatDisplayDiag(d) {
  const sevName = SEVERITY_NAMES[d.severity] ?? "unknown";
  const loc = d.line !== void 0 ? `${d.file}:${d.line + 1}:${(d.character ?? 0) + 1}` : d.file;
  const src = d.source ? `[${d.source}]` : "";
  const code = d.code ? ` (${d.code})` : "";
  return `${loc}: ${sevName}${src}${code}: ${d.message}`;
}
function formatDiag(diag) {
  const loc = diag.range?.start?.line !== void 0 ? `L${diag.range.start.line + 1}:${(diag.range.start.character ?? 0) + 1}` : "";
  const src = diag.source ? `[${diag.source}]` : "";
  const code = diag.code ? ` (${diag.code})` : "";
  const sevName = SEVERITY_NAMES[diag.severity] ?? "unknown";
  return `${loc}: ${sevName}${src}${code}: ${diag.message}`;
}

// dist/tools/lens-diagnostics.js
var MAX_DIAGNOSTICS_PER_FILE = 50;
var MAX_PATHS_ENTRIES = MAX_BATCH_FILES;
function notRequestedReason(host) {
  return `refreshRunners not requested this call (quick mode) \u2014 pass refreshRunners=cheap/all/cached to ${resolveLensToolName("lens_diagnostics", host) ?? "diagnostics"} mode=full to run it`;
}
var FULL_SCAN_WALL_CLOCK_MS = getFullScanWallClockMs();
var FULL_SCAN_BINDING_YIELD_EVERY = 16;
async function findFullScanBindingMismatches(results) {
  const mismatched = /* @__PURE__ */ new WeakSet();
  let sinceYield = 0;
  for (const result of results) {
    if (result.boundToCurrentDisk === false) {
      mismatched.add(result);
    } else if (
      // A `true` verdict came from the LSP/cache binding seam and has already
      // compared its fingerprint with disk. Only legacy/partial producers need
      // this fallback read; `unknown` remains unknown when no hash exists.
      result.boundToCurrentDisk !== true && result.contentHash !== void 0
    ) {
      try {
        const content = await fs23.readFile(result.filePath, "utf-8");
        if (hashDiagnosticContent(content) !== result.contentHash) {
          mismatched.add(result);
        }
      } catch {
      }
    }
    sinceYield += 1;
    if (sinceYield >= FULL_SCAN_BINDING_YIELD_EVERY) {
      sinceYield = 0;
      await new Promise((resolve32) => setImmediate(resolve32));
    }
  }
  return mismatched;
}
function createLensDiagnosticsTool(cacheManager2, getCwd, getLspService = getLSPService, flushPending = async () => {
}, nextWriteIndex, captureLspStatusRepaint, getRuntime, isLensGuardEnabled2 = () => true) {
  const lspProbe = createLspDiagnosticsTool(nextWriteIndex, (info) => {
    const runtime = getRuntime?.();
    if (!runtime)
      return;
    const retired = retireInlineBlockerAndResyncGuard({
      runtime,
      cacheManager: cacheManager2,
      cwd: info.cwd,
      filePath: info.filePath,
      ...info.writeIndex === void 0 ? {} : { writeIndex: info.writeIndex },
      coveredSources: info.coveredSources,
      lensGuardEnabled: isLensGuardEnabled2()
    });
    if (retired) {
      logExtension({
        subsystem: "git-guard",
        level: "debug",
        message: `inline_blocker: retired for ${info.filePath}`
      });
    }
  }, getLspService);
  return {
    name: "lens_diagnostics",
    label: "Project Diagnostics",
    description: 'Query pi-lens diagnostics from the session cache or an active LSP probe, at paths or workspace scope. Empty cache is not proof of clean; probe changed paths when findings are absent or stale. Example: `{source: "lsp", scope: "paths", paths: ["src/app.ts"]}`.',
    promptSnippet: "lens_diagnostics source=session reads the session cache and an empty cache is not proof of a clean file; use source=lsp scope=paths for changed files when cached findings are absent or stale",
    renderResult: compactRenderResult(({ details, args, isError, text }) => {
      if (details?.source === "lsp") {
        const count = details.totalDiagnostics ?? 0;
        const files2 = details.filesChecked ?? details.filesScanned ?? 0;
        const noun = count === 1 ? "diagnostic" : "diagnostics";
        const filePath = typeof details?.filePath === "string" ? details.filePath : Array.isArray(args?.paths) && args.paths.length === 1 && typeof args.paths[0] === "string" ? args.paths[0] : void 0;
        const singleFile = (details?.mode === "file" || files2 === 1) && typeof filePath === "string" ? ` ${path37.basename(filePath)}` : "";
        const scope = files2 > 1 ? ` across ${files2} files` : singleFile;
        if (isError)
          return `lens_diagnostics lsp \u2014 ${text.split("\n")[0] ?? "error"}`;
        if ((details.navigationOnlyFiles ?? 0) > 0)
          return `lens_diagnostics${scope} \u2014 ${count} ${noun} \xB7 ${details.cleanFiles ?? 0} clean \xB7 ${details.navigationOnlyFiles} navigation-only`;
        if ((details.unconfirmedFiles ?? 0) > 0)
          return `lens_diagnostics${scope} \u2014 ${count} ${noun} \xB7 ${details.cleanFiles ?? 0} clean \xB7 ${details.unconfirmedFiles} unconfirmed${details.timedOutFiles ? ` (${details.timedOutFiles} timed out)` : ""}`;
        const outcomeCounts = details.outcomeCounts;
        const tooLargeLines = renderBatchOutcomeLines(details.outcomes ?? []);
        if (tooLargeLines.length > 0)
          return `lens_diagnostics${scope} \u2014 too large: ${tooLargeLines.join("; ")}`;
        const notConfirmed = outcomeCounts ? (outcomeCounts.inconclusive ?? 0) + (outcomeCounts.unavailable ?? 0) + (outcomeCounts.unsupported ?? 0) + (outcomeCounts.failed ?? 0) + (outcomeCounts.too_large ?? 0) : 0;
        if (notConfirmed > 0)
          return `lens_diagnostics${scope} \u2014 ${count} ${noun} \xB7 ${notConfirmed} checks not confirmed`;
        if ((details.incompleteFiles ?? 0) > 0)
          return `lens_diagnostics${scope} \u2014 incomplete (${details.incompleteFiles} files not confirmed)`;
        if (count === 0 && details.unconfirmed)
          return details.timedOut ? `lens_diagnostics${scope} \u2014 timed out (result may be incomplete)` : `lens_diagnostics${scope} \u2014 unconfirmed (server cannot confirm clean)`;
        return `lens_diagnostics${scope} \u2014 ${count} ${noun}`;
      }
      const scanning = scanningSummaryLine(details, text);
      if (scanning)
        return scanning;
      const mode = details?.mode ?? (typeof args.mode === "string" ? args.mode : "delta");
      if (isError) {
        return `lens_diagnostics ${mode} \u2014 ${text.split("\n")[0] ?? "error"}`;
      }
      const coldSuffix = details?.coldRunners && details.coldRunners.length > 0 ? ` (${details.coldRunners.length} cold: ${details.coldRunners.join(", ")})` : "";
      const failedSuffix = details?.failedAnalyzers && details.failedAnalyzers.length > 0 ? ` (${details.failedAnalyzers.length} failed: ${details.failedAnalyzers.map((item) => item.id).join(", ")})` : "";
      if (mode === "delta") {
        const aw = details?.actionableWarnings ?? 0;
        const cq = details?.qualityIssues ?? 0;
        const pd = details?.projectDiagnostics ?? 0;
        if (aw + cq + pd === 0)
          return `lens_diagnostics delta \u2014 clean${coldSuffix}${failedSuffix}`;
        return `lens_diagnostics delta \u2014 ${aw} actionable \xB7 ${cq} quality \xB7 ${pd} project${coldSuffix}${failedSuffix}`;
      }
      const b = details?.totalBlocking ?? 0;
      const e = details?.totalErrors ?? 0;
      const w = details?.totalWarnings ?? 0;
      const adv = details?.totalAdvisories ?? 0;
      const files = details?.filesWithIssues ?? details?.filesChecked ?? 0;
      if (b + e + w === 0) {
        const advisorySuffix = adv > 0 ? `, ${adv} hint${adv === 1 ? "" : "s"}` : "";
        return `lens_diagnostics ${mode} \u2014 clean${advisorySuffix} (${files} files)${coldSuffix}${failedSuffix}`;
      }
      const parts = [`${b} blocking`];
      if (b === 0 && e > 0)
        parts.push(`${e} errors`);
      parts.push(`${w} warnings`);
      return `lens_diagnostics ${mode} \u2014 ${parts.join(" \xB7 ")} (${files} files)${coldSuffix}${failedSuffix}`;
    }),
    parameters: Type.Object({
      source: Type.Optional(Type.String({
        enum: ["session", "lsp"],
        description: "Evidence source: session cache (empty cache is not proof of a clean file \u2014 use source=lsp for changed files) or an active LSP probe."
      })),
      scope: Type.Optional(Type.String({
        enum: ["paths", "workspace"],
        description: (
          // #2860: no schema value maps to "current turn's delta" — the
          // default (omitted scope) already gives that for
          // source=session, and for source=lsp `delta` was byte-identical
          // to `paths` (round-2 verify N/F4), so exposing it would only
          // invite a caller to believe it does something distinct.
          "Coverage scope: explicit paths, or workspace (default: current turn's delta for source=session)."
        )
      })),
      mode: Type.Optional(Type.String({
        enum: ["delta", "all", "full"],
        description: "delta = current turn; all = cache-only; full = active LSP scan of paths. Empty cache is not proof of clean."
      })),
      path: Type.Optional(Type.String({
        description: "One file or directory for source=lsp checks."
      })),
      concurrency: Type.Optional(Type.Number({
        description: "Source=lsp batch concurrency (maximum 16)."
      })),
      waitMs: Type.Optional(Type.Number({
        description: "Source=lsp per-file wait budget in milliseconds."
      })),
      serverScope: Type.Optional(Type.String({
        enum: ["primary", "all"],
        description: "Source=lsp server coverage: primary or all."
      })),
      refreshRunners: Type.Optional(Type.Union([
        Type.Boolean(),
        Type.String({ enum: ["cached", "cheap", "all", "none"] })
      ], {
        description: "Analyzer refresh mode for full view."
      })),
      maxProjectFiles: Type.Optional(Type.Number({
        description: "Project-file limit for cheap runners."
      })),
      maxLspFiles: Type.Optional(Type.Number({
        description: "File limit for the LSP sweep."
      })),
      includeGenerated: Type.Optional(Type.Boolean({
        description: "Include generated-name paths in full scans."
      })),
      analysisRoot: Type.Optional(Type.String({
        description: "Explicit project directory for heavyweight analyzers; it must exist and resolve strictly below the home directory."
      })),
      severity: Type.Optional(Type.String({
        enum: [...LSP_SEVERITY_FILTERS],
        description: "Filter by severity threshold (default: all): error shows errors; warning includes errors and warnings; information includes errors, warnings, and information; hint and all show every known tier."
      })),
      paths: Type.Optional(Type.Array(Type.String(), {
        maxItems: MAX_PATHS_ENTRIES,
        description: "Files or directories to filter."
      }))
    }),
    async execute(_toolCallId, params, signal, onUpdate, ctx) {
      const requestedSource = params.source;
      const requestedScope = params.scope;
      const legacyMode = params.mode;
      const source = requestedSource ?? "session";
      const scope = requestedScope ?? (legacyMode === "delta" || legacyMode === void 0 ? source === "lsp" ? "paths" : "delta" : "workspace");
      const cwd = ctx.cwd ?? getCwd();
      if (source === "lsp") {
        const lspParams = { ...params };
        delete lspParams.source;
        delete lspParams.scope;
        const hasExplicitPath = typeof lspParams.path === "string" && lspParams.path.length > 0;
        const hasExplicitPaths = Array.isArray(lspParams.paths) && lspParams.paths.length > 0;
        if (scope === "workspace" && !hasExplicitPath && !hasExplicitPaths) {
          lspParams.path = cwd;
        }
        const lspStart = Date.now();
        const result = await lspProbe.execute(_toolCallId, lspParams, signal, onUpdate, ctx.signal ? { cwd, signal: ctx.signal } : { cwd });
        logLatency({
          type: "phase",
          toolName: "lens_diagnostics",
          filePath: cwd,
          phase: "lens_diagnostics_lsp_route",
          durationMs: Date.now() - lspStart,
          metadata: {
            scope,
            isError: result.isError === true,
            totalDiagnostics: result.details?.totalDiagnostics ?? 0,
            cleanFiles: result.details?.cleanFiles ?? 0,
            unconfirmedFiles: result.details?.unconfirmedFiles ?? 0,
            timedOutFiles: result.details?.timedOutFiles ?? 0
          }
        });
        return {
          ...result,
          isError: result.isError === true,
          details: { ...result.details, source, scope }
        };
      }
      if (requestedSource !== void 0) {
        const effectiveMode = legacyMode ?? (scope === "workspace" ? "all" : scope === "paths" ? "all" : "delta");
        params = { ...params, mode: effectiveMode };
      }
      const repaintLspStatus = captureLspStatusRepaint?.(ctx);
      const mode = params.mode ?? "delta";
      const severity = params.severity ?? "all";
      const refreshRunners = params.refreshRunners;
      const parsePositiveInt = (value) => typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : void 0;
      const maxProjectFiles = parsePositiveInt(params.maxProjectFiles);
      const maxLspFiles = parsePositiveInt(params.maxLspFiles);
      const includeGenerated = params.includeGenerated === true;
      let pathsScope;
      try {
        pathsScope = resolvePathsScope(cwd, params.paths);
      } catch (err) {
        return {
          content: [
            {
              type: "text",
              text: err instanceof Error ? err.message : String(err)
            }
          ],
          isError: true,
          details: { mode, pathsError: true }
        };
      }
      const abortSignal = combineAbortSignals(signal, ctx.signal);
      await flushPending();
      const staleDropped = await reconcileStaleWidgetFiles();
      if (mode === "all") {
        const dependencyGateStart = Date.now();
        const { demoted: dependencyDemoted, truncatedImports } = await reconcileStaleWidgetDependencyBlockers(cwd, getRuntime?.()?.turnIndex);
        logLatency({
          type: "phase",
          toolName: "lens_diagnostics",
          filePath: cwd,
          phase: "blocker_freshness_widget_gate",
          durationMs: Date.now() - dependencyGateStart,
          metadata: {
            demoted: dependencyDemoted,
            truncatedImports,
            surface: "mode=all"
          }
        });
        return formatAllMode(cwd, severity, void 0, void 0, staleDropped, pathsScope, dependencyDemoted);
      }
      if (mode === "full") {
        const ceiling = AbortSignal.timeout(FULL_SCAN_WALL_CLOCK_MS);
        const fullSignal = combineAbortSignals(abortSignal, ceiling);
        const onProgress = makeProgressReporter(onUpdate);
        return formatFullMode(cwd, severity, getLspService(), cacheManager2, {
          refreshRunners,
          maxProjectFiles,
          maxLspFiles,
          includeGenerated,
          signal: fullSignal,
          wallClockMs: FULL_SCAN_WALL_CLOCK_MS,
          onProgress,
          onServerReady: repaintLspStatus,
          pathsScope,
          nextWriteIndex,
          runtime: getRuntime?.(),
          analysisRoot: typeof params.analysisRoot === "string" ? params.analysisRoot : void 0,
          host: ctx.host ?? "pi"
        });
      }
      return formatDeltaMode(cacheManager2, cwd, severity, pathsScope);
    }
  };
}
function formatProjectDeltaDiagnostic(diagnostic, stale) {
  const marker = stale ? "\u25CB" : diagnostic.semantic === "blocking" || diagnostic.severity === "error" ? "\u{1F534}" : "\u2139";
  const rule = diagnostic.rule ?? diagnostic.code ?? diagnostic.runner;
  const where = stale ? STALE_LINE_MARKER : `L${diagnostic.line ?? "?"}`;
  return `  ${marker} ${where}  ${rule}  ${diagnostic.message}`;
}
function appendProjectDiagnosticsDeltaLines(groups, cwd, report, severity, includeFile) {
  const scoped = (report?.diagnostics ?? []).filter((diagnostic) => includeFile(diagnostic.filePath) && matchesSeverity(projectDiagnosticToWidget(diagnostic, diagnostic.filePath), severity));
  const { "lens-diagnostics-delta-project": gated } = gateFindingsByPathFreshness({
    cwd,
    sources: {
      "lens-diagnostics-delta-project": {
        findings: scoped,
        scannedAt: report?.generatedAt,
        citedPath: (d) => d.filePath,
        onMissing: "drop"
      }
    }
  });
  const staleSet = new Set(gated.stale);
  const diagnostics = [...gated.live, ...gated.stale];
  const byFile = /* @__PURE__ */ new Map();
  for (const diagnostic of diagnostics) {
    const filePath = path37.resolve(diagnostic.filePath);
    const bucket = byFile.get(filePath) ?? [];
    bucket.push(diagnostic);
    byFile.set(filePath, bucket);
  }
  for (const [filePath, fileDiagnostics] of byFile) {
    const group = getDeltaFileGroup(groups, cwd, filePath);
    for (const diagnostic of fileDiagnostics) {
      group.projectLines.push(formatProjectDeltaDiagnostic(diagnostic, staleSet.has(diagnostic)));
    }
  }
  return diagnostics.length;
}
var CACHED_CONTENT_MEMO_CAP = 64;
var cachedContentMemo = new BoundedLruCache(CACHED_CONTENT_MEMO_CAP);
function readContentForAnchors(filePath, stat) {
  const key = normalizeEphemeralMapKey(filePath);
  const hit = cachedContentMemo.get(key);
  if (hit && hit.mtimeMs === stat.mtimeMs && hit.size === stat.size) {
    return hit.content;
  }
  let content;
  try {
    content = fsSync.readFileSync(filePath, "utf-8");
  } catch {
    return void 0;
  }
  cachedContentMemo.set(key, {
    mtimeMs: stat.mtimeMs,
    size: stat.size,
    content
  });
  return content;
}
function applyCachedDispositions(cachedDiagnostics, cwd, filePath) {
  if (!hasAnyDispositionMarks(cwd))
    return cachedDiagnostics;
  if (!hasStrictDispositionMarks(cwd)) {
    return applyWeakDispositions(cachedDiagnostics, cwd, filePath);
  }
  let stat;
  try {
    stat = fsSync.statSync(filePath);
  } catch {
    return applyWeakDispositions(cachedDiagnostics, cwd, filePath);
  }
  const referenceMs = cachedDiagnostics.reduce((latest, d) => Math.max(latest, d.observedAt ?? 0), 0);
  if (referenceMs > 0 && freshnessFromMtime({ mtimeMs: stat.mtimeMs, referenceMs }).verdict === "stale") {
    return applyWeakDispositions(cachedDiagnostics, cwd, filePath);
  }
  const content = readContentForAnchors(filePath, stat);
  if (content === void 0) {
    return applyWeakDispositions(cachedDiagnostics, cwd, filePath);
  }
  return applyDispositions(cachedDiagnostics, cwd, filePath, content);
}
function filterDeltaReportDispositions(report, cwd, policyMap) {
  if (!report?.diagnostics.length)
    return report;
  const kept = report.diagnostics.filter((d) => applyCachedDispositions([projectDiagnosticToWidget(d, d.filePath)], cwd, d.filePath).length === 1);
  const policyKept = applyRulePolicy(kept, policyMap, {
    root: cwd,
    filePath: cwd
  });
  if (policyKept.length === report.diagnostics.length)
    return report;
  return { ...report, diagnostics: policyKept };
}
function applyDeltaFreshnessGate(files, cwd, generatedAt) {
  const stamps = new Set(files.map((file) => file.generatedAt ?? generatedAt ?? ""));
  if (stamps.size > 1) {
    const gatedByPath = /* @__PURE__ */ new Map();
    for (const stamp of stamps) {
      const group = files.filter((file) => (file.generatedAt ?? generatedAt ?? "") === stamp);
      for (const gated2 of applyDeltaFreshnessGate(group.map((file) => ({
        filePath: file.filePath,
        warnings: file.warnings
      })), cwd, stamp === "" ? void 0 : stamp)) {
        gatedByPath.set(gated2.filePath, gated2);
      }
    }
    return files.map((file) => gatedByPath.get(file.filePath)).filter((entry) => entry !== void 0);
  }
  const stampedAt = [...stamps][0];
  const effectiveAt = stampedAt !== void 0 && stampedAt !== "" ? stampedAt : generatedAt;
  if (!effectiveAt)
    return files;
  const flat = [];
  for (const file of files) {
    for (const warning of file.warnings)
      flat.push({ filePath: file.filePath, warning });
  }
  if (flat.length === 0)
    return files;
  const { "lens-diagnostics-delta": gated } = gateFindingsByPathFreshness({
    cwd,
    sources: {
      "lens-diagnostics-delta": {
        findings: flat,
        scannedAt: effectiveAt,
        citedPath: (f) => f.filePath,
        onMissing: "drop"
      }
    }
  });
  const byFile = /* @__PURE__ */ new Map();
  for (const f of gated.live) {
    const arr = byFile.get(f.filePath) ?? [];
    arr.push(f.warning);
    byFile.set(f.filePath, arr);
  }
  for (const f of gated.stale) {
    const arr = byFile.get(f.filePath) ?? [];
    arr.push({
      ...f.warning,
      stale: true,
      line: void 0,
      staleAsOf: effectiveAt
    });
    byFile.set(f.filePath, arr);
  }
  return files.map((file) => ({
    filePath: file.filePath,
    warnings: byFile.get(file.filePath) ?? []
  })).filter((file) => file.warnings.length > 0);
}
function getDeltaFileGroup(groups, cwd, filePath) {
  const rel = path37.relative(cwd, filePath);
  let group = groups.get(rel);
  if (!group) {
    group = {
      rel,
      actionableLines: [],
      qualityLines: [],
      projectLines: [],
      incomplete: false
    };
    groups.set(rel, group);
  }
  return group;
}
function formatDeltaMode(cacheManager2, cwd, severity, pathsScope) {
  const actionableEntry = cacheManager2.readCache("actionable-warnings", cwd);
  const qualityEntry = cacheManager2.readCache("code-quality-warnings", cwd);
  const reverifyIncompletePaths = new Set((actionableEntry?.data?.files ?? []).filter((file) => file.reVerifyIncomplete).map((file) => normalizeMapKey(file.filePath)));
  const actionable = actionableEntry?.data;
  const quality = qualityEntry?.data;
  const policyMap = loadProjectRulePolicyMap(cwd);
  const projectDelta = filterDeltaReportDispositions(loadProjectDiagnosticsDeltaReport(cwd), cwd, policyMap);
  const includeFile = createScopedFileFilter(cwd, pathsScope);
  const visibleWarningFiles = (files) => (files ?? []).filter((file) => includeFile(file.filePath)).map((file) => ({
    filePath: file.filePath,
    // #2504 r4 (F1): carried through, so a merged report's older
    // entries keep their own age all the way to the freshness gate.
    generatedAt: file.generatedAt,
    warnings: applyRulePolicy(applyCachedDispositions(file.warnings ?? [], cwd, file.filePath), policyMap, { root: cwd, filePath: file.filePath })
  })).filter((file) => file.warnings.length > 0);
  const actionableFiles = applyDeltaFreshnessGate(visibleWarningFiles(actionable?.files), cwd, actionable?.generatedAt);
  const qualityFiles = applyDeltaFreshnessGate(visibleWarningFiles(quality?.files), cwd, quality?.generatedAt);
  const matchingWarnings = (warnings) => warnings.filter((warning) => matchesRecordSeverity(warning.severity, severity));
  const filteredActionableFiles = actionableFiles.map((file) => ({
    ...file,
    warnings: matchingWarnings(file.warnings)
  })).filter((file) => file.warnings.length > 0);
  const filteredQualityFiles = qualityFiles.map((file) => ({
    ...file,
    warnings: matchingWarnings(file.warnings)
  })).filter((file) => file.warnings.length > 0);
  const groups = /* @__PURE__ */ new Map();
  if (filteredActionableFiles.length > 0) {
    for (const file of filteredActionableFiles) {
      const group = getDeltaFileGroup(groups, cwd, file.filePath);
      for (const w of file.warnings) {
        const where = w.stale ? STALE_LINE_MARKER : `L${w.line ?? "?"}`;
        group.actionableLines.push(`  \u26A0 ${where}  ${w.rule ?? w.code ?? w.tool}  ${w.message}`);
      }
      const key = normalizeMapKey(file.filePath);
      if (reverifyIncompletePaths.has(key))
        group.incomplete = true;
      if (!group.staleRow) {
        const staleWarning = file.warnings.find((w) => w.stale);
        if (staleWarning)
          group.staleRow = { staleAsOf: staleWarning.staleAsOf };
      }
    }
  }
  if (filteredQualityFiles.length > 0) {
    for (const file of filteredQualityFiles) {
      const group = getDeltaFileGroup(groups, cwd, file.filePath);
      for (const w of file.warnings) {
        const where = w.stale ? STALE_LINE_MARKER : `L${w.line ?? "?"}`;
        group.qualityLines.push(`  \u2139 ${where}  ${w.rule ?? w.code ?? w.tool}  ${w.message}`);
      }
      const key = normalizeMapKey(file.filePath);
      if (reverifyIncompletePaths.has(key))
        group.incomplete = true;
      if (!group.staleRow) {
        const staleWarning = file.warnings.find((w) => w.stale);
        if (staleWarning)
          group.staleRow = { staleAsOf: staleWarning.staleAsOf };
      }
    }
  }
  const projectDeltaCount = appendProjectDiagnosticsDeltaLines(groups, cwd, projectDelta, severity, includeFile);
  const lines = [];
  for (const group of groups.values()) {
    lines.push(group.rel);
    lines.push(...group.actionableLines);
    lines.push(...group.qualityLines);
    lines.push(...group.projectLines);
    if (group.staleRow) {
      lines.push(`  (${formatCacheAgeLabel(group.staleRow.staleAsOf)})`);
    }
    if (group.incomplete)
      lines.push("  (re-verify incomplete)");
  }
  const selectedActionableFiles = filteredActionableFiles;
  const selectedQualityFiles = filteredQualityFiles;
  const aw = selectedActionableFiles.reduce((count, file) => count + file.warnings.length, 0);
  const cq = selectedQualityFiles.reduce((count, file) => count + file.warnings.length, 0);
  if (lines.length === 0) {
    let text = `No ${severity === "all" ? "" : severity + " "}issues in the current turn delta.`;
    const carried = getFileDiagnosticSummaries().filter((f) => includeFile(f.filePath)).map((f) => ({
      ...f,
      diagnostics: applyRulePolicy(applyCachedDispositions(f.diagnostics, cwd, f.filePath), policyMap, { root: cwd, filePath: f.filePath })
    })).filter((f) => f.diagnostics.length > 0);
    const carriedIssues = carried.reduce((n, f) => n + f.diagnostics.length, 0);
    if (carried.length > 0) {
      text += ` ${carriedIssues} finding${carriedIssues === 1 ? "" : "s"} across ${carried.length} file${carried.length === 1 ? "" : "s"} carried over from earlier this session \u2014 use mode=all to see them.`;
    }
    text += pathsScopeCacheOnlyNote(pathsScope);
    return {
      content: [{ type: "text", text }],
      details: { mode: "delta", warnings: 0, carriedOverFiles: carried.length }
    };
  }
  const summary = `
Summary (turn delta): ${aw} actionable warning${aw === 1 ? "" : "s"} \xB7 ${cq} quality issue${cq === 1 ? "" : "s"} \xB7 ${projectDeltaCount} project diagnostic${projectDeltaCount === 1 ? "" : "s"}`;
  return {
    content: [{ type: "text", text: lines.join("\n") + summary }],
    details: {
      mode: "delta",
      actionableWarnings: aw,
      qualityIssues: cq,
      projectDiagnostics: projectDeltaCount
    }
  };
}
function createCurrentIgnoreFilter(cwd) {
  try {
    const matcher = getProjectIgnoreMatcher(cwd);
    return (filePath) => !matcher.isIgnored(path37.resolve(filePath), false);
  } catch {
    return () => true;
  }
}
function resolvePathsScope(cwd, rawPaths) {
  if (!Array.isArray(rawPaths) || rawPaths.length === 0)
    return void 0;
  if (rawPaths.length > MAX_PATHS_ENTRIES) {
    throw new Error(`paths has ${rawPaths.length} entries, over the ${MAX_PATHS_ENTRIES} cap. Narrow the list or omit paths to scan without a restriction.`);
  }
  const entries = rawPaths.filter((entry) => typeof entry === "string" && entry.trim().length > 0).map((entry) => path37.resolve(path37.isAbsolute(entry) ? entry : path37.resolve(cwd, entry)));
  const missing = [];
  const fileEntries = [];
  const existingEntries = [];
  const dirEntries = [];
  for (const entry of entries) {
    let stat;
    try {
      stat = fsSync.statSync(entry);
    } catch {
      missing.push(entry);
      fileEntries.push(entry);
      continue;
    }
    if (stat.isDirectory()) {
      dirEntries.push(entry);
    } else {
      fileEntries.push(entry);
      existingEntries.push(entry);
    }
  }
  const fileKeys = new Set(fileEntries.map((f) => normalizeFilePath(f)));
  const dirPrefixes = dirEntries.map((d) => normalizeFilePath(d));
  const includeExplicitFile = (filePath) => fileKeys.has(normalizeFilePath(path37.resolve(filePath)));
  const includeFile = (filePath) => {
    const key = normalizeFilePath(path37.resolve(filePath));
    if (fileKeys.has(key))
      return true;
    return dirPrefixes.some((prefix) => key === prefix || key.startsWith(`${prefix}/`));
  };
  return {
    includeFile,
    includeExplicitFile,
    missing,
    existingEntries,
    hasDirectoryEntries: dirEntries.length > 0
  };
}
function pathsScopeCacheOnlyNote(scope) {
  if (!scope)
    return "";
  return "\n\nNote: paths restricts this to cached findings for files pi-lens has already dispatched this session \u2014 mode=delta/all can't see files it hasn't touched. Use mode=full to actively scan exactly these paths.";
}
function pathsScopeMissingNote(scope) {
  if (!scope || scope.missing.length === 0)
    return "";
  const shown2 = scope.missing.slice(0, 10).map((p) => path37.basename(p));
  const more = scope.missing.length > shown2.length ? ` (+${scope.missing.length - shown2.length} more)` : "";
  return `

\u26A0 Skipped ${scope.missing.length} path(s) not found on disk: ${shown2.join(", ")}${more}`;
}
function createScopedFileFilter(cwd, pathsScope) {
  const ignoreFile = createCurrentIgnoreFilter(cwd);
  return (filePath) => {
    if (!pathsScope)
      return ignoreFile(filePath);
    if (!pathsScope.includeFile(filePath))
      return false;
    return pathsScope.includeExplicitFile(filePath) || ignoreFile(filePath);
  };
}
function filterProjectDiagnosticsSnapshot(snapshot, includeFile) {
  if (!snapshot)
    return void 0;
  return {
    ...snapshot,
    diagnostics: snapshot.diagnostics.filter((d) => includeFile(d.filePath))
  };
}
function filterProjectDiagnosticsDeltaReport(report, includeFile) {
  if (!report)
    return void 0;
  return {
    ...report,
    diagnostics: report.diagnostics.filter((d) => includeFile(d.filePath))
  };
}
function applyProjectRulePolicy(value, policyMap, root) {
  if (!value)
    return void 0;
  return {
    ...value,
    diagnostics: applyRulePolicy(value.diagnostics, policyMap, {
      root,
      filePath: value.diagnostics[0]?.filePath ?? root
    })
  };
}
function isErrorLike(d) {
  if (d.stale)
    return false;
  return d.semantic === "blocking" || d.severity === "error";
}
function matchesSeverity(d, severity) {
  return matchesRecordSeverity(isErrorLike(d) ? "error" : d.severity, severity);
}
function matchesRecordSeverity(recordSeverity, requested) {
  if (requested === "all")
    return true;
  if (requested === "error")
    return recordSeverity === "error";
  if (requested === "warning")
    return recordSeverity === "error" || recordSeverity === "warning";
  if (requested === "information")
    return recordSeverity === "error" || recordSeverity === "warning" || recordSeverity === "info" || recordSeverity === "note" || recordSeverity === "help";
  if (requested === "hint")
    return recordSeverity === "error" || recordSeverity === "warning" || recordSeverity === "info" || recordSeverity === "note" || recordSeverity === "help" || recordSeverity === "hint";
  return true;
}
function severityRank(d) {
  if (d.semantic === "blocking")
    return 0;
  if (d.severity === "error")
    return 1;
  if (d.severity === "warning")
    return 2;
  return 3;
}
function bySeverityThenLine(a, b) {
  return severityRank(a) - severityRank(b) || (a.line ?? 0) - (b.line ?? 0);
}
function lspSeverityName(severity) {
  if (severity === 1)
    return "error";
  if (severity === 2)
    return "warning";
  if (severity === 3)
    return "info";
  return "hint";
}
function lspRuleId(diagnostic) {
  const code = diagnostic.code === void 0 ? void 0 : String(diagnostic.code);
  if (diagnostic.source && code)
    return `${diagnostic.source}:${code}`;
  return diagnostic.source ?? code ?? "lsp";
}
function lspDiagnosticToWidget(diagnostic) {
  const severity = lspSeverityName(diagnostic.severity);
  const rule = lspRuleId(diagnostic);
  return {
    severity,
    semantic: diagnostic.severity === 1 ? "blocking" : "warning",
    message: diagnostic.message,
    line: diagnostic.range.start.line + 1,
    col: diagnostic.range.start.character + 1,
    rule,
    // #3041: keep auxiliary provenance. The footer-reconcile loop above already
    // gives a swept aux finding its real tool id via `retagAuxiliaryDiagnostics`
    // (#692); this second conversion of the SAME raw diagnostics did not, and
    // dispositions are anchored by `tool` — so a `false-positive`/`suppress`
    // mark recorded against the per-edit `ast-grep` finding never matched the
    // `lsp`-labelled copy mode=full renders.
    tool: findAuxiliaryProfileForSource(diagnostic.source)?.tool ?? "lsp"
  };
}
function projectDiagnosticToWidget(diagnostic, filePath) {
  return {
    severity: diagnostic.severity,
    semantic: diagnostic.semantic,
    message: diagnostic.message,
    line: diagnostic.line,
    col: diagnostic.column,
    rule: diagnostic.rule ?? diagnostic.code,
    tool: diagnostic.runner || diagnostic.tool,
    uri: widgetDiagnosticUri(filePath, diagnostic.line, diagnostic.column),
    // #3600: carry the analyzer's own read stamp through the #1888
    // correlated commit, which otherwise re-stamps the row with the project
    // scan's `scannedAt` or the fold's `Date.now()`. Absent for the cheap
    // scan's rows, whose freshness is settled by a content fingerprint.
    ...diagnostic.observedAt !== void 0 && {
      observedAt: diagnostic.observedAt
    }
  };
}
function diagnosticDedupKey(filePath, diagnostic) {
  const ruleId = normalizeRuleId(diagnostic.rule ?? diagnostic.tool ?? "");
  return [path37.resolve(filePath), diagnostic.line ?? "?", ruleId].join(":");
}
function runnerIdOf(diagnostic) {
  return diagnostic.tool ?? diagnostic.rule?.split(":", 1)[0] ?? "";
}
function runnerRetirementDecision(diagnostic, filePath, authoritativeRunnerIds, authoritativeCoverage) {
  const runnerId = runnerIdOf(diagnostic);
  const coverage = (authoritativeCoverage ?? []).filter((entry) => entry.runnerId === runnerId);
  if (coverage.length === 0) {
    return authoritativeRunnerIds?.has(runnerId) ? "retire" : "keep";
  }
  const realFilePath = realpathOrResolve(filePath);
  for (const entry of coverage) {
    const root = entry.root;
    const relative9 = path37.relative(root, realFilePath);
    const underRoot = relative9 === "" || !relative9.startsWith("..") && !path37.isAbsolute(relative9);
    if (!underRoot)
      continue;
    if (entry.files.has(realFilePath)) {
      return "retire";
    }
  }
  return "keep";
}
function summarizeDiagnostics(filePath, diagnostics, hasFinalSnapshot) {
  let blocking = 0;
  let errors = 0;
  let warnings = 0;
  let advisories = 0;
  for (const diagnostic of diagnostics) {
    if (diagnostic.stale)
      continue;
    if (diagnostic.semantic === "blocking")
      blocking++;
    const tier = classifyDiagnosticTier(diagnostic);
    if (tier === "error")
      errors++;
    else if (tier === "warning")
      warnings++;
    else if (tier === "advisory")
      advisories++;
  }
  return {
    filePath,
    blocking,
    errors,
    warnings,
    advisories,
    hasFinalSnapshot,
    diagnostics
  };
}
var UNCONFIRMED_REASON_SENTENCE = {
  budget: "check didn't complete within budget",
  inconclusive: "check was inconclusive (notify-write or diagnostics wait timed out)",
  coverage_gap: "an auxiliary scanner coverage gap",
  service_destroyed: "the LSP service was reset mid-sweep",
  error: "check errored",
  // #1618 review round 2: the LSP layer considered this touch CONFIRMED —
  // the file's content changed under it (stale binding), which is a
  // completely different failure from a timeout. Must never collapse into
  // "within budget", the exact string this PR exists to stop misrendering.
  binding_mismatch: "the file changed on disk since this result was computed",
  // #2052: no server was asked. Say WHY and say it is permanent for this
  // path, so the reader does not read an empty result as "clean" or retry it.
  outside_project_root: "the file is outside every initialized session project root, so no language server was asked"
};
var UNCONFIRMED_REASON_COUNT_LABEL = {
  budget: "timed out",
  inconclusive: "inconclusive",
  coverage_gap: "coverage gap",
  service_destroyed: "service reset mid-sweep",
  error: "errored",
  binding_mismatch: "stale binding",
  outside_project_root: "outside project root"
};
function classifyUnconfirmedReason(result, mismatched) {
  if (mismatched.has(result))
    return "binding_mismatch";
  return result.unconfirmedReason ?? (result.error ? "error" : "budget");
}
function tallyUnconfirmedReasons(results, mismatched) {
  const tally = /* @__PURE__ */ new Map();
  for (const result of results) {
    const reason = classifyUnconfirmedReason(result, mismatched);
    tally.set(reason, (tally.get(reason) ?? 0) + 1);
  }
  return tally;
}
function formatUnconfirmedReasonClause(tally) {
  const entries = [...tally.entries()].filter(([, count]) => count > 0);
  if (entries.length === 0)
    return "";
  if (entries.length === 1) {
    return UNCONFIRMED_REASON_SENTENCE[entries[0][0]];
  }
  return entries.map(([reason, count]) => `${count} ${UNCONFIRMED_REASON_COUNT_LABEL[reason]}`).join(", ");
}
function tallyLspByPrimaryServer(confirmed, unconfirmed) {
  const byServer = /* @__PURE__ */ new Map();
  const bump = (filePath, wasConfirmed) => {
    const id = primaryServerId(filePath) ?? "unknown";
    const entry = byServer.get(id) ?? { confirmed: 0, total: 0 };
    entry.total += 1;
    if (wasConfirmed)
      entry.confirmed += 1;
    byServer.set(id, entry);
  };
  for (const result of confirmed)
    bump(result.filePath, true);
  for (const result of unconfirmed)
    bump(result.filePath, false);
  return byServer;
}
function formatLspServerBreakdown(byServer) {
  return [...byServer.entries()].sort((a, b) => {
    const rateA = a[1].confirmed / a[1].total;
    const rateB = b[1].confirmed / b[1].total;
    return rateA - rateB;
  }).map(([id, { confirmed, total }]) => `${id}: ${confirmed}/${total}`).join(", ");
}
function tallyLspPrimaryVsAuxiliary(results) {
  let primary = 0;
  let auxiliary = 0;
  for (const result of results) {
    const primaryId = primaryServerId(result.filePath);
    for (const diagnostic of result.diagnostics ?? []) {
      if (diagnostic.serverId === primaryId)
        primary += 1;
      else
        auxiliary += 1;
    }
  }
  return { primary, auxiliary };
}
function mergeDiagnosticsWithWidgetSummaries(widgetSummaries, lspResults, projectSnapshot, projectDelta, authoritativeLspFiles, authoritativeRunnerIds, authoritativeRunnerCoverage) {
  const byFile = /* @__PURE__ */ new Map();
  const seen = /* @__PURE__ */ new Set();
  for (const summary of widgetSummaries) {
    const filePath = path37.resolve(summary.filePath);
    if (authoritativeLspFiles?.has(filePath))
      continue;
    const retained = summary.diagnostics ?? [];
    const diagnostics = retained.filter((diagnostic) => runnerRetirementDecision(diagnostic, filePath, authoritativeRunnerIds, authoritativeRunnerCoverage) !== "retire").map((d) => ({ ...d }));
    byFile.set(
      filePath,
      // #2154 v4: when the filter retires rows, the stored tallies describe
      // diagnostics that are no longer delivered — full mode rendered
      // `main.go 1W … 1 warning` with no row under it. Recompute from what
      // survived, and only then (an untouched file keeps its own counts).
      diagnostics.length === retained.length ? { ...summary, filePath, diagnostics } : summarizeDiagnostics(filePath, diagnostics, summary.hasFinalSnapshot ?? true)
    );
    for (const diagnostic of diagnostics) {
      seen.add(diagnosticDedupKey(filePath, diagnostic));
    }
  }
  const addDiagnostic = (filePath, widgetDiagnostic) => {
    const existing = byFile.get(filePath);
    const diagnostics = existing ? [...existing.diagnostics] : [];
    const key = diagnosticDedupKey(filePath, widgetDiagnostic);
    if (seen.has(key))
      return;
    seen.add(key);
    diagnostics.push(widgetDiagnostic);
    byFile.set(filePath, summarizeDiagnostics(filePath, diagnostics, existing?.hasFinalSnapshot ?? true));
  };
  for (const result of lspResults) {
    const filePath = path37.resolve(result.filePath);
    for (const diagnostic of result.diagnostics ?? []) {
      addDiagnostic(filePath, {
        ...lspDiagnosticToWidget(diagnostic),
        ...result.observedAt !== void 0 && {
          observedAt: result.observedAt
        }
      });
    }
  }
  const deltaDiagnostics = projectDelta?.diagnostics ?? [];
  const deltaObservedAt = parseScannedAtMs(projectDelta?.generatedAt);
  if (deltaDiagnostics.length > 0 && deltaObservedAt === void 0) {
    recordDegradationOnce({
      kind: "project-delta-generatedat-unparseable",
      subject: String(projectDelta?.generatedAt),
      reason: "projectDelta rows fell back to the fold time because generatedAt could not be parsed"
    });
  }
  for (const diagnostic of projectSnapshot?.diagnostics ?? []) {
    addDiagnostic(path37.resolve(diagnostic.filePath), projectDiagnosticToWidget(diagnostic, diagnostic.filePath));
  }
  for (const diagnostic of deltaDiagnostics) {
    const widget = projectDiagnosticToWidget(diagnostic, diagnostic.filePath);
    const observedAt = widget.observedAt ?? deltaObservedAt;
    addDiagnostic(path37.resolve(diagnostic.filePath), {
      ...widget,
      ...observedAt !== void 0 && { observedAt }
    });
  }
  return [...byFile.values()];
}
async function applyInlineSuppressionsToSummaries(summaries, cwd, policyMap) {
  return Promise.all(summaries.map(async (summary) => {
    if (!summary.diagnostics.length)
      return summary;
    let content;
    try {
      content = await fs23.readFile(summary.filePath, "utf8");
    } catch {
      const policyKept2 = applyRulePolicy(summary.diagnostics, policyMap, {
        root: cwd,
        filePath: summary.filePath
      });
      return policyKept2.length === summary.diagnostics.length ? summary : summarizeDiagnostics(summary.filePath, policyKept2, summary.hasFinalSnapshot);
    }
    const { kept: policyKept } = applyFindingPolicy(summary.diagnostics, {
      cwd,
      filePath: summary.filePath,
      content,
      policyMap
    });
    for (const d of policyKept) {
      const { weak } = anchorsForDiagnostic(cwd, summary.filePath, d, content);
      if (getDisposition(cwd, weak)?.disposition === "flagged") {
        d.flagged = true;
      }
    }
    if (policyKept.length === summary.diagnostics.length)
      return summary;
    return summarizeDiagnostics(summary.filePath, policyKept, summary.hasFinalSnapshot);
  }));
}
function shouldUseCachedProjectDiagnostics(value) {
  return value === "cached";
}
function shouldRefreshProjectDiagnostics(value) {
  return value === "cheap" || value === "all";
}
function shouldIncludeProjectRunners(value) {
  return shouldRefreshProjectDiagnostics(value) || value === "cached";
}
function foldExtraDiagnosticsIntoSnapshot(snapshot, extra, runners, cwd) {
  if (extra.length === 0)
    return snapshot;
  if (snapshot) {
    const merged = /* @__PURE__ */ new Set([...snapshot.runners, ...runners]);
    return {
      ...snapshot,
      diagnostics: [...snapshot.diagnostics, ...extra],
      runners: [...merged]
    };
  }
  return {
    version: PROJECT_DIAGNOSTICS_CACHE_VERSION,
    cwd,
    tier: "all",
    scannedAt: (/* @__PURE__ */ new Date()).toISOString(),
    diagnostics: extra,
    filesScanned: 0,
    runners
  };
}
async function getProjectDiagnosticsSnapshotForFullMode(cwd, options) {
  let loaded;
  if (shouldRefreshProjectDiagnostics(options.refreshRunners)) {
    loaded = await scanProjectDiagnostics({
      cwd,
      tier: "cheap",
      maxFiles: options.maxProjectFiles,
      signal: options.signal,
      files: options.files,
      includeGenerated: options.includeGenerated
    });
  } else if (shouldUseCachedProjectDiagnostics(options.refreshRunners)) {
    loaded = loadProjectDiagnosticsSnapshot(cwd);
  }
  if (!loaded)
    return void 0;
  const reconciled = reconcileProjectDiagnosticsSnapshot(loaded);
  if (reconciled.staleDropped > 0) {
    logLatency({
      type: "phase",
      toolName: "lens_diagnostics",
      filePath: cwd,
      phase: "project_snapshot_rows_retired",
      durationMs: 0,
      metadata: {
        files: reconciled.staleDropped,
        rows: loaded.diagnostics.length - reconciled.snapshot.diagnostics.length,
        scannedAt: loaded.scannedAt,
        // #3573: which arm retired them, now that both are reconciled.
        arm: shouldRefreshProjectDiagnostics(options.refreshRunners) ? "fresh" : "cached"
      }
    });
  }
  return reconciled.snapshot;
}
async function formatFullMode(cwd, severity, lspService, cacheManager2, options = {}) {
  const runWorkspaceDiagnostics = lspService.runWorkspaceDiagnostics;
  if (typeof runWorkspaceDiagnostics !== "function") {
    return {
      content: [
        {
          type: "text",
          text: "LSP service does not support project-wide workspace diagnostics."
        }
      ],
      details: { mode: "full", filesChecked: 0, lspUnavailable: true }
    };
  }
  const { signal, pathsScope, nextWriteIndex } = options;
  const host = options.host ?? "pi";
  const includeFile = createScopedFileFilter(cwd, pathsScope);
  const explicitFiles = pathsScope && !pathsScope.hasDirectoryEntries ? pathsScope.existingEntries : void 0;
  const projectRunnersRequested = shouldIncludeProjectRunners(options.refreshRunners);
  const analyzersPromise = projectRunnersRequested ? loadBootstrapClients().then((clients) => fetchFreshProjectDiagnostics(cacheManager2, cwd, clients, signal, {
    runtime: options.runtime,
    analysisRoot: options.analysisRoot
  })) : Promise.resolve({
    diagnostics: [],
    runners: [],
    analyzed: [],
    authoritativeCoverage: [],
    // #1623: every heavyweight analyzer is ELIGIBLE for this project but
    // this call never asked for it (refreshRunners wasn't cheap/all/
    // cached) — the expensive fetch below deliberately never runs in
    // that case (see the comment above), but rendering total silence
    // here reads exactly as "ran clean", the false-empty #1623 exists to
    // close. `ANALYZER_IDS` (fresh-fetch.ts) is the single source of
    // truth for which lanes this covers — reuse it rather than
    // hand-listing ids here.
    cold: [...ANALYZER_IDS],
    coldReasons: Object.fromEntries(ANALYZER_IDS.map((id) => [id, notRequestedReason(host)])),
    failed: [],
    timings: {}
  });
  const [rawLspResults, rawProjectSnapshot, extracted] = await Promise.all([
    runWorkspaceDiagnostics.call(lspService, cwd, {
      maxFiles: options.maxLspFiles,
      signal,
      onProgress: options.onProgress,
      onServerReady: options.onServerReady,
      nextWriteIndex: options.nextWriteIndex,
      files: explicitFiles
    }),
    getProjectDiagnosticsSnapshotForFullMode(cwd, {
      ...options,
      files: explicitFiles
    }),
    analyzersPromise
  ]);
  if (extracted.analysisRootError) {
    return {
      content: [{ type: "text", text: extracted.analysisRootError }],
      isError: true,
      details: {
        mode: "full",
        analysisRootError: extracted.analysisRootError,
        analysisRootValidation: extracted.analysisRootValidation
      }
    };
  }
  const aborted = signal?.aborted ?? false;
  const lspResults = await demoteInferredProjectSweepResults(
    rawLspResults.filter((result2) => includeFile(result2.filePath)),
    cwd,
    lspService,
    // #1645 review F1: the sweep that produced these results is signal-bounded,
    // so the probe loop that post-processes them must be too.
    signal
  );
  const mismatchedLspResults = await findFullScanBindingMismatches(lspResults);
  const confirmedLspResults = lspResults.filter((result2) => !result2.timedOut && !result2.error && !mismatchedLspResults.has(result2));
  const fullyCoveredLspResults = confirmedLspResults.filter((result2) => (result2.unconfirmedServerIds?.length ?? 0) === 0);
  const partiallyCoveredLspResults = confirmedLspResults.filter((result2) => (result2.unconfirmedServerIds?.length ?? 0) > 0);
  const unconfirmedLspResults = lspResults.filter((result2) => result2.timedOut || result2.error || mismatchedLspResults.has(result2));
  const authoritativeLspFiles = /* @__PURE__ */ new Set();
  const unreconciledFiles = /* @__PURE__ */ new Set();
  for (const result2 of fullyCoveredLspResults) {
    try {
      const diagnostics = convertLspDiagnostics(result2.diagnostics, result2.filePath, { scanOrigin: "lens_diagnostics_full" });
      const retagged = retagAuxiliaryDiagnostics(diagnostics, result2.diagnostics, "", { cwd, fileRole: detectFileRole(result2.filePath) });
      const retired = reconcileScanDiagnostics(
        result2.filePath,
        retagged,
        true,
        // The service reserves this token when the file enters the scan. The
        // fallback preserves compatibility with older test doubles/services.
        result2.writeIndex ?? nextWriteIndex?.(),
        // #1093: for a result served from the workspace-diagnostics cache,
        // `observedAt` is when it was scanned, not now(), so a mode=full
        // that only re-serves the cache can't keep a resolved finding on
        // screen by re-arming the mtime gate. #3573: for a fresh result it
        // is the sweep's read of the file.
        result2.observedAt
      );
      if (retired === true) {
        authoritativeLspFiles.add(path37.resolve(result2.filePath));
      } else {
        unreconciledFiles.add(path37.resolve(result2.filePath));
        recordDegradationOnce({
          kind: "diagnostic-retained-unreconciled",
          subject: `${path37.resolve(result2.filePath)}:lsp`,
          reason: "confirmed diagnostic result could not replace retained widget state"
        });
      }
    } catch {
      unreconciledFiles.add(path37.resolve(result2.filePath));
      recordDegradationOnce({
        kind: "diagnostic-retained-unreconciled",
        subject: `${path37.resolve(result2.filePath)}:lsp`,
        reason: "confirmed diagnostic result failed during widget reconciliation"
      });
    }
  }
  const policyMap = loadProjectRulePolicyMap(cwd);
  const scannedSnapshot = filterProjectDiagnosticsSnapshot(rawProjectSnapshot, includeFile);
  const authoritativeRunnerIds = new Set(extracted.analyzed ?? []);
  const authoritativeRunnerCoverage = extracted.authoritativeCoverage ?? [];
  const foldedProjectSnapshot = foldExtraDiagnosticsIntoSnapshot(scannedSnapshot, extracted.diagnostics.filter((d) => includeFile(d.filePath)), extracted.runners, cwd);
  const projectSnapshot = applyProjectRulePolicy(foldedProjectSnapshot, policyMap, cwd);
  const projectDelta = applyProjectRulePolicy(filterProjectDiagnosticsDeltaReport(loadProjectDiagnosticsDeltaReport(cwd), includeFile), policyMap, cwd);
  const authoritativeRetiredCount = getFileDiagnosticSummaries().filter((summary) => includeFile(summary.filePath) && authoritativeLspFiles.has(path37.resolve(summary.filePath)) && (summary.diagnostics?.length ?? 0) > 0).length;
  if (authoritativeRetiredCount > 0) {
    logLatency({
      type: "phase",
      phase: "lsp_authoritative_widget_retire",
      filePath: "",
      durationMs: 0,
      metadata: { files: authoritativeRetiredCount }
    });
  }
  const retiredRunnerCounts = /* @__PURE__ */ new Map();
  const runnerRetiredRows = getFileDiagnosticSummaries().filter((summary) => includeFile(summary.filePath)).reduce((total, summary) => total + (summary.diagnostics ?? []).filter((diagnostic) => {
    const retired = runnerRetirementDecision(diagnostic, summary.filePath, authoritativeRunnerIds, authoritativeRunnerCoverage) === "retire";
    if (retired) {
      const runnerId = runnerIdOf(diagnostic);
      retiredRunnerCounts.set(runnerId, (retiredRunnerCounts.get(runnerId) ?? 0) + 1);
    }
    return retired;
  }).length, 0);
  if (runnerRetiredRows > 0) {
    logLatency({
      type: "phase",
      phase: "runner_authoritative_widget_retire",
      filePath: "",
      durationMs: 0,
      metadata: {
        rows: runnerRetiredRows,
        runners: [...retiredRunnerCounts.keys()].join(","),
        coverage: authoritativeRunnerCoverage.map((entry) => ({
          runnerId: entry.runnerId,
          root: entry.root,
          files: entry.files.size
        }))
      }
    });
  }
  for (const entry of authoritativeRunnerCoverage) {
    if (entry.files.size === 0)
      continue;
    if (!claimPhaseOncePerSession("runner_coverage_retired", entry.runnerId)) {
      continue;
    }
    logLatency({
      type: "phase",
      phase: "runner_coverage_retired",
      filePath: "",
      durationMs: 0,
      metadata: {
        runnerId: entry.runnerId,
        count: retiredRunnerCounts.get(entry.runnerId) ?? 0
      }
    });
  }
  let summaries = await applyInlineSuppressionsToSummaries(mergeDiagnosticsWithWidgetSummaries(getFileDiagnosticSummaries().filter((summary) => includeFile(summary.filePath)), confirmedLspResults, projectSnapshot, projectDelta, authoritativeLspFiles, authoritativeRunnerIds, authoritativeRunnerCoverage), cwd, policyMap);
  if (unreconciledFiles.size > 0) {
    summaries = summaries.map((summary) => unreconciledFiles.has(path37.resolve(summary.filePath)) ? summarizeDiagnostics(summary.filePath, markUnreconciledFindings(summary.diagnostics), summary.hasFinalSnapshot) : summary);
  }
  const parsedProjectScanObservedAt = projectSnapshot?.scannedAt ? Date.parse(projectSnapshot.scannedAt) : void 0;
  const projectScanObservedAt = parsedProjectScanObservedAt !== void 0 && Number.isFinite(parsedProjectScanObservedAt) ? parsedProjectScanObservedAt : void 0;
  for (const summary of summaries) {
    reconcileCorrelatedScanDiagnostics(summary.filePath, summary.diagnostics, nextWriteIndex?.(), projectScanObservedAt);
  }
  const result = await formatAllMode(cwd, severity, summaries, {
    mode: "full",
    lspFilesChecked: rawLspResults.length,
    partial: aborted,
    projectDiagnostics: projectSnapshot === void 0 ? void 0 : {
      tier: projectSnapshot.tier,
      filesScanned: projectSnapshot.filesScanned,
      diagnostics: projectSnapshot.diagnostics.length,
      runners: projectSnapshot.runners
    },
    projectDiagnosticsDelta: projectDelta === void 0 ? void 0 : {
      diagnostics: projectDelta.diagnostics.length,
      sources: projectDelta.sources,
      turnIndex: projectDelta.turnIndex
    }
  }, 0, pathsScope);
  const missingNote = pathsScopeMissingNote(pathsScope);
  const unconfirmedByReason = tallyUnconfirmedReasons(unconfirmedLspResults, mismatchedLspResults);
  const lspServerBreakdown = tallyLspByPrimaryServer(confirmedLspResults, unconfirmedLspResults);
  const serverBreakdownClause = lspServerBreakdown.size > 1 ? ` \u2014 by server: ${formatLspServerBreakdown(lspServerBreakdown)}.` : "";
  const unconfirmedLspNote = unconfirmedLspResults.length > 0 ? `

\u26A0 LSP sweep: ${confirmedLspResults.length} file(s) confirmed via LSP, ${unconfirmedLspResults.length} unconfirmed (${formatUnconfirmedReasonClause(unconfirmedByReason)})${serverBreakdownClause} \u2014 NOT the same as 0 diagnostics for: ${unconfirmedLspResults.slice(0, 20).map((result2) => result2.filePath).join(", ")}${unconfirmedLspResults.length > 20 ? ", \u2026" : ""}. These files' LSP contribution is excluded from this result; re-run mode=full to retry them (they may still show findings above from cached/project-runner state).` : "";
  const uncoveredScannerIds = [
    ...new Set(partiallyCoveredLspResults.flatMap((result2) => result2.unconfirmedServerIds ?? []))
  ].sort((a, b) => Number(a > b) - Number(a < b));
  const auxiliaryCoverageNote = uncoveredScannerIds.length > 0 ? `

\u26A0 Auxiliary coverage incomplete: ${uncoveredScannerIds.join(", ")} did not answer for ${partiallyCoveredLspResults.length} file(s). Findings from answering servers are included; this is not a clean verdict for the named scanner lane(s).` : "";
  const lspPrimaryVsAuxiliary = tallyLspPrimaryVsAuxiliary(confirmedLspResults);
  logExtension({
    subsystem: "lsp-diagnostics",
    message: "lens_diagnostics verdict",
    metadata: {
      server: [
        ...new Set(confirmedLspResults.map((result2) => primaryServerId(result2.filePath) ?? "unknown"))
      ].join(","),
      primary: lspPrimaryVsAuxiliary.primary,
      auxiliary: lspPrimaryVsAuxiliary.auxiliary,
      total: lspPrimaryVsAuxiliary.primary + lspPrimaryVsAuxiliary.auxiliary,
      sources: [
        ...new Set(confirmedLspResults.flatMap((result2) => (result2.diagnostics ?? []).map((diagnostic) => diagnostic.source ?? "unknown")))
      ].slice(0, 5)
    }
  });
  const lspPrimaryVsAuxiliaryNote = lspPrimaryVsAuxiliary.primary + lspPrimaryVsAuxiliary.auxiliary > 0 ? `

LSP sweep findings: ${lspPrimaryVsAuxiliary.primary} primary (language server), ${lspPrimaryVsAuxiliary.auxiliary} auxiliary (ast-grep/opengrep/zizmor/typos/marksman/...).` : "";
  const abortedIds = new Set(extracted.abortedIds ?? []);
  const genuinelyColdIds = extracted.cold.filter((id) => !abortedIds.has(id));
  const partialIds = extracted.partial ?? [];
  const coldNote = extracted.unsafeRoot ? `

heavyweight analyzers skipped: the analysis root resolves at or above the home directory, so a fresh knip/jscpd/madge/gitleaks/govulncheck/trivy/dead-code scan would walk every unrelated tree under it. Supply a project directory below the home ceiling. Absence of their findings is NOT a clean verdict.` : extracted.analysisRootError ? `

heavyweight analyzers skipped: ${extracted.analysisRootError}. Supply an existing project directory below the home ceiling. Absence of their findings is NOT a clean verdict.` : !projectRunnersRequested && genuinelyColdIds.length > 0 ? `

not run this call (quick mode): ${genuinelyColdIds.join(", ")}. ${notRequestedReason(host)}. Absence of their findings is NOT a clean verdict.` : genuinelyColdIds.length > 0 ? `

cold (not applicable / unavailable this run): ${genuinelyColdIds.map((id) => formatNotRunEntry(id, extracted.coldReasons)).join(", ")}. These analyzers have not contributed to this result \u2014 absence of their findings is NOT a clean verdict.` : "";
  const partialNote = partialIds.length > 0 ? `

\u26A0 partial coverage (findings included): ${partialIds.map((id) => `${id} \u2014 ${extracted.partialReasons?.[id] ?? "coverage is incomplete"}`).join(", ")}. Coverage is incomplete, so absence of findings is NOT a clean verdict.` : "";
  const testRunnerEditScopedNote = extracted.runners.includes("test-runner") ? `

test-runner coverage is edit-scoped, NOT a full-project run: its findings only reflect the test file(s) touched by the most recent edit's turn_end fire, not a fresh whole-project test suite run (mode=full never re-runs the suite \u2014 see fresh-fetch.ts). Absence of test-runner findings elsewhere in the project is NOT a clean verdict, and presence here does not mean "just checked" \u2014 it may be from several turns ago.` : "";
  const failedAnalyzers = extracted.failed ?? [];
  const failedNote = failedAnalyzers.length > 0 ? `

failed (ran, but no trustworthy result): ${failedAnalyzers.map(({ id, summary }) => `${id} \u2014 ${summary}`).join(", ")}. These analyzers were not cached and will be retried; absence of their findings is NOT a clean verdict.` : "";
  const dispositionSuppressedByLaneText = Object.entries(extracted.dispositionSuppressedByLane ?? {}).map(([id, count]) => `${id} ${count}`).join(", ");
  const dispositionSuppressedNote = (extracted.dispositionSuppressed ?? 0) > 0 ? `

suppressed by disposition: ${extracted.dispositionSuppressed} finding(s) dropped from this result because they're marked false-positive or won't-fix (${dispositionSuppressedByLaneText}). Not a clean verdict for those locations \u2014 they were found, then intentionally hidden.` : "";
  const walkUnsafeRoot = explicitFiles === void 0 && isAtOrAboveHomeDir(cwd);
  const walkUnsafeRootNote = walkUnsafeRoot ? `

project file walk skipped: the working directory resolves at or above the home directory, so the cheap project scan and the LSP workspace sweep would each enumerate every unrelated tree under it. Re-run from inside a project directory. Absence of their findings is NOT a clean verdict.` : "";
  const scanTruncatedNoticeText = projectSnapshot ? scanTruncationNotice(projectSnapshot) : void 0;
  const scanTruncatedNote = scanTruncatedNoticeText ? `

${scanTruncatedNoticeText}` : "";
  const generatedSkipNoticeText = projectSnapshot ? generatedSkipNotice(projectSnapshot, host) : void 0;
  const generatedSkipNote = generatedSkipNoticeText ? `

${generatedSkipNoticeText}` : "";
  const cheapScanScannedAtMs = rawProjectSnapshot?.scannedAt ? Date.parse(rawProjectSnapshot.scannedAt) : void 0;
  const cheapScanStatusNote = !projectRunnersRequested ? `

cheap project scan (tree-sitter/fact-rules/ast-grep): not run this call (${notRequestedReason(host)}).` : options.refreshRunners === "cached" ? cheapScanScannedAtMs !== void 0 && Number.isFinite(cheapScanScannedAtMs) ? `

cheap project scan (tree-sitter/fact-rules/ast-grep): served from cache, ${formatCacheAgeOld(Date.now() - cheapScanScannedAtMs)} \u2014 not re-run this call.` : `

cheap project scan (tree-sitter/fact-rules/ast-grep): not run (no cached scan; refresh with refreshRunners=cheap/all to populate).` : "";
  const abortedNote = abortedIds.size > 0 ? `

stopped mid-scan (still running in the background, not reflected in this result): ${[
    ...abortedIds
  ].join(", ")}. Not a clean verdict for these \u2014 re-run mode=full to pick up their result once it's cached.` : "";
  const cachedAgeMs = extracted.cachedAgeMs ?? {};
  const timingEntries = Object.entries(extracted.timings ?? {}).filter(([id]) => !(id in cachedAgeMs));
  const freshNote = timingEntries.length > 0 ? `

fetched fresh this call: ${timingEntries.map(([id, ms]) => `${id} (${Math.round(ms)}ms)`).join(", ")}.` : "";
  const cachedAgeEntries = Object.entries(cachedAgeMs);
  const cachedAgeNote = cachedAgeEntries.length > 0 ? `

served from cache this call (not re-run): ${cachedAgeEntries.map(([id, ms]) => `${id} (${formatCacheAgeOld(ms)})`).join(", ")}.` : "";
  const resultWithCold = {
    ...result,
    details: {
      ...result.details,
      coldRunners: extracted.cold,
      partialRunners: partialIds,
      // #1623: the specific reason each cold id was skipped (single source
      // of truth: extractors.ts's `formatNotRunEntry` renders the same map
      // into the text note above) — lets a caller check WHY without parsing
      // text.
      coldReasons: extracted.coldReasons ?? {},
      failedAnalyzers,
      analyzerTimingsMs: extracted.timings,
      dispositionSuppressed: extracted.dispositionSuppressed ?? 0,
      dispositionSuppressedByLane: extracted.dispositionSuppressedByLane ?? {},
      // #1623: ms-old each cache-read-by-design lane's data was (today, only
      // test-runner) — lets a caller distinguish "just ran" from "served
      // from cache" without parsing the text note.
      analyzersCachedAgeMs: cachedAgeMs,
      analyzersAborted: extracted.aborted ?? false,
      analyzersAbortedIds: extracted.abortedIds ?? [],
      // #747: true when the fresh fetch refused an at-or-above-$HOME root —
      // lets a caller distinguish "skipped for safety" from per-analyzer
      // cold reasons without parsing the text note.
      // This is the fetch seam's explicit-root policy. The cwd walk below is
      // intentionally separate: it answers a different root question.
      analyzersUnsafeRoot: extracted.analysisRootValidation?.state === "unsafe" || extracted.unsafeRoot === true,
      analysisRootValidation: extracted.analysisRootValidation,
      // #747: true when the cwd resolved at/above $HOME so the cheap project
      // scan and the LSP workspace sweep both refused to walk — lets a caller
      // distinguish "walked nothing for safety" from a genuinely clean sweep.
      projectWalkUnsafeRoot: walkUnsafeRoot,
      // #630: confirmed/unconfirmed LSP-sweep tally, mirroring
      // `lsp_diagnostics`' confirmation state — lets a caller check "were
      // any files unconfirmed" without re-deriving it from the text.
      lspFilesConfirmed: confirmedLspResults.length,
      lspFilesUnconfirmed: unconfirmedLspResults.length,
      lspFilesPartiallyCovered: partiallyCoveredLspResults.length,
      unconfirmedLspServerIds: uncoveredScannerIds,
      unconfirmedLspFiles: unconfirmedLspResults.map((result2) => result2.filePath),
      // #646: per-primary-server breakdown of the same tally, plus the
      // primary/auxiliary findings split — mirrors `lsp_diagnostics`'
      // per-server reporting granularity (always present, even when every
      // server confirmed cleanly, so a caller can check it unconditionally).
      lspServerBreakdown: Object.fromEntries(lspServerBreakdown),
      lspPrimaryDiagnosticsCount: lspPrimaryVsAuxiliary.primary,
      lspAuxiliaryDiagnosticsCount: lspPrimaryVsAuxiliary.auxiliary,
      // #784: lets a caller check "was the cheap project scan truncated"
      // without parsing the text note.
      projectScanTruncated: projectSnapshot?.scanTruncated ?? false,
      // #1107 phase 2: same machine-readable convention, for the
      // generated-name/dir skip counters.
      ...projectSnapshot?.generatedFileSkips ? { projectGeneratedFileSkips: projectSnapshot.generatedFileSkips } : {},
      ...projectSnapshot?.generatedNameOnlySkips ? {
        projectGeneratedNameOnlySkips: projectSnapshot.generatedNameOnlySkips
      } : {},
      ...projectSnapshot?.generatedDirSkips ? { projectGeneratedDirSkips: projectSnapshot.generatedDirSkips } : {}
    }
  };
  if (aborted) {
    const timedOut = signal?.reason?.name === "TimeoutError";
    const note = timedOut ? `

\u26A0 Scan exceeded its ${Math.round((options.wallClockMs ?? 0) / 1e3)}s time budget and was stopped \u2014 results are partial. Narrow it with maxLspFiles, or raise PI_LENS_LENS_DIAGNOSTICS_FULL_TIMEOUT_MS.` : "\n\n\u26A0 Scan cancelled before completion \u2014 results are partial. Re-run with a smaller maxLspFiles to finish within budget.";
    return {
      content: [
        {
          type: "text",
          text: result.content[0].text + note + unconfirmedLspNote + auxiliaryCoverageNote + lspPrimaryVsAuxiliaryNote + partialNote + coldNote + testRunnerEditScopedNote + failedNote + dispositionSuppressedNote + walkUnsafeRootNote + scanTruncatedNote + generatedSkipNote + abortedNote + freshNote + cachedAgeNote + cheapScanStatusNote + missingNote
        }
      ],
      details: { ...resultWithCold.details, timedOut }
    };
  }
  if (missingNote || coldNote || partialNote || testRunnerEditScopedNote || failedNote || dispositionSuppressedNote || walkUnsafeRootNote || scanTruncatedNote || generatedSkipNote || abortedNote || freshNote || cachedAgeNote || cheapScanStatusNote || unconfirmedLspNote || auxiliaryCoverageNote || lspPrimaryVsAuxiliaryNote) {
    return {
      content: [
        {
          type: "text",
          text: result.content[0].text + unconfirmedLspNote + auxiliaryCoverageNote + lspPrimaryVsAuxiliaryNote + partialNote + coldNote + testRunnerEditScopedNote + failedNote + dispositionSuppressedNote + walkUnsafeRootNote + scanTruncatedNote + generatedSkipNote + abortedNote + freshNote + cachedAgeNote + cheapScanStatusNote + missingNote
        }
      ],
      details: resultWithCold.details
    };
  }
  return resultWithCold;
}
async function projectResolvedCwd(summary, cwd) {
  const resolvedCwd = await resolveLspCwdForFile(summary.filePath, cwd);
  return {
    ...summary,
    ...resolvedCwd === void 0 ? {} : { resolvedCwd },
    diagnostics: summary.diagnostics ?? []
  };
}
async function formatAllMode(cwd, severity, summaries = getFileDiagnosticSummaries(), detailOverrides = { mode: "all" }, staleDropped = 0, pathsScope, dependencyDemoted = 0) {
  const footerCapped = summaries.reduce((n, s) => n + (s.diagnostics ?? []).filter((d) => d.footerRetired === true).length, 0);
  const staleNote = (staleDropped > 0 ? ` (${staleDropped} changed file${staleDropped === 1 ? "" : "s"} omitted as stale \u2014 use mode=full to rescan)` : "") + (dependencyDemoted > 0 ? ` (${dependencyDemoted} blocking finding${dependencyDemoted === 1 ? "" : "s"} demoted to [stale] \u2014 an imported file changed since; re-run to confirm)` : "") + (footerCapped > 0 ? ` (${footerCapped} demoted finding${footerCapped === 1 ? "" : "s"} capped after ${DEPENDENCY_DRIFT_MAX_DELIVERIES} unconfirmed deliveries \u2014 no longer shown in the pi-lens footer, still listed here; re-run to confirm)` : "");
  const isFullMode = detailOverrides.mode === "full";
  const includeFile = createScopedFileFilter(cwd, pathsScope);
  const policyMap = loadProjectRulePolicyMap(cwd);
  const dispositioned = isFullMode ? summaries : summaries.map((s) => {
    const diagnostics = s.diagnostics ?? [];
    const kept = applyCachedDispositions(diagnostics, cwd, s.filePath);
    const policyKept = applyRulePolicy(kept, policyMap, {
      root: cwd,
      filePath: s.filePath
    });
    if (policyKept.length === kept.length && kept.length === diagnostics.length)
      return s;
    return summarizeDiagnostics(s.filePath, policyKept, s.hasFinalSnapshot);
  });
  const eofGated = dispositioned.map((s) => {
    const { diagnostics, demotedCount } = demotePastEofDiagnostics({
      store: "lens_diagnostics",
      cwd,
      filePath: s.filePath,
      diagnostics: s.diagnostics ?? [],
      resync: resyncDocumentOnPastEof
    });
    if (demotedCount === 0)
      return s;
    return summarizeDiagnostics(s.filePath, diagnostics, s.hasFinalSnapshot);
  });
  const visibleSummaries = eofGated.filter((s) => includeFile(s.filePath));
  const withIssues = visibleSummaries.filter((s) => {
    if (severity === "error")
      return s.blocking > 0 || s.errors > 0;
    if (severity === "warning")
      return s.blocking > 0 || s.errors > 0 || s.warnings > 0;
    return s.blocking > 0 || s.errors > 0 || s.warnings > 0 || s.advisories > 0 || (s.diagnostics ?? []).some((d) => d.stale);
  });
  const pathsNote = isFullMode ? "" : pathsScopeCacheOnlyNote(pathsScope);
  if (withIssues.length === 0) {
    const text = (visibleSummaries.length === 0 ? "No files diagnosed yet this session." : `No ${severity === "all" ? "" : severity + " "}issues across ${visibleSummaries.length} file${visibleSummaries.length === 1 ? "" : "s"} diagnosed this session. \u2713`) + staleNote + pathsNote;
    return {
      content: [{ type: "text", text }],
      details: {
        ...detailOverrides,
        filesChecked: visibleSummaries.length,
        staleDropped
      }
    };
  }
  const sorted = withIssues.sort((a, b) => b.blocking - a.blocking || b.errors - a.errors || b.warnings - a.warnings);
  const rendered = await Promise.all(sorted.map((summary2) => projectResolvedCwd(summary2, cwd)));
  const lines = [];
  let totalBlocking = 0;
  let totalErrors = 0;
  let totalWarnings = 0;
  let totalAdvisories = 0;
  for (const s of rendered) {
    const rel = path37.relative(cwd, s.filePath);
    const parts = [];
    if (s.blocking > 0)
      parts.push(`\u{1F534} ${s.blocking} blocking`);
    if (s.errors > 0 && s.blocking === 0)
      parts.push(`${s.errors}E`);
    if (s.warnings > 0)
      parts.push(`${s.warnings}W`);
    if (s.advisories > 0)
      parts.push(`${s.advisories} hint${s.advisories === 1 ? "" : "s"}`);
    if (!s.hasFinalSnapshot)
      parts.push(`(pending)`);
    const staleCount = (s.diagnostics ?? []).filter((d) => d.stale).length;
    if (staleCount > 0) {
      parts.push(`${staleCount} stale \u2014 re-run to confirm`);
    }
    if (s.resolvedCwd !== void 0)
      parts.push(`cwd=${s.resolvedCwd}`);
    lines.push(`${rel}  ${parts.join("  ")}`);
    const matching = (s.diagnostics ?? []).filter((d) => matchesSeverity(d, severity)).sort(bySeverityThenLine);
    const shown2 = matching.slice(0, MAX_DIAGNOSTICS_PER_FILE);
    for (const d of shown2) {
      const marker = d.stale ? "" : isErrorLike(d) ? d.semantic === "blocking" ? "\u{1F534} " : "" : "";
      const label = d.rule ?? d.tool;
      const tag = label ? ` [${label}]` : "";
      const flaggedTag = d.flagged ? " \u{1F4CC} flagged-to-fix" : "";
      const msg = d.message.replace(/\s+/g, " ").trim();
      const pastEof = d.stale && (d.staleReason ?? "past-eof") === "past-eof";
      const loc = pastEof ? PAST_EOF_STALE_MARKER : `L${d.line ?? "?"}`;
      const staleTag = d.stale && !pastEof ? ` ${STALE_LINE_MARKER}` : "";
      lines.push(`  ${marker}${loc}: ${msg}${tag}${flaggedTag}${staleTag}`);
    }
    if (matching.length > shown2.length) {
      lines.push(`  \u2026 ${matching.length - shown2.length} more in this file (showing ${shown2.length} of ${matching.length})`);
    }
    totalBlocking += s.blocking;
    totalErrors += s.errors;
    totalWarnings += s.warnings;
    totalAdvisories += s.advisories;
  }
  const summary = [
    `
Summary (${visibleSummaries.length} files diagnosed this session):`,
    totalBlocking > 0 ? `  \u{1F534} ${totalBlocking} blocking error${totalBlocking === 1 ? "" : "s"}` : null,
    totalBlocking === 0 && totalErrors > 0 ? `  ${totalErrors} error${totalErrors === 1 ? "" : "s"}` : null,
    totalWarnings > 0 ? `  ${totalWarnings} warning${totalWarnings === 1 ? "" : "s"}` : null,
    // #2414: reported separately from `warnings` — hint/info are style
    // opinions, not defects, and must not read as unresolved code issues.
    totalAdvisories > 0 ? `  ${totalAdvisories} hint/info (style \u2014 not counted as warnings)` : null
  ].filter(Boolean).join("\n");
  return {
    content: [
      { type: "text", text: lines.join("\n") + summary + staleNote }
    ],
    details: {
      ...detailOverrides,
      filesWithIssues: withIssues.length,
      totalBlocking,
      totalErrors,
      totalWarnings,
      totalAdvisories,
      staleDropped
    }
  };
}

// dist/tools/lsp-navigation.js
import * as nodeFs2 from "node:fs";
import * as path38 from "node:path";
import { fileURLToPath as fileURLToPath2, pathToFileURL as pathToFileURL2 } from "node:url";

// dist/tools/lsp-structured-output.js
import { fileURLToPath, pathToFileURL } from "node:url";
function asRecord(value) {
  return typeof value === "object" && value !== null ? value : void 0;
}
function finiteNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : void 0;
}
function lspStatusFromFailureKind(failureKind) {
  if (failureKind === "success" || failureKind === "fallback_success") {
    return "success";
  }
  if (failureKind === "empty_result")
    return "empty";
  if (failureKind === "unsupported")
    return "unsupported";
  if (failureKind === "bad_input" || failureKind === "invalid_operation" || failureKind === "missing_file_path") {
    return "bad_input";
  }
  if (failureKind === "no_server")
    return "no_server";
  if (failureKind === "lsp_disabled")
    return "lsp_disabled";
  if (failureKind === "filepath_is_directory")
    return "filepath_is_directory";
  if (failureKind === "tracked_snapshot")
    return "tracked_snapshot";
  return "error";
}
function lspToolLocationFromUriRange(uri, range) {
  if (typeof uri !== "string" || !uri.startsWith("file:"))
    return void 0;
  const rangeLike = asRecord(range);
  const startLine = finiteNumber(rangeLike?.start?.line);
  const startCharacter = finiteNumber(rangeLike?.start?.character);
  const endLine = finiteNumber(rangeLike?.end?.line);
  const endCharacter = finiteNumber(rangeLike?.end?.character);
  if (startLine === void 0 || startCharacter === void 0 || endLine === void 0 || endCharacter === void 0) {
    return void 0;
  }
  try {
    return {
      uri,
      filePath: fileURLToPath(uri),
      // LLM-facing coordinates: 1-based, matching editor/tool params.
      range: {
        start: {
          line: Math.floor(startLine) + 1,
          character: Math.floor(startCharacter) + 1
        },
        end: {
          line: Math.floor(endLine) + 1,
          character: Math.floor(endCharacter) + 1
        }
      }
    };
  } catch {
    return void 0;
  }
}
function lspToolLocationFromFileRange(filePath, range) {
  if (!filePath || filePath === "(workspace)")
    return void 0;
  const rangeLike = asRecord(range);
  const startLine = finiteNumber(rangeLike?.start?.line);
  const startCharacter = finiteNumber(rangeLike?.start?.character);
  const endLine = finiteNumber(rangeLike?.end?.line);
  const endCharacter = finiteNumber(rangeLike?.end?.character);
  if (startLine === void 0 || startCharacter === void 0 || endLine === void 0 || endCharacter === void 0) {
    return void 0;
  }
  return {
    uri: pathToFileURL(filePath).href,
    filePath,
    range: {
      start: {
        line: Math.floor(startLine) + 1,
        character: Math.floor(startCharacter) + 1
      },
      end: {
        line: Math.floor(endLine) + 1,
        character: Math.floor(endCharacter) + 1
      }
    }
  };
}
function pushToolLocation(out, uri, range) {
  const loc = lspToolLocationFromUriRange(uri, range);
  if (loc)
    out.push(loc);
}
function collectLocationSummaries(result, filePath) {
  const out = [];
  for (const entry of Array.isArray(result) ? result : [result]) {
    const record = asRecord(entry);
    if (!record)
      continue;
    pushToolLocation(out, record.uri, record.range);
    pushToolLocation(out, record.targetUri, record.targetSelectionRange ?? record.targetRange);
    if (!record.uri && !record.targetUri) {
      const local = lspToolLocationFromFileRange(filePath, record.range);
      let alreadyIncluded = false;
      for (const loc of out) {
        if (loc.uri === local?.uri) {
          alreadyIncluded = true;
          break;
        }
      }
      if (local && !alreadyIncluded)
        out.push(local);
    }
  }
  return out;
}
function collectWorkspaceSymbolLocationSummaries(result) {
  const out = [];
  for (const entry of Array.isArray(result) ? result : [result]) {
    const symbol = asRecord(entry);
    const location = asRecord(symbol?.location);
    if (!location)
      continue;
    pushToolLocation(out, location.uri, location.range);
    pushToolLocation(out, location.targetUri, location.targetSelectionRange ?? location.targetRange);
  }
  return out;
}
function collectCallHierarchyLocationSummaries(result, operation) {
  const out = [];
  for (const entry of Array.isArray(result) ? result : [result]) {
    const record = asRecord(entry);
    const item = asRecord(operation === "incomingCalls" ? record?.from : record?.to);
    pushToolLocation(out, item?.uri, item?.selectionRange ?? item?.range);
  }
  return out;
}
function collectLspToolLocationsForOperation(operation, result, filePath) {
  if ([
    "definition",
    "typeDefinition",
    "declaration",
    "references",
    "implementation",
    "prepareCallHierarchy"
  ].includes(operation)) {
    return collectLocationSummaries(result, filePath);
  }
  if (operation === "workspaceSymbol") {
    return collectWorkspaceSymbolLocationSummaries(result);
  }
  if (operation === "documentSymbol" || operation === "findSymbol") {
    return collectLocationSummaries(result, filePath);
  }
  if (operation === "incomingCalls" || operation === "outgoingCalls") {
    return collectCallHierarchyLocationSummaries(result, operation);
  }
  return [];
}
function parseBalancedJsonPrefix(text) {
  const trimmed = text.trim();
  const start = trimmed.search(/[[{]/);
  if (start < 0)
    return void 0;
  const open = trimmed[start];
  const close = open === "[" ? "]" : "}";
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < trimmed.length; i += 1) {
    const ch = trimmed[i];
    if (inString) {
      if (escaped)
        escaped = false;
      else if (ch === "\\")
        escaped = true;
      else if (ch === '"')
        inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === open)
      depth += 1;
    if (ch === close)
      depth -= 1;
    if (depth === 0) {
      try {
        return {
          value: JSON.parse(trimmed.slice(start, i + 1)),
          rest: trimmed.slice(i + 1).trim()
        };
      } catch {
        return void 0;
      }
    }
  }
  return void 0;
}
function parseLspNavigationTextPayload(text) {
  const notes = [];
  const hints = [];
  const errors = [];
  const trimmed = text.trim();
  if (!trimmed)
    return { notes, hints, errors };
  try {
    return { result: JSON.parse(trimmed), notes, hints, errors };
  } catch {
  }
  const lines = trimmed.split(/\r?\n/);
  let jsonCandidate = trimmed;
  if (/^Note:/i.test(lines[0] ?? "") && lines.length > 1) {
    notes.push((lines.shift() ?? "").replace(/^Note:\s*/i, ""));
    jsonCandidate = lines.join("\n").trim();
  }
  const parsed = parseBalancedJsonPrefix(jsonCandidate);
  if (parsed) {
    for (const entry of parsed.rest.split(/\r?\n/)) {
      const line = entry.trim();
      if (!line)
        continue;
      if (/^Hint:/i.test(line))
        hints.push(line.replace(/^Hint:\s*/i, ""));
      else if (/^Note:/i.test(line))
        notes.push(line.replace(/^Note:\s*/i, ""));
      else
        notes.push(line);
    }
    return { result: parsed.value, notes, hints, errors };
  }
  for (const entry of lines) {
    const line = entry.trim();
    if (!line)
      continue;
    if (/^Hint:/i.test(line))
      hints.push(line.replace(/^Hint:\s*/i, ""));
    else if (/^Note:/i.test(line))
      notes.push(line.replace(/^Note:\s*/i, ""));
    else if (/^LSP error:/i.test(line))
      errors.push(line);
    else
      notes.push(line);
  }
  return { notes, hints, errors };
}
function withoutUndefined(value) {
  for (const key of Object.keys(value)) {
    if (value[key] === void 0)
      delete value[key];
  }
  return value;
}
function buildLspNavigationEnvelope(options) {
  const parsed = parseLspNavigationTextPayload(options.text ?? "");
  const status = lspStatusFromFailureKind(options.failureKind);
  const result = parsed.result;
  const notes = [...parsed.notes];
  const hints = [...parsed.hints];
  const errors = [...parsed.errors];
  if (options.isError && errors.length === 0 && (options.text ?? "").trim()) {
    errors.push((options.text ?? "").trim());
  }
  const locations = collectLspToolLocationsForOperation(options.operation, result, options.filePath ?? "");
  return withoutUndefined({
    tool: "lsp_navigation",
    operation: options.operation,
    ok: !options.isError,
    status,
    filePath: options.filePath,
    resultCount: options.resultCount,
    result,
    locations: locations.length > 0 ? locations : void 0,
    notes: notes.length > 0 ? notes : void 0,
    hints: hints.length > 0 ? hints : void 0,
    errors: errors.length > 0 ? errors : void 0,
    metadata: options.details
  });
}

// dist/tools/lsp-navigation.js
var VALID_OPERATIONS = [
  "definition",
  "typeDefinition",
  "declaration",
  "references",
  "hover",
  "signatureHelp",
  "documentSymbol",
  "findSymbol",
  "workspaceSymbol",
  "codeAction",
  "rename",
  "rename_file",
  "implementation",
  "prepareCallHierarchy",
  "incomingCalls",
  "outgoingCalls",
  "executeCommand",
  "workspaceDiagnostics",
  "capabilities"
];
var NAVIGABLE_SYMBOL_KINDS = /* @__PURE__ */ new Set([
  5,
  // Class
  6,
  // Method
  8,
  // Field
  11,
  // Interface
  12,
  // Function
  13,
  // Variable
  22,
  // EnumMember
  23
  // Struct
]);
function normalizeOperation(value) {
  if (typeof value !== "string")
    return "";
  return value.trim().replace(/^["']+|["']+$/g, "");
}
function isValidOperation(value) {
  return VALID_OPERATIONS.includes(value);
}
function operationSupportStatus(operation, support) {
  if (!support)
    return null;
  if (operation === "definition")
    return support.definition;
  if (operation === "typeDefinition")
    return support.typeDefinition;
  if (operation === "declaration")
    return support.declaration;
  if (operation === "references")
    return support.references;
  if (operation === "hover")
    return support.hover;
  if (operation === "signatureHelp")
    return support.signatureHelp;
  if (operation === "documentSymbol" || operation === "findSymbol")
    return support.documentSymbol;
  if (operation === "workspaceSymbol")
    return support.workspaceSymbol;
  if (operation === "codeAction")
    return support.codeAction;
  if (operation === "rename")
    return support.rename;
  if (operation === "implementation")
    return support.implementation;
  if (operation === "prepareCallHierarchy" || operation === "incomingCalls" || operation === "outgoingCalls")
    return support.callHierarchy;
  return null;
}
function emptyReasonForOperation(operation) {
  if (operation === "signatureHelp")
    return "position-sensitive-or-no-signature";
  if (operation === "codeAction")
    return "no-applicable-actions";
  if (operation === "rename")
    return "no-rename-edits-or-symbol-not-renamable";
  if (operation === "rename_file")
    return "no-file-rename-result";
  if (operation === "findSymbol")
    return "no-matching-symbols";
  if (operation === "workspaceSymbol")
    return "no-matching-symbols-or-server-index-unavailable";
  if (operation === "capabilities")
    return "no-active-lsp-servers";
  if (operation === "executeCommand")
    return "command-returned-no-result";
  if (operation === "incomingCalls" || operation === "outgoingCalls")
    return "no-call-hierarchy-results";
  return "no-results";
}
function parseSymbolSelector(symbol) {
  const trimmed = symbol.trim();
  const match = /^([^#]*)(?:#(-?\d+))?$/.exec(trimmed);
  const baseSymbol = (match?.[1] ?? trimmed).trim();
  const rawOccurrence = match?.[2];
  if (!rawOccurrence)
    return { baseSymbol, occurrence: 1 };
  const occurrence = Number.parseInt(rawOccurrence, 10);
  if (!Number.isFinite(occurrence) || occurrence < 1) {
    return {
      baseSymbol,
      occurrence: 1,
      debug: `invalid occurrence selector #${rawOccurrence}; using #1`
    };
  }
  return { baseSymbol, occurrence };
}
function findNthMatch(lineText, regex, occurrence) {
  let seen = 0;
  regex.lastIndex = 0;
  let match;
  while ((match = regex.exec(lineText)) !== null) {
    seen += 1;
    if (seen === occurrence)
      return match;
    if (match[0].length === 0)
      regex.lastIndex += 1;
  }
  return null;
}
function firstNonWhitespaceCharacter(lineText) {
  const match = /\S/.exec(lineText);
  return (match?.index ?? 0) + 1;
}
function resolveSymbolColumn(content, line1, character, symbol) {
  if (typeof character === "number" && character > 0) {
    return { character, strategy: "explicit" };
  }
  const lineText = content.split(/\r?\n/)[line1 - 1] ?? "";
  if (!symbol || symbol.trim().length === 0) {
    return {
      character: 1,
      strategy: "fallback",
      debug: "character omitted and no symbol supplied; using column 1"
    };
  }
  const { baseSymbol, occurrence, debug } = parseSymbolSelector(symbol);
  if (!baseSymbol) {
    return {
      character: firstNonWhitespaceCharacter(lineText),
      requestedSymbol: symbol,
      baseSymbol,
      requestedOccurrence: occurrence,
      usedOccurrence: 1,
      strategy: "fallback",
      debug: debug ?? "empty symbol selector; using first non-whitespace column"
    };
  }
  const pattern = `\\b${escapeRegExp(baseSymbol)}\\b`;
  const exactRegex = new RegExp(pattern, "g");
  const exact = findNthMatch(lineText, exactRegex, occurrence);
  if (exact) {
    return {
      character: exact.index + 1,
      requestedSymbol: symbol,
      baseSymbol,
      requestedOccurrence: occurrence,
      usedOccurrence: occurrence,
      strategy: "word-boundary",
      debug
    };
  }
  const firstExact = findNthMatch(lineText, exactRegex, 1);
  if (firstExact && occurrence !== 1) {
    return {
      character: firstExact.index + 1,
      requestedSymbol: symbol,
      baseSymbol,
      requestedOccurrence: occurrence,
      usedOccurrence: 1,
      strategy: "word-boundary",
      debug: `${debug ? `${debug}; ` : ""}occurrence #${occurrence} not found; using #1`
    };
  }
  const insensitiveRegex = new RegExp(pattern, "gi");
  const insensitive = findNthMatch(lineText, insensitiveRegex, occurrence);
  if (insensitive) {
    return {
      character: insensitive.index + 1,
      requestedSymbol: symbol,
      baseSymbol,
      requestedOccurrence: occurrence,
      usedOccurrence: occurrence,
      strategy: "case-insensitive",
      debug: debug ?? "exact-case symbol not found; used case-insensitive match"
    };
  }
  const firstInsensitive = findNthMatch(lineText, insensitiveRegex, 1);
  if (firstInsensitive && occurrence !== 1) {
    return {
      character: firstInsensitive.index + 1,
      requestedSymbol: symbol,
      baseSymbol,
      requestedOccurrence: occurrence,
      usedOccurrence: 1,
      strategy: "case-insensitive",
      debug: `${debug ? `${debug}; ` : ""}occurrence #${occurrence} not found case-insensitively; using #1`
    };
  }
  return {
    character: firstNonWhitespaceCharacter(lineText),
    requestedSymbol: symbol,
    baseSymbol,
    requestedOccurrence: occurrence,
    usedOccurrence: 1,
    strategy: "fallback",
    debug: `${debug ? `${debug}; ` : ""}symbol not found on line; using first non-whitespace column`
  };
}
function tokenAtPosition(content, line1, char1) {
  const lines = content.split(/\r?\n/);
  const line = lines[line1 - 1];
  if (!line)
    return void 0;
  const chars = [...line];
  const idx = Math.max(0, Math.min(chars.length - 1, char1 - 1));
  const isWord = (ch) => !!ch && /[A-Za-z0-9_?!]/.test(ch);
  let left = idx;
  let right = idx;
  if (!isWord(chars[idx]) && isWord(chars[idx + 1])) {
    left = idx + 1;
    right = idx + 1;
  }
  while (left > 0 && isWord(chars[left - 1]))
    left -= 1;
  while (right < chars.length - 1 && isWord(chars[right + 1]))
    right += 1;
  const token = chars.slice(left, right + 1).join("").trim();
  return token.length > 0 ? token : void 0;
}
function symbolKindLabel(kind) {
  return kind == null ? "symbol" : SYMBOL_KIND_NAMES[kind] ?? "symbol";
}
function rangeStart(range) {
  const start = range?.start;
  return {
    line: typeof start?.line === "number" ? start.line + 1 : void 0,
    character: typeof start?.character === "number" ? start.character + 1 : void 0
  };
}
function findSymbolMatches(symbols, query, options) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery)
    return [];
  const matches = [];
  const matchesText = (symbol) => {
    const values = [symbol.name, symbol.detail].filter((value) => Boolean(value)).map((value) => value.trim().toLowerCase());
    return options.exactMatch ? values.some((value) => value === normalizedQuery) : values.some((value) => value.includes(normalizedQuery));
  };
  const matchesKind = (symbol) => {
    if (options.kinds.size === 0)
      return true;
    return options.kinds.has(symbolKindLabel(symbol.kind).toLowerCase());
  };
  const visit = (entries, depth) => {
    for (const symbol of entries) {
      if (symbol.name && matchesText(symbol) && matchesKind(symbol)) {
        const preferredRange = symbol.selectionRange ?? symbol.range;
        const start = rangeStart(preferredRange);
        matches.push({
          name: symbol.name,
          kind: symbolKindLabel(symbol.kind),
          kindCode: symbol.kind,
          detail: symbol.detail,
          line: start.line,
          character: start.character,
          depth,
          location: symbol.location,
          range: preferredRange
        });
        if (matches.length >= options.maxResults)
          return;
      }
      if (!options.topLevelOnly && symbol.children?.length) {
        visit(symbol.children, depth + 1);
        if (matches.length >= options.maxResults)
          return;
      }
    }
  };
  visit(symbols, 1);
  return matches;
}
function flattenSymbols(symbols) {
  const all = [];
  for (const symbol of symbols) {
    all.push(symbol);
    if (symbol.children && symbol.children.length > 0) {
      all.push(...flattenSymbols(symbol.children));
    }
  }
  return all;
}
function pickLocalSymbolLocation(symbols, token, filePath) {
  const flat = flattenSymbols(symbols).filter((symbol) => symbol.name === token);
  if (flat.length === 0)
    return [];
  const uri = pathToFileURL2(filePath).href;
  return flat.map((symbol) => {
    if (symbol.location?.uri && symbol.location.range) {
      return { uri: symbol.location.uri, range: symbol.location.range };
    }
    if (symbol.range) {
      return { uri, range: symbol.range };
    }
    return void 0;
  }).filter((entry) => Boolean(entry));
}
function workspaceSymbolDedupeKey(symbol) {
  const location = symbol.location;
  const start = rangeStart(location?.range ?? symbol.range ?? symbol.selectionRange);
  return [
    symbol.name ?? "",
    symbol.detail ?? "",
    symbol.kind ?? "",
    location?.uri ?? "",
    start.line ?? "",
    start.character ?? ""
  ].join(":");
}
function dedupeWorkspaceSymbols(symbols) {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  for (const symbol of symbols) {
    const key = workspaceSymbolDedupeKey(symbol);
    if (seen.has(key))
      continue;
    seen.add(key);
    out.push(symbol);
  }
  return out;
}
function asRecord2(value) {
  return typeof value === "object" && value !== null ? value : void 0;
}
function searchReadFromUriRange(uri, range) {
  if (typeof uri !== "string" || !uri.startsWith("file:"))
    return void 0;
  const rangeLike = asRecord2(range);
  const startLine = rangeLike?.start?.line;
  if (typeof startLine !== "number" || !Number.isFinite(startLine)) {
    return void 0;
  }
  const endLine = rangeLike?.end?.line;
  try {
    return {
      file: fileURLToPath2(uri),
      startLine: Math.max(1, Math.floor(startLine) + 1),
      endLine: typeof endLine === "number" && Number.isFinite(endLine) ? Math.max(1, Math.floor(endLine) + 1) : void 0
    };
  } catch {
    return void 0;
  }
}
function pushSearchRead(out, uri, range) {
  const loc = searchReadFromUriRange(uri, range);
  if (loc)
    out.push(loc);
}
function collectLocationSearchReads(result) {
  const out = [];
  for (const entry of Array.isArray(result) ? result : [result]) {
    const record = asRecord2(entry);
    if (!record)
      continue;
    pushSearchRead(out, record.uri, record.range);
    pushSearchRead(out, record.targetUri, record.targetSelectionRange ?? record.targetRange);
  }
  return out;
}
function collectWorkspaceSymbolSearchReads(result) {
  const out = [];
  for (const entry of Array.isArray(result) ? result : [result]) {
    const symbol = asRecord2(entry);
    const location = asRecord2(symbol?.location);
    if (!location)
      continue;
    pushSearchRead(out, location.uri, location.range);
    pushSearchRead(out, location.targetUri, location.targetSelectionRange ?? location.targetRange);
  }
  return out;
}
function collectCallHierarchySearchReads(result, operation, callHierarchyItem) {
  const out = [];
  for (const entry of Array.isArray(result) ? result : [result]) {
    const record = asRecord2(entry);
    if (!record)
      continue;
    const item = asRecord2(operation === "incomingCalls" ? record.from : record.to);
    pushSearchRead(out, item?.uri, item?.selectionRange ?? item?.range);
    const rangeUri = operation === "incomingCalls" ? item?.uri : callHierarchyItem?.uri;
    const fromRanges = record.fromRanges;
    if (Array.isArray(fromRanges)) {
      for (const range of fromRanges)
        pushSearchRead(out, rangeUri, range);
    }
  }
  return out;
}
function collectSearchReadsForOperation(operation, result, callHierarchyItem) {
  if ([
    "definition",
    "typeDefinition",
    "declaration",
    "references",
    "implementation"
  ].includes(operation)) {
    return collectLocationSearchReads(result);
  }
  if (operation === "workspaceSymbol") {
    return collectWorkspaceSymbolSearchReads(result);
  }
  if (operation === "incomingCalls" || operation === "outgoingCalls") {
    return collectCallHierarchySearchReads(result, operation, callHierarchyItem);
  }
  return [];
}
function formatCapabilities(snapshots, filePath) {
  if (snapshots.length === 0) {
    return filePath ? `No active LSP server for ${path38.basename(filePath)}. Open/touch the file first or run another LSP operation to start the server.` : "No active LSP servers in this session.";
  }
  const rows = [
    ["definition", (s) => !!s.operationSupport.definition],
    ["typeDefinition", (s) => !!s.operationSupport.typeDefinition],
    ["declaration", (s) => !!s.operationSupport.declaration],
    ["references", (s) => !!s.operationSupport.references],
    ["hover", (s) => !!s.operationSupport.hover],
    ["rename", (s) => !!s.operationSupport.rename],
    ["codeAction", (s) => !!s.operationSupport.codeAction],
    ["codeAction/resolve", (s) => !!s.operationSupport.codeActionResolve],
    ["workspace/willRenameFiles", (s) => !!s.operationSupport.willRenameFiles],
    ["workspaceSymbol", (s) => !!s.operationSupport.workspaceSymbol],
    ["implementation", (s) => !!s.operationSupport.implementation],
    ["signatureHelp", (s) => !!s.operationSupport.signatureHelp],
    ["incomingCalls", (s) => !!s.operationSupport.callHierarchy],
    ["outgoingCalls", (s) => !!s.operationSupport.callHierarchy],
    [
      "workspaceDiagnostics",
      (s) => s.workspaceDiagnosticsSupport.mode === "pull",
      "pull diagnostics"
    ],
    [
      "rename_file",
      () => true,
      "filesystem rename; preflight support shown above"
    ]
  ];
  const lines = [];
  for (const snapshot of snapshots) {
    const label = filePath ? `${snapshot.serverId} (${path38.basename(filePath)})` : `${snapshot.serverId} (${snapshot.root})`;
    lines.push(label);
    for (const [name, supported, note] of rows) {
      const suffix = note ? ` (${note})` : "";
      lines.push(`  ${name} ${supported(snapshot) ? "\u2713" : "\u2717"}${suffix}`);
    }
    const commands = snapshot.advertisedCommands ?? [];
    lines.push(`  executeCommand ${commands.length > 0 ? "\u2713" : "\u2717"} (${commands.length} advertised command(s)` + (commands.length > 0 ? `: ${commands.slice(0, 20).join(", ")}` : "") + ")");
  }
  return lines.join("\n");
}
function classifyCodeActions(actions) {
  if (!actions || actions.length === 0)
    return { quickfix: 0, refactor: 0, other: 0 };
  let quickfix = 0;
  let refactor = 0;
  let other = 0;
  for (const action of actions) {
    const kind = action.kind ?? "";
    if (kind.startsWith("quickfix"))
      quickfix += 1;
    else if (kind.startsWith("refactor"))
      refactor += 1;
    else
      other += 1;
  }
  return { quickfix, refactor, other };
}
async function openFileBestEffort(lspService, filePath, waitForDiagnostics = false) {
  let fileContent;
  try {
    fileContent = nodeFs2.readFileSync(filePath, "utf-8");
  } catch {
    return void 0;
  }
  if (fileContent === "")
    return "";
  try {
    await lspService.touchFile(filePath, fileContent, {
      diagnostics: waitForDiagnostics ? "document" : "none",
      source: "lsp_navigation",
      clientScope: waitForDiagnostics ? "all" : "primary"
    });
  } catch {
  }
  return fileContent;
}
var RENAME_MTIME_MARGIN_MS = 2e3;
function captureRenameExpectedContent(lspService, edit, cwd, targetFilePath, targetContent, requestedAtMs) {
  const expected = /* @__PURE__ */ new Map();
  let targetRealPath;
  if (targetContent !== void 0) {
    try {
      targetRealPath = nodeFs2.realpathSync.native(targetFilePath);
    } catch {
      targetRealPath = void 0;
    }
  }
  for (const diskPath of workspaceEditTextPaths(edit)) {
    let realPath;
    let content;
    let mtimeMs;
    try {
      realPath = nodeFs2.realpathSync.native(diskPath);
      content = nodeFs2.readFileSync(realPath, "utf-8");
      mtimeMs = nodeFs2.statSync(realPath).mtimeMs;
    } catch {
      continue;
    }
    if (targetContent !== void 0 && realPath === targetRealPath) {
      expected.set(realPath, targetContent);
      continue;
    }
    const tracked = lspService.getTrackedContent(diskPath, cwd);
    const firstOpenedAfterRequest = tracked !== void 0 && (tracked.openedAtMs ?? 0) >= requestedAtMs;
    const quietSinceClientStart = tracked?.clientStartedAtMs !== void 0 && mtimeMs < tracked.clientStartedAtMs - RENAME_MTIME_MARGIN_MS;
    const sent = firstOpenedAfterRequest && quietSinceClientStart ? void 0 : tracked;
    if (sent !== void 0) {
      if (sent.hash !== hashDiagnosticContent(content) || (sent.changedAtMs ?? requestedAtMs) >= requestedAtMs) {
        refuseStaleWorkspaceEdit(diskPath, "it changed after the language server computed the rename from it");
      }
    } else if (tracked !== void 0 && (tracked.hash !== hashDiagnosticContent(content) || tracked.openedHash !== tracked.hash)) {
      refuseStaleWorkspaceEdit(diskPath, "it changed after the language client first opened it, after the rename was requested");
    } else if (mtimeMs >= requestedAtMs) {
      refuseStaleWorkspaceEdit(diskPath, "it was written after the rename was requested and the language server has no open copy, so it may not have read these bytes");
    } else if (mtimeMs >= requestedAtMs - RENAME_MTIME_MARGIN_MS) {
      refuseStaleWorkspaceEdit(diskPath, `it was modified within ${RENAME_MTIME_MARGIN_MS / 1e3} s of the rename request; retry`);
    }
    expected.set(realPath, content);
  }
  return expected;
}
function createLspNavigationTool(getFlag, mutationDeps) {
  return {
    name: "lsp_navigation",
    label: "LSP Navigate",
    description: 'Navigate source with language-server operations such as definition, references, hover, and rename. Example: use `{operation: "references", path: "src/app.ts", line: 12}`.',
    promptSnippet: "Navigate definitions and references with LSP",
    renderResult: compactRenderResult(({ details, args, isError, text }) => {
      const op = details?.operation ?? (typeof args.operation === "string" ? args.operation : "lsp");
      if (isError || details?.supported === false) {
        return `lsp_navigation ${op} \u2014 ${details?.emptyReason ?? text.split("\n")[0] ?? "unavailable"}`;
      }
      const n = details?.resultCount ?? 0;
      if (n === 0) {
        return `lsp_navigation ${op} \u2014 ${details?.emptyReason ?? "no results"}`;
      }
      return `lsp_navigation ${op} \u2014 ${n} result${n === 1 ? "" : "s"}`;
    }),
    parameters: Type.Object({
      operation: Type.String({
        description: "LSP operation to perform. Valid values: definition, typeDefinition, declaration, references, hover, signatureHelp, documentSymbol, findSymbol, workspaceSymbol, codeAction, rename, rename_file, implementation, prepareCallHierarchy, incomingCalls, outgoingCalls, executeCommand, workspaceDiagnostics, capabilities."
      }),
      path: Type.Optional(Type.String({
        description: "Target file path."
      })),
      line: Type.Optional(Type.Number({
        description: "1-based line number."
      })),
      character: Type.Optional(Type.Number({
        description: "1-based character offset."
      })),
      symbol: Type.Optional(Type.String({
        description: "Symbol for automatic character resolution."
      })),
      endLine: Type.Optional(Type.Number({
        description: "1-based range end line."
      })),
      endCharacter: Type.Optional(Type.Number({
        description: "1-based range end character."
      })),
      newName: Type.Optional(Type.String({
        description: "New symbol name."
      })),
      newFilePath: Type.Optional(Type.String({
        description: "New file path."
      })),
      apply: Type.Optional(Type.Boolean({
        description: "Apply a mutation instead of previewing it."
      })),
      command: Type.Optional(Type.String({
        description: "Server command identifier."
      })),
      commandArguments: Type.Optional(Type.Array(Type.Unknown(), {
        description: "Arguments for the server command."
      })),
      query: Type.Optional(Type.String({
        description: "Symbol search query."
      })),
      kinds: Type.Optional(Type.Array(Type.String(), {
        description: "Symbol-kind filters."
      })),
      exactMatch: Type.Optional(Type.Boolean({
        description: "Require an exact symbol match."
      })),
      topLevelOnly: Type.Optional(Type.Boolean({
        description: "Exclude nested symbols."
      })),
      maxResults: Type.Optional(Type.Number({
        description: "Maximum symbol matches."
      })),
      callHierarchyItem: Type.Optional(Type.Object({
        name: Type.String(),
        kind: Type.Number(),
        uri: Type.String(),
        range: Type.Object({
          start: Type.Object({
            line: Type.Number(),
            character: Type.Number()
          }),
          end: Type.Object({
            line: Type.Number(),
            character: Type.Number()
          })
        }),
        selectionRange: Type.Object({
          start: Type.Object({
            line: Type.Number(),
            character: Type.Number()
          }),
          end: Type.Object({
            line: Type.Number(),
            character: Type.Number()
          })
        })
      }, {}))
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const session = mutationDeps?.runtime?.captureSessionGeneration?.();
      const startedAt = Date.now();
      let supported = null;
      let diagnosticsMode = "unknown";
      let columnResolution;
      let openedFileContent;
      let renameRequestedAtMs = 0;
      let mutationContext;
      let requestedApply = false;
      const workspaceScopeAttribution = {};
      const finalize = (payload, meta) => {
        if (payload.isError && requestedApply && mutationContext && ["rename", "rename_file", "executeCommand"].includes(meta.operation)) {
          recordLspMutationOutcome(mutationContext, "failed");
        }
        const normalizedFilePath = meta.filePath.replace(/\\/g, "/");
        logLatency({
          type: "phase",
          phase: "lsp_navigation_result",
          filePath: normalizedFilePath,
          durationMs: Date.now() - startedAt,
          metadata: {
            operation: meta.operation,
            failureKind: meta.failureKind,
            resultCount: meta.resultCount,
            supported,
            diagnosticsMode,
            columnResolution,
            ...Object.keys(workspaceScopeAttribution).length > 0 ? { workspaceScopeAttribution } : {}
          }
        });
        const text = payload.content[0]?.text ?? "";
        const envelope = buildLspNavigationEnvelope({
          operation: meta.operation,
          filePath: meta.filePath,
          failureKind: meta.failureKind,
          resultCount: meta.resultCount,
          text,
          isError: payload.isError,
          details: payload.details
        });
        return {
          ...payload,
          content: [
            {
              type: "text",
              // Compact JSON: omit indentation. Saves ~50% on rename / workspace-edits payloads
              // while keeping the envelope machine-parseable. Tests use JSON.parse so
              // they are agnostic to whitespace.
              text: JSON.stringify(envelope)
            }
          ],
          details: {
            ...payload.details,
            failureKind: meta.failureKind
          }
        };
      };
      if (getFlag("no-lsp", ctx.cwd)) {
        return finalize({
          content: [
            {
              type: "text",
              text: "lsp_navigation requires LSP to be enabled. Remove --no-lsp to use LSP navigation."
            }
          ],
          isError: true
        }, {
          operation: "precheck",
          filePath: "(workspace)",
          failureKind: "lsp_disabled",
          resultCount: 0
        });
      }
      const { operation: rawOperation, path: rawPath, line, character, symbol, endLine, endCharacter, newName, newFilePath, apply, command, commandArguments, query, kinds, exactMatch, topLevelOnly, maxResults, callHierarchyItem } = params;
      const normalizedOperation = normalizeOperation(rawOperation);
      if (!isValidOperation(normalizedOperation)) {
        return finalize({
          content: [
            {
              type: "text",
              text: `Unknown lsp_navigation operation "${normalizedOperation || String(rawOperation ?? "") || ""}". Valid operations: ${VALID_OPERATIONS.join(", ")}`
            }
          ],
          isError: true,
          details: {
            rawOperation,
            normalizedOperation,
            validOperations: VALID_OPERATIONS
          }
        }, {
          operation: normalizedOperation || "invalid",
          filePath: "(workspace)",
          failureKind: "invalid_operation",
          resultCount: 0
        });
      }
      const operation = normalizedOperation;
      requestedApply = apply === true;
      if (requestedApply && ["rename", "rename_file", "executeCommand"].includes(operation)) {
        const cwd = ctx.cwd || ".";
        const mutationSource = operation === "executeCommand" ? "lsp-execute-command" : "lsp-rename";
        mutationContext = {
          cwd,
          sessionId: ctx.sessionManager?.getSessionId?.(),
          correlationId: newLspMutationCorrelationId(_toolCallId),
          // #4187 R4-1: the call whose `tool_call` licensed the paths it
          // named; the workspace edit's other files (a rename's importers)
          // are unlicensed, so they end an authorship instead of advancing it.
          toolCallId: _toolCallId,
          tool: `lsp_navigation:${operation}`,
          source: mutationSource,
          ...mutationDeps,
          session,
          readGuard: getFlag("no-read-guard", cwd) ? void 0 : mutationDeps?.readGuard,
          // #2450 review round 2 (F4)/round 3 (F2, F4): the SAME gate
          // `registerMutationBridge` applies internally in `index.ts`, so
          // this directly-threaded path and the bridge fallback
          // (`clients/lsp-mutation.ts`, reached when `mutationDeps` is
          // absent/partial — e.g. the MCP server) agree on which files
          // count as project source, rather than the direct path
          // recording an ignored/vendor write the fallback would drop.
          // `no-read-guard` is intentionally NOT checked here (round 3
          // F2): it gates only the read-guard stamp above, the same
          // canonical split `clients/runtime-tool-result.ts` applies
          // (`:1120`, `:1485`) — bookkeeping (turn-state / receipts)
          // still runs under `--no-read-guard`. Judge against the
          // project root, not the request `cwd` (round 3 F4): a
          // sub-package `cwd` must not read a sibling-package rename as
          // external.
          isRecordable: (filePath2) => {
            return isRecordableProjectPath(filePath2, mutationDeps?.runtime?.projectRoot ?? cwd);
          }
        };
      }
      const isCallHierarchyTraversal = operation === "incomingCalls" || operation === "outgoingCalls";
      const needsFilePath = operation !== "workspaceDiagnostics" && operation !== "workspaceSymbol" && operation !== "executeCommand" && operation !== "capabilities" && !isCallHierarchyTraversal;
      if (needsFilePath && (!rawPath || rawPath.trim().length === 0)) {
        return finalize({
          content: [
            {
              type: "text",
              text: `path is required for ${operation}`
            }
          ],
          isError: true
        }, {
          operation,
          filePath: "(workspace)",
          failureKind: "missing_file_path",
          resultCount: 0
        });
      }
      const filePath = rawPath ? path38.isAbsolute(rawPath) ? rawPath : path38.resolve(ctx.cwd || ".", rawPath) : "";
      let filePathIsDirectory = false;
      if (filePath) {
        try {
          filePathIsDirectory = nodeFs2.statSync(filePath).isDirectory();
        } catch {
        }
      }
      const lspService = getLSPService();
      if (operation === "capabilities") {
        const snapshots = rawPath ? await lspService.getCapabilitySnapshots(filePath) : await lspService.getCapabilitySnapshots(void 0, workspaceScopeAttribution);
        const output2 = formatCapabilities(snapshots, rawPath ? filePath : void 0);
        return finalize({
          content: [{ type: "text", text: output2 }],
          details: {
            operation,
            resultCount: snapshots.length,
            servers: snapshots.map((snapshot) => snapshot.serverId)
          }
        }, {
          operation,
          filePath: rawPath ? filePath : "(workspace)",
          failureKind: snapshots.length === 0 ? "empty_result" : "success",
          resultCount: snapshots.length
        });
      }
      if (operation === "workspaceDiagnostics") {
        const wsDiagSupport = rawPath ? await lspService.getWorkspaceDiagnosticsSupport(filePath) : await lspService.getWorkspaceDiagnosticsSupport(void 0, workspaceScopeAttribution);
        diagnosticsMode = wsDiagSupport?.mode ?? "unknown";
        if (rawPath && !filePathIsDirectory) {
          const hasLSP2 = lspService.supportsLSP(filePath);
          if (!hasLSP2) {
            return finalize({
              content: [
                {
                  type: "text",
                  text: `No LSP server available for ${path38.basename(filePath)}. Check that the language server is installed.`
                }
              ],
              isError: true
            }, {
              operation,
              filePath,
              failureKind: "no_server",
              resultCount: 0
            });
          }
          await openFileBestEffort(lspService, filePath, true);
          const diagnostics = await lspService.getDiagnostics(filePath);
          const result3 = [
            {
              filePath,
              diagnostics,
              count: diagnostics.length
            }
          ];
          const noteMap = {
            pull: "Note: path mode requests pull diagnostics for this file and returns the aggregated result",
            "push-only": "Note: server is push-only; result depends on published diagnostics for this file"
          };
          const note2 = noteMap[diagnosticsMode] ?? "Note: workspace diagnostics mode unknown (no active capability snapshot)";
          const resultCount2 = diagnostics.length;
          return finalize({
            content: [
              {
                type: "text",
                text: `${note2}
${JSON.stringify(result3)}`
              }
            ],
            details: {
              operation,
              resultCount: resultCount2,
              diagnosticsMode,
              coverage: "requested-file"
            }
          }, {
            operation,
            filePath,
            failureKind: resultCount2 === 0 ? "empty_result" : "success",
            resultCount: resultCount2
          });
        }
        const allDiagnostics = await lspService.getAllDiagnostics();
        const result2 = Array.from(allDiagnostics.entries()).map(([trackedFile, { diags }]) => ({
          filePath: trackedFile,
          diagnostics: diags,
          count: diags.length
        }));
        const noteMap2 = {
          "push-only": "Note: push-only tracked diagnostics snapshot (not full workspace pull diagnostics).",
          pull: "Note: tracked diagnostics snapshot from active clients. Provide path to force file-level diagnostics collection"
        };
        const note = noteMap2[diagnosticsMode] ?? "Note: workspace diagnostics mode unknown (no active capability snapshot)";
        return finalize({
          content: [
            {
              type: "text",
              text: `${note}
${JSON.stringify(result2)}`
            }
          ],
          details: {
            operation,
            resultCount: result2.length,
            diagnosticsMode,
            coverage: "tracked-open-files"
          }
        }, {
          operation,
          filePath: rawPath ? filePath : "(workspace)",
          failureKind: diagnosticsMode === "push-only" ? "tracked_snapshot" : "success",
          resultCount: result2.length
        });
      }
      if (needsFilePath && filePathIsDirectory) {
        return finalize({
          content: [
            {
              type: "text",
              text: `path must be a source file, got directory: ${filePath}. Pass a source file path, or omit path for workspace-level operations.`
            }
          ],
          isError: true
        }, {
          operation,
          filePath,
          failureKind: "filepath_is_directory",
          resultCount: 0
        });
      }
      const hasLSP = filePath ? lspService.supportsLSP(filePath) : false;
      if (needsFilePath && !hasLSP) {
        return finalize({
          content: [
            {
              type: "text",
              text: `No LSP server available for ${path38.basename(filePath)}. Check that the language server is installed.`
            }
          ],
          isError: true
        }, {
          operation,
          filePath,
          failureKind: "no_server",
          resultCount: 0
        });
      }
      if (needsFilePath) {
        const support = await lspService.getOperationSupport(filePath);
        supported = operationSupportStatus(operation, support);
        if (supported === false) {
          return finalize({
            content: [
              {
                type: "text",
                text: `LSP server for ${path38.basename(filePath)} does not advertise support for ${operation}`
              }
            ],
            isError: true,
            details: {
              operation,
              supported: false,
              emptyReason: "unsupported"
            }
          }, { operation, filePath, failureKind: "unsupported", resultCount: 0 });
        }
        openedFileContent = await openFileBestEffort(lspService, filePath);
      }
      const lspLine = (line ?? 1) - 1;
      const needsPosition = [
        "definition",
        "typeDefinition",
        "declaration",
        "references",
        "hover",
        "signatureHelp",
        "codeAction",
        "rename",
        "implementation",
        "prepareCallHierarchy"
      ].includes(operation);
      const resolvedCharacter = needsPosition && filePath ? resolveSymbolColumn(nodeFs2.existsSync(filePath) ? nodeFs2.readFileSync(filePath, "utf-8") : "", line ?? 1, character, symbol) : {
        character: character ?? 1,
        strategy: "explicit"
      };
      columnResolution = resolvedCharacter;
      const lspChar = resolvedCharacter.character - 1;
      const lspEndLine = (endLine ?? line ?? 1) - 1;
      const lspEndChar = (endCharacter ?? resolvedCharacter.character) - 1;
      const runWorkspaceSymbolOperation = async () => {
        const support = rawPath ? await lspService.getOperationSupport(filePath) : await lspService.getOperationSupport(void 0, workspaceScopeAttribution);
        supported = operationSupportStatus(operation, support);
        if (supported === false) {
          throw new Error("__UNSUPPORTED__ Active LSP server does not advertise support for workspaceSymbol");
        }
        if (!query || query.trim().length === 0) {
          throw new Error("__BADINPUT__ query parameter required for workspaceSymbol");
        }
        if (rawPath) {
          await openFileBestEffort(lspService, filePath);
        }
        try {
          const raw = rawPath ? await lspService.workspaceSymbol(query ?? "", filePath) : await lspService.workspaceSymbol(query ?? "", void 0, workspaceScopeAttribution);
          const filtered = (Array.isArray(raw) ? raw : [raw]).filter((s) => typeof s === "object" && s !== null && (!s.kind || NAVIGABLE_SYMBOL_KINDS.has(s.kind)));
          return dedupeWorkspaceSymbols(filtered).slice(0, 15);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (rawPath && /No Project/i.test(msg)) {
            await openFileBestEffort(lspService, filePath);
            await new Promise((resolve32) => setTimeout(resolve32, 120));
            const retryRaw = await lspService.workspaceSymbol(query ?? "", filePath);
            const retrySymbols = (Array.isArray(retryRaw) ? retryRaw : [retryRaw]).filter((s) => typeof s === "object" && s !== null);
            return dedupeWorkspaceSymbols(retrySymbols);
          }
          throw err;
        }
      };
      const runOperation = async () => {
        switch (operation) {
          case "definition":
            return lspService.definition(filePath, lspLine, lspChar);
          case "typeDefinition":
            return lspService.typeDefinition(filePath, lspLine, lspChar);
          case "declaration":
            return lspService.declaration(filePath, lspLine, lspChar);
          case "references":
            return lspService.references(filePath, lspLine, lspChar);
          case "hover":
            return lspService.hover(filePath, lspLine, lspChar);
          case "signatureHelp":
            return lspService.signatureHelp(filePath, lspLine, lspChar);
          case "documentSymbol":
            return lspService.documentSymbol(filePath);
          case "findSymbol": {
            if (!query || query.trim().length === 0) {
              throw new Error("__BADINPUT__ query parameter required for findSymbol");
            }
            const symbols = await lspService.documentSymbol(filePath);
            return findSymbolMatches(symbols, query, {
              maxResults: Math.max(1, Math.min(100, maxResults ?? 20)),
              topLevelOnly: topLevelOnly ?? false,
              exactMatch: exactMatch ?? false,
              kinds: new Set((kinds ?? []).map((kind) => kind.trim().toLowerCase()).filter(Boolean))
            });
          }
          case "workspaceSymbol":
            return runWorkspaceSymbolOperation();
          case "codeAction":
            return lspService.codeAction(filePath, lspLine, lspChar, lspEndLine, lspEndChar);
          case "rename": {
            if (!newName || newName.trim().length === 0) {
              throw new Error("__BADINPUT__ newName parameter required for rename");
            }
            renameRequestedAtMs = Date.now();
            const edit = await lspService.rename(filePath, lspLine, lspChar, newName);
            if (!edit)
              return null;
            if (!apply) {
              return {
                applied: false,
                summary: summarizeWorkspaceEdit(edit, ctx.cwd || "."),
                edit
              };
            }
            const applied = await applyWorkspaceEdit(edit, ctx.cwd || ".", {
              mutationContext,
              // #3601: the server computed this edit from the bytes each touched
              // file held when it answered. A file that changed in between is
              // refused inside pi's queue, before any write, so the edit never
              // lands on text it was not computed for.
              expectedContent: captureRenameExpectedContent(lspService, edit, ctx.cwd || ".", filePath, openedFileContent, renameRequestedAtMs)
            });
            for (const touchedFile of applied.files) {
              try {
                await openFileBestEffort(lspService, touchedFile, false);
              } catch {
              }
            }
            return { applied: true, ...applied };
          }
          case "rename_file": {
            if (!newFilePath || newFilePath.trim().length === 0) {
              throw new Error("__BADINPUT__ newFilePath parameter required for rename_file");
            }
            const resolvedNewFilePath = path38.isAbsolute(newFilePath) ? newFilePath : path38.resolve(ctx.cwd || ".", newFilePath);
            const result2 = await lspService.renameFile(filePath, resolvedNewFilePath, {
              cwd: ctx.cwd || ".",
              apply: apply ?? false,
              ...mutationContext ? { mutationContext } : {}
            });
            if (result2.applied) {
              for (const touchedFile of result2.files ?? []) {
                try {
                  await openFileBestEffort(lspService, touchedFile, false);
                } catch {
                }
              }
            }
            return result2;
          }
          case "implementation":
            return lspService.implementation(filePath, lspLine, lspChar);
          case "prepareCallHierarchy":
            return lspService.prepareCallHierarchy(filePath, lspLine, lspChar);
          case "executeCommand": {
            if (!command || command.trim().length === 0) {
              throw new Error("__BADINPUT__ command parameter required for executeCommand");
            }
            const advertised = rawPath ? await lspService.getAdvertisedCommands(filePath) : await lspService.getAdvertisedCommands(void 0, workspaceScopeAttribution);
            const isAdvertised = advertised.includes(command);
            if (apply !== true) {
              return {
                executed: false,
                dryRun: true,
                command,
                advertised: isAdvertised,
                advertisedCommands: advertised,
                note: isAdvertised ? "Command is advertised. Re-run with apply:true to execute." : "Command is NOT advertised by the active server; execution would be refused."
              };
            }
            if (!isAdvertised) {
              throw new Error(`__UNSUPPORTED__ command "${command}" is not advertised by the active LSP server (advertised: ${advertised.join(", ") || "none"})`);
            }
            return rawPath ? lspService.executeCommand(filePath, command, commandArguments, mutationContext) : lspService.executeCommand(void 0, command, commandArguments, mutationContext, workspaceScopeAttribution);
          }
          case "incomingCalls": {
            if (!callHierarchyItem) {
              throw new Error("__BADINPUT__ callHierarchyItem parameter required for incomingCalls");
            }
            supported = operationSupportStatus(operation, await lspService.getOperationSupport(uriToPath(callHierarchyItem.uri)));
            if (supported === false) {
              throw new Error("__UNSUPPORTED__ Active LSP server does not advertise support for incomingCalls");
            }
            return lspService.incomingCalls(callHierarchyItem);
          }
          case "outgoingCalls": {
            if (!callHierarchyItem) {
              throw new Error("__BADINPUT__ callHierarchyItem parameter required for outgoingCalls");
            }
            supported = operationSupportStatus(operation, await lspService.getOperationSupport(uriToPath(callHierarchyItem.uri)));
            if (supported === false) {
              throw new Error("__UNSUPPORTED__ Active LSP server does not advertise support for outgoingCalls");
            }
            return lspService.outgoingCalls(callHierarchyItem);
          }
          default:
            return [];
        }
      };
      let result;
      let usedDocumentSymbolFallback = false;
      try {
        result = await runOperation();
        const isEmptyInitial = !result || Array.isArray(result) && result.length === 0;
        const shouldRetryOnEmpty = isEmptyInitial && needsFilePath && [
          "definition",
          "typeDefinition",
          "declaration",
          "references",
          "hover",
          "signatureHelp",
          "codeAction",
          "rename",
          "implementation"
        ].includes(operation);
        if (shouldRetryOnEmpty) {
          openedFileContent = await openFileBestEffort(lspService, filePath, true);
          result = await runOperation();
        }
        const stillEmpty = !result || Array.isArray(result) && result.length === 0;
        if (stillEmpty && needsFilePath && operation === "definition") {
          const content = nodeFs2.readFileSync(filePath, "utf-8");
          const token = line && character ? tokenAtPosition(content, line, character) : void 0;
          if (token) {
            const docSymbols = await lspService.documentSymbol(filePath);
            const locations = pickLocalSymbolLocation(docSymbols, token, filePath);
            if (locations.length > 0) {
              result = locations;
              usedDocumentSymbolFallback = true;
            }
          }
        }
        if (mutationContext && requestedApply && !mutationContext.summaryEmitted) {
          const outcome = operation === "rename_file" && result && typeof result === "object" && "applied" in result && result.applied === false ? "failed" : operation === "executeCommand" && result && typeof result === "object" && "executed" in result && result.executed === false ? "failed" : "skipped";
          recordLspMutationOutcome(mutationContext, outcome);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.startsWith("__UNSUPPORTED__ ")) {
          return finalize({
            content: [
              {
                type: "text",
                text: msg.replace("__UNSUPPORTED__ ", "")
              }
            ],
            isError: true,
            details: {
              operation,
              supported: false,
              emptyReason: "unsupported"
            }
          }, { operation, filePath, failureKind: "unsupported", resultCount: 0 });
        }
        if (msg.startsWith("__BADINPUT__ ")) {
          return finalize({
            content: [
              {
                type: "text",
                text: msg.replace("__BADINPUT__ ", "")
              }
            ],
            isError: true,
            details: {}
          }, { operation, filePath, failureKind: "bad_input", resultCount: 0 });
        }
        return finalize({
          content: [
            {
              type: "text",
              text: `LSP error: ${err instanceof Error ? err.message : String(err)}`
            }
          ],
          isError: true,
          details: {}
        }, { operation, filePath, failureKind: "lsp_error", resultCount: 0 });
      }
      const isEmpty = !result || Array.isArray(result) && result.length === 0;
      const fileCtx = filePath ? " at " + path38.basename(filePath) : "";
      const lineCtx = line ? ":" + line + ":" + character : "";
      let output = isEmpty ? "No results for " + operation + fileCtx + lineCtx : JSON.stringify(result);
      if (isEmpty && operation === "workspaceSymbol" && !rawPath) {
        output += "\nHint: provide path to scope workspaceSymbol to the active language server/root.";
      }
      if (usedDocumentSymbolFallback) {
        output += "\nNote: served from documentSymbol fallback due to empty primary result.";
      }
      if (operation === "references" && Array.isArray(result) && result.length <= 2) {
        output += "\nHint: references from usage sites can be partial; retry from the symbol definition for broader cross-file results.";
      }
      const actionStats = operation === "codeAction" && Array.isArray(result) ? classifyCodeActions(result) : null;
      if (operation === "codeAction" && actionStats) {
        if (actionStats.quickfix === 0 && actionStats.refactor > 0) {
          output += "\nNote: no diagnostic quick fixes returned; refactor-only actions available.";
        }
      }
      const resultCount = Array.isArray(result) ? result.length : result ? 1 : 0;
      const searchReads = collectSearchReadsForOperation(operation, result, callHierarchyItem);
      return finalize({
        content: [{ type: "text", text: output }],
        details: {
          operation,
          supported,
          searchReads: searchReads.length > 0 ? searchReads : void 0,
          emptyReason: isEmpty ? emptyReasonForOperation(operation) : void 0,
          codeActionKinds: actionStats ?? void 0,
          columnResolution: columnResolution?.strategy === "explicit" ? void 0 : columnResolution,
          resultCount
        }
      }, {
        operation,
        filePath: rawPath ? filePath : "(workspace)",
        failureKind: isEmpty ? "empty_result" : usedDocumentSymbolFallback ? "fallback_success" : "success",
        resultCount
      });
    }
  };
}

// dist/mcp/tool-arguments.js
var MAX_REPORTED_KEYS = 8;
var MAX_REPORTED_KEY_CHARS = 64;
function withinOneEdit(a, b) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i])
    i++;
  if (a.length === b.length)
    return a.slice(i + 1) === b.slice(i + 1);
  return a.length < b.length ? a.slice(i) === b.slice(i + 1) : b.slice(i) === a.slice(i + 1);
}
function nearestDeclaredKey(key, declared) {
  const fold = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
  const folded = fold(key);
  let best;
  for (const candidate of declared) {
    const other = fold(candidate);
    const contained = Math.min(folded.length, other.length) >= 3 && (folded.includes(other) || other.includes(folded));
    if (!contained && !withinOneEdit(folded, other))
      continue;
    const score = Math.abs(folded.length - other.length);
    if (!best || score < best.score)
      best = { key: candidate, score };
  }
  return best?.key;
}
function tokensOf(key) {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase().split(/[^a-z0-9]+/).map((token) => token.replace(/s$/, "")).filter(Boolean);
}
var NON_LOCATOR_QUALIFIERS = /* @__PURE__ */ new Set([
  "max",
  "min",
  "num",
  "count",
  "total",
  "include",
  "exclude",
  "out",
  "output"
]);
function classifyKey(key, declared) {
  const tokens = tokensOf(key);
  const folded = tokens.join("");
  const declaredFolds = new Set(declared.map((name) => tokensOf(name).join("")));
  const equal = [];
  const suffix = [];
  const retargeted = [];
  for (const candidate of declared) {
    const wanted = tokensOf(candidate);
    if (wanted.length === 0)
      continue;
    if (folded === wanted.join("")) {
      equal.push(candidate);
      continue;
    }
    if (tokens.slice(-wanted.length).join(" ") !== wanted.join(" "))
      continue;
    const qualifier = tokens.slice(0, -wanted.length);
    const retargets = declaredFolds.has(qualifier.join("")) || qualifier.some((token) => NON_LOCATOR_QUALIFIERS.has(token));
    (retargets ? retargeted : suffix).push(candidate);
  }
  return equal.length > 0 ? { matches: equal, retargeted: [] } : { matches: suffix, retargeted };
}
function findIgnoredArguments(schema, args) {
  const properties = schema.properties ?? {};
  const declared = Object.keys(properties);
  const unsentSuggestions = [];
  const ignored = Object.keys(args).filter((key) => !Object.hasOwn(properties, key)).map((key) => {
    const { matches, retargeted } = classifyKey(key, declared);
    const unsent = matches.some((match) => Object.hasOwn(args, match)) ? void 0 : matches[0];
    if (unsent !== void 0 && !unsentSuggestions.some((entry) => entry.suggestion === unsent))
      unsentSuggestions.push({ key, suggestion: unsent });
    const suggestion = matches[0] ?? nearestDeclaredKey(key, declared.filter((name) => !retargeted.includes(name)));
    return suggestion === void 0 ? { key } : { key, suggestion };
  });
  if (ignored.length === 0)
    return void 0;
  const missingRequired = (schema.required ?? []).filter((key) => !Object.hasOwn(args, key));
  return { ignored, missingRequired, unsentSuggestions };
}
function shown(key) {
  return key.length > MAX_REPORTED_KEY_CHARS ? `${key.slice(0, MAX_REPORTED_KEY_CHARS)}\u2026` : key;
}
function ignoredArgumentsLine(tool, report) {
  const listed = report.ignored.slice(0, MAX_REPORTED_KEYS).map((entry) => {
    const hint = entry.suggestion ? ` (did you mean \`${entry.suggestion}\`?)` : "";
    return `\`${shown(entry.key)}\`${hint}`;
  });
  const more = report.ignored.length - listed.length;
  const tail = more > 0 ? ` and ${more} more` : "";
  return `Ignored unknown argument(s) for ${tool}: ${listed.join(", ")}${tail}. They had no effect on this call.`;
}
function ignoredArgumentsStructured(report) {
  return {
    ignoredArguments: report.ignored.slice(0, MAX_REPORTED_KEYS).map((entry) => shown(entry.key)),
    ignoredArgumentCount: report.ignored.length
  };
}
function withIgnoredArguments(result, tool, report) {
  const line = ignoredArgumentsLine(tool, report);
  const [first, ...rest] = result.content;
  return {
    ...result,
    content: first ? [{ ...first, text: `${line}

${first.text}` }, ...rest] : [{ type: "text", text: line }],
    structuredContent: ignoredArgumentsStructured(report)
  };
}
function refusalResult(tool, report) {
  const reasons = [];
  if (report.missingRequired.length > 0)
    reasons.push(`required argument(s) ${report.missingRequired.map((key) => `\`${key}\``).join(", ")} missing`);
  for (const { key, suggestion } of report.unsentSuggestions) {
    if (report.missingRequired.includes(suggestion))
      continue;
    reasons.push(`\`${shown(key)}\` looks like a mistyped \`${suggestion}\`, which was not sent`);
  }
  if (reasons.length === 0)
    return void 0;
  return {
    content: [
      {
        type: "text",
        text: `${ignoredArgumentsLine(tool, report)}
Not run: ${reasons.join("; ")}.`
      }
    ],
    isError: true,
    structuredContent: ignoredArgumentsStructured(report)
  };
}

// dist/mcp/build-staleness.js
import * as fs24 from "node:fs";
var realStat = (targetPath) => {
  try {
    return fs24.statSync(targetPath);
  } catch {
    return void 0;
  }
};
function computeBuildStamp(entryPath, stat = realStat) {
  const info = stat(entryPath);
  if (!info)
    return void 0;
  return { entryPath, mtimeMs: info.mtimeMs, size: info.size };
}
function checkStaleness(stamp, stat = realStat) {
  const info = stat(stamp.entryPath);
  if (!info)
    return { stale: false, stamp, currentMtimeMs: void 0 };
  return {
    stale: info.mtimeMs !== stamp.mtimeMs || info.size !== stamp.size,
    stamp,
    currentMtimeMs: info.mtimeMs
  };
}
var StalenessGate = class {
  stamp;
  checkIntervalMs;
  stat;
  now;
  lastCheckedAt;
  lastVerdict = false;
  constructor(stamp, options = {}) {
    this.stamp = stamp;
    this.checkIntervalMs = options.checkIntervalMs ?? 1e3;
    this.stat = options.stat ?? realStat;
    this.now = options.now ?? Date.now;
  }
  /** True when the warm server's loaded code is known to be stale. */
  isStale() {
    if (!this.stamp)
      return false;
    const nowMs = this.now();
    if (this.lastCheckedAt !== void 0 && nowMs - this.lastCheckedAt < this.checkIntervalMs) {
      return this.lastVerdict;
    }
    this.lastCheckedAt = nowMs;
    this.lastVerdict = checkStaleness(this.stamp, this.stat).stale;
    return this.lastVerdict;
  }
};
function stalenessCheckEnabled(env = process.env) {
  return env.PI_LENS_WARM_STALENESS_CHECK !== "0";
}
var STALE_SERVED_BY_FRESH = "fresh (warm code stale \u2014 restart the Claude session to re-warm)";
var STALE_WARN_ONLY = "warmCodeStale: this result was served by the warm server's loaded code, which is older than the on-disk build (a rebuild or merge landed after this session started). Restart the Claude session to re-warm, or use pilens_rebuild + a tool that supports mode=fresh if available.";

// dist/mcp/server.js
console.log = (...args) => {
  console.error(...args);
};
var SERVER_NAME = "pi-lens-mcp";
var SERVER_VERSION = "0.1.0";
var FALLBACK_PROTOCOL_VERSION = "2025-06-18";
function resolveDefaultCwd() {
  const fromArg = process.argv.find((arg) => arg.startsWith("--cwd="))?.slice("--cwd=".length);
  return fromArg ?? process.env.PI_LENS_MCP_CWD ?? process.cwd();
}
var DEFAULT_CWD = path39.resolve(resolveDefaultCwd());
var lspReadyCwds = /* @__PURE__ */ new Set();
var SERVER_FILE = fileURLToPath3(import.meta.url);
var SERVER_DIR = path39.dirname(SERVER_FILE);
var WORKER_PATH = path39.join(SERVER_DIR, "worker.js");
var REBUILD_SCRIPT = resolveRebuildScript(SERVER_FILE);
var STALENESS_STAT_PATH = process.env.PI_LENS_MCP_STALENESS_STAT_PATH ?? SERVER_FILE;
var BUILD_STAMP = computeBuildStamp(STALENESS_STAT_PATH);
var stalenessIntervalOverride = (() => {
  const raw = process.env.PI_LENS_MCP_STALENESS_INTERVAL_MS;
  if (raw === void 0)
    return void 0;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : void 0;
})();
var STALENESS_GATE = new StalenessGate(BUILD_STAMP, {
  checkIntervalMs: stalenessIntervalOverride
});
function isWarmBuildStale() {
  if (!stalenessCheckEnabled())
    return false;
  return STALENESS_GATE.isStale();
}
function findRepoRoot(start) {
  let dir = start;
  for (let depth = 0; depth < 6; depth++) {
    const pkgPath = path39.join(dir, "package.json");
    if (fs25.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs25.readFileSync(pkgPath, "utf8"));
        if (pkg.name === "pi-lens")
          return dir;
      } catch {
      }
    }
    const parent = path39.dirname(dir);
    if (parent === dir)
      break;
    dir = parent;
  }
  return path39.resolve(start, "..", "..");
}
var REPO_ROOT = process.env.PI_LENS_MCP_REPO_ROOT ? path39.resolve(process.env.PI_LENS_MCP_REPO_ROOT) : findRepoRoot(SERVER_DIR);
async function ensureReady(cwd) {
  const normalized = path39.resolve(cwd);
  if (!shouldInitializeSessionRoot(normalized, lspReadyCwds)) {
    return;
  }
  try {
    await ensureLspConfig(normalized);
  } catch (err) {
    console.error(`[pi-lens-mcp] initLSPConfig failed for ${normalized}: ${err}`);
  }
  lspReadyCwds.add(normalized);
}
var autoSessionState = {
  attempted: false,
  succeeded: false,
  firedAt: null,
  error: null
};
var autoSessionInFlight = null;
function maybeAutoSessionStart() {
  if (process.env.PI_LENS_MCP_AUTO_SESSION !== "1")
    return;
  if (autoSessionInFlight || autoSessionState.succeeded)
    return;
  autoSessionState = {
    attempted: true,
    succeeded: false,
    firedAt: (/* @__PURE__ */ new Date()).toISOString(),
    error: null
  };
  autoSessionInFlight = ensureReady(DEFAULT_CWD).then(() => runSessionStart(DEFAULT_CWD)).then(() => {
    autoSessionState = { ...autoSessionState, succeeded: true };
    console.error("[pi-lens-mcp] auto session_start complete");
  }).catch((err) => {
    autoSessionState = { ...autoSessionState, error: String(err) };
    console.error(`[pi-lens-mcp] auto session_start failed: ${err}`);
  }).finally(() => {
    autoSessionInFlight = null;
  });
}
function getAutoSessionStatus() {
  if (process.env.PI_LENS_MCP_AUTO_SESSION !== "1")
    return null;
  return { ...autoSessionState };
}
var IPC_PATH = ipcPathForCwd(DEFAULT_CWD);
function rejectForeignTurnCwd(route, cwd) {
  const message = `${route} cwd outside this server's workspace: ${path39.resolve(cwd)} not within ${DEFAULT_CWD}`;
  console.error(`[pi-lens-mcp] rejected ${message}`);
  return message;
}
function isWithinServerWorkspace(cwd) {
  const target = path39.resolve(cwd);
  const rel = path39.relative(DEFAULT_CWD, target);
  return !rel.startsWith("..") && !path39.isAbsolute(rel);
}
function startIpcServer() {
  if (process.platform !== "win32") {
    try {
      fs25.unlinkSync(IPC_PATH);
    } catch {
    }
  }
  const requestQueue = createWarmIpcRequestQueue();
  const ipc = net.createServer((socket) => {
    socket.setEncoding("utf8");
    socket.on("data", createWarmIpcLineReader((line) => {
      void requestQueue.enqueue(async () => {
        try {
          if (isWarmBuildStale()) {
            console.error("[pi-lens-mcp] warm request: build stale, replying with an error");
            socket.end(`${JSON.stringify({ error: "warm build stale" })}
`);
            return;
          }
          const parsed = JSON.parse(line);
          if (parsed.route === "turn-end-ack") {
            if (parsed.version !== WARM_TURN_END_SCHEMA_VERSION || typeof parsed.deliveryId !== "string") {
              socket.end(`${JSON.stringify({ error: `turn-end ack schema ${parsed.version} != ${WARM_TURN_END_SCHEMA_VERSION}` })}
`);
              return;
            }
            const turnCwd = parsed.cwd ?? DEFAULT_CWD;
            if (!isWithinServerWorkspace(turnCwd)) {
              socket.end(`${JSON.stringify({ error: rejectForeignTurnCwd("turn-end-ack", turnCwd) })}
`);
              return;
            }
            const acknowledged = acknowledgeTurnEnd(turnCwd, parsed.deliveryId);
            socket.end(`${JSON.stringify({
              result: {
                route: "turn-end-ack",
                version: WARM_TURN_END_SCHEMA_VERSION,
                acknowledged
              }
            })}
`);
            return;
          }
          if (parsed.route === "turn-end") {
            if (parsed.version !== WARM_TURN_END_SCHEMA_VERSION) {
              socket.end(`${JSON.stringify({ error: `turn-end schema ${parsed.version} != ${WARM_TURN_END_SCHEMA_VERSION}` })}
`);
              return;
            }
            const turnCwd = parsed.cwd ?? DEFAULT_CWD;
            if (!isWithinServerWorkspace(turnCwd)) {
              socket.end(`${JSON.stringify({ error: rejectForeignTurnCwd("turn-end", turnCwd) })}
`);
              return;
            }
            if (socket.destroyed) {
              console.error(`[pi-lens-mcp] warm turn-end: client gone before the pass started (${turnCwd})`);
              return;
            }
            console.error(`[pi-lens-mcp] warm turn-end: ${turnCwd}`);
            await ensureReady(turnCwd);
            const delivery = await runTurnEndForIpc(turnCwd);
            const result2 = {
              route: "turn-end",
              version: WARM_TURN_END_SCHEMA_VERSION,
              turnEnd: delivery.outcome.turnEnd,
              tests: delivery.outcome.tests,
              deliveryId: delivery.deliveryId
            };
            socket.end(`${JSON.stringify({ result: result2 })}
`);
            return;
          }
          const req = parsed;
          console.error(`[pi-lens-mcp] warm analyze: ${req.file}`);
          const result = await analyzeFile(req.file, req.cwd, {
            registerTurnState: true,
            updateGraph: true
          });
          socket.end(`${JSON.stringify({ result })}
`);
        } catch (err) {
          socket.end(`${JSON.stringify({ error: String(err) })}
`);
        }
      });
    }, {
      label: "mcp-warm-server",
      // #3383: a peer that never terminates its request line gets the same
      // error reply every other unusable request gets, instead of this
      // process holding its bytes until the client's timeout.
      onOverflow: () => socket.end(`${JSON.stringify({ error: "warm request line exceeded the framing limit" })}
`)
    }));
    socket.on("error", () => {
    });
  });
  ipc.on("error", (err) => {
    console.error(`[pi-lens-mcp] IPC listener unavailable: ${err}`);
  });
  ipc.listen(IPC_PATH, () => {
    console.error(`[pi-lens-mcp] warm side-channel listening at ${IPC_PATH}`);
  });
  const cleanup = () => {
    try {
      ipc.close();
    } catch {
    }
    if (process.platform !== "win32") {
      try {
        fs25.unlinkSync(IPC_PATH);
      } catch {
      }
    }
  };
  process.on("exit", cleanup);
}
function send(message) {
  process.stdout.write(`${JSON.stringify(message)}
`);
}
function sendResult(id, result) {
  send({ jsonrpc: "2.0", id, result });
}
function sendError(id, code, message) {
  send({ jsonrpc: "2.0", id, error: { code, message } });
}
var GRAPH_STALENESS_THRESHOLD_MS = 10 * 6e4;
function formatRelativeAge(ms) {
  if (ms < 6e4)
    return `${Math.round(ms / 1e3)}s ago`;
  if (ms < 60 * 6e4)
    return `${Math.round(ms / 6e4)}m ago`;
  if (ms < 24 * 60 * 6e4)
    return `${Math.round(ms / (60 * 6e4))}h ago`;
  return `${Math.round(ms / (24 * 60 * 6e4))}d ago`;
}
function graphStalenessNote(builtAtIso, label) {
  if (!builtAtIso)
    return void 0;
  const builtAtMs = Date.parse(builtAtIso);
  if (!Number.isFinite(builtAtMs))
    return void 0;
  const ageMs = Date.now() - builtAtMs;
  if (ageMs < GRAPH_STALENESS_THRESHOLD_MS)
    return void 0;
  return `${label} last updated ${formatRelativeAge(ageMs)}; run pilens_analyze on recently-changed files, pilens_session_start, or pilens_rebuild to refresh it.`;
}
setProjectTrustState("trusted");
logExtension({
  subsystem: "project-trust",
  level: "debug",
  message: "mcp: workspace trust belongs to the MCP client; pi trust not consulted"
});
var cacheManager = new CacheManager();
var isLensGuardEnabled = () => Boolean(createMcpHost(void 0, DEFAULT_CWD).getFlag("lens-guard"));
var lensDiagnosticsTool = createLensDiagnosticsTool(
  cacheManager,
  () => DEFAULT_CWD,
  void 0,
  void 0,
  void 0,
  void 0,
  // #1413 surface parity: validate cached test-runner findings against the
  // same session identity the in-process path uses. Resolved lazily — until
  // an MCP session context exists there is no session to compare against and
  // validation skips the check, which is the honest classification.
  () => peekMcpSessionRuntime(),
  // #2860: without this, the default `() => true` applies on the MCP
  // surface and every confirmed-clean LSP probe unconditionally resyncs the
  // commit-gate `turn-end-findings` record even when the project has
  // `lens-guard` off — a config bypass on a durable cross-surface store.
  // Matches index.ts:1656 and the two sibling readers
  // (clients/runtime-tool-call.ts, clients/runtime-tool-result.ts).
  () => isLensGuardEnabled()
);
var astGrepClient = new AstGrepClient();
var astGrepSearchTool = createAstGrepSearchTool(astGrepClient);
var astGrepReplaceTool = createAstGrepReplaceTool(astGrepClient);
var lspNavigationTool = createLspNavigationTool((name, cwd) => createMcpHost(void 0, cwd ?? DEFAULT_CWD).getFlag(name));
function schemaWithCwd(parameters) {
  const p = parameters;
  return {
    type: "object",
    properties: {
      ...p.properties,
      cwd: {
        type: "string",
        description: "Project root (defaults to the server workspace)."
      }
    },
    ...p.required ? { required: p.required } : {}
  };
}
var ALL_TOOLS = [
  {
    name: "pilens_analyze",
    description: "Run pi-lens's per-edit dispatch pipeline on one file. Example: analyze `src/app.ts` after an edit.",
    inputSchema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          description: "Path to the file to analyze (absolute, or relative to cwd)."
        },
        cwd: {
          type: "string",
          description: "Project root. Defaults to the server's workspace."
        },
        mode: {
          type: "string",
          enum: ["warm", "fresh"],
          description: "warm (default): run in this server process \u2014 fast, warm LSP, but reflects the code the server was started with. fresh: fork a worker that loads the freshly-built code from disk \u2014 slower, but reflects the latest commit (the honest review loop; pair with pilens_rebuild)."
        },
        flags: {
          type: "object",
          description: 'Optional pi-lens flag overrides for this run, e.g. {"no-lsp": true} to bench the non-LSP path.'
        }
      },
      required: ["file"]
    }
  },
  {
    name: "pilens_diagnostics",
    description: lensDiagnosticsTool.description,
    inputSchema: schemaWithCwd(lensDiagnosticsTool.parameters)
  },
  {
    name: "pilens_latency",
    description: "Return recent dispatch latency reports. Example: limit results to 5.",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Max reports to return (default 5)."
        },
        file: {
          type: "string",
          description: "Only reports whose path ends with this."
        }
      }
    }
  },
  {
    name: "pilens_rebuild",
    description: "Rebuild pi-lens so later fresh analyses use the latest commit. Example: rebuild after changing a tool.",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "pilens_project_scan",
    description: "Scan project files for structural and quality diagnostics. Example: cap the scan with `maxFiles: 20`.",
    inputSchema: {
      type: "object",
      properties: {
        cwd: { type: "string" },
        maxFiles: { type: "number", description: "Cap files scanned." },
        includeGenerated: {
          type: "boolean",
          description: "Scan WITHOUT the generated/artifact NAME-heuristic filter (lockfiles, gen.ts-style names, generated/ dirs, \u2026). Default false. Use when a scan's 'excluded by generated-name heuristics' notice suggests a real file was skipped."
        }
      }
    }
  },
  {
    name: "pilens_symbol_search",
    description: "Find relevant files by ranked identifier search. On a cold cache, project_report and symbol_search return available: false with a retry hint and start a non-blocking background build; module_report degrades to outline-only with cache freshness explicit. Example: search `authenticate user` before pilens_module_report.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Identifier-ish query, e.g. 'authenticate user'. Mix in composable prefix filters: lang:<kind> (e.g. lang:jsts, lang:python \u2014 kinds from file-kinds.ts), file:<substr> (path substring), ext:<ext> (e.g. ext:ts or ext:.ts), each optionally negated with a leading '-' (-file:test). Filters apply before ranking; e.g. 'lang:jsts file:clients/ -file:test rank'. Unknown prefixes/kinds error with the supported list."
        },
        cwd: { type: "string" },
        limit: {
          type: "number",
          description: "Max files to return (default 20)."
        },
        paths: {
          type: "array",
          items: { type: "string" },
          description: "Glob array scoping hits to matching files \u2014 same shape/semantics as pilens_ast_grep_search's `paths` (a bare directory/file entry scopes its whole subtree). Filters before ranking, so scores within the scoped set are unaffected."
        },
        lang: {
          type: "string",
          description: "Restrict hits to one language, using the same identifiers as pilens_ast_grep_search's `lang` param (e.g. 'typescript', 'python', 'go')."
        }
      },
      required: ["query"]
    }
  },
  {
    name: "pilens_module_report",
    description: "Return a navigable source-module outline with references and read handles. An outline shows shape, not bodies, and does not satisfy read-before-edit; `read_symbol` and `read_enclosing` return body text and record read coverage. On a cold cache, project_report and symbol_search return available: false with a retry hint and start a non-blocking background build; module_report degrades to outline-only with cache freshness explicit. Example: use pilens_module_report on `src/app.ts` before pilens_read_symbol.",
    inputSchema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          description: "File to report on (absolute or relative to cwd)."
        },
        cwd: { type: "string" },
        maxRefsPerSymbol: {
          type: "number",
          description: "Cap who-uses-this entries per symbol (default 10)."
        },
        focus: {
          type: "string",
          description: "Optional task hint used only to rank recommendedReads (does not expand scope or trigger scans)."
        },
        view: {
          type: "string",
          enum: ["summary", "default", "compact"],
          description: "Payload tier. summary returns top-level entries/recommendedReads with heavy callback/usedBy/blast-radius payloads omitted. compact (cheapest) returns a line-oriented TEXT rendering of the full report instead of JSON."
        },
        blastRadius: {
          type: "boolean",
          description: "Include the cross-file blast radius: transitive dependents aggregated to ranked file reads. Read-only over the cached graph (omitted when cold)."
        },
        blastRadiusDepth: {
          type: "number",
          description: "Max hops for the blast-radius walk (default 3). Only used with blastRadius."
        },
        callGraph: {
          type: "boolean",
          description: "Include bounded derived callers/callees from the cached FunctionCallGraph; cold or stale cache state is explicit."
        },
        maxCallGraphEntries: {
          type: "number",
          description: "Per-direction cap for call-graph relations (default 20)."
        }
      },
      required: ["file"]
    }
  },
  {
    name: "pilens_project_report",
    description: "Orient in a project from its review graph. On a cold cache, project_report and symbol_search return available: false with a retry hint and start a non-blocking background build; module_report degrades to outline-only with cache freshness explicit. Example: use pilens_project_report before choosing a file.",
    inputSchema: {
      type: "object",
      properties: {
        cwd: { type: "string" },
        limit: {
          type: "number",
          description: "Scales every ranked section's cap (default 10) \u2014 a single knob for all sections."
        },
        focus: {
          type: "string",
          description: "Optional task hint used only to re-rank sections toward relevant subsystems (does not expand scope or trigger scans)."
        },
        view: {
          type: "string",
          enum: ["default", "compact"],
          description: "Payload tier. compact (cheapest) returns a line-oriented TEXT rendering instead of JSON. Default returns JSON."
        }
      }
    }
  },
  {
    name: "pilens_read_symbol",
    description: "Return one symbol's verbatim source. An outline shows shape, not bodies, and does not satisfy read-before-edit; `read_symbol` and `read_enclosing` return body text and record read coverage. Example: use pilens_read_symbol after pilens_module_report identifies `parseConfig`.",
    inputSchema: {
      type: "object",
      properties: {
        file: { type: "string", description: "File containing the symbol." },
        symbol: {
          type: "string",
          description: "Exact symbol name to read, or a dotted `Class.method` to disambiguate a member."
        },
        kind: {
          type: "string",
          description: "Optional kind filter (e.g. function, interface, class) to disambiguate when multiple same-file symbols share the requested name."
        },
        cwd: { type: "string" }
      },
      required: ["file", "symbol"]
    }
  },
  {
    name: "pilens_read_enclosing",
    description: "Return the smallest symbol or callback enclosing a line. An outline shows shape, not bodies, and does not satisfy read-before-edit; `read_symbol` and `read_enclosing` return body text and record read coverage. Example: use pilens_read_enclosing after a diagnostic points to line 42.",
    inputSchema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          description: "Absolute or workspace-relative path to the source file."
        },
        line: {
          type: "number",
          description: "1-based line number inside the desired symbol/callback."
        },
        cwd: { type: "string" },
        kinds: {
          type: "array",
          items: { type: "string" },
          description: "Optional kind filter, e.g. function, method, callback, class."
        },
        maxLines: {
          type: "number",
          description: "Optional maximum body size to return. Oversized matches obey onOversize."
        },
        onOversize: {
          type: "string",
          enum: ["error", "slice", "outline"],
          description: "Behavior when the enclosing body exceeds maxLines. error (default) returns metadata only; slice returns a bounded partial read around line; outline returns nested symbols/callbacks with read handles."
        },
        aroundLine: {
          type: "number",
          description: "Maximum lines for onOversize=slice; defaults to maxLines, then 80."
        }
      },
      required: ["file", "line"]
    }
  },
  {
    name: "pilens_health",
    description: "Return pi-lens runtime health for this server. Example: call it after a slow analysis.",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "pilens_effective_config",
    description: "Explain resolved configuration and provenance. Response is redacted by construction: it contains no environment values, no command arguments beyond the binary, and home-relative paths; a tier-denied LSP decision cannot be lifted by a nearer config. Example: pass `file` to explain one selection.",
    inputSchema: {
      type: "object",
      properties: {
        cwd: { type: "string" },
        file: {
          type: "string",
          description: "Path to explain: adds the resolved language plus the per-server and per-runner selection decisions for it. Must resolve inside `cwd` (a sibling package in the same monorepo does not count) \u2014 a file outside it is rejected with the `cwd` it was measured against; re-query with `cwd` set to that file's own workspace instead."
        }
      }
    }
  },
  {
    name: "pilens_session_start",
    description: "Initialize pi-lens for a workspace. Example: run once before reviewing a project.",
    inputSchema: {
      type: "object",
      properties: { cwd: { type: "string" } }
    }
  },
  {
    name: "pilens_turn_end",
    description: "Summarize checks for files changed this turn. Example: pass `files` for an unanalysed file.",
    inputSchema: {
      type: "object",
      properties: {
        cwd: { type: "string" },
        files: {
          type: "array",
          items: { type: "string" },
          description: "Optional extra files to include (auto-registered ones are already picked up)."
        }
      }
    }
  },
  {
    name: "pilens_session_end",
    description: "End the MCP connection's telemetry session and write its bounded situational-tool telemetry line. This is terminal for the connection.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "pilens_ast_grep_search",
    description: "Search code by AST structure rather than text. Example: find calls with `console.log($MSG)`.",
    inputSchema: schemaWithCwd(astGrepSearchTool.parameters)
  },
  {
    name: "pilens_ast_grep_replace",
    description: "Find and rewrite code by AST structure; preview by default. Example: set `apply: false` to inspect a diff.",
    inputSchema: schemaWithCwd(astGrepReplaceTool.parameters)
  },
  {
    name: "pilens_lsp_navigation",
    description: 'Navigate source with language-server operations. Example: use `{operation: "references", path: "src/app.ts", line: 12}`.',
    inputSchema: schemaWithCwd(lspNavigationTool.parameters)
  }
];
var TOOLS = canRebuildPiLens(REPO_ROOT) ? ALL_TOOLS : ALL_TOOLS.filter((tool) => tool.name !== "pilens_rebuild");
function enabledToolsForCwd(cwd) {
  const global = loadPiLensGlobalConfig();
  const project = loadPiLensProjectConfig(cwd);
  return TOOLS.filter((tool) => {
    const entry = toolRegistryEntryForMcp(tool.name);
    return entry !== void 0 && resolveLensToolEnabled(entry.name, global, project.raw);
  });
}
function formatAnalyze(result, cwd, mode, servedBy) {
  const lspNote = result.lsp ? ` \xB7 lsp ${result.lsp.diagnosticCount} (${result.lsp.status}${result.lsp.failureKind ? `: ${result.lsp.failureKind}` : ""}, ${result.lsp.durationMs}ms)` : "";
  const summary = `${path39.relative(cwd, result.filePath) || result.filePath} [${mode}] \u2014 ${result.counts.blockers} blocking, ${result.counts.warnings} warning(s), ${result.counts.advisories} advisory(ies), ${result.counts.diagnostics} total` + (result.latency ? ` \xB7 ${result.latency.totalDurationMs}ms` : "") + lspNote + (result.counts.fixed > 0 ? ` \xB7 ${result.counts.fixed} auto-fixed` : "") + (servedBy ? `

servedBy: ${servedBy}` : "");
  return renderToolText(summary, servedBy ? { ...result, servedBy } : result);
}
function healthConfigLine(provenance) {
  if (!provenance)
    return "Config: unavailable (resolution failed)";
  const tiers = Object.entries(provenance.tiers).filter(([, count]) => count > 0).map(([tier, count]) => `${tier} ${count}`).join(" \xB7 ");
  const codes = Object.entries(provenance.codes).map(([code, count]) => `${code}\xD7${count}`).join(", ");
  const notices = codes.length > 0 ? ` \xB7 notices ${codes}` : "";
  const documents = `${provenance.documents} file(s)`;
  return `Config: ${documents} \xB7 ${tiers} leaf/leaves${notices}`;
}
function effectiveServerLine(server) {
  const mark = server.selected ? "\u2713" : "\u2717";
  const decided = server.decidedBy;
  if (!decided)
    return `  ${mark} ${server.id} \u2014 ${server.reason}`;
  const file = decided.file === void 0 ? "" : ` ${decided.file}`;
  const source = `${decided.tier}${file} \u2192 ${decided.key}`;
  return `  ${mark} ${server.id} \u2014 ${server.reason} (${source})`;
}
function effectiveFileHeading(file) {
  const language = file.language === void 0 ? "" : ` \u2014 ${file.language}`;
  const kind = file.kind === void 0 ? "" : ` (kind ${file.kind})`;
  return `File: ${file.path}${language}${kind}`;
}
function effectiveDocumentLine(document) {
  const legacy = document.legacy ? " (legacy location \u2014 scheduled for removal)" : "";
  return `  ${document.tier}: ${document.file}${legacy}`;
}
async function callTool(name, args) {
  if (name === "pilens_lsp_diagnostics") {
    recordDegradationOnce({
      kind: "lsp-diagnostics-compatibility",
      subject: "lsp_diagnostics",
      reason: "retired tool name redirected to pilens_diagnostics source=lsp"
    });
    name = "pilens_diagnostics";
    args = {
      ...args,
      source: "lsp",
      // #2860: the retired tool's contract was always "path or paths is
      // required" (tools/lsp-diagnostics.ts's own early return) — it never
      // had a bare "sweep the whole workspace" mode. `scope: "paths"` is a
      // no-op for source=lsp (lens-diagnostics.ts only special-cases
      // scope==="workspace"), so whatever `path`/`paths` the caller sent
      // (or didn't) passes straight through to the probe's own path/paths
      // handling unchanged, reproducing master's behavior exactly —
      // including its error when neither is present. Mapping absent
      // `paths` to `scope:"workspace"` here previously caused every
      // no-args call to substitute `cwd` and run a whole-project LSP sweep
      // instead (root-eviction smoke: 129 sweeps, 180s timeout x3).
      scope: "paths"
    };
  }
  if (name === "pilens_ast_grep_dump") {
    recordDegradationOnce({
      kind: "ast-grep-dump-compatibility",
      subject: "ast_grep_dump",
      reason: "retired tool name redirected to ast_grep_search dump mode"
    });
    return astGrepDumpCompatibilityResult(args, "mcp");
  }
  if (name === "pilens_analyze") {
    const file = args.file;
    if (typeof file !== "string" || file.length === 0) {
      return {
        ...renderToolText("pilens_analyze requires a 'file' string."),
        isError: true
      };
    }
    const cwd = typeof args.cwd === "string" ? args.cwd : DEFAULT_CWD;
    const requestedMode = args.mode === "fresh" ? "fresh" : "warm";
    const flags = args.flags && typeof args.flags === "object" ? args.flags : void 0;
    const forcedFresh = requestedMode === "warm" && isWarmBuildStale();
    const mode = requestedMode === "fresh" || forcedFresh ? "fresh" : "warm";
    if (mode === "fresh") {
      const outcome = await analyzeFileFresh(WORKER_PATH, file, cwd, { flags });
      if (outcome.error || !outcome.result) {
        return {
          ...renderToolText(`fresh analyze failed: ${outcome.error ?? "no result"}`),
          isError: true
        };
      }
      return formatAnalyze(outcome.result, cwd, "fresh", forcedFresh ? STALE_SERVED_BY_FRESH : void 0);
    }
    await ensureReady(cwd);
    const result = await analyzeFile(file, cwd, {
      flags,
      registerTurnState: true,
      updateGraph: true
    });
    return formatAnalyze(result, cwd, "warm");
  }
  if (name === "pilens_rebuild") {
    const outcome = await runRebuild(REPO_ROOT, REBUILD_SCRIPT);
    if (!outcome.packageManager) {
      return {
        ...renderToolText(outcome.output, {
          ok: false,
          script: outcome.script,
          repoRoot: REPO_ROOT
        }),
        isError: true
      };
    }
    const runCmd = `${outcome.packageManager} run ${outcome.script}`;
    const headline = outcome.ok ? `\u2713 rebuild succeeded (${runCmd}, ${outcome.durationMs}ms). Fresh analyses now reflect the latest build.` : `\u2717 rebuild FAILED (${runCmd}, ${outcome.durationMs}ms).`;
    return {
      ...renderToolText(outcome.ok ? headline : `${headline}

${outcome.output}`, {
        ok: outcome.ok,
        script: outcome.script,
        packageManager: outcome.packageManager,
        durationMs: outcome.durationMs,
        repoRoot: REPO_ROOT
      }),
      isError: !outcome.ok
    };
  }
  if (name === "pilens_project_scan") {
    const cwd = typeof args.cwd === "string" ? args.cwd : DEFAULT_CWD;
    await ensureReady(cwd);
    const maxFiles = typeof args.maxFiles === "number" && Number.isFinite(args.maxFiles) ? Math.max(1, Math.floor(args.maxFiles)) : void 0;
    const includeGenerated = args.includeGenerated === true;
    const snapshot = await projectScan(cwd, maxFiles, includeGenerated);
    if (snapshot.unsafeRoot) {
      return renderToolText(`Refused to scan: the working directory (${cwd}) resolves at or above the home directory, so a project scan would walk every unrelated tree under it. Run pilens_project_scan from inside a project directory. This is NOT a clean result \u2014 nothing was scanned.`, { filesScanned: 0, unsafeRoot: true, cwd }, true);
    }
    const { deduped, byRule, byFile } = summarizeScan(snapshot.diagnostics);
    const topRules = Object.entries(byRule).sort((a, b) => b[1] - a[1]);
    const topFiles = Object.entries(byFile).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([file, count]) => ({ file: path39.relative(cwd, file), count }));
    const summaryLines = [
      `Scanned ${snapshot.filesScanned} file(s) [${snapshot.runners.join(", ")}] \u2192 ${deduped.length} unique diagnostic(s)` + (snapshot.diagnostics.length !== deduped.length ? ` (${snapshot.diagnostics.length} raw, ${snapshot.diagnostics.length - deduped.length} duplicate)` : ""),
      ...topRules.slice(0, 12).map(([rule, count]) => `  ${count}\xD7 ${rule}`)
    ];
    const truncationNotice = scanTruncationNotice(snapshot);
    if (truncationNotice)
      summaryLines.push(truncationNotice);
    const skipNotice = generatedSkipNotice(snapshot, "mcp");
    if (skipNotice)
      summaryLines.push(skipNotice);
    return renderToolText(summaryLines.join("\n"), {
      filesScanned: snapshot.filesScanned,
      runners: snapshot.runners,
      uniqueDiagnostics: deduped.length,
      rawDiagnostics: snapshot.diagnostics.length,
      byRule,
      topFiles,
      sample: deduped.slice(0, 40),
      ...snapshot.scanTruncated ? { scanTruncated: true } : {},
      ...snapshot.treeSitterStatus ? { treeSitterStatus: snapshot.treeSitterStatus } : {},
      ...snapshot.generatedFileSkips ? { generatedFileSkips: snapshot.generatedFileSkips } : {},
      ...snapshot.generatedNameOnlySkips ? { generatedNameOnlySkips: snapshot.generatedNameOnlySkips } : {},
      ...snapshot.generatedDirSkips ? { generatedDirSkips: snapshot.generatedDirSkips } : {}
    });
  }
  if (name === "pilens_symbol_search") {
    const query = typeof args.query === "string" ? args.query : "";
    if (!query.trim())
      return renderToolText("Provide a non-empty `query`.");
    const cwd = typeof args.cwd === "string" ? args.cwd : DEFAULT_CWD;
    const limit = typeof args.limit === "number" && Number.isFinite(args.limit) ? Math.max(1, Math.floor(args.limit)) : 20;
    const paths = Array.isArray(args.paths) ? args.paths.filter((p) => typeof p === "string") : void 0;
    const lang = typeof args.lang === "string" ? args.lang : void 0;
    const { available, results, hint, unavailableReason, coverage, snapshotGeneratedAt } = await symbolSearch(query, cwd, limit, { paths, lang });
    if (!available) {
      return renderToolText(hint ?? "No word index for this workspace yet \u2014 run pilens_session_start first.", { available: false, query, hint, unavailableReason }, true);
    }
    const stalenessNote = graphStalenessNote(snapshotGeneratedAt, "Project snapshot");
    if (results.length === 0) {
      return renderToolText(`No files matched "${query}".` + (coverage ? `
Index covers ${coverage.files} files${coverage.truncated ? " (capped \u2014 results may be incomplete)" : ""}.` : "") + (stalenessNote ? `

${stalenessNote}` : ""), {
        available: true,
        query,
        results: [],
        coverage,
        ...stalenessNote ? { staleness: stalenessNote } : {}
      }, true);
    }
    const lines = [
      `Top ${results.length} file(s) for "${query}":`,
      ...results.map((result, i) => `  ${i + 1}. ${path39.relative(cwd, result.file)} (score ${result.score.toFixed(2)}, ${result.hits} hit(s), line ${result.startLine})`),
      ...stalenessNote ? ["", stalenessNote] : [],
      ...coverage ? [
        `Index covers ${coverage.files} files${coverage.truncated ? " (capped \u2014 results may be incomplete)" : ""}.`
      ] : []
    ];
    return renderToolText(lines.join("\n"), {
      query,
      coverage,
      results: results.map((result) => {
        const relFile = path39.relative(cwd, result.file);
        return {
          file: relFile,
          score: result.score,
          hits: result.hits,
          startLine: result.startLine,
          endLine: result.endLine,
          ...result.annotations ? { annotations: result.annotations } : {},
          // #771: machine-actionable discovery-funnel hint, mirroring the
          // pi-tool-surface's suggestedNext (tools/symbol-search.ts).
          suggestedNext: { tool: "pilens_module_report", path: relFile }
        };
      }),
      ...stalenessNote ? { staleness: stalenessNote } : {}
    }, true);
  }
  if (name === "pilens_module_report") {
    const file = typeof args.file === "string" ? args.file : "";
    if (!file.trim())
      return { ...renderToolText("Provide a `file`."), isError: true };
    const cwd = typeof args.cwd === "string" ? args.cwd : DEFAULT_CWD;
    const maxRefsPerSymbol = typeof args.maxRefsPerSymbol === "number" && Number.isFinite(args.maxRefsPerSymbol) ? Math.max(1, Math.floor(args.maxRefsPerSymbol)) : void 0;
    const blastRadius = args.blastRadius === true;
    const blastRadiusDepth = typeof args.blastRadiusDepth === "number" && Number.isFinite(args.blastRadiusDepth) ? Math.max(1, Math.floor(args.blastRadiusDepth)) : void 0;
    const callGraph = args.callGraph === true;
    const maxCallGraphEntries = typeof args.maxCallGraphEntries === "number" && Number.isFinite(args.maxCallGraphEntries) ? Math.max(1, Math.floor(args.maxCallGraphEntries)) : void 0;
    const view = args.view === "summary" || args.view === "compact" ? args.view : void 0;
    const focus = typeof args.focus === "string" ? args.focus : void 0;
    const report = await moduleReport(file, cwd, {
      maxRefsPerSymbol,
      blastRadius,
      blastRadiusDepth,
      callGraph,
      maxCallGraphEntries,
      view,
      focus
    });
    if (!report.available) {
      return {
        ...renderToolText(`No module report for ${path39.relative(cwd, path39.resolve(cwd, file))} \u2014 not a symbol-bearing file, or unreadable.`, report, true),
        isError: true
      };
    }
    const graphStaleness = graphStalenessNote(report.graphBuiltAt, "Review graph");
    const summary = `${path39.relative(cwd, report.path) || report.path} [${report.staleness}] \u2014 ${report.summary.symbols} symbol(s), ${report.summary.exports} exported, ${report.api.length} in public API` + (graphStaleness ? `

${graphStaleness}` : "");
    if (view === "compact") {
      const compactText = renderCompactModuleReport(report);
      return {
        content: [
          {
            type: "text",
            text: graphStaleness ? `${compactText}

${graphStaleness}` : compactText
          }
        ]
      };
    }
    return renderToolText(summary, graphStaleness ? { ...report, graphStalenessNote: graphStaleness } : report, true);
  }
  if (name === "pilens_project_report") {
    const cwd = typeof args.cwd === "string" ? args.cwd : DEFAULT_CWD;
    const limit = typeof args.limit === "number" && Number.isFinite(args.limit) ? Math.max(1, Math.floor(args.limit)) : void 0;
    const focus = typeof args.focus === "string" ? args.focus : void 0;
    const view = args.view === "compact" ? "compact" : void 0;
    const report = await projectReport(cwd, { limit, focus, view });
    if (!report.available) {
      return {
        ...renderToolText(report.hint ?? "No review graph cached for this workspace yet.", report),
        isError: true
      };
    }
    const graphStaleness = report.trust ? graphStalenessNote(report.trust.graphBuiltAt, "Review graph") : void 0;
    if (view === "compact") {
      const compactText = renderCompactProjectReport(report);
      return {
        content: [
          {
            type: "text",
            text: graphStaleness ? `${compactText}

${graphStaleness}` : compactText
          }
        ]
      };
    }
    const summary = `Project report \u2014 ${report.hubs?.length ?? 0} hub(s), ${report.entryPoints?.length ?? 0} entry point(s), ${report.riskHotspots?.length ?? 0} risk hotspot(s)` + (graphStaleness ? `

${graphStaleness}` : "");
    return renderToolText(summary, graphStaleness ? { ...report, graphStalenessNote: graphStaleness } : report, true);
  }
  if (name === "pilens_read_symbol") {
    const file = typeof args.file === "string" ? args.file : "";
    const symbol = typeof args.symbol === "string" ? args.symbol : "";
    if (!file.trim() || !symbol.trim()) {
      return { ...renderToolText("Provide `file` and `symbol`."), isError: true };
    }
    const cwd = typeof args.cwd === "string" ? args.cwd : DEFAULT_CWD;
    const kind = typeof args.kind === "string" ? args.kind : void 0;
    const result = await readSymbol(file, symbol, cwd, { kind });
    if (!result.found) {
      const suggestionSuffix = result.suggestions?.length ? ` Did you mean: ${result.suggestions.join(", ")}?` : " Use pilens_module_report to list symbols.";
      return {
        ...renderToolText(`Symbol "${symbol}" not found in ${path39.basename(file)}.${suggestionSuffix}`, {
          found: false,
          ...result.suggestions ? { suggestions: result.suggestions } : {}
        }),
        isError: true
      };
    }
    const sigSuffix = result.signature ? `  ${result.signature}` : "";
    const ambiguityNote = result.ambiguous ? ` (${result.ambiguous.count} matches \u2014 returned the ${result.kind}; pass \`kind\` to disambiguate: ${result.ambiguous.kinds.join(", ")})` : "";
    const header = `${result.kind} ${result.name}${ambiguityNote}${sigSuffix}  ${path39.relative(cwd, result.path)}:${result.startLine}-${result.endLine}`;
    return {
      content: [
        {
          type: "text",
          text: `${header}

${result.source ?? ""}`
        }
      ]
    };
  }
  if (name === "pilens_read_enclosing") {
    const file = typeof args.file === "string" ? args.file : "";
    const line = typeof args.line === "number" ? args.line : Number.NaN;
    if (!file.trim() || !Number.isFinite(line)) {
      return {
        ...renderToolText("Provide `file` and a numeric `line`."),
        isError: true
      };
    }
    const cwd = typeof args.cwd === "string" ? args.cwd : DEFAULT_CWD;
    const kinds = Array.isArray(args.kinds) ? args.kinds.filter((k) => typeof k === "string") : void 0;
    const maxLines = typeof args.maxLines === "number" && Number.isFinite(args.maxLines) ? Math.max(1, Math.floor(args.maxLines)) : void 0;
    const onOversize = args.onOversize === "error" || args.onOversize === "slice" || args.onOversize === "outline" ? args.onOversize : void 0;
    const aroundLine = typeof args.aroundLine === "number" && Number.isFinite(args.aroundLine) ? Math.max(1, Math.floor(args.aroundLine)) : void 0;
    const result = await readEnclosing(file, line, cwd, {
      kinds,
      maxLines,
      onOversize,
      aroundLine
    });
    if (!result.found) {
      const warningSuffix = result.warnings?.length ? ` Warnings: ${result.warnings.join("; ")}` : "";
      const outlineSuffix = result.outline?.length ? `

Nested outline:
${JSON.stringify(result.outline)}` : "";
      const text = result.error ? `Could not read enclosing range in ${path39.basename(file)}:${result.line}: ${result.error}${warningSuffix}${outlineSuffix}` : `No enclosing symbol/callback found in ${path39.basename(file)}:${result.line}.${warningSuffix}`;
      return {
        ...renderToolText(text, { found: false, line: result.line }),
        isError: true
      };
    }
    const range = result.partial ? `${result.startLine}-${result.endLine} (partial of ${result.enclosingStartLine}-${result.enclosingEndLine})` : `${result.startLine}-${result.endLine}`;
    const header = `${result.kind} ${result.name}  ${path39.relative(cwd, result.path)}:${range}`;
    return {
      content: [
        {
          type: "text",
          text: `${header}

${result.source ?? ""}`
        }
      ]
    };
  }
  if (name === "pilens_health") {
    const { aliveClients, servers, brokenServers } = lspStatus();
    const last = recentLatency(1)[0];
    const stats = diagnosticStats();
    const autoSession = getAutoSessionStatus();
    const treeSitter = treeSitterRuntimeStatus();
    const degradations = getDegradationSummary();
    const turnEnd = readTurnEndStatus(DEFAULT_CWD) ?? null;
    const configProvenance = await effectiveConfig({ cwd: DEFAULT_CWD }).then((view) => ({
      documents: view.documents.length,
      tiers: view.provenanceCounts,
      codes: view.recordCounts
    })).catch(() => null);
    const footprint = await resourceFootprint().catch(() => null);
    const lines = [
      treeSitter.wasmAborted ? `Tree-sitter: DEGRADED \u2014 WASM runtime aborted${treeSitter.abortedAt ? ` at ${treeSitter.abortedAt}` : ""}; restart this server to recover` : "Tree-sitter: available",
      `LSP: ${aliveClients} alive client(s)`,
      ...servers.flatMap((server) => [
        `  ${server.connected ? "\u2713" : "\u2717"} ${server.serverId} (${server.root})`,
        ...server.pullFailureHistory.slice(-1).map((failure) => `    \u26A0 diagnostics pull failed: ${failure.method}${failure.code !== void 0 ? ` (${failure.code})` : ""} \u2014 ${failure.message.length > 200 ? `${failure.message.slice(0, 200)}\u2026` : failure.message}`)
      ]),
      ...renderLspBrokenStatusLines(brokenServers),
      ...renderDegradationLines(degradations),
      last ? `Last dispatch: ${path39.basename(last.filePath)} \u2014 ${last.totalDurationMs}ms, ${last.totalDiagnostics} diagnostic(s)` : "Last dispatch: none yet",
      `Diagnostics this session: ${stats.totalShown} shown \xB7 ${stats.totalAutoFixed} auto-fixed \xB7 ${stats.totalUnresolved} unresolved`,
      autoSession ? `Auto session_start: ${autoSession.succeeded ? "succeeded" : autoSession.error ? "FAILED" : autoSession.attempted ? "in progress" : "not yet attempted"}${autoSession.firedAt ? ` (fired ${autoSession.firedAt})` : ""}${autoSession.error ? ` \u2014 ${autoSession.error}` : ""}` : "Auto session_start: disabled (PI_LENS_MCP_AUTO_SESSION not set)",
      turnEnd ? `Stop-hook turn-end: ${turnEnd.ran} ran \xB7 ${turnEnd.skipped} skipped${turnEnd.lastRunAt ? ` (last ran ${turnEnd.lastRunAt})` : ""}${turnEnd.lastSkipReason ? ` \u2014 last skip: ${turnEnd.lastSkipReason}${turnEnd.lastSkipAt ? ` at ${turnEnd.lastSkipAt}` : ""}` : ""}` : "Stop-hook turn-end: no activity recorded (hook not installed, or no Stop yet)",
      turnEnd?.failed ? `Analyzer invocations: ${turnEnd.failed} failed; last ${turnEnd.lastFailureOperation} failure at ${turnEnd.lastFailureAt}: ${turnEnd.lastFailureReason}` : "Analyzer invocations: no failures recorded",
      healthConfigLine(configProvenance),
      footprint ? `Resource footprint: ${footprint.instanceCount} pi-lens instance(s) \xB7 ${(footprint.totalRssBytes / 1024 / 1024).toFixed(0)}MB RSS \xB7 ${footprint.totalCpuPercent.toFixed(1)}% CPU \xB7 ${footprint.totalLspChildCount} LSP child process(es)` : "Resource footprint: unavailable (instance registry unreadable)"
    ];
    return renderToolText(lines.join("\n"), {
      aliveClients,
      servers,
      brokenServers,
      lastDispatch: last ? {
        filePath: last.filePath,
        totalDurationMs: last.totalDurationMs,
        totalDiagnostics: last.totalDiagnostics
      } : void 0,
      diagnostics: {
        shown: stats.totalShown,
        autoFixed: stats.totalAutoFixed,
        unresolved: stats.totalUnresolved
      },
      autoSession,
      treeSitter,
      turnEnd,
      resourceFootprint: footprint,
      degradations,
      configProvenance
    });
  }
  if (name === "pilens_effective_config") {
    const cwd = typeof args.cwd === "string" ? args.cwd : DEFAULT_CWD;
    const view = await effectiveConfig({
      cwd,
      ...typeof args.file === "string" ? { file: args.file } : {},
      redact: true
    });
    const fileLines = view.file === void 0 ? [] : isEffectiveFileViewError(view.file) ? [`File: ${view.file.error}`] : [
      effectiveFileHeading(view.file),
      ...view.file.servers.filter((server) => server.reason !== "extension-mismatch").map(effectiveServerLine),
      ...view.file.tools.map((tool) => `  ${tool.selected ? "\u2713" : "\u2717"} ${tool.id} \u2014 ${tool.reason}`)
    ];
    const lines = [
      `Config: ${view.documents.length} file(s) contributing, ${view.provenance.length} resolved leaf/leaves`,
      ...view.documents.map(effectiveDocumentLine),
      ...fileLines
    ];
    return renderToolText(lines.join("\n"), view);
  }
  if (name === "pilens_diagnostics") {
    const cwd = typeof args.cwd === "string" ? args.cwd : DEFAULT_CWD;
    await ensureReady(cwd);
    const out = await lensDiagnosticsTool.execute(
      "mcp",
      args,
      new AbortController().signal,
      void 0,
      // #2535: the shared tool renders host-callable advisory names.
      { cwd, host: "mcp" }
    );
    return out;
  }
  if (name === "pilens_latency") {
    const limit = typeof args.limit === "number" && Number.isFinite(args.limit) ? Math.max(1, Math.floor(args.limit)) : 5;
    const fileFilter = typeof args.file === "string" ? args.file : void 0;
    const recent = recentLatency(limit, fileFilter);
    const summary = recent.length === 0 ? "No dispatch latency reports yet." : recent.map((report) => `${path39.basename(report.filePath)}: ${report.totalDurationMs}ms (${report.totalDiagnostics} diag${report.stoppedEarly ? ", stopped early" : ""})`).join("\n");
    return renderToolText(summary, recent);
  }
  if (name === "pilens_session_start") {
    const cwd = typeof args.cwd === "string" ? args.cwd : DEFAULT_CWD;
    await ensureReady(cwd);
    const outcome = await runSessionStart(cwd);
    const lines = [
      `Session started for ${cwd}.`,
      `LSP: ${outcome.aliveLspClients} alive client(s) (warming continues in background).`,
      outcome.errorDebtBaseline ? `Error-debt baseline: tests ${outcome.errorDebtBaseline.testsPassed ? "pass" : "FAIL"}, build ${outcome.errorDebtBaseline.buildPassed ? "pass" : "FAIL"}.` : "Error-debt baseline: computing in background.",
      "knip/jscpd/type-coverage/dep scans run in background \u2014 query pilens_diagnostics shortly.",
      outcome.guidance ? `
${outcome.guidance}` : ""
    ];
    return renderToolText(lines.filter(Boolean).join("\n"), outcome);
  }
  if (name === "pilens_session_end") {
    endSituationalToolTelemetry();
    return renderToolText("Session ended.");
  }
  if (name === "pilens_turn_end") {
    const cwd = typeof args.cwd === "string" ? args.cwd : DEFAULT_CWD;
    await ensureReady(cwd);
    const files = Array.isArray(args.files) ? args.files.filter((file) => typeof file === "string") : [];
    const outcome = await runTurnEnd(cwd, files);
    const parts = [
      `Turn-end over ${outcome.filesRegistered} file(s).`,
      outcome.turnEnd ?? "No turn-end advisory.",
      outcome.tests ? `
Tests:
${outcome.tests}` : ""
    ];
    return renderToolText(parts.filter(Boolean).join("\n"), outcome);
  }
  if (name === "pilens_ast_grep_search" || name === "pilens_ast_grep_replace") {
    const cwd = typeof args.cwd === "string" ? args.cwd : DEFAULT_CWD;
    const tool = name === "pilens_ast_grep_search" ? astGrepSearchTool : astGrepReplaceTool;
    const out = await tool.execute("mcp", args, new AbortController().signal, void 0, { cwd, resultMaxItems: Number.POSITIVE_INFINITY });
    return out;
  }
  if (name === "pilens_lsp_navigation") {
    const cwd = typeof args.cwd === "string" ? args.cwd : DEFAULT_CWD;
    await ensureReady(cwd);
    const tool = lspNavigationTool;
    const out = await tool.execute("mcp", args, new AbortController().signal, void 0, { cwd });
    return out;
  }
  return { ...renderToolText(`Unknown tool: ${name}`), isError: true };
}
var WARN_ONLY_STALE_TOOLS = /* @__PURE__ */ new Set([
  "pilens_module_report",
  "pilens_project_report",
  "pilens_symbol_search",
  "pilens_project_scan",
  "pilens_health",
  "pilens_latency",
  "pilens_session_start",
  "pilens_turn_end",
  "pilens_ast_grep_search",
  "pilens_ast_grep_replace",
  "pilens_lsp_navigation",
  "pilens_read_symbol",
  "pilens_read_enclosing",
  "pilens_effective_config"
]);
function withStaleWarning(result) {
  if (result.content.length === 0)
    return result;
  const last = result.content[result.content.length - 1];
  return {
    ...result,
    content: [
      ...result.content.slice(0, -1),
      {
        ...last,
        text: `${last.text}

warmCodeStale: true
${STALE_WARN_ONLY}`
      }
    ]
  };
}
async function handleRequest(request) {
  const { id, method, params } = request;
  const isNotification = id === void 0;
  switch (method) {
    case "initialize": {
      startSituationalToolTelemetrySession("mcp");
      const requested = params?.protocolVersion;
      sendResult(id ?? null, {
        protocolVersion: typeof requested === "string" ? requested : FALLBACK_PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name: SERVER_NAME, version: SERVER_VERSION }
      });
      maybeAutoSessionStart();
      return;
    }
    case "notifications/initialized":
    case "initialized":
      return;
    // notification — no response
    case "ping":
      if (!isNotification)
        sendResult(id ?? null, {});
      return;
    case "tools/list":
      sendResult(id ?? null, { tools: enabledToolsForCwd(DEFAULT_CWD) });
      return;
    case "tools/call": {
      const name = params?.name;
      const rawArguments = params?.arguments;
      const argumentsAreObject = typeof rawArguments === "object" && rawArguments !== null && !Array.isArray(rawArguments);
      const args = argumentsAreObject ? rawArguments : {};
      if (typeof name !== "string") {
        sendError(id ?? null, -32602, "tools/call requires a string 'name'");
        return;
      }
      if (!argumentsAreObject && rawArguments !== void 0 && rawArguments !== null && !(Array.isArray(rawArguments) && rawArguments.length === 0)) {
        sendError(id ?? null, -32602, "tools/call 'arguments' must be an object");
        return;
      }
      const enabledName = name === "pilens_lsp_diagnostics" ? "pilens_diagnostics" : name;
      if (name !== "pilens_ast_grep_dump" && name !== "pilens_rebuild" && !enabledToolsForCwd(typeof args.cwd === "string" ? args.cwd : DEFAULT_CWD).some((tool) => tool.name === enabledName)) {
        sendResult(id ?? null, stripResultDetails(finalizeToolResult({
          ...renderToolText(`Unknown or disabled tool: ${name}`),
          isError: true
        })));
        return;
      }
      const inputSchema = ALL_TOOLS.find((tool) => tool.name === enabledName)?.inputSchema;
      const argumentReport = inputSchema ? findIgnoredArguments(inputSchema, args) : void 0;
      if (argumentReport) {
        incrementDegradationCount({
          kind: "mcp-ignored-arguments",
          subject: name,
          reason: `ignored argument(s): ${ignoredArgumentsStructured(argumentReport).ignoredArguments.join(", ")}`
        });
        const refused = refusalResult(name, argumentReport);
        if (refused) {
          sendResult(id ?? null, stripResultDetails(finalizeToolResult(refused)));
          return;
        }
      }
      const entry = toolRegistryEntryForMcp(name);
      if (entry && "situational" in entry && entry.situational) {
        startSituationalToolTelemetrySession("mcp");
        observeSituationalToolCall(entry.name);
      }
      maybeAutoSessionStart();
      try {
        let result = await callTool(name, args);
        if (WARN_ONLY_STALE_TOOLS.has(name) && !result.isError && isWarmBuildStale()) {
          result = withStaleWarning(result);
        }
        if (argumentReport)
          result = withIgnoredArguments(result, name, argumentReport);
        const delivery = finalizeToolResultWithDelivery(result);
        sendResult(id ?? null, stripResultDetails(delivery.result));
      } catch (err) {
        sendResult(id ?? null, stripResultDetails(finalizeToolResult({
          ...renderToolText(`pi-lens tool '${name}' failed: ${err.message}`),
          isError: true
        })));
      }
      return;
    }
    default:
      if (!isNotification)
        sendError(id ?? null, -32601, `Method not found: ${method}`);
      return;
  }
}
process.stdin.setEncoding("utf8");
process.stdin.on("data", createWarmIpcLineReader((raw) => {
  const line = raw.trim();
  if (line.length === 0)
    return;
  let request;
  try {
    request = JSON.parse(line);
  } catch {
    sendError(null, -32700, "Parse error");
  }
  if (request)
    void handleRequest(request);
}, {
  label: "mcp-stdio",
  continuous: true,
  onOverflow: () => sendError(null, -32700, "Parse error: request line exceeded the framing limit")
}));
process.stdin.on("end", () => {
  endSituationalToolTelemetry();
  void flushExtensionLog().finally(() => process.exit(0));
});
startIpcServer();
console.error(`[pi-lens-mcp] ready (cwd=${DEFAULT_CWD})`);
