---
id: 018
title: Add installer contract template
status: in_progress
type: AFK
blocked_by: [004]
parent: null
created: 2026-05-09
---

## What to build

Define the adapter installation contract and template format before adapter tracer work invents incompatible config assumptions. This AFK slice must not modify live CLI config; it only defines the install plan format, validation rules, and fixture expectations used by later installer and adapter issues.

## Acceptance criteria

- [ ] Install plan schema represents target CLI, files to change, backup paths, symlink actions, adapter enablement, rollback notes, and required user approval.
- [ ] Template rules forbid live config mutation during adapter tracer issues.
- [ ] Negative guarantees cover no tracked-source symlink into runtime stores, no secret/runtime path exposure, and explicit adapter enablement.
- [ ] Fixture tests validate install plan rendering for Claude, Codex, OpenCode, and Pi without touching live config.
- [ ] Documentation states live application of install plans is deferred to the HITL safe installer issue.

## Blocked by

- Blocked by #004.
