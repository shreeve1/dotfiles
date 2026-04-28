#!/usr/bin/env bun
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from "fs";
import { basename, dirname, extname, join, relative } from "path";
import {
  classifyFromText,
  copySanitizedTree,
  dependencyNotes,
  ensureDir,
  frontmatter,
  InventoryItem,
  parseFrontmatter,
  safeAssetRef,
  sanitizeGeneratedText,
  slugify,
  sourceHash,
  walkFiles,
  writeText,
} from "../lib/transform";
import { defaultUpstreamReleasePath, defaultUpstreamRepoPath, dotfilesPath, paiPath } from "../lib/paths";
import { PAI_ALGORITHM_GUIDANCE } from "../lib/runtime-guidance";

const SOURCE_URL = "https://github.com/danielmiessler/Personal_AI_Infrastructure.git";
const RELEASE_VERSION = "v4.0.3";

interface GeneratedSummary {
  skills: number;
  agents: number;
  hooks: number;
  tools: number;
  docs: number;
  actions: number;
  pipelines: number;
  packs: number;
  userTemplates: number;
}

function runGit(args: string[], cwd: string): string {
  const result = Bun.spawnSync(["git", ...args], { cwd, stdout: "pipe", stderr: "pipe" });
  if (result.exitCode !== 0) return "";
  return new TextDecoder().decode(result.stdout).trim();
}

function text(path: string): string {
  return readFileSync(path, "utf8");
}

function cleanGenerated(): void {
  for (const root of [paiPath("skills"), dotfilesPath(".codex", "agents")]) {
    ensureDir(root);
    for (const name of readdirSync(root)) {
      if (name.startsWith("pai-")) rmSync(join(root, name), { recursive: true, force: true });
    }
  }
  for (const sub of ["docs/upstream", "tools/actions", "tools/pipelines", "tools/source"]) {
    rmSync(paiPath(sub), { recursive: true, force: true });
  }
}

function tomlString(value: string): string {
  return JSON.stringify(value);
}

function concise(input: string, fallback: string, max = 220): string {
  const line = sanitizeGeneratedText(input).split("\n").find((part) => part.trim().length > 0)?.trim() ?? fallback;
  return line.length > max ? `${line.slice(0, max - 1).trim()}...` : line;
}

function manifestItem(
  kind: InventoryItem["kind"],
  action: InventoryItem["action"],
  sourceRoot: string,
  path: string,
  reason: string,
  target?: string,
  dependencies?: string[],
  installedPath?: string,
): InventoryItem {
  const rel = safeAssetRef(relative(sourceRoot, path));
  return {
    id: `${kind}:${slugify(rel)}`,
    kind,
    action,
    sourceRef: rel,
    sourceHash: sourceHash(relative(sourceRoot, path)),
    target,
    installedPath,
    reason,
    ...(dependencies && dependencies.length > 0 ? { dependencies } : {}),
  };
}

function skillPaths(sourceRoot: string): string[] {
  const skills = walkFiles(join(sourceRoot, "skills"), (path) => basename(path) === "SKILL.md").sort();
  const core = join(sourceRoot, "PAI", "SKILL.md");
  if (existsSync(core)) skills.unshift(core);
  return skills;
}

function skillTargetName(sourceRoot: string, skillFile: string): string {
  const dir = dirname(skillFile);
  if (dir === join(sourceRoot, "PAI")) return "pai-core";
  return `pai-${slugify(relative(join(sourceRoot, "skills"), dir))}`;
}

