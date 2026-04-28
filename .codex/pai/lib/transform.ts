import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { dirname, extname, join, relative, sep } from "path";

export interface FrontmatterDocument {
  data: Record<string, string>;
  body: string;
}

export interface InventoryItem {
  id: string;
  kind: string;
  action: "port" | "adapt" | "gate" | "skip";
  sourceRef: string;
  sourceHash: string;
  target?: string;
  installedPath?: string;
  reason: string;
  dependencies?: string[];
}

interface SanitizeOptions {
  stripAgentControlBlocks?: boolean;
}

const exactBlockedParts = [
  ["local", "host:", "8888"],
  ["Voice", "Server"],
  ["Eleven", "Labs"],
  ["notify", "-send"],
  ["osa", "script"],
  ["Kit", "ty"],
  ["tab", " title"],
  ["Voice", "Completion"],
  ["Update", "Tab", "Title"],
  ["Response", "Tab", "Reset"],
  ["Set", "Question", "Tab"],
  ["Question", "Answered"],
  ["nt", "fy"],
  ["voice", " notification"],
];

export const prohibitedRuntimeTerms = exactBlockedParts.map((parts) => parts.join(""));

const disruptiveLineNeedles = [
  "curl -",
  "http://",
  "voice",
  "speaker",
  "notify",
  "notification",
  "pronunciation",
  "menubar",
  "terminal title",
  "statusline",
  "mandatory output format",
  "mandatory startup",
  "before every response",
  "must send",
  "completed line",
];

export function toAscii(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2192/g, "->")
    .replace(/\u2022/g, "-")
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, "");
}

