---
id: 019
title: Add dream provider enablement
status: done
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

- [x] Provider enablement is disabled by default and requires explicit user approval.
- [x] Provider privacy labels are stored and shown before enablement.
- [x] Redaction-before-provider tests run before any provider call path is enabled.
- [x] Provider failures cannot corrupt raw events, accepted memories, or review queue state.
- [x] Documentation explains when to use local/offline mode versus a real provider.

## Blocked by

- Blocked by #013.

## Implementation Notes

Added opt-in real-provider enablement gates for `pai-dream`. `claude-inference` is disabled by default, requires `--enable-provider --approve-provider`, exposes privacy labels before use, and remains a no-transport placeholder in this safe slice. Redaction validation runs before external-provider transport, and tests prove unsafe events are skipped before provider calls and provider failures do not mutate accepted memories or review queues.
