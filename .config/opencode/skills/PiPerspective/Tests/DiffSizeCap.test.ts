#!/usr/bin/env bun
/**
 * Wave 1 / Task 2.3 — plugin diff size cap + git-toplevel resolution.
 *
 * Covers ISC-03 of the pi-perspective-improvements plan:
 *   (a) A > 200 KiB diff causes the plugin to skip pi spawn and append
 *       a CONCERNS run with summary_md containing 'diff exceeded'.
 *   (b) `buildVerifyDiff` resolves to `git rev-parse --show-toplevel`
 *       when in a repo, and falls back to its starting cwd (with a
 *       stderr warning) when not.
 *
 * These tests exercise `buildVerifyDiff` and `resolveGitToplevel`
 * directly via the plugin's `__test` surface — no real pi spawn.
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { PaiPiPerspective } from '../../../plugins/pai-pi-perspective/index.ts';

const { buildVerifyDiff, resolveGitToplevel, parseRuns } = PaiPiPerspective.__test;

let cleanupPaths: string[] = [];
let savedCwd: string;

function freshTmp(prefix = 'pi-diffcap-'): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  cleanupPaths.push(dir);
  return dir;
}

function initGitRepo(root: string): void {
  spawnSync('git', ['init', '-q'], { cwd: root });
  spawnSync('git', ['config', 'user.email', 'test@example.com'], { cwd: root });
  spawnSync('git', ['config', 'user.name', 'test'], { cwd: root });
  spawnSync('git', ['config', 'commit.gpgsign', 'false'], { cwd: root });
  writeFileSync(join(root, 'seed.txt'), 'seed\n', 'utf-8');
  spawnSync('git', ['add', '.'], { cwd: root });
  spawnSync('git', ['commit', '-q', '-m', 'seed'], { cwd: root });
}

beforeEach(() => {
  savedCwd = process.cwd();
});

afterEach(() => {
  try {
    process.chdir(savedCwd);
  } catch {}
  for (const p of cleanupPaths) {
    try {
      rmSync(p, { recursive: true, force: true });
    } catch {}
  }
  cleanupPaths = [];
});

describe('buildVerifyDiff size cap', () => {
  test('under-cap diff is written verbatim and is not oversized', () => {
    const repo = freshTmp('pi-diffcap-under-');
    initGitRepo(repo);
    // Small modification — well under any reasonable cap.
    writeFileSync(join(repo, 'seed.txt'), 'seed\nplus-one-line\n', 'utf-8');
    process.chdir(repo);

    const workDir = join(repo, 'WORK');
    mkdirSync(workDir, { recursive: true });

    const res = buildVerifyDiff(workDir, 200 * 1024);
    expect(res.oversized).toBe(false);
    expect(existsSync(res.diffPath)).toBe(true);
    const written = readFileSync(res.diffPath, 'utf-8');
    expect(written).toContain('plus-one-line');
    expect(written).not.toContain('Diff exceeded PiPerspective size cap');
  });

  test('over-cap diff produces oversized=true and a stub file (no pi spawn)', () => {
    const repo = freshTmp('pi-diffcap-over-');
    initGitRepo(repo);
    // Track a seed version of big.txt so the subsequent rewrite produces
    // a real (large) unstaged diff visible to `git diff`.
    writeFileSync(join(repo, 'big.txt'), 'starter\n', 'utf-8');
    spawnSync('git', ['add', 'big.txt'], { cwd: repo });
    spawnSync('git', ['commit', '-q', '-m', 'add big.txt'], { cwd: repo });
    const huge = 'x'.repeat(2_000) + '\n';
    writeFileSync(join(repo, 'big.txt'), huge.repeat(200), 'utf-8'); // ~400 KiB
    process.chdir(repo);

    const workDir = join(repo, 'WORK');
    mkdirSync(workDir, { recursive: true });

    // 10 KiB cap forces oversize regardless of git's exact byte count.
    const res = buildVerifyDiff(workDir, 10 * 1024);
    expect(res.oversized).toBe(true);
    expect(res.originalBytes).toBeGreaterThan(10 * 1024);
    const written = readFileSync(res.diffPath, 'utf-8');
    expect(written).toContain('Diff exceeded PiPerspective size cap');
    expect(written).toContain('was NOT invoked');
  });

  test('not-in-a-git-repo path falls back to startDir (no throw, stderr warning)', () => {
    const naked = freshTmp('pi-diffcap-naked-');
    // No git init — naked tmp dir.
    process.chdir(naked);

    const workDir = join(naked, 'WORK');
    mkdirSync(workDir, { recursive: true });

    // Should not throw. The diff itself may be a "git diff unavailable"
    // stub, but `oversized` must be false and the file must exist.
    const res = buildVerifyDiff(workDir, 200 * 1024);
    expect(existsSync(res.diffPath)).toBe(true);
    expect(res.oversized).toBe(false);
  });
});

describe('resolveGitToplevel', () => {
  test('returns the git toplevel when invoked from a subdir of a repo', () => {
    const repo = freshTmp('pi-toplevel-');
    initGitRepo(repo);
    const sub = join(repo, 'a', 'b');
    mkdirSync(sub, { recursive: true });
    const top = resolveGitToplevel(sub);
    // git rev-parse normalizes symlinks; compare the toplevel against the
    // realpath of the repo root (macOS /var → /private/var, Linux tmpfs
    // may also normalize).
    const realRepoProbe = spawnSync('readlink', ['-f', repo], { encoding: 'utf-8' });
    const realRepo = realRepoProbe.status === 0 ? realRepoProbe.stdout.trim() : repo;
    expect(top).toBe(realRepo);
  });

  test('falls back to startDir when not in a repo', () => {
    const naked = freshTmp('pi-noresolve-');
    const res = resolveGitToplevel(naked);
    expect(res).toBe(naked);
  });
});

describe('CONCERNS stub run on oversize (integration intent)', () => {
  test('parseRuns can read a synthesized oversize CONCERNS run', () => {
    // We exercise the run-summary shape directly via the helpers; the
    // wiring inside `spawnPi` is covered by PluginIntegration smoke
    // tests (and gated by `_setSpawnPiOverride` there).
    const workDir = freshTmp('pi-oversize-run-');
    const runsFile = join(workDir, 'pi-perspective-runs.md');
    const generatedAt = new Date().toISOString();
    const body =
      `# PiPerspective runs\n\n` +
      `\n## CONCERNS — VERIFY — ${generatedAt}\n\n` +
      `**run_key:** \`VERIFY@${generatedAt}\`\n\n` +
      `diff exceeded 204800 bytes (actual 1048576); pi was not invoked.\n\n` +
      `\n---\n`;
    writeFileSync(runsFile, body, 'utf-8');

    const parsed = parseRuns(runsFile);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].key).toBe(`VERIFY@${generatedAt}`);
    expect(parsed[0].body).toContain('diff exceeded');
  });
});
