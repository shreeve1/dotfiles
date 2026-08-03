import {
  countStates,
  formatElapsed,
  resultJson,
  shortenHome,
  type WorkflowDetails,
} from "./model.ts";

/** Model-facing schema descriptions for workflow source, arguments, and background mode. */
export const WORKFLOW_PARAMETER_DESCRIPTIONS = {
  script:
    "JavaScript workflow script. May start with `export const meta = {...}`, then use phase(), agent(), parallel(), args, and a final `return`. Mutually exclusive with `scriptPath` and `resume`.",
  scriptPath:
    "Path to a JavaScript workflow file, relative to the project root (e.g. .pi/workflows/review.js). Mutually exclusive with `script` and `resume`. The file is read once at launch and copied into the run directory.",
  args: "Optional JSON string exposed to the script as `args` (parsed when valid JSON, otherwise passed through as the raw string).",
  background:
    "Run in the background: the tool returns a run id immediately and you receive a follow-up message when the workflow finishes. Defaults to false (blocking with live progress).",
  resume:
    "Resume a prior failed or aborted workflow run by its run id (e.g. wf_a1b2c3d4e5f6). The prior run's script and args are reused; agent calls that already succeeded are replayed from its journal instead of re-run. Mutually exclusive with `script` and `scriptPath`.",
  budget:
    "Cumulative run budget; when maxCost (USD), maxTokens (input+output), or maxDurationMs is exceeded the run aborts remaining agent calls.",
};

/** Defines the workflow DSL, constraints, reliability guidance, and model-authored task examples. */
export const WORKFLOW_TOOL_DESCRIPTION = [
  "The workflow tool is only to be called when the user says 'ultracode' or specifically requests a workflow run.",
  "Run a multi-agent workflow from a JavaScript orchestration script you write inline. Use this when a task benefits from fanning work out across several isolated subagents in ordered phases (research fan-out, per-file review, verify-then-synthesize pipelines).",
  "The script runs as an async function body with these primitives:",
  "• export const meta = { name, description, phases: [{ title, detail? }] } — metadata for the progress UI. Declare all phases up front.",
  "• phase(title) — mark the current phase at runtime (use titles from meta.phases).",
  "• await agent(prompt, { label?, phase?, schema?, model?, provider?, effort?, writable?, cwd? }) — run ONE subagent in an isolated context and wait for it. Always resolves to { ok, output, structured?, error? }. Check `ok` before using the result. When you pass a JSON `schema`, `structured` holds the validated object on success. `output` carries the agent's final text on EVERY outcome, including `ok:false` — an agent that did good work but skipped `structured_output` still returns it, so prefer degrading to `output` over discarding the result. `model`/`provider` override the session model; `effort` sets the thinking level (off|minimal|low|medium|high|xhigh|max); `writable: true` opts the child back into `write`/`edit` (children default to a read-only file-mutation policy — containment is advisory, not a hard sandbox; `bash` and `lsp_navigation`'s `rename`+`apply` can still write files); `cwd` points the child at a different directory (e.g. a git worktree) — relative paths resolve against the project root, the directory must exist, and project trust is re-derived for that directory, so an untrusted directory loads no project extensions. Children receive normal built-ins and trust-appropriate extensions, settings, skills, and AGENTS.md context; the denylist blocks recursive orchestration and interactive user prompts (also advisory, not a hard sandbox).",
  "• await parallel([() => agent(...), () => agent(...)], { concurrency? }) — run zero-argument agent thunks concurrently and return results in order. Defaults to 4 concurrent thunks; pass `{ concurrency: N }` for more, clamped by the run-wide cap (default 8 via `PI_WORKFLOWS_CONCURRENCY` or `<agentDir>/extensions/workflows/config.json`; hard ceiling 32).",
  '• await checkpoint({ name, prompt, context? }) — pause a BACKGROUND workflow for human approval; resolves to "approved" or "rejected". Only usable when the run was launched with background: true (a foreground run has no way to receive the answer). Answer it from chat with the workflow_respond tool. On resume, a previously answered checkpoint replays its decision instead of asking again.',
  "• args — the parsed value of the `args` tool parameter (or undefined).",
  "• await withWorktree(name, async ({ path }) => { ... }) — run the callback against an isolated git worktree of the current repo (created at HEAD, detached). Pass `path` as an agent's `cwd` to give a writable agent its own working tree, so parallel writers never collide. The worktree is removed when the callback finishes (or when the run ends). Requires the workflow to be running inside a git repository.",
  "Workflow JavaScript runs in a restricted, killable child with no imports, eval, timers, filesystem, network, or process APIs. A run may make at most 128 agent calls by default (configurable via `PI_WORKFLOWS_MAX_AGENT_CALLS` or `config.json`; hard ceiling 1000). Two independent limits apply: (1) the agent-call-count cap — exceeding it fails that individual `agent()` call so a script can still reduce what it has and return partial results, and the run is only aborted if a script keeps calling past the cap (more refused calls than the cap itself); and (2) the optional launch `budget` — cumulative maxCost/maxTokens overage aborts the run after the offending agent call settles, and maxDurationMs is a wall-clock run deadline: a timer aborts the whole run when it elapses (interrupting in-flight agents via run-signal propagation), with a supplemental check at each new agent-call admission. Each agent must receive its first assistant response event within 45 seconds so silent provider requests fail clearly; after that, agent() has no per-call wall-clock deadline. Each individual child tool call times out independently after 3 minutes, becomes an error tool result, and leaves the agent loop free to recover. Use map/filter/if/await/template strings to orchestrate, and `return` a JSON-serializable aggregate.",
  "Pass a `schema` to agent() whenever a later step branches on the result, so you get typed fields instead of prose. A failed or aborted run can be resumed by run id via the `resume` parameter: agent calls and checkpoint decisions that already succeeded replay from the run's journal instead of re-running. Artifacts are saved under ~/.pi/agent/workflows/<runId>/ for inspection.",
  "Example:",
  "export const meta = { name: 'reliability-review', description: 'Review modules for reliability risks, then report', phases: [{ title: 'Scan' }, { title: 'Report' }] }",
  "const FINDINGS = { type: 'object', properties: { issues: { type: 'array', items: { type: 'string' } }, ok: { type: 'boolean' } }, required: ['issues', 'ok'] }",
  "phase('Scan')",
  "const scans = await parallel(args.files.map((f) => () => agent(`Review ${f} for correctness and reliability risks.`, { label: `scan:${f}`, phase: 'Scan', schema: FINDINGS })))",
  "const findings = scans.map((r) => (r.ok ? r.structured : { unstructured: r.output }))",
  "phase('Report')",
  "const report = await agent(`Summarize these findings: ${JSON.stringify(findings)}`, { label: 'report', phase: 'Report' })",
  "return { findings, report: report.ok ? report.output : report.error }",
].join("\n");

