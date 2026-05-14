import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { buildRuntimePaths } from "./runtime-paths";

export type WikiSource = {
  source_id: string;
  local_path: string;
  tier: number;
  description: string;
};

export type WikiPlan = {
  source: WikiSource;
  wiki_root: string;
  targets: WikiTarget[];
};

export type WikiTarget = {
  path: string;
  kind: "source-note" | "index" | "log" | "overview" | "lint";
  action: "create" | "update";
};

export type WikiIngestResult = {
  dry_run: boolean;
  source: WikiSource;
  wiki_root: string;
  created: string[];
  updated: string[];
  planned: WikiTarget[];
};

export type WikiValidationIssue = {
  path: string;
  severity: "error" | "warning";
  message: string;
};

export type WikiValidationResult = {
  wiki_root: string;
  ok: boolean;
  issues: WikiValidationIssue[];
};

export type WikiBootstrapPlan = {
  dry_run: true;
  source_count: number;
  sources: WikiSource[];
};

export type WikiOptions = {
  dotfilesPaiDir?: string;
  runtimeHome?: string;
};

export type WikiReadResult = {
  wiki_root: string;
  page_path: string;
  relative_path: string;
  title: string;
  type: string;
  aliases: string[];
  content: string;
};

export type WikiReadError = {
  wiki_root: string;
  query: string;
  error: "not-found" | "outside-wiki";
  message: string;
  close_matches: WikiPageSummary[];
};

export type WikiPageSummary = {
  relative_path: string;
  title: string;
  type: string;
  aliases: string[];
};

export type WikiSearchHit = {
  relative_path: string;
  title: string;
  type: string;
  confidence: number;
  matches: WikiSearchMatch[];
};

export type WikiSearchMatch = {
  field: "title" | "alias" | "summary" | "heading" | "key-claim";
  snippet: string;
};

export type WikiSearchResult = {
  wiki_root: string;
  query: string;
  hit_count: number;
  hits: WikiSearchHit[];
};

type WikiPageIndexEntry = {
  absolute_path: string;
  relative_path: string;
  title: string;
  type: string;
  aliases: string[];
  summary: string;
  headings: string[];
  key_claims: string[];
  content: string;
};

const REQUIRED_PAGE_SECTIONS = ["## Summary", "## Key Claims", "## Relationships", "## Source Evidence", "## Open Questions", "## Change Notes"];

export function defaultDotfilesPaiDir(): string {
  return dirname(dirname(fileURLToPath(import.meta.url)));
}

export function paiSystemWikiRoot(runtimeHome?: string): string {
  return join(buildRuntimePaths(runtimeHome).memoryDir, "WIKI", "pai-system");
}

export function listWikiSources(options: WikiOptions = {}): WikiSource[] {
  const dotfilesPaiDir = options.dotfilesPaiDir ?? defaultDotfilesPaiDir();
  const sources = new Map<string, WikiSource>();

  addSource(sources, dotfilesPaiDir, "pai/PAI/README.md", 0, "PAI system overview");
  readDocDependencies(dotfilesPaiDir, sources);
  addSource(sources, dotfilesPaiDir, "pai/PAI/Algorithm/v6.3.0.md", 1, "Current Algorithm doctrine");
  readContextRouting(dotfilesPaiDir, sources);
  readDocsDirectory(dotfilesPaiDir, sources);

  return [...sources.values()].filter((source) => existsSync(source.local_path)).sort((left, right) => {
    if (left.tier !== right.tier) return left.tier - right.tier;
    return left.source_id.localeCompare(right.source_id);
  });
}

export function resolveWikiSource(source: string, options: WikiOptions = {}): WikiSource {
  const dotfilesPaiDir = options.dotfilesPaiDir ?? defaultDotfilesPaiDir();
  const known = listWikiSources({ dotfilesPaiDir, runtimeHome: options.runtimeHome });
  const byId = known.find((candidate) => candidate.source_id === source);
  if (byId) return byId;

  const localPath = resolve(dotfilesPaiDir, source);
  const sourceId = sourceIdFromLocalPath(localPath, dotfilesPaiDir);
  const existing = known.find((candidate) => candidate.source_id === sourceId);
  if (existing) return existing;
  if (!existsSync(localPath)) throw new Error(`Unknown wiki source: ${source}`);
  return { source_id: sourceId, local_path: localPath, tier: 99, description: "Ad hoc PAI wiki source" };
}

