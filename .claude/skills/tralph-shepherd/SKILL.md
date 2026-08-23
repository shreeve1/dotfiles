---
name: tralph-shepherd
description: Periodic owner of a tralph (Ralph) tmux loop — every RALPH_SHEPHERD_INTERVAL seconds, drive the board: start the loop if it isn't running, triage blocked tickets (delegate implementation to a ralph worker or a single sub-agent, escalate judgment calls), relaunch the driver if it parked. Stop when the board is done or a judgment call is escalated to the user. The shepherd's own context stays minimal — its only writes are kanban ticket status/body and .kanban/progress.md; it does not edit source/test code, run the build/test suite, or commit code.
---

# tralph-shepherd

Watch over an active `tralph` run in the current repo. Treat the kanban as the source of truth and the loop's own log as the source of facts. Diagnose root causes and delegate the fix (to the loop or a sub-agent), then keep the loop running.

## Preconditions

Before doing anything:

1. `pwd` shows a directory containing `.kanban/issues/`. If not, stop — the shepherd has nothing to watch.
2. **Drive.** If `tmux has-session -t ralph-loop` fails, check the board first:
   - If every issue in `.kanban/issues/` is `status: done` (or there are no issues at all), do NOT start anything — the board is complete; print the summary and stop (see Termination).
   - If the only remaining work is blocked issues (0 pending, 0 in-progress, 0 review, ≥1 blocked), do NOT start the driver yet — it would hit `UNBLOCKED_COUNT==0 && ACTIVE_COUNT==0` immediately (ralph-loop.sh:1118), print `Ralph loop complete!`, and park. Go straight to the Delegate-or-raise decision for those blocked issues; the flip→pending (or out-of-loop work) is what makes the board pickable, and then you relaunch with real work for the worker.
   - Otherwise (there is already pending/in-progress/review work for a worker to pick up) the shepherd owns startup: from the project root,
     `bash ~/.claude/skills/ralph/ralph-loop.sh tmux ralph-loop`. The script defaults `RALPH_MODEL=minimax/MiniMax-M3` internally (line 45), same as `tralph`; `tralph` is a zsh function and is unavailable in a skill context. If the script prints the has-session guard (source wording `⚠️  Tmux session '$SESSION_NAME' already exists on $TMUX_DISPLAY`, line 274), another driver just started — verify with `tmux has-session -t ralph-loop` and continue the cycle; do NOT kill anything.
3. Only one shepherd at a time. If a previous shepherd is still running in another session, stop.
4. This skill assumes the default tmux server (the `--normal-tmux` behavior; see `ralph-loop.sh` line 73). A `--private-tmux` loop is out of scope — different socket, different session name, different worker naming — do not try to shepherd one.

## Cycle

The shepherd is a **PERSISTENT LOOP**. Repeat the following pass until
Termination or a Raise — do NOT stop after one pass, and do NOT end the
session while the board still has work.

Each pass, in order:

1. **Gather signals** (the read-only block below).
2. **Triage + act** (Triage table → Delegate-or-raise / Relaunch as applicable).
3. **Arm the next check.** Run exactly one foreground bash call and wait for it to return:
   ```bash
   sleep "${RALPH_SHEPHERD_INTERVAL:-600}"
   ```
   10 min default; override via the env var. If your environment caps a
   single command's duration, loop several shorter sleeps totalling the
   interval instead — but you MUST wait the full interval before
   re-checking, so you don't hammer the board or the log.
4. **Go back to step 1.**

Exit the loop ONLY by: Termination (board done), Raise (judgment call →
report + stop), or a Precondition stop. In every other state — including
right after delegating a ticket, relaunching the driver, or a "Sleep"
triage row — you fall through to step 3 (sleep) and then step 1
(re-gather). Never treat "delegated a ticket" or "nothing to do this
pass" as a reason to end; arm the timer and continue.

**Exception — out-of-loop `task` sub-agent this pass.** If you spawned an
out-of-loop `task` sub-agent this pass (DELEGATE OUT-OF-LOOP WORK path),
wait on that sub-agent's completion via the hub instead of a blind sleep,
then go to step 3 (sleep the interval) and step 1 (re-gather). The
sub-agent's work must land before you sleep on the interval.

