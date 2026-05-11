/**
 * pai-checkpoint-per-isc — auto git commit on every ISC `[ ]`->`[x]` transition
 *
 * Adapted from upstream PAI v6.3.0 hooks/CheckpointPerISC.hook.ts.
 * OpenCode trigger: `tool.execute.after` filtered to write/edit on ISA.md
 * (or legacy PRD.md) under ~/.pai/memory/WORK/<slug>/.
 *
 * For each newly-checked ISC, iterates through the allowlist of opted-in repos
 * ($PAI_RUNTIME_HOME/checkpoint-repos.txt, default ~/.pai/checkpoint-repos.txt)
 * and creates one git commit per repo that has uncommitted changes. Commit subject:
 *   "<ISC-id> (<slug>): <sanitized description>"
 *
 * Idempotent via sidecar state file:
 * ~/.pai/memory/WORK/<slug>/.checkpoint-state.json.
 * Allowlist is empty by default; repos must be opted in explicitly.
 *
 * Fails closed: any error path logs to stderr and continues silently — never
 * crashes the session, never commits without an allowlist, never executes any
 * destructive git op (no reset/revert/checkout/branch -D/clean -fd/push --force).
 */

import type { Plugin } from "@opencode-ai/plugin";
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { basename, dirname, join, relative } from "node:path";
import { homedir } from "node:os";

const PAI_RUNTIME_HOME = process.env.PAI_RUNTIME_HOME || join(homedir(), ".pai");
const MEMORY_DIR = join(PAI_RUNTIME_HOME, "memory");
const ALLOWLIST_PATH = join(PAI_RUNTIME_HOME, "checkpoint-repos.txt");
const ARTIFACT_FILENAME = "ISA.md";
const LEGACY_ARTIFACT_FILENAME = "PRD.md";
const GIT_TIMEOUT_MS = 5000;

interface CheckpointState {
  committed_iscs: string[];
  last_commit_sha: Record<string, string>;
}

interface Criterion {
  id: string;
  description: string;
  status: "completed" | "pending";
}

function expandPath(p: string): string {
  let s = p.trim();
  if (!s) return s;
  if (s.startsWith("~/")) s = join(homedir(), s.slice(2));
  else if (s === "~") s = homedir();
  s = s.replace(/^\$HOME(\/|$)/, homedir() + "$1");
  return s;
}

function loadAllowlist(): string[] {
  if (!existsSync(ALLOWLIST_PATH)) return [];
  try {
    return readFileSync(ALLOWLIST_PATH, "utf-8")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("#"))
      .map(expandPath);
  } catch (err) {
    console.error("[pai-checkpoint-per-isc] failed to read allowlist:", err);
    return [];
  }
}

function loadState(stateFile: string): CheckpointState {
  if (!existsSync(stateFile))
    return { committed_iscs: [], last_commit_sha: {} };
  try {
    const parsed = JSON.parse(readFileSync(stateFile, "utf-8"));
    return {
      committed_iscs: Array.isArray(parsed.committed_iscs)
        ? parsed.committed_iscs
        : [],
      last_commit_sha:
        parsed.last_commit_sha && typeof parsed.last_commit_sha === "object"
          ? parsed.last_commit_sha
          : {},
    };
  } catch (err) {
    console.error(
      "[pai-checkpoint-per-isc] malformed state file, resetting:",
      err
    );
    return { committed_iscs: [], last_commit_sha: {} };
  }
}

function saveState(stateFile: string, state: CheckpointState): void {
  try {
    writeFileSync(stateFile, JSON.stringify(state, null, 2) + "\n", "utf-8");
  } catch (err) {
    console.error("[pai-checkpoint-per-isc] failed to write state:", err);
  }
}