export function planWikiIngest(source: string, options: WikiOptions = {}): WikiPlan {
  const resolvedSource = resolveWikiSource(source, options);
  const wikiRoot = paiSystemWikiRoot(options.runtimeHome);
  const sourceNotePath = join(wikiRoot, "source-notes", `${sourceSlug(resolvedSource.source_id)}.md`);
  const targets: WikiTarget[] = [
    target(sourceNotePath, "source-note"),
    target(join(wikiRoot, "index.md"), "index"),
    target(join(wikiRoot, "log.md"), "log"),
    target(join(wikiRoot, "overview.md"), "overview"),
    target(join(wikiRoot, "lint", `${today() || "unknown-date"}-structural.md`), "lint"),
  ];
  return { source: resolvedSource, wiki_root: wikiRoot, targets };
}

export function ingestWikiSource(source: string, options: WikiOptions & { dryRun?: boolean } = {}): WikiIngestResult {
  const plan = planWikiIngest(source, options);
  const created: string[] = [];
  const updated: string[] = [];
  if (!options.dryRun) {
    const sourceText = readFileSync(plan.source.local_path, "utf8");
    for (const targetEntry of plan.targets) mkdirSync(dirname(targetEntry.path), { recursive: true });
    writeTracked(plan.targets[0].path, renderSourceNote(plan.source, sourceText), created, updated);
    writeTracked(join(plan.wiki_root, "overview.md"), renderOverview(), created, updated);
    writeTracked(join(plan.wiki_root, "index.md"), renderIndex(plan.wiki_root), created, updated);
    appendLog(join(plan.wiki_root, "log.md"), plan.source, created, updated);
    writeTracked(plan.targets[4].path, renderStructuralLintScaffold(plan.wiki_root), created, updated);
  }
  return { dry_run: Boolean(options.dryRun), source: plan.source, wiki_root: plan.wiki_root, created, updated, planned: plan.targets };
}

export function validateWiki(options: WikiOptions = {}): WikiValidationResult {
  const wikiRoot = paiSystemWikiRoot(options.runtimeHome);
  const issues: WikiValidationIssue[] = [];
  if (!existsSync(wikiRoot)) {
    issues.push({ path: wikiRoot, severity: "warning", message: "wiki root does not exist yet" });
    return { wiki_root: wikiRoot, ok: true, issues };
  }
  for (const required of ["index.md", "log.md", "overview.md"]) {
    const path = join(wikiRoot, required);
    if (!existsSync(path)) issues.push({ path, severity: "error", message: "required wiki file is missing" });
  }
  for (const page of listMarkdownFiles(wikiRoot)) validatePage(page, issues, options);
  return { wiki_root: wikiRoot, ok: !issues.some((issue) => issue.severity === "error"), issues };
}

export function lintWiki(options: WikiOptions = {}): WikiValidationResult {
  return validateWiki(options);
}

export function bootstrapWiki(options: WikiOptions = {}): WikiBootstrapPlan {
  const sources = listWikiSources(options);
  return { dry_run: true, source_count: sources.length, sources };
}

export function readWikiPage(query: string, options: WikiOptions = {}): WikiReadResult | WikiReadError {
  const wikiRoot = paiSystemWikiRoot(options.runtimeHome);
  const pages = indexWikiPages(wikiRoot);
  const trimmed = query.trim();
  if (!trimmed) {
    return { wiki_root: wikiRoot, query, error: "not-found", message: "empty query", close_matches: summarizePages(pages).slice(0, 5) };
  }
  const direct = resolveByPath(wikiRoot, trimmed, pages);
  if (direct === "outside") {
    return { wiki_root: wikiRoot, query, error: "outside-wiki", message: "path resolves outside the wiki root", close_matches: [] };
  }
  const hit = direct ?? resolveByTitleOrAlias(pages, trimmed);
  if (hit) {
    return {
      wiki_root: wikiRoot,
      page_path: hit.absolute_path,
      relative_path: hit.relative_path,
      title: hit.title,
      type: hit.type,
      aliases: hit.aliases,
      content: hit.content,
    };
  }
  return {
    wiki_root: wikiRoot,
    query,
    error: "not-found",
    message: `no wiki page matched "${trimmed}"`,
    close_matches: closeMatches(pages, trimmed),
  };
}

