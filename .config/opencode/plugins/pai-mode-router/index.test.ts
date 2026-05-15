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
  expect(system).toContain("PARALLELISM OPPORTUNITY SCAN");
});

async function classifyViaHook(promptText: string, sid: string) {
  await hooks["chat.message"]?.(
    { sessionID: sid },
    { parts: [{ type: "text", text: promptText }] },
  );
  return JSON.parse(readFileSync(statePath, "utf8")).sessions[sid];
}

test("session naming sub-agent prompt classifies MINIMAL with no ISA", async () => {
  const sid = "ses_test_subagent_naming";
  const session = await classifyViaHook(
    'You are naming a work session. Generate an EXACTLY 4-word title that reads like a short news headline. Reply with CLAUDE_AUTH_OK only.',
    sid,
  );
  expect(session.mode).toBe("MINIMAL");
  expect(session.slug).toBeUndefined();
  expect(session.isaPath).toBeUndefined();
});

test("summary generator sub-agent prompt classifies MINIMAL with no ISA", async () => {
  const sid = "ses_test_subagent_summary";
  const session = await classifyViaHook(
    "Create a 2-4 word complete sentence summarizing the user's request. Output only the sentence.",
    sid,
  );
  expect(session.mode).toBe("MINIMAL");
  expect(session.slug).toBeUndefined();
  expect(session.isaPath).toBeUndefined();
});

test("sentiment scorer sub-agent prompt classifies MINIMAL with no ISA", async () => {
  const sid = "ses_test_subagent_sentiment";
  const session = await classifyViaHook(
    "Analyze James Schriever's message for emotional sentiment toward Loop. Loop must NEVER self-rate. OUTPUT FORMAT (JSON only): { rating, sentiment, confidence }",
    sid,
  );
  expect(session.mode).toBe("MINIMAL");
  expect(session.slug).toBeUndefined();
  expect(session.isaPath).toBeUndefined();
});

test("real user algorithm prompt still classifies ALGORITHM", async () => {
  const sid = "ses_test_real_algorithm";
  const session = await classifyViaHook(
    "Please refactor the auth service to split user provisioning from token issuance, add migration tests, and update the integration suite to cover both paths end to end.",
    sid,
  );
  expect(session.mode).toBe("ALGORITHM");
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
