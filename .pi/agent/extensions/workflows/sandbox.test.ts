import assert from "node:assert/strict";
import { test } from "node:test";
import { runWorkflowSandbox } from "./sandbox.ts";

function run(
  source: string,
  overrides: Partial<Parameters<typeof runWorkflowSandbox>[0]> = {},
) {
  const abort = new AbortController();
  return runWorkflowSandbox({
    source,
    args: undefined,
    cwd: process.cwd(),
    signal: abort.signal,
    onAgent: async (prompt) => ({ ok: true, output: `reply:${prompt}` }),
    onPhase: () => {},
    ...overrides,
  });
}

test("sandbox exposes only workflow capabilities and validates results", async () => {
  const phases: string[] = [];
  const result = await run(
    `
      phase("Gather");
      const replies = await parallel([
        () => agent("one"),
        () => agent("two"),
      ], { concurrency: 99 });
      return {
        replies: replies.map((reply) => reply.output),
        processType: typeof process,
        requireType: typeof require,
        fetchType: typeof fetch,
      };
    `,
    { onPhase: (title) => phases.push(title) },
  );
  assert.deepEqual(result, {
    replies: ["reply:one", "reply:two"],
    processType: "undefined",
    requireType: "undefined",
    fetchType: "undefined",
  });
  assert.deepEqual(phases, ["Gather"]);
});

test("sandbox result serialization handles cycles and bigint", async () => {
  const result = await run(`
    const value = { count: 7n };
    value.self = value;
    return value;
  `);
  assert.deepEqual(result, { count: "7n", self: "[circular]" });
});

test("sandbox rejects unawaited agent calls", async () => {
  let calls = 0;
  await assert.rejects(
    run(`agent("orphan"); return "done";`, {
      onAgent: async () => {
        calls++;
        return { ok: true, output: "unexpected" };
      },
    }),
    /unawaited agent/,
  );
  assert.equal(calls, 0);
});

test("sandbox source cannot escape the host accounting wrapper", async () => {
  let calls = 0;
  await assert.rejects(
    run(
      `}), agent("orphan"), Promise.resolve("bypass"); (async function () {`,
      {
        onAgent: async () => {
          calls++;
          return { ok: true, output: "unexpected" };
        },
      },
    ),
    /unawaited agent/,
  );
  assert.equal(calls, 0);
});

test("sandbox VM still rejects non-yielding synchronous code", async () => {
  await assert.rejects(run(`while (true) {}`), /timed out/);
});

test("workflow agent invocations have no per-request wall timer", async () => {
  let signalAborted = false;
  const result = await run(`return (await agent("delayed")).output;`, {
    onAgent: async (_prompt, _options, signal) => {
      await new Promise((resolve) => setTimeout(resolve, 30));
      signalAborted = signal.aborted;
      return { ok: true, output: "completed" };
    },
  });

  assert.equal(result, "completed");
  assert.equal(signalAborted, false);
});

test("workflow cancellation aborts a pending agent request", async () => {
  const controller = new AbortController();
  let startedResolve: (() => void) | undefined;
  const started = new Promise<void>((resolve) => {
    startedResolve = resolve;
  });
  let requestAborted = false;
  const pending = run(`return await agent("pending");`, {
    signal: controller.signal,
    onAgent: async (_prompt, _options, signal) => {
      startedResolve?.();
      await new Promise<void>((resolve) => {
        signal.addEventListener(
          "abort",
          () => {
            requestAborted = true;
            resolve();
          },
          { once: true },
        );
      });
      return { ok: false, output: "", error: "Agent was aborted" };
    },
  });

  await started;
  controller.abort(new Error("cancel fixture"));
  await assert.rejects(pending, /cancel fixture/);
  assert.equal(requestAborted, true);
});

// Regression guard for the pre-6997387 runaway: a script's `while (true)
// await agent(...)` must not hang the sandbox once the parent aborts the
// run's AbortSignal (mimicking the controller overshooting the agent-call
// budget). The sandbox must surface the abort reason on its returned
// promise.
test("sandbox checkpoint resolves with host decision", async () => {
  let received: { id: number; name: string; prompt: string } | undefined;
  const result = await run(
    `const d = await checkpoint({ name: "gate", prompt: "ok?" }); return d;`,
    {
      onCheckpoint: async (request) => {
        received = {
          id: request.id,
          name: request.name,
          prompt: request.prompt,
        };
        return "approved";
      },
    },
  );
  assert.equal(result, "approved");
  assert.deepEqual(received, { id: 1, name: "gate", prompt: "ok?" });
});

test("sandbox checkpoint surfaces host rejection as a script error", async () => {
  await assert.rejects(
    run(
      `const d = await checkpoint({ name: "gate", prompt: "ok?" }); return d;`,
      {
        onCheckpoint: async () => {
          throw new Error("denied by host");
        },
      },
    ),
    /denied by host/,
  );
});

test("sandbox withWorktree provides a scope and runs the callback", async () => {
  let closeCalls = 0;
  const result = await run(
    `const out = await withWorktree("iso", async (s) => s.path); return out;`,
    {
      onWorktreeOpen: async (request) => {
        assert.equal(request.name, "iso");
        return { path: "/tmp/wt" };
      },
      onWorktreeClose: async (request) => {
        closeCalls++;
        assert.equal(request.name, "iso");
      },
    },
  );
  assert.equal(result, "/tmp/wt");
  assert.equal(closeCalls, 1);
});

test("sandbox withWorktree closes even when the callback throws", async () => {
  let closeCalls = 0;
  await assert.rejects(
    run(
      `await withWorktree("iso", async () => { throw new Error("boom"); });`,
      {
        onWorktreeOpen: async () => ({ path: "/tmp/wt" }),
        onWorktreeClose: async () => {
          closeCalls++;
        },
      },
    ),
    /boom/,
  );
  assert.equal(closeCalls, 1);
});

test("sandbox withWorktree surfaces an open failure", async () => {
  let closeCalls = 0;
  await assert.rejects(
    run(`await withWorktree("iso", async () => "never");`, {
      onWorktreeOpen: async () => {
        throw new Error("open denied");
      },
      onWorktreeClose: async () => {
        closeCalls++;
      },
    }),
    /open denied/,
  );
  assert.equal(closeCalls, 0);
});

test("runaway agent loop terminates when the run's signal aborts", async () => {
  const abort = new AbortController();
  let calls = 0;
  await assert.rejects(
    run(`while (true) { await agent("x"); }`, {
      signal: abort.signal,
      onAgent: async () => {
        calls++;
        if (calls >= 3) {
          abort.abort(new Error("Workflow exceeded the agent-call budget"));
        }
        return { ok: false, output: "", error: "aborted" };
      },
    }),
    /agent-call budget/,
  );
});
