#!/usr/bin/env bun
/**
 * Unit tests for InvokePi.ts and helpers.
 * Run with: bun test ~/.config/opencode/skills/PiPerspective/Tests/InvokePi.test.ts
 *
 * Covers:
 *   - Flag-matrix construction (THINK/PLAN/VERIFY) — asserts the single
 *     shell-out boundary passes correct flags (ISC-02, ISC-03).
 *   - JSON happy path: pi emits valid fenced JSON, wrapper returns PASS.
 *   - FAIL path: pi emits FAIL with a blocker; wrapper preserves it.
 *   - Fallback path: pi emits no JSON; wrapper produces FAIL with a
 *     synthesized critical parse-error blocker instead of throwing (ISC-02
 *     of the May 19 pi-perspective-improvements plan, supersedes ISC-04).
 *   - Kill switch: enabled=false -> zero subprocesses (ISC-11).
 *   - Version check: pi < min_pi_version fails fast.
 *   - Audit write: produces <work_dir>/pi-perspective/<phase>.json
 *     and numerically suffixes on collision (ISC-08).
 *   - Config merge: partial auto_invoke override keeps other tiers.
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, readdirSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join, resolve } from 'path';

import { invokePi, writeAudit } from '../Tools/InvokePi.ts';
import { DEFAULT_CONFIG, loadConfig } from '../Tools/Config.ts';
import { _resetVersionCache, assertPiVersion, compareSemver, parseSemver } from '../Tools/VersionCheck.ts';
import { blockerId, validateVerdict } from '../Tools/Schema.ts';
import { buildFallbackVerdict, extractFencedJson, extractBareJson } from '../Tools/ParseFallback.ts';

const MOCKBIN = resolve(import.meta.dir, 'mockbin');
const FIX = resolve(import.meta.dir, 'fixtures');
const ISA = join(FIX, 'sample-isa.md');
const DIFF = join(FIX, 'sample-diff.patch');

let workdirs: string[] = [];

function freshWorkdir(): { isaPath: string; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), 'pi-test-'));
  const isa = join(dir, 'ISA.md');
  writeFileSync(isa, readFileSync(ISA, 'utf8'));
  workdirs.push(dir);
  return { isaPath: isa, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

beforeEach(() => {
  _resetVersionCache();
});

afterEach(() => {
  for (const d of workdirs) {
    try {
      rmSync(d, { recursive: true, force: true });
    } catch {}
  }
  workdirs = [];
  _resetVersionCache();
});

// ---------------------------------------------------------------------------
// Schema / helpers
// ---------------------------------------------------------------------------

describe('Schema', () => {
  test('validateVerdict accepts a minimal PASS verdict', () => {
    const r = validateVerdict({
      phase: 'VERIFY',
      verdict: 'PASS',
      blockers: [],
      suggestions: [],
      summary_md: 'ok',
      raw_model_id: 'test',
      schema_version: 1,
      generated_at: '2026-05-10T00:00:00.000Z',
    });
    expect(r.ok).toBe(true);
  });

  test('validateVerdict rejects schema_version != 1', () => {
    const r = validateVerdict({
      phase: 'VERIFY',
      verdict: 'PASS',
      blockers: [],
      suggestions: [],
      summary_md: 'ok',
      raw_model_id: 'test',
      schema_version: 2,
      generated_at: '2026-05-10T00:00:00.000Z',
    });
    expect(r.ok).toBe(false);
  });

  test('blockerId is deterministic across calls', () => {
    expect(blockerId('VERIFY', 'foo')).toBe(blockerId('VERIFY', 'foo'));
    expect(blockerId('VERIFY', 'foo')).not.toBe(blockerId('VERIFY', 'bar'));
  });
});

describe('VersionCheck', () => {
  test('parseSemver handles plain triples', () => {
    expect(parseSemver('0.73.1')).toEqual([0, 73, 1]);
    expect(parseSemver('v1.2.3')).toEqual([1, 2, 3]);
    expect(parseSemver('1.2.3-beta.1')).toEqual([1, 2, 3]);
  });

  test('compareSemver orders correctly', () => {
    expect(compareSemver('0.73.0', '0.73.1')).toBe(-1);
    expect(compareSemver('0.73.1', '0.73.1')).toBe(0);
    expect(compareSemver('0.74.0', '0.73.1')).toBe(1);
    expect(compareSemver('1.0.0', '0.99.99')).toBe(1);
  });

  test('assertPiVersion succeeds when pi is new enough', () => {
    const v = assertPiVersion('0.73.1', { binary: join(MOCKBIN, 'pi-pass'), refresh: true });
    expect(v).toBe('0.99.0');
  });

  test('assertPiVersion throws when pi is too old', () => {
    expect(() => assertPiVersion('0.73.1', { binary: join(MOCKBIN, 'pi-old'), refresh: true })).toThrow();
  });
});

describe('ParseFallback', () => {
  test('extractFencedJson finds the last fenced JSON block', () => {
    const s = '```json\n{"a":1}\n```\nand also\n```json\n{"b":2}\n```';
    expect(extractFencedJson(s)).toEqual({ b: 2 });
  });

  test('extractBareJson parses bare top-level object', () => {
    expect(extractBareJson('   {"x":3}  ')).toEqual({ x: 3 });
  });

  test('extractFencedJson returns null when no fence', () => {
    expect(extractFencedJson('no json here')).toBeNull();
  });

  test('buildFallbackVerdict produces FAIL with a critical parse-error blocker', () => {
    const v = buildFallbackVerdict({
      phase: 'VERIFY',
      rawStdout: 'garbage stdout',
      modelId: 'm',
      reason: 'no JSON block found in pi stdout',
    });
    expect(v.verdict).toBe('FAIL');
    expect(v.schema_version).toBe(1);
    expect(v.blockers).toHaveLength(1);
    expect(v.blockers[0].severity).toBe('critical');
    expect(v.blockers[0].id).toContain('parse');
    expect(v.blockers[0].summary).toContain('parse');
    expect(v.blockers[0].detail_md).toContain('garbage stdout');
    expect(v.blockers[0].evidence).toEqual(['stdout']);
    expect(v.summary_md).toContain('parse failure');
  });
});

describe('Config', () => {
  test('loadConfig returns defaults when file absent', () => {
    const c = loadConfig({ path: join(tmpdir(), 'definitely-not-here.json') });
    expect(c.enabled).toBe(true);
    expect(c.model).toBe(DEFAULT_CONFIG.model);
    expect(c.auto_invoke.Extended).toEqual(['THINK', 'PLAN', 'VERIFY']);
  });

  test('loadConfig merges partial auto_invoke without erasing other tiers', () => {
    const dir = mkdtempSync(join(tmpdir(), 'pi-cfg-'));
    workdirs.push(dir);
    const p = join(dir, 'settings.json');
    writeFileSync(
      p,
      JSON.stringify({
        pi_perspective: {
          model: 'anthropic/claude-opus-4:high',
          auto_invoke: { Extended: ['THINK', 'VERIFY'] },
        },
      })
    );
    const c = loadConfig({ path: p });
    expect(c.model).toBe('anthropic/claude-opus-4:high');
    expect(c.auto_invoke.Extended).toEqual(['THINK', 'VERIFY']);
    // Other tiers preserved
    expect(c.auto_invoke.Deep).toEqual(['THINK', 'PLAN', 'VERIFY']);
  });

  test('loadConfig respects enabled=false', () => {
    const dir = mkdtempSync(join(tmpdir(), 'pi-cfg-'));
    workdirs.push(dir);
    const p = join(dir, 'settings.json');
    writeFileSync(p, JSON.stringify({ pi_perspective: { enabled: false } }));
    const c = loadConfig({ path: p });
    expect(c.enabled).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// InvokePi end-to-end with mock pi
// ---------------------------------------------------------------------------

describe('invokePi flag construction', () => {
  test('VERIFY passes --tools read,grep,find,ls and not --no-tools', () => {
    const { isaPath } = freshWorkdir();
    const res = invokePi({
      phase: 'VERIFY',
      isaPath,
      diffPath: DIFF,
      binary: join(MOCKBIN, 'pi-pass'),
      config: { ...DEFAULT_CONFIG },
    });
    // Mock pi echoes ARG:<flag> to stderr.
    const args = res.rawStderr.split('\n').filter((l) => l.startsWith('ARG:')).map((l) => l.slice(4));
    expect(args).toContain('--tools');
    const toolsIdx = args.indexOf('--tools');
    expect(args[toolsIdx + 1]).toBe('read,grep,find,ls');
    expect(args).not.toContain('--no-tools');
    expect(args).toContain('--no-session');
    expect(args).toContain('--no-context-files');
    expect(args).toContain('-p');
    expect(args).toContain('--append-system-prompt');
  });

  test('THINK passes --no-tools and no --tools allowlist', () => {
    const { isaPath } = freshWorkdir();
    const res = invokePi({
      phase: 'THINK',
      isaPath,
      binary: join(MOCKBIN, 'pi-pass'),
      config: { ...DEFAULT_CONFIG },
    });
    const args = res.rawStderr.split('\n').filter((l) => l.startsWith('ARG:')).map((l) => l.slice(4));
    expect(args).toContain('--no-tools');
    expect(args).not.toContain('--tools');
  });

  test('PLAN passes --no-tools', () => {
    const { isaPath } = freshWorkdir();
    const res = invokePi({
      phase: 'PLAN',
      isaPath,
      binary: join(MOCKBIN, 'pi-pass'),
      config: { ...DEFAULT_CONFIG },
    });
    const args = res.rawStderr.split('\n').filter((l) => l.startsWith('ARG:')).map((l) => l.slice(4));
    expect(args).toContain('--no-tools');
  });

  test('always passes --no-context-files', () => {
    const { isaPath } = freshWorkdir();
    for (const phase of ['THINK', 'PLAN', 'VERIFY'] as const) {
      const res = invokePi({
        phase,
        isaPath,
        diffPath: phase === 'VERIFY' ? DIFF : undefined,
        binary: join(MOCKBIN, 'pi-pass'),
        config: { ...DEFAULT_CONFIG },
      });
      expect(res.rawStderr).toContain('ARG:--no-context-files');
    }
  });

  test('model flag uses config.model by default and override when provided', () => {
    const { isaPath } = freshWorkdir();
    const res1 = invokePi({
      phase: 'THINK',
      isaPath,
      binary: join(MOCKBIN, 'pi-pass'),
      config: { ...DEFAULT_CONFIG, model: 'configured/model:high' },
    });
    expect(res1.rawStderr).toContain('ARG:configured/model:high');

    const res2 = invokePi({
      phase: 'THINK',
      isaPath,
      model: 'override/model:medium',
      binary: join(MOCKBIN, 'pi-pass'),
      config: { ...DEFAULT_CONFIG, model: 'configured/model:high' },
    });
    expect(res2.rawStderr).toContain('ARG:override/model:medium');
  });
});

describe('invokePi parse paths', () => {
  test('happy path: PASS verdict round-trips', () => {
    const { isaPath } = freshWorkdir();
    const res = invokePi({
      phase: 'VERIFY',
      isaPath,
      diffPath: DIFF,
      binary: join(MOCKBIN, 'pi-pass'),
      config: { ...DEFAULT_CONFIG },
    });
    expect(res.verdict.verdict).toBe('PASS');
    expect(res.verdict.phase).toBe('VERIFY');
    expect(res.verdict.schema_version).toBe(1);
  });

  test('FAIL verdict with blocker is preserved and re-hashed', () => {
    const { isaPath } = freshWorkdir();
    const res = invokePi({
      phase: 'VERIFY',
      isaPath,
      diffPath: DIFF,
      binary: join(MOCKBIN, 'pi-fail'),
      config: { ...DEFAULT_CONFIG },
    });
    expect(res.verdict.verdict).toBe('FAIL');
    expect(res.verdict.blockers).toHaveLength(1);
    expect(res.verdict.blockers[0].severity).toBe('critical');
    expect(res.verdict.blockers[0].summary).toContain('Off-by-one');
    // ID should be deterministically re-hashed, not the literal "x" from mock.
    expect(res.verdict.blockers[0].id).toBe(blockerId('VERIFY', 'Off-by-one in loop body'));
  });

  test('malformed pi output falls back to FAIL with a parse-error blocker', () => {
    const { isaPath } = freshWorkdir();
    const res = invokePi({
      phase: 'VERIFY',
      isaPath,
      diffPath: DIFF,
      binary: join(MOCKBIN, 'pi-malformed'),
      config: { ...DEFAULT_CONFIG },
    });
    expect(res.verdict.verdict).toBe('FAIL');
    expect(res.verdict.blockers).toHaveLength(1);
    expect(res.verdict.blockers[0].severity).toBe('critical');
    expect(res.verdict.blockers[0].id).toContain('parse');
    expect(res.verdict.blockers[0].summary).toContain('parse');
    expect(res.verdict.summary_md).toContain('PiPerspective parse failure');
  });
});

describe('invokePi kill switch', () => {
  test('enabled=false produces stub verdict and does NOT spawn pi', () => {
    const { isaPath } = freshWorkdir();
    const res = invokePi({
      phase: 'VERIFY',
      isaPath,
      diffPath: DIFF,
      // If pi were spawned, the binary path below would fail because it does
      // not exist; the kill switch must short-circuit before spawning.
      binary: '/definitely/not/a/binary/anywhere',
      config: { ...DEFAULT_CONFIG, enabled: false },
    });
    expect(res.exitCode).toBe(0);
    expect(res.durationMs).toBe(0);
    expect(res.verdict.verdict).toBe('CONCERNS');
    expect(res.verdict.summary_md).toContain('kill switch');
    expect(res.rawStdout).toBe('');
  });
});

describe('invokePi version gate', () => {
  test('throws PiVersionError when pi too old', () => {
    const { isaPath } = freshWorkdir();
    expect(() =>
      invokePi({
        phase: 'VERIFY',
        isaPath,
        diffPath: DIFF,
        binary: join(MOCKBIN, 'pi-old'),
        config: { ...DEFAULT_CONFIG },
      })
    ).toThrow();
  });
});

describe('audit trail', () => {
  test('writeAudit creates <work_dir>/pi-perspective/<phase>.json', () => {
    const { isaPath } = freshWorkdir();
    const verdict = {
      phase: 'VERIFY' as const,
      verdict: 'PASS' as const,
      blockers: [],
      suggestions: [],
      summary_md: 'test',
      raw_model_id: 'mock',
      schema_version: 1 as const,
      generated_at: new Date().toISOString(),
    };
    const path1 = writeAudit(isaPath, verdict);
    expect(existsSync(path1)).toBe(true);
    expect(path1.endsWith('/pi-perspective/verify.json')).toBe(true);

    // Second write must NOT overwrite — appends numeric suffix.
    const path2 = writeAudit(isaPath, verdict);
    expect(existsSync(path2)).toBe(true);
    expect(path2).not.toBe(path1);
    expect(path2.endsWith('/pi-perspective/verify.2.json')).toBe(true);

    const path3 = writeAudit(isaPath, verdict);
    expect(path3.endsWith('/pi-perspective/verify.3.json')).toBe(true);
  });

  test('invokePi writes audit file by default and skips with noAudit', () => {
    const { isaPath } = freshWorkdir();
    const res = invokePi({
      phase: 'VERIFY',
      isaPath,
      diffPath: DIFF,
      binary: join(MOCKBIN, 'pi-pass'),
      config: { ...DEFAULT_CONFIG },
    });
    expect(res.auditPath).not.toBeNull();
    expect(existsSync(res.auditPath!)).toBe(true);

    const res2 = invokePi({
      phase: 'VERIFY',
      isaPath,
      diffPath: DIFF,
      binary: join(MOCKBIN, 'pi-pass'),
      noAudit: true,
      config: { ...DEFAULT_CONFIG },
    });
    expect(res2.auditPath).toBeNull();
  });
});
