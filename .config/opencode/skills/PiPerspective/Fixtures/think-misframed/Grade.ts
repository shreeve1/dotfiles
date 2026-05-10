#!/usr/bin/env bun
/**
 * Grade.ts — automates T-27 acceptance check for the think-misframed fixture.
 *
 * Reads a PiVerdict JSON (from a real pi THINK run) and asserts it meets the
 * criteria in expected-verdict.json. The ISA has six planted framing defects;
 * we require the verdict to be FAIL or REFRAME, with at least `min_blockers`
 * blockers, and matching at least `required_bug_pattern_count` of the listed
 * `bug_patterns` (regex_or against summary + detail_md + suggestion bodies,
 * gated by min_severity).
 *
 * Usage:
 *   bun run Grade.ts <path-to-verdict.json>
 *
 * Exit codes:
 *   0  acceptance met
 *   1  acceptance failed
 *   2  bad input
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

/**
 * For THINK, the reframed framing often lives in `summary_md` and in
 * `suggestions[].detail_md`, not in `blockers[]`. So patterns may match
 * against any blocker OR any suggestion OR the verdict-level summary_md.
 * For severity gating, blockers carry severity; suggestions/summary do not,
 * so we treat them as effectively `minor` for the min_severity check —
 * which means patterns whose `min_severity` is `minor` can match anywhere,
 * while `major`/`critical` patterns can only match blockers.
 */
function patternMatches(
  pat: BugPattern,
  verdict: any
): { hit: boolean; matched_regex?: string; matched_where?: string } {
  const blockers: any[] = Array.isArray(verdict.blockers) ? verdict.blockers : [];
  const suggestions: any[] = Array.isArray(verdict.suggestions) ? verdict.suggestions : [];
  const summary: string = String(verdict.summary_md ?? '');

  for (const re of pat.regex_or) {
    const rx = new RegExp(re, 'i');
    // Try blockers (gated by severity).
    for (const b of blockers) {
      const sev = b?.severity as Severity | undefined;
      if (sev && SEVERITY_RANK[sev] >= SEVERITY_RANK[pat.min_severity]) {
        const text = `${b?.summary ?? ''}\n${b?.detail_md ?? ''}`;
        if (rx.test(text)) {
          return { hit: true, matched_regex: re, matched_where: `blocker(${sev})` };
        }
      }
    }
    // Try suggestions/summary only if pattern accepts minor severity.
    if (SEVERITY_RANK[pat.min_severity] <= SEVERITY_RANK.minor) {
      for (const s of suggestions) {
        const text = `${s?.summary ?? ''}\n${s?.detail_md ?? ''}`;
        if (rx.test(text)) {
          return { hit: true, matched_regex: re, matched_where: 'suggestion' };
        }
      }
      if (rx.test(summary)) {
        return { hit: true, matched_regex: re, matched_where: 'summary_md' };
      }
    }
  }
  return { hit: false };
}

export function gradeVerdict(verdict: any, expected: ExpectedVerdict): Check[] {
  const checks: Check[] = [];

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

  checks.push({
    name: `phase === "${expected.expected_phase}"`,
    ok: verdict.phase === expected.expected_phase,
    detail: `got "${verdict.phase}"`,
  });

  checks.push({
    name: `verdict ∈ [${expected.expected_verdict_in.join(', ')}]`,
    ok: expected.expected_verdict_in.includes(verdict.verdict),
    detail: `got "${verdict.verdict}"`,
  });

  const bc = Array.isArray(verdict.blockers) ? verdict.blockers.length : 0;
  checks.push({
    name: `blockers.length >= ${expected.min_blockers}`,
    ok: bc >= expected.min_blockers,
    detail: `got ${bc}`,
  });

  // REFRAME-specific cross-check: per the prompt contract, a REFRAME verdict
  // MUST carry at least one critical blocker AND populate summary_md with the
  // alternative framing. Surface these as advisory checks (don't fail the
  // overall gate solely on this — but record it).
  if (verdict.verdict === 'REFRAME') {
    const hasCritical = (verdict.blockers ?? []).some((b: any) => b?.severity === 'critical');
    checks.push({
      name: 'REFRAME has at least one critical blocker',
      ok: hasCritical,
      detail: hasCritical ? 'ok' : 'no critical blocker found',
    });
    const summary = String(verdict.summary_md ?? '').trim();
    checks.push({
      name: 'REFRAME summary_md is non-empty',
      ok: summary.length >= 40,
      detail: `${summary.length} chars`,
    });
  }

  const matchedPatterns: { name: string; via: string; where: string }[] = [];
  for (const pat of expected.bug_patterns) {
    const hit = patternMatches(pat, verdict);
    checks.push({
      name: `pattern matched: ${pat.name}`,
      ok: hit.hit,
      detail: hit.hit ? `matched /${hit.matched_regex}/ in ${hit.matched_where}` : 'no match',
    });
    if (hit.hit) {
      matchedPatterns.push({
        name: pat.name,
        via: hit.matched_regex!,
        where: hit.matched_where!,
      });
    }
  }
  checks.push({
    name: `matched >= ${expected.required_bug_pattern_count} of ${expected.bug_patterns.length} bug patterns`,
    ok: matchedPatterns.length >= expected.required_bug_pattern_count,
    detail: `${matchedPatterns.length} matched`,
  });

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

/**
 * Overall pass requires: schema, phase, verdict-in, min_blockers, the
 * aggregate `matched >= N of M bug patterns` count, and (if specified) the
 * evidence anchor. Per-pattern hits and REFRAME shape checks are advisory:
 * a REFRAME verdict may legitimately fold several framing defects into one
 * critical blocker, so we only gate on the aggregate count, not on each
 * individual pattern.
 */
function isGating(checkName: string): boolean {
  if (checkName.startsWith('REFRAME ')) return false;
  if (checkName.startsWith('pattern matched: ')) return false;
  return true;
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
    console.error('expected-verdict.json not found next to Grade.ts');
    process.exit(2);
  }
  const expected = JSON.parse(readFileSync(EXPECTED_PATH, 'utf8')) as ExpectedVerdict;

  const checks = gradeVerdict(verdict, expected);
  const gatingOk = checks.filter((c) => isGating(c.name)).every((c) => c.ok);

  for (const c of checks) {
    const tag = c.ok ? 'PASS' : 'FAIL';
    const advisory = isGating(c.name) ? '' : ' (advisory)';
    console.log(`[${tag}]${advisory} ${c.name}  —  ${c.detail}`);
  }
  console.log('');
  console.log(gatingOk ? 'OVERALL: PASS' : 'OVERALL: FAIL');
  process.exit(gatingOk ? 0 : 1);
}
