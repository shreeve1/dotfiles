/**
 * workflows: model-authored multi-agent orchestration.
 *
 * A `workflow` tool that runs a JavaScript orchestration script written inline
 * by the model. The script executes ordered phases, fanning work out to
 * isolated subagents:
 *
 *   export const meta = { name, description, phases: [{ title, detail? }] }
 *   phase(title)                                  // mark runtime phase progression
 *   await agent(prompt, { label?, phase?, schema?, model?, provider?, effort?, writable? })
 *   await parallel([() => agent(...), ...], { concurrency? })
 *   args                                          // parsed JSON args passed with the tool call
 *
 * `agent()` always resolves to `{ ok, output, structured?, error? }` — it
 * never throws into the script. Scripts branch on `ok` explicitly. `output`
 * holds the agent's final text on every outcome, `ok:false` included, so a
 * script can degrade to prose instead of discarding a result whose only fault
 * was skipping `structured_output`.
 *
 * Runs are blocking by default (live progress in the tool block). Pass
 * `background: true` to return immediately and get a follow-up message when
 * the run finishes. Run artifacts (script, args, statuses, result) are saved
 * under `~/.pi/agent/workflows/<runId>/` for inspection; result and bounded
 * transcripts use separate artifacts, and there is no resume.
 */

import { createHash, randomBytes } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  getAgentDir,
  getMarkdownTheme,
  keyHint,
  type ExtensionAPI,
  type ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import { Container, Markdown, Spacer, Text } from "@earendil-works/pi-tui";
import { Type, type Static } from "typebox";
import { formatActivityStatus } from "../shared/activity-status.ts";
import { createWorkflowPersistence, persistWorkflowJson } from "./artifacts.ts";
import { RunController } from "./controller.ts";
import { sessionWorkflowRunIds, showWorkflowDashboard } from "./dashboard.ts";
import {
  agentCallKey,
  appendJournalEntry,
  createReplayIndex,
  type AgentKeyContext,
} from "./journal.ts";
import {
  extractMeta,
  prepareWorkflowScript,
  type WorkflowMeta,
} from "./meta.ts";
import {
  agentContext,
  aggregateUsage,
  countStates,
  emptyUsage,
  formatElapsed,
  formatUsage,
  phaseGroups,
  resultJson,
  sortedAgents,
  stateSquare,
  statusColor,
  statusWord,
  SQUARE,
  type AgentRecord,
  type WorkflowDetails,
} from "./model.ts";
import {
  buildBackgroundWorkflowFollowUp,
  buildBackgroundWorkflowLaunchResult,
  buildWorkflowAgentPrompt,
  buildWorkflowResultMessage,
  WORKFLOW_PARAMETER_DESCRIPTIONS,
  WORKFLOW_PROMPT_GUIDELINES,
  WORKFLOW_PROMPT_SNIPPET,
  WORKFLOW_TOOL_DESCRIPTION,
} from "./prompt.ts";
import {
  createWorkflowResources,
  runAgent,
  type ThinkingLevel,
  type WorkflowModel,
} from "./runner.ts";
import { resolveStandaloneChildProjectTrust } from "../shared/child-session.ts";
import { prepareResume } from "./resume.ts";
import { resolveScriptSource } from "./script-source.ts";
import { runWorkflowSandbox } from "./sandbox.ts";
import { safeStringify, writeFileAtomic } from "./serialization.ts";

const PREVIEW_LENGTH = 200;
const EMIT_INTERVAL_MS = 120;

const THINKING_LEVELS = [
  "off",
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
  "max",
] as const;

/** What `agent()` resolves to inside the script. */
interface ScriptAgentResult {
  ok: boolean;
  output: string;
  structured?: unknown;
  error?: string;
}

interface AgentCallOptions {
  label?: unknown;
  phase?: unknown;
  schema?: unknown;
  model?: unknown;
  provider?: unknown;
  effort?: unknown;
  writable?: unknown;
  cwd?: unknown;
}

const WorkflowParams = Type.Object({
  script: Type.Optional(
    Type.String({
      description: WORKFLOW_PARAMETER_DESCRIPTIONS.script,
    }),
  ),
  scriptPath: Type.Optional(
    Type.String({
      description: WORKFLOW_PARAMETER_DESCRIPTIONS.scriptPath,
    }),
  ),
  args: Type.Optional(
    Type.String({
      description: WORKFLOW_PARAMETER_DESCRIPTIONS.args,
    }),
  ),
  background: Type.Optional(
    Type.Boolean({
      description: WORKFLOW_PARAMETER_DESCRIPTIONS.background,
    }),
  ),
  resume: Type.Optional(
    Type.String({
      description: WORKFLOW_PARAMETER_DESCRIPTIONS.resume,
    }),
  ),
});

type WorkflowInput = Static<typeof WorkflowParams>;

function errorText(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).slice(
    0,
    16 * 1024,
  );
}

