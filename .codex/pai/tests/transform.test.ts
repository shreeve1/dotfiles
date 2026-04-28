import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import {
  assertNoProhibitedTerms,
  isTextFile,
  parseFrontmatter,
  prohibitedRuntimeTerms,
  rewriteCodexReferences,
  sanitizeGeneratedText,
  slugify,
} from "../lib/transform";
import { defaultUpstreamReleasePath, dotfilesPath, paiPath } from "../lib/paths";

describe("PAI transform helpers", () => {
  test("parses frontmatter", () => {
    const doc = parseFrontmatter("---\nname: Demo\ndescription: Test skill\n---\nBody");
    expect(doc.data.name).toBe("Demo");
    expect(doc.data.description).toBe("Test skill");
    expect(doc.body.trim()).toBe("Body");
  });

  test("rewrites Codex references", () => {
    const rewritten = rewriteCodexReferences("Read ~/.claude/PAI and CLAUDE.md, then use WebSearch.");
    expect(rewritten).toContain(".codex/pai/PAI");
    expect(rewritten).toContain("AGENTS.md");
    expect(rewritten).toContain("web search");
  });

  test("removes unsupported runtime lines", () => {
    const blocked = ["Voice", "Server"].join("");
    const sanitized = sanitizeGeneratedText(`# Title\n\n${blocked}\n\nUseful workflow`);
    expect(sanitized).toContain("Useful workflow");
    expect(sanitized).not.toContain(blocked);
  });

  test("removes agent startup and response-format control blocks", () => {
    const sanitized = sanitizeGeneratedText(
      [
        "# MANDATORY STARTUP SEQUENCE - DO THIS FIRST",
        "Load this before any work.",
        "---",
        "## MANDATORY OUTPUT FORMAT",
        "USE THE PAI FORMAT FOR ALL RESPONSES:",
        "SUMMARY: ...",
        "---",
        "## Core Identity",
        "Useful agent content.",
      ].join("\n"),
      { stripAgentControlBlocks: true },
    );
    expect(sanitized).toContain("Useful agent content.");
    expect(sanitized).not.toContain("STARTUP SEQUENCE");
    expect(sanitized).not.toContain("OUTPUT FORMAT");
    expect(sanitized).not.toContain("PAI FORMAT");
  });

  test("classifies text extensions without corrupting binary assets", () => {
    expect(isTextFile("Examples/setting-line-style.png")).toBe(false);
    expect(isTextFile("Tools/template.hbs")).toBe(true);
    expect(isTextFile("README.md")).toBe(true);
    expect(isTextFile("Patterns/loaded")).toBe(true);
  });

  test("path-derived slugs make duplicate names unique", () => {
    expect(slugify("Utilities/Documents/Pdf")).not.toBe(slugify("Utilities/Documents/Docx"));
  });

  test("generated files are clean after transform", () => {
    if (!existsSync(paiPath("skills"))) return;
    const findings = assertNoProhibitedTerms([paiPath(), dotfilesPath(".codex", "agents")]);
    expect(findings).toEqual([]);
    expect(prohibitedRuntimeTerms.length).toBeGreaterThan(0);
  });

  test("manifest records every upstream skill once", () => {
    const manifestPath = paiPath("config", "port-manifest.json");
    if (!existsSync(manifestPath)) return;
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    const expected = Bun.spawnSync(["find", join(defaultUpstreamReleasePath(), "skills"), "-name", "SKILL.md"], {
      stdout: "pipe",
    });
    const count = new TextDecoder().decode(expected.stdout).trim().split("\n").filter(Boolean).length + 1;
    expect(manifest.items.filter((item: any) => item.kind === "skill")).toHaveLength(count);
  });
});
