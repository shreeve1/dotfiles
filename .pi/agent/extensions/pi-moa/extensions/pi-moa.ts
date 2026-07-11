import type { ExtensionAPI, ExtensionCommandContext, ModelRegistry, ProviderConfig } from "@earendil-works/pi-coding-agent";
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
  addUsage,
  advisorCacheKey,
  advisorTurnKey,
  aggregatorContext,
  buildAdvisorContext,
  buildVerifierContext,
  parseVerifierVerdict,
  resolveVerifierSlot,
  textFromAssistant,
  textFromMessage,
  truncateMiddle,
  validateMoaConfig,
  zeroUsage,
  type AdvisorContextBuild,
  type MoaConfig,
  type ModelSlot,
} from "../src/moa-core.ts";

const LOCAL_AUTH_SENTINEL = "local-pi-moa";
const PACKAGE_VERSION = (JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { version: string }).version;
let modelRegistry: ModelRegistry | undefined;

type AdvisorResult = { label: string; text: string; usage: Usage; durationMs: number; status: "ok" | "error" };
type AdvisorTurnState = { runs: number; latestKey: string };
const FAST_PRESET_NAME = "Fusion Fast";
const FAST_PRESET_LABEL = "Pi MoA Fusion Fast";
const FAST_DEFAULT_CONFIG: MoaConfig = {
  ...DEFAULT_CONFIG,
  referenceModels: [{ provider: "opencode-go", model: "deepseek-v4-pro" }],
  verifier: { provider: "opencode-go", model: "deepseek-v4-pro" },
};

// Pi calls streamSimple once per model iteration. Keep only a small process-local
// cache: enough for a tool loop, not a second database.
const advisorCache = new Map<string, AdvisorResult[]>();
const advisorTurnState = new Map<string, AdvisorTurnState>();
const MAX_ADVISOR_CACHE_ENTRIES = 20;

function agentDir(): string {
  return process.env.PI_CODING_AGENT_DIR || join(homedir(), ".pi", "agent");
}

function configPath(configName: string = "moa"): string {
  return join(agentDir(), `${configName}.json`);
}

