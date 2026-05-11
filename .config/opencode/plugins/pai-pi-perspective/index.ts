/**
 * pai-pi-perspective — auto-invoke PiPerspective on Algorithm phase transitions.
 *
 * Trigger: tool.execute.after on write/edit/patch of ISA.md under ~/.pai/memory/WORK/.
 * Same pattern as pai-isa-sync and pai-checkpoint-per-isc — there is no native
 * phase-transition event in the opencode plugin API (see
 * ~/.pai/artifacts/plans/pi-perspective/HOOK-SURFACE.md for the T-13 finding).
 *
 * Flow:
 *   1. Parse ISA frontmatter: { slug, phase, tier }.
 *   2. Map E1..E5 → Standard..Comprehensive (PiPerspectiveConfig.auto_invoke).
 *   3. If phase has not changed since last fire (sidecar state) → no-op.
 *   4. If new phase ∈ auto_invoke[tier] → spawn pi (fire-and-forget).
 *   5. After pi finishes, on FAIL/REFRAME, append entry to
 *      pi-perspective-alerts.md in the work_dir (path-a verdict UX).
 *   6. (path-b) When the alerts file has unseen entries, the
 *      experimental.chat.system.transform hook injects them into the next
 *      user turn's system prompt; chat.message then marks them seen.
 *
 * Fails closed: every error path logs to stderr; never blocks the user's
 * tool call. pi spawn is non-blocking via child_process.spawn.
 *
 * Kill switch: loads PiPerspectiveConfig.enabled before every spawn.
 */

import type { Plugin } from '@opencode-ai/plugin';
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

function paiRuntimeHome(): string {
  return process.env.PAI_RUNTIME_HOME || join(homedir(), '.pai');
}
// Allow tests to override the work-dir root without monkey-patching paths.
function memoryWorkDir(): string {
  return (
    process.env.PAI_PI_PERSPECTIVE_WORK_DIR_OVERRIDE ||
    join(paiRuntimeHome(), 'memory', 'WORK')
  );
}
const SKILL_DIR = join(
  homedir(),
  '.config',
  'opencode',
  'skills',
  'PiPerspective'
);
const INVOKE_PI = join(SKILL_DIR, 'Tools', 'InvokePi.ts');
const SIDECAR_FILE = '.pi-perspective-state.json';
const ALERTS_FILE = 'pi-perspective-alerts.md';
const RUNS_FILE = 'pi-perspective-runs.md';
const ARTIFACT_FILENAME = 'ISA.md';

type Phase = 'THINK' | 'PLAN' | 'VERIFY';
type Verdict = 'FAIL' | 'REFRAME' | 'CONCERNS' | 'PASS';
type ETier = 'E1' | 'E2' | 'E3' | 'E4' | 'E5';
type EffortTier =
  | 'Standard'
  | 'Extended'
  | 'Advanced'
  | 'Deep'
  | 'Comprehensive';

const E_TO_TIER: Record<ETier, EffortTier> = {
  E1: 'Standard',
  E2: 'Extended',
  E3: 'Advanced',
  E4: 'Deep',
  E5: 'Comprehensive',
};

// ---------------------------------------------------------------------------
// Sidecar state
// ---------------------------------------------------------------------------

interface SidecarState {
  /** Last phase we fired pi for. Null = never fired. */
  last_fired_phase: Phase | null;
  /** Last content-sensitive fire key; lets changed same-phase ISAs re-fire. */
  last_fired_key?: string | null;
  /** Wall-clock timestamps of fires, for audit. */
  fires: { phase: Phase; started_at: string; key?: string }[];
  /** Alerts the model has already seen (cleared by chat.message hook). */
  seen_alerts: string[];
}

function loadSidecar(workDir: string): SidecarState {
  const file = join(workDir, SIDECAR_FILE);
  if (!existsSync(file)) {
    return { last_fired_phase: null, last_fired_key: null, fires: [], seen_alerts: [] };
  }
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf-8'));
    return {
      last_fired_phase: parsed.last_fired_phase ?? null,
      last_fired_key: parsed.last_fired_key ?? null,
      fires: Array.isArray(parsed.fires) ? parsed.fires : [],
      seen_alerts: Array.isArray(parsed.seen_alerts) ? parsed.seen_alerts : [],
    };
  } catch (err) {
    console.error('[pai-pi-perspective] malformed sidecar, resetting:', err);
    return { last_fired_phase: null, last_fired_key: null, fires: [], seen_alerts: [] };
  }
}

