#!/usr/bin/env bun
/**
 * Grade.ts — automates T-23 acceptance check for the plan-bad-deps fixture.
 *
 * Reads a PiVerdict JSON (from a real pi PLAN run) and asserts it meets the
 * criteria in expected-verdict.json. The plan fixture has 5 plant-able
 * defects; we require the verdict to be FAIL or CONCERNS, to have at least
 * `min_blockers` blockers, and to match at least `required_bug_pattern_count`
 * of the listed `bug_patterns` (matched by regex_or against
 * summary + detail_md, gated by min_severity).
 *
 * Usage:
 *   bun run Grade.ts <path-to-verdict.json>
 *
 * Exit codes:
 *   0  acceptance met
 *   1  acceptance failed
 *   2  bad input (file missing, not JSON, etc.)
 */

import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

import { validateVerdict, type Severity } from '../../Tools/Schema.ts';

interface BugPattern {
  name: string;
  regex_or: string[];
  min_severity: Severity;
}

interface ExpectedVerdict {
  expected_phase: string;
  expected_verdict_in: string[];
  min_blockers: number;
  required_bug_pattern_count: number;
  bug_patterns: BugPattern[];
  evidence_must_include_one_of: string[];
}

const SEVERITY_RANK: Record<Severity, number> = {
  minor: 1,
  major: 2,
  critical: 3,
};

const FIX_DIR = import.meta.dir;
const EXPECTED_PATH = resolve(FIX_DIR, 'expected-verdict.json');

interface Check {
  name: string;
  ok: boolean;
  detail: string;
}

function patternMatchesBlocker(
  pat: BugPattern,
  blocker: any
): { hit: boolean; matched_regex?: string } {
  const sev = blocker?.severity as Severity | undefined;
  if (!sev || SEVERITY_RANK[sev] < SEVERITY_RANK[pat.min_severity]) {
    return { hit: false };
  }
  const text = `${blocker?.summary ?? ''}\n${blocker?.detail_md ?? ''}`;
  for (const re of pat.regex_or) {
    if (new RegExp(re, 'i').test(text)) return { hit: true, matched_regex: re };
  }
  return { hit: false };
}

export function gradeVerdict(verdict: any, expected: ExpectedVerdict): Check[] {
  const checks: Check[] = [];

  // 1. Schema validates.
  const v = validateVerdict(verdict);
  checks.push({
    name: 'verdict schema validates',
    ok: v.ok,
    detail: v.ok
      ? 'ok'
      : v.error.issues
          .slice(0, 3)
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; '),
  });
  if (!v.ok) return checks;

  // 2. Phase.
  checks.push({
    name: `phase === "${expected.expected_phase}"`,
    ok: verdict.phase === expected.expected_phase,
    detail: `got "${verdict.phase}"`,
  });

  // 3. Verdict ∈ allowed set.
  checks.push({
    name: `verdict ∈ [${expected.expected_verdict_in.join(', ')}]`,
    ok: expected.expected_verdict_in.includes(verdict.verdict),
    detail: `got "${verdict.verdict}"`,
  });

  // 4. Blocker count.
  const bc = Array.isArray(verdict.blockers) ? verdict.blockers.length : 0;
  checks.push({
    name: `blockers.length >= ${expected.min_blockers}`,
    ok: bc >= expected.min_blockers,
    detail: `got ${bc}`,
  });

  // 5. Bug-pattern coverage. Each pattern can be satisfied by any blocker;
  //    we count how many distinct patterns are matched. A single blocker
  //    may satisfy multiple patterns (a "found two defects in one finding"
  //    review is a *good* review, not a cheating one). The threshold is
  //    `required_bug_pattern_count` out of `bug_patterns.length`.
  const matchedPatterns: { name: string; via: string }[] = [];
  for (const pat of expected.bug_patterns) {
    let hit: { hit: boolean; matched_regex?: string } = { hit: false };
    for (const b of verdict.blockers ?? []) {
      const r = patternMatchesBlocker(pat, b);
      if (r.hit) {
        hit = r;
        break;
      }
    }
    checks.push({
      name: `pattern matched: ${pat.name}`,
      ok: hit.hit,
      detail: hit.hit ? `matched regex /${hit.matched_regex}/` : 'no match',
    });
    if (hit.hit) matchedPatterns.push({ name: pat.name, via: hit.matched_regex! });
  }
  checks.push({
    name: `matched >= ${expected.required_bug_pattern_count} of ${expected.bug_patterns.length} bug patterns`,
    ok: matchedPatterns.length >= expected.required_bug_pattern_count,
    detail: `${matchedPatterns.length} matched`,
  });

  // 6. Evidence anchors. At least one blocker's evidence[] must mention
  //    one of the listed anchors (task ID or ISC ID).
  const wanted = expected.evidence_must_include_one_of ?? [];
  if (wanted.length > 0) {
    const hits = new Set<string>();
    for (const b of verdict.blockers ?? []) {
      for (const e of b?.evidence ?? []) {
        for (const w of wanted) {
          if (typeof e === 'string' && e.includes(w)) hits.add(w);
        }
      }
    }
    checks.push({
      name: `evidence cites at least one of [${wanted.join(', ')}]`,
      ok: hits.size > 0,
      detail:
        hits.size > 0 ? `matched: ${[...hits].join(', ')}` : 'no evidence reference matched',
    });
  }

  return checks;
}

if (import.meta.main) {
  const verdictPath = process.argv[2];
  if (!verdictPath) {
    console.error('Usage: bun run Grade.ts <path-to-verdict.json>');
    process.exit(2);
  }
  if (!existsSync(verdictPath)) {
    console.error(`Verdict file not found: ${verdictPath}`);
    process.exit(2);
  }
  let verdict: any;
  try {
    verdict = JSON.parse(readFileSync(verdictPath, 'utf8'));
  } catch (e) {
    console.error(`Verdict file is not valid JSON: ${(e as Error).message}`);
    process.exit(2);
  }
  if (!existsSync(EXPECTED_PATH)) {
    console.error(`expected-verdict.json not found next to Grade.ts`);
    process.exit(2);
  }
  const expected = JSON.parse(readFileSync(EXPECTED_PATH, 'utf8')) as ExpectedVerdict;

  const checks = gradeVerdict(verdict, expected);
  const allOk = checks.every((c) => c.ok);

  for (const c of checks) {
    const tag = c.ok ? 'PASS' : 'FAIL';
    console.log(`[${tag}] ${c.name}  —  ${c.detail}`);
  }
  console.log('');
  console.log(allOk ? 'OVERALL: PASS' : 'OVERALL: FAIL');
  process.exit(allOk ? 0 : 1);
}
