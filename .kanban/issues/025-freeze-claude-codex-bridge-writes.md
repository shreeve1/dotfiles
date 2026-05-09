---
id: 025
title: Freeze Claude/Codex bridge writes
status: pending
type: AFK
priority: 25
blocked_by: [023]
parent: 022
created: 2026-05-09
---

## Parent

#022

## What to build

Preserve existing Claude/Codex bridge provenance as archive-only data, and make attempted new Claude/Codex bridge record writes fail with a structured error instead of silently succeeding.

## Acceptance criteria

- [ ] Claude and Codex are configured as archive-only legacy bridge harnesses by default.
- [ ] New Claude bridge records/writes throw a structured archive-only error.
- [ ] New Codex bridge records/writes throw a structured archive-only error.
- [ ] Historical Claude/Codex bridge reads remain readable for migration/replay tests.
- [ ] Tests cover both the hard-error path and historical-read compatibility.
- [ ] Relevant `.pai` tests pass and `.pai` typecheck passes.
- [ ] This slice does not modify or delete files under `dotfiles/.claude/`.

## Blocked by

- Blocked by #023
