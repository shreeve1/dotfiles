import { beforeEach, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const tempDir = mkdtempSync(join(tmpdir(), "pai-mode-router-test-"));
const statePath = join(tempDir, "mode-router.json");
process.env.PAI_MODE_ROUTER_STATE_PATH = statePath;

const { PaiModeRouter } = await import("./index");
const hooks = await PaiModeRouter({} as never);

const sessionID = "ses_test_algorithm_lite";

function writeState(
  initialized = false,
  initializedAt?: string,
  todowriteSeenAt?: string,
) {
  writeFileSync(
    statePath,
    JSON.stringify(
      {
        sessions: {
          [sessionID]: {
            mode: "ALGORITHM",
            classifiedAt: "2026-05-12T00:00:00.000Z",
            messageCount: 1,
            firstPrompt: "test prompt",
            slug: "test-slug",
            algorithm: {
              contract: "lite",
              initialized,
              ...(initializedAt ? { initializedAt } : {}),
              ...(todowriteSeenAt ? { todowriteSeenAt } : {}),
            },
            algorithmActivatedMessageCount: 1,
          },
        },
        updated_at: "2026-05-12T00:00:00.000Z",
      },
      null,
      2,
    ),
    "utf8",
  );
}

function readSession() {
  return JSON.parse(readFileSync(statePath, "utf8")).sessions[sessionID];
}

function beforeTool(tool: string) {
  return hooks["tool.execute.before"]?.(
    { tool, sessionID, callID: `call_${tool}` },
    { args: {} },
  );
}

function beforeToolFor(sid: string, tool: string) {
  return hooks["tool.execute.before"]?.(
    { tool, sessionID: sid, callID: `call_${tool}` },
    { args: {} },
  );
}

function afterTaskFor(sid: string) {
  return hooks["tool.execute.after"]?.(
    {
      tool: "task",
      sessionID: sid,
      callID: "call_task",
      args: { subagent_type: "explorer", description: "Inspect codebase", prompt: "Inspect the codebase and return findings." },
    },
    { title: "", output: "", metadata: {} },
  );
}

function afterTodowrite(todos: Array<{ content: string; status: string; priority: string }>) {
  return hooks["tool.execute.after"]?.(
    {
      tool: "todowrite",
      sessionID,
      callID: "call_todowrite",
      args: { todos },
    },
    { title: "", output: "", metadata: {} },
  );
}

const validTodos = [
  { content: "Define exact lookup goal for the session search", status: "pending", priority: "high" },
  { content: "Verify the result with database-backed evidence", status: "pending", priority: "high" },
];

beforeEach(() => {
  writeState(false);
});

test("blocks read before Algorithm-lite initialization", async () => {
  await expect(beforeTool("read")).rejects.toThrow(
    "ALGORITHM-lite requires todowrite",
  );
});

test("blocks bash before Algorithm-lite initialization", async () => {
  await expect(beforeTool("bash")).rejects.toThrow(
    "ALGORITHM-lite requires todowrite",
  );
});

test("allows todowrite before Algorithm-lite initialization", async () => {
  await expect(beforeTool("todowrite")).resolves.toBeUndefined();
});

test("rejects vague todowrite and remains uninitialized", async () => {
  await afterTodowrite([
    { content: "do the task", status: "pending", priority: "high" },
    { content: "make it work", status: "pending", priority: "high" },
  ]);

  expect(readSession().algorithm.initialized).toBe(false);
});

test("accepts valid todowrite and allows read afterward", async () => {
  await afterTodowrite(validTodos);

  const session = readSession();
  expect(session.algorithm.initialized).toBe(true);
  expect(session.algorithm.initializedAt).toBeString();
  expect(session.algorithm.todowriteSeenAt).toBeString();
  await expect(beforeTool("read")).resolves.toBeUndefined();
});

test("preserves initializedAt after repeated valid todowrite", async () => {
  const firstTimestamp = "2026-05-12T01:02:03.000Z";
  writeState(true, firstTimestamp);

  await afterTodowrite(validTodos);

  expect(readSession().algorithm.initializedAt).toBe(firstTimestamp);
});

test("initialized=true without todowriteSeenAt still blocks non-todowrite tools", async () => {
  // Regression: durable sessions set `initialized: true` when the ISA stub is
  // scaffolded, *before* any todowrite call. The hard-stop must NOT bypass on
  // initialized alone — only on actual todowrite observation.
  writeState(true, "2026-05-12T01:02:03.000Z");
  await expect(beforeTool("read")).rejects.toThrow(
    "ALGORITHM-lite requires todowrite",
  );
});

test("todowriteSeenAt set means the gate is open", async () => {
  writeState(
    true,
    "2026-05-12T01:02:03.000Z",
    "2026-05-12T01:02:04.000Z",
  );
  await expect(beforeTool("read")).resolves.toBeUndefined();
});

test("Algorithm-lite directive preserves visible PLAN subprocess markers", async () => {
  writeState(false);
  const output = { system: [] as string[] };
  await hooks["experimental.chat.system.transform"]?.({ sessionID }, output);
  const system = output.system.join("\n");

  expect(system).toContain("Algorithm-lite");
  expect(system).not.toContain("durable-ISA contract");
  expect(system).toContain("OBSERVE → THINK → PLAN → BUILD → EXECUTE → VERIFY → LEARN");
  expect(system).toContain("DELIVERABLE MANIFEST");
  expect(system).toContain("DELEGATION GATE");
  expect(system).toContain("DELEGATION GATE is binding");
  expect(system).toContain("unfamiliar-code investigation");
  expect(system).toContain("pattern searches spanning multiple directories");
  expect(system).toContain("post-change verification");
  expect(system).not.toContain("Prefer subagents");
  expect(system).not.toContain("or explicitly state why not");
  expect(system).toContain("PARALLELISM OPPORTUNITY SCAN");
});

test("native broad codebase prompt marks delegation without blocking reads", async () => {
  const sid = "ses_test_native_delegation_gate";
  const session = await classifyViaHook("Look at the codebase.", sid);
  expect(session.mode).toBe("NATIVE");
  expect(session.delegation?.required).toBe(true);
  expect(session.delegation?.reason).toContain("codebase");

  const output = { system: [] as string[] };
  await hooks["experimental.chat.system.transform"]?.({ sessionID: sid }, output);
  const system = output.system.join("\n");
  expect(system).toContain("DELEGATION_REQUIRED: true");
  expect(system).toContain("Task subagents before direct broad reads");

  await expect(beforeToolFor(sid, "read")).resolves.toBeUndefined();
  await expect(beforeToolFor(sid, "task")).resolves.toBeUndefined();
  await afterTaskFor(sid);
  await expect(beforeToolFor(sid, "read")).resolves.toBeUndefined();
});

test("existing native session re-arms delegation without blocking direct tools", async () => {
  const sid = "ses_test_followup_delegation_gate";
  const first = await classifyViaHook("Show me the current file.", sid);
  expect(first.mode).toBe("NATIVE");
  expect(first.delegation).toBeUndefined();

  const second = await classifyViaHook("Now look across the codebase.", sid);
  expect(second.mode).toBe("NATIVE");
  expect(second.delegation?.required).toBe(true);
  expect(second.delegation?.taskSeenAt).toBeUndefined();
  await expect(beforeToolFor(sid, "grep")).resolves.toBeUndefined();
  await afterTaskFor(sid);
  await expect(beforeToolFor(sid, "grep")).resolves.toBeUndefined();
});

test("existing broad follow-up resets delegation advisory without Task blocking", async () => {
  const sid = "ses_test_delegation_rearm_after_task";
  await classifyViaHook("Look at the codebase.", sid);
  await afterTaskFor(sid);
  await expect(beforeToolFor(sid, "read")).resolves.toBeUndefined();

  const second = await classifyViaHook("Now investigate the repository for similar issues.", sid);
  expect(second.delegation?.required).toBe(true);
  expect(second.delegation?.taskSeenAt).toBeUndefined();
  await expect(beforeToolFor(sid, "read")).rejects.toThrow(
    "requires todowrite",
  );
  await hooks["tool.execute.after"]?.(
    {
      tool: "todowrite",
      sessionID: sid,
      callID: "call_todowrite",
      args: { todos: validTodos },
    },
    { title: "", output: "", metadata: {} },
  );
  await expect(beforeToolFor(sid, "read")).resolves.toBeUndefined();
});

test("algorithm delegation advisory does not block direct reads after todowrite", async () => {
  const sid = "ses_test_algorithm_delegation_gate";
  const session = await classifyViaHook(
    "Please refactor the auth service, add migration tests, and update integration coverage.",
    sid,
  );
  expect(session.mode).toBe("ALGORITHM");
  expect(session.delegation?.required).toBe(true);

  await expect(beforeToolFor(sid, "read")).rejects.toThrow(
    "requires todowrite",
  );
  await hooks["tool.execute.after"]?.(
    {
      tool: "todowrite",
      sessionID: sid,
      callID: "call_todowrite",
      args: { todos: validTodos },
    },
    { title: "", output: "", metadata: {} },
  );
  await expect(beforeToolFor(sid, "read")).resolves.toBeUndefined();
  await afterTaskFor(sid);
  await expect(beforeToolFor(sid, "read")).resolves.toBeUndefined();
});

async function classifyViaHook(
  promptText: string,
  sid: string,
  input: Record<string, unknown> = {},
) {
  await hooks["chat.message"]?.(
    { sessionID: sid, ...input },
    { parts: [{ type: "text", text: promptText }] },
  );
  return JSON.parse(readFileSync(statePath, "utf8")).sessions[sid];
}

test("Task subagent prompts bypass mode routing and tool gates", async () => {
  const sid = "ses_test_task_subagent_explore";
  const session = await classifyViaHook(
    "Review the PAI opencode plugin layer in /home/james/dotfiles and report findings.",
    sid,
    { agent: "explore" },
  );
  expect(session).toBeUndefined();
  await expect(
    hooks["tool.execute.before"]?.(
      { tool: "read", sessionID: sid, callID: "call_read" },
      { args: {} },
    ),
  ).resolves.toBeUndefined();
});

test("Task subagent bypass clears stale router state", async () => {
  const session = await classifyViaHook(
    "Review the PAI opencode plugin layer in /home/james/dotfiles and report findings.",
    sessionID,
    { agent: "explore" },
  );
  expect(session).toBeUndefined();
  expect(readSession()).toBeUndefined();
  await expect(beforeTool("read")).resolves.toBeUndefined();
});

test("primary build agent prompts still route through Algorithm", async () => {
  const sid = "ses_test_primary_build_algorithm";
  const session = await classifyViaHook(
    "Please refactor the auth service, add migration tests, and update integration coverage.",
    sid,
    { agent: "build" },
  );
  expect(session.mode).toBe("ALGORITHM");
});

test("primary plan agent prompts still route through Algorithm", async () => {
  const sid = "ses_test_primary_plan_algorithm";
  const session = await classifyViaHook(
    "Create an implementation plan for refactoring the auth service and updating integration coverage.",
    sid,
    { agent: "plan" },
  );
  expect(session.mode).toBe("ALGORITHM");
});

test("explicit pai-algorithm subagent remains router-managed", async () => {
  const sid = "ses_test_pai_algorithm_subagent";
  const session = await classifyViaHook(
    "Run the full Algorithm to implement this complex multi-step task.",
    sid,
    { agent: "pai-algorithm" },
  );
  expect(session.mode).toBe("ALGORITHM");
});

test("unknown primary-like agent still routes through Algorithm", async () => {
  const sid = "ses_test_unknown_agent_algorithm";
  const session = await classifyViaHook(
    "Please refactor the auth service, add migration tests, and update integration coverage.",
    sid,
    { agent: "custom-primary" },
  );
  expect(session.mode).toBe("ALGORITHM");
});

test("worker agents bypass router by name", async () => {
  const general = await classifyViaHook(
    "Run this composed custom-agent prompt as an isolated worker.",
    "ses_test_general_bypass_by_name",
    { agent: "general" },
  );
  const engineer = await classifyViaHook(
    "Please refactor the auth service, add migration tests, and update integration coverage.",
    "ses_test_pai_engineer_bypass_by_name",
    { agent: "pai-engineer" },
  );
  const architect = await classifyViaHook(
    "Design an auth service architecture and identify integration boundaries.",
    "ses_test_pai_architect_bypass_by_name",
    { agent: "pai-architect" },
  );
  expect(general).toBeUndefined();
  expect(engineer).toBeUndefined();
  expect(architect).toBeUndefined();
});

test("explicit subagent mode bypasses PAI workers", async () => {
  const engineer = await classifyViaHook(
    "Please refactor the auth service, add migration tests, and update integration coverage.",
    "ses_test_pai_engineer_subagent_bypass",
    { agent: "pai-engineer", mode: "subagent" },
  );
  const architect = await classifyViaHook(
    "Design an auth service architecture and identify integration boundaries.",
    "ses_test_pai_architect_subagent_bypass",
    { agent: "pai-architect", mode: "subagent" },
  );
  expect(engineer).toBeUndefined();
  expect(architect).toBeUndefined();
});

test("session naming sub-agent prompt bypasses router injection", async () => {
  const sid = "ses_test_subagent_naming";
  const session = await classifyViaHook(
    'You are naming a work session. Generate an EXACTLY 4-word title that reads like a short news headline. Reply with CLAUDE_AUTH_OK only.',
    sid,
  );
  expect(session).toBeUndefined();

  const output = { system: [] as string[] };
  await hooks["experimental.chat.system.transform"]?.({ sessionID: sid }, output);
  expect(output.system).toEqual([]);
});

for (const utilityAgent of ["title", "summary", "compaction"]) {
  test(`hidden ${utilityAgent} agent bypasses router injection without deleting primary state`, async () => {
    const output = { parts: [{ type: "text", text: "Create a concise utility response." }] };
    await hooks["chat.message"]?.({ sessionID, agent: utilityAgent }, output);

    expect(readSession().messageCount).toBe(1);

    const system = { system: ["base"] as string[] };
    await hooks["experimental.chat.system.transform"]?.(
      { sessionID, agent: utilityAgent },
      system,
    );
    expect(system.system).toEqual(["base"]);

    await expect(
      hooks["tool.execute.before"]?.(
        { tool: "read", sessionID, agent: utilityAgent, callID: `call_${utilityAgent}_read` },
        { args: {} },
      ),
    ).resolves.toBeUndefined();
  });
}

test("summary generator sub-agent prompt bypasses router injection", async () => {
  const sid = "ses_test_subagent_summary";
  const session = await classifyViaHook(
    "Create a 2-4 word complete sentence summarizing the user's request. Output only the sentence.",
    sid,
  );
  expect(session).toBeUndefined();
});

test("sentiment scorer sub-agent prompt bypasses router injection", async () => {
  const sid = "ses_test_subagent_sentiment";
  const session = await classifyViaHook(
    "Analyze James Schriever's message for emotional sentiment toward Loop. Loop must NEVER self-rate. OUTPUT FORMAT (JSON only): { rating, sentiment, confidence }",
    sid,
  );
  expect(session).toBeUndefined();
});

test("real user algorithm prompt still classifies ALGORITHM", async () => {
  const sid = "ses_test_real_algorithm";
  const session = await classifyViaHook(
    "Please refactor the auth service to split user provisioning from token issuance, add migration tests, and update the integration suite to cover both paths end to end.",
    sid,
  );
  expect(session.mode).toBe("ALGORITHM");
});

test("explicit Algorithm-lite no-ISA prompt stays lite despite ISA keyword", async () => {
  const sid = "ses_test_explicit_lite_no_isa";
  const session = await classifyViaHook(
    "Use Algorithm-lite. Do not create an ISA. Perform a tiny verified diagnostic of PiPerspective setup: check `pi --version` and check `~/.pai/settings.json` to confirm Standard and Extended include THINK, PLAN, VERIFY. Then report the result using the full PAI Algorithm seven phase labels through VERIFY and LEARN.",
    sid,
  );
  expect(session.mode).toBe("ALGORITHM");
  expect(session.algorithm?.contract).toBe("lite");
  expect(session.isaPath).toBeUndefined();
});

// -----------------------------------------------------------------------------
// Skill preamble stripping — a trivial user tail must NOT escalate to durable
// ISA just because the auto-injected skill body contains ISA escalation
// keywords (delete, remove, production, schema, etc.).
// -----------------------------------------------------------------------------

const automationSkillBody = `# Automation Skill

Manage scheduled tasks, webhook endpoints, and notification delivery for PAI.

## Sections

- **Cron Management** — add, list, update, and delete cron jobs
- **Webhook Management** — register webhook routes with named transform modules
- **Notification** — send alerts via Telegram

---

## Cron Management

Read \`References/cron-jobs.json\`. Each job has id, name, schedule, type, enabled, lockName, logFile, timezone.

### Adding a Cron Job

1. Add the job to the registry
2. Run the install workflow to regenerate the crontab

### Removing a Cron Job

1. Remove the job entry from the registry
2. Apply the change to delete the crontab line

## Routing Logic

- "Add a cron job" → Cron Management workflow
- "Remove a cron job" → Cron Management workflow
- "Check cron health" → Cron Health Check workflow

`;

test("skill preamble + trivial tail classifies NATIVE, not durable ISA", async () => {
  const sid = "ses_test_skill_preamble_tail";
  const session = await classifyViaHook(
    automationSkillBody + "\ncan you review the cron jobs that are setup on this system",
    sid,
  );
  // Expected: classify the *tail* ("can you review the cron jobs...") which is
  // a short read-only request, not the skill body which contains "delete",
  // "remove", etc. The tail should land in NATIVE or ALGORITHM-lite, but never
  // in durable ISA contract.
  expect(session.algorithm?.contract === "isa").toBe(false);
});

test("skill preamble + complex algorithm tail still creates durable ISA when warranted", async () => {
  const sid = "ses_test_skill_preamble_algorithm";
  const session = await classifyViaHook(
    automationSkillBody +
      "\nPlease implement a full database migration to move all cron job state into postgres, add schema versioning, and deploy to production with a force-push rollback plan.",
    sid,
  );
  expect(session.mode).toBe("ALGORITHM");
  expect(session.algorithm?.contract).toBe("isa");
});

// -----------------------------------------------------------------------------
// Durable-ISA todowrite-first enforcement (parallel to ALGORITHM-lite).
// -----------------------------------------------------------------------------

const durableSessionID = "ses_test_algorithm_durable";

function writeDurableState(
  initialized = false,
  todowriteSeenAt?: string,
) {
  writeFileSync(
    statePath,
    JSON.stringify(
      {
        sessions: {
          [durableSessionID]: {
            mode: "ALGORITHM",
            classifiedAt: "2026-05-14T00:00:00.000Z",
            messageCount: 1,
            firstPrompt: "durable test prompt",
            slug: "test-durable-slug",
            isaPath: "/tmp/test-isa.md",
            algorithm: {
              contract: "isa",
              initialized,
              ...(todowriteSeenAt ? { todowriteSeenAt } : {}),
            },
            algorithmActivatedMessageCount: 1,
          },
        },
        updated_at: "2026-05-14T00:00:00.000Z",
      },
      null,
      2,
    ),
    "utf8",
  );
}

function beforeToolDurable(tool: string) {
  return hooks["tool.execute.before"]?.(
    { tool, sessionID: durableSessionID, callID: `call_${tool}` },
    { args: {} },
  );
}

function afterTodowriteDurable(todos: Array<{ content: string; status: string; priority: string }>) {
  return hooks["tool.execute.after"]?.(
    {
      tool: "todowrite",
      sessionID: durableSessionID,
      callID: "call_todowrite",
      args: { todos },
    },
    { title: "", output: "", metadata: {} },
  );
}

function readDurableSession() {
  return JSON.parse(readFileSync(statePath, "utf8")).sessions[durableSessionID];
}

test("durable-ISA blocks read before todowrite", async () => {
  writeDurableState(false);
  await expect(beforeToolDurable("read")).rejects.toThrow(
    "ALGORITHM durable-ISA requires todowrite",
  );
});

test("durable-ISA allows todowrite before initialization", async () => {
  writeDurableState(false);
  await expect(beforeToolDurable("todowrite")).resolves.toBeUndefined();
});

test("durable-ISA initializes after valid todowrite and preserves contract", async () => {
  writeDurableState(false);
  await afterTodowriteDurable(validTodos);
  const session = readDurableSession();
  expect(session.algorithm.initialized).toBe(true);
  expect(session.algorithm.contract).toBe("isa");
  expect(session.algorithm.todowriteSeenAt).toBeString();
  await expect(beforeToolDurable("bash")).resolves.toBeUndefined();
});

test("durable-ISA: initialized=true alone does NOT open the gate (regression)", async () => {
  // This was the Critical bug fixed: durable sessions had `initialized: true`
  // set as soon as the ISA stub was scaffolded by initializeAlgorithmState,
  // which made tool.execute.before's old `if (initialized) return` short-circuit
  // skip the todowrite-first hard-stop on the very first turn.
  writeDurableState(true);
  await expect(beforeToolDurable("read")).rejects.toThrow(
    "ALGORITHM durable-ISA requires todowrite",
  );
});

test("durable-ISA: todowriteSeenAt set means the gate is open", async () => {
  writeDurableState(true, "2026-05-14T01:02:03.000Z");
  await expect(beforeToolDurable("bash")).resolves.toBeUndefined();
});

test("durable-ISA directive references current Algorithm version", async () => {
  writeDurableState(false);
  const output = { system: [] as string[] };
  await hooks["experimental.chat.system.transform"]?.(
    { sessionID: durableSessionID },
    output,
  );
  const system = output.system.join("\n");

  expect(system).toContain("PAI Algorithm v6.4.0");
  expect(system).toContain("durable-ISA");
  expect(system).toContain("ISA scaffold pre-created at: /tmp/test-isa.md");
  expect(system).toContain("OBSERVE");
  expect(system).toContain("THINK");
  expect(system).toContain("PLAN");
  expect(system).toContain("DELEGATION GATE is binding");
  expect(system).toContain("unfamiliar-code investigation");
  expect(system).toContain("pattern searches spanning multiple directories");
  expect(system).toContain("post-change verification");
  expect(system).not.toContain("Prefer subagents");
  expect(system).not.toContain("or explicitly state why not");
  expect(system).toContain("BUILD");
  expect(system).toContain("EXECUTE");
  expect(system).toContain("VERIFY");
  expect(system).toContain("LEARN");
});

// -----------------------------------------------------------------------------
// Skill preamble wrapper regression — opencode core may emit either a tagged
// `<skill_content name="...">…</skill_content>` block or a fenced ```skill
// block. The router must strip both so the user tail drives classification.
// -----------------------------------------------------------------------------

test("tagged <skill_content> wrapper + trivial tail does NOT escalate to durable ISA", async () => {
  const sid = "ses_test_skill_content_wrapper";
  const wrapped =
    '<skill_content name="Automation">\n' +
    automationSkillBody +
    "\n</skill_content>\n\ncan you list cron jobs configured on this system";
  const session = await classifyViaHook(wrapped, sid);
  expect(session.algorithm?.contract === "isa").toBe(false);
});

test("fenced ```skill wrapper + trivial tail does NOT escalate to durable ISA", async () => {
  const sid = "ses_test_skill_fenced_wrapper";
  const wrapped =
    "```skill name=Automation\n" +
    automationSkillBody +
    "\n```\n\ncan you list cron jobs configured on this system";
  const session = await classifyViaHook(wrapped, sid);
  expect(session.algorithm?.contract === "isa").toBe(false);
});