### Gather signals (read-only)

Run these in order from the project root.

```bash
# 0. Board state — primary triage key. The loop's UNBLOCKED_COUNT excludes
#    blocked issues (count_unblocked_pending, line 516+), so a parked driver
#    with blocked issues on the board can still look "complete" by banner.
for s in pending in-progress review blocked done; do
  printf '%-12s %s\n' "$s:" \
    "$(grep -l "^status: $s$" .kanban/issues/*.md 2>/dev/null | wc -l | tr -d ' ')"
done

# 1. Driver log tail — the loop writes to $HOME/.cache/ralph-loop-ralph-loop.log
LOG="$HOME/.cache/ralph-loop-ralph-loop.log"
tail -n 20 "$LOG"

# 2. Live tmux sessions
tmux ls

# 3. Worker session name pattern: ralph-ralph-loop-<N> (N = iteration).
#    Driver session: ralph-loop. Active worker (if any) is the highest-N.
#    Capture only when one exists; capture-pane on a missing target errors.
WORKER=$(tmux ls -F '#{session_name}' 2>/dev/null \
  | grep '^ralph-ralph-loop-[0-9]' | sort -V | tail -1)
if [[ -n "$WORKER" ]]; then
  tmux capture-pane -p -t "${WORKER}:0.0" -S -30
fi

# 4. Blocked-issue scan + Blocker sections
grep -l '^status: blocked$' .kanban/issues/*.md 2>/dev/null
for f in $(grep -l '^status: blocked$' .kanban/issues/*.md 2>/dev/null); do
  echo "=== $f ==="
  awk '/^## Blocker/{p=1; print; next} /^## /{p=0} p' "$f"
done

# 5. Unattended fail-state sentinel
ls -la "$HOME/.cache/ralph-fails-ralph-loop" 2>/dev/null

# 6. Review-loop mode — review-loop banners only appear when the loop was
#    started with --review-loop. If you see them, do NOT flip blocked→pending;
#    the loop's own selection order (blocked → review → in-progress → done,
#    line 489) re-picks blocked issues itself.
grep -cE 'Ralph review loop complete!|No actionable review targets found|Review target:' "$LOG" 2>/dev/null

# 7. Driver pane state — is it a bash prompt (driver exec-bash'd and parked)?
#    The bash-prompt heuristic alone is weak: the pane can sit static up
#    to 7200s while the driver is between iterations. Corroborate with
#    one of the unambiguous park/finish log markers (or with the driver
#    session being gone) — only then is "parked" real; otherwise assume
#    between-iterations and sleep.
tmux capture-pane -p -t ralph-loop:0.0 -S -5 2>/dev/null | tail -3
grep -E 'Ralph loop complete!|Stopping loop|Ralph Loop finished at|Press Ctrl\+D' "$LOG" | tail -3

# 8. Supervisor presence — ralph-loop.service may be enabled, in which case
#    ralph-supervise.sh will relaunch within ~10s of the driver dying. Don't
#    race it. Failure here (no session bus) is fine — proceed.
systemctl --user is-active ralph-loop 2>/dev/null || echo "supervisor-unreachable"
```

Track per-cycle: whether the driver pane shows an active worker prompt (▶ /
spinner), whether it shows a bash prompt (parked), and whether `⚠️  Agent
prompt not detected after` appeared this cycle AND the previous cycle.
A single occurrence is non-fatal — `wait_for_agent_ready` is tolerated
(`|| true`, line 717) and the prompt is sent anyway. Only treat it as a
stall when it persists across two consecutive cycles AND the pane is
dead-looking (no spinner, no progress).

### Triage

BOARD STATE IS THE PRIMARY KEY. The loop's `count_unblocked_pending`
(line 516) only counts `status: pending` with satisfied `blocked_by`;
`count_actionable_review_targets` (line 461) only counts blocked/review/
in-progress/done-without-action_reviewed. Neither counts `status: blocked`
for the pending path, so a parked driver with blocked issues on the board
can still print `Ralph loop complete!` (line 1118-1122). Trust the board,
not the banner.

