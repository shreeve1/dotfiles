# 0015 — Final answers are fact-checked by end-of-turn hooks in all three harnesses

**Status:** Accepted (2026-10-09); grill ledger mode added 2026-10-15 (see addendum)

## Context

The grounding check (ADR 0001) only ran where an agent chose to run it, or in
Pi's `gap-review` extension as a background audit whose findings the agent never
saw. Pi is now helper-only (ADR 0014), and day-to-day work happens in Claude
Code, Codex and omp.

## Decision

- One checker, `.agents/bin/verify-final`, reads a Stop-hook event
  (`last_assistant_message`, `cwd`, `stop_hook_active`) and runs the read-only
  `pi -p` checker from `_shared/verify-claims.md` on the final answer.
- A FALSE claim returns `{"decision":"block","reason":…}`: the agent gets the
  findings and corrects itself (a **gate**, not an audit). UNSURE claims and
  checker failures only produce a warning; the hook never blocks when the check
  itself fails.
- Adapters: Claude Code, Codex and omp. Claude Code and Codex `Stop` hooks are
  installed into the machine-local `~/.claude/settings.json` and
  `~/.codex/hooks.json` by `.agents/bin/verify-final-install` (run from
  `install.sh`, idempotent, replaces an outdated entry, `--remove` reverts).
  omp uses the `agent_end` extension `.omp/agent/extensions/verify-final.ts`.
- Claude Code runs the hook in the background (`asyncRewake`, script flag
  `--rewake`): you are not held up after the answer. A FALSE finding is written
  to stderr with exit 2, which wakes Claude with the findings. Claude sends
  `stop_hook_active=true` on the Stop that follows that wake and `false` on a
  fresh user turn (checked in a real session, including a new prompt sent right
  after a wake), so the correction pass is skipped by that flag alone; there is
  no state file. omp also runs detached, because omp aborts `agent_end`
  handlers after 30 s. Codex stays a blocking Stop hook: its background hooks
  cannot start a turn, so a correction would only arrive on your next message.
- Scope: every final answer of 200+ characters in the main interactive
  session. One correction pass per turn (`stop_hook_active`). Kill switch
  `VERIFY_FINAL=0`. Every outcome (checked, skipped, dropped) is logged to
  `~/.cache/verify-final.log` with the session id prefix and answer length.

## Consequences

- The correction appears after the original answer has streamed; nothing is
  buffered or hidden.
- Each answer costs one extra checker run (about 6 s in testing). Headless
  `claude -p` / `codex exec` runs driven by other tools are also checked unless
  `VERIFY_FINAL=0`.
- Codex does not run a hook until you trust it once (`/hooks`).
- omp's `-p` mode exits before the correction turn runs, so the extension acts
  only in the interactive TUI (or `VERIFY_FINAL_HEADLESS=1`, which logs but
  cannot complete the correction).
- Other tools that rewrite hook entries in the Claude/Codex configs may drop
  the hook; re-run the installer if it disappears.
- `asyncRewake` hooks are cancelled in `claude -p`, so print-mode runs get no
  check. Tested in a real interactive Claude Code session (v2.1.295): a FALSE
  finding wakes Claude and it corrects itself; an UNSURE result and a "check
  could not run" failure are shown nowhere on screen, only in
  `~/.cache/verify-final.log`. A broken checker is therefore silent in Claude
  Code; check the log if corrections stop appearing.
- The grill skills no longer run their own per-turn check; the hook covers
  each turn's final message. `grill-with-docs` still runs the independent
  verify once on a brainstorm intent doc.

## Addendum (2026-10-15): grill ledger mode

Grill sessions drifted into recommending things the target system cannot do,
and the checker never saw it: it ignored recommendations and only knew the
files the answer named. The `grilling` skill now keeps a ledger of the system
(decisions, documented capabilities and limits, observed facts) at
`.kanban/grilling/<topic>.md` under the working directory.

- The skill ends every grill turn with `Ledger: .kanban/grilling/<topic>.md`,
  and the checker reads that ledger only, so two grills in one repo never
  check against each other's decisions. A named ledger that does not exist
  (a typo) is never swapped for another: the turn gets a warning and no ledger
  check. With no named ledger, a turn in the
  grill question format (❓ / ➡️) falls back to the single newest ledger
  modified within `VERIFY_FINAL_LEDGER_HOURS` (default 24, so a grill paused
  overnight stays covered). Ledger turns are checked whatever their length;
  the 200-character minimum applies only outside ledger mode.
- FALSE: a recommendation breaks a ledger line without openly asking to
  revisit it. UNGROUNDED: a recommendation depends on a system-specific
  capability (vendor feature, endpoint filter, quota) that the ledger does not
  establish. Commodity ground is not flagged.
- UNGROUNDED goes back through the same correction channel as FALSE, worded as
  a steer: research the capability, record it in the ledger with its source,
  and restate the recommendation if the research changes it. It is
  intentionally after the fact. The skill's per-turn reread of the ledger is
  the primary grounding; the hook catches what slips through.
