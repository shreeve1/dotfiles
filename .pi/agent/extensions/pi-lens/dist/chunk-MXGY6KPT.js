import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  scannerReportParentDir
} from "./chunk-CSHFH5IN.js";
import {
  getScratchTreeDirNames
} from "./chunk-VCHXCQFG.js";
import {
  SecurityScanClient
} from "./chunk-3EFKIGZN.js";
import {
  resolveOpengrepConfig
} from "./chunk-VWCXW2E7.js";
import "./chunk-PNQDPDRC.js";
import "./chunk-RWWYJ623.js";
import "./chunk-VRZP76YM.js";
import {
  safeSpawnAsync
} from "./chunk-C34ZXZ7O.js";
import "./chunk-BW5KFIQC.js";
import "./chunk-2BBLFX75.js";
import "./chunk-XVF2VVXP.js";
import "./chunk-2EECBNC5.js";
import {
  recordDegradationOnce
} from "./chunk-JAU72XNY.js";
import "./chunk-XTMJ7XDT.js";
import "./chunk-JMYYOTQG.js";
import "./chunk-QQNQ7SJW.js";
import "./chunk-AOHZU2BM.js";
import "./chunk-LJDODBBZ.js";
import "./chunk-ABBOA7UD.js";
import {
  realpathOrResolve
} from "./chunk-N2H3ZPZY.js";
import "./chunk-NXL4FFQQ.js";

