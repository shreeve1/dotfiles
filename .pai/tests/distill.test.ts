import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CanonicalEventStore, type EventIngestInput } from "../src/event-store";
import { CanonicalMemoryStore } from "../src/memory-store";
import { prepareEventForDestination } from "../src/redaction";
import type { AdapterCapabilities } from "../src/policy";
import {
  appendDistillLog,
  autoExportAfterAccept,
  buildSessionCursors,
  DISTILL_DEFAULT_DEBOUNCE_SECONDS,
  DISTILL_LOG_ROTATION_BYTES,
  distillRuntimeFiles,
  distillWithLock,
  readDebounceFile,
  readWatermarkFile,
  reviewPending,
  runDistill,
  tryAcquireDistillLock,
  writeWatermarkFile,
} from "../src/distill";

const capabilities: AdapterCapabilities = {
  can_inject_context: true,
  can_block_tool: true,
  can_request_confirmation: true,
  can_observe_tool_input: true,
  can_observe_tool_output: true,
  can_observe_final_response: true,
  can_set_environment: true,
  can_attach_native_session_id: true,
};

let runtimeHome: string | undefined;

afterEach(() => {
  if (runtimeHome) rmSync(runtimeHome, { recursive: true, force: true });
  runtimeHome = undefined;
});

describe("Phase 6 distill", () => {
  test("[T.6.1] dry-run reports proposals without mutating SQLite, watermark, or debounce", () => {
    const { memoryStore, eventStore } = makeStores();
    eventStore.ingest(eventFixture("evt-dry-1", 1));
    eventStore.ingest(eventFixture("evt-dry-2", 2));

    const summary = runDistill(
      { memoryStore, eventStore },
      { runtimeHome, dryRun: true, provider: "deterministic", now: "2026-05-09T00:01:00.000Z" },
    );

    expect(summary.status).toBe("dry_run");
    expect(summary.proposed.length).toBe(2);
    expect(summary.skipped).toEqual([]);
    const files = distillRuntimeFiles(runtimeHome);
    expect(existsSync(files.watermarkPath)).toBe(false);
    expect(existsSync(files.debouncePath)).toBe(false);

    expect(memoryStore.listReviewQueue("proposed")).toEqual([]);

    memoryStore.close();
    eventStore.close();
  });

  test("[T.6.2] distill advances watermark only on success; provider error leaves watermark unchanged", () => {
    const { memoryStore, eventStore } = makeStores();
    eventStore.ingest(eventFixture("evt-adv-1", 1));

    const ok = runDistill(
      { memoryStore, eventStore },
      { runtimeHome, provider: "deterministic", now: "2026-05-09T01:00:00.000Z" },
    );
    expect(ok.status).toBe("ran");
    const afterFirst = readWatermarkFile(runtimeHome);
    expect(afterFirst.opencode?.["deterministic-test-double"]?.["session-dream"].last_sequence).toBe(1);

    const before = JSON.stringify(readWatermarkFile(runtimeHome));
    rmSync(distillRuntimeFiles(runtimeHome).debouncePath, { force: true });
    expect(() =>
      runDistill(
        { memoryStore, eventStore },
        {
          runtimeHome,
          provider: "claude-inference",
          providerEnablement: {
            provider: "claude-inference",
            enabled: false,
            explicit_user_approval: false,
            privacy_labels: [],
            redaction_required_before_enablement: true,
          },
          now: "2026-05-09T02:00:00.000Z",
        },
      ),
    ).toThrow();
    const after = JSON.stringify(readWatermarkFile(runtimeHome));
    expect(after).toBe(before);

    memoryStore.close();
    eventStore.close();
  });

  test("[T.6.3] re-run after success reports duplicates as skipped already_proposed (no UNIQUE error)", () => {
    const { memoryStore, eventStore } = makeStores();
    eventStore.ingest(eventFixture("evt-dup-1", 1));

    const first = runDistill(
      { memoryStore, eventStore },
      { runtimeHome, provider: "deterministic", now: "2026-05-09T03:00:00.000Z" },
    );
    expect(first.proposed.length).toBe(1);

    rmSync(distillRuntimeFiles(runtimeHome).watermarkPath, { force: true });
    rmSync(distillRuntimeFiles(runtimeHome).debouncePath, { force: true });

    const second = runDistill(
      { memoryStore, eventStore },
      { runtimeHome, provider: "deterministic", now: "2026-05-09T04:00:00.000Z" },
    );
    expect(second.status).toBe("ran");
    expect(second.proposed).toEqual([]);
    expect(second.skipped[0]?.reason).toBe("already_proposed");

    memoryStore.close();
    eventStore.close();
  });

  test("[T.6.4] round-trip: distill -> proposed only -> accept moves memory to accepted state", () => {
    const { memoryStore, eventStore } = makeStores();
    eventStore.ingest(eventFixture("evt-rt-1", 1));

    runDistill(
      { memoryStore, eventStore },
      { runtimeHome, provider: "deterministic", now: "2026-05-09T05:00:00.000Z" },
    );

    expect(memoryStore.listInstructionEligibleMemories().length).toBe(0);

    const queue = memoryStore.listReviewQueue("proposed");
    expect(queue.length).toBe(1);
    expect(memoryStore.getMemory(queue[0].memory_id)?.review_status).toBe("proposed");

    memoryStore.decideReview(queue[0].review_id, "accepted");
    expect(memoryStore.getMemory(queue[0].memory_id)?.review_status).toBe("accepted");
    expect(memoryStore.listReviewQueue("accepted").map((r) => r.review_id)).toContain(queue[0].review_id);
    memoryStore.close();
    eventStore.close();
  });

  test("[T.6.5] lost watermark causes safe replay; second run skips duplicates", () => {
    const { memoryStore, eventStore } = makeStores();
    eventStore.ingest(eventFixture("evt-replay-1", 1));
    runDistill(
      { memoryStore, eventStore },
      { runtimeHome, provider: "deterministic", now: "2026-05-09T06:00:00.000Z" },
    );
    rmSync(distillRuntimeFiles(runtimeHome).watermarkPath, { force: true });
    rmSync(distillRuntimeFiles(runtimeHome).debouncePath, { force: true });

    const replay = runDistill(
      { memoryStore, eventStore },
      { runtimeHome, provider: "deterministic", now: "2026-05-09T07:00:00.000Z" },
    );
    expect(replay.proposed).toEqual([]);
    expect(replay.skipped.length).toBe(1);
    expect(replay.skipped[0]?.reason).toBe("already_proposed");

    memoryStore.close();
    eventStore.close();
  });

  test("[T.6.6] --since overrides watermark and does not advance it", () => {
    const { memoryStore, eventStore } = makeStores();
    eventStore.ingest(eventFixture("evt-since-1", 1));
    eventStore.ingest(eventFixture("evt-since-2", 2));

    const result = runDistill(
      { memoryStore, eventStore },
      { runtimeHome, provider: "deterministic", sinceTimestamp: "2026-05-09T00:00:00.000Z", now: "2026-05-09T08:00:00.000Z" },
    );
    expect(result.status).toBe("ran");
    expect(result.proposed.length).toBe(2);
    expect(readWatermarkFile(runtimeHome)).toEqual({});

    memoryStore.close();
    eventStore.close();
  });

  test("[T.6.7] watermark keyed by (harness, provider, pai_session_id)", () => {
    const { memoryStore, eventStore } = makeStores();
    eventStore.ingest(eventFixture("evt-key-1", 1));

    runDistill(
      { memoryStore, eventStore },
      { runtimeHome, provider: "deterministic", now: "2026-05-09T09:00:00.000Z" },
    );
    rmSync(distillRuntimeFiles(runtimeHome).debouncePath, { force: true });

    const wm = readWatermarkFile(runtimeHome);
    const localCursors = buildSessionCursors(wm, "local-offline-rules");
    const determCursors = buildSessionCursors(wm, "deterministic-test-double");
    expect(Object.keys(localCursors).length).toBe(0);
    expect(determCursors["session-dream"]).toBe(1);

    const local = runDistill(
      { memoryStore, eventStore },
      { runtimeHome, provider: "local", now: "2026-05-09T10:00:00.000Z" },
    );
    expect(local.status).toBe("ran");
    expect(local.proposed.length).toBeGreaterThanOrEqual(0);

    memoryStore.close();
    eventStore.close();
  });

  test("[T.6.8] held lock returns status skipped_lock_held", () => {
    runtimeHome = mkdtempSync(join(tmpdir(), "pai-distill-lock-"));
    const eventStore = new CanonicalEventStore({ runtimeHome });
    eventStore.ingest(eventFixture("evt-lock-1", 1));
    eventStore.close();

    const lock = tryAcquireDistillLock(runtimeHome)!;
    expect(lock).not.toBeNull();

    const summary = distillWithLock({ runtimeHome, provider: "deterministic", now: "2026-05-09T11:00:00.000Z" });
    expect(summary.status).toBe("skipped_lock_held");
    lock.release();
  });

  test("[T.6.9] debounce window blocks invocation; outside window proceeds", () => {
    runtimeHome = mkdtempSync(join(tmpdir(), "pai-distill-debounce-"));
    const eventStore = new CanonicalEventStore({ runtimeHome });
    eventStore.ingest(eventFixture("evt-deb-1", 1));
    eventStore.close();

    const first = distillWithLock({ runtimeHome, provider: "deterministic", now: "2026-05-09T12:00:00.000Z" });
    expect(first.status).toBe("ran");

    const debounced = distillWithLock({
      runtimeHome,
      provider: "deterministic",
      now: "2026-05-09T12:00:30.000Z",
      debounceSeconds: 60,
    });
    expect(debounced.status).toBe("debounced");

    const later = distillWithLock({
      runtimeHome,
      provider: "deterministic",
      now: "2026-05-09T12:02:00.000Z",
      debounceSeconds: 60,
    });
    expect(later.status).toBe("ran");
  });

  test("[T.6.10] Stop-hook command is detached and shell-safe", () => {
    const { CLAUDE_STOP_DISTILL_COMMAND } = require("../src/claude-tracer");
    const { CODEX_STOP_DISTILL_COMMAND } = require("../src/codex-tracer");
    const { OPENCODE_STOP_DISTILL_COMMAND } = require("../src/opencode-tracer");
    for (const command of [CLAUDE_STOP_DISTILL_COMMAND, CODEX_STOP_DISTILL_COMMAND, OPENCODE_STOP_DISTILL_COMMAND]) {
      expect(command).toContain("pai-memory distill");
      expect(command).toContain("--quiet");
      expect(command).toContain("disown");
      expect(command).toContain(">/dev/null 2>&1");
    }
  });

  test("[T.6.11] --quiet suppresses summary stdout via CLI", () => {
    runtimeHome = mkdtempSync(join(tmpdir(), "pai-distill-cli-quiet-"));
    const eventStore = new CanonicalEventStore({ runtimeHome });
    eventStore.ingest(eventFixture("evt-quiet-1", 1));
    eventStore.close();

    const quiet = runPaiMemory("distill", "--quiet", "--provider", "deterministic", "--runtime-home", runtimeHome);
    expect(quiet.exitCode).toBe(0);
    expect(quiet.stdout.toString()).toBe("");

    rmSync(distillRuntimeFiles(runtimeHome).debouncePath, { force: true });
    const verbose = runPaiMemory("distill", "--provider", "deterministic", "--runtime-home", runtimeHome);
    expect(verbose.exitCode).toBe(0);
    expect(verbose.stdout.toString()).toContain("\"status\"");
  });

  test("[T.6.12] review pending groups by type, ages, and flags stale entries", () => {
    runtimeHome = mkdtempSync(join(tmpdir(), "pai-review-pending-"));
    const memoryStore = new CanonicalMemoryStore({ runtimeHome });
    memoryStore.proposeMemoryWithReview(
      {
        memory_id: "mem-fresh",
        type: "projects",
        scope: "git:abc",
        source_event_ids: ["evt-fresh"],
        provenance: { harness: "opencode" },
        confidence: 0.7,
        assertion_type: "observed",
        trust_level: "medium",
        content: "Fresh proposal",
      },
      { review_id: "review-fresh", proposed_diff: "+ fresh" },
      "2026-05-09T00:00:00.000Z",
    );
    memoryStore.proposeMemoryWithReview(
      {
        memory_id: "mem-stale",
        type: "learning",
        scope: "git:abc",
        source_event_ids: ["evt-stale"],
        provenance: { harness: "opencode" },
        confidence: 0.7,
        assertion_type: "observed",
        trust_level: "medium",
        content: "Stale proposal",
      },
      { review_id: "review-stale", proposed_diff: "+ stale" },
      "2026-04-01T00:00:00.000Z",
    );
    memoryStore.close();

    writeWatermarkFile(
      {
        opencode: {
          "deterministic-test-double": {
            "session-dream": { last_sequence: 5, last_run_at: "2026-04-20T00:00:00.000Z" },
          },
        },
      },
      runtimeHome,
    );

    const summary = reviewPending({ runtimeHome, now: "2026-05-09T00:00:00.000Z", staleDays: 14 });
    expect(summary.total).toBe(2);
    expect(summary.by_type.projects).toBe(1);
    expect(summary.by_type.learning).toBe(1);
    expect(summary.stale.map((s) => s.review_id)).toEqual(["review-stale"]);
    expect(summary.watermark_age.length).toBe(1);
    expect(summary.watermark_age[0].age_days).toBeGreaterThan(14);
  });

  test("[T.6.13/T.6.14] auto-export on accept refreshes export when enabled and lock free; skipped when lock held", () => {
    runtimeHome = mkdtempSync(join(tmpdir(), "pai-autoexp-"));
    const store = new CanonicalMemoryStore({ runtimeHome });
    store.addMemory({
      memory_id: "mem-autoexp",
      type: "projects",
      scope: "git:abc",
      source_event_ids: ["evt-autoexp"],
      provenance: { harness: "opencode" },
      confidence: 0.95,
      assertion_type: "verified",
      trust_level: "high",
      review_status: "accepted",
      content: "Accepted convention.",
    });
    store.close();

    const output = join(runtimeHome, "portable-memory", "exports", "accepted-memories.json");

    const disabled = autoExportAfterAccept({ runtimeHome, output, env: {} });
    expect(disabled.status).toBe("skipped_disabled");
    expect(existsSync(output)).toBe(false);

    const enabled = autoExportAfterAccept({
      runtimeHome,
      output,
      env: { PAI_AUTO_EXPORT_ON_ACCEPT: "1" },
    });
    expect(enabled.status).toBe("exported");
    expect(existsSync(output)).toBe(true);
    const parsed = JSON.parse(readFileSync(output, "utf8"));
    expect(parsed.memories.map((m: { memory_id: string }) => m.memory_id)).toContain("mem-autoexp");

    const lock = tryAcquireDistillLock(runtimeHome)!;
    const locked = autoExportAfterAccept({
      runtimeHome,
      output,
      env: { PAI_AUTO_EXPORT_ON_ACCEPT: "1" },
    });
    expect(locked.status).toBe("skipped_lock_held");
    lock.release();
  });

  test("[T.6.15] claude-inference without explicit enablement exits non-zero with opt-in error", () => {
    runtimeHome = mkdtempSync(join(tmpdir(), "pai-distill-optin-"));
    const result = runPaiMemory("distill", "--provider", "claude-inference", "--runtime-home", runtimeHome);
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr.toString()).toContain("explicit user approval");
  });

  test("[T.6.16] failure log appends and rotates at 1 MB", () => {
    runtimeHome = mkdtempSync(join(tmpdir(), "pai-distill-log-"));
    const { logPath, rotatedLogPath } = distillRuntimeFiles(runtimeHome);

    appendDistillLog("first", runtimeHome);
    expect(readFileSync(logPath, "utf8")).toContain("first");

    writeFileSync(logPath, "X".repeat(DISTILL_LOG_ROTATION_BYTES + 1));
    appendDistillLog("after-rotation", runtimeHome);
    expect(existsSync(rotatedLogPath)).toBe(true);
    expect(readFileSync(logPath, "utf8")).toContain("after-rotation");
    expect(statSync(rotatedLogPath).size).toBeGreaterThan(DISTILL_LOG_ROTATION_BYTES);
  });
});

function makeStores() {
  runtimeHome = mkdtempSync(join(tmpdir(), "pai-distill-"));
  return {
    eventStore: new CanonicalEventStore({ runtimeHome }),
    memoryStore: new CanonicalMemoryStore({ runtimeHome }),
  };
}

function eventFixture(eventId: string, sequence: number): EventIngestInput {
  return {
    ...prepareEventForDestination("dream", {
      event_id: eventId,
      pai_session_id: "session-dream",
      harness: "opencode",
      event_type: "prompt.submit",
      timestamp: `2026-05-09T00:00:${String(sequence).padStart(2, "0")}.000Z`,
      sequence,
      adapter_version: "opencode-test",
      payloads: {
        prompt: `Convention sample ${sequence}.`,
      },
    }),
    project_id: "git:abc123",
    capabilities,
  };
}

function runPaiMemory(...args: string[]) {
  return Bun.spawnSync([process.execPath, "src/cli/pai-memory.ts", ...args], {
    cwd: join(import.meta.dir, ".."),
    stdout: "pipe",
    stderr: "pipe",
  });
}

void DISTILL_DEFAULT_DEBOUNCE_SECONDS;
void readDebounceFile;
