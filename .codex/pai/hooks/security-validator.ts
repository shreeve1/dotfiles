#!/usr/bin/env bun
import { readJsonStdin, preToolDeny, permissionDeny, appendJsonLine } from "../lib/hook-io";
import { paiMemoryPath } from "../lib/paths";

interface Finding {
  reason: string;
  pattern: string;
}

const destructiveCommandPatterns: Array<[RegExp, string]> = [
  [/\brm\s+-(?=[^\s]*r)(?=[^\s]*f)[^\s]*\s+(?:\/|\/\*|\*)(?:\s|$)/, "Destructive recursive remove at filesystem root"],
  [/\bmkfs(\.|)\w*\b/, "Filesystem formatting command"],
  [/\bdd\s+.*\bof=\/dev\//, "Raw device write"],
  [/\bchmod\s+-R\s+777\s+\//, "Recursive world-writable permission change at root"],
  [/\bchown\s+-R\s+[^&|;]+\s+\//, "Recursive ownership change at root"],
  [/\b(shutdown|reboot|halt)\b/, "Machine power command"],
  [/\bgit\s+push\s+--force\b/, "Force push requires an explicit human decision"],
  [/\bcurl\b[\s\S]*\|\s*(sh|bash)\b/, "Piping remote content directly to a shell"],
];

const protectedPathPatterns: Array<[RegExp, string]> = [
  [/(^|\s)(~\/)?\.ssh(\/|\s|$)/, "SSH material is protected"],
  [/(^|\s)\.env(\.|\s|$)/, "Environment secret files are protected"],
  [/(^|\s)\.codex\/auth\.json(\s|$)/, "Codex auth material is protected"],
  [/(^|\s)(id_rsa|id_ed25519)(\s|$)/, "Private key material is protected"],
];

function commandFromInput(input: unknown): string {
  if (typeof input === "string") return input;
  if (!input || typeof input !== "object") return "";
  const record = input as Record<string, unknown>;
  for (const key of ["command", "cmd", "patch", "input"]) {
    const value = record[key];
    if (typeof value === "string") return value;
  }
  return JSON.stringify(record);
}

function normalizeCommand(command: string): string {
  return command
    .replace(/^\s*(?:[A-Za-z_][A-Za-z0-9_]*=(?:"[^"]*"|'[^']*'|[^\s]*)\s+)*/, "")
    .trim();
}

function findIssue(command: string): Finding | null {
  const normalized = normalizeCommand(command);
  for (const [pattern, reason] of destructiveCommandPatterns) {
    if (pattern.test(normalized)) return { reason, pattern: String(pattern) };
  }
  for (const [pattern, reason] of protectedPathPatterns) {
    if (pattern.test(normalized)) return { reason, pattern: String(pattern) };
  }
  return null;
}

function logDecision(input: ReturnType<typeof readJsonStdin>, command: string, issue: Finding | null): void {
  appendJsonLine(paiMemoryPath("security", "events.jsonl"), {
    timestamp: new Date().toISOString(),
    session_id: input.session_id ?? null,
    turn_id: input.turn_id ?? null,
    event: input.hook_event_name ?? "PreToolUse",
    tool: input.tool_name ?? null,
    command,
    decision: issue ? "deny" : "allow",
    reason: issue?.reason ?? null,
    pattern: issue?.pattern ?? null,
  });
}

const input = readJsonStdin();
const command = commandFromInput(input.tool_input);
const issue = findIssue(command);
logDecision(input, command, issue);

if (issue) {
  if (input.hook_event_name === "PermissionRequest") {
    permissionDeny(issue.reason);
  } else {
    preToolDeny(issue.reason);
  }
}
