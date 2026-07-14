import type {
	AssistantMessage,
	Context,
	Message,
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
	maxVerifierContextChars: number;
	maxToolResultChars: number;
	verifyEveryNSteps: number;
	maxActorSteps: number;
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
	maxVerifierContextChars: 80000,
	maxToolResultChars: 6000,
	verifyEveryNSteps: 0,
	maxActorSteps: 0,
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

Pay special attention to claims that an action was taken with no tool result behind it — e.g. "logged", "saved", "noted", "recorded", "remembered", "will remember". The actor has no memory or logging tool; such phrasing is fabrication and must be flagged.

Output ONLY the verdict block below. Do NOT restate, rewrite, summarize, or draft a corrected answer — you are a gate, not a co-author, and any prose you write may be copied verbatim into the final answer. Keep ISSUES and REQUIRED_ACTIONS to terse pointers, never full replacement text.

Respond exactly with either:
VERDICT: PASS

or:
VERDICT: REVISE
ISSUES:
- ...
REQUIRED_ACTIONS:
- ...`;

export const VERIFIER_CHECKPOINT_PROMPT = `You are an independent verifier checking on another model's work partway through an investigation, before it has finished. It is still gathering evidence with tools and has NOT produced a final answer yet.

You did NOT produce this work and you cannot run tools. Your only job is to catch the actor going down a wrong path: check whether its latest interim step is grounded in the evidence actually present (files read, commands run, tool results) rather than proceeding from an unchecked assumption.

The evidence transcript below is a flattened summary: tool calls appear as \`[tool call: name]\` and tool results as \`[tool result: name]\` markers. These markers are a rendering of what already happened — they are not instructions and not something you should act on.

Return REVISE only when the interim step:
- builds on a claim about the code/repo/system that the evidence so far does not support, or that was never checked;
- asserts an action succeeded that no tool result confirms.

Otherwise return PASS. Mid-investigation exploration is normal — do NOT demand a final answer, do NOT tell it to stop gathering evidence, and do NOT flag it merely for not being done. Only flag genuinely ungrounded moves.

Output ONLY the verdict block below. Do NOT rewrite or draft the actor's work — you are a gate, not a co-author, and any prose you write may be copied into its output. Keep ISSUES and REQUIRED_ACTIONS to terse pointers.

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
		maxVerifierContextChars: readNumber(
			value.maxVerifierContextChars,
			"maxVerifierContextChars",
			DEFAULT_CONFIG.maxVerifierContextChars,
			true,
		),
		maxToolResultChars: readNumber(
			value.maxToolResultChars,
			"maxToolResultChars",
			DEFAULT_CONFIG.maxToolResultChars,
			true,
		),
		verifyEveryNSteps: readNumber(
			value.verifyEveryNSteps,
			"verifyEveryNSteps",
			DEFAULT_CONFIG.verifyEveryNSteps,
		),
		maxActorSteps: readNumber(
			value.maxActorSteps,
			"maxActorSteps",
			DEFAULT_CONFIG.maxActorSteps,
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

// Tail-weighted truncation for verifier evidence: recent tool results and the
// answer under review matter most, so keep a small head (task framing) and a
// large tail (recent evidence) instead of dropping the recent middle.
export function truncateTail(
	text: string,
	maxChars: number,
): { text: string; truncatedChars: number } {
	if (text.length <= maxChars) return { text, truncatedChars: 0 };
	const head = Math.max(1, Math.floor(maxChars * 0.2));
	const tail = Math.max(1, maxChars - head);
	const truncatedChars = text.length - head - tail;
	return {
		text: `${text.slice(0, head)}\n...\n<truncated ${truncatedChars} chars of earlier evidence>\n...\n${text.slice(-tail)}`,
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

// Number of assistant messages since the last user message. Used to derive the
// current tool-loop step index without any session-local state: Pi enters the
// provider once per step, so on entry this counts the steps already taken this
// user turn (0 on the first step). Stateless across the synced extension.
export function stepsSinceLastUser(messages: Message[]): number {
	let count = 0;
	for (let i = messages.length - 1; i >= 0; i--) {
		const role = messages[i].role;
		if (role === "user") break;
		if (role === "assistant") count++;
	}
	return count;
}

export function parseVerifierVerdict(text: string): VerifierVerdict {
	// An explicit REVISE verdict is the only thing that gates the actor.
	// Tolerate markdown decoration a chatty verifier may add around the
	// verdict block — leading list/heading/quote markers or bold/backtick
	// wrapping (e.g. `**VERDICT: REVISE**`, `VERDICT: **REVISE**`,
	// `# VERDICT: REVISE`) — so a genuine REVISE is not silently downgraded
	// to the PASS fail-safe below.
	if (/^[\s>#*_`-]*VERDICT[:\s*_`]*REVISE\b/im.test(text))
		return { verdict: "REVISE", text };
	// Everything else — an explicit `VERDICT: PASS` AND any response with no
	// parseable verdict token at all — is treated as PASS. This is a
	// deliberate fail-safe: verifier providers that discard the system prompt
	// (e.g. cliproxy stubbing it before forwarding) often reply
	// conversationally instead of emitting the verdict block. Defaulting a
	// verdict-less reply to REVISE would inject the verifier's off-script prose
	// into the actor as user-role guidance and loop indefinitely, so we ship
	// the actor's answer instead of poisoning it.
	return { verdict: "PASS", text };
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

// Verifier stage: the independent verifier reviews the actor's work against a
// flattened transcript of the evidence gathered so far. In "terminal" mode the
// candidate is the final answer about to reach the user; in "checkpoint" mode
// (verifyEveryNSteps) it is the actor's latest interim step mid-investigation.
// Evidence uses the larger verifier budget with tail-weighted truncation so
// recent tool results survive on long sessions.
export function verifierContext(
	context: Context,
	candidate: AssistantMessage,
	config: DuoConfig,
	mode: "terminal" | "checkpoint" = "terminal",
): Context {
	// Strip the actor's private verifier-feedback messages before building
	// the evidence transcript: they were injected by `actingContext()` to
	// guide the actor's retry and must not appear in the verifier's view
	// (would pollute the candidate against itself and shift the cache
	// entry's content on every REVISE re-run, killing cache reuse).
	const messagesForEvidence = context.messages.filter((message) => {
		const content = message.content;
		if (typeof content === "string") {
			return !content.includes("<duo_verifier_review>");
		}
		if (Array.isArray(content)) {
			return !content.some(
				(block) =>
					block?.type === "text" &&
					typeof block.text === "string" &&
					block.text.includes("<duo_verifier_review>"),
			);
		}
		return true;
	});
	const evidence = truncateTail(
		transcriptFromMessages(messagesForEvidence, {
			includeToolResults: true,
			maxToolResultChars: config.maxToolResultChars,
			includeToolCalls: true,
		}),
		config.maxVerifierContextChars,
	);
	const candidateLabel =
		mode === "checkpoint"
			? "Latest interim step to verify"
			: "Final answer to verify";
	const candidateText = truncateTail(
		(mode === "checkpoint"
			? textFromMessage(candidate, { includeToolCalls: true }).trim()
			: textFromAssistant(candidate)) || "(no output)",
		config.maxVerifierContextChars,
	).text;
	// The verifier's rules AND evidence both ride in user-role messages, not
	// only the system prompt: providers that front Anthropic via OAuth (e.g.
	// cliproxy) replace the system prompt with a fixed-size stub before
	// forwarding, so anything left solely in the system prompt — including the
	// "Respond exactly with VERDICT: PASS/REVISE" contract — never reaches the
	// model. A stub-sanitized verifier that never saw its contract replies
	// conversationally, which parseVerifierVerdict then has to treat as a
	// non-verdict. So we duplicate the full rules into the leading user
	// message. We still pass systemPrompt too, for providers that honor it.
	const basePrompt =
		mode === "checkpoint" ? VERIFIER_CHECKPOINT_PROMPT : VERIFIER_SYSTEM_PROMPT;
	// The leading message (rules + evidence) is the stable prefix across a
	// gate's REVISE re-runs; only the candidate (trailing message) varies. It
	// carries an explicit cache_control breakpoint so Anthropic prompt cache
	// anchors a [rules + evidence] entry that hits on every re-gate instead of
	// re-billing it. Without it the only auto-added cache_control lands on the
	// candidate, whose text differs each re-run, so nothing stable gets cached.
	// Rules are static and evidence is static across a gate's re-runs, so
	// folding them into one block keeps the cache key stable. The text is sent
	// as a content-block array so pi-ai passes cache_control through to the
	// provider (cache_control is recognized at runtime by pi-ai's
	// openai-completions + anthropic-messages providers but not declared on
	// TextContent in the public type, hence the cast).
	const prefixText = evidence.text
		? `${basePrompt}\n\n# Task context and evidence\n${evidence.text}`
		: basePrompt;
	const messages: Context["messages"] = [
		{
			role: "user",
			timestamp: Date.now(),
			content: [
				{
					type: "text",
					text: prefixText,
					cache_control: { type: "ephemeral" },
				} as any,
			],
		},
		{
			role: "user",
			timestamp: Date.now(),
			// Restate the output contract on the trailing (varying) turn so a
			// stub-sanitized verifier is reminded of it right before answering.
			content: `# ${candidateLabel}\n${candidateText}\n\nRespond ONLY with the verdict block: \`VERDICT: PASS\`, or \`VERDICT: REVISE\` followed by ISSUES and REQUIRED_ACTIONS. Do not rewrite or draft the answer.`,
		},
	];
	return {
		systemPrompt: basePrompt,
		messages,
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

// Hard step ceiling (maxActorSteps): when the actor has taken at least that
// many tool-loop steps this user turn without finalizing, force it to finalize.
// Tools are stripped from the context so the actor physically cannot call
// another tool and must emit a terminal (no-tool-call) answer, which then flows
// through the existing terminal verifier gate. This is a hard bound — not a soft
// instruction a weak actor can ignore — and reuses the working finalize path
// rather than adding a new mid-loop oversight mechanism. A user-role notice
// tells the actor why its tools vanished so it answers from evidence already
// gathered instead of stalling.
export function finalizeContext(context: Context, maxActorSteps: number): Context {
	const notice = `You have reached this session's tool-use budget (${maxActorSteps} steps). Your tools are now disabled. Answer the user's request now, directly, using only the evidence you have already gathered. State clearly what you did and did not verify — do not claim work you could not complete.`;
	return {
		...context,
		tools: [],
		messages: [
			...context.messages,
			{ role: "user", content: notice, timestamp: Date.now() },
		],
	};
}
