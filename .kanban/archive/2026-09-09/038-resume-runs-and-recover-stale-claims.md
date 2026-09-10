---
id: 038
title: Resume runs and recover stale claims
status: done
blocked_by: [037]
parent: null
priority: 0
created: 2026-07-22
updated: 2026-07-24
actor: ralph
---

## What to build

Make interrupted Gralph runs safely resumable from their durable manifest and GitHub claim labels. On restart, reconcile manifest state with GitHub issues, local branches, worktrees, commits, reviews, and landed SHAs. Reuse valid completed work instead of rerunning it, and identify stale claims whose recorded coordinator is no longer live.

Recovery must be conservative: automatically remove only a claim proven stale and never delete a worker branch, worktree, commit, log, or review artifact. Repeated resume commands should converge without duplicate workers or duplicate merges.

## Acceptance criteria

- [x] Restarting the same parent discovers its incomplete manifest and reports the recovered state before launching work.
- [x] A live claim owned by another run is left untouched and blocks duplicate execution.
- [x] A stale claim is cleared only when its recorded run is absent and no live coordinator owns it; the decision is logged in the manifest.
- [x] Valid completed workers, approved reviews, and already-landed SHAs are adopted and skipped rather than recreated.
- [x] Missing or inconsistent artifacts fail closed with repair guidance instead of guessing or deleting data.
- [x] Repeating recovery after success is idempotent and cannot duplicate commits, merges, comments, or labels.
- [x] Tests cover interruption during claim, worker execution, review, merge, and post-merge integration verification.

## Verification

`bash tests/gralph-recovery.test.sh`

## Blocked by

- Blocked by #037

## Implementation Notes

`recover_state` runs once at the start of `orchestrate_waves`, after the coordinator lock is acquired, and prints a single `Recovery: ... adopted, ... resumed merge, ... needs review, ... stale cleared, ... live left, ... failed left, ... inconsistent` line to stderr before any pipeline launches. Each child is classified into exactly one action by the priority order `merge landed/merged -> execution failed -> review accepted -> execution complete (no review) -> claim claimed`. The classification and per-child context (claim host/pid/runId, worker branch/commitSha, merge status) are written to `.orchestration.recovery.decisions[]` plus seven aggregate counters, so every recovery decision is auditable in the manifest.

Conservative stale-claim handling: a claim is only cleared via `gh issue edit <child> --remove-label gralph:claimed` when the recorded host matches the current host and `kill -0 $claim_pid` fails (or `gh` cannot reach the label, which is then recorded as inconsistent). Claims with a foreign host are left untouched because liveness cannot be verified across machines. Claims whose pid is alive on this host are also left alone. The manifest claim field is rewritten to `status:"recovered", reason, recoveredAt` so a second run does not re-issue the gh call.

Artifact adoption and fail-closed behavior: already-landed (`merge.status == "landed"`) and merged-but-not-landed (`merge.status == "merged"`) children are adopted without re-running anything; the latter is the reviewer-flagged PASS_WITH_NOTES caveat — the merge commit exists on disk but its integration command was never verified, so the user must re-run with `--verify` to complete it. Accepted-review children trigger `merge_one_child` directly from recovery (which is now idempotent: it short-circuits when `merge.status` is already `landed` or `merged`). Accepted reviews whose recorded worker branch no longer exists are reported as `inconsistent` rather than guessed at, and no durable state (branch, worktree, commit, log, review) is ever deleted by recovery.

Idempotency: re-running the orchestrator after a successful run produces zero new `--remove-label` calls, zero new merge commits on the batch branch, and zero changes to the per-child durable state. Recovery decisions are deterministic given the manifest and hostname, so the report can be regenerated safely and a follow-up runner sees the same `adopted/stale_cleared/live_owner_left` actions without re-doing work.

Tests in `tests/gralph-recovery.test.sh` cover every acceptance criterion and every interruption seam: post-merge success, post-merge-integration (the merged-state adoption path), merge interruption (accepted review resumes via `merge_one_child`), worker execution interruption (failed-execution surfaces repair guidance), and claim interruption (stale pid cleared, foreign-host left alone, live pid left alone). Inconsistent-branch inputs produce `inconsistent` decisions with no destructive cleanup. The exact verification command exits 0; `bash -n` reports clean syntax on both touched shell files.