/** Records a flush-failure after runScript() already committed details.status.
 *  Does not touch details.status — overwrites details.error with a typed
 *  prefix and rethrows so callers (blocking awaiter or background catch) see
 *  a tagged failure. Exported so the "do not clobber a truthful terminal
 *  status" invariant is regression-tested. */
export function recordFlushFailure(
  details: WorkflowDetails,
  error: unknown,
): never {
  details.error = `Artifact persistence failed: ${errorText(error)}`;
  throw new Error(details.error);
}

/** Records a background-run completion error. Preserves a truthful "completed"
 *  or "aborted" status; only marks "failed" when status never advanced past
 *  "running" (genuine mid-flight crash). Sets finishedAt and keeps any
 *  already-recorded error (e.g. the "Artifact persistence failed:" prefix
 *  set by recordFlushFailure). Exported so the === "running" guard is
 *  regression-tested. */
export function recordBackgroundRunFailure(
  details: WorkflowDetails,
  error: unknown,
): void {
  if (details.status === "running") details.status = "failed";
  details.finishedAt = Date.now();
  details.error = details.error ?? errorText(error);
}

export interface AgentCwdResolution {
  cwd: string;
  trusted: boolean;
}

/** Resolve a per-agent cwd and the trust that must accompany it. Exported so the
 * trust invariant is testable: an alternate cwd must never inherit the parent's
 * trust bit. Throws on a missing / non-directory cwd; the caller maps that to a
 * failed agent call. */
export function resolveAgentCwdAndTrust(options: {
  requested: unknown;
  parentCwd: string;
  parentTrusted: boolean;
  agentDir?: string;
}): AgentCwdResolution {
  const requestedCwd =
    typeof options.requested === "string" && options.requested.trim()
      ? options.requested.trim()
      : undefined;
  const resolvedCwd = requestedCwd
    ? path.resolve(options.parentCwd, requestedCwd)
    : options.parentCwd;
  let resolvedTrusted = options.parentTrusted;
  if (requestedCwd && resolvedCwd !== options.parentCwd) {
    let stat: fs.Stats;
    try {
      stat = fs.statSync(resolvedCwd);
    } catch {
      throw new Error(
        `cwd does not exist or is not a directory: ${resolvedCwd}`,
      );
    }
    if (!stat.isDirectory()) {
      throw new Error(`cwd is not a directory: ${resolvedCwd}`);
    }
    resolvedTrusted = resolveStandaloneChildProjectTrust({
      parentCwd: options.parentCwd,
      childCwd: resolvedCwd,
      parentTrusted: options.parentTrusted,
      ...(options.agentDir !== undefined ? { agentDir: options.agentDir } : {}),
    });
  }

  return { cwd: resolvedCwd, trusted: resolvedTrusted };
}

function summaryLine(details: WorkflowDetails): string {
  const { done, failed } = countStates(details);
  const settled = done + failed;
  return `workflow ${details.name ?? details.runId}: ${settled}/${details.agents.length} agents${
    details.currentPhase ? ` · ${details.currentPhase}` : ""
  }`;
}

function writeRunFile(runDir: string, name: string, content: string) {
  writeFileAtomic(path.join(runDir, name), content);
}

function compactToolDetails(details: WorkflowDetails): WorkflowDetails {
  return {
    ...details,
    ...(details.result !== undefined
      ? {
          result: JSON.parse(
            safeStringify(details.result, { maxBytes: 64 * 1024 }),
          ),
        }
      : {}),
    // Sorted view so the tool-block rendering sees index order even when
    // replayed records interleaved with executed records mid-run.
    agents: sortedAgents(details).map((agent) => ({
      ...agent,
      transcript: [],
    })),
  };
}

interface RunSummary {
  runId: string;
  name?: string;
  status: string;
  done: number;
  total: number;
  startedAt: number;
  active: boolean;
}

function listRuns(
  activeRuns: Map<string, WorkflowDetails>,
  sessionId: string,
  referencedRunIds: ReadonlySet<string>,
): RunSummary[] {
  const base = path.join(getAgentDir(), "workflows");
  let names: string[] = [];
  try {
    names = fs.readdirSync(base).filter((name) => name.startsWith("wf_"));
  } catch {
    // No runs yet.
  }
  const summaries: RunSummary[] = [];
  for (const runId of names) {
    const live = activeRuns.get(runId);
    if (live) {
      const { done, failed } = countStates(live);
      summaries.push({
        runId,
        name: live.name,
        status: live.status,
        done: done + failed,
        total: live.agents.length,
        startedAt: live.startedAt,
        active: true,
      });
      continue;
    }
    try {
      const parsed = JSON.parse(
        fs.readFileSync(path.join(base, runId, "workflow.json"), "utf8"),
      ) as Partial<WorkflowDetails>;
      if (parsed.sessionId !== sessionId && !referencedRunIds.has(runId)) {
        continue;
      }
      const agents = parsed.agents ?? [];
      summaries.push({
        runId,
        name: parsed.name,
        status:
          parsed.status === "running"
            ? "aborted"
            : (parsed.status ?? "unknown"),
        done: agents.filter((agent) => agent.state !== "running").length,
        total: agents.length,
        startedAt: parsed.startedAt ?? 0,
        active: false,
      });
    } catch {
      // Ignore unreadable artifacts because their session cannot be verified.
    }
  }
  return summaries.sort((a, b) => b.startedAt - a.startedAt);
}

