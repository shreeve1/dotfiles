import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { buildRuntimePaths } from "./runtime-paths";

export const MEMORY_TYPES = ["profile", "projects", "tools", "learning", "work", "procedures"] as const;
export const ASSERTION_TYPES = ["user-stated", "observed", "inferred", "verified"] as const;
export const TRUST_LEVELS = ["low", "medium", "high"] as const;
export const REVIEW_STATUSES = ["proposed", "accepted", "rejected", "deferred"] as const;

export type MemoryType = (typeof MEMORY_TYPES)[number];
export type AssertionType = (typeof ASSERTION_TYPES)[number];
export type TrustLevel = (typeof TRUST_LEVELS)[number];
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export type MemoryRecord = {
  memory_id: string;
  type: MemoryType;
  scope: string;
  source_event_ids: string[];
  provenance: Record<string, unknown>;
  confidence: number;
  assertion_type: AssertionType;
  trust_level: TrustLevel;
  review_status: ReviewStatus;
  content: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  revalidation_rule?: string;
};

export type ProposedMemoryInput = Omit<MemoryRecord, "created_at" | "updated_at" | "review_status"> & {
  review_status?: ReviewStatus;
};

export type ReviewQueueItem = {
  review_id: string;
  memory_id: string;
  proposed_diff: string;
  source_event_ids: string[];
  state: ReviewStatus;
  created_at: string;
  decided_at?: string;
};

export type MemoryStoreOptions = {
  runtimeHome?: string;
  dbPath?: string;
};

export type MemorySearchFilters = {
  query?: string;
  projectId?: string;
  type?: MemoryType;
  minConfidence?: number;
  trustLevel?: TrustLevel;
  updatedAfter?: string;
  harness?: string;
  limit?: number;
};

export type MemoryContextOptions = {
  projectId?: string;
  type?: MemoryType;
  limit?: number;
};

export type MemoryContextEntry = Pick<MemoryRecord, "memory_id" | "type" | "scope" | "content" | "source_event_ids" | "provenance" | "confidence" | "trust_level" | "assertion_type">;

export type MemoryContextBlock = {
  memories: MemoryContextEntry[];
  content: string;
};

export const MEMORY_STORE_MIGRATIONS = [
  {
    version: 1,
    statements: [
      `CREATE TABLE IF NOT EXISTS memories (
        memory_id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK (type IN ('profile', 'projects', 'tools', 'learning', 'work', 'procedures')),
        scope TEXT NOT NULL,
        source_event_ids TEXT NOT NULL,
        provenance_json TEXT NOT NULL,
        confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
        assertion_type TEXT NOT NULL CHECK (assertion_type IN ('user-stated', 'observed', 'inferred', 'verified')),
        trust_level TEXT NOT NULL CHECK (trust_level IN ('low', 'medium', 'high')),
        review_status TEXT NOT NULL CHECK (review_status IN ('proposed', 'accepted', 'rejected', 'deferred')),
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        expires_at TEXT,
        revalidation_rule TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS review_queue (
        review_id TEXT PRIMARY KEY,
        memory_id TEXT NOT NULL,
        proposed_diff TEXT NOT NULL,
        source_event_ids TEXT NOT NULL,
        state TEXT NOT NULL CHECK (state IN ('proposed', 'accepted', 'rejected', 'deferred')),
        created_at TEXT NOT NULL,
        decided_at TEXT,
        FOREIGN KEY (memory_id) REFERENCES memories(memory_id)
      )`,
      `CREATE INDEX IF NOT EXISTS memories_type_scope_idx ON memories(type, scope)`,
      `CREATE INDEX IF NOT EXISTS memories_review_trust_idx ON memories(review_status, trust_level, assertion_type)`,
    ],
  },
  {
    version: 2,
    statements: [
      `CREATE VIRTUAL TABLE IF NOT EXISTS memory_fts USING fts5(memory_id UNINDEXED, content, provenance_json)`,
      `INSERT INTO memory_fts(rowid, memory_id, content, provenance_json)
       SELECT rowid, memory_id, content, provenance_json FROM memories
       WHERE rowid NOT IN (SELECT rowid FROM memory_fts)`,
    ],
  },
] as const;

export class CanonicalMemoryStore {
  readonly dbPath: string;
  private readonly db: Database;

