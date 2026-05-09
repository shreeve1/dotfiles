import { describe, expect, test } from "bun:test";
import {
  ISA_MIGRATION_ORDER,
  ISA_SECTION_ORDER,
  generateCompatibilityPrd,
  mapPrdToIsa,
  normalizeIsaArtifact,
  renderCanonicalIsa,
  validateIsaSectionOrder,
  type IsaArtifact,
  type LegacyHookRequirement,
  type PrdArtifact,
} from "../src/isa-compatibility";

describe("ISA compatibility mapping", () => {
  test("maps PRD title status progress criteria plan changelog and verification into ISA", () => {
    const isa = mapPrdToIsa(prdFixture());

    expect(isa.frontmatter).toMatchObject({
      name: "Memory Review UX",
      phase: "execute",
      progress: "70%",
      source: "prd-import",
    });
    expect(isa.sections.Goal).toEqual(["Memory Review UX"]);
    expect(isa.sections.Criteria).toEqual([
      "- [ ] ISC-01: Search finds proposed memories",
      "- [ ] ISC-02: Review can accept or reject",
    ]);
    expect(isa.sections.Features).toEqual(["Build search", "Build review actions"]);
    expect(isa.sections.Changelog).toEqual(["Added review queue"]);
    expect(isa.sections.Verification).toEqual(["70%", "Search fixture passes"]);
  });

  test("renders canonical ISA sections in fixed Algorithm order", () => {
    const markdown = renderCanonicalIsa({
      frontmatter: { name: "Ordered ISA", phase: "plan", source: "isa" },
      sections: {
        Verification: ["Evidence later"],
        Goal: ["Keep section order canonical"],
        Criteria: ["- [ ] ISC-01: Order is fixed"],
        Problem: ["Section drift breaks compatibility"],
      },
    });
    const order = validateIsaSectionOrder(markdown);

    expect(order).toEqual({
      seen: ["Problem", "Goal", "Criteria", "Verification"],
      ordered: true,
      unknown: [],
    });
    expect(ISA_SECTION_ORDER[0]).toBe("Problem");
    expect(ISA_SECTION_ORDER.at(-1)).toBe("Verification");
  });

  test("generates compatibility PRDs only when legacy hooks require them", () => {
    const isa = mapPrdToIsa(prdFixture());
    const noLegacy = generateCompatibilityPrd(isa, [{ harness: "opencode", hook: "pai-isa-sync", requires_prd: false, reason: "ISA-native" }]);
    const legacy = generateCompatibilityPrd(isa, [
      { harness: "claude", hook: "Stop", requires_prd: true, reason: "legacy finalization gate reads PRD state" },
      { harness: "codex", hook: "WorkSync", requires_prd: true, reason: "PRD-first enforcement during transition" },
    ]);

    expect(noLegacy).toBeUndefined();
    expect(legacy).toMatchObject({
      title: "Memory Review UX",
      status: "execute",
      compatibility_write: true,
      canonical_source: "ISA",
      generated_for: [
        { harness: "claude", hook: "Stop", reason: "legacy finalization gate reads PRD state" },
        { harness: "codex", hook: "WorkSync", reason: "PRD-first enforcement during transition" },
      ],
    });
  });

  test("covers ISA-style artifacts without requiring live Claude or Codex hooks", () => {
    const isaStyle: IsaArtifact = {
      frontmatter: { name: "Native ISA", phase: "verify", progress: "complete", source: "isa" },
      sections: {
        Problem: ["PRD compatibility is transitional"],
        Goal: ["Keep ISA canonical"],
        Criteria: ["- [x] ISC-01: ISA can render"],
        Verification: ["Read fixture"],
      },
    };
    const requirements: LegacyHookRequirement[] = [
      { harness: "claude", hook: "fixture-only", requires_prd: false, reason: "No live hook invoked" },
      { harness: "codex", hook: "fixture-only", requires_prd: false, reason: "No live hook invoked" },
    ];

    const normalized = normalizeIsaArtifact(isaStyle);
    expect(renderCanonicalIsa(normalized)).toContain("## Verification");
    expect(generateCompatibilityPrd(normalized, requirements)).toBeUndefined();
  });

  test("documents migration order from read support through removal", () => {
    expect(ISA_MIGRATION_ORDER).toEqual([
      "read support",
      "dual-read",
      "canonical-write",
      "legacy read-only",
      "removal",
    ]);
  });
});

function prdFixture(): PrdArtifact {
  return {
    title: "Memory Review UX",
    status: "execute",
    progress: "70%",
    criteria: ["Search finds proposed memories", "Review can accept or reject"],
    plan: ["Build search", "Build review actions"],
    changelog: ["Added review queue"],
    verification: ["Search fixture passes"],
  };
}
