---
id: 017
title: Add canonical memory substrate
status: done
type: AFK
priority: 17
blocked_by: [002, 003, 006]
parent: null
created: 2026-05-09
updated: 2026-05-09
actor: ralph
---

## What to build

Define the canonical durable memory schema and local store used by `pai-memory`, legacy migration, dream distillation, retrieval, and ISA compatibility. This slice creates the common substrate before any feature invents its own memory shape.

## Acceptance criteria

- [x] Memory record schema covers ID, type, scope, source event IDs, provenance, confidence, assertion type, trust level, review status, timestamps, expiration, and revalidation rules.
- [x] Store schema includes typed paths or tables for `profile`, `projects`, `tools`, `learning`, `work`, and `procedures`.
- [x] Review queue schema supports proposed memories, diffs, accept/reject/defer state, and source event references.
- [x] Low-trust and inferred memories are explicitly barred from instruction injection by schema or query constraints.
- [x] Tests cover schema migration, provenance preservation, review queue state transitions, and trust-gated retrieval eligibility.

## Blocked by

- Blocked by #002.
- Blocked by #003.
- Blocked by #006.

## Implementation Notes

Added `CanonicalMemoryStore` with versioned SQLite migrations, typed memory store paths, canonical memory records, review queue transitions, and instruction-eligible retrieval constraints. The schema preserves source event IDs and provenance, carries confidence/assertion/trust/review metadata, and explicitly excludes low-trust, inferred, or unaccepted memories from instruction injection eligibility. Tests cover migrations, typed stores, provenance preservation, review queue accept/reject/defer-style transitions, and trust-gated retrieval filters.
