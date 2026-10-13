import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);

// dist/scripts/lib/web-tree-sitter-dir.mjs
import * as fs from "node:fs";
import * as path from "node:path";
var WEB_TREE_SITTER = "web-tree-sitter";
var RUNTIME_WASM = "tree-sitter.wasm";
function isWebTreeSitterPackageDir(dir) {
  try {
    if (!fs.existsSync(path.join(dir, RUNTIME_WASM)))
      return false;
    const manifest = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
    return manifest?.name === WEB_TREE_SITTER;
  } catch {
    return false;
  }
}
function packageDirOf(resolvedFile) {
  let dir = path.dirname(resolvedFile);
  for (; ; ) {
    if (isWebTreeSitterPackageDir(dir))
      return dir;
    const parent = path.dirname(dir);
    if (parent === dir)
      return void 0;
    dir = parent;
  }
}
function resolveWebTreeSitterPackageDir(deps) {
  for (const specifier of [
    `${WEB_TREE_SITTER}/${RUNTIME_WASM}`,
    WEB_TREE_SITTER
  ]) {
    try {
      const dir = packageDirOf(deps.resolve(specifier));
      if (dir)
        return dir;
    } catch {
    }
  }
  for (const base of [deps.packageRoot, deps.cwd]) {
    try {
      const candidate = path.join(base(), "node_modules", WEB_TREE_SITTER);
      if (isWebTreeSitterPackageDir(candidate))
        return candidate;
    } catch {
    }
  }
  return void 0;
}
function findCoreGrammarDir({ packageRoot, webTreeSitterDir }) {
  return [
    path.join(packageRoot, "grammars"),
    webTreeSitterDir && path.join(webTreeSitterDir, "grammars")
  ].find((dir) => dir && fs.existsSync(path.join(dir, "tree-sitter-typescript.wasm")));
}

export {
  resolveWebTreeSitterPackageDir,
  findCoreGrammarDir
};
