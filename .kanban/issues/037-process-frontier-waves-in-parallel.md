---
id: 037
title: Process frontier waves in parallel
status: done
blocked_by: [036]
parent: null
priority: 0
created: 2026-07-22
updated: 2026-07-23
actor: pi
---

## What to build

Generalize the proven single-child path into dependency-frontier waves. `bin/gralph <parent> --jobs N --verify <command>` must run eligible children concurrently in separate branches and worktrees, review each result independently, and feed accepted workers to the existing serial landing path. After a successful wave, recompute GitHub dependency eligibility and continue until no open ready child remains or progress is impossible.

Default to two workers because worktrees do not isolate ports, databases, Docker names, or shared external fixtures. Parallel workers may implement and review concurrently; batch-branch merges and integration checks remain strictly serial.

## Acceptance criteria

- [x] `--jobs` accepts a positive integer and defaults to `2`; no more than that many worker processes run concurrently.
- [x] Every worker receives its own branch, worktree, logs, status, and review artifact.
- [x] Accepted workers enter a single serial merge queue; no two processes mutate the batch branch concurrently.
- [x] One worker failure does not cancel or discard successful siblings, but failed or blocked children prevent final publication.
- [x] Dependency eligibility is recomputed after each landed wave so newly unblocked children can enter the next wave.
- [x] The run exits non-zero with a manifest summary when open ready children remain but no progress can be made.
- [x] Fixture tests prove the concurrency bound, dependency-wave ordering, serial landing, and partial-failure behavior.

## Implementation Notes

The wave loop is split into three explicit top-level functions. `run_child_pipeline` performs the per-child claim, isolated branch/worktree creation, bounded Ralph worker, supervisor verification, coordinator commit, and independent reviewer for one target; it writes the entire result to a per-child sidecar (`.child-<N>-<runId>-result.json`) and never mutates the shared manifest, so concurrent pipelines cannot race. `orchestrate_waves` holds the run-wide coordinator lock for the entire run, picks the next eligible frontier (children whose `classification == "eligible"` and `execution.status` is unset), launches up to `--jobs` pipelines concurrently, and waits for the wave before folding. Between waves it calls `refresh_frontier`, which re-runs the GraphQL query from the recorded `baseSha` and merges fresh classification/dependencies into the manifest while retaining each child's claim/execution/review/merge runtime state.

`fold_child_result` is the only writer of the shared manifest for a child. It reads the sidecar, updates the child's claim/execution/review fields, and for accepted sidecars hands off to `merge_one_child` unchanged — batch-branch merges and integration verification therefore remain strictly serial even when `--jobs > 1`. Before each merge, the parent prunes any leftover batch worktree for the current run so successive merges can attach cleanly to the accumulated branch.

The orchestrator records a `.orchestration` summary (runId, jobs, waves, landed, failed, rejected, blocked, remainingOpenReady) and exits non-zero with that summary when open ready-for-agent children remain but no further progress is possible (all eligible children exhausted, blocked children still open). One wave child's failure does not kill siblings: each pipeline runs in its own forked shell and the wave's survivors still fold, merge, and land. `--jobs` is parsed as a positive integer (default 2) and refused with `exit 2` for any non-integer or non-positive value.

## Verification

`bash tests/gralph-parallel.test.sh`

## Blocked by

- Blocked by #036

## Notes for next iteration

- The wave orchestrator must reuse `merge_one_child` unchanged for serial
  landing; only the claim/worker/review path is parallelized.
- Frontier refresh between waves re-runs the GraphQL query from the recorded
  `baseSha` so newly-unblocked children become eligible in the next wave.
- Per-child sidecar result files (`.child-<N>-<runId>-result.json`) avoid
  concurrent manifest writes; the parent (serial) folds results in.