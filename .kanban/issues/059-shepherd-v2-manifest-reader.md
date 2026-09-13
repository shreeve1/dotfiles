---
id: 059
title: Shepherd v2 — manifest reader for board-mode runs
status: in-progress
blocked_by: [056]
parent: null
created: 2026-09-10
updated: 2026-09-13
actor: ralph

## What to build

tralph-shepherd learns to oversee a board-mode (`--jobs N`) run. Its gather
signals for board mode come from structured state instead of tmux pane
forensics: the run manifest and sidecars (which lane, which outcome, why),
per-lane worker logs, and coordinator liveness via the lock's owner PID.
"Driver parked" becomes "coordinator PID dead with unfinished manifest
work". The existing delegate-or-raise decision tree, one-retry-max rule,
and never-implement hard rules carry over verbatim; the sequential-mode
(tmux) sections remain for `--jobs 1` runs. The relaunch action in board
mode is restarting the coordinator (recovery in #056 makes that safe).

## Acceptance criteria

- [ ] Board-mode gather-signals section reads manifest/sidecars/lock and
      per-lane logs; no pane captures in board mode
- [ ] Parked/crashed coordinator detection keys off lock owner PID + board
      state, and the documented relaunch is safe post-#056 recovery
- [ ] Delegate-or-raise tree, one-retry-max, and hard rules unchanged
- [ ] Sequential-mode shepherding retained for --jobs 1

## Verification

`grep -qn "manifest" .agents/skills/tralph-shepherd/SKILL.md` and `grep -qn "jobs 1" .agents/skills/tralph-shepherd/SKILL.md`
