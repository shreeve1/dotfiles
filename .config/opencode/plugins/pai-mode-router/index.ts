import type { Plugin } from "@opencode-ai/plugin";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

// =============================================================================
// pai-mode-router
//
// Auto-classifies every user prompt into MINIMAL / NATIVE / ALGORITHM and
// steers the model accordingly:
//   - chat.message: classify, persist state, choose lite vs durable Algorithm
//   - experimental.chat.system.transform: inject mode-specific system content
//   - experimental.chat.messages.transform: inject Algorithm-lite reminders
//   - tool.execute.before/after: enforce Algorithm-lite checklist initialization
//
// Replaces pai-session-reminder.
// =============================================================================

type Mode = "MINIMAL" | "NATIVE" | "ALGORITHM";

type SessionState = {
  mode: Mode;
  slug?: string;
  isaPath?: string;
  algorithm?: {
    contract: "lite" | "isa";
    initialized?: boolean;
    initializedAt?: string;
  };
  classifiedAt: string;
  algorithmActivatedMessageCount?: number;
  messageCount: number;
  firstPrompt: string;
};

type RouterState = {
  sessions: Record<string, SessionState>;
  updated_at: string;
};

const HOME = homedir();
const PAI_RUNTIME_HOME = process.env.PAI_RUNTIME_HOME || join(HOME, ".pai");
const MEMORY_DIR = join(PAI_RUNTIME_HOME, "memory");
const STATE_PATH =
  process.env.PAI_MODE_ROUTER_STATE_PATH ||
  join(MEMORY_DIR, "STATE", "mode-router.json");
const WORK_DIR = join(MEMORY_DIR, "WORK");
const OPENCODE_DIR = join(HOME, ".config", "opencode");
const ALGORITHM_MODE_PATH = join(OPENCODE_DIR, "modes", "algorithm.md");
const NATIVE_MODE_PATH = join(OPENCODE_DIR, "modes", "native.md");
const MINIMAL_MODE_PATH = join(OPENCODE_DIR, "modes", "minimal.md");

const MINIMAL_KEYWORDS = [
  "thanks",
  "thank you",
  "ok",
  "got it",
  "good",
  "great",
  "nice",
  "rating:",
  "rate:",
  "hi",
  "hello",
  "hey",
];

const ALGORITHM_KEYWORDS = [
  "implement",
  "build",
  "design",
  "refactor",
  "migrate",
  "port",
  "investigate",
  "diagnose",
  "debug",
  "architect",
  "plan",
  "research",
  "analyze",
  "audit",
  "review",
  "fix",
  "create",
  "set up",
  "setup",
  "deploy",
  "test",
  "update",
  "evaluate",
  "compare",
  "explore",
  "trace",
  "spec",
  "ship",
  "rewrite",
  "modify",
];

const ESCALATION_PHRASES = [
  "make this change",
  "make the change",
  "make that change",
  "implement this",
  "implement that",
  "update this",
  "update that",
  "fix this",
  "fix that",
  "do this",
  "do that",
  "go ahead and",
];

const NATIVE_INDICATORS = [
  "what is",
  "what's",
  "show me",
  "list",
  "how do i",
  "how to",
  "where",
  "when",
  "why",
  "explain",
  "summarize",
  "tell me",
  "read",
  "look at",
];

const ISA_ESCALATION_KEYWORDS = [
  "isa",
  "prd",
  "spec",
  "implementation plan",
  "multi-file",
  "migration",
  "infrastructure",
  "production",
  "deploy",
  "destructive",
  "delete",
  "remove",
  "force push",
  "database",
  "schema",
  "architecture",
];

const VAGUE_CRITERIA = [
  "do it",
  "do the task",
  "complete task",
  "finish task",
  "make it work",
  "handle request",
  "satisfy user",
];

// -----------------------------------------------------------------------------
// State helpers
// -----------------------------------------------------------------------------

function ensureDir(p: string) {
  try {
    mkdirSync(p, { recursive: true });
  } catch {}
}

