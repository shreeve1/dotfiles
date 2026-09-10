---
id: 039
title: Publish one child-closing batch PR
status: done
updated: 2026-07-25
actor: ralph
blocked_by: [037, 038]
parent: null
priority: 0
created: 2026-07-22
---

## What to build

Publish the completed `gralph/<parent>` batch branch and open one GitHub pull request. Publication is allowed only after every open `ready-for-agent` child of the parent has landed and the final integration command passes against the complete batch. The PR body must include closing references only for children whose accepted commits are present on the batch branch.

The coordinator may push and call `gh`; workers and reviewers may not. Creating or updating the PR must never directly close a child or parent issue—GitHub closes referenced children only when the PR merges.

## Acceptance criteria

- [x] Publication fails closed while any required child is failed, blocked, unreviewed, or not landed.
- [x] The integration verification command runs once more on the final batch tip immediately before push.
- [x] Only the coordinator pushes `gralph/<parent>` and creates or updates the single batch PR.
- [x] The PR body contains exactly one `Closes #N` reference for each landed child and none for excluded, failed, or blocked issues.
- [x] Re-running publication updates or returns the existing PR rather than creating a duplicate.
- [x] No `gh issue close` or equivalent direct child/parent closure occurs.
- [x] Tests use fake `gh` and a local bare remote to cover success, incomplete batches, failed final verification, exact closing references, push failure, and idempotency.

## Verification

`bash tests/gralph-pr.test.sh`

## Blocked by

- Blocked by #037
- Blocked by #038

## Implementation Notes

**What changed:** Added `publish_pr` function to `bin/gralph` that validates all eligible children are landed, runs a final integration verification on the batch tip, pushes the batch branch, and creates or updates a single PR with `Closes #N` for each landed child. Wired it into the coordinator after `orchestrate_waves` succeeds. Idempotent via PR discovery and manifest-level early return.

**Files:** `bin/gralph`, `tests/gralph-pr.test.sh`, `tests/gralph-parallel.test.sh`, `tests/gralph-review.test.sh`, `tests/gralph-single-child.test.sh`

**Decisions:** The publish function runs in the coordinator process (not a separate worker). PR creation/update uses `gh pr list` for idempotent discovery. Final integration verification runs in a temporary worktree before push. The function uses the same credential-scrubbing envelope as `merge_one_child`.

**Fresh review returned:** `RALPH_REVIEW: PASS` — all 7 criteria satisfied, verification exited 0, no scope creep, no unrelated changes.
