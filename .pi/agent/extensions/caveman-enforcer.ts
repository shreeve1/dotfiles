import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

type CavemanLevel = "lite" | "full" | "ultra" | "wenyan-lite" | "wenyan-full" | "wenyan-ultra";

interface CavemanStateEntry {
  enabled: boolean;
  level: CavemanLevel;
  updatedAt: string;
  source?: string;
}

const STATE_CUSTOM_TYPE = "caveman-config";
const DEFAULT_LEVEL: CavemanLevel = "ultra";
const STATE_FILE = path.join(os.homedir(), ".pi", "agent", "state", "caveman-state.json");

const VALID_LEVELS: CavemanLevel[] = [
  "lite",
  "full",
  "ultra",
  "wenyan-lite",
  "wenyan-full",
  "wenyan-ultra",
];

function normalizeLevel(raw: string | undefined): CavemanLevel | null {
  if (!raw) return null;
  const level = raw.trim().toLowerCase() as CavemanLevel;
  return VALID_LEVELS.includes(level) ? level : null;
}

function levelRule(level: CavemanLevel): string {
  switch (level) {
    case "lite":
      return "lite: keep full sentences; remove filler, hedging, and pleasantries only.";
    case "full":
      return "full: drop articles often, fragments OK, short direct wording.";
    case "ultra":
      return "ultra: maximum terseness; abbreviate common terms (DB/auth/config/req/res/fn/impl), use arrows for causality (X -> Y).";
    case "wenyan-lite":
      return "wenyan-lite: semi-classical concise Chinese style; preserve clarity and technical correctness.";
    case "wenyan-full":
      return "wenyan-full: strongly classical Chinese brevity; retain technical precision.";
    case "wenyan-ultra":
      return "wenyan-ultra: extreme classical compression while preserving core technical meaning.";
    default:
      return "full: concise caveman style with full technical correctness.";
  }
}

function cavemanPrompt(level: CavemanLevel): string {
  return `
IMPORTANT: CAVEMAN STYLE ENFORCER ACTIVE (${level.toUpperCase()})

You MUST respond in this style for EVERY response. No exceptions except safety overrides listed below.

Style rules:
- ${levelRule(level)}
- Keep technical accuracy complete. Remove verbosity only.
- Keep code blocks, commands, file paths, errors, and identifiers exact.
- If user says "normal mode" or "stop caveman", switch to normal style for this session.

Before responding, verify your response follows these rules: abbreviated terms used, arrows for causality where appropriate, no unnecessary articles, fragments acceptable.

Example ultra responses:
- User: "Why is my API slow?" → Response: "N+1 queries in user lookup. Each req fires DB call per item. Batch w/ IN clause or DataLoader."
- User: "How do I fix the auth bug?" → Response: "Token expiry check uses \`<\` not \`<=\`. Off-by-one → tokens valid 1s longer. Fix comparison op."

Safety override (temporary normal clarity allowed):
- security warnings
- destructive/irreversible confirmations
- multi-step sequences where ambiguity risks mistakes
- when user appears confused

After safety/clarity section, resume caveman style.
`;
}

function safeNotify(ctx: any, message: string, level: "info" | "error" = "info") {
  try {
    ctx.ui.notify(message, level);
  } catch {
    // Non-interactive mode can ignore notifications.
  }
}

function readStateFile(): { enabled: boolean; level: CavemanLevel } | null {
  try {
    const raw = fs.readFileSync(STATE_FILE, "utf-8");
    const data = JSON.parse(raw);
    if (typeof data?.enabled !== "boolean") return null;
    const level = normalizeLevel(typeof data.level === "string" ? data.level : undefined);
    if (!level) return null;
    return { enabled: data.enabled, level };
  } catch {
    return null;
  }
}

function writeStateFile(stateEnabled: boolean, stateLevel: CavemanLevel): void {
  try {
    const dir = path.dirname(STATE_FILE);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify({ enabled: stateEnabled, level: stateLevel, updatedAt: Date.now() }, null, 2));
  } catch {
    // Silently fail — session-scoped persistence still works.
  }
}

function restoreStateFromBranch(ctx: ExtensionContext): CavemanStateEntry | null {
  // Priority 1: state file (cross-session)
  const fileState = readStateFile();
  if (fileState) {
    return {
      enabled: fileState.enabled,
      level: fileState.level,
      updatedAt: new Date().toISOString(),
      source: "state-file",
    };
  }

  // Priority 2: branch entries (session-scoped)
  const branchEntries = ctx.sessionManager.getBranch();
  let latest: CavemanStateEntry | null = null;

  for (const entry of branchEntries) {
    if (entry.type !== "custom" || entry.customType !== STATE_CUSTOM_TYPE) continue;
    const data = entry.data as Partial<CavemanStateEntry> | undefined;
    const level = normalizeLevel(typeof data?.level === "string" ? data.level : undefined);
    if (!level || typeof data?.enabled !== "boolean") continue;
    latest = {
      enabled: data.enabled,
      level,
      updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : "",
      source: typeof data.source === "string" ? data.source : undefined,
    };
  }

  return latest;
}

