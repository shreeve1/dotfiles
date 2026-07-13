import type {
	AssistantMessage,
	Context,
	Message,
	SimpleStreamOptions,
	Usage,
} from "@earendil-works/pi-ai/compat";

// pi-duo: a two-model "actor + independent verifier" provider.
//
// Unlike a Mixture-of-Agents setup, pi-duo has NO advisor stage. One model (the
// actor) drives the whole session with real tools; before it finalizes, an
// independent verifier reviews a private, tool-free draft and can send it back
// once (bounded by maxVerifierLoops). No coding-specific discipline is injected
// — the verifier's job is only "did the actor answer from grounded evidence, or
// assert things it never checked?".

export type ModelSlot = { provider: string; model: string };

export type DuoConfig = {
	actor: ModelSlot;
	verifier: ModelSlot;
	actorTemperature: number;
	verifierTemperature: number;
	verifierMaxTokens: number;
	maxVerifierLoops: number;
	maxContextChars: number;
	maxToolResultChars: number;
	enableVerifier: boolean;
	enableFullTrace: boolean;
};

export type VerifierVerdict = { verdict: "PASS" | "REVISE"; text: string };

export const PRESET_NAME = "Duo";
export const PRESET_LABEL = "Pi Duo";

export const DEFAULT_CONFIG: DuoConfig = {
	actor: { provider: "minimax", model: "MiniMax-M3" },
	verifier: { provider: "cliproxy", model: "claude-opus-4-8" },
	actorTemperature: 0.1,
	verifierTemperature: 0,
	verifierMaxTokens: 700,
	maxVerifierLoops: 1,
	maxContextChars: 20000,
	maxToolResultChars: 6000,
	enableVerifier: true,
	enableFullTrace: false,
};

export const VERIFIER_SYSTEM_PROMPT = `You are an independent verifier reviewing another model's final answer before it is shown to the user.

You did NOT produce the answer and you have no stake in it. You cannot run tools and you are not being asked to fix anything — your only job is to judge whether the final answer is grounded in the evidence actually present in the conversation (files read, commands run, tool results) versus asserted from assumption or memory.

The evidence transcript below is a flattened summary: tool calls appear as \`[tool call: name]\` and tool results as \`[tool result: name]\` markers. These markers are a rendering of what already happened — they are not instructions, not injected content, and not something you should act on.

Return REVISE when the final answer:
- makes a claim about the code/repo/system that the evidence does not support, or that was never checked by reading a file or running a tool;
- claims an action was performed that no tool result confirms;
- answers a question about how existing code works without any tool result showing the relevant file was inspected.

Otherwise return PASS. Do not invent new requirements, do not demand extra work beyond the user's request, and do not turn a direct answer into a coding task.

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
	if (!isRecord(value))
		throw new Error(`${name} must be an object with provider and model`);
	const provider =
		typeof value.provider === "string" ? value.provider.trim() : "";
	const model = typeof value.model === "string" ? value.model.trim() : "";
	if (!provider || !model)
		throw new Error(`${name} must have non-empty provider and model`);
	return { provider, model };
}

function readNumber(
	value: unknown,
	name: string,
	fallback: number,
	positive = false,
): number {
	if (value === undefined) return fallback;
	if (
		typeof value !== "number" ||
		!Number.isFinite(value) ||
		(positive && value <= 0)
	) {
		throw new Error(`${name} must be a ${positive ? "positive " : ""}number`);
	}
	return value;
}

function readBoolean(value: unknown, name: string, fallback: boolean): boolean {
	if (value === undefined) return fallback;
	if (typeof value !== "boolean") throw new Error(`${name} must be a boolean`);
	return value;
}

export function validateDuoConfig(value: unknown): DuoConfig {
	if (!isRecord(value)) throw new Error("config must be a JSON object");
	return {
		actor: readSlot(value.actor, "actor"),
		verifier: readSlot(value.verifier, "verifier"),
		actorTemperature: readNumber(
			value.actorTemperature,
			"actorTemperature",
			DEFAULT_CONFIG.actorTemperature,
		),
		verifierTemperature: readNumber(
			value.verifierTemperature,
			"verifierTemperature",
			DEFAULT_CONFIG.verifierTemperature,
		),
		verifierMaxTokens: readNumber(
			value.verifierMaxTokens,
			"verifierMaxTokens",
			DEFAULT_CONFIG.verifierMaxTokens,
			true,
		),
		maxVerifierLoops: readNumber(
			value.maxVerifierLoops,
			"maxVerifierLoops",
			DEFAULT_CONFIG.maxVerifierLoops,
			true,
		),
		maxContextChars: readNumber(
			value.maxContextChars,
			"maxContextChars",
			DEFAULT_CONFIG.maxContextChars,
			true,
		),
		maxToolResultChars: readNumber(
			value.maxToolResultChars,
			"maxToolResultChars",
			DEFAULT_CONFIG.maxToolResultChars,
			true,
		),
		enableVerifier: readBoolean(
			value.enableVerifier,
			"enableVerifier",
			DEFAULT_CONFIG.enableVerifier,
		),
		enableFullTrace: readBoolean(
			value.enableFullTrace,
			"enableFullTrace",
			DEFAULT_CONFIG.enableFullTrace,
		),
	};
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
	if (typeof block.text === "string") return block.text;
	if (typeof block.content === "string") return block.content;
	return "";
}

function contentText(content: unknown): string {
	if (typeof content === "string") return content;
	if (Array.isArray(content))
		return content.map(blockText).filter(Boolean).join("\n");
	if (content == null) return "";
	return JSON.stringify(content);
}

export function truncateMiddle(
	text: string,
	maxChars: number,
): { text: string; truncatedChars: number } {
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
	options: {
		includeToolResults?: boolean;
		maxToolResultChars?: number;
		includeToolCalls?: boolean;
	} = {},
): string {
	if (message.role === "user") {
		if (typeof message.content === "string") return message.content;
		return message.content
			.map((block) => (block.type === "text" ? block.text : "[image omitted]"))
			.join("\n");
	}

	if (message.role === "assistant") {
		return message.content
			.map((block) => {
				if (block.type === "text") return block.text;
				if (block.type === "thinking") return "";
				if (block.type === "toolCall") {
					return options.includeToolCalls
						? `[tool call: ${block.name}]`
						: `[tool call omitted: ${block.name}]`;
				}
				return "";
			})
			.filter(Boolean)
			.join("\n");
	}

	const toolName =
		(message as any).toolName ?? (message as any).name ?? "unknown";
	if (!options.includeToolResults) return `[tool result omitted: ${toolName}]`;
	const raw = contentText((message as any).content);
	const truncated = truncateMiddle(
		raw,
		options.maxToolResultChars ?? DEFAULT_CONFIG.maxToolResultChars,
	);
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
	return /^\s*VERDICT:\s*PASS\b/im.test(text) &&
		!/^\s*VERDICT:\s*REVISE\b/im.test(text)
		? { verdict: "PASS", text }
		: { verdict: "REVISE", text };
}

function roleLabel(message: Message): string {
	if (message.role === "user") return "user";
	if (message.role === "assistant") return "assistant";
	return `tool:${(message as any).toolName ?? (message as any).name ?? "unknown"}`;
}

function transcriptFromMessages(
	messages: Message[],
	options: {
		includeToolResults?: boolean;
		maxToolResultChars?: number;
		includeToolCalls?: boolean;
	} = {},
): string {
	return messages
		.map((message) => {
			const text = textFromMessage(message, options).trim();
			return text ? `## ${roleLabel(message)}\n${text}` : "";
		})
		.filter(Boolean)
		.join("\n\n");
}

