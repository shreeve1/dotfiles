#!/usr/bin/env bun
import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import { sessionContext } from "../lib/hook-io";
import { paiMemoryPath, paiUserPath } from "../lib/paths";
import { PAI_SESSION_CONTEXT } from "../lib/runtime-guidance";

function readIfPresent(path: string): string | null {
  if (!existsSync(path)) return null;
  const text = readFileSync(path, "utf8").trim();
  return text.length > 0 ? text : null;
}

function listMarkdown(dir: string, limit: number): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .sort()
    .slice(0, limit)
    .map((name) => join(dir, name));
}

const sections: string[] = [PAI_SESSION_CONTEXT];
const userReadme = readIfPresent(paiUserPath("README.md"));
if (userReadme) sections.push(`PAI user context:\n${userReadme}`);

const preferenceFiles = listMarkdown(paiUserPath("preferences"), 3);
for (const file of preferenceFiles) {
  const text = readIfPresent(file);
  if (text) sections.push(`PAI preference ${file}:\n${text}`);
}

const workLog = readIfPresent(paiMemoryPath("work", "active.md"));
if (workLog) sections.push(`PAI active work:\n${workLog}`);

sessionContext("SessionStart", sections.join("\n\n---\n\n"));