function fireKey(phase: Phase, content: string): string {
  return `${phase}:${createHash('sha256').update(content).digest('hex')}`;
}

function saveSidecar(workDir: string, state: SidecarState): void {
  try {
    const file = join(workDir, SIDECAR_FILE);
    writeFileSync(file, JSON.stringify(state, null, 2) + '\n', 'utf-8');
  } catch (err) {
    console.error('[pai-pi-perspective] sidecar write failed:', err);
  }
}

// ---------------------------------------------------------------------------
// Frontmatter parsing (inlined; mirrors pai-isa-sync)
// ---------------------------------------------------------------------------

function parseFrontmatter(content: string): Record<string, string> | null {
  const m = content.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const fm: Record<string, string> = {};
  for (const line of m[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx > 0) {
      fm[line.slice(0, idx).trim()] = line
        .slice(idx + 1)
        .trim()
        .replace(/^["']|["']$/g, '');
    }
  }
  return fm;
}

// ---------------------------------------------------------------------------
// Config (inlined minimal subset; no import to keep plugin self-contained)
// ---------------------------------------------------------------------------

interface PiPerspectiveConfig {
  enabled: boolean;
  model: string;
  auto_invoke: Record<EffortTier, Phase[]>;
}

const DEFAULT_AUTO_INVOKE: Record<EffortTier, Phase[]> = {
  Standard: ['THINK', 'PLAN', 'VERIFY'],
  Extended: ['THINK', 'PLAN', 'VERIFY'],
  Advanced: ['THINK', 'PLAN', 'VERIFY'],
  Deep: ['THINK', 'PLAN', 'VERIFY'],
  Comprehensive: ['THINK', 'PLAN', 'VERIFY'],
};

function loadPiConfig(): PiPerspectiveConfig {
  const path = join(paiRuntimeHome(), 'settings.json');
  if (!existsSync(path)) {
    return {
      enabled: true,
      model: 'openai-codex/gpt-5.5',
      auto_invoke: DEFAULT_AUTO_INVOKE,
    };
  }
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf-8'));
    const block = parsed?.pi_perspective ?? {};
    return {
      enabled: block.enabled !== false,
      model: block.model ?? 'openai-codex/gpt-5.5',
      auto_invoke: {
        ...DEFAULT_AUTO_INVOKE,
        ...(block.auto_invoke ?? {}),
      },
    };
  } catch (err) {
    console.error('[pai-pi-perspective] settings.json parse failed:', err);
    return {
      enabled: true,
      model: 'openai-codex/gpt-5.5',
      auto_invoke: DEFAULT_AUTO_INVOKE,
    };
  }
}

// ---------------------------------------------------------------------------
// Alert file (path-a verdict UX)
// ---------------------------------------------------------------------------

function alertKey(phase: Phase, generatedAt: string): string {
  return `${phase}@${generatedAt}`;
}

function appendAlert(
  workDir: string,
  phase: Phase,
  verdict: Verdict,
  summary: string,
  auditPath: string | null,
  generatedAt: string
): string {
  const file = join(workDir, ALERTS_FILE);
  const key = alertKey(phase, generatedAt);
  const entry =
    `\n## ${verdict} — ${phase} — ${generatedAt}\n` +
    `**alert_key:** \`${key}\`\n\n` +
    `${summary.trim()}\n\n` +
    (auditPath ? `**Full verdict:** ${auditPath}\n` : '') +
    `\n---\n`;
  try {
    if (!existsSync(file)) {
      const header =
        `# PiPerspective alerts\n\n` +
        `This file is appended by the \`pai-pi-perspective\` plugin whenever ` +
        `pi returns a non-PASS verdict for an Algorithm phase. Each entry ` +
        `has a unique \`alert_key\`. Once read by the model, the plugin ` +
        `marks it seen and stops re-injecting it into future turns.\n`;
      writeFileSync(file, header, 'utf-8');
    }
    appendFileSync(file, entry, 'utf-8');
  } catch (err) {
    console.error('[pai-pi-perspective] alert write failed:', err);
  }
  return key;
}

function appendRunSummary(
  workDir: string,
  phase: Phase,
  verdict: Verdict,
  summary: string,
  auditPath: string | null,
  generatedAt: string
): void {
  const file = join(workDir, RUNS_FILE);
  const entry =
    `\n## ${verdict} — ${phase} — ${generatedAt}\n\n` +
    `${summary.trim()}\n\n` +
    (auditPath ? `**Full verdict:** ${auditPath}\n` : '') +
    `\n---\n`;
  try {
    if (!existsSync(file)) {
      const header =
        `# PiPerspective runs\n\n` +
        `This file is appended by the \`pai-pi-perspective\` plugin for every ` +
        `completed pi invocation, including PASS verdicts that do not require ` +
        `next-turn interruption.\n`;
      writeFileSync(file, header, 'utf-8');
    }
    appendFileSync(file, entry, 'utf-8');
  } catch (err) {
    console.error('[pai-pi-perspective] run summary write failed:', err);
  }
}

function findAuditPathForVerdict(
  workDir: string,
  phase: Phase,
  generatedAt: string
): string | null {
  const auditDir = join(workDir, 'pi-perspective');
  if (!existsSync(auditDir)) return null;
  const base = phase.toLowerCase();
  const candidates = readdirSync(auditDir)
    .filter((file) => file === `${base}.json` || file.match(new RegExp(`^${base}\\.\\d+\\.json$`)))
    .map((file) => join(auditDir, file));
  for (const candidate of candidates) {
    try {
      const verdict = JSON.parse(readFileSync(candidate, 'utf-8'));
      if (verdict?.phase === phase && verdict?.generated_at === generatedAt) {
        return candidate;
      }
    } catch {}
  }
  return null;
}

function buildVerifyDiff(workDir: string): string {
  const auditDir = join(workDir, 'pi-perspective');
  mkdirSync(auditDir, { recursive: true });
  const diffPath = join(auditDir, 'auto-verify.diff');
  const result = spawnSync('git', ['diff', '--no-ext-diff'], {
    cwd: process.cwd(),
    encoding: 'utf-8',
    maxBuffer: 16 * 1024 * 1024,
  });
  const diff = result.status === 0
    ? result.stdout
    : `# git diff unavailable from ${process.cwd()}\n# ${result.stderr || result.error?.message || 'unknown error'}\n`;
  writeFileSync(diffPath, diff || '# No working-tree diff captured for this VERIFY phase.\n', 'utf-8');
  return diffPath;
}

// ---------------------------------------------------------------------------
// pi spawn (fire-and-forget)
// ---------------------------------------------------------------------------

function _setSpawnPiOverride(fn: typeof spawnPi | null): void {
  spawnPiOverride = fn;
}
let spawnPiOverride: typeof spawnPi | null = null;

function spawnPi(
  phase: Phase,
  isaPath: string,
  diffPath: string | undefined,
  planPath: string | undefined,
  model: string
): void {
  if (spawnPiOverride) return spawnPiOverride(phase, isaPath, diffPath, planPath, model);
  const workDir = dirname(isaPath);
  if (phase === 'VERIFY' && !diffPath) diffPath = buildVerifyDiff(workDir);
  const args = [
    'run',
    INVOKE_PI,
    '--phase',
    phase,
    '--isa',
    isaPath,
    '--model',
    model,
    '--json',
  ];
  if (phase === 'VERIFY' && diffPath) args.push('--diff', diffPath);
  if (phase === 'PLAN' && planPath) args.push('--plan', planPath);

  const child = spawn('bun', args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
    env: process.env,
  });

  let stdout = '';
  let stderr = '';
  child.stdout?.on('data', (b: Buffer) => (stdout += b.toString()));
  child.stderr?.on('data', (b: Buffer) => (stderr += b.toString()));

  child.on('close', (_code: number | null) => {
    try {
      const verdict = JSON.parse(stdout);
      const v = String(verdict.verdict) as Verdict;
      const generatedAt = String(verdict.generated_at ?? new Date().toISOString());
      const auditPath = findAuditPathForVerdict(workDir, phase, generatedAt) ??
        join(workDir, 'pi-perspective', `${phase.toLowerCase()}.json`);
      const summary = String(verdict.summary_md ?? '(no summary)');
      appendRunSummary(workDir, phase, v, summary, auditPath, generatedAt);
      if (v !== 'PASS') {
        const key = appendAlert(
          workDir,
          phase,
          v,
          summary,
          auditPath,
          generatedAt
        );
        console.error(
          `[pai-pi-perspective] ${v} verdict on ${phase} for ${isaPath} — alert ${key}`
        );
      } else {
        console.error(
          `[pai-pi-perspective] ${v} verdict on ${phase} for ${isaPath}`
        );
      }
    } catch (err) {
      console.error(
        '[pai-pi-perspective] could not parse pi verdict stdout:',
        err,
        '\nstderr was:',
        stderr.slice(0, 500)
      );
    }
  });

  child.on('error', (err: Error) => {
    console.error('[pai-pi-perspective] pi spawn error:', err);
  });

  child.unref();
}

