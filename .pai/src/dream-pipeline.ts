import type { CanonicalEventEnvelope } from "./event-store";
import type { CanonicalMemoryStore, MemoryRecord, MemoryType, ProposedMemoryInput, ReviewQueueItem } from "./memory-store";

export const DREAM_PIPELINE_VERSION = "pai-dream.v1";

export const DREAM_FUTURE_PROVIDER_OPTIONS = [
  {
    provider: "claude-inference",
    status: "future-option",
    enabled_by_default: false,
    enablement_issue: "#019",
  },
] as const;

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
  mode: "deterministic-test-double" | "local-offline-rules";
  distill(events: CanonicalEventEnvelope[], context: DreamProviderContext): DreamMemoryCandidate[];
};

export type DreamProviderContext = {
  projectId?: string;
  now: string;
};

export type DreamPipelineOptions = {
  provider?: DreamProvider;
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
