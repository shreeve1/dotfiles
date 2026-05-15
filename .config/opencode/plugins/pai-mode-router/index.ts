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
    // Tracks whether a valid todowrite has actually been observed in this
    // session. Distinct from `initialized` (which only signals that ISA
    // scaffolding succeeded for durable sessions). The todowrite-first
    // hard-stop is gated on this field, not on `initialized`, so a durable
    // session cannot bypass the gate just because the ISA stub was created.
    todowriteSeenAt?: string;
    primerAttempts?: number;
  };
  classifiedAt: string;
  algorithmActivatedMessageCount?: number;
  messageCount: number;
  firstPrompt: string;
};

const PRIMER_ATTEMPTS_CAP = 5;

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

// Distinctive markers from internal sub-agent / classifier system prompts that
// the router historically mis-classified as ALGORITHM and scaffolded ISAs from
// (session titler, sentiment scorer, summary generator, auth handshake, etc.).
// Matching any of these short-circuits classification to MINIMAL so no slug or
// ISA is created. Keep entries narrow and verbatim to avoid suppressing real
// user prompts that merely reuse the same words.
const SUBAGENT_PROMPT_FINGERPRINTS = [
  "you are naming a work session",
  "generate an exactly 4-word title",
  "analyze james schriever's message for emotional sentiment",
  "loop must never self-rate",
  "output only the 4-word title",
  "reply with claude_auth_ok only",
  "output format (json only)",
  "complete sentence summarizing the user",
  "2-4 word complete sentence summarizing",
  "rating scale:",
  "implied negative (rate",
  "implied positive (rate",
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

// Detect when a user message has had a Skill SKILL.md body auto-injected as a
// preamble (opencode's skill auto-load behavior). The pattern:
//   1. starts with `# <Name> Skill` (or similar markdown skill header)
//   2. contains heavy documentation prose (routing logic, examples, tools tables)
//   3. ends with the *actual* user request as a short tail (one or two trailing
//      paragraphs, usually a sentence-cased question).
//
// Returns the user tail if a skill preamble is detected, otherwise returns the
// original prompt unchanged. The router classifies whatever this returns, so
// trivial questions never get escalated to durable ISA just because the skill
// body mentions `delete`, `production`, `database`, etc.
function stripSkillPreamble(prompt: string): string {
  let trimmed = prompt.trim();
  if (trimmed.length < 400) return prompt;
  // Fallback 1: opencode core may wrap injected skills in a tagged block such
  // as `<skill_content name="...">…</skill_content>`. Strip that wrapper first
  // so downstream heuristics see the unwrapped body or the trailing user tail.
  const skillContentRe =
    /<skill_content\b[^>]*>[\s\S]*?<\/skill_content>\s*/i;
  if (skillContentRe.test(trimmed)) {
    trimmed = trimmed.replace(skillContentRe, "").trim();
    if (!trimmed) return prompt;
    if (trimmed.length < 400) return trimmed;
  }
  const firstLine = trimmed.split("\n", 1)[0] ?? "";
  // Heuristic 1: opencode skill auto-load always starts with `# <Name> Skill`.
  const looksLikeSkillHeader = /^#\s+[A-Z][\w/ -]*\s+Skill\b/i.test(firstLine);
  // Heuristic 2: contains a Routing Logic / Tools Reference section.
  const lower = trimmed.toLowerCase();
  const hasSkillBodyMarkers =
    lower.includes("routing logic") ||
    lower.includes("tools reference") ||
    lower.includes("## sections") ||
    lower.includes("## workflows");
  // Heuristic 3: leading fenced block with an info string starting with `skill`
  // (e.g., ```skill or ```skill-content). Strip the whole fence and continue.
  const fenceMatch = trimmed.match(/^```skill[^\n]*\n[\s\S]*?\n```\s*/i);
  if (fenceMatch) {
    const remainder = trimmed.slice(fenceMatch[0].length).trim();
    if (remainder.length > 0) return remainder;
  }
  if (!looksLikeSkillHeader && !hasSkillBodyMarkers) return prompt;

  // Find the user tail: take the last non-empty trailing block that does NOT
  // start with a markdown heading, code fence, table row, or bullet. Walk
  // upward from the end to gather contiguous prose lines.
  const lines = trimmed.split("\n");
  const tail: string[] = [];
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i] ?? "";
    const t = line.trim();
    if (!t) {
      if (tail.length > 0) break;
      continue;
    }
    if (
      t.startsWith("#") ||
      t.startsWith("```") ||
      t.startsWith("|") ||
      t.startsWith("- ") ||
      t.startsWith("* ") ||
      /^\d+\.\s/.test(t) ||
      t.startsWith(">")
    ) {
      if (tail.length > 0) break;
      continue;
    }
    tail.unshift(t);
    // Keep the tail short — user prompts after skills are typically 1-3 lines.
    if (tail.join(" ").length > 600) break;
  }
  const tailText = tail.join("\n").trim();
  if (!tailText || tailText.length < 8) return prompt;
  // Guard: if the tail looks like more documentation prose (very long, no
  // question/imperative), fall back to the original prompt.
  if (tailText.length > 600 && !/[?]/.test(tailText)) return prompt;
  return tailText;
}

