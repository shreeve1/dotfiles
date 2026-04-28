---
name: ralph
description: Run the AFK implementation loop. Picks up unblocked AFK issues from local kanban and implements them one at a time with fresh context per issue. Use when user wants to run the Ralph loop, implement issues automatically, or do AFK coding.
---

# Ralph Loop

Pick up unblocked AFK issues from `.kanban/` and implement them one at a time. Each issue gets full attention — read, plan, implement, verify, review, mark done.

## Philosophy

From Matt Pocock's workshop and production workflow:
- **ONLY WORK ON A SINGLE ISSUE PER ITERATION** — bounded scope, no scope creep
- Each issue is a vertical slice (tracer bullet) — thin cut through all layers
- Fresh context per issue — stay in the smart zone (under 100k tokens)
- Implementation is AFK work — alignment already happened during /grill-me and /to-prd
- Mark done, write progress notes, clear, next issue — Memento approach, no compacting
- Implement-then-review — a second pass with fresh eyes catches what the implementer missed

## Pre-flight Checks

Before starting ANY implementation:

### 1. Dirty worktree check

```bash
git status --porcelain
```

If there are uncommitted changes:
- **STOP.** Do not start implementing.
- Report the dirty files to the user.
- Ask the user to commit or stash before running `/ralph`.
- Exception: changes made by a previous `/ralph` run that were committed as part of that issue.

### 2. Stale lock recovery

Check for issues with `status: in-progress` where `updated` is older than 30 minutes:
```
Stale lock detected: #2 Auth API (in-progress for 45 min)
Reset to pending? [Y/n]
```

If the user confirms (or if running unattended), reset to `status: pending` and log the recovery in progress.md.

### 3. Board validation

Run a quick validation:
- All `blocked_by` IDs reference existing issues
- No cycles in the dependency graph
- Required fields present

If validation fails, report errors and stop. Do not implement on a broken board.

## Process

### 1. Scan the board

Read all `.kanban/issues/*.md` files. Find issues where:
- `status: pending`
- `type: AFK`
- All `blocked_by` IDs have `status: done` (or are archived)
- All children are `done` (if this is a parent)
- Not in the HITL safety policy list

Sort by priority (lowest number first), then by ID (lowest first).

If no eligible issues, report the board state and stop.

### 2. Pick the next issue

Show the user which issue is next:

```
Next up: #2 Auth API endpoint [AFK] priority:0
Blocked by: #1 (done)

1. Implement it now
2. Show full issue first
3. Skip to next
```

### 3. Implement (single issue)

For the selected issue:

1. **Read** the full issue file — understand the vertical slice
2. **Set `status: in_progress`** — update the issue file immediately before starting work. This makes stale lock recovery work if the session crashes mid-implementation.
3. **Check progress notes** — read `.kanban/progress.md` for context from prior iterations. This is how architectural continuity survives the Memento approach. Cross-cutting decisions and conventions from earlier issues are recorded here.
4. **Explore** the relevant code — understand current state
5. **Plan** — brief implementation approach (2-3 sentences max, not a full plan doc)
6. **Build** — implement the slice end-to-end. ONLY THIS ISSUE. Shared refactors needed by this slice go IN this slice. If a shared refactor is needed but not part of this slice, add it to progress.md as a note and handle it in the appropriate issue.
7. **Verify** — run tests, lint, typecheck, or manual checks as appropriate
8. **Commit** — if the project uses git, commit with message: `feat(#ID): brief description`

### 4. Review (implement-then-review pattern — MANDATORY, NO EXCEPTIONS)

**This step is not optional.** You MUST complete the review before proceeding to step 5 or moving to the next issue. Skipping this step is the single most common failure mode — it means acceptance criteria go unchecked, scope creep goes undetected, and bugs ship without a second look.

After implementation, set the issue to `status: review` and run a review. **Do NOT set `status: done` until the review passes.** The issue status sequence is: `pending` → `in_progress` → `review` → `done`. You may never skip `review`.

**Review procedure:**

