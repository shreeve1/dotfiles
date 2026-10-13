import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  createAvailabilityProbeFlight,
  probeToolAsync
} from "./chunk-RWWYJ623.js";
import {
  classifyProbeFailure,
  createAvailabilityLatch,
  logAvailabilityDecision,
  startHostStallSampler
} from "./chunk-VRZP76YM.js";
import {
  createGenerationSource
} from "./chunk-C34ZXZ7O.js";
import {
  createSingleFlight
} from "./chunk-BW5KFIQC.js";

// dist/clients/dispatch/runners/utils/candidate-probe.js
import * as fs from "node:fs";
async function probeAvailabilityCandidates(candidates, probeArgs, timeoutMs) {
  let sawTransient = false;
  let transientCause = "probe-timeout";
  let hostStallMs = 0;
  let evidence;
  for (const candidate of candidates) {
    try {
      if (candidate.includes("\\") || candidate.includes("/")) {
        if (fs.existsSync(candidate)) {
          return {
            foundPath: candidate,
            sawTransient,
            transientCause,
            hostStallMs,
            evidence
          };
        }
        continue;
      }
      const sampler = startHostStallSampler();
      let result;
      let stallMs;
      try {
        result = await probeToolAsync(candidate, probeArgs, {
          timeout: timeoutMs
        });
      } finally {
        stallMs = sampler.stop();
        hostStallMs += stallMs;
      }
      if (!result.error && result.status === 0) {
        return {
          foundPath: candidate,
          sawTransient,
          transientCause,
          hostStallMs,
          evidence
        };
      }
      const classified = classifyProbeFailure(result, {
        hostStallMs: stallMs,
        command: candidate
      });
      evidence = classified.evidence;
      if (classified.outcome === "transient") {
        sawTransient = true;
        transientCause = classified.cause;
      }
    } catch {
    }
  }
  return {
    foundPath: null,
    sawTransient,
    transientCause,
    hostStallMs,
    evidence
  };
}

// dist/clients/dispatch/runners/utils/toolchain-availability.js
var toolchainGenerations = createGenerationSource("toolchain-availability");
var toolchainProbeFlights = createAvailabilityProbeFlight({ generation: toolchainGenerations.current });
function createToolchainAvailability(config) {
  const availabilityLatch = createAvailabilityLatch();
  let toolPath = null;
  let sweepSawTransient = false;
  let sweepTransientCause = "probe-timeout";
  let sweepHostStallMs = 0;
  let sweepEvidence;
  const ensureFlight = createSingleFlight({
    generation: toolchainGenerations.current
  });
  async function findPath() {
    if (toolPath)
      return toolPath;
    const paths = process.platform === "win32" ? config.windowsPaths : config.unixPaths;
    const handle = toolchainGenerations.capture();
    const shared = toolchainProbeFlights.run(`toolchain:${config.tool}|${config.probeArgs.join("|")}|${config.windowsPaths.join("|")}|${config.unixPaths.join("|")}`, () => probeAvailabilityCandidates(paths, config.probeArgs, config.budgetMs));
    const sweep = await shared.promise;
    handle.guardedWrite(`findPath:${config.tool}`, () => {
      sweepSawTransient = sweep.sawTransient;
      sweepTransientCause = sweep.transientCause;
      sweepHostStallMs = sweep.hostStallMs;
      sweepEvidence = sweep.evidence;
      if (sweep.foundPath)
        toolPath = sweep.foundPath;
    });
    return sweep.foundPath;
  }
  async function resolveAvailability() {
    const startedAt = Date.now();
    const handle = toolchainGenerations.capture();
    const resolvedPath = await findPath();
    const found = resolvedPath !== null;
    const superseded = !handle.isCurrent();
    if (found) {
      handle.guardedWrite(`latch:${config.tool}`, () => availabilityLatch.noteAvailable());
      config.log(`${config.label} found: ${resolvedPath}`);
      logAvailabilityDecision({
        tool: config.tool,
        verdict: "available",
        outcome: "success",
        cause: "ok",
        elapsedMs: Date.now() - startedAt,
        latched: !superseded,
        hostStallMs: sweepHostStallMs,
        budgetMs: config.budgetMs,
        classifiedBy: "probe",
        ...sweepEvidence !== void 0 && { evidence: sweepEvidence }
      });
      return true;
    }
    const outcome = sweepSawTransient ? "transient" : "missing";
    const cause = sweepSawTransient ? sweepTransientCause : "not-found";
    const retryAfterMs = handle.guardedWrite(`latch:${config.tool}`, () => availabilityLatch.noteUnavailable(outcome, cause)) ?? 0;
    logAvailabilityDecision({
      tool: config.tool,
      verdict: "unavailable",
      outcome,
      cause,
      elapsedMs: Date.now() - startedAt,
      latched: !superseded && outcome !== "transient",
      hostStallMs: sweepHostStallMs,
      ...retryAfterMs > 0 && { retryAfterMs },
      budgetMs: config.budgetMs,
      // Derived from the sweep's own candidate probes, and carrying what the
      // last of them returned (#1500).
      classifiedBy: "probe",
      ...sweepEvidence !== void 0 && { evidence: sweepEvidence }
    });
    return false;
  }
  async function isAvailable() {
    const memo = availabilityLatch.read();
    if (memo !== null)
      return memo;
    return ensureFlight.run("availability", resolveAvailability);
  }
  function reset() {
    toolPath = null;
    availabilityLatch.reset();
    toolchainGenerations.bump();
  }
  return { findPath, isAvailable, reset };
}

export {
  createToolchainAvailability
};
