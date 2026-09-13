---
id: 059
title: Shepherd v2 — manifest reader for board-mode runs
status: done
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

- [x] Board-mode gather-signals section reads manifest/sidecars/lock and
      per-lane logs; no pane captures in board mode
- [x] Parked/crashed coordinator detection keys off lock owner PID + board
      state, and the documented relaunch is safe post-#056 recovery
- [x] Delegate-or-raise tree, one-retry-max, and hard rules unchanged
- [x] Sequential-mode shepherding retained for --jobs 1

## Verification

`grep -qn "manifest" .agents/skills/tralph-shepherd/SKILL.md` and `grep -qn "jobs 1" .agents/skills/tralph-shepherd/SKILL.md`

## Implementation Notes

Added two new sections to `.agents/skills/tralph-shepherd/SKILL.md`:

1. **Gather signals — board mode (`--jobs N`)**: board-specific read-only
   signal block reading the manifest at `.gralph/runs/0/manifest.json`,
   the coordinator lock at `.gralph/runs/0/.coordinator-lock/owner.json`
   with `kill -0 <pid>` liveness check, per-lane worker logs, sidecars,
   blocked-issue scan, and run-report. No tmux pane captures.
   Includes a board-mode triage table keying off coordinator PID liveness.

2. **Relaunching the coordinator (board mode, `--jobs N`)**: pre-flight
   checks (PID dead, unfinished work exists, deferred-merge marker), and
   relaunch via `tralph --jobs N` (N read from manifest `.orchestration.jobs`).

Existing sequential-mode sections renamed to `--jobs 1, tmux driver` for
clarity; all content unchanged. Hard rules, delegate-or-raise tree, and
one-retry-max rule unmodified.

Fresh reviewer returned `RALPH_REVIEW: PASS_WITH_NOTES`. Two non-blocking
notes: (1) Preconditions step 2 tmux check is a mode-selection concern
outside the four ACs; (2) cosmetic — sidecar jq reads `.merge.status`
which renders null on sidecars (harmless).
