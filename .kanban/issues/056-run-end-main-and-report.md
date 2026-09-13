---
id: 056
title: Run end — ff-only to main, crash recovery, run-report.md
status: done
blocked_by: [054]
parent: null
created: 2026-09-10
updated: 2026-09-10
actor: to-tickets

## What to build

The run finishes and survives dying. Two halves:

1. **Finish**: after the last landing, the coordinator merges the
   integration branch into main with `git merge --ff-only` ONLY; on any
   refusal (diverged main, dirty tree) it drops a board-mode
   `ralph-merge-needed` marker and defers to the manual `tralph-merge`
   skill — never force, never `--no-ff`. Update the tralph-merge skill for
   board mode: today it is hardcoded to the old single-worktree model
   (`~/symphony-ralph`, branch `ralph/run`, session-keyed marker); it must
   also consume the board-mode marker and land the run's integration
   branch. Landed lanes' worktrees/branches are pruned; bounced lanes are
   kept. Write `.kanban/run-report.md`: per ticket landed/bounced/blocked
   with reasons, landing SHAs (for revert), and the final main state.
2. **Recovery**: extend gralph's `recover_state` for board mode: a
   restarted coordinator reconstructs from manifest + sidecars +
   `git worktree list` — completed lanes are not re-run, a lane whose
   worker died mid-flight is reset for a fresh worker, stale locks from a
   dead coordinator PID are reaped. Kill -9 during a 2-lane run, restart,
   and the run completes with every ticket landed exactly once.

## Acceptance criteria

- [ ] Clean run ends with main fast-forwarded and a run-report.md naming
      every ticket's outcome and landing SHA
- [ ] Diverged main: no merge, marker dropped, report says deferred
- [ ] tralph-merge skill documents the board-mode marker + integration
      branch alongside the legacy single-worktree path
- [ ] Coordinator killed mid-run: restart completes the run; no ticket is
      implemented or landed twice; the dead run's lock is reaped
- [ ] Bounced/blocked lanes survive cleanup for inspection

## Verification

`bash tests/tralph-finish.test.sh` and `bash tests/tralph-recovery.test.sh` and `bash tests/gralph-recovery.test.sh`
