#!/usr/bin/env bun
import { existsSync, readFileSync, readdirSync } from "fs";
import { join, relative, sep } from "path";
import { assertNoProhibitedTerms, walkFiles } from "../lib/transform";
import { defaultUpstreamReleasePath, dotfilesPath, paiPath, userSkillRoot } from "../lib/paths";

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function ok(message: string): void {
  console.log(message);
}

function requirePath(path: string): void {
  if (!existsSync(path)) fail(`missing path: ${path}`);
}

function run(command: string[]): void {
  const result = Bun.spawnSync(command, { cwd: dotfilesPath(), stdout: "pipe", stderr: "pipe" });
  if (result.exitCode !== 0) {
    console.error(new TextDecoder().decode(result.stdout));
    console.error(new TextDecoder().decode(result.stderr));
    fail(`command failed: ${command.join(" ")}`);
  }
}

function relativeFiles(root: string): string[] {
  return walkFiles(root).map((path) => relative(root, path).split(sep).join("/")).sort();
}

function requireMirroredTree(source: string, target: string): void {
  const sourceFiles = relativeFiles(source);
  const targetFiles = relativeFiles(target);
  if (sourceFiles.join("\n") !== targetFiles.join("\n")) fail(`installed skill tree mismatch: ${source} != ${target}`);
  for (const file of sourceFiles) {
    const sourceBytes = readFileSync(join(source, file));
    const targetBytes = readFileSync(join(target, file));
    if (!sourceBytes.equals(targetBytes)) fail(`installed skill file differs: ${join(target, file)}`);
  }
}

requirePath(paiPath("config", "pai.json"));
requirePath(paiPath("config", "port-manifest.json"));
requirePath(paiPath("docs", "PORTING.md"));
requirePath(dotfilesPath(".codex", "hooks.json"));
requirePath(dotfilesPath(".codex", "config.toml"));

const manifest = JSON.parse(readFileSync(paiPath("config", "port-manifest.json"), "utf8"));
if (manifest.source?.repoUrl !== "https://github.com/danielmiessler/Personal_AI_Infrastructure.git") fail("manifest source URL mismatch");
if (manifest.source?.releaseVersion !== "v4.0.3") fail("manifest release version mismatch");

const sourceSkillCount = walkFiles(join(defaultUpstreamReleasePath(), "skills"), (path) => path.endsWith("SKILL.md")).length + 1;
const manifestSkillCount = manifest.items.filter((item: any) => item.kind === "skill").length;
if (manifestSkillCount !== sourceSkillCount) fail(`skill manifest count mismatch: ${manifestSkillCount} != ${sourceSkillCount}`);

const agentCount = readdirSync(dotfilesPath(".codex", "agents")).filter((name) => name.startsWith("pai-") && name.endsWith(".toml")).length;
if (agentCount < 1) fail("no generated PAI agents found");

const skillDirs = readdirSync(paiPath("skills")).filter((name) => name.startsWith("pai-"));
if (skillDirs.length !== sourceSkillCount) fail(`generated skill count mismatch: ${skillDirs.length} != ${sourceSkillCount}`);
for (const skill of skillDirs) requirePath(paiPath("skills", skill, "SKILL.md"));

const userRoot = userSkillRoot();
requirePath(userRoot);
const installedSkillDirs = skillDirs.map((skill) => join(userRoot, skill));
for (const target of installedSkillDirs) requirePath(join(target, "SKILL.md"));

const findings = assertNoProhibitedTerms([
  paiPath(),
  dotfilesPath(".codex", "agents"),
  dotfilesPath(".codex", "hooks.json"),
  dotfilesPath(".codex", "config.toml"),
  existsSync(dotfilesPath(".agents", "skills")) ? dotfilesPath(".agents", "skills") : paiPath("config", "pai.json"),
  ...installedSkillDirs,
]);
if (findings.length > 0) fail(`excluded runtime terms found:\n${findings.join("\n")}`);

run(["node", "-e", "JSON.parse(require('fs').readFileSync('.codex/hooks.json','utf8'))"]);
run(["python3", "-c", "import tomllib, pathlib; tomllib.load(open('.codex/config.toml','rb')); [tomllib.load(open(p,'rb')) for p in pathlib.Path('.codex/agents').glob('pai-*.toml')]"]);

const linked = skillDirs.filter((skill) => {
  const target = join(userRoot, skill);
  return existsSync(join(target, "SKILL.md"));
});
if (linked.length !== skillDirs.length) fail(`skill install count mismatch: ${linked.length} != ${skillDirs.length}`);
for (const skill of skillDirs) requireMirroredTree(paiPath("skills", skill), join(userRoot, skill));

const features = Bun.spawnSync(["codex", "features", "list"], { stdout: "pipe", stderr: "pipe" });
if (features.exitCode !== 0) fail("codex features list unavailable");
const debugHelp = Bun.spawnSync(["codex", "debug", "--help"], { stdout: "pipe", stderr: "pipe" });
const debugOutput = `${new TextDecoder().decode(debugHelp.stdout)}\n${new TextDecoder().decode(debugHelp.stderr)}`;
if (debugHelp.exitCode !== 0 || !debugOutput.includes("prompt-input")) fail("codex debug prompt-input unavailable");

ok("pai port validation ok");
