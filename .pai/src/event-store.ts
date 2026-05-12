import { Database } from "bun:sqlite";
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { buildRuntimePaths } from "./runtime-paths";
import type { AdapterCapabilities } from "./policy";
import type { RedactedPaiEvent } from "./redaction";

export type EventIngestStatus = "accepted" | "rejected" | "pending" | "replayed";

export type CanonicalEventEnvelope = Omit<RedactedPaiEvent, "redaction_destination"> & {
  cwd?: string;
  project_id?: string;
  parent_event_id?: string;
  turn_id?: string;
  tool_call_id?: string;
  actor_id?: string;
  capabilities: AdapterCapabilities;
  ingest_status: EventIngestStatus;
  policy_decision_id?: string;
  payload_ref?: string;
  payload?: never;
};

export type EventIngestInput = RedactedPaiEvent & {
  cwd?: string;
  project_id?: string;
  parent_event_id?: string;
  turn_id?: string;
  tool_call_id?: string;
  actor_id?: string;
  capabilities: AdapterCapabilities;
  policy_decision_id?: string;
  payload_ref?: string;
};

export type EventStoreOptions = {
  runtimeHome?: string;
  dbPath?: string;
  trailPath?: string;
};

export type EventIngestOptions = {
  writeJsonl?: boolean;
};

export type EventIngestResult = {
  status: "accepted" | "replayed";
  envelope: CanonicalEventEnvelope;
};

export type JsonlPendingMarker = {
  schema_version: "pai.event.v1";
  event_id: string;
  pai_session_id: string;
  sequence: number;
  ingest_status: "pending";
  reason: string;
};

export type ReconciliationResult = {
  missing_jsonl_events: string[];
  appended: number;
};

export const EVENT_STORE_MIGRATIONS = [
  {
    version: 1,
    statements: [
      `CREATE TABLE IF NOT EXISTS events (
        event_id TEXT PRIMARY KEY,
        pai_session_id TEXT NOT NULL,
        sequence INTEGER NOT NULL,
        schema_version TEXT NOT NULL,
        harness TEXT NOT NULL,
        event_type TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        adapter_version TEXT NOT NULL,
        project_id TEXT,
        ingest_status TEXT NOT NULL,
        redaction_status TEXT NOT NULL,
        sensitivity TEXT NOT NULL,
        policy_decision_id TEXT,
        envelope_json TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE (pai_session_id, sequence)
      )`,
    ],
  },
] as const;

export class CanonicalEventStore {
  readonly dbPath: string;
  readonly trailPath: string;
  private readonly db: Database;

  constructor(options: EventStoreOptions = {}) {
    const runtimePaths = buildRuntimePaths(options.runtimeHome);
    this.dbPath = options.dbPath ?? runtimePaths.eventsDb;
    this.trailPath = options.trailPath ?? join(runtimePaths.trailsDir, "events.jsonl");

    mkdirSync(dirname(this.dbPath), { recursive: true });
    mkdirSync(dirname(this.trailPath), { recursive: true });

    this.db = new Database(this.dbPath, { create: true });
    this.db.run("PRAGMA busy_timeout = 5000");
    this.db.run("PRAGMA journal_mode = WAL");
    this.applyMigrations();
  }

  close() {
    this.db.close();
  }

  journalMode() {
    return this.db.query("PRAGMA journal_mode").get() as { journal_mode: string };
  }

  appliedMigrations() {
    return this.db
      .query("SELECT version FROM schema_migrations ORDER BY version")
      .all() as Array<{ version: number }>;
  }

