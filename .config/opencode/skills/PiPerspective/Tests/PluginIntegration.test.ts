#!/usr/bin/env bun
/**
 * Integration tests for the pai-pi-perspective opencode plugin.
 * Run: bun test ~/.config/opencode/skills/PiPerspective/Tests/PluginIntegration.test.ts
 *
 * Covers:
 *   T-18: Boot the plugin at each effort tier (E1..E5), assert which
 *         workflows fire for each phase transition.
 *   T-19: Kill switch on -> zero pi spawns across all phases / tiers.
 *
 * The plugin's real spawn() call is intercepted via _setSpawnPiOverride so
 * no actual pi subprocess runs. Each test verifies the dispatcher decision,
 * sidecar state, and (where relevant) the alerts file.
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import {
  _setSpawnPiOverride,
  handleIsaEdit,
} from '../../../plugins/pai-pi-perspective/index.ts';

interface SpawnCall {
  phase: 'THINK' | 'PLAN' | 'VERIFY';
  isaPath: string;
  diffPath?: string;
  planPath?: string;
  model: string;
}

let calls: SpawnCall[] = [];
let workRoot: string;
let settingsPath: string;
let savedEnv: { workDir?: string; runtimeHome?: string };

function isaFor(slug: string, tier: string, phase: string): string {
  return `---
slug: ${slug}
name: "test session"
tier: ${tier}
phase: ${phase}
created: 2026-01-01T00:00:00.000Z
---

# test

## Problem
test

## Goal
test

## Criteria
- [ ] ISC-01: test
`;
}

function writeSettings(opts: {
  enabled?: boolean;
  auto_invoke?: Record<string, string[]>;
  model?: string;
} = {}): void {
  const block: Record<string, unknown> = {
    enabled: opts.enabled ?? true,
    model: opts.model ?? 'mock/model',
  };
  if (opts.auto_invoke) block.auto_invoke = opts.auto_invoke;
  writeFileSync(
    settingsPath,
    JSON.stringify({ pi_perspective: block }, null, 2),
    'utf-8'
  );
}

function writeIsa(slug: string, tier: string, phase: string): string {
  const dir = join(workRoot, slug);
  mkdirSync(dir, { recursive: true });
  const isa = join(dir, 'ISA.md');
  writeFileSync(isa, isaFor(slug, tier, phase), 'utf-8');
  return isa;
}

beforeEach(() => {
  calls = [];
  _setSpawnPiOverride((phase, isaPath, diffPath, planPath, model) => {
    calls.push({ phase, isaPath, diffPath, planPath, model });
  });

  const root = mkdtempSync(join(tmpdir(), 'pi-plugin-test-'));
  workRoot = join(root, 'WORK');
  mkdirSync(workRoot, { recursive: true });

  const runtimeHome = join(root, 'pai-runtime');
  mkdirSync(runtimeHome, { recursive: true });
  settingsPath = join(runtimeHome, 'settings.json');

  savedEnv = {
    workDir: process.env.PAI_PI_PERSPECTIVE_WORK_DIR_OVERRIDE,
    runtimeHome: process.env.PAI_RUNTIME_HOME,
  };
  process.env.PAI_PI_PERSPECTIVE_WORK_DIR_OVERRIDE = workRoot;
  process.env.PAI_RUNTIME_HOME = runtimeHome;
});

afterEach(() => {
  _setSpawnPiOverride(null);
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
  try {
    rmSync(workRoot, { recursive: true, force: true });
  } catch {}
});

describe('T-18: effort tier -> workflow dispatch', () => {
  test('E1 (Standard) fires no workflows on any phase', async () => {
    writeSettings();
    for (const phase of ['THINK', 'PLAN', 'VERIFY']) {
      const isa = writeIsa(`e1-${phase}`, 'E1', phase);
      await handleIsaEdit(isa);
    }
    expect(calls).toEqual([]);
  });

  test('E2 (Extended) fires only VERIFY', async () => {
    writeSettings();
    const verifyIsa = writeIsa('e2-verify', 'E2', 'VERIFY');
    await handleIsaEdit(verifyIsa);
    const planIsa = writeIsa('e2-plan', 'E2', 'PLAN');
    await handleIsaEdit(planIsa);
    const thinkIsa = writeIsa('e2-think', 'E2', 'THINK');
    await handleIsaEdit(thinkIsa);

    expect(calls.length).toBe(1);
    expect(calls[0].phase).toBe('VERIFY');
    expect(calls[0].isaPath).toBe(verifyIsa);
  });

  test('E3 (Advanced) fires PLAN and VERIFY but not THINK', async () => {
    writeSettings();
    await handleIsaEdit(writeIsa('e3-think', 'E3', 'THINK'));
    await handleIsaEdit(writeIsa('e3-plan', 'E3', 'PLAN'));
    await handleIsaEdit(writeIsa('e3-verify', 'E3', 'VERIFY'));

    const phases = calls.map((c) => c.phase).sort();
    expect(phases).toEqual(['PLAN', 'VERIFY']);
  });

  test('E4 (Deep) fires all three workflows', async () => {
    writeSettings();
    await handleIsaEdit(writeIsa('e4-think', 'E4', 'THINK'));
    await handleIsaEdit(writeIsa('e4-plan', 'E4', 'PLAN'));
    await handleIsaEdit(writeIsa('e4-verify', 'E4', 'VERIFY'));

    const phases = calls.map((c) => c.phase).sort();
    expect(phases).toEqual(['PLAN', 'THINK', 'VERIFY']);
  });

  test('E5 (Comprehensive) fires all three workflows', async () => {
    writeSettings();
    await handleIsaEdit(writeIsa('e5-think', 'E5', 'THINK'));
    await handleIsaEdit(writeIsa('e5-plan', 'E5', 'PLAN'));
    await handleIsaEdit(writeIsa('e5-verify', 'E5', 'VERIFY'));

    const phases = calls.map((c) => c.phase).sort();
    expect(phases).toEqual(['PLAN', 'THINK', 'VERIFY']);
  });

  test('Sidecar dedup: same phase edited twice fires only once', async () => {
    writeSettings();
    const isa = writeIsa('dedup', 'E2', 'VERIFY');
    await handleIsaEdit(isa);
    // Simulate a follow-up edit to the ISA still in VERIFY phase.
    writeFileSync(
      isa,
      readFileSync(isa, 'utf8') + '\nextra note\n',
      'utf-8'
    );
    await handleIsaEdit(isa);
    expect(calls.length).toBe(1);
  });

  test('Sidecar dedup: phase change re-fires', async () => {
    writeSettings();
    const isa = writeIsa('rephase', 'E3', 'PLAN');
    await handleIsaEdit(isa);
    expect(calls.length).toBe(1);
    expect(calls[0].phase).toBe('PLAN');

    // Now transition to VERIFY.
    writeFileSync(isa, isaFor('rephase', 'E3', 'VERIFY'), 'utf-8');
    await handleIsaEdit(isa);
    expect(calls.length).toBe(2);
    expect(calls[1].phase).toBe('VERIFY');
  });

  test('Non-ISA writes are ignored', async () => {
    writeSettings();
    const dir = join(workRoot, 'misc');
    mkdirSync(dir, { recursive: true });
    const f = join(dir, 'NOTES.md');
    writeFileSync(f, '# notes\n');
    await handleIsaEdit(f);
    expect(calls).toEqual([]);
  });

  test('Writes outside MEMORY_WORK_DIR are ignored', async () => {
    writeSettings();
    const dir = mkdtempSync(join(tmpdir(), 'pi-outside-'));
    const f = join(dir, 'ISA.md');
    writeFileSync(f, isaFor('outside', 'E5', 'VERIFY'), 'utf-8');
    await handleIsaEdit(f);
    expect(calls).toEqual([]);
    rmSync(dir, { recursive: true, force: true });
  });

  test('Custom auto_invoke override is respected', async () => {
    writeSettings({ auto_invoke: { Extended: ['THINK', 'PLAN', 'VERIFY'] } });
    await handleIsaEdit(writeIsa('e2-custom-think', 'E2', 'THINK'));
    await handleIsaEdit(writeIsa('e2-custom-plan', 'E2', 'PLAN'));
    await handleIsaEdit(writeIsa('e2-custom-verify', 'E2', 'VERIFY'));
    const phases = calls.map((c) => c.phase).sort();
    expect(phases).toEqual(['PLAN', 'THINK', 'VERIFY']);
  });
});

describe('T-19: kill switch', () => {
  test('enabled=false fires zero pi spawns across all tiers and phases', async () => {
    writeSettings({ enabled: false });
    for (const tier of ['E1', 'E2', 'E3', 'E4', 'E5']) {
      for (const phase of ['THINK', 'PLAN', 'VERIFY']) {
        const isa = writeIsa(`killed-${tier}-${phase}`, tier, phase);
        await handleIsaEdit(isa);
      }
    }
    expect(calls).toEqual([]);
  });

  test('enabled=true fires normally (control case)', async () => {
    writeSettings({ enabled: true });
    await handleIsaEdit(writeIsa('control', 'E5', 'VERIFY'));
    expect(calls.length).toBe(1);
  });

  test('missing settings.json defaults to enabled', async () => {
    // Do NOT write settings.json — exercise the default-config path.
    if (existsSync(settingsPath)) rmSync(settingsPath);
    await handleIsaEdit(writeIsa('default', 'E5', 'VERIFY'));
    expect(calls.length).toBe(1);
  });

  test('malformed settings.json defaults to enabled', async () => {
    writeFileSync(settingsPath, '{not valid json', 'utf-8');
    await handleIsaEdit(writeIsa('malformed', 'E5', 'VERIFY'));
    expect(calls.length).toBe(1);
  });
});
