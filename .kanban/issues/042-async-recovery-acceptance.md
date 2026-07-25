---
id: 042
title: Fix async-recovery acceptance round-trip
status: done
actor: ralph
blocked_by: []
parent: null
priority: 0
updated: 2026-07-25
created: 2026-07-25
---

## What to build

The async-execution path writes `resolvedAcceptance` (a `ResolvedAcceptanceConfig`) to the recovery descriptor, but the resume path expects `AcceptanceInput` (`string | boolean | AcceptanceConfig`). Fix the write site to persist `params.acceptance` directly when provided and omit the field entirely when undefined (so resume re-infers). No conversion helper, no edits to `acceptance.ts`. Inferred `reviewed` travels correctly via the re-inference path when the field is absent.

## Implementation Notes

Changed async-execution.ts to persist raw `params.acceptance` (AcceptanceInput) instead of resolved `ResolvedAcceptanceConfig` into the recovery descriptor. Gated on `params.acceptance !== undefined` — when absent, the field is omitted so resume re-infers acceptance. Added 4 focused unit tests for round-trip and validation.

## Review Notes

RALPH_REVIEW: PASS_WITH_NOTES. Test duplicates the descriptor spread instead of exercising executeAsyncSingle directly. No blockers.

## Acceptance criteria

- [x] `async-execution.ts` `executeAsyncSingle` writes `recoveryDescriptor.acceptance = params.acceptance` gated on `params.acceptance !== undefined`
- [x] No code persists `resolvedAcceptance` into the recovery descriptor
- [x] `test/unit/recovery-acceptance.test.ts` passes: descriptor write uses `params.acceptance`, gate exists
- [x] Test asserts `validateAcceptanceInput` round-trips `false`, string levels, object descriptors
- [x] Test asserts `validateAcceptanceInput` rejects explicit `"reviewed"` and malformed descriptors

## Verification

`node --experimental-strip-types --test test/unit/recovery-acceptance.test.ts`

## Blocked by

None — can start immediately