function gitRun(repo: string, args: string[]): string {
  return execFileSync("git", ["-C", repo, ...args], {
    encoding: "utf-8",
    timeout: GIT_TIMEOUT_MS,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function isGitRepo(repo: string): boolean {
  try {
    gitRun(repo, ["rev-parse", "--git-dir"]);
    return true;
  } catch {
    return false;
  }
}

function hasStagedChanges(repo: string): boolean {
  try {
    return gitRun(repo, ["diff", "--cached", "--name-only"]).trim().length > 0;
  } catch {
    return false;
  }
}

function sanitizeMessage(s: string): string {
  return s.replace(/\s+/g, " ").replace(/[`$]/g, "").trim().slice(0, 200);
}

function commitInRepo(
  repo: string,
  iscId: string,
  slug: string,
  description: string,
  scopedPaths: string[]
): string | null {
  try {
    // Scoped add: only the ISA/PRD file and its checkpoint state file.
    // Avoids sweeping unrelated in-flight edits into ISC commits.
    const relPaths = scopedPaths
      .map((p) => relative(repo, p))
      .filter((p) => p.length > 0 && !p.startsWith(".."));
    if (relPaths.length === 0) return null;
    gitRun(repo, ["add", "--", ...relPaths]);
    if (!hasStagedChanges(repo)) return null;
    const subject = `${iscId} (${slug}): ${sanitizeMessage(description)}`;
    gitRun(repo, [
      "commit",
      "-m",
      subject,
      "--quiet",
      "--no-verify",
      "--no-gpg-sign",
    ]);
    return gitRun(repo, ["rev-parse", "HEAD"]).trim();
  } catch (err: unknown) {
    const e = err as { stderr?: { toString?: () => string }; message?: string };
    const detail = e?.stderr?.toString?.() || e?.message || String(err);
    console.error(
      `[pai-checkpoint-per-isc] commit failed in ${repo} for ${iscId}: ${detail}`
    );
    return null;
  }
}

// Inlined minimal ISA parsing (subset of upstream hooks/lib/isa-utils.ts)
const CRITERIA_HEADING_RE =
  /^(?:##\s+(?:ISC\s+)?Criteria\b[^\n]*|##\s+IDEAL\s+STATE\s+CRITERIA\b[^\n]*|###\s+Criteria\b[^\n]*)$/im;

function extractCriteriaSection(content: string): string | null {
  const headingMatch = CRITERIA_HEADING_RE.exec(content);
  if (!headingMatch || headingMatch.index === undefined) return null;
  const startOfBody = headingMatch.index + headingMatch[0].length;
  const rest = content.slice(startOfBody);
  const endMatch = rest.match(/\n##\s+(?!#)|\n---\s*\n/);
  return endMatch ? rest.slice(0, endMatch.index) : rest;
}

function parseCriteriaList(content: string): Criterion[] {
  const body = extractCriteriaSection(content);
  if (body === null) return [];
  const out: Criterion[] = [];
  for (const line of body.split("\n")) {
    if (!line.match(/^- \[[ x]\]/)) continue;
    const checked = line.startsWith("- [x]");
    let m = line.match(
      /^- \[[ x]\]\s*(ISC-[\w-]+)(?:\s+\[[A-Za-z]+\](?:\[\w+\])?)?:\s*(.*)/
    );
    if (!m) {
      const loose = line.match(/^- \[[ x]\]\s*(ISC-[\w-]+)\s+(.*)/);
      if (loose) {
        const rest = loose[2].replace(/\[[A-Za-z]+\]\s*/g, "").trim();
        if (rest.length > 0) m = [line, loose[1], rest] as RegExpMatchArray;
      }
    }
    if (!m) continue;
    out.push({
      id: m[1],
      description: m[2].trim(),
      status: checked ? "completed" : "pending",
    });
  }
  return out;
}

function hasFrontmatter(content: string): boolean {
  return /^---\n[\s\S]*?\n---/.test(content);
}

async function processArtifact(filePath: string): Promise<void> {
  if (!filePath.includes(`${MEMORY_DIR}/WORK/`)) return;
  const isISA =
    filePath.endsWith("/" + ARTIFACT_FILENAME) ||
    filePath.endsWith(ARTIFACT_FILENAME);
  const isLegacy =
    filePath.endsWith("/" + LEGACY_ARTIFACT_FILENAME) ||
    filePath.endsWith(LEGACY_ARTIFACT_FILENAME);
  if (!isISA && !isLegacy) return;
  if (!existsSync(filePath)) return;

  const slugDir = dirname(filePath);
  const slug = basename(slugDir);
  const stateFile = join(slugDir, ".checkpoint-state.json");

  const content = readFileSync(filePath, "utf-8");
  if (!hasFrontmatter(content)) return;
  const criteria = parseCriteriaList(content);
  if (criteria.length === 0) return;

  const state = loadState(stateFile);
  const alreadyCommitted = new Set(state.committed_iscs);
  const newlyChecked = criteria.filter(
    (c) => c.status === "completed" && !alreadyCommitted.has(c.id)
  );
  if (newlyChecked.length === 0) return;

  const allowlist = loadAllowlist();
  if (allowlist.length === 0) {
    console.error("[pai-checkpoint-per-isc] no repos configured, skipping");
    return;
  }

  for (const isc of newlyChecked) {
    for (const repo of allowlist) {
      if (!existsSync(repo)) {
        console.error(`[pai-checkpoint-per-isc] repo not found: ${repo}`);
        continue;
      }
      if (!isGitRepo(repo)) {
        console.error(`[pai-checkpoint-per-isc] not a git repo: ${repo}`);
        continue;
      }
      const sha = commitInRepo(repo, isc.id, slug, isc.description, [
        filePath,
        stateFile,
      ]);
      if (sha) state.last_commit_sha[repo] = sha;
    }
    state.committed_iscs.push(isc.id);
  }
  saveState(stateFile, state);
}

export const PaiCheckpointPerIsc: Plugin = async () => {
  return {
    "tool.execute.after": async (input, _output) => {
      try {
        const tool = input?.tool;
        if (tool !== "write" && tool !== "edit") return;
        // tool.execute.after exposes original tool args on input.args
        // (output carries the tool result: title/output/metadata).
        const args = (input as { args?: Record<string, unknown> })?.args;
        const fp =
          (typeof args?.filePath === "string" && args.filePath) ||
          (typeof args?.file_path === "string" && args.file_path) ||
          undefined;
        if (typeof fp === "string") await processArtifact(fp);
      } catch (err) {
        console.error("[pai-checkpoint-per-isc] uncaught:", err);
      }
    },
  };
};
