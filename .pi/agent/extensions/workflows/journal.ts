/**
 * Append-only JSONL journal of completed `agent()` calls, keyed by a content
 * hash of (prompt + allowlisted options). Phase B2 will consume this journal
 * for replay/resume; this phase only writes it.
 *
 * Writes are best-effort and never throw out of the caller's happy path. A
 * torn tail (last line truncated by a crash) is detected by `readJournal`:
 * every line after a parse or shape failure is dropped, since the rest of the
 * file is untrustworthy.
 */

import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Effective run-level context folded into every replay key. Anything that
 * changes what an `agent()` call would actually do under the hood — but
 * isn't carried in the per-call options — belongs here, so a replayed
 * result can only satisfy a call made under the same effective context.
 *
 * Fields are optional EXCEPT `launchCwd`, which is mandatory because it
 * guards against cross-project replay: a resumed run executes under the
 * CURRENT `ctx.cwd`, which must match the prior run's cwd.
 *
 * Changing any field changes every replay key, which fails SAFE
 * (everything re-executes instead of silently replaying under a different
 * model/thinking/project).
 */
export interface AgentKeyContext {
  /** Canonical absolute cwd the run was launched in. */
  launchCwd: string;
  /** Parent session model provider at launch; omitted when unknown. */
  defaultProvider?: string;
  /** Parent session model id at launch; omitted when unknown. */
  defaultModelId?: string;
  /** Parent session thinking level at launch; omitted when unknown. */
  defaultThinking?: string;
}

export interface AgentJournalEntry {
  /** "agent" for completed `runAgent` calls. Optional on legacy entries written
   *  before the discriminated union existed; defaults to "agent" when missing. */
  kind?: "agent";
  /** sha256 hex of (prompt + allowlisted options + AgentKeyContext). */
  key: string;
  /** 1-based append order within this run. */
  seq: number;
  /** AgentRecord.index at time of write; display aid only, NOT the replay key. */
  index: number;
  label: string;
  /** True iff the underlying `runAgent` reported success. */
  ok: boolean;
  /** The exact `ScriptAgentResult` returned to the script. */
  result: unknown;
  model?: string;
  cwd?: string;
  finishedAt: number;
}

export interface CheckpointJournalEntry {
  kind: "checkpoint";
  /** sha256 hex of (name + prompt + context + AgentKeyContext); see
   *  `checkpointCallKey`. No ordinal/seq — parallel-safe; duplicates are
   *  resolved by FIFO replay. */
  key: string;
  /** 1-based append order within this run. */
  seq: number;
  /** AgentRecord.index at time of write; display aid only. */
  index: number;
  label: string;
  /** Always true; checkpoints never journal a "failed" decision. */
  ok: true;
  /** The user's verdict on the checkpoint. */
  decision: "approved" | "rejected";
  finishedAt: number;
}

/** Discriminated union over journaled ops. `agent` is the historical shape
 *  (legacy entries omit `kind`, which `isValidEntry` coerces to "agent");
 *  `checkpoint` is a parallel op kind with disjoint key semantics. */
export type JournalEntry = AgentJournalEntry | CheckpointJournalEntry;

/**
 * Explicit allowlist of `agent()` option fields that change what the agent
 * actually does. `label` and `phase` are deliberately excluded: a relabelled
 * call must still replay against the same key.
 */
export const HASHED_OPTION_KEYS = [
  "model",
  "provider",
  "effort",
  "schema",
  "writable",
  "cwd",
] as const;

export type HashedOptionKey = (typeof HASHED_OPTION_KEYS)[number];

const JOURNAL_FILENAME = "journal.jsonl";