export function slugify(input: string): string {
  const slug = toAscii(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  return slug || "item";
}

export function sourceHash(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let hash = 2166136261;
  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function parseFrontmatter(content: string): FrontmatterDocument {
  const normalized = content.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) return { data: {}, body: normalized };
  const end = normalized.indexOf("\n---\n", 4);
  if (end === -1) return { data: {}, body: normalized };
  const raw = normalized.slice(4, end);
  const data: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    const value = match[2].trim();
    if (!value || value === "|" || value === ">") continue;
    data[match[1]] = value.replace(/^["']|["']$/g, "");
  }
  return { data, body: normalized.slice(end + 5) };
}

export function frontmatter(data: Record<string, string>, body: string): string {
  const lines = ["---"];
  for (const [key, value] of Object.entries(data)) {
    lines.push(`${key}: ${quoteYaml(value)}`);
  }
  lines.push("---", "", body.trim(), "");
  return lines.join("\n");
}

function quoteYaml(value: string): string {
  return JSON.stringify(toAscii(value).replace(/\n/g, " "));
}

function hasExactBlockedTerm(input: string): boolean {
  return prohibitedRuntimeTerms.some((term) => input.includes(term));
}

function isDisruptiveLine(line: string): boolean {
  const lower = line.toLowerCase();
  if (hasExactBlockedTerm(line)) return true;
  return disruptiveLineNeedles.some((needle) => lower.includes(needle));
}

function shouldSkipSectionHeading(line: string): number | null {
  const match = line.match(/^(#{1,6})\s+(.*)$/);
  if (!match) return null;
  const text = match[2].toLowerCase();
  if (
    text.includes("mandatory") ||
    text.includes("mandatory startup") ||
    text.includes("mandatory output") ||
    text.includes("notification") ||
    text.includes("voice") ||
    text.includes("character") ||
    text.includes("backstory") ||
    text.includes("life events")
  ) {
    return match[1].length;
  }
  return null;
}

function stripAgentControlBlocks(input: string): string {
  const output: string[] = [];
  let skipping = false;

  for (const line of input.split(/\r?\n/)) {
    const lower = line.toLowerCase();
    const startsControlBlock =
      /^#{1,6}\s+.*startup sequence/.test(lower) ||
      /^#{1,6}\s+.*output format/.test(lower) ||
      lower.includes("use the pai format for all responses");

    if (startsControlBlock) {
      skipping = true;
      continue;
    }

    if (skipping) {
      if (line.trim() === "---") skipping = false;
      continue;
    }

    output.push(line);
  }

  return output.join("\n");
}

export function rewriteCodexReferences(input: string): string {
  return input
    .replace(/~\/\.claude/g, ".codex/pai")
    .replace(/\$\{?PAI_DIR\}?/g, "CODEX_PAI_ROOT")
    .replace(/\bCLAUDE\.md\b/g, "AGENTS.md")
    .replace(/\bClaude Code\b/g, "Codex")
    .replace(/\bClaude\b/g, "Codex")
    .replace(/\bTask tool\b/g, "Codex subagent tools")
    .replace(/\bTask\b/g, "spawn_agent")
    .replace(/\bAskUserQuestion\b/g, "ask the user directly")
    .replace(/\bWebFetch\b/g, "web access")
    .replace(/\bWebSearch\b/g, "web search")
    .replace(/\bMUST\b/g, "should")
    .replace(/\bALWAYS\b/g, "usually")
    .replace(/\bNEVER\b/g, "avoid")
    .replace(/\bMANDATORY\b/g, "important")
    .replace(/\bNO EXCEPTIONS\b/gi, "when appropriate")
    .replace(/\bNON-NEGOTIABLE\b/gi, "not required in the Codex port");
}

export function sanitizeGeneratedText(input: string, options: SanitizeOptions = {}): string {
  const rewritten = rewriteCodexReferences(input);
  const ascii = toAscii(options.stripAgentControlBlocks ? stripAgentControlBlocks(rewritten) : rewritten);
  const output: string[] = [];
  let skipLevel: number | null = null;

  for (const line of ascii.split(/\r?\n/)) {
    const heading = line.match(/^(#{1,6})\s+/);
    if (skipLevel !== null && heading && heading[1].length <= skipLevel) {
      skipLevel = null;
    }

    const newSkipLevel = shouldSkipSectionHeading(line);
    if (newSkipLevel !== null) {
      skipLevel = newSkipLevel;
      continue;
    }
    if (skipLevel !== null) continue;
    if (isDisruptiveLine(line)) continue;
    output.push(line);
  }

  return output
    .join("\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .replace(/[ \t]+$/gm, "")
    .trim();
}

export function safeAssetRef(path: string): string {
  let out = toAscii(path.split(sep).join("/"));
  for (const term of prohibitedRuntimeTerms) {
    out = out.split(term).join(`[excluded:${sourceHash(term)}]`);
  }
  return out;
}

export function walkFiles(root: string, predicate: (path: string) => boolean = () => true): string[] {
  if (!existsSync(root)) return [];
  const entries: string[] = [];
  for (const name of readdirSync(root)) {
    const path = join(root, name);
    const stats = statSync(path);
    if (stats.isDirectory()) {
      entries.push(...walkFiles(path, predicate));
    } else if (predicate(path)) {
      entries.push(path);
    }
  }
  return entries;
}

export function ensureDir(path: string): void {
  mkdirSync(path, { recursive: true });
}

export function writeText(path: string, content: string): void {
  ensureDir(dirname(path));
  writeFileSync(path, `${content.replace(/\s+$/g, "")}\n`);
}

export function copySanitizedTree(sourceDir: string, targetDir: string, excludeNames = new Set<string>()): void {
  if (!existsSync(sourceDir)) return;
  for (const path of walkFiles(sourceDir)) {
    const rel = relative(sourceDir, path);
    if (rel.split(sep).some((part) => excludeNames.has(part))) continue;
    const target = join(targetDir, rel);
    ensureDir(dirname(target));
    if (isTextFile(path)) {
      writeText(target, sanitizeGeneratedText(readFileSync(path, "utf8")));
    } else {
      copyFileSync(path, target);
    }
  }
}

export function isTextFile(path: string): boolean {
  if (extname(path) === "") return true;
  const textExtensions = new Set([
    ".css",
    ".example",
    ".hbs",
    ".html",
    ".lock",
    ".md",
    ".mjs",
    ".txt",
    ".json",
    ".jsonl",
    ".svg",
    ".template",
    ".yaml",
    ".yml",
    ".ts",
    ".tsx",
    ".js",
    ".py",
    ".sh",
    ".toml",
    ".csv",
  ]);
  return textExtensions.has(extname(path).toLowerCase());
}

export function dependencyNotes(text: string, relPath: string): string[] {
  const lower = `${text}\n${relPath}`.toLowerCase();
  const deps = new Set<string>();
  if (lower.includes("fabric")) deps.add("Fabric CLI and patterns");
  if (lower.includes("apify")) deps.add("Apify account, token, and MCP or CLI access");
  if (lower.includes("brightdata") || lower.includes("bright data")) deps.add("Bright Data account and MCP access");
  if (lower.includes("browser") || lower.includes("playwright")) deps.add("Browser automation runtime");
  if (lower.includes("perplexity")) deps.add("Perplexity API access");
  if (lower.includes("gemini")) deps.add("Gemini CLI or API access");
  if (lower.includes("grok")) deps.add("Grok API access");
  if (lower.includes("cloudflare")) deps.add("Cloudflare API credentials");
  if (lower.includes("sec ") || lower.includes("edgar")) deps.add("SEC/EDGAR data access");
  if (lower.includes("audio") || lower.includes("transcribe") || lower.includes("media")) deps.add("External media processing tools");
  return [...deps].sort();
}

export function classifyFromText(kind: string, relPath: string, content = ""): InventoryItem["action"] {
  const lower = `${relPath}\n${content}`.toLowerCase();
  if (hasExactBlockedTerm(relPath) || hasExactBlockedTerm(content)) return "skip";
  if (kind === "hook") {
    if (/(securityvalidator|loadcontext|ratingcapture|prdsync|docintegrity|integritycheck)/i.test(relPath)) return "adapt";
    return "skip";
  }
  if (
    lower.includes("audio") ||
    lower.includes("media") ||
    lower.includes("transcribe") ||
    lower.includes("removebg") ||
    lower.includes("addbg") ||
    lower.includes("apify") ||
    lower.includes("brightdata") ||
    lower.includes("perplexity") ||
    lower.includes("gemini") ||
    lower.includes("grok") ||
    lower.includes("cloudflare")
  ) {
    return "gate";
  }
  return kind === "skill" || kind === "agent" ? "adapt" : "port";
}

export function assertNoProhibitedTerms(paths: string[]): string[] {
  const findings: string[] = [];
  for (const path of paths) {
    if (!existsSync(path)) continue;
    const files = statSync(path).isDirectory() ? walkFiles(path, isTextFile) : [path];
    for (const file of files) {
      if (isPaiRuntimeDataPath(file)) continue;
      const content = readFileSync(file, "utf8");
      for (const term of prohibitedRuntimeTerms) {
        if (content.includes(term)) findings.push(`${file}: ${term}`);
      }
    }
  }
  return findings;
}

function isPaiRuntimeDataPath(path: string): boolean {
  const normalized = path.split(sep).join("/");
  return [".codex/pai/MEMORY", ".codex/pai/USER"].some(
    (runtimeRoot) =>
      normalized === runtimeRoot ||
      normalized.startsWith(`${runtimeRoot}/`) ||
      normalized.endsWith(`/${runtimeRoot}`) ||
      normalized.includes(`/${runtimeRoot}/`),
  );
}
