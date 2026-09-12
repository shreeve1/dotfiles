---
id: 055
title: Scope-aware scheduling and out-of-scope bounce
status: pending
blocked_by: [054]
parent: null
created: 2026-09-10
updated: 2026-09-10
actor: to-tickets

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

- [ ] Two ready tickets with overlapping `files:` run in different waves
      (serialized); with disjoint scopes they share a wave
- [ ] A lane diff outside its declared scope bounces at landing with the
      offending paths in the reason
- [ ] Tickets without `files:` behave exactly as before this change

## Verification

`bash tests/tralph-scopes.test.sh`
