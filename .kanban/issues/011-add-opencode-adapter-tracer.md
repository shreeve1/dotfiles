---
id: 011
title: Add OpenCode adapter tracer
status: done
type: AFK
blocked_by: [004, 005, 007, 018]
parent: null
created: 2026-05-09
updated: 2026-05-09
actor: ralph
---

## What to build

Implement the first OpenCode adapter tracer library and installable templates with a responsibility matrix that avoids conflicts with existing OpenCode PAI plugins for mode routing, ISA sync, containment, config audit, and reflection.

## Acceptance criteria

- [x] Responsibility matrix documents which plugin or adapter owns routing, ISA sync, containment, event emission, retrieval, and reflection.
- [x] Adapter emits canonical events without double-injecting context or double-syncing ISA.
- [x] This issue does not mutate live OpenCode config or plugin ordering; it produces installable templates or fixtures only.
- [x] Plugin ordering and idempotency are covered by tests or deterministic fixtures.
- [x] Retrieval integration uses `pai-memory context` and respects trust/instruction boundaries.
- [x] Degraded capability events are emitted when OpenCode plugin surfaces cannot enforce a decision.

## Blocked by

- Blocked by #004.
- Blocked by #005.
- Blocked by #007.
- Blocked by #018.

## Implementation Notes

Source: `.pai/src/opencode-tracer.ts`, `.pai/tests/opencode-tracer.test.ts`, `.pai/docs/opencode-adapter-tracer.md`, exports wired in `.pai/src/index.ts`.

- `OPENCODE_PLUGIN_RESPONSIBILITIES` documents routing, ISA sync, containment, config_audit as `existing_plugin`-owned; event_emission and retrieval as `shared_adapter`-owned; reflection as `pai_dream`-owned.
- `resolveOpenCodePaiSession` honors inherited `PAI_SESSION_ID`, hashes OpenCode plugin session IDs into `pai_opencode_*`, and creates native sessions otherwise — emitting `session.attached_to_pai_run` / `session.attached_to_opencode_plugin` / `session.created_by_native_adapter`.
- `buildOpenCodeTracerTemplate` renders the validated install fixture from #018; `live_config_mutation_allowed: false` is enforced at the type level.
- `checkOpenCodePluginOrdering` returns a deterministic check for duplicate context injection, duplicate ISA sync, conflicting containment, plus the ordered plugin list for fixture stability.
- `mapOpenCodePluginObservationToEvent` runs payloads through `prepareEventForDestination("sqlite", …)` and `evaluatePolicy` so emitted envelopes are payload-free, redaction-tagged, and policy-stamped.
- `buildOpenCodeRetrievalContext` delegates to `CanonicalMemoryStore.buildContextBlock` so retrieval inherits the #017 trust gate — accepted, medium/high-trust, non-inferred memories only.
- `buildOpenCodeDegradedCapabilityEvent` emits `policy.degraded` envelopes when an OpenCode surface cannot enforce a decision, instead of silently succeeding.

Verification: 9 tests pass in `tests/opencode-tracer.test.ts`; full harness suite 81/81 green; `tsc --noEmit` clean.
