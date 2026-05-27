/**
 * Cross-Agent — Load commands, skills, and agents from Claude Code setup
 *
 * Scans .claude/ directories (project + global) for:
 *   nested command markdown files -> registered as /name or /namespace:name
 *   skills/           → exposed to Pi skills and listed as /skill:name
 *   agents/*.md       → registered as /agent:name
 * Also injects Claude guidance from ~/.claude/CLAUDE.md, then project CLAUDE.md files.
 *
 * Usage: pi -e extensions/cross-agent.ts
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import {
  readdirSync,
  readFileSync,
  existsSync,
  statSync,
  realpathSync,
} from "node:fs";
import { join, basename, dirname, isAbsolute, relative, resolve } from "node:path";
import { homedir } from "node:os";

const MAX_CLAUDE_IMPORT_DEPTH = 5;

interface Discovered {
  name: string;
  description: string;
  content: string;
}

interface SourceGroup {
  source: string;
  commands: Discovered[];
  skills: Discovered[];
  agents: Discovered[];
}

interface SourceDir {
  label: string;
  dir: string;
}

interface GuidanceImport {
  spec: string;
  path: string;
  status:
    | "loaded"
    | "missing"
    | "not-file"
    | "cycle"
    | "max-depth"
    | "read-error";
  chars: number;
}

interface GuidanceFile {
  label: string;
  path: string;
  realPath: string;
  content: string;
  imports: GuidanceImport[];
}

interface ScanWarning {
  area: string;
  path: string;
  message: string;
}

function realPathIfExists(dir: string): string | null {
  try {
    return realpathSync(dir);
  } catch {
    return null;
  }
}

function isFile(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function isDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function collectClaudeDirs(home: string, cwd: string): SourceDir[] {
  const projectDir = join(findProjectRoot(cwd), ".claude");
  const homeDir = join(home, ".claude");
  const projectReal = realPathIfExists(projectDir);
  const homeReal = realPathIfExists(homeDir);
  const projectLabel = relative(cwd, projectDir) || ".claude";
  const candidates: SourceDir[] =
    projectReal && projectReal === homeReal
      ? [{ dir: homeDir, label: "~/.claude" }]
      : [
          { dir: projectDir, label: projectLabel },
          { dir: homeDir, label: "~/.claude" },
        ];
  const seen = new Set<string>();
  const dirs: SourceDir[] = [];

  for (const candidate of candidates) {
    const real = realPathIfExists(candidate.dir);
    if (real) {
      if (seen.has(real)) continue;
      seen.add(real);
    }
    dirs.push(candidate);
  }

  return dirs;
}

function collectClaudeSkillPaths(home: string, cwd: string): string[] {
  const seen = new Set<string>();
  const paths: string[] = [];

  for (const source of collectClaudeDirs(home, cwd)) {
    const skillsDir = join(source.dir, "skills");
    const real = realPathIfExists(skillsDir);
    if (!real || seen.has(real) || !isDirectory(skillsDir)) continue;
    seen.add(real);
    paths.push(skillsDir);
  }

  return paths;
}

function findProjectRoot(cwd: string): string {
  let current = resolve(cwd);

  while (true) {
    if (existsSync(join(current, ".git"))) return current;
    const parent = dirname(current);
    if (parent === current) return resolve(cwd);
    current = parent;
  }
}

function projectGuidancePaths(cwd: string): string[] {
  const root = findProjectRoot(cwd);
  const paths: string[] = [];
  let current = resolve(cwd);

  while (true) {
    paths.push(join(current, "CLAUDE.md"));
    if (current === root) break;
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }

  return paths.reverse();
}

function guidanceLabel(path: string, cwd: string): string {
  const rel = relative(cwd, path);
  return rel.startsWith("..") ? rel : `./${rel}`;
}

function resolveImportPath(spec: string, baseDir: string, home: string): string {
  if (spec === "~") return home;
  if (spec.startsWith("~/")) return join(home, spec.slice(2));
  if (isAbsolute(spec)) return spec;
  return resolve(baseDir, spec);
}

function splitImportSpec(raw: string): { spec: string; suffix: string } {
  const spec = raw.replace(/[),.;:]+$/g, "");
  return { spec, suffix: raw.slice(spec.length) };
}

function shouldTreatAsInlineImport(spec: string): boolean {
  return (
    spec.startsWith("./") ||
    spec.startsWith("../") ||
    spec.startsWith("~/") ||
    spec.startsWith("/") ||
    /\.(md|txt|json|ya?ml)$/i.test(spec)
  );
}

function expandClaudeImport(
  spec: string,
  baseDir: string,
  home: string,
  depth: number,
  stack: Set<string>,
  imports: GuidanceImport[],
  indent = "",
): string {
  const path = resolveImportPath(spec, baseDir, home);
  const real = realPathIfExists(path);

  if (depth >= MAX_CLAUDE_IMPORT_DEPTH) {
    imports.push({ spec, path, status: "max-depth", chars: 0 });
    return `${indent}[Claude import skipped: ${spec} (max depth)]`;
  }
  if (!real) {
    imports.push({ spec, path, status: "missing", chars: 0 });
    return `${indent}[Claude import skipped: ${spec} (missing)]`;
  }
  if (stack.has(real)) {
    imports.push({ spec, path, status: "cycle", chars: 0 });
    return `${indent}[Claude import skipped: ${spec} (cycle)]`;
  }
  if (!isFile(path)) {
    imports.push({ spec, path, status: "not-file", chars: 0 });
    return `${indent}[Claude import skipped: ${spec} (not file)]`;
  }

  let imported: string;
  try {
    imported = readFileSync(path, "utf-8");
  } catch {
    imports.push({ spec, path, status: "read-error", chars: 0 });
    return `${indent}[Claude import skipped: ${spec} (read error)]`;
  }

  imports.push({ spec, path, status: "loaded", chars: imported.length });
  stack.add(real);
  const resolved = resolveClaudeImports(
    imported,
    dirname(path),
    home,
    depth + 1,
    stack,
    imports,
  );
  stack.delete(real);

  return resolved
    .trimEnd()
    .split("\n")
    .map((line) => `${indent}${line}`)
    .join("\n");
}

function resolveClaudeImports(
  raw: string,
  baseDir: string,
  home: string,
  depth: number,
  stack: Set<string>,
  imports: GuidanceImport[],
): string {
  return raw
    .split("\n")
    .map((line) => {
      const wholeLine = line.match(/^([ \t]*)@(?:"([^"]+)"|'([^']+)'|(\S+))[ \t]*$/);
      if (wholeLine) {
        const spec = wholeLine[2] || wholeLine[3] || wholeLine[4];
        if (!wholeLine[2] && !wholeLine[3] && !shouldTreatAsInlineImport(spec)) {
          return line;
        }
        return expandClaudeImport(
          spec,
          baseDir,
          home,
          depth,
          stack,
          imports,
          wholeLine[1],
        );
      }

      return line.replace(
        /(^|[\s([{])@(?:"([^"]+)"|'([^']+)'|(\S+))/g,
        (match, lead, doubleQuoted, singleQuoted, unquoted) => {
          if (doubleQuoted || singleQuoted) {
            const spec = doubleQuoted || singleQuoted;
            return (
              lead + expandClaudeImport(spec, baseDir, home, depth, stack, imports)
            );
          }

          const { spec, suffix } = splitImportSpec(unquoted);
          if (!shouldTreatAsInlineImport(spec)) return match;
          return (
            lead +
            expandClaudeImport(spec, baseDir, home, depth, stack, imports) +
            suffix
          );
        },
      );
    })
    .join("\n");
}

function readGuidanceFile(
  label: string,
  path: string,
  home: string,
): GuidanceFile | null {
  try {
    const realPath = realPathIfExists(path);
    if (!realPath || !isFile(path)) return null;

    const imports: GuidanceImport[] = [];
    const stack = new Set<string>([realPath]);
    const content = resolveClaudeImports(
      readFileSync(path, "utf-8"),
      dirname(path),
      home,
      0,
      stack,
      imports,
    ).trim();

    return { label, path, realPath, content, imports };
  } catch {
    return null;
  }
}

function loadClaudeGuidance(home: string, cwd: string): GuidanceFile[] {
  const seen = new Set<string>();
  const files: GuidanceFile[] = [];

  const candidates: Array<[string, string]> = [
    ["~/.claude/CLAUDE.md", join(home, ".claude", "CLAUDE.md")],
    ...projectGuidancePaths(cwd).map((path) => [guidanceLabel(path, cwd), path] as [string, string]),
  ];

  for (const [label, path] of candidates) {
    const real = realPathIfExists(path);
    if (!real || seen.has(real)) continue;
    seen.add(real);

    const file = readGuidanceFile(label, path, home);
    if (file && file.content) files.push(file);
  }

  return files;
}

function formatClaudeGuidance(files: GuidanceFile[]): string {
  return files
    .map((file) => `### ${file.label}\n\n${file.content}`)
    .join("\n\n");
}

function parseFrontmatter(raw: string): {
  description: string;
  body: string;
  fields: Record<string, string>;
} {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) return { description: "", body: raw, fields: {} };

  const front = match[1];
  const body = match[2];
  const fields: Record<string, string> = {};
  for (const line of front.split("\n")) {
    const idx = line.indexOf(":");
    if (idx > 0) fields[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return { description: fields.description || "", body, fields };
}

function expandArgs(template: string, args: string): string {
  const parts = args.split(/\s+/).filter(Boolean);
  let result = template;
  result = result.replace(/\$ARGUMENTS|\$@/g, args);
  for (let i = 0; i < parts.length; i++) {
    result = result.replaceAll(`$${i + 1}`, parts[i]);
  }
  return result;
}

function firstContentLine(body: string): string {
  return body
    .split("\n")
    .find((l) => l.trim())
    ?.trim() || "";
}

function scanCommands(
  dir: string,
  prefix = "",
  warnings?: ScanWarning[],
): Discovered[] {
  if (!existsSync(dir)) return [];
  const items: Discovered[] = [];
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        items.push(
          ...scanCommands(
            path,
            prefix ? `${prefix}:${entry.name}` : entry.name,
            warnings,
          ),
        );
        continue;
      }
      if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
      const raw = readFileSync(path, "utf-8");
      const { description, body } = parseFrontmatter(raw);
      const name = basename(entry.name, ".md");
      items.push({
        name: prefix ? `${prefix}:${name}` : name,
        description: description || firstContentLine(body),
        content: body,
      });
    }
  } catch (error) {
    warnings?.push({
      area: "commands",
      path: dir,
      message: error instanceof Error ? error.message : String(error),
    });
  }
  return items;
}

function scanSkills(
  dir: string,
  warnings?: ScanWarning[],
  allowFlatFiles = true,
): Discovered[] {
  if (!existsSync(dir)) return [];
  const items: Discovered[] = [];
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      const skillFile = join(path, "SKILL.md");
      if (entry.isDirectory() && existsSync(skillFile) && isFile(skillFile)) {
        const raw = readFileSync(skillFile, "utf-8");
        const { body, fields } = parseFrontmatter(raw);
        if (!fields.description?.trim()) {
          warnings?.push({
            area: "skills",
            path: skillFile,
            message: "skipped skill without frontmatter description",
          });
          continue;
        }
        items.push({
          name: fields.name || entry.name,
          description: fields.description,
          content: raw,
        });
      } else if (entry.isDirectory()) {
        items.push(...scanSkills(path, warnings, false));
      } else if (allowFlatFiles && entry.isFile() && entry.name.endsWith(".md")) {
        const raw = readFileSync(path, "utf-8");
        const { fields } = parseFrontmatter(raw);
        if (!fields.description?.trim()) {
          warnings?.push({
            area: "skills",
            path,
            message: "skipped skill without frontmatter description",
          });
          continue;
        }
        items.push({
          name: fields.name || basename(dir),
          description: fields.description,
          content: raw,
        });
      }
    }
  } catch (error) {
    warnings?.push({
      area: "skills",
      path: dir,
      message: error instanceof Error ? error.message : String(error),
    });
  }
  return items;
}

function scanAgents(dir: string, warnings?: ScanWarning[]): Discovered[] {
  if (!existsSync(dir)) return [];
  const items: Discovered[] = [];
  try {
    for (const file of readdirSync(dir)) {
      if (!file.endsWith(".md")) continue;
      const raw = readFileSync(join(dir, file), "utf-8");
      const { fields } = parseFrontmatter(raw);
      items.push({
        name: fields.name || basename(file, ".md"),
        description: fields.description || "",
        content: raw,
      });
    }
  } catch (error) {
    warnings?.push({
      area: "agents",
      path: dir,
      message: error instanceof Error ? error.message : String(error),
    });
  }
  return items;
}

function scanDirOnce<T>(
  dir: string,
  seen: Set<string>,
  scan: (dir: string) => T[],
): T[] {
  const real = realPathIfExists(dir);
  if (real) {
    if (seen.has(real)) return [];
    seen.add(real);
  }
  return scan(dir);
}

function formatSourceReport(
  home: string,
  cwd: string,
  groups: SourceGroup[],
  warnings: ScanWarning[],
): string {
  const guidance = loadClaudeGuidance(home, cwd);
  const skillPaths = collectClaudeSkillPaths(home, cwd);
  const lines: string[] = ["Claude sources loaded by cross-agent:", ""];

  lines.push("Guidance:");
  if (guidance.length === 0) {
    lines.push("- none");
  } else {
    for (const file of guidance) {
      lines.push(`- ${file.label} (${file.content.length} chars)`);
      for (const imp of file.imports) {
        const suffix = imp.status === "loaded" ? `${imp.chars} chars` : imp.status;
        lines.push(`  import @${imp.spec}: ${suffix}`);
      }
    }
  }

  lines.push("", "Skills:");
  if (skillPaths.length === 0) {
    lines.push("- none");
  } else {
    for (const path of skillPaths) lines.push(`- ${path}`);
  }

  lines.push("", "Commands and agents:");
  if (groups.length === 0) {
    lines.push("- none");
  } else {
    for (const g of groups) {
      lines.push(
        `- ${g.source}: ${g.commands.length} commands, ${g.skills.length} skills, ${g.agents.length} agents`,
      );
    }
  }

  lines.push("", "Warnings:");
  if (warnings.length === 0) {
    lines.push("- none");
  } else {
    for (const warning of warnings) {
      lines.push(
        `- ${warning.area}: ${warning.path}: ${warning.message}`,
      );
    }
  }

  return lines.join("\n");
}

export default function (pi: ExtensionAPI) {
  // ── Scan + register at init time (top-level, synchronous) ────────────────
  //
  // registerCommand() must be called synchronously during extension load —
  // the same rule that applies to registerTool() and registerShortcut().
  // Use process.cwd() here for commands visible at startup. Per-turn guidance
  // and resource discovery use ctx.cwd/event.cwd so they follow session cwd.
  //
  const home = homedir();
  const cwd = process.cwd();
  const projectRoot = findProjectRoot(cwd);
  const groups: SourceGroup[] = [];
  const scanWarnings: ScanWarning[] = [];
  const seenCommandDirs = new Set<string>();
  const seenSkillDirs = new Set<string>();
  const seenAgentDirs = new Set<string>();

  for (const source of collectClaudeDirs(home, cwd)) {
    const commands = scanDirOnce(
      join(source.dir, "commands"),
      seenCommandDirs,
      (dir) => scanCommands(dir, "", scanWarnings),
    );
    const skills = scanDirOnce(
      join(source.dir, "skills"),
      seenSkillDirs,
      (dir) => scanSkills(dir, scanWarnings),
    );
    const agents = scanDirOnce(
      join(source.dir, "agents"),
      seenAgentDirs,
      (dir) => scanAgents(dir, scanWarnings),
    );

    if (commands.length || skills.length || agents.length) {
      groups.push({ source: source.label, commands, skills, agents });
    }
  }

  // Also scan .pi/agents/ (pi-vs-cc pattern)
  const localAgents = scanAgents(join(projectRoot, ".pi", "agents"), scanWarnings);
  if (localAgents.length) {
    groups.push({
      source: ".pi/agents",
      commands: [],
      skills: [],
      agents: localAgents,
    });
  }

  pi.on("resources_discover", (event) => ({
    skillPaths: collectClaudeSkillPaths(home, event.cwd),
  }));

  // Register commands + agent bridges once — never re-registered on /new
  const seenCmds = new Set<string>();
  pi.registerCommand("claude-sources", {
    description: "Show Claude files loaded by cross-agent",
    handler: async (_args, ctx) => {
      ctx.ui.notify(formatSourceReport(home, ctx.cwd, groups, scanWarnings), "info");
    },
  });
  seenCmds.add("claude-sources");

  for (const g of groups) {
    for (const cmd of g.commands) {
      if (seenCmds.has(cmd.name)) continue;
      seenCmds.add(cmd.name);
      pi.registerCommand(cmd.name, {
        description: `[${g.source}] ${cmd.description}`.slice(0, 120),
        handler: async (args) => {
          pi.sendUserMessage(expandArgs(cmd.content, args || ""));
        },
      });
    }
    for (const agent of g.agents) {
      const cmdName = `agent:${agent.name}`;
      if (seenCmds.has(cmdName)) continue;
      seenCmds.add(cmdName);
      pi.registerCommand(cmdName, {
        description: `[${g.source}] ${agent.description || "Load Claude agent"}`.slice(0, 120),
        handler: async (args) => {
          const task = args?.trim();
          pi.sendUserMessage(
            task ? `${agent.content}\n\nTask: ${task}` : agent.content,
          );
        },
      });
    }
  }

  // ── Claude guidance injection (global first, then project) ───────────────

  pi.on("before_agent_start", async (event, ctx) => {
    const guidance = loadClaudeGuidance(home, ctx.cwd);
    if (guidance.length === 0) return;

    return {
      systemPrompt: `${event.systemPrompt}\n\n## Claude Guidance\n\n${formatClaudeGuidance(guidance)}`,
    };
  });

}