function canonicalStringify(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError(`Cannot canonicalize non-finite number: ${value}`);
    }
    return JSON.stringify(value);
  }
  if (typeof value === "string") return JSON.stringify(value);
  if (
    typeof value === "bigint" ||
    typeof value === "function" ||
    typeof value === "symbol"
  ) {
    throw new TypeError(`Cannot canonicalize value of type ${typeof value}`);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalStringify).join(",")}]`;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    const parts: string[] = [];
    for (const key of keys) {
      const v = obj[key];
      if (v === undefined) continue;
      parts.push(`${JSON.stringify(key)}:${canonicalStringify(v)}`);
    }
    return `{${parts.join(",")}}`;
  }
  throw new TypeError(`Cannot canonicalize value of type ${typeof value}`);
}

function pickHashedOptions(options: unknown): Record<string, unknown> {
  const subset: Record<string, unknown> = {};
  if (options && typeof options === "object" && !Array.isArray(options)) {
    const source = options as Record<string, unknown>;
    for (const key of HASHED_OPTION_KEYS) {
      const value = source[key];
      if (value !== undefined) subset[key] = value;
    }
  }
  return subset;
}

/** sha256 hex of `{ prompt, options, context }` where `options` is reduced to
 *  the hashed-fields allowlist and the whole tree is canonicalized (sorted
 *  keys at every depth, `undefined`-valued keys dropped, arrays preserve
 *  order). The run-level `context` is folded in so a replayed result can
 *  only satisfy a call made under the same effective cwd/model/thinking. */
export function agentCallKey(
  prompt: string,
  options: unknown,
  context: AgentKeyContext,
): string {
  const payload = canonicalStringify({
    prompt,
    options: pickHashedOptions(options),
    context,
  });
  return createHash("sha256").update(payload).digest("hex");
}

/** sha256 hex of `{ checkpoint: { name, prompt, context }, context }`.
 *  Pure content hash — no ordinal/seq, so concurrent checkpoint calls with
 *  identical payloads share a key and duplicates are absorbed by FIFO
 *  replay. Checkpoint keys occupy a disjoint namespace from agent keys
 *  because the wrapper object differs. */
export function checkpointCallKey(
  name: string,
  prompt: string,
  context: unknown,
  keyContext: AgentKeyContext,
): string {
  const payload = canonicalStringify({
    checkpoint: { name, prompt, context },
    context: keyContext,
  });
  return createHash("sha256").update(payload).digest("hex");
}

/** Best-effort single-line append. A failed write is swallowed so it never
 *  surfaces in the caller's happy path. */
export function appendJournalEntry(runDir: string, entry: JournalEntry): void {
  try {
    fs.mkdirSync(runDir, { recursive: true });
    fs.appendFileSync(
      path.join(runDir, JOURNAL_FILENAME),
      `${JSON.stringify(entry)}\n`,
      { mode: 0o600 },
    );
  } catch {
    // Journaling is best-effort; a failed append must not fail the run.
  }
}

function isValidEntry(value: unknown): value is JournalEntry {
  if (!value || typeof value !== "object") return false;
  const e = value as Record<string, unknown>;
  const kind = e.kind === undefined ? "agent" : e.kind;
  if (kind !== "agent" && kind !== "checkpoint") return false;
  if (typeof e.key !== "string") return false;
  if (typeof e.seq !== "number") return false;
  if (typeof e.index !== "number") return false;
  if (typeof e.label !== "string") return false;
  if (typeof e.finishedAt !== "number") return false;
  if (kind === "checkpoint") {
    if (e.ok !== true) return false;
    if (e.decision !== "approved" && e.decision !== "rejected") return false;
    return true;
  }
  if (typeof e.ok !== "boolean") return false;
  return true;
}

/** Read every well-formed entry in seq order. A parse or shape failure on any
 *  line drops that line AND every subsequent line (a torn tail makes
 *  everything after it untrustworthy). A missing file yields `[]`. */
export function readJournal(runDir: string): JournalEntry[] {
  let text: string;
  try {
    text = fs.readFileSync(path.join(runDir, JOURNAL_FILENAME), "utf8");
  } catch {
    return [];
  }
  const out: JournalEntry[] = [];
  for (const line of text.split("\n")) {
    if (!line) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch {
      break;
    }
    if (!isValidEntry(parsed)) break;
    out.push(parsed);
  }
  out.sort((a, b) => a.seq - b.seq);
  return out;
}

/** Build a FIFO replay index over `ok:true` entries. Failed calls must
 *  re-execute, so they are skipped here. `take(key)` shifts the first
 *  remaining entry for `key`; `remaining()` is the live count across all keys. */
export function createReplayIndex(entries: JournalEntry[]): {
  take(key: string): JournalEntry | undefined;
  remaining(): number;
} {
  const byKey = new Map<string, JournalEntry[]>();
  let total = 0;
  for (const entry of entries) {
    if (!entry.ok) continue;
    const list = byKey.get(entry.key);
    if (list) list.push(entry);
    else byKey.set(entry.key, [entry]);
    total += 1;
  }
  return {
    take(key: string): JournalEntry | undefined {
      const list = byKey.get(key);
      if (!list || list.length === 0) return undefined;
      const entry = list.shift()!;
      total -= 1;
      return entry;
    },
    remaining(): number {
      return total;
    },
  };
}