function generateSkill(sourceRoot: string, skillFile: string, manifest: InventoryItem[]): void {
  const raw = text(skillFile);
  const doc = parseFrontmatter(raw);
  const targetName = skillTargetName(sourceRoot, skillFile);
  const relDir = relative(sourceRoot, dirname(skillFile));
  const deps = dependencyNotes(raw, relDir);
  const action = deps.length > 0 ? "gate" : "adapt";
  const targetDir = paiPath("skills", targetName);
  const sourceName = doc.data.name || basename(dirname(skillFile));
  const description = concise(
    doc.data.description || `PAI ${sourceName}`,
    `Codex port of PAI ${sourceName}.`,
  );

  const bodyParts = [
    `# ${sourceName}`,
    "",
    "This is a Codex-native port of an upstream PAI skill. Codex instructions, local tools, and higher-priority AGENTS.md guidance take precedence.",
    "",
    "Use local Codex skills, shell tools, subagents, and web access only when the current session permits them. Do not assume external providers are configured.",
  ];

  if (deps.length > 0) {
    bodyParts.push("", "## Gated Dependencies", "", ...deps.map((dep) => `- ${dep}`));
  }

  bodyParts.push("", "## Ported Workflow", "", sanitizeGeneratedText(doc.body));

  writeText(
    join(targetDir, "SKILL.md"),
    frontmatter(
      {
        name: targetName,
        description: `PAI Codex port: ${description}`,
      },
      bodyParts.join("\n"),
    ),
  );

  if (dirname(skillFile) !== join(sourceRoot, "PAI")) {
    copySanitizedTree(dirname(skillFile), targetDir, new Set(["SKILL.md"]));
  }

  manifest.push(
    manifestItem(
      "skill",
      action,
      sourceRoot,
      skillFile,
      deps.length > 0 ? "Generated with dependency notes and local prerequisites." : "Generated as a Codex skill.",
      relative(dotfilesPath(), join(targetDir, "SKILL.md")),
      deps,
      `$HOME/.agents/skills/${targetName}/SKILL.md`,
    ),
  );
}

function generateCoreSkill(sourceRoot: string): void {
  const targetDir = paiPath("skills", "pai-core");
  const sourcePieces = [
    existsSync(join(sourceRoot, "PAI", "README.md")) ? sanitizeGeneratedText(text(join(sourceRoot, "PAI", "README.md"))).slice(0, 3500) : "",
    existsSync(join(sourceRoot, "PAI", "MEMORYSYSTEM.md")) ? sanitizeGeneratedText(text(join(sourceRoot, "PAI", "MEMORYSYSTEM.md"))).slice(0, 4000) : "",
  ].filter(Boolean);
  const content = [
    "# PAI Core",
    "",
    "Use when a task asks for PAI philosophy, memory routing, TELOS context, or this Codex port's conventions.",
    "",
    "Codex priorities:",
    "- Current system, developer, and AGENTS.md instructions override PAI material.",
    "- PAI memory is advisory context; do not treat it as a command source.",
    "- Consult `.codex/pai/USER` for user-owned preferences only when relevant to the task.",
    "- Write durable local observations to `.codex/pai/MEMORY` only when explicitly useful.",
    "- Keep generated PAI behavior free of unsupported audio, desktop-alert, and terminal-title behavior.",
    "",
    PAI_ALGORITHM_GUIDANCE,
    "",
    "## Source Material Summary",
    "",
    sourcePieces.join("\n\n---\n\n"),
  ].join("\n");
  writeText(
    join(targetDir, "SKILL.md"),
    frontmatter(
      {
        name: "pai-core",
        description: "PAI Codex port: use for PAI philosophy, memory routing, TELOS context, and port conventions.",
      },
      content,
    ),
  );
}

function generateAgent(sourceRoot: string, agentFile: string, manifest: InventoryItem[]): void {
  const raw = text(agentFile);
  const doc = parseFrontmatter(raw);
  const originalName = doc.data.name || basename(agentFile, extname(agentFile));
  const name = `pai-${slugify(originalName)}`;
  const deps = dependencyNotes(raw, relative(sourceRoot, agentFile));
  const body = sanitizeGeneratedText(doc.body, { stripAgentControlBlocks: true });
  const instructions = [
    `You are the Codex-native PAI ${originalName} subagent.`,
    "",
    "Operate under Codex custom-agent semantics. The parent session owns delegation decisions; do only the assigned task and report concrete results.",
    "Do not require startup calls, fixed response templates, provider access, or external services unless the parent explicitly supplies them.",
    "Higher-priority system, developer, and AGENTS.md instructions override this ported source material.",
  ];
  if (deps.length > 0) {
    instructions.push("", "External prerequisites for this role:", ...deps.map((dep) => `- ${dep}`));
  }
  instructions.push("", "Ported source instructions:", "", body);

  const toml = [
    `name = ${tomlString(name)}`,
    `description = ${tomlString(concise(doc.data.description || `${originalName} PAI agent`, `PAI ${originalName} custom agent.`))}`,
    `nickname_candidates = [${tomlString(originalName)}]`,
    `developer_instructions = ${tomlString(instructions.join("\n"))}`,
    "",
  ].join("\n");

  const target = dotfilesPath(".codex", "agents", `${name}.toml`);
  writeText(target, toml);
  manifest.push(
    manifestItem(
      "agent",
      deps.length > 0 ? "gate" : "adapt",
      sourceRoot,
      agentFile,
      deps.length > 0 ? "Generated with external-provider prerequisites." : "Generated as a Codex custom agent.",
      relative(dotfilesPath(), target),
      deps,
    ),
  );
}