- Off switch for this mode only: `VERIFY_FINAL_LEDGER=0`.
- dsh and Pi have no hook. There the grilling skill runs
  `verify-final --check -` on each drafted turn before sending it (see
  `_shared/verify-claims.md`, "Grill turns"). It is the same prompt and parser,
  with findings printed as plain text; the script holds the only copy of the
  grill-check wording.
- The commodity-ground sentence in `LEDGER_PROMPT` is model-sensitive: before it
  was added, the checker flagged "aidev can run a timer" and "the list endpoint
  pages". Re-test it with a fixture ledger when the checker model changes.

## Addendum (2026-10-16): Pi post-work-cleanup is a commit gate plus a narrowed nudge

The Pi extension `.pi/agent/extensions/verify-final.ts` also asks for the
`post-work-cleanup` skill. Its first version diffed the whole repo's `git status`
between prompt start and settle. In sessions from 2026-10-15/16 that missed 11 of
19 code-editing prompts: the agent committed inside its own turn, so the tree was
clean again by settle. It also nudged sessions that had changed nothing. A
read-only review session was nudged because another session, ten seconds
earlier, had edited `~/.config/hypr/hyprland.lua`, a symlink into the repo.

- It tracks only this session's `edit`/`write` calls on code files, by real path,
  so a symlinked config maps to its repo file. Edits made through bash
  (`sed -i`, heredocs) are not seen.
- **Commit gate:** a bash `git commit` for a repo holding tracked, uncleaned
  files is blocked once per user prompt, and the block reason lists the files.
  The same commit then goes through, so the user can still skip the cleanup.
- **Settle nudge:** fires only while tracked files are still uncommitted, and
  never asks for a commit; committing stays with the task and the repo's rules.
- A successful read of the skill's `SKILL.md`, or `/skill:post-work-cleanup`,
  counts as running it. Kill switch: `POST_WORK_CLEANUP=0`. Test:
  `tests/verify-final-cleanup.test.sh`.
- Commits are found by parsing the bash command into simple commands. The
  parser handles quotes, `cd` (also on its own line; a `cd` inside `(...)`,
  `$(...)` or backticks stays inside), `-C`, `--git-dir`/`--work-tree` and
  `GIT_DIR=` prefixes, and skips heredoc bodies and comments. Every commit in
  the command is checked. When the target repo cannot be worked out
  (`cd "$(...)"`), the commit is held against all tracked files: a wrong hold
  costs one retry, a missed one costs the cleanup.
  Not seen: commits run through `eval`, `xargs`, `sh -c`, git aliases or a
  script; edits after the cleanup ran in the same prompt.
- Model-sensitive wording: a gate reason that offered "the change is trivial" as
  a reason to skip let the agent skip every time. It now says to skip only when
  the user said to.

## Addendum (2026-10-24): OpenCode adapter

OpenCode V2 gets the fact-check and the post-work-cleanup gate and nudge from one
global plugin, `.config/opencode/plugins/verify-final.ts` (loaded through the
`~/.config/opencode` link; no install step). It calls the same checker,
`.agents/bin/verify-final --check -`, so `pi` must be on PATH where OpenCode runs.

- Hooks: `tool` `execute.after` tracks `edit`/`write`/`patch` on code files;
  `permission` `evaluate` runs the commit gate; `session` `prompt` starts a new
  user prompt; the event stream gives each answer's text (`session.text.ended`),
  the end of a run (`session.execution.succeeded`, `failed`, `interrupted`), and
  `session.skill.activated`.
- Simplified commit gate: any `shell` permission resource matching `git … commit`
  is denied once per prompt while tracked files are uncleaned. Pi's bash parser is
  not ported: surftop runs PowerShell, and a false hold costs one retry.
- State is kept per root session; subagent (child) sessions are ignored.
- If the settle nudge fires, the answer after the cleanup turn is the one
  fact-checked. The check's own correction turn is never checked. At most one
  follow-up per run end and two per user prompt; a result is dropped when a new
  turn started while it ran.
- Follow-ups go through `ctx.session.synthetic({ resume: true })`. It starts a
  new turn, so the `prompt`-metadata fallback in the plan was not needed.
- OpenCode loads the plugin once per location (twice in practice). The copies
  share module state and each receives every event, so events are handled once
  by id. Before that fix the checker got every answer twice.
- Editing a loaded plugin re-runs `setup` with the cached module: a change only
  takes effect after the background service (`opencode-cli`) restarts.
- Live check on surftop (2026-10-25): a false 256-char claim about
  `tests/run-all.sh --slow` got one follow-up with two FALSE lines about 5 s after
  the turn ended. The agent re-read the file and rewrote the answer, and the
  rewrite was not checked again. A one-line answer got no check. The gate denied
  a real `git commit` with the file list, and the commit went through after
  post-work-cleanup. Test: `tests/opencode-verify-final.test.mjs`.
