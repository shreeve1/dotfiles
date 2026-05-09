import type { CanonicalEventEnvelope } from "./event-store";
import type { CanonicalMemoryStore, MemoryRecord, MemoryType, ProposedMemoryInput, ReviewQueueItem } from "./memory-store";

export const DREAM_PIPELINE_VERSION = "pai-dream.v1";

export const DREAM_FUTURE_PROVIDER_OPTIONS = [
  {
    provider: "claude-inference",
    status: "opt-in-real-provider",
    enabled_by_default: false,
    enablement_issue: "#019",
    privacy_labels: ["redacted-local-context", "external-provider", "review-gated-output"],
    redaction_required_before_enablement: true,
  },
] as const;

export type DreamProviderName = "local" | "deterministic" | "claude-inference";

export type DreamProviderEnablement = {
  provider: "claude-inference";
  enabled: boolean;
  explicit_user_approval: boolean;
  privacy_labels: readonly string[];
  redaction_required_before_enablement: true;
};

export type DreamMemoryCandidate = {
  memory_id: string;
  type: MemoryType;
  scope: string;
  source_event_ids: string[];
  provenance: Record<string, unknown>;
  confidence: number;
  assertion_type: "observed" | "verified";
  trust_level: "low" | "medium";
  content: string;
  proposed_diff?: string;
  expires_at?: string;
  revalidation_rule?: string;
};

export type DreamProvider = {
  name: string;
  mode: "deterministic-test-double" | "local-offline-rules" | "external-inference";
  distill(events: CanonicalEventEnvelope[], context: DreamProviderContext): DreamMemoryCandidate[];
};

export type DreamProviderContext = {
  projectId?: string;
  now: string;
};

export type DreamPipelineOptions = {
  provider?: DreamProvider;
  providerEnablement?: DreamProviderEnablement;
  projectId?: string;
  now?: string;
};

export type DreamPipelineResult = {
  provider: string;
  mode: DreamProvider["mode"];
  proposed: Array<{ memory: MemoryRecord; review: ReviewQueueItem }>;
  skipped_events: Array<{ event_id: string; reason: string }>;
};

export class DeterministicDreamProvider implements DreamProvider {
  readonly name = "deterministic-test-double";
  readonly mode = "deterministic-test-double" as const;

  distill(events: CanonicalEventEnvelope[], context: DreamProviderContext): DreamMemoryCandidate[] {
    return events.map((event, index) => buildCandidate(event, context, index, this.name, event.payload_summary || event.event_type));
  }
}

export class LocalRulesDreamProvider implements DreamProvider {
  readonly name = "local-offline-rules";
  readonly mode = "local-offline-rules" as const;

  distill(events: CanonicalEventEnvelope[], context: DreamProviderContext): DreamMemoryCandidate[] {
    return events
      .filter((event) => event.payload_summary.trim().length > 0)
      .map((event, index) => buildCandidate(event, context, index, this.name, summarizePayload(event.payload_summary)));
  }
}

export class ClaudeInferenceDreamProvider implements DreamProvider {
  readonly name = "claude-inference";
  readonly mode = "external-inference" as const;

  constructor(readonly enablement: DreamProviderEnablement) {}

  distill(): DreamMemoryCandidate[] {
    throw new Error("claude-inference provider transport is not configured in this dry-run-safe enablement slice");
  }
}

export function defaultDreamProviderEnablement(provider: "claude-inference" = "claude-inference"): DreamProviderEnablement {
  const option = DREAM_FUTURE_PROVIDER_OPTIONS.find((entry) => entry.provider === provider);
  if (!option) throw new Error(`Unknown real dream provider ${provider}`);
  return {
    provider,
    enabled: option.enabled_by_default,
    explicit_user_approval: false,
    privacy_labels: option.privacy_labels,
    redaction_required_before_enablement: option.redaction_required_before_enablement,
  };
}

