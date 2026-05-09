---
id: 027
title: Document and reconcile kanban scope
status: review
type: AFK
priority: 27
blocked_by: [023, 024, 025, 026]
parent: 022
created: 2026-05-09
updated: 2026-05-09
actor: ralph
---

## Parent

#022

## What to build

Update the project board and shared-harness documentation so future work treats #022 as the controlling scope issue and understands that Claude/Codex are historical shared-memory adapters, not removed tools.

## Acceptance criteria

- [ ] `.kanban/progress.md` records #009/#010 as superseded for active shared-memory writes while retaining them as historical work.
- [ ] `.kanban/progress.md` records #008 as retained for historical reads/inventory with Claude/Codex archive-only for new bridge writes.
- [ ] `.kanban/progress.md` records #011/#012 as the active shared-memory writer path.
- [ ] `.kanban/progress.md` notes #013-#016 and #019-#021 can continue under the narrowed scope.
- [ ] Shared-harness docs describe OpenCode/Pi active-writer policy and Claude/Codex archive-only behavior.
- [ ] No existing issue is closed, archived, or deleted as part of this reconciliation.
- [ ] Final status points future AFK work at the lowest-numbered unblocked AFK issue among #013, #014, #016, #019, and #020, while #015 and #021 remain HITL.
- [ ] Relevant `.pai` tests pass and `.pai` typecheck passes.
- [ ] This slice does not modify or delete files under `dotfiles/.claude/`.

## Blocked by

- Blocked by #023
- Blocked by #024
- Blocked by #025
- Blocked by #026
