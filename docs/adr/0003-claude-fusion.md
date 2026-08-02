# 0003 — Claude Fusion (Claude Code orchestrates, Pi executes)

**Status:** accepted (2026-08-01)

Port the *intent* of Fusion (ADR 0002) into Claude Code: keep the expensive,
trusted model (Claude) as the **brain** — intent, architecture, spec, diff
review, verification — and push all mutation and grind to cheap fresh-context
**Pi** processes (the arms and legs). Claude never edits; a delegated `pi -p`
worker is the only writer. The goal is the same as Fusion's — reduce routine
cost without lowering quality — with the added lever that Claude's arms run on
non-Anthropic models, so grunt work does not spend the Anthropic subscription.

This is a *port of intent, not code*. Fusion relies on Pi's runtime
`setActiveTools()`; Claude Code has no dynamic tool-scoping, so enforcement is
by **PreToolUse hook denial** instead. Claude's native Task subagents run
Anthropic models only and cannot reach Pi's configured models, so the
delegation vehicle must be a subprocess call to `pi -p`.

## Enforcement (the brain's cage)

Mechanically enforced at the tool boundary via PreToolUse hooks (proven pattern
— `block-path-access.sh` already exit-2 blocks `Edit|Write|MultiEdit`;
`block-bash-pattern.sh` already exit-2 gates `Bash`):

- **Writers blocked:** `Edit`, `Write`, `MultiEdit`, `NotebookEdit` — denied
  with a reason that says "delegate the mutation."
- **Bash gated to an allowlist** — non-optional, because blocking the writers
  is theater otherwise (`python -c`, heredocs, `sed -i`, `tee`, `printf >file`
  are all open write paths). The allowlist is the same shape as Fusion's
  `isSafeBash` (`.pi/agent/extensions/fusion/index.ts`): read-only git
  (`status`/`diff`/`show`/`log`), deterministic verification (test / build /
  typecheck / lint runners), and the one `pi-delegate` wrapper. Shell
  chaining / pipes / redirects / substitution / interpreters denied. The
  parent-commit carve-out (`git add` / `git commit -m`) is inherited as-is.
- **Kept on Claude:** `Read`, `Grep`, `Glob`, `WebSearch`, `WebFetch`. The
  brain has to read code to write a good spec and review a diff; routing every
  read through Pi makes it slow and second-hand. This is the deliberate
  divergence from Fusion, whose Pi-parent is blind by design — see *Amendment*.
- **Guidance injection:** a `SessionStart` (+ `UserPromptSubmit`) hook injects
  the delegation protocol every turn (same channel ponytail uses), so Claude
  knows the loop up front instead of discovering it via a denial each time.

## Delegation vehicle — `pi-delegate`

A thin wrapper (`~/.claude/bin/pi-delegate`) Claude invokes from allowlisted
Bash. `pi-delegate <role> "<task>"`:

- **Flat, not nested.** Launches a single top-level `pi -p` process — never
  `pi --fusion` (which would re-orchestrate on a cheap model, a second dumber
  brain). Claude is the sole orchestrator; it already produced a bounded spec,
  so the worker's job is narrow.
- **Same working tree.** The worker edits files in Claude's cwd; Claude reviews
  via `git diff` + `Read`, runs verification, commits. One writer per cwd
  (ADR 0002:45). Isolated worktrees only if parallel workers are wanted later.
- **Fresh session.** `pi -p --no-session` — a completely fresh, ephemeral
  process per call. This is the pattern that works: dispatch → result back.
- **Synchronous by default,** `--async` opt-in. Both run over the proven
  `setsid`-detach + PID-file + poll engine
  (`.claude/skills/_shared/pi-reviewer-engine.md`) because a plain blocking
  `timeout … pi` can be SIGKILLed mid-thought (engine `:8-10`). Default blocks
  the wrapper until the result lands (simple request/response); `--async`
  returns a handle for fan-out / known-long jobs.

## Roles

Four of Fusion's roles; `scout` dropped (Claude keeps Grep/Glob, so a discovery
role would duplicate the brain's own eyes).

| Role | Model (from `agentOverrides`) | Why delegated |
|---|---|---|
| **worker** | `minimax/MiniMax-M3` | the only writer; blocked on Claude, so it *must* be delegated |
| **reviewer** | `openai-codex/gpt-5.6-sol` | fresh-context risk review; the pattern that works best |
| **planner** | `cliproxy/claude-opus-5` | fresh-context planning for complex multi-file work |
| **researcher** | `openai-codex/gpt-5.6-terra` | current external facts; needs web tools loaded (not a lean launch) |

**Sourcing rule (correctness-critical):** the wrapper takes **model + tools
from `.pi/agent/settings.json` `subagents.agentOverrides`** and **persona body
from `.pi/agent/extensions/pi-subagents/agents/<role>.md`** — *never* the
`tools:` from the persona frontmatter. `reviewer.md` frontmatter declares
`edit, write, intercom`; `agentOverrides.reviewer` strips those to
`read/grep/find/ls/bash`. Taking tools from the frontmatter would give the
reviewer write access and break Fusion's "reviewer never writes" invariant.
One source for capability (settings), one for behavior (persona).

