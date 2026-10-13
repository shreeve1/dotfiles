import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  hasCargoWorkspaceTable,
  readCargoDependencyNames,
  readCargoPackageName,
  readCargoWorkspaceMembers
} from "./chunk-P7266HLM.js";
import {
  getProjectIgnoreMatcher,
  isExcludedDirName
} from "./chunk-C34ZXZ7O.js";
import {
  getWorkspaceManifestMarkers
} from "./chunk-XVF2VVXP.js";
import {
  normalizeMapKey
} from "./chunk-N2H3ZPZY.js";

// dist/clients/review-graph/workspace-modules.js
import * as fs from "node:fs";
import * as path from "node:path";
var MAX_WORKSPACE_CANDIDATES = 5e3;
var SOURCE_EXTS = /* @__PURE__ */ new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".py",
  ".go",
  ".rs",
  ".rb",
  ".cpp",
  ".c",
  ".cc",
  ".h",
  ".hpp"
]);
function readJsonSafe(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return void 0;
  }
}
function detectWorkspaceType(cwd) {
  const markers = getWorkspaceManifestMarkers(cwd);
  if (markers.hasPnpmWorkspaceYaml)
    return "pnpm";
  if (markers.hasGoWork)
    return "go";
  if (markers.hasCargoToml) {
    try {
      const content = fs.readFileSync(path.join(cwd, "Cargo.toml"), "utf-8");
      if (hasCargoWorkspaceTable(content)) {
        return "cargo";
      }
    } catch {
    }
  }
  if (markers.hasPackageJson) {
    const pkgJson = readJsonSafe(path.join(cwd, "package.json"));
    const workspaces = normalizeWorkspacePatterns(pkgJson?.workspaces);
    if (workspaces.length > 0)
      return "npm";
  }
  return null;
}
function stripQuotes(value) {
  return value.trim().replace(/^['"]|['"]$/g, "");
}
function normalizeWorkspacePatterns(value) {
  if (Array.isArray(value))
    return value.map(stripQuotes).filter(Boolean);
  if (value?.packages && Array.isArray(value.packages)) {
    return value.packages.map(stripQuotes).filter(Boolean);
  }
  return [];
}
function expandWorkspacePattern(cwd, pattern) {
  const normalized = stripQuotes(pattern.trim()).replace(/\\/g, "/");
  if (!normalized || normalized.startsWith("!"))
    return [];
  const starIndex = normalized.indexOf("*");
  if (starIndex === -1) {
    const root = path.resolve(cwd, normalized);
    return fs.existsSync(path.join(root, "package.json")) || fs.existsSync(path.join(root, "Cargo.toml")) || fs.existsSync(path.join(root, "go.mod")) ? [root] : [];
  }
  const prefix = normalized.slice(0, starIndex).replace(/\/$/, "");
  const baseDir = path.resolve(cwd, prefix || ".");
  let entries = [];
  try {
    entries = fs.readdirSync(baseDir, { withFileTypes: true });
  } catch {
    return [];
  }
  const ignoreMatcher = getProjectIgnoreMatcher(cwd);
  return entries.filter((entry) => {
    const fullPath = path.join(baseDir, entry.name);
    return entry.isDirectory() && !isExcludedDirName(entry.name) && !ignoreMatcher.isIgnored(fullPath, true);
  }).slice(0, MAX_WORKSPACE_CANDIDATES).map((entry) => path.join(baseDir, entry.name)).filter((root) => fs.existsSync(path.join(root, "package.json")) || fs.existsSync(path.join(root, "Cargo.toml")) || fs.existsSync(path.join(root, "go.mod")));
}
function depsFromPackageJson(pkgJson) {
  return Object.keys({
    ...pkgJson.dependencies,
    ...pkgJson.devDependencies,
    ...pkgJson.peerDependencies
  });
}
function extractYamlList(content, key) {
  const values = [];
  let inList = false;
  for (const rawLine of content.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith("#"))
      continue;
    if (!inList) {
      if (trimmed === `${key}:`)
        inList = true;
      continue;
    }
    if (trimmed.startsWith("-")) {
      const value = stripQuotes(trimmed.slice(1).trim()).replace(/\/$/, "");
      if (value)
        values.push(value);
      continue;
    }
    if (!rawLine.startsWith(" ") && !rawLine.startsWith("	"))
      break;
  }
  return values;
}
function moduleFromPackageJson(cwd, pkgRoot) {
  const pkgJson = readJsonSafe(path.join(pkgRoot, "package.json"));
  if (!pkgJson?.name)
    return null;
  return {
    name: pkgJson.name,
    root: normalizeMapKey(pkgRoot),
    relativePath: path.relative(cwd, pkgRoot).replace(/\\/g, "/"),
    entrypoints: pkgJson.main ? [pkgJson.main] : ["index.js"],
    internalDeps: [],
    externalDeps: depsFromPackageJson(pkgJson)
  };
}
function scanPnpmModules(cwd) {
  let patterns = [];
  try {
    const content = fs.readFileSync(path.join(cwd, "pnpm-workspace.yaml"), "utf-8");
    patterns = extractYamlList(content, "packages");
  } catch {
    return [];
  }
  return patterns.flatMap((pattern) => expandWorkspacePattern(cwd, pattern)).map((pkgRoot) => moduleFromPackageJson(cwd, pkgRoot)).filter((mod) => mod !== null);
}
function scanNpmModules(cwd) {
  const pkgJson = readJsonSafe(path.join(cwd, "package.json"));
  const patterns = normalizeWorkspacePatterns(pkgJson?.workspaces);
  return patterns.flatMap((pattern) => expandWorkspacePattern(cwd, pattern)).map((pkgRoot) => moduleFromPackageJson(cwd, pkgRoot)).filter((mod) => mod !== null);
}
function scanCargoModules(cwd) {
  let members = [];
  try {
    const content = fs.readFileSync(path.join(cwd, "Cargo.toml"), "utf-8");
    members = readCargoWorkspaceMembers(content);
  } catch {
    return [];
  }
  const modules = [];
  for (const member of members) {
    const pkgRoot = path.resolve(cwd, member);
    const memberToml = path.join(pkgRoot, "Cargo.toml");
    let name = "";
    let deps = [];
    try {
      const content = fs.readFileSync(memberToml, "utf-8");
      name = readCargoPackageName(content) ?? "";
      deps = readCargoDependencyNames(content);
    } catch {
      continue;
    }
    if (!name)
      continue;
    modules.push({
      name,
      root: normalizeMapKey(pkgRoot),
      relativePath: path.relative(cwd, pkgRoot).replace(/\\/g, "/"),
      entrypoints: ["src/lib.rs", "src/main.rs"],
      internalDeps: [],
      externalDeps: deps
    });
  }
  return modules;
}
function scanGoModules(cwd) {
  let dirs = [];
  try {
    const content = fs.readFileSync(path.join(cwd, "go.work"), "utf-8");
    dirs = [...content.matchAll(/(?:^|\s)(\.\/?[^\s)]+)/gm)].map((m) => m[1]);
  } catch {
    return [];
  }
  const modules = [];
  for (const dir of dirs) {
    const pkgRoot = path.resolve(cwd, dir);
    let name = "";
    try {
      const content = fs.readFileSync(path.join(pkgRoot, "go.mod"), "utf-8");
      const match = content.match(/^module\s+(\S+)/m);
      if (match)
        name = match[1];
    } catch {
      continue;
    }
    if (!name)
      continue;
    modules.push({
      name,
      root: normalizeMapKey(pkgRoot),
      relativePath: path.relative(cwd, pkgRoot).replace(/\\/g, "/"),
      entrypoints: ["."],
      internalDeps: [],
      externalDeps: []
    });
  }
  return modules;
}
function resolveInternalDeps(modules) {
  const nameSet = new Set(modules.map((m) => m.name));
  for (const mod of modules) {
    const internal = [];
    const external = [];
    for (const dep of mod.externalDeps) {
      if (nameSet.has(dep))
        internal.push(dep);
      else
        external.push(dep);
    }
    mod.internalDeps = internal;
    mod.externalDeps = external;
  }
}
function buildDependents(modules) {
  const dependents = /* @__PURE__ */ new Map();
  for (const mod of modules) {
    for (const dep of mod.internalDeps) {
      const list = dependents.get(dep) ?? [];
      list.push(mod.name);
      dependents.set(dep, list);
    }
  }
  return dependents;
}
var _moduleGraphCache = null;
function buildModuleGraph(cwd) {
  if (_moduleGraphCache && _moduleGraphCache.cwd === cwd) {
    return _moduleGraphCache.graph;
  }
  const type = detectWorkspaceType(cwd);
  if (!type)
    return null;
  let modules = [];
  switch (type) {
    case "pnpm":
      modules = scanPnpmModules(cwd);
      break;
    case "npm":
      modules = scanNpmModules(cwd);
      break;
    case "cargo":
      modules = scanCargoModules(cwd);
      break;
    case "go":
      modules = scanGoModules(cwd);
      break;
  }
  if (modules.length === 0)
    return null;
  resolveInternalDeps(modules);
  const graph = {
    root: cwd,
    modules: new Map(modules.map((m) => [m.name, m])),
    dependents: buildDependents(modules)
  };
  _moduleGraphCache = { cwd, graph };
  return graph;
}
function clearModuleGraphCache() {
  _moduleGraphCache = null;
  _moduleSourceFilesMemo.clear();
}
function findModuleForPath(graph, filePath) {
  const normalized = normalizeMapKey(filePath);
  let best;
  for (const mod of graph.modules.values()) {
    if (normalized === mod.root || normalized.startsWith(`${mod.root}/`)) {
      if (!best || mod.root.length > best.root.length)
        best = mod;
    }
  }
  return best;
}
function getDownstreamModules(graph, moduleName) {
  const downstream = /* @__PURE__ */ new Set();
  const queue = [moduleName];
  while (queue.length > 0) {
    const current = queue.shift();
    for (const dep of graph.dependents.get(current) ?? []) {
      if (!downstream.has(dep)) {
        downstream.add(dep);
        queue.push(dep);
      }
    }
  }
  return [...downstream];
}
var _moduleSourceFilesMemo = /* @__PURE__ */ new Map();
var MTIME_GRANULARITY_GUARD_MS = 2e3;
function isMemoEntryFresh(entry) {
  const validatedAt = Date.now();
  for (const { dir, mtimeMs, stampedAt } of entry.dirs) {
    if (validatedAt - stampedAt < MTIME_GRANULARITY_GUARD_MS)
      return false;
    try {
      if (fs.statSync(dir).mtimeMs !== mtimeMs)
        return false;
    } catch {
      return false;
    }
  }
  return true;
}
function getModuleSourceFiles(moduleRoot, maxFiles = 20) {
  const root = normalizeMapKey(moduleRoot);
  const ignoreMatcher = getProjectIgnoreMatcher(root);
  const cached = _moduleSourceFilesMemo.get(root);
  if (cached && cached.maxFiles === maxFiles && cached.matcher === ignoreMatcher && isMemoEntryFresh(cached)) {
    return [...cached.files];
  }
  const files = [];
  const dirs = [];
  let allDirsStamped = true;
  const visit = (dir, depth) => {
    if (files.length >= maxFiles || depth > 4)
      return;
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    try {
      dirs.push({
        dir,
        mtimeMs: fs.statSync(dir).mtimeMs,
        stampedAt: Date.now()
      });
    } catch {
      allDirsStamped = false;
    }
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (files.length >= maxFiles)
        break;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!isExcludedDirName(entry.name) && !ignoreMatcher.isIgnored(fullPath, true)) {
          visit(fullPath, depth + 1);
        }
        continue;
      }
      if (!entry.isFile())
        continue;
      if (!SOURCE_EXTS.has(path.extname(entry.name).toLowerCase()))
        continue;
      if (ignoreMatcher.isIgnored(fullPath, false))
        continue;
      files.push(normalizeMapKey(fullPath));
    }
  };
  visit(root, 0);
  if (allDirsStamped) {
    _moduleSourceFilesMemo.set(root, {
      files: [...files],
      maxFiles,
      dirs,
      matcher: ignoreMatcher
    });
  }
  return files;
}

export {
  buildModuleGraph,
  clearModuleGraphCache,
  findModuleForPath,
  getDownstreamModules,
  getModuleSourceFiles
};