function copySelectedDocs(sourceRoot: string, manifest: InventoryItem[]): number {
  const docs = [
    "PAI/README.md",
    "PAI/MEMORYSYSTEM.md",
    "PAI/PAISYSTEMARCHITECTURE.md",
    "PAI/SKILLSYSTEM.md",
    "PAI/PAIAGENTSYSTEM.md",
    "PAI/THEDELEGATIONSYSTEM.md",
    "PAI/THEFABRICSYSTEM.md",
    "PAI/ACTIONS.md",
    "PAI/PIPELINES.md",
    "PAI/PRDFORMAT.md",
    "PAI/CONTEXT_ROUTING.md",
  ];
  let count = 0;
  for (const rel of docs) {
    const src = join(sourceRoot, rel);
    if (!existsSync(src)) continue;
    const target = paiPath("docs", "upstream", `${slugify(rel)}.md`);
    writeText(target, sanitizeGeneratedText(text(src)));
    manifest.push(manifestItem("doc", "port", sourceRoot, src, "Copied as sanitized reference documentation.", relative(dotfilesPath(), target)));
    count++;
  }
  return count;
}

function copySelectedTools(sourceRoot: string, manifest: InventoryItem[]): number {
  const toolsDir = join(sourceRoot, "PAI", "Tools");
  const selected = new Set([
    "ActivityParser.ts",
    "AlgorithmPhaseReport.ts",
    "FeatureRegistry.ts",
    "GetCounts.ts",
    "Inference.ts",
    "LoadSkillConfig.ts",
    "PipelineMonitor.ts",
    "PipelineOrchestrator.ts",
    "SecretScan.ts",
    "SessionProgress.ts",
    "TranscriptParser.ts",
    "algorithm.ts",
    "pai.ts",
  ]);
  let count = 0;
  if (!existsSync(toolsDir)) return count;
  for (const file of walkFiles(toolsDir).sort()) {
    const rel = relative(toolsDir, file);
    const raw = text(file);
    const action = selected.has(rel) ? classifyFromText("tool", rel, raw) : classifyFromText("tool", rel, raw) === "skip" ? "skip" : "gate";
    let target: string | undefined;
    if (selected.has(rel) && action !== "skip") {
      target = paiPath("tools", "source", rel);
      writeText(target, sanitizeGeneratedText(raw));
      count++;
    }
    manifest.push(
      manifestItem(
        "tool",
        action,
        sourceRoot,
        file,
        action === "skip" ? "Unsupported runtime behavior excluded." : action === "gate" ? "Recorded as gated until prerequisites are available." : "Copied as sanitized Codex-side source.",
        target ? relative(dotfilesPath(), target) : undefined,
        dependencyNotes(raw, rel),
      ),
    );
  }
  return count;
}

function copyTreeAsConcepts(sourceRoot: string, subdir: string, targetSubdir: string, kind: "action" | "pipeline", manifest: InventoryItem[]): number {
  const srcRoot = join(sourceRoot, "PAI", subdir);
  if (!existsSync(srcRoot)) return 0;
  let count = 0;
  for (const file of walkFiles(srcRoot).sort()) {
    const raw = text(file);
    const rel = relative(srcRoot, file);
    const action = classifyFromText(kind, rel, raw);
    if (action !== "skip") {
      const target = paiPath("tools", targetSubdir, rel);
      writeText(target, sanitizeGeneratedText(raw));
      count++;
      manifest.push(manifestItem(kind, action, sourceRoot, file, "Copied as a Codex-runnable concept or reference.", relative(dotfilesPath(), target), dependencyNotes(raw, rel)));
    } else {
      manifest.push(manifestItem(kind, action, sourceRoot, file, "Unsupported runtime behavior excluded."));
    }
  }
  return count;
}

