import type {
	ExtensionAPI,
	ExtensionCommandContext,
	ModelRegistry,
	ProviderConfig,
} from "@earendil-works/pi-coding-agent";
import {
	completeSimple,
	createAssistantMessageEventStream,
	streamSimple,
	type Api,
	type AssistantMessage,
	type AssistantMessageEventStream,
	type Context,
	type Model,
	type SimpleStreamOptions,
	type Usage,
} from "@earendil-works/pi-ai/compat";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import {
	DEFAULT_CONFIG,
	PRESET_LABEL,
	PRESET_NAME,
	actingContext,
	addUsage,
	hasToolCalls,
	parseVerifierVerdict,
	textFromAssistant,
	truncateMiddle,
	validateDuoConfig,
	verifierContext,
	zeroUsage,
	type DuoConfig,
	type ModelSlot,
} from "../src/duo-core.ts";

const LOCAL_AUTH_SENTINEL = "local-pi-duo";
const PACKAGE_VERSION = (
	JSON.parse(
		readFileSync(new URL("../package.json", import.meta.url), "utf8"),
	) as { version: string }
).version;
let modelRegistry: ModelRegistry | undefined;

function agentDir(): string {
	return process.env.PI_CODING_AGENT_DIR || join(homedir(), ".pi", "agent");
}

function configPath(): string {
	return join(agentDir(), "duo.json");
}

function loadDuoConfig(): DuoConfig {
	const path = configPath();
	if (!existsSync(path)) return DEFAULT_CONFIG;
	try {
		return validateDuoConfig(JSON.parse(readFileSync(path, "utf8")));
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error);
		throw new Error(`Invalid Pi Duo config at ${path}: ${reason}`);
	}
}

async function targetOptions(
	model: Model<Api>,
	options: SimpleStreamOptions | undefined,
	overrides: Partial<SimpleStreamOptions>,
): Promise<SimpleStreamOptions> {
	const registry = modelRegistry;
	if (!registry) throw new Error("Pi model registry is not initialized");
	const auth = await registry.getApiKeyAndHeaders(model);
	if (!auth.ok) throw new Error(auth.error);

	const {
		apiKey: _apiKey,
		headers: _headers,
		env: _env,
		...rest
	} = options ?? {};
	return {
		...rest,
		...overrides,
		apiKey: auth.apiKey,
		headers: auth.headers,
		env: auth.env,
	};
}

function throwIfAborted(signal?: AbortSignal) {
	if (!signal?.aborted) return;
	throw signal.reason instanceof Error
		? signal.reason
		: new Error("Request aborted");
}

function lookupModel(slot: ModelSlot): Model<Api> {
	const model = modelRegistry?.find(slot.provider, slot.model);
	if (!model)
		throw new Error(
			`Model not found in Pi registry: ${slot.provider}:${slot.model}`,
		);
	return model;
}

function asDuoMessage(
	message: AssistantMessage,
	model: Model<Api>,
	actor: ModelSlot,
	privateUsage: Usage,
): AssistantMessage {
	return {
		...message,
		api: model.api,
		provider: model.provider,
		model: model.id,
		responseModel: `${actor.provider}:${actor.model}`,
		usage: addUsage(privateUsage, message.usage),
	};
}

function duoDiagnostics(
	message: AssistantMessage,
	summary: string,
	fullTrace?: Record<string, unknown>,
): AssistantMessage["diagnostics"] {
	return [
		...(message.diagnostics ?? []),
		{ severity: "info", message: summary } as any,
		...(fullTrace
			? [
					{
						type: "pi-duo.full-trace",
						timestamp: Date.now(),
						details: fullTrace,
					},
				]
			: []),
	];
}

function pushError(
	stream: AssistantMessageEventStream,
	model: Model<Api>,
	error: unknown,
	signal?: AbortSignal,
	usage: Usage = zeroUsage(),
	diagnostics?: AssistantMessage["diagnostics"],
) {
	const reason = signal?.aborted ? "aborted" : "error";
	const message: AssistantMessage = {
		role: "assistant",
		content: [],
		api: model.api,
		provider: model.provider,
		model: model.id,
		usage,
		stopReason: reason,
		errorMessage: error instanceof Error ? error.message : String(error),
		timestamp: Date.now(),
		...(diagnostics ? { diagnostics } : {}),
	};
	stream.push({ type: "error", reason, error: message });
	stream.end(message);
}

