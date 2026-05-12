import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { buildRuntimePaths } from "./runtime-paths";
import {
  redactPortableMemoryProvenance,
  redactPortableMemoryText,
  type PortableMemoryRedactionOptions,
  type RedactionFinding,
} from "./redaction";

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

export const PORTABLE_EXPORT_SCHEMA_VERSION = 1 as const;
export type PortableExportSchemaVersion = typeof PORTABLE_EXPORT_SCHEMA_VERSION;

export const PORTABLE_MEMORY_TYPES = ["profile", "projects", "tools", "learning", "procedures"] as const;
export type PortableMemoryType = (typeof PORTABLE_MEMORY_TYPES)[number];

export function isPortableMemoryType(value: string): value is PortableMemoryType {
  return (PORTABLE_MEMORY_TYPES as readonly string[]).includes(value);
}

export class PortableMemoryTypeError extends Error {
  readonly attemptedType: string;
  constructor(attemptedType: string) {
    super(
      `Memory type ${JSON.stringify(attemptedType)} is not portable. Portable types are: ${PORTABLE_MEMORY_TYPES.join(", ")}.`,
    );
    this.name = "PortableMemoryTypeError";
    this.attemptedType = attemptedType;
  }
}

export class PortableSchemaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PortableSchemaError";
  }
}