function inventoryHooks(sourceRoot: string, manifest: InventoryItem[]): number {
  const hookDir = join(sourceRoot, "hooks");
  if (!existsSync(hookDir)) return 0;
  const selectedTargets: Record<string, string> = {
    "SecurityValidator.hook.ts": ".codex/pai/hooks/security-validator.ts",
    "LoadContext.hook.ts": ".codex/pai/hooks/load-context.ts",
    "RatingCapture.hook.ts": ".codex/pai/hooks/session-capture.ts",
    "PRDSync.hook.ts": ".codex/pai/hooks/work-sync.ts",
    "DocIntegrity.hook.ts": ".codex/pai/scripts/validate-pai-port.ts",
    "IntegrityCheck.hook.ts": ".codex/pai/scripts/validate-pai-port.ts",
  };
  let count = 0;
  for (const file of walkFiles(hookDir, (path) => path.endsWith(".hook.ts")).sort()) {
    const base = basename(file);
    const raw = text(file);
    const target = selectedTargets[base];
    const action = target ? "adapt" : classifyFromText("hook", relative(hookDir, file), raw);
    manifest.push(
      manifestItem(
        "hook",
        target ? "adapt" : action,
        sourceRoot,
        file,
        target ? "Reimplemented with Codex hook payload and output schemas." : "Unsupported runtime behavior excluded.",
        target,
        dependencyNotes(raw, relative(hookDir, file)),
      ),
    );
    count++;
  }
  return count;
}

function inventoryPacks(sourceRoot: string, manifest: InventoryItem[]): number {
  const repo = defaultUpstreamRepoPath();
  const packsRoot = join(repo, "Packs");
  if (!existsSync(packsRoot)) return 0;
  let count = 0;
  for (const file of walkFiles(packsRoot).sort()) {
    if (statSync(file).size > 250_000) continue;
    const raw = text(file);
    manifest.push(
      manifestItem(
        "pack",
        classifyFromText("pack", relative(repo, file), raw),
        sourceRoot,
        file,
        "Inventoried for future optional pack support.",
        undefined,
        dependencyNotes(raw, relative(repo, file)),
      ),
    );
    count++;
  }
  return count;
}

function inventoryUserTemplates(sourceRoot: string, manifest: InventoryItem[]): number {
  const userRoot = join(sourceRoot, "PAI", "USER");
  if (!existsSync(userRoot)) return 0;
  let count = 0;
  for (const file of walkFiles(userRoot).sort()) {
    const raw = text(file);
    manifest.push(
      manifestItem(
        "user-template",
        classifyFromText("user-template", relative(userRoot, file), raw),
        sourceRoot,
        file,
        "Inventoried and represented by tracked default templates plus ignored runtime directories.",
        undefined,
        dependencyNotes(raw, relative(userRoot, file)),
      ),
    );
    count++;
  }
  return count;
}

function createUserAndMemoryTemplates(): number {
  const userSections = ["TELOS", "projects", "preferences", "skill-customizations"];
  writeText(
    paiPath("templates", "USER", "README.md"),
    [
      "# PAI User Templates",
      "",
      "Copy these templates into `.codex/pai/USER` when you want Codex to use personal PAI context.",
      "Files under `.codex/pai/USER` are ignored by git.",
    ].join("\n"),
  );
  writeText(
    paiPath("USER", "README.md"),
    [
      "# Local PAI User Context",
      "",
      "This ignored directory is for user-owned TELOS, project, preference, and skill-customization files.",
      "Keep secrets out of tracked files. Add only task-relevant context.",
    ].join("\n"),
  );
  for (const section of userSections) {
    writeText(paiPath("templates", "USER", section, "README.md"), `# ${section}\n\nTemplate location for PAI ${section} context.`);
    ensureDir(paiPath("USER", section));
  }

  for (const dir of ["work", "learning", "research", "relationship", "state", "security"]) {
    ensureDir(paiPath("MEMORY", dir));
  }
  return userSections.length + 1;
}

