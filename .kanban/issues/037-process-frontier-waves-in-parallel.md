---
id: 037
title: Process frontier waves in parallel
status: pending
blocked_by: [036]
parent: null
priority: 0
created: 2026-07-22
---

## What to build

Generalize the proven single-child path into dependency-frontier waves. `bin/gralph <parent> --jobs N --verify <command>` must run eligible children concurrently in separate branches and worktrees, review each result independently, and feed accepted workers to the existing serial landing path. After a successful wave, recompute GitHub dependency eligibility and continue until no open ready child remains or progress is impossible.

Default to two workers because worktrees do not isolate ports, databases, Docker names, or shared external fixtures. Parallel workers may implement and review concurrently; batch-branch merges and integration checks remain strictly serial.

## Acceptance criteria

- [ ] `--jobs` accepts a positive integer and defaults to `2`; no more than that many worker processes run concurrently.
- [ ] Every worker receives its own branch, worktree, logs, status, and review artifact.
- [ ] Accepted workers enter a single serial merge queue; no two processes mutate the batch branch concurrently.
- [ ] One worker failure does not cancel or discard successful siblings, but failed or blocked children prevent final publication.
- [ ] Dependency eligibility is recomputed after each landed wave so newly unblocked children can enter the next wave.
- [ ] The run exits non-zero with a manifest summary when open ready children remain but no progress can be made.
- [ ] Fixture tests prove the concurrency bound, dependency-wave ordering, serial landing, and partial-failure behavior.

## Verification

`bash tests/gralph-parallel.test.sh`

## Blocked by

- Blocked by #036
