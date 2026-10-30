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
  findings and corrects itself (a **gate**, not an audit), opening its new
  answer with a visible "Corrected:" line per changed claim. Checker failures
  only produce a warning; UNSURE claims are logged only, unless
  `VERIFY_FINAL_WARN=all`. The hook never blocks when the check itself fails.
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
- Scope: every final answer of 500+ characters in the main interactive
  session (raised from 200 on 2026-10-28: answers under 500 held 4% of catches
  for 8% of checks). An answer already found clean in the same directory
  within 24 hours is not re-checked (logged `cached`); some callers re-sent one
  long answer hundreds of times. One correction pass per turn (`stop_hook_active`). Kill switch
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
  the 500-character minimum applies only outside ledger mode.
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
  not ported: native Windows OpenCode runs PowerShell, and a false hold costs one
  retry.
- State is kept per root session; subagent (child) sessions are ignored.
- If the settle nudge fires, the answer after the cleanup turn is the one
  fact-checked. The check's own correction turn is never checked. At most one
  follow-up per run end and two per user prompt. A new user prompt stops a
  running check, and a result is dropped when any new turn started while it ran.
  A checker that fails or times out is only logged, even if it printed findings.
- Follow-ups go through `ctx.session.synthetic({ resume: true })`. It starts a
  new turn, so the `prompt`-metadata fallback in the plan was not needed.
- OpenCode loads the plugin once per location (twice in practice). The copies
  share module state and each receives every event, so events are handled once
  by id. Before that fix the checker got every answer twice.
- Editing a loaded plugin re-runs `setup` with the cached module: a change only
  takes effect after the background service (`opencode-cli`) restarts.
- Live check on wrk's native Windows OpenCode (2026-10-25): a false 256-char
  claim about `tests/run-all.sh --slow` got one follow-up with two FALSE lines
  about 5 s after the turn ended. The agent re-read the file and rewrote the answer, and the
  rewrite was not checked again. A one-line answer got no check. The gate denied
  a real `git commit` with the file list, and the commit went through after
  post-work-cleanup. Test: `tests/opencode-verify-final.test.mjs`.

## Addendum (2026-10-28): Pi completion check

- The grounding check asks whether the answer's claims are true. It cannot see
  work that was asked for and never mentioned. `verify-final --done` asks a
  second question: did the agent finish what the user asked? Its input is JSON
  `{"requests": [...], "answer": "..."}`. The checker splits the latest request
  into parts and answers `DONE` or `MISSING` for each, reading files where the
  answer claims a change. Earlier requests are context only.
- The Pi extension runs it next to the grounding check, at the same points
  (TUI after settle, headless at the boundary) and the same 500-character
  minimum, on turns that called edit, write or bash. A read-only question gets
  only the grounding check. When either check finds something, both findings go
  to the agent as one follow-up. The agent opens its rewrite with a
  `Missing: <part>; <now done, or why not>` line per part, or
  `Checked: <part> was done; <evidence>` when it disagrees. It must not take an irreversible step
  the user has not approved. The follow-up turn is never checked again.
- Same model, thinking level, cache and log as the grounding check; statuses
  `done_clean`, `done_missing`, `done_error`, `done_cached`, `done_skip_short`.
  `VERIFY_DONE=0` turns it off; `VERIFY_FINAL=0` turns off both.
- Why per-part verdicts: asked for a single `DONE`, the model answered `DONE` for
  a request with a part the answer never mentioned. Asked to list each part, it
  caught the missing part in 3 of 3 runs and passed the complete answer in 3
  of 3.
- Pi only for now. Claude Code, Codex, omp and OpenCode run only the grounding
  check.
- Tested end to end with real `pi -p` on minimax-m3: the agent was told to skip
  one of two requested edits. The check logged `done_missing`, the agent made
  the edit, and its answer opened with a "Missing:" line. Test:
  `tests/verify-final-done.test.sh`.

## Addendum (2026-10-30): Jev shadow beside the fact check

- In the TUI, every fact check also runs `.agents/bin/jev-shadow` (Jev `jev-1.14.0`, shadow only) and appends one row with both results to `~/.cache/verify-final-jev/<day>.jsonl` (kept 60 days); design `docs/superpowers/specs/2026-10-30-verify-final-jev-shadow-design.md`.
- The Jev side never reaches the agent and never delays GLM. `VERIFY_JEV_SHADOW=0` turns it off; `VERIFY_FINAL=0` turns off everything. A machine with no Jev key logs `jev_no_key` and sends nothing.
- A cached clean answer now prints `verify-final: no findings (same answer found clean earlier)` for `--harness pi` too, so the shadow row can mark it.

## Addendum (2026-10-29): Pi recommendation check

- The grounding check ignores recommendations, and the ledger check covers
  only grilling turns. Agents recommended architecture their system cannot
  support, such as a hook pi does not have. They also hand-built things the
  docs or an open-source project already cover.
  `verify-final --recommend` (same JSON input as `--done`) is a second opinion
  on every recommendation. Design: `docs/superpowers/specs/2026-10-29-recommendation-check-design.md`.
- The checker lists each recommendation and grounds it in local `memory/`,
  `docs/`, `AGENTS.md` and READMEs first. It then reads the system's official
  docs and, for a build recommendation only, looks for a popular open-source
  project. Verdicts: `IMPOSSIBLE`, `WRONG` (a false premise) and `EXISTS`, each
  with a URL or `file:line` it read. A line without a source is dropped.
  Sentinels: `NO_RECOMMENDATIONS` and `NO_FINDINGS`.
- Web search: the checker loads only the `rpiv-web-tools` extension, with
  `WEB_SEARCH_PROVIDER=exa`, which outranks the machine's config, so Exa's
  free monthly credit is the checker's alone. The prompt budget is 3 searches
  and 3 fetches per answer. Without that extension folder it runs on local
  sources and logs `web=0`. Timeout: `VERIFY_RECOMMEND_TIMEOUT` (300 s).
- The pi extension runs it in the TUI only, after every settled answer of 500+
  characters, on its own and not merged with the grounding and completion
  checks. A late result is never dropped. If the agent is idle, it starts a
  turn. If the agent is busy, it is queued with `deliverAs: "followUp"` and
  rides inside the newer prompt's run, so that run is not checked. The agent
  opens its rewrite with `Revised: <recommendation>; <why>` or
  `Kept: <recommendation>; <why the finding does not apply>`. At most one per
  prompt. `VERIFY_RECOMMEND=0` turns it off; `VERIFY_FINAL=0` turns off all
  checks. Statuses are `rec_*` in the same log.
- Live runs on `glm-5.3-flash` with Exa:
  - A Syncthing answer: `WRONG` on the `.tmp`-means-stuck premise, citing
    `docs.syncthing.net/users/syncing.html`. A second `WRONG` disputed
    "localhost relay", reading the answer's WSL network relay as Syncthing
    relaying. That is a misreading, and the agent's `Kept:` line handles it.
    No line on the timer, which is possible. 64 s.
  - An answer built on `pi.on("session_idle_timeout")`: `IMPOSSIBLE`, citing
    pi's `docs/extensions.md`, plus `WRONG` on the invented
    `idleTimeoutMinutes` setting. 52 s.
  - A factual summary: `NO_RECOMMENDATIONS` in 5 s.
  Test: `tests/verify-final-recommend.test.sh`.