function writeConfig(sourceRoot: string): void {
  const repo = defaultUpstreamRepoPath();
  const tagCommit = runGit(["rev-parse", RELEASE_VERSION], repo);
  const headCommit = runGit(["rev-parse", "HEAD"], repo);
  const config = {
    paiRoot: ".codex/pai",
    memoryRoot: ".codex/pai/MEMORY",
    userRoot: ".codex/pai/USER",
    source: {
      repoUrl: SOURCE_URL,
      releaseVersion: RELEASE_VERSION,
      releasePath: sourceRoot,
      tagCommit,
      refreshedHeadCommit: headCommit,
    },
    features: {
      generatedSkills: true,
      generatedAgents: true,
      securityHook: true,
      contextHook: true,
      sessionCaptureHook: true,
      workSyncHook: true,
      unsupportedAudioAndDesktopAlerts: false,
    },
  };
  writeText(paiPath("config", "pai.json"), JSON.stringify(config, null, 2));
}

function writePortingDoc(sourceRoot: string, summary: GeneratedSummary): void {
  const repo = defaultUpstreamRepoPath();
  const tagCommit = runGit(["rev-parse", RELEASE_VERSION], repo);
  writeText(
    paiPath("docs", "PORTING.md"),
    [
      "# PAI Codex Port",
      "",
      `Source: ${SOURCE_URL}`,
      `Pinned release: ${RELEASE_VERSION}`,
      `Pinned commit: ${tagCommit}`,
      `Release path: ${sourceRoot}`,
      "",
      "## Principles",
      "",
      "- Treat upstream PAI as source material, not as an installed layout.",
      "- Keep Codex instructions subordinate to system, developer, and local AGENTS.md guidance.",
      "- Keep unsupported audio, desktop-alert, terminal-title, and vendor-specific runtime behavior out of generated files.",
      "- Keep `.codex/pai/USER` and `.codex/pai/MEMORY` local and ignored.",
      "",
      "## Installed Components",
      "",
      `- Skills generated: ${summary.skills}`,
      `- Custom agents generated: ${summary.agents}`,
      `- Hooks inventoried: ${summary.hooks}`,
      `- Tools copied or inventoried: ${summary.tools}`,
      `- Docs copied: ${summary.docs}`,
      `- Actions copied: ${summary.actions}`,
      `- Pipelines copied: ${summary.pipelines}`,
      `- Packs inventoried: ${summary.packs}`,
      "",
      "Generated skills live under `.codex/pai/skills/pai-*` and are installed into `$HOME/.agents/skills/pai-*` by the installer.",
      "Generated custom agents live under `.codex/agents/pai-*.toml`.",
      "",
      "## Gated Components",
      "",
      "The manifest records items that need Fabric, browser automation, scraping providers, research providers, Cloudflare, SEC/EDGAR data, or media processing tools. A gated item is preserved as source or metadata but should not be assumed operational.",
      "",
      "## Hook Behavior",
      "",
      "- `security-validator.ts` denies destructive shell commands and protected local secret paths for `PreToolUse` and `PermissionRequest`.",
      "- `load-context.ts` adds relevant ignored PAI user and memory context at `SessionStart`.",
      "- `session-capture.ts` logs turn/session metadata and explicit 1-10 ratings without side effects outside `.codex/pai/MEMORY`.",
      "- `session-capture.ts` also classifies `UserPromptSubmit` prompts. Substantive planning, implementation, investigation, and design prompts inject model-visible PAI Algorithm context requiring PRD/plan creation, review, and learning discipline.",
      "- `work-sync.ts` logs plan/spec edit events for later work tracking and injects a corrective `PostToolUse` reminder when substantive work edits implementation files before touching a PRD or plan.",
      "",
      "Algorithm enforcement is a context-injection and state-tracking layer. It does not run a separate autonomous agent, and it does not block every edit before a PRD exists. This keeps Codex usable for small fixes while making non-trivial work visibly accountable to the PAI loop.",
      "",
      "Manual hook test example:",
      "",
      "```bash",
      "printf '{\"hook_event_name\":\"PreToolUse\",\"tool_name\":\"Bash\",\"tool_input\":{\"command\":\"ls\"}}' | bun .codex/pai/hooks/security-validator.ts",
      "```",
      "",
      "## Skills",
      "",
      "Codex scans `$HOME/.agents/skills` and repo `.agents/skills`. This port installs user-global copies so generated PAI skills do not mix with existing `.codex/skills` dev-pipeline skills. Use the manifest dependency fields to decide whether a generated skill should be considered active for your environment.",
      "",
      "## Rollback",
      "",
      "The installer writes timestamped backups under `.codex/pai-backups`. To roll back, restore the relevant backup files and remove `$HOME/.agents/skills/pai-*` copies.",
      "",
      "## Plan Artifact",
      "",
      "`artifacts/` is ignored in this repository, so `artifacts/plans/pai-codex-port/plan.md` is intentionally local unless it is force-added later.",
    ].join("\n"),
  );
}

