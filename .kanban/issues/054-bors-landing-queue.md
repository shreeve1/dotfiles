---
id: 054
title: Bors-style landing queue (ADR 0009)
status: pending
blocked_by: [053]
parent: null
created: 2026-09-10
updated: 2026-09-10
actor: to-tickets

## What to build

Finished lanes reach the integration branch through a serial landing queue
in topological order (blockers land before dependents), replacing the
legacy batch accumulation in board mode. Per landing: rebase the lane onto
the integration tip → re-run that ticket's `## Verification` on the rebased
lane → `git merge --ff-only`. A red re-verification bounces the lane and
auto-creates a repair ticket on the board (blocked_by nothing, body naming
the failing command and the landing context); the run continues landing
other lanes. This is the semantic-conflict gate: two lanes green alone,
red together, is caught here and attributed to the lane that landed last.

Landing also folds the lane's lane-local progress note (#053) into the
shared `.kanban/progress.md` — serial landings mean no append conflicts.

## Acceptance criteria

- [ ] Two lanes land serially in topo order; integration branch is green
      after each landing
- [ ] A crafted semantic conflict (lane A and lane B green alone, red
      combined) bounces the second lane, creates a repair ticket, and the
      integration branch stays green
- [ ] No `--no-ff` merge commits in board mode; landings are ff-only after
      rebase
- [ ] A bounced lane's worktree/branch is preserved for the repair ticket
- [ ] Each landing appends the lane's progress note to
      `.kanban/progress.md` in landing order

## Verification

`bash tests/tralph-landing-queue.test.sh`
