---
id: 011
title: Add OpenCode adapter tracer
status: pending
type: AFK
blocked_by: [004, 005, 007, 018]
parent: null
created: 2026-05-09
---

## What to build

Implement the first OpenCode adapter tracer library and installable templates with a responsibility matrix that avoids conflicts with existing OpenCode PAI plugins for mode routing, ISA sync, containment, config audit, and reflection.

## Acceptance criteria

- [ ] Responsibility matrix documents which plugin or adapter owns routing, ISA sync, containment, event emission, retrieval, and reflection.
- [ ] Adapter emits canonical events without double-injecting context or double-syncing ISA.
- [ ] This issue does not mutate live OpenCode config or plugin ordering; it produces installable templates or fixtures only.
- [ ] Plugin ordering and idempotency are covered by tests or deterministic fixtures.
- [ ] Retrieval integration uses `pai-memory context` and respects trust/instruction boundaries.
- [ ] Degraded capability events are emitted when OpenCode plugin surfaces cannot enforce a decision.

## Blocked by

- Blocked by #004.
- Blocked by #005.
- Blocked by #007.
- Blocked by #018.
