---
id: 007
title: Add memory review CLI
status: pending
type: AFK
blocked_by: [002, 003, 017]
parent: null
created: 2026-05-09
---

## What to build

Create the first `pai-memory` CLI surface for searching memories, generating context blocks, and reviewing proposed durable memories before promotion.

## Acceptance criteria

- [ ] `pai-memory search` supports SQLite FTS and filters for project, type, confidence, trust, recency, and harness.
- [ ] `pai-memory context` returns bounded retrieval-gated context with provenance metadata.
- [ ] `pai-memory review` lists proposed memories with source events, confidence, assertion type, trust level, and diff preview.
- [ ] Review actions support accept, reject, and defer in a local runtime queue.
- [ ] Tests cover low-trust memories never being injected as instructions.

## Blocked by

- Blocked by #002.
- Blocked by #003.
- Blocked by #017.
