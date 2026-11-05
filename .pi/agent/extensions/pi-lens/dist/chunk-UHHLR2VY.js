import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  nestedWorktreeOffsets
} from "./chunk-KZ4ALBCH.js";
import {
  scannerReportParentDir
} from "./chunk-RGGH6M34.js";
import {
  formatToolFailure
} from "./chunk-RZG472YW.js";
import {
  createAvailabilityChecker,
  findManagedNodeToolBinary,
  resolveAvailableOrInstall
} from "./chunk-ZFORSIED.js";
import "./chunk-5F3XF3SX.js";
import "./chunk-XYLC35E4.js";
import "./chunk-DYRZGUMA.js";
import "./chunk-FHEV6T4L.js";
import "./chunk-ZZDIOAAJ.js";
import "./chunk-7ANZ7XDD.js";
import "./chunk-WC6WRNQT.js";
import "./chunk-HHR7WGCI.js";
import "./chunk-HKIL6DCL.js";
import "./chunk-PPKECBPP.js";
import "./chunk-5RNB4HVK.js";
import "./chunk-CKEQFGLT.js";
import "./chunk-JYLOYTZD.js";
import "./chunk-HUAM7QG3.js";
import {
  getJscpdMaxEntriesDerived
} from "./chunk-HXFUTMX2.js";
import "./chunk-2BEMIWEW.js";
import "./chunk-IJYGIDF4.js";
import "./chunk-BQG2QFVO.js";
import "./chunk-IYVYZQRL.js";
import {
  findNodeToolBinary
} from "./chunk-VOP4PJKA.js";
import {
  getIsolatedNpxSpawnOptions
} from "./chunk-JBP7KESM.js";
import "./chunk-UYXV5NIS.js";
import "./chunk-JZRP4DGP.js";
import "./chunk-SDFKOLSF.js";
import "./chunk-BBET6HD6.js";
import "./chunk-G6JKM4O7.js";
import {
  shouldRecurseIntoDir,
  walkTreeStackSync
} from "./chunk-O2ARHQKF.js";
import {
  getExcludedDirGlobs,
  getProjectIgnoreGlobs,
  getProjectIgnoreMatcher,
  safeSpawnAsync
} from "./chunk-WMDUT4KH.js";
import "./chunk-AWQWXSW4.js";
import "./chunk-QYF5S6P6.js";
import "./chunk-G5GV2Q7K.js";
import "./chunk-X35S7HSB.js";
import "./chunk-SQC7K3SP.js";
import "./chunk-JE6HKLC7.js";
import {
  incrementDegradationCount
} from "./chunk-2453RRJ2.js";
import {
  createSubsystemLogger
} from "./chunk-WQV6BI4Q.js";
import "./chunk-S26LC76R.js";
import "./chunk-565VRUP4.js";
import "./chunk-VLQ7UKZH.js";
import "./chunk-LJDODBBZ.js";
import {
  isAtOrAboveHomeDir,
  isFullyQualified,
  realpathOrResolve,
  toPosix
} from "./chunk-GMROJJRN.js";
import "./chunk-NXL4FFQQ.js";

