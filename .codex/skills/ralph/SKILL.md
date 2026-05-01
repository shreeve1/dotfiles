---
name: ralph
description: Run the AFK implementation loop from project-root .kanban issues. Picks up one unblocked AFK issue, implements it, verifies it, reviews it, logs progress, and stops safely.
---

# Ralph Loop

Pick up one eligible AFK issue from the project-root `.kanban/` board and implement it end-to-end. Each iteration is intentionally bounded: read one issue, claim it, implement only that slice, verify it, review it, mark it done, write progress notes, and stop or offer the next safe issue.

## Core Rules

- Work on exactly one issue per iteration unless the user explicitly asks to continue.
- Treat each issue as a vertical slice with its own acceptance criteria.
- Do not broaden scope beyond the selected issue.
- Stop on ambiguity, unsafe work, broken board state, missing credentials, failing checks outside the issue scope, or a dirty worktree before implementation starts.
- Never skip `review`; the lifecycle is `pending -> in-progress -> review -> done`.

## Project Root And Board Paths

Resolve the project root before reading or writing `.kanban/`:

```bash
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
KANBAN_DIR="$ROOT/.kanban"
ISSUES_DIR="$KANBAN_DIR/issues"
ARCHIVE_DIR="$KANBAN_DIR/archive"
PROGRESS_FILE="$KANBAN_DIR/progress.md"
```

Use those resolved variables for all board paths:

```text
"$KANBAN_DIR"/
  issues/
  archive/
  progress.md
```

Do not create or read a nested `.kanban/` just because the current shell is inside a subdirectory.

## Kanban Contract

Each issue file is markdown with YAML frontmatter:

```markdown
---
id: 1
title: Short descriptive title
status: pending
type: AFK
blocked_by: []
parent: null
priority: 0
created: 2026-04-26
updated: 2026-04-26
actor: codex
previous_status: null
claimed_at: null
review_started_at: null
---

## What to build

Concise description of this vertical slice.

## Acceptance criteria

- [ ] Criterion 1
- [ ] Criterion 2
```

Use these exact status values:

- `pending`
- `in-progress`
- `review`
- `done`
- `blocked`
- `cancelled`

Every status transition must update:

- `previous_status`: the old status value; `null` is valid only when the issue is created
- `status`: the new status
- `updated`: today's date
- `actor`: `ralph`

Lock and review timestamps:

- `claimed_at`: set to the current ISO-8601 UTC timestamp when claiming an issue into `in-progress`; clear it only when resetting a stale claim back to `pending`.
- `review_started_at`: set to the current ISO-8601 UTC timestamp when moving an issue into `review`.
- Legacy issues missing `claimed_at` or `review_started_at` may be treated as if the missing value were `null`, but the next transition must write both fields.

`blocked_by` is dependency metadata. Runtime failures use `status: blocked` plus a `## Blocker` section.

## Pre-flight Checks

Run these checks before starting any implementation.

### 1. Dirty Worktree Check

```bash
git -C "$ROOT" status --porcelain
```

If there are uncommitted changes, stop before implementation. Report the dirty files relevant to this workflow and ask the user to commit, stash, or otherwise resolve them. This includes local `.kanban/` files newly created by `$to-issues`.

Do not use broad destructive commands to clean the worktree.

### 2. Board Presence

If `"$KANBAN_DIR"` does not exist at the project root, stop and tell the user to create issues with `$to-issues` first.

If `"$PROGRESS_FILE"` is missing, create it only after the dirty-worktree check passes:

```bash
if [ ! -f "$PROGRESS_FILE" ]; then
  cat > "$PROGRESS_FILE" <<'EOF'
# Progress Log

Notes from each Ralph loop iteration. Read this at the start of a new session to understand what happened before.
EOF
fi
```

After creating a missing progress file in a git project, stop before implementation and tell the user to commit or intentionally manage that setup change, then rerun `$ralph`. Do not proceed into implementation with a dirty worktree created by setup.

### 3. Board Validation

Validate all active issue files under `"$ISSUES_DIR"` before selecting work:

