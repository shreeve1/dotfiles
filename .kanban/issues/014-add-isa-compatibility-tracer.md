---
id: 014
title: Add ISA compatibility mapping tracer
status: done
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

- [x] PRD-to-ISA import mapping covers title, status, progress, criteria, plan, changelog, and verification state.
- [x] Canonical ISA files use the fixed section order from the PAI Algorithm.
- [x] Compatibility PRDs are generated only where legacy hooks require them.
- [x] Mapping fixture tests cover PRD-style and ISA-style work artifacts without requiring live Claude or Codex hooks.
- [x] Migration order is documented: read support, dual-read, canonical-write, legacy read-only, removal.

## Blocked by

- Blocked by #007.
- Blocked by #008.

## Implementation Notes

Added `.pai/src/isa-compatibility.ts` with PRD-to-ISA mapping, canonical ISA section-order rendering, compatibility PRD generation gated by explicit legacy hook requirements, and migration-order constants. Exported the API from `.pai/src/index.ts`, documented the mapping and migration order in `.pai/docs/isa-compatibility.md`, and added fixture-only tests covering PRD-style and ISA-style artifacts without live Claude or Codex hooks.