// dist/clients/jscpd-client.js
import * as fs from "node:fs";
import { mkdtempSync } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
var EMPTY_RESULT = {
  success: false,
  clones: [],
  duplicatedLines: 0,
  totalLines: 0,
  percentage: 0
};
var SCAN_TIMEOUT_MS = 3e4;
var JSCPD_CONFIG_FILENAMES = [".jscpd.json", "jscpd.json"];
function readProjectJscpdConfig(cwd) {
  const fromObject = (config) => {
    const list = config?.ignore;
    if (list === void 0)
      return { ignoreList: [] };
    return Array.isArray(list) && list.every((e) => typeof e === "string") ? { ignoreList: list } : { ignoreList: null };
  };
  for (const name of JSCPD_CONFIG_FILENAMES) {
    const file = path.join(cwd, name);
    if (!fs.existsSync(file))
      continue;
    try {
      return fromObject(JSON.parse(fs.readFileSync(file, "utf-8")));
    } catch {
      return { ignoreList: null };
    }
  }
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(cwd, "package.json"), "utf-8"));
    if (pkg && typeof pkg === "object" && pkg.jscpd !== void 0) {
      return fromObject(pkg.jscpd);
    }
  } catch {
  }
  return null;
}
function worktreeIgnoreGlobs(cwd) {
  const globs = [];
  for (const offset of nestedWorktreeOffsets(cwd)) {
    const inside = toPosix(offset);
    const unsafe = inside.includes(",") ? "comma-in-path" : /[*?[\]{}()!\\]/.test(inside) ? "glob-char-in-path" : null;
    if (unsafe) {
      incrementDegradationCount({
        kind: "scan-worktree-exclusion-skipped",
        subject: "jscpd",
        reason: `${unsafe}: ${inside} not ignored under ${cwd}`
      });
      continue;
    }
    globs.push(`${inside}/**`);
  }
  return globs;
}
var jscpdAvailability = createAvailabilityChecker("jscpd", "", ["--version"], {
  probeTimeout: 1500,
  // One definition of the managed-shim fast path, shared with knip (#1476).
  fastPath: () => findManagedNodeToolBinary("jscpd")
});
var JscpdClient = class {
  // Absolute path of a MANAGED jscpd (the global ~/.pi-lens tools shim
  // discovered by the availability fast path, or the ensureTool install
  // result), else null. Nullable on purpose: a bare-name sentinel can't
  // distinguish "resolved" from "on PATH" — ensureTool may legitimately
  // return a bare command for an already-spawnable tool (#1289 review).
  // Project-local binaries are NOT stored; each scan resolves those against
  // its own cwd via findNodeToolBinary.
  jscpdManagedPath = null;
  inFlight = /* @__PURE__ */ new Map();
  // Pending availability probes. A scan holds no `inFlight` entry until its
  // own probe settles, so `shutdown()` must see the probe too (#4505).
  probing = /* @__PURE__ */ new Set();
  log;
  constructor(verbose = false) {
    this.log = verbose ? createSubsystemLogger("jscpd") : () => {
    };
  }
  /**
   * Wait for scans already started by this client to settle. Test owners use
   * this as the lifecycle barrier before removing fixture roots; the scan
   * promise includes the jscpd child and its report-directory cleanup.
   *
   * A scan registers in `inFlight` only after its availability probe settles,
   * and the session_start task probes once before `scan()` probes again. The
   * loop therefore repeats until a pass finds no probe and no scan. Both sets
   * drop an entry before its promise settles, so an empty pass ends the loop
   * and a pass over pending work never spins. The wait is bounded by the work
   * already started: each probe by `probeTimeout` (1.5 s, tool install off in
   * tests) and each scan by `SCAN_TIMEOUT_MS` (30 s); the loop adds none of its
   * own and ends once the client is idle.
   */
  async shutdown() {
    do {
      await Promise.allSettled([...this.probing, ...this.inFlight.values()]);
    } while (this.probing.size > 0 || this.inFlight.size > 0);
  }
  /**
   * Fast recursive source file presence check.
   * Avoids running jscpd when repo has no relevant source files.
   *
   * Originally this gate accepted only JS/TS extensions (commit 8b5d588).
   * That made pi-lens's jscpd integration effectively JS/TS-only even
   * though jscpd's tokenizer covers 15+ languages. Pure-Python /
   * pure-Go / pure-Rust / pure-Java / etc. repos got zero clone
   * detection. Closes #126: extend the gate to every language jscpd
   * tokenizes well. Languages with no jscpd tokenizer (Gleam, Zig,
   * Fish) are deliberately excluded — the gate change wouldn't help
   * them.
   */
  hasSourceFilesRecursive(rootDir) {
    const ignoreMatcher = getProjectIgnoreMatcher(rootDir);
    const state = { visited: 0 };
    const MAX_ENTRIES = getJscpdMaxEntriesDerived(rootDir);
    return walkTreeStackSync(rootDir, (entry, fullPath) => {
      state.visited += 1;
      if (entry.isSymbolicLink())
        return "skip";
      if (entry.isDirectory()) {
        return shouldRecurseIntoDir(entry, fullPath, {
          ignoreMatcher,
          followSymlinks: true
        }) ? "recurse" : "skip";
      }
      if (!entry.isFile())
        return "skip";
      if (/\.(ts|tsx|js|jsx|mjs|cjs|py|pyi|java|go|rs|rb|php|swift|kt|kts|dart|lua|scala|c|h|cpp|cc|cxx|hpp|hxx|cs|m|mm)$/.test(entry.name)) {
        if (entry.name.endsWith(".d.ts"))
          return "skip";
        if (ignoreMatcher.isIgnored(fullPath, false))
          return "skip";
        return "stop";
      }
      return "skip";
    }, { shouldStop: () => state.visited >= MAX_ENTRIES });
  }
  /**
   * Check if jscpd is available, auto-install if not
   */
  ensureAvailable() {
    const probe = this.probeAvailable().finally(() => {
      this.probing.delete(probe);
    });
    this.probing.add(probe);
    return probe;
  }
  async probeAvailable() {
    const resolved = await resolveAvailableOrInstall(jscpdAvailability, "jscpd", process.cwd());
    if (!resolved)
      return false;
    if (isFullyQualified(resolved))
      this.jscpdManagedPath = resolved;
    return true;
  }
  /**
   * #1623: public availability verdict for callers outside the dispatch
   * graph (mode=full's fresh-fetch) that need to say WHY `ensureAvailable()`
   * most recently returned false, using the SAME outcome/cause the shared
   * `jscpdAvailability` checker already tracks — not a re-guessed "jscpd
   * binary unavailable" that can't tell a transient retry-cooldown probe
   * from a durable absence.
   */
  getAvailabilityVerdict() {
    const verdict = jscpdAvailability.getVerdict(process.cwd());
    return {
      outcome: verdict.outcome,
      cause: verdict.cause,
      retryAtMs: verdict.retryAtMs
    };
  }
  /**
   * Scan a directory for duplicate code blocks.
   * Uses a temp output dir to capture JSON report.
   * @param isTsProject - If true, excludes .js files (they're compiled artifacts in TS projects)
   *
   * Root contract (#747/#250): unlike `KnipClient`/`DeadCodeClient`, this
   * client does NOT resolve a project root via `findNearestMarkerRoot`, so it
   * has historically relied on every caller to guard the scan root itself. The
   * `isAtOrAboveHomeDir` refusal below is belt-and-braces internal protection
   * so a FUTURE caller that forgets that contract can't spawn a whole-$HOME
   * jscpd walk (the observed OOM: a jscpd run from a WSL home reached 44 GB
   * RSS). `options.homeDir` overrides `os.homedir()` for tests.
   */
  async scan(cwd, minLines = 5, minTokens = 50, isTsProject = false, options = {}) {
    const targetDir = path.resolve(cwd);
    if (isAtOrAboveHomeDir(realpathOrResolve(targetDir), realpathOrResolve(options.homeDir ?? os.homedir()))) {
      this.log(`Refusing scan of unsafe root at/above home: ${targetDir}`);
      return { ...EMPTY_RESULT };
    }
    if (!fs.existsSync(targetDir)) {
      return { ...EMPTY_RESULT };
    }
    if (!this.hasSourceFilesRecursive(targetDir)) {
      return { ...EMPTY_RESULT, success: true };
    }
    if (!await this.ensureAvailable()) {
      return { ...EMPTY_RESULT };
    }
    const key = `${targetDir}:${minLines}:${minTokens}:${isTsProject}`;
    const existing = this.inFlight.get(key);
    if (existing) {
      this.log(`Scan already in flight for ${targetDir}; sharing result`);
      return existing;
    }
    const promise = this.runScan(targetDir, minLines, minTokens, isTsProject).finally(() => {
      if (this.inFlight.get(key) === promise)
        this.inFlight.delete(key);
    });
    this.inFlight.set(key, promise);
    return promise;
  }
  async runScan(cwd, minLines, minTokens, isTsProject) {
    const scannedAt = (/* @__PURE__ */ new Date()).toISOString();
    const outDir = mkdtempSync(path.join(scannerReportParentDir(), "pi-lens-jscpd-"));
    try {
      const baseIgnores = [
        ...getExcludedDirGlobs(),
        ...getProjectIgnoreGlobs(cwd),
        "**/*.md",
        "**/*.txt",
        "**/*.json",
        "**/*.yaml",
        "**/*.yml",
        "**/*.toml",
        "**/*.lock",
        "**/*.test.*",
        "**/*.spec.*",
        "**/*.poc.test.*",
        "**/__tests__/**",
        "**/tests/**"
      ];
      if (isTsProject) {
        baseIgnores.push("**/*.js", "**/*.jsx");
      }
      const bin = await findNodeToolBinary("jscpd", cwd);
      const { cmd, prefix } = bin ? { cmd: bin, prefix: [] } : this.jscpdManagedPath ? { cmd: this.jscpdManagedPath, prefix: [] } : { cmd: "npx", prefix: ["jscpd"] };
      const config = readProjectJscpdConfig(cwd);
      const worktreeGlobs = worktreeIgnoreGlobs(cwd);
      let patterns;
      if (config === null) {
        patterns = [...baseIgnores, ...worktreeGlobs];
      } else if (worktreeGlobs.length > 0) {
        if (config.ignoreList === null) {
          incrementDegradationCount({
            kind: "scan-worktree-exclusion-skipped",
            subject: "jscpd",
            reason: `config-ignore-unreadable: ${worktreeGlobs.length} linked worktree(s) under ${cwd} not ignored`
          });
        } else {
          patterns = [...config.ignoreList, ...worktreeGlobs];
        }
      }
      const result = await safeSpawnAsync(cmd, [
        ...prefix,
        ".",
        ...config === null ? [
          "--min-lines",
          String(minLines),
          "--min-tokens",
          String(minTokens)
        ] : [],
        "--reporters",
        "json",
        "--output",
        outDir,
        ...patterns === void 0 ? [] : ["--ignore", patterns.join(",")]
      ], {
        timeout: SCAN_TIMEOUT_MS,
        // A cache-only npx fallback must not read the project's `.npmrc`
        // (#4268 acceptance 3); local/managed jscpd keeps the project cwd.
        cwd,
        ...cmd === "npx" ? getIsolatedNpxSpawnOptions() : {}
      });
      if (result.error) {
        this.log(`Scan error: ${result.error.message}`);
        return { ...EMPTY_RESULT };
      }
      const reportPath = path.join(outDir, "jscpd-report.json");
      if (!fs.existsSync(reportPath)) {
        if (result.status !== 0) {
          const reason = formatToolFailure({
            tool: "jscpd",
            status: result.status,
            signal: result.signal,
            stderr: result.stderr,
            reportMissing: true,
            fields: { command: cmd }
          });
          this.log(reason);
          incrementDegradationCount({
            kind: "runner-empty-result",
            subject: "jscpd",
            reason
          });
          return { ...EMPTY_RESULT };
        }
        return { ...EMPTY_RESULT, success: true };
      }
      return { ...this.parseReport(reportPath), scannedAt };
    } catch (err) {
      this.log(`Scan error: ${err.message}`);
      return { ...EMPTY_RESULT };
    } finally {
      try {
        fs.rmSync(outDir, { recursive: true, force: true });
      } catch (err) {
        void err;
      }
    }
  }
  formatResult(result, maxClones = 8) {
    if (!result.success || result.clones.length === 0)
      return "";
    const pct = result.percentage.toFixed(1);
    let output = `[jscpd] ${result.clones.length} duplicate block(s) \u2014 ${pct}% of codebase (${result.duplicatedLines}/${result.totalLines} lines):
`;
    for (const clone of result.clones.slice(0, maxClones)) {
      const a = `${path.basename(clone.fileA)}:${clone.startA}`;
      const b = `${path.basename(clone.fileB)}:${clone.startB}`;
      output += `  ${clone.lines} lines \u2014 ${a} \u2194 ${b}
`;
    }
    if (result.clones.length > maxClones) {
      output += `  ... and ${result.clones.length - maxClones} more
`;
    }
    return output;
  }
  // --- Internal ---
  parseReport(reportPath) {
    try {
      const data = JSON.parse(fs.readFileSync(reportPath, "utf-8"));
      const total = data.statistics?.total ?? {};
      const duplicatedLines = total.duplicatedLines ?? 0;
      const totalLines = total.lines ?? 0;
      const percentage = total.percentage ?? (totalLines > 0 ? duplicatedLines / totalLines * 100 : 0);
      const rawClones = data.duplicates ?? [];
      const clones = rawClones.map((c) => ({
        fileA: c.firstFile?.name ?? "",
        startA: c.firstFile?.start ?? 0,
        fileB: c.secondFile?.name ?? "",
        startB: c.secondFile?.start ?? 0,
        lines: c.lines ?? 0,
        tokens: c.tokens ?? 0
      }));
      return {
        success: true,
        analyzed: true,
        clones,
        duplicatedLines,
        totalLines,
        percentage
      };
    } catch (err) {
      void err;
      return {
        success: false,
        clones: [],
        duplicatedLines: 0,
        totalLines: 0,
        percentage: 0
      };
    }
  }
};
export {
  JscpdClient
};
