#!/usr/bin/env bun
/**
 * RenderReframe.ts — T-26 REFRAME UX renderer.
 *
 * Reads a PiVerdict JSON for a THINK phase and the original ISA markdown,
 * then prints a structured presentation of pi's REFRAME (or any THINK
 * verdict) so the user can decide whether to adopt the reframed framing,
 * iterate on the ISA, or override pi.
 *
 * Per PRD D-04 / PLAN T-26: REFRAME is the THINK-phase signature verdict.
 * It says "the ISA solves the wrong problem." The UX must therefore:
 *   - present the current ISA's goal/problem framing,
 *   - present pi's alternative framing prominently,
 *   - list any blockers/suggestions as supporting evidence,
 *   - offer a clear action menu (adopt / iterate / override / abort).
 *
 * Usage:
 *   bun run RenderReframe.ts --isa <path> --verdict <path> [--out <path>]
 *
 * If --out is omitted, output goes to stdout.
 *
 * Note: this renderer accepts any THINK verdict (PASS, CONCERNS, FAIL,
 * REFRAME) — the same surface is useful for non-REFRAME verdicts too —
 * but it foregrounds the alternative framing whenever the verdict is
 * REFRAME.
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { parseArgs } from 'util';

import { validateVerdict } from './Schema.ts';

interface Blocker {
  id: string;
  severity: 'critical' | 'major' | 'minor';
  summary: string;
  detail_md: string;
  evidence: string[];
}

interface Suggestion {
  summary: string;
  detail_md: string;
}

function renderBlocker(b: Blocker, idx: number): string {
  const sevTag = b.severity.toUpperCase();
  const lines: string[] = [];
  lines.push(`### ${idx}. [${sevTag}] ${b.summary}`);
  lines.push('');
  if (b.evidence?.length) {
    lines.push(`**Evidence:** ${b.evidence.map((e) => `\`${e}\``).join(', ')}`);
    lines.push('');
  }
  if (b.detail_md?.trim()) {
    lines.push(b.detail_md.trim());
    lines.push('');
  }
  return lines.join('\n');
}

function renderSuggestion(s: Suggestion, idx: number): string {
  const lines: string[] = [];
  lines.push(`### ${idx}. ${s.summary ?? '(no summary)'}`);
  lines.push('');
  if (s.detail_md?.trim()) {
    lines.push(s.detail_md.trim());
    lines.push('');
  }
  return lines.join('\n');
}

/**
 * Extract the ISA's `## Problem` and `## Goal` sections so the user can see
 * what pi is actually objecting to without re-reading the whole document.
 * Heuristic: match `## Problem` (case-insensitive) to the next `## ` or EOF;
 * same for `## Goal`. If neither is found, fall back to the first ~30 lines.
 */
export function extractFraming(isaMd: string): { problem: string; goal: string; fallback: boolean } {
  const grab = (heading: string): string | null => {
    const re = new RegExp(
      `(^|\\n)##\\s+${heading}\\b[^\\n]*\\n([\\s\\S]*?)(?=\\n##\\s|$)`,
      'i'
    );
    const m = isaMd.match(re);
    return m ? m[2].trim() : null;
  };

  const problem = grab('Problem');
  const goal = grab('Goal');

  if (problem || goal) {
    return {
      problem: problem ?? '_(no `## Problem` section in ISA)_',
      goal: goal ?? '_(no `## Goal` section in ISA)_',
      fallback: false,
    };
  }

  const head = isaMd.split('\n').slice(0, 30).join('\n').trim();
  return {
    problem: '_(no `## Problem` or `## Goal` section in ISA — showing first 30 lines)_',
    goal: head,
    fallback: true,
  };
}

