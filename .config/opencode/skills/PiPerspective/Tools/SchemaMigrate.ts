#!/usr/bin/env bun
/**
 * SchemaMigrate.ts — Wave 4 / ISC-13.
 *
 * Forward-only migration helper for PiVerdict JSON. Detects the input's
 * `schema_version`, applies the chain of migrations through to
 * `LATEST_SCHEMA_VERSION`, and validates the result with Zod.
 *
 * Design notes:
 *   - Migrations are pure functions in `Tools/Migrations/`.
 *   - Each migration is idempotent (re-running v1→v2 on a v2 input is a no-op).
 *   - The Zod schema accepts the union of all live versions so consumers
 *     that skip migration still validate v1 inputs.
 *   - This module is the single entry point for all renderers and the
 *     CI gate, satisfying ISC-16 (renderer backward compat).
 *
 * CLI:
 *   bun run SchemaMigrate.ts --in <verdict.json> [--out <path>]
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { parseArgs } from 'util';

import { migrateV1ToV2 } from './Migrations/v1-to-v2.ts';
import {
  LATEST_SCHEMA_VERSION,
  type PiVerdict,
  validateVerdict,
} from './Schema.ts';

/**
 * Apply forward migrations until the verdict is at LATEST_SCHEMA_VERSION,
 * then validate. Throws if the result fails Zod validation.
 *
 * Idempotent: a v2 verdict passes through unchanged.
 *
 * Lenient on missing schema_version: assume v1 (the only version that
 * predates this helper).
 */
export function migrate(input: unknown): PiVerdict {
  if (input == null || typeof input !== 'object') {
    throw new Error('SchemaMigrate.migrate: input is not an object');
  }
  let cur: any = input;
  const startVersion: number = typeof cur.schema_version === 'number' ? cur.schema_version : 1;

  if (startVersion > LATEST_SCHEMA_VERSION) {
    throw new Error(
      `SchemaMigrate.migrate: input schema_version=${startVersion} is newer than LATEST_SCHEMA_VERSION=${LATEST_SCHEMA_VERSION}; refusing to downgrade`
    );
  }

  // Chain forward. Adding a v2→v3 migration later: extend this ladder.
  if (startVersion < 2) {
    cur = migrateV1ToV2(cur);
  }

  // Be defensive: a verdict missing schema_version entirely gets v1 default
  // before we entered the ladder, but migrateV1ToV2 already set 2.
  if (cur.schema_version !== LATEST_SCHEMA_VERSION) {
    cur = { ...cur, schema_version: LATEST_SCHEMA_VERSION };
  }

  const v = validateVerdict(cur);
  if (!v.ok) {
    const detail = v.error.issues
      .slice(0, 3)
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new Error(`SchemaMigrate.migrate: validation failed after migration: ${detail}`);
  }
  return v.value;
}

/**
 * Convenience: load a verdict file from disk, migrate it, return the
 * latest-version object. Used by renderers (ISC-16) and CiGate (ISC-11).
 */
export function loadAndMigrate(path: string): PiVerdict {
  if (!existsSync(path)) {
    throw new Error(`SchemaMigrate.loadAndMigrate: file not found: ${path}`);
  }
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    throw new Error(`SchemaMigrate.loadAndMigrate: invalid JSON in ${path}: ${(e as Error).message}`);
  }
  return migrate(raw);
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
if (import.meta.main) {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      in: { type: 'string' },
      out: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
    strict: true,
  });

  if (values.help || !values.in) {
    console.log('Usage: bun run SchemaMigrate.ts --in <verdict.json> [--out <path>]');
    process.exit(values.help ? 0 : 2);
  }

  try {
    const migrated = loadAndMigrate(values.in);
    const text = JSON.stringify(migrated, null, 2) + '\n';
    if (values.out) {
      writeFileSync(values.out, text, 'utf8');
      console.error(`Wrote ${values.out} (schema_version=${migrated.schema_version})`);
    } else {
      process.stdout.write(text);
    }
    process.exit(0);
  } catch (e) {
    console.error((e as Error).message);
    process.exit(1);
  }
}
