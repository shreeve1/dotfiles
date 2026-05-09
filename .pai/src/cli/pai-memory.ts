#!/usr/bin/env bun
import {
  CanonicalMemoryStore,
  MEMORY_TYPES,
  REVIEW_STATUSES,
  TRUST_LEVELS,
  type MemorySearchFilters,
  type MemoryType,
  type ReviewStatus,
  type TrustLevel,
} from "../memory-store";

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
      console.log(JSON.stringify({ reviews: store.listReviewQueue(state) }, null, 2));
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
  console.error(`Usage:
  pai-memory search [query] [--project ID] [--type TYPE] [--confidence N] [--trust LEVEL] [--since ISO] [--harness NAME] [--limit N]
  pai-memory context [--project ID] [--type TYPE] [--limit N]
  pai-memory review list [--state proposed|accepted|rejected|deferred]
  pai-memory review accept|reject|defer <review_id>`);
}
