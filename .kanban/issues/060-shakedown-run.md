---
id: 060
title: Shakedown — full end-to-end board-mode run on real work
status: pending
blocked_by: [055, 057]
parent: null
created: 2026-09-10
updated: 2026-09-10
actor: to-tickets

## What to build

A real dress-rehearsal of the new loop, on real work — not a fixture. Take
a small genuine feature or chore backlog (3–5 real tickets with at least
one dependency edge, at least two independent tickets, and declared
`files:` scopes on at least two of them), publish it to a board, and run
`tralph --jobs 2` (or 3) end-to-end with real model workers against a real
repo (a scratch clone of dotfiles or another repo is fine — real code, real
verification commands).

The deliverable is the run made healthy: every bug found gets fixed (small)
or filed as a new board ticket with a `## Blocker`-quality description
(large), and the run is then repeated until it completes cleanly. Watch
for the classes the fixtures can't fake: provider rate limits with
concurrent workers, worker sessions misbehaving in lanes (wrong cwd,
touching the base repo), rebase conflicts at landing, progress-fold
ordering, report accuracy vs. actual git state, disk/cost footprint of N
lanes.

Record the outcome in `.kanban/progress.md`: what broke, what was fixed,
what was filed, plus the measured wall-clock vs. a sequential run of the
same board (the number that justifies the whole overhaul).

## Acceptance criteria

- [ ] A real 3–5 ticket board with ≥1 dependency edge, ≥2 independent
      tickets, and ≥2 scoped tickets runs to completion via
      `tralph --jobs 2` or higher
- [ ] At least one wave ran ≥2 live lanes concurrently (evidenced in the
      manifest/run-report)
- [ ] run-report.md matches actual git state: every landed SHA is on main,
      every bounced/blocked ticket is accounted for
- [ ] Every bug encountered is fixed or filed as a board ticket; the final
      run completes with zero manual intervention
- [ ] Parallel vs. sequential wall-clock comparison recorded in
      progress.md

## Verification

Prose (paths are chosen during the run): the shakedown repo's
run-report.md exists and names every ticket's outcome; every landed SHA it
lists is an ancestor of that repo's main (`git merge-base --is-ancestor`);
the shakedown board has zero pending/in-progress/review tickets left; the
parallel-vs-sequential timing note is in `.kanban/progress.md` here.
