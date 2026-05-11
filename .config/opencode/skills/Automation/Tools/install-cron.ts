#!/usr/bin/env bun
/**
 * install-cron.ts — Deterministic crontab generator for the PAI Automation skill.
 *
 * Reads References/cron-jobs.json and produces the PAI sentinel block.
 * The skill workflow MUST call this script instead of authoring crontab lines
 * from prose — any natural-language template can drift between runs.
 *
 * Modes:
 *   show   — print the sentinel block to stdout (default)
 *   diff   — print a unified diff of current crontab vs. what `apply` would write
 *   apply  — back up current crontab, then install the regenerated block
 */
import { $ } from "bun";

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  type: "shell" | "llm" | "skill";
  command: string;
  enabled: boolean;
  staggerSeconds: number;
  lockName: string;
  logFile: string;
  timeoutSecs?: number;
  timezone?: string;
}

interface Registry {
  managedBlockStart: string;
  managedBlockEnd: string;
  jobs: CronJob[];
}

const HOME = process.env.HOME!;
const PAI_DIR = process.env.PAI_DIR || `${HOME}/.pai`;
const SCRIPT_DIR = import.meta.dir;
const REGISTRY_PATH = `${SCRIPT_DIR}/../References/cron-jobs.json`;
const WRAPPER = `${HOME}/.opencode/skill/Automation/Tools/cron-wrapper.sh`;
const LOG_DIR = `${PAI_DIR}/logs`;
const BACKUP_DIR = `${PAI_DIR}/data`;

function expandHome(p: string): string {
  return p.startsWith("~/") ? `${HOME}${p.slice(1)}` : p;
}

function validateJob(job: CronJob): void {
  const required = ["id", "schedule", "command", "lockName", "logFile"] as const;
  for (const k of required) {
    if (!job[k]) throw new Error(`job ${job.id ?? "?"}: missing required field "${k}"`);
  }
  if (!/^[A-Za-z0-9._-]+$/.test(job.lockName)) {
    throw new Error(`job ${job.id}: lockName "${job.lockName}" has unsafe characters`);
  }
  if (job.staggerSeconds !== undefined && (!Number.isInteger(job.staggerSeconds) || job.staggerSeconds < 0)) {
    throw new Error(`job ${job.id}: staggerSeconds must be a non-negative integer`);
  }
  if (job.timeoutSecs !== undefined && (!Number.isInteger(job.timeoutSecs) || job.timeoutSecs <= 0)) {
    throw new Error(`job ${job.id}: timeoutSecs must be a positive integer`);
  }
}

function buildLine(job: CronJob): string {
  validateJob(job);
  const flags: string[] = [];
  if (job.staggerSeconds && job.staggerSeconds > 0) flags.push(`--stagger ${job.staggerSeconds}`);
  flags.push(`--lock ${job.lockName}`);

  const logPath = job.logFile.startsWith("/") ? job.logFile : `${LOG_DIR}/${job.logFile}`;
  flags.push(`--log ${logPath}`);

  if (job.timeoutSecs !== undefined) flags.push(`--timeout ${job.timeoutSecs}`);

  const cmd = expandHome(job.command);
  return `${job.schedule} ${WRAPPER} ${flags.join(" ")} -- ${cmd}`;
}

function buildBlock(reg: Registry): string {
  const lines: string[] = [reg.managedBlockStart];
  const tz = reg.jobs.find((j) => j.timezone)?.timezone;
  if (tz) lines.push(`CRON_TZ=${tz}`);
  for (const job of reg.jobs) {
    if (!job.enabled) continue;
    lines.push(buildLine(job));
  }
  lines.push(reg.managedBlockEnd);
  return lines.join("\n") + "\n";
}

async function getCurrentCrontab(): Promise<string> {
  const result = await $`crontab -l`.nothrow().quiet();
  if (result.exitCode !== 0) return "";
  return result.stdout.toString();
}

function replaceBlock(current: string, reg: Registry): string {
  const startIdx = current.indexOf(reg.managedBlockStart);
  const endIdx = current.indexOf(reg.managedBlockEnd);
  const block = buildBlock(reg);

  if (startIdx === -1 || endIdx === -1) {
    const sep = current && !current.endsWith("\n") ? "\n" : "";
    return current + sep + block;
  }

  const before = current.slice(0, startIdx);
  const afterStart = endIdx + reg.managedBlockEnd.length;
  const after = current.slice(afterStart).replace(/^\n/, "");
  return before + block + after;
}

async function loadRegistry(): Promise<Registry> {
  const reg = (await Bun.file(REGISTRY_PATH).json()) as Registry;
  if (!reg.managedBlockStart || !reg.managedBlockEnd) {
    throw new Error("registry missing managedBlockStart / managedBlockEnd");
  }
  if (!Array.isArray(reg.jobs)) throw new Error("registry.jobs must be an array");
  return reg;
}

async function cmdShow(): Promise<void> {
  const reg = await loadRegistry();
  process.stdout.write(buildBlock(reg));
}

async function cmdDiff(): Promise<void> {
  const reg = await loadRegistry();
  const current = await getCurrentCrontab();
  const next = replaceBlock(current, reg);
  await Bun.write("/tmp/.cron-current", current);
  await Bun.write("/tmp/.cron-next", next);
  await $`diff -u /tmp/.cron-current /tmp/.cron-next`.nothrow();
}

async function cmdApply(): Promise<void> {
  const reg = await loadRegistry();
  const current = await getCurrentCrontab();
  const next = replaceBlock(current, reg);

  if (current === next) {
    console.log("No changes — crontab already matches registry.");
    return;
  }

  await $`mkdir -p ${BACKUP_DIR}`.quiet();
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = `${BACKUP_DIR}/crontab-backup-${ts}.txt`;
  await Bun.write(backupPath, current);
  console.log(`Backup: ${backupPath}`);

  const proc = Bun.spawn(["crontab", "-"], {
    stdin: "pipe",
    stdout: "inherit",
    stderr: "inherit",
  });
  proc.stdin.write(next);
  proc.stdin.end();
  const code = await proc.exited;
  if (code !== 0) {
    console.error(`crontab install failed (exit ${code})`);
    process.exit(code);
  }
  console.log("Installed.");
}

const cmd = process.argv[2] ?? "show";
const handlers: Record<string, () => Promise<void>> = {
  show: cmdShow,
  diff: cmdDiff,
  apply: cmdApply,
};
const handler = handlers[cmd];
if (!handler) {
  console.error(`Unknown command: ${cmd}`);
  console.error(`Usage: install-cron.ts [show|diff|apply]`);
  process.exit(1);
}
await handler();
