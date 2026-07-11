import type {
  AssistantMessage,
  Context,
  Message,
  SimpleStreamOptions,
  Usage,
} from "@earendil-works/pi-ai/compat";
import { createHash } from "node:crypto";

export type ModelSlot = { provider: string; model: string };
export type AdvisorContextMode = "initial" | "postTool" | "full";

export type MoaConfig = {
  referenceModels: ModelSlot[];
  aggregator: ModelSlot;
  referenceTemperature: number;
  aggregatorTemperature: number;
  referenceMaxTokens: number;
  advisorContextMode: AdvisorContextMode;
  maxAdvisorRefreshesPerTurn: number;
  maxToolResultChars: number;
  maxAdvisorContextChars: number;
  includeToolResultsForAdvisors: boolean;
  enableFullTrace: boolean;
  enableVerifier: boolean;
  verifier?: ModelSlot;
  verifierTemperature: number;
  verifierMaxTokens: number;
  maxVerifierLoops: number;
};

export type VerifierVerdict = { verdict: "PASS" | "REVISE"; text: string };

export type AdvisorContextBuild = {
  context: Context;
  text: string;
  digest: string;
  truncatedChars: number;
};

export const PRESET_NAME = "Fusion";
export const PRESET_LABEL = "Pi MoA Fusion";

export const DEFAULT_CONFIG: MoaConfig = {
  referenceModels: [
    { provider: "opencode-go", model: "kimi-k2.7-code" },
    { provider: "opencode-go", model: "glm-5.2" },
  ],
  aggregator: { provider: "opencode-go", model: "deepseek-v4-flash" },
  referenceTemperature: 0.2,
  aggregatorTemperature: 0.1,
  referenceMaxTokens: 650,
  advisorContextMode: "postTool",
  maxAdvisorRefreshesPerTurn: 1,
  maxToolResultChars: 6000,
  maxAdvisorContextChars: 20000,
  includeToolResultsForAdvisors: true,
  enableFullTrace: false,
  enableVerifier: true,
  verifier: { provider: "opencode-go", model: "glm-5.2" },
  verifierTemperature: 0,
  verifierMaxTokens: 700,
  maxVerifierLoops: 1,
};

export const CODING_EDGE_CASE_CHECKLIST = `Task-derived coding verification checklist:
- Derive acceptance criteria from the user request and the repository's documented contract.
- Inspect relevant source, tests, and available tool evidence before changing behavior.
- Preserve documented API and data invariants, including compatibility and immutability requirements.
- Consider boundary, failure, concurrency, mutation, and ordering behavior when relevant to this task.
- Run requested tests plus the smallest focused regression check that would fail without the change.
- Do not weaken protected tests or claim actions or results that were not verified.`;

export const REFERENCE_SYSTEM_PROMPT = `You are a reference advisor in a Mixture of Agents (MoA) process.
You are NOT the acting agent and you do NOT execute anything: you cannot call tools, run commands, browse, or access files/repositories/URLs. A separate aggregator/orchestrator model has those capabilities and will take the actual actions.

The conversation below is the current state of a task handled by that acting agent. Give your best private advice: understand the goal, reason about the problem, recommend concrete next steps and tool-use strategy, surface risks/pitfalls, and point out anything the acting agent may miss.

For coding, debugging, or refactoring, extract task-specific acceptance criteria and risks from the supplied contract and evidence. Apply this checklist only where relevant; do not invent requirements:
${CODING_EDGE_CASE_CHECKLIST}

Respond with advice directly. No preamble, no disclaimers about access. Your response is private guidance handed to the aggregator, not the final user answer.`;

export const VERIFIER_SYSTEM_PROMPT = `You are the private verifier in a Mixture of Agents coding workflow.
Judge the candidate against the user request, documented repository contract, and supplied evidence. Do not invent requirements.

Apply this task-derived checklist where relevant:
${CODING_EDGE_CASE_CHECKLIST}

Return PASS only when the candidate satisfies the contract, respects the available evidence, and does not claim unverified actions. Otherwise return REVISE with concrete issues and required actions.

Respond exactly with either:
VERDICT: PASS

or:
VERDICT: REVISE
ISSUES:
- ...
REQUIRED_ACTIONS:
- ...`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readSlot(value: unknown, name: string): ModelSlot {
  if (!isRecord(value)) throw new Error(`${name} must be an object with provider and model`);
  const provider = typeof value.provider === "string" ? value.provider.trim() : "";
  const model = typeof value.model === "string" ? value.model.trim() : "";
  if (!provider || !model) throw new Error(`${name} must have non-empty provider and model`);
  return { provider, model };
}

