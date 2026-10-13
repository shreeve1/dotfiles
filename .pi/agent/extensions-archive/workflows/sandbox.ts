import { randomBytes } from "node:crypto";
import { spawn, type ChildProcess } from "node:child_process";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { safeStringify, toSerializable } from "./serialization.ts";

const MAX_SOURCE_BYTES = 512 * 1024;
const MAX_ARGS_BYTES = 256 * 1024;
const MAX_RESULT_BYTES = 1024 * 1024;
const MAX_AGENT_MESSAGE_BYTES = 512 * 1024;
const MAX_CHECKPOINT_BYTES = 64 * 1024;
const MAX_WORKTREE_BYTES = 8 * 1024;

export interface SandboxAgentOptions {
  label?: unknown;
  phase?: unknown;
  schema?: unknown;
  model?: unknown;
  provider?: unknown;
  effort?: unknown;
  writable?: unknown;
  cwd?: unknown;
}

export interface SandboxAgentResult {
  ok: boolean;
  output: string;
  structured?: unknown;
  error?: string;
}

export interface RunWorkflowSandboxOptions {
  source: string;
  args: unknown;
  cwd: string;
  signal: AbortSignal;
  onAgent: (
    prompt: string,
    options: SandboxAgentOptions,
    signal: AbortSignal,
  ) => Promise<SandboxAgentResult>;
  onPhase: (title: string) => void;
  onCheckpoint?: (
    request: { id: number; name: string; prompt: string; context: unknown },
    signal: AbortSignal,
  ) => Promise<"approved" | "rejected">;
  onWorktreeOpen?: (
    request: { id: number; name: string },
    signal: AbortSignal,
  ) => Promise<{ path: string }>;
  onWorktreeClose?: (request: { id: number; name: string }) => Promise<void>;
}

