---
id: 027
title: Document and reconcile kanban scope
status: done
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

- [x] `.kanban/progress.md` records #009/#010 as superseded for active shared-memory writes while retaining them as historical work.
- [x] `.kanban/progress.md` records #008 as retained for historical reads/inventory with Claude/Codex archive-only for new bridge writes.
- [x] `.kanban/progress.md` records #011/#012 as the active shared-memory writer path.
- [x] `.kanban/progress.md` notes #013-#016 and #019-#021 can continue under the narrowed scope.
- [x] Shared-harness docs describe OpenCode/Pi active-writer policy and Claude/Codex archive-only behavior.
- [x] No existing issue is closed, archived, or deleted as part of this reconciliation.
- [x] Final status points future AFK work at the lowest-numbered unblocked AFK issue among #013, #014, #016, #019, and #020, while #015 and #021 remain HITL.
- [x] Relevant `.pai` tests pass and `.pai` typecheck passes.
- [x] This slice does not modify or delete files under `dotfiles/.claude/`.

## Blocked by

- Blocked by #023
- Blocked by #024
- Blocked by #025
- Blocked by #026

## Implementation Notes

Added a kanban scope reconciliation section to `.pai/docs/shared-harness-design.md` naming #022 as the controlling scope issue, preserving #009/#010 as historical tracer work, retaining #008 for historical reads/inventory, and identifying #011/#012 as the active OpenCode/Pi writer path. Logged the same decisions in `.kanban/progress.md`, including that #013-#016 and #019-#021 continue under narrowed scope, #020 is the next unblocked AFK issue, and HITL issues still require human approval.