function readNumber(value: unknown, name: string, positive = false): number {
  if (typeof value !== "number" || !Number.isFinite(value) || (positive && value <= 0)) {
    throw new Error(`${name} must be a ${positive ? "positive " : ""}number`);
  }
  return value;
}

function readOptionalNumber(value: unknown, name: string, fallback: number, positive = false): number {
  if (value === undefined) return fallback;
  return readNumber(value, name, positive);
}

function readOptionalBoolean(value: unknown, name: string, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  if (typeof value !== "boolean") throw new Error(`${name} must be a boolean`);
  return value;
}

function readOptionalSlot(value: unknown, name: string): ModelSlot | undefined {
  return value === undefined ? undefined : readSlot(value, name);
}

function readAdvisorContextMode(value: unknown): AdvisorContextMode {
  if (value === undefined) return DEFAULT_CONFIG.advisorContextMode;
  if (value === "initial" || value === "postTool" || value === "full") return value;
  throw new Error("advisorContextMode must be one of initial, postTool, full");
}

export function validateMoaConfig(value: unknown): MoaConfig {
  if (!isRecord(value)) throw new Error("config must be a JSON object");
  if (!Array.isArray(value.referenceModels) || value.referenceModels.length === 0) {
    throw new Error("referenceModels must be a non-empty array");
  }
  const verifier = readOptionalSlot(value.verifier, "verifier");

  return {
    referenceModels: value.referenceModels.map((slot, index) => readSlot(slot, `referenceModels[${index}]`)),
    aggregator: readSlot(value.aggregator, "aggregator"),
    referenceTemperature: readNumber(value.referenceTemperature, "referenceTemperature"),
    aggregatorTemperature: readNumber(value.aggregatorTemperature, "aggregatorTemperature"),
    referenceMaxTokens: readNumber(value.referenceMaxTokens, "referenceMaxTokens", true),
    advisorContextMode: readAdvisorContextMode(value.advisorContextMode),
    maxAdvisorRefreshesPerTurn: readOptionalNumber(
      value.maxAdvisorRefreshesPerTurn,
      "maxAdvisorRefreshesPerTurn",
      DEFAULT_CONFIG.maxAdvisorRefreshesPerTurn,
      true,
    ),
    maxToolResultChars: readOptionalNumber(
      value.maxToolResultChars,
      "maxToolResultChars",
      DEFAULT_CONFIG.maxToolResultChars,
      true,
    ),
    maxAdvisorContextChars: readOptionalNumber(
      value.maxAdvisorContextChars,
      "maxAdvisorContextChars",
      DEFAULT_CONFIG.maxAdvisorContextChars,
      true,
    ),
    includeToolResultsForAdvisors: readOptionalBoolean(
      value.includeToolResultsForAdvisors,
      "includeToolResultsForAdvisors",
      DEFAULT_CONFIG.includeToolResultsForAdvisors,
    ),
    enableFullTrace: readOptionalBoolean(value.enableFullTrace, "enableFullTrace", DEFAULT_CONFIG.enableFullTrace),
    enableVerifier: readOptionalBoolean(value.enableVerifier, "enableVerifier", DEFAULT_CONFIG.enableVerifier),
    ...(verifier ? { verifier } : {}),
    verifierTemperature: readOptionalNumber(
      value.verifierTemperature,
      "verifierTemperature",
      DEFAULT_CONFIG.verifierTemperature,
    ),
    verifierMaxTokens: readOptionalNumber(value.verifierMaxTokens, "verifierMaxTokens", DEFAULT_CONFIG.verifierMaxTokens, true),
    maxVerifierLoops: readOptionalNumber(value.maxVerifierLoops, "maxVerifierLoops", DEFAULT_CONFIG.maxVerifierLoops, true),
  };
}

export function resolveVerifierSlot(config: MoaConfig): ModelSlot {
  return (
    config.verifier ??
    config.referenceModels.find(
      (slot) => slot.provider !== config.aggregator.provider || slot.model !== config.aggregator.model,
    ) ??
    config.aggregator
  );
}

export function zeroUsage(): Usage {
  return {
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    totalTokens: 0,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
  };
}

