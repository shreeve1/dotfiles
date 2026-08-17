/**
 * Shared machinery for pi-lens's session-scan security clients
 * (gitleaks #130, govulncheck #132, trivy #131).
 *
 * Each of those surfaces findings from an external CLI scanner with the same
 * lifecycle plumbing: a one-time availability resolution (PATH probe, optionally
 * followed by an auto-install) shared across concurrent first-time callers, plus
 * per-target scan re-entrancy so concurrent scans of the same root share a single
 * process. That plumbing was copy-pasted three times; this base owns it once and
 * lets each subclass supply only the tool-specific probe/install
 * (`doEnsureAvailable`) and the scan invocation.
 *
 * Refs: #130, #131, #132
 */
import { createSubsystemLogger } from "./extension-log.js";
import { safeSpawnAsync } from "./safe-spawn.js";
import { classifyProbeFailure, createAvailabilityLatch, logAvailabilityDecision, startHostStallSampler, } from "./dispatch/runners/utils/availability-policy.js";
export class SecurityScanClient {
    toolName;
    /**
     * Availability memo, backed by the shared transient-aware latch (#1467).
     *
     * Assigning `false` still means "durable: this machine does not have the
     * tool" — every existing subclass write keeps its meaning. A probe that
     * merely timed out must go through `markTransientlyUnavailable` instead, so
     * it expires and the tool can come back without a host restart.
     */
    availabilityLatch = createAvailabilityLatch();
    get available() {
        return this.availabilityLatch.read();
    }
    set available(value) {
        if (value === true)
            this.availabilityLatch.noteAvailable();
        else if (value === false)
            this.availabilityLatch.noteUnavailable("missing", "not-found");
        else
            this.availabilityLatch.reset();
    }
    /** Outcome/cause of the most recent `probeVersion` call. */
    lastProbeOutcome = null;
    lastProbeCause = null;
    ensureInFlight = null;
    inFlight = new Map();
    binaryPath = null;
    log;
    /**
     * @param toolName binary / installer id used for probes, logs and auto-install
     * @param verbose  when true, diagnostics are written to stderr
     */
    constructor(toolName, verbose = false) {
        this.toolName = toolName;
        this.log = verbose
            ? createSubsystemLogger(toolName)
            : () => { };
    }
    /**
     * Resolve (once) whether the scanner is usable, sharing the probe promise
     * across concurrent first-time callers. The tool-specific probe + optional
     * install lives in `doEnsureAvailable`.
     */
    async ensureAvailable() {
        if (this.available !== null)
            return this.available;
        if (this.ensureInFlight)
            return this.ensureInFlight;
        this.ensureInFlight = this.doEnsureAvailable();
        try {
            return await this.ensureInFlight;
        }
        finally {
            this.ensureInFlight = null;
        }
    }
    /**
     * Spawn `toolName <versionArgs>` and report whether it answered cleanly.
     * Does NOT mutate `this.available` — callers decide what a hit/miss means —
     * but it does classify the failure (`lastProbeOutcome`/`lastProbeCause`) and
     * emit one availability-decision record, so a probe that keeps timing out is
     * visible in latency.log rather than inferred from silence (#1467).
     */
    async probeVersion(versionArgs) {
        const sampler = startHostStallSampler();
        const startedAt = Date.now();
        let probe;
        let hostStallMs;
        try {
            probe = await safeSpawnAsync(this.toolName, versionArgs, {
                timeout: 5000,
            });
        }
        finally {
            hostStallMs = sampler.stop();
        }
        const elapsedMs = Date.now() - startedAt;
        if (!probe.error && probe.status === 0) {
            this.lastProbeOutcome = "success";
            this.lastProbeCause = "ok";
            this.log(`${this.toolName} found: ${probe.stdout.trim().split("\n")[0]}`);
            logAvailabilityDecision({
                tool: this.toolName,
                verdict: "available",
                outcome: "success",
                cause: "ok",
                elapsedMs,
                latched: true,
                hostStallMs,
                budgetMs: 5000,
            });
            return true;
        }
        const { outcome, cause } = classifyProbeFailure(probe, { hostStallMs });
        this.lastProbeOutcome = outcome;
        this.lastProbeCause = cause;
        logAvailabilityDecision({
            tool: this.toolName,
            verdict: "unavailable",
            outcome,
            cause,
            elapsedMs,
            latched: outcome !== "transient",
            hostStallMs,
            budgetMs: 5000,
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
     */
    markTransientlyUnavailable(cause = "probe-timeout") {
        return this.availabilityLatch.noteUnavailable("transient", cause);
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
            // A timed-out probe is not evidence the tool is absent, so it must not
            // trigger an install NOR latch a permanent `false`.
            this.log(`${this.toolName} availability probe timed out; not installing, will retry`);
            this.markTransientlyUnavailable(this.lastProbeCause ?? "probe-timeout");
            return false;
        }
        this.log(`${this.toolName} not found, attempting auto-install`);
        const { ensureTool } = await import("./installer/index.js");
        const installed = await ensureTool(this.toolName);
        if (!installed) {
            this.log(`${this.toolName} auto-install failed`);
            this.available = false;
            return false;
        }
        this.binaryPath = installed;
        this.available = true;
        this.log(`${this.toolName} auto-installed at ${installed}`);
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
        const promise = run().finally(() => this.inFlight.delete(key));
        this.inFlight.set(key, promise);
        return promise;
    }
}