// dist/clients/opengrep-client.js
import * as fs from "node:fs";
import * as path from "node:path";
import { mkdtempSync } from "node:fs";
var EMPTY_RESULT = {
  success: false,
  findings: []
};
var SCAN_TIMEOUT_MS = 18e4;
var OpengrepClient = class _OpengrepClient extends SecurityScanClient {
  constructor(verbose = false) {
    super("opengrep", verbose);
  }
  /**
   * Structurally always-on (mirrors `opengrepInitialization` in
   * `clients/lsp/server.ts`) — `resolveOpengrepConfig(cwd, { enabled: true })`
   * only resolves WHICH rules to run, not whether opengrep runs at all.
   * Exported as a static so callers can gate/log without constructing.
   */
  static resolveConfig(cwd) {
    return resolveOpengrepConfig(cwd, { enabled: true });
  }
  /**
   * opengrep's top-level `--version` (no `scan` subcommand) — matches the
   * installer's `checkArgs: ["--version"]` entry (`installer/index.ts`).
   */
  doEnsureAvailable() {
    return this.ensureViaInstaller(["--version"]);
  }
  /**
   * Scan a directory tree with opengrep's rule set (local config or `auto`).
   * Re-entrancy safe: concurrent calls against the same root share a single
   * opengrep process (mirrors `GitleaksClient`/`JscpdClient`).
   */
  async scan(cwd) {
    const targetDir = realpathOrResolve(cwd);
    const scannedAt = (/* @__PURE__ */ new Date()).toISOString();
    if (!await this.ensureAvailable()) {
      return {
        ...EMPTY_RESULT,
        scannedAt,
        reason: "not-installed",
        summary: "opengrep not installed"
      };
    }
    return this.dedupeScan(targetDir, () => this.runScan(targetDir));
  }
  async runScan(cwd) {
    const scannedAt = (/* @__PURE__ */ new Date()).toISOString();
    const bin = this.binaryPath ?? "opengrep";
    const resolved = _OpengrepClient.resolveConfig(cwd);
    const outDir = mkdtempSync(path.join(scannerReportParentDir(), "pi-lens-opengrep-"));
    const reportPath = path.join(outDir, "opengrep-report.json");
    try {
      const result = await safeSpawnAsync(bin, [
        "scan",
        "--config",
        resolved.configArg ?? "auto",
        "--json",
        "--json-output",
        reportPath,
        // Never fail the scan on findings — this is a read, not a gate
        // (matches gitleaks's `--exit-code 0` intent).
        "--no-error",
        "--quiet",
        "--disable-version-check",
        // #1562 class fix: opengrep's own `.gitignore` respect covers the
        // common case (scratch trees are usually gitignored), but not a
        // scratch/cache tree that ISN'T (e.g. an un-gitignored worktree
        // cache) — `--exclude` is semgrep-compatible, so a slash-free
        // pattern matches that directory name anywhere in the tree,
        // independent of gitignore. Same `EXCLUDED_DIRS`-derived list
        // gitleaks/trivy use, so the three scanners can't drift apart.
        // Opengrep's git-mode walk already omits nested linked checkouts.
        // Do not turn each registration into a wcmatch pattern: hundreds of
        // patterns make the matcher quadratic and can hit its pattern limit.
        ...getScratchTreeDirNames().flatMap((pattern) => [
          "--exclude",
          pattern
        ]),
        cwd
      ], { cwd, timeout: SCAN_TIMEOUT_MS });
      if (result.error) {
        this.log(`Scan error: ${result.error.message}`);
        const reason = `${result.failure ?? "spawn-failed"}: ${result.error.message}`;
        this.recordRefusal(cwd, reason, result.status);
        return {
          ...EMPTY_RESULT,
          scannedAt,
          reason: "spawn-failed",
          summary: reason.slice(0, 200)
        };
      }
      if (!fs.existsSync(reportPath)) {
        const reason = (result.stderr ?? "").trim().split("\n")[0] || "no report produced";
        this.recordRefusal(cwd, reason, result.status);
        return {
          ...EMPTY_RESULT,
          scannedAt,
          reason: "no-report",
          summary: reason
        };
      }
      const raw = fs.readFileSync(reportPath, "utf-8");
      const report = readOpengrepReport(raw);
      if (report.verdict === "refused" || result.status !== 0) {
        const reason = report.verdict === "refused" ? report.reason : `opengrep exited with status ${result.status}`;
        this.recordRefusal(cwd, reason, result.status);
        return {
          ...EMPTY_RESULT,
          scannedAt,
          reason: "refused",
          summary: reason.slice(0, 200)
        };
      }
      if (report.partial) {
        recordDegradationOnce({
          kind: "opengrep-partial-scan",
          subject: cwd,
          reason: report.partial.reason,
          metadata: { status: result.status }
        });
      }
      return {
        success: true,
        // A warning-level partial report with no scanned paths proves that
        // the producer went cold. A complete empty report still proves a
        // genuine scan, so it is still "analysed" for the render layer's
        // analysed-and-found-nothing state (#2970) — but it carries no
        // FILE-level authority, which `analyzedFiles: []` below is what
        // says.
        analyzed: !report.partial || report.scanned.length > 0,
        // #2962: the set is ALWAYS carried, empty included. "This producer
        // declared its coverage and it was zero files" and "this producer
        // declares no coverage at all" are different facts; dropping the
        // empty array collapses them into the second, and the second is
        // what hands a zero-file scan whole-root retirement authority
        // downstream (`runnerRetirementDecision`, tools/lens-diagnostics.ts).
        analyzedFiles: report.scanned.map((file) => realpathOrResolve(path.resolve(cwd, file))),
        ...report.partial ? { partial: true } : {},
        ...report.partial ? { summary: report.partial.reason } : {},
        ...report.partial && report.scanned.length === 0 ? { reason: "partial-no-paths" } : {},
        findings: report.findings,
        scannedAt
      };
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      this.recordRefusal(cwd, reason, void 0);
      return {
        ...EMPTY_RESULT,
        scannedAt,
        reason: "crashed",
        summary: reason.slice(0, 200)
      };
    } finally {
      try {
        fs.rmSync(outDir, { recursive: true, force: true });
      } catch {
      }
    }
  }
  recordRefusal(cwd, reason, status) {
    recordDegradationOnce({
      kind: "opengrep-scan-refused",
      subject: cwd,
      reason,
      metadata: { status }
    });
  }
};
function readOpengrepReport(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { verdict: "refused", reason: "unparseable opengrep report" };
  }
  if (!parsed || typeof parsed !== "object")
    return { verdict: "refused", reason: "unparseable opengrep report" };
  const report = parsed;
  if (!Array.isArray(report.results) && !Array.isArray(report.errors))
    return { verdict: "refused", reason: "unparseable opengrep report" };
  const errors = (Array.isArray(report.errors) ? report.errors : []).map((error) => {
    if (typeof error === "string")
      return { message: error };
    if (!error || typeof error !== "object")
      return { message: "unrecognised opengrep error entry" };
    const entry = error;
    const level = typeof entry.level === "string" ? entry.level : void 0;
    const message = typeof entry.message === "string" ? entry.message : void 0;
    return {
      ...level ? { level } : {},
      message: message ?? level ?? "unrecognised opengrep error entry"
    };
  });
  const refusal = errors.find((error) => error.level !== "warn");
  if (refusal)
    return { verdict: "refused", reason: refusal.message };
  const scanned = Array.isArray(report.paths?.scanned) ? report.paths.scanned.filter((file) => typeof file === "string") : [];
  return {
    verdict: "usable",
    ...errors[0] ? { partial: { reason: errors[0].message } } : {},
    findings: parseOpengrepReport(parsed),
    scanned
  };
}
function parseOpengrepReport(rawOrParsed) {
  if (typeof rawOrParsed === "string" && !rawOrParsed.trim())
    return [];
  let parsed = rawOrParsed;
  if (typeof rawOrParsed === "string") {
    try {
      parsed = JSON.parse(rawOrParsed);
    } catch {
      return [];
    }
  }
  if (!parsed || typeof parsed !== "object")
    return [];
  const results = parsed.results;
  if (!Array.isArray(results))
    return [];
  const findings = [];
  for (const entry of results) {
    if (!entry || typeof entry !== "object")
      continue;
    const e = entry;
    const checkId = typeof e.check_id === "string" ? e.check_id : void 0;
    const filePath = typeof e.path === "string" ? e.path : void 0;
    const start = e.start;
    const end = e.end;
    const startLine = typeof start?.line === "number" ? start.line : void 0;
    if (!checkId || !filePath || !Number.isFinite(startLine))
      continue;
    const extra = e.extra ?? {};
    const metadata = extra.metadata ?? {};
    const cwe = Array.isArray(metadata.cwe) ? metadata.cwe.filter((c) => typeof c === "string") : void 0;
    findings.push({
      checkId,
      path: filePath,
      startLine,
      startCol: typeof start?.col === "number" ? start.col : 1,
      endLine: typeof end?.line === "number" ? end.line : startLine,
      endCol: typeof end?.col === "number" ? end.col : 1,
      message: typeof extra.message === "string" ? extra.message : "opengrep finding",
      severity: typeof extra.severity === "string" ? extra.severity : "WARNING",
      cwe
    });
  }
  return findings;
}
export {
  OpengrepClient,
  parseOpengrepReport
};
