import { appendFileSync, mkdirSync, readFileSync } from "fs";
import { dirname } from "path";

export interface HookInput {
  hook_event_name?: string;
  session_id?: string;
  turn_id?: string;
  cwd?: string;
  source?: string;
  prompt?: string;
  tool_name?: string;
  tool_input?: Record<string, unknown> | string;
  tool_response?: unknown;
  stop_hook_active?: boolean;
  last_assistant_message?: string | null;
}

export function readJsonStdin(): HookInput {
  const raw = readFileSync(0, "utf8").trim();
  if (!raw) return {};
  return JSON.parse(raw) as HookInput;
}

export function writeJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

export function appendJsonLine(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, `${JSON.stringify(value)}\n`);
}

export function preToolDeny(reason: string): void {
  writeJson({
    decision: "block",
    reason,
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: reason,
    },
  });
}

export function permissionDeny(reason: string): void {
  writeJson({
    hookSpecificOutput: {
      hookEventName: "PermissionRequest",
      decision: {
        behavior: "deny",
        message: reason,
      },
    },
  });
}

export function sessionContext(event: "SessionStart" | "UserPromptSubmit" | "PostToolUse", additionalContext: string): void {
  writeJson({
    hookSpecificOutput: {
      hookEventName: event,
      additionalContext,
    },
  });
}

export function stopBlock(reason: string): void {
  writeJson({
    decision: "block",
    reason,
    hookSpecificOutput: {
      hookEventName: "Stop",
      additionalContext: reason,
    },
  });
}
