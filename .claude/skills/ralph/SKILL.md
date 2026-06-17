---
name: ralph
description: Run the Ralph implementation loop. Picks up the next unblocked issue from the local kanban and implements + reviews it in fresh sessions, one issue per invocation. Use when the user wants to run the Ralph loop, implement the next issue, or grind through the board.
---

# Ralph Loop

Pick up the next unblocked issue from `.kanban/` and implement it end-to-end in a fresh agent session. Then review it in a separate fresh agent session. Then stop. The user (or `ralph-loop.sh`) invokes Ralph again for the next issue.

## Philosophy

- **One issue per invocation** — bounded scope, fresh context every time. No batching.
- **Fresh session for implement, fresh session for review** — the implementer and the reviewer must not share a context window in the normal implementation flow. `--review-loop` is an explicit repair/audit mode where one fresh worker may both review and fix a selected issue.
- **Every issue is buildable** — `/to-issues` already guaranteed each slice is verifiable by an automated check. Ralph just executes.
- **Vertical slice or nothing** — implement the whole tracer bullet; do not stop at one layer.
- **Memento approach** — clear beats compacting. `.kanban/progress.md` carries architectural continuity between sessions.

## Execution modes

Run Ralph interactively by invoking this skill in an agent session. This skill processes exactly ONE issue per invocation, then stops. User runs Ralph again for the next issue.

`ralph-loop.sh` can drive Ralph repeatedly with either:

- `tmux` — generic interactive agent controlled with `tmux send-keys` (default, normal tmux server)
- `pi` — fresh non-interactive Pi turn per issue

Useful runner examples:

```bash
tralph                                      # normal tmux, default Pi agent (openai-codex/gpt-5.5)
tralph --review-loop                        # actionable audit/unblock pass over existing issues
tralph --no-auto-review-blocked             # disable inline auto-repair; a BLOCKED issue stops the loop
tralph --no-review-each                     # disable the default per-issue review on DONE (trust the implementer)
tralph --lsp-check-cmd 'pyright changed.py' # optional post-worker critical LSP gate
tralph --private-tmux                       # isolated Ralph tmux socket
tralph --agent-cmd 'pi --model openai-codex/gpt-5.5' tmux
tralph pi                                   # Pi non-interactive adapter
```

### Inline auto-review on block (default)

By default (`AUTO_REVIEW_BLOCKED=true`), when an implement worker returns
`RALPH_RESULT: BLOCKED #<id>`, `ralph-loop.sh` does **not** stop. It spawns a
fresh actionable-review/repair worker (the same protocol `--review-loop` uses)
against that exact issue, then continues the implement loop:

- repair succeeds → issue goes `done`, the loop keeps implementing (and any
  downstream issues it just unblocked become eligible);
- repair cannot fix it → the issue stays `blocked` (parked) and the loop moves
  on to the next eligible pending issue.

This makes a single `tralph` run self-healing instead of requiring the manual
`tralph` → block → `tralph --review-loop` → `tralph` ping-pong. Opt out with
`--no-auto-review-blocked` (BLOCKED becomes fatal again) or
`RALPH_AUTO_REVIEW_BLOCKED=false`. `--skip-blocked` still means *park without
repairing*, and in `--review-loop` mode the flag is a no-op (it is already a
repair loop).

It also drains **pre-existing** `blocked` issues: once a run has no fresh
pending or active work left, the loop repairs already-`blocked` issues one at a
time (lowest priority, then id) via the same repair worker, then re-scans — a
repaired blocker may unblock downstream pending work the loop then implements.
Each blocked issue is attempted at most once per run; if it still can't be
fixed it stays `blocked` (parked) and the run completes. So a plain `tralph`
now covers what previously required a separate `--review-loop` pass. A blocked
issue is never re-selected by the implement scan (it is no longer `pending`),
and the per-run attempt set prevents repair/implement cycling.

### Per-issue review on DONE (default on)

Every `DONE` gets an independent fresh-session review — the implementer never
just self-certifies. Without this, the only independent reviewer fires on
`BLOCKED` (above) or in the separate `--review-loop` pass, leaving a gap: a
silently wrong "done" issue is accepted and later issues get built on top of it
before any out-of-band review runs.

