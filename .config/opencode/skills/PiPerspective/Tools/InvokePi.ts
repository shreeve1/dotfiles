#!/usr/bin/env bun
/**
 * InvokePi.ts - The single shell-out boundary for PiPerspective.
 *
 * Responsibilities:
 *   1. Read PiPerspectiveConfig and respect the kill switch.
 *   2. Assert pi >= min_pi_version (via VersionCheck).
 *   3. Construct the pi flag matrix per phase (per PLAN §2.2).
 *   4. Build the user prompt by reading the workflow template + ISA + diff.
 *   5. Spawn pi with --no-context-files, --no-session, ephemeral session-dir.
 *   6. Parse stdout: try Zod -> try fenced JSON -> try bare JSON -> fallback.
 *   7. Write the resulting PiVerdict to <work_dir>/pi-perspective/<phase>.json
 *      with numeric suffix on collision.
 *   8. Print the verdict JSON to stdout for the caller.
 *
 * Per PLAN §6: every invocation passes --no-context-files; THINK/PLAN use
 * --no-tools; VERIFY uses --tools read,grep,find,ls; session is ephemeral
 * and never persisted.
 *
 * Usage:
 *   bun run InvokePi.ts --phase VERIFY --isa <path> --diff <path>
 *   bun run InvokePi.ts --phase PLAN   --isa <path> --plan <path>
 *   bun run InvokePi.ts --phase THINK  --isa <path>
 *
 * Optional flags:
 *   --model <m>          override config.model
 *   --binary <path>      pi binary path (default 'pi')
 *   --timeout <ms>       override default timeout
 *   --no-audit           skip writing <work_dir>/pi-perspective/<phase>.json
 *   --config <path>      override settings.json path
 *   --json               machine-readable stdout (just the verdict)
 */

import { spawnSync } from 'child_process';
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { dirname, join, resolve } from 'path';
import { parseArgs } from 'util';

import {
  type EffortTier, // re-exported in case callers want it
  type PiPerspectiveConfig,
  loadConfig,
} from './Config.ts';
import {
  buildFallbackVerdict,
  extractBareJson,
  extractFencedJson,
} from './ParseFallback.ts';
import {
  blockerId,
  LATEST_SCHEMA_VERSION,
  type Phase,
  type PiVerdict,
  validateVerdict,
} from './Schema.ts';
import { assertPiVersion, PiVersionError } from './VersionCheck.ts';

// ---------------------------------------------------------------------------
// Public API: invokePi
// ---------------------------------------------------------------------------

export interface InvokeRequest {
  phase: Phase;
  isaPath: string;
  diffPath?: string;
  planPath?: string;
  config?: PiPerspectiveConfig;
  /** Override pi binary (tests). */
  binary?: string;
  /** Override timeout in ms. */
  timeoutMs?: number;
  /** Skip writing audit JSON. */
  noAudit?: boolean;
  /** Override model. */
  model?: string;
}

export interface InvokeResult {
  verdict: PiVerdict;
  auditPath: string | null;
  rawStdout: string;
  rawStderr: string;
  exitCode: number;
  durationMs: number;
}

// Timeouts tuned for `verify_thinking: high` (and the matching THINK/PLAN
// thinking levels). VERIFY runs at `high` were observed in the 19-29s range
// on small diffs; larger real-world diffs are expected to exceed the prior
// 45s ceiling. THINK/PLAN are sized for the more discursive contracts.
const PHASE_DEFAULTS: Record<
  Phase,
  { timeoutMs: number; tools: string[] | null; workflowFile: string }
> = {
  THINK: { timeoutMs: 120_000, tools: null, workflowFile: 'Think.md' },
  PLAN: { timeoutMs: 180_000, tools: null, workflowFile: 'Plan.md' },
  VERIFY: {
    timeoutMs: 120_000,
    tools: ['read', 'grep', 'find', 'ls'],
    workflowFile: 'Verify.md',
  },
};

const SKILL_DIR = resolve(import.meta.dir, '..');

/**
 * Build a "kill switch tripped" stub verdict. No pi subprocess is spawned.
 */
function killSwitchStub(req: InvokeRequest, cfg: PiPerspectiveConfig): PiVerdict {
  return {
    phase: req.phase,
    verdict: 'CONCERNS',
    blockers: [],
    suggestions: [],
    summary_md:
      '**[PiPerspective kill switch]** `pi_perspective.enabled = false` in settings; ' +
      'no pi invocation was performed. Set `enabled: true` in `~/.pai/settings.json` to re-enable.',
    raw_model_id: req.model ?? cfg.model,
    schema_version: LATEST_SCHEMA_VERSION,
    generated_at: new Date().toISOString(),
  };
}

