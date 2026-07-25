---
id: 042
title: Fix async-recovery acceptance round-trip
status: review
blocked_by: []
parent: null
priority: 0
created: 2026-07-25
---

## What to build

The async-execution path writes `resolvedAcceptance` (a `ResolvedAcceptanceConfig`) to the recovery descriptor, but the resume path expects `AcceptanceInput` (`string | boolean | AcceptanceConfig`). Fix the write site to persist `params.acceptance` directly when provided and omit the field entirely when undefined (so resume re-infers). No conversion helper, no edits to `acceptance.ts`. Inferred `reviewed` travels correctly via the re-inference path when the field is absent.

## Acceptance criteria

- [ ] `async-execution.ts` `executeAsyncSingle` writes `recoveryDescriptor.acceptance = params.acceptance` gated on `params.acceptance !== undefined`
- [ ] No code persists `resolvedAcceptance` into the recovery descriptor
- [ ] `test/unit/recovery-acceptance.test.ts` passes: descriptor write uses `params.acceptance`, gate exists
- [ ] Test asserts `validateAcceptanceInput` round-trips `false`, string levels, object descriptors
- [ ] Test asserts `validateAcceptanceInput` rejects explicit `"reviewed"` and malformed descriptors

## Verification

`node --experimental-strip-types --test test/unit/recovery-acceptance.test.ts`

## Blocked by

None — can start immediately
