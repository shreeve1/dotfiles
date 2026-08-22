# Verification — agent output trust

The vocabulary for how this setup judges whether an agent's work can be trusted.
Two distinct failure modes, two distinct passes — conflating them is the root
cause of misplaced verification effort. See `docs/adr/0001-verification-two-layers.md`.

## Failure modes

**Grounding failure**:
An agent assertion that is false or unsupported by evidence it actually gathered
(a wrong claim about the code). Detected by checking claims against evidence.
_Avoid_: hallucination (too broad), "wrong answer" (too vague).

**Completeness failure**:
A material behavior, edge case, or condition the agent's work omits — the work
is not wrong, it is incomplete. This is "usually misses something." Detected by
hunting for gaps, not by checking claims.
_Avoid_: oversight, missing feature.

## Verification passes

**Grounding gate**:
A pass that catches grounding failures by checking claims against evidence.
Cheap; can run every turn. pi-duo's TERMINAL gate is this. (pi-duo also has a
separate mid-loop SCOPE gate, but that checks proportionality / over-reach —
explicitly not grounding.)
_Avoid_: correctness checker, fact-checker.

**Completeness review**:
A pass that catches completeness failures by hunting for what was omitted.
Requires a "what's missing?" stance and benefits from re-reading the code fresh.
Expensive; run at task boundaries, not every turn.
_Avoid_: gap analysis, audit.

**Verification gate (Ralph)**:
The ralph-loop driver re-runs an issue's `## Verification` command after the
DONE sentinel and overrides done→blocked on failure; deterministic, complements
(not replaces) the fresh-session review.

## Context axis

**In-band verifier**:
Runs in the same process as the actor and sees the actor's transcript. Cheap and
constant (pi-duo). Cannot see anything the actor never read.

**Fresh-session reviewer**:
A separate process with no inherited conversation that re-derives from the repo.
Its independence comes from re-derivation + stance, not merely from process
isolation.
_Avoid_: isolated verifier, sandboxed checker.

## Orchestration mode — Fusion

**Fusion mode** is an opt-in (machine-default-on) Pi extension that shrinks
the parent's tool surface so a strong parent owns intent / architecture /
spec / diff review / verification while cheap fresh-context children do
discovery and execution. Activation: `/fusion on|off|status`,
`/fusion default on|off`, CLI flag `pi --fusion`. State restored from the
latest session entry on resume; otherwise `--fusion`; otherwise the
machine-global config (`$XDG_CONFIG_HOME/fusion/config.json`,
`defaultMode: "on|off"`); otherwise off. See `docs/adr/0002-fusion-mode.md`.

**Roles under Fusion** (per-role models/tools live in
`settings.json` `subagents.agentOverrides`):

- `scout` — fast pre-work code discovery (read-only).
- `researcher` — current external facts (web; read-only).
- `worker` — one writer per file set; concurrent workers get disjoint
  file sets; receives Objective / Files / Interfaces / Constraints /
  Verification.
- `reviewer` — risk-based review only (security, auth, migrations,
  public APIs, data loss, substantial multi-file logic); no Bash.

**Parent allowed tools while Fusion is active**: `read`, `bash`
(restricted; see ADR), `lsp_diagnostics`, `subagent`, `subagent_wait`,
`subagent_supervisor`, `todo`, `advisor` (exception only).

**Worker delegation contract** (every worker delegation carries all five):

1. **Objective** — one sentence; what success looks like.
2. **Files** — exact paths the worker may read and may write.
3. **Interfaces** — schemas, types, function signatures.
4. **Constraints** — what to avoid, what "smallest correct change" means here.
5. **Verification** — the deterministic check the parent will run after.

**Retry ladder** (no blind loops, no model switching inside a task):

1. First miss → `resume` the same persisted worker session with precise correction.
2. Second miss → parent supplies the exact verbatim patch; worker applies it.
3. Dictated patch still fails → stop retrying and revise the parent's plan.

**Completeness review under Fusion**: automatic completeness review runs only
when repo state changed during the user turn (worker mutation), not on
plain chat / design-only / read-only turns. Read-only architecture or
design analysis requires manual `/gap-review`. See
`docs/adr/0002-fusion-mode.md` and `docs/adr/0001-verification-two-layers.md`.

## Orchestration mode — Claude Fusion

**Claude Fusion** ports Fusion's intent into Claude Code: Claude is the **brain**
(intent, architecture, spec, diff review, verification) and delegated `pi -p`
processes are the **arms and legs** (all mutation + grind, on non-Anthropic
models so grunt work does not spend the Anthropic subscription). Enforced by
PreToolUse hook denial (Claude has no Pi-style `setActiveTools`). See
`docs/adr/0003-claude-fusion.md`.

