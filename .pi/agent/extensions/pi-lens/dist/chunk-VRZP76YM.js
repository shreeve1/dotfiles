import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  logLatency
} from "./chunk-QQNQ7SJW.js";

// dist/clients/dispatch/runners/utils/availability-policy.js
function describeProbeEvidence(result, command) {
  const errno = result.error?.code;
  return {
    ...command !== void 0 && { command },
    ...result.status !== void 0 && { status: result.status },
    ...result.failure !== void 0 && { failure: result.failure },
    ...result.spawnFailure?.kind !== void 0 && {
      spawnFailureKind: result.spawnFailure.kind
    },
    ...errno !== void 0 && { errno }
  };
}
function describeInstallAttempt(attempt, options = {}) {
  const reason = attempt?.reason?.slice(0, 200);
  if (options.installedButRejected) {
    return {
      install: "succeeded",
      installReason: reason ?? "installed binary failed validation"
    };
  }
  if (attempt === void 0)
    return { install: "not-attempted" };
  switch (attempt.outcome) {
    case "succeeded":
      return { install: "succeeded", ...reason && { installReason: reason } };
    case "failed":
      return { install: "failed", ...reason && { installReason: reason } };
    case "unavailable":
      return {
        install: "unavailable",
        ...reason && { installReason: reason }
      };
    default:
      return {
        install: "not-attempted",
        ...reason && { installReason: reason }
      };
  }
}
var TRANSIENT_BASE_COOLDOWN_MS = 3e4;
var TRANSIENT_MAX_COOLDOWN_MS = 3e5;
var HOST_STALL_COOLDOWN_MS = 5e3;
var HOST_STALL_EVIDENCE_MS = 500;
function isLatchingOutcome(outcome) {
  return outcome !== "transient";
}
function transientRetryDelayMs(attempts, cause, maxCooldownMs = TRANSIENT_MAX_COOLDOWN_MS) {
  if (cause === "host-stall")
    return HOST_STALL_COOLDOWN_MS;
  const exponent = Math.max(0, attempts - 1);
  return Math.min(maxCooldownMs, TRANSIENT_BASE_COOLDOWN_MS * 2 ** Math.min(exponent, 10));
}
var INSTALL_TRANSIENT_BASE_COOLDOWN_MS = 3e5;
var INSTALL_TRANSIENT_COOLDOWNS_MS = [
  INSTALL_TRANSIENT_BASE_COOLDOWN_MS,
  INSTALL_TRANSIENT_BASE_COOLDOWN_MS * 2
];
var INSTALL_TRANSIENT_MAX_ATTEMPTS = INSTALL_TRANSIENT_COOLDOWNS_MS.length + 1;
function installRetryDelayMs(attempts) {
  return INSTALL_TRANSIENT_COOLDOWNS_MS[Math.max(0, attempts - 1)] ?? 0;
}
var installRetryGeneration = 0;
function resetInstallRetryLatches() {
  installRetryGeneration += 1;
}
function classifyProbeFailure(result, options = {}) {
  const evidence = describeProbeEvidence(result, options.command);
  const errorCode = result.error?.code;
  if (result.spawnFailure?.kind === "tool-not-found") {
    return { outcome: "missing", cause: "not-found", evidence };
  }
  if (result.failure === "timeout" || result.failure === "aborted" || result.failure === "signal" || result.spawnFailure?.kind === "killed" || result.spawnFailure?.kind === "timeout" || errorCode === "EAGAIN" || errorCode === "EBUSY") {
    const stalled = (options.hostStallMs ?? 0) >= HOST_STALL_EVIDENCE_MS;
    return {
      outcome: "transient",
      cause: stalled ? "host-stall" : "probe-timeout",
      evidence
    };
  }
  const outcome = options.unclassifiedFailureOutcome ?? "non-installable";
  return {
    outcome,
    cause: outcome === "missing" ? "not-found" : "probe-rejected",
    evidence
  };
}
function startHostStallSampler(intervalMs = 100) {
  let stallMs = 0;
  let last = Date.now();
  let stopped = false;
  const timer = setInterval(() => {
    const now = Date.now();
    const lateness = now - last - intervalMs;
    if (lateness > 0)
      stallMs += lateness;
    last = now;
  }, intervalMs);
  timer?.unref?.();
  return {
    stop: () => {
      if (stopped)
        return Math.round(stallMs);
      stopped = true;
      clearInterval(timer);
      const tail = Date.now() - last - intervalMs;
      if (tail > 0)
        stallMs += tail;
      return Math.round(stallMs);
    }
  };
}
function createAvailabilityLatch(options = {}) {
  let available = null;
  let outcome = null;
  let cause = null;
  let retryAtMs = 0;
  let transientAttempts = 0;
  let installAttempts = 0;
  let installExhausted = false;
  let installRetryAtMs = 0;
  let provisional = false;
  const maxCooldownMs = options.maxCooldownMs ?? TRANSIENT_MAX_COOLDOWN_MS;
  let installGeneration = installRetryGeneration;
  function clearVerdict() {
    available = null;
    outcome = null;
    cause = null;
    retryAtMs = 0;
    transientAttempts = 0;
    installAttempts = 0;
    installExhausted = false;
    installRetryAtMs = 0;
    provisional = false;
  }
  function syncInstallGeneration() {
    if (installGeneration === installRetryGeneration)
      return;
    installGeneration = installRetryGeneration;
    if (installExhausted) {
      clearVerdict();
      return;
    }
    installAttempts = 0;
    installRetryAtMs = 0;
  }
  function effectiveRetryAtMs() {
    return Math.max(retryAtMs, installRetryAtMs);
  }
  return {
    read() {
      syncInstallGeneration();
      if (available === true) {
        if (provisional && Date.now() >= effectiveRetryAtMs())
          return null;
        return true;
      }
      if (available !== false)
        return available;
      if (installExhausted)
        return false;
      if (outcome !== "transient")
        return false;
      return Date.now() >= effectiveRetryAtMs() ? null : false;
    },
    noteAvailable(nextCause = "ok") {
      installGeneration = installRetryGeneration;
      available = true;
      outcome = "success";
      cause = nextCause;
      retryAtMs = 0;
      transientAttempts = 0;
      installAttempts = 0;
      installExhausted = false;
      installRetryAtMs = 0;
      provisional = false;
    },
    noteProvisionallyAvailable(transientCause) {
      syncInstallGeneration();
      available = true;
      outcome = "success";
      cause = transientCause;
      provisional = true;
      installAttempts = 0;
      installExhausted = false;
      installRetryAtMs = 0;
      transientAttempts += 1;
      const delay = transientRetryDelayMs(transientAttempts, transientCause, maxCooldownMs);
      retryAtMs = Date.now() + delay;
      return delay;
    },
    noteUnavailable(nextOutcome, nextCause, opts) {
      syncInstallGeneration();
      available = false;
      outcome = nextOutcome;
      cause = nextCause;
      provisional = false;
      if (isLatchingOutcome(nextOutcome)) {
        retryAtMs = 0;
        installRetryAtMs = 0;
        return 0;
      }
      if (opts?.operationClass === "install") {
        installAttempts += 1;
        const installDelay = installRetryDelayMs(installAttempts);
        if (installDelay === 0) {
          installExhausted = true;
          cause = "install-retry-exhausted";
          retryAtMs = 0;
          installRetryAtMs = 0;
          return 0;
        }
        installRetryAtMs = Date.now() + installDelay;
        return installDelay;
      }
      transientAttempts += 1;
      const delay = transientRetryDelayMs(transientAttempts, nextCause, maxCooldownMs);
      retryAtMs = Date.now() + delay;
      return delay;
    },
    reset() {
      installGeneration = installRetryGeneration;
      clearVerdict();
    },
    getOutcome: () => outcome,
    getCause: () => cause,
    getRetryAtMs: () => effectiveRetryAtMs(),
    isProvisional: () => provisional,
    isInstallExhausted: () => {
      syncInstallGeneration();
      return installExhausted;
    }
  };
}
function isTransientDecision(decision) {
  return decision?.outcome === "transient";
}
function describeUnavailability(options) {
  const { tool, installHint } = options;
  if (options.outcome !== "transient") {
    return `${tool} not available. Install with: ${installHint}`;
  }
  if (options.cause === "install-retry-exhausted") {
    return `${tool} install kept timing out and reached its retry ceiling (${INSTALL_TRANSIENT_MAX_ATTEMPTS} attempts). ${tool} is not reported missing \u2014 the install is not being retried again this session, and recovers at the next session. To install it now: ${installHint}`;
  }
  const elapsed = options.elapsedMs ? ` after ${options.elapsedMs}ms` : "";
  const stalled = options.cause === "host-stall" ? " (the pi host event loop stalled during the probe window, so the budget expired on the host side)" : "";
  const retry = options.retryAfterMs ? ` Retrying in ${Math.round(options.retryAfterMs / 1e3)}s.` : " It will be retried.";
  return `${tool} availability probe timed out${elapsed}${stalled}. ${tool} is not reported missing \u2014 this is a probe timeout, not a missing install.${retry}`;
}
function logAvailabilityDecision(decision, filePath = "<pi-lens>") {
  logLatency({
    type: "phase",
    phase: "availability_decision",
    filePath,
    durationMs: Math.round(decision.elapsedMs),
    metadata: {
      tool: decision.tool,
      ...decision.producer !== void 0 && {
        producer: decision.producer
      },
      verdict: decision.verdict,
      outcome: decision.outcome,
      cause: decision.cause,
      latched: decision.latched,
      ...decision.classifiedBy !== void 0 && {
        classifiedBy: decision.classifiedBy
      },
      // The raw facts sit beside the verdict they produced, so a `missing` row
      // can be read as justified or not without re-running anything (#1500).
      ...decision.evidence !== void 0 && { evidence: decision.evidence },
      ...decision.hostStallMs !== void 0 && {
        hostStallMs: decision.hostStallMs
      },
      ...decision.retryAfterMs !== void 0 && {
        retryAfterMs: decision.retryAfterMs
      },
      ...decision.budgetMs !== void 0 && { budgetMs: decision.budgetMs },
      ...decision.provisional === true && { provisional: true },
      ...decision.unreachablePreferred !== void 0 && {
        unreachablePreferred: decision.unreachablePreferred
      },
      ...decision.retained === true && { retained: true },
      ...decision.servedFromCooldown === true && { servedFromCooldown: true }
    }
  });
}

export {
  describeProbeEvidence,
  describeInstallAttempt,
  TRANSIENT_MAX_COOLDOWN_MS,
  isLatchingOutcome,
  transientRetryDelayMs,
  INSTALL_TRANSIENT_MAX_ATTEMPTS,
  installRetryDelayMs,
  resetInstallRetryLatches,
  classifyProbeFailure,
  startHostStallSampler,
  createAvailabilityLatch,
  isTransientDecision,
  describeUnavailability,
  logAvailabilityDecision
};