export function renderReframe(isaMd: string, verdict: any): string {
  const out: string[] = [];
  const v = String(verdict.verdict ?? 'unknown').toUpperCase();
  const isReframe = v === 'REFRAME';

  out.push(`# THINK-phase ${isReframe ? 'reframe' : 'review'}`);
  out.push('');
  out.push(
    `**pi verdict:** \`${verdict.verdict}\` — ${verdict.blockers?.length ?? 0} blocker(s), ` +
      `${verdict.suggestions?.length ?? 0} suggestion(s).`
  );
  out.push(`**pi model:** \`${verdict.raw_model_id ?? 'unknown'}\``);
  out.push(`**generated_at:** ${verdict.generated_at ?? 'unknown'}`);
  out.push('');

  if (isReframe) {
    out.push('> **pi believes the ISA solves the wrong problem.** Read its alternative framing carefully before deciding to override.');
    out.push('');
  }

  out.push('---');
  out.push('');

  // Section 1: current framing from the ISA.
  out.push('## Block A — current framing (from your ISA)');
  out.push('');
  const framing = extractFraming(isaMd);
  out.push('### Problem (as stated)');
  out.push('');
  out.push(framing.problem);
  out.push('');
  out.push('### Goal (as stated)');
  out.push('');
  out.push(framing.goal);
  out.push('');
  if (framing.fallback) {
    out.push('_(ISA had no `## Problem` or `## Goal` heading — pi may have inferred them; consider adding explicit sections.)_');
    out.push('');
  }

  // Section 2: pi's response, foregrounded for REFRAME.
  out.push(`## Block B — pi's ${isReframe ? 'alternative framing' : 'response'}`);
  out.push('');
  const summary = verdict.summary_md?.trim() ?? '_(no summary provided)_';
  if (isReframe) {
    out.push('### Proposed alternative framing');
    out.push('');
    out.push(summary);
    out.push('');
  } else {
    out.push(summary);
    out.push('');
  }

  // Section 3: blockers (sorted by severity).
  const blockers: Blocker[] = Array.isArray(verdict.blockers) ? verdict.blockers : [];
  if (blockers.length > 0) {
    out.push(`### Blockers (${blockers.length})`);
    out.push('');
    const rank: Record<string, number> = { critical: 0, major: 1, minor: 2 };
    const sorted = [...blockers].sort(
      (a, b) => (rank[a.severity] ?? 9) - (rank[b.severity] ?? 9)
    );
    sorted.forEach((b, i) => out.push(renderBlocker(b, i + 1)));
  } else if (!isReframe) {
    out.push('_pi raised no blockers._');
    out.push('');
  }

  // Section 4: suggestions — for REFRAME these usually contain the
  // concrete reframed goal statement.
  const suggestions: Suggestion[] = Array.isArray(verdict.suggestions) ? verdict.suggestions : [];
  if (suggestions.length > 0) {
    out.push(
      isReframe
        ? `### Suggested reframed goals (${suggestions.length})`
        : `### Suggestions (${suggestions.length})`
    );
    out.push('');
    suggestions.forEach((s, i) => out.push(renderSuggestion(s, i + 1)));
  }

  // Section 5: action menu.
  out.push('---');
  out.push('');
  out.push('## How to act');
  out.push('');
  if (isReframe) {
    out.push('- **Adopt** the reframe if pi has identified a better problem statement. Rewrite `## Problem` and `## Goal` in your ISA, then update ISCs and re-run THINK.');
    out.push("- **Override** pi if you have load-bearing context it lacks. Note the override in your ISA's `## Decisions` section so the rationale persists.");
    out.push('- **Iterate** the ISA: keep the current framing but tighten weak ISCs / surface hidden assumptions raised in the blockers above, then re-run THINK.');
    out.push('- **Abort** if the reframe reveals the work itself is wrong. Step back to OBSERVE.');
  } else if (v === 'FAIL') {
    out.push('- **Iterate** the ISA: fix the blockers above (typically: goal stated in implementation terms, side-effect ISCs, hidden assumptions, missing scope).');
    out.push('- **Override** pi only if the blockers reflect a misreading; record the rationale in `## Decisions`.');
    out.push('- Re-run THINK after edits.');
  } else if (v === 'CONCERNS') {
    out.push('- **Accept** the ISA as-is and proceed to PLAN — the concerns are non-blocking but worth tracking.');
    out.push('- **Tighten** the called-out items first if you have time; they are cheaper to fix here than after planning.');
  } else {
    out.push('- **Proceed** to PLAN. pi did not raise blocking concerns about the framing.');
  }
  out.push('');

  return out.join('\n');
}

if (import.meta.main) {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      isa: { type: 'string' },
      verdict: { type: 'string' },
      out: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
    strict: true,
  });

  if (values.help || !values.isa || !values.verdict) {
    console.log(
      'Usage: bun run RenderReframe.ts --isa <path> --verdict <path> [--out <path>]'
    );
    process.exit(values.help ? 0 : 2);
  }

  if (!existsSync(values.isa)) {
    console.error(`ISA file not found: ${values.isa}`);
    process.exit(2);
  }
  if (!existsSync(values.verdict)) {
    console.error(`Verdict file not found: ${values.verdict}`);
    process.exit(2);
  }

  let verdict: any;
  try {
    verdict = JSON.parse(readFileSync(values.verdict, 'utf8'));
  } catch (e) {
    console.error(`Verdict file is not valid JSON: ${(e as Error).message}`);
    process.exit(2);
  }
  const v = validateVerdict(verdict);
  if (!v.ok) {
    console.error(
      `Verdict failed schema validation: ${v.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ')}`
    );
    process.exit(2);
  }
  if (verdict.phase !== 'THINK') {
    console.error(`Expected phase=THINK, got phase=${verdict.phase}`);
    process.exit(2);
  }

  const isaMd = readFileSync(values.isa, 'utf8');
  const rendered = renderReframe(isaMd, verdict);

  if (values.out) {
    writeFileSync(values.out, rendered, 'utf8');
    console.error(`Wrote ${values.out}`);
  } else {
    process.stdout.write(rendered);
  }
}