/** Adds workflow orchestration primitives and background execution to the model's tool prompt. */
export const WORKFLOW_PROMPT_SNIPPET =
  "Orchestrate isolated subagents from an inline JS script: phase()/agent()/parallel()/checkpoint()/withWorktree() with structured outputs, optional background execution, run budgets, and resume";

/** Guides the model on appropriate workflow fan-out and mandatory agent result checks. */
export const WORKFLOW_PROMPT_GUIDELINES = [
  "Use workflow when a task needs several subagents with phase dependencies or dynamic fan-out; keep single small delegations in the main session.",
  "In workflow scripts, agent() never throws — always check `.ok` before using `.structured`, which exists only on success.",
  "`.output` is populated even when `.ok` is false. When reducing results, fall back to `.output` instead of dropping the entry: a schema miss should cost you typed fields, not the whole agent's work.",
];

/** Marks and forwards a workflow script's agent() task as an isolated child-model prompt. */
export function buildWorkflowAgentPrompt(prompt: string) {
  return prompt;
}

/** Instructs structured workflow children to terminate with exactly one structured_output call. */
export const STRUCTURED_OUTPUT_SYSTEM_INSTRUCTION =
  "When your task is complete, call the `structured_output` tool exactly once as your final action, with fields matching the required schema. Do not write any other text after it.";

/** Describes the terminating structured_output tool and its final-action contract. */
export const STRUCTURED_OUTPUT_TOOL_DESCRIPTION =
  "Return your final result as structured data matching the required schema. Call this exactly once, as your last action; do not write any other text after it.";

/** Builds the workflow completion report returned to the parent model. */
export function buildWorkflowResultMessage(
  details: WorkflowDetails,
  runDir: string,
) {
  const { done, failed } = countStates(details);
  const elapsed = formatElapsed(details.startedAt, details.finishedAt);
  const lines = [
    `Workflow ${details.name ? `"${details.name}"` : details.runId} ${details.status} — ` +
      `${done}/${details.agents.length} agents ok${failed ? `, ${failed} failed` : ""} ` +
      `across ${details.phases.length} phase(s) in ${elapsed}.`,
    `Run dir: ${shortenHome(runDir)}`,
  ];
  if (details.error) lines.push(`Error: ${details.error}`);
  if (details.agents.length > 0) {
    lines.push("", "Agents:");
    for (const agent of details.agents) {
      const status =
        agent.state === "done"
          ? "ok"
          : agent.state === "error"
            ? "FAILED"
            : "running";
      lines.push(
        `- [${agent.label}]${agent.phase ? ` (${agent.phase})` : ""} ${status}` +
          (agent.error ? ` — ${agent.error}` : ""),
      );
    }
  }
  if (details.result !== undefined)
    lines.push("", "Result:", resultJson(details.result));
  return lines.join("\n");
}

/** Builds the follow-up user message that delivers a settled background workflow to the parent model. */
export function buildBackgroundWorkflowFollowUp(options: {
  runId: string;
  status: WorkflowDetails["status"];
  result: string;
}) {
  return `[Background workflow ${options.runId} ${options.status}]\n\n${options.result}`;
}

/** Builds the background-launch result and tells the parent model where progress and artifacts appear. */
export function buildBackgroundWorkflowLaunchResult(options: {
  runId: string;
  name?: string;
  runDir: string;
}) {
  return [
    `Workflow ${options.name ? `"${options.name}"` : options.runId} launched in background (run ${options.runId}).`,
    `Artifacts: ${shortenHome(options.runDir)}`,
    "You'll receive a follow-up message when it finishes; /workflows shows progress.",
  ].join("\n");
}