First read the per-status counts from step 0 of "Gather signals". Then:

| Board state | Driver/worker state | Action |
|---|---|---|
| any pending, in-progress, review, or blocked exists | driver between iterations (no worker session, no parked bash prompt) | **Sleep.** Loop is launching the next worker. |
| any pending, in-progress, review, or blocked exists | worker session live, pane shows active spinner/▶ | **Sleep.** Worker is working. |
| any pending, in-progress, review, or blocked exists | driver pane is bash prompt (`exec bash` parked) | **Delegate-or-raise or relaunch path** below. |
| any pending, in-progress, review, or blocked exists | worker session live, pane dead (no spinner, no progress) | **Stall or worker-crash.** Read `⚠️  Worker still idle after`, `⚠️  Timed out waiting for Ralph sentinel after`, or `⚠️  Interactive agent session exited before printing a sentinel` in the log; root-cause from the worker pane; see "Relaunch" once parked. |
| all issues `status: done` | any | **Termination.** Summarize and stop. |
Each "**Sleep.**" row above means proceed to step 3 (arm the interval timer) and then re-gather — it is never a reason to stop the session.

#### Delegate-or-raise or relaunch path (board has work, driver parked)

1. **Blocked issues present?** `grep -l '^status: blocked$' .kanban/issues/*.md`. For each: see "Delegate or raise?" below. Then return to step 0 next cycle.
2. **No blocked issues, but pending/in-progress/review exist?** Diagnose why the loop parked: read the last `Stopping loop`/`Ralph Loop finished at` line and the worker pane. The cause is a code-local defect (worker stall, timeout, sentinel failure) — surface it as a blocker via the loop's own failure path or by raising to the user. Then see "Relaunch".
3. **Worker session still alive but stale** (`tmux has-session -t ralph-ralph-loop-<N>` true, pane dead): the driver has not parked yet but the worker is hung. Wait one cycle before deciding; if the next cycle still shows the same dead worker, treat as parked.

### Fixing blocked issues

Before flipping anything, **detect review-loop mode**. Step 6 of "Gather
signals" counts review-loop banners. If the count is non-zero, the loop is
running with `--review-loop`: it picks blocked/review/in-progress/done-
without-action_reviewed in that order (line 489) and ignores `status:
pending` entirely. **Do NOT flip blocked→pending in review-loop mode** —
the loop is supposed to re-pick the blocked issue itself. Just raise
anything that needs shepherd action.

### Delegate or raise? (decision step, applies to every blocked issue in normal mode)

The shepherd TRIAGES and DELEGATES — it does not implement. A live
ralph worker (fresh context) reads the ticket via `skill://implement`,
runs `## Verification`, and owns DONE. A `task`-spawned sub-agent (also
a fresh context) handles work the loop cannot do in a single-ticket
pass. The shepherd itself only writes the kanban ticket (status/body)
and `.kanban/progress.md`. **The shepherd never edits source/test
files, never runs the project's build or test suite, and never commits
code.**

For each blocked issue in normal mode, decide up-front. Three outcomes:

- **DEFAULT — hand back to the loop.** When the ticket's `## Blocker`
  already names concrete, code-local fix paths a single-ticket loop
  worker can execute (a ralph-review FAIL block is the canonical
  example: the reviewer wrote fix paths meant for the next Ralph pass),
  the shepherd's job is just to hand it back. Edit the ticket:
  frontmatter `status: blocked` → `status: pending`, and `updated:`
  to today's date. Append a one-line record to `.kanban/progress.md`:
  `#NNN unblocked <date>: <root cause>`.
  This line is the durable retry-bound record for loop-only delegation.
  Then relaunch the driver (Relaunch section) so a fresh-context ralph
  worker picks the ticket up, reads the Blocker, implements via
  `skill://implement`, and the worker's DONE verification gate runs the
  ticket's `## Verification`. The shepherd does NOT run it.