After every `DONE`, once the implementation is committed, the loop spawns a
fresh reviewer scoped to that issue, diffing the pre-worker base
(`REVIEW_BASE_SHA` captured before the worker ran) against `HEAD` so it sees the
whole implementation. The reviewer may edit/test/commit fixes in place:

- review confirms or repairs → issue stays `done`, loop continues;
- reviewer finds an unfixable gap → it flips the issue back to `blocked`
  itself, and the next scan (or `--auto-review-blocked` drain) handles it;
- the review worker times out / dies without a `DONE` sentinel → the driver
  parks the issue `done→blocked` with a Blocker note rather than trusting the
  unconfirmed completion.

**Verification is enforced at the review step, two ways:**

1. **Prompt mandate (all issue types).** The reviewer must run the issue's
   `## Verification` command exactly as written and may only emit `DONE` if it
   exits 0; otherwise it marks `BLOCKED`/`FAIL`. This covers prose verifications
   (e.g. "restart the service and confirm logs") that no script can run, because
   the reviewer is an agent that interprets them.
2. **Driver backstop (cleanly-runnable commands).** After the reviewer returns
   `DONE`, the driver itself re-runs the issue's `## Verification` command when
   it is composed only of backtick-quoted commands joined by connectives
   (e.g. `` `uv run pytest tests/x.py` and `uv run python -m py_compile y.py` ``).
   If it exits non-zero the driver overrides `DONE→blocked` and records the
   failing command — the reviewer's `DONE` is not trusted on faith. Prose
   verifications have no runnable command, so they fall back to the agent mandate
   above (`extract_runnable_verification` prints nothing and the gate is skipped).

Each issue is reviewed at most once per run (shares the
`ATTEMPTED_REVIEW_ISSUES` guard with the block-repair paths). Cost is roughly
**2x workers per issue** (implement + review). Disable with `--no-review-each`
(env `RALPH_REVIEW_EACH=false`) if you want to trust the implementer's own
`DONE` sentinel — e.g. a throwaway run where review latency/cost isn't worth it.

### Stall handling (tmux adapter)

Pi workers sometimes auto-compact at high context and then sit idle instead of
resuming the turn — previously the driver would poll fruitlessly until the
`ITERATION_TIMEOUT` (3600s) and waste the whole hour. The tmux monitor now
detects this: it hashes the visible pane each poll, and if the pane is
byte-identical for `RALPH_STALL_NUDGE_SECONDS` (default 120s) with no sentinel,
it sends `continue` to the worker — exactly what a human would type. An
actively-working worker animates its spinner/status line, so its hash keeps
changing and it is never nudged. After `RALPH_MAX_STALL_NUDGES` (default 3)
nudges with no progress the iteration gives up (returns failure, session left
alive for inspection) rather than waiting out the full timeout.

On startup the driver also kills any orphaned `ralph-<session>-*` worker tmux
sessions left behind by a previously killed driver, so you never have to
`tmux kill-session` by hand before re-running.

`--agent-cmd` is intentionally a shell command line. Quote paths with spaces yourself.

The loop runner is only an adapter. Ralph's durable contract is the board protocol, commit gates, fresh review session, actionable review loop, and sentinel output below.

## Sentinel output contract

When Ralph finishes an invocation, print exactly one final sentinel line:

```text
RALPH_RESULT: DONE #<id>
RALPH_RESULT: NO_WORK
RALPH_RESULT: BLOCKED #<id>
RALPH_RESULT: FAIL #<id>
```

Reviewer sessions print exactly one review sentinel line:

```text
RALPH_REVIEW: PASS
RALPH_REVIEW: PASS_WITH_NOTES
RALPH_REVIEW: FAIL
```

Human-readable notes may appear before the sentinel. `ralph-loop.sh` parses the sentinel instead of natural language.

## Pre-flight Checks

Before starting ANY implementation:

### 1. Pre-worker clean checkpoint

```bash
git status --porcelain
```

Before launching any worker, `ralph-loop.sh` must start from a clean git worktree.

