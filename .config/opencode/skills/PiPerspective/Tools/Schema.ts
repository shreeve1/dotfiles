#!/usr/bin/env bun
/**
 * Schema.ts - PiVerdict TypeScript types + Zod runtime validator.
 *
 * Single source of truth for the structured output contract produced
 * by every PiPerspective invocation. Maps 1:1 to PLAN §2.3.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// TypeScript types
// ---------------------------------------------------------------------------

export type Severity = 'critical' | 'major' | 'minor';
export type Phase = 'THINK' | 'PLAN' | 'VERIFY';
export type Verdict = 'PASS' | 'CONCERNS' | 'FAIL' | 'REFRAME';

export interface PiBlocker {
  id: string;
  severity: Severity;
  summary: string;
  detail_md: string;
  evidence?: string[];
}

export interface PiSuggestion {
  summary: string;
  detail_md: string;
}

/**
 * Optional telemetry block added in schema_version 2 (Wave 4 / ISC-14).
 * Both fields are optional even on v2 verdicts — older clients that don't
 * emit telemetry remain valid post-migration.
 */
export interface PiTelemetry {
  duration_ms?: number;
  input_chars?: number;
}

/**
 * Schema versions accepted on the wire. v1 is the original shape; v2 is
 * v1 + optional `telemetry`. The Zod schema accepts the union so both
 * versions validate transparently.
 */
export type SchemaVersion = 1 | 2;

/**
 * Wave 4 / ISC-13: bump LATEST_SCHEMA_VERSION here to enable a new
 * migration. SchemaMigrate.migrate() always returns objects at this
 * version.
 */
export const LATEST_SCHEMA_VERSION = 2 as const;

export interface PiVerdict {
  phase: Phase;
  verdict: Verdict;
  blockers: PiBlocker[];
  suggestions: PiSuggestion[];
  summary_md: string;
  raw_model_id: string;
  schema_version: SchemaVersion;
  generated_at: string; // ISO8601
  /** Wave 4 / schema_version 2 only. Absent on v1. */
  telemetry?: PiTelemetry;
}

// ---------------------------------------------------------------------------
// Zod validators
// ---------------------------------------------------------------------------

export const SeveritySchema = z.enum(['critical', 'major', 'minor']);
export const PhaseSchema = z.enum(['THINK', 'PLAN', 'VERIFY']);
export const VerdictSchema = z.enum(['PASS', 'CONCERNS', 'FAIL', 'REFRAME']);

export const PiBlockerSchema: z.ZodType<PiBlocker> = z.object({
  id: z.string().min(1),
  severity: SeveritySchema,
  summary: z.string().min(1).max(200),
  detail_md: z.string(),
  evidence: z.array(z.string()).optional(),
});

export const PiSuggestionSchema: z.ZodType<PiSuggestion> = z.object({
  summary: z.string().min(1),
  detail_md: z.string(),
});

export const PiTelemetrySchema: z.ZodType<PiTelemetry> = z.object({
  duration_ms: z.number().nonnegative().optional(),
  input_chars: z.number().nonnegative().optional(),
});

/**
 * Wave 4 / ISC-13, ISC-14: schema_version is a union of 1 and 2 so existing
 * audit files on disk continue to validate. The `telemetry` field is optional
 * regardless of version (v1 simply never sets it).
 */
export const PiVerdictSchema: z.ZodType<PiVerdict> = z.object({
  phase: PhaseSchema,
  verdict: VerdictSchema,
  blockers: z.array(PiBlockerSchema),
  suggestions: z.array(PiSuggestionSchema),
  summary_md: z.string(),
  raw_model_id: z.string().min(1),
  schema_version: z.union([z.literal(1), z.literal(2)]),
  generated_at: z.string().min(1),
  telemetry: PiTelemetrySchema.optional(),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Stable blocker ID = first-8-chars sha256 hex of "<phase>::<summary>".
 * Keeps IDs deterministic across runs so re-runs can be diffed.
 */
export function blockerId(phase: Phase, summary: string): string {
  // Bun exposes crypto.subtle; for sync deterministic ID we use a small fnv-1a hash.
  // 8 hex chars is sufficient for de-dup within a single verdict.
  let h = 0x811c9dc5;
  const s = `${phase}::${summary}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/**
 * Validate an unknown value as a PiVerdict.
 * Returns { ok: true, value } on success, { ok: false, error } on failure.
 */
export function validateVerdict(
  input: unknown
): { ok: true; value: PiVerdict } | { ok: false; error: z.ZodError } {
  const parsed = PiVerdictSchema.safeParse(input);
  if (parsed.success) return { ok: true, value: parsed.data };
  return { ok: false, error: parsed.error };
}
