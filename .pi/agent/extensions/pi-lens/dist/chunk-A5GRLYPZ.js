import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  SpawnFailureError,
  VERIFIED_OWN_PID_CAP,
  WINDOWS_COMMAND_CACHE_MAX_ENTRIES,
  buildWindowsShellCommand,
  classifySpawnFailure,
  findCommand,
  findCommandAsync,
  getAmbientAbortSignal,
  hasSpawnFailureKind,
  holdOwnChildPid,
  isCommandAvailable,
  isCommandAvailableAsync,
  isOwnLiveChild,
  mergeWindowsEnvironment,
  releaseOwnChildPid,
  resetSafeSpawnWindowsCommandCache,
  resetUtf8ConsoleCodePageStateForTests,
  resolveSearchPathCommand,
  resolveTeardownOutcome,
  resolveWindowsCommandForEnvironment,
  safeSpawn,
  safeSpawnAsync,
  safeSpawnBatch,
  setAmbientAbortSignal,
  spawnAbortScope,
  statIsFile,
  trustScopedEnvironment,
  trustScopedSearchPath
} from "./chunk-WMDUT4KH.js";
import "./chunk-X35S7HSB.js";
import "./chunk-SQC7K3SP.js";
import "./chunk-JE6HKLC7.js";
import "./chunk-2453RRJ2.js";
import "./chunk-WQV6BI4Q.js";
import "./chunk-S26LC76R.js";
import "./chunk-565VRUP4.js";
import "./chunk-VLQ7UKZH.js";
import "./chunk-LJDODBBZ.js";
import "./chunk-GMROJJRN.js";
import "./chunk-NXL4FFQQ.js";
export {
  SpawnFailureError,
  VERIFIED_OWN_PID_CAP,
  WINDOWS_COMMAND_CACHE_MAX_ENTRIES,
  buildWindowsShellCommand,
  classifySpawnFailure,
  findCommand,
  findCommandAsync,
  getAmbientAbortSignal,
  hasSpawnFailureKind,
  holdOwnChildPid,
  isCommandAvailable,
  isCommandAvailableAsync,
  isOwnLiveChild,
  mergeWindowsEnvironment,
  releaseOwnChildPid,
  resetSafeSpawnWindowsCommandCache,
  resetUtf8ConsoleCodePageStateForTests,
  resolveSearchPathCommand,
  resolveTeardownOutcome,
  resolveWindowsCommandForEnvironment,
  safeSpawn,
  safeSpawnAsync,
  safeSpawnBatch,
  setAmbientAbortSignal,
  spawnAbortScope,
  statIsFile,
  trustScopedEnvironment,
  trustScopedSearchPath
};
