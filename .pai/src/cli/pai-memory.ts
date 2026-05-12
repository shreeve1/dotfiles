#!/usr/bin/env bun
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import {
  CanonicalMemoryStore,
  MEMORY_TYPES,
  PORTABLE_MEMORY_TYPES,
  PortableMemoryTypeError,
  PortableSchemaError,
  REVIEW_STATUSES,
  TRUST_LEVELS,
  isPortableMemoryType,
  validatePortableExportDocument,
  type MemorySearchFilters,
  type MemoryType,
  type PortableExportDocument,
  type PortableExportOptions,
  type PortableMemoryType,
  type ReviewStatus,
  type TrustLevel,
} from "../memory-store";
import { PortableMemoryOversizeError } from "../redaction";

type ParsedArgs = {
  positionals: string[];
  flags: Record<string, string | true>;
};

const args = parseArgs(Bun.argv.slice(2));
const command = args.positionals[0];

if (!command || command === "--help" || command === "help") {
  usage();
  process.exit(command ? 0 : 1);
}

try {
  if (command === "export-portable") {
    runExportPortable(args);
  } else if (command === "import-portable") {
    runImportPortable(args);
  } else {
    runStoreCommand(command, args);
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`pai-memory error: ${message}\n`);
  process.exit(1);
}

function runStoreCommand(command: string, args: ParsedArgs) {
  const store = new CanonicalMemoryStore({ runtimeHome: stringFlag(args, "runtime-home") });
  try {
    if (command === "search") {
      const filters: MemorySearchFilters = {
        query: args.positionals[1],
        projectId: stringFlag(args, "project"),
        type: memoryTypeFlag(args, "type"),
        minConfidence: numberFlag(args, "confidence"),
        trustLevel: trustFlag(args, "trust"),
        updatedAfter: stringFlag(args, "since"),
        harness: stringFlag(args, "harness"),
        limit: integerFlag(args, "limit"),
      };
      console.log(JSON.stringify({ memories: store.searchMemories(filters) }, null, 2));
    } else if (command === "context") {
      const block = store.buildContextBlock({
        projectId: stringFlag(args, "project"),
        type: memoryTypeFlag(args, "type"),
        limit: integerFlag(args, "limit"),
      });
      console.log(JSON.stringify(block, null, 2));
    } else if (command === "review") {
      const action = args.positionals[1] ?? "list";
      if (action === "list") {
        const state = reviewStatusFlag(args, "state") ?? "proposed";
        const reviews = store.listReviewQueue(state).map((review) => {
          const memory = store.getMemory(review.memory_id);
          return {
            ...review,
            confidence: memory?.confidence,
            assertion_type: memory?.assertion_type,
            trust_level: memory?.trust_level,
            memory_type: memory?.type,
          };
        });
        console.log(JSON.stringify({ reviews }, null, 2));
      } else if (action === "accept" || action === "reject" || action === "defer") {
        const reviewId = args.positionals[2];
        if (!reviewId) throw new Error(`pai-memory review ${action} requires a review_id`);
        const nextState = action === "accept" ? "accepted" : action === "reject" ? "rejected" : "deferred";
        console.log(JSON.stringify({ review: store.decideReview(reviewId, nextState) }, null, 2));
      } else {
        throw new Error(`Unknown review action ${action}`);
      }
    } else {
      throw new Error(`Unknown pai-memory command ${command}`);
    }
  } finally {
    store.close();
  }
}

function runExportPortable(args: ParsedArgs) {
  const typeRaw = stringFlag(args, "type");
  if (typeRaw === "work") {
    throw new PortableMemoryTypeError("work");
  }
  let typeFilter: PortableMemoryType | undefined;
  if (typeRaw !== undefined) {
    if (!isPortableMemoryType(typeRaw)) {
      throw new PortableMemoryTypeError(typeRaw);
    }
    typeFilter = typeRaw;
  }

  const options: PortableExportOptions = {
    projectId: stringFlag(args, "project"),
    type: typeFilter,
    trustLevel: trustFlag(args, "trust"),
    includeIneligible: booleanFlag(args, "include-ineligible"),
    maxPortableChars: integerFlag(args, "max-portable-chars"),
  };
  const output = stringFlag(args, "output");
  const dryRun = booleanFlag(args, "dry-run") === true;
  if (!dryRun && !output) {
    throw new Error("export-portable requires --output PATH (or --dry-run to preview)");
  }

  const store = new CanonicalMemoryStore({ runtimeHome: stringFlag(args, "runtime-home") });
  let result;
  try {
    result = store.exportPortableMemories(options);
  } finally {
    store.close();
  }

  if (!dryRun && output) {
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, `${JSON.stringify(result.document, null, 2)}\n`);
  }

  console.log(
    JSON.stringify(
      {
        command: "export-portable",
        dry_run: dryRun,
        output: dryRun ? null : output,
        record_count: result.document.memories.length,
        source_harnesses: result.document.metadata.source_harnesses,
        redaction_findings: result.findings.redaction,
      },
      null,
      2,
    ),
  );
}

