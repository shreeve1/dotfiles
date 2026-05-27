/**
 * agent-manager.ts — Tracks agents, background execution, resume support.
 *
 * Background agents are subject to a configurable concurrency limit (default: 4).
 * Excess agents are queued and auto-started as running agents complete.
 * Foreground agents bypass the queue (they block the parent anyway).
 */
import { randomUUID } from "node:crypto";
import { resumeAgent, runAgent } from "./agent-runner.js";
import { addUsage } from "./usage.js";
import { cleanupWorktree, createWorktree, pruneWorktrees, } from "./worktree.js";
/** Default max concurrent background agents. */
const DEFAULT_MAX_CONCURRENT = 4;
export class AgentManager {
    agents = new Map();
    cleanupInterval;
    onComplete;
    onStart;
    onCompact;
    maxConcurrent;
    /** Queue of background agents waiting to start. */
    queue = [];
    /** Number of currently running background agents. */
    runningBackground = 0;
    constructor(onComplete, maxConcurrent = DEFAULT_MAX_CONCURRENT, onStart, onCompact) {
        this.onComplete = onComplete;
        this.onStart = onStart;
        this.onCompact = onCompact;
        this.maxConcurrent = maxConcurrent;
        // Cleanup completed agents after 10 minutes (but keep sessions for resume)
        this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);
        this.cleanupInterval.unref();
    }
    /** Update the max concurrent background agents limit. */
    setMaxConcurrent(n) {
        this.maxConcurrent = Math.max(1, n);
        // Start queued agents if the new limit allows
        this.drainQueue();
    }
    getMaxConcurrent() {
        return this.maxConcurrent;
    }
    /**
     * Spawn an agent and return its ID immediately (for background use).
     * If the concurrency limit is reached, the agent is queued.
     */
    spawn(pi, ctx, type, prompt, options) {
        const id = randomUUID().slice(0, 17);
        const abortController = new AbortController();
        const record = {
            id,
            type,
            description: options.description,
            status: options.isBackground ? "queued" : "running",
            toolUses: 0,
            startedAt: Date.now(),
            abortController,
            lifetimeUsage: { input: 0, output: 0, cacheWrite: 0 },
            compactionCount: 0,
            invocation: options.invocation,
        };
        this.agents.set(id, record);
        const args = { pi, ctx, type, prompt, options };
        if (options.isBackground && !options.bypassQueue && this.runningBackground >= this.maxConcurrent) {
            // Queue it — will be started when a running agent completes
            this.queue.push({ id, args });
            return id;
        }
        // startAgent can throw (e.g. strict worktree-isolation failure) — clean
        // up the record so callers don't see an orphan in `listAgents()`.
        try {
            this.startAgent(id, record, args);
        }
        catch (err) {
            this.agents.delete(id);
            throw err;
        }
        return id;
    }
    /** Actually start an agent (called immediately or from queue drain). */
    startAgent(id, record, { pi, ctx, type, prompt, options }) {
        // Worktree isolation: try to create a temporary git worktree. Strict —
        // fail loud if not possible (no silent fallback to main tree). Done
        // BEFORE state mutation so a throw doesn't leave the record half-running.
        let worktreeCwd;
        if (options.isolation === "worktree") {
            const wt = createWorktree(ctx.cwd, id);
            if (!wt) {
                throw new Error('Cannot run with isolation: "worktree" — not a git repo, no commits yet, or `git worktree add` failed. ' +
                    'Initialize git and commit at least once, or omit `isolation`.');
            }
            record.worktree = wt;
            worktreeCwd = wt.path;
        }
        record.status = "running";
        record.startedAt = Date.now();
        if (options.isBackground)
            this.runningBackground++;
        this.onStart?.(record);
        // Wire parent abort signal to stop the subagent when the parent is interrupted
        let detachParentSignal;
        if (options.signal) {
            const onParentAbort = () => this.abort(id);
            options.signal.addEventListener("abort", onParentAbort, { once: true });
            detachParentSignal = () => options.signal.removeEventListener("abort", onParentAbort);
        }
        const detach = () => { detachParentSignal?.(); detachParentSignal = undefined; };
        const promise = runAgent(ctx, type, prompt, {
            pi,
            agentId: id,
            model: options.model,
            maxTurns: options.maxTurns,
            isolated: options.isolated,
            inheritContext: options.inheritContext,
            thinkingLevel: options.thinkingLevel,
            cwd: worktreeCwd,
            signal: record.abortController.signal,
            onToolActivity: (activity) => {
                if (activity.type === "end")
                    record.toolUses++;
                options.onToolActivity?.(activity);
            },
            onTurnEnd: options.onTurnEnd,
            onTextDelta: options.onTextDelta,
            onAssistantUsage: (usage) => {
                addUsage(record.lifetimeUsage, usage);
                options.onAssistantUsage?.(usage);
            },
            onCompaction: (info) => {
                record.compactionCount++;
                this.onCompact?.(record, info);
                options.onCompaction?.(info);
            },
            onSessionCreated: (session) => {
                record.session = session;
                // Flush any steers that arrived before the session was ready
                if (record.pendingSteers?.length) {
                    for (const msg of record.pendingSteers) {
                        session.steer(msg).catch(() => { });
                    }
                    record.pendingSteers = undefined;
                }
                options.onSessionCreated?.(session);
            },
        })
            .then(({ responseText, session, aborted, steered }) => {
            // Don't overwrite status if externally stopped via abort()
            if (record.status !== "stopped") {
                record.status = aborted ? "aborted" : steered ? "steered" : "completed";
            }
            record.result = responseText;
            record.session = session;
            record.completedAt ??= Date.now();
            detach();
            // Final flush of streaming output file
            if (record.outputCleanup) {
                try {
                    record.outputCleanup();
                }
                catch { /* ignore */ }
                record.outputCleanup = undefined;
            }
            // Clean up worktree if used
            if (record.worktree) {
                const wtResult = cleanupWorktree(ctx.cwd, record.worktree, options.description);
                record.worktreeResult = wtResult;
                if (wtResult.hasChanges && wtResult.branch) {
                    record.result = (record.result ?? "") +
                        `\n\n---\nChanges saved to branch \`${wtResult.branch}\`. Merge with: \`git merge ${wtResult.branch}\``;
                }
            }
            if (options.isBackground) {
                this.runningBackground--;
                try {
                    this.onComplete?.(record);
                }
                catch { /* ignore completion side-effect errors */ }
                this.drainQueue();
            }
            return responseText;
        })
            .catch((err) => {
            // Don't overwrite status if externally stopped via abort()
            if (record.status !== "stopped") {
                record.status = "error";
            }
            record.error = err instanceof Error ? err.message : String(err);
            record.completedAt ??= Date.now();
            detach();
            // Final flush of streaming output file on error
            if (record.outputCleanup) {
                try {
                    record.outputCleanup();
                }
                catch { /* ignore */ }
                record.outputCleanup = undefined;
            }
            // Best-effort worktree cleanup on error
            if (record.worktree) {
                try {
                    const wtResult = cleanupWorktree(ctx.cwd, record.worktree, options.description);
                    record.worktreeResult = wtResult;
                }
                catch { /* ignore cleanup errors */ }
            }
            if (options.isBackground) {
                this.runningBackground--;
                this.onComplete?.(record);
                this.drainQueue();
            }
            return "";
        });
        record.promise = promise;
    }
    /** Start queued agents up to the concurrency limit. */
    drainQueue() {
        while (this.queue.length > 0 && this.runningBackground < this.maxConcurrent) {
            const next = this.queue.shift();
            const record = this.agents.get(next.id);
            if (!record || record.status !== "queued")
                continue;
            try {
                this.startAgent(next.id, record, next.args);
            }
            catch (err) {
                // Late failure (e.g. strict worktree-isolation) — surface on the record
                // so the user/agent can see it via /agents, then keep draining.
                record.status = "error";
                record.error = err instanceof Error ? err.message : String(err);
                record.completedAt = Date.now();
                this.onComplete?.(record);
            }
        }
    }
    /**
     * Spawn an agent and wait for completion (foreground use).
     * Foreground agents bypass the concurrency queue.
     */
    async spawnAndWait(pi, ctx, type, prompt, options) {
        const id = this.spawn(pi, ctx, type, prompt, { ...options, isBackground: false });
        const record = this.agents.get(id);
        await record.promise;
        return record;
    }
    /**
     * Resume an existing agent session with a new prompt.
     */
    async resume(id, prompt, signal) {
        const record = this.agents.get(id);
        if (!record?.session)
            return undefined;
        record.status = "running";
        record.startedAt = Date.now();
        record.completedAt = undefined;
        record.result = undefined;
        record.error = undefined;
        try {
            const responseText = await resumeAgent(record.session, prompt, {
                onToolActivity: (activity) => {
                    if (activity.type === "end")
                        record.toolUses++;
                },
                onAssistantUsage: (usage) => {
                    addUsage(record.lifetimeUsage, usage);
                },
                onCompaction: (info) => {
                    record.compactionCount++;
                    this.onCompact?.(record, info);
                },
                signal,
            });
            record.status = "completed";
            record.result = responseText;
            record.completedAt = Date.now();
        }
        catch (err) {
            record.status = "error";
            record.error = err instanceof Error ? err.message : String(err);
            record.completedAt = Date.now();
        }
        return record;
    }
    getRecord(id) {
        return this.agents.get(id);
    }
    listAgents() {
        return [...this.agents.values()].sort((a, b) => b.startedAt - a.startedAt);
    }
    abort(id) {
        const record = this.agents.get(id);
        if (!record)
            return false;
        // Remove from queue if queued
        if (record.status === "queued") {
            this.queue = this.queue.filter(q => q.id !== id);
            record.status = "stopped";
            record.completedAt = Date.now();
            return true;
        }
        if (record.status !== "running")
            return false;
        record.abortController?.abort();
        record.status = "stopped";
        record.completedAt = Date.now();
        return true;
    }
    /** Dispose a record's session and remove it from the map. */
    removeRecord(id, record) {
        record.session?.dispose?.();
        record.session = undefined;
        this.agents.delete(id);
    }
    cleanup() {
        const cutoff = Date.now() - 10 * 60_000;
        for (const [id, record] of this.agents) {
            if (record.status === "running" || record.status === "queued")
                continue;
            if ((record.completedAt ?? 0) >= cutoff)
                continue;
            this.removeRecord(id, record);
        }
    }
    /**
     * Remove all completed/stopped/errored records immediately.
     * Called on session start/switch so tasks from a prior session don't persist.
     */
    clearCompleted() {
        for (const [id, record] of this.agents) {
            if (record.status === "running" || record.status === "queued")
                continue;
            this.removeRecord(id, record);
        }
    }
    /** Whether any agents are still running or queued. */
    hasRunning() {
        return [...this.agents.values()].some(r => r.status === "running" || r.status === "queued");
    }
    /** Abort all running and queued agents immediately. */
    abortAll() {
        let count = 0;
        // Clear queued agents first
        for (const queued of this.queue) {
            const record = this.agents.get(queued.id);
            if (record) {
                record.status = "stopped";
                record.completedAt = Date.now();
                count++;
            }
        }
        this.queue = [];
        // Abort running agents
        for (const record of this.agents.values()) {
            if (record.status === "running") {
                record.abortController?.abort();
                record.status = "stopped";
                record.completedAt = Date.now();
                count++;
            }
        }
        return count;
    }
    /** Wait for all running and queued agents to complete (including queued ones). */
    async waitForAll() {
        // Loop because drainQueue respects the concurrency limit — as running
        // agents finish they start queued ones, which need awaiting too.
        while (true) {
            this.drainQueue();
            const pending = [...this.agents.values()]
                .filter(r => r.status === "running" || r.status === "queued")
                .map(r => r.promise)
                .filter(Boolean);
            if (pending.length === 0)
                break;
            await Promise.allSettled(pending);
        }
    }
    dispose() {
        clearInterval(this.cleanupInterval);
        // Clear queue
        this.queue = [];
        for (const record of this.agents.values()) {
            record.session?.dispose();
        }
        this.agents.clear();
        // Prune any orphaned git worktrees (crash recovery)
        try {
            pruneWorktrees(process.cwd());
        }
        catch { /* ignore */ }
    }
}