export function streamPiDuo(
	model: Model<Api>,
	context: Context,
	options?: SimpleStreamOptions,
): AssistantMessageEventStream {
	const stream = createAssistantMessageEventStream();

	(async () => {
		let failureUsage = zeroUsage();
		let traceEnabled = false;
		const trace: Array<Record<string, unknown>> = [];

		try {
			const config = loadDuoConfig();
			traceEnabled = config.enableFullTrace;

			const partial: AssistantMessage = {
				role: "assistant",
				content: [],
				api: model.api,
				provider: model.provider,
				model: model.id,
				usage: zeroUsage(),
				stopReason: "stop",
				timestamp: Date.now(),
			};
			stream.push({ type: "start", partial });
			throwIfAborted(options?.signal);

			const actorModel = lookupModel(config.actor);
			const actorOptions = await targetOptions(actorModel, options, {
				temperature: config.actorTemperature,
				reasoning: options?.reasoning ?? "high",
			});

			let privateUsage = zeroUsage();
			const verifierDiagnostics: string[] = [];
			const verifierSlot: ModelSlot | undefined = config.enableVerifier
				? config.verifier
				: undefined;
			const verifierModel = verifierSlot
				? lookupModel(verifierSlot)
				: undefined;

			const summary = () =>
				`${PRESET_LABEL} actor: ${config.actor.provider}:${config.actor.model}; verifier: ${verifierSlot ? `${verifierSlot.provider}:${verifierSlot.model}` : "disabled"}; reasoning=${options?.reasoning ?? "high"}${verifierDiagnostics.length ? `; verifier: ${verifierDiagnostics.join(", ")}` : ""}`;
			const fullTrace = () =>
				config.enableFullTrace
					? {
							preset: PRESET_LABEL,
							actor: `${config.actor.provider}:${config.actor.model}`,
							verifier: verifierSlot
								? `${verifierSlot.provider}:${verifierSlot.model}`
								: "disabled",
							stages: trace,
						}
					: undefined;

			// The actor drives with real tools. Pi enters this provider once per
			// tool-loop step, so we only run the verifier when the actor produces a
			// terminal (no-tool-call) message it wants to return to the user. Each
			// terminal answer is gated independently: if a REVISE re-run needs tools,
			// its tool-call message is returned and Pi's next terminal answer is
			// re-gated on the next provider entry. Verifier feedback therefore does
			// not need to survive the outer loop.
			let actingContextForRun = context;
			let finalMessage: AssistantMessage | undefined;

			for (let loop = 0; ; loop++) {
				const actingStartedAt = Date.now();
				const actingStream = streamSimple(
					actorModel,
					actingContextForRun,
					actorOptions,
				);
				let actingMessage: AssistantMessage | undefined;
				const pendingPartials: Array<Record<string, unknown>> = [];

				for await (const event of actingStream) {
					if (event.type === "start") continue;
					if (event.type === "done") {
						actingMessage = event.message;
						continue;
					}
					if (event.type === "error") {
						const failedMessage = asDuoMessage(
							event.error,
							model,
							config.actor,
							privateUsage,
						);
						failureUsage = failedMessage.usage;
						if (config.enableFullTrace) {
							trace.push({
								stage: "acting",
								attempt: loop + 1,
								model: `${config.actor.provider}:${config.actor.model}`,
								status: event.reason,
								durationMs: Date.now() - actingStartedAt,
								usage: event.error.usage,
								totalUsage: failedMessage.usage,
								error: event.error.errorMessage,
							});
						}
						failedMessage.diagnostics = duoDiagnostics(
							failedMessage,
							summary(),
							fullTrace(),
						);
						stream.push({
							type: "error",
							reason: event.reason,
							error: failedMessage,
						});
						stream.end(failedMessage);
						return;
					}

					// With a verifier we cannot know whether this message is terminal
					// (and thus subject to the gate) until the done event, so we buffer
					// deltas until the gate clears. With no verifier there is no gate:
					// relay live so the default daily-driver path keeps token streaming.
					const mappedPartial = asDuoMessage(
						event.partial,
						model,
						config.actor,
						privateUsage,
					);
					failureUsage = mappedPartial.usage;
					const mapped = { ...event, partial: mappedPartial };
					if (verifierModel) pendingPartials.push(mapped);
					else stream.push(mapped as any);
				}

				if (!actingMessage)
					throw new Error("Acting stream ended without a terminal message");

				if (config.enableFullTrace) {
					trace.push({
						stage: "acting",
						attempt: loop + 1,
						model: `${config.actor.provider}:${config.actor.model}`,
						status: actingMessage.stopReason,
						durationMs: Date.now() - actingStartedAt,
						usage: actingMessage.usage,
						hasToolCalls: hasToolCalls(actingMessage),
					});
				}

				// Gate only terminal (no-tool-call) answers, and only if we still have
				// verifier-loop budget left. Anything with tool calls is a mid-loop
				// step Pi will act on and re-enter us for; relay it untouched.
				const gate =
					verifierModel &&
					verifierSlot &&
					!hasToolCalls(actingMessage) &&
					loop < config.maxVerifierLoops;
				if (gate) {
					const verifierStartedAt = Date.now();
					try {
						const verifierMessage = await completeSimple(
							verifierModel,
							verifierContext(actingContextForRun, actingMessage, config),
							await targetOptions(verifierModel, options, {
								temperature: config.verifierTemperature,
								maxTokens: config.verifierMaxTokens,
								reasoning: options?.reasoning ?? "high",
							}),
						);
						throwIfAborted(options?.signal);
						privateUsage = addUsage(privateUsage, verifierMessage.usage);
						failureUsage = privateUsage;
						const verdict = parseVerifierVerdict(
							textFromAssistant(verifierMessage),
						);
						const verifierLabel = `${verifierSlot.provider}:${verifierSlot.model}`;
						verifierDiagnostics.push(`${verifierLabel} ${verdict.verdict}`);
						if (config.enableFullTrace) {
							trace.push({
								stage: "verifier",
								attempt: loop + 1,
								model: verifierLabel,
								status: verifierMessage.stopReason,
								durationMs: Date.now() - verifierStartedAt,
								usage: verifierMessage.usage,
								verdict: verdict.verdict,
								output: truncateMiddle(verdict.text, config.maxContextChars)
									.text,
							});
						}
						if (verdict.verdict === "REVISE") {
							// Re-run the acting pass with the verifier feedback appended.
							// Discard the buffered partials for this rejected answer.
							actingContextForRun = actingContext(actingContextForRun, [
								{ label: `verifier review ${loop + 1}`, text: verdict.text },
							]);
							continue;
						}
					} catch (error) {
						if (options?.signal?.aborted) throw error;
						const reason =
							error instanceof Error ? error.message : String(error);
						verifierDiagnostics.push(`failed: ${reason}`);
						if (config.enableFullTrace) {
							trace.push({
								stage: "verifier",
								attempt: loop + 1,
								model: `${verifierSlot.provider}:${verifierSlot.model}`,
								status: "error",
								durationMs: Date.now() - verifierStartedAt,
								error: reason,
							});
						}
						// Verifier failure is non-fatal: ship the actor's answer as-is.
					}
				}

				// Accepted (PASS, no gate, or budget exhausted): flush buffered
				// partials, then finalize this message.
				for (const partial of pendingPartials) {
					stream.push(partial as any);
				}
				finalMessage = asDuoMessage(
					actingMessage,
					model,
					config.actor,
					privateUsage,
				);
				break;
			}

			if (!finalMessage)
				throw new Error("Duo loop ended without a final message");
			failureUsage = finalMessage.usage;
			finalMessage.diagnostics = duoDiagnostics(
				finalMessage,
				summary(),
				fullTrace(),
			);

			stream.push({
				type: "done",
				reason: finalMessage.stopReason as any,
				message: finalMessage,
			});
			stream.end(finalMessage);
		} catch (error) {
			const diagnostics = traceEnabled
				? ([
						{
							type: "pi-duo.full-trace",
							timestamp: Date.now(),
							details: { stages: trace },
						},
					] as any)
				: undefined;
			pushError(
				stream,
				model,
				error,
				options?.signal,
				failureUsage,
				diagnostics,
			);
		}
	})();

	return stream;
}

