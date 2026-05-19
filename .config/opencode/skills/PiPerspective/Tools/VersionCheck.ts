#!/usr/bin/env bun
/**
 * VersionCheck.ts - Asserts pi >= MIN_PI_VERSION at startup.
 *
 * Called by InvokePi.ts before every shell-out. Cached for the lifetime
 * of a single process. Fail-fast with a clear error if pi is missing or
 * too old.
 */

import { spawnSync } from 'child_process';

export class PiVersionError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'PiVersionError';
  }
}

let cachedVersion: string | null = null;

/**
 * Parse a semver triple "MAJOR.MINOR.PATCH" into [number, number, number].
 * Extra suffix (e.g. "-beta.1") is dropped.
 */
export function parseSemver(v: string): [number, number, number] {
  const trimmed = v.trim().replace(/^v/, '');
  const core = trimmed.split('-')[0];
  const parts = core.split('.').map((n) => Number.parseInt(n, 10));
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) {
    throw new PiVersionError(`Unparseable pi version string: "${v}"`);
  }
  return [parts[0], parts[1], parts[2]];
}

/** Returns -1 if a<b, 0 if equal, 1 if a>b. */
export function compareSemver(a: string, b: string): number {
  const [a1, a2, a3] = parseSemver(a);
  const [b1, b2, b3] = parseSemver(b);
  if (a1 !== b1) return a1 < b1 ? -1 : 1;
  if (a2 !== b2) return a2 < b2 ? -1 : 1;
  if (a3 !== b3) return a3 < b3 ? -1 : 1;
  return 0;
}

/**
 * Run `pi --version` and return the version string.
 * Caches the result for the process lifetime.
 *
 * Override the binary path via opts.binary for tests.
 */
export function detectPiVersion(opts?: { binary?: string; refresh?: boolean }): string {
  if (cachedVersion && !opts?.refresh) return cachedVersion;
  const bin = opts?.binary ?? 'pi';
  let result;
  try {
    result = spawnSync(bin, ['--version'], { encoding: 'utf8', timeout: 5_000 });
  } catch (e) {
    throw new PiVersionError(`Failed to spawn '${bin} --version'`, e);
  }
  if (result.error) {
    throw new PiVersionError(
      `pi CLI not found on PATH. Install with: npm i -g @earendil-works/pi-coding-agent`,
      result.error
    );
  }
  if (result.status !== 0) {
    throw new PiVersionError(
      `'${bin} --version' exited ${result.status}: ${result.stderr?.trim() ?? ''}`
    );
  }
  // pi writes --version to stderr in some environments; accept either.
  const version = (result.stdout?.trim() || result.stderr?.trim() || '').split(/\s+/)[0];
  if (!version) {
    throw new PiVersionError(`'${bin} --version' produced no output`);
  }
  cachedVersion = version;
  return version;
}

/**
 * Assert pi version meets the minimum. Throws PiVersionError if not.
 */
export function assertPiVersion(
  minVersion: string,
  opts?: { binary?: string; refresh?: boolean }
): string {
  const actual = detectPiVersion(opts);
  if (compareSemver(actual, minVersion) < 0) {
    throw new PiVersionError(
      `pi ${actual} is older than required minimum ${minVersion}. ` +
        `Upgrade with: npm i -g @earendil-works/pi-coding-agent`
    );
  }
  return actual;
}

/** Test-only: reset the cached version. */
export function _resetVersionCache(): void {
  cachedVersion = null;
  cachedStructuredOutputSupport = null;
}

// ---------------------------------------------------------------------------
// Structured-output capability detection
// ---------------------------------------------------------------------------

let cachedStructuredOutputSupport: boolean | null = null;

/**
 * Probe `pi --help` and return true iff the installed binary advertises a
 * structured JSON mode flag. Cached for the process lifetime.
 *
 * The probe is conservative: any failure to spawn or parse defaults to
 * `false` so we gracefully fall back to free-form output on older pi
 * versions.
 *
 * Test override: pass `opts.helpText` to skip the spawn entirely and
 * inspect a synthetic help string.
 */
export function supportsStructuredOutput(opts?: {
  binary?: string;
  helpText?: string;
  refresh?: boolean;
}): boolean {
  if (cachedStructuredOutputSupport !== null && !opts?.refresh && !opts?.helpText) {
    return cachedStructuredOutputSupport;
  }
  let helpText = opts?.helpText;
  if (helpText === undefined) {
    const bin = opts?.binary ?? 'pi';
    try {
      const result = spawnSync(bin, ['--help'], { encoding: 'utf8', timeout: 5_000 });
      helpText = (result.stdout ?? '') + '\n' + (result.stderr ?? '');
    } catch {
      helpText = '';
    }
  }
  const supported = (helpText ?? '')
    .split(/\r?\n/)
    .some((line) => /(^|\s)--mode(\b|\s|=)/i.test(line) && /\bjson\b/i.test(line));
  if (!opts?.helpText) cachedStructuredOutputSupport = supported;
  return supported;
}

// ---------------------------------------------------------------------------
// CLI entrypoint: `bun run VersionCheck.ts [minVersion]`
// ---------------------------------------------------------------------------
if (import.meta.main) {
  const min = process.argv[2] ?? '0.73.1';
  try {
    const v = assertPiVersion(min);
    console.log(`pi ${v} OK (>= ${min})`);
    process.exit(0);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`pi version check FAILED: ${msg}`);
    process.exit(1);
  }
}
