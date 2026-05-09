export const ISA_SECTION_ORDER = [
  "Problem",
  "Vision",
  "Out of Scope",
  "Principles",
  "Constraints",
  "Goal",
  "Criteria",
  "Test Strategy",
  "Features",
  "Decisions",
  "Changelog",
  "Verification",
] as const;

export const ISA_MIGRATION_ORDER = [
  "read support",
  "dual-read",
  "canonical-write",
  "legacy read-only",
  "removal",
] as const;

export type IsaSectionName = (typeof ISA_SECTION_ORDER)[number];
export type IsaMigrationPhase = (typeof ISA_MIGRATION_ORDER)[number];

export type PrdArtifact = {
  title: string;
  status: string;
  progress?: string;
  criteria: string[];
  plan?: string[];
  changelog?: string[];
  verification?: string[];
};

export type IsaArtifact = {
  frontmatter: {
    name: string;
    phase: string;
    progress?: string;
    source: "prd-import" | "isa";
    compatibility_prd_required?: boolean;
  };
  sections: Partial<Record<IsaSectionName, string[]>>;
};

export type LegacyHookRequirement = {
  harness: "claude" | "codex" | "opencode" | "pi";
  hook: string;
  requires_prd: boolean;
  reason: string;
};

export type CompatibilityPrd = PrdArtifact & {
  compatibility_write: true;
  canonical_source: "ISA";
  generated_for: Array<Pick<LegacyHookRequirement, "harness" | "hook" | "reason">>;
};

export function mapPrdToIsa(prd: PrdArtifact): IsaArtifact {
  return {
    frontmatter: {
      name: prd.title,
      phase: prd.status,
      progress: prd.progress,
      source: "prd-import",
      compatibility_prd_required: false,
    },
    sections: {
      Goal: [prd.title],
      Criteria: prd.criteria.map((criterion, index) => `- [ ] ISC-${String(index + 1).padStart(2, "0")}: ${criterion}`),
      Features: prd.plan ?? [],
      Decisions: prd.plan?.map((step) => `Imported PRD plan step: ${step}`) ?? [],
      Changelog: prd.changelog ?? [],
      Verification: [prd.progress ?? prd.status, ...(prd.verification ?? [])],
    },
  };
}

export function normalizeIsaArtifact(artifact: IsaArtifact): IsaArtifact {
  return {
    frontmatter: { ...artifact.frontmatter, source: "isa" },
    sections: Object.fromEntries(
      ISA_SECTION_ORDER
        .filter((section) => artifact.sections[section]?.length)
        .map((section) => [section, artifact.sections[section]]),
    ) as Partial<Record<IsaSectionName, string[]>>,
  };
}

export function renderCanonicalIsa(artifact: IsaArtifact) {
  const frontmatter = [
    "---",
    `name: ${JSON.stringify(artifact.frontmatter.name)}`,
    `phase: ${artifact.frontmatter.phase}`,
    artifact.frontmatter.progress ? `progress: ${artifact.frontmatter.progress}` : undefined,
    `source: ${artifact.frontmatter.source}`,
    artifact.frontmatter.compatibility_prd_required !== undefined
      ? `compatibility_prd_required: ${artifact.frontmatter.compatibility_prd_required}`
      : undefined,
    "---",
  ].filter(Boolean) as string[];

  const sections = ISA_SECTION_ORDER.flatMap((section) => {
    const lines = artifact.sections[section];
    if (!lines?.length) return [];
    return [`## ${section}`, "", ...lines, ""];
  });

  return [...frontmatter, "", ...sections].join("\n").trimEnd() + "\n";
}

export function generateCompatibilityPrd(isa: IsaArtifact, requirements: LegacyHookRequirement[]): CompatibilityPrd | undefined {
  const requiredBy = requirements.filter((requirement) => requirement.requires_prd);
  if (requiredBy.length === 0) return undefined;

  return {
    title: isa.frontmatter.name,
    status: isa.frontmatter.phase,
    progress: isa.frontmatter.progress,
    criteria: (isa.sections.Criteria ?? []).map((criterion) => criterion.replace(/^- \[[ x]\] ISC-\d+(?:\.\d+)?:\s*/, "")),
    plan: isa.sections.Features,
    changelog: isa.sections.Changelog,
    verification: isa.sections.Verification,
    compatibility_write: true,
    canonical_source: "ISA",
    generated_for: requiredBy.map(({ harness, hook, reason }) => ({ harness, hook, reason })),
  };
}

export function validateIsaSectionOrder(markdown: string) {
  const seen = [...markdown.matchAll(/^## (.+)$/gm)].map((match) => match[1]);
  const indexes = seen.map((section) => ISA_SECTION_ORDER.indexOf(section as IsaSectionName));
  const unknown = seen.filter((section, index) => indexes[index] === -1 || section !== ISA_SECTION_ORDER[indexes[index]]);
  const ordered = indexes.every((index, position) => index >= 0 && (position === 0 || index > indexes[position - 1]));
  return { seen, ordered, unknown };
}
