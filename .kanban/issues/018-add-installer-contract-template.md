---
id: 018
title: Add installer contract template
status: done
type: AFK
blocked_by: [004]
parent: null
created: 2026-05-09
updated: 2026-05-09
actor: ralph
---

## What to build

Define the adapter installation contract and template format before adapter tracer work invents incompatible config assumptions. This AFK slice must not modify live CLI config; it only defines the install plan format, validation rules, and fixture expectations used by later installer and adapter issues.

## Acceptance criteria

- [x] Install plan schema represents target CLI, files to change, backup paths, symlink actions, adapter enablement, rollback notes, and required user approval.
- [x] Template rules forbid live config mutation during adapter tracer issues.
- [x] Negative guarantees cover no tracked-source symlink into runtime stores, no secret/runtime path exposure, and explicit adapter enablement.
- [x] Fixture tests validate install plan rendering for Claude, Codex, OpenCode, and Pi without touching live config.
- [x] Documentation states live application of install plans is deferred to the HITL safe installer issue.

## Blocked by

- Blocked by #004.

## Implementation Notes

- Added `InstallPlan` schema, fixture renderer, and validator in `.pai/src/installer-contract.ts`.
- Added rules rejecting live config mutation, missing approval, implicit adapter enablement, forbidden runtime/secret path exposure, missing backups, and tracked-source symlinks into runtime stores.
- Added source-controlled installer contract documentation that states live application is deferred to the HITL safe installer issue.
- Added fixture tests for Claude, Codex, OpenCode, and Pi without touching live CLI config.
