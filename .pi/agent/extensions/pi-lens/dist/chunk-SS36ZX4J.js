import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  scannerReportParentDir
} from "./chunk-CSHFH5IN.js";
import {
  getSecretsLaneAllowlistPaths,
  isUnderSecretsLaneScratchTree,
  nestedWorktreeOffsets
} from "./chunk-VCHXCQFG.js";
import {
  SecurityScanClient
} from "./chunk-3EFKIGZN.js";
import {
  collectTrackedFiles,
  collectUntrackedIgnoredIds,
  safeSpawnAsync
} from "./chunk-C34ZXZ7O.js";
import {
  escapeRegExp
} from "./chunk-JAU72XNY.js";
import {
  normalizeEphemeralMapKey,
  normalizeMapKey
} from "./chunk-N2H3ZPZY.js";

// dist/clients/gitleaks-client.js
import * as fs from "node:fs";
import * as path from "node:path";
import { mkdtempSync } from "node:fs";
var EMPTY_RESULT = {
  success: false,
  findings: []
};
var SCAN_TIMEOUT_MS = 12e4;
var LOCAL_GITLEAKS_CONFIG_NAMES = [
  ".gitleaks.toml",
  ".gitleaks.yaml",
  ".gitleaks.yml"
];
function findLocalGitleaksConfig(cwd) {
  for (const name of LOCAL_GITLEAKS_CONFIG_NAMES) {
    const candidate = path.join(cwd, name);
    try {
      if (fs.existsSync(candidate))
        return candidate;
    } catch {
    }
  }
  return void 0;
}
var PLACEHOLDER_SECRET_REGEXES = [
  String.raw`(?i)^(your|my|insert|replace|enter|add)[-_ ]?(the[-_ ]?)?(api[-_ ]?)?(key|token|secret|password|credential)s?$`,
  String.raw`(?i)^<[^<>]*(api[-_ ]?key|token|secret|password|credential|key)[^<>]*>$`,
  String.raw`(?i)^x{3,}$`,
  String.raw`(?i)^(changeme|change[-_]me|example|placeholder|dummy|fake|redacted|xxxxxxxx)$`
];
function worktreeAllowlistPath(worktree) {
  const segments = worktree.split(/[/\\]/).map(escapeRegExp);
  return `^${segments.join("[/\\\\]")}(?:[/\\\\].*)?$`;
}
function writeScopedGitleaksConfig(outDir, cwd) {
  const localConfig = findLocalGitleaksConfig(cwd);
  const extendLine = localConfig ? `path = ${JSON.stringify(localConfig)}` : "useDefault = true";
  const pathPatterns = [
    ...getSecretsLaneAllowlistPaths(),
    ...nestedWorktreeOffsets(cwd).map((offset) => worktreeAllowlistPath(path.join(cwd, offset)))
  ].map((p) => `    ${JSON.stringify(p)},`).join("\n");
  const regexPatterns = PLACEHOLDER_SECRET_REGEXES.map((r) => `    ${JSON.stringify(r)},`).join("\n");
  const toml = `[extend]
${extendLine}

[allowlist]
paths = [
${pathPatterns}
]
regexes = [
${regexPatterns}
]
`;
  const configPath = path.join(outDir, "gitleaks-scoped-config.toml");
  fs.writeFileSync(configPath, toml, "utf-8");
  return configPath;
}
function hasGitleaksSignal(cwd) {
  const candidates = [...LOCAL_GITLEAKS_CONFIG_NAMES, ".gitleaksignore"];
  for (const candidate of candidates) {
    try {
      if (fs.existsSync(path.join(cwd, candidate)))
        return true;
    } catch {
    }
  }
  const pkgJsonPath = path.join(cwd, "package.json");
  try {
    if (fs.existsSync(pkgJsonPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      for (const name of Object.keys(deps)) {
        if (name.toLowerCase().includes("gitleaks"))
          return true;
      }
    }
  } catch {
  }
  const hookCandidates = [
    path.join(cwd, ".husky", "pre-commit"),
    path.join(cwd, ".husky", "_", "pre-commit"),
    path.join(cwd, ".git", "hooks", "pre-commit")
  ];
  for (const hook of hookCandidates) {
    try {
      if (!fs.existsSync(hook))
        continue;
      const content = fs.readFileSync(hook, "utf-8");
      if (content.includes("gitleaks"))
        return true;
    } catch {
    }
  }
  return false;
}
function hasGitRepo(cwd) {
  try {
    return fs.existsSync(path.join(cwd, ".git"));
  } catch {
    return false;
  }
}
var GitleaksClient = class _GitleaksClient extends SecurityScanClient {
  constructor(verbose = false) {
    super("gitleaks", verbose);
  }
  /**
   * Static detection helper so callers can gate before constructing
   * (matches `GovulncheckClient.hasGoModule` shape).
   */
  static hasGitleaksSignal(cwd) {
    return hasGitleaksSignal(cwd);
  }
  /** Smart-default tier (#130) — see {@link hasGitRepo}'s doc comment. */
  static hasGitRepo(cwd) {
    return hasGitRepo(cwd);
  }
  /**
   * Auto-install via the GitHub-release path (registered in
   * `clients/installer/index.ts`) when gitleaks isn't already on PATH.
   * gitleaks uses `version` (no leading dashes) as its CLI verb.
   */
  doEnsureAvailable() {
    return this.ensureViaInstaller(["version"]);
  }
  /**
   * Scan a directory tree for secrets.
   *
   * Skips early when the directory shows no gitleaks opt-in signal — unless
   * `requireSignal: false` (the `mode=full` fresh-fetch path uses this to
   * apply the looser #130 "smart-default" gate, {@link hasGitRepo}, instead;
   * session_start and per-edit dispatch never pass this, so their behavior
   * is unchanged). When gitleaks is unavailable, returns an empty result
   * with an explanatory summary rather than failing the session_start task.
   *
   * Re-entrancy safe: concurrent calls against the same root share a
   * single gitleaks process (mirrors `KnipClient` / `JscpdClient` /
   * `GovulncheckClient`).
   */
  async scan(cwd, options) {
    const targetDir = path.resolve(cwd);
    const scannedAt = (/* @__PURE__ */ new Date()).toISOString();
    const requireSignal = options?.requireSignal ?? true;
    if (requireSignal && !_GitleaksClient.hasGitleaksSignal(targetDir)) {
      return {
        ...EMPTY_RESULT,
        success: true,
        scannedAt,
        summary: "no gitleaks opt-in signal at project root"
      };
    }
    if (!await this.ensureAvailable()) {
      return {
        ...EMPTY_RESULT,
        scannedAt,
        summary: "gitleaks not installed"
      };
    }
    return this.dedupeScan(targetDir, () => this.runScan(targetDir));
  }
  async runScan(cwd) {
    const scannedAt = (/* @__PURE__ */ new Date()).toISOString();
    const bin = this.binaryPath ?? "gitleaks";
    const outDir = mkdtempSync(path.join(scannerReportParentDir(), "pi-lens-gitleaks-"));
    const reportPath = path.join(outDir, "gitleaks-report.json");
    try {
      const configPath = writeScopedGitleaksConfig(outDir, cwd);
      const result = await safeSpawnAsync(bin, [
        "detect",
        "--no-git",
        "--source",
        cwd,
        "--config",
        configPath,
        "--report-format",
        "json",
        "--report-path",
        reportPath,
        "--exit-code",
        "0",
        "--no-banner"
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
      const rawFindings = parseGitleaksReport(fs.readFileSync(reportPath, "utf-8"));
      const findings = await classifyAndFilterFindings(rawFindings, cwd);
      return {
        success: true,
        analyzed: true,
        findings,
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
function isInsideNestedGitRepository(file, cwd) {
  const root = path.resolve(cwd);
  const absoluteFile = path.isAbsolute(file) ? path.resolve(file) : path.resolve(root, file);
  const relative2 = path.relative(root, absoluteFile);
  if (relative2 === ".." || relative2.startsWith(`..${path.sep}`) || path.isAbsolute(relative2))
    return false;
  let directory = path.dirname(absoluteFile);
  while (directory !== root) {
    try {
      if (fs.existsSync(path.join(directory, ".git")))
        return true;
    } catch {
      return false;
    }
    const parent = path.dirname(directory);
    if (parent === directory)
      return false;
    directory = parent;
  }
  return false;
}
async function classifyAndFilterFindings(findings, cwd) {
  if (findings.length === 0)
    return findings;
  const [trackedIds, untrackedIgnoredIds] = await Promise.all([
    collectTrackedFiles(cwd),
    collectUntrackedIgnoredIds(cwd)
  ]);
  const classified = [];
  for (const finding of findings) {
    if (isUnderSecretsLaneScratchTree(finding.file)) {
      classified.push({ ...finding, pathStatus: "scratch" });
      continue;
    }
    const absPath = path.isAbsolute(finding.file) ? finding.file : path.resolve(cwd, finding.file);
    if (isInsideNestedGitRepository(absPath, cwd)) {
      classified.push({ ...finding, pathStatus: "nested-repository" });
      continue;
    }
    let pathStatus;
    if (trackedIds?.has(normalizeEphemeralMapKey(absPath))) {
      pathStatus = "tracked";
    } else if (untrackedIgnoredIds?.has(normalizeMapKey(absPath))) {
      pathStatus = "ignored";
    } else if (trackedIds !== void 0 || untrackedIgnoredIds !== void 0) {
      pathStatus = "untracked";
    }
    classified.push(pathStatus ? { ...finding, pathStatus } : finding);
  }
  return classified;
}
function parseGitleaksReport(raw) {
  if (!raw.trim())
    return [];
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed))
    return [];
  const findings = [];
  for (const entry of parsed) {
    if (!entry || typeof entry !== "object")
      continue;
    const e = entry;
    const ruleId = typeof e.RuleID === "string" ? e.RuleID : void 0;
    const file = typeof e.File === "string" ? e.File : void 0;
    const startLine = typeof e.StartLine === "number" ? e.StartLine : Number.parseInt(String(e.StartLine ?? ""), 10);
    if (!ruleId || !file || !Number.isFinite(startLine))
      continue;
    findings.push({
      ruleId,
      description: typeof e.Description === "string" ? e.Description : void 0,
      file,
      startLine,
      endLine: typeof e.EndLine === "number" ? e.EndLine : Number.isFinite(Number(e.EndLine)) ? Number(e.EndLine) : void 0,
      match: typeof e.Match === "string" ? e.Match : void 0,
      secret: typeof e.Secret === "string" ? e.Secret : void 0,
      tags: Array.isArray(e.Tags) ? e.Tags.filter((t) => typeof t === "string") : void 0,
      commit: typeof e.Commit === "string" ? e.Commit : void 0,
      author: typeof e.Author === "string" ? e.Author : void 0,
      date: typeof e.Date === "string" ? e.Date : void 0
    });
  }
  return findings;
}

export {
  PLACEHOLDER_SECRET_REGEXES,
  writeScopedGitleaksConfig,
  hasGitleaksSignal,
  hasGitRepo,
  GitleaksClient,
  classifyAndFilterFindings,
  parseGitleaksReport
};
