import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  CanonicalEventStore,
  CanonicalMemoryStore,
  buildClaudeDirectLaunchEvent,
  buildCodexDirectLaunchEvent,
  buildLifecycleEvents,
  buildOpenCodeDirectLaunchEvent,
  buildOpenCodeRetrievalContext,
  buildPaiRunPlan,
  buildPiWrapperLifecycleEvents,
  buildPiWrapperRunPlan,
  claudeTracerRuntimeTemplatePath,
  codexTracerRuntimeTemplatePath,
  mapOpenCodePluginObservationToEvent,
  opencodeTracerRuntimeTemplatePath,
  piTracerRuntimeTemplatePath,
  resolveClaudePaiSession,
  resolveCodexPaiSession,
  resolveOpenCodePaiSession,
  type ProposedMemoryInput,
} from "../src";

const repoRoot = join(import.meta.dir, "..", "..");

const runtimeHomes: string[] = [];

afterEach(() => {
  for (const runtimeHome of runtimeHomes.splice(0)) {
    rmSync(runtimeHome, { recursive: true, force: true });
  }
});

describe("end-to-end harness smoke test", () => {
  test("coordinates fixture-only adapter sessions, events, memory, policy, and runtime boundaries", () => {
    const runtimeHomeByHarness = Object.fromEntries(
      ["claude", "codex", "opencode", "pi"].map((harness) => [harness, tempRuntimeHome(harness)]),
    ) as Record<"claude" | "codex" | "opencode" | "pi", string>;
    const timestamp = "2026-05-09T23:00:00.000Z";
    const projectId = "git:smoke-project";

    expect(claudeTracerRuntimeTemplatePath(runtimeHomeByHarness.claude)).toContain(runtimeHomeByHarness.claude);
    expect(codexTracerRuntimeTemplatePath(runtimeHomeByHarness.codex)).toContain(runtimeHomeByHarness.codex);
    expect(opencodeTracerRuntimeTemplatePath(runtimeHomeByHarness.opencode)).toContain(runtimeHomeByHarness.opencode);
    expect(piTracerRuntimeTemplatePath(runtimeHomeByHarness.pi)).toContain(runtimeHomeByHarness.pi);

    const opencodePlan = buildPaiRunPlan({
      target: "opencode",
      runtimeHome: runtimeHomeByHarness.opencode,
      sessionId: "pai_smoke_opencode",
      cwd: "/workspace/smoke",
      projectId,
      args: ["run", "fixture"],
      baseEnv: { PATH: "/usr/bin", SECRET_TOKEN: undefined },
    });
    const piPlan = buildPiWrapperRunPlan({
      runtimeHome: runtimeHomeByHarness.pi,
      sessionId: "pai_smoke_pi",
      cwd: "/workspace/smoke",
      projectId,
      baseEnv: { PATH: "/usr/bin" },
    });

    expect(opencodePlan.pai_session_id).toMatch(/^pai_/);
    expect(piPlan.pai_session_id).toMatch(/^pai_/);
    expect(opencodePlan.dry_run_default).toBe(true);
    expect(opencodePlan.launch.command).toBe("opencode");
    expect(piPlan.launch.command).toBe("pi");
    expect(buildLifecycleEvents(opencodePlan).map((event) => event.event_type)).toEqual([
      "session.start",
      "session.launch",
      "session.stop",
    ]);

    const claudeResolution = resolveClaudePaiSession({ seed: "123e4567-e89b-12d3-a456-426614174016" });
    const codexResolution = resolveCodexPaiSession({ codexSessionId: "codex-native-smoke-session" });
    const opencodeResolution = resolveOpenCodePaiSession({ opencodeSessionId: "opencode-native-smoke-session" });

    const adapterEvents = [
      buildClaudeDirectLaunchEvent(claudeResolution, timestamp),
      buildCodexDirectLaunchEvent(codexResolution, timestamp),
      buildOpenCodeDirectLaunchEvent(opencodeResolution, timestamp),
      mapOpenCodePluginObservationToEvent({
        event: "ToolCall",
        pai_session_id: opencodeResolution.pai_session_id,
        sequence: 2,
        timestamp,
        cwd: "/workspace/smoke",
        project_id: projectId,
        tool_name: "fixture-tool",
        tool_input: "token=smoke-secret-value",
      }),
      ...buildPiWrapperLifecycleEvents(piPlan),
    ];

    expect(adapterEvents.map((event) => event.harness)).toEqual([
      "claude",
      "codex",
      "opencode",
      "opencode",
      "pi",
      "pi",
      "pi",
      "pi",
      "pi",
      "pi",
    ]);
    expect(adapterEvents.every((event) => event.pai_session_id.startsWith("pai_"))).toBe(true);
    expect(adapterEvents.every((event) => !("payloads" in event))).toBe(true);
    expect(adapterEvents.every((event) => event.policy_decision_id?.includes(event.event_id))).toBe(true);
    expect(adapterEvents.find((event) => event.event_type === "tool.call")?.redaction_status).toBe("redacted");
    expect(adapterEvents.find((event) => event.event_type === "tool.call")?.payload_summary).toContain("[REDACTED:generic_assignment_secret]");

    const eventStore = new CanonicalEventStore({ runtimeHome: runtimeHomeByHarness.opencode });
    try {
      const ingested = adapterEvents.map((event) => eventStore.ingest(event));
      const stored = eventStore.listEvents();

      expect(ingested.every((result) => result.status === "accepted")).toBe(true);
      expect(stored).toHaveLength(adapterEvents.length);
      expect(stored.every((event) => event.ingest_status === "accepted")).toBe(true);
      expect(stored.every((event) => !("payload" in event))).toBe(true);
      expect(stored.some((event) => event.redaction_status === "redacted")).toBe(true);
    } finally {
      eventStore.close();
    }

    const memoryStore = new CanonicalMemoryStore({ runtimeHome: runtimeHomeByHarness.opencode });
    try {
      memoryStore.addMemory(memoryFixture({
        memory_id: "mem-smoke-accepted",
        scope: projectId,
        source_event_ids: [adapterEvents[3].event_id],
        provenance: { harness: "opencode", policy_decision_id: adapterEvents[3].policy_decision_id },
        content: "Smoke fixture context proves adapter events become searchable memory.",
      }));
      memoryStore.addMemory(memoryFixture({
        memory_id: "mem-smoke-low-trust",
        scope: projectId,
        trust_level: "low",
        review_status: "proposed",
        source_event_ids: [adapterEvents[0].event_id],
        content: "Low trust fixture context must not render into bounded context.",
      }));

      expect(memoryStore.searchMemories({ query: "searchable", projectId, limit: 5 }).map((memory) => memory.memory_id)).toEqual([
        "mem-smoke-accepted",
      ]);
      const context = buildOpenCodeRetrievalContext(memoryStore, { projectId, limit: 5 });
      expect(context.memories.map((memory) => memory.memory_id)).toEqual(["mem-smoke-accepted"]);
      expect(context.content).toContain(adapterEvents[3].event_id);
      expect(context.content).not.toContain("Low trust fixture");
    } finally {
      memoryStore.close();
    }

    const cliSearch = runPaiMemory("search", "searchable", "--runtime-home", runtimeHomeByHarness.opencode, "--project", projectId);
    const cliContext = runPaiMemory("context", "--runtime-home", runtimeHomeByHarness.opencode, "--project", projectId, "--limit", "5");
    expect(cliSearch.exitCode).toBe(0);
    expect(JSON.parse(cliSearch.stdout.toString()).memories.map((memory: { memory_id: string }) => memory.memory_id)).toEqual([
      "mem-smoke-accepted",
    ]);
    expect(cliContext.exitCode).toBe(0);
    expect(JSON.parse(cliContext.stdout.toString()).content).toContain(adapterEvents[3].event_id);

    expect(isIgnored(".pai/runtime/events.sqlite")).toBe(true);
    expect(isIgnored(".pai/runtime/events.sqlite-wal")).toBe(true);
    expect(isIgnored(".pai/runtime/trails/events.jsonl")).toBe(true);
    expect(isIgnored(".pai/runtime/transcripts/session.txt")).toBe(true);
    expect(isIgnored(".pai/runtime/auth.json")).toBe(true);
    expect(isIgnored(".pai/runtime/secrets.local")).toBe(true);
    expect(isIgnored(".pai/runtime/memory/profile.json")).toBe(true);
    expect(listTrackedRuntimeArtifacts()).toEqual([]);
  });
});

