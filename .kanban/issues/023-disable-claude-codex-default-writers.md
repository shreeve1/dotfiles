---
id: 023
title: Disable Claude/Codex default writers
status: done
type: AFK
priority: 23
blocked_by: []
parent: 022
created: 2026-05-09
updated: 2026-05-09
actor: ralph
---

## Parent

#022

## What to build

Make Claude Code and Codex historical shared-memory adapters by default while leaving OpenCode and Pi as the only active default shared-memory writers.

## Acceptance criteria

- [x] Claude install fixtures render with `adapter_enablement.enabled: false` and `explicit_user_approval: false`.
- [x] Codex install fixtures render with `adapter_enablement.enabled: false` and `explicit_user_approval: false`.
- [x] OpenCode and Pi install fixtures render with `adapter_enablement.enabled: true` and `explicit_user_approval: true`.
- [x] Validation rejects any install plan that enables Claude/Codex as active shared-memory writers unless a future issue explicitly changes this policy.
- [x] Tests cover disabled and active default install plans.
- [x] Relevant `.pai` tests pass and `.pai` typecheck passes.
- [x] This slice does not modify or delete files under `dotfiles/.claude/`.

## Blocked by

None - can start immediately

## Implementation Notes

Verified the installer contract already enforces the #023 policy: Claude and Codex are disabled shared-memory targets by default, OpenCode and Pi remain active shared-memory targets, and validation rejects enabled Claude/Codex shared-memory install plans. No source changes were required beyond moving the kanban issue through Ralph status gates.
