/**
 * pai-containment-guard — block edits/writes that exfiltrate identity-tagged
 * content out of containment zones, via tool.execute.before.
 *
 * Adapted from upstream PAI v6.3.0 hooks/ContainmentGuard.hook.ts +
 * lib/containment-zones.ts. OpenCode trigger: `tool.execute.before` filtered
 * to write/edit operations.
 *
 * Two checks per write:
 *   1. New content scanned for any IDENTITY_PATTERN. If a pattern hits, the
 *      destination file MUST live inside a containment zone, or the write is
 *      denied (returns abort=true).
 *   2. PATTERN_ALLOWLIST: certain authoring files (this plugin source, READMEs,
 *      identity templates) are allowed to embed patterns regardless of zone.
 *
 * IDENTITY_PATTERNS source: ~/.claude/PAI/USER/containment-patterns.txt
 *   - one regex per line, blank lines and `#` comments ignored
 *   - file is OPTIONAL; if absent or empty, this plugin is a no-op
 *
 * James-specific: upstream ships hardcoded Daniel-isms (/Users/daniel, CF
 * account IDs, etc.). Those are stripped. Pattern list is user-supplied.
 *
 * Fails closed: regex compile errors logged + skipped; never blocks valid
 * edits because of a bad pattern. Read paths are NEVER blocked.
 */

import type { Plugin } from "@opencode-ai/plugin";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, sep } from "node:path";
import { homedir } from "node:os";

const CLAUDE_ROOT = join(homedir(), ".claude");
const PATTERNS_FILE = join(CLAUDE_ROOT, "PAI", "USER", "containment-patterns.txt");

// Containment zones (paths under ~/.claude). Adapted from upstream
// lib/containment-zones.ts. Components are matched against path segments.
interface Zone {
  id: string;
  components: string[];
}

const ZONES: Zone[] = [
  { id: "user-data", components: ["PAI", "USER"] },
  { id: "runtime-memory", components: ["PAI", "MEMORY"] },
  { id: "memory-local", components: ["MEMORY"] },
  { id: "config-secrets-claude", components: ["settings.local.json"] },
];

// Files allowed to embed patterns even outside containment zones (authoring,
// docs, identity templates, this plugin's own source).
const PATTERN_ALLOWLIST_FILES = new Set<string>([
  "containment-patterns.txt",
  "PRINCIPAL_IDENTITY.md",
  "DA_IDENTITY.md",
  "ABOUTME.md",
  "AISTEERINGRULES.md",
  "README.md",
  "index.ts", // this plugin
]);

function relativeToClaudeRoot(absPath: string): string | null {
  if (!absPath.startsWith(CLAUDE_ROOT + sep) && absPath !== CLAUDE_ROOT)
    return null;
  return absPath.slice(CLAUDE_ROOT.length + 1);
}

function isContained(absPath: string): boolean {
  const rel = relativeToClaudeRoot(absPath);
  if (rel === null) return false;
  const parts = rel.split(sep).filter(Boolean);
  for (const zone of ZONES) {
    if (parts.length < zone.components.length) continue;
    let ok = true;
    for (let i = 0; i < zone.components.length; i++) {
      if (parts[i] !== zone.components[i]) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

/**
 * Allowlist is ZONE-SCOPED: a basename match alone is not enough. The
 * destination must also live inside a containment zone (or be ~/.claude/AGENTS.md
 * — the only exception). Otherwise writing identity content to e.g.
 * `/tmp/README.md` would silently bypass the guard.
 */
function isPatternAllowlisted(absPath: string): boolean {
  const base = absPath.slice(absPath.lastIndexOf(sep) + 1);
  if (!PATTERN_ALLOWLIST_FILES.has(base)) return false;
  return isContained(absPath);
}

let cachedPatterns: { patterns: RegExp[]; mtimeMs: number } | null = null;

function loadPatterns(): RegExp[] {
  if (!existsSync(PATTERNS_FILE)) return [];
  try {
    const stat = statSync(PATTERNS_FILE);
    if (cachedPatterns && cachedPatterns.mtimeMs === stat.mtimeMs)
      return cachedPatterns.patterns;
    const lines = readFileSync(PATTERNS_FILE, "utf-8")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("#"));
    const patterns: RegExp[] = [];
    for (const line of lines) {
      try {
        patterns.push(new RegExp(line));
      } catch (err) {
        console.error(
          `[pai-containment-guard] bad regex skipped (${line}):`,
          err
        );
      }
    }
    cachedPatterns = { patterns, mtimeMs: stat.mtimeMs };
    return patterns;
  } catch (err) {
    console.error("[pai-containment-guard] failed to read patterns:", err);
    return [];
  }
}

/**
 * Deny mechanism. The OpenCode plugin API for `tool.execute.before` only
 * exposes `output.args` (mutable in-flight call args) and `void` return —
 * there is no documented abort field. Throwing from the hook propagates the
 * Error up to OpenCode's tool-runner; in practice this surfaces the violation
 * loudly in session logs and aborts the in-flight tool call. If a future
 * OpenCode release ships a formal abort field, swap this to that mechanism.
 */
class ContainmentViolation extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = "ContainmentViolation";
  }
}

export const PaiContainmentGuard: Plugin = async () => {
  return {
    "tool.execute.before": async (input, output) => {
      const tool = input?.tool;
      if (tool !== "write" && tool !== "edit") return;

      // tool.execute.before exposes the in-flight call args on output.args
      // (input is metadata: tool, sessionID, callID). Reading from input.args
      // here is a silent no-op — verified against
      // @opencode-ai/plugin/dist/index.d.ts:231-237 and the real-world
      // @mcmunder/opencode-git-memory plugin which uses output.args here too.
      let args: Record<string, unknown>;
      try {
        args = (output as { args?: Record<string, unknown> })?.args || {};
      } catch (err) {
        console.error("[pai-containment-guard] arg-read failed:", err);
        return;
      }

      const fp =
        (args.filePath as string | undefined) ||
        (args.file_path as string | undefined);
      if (typeof fp !== "string" || !fp.startsWith("/")) return;

      const newContent =
        (args.content as string | undefined) ||
        (args.newString as string | undefined) ||
        (args.new_string as string | undefined) ||
        "";
      if (!newContent) return;

      let patterns: RegExp[];
      try {
        patterns = loadPatterns();
      } catch (err) {
        console.error("[pai-containment-guard] pattern-load failed:", err);
        return;
      }
      if (patterns.length === 0) return;

      let matched: RegExp | undefined;
      try {
        matched = patterns.find((p) => p.test(newContent));
      } catch (err) {
        console.error("[pai-containment-guard] pattern-test failed:", err);
        return;
      }
      if (!matched) return;

      if (isPatternAllowlisted(fp)) return;
      if (isContained(fp)) return;

      // Violation: identity-tagged content destined outside containment.
      throw new ContainmentViolation(
        `pai-containment-guard: write to ${fp} blocked — content matches identity pattern ${matched.source} but destination is not inside a containment zone (PAI/USER, PAI/MEMORY, MEMORY, settings.local.json).`
      );
    },
  };
};