function providerConfig(registry?: ModelRegistry): ProviderConfig {
	let actor: Model<Api> | undefined;
	if (registry) {
		try {
			const slot = loadDuoConfig().actor;
			actor = registry.find(slot.provider, slot.model);
		} catch {
			// Picker metadata is best-effort; request-time config loading remains fail-loud.
		}
	}

	const thinkingLevelMap =
		actor?.thinkingLevelMap ?? (actor ? undefined : { max: "max" });
	const virtualModel = {
		id: PRESET_NAME,
		name: PRESET_LABEL,
		reasoning: actor?.reasoning ?? true,
		...(thinkingLevelMap ? { thinkingLevelMap: { ...thinkingLevelMap } } : {}),
		input: [...(actor?.input ?? ["text" as const])],
		cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
		contextWindow: actor?.contextWindow ?? 1000000,
		maxTokens: actor?.maxTokens ?? 131072,
	};

	return {
		name: "Pi Duo",
		baseUrl: "https://local.invalid/pi-duo",
		apiKey: LOCAL_AUTH_SENTINEL,
		api: "pi-duo",
		models: [virtualModel],
		streamSimple: streamPiDuo,
	};
}

export default function (pi: ExtensionAPI) {
	pi.on("session_start", (_event, ctx) => {
		modelRegistry = ctx.modelRegistry;
		pi.registerProvider("pi-duo", providerConfig(modelRegistry));
	});

	const showStatus = async (_args: string, ctx: ExtensionCommandContext) => {
		const state =
			ctx.model?.provider === "pi-duo"
				? `active (${ctx.model.id})`
				: "available";
		const path = configPath();
		ctx.ui.notify(
			[
				`pi-duo v${PACKAGE_VERSION} • ${state}`,
				`Duo • ${path}${existsSync(path) ? "" : " (built-in defaults)"}\n${JSON.stringify(loadDuoConfig(), null, 2)}`,
			].join("\n\n"),
			"info",
		);
	};
	const commandDescription =
		"Show the pi-duo version, active state, and current Duo config";
	pi.registerCommand("pi-duo", {
		description: commandDescription,
		handler: showStatus,
	});
	pi.registerCommand("pi-duo:status", {
		description: commandDescription,
		handler: showStatus,
	});
	pi.registerProvider("pi-duo", providerConfig());
}
