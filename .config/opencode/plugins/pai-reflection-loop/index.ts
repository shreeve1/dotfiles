/**
 * pai-reflection-loop — ensure reflection JSONL exists and stays bounded.
 *
 * Adapted from upstream PAI v6.3.0 hooks/lib/log-rotation + reflection convention.
 * OpenCode trigger: catch-all `event` handler with type discrimination on
 * `event.type === "session.idle"` — verified against
 * @opencode-ai/plugin/dist/index.d.ts:170-173 and
 * @opencode-ai/sdk/dist/gen/types.gen.d.ts:414. There is no named
 * `session.idle` hook in the OpenCode plugin API.
 *
 * Responsibilities:
 *   1. Ensure ~/.claude/MEMORY/LEARNING/REFLECTIONS/ exists.
 *   2. If algorithm-reflections.jsonl exceeds MAX_BYTES, rotate it to
 *      algorithm-reflections.jsonl.1 (single-generation rotation).
 *   3. Append a session-idle marker line so we can audit which sessions ended
 *      without an explicit LEARN-phase reflection.
 *
 * The actual reflection content is authored by the model during LEARN phase via
 * direct Write/Edit on the JSONL — this plugin only manages the file, not the
 * content. That keeps the plugin OpenCode-runtime-compatible (no UserPromptSubmit
 * dependency) and keeps reflection authorship with the model.
 *
 * Fails closed: any error logs to stderr; never blocks session shutdown.
 */

import type { Plugin } from "@opencode-ai/plugin";
import {
  existsSync,
  mkdirSync,
  statSync,
  renameSync,
  appendFileSync,
} from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const REFLECTIONS_DIR = join(
  homedir(),
  ".claude",
  "MEMORY",
  "LEARNING",
  "REFLECTIONS"
);
const REFLECTIONS_LOG = join(REFLECTIONS_DIR, "algorithm-reflections.jsonl");
const MAX_BYTES = 5 * 1024 * 1024; // 5 MiB before rotation

function ensureDir(): void {
  try {
    mkdirSync(REFLECTIONS_DIR, { recursive: true });
  } catch (err) {
    console.error("[pai-reflection-loop] mkdir failed:", err);
  }
}

function rotateIfLarge(): void {
  try {
    if (!existsSync(REFLECTIONS_LOG)) return;
    if (statSync(REFLECTIONS_LOG).size <= MAX_BYTES) return;
    renameSync(REFLECTIONS_LOG, REFLECTIONS_LOG + ".1");
  } catch (err) {
    console.error("[pai-reflection-loop] rotation failed:", err);
  }
}

function appendIdleMarker(sessionId: string | undefined): void {
  try {
    const entry = {
      kind: "session-idle-marker",
      timestamp: new Date().toISOString(),
      session_id: sessionId,
      note: "Plugin-emitted marker. The actual LEARN-phase reflection (if any) is appended by the model via Write/Edit during LEARN.",
    };
    appendFileSync(REFLECTIONS_LOG, JSON.stringify(entry) + "\n", "utf-8");
  } catch (err) {
    console.error("[pai-reflection-loop] append failed:", err);
  }
}

interface IdleEventProps {
  sessionID?: string;
  session_id?: string;
}

export const PaiReflectionLoop: Plugin = async () => {
  return {
    event: async (input) => {
      try {
        const evt = (input as { event?: { type?: string; properties?: unknown } })
          ?.event;
        if (!evt || evt.type !== "session.idle") return;
        ensureDir();
        rotateIfLarge();
        const props = (evt.properties as IdleEventProps | undefined) || {};
        const sessionId = props.sessionID || props.session_id;
        appendIdleMarker(sessionId);
      } catch (err) {
        console.error("[pai-reflection-loop] uncaught:", err);
      }
    },
  };
};