function byteLength(value: string) {
  return Buffer.byteLength(value, "utf8");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function errorText(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function terminateChild(child: ChildProcess) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  child.kill("SIGTERM");
  const force = setTimeout(() => {
    if (child.exitCode === null && child.signalCode === null)
      child.kill("SIGKILL");
  }, 1_000);
  force.unref?.();
}

export function sanitizeAgentOptions(value: unknown): SandboxAgentOptions {
  if (!isRecord(value)) return {};
  return {
    ...(value.label !== undefined ? { label: value.label } : {}),
    ...(value.phase !== undefined ? { phase: value.phase } : {}),
    ...(value.schema !== undefined ? { schema: value.schema } : {}),
    ...(value.model !== undefined ? { model: value.model } : {}),
    ...(value.provider !== undefined ? { provider: value.provider } : {}),
    ...(value.effort !== undefined ? { effort: value.effort } : {}),
    ...(value.writable !== undefined ? { writable: value.writable } : {}),
    ...(value.cwd !== undefined ? { cwd: value.cwd } : {}),
  };
}

/**
 * Execute orchestration code in a separate, permission-restricted Node process.
 * The child can only invoke the narrow agent/phase IPC protocol and is always
 * terminated on completion, cancellation, or protocol failure. The workflow
 * itself and its agent requests have no wall-clock deadline. Active requests
 * are aborted only when the workflow is cancelled or the sandbox is cleaned up.
 */
export function runWorkflowSandbox(options: RunWorkflowSandboxOptions) {
  if (!process.allowedNodeEnvironmentFlags.has("--permission")) {
    return Promise.reject(
      new Error("This Node runtime cannot enforce workflow child permissions"),
    );
  }
  if (byteLength(options.source) > MAX_SOURCE_BYTES) {
    return Promise.reject(
      new Error(`Workflow script exceeds the ${MAX_SOURCE_BYTES} byte limit`),
    );
  }

  const argsJson = safeStringify(
    { defined: options.args !== undefined, value: options.args },
    { maxBytes: MAX_ARGS_BYTES, maxDepth: 16, maxNodes: 10_000 },
  );
  if (byteLength(argsJson) > MAX_ARGS_BYTES) {
    return Promise.reject(new Error("Workflow args exceed the IPC limit"));
  }

  return new Promise<unknown>((resolve, reject) => {
    const workerPath = fileURLToPath(
      new URL("./sandbox-child.cjs", import.meta.url),
    );
    const child = spawn(
      process.execPath,
      [
        "--permission",
        `--allow-fs-read=${path.dirname(workerPath)}`,
        "--max-old-space-size=128",
        "--stack-size=2048",
        workerPath,
      ],
      {
        cwd: options.cwd,
        env: {
          PATH: process.env.PATH ?? "",
          NODE_NO_WARNINGS: "1",
        },
        stdio: ["ignore", "ignore", "ignore", "ipc"],
      },
    );
    const token = randomBytes(24).toString("hex");
    const requestIds = new Set<number>();
    const activeAgentRequests = new Map<number, AbortController>();
    const activeCheckpointRequests = new Map<number, AbortController>();
    const activeWorktreeRequests = new Map<number, AbortController>();
    let finished = false;

    const cleanup = () => {
      for (const abortController of activeAgentRequests.values()) {
        abortController.abort(new Error("Workflow stopped"));
      }
      activeAgentRequests.clear();
      for (const abortController of activeCheckpointRequests.values()) {
        abortController.abort(new Error("Workflow stopped"));
      }
      activeCheckpointRequests.clear();
      for (const abortController of activeWorktreeRequests.values()) {
        abortController.abort(new Error("Workflow stopped"));
      }
      activeWorktreeRequests.clear();
      options.signal.removeEventListener("abort", onAbort);
      child.removeAllListeners("message");
      child.removeAllListeners("error");
      child.removeAllListeners("exit");
      terminateChild(child);
    };
    const finish = (error?: Error, value?: unknown) => {
      if (finished) return;
      finished = true;
      cleanup();
      if (error) reject(error);
      else resolve(value);
    };
    const onAbort = () =>
      finish(
        options.signal.reason instanceof Error
          ? options.signal.reason
          : new Error("Workflow was aborted"),
      );

    options.signal.addEventListener("abort", onAbort, { once: true });
    if (options.signal.aborted) {
      onAbort();
      return;
    }

    child.on("error", (error) => finish(error));
    child.on("exit", (code, exitSignal) => {
      if (!finished) {
        finish(
          new Error(
            `Workflow sandbox exited before completion (${exitSignal ?? code ?? "unknown"})`,
          ),
        );
      }
    });
    child.on("message", (raw: unknown) => {
      if (
        !isRecord(raw) ||
        raw.token !== token ||
        typeof raw.kind !== "string"
      ) {
        finish(new Error("Workflow sandbox sent an invalid IPC message"));
        return;
      }
      if (raw.kind === "phase") {
        if (
          typeof raw.payloadJson !== "string" ||
          byteLength(raw.payloadJson) > 4096
        ) {
          finish(new Error("Workflow sandbox sent an invalid phase update"));
          return;
        }
        try {
          const payload: unknown = JSON.parse(raw.payloadJson);
          if (!isRecord(payload) || typeof payload.title !== "string") {
            throw new Error("invalid title");
          }
          options.onPhase(payload.title.slice(0, 160));
        } catch {
          finish(new Error("Workflow sandbox sent an invalid phase update"));
        }
        return;
      }
      if (raw.kind === "agent") {
        if (
          typeof raw.payloadJson !== "string" ||
          byteLength(raw.payloadJson) > MAX_AGENT_MESSAGE_BYTES
        ) {
          finish(new Error("Workflow sandbox sent an oversized agent request"));
          return;
        }
        let payload: unknown;
        try {
          payload = JSON.parse(raw.payloadJson);
        } catch {
          finish(new Error("Workflow sandbox sent malformed agent JSON"));
          return;
        }
        if (
          !isRecord(payload) ||
          !Number.isSafeInteger(payload.id) ||
          typeof payload.id !== "number" ||
          payload.id < 1 ||
          typeof payload.prompt !== "string" ||
          payload.prompt.length > 100_000 ||
          !isRecord(payload.options)
        ) {
          finish(new Error("Workflow sandbox sent an invalid agent request"));
          return;
        }
        if (requestIds.has(payload.id)) {
          finish(new Error("Workflow sandbox reused an agent request id"));
          return;
        }
        requestIds.add(payload.id);
        const id = payload.id;
        const abortController = new AbortController();
        const sendResult = (result: SandboxAgentResult) => {
          if (!activeAgentRequests.delete(id)) return;
          requestIds.delete(id);
          if (finished || !child.connected) return;
          const normalized = toSerializable(result, {
            maxDepth: 16,
            maxNodes: 10_000,
            maxStringBytes: 128 * 1024,
          });
          let resultJson = JSON.stringify(normalized);
          if (byteLength(resultJson) > MAX_AGENT_MESSAGE_BYTES) {
            resultJson = JSON.stringify({
              ok: false,
              output: "",
              error: "Agent result exceeded the workflow IPC output limit",
            });
          }
          child.send({ token, kind: "agentResult", id, resultJson });
        };
        activeAgentRequests.set(id, abortController);
        void options
          .onAgent(
            payload.prompt,
            sanitizeAgentOptions(payload.options),
            abortController.signal,
          )
          .then(sendResult)
          .catch((error) =>
            sendResult({ ok: false, output: "", error: errorText(error) }),
          );
        return;
      }
      if (raw.kind === "result") {
        if (
          typeof raw.resultJson !== "string" ||
          byteLength(raw.resultJson) > MAX_RESULT_BYTES
        ) {
          finish(new Error("Workflow result exceeded the IPC limit"));
          return;
        }
        try {
          const normalized = toSerializable(JSON.parse(raw.resultJson));
          finish(undefined, JSON.parse(JSON.stringify(normalized)));
        } catch (error) {
          finish(
            new Error(`Workflow returned invalid JSON: ${errorText(error)}`),
          );
        }
        return;
      }
      if (raw.kind === "error" && typeof raw.error === "string") {
        finish(new Error(raw.error.slice(0, 16 * 1024)));
        return;
      }
      if (raw.kind === "checkpoint") {
        if (
          typeof raw.payloadJson !== "string" ||
          byteLength(raw.payloadJson) > MAX_CHECKPOINT_BYTES
        ) {
          finish(
            new Error("Workflow sandbox sent an oversized checkpoint request"),
          );
          return;
        }
        let payload: unknown;
        try {
          payload = JSON.parse(raw.payloadJson);
        } catch {
          finish(new Error("Workflow sandbox sent malformed checkpoint JSON"));
          return;
        }
        if (
          !isRecord(payload) ||
          !Number.isSafeInteger(payload.id) ||
          typeof payload.id !== "number" ||
          payload.id < 1 ||
          typeof payload.name !== "string" ||
          typeof payload.prompt !== "string" ||
          payload.prompt.length > 100_000
        ) {
          finish(
            new Error("Workflow sandbox sent an invalid checkpoint request"),
          );
          return;
        }
        if (requestIds.has(payload.id)) {
          finish(new Error("Workflow sandbox reused a checkpoint request id"));
          return;
        }
        requestIds.add(payload.id);
        const id = payload.id;
        const abortController = new AbortController();
        const sendCheckpointResult = (decision: "approved" | "rejected") => {
          if (!activeCheckpointRequests.delete(id)) return;
          requestIds.delete(id);
          if (finished || !child.connected) return;
          const normalized = decision === "approved" ? "approved" : "rejected";
          child.send({
            token,
            kind: "checkpointResult",
            id,
            resultJson: JSON.stringify(normalized),
          });
        };
        const sendCheckpointError = (message: string) => {
          if (!activeCheckpointRequests.delete(id)) return;
          requestIds.delete(id);
          if (finished || !child.connected) return;
          child.send({
            token,
            kind: "checkpointResult",
            id,
            error: message.slice(0, 4096),
          });
        };
        activeCheckpointRequests.set(id, abortController);
        if (!options.onCheckpoint) {
          sendCheckpointError("checkpoint() is not supported in this run");
          return;
        }
        void options
          .onCheckpoint(
            {
              id,
              name: payload.name,
              prompt: payload.prompt,
              context: payload.context,
            },
            abortController.signal,
          )
          .then(sendCheckpointResult)
          .catch((error) => sendCheckpointError(errorText(error)));
        return;
      }
      if (raw.kind === "worktreeOpen") {
        if (
          typeof raw.payloadJson !== "string" ||
          byteLength(raw.payloadJson) > MAX_WORKTREE_BYTES
        ) {
          finish(
            new Error("Workflow sandbox sent an oversized worktree request"),
          );
          return;
        }
        let payload: unknown;
        try {
          payload = JSON.parse(raw.payloadJson);
        } catch {
          finish(new Error("Workflow sandbox sent malformed worktree JSON"));
          return;
        }
        if (
          !isRecord(payload) ||
          !Number.isSafeInteger(payload.id) ||
          typeof payload.id !== "number" ||
          payload.id < 1 ||
          typeof payload.name !== "string"
        ) {
          finish(
            new Error("Workflow sandbox sent an invalid worktree request"),
          );
          return;
        }
        if (requestIds.has(payload.id)) {
          finish(new Error("Workflow sandbox reused a worktree request id"));
          return;
        }
        requestIds.add(payload.id);
        const id = payload.id;
        const abortController = new AbortController();
        const sendWorktreeResult = (scope: { path: string }) => {
          if (!activeWorktreeRequests.delete(id)) return;
          requestIds.delete(id);
          if (finished || !child.connected) return;
          child.send({
            token,
            kind: "worktreeResult",
            id,
            resultJson: JSON.stringify({ path: String(scope.path) }),
          });
        };
        const sendWorktreeError = (message: string) => {
          if (!activeWorktreeRequests.delete(id)) return;
          requestIds.delete(id);
          if (finished || !child.connected) return;
          child.send({
            token,
            kind: "worktreeResult",
            id,
            error: message.slice(0, 4096),
          });
        };
        activeWorktreeRequests.set(id, abortController);
        if (!options.onWorktreeOpen) {
          sendWorktreeError("withWorktree() is not supported in this run");
          return;
        }
        void options
          .onWorktreeOpen({ id, name: payload.name }, abortController.signal)
          .then(sendWorktreeResult)
          .catch((error) => sendWorktreeError(errorText(error)));
        return;
      }
      if (raw.kind === "worktreeClose") {
        if (
          typeof raw.payloadJson !== "string" ||
          byteLength(raw.payloadJson) > MAX_WORKTREE_BYTES
        ) {
          finish(
            new Error(
              "Workflow sandbox sent an oversized worktree close request",
            ),
          );
          return;
        }
        let payload: unknown;
        try {
          payload = JSON.parse(raw.payloadJson);
        } catch {
          finish(
            new Error("Workflow sandbox sent malformed worktree close JSON"),
          );
          return;
        }
        if (
          !isRecord(payload) ||
          !Number.isSafeInteger(payload.id) ||
          typeof payload.id !== "number" ||
          payload.id < 1 ||
          typeof payload.name !== "string"
        ) {
          finish(
            new Error(
              "Workflow sandbox sent an invalid worktree close request",
            ),
          );
          return;
        }
        const id = payload.id;
        const sendCloseAck = (errorMessage?: string) => {
          if (finished || !child.connected) return;
          if (errorMessage)
            child.send({
              token,
              kind: "worktreeCloseAck",
              id,
              error: errorMessage.slice(0, 4096),
            });
          else child.send({ token, kind: "worktreeCloseAck", id });
        };
        if (!options.onWorktreeClose) {
          sendCloseAck();
          return;
        }
        void options
          .onWorktreeClose({ id, name: payload.name })
          .then(() => sendCloseAck())
          .catch((error) => sendCloseAck(errorText(error)));
        return;
      }
      finish(new Error("Workflow sandbox sent an unknown IPC message"));
    });

    child.send(
      {
        kind: "init",
        token,
        source: options.source,
        argsJson,
      },
      (error) => {
        if (error) finish(error);
      },
    );
  });
}
