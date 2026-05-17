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
 *
 * Add `--only job-id-a,job-id-b` to show/diff/apply only selected jobs while
 * preserving unrelated existing managed-block lines byte-for-byte.
 */
import { $ } from "bun";

export interface CronJob {
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

export interface Registry {
  managedBlockStart: string;
  managedBlockEnd: string;
  jobs: CronJob[];
}

const SCRIPT_DIR = import.meta.dir;
const REGISTRY_PATH = `${SCRIPT_DIR}/../References/cron-jobs.json`;

export interface CronGeneratorPaths {
  home: string;
  paiDir: string;
  wrapper: string;
  logDir: string;
  backupDir: string;
}

export function buildCronGeneratorPaths(env: Record<string, string | undefined> = process.env): CronGeneratorPaths {
  const home = env.HOME;
  if (!home) throw new Error("HOME is required to generate PAI cron lines");
  const paiDir = env.PAI_DIR || `${home}/.pai`;
  return {
    home,
    paiDir,
    wrapper: `${home}/.config/opencode/skills/Automation/Tools/cron-wrapper.sh`,
    logDir: `${paiDir}/logs`,
    backupDir: `${paiDir}/data`,
  };
}

function expandHome(p: string, home: string): string {
  return p.startsWith("~/") ? `${home}${p.slice(1)}` : p;
}

export function validateJob(job: CronJob): void {
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

export function buildLine(job: CronJob, paths: CronGeneratorPaths = buildCronGeneratorPaths()): string {
  validateJob(job);
  const flags: string[] = [];
  if (job.staggerSeconds && job.staggerSeconds > 0) flags.push(`--stagger ${job.staggerSeconds}`);
  flags.push(`--lock ${job.lockName}`);

  const logPath = job.logFile.startsWith("/") ? job.logFile : `${paths.logDir}/${job.logFile}`;
  flags.push(`--log ${logPath}`);

  if (job.timeoutSecs !== undefined) flags.push(`--timeout ${job.timeoutSecs}`);

  const cmd = expandHome(job.command, paths.home);
  return `${job.schedule} ${paths.wrapper} ${flags.join(" ")} -- ${cmd}`;
}

export function buildBlock(reg: Registry, paths: CronGeneratorPaths = buildCronGeneratorPaths()): string {
  const lines: string[] = [reg.managedBlockStart];
  const tz = reg.jobs.find((j) => j.enabled && j.timezone)?.timezone;
  if (tz) lines.push(`CRON_TZ=${tz}`);
  for (const job of reg.jobs) {
    if (!job.enabled) continue;
    lines.push(buildLine(job, paths));
  }
  lines.push(reg.managedBlockEnd);
  return lines.join("\n") + "\n";
}

export function selectJobsByIds(reg: Registry, jobIds: string[]): CronJob[] {
  if (jobIds.length === 0) throw new Error("--only requires at least one job id");
  const byId = new Map(reg.jobs.map((job) => [job.id, job]));
  const missing = jobIds.filter((id) => !byId.has(id));
  if (missing.length > 0) throw new Error(`unknown job id(s): ${missing.join(", ")}`);
  return jobIds.map((id) => byId.get(id)!);
}

export function assertScopedLocksAreExclusive(reg: Registry, selectedJobs: CronJob[]): void {
  const selectedIds = new Set(selectedJobs.map((job) => job.id));
  const selectedLocks = new Set(selectedJobs.map((job) => job.lockName));
  for (const lockName of selectedLocks) {
    const sameLock = reg.jobs.filter((job) => job.lockName === lockName);
    const omitted = sameLock.filter((job) => !selectedIds.has(job.id));
    if (omitted.length > 0) {
      throw new Error(
        `--only cannot select lock "${lockName}" partially; include all jobs sharing this lock: ${sameLock.map((job) => job.id).join(", ")}`,
      );
    }
  }
}

function lineHasLock(line: string, lockName: string): boolean {
  const escaped = lockName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|\\s)--lock\\s+${escaped}(?:\\s|$)`).test(line);
}

function lineMatchesAnyJobLock(line: string, jobs: CronJob[]): boolean {
  return jobs.some((job) => lineHasLock(line, job.lockName));
}

async function getCurrentCrontab(): Promise<string> {
  const result = await $`crontab -l`.nothrow().quiet();
  if (result.exitCode !== 0) return "";
  return result.stdout.toString();
}

export function replaceBlock(current: string, reg: Registry, paths: CronGeneratorPaths = buildCronGeneratorPaths()): string {
  const startIdx = current.indexOf(reg.managedBlockStart);
  const endIdx = current.indexOf(reg.managedBlockEnd);
  const block = buildBlock(reg, paths);

  if (startIdx === -1 || endIdx === -1) {
    const sep = current && !current.endsWith("\n") ? "\n" : "";
    return current + sep + block;
  }

  const before = current.slice(0, startIdx);
  const afterStart = endIdx + reg.managedBlockEnd.length;
  const after = current.slice(afterStart).replace(/^\n/, "");
  return before + block + after;
}

export function replaceBlockScoped(
  current: string,
  reg: Registry,
  jobIds: string[],
  paths: CronGeneratorPaths = buildCronGeneratorPaths(),
): string {
  const targetJobs = selectJobsByIds(reg, [...new Set(jobIds)]);
  assertScopedLocksAreExclusive(reg, targetJobs);
  const startIdx = current.indexOf(reg.managedBlockStart);
  const endIdx = current.indexOf(reg.managedBlockEnd);

  if (startIdx === -1 || endIdx === -1) {
    const sep = current && !current.endsWith("\n") ? "\n" : "";
    return current + sep + buildBlock({ ...reg, jobs: targetJobs }, paths);
  }

  const before = current.slice(0, startIdx);
  const afterStart = endIdx + reg.managedBlockEnd.length;
  const after = current.slice(afterStart).replace(/^\n/, "");
  const currentBlock = current.slice(startIdx, afterStart);
  const lines = currentBlock.split("\n");
  const body = lines.slice(1, -1);
  const generatedTargetLines = targetJobs.filter((job) => job.enabled).map((job) => buildLine(job, paths));
  const keptBody: string[] = [];
  let firstRemovedIndex: number | null = null;

  for (const line of body) {
    if (lineMatchesAnyJobLock(line, targetJobs)) {
      if (firstRemovedIndex === null) firstRemovedIndex = keptBody.length;
      continue;
    }
    keptBody.push(line);
  }

  const targetTz = targetJobs.find((job) => job.enabled && job.timezone)?.timezone;
  if (targetTz && !keptBody.some((line) => line.startsWith("CRON_TZ="))) {
    keptBody.unshift(`CRON_TZ=${targetTz}`);
    if (firstRemovedIndex !== null) firstRemovedIndex += 1;
  }

  const insertAt = firstRemovedIndex === null ? keptBody.length : Math.min(firstRemovedIndex, keptBody.length);
  keptBody.splice(insertAt, 0, ...generatedTargetLines);

  const nextBlock = [reg.managedBlockStart, ...keptBody, reg.managedBlockEnd].join("\n") + "\n";
  return before + nextBlock + after;
}

async function loadRegistry(): Promise<Registry> {
  const reg = (await Bun.file(REGISTRY_PATH).json()) as Registry;
  if (!reg.managedBlockStart || !reg.managedBlockEnd) {
    throw new Error("registry missing managedBlockStart / managedBlockEnd");
  }
  if (!Array.isArray(reg.jobs)) throw new Error("registry.jobs must be an array");
  return reg;
}

interface CliOptions {
  onlyJobIds?: string[];
}

function parseCliOptions(args: string[]): CliOptions {
  const options: CliOptions = {};
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--only") {
      const value = args[i + 1];
      if (!value) throw new Error("--only requires a comma-separated job id list");
      options.onlyJobIds = value.split(",").map((id) => id.trim()).filter(Boolean);
      i += 1;
      continue;
    }
    if (arg.startsWith("--only=")) {
      options.onlyJobIds = arg.slice("--only=".length).split(",").map((id) => id.trim()).filter(Boolean);
      continue;
    }
    throw new Error(`Unknown option: ${arg}`);
  }
  return options;
}

function nextCrontab(current: string, reg: Registry, paths: CronGeneratorPaths, options: CliOptions): string {
  if (options.onlyJobIds) return replaceBlockScoped(current, reg, options.onlyJobIds, paths);
  return replaceBlock(current, reg, paths);
}

async function cmdShow(options: CliOptions): Promise<void> {
  const reg = await loadRegistry();
  if (options.onlyJobIds) {
    process.stdout.write(buildBlock({ ...reg, jobs: selectJobsByIds(reg, options.onlyJobIds) }));
    return;
  }
  process.stdout.write(buildBlock(reg));
}

async function cmdDiff(options: CliOptions): Promise<void> {
  const reg = await loadRegistry();
  const current = await getCurrentCrontab();
  const next = nextCrontab(current, reg, buildCronGeneratorPaths(), options);
  await Bun.write("/tmp/.cron-current", current);
  await Bun.write("/tmp/.cron-next", next);
  await $`diff -u /tmp/.cron-current /tmp/.cron-next`.nothrow();
}

async function cmdApply(options: CliOptions): Promise<void> {
  const reg = await loadRegistry();
  const current = await getCurrentCrontab();
  const paths = buildCronGeneratorPaths();
  const next = nextCrontab(current, reg, paths, options);

  if (current === next) {
    console.log("No changes — crontab already matches registry.");
    return;
  }

  await $`mkdir -p ${paths.backupDir}`.quiet();
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = `${paths.backupDir}/crontab-backup-${ts}.txt`;
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

if (import.meta.main) {
  const cmd = process.argv[2] ?? "show";
  const handlers: Record<string, (options: CliOptions) => Promise<void>> = {
    show: cmdShow,
    diff: cmdDiff,
    apply: cmdApply,
  };
  const handler = handlers[cmd];
  if (!handler) {
    console.error(`Unknown command: ${cmd}`);
    console.error(`Usage: install-cron.ts [show|diff|apply] [--only job-id-a,job-id-b]`);
    process.exit(1);
  }
  try {
    await handler(parseCliOptions(process.argv.slice(3)));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
