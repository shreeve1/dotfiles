import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  firstOutputLine,
  spawnFailedWithNoOutput
} from "./chunk-UZ3TUTRV.js";
import {
  SecurityScanClient
} from "./chunk-3EFKIGZN.js";
import {
  probeToolAsync
} from "./chunk-RWWYJ623.js";
import {
  INSTALL_TRANSIENT_MAX_ATTEMPTS,
  classifyProbeFailure,
  describeProbeEvidence,
  logAvailabilityDecision,
  startHostStallSampler
} from "./chunk-VRZP76YM.js";
import {
  safeSpawnAsync
} from "./chunk-C34ZXZ7O.js";
import {
  assertInstallAllowed
} from "./chunk-ZANLILYD.js";
import {
  recordDegradationOnce
} from "./chunk-JAU72XNY.js";

// dist/clients/govulncheck-client.js
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
var EMPTY_RESULT = {
  success: false,
  findings: []
};
var SCAN_TIMEOUT_MS = 12e4;
var INSTALL_TIMEOUT_MS = 6e4;
var GovulncheckClient = class _GovulncheckClient extends SecurityScanClient {
  constructor(verbose = false) {
    super("govulncheck", verbose);
  }
  /**
   * Detect whether the project root is a Go module. Cheap filesystem check.
   */
  static hasGoModule(cwd) {
    try {
      return fs.existsSync(path.join(cwd, "go.mod"));
    } catch {
      return false;
    }
  }
  /**
   * Resolve `govulncheck`: PATH probe, then auto-install via `go install`
   * (not the GitHub-release installer the other security clients use — the
   * toolchain is present by definition when there's a go.mod).
   */
  async doEnsureAvailable() {
    if (await this.probeVersion(["-version"])) {
      this.available = true;
      return true;
    }
    if (this.probeWasTransient()) {
      this.log("govulncheck probe timed out; retrying later (not installing)");
      return false;
    }
    if (!assertInstallAllowed("govulncheck go install")) {
      return false;
    }
    const goProbeStartedAt = Date.now();
    const goSampler = startHostStallSampler();
    let goOnPath;
    let goHostStallMs;
    try {
      goOnPath = await probeToolAsync("go", ["version"], {
        timeout: 5e3
      });
    } finally {
      goHostStallMs = goSampler.stop();
    }
    if (goOnPath.error || goOnPath.status !== 0) {
      const { outcome: outcome2, cause: cause2 } = classifyProbeFailure(goOnPath, {
        hostStallMs: goHostStallMs
      });
      if (outcome2 === "transient") {
        this.log("`go version` probe timed out; retrying govulncheck later");
        const retryAfterMs = this.markTransientlyUnavailable(cause2);
        logAvailabilityDecision({
          tool: "govulncheck",
          verdict: "unavailable",
          outcome: outcome2,
          cause: cause2,
          elapsedMs: Date.now() - goProbeStartedAt,
          latched: false,
          hostStallMs: goHostStallMs,
          ...retryAfterMs > 0 && { retryAfterMs },
          budgetMs: 5e3,
          classifiedBy: "probe"
        });
        return false;
      }
      this.log("go binary not on PATH \u2014 cannot auto-install govulncheck");
      this.noteDurableAbsence({
        ...describeProbeEvidence(goOnPath, "go"),
        install: "not-attempted"
      });
      return false;
    }
    this.log("govulncheck not found, attempting auto-install via go install");
    const installStartedAt = Date.now();
    const installSampler = startHostStallSampler();
    let install;
    let installHostStallMs;
    try {
      install = await safeSpawnAsync("go", ["install", "golang.org/x/vuln/cmd/govulncheck@latest"], { timeout: INSTALL_TIMEOUT_MS });
    } finally {
      installHostStallMs = installSampler.stop();
    }
    if (install.error || install.status !== 0) {
      this.log(`govulncheck auto-install failed: ${(install.stderr ?? "").slice(0, 200)}`);
      const { outcome: outcome2, cause: cause2 } = classifyProbeFailure(install, {
        hostStallMs: installHostStallMs
      });
      if (outcome2 === "transient") {
        const retryAfterMs = this.markTransientlyUnavailable(cause2, {
          operationClass: "install"
        });
        const exhausted = retryAfterMs === 0;
        const ceilingReason = `go install timed out ${INSTALL_TRANSIENT_MAX_ATTEMPTS} times; install retries disabled until the next session`;
        if (exhausted) {
          recordDegradationOnce({
            kind: "install-retry-exhausted",
            subject: "govulncheck",
            reason: ceilingReason
          });
        }
        logAvailabilityDecision({
          tool: "govulncheck",
          verdict: "unavailable",
          outcome: outcome2,
          // At the ceiling the latch rewrote the cause; a row still saying
          // `probe-timeout` would read as "cooling down" (#1497 review F5).
          cause: exhausted ? this.latchedCause() ?? cause2 : cause2,
          elapsedMs: Date.now() - installStartedAt,
          latched: exhausted,
          hostStallMs: installHostStallMs,
          ...retryAfterMs > 0 && { retryAfterMs },
          budgetMs: INSTALL_TIMEOUT_MS,
          // The ceiling verdict is an ASSERTION by this call site, not a
          // classification of one spawn, and #1534's convention is that such a
          // row says so and carries the install facts behind it. Every retry
          // DID run a `go install` that failed, so `install: "failed"` is
          // earned, and the reason names the ceiling rather than the spawn.
          // Below the ceiling, outcome/cause are fresh off `classifyProbeFailure`
          // above, so that row is still `"probe"` (#2209).
          classifiedBy: exhausted ? "caller" : "probe",
          ...exhausted && {
            evidence: {
              ...describeProbeEvidence(install, "go install"),
              install: "failed",
              installReason: ceilingReason
            }
          }
        });
        return false;
      }
      this.noteDurableAbsence({
        ...describeProbeEvidence(install, "go install"),
        install: "failed"
      }, { elapsedMs: Date.now() - installStartedAt });
      return false;
    }
    const reprobeStartedAt = Date.now();
    const reprobeSampler = startHostStallSampler();
    let reprobe;
    let reprobeHostStallMs;
    try {
      reprobe = await probeToolAsync("govulncheck", ["-version"], {
        timeout: 5e3
      });
    } finally {
      reprobeHostStallMs = reprobeSampler.stop();
    }
    if (!reprobe.error && reprobe.status === 0) {
      this.log("govulncheck auto-installed and found on PATH");
      this.available = true;
      logAvailabilityDecision({
        tool: "govulncheck",
        verdict: "available",
        outcome: "success",
        cause: "ok",
        elapsedMs: Date.now() - reprobeStartedAt,
        latched: true,
        hostStallMs: reprobeHostStallMs,
        budgetMs: 5e3,
        classifiedBy: "caller",
        evidence: {
          install: "succeeded",
          binary: "govulncheck",
          source: "go-install"
        }
      });
      return true;
    }
    const homeDir = os.homedir();
    const isWin = process.platform === "win32";
    const ext = isWin ? ".exe" : "";
    const candidates = [
      process.env.GOBIN,
      process.env.GOPATH ? path.join(process.env.GOPATH, "bin") : void 0,
      path.join(homeDir, "go", "bin")
    ].filter((d) => Boolean(d)).map((d) => path.join(d, `govulncheck${ext}`));
    for (const candidate of candidates) {
      try {
        if (fs.existsSync(candidate)) {
          this.binaryPath = candidate;
          this.available = true;
          this.log(`govulncheck auto-installed at ${candidate}`);
          logAvailabilityDecision({
            tool: "govulncheck",
            verdict: "available",
            outcome: "success",
            cause: "ok",
            elapsedMs: Date.now() - installStartedAt,
            latched: true,
            classifiedBy: "caller",
            evidence: {
              install: "succeeded",
              binary: path.basename(candidate),
              source: "go-install"
            }
          });
          return true;
        }
      } catch {
      }
    }
    const { outcome, cause } = classifyProbeFailure(reprobe, {
      hostStallMs: reprobeHostStallMs
    });
    if (outcome === "transient") {
      this.log("govulncheck installed but the re-probe timed out; retrying later");
      const retryAfterMs = this.markTransientlyUnavailable(cause);
      logAvailabilityDecision({
        tool: "govulncheck",
        verdict: "unavailable",
        outcome,
        cause,
        // The re-probe's own wall time. A hard-coded 0 here was the #1474
        // defect verbatim: a duration field that measures nothing.
        elapsedMs: Date.now() - reprobeStartedAt,
        latched: false,
        hostStallMs: reprobeHostStallMs,
        ...retryAfterMs > 0 && { retryAfterMs },
        budgetMs: 5e3,
        classifiedBy: "probe"
      });
      return false;
    }
    this.log("govulncheck auto-install succeeded but binary not locatable \u2014 check $GOBIN / $GOPATH");
    this.noteDurableAbsence({
      ...describeProbeEvidence(reprobe, "govulncheck"),
      install: "succeeded",
      installReason: "installed binary not found on PATH, $GOBIN or $GOPATH/bin"
    }, { elapsedMs: Date.now() - reprobeStartedAt });
    return false;
  }
  /**
   * Scan a Go module for reachable CVEs.
   *
   * Re-entrancy safe: concurrent calls against the same root share a single
   * govulncheck process. Mirrors the in-flight dedupe pattern used by
   * KnipClient / JscpdClient.
   */
  async analyze(cwd) {
    const targetDir = path.resolve(cwd);
    if (!_GovulncheckClient.hasGoModule(targetDir)) {
      return {
        ...EMPTY_RESULT,
        success: true,
        scannedAt: (/* @__PURE__ */ new Date()).toISOString(),
        summary: "No go.mod found at analysis root; govulncheck skipped"
      };
    }
    if (!await this.ensureAvailable()) {
      return {
        ...EMPTY_RESULT,
        scannedAt: (/* @__PURE__ */ new Date()).toISOString(),
        summary: "govulncheck not installed"
      };
    }
    return this.dedupeScan(targetDir, () => this.runScan(targetDir));
  }
  async runScan(cwd) {
    const scannedAt = (/* @__PURE__ */ new Date()).toISOString();
    const bin = this.binaryPath ?? "govulncheck";
    try {
      const result = await safeSpawnAsync(bin, ["-mode=source", "-format=json", "./..."], { cwd, timeout: SCAN_TIMEOUT_MS });
      if (result.error) {
        this.log(`Scan error: ${result.error.message}`);
        return {
          ...EMPTY_RESULT,
          scannedAt,
          summary: result.error.message.slice(0, 200)
        };
      }
      const rawStdout = result.stdout ?? "";
      if (result.status !== 0 && result.status !== 3) {
        return {
          ...EMPTY_RESULT,
          scannedAt,
          summary: firstOutputLine(result.stderr) || "scan failed"
        };
      }
      if (!rawStdout.trim()) {
        if (spawnFailedWithNoOutput(result, rawStdout)) {
          this.log(`Scan failed: ${(result.stderr ?? "").slice(0, 200)}`);
          return {
            ...EMPTY_RESULT,
            scannedAt,
            summary: firstOutputLine(result.stderr) || "scan failed"
          };
        }
        return {
          ...EMPTY_RESULT,
          success: true,
          scannedAt,
          summary: "govulncheck produced no output; nothing parsed"
        };
      }
      const findings = parseGovulncheckJson(rawStdout);
      return {
        success: true,
        analyzed: true,
        findings,
        scannedAt
      };
    } catch (err) {
      this.log(`Scan error: ${err instanceof Error ? err.message : err}`);
      return {
        ...EMPTY_RESULT,
        scannedAt,
        summary: err instanceof Error ? err.message.slice(0, 200) : String(err)
      };
    }
  }
};
function parseGovulncheckJson(stream) {
  if (!stream.trim())
    return [];
  const records = splitJsonStream(stream);
  const osvMeta = /* @__PURE__ */ new Map();
  const findings = [];
  for (const record of records) {
    const asOsv = record;
    if (asOsv.osv && typeof asOsv.osv.id === "string") {
      const affected = asOsv.osv.affected?.[0];
      const packageName = affected?.package?.name;
      const fixedVersion = affected?.ranges?.flatMap((r) => r.events ?? []).find((e) => typeof e.fixed === "string")?.fixed;
      osvMeta.set(asOsv.osv.id, {
        module: packageName,
        fixedVersion,
        summary: asOsv.osv.summary ?? asOsv.osv.details,
        url: asOsv.osv.database_specific?.url ?? affected?.database_specific?.url
      });
    }
  }
  for (const record of records) {
    const asFinding = record;
    const f = asFinding.finding;
    if (!f || typeof f.osv !== "string")
      continue;
    const trace = (f.trace ?? []).map((t) => ({
      module: t.module,
      packageName: t.package,
      functionName: t.function,
      filename: t.position?.filename,
      line: t.position?.line
    }));
    const meta = osvMeta.get(f.osv);
    findings.push({
      osv: f.osv,
      module: meta?.module,
      packageName: trace.find((t) => t.packageName)?.packageName,
      fixedVersion: f.fixed_version ?? meta?.fixedVersion,
      summary: meta?.summary,
      url: meta?.url,
      trace
    });
  }
  const seen = /* @__PURE__ */ new Set();
  const deduped = [];
  for (const f of findings) {
    if (seen.has(f.osv))
      continue;
    seen.add(f.osv);
    deduped.push(f);
  }
  return deduped;
}
function splitJsonStream(stream) {
  const records = [];
  for (const rawLine of stream.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line)
      continue;
    try {
      records.push(JSON.parse(line));
      continue;
    } catch {
    }
    for (const obj of extractBalancedObjects(line)) {
      records.push(obj);
    }
  }
  return records;
}
function extractBalancedObjects(input) {
  const found = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escape = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (inString) {
      if (ch === "\\")
        escape = true;
      else if (ch === '"')
        inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") {
      if (depth === 0)
        start = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && start !== -1) {
        const slice = input.slice(start, i + 1);
        try {
          found.push(JSON.parse(slice));
        } catch {
        }
        start = -1;
      } else if (depth < 0) {
        depth = 0;
        start = -1;
      }
    }
  }
  return found;
}

export {
  GovulncheckClient,
  parseGovulncheckJson
};