/**
 * Build the message body pi receives. The system prompt comes from the
 * workflow file (passed via --append-system-prompt). The "user" prompt is
 * the artifacts to review.
 */
function buildUserPrompt(req: InvokeRequest): string {
  if (!existsSync(req.isaPath)) {
    throw new Error(`ISA not found at ${req.isaPath}`);
  }
  const isa = readFileSync(req.isaPath, 'utf8');
  const sections: string[] = [];
  sections.push(`# ISA (Ideal State Articulation)\n\n${isa}`);

  if (req.phase === 'VERIFY') {
    if (!req.diffPath) {
      throw new Error('VERIFY phase requires --diff <path>');
    }
    if (!existsSync(req.diffPath)) {
      throw new Error(`Diff not found at ${req.diffPath}`);
    }
    const diff = readFileSync(req.diffPath, 'utf8');
    sections.push(`# Proposed Diff\n\n\`\`\`diff\n${diff}\n\`\`\``);
  } else if (req.phase === 'PLAN') {
    if (req.planPath) {
      if (!existsSync(req.planPath)) {
        throw new Error(`Plan not found at ${req.planPath}`);
      }
      const plan = readFileSync(req.planPath, 'utf8');
      sections.push(`# Drafted Plan\n\n${plan}`);
    }
  }

  sections.push(
    `# Your task\n\nReview the above and emit exactly one fenced \`json\` block ` +
      `at the end of your response, conforming to the schema described in the ` +
      `system prompt. Verdict honesty: do not manufacture concerns.`
  );
  return sections.join('\n\n---\n\n');
}

/**
 * Wave 3 / Item #9 / ISC-09. Append a single JSON line to
 * `<work_dir>/pi-perspective-stats.jsonl` describing the just-completed
 * invocation. Gated by `cfg.telemetry`; defaults to enabled. Errors are
 * logged to stderr but never propagated — telemetry must not break a
 * successful verdict path.
 */
export function appendTelemetry(opts: {
  isaPath: string;
  phase: Phase;
  verdict: PiVerdict;
  durationMs: number;
  modelId: string;
  thinking: string;
  inputChars: number;
  cfg: PiPerspectiveConfig;
}): void {
  if (opts.cfg.telemetry === false) return;
  try {
    const workDir = dirname(resolve(opts.isaPath));
    const file = join(workDir, 'pi-perspective-stats.jsonl');
    const line =
      JSON.stringify({
        phase: opts.phase,
        verdict: opts.verdict.verdict,
        duration_ms: opts.durationMs,
        model: opts.modelId,
        thinking: opts.thinking,
        input_chars: opts.inputChars,
        timestamp: new Date().toISOString(),
      }) + '\n';
    appendFileSync(file, line, 'utf-8');
  } catch (err) {
    console.error('[pi-perspective] telemetry append failed:', err);
  }
}

/**
 * Public entrypoint. Pure function over filesystem: reads ISA/diff, spawns
 * pi, parses output, writes audit file. Returns the structured result.
 */