  constructor(options: MemoryStoreOptions = {}) {
    const runtimePaths = buildRuntimePaths(options.runtimeHome);
    this.dbPath = options.dbPath ?? join(runtimePaths.memoryDir, "memories.sqlite");
    mkdirSync(dirname(this.dbPath), { recursive: true });
    this.db = new Database(this.dbPath, { create: true });
    this.db.run("PRAGMA journal_mode = WAL");
    this.applyMigrations();
  }

  close() {
    this.db.close();
  }

  appliedMigrations() {
    return this.db
      .query("SELECT version FROM memory_schema_migrations ORDER BY version")
      .all() as Array<{ version: number }>;
  }

  addMemory(input: ProposedMemoryInput, now = new Date().toISOString()): MemoryRecord {
    const record: MemoryRecord = {
      ...input,
      review_status: input.review_status ?? "proposed",
      created_at: now,
      updated_at: now,
    };

    this.db
      .query(
        `INSERT INTO memories (
          memory_id, type, scope, source_event_ids, provenance_json, confidence,
          assertion_type, trust_level, review_status, content, created_at,
          updated_at, expires_at, revalidation_rule
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        record.memory_id,
        record.type,
        record.scope,
        JSON.stringify(record.source_event_ids),
        JSON.stringify(record.provenance),
        record.confidence,
        record.assertion_type,
        record.trust_level,
        record.review_status,
        record.content,
        record.created_at,
        record.updated_at,
        record.expires_at ?? null,
        record.revalidation_rule ?? null,
      );

    const row = this.db.query("SELECT rowid FROM memories WHERE memory_id = ?").get(record.memory_id) as { rowid: number };
    this.db
      .query("INSERT OR REPLACE INTO memory_fts(rowid, memory_id, content, provenance_json) VALUES (?, ?, ?, ?)")
      .run(row.rowid, record.memory_id, record.content, JSON.stringify(record.provenance));

    return record;
  }

  getMemory(memoryId: string): MemoryRecord | undefined {
    const row = this.db.query("SELECT * FROM memories WHERE memory_id = ?").get(memoryId) as MemoryRow | null;
    return row ? rowToMemory(row) : undefined;
  }

  enqueueReview(input: Pick<ReviewQueueItem, "review_id" | "memory_id" | "proposed_diff" | "source_event_ids">, now = new Date().toISOString()) {
    const item: ReviewQueueItem = {
      ...input,
      state: "proposed",
      created_at: now,
    };

    this.db
      .query(
        `INSERT INTO review_queue (review_id, memory_id, proposed_diff, source_event_ids, state, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(item.review_id, item.memory_id, item.proposed_diff, JSON.stringify(item.source_event_ids), item.state, item.created_at);

    return item;
  }

  decideReview(reviewId: string, state: Exclude<ReviewStatus, "proposed">, now = new Date().toISOString()) {
    const item = this.getReview(reviewId);
    if (!item) throw new Error(`Unknown review item ${reviewId}`);

    this.db.transaction(() => {
      this.db.query("UPDATE review_queue SET state = ?, decided_at = ? WHERE review_id = ?").run(state, now, reviewId);
      this.db.query("UPDATE memories SET review_status = ?, updated_at = ? WHERE memory_id = ?").run(state, now, item.memory_id);
    })();

    return this.getReview(reviewId)!;
  }

  getReview(reviewId: string): ReviewQueueItem | undefined {
    const row = this.db.query("SELECT * FROM review_queue WHERE review_id = ?").get(reviewId) as ReviewRow | null;
    return row ? rowToReview(row) : undefined;
  }

  listInstructionEligibleMemories(filters: { projectId?: string; type?: MemoryType } = {}) {
    const clauses = [
      "review_status = 'accepted'",
      "trust_level IN ('medium', 'high')",
      "assertion_type != 'inferred'",
    ];
    const params: Array<string> = [];

    if (filters.projectId) {
      clauses.push("scope = ?");
      params.push(filters.projectId);
    }
    if (filters.type) {
      clauses.push("type = ?");
      params.push(filters.type);
    }

    const rows = this.db
      .query(`SELECT * FROM memories WHERE ${clauses.join(" AND ")} ORDER BY updated_at DESC, memory_id`)
      .all(...params) as MemoryRow[];
    return rows.map(rowToMemory);
  }

  searchMemories(filters: MemorySearchFilters = {}) {
    const rows = filters.query
      ? (this.db
        .query(
          `SELECT memories.* FROM memory_fts
           JOIN memories ON memories.rowid = memory_fts.rowid
           WHERE memory_fts MATCH ?
           ORDER BY memories.updated_at DESC, memories.memory_id`,
        )
        .all(filters.query) as MemoryRow[])
      : (this.db.query("SELECT * FROM memories ORDER BY updated_at DESC, memory_id").all() as MemoryRow[]);

    return rows
      .map(rowToMemory)
      .filter((memory) => matchesSearchFilters(memory, filters))
      .slice(0, filters.limit ?? 50);
  }

  buildContextBlock(options: MemoryContextOptions = {}): MemoryContextBlock {
    const memories = this.listInstructionEligibleMemories({ projectId: options.projectId, type: options.type })
      .slice(0, options.limit ?? 5)
      .map((memory) => ({
        memory_id: memory.memory_id,
        type: memory.type,
        scope: memory.scope,
        content: memory.content,
        source_event_ids: memory.source_event_ids,
        provenance: memory.provenance,
        confidence: memory.confidence,
        trust_level: memory.trust_level,
        assertion_type: memory.assertion_type,
      }));

    return {
      memories,
      content: memories
        .map((memory) => `- [${memory.memory_id}] ${memory.content} (source_events: ${memory.source_event_ids.join(",")}; confidence: ${memory.confidence}; trust: ${memory.trust_level})`)
        .join("\n"),
    };
  }

  listReviewQueue(state: ReviewStatus = "proposed") {
    const rows = this.db
      .query("SELECT * FROM review_queue WHERE state = ? ORDER BY created_at DESC, review_id")
      .all(state) as ReviewRow[];
    return rows.map(rowToReview);
  }

  typedStoreNames() {
    return MEMORY_TYPES.map((type) => ({ type, path: join(dirname(this.dbPath), type) }));
  }

  private applyMigrations() {
    this.db.run("CREATE TABLE IF NOT EXISTS memory_schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)");
    for (const migration of MEMORY_STORE_MIGRATIONS) {
      const applied = this.db.query("SELECT version FROM memory_schema_migrations WHERE version = ?").get(migration.version);
      if (applied) continue;

      this.db.transaction(() => {
        for (const statement of migration.statements) this.db.run(statement);
        this.db.query("INSERT INTO memory_schema_migrations (version, applied_at) VALUES (?, datetime('now'))").run(migration.version);
      })();
    }
  }
}

type MemoryRow = {
  memory_id: string;
  type: MemoryType;
  scope: string;
  source_event_ids: string;
  provenance_json: string;
  confidence: number;
  assertion_type: AssertionType;
  trust_level: TrustLevel;
  review_status: ReviewStatus;
  content: string;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  revalidation_rule: string | null;
};

type ReviewRow = {
  review_id: string;
  memory_id: string;
  proposed_diff: string;
  source_event_ids: string;
  state: ReviewStatus;
  created_at: string;
  decided_at: string | null;
};

function rowToMemory(row: MemoryRow): MemoryRecord {
  return {
    memory_id: row.memory_id,
    type: row.type,
    scope: row.scope,
    source_event_ids: JSON.parse(row.source_event_ids) as string[],
    provenance: JSON.parse(row.provenance_json) as Record<string, unknown>,
    confidence: row.confidence,
    assertion_type: row.assertion_type,
    trust_level: row.trust_level,
    review_status: row.review_status,
    content: row.content,
    created_at: row.created_at,
    updated_at: row.updated_at,
    expires_at: row.expires_at ?? undefined,
    revalidation_rule: row.revalidation_rule ?? undefined,
  };
}

function rowToReview(row: ReviewRow): ReviewQueueItem {
  return {
    review_id: row.review_id,
    memory_id: row.memory_id,
    proposed_diff: row.proposed_diff,
    source_event_ids: JSON.parse(row.source_event_ids) as string[],
    state: row.state,
    created_at: row.created_at,
    decided_at: row.decided_at ?? undefined,
  };
}

function matchesSearchFilters(memory: MemoryRecord, filters: MemorySearchFilters) {
  if (filters.projectId && memory.scope !== filters.projectId) return false;
  if (filters.type && memory.type !== filters.type) return false;
  if (filters.minConfidence !== undefined && memory.confidence < filters.minConfidence) return false;
  if (filters.trustLevel && memory.trust_level !== filters.trustLevel) return false;
  if (filters.updatedAfter && memory.updated_at < filters.updatedAfter) return false;
  if (filters.harness && memory.provenance.harness !== filters.harness) return false;
  return true;
}
