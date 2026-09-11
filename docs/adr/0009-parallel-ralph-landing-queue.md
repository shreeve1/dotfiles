# 0009 — Parallel Ralph: bors-style landing queue, not batch merges

**Status:** Accepted (2026-09-10)

## Context

The tralph × gralph merge runs kanban tickets in parallel git worktree
lanes (one per ticket, frontier waves capped by `--jobs`). Something must
bring N finished lanes back together. gralph today accumulates `--no-ff`
merges onto a batch branch and integrates big-bang at the end
(`bin/gralph:898-934`). The failure that policy cannot attribute:
**semantic conflicts** — two lanes each green in isolation but red once
combined. Git merges them cleanly; only running the tests exposes the
break, and in a big-bang batch the red arrives late and points at nobody.

## Decision

Land lanes **one at a time, serially, in topological order** (blockers
before dependents), bors-style. Per landing:

1. Rebase the lane onto the current integration-branch tip.
2. Re-run that ticket's `## Verification` command on the rebased lane.
3. `git merge --ff-only` onto the integration branch.

A red re-verification bounces the lane and auto-opens a **repair ticket**
into the same board graph; the run continues landing other lanes. At run
end the integration branch reaches `main` only via `--ff-only`; any
refusal (diverged main, dirty tree) drops the marker and defers to the
manual `tralph-merge` skill — the same never-force discipline as
`ralph-finalize.sh:73-83` and the dsh-board Merge stage.

## Consequences

- Every landing pays one extra verification run. Accepted: verification
  commands are cheap relative to implementation sessions, and this gate is
  what makes unattended parallelism trustworthy.
- Semantic conflicts surface per-landing, small and attributed to the lane
  that landed last — repairable by a fresh worker without human forensics.
- "Batch" is retired vocabulary (see `CONTEXT.md` § Parallel Ralph); the
  unit is a *landing*.
- The integration branch is always green at every landing point, so a
  partial run (some lanes landed, some bounced) still yields a mergeable,
  verified result — no all-or-nothing batch.
