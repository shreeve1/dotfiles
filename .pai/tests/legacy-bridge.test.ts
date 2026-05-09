import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { CanonicalMemoryStore } from "../src/memory-store";
import { LegacyMigrationBridge, classifyLegacySurface } from "../src/legacy-bridge";

let runtimeHome: string | undefined;
let legacyHome: string | undefined;

afterEach(() => {
  if (runtimeHome) rmSync(runtimeHome, { recursive: true, force: true });
  if (legacyHome) rmSync(legacyHome, { recursive: true, force: true });
  runtimeHome = undefined;
  legacyHome = undefined;
});

describe("LegacyMigrationBridge", () => {
  test("inventories legacy harness surfaces without modifying them", () => {
    const { bridge, roots, files } = createBridgeFixture();
    const before = files.map((file) => ({ file, mtimeMs: statSync(file).mtimeMs, content: readFileSync(file, "utf8") }));

    const result = bridge.inventoryLegacySurfaces(roots, "2026-05-09T00:00:00.000Z");

    expect(result.records.map((record) => record.harness).sort()).toEqual(["claude", "codex", "opencode", "pi"]);
    expect(result.records.every((record) => record.indexed_at === "2026-05-09T00:00:00.000Z")).toBe(true);
    expect(result.records.every((record) => record.path_hash.length === 64)).toBe(true);
    expect(result.records.every((record) => record.legacy_path.startsWith(legacyHome!))).toBe(true);
    expect(before.map((entry) => ({ content: readFileSync(entry.file, "utf8"), mtimeMs: statSync(entry.file).mtimeMs }))).toEqual(
      before.map((entry) => ({ content: entry.content, mtimeMs: entry.mtimeMs })),
    );
    bridge.close();
  });

  test("excludes denied paths, auth files, private keys, and transcript classes", () => {
    const { bridge, roots } = createBridgeFixture({ includeDenied: true });

    const result = bridge.inventoryLegacySurfaces(roots);
    const inventoryPaths = result.records.map((record) => record.legacy_path);
    const skippedReasons = result.skipped.map((skip) => skip.reason).sort();

    expect(inventoryPaths.some((path) => path.includes(".env"))).toBe(false);
    expect(inventoryPaths.some((path) => path.endsWith("auth.json"))).toBe(false);
    expect(inventoryPaths.some((path) => path.includes("id_ed25519"))).toBe(false);
    expect(inventoryPaths.some((path) => path.includes("sessions"))).toBe(false);
    expect(skippedReasons).toContain("denied_path");
    expect(skippedReasons).toContain("auth_file");
    expect(skippedReasons).toContain("private_key");
    expect(skippedReasons).toContain("out_of_scope_transcript");
    bridge.close();
  });

  test("bridge-read indexes preserve provenance without copying payload content", () => {
    const { bridge, roots, memoryFile } = createBridgeFixture();
    bridge.inventoryLegacySurfaces(roots);
    const inventory = bridge.listInventory().find((record) => record.legacy_path === memoryFile)!;

    const bridgeRead = bridge.createBridgeReadIndex(inventory.inventory_id, "2026-05-09T00:00:00.000Z");
    const persisted = bridge.listBridgeReads()[0];

    expect(bridgeRead.provenance.legacy_path).toBe(memoryFile);
    expect(bridgeRead.content_copied).toBe(false);
    expect(bridgeRead.trust_level).toBe("low");
    expect(JSON.stringify(persisted)).not.toContain("legacy memory payload");
    expect(persisted.provenance.relative_path).toBe("MEMORY/project.md");
    bridge.close();
  });

  test("canonical writes stay under runtime memory and do not promote duplicates", () => {
    const { bridge, roots } = createBridgeFixture();
    const result = bridge.inventoryLegacySurfaces(roots);
    for (const record of result.records) bridge.createBridgeReadIndex(record.inventory_id);

    const canonicalMemory = new CanonicalMemoryStore({ runtimeHome });

    expect(bridge.dbPath.startsWith(join(runtimeHome!, "memory"))).toBe(true);
    expect(existsSync(bridge.dbPath)).toBe(true);
    expect(canonicalMemory.searchMemories()).toEqual([]);
    expect(bridge.listBridgeReads().length).toBe(result.records.length);
    canonicalMemory.close();
    bridge.close();
  });

  test("classifies common legacy surfaces for inventory review", () => {
    expect(classifyLegacySurface("/x/.claude/MEMORY/profile.md")).toBe("memory");
    expect(classifyLegacySurface("/x/.codex/hooks.json")).toBe("policy");
    expect(classifyLegacySurface("/x/events.sqlite")).toBe("event");
    expect(classifyLegacySurface("/x/PAI/USER/notes.md")).toBe("user_context");
  });
});

function createBridgeFixture(options: { includeDenied?: boolean } = {}) {
  runtimeHome = mkdtempSync(join(tmpdir(), "pai-legacy-runtime-"));
  legacyHome = mkdtempSync(join(tmpdir(), "pai-legacy-source-"));

  const claude = join(legacyHome, ".claude");
  const codex = join(legacyHome, ".codex");
  const opencode = join(legacyHome, ".config", "opencode");
  const pi = join(legacyHome, ".pi", "agent");

  const memoryFile = writeFixture(join(claude, "MEMORY", "project.md"), "legacy memory payload should not be copied");
  const codexFile = writeFixture(join(codex, "pai", "hooks", "policy.md"), "codex policy metadata");
  const opencodeFile = writeFixture(join(opencode, "AGENTS.md"), "opencode config metadata");
  const piFile = writeFixture(join(pi, "skills", "note.md"), "pi work artifact metadata");

  if (options.includeDenied) {
    writeFixture(join(claude, ".env"), "SECRET=do-not-index");
    writeFixture(join(codex, "auth.json"), "{\"token\":\"do-not-index\"}");
    writeFixture(join(pi, ".ssh", "id_ed25519"), "not a real key");
    writeFixture(join(claude, "sessions", "session.jsonl"), "transcript payload");
  }

  const bridge = new LegacyMigrationBridge({ runtimeHome });
  return {
    bridge,
    roots: [
      { harness: "claude" as const, rootPath: claude },
      { harness: "codex" as const, rootPath: codex },
      { harness: "opencode" as const, rootPath: opencode },
      { harness: "pi" as const, rootPath: pi },
    ],
    files: [memoryFile, codexFile, opencodeFile, piFile],
    memoryFile,
  };
}

function writeFixture(path: string, content: string) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
  return path;
}
