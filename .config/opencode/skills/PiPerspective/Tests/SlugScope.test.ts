#!/usr/bin/env bun
/**
 * Wave 2 / Task 3.2 — slug-scoped alert/run collection.
 *
 * Covers ISC-06 of the pi-perspective-improvements plan:
 *   (a) Given two `sessionID`s with distinct slugs in mode-router state,
 *       `collectUnseenAlerts(sessionA)` returns ONLY A's WORK entries.
 *   (b) Given a `sessionID` with no slug entry, the function falls back
 *       to scan-all behavior (backward compat for NATIVE/MINIMAL and
 *       Algorithm-lite sessions without router state).
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { PaiPiPerspective } from '../../../plugins/pai-pi-perspective/index.ts';

const { collectUnseenAlerts, collectUnseenRuns, appendAlert, appendRunSummary, loadSidecar, saveSidecar } =
  PaiPiPerspective.__test;

let runtimeHome: string;
let workRoot: string;
let savedEnv: { workDir?: string; runtimeHome?: string };
let cleanupPaths: string[] = [];

function seedAlerts(slug: string, phase: 'VERIFY' | 'PLAN' | 'THINK', when: string, body: string): string {
  const workDir = join(workRoot, slug);
  mkdirSync(workDir, { recursive: true });
  return appendAlert(workDir, phase, 'CONCERNS', body, join(workDir, 'pi-perspective', `${phase.toLowerCase()}.json`), when);
}

function seedRun(slug: string, phase: 'VERIFY' | 'PLAN' | 'THINK', when: string, body: string): void {
  const workDir = join(workRoot, slug);
  mkdirSync(workDir, { recursive: true });
  // Mark sidecar initialized so historical-run filtering does NOT swallow our seed.
  const state = loadSidecar(workDir);
  state.seen_runs_initialized = true;
  saveSidecar(workDir, state);
  appendRunSummary(workDir, phase, 'PASS', body, join(workDir, 'pi-perspective', `${phase.toLowerCase()}.json`), when);
}

function writeModeRouterSession(sessionID: string, slug: string): void {
  const stateDir = join(runtimeHome, 'memory', 'STATE');
  mkdirSync(stateDir, { recursive: true });
  const statePath = join(stateDir, 'mode-router.json');
  let existing: { sessions?: Record<string, unknown> } = { sessions: {} };
  try {
    existing = JSON.parse(readFileSync(statePath, 'utf-8'));
  } catch {}
  existing.sessions ??= {};
  (existing.sessions as Record<string, unknown>)[sessionID] = {
    mode: 'ALGORITHM',
    slug,
    algorithm: { contract: 'isa', initialized: true },
  };
  writeFileSync(statePath, JSON.stringify(existing, null, 2), 'utf-8');
}

beforeEach(() => {
  const root = mkdtempSync(join(tmpdir(), 'pi-slug-scope-'));
  cleanupPaths.push(root);
  workRoot = join(root, 'WORK');
  mkdirSync(workRoot, { recursive: true });
  runtimeHome = join(root, 'pai-runtime');
  mkdirSync(runtimeHome, { recursive: true });

  savedEnv = {
    workDir: process.env.PAI_PI_PERSPECTIVE_WORK_DIR_OVERRIDE,
    runtimeHome: process.env.PAI_RUNTIME_HOME,
  };
  process.env.PAI_PI_PERSPECTIVE_WORK_DIR_OVERRIDE = workRoot;
  process.env.PAI_RUNTIME_HOME = runtimeHome;
});

afterEach(() => {
  if (savedEnv.workDir === undefined) {
    delete process.env.PAI_PI_PERSPECTIVE_WORK_DIR_OVERRIDE;
  } else {
    process.env.PAI_PI_PERSPECTIVE_WORK_DIR_OVERRIDE = savedEnv.workDir;
  }
  if (savedEnv.runtimeHome === undefined) {
    delete process.env.PAI_RUNTIME_HOME;
  } else {
    process.env.PAI_RUNTIME_HOME = savedEnv.runtimeHome;
  }
  for (const p of cleanupPaths) {
    try {
      rmSync(p, { recursive: true, force: true });
    } catch {}
  }
  cleanupPaths = [];
});

describe('collectUnseenAlerts slug scope', () => {
  test('returns only the active session slug\'s alerts when sessionID resolves', () => {
    seedAlerts('slug-a', 'VERIFY', '2026-05-19T00:01:00Z', 'A1');
    seedAlerts('slug-a', 'PLAN', '2026-05-19T00:02:00Z', 'A2');
    seedAlerts('slug-b', 'VERIFY', '2026-05-19T00:03:00Z', 'B1');
    writeModeRouterSession('session-A', 'slug-a');
    writeModeRouterSession('session-B', 'slug-b');

    const scopedA = collectUnseenAlerts('session-A');
    expect(scopedA).toHaveLength(1);
    expect(scopedA[0].workDir.endsWith('/slug-a')).toBe(true);
    expect(scopedA[0].alerts.map((a) => a.key)).toEqual([
      'VERIFY@2026-05-19T00:01:00Z',
      'PLAN@2026-05-19T00:02:00Z',
    ]);

    const scopedB = collectUnseenAlerts('session-B');
    expect(scopedB).toHaveLength(1);
    expect(scopedB[0].workDir.endsWith('/slug-b')).toBe(true);
    expect(scopedB[0].alerts.map((a) => a.key)).toEqual(['VERIFY@2026-05-19T00:03:00Z']);
  });

  test('falls back to scan-all when sessionID has no mode-router slug', () => {
    seedAlerts('slug-a', 'VERIFY', '2026-05-19T00:01:00Z', 'A1');
    seedAlerts('slug-b', 'VERIFY', '2026-05-19T00:02:00Z', 'B1');
    // No writeModeRouterSession call → file may not exist or no entry for
    // this session. The function must NOT silently drop everything.

    const result = collectUnseenAlerts('session-unknown');
    expect(result.length).toBeGreaterThanOrEqual(2);
    const slugs = result.map((r) => r.workDir.split('/').pop()).sort();
    expect(slugs).toEqual(['slug-a', 'slug-b']);
  });

  test('falls back to scan-all when sessionID is undefined', () => {
    seedAlerts('slug-a', 'VERIFY', '2026-05-19T00:01:00Z', 'A1');
    seedAlerts('slug-b', 'VERIFY', '2026-05-19T00:02:00Z', 'B1');
    const result = collectUnseenAlerts(undefined);
    const slugs = result.map((r) => r.workDir.split('/').pop()).sort();
    expect(slugs).toEqual(['slug-a', 'slug-b']);
  });

  test('mode-router parse error degrades to scan-all (does not throw)', () => {
    seedAlerts('slug-a', 'VERIFY', '2026-05-19T00:01:00Z', 'A1');
    const stateDir = join(runtimeHome, 'memory', 'STATE');
    mkdirSync(stateDir, { recursive: true });
    writeFileSync(join(stateDir, 'mode-router.json'), '{not valid json', 'utf-8');

    // Must not throw; must return slug-a alerts via scan-all fallback.
    const result = collectUnseenAlerts('session-A');
    expect(result.length).toBe(1);
    expect(result[0].workDir.endsWith('/slug-a')).toBe(true);
  });
});

describe('collectUnseenRuns slug scope', () => {
  test('returns only the active session slug\'s runs when sessionID resolves', () => {
    seedRun('slug-a', 'VERIFY', '2026-05-19T00:01:00Z', 'rA1');
    seedRun('slug-b', 'VERIFY', '2026-05-19T00:02:00Z', 'rB1');
    writeModeRouterSession('session-A', 'slug-a');

    const scopedA = collectUnseenRuns('session-A');
    expect(scopedA).toHaveLength(1);
    expect(scopedA[0].workDir.endsWith('/slug-a')).toBe(true);
    expect(scopedA[0].runs.map((r) => r.key)).toEqual(['VERIFY@2026-05-19T00:01:00Z']);
  });

  test('falls back to scan-all when no slug is resolvable', () => {
    seedRun('slug-a', 'VERIFY', '2026-05-19T00:01:00Z', 'rA1');
    seedRun('slug-b', 'VERIFY', '2026-05-19T00:02:00Z', 'rB1');
    const result = collectUnseenRuns(undefined);
    const slugs = result.map((r) => r.workDir.split('/').pop()).sort();
    expect(slugs).toEqual(['slug-a', 'slug-b']);
  });
});
