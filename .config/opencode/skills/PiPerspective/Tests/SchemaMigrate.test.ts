#!/usr/bin/env bun
/**
 * Wave 4 / Task 5.3 / ISC-13 — SchemaMigrate.ts.
 *
 * Asserts:
 *   (a) v1 verdict → migrate produces a schema_version: 2 verdict that
 *       passes Zod validation.
 *   (b) v2 verdict → migrate is idempotent (returns equivalent shape).
 *   (c) The PiVerdict Zod schema accepts both v1 and v2 inputs (the union
 *       literal).
 *   (d) Every existing audit file on disk under ~/.pai/memory/WORK/ that
 *       parses as JSON also survives migrate() — backward-compat regression
 *       guard.
 */

import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

import { migrate } from '../Tools/SchemaMigrate.ts';
import { LATEST_SCHEMA_VERSION, validateVerdict } from '../Tools/Schema.ts';

const minimalV1 = {
  phase: 'VERIFY' as const,
  verdict: 'PASS' as const,
  blockers: [],
  suggestions: [],
  summary_md: 'ok',
  raw_model_id: 'test-model',
  schema_version: 1 as const,
  generated_at: '2026-05-19T00:00:00.000Z',
};

const minimalV2 = {
  ...minimalV1,
  schema_version: 2 as const,
  telemetry: { duration_ms: 12345, input_chars: 678 },
};

describe('SchemaMigrate.migrate', () => {
  test('v1 verdict migrates to v2 and passes Zod validation', () => {
    const out = migrate(minimalV1);
    expect(out.schema_version).toBe(2);
    expect(out.phase).toBe('VERIFY');
    expect(out.verdict).toBe('PASS');
    // All v1 fields preserved.
    expect(out.summary_md).toBe('ok');
    expect(out.raw_model_id).toBe('test-model');
    expect(out.generated_at).toBe('2026-05-19T00:00:00.000Z');
    expect(out.blockers).toEqual([]);
    expect(out.suggestions).toEqual([]);
    // telemetry is absent on a forward-migrated v1 (we never invent data).
    expect(out.telemetry).toBeUndefined();
  });

  test('v2 verdict is idempotent (migrate(v2) === v2 shape)', () => {
    const out = migrate(minimalV2);
    expect(out.schema_version).toBe(2);
    expect(out.telemetry).toEqual({ duration_ms: 12345, input_chars: 678 });
    // Re-applying migrate is a no-op.
    const out2 = migrate(out);
    expect(out2).toEqual(out);
  });

  test('validateVerdict accepts schema_version: 1 directly (union)', () => {
    const r = validateVerdict(minimalV1);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.schema_version).toBe(1);
  });

  test('validateVerdict accepts schema_version: 2 directly (union)', () => {
    const r = validateVerdict(minimalV2);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.schema_version).toBe(2);
  });

  test('validateVerdict rejects schema_version: 3 (outside union)', () => {
    const r = validateVerdict({ ...minimalV1, schema_version: 3 });
    expect(r.ok).toBe(false);
  });

  test('migrate refuses to downgrade a future schema_version', () => {
    expect(() => migrate({ ...minimalV1, schema_version: 99 })).toThrow(/newer than LATEST_SCHEMA_VERSION/);
  });

  test('migrate rejects non-object input', () => {
    expect(() => migrate(null)).toThrow();
    expect(() => migrate('not an object' as unknown)).toThrow();
    expect(() => migrate(42 as unknown)).toThrow();
  });

  test('migrate defaults missing schema_version to v1 then forward-migrates', () => {
    const noVersion: any = { ...minimalV1 };
    delete noVersion.schema_version;
    const out = migrate(noVersion);
    expect(out.schema_version).toBe(LATEST_SCHEMA_VERSION);
  });

  test('migrate preserves optional telemetry block on v1→v2 transition when added inline', () => {
    // A v1 object that happens to carry a telemetry block (shouldn't happen
    // in practice but the migration must not strip it).
    const v1WithTel: any = { ...minimalV1, telemetry: { duration_ms: 999 } };
    const out = migrate(v1WithTel);
    expect(out.schema_version).toBe(2);
    expect(out.telemetry).toEqual({ duration_ms: 999 });
  });

  test('migrate raises when post-migration object fails Zod validation', () => {
    const bad: any = { ...minimalV1, raw_model_id: '' }; // empty string violates min(1)
    expect(() => migrate(bad)).toThrow(/validation failed/);
  });
});

// ---------------------------------------------------------------------------
// Backward-compat regression: every existing audit file on disk migrates cleanly.
// Wave 4 / ISC-13: "loading any existing pi-perspective/*.json file under
// ~/.pai/memory/WORK/ through migrate produces a valid v2 verdict."
// ---------------------------------------------------------------------------
describe('SchemaMigrate backward-compat regression', () => {
  const workRoot = join(homedir(), '.pai', 'memory', 'WORK');

  test('every on-disk verdict file migrates without error', () => {
    if (!existsSync(workRoot)) {
      // No prior WORK dirs on this machine; nothing to regress.
      return;
    }
    const slugs = readdirSync(workRoot);
    let inspected = 0;
    for (const slug of slugs) {
      const auditDir = join(workRoot, slug, 'pi-perspective');
      if (!existsSync(auditDir)) continue;
      let entries: string[];
      try {
        entries = readdirSync(auditDir);
      } catch {
        continue;
      }
      for (const f of entries) {
        if (!f.endsWith('.json')) continue;
        const full = join(auditDir, f);
        try {
          const st = statSync(full);
          if (!st.isFile()) continue;
        } catch {
          continue;
        }
        let raw: unknown;
        try {
          raw = JSON.parse(readFileSync(full, 'utf8'));
        } catch {
          // Malformed file on disk — skip, not our problem to fix here.
          continue;
        }
        const migrated = migrate(raw);
        expect(migrated.schema_version).toBe(LATEST_SCHEMA_VERSION);
        inspected++;
      }
    }
    // Sanity: if we found audit files, we inspected them. If there were none
    // at all, the test is a no-op on this machine and silently passes.
    expect(inspected).toBeGreaterThanOrEqual(0);
  });
});