export function invokePi(req: InvokeRequest): InvokeResult {
  const cfg = req.config ?? loadConfig();

  // Kill switch first — never spawn.
  if (!cfg.enabled) {
    const verdict = killSwitchStub(req, cfg);
    const auditPath = req.noAudit ? null : writeAudit(req.isaPath, verdict);
    return {
      verdict,
      auditPath,
      rawStdout: '',
      rawStderr: '',
      exitCode: 0,
      durationMs: 0,
    };
  }

  // Version gate.
  assertPiVersion(cfg.min_pi_version, { binary: req.binary });

  // Build the prompt artifacts.
  const userPrompt = buildUserPrompt(req);
  const systemPromptFile = join(SKILL_DIR, 'Workflows', PHASE_DEFAULTS[req.phase].workflowFile);
  if (!existsSync(systemPromptFile)) {
    throw new Error(`Workflow file missing: ${systemPromptFile}`);
  }

  // Ephemeral session dir — never persisted.
  const sessionDir = mkdtempSync(join(tmpdir(), `pi-perspective-${req.phase.toLowerCase()}-`));

  // Build the flag list per PLAN §2.2.
  const phaseCfg = PHASE_DEFAULTS[req.phase];
  const args: string[] = [
    '-p',
    '--no-session',
    '--session-dir',
    sessionDir,
    '--no-context-files',
    '--no-extensions',
    '--no-skills',
    '--no-prompt-templates',
    '--append-system-prompt',
    systemPromptFile,
    '--model',
    req.model ?? cfg.model,
  ];

  if (phaseCfg.tools === null) {
    args.push('--no-tools');
  } else {
    args.push('--tools', phaseCfg.tools.join(','));
  }

  // Pass thinking level per phase (Wave 3 / Item #8 / ISC-08). Each phase
  // has its own config key so operators can dial THINK/PLAN independently
  // of VERIFY without changing the model id suffix.
  const thinkingLevel =
    req.phase === 'VERIFY'
      ? cfg.verify_thinking
      : req.phase === 'PLAN'
      ? cfg.plan_thinking
      : cfg.think_thinking;
  if (thinkingLevel) {
    args.push('--thinking', thinkingLevel);
  }

  // Note: pi 0.74.0's `--mode json` emits structured session EVENT NDJSON
  // (one line per agent_start/message_start/message_end/turn_end/...), not a
  // single JSON verdict. The wrapper's parser expects text-mode output where
  // the model emits a fenced ```json``` block (see Workflows/*.md). Passing
  // `--mode json` here breaks parsing for every verdict — confirmed via live
  // A/B against the agent-team-timer fixture on 2026-05-19. Leave the flag
  // off; rely on the model to honor the JSON contract from the workflow
  // prompt, then parse with extractFencedJson/extractBareJson.

  const timeoutMs = req.timeoutMs ?? phaseCfg.timeoutMs;
  const bin = req.binary ?? 'pi';
  const t0 = Date.now();
  const result = spawnSync(bin, args, {
    input: userPrompt,
    encoding: 'utf8',
    timeout: timeoutMs,
    maxBuffer: 16 * 1024 * 1024,
  });
  const durationMs = Date.now() - t0;
  // Surface the latency margin so the next ceiling is visible before it bites.
  console.error(
    `[pi-perspective] ${req.phase} duration=${durationMs}ms timeout=${timeoutMs}ms`
  );

  const rawStdout = result.stdout ?? '';
  const rawStderr = result.stderr ?? '';

  const modelId = req.model ?? cfg.model;
  if (result.error) {
    const verdict = buildFallbackVerdict({
      phase: req.phase,
      rawStdout,
      modelId,
      reason: `spawn error: ${result.error.message}`,
    });
    const auditPath = req.noAudit ? null : writeAudit(req.isaPath, verdict);
    appendTelemetry({
      isaPath: req.isaPath,
      phase: req.phase,
      verdict,
      durationMs,
      modelId,
      thinking: thinkingLevel ?? '',
      inputChars: userPrompt.length,
      cfg,
    });
    return { verdict, auditPath, rawStdout, rawStderr, exitCode: -1, durationMs };
  }

  // Try to parse a verdict out of stdout.
  let verdict: PiVerdict;
  const candidate = extractFencedJson(rawStdout) ?? extractBareJson(rawStdout);
  if (candidate) {
    // Force phase + schema_version + generated_at + raw_model_id even if pi
    // omitted them or got them wrong.
    const enriched = enrichVerdict(candidate, req.phase, modelId);
    const v = validateVerdict(enriched);
    if (v.ok) {
      verdict = v.value;
    } else {
      verdict = buildFallbackVerdict({
        phase: req.phase,
        rawStdout,
        modelId,
        reason: `schema validation failed: ${v.error.issues
          .slice(0, 3)
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; ')}`,
      });
      console.error(
        `WARN PiPerspective: schema parse failed, used fallback (${v.error.issues.length} issues)`
      );
    }
  } else {
    verdict = buildFallbackVerdict({
      phase: req.phase,
      rawStdout,
      modelId,
      reason: 'no JSON block found in pi stdout',
    });
    console.error('WARN PiPerspective: no JSON block in pi stdout, used fallback');
  }

  const auditPath = req.noAudit ? null : writeAudit(req.isaPath, verdict);
  appendTelemetry({
    isaPath: req.isaPath,
    phase: req.phase,
    verdict,
    durationMs,
    modelId,
    thinking: thinkingLevel ?? '',
    inputChars: userPrompt.length,
    cfg,
  });
  return {
    verdict,
    auditPath,
    rawStdout,
    rawStderr,
    exitCode: result.status ?? -1,
    durationMs,
  };
}

/**
 * Ensure required derived fields are present and consistent with what we
 * actually invoked. pi may omit `phase` or `raw_model_id` — we always know
 * those server-side, so fill them in.
 */