Loop-level behavior when there are uncommitted non-ignored changes outside `.pi-lens/`:
- **Auto-commit all of them before implementation starts.** This includes tracked edits, deletions, and untracked non-ignored files, after cleaning known ephemeral artifacts.
- Run `git add -A -- . ':(exclude).pi-lens'` and commit with a checkpoint message such as `chore(ralph): checkpoint worktree before worker`.
- Verify `git status --porcelain -- . ':(exclude).pi-lens'` is empty after the checkpoint commit.
- If the checkpoint commit fails or the filtered worktree remains dirty, stop before launching the worker.
- Ignored files and `.pi-lens/` may remain; they are outside the git worktree cleanliness gate.

Worker-level behavior after launch:
- Do **not** create another pre-worker checkpoint commit. The loop already did that before launching the worker.
- Ignore `.pi-lens/` entirely. Use `git status --porcelain -- . ':(exclude).pi-lens'` for cleanliness checks.
- If filtered `git status` is dirty before implementation, clean known ephemeral artifacts and stop with `RALPH_RESULT: FAIL #<id>` if anything remains.

### 1a. Ephemeral artifact cleanup

Ralph may delete these untracked generated artifacts without asking because they are tool/session caches, not source:

- `.playwright-sessions/`
- `test-results/`
- `playwright-report/`
- `.pytest_cache/`
- `.ruff_cache/`
- `.mypy_cache/`
- `htmlcov/`

Rules:
- Delete only if untracked (`git ls-files -- <path>` returns nothing).
- Never delete tracked files or directories containing tracked files.
- Log what was removed.
- If one of these artifacts appears before a checkpoint or after a worker, clean it and continue.
- Ignore `.pi-lens/` entirely, whether tracked, untracked, or dirty.
- If unknown untracked non-ignored files outside `.pi-lens/` appear before a worker, include them in the checkpoint commit.

### 2. Stale lock recovery

Check for issues with `status: in-progress` where `updated` is older than the loop's per-issue iteration timeout (`--iteration-timeout`, default 3600s / 60 min). Do not use a shorter threshold than the iteration timeout, or a legitimately long-running worker will be treated as a stale lock and reset mid-flight.
```
Stale lock detected: #2 Auth API (in-progress for 75 min, past the 60 min timeout)
Reset to pending? [Y/n]
```

If the user confirms (or if running unattended), reset to `status: pending` and log the recovery in progress.md.

### 2a. Active issue resume

Before scanning for new pending issues, check for issues with `status: in-progress` or `status: review`.

If exactly one active issue exists:
- Treat it as an interrupted prior Ralph run and resume it instead of declaring `0 ready`.
- If `status: review`, run the mandatory fresh review and then mark done/blocked from the review result.
- If `status: in-progress`, inspect the issue, recent commits, and `git status`:
  - If implementation is already committed and the worktree is clean, move to `review` and run the fresh review.
  - If issue-created uncommitted files remain, the pre-worker checkpoint has already captured them; inspect recent commits and continue implementation/verification from there.
  - If state is ambiguous, stop and ask.

If multiple active issues exist, stop and ask which one to resume. Do not reset active issues to pending unless explicitly requested or stale-lock recovery confirms reset.

### 3. Board validation

Run a quick validation:
- All `blocked_by` IDs reference existing issues
- No cycles in the dependency graph
- Required fields present
- Each issue has a `## Verification` section with a concrete command
- The verification command uses the project's canonical runner, not a bare one off `$PATH`. If a command invokes a bare known runner (`pytest`, `jest`, `go test`, `npm test`, …) while the repo ships a wrapper (e.g. `scripts/pytest`, a venv binary, a `Makefile`/`justfile` target), warn — a bare runner that hits a system interpreter missing project deps will false-fail review and block working code.

If validation fails, report errors and stop. Do not implement on a broken board. A bare-runner warning is non-fatal: prefer fixing the issue's `## Verification` to the repo-correct invocation before implementing.

## Actionable Review Loop

