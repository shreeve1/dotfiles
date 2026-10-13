import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  createNdjsonLogger,
  getGlobalPiLensLogDir,
  getMaxLogSizeMB,
  getTurnId,
  isTestMode
} from "./chunk-AOHZU2BM.js";

// dist/clients/extension-log.js
import * as path from "node:path";
var EXTENSION_LOG_FILE = path.join(getGlobalPiLensLogDir(), "extension.log");
var writer = createNdjsonLogger({
  filePath: EXTENSION_LOG_FILE,
  maxBytes: getMaxLogSizeMB() * 1024 * 1024
});
function logExtension(entry) {
  if (isTestMode())
    return;
  writer.log({
    ts: (/* @__PURE__ */ new Date()).toISOString(),
    pid: process.pid,
    turnId: getTurnId(),
    level: entry.level ?? "error",
    subsystem: entry.subsystem,
    message: entry.message,
    ...entry.metadata ? { metadata: entry.metadata } : {}
  });
}
function createSubsystemLogger(subsystem, defaultLevel = "debug") {
  const at = (level) => (message, metadata) => {
    logExtension({ subsystem, message, level, metadata });
  };
  const logger = at(defaultLevel);
  logger.error = at("error");
  logger.warn = at("warn");
  logger.debug = at("debug");
  return logger;
}
function flushExtensionLog() {
  return writer.flush();
}

export {
  logExtension,
  createSubsystemLogger,
  flushExtensionLog
};
