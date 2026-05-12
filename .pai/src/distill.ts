import { appendFileSync, closeSync, existsSync, mkdirSync, openSync, readFileSync, renameSync, statSync, writeFileSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { CanonicalEventStore, type CanonicalEventEnvelope } from "./event-store";
import { CanonicalMemoryStore, type MemoryRecord, type ProposedMemoryInput, type ReviewQueueItem } from "./memory-store";
import { buildRuntimePaths } from "./runtime-paths";
import {
  DREAM_PIPELINE_VERSION,
  resolveDreamProvider,
  type DreamProviderEnablement,
  type DreamProviderName,
  type DreamProvider,
  DeterministicDreamProvider,
  LocalRulesDreamProvider,
  assertDreamEventIsRedacted,
} from "./dream-pipeline";

export const DISTILL_DEFAULT_DEBOUNCE_SECONDS = 60;
export const DISTILL_LOG_ROTATION_BYTES = 1024 * 1024;
export const DISTILL_LOCK_BUSY_EXIT = "skipped_lock_held" as const;

export type DistillStatus = "ran" | "debounced" | "skipped_lock_held" | "dry_run";

export type DistillSkippedEntry =
  | { event_id: string; reason: "already_proposed"; memory_id: string }
  | { event_id: string; reason: "pipeline_skipped"; detail: string };

export type DistillProposedEntry = {
  event_id: string;
  memory_id: string;
};

export type WatermarkCursor = {
  last_sequence: number;
  last_run_at: string;
};

export type WatermarkFile = {
  [harness: string]: {
    [provider: string]: {
      [paiSessionId: string]: WatermarkCursor;
    };
  };
};

export type DistillOptions = {
  runtimeHome?: string;
  provider?: DreamProviderName;
  providerEnablement?: DreamProviderEnablement;
  projectId?: string;
  sinceTimestamp?: string;
  dryRun?: boolean;
  quiet?: boolean;
  debounceSeconds?: number;
  now?: string;
  harnessFilter?: string;
};

export type DistillSummary = {
  status: DistillStatus;
  provider: string;
  proposed: DistillProposedEntry[];
  skipped: DistillSkippedEntry[];
  watermark_before: WatermarkFile;
  watermark_after: WatermarkFile;
  dry_run: boolean;
  debounce_window_seconds: number;
};

export class DistillLockHeldError extends Error {
  constructor() {
    super("distill lock is currently held by another process");
    this.name = "DistillLockHeldError";
  }
}

export type DistillRuntimeFiles = {
  watermarkPath: string;
  debouncePath: string;
  lockPath: string;
  logPath: string;
  rotatedLogPath: string;
};

export function distillRuntimeFiles(runtimeHome?: string): DistillRuntimeFiles {
  const paths = buildRuntimePaths(runtimeHome);
  return {
    watermarkPath: join(paths.stateDir, "distill-watermark.json"),
    debouncePath: join(paths.stateDir, "distill-debounce.json"),
    lockPath: join(paths.stateDir, "distill.lock"),
    logPath: join(paths.logsDir, "distill.log"),
    rotatedLogPath: join(paths.logsDir, "distill.log.1"),
  };
}

export function readWatermarkFile(runtimeHome?: string): WatermarkFile {
  const { watermarkPath } = distillRuntimeFiles(runtimeHome);
  if (!existsSync(watermarkPath)) return {};
  try {
    return JSON.parse(readFileSync(watermarkPath, "utf8")) as WatermarkFile;
  } catch {
    return {};
  }
}

export function writeWatermarkFile(value: WatermarkFile, runtimeHome?: string) {
  const { watermarkPath } = distillRuntimeFiles(runtimeHome);
  mkdirSync(dirname(watermarkPath), { recursive: true });
  const tmpPath = `${watermarkPath}.tmp`;
  writeFileSync(tmpPath, JSON.stringify(value, null, 2));
  renameSync(tmpPath, watermarkPath);
}

export function readDebounceFile(runtimeHome?: string): { last_run_at?: string } {
  const { debouncePath } = distillRuntimeFiles(runtimeHome);
  if (!existsSync(debouncePath)) return {};
  try {
    return JSON.parse(readFileSync(debouncePath, "utf8")) as { last_run_at?: string };
  } catch {
    return {};
  }
}

export function writeDebounceFile(now: string, runtimeHome?: string) {
  const { debouncePath } = distillRuntimeFiles(runtimeHome);
  mkdirSync(dirname(debouncePath), { recursive: true });
  writeFileSync(debouncePath, JSON.stringify({ last_run_at: now }));
}

export function appendDistillLog(message: string, runtimeHome?: string) {
  const { logPath, rotatedLogPath } = distillRuntimeFiles(runtimeHome);
  mkdirSync(dirname(logPath), { recursive: true });
  if (existsSync(logPath)) {
    try {
      const size = statSync(logPath).size;
      if (size >= DISTILL_LOG_ROTATION_BYTES) {
        renameSync(logPath, rotatedLogPath);
      }
    } catch {
      // ignore stat errors; we'll append below
    }
  }
  appendFileSync(logPath, `${message}\n`, "utf8");
}

type LockHandle = {
  release: () => void;
};

export function tryAcquireDistillLock(runtimeHome?: string): LockHandle | null {
  const { lockPath } = distillRuntimeFiles(runtimeHome);
  mkdirSync(dirname(lockPath), { recursive: true });
  try {
    const fd = openSync(lockPath, "wx");
    closeSync(fd);
    return {
      release: () => {
        try {
          unlinkSync(lockPath);
        } catch {
          // ignore release errors
        }
      },
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") return null;
    throw error;
  }
}

export function inDebounceWindow(now: string, windowSeconds: number, runtimeHome?: string): boolean {
  const file = readDebounceFile(runtimeHome);
  if (!file.last_run_at) return false;
  const last = Date.parse(file.last_run_at);
  const current = Date.parse(now);
  if (Number.isNaN(last) || Number.isNaN(current)) return false;
  return current - last < windowSeconds * 1000;
}

export function buildSessionCursors(watermark: WatermarkFile, provider: string, harnessFilter?: string): Record<string, number> {
  const cursors: Record<string, number> = {};
  for (const [harness, byProvider] of Object.entries(watermark)) {
    if (harnessFilter && harness !== harnessFilter) continue;
    const sessions = byProvider?.[provider];
    if (!sessions) continue;
    for (const [paiSessionId, cursor] of Object.entries(sessions)) {
      cursors[paiSessionId] = cursor.last_sequence;
    }
  }
  return cursors;
}

export function advanceWatermark(
  watermark: WatermarkFile,
  provider: string,
  events: CanonicalEventEnvelope[],
  now: string,
): WatermarkFile {
  const next: WatermarkFile = JSON.parse(JSON.stringify(watermark));
  for (const event of events) {
    const harness = event.harness;
    next[harness] ??= {};
    next[harness][provider] ??= {};
    const existing = next[harness][provider][event.pai_session_id];
    if (!existing || event.sequence > existing.last_sequence) {
      next[harness][provider][event.pai_session_id] = {
        last_sequence: event.sequence,
        last_run_at: now,
      };
    }
  }
  return next;
}

export function resolveDistillProvider(name: DreamProviderName, enablement?: DreamProviderEnablement): DreamProvider {
  if (name === "claude-inference") {
    return resolveDreamProvider("claude-inference", enablement);
  }
  if (name === "deterministic") return new DeterministicDreamProvider();
  return new LocalRulesDreamProvider();
}

export type DistillContext = {
  memoryStore: CanonicalMemoryStore;
  eventStore: CanonicalEventStore;
};

export function runDistill(context: DistillContext, options: DistillOptions = {}): DistillSummary {
  const provider = resolveDistillProvider(options.provider ?? "local", options.providerEnablement);
  const now = options.now ?? new Date().toISOString();
  const dryRun = options.dryRun === true;
  const debounceSeconds = options.debounceSeconds ?? Number.parseInt(process.env.PAI_DISTILL_DEBOUNCE_SECONDS ?? `${DISTILL_DEFAULT_DEBOUNCE_SECONDS}`, 10);
  const watermarkBefore = readWatermarkFile(options.runtimeHome);

  if (!dryRun && inDebounceWindow(now, debounceSeconds, options.runtimeHome)) {
    return {
      status: "debounced",
      provider: provider.name,
      proposed: [],
      skipped: [],
      watermark_before: watermarkBefore,
      watermark_after: watermarkBefore,
      dry_run: false,
      debounce_window_seconds: debounceSeconds,
    };
  }

  const cursors = options.sinceTimestamp !== undefined ? {} : buildSessionCursors(watermarkBefore, provider.name, options.harnessFilter);
  let events = context.eventStore.listEventsForDistill({
    sinceTimestamp: options.sinceTimestamp,
    sessionCursors: cursors,
  });
  if (options.harnessFilter) {
    events = events.filter((event) => event.harness === options.harnessFilter);
  }

  const proposed: DistillProposedEntry[] = [];
  const skipped: DistillSkippedEntry[] = [];

  if (provider.mode === "external-inference") {
    if (!options.providerEnablement || !options.providerEnablement.enabled || !options.providerEnablement.explicit_user_approval) {
      throw new Error(`${provider.name} provider requires explicit user approval before use`);
    }
  }

  const safeEvents: CanonicalEventEnvelope[] = [];
  for (const event of events) {
    try {
      assertDreamEventIsRedacted(event);
      safeEvents.push(event);
    } catch (error) {
      skipped.push({ event_id: event.event_id, reason: "pipeline_skipped", detail: error instanceof Error ? error.message : String(error) });
    }
  }

  const candidates = safeEvents.length > 0 ? provider.distill(safeEvents, { projectId: options.projectId, now }) : [];

  for (const candidate of candidates) {
    const sourceEventId = candidate.source_event_ids[0] ?? "";
    if (dryRun) {
      const existing = context.memoryStore.getMemory(candidate.memory_id);
      if (existing) {
        skipped.push({ event_id: sourceEventId, reason: "already_proposed", memory_id: candidate.memory_id });
      } else {
        proposed.push({ event_id: sourceEventId, memory_id: candidate.memory_id });
      }
      continue;
    }

    const input: ProposedMemoryInput = {
      memory_id: candidate.memory_id,
      type: candidate.type,
      scope: candidate.scope,
      source_event_ids: candidate.source_event_ids,
      provenance: {
        ...candidate.provenance,
        dream_provider: provider.name,
        dream_mode: provider.mode,
        dream_pipeline_version: DREAM_PIPELINE_VERSION,
      },
      confidence: candidate.confidence,
      assertion_type: candidate.assertion_type,
      trust_level: candidate.trust_level,
      review_status: "proposed",
      content: candidate.content,
      expires_at: candidate.expires_at,
      revalidation_rule: candidate.revalidation_rule,
    };

    const result = context.memoryStore.proposeMemoryIfMissing(
      input,
      {
        review_id: `review:${candidate.memory_id}`,
        proposed_diff: candidate.proposed_diff ?? `+ ${candidate.content}`,
      },
      now,
    );

    if (result.status === "proposed") {
      proposed.push({ event_id: sourceEventId, memory_id: result.memory.memory_id });
    } else {
      skipped.push({ event_id: sourceEventId, reason: "already_proposed", memory_id: result.memory_id });
    }
  }

  let watermarkAfter = watermarkBefore;
  if (!dryRun) {
    if (options.sinceTimestamp === undefined) {
      watermarkAfter = advanceWatermark(watermarkBefore, provider.name, safeEvents, now);
      writeWatermarkFile(watermarkAfter, options.runtimeHome);
    }
    writeDebounceFile(now, options.runtimeHome);
  }

  return {
    status: dryRun ? "dry_run" : "ran",
    provider: provider.name,
    proposed,
    skipped,
    watermark_before: watermarkBefore,
    watermark_after: watermarkAfter,
    dry_run: dryRun,
    debounce_window_seconds: debounceSeconds,
  };
}

export type DistillEntryPointOptions = DistillOptions & {
  acquireLock?: boolean;
};

export function distillWithLock(options: DistillEntryPointOptions = {}): DistillSummary {
  const dryRun = options.dryRun === true;
  const wantsLock = options.acquireLock !== false && !dryRun;
  const lock = wantsLock ? tryAcquireDistillLock(options.runtimeHome) : null;
  if (wantsLock && lock === null) {
    const watermarkBefore = readWatermarkFile(options.runtimeHome);
    return {
      status: "skipped_lock_held",
      provider: options.provider ?? "local",
      proposed: [],
      skipped: [],
      watermark_before: watermarkBefore,
      watermark_after: watermarkBefore,
      dry_run: false,
      debounce_window_seconds: options.debounceSeconds ?? DISTILL_DEFAULT_DEBOUNCE_SECONDS,
    };
  }

  const memoryStore = new CanonicalMemoryStore({ runtimeHome: options.runtimeHome });
  const eventStore = new CanonicalEventStore({ runtimeHome: options.runtimeHome });
  try {
    return runDistill({ memoryStore, eventStore }, options);
  } catch (error) {
    appendDistillLog(`${new Date().toISOString()} ${error instanceof Error ? error.message : String(error)}`, options.runtimeHome);
    throw error;
  } finally {
    memoryStore.close();
    eventStore.close();
    lock?.release();
  }
}

export type ReviewPendingItem = {
  review_id: string;
  memory_id: string;
  memory_type: string;
  scope: string;
  created_at: string;
  age_days: number;
  stale: boolean;
};

export type WatermarkAge = {
  harness: string;
  provider: string;
  pai_session_id: string;
  last_run_at: string;
  age_days: number;
};

export type ReviewPendingSummary = {
  total: number;
  by_type: Record<string, number>;
  stale_threshold_days: number;
  stale: ReviewPendingItem[];
  items: ReviewPendingItem[];
  watermark_age: WatermarkAge[];
};

export function reviewPending(options: { runtimeHome?: string; now?: string; staleDays?: number } = {}): ReviewPendingSummary {
  const now = options.now ?? new Date().toISOString();
  const staleDays = options.staleDays ?? Number.parseInt(process.env.PAI_REVIEW_STALE_DAYS ?? "14", 10);
  const store = new CanonicalMemoryStore({ runtimeHome: options.runtimeHome });
  let items: ReviewPendingItem[] = [];
  const byType: Record<string, number> = {};
  try {
    const queue = store.listReviewQueue("proposed");
    for (const review of queue) {
      const memory = store.getMemory(review.memory_id);
      const ageDays = ageInDays(review.created_at, now);
      const item: ReviewPendingItem = {
        review_id: review.review_id,
        memory_id: review.memory_id,
        memory_type: memory?.type ?? "unknown",
        scope: memory?.scope ?? "unknown",
        created_at: review.created_at,
        age_days: ageDays,
        stale: ageDays >= staleDays,
      };
      items.push(item);
      const key = item.memory_type;
      byType[key] = (byType[key] ?? 0) + 1;
    }
  } finally {
    store.close();
  }

  const watermark = readWatermarkFile(options.runtimeHome);
  const watermarkAge: WatermarkAge[] = [];
  for (const [harness, byProvider] of Object.entries(watermark)) {
    for (const [provider, sessions] of Object.entries(byProvider)) {
      for (const [paiSessionId, cursor] of Object.entries(sessions)) {
        watermarkAge.push({
          harness,
          provider,
          pai_session_id: paiSessionId,
          last_run_at: cursor.last_run_at,
          age_days: ageInDays(cursor.last_run_at, now),
        });
      }
    }
  }

  return {
    total: items.length,
    by_type: byType,
    stale_threshold_days: staleDays,
    stale: items.filter((item) => item.stale),
    items,
    watermark_age: watermarkAge,
  };
}

export function autoExportOnAcceptEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.PAI_AUTO_EXPORT_ON_ACCEPT === "1";
}

export type AutoExportOutcome =
  | { status: "exported"; output: string; recordCount: number; redactionFindings: unknown[] }
  | { status: "skipped_lock_held"; output: string }
  | { status: "skipped_disabled" };

export function autoExportAfterAccept(options: { runtimeHome?: string; output: string; env?: Record<string, string | undefined> }): AutoExportOutcome {
  const env = options.env ?? process.env;
  if (!autoExportOnAcceptEnabled(env)) return { status: "skipped_disabled" };
  const lock = waitForDistillLock(options.runtimeHome, 2000);
  if (!lock) {
    appendDistillLog(`${new Date().toISOString()} auto-export skipped: lock held`, options.runtimeHome);
    return { status: "skipped_lock_held", output: options.output };
  }
  const store = new CanonicalMemoryStore({ runtimeHome: options.runtimeHome });
  try {
    const result = store.exportPortableMemories({});
    mkdirSync(dirname(options.output), { recursive: true });
    const tmpPath = `${options.output}.tmp`;
    writeFileSync(tmpPath, `${JSON.stringify(result.document, null, 2)}\n`);
    renameSync(tmpPath, options.output);
    return {
      status: "exported",
      output: options.output,
      recordCount: result.document.memories.length,
      redactionFindings: result.findings.redaction,
    };
  } finally {
    store.close();
    lock.release();
  }
}

function waitForDistillLock(runtimeHome: string | undefined, budgetMs: number): LockHandle | null {
  const deadline = Date.now() + budgetMs;
  while (Date.now() < deadline) {
    const lock = tryAcquireDistillLock(runtimeHome);
    if (lock) return lock;
    const remaining = deadline - Date.now();
    const sleep = Math.min(100, Math.max(10, remaining));
    Bun.sleepSync(sleep);
  }
  return tryAcquireDistillLock(runtimeHome);
}

function ageInDays(iso: string, now: string): number {
  const created = Date.parse(iso);
  const current = Date.parse(now);
  if (Number.isNaN(created) || Number.isNaN(current)) return 0;
  return (current - created) / (1000 * 60 * 60 * 24);
}
