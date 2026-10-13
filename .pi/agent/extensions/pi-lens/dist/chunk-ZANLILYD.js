import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  recordDegradation
} from "./chunk-JAU72XNY.js";
import {
  logExtension
} from "./chunk-XTMJ7XDT.js";

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

export {
  getProjectTrustGeneration,
  setProjectTrustState,
  getProjectTrustState,
  isToolInstallAllowedByTrust,
  assertInstallAllowed,
  isLspSpawnAllowedByTrust,
  projectTrustDenialReason
};
