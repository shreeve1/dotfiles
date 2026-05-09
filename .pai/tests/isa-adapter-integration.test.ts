import { describe, expect, test } from "bun:test";
import {
  buildClaudeTracerTemplate,
  mapClaudeHookObservationToEvent,
  resolveClaudePaiSession,
} from "../src/claude-tracer";
import {
  buildCodexTracerTemplate,
  mapCodexHookInputToObservation,
  mapCodexHookObservationToEvent,
  resolveCodexPaiSession,
} from "../src/codex-tracer";
import {
  generateCompatibilityPrd,
  mapPrdToIsa,
  normalizeIsaArtifact,
  renderCanonicalIsa,
  validateIsaSectionOrder,
  type CompatibilityPrd,
  type IsaArtifact,
  type LegacyHookRequirement,
  type PrdArtifact,
} from "../src/isa-compatibility";
import type { EventIngestInput } from "../src/event-store";

describe("ISA adapter integration fixtures", () => {
  test("Claude PRD-style sessions resume sync and finalize through compatibility behavior", () => {
    const prd = prdSessionFixture();
    const isa = mapPrdToIsa(prd);
    const compatibilityPrd = generateCompatibilityPrd(isa, [
      legacyRequirement("claude", "SessionStart", "legacy resume reads PRD state"),
      legacyRequirement("claude", "PostToolUse", "legacy sync reads PRD state"),
      legacyRequirement("claude", "Stop", "legacy finalization gate reads PRD state"),
    ]);
    const resolution = resolveClaudePaiSession({ env: { PAI_SESSION_ID: "pai_isa_claude" } });
    const events = [
      mapClaudeHookObservationToEvent({
        hook_event: "SessionStart",
        pai_session_id: resolution.pai_session_id,
        sequence: 1,
        timestamp: "2026-05-09T01:00:00.000Z",
        payload_summary: `resume:${prd.title}`,
      }),
      mapClaudeHookObservationToEvent({
        hook_event: "PostToolUse",
        matcher: "Edit",
        pai_session_id: resolution.pai_session_id,
        sequence: 2,
        timestamp: "2026-05-09T01:00:01.000Z",
        payload_summary: "sync:canonical ISA verification updated",
      }),
      mapClaudeHookObservationToEvent({
        hook_event: "Stop",
        pai_session_id: resolution.pai_session_id,
        sequence: 3,
        timestamp: "2026-05-09T01:00:02.000Z",
        payload_summary: "finalize:canonical verification complete",
      }),
    ];

    expect(resolution.source).toBe("pai_run");
    expect(events.map((event) => event.event_type)).toEqual(["session.start", "tool.post_use", "session.stop"]);
    expect(events.every((event) => event.harness === "claude")).toBe(true);
    expect(compatibilityPrd).toMatchObject({
      title: "ISA Adapter Compatibility",
      status: "verify",
      canonical_source: "ISA",
      compatibility_write: true,
    });
    expect(compatibilityPrd?.generated_for.map((requirement) => requirement.hook)).toEqual([
      "SessionStart",
      "PostToolUse",
      "Stop",
    ]);
  });

  test("Codex PRD-centered enforcement remains compatible while ISA is canonical", () => {
    const prd = prdSessionFixture();
    const isa = mapPrdToIsa(prd);
    const canonicalMarkdown = renderCanonicalIsa(normalizeIsaArtifact(isa));
    const compatibilityPrd = generateCompatibilityPrd(isa, [
      legacyRequirement("codex", "WorkSync", "PRD-first enforcement during transition"),
    ]);
    const resolution = resolveCodexPaiSession({ codexSessionId: "codex-isa-session" });
    const event = mapCodexHookObservationToEvent(mapCodexHookInputToObservation(
      {
        hook_event_name: "WorkSync",
        session_id: "codex-isa-session",
        tool_name: "Read",
        tool_output: "canonical ISA verification state loaded",
      },
      resolution,
      1,
      "2026-05-09T01:10:00.000Z",
    ));
    const template = buildCodexTracerTemplate();

    expect(validateIsaSectionOrder(canonicalMarkdown).ordered).toBe(true);
    expect(canonicalMarkdown).toContain("source: isa");
    expect(template.prd_compatibility).toEqual({ prd_first_enforcement_preserved: true, isa_migration_complete: false });
    expect(template.bridge_compatibility.canonical_writes_only).toBe(true);
    expect(compatibilityPrd?.generated_for).toEqual([
      { harness: "codex", hook: "WorkSync", reason: "PRD-first enforcement during transition" },
    ]);
    expect(event).toMatchObject({
      harness: "codex",
      event_type: "tool.post_use",
      pai_session_id: resolution.pai_session_id,
    });
  });

  test("ISA-style sessions do not generate compatibility PRDs unless legacy hooks require them", () => {
    const isaStyle = normalizeIsaArtifact(isaSessionFixture());
    const noLegacyPrd = generateCompatibilityPrd(isaStyle, [
      { harness: "opencode", hook: "pai-isa-sync", requires_prd: false, reason: "ISA-native" },
      { harness: "pi", hook: "pai-run", requires_prd: false, reason: "wrapper uses canonical ISA" },
    ]);
    const requiredLegacyPrd = generateCompatibilityPrd(isaStyle, [
      legacyRequirement("claude", "Stop", "legacy finalization gate reads PRD state"),
    ]);

    expect(noLegacyPrd).toBeUndefined();
    expect(renderCanonicalIsa(isaStyle)).toContain("## Verification");
    expect(requiredLegacyPrd).toMatchObject({
      title: "Native ISA Adapter Session",
      canonical_source: "ISA",
      compatibility_write: true,
      generated_for: [{ harness: "claude", hook: "Stop", reason: "legacy finalization gate reads PRD state" }],
    });
  });

  test("finalization gates reference canonical ISA verification state", () => {
    const isa = isaSessionFixture();
    const markdown = renderCanonicalIsa(isa);
    const compatibilityPrd = generateCompatibilityPrd(isa, [
      legacyRequirement("claude", "Stop", "legacy finalization gate reads PRD state"),
      legacyRequirement("codex", "Stop", "PRD-first finalization during transition"),
    ]);

    expect(markdown).toContain("## Verification\n\n- ISC-01: `bun test` passed");
    expect(compatibilityPrd?.verification).toEqual([
      "- ISC-01: `bun test` passed",
      "- ISC-02: `bun run typecheck` passed",
    ]);
    expect(compatibilityPrd?.criteria).toEqual([
      "Claude fixture can finalize from canonical verification",
      "Codex fixture can finalize from canonical verification",
    ]);
  });

  test("diagnostics separate mapping adapter event and legacy compatibility failures", () => {
    const validIsa = isaSessionFixture();
    const validEvent = mapClaudeHookObservationToEvent({
      hook_event: "Stop",
      pai_session_id: "pai_diag",
      sequence: 1,
      timestamp: "2026-05-09T01:20:00.000Z",
      payload_summary: "finalize",
    });
    const validPrd = generateCompatibilityPrd(validIsa, [
      legacyRequirement("claude", "Stop", "legacy finalization gate reads PRD state"),
    ]);

    expect(diagnoseFixture({ event: validEvent, compatibilityPrd: validPrd })).toBe("ok");
    expect(diagnoseFixture({ event: validEvent, compatibilityPrd: validPrd, mappingValid: false })).toBe("mapping");
    expect(diagnoseFixture({ compatibilityPrd: validPrd })).toBe("adapter_event");
    expect(diagnoseFixture({ event: validEvent })).toBe("legacy_compatibility");
  });

  test("integration fixtures do not enable Claude or Codex active shared-memory writers", () => {
    expect(buildClaudeTracerTemplate().install_plan.adapter_enablement).toMatchObject({
      enabled: false,
      explicit_user_approval: false,
    });
    expect(buildCodexTracerTemplate().install_plan.adapter_enablement).toMatchObject({
      enabled: false,
      explicit_user_approval: false,
    });
  });
});

