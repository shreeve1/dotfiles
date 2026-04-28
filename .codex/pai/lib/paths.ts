import { existsSync } from "fs";
import { dirname, join, resolve } from "path";
import { homedir } from "os";
import { fileURLToPath } from "url";

const installedDotfilesRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

function findUp(marker: string, start: string): string | null {
  let dir = resolve(start);
  while (true) {
    if (existsSync(join(dir, marker))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export function repoRoot(start = process.cwd()): string {
  if (existsSync(join(installedDotfilesRoot, ".codex", "pai"))) return installedDotfilesRoot;
  return findUp(".git", start) ?? findUp(".codex", start) ?? resolve(start);
}

export function codexHome(): string {
  return process.env.CODEX_HOME || join(homedir(), ".codex");
}

export function dotfilesPath(...parts: string[]): string {
  return join(repoRoot(), ...parts);
}

export function paiRoot(): string {
  return dotfilesPath(".codex", "pai");
}

export function paiPath(...parts: string[]): string {
  return join(paiRoot(), ...parts);
}

export function paiUserPath(...parts: string[]): string {
  return paiPath("USER", ...parts);
}

export function paiMemoryPath(...parts: string[]): string {
  return paiPath("MEMORY", ...parts);
}

export function userSkillRoot(): string {
  return join(homedir(), ".agents", "skills");
}

export function defaultUpstreamRepoPath(): string {
  return "/tmp/Personal_AI_Infrastructure";
}

export function defaultUpstreamReleasePath(): string {
  return join(defaultUpstreamRepoPath(), "Releases", "v4.0.3", ".claude");
}
