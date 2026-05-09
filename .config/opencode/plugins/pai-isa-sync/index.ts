/**
 * pai-isa-sync — read-only ISA → work.json mirror via tool.execute.after
 *
 * Adapted from upstream PAI v6.3.0 hooks/ISASync.hook.ts.
 * OpenCode trigger: `tool.execute.after` filtered to write/edit on ISA.md
 * (or legacy PRD.md) under MEMORY/WORK/<slug>/.
 *
 * On each write, parses frontmatter + counts criteria, then upserts an entry
 * in the shared PAI memory substrate work.json. Pure read-only from the ISA's
 * perspective; the AI writes all ISA content directly.
 *
 * v6.3.0 OpenCode port: stripped Pulse-dashboard syndication
 * (pushStateToTargets / setPhaseTab) — those depend on the Pulse daemon which
 * the OpenCode port doesn't run. The work.json mirror remains so any future
 * dashboard or status bar can read it.
 *
 * Fails closed: any error logs to stderr; never crashes the session.
 */

import type { Plugin } from "@opencode-ai/plugin";
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

const ARTIFACT_FILENAME = "ISA.md";
const LEGACY_ARTIFACT_FILENAME = "PRD.md";
const PAI_RUNTIME_HOME = process.env.PAI_RUNTIME_HOME || join(homedir(), ".pai");
const MEMORY_DIR = join(PAI_RUNTIME_HOME, "memory");
const WORK_JSON = join(MEMORY_DIR, "STATE", "work.json");

// Inlined minimal ISA parsing (subset of upstream hooks/lib/isa-utils.ts)

function parseFrontmatter(content: string): Record<string, string> | null {
  const m = content.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const fm: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx > 0)
      fm[line.slice(0, idx).trim()] = line
        .slice(idx + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
  }
  return fm;
}

const CRITERIA_HEADING_RE =
  /^(?:##\s+(?:ISC\s+)?Criteria\b[^\n]*|##\s+IDEAL\s+STATE\s+CRITERIA\b[^\n]*|###\s+Criteria\b[^\n]*)$/im;

function countCriteria(content: string): { checked: number; total: number } {
  const headingMatch = CRITERIA_HEADING_RE.exec(content);
  if (!headingMatch || headingMatch.index === undefined)
    return { checked: 0, total: 0 };
  const startOfBody = headingMatch.index + headingMatch[0].length;
  const rest = content.slice(startOfBody);
  const endMatch = rest.match(/\n##\s+(?!#)|\n---\s*\n/);
  const body = endMatch ? rest.slice(0, endMatch.index) : rest;
  const lines = body.split("\n").filter((l) => l.match(/^- \[[ x]\]/));
  const checked = lines.filter((l) => l.startsWith("- [x]")).length;
  return { checked, total: lines.length };
}

interface SessionEntry {
  slug: string;
  phase: string;
  isa_path: string;
  criteria_total: number;
  criteria_checked: number;
  updated_at: string;
}

interface WorkJson {
  sessions: Record<string, SessionEntry>;
  updated_at: string;
}

function loadWorkJson(): WorkJson {
  if (!existsSync(WORK_JSON))
    return { sessions: {}, updated_at: new Date().toISOString() };
  try {
    const parsed = JSON.parse(readFileSync(WORK_JSON, "utf-8"));
    return {
      sessions:
        parsed.sessions && typeof parsed.sessions === "object"
          ? parsed.sessions
          : {},
      updated_at: parsed.updated_at || new Date().toISOString(),
    };
  } catch (err) {
    console.error("[pai-isa-sync] malformed work.json, resetting:", err);
    return { sessions: {}, updated_at: new Date().toISOString() };
  }
}

function saveWorkJson(data: WorkJson): void {
  try {
    mkdirSync(dirname(WORK_JSON), { recursive: true });
    writeFileSync(WORK_JSON, JSON.stringify(data, null, 2) + "\n", "utf-8");
  } catch (err) {
    console.error("[pai-isa-sync] failed to write work.json:", err);
  }
}

async function processArtifact(filePath: string): Promise<void> {
  if (!filePath.includes("MEMORY/WORK/")) return;
  const isISA =
    filePath.endsWith("/" + ARTIFACT_FILENAME) ||
    filePath.endsWith(ARTIFACT_FILENAME);
  const isLegacy =
    filePath.endsWith("/" + LEGACY_ARTIFACT_FILENAME) ||
    filePath.endsWith(LEGACY_ARTIFACT_FILENAME);
  if (!isISA && !isLegacy) return;
  if (!existsSync(filePath)) return;

  const content = readFileSync(filePath, "utf-8");
  const fm = parseFrontmatter(content);
  if (!fm) return;
  const slug = fm.slug;
  if (!slug) return;

  const { checked, total } = countCriteria(content);
  const data = loadWorkJson();
  data.sessions[slug] = {
    slug,
    phase: (fm.phase || "").toUpperCase(),
    isa_path: filePath,
    criteria_total: total,
    criteria_checked: checked,
    updated_at: new Date().toISOString(),
  };
  data.updated_at = new Date().toISOString();
  saveWorkJson(data);
}

export const PaiIsaSync: Plugin = async () => {
  return {
    "tool.execute.after": async (input, _output) => {
      try {
        const tool = input?.tool;
        if (tool !== "write" && tool !== "edit") return;
        // tool.execute.after exposes original tool args on input.args
        // (output carries the tool result, not the call args).
        const args = (input as { args?: Record<string, unknown> })?.args;
        const fp =
          (typeof args?.filePath === "string" && args.filePath) ||
          (typeof args?.file_path === "string" && args.file_path) ||
          undefined;
        if (typeof fp === "string") await processArtifact(fp);
      } catch (err) {
        console.error("[pai-isa-sync] uncaught:", err);
      }
    },
  };
};
