import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  createAvailabilityChecker,
  discoverManagedTool,
  getManagedToolEnvironment,
  resolveAvailableOrInstall
} from "./chunk-YSZNHOBY.js";
import {
  mapWithConcurrency
} from "./chunk-XIMYZ3JA.js";
import {
  findNodeToolBinary
} from "./chunk-AW7R2GWG.js";
import {
  getIsolatedNpxSpawnOptions
} from "./chunk-RWWYJ623.js";
import {
  createAvailabilityLatch
} from "./chunk-VRZP76YM.js";
import {
  safeSpawnAsync
} from "./chunk-C34ZXZ7O.js";
import {
  compareOrdinal,
  recordDegradationOnce
} from "./chunk-JAU72XNY.js";
import {
  createSubsystemLogger
} from "./chunk-XTMJ7XDT.js";
import {
  isFullyQualified
} from "./chunk-N2H3ZPZY.js";

// dist/clients/dependency-checker.js
import * as fs from "node:fs";
import * as path from "node:path";
function buildMadgeArgs(target, projectRoot) {
  const args = ["--circular", "--extensions", "ts,tsx,js,jsx,mjs,cjs"];
  const tsConfig = path.join(projectRoot, "tsconfig.json");
  if (fs.existsSync(tsConfig)) {
    args.push("--ts-config", tsConfig);
  }
  args.push("--json", target);
  return args;
}
function parseMadgeCycles(stdout, baseDir, projectRoot) {
  let parsed;
  try {
    parsed = JSON.parse(stdout || "[]");
  } catch (err) {
    throw new Error(`madge report is not valid JSON: ${err instanceof Error ? err.message : String(err)}`);
  }
  const cycles = Array.isArray(parsed) ? parsed : [];
  const circular = [];
  const circularFiles = /* @__PURE__ */ new Set();
  for (const cycle of cycles) {
    const resolvedPaths = cycle.map((f) => path.resolve(baseDir, f));
    for (const f of resolvedPaths) {
      circularFiles.add(f);
    }
    circular.push({
      file: resolvedPaths[0],
      path: resolvedPaths
    });
  }
  recordDegradationOnce({
    kind: "madge-skip-visibility-unavailable",
    subject: projectRoot,
    reason: "madge --warning is inert under --json; skipped-file visibility is unavailable for this scan"
  });
  return { circular, circularFiles };
}
var MADGE_BATCH_CONCURRENCY = 6;
var MADGE_STATS_TARGET_CAP = 12;
var MADGE_STATS_TARGET_MIN_DURATION_MS = 100;
function isWithin(dir, target) {
  const rel = path.relative(dir, target);
  return rel !== "" && !rel.startsWith("..") && !path.isAbsolute(rel);
}
function classifyMadgeKind(resolved, managedToolsDir, projectRoot) {
  if (!isFullyQualified(resolved))
    return "path";
  if (isWithin(managedToolsDir, resolved))
    return "managed";
  if (isWithin(projectRoot, resolved))
    return "local";
  return "global";
}
async function resolvedCommandIsStale(resolved, spawnableCache) {
  if (resolved.kind === "npx")
    return false;
  if (isFullyQualified(resolved.cmd))
    return !fs.existsSync(resolved.cmd);
  const cached = spawnableCache.get(resolved.cmd);
  if (cached !== void 0)
    return !cached;
  const { isSpawnableCommand } = await import("./probes/installer.js");
  const spawnable = await isSpawnableCommand(resolved.cmd);
  spawnableCache.set(resolved.cmd, spawnable);
  return !spawnable;
}
var DependencyChecker = class _DependencyChecker {
  madgeAvailability = createAvailabilityChecker("madge", ".cmd", ["--version"], {
    environment: (cwd) => getManagedToolEnvironment("madge", cwd),
    unclassifiedFailureOutcome: "missing"
  });
  /** Transient-aware availability memo — see `ensureAvailable` (#1467). */
  availabilityLatch = createAvailabilityLatch();
  ensureInFlight = null;
  checkInFlight = /* @__PURE__ */ new Map();
  scanInFlight = /* @__PURE__ */ new Map();
  log;
  // Cache: file path -> its imports
  importCache = /* @__PURE__ */ new Map();
  // Circular deps: last known circular deps
  lastCircular = [];
  // Files that are part of a circular dependency
  circularFiles = /* @__PURE__ */ new Set();
  // Newest-classification-wins guard over the two fields above — see the
  // cross-operation contract on `checkFilesBatch`.
  opGeneration = 0;
  stateGeneration = 0;
  // projectRoot -> resolved madge command
  madgeCommand = /* @__PURE__ */ new Map();
  // Bare command -> last-known spawnability (#1276 revalidation, P2 fix). A
  // cache hit on `madgeCommand` used to re-run `isSpawnableCommand`'s
  // synchronous PATH walk on EVERY resolution — unbounded FS work on a path
  // that can run once per file in a batch. Memoized here instead, and
  // invalidated by the exact same `resetMadgeMemo()` call the madge-command
  // memo uses, so a madge removed/reinstalled mid-session is still detected
  // on the next resolution after an install completes.
  spawnableCache = /* @__PURE__ */ new Map();
  // #1276: every live checker registers itself so `resetMadgeManagedPathMemo`
  // (called from installer's `finishInstallAttempt`, mirroring
  // `resetSafeSpawnWindowsCommandCache`) can drop every instance's memo, not
  // just whichever one happened to run the install. Held via `WeakRef` (not a
  // strong `Set<DependencyChecker>`) so a checker that's no longer referenced
  // anywhere else (test/reinit instances; production only ever constructs one
  // in `bootstrap.ts`) can still be garbage-collected instead of being
  // retained for the rest of the process — dead refs are pruned lazily the
  // next time the registry is walked.
  static instances = /* @__PURE__ */ new Set();
  constructor(verbose = false) {
    this.log = verbose ? createSubsystemLogger("deps") : () => {
    };
    _DependencyChecker.instances.add(new WeakRef(this));
  }
  /** Drop this instance's memoized madge resolution for every project root. */
  resetMadgeMemo() {
    this.madgeCommand.clear();
    this.spawnableCache.clear();
  }
  /**
   * Reset hook for #1276: the madge managed-path memo is keyed only by
   * `projectRoot`, but the memoized resolution reads PATH/PATHEXT, local/
   * global tool discovery, and managed-install state — all of which a
   * completed install can change. Call this from `finishInstallAttempt()`
   * right alongside `resetSafeSpawnWindowsCommandCache()` so a mid-session
   * install is picked up instead of serving the pre-install answer for the
   * rest of the process.
   */
  static resetMadgeManagedPathMemo() {
    for (const ref of _DependencyChecker.instances) {
      const checker = ref.deref();
      if (!checker) {
        _DependencyChecker.instances.delete(ref);
        continue;
      }
      checker.resetMadgeMemo();
    }
  }
  /**
   * Resolve how to invoke madge for `projectRoot`: a project-local/global
   * binary (npm/pnpm/yarn/bun) if found, else whatever the installer already
   * has on disk, else `npx madge` (#375). `prefix` is prepended to the madge
   * args (empty for a resolved binary, `["madge"]` for the npx fallback).
   *
   * Memoized per project root: `findNodeToolBinary` falls through to
   * `npm config get prefix` / `pnpm bin -g` / `yarn global bin` spawns that
   * nothing caches, and this used to run once per file inside the batch
   * mapper (#766). The memo must not become one-way, though: resolution used
   * to re-probe on every spawn and so healed itself, and both escapes below
   * buy that back.
   */
  async resolveMadge(projectRoot) {
    const cached = this.madgeCommand.get(projectRoot);
    if (cached) {
      const resolved = await cached;
      if (!await resolvedCommandIsStale(resolved, this.spawnableCache))
        return resolved;
      const current = this.madgeCommand.get(projectRoot);
      if (current === cached) {
        this.madgeCommand.delete(projectRoot);
      } else {
        if (current)
          return current;
      }
    }
    const resolving = this.resolveUnlessNpx(projectRoot);
    this.madgeCommand.set(projectRoot, resolving);
    return resolving;
  }
  /**
   * Resolve, and drop the memo entry again if all we found was `npx` — pinning
   * it would pin precisely the slow path #766 removes, and a transient
   * installer failure would disable managed resolution for the whole session.
   * Callers already in flight still coalesce on this promise; only the next
   * one re-probes.
   */
  async resolveUnlessNpx(projectRoot) {
    const resolved = await this.doResolveMadge(projectRoot);
    if (resolved.kind === "npx")
      this.madgeCommand.delete(projectRoot);
    return resolved;
  }
  /**
   * `allowInstall: false` is load-bearing: discovery here must never trigger a
   * download, because installation is `ensureAvailable()`'s job and this runs
   * on the spawn path. Resolution also never rejects — a throwing probe would
   * otherwise poison the memo with a rejected promise for the whole session.
   */
  async doResolveMadge(projectRoot) {
    try {
      const { getManagedToolsDir } = await import("./probes/installer.js");
      const classify = (cmd) => ({
        cmd,
        prefix: [],
        kind: classifyMadgeKind(cmd, getManagedToolsDir(), projectRoot)
      });
      const bin = await findNodeToolBinary("madge", projectRoot);
      if (bin)
        return classify(bin);
      const discovered = await discoverManagedTool("madge");
      if (discovered)
        return classify(discovered);
    } catch (err) {
      this.log(`Madge resolution failed, falling back to npx: ${String(err)}`);
    }
    return { cmd: "npx", prefix: ["madge"], kind: "npx" };
  }
  /**
   * Apply a circular-dep state update on behalf of the operation that took
   * generation `gen`. See the cross-operation contract on `checkFilesBatch`:
   * an operation that classified EARLIER but finished later carries a smaller
   * generation, and its write is dropped rather than resurrecting its stale
   * view over newer state.
   */
  publishState(gen, circular, circularFiles) {
    if (gen < this.stateGeneration)
      return;
    this.stateGeneration = gen;
    this.lastCircular = circular;
    this.circularFiles = circularFiles;
  }
  /**
   * Check if madge is available, auto-install if not.
   *
   * Shares knip's latch policy (#1467): only a durable verdict is memoized, so
   * a probe that timed out — madge's `--version` is ~0.7 s today, but a host
   * event-loop stall can expire any budget — does not disable madge for the
   * life of the process.
   */
  async ensureAvailable(cwd = process.cwd()) {
    const memo = this.availabilityLatch.read();
    if (memo !== null)
      return memo;
    if (this.ensureInFlight)
      return this.ensureInFlight;
    this.ensureInFlight = this.doEnsureAvailable(cwd);
    try {
      return await this.ensureInFlight;
    } finally {
      this.ensureInFlight = null;
    }
  }
  async doEnsureAvailable(cwd) {
    const resolved = await resolveAvailableOrInstall(this.madgeAvailability, "madge", cwd);
    if (resolved !== null) {
      this.availabilityLatch.noteAvailable();
      return true;
    }
    const verdict = this.madgeAvailability.getVerdict(cwd);
    this.availabilityLatch.noteUnavailable(verdict.outcome ?? "missing", verdict.cause ?? "not-found");
    return false;
  }
  /**
   * #1623: public availability verdict for callers outside the dispatch
   * graph (mode=full's fresh-fetch) that need to say WHY `ensureAvailable()`
   * most recently returned false, using the SAME outcome/cause this class
   * already latched above — not a re-guessed "madge binary unavailable"
   * that can't tell a transient retry-cooldown probe from a durable
   * absence.
   */
  getAvailabilityVerdict() {
    return {
      outcome: this.availabilityLatch.getOutcome(),
      cause: this.availabilityLatch.getCause(),
      retryAtMs: this.availabilityLatch.getRetryAtMs()
    };
  }
  /**
   * Check if a file is part of a circular dependency (from cache)
   */
  isInCircular(filePath) {
    const normalized = path.resolve(filePath);
    return this.circularFiles.has(normalized);
  }
  /**
   * Get circular deps for a specific file
   */
  getCircularForFile(filePath) {
    const normalized = path.resolve(filePath);
    const deps = [];
    for (const dep of this.lastCircular) {
      if (dep.file === normalized || dep.path.includes(normalized)) {
        for (const f of dep.path) {
          if (f !== normalized) {
            deps.push(path.relative(process.cwd(), f));
          }
        }
      }
    }
    return Array.from(new Set(deps));
  }
  /**
   * Extract imports from a TypeScript/JavaScript file
   */
  extractImports(filePath) {
    const content = fs.readFileSync(filePath, "utf-8");
    const imports = /* @__PURE__ */ new Set();
    const importPattern = /(?:import|export)\s+(?:.*?\s+from\s+)?['"]([^'"]+)['"]/g;
    const requirePattern = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    let match;
    while ((match = importPattern.exec(content)) !== null) {
      if (match[1].startsWith(".")) {
        imports.add(match[1]);
      }
    }
    while ((match = requirePattern.exec(content)) !== null) {
      if (match[1].startsWith(".")) {
        imports.add(match[1]);
      }
    }
    return imports;
  }
  /**
   * Check if imports have changed for a file
   */
  importsChanged(filePath) {
    const normalized = path.resolve(filePath);
    if (!fs.existsSync(normalized)) {
      this.importCache.delete(normalized);
      return true;
    }
    const stat = fs.statSync(normalized);
    const cached = this.importCache.get(normalized);
    if (cached && cached.timestamp >= stat.mtimeMs && cached.size === stat.size) {
      return false;
    }
    const newImports = this.extractImports(normalized);
    const hasChanged = !cached || !this.setsEqual(cached.imports, newImports);
    this.importCache.set(normalized, {
      imports: newImports,
      timestamp: stat.mtimeMs,
      size: stat.size
    });
    return hasChanged;
  }
  /**
   * Check if two sets have the same elements
   */
  setsEqual(a, b) {
    if (a.size !== b.size)
      return false;
    for (const item of a) {
      if (!b.has(item))
        return false;
    }
    return true;
  }
  /**
   * Quick circular dependency check using DFS on cached graph.
   * Only re-runs full madge check when imports change.
   */
  async checkFile(filePath, cwd) {
    const normalized = path.resolve(filePath);
    if (!fs.existsSync(normalized)) {
      return {
        hasCircular: false,
        circular: [],
        checked: false,
        cacheHit: false
      };
    }
    const projectRoot = path.resolve(cwd || process.cwd());
    const importsChanged = this.importsChanged(normalized);
    if (!importsChanged) {
      return {
        hasCircular: this.circularFiles.has(normalized),
        circular: this.lastCircular.filter((d) => d.file === normalized || d.path.includes(normalized)),
        checked: true,
        cacheHit: true
      };
    }
    const gen = ++this.opGeneration;
    if (!await this.ensureAvailable(projectRoot)) {
      return {
        hasCircular: false,
        circular: [],
        checked: false,
        cacheHit: false
      };
    }
    const key = `${projectRoot}:${normalized}`;
    const existing = this.checkInFlight.get(key);
    if (existing)
      return existing;
    const promise = this.runCheckFile(normalized, projectRoot, gen).finally(() => {
      if (this.checkInFlight.get(key) === promise) {
        this.checkInFlight.delete(key);
      }
    });
    this.checkInFlight.set(key, promise);
    return promise;
  }
  async runCheckFile(normalized, projectRoot, gen) {
    const resolved = await this.resolveMadge(projectRoot);
    const spawnResult = await this.runMadgeSpawn(normalized, projectRoot, resolved);
    if (!spawnResult.ok) {
      return {
        hasCircular: false,
        circular: [],
        checked: false,
        cacheHit: false
      };
    }
    this.publishState(gen, spawnResult.circular, spawnResult.circularFiles);
    return {
      hasCircular: spawnResult.circular.length > 0,
      circular: spawnResult.circular.filter((d) => d.file === normalized || d.path.includes(normalized)),
      checked: true,
      cacheHit: false
    };
  }
  /**
   * Run madge on a single file and parse its cycle output. Pure: unlike
   * `runCheckFile`, this does NOT mutate `lastCircular`/`circularFiles` — it
   * hands the parsed result back so callers can apply the shared-state update
   * themselves (`runCheckFile` does so immediately; `checkFilesBatch` defers
   * it so concurrent spawns can't clobber each other's writes, see #766).
   */
  async runMadgeSpawn(normalized, projectRoot, { cmd, prefix }) {
    this.log(`Imports changed for ${path.basename(normalized)}, checking dependencies...`);
    try {
      const result = await safeSpawnAsync(cmd, [...prefix, ...buildMadgeArgs(normalized, projectRoot)], {
        timeout: 15e3,
        // A cache-only npx fallback must not read the project's `.npmrc`
        // (#4268 acceptance 3); a resolved madge keeps the project cwd.
        cwd: projectRoot,
        ...cmd === "npx" ? getIsolatedNpxSpawnOptions() : {}
      });
      if (result.error) {
        this.log(`Check error: ${result.error.message}`);
        return { ok: false };
      }
      const { circular, circularFiles } = parseMadgeCycles(result.stdout || "", path.dirname(normalized), projectRoot);
      return {
        ok: true,
        circular,
        circularFiles
      };
    } catch (err) {
      this.log(`Check error: ${err.message}`);
      return { ok: false };
    }
  }
  /** Build the cache-hit `DepCheckResult` for `normalized` from a state snapshot. */
  buildCachedResult(normalized, circular, circularFiles) {
    return {
      hasCircular: circularFiles.has(normalized),
      circular: circular.filter((d) => d.file === normalized || d.path.includes(normalized)),
      checked: true,
      cacheHit: true
    };
  }
  /**
   * Batch-check multiple files for circular deps in one turn-end pass,
   * running the madge subprocess spawns concurrently (bounded by
   * `MADGE_BATCH_CONCURRENCY`) instead of one at a time (#766).
   *
   * `lastCircular`/`circularFiles` are shared instance state that every madge
   * run OVERWRITES wholesale, so ordering has to be pinned on two axes.
   *
   * WITHIN a batch — equivalence with the sequential `for…await
   * checkFile(file)` loop this replaces:
   *  - Classification (existence + `importsChanged`) runs synchronously in
   *    original array order first — identical to what each sequential
   *    `checkFile()` call would do, including the `importCache` side effect.
   *  - Only the actual madge spawns for import-changed ("miss") files run
   *    concurrently; each one's parsed result stays LOCAL (no shared-state
   *    write) until every spawn has settled.
   *  - The miss results are then folded in ORIGINAL array order (not
   *    completion order) into a BATCH-LOCAL copy of the state, so each
   *    cache-hit file's result reads the state as of its own position in the
   *    array — byte-for-byte what the sequential last-write-wins loop
   *    returned. The fold is synchronous, so the instance-state write is one
   *    atomic assignment at the end; no concurrent spawn can interleave into
   *    it, and the returned map is unaffected by whether that write survives
   *    the rule below.
   *
   * ACROSS operations — newest classification wins:
   *  - `checkFile`, `checkFilesBatch` and `scanProject` all write the same
   *    shared state and genuinely overlap (turn-end vs. the background scans
   *    in runtime-session and project-diagnostics/fresh-fetch). Each takes a
   *    generation when it classifies, and `publishState` drops a write whose
   *    generation is no longer the newest — so an operation that started
   *    against OLDER file content cannot resurrect that view over a newer
   *    operation that already published, whatever order the spawns finish in.
   *  - ONLY the shared-state write is gated. Every per-file result handed back
   *    to the caller is built from that file's own spawn output, so a dropped
   *    publish never fabricates or hides a cycle for the caller.
   *  - No result cache is introduced (#533, "when in doubt, re-run"): changed
   *    content still re-runs madge every time, and the guard only skips writes
   *    that a newest-wins sequential interleaving would also have discarded.
   */
  async checkFilesBatch(filePaths, cwd) {
    const projectRoot = path.resolve(cwd || process.cwd());
    const results = /* @__PURE__ */ new Map();
    const gen = ++this.opGeneration;
    const entries = [];
    for (const file of filePaths) {
      const normalized = path.resolve(projectRoot, file);
      if (!fs.existsSync(normalized)) {
        entries.push({ kind: "missing", file });
        continue;
      }
      entries.push(this.importsChanged(normalized) ? { kind: "miss", file, normalized } : { kind: "hit", file, normalized });
    }
    const missEntries = entries.filter((e) => e.kind === "miss");
    const notAvailableResult = {
      hasCircular: false,
      circular: [],
      checked: false,
      cacheHit: false
    };
    const stats = {
      requested: filePaths.length,
      missing: entries.filter((e) => e.kind === "missing").length,
      cacheHits: entries.filter((e) => e.kind === "hit").length,
      spawned: 0,
      failed: 0,
      resolveMs: 0,
      targets: [],
      targetsTruncated: false
    };
    if (missEntries.length > 0 && !await this.ensureAvailable(projectRoot)) {
      stats.failed = missEntries.length;
      for (const entry of entries) {
        if (entry.kind === "hit") {
          results.set(entry.file, this.buildCachedResult(entry.normalized, this.lastCircular, this.circularFiles));
        } else {
          results.set(entry.file, notAvailableResult);
        }
      }
      return { results, stats };
    }
    const spawnResults = /* @__PURE__ */ new Map();
    const spawnDurations = /* @__PURE__ */ new Map();
    if (missEntries.length > 0) {
      const resolveStart = Date.now();
      const resolved = await this.resolveMadge(projectRoot);
      stats.resolveMs = Date.now() - resolveStart;
      stats.commandKind = resolved.kind;
      await mapWithConcurrency(missEntries, MADGE_BATCH_CONCURRENCY, async (entry) => {
        stats.spawned++;
        const startedAt = Date.now();
        spawnResults.set(entry.normalized, await this.runMadgeSpawn(entry.normalized, projectRoot, resolved));
        spawnDurations.set(entry.normalized, Date.now() - startedAt);
      });
    }
    let foldedCircular = this.lastCircular;
    let foldedCircularFiles = this.circularFiles;
    let folded = false;
    for (const entry of entries) {
      if (entry.kind === "missing") {
        results.set(entry.file, notAvailableResult);
        continue;
      }
      if (entry.kind === "hit") {
        results.set(entry.file, this.buildCachedResult(entry.normalized, foldedCircular, foldedCircularFiles));
        continue;
      }
      const spawnResult = spawnResults.get(entry.normalized);
      const durationMs = spawnDurations.get(entry.normalized) ?? 0;
      if (durationMs >= MADGE_STATS_TARGET_MIN_DURATION_MS && stats.targets.length < MADGE_STATS_TARGET_CAP) {
        stats.targets.push({
          file: path.relative(projectRoot, entry.normalized),
          durationMs,
          ok: spawnResult?.ok === true
        });
      } else if (durationMs >= MADGE_STATS_TARGET_MIN_DURATION_MS) {
        stats.targetsTruncated = true;
      }
      if (!spawnResult || !spawnResult.ok) {
        stats.failed++;
        results.set(entry.file, notAvailableResult);
        continue;
      }
      foldedCircular = spawnResult.circular;
      foldedCircularFiles = spawnResult.circularFiles;
      folded = true;
      results.set(entry.file, {
        hasCircular: spawnResult.circular.length > 0,
        circular: spawnResult.circular.filter((d) => d.file === entry.normalized || d.path.includes(entry.normalized)),
        checked: true,
        cacheHit: false
      });
    }
    if (folded) {
      this.publishState(gen, foldedCircular, foldedCircularFiles);
    }
    return { results, stats };
  }
  /**
   * Format circular dependency warning for LLM
   */
  formatWarning(filePath, deps) {
    if (deps.length === 0)
      return "";
    const filename = path.basename(filePath);
    const depNames = deps.map((d) => path.basename(d));
    let output = `[Circular Deps] ${filename} is in a cycle:
`;
    output += `  ${filename} \u2194 ${depNames.join(", ")}
`;
    output += `
  Consider extracting shared code to a separate module.
`;
    return output;
  }
  /**
   * Full project scan (for /check-deps command)
   */
  async scanProject(cwd) {
    const projectRoot = path.resolve(cwd || process.cwd());
    if (!fs.existsSync(projectRoot)) {
      return { circular: [], count: 0 };
    }
    const entries = fs.readdirSync(projectRoot);
    const hasSourceFiles = entries.some((e) => /\.(ts|tsx|js|jsx)$/.test(e) && !e.endsWith(".d.ts"));
    if (!hasSourceFiles) {
      return { circular: [], count: 0 };
    }
    if (!await this.ensureAvailable(projectRoot)) {
      return { circular: [], count: 0 };
    }
    const existing = this.scanInFlight.get(projectRoot);
    if (existing)
      return existing;
    const gen = ++this.opGeneration;
    const promise = this.runScanProject(projectRoot, gen).finally(() => {
      if (this.scanInFlight.get(projectRoot) === promise) {
        this.scanInFlight.delete(projectRoot);
      }
    });
    this.scanInFlight.set(projectRoot, promise);
    return promise;
  }
  async runScanProject(projectRoot, gen) {
    const scannedAt = (/* @__PURE__ */ new Date()).toISOString();
    try {
      const { cmd, prefix } = await this.resolveMadge(projectRoot);
      const result = await safeSpawnAsync(cmd, [...prefix, ...buildMadgeArgs(projectRoot, projectRoot)], {
        timeout: 3e4,
        // A cache-only npx fallback must not read the project's `.npmrc`
        // (#4268 acceptance 3); a resolved madge keeps the project cwd.
        cwd: projectRoot,
        ...cmd === "npx" ? getIsolatedNpxSpawnOptions() : {}
      });
      if (result.error) {
        this.log(`Scan error: ${result.error.message}`);
        return { circular: [], count: 0 };
      }
      const { circular, circularFiles } = parseMadgeCycles(result.stdout || "", projectRoot, projectRoot);
      this.publishState(gen, circular, circularFiles);
      return { circular, count: circular.length, analyzed: true, scannedAt };
    } catch (err) {
      this.log(`Scan error: ${err.message}`);
      return { circular: [], count: 0 };
    }
  }
  /**
   * Format full scan results
   */
  formatScanResult(circular) {
    if (circular.length === 0)
      return "";
    const seen = /* @__PURE__ */ new Set();
    let output = `[Circular Deps] ${circular.length} cycle(s) found:
`;
    for (const dep of circular) {
      const cycleKey = [...dep.path].sort(compareOrdinal).join("\u2192");
      if (seen.has(cycleKey))
        continue;
      seen.add(cycleKey);
      const names = dep.path.map((p) => path.relative(process.cwd(), p));
      output += `  \u2022 ${names.join(" \u2192 ")}
`;
    }
    output += "\n  Consider extracting shared code to break cycles.\n";
    return output;
  }
};
function resetMadgeManagedPathMemo() {
  DependencyChecker.resetMadgeManagedPathMemo();
}

export {
  buildMadgeArgs,
  DependencyChecker,
  resetMadgeManagedPathMemo
};