function isSubagentPrompt(prompt: string): boolean {
  const text = prompt.toLowerCase();
  return SUBAGENT_PROMPT_FINGERPRINTS.some((f) => text.includes(f));
}

function classify(prompt: string): Mode {
  const text = prompt.toLowerCase().trim();
  if (!text) return "MINIMAL";

  // Internal sub-agent / classifier prompts must never produce an ISA.
  if (isSubagentPrompt(prompt)) return "MINIMAL";

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
  if (isSubagentPrompt(prompt)) return false;
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

function isAlgorithmDurable(session: SessionState): boolean {
  return session.mode === "ALGORITHM" && session.algorithm?.contract === "isa";
}

// Both lite and durable ALGORITHM sessions require todowrite-first before any
// other tool. Lite uses 2-8 in-memory criteria; durable uses todowrite to
// outline the OBSERVE/THINK/PLAN/BUILD/EXECUTE/VERIFY/LEARN phases up front.
function requiresTodowriteFirst(session: SessionState): boolean {
  return isAlgorithmLite(session) || isAlgorithmDurable(session);
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
  const slug = state.slug ?? "";
  const shared = [
    "First output line MUST be EXACTLY: ════ PAI | ALGORITHM MODE ═══════════════════",
    `Session slug: ${slug}`,
    "MUST: use todowrite BEFORE any other tool; the tool layer blocks all other tool calls until todowrite is initialized.",
    "MUST: complete OBSERVE → THINK → PLAN → BUILD → EXECUTE → VERIFY → LEARN with visible phase labels.",
    "MUST: OBSERVE is the first phase; do not reorder.",
    "MUST: PLAN includes visible DELIVERABLE MANIFEST, DELEGATION GATE, and PARALLELISM OPPORTUNITY SCAN.",
    "MUST: verify criteria before claiming completion.",
    "DO NOT skip phases. DO NOT bypass ISC verification. DO NOT emit text before the banner.",
  ];
  if (state.algorithm?.contract === "lite") {
    return [
      "<pai-algorithm-directive>",
      "Contract: PAI Algorithm-lite.",
      ...shared,
      "MUST: todowrite contains 2-8 compact criteria covering goal, plan, and verification.",
      "MUST: BUILD is included when artifacts/code/config change; otherwise state BUILD: not needed.",
      "DO NOT create an ISA file unless the task escalates to durable/multi-session work or the user explicitly asks.",
      "DO NOT skip criteria just because this is Algorithm-lite.",
      "</pai-algorithm-directive>",
    ].join("\n");
  }
  return [
    "<pai-algorithm-directive>",
    "Contract: PAI Algorithm v6.4.0 (durable-ISA).",
    `ISA scaffold pre-created at: ${state.isaPath ?? ""}`,
    ...shared,
    "MUST: todowrite contains 2-8 atomic criteria covering Problem, Goal, ISC verification, and the 7 phases.",
    "MUST: follow the PAI Algorithm instructions in system context before acting.",
    "MUST: edit the pre-created ISA file (do not create a new one) — fill Problem, Goal, Criteria, Test Strategy with atomic ISCs.",
    "MUST: keep ISA frontmatter slug, name, tier, phase fields current.",
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
        const rawPrompt = extractPromptText(parts);
        if (!rawPrompt) return;
        // If opencode auto-injected a SKILL.md body as a preamble, classify the
        // user's actual tail prompt instead of the skill documentation.
        const prompt = stripSkillPreamble(rawPrompt);

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
        // Both lite and durable sessions keep getting a short reminder until
        // todowrite has actually been observed (todowriteSeenAt is set). Once
        // observed, skip the primer for that turn but still allow the
        // system-prompt directive to apply. Note: we gate on todowriteSeenAt,
        // NOT on `initialized`, because durable sessions set initialized=true
        // as soon as the ISA stub is scaffolded — which happens before any
        // todowrite call.
        if (session.algorithm?.todowriteSeenAt) return;
        // Cap primer attempts so a persistent state-write failure cannot cause
        // the primer to be re-injected on every turn forever.
        const attempts = session.algorithm?.primerAttempts ?? 0;
        if (attempts >= PRIMER_ATTEMPTS_CAP) {
          if (attempts === PRIMER_ATTEMPTS_CAP) {
            console.error(
              `[pai-mode-router] primer attempts cap reached for session ${sessionID}; suppressing further primers`,
            );
            if (session.algorithm) {
              session.algorithm.primerAttempts = attempts + 1;
              state.sessions[sessionID] = session;
              saveState(state);
            }
          }
          return;
        }
        if (session.algorithm) {
          session.algorithm.primerAttempts = attempts + 1;
          state.sessions[sessionID] = session;
          saveState(state);
        }

        const primerText = isAlgorithmLite(session)
          ? "[pai-mode-router] This session is ALGORITHM-lite. Before any other tool, call todowrite with 2-8 compact criteria/tasks covering goal, plan, and verification. Do not create an ISA unless escalation is needed. The tool layer will block other tools until todowrite runs."
          : "[pai-mode-router] This session is ALGORITHM (durable-ISA). " +
            `Slug=${session.slug}. ISA stub at ${session.isaPath}. ` +
            "Your first output line MUST be: ════ PAI | ALGORITHM MODE ═══════════════════. " +
            "Before any other tool, call todowrite with 2-8 atomic criteria covering Problem, Goal, ISC verification, and the 7 Algorithm phases. The tool layer will block other tools until todowrite runs. Then begin OBSERVE and edit the ISA in place.";

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
        if (!session || !requiresTodowriteFirst(session)) return;
        // Gate on whether todowrite has actually been observed in this
        // session, NOT on `initialized` — which durable sessions set when
        // the ISA stub is scaffolded, before any todowrite call.
        if (session.algorithm?.todowriteSeenAt) return;
        if (tool === "todowrite") return;
        const contractLabel = isAlgorithmDurable(session)
          ? "ALGORITHM durable-ISA"
          : "ALGORITHM-lite";
        console.error(
          `[pai-mode-router] ${contractLabel} blocked ${tool} before todowrite initialization for session ${sessionID}`
        );
        throw new Error(
          `pai-mode-router: ${contractLabel} requires todowrite with 2-8 compact criteria before any other tool.`
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
        if (!session || !requiresTodowriteFirst(session)) return;
        if (!isValidLiteTodo(input?.args)) return;
        if (session.algorithm?.todowriteSeenAt) return;
        const contract = session.algorithm?.contract ?? "lite";
        const now = new Date().toISOString();
        session.algorithm = {
          contract,
          initialized: true,
          initializedAt: session.algorithm?.initializedAt ?? now,
          todowriteSeenAt: now,
          primerAttempts: session.algorithm?.primerAttempts,
        };
        state.sessions[sessionID] = session;
        saveState(state);
        const contractLabel = contract === "isa" ? "ALGORITHM durable-ISA" : "ALGORITHM-lite";
        console.error(
          `[pai-mode-router] ${contractLabel} initialized by todowrite for session ${sessionID}`
        );
      } catch (err) {
        console.error("[pai-mode-router] tool.execute.after failed", err);
      }
    },
  };
};