export function searchWiki(query: string, options: WikiOptions = {}): WikiSearchResult {
  const wikiRoot = paiSystemWikiRoot(options.runtimeHome);
  const trimmed = query.trim();
  if (!trimmed) return { wiki_root: wikiRoot, query, hit_count: 0, hits: [] };
  const pages = indexWikiPages(wikiRoot);
  const tokens = tokenizeQuery(trimmed);
  if (!tokens.length) return { wiki_root: wikiRoot, query, hit_count: 0, hits: [] };
  const scored: WikiSearchHit[] = [];
  for (const page of pages) {
    const matches: WikiSearchMatch[] = [];
    let score = 0;
    score += scoreField(page.title, tokens, "title", 6, matches);
    for (const alias of page.aliases) score += scoreField(alias, tokens, "alias", 5, matches);
    score += scoreField(page.summary, tokens, "summary", 3, matches);
    for (const heading of page.headings) score += scoreField(heading, tokens, "heading", 2, matches);
    for (const claim of page.key_claims) score += scoreField(claim, tokens, "key-claim", 2, matches);
    if (score > 0) {
      scored.push({
        relative_path: page.relative_path,
        title: page.title,
        type: page.type,
        confidence: clamp01(score / (tokens.length * 6)),
        matches: dedupeMatches(matches).slice(0, 6),
      });
    }
  }
  scored.sort((left, right) => right.confidence - left.confidence || left.relative_path.localeCompare(right.relative_path));
  return { wiki_root: wikiRoot, query: trimmed, hit_count: scored.length, hits: scored };
}

function readDocDependencies(dotfilesPaiDir: string, sources: Map<string, WikiSource>) {
  const path = join(dotfilesPaiDir, "PAI", "doc-dependencies.json");
  if (!existsSync(path)) return;
  const parsed = JSON.parse(readFileSync(path, "utf8")) as { authoritative_docs?: Record<string, { description?: string; tier?: number }> };
  for (const [docPath, entry] of Object.entries(parsed.authoritative_docs ?? {})) {
    addSource(sources, dotfilesPaiDir, `pai/PAI/${docPath}`, entry.tier ?? 2, entry.description ?? "PAI documentation source");
  }
}

function readContextRouting(dotfilesPaiDir: string, sources: Map<string, WikiSource>) {
  const path = join(dotfilesPaiDir, "PAI", "CONTEXT_ROUTING.md");
  if (!existsSync(path)) return;
  const matches = [...readFileSync(path, "utf8").matchAll(/`PAI\/([^`]+\.md)`/g)];
  for (const match of matches) addSource(sources, dotfilesPaiDir, `pai/PAI/${match[1]}`, 3, "Context routing source");
}

function readDocsDirectory(dotfilesPaiDir: string, sources: Map<string, WikiSource>) {
  const docsDir = join(dotfilesPaiDir, "docs");
  if (!existsSync(docsDir)) return;
  for (const path of listMarkdownFiles(docsDir)) {
    const id = `pai/docs/${relative(docsDir, path).split(sep).join("/")}`;
    addSource(sources, dotfilesPaiDir, id, 4, "PAI design documentation source");
  }
}

function addSource(sources: Map<string, WikiSource>, dotfilesPaiDir: string, sourceId: string, tier: number, description: string) {
  const localPath = localPathFromSourceId(sourceId, dotfilesPaiDir);
  if (!sources.has(sourceId)) sources.set(sourceId, { source_id: sourceId, local_path: localPath, tier, description });
}

function localPathFromSourceId(sourceId: string, dotfilesPaiDir: string): string {
  if (!sourceId.startsWith("pai/")) throw new Error(`Unsupported wiki source_id: ${sourceId}`);
  return join(dotfilesPaiDir, sourceId.slice("pai/".length));
}

function sourceIdFromLocalPath(path: string, dotfilesPaiDir: string): string {
  const relativePath = relative(dotfilesPaiDir, path).split(sep).join("/");
  if (relativePath.startsWith("..")) throw new Error(`Source path is outside tracked PAI directory: ${path}`);
  if (relativePath.startsWith("PAI/") || relativePath.startsWith("docs/")) return `pai/${relativePath}`;
  throw new Error(`Source path is outside v1 PAI wiki source set: ${path}`);
}

function target(path: string, kind: WikiTarget["kind"]): WikiTarget {
  return { path, kind, action: existsSync(path) ? "update" : "create" };
}

function sourceSlug(sourceId: string): string {
  return sourceId.replace(/\.md$/, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

function renderSourceNote(source: WikiSource, sourceText: string): string {
  const lineCount = sourceText.split(/\r?\n/).length;
  return `---\ntype: source-note\nstatus: needs-review\naliases: []\nderived_from:\n  - source_id: ${source.source_id}\nupdated: ${today()}\nconfidence: medium\n---\n\n# ${titleFromSourceId(source.source_id)}\n\n## Summary\nAgent synthesis needed. This scaffold was created from ${source.source_id}.\n\n## Key Claims\n- Source has ${lineCount} lines available for synthesis. Evidence: \`${source.source_id}:1-${lineCount}\`.\n\n## Relationships\n- Add related subsystem, concept, and decision links.\n\n## Source Evidence\n- \`${source.source_id}:1-${lineCount}\`\n\n## Open Questions\n- What durable synthesis should be promoted from this source?\n\n## Change Notes\n- ${today()}: Created source-note scaffold.\n`;
}

