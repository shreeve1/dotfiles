import { describe, expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { buildOpenCodeArgs, buildOpenCodeMessage, formatTimeoutError } from "../PAI/Tools/Inference";

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

  test("Algorithm CLI uses the OpenCode memory work directory", () => {
    const source = readFileSync(join(repoRoot, ".pai/PAI/Tools/algorithm.ts"), "utf8");
    expect(source).toContain('const WORK_DIR = join(BASE_DIR, "memory", "WORK")');
    expect(source).toContain("targetDir = join(WORK_DIR, sessionSlug)");
    expect(source).toContain("const workDir = WORK_DIR");
    expect(source).not.toContain('join(BASE_DIR, "MEMORY", "WORK")');
  });

  test("OpenCode auto-approval is opt-in, not default", () => {
    const algorithmSource = readFileSync(join(repoRoot, ".pai/PAI/Tools/algorithm.ts"), "utf8");
    const ralphSource = readFileSync(join(repoRoot, ".pai/PAI/Tools/ralph-loop.sh"), "utf8");
    const permissionLines = `${algorithmSource}\n${ralphSource}`
      .split("\n")
      .filter((line) => line.includes("--dangerously-skip-permissions"));

    expect(algorithmSource).toContain("PAI_OPENCODE_AUTO_APPROVE");
    expect(ralphSource).toContain("PAI_OPENCODE_AUTO_APPROVE");
    expect(permissionLines.length).toBeGreaterThan(0);
    for (const line of permissionLines) {
      expect(line).not.toContain("opencode run");
      expect(line).not.toContain("spawnSync");
      expect(line).not.toContain("spawn(");
    }
  });

  test("OpenCode wildcard permissions ask by default", () => {
    const config = JSON.parse(readFileSync(join(repoRoot, ".config/opencode/opencode.json"), "utf8"));

    function collectWildcardPermissions(value: unknown): string[] {
      if (!value || typeof value !== "object") return [];
      const record = value as Record<string, unknown>;
      const current = typeof record["*"] === "string" ? [record["*"] as string] : [];
      return Object.values(record).reduce<string[]>((acc, child) => {
        acc.push(...collectWildcardPermissions(child));
        return acc;
      }, current);
    }

    expect(collectWildcardPermissions(config)).not.toContain("allow");
  });

  test("OpenCode mode and agent frontmatter does not auto-allow tools by default", () => {
    const frontmatterFiles = [
      ...readdirSync(join(repoRoot, ".config/opencode/modes"))
        .filter((file) => file.endsWith(".md"))
        .map((file) => join(repoRoot, ".config/opencode/modes", file)),
      ...readdirSync(join(repoRoot, ".config/opencode/agents"))
        .filter((file) => file.endsWith(".md"))
        .map((file) => join(repoRoot, ".config/opencode/agents", file)),
    ];

    for (const file of frontmatterFiles) {
      const source = readFileSync(file, "utf8");
      expect(source).not.toMatch(/^\s*"\*": allow$/m);
      expect(source).not.toMatch(/^\s*(write|edit|bash|read|grep|glob|patch|todowrite|webfetch): allow$/m);
    }
  });

  test("OpenCode Automation runtime does not execute Claude CLI", () => {
    const files = [
      ".config/opencode/skills/Automation/Tools/webhook-server.ts",
      ".config/opencode/skills/Automation/Tools/cron-wrapper.sh",
      ".config/opencode/skills/Automation/SKILL.md",
    ];

    for (const file of files) {
      const source = readFileSync(join(repoRoot, file), "utf8");
      expect(source).not.toContain("claude -p");
      expect(source).not.toContain("exec claude");
      expect(source).not.toContain("CLAUDE_BIN");
    }
  });

  test("Inference preserves system prompt as a separate section", () => {
    const message = buildOpenCodeMessage({
      systemPrompt: "Only answer in JSON.",
      userPrompt: "Summarize this.",
    });

    expect(message).toContain("<system_instructions>\nOnly answer in JSON.\n</system_instructions>");
    expect(message).toContain("<user_request>\nSummarize this.\n</user_request>");
  });

  test("Inference omits missing system prompt without stringifying undefined", () => {
    const message = buildOpenCodeMessage({ userPrompt: "Summarize this." });

    expect(message).toBe("Summarize this.");
    expect(message).not.toContain("undefined");
  });

  test("Inference runs opencode in pure mode to avoid plugin recursion", () => {
    const args = buildOpenCodeArgs(
      { systemPrompt: "Answer briefly.", userPrompt: "Reply ok." },
      "cliproxy/claude-haiku-4-5-20251001",
    );

    expect(args.slice(0, 4)).toEqual([
      "run",
      "--pure",
      "--model",
      "cliproxy/claude-haiku-4-5-20251001",
    ]);
    expect(args.join(" ")).not.toContain("--dangerously-skip-permissions");
  });

  test("Inference timeout errors preserve subprocess evidence", () => {
    const error = formatTimeoutError(
      5000,
      "partial stdout",
      "partial stderr",
    );

    expect(error).toContain("Timeout after 5000ms");
    expect(error).toContain("stderr:\npartial stderr");
    expect(error).toContain("stdout:\npartial stdout");
  });
});
