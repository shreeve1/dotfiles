#!/usr/bin/env bun
/**
 * Wave 3 / Task 4.2 / ISC-08 — per-phase `--thinking` flag wiring.
 *
 * Asserts that `invokePi` passes the correct `--thinking <level>` argv to
 * pi for each phase, sourced from the matching config key:
 *   - THINK  → cfg.think_thinking
 *   - PLAN   → cfg.plan_thinking
 *   - VERIFY → cfg.verify_thinking
 *
 * Uses the `pi-pass` mockbin (echoes argv to stderr, one per line, prefixed
 * `ARG:`) so we can grep the spawned argv without spawning a real pi.
 */

import { describe, expect, test } from 'bun:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';

import { invokePi } from '../Tools/InvokePi.ts';
import { DEFAULT_CONFIG } from '../Tools/Config.ts';

const MOCKBIN = resolve(import.meta.dir, 'mockbin');
const FIX = resolve(import.meta.dir, 'fixtures');
const DIFF = join(FIX, 'sample-diff.patch');

function freshIsa(): { isaPath: string; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), 'pi-thinking-test-'));
  const isa = join(dir, 'ISA.md');
  writeFileSync(isa, readFileSync(join(FIX, 'sample-isa.md'), 'utf8'));
  return { isaPath: isa, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

function argvLines(rawStderr: string): string[] {
  return rawStderr
    .split('\n')
    .filter((l) => l.startsWith('ARG:'))
    .map((l) => l.slice(4));
}

function thinkingArg(rawStderr: string): string | null {
  const args = argvLines(rawStderr);
  const idx = args.indexOf('--thinking');
  if (idx === -1 || idx === args.length - 1) return null;
  return args[idx + 1];
}

describe('per-phase thinking flag', () => {
  test('VERIFY uses cfg.verify_thinking', () => {
    const { isaPath, cleanup } = freshIsa();
    try {
      const res = invokePi({
        phase: 'VERIFY',
        isaPath,
        diffPath: DIFF,
        binary: join(MOCKBIN, 'pi-pass'),
        noAudit: true,
        config: { ...DEFAULT_CONFIG, verify_thinking: 'medium' },
      });
      expect(thinkingArg(res.rawStderr)).toBe('medium');
    } finally {
      cleanup();
    }
  });

  test('PLAN uses cfg.plan_thinking', () => {
    const { isaPath, cleanup } = freshIsa();
    try {
      const res = invokePi({
        phase: 'PLAN',
        isaPath,
        binary: join(MOCKBIN, 'pi-pass'),
        noAudit: true,
        config: { ...DEFAULT_CONFIG, plan_thinking: 'xhigh' },
      });
      expect(thinkingArg(res.rawStderr)).toBe('xhigh');
    } finally {
      cleanup();
    }
  });

  test('THINK uses cfg.think_thinking', () => {
    const { isaPath, cleanup } = freshIsa();
    try {
      const res = invokePi({
        phase: 'THINK',
        isaPath,
        binary: join(MOCKBIN, 'pi-pass'),
        noAudit: true,
        config: { ...DEFAULT_CONFIG, think_thinking: 'low' },
      });
      expect(thinkingArg(res.rawStderr)).toBe('low');
    } finally {
      cleanup();
    }
  });

  test('phases are independent — VERIFY level does not bleed into THINK', () => {
    const { isaPath, cleanup } = freshIsa();
    try {
      const cfg = { ...DEFAULT_CONFIG, think_thinking: 'minimal' as const, plan_thinking: 'low' as const, verify_thinking: 'xhigh' as const };
      const think = invokePi({ phase: 'THINK', isaPath, binary: join(MOCKBIN, 'pi-pass'), noAudit: true, config: cfg });
      const plan = invokePi({ phase: 'PLAN', isaPath, binary: join(MOCKBIN, 'pi-pass'), noAudit: true, config: cfg });
      const verify = invokePi({ phase: 'VERIFY', isaPath, diffPath: DIFF, binary: join(MOCKBIN, 'pi-pass'), noAudit: true, config: cfg });
      expect(thinkingArg(think.rawStderr)).toBe('minimal');
      expect(thinkingArg(plan.rawStderr)).toBe('low');
      expect(thinkingArg(verify.rawStderr)).toBe('xhigh');
    } finally {
      cleanup();
    }
  });
});

describe('Config defaults', () => {
  test('DEFAULT_CONFIG exposes think_thinking and plan_thinking at high', () => {
    expect(DEFAULT_CONFIG.think_thinking).toBe('high');
    expect(DEFAULT_CONFIG.plan_thinking).toBe('high');
    expect(DEFAULT_CONFIG.verify_thinking).toBe('high');
  });
});
