import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  createAvailabilityProbeFlight,
  probeToolAsync
} from "./chunk-RWWYJ623.js";
import {
  classifyProbeFailure,
  createAvailabilityLatch,
  describeInstallAttempt,
  describeProbeEvidence,
  logAvailabilityDecision,
  startHostStallSampler
} from "./chunk-VRZP76YM.js";
import {
  createSingleFlight
} from "./chunk-BW5KFIQC.js";
import {
  createSubsystemLogger
} from "./chunk-XTMJ7XDT.js";

// dist/clients/security-scan-client.js
import * as path from "node:path";
var securityProbeFlights = createAvailabilityProbeFlight();
var SecurityScanClient = class {
  toolName;
  /**
   * Availability memo, backed by the shared transient-aware latch (#1467).
   *
   * Assigning `false` still means "durable: this machine does not have the
   * tool" — every existing subclass write keeps its meaning. A transient
   * failure must expire instead: `probeVersion` latches its own transient
   * verdicts (#1501), and any other transient failure (a scan or install
   * timeout) goes through `markTransientlyUnavailable`, so the tool can come
   * back without a host restart.
   */
  availabilityLatch = createAvailabilityLatch();
  get available() {
    return this.availabilityLatch.read();
  }
  set available(value) {
    if (value === true) {
      this.availabilityLatch.noteAvailable();
      return;
    }
    if (value !== false) {
      this.availabilityLatch.reset();
      return;
    }
    this.availabilityLatch.noteUnavailable("missing", "not-found");
    this.logDurableAbsence();
  }
  /**
   * Latch a durable absence WITH the facts behind it. Prefer this over
   * `available = false` wherever the call site knows what actually failed — a
   * `missing` row carrying `install: "failed"` is a retry candidate, one
   * carrying `install: "not-attempted"` is a policy decision, and a bare one is
   * a plain absence. Only the record can tell them apart.
   */
  noteDurableAbsence(evidence, options = {}) {
    this.availabilityLatch.noteUnavailable("missing", "not-found");
    this.logDurableAbsence(evidence, options.elapsedMs);
  }
  /**
   * One record per durable-absence ASSERTION, whether or not the call site had
   * evidence. Before this, `available = false` after a failed install was a
   * silent latch: the tool went quiet for the session with nothing in
   * latency.log to audit (#1500). Bounded — the verdict latches, so at most one
   * row per client per session.
   *
   * `elapsedMs` is whatever the caller measured (an install attempt's duration);
   * there is no probe here, so it is 0 unless the caller has something real.
   */
  logDurableAbsence(evidence, elapsedMs = 0) {
    logAvailabilityDecision({
      tool: this.toolName,
      producer: "security-scan",
      verdict: "unavailable",
      outcome: "missing",
      cause: "not-found",
      elapsedMs,
      latched: true,
      classifiedBy: "caller",
      ...evidence !== void 0 && { evidence }
    });
  }
  /** Outcome of the most recent `probeVersion` call. */
  lastProbeOutcome = null;
  /** Availability resolution is instance-owned; only its external probe is shared. */
  ensureFlight = createSingleFlight();
  inFlight = /* @__PURE__ */ new Map();
  binaryPath = null;
  log;
  /**
   * @param toolName binary / installer id used for probes, logs and auto-install
   * @param verbose  when true, diagnostics are written to stderr
   */
  constructor(toolName, verbose = false) {
    this.toolName = toolName;
    this.log = verbose ? createSubsystemLogger(toolName) : () => {
    };
  }
  /**
   * Resolve (once) whether the scanner is usable, sharing the probe promise
   * across concurrent first-time callers. The tool-specific probe + optional
   * install lives in `doEnsureAvailable`.
   */
  async ensureAvailable() {
    if (this.available !== null)
      return this.available;
    return this.ensureFlight.run("availability", () => this.doEnsureAvailable());
  }
  /**
   * Spawn `toolName <versionArgs>` and report whether it answered cleanly.
   * Classifies the failure (`lastProbeOutcome`) and emits one
   * availability-decision record, so a probe that keeps timing out is visible
   * in latency.log rather than inferred from silence (#1467).
   *
   * Latch ownership is split by outcome: success and durable failures leave
   * `this.available` to the caller (a missing binary may still be
   * auto-installed), while a TRANSIENT failure is latched by the seam itself
   * with its cooldown — the retry schedule only exists once the latch owns
   * the verdict, and the record is incomplete without it (#1501). Callers
   * must not re-mark a probe transient (a second noteUnavailable would
   * double-escalate the cooldown).
   */
  async probeVersion(versionArgs) {
    const sampler = startHostStallSampler();
    const startedAt = Date.now();
    let probe;
    let hostStallMs;
    let resolvedBinaryPath = null;
    let probeJoined = false;
    try {
      const shared = securityProbeFlights.run(`security:${this.toolName}|${versionArgs.join("|")}`, async () => {
        const { findManagedToolBinary } = await import("./probes/installer.js");
        const managed = await findManagedToolBinary(this.toolName);
        return {
          probe: await probeToolAsync(managed ?? this.toolName, versionArgs, {
            timeout: 5e3
          }),
          binaryPath: managed ?? null
        };
      });
      probeJoined = shared.joined;
      const flightResult = await shared.promise;
      probe = flightResult.probe;
      resolvedBinaryPath = flightResult.binaryPath;
      if (!probe.error && probe.status === 0 && flightResult.binaryPath) {
        this.binaryPath = flightResult.binaryPath;
      }
    } finally {
      hostStallMs = sampler.stop();
    }
    const elapsedMs = Date.now() - startedAt;
    if (!probe.error && probe.status === 0) {
      this.lastProbeOutcome = "success";
      this.log(`${this.toolName} found: ${probe.stdout.trim().split("\n")[0]}`);
      logAvailabilityDecision({
        tool: this.toolName,
        producer: "security-scan",
        verdict: "available",
        outcome: "success",
        cause: "ok",
        elapsedMs,
        latched: true,
        hostStallMs,
        budgetMs: 5e3,
        classifiedBy: probeJoined ? "joined" : "probe",
        evidence: {
          ...describeProbeEvidence(probe),
          ...resolvedBinaryPath && {
            binary: path.basename(resolvedBinaryPath),
            source: "managed-dir"
          }
        }
      });
      return true;
    }
    const { outcome, cause, evidence } = classifyProbeFailure(probe, {
      hostStallMs
    });
    this.lastProbeOutcome = outcome;
    const retryAfterMs = outcome === "transient" ? this.availabilityLatch.noteUnavailable("transient", cause) : 0;
    logAvailabilityDecision({
      tool: this.toolName,
      producer: "security-scan",
      verdict: "unavailable",
      outcome,
      cause,
      elapsedMs,
      latched: outcome !== "transient",
      hostStallMs,
      ...retryAfterMs > 0 && { retryAfterMs },
      budgetMs: 5e3,
      classifiedBy: probeJoined ? "joined" : "probe",
      evidence: {
        ...evidence,
        ...resolvedBinaryPath && {
          binary: path.basename(resolvedBinaryPath),
          source: "managed-dir"
        }
      }
    });
    return false;
  }
  /** True when the last probe failed for a reason that is not the tool's fault. */
  probeWasTransient() {
    return this.lastProbeOutcome === "transient";
  }
  /**
   * Record a non-durable unavailability: the verdict expires after a cooldown
   * and the next `ensureAvailable` re-probes.
   *
   * Returns that cooldown in ms so the caller can put it in its decision
   * record. A latch you can read in `latency.log` without the retry schedule
   * beside it only tells you the tool is off, not when it comes back.
   *
   * For NON-probe transient failures only (scan/install timeouts):
   * `probeVersion` latches and logs its own transient verdicts (#1501), so
   * re-marking one here would double-escalate the cooldown.
   *
   * Pass `opts.operationClass: "install"` when the failed operation was a
   * network install/compile rather than a cheap probe (#1497): the retry
   * escalates on the install-class schedule, on its OWN cooldown slot (a
   * cheap probe failure can never shorten it), and latches for the session at
   * the attempt ceiling, in which case the return is 0 (latched).
   */
  markTransientlyUnavailable(cause = "probe-timeout", opts) {
    return this.availabilityLatch.noteUnavailable("transient", cause, opts);
  }
  /**
   * The cause the LATCH settled on, which is not always the cause the caller
   * passed in: at the install-class ceiling the latch rewrites it to
   * `install-retry-exhausted` (#1497). A decision record built from the
   * caller's own cause would say `probe-timeout` for a verdict that is no
   * longer being retried, so the record reads it back from here.
   */
  latchedCause() {
    return this.availabilityLatch.getCause();
  }
  /**
   * #1623: public window onto the availability verdict for callers OUTSIDE
   * the dispatch graph (mode=full's fresh-fetch) that need to say WHY
   * `ensureAvailable()` most recently returned false — using the SAME
   * `AvailabilityOutcome`/`AvailabilityCause` taxonomy every dispatch-side
   * message is built from, rather than a re-guessed "binary unavailable"
   * that can't tell a transient retry-cooldown probe from a durable absence.
   * `latchedCause()`/`lastProbeOutcome` above stay `protected` for
   * dispatch-internal callers; this is the one public seam for everyone
   * else.
   */
  getAvailabilityVerdict() {
    return {
      outcome: this.availabilityLatch.getOutcome(),
      cause: this.availabilityLatch.getCause(),
      retryAtMs: this.availabilityLatch.getRetryAtMs()
    };
  }
  /**
   * Standard availability path for the GitHub-release tools (gitleaks, trivy):
   * PATH probe first, then fall back to the pi-lens installer's `ensureTool`.
   * Records the resolved binary path and sets `this.available`.
   */
  async ensureViaInstaller(versionArgs) {
    if (await this.probeVersion(versionArgs)) {
      this.available = true;
      return true;
    }
    if (this.probeWasTransient()) {
      this.log(`${this.toolName} availability probe timed out; not installing, will retry`);
      return false;
    }
    this.log(`${this.toolName} not found, attempting auto-install`);
    const { ensureTool, getInstallAttempt } = await import("./probes/installer.js");
    const installStartedAt = Date.now();
    const installed = await ensureTool(this.toolName);
    if (!installed) {
      const attempt = getInstallAttempt(this.toolName);
      this.log(attempt?.outcome === "failed" ? `${this.toolName} auto-install failed: ${attempt.reason ?? "unknown reason"}` : `${this.toolName} auto-install did not run: ${attempt?.reason ?? "no attempt recorded"}`);
      this.noteDurableAbsence(describeInstallAttempt(attempt), {
        elapsedMs: Date.now() - installStartedAt
      });
      return false;
    }
    this.binaryPath = installed;
    this.available = true;
    this.log(`${this.toolName} auto-installed at ${installed}`);
    logAvailabilityDecision({
      tool: this.toolName,
      verdict: "available",
      outcome: "success",
      cause: "ok",
      elapsedMs: Date.now() - installStartedAt,
      latched: true,
      classifiedBy: "caller",
      evidence: {
        install: "succeeded",
        binary: path.basename(installed),
        source: "managed-dir"
      }
    });
    return true;
  }
  /**
   * Per-target scan re-entrancy: when a scan for `key` is already running, the
   * concurrent caller shares the in-flight promise instead of spawning a second
   * process. The entry is cleared when the run settles.
   */
  dedupeScan(key, run) {
    const existing = this.inFlight.get(key);
    if (existing) {
      this.log(`Scan already in flight for ${key}; sharing result`);
      return existing;
    }
    const promise = run().finally(() => {
      if (this.inFlight.get(key) === promise)
        this.inFlight.delete(key);
    });
    this.inFlight.set(key, promise);
    return promise;
  }
};

export {
  SecurityScanClient
};
