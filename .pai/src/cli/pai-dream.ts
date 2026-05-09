#!/usr/bin/env bun
import { CanonicalEventStore } from "../event-store";
import { CanonicalMemoryStore } from "../memory-store";
import { DeterministicDreamProvider, LocalRulesDreamProvider, runDreamPipeline } from "../dream-pipeline";

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

if (command !== "run") throw new Error(`Unknown pai-dream command ${command}`);

const runtimeHome = stringFlag(args, "runtime-home");
const eventStore = new CanonicalEventStore({ runtimeHome });
const memoryStore = new CanonicalMemoryStore({ runtimeHome });

try {
  const providerName = stringFlag(args, "provider") ?? "local";
  const provider = providerName === "deterministic" ? new DeterministicDreamProvider() : new LocalRulesDreamProvider();
  const result = runDreamPipeline(memoryStore, eventStore.listEvents(), {
    provider,
    projectId: stringFlag(args, "project"),
  });
  console.log(JSON.stringify(result, null, 2));
} finally {
  eventStore.close();
  memoryStore.close();
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

function usage() {
  console.error(`Usage:
  pai-dream run [--runtime-home PATH] [--project ID] [--provider local|deterministic]

Providers available in this AFK slice:
  local          local/offline rules-only provider
  deterministic deterministic test double`);
}
