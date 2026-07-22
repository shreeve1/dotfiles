---
id: 038
title: Resume runs and recover stale claims
status: pending
blocked_by: [037]
parent: null
priority: 0
created: 2026-07-22
---

## What to build

Make interrupted Gralph runs safely resumable from their durable manifest and GitHub claim labels. On restart, reconcile manifest state with GitHub issues, local branches, worktrees, commits, reviews, and landed SHAs. Reuse valid completed work instead of rerunning it, and identify stale claims whose recorded coordinator is no longer live.

Recovery must be conservative: automatically remove only a claim proven stale and never delete a worker branch, worktree, commit, log, or review artifact. Repeated resume commands should converge without duplicate workers or duplicate merges.

## Acceptance criteria

- [ ] Restarting the same parent discovers its incomplete manifest and reports the recovered state before launching work.
- [ ] A live claim owned by another run is left untouched and blocks duplicate execution.
- [ ] A stale claim is cleared only when its recorded run is absent and no live coordinator owns it; the decision is logged in the manifest.
- [ ] Valid completed workers, approved reviews, and already-landed SHAs are adopted and skipped rather than recreated.
- [ ] Missing or inconsistent artifacts fail closed with repair guidance instead of guessing or deleting data.
- [ ] Repeating recovery after success is idempotent and cannot duplicate commits, merges, comments, or labels.
- [ ] Tests cover interruption during claim, worker execution, review, merge, and post-merge integration verification.

## Verification

`bash tests/gralph-recovery.test.sh`

## Blocked by

- Blocked by #037
