import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildLegacyImportPreview, applyLegacyImportDecisions } from "../src/legacy-import-approval";
import { CanonicalMemoryStore } from "../src/memory-store";
import type { LegacyInventoryRecord, SkippedLegacyPath } from "../src/legacy-bridge";

describe("legacy import approval", () => {
  test("preview lists source sensitivity provenance confidence and destination", () => {
    const previews = buildLegacyImportPreview([inventoryFixture({ surface_class: "memory" })]);

    expect(previews[0]).toMatchObject({
      import_id: "import:legacy:one",
      inventory_id: "legacy:one",
      source_path: "/legacy/.claude/MEMORY/project.md",
      sensitivity: "medium",
      confidence: 0.7,
      proposed_canonical_destination: { runtime_home: "~/.pai", memory_type: "projects", scope: "legacy:claude" },
      importable: true,
    });
    expect(previews[0].provenance).toMatchObject({ harness: "claude", relative_path: "MEMORY/project.md", surface_class: "memory" });
  });

  test("denied paths auth files private keys and excluded transcripts cannot be imported", () => {
    const skipped: SkippedLegacyPath[] = [
      { harness: "claude", legacy_path: "/legacy/.claude/.env", reason: "denied_path" },
      { harness: "codex", legacy_path: "/legacy/.codex/auth.json", reason: "auth_file" },
      { harness: "pi", legacy_path: "/legacy/.pi/.ssh/id_ed25519", reason: "private_key" },
    ];
    const previews = buildLegacyImportPreview([
      inventoryFixture({ inventory_id: "legacy:env", legacy_path: "/legacy/.claude/.env" }),
      inventoryFixture({ inventory_id: "legacy:auth", harness: "codex", legacy_path: "/legacy/.codex/auth.json" }),
      inventoryFixture({ inventory_id: "legacy:key", harness: "pi", legacy_path: "/legacy/.pi/.ssh/id_ed25519" }),
      inventoryFixture({ inventory_id: "legacy:transcript", surface_class: "transcript", legacy_path: "/legacy/.claude/sessions/a.jsonl" }),
    ], skipped);

    expect(previews.every((preview) => !preview.importable)).toBe(true);
    expect(previews.map((preview) => preview.blocked_reason)).toEqual(["denied_path", "auth_file", "private_key", "excluded_surface_class"]);
  });

  test("approve writes only canonical memory with source provenance", () => {
    const runtimeHome = mkdtempSync(join(tmpdir(), "pai-legacy-import-"));
    const store = new CanonicalMemoryStore({ runtimeHome });
    try {
      const preview = buildLegacyImportPreview([inventoryFixture()]);
      const result = applyLegacyImportDecisions(store, preview, [{ import_id: preview[0].import_id, decision: "approve", content: "Approved legacy project convention." }], "2026-05-09T00:00:00.000Z");

      expect(result[0].memory).toMatchObject({
        memory_id: "legacy-import:legacy:one",
        type: "projects",
        scope: "legacy:claude",
        source_event_ids: ["legacy:one"],
        review_status: "accepted",
        trust_level: "low",
        content: "Approved legacy project convention.",
      });
      expect(result[0].memory?.provenance).toMatchObject({ source: "legacy-import-approval", legacy_path: "/legacy/.claude/MEMORY/project.md" });
      expect(store.searchMemories().map((memory) => memory.memory_id)).toEqual(["legacy-import:legacy:one"]);
      expect(store.dbPath.startsWith(join(runtimeHome, "memory"))).toBe(true);
    } finally {
      store.close();
      rmSync(runtimeHome, { recursive: true, force: true });
    }
  });

  test("rejected and deferred imports do not alter canonical memory", () => {
    const runtimeHome = mkdtempSync(join(tmpdir(), "pai-legacy-import-"));
    const store = new CanonicalMemoryStore({ runtimeHome });
    try {
      const previews = buildLegacyImportPreview([
        inventoryFixture({ inventory_id: "legacy:reject" }),
        inventoryFixture({ inventory_id: "legacy:defer", relative_path: "later.md" }),
      ]);
      const result = applyLegacyImportDecisions(store, previews, [
        { import_id: "import:legacy:reject", decision: "reject" },
        { import_id: "import:legacy:defer", decision: "defer" },
      ]);

      expect(result).toEqual([
        { import_id: "import:legacy:reject", decision: "reject" },
        { import_id: "import:legacy:defer", decision: "defer" },
      ]);
      expect(store.searchMemories()).toEqual([]);
    } finally {
      store.close();
      rmSync(runtimeHome, { recursive: true, force: true });
    }
  });
});

function inventoryFixture(overrides: Partial<LegacyInventoryRecord> = {}): LegacyInventoryRecord {
  return {
    inventory_id: "legacy:one",
    harness: "claude",
    legacy_path: "/legacy/.claude/MEMORY/project.md",
    relative_path: "MEMORY/project.md",
    path_hash: "abc123",
    surface_class: "memory",
    size_bytes: 42,
    modified_at: "2026-05-09T00:00:00.000Z",
    indexed_at: "2026-05-09T00:00:00.000Z",
    ...overrides,
  };
}
