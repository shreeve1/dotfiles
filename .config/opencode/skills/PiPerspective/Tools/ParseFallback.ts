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
 * Build a PiVerdict from arbitrary pi stdout.
 *
 * Parse failure is treated as a first-class FAIL with a synthesized
 * `critical` blocker (id includes `parse-error`) so the alert path lights
 * up and the user can distinguish a true `CONCERNS` from "pi output was
 * unparseable". The raw stdout is preserved in `summary_md` for forensics.
 */
export function buildFallbackVerdict(input: FallbackInput): PiVerdict {
  const banner = input.reason
    ? `**[PiPerspective parse failure]** ${input.reason}\n\n---\n\n`
    : `**[PiPerspective parse failure]** schema validation failed; raw pi output preserved below.\n\n---\n\n`;

  // Truncate absurdly long stdout to keep audit files manageable (<= 64 KiB).
  const MAX = 64 * 1024;
  const safeStdout =
    input.rawStdout.length > MAX
      ? input.rawStdout.slice(0, MAX) + `\n\n... [truncated ${input.rawStdout.length - MAX} chars]`
      : input.rawStdout;

  // Excerpt the head of stdout for the blocker detail so the alert payload
  // stays compact (the audit JSON still has the full summary_md).
  const EXCERPT_MAX = 2_000;
  const stdoutExcerpt =
    input.rawStdout.length > EXCERPT_MAX
      ? input.rawStdout.slice(0, EXCERPT_MAX) + `\n\n... [truncated ${input.rawStdout.length - EXCERPT_MAX} chars]`
      : input.rawStdout;

  const summary = 'PiPerspective could not parse pi output';
  return {
    phase: input.phase,
    verdict: 'FAIL',
    blockers: [
      {
        // Stable literal id so downstream alert dedup keys this verdict
        // distinctly from real reviewer concerns. (Real blockers are
        // re-hashed by enrichVerdict in InvokePi.ts; fallback verdicts
        // bypass that path on purpose.)
        id: 'parse-error',
        severity: 'critical',
        summary,
        detail_md:
          (input.reason ? `**Reason:** ${input.reason}\n\n` : '') +
          '```\n' +
          stdoutExcerpt +
          '\n```\n',
        evidence: ['stdout'],
      },
    ],
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
