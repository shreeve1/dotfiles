/**
 * Host-neutral analysis facade for the MCP path.
 *
 * This is the heart of the "real review loop": it runs the *same* per-edit
 * dispatch pipeline pi-lens runs inside pi (`dispatchLintWithResult`) on a file,
 * and returns a structured, JSON-serializable result — diagnostics plus the
 * latency record for that dispatch, in the same schema pi writes to latency.log.
 *
 * Because the only host coupling is `getFlag` (see host-shim), this runs with no
 * pi process: an MCP server (or a `fresh` worker importing the freshly-built
 * dist) can drive it directly, letting Claude observe a commit's real behavioral
 * + perf impact first-hand rather than inferring it from pasted logs.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { CacheManager, MCP_TURN_STATE_OWNER_ID } from "../cache-manager.js";
import { CASCADE_GRAPH_KINDS, dispatchLintWithResult, getLatencyReports, } from "../dispatch/integration.js";
import { FactStore } from "../dispatch/fact-store.js";
import { detectFileKind } from "../file-kinds.js";
import { getDiagnosticTracker } from "../diagnostic-tracker.js";
import { getLSPService } from "../lsp/index.js";
import { PathKeyedMap } from "../path-keyed-map.js";
import { normalizeMapKey } from "../path-utils.js";
import { loadProjectSnapshot } from "../project-snapshot.js";
import { buildOrUpdateGraph } from "../review-graph/service.js";
import { recordDiagnostics } from "../widget-state.js";
import { deserializeWordIndex, removeWordIndexDocument, scheduleWordIndexPersist, updateWordIndexDocument, WORD_INDEX_MAX_BYTES, } from "../word-index.js";
import { logWordIndex } from "../word-index-logger.js";
import { createMcpHost } from "./host-shim.js";
// #536: module-scoped FactStore for the warm-analyze graph seam, mirroring the
// per-edit cascade path's own module-level `sessionFacts` singleton
// (clients/dispatch/integration.ts) — buildOrUpdateGraph's incremental/cached
// tiers key off a stable FactStore instance across calls, so a fresh FactStore
// per call would defeat that reuse. Scoped separately from integration.ts's
// singleton since this file has no dependency on that module's internal state.
const warmGraphFacts = new FactStore();
// #536 rider (issue body: "when #348 phase 2 lands, the word-index per-edit
// update should ride the SAME seam so both indexes stay warm together"):
// MCP has no RuntimeCoordinator/`runtime.wordIndex` to hold a live index the
// way pi's per-edit seam does (clients/dispatch/integration.ts's
// `updateWordIndexForCascade`, called from clients/runtime-tool-result.ts with
// `runtime.wordIndex`) — this process-scoped Map is the MCP-side equivalent: a
// per-cwd live WordIndex, loaded once from the persisted snapshot and mutated
// in place thereafter, mirroring `runtime.wordIndex`'s lifecycle for a process
// that has no other place to hold it. `undefined` cached value = "checked,
// nothing usable" (index missing or pre-phase-2/no-forward-map), distinct from
// "never checked" (key absent) — avoids re-attempting a snapshot load with no
// forward index on every single analyze call.
const DEFAULT_WORD_INDEX_IDLE_EVICT_MS = 20 * 60_000;
const DEFAULT_WORD_INDEX_MAX_WARM_ROOTS = 8;
const warmWordIndexes = new PathKeyedMap(normalizeMapKey);
function positiveEnv(name, fallback) {
    const parsed = Number.parseInt(process.env[name] ?? "", 10);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}
function idleEvictMs() {
    return positiveEnv("PI_LENS_WORD_INDEX_IDLE_EVICT_MS", DEFAULT_WORD_INDEX_IDLE_EVICT_MS);
}
function maxWarmRoots() {
    return positiveEnv("PI_LENS_WORD_INDEX_MAX_WARM_ROOTS", DEFAULT_WORD_INDEX_MAX_WARM_ROOTS);
}
function clearWarmWordIndexTimer(entry) {
    if (entry.timer)
        clearTimeout(entry.timer);
    entry.timer = undefined;
}
function evictWarmWordIndex(key, entry, reason) {
    if (entry.leases > 0 || warmWordIndexes.get(key) !== entry)
        return false;
    clearWarmWordIndexTimer(entry);
    warmWordIndexes.delete(key);
    logWordIndex({
        phase: "warm_cache_evicted",
        cwd: key,
        trigger: "mcp",
        reason,
    });
    return true;
}
function scheduleWarmWordIndexIdleEviction(key, entry) {
    clearWarmWordIndexTimer(entry);
    const generation = ++entry.generation;
    const timer = setTimeout(() => {
        entry.timer = undefined;
        if (warmWordIndexes.get(key) !== entry || entry.generation !== generation)
            return;
        if (!evictWarmWordIndex(key, entry, "idle"))
            scheduleWarmWordIndexIdleEviction(key, entry);
    }, idleEvictMs());
    timer.unref?.();
    entry.timer = timer;
}
function enforceWarmWordIndexLruCap() {
    while (warmWordIndexes.size > maxWarmRoots()) {
        const victim = [...warmWordIndexes.entries()]
            .filter(([, entry]) => entry.leases === 0)
            .sort(([, a], [, b]) => a.lastUsedAt - b.lastUsedAt)[0];
        if (!victim || !evictWarmWordIndex(victim[0], victim[1], "lru"))
            return;
    }
}
/**
 * Look up (loading from the persisted snapshot on first use per cwd) the warm
 * in-memory word index this analyze facade keeps mutated in place. Exported so
 * `symbolSearch()` (clients/lens-engine.ts) can prefer this live copy over a
 * fresh disk read when one exists for the cwd — otherwise a query immediately
 * following a warm `pilens_analyze` call in the SAME process would read a
 * stale on-disk snapshot until the debounced persist (default 1500ms) flushes.
 */
