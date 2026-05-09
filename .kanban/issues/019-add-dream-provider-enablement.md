---
id: 019
title: Add dream provider enablement
status: in_progress
type: HITL
priority: 19
blocked_by: [013]
parent: null
created: 2026-05-09
updated: 2026-05-09
actor: ralph
---

## What to build

Add opt-in real-provider enablement for `pai-dream` after the deterministic and local/offline dream core exists. This is HITL because provider calls may transmit redacted but still sensitive local context outside the machine.

## Acceptance criteria

- [ ] Provider enablement is disabled by default and requires explicit user approval.
- [ ] Provider privacy labels are stored and shown before enablement.
- [ ] Redaction-before-provider tests run before any provider call path is enabled.
- [ ] Provider failures cannot corrupt raw events, accepted memories, or review queue state.
- [ ] Documentation explains when to use local/offline mode versus a real provider.

## Blocked by

- Blocked by #013.
