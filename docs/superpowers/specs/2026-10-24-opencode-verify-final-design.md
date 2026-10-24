# OpenCode verify-final plugin: design

Date: 2026-10-24. Status: draft, awaiting approval.

## Intent

Bring the Pi extension `.pi/agent/extensions/verify-final.ts` to OpenCode V2, so
OpenCode sessions get the same two guards as Pi, Claude Code and Codex
(ADR `docs/adr/0015-end-of-turn-verify-hooks.md`):

1. **Fact-check:** every substantial final answer is checked against the files by
   an independent read-only checker; FALSE claims go back to the agent so it
   corrects itself.
2. **Cleanup gate:** code this session changed gets `post-work-cleanup` before it
   is committed.

## Goals

- Same checker, same wording, same off switches (`VERIFY_FINAL=0`,
  `POST_WORK_CLEANUP=0`) as the other harnesses.
- Works on surftop (native Windows, PowerShell shell), where OpenCode is live.
  The code stays platform-neutral so it also works on Linux if OpenCode comes
  back there, but no Linux install changes are made (builder's call).
- At most one plugin follow-up per idle, and at most two per user prompt
  (one cleanup nudge, then one fact-check correction).
- State is per root session: one OpenCode server can host several sessions, and
  another session's edits must never be counted (same rule as Pi).

## Non-goals

- No change to `.agents/bin/verify-final` or its prompt.
- No exact commit-target parsing (Pi's bash parser is not ported).
- No headless-mode special case (`opencode run`); see Left to the builder.

## Anti-goals

- A follow-up loop: the plugin's own correction turn must never trigger another
  check or nudge.
- A broken checker blocking or nagging: a checker failure is at most a notice.
- Checking subagent (child) sessions: only the root session the user talks to.

## Constraints

- OpenCode V2 plugin API (`Plugin.define` / `setup(ctx)`). The existing plugins
  in `.config/opencode/plugins/` are V1-style (`@opencode-ai/plugin` 1.15.5).
- `.config/opencode` is linked to `~/.config/opencode` by `install-win.ps1` and
  `install.sh`, so `~/.config/opencode/plugins/` is the global discovery dir.
  `install.sh` marks OpenCode retired on Linux; in practice it is live on surftop.
- The checker shells out to `pi`; `pi` must be on PATH wherever this runs.
  On Windows the script runs as `python <path>` (no shebang support).

## Approaches considered

- **A. One plugin, reuses `verify-final --check -`. Chosen.** One copy of the
  checker prompt (in the script); one plugin coordinates both follow-ups.
  Costs a dependency on `pi`.
- B. One plugin calling the model directly via `ctx.generate.text`. Drops the
  `pi` dependency but forks the prompt and the grill-ledger logic.
- C. Two plugins. Simpler each, but they cannot easily share the
  one-follow-up-per-prompt cap.

James picked A.

## Design (decided)

### Turn tracking

- A user prompt starts a logical turn (prompt-admission hook, or the user message
  event). The plugin's own follow-ups do not start a new turn; they are recorded
  so the next idle after them is skipped.
- Child sessions (with a parent) are ignored throughout.

### Fact-check (end of turn)

- When the root session goes idle after a completed (not interrupted, not
  errored) run, read the last assistant message text.
- Skip when `VERIFY_FINAL=0`, the text is empty, or it is under 200 chars and has
  no grill marker (❓ or ➡️), same rule as Pi.
- Run `verify-final --check -` in the session's directory with the text on
  stdin, 180 s timeout, in the background.
- If stdout has a line starting `FALSE |` or `UNGROUNDED |`: send stdout to the
  session as a follow-up prompt.
- "no findings": do nothing. Anything else (UNSURE, could not run): a
  non-triggering notice if the API offers one, otherwise log only.
- Drop the result if a new user prompt arrived while it ran.

### Cleanup tracking

- On successful `edit` / `write` tool results, track the file by real path if it
  is a code file (same extension list as Pi) inside a git work tree, excluding
  harness paths (`.opencode/`, `.pi/`, `node_modules/`).
- A successful read of `post-work-cleanup/SKILL.md`, or the skill tool loading
  `post-work-cleanup`, counts as running the cleanup: tracked files are cleared,
  and edits for the rest of that prompt are not tracked.
- Before acting, prune tracked files that `git status` no longer shows as dirty.

### Commit gate (simplified)

- A shell command matching `\bgit\b[\s\S]*\bcommit\b` while tracked files exist
  and cleanup has not run this prompt is denied once per prompt, with Pi's gate
  wording and file list. Re-running the commit goes through.
- No repo targeting: held against all tracked files. A false hold costs one
  retry.

### Settle nudge

- At the same idle point, if tracked files are still uncommitted, cleanup has not
  run, and the gate did not already fire this prompt: send Pi's settle wording as
  a follow-up. Never asks for a commit.

### Coordination (builder's call, from the design check)

- At each root-session idle, the cleanup nudge is decided first (cheap, local).
- If the nudge fires, that answer is not fact-checked. The idle after the
  cleanup turn is then fact-checked instead: that is the answer the user reads
  last. This is the one exception to "skip the idle after our own follow-up";
  the fact-check's own correction turn is never checked or nudged again.
- If the nudge does not fire, the fact-check runs on this answer.
- So each idle gets at most one follow-up, and nothing waits on the 180 s check.
- A background result is dropped if any new turn (user or plugin) started
  while it ran.
- Hard cap: 2 plugin follow-ups per user prompt.
- All state (tracked files, prompt counter, gate/cleanup flags, running checker)
  is keyed by session ID; the gate only holds a session's commit for that
  session's own tracked files. The checker child is killed on session delete
  and plugin unload.

### Files

- `.config/opencode/plugins/verify-final.ts`: the plugin.
- `tests/opencode-verify-final.test.sh`: drives the plugin with a fake `ctx`
  against throwaway git repos (mirrors `tests/verify-final-cleanup.test.sh`).
  The scenarios live in a Node script with portable paths so it also runs on
  Windows; the symlink scenario is skipped where symlinks cannot be created.
- ADR 0015 addendum: OpenCode adapter, its simplified gate, `pi` dependency.

### Done means (builder's call)

- The fake-ctx test passes.
- A live check in OpenCode on surftop (where this session runs): a FALSE claim
  produces a correction turn, a commit with uncleaned code is held once then
  allowed, and a short answer is not checked. Results go in the ADR addendum.

## Left to the builder (verify against the V2 docs/API, then decide)

- Which API delivers "root session idle after a completed run" and the last
  assistant text (event stream `session.status`/idle plus `ctx.session.context`
  is the expected route).
- Gate mechanism: `ctx.permission.hook("evaluate")` setting `deny` with a message
  is preferred; fall back to `ctx.tool.hook("execute.before")` if permission
  evaluation does not run for shell commands under an `allow` rule.
- Follow-up delivery: `ctx.session.prompt` vs `ctx.session.synthetic`; pick the
  one that makes the model take a turn and reads as a system note if possible.
- Exact tool IDs and input field names for edit, write, read, shell and skill.
- Whether to keep the plugin as a single `.ts` file or a directory with
  `index.ts`; both are discovered under `~/.config/opencode/plugins/`.
