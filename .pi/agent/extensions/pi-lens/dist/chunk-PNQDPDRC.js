import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  isUnderDir,
  normalizeFilePath,
  pathsEqual,
  walkUpDirs
} from "./chunk-N2H3ZPZY.js";

// dist/clients/review-graph/git-identity.js
import * as fs from "node:fs";
import * as path from "node:path";
import { dirname, join as join2, resolve as resolve2 } from "node:path";
function createGitIdentityResolver() {
  const memo = /* @__PURE__ */ new Map();
  return (cwd) => {
    if (memo.has(cwd))
      return memo.get(cwd);
    const identity = resolveGitIdentity(cwd);
    memo.set(cwd, identity);
    return identity;
  };
}
function readCommonDir(gitDir) {
  try {
    const raw = fs.readFileSync(path.join(gitDir, "commondir"), "utf-8").trim();
    if (!raw)
      return gitDir;
    return path.isAbsolute(raw) ? raw : path.resolve(gitDir, raw);
  } catch {
    return gitDir;
  }
}
function resolveGitDir(cwd) {
  for (const dir of walkUpDirs(cwd)) {
    const gitPath = path.join(dir, ".git");
    let stat;
    try {
      stat = fs.statSync(gitPath);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      return {
        gitDir: gitPath,
        commonDir: readCommonDir(gitPath),
        worktreeRoot: dir
      };
    }
    if (stat.isFile()) {
      try {
        const contents = fs.readFileSync(gitPath, "utf-8").trim();
        const match = contents.match(/^gitdir:\s*(.+)$/);
        if (!match)
          return null;
        const linkedGitDir = path.isAbsolute(match[1]) ? match[1] : path.resolve(dir, match[1]);
        if (!fs.statSync(linkedGitDir).isDirectory())
          return null;
        return {
          gitDir: linkedGitDir,
          commonDir: readCommonDir(linkedGitDir),
          worktreeRoot: dir
        };
      } catch {
        return null;
      }
    }
    return null;
  }
  return null;
}
function getResolvedGitDir(cwd) {
  let resolved;
  try {
    resolved = resolveGitDir(cwd);
  } catch {
    resolved = null;
  }
  return resolved;
}
function canonicalDirectory(dir) {
  try {
    return fs.realpathSync.native(dir);
  } catch {
    return dir;
  }
}
function resolveGitCheckout(startPath) {
  const resolved = getResolvedGitDir(startPath);
  return resolved ? {
    root: canonicalDirectory(resolved.worktreeRoot),
    spelledRoot: resolved.worktreeRoot,
    commonDir: canonicalDirectory(resolved.commonDir)
  } : null;
}
function resolveLinkedWorktreeOwner(session, absoluteFile) {
  const owner = resolveGitCheckout(dirname(absoluteFile));
  return owner !== null && !pathsEqual(owner.root, session.root) && pathsEqual(owner.commonDir, session.commonDir) ? owner : null;
}
function listLinkedWorktreeRoots(commonDir) {
  const roots = [];
  let names;
  try {
    names = fs.readdirSync(join2(commonDir, "worktrees"));
  } catch {
    return roots;
  }
  for (const name of names) {
    try {
      const entryDir = join2(commonDir, "worktrees", name);
      const gitFile = fs.readFileSync(join2(entryDir, "gitdir"), "utf-8").trim();
      if (gitFile) {
        const root = canonicalDirectory(dirname(resolve2(entryDir, gitFile)));
        if (fs.existsSync(join2(root, ".git")))
          roots.push(root);
      }
    } catch {
    }
  }
  return roots;
}
function listNestedLinkedWorktreeRoots(scanRoot) {
  const checkout = resolveGitCheckout(scanRoot);
  if (!checkout)
    return [];
  const base = canonicalDirectory(scanRoot);
  const nested = [];
  for (const root of listLinkedWorktreeRoots(checkout.commonDir)) {
    if (!pathsEqual(root, base) && isUnderDir(root, base))
      nested.push(root);
  }
  return nested;
}
function resolveRefToSha(commonDir, ref) {
  try {
    const loose = fs.readFileSync(path.join(commonDir, ref), "utf-8").trim();
    if (loose)
      return loose;
  } catch {
  }
  try {
    const packed = fs.readFileSync(path.join(commonDir, "packed-refs"), "utf-8");
    for (const line of packed.split("\n")) {
      if (line.startsWith("#") || line.startsWith("^") || !line.trim())
        continue;
      const [sha, packedRef] = line.trim().split(/\s+/, 2);
      if (packedRef === ref)
        return sha;
    }
  } catch {
  }
  return null;
}
function resolveGitIdentity(cwd) {
  try {
    const resolved = getResolvedGitDir(cwd);
    if (!resolved)
      return void 0;
    const headRaw = fs.readFileSync(path.join(resolved.gitDir, "HEAD"), "utf-8").trim();
    const refMatch = headRaw.match(/^ref:\s*(.+)$/);
    let headCommit;
    if (refMatch) {
      headCommit = resolveRefToSha(resolved.commonDir, refMatch[1].trim());
    } else {
      headCommit = /^[0-9a-f]{7,40}$/i.test(headRaw) ? headRaw : null;
    }
    if (!headCommit)
      return void 0;
    return {
      headCommit,
      worktreeRoot: normalizeFilePath(resolved.worktreeRoot)
    };
  } catch {
    return void 0;
  }
}

export {
  createGitIdentityResolver,
  canonicalDirectory,
  resolveGitCheckout,
  resolveLinkedWorktreeOwner,
  listNestedLinkedWorktreeRoots,
  resolveGitIdentity
};
