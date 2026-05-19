#!/usr/bin/env bun
/**
 * Migrations/v1-to-v2.ts — Wave 4 / ISC-13.
 *
 * Forward-only, additive migration from PiVerdict schema_version 1 to 2.
 *
 * Shape change:
 *   - bump `schema_version` from 1 to 2
 *   - allow an optional `telemetry?: { duration_ms?, input_chars? }` block
 *     (we never invent telemetry data — if v1 didn't have it, v2 also won't)
 *
 * The migration is a pure function. It does not validate; SchemaMigrate
 * runs the Zod validator after migration completes.
 */

/** Input shape: any v1-ish PiVerdict object. We accept `any` here because
 * upstream callers may pass arbitrary JSON; SchemaMigrate validates after. */
export function migrateV1ToV2(verdict: any): any {
  if (verdict == null || typeof verdict !== 'object') return verdict;
  if (verdict.schema_version === 2) return verdict; // idempotent
  return {
    ...verdict,
    schema_version: 2,
  };
}
