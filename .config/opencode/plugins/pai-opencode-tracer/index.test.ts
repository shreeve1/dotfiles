import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CanonicalEventStore } from "../../../../.pai/src/event-store";
import { mapOpenCodePluginObservationToEvent, resolveOpenCodePaiSession } from "../../../../.pai/src/opencode-tracer";
import PaiOpenCodeTracer from "./index";
import {
  SHARED_IMPORT_CONTRACT,
  extractPromptText,
  normalizePathCategory,
  sanitizeToolEvent,
  sequenceStatePath,
} from "./core";

let runtimeHome: string;
let previousRuntimeHome: string | undefined;
let previousPaiSession: string | undefined;

beforeEach(() => {
  runtimeHome = mkdtempSync(join(tmpdir(), "pai-opencode-tracer-plugin-"));
  previousRuntimeHome = process.env.PAI_RUNTIME_HOME;
  previousPaiSession = process.env.PAI_SESSION_ID;
  process.env.PAI_RUNTIME_HOME = runtimeHome;
  delete process.env.PAI_SESSION_ID;
});

afterEach(() => {
  if (previousRuntimeHome === undefined) delete process.env.PAI_RUNTIME_HOME;
  else process.env.PAI_RUNTIME_HOME = previousRuntimeHome;
  if (previousPaiSession === undefined) delete process.env.PAI_SESSION_ID;
  else process.env.PAI_SESSION_ID = previousPaiSession;
  rmSync(runtimeHome, { recursive: true, force: true });
});

