#!/usr/bin/env bun
/**
 * Wave 3 / Task 4.5 / ISC-10 — RenderTelemetry.ts.
 *
 * Asserts:
 *   - Empty/missing stats file → header-only table with `(no entries)`.
 *   - Mixed phases → grouped table in canonical THINK/PLAN/VERIFY order.
 *   - Malformed lines → skipped, do not crash, stderr warning emitted.
 *   - Table includes the six required columns: phase, count, mean_ms,
 *     p50_ms, p95_ms, verdict_distribution.
 *   - Verdict distribution lists every verdict observed.
 */

import { describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import {
  computePhaseStats,
  renderFromFile,
  renderTable,
  type TelemetryEntry,
} from '../Tools/RenderTelemetry.ts';

function freshDir(): { dir: string; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), 'pi-render-test-'));
  return { dir, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

function entry(over: Partial<TelemetryEntry>): TelemetryEntry {
  return {
    phase: 'VERIFY',
    verdict: 'PASS',
    duration_ms: 1000,
    model: 'mock',
    thinking: 'high',
    input_chars: 100,
    timestamp: '2026-05-19T00:00:00.000Z',
    ...over,
  };
}

describe('computePhaseStats', () => {
  test('groups by phase, computes mean / p50 / p95', () => {
    const entries: TelemetryEntry[] = [
      entry({ phase: 'VERIFY', duration_ms: 100 }),
      entry({ phase: 'VERIFY', duration_ms: 200 }),
      entry({ phase: 'VERIFY', duration_ms: 300 }),
      entry({ phase: 'VERIFY', duration_ms: 400 }),
      entry({ phase: 'VERIFY', duration_ms: 500 }),
    ];
    const stats = computePhaseStats(entries);
    expect(stats).toHaveLength(1);
    expect(stats[0].phase).toBe('VERIFY');
    expect(stats[0].count).toBe(5);
    expect(stats[0].mean_ms).toBe(300);
    // Nearest-rank p50 over [100,200,300,400,500] → ceil(0.5*5)=3 → idx 2 → 300.
    expect(stats[0].p50_ms).toBe(300);
    // p95 → ceil(0.95*5)=5 → idx 4 → 500.
    expect(stats[0].p95_ms).toBe(500);
  });

  test('canonical phase ordering: THINK before PLAN before VERIFY', () => {
    const entries: TelemetryEntry[] = [
      entry({ phase: 'VERIFY' }),
      entry({ phase: 'THINK' }),
      entry({ phase: 'PLAN' }),
    ];
    const stats = computePhaseStats(entries);
    expect(stats.map((s) => s.phase)).toEqual(['THINK', 'PLAN', 'VERIFY']);
  });

  test('verdict distribution counts each verdict', () => {
    const entries: TelemetryEntry[] = [
      entry({ verdict: 'PASS' }),
      entry({ verdict: 'PASS' }),
      entry({ verdict: 'FAIL' }),
      entry({ verdict: 'CONCERNS' }),
    ];
    const stats = computePhaseStats(entries);
    expect(stats[0].verdict_distribution).toEqual({ PASS: 2, FAIL: 1, CONCERNS: 1 });
  });
});

describe('renderTable', () => {
  test('empty stats → header-only with (no entries)', () => {
    const out = renderTable([]);
    expect(out).toContain('# PiPerspective telemetry');
    expect(out).toContain('phase');
    expect(out).toContain('count');
    expect(out).toContain('mean_ms');
    expect(out).toContain('p50_ms');
    expect(out).toContain('p95_ms');
    expect(out).toContain('verdict_distribution');
    expect(out).toContain('(no entries)');
  });

  test('non-empty stats → markdown table row per phase', () => {
    const out = renderTable([
      {
        phase: 'VERIFY',
        count: 3,
        mean_ms: 200,
        p50_ms: 200,
        p95_ms: 300,
        verdict_distribution: { PASS: 2, FAIL: 1 },
      },
    ]);
    expect(out).toContain('| VERIFY | 3 | 200 | 200 | 300 | FAIL=1 PASS=2 |');
  });
});

describe('renderFromFile', () => {
  test('missing file → header-only table', () => {
    const { dir, cleanup } = freshDir();
    try {
      const out = renderFromFile(join(dir, 'pi-perspective-stats.jsonl'));
      expect(out).toContain('(no entries)');
    } finally {
      cleanup();
    }
  });

  test('mixed phases → grouped table', () => {
    const { dir, cleanup } = freshDir();
    try {
      const file = join(dir, 'pi-perspective-stats.jsonl');
      const lines = [
        entry({ phase: 'THINK', duration_ms: 500 }),
        entry({ phase: 'THINK', duration_ms: 700, verdict: 'CONCERNS' }),
        entry({ phase: 'PLAN', duration_ms: 1200 }),
        entry({ phase: 'VERIFY', duration_ms: 2500, verdict: 'FAIL' }),
        entry({ phase: 'VERIFY', duration_ms: 1800 }),
      ];
      writeFileSync(file, lines.map((e) => JSON.stringify(e)).join('\n') + '\n', 'utf-8');
      const out = renderFromFile(file);
      expect(out).toContain('THINK');
      expect(out).toContain('PLAN');
      expect(out).toContain('VERIFY');
      // Canonical ordering — THINK row appears before PLAN row appears before VERIFY row.
      const thinkIdx = out.indexOf('| THINK ');
      const planIdx = out.indexOf('| PLAN ');
      const verifyIdx = out.indexOf('| VERIFY ');
      expect(thinkIdx).toBeGreaterThan(-1);
      expect(planIdx).toBeGreaterThan(thinkIdx);
      expect(verifyIdx).toBeGreaterThan(planIdx);
    } finally {
      cleanup();
    }
  });

  test('malformed line is skipped, valid lines are kept', () => {
    const { dir, cleanup } = freshDir();
    try {
      const file = join(dir, 'pi-perspective-stats.jsonl');
      const body =
        JSON.stringify(entry({ phase: 'VERIFY', duration_ms: 100 })) +
        '\n{not valid json\n' +
        JSON.stringify(entry({ phase: 'VERIFY', duration_ms: 200 })) +
        '\n';
      writeFileSync(file, body, 'utf-8');
      const out = renderFromFile(file);
      // Two valid entries → count=2.
      expect(out).toContain('| VERIFY | 2 ');
    } finally {
      cleanup();
    }
  });

  test('shape-invalid line (missing keys) is also skipped', () => {
    const { dir, cleanup } = freshDir();
    try {
      const file = join(dir, 'pi-perspective-stats.jsonl');
      const body =
        JSON.stringify({ phase: 'VERIFY' }) +
        '\n' +
        JSON.stringify(entry({ phase: 'VERIFY', duration_ms: 999 })) +
        '\n';
      writeFileSync(file, body, 'utf-8');
      const out = renderFromFile(file);
      expect(out).toContain('| VERIFY | 1 ');
    } finally {
      cleanup();
    }
  });
});
