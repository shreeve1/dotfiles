import type { Plugin } from "@opencode-ai/plugin";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { homedir } from "node:os";
import { CanonicalEventStore, type EventIngestResult } from "../../../../.pai/src/event-store";
import {
  OPENCODE_ADAPTER_VERSION,
  mapOpenCodePluginObservationToEvent,
  resolveOpenCodePaiSession,
  type OpenCodePluginObservation,
} from "../../../../.pai/src/opencode-tracer";
import { buildRuntimePaths } from "../../../../.pai/src/runtime-paths";

type SequenceState = {
  sessions: Record<string, number>;
  updated_at: string;
};

type PendingObservation = Omit<OpenCodePluginObservation, "sequence">;

type ToolStatus = "ok" | "error" | "unknown";

type PathCategory = "none" | "workspace" | "home" | "temp" | "sensitive" | "external";

export const SHARED_IMPORT_CONTRACT = {
  adapterVersion: OPENCODE_ADAPTER_VERSION,
  sharedImportRoot: "../../../../.pai/src",
} as const;

const STATE_FILE = "opencode-tracer-sequences.json";
const INTERNAL_PROMPT_MARKERS = [
  "[pai-mode-router]",
  "<pai-algorithm-directive>",
  "ISA scaffold pre-created at:",
  "This session is ALGORITHM",
  "todowrite with 2-8",
];

const SENSITIVE_PATH_MARKERS = [
  ".env",
  "/.ssh/",
  "/.aws/credentials",
  "/.codex/auth.json",
  "/.pi/agent/auth.json",
  "/.netrc",
  "credentials",
  "secret",
  "token",
];

export function sequenceStatePath(runtimeHome?: string): string {
  return join(buildRuntimePaths(runtimeHome).stateDir, STATE_FILE);
}

export function readSequenceState(runtimeHome?: string): SequenceState | undefined {
  const path = sequenceStatePath(runtimeHome);
  if (!existsSync(path)) return { sessions: {}, updated_at: new Date(0).toISOString() };
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as Partial<SequenceState>;
    if (!parsed || typeof parsed !== "object" || !parsed.sessions || typeof parsed.sessions !== "object") return undefined;
    const sessions: Record<string, number> = {};
    for (const [session, value] of Object.entries(parsed.sessions)) {
      if (typeof value === "number" && Number.isInteger(value) && value >= 0) sessions[session] = value;
    }
    return { sessions, updated_at: typeof parsed.updated_at === "string" ? parsed.updated_at : new Date(0).toISOString() };
  } catch {
    return undefined;
  }
}

