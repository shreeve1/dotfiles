import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  isExcludedDirName
} from "./chunk-WMDUT4KH.js";
import {
  createDeadline,
  yieldIfOverBudget
} from "./chunk-QYF5S6P6.js";
import {
  isGeneratedArtifactDirectoryName
} from "./chunk-X35S7HSB.js";

// dist/clients/source-walker.js
import * as fs from "node:fs";
import * as path from "node:path";
function readDirEntriesSafe(dirPath) {
  try {
    return fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }
}
async function readDirEntriesSafeAsync(dirPath) {
  try {
    return await fs.promises.readdir(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }
}
function shouldRecurseIntoDir(entry, fullPath, policy, onGeneratedDirSkip) {
  if (isExcludedDirName(entry.name, policy.extraExcludeDirs ?? [])) {
    return false;
  }
  if (policy.ignoreMatcher.isIgnored(fullPath, true))
    return false;
  if (policy.skipGeneratedArtifactDirs === true && isGeneratedArtifactDirectoryName(entry.name)) {
    onGeneratedDirSkip?.();
    return false;
  }
  if (policy.followSymlinks !== true && entry.isSymbolicLink())
    return false;
  return true;
}
var DirectoryListing = class {
  #entries;
  #foldedNames;
  constructor(entries) {
    this.#entries = entries;
  }
  /**
   * False only when no entry of this directory could be the file at `target`
   * on any filesystem, so a caller may treat it as absent without asking the
   * filesystem. True means "possibly present": the caller still asks, which
   * keeps the exact verdict for a directory-named twin, a broken symlink or a
   * name that matches only case-sensitively. Names are case-folded and
   * NFC-normalized so a case-insensitive filesystem (Windows, default macOS)
   * or a normalization-insensitive one (macOS) never reports a real entry
   * absent. `target` must lie directly in the listed directory.
   */
  mayContain(target) {
    this.#foldedNames ??= new Set(this.#entries.map((entry) => foldEntryName(entry.name)));
    return this.#foldedNames.has(foldEntryName(path.basename(target)));
  }
};
function foldEntryName(name) {
  return name.normalize("NFC").toLowerCase();
}
function* walkTreeStackSteps(rootDir, visit, shouldStop) {
  const stack = [rootDir];
  while (stack.length > 0) {
    if (shouldStop?.())
      return false;
    const dir = stack.pop();
    if (dir === void 0)
      continue;
    const entries = (yield dir) ?? [];
    const listing = new DirectoryListing(entries);
    const subDirs = [];
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const disposition = visit(entry, fullPath, listing);
      if (disposition === "stop")
        return true;
      if (disposition === "recurse")
        subDirs.push(fullPath);
      yield void 0;
    }
    for (let i = subDirs.length - 1; i >= 0; i--)
      stack.push(subDirs[i]);
  }
  return false;
}
function walkTreeStackSync(rootDir, visit, opts = {}) {
  const steps = walkTreeStackSteps(rootDir, visit, opts.shouldStop);
  let step = steps.next();
  while (!step.done) {
    step = steps.next(step.value === void 0 ? void 0 : readDirEntriesSafe(step.value));
  }
  return step.value;
}
async function walkTreeStackAsync(rootDir, visit, opts) {
  await opts.beforeWalk?.();
  const steps = walkTreeStackSteps(rootDir, visit, opts.shouldStop);
  const deadline = createDeadline(opts.budgetMs ?? 8);
  let step = steps.next();
  while (!step.done) {
    if (step.value !== void 0) {
      step = steps.next(await readDirEntriesSafeAsync(step.value));
      deadline.reset();
      continue;
    }
    if (deadline.expired())
      await yieldIfOverBudget(deadline);
    step = steps.next();
  }
  return step.value;
}
function walkTreeRecursiveSync(rootDir, visit) {
  function scan(currentDir) {
    const entries = readDirEntriesSafe(currentDir);
    const listing = new DirectoryListing(entries);
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const disposition = visit(entry, fullPath, listing);
      if (disposition === "stop")
        return true;
      if (disposition === "recurse" && scan(fullPath))
        return true;
    }
    return false;
  }
  return scan(rootDir);
}

export {
  readDirEntriesSafe,
  readDirEntriesSafeAsync,
  shouldRecurseIntoDir,
  walkTreeStackSync,
  walkTreeStackAsync,
  walkTreeRecursiveSync
};