`ralph-loop.sh --review-loop` runs an action-taking reviewer/unblocker. It is not read-only. It processes exactly one issue per invocation, then prints a `RALPH_RESULT` sentinel.

Selection order:
1. `blocked` — attempt to fix the blocker, verify, commit, and move through review to `done` if fixed. If still blocked, update `## Blocker`, commit blocker notes, and print `RALPH_RESULT: BLOCKED #<id>`.
2. `review` — run the review, fix any gaps found, verify, commit, and mark `done`; if not fixable, mark `blocked` with notes.
3. `in-progress` — finish or repair the implementation, verify, commit, then review.
4. `done` without valid `action_reviewed: YYYY-MM-DD` frontmatter — audit completed work. If correct, add `action_reviewed: <today>`, commit the issue metadata, and print `RALPH_RESULT: DONE #<id>`. If gaps are found, fix them, verify, commit, keep/mark `done`, add `action_reviewed: <today>`, and print `RALPH_RESULT: DONE #<id>`. If gaps cannot be fixed, mark `blocked` and print `RALPH_RESULT: BLOCKED #<id>`.

Actionable review rules:
- You may edit code, tests, issue files, and progress notes when review finds gaps or blockers.
- Do not create another pre-worker checkpoint commit; the loop already handled that.
- Ignore `.pi-lens/` entirely for cleanliness gates.
- Use `git status --porcelain -- . ':(exclude).pi-lens'` for before/after status checks.
- Stage only files related to the issue/review fix, except loop-level checkpoint commits.
- Run the issue verification command after fixes. If auditing `done`, rerun verification before adding `action_reviewed: YYYY-MM-DD`.
- Check critical LSP diagnostics for files touched by the issue. Fix real type/call/signature/import errors before DONE/PASS; document environment-only missing-import noise if it is outside the issue's control. If `--lsp-check-cmd` / `RALPH_LSP_CHECK_CMD` is configured, that command must pass after the worker.
- Record what was checked/fixed in `.kanban/progress.md`.

If no blocked, review, in-progress, or unreviewed done issue exists, print `RALPH_RESULT: NO_WORK`. `RALPH_RESULT: BLOCKED #<id>` is valid review-loop progress for a target that remains blocked after an attempted fix; the loop will not retry the same issue again in that run.

## Process

### 1. Scan the board

Read all `.kanban/issues/*.md` files. First resume any active `in-progress` or `review` issue per **Active issue resume** above. If there is no active issue, find issues where:
- `status: pending`
- All `blocked_by` IDs have `status: done` (or are archived)
- All children are `done` (if this is a parent)

Sort by priority (lowest number first), then by ID (lowest first).

If no eligible issues, report the board state and stop.

### 2. Pick the next issue

Show the user which issue is next:

```
Next up: #2 Auth API endpoint  priority:0
Blocked by: #1 (done)
Verification: npm test && npm run typecheck

1. Implement it now
2. Show full issue first
3. Skip to next
```

### 3. Implement (single issue, fresh context)

For the selected issue:

1. **Read** the full issue file — understand the vertical slice and the verification command.
2. **Set `status: in-progress`** — update the issue file immediately before starting work. This makes stale lock recovery work if the session crashes mid-implementation.
3. **Check progress notes** — read `.kanban/progress.md` for context from prior iterations. This is how architectural continuity survives the Memento approach. Cross-cutting decisions and conventions from earlier issues are recorded here.
4. **Explore** the relevant code — understand current state.
5. **Plan** — brief implementation approach (2-3 sentences max, not a full plan doc).
6. **Build** — implement the slice end-to-end. ONLY THIS ISSUE. Shared refactors needed by this slice go IN this slice. If a shared refactor is needed but not part of this slice, add it to progress.md as a note and handle it in the appropriate issue.
7. **Verify** — run the exact command from the issue's `## Verification` section. Also run lint and typecheck if the project has them. Check critical LSP diagnostics for touched files and fix real type/call/signature/import errors before proceeding; only environment-only missing-import noise may be documented instead of fixed.
8. **COMMIT NOW (MANDATORY GATE).** Before moving to review, all issue-created changes MUST be committed. Run:
   ```bash
   git status --porcelain -- . ':(exclude).pi-lens'  # should show only current issue changes
   git add <issue-file-1> <issue-file-2>             # stage only files changed for this issue
   git commit -m "feat(#ID): brief description"
   git status --porcelain -- . ':(exclude).pi-lens'  # MUST be empty after cleanup
   ```
   If filtered `git status` shows new uncommitted changes after this step, first clean allowed ephemeral artifacts. If anything else remains, commit or fix it before review. Do not proceed to review with uncommitted issue work.

   This commit is NOT optional and NOT conditional on "if the project uses git". Ralph is only invoked inside git-tracked projects. If the working dir is not a git repo, abort the whole skill at pre-flight. During normal issue commits, stage only files changed for the current issue; the loop-level pre-worker checkpoint is the only place that stages all dirty work.

