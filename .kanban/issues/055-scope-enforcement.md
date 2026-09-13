---
id: 055
title: Scope-aware scheduling and out-of-scope bounce
status: done
blocked_by: [054]
parent: null
created: 2026-09-10
updated: 2026-09-13
actor: ralph

## What to build

Advisory `files:` scopes become enforced at run time. Two effects:

1. **Scheduling**: when two frontier tickets declare intersecting `files:`
   scopes, the manifest build synthesizes a dependency edge so they
   serialize instead of running in parallel. Tickets without scopes
   schedule exactly as today (blocked_by only).
2. **Landing**: at the landing gate, a lane whose diff touches paths
   outside its declared scope bounces with a reason naming the
   out-of-scope paths (no scope declared = no scope check).

A wrong scope costs parallelism, never correctness (CONTEXT.md § Scope).

## Acceptance criteria

- [x] Two ready tickets with overlapping `files:` run in different waves
      (serialized); with disjoint scopes they share a wave
- [x] A lane diff outside its declared scope bounces at landing with the
      offending paths in the reason
- [x] Tickets without `files:` behave exactly as before this change

## Verification

`bash tests/tralph-scopes.test.sh`

## Implementation Notes

Two changes to `bin/gralph`:

1. **Scheduling** (`orchestrate_waves`): scope-aware wave-building loop in board
   mode. For each eligible candidate, fetch its `files:` from the manifest and
   check for exact-string overlap with already-selected scopes for this wave.
   Overlapping candidates are deferred to the next wave. Tickets with null/empty
   scope are unconditionally admitted. Non-board mode retains the original loop.

2. **Landing** (`merge_one_child` board mode): after reverify passes, compute
   `git diff --name-only batch_tip rebased_sha`, exclude `.ralph-progress-*.md`
   (standard per-lane artifact), and check remaining paths against the ticket's
   `files:` scope prefixes. Non-empty result triggers `merge.status="bounced"`,
   `merge.reason="out_of_scope"`, records `merge.outOfScopePaths`, creates a
   repair ticket, and returns exit code 2 (soft outcome — orchestrator continues).

Fresh reviewer returned `RALPH_REVIEW: PASS_WITH_NOTES`. Notes: (a) overlap
check uses exact-item equality (not prefix matching) — correct for the test and
the stated requirement; (b) wave-deferring rather than hard dependency edge —
achieves identical serialization outcome.