- **Brain cage**: `Edit`/`Write`/`MultiEdit`/`NotebookEdit` blocked; `Bash`
  gated to an allowlist (read-only git + verification + the `pi-delegate`
  wrapper, same shape as Fusion `isSafeBash`). `Read`/`Grep`/`Glob`/
  `WebSearch`/`WebFetch` kept on Claude — the deliberate divergence from
  Fusion's blind Pi-parent.
- **`pi-delegate <role> "<task>"`**: the delegation vehicle. Flat top-level
  `pi -p --no-session` (never nested `pi --fusion`), same working tree,
  synchronous by default (`--async` opt-in) over the `setsid`-detach engine
  (`.claude/skills/_shared/pi-reviewer-engine.md`).
- **Roles**: `worker` (minimax, only writer), `reviewer` (gpt-5.6-sol),
  `planner` (claude-opus-4-8), `researcher` (gpt-5.6-terra). `scout` dropped —
  Claude keeps its own discovery. **Model + tools come from
  `settings.json` `agentOverrides`; persona body from
  `pi-subagents/agents/<role>.md` — never the persona `tools:` frontmatter**
  (it grants the reviewer write, breaking "reviewer never writes").
- **Switch**: `claude` key in `~/.config/fusion/config.json` (falls back to
  `defaultMode`); read live per call; human-driven only (the caged brain
  cannot unblock itself); `.claude/.fusion-off` per-project escape hatch.

## Orchestration mode — omp Fusion

**omp Fusion** ports Fusion's intent to Oh My Pi (`omp`): the same
shrink-the-orchestrator design as Pi Fusion, adapted to omp's runtime. The
main agent owns intent / architecture / spec / diff review / verification
and delegates all discovery and mutation to children via the built-in
`task` tool. Extension: `.omp/agent/extensions/fusion/index.ts` (a separate
file from the Pi original — the child-detection mechanism differs; see
`docs/adr/0006-omp-fusion.md`). Activation mirrors Pi: `/fusion on|off|status`,
`/fusion default on|off`, CLI flag `omp --fusion`.

**Orchestrator session** — the top-level omp session Fusion enforces on.
Identified by its `sessionManager.getSessionId()`, captured (claimed) the
first time the extension activates. Every later `tool_call` /
`before_agent_start` handler enforces only when the handler's own session id
equals the claimed one.
_Avoid_: "parent process" — omp runs children in-process, so process
identity does not distinguish orchestrator from worker.

**Child session** — an in-process subagent session created by the `task`
tool via `createAgentSession`. It has its own `SessionManager` (distinct
session id) and `hasUI: false`, and it loads the same user extensions as the
orchestrator. Because its session id differs from the claimed orchestrator
id, Fusion's enforcement handlers no-op inside it — the omp equivalent of Pi
Fusion's `PI_SUBAGENT_CHILD=1` self-disable.

**Orchestrator allowed tools** while omp Fusion is active: `read`, `task`,
`todo`, `hub`. No `bash`, `edit`, or `write` on the orchestrator — omp has
no read-only bash gate to port; withholding `bash` entirely is the
enforcement. Verification bash runs inside children, not the orchestrator.
_Avoid_: "parent allowlist includes bash (restricted)" — that is the Pi
model, not omp Fusion.

**Roles under omp Fusion** — models are wired in `.omp/agent/config.yml`,
never in the extension or agent frontmatter (a frontmatter `model:` pin
shadows the override):

- `scout` — pre-work code discovery (read-only); built-in agent.
- `task` — the worker; the only writer per file set; built-in agent
  (model override `@task` → minimax-m3).
- `planner` — created for omp (no bundled planner ships); writes `plan.md`
  as the worker's spec; model override → claude-opus-4-8.
- `reviewer` — risk-based review only; built-in agent; model override →
  claude-opus-4-8 (initial setup).

Role model map (all in `config.yml`, so it travels with the repo):
orchestrator = `modelRoles.default` (deepseek-v4-flash); `task` = minimax-m3;
`planner` = claude-opus-4-8; `reviewer` = claude-opus-4-8.

**Repo-tracked default** — unlike Pi Fusion, whose `defaultMode` lives in the
un-synced `$XDG_CONFIG_HOME/fusion/config.json`, omp Fusion reads its
default from a git-tracked `.omp/agent/fusion.json` (`{ "defaultMode":
"on|off" }`) resolved relative to the repo root, so a `git pull` on another
machine reproduces the default-on behavior with no local setup. `/fusion
default on` writes that tracked file. State precedence on session start:
latest `fusion-state` session entry > `--fusion` flag > `.omp/agent/fusion.json`
> off.
