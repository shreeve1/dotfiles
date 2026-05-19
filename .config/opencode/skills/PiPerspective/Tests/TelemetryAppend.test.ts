#!/usr/bin/env bun
/**
 * Wave 3 / Task 4.4 / ISC-09 — telemetry JSONL append.
 *
 * Asserts:
 *   - Every successful `invokePi` appends exactly one JSON line to
 *     `<work_dir>/pi-perspective-stats.jsonl`.
 *   - The line contains keys: phase, verdict, duration_ms, model, thinking,
 *     input_chars, timestamp.
 *   - When `cfg.telemetry === false`, NO line is appended.
 *   - The kill-switch path (cfg.enabled === false) appends NO line —
 *     telemetry tracks real invocations only.
 *   - Append is additive across calls (no rewrite).
 */

import { describe, expect, test } from 'bun:test';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join, resolve } from 'path';

import { appendTelemetry, invokePi } from '../Tools/InvokePi.ts';
import { DEFAULT_CONFIG } from '../Tools/Config.ts';

const MOCKBIN = resolve(import.meta.dir, 'mockbin');
const FIX = resolve(import.meta.dir, 'fixtures');
const DIFF = join(FIX, 'sample-diff.patch');
const STATS_FILE = 'pi-perspective-stats.jsonl';

function freshIsa(): { isaPath: string; workDir: string; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), 'pi-telemetry-test-'));
  const isa = join(dir, 'ISA.md');
  writeFileSync(isa, readFileSync(join(FIX, 'sample-isa.md'), 'utf8'));
  return { isaPath: isa, workDir: dir, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

function readStats(workDir: string): any[] {
  const file = join(workDir, STATS_FILE);
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf-8')
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l));
}

describe('telemetry append', () => {
  test('successful invokePi appends one well-formed line', () => {
    const { isaPath, workDir, cleanup } = freshIsa();
    try {
      invokePi({
        phase: 'VERIFY',
        isaPath,
        diffPath: DIFF,
        binary: join(MOCKBIN, 'pi-pass'),
        noAudit: true,
        config: { ...DEFAULT_CONFIG, verify_thinking: 'medium' },
      });
      const entries = readStats(workDir);
      expect(entries).toHaveLength(1);
      const e = entries[0];
      expect(e.phase).toBe('VERIFY');
      expect(e.verdict).toBe('PASS');
      expect(typeof e.duration_ms).toBe('number');
      expect(e.duration_ms).toBeGreaterThanOrEqual(0);
      expect(typeof e.model).toBe('string');
      expect(e.thinking).toBe('medium');
      expect(typeof e.input_chars).toBe('number');
      expect(e.input_chars).toBeGreaterThan(0);
      expect(typeof e.timestamp).toBe('string');
      expect(e.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    } finally {
      cleanup();
    }
  });

  test('cfg.telemetry === false suppresses append', () => {
    const { isaPath, workDir, cleanup } = freshIsa();
    try {
      invokePi({
        phase: 'VERIFY',
        isaPath,
        diffPath: DIFF,
        binary: join(MOCKBIN, 'pi-pass'),
        noAudit: true,
        config: { ...DEFAULT_CONFIG, telemetry: false },
      });
      expect(existsSync(join(workDir, STATS_FILE))).toBe(false);
    } finally {
      cleanup();
    }
  });

  test('kill switch (enabled=false) does NOT append telemetry', () => {
    const { isaPath, workDir, cleanup } = freshIsa();
    try {
      invokePi({
        phase: 'VERIFY',
        isaPath,
        diffPath: DIFF,
        binary: join(MOCKBIN, 'pi-pass'),
        noAudit: true,
        config: { ...DEFAULT_CONFIG, enabled: false },
      });
      expect(existsSync(join(workDir, STATS_FILE))).toBe(false);
    } finally {
      cleanup();
    }
  });

  test('multiple calls append, do not overwrite', () => {
    const { isaPath, workDir, cleanup } = freshIsa();
    try {
      invokePi({ phase: 'THINK', isaPath, binary: join(MOCKBIN, 'pi-pass'), noAudit: true });
      invokePi({ phase: 'PLAN', isaPath, binary: join(MOCKBIN, 'pi-pass'), noAudit: true });
      invokePi({ phase: 'VERIFY', isaPath, diffPath: DIFF, binary: join(MOCKBIN, 'pi-pass'), noAudit: true });
      const entries = readStats(workDir);
      expect(entries).toHaveLength(3);
      expect(entries.map((e) => e.phase)).toEqual(['THINK', 'PLAN', 'VERIFY']);
    } finally {
      cleanup();
    }
  });

  test('FAIL verdict from malformed pi stdout still records telemetry', () => {
    const { isaPath, workDir, cleanup } = freshIsa();
    try {
      invokePi({
        phase: 'VERIFY',
        isaPath,
        diffPath: DIFF,
        binary: join(MOCKBIN, 'pi-malformed'),
        noAudit: true,
      });
      const entries = readStats(workDir);
      expect(entries).toHaveLength(1);
      expect(entries[0].verdict).toBe('FAIL');
    } finally {
      cleanup();
    }
  });

  test('appendTelemetry helper writes valid JSON line', () => {
    const { isaPath, workDir, cleanup } = freshIsa();
    try {
      appendTelemetry({
        isaPath,
        phase: 'VERIFY',
        verdict: {
          phase: 'VERIFY',
          verdict: 'PASS',
          blockers: [],
          suggestions: [],
          summary_md: '',
          raw_model_id: 'm',
          schema_version: 1,
          generated_at: '2026-05-19T00:00:00.000Z',
        },
        durationMs: 123,
        modelId: 'mock/model',
        thinking: 'high',
        inputChars: 42,
        cfg: { ...DEFAULT_CONFIG },
      });
      const entries = readStats(workDir);
      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({
        phase: 'VERIFY',
        verdict: 'PASS',
        duration_ms: 123,
        model: 'mock/model',
        thinking: 'high',
        input_chars: 42,
      });
    } finally {
      cleanup();
    }
  });
});
