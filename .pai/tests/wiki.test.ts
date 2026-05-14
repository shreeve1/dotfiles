import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { bootstrapWiki, ingestWikiSource, listWikiSources, paiSystemWikiRoot, planWikiIngest, readWikiPage, searchWiki, validateWiki } from "../src/wiki";

let runtimeHome: string | undefined;
let dotfilesPaiDir: string | undefined;

afterEach(() => {
  if (runtimeHome) rmSync(runtimeHome, { recursive: true, force: true });
  if (dotfilesPaiDir) rmSync(dotfilesPaiDir, { recursive: true, force: true });
  runtimeHome = undefined;
  dotfilesPaiDir = undefined;
});

describe("PAI System Wiki", () => {
  test("lists v1 sources from tracked docs without creating runtime state", () => {
    const fixture = createFixture();
    const sources = listWikiSources(fixture);

    expect(sources.map((source) => source.source_id)).toContain("pai/PAI/README.md");
    expect(sources.map((source) => source.source_id)).toContain("pai/PAI/MEMORYSYSTEM.md");
    expect(sources.map((source) => source.source_id)).toContain("pai/docs/shared-harness-design.md");
    expect(existsSync(join(runtimeHome!, "memory"))).toBe(false);
  });

  test("plans deterministic local wiki targets for a source id", () => {
    const fixture = createFixture();
    const plan = planWikiIngest("pai/PAI/MEMORYSYSTEM.md", fixture);

    expect(plan.source.source_id).toBe("pai/PAI/MEMORYSYSTEM.md");
    expect(plan.wiki_root).toBe(paiSystemWikiRoot(runtimeHome));
    expect(plan.targets.map((target) => target.kind)).toEqual(["source-note", "index", "log", "overview", "lint"]);
    expect(plan.targets[0].path).toContain("source-notes/pai-pai-memorysystem.md");
  });

  test("dry-run ingest does not write generated wiki files", () => {
    const fixture = createFixture();
    const result = ingestWikiSource("pai/PAI/MEMORYSYSTEM.md", { ...fixture, dryRun: true });

    expect(result.dry_run).toBe(true);
    expect(result.created).toEqual([]);
    expect(result.updated).toEqual([]);
    expect(existsSync(result.wiki_root)).toBe(false);
  });

  test("explicit ingest writes only under local runtime wiki root", () => {
    const fixture = createFixture();
    const result = ingestWikiSource("pai/PAI/MEMORYSYSTEM.md", fixture);

    expect(result.dry_run).toBe(false);
    expect(existsSync(join(result.wiki_root, "index.md"))).toBe(true);
    expect(existsSync(join(result.wiki_root, "log.md"))).toBe(true);
    expect(result.created.every((path) => path.startsWith(result.wiki_root))).toBe(true);
    expect(readFileSync(join(result.wiki_root, "source-notes", "pai-pai-memorysystem.md"), "utf8")).toContain("source_id: pai/PAI/MEMORYSYSTEM.md");
  });

  test("validate reports missing required runtime files", () => {
    const fixture = createFixture();
    mkdirSync(paiSystemWikiRoot(runtimeHome), { recursive: true });
    const result = validateWiki(fixture);

    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.path)).toContain(join(paiSystemWikiRoot(runtimeHome), "index.md"));
  });

  test("bootstrap is dry-run and follows discovered source set", () => {
    const fixture = createFixture();
    const result = bootstrapWiki(fixture);

    expect(result.dry_run).toBe(true);
    expect(result.source_count).toBeGreaterThanOrEqual(3);
    expect(existsSync(join(runtimeHome!, "memory"))).toBe(false);
  });

  test("read resolves a page by relative path", () => {
    const fixture = createFixture();
    seedWikiPages(paiSystemWikiRoot(runtimeHome));
    const result = readWikiPage("concepts/action.md", fixture);

    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.title).toBe("Action");
    expect(result.type).toBe("concept");
    expect(result.relative_path).toBe("concepts/action.md");
    expect(result.content).toContain("Atomic Action");
  });

  test("read resolves a page by alias", () => {
    const fixture = createFixture();
    seedWikiPages(paiSystemWikiRoot(runtimeHome));
    const result = readWikiPage("Skill Customization", fixture);

    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.relative_path).toBe("concepts/skill-customization.md");
    expect(result.aliases).toContain("Skill Customization");
  });

  test("read returns structured error with close matches when not found", () => {
    const fixture = createFixture();
    seedWikiPages(paiSystemWikiRoot(runtimeHome));
    const result = readWikiPage("acton", fixture);

    expect("error" in result).toBe(true);
    if (!("error" in result)) return;
    expect(result.error).toBe("not-found");
    expect(result.close_matches.some((match) => match.title === "Action")).toBe(true);
  });

  test("read rejects paths outside the wiki root", () => {
    const fixture = createFixture();
    seedWikiPages(paiSystemWikiRoot(runtimeHome));
    const result = readWikiPage("../escape.md", fixture);

    expect("error" in result).toBe(true);
    if (!("error" in result)) return;
    expect(result.error).toBe("outside-wiki");
  });

  test("read rejects absolute paths as outside-wiki", () => {
    const fixture = createFixture();
    seedWikiPages(paiSystemWikiRoot(runtimeHome));
    const result = readWikiPage("/etc/passwd", fixture);

    expect("error" in result).toBe(true);
    if (!("error" in result)) return;
    expect(result.error).toBe("outside-wiki");
  });

  test("read alias lookup is case-insensitive", () => {
    const fixture = createFixture();
    seedWikiPages(paiSystemWikiRoot(runtimeHome));
    const lower = readWikiPage("atomic action", fixture);
    const upper = readWikiPage("ATOMIC ACTION", fixture);

    expect("error" in lower).toBe(false);
    expect("error" in upper).toBe(false);
    if ("error" in lower || "error" in upper) return;
    expect(lower.relative_path).toBe("concepts/action.md");
    expect(upper.relative_path).toBe("concepts/action.md");
  });

  test("search returns scored hits with snippets for known terms", () => {
    const fixture = createFixture();
    seedWikiPages(paiSystemWikiRoot(runtimeHome));
    const result = searchWiki("atomic action", fixture);

    expect(result.hit_count).toBeGreaterThan(0);
    const top = result.hits[0];
    expect(top.relative_path).toBe("concepts/action.md");
    expect(top.confidence).toBeGreaterThan(0);
    expect(top.matches.length).toBeGreaterThan(0);
  });

  test("search returns zero hits when nothing matches", () => {
    const fixture = createFixture();
    seedWikiPages(paiSystemWikiRoot(runtimeHome));
    const result = searchWiki("zzzz-nonexistent-token", fixture);

    expect(result.hit_count).toBe(0);
    expect(result.hits).toEqual([]);
  });
});

