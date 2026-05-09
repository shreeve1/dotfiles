---
id: 008
title: Add legacy migration inventory bridge
status: done
type: AFK
priority: 8
blocked_by: [002, 003, 017]
parent: null
created: 2026-05-09
updated: 2026-05-09
actor: ralph
---

## What to build

Add a non-destructive migration inventory and bridge-read layer for legacy Claude and Codex PAI memory surfaces. This AFK slice must not promote or import sensitive legacy payloads into canonical memory; promotion is handled by a separate HITL issue.

## Acceptance criteria

- [x] Bridge inventories legacy Claude, Codex, OpenCode, and Pi surfaces without modifying them.
- [x] Inventory excludes denied paths, auth files, private keys, and transcript classes marked out of scope.
- [x] Bridge-read records preserve provenance to original legacy paths without copying sensitive payloads.
- [x] Canonical writes are limited to inventory metadata and bridge-read indexes under `~/.pai`.
- [x] Tests prove inventory and bridge-read do not modify legacy files or promote duplicate memories.

## Blocked by

- Blocked by #002.
- Blocked by #003.
- Blocked by #017.

## Implementation Notes

Added `LegacyMigrationBridge` with versioned runtime-local SQLite tables for legacy inventory metadata and bridge-read indexes. The bridge inventories Claude, Codex, OpenCode, and Pi roots read-only, skips denied/auth/private-key/transcript paths, records provenance and path hashes, and never copies legacy payload content into canonical memory. Tests verify legacy files are not modified, sensitive paths are skipped, bridge-read records preserve provenance without copied payloads, and canonical memory remains empty during bridge inventory/indexing.