function prdSessionFixture(): PrdArtifact {
  return {
    title: "ISA Adapter Compatibility",
    status: "verify",
    progress: "canonical-verification-ready",
    criteria: [
      "Claude PRD-style session can resume sync and finalize",
      "Codex PRD-centered enforcement reads canonical ISA state",
    ],
    plan: ["Map PRD session", "Emit adapter events", "Finalize from canonical verification"],
    changelog: ["ISA became canonical while PRD stayed compatibility-only"],
    verification: ["- ISC-01: canonical verification present"],
  };
}

function isaSessionFixture(): IsaArtifact {
  return {
    frontmatter: {
      name: "Native ISA Adapter Session",
      phase: "verify",
      progress: "complete",
      source: "isa",
      compatibility_prd_required: false,
    },
    sections: {
      Problem: ["Adapter finalization must not depend on PRD as source of truth."],
      Goal: ["Finalize from canonical ISA verification state."],
      Criteria: [
        "- [x] ISC-01: Claude fixture can finalize from canonical verification",
        "- [x] ISC-02: Codex fixture can finalize from canonical verification",
      ],
      Verification: ["- ISC-01: `bun test` passed", "- ISC-02: `bun run typecheck` passed"],
    },
  };
}

function legacyRequirement(harness: "claude" | "codex", hook: string, reason: string): LegacyHookRequirement {
  return { harness, hook, requires_prd: true, reason };
}

function diagnoseFixture(input: {
  mappingValid?: boolean;
  event?: EventIngestInput;
  compatibilityPrd?: CompatibilityPrd;
}) {
  if (input.mappingValid === false) return "mapping";
  if (!input.event?.event_type || !input.event.policy_decision_id) return "adapter_event";
  if (!input.compatibilityPrd?.compatibility_write || input.compatibilityPrd.canonical_source !== "ISA") {
    return "legacy_compatibility";
  }
  return "ok";
}