  ingest(input: EventIngestInput, options: EventIngestOptions = {}): EventIngestResult {
    const writeJsonl = options.writeJsonl ?? true;
    const acceptedEnvelope = buildCanonicalEventEnvelope(input, "accepted");

    const result = this.db.transaction(() => {
      const insertResult = this.db
        .query(
          `INSERT OR IGNORE INTO events (
            event_id,
            pai_session_id,
            sequence,
            schema_version,
            harness,
            event_type,
            timestamp,
            adapter_version,
            project_id,
            ingest_status,
            redaction_status,
            sensitivity,
            policy_decision_id,
            envelope_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          acceptedEnvelope.event_id,
          acceptedEnvelope.pai_session_id,
          acceptedEnvelope.sequence,
          acceptedEnvelope.schema_version,
          acceptedEnvelope.harness,
          acceptedEnvelope.event_type,
          acceptedEnvelope.timestamp,
          acceptedEnvelope.adapter_version,
          acceptedEnvelope.project_id ?? null,
          acceptedEnvelope.ingest_status,
          acceptedEnvelope.redaction_status,
          acceptedEnvelope.sensitivity,
          acceptedEnvelope.policy_decision_id ?? null,
          JSON.stringify(acceptedEnvelope),
        );

      const stored = this.findStoredEvent(input.event_id, input.pai_session_id, input.sequence);
      if (!stored) throw new Error(`Event ingest failed for ${input.event_id}`);

      const isNew = insertResult.changes > 0;
      return {
        status: isNew ? "accepted" : "replayed",
        envelope: isNew ? acceptedEnvelope : { ...stored.envelope, ingest_status: "replayed" as const },
      } satisfies EventIngestResult;
    })();

    if (result.status === "accepted" && writeJsonl) {
      this.appendJsonl(result.envelope);
    }

    return result;
  }

  writePendingJsonlMarker(input: Pick<EventIngestInput, "event_id" | "pai_session_id" | "sequence">, reason: string) {
    const marker: JsonlPendingMarker = {
      schema_version: "pai.event.v1",
      event_id: input.event_id,
      pai_session_id: input.pai_session_id,
      sequence: input.sequence,
      ingest_status: "pending",
      reason,
    };
    appendFileSync(this.trailPath, `${JSON.stringify(marker)}\n`, "utf8");
  }

  reconcileJsonlTrail(): ReconciliationResult {
    const trailedEventIds = new Set(
      readJsonl(this.trailPath)
        .filter((line) => line.ingest_status !== "pending")
        .map((line) => line.event_id)
        .filter(Boolean),
    );
    const missing = this.listEvents().filter((event) => !trailedEventIds.has(event.event_id));

    for (const event of missing) {
      this.appendJsonl(event);
    }

    return {
      missing_jsonl_events: missing.map((event) => event.event_id),
      appended: missing.length,
    };
  }

  listEvents() {
    const rows = this.db.query("SELECT envelope_json FROM events ORDER BY pai_session_id, sequence").all() as Array<{
      envelope_json: string;
    }>;
    return rows.map((row) => JSON.parse(row.envelope_json) as CanonicalEventEnvelope);
  }

  listEventsForDistill(options: { sinceTimestamp?: string; sessionCursors?: Record<string, number> } = {}): CanonicalEventEnvelope[] {
    const all = this.listEvents();
    if (options.sinceTimestamp !== undefined) {
      return all.filter((event) => event.timestamp > options.sinceTimestamp!);
    }
    const cursors = options.sessionCursors ?? {};
    return all.filter((event) => {
      const cursor = cursors[event.pai_session_id] ?? 0;
      return event.sequence > cursor;
    });
  }

  private applyMigrations() {
    this.db.run("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)");

    for (const migration of EVENT_STORE_MIGRATIONS) {
      const applied = this.db.query("SELECT version FROM schema_migrations WHERE version = ?").get(migration.version);
      if (applied) continue;

      this.db.transaction(() => {
        for (const statement of migration.statements) {
          this.db.run(statement);
        }
        this.db.query("INSERT INTO schema_migrations (version, applied_at) VALUES (?, datetime('now'))").run(migration.version);
      })();
    }
  }

  private appendJsonl(envelope: CanonicalEventEnvelope) {
    appendFileSync(this.trailPath, `${JSON.stringify(envelope)}\n`, "utf8");
  }

  private findStoredEvent(eventId: string, paiSessionId: string, sequence: number) {
    const row = this.db
      .query(
        `SELECT event_id, envelope_json, created_at
         FROM events
         WHERE event_id = ? OR (pai_session_id = ? AND sequence = ?)
         ORDER BY CASE WHEN event_id = ? THEN 0 ELSE 1 END
         LIMIT 1`,
      )
      .get(eventId, paiSessionId, sequence, eventId) as { event_id: string; envelope_json: string; created_at: string } | null;

    if (!row) return undefined;
    return {
      event_id: row.event_id,
      envelope: JSON.parse(row.envelope_json) as CanonicalEventEnvelope,
      created_at: row.created_at,
    };
  }

}

export function buildCanonicalEventEnvelope(input: EventIngestInput, ingestStatus: EventIngestStatus): CanonicalEventEnvelope {
  const envelope: CanonicalEventEnvelope = {
    schema_version: input.schema_version,
    event_id: input.event_id,
    pai_session_id: input.pai_session_id,
    harness: input.harness,
    event_type: input.event_type,
    timestamp: input.timestamp,
    sequence: input.sequence,
    adapter_version: input.adapter_version,
    sensitivity: input.sensitivity,
    taint_labels: input.taint_labels,
    redaction_status: input.redaction_status,
    payload_size_limit: input.payload_size_limit,
    payload_summary: input.payload_summary,
    findings: input.findings,
    capabilities: input.capabilities,
    ingest_status: ingestStatus,
  };

  if (input.cwd) envelope.cwd = input.cwd;
  if (input.project_id) envelope.project_id = input.project_id;
  if (input.parent_event_id) envelope.parent_event_id = input.parent_event_id;
  if (input.turn_id) envelope.turn_id = input.turn_id;
  if (input.tool_call_id) envelope.tool_call_id = input.tool_call_id;
  if (input.actor_id) envelope.actor_id = input.actor_id;
  if (input.policy_decision_id) envelope.policy_decision_id = input.policy_decision_id;
  if (input.payload_ref) envelope.payload_ref = input.payload_ref;

  return envelope;
}

function readJsonl(path: string) {
  if (!existsSync(path)) return [] as Array<Record<string, unknown>>;
  return readFileSync(path, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}
