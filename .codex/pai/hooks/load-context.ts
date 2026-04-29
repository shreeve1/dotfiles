#!/usr/bin/env bun
import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import { sessionContext } from "../lib/hook-io";
import { paiMemoryPath, paiUserPath } from "../lib/paths";
import { PAI_SESSION_CONTEXT } from "../lib/runtime-guidance";

const RECENT_LEARNING_LIMIT = 3;
const MEMORY_NOTE_CHAR_LIMIT = 2000;

function readIfPresent(path: string, maxChars?: number): string | null {
  if (!existsSync(path)) return null;
  let text = readFileSync(path, "utf8").trim();
  if (maxChars && text.length > maxChars) {
    text = `${text.slice(0, maxChars).trimEnd()}\n[truncated]`;
  }
  return text.length > 0 ? text : null;
}

function listMarkdown(dir: string, limit: number, newestFirst = false): string[] {
  if (!existsSync(dir)) return [];
  const names = readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .sort();
  if (newestFirst) names.reverse();
  return names
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

const learningFiles = listMarkdown(paiMemoryPath("learning"), RECENT_LEARNING_LIMIT, true);
for (const file of learningFiles) {
  const text = readIfPresent(file, MEMORY_NOTE_CHAR_LIMIT);
  if (text) sections.push(`PAI recent learning memory ${file}:\n${text}`);
}

sessionContext("SessionStart", sections.join("\n\n---\n\n"));
