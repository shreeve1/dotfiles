---
name: ralph
description: Run the Ralph implementation loop. Picks up the next unblocked issue from the local kanban and implements + reviews it in fresh sessions, one issue per invocation. Use when the user wants to run the Ralph loop, implement the next issue, or grind through the board.
---

# Ralph Loop

Pick up the next unblocked issue from `.kanban/` and implement it end-to-end in a fresh session. Then review it in a separate fresh session. Then stop. The user (or `ralph-loop.sh`) re-invokes `/ralph` for the next issue.

## Philosophy

- **One issue per invocation** — bounded scope, fresh context every time. No batching.
- **Fresh session for implement, fresh session for review** — the implementer and the reviewer must not share a context window. A fresh reviewer catches what the implementer rationalized away.
- **Every issue is buildable** — `/to-issues` already guaranteed each slice is verifiable by an automated check. Ralph just executes.
- **Vertical slice or nothing** — implement the whole tracer bullet; do not stop at one layer.
- **Memento approach** — clear beats compacting. `.kanban/progress.md` carries architectural continuity between sessions.

## Execution modes

Run Ralph interactively with `/ralph`. This skill processes exactly ONE issue per invocation, then stops. User runs `/ralph` again for the next issue. Reviewer pass within this skill is performed by spawning a fresh `claude -p` via bash so the review context is genuinely separate.

`ralph-loop.sh` can drive Ralph with `claude`, `opencode`, or `pi`:

```bash
tralph claude
tralph opencode
tralph pi
```

For Pi, the wrapper runs a fresh non-interactive turn equivalent to opencode's run mode:

```bash
pi --no-session --skill "$HOME/.claude/skills/ralph" -p "/skill:ralph"
```

The explicit `--skill` is required because this Ralph skill lives under `~/.claude/skills/ralph`, not Pi's normal skill directory.

## Pre-flight Checks

Before starting ANY implementation:

### 1. Dirty worktree baseline

```bash
git status --porcelain
```

If there are uncommitted changes:
- **Do not stop.** Ralph supports running with a pre-existing dirty worktree.
- Treat current `git status --porcelain` output as the **baseline dirty state**.
- Report the baseline dirty files briefly so the user knows they are being ignored.
- Do **not** stage, commit, stash, revert, or modify baseline dirty files unless the current issue explicitly requires touching them.
- At every commit gate, stage only files changed for the current issue. Never use `git add -A` or `git add .` while a baseline dirty state exists.
- After each Ralph commit, clean known ephemeral artifacts (below), then verify the worktree returned to the same baseline dirty state. If new uncommitted changes remain beyond baseline, stop and fix before continuing.

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
- If the only new dirty state beyond baseline is one of these artifacts, clean it and continue to review/done.
- If unknown untracked files appear, stop and ask.

### 2. Stale lock recovery

Check for issues with `status: in-progress` where `updated` is older than 30 minutes:
```
Stale lock detected: #2 Auth API (in-progress for 45 min)
Reset to pending? [Y/n]
```

If the user confirms (or if running unattended), reset to `status: pending` and log the recovery in progress.md.

### 2a. Active issue resume

Before scanning for new pending issues, check for issues with `status: in-progress` or `status: review`.

If exactly one active issue exists:
- Treat it as an interrupted prior Ralph run and resume it instead of declaring `0 ready`.
- If `status: review`, run the mandatory fresh review and then mark done/blocked from the review result.
- If `status: in-progress`, inspect the issue, recent commits, and `git status`:
  - If implementation is already committed and no issue-created uncommitted files remain, move to `review` and run the fresh review.
  - If issue-created uncommitted files remain, continue implementation/verification from there.
  - If state is ambiguous, stop and ask.

If multiple active issues exist, stop and ask which one to resume. Do not reset active issues to pending unless explicitly requested or stale-lock recovery confirms reset.

### 3. Board validation

Run a quick validation:
- All `blocked_by` IDs reference existing issues
- No cycles in the dependency graph
- Required fields present
- Each issue has a `## Verification` section with a concrete command

