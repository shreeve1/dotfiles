---
id: 014
title: Add ISA compatibility mapping tracer
status: in_progress
type: AFK
priority: 14
blocked_by: [007, 008]
parent: null
created: 2026-05-09
updated: 2026-05-09
actor: ralph
---

## What to build

Add the schema and mapping path that makes ISA canonical while preserving enough PRD compatibility for later Claude and Codex adapter integration.

## Acceptance criteria

- [ ] PRD-to-ISA import mapping covers title, status, progress, criteria, plan, changelog, and verification state.
- [ ] Canonical ISA files use the fixed section order from the PAI Algorithm.
- [ ] Compatibility PRDs are generated only where legacy hooks require them.
- [ ] Mapping fixture tests cover PRD-style and ISA-style work artifacts without requiring live Claude or Codex hooks.
- [ ] Migration order is documented: read support, dual-read, canonical-write, legacy read-only, removal.

## Blocked by

- Blocked by #007.
- Blocked by #008.