function renderOverview(): string {
  return `---\ntype: overview\nstatus: needs-review\naliases:\n  - PAI System Wiki\nderived_from: []\nupdated: ${today()}\nconfidence: medium\n---\n\n# PAI System Wiki\n\n## Summary\nAgent synthesis needed.\n\n## Key Claims\n- The PAI System Wiki is a derived local synthesis layer. Evidence: \`pai/docs/wiki/PAI_SYSTEM_WIKI.md:38-50\`.\n\n## Relationships\n- [[Memory System]]\n- [[Ideal State Artifact]]\n\n## Source Evidence\n- \`pai/docs/wiki/PAI_SYSTEM_WIKI.md:38-50\`\n\n## Open Questions\n- Which subsystem pages should be synthesized first?\n\n## Change Notes\n- ${today()}: Created overview scaffold.\n`;
}

function renderIndex(wikiRoot: string): string {
  const pages = existsSync(wikiRoot) ? listMarkdownFiles(wikiRoot).map((path) => relative(wikiRoot, path).split(sep).join("/")) : [];
  return `---\ntype: index\nstatus: current\nupdated: ${today()}\n---\n\n# PAI System Wiki Index\n\n${pages.map((page) => `- [${page}](${page})`).join("\n") || "- No generated pages yet."}\n`;
}

function appendLog(path: string, source: WikiSource, created: string[], updated: string[]) {
  const existed = existsSync(path);
  const previous = normalizeLogContent(existsSync(path) ? readFileSync(path, "utf8") : "");
  const next = `${previous.trimEnd()}\n\n## [${today()}] ingest | ${source.source_id}\n- Created: ${created.length}\n- Updated: ${updated.length}\n`;
  writeFileSync(path, next, "utf8");
  if (!created.includes(path) && !updated.includes(path)) (existed ? updated : created).push(path);
}

