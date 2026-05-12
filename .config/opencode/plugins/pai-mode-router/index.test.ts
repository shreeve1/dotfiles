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

function writeState(initialized = false, initializedAt?: string) {
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
  await expect(beforeTool("read")).resolves.toBeUndefined();
});

test("preserves initializedAt after repeated valid todowrite", async () => {
  const firstTimestamp = "2026-05-12T01:02:03.000Z";
  writeState(true, firstTimestamp);

  await afterTodowrite(validTodos);

  expect(readSession().algorithm.initializedAt).toBe(firstTimestamp);
});