### 4. Review in a fresh session (MANDATORY, NOT OPTIONAL)

**You MUST complete this review before marking the issue done. There is no in-session review fallback.** Issue status sequence is: `pending` → `in-progress` → `review` → `done`. You may never skip `review`.

**Review procedure:**

1. **Set status to review** — update the issue file to `status: review`.
2. **Commit that status change** — stage only the current issue file (and `.kanban/progress.md` if touched), then `git commit -m "review(#ID): brief description"`. The worktree should already be clean except for current issue changes.
3. **Spawn a fresh review agent session** — the reviewer must NOT inherit the implementer's context. Give the reviewer this contract:

   ```text
   You are a read-only issue reviewer. Do not modify files.

   Review issue #<ID> in .kanban/issues/.
   Read the issue file, then diff the IMPLEMENTATION against the base commit and read every changed file.

   Determine the diff base (do NOT use `git diff HEAD~1` — the status:review commit sits on top of the implementation, so HEAD~1 shows only the status flip):
   - If the loop provided an "Implementation base commit" SHA, use it: `git diff <BASE_SHA> HEAD`.
   - Otherwise compute it from the issue's own commits:
     ```bash
     FIRST=$(git log -F --grep="(#<ID>)" --reverse --format=%H | head -1)
     git diff "${FIRST}^" HEAD
     ```

   Verify:
   1. Every acceptance criterion checkbox is objectively satisfied.
   2. The verification command from the issue's ## Verification section passes (exit code 0). If it fails only because a bare runner resolved the wrong interpreter (e.g. `ModuleNotFoundError` from a system Python that lacks project deps), that is an environment/command defect, not a code defect: report it as a verification-command fix, do not FAIL the implementation on it.
   3. Lint and typecheck pass.
   4. Critical LSP diagnostics in touched files are fixed, especially type/call/signature/import errors. Environment-only missing-import noise must be explicitly identified, not silently ignored.
   5. No unrelated changes leaked into the implementation diff (the pre-worker checkpoint should have made the starting tree clean).
   6. Scope matches the issue — no scope creep.

   Output reasoning per criterion, then exactly one final line:
   RALPH_REVIEW: PASS
   RALPH_REVIEW: PASS_WITH_NOTES
   RALPH_REVIEW: FAIL
   ```

   The reviewer reads `.kanban/issues/<file>`, diffs the implementation against the base commit (per the diff-base rules above, not `HEAD~1`), re-reads every changed file, and runs the verification command. It does not see anything from the implementer's session. If the adapter cannot enforce read-only mode, check `git status --porcelain -- . ':(exclude).pi-lens'` before and after review and fail if the reviewer changed files outside `.pi-lens/`.

   Concrete spawn examples:

   ```bash
   # Pi non-interactive reviewer
   pi --no-session --model openai-codex/gpt-5.5 -p "$(cat reviewer-prompt.txt)"

   # Generic interactive reviewer
   tmux new-session -d -s ralph-review-<ID> "cd '$PWD' && exec pi --model openai-codex/gpt-5.5"
   tmux send-keys -t ralph-review-<ID>:0.0 -l "$(tr '\n' ' ' < reviewer-prompt.txt)"
   tmux send-keys -t ralph-review-<ID>:0.0 Enter
   ```

   Use whichever local agent CLI is available. The required invariant is fresh context plus the `RALPH_REVIEW` sentinel.