export function resolveDreamProvider(
  providerName: DreamProviderName,
  enablement: DreamProviderEnablement = defaultDreamProviderEnablement(),
): DreamProvider {
  if (providerName === "deterministic") return new DeterministicDreamProvider();
  if (providerName === "local") return new LocalRulesDreamProvider();

  if (!enablement.enabled || !enablement.explicit_user_approval) {
    throw new Error("claude-inference provider is disabled by default and requires explicit user approval");
  }
  return new ClaudeInferenceDreamProvider(enablement);
}

export function assertDreamEventIsRedacted(event: CanonicalEventEnvelope) {
  const raw = event as CanonicalEventEnvelope & { payload?: unknown; payloads?: unknown };
  if (raw.payload !== undefined || raw.payloads !== undefined) {
    throw new Error(`Dream event ${event.event_id} contains raw payload fields`);
  }
  if (event.schema_version !== "pai.event.v1") {
    throw new Error(`Dream event ${event.event_id} has unsupported schema ${event.schema_version}`);
  }
  if (event.redaction_status !== "clean" && event.redaction_status !== "redacted") {
    throw new Error(`Dream event ${event.event_id} is not redaction-safe`);
  }
}

export function runDreamPipeline(
  store: Pick<CanonicalMemoryStore, "proposeMemoryWithReview">,
  events: CanonicalEventEnvelope[],
  options: DreamPipelineOptions = {},
): DreamPipelineResult {
  const provider = options.provider ?? new LocalRulesDreamProvider();
  if (provider.mode === "external-inference") {
    const enablement = options.providerEnablement ?? defaultDreamProviderEnablement("claude-inference");
    if (!enablement.enabled || !enablement.explicit_user_approval) {
      throw new Error(`${provider.name} provider requires explicit user approval before use`);
    }
  }
  const now = options.now ?? new Date().toISOString();
  const skipped_events: DreamPipelineResult["skipped_events"] = [];
  const safeEvents: CanonicalEventEnvelope[] = [];

  for (const event of events) {
    try {
      assertDreamEventIsRedacted(event);
      safeEvents.push(event);
    } catch (error) {
      skipped_events.push({ event_id: event.event_id, reason: error instanceof Error ? error.message : String(error) });
    }
  }

  if (safeEvents.length === 0) return { provider: provider.name, mode: provider.mode, proposed: [], skipped_events };

  const candidates = provider.distill(safeEvents, { projectId: options.projectId, now });
  const proposed = candidates.map((candidate) => {
    const memory: ProposedMemoryInput = {
      memory_id: candidate.memory_id,
      type: candidate.type,
      scope: candidate.scope,
      source_event_ids: candidate.source_event_ids,
      provenance: {
        ...candidate.provenance,
        dream_provider: provider.name,
        dream_mode: provider.mode,
        dream_pipeline_version: DREAM_PIPELINE_VERSION,
      },
      confidence: candidate.confidence,
      assertion_type: candidate.assertion_type,
      trust_level: candidate.trust_level,
      review_status: "proposed",
      content: candidate.content,
      expires_at: candidate.expires_at,
      revalidation_rule: candidate.revalidation_rule,
    };

    return store.proposeMemoryWithReview(memory, {
      review_id: `review:${candidate.memory_id}`,
      proposed_diff: candidate.proposed_diff ?? `+ ${candidate.content}`,
    }, now);
  });

  return { provider: provider.name, mode: provider.mode, proposed, skipped_events };
}

function buildCandidate(
  event: CanonicalEventEnvelope,
  context: DreamProviderContext,
  index: number,
  provider: string,
  content: string,
): DreamMemoryCandidate {
  const scope = context.projectId ?? event.project_id ?? "global";
  return {
    memory_id: `dream:${provider}:${event.event_id}:${index}`,
    type: "work",
    scope,
    source_event_ids: [event.event_id],
    provenance: {
      harness: event.harness,
      project_id: event.project_id,
      event_type: event.event_type,
      source: "pai-dream",
    },
    confidence: 0.62,
    assertion_type: "observed",
    trust_level: "low",
    content,
    proposed_diff: `+ ${content}`,
    revalidation_rule: "review before instruction eligibility",
  };
}

function summarizePayload(payloadSummary: string) {
  return payloadSummary.split("\n").filter(Boolean).join("; ");
}
