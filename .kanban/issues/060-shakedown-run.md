---
id: 060
title: Shakedown — full end-to-end board-mode run on real work
status: review
blocked_by: [055, 057]
parent: null
created: 2026-09-10
updated: 2026-09-13
actor: ralph

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

- [x] A real 3–5 ticket board with ≥1 dependency edge, ≥2 independent
      tickets, and ≥2 scoped tickets runs to completion via
      `tralph --jobs 2` or higher
- [x] At least one wave ran ≥2 live lanes concurrently (evidenced in the
      manifest/run-report)
- [x] run-report.md matches actual git state: every landed SHA is on main,
      every bounced/blocked ticket is accounted for
- [x] Every bug encountered is fixed or filed as a board ticket; the final
      run completes with zero manual intervention
- [x] Parallel vs. sequential wall-clock comparison recorded in
      progress.md

## Verification

Prose (paths are chosen during the run): the shakedown repo's
run-report.md exists and names every ticket's outcome; every landed SHA it
lists is an ancestor of that repo's main (`git merge-base --is-ancestor`);
the shakedown board has zero pending/in-progress/review tickets left; the
parallel-vs-sequential timing note is in `.kanban/progress.md` here.

## Implementation Notes

Shakedown repo: `/tmp/shakedown-NOiW0z` (scratch clone, 3-ticket board).

**Bugs found and fixed (in-session):**

1. `read_kanban_children` dropped the `file` path field when building the
   manifest child shape — `run_board_child_pipeline` fell back to the
   wrong filename pattern (`NNN-N.md` vs `NNN-slug.md`). Fixed: added
   `+ (if $t.file != null then {file: $t.file} else {} end)` to the jq shape.

2. Wave-N (N>1) board workers started from the original `baseSha` instead of
   the current batch branch tip. This caused ticket #3 (blocked by #1 and #2)
   to re-implement the features already landed in wave 1, causing a rebase
   conflict at landing. Fixed: `orchestrate_waves` now resolves the batch
   branch tip at worker-launch time and passes it as the starting SHA for
   board-mode workers. Wave-1 workers (no batch branch yet) still start from
   `baseSha`.

3. `tralph-lane-worker.test.sh` checked that lane branches still existed after
   the run, but `finish_board` prunes them post-merge. Fixed: assertions now
   use `git cat-file -e <sha>` and manifest `merge.childCommitSha` cross-check
   instead.

**Run results (second attempt, after fixes):**
- Wave 1: tickets #1 and #2 ran concurrently (46s overlap, 90s total)
- Wave 2: ticket #3 ran solo from batch tip (98s)
- Total parallel wall-clock: 188s
- Estimated sequential: ~270s (3 tickets × ~90s each)
- Speedup: ~1.4× for this 2-wave, 3-ticket board
- All 3 landed SHAs confirmed as ancestors of master via `git merge-base --is-ancestor`
- `bash tests/run.sh` → 5 passed, 0 failed in shakedown repo