If validation fails, report errors and stop. Do not implement on a broken board.

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
7. **Verify** — run the exact command from the issue's `## Verification` section. Also run lint and typecheck if the project has them.
8. **COMMIT NOW (MANDATORY GATE).** Before moving to review, all issue-created changes MUST be committed. Run:
   ```bash
   git status --porcelain                 # compare against baseline dirty state
   git add <issue-file-1> <issue-file-2>  # stage only files changed for this issue
   git commit -m "feat(#ID): brief description"
   git status --porcelain                 # MUST match the baseline dirty state
   ```
   If `git status --porcelain` shows new uncommitted changes beyond the baseline dirty state after this step, first clean allowed ephemeral artifacts. If anything else remains, STOP and fix. Do not proceed to review with uncommitted issue work.

   This commit is NOT optional and NOT conditional on "if the project uses git". Ralph is only invoked inside git-tracked projects. If the working dir is not a git repo, abort the whole skill at pre-flight. Never use `git add -A` or `git add .` here unless the baseline dirty state is empty and every changed file belongs to this issue.

### 4. Review in a fresh session (MANDATORY, NOT OPTIONAL)

**You MUST complete this review before marking the issue done. There is no in-session review fallback.** Issue status sequence is: `pending` → `in-progress` → `review` → `done`. You may never skip `review`.

**Review procedure:**

1. **Set status to review** — update the issue file to `status: review`.
2. **Commit that status change** — stage only the current issue file (and `.kanban/progress.md` if touched), then `git commit -m "review(#ID): brief description"`. Do not stage unrelated baseline dirty files.
3. **Spawn a fresh review session via bash** — the reviewer must NOT inherit the implementer's context:

   ```bash
   claude -p \
     --no-session-persistence \
     --permission-mode bypassPermissions \
     --system-prompt "You are a read-only issue reviewer. Do not modify files. Output PASS / PASS WITH NOTES / FAIL with reasoning per criterion." \
     --tools "Read,Grep,Glob,Bash(git status *),Bash(git diff *),Bash(git rev-parse *),Bash(git show *)" \
     <<'EOF'
   Review issue #<ID> in .kanban/issues/.
   Read the issue file, then run `git diff HEAD~1` and read every changed file.
   Verify:
   1. Every acceptance criterion checkbox is objectively satisfied.
   2. The verification command from the issue's ## Verification section passes (exit code 0).
   3. Lint and typecheck pass.
   4. No unrelated changes leaked into the committed diff (`git diff HEAD~1`), ignoring any pre-existing dirty worktree files outside the reviewed commit.
   5. Scope matches the issue — no scope creep.

   Output PASS / PASS WITH NOTES / FAIL with reasoning per criterion.
EOF
   ```

   The reviewer reads `.kanban/issues/<file>`, runs `git diff HEAD~1`, re-reads every changed file, and runs the verification command. It does not see anything from the implementer's session.

**Review outcomes:**
- PASS → `status: done`, check all boxes, write progress
- PASS WITH NOTES → `status: done`, but log notes for future reference
- FAIL → `status: blocked`, add `## Blocker` section explaining what failed. Do NOT retry in this session; the user re-runs `/ralph` after addressing the blocker.

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

### 6. Stop. One issue per invocation.

After completing an issue, report:

```
Done: #2 Auth API endpoint
Files changed: src/auth/api.ts, src/auth/schema.ts, tests/auth.test.ts
Progress logged to .kanban/progress.md
Next eligible: #4 (run /ralph again to pick it up)
```

Then exit. Do NOT continue to the next issue in the same session — fresh context per issue is the whole point. The user (or `ralph-loop.sh`) re-invokes `/ralph` for #4.

## Interruption Recovery

If the session is interrupted (crash, timeout, user cancel):

1. Check for `status: in-progress` or `status: review` issues
2. These are the issues that were being worked on
3. Do NOT assume they are done
4. On next `/ralph` run, the stale lock check will detect them and offer to reset
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
/grill-me → /to-prd → /to-issues → /kanban (board view) → /ralph (per-issue fresh-session loop)
```

`/to-issues` guarantees every slice is independently buildable and has an automated verification command. `/ralph` (or `ralph-loop.sh`) executes them one at a time, each in a fresh session, with a fresh-session review between implement and done.