function tempRuntimeHome(harness: string) {
  const runtimeHome = mkdtempSync(join(tmpdir(), `pai-e2e-${harness}-`));
  runtimeHomes.push(runtimeHome);
  return runtimeHome;
}

function runPaiMemory(...args: string[]) {
  return Bun.spawnSync([process.execPath, "src/cli/pai-memory.ts", ...args], {
    cwd: join(import.meta.dir, ".."),
    stdout: "pipe",
    stderr: "pipe",
  });
}

function isIgnored(path: string): boolean {
  const result = Bun.spawnSync(["git", "check-ignore", path], { cwd: repoRoot });
  return result.exitCode === 0;
}

function listTrackedRuntimeArtifacts() {
  const result = Bun.spawnSync(["git", "ls-files", ".pai/runtime", ".pai/**/*.sqlite", ".pai/**/*.jsonl"], {
    cwd: repoRoot,
    stdout: "pipe",
  });
  return result.stdout.toString().trim().split("\n").filter(Boolean);
}

function memoryFixture(overrides: Partial<ProposedMemoryInput> = {}): ProposedMemoryInput {
  return {
    memory_id: "mem-smoke",
    type: "projects",
    scope: "git:smoke-project",
    source_event_ids: ["event-smoke"],
    provenance: { harness: "opencode" },
    confidence: 0.91,
    assertion_type: "verified",
    trust_level: "high",
    review_status: "accepted",
    content: "Smoke fixture context is searchable and bounded.",
    ...overrides,
  };
}
