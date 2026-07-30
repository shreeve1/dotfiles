import * as path from "node:path";
import {
  DefaultResourceLoader,
  getAgentDir,
  ProjectTrustStore,
  SettingsManager,
  type AgentSession,
  type SessionShutdownEvent,
} from "@earendil-works/pi-coding-agent";

const CHILD_SHUTDOWN_TIMEOUT_MS = 5_000;

/** Tools a headless workflow child must NEVER receive: subprocess spawn,
 *  process control, parent-RPC orchestration, recursion, interactive. Each
 *  name is a real registered tool, annotated with its registration site so the
 *  list can be audited. */
export const CHILD_EXCLUDED_TOOL_NAMES = [
  // spawns real pi subprocesses — pi-subagents/src/extension/index.ts
  "subagent",
  // waits on async subagent runs — pi-subagents/src/runs/background/wait-tool.ts
  "subagent_wait",
  // parent-only supervisor RPC — pi-subagents/src/intercom/native-supervisor-channel.ts
  "subagent_supervisor",
  // child→parent supervisor RPC — pi-subagents/src/intercom/native-supervisor-channel.ts
  "contact_supervisor",
  // supervisor/intercom RPC route — pi-subagents/src/intercom/native-supervisor-channel.ts
  "intercom",
  // the workflows orchestrator itself (prevents recursion) — workflows/index.ts
  "workflow",
  // spawns background subprocesses — background-terminals/index.ts
  "bg_start",
  // kills background processes — background-terminals/index.ts
  "bg_kill",
  // headless children have no interactive question channel — rpiv-ask-user-question
  "ask_user_question",
  // rpiv-advisor issues its own model request via completeSimple — bypasses
  // the workflow agent-call/concurrency budget, so a child could otherwise
  // exhaust the parent's account unbounded — extensions/rpiv-advisor/advisor.ts
  "advisor",
] as const;

/** File-mutation tools denied by default; a workflow step opts back in via
 *  `{ writable: true }`. */
export const CHILD_WRITABLE_GATED_TOOLS = [
  "write",
  "edit",
  "ast_grep_replace",
] as const;

/**
 * Fresh SDK options avoid turning the denylist into an accidental allowlist.
 *
 * Children have a default read-only file-mutation policy: the tools in
 * `CHILD_WRITABLE_GATED_TOOLS` are denied unless a workflow step opts in via
 * `{ writable: true }`. Spawn / process-control / parent-RPC tools in
 * `CHILD_EXCLUDED_TOOL_NAMES` are always denied.
 *
 * ponytail: containment is advisory, not a hard sandbox. `bash` stays enabled
 * (a child can mutate files or spawn `pi` via shell), and `lsp_navigation`'s
 * `rename`+`apply` path can also write files. Closing those means denying bash,
 * which cripples children needing shell access — the real upgrade path is to
 * gate bash or move concurrent writers to git-worktree isolation.
 */
export function childToolPolicy(options?: { writable?: boolean }) {
  const excluded =
    options?.writable === true
      ? [...CHILD_EXCLUDED_TOOL_NAMES]
      : [...CHILD_EXCLUDED_TOOL_NAMES, ...CHILD_WRITABLE_GATED_TOOLS];
  return { excludeTools: excluded };
}

export interface ChildResourceOptions {
  cwd: string;
  projectTrusted: boolean;
  appendSystemPrompt?: string[];
  agentDir?: string;
}

/** Load normal global/package resources and trust-gated project resources. */
export async function createChildResources(options: ChildResourceOptions) {
  const agentDir = options.agentDir ?? getAgentDir();
  const settingsManager = SettingsManager.create(options.cwd, agentDir, {
    projectTrusted: options.projectTrusted,
  });
  const loader = new DefaultResourceLoader({
    cwd: options.cwd,
    agentDir,
    settingsManager,
    ...(options.appendSystemPrompt
      ? { appendSystemPrompt: options.appendSystemPrompt }
      : {}),
  });
  await loader.reload();
  return { loader, settingsManager };
}

/**
 * Same-directory children inherit the live parent decision. An alternate cwd
 * is trusted only when Pi's persisted trust store explicitly trusts it (or a
 * containing directory); unreadable/invalid trust data fails closed.
 */
export function resolveStandaloneChildProjectTrust(options: {
  parentCwd: string;
  childCwd: string;
  parentTrusted: boolean;
  agentDir?: string;
}) {
  if (path.resolve(options.childCwd) === path.resolve(options.parentCwd)) {
    return options.parentTrusted;
  }
  try {
    const trustStore = new ProjectTrustStore(options.agentDir ?? getAgentDir());
    return trustStore.get(options.childCwd) === true;
  } catch {
    return false;
  }
}

/** Start child extension session hooks/resources in headless print mode. */
export async function bindChildSessionExtensions(
  session: Pick<AgentSession, "bindExtensions">,
) {
  await session.bindExtensions({ mode: "print" });
}

interface ChildExtensionRunner {
  hasHandlers(eventType: string): boolean;
  emit(event: SessionShutdownEvent): Promise<unknown>;
}

export interface DisposableChildSession {
  readonly extensionRunner: ChildExtensionRunner;
  dispose(): void;
}

const childShutdowns = new WeakMap<object, Promise<void>>();

function waitBounded(operation: Promise<unknown>, timeoutMs: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, timeoutMs);
  });
  return Promise.race([
    operation.then(
      () => undefined,
      () => undefined,
    ),
    timeout,
  ])
    .catch(() => {})
    .finally(() => {
      if (timer) clearTimeout(timer);
    });
}

/**
 * Emit child session_shutdown once, then dispose once. Hook failures and a
 * bounded hook deadline never prevent disposal.
 */
export function shutdownAndDisposeChildSession(
  session: DisposableChildSession,
  options: { timeoutMs?: number } = {},
) {
  const existing = childShutdowns.get(session);
  if (existing) return existing;

  const shutdown = (async () => {
    try {
      if (session.extensionRunner.hasHandlers("session_shutdown")) {
        await waitBounded(
          session.extensionRunner.emit({
            type: "session_shutdown",
            reason: "quit",
          }),
          options.timeoutMs ?? CHILD_SHUTDOWN_TIMEOUT_MS,
        );
      }
    } catch {
      // Extension runner inspection/emission is best-effort during teardown.
    } finally {
      try {
        session.dispose();
      } catch {
        // Disposal is terminal and must remain idempotent for callers.
      }
    }
  })();

  childShutdowns.set(session, shutdown);
  return shutdown;
}
