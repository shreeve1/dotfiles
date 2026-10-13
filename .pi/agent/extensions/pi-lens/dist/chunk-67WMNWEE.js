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
  resolveTeardownOutcome,
  resolveWindowsCommandForEnvironment,
  safeSpawn,
  safeSpawnAsync,
  safeSpawnBatch,
  setAmbientAbortSignal
} from "./chunk-C34ZXZ7O.js";
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
  resolveTeardownOutcome,
  resolveWindowsCommandForEnvironment,
  safeSpawn,
  safeSpawnAsync,
  safeSpawnBatch,
  setAmbientAbortSignal
};
