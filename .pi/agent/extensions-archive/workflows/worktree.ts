import { execFile } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

/** Sanitize a script-supplied worktree name into a filesystem/branch-safe slug. */
export function slugifyWorktreeName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return slug || "scope";
}

export interface WorktreeScope {
  path: string;
}

export class WorktreeManager {
  // slug → scope. The script's `name` is the same key the manager dedupes on.
  private readonly open = new Map<string, WorktreeScope>();
  private sealed = false;
  private readonly opening = new Set<string>();
  private readonly inFlight = new Set<Promise<unknown>>();
  private readonly baseDir: string;
  private readonly repoCwd: string;

  constructor(options: { runDir: string; launchCwd: string }) {
    this.baseDir = path.join(options.runDir, "worktrees");
    this.repoCwd = options.launchCwd;
  }

  /** True if `candidate` resolves to a path owned by this manager's worktree base
   *  dir. Canonicalizes both sides so a symlinked runDir cannot defeat containment. */
  ownsPath(candidate: string): boolean {
    let base: string;
    let target: string;
    try {
      base = fs.realpathSync(this.baseDir);
    } catch {
      base = path.resolve(this.baseDir);
    }
    try {
      target = fs.realpathSync(candidate);
    } catch {
      target = path.resolve(candidate);
    }
    const rel = path.relative(base, target);
    return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
  }

  /** True only when launchCwd is inside a git work tree. */
  async isGitRepo(): Promise<boolean> {
    try {
      const { stdout } = await run(
        "git",
        ["rev-parse", "--is-inside-work-tree"],
        { cwd: this.repoCwd },
      );
      return stdout.trim() === "true";
    } catch {
      return false;
    }
  }

  async create(name: string): Promise<WorktreeScope> {
    const slug = slugifyWorktreeName(name);
    if (this.sealed) {
      throw new Error("withWorktree(): the workflow run is shutting down");
    }
    if (slug === "." || slug === "..") {
      throw new Error("withWorktree(): invalid worktree name");
    }
    const wtPath = path.join(this.baseDir, slug);
    const rel = path.relative(this.baseDir, wtPath);
    if (rel === "" || rel.startsWith("..") || path.isAbsolute(rel)) {
      throw new Error("withWorktree(): invalid worktree name");
    }
    if (this.open.has(slug) || this.opening.has(slug)) {
      throw new Error(
        `withWorktree(): a worktree named "${slug}" is already active in this run`,
      );
    }
    this.opening.add(slug);
    const task = (async (): Promise<WorktreeScope> => {
      if (!(await this.isGitRepo())) {
        throw new Error(
          "withWorktree() requires the workflow to run inside a git repository",
        );
      }
      fs.mkdirSync(this.baseDir, { recursive: true });
      // Detached worktree at HEAD: never leaves a dangling branch behind.
      await run("git", ["worktree", "add", "--detach", wtPath, "HEAD"], {
        cwd: this.repoCwd,
      });
      const scope: WorktreeScope = { path: wtPath };
      this.open.set(slug, scope);
      return scope;
    })();
    this.inFlight.add(task);
    try {
      return await task;
    } finally {
      this.opening.delete(slug);
      this.inFlight.delete(task);
    }
  }

  async remove(name: string): Promise<void> {
    const slug = slugifyWorktreeName(name);
    const scope = this.open.get(slug);
    if (!scope) return;
    try {
      await run("git", ["worktree", "remove", "--force", scope.path], {
        cwd: this.repoCwd,
      });
      this.open.delete(slug);
    } catch {
      // Best-effort fallback: prune metadata. Only forget the worktree if the
      // path is actually gone, so the terminal cleanup sweep can retry a
      // still-present one.
      try {
        await run("git", ["worktree", "prune"], { cwd: this.repoCwd });
      } catch {
        /* ignore */
      }
      if (!fs.existsSync(scope.path)) this.open.delete(slug);
    }
  }

  /** Remove every still-open worktree; called on run settle to sweep orphans. */
  async cleanup(): Promise<void> {
    this.sealed = true;
    // Wait for any in-flight opens to finish so we don't miss a worktree that
    // is mid-creation when the run settles.
    await Promise.allSettled([...this.inFlight]);
    for (const slug of [...this.open.keys()]) await this.remove(slug);
  }
}
