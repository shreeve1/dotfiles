# 0005 — Ralph loop planner stage

**Status:** proposed (2026-07-24)

Add a dedicated planner stage to the `tralph` / `ralph-loop.sh` driver so each
implemented issue is planned in its own fresh session and the plan is persisted
into the issue ticket before implementation — mirroring the scout→plan→build→
review discipline of a Fusion session, but implemented at the driver level, not
by making the loop worker a Fusion parent.

## Context

`tralph` (`.zshrc:335`) runs `ralph-loop.sh`, which launches each worker turn as
a flat `pi` process. Both adapters prefix the worker with `PI_SUBAGENT_CHILD=1`
(`ralph-loop.sh:665`, `:775`). That single env var self-disables three
extensions at their entry points:

- `fusion/index.ts:1064` — `if (isChildProcess()) return;`
- `subagent-bridge/index.ts:238`
- `pi-subagents/src/extension/index.ts:192-194`

So a loop worker today is a lone flat model: no Fusion parent-cage, and — via the
same switch — no ability to spawn subagents at all.

The request was to make the loop "run scout→planner→worker→reviewer like a Fusion
session." Two mental models collide:

- **Ralph as it is:** the worker *is* the writer. `SKILL.md:294` ("Build —
  implement the slice end-to-end") and `SKILL.md:296-303` have it edit code and
  run `git add`/`git commit` itself. Orchestration between *implement* and
  *review* already exists — but at the **bash-driver level**: `ralph-loop.sh`
  spawns implementer and reviewer as separate flat `pi` sessions
  (`run_pi_adapter:655`, `run_inline_review:989`). Ralph's orchestrator is the
  shell script, not an agent.
- **Fusion-parent-in-loop:** each iteration becomes a caged Fusion parent that
  delegates scout/plan/write/review to its own children in-session.

The Fusion-parent option was rejected for now (see Rejected options): it requires
dropping `PI_SUBAGENT_CHILD=1` (re-enabling Fusion's write-cage, which
contradicts the ralph SKILL that tells the same agent to edit files directly) and
re-enabling nested subagents (the recursion the flag was added to prevent), plus
the per-iteration 8G memory cap now has to cover N fan-out children.

## Decision

Keep Fusion **off** inside the loop. Add a planner stage **at the driver level**,
mirroring the existing `run_inline_review` pattern, that runs before the
implementer.

Behaviour:

1. **Own fresh session.** The planner is a separate flat `pi` turn dispatched
   through the same `run_pi_adapter` / `run_tmux_adapter` used by implementer and
   reviewer — the same shape as `run_inline_review` (`ralph-loop.sh:989`), which
   saves prompt state, swaps in a stage-specific `AGENT_PROMPT` +
   `SHARED_PROMPT_REMINDER`, dispatches, and restores.
2. **Coordination by shared deterministic selection (Option A).** The driver does
   NOT pre-select an issue. Both planner and implementer self-select via the same
   SKILL.md scan rule (resume active; else lowest-priority-then-lowest-id
   `pending` whose `blocked_by` are all `done` — `SKILL.md:257-266`). Because the
   sort is deterministic and nothing mutates the board between the two stages in
   one iteration, they land on the same issue.
3. **Gate on a fresh start.** Run the planner only when
   `ACTIVE_COUNT == 0 && UNBLOCKED_COUNT > 0`. If an issue is already active the
   implementer *resumes* it (already planned) — skip planning that iteration.
   Both counts already exist in the loop body.
4. **Ordering.** Insert the planner *after* `checkpoint_dirty_worktree`
   (`ralph-loop.sh:1340`) but *before* the `REVIEW_BASE_SHA` capture
   (`:1352`), so the `plan(#ID)` commit is part of the review base and does not
   pollute the reviewer's `BASE..HEAD` diff.
5. **Planner writes and commits the ticket.** It appends a `## Plan` section to
   the selected `.kanban/issues/<id>.md` and commits it as `plan(#ID): ...`. It
   must commit, because the post-stage cleanliness check hard-stops the iteration
   on a dirty worktree (`ralph-loop.sh:1414-1418`).
6. **No status/scope authority.** The planner never changes `status:` and never
   splits or reorders the slice. The existing pending→in-progress→review→done
   state machine is untouched.
7. **No sentinel.** The planner prints NO `RALPH_RESULT:` line and exits 0
   (treated as success by `run_pi_adapter`). Any `DONE`/`BLOCKED`/`FAIL`/`NO_WORK`
   line would be misparsed by the driver's sentinel regexes
   (`ralph-loop.sh:609`, `:614`, `:624`).
8. **Drop the implementer's inline plan substep.** `SKILL.md:290` step 5 ("Plan —
   brief implementation approach") is removed so planning is not done twice; the
   implementer instead reads the `## Plan` block the planner wrote.

## Consequences

- The loop gains a genuine plan artifact per issue, persisted in the ticket and
  read cold by a fresh implementer — closer to the Fusion scout/plan discipline
  without nesting agents or re-enabling Fusion.
- Cost rises to roughly **3x workers per issue** (plan + implement + review),
  up from ~2x. Opt-out flag (e.g. `--no-plan-each` / `RALPH_PLAN_EACH=false`)
  should mirror the existing `--no-review-each` control.
- No change to `PI_SUBAGENT_CHILD=1`; Fusion, subagent-bridge, and pi-subagents
  stay disabled in the loop exactly as today.

## Risks

- **Soft coupling of determinism.** Coordination A assumes planner and
  implementer independently select the same issue. The
  `ACTIVE_COUNT==0 && UNBLOCKED_COUNT>0` gate guarantees eligible work exists, so
  a planner `NO_WORK`/implementer-disagree split should not fire — but it is an
  assumption, not an enforced invariant. The airtight alternative (driver
  pre-selects via a new `select_next_unblocked_pending` helper and injects the id
  into both prompts) was deliberately deferred as more code and a change to the
  implementer's self-select contract.

## Rejected options

- **Make the loop worker a Fusion parent.** Rejected now: contradicts the ralph
  SKILL (worker is the writer), re-introduces nested-subagent recursion that
  `PI_SUBAGENT_CHILD=1` exists to prevent, and complicates the per-iteration
  memory cap. Revisit only if the SKILL is rewritten to delegate.
- **Driver pre-selection (Coordination B).** Deferred: needs a new
  `select_next_unblocked_pending` selector and changes the implementer from
  self-select to told-what-to-do. Airtight, but larger; adopt only if the soft
  coupling above proves flaky in practice.
- **Planner with status/scope authority.** Rejected: touching `status:` or
  splitting slices would entangle the planner with the blocked/review state
  machine; keep it write-plan-only.
