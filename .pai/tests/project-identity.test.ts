import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import {
  manualProjectAliasesFile,
  resolveProjectIdentity,
} from "../src/project-identity";

describe("project identity resolver", () => {
  test("derives stable IDs from normalized git remote and repo root", () => {
    const first = resolveProjectIdentity({
      repoRoot: "/work/example",
      gitRemoteUrl: "git@github-personal:James/Example.git",
      runtimeHome: "/tmp/pai-runtime",
    });
    const second = resolveProjectIdentity({
      repoRoot: "/work/../work/example",
      gitRemoteUrl: "https://github.com/james/example.git",
      runtimeHome: "/tmp/pai-runtime",
    });

    expect(first).toEqual(second);
    expect(first.source).toBe("git_remote");
    expect(first.project_id).toStartWith("git:");
    expect(first.display_alias).toBe("example");
  });

  test("strips credentials and private remote details before hashing", () => {
    const credentialedRemote = "https://james:token-placeholder@github.com/James/Secret.git";
    const withSecret = resolveProjectIdentity({
      repoRoot: "/home/james/private/secret",
      gitRemoteUrl: credentialedRemote,
      runtimeHome: "/tmp/pai-runtime",
    });
    const withoutSecret = resolveProjectIdentity({
      repoRoot: "/home/james/private/secret",
      gitRemoteUrl: "https://github.com/James/Secret.git",
      runtimeHome: "/tmp/pai-runtime",
    });

    expect(withSecret.project_id).toBe(withoutSecret.project_id);
    expect(JSON.stringify(withSecret)).not.toContain("token-placeholder");
    expect(JSON.stringify(withSecret)).not.toContain("james:token");
    expect(JSON.stringify(withSecret)).not.toContain("/home/james/private");
  });

  test("uses path fallback as a stable hash with a separate display alias", () => {
    const identity = resolveProjectIdentity({
      repoRoot: "/home/james/work/no-remote-project",
      runtimeHome: "/tmp/pai-runtime",
    });

    expect(identity.source).toBe("path_fallback");
    expect(identity.project_id).toStartWith("path:");
    expect(identity.project_id).not.toContain("/home/james/work");
    expect(identity.display_alias).toBe("no-remote-project");
  });

  test("keeps manual aliases runtime-local under the PAI runtime home", () => {
    const identity = resolveProjectIdentity({
      repoRoot: "/repo/root",
      manualAlias: "Team Project",
      runtimeHome: "/tmp/pai-runtime",
    });

    expect(manualProjectAliasesFile("/tmp/pai-runtime")).toBe(join("/tmp/pai-runtime", "project-aliases.json"));
    expect(identity.source).toBe("manual_alias");
    expect(identity.display_alias).toBe("Team-Project");
    expect(identity.alias_file).toBe(join("/tmp/pai-runtime", "project-aliases.json"));
    expect(identity.alias_file).not.toContain("dotfiles");
  });

  test("handles project ID collisions without changing display aliases", () => {
    const original = resolveProjectIdentity({ repoRoot: "/repo/root", runtimeHome: "/tmp/pai-runtime" });
    const collision = resolveProjectIdentity({
      repoRoot: "/repo/root",
      runtimeHome: "/tmp/pai-runtime",
      existingProjectIds: new Set([original.project_id]),
    });

    expect(collision.project_id).toBe(`${original.project_id}-2`);
    expect(collision.display_alias).toBe(original.display_alias);
  });
});
