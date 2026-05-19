#!/usr/bin/env bun
/**
 * RenderTelemetry.ts - Wave 3 / Item #9 / ISC-10.
 *
 * Reads `<work_dir>/pi-perspective-stats.jsonl` (one line per invocation,
 * format defined by `InvokePi.ts::appendTelemetry`) and prints a grouped
 * latency + verdict-distribution table.
 *
 * Usage:
 *   bun run RenderTelemetry.ts --work-dir <path>
 *   bun run RenderTelemetry.ts --all      # scan every ~/.pai/memory/WORK/<slug>/
 *
 * Columns: phase, count, mean_ms, p50_ms, p95_ms, verdict_distribution.
 *
 * Malformed lines are skipped with a single stderr warning; the CLI never
 * crashes on a partial-write race in the JSONL.
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { parseArgs } from 'util';

export interface TelemetryEntry {
  phase: 'THINK' | 'PLAN' | 'VERIFY';
  verdict: 'PASS' | 'CONCERNS' | 'FAIL' | 'REFRAME';
  duration_ms: number;
  model: string;
  thinking: string;
  input_chars: number;
  timestamp: string;
}

export interface PhaseStats {
  phase: string;
  count: number;
  mean_ms: number;
  p50_ms: number;
  p95_ms: number;
  verdict_distribution: Record<string, number>;
}

const STATS_FILE = 'pi-perspective-stats.jsonl';

function parseLines(text: string): { entries: TelemetryEntry[]; skipped: number } {
  const entries: TelemetryEntry[] = [];
  let skipped = 0;
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    try {
      const parsed = JSON.parse(line);
      if (
        typeof parsed?.phase === 'string' &&
        typeof parsed?.verdict === 'string' &&
        typeof parsed?.duration_ms === 'number' &&
        typeof parsed?.timestamp === 'string'
      ) {
        entries.push(parsed as TelemetryEntry);
      } else {
        skipped++;
      }
    } catch {
      skipped++;
    }
  }
  return { entries, skipped };
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  // Nearest-rank method: index = ceil(p * n) - 1 (0-indexed), clamped.
  const idx = Math.max(0, Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

export function computePhaseStats(entries: TelemetryEntry[]): PhaseStats[] {
  const byPhase = new Map<string, TelemetryEntry[]>();
  for (const e of entries) {
    const bucket = byPhase.get(e.phase) ?? [];
    bucket.push(e);
    byPhase.set(e.phase, bucket);
  }
  const result: PhaseStats[] = [];
  for (const [phase, bucket] of byPhase) {
    const durations = bucket.map((e) => e.duration_ms).sort((a, b) => a - b);
    const sum = durations.reduce((acc, v) => acc + v, 0);
    const verdictDist: Record<string, number> = {};
    for (const e of bucket) {
      verdictDist[e.verdict] = (verdictDist[e.verdict] ?? 0) + 1;
    }
    result.push({
      phase,
      count: bucket.length,
      mean_ms: Math.round(sum / bucket.length),
      p50_ms: percentile(durations, 50),
      p95_ms: percentile(durations, 95),
      verdict_distribution: verdictDist,
    });
  }
  // Stable order: THINK, PLAN, VERIFY first; then anything else alphabetical.
  const order: Record<string, number> = { THINK: 0, PLAN: 1, VERIFY: 2 };
  result.sort((a, b) => (order[a.phase] ?? 99) - (order[b.phase] ?? 99) || a.phase.localeCompare(b.phase));
  return result;
}

export function renderTable(stats: PhaseStats[]): string {
  const header = ['phase', 'count', 'mean_ms', 'p50_ms', 'p95_ms', 'verdict_distribution'];
  if (stats.length === 0) {
    return `# PiPerspective telemetry\n\n| ${header.join(' | ')} |\n| ${header.map(() => '---').join(' | ')} |\n| (no entries) |\n`;
  }
  const lines: string[] = [];
  lines.push('# PiPerspective telemetry');
  lines.push('');
  lines.push(`| ${header.join(' | ')} |`);
  lines.push(`| ${header.map(() => '---').join(' | ')} |`);
  for (const s of stats) {
    const dist = Object.entries(s.verdict_distribution)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(' ');
    lines.push(`| ${s.phase} | ${s.count} | ${s.mean_ms} | ${s.p50_ms} | ${s.p95_ms} | ${dist} |`);
  }
  return lines.join('\n') + '\n';
}

export function renderFromFile(statsPath: string): string {
  if (!existsSync(statsPath)) {
    return renderTable([]);
  }
  const text = readFileSync(statsPath, 'utf-8');
  const { entries, skipped } = parseLines(text);
  if (skipped > 0) {
    console.error(`[render-telemetry] skipped ${skipped} malformed line(s) in ${statsPath}`);
  }
  return renderTable(computePhaseStats(entries));
}

function collectAllWorkDirs(): string[] {
  const root = process.env.PAI_PI_PERSPECTIVE_WORK_DIR_OVERRIDE
    ?? join(process.env.PAI_RUNTIME_HOME ?? join(homedir(), '.pai'), 'memory', 'WORK');
  try {
    return readdirSync(root).map((slug) => join(root, slug));
  } catch {
    return [];
  }
}

if (import.meta.main) {
  const { values } = parseArgs({
    options: {
      'work-dir': { type: 'string' },
      all: { type: 'boolean' },
    },
    allowPositionals: false,
  });
  if (!values['work-dir'] && !values.all) {
    console.error('Usage: bun run RenderTelemetry.ts --work-dir <path> | --all');
    process.exit(2);
  }
  if (values.all) {
    const dirs = collectAllWorkDirs();
    const blobs: string[] = [];
    for (const dir of dirs) {
      const file = join(dir, STATS_FILE);
      if (!existsSync(file)) continue;
      blobs.push(`## ${dir}\n\n${renderFromFile(file)}`);
    }
    process.stdout.write(blobs.length > 0 ? blobs.join('\n') : renderTable([]));
  } else {
    const file = join(values['work-dir']!, STATS_FILE);
    process.stdout.write(renderFromFile(file));
  }
}
