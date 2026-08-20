import type {
  ExtensionAPI,
  ExtensionContext,
  SessionEntry,
} from "@oh-my-pi/pi-coding-agent";
import { completeSimple } from "@oh-my-pi/pi-ai";
import { appendFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

const SESSIONS_DIRNAME = ".sessions";

// Walk up to the nearest .git; fall back to cwd. Mirrors gap-review's
// findProjectRoot so the log dir lands at the project root even from subdirs.
function findProjectRoot(cwd: string): string {
  let dir = resolve(cwd || process.cwd());
  const stop = dirname(dir);
  while (true) {
    if (existsSync(join(dir, ".git"))) return dir;
    if (dir === stop) return resolve(cwd || process.cwd());
    dir = dirname(dir);
  }
}

// Entries after the baseline leaf (the run's new entries). Self-contained copy
// of summaries' getRunEntries — do NOT import from the (disabled) summaries ext.
function getRunEntries(
  branch: readonly SessionEntry[],
  baselineLeafId: string | null,
): SessionEntry[] {
  if (baselineLeafId === null) return [...branch];
  const i = branch.findIndex((e) => e.id === baselineLeafId);
  return i === -1 ? [] : branch.slice(i + 1);
}

// Text from a user/assistant message content (string OR content[] of blocks).
function messageText(content: unknown): string {
  if (typeof content === "string") return content.trim();
  if (!Array.isArray(content)) return "";
  return content
    .filter(
      (b): b is { type: "text"; text: string } =>
        !!b &&
        typeof b === "object" &&
        "type" in b &&
        b.type === "text" &&
        "text" in b &&
        typeof b.text === "string",
    )
    .map((b) => b.text)
    .join("\n")
    .trim();
}
type LedgerCall = { name: string; args: object };

const INTERNAL_URI_PREFIXES = ["local://", "artifact://", "xd://"];
const VERIFICATION_RE =
  /^(?:(?:uv\s+run\s+)?pytest|(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?test|bun\s+test|vitest|jest|mocha|cargo\s+test|go\s+test|make\s+(?:test|build)|(?:npm|pnpm|yarn|bun)\s+run\s+build|cargo\s+build|go\s+build|eslint|biome\s+lint|ruff\s+check|cargo\s+clippy|golangci-lint\s+run|prettier\s+--check|tsc|mypy)\b/;

function verificationOutcome(content: unknown): string {
  const text = messageText(content);
  const testSummary = text.match(
    /\b\d+ passed(?:,\s*\d+ skipped)?(?:\s+in\s+[\d.]+s)?\b/,
  );
  if (testSummary) return testSummary[0];
  return text.split("\n").map((line) => line.trim()).filter(Boolean).at(-1)?.slice(0, 100) || "ok";
}

function buildWorkRecord(
  entries: readonly SessionEntry[],
  sessionsDir: string,
): string {
  const calls = new Map<string, LedgerCall>();
  const modified: string[] = [];
  const verified: string[] = [];
  const progress: string[] = [];
  let todo: string | null = null;

  for (const entry of entries) {
    if (entry.type !== "message") continue;
    const message: unknown = entry.message;
    if (!message || typeof message !== "object" || !("role" in message)) continue;

    if (message.role === "assistant" && "content" in message && Array.isArray(message.content)) {
      for (const block of message.content) {
        if (!block || typeof block !== "object" || !("type" in block)) continue;
        if (
          block.type === "toolCall" &&
          "id" in block && typeof block.id === "string" &&
          "name" in block && typeof block.name === "string" &&
          "arguments" in block && block.arguments && typeof block.arguments === "object"
        ) {
          calls.set(block.id, { name: block.name, args: block.arguments });
        } else if (block.type === "text" && "text" in block && typeof block.text === "string") {
          const text = block.text.trim().replace(/\s+/g, " ");
          if (text) progress.push(text.slice(0, 140));
        }
      }
      continue;
    }

    if (
      message.role !== "toolResult" ||
      !("toolCallId" in message) || typeof message.toolCallId !== "string" ||
      !("toolName" in message) || typeof message.toolName !== "string" ||
      ("isError" in message && message.isError === true)
    ) {
      continue;
    }

    const call = calls.get(message.toolCallId);
    const content = "content" in message ? message.content : undefined;
    if (message.toolName === "todo") {
      const match = messageText(content).match(
        /Overall:\s*(\d+)\/(\d+)\s+done,\s*(\d+)\s+open/i,
      );
      if (match) todo = `${match[1]} done, ${match[3]} open`;
    }
    if (!call) continue;

    if (call.name === "bash" && "command" in call.args && typeof call.args.command === "string") {
      if (VERIFICATION_RE.test(call.args.command) && verified.length < 5) {
        verified.push(`\`${call.args.command}\` — ${verificationOutcome(content)}`);
      }
      continue;
    }

    const paths =
      call.name === "edit" && "input" in call.args && typeof call.args.input === "string"
        ? [...call.args.input.matchAll(/^\[([^#\]]+)#[0-9A-F]{4}\]$/gm)].map((match) => match[1])
        : call.name === "write" && "path" in call.args && typeof call.args.path === "string"
          ? [call.args.path]
          : call.name === "ast_edit" && "paths" in call.args && Array.isArray(call.args.paths)
            ? call.args.paths.filter((path): path is string => typeof path === "string")
            : call.name === "lsp" && "action" in call.args && "file" in call.args &&
                typeof call.args.file === "string" &&
                (call.args.action === "rename_file" ||
                  (call.args.action === "rename" &&
                    (!("apply" in call.args) || call.args.apply !== false)) ||
                  (call.args.action === "code_actions" &&
                    "apply" in call.args && call.args.apply === true))
              ? [call.args.file]
              : [];
    for (const path of paths) {
      if (
        INTERNAL_URI_PREFIXES.some((prefix) => path.startsWith(prefix)) ||
        path.startsWith(`${sessionsDir}/`) ||
        path.startsWith(".sessions/") ||
        modified.includes(path)
      ) {
        continue;
      }
      modified.push(path);
    }
  }

  progress.pop(); // Final assistant response is written below, not duplicated here.
  const sections: string[] = [];
  if (modified.length) {
    const displayed = modified.slice(0, 10).map((path) => `\`${path}\``);
    if (modified.length > displayed.length) displayed.push(`+${modified.length - displayed.length} more`);
    sections.push(`**Modified**: ${displayed.join(", ")}`);
  }
  if (verified.length) sections.push(`**Verified**: ${verified.join("; ")}`);
  if (todo) sections.push(`**Todo state**: ${todo}`);
  if (progress.length) sections.push(`**Reported progress**: ${progress.slice(-3).join(" | ")}`);
  return sections.length ? `\n## Work record\n\n${sections.join("\n")}\n` : "";
}


async function makeSlug(
  ctx: ExtensionContext,
  prompt: string,
  answer: string,
): Promise<string | null> {
  try {
    // Follow the user's configured smol role (modelRoles.smol); fall back to
    // the session model. Matches omp's core role-alias resolution.
    const model = ctx.models.resolve("@smol") ?? ctx.model;
    if (!model) return null;
    const auth = await ctx.modelRegistry.getApiKeyAndHeaders(model);
    if (!auth.ok || !auth.apiKey) return null;
    const resp = await completeSimple(
      model,
      {
        systemPrompt:
          "You generate a short filename title. Given a coding session's first user request and the assistant's reply, respond with ONLY a concise 3 to 6 word title in plain lowercase words describing the task. No punctuation, no quotes, no explanation.",
        messages: [
          {
            role: "user",
            content: `PROMPT:\n${prompt.slice(0, 600)}\n\nRESPONSE:\n${answer.slice(0, 600)}`,
            timestamp: Date.now(),
          },
        ],
      },
      {
        apiKey: auth.apiKey,
        headers: auth.headers,
        maxTokens: 32,
        temperature: 0,
      },
    );
    if (resp.stopReason === "error" || resp.stopReason === "aborted") return null;
    const text = resp.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    return text || null;
  } catch {
    return null;
  }
}

export default function (pi: ExtensionAPI) {
  // Baseline leaf id for the current run. Read the sessionManager FRESH each
  // call (never cache it — session-replacement footgun, extensions.md:1237).
  let baselineLeafId: string | null = null;
  // Per-session turn counter. Resets on process restart (documented caveat).
  const turnCounts = new Map<string, { file: string; n: number }>();

  pi.on("before_agent_start", (_event, ctx) => {
    if (ctx.mode !== "tui") return;
    baselineLeafId = ctx.sessionManager.getLeafId();
  });

  pi.on("agent_end", async (event, ctx) => {
    try {
      if (event.willContinue) return; // auto-continuation, not a terminal settle
      if (ctx.mode !== "tui") return;

      const sm = ctx.sessionManager;
      const sessionFile = sm.getSessionFile();
      if (!sessionFile) return; // ephemeral / no-session run — nothing durable

      const entries = getRunEntries(sm.getBranch(), baselineLeafId);
      if (entries.length === 0) return;

      // First user text (prompt echo) + last non-empty assistant text (answer).
      let prompt = "";
      let answer = "";
      for (const entry of entries) {
        if (entry.type !== "message") continue;
        const role = entry.message.role;
        // AgentMessage is a broad union; not every member declares `content`
        // (string | blocks) — narrow with `in` before reading it.
        if (
          typeof entry.message !== "object" || entry.message === null ||
          !("content" in entry.message)
        ) {
          continue;
        }
        const content = entry.message.content; // unknown — messageText validates
        if (role === "user" && !prompt) {
          prompt = messageText(content);
        } else if (role === "assistant") {
          const t = messageText(content);
          if (t) answer = t; // keep the LAST non-empty assistant text
        }
      }

      if (!answer) return; // empty-turn guard — don't write empty blocks

      const sessionId = sm.getSessionId();
      const root = findProjectRoot(ctx.cwd);
      const dir = join(root, SESSIONS_DIRNAME);
      const base = basename(sessionFile);
      const sessionStart = base.slice(0, base.indexOf("_"));
      const startTime = sessionStart.includes("T")
        ? sessionStart.slice(0, 19).replace("T", "_")
        : sessionStart;
      const cached = turnCounts.get(sessionId);
      let outFile: string;
      let n: number;

      if (cached) {
        outFile = cached.file;
        n = cached.n + 1;
      } else {
        let existing: string | undefined;
        if (existsSync(dir)) {
          try {
            existing = readdirSync(dir).find(
              (entry) =>
                (entry.startsWith(`${startTime}_`) && entry.endsWith(".md")) ||
                entry.endsWith(`_${sessionId}.md`),
            );
          } catch {
            // Treat an unreadable sessions directory as having no existing log.
          }
        }
        if (existing) {
          outFile = join(dir, existing);
          n = 1;
        } else {
          const title = await makeSlug(ctx, prompt, answer);
          const slug = title
            ?.toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 40)
            .replace(/-+$/, "");
          const fileName = slug ? `${startTime}_${slug}.md` : `${startTime}_${sessionId}.md`;
          outFile = join(dir, fileName);
          n = 1;
        }
      }
      const workRecord = buildWorkRecord(entries, dir);

      mkdirSync(dir, { recursive: true });

      let out = "";
      if (n === 1 && !existsSync(outFile)) {
        out += `# Session ${sessionId}\n\n- cwd: ${ctx.cwd}\n- started: ${iso}\n`;
      }
      out +=
        `**Prompt:**\n\n${prompt}\n` +
        workRecord +
        `\n**Response:**\n\n${answer}\n\n---\n`;

      appendFileSync(outFile, out);
      turnCounts.set(sessionId, { file: outFile, n });
    } catch {
      // FS or extraction failure is non-fatal — the turn already completed.
    }
  });
}
