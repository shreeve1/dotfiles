---
id: 036
title: Land one accepted child on a batch branch
status: done
blocked_by: [035]
parent: null
priority: 0
created: 2026-07-22
updated: 2026-07-23
actor: ralph
---

## What to build

Land one reviewed child onto a dedicated `gralph/<parent>/batch` branch. Create the batch branch from the immutable base SHA recorded during frontier planning, merge the accepted worker serially, and run the operator-supplied integration verification command against the combined tree. This slice stops before pushing or opening a pull request.

## Acceptance criteria

- [x] The batch branch starts from the manifest's recorded base SHA rather than the caller's moving HEAD.
- [x] Only a mechanically complete child with an approved review artifact can be merged.
- [x] The merge is non-interactive and serial, and its resulting SHA is recorded in the manifest.
- [x] The integration command supplied through `--verify` runs after the merge and must exit zero before the child is marked landed.
- [x] A merge conflict or integration failure aborts the attempted landing, records the failure, and preserves both branches and worktrees without pushing or closing issues.
- [x] Tests cover an accepted merge, rejected unreviewed work, a conflict, an integration failure, and a stale base SHA.

## Implementation Notes

Extended `execute_one_child` with an extracted `merge_one_child` that requires `execution.status == "complete"` and `review.gate == "accepted"` before creating `gralph/<parent>/batch` from the manifest's recorded base SHA, performing a `--no-ff --no-edit` merge, aborting on conflict, and running the integration command with credentials scrubbed. Failure modes (`not_reviewed`, `merge_conflict`, `integration_failed`, `stale_base_sha`) record a manifest reason and leave the worker branch and any batch worktree on disk for inspection. Terminal execution status advances from `reviewed` to `landed`, with the merge subobject capturing `batchBranch`, `mergedSha`, `integrationExitCode`, `integrationLog`, and `landedSha`. Existing single-child and review tests were updated for the new terminal status; `tests/gralph-merge.test.sh` exercises accepted merge, rejected unreviewed, conflict, integration failure, and stale-base scenarios by sourcing `merge_one_child` directly from `bin/gralph`.

## Verification

`bash tests/gralph-merge.test.sh`

## Blocked by

- Blocked by #035