export default function cavemanEnforcer(pi: ExtensionAPI) {
  let enabled = true;
  let level: CavemanLevel = DEFAULT_LEVEL;

  function persistState(source: string) {
    pi.appendEntry<CavemanStateEntry>(STATE_CUSTOM_TYPE, {
      enabled,
      level,
      updatedAt: new Date().toISOString(),
      source,
    });
    writeStateFile(enabled, level);
  }

  function setMode(next: { enabled?: boolean; level?: CavemanLevel }, source: string): boolean {
    const newEnabled = typeof next.enabled === "boolean" ? next.enabled : enabled;
    const newLevel = next.level ?? level;
    const changed = newEnabled !== enabled || newLevel !== level;

    if (!changed) return false;

    enabled = newEnabled;
    level = newLevel;
    persistState(source);
    return true;
  }

  function notifyStatus(ctx: any) {
    const state = enabled ? `ON (${level})` : "OFF (normal mode)";
    safeNotify(ctx, `Caveman mode ${state}`, "info");
  }

  pi.registerCommand("caveman-mode", {
    description: "Set caveman mode: /caveman-mode [lite|full|ultra|wenyan-lite|wenyan-full|wenyan-ultra|on|off|status|reset]",
    handler: async (args, ctx) => {
      const raw = (args ?? "").trim().toLowerCase();

      if (!raw || raw === "status") {
        notifyStatus(ctx);
        return;
      }

      if (raw === "reset") {
        setMode({ enabled: true, level: DEFAULT_LEVEL }, "command:reset");
        safeNotify(ctx, `Caveman mode ON (${DEFAULT_LEVEL})`, "info");
        return;
      }

      if (raw === "on") {
        setMode({ enabled: true }, "command:on");
        safeNotify(ctx, `Caveman mode ON (${level})`, "info");
        return;
      }

      if (raw === "off" || raw === "normal") {
        setMode({ enabled: false }, "command:off");
        safeNotify(ctx, "Caveman mode OFF (normal mode)", "info");
        return;
      }

      const nextLevel = normalizeLevel(raw);
      if (nextLevel) {
        setMode({ enabled: true, level: nextLevel }, `command:level:${nextLevel}`);
        safeNotify(ctx, `Caveman mode ON (${level})`, "info");
        return;
      }

      safeNotify(
        ctx,
        "Usage: /caveman-mode [lite|full|ultra|wenyan-lite|wenyan-full|wenyan-ultra|on|off|status|reset]",
        "error",
      );
    },
  });

  pi.on("session_start", async (_event, ctx) => {
    const restored = restoreStateFromBranch(ctx);
    if (!restored) return;
    enabled = restored.enabled;
    level = restored.level;
  });

  pi.on("session_tree", async (_event, ctx) => {
    const restored = restoreStateFromBranch(ctx);
    if (!restored) return;
    enabled = restored.enabled;
    level = restored.level;
  });

  pi.on("input", async (event: any, ctx: any) => {
    if (event.source === "extension") return { action: "continue" };

    const text = String(event.text ?? "").trim();
    if (!text) return { action: "continue" };

    const lower = text.toLowerCase();

    // Exact mode toggles (do not swallow message; let assistant acknowledge).
    if (lower === "normal mode" || lower === "stop caveman") {
      setMode({ enabled: false }, "input:exact:normal");
      safeNotify(ctx, "Caveman mode OFF (normal mode)", "info");
      return { action: "continue" };
    }

    if (lower === "caveman mode" || lower === "use caveman") {
      setMode({ enabled: true }, "input:exact:on");
      safeNotify(ctx, `Caveman mode ON (${level})`, "info");
      return { action: "continue" };
    }

    const exactLevelMatch = text.match(/^\s*caveman\s+(lite|full|ultra|wenyan-lite|wenyan-full|wenyan-ultra)\s*$/i);
    if (exactLevelMatch) {
      const nextLevel = normalizeLevel(exactLevelMatch[1]);
      if (nextLevel) {
        setMode({ enabled: true, level: nextLevel }, `input:exact:level:${nextLevel}`);
        safeNotify(ctx, `Caveman mode ON (${level})`, "info");
      }
      return { action: "continue" };
    }

    // Inline directives require a colon to avoid accidental prompt rewrites.
    const normalPrefix = text.match(/^\s*(normal mode|stop caveman)\s*:\s+([\s\S]+)$/i);
    if (normalPrefix) {
      setMode({ enabled: false }, "input:inline:normal");
      safeNotify(ctx, "Caveman mode OFF (normal mode)", "info");
      return { action: "transform", text: normalPrefix[2].trim() };
    }

    const usePrefix = text.match(/^\s*(caveman mode|use caveman)\s*:\s+([\s\S]+)$/i);
    if (usePrefix) {
      setMode({ enabled: true }, "input:inline:on");
      safeNotify(ctx, `Caveman mode ON (${level})`, "info");
      return { action: "transform", text: usePrefix[2].trim() };
    }

    const cavemanPrefix = text.match(
      /^\s*caveman(?:\s+(lite|full|ultra|wenyan-lite|wenyan-full|wenyan-ultra))?\s*:\s+([\s\S]+)$/i,
    );
    if (cavemanPrefix) {
      const matchedLevel = normalizeLevel(cavemanPrefix[1]);
      if (matchedLevel) {
        setMode({ enabled: true, level: matchedLevel }, `input:inline:level:${matchedLevel}`);
      } else {
        setMode({ enabled: true }, "input:inline:caveman");
      }
      safeNotify(ctx, `Caveman mode ON (${level})`, "info");
      return { action: "transform", text: cavemanPrefix[2].trim() };
    }

    return { action: "continue" };
  });

  pi.on("before_agent_start", async (event: any) => {
    if (!enabled) return undefined;
    return {
      systemPrompt: `${cavemanPrompt(level)}\n\n${event.systemPrompt}`,
    };
  });
}
