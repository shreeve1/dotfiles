---
id: 016
title: End-to-end harness smoke test
status: pending
type: AFK
priority: 16
blocked_by: [009, 010, 011, 012, 013, 014, 015, 019, 020, 021]
parent: null
created: 2026-05-09
---

## What to build

Add an end-to-end smoke test that proves the shared harness can coordinate all supported CLIs through shared sessions, redacted events, searchable context, policy audit trails, and clean dotfiles boundaries.

## Acceptance criteria

- [ ] Smoke fixtures cover Claude, Codex, OpenCode, and Pi adapter flows without requiring live secrets.
- [ ] Sample `pai-run` flows produce canonical session IDs and redacted event records.
- [ ] `pai-memory` can search and render bounded context from fixture events and proposed memories.
- [ ] Policy decisions are auditable through canonical event references.
- [ ] Repo cleanliness checks prove no runtime DBs, JSONL trails, transcripts, auth files, or local memories are tracked.

## Blocked by

- Blocked by #009.
- Blocked by #010.
- Blocked by #011.
- Blocked by #012.
- Blocked by #013.
- Blocked by #014.
- Blocked by #015.
- Blocked by #019.
- Blocked by #020.
- Blocked by #021.
