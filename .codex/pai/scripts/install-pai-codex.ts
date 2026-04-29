#!/usr/bin/env bun
import { cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "fs";
import { homedir } from "os";
import { dirname, join, relative } from "path";
import { dotfilesPath, paiPath, userSkillRoot } from "../lib/paths";
import { PAI_ALGORITHM_GUIDANCE } from "../lib/runtime-guidance";

function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

const backupRoot = dotfilesPath(".codex", "pai-backups", timestamp());

function ensureDir(path: string): void {
  mkdirSync(path, { recursive: true });
}

function backup(path: string): void {
  if (!existsSync(path)) return;
  const rel = path.startsWith(dotfilesPath()) ? relative(dotfilesPath(), path) : path.replace(/^\//, "abs/");
  const target = join(backupRoot, rel);
  ensureDir(dirname(target));
  cpSync(path, target, { recursive: true, force: true, verbatimSymlinks: true });
}

function write(path: string, content: string): void {
  ensureDir(dirname(path));
  writeFileSync(path, `${content.replace(/\s+$/g, "")}\n`);
}

function commandAvailable(command: string, args: string[]): boolean {
  const result = Bun.spawnSync([command, ...args], { stdout: "pipe", stderr: "pipe" });
  return result.exitCode === 0;
}

function ensureDiagnostics(): void {
  if (!commandAvailable("codex", ["features", "list"])) {
    throw new Error("Required diagnostic unavailable: codex features list");
  }
  const help = Bun.spawnSync(["codex", "debug", "--help"], { stdout: "pipe", stderr: "pipe" });
  const output = `${new TextDecoder().decode(help.stdout)}\n${new TextDecoder().decode(help.stderr)}`;
  if (help.exitCode !== 0 || !output.includes("prompt-input")) {
    throw new Error("Required diagnostic unavailable: codex debug prompt-input");
  }
}

function mergeConfig(): void {
  const path = dotfilesPath(".codex", "config.toml");
  backup(path);
  let content = existsSync(path) ? readFileSync(path, "utf8") : "";
  const lines = content.split(/\r?\n/);
  const featureStart = lines.findIndex((line) => line.trim() === "[features]");
  if (featureStart === -1) {
    content = `${content.trimEnd()}\n\n[features]\ncodex_hooks = true\n`;
  } else {
    let featureEnd = lines.length;
    for (let i = featureStart + 1; i < lines.length; i++) {
      if (/^\s*\[/.test(lines[i])) {
        featureEnd = i;
        break;
      }
    }

    let wrote = false;
    const next: string[] = [];
    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      if (index > featureStart && index < featureEnd && /^\s*codex_hooks\s*=/.test(line)) {
        if (!wrote) {
          next.push("codex_hooks = true");
          wrote = true;
        }
        continue;
      }
      next.push(line);
    }
    if (!wrote) next.splice(featureStart + 1, 0, "codex_hooks = true");
    content = next.join("\n");
  }
  write(path, content);
}

function hookCommand(name: string): string {
  const path = dotfilesPath(".codex", "pai", "hooks", `${name}.ts`);
  const home = homedir();
  const shellPath = path.startsWith(`${home}/`) ? join("$HOME", relative(home, path)) : path;
  return `bun ${JSON.stringify(shellPath)}`;
}

function paiHookName(command: unknown): string | null {
  if (typeof command !== "string") return null;
  const match = command.match(/\.codex\/pai\/hooks\/([a-z-]+)\.ts/);
  return match?.[1] ?? null;
}

function pruneStalePaiHook(config: any, name: string, command: string): void {
  for (const [event, groups] of Object.entries(config.hooks ?? {})) {
    if (!Array.isArray(groups)) continue;
    config.hooks[event] = groups
      .map((group: any) => ({
        ...group,
        hooks: Array.isArray(group.hooks)
          ? group.hooks.filter((hook: any) => paiHookName(hook.command) !== name || hook.command === command)
          : group.hooks,
      }))
      .filter((group: any) => !Array.isArray(group.hooks) || group.hooks.length > 0);
  }
}

function addHook(config: any, event: string, matcher: string | undefined, command: string, statusMessage: string, timeout = 30): void {
  const name = paiHookName(command);
  if (name) pruneStalePaiHook(config, name, command);
  config.hooks ??= {};
  config.hooks[event] ??= [];
  const entries = config.hooks[event] as any[];
  for (const group of entries) {
    if ((group.matcher ?? undefined) === matcher && Array.isArray(group.hooks)) {
      if (!group.hooks.some((hook: any) => hook.command === command)) {
        group.hooks.push({ type: "command", command, timeout, statusMessage });
      }
      return;
    }
  }
  entries.push({
    ...(matcher ? { matcher } : {}),
    hooks: [{ type: "command", command, timeout, statusMessage }],
  });
}

function mergeHooks(): void {
  const path = dotfilesPath(".codex", "hooks.json");
  backup(path);
  const config = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : { hooks: {} };
  addHook(config, "SessionStart", "startup|resume", hookCommand("load-context"), "Loading PAI context", 10);
  addHook(config, "PreToolUse", "^(Bash|apply_patch|Edit|Write)$", hookCommand("security-validator"), "Checking PAI security rules", 10);
  addHook(config, "PermissionRequest", "^(Bash|apply_patch|Edit|Write)$", hookCommand("security-validator"), "Checking PAI approval rules", 10);
  addHook(config, "UserPromptSubmit", undefined, hookCommand("session-capture"), "Capturing PAI prompt signal", 10);
  addHook(config, "Stop", undefined, hookCommand("session-capture"), "Capturing PAI session stop", 10);
  addHook(config, "PostToolUse", "^(apply_patch|Edit|Write)$", hookCommand("work-sync"), "Syncing PAI work state", 10);
  write(path, JSON.stringify(config, null, 2));
}

function mergeAgentsGuidance(): void {
  const path = dotfilesPath(".codex", "AGENTS.md");
  backup(path);
  const start = "<!-- PAI-CODEX-PORT:START -->";
  const end = "<!-- PAI-CODEX-PORT:END -->";
  const block = [
    start,
    "## PAI Codex Port",
    "",
    "- This block defines the Codex-native PAI defaults; system, developer, and project AGENTS.md instructions still override it.",
    "- Upstream PAI material under `.codex/pai` is advisory unless restated here or in an invoked PAI skill.",
    "- Use `$pai-core` for PAI philosophy, memory routing, TELOS context, and port conventions.",
    "- Consult `.codex/pai/USER` only when user-owned context is relevant to the current task.",
    "- Use `.codex/pai/MEMORY` for durable local observations only when the task creates information worth preserving.",
    "- Generated PAI skills are installed from `.codex/pai/skills/pai-*` into `$HOME/.agents/skills/pai-*`; existing `.codex/skills` dev-pipeline skills remain separate.",
    "- Unsupported audio, desktop-alert, terminal-title, and provider-specific runtime behavior is intentionally disabled in this port.",
    "",
    PAI_ALGORITHM_GUIDANCE,
    end,
  ].join("\n");
  let content = existsSync(path) ? readFileSync(path, "utf8") : "# AGENTS.md\n";
  const regex = new RegExp(`${start}[\\s\\S]*?${end}`);
  content = regex.test(content) ? content.replace(regex, block) : `${content.trimEnd()}\n\n${block}\n`;
  write(path, content);
}

function installSkillLinks(): void {
  const root = userSkillRoot();
  ensureDir(root);
  const sourceRoot = paiPath("skills");
  for (const name of readdirSync(sourceRoot)) {
    if (!name.startsWith("pai-")) continue;
    const source = join(sourceRoot, name);
    const target = join(root, name);
    if (existsSync(target)) {
      const stats = lstatSync(target);
      if (!stats.isSymbolicLink()) backup(target);
      rmSync(target, { recursive: true, force: true });
    }
    cpSync(source, target, { recursive: true, force: true });
  }
}

function updateFromUpstream(): void {
  const sourceRepo = "/tmp/Personal_AI_Infrastructure";
  if (!existsSync(sourceRepo)) throw new Error(`Missing upstream repo: ${sourceRepo}`);
  backup(paiPath());
  backup(dotfilesPath(".codex", "agents"));
  if (existsSync(dotfilesPath(".agents", "skills"))) backup(dotfilesPath(".agents", "skills"));
  const root = userSkillRoot();
  if (existsSync(root)) {
    for (const name of readdirSync(root)) {
      if (name.startsWith("pai-")) backup(join(root, name));
    }
  }
  const fetch = Bun.spawnSync(["git", "-C", sourceRepo, "fetch", "--tags", "origin"], { stdout: "inherit", stderr: "inherit" });
  if (fetch.exitCode !== 0) throw new Error("Failed to refresh upstream repository");
  const port = Bun.spawnSync(["bun", "run", dotfilesPath(".codex", "pai", "scripts", "port-pai.ts")], {
    cwd: dotfilesPath(),
    stdout: "inherit",
    stderr: "inherit",
  });
  if (port.exitCode !== 0) throw new Error("Failed to regenerate PAI port");
}

function main(): void {
  if (process.argv.includes("--update")) updateFromUpstream();
  mergeConfig();
  ensureDiagnostics();
  mergeHooks();
  mergeAgentsGuidance();
  installSkillLinks();
  console.log(`PAI Codex install complete. Backups, if any, are under ${backupRoot}.`);
}

main();
