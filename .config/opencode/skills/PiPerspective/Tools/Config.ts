#!/usr/bin/env bun
/**
 * Config.ts - Reads ~/.pai/settings.json `pi_perspective` block.
 *
 * Provides defaults so the wrapper works even on a fresh install with no
 * settings file. The kill switch must default to ENABLED (true) — if a
 * user is invoking PiPerspective manually, they want it on. The kill
 * switch is opt-out, not opt-in.
 */

import { existsSync, readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

export type EffortTier =
  | 'Standard'
  | 'Extended'
  | 'Advanced'
  | 'Deep'
  | 'Comprehensive';

export type Severity = 'critical' | 'major' | 'minor';

export interface PiPerspectiveConfig {
  enabled: boolean;
  model: string;
  min_pi_version: string;
  auto_invoke: Record<EffortTier, ('THINK' | 'PLAN' | 'VERIFY')[]>;
  verify_thinking: 'minimal' | 'low' | 'medium' | 'high' | 'xhigh';
  blocker_min_severity_display: Severity;
}

export const DEFAULT_CONFIG: PiPerspectiveConfig = {
  enabled: true,
  model: 'openai-codex/gpt-5.5',
  min_pi_version: '0.73.1',
  auto_invoke: {
    Standard: ['THINK', 'PLAN', 'VERIFY'],
    Extended: ['THINK', 'PLAN', 'VERIFY'],
    Advanced: ['THINK', 'PLAN', 'VERIFY'],
    Deep: ['THINK', 'PLAN', 'VERIFY'],
    Comprehensive: ['THINK', 'PLAN', 'VERIFY'],
  },
  verify_thinking: 'minimal',
  blocker_min_severity_display: 'major',
};

const SETTINGS_PATH = join(homedir(), '.pai', 'settings.json');

/**
 * Load config. Override path for tests via opts.path. Returns DEFAULT_CONFIG
 * if the file does not exist or lacks a pi_perspective block.
 *
 * Bad JSON throws so the user gets a real error rather than silently
 * running with defaults that differ from what they intended.
 */
export function loadConfig(opts?: { path?: string }): PiPerspectiveConfig {
  const path = opts?.path ?? SETTINGS_PATH;
  if (!existsSync(path)) return { ...DEFAULT_CONFIG };
  let raw: string;
  try {
    raw = readFileSync(path, 'utf8');
  } catch (e) {
    throw new Error(`Cannot read settings file ${path}: ${(e as Error).message}`);
  }
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`settings.json is not valid JSON: ${(e as Error).message}`);
  }
  const block = parsed?.pi_perspective;
  if (!block || typeof block !== 'object') return { ...DEFAULT_CONFIG };

  // Shallow merge: user-provided keys override defaults; auto_invoke merges
  // tier-by-tier so a partial override does not erase other tiers.
  const merged: PiPerspectiveConfig = {
    ...DEFAULT_CONFIG,
    ...block,
    auto_invoke: {
      ...DEFAULT_CONFIG.auto_invoke,
      ...(block.auto_invoke ?? {}),
    },
  };
  return merged;
}

/**
 * Convenience: returns true iff the kill switch allows pi to spawn.
 */
export function isEnabled(cfg: PiPerspectiveConfig = loadConfig()): boolean {
  return cfg.enabled === true;
}
