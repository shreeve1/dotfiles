---
id: 004
title: Add canonical policy contract
status: done
type: HITL
priority: 4
blocked_by: [001, 003]
parent: null
created: 2026-05-09
updated: 2026-05-09
actor: ralph
---

## What to build

Define and implement the canonical `pai-policy` request and response contract so each CLI adapter can map local tool, permission, and lifecycle events into one shared policy decision model. This is HITL because it governs security and destructive-action behavior.

## Acceptance criteria

- [x] `PolicyRequest`, `PolicyResponse`, and `AdapterCapabilities` schemas are implemented and documented.
- [x] Policy actions include `allow`, `deny`, `confirm`, `warn`, `redact`, and `degrade`.
- [x] Fail-open and fail-closed behavior matches the design: memory/logging/injection degrade, security/destructive policy blocks or confirms.
- [x] Adapter capability mismatches produce explicit degraded events rather than silent success.
- [x] Policy mapping tests cover Claude, Codex, OpenCode, and Pi fixture requests.

## Blocked by

- Blocked by #001.
- Blocked by #003.

## Implementation Notes

Added `.pai/src/policy.ts` with the canonical policy request, response, adapter capability, action, severity, and schema metadata contract. Added `evaluatePolicy` to map memory/logging/context failures to explicit degraded events while security-sensitive and destructive actions confirm, deny, or produce critical degraded events when enforcement is unavailable. Documented the contract in `.pai/docs/policy-contract.md`, exported it from `.pai/src/index.ts`, updated the `pai-policy` stub to expose canonical actions, and added adapter fixture tests for Claude, Codex, OpenCode, and Pi.