export function acquireWarmWordIndex(cwd) {
    const key = path.resolve(cwd);
    let entry = warmWordIndexes.get(key);
    if (!entry) {
        const snapshot = loadProjectSnapshot(key);
        const index = deserializeWordIndex(snapshot?.wordIndex) ?? undefined;
        entry = {
            index: index?.forward ? index : undefined,
            timer: undefined,
            leases: 0,
            lastUsedAt: Date.now(),
            generation: 0,
        };
        warmWordIndexes.set(key, entry);
    }
    entry.leases++;
    entry.lastUsedAt = Date.now();
    scheduleWarmWordIndexIdleEviction(key, entry);
    enforceWarmWordIndexLruCap();
    let released = false;
    return {
        index: entry.index,
        release() {
            if (released)
                return;
            released = true;
            entry.leases = Math.max(0, entry.leases - 1);
            entry.lastUsedAt = Date.now();
            if (warmWordIndexes.get(key) === entry) {
                scheduleWarmWordIndexIdleEviction(key, entry);
                enforceWarmWordIndexLruCap();
            }
        },
    };
}
/**
 * Test-only reset — the module-level warm cache otherwise survives across
 * unrelated test cases in the same vitest worker.
 */
export function _resetWarmWordIndexCacheForTests() {
    for (const entry of warmWordIndexes.values())
        clearWarmWordIndexTimer(entry);
    warmWordIndexes.clear();
}
export function _getWarmWordIndexCacheStateForTests() {
    return {
        size: warmWordIndexes.size,
        keys: [...warmWordIndexes.keys()],
        timers: [...warmWordIndexes.values()].flatMap((entry) => entry.timer ? [entry.timer] : []),
    };
}
// Generous warm-up budgets: a cold language server needs to spawn AND publish
// diagnostics. The per-edit dispatch runner caps these tightly (spawn budget +
// 2500ms) for latency; a review tool prioritises completeness, so we pre-warm
// with room to spare, then the measured dispatch reads the warm cache.
// Bounded so a cold analysis can't hang: enough for fast servers (pyright,
// rust-analyzer, gopls) and a warm typescript-language-server, but NOT enough to
// fully load a large TS project from cold — that exceeds any per-call budget and
// is the persistent warm server's job (see the `lsp` honesty signal + Tier 2).
const WARMUP_CLIENT_WAIT_MS = 10_000;
const WARMUP_DIAGNOSTICS_WAIT_MS = 6_000;
function toMcpDiagnostic(diagnostic) {
    return {
        line: diagnostic.line,
        column: diagnostic.column,
        severity: diagnostic.severity,
        semantic: diagnostic.semantic,
        tool: diagnostic.tool,
        rule: diagnostic.rule,
        code: diagnostic.code,
        message: diagnostic.message,
        fixable: diagnostic.fixable,
        fixSuggestion: diagnostic.fixSuggestion,
    };
}
/**
 * Pre-warm the LSP for a file: spawn the server and wait for it to publish
 * diagnostics, so the subsequent dispatch reads a warm cache instead of a cold
 * (empty) one. Best-effort — failures never block the analysis.
 */
