#!/usr/bin/env bun
/**
 * RenderPlanDisagreement.ts — T-22 disagreement UX renderer.
 *
 * Reads a PiVerdict JSON for a PLAN phase and the original plan markdown,
 * then prints a two-block "PAI's plan / pi's review" comparison so the
 * user can quickly see where pi diverged from PAI.
 *
 * No auto-diff, no merge proposal — the human decides which side wins.
 * This is the deliberate Phase 3 D-03 decision from PLAN.md §6 / Open
 * Questions: tentative "two side-by-side markdown blocks, no auto-diff."
 *
 * Usage:
 *   bun run RenderPlanDisagreement.ts --plan <path> --verdict <path> [--out <path>]
 *
 * If --out is omitted, output goes to stdout. Designed to be invoked by the
 * model when it sees a PiPerspective alert for a PLAN-phase verdict, or
 * by the user directly to audit a saved verdict.
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

export function renderDisagreement(
  planMd: string,
  verdict: any
): string {
  const out: string[] = [];

  out.push('# PLAN-phase disagreement');
  out.push('');
  out.push(
    `**pi verdict:** \`${verdict.verdict}\` — ${verdict.blockers?.length ?? 0} blocker(s), ` +
      `${verdict.suggestions?.length ?? 0} suggestion(s).`
  );
  out.push(`**pi model:** \`${verdict.raw_model_id ?? 'unknown'}\``);
  out.push(`**generated_at:** ${verdict.generated_at ?? 'unknown'}`);
  out.push('');
  out.push(verdict.summary_md?.trim() ?? '(no summary)');
  out.push('');
  out.push('---');
  out.push('');

  out.push('## Block A — PAI\'s plan (as written)');
  out.push('');
  out.push('```markdown');
  out.push(planMd.trim());
  out.push('```');
  out.push('');

  out.push('## Block B — pi\'s review');
  out.push('');

  const blockers: Blocker[] = Array.isArray(verdict.blockers) ? verdict.blockers : [];
  if (blockers.length === 0) {
    out.push('_pi raised no blockers._');
    out.push('');
  } else {
    out.push(`### Blockers (${blockers.length})`);
    out.push('');
    // Severity-rank order: critical > major > minor.
    const rank: Record<string, number> = { critical: 0, major: 1, minor: 2 };
    const sorted = [...blockers].sort(
      (a, b) => (rank[a.severity] ?? 9) - (rank[b.severity] ?? 9)
    );
    sorted.forEach((b, i) => out.push(renderBlocker(b, i + 1)));
  }

  const suggestions = Array.isArray(verdict.suggestions) ? verdict.suggestions : [];
  if (suggestions.length > 0) {
    out.push(`### Suggestions (${suggestions.length})`);
    out.push('');
    suggestions.forEach((s: any, i: number) => {
      out.push(`**${i + 1}. ${s.summary ?? '(no summary)'}**`);
      out.push('');
      if (s.detail_md?.trim()) out.push(s.detail_md.trim());
      out.push('');
    });
  }

  out.push('---');
  out.push('');
  out.push('## How to act');
  out.push('');
  out.push('- **Override** pi if its objection misunderstands the ISA. Note the override in the ISA `## Decisions` section.');
  out.push('- **Iterate** the plan if pi found a real defect. Update Block A, then re-run PiPerspective for a fresh verdict.');
  out.push('- **Abort** if pi returned `REFRAME` and the ISA itself is the problem. Fix the ISA, then re-scaffold the plan.');
  out.push('');

  return out.join('\n');
}

if (import.meta.main) {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      plan: { type: 'string' },
      verdict: { type: 'string' },
      out: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
    strict: true,
  });

  if (values.help || !values.plan || !values.verdict) {
    console.log(
      'Usage: bun run RenderPlanDisagreement.ts --plan <path> --verdict <path> [--out <path>]'
    );
    process.exit(values.help ? 0 : 2);
  }

  if (!existsSync(values.plan)) {
    console.error(`Plan file not found: ${values.plan}`);
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
  if (verdict.phase !== 'PLAN') {
    console.error(`Expected phase=PLAN, got phase=${verdict.phase}`);
    process.exit(2);
  }

  const planMd = readFileSync(values.plan, 'utf8');
  const rendered = renderDisagreement(planMd, verdict);

  if (values.out) {
    writeFileSync(values.out, rendered, 'utf8');
    console.error(`Wrote ${values.out}`);
  } else {
    process.stdout.write(rendered);
  }
}