export function addUsage(a: Usage, b?: Usage): Usage {
  if (!b) return a;
  return {
    input: a.input + (b.input ?? 0),
    output: a.output + (b.output ?? 0),
    cacheRead: a.cacheRead + (b.cacheRead ?? 0),
    cacheWrite: a.cacheWrite + (b.cacheWrite ?? 0),
    cacheWrite1h: (a.cacheWrite1h ?? 0) + (b.cacheWrite1h ?? 0),
    reasoning: (a.reasoning ?? 0) + (b.reasoning ?? 0),
    totalTokens: a.totalTokens + (b.totalTokens ?? 0),
    cost: {
      input: a.cost.input + (b.cost?.input ?? 0),
      output: a.cost.output + (b.cost?.output ?? 0),
      cacheRead: a.cost.cacheRead + (b.cost?.cacheRead ?? 0),
      cacheWrite: a.cost.cacheWrite + (b.cost?.cacheWrite ?? 0),
      total: a.cost.total + (b.cost?.total ?? 0),
    },
  };
}

function blockText(block: any): string {
  if (!block || typeof block !== "object") return "";
  if (block.type === "text" && typeof block.text === "string") return block.text;
  if (typeof block.text === "string") return block.text;
  if (typeof block.content === "string") return block.content;
  return "";
}

function contentText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map(blockText).filter(Boolean).join("\n");
  if (content == null) return "";
  return JSON.stringify(content);
}

export function truncateMiddle(text: string, maxChars: number): { text: string; truncatedChars: number } {
  if (text.length <= maxChars) return { text, truncatedChars: 0 };
  const keep = Math.max(1, Math.floor(maxChars / 2));
  const truncatedChars = text.length - keep * 2;
  return {
    text: `${text.slice(0, keep)}\n...\n<truncated ${truncatedChars} chars>\n...\n${text.slice(-keep)}`,
    truncatedChars,
  };
}

