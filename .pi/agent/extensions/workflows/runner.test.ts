import assert from "node:assert/strict";
import { test } from "node:test";
import type {
  AgentSession,
  AgentSessionEventListener,
  ToolDefinition,
} from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { recordBackgroundRunFailure, recordFlushFailure } from "./index.ts";
import type { WorkflowDetails } from "./model.ts";
import {
  createFirstResponseWatchdog,
  guardWorkflowChildTools,
  isJsonSchema,
  reactivateCustomTools,
  recordToolExecutionTiming,
  transcriptFromMessages,
  type ToolExecutionTiming,
} from "./runner.ts";

const zeroUsage = {
  input: 0,
  output: 0,
  cacheRead: 0,
  cacheWrite: 0,
  totalTokens: 0,
  cost: {
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    total: 0,
  },
};

function parallelToolMessages(): AgentSession["messages"] {
  return [
    { role: "user", content: "run both", timestamp: 900 },
    {
      role: "assistant",
      content: [
        {
          type: "toolCall",
          id: "call-a",
          name: "first",
          arguments: { value: 1 },
        },
        {
          type: "toolCall",
          id: "call-b",
          name: "second",
          arguments: { value: 2 },
        },
      ],
      api: "openai-responses",
      provider: "fixture",
      model: "fixture",
      usage: zeroUsage,
      stopReason: "toolUse",
      timestamp: 950,
    },
    {
      role: "toolResult",
      toolCallId: "call-a",
      toolName: "first",
      content: [{ type: "text", text: "first result" }],
      isError: false,
      timestamp: 1_040,
    },
    {
      role: "toolResult",
      toolCallId: "call-b",
      toolName: "second",
      content: [{ type: "text", text: "second result" }],
      isError: false,
      timestamp: 1_041,
    },
  ];
}

test("completed parallel tool calls pair lifecycle timings with calls and results", () => {
  const timings = new Map<string, ToolExecutionTiming>();
  recordToolExecutionTiming(
    timings,
    {
      type: "tool_execution_start",
      toolCallId: "call-a",
      toolName: "first",
      args: { value: 1 },
    },
    1_000,
  );
  recordToolExecutionTiming(
    timings,
    {
      type: "tool_execution_start",
      toolCallId: "call-b",
      toolName: "second",
      args: { value: 2 },
    },
    1_002,
  );
  // Parallel calls can finish in a different order than their result messages.
  recordToolExecutionTiming(
    timings,
    {
      type: "tool_execution_end",
      toolCallId: "call-b",
      toolName: "second",
      result: { content: [{ type: "text", text: "second result" }] },
      isError: false,
    },
    1_012,
  );
  recordToolExecutionTiming(
    timings,
    {
      type: "tool_execution_end",
      toolCallId: "call-a",
      toolName: "first",
      result: { content: [{ type: "text", text: "first result" }] },
      isError: false,
    },
    1_030,
  );

  const transcript = transcriptFromMessages(parallelToolMessages(), timings);
  const toolEntries = transcript.filter((entry) => entry.role === "tool");
  const resultEntries = transcript.filter(
    (entry) => entry.role === "toolResult",
  );

  for (const entries of [toolEntries, resultEntries]) {
    assert.deepEqual(
      entries.map(({ toolCallId, startedAt, finishedAt, durationMs }) => ({
        toolCallId,
        startedAt,
        finishedAt,
        durationMs,
      })),
      [
        {
          toolCallId: "call-a",
          startedAt: 1_000,
          finishedAt: 1_030,
          durationMs: 30,
        },
        {
          toolCallId: "call-b",
          startedAt: 1_002,
          finishedAt: 1_012,
          durationMs: 10,
        },
      ],
    );
  }
});

test("in-flight aborted tool calls retain start timing without completion", () => {
  const timings = new Map<string, ToolExecutionTiming>();
  recordToolExecutionTiming(
    timings,
    {
      type: "tool_execution_start",
      toolCallId: "call-a",
      toolName: "first",
      args: { value: 1 },
    },
    2_000,
  );

  const transcript = transcriptFromMessages(
    parallelToolMessages().slice(0, 2),
    timings,
  );
  const first = transcript.find((entry) => entry.toolCallId === "call-a");

  assert.equal(first?.startedAt, 2_000);
  assert.equal(first?.finishedAt, undefined);
  assert.equal(first?.durationMs, undefined);
  assert.equal(
    transcript.some((entry) => entry.role === "toolResult"),
    false,
  );
});

test("first-response watchdog aborts a silent provider request", async () => {
  let aborted = false;
  const watchdog = createFirstResponseWatchdog(
    async () => {
      aborted = true;
    },
    { timeoutMs: 10, model: "fixture-model" },
  );

  // The watchdog timer is unref'd, so it only fires while something else keeps
  // the loop alive. In production that is the in-flight provider socket; here a
  // ref'd timer stands in for it. Without it node exits before the 10 ms
  // timeout and this test plus the two after it are cancelled.
  const keepAlive = setTimeout(() => {}, 1_000);
  try {
    await assert.rejects(
      watchdog.waitFor(new Promise<never>(() => {})),
      /no assistant response event for fixture-model within 10 ms.*stalled/i,
    );
  } finally {
    clearTimeout(keepAlive);
  }
  assert.equal(aborted, true);
});

