---
id: 007
title: Add memory review CLI
status: done
type: AFK
blocked_by: [002, 003, 017]
parent: null
created: 2026-05-09
updated: 2026-05-09
actor: ralph
---

## What to build

Create the first `pai-memory` CLI surface for searching memories, generating context blocks, and reviewing proposed durable memories before promotion.

## Acceptance criteria

- [x] `pai-memory search` supports SQLite FTS and filters for project, type, confidence, trust, recency, and harness.
- [x] `pai-memory context` returns bounded retrieval-gated context with provenance metadata.
- [x] `pai-memory review` lists proposed memories with source events, confidence, assertion type, trust level, and diff preview.
- [x] Review actions support accept, reject, and defer in a local runtime queue.
- [x] Tests cover low-trust memories never being injected as instructions.

## Blocked by

- Blocked by #002.
- Blocked by #003.
- Blocked by #017.

## Implementation Notes

Added `pai-memory` search, context, and review commands backed by `CanonicalMemoryStore`. Added FTS migration support for memory content/provenance search, metadata filters for project/type/confidence/trust/recency/harness, bounded context blocks from trust-gated instruction-eligible memories, and review list/action flows for proposed memories. Tests cover CLI search/context/review behavior, review metadata visibility, FTS filters, and exclusion of low-trust/inferred memories from instruction context.