export function textFromMessage(
  message: Message,
  options: { includeToolResults?: boolean; maxToolResultChars?: number; includeToolCalls?: boolean } = {},
): string {
  if (message.role === "user") {
    if (typeof message.content === "string") return message.content;
    return message.content
      .map((block) => (block.type === "text" ? block.text : "[image omitted for MoA advisor]"))
      .join("\n");
  }

  if (message.role === "assistant") {
    return message.content
      .map((block) => {
        if (block.type === "text") return block.text;
        if (block.type === "thinking") return "";
        if (block.type === "toolCall") {
          return options.includeToolCalls ? `[tool call: ${block.name}]` : `[tool call omitted: ${block.name}]`;
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }

  const toolName = (message as any).toolName ?? (message as any).name ?? "unknown";
  if (!options.includeToolResults) return `[tool result omitted: ${toolName}]`;
  const raw = contentText((message as any).content);
  const truncated = truncateMiddle(raw, options.maxToolResultChars ?? DEFAULT_CONFIG.maxToolResultChars);
  return `[tool result: ${toolName}]\n${truncated.text}`;
}

export function textFromAssistant(message: AssistantMessage): string {
  return message.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .filter(Boolean)
    .join("\n")
    .trim();
}

export function hasToolCalls(message: AssistantMessage): boolean {
  return message.content.some((block) => block.type === "toolCall");
}

export function parseVerifierVerdict(text: string): VerifierVerdict {
  return /^\s*VERDICT:\s*PASS\b/im.test(text) && !/^\s*VERDICT:\s*REVISE\b/im.test(text)
    ? { verdict: "PASS", text }
    : { verdict: "REVISE", text };
}

function lastUserIndex(messages: Message[]): number {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") return i;
  }
  return messages.length - 1;
}

export function referenceContext(context: Context): Context {
  const lastIndex = lastUserIndex(context.messages);
  const messages: Message[] = [];
  for (const message of context.messages.slice(0, lastIndex + 1)) {
    if (message.role !== "user" && message.role !== "assistant") continue;
    const text = textFromMessage(message).trim();
    if (!text) continue;
    if (message.role === "user") {
      messages.push({ role: "user", content: text, timestamp: message.timestamp ?? Date.now() });
    } else {
      messages.push({
        role: "assistant",
        content: [{ type: "text", text }],
        api: message.api,
        provider: message.provider,
        model: message.model,
        usage: zeroUsage(),
        stopReason: "stop",
        timestamp: message.timestamp ?? Date.now(),
      });
    }
  }
  return { systemPrompt: REFERENCE_SYSTEM_PROMPT, messages };
}

function roleLabel(message: Message): string {
  if (message.role === "user") return "user";
  if (message.role === "assistant") return "assistant";
  return `tool:${(message as any).toolName ?? (message as any).name ?? "unknown"}`;
}

function transcriptFromMessages(
  messages: Message[],
  options: { includeToolResults?: boolean; maxToolResultChars?: number; includeToolCalls?: boolean } = {},
): string {
  return messages
    .map((message) => {
      const text = textFromMessage(message, options).trim();
      return text ? `## ${roleLabel(message)}\n${text}` : "";
    })
    .filter(Boolean)
    .join("\n\n");
}

function digestText(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function digestContext(context: Context): string {
  return digestText(transcriptFromMessages(context.messages));
}

export function buildAdvisorContext(context: Context, config: MoaConfig): AdvisorContextBuild {
  if (config.advisorContextMode === "initial") {
    const legacy = referenceContext(context);
    const text = transcriptFromMessages(legacy.messages);
    return { context: legacy, text, digest: digestText(text), truncatedChars: 0 };
  }

  const sourceMessages = config.advisorContextMode === "full" ? context.messages : context.messages.slice(lastUserIndex(context.messages));
  const rawText = transcriptFromMessages(sourceMessages, {
    includeToolResults: config.includeToolResultsForAdvisors,
    maxToolResultChars: config.maxToolResultChars,
    includeToolCalls: true,
  });
  const truncated = truncateMiddle(rawText, config.maxAdvisorContextChars);
  const advisorContext: Context = {
    systemPrompt: REFERENCE_SYSTEM_PROMPT,
    messages: [{ role: "user", content: truncated.text, timestamp: Date.now() }],
  };
  return {
    context: advisorContext,
    text: truncated.text,
    digest: digestText(truncated.text),
    truncatedChars: truncated.truncatedChars,
  };
}

function isAdvisorContextBuild(value: Context | AdvisorContextBuild): value is AdvisorContextBuild {
  return isRecord(value) && typeof (value as any).digest === "string" && isRecord((value as any).context);
}

export function advisorCacheKey(
  config: MoaConfig,
  advisorContext: Context | AdvisorContextBuild,
  options?: SimpleStreamOptions,
): string {
  return JSON.stringify({
    preset: PRESET_NAME,
    config,
    reasoning: options?.reasoning ?? "high",
    advisorContextDigest: isAdvisorContextBuild(advisorContext) ? advisorContext.digest : digestContext(advisorContext),
  });
}

export function advisorTurnKey(config: MoaConfig, context: Context, options?: SimpleStreamOptions): string {
  const initial = referenceContext(context);
  return JSON.stringify({
    preset: PRESET_NAME,
    config,
    reasoning: options?.reasoning ?? "high",
    userTurnDigest: digestContext(initial),
  });
}

export function buildVerifierContext(
  context: Context,
  references: Array<{ label: string; text: string }>,
  candidate: AssistantMessage,
  config: MoaConfig,
): Context {
  const evidence = truncateMiddle(
    transcriptFromMessages(context.messages, {
      includeToolResults: true,
      maxToolResultChars: config.maxToolResultChars,
      includeToolCalls: true,
    }),
    config.maxAdvisorContextChars,
  );
  const advice = references.map((ref, index) => `## Advisor ${index + 1}: ${ref.label}\n${ref.text || "(no advice returned)"}`).join("\n\n---\n\n");
  const candidateText = truncateMiddle(
    textFromMessage(candidate, { includeToolCalls: true }).trim() || "(candidate had no output)",
    config.maxAdvisorContextChars,
  ).text;

  return {
    systemPrompt: VERIFIER_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        timestamp: Date.now(),
        content: `# Task context and evidence\n${evidence.text}\n\n# Advisor notes\n${advice}\n\n# Candidate final answer\n${candidateText}`,
      },
    ],
  };
}

export function aggregatorContext(
  context: Context,
  references: Array<{ label: string; text: string }>,
  stage: "draft" | "acting" = "acting",
): Context {
  const instruction =
    stage === "draft"
      ? "Produce a private candidate for independent verification. Do not call tools or claim unverified actions were completed. State any missing evidence or required tool actions explicitly. This draft is not shown to the user."
      : "Use the private MoA advisory context above as input, but you are the only acting agent. You must decide whether to call tools, resolve disagreements, and produce the final answer for the user. Before finalizing a coding/refactor task, verify the task-derived checklist against the available files and test output.";
  const guidance = `<moa_advisory_context private="true" preset="${PRESET_LABEL}" stage="${stage}">
${references
  .map((ref, index) => `## Advisor ${index + 1}: ${ref.label}\n${ref.text || "(no advice returned)"}`)
  .join("\n\n---\n\n")}

## Mandatory acting-agent checklist
${CODING_EDGE_CASE_CHECKLIST}
</moa_advisory_context>

${instruction}`;

  return {
    ...context,
    ...(stage === "draft" ? { tools: undefined } : {}),
    messages: [...context.messages, { role: "user", content: guidance, timestamp: Date.now() }],
  };
}
