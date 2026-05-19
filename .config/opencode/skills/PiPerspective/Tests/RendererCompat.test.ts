#!/usr/bin/env bun
/**
 * Wave 4 / ISC-16 — renderer backward compatibility.
 *
 * Asserts that `RenderPlanDisagreement.ts` and `RenderReframe.ts` produce
 * IDENTICAL output for the same verdict content regardless of whether the
 * verdict was supplied as schema_version: 1 or schema_version: 2.
 *
 * Both renderers are required to load via `SchemaMigrate.migrate` so the
 * shape they see is always the latest version.
 */

import { describe, expect, test } from 'bun:test';

import { renderDisagreement } from '../Tools/RenderPlanDisagreement.ts';
import { renderReframe } from '../Tools/RenderReframe.ts';
import { migrate } from '../Tools/SchemaMigrate.ts';

const planMd = '# Plan\n\nStep 1. Do the thing.\nStep 2. Verify it.\n';
const isaMd = '## Problem\n\nThe ISA solves X.\n\n## Goal\n\nSolve X cleanly.\n';

const planV1 = {
  phase: 'PLAN' as const,
  verdict: 'FAIL' as const,
  blockers: [
    {
      id: 'b1',
      severity: 'critical' as const,
      summary: 'Missing acceptance criteria',
      detail_md: 'Plan does not define done.',
      evidence: ['ISA.md:42'],
    },
  ],
  suggestions: [],
  summary_md: 'Plan lacks ISCs.',
  raw_model_id: 'mock-model',
  schema_version: 1 as const,
  generated_at: '2026-05-19T00:00:00.000Z',
};

const thinkV1 = {
  phase: 'THINK' as const,
  verdict: 'REFRAME' as const,
  blockers: [
    {
      id: 'r1',
      severity: 'major' as const,
      summary: 'Goal stated as solution',
      detail_md: 'Reframe: state the problem, not the fix.',
      evidence: ['ISA.md:goal'],
    },
  ],
  suggestions: [{ summary: 'Reframed goal A', detail_md: 'Reduce X by N%.' }],
  summary_md: 'pi proposes a different framing of X.',
  raw_model_id: 'mock-model',
  schema_version: 1 as const,
  generated_at: '2026-05-19T00:00:00.000Z',
};

describe('Renderer backward compat (ISC-16)', () => {
  test('RenderPlanDisagreement: v1 and migrated v2 produce identical markdown', () => {
    const v1Migrated = migrate(planV1);
    const v2Direct = { ...planV1, schema_version: 2 as const };

    const fromV1 = renderDisagreement(planMd, v1Migrated);
    const fromV2 = renderDisagreement(planMd, migrate(v2Direct));

    expect(fromV1).toBe(fromV2);
    expect(fromV1).toContain('PLAN-phase disagreement');
    expect(fromV1).toContain('Missing acceptance criteria');
  });

  test('RenderReframe: v1 and migrated v2 produce identical markdown', () => {
    const v1Migrated = migrate(thinkV1);
    const v2Direct = { ...thinkV1, schema_version: 2 as const };

    const fromV1 = renderReframe(isaMd, v1Migrated);
    const fromV2 = renderReframe(isaMd, migrate(v2Direct));

    expect(fromV1).toBe(fromV2);
    expect(fromV1).toContain('THINK-phase reframe');
    expect(fromV1).toContain('Proposed alternative framing');
    expect(fromV1).toContain('Reframed goal A');
  });

  test('RenderPlanDisagreement: telemetry on v2 does not affect rendered body', () => {
    const v2WithTel = migrate({
      ...planV1,
      schema_version: 2,
      telemetry: { duration_ms: 9999, input_chars: 1234 },
    });
    const v2WithoutTel = migrate({ ...planV1, schema_version: 2 });

    const a = renderDisagreement(planMd, v2WithTel);
    const b = renderDisagreement(planMd, v2WithoutTel);

    // The renderer does not surface telemetry, so identical output.
    expect(a).toBe(b);
  });

  test('RenderReframe: telemetry on v2 does not affect rendered body', () => {
    const v2WithTel = migrate({
      ...thinkV1,
      schema_version: 2,
      telemetry: { duration_ms: 9999, input_chars: 1234 },
    });
    const v2WithoutTel = migrate({ ...thinkV1, schema_version: 2 });

    const a = renderReframe(isaMd, v2WithTel);
    const b = renderReframe(isaMd, v2WithoutTel);

    expect(a).toBe(b);
  });
});
