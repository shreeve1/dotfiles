import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  resolveManagedToolClient
} from "./chunk-YSZNHOBY.js";
import {
  biomeConfigArgs
} from "./chunk-RPLINGVB.js";
import "./chunk-EU63SDCG.js";
import "./chunk-VWCXW2E7.js";
import "./chunk-FCSOVF55.js";
import "./chunk-PNQDPDRC.js";
import "./chunk-ZXYDQ3TZ.js";
import "./chunk-724UL2TJ.js";
import "./chunk-QOZXJ4NA.js";
import "./chunk-P7266HLM.js";
import "./chunk-52FUZI6K.js";
import "./chunk-SAEFPSB6.js";
import "./chunk-GAEGEPOC.js";
import "./chunk-Z3CCVDUB.js";
import "./chunk-2BEMIWEW.js";
import "./chunk-ACXEQZOU.js";
import {
  resolveToolCwd
} from "./chunk-Q7DUK4LX.js";
import {
  findGlobalBinary,
  findLocalBinAt,
  localBinPath
} from "./chunk-AW7R2GWG.js";
import {
  getIsolatedNpxSpawnOptions,
  probeToolAsync
} from "./chunk-RWWYJ623.js";
import {
  classifyProbeFailure,
  createAvailabilityLatch,
  describeInstallAttempt,
  logAvailabilityDecision,
  startHostStallSampler
} from "./chunk-VRZP76YM.js";
import "./chunk-QOBUHWHX.js";
import "./chunk-QILIYSJF.js";
import "./chunk-6C7JWPCP.js";
import "./chunk-5NGR67U5.js";
import {
  getGlobalPiLensDir,
  safeSpawnAsync
} from "./chunk-C34ZXZ7O.js";
import {
  createSingleFlight
} from "./chunk-BW5KFIQC.js";
import "./chunk-QYF5S6P6.js";
import {
  isFileKind
} from "./chunk-PHDMFAKM.js";
import "./chunk-2BBLFX75.js";
import "./chunk-XVF2VVXP.js";
import "./chunk-ZANLILYD.js";
import "./chunk-2EECBNC5.js";
import "./chunk-JAU72XNY.js";
import {
  createSubsystemLogger
} from "./chunk-XTMJ7XDT.js";
import "./chunk-JMYYOTQG.js";
import "./chunk-QQNQ7SJW.js";
import "./chunk-AOHZU2BM.js";
import "./chunk-LJDODBBZ.js";
import "./chunk-ABBOA7UD.js";
import "./chunk-N2H3ZPZY.js";
import "./chunk-NXL4FFQQ.js";