1. **Set status to review** — update the issue file to `status: review`.
2. **Commit that status change** — `git add .kanban/ && git commit -m "review(#ID): brief description"`
3. **Re-read the issue's acceptance criteria** — every single checkbox.
4. **Re-read every changed file** — open each file touched by the implementation and read it fresh, checking against the criteria.
5. **Run the full check suite** — tests, lint, typecheck. Record the output.
6. **Check `git diff HEAD~1`** — verify no unrelated changes leaked in and no scope creep occurred.

**What the review checks (completion gate):**
1. All acceptance criteria checkboxes are checked — each one is verified, not assumed
2. Tests pass (exit code 0)
3. Lint passes
4. Typecheck passes (if typed language)
5. No unrelated changes in the diff
6. Changes match the issue scope (no scope creep)

**Review options:**
- Option A (within same session, if tokens permit): re-read changed files, check against criteria
- Option B (recommended): mark `status: review`, start fresh session. A fresh reviewer context reads the issue and the diff, verifies each criterion.

**Review outcomes:**
- PASS → `status: done`, check all boxes, write progress
- PASS WITH NOTES → `status: done`, but log notes for future reference
- FAIL → `status: blocked`, add Blocker section explaining what failed

**Self-check before proceeding:** After completing the review, explicitly confirm to yourself: "I re-read every changed file and verified each acceptance criterion." If you cannot honestly say this, you have not completed the review.

### 5. Mark done + write progress

Update the issue file:
- `status: done`
- Each acceptance criterion checkbox: `- [x]`
- `updated: <today>`
- `actor: ralph` (or `human`)
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

### 6. Continue or stop

After completing an issue, report:

```
Done: #2 Auth API endpoint
Files changed: src/auth/api.ts, src/auth/schema.ts, tests/auth.test.ts
Progress logged to .kanban/progress.md
Next: #3 Review dashboard design [HITL] — needs human

Continue to next AFK issue? (#4 is ready)
```

If the next issue is HITL, flag it and stop — human needed.
If the next issue is AFK, offer to continue.

### 7. Smart zone discipline

After completing 2-3 issues (or when you notice quality dropping), STOP:

```
Quality signal detected. STOPPING to preserve quality.
Progress logged to .kanban/progress.md

Run /kanban board to see progress, then start a fresh session with /ralph.
The next session will read progress.md and pick up where you left off.
```

This is the Memento approach — clear beats compacting. Do not try to squeeze one more issue into a tired context window. The progress notes ensure nothing is lost.

## Interruption Recovery

If the session is interrupted (crash, timeout, user cancel):

1. Check for `status: in-progress` or `status: review` issues
2. These are the issues that were being worked on
3. Do NOT assume they are done
4. On next `/ralph` run, the stale lock check will detect them and offer to reset
5. Check git status for uncommitted partial work — offer to stash or discard

## When to stop

- No more AFK issues are eligible (all blocked or done)
- Next issue is HITL (needs human)
- Quality is dropping (approaching smart zone limit)
- Implementation fails twice on the same issue (escalate to human)
- User interrupts
- Agent encounters something ambiguous — stop and ask (Matt's Sand Castle rule)

## Error handling

If implementation fails:
1. Do NOT mark the issue as `done` or `review`
2. Set status to `blocked`
3. Add a `## Blocker` section to the issue describing what went wrong
4. Append to progress.md noting the failure and what was attempted
5. Report to the user with the blocker details
6. Move to the next eligible issue if available

## Stop conditions (from Matt's AGENTS.md)

Immediately stop and escalate if:
- The task is ambiguous — you're not sure what to do
- The implementation requires deleting existing files
- Tests are failing and you can't fix them within scope
- You need credentials or environment variables you don't have
- You're touching files outside the issue's scope

## HITL Safety Policy

NEVER auto-implement issues matching these patterns, even if marked AFK:
- Authentication or authorization changes
- Billing or payment logic
- Database migrations (destructive)
- File deletions
- Security-sensitive code (keys, tokens, secrets)
- Dependency version upgrades (major/minor)
- Production configuration changes

If `/ralph` encounters an AFK issue that matches these patterns, stop, set status to `blocked`, and flag it for human review.

## Full workflow context

```
/grill-me → /to-prd → /to-issues → /kanban (board view) → /ralph (AFK loop)
     HITL        HITL       HITL          HITL                AFK
```

Day shift: alignment, PRD, issue breakdown
Night shift: Ralph loop implements AFK issues