function seedWikiPages(wikiRoot: string) {
  mkdirSync(join(wikiRoot, "concepts"), { recursive: true });
  mkdirSync(join(wikiRoot, "subsystems"), { recursive: true });
  writeFileSync(join(wikiRoot, "index.md"), "---\ntype: index\nstatus: current\nupdated: 2026-05-13\n---\n\n# Index\n\n- concepts/action.md\n");
  writeFileSync(join(wikiRoot, "log.md"), "---\ntype: log\nstatus: current\nupdated: 2026-05-13\n---\n\n# Log\n");
  writeFileSync(join(wikiRoot, "overview.md"), `---\ntype: overview\nstatus: current\naliases:\n  - PAI System Wiki\nderived_from: []\nupdated: 2026-05-13\nconfidence: medium\n---\n\n# PAI System Wiki\n\n## Summary\nThe PAI System Wiki is a derived synthesis layer.\n\n## Key Claims\n- The wiki is derived-only. Evidence: \`pai/docs/wiki/PAI_SYSTEM_WIKI.md:38-50\`.\n\n## Relationships\n- [[Action]]\n\n## Source Evidence\n- \`pai/docs/wiki/PAI_SYSTEM_WIKI.md:38-50\`\n\n## Open Questions\n- None.\n\n## Change Notes\n- 2026-05-13: seed.\n`);
  writeFileSync(join(wikiRoot, "concepts", "action.md"), `---\ntype: concept\nstatus: current\naliases:\n  - Action\n  - Atomic Action\nderived_from:\n  - source_id: pai/PAI/ACTIONS.md\nupdated: 2026-05-13\nconfidence: high\n---\n\n# Action\n\n## Summary\nAn Action is PAI's atomic execution primitive: a single-purpose unit of work that takes JSON in and returns JSON out.\n\n## Key Claims\n- Actions are atomic, composable units of work. Evidence: \`pai/PAI/ACTIONS.md:5-18\`.\n- Action names use \`A_\` prefix and UPPER_SNAKE_CASE. Evidence: \`pai/PAI/ACTIONS.md:70-86\`.\n\n## Relationships\n- [[Pipeline]]\n\n## Source Evidence\n- \`pai/PAI/ACTIONS.md:5-18\`\n\n## Open Questions\n- None.\n\n## Change Notes\n- 2026-05-13: seed.\n`);
  writeFileSync(join(wikiRoot, "concepts", "skill-customization.md"), `---\ntype: concept\nstatus: current\naliases:\n  - Skill Customization\n  - Customizing Skills\nderived_from:\n  - source_id: pai/PAI/SKILLSYSTEM.md\nupdated: 2026-05-13\nconfidence: medium\n---\n\n# Skill Customization\n\n## Summary\nSkill customization is the process of tailoring built-in skills with local instructions.\n\n## Key Claims\n- Skill customization preserves the upstream skill while layering overrides. Evidence: \`pai/PAI/SKILLSYSTEM.md:10-30\`.\n\n## Relationships\n- [[Skill System]]\n\n## Source Evidence\n- \`pai/PAI/SKILLSYSTEM.md:10-30\`\n\n## Open Questions\n- None.\n\n## Change Notes\n- 2026-05-13: seed.\n`);
}

function createFixture() {
  runtimeHome = mkdtempSync(join(tmpdir(), "pai-wiki-runtime-"));
  dotfilesPaiDir = mkdtempSync(join(tmpdir(), "pai-wiki-dotfiles-"));
  mkdirSync(join(dotfilesPaiDir, "PAI", "Algorithm"), { recursive: true });
  mkdirSync(join(dotfilesPaiDir, "docs"), { recursive: true });
  writeFileSync(join(dotfilesPaiDir, "PAI", "README.md"), "# PAI\n");
  writeFileSync(join(dotfilesPaiDir, "PAI", "MEMORYSYSTEM.md"), "# Memory System\n\nRuntime memory docs.\n");
  writeFileSync(join(dotfilesPaiDir, "PAI", "CONTEXT_ROUTING.md"), "| Memory system | `PAI/MEMORYSYSTEM.md` |\n");
  writeFileSync(join(dotfilesPaiDir, "PAI", "Algorithm", "v6.3.0.md"), "# Algorithm\n");
  writeFileSync(join(dotfilesPaiDir, "docs", "shared-harness-design.md"), "# Shared Harness\n");
  writeFileSync(join(dotfilesPaiDir, "PAI", "doc-dependencies.json"), JSON.stringify({
    authoritative_docs: {
      "MEMORYSYSTEM.md": { description: "Memory system detailed documentation", tier: 2 },
    },
  }));
  return { runtimeHome, dotfilesPaiDir };
}
