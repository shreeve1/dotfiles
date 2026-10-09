import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";
import { spawn } from "node:child_process";
import { appendFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

// End-of-turn grounding gate for omp. Same core as the Claude Code and Codex
// Stop hooks: pipes the final answer to ~/.agents/bin/verify-final and, when it
// returns {"decision":"block"}, sends the findings back as a next-turn message so
// the agent corrects itself. The correction follows the already-streamed answer.
// Runs only in the interactive main session (child/print/RPC sessions are skipped)
// unless VERIFY_FINAL_HEADLESS=1. Kill switch: VERIFY_FINAL=0.
const SCRIPT = join(homedir(), ".agents", "bin", "verify-final");
const TIMEOUT_MS = 150_000;
const LOG = join(homedir(), ".cache", "verify-final.log");

// One line per outcome in the same log the script writes, so a missed check is explainable.
function note(status: string, detail = ""): void {
  try {
    mkdirSync(dirname(LOG), { recursive: true });
    const ts = new Date().toLocaleString("sv-SE").replace(" ", "T");
    appendFileSync(LOG, `${ts} omp ${status} 0.0s ${detail}\n`);
  } catch {
    // Logging must never disturb the session.
  }
}

// Checked read of one property off an unknown value (no inline shape cast).
function field(obj: unknown, key: string): unknown {
  if (typeof obj === "object" && obj !== null && key in obj) return obj[key];
  return undefined;
}

function textOf(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  const parts: string[] = [];
  for (const block of content) {
    const text = field(block, "text");
    if (field(block, "type") === "text" && typeof text === "string") parts.push(text);
  }
  return parts.join("\n");
}

function lastAssistantText(messages: unknown): string {
  if (!Array.isArray(messages)) return "";
  for (let i = messages.length - 1; i >= 0; i--) {
    if (field(messages[i], "role") !== "assistant") continue;
    const text = textOf(field(messages[i], "content")).trim();
    if (text) return text;
  }
  return "";
}

function runVerify(payload: object): Promise<string> {
  const { promise, resolve } = Promise.withResolvers<string>();
  const child = spawn(SCRIPT, ["--harness", "omp"], { stdio: ["pipe", "pipe", "ignore"] });
  let out = "";
  const timer = setTimeout(() => child.kill("SIGKILL"), TIMEOUT_MS);
  child.stdout.on("data", (d) => {
    out += d;
  });
  child.on("error", () => resolve(""));
  child.on("close", () => {
    clearTimeout(timer);
    resolve(out);
  });
  child.stdin.end(JSON.stringify(payload));
  return promise;
}

export default function (pi: ExtensionAPI) {
  // One correction pass per user turn: the follow-up turn's own agent_end is skipped.
  let correcting = false;

  // A newer agent run invalidates any verification still in flight.
  let generation = 0;
  pi.on("agent_start", () => {
    generation++;
  });

  // omp aborts agent_end handlers after 30 s and the checker can take longer, so the
  // handler only starts the check; the result is delivered when it finishes.
  pi.on("agent_end", (event, ctx) => {
    if (process.env.VERIFY_FINAL === "0") return;
    if (field(event, "willContinue") === true) {
      note("skip_will_continue");
      return;
    }
    if (ctx.mode !== "tui" && process.env.VERIFY_FINAL_HEADLESS !== "1") return;
    const answer = lastAssistantText(field(event, "messages"));
    if (!answer) {
      note("skip_no_answer");
      return;
    }
    const wasCorrecting = correcting;
    correcting = false;
    const started = generation;
    const cwd = ctx.cwd;
    const sid = ctx.sessionManager.getSessionId();
    void runVerify({
      last_assistant_message: answer,
      cwd,
      stop_hook_active: wasCorrecting,
      session_id: sid,
    })
      .then((out) => {
        if (!out.trim()) return;
        if (started !== generation) {
          note("dropped_new_run", `sid=${sid.slice(0, 8)} len=${answer.length}`);
          return;
        }
        const res: unknown = JSON.parse(out);
        const warning = field(res, "systemMessage");
        const reason = field(res, "reason");
        if (typeof warning === "string") {
          try {
            if (ctx.hasUI) ctx.ui.notify(warning, "warning");
          } catch {
            // Context went stale while the check ran; drop the warning.
          }
        }
        if (field(res, "decision") === "block" && typeof reason === "string") {
          correcting = true;
          pi.sendMessage(
            { customType: "verify-final", content: reason, display: true },
            { triggerTurn: true, deliverAs: "nextTurn" },
          );
        }
      })
      .catch(() => {
        // Never disturb the session because the verifier failed.
      });
  });
}
