---
id: 012
title: Add Pi wrapper tracer
status: done
type: AFK
priority: 12
blocked_by: [005, 018]
parent: null
created: 2026-05-09
updated: 2026-05-09
actor: ralph
---

## What to build

Add wrapper-first Pi support that gives Pi canonical session identity and redacted event metadata without reading Pi auth files or depending on deep Pi lifecycle extension points.

## Acceptance criteria

- [x] `pai-run pi` launches Pi with canonical session environment and wrapper-level start/stop events.
- [x] Adapter records redacted metadata and degraded capabilities for unsupported lifecycle events.
- [x] Adapter never reads `.pi/agent/auth.json` or any equivalent provider credential file.
- [x] Tests prove Pi auth files are not opened, read, globbed, or copied.
- [x] Deeper Pi TypeScript extension work is explicitly deferred until lifecycle boundaries are proven.

## Blocked by

- Blocked by #005.
- Blocked by #018.

## Implementation Notes

Source: `.pai/src/pi-tracer.ts`, `.pai/tests/pi-tracer.test.ts`, `.pai/docs/pi-wrapper-tracer.md`, exports wired through `.pai/src/index.ts`.

- `buildPiWrapperRunPlan` thin-wraps `buildPaiRunPlan({ target: "pi", … })` from #005 so Pi inherits the canonical wrapper session env (`PAI_SESSION_ID`, `PAI_HARNESS=pi`, `PAI_TARGET_CLI=pi`, optional `PAI_PROJECT_ID`).
- `buildPiWrapperLifecycleEvents` delegates to `#005.buildLifecycleEvents`, so wrapper-level `session.start` / `session.launch` / `session.degraded_capability` / `session.stop` emit through the shared redaction + policy pipeline.
- `mapPiWrapperObservationToEvent` maps wrapper observations (`WrapperStart`, `WrapperStop`, `WrapperExit`, `DegradedCapability`) through `prepareEventForDestination("sqlite", …)` and `evaluatePolicy`. Non-zero `WrapperExit` is recorded as `session.degraded_capability` instead of silent stop.
- `buildPiDegradedCapabilityEvent` emits explicit `session.degraded_capability` envelopes for the three Pi-unsupported capabilities (`can_observe_tool_output`, `can_observe_final_response`, `can_attach_native_session_id`).
- The Pi tracer source contains zero `node:fs` imports; tests grep the source for any `readFile*` / `open` / `createReadStream` / `glob` / `readdir*` referencing `.pi/agent` and assert none exist.
- `assertNoPiAuthFileAccess(paths)` is a pure helper for callers who synthesize Pi-related paths; tests verify it rejects `.pi/agent/auth.json` (with or without `~/`) and accepts safe runtime paths.
- The install plan from #018 targets `~/.pi/agent/config.json` only; `auth.json` is never referenced in `files_to_change` / `backup_paths` / `symlink_actions`.
- `PiWrapperTracerTemplate` publishes `hook_templates: []`, `deep_extension_allowed: false`, `live_config_mutation_allowed: false`, `auth_file_access_allowed: false`, plus `PI_DEFERRED_EXTENSION_POINTS` enumerating what stays out of scope until Pi lifecycle boundaries are proven.

Verification: 7 tests pass in `tests/pi-tracer.test.ts`; full harness suite 88/88 green; `tsc --noEmit` clean.
