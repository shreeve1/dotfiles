import { realpathSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, relative, resolve, sep } from "node:path";

const root = realpathSync(process.env.GRALPH_WORKTREE || process.cwd());
const verificationCommand = process.env.GRALPH_VERIFY_COMMAND || "";
const guardedTools = new Set(["read", "write", "edit", "grep", "find", "ls"]);

function insideRoot(path) {
  const rel = relative(root, path);
  return rel === "" || (!rel.startsWith(`..${sep}`) && rel !== "..");
}

function canonicalTarget(inputPath = ".") {
  const absolute = resolve(root, inputPath.replace(/^@/, ""));
  let existing = absolute;
  while (!existsSync(existing)) {
    const parent = dirname(existing);
    if (parent === existing) break;
    existing = parent;
  }
  const canonicalExisting = realpathSync(existing);
  return resolve(canonicalExisting, relative(existing, absolute));
}

function isSecretPath(path) {
  const normalized = path.split(sep).join("/");
  const base = normalized.slice(normalized.lastIndexOf("/") + 1);
  return (
    base === ".env" || base.startsWith(".env.") ||
    base === ".git-credentials" || base === ".gitconfig" ||
    normalized.includes("/.ssh/") || normalized.endsWith("/.ssh") ||
    /\/(?:\.pi|\.claude)\/.*(?:auth|credential)/i.test(normalized) ||
    /\/(?:\.config\/git|\.git)\/credentials?(?:\.|\/|$)/i.test(normalized) ||
    /\/\.config\/gh\/hosts\.yml$/i.test(normalized)
  );
}

function scrubbedEnvironment() {
  const env = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (!/(?:TOKEN|SECRET|PASSWORD|PASSWD|CREDENTIAL|API_KEY|AUTH|SSH_AUTH_SOCK|GIT_ASKPASS)/i.test(key)) {
      env[key] = value;
    }
  }
  return {
    ...env,
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_CONFIG_COUNT: "1",
    GIT_CONFIG_KEY_0: "credential.helper",
    GIT_CONFIG_VALUE_0: "",
    GIT_TERMINAL_PROMPT: "0",
    GCM_INTERACTIVE: "Never",
    GIT_SSH_COMMAND: "false",
  };
}

function runCheck(signal) {
  if (!verificationCommand) throw new Error("Verification command is not configured");
  return new Promise((resolvePromise, reject) => {
    const child = spawn("/bin/sh", ["-c", verificationCommand], {
      cwd: root,
      env: scrubbedEnvironment(),
      signal,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.stderr.on("data", (chunk) => { output += chunk; });
    child.on("error", reject);
    child.on("close", (code) => {
      const text = output.length > 50_000 ? `${output.slice(-50_000)}\n[output truncated]` : output;
      if (code !== 0) return reject(new Error(`Verification failed (${code})\n${text}`));
      resolvePromise({ content: [{ type: "text", text: text || "Verification passed" }], details: { exitCode: code } });
    });
  });
}

export default function gralphWorkerGuard(pi) {
  pi.on("tool_call", (event) => {
    if (!guardedTools.has(event.toolName)) return;
    const requested = typeof event.input?.path === "string" ? event.input.path : ".";
    let target;
    try {
      target = canonicalTarget(requested);
    } catch (error) {
      return { block: true, reason: `Cannot resolve guarded path: ${error.message}` };
    }
    if (!insideRoot(target)) return { block: true, reason: "Path escapes the worker worktree" };
    if (isSecretPath(target)) return { block: true, reason: "Secret and credential paths are unavailable to workers" };
  });

  pi.registerTool({
    name: "gralph_check",
    label: "Run admitted verification",
    description: "Run the issue verification command admitted by the Gralph coordinator. Accepts no arguments.",
    promptSnippet: "Run the single coordinator-approved verification command",
    parameters: { type: "object", properties: {}, additionalProperties: false },
    async execute(_toolCallId, _params, signal) {
      return runCheck(signal);
    },
  });
}
