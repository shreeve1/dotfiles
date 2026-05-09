---
id: 025
title: Freeze Claude/Codex bridge writes
status: done
type: AFK
priority: 25
blocked_by: [023]
parent: 022
created: 2026-05-09
updated: 2026-05-09
actor: ralph
---

## Parent

#022

## What to build

Preserve existing Claude/Codex bridge provenance as archive-only data, and make attempted new Claude/Codex bridge record writes fail with a structured error instead of silently succeeding.

## Acceptance criteria

- [x] Claude and Codex are configured as archive-only legacy bridge harnesses by default.
- [x] New Claude bridge records/writes throw a structured archive-only error.
- [x] New Codex bridge records/writes throw a structured archive-only error.
- [x] Historical Claude/Codex bridge reads remain readable for migration/replay tests.
- [x] Tests cover both the hard-error path and historical-read compatibility.
- [x] Relevant `.pai` tests pass and `.pai` typecheck passes.
- [x] This slice does not modify or delete files under `dotfiles/.claude/`.

## Blocked by

- Blocked by #023

## Implementation Notes

Verified the legacy bridge already enforces archive-only behavior for Claude and Codex by default through `ARCHIVE_ONLY_HARNESSES` and `LegacyArchiveOnlyError`. New Claude/Codex bridge-read writes throw structured archive-only errors, while tests preserve historical-read compatibility through configurable fixture behavior.