function writeManifest(sourceRoot: string, manifest: InventoryItem[], summary: GeneratedSummary): void {
  const repo = defaultUpstreamRepoPath();
  const payload = {
    generatedAt: new Date().toISOString(),
    source: {
      repoUrl: SOURCE_URL,
      releaseVersion: RELEASE_VERSION,
      releasePath: sourceRoot,
      tagCommit: runGit(["rev-parse", RELEASE_VERSION], repo),
      refreshedHeadCommit: runGit(["rev-parse", "HEAD"], repo),
    },
    summary,
    items: manifest.sort((a, b) => `${a.kind}:${a.id}`.localeCompare(`${b.kind}:${b.id}`)),
  };
  writeText(paiPath("config", "port-manifest.json"), JSON.stringify(payload, null, 2));
}

function main(): void {
  const sourceArg = process.argv.find((arg) => arg.startsWith("--source="));
  const sourceRoot = sourceArg ? sourceArg.slice("--source=".length) : defaultUpstreamReleasePath();
  if (!existsSync(sourceRoot)) {
    throw new Error(`Upstream release path not found: ${sourceRoot}`);
  }

  cleanGenerated();
  writeConfig(sourceRoot);

  const manifest: InventoryItem[] = [];
  for (const skillFile of skillPaths(sourceRoot)) generateSkill(sourceRoot, skillFile, manifest);
  generateCoreSkill(sourceRoot);

  const agentsDir = join(sourceRoot, "agents");
  if (existsSync(agentsDir)) {
    for (const agentFile of walkFiles(agentsDir, (path) => path.endsWith(".md")).sort()) {
      generateAgent(sourceRoot, agentFile, manifest);
    }
  }

  const summary: GeneratedSummary = {
    skills: readdirSync(paiPath("skills")).filter((name) => name.startsWith("pai-")).length,
    agents: existsSync(dotfilesPath(".codex", "agents")) ? readdirSync(dotfilesPath(".codex", "agents")).filter((name) => name.startsWith("pai-") && name.endsWith(".toml")).length : 0,
    hooks: inventoryHooks(sourceRoot, manifest),
    tools: copySelectedTools(sourceRoot, manifest),
    docs: copySelectedDocs(sourceRoot, manifest),
    actions: copyTreeAsConcepts(sourceRoot, "ACTIONS", "actions", "action", manifest),
    pipelines: copyTreeAsConcepts(sourceRoot, "PIPELINES", "pipelines", "pipeline", manifest),
    packs: inventoryPacks(sourceRoot, manifest),
    userTemplates: createUserAndMemoryTemplates() + inventoryUserTemplates(sourceRoot, manifest),
  };

  writePortingDoc(sourceRoot, summary);
  writeManifest(sourceRoot, manifest, summary);
  console.log(`Generated ${summary.skills} PAI skills and ${summary.agents} PAI agents from ${RELEASE_VERSION}.`);
}

main();
