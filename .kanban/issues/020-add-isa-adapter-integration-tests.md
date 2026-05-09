---
id: 020
title: Add ISA adapter integration tests
status: pending
type: AFK
priority: 20
blocked_by: [009, 010, 014]
parent: null
created: 2026-05-09
---

## What to build

Add integration fixtures proving ISA compatibility works with the Claude and Codex adapter tracers after the standalone PRD-to-ISA mapping exists.

## Acceptance criteria

- [ ] Claude adapter fixtures prove PRD-style sessions can resume, sync, and finalize through compatibility behavior.
- [ ] Codex adapter fixtures prove PRD-centered enforcement remains compatible while ISA is canonical.
- [ ] ISA-style sessions work without generating compatibility PRDs unless legacy hooks require them.
- [ ] Tests prove finalization gates reference canonical ISA verification state.
- [ ] Failures identify whether the break is in mapping, adapter event emission, or legacy compatibility generation.

## Blocked by

- Blocked by #009.
- Blocked by #010.
- Blocked by #014.