**Deliberately dropped:** pi-subagents' RPC bridge, supervisor channels, and
steer/wait/capability-token plumbing (`pi-args.ts` `PI_SUBAGENT_*`). That
exists so an interactive Pi *parent* can steer long-lived children. Claude's
model is fire-fresh-and-read-result; no control plane needed.

**Researcher caveat:** `web_search`/`web_fetch` come from `rpiv-web-tools`
(registered in settings' `packages` array), so a researcher launch cannot use a
bare `--no-extensions --tools read`; it must load the web tools. Whether
`--no-extensions` suppresses `packages`-registered tools is unverified — resolve
by test at build time, not by assumption.

## Activation

- **Switch:** a `claude` key in `~/.config/fusion/config.json`
  (`{ "claude": "on"|"off" }`), falling back to Fusion's `defaultMode` when
  absent, defaulting to match so both tools move together but *can* diverge
  (Pi-fusion-on while Claude-off, or vice-versa). Adding `claude` is harmless to
  Pi — `readGlobalDefaultMode` reads only `defaultMode` and ignores other keys.
- **Read live:** hooks read the flag on every call, so toggling takes effect
  mid-session with no session-id plumbing.
- **Human-driven only.** The operator flips it with the `claude-fusion
  on|off|status` helper (`bin/claude-fusion`, on PATH via `install.sh`; edits the
  `claude` key, leaves `defaultMode` alone) — or any `!`-shell edit of the config.
  The helper is deliberately NOT on the Bash allowlist, so the blocked brain
  cannot run it to unblock itself — same posture as `block-path-access.sh`'s
  self-disarm guard.
- **Per-project escape hatch:** `.claude/.fusion-off` forces it off in one repo
  regardless of the global switch.

## Delegation contract & retry ladder

Inherited verbatim from ADR 0002. Every `worker` delegation carries all five:
Objective / Files / Interfaces / Constraints / Verification. Retry ladder:
(1) first miss → correct and re-run the worker; (2) second miss → parent
dictates the exact patch; (3) still failing → stop and revise the plan. No
blind loops, no model switching inside a task.

## Wiring requirement (do not skip)

`switch-provider.sh:6` copies a `settings-<provider>.json` over live
`~/.claude/settings.json` unconditionally. The new hooks **must** be added to
`settings.json.template` **and** every `settings-<provider>.json`
(`anthropic`, `moonshot`, `openrouter`, `zai`) or they vanish on the next
provider switch.

> **Pre-existing gap surfaced during design (not caused by this ADR):** the
> current `block-bash-pattern.sh` / `block-path-access.sh` PreToolUse hooks and
> the statusline exist only in `settings.json.template`, not in any provider
> file — so those safety blocks already silently disappear after a
> `switch-provider` run. Worth fixing alongside this work.

## Amendment to ADR 0002 (proposed, decided separately)

Claude keeps discovery (`Grep`/`Glob`) on the brain; Fusion's Pi-parent cannot
`grep`/`find`/`ls` (`PARENT_ALLOWED_TOOLS`, ADR 0002:56). The operator reports
that block bites often. Candidate follow-on: loosen Fusion's parent to keep
discovery too, for one consistent "the brain keeps its eyes" rule across both
tools. Recorded here; to be decided against ADR 0002 directly.

## Considered options (rejected)

- **Soft nudges only (no hard block).** Rejected for this ADR — the operator
  explicitly chose enforcement after repeatedly failing to self-delegate.
  (Retained as the fallback if `/fusion off` ends up used more than on.)
- **Nested `pi --fusion` worker.** Rejected — double orchestration, doubled
  latency, blurred plan ownership.
- **Native Claude Task subagents.** Rejected — Anthropic-model-only; cannot
  reach Pi's configured cheap models, which defeats the cost lever.
- **Block Claude's discovery too (scout-only).** Rejected initially — bets that
  Pi scout summaries suffice to spec and review from; they don't yet. Revisit
  if Claude's context bloat measurably costs Anthropic tokens.
- **Single unified switch (`defaultMode` for both).** Rejected — independent
  `claude` key costs one key and preserves the option; a unified switch cannot be
  un-merged later.

## Consequences

- Claude stops being a discovery+edit engine and becomes a judgment engine that
  dispatches; grunt work runs on non-Anthropic models in fresh processes.
- The Bash allowlist is the main friction source (every `mkdir`/`cp`/`mv`/
  `curl` routes through Pi). That friction is the point; `.claude/.fusion-off`
  is the release valve for sessions that genuinely want the full tool set.
- Enforcement is a role gate, not a security sandbox (same caveat as ADR 0002).
- The payoff is real only for work that belongs on cheap models. For
  quality-sensitive changes, toggling off and letting Claude write directly is
  correct, not a failure of the mode.
