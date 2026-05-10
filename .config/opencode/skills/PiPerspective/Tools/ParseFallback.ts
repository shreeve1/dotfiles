#!/usr/bin/env bun
/**
 * ParseFallback.ts - Markdown -> PiVerdict fallback parser.
 *
 * Used when pi's stdout fails Zod validation. Never throws.
 * Produces a minimal PiVerdict with verdict='CONCERNS' and the raw
 * stdout as summary_md so the audit trail still captures something
 * useful and the caller never gets a hard parse error.
 *
 * Per PLAN §2.3.
 */

import type { Phase, PiVerdict } from './Schema.ts';

export interface FallbackInput {
  phase: Phase;
  rawStdout: string;
  modelId: string;
  /** Optional reason message added to summary_md to aid debugging. */
  reason?: string;
}

/**
 * Build a minimal PiVerdict from arbitrary pi stdout.
 * Verdict is always CONCERNS so downstream UI surfaces it but does
 * not block.
 */
export function buildFallbackVerdict(input: FallbackInput): PiVerdict {
  const banner = input.reason
    ? `**[PiPerspective fallback parser]** ${input.reason}\n\n---\n\n`
    : `**[PiPerspective fallback parser]** schema validation failed; raw pi output preserved below.\n\n---\n\n`;

  // Truncate absurdly long stdout to keep audit files manageable (<= 64 KiB).
  const MAX = 64 * 1024;
  const safeStdout =
    input.rawStdout.length > MAX
      ? input.rawStdout.slice(0, MAX) + `\n\n... [truncated ${input.rawStdout.length - MAX} chars]`
      : input.rawStdout;

  return {
    phase: input.phase,
    verdict: 'CONCERNS',
    blockers: [],
    suggestions: [],
    summary_md: banner + safeStdout,
    raw_model_id: input.modelId,
    schema_version: 1,
    generated_at: new Date().toISOString(),
  };
}

/**
 * Try to recover a single ```json ... ``` code block from stdout.
 * Returns the parsed object on success, null on failure.
 * Used as a "best effort" intermediate step before falling back to
 * buildFallbackVerdict.
 */
export function extractFencedJson(stdout: string): unknown | null {
  // Greedy match the LAST ```json fence; pi may write commentary before.
  const re = /```(?:json)?\s*\n([\s\S]*?)\n```/g;
  let last: string | null = null;
  let m;
  while ((m = re.exec(stdout)) !== null) {
    last = m[1];
  }
  if (!last) return null;
  try {
    return JSON.parse(last);
  } catch {
    return null;
  }
}

/**
 * Try to find a bare top-level JSON object in stdout (no fences).
 * Conservative: only attempts if stdout starts with '{' after trim.
 */
export function extractBareJson(stdout: string): unknown | null {
  const t = stdout.trim();
  if (!t.startsWith('{')) return null;
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}