export function writeSequenceState(state: SequenceState, runtimeHome?: string): void {
  const path = sequenceStatePath(runtimeHome);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

export function reserveNextSequence(
  paiSessionId: string,
  store: Pick<CanonicalEventStore, "maxSequenceForSession">,
  runtimeHome?: string,
): number {
  const state = readSequenceState(runtimeHome) ?? { sessions: {}, updated_at: new Date(0).toISOString() };
  const stateMax = state.sessions[paiSessionId] ?? 0;
  const storeMax = store.maxSequenceForSession(paiSessionId);
  const next = Math.max(stateMax, storeMax) + 1;
  state.sessions[paiSessionId] = next;
  state.updated_at = new Date().toISOString();
  writeSequenceState(state, runtimeHome);
  return next;
}

export function extractPromptText(input: unknown, output: unknown): string | undefined {
  const message = selectUserMessageParts(input, output);
  if (!message) return undefined;

  const text = message.parts
    .filter((part: any) => part?.type === "text" && part?.synthetic !== true && part?.metadata?.synthetic !== true)
    .map((part: any) => getString(part?.text) ?? "")
    .filter(Boolean)
    .join("\n")
    .trim();

  if (!text) return undefined;
  if (isInternalPrompt(text)) return undefined;
  return text;
}

export function isInternalPrompt(text: string): boolean {
  return INTERNAL_PROMPT_MARKERS.some((marker) => text.includes(marker));
}

export function sanitizeToolEvent(input: unknown, output: unknown): { tool_name: string; tool_input: string; tool_output: string } | undefined {
  const toolName = getString((input as any)?.tool) ?? getString((output as any)?.tool);
  if (!toolName) return undefined;

  const status = toolStatus(output);
  const pathCategory = normalizePathCategory(firstPathCandidate((input as any)?.args), getString((input as any)?.cwd));
  const exitCodeValue = toolExitCode(output);
  const exitCode = typeof exitCodeValue === "number" ? `; exit_code:${exitCodeValue}` : "";
  const summary = `tool:${toolName}; status:${status}; path_category:${pathCategory}${exitCode}`;

  return {
    tool_name: toolName,
    tool_input: summary,
    tool_output: `status:${status}`,
  };
}

export function normalizePathCategory(candidate: string | undefined, cwd = process.cwd(), home = homedir()): PathCategory {
  if (!candidate) return "none";
  const normalized = candidate.replace(/\\/g, "/");
  const lowered = normalized.toLowerCase();
  if (SENSITIVE_PATH_MARKERS.some((marker) => lowered.includes(marker))) return "sensitive";
  if (/^https?:\/\//i.test(normalized)) return "external";

  const absolute = isAbsolute(normalized) ? normalized : resolve(cwd, normalized);
  const workspaceRoot = resolve(cwd);
  const homeRoot = resolve(home);
  if (absolute === workspaceRoot || absolute.startsWith(`${workspaceRoot}/`)) return "workspace";
  if (absolute.startsWith("/tmp/") || absolute.startsWith("/var/tmp/")) return "temp";
  if (absolute === homeRoot || absolute.startsWith(`${homeRoot}/`)) return "home";
  return "external";
}

export function ingestOpenCodeObservation(
  observation: PendingObservation,
  options: { runtimeHome?: string; store?: CanonicalEventStore } = {},
): EventIngestResult | undefined {
  const ownStore = options.store === undefined;
  const store = options.store ?? new CanonicalEventStore({ runtimeHome: options.runtimeHome });
  try {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const sequence = reserveNextSequence(observation.pai_session_id, store, options.runtimeHome);
      const event = mapOpenCodePluginObservationToEvent({ ...observation, sequence });
      const result = store.ingest(event);
      if (result.status === "accepted" || result.envelope.event_id === event.event_id) return result;

      const state = readSequenceState(options.runtimeHome) ?? { sessions: {}, updated_at: new Date(0).toISOString() };
      state.sessions[observation.pai_session_id] = store.maxSequenceForSession(observation.pai_session_id);
      state.updated_at = new Date().toISOString();
      writeSequenceState(state, options.runtimeHome);
    }
    console.error(`[pai-opencode-tracer] ingest replay collision persisted for ${observation.pai_session_id}`);
    return undefined;
  } finally {
    if (ownStore) store.close();
  }
}

export const createPaiOpenCodeTracer: Plugin = async () => {
  return {
    "chat.message": async (input: any, output: any) => {
      try {
        const sessionID = getString(input?.sessionID);
        if (!sessionID) return;
        const prompt = extractPromptText(input, output);
        if (!prompt) return;

        const resolution = resolveOpenCodePaiSession({ env: process.env, opencodeSessionId: sessionID });
        ingestOpenCodeObservation({
          event: "UserPromptSubmit",
          pai_session_id: resolution.pai_session_id,
          timestamp: new Date().toISOString(),
          prompt,
          cwd: getString(input?.cwd) ?? process.cwd(),
          project_id: getString(input?.projectID) ?? getString(input?.project_id),
        });
      } catch (error) {
        console.error("[pai-opencode-tracer] chat.message failed:", error);
      }
    },

    "tool.execute.after": async (input: any, output: any) => {
      try {
        const sessionID = getString(input?.sessionID);
        if (!sessionID) return;
        const toolEvent = sanitizeToolEvent(input, output);
        if (!toolEvent) return;

        const resolution = resolveOpenCodePaiSession({ env: process.env, opencodeSessionId: sessionID });
        ingestOpenCodeObservation({
          event: "ToolCall",
          pai_session_id: resolution.pai_session_id,
          timestamp: new Date().toISOString(),
          cwd: getString(input?.cwd) ?? process.cwd(),
          project_id: getString(input?.projectID) ?? getString(input?.project_id),
          tool_name: toolEvent.tool_name,
          tool_input: toolEvent.tool_input,
          tool_output: toolEvent.tool_output,
        });
      } catch (error) {
        console.error("[pai-opencode-tracer] tool.execute.after failed:", error);
      }
    },

    event: async (input: any) => {
      try {
        const evt = input?.event;
        if (!evt || evt.type !== "session.idle") return;
        const props = evt.properties ?? {};
        const sessionID = getString(props.sessionID) ?? getString(props.session_id);
        if (!sessionID) return;

        const resolution = resolveOpenCodePaiSession({ env: process.env, opencodeSessionId: sessionID });
        ingestOpenCodeObservation({
          event: "Stop",
          pai_session_id: resolution.pai_session_id,
          timestamp: new Date().toISOString(),
          cwd: getString(props.cwd) ?? process.cwd(),
          project_id: getString(props.projectID) ?? getString(props.project_id),
          plugin_surface: "session.idle",
        });
      } catch (error) {
        console.error("[pai-opencode-tracer] session.idle failed:", error);
      }
    },
  };
};

function selectUserMessageParts(input: unknown, output: unknown): { parts: any[] } | undefined {
  const outputRole = getString((output as any)?.info?.role) ?? getString((output as any)?.message?.role);
  const inputRole = getString((input as any)?.info?.role) ?? getString((input as any)?.role) ?? getString((input as any)?.message?.role);
  const candidates = [
    { role: outputRole, parts: collectPartsForSource((output as any)?.parts, (output as any)?.message?.parts) },
    { role: inputRole, parts: collectPartsForSource((input as any)?.parts, (input as any)?.message?.parts) },
  ];
  return candidates.find((candidate) => candidate.role === "user" && candidate.parts.length > 0);
}

function collectPartsForSource(...values: unknown[]): any[] {
  return values.flatMap((parts) => (Array.isArray(parts) ? parts : []));
}

function toolStatus(output: unknown): ToolStatus {
  if (!output || typeof output !== "object") return "unknown";
  return statusFromRecord(output as Record<string, unknown>)
    ?? statusFromRecord((output as any).metadata)
    ?? statusFromTitle((output as any).title)
    ?? "unknown";
}

function toolExitCode(output: unknown): number | undefined {
  if (!output || typeof output !== "object") return undefined;
  return numericField(output as Record<string, unknown>, ["exitCode", "exit_code", "exit", "code"])
    ?? numericField((output as any).metadata, ["exitCode", "exit_code", "exit", "code"]);
}

function statusFromRecord(record: unknown): ToolStatus | undefined {
  if (!record || typeof record !== "object") return undefined;
  const value = record as Record<string, unknown>;
  if (value.error || value.exception) return "error";

  const exitCode = numericField(value, ["exitCode", "exit_code", "exit", "code"]);
  if (typeof exitCode === "number") return exitCode === 0 ? "ok" : "error";

  const ok = booleanField(value, ["ok", "success"]);
  if (typeof ok === "boolean") return ok ? "ok" : "error";

  const status = stringField(value, ["status", "state", "outcome"]);
  if (!status) return undefined;
  const lowered = status.toLowerCase();
  if (["error", "failed", "failure", "fail", "rejected", "timeout", "timed_out"].includes(lowered)) return "error";
  if (["ok", "success", "succeeded", "complete", "completed", "done"].includes(lowered)) return "ok";
  return "unknown";
}

function statusFromTitle(title: unknown): ToolStatus | undefined {
  if (typeof title !== "string") return undefined;
  const lowered = title.toLowerCase();
  if (/\b(error|failed|failure|timed out|timeout)\b/.test(lowered)) return "error";
  if (/\b(succeeded|success|completed)\b/.test(lowered)) return "ok";
  return undefined;
}

function numericField(record: unknown, keys: string[]): number | undefined {
  if (!record || typeof record !== "object") return undefined;
  for (const key of keys) {
    const value = (record as Record<string, unknown>)[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return undefined;
}

function booleanField(record: unknown, keys: string[]): boolean | undefined {
  if (!record || typeof record !== "object") return undefined;
  for (const key of keys) {
    const value = (record as Record<string, unknown>)[key];
    if (typeof value === "boolean") return value;
  }
  return undefined;
}

function stringField(record: unknown, keys: string[]): string | undefined {
  if (!record || typeof record !== "object") return undefined;
  for (const key of keys) {
    const value = (record as Record<string, unknown>)[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return undefined;
}

function firstPathCandidate(args: unknown): string | undefined {
  if (!args || typeof args !== "object") return undefined;
  const record = args as Record<string, unknown>;
  const direct = [record.filePath, record.file_path, record.path, record.cwd, record.workdir].find((value) => typeof value === "string") as string | undefined;
  return direct;
}

function getString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}
