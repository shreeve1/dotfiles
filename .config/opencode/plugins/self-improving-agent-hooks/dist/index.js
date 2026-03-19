import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

const execFileAsync = promisify(execFile);
const DEFAULT_SKILL_ROOT = path.join(
  os.homedir(),
  ".config",
  "opencode",
  ".agents",
  "skills",
  "self-improving-agent",
);
const HOOKS_DIR = "hooks";
const IDLE_DEBOUNCE_MS = 1500;

function resolveSkillRoot() {
  return process.env.SELF_IMPROVING_AGENT_ROOT || DEFAULT_SKILL_ROOT;
}

function resolveHookScript(scriptName) {
  return path.join(resolveSkillRoot(), HOOKS_DIR, scriptName);
}

function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function stringify(value) {
  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value ?? {});
  } catch {
    return String(value ?? "");
  }
}

function detectExitCode(metadata, output) {
  const candidates = [
    metadata?.exitCode,
    metadata?.exit_code,
    metadata?.status,
    output?.metadata?.exitCode,
    output?.metadata?.exit_code,
    output?.metadata?.status,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return String(candidate);
    }
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return "0";
}

async function runHook(scriptName, args = [], extraEnv = {}) {
  const scriptPath = resolveHookScript(scriptName);
  if (!fileExists(scriptPath)) {
    return;
  }

  try {
    await execFileAsync("bash", [scriptPath, ...args], {
      env: {
        ...process.env,
        SELF_IMPROVING_AGENT_ROOT: resolveSkillRoot(),
        ...extraEnv,
      },
      maxBuffer: 1024 * 1024,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[self-improving-agent-hooks] ${scriptName} failed: ${message}`);
  }
}

const idleRuns = new Map();

const SelfImprovingAgentHooksPlugin = async () => {
  return {
    "tool.execute.before": async (input, output) => {
      await runHook("pre-tool.sh", [input.tool, stringify(output.args)], {
        TOOL_NAME: input.tool,
        TOOL_INPUT: stringify(output.args),
        SESSION_ID: input.sessionID,
        CALL_ID: input.callID,
      });
    },

    "tool.execute.after": async (input, output) => {
      if (input.tool !== "bash") {
        return;
      }

      const exitCode = detectExitCode(output.metadata, output);
      await runHook("post-bash.sh", [output.output || "", exitCode], {
        TOOL_NAME: input.tool,
        TOOL_INPUT: stringify(input.args),
        TOOL_OUTPUT: output.output || "",
        EXIT_CODE: exitCode,
        SESSION_ID: input.sessionID,
        CALL_ID: input.callID,
      });
    },

    event: async ({ event }) => {
      if (event.type === "session.idle") {
        const now = Date.now();
        const lastRun = idleRuns.get(event.properties.sessionID) || 0;
        if (now - lastRun < IDLE_DEBOUNCE_MS) {
          return;
        }
        idleRuns.set(event.properties.sessionID, now);

        await runHook("session-end.sh", [], {
          SESSION_ID: event.properties.sessionID,
          EVENT_TYPE: event.type,
        });
        return;
      }

      if (event.type === "session.deleted") {
        idleRuns.delete(event.properties.info.id);
      }
    },
  };
};

export default SelfImprovingAgentHooksPlugin;
export { SelfImprovingAgentHooksPlugin };