// ---------------------------------------------------------------------------
// ISA edit handler
// ---------------------------------------------------------------------------

async function handleIsaEdit(filePath: string): Promise<void> {
  if (!filePath.includes(`${memoryWorkDir()}/`)) return;
  if (!filePath.endsWith('/' + ARTIFACT_FILENAME)) return;
  if (!existsSync(filePath)) return;

  const cfg = loadPiConfig();
  if (!cfg.enabled) return;

  const content = readFileSync(filePath, 'utf-8');
  const fm = parseFrontmatter(content);
  if (!fm) return;

  const slug = fm.slug;
  if (!slug) return;

  const rawPhase = (fm.phase ?? '').toUpperCase();
  if (rawPhase !== 'THINK' && rawPhase !== 'PLAN' && rawPhase !== 'VERIFY') {
    return;
  }
  const phase = rawPhase as Phase;

  const rawTier = (fm.tier ?? '').toUpperCase();
  if (!['E1', 'E2', 'E3', 'E4', 'E5'].includes(rawTier)) return;
  const tier = E_TO_TIER[rawTier as ETier];

  const wanted = cfg.auto_invoke[tier];
  if (!wanted.includes(phase)) return;

  const workDir = dirname(filePath);
  const state = loadSidecar(workDir);
  const key = fireKey(phase, content);

  if (state.last_fired_key === key) return;

  state.last_fired_phase = phase;
  state.last_fired_key = key;
  state.fires.push({ phase, key, started_at: new Date().toISOString() });
  saveSidecar(workDir, state);

  console.error(
    `[pai-pi-perspective] firing pi for ${phase} (tier=${rawTier}) on ${filePath}`
  );

  spawnPi(phase, filePath, undefined, undefined, cfg.model);
}

