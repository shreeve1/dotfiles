---
id: 004
title: Add canonical policy contract
status: pending
type: HITL
blocked_by: [001, 003]
parent: null
created: 2026-05-09
---

## What to build

Define and implement the canonical `pai-policy` request and response contract so each CLI adapter can map local tool, permission, and lifecycle events into one shared policy decision model. This is HITL because it governs security and destructive-action behavior.

## Acceptance criteria

- [ ] `PolicyRequest`, `PolicyResponse`, and `AdapterCapabilities` schemas are implemented and documented.
- [ ] Policy actions include `allow`, `deny`, `confirm`, `warn`, `redact`, and `degrade`.
- [ ] Fail-open and fail-closed behavior matches the design: memory/logging/injection degrade, security/destructive policy blocks or confirms.
- [ ] Adapter capability mismatches produce explicit degraded events rather than silent success.
- [ ] Policy mapping tests cover Claude, Codex, OpenCode, and Pi fixture requests.

## Blocked by

- Blocked by #001.
- Blocked by #003.