async function warmLspForFile(absPath, host) {
    if (host.getFlag("no-lsp"))
        return;
    const lspService = getLSPService();
    if (!lspService.supportsLSP(absPath))
        return;
    let content;
    try {
        content = fs.readFileSync(absPath, "utf8");
    }
    catch {
        return;
    }
    try {
        await lspService.touchFile(absPath, content, {
            diagnostics: "document",
            collectDiagnostics: true,
            clientScope: "primary",
            maxClientWaitMs: WARMUP_CLIENT_WAIT_MS,
            maxDiagnosticsWaitMs: WARMUP_DIAGNOSTICS_WAIT_MS,
            source: "mcp-warmup",
        });
    }
    catch {
        // Best-effort warm-up; the dispatch runner still tries on its own.
    }
}
/**
 * Run the dispatch pipeline on `filePath` and return a structured result.
 *
 * Unlike pi's per-edit path this defaults to the *full* analysis (warnings +
 * structural smells, not just blocking errors), pre-warms the LSP so a cold
 * server doesn't under-report, records into the session diagnostic state so the
 * query tools compose, and runs delta-free so a repeated analysis of an
 * unchanged file is a consistent full snapshot rather than "new issues only".
 *
 * The latency report is matched against the dispatches appended *during this
 * call* (we snapshot the report count first), so concurrent callers don't pick
 * up each other's timings.
 */
