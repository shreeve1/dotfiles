import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  recordDegradation
} from "./chunk-2453RRJ2.js";
import {
  logExtension
} from "./chunk-WQV6BI4Q.js";
import {
  stagePathFor
} from "./chunk-LJDODBBZ.js";

// dist/clients/project-trust.js
var trustState = "unknown";
var installRefusalWarnings = /* @__PURE__ */ new Set();
var INSTALL_REFUSAL_WARNING_CAP = 200;
var trustGeneration = 0;
function getProjectTrustGeneration() {
  return trustGeneration;
}
function latchProjectTrustState(next) {
  if (next === trustState)
    return;
  trustState = next;
  installRefusalWarnings.clear();
  trustGeneration += 1;
}
function setProjectTrustState(next) {
  const previous = trustState;
  latchProjectTrustState(next);
  if (previous !== next) {
    logExtension({
      subsystem: "project-trust",
      level: "debug",
      message: `project trust state transitioned: ${previous} -> ${next}`,
      metadata: { previous, next }
    });
  }
}
function getProjectTrustState() {
  return trustState;
}
function isToolInstallAllowedByTrust() {
  return trustState !== "untrusted";
}
function assertInstallAllowed(context) {
  if (isToolInstallAllowedByTrust())
    return true;
  recordDegradation({
    kind: "trust-refusal",
    subject: context,
    reason: projectTrustDenialReason() ?? "project trust denied"
  });
  if (!installRefusalWarnings.has(context)) {
    if (installRefusalWarnings.size >= INSTALL_REFUSAL_WARNING_CAP) {
      installRefusalWarnings.clear();
    }
    installRefusalWarnings.add(context);
    logExtension({
      subsystem: "project-trust",
      level: "warn",
      message: `install/materialization blocked: ${context}`,
      metadata: { context, trustState }
    });
  }
  return false;
}
function isLspSpawnAllowedByTrust() {
  return trustState !== "untrusted";
}
function projectTrustDenialReason() {
  return trustState === "untrusted" ? "project is not trusted (host isProjectTrusted() === false)" : void 0;
}

// dist/clients/atomic-write.js
import * as fs from "node:fs";
function writeFileAtomic(targetPath, data, options) {
  const bestEffort = options?.bestEffort ?? true;
  const tmpPath = stagePathFor(targetPath);
  try {
    fs.writeFileSync(tmpPath, data, {
      encoding: typeof data === "string" ? "utf-8" : void 0,
      mode: options?.mode
    });
    fs.renameSync(tmpPath, targetPath);
  } catch (err) {
    try {
      fs.rmSync(tmpPath, { force: true });
    } catch {
    }
    if (!bestEffort)
      throw err;
  }
}
async function writeFileAtomicAsync(targetPath, data, options) {
  const bestEffort = options?.bestEffort ?? true;
  const tmpPath = stagePathFor(targetPath);
  try {
    await fs.promises.writeFile(tmpPath, data, {
      encoding: typeof data === "string" ? "utf-8" : void 0,
      mode: options?.mode
    });
    await fs.promises.rename(tmpPath, targetPath);
  } catch (err) {
    try {
      await fs.promises.rm(tmpPath, { force: true });
    } catch {
    }
    if (!bestEffort)
      throw err;
  }
}

// dist/clients/spawn-output-cap.js
var DEFAULT_MAX_OUTPUT_BYTES = 32 * 1024 * 1024;
function createBoundedOutputSink(maxBytes = DEFAULT_MAX_OUTPUT_BYTES) {
  let text = "";
  let retained = 0;
  let truncated = false;
  let observed = 0;
  return {
    append(chunk) {
      const part = typeof chunk === "string" ? chunk : chunk.toString();
      const bytes = Buffer.byteLength(part);
      observed += bytes;
      if (retained + bytes <= maxBytes) {
        retained += bytes;
        text += part;
        return;
      }
      truncated = true;
    },
    get text() {
      return text;
    },
    get truncated() {
      return truncated;
    },
    get observedBytes() {
      return observed;
    }
  };
}
function truncatedByOutputCap(result) {
  return result.outputTruncated === true && result.failure !== "timeout" && result.failure !== "aborted";
}
function killedForOutputCap(result) {
  return result.killedForOutputCap === true && result.failure !== "timeout" && result.failure !== "aborted";
}

export {
  getProjectTrustGeneration,
  setProjectTrustState,
  getProjectTrustState,
  isToolInstallAllowedByTrust,
  assertInstallAllowed,
  isLspSpawnAllowedByTrust,
  projectTrustDenialReason,
  writeFileAtomic,
  writeFileAtomicAsync,
  DEFAULT_MAX_OUTPUT_BYTES,
  createBoundedOutputSink,
  truncatedByOutputCap,
  killedForOutputCap
};
