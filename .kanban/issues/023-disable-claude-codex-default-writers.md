---
id: 023
title: Disable Claude/Codex default writers
status: in_progress
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

- [ ] Claude install fixtures render with `adapter_enablement.enabled: false` and `explicit_user_approval: false`.
- [ ] Codex install fixtures render with `adapter_enablement.enabled: false` and `explicit_user_approval: false`.
- [ ] OpenCode and Pi install fixtures render with `adapter_enablement.enabled: true` and `explicit_user_approval: true`.
- [ ] Validation rejects any install plan that enables Claude/Codex as active shared-memory writers unless a future issue explicitly changes this policy.
- [ ] Tests cover disabled and active default install plans.
- [ ] Relevant `.pai` tests pass and `.pai` typecheck passes.
- [ ] This slice does not modify or delete files under `dotfiles/.claude/`.

## Blocked by

None - can start immediately