test("first assistant response disarms the watchdog without limiting the run", async () => {
  const watchdog = createFirstResponseWatchdog(
    async () => {
      throw new Error("watchdog should have been disarmed");
    },
    { timeoutMs: 10 },
  );
  watchdog.markResponse();

  const result = await watchdog.waitFor(
    new Promise<string>((resolve) => setTimeout(() => resolve("done"), 20)),
  );
  assert.equal(result, "done");
});

test("workflow children guard structured, normal, and dynamically registered tools", async () => {
  const structuredResult = {
    content: [{ type: "text" as const, text: "recorded" }],
    details: { value: "fixture" },
    terminate: true,
  };
  const structured = {
    name: "structured_output",
    label: "Structured Output",
    description: "fixture",
    parameters: Type.Object({}),
    async execute() {
      return structuredResult;
    },
  } satisfies ToolDefinition;
  const definitions = new Map<string, ToolDefinition>([
    [structured.name, structured],
  ]);
  let listener: AgentSessionEventListener | undefined;
  let active = [...definitions.keys()];
  const session = {
    getAllTools: () => [...definitions.keys()].map((name) => ({ name })),
    getToolDefinition: (name: string) => definitions.get(name),
    getActiveToolNames: () => [...active],
    setActiveToolsByName: (names: string[]) => {
      active = [...names];
    },
    subscribe(next: AgentSessionEventListener) {
      listener = next;
      return () => {
        listener = undefined;
      };
    },
  };

  const unsubscribe = guardWorkflowChildTools(session, 10);
  assert.equal(await structured.execute(), structuredResult);

  let dynamicSignal: AbortSignal | undefined;
  const dynamic = {
    name: "dynamic_fixture",
    label: "Dynamic Fixture",
    description: "fixture",
    parameters: Type.Object({}),
    async execute(
      _toolCallId: string,
      _params: Record<string, never>,
      signal?: AbortSignal,
    ) {
      dynamicSignal = signal;
      return new Promise<never>(() => {});
    },
  } satisfies ToolDefinition;
  const originalDynamicExecute = dynamic.execute;
  definitions.set(dynamic.name, dynamic);
  listener?.({ type: "agent_start" });
  assert.notEqual(dynamic.execute, originalDynamicExecute);

  await assert.rejects(
    dynamic.execute("fixture", {}, undefined),
    /Tool call "dynamic_fixture" timed out after 10 ms\./,
  );
  assert.equal(dynamicSignal?.aborted, true);
  unsubscribe();
});

test("isJsonSchema accepts shared subschemas but still rejects cycles", () => {
  // Regression: `seen` was tracked for the whole walk, so reusing one
  // subschema object across sibling fields — a DAG, not a cycle, and the
  // idiomatic way to hand-write JSON Schema — was rejected. Callers lost
  // structured output entirely with "must be a bounded JSON object".
  const str = { type: "string" };
  assert.equal(
    isJsonSchema({ type: "object", properties: { a: str, b: str } }),
    true,
  );
  const sharedEnum = ["high", "low"];
  assert.equal(
    isJsonSchema({
      type: "object",
      properties: { a: { enum: sharedEnum }, b: { enum: sharedEnum } },
    }),
    true,
  );

  // Genuine cycles must still fail, at the root and when nested.
  const selfCycle: Record<string, unknown> = { type: "object" };
  selfCycle.self = selfCycle;
  assert.equal(isJsonSchema(selfCycle), false);
  const nestedCycle: Record<string, unknown> = {
    type: "object",
    properties: {} as Record<string, unknown>,
  };
  (nestedCycle.properties as Record<string, unknown>).back = nestedCycle;
  assert.equal(isJsonSchema(nestedCycle), false);

  // Prototype-pollution keys and non-object roots stay rejected.
  assert.equal(isJsonSchema(JSON.parse('{"__proto__":{"x":1}}')), false);
  assert.equal(isJsonSchema([{ type: "string" }]), false);
  assert.equal(isJsonSchema(null), false);
});

function failureDetails(status: WorkflowDetails["status"]): WorkflowDetails {
  return {
    runId: "wf_test",
    sessionId: "session_test",
    background: false,
    status,
    startedAt: 1,
    finishedAt: 2,
    phases: [],
    agents: [],
  };
}

