---
id: 002
title: Add canonical event ingest
status: review
type: AFK
blocked_by: [001, 003, 006]
parent: null
created: 2026-05-09
---

## What to build

Implement the canonical event ingest path so adapters can emit versioned, redacted lifecycle events with stable session identity, resolver-provided project identity, ordering, idempotency, and durable local storage. This slice must not write durable payload-bearing records until the central redaction pipeline and project identity resolver exist.

## Acceptance criteria

- [ ] Canonical event envelope includes the fields defined in `.pai/docs/shared-harness-design.md`.
- [ ] SQLite is the authoritative store and runs with WAL mode enabled.
- [ ] Redacted JSONL inspection trails are written only after successful ingest or with explicit pending markers.
- [ ] Event writes are idempotent by `event_id` and `(pai_session_id, sequence)`.
- [ ] Schema migrations are versioned and tested.
- [ ] Reconciliation tests cover SQLite and JSONL consistency after interrupted writes.
- [ ] Concurrent write tests cover multiple harness-shaped fixtures.
- [ ] Fixture tests cover ingest, duplicate events, ordered session events, and recovery metadata.

## Blocked by

- Blocked by #001.
- Blocked by #003.
- Blocked by #006.