function normalizeLogContent(content: string): string {
  if (content.startsWith("---\n")) return content;
  const body = content.trim() ? content.replace(/^# PAI System Wiki Log\n?/, "").trimStart() : "";
  return `---\ntype: log\nstatus: current\nupdated: ${today()}\n---\n\n# PAI System Wiki Log\n${body ? `\n${body}` : ""}`;
}

function renderStructuralLintScaffold(wikiRoot: string): string {
  const validation = validateWiki({ runtimeHome: dirname(dirname(dirname(wikiRoot))) });
  return `---\ntype: lint-report\nstatus: needs-review\nupdated: ${today()}\nconfidence: medium\n---\n\n# Structural Lint ${today()}\n\n## Summary\nDeterministic structural lint scaffold.\n\n## Key Claims\n- Structural lint ran against the local generated wiki. Evidence: \`runtime/WIKI/pai-system/lint\`.\n\n## Relationships\n- [[PAI System Wiki]]\n\n## Source Evidence\n- \`runtime/WIKI/pai-system/lint\`\n\n## Open Questions\n- Semantic lint still requires agent review.\n\n## Change Notes\n- ${today()}: Created structural lint scaffold.\n\n## Issues\n${validation.issues.map((issue) => `- ${issue.severity}: ${issue.path} - ${issue.message}`).join("\n") || "- No structural issues detected by v1 checks."}\n`;
}

function writeTracked(path: string, content: string, created: string[], updated: string[]) {
  const existed = existsSync(path);
  writeFileSync(path, content, "utf8");
  (existed ? updated : created).push(path);
}

function validatePage(path: string, issues: WikiValidationIssue[], options: WikiOptions) {
  const content = readFileSync(path, "utf8");
  if (!content.startsWith("---\n")) issues.push({ path, severity: "error", message: "missing YAML frontmatter" });
  for (const section of REQUIRED_PAGE_SECTIONS) {
    if (!content.includes(section) && !path.endsWith("index.md") && !path.endsWith("log.md")) issues.push({ path, severity: "error", message: `missing required section ${section}` });
  }
  const sourceIds = [...content.matchAll(/source_id:\s*([^\n]+)/g)].map((match) => match[1].trim());
  for (const sourceId of sourceIds) {
    try {
      const localPath = localPathFromSourceId(sourceId, options.dotfilesPaiDir ?? defaultDotfilesPaiDir());
      if (!existsSync(localPath)) issues.push({ path, severity: "error", message: `derived source does not exist: ${sourceId}` });
    } catch (error) {
      issues.push({ path, severity: "error", message: error instanceof Error ? error.message : String(error) });
    }
  }
  if (content.includes("## Key Claims") && !content.includes("Evidence:")) issues.push({ path, severity: "warning", message: "Key Claims section has no Evidence references" });
}

function listMarkdownFiles(root: string): string[] {
  if (!existsSync(root)) return [];
  const entries = readdirSync(root, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const path = join(root, entry.name);
    if (entry.isDirectory()) return listMarkdownFiles(path);
    return entry.isFile() && entry.name.endsWith(".md") ? [path] : [];
  }).sort();
}

function titleFromSourceId(sourceId: string): string {
  const base = sourceId.split("/").at(-1)?.replace(/\.md$/, "") ?? sourceId;
  return base.replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function indexWikiPages(wikiRoot: string): WikiPageIndexEntry[] {
  if (!existsSync(wikiRoot)) return [];
  const paths = listMarkdownFiles(wikiRoot);
  const entries: WikiPageIndexEntry[] = [];
  for (const absolutePath of paths) {
    const content = readFileSync(absolutePath, "utf8");
    const relativePath = relative(wikiRoot, absolutePath).split(sep).join("/");
    const frontmatter = parseFrontmatter(content);
    entries.push({
      absolute_path: absolutePath,
      relative_path: relativePath,
      title: extractTitle(content, relativePath),
      type: typeof frontmatter.type === "string" ? frontmatter.type : "page",
      aliases: parseAliases(frontmatter.aliases),
      summary: extractSection(content, "## Summary"),
      headings: extractHeadings(content),
      key_claims: extractListItems(extractSection(content, "## Key Claims")),
      content,
    });
  }
  return entries;
}

function resolveByPath(wikiRoot: string, query: string, pages: WikiPageIndexEntry[]): WikiPageIndexEntry | "outside" | undefined {
  if (!query.includes("/") && !query.endsWith(".md")) return undefined;
  if (query.startsWith("/") || query.split(/[\\/]/).includes("..")) return "outside";
  const candidate = resolve(wikiRoot, query);
  const rootWithSep = wikiRoot.endsWith(sep) ? wikiRoot : wikiRoot + sep;
  if (candidate !== wikiRoot && !candidate.startsWith(rootWithSep)) return "outside";
  return pages.find((page) => page.absolute_path === candidate);
}

function resolveByTitleOrAlias(pages: WikiPageIndexEntry[], query: string): WikiPageIndexEntry | undefined {
  const normalized = normalizeName(query);
  return pages.find((page) => normalizeName(page.title) === normalized || page.aliases.some((alias) => normalizeName(alias) === normalized));
}

function summarizePages(pages: WikiPageIndexEntry[]): WikiPageSummary[] {
  return pages.map((page) => ({ relative_path: page.relative_path, title: page.title, type: page.type, aliases: page.aliases }));
}

function closeMatches(pages: WikiPageIndexEntry[], query: string): WikiPageSummary[] {
  const tokens = tokenizeQuery(query);
  if (!tokens.length) return [];
  const scored = pages.map((page) => {
    const haystackValues = [page.title, ...page.aliases, page.relative_path].map((value) => value.toLowerCase());
    let score = 0;
    for (const token of tokens) {
      for (const value of haystackValues) {
        if (value.includes(token)) {
          score += 2;
          continue;
        }
        for (const word of value.split(/[^a-z0-9]+/).filter(Boolean)) {
          const distance = editDistance(token, word);
          if (distance <= Math.max(1, Math.floor(word.length / 4))) {
            score += 1;
            break;
          }
        }
      }
    }
    return { page, score };
  });
  return scored.filter((entry) => entry.score > 0).sort((left, right) => right.score - left.score || left.page.relative_path.localeCompare(right.page.relative_path)).slice(0, 5).map((entry) => ({
    relative_path: entry.page.relative_path,
    title: entry.page.title,
    type: entry.page.type,
    aliases: entry.page.aliases,
  }));
}

function editDistance(left: string, right: string): number {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;
  if (Math.abs(left.length - right.length) > 2) return 99;
  const previous = new Array<number>(right.length + 1);
  const current = new Array<number>(right.length + 1);
  for (let index = 0; index <= right.length; index += 1) previous[index] = index;
  for (let i = 1; i <= left.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost);
    }
    for (let index = 0; index <= right.length; index += 1) previous[index] = current[index];
  }
  return current[right.length];
}

