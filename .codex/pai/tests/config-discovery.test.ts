import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { dotfilesPath, paiPath, userSkillRoot } from "../lib/paths";

describe("PAI config and discovery", () => {
  test("hooks JSON parses", () => {
    expect(() => JSON.parse(readFileSync(dotfilesPath(".codex", "hooks.json"), "utf8"))).not.toThrow();
  });

  test("Codex TOML files parse", () => {
    const result = Bun.spawnSync([
      "python3",
      "-c",
      "import tomllib, pathlib; tomllib.load(open('.codex/config.toml','rb')); [tomllib.load(open(p,'rb')) for p in pathlib.Path('.codex/agents').glob('pai-*.toml')]",
    ], { cwd: dotfilesPath(), stdout: "pipe", stderr: "pipe" });
    expect(result.exitCode).toBe(0);
  });

  test("dev pipeline skills remain present", () => {
    expect(existsSync(dotfilesPath(".codex", "skills", "dev-build", "SKILL.md"))).toBe(true);
    expect(existsSync(dotfilesPath(".codex", "skills", "dev-review", "SKILL.md"))).toBe(true);
  });

  test("manifest records gated skills", () => {
    const manifestPath = paiPath("config", "port-manifest.json");
    if (!existsSync(manifestPath)) return;
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    expect(manifest.items.some((item: any) => item.kind === "skill" && item.action === "gate")).toBe(true);
  });

  test("generated agent TOML files include required fields", () => {
    const agentDir = dotfilesPath(".codex", "agents");
    if (!existsSync(agentDir)) return;
    const result = Bun.spawnSync([
      "python3",
      "-c",
      "import tomllib, pathlib; [(_ for _ in ()).throw(Exception(p)) if not all(k in tomllib.load(open(p,'rb')) for k in ['name','description','developer_instructions']) else None for p in pathlib.Path('.codex/agents').glob('pai-*.toml')]",
    ], { cwd: dotfilesPath(), stdout: "pipe", stderr: "pipe" });
    expect(result.exitCode).toBe(0);
  });

  test("diagnostics are available before use", () => {
    const features = Bun.spawnSync(["codex", "features", "list"], { stdout: "pipe", stderr: "pipe" });
    expect(features.exitCode).toBe(0);
    const debug = Bun.spawnSync(["codex", "debug", "--help"], { stdout: "pipe", stderr: "pipe" });
    const output = `${new TextDecoder().decode(debug.stdout)}\n${new TextDecoder().decode(debug.stderr)}`;
    expect(output).toContain("prompt-input");
  });

  test("user-global skill discovery exposes PAI skill files", () => {
    const root = userSkillRoot();
    if (!existsSync(root) || !existsSync(paiPath("skills"))) return;
    const core = join(root, "pai-core", "SKILL.md");
    expect(existsSync(core)).toBe(true);
  });

  test("AGENTS guidance makes the PAI loop active", () => {
    const content = readFileSync(dotfilesPath(".codex", "AGENTS.md"), "utf8");
    expect(content).toContain("PAI Algorithm Loop");
    expect(content).toContain("Observe -> Think -> Plan -> Build -> Execute -> Verify -> Review -> Learn");
    expect(content).toContain("artifacts/specs/<slug>/PRD.md");
    expect(content).toContain(".codex/pai/MEMORY/learning/");
  });

  test("generated pai-core skill preserves planning, review, and learning guidance", () => {
    const generated = readFileSync(paiPath("skills", "pai-core", "SKILL.md"), "utf8");
    expect(generated).toContain("PAI Algorithm Loop");
    expect(generated).toContain("repo-local PRD");
    expect(generated).toContain("Review");

    const installedPath = join(userSkillRoot(), "pai-core", "SKILL.md");
    if (!existsSync(installedPath)) return;
    const installed = readFileSync(installedPath, "utf8");
    expect(installed).toContain("PAI Algorithm Loop");
    expect(installed).toContain("repo-local PRD");
    expect(installed).toContain("Review");
  });
});