- Required fields exist: `id`, `title`, `status`, `type`, `blocked_by`, `created`
- Status is one of the canonical values
- Type is `AFK` or `HITL`
- `actor`, when present, is one of `codex`, `ralph`, `human`, or `script`
- IDs are unique
- `blocked_by` entries reference active or archived issue IDs
- `blocked_by` entries do not reference `cancelled` issues unless the current issue is also `cancelled`
- No issue blocks itself
- Dependency graph has no cycles
- `parent` references, when present, point to an existing active or archived ID
- `claimed_at` and `review_started_at`, when present and not `null`, are ISO-8601 UTC timestamps

If validation fails, report the errors and stop. Do not implement from a broken board.

### 4. Stale Lock Recovery

Find issues with `status: in-progress`. Use `claimed_at` to decide whether the lock is older than 30 minutes. If `claimed_at` is missing or `null` on an `in-progress` issue, report it as a legacy or malformed lock and ask whether to reset or preserve it; do not infer lock age from filesystem metadata.

When resetting a stale lock, set `previous_status: in-progress`, `status: pending`, `updated: <today>`, `actor: ralph`, `claimed_at: null`, and append a short recovery note to `"$PROGRESS_FILE"`.

## HITL Safety Policy

Never auto-implement issues matching these patterns, even if an issue is marked `type: AFK`:

- Authentication or authorization changes
- Billing or payment logic
- Destructive database migrations
- File deletions
- Security-sensitive code, keys, tokens, or secrets
- Major or minor dependency version upgrades
- Production configuration changes

This list intentionally matches `$to-issues`' HITL safety policy. If one list changes, update the other in the same change. `$ralph` is the final enforcement source and must block unsafe work even when the producer misclassified it as AFK.

If an eligible-looking AFK issue matches this policy, do not implement it. Set `status: blocked`, add a `## Blocker` section explaining that the issue requires human review, append a progress note, and report it.

## Select The Next Issue

Read all issue files under `"$ISSUES_DIR"`. An issue is eligible when:

- `status: pending`
- `type: AFK`
- All `blocked_by` IDs are `done` or archived
- All direct and transitive children that reference this issue as `parent` are `done`
- The issue does not match the HITL safety policy

Sort eligible issues by:

1. `priority` ascending, with missing priority treated as `0`
2. `id` ascending

If no issue is eligible, report the board state and stop. If the next issue is HITL, report that human work is needed and stop.

If the user asks for preview, dry-run, or plan-only mode, run only the preflight, validation, and selection steps. Report the issue that would be selected and make no file changes.

## Implement One Issue

For the selected issue:

1. Set `ISSUE_FILE` to the selected issue path under `"$ISSUES_DIR"`.
2. Re-read the full issue file and every acceptance criterion.
3. Immediately before writing, re-read the issue and confirm it is still `status: pending`.
4. Claim the issue by changing `status` from `pending` to `in-progress`, setting `previous_status: pending`, updating `updated`, setting `actor: ralph`, and setting `claimed_at` to `date -u +"%Y-%m-%dT%H:%M:%SZ"`.
5. If the project uses git, commit only the claimed issue file immediately:

   ```bash
   git -C "$ROOT" add "$ISSUE_FILE"
   git -C "$ROOT" commit -m "claim(#<id>): <title>"
   git -C "$ROOT" log -1 --format=%H -- "$ISSUE_FILE"
   ```

   Re-read the issue after the commit and verify it still has the expected `id`, `status: in-progress`, `actor: ralph`, and `claimed_at`. If the commit fails or the values differ, stop and report a possible concurrent claim.
6. If the project does not use git, re-read the issue immediately after writing and compare `id`, `status`, `actor`, and `claimed_at`. If any value differs, stop and report a possible concurrent claim.
7. Read `"$PROGRESS_FILE"` for prior decisions, conventions, and notes.
8. Explore only the relevant code and tests.
9. State a brief implementation approach.
10. Implement only this issue's vertical slice.
11. Run targeted verification: tests, lint, typecheck, build, or manual checks appropriate to the project. If the issue lists a validation command, run it; if no verification path exists, block the issue instead of guessing.
12. If the project uses git, commit the implementation with a message like `feat(#<id>): <brief description>`.