function loadMoaConfig(configName: string = "moa"): MoaConfig {
  const path = configPath(configName);
  if (!existsSync(path)) return configName === "moa-fast" ? FAST_DEFAULT_CONFIG : DEFAULT_CONFIG;

  try {
    return validateMoaConfig(JSON.parse(readFileSync(path, "utf8")));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid Pi MoA config at ${path}: ${reason}`);
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

  const { apiKey: _apiKey, headers: _headers, env: _env, ...rest } = options ?? {};
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
  throw signal.reason instanceof Error ? signal.reason : new Error("Request aborted");
}

function trimMap<K, V>(map: Map<K, V>, maxEntries: number) {
  while (map.size > maxEntries) {
    const first = map.keys().next().value;
    if (first === undefined) break;
    map.delete(first);
  }
}

async function cacheAdvisorRun(key: string, run: () => Promise<AdvisorResult[]>): Promise<AdvisorResult[]> {
  const cached = advisorCache.get(key);
  if (cached) return cached;

  const results = await run();
  if (results.every((result) => result.status === "ok")) {
    advisorCache.set(key, results);
    trimMap(advisorCache, MAX_ADVISOR_CACHE_ENTRIES);
  }
  return results;
}

function selectAdvisorCacheKey(
  config: MoaConfig,
  context: Context,
  advisorContext: AdvisorContextBuild,
  options?: SimpleStreamOptions,
): { key: string; requestedKey: string; status: "hit" | "miss" | "refresh-limit" } {
  const requestedKey = advisorCacheKey(config, advisorContext, options);
  const turnKey = advisorTurnKey(config, context, options);
  const maxRuns = Math.max(1, config.maxAdvisorRefreshesPerTurn);
  let state = advisorTurnState.get(turnKey);
  if (!state) {
    state = { runs: 0, latestKey: requestedKey };
    advisorTurnState.set(turnKey, state);
    trimMap(advisorTurnState, MAX_ADVISOR_CACHE_ENTRIES);
    return { key: requestedKey, requestedKey, status: advisorCache.has(requestedKey) ? "hit" : "miss" };
  }

  if (advisorCache.has(requestedKey)) {
    state.latestKey = requestedKey;
    return { key: requestedKey, requestedKey, status: "hit" };
  }

  if (state.runs < maxRuns || !advisorCache.has(state.latestKey)) {
    if (advisorCache.has(state.latestKey)) state.runs += 1;
    state.latestKey = requestedKey;
    return { key: requestedKey, requestedKey, status: "miss" };
  }

  return { key: state.latestKey, requestedKey, status: "refresh-limit" };
}

function lookupModel(slot: ModelSlot): Model<Api> {
  const model = modelRegistry?.find(slot.provider, slot.model);
  if (!model) throw new Error(`Model not found in Pi registry: ${slot.provider}:${slot.model}`);
  return model;
}

async function runAdvisor(
  slot: ModelSlot,
  context: Context,
  config: MoaConfig,
  options?: SimpleStreamOptions,
): Promise<AdvisorResult> {
  const label = `${slot.provider}:${slot.model}`;
  const startedAt = Date.now();
  try {
    const model = lookupModel(slot);
    const message = await completeSimple(
      model,
      context,
      await targetOptions(model, options, {
        temperature: config.referenceTemperature,
        maxTokens: config.referenceMaxTokens,
        reasoning: options?.reasoning ?? "high",
      }),
    );
    const status = message.stopReason === "error" || message.stopReason === "aborted" ? "error" : "ok";
    return {
      label,
      text: textFromAssistant(message) || (status === "error" ? `Advisor failed: ${message.errorMessage ?? message.stopReason}` : ""),
      usage: message.usage ?? zeroUsage(),
      durationMs: Date.now() - startedAt,
      status,
    };
  } catch (error) {
    return {
      label,
      text: `Advisor failed: ${error instanceof Error ? error.message : String(error)}`,
      usage: zeroUsage(),
      durationMs: Date.now() - startedAt,
      status: "error",
    };
  }
}

async function runVerifier(
  verifierSlot: ModelSlot,
  context: Context,
  config: MoaConfig,
  options?: SimpleStreamOptions,
): Promise<AssistantMessage> {
  const model = lookupModel(verifierSlot);
  return completeSimple(
    model,
    context,
    await targetOptions(model, options, {
      temperature: config.verifierTemperature,
      maxTokens: config.verifierMaxTokens,
      reasoning: options?.reasoning ?? "high",
    }),
  );
}

function privateOutput(message: AssistantMessage, config: MoaConfig): string {
  return truncateMiddle(
    textFromMessage(message, { includeToolCalls: true }).trim() || "(no output returned)",
    config.maxAdvisorContextChars,
  ).text;
}

function asMoaMessage(
  message: AssistantMessage,
  model: Model<Api>,
  aggregator: ModelSlot,
  privateUsage: Usage,
): AssistantMessage {
  return {
    ...message,
    api: model.api,
    provider: model.provider,
    model: model.id,
    responseModel: `${aggregator.provider}:${aggregator.model}`,
    usage: addUsage(privateUsage, message.usage),
  };
}

function moaDiagnostics(
  message: AssistantMessage,
  summary: string,
  fullTrace?: Record<string, unknown>,
): AssistantMessage["diagnostics"] {
  return [
    ...(message.diagnostics ?? []),
    { severity: "info", message: summary } as any,
    ...(fullTrace ? [{ type: "pi-moa.full-trace", timestamp: Date.now(), details: fullTrace }] : []),
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

export function streamPiMoaFusion(
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
      const configName = model.id === FAST_PRESET_NAME ? "moa-fast" : "moa";
      const presetLabel = model.id === FAST_PRESET_NAME ? FAST_PRESET_LABEL : PRESET_LABEL;
      const config = loadMoaConfig(configName);
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

      const advisorContext = buildAdvisorContext(context, config);
      const cacheSelection = selectAdvisorCacheKey(config, context, advisorContext, options);
      const advisors = await cacheAdvisorRun(cacheSelection.key, () =>
        Promise.all(config.referenceModels.map((slot) => runAdvisor(slot, advisorContext.context, config, options))),
      );
      throwIfAborted(options?.signal);

      let privateUsage = zeroUsage();
      for (const advisor of advisors) {
        privateUsage = addUsage(privateUsage, advisor.usage);
        if (config.enableFullTrace) {
          trace.push({
            stage: "advisor",
            model: advisor.label,
            status: advisor.status,
            durationMs: advisor.durationMs,
            cache: cacheSelection.status,
            usage: advisor.usage,
            output: truncateMiddle(advisor.text, config.maxAdvisorContextChars).text,
          });
        }
      }
      failureUsage = privateUsage;

      const aggModel = lookupModel(config.aggregator);
      const aggOptions = await targetOptions(aggModel, options, {
        temperature: config.aggregatorTemperature,
        reasoning: options?.reasoning ?? "high",
      });

      let actingReferences: Array<{ label: string; text: string }> = [...advisors];
      const verifierDiagnostics: string[] = [];
      const verifierGuidance: Array<{ label: string; text: string }> = [];
      let verifierSlot: ModelSlot | undefined;

      if (config.enableVerifier) {
        verifierSlot = resolveVerifierSlot(config);
        let draftStartedAt = Date.now();
        let draftMessage = await completeSimple(
          aggModel,
          aggregatorContext(context, advisors, "draft"),
          aggOptions,
        );
        throwIfAborted(options?.signal);
        privateUsage = addUsage(privateUsage, draftMessage.usage);
        failureUsage = privateUsage;
        if (config.enableFullTrace) {
          trace.push({
            stage: "draft",
            attempt: 0,
            model: `${config.aggregator.provider}:${config.aggregator.model}`,
            status: draftMessage.stopReason,
            durationMs: Date.now() - draftStartedAt,
            usage: draftMessage.usage,
            output: privateOutput(draftMessage, config),
          });
        }

        for (let loop = 0; loop < config.maxVerifierLoops; loop++) {
          const verifierStartedAt = Date.now();
          try {
            const verifierMessage = await runVerifier(
              verifierSlot,
              buildVerifierContext(context, advisors, draftMessage, config),
              config,
              options,
            );
            throwIfAborted(options?.signal);
            privateUsage = addUsage(privateUsage, verifierMessage.usage);
            failureUsage = privateUsage;
            const verifierText = textFromAssistant(verifierMessage);
            const verdict = parseVerifierVerdict(verifierText);
            const verifierLabel = `${verifierSlot.provider}:${verifierSlot.model}`;
            verifierDiagnostics.push(`${verifierLabel} ${verdict.verdict}`);
            verifierGuidance.push({ label: `verifier review ${loop + 1}`, text: verdict.text });
            if (config.enableFullTrace) {
              trace.push({
                stage: "verifier",
                attempt: loop + 1,
                model: verifierLabel,
                status: verifierMessage.stopReason,
                durationMs: Date.now() - verifierStartedAt,
                usage: verifierMessage.usage,
                verdict: verdict.verdict,
                output: truncateMiddle(verdict.text, config.maxAdvisorContextChars).text,
              });
            }
            if (verdict.verdict === "PASS") break;

            const previousDraft = privateOutput(draftMessage, config);
            draftStartedAt = Date.now();
            draftMessage = await completeSimple(
              aggModel,
              aggregatorContext(
                context,
                [
                  ...advisors,
                  { label: "previous private draft", text: previousDraft },
                  { label: `verifier review ${loop + 1}`, text: verdict.text },
                ],
                "draft",
              ),
              aggOptions,
            );
            throwIfAborted(options?.signal);
            privateUsage = addUsage(privateUsage, draftMessage.usage);
            failureUsage = privateUsage;
            if (config.enableFullTrace) {
              trace.push({
                stage: "draft",
                attempt: loop + 1,
                model: `${config.aggregator.provider}:${config.aggregator.model}`,
                status: draftMessage.stopReason,
                durationMs: Date.now() - draftStartedAt,
                usage: draftMessage.usage,
                output: privateOutput(draftMessage, config),
              });
            }
          } catch (error) {
            if (options?.signal?.aborted) throw error;
            const reason = error instanceof Error ? error.message : String(error);
            verifierDiagnostics.push(`failed: ${reason}`);
            verifierGuidance.push({ label: "verifier failure", text: reason });
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
            break;
          }
        }

        actingReferences = [
          ...advisors,
          { label: "latest private draft", text: privateOutput(draftMessage, config) },
          ...verifierGuidance,
        ];
      }

      const truncationText = advisorContext.truncatedChars ? `; advisor context truncated ${advisorContext.truncatedChars} chars` : "";
      const refreshText = cacheSelection.status === "refresh-limit" ? "; advisor refresh limit reached, reused latest advice" : "";
      const verifierText = verifierDiagnostics.length ? `; verifier: ${verifierDiagnostics.join(", ")}` : "";
      const summary = `${presetLabel} advisors: ${advisors.map((advisor) => advisor.label).join(", ")}; aggregator: ${config.aggregator.provider}:${config.aggregator.model}; reasoning=${options?.reasoning ?? "high"}; advisorContextMode=${config.advisorContextMode}; advisorCache=${cacheSelection.status}; advisorDigest=${advisorContext.digest.slice(0, 12)}${truncationText}${refreshText}${verifierText}`;
      const fullTrace = () =>
        config.enableFullTrace
          ? {
              preset: presetLabel,
              advisorCache: cacheSelection.status,
              advisorDigest: advisorContext.digest,
              verifier: verifierSlot ? `${verifierSlot.provider}:${verifierSlot.model}` : "disabled",
              verifierIndependent:
                !verifierSlot ||
                verifierSlot.provider !== config.aggregator.provider ||
                verifierSlot.model !== config.aggregator.model,
              stages: trace,
            }
          : undefined;

      const actingStartedAt = Date.now();
      const actingStream = streamSimple(
        aggModel,
        aggregatorContext(context, actingReferences, "acting"),
        aggOptions,
      );
      let actingMessage: AssistantMessage | undefined;

      for await (const event of actingStream) {
        if (event.type === "start") continue;
        if (event.type === "done") {
          actingMessage = event.message;
          continue;
        }
        if (event.type === "error") {
          const failedMessage = asMoaMessage(event.error, model, config.aggregator, privateUsage);
          failureUsage = failedMessage.usage;
          if (config.enableFullTrace) {
            trace.push({
              stage: "acting",
              model: `${config.aggregator.provider}:${config.aggregator.model}`,
              status: event.reason,
              durationMs: Date.now() - actingStartedAt,
              usage: event.error.usage,
              totalUsage: failedMessage.usage,
              error: event.error.errorMessage,
            });
          }
          failedMessage.diagnostics = moaDiagnostics(failedMessage, summary, fullTrace());
          stream.push({ type: "error", reason: event.reason, error: failedMessage });
          stream.end(failedMessage);
          return;
        }

        const mappedPartial = asMoaMessage(event.partial, model, config.aggregator, privateUsage);
        failureUsage = mappedPartial.usage;
        stream.push({ ...event, partial: mappedPartial } as any);
      }

      if (!actingMessage) throw new Error("Acting aggregator stream ended without a terminal message");

      const finalMessage = asMoaMessage(actingMessage, model, config.aggregator, privateUsage);
      failureUsage = finalMessage.usage;
      if (config.enableFullTrace) {
        trace.push({
          stage: "acting",
          model: `${config.aggregator.provider}:${config.aggregator.model}`,
          status: finalMessage.stopReason,
          durationMs: Date.now() - actingStartedAt,
          usage: actingMessage.usage,
          totalUsage: finalMessage.usage,
        });
      }
      finalMessage.diagnostics = moaDiagnostics(finalMessage, summary, fullTrace());

      stream.push({ type: "done", reason: finalMessage.stopReason as any, message: finalMessage });
      stream.end(finalMessage);
    } catch (error) {
      const diagnostics = traceEnabled
        ? ([{ type: "pi-moa.full-trace", timestamp: Date.now(), details: { stages: trace } }] as any)
        : undefined;
      pushError(stream, model, error, options?.signal, failureUsage, diagnostics);
    }
  })();

  return stream;
}

function providerConfig(registry?: ModelRegistry): ProviderConfig {
  const virtualModel = (id: string, name: string, configName: string) => {
    let aggregator: Model<Api> | undefined;
    if (registry) {
      try {
        const slot = loadMoaConfig(configName).aggregator;
        aggregator = registry.find(slot.provider, slot.model);
      } catch {
        // Picker metadata is best-effort; request-time config loading remains fail-loud.
      }
    }

    const thinkingLevelMap = aggregator?.thinkingLevelMap ?? (aggregator ? undefined : { max: "max" });
    return {
      id,
      name,
      reasoning: aggregator?.reasoning ?? true,
      ...(thinkingLevelMap ? { thinkingLevelMap: { ...thinkingLevelMap } } : {}),
      input: [...(aggregator?.input ?? ["text" as const])],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: aggregator?.contextWindow ?? 1000000,
      maxTokens: aggregator?.maxTokens ?? 131072,
    };
  };

  return {
    name: "Pi MoA",
    // Required by Pi's provider validator; the custom streamSimple below does not call it directly.
    baseUrl: "https://local.invalid/pi-moa",
    // This provider is local; target-provider auth is resolved inside streamSimple.
    apiKey: LOCAL_AUTH_SENTINEL,
    api: "pi-moa",
    models: [
      virtualModel(PRESET_NAME, PRESET_LABEL, "moa"),
      virtualModel(FAST_PRESET_NAME, FAST_PRESET_LABEL, "moa-fast"),
    ],
    streamSimple: streamPiMoaFusion,
  };
}

export default function (pi: ExtensionAPI) {
  pi.on("session_start", (_event, ctx) => {
    modelRegistry = ctx.modelRegistry;
    pi.registerProvider("pi-moa", providerConfig(modelRegistry));
  });

  const showStatus = async (_args: string, ctx: ExtensionCommandContext) => {
    const state = ctx.model?.provider === "pi-moa" ? `active (${ctx.model.id})` : "available";
    const fusionPath = configPath();
    const fastPath = configPath("moa-fast");
    ctx.ui.notify(
      [
        `pi-moa v${PACKAGE_VERSION} • ${state}`,
        `Fusion • ${fusionPath}${existsSync(fusionPath) ? "" : " (built-in defaults)"}\n${JSON.stringify(loadMoaConfig(), null, 2)}`,
        `Fusion Fast • ${fastPath}${existsSync(fastPath) ? "" : " (built-in defaults)"}\n${JSON.stringify(loadMoaConfig("moa-fast"), null, 2)}`,
      ].join("\n\n"),
      "info",
    );
  };
  const commandDescription = "Show the pi-moa version, active state, and current Fusion configs";
  pi.registerCommand("pi-moa", { description: commandDescription, handler: showStatus });
  pi.registerCommand("pi-moa:status", { description: commandDescription, handler: showStatus });
  pi.registerProvider("pi-moa", providerConfig());
}
