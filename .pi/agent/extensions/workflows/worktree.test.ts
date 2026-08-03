import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { existsSync } from "node:fs";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { test } from "node:test";
import { slugifyWorktreeName, WorktreeManager } from "./worktree.ts";

function gitAvailable(): boolean {
  try {
    execFileSync("git", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function git(cwd: string, args: string[]): string {
  return execFileSync("git", args, {
    cwd,
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
  });
}

function initRepo(): string {
  const repo = mkdtempSync(path.join(tmpdir(), "pi-workflows-worktree-"));
  git(repo, ["init", "--quiet", "--initial-branch=main"]);
  git(repo, ["config", "user.email", "test@example.com"]);
  git(repo, ["config", "user.name", "Test"]);
  git(repo, ["config", "commit.gpgsign", "false"]);
  // One commit so HEAD exists and `git worktree add` has something to check out.
  execFileSync("git", ["commit", "--allow-empty", "-m", "init"], {
    cwd: repo,
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: "Test",
      GIT_AUTHOR_EMAIL: "test@example.com",
    },
    stdio: "ignore",
  });
  return repo;
}

if (!gitAvailable()) {
  // Single skipped placeholder; no real git worktree tests can run.
  test("git not on PATH — worktree suite skipped", { skip: true }, () => {});
} else {
  test("slugifyWorktreeName normalizes case, separators, and length", () => {
    assert.equal(slugifyWorktreeName("Hello World"), "hello-world");
    assert.equal(slugifyWorktreeName("Foo Bar!! Baz"), "foo-bar-baz");
    assert.equal(
      slugifyWorktreeName("  --leading--trailing--  "),
      "leading--trailing",
    );
    assert.equal(slugifyWorktreeName(""), "scope");
    assert.equal(slugifyWorktreeName("///"), "scope");
    assert.equal(slugifyWorktreeName("a".repeat(100)).length, 64);
    // Allowed punctuation preserved.
    assert.equal(slugifyWorktreeName("Agent.1_v2-test"), "agent.1_v2-test");
  });

  test("slugifyWorktreeName cannot start with a dash (git flag injection guard)", () => {
    assert.equal(slugifyWorktreeName("---foo"), "foo");
    assert.equal(slugifyWorktreeName("-rf"), "rf");
  });

  test("WorktreeManager.isGitRepo reflects the directory's git status", async () => {
    const repo = initRepo();
    const nonRepo = mkdtempSync(path.join(tmpdir(), "pi-workflows-nonrepo-"));
    try {
      const inside = new WorktreeManager({ runDir: repo, launchCwd: repo });
      const outside = new WorktreeManager({ runDir: repo, launchCwd: nonRepo });
      assert.equal(await inside.isGitRepo(), true);
      assert.equal(await outside.isGitRepo(), false);
    } finally {
      rmSync(repo, { recursive: true, force: true });
      rmSync(nonRepo, { recursive: true, force: true });
    }
  });

  test("WorktreeManager.create makes a real worktree listed by git", async () => {
    const repo = initRepo();
    const runDir = path.join(repo, "run");
    try {
      const manager = new WorktreeManager({ runDir, launchCwd: repo });
      const scope = await manager.create("My Scope!!");
      assert.equal(existsSync(scope.path), true);
      const listed = git(repo, ["worktree", "list", "--porcelain"]);
      assert.match(
        listed,
        new RegExp(scope.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      );
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });

  test("WorktreeManager.ownsPath recognizes only manager-owned paths", async () => {
    const repo = initRepo();
    const runDir = path.join(repo, "run");
    const unrelated = mkdtempSync(
      path.join(tmpdir(), "pi-workflows-unrelated-"),
    );
    const manager = new WorktreeManager({ runDir, launchCwd: repo });
    try {
      const scope = await manager.create("owned");
      assert.equal(manager.ownsPath(scope.path), true);
      assert.equal(manager.ownsPath(unrelated), false);
      assert.equal(manager.ownsPath(runDir), false);
    } finally {
      await manager.cleanup();
      rmSync(repo, { recursive: true, force: true });
      rmSync(unrelated, { recursive: true, force: true });
    }
  });

  test("WorktreeManager.create rejects duplicate names and rejects non-git dirs", async () => {
    const repo = initRepo();
    const nonRepo = mkdtempSync(path.join(tmpdir(), "pi-workflows-nonrepo-"));
    try {
      const manager = new WorktreeManager({ runDir: repo, launchCwd: repo });
      await manager.create("dup");
      await assert.rejects(
        () => manager.create("dup"),
        /already active in this run/,
      );

      const noGit = new WorktreeManager({ runDir: repo, launchCwd: nonRepo });
      await assert.rejects(
        () => noGit.create("anything"),
        /requires the workflow to run inside a git repository/,
      );
    } finally {
      rmSync(repo, { recursive: true, force: true });
      rmSync(nonRepo, { recursive: true, force: true });
    }
  });

  test("WorktreeManager.create rejects dot-only escape names", async () => {
    const repo = initRepo();
    const manager = new WorktreeManager({ runDir: repo, launchCwd: repo });
    try {
      await assert.rejects(() => manager.create(".."), /invalid worktree name/);
      await assert.rejects(() => manager.create("."), /invalid worktree name/);
    } finally {
      await manager.cleanup();
      rmSync(repo, { recursive: true, force: true });
    }
  });

  test("WorktreeManager.create reserves concurrent duplicate names atomically", async () => {
    const repo = initRepo();
    const manager = new WorktreeManager({ runDir: repo, launchCwd: repo });
    try {
      const results = await Promise.allSettled([
        manager.create("dup"),
        manager.create("dup"),
      ]);
      let fulfilled = 0;
      let rejected = 0;
      for (const result of results) {
        if (result.status === "fulfilled") {
          fulfilled += 1;
        } else {
          rejected += 1;
          assert.match(String(result.reason), /already active/);
        }
      }
      assert.equal(fulfilled, 1);
      assert.equal(rejected, 1);
      const listed = git(repo, ["worktree", "list", "--porcelain"]);
      // The primary checkout plus exactly one manager-created worktree.
      assert.equal((listed.match(/^worktree /gm) ?? []).length, 2);
    } finally {
      await manager.cleanup();
      rmSync(repo, { recursive: true, force: true });
    }
  });

  test("WorktreeManager.remove deletes the worktree and detaches it from git's list", async () => {
    const repo = initRepo();
    try {
      const manager = new WorktreeManager({ runDir: repo, launchCwd: repo });
      const scope = await manager.create("ephemeral");
      const before = git(repo, ["worktree", "list", "--porcelain"]);
      assert.match(
        before,
        new RegExp(scope.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      );
      await manager.remove("ephemeral");
      assert.equal(existsSync(scope.path), false);
      const after = git(repo, ["worktree", "list", "--porcelain"]);
      assert.doesNotMatch(
        after,
        new RegExp(scope.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      );
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });

  test("WorktreeManager.remove tolerates an unknown name", async () => {
    const repo = initRepo();
    try {
      const manager = new WorktreeManager({ runDir: repo, launchCwd: repo });
      await manager.remove("never-created");
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });

  test("WorktreeManager.cleanup removes every still-open worktree", async () => {
    const repo = initRepo();
    try {
      const manager = new WorktreeManager({ runDir: repo, launchCwd: repo });
      const a = await manager.create("alpha");
      const b = await manager.create("beta");
      assert.equal(existsSync(a.path), true);
      assert.equal(existsSync(b.path), true);
      await manager.cleanup();
      assert.equal(existsSync(a.path), false);
      assert.equal(existsSync(b.path), false);
      const listed = git(repo, ["worktree", "list", "--porcelain"]);
      assert.doesNotMatch(
        listed,
        new RegExp(a.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      );
      assert.doesNotMatch(
        listed,
        new RegExp(b.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      );
      await assert.rejects(() => manager.create("late"), /shutting down/);
      // Idempotent: cleanup on an empty manager is a no-op.
      await manager.cleanup();
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });
}
