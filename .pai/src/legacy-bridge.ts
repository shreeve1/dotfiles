import { Database } from "bun:sqlite";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { buildRuntimePaths } from "./runtime-paths";

export const LEGACY_HARNESSES = ["claude", "codex", "opencode", "pi"] as const;
export const LEGACY_SURFACE_CLASSES = ["policy", "event", "memory", "work_artifact", "transcript", "user_context", "config"] as const;

export type LegacyHarness = (typeof LEGACY_HARNESSES)[number];
export type LegacySurfaceClass = (typeof LEGACY_SURFACE_CLASSES)[number];

export type LegacySurfaceRoot = {
  harness: LegacyHarness;
  rootPath: string;
  label?: string;
};

export type LegacyInventoryRecord = {
  inventory_id: string;
  harness: LegacyHarness;
  legacy_path: string;
  relative_path: string;
  path_hash: string;
  surface_class: LegacySurfaceClass;
  size_bytes: number;
  modified_at: string;
  indexed_at: string;
};

export type SkippedLegacyPath = {
  harness: LegacyHarness;
  legacy_path: string;
  reason: "denied_path" | "auth_file" | "private_key" | "out_of_scope_transcript";
};

export type LegacyInventoryResult = {
  records: LegacyInventoryRecord[];
  skipped: SkippedLegacyPath[];
};

export type BridgeReadRecord = {
  bridge_id: string;
  inventory_id: string;
  harness: LegacyHarness;
  legacy_path: string;
  path_hash: string;
  surface_class: LegacySurfaceClass;
  provenance: {
    legacy_path: string;
    relative_path: string;
    harness: LegacyHarness;
  };
  trust_level: "low";
  content_copied: false;
  created_at: string;
};

export type LegacyBridgeOptions = {
  runtimeHome?: string;
  dbPath?: string;
};

export const LEGACY_BRIDGE_MIGRATIONS = [
  {
    version: 1,
    statements: [
      `CREATE TABLE IF NOT EXISTS legacy_inventory (
        inventory_id TEXT PRIMARY KEY,
        harness TEXT NOT NULL CHECK (harness IN ('claude', 'codex', 'opencode', 'pi')),
        legacy_path TEXT NOT NULL,
        relative_path TEXT NOT NULL,
        path_hash TEXT NOT NULL UNIQUE,
        surface_class TEXT NOT NULL CHECK (surface_class IN ('policy', 'event', 'memory', 'work_artifact', 'transcript', 'user_context', 'config')),
        size_bytes INTEGER NOT NULL,
        modified_at TEXT NOT NULL,
        indexed_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS legacy_bridge_reads (
        bridge_id TEXT PRIMARY KEY,
        inventory_id TEXT NOT NULL UNIQUE,
        harness TEXT NOT NULL CHECK (harness IN ('claude', 'codex', 'opencode', 'pi')),
        legacy_path TEXT NOT NULL,
        path_hash TEXT NOT NULL,
        surface_class TEXT NOT NULL,
        provenance_json TEXT NOT NULL,
        trust_level TEXT NOT NULL CHECK (trust_level = 'low'),
        content_copied INTEGER NOT NULL CHECK (content_copied = 0),
        created_at TEXT NOT NULL,
        FOREIGN KEY (inventory_id) REFERENCES legacy_inventory(inventory_id)
      )`,
      `CREATE INDEX IF NOT EXISTS legacy_inventory_harness_class_idx ON legacy_inventory(harness, surface_class)`,
    ],
  },
] as const;

export class LegacyMigrationBridge {
  readonly dbPath: string;
  private readonly db: Database;

  constructor(options: LegacyBridgeOptions = {}) {
    const runtimePaths = buildRuntimePaths(options.runtimeHome);
    this.dbPath = options.dbPath ?? join(runtimePaths.memoryDir, "legacy-bridge.sqlite");
    mkdirSync(dirname(this.dbPath), { recursive: true });
    this.db = new Database(this.dbPath, { create: true });
    this.db.run("PRAGMA journal_mode = WAL");
    this.applyMigrations();
  }