**Review outcomes:**
- PASS → `status: done`, check all boxes, write progress
- PASS WITH NOTES → `status: done`, but log notes for future reference
- FAIL → `status: blocked`, add `## Blocker` section explaining what failed. Do NOT retry in this session; the user invokes Ralph again after addressing the blocker.

### 5. Mark done + write progress

Update the issue file:
- `status: done`
- Each acceptance criterion checkbox: `- [x]`
- `updated: <today>`
- `actor: ralph`
- Add `## Implementation Notes` section with what was done

Append to `.kanban/progress.md`:
```markdown
## #2 Auth API endpoint — 2026-04-26

**What changed:** Created auth API endpoint with JWT validation, added schema migration
**Files:** src/auth/api.ts, src/auth/schema.ts, tests/auth.test.ts
**Decisions:** Used RS256 over HS256 for multi-service compatibility
**Conventions established:** All auth routes use /api/v1/auth prefix
**Notes for next iteration:** The refresh token endpoint is NOT in this slice — it's issue #6
```

Key additions to progress notes beyond what changed:
- **Conventions established** — so later issues stay consistent
- **Decisions** — architectural choices that affect later issues
- **Notes for next iteration** — things the next implementer needs to know

Progress notes are the continuity mechanism between context windows. This is how architectural decisions survive the Memento approach.

**Keep `progress.md` bounded.** Every fresh session reads the whole file, so it must not grow without limit. Structure it as two parts:
- A stable `# Conventions & Decisions` section at the top — the durable, still-true conventions and architectural decisions, deduplicated. Promote anything from a per-issue note that later issues must keep honoring into this section, and drop it from the chronological log.
- A `# Iteration Log` section below — the chronological per-issue entries. When the log gets long (rough guide: more than ~30 entries or the file is uncomfortably large to read in one pass), summarize the oldest entries into one-line digests and move the full text to `.kanban/archive/progress-archive.md`. The durable facts already live in the Conventions section, so the log can be trimmed safely.

### 6. Stop. One issue per invocation.

After completing an issue, report:

```
Done: #2 Auth API endpoint
Files changed: src/auth/api.ts, src/auth/schema.ts, tests/auth.test.ts
Progress logged to .kanban/progress.md
Next eligible: #4 (invoke Ralph again to pick it up)
```

Then print `RALPH_RESULT: DONE #<id>` and exit. Do NOT continue to the next issue in the same session — fresh context per issue is the whole point. The user (or `ralph-loop.sh`) invokes Ralph again for #4.

## Interruption Recovery

If the session is interrupted (crash, timeout, user cancel):

1. Check for `status: in-progress` or `status: review` issues
2. These are the issues that were being worked on
3. Do NOT assume they are done
4. On next Ralph run, the stale lock check will detect them and offer to reset
5. Check git status for uncommitted partial work — offer to stash or discard

## When to stop

- No more eligible issues (all blocked or done)
- Implementation fails twice on the same issue (escalate to user)
- User interrupts
- Agent encounters something ambiguous — stop and ask (Matt's Sand Castle rule)

## Error handling

If implementation fails:
1. Do NOT mark the issue as `done` or `review`
2. Set status to `blocked`
3. Add a `## Blocker` section to the issue describing what went wrong
4. Append to progress.md noting the failure and what was attempted
5. Report to the user with the blocker details
6. Stop. Do not pick up another issue in this session.

## Stop conditions (from Matt's AGENTS.md)

Immediately stop and escalate if:
- The task is ambiguous — you're not sure what to do
- The implementation requires deleting files outside the issue's stated scope
- Tests are failing and you can't fix them within scope
- You need credentials or environment variables you don't have
- You're touching files outside the issue's scope

## Full workflow context

```
/grill-me → /to-prd → /to-issues → /kanban (board view) → Ralph (per-issue fresh-session loop)
```

`/to-issues` guarantees every slice is independently buildable and has an automated verification command. Ralph (or `ralph-loop.sh`) executes them one at a time, each in a fresh session, with a fresh-session review between implement and done.
