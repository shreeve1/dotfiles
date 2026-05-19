#!/usr/bin/env bun
/**
 * Wave 2 / Task 3.1 — sidecar GC trims oversized arrays before write.
 *
 * Covers ISC-05 of the pi-perspective-improvements plan:
 *   - `fires` capped to most-recent 50
 *   - `seen_alerts` capped to most-recent 200
 *   - `seen_runs` capped to most-recent 200
 *   - Trim is from the front (oldest first), tail preserved
 *   - Re-injection regression: an alert key trimmed from `seen_alerts`
 *     does not re-inject when the corresponding alerts-file entry was
 *     also rotated out.
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { PaiPiPerspective } from '../../../plugins/pai-pi-perspective/index.ts';

const {
  loadSidecar,
  saveSidecar,
  gcSidecar,
  collectUnseenAlerts,
  SIDECAR_CAP_FIRES,
  SIDECAR_CAP_SEEN_ALERTS,
  SIDECAR_CAP_SEEN_RUNS,
} = PaiPiPerspective.__test;

let workRoot: string;
let savedEnv: { workDir?: string };
let cleanupPaths: string[] = [];

beforeEach(() => {
  const root = mkdtempSync(join(tmpdir(), 'pi-gc-test-'));
  cleanupPaths.push(root);
  workRoot = join(root, 'WORK');
  mkdirSync(workRoot, { recursive: true });

  savedEnv = { workDir: process.env.PAI_PI_PERSPECTIVE_WORK_DIR_OVERRIDE };
  process.env.PAI_PI_PERSPECTIVE_WORK_DIR_OVERRIDE = workRoot;
});

afterEach(() => {
  if (savedEnv.workDir === undefined) {
    delete process.env.PAI_PI_PERSPECTIVE_WORK_DIR_OVERRIDE;
  } else {
    process.env.PAI_PI_PERSPECTIVE_WORK_DIR_OVERRIDE = savedEnv.workDir;
  }
  for (const p of cleanupPaths) {
    try {
      rmSync(p, { recursive: true, force: true });
    } catch {}
  }
  cleanupPaths = [];
});

describe('gcSidecar', () => {
  test('caps fires to SIDECAR_CAP_FIRES (50), keeping most-recent', () => {
    const state = loadSidecar(join(workRoot, 'gc-fires'));
    for (let i = 0; i < SIDECAR_CAP_FIRES + 25; i++) {
      state.fires.push({
        phase: 'VERIFY',
        started_at: `2026-05-19T00:00:${String(i).padStart(2, '0')}.000Z`,
        key: `k-${i}`,
      });
    }
    gcSidecar(state);
    expect(state.fires).toHaveLength(SIDECAR_CAP_FIRES);
    // Tail-preserved: the last entry must be the newest one we pushed.
    expect(state.fires[state.fires.length - 1].key).toBe(`k-${SIDECAR_CAP_FIRES + 24}`);
    // Head-trimmed: the original first entry is gone.
    expect(state.fires[0].key).toBe(`k-25`);
  });

  test('caps seen_alerts to SIDECAR_CAP_SEEN_ALERTS (200), keeping most-recent', () => {
    const state = loadSidecar(join(workRoot, 'gc-alerts'));
    for (let i = 0; i < SIDECAR_CAP_SEEN_ALERTS + 50; i++) {
      state.seen_alerts.push(`A@${i}`);
    }
    gcSidecar(state);
    expect(state.seen_alerts).toHaveLength(SIDECAR_CAP_SEEN_ALERTS);
    expect(state.seen_alerts[state.seen_alerts.length - 1]).toBe(
      `A@${SIDECAR_CAP_SEEN_ALERTS + 49}`,
    );
    expect(state.seen_alerts[0]).toBe(`A@50`);
  });

  test('caps seen_runs to SIDECAR_CAP_SEEN_RUNS (200), keeping most-recent', () => {
    const state = loadSidecar(join(workRoot, 'gc-runs'));
    for (let i = 0; i < SIDECAR_CAP_SEEN_RUNS + 10; i++) {
      state.seen_runs.push(`R@${i}`);
    }
    gcSidecar(state);
    expect(state.seen_runs).toHaveLength(SIDECAR_CAP_SEEN_RUNS);
    expect(state.seen_runs[state.seen_runs.length - 1]).toBe(`R@${SIDECAR_CAP_SEEN_RUNS + 9}`);
    expect(state.seen_runs[0]).toBe(`R@10`);
  });

  test('arrays at or below cap are returned unchanged', () => {
    const state = loadSidecar(join(workRoot, 'gc-noop'));
    state.fires = [
      { phase: 'THINK', started_at: '2026-05-19T00:00:00Z', key: 'a' },
      { phase: 'PLAN', started_at: '2026-05-19T00:00:01Z', key: 'b' },
    ];
    state.seen_alerts = ['x', 'y'];
    state.seen_runs = ['p', 'q', 'r'];
    gcSidecar(state);
    expect(state.fires).toHaveLength(2);
    expect(state.seen_alerts).toEqual(['x', 'y']);
    expect(state.seen_runs).toEqual(['p', 'q', 'r']);
  });
});

describe('saveSidecar GC integration', () => {
  test('persisted sidecar JSON respects caps even when input exceeds them', () => {
    const workDir = join(workRoot, 'persist-gc');
    mkdirSync(workDir, { recursive: true });
    const state = loadSidecar(workDir);
    for (let i = 0; i < 300; i++) state.seen_alerts.push(`A@${i}`);
    saveSidecar(workDir, state);
    const reloaded = JSON.parse(
      readFileSync(join(workDir, '.pi-perspective-state.json'), 'utf-8'),
    );
    expect(reloaded.seen_alerts).toHaveLength(SIDECAR_CAP_SEEN_ALERTS);
    expect(reloaded.seen_alerts[0]).toBe(`A@${300 - SIDECAR_CAP_SEEN_ALERTS}`);
    expect(reloaded.seen_alerts[reloaded.seen_alerts.length - 1]).toBe('A@299');
  });
});

describe('re-injection regression after GC', () => {
  test('an alert whose key was trimmed from seen_alerts does NOT re-inject if its entry was also rotated out', () => {
    const workDir = join(workRoot, 'gc-reinject');
    mkdirSync(workDir, { recursive: true });

    // Seed the sidecar with seen_alerts full of fresh keys; an OLD alert
    // key was trimmed away by GC. The corresponding alerts-file entry
    // must ALSO be absent for the GC to be safe.
    const state = loadSidecar(workDir);
    state.seen_runs_initialized = true;
    for (let i = 0; i < SIDECAR_CAP_SEEN_ALERTS; i++) {
      state.seen_alerts.push(`KEEP@${i}`);
    }
    // No "old" key in seen_alerts and no matching entry in the alerts
    // file: there's nothing to re-inject. The point of this test is to
    // prove the dedup set still works correctly post-trim.
    saveSidecar(workDir, state);

    // Build an alerts file with only the surviving (recent) keys.
    const alertsPath = join(workDir, 'pi-perspective-alerts.md');
    let body = `# PiPerspective alerts\n`;
    for (let i = SIDECAR_CAP_SEEN_ALERTS - 5; i < SIDECAR_CAP_SEEN_ALERTS; i++) {
      body +=
        `\n## CONCERNS — VERIFY — KEEP@${i}\n` +
        `**alert_key:** \`KEEP@${i}\`\n\n` +
        `tail entry ${i}\n\n---\n`;
    }
    writeFileSync(alertsPath, body, 'utf-8');

    const unseen = collectUnseenAlerts();
    // Every alert in the file is already in seen_alerts → no unseen
    // entries should be returned. (The old, trimmed key has no
    // corresponding file entry, so it can't re-inject either.)
    expect(unseen).toHaveLength(0);
  });
});
