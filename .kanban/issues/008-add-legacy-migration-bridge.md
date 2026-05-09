---
id: 008
title: Add legacy migration inventory bridge
status: review
type: AFK
blocked_by: [002, 003, 017]
parent: null
created: 2026-05-09
---

## What to build

Add a non-destructive migration inventory and bridge-read layer for legacy Claude and Codex PAI memory surfaces. This AFK slice must not promote or import sensitive legacy payloads into canonical memory; promotion is handled by a separate HITL issue.

## Acceptance criteria

- [ ] Bridge inventories legacy Claude, Codex, OpenCode, and Pi surfaces without modifying them.
- [ ] Inventory excludes denied paths, auth files, private keys, and transcript classes marked out of scope.
- [ ] Bridge-read records preserve provenance to original legacy paths without copying sensitive payloads.
- [ ] Canonical writes are limited to inventory metadata and bridge-read indexes under `~/.pai`.
- [ ] Tests prove inventory and bridge-read do not modify legacy files or promote duplicate memories.

## Blocked by

- Blocked by #002.
- Blocked by #003.
- Blocked by #017.
