---
id: 035
title: Independently review a completed worker
status: pending
blocked_by: [034]
parent: null
priority: 0
created: 2026-07-22
---

## What to build

Add an independent review phase for a mechanically complete worker. Launch a separate fresh, ephemeral Pi process with a read-only review prompt containing the child issue, base SHA, committed diff, and verification results. The reviewer must not reuse the worker session or context and must produce a strict artifact under the run directory.

A review is accepted only when its declared status is `approved`, its critical finding count is zero, and its blocker count is zero. Any other or malformed result rejects landing while preserving all worker artifacts. Keep this gate local to Gralph rather than sourcing `bin/rralph`, whose top-level behavior is not a reusable library.

## Acceptance criteria

- [ ] Each mechanically complete worker launches exactly one separate `pi -p --no-session` reviewer with file mutation and network-changing commands disabled.
- [ ] The review input identifies the requested behavior, acceptance criteria, base SHA, full committed diff, and worker verification output.
- [ ] The reviewer writes a parseable artifact containing `status`, critical count, blocker count, and findings.
- [ ] Only `status: approved`, zero critical findings, and zero blockers passes the gate; missing, malformed, timed-out, or contradictory artifacts fail closed.
- [ ] A failed review updates the manifest and preserves the worker branch and worktree without attempting a merge.
- [ ] Fixture tests cover approval, requested changes, critical findings, blockers, malformed output, and reviewer process failure.

## Verification

`bash tests/gralph-review.test.sh`

## Blocked by

- Blocked by #034