export async function analyzeFile(filePath, cwd, options = {}) {
    const absPath = path.isAbsolute(filePath)
        ? filePath
        : path.resolve(cwd, filePath);
    // no-delta by default → a full snapshot every call (not delta-filtered);
    // caller flags win over the default.
    const host = createMcpHost({ "no-delta": true, ...(options.flags ?? {}) }, cwd);
    if (options.warmLsp !== false) {
        await warmLspForFile(absPath, host);
    }
    const reportsBefore = getLatencyReports().length;
    const start = Date.now();
    // No telemetryModel/telemetryProvider here (#1448): this MCP facade has no
    // RuntimeCoordinator to hold a host-reported identity (see the module doc
    // above), so any worklog entries this dispatch produces get a blank
    // model/provider — that's correct, not a gap.
    const result = await dispatchLintWithResult(absPath, cwd, host, undefined, undefined, {
        blockingOnly: options.blockingOnly ?? false,
    });
    const durationMs = Date.now() - start;
    if (options.record !== false) {
        // Mirror pipeline.ts's recording so pilens_diagnostics (mode=all) and
        // pilens_health see what this analysis found.
        recordDiagnostics(absPath, result.diagnostics);
        if (result.diagnostics.length > 0) {
            getDiagnosticTracker().trackShown(result.diagnostics);
        }
    }
    if (options.registerTurnState) {
        // Full-file range, importsChanged=true (conservative → dep/knip re-check
        // broadly). Clear any stale pi session ID because the MCP Stop route owns
        // this workspace-scoped worklist independently. Best-effort.
        try {
            const lineCount = fs.readFileSync(absPath, "utf8").split("\n").length;
            new CacheManager().addModifiedRange(absPath, { start: 1, end: lineCount }, true, cwd, options.ownerId ?? MCP_TURN_STATE_OWNER_ID, "mcp");
        }
        catch {
            // unreadable — skip turn-state registration
        }
    }
    if (options.updateGraph && !result.hasBlockers) {
        // #536: maintain the review graph on a successful warm analysis — the same
        // call pi's per-edit cascade path makes (computeCascadeForFile), gated the
        // same way (CASCADE_GRAPH_KINDS: only languages the graph actually models,
        // and skipped when the file has blockers, matching the cascade path's own
        // "primary_has_blockers" skip). buildOrUpdateGraph owns its own debounced
        // persist + seq machinery internally — this is the ONLY call needed; no
        // separate persist/flush step. Best-effort: a graph build failure must
        // never fail the analysis itself (the diagnostics are already computed).
        const fileKind = detectFileKind(absPath);
        if (fileKind && CASCADE_GRAPH_KINDS.has(fileKind)) {
            try {
                await buildOrUpdateGraph(cwd, [absPath], warmGraphFacts);
            }
            catch {
                // Best-effort — the graph update is additive; a failure here must not
                // surface as an analyze failure.
            }
        }
        // #536 rider: ride the SAME seam for the word index (#348 phase 2's
        // per-edit primitive), mirroring pi's `updateWordIndexForCascade`
        // (clients/dispatch/integration.ts) rule-for-rule rather than reusing it
        // directly — that function is module-private and reads its file-content
        // argument from the pipeline's already-read buffer, whereas this seam
        // reads the file itself (no pipeline hook here). Same rules: a cached
        // index with no `forward` map (or none loaded) ⇒ no-op (no incremental
        // primitive available — the eventual full rebuild covers it); an
        // oversized file is REMOVED, never partially indexed; the update is
        // synchronous (no interleaving hazard — MCP is single-process, same as
        // pi); a successful update schedules the SAME debounced persist
        // (`scheduleWordIndexPersist`, `PI_LENS_WORD_INDEX_PERSIST_DEBOUNCE_MS`)
        // pi's path uses — no second persist mechanism.
        //
        // Key shape: `absPath` (`path.resolve` of the tool-input path). Since #1025
        // the word index's path maps fold every key through `wordIndexKey`
        // INTERNALLY (PathKeyedMap), so this edit-form key and the build path's
        // walk-derived key converge on the same entry regardless of casing/
        // separator — the old duplicate-orphan hazard is gone at the map layer.
        const warmLease = acquireWarmWordIndex(cwd);
        const warmIndex = warmLease.index;
        try {
            if (warmIndex) {
                try {
                    const content = fs.readFileSync(absPath, "utf8");
                    const byteLength = Buffer.byteLength(content, "utf-8");
                    if (byteLength > WORD_INDEX_MAX_BYTES) {
                        removeWordIndexDocument(warmIndex, absPath);
                    }
                    else {
                        updateWordIndexDocument(warmIndex, { path: absPath, content });
                    }
                    scheduleWordIndexPersist(cwd, warmIndex);
                }
                catch {
                    // unreadable/deleted, or an update failure — best-effort, same as the
                    // graph update above.
                }
            }
        }
        finally {
            warmLease.release();
        }
    }
    // dispatchForFile appended a latency report during the call above. Match the
    // newly-added report for this exact path; fall back to the most recent new
    // report if the path normalization differs.
    const newReports = getLatencyReports().slice(reportsBefore);
    const latencyReport = newReports.find((report) => path.resolve(report.filePath) === absPath) ??
        newReports[newReports.length - 1];
    const lspRunner = latencyReport?.runners.find((runner) => runner.runnerId === "lsp");
    const lsp = lspRunner
        ? {
            ran: lspRunner.status !== "skipped" && lspRunner.status !== "when_skipped",
            status: lspRunner.status,
            diagnosticCount: lspRunner.diagnosticCount,
            durationMs: lspRunner.durationMs,
        }
        : undefined;
    return {
        filePath: absPath,
        cwd,
        fileKind: latencyReport?.fileKind,
        durationMs,
        hasBlockers: result.hasBlockers,
        counts: {
            diagnostics: result.diagnostics.length,
            blockers: result.blockers.length,
            warnings: result.warnings.length,
            fixed: result.fixed.length,
        },
        lsp,
        diagnostics: result.diagnostics.map(toMcpDiagnostic),
        latency: latencyReport
            ? {
                totalDurationMs: latencyReport.totalDurationMs,
                stoppedEarly: latencyReport.stoppedEarly,
                runners: latencyReport.runners.map((runner) => ({
                    runnerId: runner.runnerId,
                    durationMs: runner.durationMs,
                    status: runner.status,
                    diagnosticCount: runner.diagnosticCount,
                })),
            }
            : undefined,
    };
}
