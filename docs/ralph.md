# Ralph — where the pieces live

A map of the ralph/tralph/gralph subsystem, so you do not have to reconstruct it
from `bin/gralph` (2700 lines) and the board script on every visit. This is a
pointer, not a design doc:

- Vocabulary: `CONTEXT.md` § "Parallel Ralph".
- Design and rationale: [`docs/specs/parallel-ralph-plan.md`](specs/parallel-ralph-plan.md).
- Narrative and session history: `wiki/ROUTING.md` § "tralph, gralph And The
  .kanban Board".
- Decisions: ADR [0005](adr/0005-ralph-planner-stage.md),
  [0007](adr/0007-ralph-single-worker-per-issue.md),
  [0008](adr/0008-ralph-omp-workers.md),
  [0009](adr/0009-parallel-ralph-landing-queue.md),
  [0010](adr/0010-parallel-ralph-full-tool-workers.md),
  [0018](adr/0018-pi-replaces-omp.md) (the omp → pi move) and
  [0024](adr/0024-driver-side-drift-check.md) (driver-side drift check).

## The two drivers

Both run a full-tool worker in a fresh context; neither inherits the caller's
context. Both read the same board through `board.sh`.

| | sequential (tralph) | board / parallel (gralph) |
| --- | --- | --- |
| Entry point | `.agents/skills/ralph/ralph-loop.sh [OPTIONS] [ADAPTER] [SESSION_NAME]` | `bin/gralph <key> --board .kanban …` |
| Parallelism | one issue per worker turn | `--jobs N` git-worktree lanes, bors-style landing queue |
| Adapter | `tmux` (default) or `pi` | direct `pi -p`, or GitHub parent issues |
| Worker procedure | the `ralph` skill, loaded by the worker | an inline prompt that names the skill files to read |

`bin/rralph` is a different subsystem (the RPIV pipeline), not part of this one.

## Where the pieces are

| Piece | Location |
| --- | --- |
| Board rules — eligibility, triage labels, blockers, archive | `.agents/skills/kanban/board.sh` (single source of truth; callers are the two drivers and the shepherd) |
| Board layout | `.kanban/issues/`, `.kanban/archive/`, `.kanban/specs/`, `.kanban/maps/`, `.kanban/progress.md` |
| Worker procedure (sentinel contract, review, verification gate, stop conditions) | `.agents/skills/ralph/SKILL.md` |
| Per-ticket review procedure (independent reviewers, one fix round, cleanup) | `.agents/skills/ralph/references/review.md` |
| Unattended supervisor of a blocked board | `.agents/skills/tralph-shepherd/SKILL.md` |
| Driver helpers | `.agents/skills/ralph/ralph-finalize.sh`, `ralph-supervise.sh`, `ralph-worktree.sh` |
| Driver-side drift check (both drivers, after DONE; ADR 0024) | `.agents/skills/ralph/ralph-drift-check.sh` — called from `ralph-loop.sh` `run_drift_gate()` and `bin/gralph` `run_board_child_pipeline()` |
| Lane worker prompt | `bin/gralph` `run_child_pipeline()` — builds it and names the skill files the worker must read |
| Skill-file lookup for that prompt | `bin/gralph` `locate_skill_file()` — env override, then this checkout, then `$HOME` |
| Run artifacts | `.gralph/runs/<key>/manifest.json` (gitignored), `.kanban/run-report*.md` |

The review procedure reaches both drivers: `ralph/SKILL.md` §4 points at
`references/review.md`, and `bin/gralph`'s prompt names the same file.

## Tests

`bash tests/run-all.sh` is the repo's check command — every test file plus the
shell-formatting and untracked-test-file guards. `--fast` runs the guards plus
only the test files this branch changed (seconds); the pre-push hook runs that
subset so a push stays cheap, which means the full suite is yours to run.

- `tests/ralph-loop-labels.test.sh` — sequential driver against board labels
  (stubs `tmux` and `pi`); `tests/ralph-supervise-labels.test.sh` — the supervisor.
- `tests/gralph-*.test.sh` — parallelism, landing queue, PR, recovery, review,
  finish, frontier, single child, worker spec.
- `tests/tralph-*.test.sh` — wrapper, scopes, e2e, landing queue, kanban
  frontier, lane worker, recovery, finish.
- `tests/skills-pipeline.test.sh` — end-to-end the skills-to-board pipeline;
  `tests/skills-text.test.sh` — the skill text itself.
- `.agents/skills/ralph/tests/test-checkpoint-scope.sh` — shared-worktree
  checkpoint mode.

A test that stubs the worker must stub `pi` and pass `pi` as the adapter
argument. The `omp` adapter was removed by ADR 0018; stubbing it silently makes
the driver exit and every assertion downstream fail.
