import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  HardFailureStamps
} from "./chunk-7U2IDNXN.js";
import {
  formatToolFailure
} from "./chunk-2CD5RS6M.js";
import {
  firstOutputLine,
  spawnFailedWithNoOutput
} from "./chunk-UZ3TUTRV.js";
import {
  getScratchTreeFnmatchPatterns
} from "./chunk-VCHXCQFG.js";
import {
  listNestedLinkedWorktreeRoots
} from "./chunk-PNQDPDRC.js";
import {
  extractTomlTableSection,
  parseTomlStringArray
} from "./chunk-P7266HLM.js";
import {
  VENV_BIN_DIRS,
  findLocalBinsAt
} from "./chunk-AW7R2GWG.js";
import {
  probeToolAsync
} from "./chunk-RWWYJ623.js";
import {
  classifyProbeFailure,
  createAvailabilityLatch,
  logAvailabilityDecision,
  startHostStallSampler
} from "./chunk-VRZP76YM.js";
import {
  safeSpawnAsync
} from "./chunk-C34ZXZ7O.js";
import {
  incrementDegradationCount
} from "./chunk-JAU72XNY.js";
import {
  createSubsystemLogger
} from "./chunk-XTMJ7XDT.js";
import {
  findNearestMarkerRoot
} from "./chunk-N2H3ZPZY.js";

