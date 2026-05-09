---
id: 024
title: Route runtime writes to active writers
status: done
type: AFK
priority: 24
blocked_by: [023]
parent: 022
created: 2026-05-09
updated: 2026-05-09
actor: ralph
---

## Parent

#022

## What to build

Update the shared session wrapper so Claude and Codex remain recognized targets for compatibility and replay, but only OpenCode and Pi emit new shared-memory lifecycle events.

## Acceptance criteria

- [x] Runtime target metadata marks Claude and Codex as disabled shared-memory writers.
- [x] Runtime target metadata keeps OpenCode and Pi as enabled shared-memory writers.
- [x] Building a Claude or Codex run plan preserves launch information but produces no shared-memory lifecycle events.
- [x] Building an OpenCode or Pi run plan still produces the expected lifecycle events.
- [x] Tests prove disabled targets are skipped without removing target recognition.
- [x] Relevant `.pai` tests pass and `.pai` typecheck passes.
- [x] This slice does not modify or delete files under `dotfiles/.claude/`.

## Blocked by

- Blocked by #023

## Implementation Notes

Verified the shared session wrapper already routes lifecycle writes only through active shared-memory writers: Claude and Codex remain recognized launch targets with preserved commands and environment, but `buildLifecycleEvents` returns no events for them; OpenCode and Pi remain enabled and emit lifecycle events. No source changes were required beyond moving the kanban issue through Ralph status gates.
