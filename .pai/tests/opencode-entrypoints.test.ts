import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = join(import.meta.dir, "..", "..");

function runBunScript(script: string, ...args: string[]) {
  return Bun.spawnSync({
    cmd: ["bun", script, ...args],
    cwd: repoRoot,
    stdout: "pipe",
    stderr: "pipe",
  });
}

describe("OpenCode PAI entrypoints", () => {
  test("Algorithm CLI starts without legacy Claude hook imports", () => {
    const result = runBunScript(".pai/PAI/Tools/algorithm.ts", "--help");
    expect(result.exitCode).toBe(0);
    expect(result.stdout.toString()).toContain("THE ALGORITHM");
  });

  test("PAI CLI help starts and names OpenCode, not Claude Code", () => {
    const result = runBunScript(".pai/PAI/Tools/pai.ts", "help");
    const output = result.stdout.toString();
    expect(result.exitCode).toBe(0);
    expect(output).toContain("Launch OpenCode");
    expect(output).not.toContain("Update Claude Code");
  });

  test("RebuildPAI no-ops safely when component sources are absent", () => {
    const result = runBunScript(".pai/PAI/Tools/RebuildPAI.ts");
    expect(result.exitCode).toBe(0);
    expect(result.stdout.toString()).toContain("No Components directory found");
  });

  test("active entrypoints do not invoke Claude CLI or load ~/.claude", () => {
    const files = [
      ".pai/PAI/Tools/algorithm.ts",
      ".pai/PAI/Tools/pai.ts",
      ".pai/PAI/Tools/Banner.ts",
      ".pai/PAI/Tools/RebuildPAI.ts",
      ".pai/hooks/lib/identity.ts",
      ".pai/hooks/lib/prd-template.ts",
    ];

    for (const file of files) {
      const source = readFileSync(join(repoRoot, file), "utf8");
      expect(source).not.toContain(".claude");
      expect(source).not.toContain("claude -p");
      expect(source).not.toMatch(/spawn(?:Sync)?\(\[["']claude["']/);
    }
  });
});