// dist/clients/biome-client.js
import * as fs from "node:fs";
import * as path from "node:path";
var PROBE_TIMEOUT_MS = 1e4;
var BiomeClient = class {
  /**
   * Availability memo, backed by the shared transient-aware latch (#1476).
   *
   * Biome is the hot-path formatter: before this, ANY probe failure — a
   * timeout included — collapsed to `{ outcome: "missing" }`, which both
   * triggered an install and latched `false` for the life of the process. One
   * slow first format then disabled formatting until restart.
   */
  availabilityLatch = createAvailabilityLatch();
  /** Cause of the last probe, read when the resolution comes back. */
  lastProbeCause = null;
  /**
   * Measurements of the last failed probe, held until the latch decides how
   * long the verdict lasts. The decision record is emitted after that, so it
   * can carry `retryAfterMs` — a latch you can see is worth little if the
   * retry schedule is not greppable beside it (#1474).
   */
  lastProbeElapsedMs = 0;
  lastProbeHostStallMs = 0;
  /** Raw facts from the last probe, carried into the decision record (#1500). */
  lastProbeEvidence;
  // Per-cwd cache of the resolved biome binary. Keying by cwd matters in
  // monorepos where different sub-packages each ship their own biome
  // installation; sharing one slot across the whole client would cause
  // the first resolution to win and stale across other packages.
  localBinaryByCwd = /* @__PURE__ */ new Map();
  // The binary path written by `ensureTool("biome")` — genuinely global
  // (lives under ~/.pi-lens/tools), so it's stored separately from the
  // per-cwd cache and used as a final fallback before npx.
  autoInstalledBinaryPath = null;
  /**
   * At-most-one probe/auto-install in flight, via the shared primitive
   * (#1753). One instance owns one question, so the key is a constant.
   */
  ensureFlight = createSingleFlight();
  log;
  constructor(verbose = false) {
    this.log = verbose ? createSubsystemLogger("biome") : () => {
    };
  }
  /**
   * Resolve the fastest available biome binary for `cwd`.
   * Prefers local node_modules/.bin/biome (skip npx overhead ~1s).
   * Falls back to ~/.pi-lens/tools, then npx.
   *
   * In monorepos, callers should pass the project / sub-package root for the
   * edited file (typically `path.dirname(absolutePath)`). Omitting `cwd`
   * falls back to `process.cwd()`, which is wrong when pi is invoked from
   * a different directory than the file being edited.
   */
  async getBiomeBinary(cwd) {
    const resolveCwd = cwd ?? process.cwd();
    const cached = this.localBinaryByCwd.get(resolveCwd);
    if (cached)
      return { cmd: cached, args: [] };
    const isWin = process.platform === "win32";
    const piLensBin = path.join(getGlobalPiLensDir(), "tools", "node_modules", ".bin");
    const localBiome = localBinPath(findLocalBinAt("biome", resolveCwd, {
      windowsExt: ".cmd",
      isWindows: isWin
    }));
    if (localBiome) {
      this.localBinaryByCwd.set(resolveCwd, localBiome);
      return { cmd: localBiome, args: [] };
    }
    if (this.autoInstalledBinaryPath) {
      return { cmd: this.autoInstalledBinaryPath, args: [] };
    }
    const managedCandidates = isWin ? [path.join(piLensBin, "biome.cmd"), path.join(piLensBin, "biome")] : [path.join(piLensBin, "biome")];
    for (const p of managedCandidates) {
      if (fs.existsSync(p)) {
        this.localBinaryByCwd.set(resolveCwd, p);
        return { cmd: p, args: [] };
      }
    }
    const global = await findGlobalBinary("biome");
    if (global) {
      this.localBinaryByCwd.set(resolveCwd, global);
      return { cmd: global, args: [] };
    }
    return { cmd: "npx", args: ["@biomejs/biome"] };
  }
  async spawnBiomeAsync(args, timeout = 15e3, cwd) {
    const { cmd, args: prefix } = await this.getBiomeBinary(cwd);
    return safeSpawnAsync(cmd, [...prefix, ...args], {
      timeout,
      cwd,
      // ONE neutral-cwd seam for npx/bunx fallbacks (#4193, #4268 acceptance 3),
      // so a project `.npmrc` is never read; a resolved binary keeps the
      // project cwd it was given (biome.json discovery).
      ...cmd === "npx" || cmd === "bunx" ? getIsolatedNpxSpawnOptions() : {}
    });
  }
  /**
   * Ensure Biome is available, auto-installing if necessary.
   * Prefer this over isAvailable() for auto-install behavior.
   *
   * Re-entrancy safe: concurrent first-time callers share one flight, so
   * probing/auto-install isn't duplicated. The share and the clear-in-finally
   * belong to `singleFlight` (#1753); this method owns only the latch
   * short-circuit above it. #1690 exists because the hand-rolled clear here
   * was never exercised by a test.
   *
   * The memo returns `null` when the last verdict was transient and its
   * cooldown expired, which re-enters the probe: "biome is not installed" is a
   * fact worth caching, "the probe timed out" is a moment worth retrying.
   */
  async ensureAvailable() {
    const memo = this.availabilityLatch.read();
    if (memo !== null)
      return memo;
    return this.ensureFlight.run("biome", () => this.doEnsureAvailable());
  }
  /**
   * Probe `biome --version` and classify the failure through the shared
   * policy. Only a durable verdict (`missing` / `non-installable`) may reach
   * the install branch of `resolveManagedToolClient`; a transient one returns
   * as `transient`, which that seam passes straight back without installing.
   */
  async probeBiome() {
    const sampler = startHostStallSampler();
    const startedAt = Date.now();
    let result;
    let hostStallMs;
    try {
      const { cmd, args: prefix } = await this.getBiomeBinary();
      result = await probeToolAsync(cmd, [...prefix, "--version"], {
        timeout: PROBE_TIMEOUT_MS
      });
    } finally {
      hostStallMs = sampler.stop();
    }
    const elapsedMs = Date.now() - startedAt;
    if (!result.error && result.status === 0) {
      this.lastProbeCause = "ok";
      logAvailabilityDecision({
        tool: "biome",
        verdict: "available",
        outcome: "success",
        cause: "ok",
        elapsedMs,
        latched: true,
        hostStallMs,
        budgetMs: PROBE_TIMEOUT_MS,
        classifiedBy: "probe"
      });
      return { outcome: "success", value: true };
    }
    const { outcome, cause, evidence } = classifyProbeFailure(result, {
      hostStallMs,
      unclassifiedFailureOutcome: "missing"
    });
    const failureOutcome = outcome === "success" ? "non-installable" : outcome;
    this.lastProbeCause = cause;
    this.lastProbeElapsedMs = elapsedMs;
    this.lastProbeHostStallMs = hostStallMs;
    this.lastProbeEvidence = evidence;
    return { outcome: failureOutcome };
  }
  async doEnsureAvailable() {
    const resolved = await resolveManagedToolClient({
      toolId: "biome",
      cwd: process.cwd(),
      probe: () => this.probeBiome(),
      acceptInstalled: (installedPath) => {
        this.autoInstalledBinaryPath = installedPath;
        return true;
      }
    });
    if (resolved.outcome === "success") {
      this.availabilityLatch.noteAvailable();
      if (this.lastProbeCause !== null && this.lastProbeCause !== "ok") {
        logAvailabilityDecision({
          tool: "biome",
          verdict: "available",
          outcome: "success",
          cause: "ok",
          elapsedMs: this.lastProbeElapsedMs,
          latched: true,
          hostStallMs: this.lastProbeHostStallMs,
          budgetMs: PROBE_TIMEOUT_MS,
          classifiedBy: "caller",
          evidence: {
            install: "succeeded",
            binary: "biome",
            source: "managed-dir"
          }
        });
      }
      return true;
    }
    const cause = this.lastProbeCause ?? "not-found";
    const retryAfterMs = this.availabilityLatch.noteUnavailable(resolved.outcome, cause);
    let installEvidence;
    if (resolved.outcome === "missing") {
      const { getInstallAttempt } = await import("./probes/installer.js");
      installEvidence = describeInstallAttempt(getInstallAttempt("biome"));
    }
    const evidence = { ...this.lastProbeEvidence, ...installEvidence };
    logAvailabilityDecision({
      tool: "biome",
      verdict: "unavailable",
      outcome: resolved.outcome,
      cause,
      elapsedMs: this.lastProbeElapsedMs,
      latched: resolved.outcome !== "transient",
      hostStallMs: this.lastProbeHostStallMs,
      ...retryAfterMs > 0 && { retryAfterMs },
      budgetMs: PROBE_TIMEOUT_MS,
      // Per arm: a probe-derived verdict says `probe`, while a verdict asserted
      // by the install seam — or a cause that fell back because no probe ran —
      // says `caller`.
      classifiedBy: this.lastProbeCause === null || resolved.outcome === "non-installable" ? "caller" : "probe",
      ...Object.keys(evidence).length > 0 && { evidence }
    });
    if (resolved.outcome === "transient") {
      this.log("biome availability probe timed out; will retry (not installing)");
    }
    return false;
  }
  /**
   * Check if a file is supported by Biome
   */
  isSupportedFile(filePath) {
    return isFileKind(filePath, ["jsts", "json", "css"]);
  }
  /**
   * Async auto-fix variant for pipeline use (non-blocking spawn).
   * `cwd` is the dispatch language root (used for config discovery); when
   * omitted it defaults to the file's directory.
   */
  async fixFileAsync(filePath, cwd) {
    if (!await this.ensureAvailable()) {
      return {
        success: false,
        changed: false,
        fixed: 0,
        error: "Biome not available"
      };
    }
    const absolutePath = path.resolve(filePath);
    if (!fs.existsSync(absolutePath)) {
      return {
        success: false,
        changed: false,
        fixed: 0,
        error: "File not found"
      };
    }
    try {
      const before = await fs.promises.readFile(absolutePath, "utf-8");
      const configCwd = resolveToolCwd("runner", "biome", absolutePath, {
        ...cwd !== void 0 && { cwd }
      }).cwd;
      const result = await this.spawnBiomeAsync(["lint", "--write", ...biomeConfigArgs(configCwd), absolutePath], 15e3, configCwd);
      if (result.error) {
        return {
          success: false,
          changed: false,
          fixed: 0,
          error: result.error.message
        };
      }
      const after = await fs.promises.readFile(absolutePath, "utf-8");
      const changed = before !== after;
      if (changed) {
        this.log(`Fixed issue(s) in ${path.basename(filePath)}`);
      }
      return { success: true, changed, fixed: changed ? 1 : 0 };
    } catch (err) {
      return {
        success: false,
        changed: false,
        fixed: 0,
        error: err instanceof Error ? err.message : String(err)
      };
    }
  }
};
export {
  BiomeClient
};