  close() {
    this.db.close();
  }

  appliedMigrations() {
    return this.db.query("SELECT version FROM legacy_bridge_migrations ORDER BY version").all() as Array<{ version: number }>;
  }

  inventoryLegacySurfaces(roots: LegacySurfaceRoot[], now = new Date().toISOString()): LegacyInventoryResult {
    const records: LegacyInventoryRecord[] = [];
    const skipped: SkippedLegacyPath[] = [];

    for (const root of roots) {
      if (!existsSync(root.rootPath)) continue;
      for (const legacyPath of walkFiles(root.rootPath)) {
        const denied = denialReason(legacyPath);
        if (denied) {
          skipped.push({ harness: root.harness, legacy_path: legacyPath, reason: denied });
          continue;
        }

        const stat = statSync(legacyPath);
        const relativePath = relative(root.rootPath, legacyPath) || ".";
        const record: LegacyInventoryRecord = {
          inventory_id: `legacy:${hashValue(`${root.harness}:${legacyPath}`).slice(0, 20)}`,
          harness: root.harness,
          legacy_path: legacyPath,
          relative_path: relativePath,
          path_hash: hashValue(legacyPath),
          surface_class: classifyLegacySurface(legacyPath),
          size_bytes: stat.size,
          modified_at: stat.mtime.toISOString(),
          indexed_at: now,
        };

        this.upsertInventory(record);
        records.push(record);
      }
    }

    return { records, skipped };
  }

