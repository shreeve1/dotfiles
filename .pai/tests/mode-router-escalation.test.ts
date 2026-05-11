import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = join(import.meta.dir, "..", "..");
const routerSource = readFileSync(
  join(repoRoot, ".config", "opencode", "plugins", "pai-mode-router", "index.ts"),
  "utf8",
);

describe("pai-mode-router escalation", () => {
  test("later prompts can escalate native sessions to Algorithm", () => {
    expect(routerSource).toContain("function shouldEscalateToAlgorithm(prompt: string)");
    expect(routerSource).toContain('existing.mode !== "ALGORITHM"');
    expect(routerSource).toContain("shouldEscalateToAlgorithm(prompt)");
    expect(routerSource).toContain('existing.mode = "ALGORITHM"');
  });

  test("Algorithm primer fires on activation turn, not only first turn", () => {
    expect(routerSource).toContain("algorithmActivatedMessageCount?: number");
    expect(routerSource).toContain("existing.algorithmActivatedMessageCount = messageCount");
    expect(routerSource).toContain("session.algorithmActivatedMessageCount = messageCount");
    expect(routerSource).toContain("session.messageCount !== session.algorithmActivatedMessageCount");
  });

  test("follow-up implementation phrases are escalation triggers", () => {
    expect(routerSource).toContain('"make this change"');
    expect(routerSource).toContain('"implement this"');
    expect(routerSource).toContain('"go ahead and"');
  });
});
