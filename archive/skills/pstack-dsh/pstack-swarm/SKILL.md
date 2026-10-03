---
name: pstack-swarm
description: "Fan out N parallel workers, drain them, and return one report. Use for /pstack-swarm, 'swarm this', or parallel coverage, races, gauntlets, and exploration."
disable-model-invocation: true
---

> **DSH port.** Read `../_shared/pstack-dsh-compatibility.md` before acting. This skill is isolated, user-invoked, and namespaced for side-by-side comparison.

# Swarm

Fan out N parallel workers. They may cover separate slices, race the same brief, or mix both. The parent waits, aggregates, and returns one report.

## Start

Open a todolist with one entry per phase before launching anything.

1. Frame
2. Fan out
3. Aggregate
4. Report

## Phase A: Frame

1. State the done predicate and the artifact or report the swarm must return.
2. Choose the shape. Partition into slices, race N workers on identical briefs, or mix both. For a race or mixed shape, declare `first pass`, `rank all`, or `best-of` before spawning.
3. Set N from the user or derive it from the shape. N is total workers, not the in-flight cap.
4. Pick the worker route from `swarm workers` in `~/.dsh/pstack-models.md` when present. Otherwise inherit the current route. For a model race, name each confirmed provider/model arm up front.
5. Give each worker its own writable output when it writes.

## Phase B: Fan out

Spawn all N workers in one assistant message with `delegate_worker` for implementation slices, `delegate_scout` for read-only exploration, or `subagent` when neither role fits. These tools run in the background by default. Pass a provider/model override only when `~/.dsh/pstack-models.md` names a confirmed route.

Every delegate shares the current workspace unless its tool contract states otherwise. When branch isolation is required, create or select distinct worktrees before delegation and give each worker its exact working directory and branch.

Every brief stands alone. Include the goal, scope, exact slice or race arm, how to verify, and what to report. Reports use `PASS`, `ISSUES`, or `BLOCKED` with evidence.

If a worker drops out, proceed with N-1 and note it.

## Phase C: Aggregate

Read the terminal results. For coverage, every required slice needs a result. For a race, apply the selection rule declared up front. Use first pass, rank all, or best-of. Do not paste raw worker dumps.

Keep a compact result table, one-line evidenced issues, and explicit gaps or dropouts.

## Phase D: Report

Return one consolidated in-chat report with the table, issue one-liners, gaps or dropouts, and the race rule when used.