// dist/clients/dead-code-client.js
import * as fs from "node:fs";
import * as path from "node:path";
import { resolve as resolve2 } from "node:path";
function emptyResult(language) {
  return {
    success: false,
    language,
    unusedExports: [],
    unusedFiles: [],
    unusedDeps: [],
    unlistedDeps: []
  };
}
var ANALYSIS_TIMEOUT_MS = 3e4;
var VULTURE_PYTHON_ONLY_EXCLUDES = ["*/site-packages/*", "*/.eggs/*"];
var VULTURE_EXCLUDES = [
  ...getScratchTreeFnmatchPatterns(),
  ...VULTURE_PYTHON_ONLY_EXCLUDES
];
var VULTURE_IGNORE_DECORATORS = [
  "@pytest.fixture",
  "@pytest.fixture(*",
  "@fixture",
  "@fixture(*",
  "@app.*",
  "@router.*",
  "@celery.task*",
  "@task",
  "@shared_task*"
];
var VULTURE_LINE = /^(.*?):(\d+): unused (\w[\w ]*?) '([^']+)' \((\d+)% confidence\)\s*$/;
function parseVultureOutput(output, root) {
  const issues = [];
  for (const raw of output.split(/\r?\n/)) {
    const m = raw.match(VULTURE_LINE);
    if (!m)
      continue;
    const [, file, line, kind, name, confidence] = m;
    let rel = file;
    try {
      rel = path.relative(root, file) || file;
    } catch {
      rel = file;
    }
    issues.push({
      category: "export",
      kind: kind.trim(),
      name,
      file: rel,
      line: Number.parseInt(line, 10),
      confidence: Number.parseInt(confidence, 10)
    });
  }
  return issues;
}
function escapeFnmatchLiteral(text) {
  return text.replace(/[*?[]/g, (ch) => `[${ch}]`);
}
var PythonDeadCodeClient = class {
  id = "python";
  language = "Python";
  /**
   * Transient-aware memo (#1467): only a durable "vulture is not installed"
   * verdict is remembered for the session. A probe that timed out expires and
   * is re-probed, so vulture cannot be disabled for the process by one stall.
   */
  availabilityLatch = createAvailabilityLatch();
  resolved = null;
  ensureInFlight = null;
  inFlight = /* @__PURE__ */ new Map();
  /**
   * Per project root, the last run that died to a timeout or kill (#4117).
   * Set where the scan SETTLES, so a scan turn_end abandoned at its budget and
   * that later timed out still leaves the failure the next turn must see: the
   * turn's own cache row only exists for a scan that settled inside it, and a
   * failure never replaces a good baseline row.
   */
  hardFailures = new HardFailureStamps();
  log;
  constructor(verbose = false) {
    this.log = verbose ? createSubsystemLogger("dead-code:python") : () => {
    };
  }
  recentHardFailure(cwd) {
    const root = this.resolveProjectRoot(cwd || process.cwd());
    if (!root)
      return null;
    return this.hardFailures.recent(resolve2(root));
  }
  get minConfidence() {
    const raw = Number.parseInt(process.env.PI_LENS_VULTURE_MIN_CONFIDENCE ?? "60", 10);
    return Number.isFinite(raw) ? Math.min(100, Math.max(0, raw)) : 60;
  }
  detect(cwd) {
    return this.resolveProjectRoot(cwd) !== null;
  }
  owns(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return ext === ".py" || ext === ".pyi";
  }
  /**
   * Nearest dir with a Python project marker, never at/above $HOME and never
   * escaping a VCS boundary — same containment rules as KnipClient so a scan
   * launched from a bare cwd can't recurse the whole home tree (#250/#296).
   * Delegates to the shared path-utils helper (refs #625) rather than
   * hand-rolling the climb; only the marker list differs from KnipClient's.
   */
  resolveProjectRoot(startDir, homeDirOverride) {
    return findNearestMarkerRoot(startDir, [
      "pyproject.toml",
      "setup.py",
      "setup.cfg",
      "requirements.txt",
      "Pipfile",
      "tox.ini"
    ], { boundaries: [".git", ".hg", ".svn"], homeDir: homeDirOverride });
  }
  async ensureAvailable(root) {
    const memo = this.availabilityLatch.read();
    if (memo !== null)
      return memo;
    if (this.ensureInFlight)
      return this.ensureInFlight;
    this.ensureInFlight = this.doEnsureAvailable(root);
    try {
      return await this.ensureInFlight;
    } finally {
      this.ensureInFlight = null;
    }
  }
  /**
   * `<root>/.venv/bin/vulture` (and `venv`/Windows `Scripts` equivalents),
   * checked by existence only — no spawn. A project's own venv is the vulture
   * that project's own config and dependency set were written against; the
   * bare `vulture`/`python -m vulture` PATH probes below only ever see
   * whatever happens to be active in the CALLING shell, not the project's
   * (#1731, discipline B — the same venv-first shape sqlfluff's binary
   * resolution already uses, `runner-helpers.ts` `createVenvFinder`).
   *
   * The directory list is the shared `VENV_BIN_DIRS` — this was a third
   * private spelling of the same four venv directories, with a
   * `process.platform` branch that meant the ubuntu lane never saw the
   * `Scripts` half at all (defect shape 30).
   *
   * The search is a fixed lookup at `root` ONLY (`findLocalBinsAt`, no
   * ancestor walk) — #2544 review round 3 folded this onto the shared
   * ancestor walker, reasoning a monorepo package should find its
   * repo-root venv, but that was an unrequested behaviour change with no
   * #2514 defect behind it. Reverted in round 4 F2. `findLocalBinsAt`
   * returns EVERY match at `root` rather than the first, because
   * `doEnsureAvailable` probes candidates in order and must keep the
   * `venv/` fallback when a `.venv/` vulture exists but cannot run.
   */
  venvCandidates(root) {
    return findLocalBinsAt(["vulture"], root, {
      windowsExt: ".exe",
      binDirs: VENV_BIN_DIRS
    }).flatMap((full) => typeof full === "string" ? [{ cmd: full, prefix: [] }] : []);
  }
  async doEnsureAvailable(root) {
    const candidates = [
      ...root ? this.venvCandidates(root) : [],
      { cmd: "vulture", prefix: [] },
      { cmd: "python", prefix: ["-m", "vulture"] },
      { cmd: "python3", prefix: ["-m", "vulture"] }
    ];
    let sawTransient = false;
    let transientCause = "probe-timeout";
    const sweepStartedAt = Date.now();
    let sweepHostStallMs = 0;
    let sweepEvidence;
    for (const c of candidates) {
      const sampler = startHostStallSampler();
      const startedAt = Date.now();
      let probe;
      let hostStallMs;
      try {
        probe = await probeToolAsync(c.cmd, [...c.prefix, "--version"], {
          timeout: 5e3
        });
      } finally {
        hostStallMs = sampler.stop();
        sweepHostStallMs += hostStallMs;
      }
      if (!probe.error && probe.status === 0) {
        this.resolved = c;
        this.availabilityLatch.noteAvailable();
        this.log(`vulture found: ${[c.cmd, ...c.prefix].join(" ")}`);
        logAvailabilityDecision({
          tool: "vulture",
          verdict: "available",
          outcome: "success",
          cause: "ok",
          elapsedMs: Date.now() - startedAt,
          latched: true,
          hostStallMs,
          budgetMs: 5e3,
          classifiedBy: "probe"
        });
        return true;
      }
      const classified = classifyProbeFailure(probe, {
        hostStallMs,
        command: c.cmd
      });
      sweepEvidence = classified.evidence;
      if (classified.outcome === "transient") {
        sawTransient = true;
        transientCause = classified.cause;
      }
    }
    if (sawTransient) {
      const retryAfterMs = this.availabilityLatch.noteUnavailable("transient", transientCause);
      this.log("vulture probe timed out; will retry (not treated as missing)");
      logAvailabilityDecision({
        tool: "vulture",
        verdict: "unavailable",
        outcome: "transient",
        cause: transientCause,
        elapsedMs: Date.now() - sweepStartedAt,
        hostStallMs: sweepHostStallMs,
        latched: false,
        retryAfterMs,
        budgetMs: 5e3,
        classifiedBy: "probe",
        ...sweepEvidence !== void 0 && { evidence: sweepEvidence }
      });
      return false;
    }
    this.availabilityLatch.noteUnavailable("missing", "not-found");
    this.log("vulture not installed; skipping (no auto-install)");
    logAvailabilityDecision({
      tool: "vulture",
      verdict: "unavailable",
      outcome: "missing",
      cause: "not-found",
      elapsedMs: Date.now() - sweepStartedAt,
      hostStallMs: sweepHostStallMs,
      latched: true,
      budgetMs: 5e3,
      // Every candidate probe was classified, and none was transient (#1500).
      classifiedBy: "probe",
      ...sweepEvidence !== void 0 && { evidence: sweepEvidence }
    });
    return false;
  }
  async analyze(cwd) {
    const root = this.resolveProjectRoot(cwd || process.cwd());
    if (!root) {
      return {
        ...emptyResult(this.language),
        success: true,
        summary: "No Python project root found; vulture skipped"
      };
    }
    if (!await this.ensureAvailable(root)) {
      return {
        ...emptyResult(this.language),
        success: true,
        summary: "vulture not installed; skipped. Install vulture (pip/uv/pipx) to enable Python dead-code detection."
      };
    }
    const key = path.resolve(root);
    const existing = this.inFlight.get(key);
    if (existing)
      return existing;
    const promise = this.runAnalyze(key).then((result) => {
      this.hardFailures.settle(key, result);
      return result;
    });
    const wrapped = promise.finally(() => {
      if (this.inFlight.get(key) === wrapped)
        this.inFlight.delete(key);
    });
    this.inFlight.set(key, wrapped);
    return wrapped;
  }
  /**
   * The project's own `[tool.vulture]` table, or `null` when
   * `<root>/pyproject.toml` carries none. vulture's own config discovery reads
   * that table, but CLI flags override it -- passing `--min-confidence` or
   * `--exclude` unconditionally silently overrode a project's own thresholds
   * and ignore list (#1731, discipline A). The table is read with the shared
   * TOML table/array readers (`cargo-manifest.ts`) so the one list vulture's
   * `--exclude` would replace can be merged instead (#4117).
   */
  readProjectVultureConfig(root) {
    let content;
    try {
      content = fs.readFileSync(path.join(root, "pyproject.toml"), "utf-8");
    } catch {
      return null;
    }
    if (!content.includes("[tool.vulture]"))
      return null;
    const table = extractTomlTableSection(content, "tool.vulture") ?? "";
    const exclude = parseTomlStringArray(table, "exclude");
    const keyed = /^[ \t]*exclude[ \t]*=/m.test(table);
    const emptyList = /^[ \t]*exclude[ \t]*=[ \t]*\[\s*\]/m.test(table);
    const unreadable = keyed && exclude.length === 0 && !emptyList || exclude.some((entry) => entry.includes(","));
    return { exclude: unreadable ? null : exclude };
  }
  /**
   * `--exclude` patterns for the linked worktrees under `root` (#4117), and how
   * many of them could not be spelled. vulture matches each pattern against the
   * module's RESOLVED path (`Path.resolve()` in `get_modules`), and a pattern
   * without a glob character is wrapped as `*pattern*`, so a bare name would
   * also drop `pkg/<name>-utils/`: the pattern is the absolute real path plus
   * `/*`, with glob characters in the path made literal. A comma cannot be
   * escaped (the list is comma-split), so that worktree is counted, not passed.
   */
  worktreeExcludes(root) {
    const nested = listNestedLinkedWorktreeRoots(root);
    const patterns = [];
    for (const worktree of nested) {
      if (worktree.includes(",")) {
        incrementDegradationCount({
          kind: "scan-worktree-exclusion-skipped",
          subject: "vulture",
          reason: `comma-in-path: ${worktree} not excluded under ${root}`
        });
        continue;
      }
      patterns.push(`${escapeFnmatchLiteral(worktree)}/*`);
    }
    return { patterns };
  }
  async runAnalyze(root) {
    const scannedAt = (/* @__PURE__ */ new Date()).toISOString();
    const startMs = Date.now();
    const invocation = this.resolved ?? { cmd: "vulture", prefix: [] };
    const config = this.readProjectVultureConfig(root);
    const worktrees = this.worktreeExcludes(root);
    let exclude;
    if (config === null) {
      exclude = [...VULTURE_EXCLUDES, ...worktrees.patterns];
    } else if (worktrees.patterns.length > 0) {
      if (config.exclude === null) {
        incrementDegradationCount({
          kind: "scan-worktree-exclusion-skipped",
          subject: "vulture",
          reason: `config-exclude-unreadable: ${worktrees.patterns.length} linked worktree(s) under ${root} not excluded`
        });
      } else {
        exclude = [...config.exclude, ...worktrees.patterns];
      }
    }
    const excludedWorktrees = exclude === void 0 ? 0 : worktrees.patterns.length;
    const args = [
      ...invocation.prefix,
      ".",
      ...config === null ? [`--min-confidence=${this.minConfidence}`] : [],
      ...exclude === void 0 ? [] : [`--exclude=${exclude.join(",")}`],
      `--ignore-decorators=${VULTURE_IGNORE_DECORATORS.join(",")}`
    ];
    const result = await safeSpawnAsync(invocation.cmd, args, {
      timeout: ANALYSIS_TIMEOUT_MS,
      cwd: root
    });
    const durationMs = Date.now() - startMs;
    if (result.error) {
      this.log(`scan error: ${result.error.message}`);
      return {
        ...emptyResult(this.language),
        summary: `Error: ${result.error.message}`,
        durationMs
      };
    }
    const output = result.stdout || "";
    if (!output.trim()) {
      const stderr = (result.stderr || "").trim();
      if (spawnFailedWithNoOutput(result, output)) {
        const reason = formatToolFailure({
          tool: "vulture",
          status: result.status,
          signal: result.signal,
          stderr: result.stderr
        });
        this.log(reason);
        incrementDegradationCount({
          kind: "runner-empty-result",
          subject: "vulture",
          reason
        });
        return {
          ...emptyResult(this.language),
          summary: stderr ? `vulture error: ${firstOutputLine(stderr)}` : reason,
          durationMs
        };
      }
      return {
        ...emptyResult(this.language),
        success: true,
        analyzed: true,
        summary: "No dead code found",
        durationMs,
        scannedAt,
        excludedWorktrees
      };
    }
    return {
      ...this.parseOutput(output, root),
      durationMs,
      scannedAt,
      excludedWorktrees
    };
  }
  parseOutput(output, root) {
    const unusedExports = parseVultureOutput(output, root);
    const total = unusedExports.length;
    return {
      ...emptyResult(this.language),
      success: true,
      // #2154: parsed vulture output for this root.
      analyzed: true,
      unusedExports,
      summary: total === 0 ? "No dead code found" : `Found ${total} unused Python symbol(s)`
    };
  }
};
function getDeadCodeClients(verbose = false) {
  return [new PythonDeadCodeClient(verbose)];
}
function deadCodeIssueCount(result) {
  return result.unusedExports.length + result.unusedFiles.length + result.unusedDeps.length + result.unlistedDeps.length;
}
function deadCodeIssues(result) {
  return [
    ...result.unusedExports,
    ...result.unusedFiles,
    ...result.unusedDeps,
    ...result.unlistedDeps
  ];
}
function stableFindingKey(...parts) {
  return parts.map((part) => part ?? "").join(":");
}
function deadCodeIssueKey(issue) {
  return stableFindingKey(issue.category, issue.file, issue.name);
}
var DEAD_CODE_DELTA_MAX_SHOWN = 5;
function formatDeadCodeDelta(issues, language, max = DEAD_CODE_DELTA_MAX_SHOWN) {
  if (issues.length === 0)
    return "";
  let report = `\u{1F480} Newly unused ${language} symbols in files you edited \u2014 check if callers need updating (dead-code):
`;
  for (const issue of issues.slice(0, max)) {
    const loc = issue.file ? `${issue.file}${issue.line ? `:${issue.line}` : ""}` : "(unknown)";
    report += `  ${loc} \u2014 unused ${issue.kind} ${issue.name}
`;
  }
  if (issues.length > max) {
    report += `  \u2026 and ${issues.length - max} more
`;
  }
  return report;
}

export {
  parseVultureOutput,
  PythonDeadCodeClient,
  getDeadCodeClients,
  deadCodeIssueCount,
  deadCodeIssues,
  stableFindingKey,
  deadCodeIssueKey,
  DEAD_CODE_DELTA_MAX_SHOWN,
  formatDeadCodeDelta
};
