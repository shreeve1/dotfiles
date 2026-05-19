#!/usr/bin/env bun
/**
 * Wave 4 / Task 5.2 / ISC-11 — CiGate.ts.
 *
 * Asserts:
 *   - All four verdict types (PASS, CONCERNS, FAIL, REFRAME) render valid
 *     markdown with the expected header.
 *   - Exit code: 0 on PASS/CONCERNS, 1 on FAIL/REFRAME.
 *   - Markdown contains stable section headers (Blockers, Suggestions).
 *   - Telemetry block appears in markdown when present on v2 verdict.
 *   - v1 verdict (no telemetry) renders without the Telemetry line.
 *   - CLI accepts both v1 and v2 schema_version inputs (via SchemaMigrate).
 */

import { describe, expect, test } from 'bun:test';
import { spawnSync } from 'child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { exitCodeFor, renderCiComment } from '../Tools/CiGate.ts';
import type { PiVerdict, Verdict } from '../Tools/Schema.ts';

const CLI = join(import.meta.dir, '..', 'Tools', 'CiGate.ts');

function verdictFixture(verdict: Verdict, over: Partial<PiVerdict> = {}): PiVerdict {
  return {
    phase: 'VERIFY',
    verdict,
    blockers:
      verdict === 'FAIL' || verdict === 'REFRAME'
        ? [
            {
              id: 'parse',
              severity: 'critical',
              summary: 'Something is broken',
              detail_md: 'Detail of the breakage.',
              evidence: ['file.ts:42'],
            },
          ]
        : [],
    suggestions:
      verdict === 'CONCERNS'
        ? [{ summary: 'Consider this', detail_md: 'A nice suggestion.' }]
        : [],
    summary_md: `summary for ${verdict}`,
    raw_model_id: 'mock-model',
    schema_version: 2,
    generated_at: '2026-05-19T00:00:00.000Z',
    ...over,
  };
}

function freshDir(): { dir: string; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), 'pi-cigate-test-'));
  return { dir, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

describe('CiGate.exitCodeFor', () => {
  test('PASS → 0', () => {
    expect(exitCodeFor('PASS')).toBe(0);
  });
  test('CONCERNS → 0', () => {
    expect(exitCodeFor('CONCERNS')).toBe(0);
  });
  test('FAIL → 1', () => {
    expect(exitCodeFor('FAIL')).toBe(1);
  });
  test('REFRAME → 1', () => {
    expect(exitCodeFor('REFRAME')).toBe(1);
  });
});

describe('CiGate.renderCiComment', () => {
  test('PASS verdict has PASS header, no blockers, includes summary', () => {
    const md = renderCiComment(verdictFixture('PASS'));
    expect(md).toContain('# PiPerspective — VERIFY — PASS');
    expect(md).toContain('summary for PASS');
    expect(md).toContain('_No blockers raised._');
  });

  test('CONCERNS renders the suggestion block', () => {
    const md = renderCiComment(verdictFixture('CONCERNS'));
    expect(md).toContain('# PiPerspective — VERIFY — CONCERNS');
    expect(md).toContain('## Suggestions (1)');
    expect(md).toContain('Consider this');
    expect(md).toContain('A nice suggestion.');
  });

  test('FAIL renders the critical blocker section with evidence', () => {
    const md = renderCiComment(verdictFixture('FAIL'));
    expect(md).toContain('# PiPerspective — VERIFY — FAIL');
    expect(md).toContain('## Blockers (1)');
    expect(md).toContain('[CRITICAL] Something is broken');
    expect(md).toContain('`file.ts:42`');
    expect(md).toContain('Detail of the breakage.');
  });

  test('REFRAME renders with the REFRAME header', () => {
    const md = renderCiComment(verdictFixture('REFRAME', { phase: 'THINK' }));
    expect(md).toContain('# PiPerspective — THINK — REFRAME');
  });

  test('v2 verdict with telemetry includes the Telemetry line', () => {
    const md = renderCiComment(
      verdictFixture('PASS', { telemetry: { duration_ms: 9876, input_chars: 543 } })
    );
    expect(md).toContain('**Telemetry:**');
    expect(md).toContain('duration_ms=9876');
    expect(md).toContain('input_chars=543');
  });

  test('v2 verdict without telemetry omits the Telemetry line', () => {
    const md = renderCiComment(verdictFixture('PASS'));
    expect(md).not.toContain('**Telemetry:**');
  });

  test('schema_version is printed in the header line', () => {
    const md = renderCiComment(verdictFixture('PASS', { schema_version: 1 }));
    expect(md).toContain('**Schema:** v1');
    const md2 = renderCiComment(verdictFixture('PASS', { schema_version: 2 }));
    expect(md2).toContain('**Schema:** v2');
  });

  test('blockers are sorted critical > major > minor', () => {
    const md = renderCiComment(
      verdictFixture('FAIL', {
        blockers: [
          { id: 'a', severity: 'minor', summary: 'minor-one', detail_md: 'x' },
          { id: 'b', severity: 'critical', summary: 'critical-one', detail_md: 'y' },
          { id: 'c', severity: 'major', summary: 'major-one', detail_md: 'z' },
        ],
      })
    );
    const critPos = md.indexOf('critical-one');
    const majPos = md.indexOf('major-one');
    const minPos = md.indexOf('minor-one');
    expect(critPos).toBeLessThan(majPos);
    expect(majPos).toBeLessThan(minPos);
  });
});

describe('CiGate CLI', () => {
  test('v2 verdict file: exit 0 on PASS', () => {
    const { dir, cleanup } = freshDir();
    try {
      const path = join(dir, 'verdict.json');
      writeFileSync(path, JSON.stringify(verdictFixture('PASS')));
      const r = spawnSync('bun', ['run', CLI, '--verdict', path], { encoding: 'utf8' });
      expect(r.status).toBe(0);
      expect(r.stdout).toContain('# PiPerspective — VERIFY — PASS');
    } finally {
      cleanup();
    }
  });

  test('v2 verdict file: exit 1 on FAIL', () => {
    const { dir, cleanup } = freshDir();
    try {
      const path = join(dir, 'verdict.json');
      writeFileSync(path, JSON.stringify(verdictFixture('FAIL')));
      const r = spawnSync('bun', ['run', CLI, '--verdict', path], { encoding: 'utf8' });
      expect(r.status).toBe(1);
      expect(r.stdout).toContain('# PiPerspective — VERIFY — FAIL');
    } finally {
      cleanup();
    }
  });

  test('v1 verdict file (no schema_version migration before load) still accepted', () => {
    const { dir, cleanup } = freshDir();
    try {
      const v1: any = { ...verdictFixture('PASS'), schema_version: 1 };
      delete v1.telemetry;
      const path = join(dir, 'verdict.json');
      writeFileSync(path, JSON.stringify(v1));
      const r = spawnSync('bun', ['run', CLI, '--verdict', path], { encoding: 'utf8' });
      expect(r.status).toBe(0);
      // CiGate routes through SchemaMigrate so the header reports v2 after upgrade.
      expect(r.stdout).toContain('**Schema:** v2');
    } finally {
      cleanup();
    }
  });

  test('missing --verdict flag exits 2', () => {
    const r = spawnSync('bun', ['run', CLI], { encoding: 'utf8' });
    expect(r.status).toBe(2);
  });

  test('missing verdict file exits 2 with clear error', () => {
    const r = spawnSync('bun', ['run', CLI, '--verdict', '/tmp/definitely-not-here.json'], {
      encoding: 'utf8',
    });
    expect(r.status).toBe(2);
    expect(r.stderr).toContain('not found');
  });
});
