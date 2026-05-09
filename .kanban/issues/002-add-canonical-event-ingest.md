---
id: 002
title: Add canonical event ingest
status: done
type: AFK
priority: 2
blocked_by: [001, 003, 006]
parent: null
created: 2026-05-09
updated: 2026-05-09
actor: ralph
---

## What to build

Implement the canonical event ingest path so adapters can emit versioned, redacted lifecycle events with stable session identity, resolver-provided project identity, ordering, idempotency, and durable local storage. This slice must not write durable payload-bearing records until the central redaction pipeline and project identity resolver exist.

## Acceptance criteria

- [x] Canonical event envelope includes the fields defined in `.pai/docs/shared-harness-design.md`.
- [x] SQLite is the authoritative store and runs with WAL mode enabled.
- [x] Redacted JSONL inspection trails are written only after successful ingest or with explicit pending markers.
- [x] Event writes are idempotent by `event_id` and `(pai_session_id, sequence)`.
- [x] Schema migrations are versioned and tested.
- [x] Reconciliation tests cover SQLite and JSONL consistency after interrupted writes.
- [x] Concurrent write tests cover multiple harness-shaped fixtures.
- [x] Fixture tests cover ingest, duplicate events, ordered session events, and recovery metadata.

## Blocked by

- Blocked by #001.
- Blocked by #003.
- Blocked by #006.

## Implementation Notes

Implemented `.pai/src/event-store.ts` with a Bun SQLite-backed canonical event store, versioned migration metadata, WAL mode, idempotent ingest by `event_id` and `(pai_session_id, sequence)`, explicit pending JSONL markers, and SQLite-to-JSONL reconciliation. Exported the event-store contract from `.pai/src/index.ts` and added tests covering ingest, duplicate replay, ordered session events, recovery markers, WAL/migrations, redacted JSONL output, and concurrent harness-shaped writes.
