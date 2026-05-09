import type { LegacyInventoryRecord, SkippedLegacyPath } from "./legacy-bridge";
import type { CanonicalMemoryStore, MemoryRecord, MemoryType, ProposedMemoryInput, ReviewStatus } from "./memory-store";

export const LEGACY_IMPORT_DECISIONS = ["approve", "reject", "defer"] as const;
export type LegacyImportDecision = (typeof LEGACY_IMPORT_DECISIONS)[number];

export type LegacyImportPreview = {
  import_id: string;
  inventory_id: string;
  source_path: string;
  sensitivity: "low" | "medium" | "blocked";
  provenance: {
    harness: LegacyInventoryRecord["harness"];
    legacy_path: string;
    relative_path: string;
    surface_class: LegacyInventoryRecord["surface_class"];
    path_hash: string;
  };
  confidence: number;
  proposed_canonical_destination: {
    runtime_home: "~/.pai";
    memory_type: MemoryType;
    scope: string;
  };
  importable: boolean;
  blocked_reason?: SkippedLegacyPath["reason"] | "excluded_surface_class";
};

export type LegacyImportDecisionInput = {
  import_id: string;
  decision: LegacyImportDecision;
  content?: string;
};

export type LegacyImportDecisionResult = {
  import_id: string;
  decision: LegacyImportDecision;
  memory?: MemoryRecord;
};

export function buildLegacyImportPreview(
  records: LegacyInventoryRecord[],
  skipped: SkippedLegacyPath[] = [],
): LegacyImportPreview[] {
  const skippedByPath = new Map(skipped.map((item) => [item.legacy_path, item.reason]));
  return records.map((record) => previewFromRecord(record, skippedByPath.get(record.legacy_path)));
}

export function applyLegacyImportDecisions(
  store: Pick<CanonicalMemoryStore, "addMemory">,
  previews: LegacyImportPreview[],
  decisions: LegacyImportDecisionInput[],
  now = new Date().toISOString(),
): LegacyImportDecisionResult[] {
  const previewsById = new Map(previews.map((preview) => [preview.import_id, preview]));
  return decisions.map((decision) => {
    const preview = previewsById.get(decision.import_id);
    if (!preview) throw new Error(`Unknown legacy import preview ${decision.import_id}`);
    if (decision.decision !== "approve") return { import_id: decision.import_id, decision: decision.decision };
    if (!preview.importable) throw new Error(`Legacy import ${decision.import_id} is blocked: ${preview.blocked_reason}`);
    const memory = store.addMemory(toMemoryInput(preview, decision.content), now);
    return { import_id: decision.import_id, decision: decision.decision, memory };
  });
}

function previewFromRecord(record: LegacyInventoryRecord, skippedReason?: SkippedLegacyPath["reason"]): LegacyImportPreview {
  const blockedReason = skippedReason ?? blockedSurfaceReason(record);
  const memoryType = memoryTypeForSurface(record.surface_class);
  return {
    import_id: `import:${record.inventory_id}`,
    inventory_id: record.inventory_id,
    source_path: record.legacy_path,
    sensitivity: blockedReason ? "blocked" : sensitivityForSurface(record.surface_class),
    provenance: {
      harness: record.harness,
      legacy_path: record.legacy_path,
      relative_path: record.relative_path,
      surface_class: record.surface_class,
      path_hash: record.path_hash,
    },
    confidence: confidenceForSurface(record.surface_class),
    proposed_canonical_destination: {
      runtime_home: "~/.pai",
      memory_type: memoryType,
      scope: `legacy:${record.harness}`,
    },
    importable: !blockedReason,
    blocked_reason: blockedReason,
  };
}

function toMemoryInput(preview: LegacyImportPreview, content?: string): ProposedMemoryInput {
  return {
    memory_id: `legacy-import:${preview.inventory_id}`,
    type: preview.proposed_canonical_destination.memory_type,
    scope: preview.proposed_canonical_destination.scope,
    source_event_ids: [preview.inventory_id],
    provenance: {
      source: "legacy-import-approval",
      ...preview.provenance,
    },
    confidence: preview.confidence,
    assertion_type: "observed",
    trust_level: "low",
    review_status: "accepted" satisfies ReviewStatus,
    content: content ?? `Approved legacy import from ${preview.provenance.harness}:${preview.provenance.relative_path}`,
    revalidation_rule: "legacy import provenance must remain reviewable",
  };
}

function blockedSurfaceReason(record: LegacyInventoryRecord): LegacyImportPreview["blocked_reason"] | undefined {
  return record.surface_class === "transcript" ? "excluded_surface_class" : undefined;
}

function memoryTypeForSurface(surfaceClass: LegacyInventoryRecord["surface_class"]): MemoryType {
  if (surfaceClass === "user_context") return "profile";
  if (surfaceClass === "policy" || surfaceClass === "config") return "tools";
  if (surfaceClass === "memory") return "projects";
  return "work";
}

function sensitivityForSurface(surfaceClass: LegacyInventoryRecord["surface_class"]): LegacyImportPreview["sensitivity"] {
  return surfaceClass === "user_context" || surfaceClass === "memory" ? "medium" : "low";
}

function confidenceForSurface(surfaceClass: LegacyInventoryRecord["surface_class"]) {
  return surfaceClass === "memory" || surfaceClass === "user_context" ? 0.7 : 0.55;
}