function loadState(): RouterState {
  try {
    if (existsSync(STATE_PATH)) {
      return JSON.parse(readFileSync(STATE_PATH, "utf8")) as RouterState;
    }
  } catch {}
  return { sessions: {}, updated_at: new Date().toISOString() };
}

function saveState(state: RouterState) {
  try {
    ensureDir(dirname(STATE_PATH));
    state.updated_at = new Date().toISOString();
    writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), "utf8");
  } catch (err) {
    console.error("[pai-mode-router] saveState failed", err);
  }
}

function readModeFile(p: string): string {
  try {
    const raw = readFileSync(p, "utf8");
    // Strip YAML frontmatter if present
    if (raw.startsWith("---\n")) {
      const end = raw.indexOf("\n---\n", 4);
      if (end !== -1) return raw.slice(end + 5);
    }
    return raw;
  } catch {
    return "";
  }
}

// -----------------------------------------------------------------------------
// Prompt extraction + classification
// -----------------------------------------------------------------------------

function extractPromptText(parts: any[]): string {
  if (!Array.isArray(parts)) return "";
  const chunks: string[] = [];
  for (const p of parts) {
    if (p && p.type === "text" && typeof p.text === "string") {
      chunks.push(p.text);
    }
  }
  return chunks.join("\n").trim();
}

function classify(prompt: string): Mode {
  const text = prompt.toLowerCase().trim();
  if (!text) return "MINIMAL";

  const wordCount = text.split(/\s+/).filter(Boolean).length;

  // Very short responses are usually MINIMAL.
  if (wordCount <= 3) {
    if (MINIMAL_KEYWORDS.some((k) => text.includes(k))) return "MINIMAL";
    return "NATIVE";
  }

  // Explicit rating/acknowledgement patterns.
  if (/^(rating|rate)\s*[:=]/.test(text)) return "MINIMAL";
  if (/^(thanks|thank you|ok|got it)\b/.test(text) && wordCount <= 8) {
    return "MINIMAL";
  }

  // Multi-step / multi-sentence indicators bias to ALGORITHM.
  const sentenceCount = text.split(/[.!?]+/).filter((s) => s.trim()).length;
  const hasAlgKeyword = ALGORITHM_KEYWORDS.some((k) =>
    new RegExp(`\\b${k}\\b`).test(text),
  );
  const hasNativeIndicator = NATIVE_INDICATORS.some((k) => text.includes(k));

  if (hasAlgKeyword && wordCount > 5) return "ALGORITHM";
  if (sentenceCount >= 3 && wordCount > 25) return "ALGORITHM";
  if (wordCount > 60) return "ALGORITHM";

  if (hasNativeIndicator && wordCount <= 30) return "NATIVE";
  if (wordCount <= 15) return "NATIVE";

  return "ALGORITHM";
}

function shouldEscalateToAlgorithm(prompt: string): boolean {
  const text = prompt.toLowerCase().trim();
  if (!text) return false;
  if (classify(prompt) === "ALGORITHM") return true;
  return ESCALATION_PHRASES.some((phrase) => text.includes(phrase));
}

function shouldCreateDurableIsa(prompt: string): boolean {
  const text = prompt.toLowerCase();
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount > 160) return true;
  return ISA_ESCALATION_KEYWORDS.some((k) => text.includes(k));
}

function initializeAlgorithmState(session: SessionState, prompt: string): void {
  const slug = buildSlug(prompt);
  session.slug = slug;
  if (shouldCreateDurableIsa(prompt)) {
    const isaPath = createIsaStub(slug, prompt);
    if (isaPath) session.isaPath = isaPath;
    session.algorithm = { contract: "isa", initialized: Boolean(isaPath) };
    return;
  }
  session.algorithm = { contract: "lite", initialized: false };
}

function isAlgorithmLite(session: SessionState): boolean {
  return session.mode === "ALGORITHM" && session.algorithm?.contract === "lite";
}

function isValidLiteTodo(args: any): boolean {
  const todos = args?.todos;
  if (!Array.isArray(todos)) return false;
  if (todos.length < 2 || todos.length > 8) return false;
  return todos.every((todo: any) => {
    const content = String(todo?.content ?? "").trim();
    if (content.length < 12 || content.length > 180) return false;
    const lower = content.toLowerCase();
    if (VAGUE_CRITERIA.some((v) => lower === v || lower.includes(v))) {
      return false;
    }
    return true;
  });
}