Shared cleanup is allowed only when necessary for this issue. If a broader refactor is discovered, record it in progress notes instead of doing it opportunistically.

## Mandatory Review Gate

After implementation and targeted verification:

1. Set `status: review`, `previous_status: in-progress`, update `updated`, set `actor: ralph`, and set `review_started_at` to `date -u +"%Y-%m-%dT%H:%M:%SZ"`.
2. If the project uses git, commit the review status change with `review(#<id>): <brief description>`.
3. Re-read every acceptance criterion.
4. Re-read every changed file.
5. Run the strongest relevant check suite available within the issue scope.
6. Inspect the diff to confirm no unrelated changes leaked in.

Completion requires:

- Every acceptance criterion is verified and checked off
- Tests/checks pass, or any unavailable check is explicitly reported
- The diff stays within issue scope
- The implementation matches the issue description

If review passes, continue to done. If review fails, set `status: blocked`, add a `## Blocker` section, append progress notes, and report the failure.

## Mark Done And Log Progress

When review passes, update the issue file:

- `status: done`
- `previous_status: review`
- `updated: <today>`
- `actor: ralph`
- Every verified acceptance criterion checkbox to `- [x]`
- Add `## Implementation Notes` with a concise summary

Append to `"$PROGRESS_FILE"`:

```markdown
## #<id> <title> - <YYYY-MM-DD>

**What changed:** <summary>
**Files:** <comma-separated paths>
**Decisions:** <important decisions or "None">
**Conventions established:** <new conventions or "None">
**Notes for next iteration:** <handoff notes or "None">
```

If the project uses git, commit the final issue and progress updates with a message like `done(#<id>): <brief description>`.

## Failure Handling

If implementation fails:

1. Do not mark the issue `review` or `done`.
2. Set `status: blocked` and update transition metadata.
3. Add a `## Blocker` section explaining what failed and what was attempted.
4. Append a progress note.
5. Report the blocker details.
6. Stop unless the user explicitly asked for a multi-issue unattended run and another eligible issue is safe.

Stop immediately if:

- The issue is ambiguous
- Required credentials or environment variables are missing
- Tests fail for reasons outside the issue scope
- The implementation requires deleting files
- The issue touches files outside its stated scope
- Quality is dropping or the context is getting too large

## Continue Or Stop

After completing one issue, report:

```text
Done: #<id> <title>
Files changed: <paths>
Progress logged to "$PROGRESS_FILE"
Next: #<id> <title> [AFK|HITL] <status>
```

If the next issue is HITL or blocked, stop. If another AFK issue is ready, ask before continuing unless the user explicitly requested an unattended multi-issue run.

## Compatibility Fixture Validation

When changing `$to-issues` or `$ralph`, validate the queue contract with a disposable fixture outside the repository before claiming the workflow works:

```bash
ROOT="$(mktemp -d)"
KANBAN_DIR="$ROOT/.kanban"
ISSUES_DIR="$KANBAN_DIR/issues"
ARCHIVE_DIR="$KANBAN_DIR/archive"
PROGRESS_FILE="$KANBAN_DIR/progress.md"
mkdir -p "$ISSUES_DIR" "$ARCHIVE_DIR"
printf '# Progress Log\n' > "$PROGRESS_FILE"
```

Create at least these fixture issues under `"$ISSUES_DIR"`:

- A safe `status: pending`, `type: AFK` issue with `blocked_by: []`, `claimed_at: null`, and `review_started_at: null`; preview mode should select it.
- A safety-policy issue incorrectly marked `type: AFK`; preview mode must exclude it or classify it as blocked for human review.
- A dependent AFK issue whose blocker is not done; preview mode must not select it.
- A parent issue with an unfinished child; preview mode must not select the parent.
- An `in-progress` issue with an old `claimed_at`; stale recovery should identify it without relying on file mtime.

Run `$ralph` in preview/dry-run mode against the fixture. It must report the selected safe issue and make no file changes.
