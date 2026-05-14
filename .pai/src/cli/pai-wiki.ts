#!/usr/bin/env bun
import { bootstrapWiki, ingestWikiSource, lintWiki, listWikiSources, planWikiIngest, readWikiPage, searchWiki, validateWiki } from "../wiki";

type ParsedArgs = {
  positionals: string[];
  flags: Record<string, string | true>;
};

const BOOLEAN_FLAGS = new Set(["dry-run", "json"]);
const args = parseArgs(Bun.argv.slice(2));
const command = args.positionals[0];

try {
  if (!command || command === "help" || command === "--help") {
    usage();
    process.exit(command ? 0 : 1);
  }

  const options = { runtimeHome: stringFlag(args, "runtime-home"), dotfilesPaiDir: stringFlag(args, "dotfiles-pai-dir") };
  if (command === "sources") {
    console.log(JSON.stringify({ sources: listWikiSources(options) }, null, 2));
  } else if (command === "plan") {
    console.log(JSON.stringify(planWikiIngest(requiredSource(args), options), null, 2));
  } else if (command === "ingest") {
    console.log(JSON.stringify(ingestWikiSource(requiredSource(args), { ...options, dryRun: booleanFlag(args, "dry-run") }), null, 2));
  } else if (command === "validate") {
    const result = validateWiki(options);
    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) process.exitCode = 2;
  } else if (command === "lint") {
    const result = lintWiki(options);
    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) process.exitCode = 2;
  } else if (command === "bootstrap") {
    if (!booleanFlag(args, "dry-run")) throw new Error("pai-wiki bootstrap is dry-run only in v1");
    console.log(JSON.stringify(bootstrapWiki(options), null, 2));
  } else if (command === "read") {
    const target = args.positionals[1];
    if (!target) throw new Error("pai-wiki read requires <page-or-alias>");
    const result = readWikiPage(target, options);
    if ("error" in result) {
      if (booleanFlag(args, "json")) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.error(`error: ${result.message}`);
        if (result.close_matches.length) {
          console.error("close matches:");
          for (const match of result.close_matches) console.error(`  - ${match.relative_path} (${match.title})`);
        }
      }
      process.exitCode = result.error === "outside-wiki" ? 3 : 2;
    } else if (booleanFlag(args, "json")) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      process.stdout.write(result.content);
      if (!result.content.endsWith("\n")) process.stdout.write("\n");
    }
  } else if (command === "search") {
    const query = args.positionals.slice(1).join(" ").trim();
    if (!query) throw new Error("pai-wiki search requires <query>");
    const result = searchWiki(query, options);
    if (booleanFlag(args, "json")) {
      console.log(JSON.stringify(result, null, 2));
    } else if (!result.hit_count) {
      console.log(`no matches for "${query}"`);
    } else {
      for (const hit of result.hits) {
        console.log(`${hit.relative_path}  [${hit.type}]  confidence=${hit.confidence}`);
        console.log(`  ${hit.title}`);
        for (const match of hit.matches) console.log(`    ${match.field}: ${match.snippet}`);
      }
    }
  } else {
    throw new Error(`Unknown pai-wiki command ${command}`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 2;
}

function requiredSource(args: ParsedArgs): string {
  const source = stringFlag(args, "source");
  if (!source) throw new Error("--source is required");
  return source;
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
    if (BOOLEAN_FLAGS.has(rawKey)) {
      flags[rawKey] = true;
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
  return args.flags[name] === true || args.flags[name] === "true";
}

function usage() {
  console.error(`Usage:
  pai-wiki sources [--runtime-home PATH] [--dotfiles-pai-dir PATH]
  pai-wiki plan --source SOURCE [--runtime-home PATH] [--dotfiles-pai-dir PATH]
  pai-wiki ingest --source SOURCE [--dry-run] [--runtime-home PATH] [--dotfiles-pai-dir PATH]
  pai-wiki validate [--runtime-home PATH] [--dotfiles-pai-dir PATH]
  pai-wiki lint [--runtime-home PATH] [--dotfiles-pai-dir PATH]
  pai-wiki bootstrap --dry-run [--runtime-home PATH] [--dotfiles-pai-dir PATH]
  pai-wiki read <page-or-alias> [--json] [--runtime-home PATH]
  pai-wiki search <query...> [--json] [--runtime-home PATH]`);
}