  createBridgeReadIndex(inventoryId: string, now = new Date().toISOString()): BridgeReadRecord {
    const inventory = this.getInventory(inventoryId);
    if (!inventory) throw new Error(`Unknown legacy inventory record ${inventoryId}`);

    const record: BridgeReadRecord = {
      bridge_id: `bridge:${inventory.path_hash.slice(0, 20)}`,
      inventory_id: inventory.inventory_id,
      harness: inventory.harness,
      legacy_path: inventory.legacy_path,
      path_hash: inventory.path_hash,
      surface_class: inventory.surface_class,
      provenance: {
        legacy_path: inventory.legacy_path,
        relative_path: inventory.relative_path,
        harness: inventory.harness,
      },
      trust_level: "low",
      content_copied: false,
      created_at: now,
    };

    this.db
      .query(
        `INSERT OR REPLACE INTO legacy_bridge_reads (
          bridge_id, inventory_id, harness, legacy_path, path_hash, surface_class,
          provenance_json, trust_level, content_copied, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        record.bridge_id,
        record.inventory_id,
        record.harness,
        record.legacy_path,
        record.path_hash,
        record.surface_class,
        JSON.stringify(record.provenance),
        record.trust_level,
        0,
        record.created_at,
      );

    return record;
  }

  getInventory(inventoryId: string): LegacyInventoryRecord | undefined {
    const row = this.db.query("SELECT * FROM legacy_inventory WHERE inventory_id = ?").get(inventoryId) as LegacyInventoryRow | null;
    return row ? rowToInventory(row) : undefined;
  }

  listInventory(): LegacyInventoryRecord[] {
    return (this.db.query("SELECT * FROM legacy_inventory ORDER BY harness, relative_path").all() as LegacyInventoryRow[]).map(rowToInventory);
  }

  listBridgeReads(): BridgeReadRecord[] {
    return (this.db.query("SELECT * FROM legacy_bridge_reads ORDER BY harness, legacy_path").all() as BridgeReadRow[]).map(rowToBridgeRead);
  }

  private upsertInventory(record: LegacyInventoryRecord) {
    this.db
      .query(
        `INSERT OR REPLACE INTO legacy_inventory (
          inventory_id, harness, legacy_path, relative_path, path_hash, surface_class,
          size_bytes, modified_at, indexed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        record.inventory_id,
        record.harness,
        record.legacy_path,
        record.relative_path,
        record.path_hash,
        record.surface_class,
        record.size_bytes,
        record.modified_at,
        record.indexed_at,
      );
  }

  private applyMigrations() {
    this.db.run("CREATE TABLE IF NOT EXISTS legacy_bridge_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)");
    const applied = new Set(
      (this.db.query("SELECT version FROM legacy_bridge_migrations").all() as Array<{ version: number }>).map((row) => row.version),
    );

    for (const migration of LEGACY_BRIDGE_MIGRATIONS) {
      if (applied.has(migration.version)) continue;
      this.db.transaction(() => {
        for (const statement of migration.statements) this.db.run(statement);
        this.db.query("INSERT INTO legacy_bridge_migrations (version, applied_at) VALUES (?, datetime('now'))").run(migration.version);
      })();
    }
  }
}

export function classifyLegacySurface(legacyPath: string): LegacySurfaceClass {
  const lower = legacyPath.toLowerCase();
  if (lower.includes("memory")) return "memory";
  if (lower.includes("policy") || lower.includes("hook") || lower.endsWith("settings.json") || lower.endsWith("hooks.json")) return "policy";
  if (lower.includes("event") || lower.endsWith(".sqlite") || lower.endsWith(".db")) return "event";
  if (lower.includes("telos") || lower.includes("/user/")) return "user_context";
  if (lower.endsWith(".json") || lower.endsWith(".toml") || lower.endsWith(".yaml") || lower.endsWith(".yml")) return "config";
  return "work_artifact";
}

function walkFiles(rootPath: string): string[] {
  const stat = statSync(rootPath);
  if (stat.isFile()) return [rootPath];

  const files: string[] = [];
  for (const entry of readdirSync(rootPath, { withFileTypes: true })) {
    const child = join(rootPath, entry.name);
    if (entry.isDirectory()) {
      if (denialReason(child) === "out_of_scope_transcript") continue;
      files.push(...walkFiles(child));
    } else if (entry.isFile()) {
      files.push(child);
    }
  }
  return files;
}

function denialReason(legacyPath: string): SkippedLegacyPath["reason"] | undefined {
  const lower = legacyPath.toLowerCase();
  if (/(^|\/)\.env(\.|$)/.test(lower) || lower.includes("/secrets.")) return "denied_path";
  if (/(^|\/)auth\.json$/.test(lower) || lower.includes("/.codex/auth.json") || lower.includes("/.pi/agent/auth.json")) return "auth_file";
  if (/(^|\/)(id_rsa|id_dsa|id_ecdsa|id_ed25519)$/.test(lower) || /\.(pem|key)$/.test(lower) || lower.includes("/.ssh/")) return "private_key";
  if (lower.includes("/sessions/") || lower.includes("/transcripts/") || lower.endsWith("history.jsonl")) return "out_of_scope_transcript";
  return undefined;
}

function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

type LegacyInventoryRow = Omit<LegacyInventoryRecord, "harness" | "surface_class"> & {
  harness: LegacyHarness;
  surface_class: LegacySurfaceClass;
};

type BridgeReadRow = Omit<BridgeReadRecord, "provenance" | "content_copied" | "trust_level" | "harness" | "surface_class"> & {
  provenance_json: string;
  content_copied: number;
  trust_level: "low";
  harness: LegacyHarness;
  surface_class: LegacySurfaceClass;
};

function rowToInventory(row: LegacyInventoryRow): LegacyInventoryRecord {
  return row;
}

function rowToBridgeRead(row: BridgeReadRow): BridgeReadRecord {
  return {
    bridge_id: row.bridge_id,
    inventory_id: row.inventory_id,
    harness: row.harness,
    legacy_path: row.legacy_path,
    path_hash: row.path_hash,
    surface_class: row.surface_class,
    provenance: JSON.parse(row.provenance_json) as BridgeReadRecord["provenance"],
    trust_level: "low",
    content_copied: false,
    created_at: row.created_at,
  };
}
