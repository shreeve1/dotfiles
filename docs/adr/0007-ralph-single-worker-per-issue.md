# 0007 — Ralph: one driver worker per issue

**Status:** Accepted (2026-08-22) — supersedes
[0005](./0005-ralph-planner-stage.md)

## Context

Under ADR 0005's defaults (`tralph`), each issue went through THREE
independent fresh worker sessions:

1. **Planner** (driver-level, run before the implementer) — appends a
   `## Plan` section to the issue and commits it.
2. **Implementer** — fresh worker; builds the slice.
3. **Reviewer** (driver-level, run after a `DONE`) — fresh worker that
   diffs the pre-worker base against `HEAD`, runs `## Verification`, and
   emits `RALPH_REVIEW: PASS|FAIL`.

The implementer ALSO spawned its own fresh reviewer per Ralph protocol §4
(`SKILL.md:327-386`) before emitting `DONE`. So under defaults the actual
cost was **~3-4 sessions per issue**: planner + implementer-with-own-reviewer
+ driver reviewer. Two of those three sessions independently re-ran the
issue's `## Verification` command. That is a duplicate review at roughly 2x
cost, and the two reviewers cannot disagree usefully — the driver reviewer
just overrides without a reconciliation path.

The BLOCKED repair/drain machinery (`AUTO_REVIEW_BLOCKED`,
`select_next_blocked_target`) was built to make unattended `tralph` runs
self-healing. In practice the same run already had a planner+reviewer pair
to throw at a blocked issue, so the "self-healing" promise and the
"duplicate review" cost were the same problem — paid even when no
`BLOCKED` ever appeared.

## Decision

**One driver worker per issue.** The driver no longer runs a planner stage
before the implementer, and no longer runs a review-each stage after a
`DONE`. The driver keeps a deterministic verification gate.

The worker is now responsible for both halves of the work the driver used
to coordinate:

- **Planning.** If the issue file has a `## Plan` section, the implementer
  reads and follows it. Plans may be human-authored, written by a prior
  `--review-loop` pass, or produced ad-hoc — the driver no longer
  generates one. The `implement` skill (loaded into every worker `pi`
  command via `--skill` and invoked with `/skill:implement`) carries the
  "follow the plan if present" guidance that 0005 had hoped a planner
  session would enforce. See `.claude/skills/implement/SKILL.md`.
- **Fresh review.** The implementer spawns its own fresh-session reviewer
  per Ralph protocol §4 (`SKILL.md:327-386`) before emitting `DONE`. That
  reviewer is the single review layer — a separate process that
  re-derives from the repo and emits
  `RALPH_REVIEW: PASS|PASS_WITH_NOTES|FAIL`. The driver no longer
  launches a second one.

The driver's only post-worker step is a **deterministic verification gate**:

- After the worker's `DONE` sentinel, the driver runs the issue's
  cleanly-runnable `## Verification` command (backtick-quoted shell
  joined by connectives).
- Exits 0 → ensure `status: done`.
- Exits non-zero → flip `done→blocked` and append a `## Blocker` note
  naming the failing command.
- Prose verification (no runnable command) → trust the worker's `DONE`.
- Any status flip is committed immediately so the worktree-merge
  finalizer sees it.

This is the deterministic backstop the worker's §4 reviewer provides
informally: the reviewer may emit `RALPH_REVIEW: PASS` and the
verification may still fail on the driver's run because of a flake or an
environment delta. The gate catches that without spawning a second
reviewer.

The BLOCKED repair/drain machinery is removed with the rest. Attended
`tralph` runs stop at first `BLOCKED` (old behavior). Unattended runs
exit 1 and the supervisor relaunch picks up the next eligible issue,
skipping the blocked one. `--review-loop` remains the manual unblock
tool and is unchanged.

## Consequences

- **Cost drops from ~3-4 sessions per issue to 1.** A `tralph` run is
  one implementer worker (who internally runs a §4 reviewer) plus a
  single driver verification-gate shell invocation. The driver-side
  duplicate review is gone.
- **No more driver planner stage.** The driver does not pre-plan issues.
  The `## Plan` section remains as an optional input the implementer
  reads if present; it is no longer produced by the loop.
- **Blocked-drain self-healing moves to the supervisor.** Unattended
  `tralph` runs are no longer self-healing on a single run; the
  supervisor relaunch covers unattended recovery, and the user can
  invoke `--review-loop` manually for attended recovery.
- **Prose verifications stay worker-authoritative.** When the issue's
  `## Verification` is prose, the gate has nothing to run — the
  worker's `DONE` stands. The fresh-session §4 reviewer remains the only
  check on those. The gate makes the contrast explicit instead of
  leaving it implicit inside the reviewer's mandate.
- **`--review-loop` mode is untouched.** It builds its own prompt from
  inline literals; the `REVIEW_PROMPT_REMINDER` /
  `PLAN_PROMPT_REMINDER` machinery dies with the planner/reviewer
  stages but nothing else depended on it.

## Trade-offs

- **Trusting the implementer to read a plan when one exists.** The
  `implement` skill explicitly includes the step "if the issue file has
  a `## Plan` section, follow it". If a human authored a plan, it will
  be honored; if a plan is missing, the implementer plans ad-hoc (its
  previous behavior anyway). The separation of "who plans" is gone; the
  artifact (`## Plan` section) remains.
- **Attended `tralph` stops on first `BLOCKED` instead of
  self-repairing.** The cost of removing the duplicate review is that
  manual `--review-loop` becomes the recovery tool for attended runs.
  The supervisor still handles unattended recovery.
- **The driver verification gate runs every issue's `## Verification`
  command in a subshell.** Cheap for small commands (a single `pytest`
  invocation is well under a second), not free for heavy ones. The
  cost is bounded by the issue's own `## Verification` design, which
  is a property of the issue author — not the loop.

## Supersedes

- [0005](./0005-ralph-planner-stage.md) — Ralph loop planner stage
  (driver-level plan before implement). The 0005 assumption that "3x
  workers per issue" was an acceptable cost for a persisted plan
  artifact is replaced by the position that one implementer worker,
  given the `implement` skill and the option to read a `## Plan`
  section, produces a comparable outcome at one third the session
  cost.