describe("pai-opencode-tracer plugin", () => {
  test("shared .pai/src imports resolve from the plugin runtime path", () => {
    expect(SHARED_IMPORT_CONTRACT.adapterVersion).toBe("opencode-tracer/0.1.0");
    expect(SHARED_IMPORT_CONTRACT.sharedImportRoot).toContain(".pai/src");
  });

  test("chat.message inputs create redacted canonical events", async () => {
    const hooks = await PaiOpenCodeTracer({} as any);
    await hooks["chat.message"]?.(
      { sessionID: "oc-chat", cwd: "/home/james/dotfiles", projectID: "git:dotfiles" },
      { info: { role: "user" }, parts: [{ type: "text", text: "Please remember token=not-a-real-token and inspect .env.local" }] },
    );

    const store = new CanonicalEventStore({ runtimeHome });
    const events = store.listEvents();
    store.close();

    expect(events).toHaveLength(1);
    expect(events[0].event_type).toBe("prompt.submit");
    expect(events[0].project_id).toBe("git:dotfiles");
    expect(events[0].payload_summary).toContain("[REDACTED:generic_assignment_secret]");
    expect(events[0].payload_summary).toContain("[REDACTED_PATH:env_file]");
    expect(JSON.stringify(events[0])).not.toContain("not-a-real-token");
    expect("payload" in events[0]).toBe(false);
    expect("payloads" in events[0]).toBe(false);
  });

  test("tool.execute.after stores only strict allowlist metadata", async () => {
    const hooks = await PaiOpenCodeTracer({} as any);
    await hooks["tool.execute.after"]?.(
      {
        sessionID: "oc-tool",
        tool: "bash",
        cwd: "/home/james/dotfiles",
        args: {
          command: "curl -H 'Authorization: Bearer ghp_rawsecretsecretsecretsecret' https://example.invalid",
          filePath: "/home/james/dotfiles/.env.local",
          nested: { token: "ghp_rawsecretsecretsecretsecret" },
        },
      },
      { exitCode: 1, stdout: "raw body token=not-a-real-token", stderr: "Authorization: Bearer secret" },
    );

    const store = new CanonicalEventStore({ runtimeHome });
    const events = store.listEvents();
    store.close();
    const serialized = JSON.stringify(events);

    expect(events).toHaveLength(1);
    expect(events[0].event_type).toBe("tool.call");
    expect(events[0].payload_summary).toContain("tool:bash");
    expect(events[0].payload_summary).toContain("status:error");
    expect(events[0].payload_summary).toContain("path_category:sensitive");
    expect(serialized).not.toContain("curl -H");
    expect(serialized).not.toContain("Authorization");
    expect(serialized).not.toContain("ghp_raw");
    expect(serialized).not.toContain("raw body");
    expect(serialized).not.toContain(".env.local");
  });

  test("tool.execute.after classifies real OpenCode metadata shape without storing raw output", async () => {
    const hooks = await PaiOpenCodeTracer({} as any);
    await hooks["tool.execute.after"]?.(
      {
        sessionID: "oc-real-tool-shape",
        tool: "bash",
        callID: "call-1",
        args: { command: "failing command with token=raw-secret", filePath: "src/index.ts" },
      },
      {
        title: "Command failed",
        output: "raw command output token=raw-secret Authorization: Bearer secret",
        metadata: { exit: 2 },
      },
    );

    const store = new CanonicalEventStore({ runtimeHome });
    const events = store.listEvents();
    store.close();
    const serialized = JSON.stringify(events);

    expect(events).toHaveLength(1);
    expect(events[0].event_type).toBe("tool.call");
    expect(events[0].payload_summary).toContain("status:error");
    expect(events[0].payload_summary).toContain("exit_code:2");
    expect(events[0].payload_summary).toContain("path_category:workspace");
    expect(serialized).not.toContain("raw-secret");
    expect(serialized).not.toContain("Authorization");
    expect(serialized).not.toContain("raw command output");
  });

  test("sequence state is monotonic across repeated events and plugin reloads", async () => {
    let hooks = await PaiOpenCodeTracer({} as any);
    await hooks["chat.message"]?.({ sessionID: "oc-seq" }, { info: { role: "user" }, parts: [{ type: "text", text: "first" }] });
    await hooks["chat.message"]?.({ sessionID: "oc-seq" }, { info: { role: "user" }, parts: [{ type: "text", text: "second" }] });
    hooks = await PaiOpenCodeTracer({} as any);
    await hooks["tool.execute.after"]?.({ sessionID: "oc-seq", tool: "read", args: { filePath: "README.md" } }, { status: "ok" });

    const store = new CanonicalEventStore({ runtimeHome });
    const events = store.listEvents();
    store.close();

    expect(events.map((event) => event.sequence)).toEqual([1, 2, 3]);
  });

  test("state corruption and sequence collision recover from event store max sequence", async () => {
    const session = resolveOpenCodePaiSession({ opencodeSessionId: "oc-recover" }).pai_session_id;
    const store = new CanonicalEventStore({ runtimeHome });
    store.ingest(mapOpenCodePluginObservationToEvent({
      event: "UserPromptSubmit",
      pai_session_id: session,
      sequence: 1,
      timestamp: "2026-05-17T00:00:00.000Z",
      prompt: "seed",
    }));
    store.close();
    mkdirSync(join(runtimeHome, "state"), { recursive: true });
    writeFileSync(sequenceStatePath(runtimeHome), JSON.stringify({ sessions: { [session]: 0 }, updated_at: "2026-05-17T00:00:00.000Z" }));

    const hooks = await PaiOpenCodeTracer({} as any);
    await hooks["chat.message"]?.({ sessionID: "oc-recover" }, { info: { role: "user" }, parts: [{ type: "text", text: "after recovery" }] });

    const reopened = new CanonicalEventStore({ runtimeHome });
    const events = reopened.listEvents();
    reopened.close();

    expect(events.map((event) => event.sequence)).toEqual([1, 2]);
    expect(JSON.parse(readFileSync(sequenceStatePath(runtimeHome), "utf8")).sessions[session]).toBe(2);
  });

  test("synthetic router primers and internal messages are excluded", async () => {
    const hooks = await PaiOpenCodeTracer({} as any);
    expect(extractPromptText({}, { parts: [{ type: "text", text: "roleless text" }] })).toBeUndefined();
    expect(extractPromptText({}, { info: { role: "user" }, parts: [{ type: "text", synthetic: true, text: "synthetic text" }] })).toBeUndefined();
    await hooks["chat.message"]?.(
      { sessionID: "oc-synthetic" },
      { info: { role: "user" }, parts: [{ type: "text", text: "[pai-mode-router] This session is ALGORITHM. call todowrite with 2-8 tasks" }] },
    );

    const store = new CanonicalEventStore({ runtimeHome });
    expect(store.listEvents()).toEqual([]);
    store.close();
  });

  test("input message parts are captured when explicitly user-authored", async () => {
    const hooks = await PaiOpenCodeTracer({} as any);
    await hooks["chat.message"]?.(
      { sessionID: "oc-input-message", message: { role: "user", parts: [{ type: "text", text: "capture from input message" }] } },
      {},
    );

    const store = new CanonicalEventStore({ runtimeHome });
    const events = store.listEvents();
    store.close();

    expect(events).toHaveLength(1);
    expect(events[0].payload_summary).toContain("capture from input message");
  });

  test("session.idle emits stop markers without depending on final-response hooks", async () => {
    const hooks = await PaiOpenCodeTracer({} as any);
    await hooks.event?.({ event: { type: "session.idle", properties: { sessionID: "oc-idle", projectID: "git:dotfiles" } } });

    const store = new CanonicalEventStore({ runtimeHome });
    const events = store.listEvents();
    store.close();

    expect(events).toHaveLength(1);
    expect(events[0].event_type).toBe("session.stop");
  });

  test("malformed hook input and plugin errors fail closed", async () => {
    const hooks = await PaiOpenCodeTracer({} as any);
    await expect(hooks["chat.message"]?.({}, {})).resolves.toBeUndefined();
    await expect(hooks["tool.execute.after"]?.({ sessionID: "oc-empty" }, {})).resolves.toBeUndefined();
    await expect(hooks.event?.({ event: { type: "other" } })).resolves.toBeUndefined();
  });

  test("path categorization never returns raw paths", () => {
    expect(normalizePathCategory(".env.local", "/home/james/dotfiles")).toBe("sensitive");
    expect(normalizePathCategory("src/index.ts", "/home/james/dotfiles")).toBe("workspace");
    expect(normalizePathCategory("/tmp/tool-output.txt", "/home/james/dotfiles")).toBe("temp");
    expect(sanitizeToolEvent({ tool: "read", args: { filePath: "/home/james/.ssh/id_ed25519" } }, { status: "ok" })?.tool_input).toContain("path_category:sensitive");
  });
});
