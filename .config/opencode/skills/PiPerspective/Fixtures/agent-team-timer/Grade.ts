#!/usr/bin/env bun
/**
 * Grade.ts — automates T-11 acceptance check.
 *
 * Reads a PiVerdict JSON (from a real or mock pi run) and asserts it
 * meets the criteria in expected-verdict.json. Prints PASS / FAIL with
 * a per-criterion breakdown.
 *
 * Usage:
 *   bun run Grade.ts <path-to-verdict.json>
 *
 * Exit codes:
 *   0  all criteria met
 *   1  one or more criteria failed
 *   2  bad input (file missing, not JSON, etc.)
 */

import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

import { validateVerdict, type Severity } from '../../Tools/Schema.ts';

interface PatternSpec {
  _what_to_catch: string;
  severity_at_least: Severity;
  summary_must_match: string;
  summary_flags?: string;
}

interface ExpectedVerdict {
  phase: string;
  verdict_required: string;
  blockers_min_count: number;
  blockers_must_match_patterns: PatternSpec[];
  evidence_must_reference_at_least_one_of: string[];
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

function gradeVerdict(verdict: any, expected: ExpectedVerdict): Check[] {
  const checks: Check[] = [];

  // 1. Schema validates
  const v = validateVerdict(verdict);
  checks.push({
    name: 'verdict schema validates',
    ok: v.ok,
    detail: v.ok ? 'ok' : v.error.issues.slice(0, 3).map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
  });
  if (!v.ok) return checks;

  // 2. Verdict required
  checks.push({
    name: `verdict === "${expected.verdict_required}"`,
    ok: verdict.verdict === expected.verdict_required,
    detail: `got "${verdict.verdict}"`,
  });

  // 3. Phase
  checks.push({
    name: `phase === "${expected.phase}"`,
    ok: verdict.phase === expected.phase,
    detail: `got "${verdict.phase}"`,
  });

  // 4. Blocker count
  const bc = Array.isArray(verdict.blockers) ? verdict.blockers.length : 0;
  checks.push({
    name: `blockers.length >= ${expected.blockers_min_count}`,
    ok: bc >= expected.blockers_min_count,
    detail: `got ${bc}`,
  });

  // 5. Pattern matches: each required pattern must be satisfied by at least
  //    one blocker with severity >= the required threshold. Each blocker can
  //    only satisfy ONE required pattern — prevents a single broad blocker
  //    from accidentally claiming both bug classes.
  const claimedIds = new Set<string>();
  for (const pat of expected.blockers_must_match_patterns ?? []) {
    const re = new RegExp(pat.summary_must_match, pat.summary_flags ?? '');
    const minRank = SEVERITY_RANK[pat.severity_at_least];
    const hit = (verdict.blockers ?? []).find((b: any) => {
      if (claimedIds.has(b?.id)) return false;
      const sev = b?.severity as Severity | undefined;
      if (!sev || SEVERITY_RANK[sev] < minRank) return false;
      const text = `${b?.summary ?? ''}\n${b?.detail_md ?? ''}`;
      return re.test(text);
    });
    if (hit) claimedIds.add(hit.id);
    checks.push({
      name: `pattern: ${pat._what_to_catch}`,
      ok: !!hit,
      detail: hit ? `matched blocker id=${hit.id} severity=${hit.severity}` : 'no distinct blocker matched',
    });
  }

  // 6. Evidence: at least one blocker's evidence[] must mention one of the
  //    required line ranges (substring match).
  const wanted = expected.evidence_must_reference_at_least_one_of ?? [];
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
      detail: hits.size > 0 ? `matched: ${[...hits].join(', ')}` : 'no evidence reference matched',
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

export { gradeVerdict };