// ---------------------------------------------------------------------------
// Path-b: inject unseen alerts into next turn's system prompt
// ---------------------------------------------------------------------------

interface AlertEntry {
  key: string;
  body: string;
}

function parseAlerts(alertsPath: string): AlertEntry[] {
  if (!existsSync(alertsPath)) return [];
  const text = readFileSync(alertsPath, 'utf-8');
  const entries: AlertEntry[] = [];
  const sections = text.split(/\n## /).slice(1);
  for (const sec of sections) {
    const m = sec.match(/\*\*alert_key:\*\*\s*`([^`]+)`/);
    if (!m) continue;
    entries.push({ key: m[1], body: '## ' + sec.split('\n---')[0].trim() });
  }
  return entries;
}

/**
 * Find every WORK/<slug>/ that has both an ISA and a sidecar, then collect
 * unseen alerts. Cross-session: we don't have a session→slug map in this
 * plugin, so we inject all unseen alerts on the assumption that the user is
 * working on one Algorithm task at a time. If that turns out to be wrong,
 * we can scope to the most-recently-edited slug.
 */
function collectUnseenAlerts(): { workDir: string; alerts: AlertEntry[] }[] {
  const result: { workDir: string; alerts: AlertEntry[] }[] = [];
  let slugs: string[] = [];
  try {
    slugs = readdirSync(memoryWorkDir());
  } catch {
    return result;
  }
  for (const slug of slugs) {
    const workDir = join(memoryWorkDir(), slug);
    const alertsPath = join(workDir, ALERTS_FILE);
    if (!existsSync(alertsPath)) continue;
    const state = loadSidecar(workDir);
    const seen = new Set(state.seen_alerts);
    const all = parseAlerts(alertsPath);
    const unseen = all.filter((a) => !seen.has(a.key));
    if (unseen.length > 0) result.push({ workDir, alerts: unseen });
  }
  return result;
}

function markAlertsSeen(): void {
  let slugs: string[] = [];
  try {
    slugs = readdirSync(memoryWorkDir());
  } catch {
    return;
  }
  for (const slug of slugs) {
    const workDir = join(memoryWorkDir(), slug);
    const alertsPath = join(workDir, ALERTS_FILE);
    if (!existsSync(alertsPath)) continue;
    const state = loadSidecar(workDir);
    const seenSet = new Set(state.seen_alerts);
    const all = parseAlerts(alertsPath);
    let changed = false;
    for (const a of all) {
      if (!seenSet.has(a.key)) {
        state.seen_alerts.push(a.key);
        changed = true;
      }
    }
    if (changed) saveSidecar(workDir, state);
  }
}

// ---------------------------------------------------------------------------
// Plugin export
// ---------------------------------------------------------------------------

export const PaiPiPerspective = (async () => {
  return {
    'tool.execute.after': async (input, _output) => {
      try {
        const tool = (input as { tool?: string })?.tool;
        if (tool !== 'write' && tool !== 'edit' && tool !== 'patch' && tool !== 'apply_patch') return;
        const args = (input as { args?: Record<string, unknown> })?.args;
        const fp =
          (typeof args?.filePath === 'string' && args.filePath) ||
          (typeof args?.file_path === 'string' && args.file_path) ||
          undefined;
        if (typeof fp === 'string') await handleIsaEdit(fp);
      } catch (err) {
        console.error('[pai-pi-perspective] tool.execute.after uncaught:', err);
      }
    },

    'experimental.chat.system.transform': async (_input: any, output: any) => {
      try {
        const cfg = loadPiConfig();
        if (!cfg.enabled) return;
        const buckets = collectUnseenAlerts();
        if (buckets.length === 0) return;

        const blocks: string[] = [];
        blocks.push('<pai-pi-perspective-alerts>');
        blocks.push(
          'PiPerspective has produced non-PASS verdicts on recent phase boundaries.'
        );
        blocks.push(
          'You MUST read these before continuing. Each is keyed by `alert_key`.'
        );
        blocks.push(
          'Decide: accept, iterate, override, or abort. Do not silently ignore pi feedback.'
        );
        for (const b of buckets) {
          blocks.push(`\n### work_dir: ${b.workDir}\n`);
          for (const a of b.alerts) blocks.push(a.body);
        }
        blocks.push('</pai-pi-perspective-alerts>');
        const merged = blocks.join('\n');
        if (Array.isArray(output?.system)) {
          output.system.unshift(merged);
        }
      } catch (err) {
        console.error(
          '[pai-pi-perspective] system.transform uncaught:',
          err
        );
      }
    },

    'chat.message': async (_input, _output) => {
      try {
        markAlertsSeen();
      } catch (err) {
        console.error('[pai-pi-perspective] chat.message uncaught:', err);
      }
    },
  };
}) as Plugin & {
  __test: {
    _setSpawnPiOverride: typeof _setSpawnPiOverride;
    handleIsaEdit: typeof handleIsaEdit;
    findAuditPathForVerdict: typeof findAuditPathForVerdict;
    appendRunSummary: typeof appendRunSummary;
    appendAlert: typeof appendAlert;
  };
};

PaiPiPerspective.__test = {
  _setSpawnPiOverride,
  handleIsaEdit,
  findAuditPathForVerdict,
  appendRunSummary,
  appendAlert,
};
