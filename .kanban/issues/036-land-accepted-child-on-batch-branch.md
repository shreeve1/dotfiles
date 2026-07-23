---
id: 036
title: Land one accepted child on a batch branch
status: blocked
blocked_by: [035]
parent: null
priority: 0
created: 2026-07-22
updated: 2026-07-23
actor: ralph
---

## What to build

Land one reviewed child onto a dedicated `gralph/<parent>` batch branch. Create the batch branch from the immutable base SHA recorded during frontier planning, merge the accepted worker serially, and run the operator-supplied integration verification command against the combined tree. This slice stops before pushing or opening a pull request.

## Acceptance criteria

- [ ] The batch branch starts from the manifest's recorded base SHA rather than the caller's moving HEAD.
- [ ] Only a mechanically complete child with an approved review artifact can be merged.
- [ ] The merge is non-interactive and serial, and its resulting SHA is recorded in the manifest.
- [ ] The integration command supplied through `--verify` runs after the merge and must exit zero before the child is marked landed.
- [ ] A merge conflict or integration failure aborts the attempted landing, records the failure, and preserves both branches and worktrees without pushing or closing issues.
- [ ] Tests cover an accepted merge, rejected unreviewed work, a conflict, an integration failure, and a stale base SHA.

## Verification

`bash tests/gralph-merge.test.sh`

## Blocked by

- Blocked by #035

## Blocker

The required local branch names cannot coexist in Git. Issue #034 requires and currently creates `gralph/<parent>/issue-<child>`, while this issue requires `gralph/<parent>`. Git refs are path-shaped: the worker branch needs `refs/heads/gralph/<parent>/` to be a directory, but the batch branch needs that same path to be a file. Git rejects creation with `cannot lock ref`. Resolve the naming contract (for example, choose `gralph/<parent>/batch` or rename the worker namespace) before implementation.