function parseFrontmatter(content: string): Record<string, unknown> {
  if (!content.startsWith("---\n")) return {};
  const end = content.indexOf("\n---", 4);
  if (end < 0) return {};
  const block = content.slice(4, end);
  const result: Record<string, unknown> = {};
  const lines = block.split("\n");
  let currentListKey: string | undefined;
  let currentList: string[] | undefined;
  for (const line of lines) {
    if (/^\s+-\s+/.test(line) && currentList) {
      currentList.push(line.replace(/^\s+-\s+/, "").trim());
      continue;
    }
    const match = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
    if (!match) continue;
    currentListKey = undefined;
    currentList = undefined;
    const key = match[1];
    const value = match[2];
    if (value === "") {
      currentListKey = key;
      currentList = [];
      result[key] = currentList;
    } else if (value.startsWith("[")) {
      result[key] = value.replace(/^\[|\]$/g, "").split(",").map((item) => item.trim()).filter(Boolean);
    } else {
      result[key] = value.trim();
    }
  }
  return result;
}

function parseAliases(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((entry) => String(entry).trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function extractTitle(content: string, fallback: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  if (match) return match[1].trim();
  return fallback.replace(/\.md$/, "").split("/").at(-1) ?? fallback;
}

function extractSection(content: string, heading: string): string {
  const lines = content.split("\n");
  const startIndex = lines.findIndex((line) => line.trim() === heading);
  if (startIndex < 0) return "";
  const collected: string[] = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^##\s/.test(line)) break;
    collected.push(line);
  }
  return collected.join("\n").trim();
}

function extractHeadings(content: string): string[] {
  const headings: string[] = [];
  for (const line of content.split("\n")) {
    const match = line.match(/^#{2,3}\s+(.+)$/);
    if (match) headings.push(match[1].trim());
  }
  return headings;
}

function extractListItems(block: string): string[] {
  if (!block) return [];
  return block.split("\n").map((line) => line.replace(/^[-*]\s+/, "").trim()).filter((line) => line.length > 0);
}

function tokenizeQuery(query: string): string[] {
  return [...new Set(query.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length >= 2))];
}

function scoreField(value: string, tokens: string[], field: WikiSearchMatch["field"], weight: number, matches: WikiSearchMatch[]): number {
  if (!value) return 0;
  const lower = value.toLowerCase();
  let fieldScore = 0;
  for (const token of tokens) {
    if (lower.includes(token)) fieldScore += weight;
  }
  if (fieldScore > 0) matches.push({ field, snippet: truncate(value, 220) });
  return fieldScore;
}

function dedupeMatches(matches: WikiSearchMatch[]): WikiSearchMatch[] {
  const seen = new Set<string>();
  const result: WikiSearchMatch[] = [];
  for (const match of matches) {
    const key = `${match.field}:${match.snippet}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(match);
  }
  return result;
}

function normalizeName(value: string): string {
  return value.toLowerCase().replace(/\.md$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function clamp01(value: number): number {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return Number(value.toFixed(4));
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}
