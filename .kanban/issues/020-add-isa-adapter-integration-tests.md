---
id: 020
title: Add ISA adapter integration tests
status: done
type: AFK
priority: 20
blocked_by: [009, 010, 014]
parent: null
created: 2026-05-09
updated: 2026-05-09
actor: ralph
---

## What to build

Add integration fixtures proving ISA compatibility works with the Claude and Codex adapter tracers after the standalone PRD-to-ISA mapping exists.

## Acceptance criteria

- [x] Claude adapter fixtures prove PRD-style sessions can resume, sync, and finalize through compatibility behavior.
- [x] Codex adapter fixtures prove PRD-centered enforcement remains compatible while ISA is canonical.
- [x] ISA-style sessions work without generating compatibility PRDs unless legacy hooks require them.
- [x] Tests prove finalization gates reference canonical ISA verification state.
- [x] Failures identify whether the break is in mapping, adapter event emission, or legacy compatibility generation.

## Blocked by

- Blocked by #009.
- Blocked by #010.
- Blocked by #014.

## Implementation Notes

Added fixture-only ISA adapter integration tests in `.pai/tests/isa-adapter-integration.test.ts`. The tests combine `isa-compatibility` mapping/rendering/compatibility PRD generation with Claude and Codex tracer event fixtures, proving PRD-style Claude resume/sync/finalize behavior, Codex PRD-centered transitional enforcement, ISA-native no-compatibility-PRD behavior unless legacy hooks require it, canonical ISA verification finalization gates, boundary-specific diagnostics, and disabled Claude/Codex active-writer defaults.
