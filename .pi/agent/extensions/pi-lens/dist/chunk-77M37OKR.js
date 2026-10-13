import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  scannerReportParentDir
} from "./chunk-CSHFH5IN.js";
import {
  getScratchTreeGlobPatterns,
  nestedWorktreeOffsets
} from "./chunk-VCHXCQFG.js";
import {
  SecurityScanClient
} from "./chunk-3EFKIGZN.js";
import {
  safeSpawnAsync
} from "./chunk-C34ZXZ7O.js";
import {
  loadPiLensProjectConfig
} from "./chunk-2BBLFX75.js";
import {
  incrementDegradationCount
} from "./chunk-JAU72XNY.js";
import {
  toPosix
} from "./chunk-N2H3ZPZY.js";

// dist/clients/trivy-client.js
import * as fs from "node:fs";
import * as path from "node:path";
import { mkdtempSync } from "node:fs";
var EMPTY_RESULT = {
  success: false,
  findings: [],
  secrets: [],
  licenses: []
};
var SCAN_TIMEOUT_MS = 18e4;
var DEPENDENCY_MANIFESTS = [
  // JS / TS
  "package.json",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "bun.lockb",
  // Python
  "pyproject.toml",
  "requirements.txt",
  "poetry.lock",
  "Pipfile.lock",
  // Java / JVM
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "gradle.lockfile",
  // Go
  "go.mod",
  "go.sum",
  // Rust
  "Cargo.toml",
  "Cargo.lock",
  // .NET
  "packages.lock.json",
  // PHP
  "composer.json",
  "composer.lock",
  // Ruby
  "Gemfile",
  "Gemfile.lock"
];
function hasAnyDependencyManifest(cwd) {
  for (const manifest of DEPENDENCY_MANIFESTS) {
    try {
      if (fs.existsSync(path.join(cwd, manifest)))
        return true;
    } catch {
    }
  }
  return false;
}
function isTrivyEnabled(cwd) {
  try {
    const config = loadPiLensProjectConfig(cwd);
    const trivy = config.raw?.trivy;
    return trivy?.enabled === true;
  } catch {
    return false;
  }
}
function shouldScanTrivy(cwd) {
  return isTrivyEnabled(cwd) && hasAnyDependencyManifest(cwd);
}
var SEVERITY_RANK = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3
};
function resolveSeverityFloor(cwd) {
  let raw;
  try {
    const config = loadPiLensProjectConfig(cwd);
    raw = config.raw?.trivy?.minSeverity;
  } catch {
    raw = void 0;
  }
  const requested = typeof raw === "string" ? SEVERITY_RANK[raw.toUpperCase()] : void 0;
  const floor = Math.min(requested ?? SEVERITY_RANK.HIGH, SEVERITY_RANK.HIGH);
  return ["LOW", "MEDIUM", "HIGH", "CRITICAL"].filter((s) => SEVERITY_RANK[s] >= floor);
}
function worktreeSkipDirs(cwd, separator = path.sep, maxArgumentChars = separator === "\\" ? 3e4 : Number.POSITIVE_INFINITY) {
  const unsafe = separator === "\\" ? /[,"*?[\]{}]/ : /[,"*?[\]{}\\]/;
  const skips = [];
  let argumentChars = 0;
  for (const offset of nestedWorktreeOffsets(cwd)) {
    if (unsafe.test(offset)) {
      incrementDegradationCount({
        kind: "scan-worktree-exclusion-skipped",
        subject: "trivy",
        reason: `csv-or-glob-char-in-path: ${offset} not skipped under ${cwd}`
      });
      continue;
    }
    const value = toPosix(offset);
    const addedChars = "--skip-dirs".length + value.length + 2;
    if (argumentChars + addedChars > maxArgumentChars) {
      incrementDegradationCount({
        kind: "scan-worktree-exclusion-skipped",
        subject: "trivy",
        reason: `windows-command-line-cap: ${offset} not skipped under ${cwd}`
      });
      continue;
    }
    skips.push(value);
    argumentChars += addedChars;
  }
  return skips;
}
var TrivyClient = class extends SecurityScanClient {
  constructor(verbose = false) {
    super("trivy", verbose);
  }
  /** Static gates so callers can skip before constructing. */
  static hasAnyDependencyManifest(cwd) {
    return hasAnyDependencyManifest(cwd);
  }
  /** Full opt-in gate (config opt-in AND a dependency manifest). */
  static shouldScan(cwd) {
    return shouldScanTrivy(cwd);
  }
  /**
   * Auto-install via the GitHub-release path (registered in
   * `clients/installer/index.ts`) when trivy isn't already on PATH.
   */
  doEnsureAvailable() {
    return this.ensureViaInstaller(["--version"]);
  }
  /**
   * Scan a directory tree for dependency CVEs.
   *
   * Skips early when the opt-in gate isn't satisfied. When trivy is
   * unavailable, returns an empty (but successful) result rather than failing
   * the session_start task. Re-entrancy safe: concurrent calls against the
   * same root share a single process.
   */
  async scan(cwd) {
    const targetDir = path.resolve(cwd);
    const scannedAt = (/* @__PURE__ */ new Date()).toISOString();
    if (!shouldScanTrivy(targetDir)) {
      return {
        ...EMPTY_RESULT,
        success: true,
        scannedAt,
        summary: hasAnyDependencyManifest(targetDir) ? "trivy not enabled (set trivy.enabled in .pi-lens.json)" : "no dependency manifest at analysis root"
      };
    }
    if (!await this.ensureAvailable()) {
      return { ...EMPTY_RESULT, scannedAt, summary: "trivy not installed" };
    }
    return this.dedupeScan(targetDir, () => this.runScan(targetDir));
  }
  async runScan(cwd) {
    const scannedAt = (/* @__PURE__ */ new Date()).toISOString();
    const bin = this.binaryPath ?? "trivy";
    const severities = resolveSeverityFloor(cwd);
    const outDir = mkdtempSync(path.join(scannerReportParentDir(), "pi-lens-trivy-"));
    const reportPath = path.join(outDir, "trivy-report.json");
    try {
      const result = await safeSpawnAsync(bin, [
        "fs",
        "--scanners",
        "vuln,secret,license",
        "--severity",
        severities.join(","),
        "--format",
        "json",
        "--output",
        reportPath,
        "--quiet",
        "--no-progress",
        ...[
          ...getScratchTreeGlobPatterns(),
          ...worktreeSkipDirs(cwd)
        ].flatMap((glob) => ["--skip-dirs", glob]),
        cwd
      ], { cwd, timeout: SCAN_TIMEOUT_MS });
      if (result.error) {
        this.log(`Scan error: ${result.error.message}`);
        return {
          ...EMPTY_RESULT,
          scannedAt,
          summary: result.error.message.slice(0, 200)
        };
      }
      if (!fs.existsSync(reportPath)) {
        return {
          ...EMPTY_RESULT,
          success: true,
          scannedAt,
          summary: (result.stderr ?? "").trim().split("\n")[0] || "no report produced"
        };
      }
      const raw = fs.readFileSync(reportPath, "utf-8");
      const findings = parseTrivyReport(raw);
      const secrets = parseTrivySecrets(raw);
      const licenses = parseTrivyLicenses(raw);
      return {
        success: true,
        analyzed: true,
        findings,
        secrets,
        licenses,
        scannedAt
      };
    } catch (err) {
      return {
        ...EMPTY_RESULT,
        scannedAt,
        summary: err instanceof Error ? err.message.slice(0, 200) : String(err)
      };
    } finally {
      try {
        fs.rmSync(outDir, { recursive: true, force: true });
      } catch {
      }
    }
  }
};
function normalizeSeverity(raw) {
  const s = typeof raw === "string" ? raw.toUpperCase() : "";
  if (s === "CRITICAL" || s === "HIGH" || s === "MEDIUM" || s === "LOW") {
    return s;
  }
  return "UNKNOWN";
}
function parseTrivyReport(raw) {
  if (!raw.trim())
    return [];
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  const results = parsed?.Results;
  if (!Array.isArray(results))
    return [];
  const findings = [];
  for (const resultEntry of results) {
    if (!resultEntry || typeof resultEntry !== "object")
      continue;
    const r = resultEntry;
    const target = typeof r.Target === "string" ? r.Target : void 0;
    const vulns = r.Vulnerabilities;
    if (!Array.isArray(vulns))
      continue;
    for (const vulnEntry of vulns) {
      if (!vulnEntry || typeof vulnEntry !== "object")
        continue;
      const v = vulnEntry;
      const vulnerabilityId = typeof v.VulnerabilityID === "string" ? v.VulnerabilityID : void 0;
      const pkgName = typeof v.PkgName === "string" ? v.PkgName : void 0;
      if (!vulnerabilityId || !pkgName)
        continue;
      findings.push({
        vulnerabilityId,
        pkgName,
        installedVersion: typeof v.InstalledVersion === "string" ? v.InstalledVersion : void 0,
        fixedVersion: typeof v.FixedVersion === "string" && v.FixedVersion.trim() ? v.FixedVersion : void 0,
        severity: normalizeSeverity(v.Severity),
        title: typeof v.Title === "string" ? v.Title : void 0,
        primaryUrl: typeof v.PrimaryURL === "string" ? v.PrimaryURL : void 0,
        target
      });
    }
  }
  return findings;
}
function parseTrivySecrets(raw) {
  if (!raw.trim())
    return [];
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  const results = parsed?.Results;
  if (!Array.isArray(results))
    return [];
  const secrets = [];
  for (const resultEntry of results) {
    if (!resultEntry || typeof resultEntry !== "object")
      continue;
    const r = resultEntry;
    const target = typeof r.Target === "string" ? r.Target : void 0;
    const rows = r.Secrets;
    if (!target || !Array.isArray(rows))
      continue;
    for (const row of rows) {
      if (!row || typeof row !== "object")
        continue;
      const s = row;
      const ruleId = typeof s.RuleID === "string" ? s.RuleID : void 0;
      const line = typeof s.StartLine === "number" ? s.StartLine : void 0;
      if (!ruleId || line == null)
        continue;
      secrets.push({
        ruleId,
        file: target,
        line,
        title: typeof s.Title === "string" ? s.Title : void 0
      });
    }
  }
  return secrets;
}
function parseTrivyLicenses(raw) {
  if (!raw.trim())
    return [];
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  const results = parsed?.Results;
  if (!Array.isArray(results))
    return [];
  const licenses = [];
  for (const resultEntry of results) {
    if (!resultEntry || typeof resultEntry !== "object")
      continue;
    const r = resultEntry;
    const target = typeof r.Target === "string" ? r.Target : void 0;
    const rows = r.Licenses;
    if (!Array.isArray(rows))
      continue;
    for (const row of rows) {
      if (!row || typeof row !== "object")
        continue;
      const l = row;
      const license = typeof l.Name === "string" ? l.Name : void 0;
      if (!license)
        continue;
      const filePath = typeof l.FilePath === "string" && l.FilePath ? l.FilePath : target;
      const pkgName = typeof l.PkgName === "string" && l.PkgName ? l.PkgName : filePath ?? "unknown";
      licenses.push({
        license,
        pkgName,
        severity: normalizeSeverity(l.Severity),
        category: typeof l.Category === "string" ? l.Category : void 0,
        filePath
      });
    }
  }
  return licenses;
}

export {
  hasAnyDependencyManifest,
  isTrivyEnabled,
  shouldScanTrivy,
  resolveSeverityFloor,
  worktreeSkipDirs,
  TrivyClient,
  parseTrivyReport,
  parseTrivySecrets,
  parseTrivyLicenses
};