function runDetailText(
  run: RunSummary,
  activeRuns: Map<string, WorkflowDetails>,
): string {
  const runDir = path.join(getAgentDir(), "workflows", run.runId);
  const live = activeRuns.get(run.runId);
  if (live) return buildWorkflowResultMessage(live, runDir);
  try {
    const parsed = JSON.parse(
      fs.readFileSync(path.join(runDir, "workflow.json"), "utf8"),
    ) as WorkflowDetails;
    return buildWorkflowResultMessage(parsed, runDir);
  } catch {
    return `Run ${run.runId} — ${run.status}`;
  }
}

export default function workflows(pi: ExtensionAPI) {
  /** Live background runs, for /workflows and shutdown cleanup. */
  const activeRuns = new Map<
    string,
    {
      details: WorkflowDetails;
      controller: RunController;
      completion?: Promise<void>;
    }
  >();
  const activeDetails = () =>
    new Map(
      [...activeRuns].map(([runId, run]) => [runId, run.details] as const),
    );

  /** Finished counts remain visible until the dashboard acknowledges them. */
  let lastUi: ExtensionContext["ui"] | undefined;
  let completedRuns = 0;
  let failedRuns = 0;
  const updateIndicator = () => {
    const ui = lastUi;
    if (!ui) return;
    try {
      const running = activeRuns.size;
      if (running === 0 && completedRuns === 0 && failedRuns === 0) {
        ui.setStatus("workflows", undefined);
        return;
      }
      ui.setStatus(
        "workflows",
        formatActivityStatus(ui.theme, "workflows", {
          running,
          done: completedRuns,
          failed: failedRuns,
        }),
      );
    } catch {
      // UI may be unavailable.
    }
  };

  const recordSettledRun = (status: WorkflowDetails["status"]) => {
    if (status === "completed") completedRuns += 1;
    else failedRuns += 1;
  };

  pi.on("session_start", (_event, ctx) => {
    if (ctx.hasUI) lastUi = ctx.ui;
    updateIndicator();
  });

  pi.on("session_shutdown", async () => {
    const runs = [...activeRuns.values()];
    for (const run of runs) run.controller.abort("Session is shutting down");
    await Promise.all(
      runs.map((run) => run.controller.settle({ abort: true })),
    );
    const completions = runs
      .map((run) => run.completion)
      .filter(
        (completion): completion is Promise<void> => completion !== undefined,
      );
    if (completions.length > 0) {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const timeout = new Promise<void>((resolve) => {
        timer = setTimeout(resolve, 8_000);
        timer.unref?.();
      });
      await Promise.race([Promise.allSettled(completions), timeout]);
      if (timer) clearTimeout(timer);
    }
    lastUi?.setStatus("workflows", undefined);
    lastUi = undefined;
  });

  pi.registerCommand("workflows", {
    description:
      "List workflow runs (`/workflows <runId>` for one run's detail)",
    handler: async (rawArgs, ctx) => {
      const arg = rawArgs.trim();
      if (ctx.mode === "tui") {
        lastUi = ctx.ui;
        await showWorkflowDashboard(ctx, activeDetails, arg || undefined);
        // Opening the dashboard acknowledges finished runs.
        completedRuns = 0;
        failedRuns = 0;
        updateIndicator();
        return;
      }
      // Non-TUI fallback: plain text listing.
      const runs = listRuns(
        activeDetails(),
        ctx.sessionManager.getSessionId(),
        sessionWorkflowRunIds(ctx),
      );
      if (runs.length === 0) {
        ctx.ui.notify("No workflow runs yet.", "info");
        return;
      }
      if (arg) {
        const run = runs.find((r) => r.runId === arg || r.runId.endsWith(arg));
        ctx.ui.notify(
          run
            ? runDetailText(run, activeDetails())
            : `No workflow run matching "${arg}".`,
          run ? "info" : "warning",
        );
        return;
      }
      const labels = runs.map(
        (r) =>
          `${r.active ? "* " : "  "}${r.runId}  ${r.status}  ${r.name ?? ""}  ${r.done}/${r.total}`,
      );
      if (!ctx.hasUI) {
        ctx.ui.notify(labels.join("\n"), "info");
        return;
      }
      const choice = await ctx.ui.select("Workflow runs", labels);
      if (!choice) return;
      const run = runs[labels.indexOf(choice)];
      if (run) ctx.ui.notify(runDetailText(run, activeDetails()), "info");
    },
  });

  pi.registerTool({
    name: "workflow",
    label: "Workflow",
    description: WORKFLOW_TOOL_DESCRIPTION,
    promptSnippet: WORKFLOW_PROMPT_SNIPPET,
    promptGuidelines: WORKFLOW_PROMPT_GUIDELINES,
    parameters: WorkflowParams,

    async execute(_toolCallId, params, signal, onUpdate, ctx) {
      const runsRoot = path.join(getAgentDir(), "workflows");

      // Resume branch: hoist the early decision so the script/args path
      //   below stays unchanged for fresh runs. Mutual exclusion with
      //   `script`/`scriptPath` is checked here only; `resume` + `args` is
      //   allowed (an explicit args string overrides the prior args).
      const resumeRequested = params.resume?.trim();
      if (resumeRequested) {
        const scriptProvided = params.script !== undefined;
        const scriptPathProvided =
          params.scriptPath !== undefined && params.scriptPath.trim() !== "";
        if (scriptProvided || scriptPathProvided) {
          throw new Error(
            "workflow `resume` is mutually exclusive with `script` and `scriptPath` — provide at most one",
          );
        }
        if (activeRuns.has(resumeRequested)) {
          throw new Error(
            `workflow resume: run ${resumeRequested} is still active; wait for it to settle or pick a different run`,
          );
        }
      }

      let resolved: ReturnType<typeof resolveScriptSource>;
      let resumeSource: ReturnType<typeof prepareResume> | undefined;
      // Canonical absolute cwd of this run. Used both to guard cross-project
      // resumes and to salt every replay key; realpath falls back to
      // resolve when the cwd is already canonical or its symlinks vanish.
      let launchCwd: string;
      try {
        launchCwd = fs.realpathSync(ctx.cwd);
      } catch {
        launchCwd = path.resolve(ctx.cwd);
      }
      if (resumeRequested) {
        resumeSource = prepareResume(runsRoot, resumeRequested, launchCwd);
        resolved = {
          source: resumeSource.source,
          ...(resumeSource.priorDetails.scriptPath !== undefined
            ? { scriptPath: resumeSource.priorDetails.scriptPath }
            : {}),
        };
      } else {
        resolved = resolveScriptSource(params, ctx.cwd);
      }
      let prepared: ReturnType<typeof prepareWorkflowScript>;
      try {
        prepared = prepareWorkflowScript(resolved.source);
      } catch (error) {
        throw new Error(`Workflow script failed to parse: ${errorText(error)}`);
      }

      let args: unknown;
      if (params.args !== undefined) {
        try {
          args = JSON.parse(params.args);
        } catch {
          args = params.args;
        }
      } else if (resumeSource?.argsJson !== undefined) {
        // Reuse the prior run's args unless the caller explicitly overrode.
        try {
          args = JSON.parse(resumeSource.argsJson);
        } catch {
          args = resumeSource.argsJson;
        }
      }

      const meta = prepared.meta;
      const runId = `wf_${randomBytes(6).toString("hex")}`;
      const runDir = path.join(runsRoot, runId);
      const background = (params.background ?? false) && ctx.hasUI;

      const scriptHash = createHash("sha256")
        .update(resolved.source)
        .digest("hex");
      // Parent-session defaults at launch, frozen into the replay-key salt.
      // The defaults are best-effort: `ctx.model` may be undefined and
      // `getThinkingLevel` may return an unsupported string. Undefined
      // values are dropped by canonicalStringify, but we still stringify the
      // thinking level once to keep cross-process replays stable for any
      // type pi returns.
      const defaultModelId = ctx.model?.id;
      const defaultProvider = ctx.model?.provider;
      const defaultThinking = String(pi.getThinkingLevel());
      const keyContext: AgentKeyContext = {
        launchCwd,
        ...(defaultProvider !== undefined ? { defaultProvider } : {}),
        ...(defaultModelId !== undefined ? { defaultModelId } : {}),
        ...(defaultThinking !== undefined ? { defaultThinking } : {}),
      };
      const details: WorkflowDetails = {
        runId,
        sessionId: ctx.sessionManager.getSessionId(),
        name: meta.name,
        description: meta.description,
        ...(resolved.scriptPath !== undefined
          ? { scriptPath: resolved.scriptPath }
          : {}),
        background,
        status: "running",
        startedAt: Date.now(),
        phases: [...meta.phases],
        agents: [],
        scriptHash,
        ...(resumeSource
          ? {
              resumedFrom: resumeSource.priorRunId,
              replayedCount: 0,
            }
          : {}),
        launchCwd,
        ...(defaultProvider !== undefined
          ? { launchProvider: defaultProvider }
          : {}),
        ...(defaultModelId !== undefined
          ? { launchModelId: defaultModelId }
          : {}),
        ...(defaultThinking !== undefined
          ? { launchThinking: defaultThinking }
          : {}),
      };

      writeRunFile(runDir, "script.js", resolved.source);
      if (params.args !== undefined)
        writeRunFile(runDir, "args.json", params.args);
      else if (resumeSource?.argsJson !== undefined)
        writeRunFile(runDir, "args.json", resumeSource.argsJson);
      persistWorkflowJson(runDir, details);
      const persistence = createWorkflowPersistence(runDir, details);

      // Background runs survive Esc on the parent turn, but all runs are
      // aborted and settled during session shutdown.
      const controller = new RunController(background ? undefined : signal);

      // Each concurrent child gets its own extension runtime. A previous
      // version cached `createWorkflowResources` per (cwd,variant,trusted)
      // and shared one runtime across children, so the first child finishing
      // (`AgentSession.dispose()` invalidates its extension runner) poisoned
      // every still-running sibling — observed in run wf_d10a2148948f.
      // Trust and cwd resolution are still per-agent; only resources are
      // freshly built each call.
      const parentTrusted = ctx.isProjectTrusted();

      // Throttled progress: tool-block updates when blocking. Background
      // runs are covered by the below-editor indicator and /workflows.
      let emitTimer: ReturnType<typeof setTimeout> | undefined;
      let lastEmit = 0;
      const flush = () => {
        emitTimer = undefined;
        lastEmit = Date.now();
        if (background) return;
        onUpdate?.({
          content: [{ type: "text", text: summaryLine(details) }],
          details: compactToolDetails(details),
        });
      };
      const emit = (checkpoint = true) => {
        if (checkpoint) persistence.checkpoint();
        if (emitTimer) return;
        emitTimer = setTimeout(
          flush,
          Math.max(0, EMIT_INTERVAL_MS - (Date.now() - lastEmit)),
        );
      };
      const flushNow = () => {
        if (emitTimer) clearTimeout(emitTimer);
        flush();
      };

      const phaseFn = (title: unknown) => {
        const text = String(title);
        details.currentPhase = text;
        if (!details.phases.some((p) => p.title === text))
          details.phases.push({ title: text });
        emit();
      };

      let agentCounter = 0;
      let journalSeq = 0;
      // Null-object replay index for fresh runs; resume sets the real one.
      // `take()` returns undefined on miss, so the agentFn body has one path.
      const replayIndex = resumeSource
        ? createReplayIndex(resumeSource.entries)
        : {
            take: (_key: string) =>
              undefined as ReturnType<
                ReturnType<typeof createReplayIndex>["take"]
              >,
            remaining: () => 0,
          };
      const agentFn = async (
        promptValue: unknown,
        optsValue: unknown = {},
        invocationSignal?: AbortSignal,
      ): Promise<ScriptAgentResult> => {
        const index = ++agentCounter;
        const opts: AgentCallOptions =
          optsValue && typeof optsValue === "object"
            ? (optsValue as AgentCallOptions)
            : {};
        const label =
          typeof opts.label === "string" && opts.label.trim()
            ? opts.label.trim().slice(0, 160)
            : `agent-${index}`;

        const record: AgentRecord = {
          index,
          label,
          phase:
            typeof opts.phase === "string"
              ? opts.phase.slice(0, 160)
              : details.currentPhase,
          state: "running",
          model: ctx.model?.id,
          contextWindow: ctx.model?.contextWindow,
          startedAt: Date.now(),
          preview: "",
          usage: emptyUsage(),
          transcript: [],
        };

        const fail = (error: string): ScriptAgentResult => {
          record.state = "error";
          record.error = error;
          record.finishedAt = Date.now();
          emit();
          return { ok: false, output: "", error };
        };

        const prompt = buildWorkflowAgentPrompt(
          typeof promptValue === "string"
            ? promptValue
            : String(promptValue ?? ""),
        );
        if (!prompt.trim())
          return fail("agent() requires a non-empty prompt string");
        if (controller.signal.aborted)
          return fail("Workflow was aborted before this agent started");

        // Replay check: a hit returns the recorded result without ever
        // touching the controller (no budget, no semaphore slot). A miss
        // — including a thrown key computation or an unusable recorded
        // result — falls through to a normal schedule.
        let replayHit: ReturnType<typeof replayIndex.take> | undefined;
        try {
          replayHit = replayIndex.take(agentCallKey(prompt, opts, keyContext));
        } catch {
          replayHit = undefined;
        }
        if (replayHit) {
          const candidate = replayHit.result as
            | {
                ok?: boolean;
                output?: unknown;
                structured?: unknown;
                error?: unknown;
              }
            | undefined;
          if (
            candidate &&
            typeof candidate === "object" &&
            typeof candidate.ok === "boolean"
          ) {
            const now = Date.now();
            const outputText =
              typeof candidate.output === "string" ? candidate.output : "";
            const replayedRecord: AgentRecord = {
              ...record,
              state: "done",
              replayed: true,
              startedAt: now,
              finishedAt: now,
              preview: outputText.slice(0, PREVIEW_LENGTH),
            };
            details.agents.push(replayedRecord);
            details.replayedCount = (details.replayedCount ?? 0) + 1;
            persistence.checkpoint({ immediate: true });
            emit();
            try {
              journalSeq += 1;
              appendJournalEntry(runDir, {
                key: replayHit.key,
                seq: journalSeq,
                index: replayedRecord.index,
                label: replayedRecord.label,
                ok: true,
                result: candidate,
                finishedAt: now,
              });
            } catch {
              // Best-effort: never propagate journal failures out of the replay path.
            }
            return {
              ok: candidate.ok,
              output: outputText,
              ...(candidate.structured !== undefined
                ? { structured: candidate.structured }
                : {}),
              ...(candidate.error !== undefined
                ? { error: String(candidate.error) }
                : {}),
            };
          }
          // Fall through: usable object test failed; treat as a miss.
        }

        return controller
          .schedule(async (runSignal) => {
            // Record is allocated in agentFn but only published (and the
            // initial checkpoint written) once schedule has accepted the call
            // and acquired the semaphore. A budget-exhausted schedule
            // rejection must never append to details.agents or checkpoint.
            details.agents.push(record);
            persistence.checkpoint({ immediate: true });
            emit(false);

            // Model/provider resolution: default to the parent session's model.
            let model: WorkflowModel | undefined = ctx.model;
            if (opts.model !== undefined || opts.provider !== undefined) {
              const modelOpt =
                typeof opts.model === "string" ? opts.model : undefined;
              const providerOpt =
                typeof opts.provider === "string" ? opts.provider : undefined;
              if (!modelOpt)
                return fail(
                  `agent "${label}": \`provider\` requires \`model\` as well`,
                );
              let resolved: WorkflowModel | undefined;
              if (providerOpt) {
                resolved = ctx.modelRegistry.find(providerOpt, modelOpt);
              } else {
                const slash = modelOpt.indexOf("/");
                if (slash > 0) {
                  resolved = ctx.modelRegistry.find(
                    modelOpt.slice(0, slash),
                    modelOpt.slice(slash + 1),
                  );
                }
                resolved ??= ctx.modelRegistry
                  .getAll()
                  .find((m) => m.id === modelOpt);
              }
              if (!resolved) {
                const requested = providerOpt
                  ? `${providerOpt}/${modelOpt}`
                  : modelOpt;
                return fail(
                  `agent "${label}": unknown model "${requested}" (use provider/id)`,
                );
              }
              model = resolved;
            }
            record.model = model?.id;
            record.contextWindow = model?.contextWindow;
            emit();

            // Effort → thinking level; default inherits the parent session.
            let thinkingLevel: ThinkingLevel = pi.getThinkingLevel();
            if (opts.effort !== undefined) {
              const effort = String(opts.effort);
              if (!(THINKING_LEVELS as readonly string[]).includes(effort)) {
                return fail(
                  `agent "${label}": invalid effort "${effort}" (use ${THINKING_LEVELS.join("|")})`,
                );
              }
              thinkingLevel = effort as ThinkingLevel;
            }

            // Per-agent cwd: relative paths resolve against the parent cwd;
            // missing or non-directory paths fail the call. Trust is re-derived
            // for the target dir so untrusted dirs load no project extensions.
            let resolution: AgentCwdResolution;
            try {
              resolution = resolveAgentCwdAndTrust({
                requested: opts.cwd,
                parentCwd: ctx.cwd,
                parentTrusted,
              });
            } catch (error) {
              return fail(`agent "${label}": ${errorText(error)}`);
            }

            const resources = await createWorkflowResources(
              resolution.cwd,
              opts.schema !== undefined ? "structured" : "plain",
              resolution.trusted,
            );
            const outcome = await runAgent({
              prompt,
              schema: opts.schema,
              model,
              thinkingLevel,
              cwd: resolution.cwd,
              loader: resources.loader,
              settingsManager: resources.settingsManager,
              modelRegistry: ctx.modelRegistry,
              writable: opts.writable === true,
              signal: runSignal,
              onProgress: (progress) => {
                record.preview = progress.preview.slice(0, PREVIEW_LENGTH);
                record.usage = progress.usage;
                record.model = progress.model ?? record.model;
                record.contextWindow =
                  progress.contextWindow ?? record.contextWindow;
                record.transcript = progress.transcript;
                emit();
              },
            });

            record.usage = outcome.usage;
            record.model = outcome.model ?? record.model;
            record.contextWindow =
              outcome.contextWindow ?? record.contextWindow;
            record.transcript = outcome.transcript;
            record.preview = (outcome.output || record.preview).slice(
              0,
              PREVIEW_LENGTH,
            );
            record.finishedAt = Date.now();
            record.state = outcome.ok ? "done" : "error";
            if (outcome.ok) {
              delete record.error;
            } else {
              record.error = outcome.error ?? "Agent failed";
            }
            emit();

            const scriptResult: ScriptAgentResult = {
              ok: outcome.ok,
              output: outcome.output,
              ...(outcome.structured !== undefined
                ? { structured: outcome.structured }
                : {}),
              ...(outcome.error !== undefined ? { error: outcome.error } : {}),
            };
            // Journal only calls that actually ran. agentCallKey and
            // appendJournalEntry are both best-effort; either failure must
            // never propagate out of the happy path.
            try {
              journalSeq += 1;
              appendJournalEntry(runDir, {
                key: agentCallKey(prompt, opts, keyContext),
                seq: journalSeq,
                index: record.index,
                label: record.label,
                ok: outcome.ok,
                result: scriptResult,
                model: record.model,
                cwd: resolution.cwd,
                finishedAt: record.finishedAt ?? Date.now(),
              });
            } catch {
              // Best-effort: agentCallKey can throw on non-canonicalizable
              // options, and appendJournalEntry already swallows its own.
            }

            return scriptResult;
          }, invocationSignal)
          .catch((error) => ({
            ok: false,
            output: "",
            error: errorText(error),
          }));
      };

      const runScript = async () => {
        let status: WorkflowDetails["status"] = "completed";
        try {
          details.result = await runWorkflowSandbox({
            source: prepared.source,
            args,
            cwd: ctx.cwd,
            signal: controller.signal,
            onAgent: agentFn,
            onPhase: phaseFn,
          });
        } catch (error) {
          details.error = errorText(error);
          status = controller.signal.aborted ? "aborted" : "failed";
          controller.abort("Workflow script failed");
        }

        const settled = await controller.settle({
          abort: status !== "completed",
        });
        if (!settled) {
          status = "failed";
          details.error = details.error
            ? `${details.error}; agent shutdown deadline exceeded`
            : "Agent shutdown deadline exceeded";
        }
        for (const record of details.agents) {
          if (record.state !== "running") continue;
          record.state = "error";
          record.error =
            record.error ?? "Agent did not settle before run cleanup";
          record.finishedAt = Date.now();
        }
        details.status = status;
        details.finishedAt = Date.now();
        // Terminal sort: after the run has fully settled, order details.agents
        // by index so the completion report (buildWorkflowResultMessage in
        // prompt.ts) — which iterates details.agents directly — sees index
        // order. Live renders (tool block, dashboard) already use sorted
        // views via compactToolDetails / phaseGroups. Reassignment mid-run
        // is the thing to avoid; this is a one-shot at run completion.
        details.agents = sortedAgents(details);
        try {
          persistence.flush();
        } catch (error) {
          // recordFlushFailure() does not touch details.status — runScript
          // already committed the truthful status above. The error message
          // is the only thing worth recording, and it is rethrown so the
          // background catch (or the blocking awaiter) sees a tagged failure.
          recordFlushFailure(details, error);
        } finally {
          flushNow();
        }
      };

      // Registered for /workflows visibility and session_shutdown abort;
      // blocking runs are watchable live from the dashboard too.
      const activeRun = { details, controller } as {
        details: WorkflowDetails;
        controller: RunController;
        completion?: Promise<void>;
      };
      activeRuns.set(runId, activeRun);
      const completion = runScript();
      activeRun.completion = completion;
      if (ctx.hasUI) lastUi = ctx.ui;
      updateIndicator();

      if (background) {
        void completion
          .catch((error) => {
            recordBackgroundRunFailure(details, error);
          })
          .finally(() => {
            activeRuns.delete(runId);
            recordSettledRun(details.status);
            updateIndicator();
            try {
              pi.sendUserMessage(
                buildBackgroundWorkflowFollowUp({
                  runId,
                  status: details.status,
                  result: buildWorkflowResultMessage(details, runDir),
                }),
                { deliverAs: "followUp" },
              );
            } catch {
              // Session may be shutting down.
            }
          });
        return {
          content: [
            {
              type: "text",
              text: buildBackgroundWorkflowLaunchResult({
                runId,
                name: details.name,
                runDir,
              }),
            },
          ],
          details: compactToolDetails(details),
        };
      }

      try {
        await completion;
      } finally {
        activeRuns.delete(runId);
        recordSettledRun(details.status);
        updateIndicator();
      }
      if (details.status !== "completed") {
        // Pi marks tool failures only when execute throws; returning isError is
        // ignored by the extension API.
        throw new Error(buildWorkflowResultMessage(details, runDir));
      }
      return {
        content: [
          {
            type: "text",
            text: buildWorkflowResultMessage(details, runDir),
          },
        ],
        details: compactToolDetails(details),
      };
    },

    renderCall(args: Partial<WorkflowInput>, theme) {
      const meta =
        typeof args.script === "string"
          ? extractMeta(args.script)
          : { phases: [] };
      let text =
        theme.fg("toolTitle", theme.bold("workflow ")) +
        theme.fg("accent", (meta as WorkflowMeta).name ?? "(script)");
      if (args.background) text += theme.fg("dim", " (background)");
      const description = (meta as WorkflowMeta).description;
      if (description) text += `\n  ${theme.fg("dim", description)}`;
      for (const phase of meta.phases.slice(0, 8)) {
        text += `\n  ${theme.fg("dim", SQUARE)} ${theme.fg("accent", phase.title)}${
          phase.detail ? theme.fg("dim", ` — ${phase.detail}`) : ""
        }`;
      }
      return new Text(text, 0, 0);
    },

    renderResult(result, { expanded }, theme) {
      const details = result.details as WorkflowDetails | undefined;
      if (!details) {
        const first = result.content[0];
        return new Text(
          first?.type === "text" ? first.text : "(no output)",
          0,
          0,
        );
      }

      const { done, failed } = countStates(details);
      const settled = done + failed;
      const elapsed = formatElapsed(details.startedAt, details.finishedAt);
      let header =
        `${theme.fg(statusColor(details.status), SQUARE)} ${theme.fg("toolTitle", theme.bold("workflow "))}` +
        `${theme.fg("accent", details.name ?? details.runId)} ` +
        theme.fg(
          "dim",
          `${settled}/${details.agents.length} agents · ${elapsed} · `,
        ) +
        theme.fg(statusColor(details.status), statusWord(details.status));
      if (failed) header += theme.fg("error", ` · ${failed} failed`);
      if (details.background) header += theme.fg("dim", " (background)");
      if (details.status === "running" && details.currentPhase) {
        header += theme.fg("muted", ` · ${details.currentPhase}`);
      }
      const totals = formatUsage(aggregateUsage(details.agents));

      if (!expanded) {
        let text = header;
        for (const agent of details.agents) {
          const context = agentContext(agent);
          text += `\n  ${stateSquare(agent.state, theme)} ${theme.fg("accent", agent.label)}${
            agent.phase ? theme.fg("dim", ` (${agent.phase})`) : ""
          }${theme.fg(
            "dim",
            `${context ? ` · ${context}` : ""} · ${formatElapsed(agent.startedAt, agent.finishedAt)}`,
          )}`;
        }
        if (totals) text += `\n  ${theme.fg("dim", `Total: ${totals}`)}`;
        if (details.error)
          text += `\n  ${theme.fg("error", `Error: ${details.error}`)}`;
        text += `\n${theme.fg("muted", `(${keyHint("app.tools.expand", "to expand")})`)}`;
        return new Text(text, 0, 0);
      }

      const container = new Container();
      container.addChild(new Text(header, 0, 0));
      if (details.description) {
        container.addChild(
          new Text(theme.fg("dim", details.description), 0, 0),
        );
      }

      for (const group of phaseGroups(details)) {
        container.addChild(new Spacer(1));
        container.addChild(
          new Text(theme.fg("muted", `─── ${group.title} ───`), 0, 0),
        );
        for (const agent of group.agents) {
          const usage = formatUsage(agent.usage, agent.model);
          const context = agentContext(agent);
          let line = `${stateSquare(agent.state, theme)} ${theme.fg("accent", agent.label)} ${theme.fg(
            "dim",
            [context, formatElapsed(agent.startedAt, agent.finishedAt)]
              .filter(Boolean)
              .join(" · "),
          )}`;
          if (usage) line += ` ${theme.fg("dim", usage)}`;
          container.addChild(new Text(line, 0, 0));
          if (agent.error) {
            container.addChild(
              new Text(`  ${theme.fg("error", agent.error)}`, 0, 0),
            );
          } else if (agent.preview) {
            const preview = agent.preview.split("\n").slice(0, 2).join(" ");
            container.addChild(new Text(`  ${theme.fg("dim", preview)}`, 0, 0));
          }
        }
      }

      if (details.error) {
        container.addChild(new Spacer(1));
        container.addChild(
          new Text(theme.fg("error", `Error: ${details.error}`), 0, 0),
        );
      }

      if (details.result !== undefined) {
        container.addChild(new Spacer(1));
        container.addChild(new Text(theme.fg("muted", "─── result ───"), 0, 0));
        container.addChild(
          new Markdown(
            `\`\`\`json\n${resultJson(details.result)}\n\`\`\``,
            0,
            0,
            getMarkdownTheme(),
          ),
        );
      }

      if (totals) {
        container.addChild(new Spacer(1));
        container.addChild(new Text(theme.fg("dim", `Total: ${totals}`), 0, 0));
      }
      return container;
    },
  });
}
