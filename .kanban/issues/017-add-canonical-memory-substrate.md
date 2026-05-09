---
id: 017
title: Add canonical memory substrate
status: pending
type: AFK
blocked_by: [002, 003, 006]
parent: null
created: 2026-05-09
---

## What to build

Define the canonical durable memory schema and local store used by `pai-memory`, legacy migration, dream distillation, retrieval, and ISA compatibility. This slice creates the common substrate before any feature invents its own memory shape.

## Acceptance criteria

- [ ] Memory record schema covers ID, type, scope, source event IDs, provenance, confidence, assertion type, trust level, review status, timestamps, expiration, and revalidation rules.
- [ ] Store schema includes typed paths or tables for `profile`, `projects`, `tools`, `learning`, `work`, and `procedures`.
- [ ] Review queue schema supports proposed memories, diffs, accept/reject/defer state, and source event references.
- [ ] Low-trust and inferred memories are explicitly barred from instruction injection by schema or query constraints.
- [ ] Tests cover schema migration, provenance preservation, review queue state transitions, and trust-gated retrieval eligibility.

## Blocked by

- Blocked by #002.
- Blocked by #003.
- Blocked by #006.
