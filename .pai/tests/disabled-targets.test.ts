import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ACTIVE_SHARED_MEMORY_TARGETS, DISABLED_SHARED_MEMORY_TARGETS, renderInstallPlanFixture } from "../src/installer-contract";

describe("disabled shared-memory targets", () => {
  test("Claude and Codex default install fixtures are disabled", () => {
    for (const target of DISABLED_SHARED_MEMORY_TARGETS) {
      const fixture = renderInstallPlanFixture(target);
      expect(fixture.adapter_enablement.enabled).toBe(false);
      expect(fixture.adapter_enablement.explicit_user_approval).toBe(false);
    }
  });

  test("OpenCode and Pi default install fixtures remain active", () => {
    for (const target of ACTIVE_SHARED_MEMORY_TARGETS) {
      const fixture = renderInstallPlanFixture(target);
      expect(fixture.adapter_enablement.enabled).toBe(true);
      expect(fixture.adapter_enablement.explicit_user_approval).toBe(true);
    }
  });

  test("OpenCode PAI memory plugins do not reference Claude memory paths", () => {
    const pluginRoot = join(import.meta.dir, "..", "..", ".config", "opencode", "plugins");
    const files = [
      join(pluginRoot, "pai-mode-router", "index.ts"),
      join(pluginRoot, "pai-isa-sync", "index.ts"),
    ];

    for (const file of files) {
      expect(readFileSync(file, "utf8")).not.toContain("~/.claude");
    }
  });
});
