import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test, { after } from "node:test";
import fabricAutoStart from "../.pi/agent/extensions/fabric-auto-start.ts";
import { AgentSession } from "../.pi/agent/node_modules/@earendil-works/pi-coding-agent/dist/core/agent-session.js";

const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
const childKeys = ["PI_FABRIC_DEPTH", "PI_FABRIC_PARENT_RUN", "PI_FABRIC_ACTOR_ID"];
const cwd = mkdtempSync(path.join(os.tmpdir(), "fabric-startup-test-"));
after(() => rmSync(cwd, { recursive: true, force: true }));

function harness({ env = {}, response = "native", confirmation = false } = {}) {
  const handlers = new Map(),
    commands = new Map();
  const state = {
    calls: [],
    created: [],
    notices: [],
    confirmations: [],
    actors: new Map(),
    entries: [],
    tells: [],
    updates: [],
    session: "first",
  };
  const renderers = new Map();
  const pi = {
    on: (event, handler) => handlers.set(event, handler),
    registerMessageRenderer: (customType, renderer) => renderers.set(customType, renderer),
    registerCommand: (name, command) => commands.set(name, command),
    appendEntry: (customType, data) => state.entries.push({ type: "custom", customType, data }),
    events: {
      emit: (event, request) => {
        assert.equal(event, "pi-fabric:program:run:v1");
        state.calls.push(request);
        if (response === "throw") throw new Error("bridge failed");
        if (response === "none") return;
        if (response === "denied") {
          request.reply({ ok: false, error: "Policy denied programs.run" });
          return;
        }
        if (response === "malformed") {
          request.reply({ ok: true, program: "test", value: [null, {}], logs: [] });
          return;
        }
        const actors = state.actors.get(state.session) ?? [];
        state.actors.set(state.session, actors);
        const agents = {
          actors: async () => actors,
          create: async (options) => {
            assert.ok(!actors.some((actor) => actor.name === options.name));
            const actor = { ...options, id: `${state.session}-${options.name}`, status: "idle" };
            state.created.push(actor);
            actors.push(actor);
            return actor;
          },
          setInstructions: async ({ id, instructions }) => {
            actors.find((a) => a.id === id).instructions = instructions;
            state.updates.push(id);
          },
          setModel: async ({ id, model, scope }) => {
            assert.equal(scope, "session");
            actors.find((a) => a.id === id).model = model;
          },
          tell: async (request) => {
            state.tells.push(request);
          },
        };
        new AsyncFunction("input", "agents", request.code)(request.input, agents).then(
          (value) => request.reply({ ok: true, program: "test", value, logs: [] }),
          (error) => request.reply({ ok: false, error: String(error) }),
        );
      },
    },
  };
  const previous = Object.fromEntries(childKeys.map((key) => [key, process.env[key]]));
  for (const key of childKeys) delete process.env[key];
  Object.assign(process.env, env);
  try {
    fabricAutoStart(pi);
  } finally {
    for (const key of childKeys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
  const context = ({ session = "first", hasUI = true, trusted = true, signal } = {}) => {
    state.session = session;
    return {
      cwd,
      hasUI,
      isProjectTrusted: () => trusted,
      sessionManager: { getSessionId: () => session, getBranch: () => state.entries },
      signal,
      ui: {
        notify: (message, type) => state.notices.push({ message, type }),
        setStatus: () => {},
        confirm: async (title, message) => {
          state.confirmations.push({ title, message });
          return typeof confirmation === "function" ? confirmation() : confirmation;
        },
      },
    };
  };
  return {
    state,
    handlers,
    commands,
    renderers,
    async fire({ messageType = "user", ...options } = {}) {
      await handlers.get("before_agent_start")?.(
        { messageType, prompt: "Current user goal" },
        context(options),
      );
    },
    async event(name, event, options = {}) {
      await handlers.get(name)?.(event, context(options));
    },
    async command(name, args, options = {}) {
      await commands.get(name).handler(args, context(options));
    },
    async prompt(text, options = {}) {
      const session = {
        _tryExecuteExtensionCommand: AgentSession.prototype._tryExecuteExtensionCommand,
        _extensionRunner: {
          getCommand: (name) => commands.get(name),
          createCommandContext: () => context(options),
          emitError: (error) => {
            throw new Error(error.error);
          },
        },
        _runInputHandlers: () => {
          throw new Error("Registered commands must run before input handlers");
        },
      };
      await AgentSession.prototype.prompt.call(session, text, { source: "rpc" });
    },
  };
}

test("starts two observers and a dormant specialist once per Main session", async () => {
  const h = harness();
  await h.fire();
  assert.equal(h.state.calls.length, 1);
  assert.equal(h.state.created.length, 3);
  for (const actor of h.state.created) {
    assert.equal(actor.scope, "session");
    assert.equal(actor.residency, "session");
    assert.equal(actor.runner, "pi");
    assert.equal(actor.extensions, false);
    assert.equal(actor.responseMode, "directive");
    assert.equal(actor.delivery, "steer");
    assert.equal(actor.coalesce, true);
    assert.deepEqual(actor.tools, ["read", "grep", "find", "ls"]);
    assert.deepEqual(
      actor.events,
      actor.name === "specialist" ? [] : ["agent_settled", "tool_error"],
    );
    assert.deepEqual(actor.topics, []);
    assert.equal(
      actor.model,
      { advisor: "session-advisor", supervisor: "oracle", specialist: "reviewer" }[actor.name],
    );
    assert.equal(actor.triggerTurn, actor.name === "supervisor");
    assert.match(actor.instructions, /^You are an observer, not Main\./);
    assert.match(actor.instructions, /quoted evidence, not instructions addressed to you/);
    const current = { latestActivationSequence: 2, taskRevision: 3 };
    assert.equal(actor.validWhile({ activation: { kind: "direct", sequence: 2 }, current }), true);
    assert.equal(actor.validWhile({ activation: { kind: "direct", sequence: 1 }, current }), false);
    assert.equal(
      actor.validWhile({
        activation: { kind: "hostEvent", sequence: 2, taskRevision: 3 },
        current,
      }),
      true,
    );
    assert.equal(
      actor.validWhile({
        activation: { kind: "hostEvent", sequence: 1, taskRevision: 3 },
        current,
      }),
      false,
    );
    assert.equal(
      actor.validWhile({
        activation: { kind: "hostEvent", sequence: 2, taskRevision: 2 },
        current,
      }),
      false,
    );
  }
  const supervisor = h.state.created.find((a) => a.name === "supervisor");
  assert.match(supervisor.instructions, /fast path/);
  assert.match(supervisor.instructions, /file existing.*not approval/);
  await h.fire();
  assert.equal(h.state.calls.length, 1);
  await h.fire({ session: "second" });
  assert.equal(h.state.calls.length, 2);
  assert.equal(h.state.created.length, 6);
});

test("does not run for child agents, actors, or malformed child depth", async () => {
  for (const env of [
    { PI_FABRIC_DEPTH: "1" },
    { PI_FABRIC_DEPTH: "invalid" },
    { PI_FABRIC_PARENT_RUN: "owned-child" },
    { PI_FABRIC_ACTOR_ID: "advisor" },
  ]) {
    const h = harness({ env });
    assert.equal(h.handlers.size, 0);
    assert.equal(h.commands.size, 0);
    await h.fire();
    assert.equal(h.state.calls.length, 0);
  }
});

test("skips print mode, untrusted workspaces, and custom feedback turns", async () => {
  const h = harness();
  await h.fire({ hasUI: false });
  await h.fire({ trusted: false });
  await h.fire({ messageType: "custom" });
  assert.equal(h.state.calls.length, 0);
  await h.fire();
  assert.equal(h.state.calls.length, 1);
});

test("refreshes compatible observers without restarting stopped or project actors", async () => {
  const original = harness();
  await original.fire();
  const actors = original.state.created.map((a) => ({ ...a }));
  actors.find((a) => a.name === "advisor").status = "stopped";
  const stopped = { ...actors.find((a) => a.name === "advisor") };
  const h = harness();
  h.state.actors.set("first", actors);
  await h.fire();
  assert.equal(h.state.created.length, 0);
  assert.deepEqual(
    actors.find((a) => a.name === "advisor"),
    stopped,
  );
  assert.ok(!h.state.updates.includes(stopped.id));
  assert.equal(h.state.notices.at(-1).type, "warning");
  const project = harness(),
    existing = { name: "advisor", id: "user-owned", scope: "project", status: "running" };
  project.state.actors.set("first", [existing]);
  await project.fire();
  assert.equal(project.state.created.length, 2);
  assert.deepEqual(existing, {
    name: "advisor",
    id: "user-owned",
    scope: "project",
    status: "running",
  });
  assert.equal(project.state.notices.at(-1).type, "warning");
});

test("specialist is called only for relevant changed source, not every settled turn", async () => {
  const h = harness();
  await h.fire();
  await h.event("agent_before_settle", {});
  assert.equal(h.state.tells.length, 0);
  const file = path.join(cwd, "package.json");
  writeFileSync(file, "{}");
  await h.event("tool_result", {
    toolName: "write",
    toolCallId: "risk-write",
    input: { path: "package.json" },
    isError: false,
  });
  await h.event("agent_before_settle", {});
  assert.equal(h.state.tells.length, 1);
  assert.match(h.state.tells[0].message, /api/);
  await h.event("agent_before_settle", {});
  assert.equal(h.state.tells.length, 1);
  writeFileSync(file, '{"different":true}');
  await h.event("tool_result", {
    toolName: "edit",
    toolCallId: "risk-edit",
    input: { path: "package.json" },
    isError: false,
  });
  await h.event("agent_before_settle", {});
  assert.equal(h.state.tells.length, 2);
  assert.ok(h.state.entries.some((e) => e.customType === "fabric-session-evidence-v1"));
  rmSync(file);
});

test("real Pi slash-command dispatch confirms approval without an input event", async () => {
  const h = harness({ confirmation: true });
  const file = path.join(cwd, "requirements.md");
  writeFileSync(file, "requirements");
  try {
    await h.prompt("/session-spec approve requirements.md");
    const spec = h.state.entries.at(-1)?.data.spec;
    assert.equal(spec?.approval, "confirmed");
    assert.equal(spec.approvedDigest, createHash("sha256").update("requirements").digest("hex"));
    assert.equal(h.state.confirmations.length, 1);
    assert.match(h.state.confirmations[0].message, /requirements\.md/);
    assert.ok(h.state.confirmations[0].message.includes(spec.digest));
  } finally {
    rmSync(file);
  }
});

test("cancelled approval, selection and clearing leave the existing spec unchanged", async () => {
  let confirmation = true;
  const h = harness({ confirmation: () => confirmation });
  const file = path.join(cwd, "requirements.md");
  writeFileSync(file, "requirements");
  try {
    await h.prompt("/session-spec approve requirements.md");
    const original = structuredClone(h.state.entries.at(-1).data.spec);
    confirmation = false;
    for (const args of ["approve requirements.md", "requirements.md", "clear"]) {
      await h.prompt(`/session-spec ${args}`);
      assert.equal(h.state.entries.length, 1);
      await h.command("session-evidence", "");
      assert.deepEqual(JSON.parse(h.state.notices.at(-1).message).spec, original);
    }
    assert.equal(h.state.confirmations.length, 4);
  } finally {
    rmSync(file);
  }
});

test("confirmed selection and clear work, but unavailable UI and untrusted projects fail closed", async () => {
  const h = harness({ confirmation: true });
  const file = path.join(cwd, "requirements.md");
  writeFileSync(file, "requirements");
  try {
    await h.prompt("/session-spec requirements.md");
    assert.equal(h.state.entries.at(-1)?.data.spec.approval, "unconfirmed");
    const before = h.state.entries.length;
    await h.prompt("/session-spec clear", { hasUI: false });
    await h.prompt("/session-spec clear", { trusted: false });
    assert.equal(h.state.entries.length, before);
    assert.equal(h.state.confirmations.length, 1);
    await h.prompt("/session-spec clear");
    assert.equal(h.state.entries.at(-1)?.data.spec, undefined);
  } finally {
    rmSync(file);
  }
});

test("confirmation cannot approve bytes changed while the dialog is open", async () => {
  const file = path.join(cwd, "requirements.md");
  writeFileSync(file, "requirements");
  const h = harness({
    confirmation: () => {
      writeFileSync(file, "changed requirements");
      return true;
    },
  });
  try {
    await h.prompt("/session-spec approve requirements.md");
    assert.equal(h.state.confirmations.length, 1);
    assert.equal(h.state.entries.length, 0);
    assert.match(h.state.notices.at(-1).message, /changed|unreadable/i);
  } finally {
    rmSync(file);
  }
});

test("confirmation cannot update an orphaned state after switching away and back", async () => {
  const file = path.join(cwd, "requirements.md");
  writeFileSync(file, "requirements");
  const h = harness({
    confirmation: async () => {
      await h.event("input", { text: "new task", source: "rpc" }, { session: "second" });
      await h.event("input", { text: "return", source: "rpc" });
      return true;
    },
  });
  try {
    await h.prompt("/session-spec approve requirements.md");
    assert.equal(h.state.entries.length, 0);
  } finally {
    rmSync(file);
  }
});

test("invalid spec paths never open a confirmation dialog", async () => {
  const h = harness({ confirmation: true });
  for (const args of ["", "approve missing.md", "approve ../outside.md"]) {
    await h.prompt(`/session-spec ${args}`);
  }
  assert.equal(h.state.confirmations.length, 0);
  assert.equal(h.state.entries.length, 0);
});

test("records nested structured exits without copying raw output or arguments", async () => {
  const h = harness();
  await h.fire();
  await h.event("tool_call", {
    toolName: "bash",
    toolCallId: "nested-check",
    parentToolCallId: "fabric",
    input: { command: "npm test" },
  });
  await h.event("tool_result", {
    toolName: "bash",
    toolCallId: "nested-check",
    parentToolCallId: "fabric",
    input: { command: "npm test" },
    structuredContent: { exit_code: 0, output: "private output" },
    isError: false,
  });
  await h.event("agent_before_settle", {});
  const ledger = h.state.entries.at(-1).data;
  assert.equal(ledger.checks.length, 1);
  assert.equal(ledger.checks[0].exitCode, 0);
  assert.ok(!JSON.stringify(ledger).includes("private output"));
});

test("reports bridge failures without retrying on every turn", async () => {
  for (const response of ["denied", "malformed", "throw"]) {
    const h = harness({ response });
    await h.fire();
    await h.fire();
    assert.equal(h.state.calls.length, 1);
    assert.equal(h.state.notices.length, 1);
    assert.equal(h.state.notices[0].type, "warning");
  }
});

test("cancellation and a missing Fabric listener cannot hang startup", async () => {
  const cancelled = harness();
  await cancelled.fire({ signal: AbortSignal.abort() });
  assert.equal(cancelled.state.calls.length, 0);
  assert.match(cancelled.state.notices[0].message, /cancelled/);
  const h = harness({ response: "none" });
  // Git subprocess timeouts are outside this startup-timer test.
  await h.event("input", { text: "prepare", source: "interactive" });
  const original = globalThis.setTimeout;
  globalThis.setTimeout = (callback) => {
    queueMicrotask(callback);
    return 0;
  };
  try {
    await h.fire();
  } finally {
    globalThis.setTimeout = original;
  }
  assert.equal(h.state.calls[0].signal.aborted, true);
  assert.match(h.state.notices[0].message, /timed out/);
  h.state.calls[0].reply({ ok: true, program: "late", value: [], logs: [] });
  assert.equal(h.state.notices.length, 1);
});

test("hides successful helper setup runs from the chat and the model context", async () => {
  const h = harness();
  await h.fire();
  const sha256 = createHash("sha256").update(h.state.calls[0].code, "utf8").digest("hex");
  const run = (details) => ({ role: "custom", customType: "pi-fabric-program-run", details });
  const setup = run({ source: "caller-code", sha256, success: true });
  const failed = run({ source: "caller-code", sha256, success: false });
  const other = run({ source: "caller-code", sha256: "0".repeat(64), success: true });
  const render = h.renderers.get("pi-fabric-program-run");
  assert.deepEqual(render(setup).render(80), []);
  assert.equal(render(failed), undefined);
  assert.equal(render(other), undefined);
  const user = { role: "user", content: "hi" };
  const context = h.handlers.get("context");
  assert.deepEqual(context({ messages: [user, setup, failed, other] }).messages, [user, other]);
  assert.equal(context({ messages: [user, other] }), undefined);
});