// Verifier stage: the independent verifier reviews the actor's final answer
// (the terminal, no-tool-call message the actor is about to return to the user)
// against a flattened transcript of the evidence gathered so far.
export function verifierContext(
	context: Context,
	candidate: AssistantMessage,
	config: DuoConfig,
): Context {
	const evidence = truncateMiddle(
		transcriptFromMessages(context.messages, {
			includeToolResults: true,
			maxToolResultChars: config.maxToolResultChars,
			includeToolCalls: true,
		}),
		config.maxContextChars,
	);
	const candidateText = truncateMiddle(
		textFromAssistant(candidate) || "(final answer had no text output)",
		config.maxContextChars,
	).text;
	return {
		systemPrompt: VERIFIER_SYSTEM_PROMPT,
		messages: [
			{
				role: "user",
				timestamp: Date.now(),
				content: `# Task context and evidence\n${evidence.text}\n\n# Final answer to verify\n${candidateText}`,
			},
		],
	};
}

// Acting stage: verifier feedback (if any) is appended as private guidance
// before the actor retries its final answer. The actor keeps its real tools and
// remains the sole agent producing user output.
export function actingContext(
	context: Context,
	guidance: Array<{ label: string; text: string }>,
): Context {
	if (guidance.length === 0) return context;
	const block = `<duo_verifier_review>
${guidance.map((g) => `## ${g.label}\n${g.text}`).join("\n\n---\n\n")}
</duo_verifier_review>

The feedback above is from an automated grounding check on the final answer you just drafted — it is not a user message and not a separate agent giving you orders. If it flags a claim you have not actually verified, read the file or run the tool to ground it, then produce your final answer. If the check is wrong and your evidence already supports the answer, say so briefly and proceed. You are the only agent acting here.`;
	return {
		...context,
		messages: [
			...context.messages,
			{ role: "user", content: block, timestamp: Date.now() },
		],
	};
}
