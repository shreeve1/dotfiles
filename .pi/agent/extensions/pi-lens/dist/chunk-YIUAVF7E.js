import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  HardFailureStamps
} from "./chunk-7U2IDNXN.js";
import {
  formatToolFailure
} from "./chunk-2CD5RS6M.js";
import {
  spawnFailedWithNoOutput
} from "./chunk-UZ3TUTRV.js";
import {
  createAvailabilityChecker,
  findManagedNodeToolBinary,
  getManagedToolEnvironment,
  resolveAvailableOrInstall
} from "./chunk-YSZNHOBY.js";
import "./chunk-RPLINGVB.js";
import "./chunk-EU63SDCG.js";
import "./chunk-VWCXW2E7.js";
import "./chunk-FCSOVF55.js";
import {
  canonicalDirectory,
  listNestedLinkedWorktreeRoots
} from "./chunk-PNQDPDRC.js";
import "./chunk-ZXYDQ3TZ.js";
import "./chunk-724UL2TJ.js";
import "./chunk-QOZXJ4NA.js";
import "./chunk-P7266HLM.js";
import "./chunk-52FUZI6K.js";
import "./chunk-SAEFPSB6.js";
import "./chunk-GAEGEPOC.js";
import "./chunk-Z3CCVDUB.js";
import "./chunk-2BEMIWEW.js";
import {
  logSessionStart
} from "./chunk-ACXEQZOU.js";
import "./chunk-Q7DUK4LX.js";
import {
  findLocalBinUpwards,
  localBinPath
} from "./chunk-AW7R2GWG.js";
import "./chunk-RWWYJ623.js";
import {
  createAvailabilityLatch,
  describeUnavailability
} from "./chunk-VRZP76YM.js";
import "./chunk-QOBUHWHX.js";
import "./chunk-QILIYSJF.js";
import "./chunk-6C7JWPCP.js";
import "./chunk-5NGR67U5.js";
import {
  getProjectDataDir,
  safeSpawnAsync
} from "./chunk-C34ZXZ7O.js";
import "./chunk-BW5KFIQC.js";
import "./chunk-QYF5S6P6.js";
import "./chunk-PHDMFAKM.js";
import "./chunk-2BBLFX75.js";
import "./chunk-XVF2VVXP.js";
import "./chunk-ZANLILYD.js";
import "./chunk-2EECBNC5.js";
import {
  incrementDegradationCount
} from "./chunk-JAU72XNY.js";
import {
  createSubsystemLogger
} from "./chunk-XTMJ7XDT.js";
import "./chunk-JMYYOTQG.js";
import "./chunk-QQNQ7SJW.js";
import "./chunk-AOHZU2BM.js";
import "./chunk-LJDODBBZ.js";
import "./chunk-ABBOA7UD.js";
import {
  findNearestMarkerRoot,
  normalizeEphemeralMapKey,
  normalizeFilePath
} from "./chunk-N2H3ZPZY.js";
import "./chunk-NXL4FFQQ.js";

