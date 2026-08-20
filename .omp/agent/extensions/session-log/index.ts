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
      const iso = new Date().toISOString();

      mkdirSync(dir, { recursive: true });

      let out = "";
      if (n === 1 && !existsSync(outFile)) {
        out += `# Session ${sessionId}\n\n- cwd: ${ctx.cwd}\n- started: ${iso}\n`;
      }
      out +=
        `\n## Turn ${n} — ${iso}\n\n` +
        `**Prompt:**\n\n${prompt}\n\n` +
        `**Response:**\n\n${answer}\n\n---\n`;

      appendFileSync(outFile, out);
      turnCounts.set(sessionId, { file: outFile, n });
    } catch {
      // FS or extraction failure is non-fatal — the turn already completed.
    }
  });
}