// -----------------------------------------------------------------------------
// Slug + ISA scaffold
// -----------------------------------------------------------------------------

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

function slugify(text: string): string {
  const cleaned = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const stop = new Set([
    "a", "an", "the", "to", "of", "for", "and", "or", "but",
    "in", "on", "at", "by", "is", "are", "was", "be", "been",
    "this", "that", "these", "those", "i", "we", "you", "it",
    "can", "could", "should", "would", "do", "does", "did",
    "with", "from", "into", "as", "if", "so", "then", "than",
    "please", "now", "today", "also",
  ]);
  const words = cleaned
    .split(" ")
    .filter((w) => w && !stop.has(w))
    .slice(0, 8);
  const slug = words.join("-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return slug || "task";
}

function buildSlug(prompt: string): string {
  return `${timestamp()}_${slugify(prompt)}`;
}

function isaTemplate(slug: string, name: string, prompt: string): string {
  const created = new Date().toISOString();
  return `---
slug: ${slug}
name: ${JSON.stringify(name)}
tier: E2
phase: OBSERVE
created: ${created}
source: pai-mode-router
---

# ${name}

## Problem

<!-- One paragraph stating the problem this work solves. -->
${prompt}

## Goal

<!-- One sentence stating the ideal end state. -->

## Criteria

<!-- Atomic, testable Ideal State Criteria. Each line: \`- [ ] ISC-NN: <criterion>\` -->
- [ ] ISC-01:

## Test Strategy

<!-- How each ISC will be verified. -->

## Decisions

<!-- Architectural / approach decisions made during work. -->

## Changelog

<!-- Append-only record of what changed and why. -->
- ${created}: ISA scaffolded by pai-mode-router from prompt classification
`;
}

function createIsaStub(slug: string, prompt: string): string | undefined {
  try {
    const dir = join(WORK_DIR, slug);
    const file = join(dir, "ISA.md");
    if (existsSync(file)) return file;
    ensureDir(dir);
    const name = prompt
      .split(/[.!?\n]/)[0]
      .trim()
      .slice(0, 80) || slug;
    writeFileSync(file, isaTemplate(slug, name, prompt), "utf8");
    return file;
  } catch (err) {
    console.error("[pai-mode-router] createIsaStub failed", err);
    return undefined;
  }
}

// -----------------------------------------------------------------------------
// System prompt construction
// -----------------------------------------------------------------------------

function modeBanner(state: SessionState): string {
  const lines: string[] = [];
  lines.push("<pai-mode-router>");
  lines.push(`MODE: ${state.mode}`);
  if (state.slug) lines.push(`SLUG: ${state.slug}`);
  if (state.isaPath) lines.push(`ISA: ${state.isaPath}`);
  if (state.algorithm) {
    lines.push(`CONTRACT: ${state.algorithm.contract}`);
    lines.push(`CONTRACT_INITIALIZED: ${Boolean(state.algorithm.initialized)}`);
  }
  lines.push(`CLASSIFIED_AT: ${state.classifiedAt}`);
  lines.push("</pai-mode-router>");
  return lines.join("\n");
}

function modeSystemBlock(mode: Mode): string {
  if (mode === "ALGORITHM") {
    const body = readModeFile(ALGORITHM_MODE_PATH);
    return `<pai-algorithm-mode>\n${body.trim()}\n</pai-algorithm-mode>`;
  }
  if (mode === "NATIVE") {
    const body = readModeFile(NATIVE_MODE_PATH);
    return `<pai-native-mode>\n${body.trim()}\n</pai-native-mode>`;
  }
  const body = readModeFile(MINIMAL_MODE_PATH);
  return `<pai-minimal-mode>\n${body.trim()}\n</pai-minimal-mode>`;
}

function algorithmDirective(state: SessionState): string {
  if (state.algorithm?.contract === "lite") {
    return [
      "<pai-algorithm-directive>",
      "You are running under PAI Algorithm-lite.",
      "Your first output line MUST be: ════ PAI | ALGORITHM MODE ═══════════════════",
      `Session slug: ${state.slug ?? ""}`,
      "MUST: use the existing todowrite tool before any other tool.",
      "MUST: make todowrite contain 2-8 compact criteria/tasks that express goal, plan, and verification work.",
      "MUST: complete OBSERVE → THINK → PLAN → EXECUTE → VERIFY → LEARN in the response flow.",
      "MUST: verify criteria before claiming completion.",
      "DO NOT create an ISA file unless the task escalates to durable/multi-session work or the user explicitly asks for one.",
      "DO NOT skip criteria just because this is Algorithm-lite.",
      "</pai-algorithm-directive>",
    ].join("\n");
  }
  return [
    "<pai-algorithm-directive>",
    "You are running under the PAI Algorithm v6.3.0.",
    "Your first output line MUST be: ════ PAI | ALGORITHM MODE ═══════════════════",
    "Required first phase: OBSERVE.",
    `An ISA scaffold has been pre-created at: ${state.isaPath ?? ""}`,
    `Session slug: ${state.slug ?? ""}`,
    "MUST: follow the active PAI Algorithm instructions already present in system context before acting.",
    "MUST: edit the pre-created ISA file (do not create a new one) to fill in Problem, Goal, Criteria, Test Strategy with atomic ISCs.",
    "MUST: complete all 7 phases (OBSERVE → THINK → PLAN → BUILD → EXECUTE → VERIFY → LEARN).",
    "MUST: keep ISA frontmatter slug, name, tier, phase fields up to date.",
    "DO NOT skip phases. DO NOT bypass ISC verification.",
    "</pai-algorithm-directive>",
  ].join("\n");
}

// -----------------------------------------------------------------------------
// Plugin
// -----------------------------------------------------------------------------

export const PaiModeRouter: Plugin = async () => {
  return {
    "chat.message": async (input: any, output: any) => {
      try {
        const sessionID: string | undefined = input?.sessionID;
        if (!sessionID) return;
        const parts = output?.parts ?? [];
        const prompt = extractPromptText(parts);
        if (!prompt) return;

        const state = loadState();
        const existing = state.sessions[sessionID];
        const messageCount = (existing?.messageCount ?? 0) + 1;

        // Classify on the first user message. Later turns may escalate a
        // MINIMAL/NATIVE session to ALGORITHM, but never downgrade ALGORITHM.
        if (existing) {
          existing.messageCount = messageCount;
          if (
            existing.mode !== "ALGORITHM" &&
            shouldEscalateToAlgorithm(prompt)
          ) {
            existing.mode = "ALGORITHM";
            existing.classifiedAt = new Date().toISOString();
            initializeAlgorithmState(existing, prompt);
            existing.algorithmActivatedMessageCount = messageCount;
          }
          state.sessions[sessionID] = existing;
          saveState(state);
          return;
        }

        const mode = classify(prompt);
        const session: SessionState = {
          mode,
          classifiedAt: new Date().toISOString(),
          messageCount,
          firstPrompt: prompt.slice(0, 500),
        };

        if (mode === "ALGORITHM") {
          initializeAlgorithmState(session, prompt);
          session.algorithmActivatedMessageCount = messageCount;
        }

        state.sessions[sessionID] = session;
        saveState(state);
      } catch (err) {
        console.error("[pai-mode-router] chat.message hook failed", err);
      }
    },

    "experimental.chat.system.transform": async (input: any, output: any) => {
      try {
        const sessionID: string | undefined = input?.sessionID;
        if (!sessionID) return;
        const state = loadState();
        const session = state.sessions[sessionID];
        if (!session) return;

        const blocks: string[] = [
          modeBanner(session),
          modeSystemBlock(session.mode),
        ];
        if (session.mode === "ALGORITHM") {
          blocks.push(algorithmDirective(session));
        }
        const merged = blocks.join("\n\n");
        if (Array.isArray(output?.system)) {
          output.system.unshift(merged);
        }
      } catch (err) {
        console.error(
          "[pai-mode-router] system.transform hook failed",
          err,
        );
      }
    },

    "experimental.chat.messages.transform": async (
      _input: any,
      output: any,
    ) => {
      try {
        if (!Array.isArray(output?.messages)) return;
        const messages = output.messages;
        // Find the first user message in the array; that's the active turn.
        const firstUserIdx = messages.findIndex(
          (m: any) => m?.info?.role === "user",
        );
        if (firstUserIdx === -1) return;
        const userMsg = messages[firstUserIdx];
        const sessionID: string | undefined = userMsg?.info?.sessionID;
        if (!sessionID) return;

        const state = loadState();
        const session = state.sessions[sessionID];
        if (!session) return;
        if (session.mode !== "ALGORITHM") return;
        // Durable ISA sessions get one activation primer. Lite sessions keep
        // getting a short reminder until todowrite initializes the contract.
        if (
          session.algorithm?.contract !== "lite" &&
          session.messageCount !== session.algorithmActivatedMessageCount
        ) {
          return;
        }
        if (isAlgorithmLite(session) && session.algorithm?.initialized) {
          return;
        }

        const primerText = isAlgorithmLite(session)
          ? "[pai-mode-router] This session is ALGORITHM-lite. Before any other tool, call todowrite with 2-8 compact criteria/tasks covering goal, plan, and verification. Do not create an ISA unless escalation is needed."
          : "[pai-mode-router] This session was auto-classified ALGORITHM. " +
            `Slug=${session.slug}. ISA stub at ${session.isaPath}. ` +
            "Begin with the OBSERVE phase, follow the active Algorithm instructions, then edit the ISA.";

        // Inject a synthetic user primer right before this user turn, so the
        // model sees the active enforcement contract near the current prompt.
        const primer = {
          info: {
            id: `pai-router-primer-${Date.now()}`,
            sessionID,
            role: "user",
            time: { created: Date.now() },
          },
          parts: [
            {
              id: `pai-router-primer-part-${Date.now()}`,
              sessionID,
              messageID: `pai-router-primer-${Date.now()}`,
              type: "text",
              text: primerText,
              synthetic: true,
            },
          ],
        };
        messages.splice(firstUserIdx, 0, primer);
      } catch (err) {
        console.error(
          "[pai-mode-router] messages.transform hook failed",
          err,
        );
      }
    },

    "tool.execute.before": async (input: any) => {
      try {
        const sessionID: string | undefined = input?.sessionID;
        const tool: string | undefined = input?.tool;
        if (!sessionID || !tool) return;
        const state = loadState();
        const session = state.sessions[sessionID];
        if (!session || !isAlgorithmLite(session)) return;
        if (session.algorithm?.initialized) return;
        if (tool === "todowrite") return;
        console.error(
          `[pai-mode-router] ALGORITHM-lite blocked ${tool} before todowrite initialization for session ${sessionID}`
        );
        throw new Error(
          "pai-mode-router: ALGORITHM-lite requires todowrite with 2-8 compact criteria before any other tool."
        );
      } catch (err) {
        if (err instanceof Error && err.message.startsWith("pai-mode-router:")) {
          throw err;
        }
        console.error("[pai-mode-router] tool.execute.before failed", err);
      }
    },

    "tool.execute.after": async (input: any) => {
      try {
        const sessionID: string | undefined = input?.sessionID;
        const tool: string | undefined = input?.tool;
        if (!sessionID || tool !== "todowrite") return;
        const state = loadState();
        const session = state.sessions[sessionID];
        if (!session || !isAlgorithmLite(session)) return;
        if (!isValidLiteTodo(input?.args)) return;
        if (session.algorithm?.initialized) return;
        session.algorithm = {
          contract: "lite",
          initialized: true,
          initializedAt:
            session.algorithm?.initializedAt ?? new Date().toISOString(),
        };
        state.sessions[sessionID] = session;
        saveState(state);
        console.error(
          `[pai-mode-router] ALGORITHM-lite initialized by todowrite for session ${sessionID}`
        );
      } catch (err) {
        console.error("[pai-mode-router] tool.execute.after failed", err);
      }
    },
  };
};
