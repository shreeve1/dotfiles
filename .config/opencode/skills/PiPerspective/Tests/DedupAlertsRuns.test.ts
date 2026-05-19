#!/usr/bin/env bun
/**
 * Wave 2 / Task 3.3 — alerts/runs dedup at injection time.
 *
 * Covers ISC-07 of the pi-perspective-improvements plan:
 *   - When a verdict produces both a run and an alert in the same
 *     generated_at timestamp, the system-prompt injection contains the
 *     verdict body exactly once (in the runs section).
 *   - The alerts section MAY be empty or missing for that key.
 *   - The dedup removes the alert COPY, not the run; alert is still
 *     marked seen so it doesn't re-inject next turn.
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { PaiPiPerspective } from '../../../plugins/pai-pi-perspective/index.ts';

const { appendAlert, appendRunSummary, loadSidecar, saveSidecar } = PaiPiPerspective.__test;

let workRoot: string;
let runtimeHome: string;
let savedEnv: { workDir?: string; runtimeHome?: string };
let cleanupPaths: string[] = [];

beforeEach(() => {
  const root = mkdtempSync(join(tmpdir(), 'pi-dedup-test-'));
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

function seedSettings(): void {
  writeFileSync(
    join(runtimeHome, 'settings.json'),
    JSON.stringify({ pi_perspective: { enabled: true, model: 'mock/model' } }),
    'utf-8',
  );
}

describe('system.transform dedup', () => {
  test('verdict body appears exactly once when run and alert share a key', async () => {
    seedSettings();
    const workDir = join(workRoot, 'dedup-pair');
    mkdirSync(workDir, { recursive: true });
    const state = loadSidecar(workDir);
    state.seen_runs_initialized = true;
    saveSidecar(workDir, state);

    const ts = '2026-05-19T00:01:00.000Z';
    const auditPath = join(workDir, 'pi-perspective', 'verify.json');
    appendRunSummary(workDir, 'VERIFY', 'FAIL', 'Off-by-one in foo()', auditPath, ts);
    appendAlert(workDir, 'VERIFY', 'FAIL', 'Off-by-one in foo()', auditPath, ts);

    const plugin = await PaiPiPerspective();
    const output = { system: [] as string[] };
    await plugin['experimental.chat.system.transform']?.({ sessionID: 's-dedup', model: {} as any }, output);

    expect(output.system).toHaveLength(1);
    const injected = output.system[0];
    // Verdict body appears exactly once.
    const occurrences = injected.split('Off-by-one in foo()').length - 1;
    expect(occurrences).toBe(1);
    // It must be inside the runs block.
    expect(injected).toContain('<pai-pi-perspective-runs>');
    // The alerts block, if present, must not contain the duplicate body.
    const alertsBlock =
      injected.includes('<pai-pi-perspective-alerts>')
        ? injected.slice(injected.indexOf('<pai-pi-perspective-alerts>'))
        : '';
    expect(alertsBlock).not.toContain('Off-by-one in foo()');
  });

  test('dedup marks duplicate alert seen so it does not re-inject next turn', async () => {
    seedSettings();
    const workDir = join(workRoot, 'dedup-marks-seen');
    mkdirSync(workDir, { recursive: true });
    const state = loadSidecar(workDir);
    state.seen_runs_initialized = true;
    saveSidecar(workDir, state);

    const ts = '2026-05-19T00:02:00.000Z';
    const auditPath = join(workDir, 'pi-perspective', 'verify.json');
    appendRunSummary(workDir, 'VERIFY', 'FAIL', 'shared body', auditPath, ts);
    appendAlert(workDir, 'VERIFY', 'FAIL', 'shared body', auditPath, ts);

    const plugin = await PaiPiPerspective();
    // First turn: injects (via runs block) and queues seen for both.
    await plugin['experimental.chat.system.transform']?.({ sessionID: 's', model: {} as any }, { system: [] });
    await plugin['chat.message']?.({ sessionID: 's' } as any, {} as any);

    // Second turn: nothing unseen, no injection.
    const second = { system: [] as string[] };
    await plugin['experimental.chat.system.transform']?.({ sessionID: 's', model: {} as any }, second);
    expect(second.system).toEqual([]);

    // Sidecar should now have BOTH key in seen_runs AND seen_alerts.
    const after = loadSidecar(workDir);
    expect(after.seen_runs).toContain(`VERIFY@${ts}`);
    expect(after.seen_alerts).toContain(`VERIFY@${ts}`);
  });

  test('an alert with no matching run is still injected (dedup is one-way)', async () => {
    seedSettings();
    const workDir = join(workRoot, 'dedup-alert-only');
    mkdirSync(workDir, { recursive: true });
    const state = loadSidecar(workDir);
    state.seen_runs_initialized = true;
    saveSidecar(workDir, state);

    const ts = '2026-05-19T00:03:00.000Z';
    const auditPath = join(workDir, 'pi-perspective', 'verify.json');
    appendAlert(workDir, 'VERIFY', 'FAIL', 'alert-only body', auditPath, ts);

    const plugin = await PaiPiPerspective();
    const output = { system: [] as string[] };
    await plugin['experimental.chat.system.transform']?.({ sessionID: 's', model: {} as any }, output);

    expect(output.system).toHaveLength(1);
    expect(output.system[0]).toContain('<pai-pi-perspective-alerts>');
    expect(output.system[0]).toContain('alert-only body');
  });
});