// dist/clients/knip-client.js
import * as fs from "node:fs";
import * as path from "node:path";
var EMPTY_RESULT = {
  success: false,
  issues: [],
  unusedExports: [],
  unusedFiles: [],
  unusedDeps: [],
  unlistedDeps: []
};
var ANALYSIS_TIMEOUT_MS = 3e4;
function readOverridePinnedPackageNames(targetDir) {
  const names = /* @__PURE__ */ new Set();
  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(path.join(targetDir, "package.json"), "utf-8"));
  } catch {
    return names;
  }
  const collectKeys = (value) => {
    if (!value || typeof value !== "object" || Array.isArray(value))
      return;
    for (const [key, nested] of Object.entries(value)) {
      names.add(key);
      collectKeys(nested);
    }
  };
  collectKeys(pkg.overrides);
  collectKeys(pkg.resolutions);
  collectKeys(pkg.pnpm?.overrides);
  return names;
}
var KNIP_CONFIG_FILENAMES = [
  "knip.json",
  "knip.jsonc",
  "knip.ts",
  "knip.js",
  "knip.config.ts",
  "knip.config.js",
  ".knip.json",
  ".knip.jsonc",
  ".knip.ts",
  ".knip.js"
];
function resolveProjectKnipConfig(targetDir) {
  for (const name of KNIP_CONFIG_FILENAMES) {
    if (fs.existsSync(path.join(targetDir, name)))
      return name;
  }
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(targetDir, "package.json"), "utf-8"));
    if (pkg && typeof pkg === "object" && pkg.knip !== void 0) {
      return "package.json#knip";
    }
  } catch {
  }
  return null;
}
function resolveProjectKnipBinary(targetDir) {
  return localBinPath(findLocalBinUpwards("knip", targetDir)) ?? null;
}
function classifyKnipBinary(binary, targetDir) {
  if (binary === null)
    return "managed-or-path";
  const relative2 = path.relative(path.resolve(targetDir), path.resolve(binary));
  return relative2 === "" || relative2.startsWith("..") || path.isAbsolute(relative2) ? "global" : "project";
}
function readKnipShimVersion(binary) {
  if (!path.isAbsolute(binary))
    return null;
  const binDir = path.dirname(binary);
  if (path.basename(binDir) !== ".bin")
    return null;
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(path.dirname(binDir), "knip", "package.json"), "utf-8"));
    const version = pkg.version;
    return typeof version === "string" ? version : null;
  } catch {
    return null;
  }
}
var NO_NESTED_WORKTREES = {
  count: 0,
  contains: () => false
};
function nestedWorktreeScope(targetDir) {
  const prefixes = [];
  for (const root of listNestedLinkedWorktreeRoots(targetDir)) {
    prefixes.push(`${normalizeEphemeralMapKey(normalizeFilePath(root))}/`);
  }
  if (prefixes.length === 0)
    return NO_NESTED_WORKTREES;
  const base = normalizeFilePath(canonicalDirectory(targetDir));
  return {
    count: prefixes.length,
    contains: (file) => {
      if (!file)
        return false;
      const key = normalizeEphemeralMapKey(`${base}/${file}`);
      return prefixes.some((prefix) => key.startsWith(prefix));
    }
  };
}
var MAX_RECORDED_TOOLCHAINS = 32;
var KnipClient = class {
  knipAvailability = createAvailabilityChecker("knip", ".cmd", ["--version"], {
    environment: (cwd) => getManagedToolEnvironment("knip", cwd),
    unclassifiedFailureOutcome: "missing",
    fastPath: () => findManagedNodeToolBinary("knip")
  });
  /**
   * Client-side memo. Only a DURABLE verdict is latched — a transient probe
   * failure expires, so an installed knip becomes available again without a
   * host restart (#1467).
   */
  availabilityLatch = createAvailabilityLatch();
  knipCommand = "knip";
  ensureInFlight = null;
  log;
  /**
   * De-dupe concurrent `analyze()` calls against the same project root.
   *
   * Without this guard, two back-to-back turn_end events (or a turn_end
   * firing while the session_start scan is still in flight) can each spawn
   * a fresh `knip` process over the same tree. Two concurrent knip
   * runs are CPU-bound and cause the exact pathology we're fixing: load
   * averages >5, TUI freezes, and zombie processes reparented to init
   * after pi exits mid-scan.
   *
   * Key: canonicalised project root (not the caller's cwd). Value is the
   * in-flight promise; completing clears the slot.
   */
  inFlight = /* @__PURE__ */ new Map();
  /**
   * Per project root, the last run that died to a timeout or kill (#3872).
   * Set where the scan SETTLES, so a scan turn_end abandoned at its budget and
   * that later timed out still leaves the failure the next turn must see:
   * the turn's own cache row only exists for a scan that settled inside it.
   */
  hardFailures = new HardFailureStamps();
  /**
   * Per project root, how long its last two successful scans took (#3872).
   * turn_end reads the shorter of the two to stop awaiting a scan that cannot
   * fit the hook budget: the scan still runs (it re-measures, and warms knip's
   * own cache), the hook just no longer waits for it. Two samples, because a
   * session's first scan of a root is cold and its second is not (3.3 s then
   * 1.3 s on pi-lens itself): one cold sample must not cost the next turn its
   * advisory. A scan that failed, was killed or never completed is no sample.
   * Cleared with the other per-session state.
   */
  scanDurations = /* @__PURE__ */ new Map();
  /** Last successful result per project and runtime content generation. */
  completedByProject = /* @__PURE__ */ new Map();
  /**
   * (project root, binary, config) triples already recorded, so the toolchain
   * row is written once per distinct resolution instead of once per run.
   */
  recordedToolchains = /* @__PURE__ */ new Set();
  constructor(verbose = false) {
    this.log = verbose ? createSubsystemLogger("knip") : () => {
    };
  }
  /** Re-arm content-keyed reuse at the session boundary. */
  resetSessionState() {
    this.completedByProject.clear();
    this.hardFailures.clear();
    this.scanDurations.clear();
  }
  /**
   * Find the nearest directory with a project/knip config marker.
   *
   * Returns `null` when no marker is found up to the filesystem root.
   * Callers MUST treat a null return as "no project here, skip knip" —
   * previously this fell back to `startDir`, which on a bare cwd like
   * `/home/v` caused knip to recurse through every project and balloon
   * memory/CPU.
   *
   * Delegates to the shared path-utils helper (refs #625) — never treats a
   * package/knip config at or above $HOME as the project (escapes the
   * workspace, #296/#250), and never walks past a `.git`/`.hg`/`.svn`
   * boundary to pick up an unrelated parent's package.json (Unity/non-JS
   * repos often have no package.json at their own root).
   */
  resolveProjectRoot(startDir, homeDirOverride) {
    return findNearestMarkerRoot(startDir, [
      "package.json",
      "knip.json",
      "knip.ts",
      "knip.config.js",
      "knip.config.ts"
    ], { boundaries: [".git", ".hg", ".svn"], homeDir: homeDirOverride });
  }
  /**
   * Check if knip CLI is available, auto-install if not.
   *
   * The memo returns `null` when the last verdict was transient and its
   * cooldown has expired, which re-enters the probe. That is the difference
   * between "knip is missing" (a fact worth caching) and "the probe timed out"
   * (a moment worth retrying).
   */
  async ensureAvailable() {
    const memo = this.availabilityLatch.read();
    if (memo !== null)
      return memo;
    if (this.ensureInFlight)
      return this.ensureInFlight;
    this.ensureInFlight = this.doEnsureAvailable();
    try {
      return await this.ensureInFlight;
    } finally {
      this.ensureInFlight = null;
    }
  }
  async doEnsureAvailable() {
    const cwd = process.cwd();
    const resolved = await resolveAvailableOrInstall(this.knipAvailability, "knip", cwd);
    if (resolved !== null) {
      this.knipCommand = resolved;
      this.availabilityLatch.noteAvailable();
      return true;
    }
    const verdict = this.knipAvailability.getVerdict(cwd);
    this.availabilityLatch.noteUnavailable(verdict.outcome ?? "missing", verdict.cause ?? "not-found");
    return false;
  }
  /**
   * The single place a knip-unavailable result is worded. A transient probe
   * failure must never be reported as "install knip" — knip is on disk.
   */
  unavailableResult() {
    const verdict = this.knipAvailability.getVerdict(process.cwd());
    const transient = verdict.outcome === "transient";
    const retryAfterMs = verdict.retryAtMs ? Math.max(0, verdict.retryAtMs - Date.now()) : void 0;
    return {
      ...EMPTY_RESULT,
      failureKind: transient ? "unavailable-transient" : "unavailable-missing",
      summary: describeUnavailability({
        tool: "Knip",
        installHint: "npm install -D knip",
        outcome: verdict.outcome,
        cause: verdict.cause,
        elapsedMs: verdict.elapsedMs,
        retryAfterMs
      })
    };
  }
  /**
   * The summary of this root's last timeout or kill, while it is recent
   * enough (30 minutes) to keep turn_end from launching another heavyweight
   * knip (#1467, #3872); `null` when there is none. The root is resolved the
   * way `analyze` resolves it, so a subdirectory and its project root agree.
   */
  recentHardFailure(cwd) {
    const key = this.resolveProjectRoot(cwd);
    if (!key)
      return null;
    return this.hardFailures.recent(key);
  }
  /**
   * The shorter of this root's last two successful scans, or `undefined` while
   * fewer than two settled this session (#3872). The root is resolved the way
   * `analyze` resolves it.
   */
  scanFloorMs(cwd) {
    const samples = this.scanDurations.get(this.resolveProjectRoot(cwd) ?? cwd);
    return samples?.length === 2 ? Math.min(...samples) : void 0;
  }
  /** Linked worktrees nested under this root, which knip walks as project files (#3872). */
  nestedWorktrees(cwd) {
    return nestedWorktreeScope(this.resolveProjectRoot(cwd) ?? cwd).count;
  }
  /**
   * Run knip analysis on the project.
   *
   * Async (uses `safeSpawnAsync`) so it never blocks the event loop —
   * knip scans on large monorepos can take tens of seconds, and the
   * previous `spawnSync` implementation froze the TUI for the entire
   * duration.
   *
   * Re-entrancy safe: concurrent calls resolving to the same project
   * root share a single knip process via `inFlight`.
   *
   * Successful memo hits validate package.json and the resolved Knip config
   * with bounded metadata checks. The two statSync calls replace a 10-23
   * second project scan. Source-only external edits remain undetected until
   * pi observes a write or the session resets.
   */
  async analyze(cwd, _ignore, options = {}) {
    const targetDir = this.resolveProjectRoot(cwd || process.cwd());
    if (!targetDir) {
      this.log(`No project root found from ${cwd || process.cwd()}; skipping knip`);
      return {
        ...EMPTY_RESULT,
        success: true,
        summary: "No project root found; knip skipped"
      };
    }
    const key = path.resolve(targetDir);
    const completed = this.completedByProject.get(key);
    if (options.projectSeq !== void 0 && completed?.projectSeq === options.projectSeq && this.matchesMemoSignal(targetDir, completed.signal)) {
      this.log(`Analysis cache hit for ${key} at projectSeq ${options.projectSeq}`);
      return { ...completed.result, execution: "cache", analyzed: false };
    }
    if (resolveProjectKnipBinary(targetDir) === null && !await this.ensureAvailable()) {
      return this.unavailableResult();
    }
    const existing = this.inFlight.get(key);
    if (existing) {
      this.log(`Analysis already in flight for ${key}; sharing result`);
      return existing;
    }
    const startedAt = Date.now();
    const promise = this.runAnalyze(key).then((result) => {
      this.hardFailures.settle(key, result);
      if (result.success) {
        this.scanDurations.set(key, [
          ...(this.scanDurations.get(key) ?? []).slice(-1),
          Date.now() - startedAt
        ]);
      }
      const executed = { ...result, execution: "executed" };
      if (result.success && options.projectSeq !== void 0) {
        this.completedByProject.set(key, {
          projectSeq: options.projectSeq,
          result: executed,
          signal: this.readMemoSignal(key)
        });
      }
      return executed;
    });
    const wrapped = promise.finally(() => {
      if (this.inFlight.get(key) === wrapped)
        this.inFlight.delete(key);
    });
    this.inFlight.set(key, wrapped);
    return wrapped;
  }
  readMemoFileSignal(filePath) {
    try {
      const stat = fs.statSync(filePath);
      return { path: filePath, mtimeMs: stat.mtimeMs, size: stat.size };
    } catch {
      return null;
    }
  }
  readMemoSignal(targetDir) {
    const config = resolveProjectKnipConfig(targetDir);
    return {
      packageJson: this.readMemoFileSignal(path.join(targetDir, "package.json")),
      config: config && config !== "package.json#knip" ? this.readMemoFileSignal(path.join(targetDir, config)) : null
    };
  }
  matchesMemoSignal(targetDir, signal) {
    const current = {
      packageJson: this.readMemoFileSignal(path.join(targetDir, "package.json")),
      config: signal.config ? this.readMemoFileSignal(signal.config.path) : null
    };
    return JSON.stringify(current.packageJson) === JSON.stringify(signal.packageJson) && JSON.stringify(current.config) === JSON.stringify(signal.config);
  }
  async runAnalyze(targetDir) {
    const scannedAt = (/* @__PURE__ */ new Date()).toISOString();
    const cacheLocation = path.join(getProjectDataDir(targetDir), "cache", "knip");
    try {
      fs.mkdirSync(cacheLocation, { recursive: true });
    } catch (err) {
      this.log(`Failed to pre-create knip cache dir ${cacheLocation}: ${err}`);
    }
    this.pruneStaleGlobCache(cacheLocation);
    const args = [
      "--reporter=json",
      "--include",
      // enumMembers surfaces unused enum members — finer-grained than
      // file-level exports. (knip 6.x has NO `classMembers` issue type; passing
      // it makes knip exit 2 with zero output, silently disabling the scan —
      // verified against knip 6.20. Valid member-level type here is enumMembers.)
      "files,exports,types,dependencies,unlisted,enumMembers",
      "--cache",
      "--cache-location",
      cacheLocation
    ];
    const projectBinary = resolveProjectKnipBinary(targetDir);
    const command = projectBinary ?? this.knipCommand;
    this.recordToolchain(targetDir, command, classifyKnipBinary(projectBinary, targetDir));
    const result = await safeSpawnAsync(command, args, {
      timeout: ANALYSIS_TIMEOUT_MS,
      cwd: targetDir,
      env: await getManagedToolEnvironment("knip", targetDir)
    });
    if (result.error) {
      this.log(`Analysis error: ${result.error.message}`);
      return {
        ...EMPTY_RESULT,
        summary: `Error: ${result.error.message}`
      };
    }
    const output = result.stdout || "";
    this.log(`Knip output length: ${output.length}, exit status: ${result.status}`);
    if (output.length < 500) {
      this.log(`Knip output sample: ${output}`);
    }
    if (!output.trim()) {
      if (spawnFailedWithNoOutput(result, output)) {
        const reason = formatToolFailure({
          tool: "knip",
          status: result.status,
          signal: result.signal,
          stderr: result.stderr,
          fields: {
            command,
            source: classifyKnipBinary(projectBinary, targetDir)
          }
        });
        this.log(reason);
        incrementDegradationCount({
          kind: "runner-empty-result",
          subject: "knip",
          reason
        });
        return {
          ...EMPTY_RESULT,
          summary: `Knip exited ${result.status} with no output; run skipped`
        };
      }
      return {
        ...EMPTY_RESULT,
        success: true,
        summary: "No issues found"
      };
    }
    return {
      ...this.dropOverridePinnedDeps(this.parseOutput(output, nestedWorktreeScope(targetDir)), targetDir),
      scannedAt
    };
  }
  /**
   * Record WHICH knip a run used and WHICH config it ran under (#1721).
   *
   * The dogfood failure this fixes was invisible from the outside: the lens
   * reported 62 unused type exports and the project's own `npx knip` reported
   * none, with nothing in any log to say the two ran different binaries. This
   * row is that missing evidence — it names the shim, its version, the config
   * knip will discover, and whether the shim came from the project or from
   * pi-lens.
   *
   * Bounded twice over: one row per distinct (project root, binary, config)
   * triple, and at most `MAX_RECORDED_TOOLCHAINS` distinct triples per client.
   * Steady-state cost is therefore one line per project per session, not one
   * per turn_end.
   */
  recordToolchain(targetDir, command, source) {
    const config = resolveProjectKnipConfig(targetDir);
    const key = `${targetDir} ${command} ${config ?? ""}`;
    if (this.recordedToolchains.has(key))
      return;
    if (this.recordedToolchains.size >= MAX_RECORDED_TOOLCHAINS)
      return;
    this.recordedToolchains.add(key);
    const version = readKnipShimVersion(command);
    logSessionStart(`knip toolchain ${targetDir}: binary=${command}${version ? ` version=${version}` : ""} source=${source} config=${config ?? "none (knip defaults)"}`);
  }
  /**
   * Delete knip's glob cache (`glob-<version>.cache`) before every run (#1630).
   *
   * knip revalidates a cached glob against the mtimes of the directories that
   * contributed a matched path. Directories that matched nothing are never
   * recorded, so files later added to them stay invisible and knip keeps
   * reporting an export as unused after a new consumer imports it. Removing
   * this one file forces a fresh file walk while the module and plugin caches —
   * which carry nearly all of the cache's speed — survive.
   *
   * Failures are logged and ignored: a glob cache we could not delete degrades
   * to the pre-#1630 behavior, which is stale but not fatal.
   */
  pruneStaleGlobCache(cacheLocation) {
    let entries;
    try {
      entries = fs.readdirSync(cacheLocation);
    } catch (err) {
      this.log(`Failed to read knip cache dir ${cacheLocation}: ${err}`);
      return;
    }
    for (const entry of entries) {
      if (!entry.startsWith("glob-") || !entry.endsWith(".cache"))
        continue;
      try {
        fs.rmSync(path.join(cacheLocation, entry), { force: true });
        this.log(`Pruned knip glob cache ${entry}`);
      } catch (err) {
        this.log(`Failed to prune knip glob cache ${entry}: ${err}`);
      }
    }
  }
  /**
   * Drop `dependency`/`devDependency` issues for a package that's also
   * referenced as an npm `overrides` (or Yarn `resolutions` / pnpm
   * `pnpm.overrides`) key in this project's `package.json` (#968).
   *
   * A direct devDependency whose only job is pinning a vulnerable
   * transitive/peer resolution has no source import — that's WORKING AS
   * INTENDED, not dead code, and knip has no concept of "this dependency
   * exists only to satisfy an overrides entry" (it only sees imports).
   * `overrides`/`resolutions` are the project's own explicit, unambiguous
   * signal that the package is deliberately present — the same class of
   * signal `hardcoded-url`'s `SCREAMING_SNAKE_CASE` constant-name carve-out
   * and `ts-ssrf`'s constant-identifier carve-out lean on elsewhere in this
   * codebase — so this narrows the finding rather than suppressing
   * `dependency`/`devDependency` issues wholesale: a devDependency that
   * ISN'T also an overrides/resolutions key is still reported.
   */
  dropOverridePinnedDeps(result, targetDir) {
    if (result.unusedDeps.length === 0)
      return result;
    const pinned = readOverridePinnedPackageNames(targetDir);
    if (pinned.size === 0)
      return result;
    const isPinnedDepIssue = (issue) => (issue.type === "dependency" || issue.type === "devDependency") && (pinned.has(issue.name) || !!issue.package && pinned.has(issue.package));
    const issues = result.issues.filter((issue) => !isPinnedDepIssue(issue));
    const unusedDeps = result.unusedDeps.filter((issue) => !isPinnedDepIssue(issue));
    return unusedDeps.length === result.unusedDeps.length ? result : { ...result, issues, unusedDeps };
  }
  /**
   * Find unused exports in a specific file
   */
  async findUnusedExports(filePath) {
    const result = await this.analyze(path.dirname(filePath));
    const basename2 = path.basename(filePath);
    return result.unusedExports.filter((e) => e.file?.includes(basename2)).map((e) => e.name);
  }
  /**
   * Format results for LLM consumption. Delegates to the pure
   * `formatKnipResult` so callers (e.g. turn-end) can format without a live
   * client instance.
   */
  formatResult(result, maxItems = 20) {
    return formatKnipResult(result, maxItems);
  }
  // --- Internal ---
  parseOutput(output, nested = NO_NESTED_WORKTREES) {
    try {
      const data = JSON.parse(output);
      const issues = [];
      const unusedExports = [];
      const unusedFiles = [];
      const unusedDeps = [];
      const unlistedDeps = [];
      const droppedFiles = /* @__PURE__ */ new Set();
      const addIssue = (issue) => {
        if (nested.contains(issue.file)) {
          droppedFiles.add(issue.file ?? "");
          return;
        }
        issues.push(issue);
        if (issue.type === "export" || issue.type === "enumMember") {
          unusedExports.push(issue);
        }
        if (issue.type === "file")
          unusedFiles.push(issue);
        if (issue.type === "dependency" || issue.type === "devDependency") {
          unusedDeps.push(issue);
        }
        if (issue.type === "unlisted" || issue.type === "bin") {
          unlistedDeps.push(issue);
        }
      };
      const fileEntries = Array.isArray(data?.issues) ? data.issues : [];
      for (const entry of fileEntries) {
        const file = entry.file ?? "";
        const push = (arr, type, _target) => {
          for (const item of arr) {
            addIssue({
              type,
              name: item.name ?? item.symbol ?? String(item),
              file,
              line: item.line,
              package: item.package
            });
          }
        };
        push(entry.exports ?? [], "export", unusedExports);
        push(entry.types ?? [], "export", unusedExports);
        push(entry.enumMembers ?? [], "enumMember", unusedExports);
        push(entry.files ?? [], "file", unusedFiles);
        push(entry.dependencies ?? [], "dependency", unusedDeps);
        push(entry.devDependencies ?? [], "devDependency", unusedDeps);
        push(entry.unlisted ?? [], "unlisted", unlistedDeps);
        push(entry.binaries ?? [], "bin", unlistedDeps);
      }
      if (issues.length === 0 && Array.isArray(data)) {
        for (const item of data) {
          if (!item || typeof item !== "object")
            continue;
          const rawType = String(item.type ?? item.issueType ?? item.kind ?? "file").toLowerCase();
          const type = rawType === "export" || rawType === "exports" ? "export" : rawType === "dependency" ? "dependency" : rawType === "devdependency" ? "devDependency" : rawType === "unlisted" ? "unlisted" : rawType === "bin" || rawType === "binaries" ? "bin" : "file";
          addIssue({
            type,
            name: String(item.name ?? item.symbol ?? item.package ?? item.message ?? "unknown"),
            file: item.file ?? item.path ?? item.location?.file,
            line: item.line ?? item.location?.line,
            package: item.package
          });
        }
      }
      return {
        success: true,
        // #2154: the one knip site that parsed a scan of this root.
        analyzed: true,
        issues,
        unusedExports,
        unusedFiles,
        unusedDeps,
        unlistedDeps,
        summary: `Found ${issues.length} issues`,
        ...nested.count > 0 && {
          nestedWorktrees: nested.count,
          nestedFilesDropped: droppedFiles.size
        }
      };
    } catch (err) {
      void err;
      this.log("Failed to parse knip JSON output");
      return {
        ...EMPTY_RESULT,
        summary: "Failed to parse output"
      };
    }
  }
};
function formatKnipResult(result, maxItems = 20) {
  if (!result.success)
    return `[Knip] ${result.summary}`;
  if (result.issues.length === 0)
    return "";
  let output = `[Knip] ${result.issues.length} issue(s)`;
  if (result.unusedExports.length)
    output += ` \u2014 ${result.unusedExports.length} unused export(s)`;
  if (result.unusedFiles.length)
    output += ` \u2014 ${result.unusedFiles.length} unused file(s)`;
  if (result.unusedDeps.length)
    output += ` \u2014 ${result.unusedDeps.length} unused dep(s)`;
  if (result.unlistedDeps.length)
    output += ` \u2014 ${result.unlistedDeps.length} unlisted dep(s)`;
  output += ":\n";
  if (result.unusedExports.length > 0) {
    output += "\n  Unused exports:\n";
    for (const issue of result.unusedExports.slice(0, maxItems)) {
      const loc = issue.file ? ` (${path.basename(issue.file)})` : "";
      output += `    - ${issue.name}${loc}
`;
    }
    if (result.unusedExports.length > maxItems) {
      output += `    ... and ${result.unusedExports.length - maxItems} more
`;
    }
  }
  if (result.unusedFiles.length > 0) {
    output += "\n  Unused files:\n";
    for (const issue of result.unusedFiles.slice(0, 10)) {
      output += `    - ${issue.name}
`;
    }
  }
  if (result.unusedDeps.length > 0) {
    output += "\n  Unused dependencies:\n";
    for (const issue of result.unusedDeps) {
      output += `    - ${issue.package || issue.name}
`;
    }
  }
  return output;
}
export {
  KnipClient,
  classifyKnipBinary,
  formatKnipResult,
  readOverridePinnedPackageNames,
  resolveProjectKnipBinary,
  resolveProjectKnipConfig
};