function runImportPortable(args: ParsedArgs) {
  const typeRaw = stringFlag(args, "type");
  if (typeRaw === "work") {
    throw new PortableMemoryTypeError("work");
  }
  if (typeRaw !== undefined && !isPortableMemoryType(typeRaw)) {
    throw new PortableMemoryTypeError(typeRaw);
  }

  const input = stringFlag(args, "input");
  if (!input) {
    throw new Error("import-portable requires --input PATH");
  }

  const dryRun = booleanFlag(args, "dry-run") === true;
  const raw = readFileSync(input, "utf8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new PortableSchemaError(`Failed to parse ${input}: ${message}`);
  }
  validatePortableExportDocument(parsed);
  const document: PortableExportDocument = parsed;

  let filteredMemories = document.memories;
  if (typeRaw !== undefined) {
    filteredMemories = filteredMemories.filter((memory) => memory.type === typeRaw);
  }
  const project = stringFlag(args, "project");
  if (project !== undefined) {
    filteredMemories = filteredMemories.filter((memory) => memory.scope === project);
  }

  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          command: "import-portable",
          dry_run: true,
          input,
          schema_version: document.schema_version,
          total: filteredMemories.length,
          would_import: filteredMemories.map((memory) => memory.memory_id),
          skipped: [],
          conflict_policy: "local-wins",
          notes: [
            "Dry-run does not touch the runtime SQLite store; collisions are not predicted.",
          ],
        },
        null,
        2,
      ),
    );
    return;
  }

  const store = new CanonicalMemoryStore({ runtimeHome: stringFlag(args, "runtime-home") });
  let result;
  try {
    const filteredDocument: PortableExportDocument = { ...document, memories: filteredMemories };
    result = store.importPortableMemories(filteredDocument);
  } finally {
    store.close();
  }

  console.log(
    JSON.stringify(
      {
        command: "import-portable",
        dry_run: false,
        input,
        imported: result.imported,
        skipped: result.skipped,
        total: result.total,
        conflict_policy: "local-wins",
      },
      null,
      2,
    ),
  );
}

function parseArgs(values: string[]): ParsedArgs {
  const positionals: string[] = [];
  const flags: Record<string, string | true> = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith("--")) {
      positionals.push(value);
      continue;
    }

    const [rawKey, inlineValue] = value.slice(2).split("=", 2);
    if (inlineValue !== undefined) {
      flags[rawKey] = inlineValue;
      continue;
    }

    const next = values[index + 1];
    if (next && !next.startsWith("--")) {
      flags[rawKey] = next;
      index += 1;
    } else {
      flags[rawKey] = true;
    }
  }
  return { positionals, flags };
}

function stringFlag(args: ParsedArgs, name: string) {
  const value = args.flags[name];
  return typeof value === "string" ? value : undefined;
}

function booleanFlag(args: ParsedArgs, name: string) {
  const value = args.flags[name];
  if (value === true) return true;
  if (value === undefined) return undefined;
  return value === "true" ? true : value === "false" ? false : undefined;
}

function integerFlag(args: ParsedArgs, name: string) {
  const value = stringFlag(args, name);
  return value === undefined ? undefined : Number.parseInt(value, 10);
}

function numberFlag(args: ParsedArgs, name: string) {
  const value = stringFlag(args, name);
  return value === undefined ? undefined : Number.parseFloat(value);
}

function memoryTypeFlag(args: ParsedArgs, name: string): MemoryType | undefined {
  const value = stringFlag(args, name);
  if (value === undefined) return undefined;
  if (!(MEMORY_TYPES as readonly string[]).includes(value)) throw new Error(`Invalid memory type ${value}`);
  return value as MemoryType;
}

function trustFlag(args: ParsedArgs, name: string): TrustLevel | undefined {
  const value = stringFlag(args, name);
  if (value === undefined) return undefined;
  if (!(TRUST_LEVELS as readonly string[]).includes(value)) throw new Error(`Invalid trust level ${value}`);
  return value as TrustLevel;
}

function reviewStatusFlag(args: ParsedArgs, name: string): ReviewStatus | undefined {
  const value = stringFlag(args, name);
  if (value === undefined) return undefined;
  if (!(REVIEW_STATUSES as readonly string[]).includes(value)) throw new Error(`Invalid review state ${value}`);
  return value as ReviewStatus;
}

function usage() {
  process.stderr.write(`Usage:
  pai-memory search [query] [--project ID] [--type TYPE] [--confidence N] [--trust LEVEL] [--since ISO] [--harness NAME] [--limit N]
  pai-memory context [--project ID] [--type TYPE] [--limit N]
  pai-memory review list [--state proposed|accepted|rejected|deferred]
  pai-memory review accept|reject|defer <review_id>
  pai-memory export-portable [--output PATH] [--dry-run] [--project ID] [--type TYPE] [--trust LEVEL] [--include-ineligible] [--max-portable-chars N] [--runtime-home PATH]
  pai-memory import-portable --input PATH [--dry-run] [--project ID] [--type TYPE] [--runtime-home PATH]

Portable types: ${PORTABLE_MEMORY_TYPES.join(", ")}. The "work" type is rejected for portable export/import.
`);
}
