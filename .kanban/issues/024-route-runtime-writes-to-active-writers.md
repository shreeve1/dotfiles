---
id: 024
title: Route runtime writes to active writers
status: pending
type: AFK
priority: 24
blocked_by: [023]
parent: 022
created: 2026-05-09
---

## Parent

#022

## What to build

Update the shared session wrapper so Claude and Codex remain recognized targets for compatibility and replay, but only OpenCode and Pi emit new shared-memory lifecycle events.

## Acceptance criteria

- [ ] Runtime target metadata marks Claude and Codex as disabled shared-memory writers.
- [ ] Runtime target metadata keeps OpenCode and Pi as enabled shared-memory writers.
- [ ] Building a Claude or Codex run plan preserves launch information but produces no shared-memory lifecycle events.
- [ ] Building an OpenCode or Pi run plan still produces the expected lifecycle events.
- [ ] Tests prove disabled targets are skipped without removing target recognition.
- [ ] Relevant `.pai` tests pass and `.pai` typecheck passes.
- [ ] This slice does not modify or delete files under `dotfiles/.claude/`.

## Blocked by

- Blocked by #023
