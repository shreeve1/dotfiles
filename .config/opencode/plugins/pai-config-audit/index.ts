/**
 * pai-config-audit — append-only audit log for opencode.json edits.
 *
 * Adapted from upstream PAI v6.3.0 hooks/ConfigAudit.hook.ts.
 * OpenCode trigger: `tool.execute.after` filtered to write/edit on
 * opencode.json (project-local or global).
 *
 * Captures a JSONL entry per change to
 * $PAI_RUNTIME_HOME/memory/OBSERVABILITY/config-changes.jsonl
 * (default ~/.pai/memory/OBSERVABILITY/config-changes.jsonl) with shape:
 *   { timestamp, file_path, sha256, byte_size, tool, session_id? }
 *
 * Read-only, side-effect-only audit; never modifies the config file.
 *
 * Fails closed: any error logs to stderr; never crashes the session.
 */

import type { Plugin } from "@opencode-ai/plugin";
import {
  readFileSync,
  existsSync,
  appendFileSync,
  mkdirSync,
  statSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, basename } from "node:path";
import { homedir } from "node:os";

const PAI_RUNTIME_HOME = process.env.PAI_RUNTIME_HOME || join(homedir(), ".pai");
const AUDIT_LOG = join(
  PAI_RUNTIME_HOME,
  "memory",
  "OBSERVABILITY",
  "config-changes.jsonl"
);

function isOpencodeConfig(filePath: string): boolean {
  const base = basename(filePath);
  return base === "opencode.json" || base === "opencode.jsonc";
}

function sha256File(filePath: string): string | null {
  try {
    const buf = readFileSync(filePath);
    return createHash("sha256").update(buf).digest("hex");
  } catch (err) {
    console.error("[pai-config-audit] hash failed:", err);
    return null;
  }
}

function appendAudit(entry: Record<string, unknown>): void {
  try {
    mkdirSync(dirname(AUDIT_LOG), { recursive: true });
    appendFileSync(AUDIT_LOG, JSON.stringify(entry) + "\n", "utf-8");
  } catch (err) {
    console.error("[pai-config-audit] append failed:", err);
  }
}

export const PaiConfigAudit: Plugin = async () => {
  return {
    "tool.execute.after": async (input, output) => {
      try {
        const tool = input?.tool;
        if (tool !== "write" && tool !== "edit") return;

        const fp =
          (output as { args?: { filePath?: string } })?.args?.filePath ||
          (output as { args?: { file_path?: string } })?.args?.file_path ||
          (input as { args?: { filePath?: string } })?.args?.filePath;
        if (typeof fp !== "string") return;
        if (!isOpencodeConfig(fp)) return;
        if (!existsSync(fp)) return;

        const sha = sha256File(fp);
        if (!sha) return;
        const size = statSync(fp).size;
        const sessionId = (input as { sessionId?: string })?.sessionId;

        appendAudit({
          timestamp: new Date().toISOString(),
          file_path: fp,
          sha256: sha,
          byte_size: size,
          tool,
          session_id: sessionId,
        });
      } catch (err) {
        console.error("[pai-config-audit] uncaught:", err);
      }
    },
  };
};
