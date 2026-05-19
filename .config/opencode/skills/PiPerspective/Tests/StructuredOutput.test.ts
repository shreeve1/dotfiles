#!/usr/bin/env bun
/**
 * Wave 1 / Task 2.5 — VersionCheck.supportsStructuredOutput probe.
 *
 * The probe inspects `pi --help` for a `--response-format` flag. We use
 * the `opts.helpText` injection seam so we never spawn a real pi.
 */

import { describe, expect, test } from 'bun:test';
import { _resetVersionCache, supportsStructuredOutput } from '../Tools/VersionCheck.ts';

describe('supportsStructuredOutput', () => {
  test('returns true when help advertises --response-format', () => {
    _resetVersionCache();
    const help =
      `pi 0.74.0\n\nUsage: pi [options]\n\nOptions:\n  --response-format <fmt>  emit structured output\n`;
    expect(supportsStructuredOutput({ helpText: help })).toBe(true);
  });

  test('returns true even when flag uses = form', () => {
    _resetVersionCache();
    const help = `Usage: pi [options]\n  --response-format=<fmt>\n`;
    expect(supportsStructuredOutput({ helpText: help })).toBe(true);
  });

  test('returns false when help omits the flag', () => {
    _resetVersionCache();
    const help =
      `pi 0.73.1\n\nUsage: pi [options]\n\nOptions:\n  --thinking <level>\n  --tools <list>\n`;
    expect(supportsStructuredOutput({ helpText: help })).toBe(false);
  });

  test('returns false on empty help', () => {
    _resetVersionCache();
    expect(supportsStructuredOutput({ helpText: '' })).toBe(false);
  });

  test('does not cache results when helpText is provided', () => {
    _resetVersionCache();
    expect(supportsStructuredOutput({ helpText: 'has --response-format here' })).toBe(true);
    // A subsequent probe without helpText must NOT be polluted by the
    // previous synthetic value (it should attempt a real spawn, which
    // most test environments will return false for).
    expect(supportsStructuredOutput({ helpText: '' })).toBe(false);
  });
});