- **DELEGATE OUT-OF-LOOP WORK.** When unblocking the ticket requires
  work a fresh single-ticket loop worker cannot do by itself — a broken
  shared test harness/fixture, a cross-cutting prerequisite in other
  modules, finishing or repairing a FAILED ticket's partial/uncommitted
  edits, or an environment/dependency fix — spawn ONE sub-agent via
  the `task` tool whose prompt is
  `"Read skill://implement and follow it."` plus a tight objective:
  the specific out-of-loop fix, the ticket id for context, the exact
  verification expectation, and
  `"commit your work to the current branch, then report what you changed."`
  The sub-agent grounds/TDD/typechecks/tests/code-reviews/commits IN ITS
  OWN CONTEXT. The shepherd does NOT read the implicated source into its
  own context and does NOT do the edits. When the sub-agent returns
  having committed: append a `.kanban/progress.md` note
  `#NNN out-of-loop fix <date>: <what the sub-agent did>` (distinct
  prefix from `#NNN unblocked`, so a rerun can tell loop-only-delegation
  history from out-of-loop-fix history). Then branch on what the
  sub-agent actually delivered:
  - **Full satisfaction (no ticket implementation remaining):** flip
    `status: blocked → review`. The loop's review path resumes an
    already-`review` ticket directly into the fresh review +
    verification gate (ralph/SKILL.md §2a) — it does NOT re-implement.
    A pending ticket with work already committed gets re-implemented
    from scratch by a fresh worker, producing a redundant/conflicting
    diff, so do NOT flip to pending in this case.
  - **Partial (the ticket's own implementation still remains):** flip
    `status: blocked → pending` and relaunch so the loop resumes
    ticket closure with the out-of-loop fix as a base.
  - **Lighter variant — fix-plan only.** If you only need a fix-PLAN,
    not code, spawn a scout/investigation sub-agent that reads the
    relevant code in its own context and returns a plan. Paste that
    plan into the ticket body under a `## Shepherd guidance` heading,
    then proceed as DEFAULT (flip to pending, `#NNN unblocked <date>`
    progress.md note, relaunch). Use the full implement sub-agent
    above only when actual out-of-loop code must land.

- **RAISE with the user** (report + stop, driver stays parked) when ANY
  of these hold:
  - the fix requires deploying, restarting live services, touching
    secrets, or changing infra outside the repo,
  - the Blocker is ambiguous, points at two contradictory root causes,
    or names an external dependency the shepherd cannot inspect,
  - `.kanban/progress.md` already has a prior `#NNN unblocked` line
    for this issue id — the loop has already tried this delegation
    once and the ticket re-blocked; one retry max, do not re-delegate,
  - the ticket already has a prior `#NNN out-of-loop fix` line AND
    is still blocked — the out-of-loop fix didn't unstick the ticket;
    surface it to the user,
  - the ticket explicitly says do-not-deploy and the only real fix is
    a deploy decision,
  - the ticket has no `## Verification` (or equivalent sparkable
    command) — the worker's verification gate can't confirm anything,
    so raise to add one before re-delegating.
  When you raise: print the issue id, the Blocker summary, what you
  found, and your recommended fix, then stop. The driver stays parked
  (idle bash in tmux session `ralph-loop`); the blocked issue stays
  untouched; nothing is killed or relaunched. The user resumes by
  rerunning the skill after deciding, or by killing the session
  themselves.

#### Decision handoff on rerun

When the skill is rerun against an unchanged blocked issue (status
still `blocked`, Blocker section untouched), first look for a decision
artifact in this priority order: (a) the user rewrote the ticket's
Blocker section or changed its status, (b) a new `.kanban/progress.md`
note after your raise, (c) a direct instruction in this session. If
none of those is present, do not re-evaluate the fix — restate the
outstanding question (issue id, blocker summary, your recommended fix)
and stop.

### Relaunching a parked driver

Pre-flight, in order:

1. **Confirm the worker is actually idle/stuck.** A worker pane that shows an active spinner/▶ is mid-progress; killing the driver under it loses that work. Read `tmux capture-pane -p -t ralph-ralph-loop-<N>:0.0 -S -10`. If the worker is mid-progress, sleep one cycle — the driver is between iterations and you do not need to relaunch.
2. **Check the supervisor.** `ralph-loop.service` may be enabled with `Restart=on-failure`; killing the driver triggers `ralph-supervise.sh`'s own relaunch within ~10s. Run step 8 of "Gather signals". If it returns `active`, **do not relaunch manually** — the supervisor owns it. Sleep one cycle and re-check; the supervisor will have either brought the loop back or reported failure. (A `supervisor-unreachable` result is fine — most omp/agent contexts have no session bus; proceed with the manual relaunch.)

Relaunch commands, in order:

```bash
# Run from the project root (the dir containing .kanban/) — the script exits "No .kanban/ directory found" otherwise
tmux kill-session -t ralph-loop
# Orphan cleanup (lines 1003-1010) runs inside the new driver; you don't
# need to kill ralph-ralph-loop-<N> sessions by hand.
bash ~/.claude/skills/ralph/ralph-loop.sh tmux ralph-loop
```

If `bash ~/.claude/skills/ralph/ralph-loop.sh tmux ralph-loop` exits
with the has-session guard message (line 273-281; the source wording is
`⚠️  Tmux session '$SESSION_NAME' already exists on $TMUX_DISPLAY`),

re-check the board state — do not loop on `kill-session`/`new-session`.

The script's positional args are `[OPTIONS] [ADAPTER] [SESSION_NAME]`
(default adapter `tmux`, default session `ralph-loop`). `RALPH_MODEL`
defaults to `minimax/MiniMax-M3` inside the script — `tralph` is a zsh
wrapper that adds the env var; from a skill context, run the script
directly.

## Hard rules

- **The shepherd triages and delegates; it does not implement.** Never edit files under the project source/test tree, never run the project build or test suite, never commit code. Implementation happens in a ralph worker (DEFAULT — flip→relaunch; the worker reads `skill://implement`), in a single sub-agent that itself follows `skill://implement` (DELEGATE OUT-OF-LOOP WORK — out-of-loop fixes a single-ticket worker can't do), or in a scout sub-agent that returns a fix-plan only. The shepherd's only writes are kanban ticket status/body and `.kanban/progress.md`.
- **Never flip `status: blocked` → `status: pending` without a fix path a worker can act on.** Either the `## Blocker` already names a concrete code-local fix, or you have pasted a sub-agent's fix-plan into a `## Shepherd guidance` section. Never flip on a guess, and never run `## Verification` yourself — the worker's DONE gate handles that.
- **Never touch an issue a live worker holds.** If `status: in-progress` or `status: review` exists, that worker owns the file; the shepherd does not edit its frontmatter, body, or progress.md entry. (Progress.md entries for blocked→pending flips are fine — those issues are not held.)
- **Never edit `~/.claude/skills/ralph/ralph-loop.sh`, the ralph skill, or any other ralph script.** Diagnose bugs in the loop and report them; do not patch them from the shepherd.
- **One shepherd at a time.** If you find another shepherd active, stop.

## Termination

Termination keys off **board state alone**, not on any banner. The loop can
exit cleanly without printing `Ralph loop complete!` — the NO_WORK path
(line 1226-1229) only prints `✅ Ralph reports no eligible issues`, the
`Stopping loop` exits (lines 1140, 1188, 1258) skip the banner entirely,
and even the all-clear exit only sometimes emits `Ralph Loop finished at`
in the epilogue (line 1274). Don't gate on what the log says.

Terminate when the board counts from step 0 show **zero pending,
in-progress, review, and blocked** issues — every issue in
`.kanban/issues/` is `status: done` — AND the driver is parked or
finished (driver tmux session is gone, or its pane is a bash prompt after
`exec bash`). Print a one-paragraph summary of what was delegated or
escalated this run (issues re-handed-to-the-loop, issues raised to the
user with their outstanding questions), then stop. Do not poll past
completion.