function enrichVerdict(obj: any, phase: Phase, modelId: string): any {
  const out = { ...obj };
  out.phase = phase;
  // Wave 4 / ISC-13: emit at the current latest schema_version. The Zod
  // schema accepts the union 1|2, and SchemaMigrate forward-migrates any
  // legacy v1 verdicts already on disk.
  out.schema_version = LATEST_SCHEMA_VERSION;
  if (!out.generated_at) out.generated_at = new Date().toISOString();
  if (!out.raw_model_id) out.raw_model_id = modelId;
  if (!Array.isArray(out.blockers)) out.blockers = [];
  if (!Array.isArray(out.suggestions)) out.suggestions = [];
  // Re-hash blocker IDs deterministically.
  out.blockers = out.blockers.map((b: any) => ({
    ...b,
    id: blockerId(phase, b?.summary ?? ''),
  }));
  return out;
}

/**
 * Write the verdict to <work_dir>/pi-perspective/<phase>.json. If that file
 * already exists, append a numeric suffix (verify.2.json, verify.3.json, ...).
 *
 * Returns the absolute path written.
 */
export function writeAudit(isaPath: string, verdict: PiVerdict): string {
  const workDir = dirname(resolve(isaPath));
  const auditDir = join(workDir, 'pi-perspective');
  if (!existsSync(auditDir)) mkdirSync(auditDir, { recursive: true });
  const base = verdict.phase.toLowerCase();
  let target = join(auditDir, `${base}.json`);
  if (existsSync(target)) {
    let n = 2;
    while (existsSync(join(auditDir, `${base}.${n}.json`))) n++;
    target = join(auditDir, `${base}.${n}.json`);
  }
  writeFileSync(target, JSON.stringify(verdict, null, 2));
  return target;
}

// ---------------------------------------------------------------------------
// CLI entrypoint
// ---------------------------------------------------------------------------
if (import.meta.main) {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      phase: { type: 'string' },
      isa: { type: 'string' },
      diff: { type: 'string' },
      plan: { type: 'string' },
      model: { type: 'string' },
      binary: { type: 'string' },
      timeout: { type: 'string' },
      'no-audit': { type: 'boolean' },
      config: { type: 'string' },
      json: { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
    },
    strict: true,
  });

  if (values.help) {
    console.log(
      `Usage: bun run InvokePi.ts --phase <THINK|PLAN|VERIFY> --isa <path> [--diff <path>] [--plan <path>]\n` +
        `Optional: --model <m> --binary <pi> --timeout <ms> --no-audit --config <path> --json`
    );
    process.exit(0);
  }

  const phase = (values.phase ?? '').toUpperCase() as Phase;
  if (!['THINK', 'PLAN', 'VERIFY'].includes(phase)) {
    console.error(`--phase must be one of THINK | PLAN | VERIFY (got "${values.phase ?? ''}")`);
    process.exit(2);
  }
  if (!values.isa) {
    console.error('--isa <path> is required');
    process.exit(2);
  }

  try {
    const cfg = values.config ? loadConfig({ path: values.config }) : loadConfig();
    const res = invokePi({
      phase,
      isaPath: values.isa,
      diffPath: values.diff,
      planPath: values.plan,
      model: values.model,
      binary: values.binary,
      timeoutMs: values.timeout ? Number.parseInt(values.timeout, 10) : undefined,
      noAudit: Boolean(values['no-audit']),
      config: cfg,
    });

    if (values.json) {
      // Machine-readable: just the verdict.
      process.stdout.write(JSON.stringify(res.verdict, null, 2) + '\n');
    } else {
      // Human-readable: verdict + audit path + timing.
      process.stdout.write(JSON.stringify(res.verdict, null, 2) + '\n');
      if (res.auditPath) console.error(`audit: ${res.auditPath}`);
      console.error(`pi exit=${res.exitCode} duration=${res.durationMs}ms`);
    }

    // Exit code policy: 0 on PASS/CONCERNS, 1 on FAIL/REFRAME so CI can gate.
    const failing = res.verdict.verdict === 'FAIL' || res.verdict.verdict === 'REFRAME';
    process.exit(failing ? 1 : 0);
  } catch (e) {
    if (e instanceof PiVersionError) {
      console.error(`pi version check failed: ${e.message}`);
      process.exit(3);
    }
    console.error(`PiPerspective error: ${(e as Error).message}`);
    process.exit(4);
  }
}