test("artifact flush failure preserves truthful run status on both paths", () => {
  // The real bug: persistence.flush() throws after a successful run was
  // committed at details.status = "completed". The inner catch (used by both
  // blocking and background) and the background catch must NOT clobber
  // details.status — the truthful "completed" must survive so
  // recordSettledRun counts it as a success and the dashboard reports it
  // correctly. Genuine failures ("failed"/"aborted") must still be reported.
  for (const startingStatus of ["completed", "failed", "aborted"] as const) {
    const details = failureDetails(startingStatus);

    // === Blocking path: runScript() inner catch ===
    // runScript() commits the truthful status at details.status = status,
    // then runs the flush tail. The real recordFlushFailure() must not
    // overwrite status — only details.error.
    let thrown: Error | undefined;
    try {
      recordFlushFailure(details, new Error("disk full"));
    } catch (error) {
      thrown = error as Error;
    }
    assert.match(
      thrown?.message ?? "",
      /^Artifact persistence failed: disk full$/,
    );
    assert.equal(details.status, startingStatus, `flush: ${startingStatus}`);
    assert.match(details.error ?? "", /^Artifact persistence failed:/);

    // === Background path: completion.catch ===
    // After runScript() rethrows, the background catch fires. The real
    // recordBackgroundRunFailure() must preserve a truthful "completed"
    // or "aborted" status (both already committed by runScript before it
    // rethrew). Only a status that never made it past "running" (genuine
    // mid-flight crash) is marked "failed".
    recordBackgroundRunFailure(details, thrown ?? new Error("disk full"));
    assert.equal(
      details.status,
      startingStatus,
      `background: ${startingStatus}`,
    );
  }
});

test("background catch marks a genuine mid-flight crash as failed", () => {
  // Inverse of the preservation test: status === "running" was never
  // committed (a real mid-flight crash). The background catch must mark
  // the run "failed", record finishedAt, and surface the error.
  const details = failureDetails("running");
  const startedAt = details.startedAt;
  recordBackgroundRunFailure(details, new Error("disk full"));
  assert.equal(details.status, "failed");
  assert.ok(
    typeof details.finishedAt === "number" && details.finishedAt >= startedAt,
    "finishedAt must be set",
  );
  assert.match(details.error ?? "", /disk full/);
});

test("background catch keeps an already-recorded flush error instead of overwriting it", () => {
  // recordFlushFailure() tags its error with "Artifact persistence failed:";
  // recordBackgroundRunFailure() must not clobber that prefix when the same
  // details bubble through both layers.
  const details = failureDetails("completed");
  let thrown: Error | undefined;
  try {
    recordFlushFailure(details, new Error("disk full"));
  } catch (error) {
    thrown = error as Error;
  }
  recordBackgroundRunFailure(details, thrown ?? new Error("disk full"));
  assert.equal(details.error, "Artifact persistence failed: disk full");
});

test("reactivateCustomTools restores customTools dropped from the active set", () => {
  // Regression, observed in run wf_4cb67e93508c: an extension loaded in the
  // child replaces the ACTIVE tool set at session_start — Fusion calls
  // setActiveTools(parentToolAllowlist()), which does not know about a
  // workflow's structured_output. The tool survives in the REGISTRY but leaves
  // the active set, so the agent loop's lookup misses and returns
  // `Tool <name> not found` (pi-agent-core agent-loop.js:394-398) — discarding
  // work the agent already completed. Registry presence is not activation.
  const custom = [{ name: "structured_output" }];
  // Post-refresh active set: policy-filtered built-ins, custom tool gone.
  let active = ["read", "bash", "lsp_diagnostics", "todo"];
  const session = {
    getActiveToolNames: () => [...active],
    setActiveToolsByName: (names: string[]) => {
      active = [...names];
    },
  };

  reactivateCustomTools(session, custom);
  assert.ok(
    session.getActiveToolNames().includes("structured_output"),
    "custom tool must be re-activated",
  );
  // Re-activation must not widen the policy: denied tools stay denied.
  assert.equal(session.getActiveToolNames().includes("write"), false);
  assert.equal(session.getActiveToolNames().includes("edit"), false);
  assert.equal(session.getActiveToolNames().includes("subagent"), false);
  // Built-ins that were active stay active.
  assert.ok(session.getActiveToolNames().includes("read"));
  assert.equal(session.getActiveToolNames().length, 5);

  // Idempotent: a second call must not duplicate or reorder-thrash.
  const before = session.getActiveToolNames();
  reactivateCustomTools(session, custom);
  assert.deepEqual(session.getActiveToolNames(), before);
});

test("guardWorkflowChildTools re-activates customTools after a mid-run refresh", () => {
  // Fusion reapplies its allowlist before every agent start, dropping the
  // custom tool from the active set again, so the guard's existing agent_start
  // subscription must re-assert it every turn — not just once after binding.
  const custom = [{ name: "structured_output" }];
  let active = ["read", "structured_output"];
  let listener: AgentSessionEventListener | undefined;
  const session = {
    getAllTools: () => active.map((name) => ({ name })),
    getToolDefinition: () => undefined,
    getActiveToolNames: () => [...active],
    setActiveToolsByName: (names: string[]) => {
      active = [...names];
    },
    subscribe(next: AgentSessionEventListener) {
      listener = next;
      return () => {
        listener = undefined;
      };
    },
  };

  const unsubscribe = guardWorkflowChildTools(session, 10, custom);
  // Simulate the mid-run refresh that strips the custom tool.
  active = ["read"];
  listener?.({ type: "agent_start" } as never);
  assert.ok(
    session.getActiveToolNames().includes("structured_output"),
    "custom tool must be re-activated at agent_start",
  );
  unsubscribe();
});