export type PortableMemoryRecord = {
  memory_id: string;
  type: PortableMemoryType;
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

export type PortableExportMetadata = {
  default_portable_types: readonly PortableMemoryType[];
  source_harnesses: string[];
  record_count: number;
};

export type PortableExportDocument = {
  schema_version: PortableExportSchemaVersion;
  metadata: PortableExportMetadata;
  memories: PortableMemoryRecord[];
};

export type PortableExportFindings = {
  redaction: RedactionFinding[];
};

export type PortableExportResult = {
  document: PortableExportDocument;
  findings: PortableExportFindings;
};

export type PortableExportFilters = {
  projectId?: string;
  type?: PortableMemoryType;
  trustLevel?: TrustLevel;
  includeIneligible?: boolean;
};

export type PortableExportOptions = PortableExportFilters & PortableMemoryRedactionOptions;

export type PortableImportConflict = {
  memory_id: string;
  reason: "exists_locally";
};

export type PortableImportResult = {
  imported: string[];
  skipped: PortableImportConflict[];
  total: number;
};

export type ProposeMemoryIfMissingResult =
  | { status: "proposed"; memory: MemoryRecord; review: ReviewQueueItem }
  | { status: "skipped"; reason: "already_proposed"; memory_id: string };

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
  {
    version: 3,
    statements: [
      `ALTER TABLE memories ADD COLUMN runtime_metadata_json TEXT`,
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

  proposeMemoryWithReview(
    memory: ProposedMemoryInput,
    review: Omit<Pick<ReviewQueueItem, "review_id" | "memory_id" | "proposed_diff" | "source_event_ids">, "memory_id" | "source_event_ids">,
    now = new Date().toISOString(),
  ) {
    return this.db.transaction(() => {
      const record = this.addMemory({ ...memory, review_status: "proposed" }, now);
      const reviewItem = this.enqueueReview(
        {
          review_id: review.review_id,
          memory_id: record.memory_id,
          proposed_diff: review.proposed_diff,
          source_event_ids: record.source_event_ids,
        },
        now,
      );
      return { memory: record, review: reviewItem };
    })();
  }

  proposeMemoryIfMissing(
    memory: ProposedMemoryInput,
    review: Omit<Pick<ReviewQueueItem, "review_id" | "memory_id" | "proposed_diff" | "source_event_ids">, "memory_id" | "source_event_ids">,
    now = new Date().toISOString(),
  ): ProposeMemoryIfMissingResult {
    const existing = this.getMemory(memory.memory_id);
    if (existing) {
      return { status: "skipped", reason: "already_proposed", memory_id: memory.memory_id };
    }
    const created = this.proposeMemoryWithReview(memory, review, now);
    return { status: "proposed", memory: created.memory, review: created.review };
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

  exportPortableMemories(options: PortableExportOptions = {}): PortableExportResult {
    if (options.type !== undefined && !isPortableMemoryType(options.type)) {
      throw new PortableMemoryTypeError(options.type);
    }

    const candidates = options.includeIneligible
      ? this.listAllMemoriesForPortableExport({ projectId: options.projectId, type: options.type })
      : this.listInstructionEligibleMemories({ projectId: options.projectId, type: options.type as MemoryType | undefined });

    const filtered = candidates.filter((memory) => {
      if (!isPortableMemoryType(memory.type)) return false;
      if (options.trustLevel && memory.trust_level !== options.trustLevel) return false;
      return true;
    });

    const findings: RedactionFinding[] = [];
    const portableRecords: PortableMemoryRecord[] = filtered.map((memory) => {
      const contentResult = redactPortableMemoryText("memory_content", memory.content, options);
      findings.push(...contentResult.findings);

      const provenanceResult = redactPortableMemoryProvenance(memory.provenance, options);
      findings.push(...provenanceResult.findings);
      const safeProvenance = provenanceResult.value as Record<string, unknown>;

      return {
        memory_id: memory.memory_id,
        type: memory.type as PortableMemoryType,
        scope: memory.scope,
        source_event_ids: [...memory.source_event_ids],
        provenance: safeProvenance,
        confidence: memory.confidence,
        assertion_type: memory.assertion_type,
        trust_level: memory.trust_level,
        review_status: memory.review_status,
        content: contentResult.redacted,
        created_at: memory.created_at,
        updated_at: memory.updated_at,
        expires_at: memory.expires_at,
        revalidation_rule: memory.revalidation_rule,
      };
    });

    portableRecords.sort(comparePortableRecords);

    const harnesses = new Set<string>();
    for (const record of portableRecords) {
      const harness = record.provenance.harness;
      if (typeof harness === "string") harnesses.add(harness);
    }

    const document: PortableExportDocument = {
      schema_version: PORTABLE_EXPORT_SCHEMA_VERSION,
      metadata: {
        default_portable_types: PORTABLE_MEMORY_TYPES,
        source_harnesses: [...harnesses].sort(),
        record_count: portableRecords.length,
      },
      memories: portableRecords,
    };

    return { document, findings: { redaction: findings } };
  }

  importPortableMemories(document: PortableExportDocument, now = new Date().toISOString()): PortableImportResult {
    validatePortableExportDocument(document);

    const imported: string[] = [];
    const skipped: PortableImportConflict[] = [];

    for (const record of document.memories) {
      if (!isPortableMemoryType(record.type)) {
        throw new PortableMemoryTypeError(record.type);
      }

      if (this.getMemory(record.memory_id)) {
        skipped.push({ memory_id: record.memory_id, reason: "exists_locally" });
        continue;
      }

      this.upsertMemoryFromPortable(record, now);
      imported.push(record.memory_id);
    }

    return { imported, skipped, total: document.memories.length };
  }

  upsertMemoryFromPortable(record: PortableMemoryRecord, now = new Date().toISOString()): MemoryRecord {
    const stored: MemoryRecord = {
      memory_id: record.memory_id,
      type: record.type,
      scope: record.scope,
      source_event_ids: [...record.source_event_ids],
      provenance: { ...record.provenance },
      confidence: record.confidence,
      assertion_type: record.assertion_type,
      trust_level: record.trust_level,
      review_status: record.review_status,
      content: record.content,
      created_at: record.created_at,
      updated_at: record.updated_at,
      expires_at: record.expires_at,
      revalidation_rule: record.revalidation_rule,
    };

    const runtimeMetadata = {
      portable_import: {
        imported_at: now,
        source_memory_id: record.memory_id,
      },
    };

    this.db
      .query(
        `INSERT INTO memories (
          memory_id, type, scope, source_event_ids, provenance_json, confidence,
          assertion_type, trust_level, review_status, content, created_at,
          updated_at, expires_at, revalidation_rule, runtime_metadata_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(memory_id) DO UPDATE SET
          type = excluded.type,
          scope = excluded.scope,
          source_event_ids = excluded.source_event_ids,
          provenance_json = excluded.provenance_json,
          confidence = excluded.confidence,
          assertion_type = excluded.assertion_type,
          trust_level = excluded.trust_level,
          review_status = excluded.review_status,
          content = excluded.content,
          created_at = excluded.created_at,
          updated_at = excluded.updated_at,
          expires_at = excluded.expires_at,
          revalidation_rule = excluded.revalidation_rule,
          runtime_metadata_json = excluded.runtime_metadata_json`,
      )
      .run(
        stored.memory_id,
        stored.type,
        stored.scope,
        JSON.stringify(stored.source_event_ids),
        JSON.stringify(stored.provenance),
        stored.confidence,
        stored.assertion_type,
        stored.trust_level,
        stored.review_status,
        stored.content,
        stored.created_at,
        stored.updated_at,
        stored.expires_at ?? null,
        stored.revalidation_rule ?? null,
        JSON.stringify(runtimeMetadata),
      );

    const row = this.db.query("SELECT rowid FROM memories WHERE memory_id = ?").get(stored.memory_id) as { rowid: number };
    this.db
      .query("INSERT OR REPLACE INTO memory_fts(rowid, memory_id, content, provenance_json) VALUES (?, ?, ?, ?)")
      .run(row.rowid, stored.memory_id, stored.content, JSON.stringify(stored.provenance));

    return stored;
  }

  getRuntimeMemoryMetadata(memoryId: string): Record<string, unknown> | undefined {
    const row = this.db
      .query("SELECT runtime_metadata_json FROM memories WHERE memory_id = ?")
      .get(memoryId) as { runtime_metadata_json: string | null } | null;
    if (!row || !row.runtime_metadata_json) return undefined;
    return JSON.parse(row.runtime_metadata_json) as Record<string, unknown>;
  }

  private listAllMemoriesForPortableExport(filters: { projectId?: string; type?: PortableMemoryType } = {}) {
    const clauses: string[] = [];
    const params: string[] = [];

    if (filters.projectId) {
      clauses.push("scope = ?");
      params.push(filters.projectId);
    }
    if (filters.type) {
      clauses.push("type = ?");
      params.push(filters.type);
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
    const rows = this.db
      .query(`SELECT * FROM memories ${where} ORDER BY type, scope, memory_id`)
      .all(...params) as MemoryRow[];
    return rows.map(rowToMemory);
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
  runtime_metadata_json: string | null;
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

function comparePortableRecords(a: PortableMemoryRecord, b: PortableMemoryRecord) {
  if (a.type !== b.type) return a.type < b.type ? -1 : 1;
  if (a.scope !== b.scope) return a.scope < b.scope ? -1 : 1;
  if (a.memory_id !== b.memory_id) return a.memory_id < b.memory_id ? -1 : 1;
  return 0;
}

export function validatePortableExportDocument(document: unknown): asserts document is PortableExportDocument {
  if (!document || typeof document !== "object") {
    throw new PortableSchemaError("Portable export document must be an object");
  }
  const doc = document as Record<string, unknown>;
  if (doc.schema_version !== PORTABLE_EXPORT_SCHEMA_VERSION) {
    throw new PortableSchemaError(
      `Unsupported portable export schema_version ${JSON.stringify(doc.schema_version)}; expected ${PORTABLE_EXPORT_SCHEMA_VERSION}`,
    );
  }
  if (!doc.metadata || typeof doc.metadata !== "object") {
    throw new PortableSchemaError("Portable export document missing metadata object");
  }
  if (!Array.isArray(doc.memories)) {
    throw new PortableSchemaError("Portable export document memories must be an array");
  }
  for (let index = 0; index < doc.memories.length; index += 1) {
    validatePortableMemoryRecord(doc.memories[index], index);
  }
}

function validatePortableMemoryRecord(value: unknown, index: number): asserts value is PortableMemoryRecord {
  if (!value || typeof value !== "object") {
    throw new PortableSchemaError(`Portable memory record at index ${index} must be an object`);
  }
  const record = value as Record<string, unknown>;
  requireString(record, "memory_id", index);
  requireString(record, "type", index);
  if (!isPortableMemoryType(record.type as string)) {
    throw new PortableSchemaError(
      `Portable memory record at index ${index} has non-portable type ${JSON.stringify(record.type)}`,
    );
  }
  requireString(record, "scope", index);
  if (!Array.isArray(record.source_event_ids) || !record.source_event_ids.every((entry) => typeof entry === "string")) {
    throw new PortableSchemaError(`Portable memory record at index ${index} has invalid source_event_ids`);
  }
  if (!record.provenance || typeof record.provenance !== "object" || Array.isArray(record.provenance)) {
    throw new PortableSchemaError(`Portable memory record at index ${index} has invalid provenance`);
  }
  if (typeof record.confidence !== "number" || record.confidence < 0 || record.confidence > 1) {
    throw new PortableSchemaError(`Portable memory record at index ${index} has invalid confidence`);
  }
  requireEnum(record, "assertion_type", ASSERTION_TYPES, index);
  requireEnum(record, "trust_level", TRUST_LEVELS, index);
  requireEnum(record, "review_status", REVIEW_STATUSES, index);
  requireString(record, "content", index);
  requireString(record, "created_at", index);
  requireString(record, "updated_at", index);
  if (record.expires_at !== undefined && typeof record.expires_at !== "string") {
    throw new PortableSchemaError(`Portable memory record at index ${index} has invalid expires_at`);
  }
  if (record.revalidation_rule !== undefined && typeof record.revalidation_rule !== "string") {
    throw new PortableSchemaError(`Portable memory record at index ${index} has invalid revalidation_rule`);
  }
}

function requireString(record: Record<string, unknown>, key: string, index: number) {
  if (typeof record[key] !== "string" || (record[key] as string).length === 0) {
    throw new PortableSchemaError(`Portable memory record at index ${index} missing string field ${key}`);
  }
}

function requireEnum<T extends readonly string[]>(record: Record<string, unknown>, key: string, allowed: T, index: number) {
  if (typeof record[key] !== "string" || !(allowed as readonly string[]).includes(record[key] as string)) {
    throw new PortableSchemaError(
      `Portable memory record at index ${index} field ${key} must be one of ${allowed.join(", ")}`,
    );
  }
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
