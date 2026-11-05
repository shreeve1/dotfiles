import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  buildModuleGraph
} from "./chunk-CUDD35TW.js";
import {
  aliasedImportTargets,
  referencedProjectImportTarget
} from "./chunk-7ANZ7XDD.js";
import {
  getSharedTreeSitterClient,
  loadWebTreeSitter,
  logTreeSitterDiagnostic,
  resolveTreeSitterLanguage,
  wasmQueryInput
} from "./chunk-BHWW6FAX.js";
import {
  EXTENSION_TO_GRAMMAR,
  KIND_TO_GRAMMAR
} from "./chunk-PPKECBPP.js";
import {
  HOOK_WALL_BUDGET_MS
} from "./chunk-CKEQFGLT.js";
import {
  bounded
} from "./chunk-JYLOYTZD.js";
import {
  hashContentBytes,
  toRunnerDisplayPath
} from "./chunk-VPLBLWFO.js";
import {
  loadPiLensGlobalConfig
} from "./chunk-WMDUT4KH.js";
import {
  isFileKind
} from "./chunk-G5GV2Q7K.js";
import {
  isDeclarationFile
} from "./chunk-X35S7HSB.js";
import {
  incrementDegradationCount,
  recordDegradationOnce
} from "./chunk-2453RRJ2.js";
import {
  freshnessFromMtime
} from "./chunk-S26LC76R.js";
import {
  toPositiveFinite
} from "./chunk-VLQ7UKZH.js";
import {
  BoundedFifoMap,
  BoundedLruCache,
  isUnderDir,
  normalizeEphemeralMapKey,
  normalizeMapKey,
  walkUpDirs
} from "./chunk-GMROJJRN.js";

// dist/clients/blocker-freshness.js
import * as fs4 from "node:fs";
import * as nodePath from "node:path";

// dist/clients/lsp/implicit-scope.js
import * as fs from "node:fs";
import * as path from "node:path";

// dist/clients/deps/ast-grep-napi.js
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
var _require = createRequire(import.meta.url);
function loadAstGrepNapi() {
  try {
    const entry = _require.resolve("@ast-grep/napi");
    return import(pathToFileURL(entry).href);
  } catch {
    return import("@ast-grep/napi");
  }
}
function loadAstGrepNapiSync() {
  try {
    return _require("@ast-grep/napi");
  } catch {
    return void 0;
  }
}

// dist/clients/runtime-config.js
var _runnerTimeoutFloorCache;
function getRunnerTimeoutFloorMs() {
  if (_runnerTimeoutFloorCache !== void 0)
    return _runnerTimeoutFloorCache;
  const config = loadPiLensGlobalConfig();
  const configFloor = toPositiveFinite(config?.dispatch?.runnerTimeoutFloorMs);
  const envFloor = toPositiveFinite(process.env.PI_LENS_RUNNER_TIMEOUT_FLOOR_MS);
  _runnerTimeoutFloorCache = Math.max(configFloor, envFloor, 0);
  return _runnerTimeoutFloorCache;
}
var RUNTIME_CONFIG = {
  pipeline: {
    lspMaxFileBytes: 2 * 1024 * 1024,
    lspMaxFileLines: 5e3,
    cascadeMaxFiles: 5,
    cascadeMaxDiagnosticsPerFile: 20,
    // Hard cap on how long the pipeline will wait for an LSP client to spawn.
    // Keeps tool_result from blocking the TUI during cold LSP start (e.g.
    // pyright workspace indexing). The LSP server continues spawning in the
    // background; subsequent edits get full diagnostics once it is ready.
    lspSpawnBudgetMs: 5e3
  },
  dispatch: {
    runnerTimeoutMs: 3e4
  },
  crashNotice: {
    alwaysShowFirstN: 2,
    showEveryNth: 5
  },
  reviewGraph: {
    // Deprecated (#776): no longer read by `review-graph/builder.ts`, which
    // now derives its fallback from `project-scale.ts`'s `maxProjectFiles`
    // knob (reproducing this same 1,000 default at the default base). Left
    // in place only in case an external caller still reads the constant.
    maxFiles: 1e3,
    maxFileBytes: 1 * 1024 * 1024
  },
  turnEnd: {
    maxLines: 20,
    maxChars: 1e3
  }
};

// dist/clients/lsp/content-scan.js
function walkLfLines(content) {
  let lfNewlineCount = 0;
  let lastStart = 0;
  for (let i = content.indexOf("\n"); i !== -1; i = content.indexOf("\n", i + 1)) {
    lfNewlineCount++;
    lastStart = i + 1;
  }
  return { lfNewlineCount, lastStart };
}
var lastNewlineWalk;
function countLfNewlines(content) {
  const lfNewlineCount = walkLfLines(content).lfNewlineCount;
  lastNewlineWalk = { content, lfNewlineCount };
  return lfNewlineCount;
}
function reusedNewlineCount(content) {
  return lastNewlineWalk?.content === content ? lastNewlineWalk.lfNewlineCount : void 0;
}
function lastLfLineStart(content) {
  const lastNewline = content.lastIndexOf("\n");
  return lastNewline === -1 ? 0 : lastNewline + 1;
}
function scanDocumentContent(content) {
  const reused = reusedNewlineCount(content);
  if (content.indexOf("\r") === -1) {
    if (reused !== void 0) {
      return {
        lfNewlineCount: reused,
        lastLine: { index: reused, start: lastLfLineStart(content) }
      };
    }
    const { lfNewlineCount: lfNewlineCount2, lastStart } = walkLfLines(content);
    return {
      lfNewlineCount: lfNewlineCount2,
      lastLine: { index: lfNewlineCount2, start: lastStart }
    };
  }
  const lfNewlineCount = reused ?? walkLfLines(content).lfNewlineCount;
  let index = 0;
  let start = 0;
  for (let i = 0; i < content.length; i++) {
    const code = content.charCodeAt(i);
    if (code !== 10 && code !== 13)
      continue;
    if (code === 13 && content.charCodeAt(i + 1) === 10)
      i++;
    index++;
    start = i + 1;
  }
  return { lfNewlineCount, lastLine: { index, start } };
}
function lineTextAt(content, line) {
  if (!Number.isInteger(line) || line < 0)
    return "";
  let start = 0;
  for (let current = 0; current < line; current++) {
    const next = content.indexOf("\n", start);
    if (next === -1)
      return "";
    start = next + 1;
  }
  const end = content.indexOf("\n", start);
  return end === -1 ? content.slice(start) : content.slice(start, end);
}

// dist/clients/lsp/content-limits.js
var LSP_MAX_FILE_BYTES = RUNTIME_CONFIG.pipeline.lspMaxFileBytes;
var LSP_MAX_FILE_LINES = RUNTIME_CONFIG.pipeline.lspMaxFileLines;
function exceedsLspSyncLimits(content) {
  const sizeBytes = Buffer.byteLength(content, "utf-8");
  if (sizeBytes > LSP_MAX_FILE_BYTES) {
    return {
      tooLarge: true,
      reason: `${sizeBytes} bytes > ${LSP_MAX_FILE_BYTES} limit`
    };
  }
  const lineCount = countLfNewlines(content) + 1;
  if (lineCount > LSP_MAX_FILE_LINES) {
    return {
      tooLarge: true,
      reason: `${lineCount} lines > ${LSP_MAX_FILE_LINES} limit`
    };
  }
  return { tooLarge: false, reason: "" };
}

// dist/clients/lsp/implicit-scope.js
function isGoSourceFile(filePath) {
  return path.extname(filePath).toLowerCase() === ".go";
}
function seesJsTsGlobalScope(filePath) {
  return isFileKind(filePath, "jsts");
}
function inOneGoPackage(a, b) {
  return isGoSourceFile(a) && isGoSourceFile(b) && path.posix.dirname(a) === path.posix.dirname(b);
}
function recordUnknownRole(filePath, cause, err) {
  incrementDegradationCount({
    kind: "lsp-implicit-scope-unknown",
    subject: cause,
    reason: `${cause}: ${filePath}${err === void 0 ? "" : ` (${err instanceof Error ? err.message : String(err)})`} \u2014 unresolved, so the diagnostics cache refuses its entry and the blocker sweep and the cascade see no role for it`,
    metadata: {
      file: filePath,
      cause,
      ...err === void 0 ? {} : { err: err instanceof Error ? err.message : String(err) }
    }
  });
}
function goPackageFiles(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    recordUnknownRole(dir, "unreadable-go-dir", err);
    return void 0;
  }
  return entries.flatMap((entry) => entry.isFile() && isGoSourceFile(entry.name) ? [path.join(dir, entry.name)] : []);
}
function implicitScopeOf(filePath, feeds = feedsJsTsGlobalScope) {
  if (isGoSourceFile(filePath)) {
    return (other) => other !== filePath && inOneGoPackage(filePath, other);
  }
  if (seesJsTsGlobalScope(filePath)) {
    return (other) => other !== filePath && feeds(other);
  }
  return void 0;
}
function goPackageChangedAt(dir) {
  try {
    let changedAt = fs.statSync(dir).mtimeMs;
    for (const peer of goPackageFiles(dir) ?? []) {
      changedAt = Math.max(changedAt, fs.statSync(peer).mtimeMs);
    }
    return changedAt;
  } catch (err) {
    recordUnknownRole(dir, "unreadable-mtime", err);
    return void 0;
  }
}
var GO_HEADER_BYTES = 8 * 1024;
var KNOWN_GOOS = new Set("aix android darwin dragonfly freebsd hurd illumos ios js linux netbsd openbsd plan9 solaris wasip1 windows zos".split(" "));
var KNOWN_GOARCH = new Set("386 amd64 arm arm64 loong64 mips mips64 mips64le mipsle ppc64 ppc64le riscv64 s390x wasm".split(" "));
var GOOS_BY_PLATFORM = {
  win32: "windows",
  sunos: "solaris"
};
var GOARCH_BY_ARCH = { x64: "amd64", ia32: "386" };
var UNIX_GOOS = new Set("aix android darwin dragonfly freebsd hurd illumos ios linux netbsd openbsd solaris".split(" "));
function hostSatisfiesGoTag(tag) {
  const goos = process.env.GOOS || GOOS_BY_PLATFORM[process.platform] || process.platform;
  const goarch = process.env.GOARCH || GOARCH_BY_ARCH[process.arch] || process.arch;
  return tag === goos || tag === goarch || tag === "unix" && UNIX_GOOS.has(goos);
}
function goBuildExcludesHost(filePath, header) {
  const parts = path.basename(filePath, ".go").replace(/_test$/, "").split("_");
  const last = parts.at(-1) ?? "";
  const prev = parts.length > 2 ? parts.at(-2) ?? "" : "";
  if (parts.length > 1 && KNOWN_GOARCH.has(last)) {
    if (!hostSatisfiesGoTag(last))
      return true;
    if (KNOWN_GOOS.has(prev) && !hostSatisfiesGoTag(prev))
      return true;
  } else if (parts.length > 1 && KNOWN_GOOS.has(last) && !hostSatisfiesGoTag(last)) {
    return true;
  }
  const line = /^\/\/go:build[ \t](.*)$/m.exec(header);
  if (!line)
    return /^\/\/[ \t]*\+build[ \t]/m.test(header);
  const term = /^\s*(!?)([\w.]+)\s*$/.exec(line[1]);
  const tag = term?.[2] ?? "";
  if (!(KNOWN_GOOS.has(tag) || KNOWN_GOARCH.has(tag) || tag === "unix"))
    return true;
  return hostSatisfiesGoTag(tag) === (term?.[1] === "!");
}
function goHeaderOf(filePath) {
  let fd;
  try {
    fd = fs.openSync(filePath, "r");
    const buffer = Buffer.alloc(GO_HEADER_BYTES);
    const read = fs.readSync(fd, buffer, 0, GO_HEADER_BYTES, 0);
    return buffer.toString("utf8", 0, read);
  } catch (err) {
    recordUnknownRole(filePath, "unreadable-go-peer", err);
    return void 0;
  } finally {
    if (fd !== void 0)
      fs.closeSync(fd);
  }
}
function goPackageClauseOf(header) {
  const code = header.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, "");
  return /^\s*package\s+([\p{L}_][\p{L}\p{N}_]*)/mu.exec(code)?.[1];
}
function goPackagePeersOf(filePath) {
  const inScope = isGoSourceFile(filePath) ? implicitScopeOf(filePath) : void 0;
  const ownHeader = inScope && goHeaderOf(filePath);
  const clause = ownHeader ? goPackageClauseOf(ownHeader) : void 0;
  if (!inScope || !clause)
    return void 0;
  const testFile = isGoTestFile(filePath);
  return (peer) => {
    if (!inScope(peer) || isGoTestFile(peer) && !testFile)
      return false;
    const header = goHeaderOf(peer);
    return header !== void 0 && goPackageClauseOf(header) === clause && !goBuildExcludesHost(peer, header);
  };
}
function isGoTestFile(filePath) {
  return filePath.toLowerCase().endsWith("_test.go");
}
function probeFor(filePath) {
  switch (path.extname(filePath).toLowerCase()) {
    case ".ts":
    case ".tsx":
      return "ts-script-or-ambient";
    // ES and CommonJS module extensions: never a script, but a TS one can
    // still hold `declare global`.
    case ".mts":
    case ".cts":
      return "ambient";
    case ".js":
    case ".jsx":
      return "js-script";
    default:
      return void 0;
  }
}
function globalScopeRoleByName(filePath) {
  if (isDeclarationFile(filePath))
    return "feeds";
  return probeFor(filePath) ? void 0 : "none";
}
var MODULE_LINE = /^[ \t]*(?:import|export)\b/m;
var AMBIENT_DECLARATION = /\bdeclare\s+(?:global|module)\b/;
function globalScopeRoleByText(content) {
  return MODULE_LINE.test(content) && !AMBIENT_DECLARATION.test(content) ? "none" : void 0;
}
function classifyJsTsGlobalScope(filePath) {
  const byName = globalScopeRoleByName(filePath);
  if (byName)
    return byName;
  const probe = probeFor(filePath);
  let content;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch (err) {
    recordUnknownRole(filePath, "unreadable-file", err);
    return "unknown";
  }
  if (exceedsLspSyncLimits(content).tooLarge)
    return "unknown";
  const napi = loadAstGrepNapiSync();
  if (!napi) {
    recordDegradationOnce({
      kind: "ast-grep-napi-unavailable",
      subject: "implicit-scope",
      reason: "native addon failed to load; every created JS/TS file counts as feeding the global scope in the diagnostics cache, and its role is unknown to the blocker sweep and the cascade"
    });
    return "unknown";
  }
  const lang = probe === "js-script" ? napi.Lang.JavaScript : path.extname(filePath).toLowerCase() === ".tsx" ? napi.Lang.Tsx : napi.Lang.TypeScript;
  let root;
  try {
    root = napi.parse(lang, content).root();
  } catch (err) {
    recordUnknownRole(filePath, "parse-failed", err);
    return "unknown";
  }
  let isModule = false;
  for (const child of root.children()) {
    const kind = child.kind();
    if (kind === "import_statement" || kind === "export_statement") {
      isModule = true;
    } else if (kind === "ambient_declaration" && child.children().some((part) => part.kind() === "global" || part.kind() === "module")) {
      return "feeds";
    }
  }
  if (probe === "ambient" || isModule)
    return "none";
  if (probe === "js-script") {
    return ["require($$$ARGS)", "module.exports", "exports.$NAME"].some((pattern) => root.find(pattern) !== null) ? "none" : "feeds";
  }
  return "feeds";
}
function feedsJsTsGlobalScope(filePath) {
  return classifyJsTsGlobalScope(filePath) !== "none";
}

// dist/clients/path-birth.js
import * as fs2 from "node:fs";
var replacedPathBirths = new BoundedFifoMap(1024);
var inodeKey = (stat) => `${stat.dev}:${stat.ino}:${stat.birthtimeMs}`;
var appearedPaths = new BoundedFifoMap(1024);
function notePathAppeared(filePath, atMs = Date.now()) {
  appearedPaths.set(normalizeMapKey(filePath), atMs);
}
var birthIsCtimeAlias;
function birthTimeIsCtimeAlias() {
  if (birthIsCtimeAlias !== void 0)
    return birthIsCtimeAlias;
  birthIsCtimeAlias = false;
  if (process.platform === "linux") {
    try {
      const proc = fs2.statSync("/proc");
      birthIsCtimeAlias = proc.birthtimeMs !== 0 && proc.birthtimeMs === proc.ctimeMs;
    } catch {
    }
  }
  return birthIsCtimeAlias;
}
function pathBirthtimeMs(stat, filePath) {
  const appeared = filePath === void 0 ? void 0 : appearedPaths.get(normalizeMapKey(filePath));
  const inode = inodeBirthtimeMs(stat);
  if (appeared === void 0)
    return inode;
  return inode === void 0 ? appeared : Math.max(inode, appeared);
}
function inodeBirthtimeMs(stat) {
  if (!(stat.birthtimeMs > 0)) {
    recordDegradationOnce({
      kind: "lsp-file-birth-unknown",
      subject: "no-birth-time",
      reason: "the filesystem reports no birth time; a file created while a language server runs is announced as Changed (#4320)"
    });
    return void 0;
  }
  if (birthTimeIsCtimeAlias()) {
    recordDegradationOnce({
      kind: "lsp-file-birth-unknown",
      subject: "ctime-alias",
      reason: "Node reports ctime as the birth time (no statx); a file created while a language server runs is announced as Changed (#4320)"
    });
    return void 0;
  }
  return replacedPathBirths.get(inodeKey(stat)) ?? stat.birthtimeMs;
}

// dist/clients/review-graph/import-resolvers.js
import * as fs3 from "node:fs";
import * as path2 from "node:path";
function isWithin(cwd, p) {
  return isUnderDir(path2.resolve(p), path2.resolve(cwd));
}
function isFile(p) {
  try {
    return fs3.statSync(p).isFile();
  } catch {
    return false;
  }
}
function isDir(p) {
  try {
    return fs3.statSync(p).isDirectory();
  } catch {
    return false;
  }
}
function firstExistingFile(cwd, candidates) {
  for (const c of candidates) {
    if (isFile(c) && isWithin(cwd, c))
      return [normalizeMapKey(c)];
  }
  return [];
}
function sourceFilesIn(cwd, dir, ext) {
  if (!isDir(dir) || !isWithin(cwd, dir))
    return [];
  try {
    return fs3.readdirSync(dir).filter((n) => n.endsWith(ext)).map((n) => normalizeMapKey(path2.join(dir, n))).sort();
  } catch {
    return [];
  }
}
function resolveRelative(cwd, filePath, source, exts) {
  const base = path2.resolve(path2.dirname(filePath), source);
  return firstExistingFile(cwd, [base, ...exts.map((e) => base + e)]);
}
function resolveDart(cwd, filePath, source) {
  if (source.startsWith("package:") || source.startsWith("dart:"))
    return [];
  return resolveRelative(cwd, filePath, source, [".dart"]);
}
var JS_TS_EXT_RE = /\.(mjs|cjs|mts|cts|jsx?|tsx?)$/i;
function jsTsExtensionCandidates(base, strippedBase, ext) {
  const candidates = [];
  if (ext === ".mjs")
    candidates.push(`${strippedBase}.mts`);
  if (ext === ".cjs")
    candidates.push(`${strippedBase}.cts`);
  if (ext === ".mts")
    candidates.push(`${strippedBase}.mts`);
  if (ext === ".cts")
    candidates.push(`${strippedBase}.cts`);
  candidates.push(`${strippedBase}.ts`, `${strippedBase}.tsx`, `${strippedBase}.mts`, `${strippedBase}.cts`);
  candidates.push(base, `${strippedBase}.js`, `${strippedBase}.jsx`, `${strippedBase}.mjs`, `${strippedBase}.cjs`);
  for (const index of [
    "index.ts",
    "index.tsx",
    "index.mts",
    "index.cts",
    "index.js",
    "index.jsx",
    "index.mjs",
    "index.cjs"
  ]) {
    candidates.push(path2.join(base, index));
  }
  return [...new Set(candidates)];
}
function jsTsCandidatePaths(filePath, source) {
  const base = path2.resolve(path2.dirname(filePath), source);
  const strippedSource = source.replace(JS_TS_EXT_RE, "");
  const strippedBase = strippedSource === source ? base : path2.resolve(path2.dirname(filePath), strippedSource);
  const ext = path2.extname(source).toLowerCase();
  return jsTsExtensionCandidates(base, strippedBase, ext);
}
function findWorkspaceModuleForSpecifier(modules, source) {
  let best;
  for (const mod of modules) {
    let subpath;
    if (source === mod.name)
      subpath = "";
    else if (source.startsWith(`${mod.name}/`))
      subpath = source.slice(mod.name.length + 1);
    if (subpath === void 0)
      continue;
    if (!best || mod.name.length > best.mod.name.length)
      best = { mod, subpath };
  }
  return best;
}
function pickExportsMain(exportsField) {
  if (typeof exportsField === "string")
    return exportsField;
  if (!exportsField || typeof exportsField !== "object")
    return void 0;
  const obj = exportsField;
  const dot = obj["."] ?? obj;
  if (typeof dot === "string")
    return dot;
  if (dot && typeof dot === "object") {
    for (const key of ["import", "require", "default"]) {
      const v = dot[key];
      if (typeof v === "string")
        return v;
    }
  }
  return void 0;
}
function workspaceEntryCandidates(pkgRoot) {
  let main;
  try {
    const pkg = JSON.parse(fs3.readFileSync(path2.join(pkgRoot, "package.json"), "utf-8"));
    main = pickExportsMain(pkg.exports) ?? pkg.module ?? pkg.main;
  } catch {
  }
  const candidates = [];
  if (main) {
    const mainPath = path2.resolve(pkgRoot, main);
    const ext = path2.extname(mainPath).toLowerCase();
    const stripped = mainPath.replace(JS_TS_EXT_RE, "");
    candidates.push(...jsTsExtensionCandidates(mainPath, stripped, ext));
  }
  for (const base of [pkgRoot, path2.join(pkgRoot, "src")]) {
    candidates.push(path2.join(base, "index.ts"), path2.join(base, "index.tsx"), path2.join(base, "index.mts"), path2.join(base, "index.cts"), path2.join(base, "index.js"), path2.join(base, "index.jsx"), path2.join(base, "index.mjs"), path2.join(base, "index.cjs"));
  }
  return [...new Set(candidates)];
}
function workspaceSubpathCandidates(pkgRoot, subpath) {
  const base = path2.join(pkgRoot, subpath);
  const strippedSubpath = subpath.replace(JS_TS_EXT_RE, "");
  const strippedBase = strippedSubpath === subpath ? base : path2.join(pkgRoot, strippedSubpath);
  const ext = path2.extname(subpath).toLowerCase();
  return jsTsExtensionCandidates(base, strippedBase, ext);
}
function resolveAliasedImport(cwd, specifier, importerDir) {
  for (const target of aliasedImportTargets(specifier, importerDir)) {
    const ext = path2.extname(target).toLowerCase();
    const stripped = target.replace(JS_TS_EXT_RE, "");
    const found = firstExistingFile(cwd, jsTsExtensionCandidates(target, stripped, ext));
    if (found.length)
      return found;
  }
  return [];
}
function resolveProjectReferenceImport(cwd, specifier, importerDir) {
  const target = referencedProjectImportTarget(specifier, importerDir);
  return target ? firstExistingFile(cwd, [target]) : [];
}
function resolveWorkspacePackageImport(cwd, source) {
  if (source.startsWith("."))
    return [];
  const graph = buildModuleGraph(cwd);
  if (!graph)
    return [];
  const match = findWorkspaceModuleForSpecifier(graph.modules.values(), source);
  if (!match)
    return [];
  const candidates = match.subpath ? workspaceSubpathCandidates(match.mod.root, match.subpath) : workspaceEntryCandidates(match.mod.root);
  return firstExistingFile(cwd, candidates);
}
function resolveJsTs(cwd, filePath, source) {
  if (!source.startsWith(".")) {
    const aliased = resolveAliasedImport(cwd, source, path2.dirname(filePath));
    if (aliased.length)
      return aliased;
    const referenced = resolveProjectReferenceImport(cwd, source, path2.dirname(filePath));
    return referenced.length ? referenced : resolveWorkspacePackageImport(cwd, source);
  }
  return firstExistingFile(cwd, jsTsCandidatePaths(filePath, source));
}
function resolveCxx(cwd, filePath, source) {
  if (source.startsWith("<"))
    return [];
  const dir = path2.dirname(path2.resolve(filePath));
  return firstExistingFile(cwd, [
    path2.resolve(dir, source),
    path2.resolve(cwd, source),
    path2.resolve(cwd, "include", source),
    path2.resolve(cwd, "src", source)
  ]);
}
function pythonRoots(cwd, fileDir) {
  let p = fileDir;
  const root = path2.resolve(cwd);
  for (const dir of walkUpDirs(fileDir, { spelling: true })) {
    p = dir;
    if (!(isFile(path2.join(dir, "__init__.py")) && isWithin(cwd, dir)))
      break;
  }
  const roots = /* @__PURE__ */ new Set([p, root, path2.join(root, "src")]);
  return [...roots].filter((r) => isDir(r));
}
function resolvePython(cwd, filePath, source) {
  const fileDir = path2.dirname(path2.resolve(filePath));
  if (source.startsWith(".")) {
    const m = source.match(/^(\.+)(.*)$/);
    if (!m)
      return [];
    const dots = m[1].length;
    let baseDir = fileDir;
    for (let i = 1; i < dots; i++)
      baseDir = path2.dirname(baseDir);
    const rest = m[2] ? m[2].split(".") : [];
    const target = path2.join(baseDir, ...rest);
    return firstExistingFile(cwd, [
      `${target}.py`,
      path2.join(target, "__init__.py")
    ]);
  }
  const parts = source.split(".");
  for (const root of pythonRoots(cwd, fileDir)) {
    const target = path2.join(root, ...parts);
    const found = firstExistingFile(cwd, [
      `${target}.py`,
      path2.join(target, "__init__.py")
    ]);
    if (found.length)
      return found;
  }
  return [];
}
function findGoModule(cwd, filePath) {
  const start = path2.dirname(path2.resolve(filePath));
  const root = path2.resolve(cwd);
  for (const dir of walkUpDirs(start, { spelling: true })) {
    if (dir !== start && !isWithin(cwd, dir))
      break;
    try {
      const content = fs3.readFileSync(path2.join(dir, "go.mod"), "utf-8");
      const m = content.match(/^[^\S\n\r\u2028\u2029]*module\s+(\S+)/m);
      if (m)
        return { moduleDir: dir, modulePath: m[1] };
    } catch {
    }
    if (dir === root)
      break;
  }
  return null;
}
function resolveGo(cwd, filePath, source) {
  const mod = findGoModule(cwd, filePath);
  if (!mod)
    return [];
  if (source !== mod.modulePath && !source.startsWith(`${mod.modulePath}/`)) {
    return [];
  }
  const rel = source === mod.modulePath ? "" : source.slice(mod.modulePath.length + 1);
  return sourceFilesIn(cwd, path2.join(mod.moduleDir, rel), ".go");
}
function javaSourceRoots(cwd, filePath) {
  const root = path2.resolve(cwd);
  const roots = /* @__PURE__ */ new Set();
  for (const c of ["src/main/java", "src/test/java", "src", ""]) {
    roots.add(path2.join(root, c));
  }
  const start = path2.dirname(path2.resolve(filePath));
  for (const dir of walkUpDirs(start, { spelling: true })) {
    if (dir !== start && !isWithin(cwd, dir))
      break;
    roots.add(dir);
    if (dir === root)
      break;
  }
  return [...roots].filter((r) => isDir(r));
}
function resolveJava(cwd, filePath, source) {
  const parts = source.split(".");
  for (const root of javaSourceRoots(cwd, filePath)) {
    const asFile = firstExistingFile(cwd, [
      `${path2.join(root, ...parts)}.java`
    ]);
    if (asFile.length)
      return asFile;
    const asPkg = sourceFilesIn(cwd, path2.join(root, ...parts), ".java");
    if (asPkg.length)
      return asPkg;
    if (parts.length > 1) {
      const dropLast = firstExistingFile(cwd, [
        `${path2.join(root, ...parts.slice(0, -1))}.java`
      ]);
      if (dropLast.length)
        return dropLast;
    }
  }
  return [];
}
function importSourceNameParts(source) {
  return source.match(/[\w$-]+/g) ?? [];
}
function fileAnswerNames(file) {
  return [
    path2.basename(file).split(".")[0] ?? "",
    path2.basename(path2.dirname(file))
  ].flatMap((name) => name.length > 0 ? [name] : []);
}
function resolveImportToFiles(cwd, filePath, languageId, source) {
  switch (languageId) {
    case "typescript":
    case "tsx":
    case "javascript":
    case "jsts":
      return resolveJsTs(cwd, filePath, source);
    case "c":
    case "cpp":
      return resolveCxx(cwd, filePath, source);
    case "ruby":
      return resolveRelative(cwd, filePath, source, [".rb"]);
    case "zig":
      return resolveRelative(cwd, filePath, source, [".zig"]);
    case "bash":
      return resolveRelative(cwd, filePath, source, [".sh", ".bash"]);
    case "dart":
      return resolveDart(cwd, filePath, source);
    case "python":
      return resolvePython(cwd, filePath, source);
    case "go":
      return resolveGo(cwd, filePath, source);
    case "java":
      return resolveJava(cwd, filePath, source);
    default:
      return [];
  }
}

// dist/clients/tree-sitter-symbol-extractor.js
import * as path3 from "node:path";
var SYMBOL_QUERIES = {
  typescript: {
    defs: `
      ;; Function declarations: function foo(params) { }
      (function_declaration
        name: (identifier) @funcName
        parameters: (formal_parameters) @funcParams
        body: (statement_block) @funcBody) @funcDef
      
      ;; Arrow functions: const foo = (params) => { }
      (variable_declarator
        name: (identifier) @arrowName
        value: (arrow_function
          parameters: (formal_parameters) @arrowParams
          body: (_) @arrowBody)) @arrowDef
      
      ;; Class declarations: class Foo { }
      (class_declaration
        name: (type_identifier) @className) @classDef
      
      ;; Method definitions: class Foo { bar() { } }
      (method_definition
        name: (property_identifier) @methodName
        parameters: (formal_parameters) @methodParams) @methodDef
      
      ;; Interface declarations: interface Foo { }
      (interface_declaration
        name: (type_identifier) @interfaceName) @interfaceDef
      
      ;; Type alias: type Foo = ...
      (type_alias_declaration
        name: (type_identifier) @typeName) @typeDef
    `,
    refs: `
      ;; Function/method calls: foo() or obj.bar()
      (call_expression
        function: (identifier) @callIdent) @callRef
      
      (call_expression
        function: (member_expression
          object: (_)
          property: (property_identifier) @callMethod)) @callMethodRef
      
      ;; New expressions: new Foo()
      (new_expression
        constructor: (identifier) @newIdent) @newRef
      
      ;; Type references: type T = Foo
      (type_identifier) @typeIdent
    `
  },
  python: {
    defs: `
      ;; Function definitions: def foo(params):
      (function_definition
        name: (identifier) @funcName
        parameters: (parameters) @funcParams) @funcDef
      
      ;; Class definitions: class Foo:
      (class_definition
        name: (identifier) @className) @classDef
      
      ;; Method definitions (within class)
      (class_definition
        body: (block
          (function_definition
            name: (identifier) @methodName
            parameters: (parameters) @methodParams) @methodDef))
    `,
    refs: `
      ;; Function calls: foo() or obj.bar()
      (call
        function: (identifier) @callIdent) @callRef
      
      (call
        function: (attribute
          object: (_)
          attribute: (identifier) @callMethod)) @callMethodRef
    `
  },
  rust: {
    defs: `
      ;; Function definitions: fn foo(params) { }
      (function_item
        name: (identifier) @funcName
        parameters: (parameters) @funcParams) @funcDef
      
      ;; Struct definitions: struct Foo { }
      (struct_item
        name: (type_identifier) @structName) @structDef
      
      ;; Impl blocks: impl Foo { fn bar() { } }
      (impl_item
        type: (type_identifier) @implType
        body: (declaration_list
          (function_item
            name: (identifier) @implMethodName) @implMethodDef))
    `,
    refs: `
      ;; Function calls: foo() or obj.bar()
      (call_expression
        function: (identifier) @callIdent) @callRef
      
      (call_expression
        function: (field_expression
          value: (_)
          field: (field_identifier) @callField)) @callFieldRef
    `
  },
  go: {
    defs: `
      (function_declaration
        name: (identifier) @funcName
        parameters: (parameter_list) @funcParams) @funcDef

      (method_declaration
        name: (field_identifier) @methodName
        parameters: (parameter_list) @methodParams) @methodDef

      (type_spec
        name: (type_identifier) @typeName) @typeDef
    `,
    refs: `
      (call_expression
        function: (identifier) @callIdent) @callRef

      (call_expression
        function: (selector_expression
          field: (field_identifier) @callMethod)) @callMethodRef
    `
  },
  ruby: {
    defs: `
      (method
        name: (identifier) @methodName) @methodDef

      (singleton_method
        name: (identifier) @methodName) @methodDef

      (class
        name: (constant) @className) @classDef

      (module
        name: (constant) @moduleName) @moduleDef
    `,
    refs: `
      (call
        method: (identifier) @callIdent) @callRef

      (call
        method: (constant) @typeIdent) @typeRef
    `
  },
  c: {
    defs: `
      (function_definition
        declarator: (function_declarator
          declarator: (identifier) @funcName
          parameters: (parameter_list) @funcParams)) @funcDef

      (type_definition
        declarator: (type_identifier) @typeName) @typeDef

      (struct_specifier
        name: (type_identifier) @typeName) @typeDef

      (enum_specifier
        name: (type_identifier) @typeName) @typeDef
    `,
    refs: `
      (call_expression
        function: (identifier) @callIdent) @callRef

      (call_expression
        function: (field_expression
          field: (field_identifier) @callField)) @callFieldRef

      (type_identifier) @typeIdent
    `
  },
  cpp: {
    defs: `
      (function_definition
        declarator: (function_declarator
          declarator: (identifier) @funcName
          parameters: (parameter_list) @funcParams)) @funcDef

      (class_specifier
        name: (type_identifier) @className) @classDef

      (struct_specifier
        name: (type_identifier) @className) @classDef

      (type_definition
        declarator: (type_identifier) @typeName) @typeDef
    `,
    refs: `
      (call_expression
        function: (identifier) @callIdent) @callRef

      (call_expression
        function: (field_expression
          field: (field_identifier) @callField)) @callFieldRef

      (type_identifier) @typeIdent
    `
  },
  java: {
    defs: `
      (method_declaration
        name: (identifier) @methodName
        parameters: (formal_parameters) @methodParams) @methodDef

      (class_declaration
        name: (identifier) @className) @classDef

      (interface_declaration
        name: (identifier) @interfaceName) @interfaceDef

      (constructor_declaration
        name: (identifier) @funcName
        parameters: (formal_parameters) @funcParams) @funcDef

      (enum_declaration
        name: (identifier) @className) @classDef
    `,
    refs: `
      (method_invocation
        name: (identifier) @callMethod) @callRef

      (object_creation_expression
        type: (type_identifier) @newIdent) @newRef

      (type_identifier) @typeIdent
    `
  },
  kotlin: {
    // #251: class_declaration's name is type_identifier; the old extra
    // `(class_declaration (simple_identifier) @className)` was a bad pattern that
    // failed query compilation (taking the whole language down). Call refs use
    // no field name in the shipped grammar (the old `calleeExpression:` field
    // also failed to compile).
    defs: `
      (function_declaration
        (simple_identifier) @funcName) @funcDef

      (class_declaration
        (type_identifier) @className) @classDef

      (object_declaration
        (type_identifier) @className) @classDef
    `,
    refs: `
      (call_expression
        (simple_identifier) @callIdent) @callRef

      (user_type (type_identifier) @typeIdent)
    `
  },
  dart: {
    // #251: function_signature/class_definition take their name/params as direct
    // children in the shipped grammar — the old `name:`/`parameters:` fields did
    // not exist and failed query compilation. method bodies' inner
    // function_signature also matches @funcDef (methods surface as functions).
    defs: `
      (function_signature
        (identifier) @funcName
        (formal_parameter_list) @funcParams) @funcDef

      (class_definition
        (identifier) @className) @classDef
    `,
    refs: `
      (type_identifier) @typeIdent
    `
  },
  elixir: {
    defs: `
      (call
        target: (identifier) @_kw
        (arguments
          (call
            target: (identifier) @funcName
            (arguments) @funcParams) @funcDef)
        (#match? @_kw "^def[pm]?$"))

      (call
        target: (identifier) @_kw
        (arguments (alias) @moduleName) @moduleDef
        (#match? @_kw "^defmodule$"))
    `,
    refs: `
      (call
        target: (identifier) @callIdent) @callRef

      (alias) @typeIdent
    `
  },
  csharp: {
    defs: `
      (method_declaration
        name: (identifier) @methodName
        parameters: (parameter_list) @methodParams) @methodDef

      (class_declaration
        name: (identifier) @className) @classDef

      (struct_declaration
        name: (identifier) @className) @classDef

      (interface_declaration
        name: (identifier) @interfaceName) @interfaceDef

      (constructor_declaration
        name: (identifier) @funcName
        parameters: (parameter_list) @funcParams) @funcDef

      (enum_declaration
        name: (identifier) @className) @classDef
    `,
    refs: `
      (invocation_expression
        function: (identifier) @callIdent) @callRef

      (invocation_expression
        function: (member_access_expression
          name: (identifier) @callMethod)) @callMethodRef

      (object_creation_expression
        type: (identifier) @newIdent) @newRef
    `
  },
  php: {
    defs: `
      (function_definition
        name: (name) @funcName
        parameters: (formal_parameters) @funcParams) @funcDef

      (method_declaration
        name: (name) @methodName
        parameters: (formal_parameters) @methodParams) @methodDef

      (class_declaration
        name: (name) @className) @classDef

      (interface_declaration
        name: (name) @interfaceName) @interfaceDef

      (trait_declaration
        name: (name) @className) @classDef
    `,
    refs: `
      (function_call_expression
        function: (name) @callIdent) @callRef

      (member_call_expression
        name: (name) @callMethod) @callMethodRef

      (object_creation_expression
        (name) @newIdent) @newRef
    `
  },
  swift: {
    defs: `
      (function_declaration
        (simple_identifier) @funcName) @funcDef

      (class_declaration
        (type_identifier) @className) @classDef

      (protocol_declaration
        (type_identifier) @interfaceName) @interfaceDef
    `,
    refs: `
      (call_expression
        (simple_identifier) @callIdent) @callRef

      (navigation_expression
        (simple_identifier) @callMethod) @callMethodRef

      (type_identifier) @typeIdent
    `
  },
  lua: {
    // #255: pulled from @tree-sitter-grammars/tree-sitter-lua (the aggregator's
    // build corrupts once a 2nd grammar loads). That grammar names function defs
    // `function_declaration` — the name is either a direct (identifier) (global /
    // `local function`) or a (dot_index_expression) for `function M.run`. Calls
    // are `function_call` with an (identifier) or (dot_index_expression) callee.
    defs: `
      (function_declaration
        (identifier) @funcName) @funcDef

      (function_declaration
        (dot_index_expression) @funcName) @funcDef
    `,
    refs: `
      (function_call (identifier) @callIdent) @callRef

      (function_call (dot_index_expression) @callIdent) @callRef
    `
  },
  ocaml: {
    // #251: let_binding holds value_name as a direct child (no `pattern:` /
    // value_pattern wrapper), and module_binding's module_name is a direct child
    // (no `name:` field) — the old patterns failed query compilation.
    defs: `
      (value_definition
        (let_binding (value_name) @funcName)) @funcDef

      (module_definition
        (module_binding (module_name) @moduleName)) @moduleDef
    `,
    refs: `
      (application_expression
        (value_path (value_name) @callIdent)) @callRef

      (value_path (value_name) @callIdent) @callRef
    `
  },
  zig: {
    defs: `
      (function_declaration
        (identifier) @funcName) @funcDef
    `,
    // #251: the old `field_access` node name doesn't exist in this grammar and
    // failed to compile; call_expression refs are valid.
    refs: `
      (call_expression
        (identifier) @callIdent) @callRef
    `
  },
  bash: {
    defs: `
      (function_definition
        name: (word) @funcName) @funcDef
    `,
    refs: `
      (command
        name: (command_name (word) @callIdent)) @callRef
    `
  },
  // #1522: tree-sitter-cue (eonpatapon/tree-sitter-cue, vendored per #1520) has
  // no `label:`/`value:` field names on `field` — verified directly against the
  // committed wasm (`value:` fails query compilation with "Bad field name");
  // only `let_clause`'s `left:`/`right:` and `call_expression`'s `function:`
  // are real fields. A `#Definition` is not a distinct node kind: `#Service`
  // parses as a plain (identifier) whose text happens to start with "#", so
  // definitions are told apart from ordinary struct fields with a `#match?`/
  // `#not-match?` text predicate rather than a grammar-level distinction —
  // both predicates must sit INSIDE the pattern's own parens (this repo's
  // tree-sitter gotcha). `#Definition`s map to `type` (the closest existing
  // SymbolKind to a reusable CUE schema); plain fields map to `property`;
  // `let` bindings map to `variable`.
  //
  // Two known upstream grammar rough edges (#1522 review round 1, F4;
  // docs/language-coverage.md's CUE row has the same note, kept in sync):
  // (1) an aliased field label (`X=name: value`) exposes BOTH identifiers
  // as untagged siblings under one `label` node — `(label alias:
  // (identifier) (identifier))` — with no field/structural way to tell the
  // alias from the real name, so `fieldDef` spuriously captures the alias
  // too, alongside the correct symbol for `name`. (2) a multi-hash raw
  // string (`##"..."##`, 2+ `#` delimiters) mis-parses regardless of
  // content — the field's value becomes a bare `identifier` instead of a
  // `string`, which can surface as a spurious `#`-prefixed ref via the
  // `typeIdent` pattern below. Both are grammar bugs, not query bugs — no
  // query change here can distinguish what the parse tree doesn't.
  cue: {
    defs: `
      (field
        (label (identifier) @defName)
        (#match? @defName "^#")) @defDef

      (field
        (label (identifier) @fieldName)
        (value (_)) @fieldValue
        (#not-match? @fieldName "^#")) @fieldDef

      (let_clause
        left: (identifier) @letName
        right: (_) @letValue) @letDef
    `,
    // `#Service` used as a value (e.g. `#Other: #Service & {...}`) is the same
    // (identifier) node kind as its own definition label — there is no
    // separate reference/definition node kind in this grammar, so the
    // definition's own label also matches this pattern, mirroring the same
    // self-match already accepted for swift/java's broad `type_identifier`
    // ref patterns above.
    refs: `
      ((identifier) @typeIdent
        (#match? @typeIdent "^#"))

      (call_expression
        function: (identifier) @callIdent) @callRef

      (call_expression
        function: (selector_expression (identifier) (identifier) @callMethod)) @callMethodRef
    `
  }
};
SYMBOL_QUERIES.tsx = SYMBOL_QUERIES.typescript;
SYMBOL_QUERIES.javascript = {
  defs: `
      ;; Function declarations: function foo(params) { }
      (function_declaration
        name: (identifier) @funcName
        parameters: (formal_parameters) @funcParams
        body: (statement_block) @funcBody) @funcDef

      ;; Arrow functions: const foo = (params) => { }
      (variable_declarator
        name: (identifier) @arrowName
        value: (arrow_function
          parameters: (formal_parameters) @arrowParams
          body: (_) @arrowBody)) @arrowDef

      ;; Class declarations: class Foo { } \u2014 (identifier) name on this grammar.
      (class_declaration
        name: (identifier) @className) @classDef

      ;; Method definitions: class Foo { bar() { } }
      (method_definition
        name: (property_identifier) @methodName
        parameters: (formal_parameters) @methodParams) @methodDef
    `,
  refs: `
      ;; Function/method calls: foo() or obj.bar()
      (call_expression
        function: (identifier) @callIdent) @callRef

      (call_expression
        function: (member_expression
          object: (_)
          property: (property_identifier) @callMethod)) @callMethodRef

      ;; New expressions: new Foo()
      (new_expression
        constructor: (identifier) @newIdent) @newRef
    `
};
function symbolExtractionGrammar(kind, filePath) {
  if (!kind)
    return void 0;
  const kindGrammar = KIND_TO_GRAMMAR[kind];
  if (!kindGrammar)
    return void 0;
  const byExtension = filePath ? EXTENSION_TO_GRAMMAR[path3.extname(filePath).toLowerCase()] : void 0;
  const grammar = byExtension ?? kindGrammar;
  return grammar in SYMBOL_QUERIES ? grammar : void 0;
}
var JS_TS_IMPORT_QUERY = `
      (comment) @importComment
      (import_statement source: (string) @importSource)
      (export_statement source: (string) @importSource)
      (call_expression
        function: (import)
        arguments: (arguments . (string) @importSource))
      (call_expression
        function: (identifier) @_m
        arguments: (arguments . (string) @importSource)
        (#eq? @_m "require"))
    `;
var IMPORT_QUERIES = {
  // ESM import + re-export source strings; `source:` is a (string) on both the
  // typescript and tsx grammars (validated). parseImportMatch strips the quotes.
  // #4438: a dynamic `import("x")` and a `require("x")` call with a string
  // argument count too, as the review graph's import facts already count them
  // (`dispatch/facts/import-facts.ts`): the inline-blocker sweep and the
  // created-module producer read this query, and a dependency it missed
  // stayed stale there. Node names probed on the shipped typescript, tsx and
  // javascript grammars; a pattern one grammar lacks would fail the whole
  // query. The ambient-module extension is TS/TSX-only; JavaScript uses
  // the common query. `import x = require()` remains outside this query.
  typescript: `${JS_TS_IMPORT_QUERY}
      (ambient_declaration (module name: (string) @importSource))`,
  tsx: `${JS_TS_IMPORT_QUERY}
      (ambient_declaration (module name: (string) @importSource))`,
  // #include "foo.h" (string_literal) and #include <stdio.h> (system_lib_string)
  // on both the c and cpp grammars (validated). parseImportMatch strips the quotes
  // from the local form; the system form keeps its <> so the resolver/bucketer can
  // tell a system header from a local include.
  c: `
      (preproc_include path: (string_literal) @importSource)
      (preproc_include path: (system_lib_string) @importSource)
    `,
  cpp: `
      (preproc_include path: (string_literal) @importSource)
      (preproc_include path: (system_lib_string) @importSource)
    `,
  python: `
      (import_statement name: (dotted_name) @importSource)
      (import_statement name: (aliased_import name: (dotted_name) @importSource))
      (import_from_statement module_name: (dotted_name) @importSource)
      (import_from_statement module_name: (relative_import) @importSource)
    `,
  go: `(import_spec path: (interpreted_string_literal) @importSource)`,
  rust: `(use_declaration argument: (_) @importSource)`,
  java: `(import_declaration (scoped_identifier) @importSource)`,
  kotlin: `(import_header (identifier) @importSource)`,
  csharp: `
      (using_directive (identifier) @importSource)
      (using_directive (qualified_name) @importSource)
    `,
  swift: `(import_declaration (identifier) @importSource)`,
  php: `(namespace_use_clause (name) @importSource)`,
  ocaml: `(open_module (module_path) @importSource)`,
  dart: `(import_specification (configurable_uri (uri (string_literal) @importSource)))`,
  // local x = require("mod.a") — a plain function call, not a statement. The
  // pulled @tree-sitter-grammars grammar (#255) names it function_call.
  lua: `
      (function_call
        (identifier) @_m
        (arguments (string) @importSource)
        (#match? @_m "^require$"))
    `,
  // require "x" / require_relative "x" — covers both via the "^require" prefix.
  ruby: `
      (call
        method: (identifier) @_m
        (argument_list (string (string_content) @importSource))
        (#match? @_m "^require"))
    `,
  // @import("std") — a builtin call, not a statement.
  zig: `
      (builtin_function (builtin_identifier) @_m
        (arguments (string (string_content) @importSource))
        (#match? @_m "^@import$"))
    `,
  // import/alias/require/use Foo — macro calls; excludes defmodule and friends.
  elixir: `
      (call target: (identifier) @_m
        (arguments (alias) @importSource)
        (#match? @_m "^(import|alias|require|use)$"))
    `,
  // source ./x.sh and . ./x.sh — the two POSIX file-include builtins.
  bash: `
      (command (command_name (word) @_m)
        (word) @importSource
        (#match? @_m "^(source|\\.)$"))
    `,
  // import "strings" / import x "encoding/json" — `import_spec`'s `path:`
  // field is verified against the committed wasm. Block-form
  // (`import (\n\t"strings"\n)`) nests each `import_spec` one level deeper,
  // under `import_spec_list`, rather than as a direct child of
  // `import_declaration` — a second pattern is needed, not a reshaped first
  // one (#1522 review round 1, F2: the single-line-only pattern extracted
  // zero imports from the block form).
  cue: `
      (import_declaration (import_spec path: (string) @importSource))
      (import_declaration (import_spec_list (import_spec path: (string) @importSource)))
    `
};
IMPORT_QUERIES.javascript = JS_TS_IMPORT_QUERY;
function parseImportMatch(match) {
  const imports = [];
  for (const capture of match.captures) {
    if (capture.name === "importComment") {
      for (const tag of capture.node.text.matchAll(/@import\b[^@]*?\bfrom\s*(["'])([^"'\r\n]+)\1/g)) {
        imports.push({
          source: tag[2],
          line: capture.node.startPosition.row + 1
        });
      }
      continue;
    }
    if (capture.name !== "importSource")
      continue;
    const raw = String(capture.node.text ?? "").trim();
    const source = raw.replace(/^["'`]+|["'`]+$/g, "");
    if (!source)
      continue;
    imports.push({ source, line: capture.node.startPosition.row + 1 });
  }
  return imports;
}
var TreeSitterSymbolExtractor = class _TreeSitterSymbolExtractor {
  languageId;
  client;
  // biome-ignore lint/suspicious/noExplicitAny: Query type from web-tree-sitter
  defQuery = null;
  // biome-ignore lint/suspicious/noExplicitAny: Query type from web-tree-sitter
  refQuery = null;
  // biome-ignore lint/suspicious/noExplicitAny: Query type from web-tree-sitter
  importQuery = null;
  constructor(languageId, client) {
    this.languageId = languageId;
    this.client = client;
  }
  async init() {
    try {
      if (!await this.client.isLanguageSupported(this.languageId))
        return false;
      const language = this.client.getLanguage(this.languageId);
      if (!language)
        return false;
      const { Query } = await loadWebTreeSitter();
      const queries = SYMBOL_QUERIES[this.languageId];
      if (queries) {
        this.defQuery = this.compileQuery(Query, language, queries.defs, "defs");
        this.refQuery = this.compileQuery(Query, language, queries.refs, "refs");
      }
      const importQuerySrc = IMPORT_QUERIES[this.languageId];
      if (importQuerySrc) {
        this.importQuery = this.compileQuery(Query, language, importQuerySrc, "imports");
      }
      return Boolean(this.defQuery || this.importQuery);
    } catch (err) {
      this.client.reportWasmAbort(err);
      logTreeSitterDiagnostic({
        subsystem: "symbol-extractor",
        languageId: this.languageId,
        message: `Failed to init ${this.languageId}: ${err instanceof Error ? err.message : String(err)}`
      });
      return false;
    }
  }
  // biome-ignore lint/suspicious/noExplicitAny: web-tree-sitter Query/Language types
  compileQuery(Query, language, src, label) {
    const input = wasmQueryInput(`${this.languageId}:${label}:${src}`);
    try {
      return new Query(language, src);
    } catch (err) {
      if (this.client.reportWasmAbort(err, input))
        throw err;
      logTreeSitterDiagnostic({
        subsystem: "symbol-extractor",
        languageId: this.languageId,
        message: `${this.languageId} ${label} query failed: ${err.message}`,
        metadata: { query: label }
      });
      return null;
    }
  }
  /**
   * Extract symbols from a parsed tree-sitter tree
   */
  extract(tree, filePath, content) {
    const symbols = [];
    const refs = [];
    const relativePath = path3.relative(process.cwd(), filePath);
    if (this.defQuery) {
      let lines;
      const lineAt = (row) => (lines ??= content.split("\n"))[row] ?? "";
      for (const match of this.queryMatches(this.defQuery, tree.rootNode)) {
        const symbol = this.parseDefMatch(match, relativePath, lineAt);
        if (symbol)
          symbols.push(symbol);
      }
    }
    if (this.refQuery) {
      for (const match of this.queryMatches(this.refQuery, tree.rootNode)) {
        const ref = this.parseRefMatch(match, relativePath);
        if (ref)
          refs.push(ref);
      }
    }
    return {
      symbols,
      refs,
      imports: this.extractImports(tree),
      coverage: {
        definitions: this.defQuery ? "complete" : "unavailable",
        references: this.refQuery ? "complete" : "unavailable",
        imports: this.importQuery ? "complete" : "unavailable"
      },
      ...tree.rootNode.hasError === true ? { syntaxErrors: true } : {}
    };
  }
  /**
   * The import references alone (optional: only for languages with an
   * IMPORT_QUERIES entry). #4368 r1 F2: a caller that needs only imports
   * (the forward-import resolver) runs this instead of {@link extract}, whose
   * definitions pass is the cost of a large file.
   */
  // biome-ignore lint/suspicious/noExplicitAny: Tree type
  extractImports(tree) {
    const imports = [];
    if (!this.importQuery)
      return imports;
    for (const match of this.queryMatches(this.importQuery, tree.rootNode)) {
      imports.push(...parseImportMatch(match));
    }
    return imports;
  }
  queryMatches(query, rootNode) {
    try {
      return query.matches(rootNode);
    } catch (error) {
      this.client.reportWasmAbort(error);
      throw error;
    }
  }
  // biome-ignore lint/suspicious/noExplicitAny: Match type
  parseDefMatch(match, filePath, lineAt) {
    const captures = {};
    for (const capture of match.captures) {
      captures[capture.name] = {
        text: capture.node.text,
        // biome-ignore lint/suspicious/noExplicitAny: Node type
        node: capture.node
      };
    }
    let name;
    let kind;
    let params;
    let defNode;
    if (captures.funcName) {
      name = captures.funcName.text;
      kind = "function";
      params = captures.funcParams?.text;
      defNode = captures.funcDef?.node;
    } else if (captures.arrowName) {
      name = captures.arrowName.text;
      kind = "function";
      params = captures.arrowParams?.text;
      defNode = captures.arrowDef?.node;
    } else if (captures.className) {
      name = captures.className.text;
      kind = "class";
      defNode = captures.classDef?.node;
    } else if (captures.methodName) {
      name = captures.methodName.text;
      kind = "method";
      params = captures.methodParams?.text;
      defNode = captures.methodDef?.node;
    } else if (captures.interfaceName) {
      name = captures.interfaceName.text;
      kind = "interface";
      defNode = captures.interfaceDef?.node;
    } else if (captures.typeName) {
      name = captures.typeName.text;
      kind = "type";
      defNode = captures.typeDef?.node;
    } else if (captures.moduleName) {
      name = captures.moduleName.text;
      kind = "class";
      defNode = captures.moduleDef?.node;
    } else if (captures.defName) {
      name = captures.defName.text;
      kind = "type";
      defNode = captures.defDef?.node;
    } else if (captures.fieldName) {
      name = captures.fieldName.text;
      kind = "property";
      defNode = captures.fieldDef?.node;
    } else if (captures.letName) {
      name = captures.letName.text;
      kind = "variable";
      defNode = captures.letDef?.node;
    }
    if (!name || !kind || !defNode)
      return null;
    const isExported = this.isExported(defNode, lineAt);
    const signature = params ? this.extractSignature(params, kind) : void 0;
    const local = this.isFunctionLocal(defNode);
    const visibility = kind === "method" ? this.detectVisibility(defNode, name) : void 0;
    const decorators = this.extractDecorators(defNode);
    const isAsync = (kind === "function" || kind === "method") && this.isAsyncDecl(defNode);
    const docInfo = this.extractDocCommentInfo(defNode);
    return {
      id: `${filePath}:${name}`,
      name,
      kind,
      filePath,
      line: defNode.startPosition.row + 1,
      endLine: defNode.endPosition.row + 1,
      column: defNode.startPosition.column + 1,
      signature,
      isExported,
      ...local ? { local: true } : {},
      ...visibility ? { visibility } : {},
      ...decorators.length > 0 ? { decorators } : {},
      ...isAsync ? { isAsync: true } : {},
      ...docInfo ? {
        doc: docInfo.text,
        ...docInfo.startLine !== void 0 ? { docStartLine: docInfo.startLine } : {}
      } : {}
    };
  }
  // Comment node kinds across grammars that use tree-sitter's conventional
  // name. Line/block comments (`//`, `/* */`, `/** */`, `#`) all parse to a
  // single "comment" node type in every grammar checked (JS/TS, Python, Go,
  // Rust, Java, Kotlin, C#, C/C++, Ruby, PHP, Swift, Lua) — no per-grammar
  // query needed, unlike decorators/annotations which vary by node shape.
  static COMMENT_NODE_KIND = "comment";
  /**
   * First sentence/line of the doc comment immediately preceding a declaration,
   * whitespace-collapsed and capped ~120 chars — the highest-signal token for an
   * agent deciding which symbol to read (#512). Structural, not per-language:
   * walks contiguous preceding-sibling `comment` nodes (same traversal shape as
   * `extractDecorators`), stopping at the nearest non-comment/non-decorator named
   * sibling, and takes the LAST contiguous comment block (the one directly above
   * the declaration — an earlier unrelated comment separated by blank lines still
   * parses as a preceding sibling, but a real gap makes it not "attached").
   * JSDoc/TSDoc block comments strip the leading/trailing block markers and
   * per-line `*` gutters; plain `//`/`#` line comments strip the marker only.
   * Returns undefined when no comment is directly attached. Returns both the
   * summarized text (`doc`) and the 1-based start line of the attached comment
   * block (`docStartLine`, #523) — readSymbol extends its returned range to that
   * line so an agent reading a symbol sees its contract, not just its body.
   * A Python docstring (#4948) is the first string statement INSIDE the body, so
   * it yields `text` only: its `startLine` stays undefined, because a start line
   * below the signature would make readSymbol's range cut the signature off.
   */
  // biome-ignore lint/suspicious/noExplicitAny: web-tree-sitter node
  extractDocCommentInfo(declNode) {
    if (this.languageId === "python" && (declNode.type === "function_definition" || declNode.type === "class_definition")) {
      const first = declNode.childForFieldName("body")?.namedChild(0);
      let expr = first?.type === "expression_statement" ? first.namedChild(0) : void 0;
      if (expr?.type === "parenthesized_expression")
        expr = expr.namedChild(0);
      const parts = expr?.type === "concatenated_string" ? expr.namedChildren : expr ? [expr] : [];
      const bodies = parts.map((part) => part.type === "string" ? /^[rRuU]?("""|'''|"|')([\s\S]*)\1$/.exec(String(part.text))?.[2] : void 0);
      const text2 = bodies.length > 0 && bodies.every((x) => x !== void 0) ? this.summarizeDocComment(bodies.join("")) : void 0;
      if (text2)
        return { text: text2 };
    }
    const isComment = (n) => !!n && n.type === _TreeSitterSymbolExtractor.COMMENT_NODE_KIND;
    const isDeco = (n) => !!n && _TreeSitterSymbolExtractor.DECORATOR_NODE_KINDS.has(n.type);
    const sameStartRow = (a, b) => a?.startPosition?.row === b?.startPosition?.row;
    let node = declNode;
    for (let hops = 0; hops < 4; hops++) {
      const parent = node.parent;
      if (!parent || !sameStartRow(parent, node))
        break;
      node = parent;
    }
    let cursor = node.previousSibling;
    while (cursor && isDeco(cursor))
      cursor = cursor.previousSibling;
    let boundaryRow = node.startPosition?.row;
    const run = [];
    while (cursor && isComment(cursor)) {
      const gapRows = boundaryRow !== void 0 && typeof cursor.endPosition?.row === "number" ? boundaryRow - cursor.endPosition.row : 0;
      if (gapRows > 1)
        break;
      run.push(cursor);
      boundaryRow = cursor.startPosition?.row;
      cursor = cursor.previousSibling;
    }
    if (run.length === 0)
      return void 0;
    run.reverse();
    const raw = run.map((n) => String(n.text ?? "")).join("\n");
    const text = this.summarizeDocComment(raw);
    if (!text)
      return void 0;
    const startLine = (run[0].startPosition?.row ?? 0) + 1;
    return { text, startLine };
  }
  static DOC_MAX_CHARS = 120;
  /** Strip comment markers, take the first sentence (or first line if no
   * sentence terminator), collapse whitespace, cap at ~120 chars. */
  summarizeDocComment(raw) {
    const cleaned = raw.replace(/^\s*\/\*\*?/, "").replace(/\*\/\s*$/, "").split(/\r?\n/).map((line) => line.replace(/^\s*(\*|\/\/\/?|#)\s?/, "").trimEnd()).filter((line) => line.trim().length > 0).join(" ").trim();
    if (!cleaned)
      return void 0;
    const sentenceMatch = cleaned.match(/^.*?[.!?](?:\s|$)/);
    let first = (sentenceMatch ? sentenceMatch[0] : cleaned).trim();
    first = first.replace(/\s+/g, " ");
    if (first.length > _TreeSitterSymbolExtractor.DOC_MAX_CHARS) {
      first = `${first.slice(0, _TreeSitterSymbolExtractor.DOC_MAX_CHARS - 1).trimEnd()}\u2026`;
    }
    return first || void 0;
  }
  /**
   * Structural async/suspend detection: an `async` keyword node (Python/JS/TS
   * have it as a direct child of the declaration) or `async`/`suspend` inside a
   * `*modifiers*` container (Rust `function_modifiers`, Kotlin/Java/C#
   * `modifiers`). Conservative — a grammar that spells it differently just
   * yields false (no false positives).
   */
  // biome-ignore lint/suspicious/noExplicitAny: web-tree-sitter node
  isAsyncDecl(node) {
    const isAsyncTok = (n) => !!n && (n.type === "async" || n.type === "suspend" || /modifier/.test(String(n.type)) && /^(?:async|suspend)$/.test(String(n.text ?? "").trim()));
    for (const child of node.children ?? []) {
      if (isAsyncTok(child))
        return true;
      if (/modifiers/.test(String(child?.type))) {
        for (const gc of child.children ?? []) {
          if (isAsyncTok(gc))
            return true;
        }
      }
    }
    return false;
  }
  // Decorator/attribute/annotation node kinds across grammars. Python/TS/JS use
  // `decorator`; Rust `attribute_item`; Java/Kotlin/C# `marker_annotation` /
  // `annotation` (often nested inside a `modifiers` container).
  static DECORATOR_NODE_KINDS = /* @__PURE__ */ new Set([
    "decorator",
    "attribute_item",
    "marker_annotation",
    "annotation"
  ]);
  // Containers that hold annotations as children (Java/Kotlin `modifiers`).
  static MODIFIERS_CONTAINER_KINDS = /* @__PURE__ */ new Set(["modifiers"]);
  /**
   * Decorators/attributes/annotations attached to a declaration node, in source
   * order. Structural (tree-sitter), not text heuristics, so it handles the three
   * placement shapes seen across grammars:
   *   - preceding siblings: Python (`decorated_definition` children), Rust
   *     (`attribute_item`), TS methods (`decorator`);
   *   - own children: TS class decorators;
   *   - nested in a `modifiers` container: Java/Kotlin/C# annotations.
   * Languages without these node kinds simply yield none.
   */
  // biome-ignore lint/suspicious/noExplicitAny: web-tree-sitter node
  extractDecorators(node) {
    const isDeco = (n) => !!n && _TreeSitterSymbolExtractor.DECORATOR_NODE_KINDS.has(n.type);
    const text = (n) => {
      const first = String(n?.text ?? "").split(/\r?\n/, 1)[0]?.trim() ?? "";
      return first.length > 120 ? `${first.slice(0, 117)}\u2026` : first;
    };
    const out = [];
    const above = [];
    for (let sib = node.previousSibling; sib; sib = sib.previousSibling) {
      if (isDeco(sib))
        above.push(text(sib));
      else if (sib.isNamed)
        break;
    }
    out.push(...above.reverse());
    for (const child of node.children ?? []) {
      if (isDeco(child))
        out.push(text(child));
      else if (_TreeSitterSymbolExtractor.MODIFIERS_CONTAINER_KINDS.has(child?.type)) {
        for (const gc of child.children ?? []) {
          if (isDeco(gc))
            out.push(text(gc));
        }
      }
    }
    return [...new Set(out.filter(Boolean))].slice(0, 8);
  }
  // biome-ignore lint/suspicious/noExplicitAny: Match type
  parseRefMatch(match, filePath) {
    let name;
    let refNode;
    let referenceKind = "unknown";
    for (const capture of match.captures) {
      const captureName = String(capture.name);
      if (captureName.endsWith("Ident") || captureName.endsWith("Method") || captureName.endsWith("Field")) {
        name = capture.node.text;
        refNode = capture.node;
        if (captureName.startsWith("type"))
          referenceKind = "type";
        else if (captureName.startsWith("call") || captureName.startsWith("new")) {
          referenceKind = "call";
        }
      }
      if (captureName.endsWith("Ref") && !refNode) {
        refNode = capture.node;
        if (captureName.startsWith("type"))
          referenceKind = "type";
        else if (captureName.startsWith("call") || captureName.startsWith("new")) {
          referenceKind = "call";
        }
      }
    }
    if (!name || !refNode)
      return null;
    return {
      symbolId: `${filePath}:${name}`,
      // Will be resolved later
      symbolName: name,
      filePath,
      line: refNode.startPosition.row + 1,
      column: refNode.startPosition.column + 1,
      referenceKind
    };
  }
  // biome-ignore lint/suspicious/noExplicitAny: Node type
  isExported(node, lineAt) {
    const line = lineAt(node.startPosition.row);
    return /^\s*export\b/.test(line) || this.hasExportModifier(node);
  }
  // biome-ignore lint/suspicious/noExplicitAny: Node type
  hasExportModifier(node) {
    let current = node.parent;
    while (current) {
      if (current.type === "statement_block")
        return false;
      if (current.type === "export_statement" || current.type === "export_declaration") {
        return true;
      }
      current = current.parent;
    }
    return false;
  }
  // biome-ignore lint/suspicious/noExplicitAny: Node type
  isFunctionLocal(node) {
    let current = node.parent;
    while (current) {
      if (current.type === "statement_block")
        return true;
      current = current.parent;
    }
    return false;
  }
  // biome-ignore lint/suspicious/noExplicitAny: Node type
  detectVisibility(node, nameText) {
    if (nameText.startsWith("#"))
      return "private";
    for (const child of node?.children ?? []) {
      if (child?.type === "accessibility_modifier") {
        if (child.text === "private")
          return "private";
        if (child.text === "protected")
          return "protected";
        return void 0;
      }
    }
    return void 0;
  }
  extractSignature(paramsText, kind) {
    if (kind === "function" || kind === "method") {
      return paramsText.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "").replace(/\s+/g, " ").trim();
    }
    return void 0;
  }
};

// dist/clients/blocker-freshness.js
var DEPENDENCY_DRIFT_MAX_DELIVERIES = 3;
var SELF_DRIFT_MAX_DELIVERIES = 3;
var SELF_DRIFT_HASH_BUDGET_BYTES = 8 * 1024 * 1024;
var MAX_IMPLICIT_SCOPE_PARSES = 32;
var GLOBAL_SCOPE_ROLE_MEMO_ENTRIES = 1024;
var globalScopeRoleMemo = new BoundedLruCache(GLOBAL_SCOPE_ROLE_MEMO_ENTRIES);
function roleByTextOf(filePath) {
  try {
    return globalScopeRoleByText(fs4.readFileSync(filePath, "utf8"));
  } catch {
    return void 0;
  }
}
function createImplicitScopeCheck(runtime, cwd) {
  let receipts;
  let receiptsDropped = false;
  const roles = /* @__PURE__ */ new Map();
  let parses = 0;
  const roleOf = (other) => {
    const known = roles.get(other);
    if (known !== void 0)
      return known;
    let stat;
    try {
      stat = fs4.statSync(other);
    } catch {
      roles.set(other, "none");
      return "none";
    }
    const memo = globalScopeRoleMemo.get(other);
    let role;
    if (memo?.mtimeMs === stat.mtimeMs && memo.ctimeMs === stat.ctimeMs && memo.size === stat.size) {
      role = memo.role;
    } else {
      const byName = globalScopeRoleByName(other);
      const byText = byName ? void 0 : roleByTextOf(other);
      if (byName ?? byText) {
        role = byName ?? byText;
      } else if (parses >= MAX_IMPLICIT_SCOPE_PARSES) {
        return "unknown";
      } else {
        parses += 1;
        role = classifyJsTsGlobalScope(other);
      }
      globalScopeRoleMemo.set(other, {
        mtimeMs: stat.mtimeMs,
        ctimeMs: stat.ctimeMs,
        size: stat.size,
        role
      });
    }
    roles.set(other, role);
    return role;
  };
  const rootKey = normalizeMapKey(nodePath.resolve(cwd));
  const rootPrefix = rootKey.endsWith("/") ? rootKey : `${rootKey}/`;
  const inRoot = (file) => file === rootKey || file.startsWith(rootPrefix);
  let scanned;
  const feeding = [];
  let newestUnknownTs = Number.NEGATIVE_INFINITY;
  const scanBackTo = (all, recordedAtMs) => {
    scanned ??= all.length;
    while (scanned > 0 && all[scanned - 1].ts > recordedAtMs) {
      const receipt = all[--scanned];
      if (!inRoot(receipt.filePath))
        continue;
      const role = roleOf(receipt.filePath);
      if (role === "feeds")
        feeding.push(receipt);
      else if (role === "unknown") {
        newestUnknownTs = Math.max(newestUnknownTs, receipt.ts);
      }
    }
  };
  const feedsGlobalScope = (other) => roles.get(other) === "feeds";
  return (filePath, recordedAtMs) => {
    const key = normalizeMapKey(filePath);
    const goFile = isGoSourceFile(key);
    const inScope = goFile ? goPackagePeersOf(key) : implicitScopeOf(key, feedsGlobalScope);
    if (!inScope)
      return { drifted: [], truncated: false };
    if (receipts === void 0) {
      const coordinator = runtime;
      receipts = coordinator.getMutationsSince?.(0) ?? [];
      receiptsDropped = (coordinator.droppedMutationReceiptCount ?? 0) > 0;
    }
    let drifted;
    let unknownAfter = false;
    if (goFile) {
      for (let i = receipts.length - 1; i >= 0; i--) {
        const receipt = receipts[i];
        if (receipt.ts <= recordedAtMs)
          break;
        if (inScope(receipt.filePath)) {
          drifted = receipt.filePath;
          break;
        }
      }
    } else {
      scanBackTo(receipts, recordedAtMs);
      drifted = feeding.find((receipt) => receipt.ts > recordedAtMs && inScope(receipt.filePath))?.filePath;
      unknownAfter = newestUnknownTs > recordedAtMs;
    }
    if (drifted)
      return { drifted: [drifted], truncated: false };
    const evictedAfter = receiptsDropped && (receipts.length === 0 || receipts[0].ts > recordedAtMs);
    return { drifted: [], truncated: unknownAfter || evictedAfter };
  };
}
var MAX_DRIFT_CHECK_IMPORTS = 128;
var extractorCache = /* @__PURE__ */ new Map();
function getExtractor(languageId) {
  let cached = extractorCache.get(languageId);
  if (!cached) {
    cached = (async () => {
      const client = getSharedTreeSitterClient();
      if (!client)
        return null;
      const extractor = new TreeSitterSymbolExtractor(languageId, client);
      const ok = await extractor.init();
      return ok ? extractor : null;
    })().catch(() => null);
    extractorCache.set(languageId, cached);
  }
  return cached;
}
var importResolutionMemo = /* @__PURE__ */ new Map();
var importResolutionMemoTurnIndex;
function noteImportResolutionMemoTurn(turnIndex) {
  if (turnIndex === void 0)
    return;
  if (importResolutionMemoTurnIndex !== turnIndex) {
    importResolutionMemo.clear();
    importResolutionMemoTurnIndex = turnIndex;
  }
}
async function resolveForwardImportsMemoized(cwd, filePath, resolveForwardImports) {
  const sig = await statSignature(filePath);
  if (sig === void 0) {
    try {
      return await resolveForwardImports(cwd, filePath);
    } catch {
      return [];
    }
  }
  const cached = importResolutionMemo.get(filePath);
  if (cached && cached.mtimeMs === sig.mtimeMs && cached.size === sig.size)
    return cached.imports;
  let imports;
  try {
    imports = await resolveForwardImports(cwd, filePath);
  } catch {
    imports = [];
  }
  importResolutionMemo.set(filePath, {
    mtimeMs: sig.mtimeMs,
    size: sig.size,
    imports
  });
  return imports;
}
var FORWARD_IMPORT_SOURCE_MEMO_ENTRIES = 1024;
var JS_TS_LANGUAGES = /* @__PURE__ */ new Set(["typescript", "tsx", "javascript"]);
var RELATIVE_SPECIFIER = /(["'])(\.{1,2}\/(?:(?!\1)[^\n])*)\1/g;
var DEPENDENCY_CALL = /\bimport\s*\(|\brequire\s*\(|@import\b|\bdeclare\s+module\s*["']|\/\/\/\s*<reference\s+(?:path|types)/;
function holdsUncapturedDependency(content, sources) {
  if (DEPENDENCY_CALL.test(content))
    return true;
  const captured = new Set(sources);
  for (const match of content.matchAll(RELATIVE_SPECIFIER)) {
    if (!captured.has(match[2]))
      return true;
  }
  return false;
}
var forwardImportSourceMemo = new BoundedLruCache(FORWARD_IMPORT_SOURCE_MEMO_ENTRIES);
var forwardImportParses = 0;
function _getForwardImportParsesForTests() {
  return forwardImportParses;
}
async function forwardImportSources(filePath, languageId) {
  let stat;
  try {
    stat = fs4.statSync(filePath);
  } catch {
    return void 0;
  }
  const key = normalizeMapKey(filePath);
  const memo = forwardImportSourceMemo.get(key);
  if (memo?.mtimeMs === stat.mtimeMs && memo.ctimeMs === stat.ctimeMs && memo.size === stat.size) {
    return memo;
  }
  const client = getSharedTreeSitterClient();
  if (!client)
    return void 0;
  const extractor = await getExtractor(languageId);
  if (!extractor)
    return void 0;
  let content;
  try {
    content = fs4.readFileSync(filePath, "utf-8");
  } catch {
    return void 0;
  }
  const outcome = await client.withParsedTree(
    filePath,
    languageId,
    content,
    // Imports only (#4368 r1 F2): the definitions pass of a full extract is
    // what made a large file cost seconds.
    (tree) => extractor.extractImports(tree),
    "blocker-freshness"
  );
  if (!outcome.parsed)
    return void 0;
  forwardImportParses++;
  const sources = [...new Set(outcome.value.map((ref) => ref.source))];
  const entry = {
    mtimeMs: stat.mtimeMs,
    ctimeMs: stat.ctimeMs,
    size: stat.size,
    sources,
    unresolved: memo?.unresolved ?? /* @__PURE__ */ new Set(),
    uncaptured: JS_TS_LANGUAGES.has(languageId) && holdsUncapturedDependency(content, sources)
  };
  forwardImportSourceMemo.set(key, entry);
  return entry;
}
async function extractForwardImports(cwd, filePath) {
  const languageId = resolveTreeSitterLanguage(filePath);
  if (!languageId)
    return { targets: [], unresolved: [], complete: false };
  const entry = await forwardImportSources(filePath, languageId);
  if (!entry)
    return { targets: [], unresolved: [], complete: false };
  const resolved = /* @__PURE__ */ new Set();
  const unresolved = /* @__PURE__ */ new Set();
  for (const source of entry.sources) {
    const targets = resolveImportToFiles(cwd, filePath, languageId, source);
    if (targets.length === 0)
      unresolved.add(source);
    for (const target of targets) {
      if (entry.unresolved.has(source))
        notePathAppeared(target);
      resolved.add(target);
    }
  }
  entry.unresolved = unresolved;
  return {
    targets: [...resolved],
    unresolved: [...unresolved],
    complete: !entry.uncaptured
  };
}
function extractForwardImportPaths(cwd, filePath) {
  return extractForwardImports(cwd, filePath).then(({ targets }) => targets);
}
async function statSignature(filePath) {
  try {
    const stat = await fs4.promises.stat(filePath);
    return { mtimeMs: stat.mtimeMs, size: stat.size };
  } catch {
    return void 0;
  }
}
async function statMtimeMs(filePath) {
  try {
    const stat = await fs4.promises.stat(filePath);
    return stat.mtimeMs;
  } catch {
    return void 0;
  }
}
async function detectSelfDrift(args) {
  const boundOptions = (label) => ({
    ms: HOOK_WALL_BUDGET_MS.turn_end,
    signal: args.signal,
    hook: "turn_end",
    label
  });
  const stat = await bounded(fs4.promises.stat(args.filePath), boundOptions("selfDriftStat"));
  if (stat === void 0)
    return { verdict: "unverifiable", unverifiableReason: "stat-unavailable" };
  if (args.recordedSize === void 0)
    return { verdict: "unverifiable", unverifiableReason: "missing-baseline" };
  if (stat.size !== args.recordedSize)
    return { verdict: "drift" };
  if (args.recordedHash === void 0)
    return { verdict: "unverifiable", unverifiableReason: "missing-baseline" };
  if (stat.size > args.budget.bytesLeft) {
    args.budget.exhausted = true;
    return {
      verdict: "unverifiable",
      unverifiableReason: "hash-budget-exhausted"
    };
  }
  const content = await bounded(fs4.promises.readFile(args.filePath), boundOptions("selfDriftHash"));
  if (content === void 0)
    return { verdict: "unverifiable", unverifiableReason: "hash-unavailable" };
  args.budget.bytesLeft -= content.byteLength;
  const hash = hashContentBytes(content);
  return { verdict: hash === args.recordedHash ? "unchanged" : "drift" };
}
async function collectForwardImportMtimes(cwd, filePath, resolveForwardImports = extractForwardImportPaths, turnIndex) {
  noteImportResolutionMemoTurn(turnIndex);
  let imports = [];
  try {
    imports = await resolveForwardImportsMemoized(cwd, filePath, resolveForwardImports);
  } catch {
    imports = [];
  }
  const truncated = imports.length > MAX_DRIFT_CHECK_IMPORTS;
  const out = [];
  for (const dep of imports.slice(0, MAX_DRIFT_CHECK_IMPORTS)) {
    const mtimeMs = await statMtimeMs(dep);
    if (mtimeMs !== void 0)
      out.push({ path: dep, mtimeMs });
  }
  return { mtimes: out, truncated };
}
async function detectDrift(cwd, filePath, recordedAtMs, resolveForwardImports, turnIndex, implicitScope, skipOwnFile = false) {
  const drifted = [];
  if (!skipOwnFile) {
    const ownFreshness = freshnessFromMtime({
      mtimeMs: await statMtimeMs(filePath),
      referenceMs: recordedAtMs
    });
    if (ownFreshness.verdict === "stale")
      drifted.push(filePath);
  }
  const { mtimes, truncated } = await collectForwardImportMtimes(cwd, filePath, resolveForwardImports, turnIndex);
  for (const { path: depPath, mtimeMs } of mtimes) {
    const verdict = freshnessFromMtime({
      mtimeMs,
      referenceMs: recordedAtMs
    });
    if (verdict.verdict === "stale")
      drifted.push(depPath);
  }
  const implicit = implicitScope(filePath, recordedAtMs);
  drifted.push(...implicit.drifted);
  return { drifted, truncated: truncated || implicit.truncated };
}
function isEligibleForDriftCheck(entry) {
  if (entry.stale)
    return false;
  if (entry.recordedAtMs === void 0)
    return false;
  return entry.sources !== void 0 && entry.sources.length > 0;
}
function isAllLspSourced(sources) {
  return sources !== void 0 && sources.length > 0 && sources.every((source) => source === "lsp");
}
function canSubsumeLspWidgetRow(entry) {
  return isEligibleForDriftCheck(entry) && isAllLspSourced(entry.sources);
}
async function sweepInlineBlockerFreshness(runtime, cwd, options) {
  const counts = {
    total: 0,
    kept: 0,
    revalidated: 0,
    alreadyStale: 0,
    truncatedImports: 0,
    selfHealed: 0,
    selfUnverifiable: 0,
    hashBudgetExhausted: 0
  };
  const resolveForwardImports = options?.resolveForwardImports ?? extractForwardImportPaths;
  const implicitScope = createImplicitScopeCheck(runtime, cwd);
  let turnIndex;
  try {
    turnIndex = runtime.turnIndex;
  } catch {
    turnIndex = void 0;
  }
  let inlineEntries;
  try {
    inlineEntries = runtime.getInlineBlockersSnapshot({
      sessionId: options?.sessionId
    });
  } catch {
    return counts;
  }
  const population = inlineEntries.map((entry) => ({
    filePath: entry.filePath,
    stale: entry.stale ?? false,
    recordedAtMs: entry.recordedAtMs,
    sources: entry.sources,
    staleReason: entry.staleReason,
    recordedSize: entry.recordedSize,
    recordedHash: entry.recordedHash,
    demote: () => runtime.markInlineBlockerStale(entry.filePath, "dependency-drift"),
    setSelfDrift: (isSelfDrift) => runtime.setInlineBlockerSelfDriftStale(entry.filePath, isSelfDrift)
  }));
  const inlineByKey = /* @__PURE__ */ new Map();
  for (const entry of population) {
    inlineByKey.set(normalizeEphemeralMapKey(entry.filePath), entry);
  }
  for (const extra of options?.additionalEntries ?? []) {
    const key = normalizeEphemeralMapKey(extra.filePath);
    const inlineEntry = inlineByKey.get(key);
    if (inlineEntry && canSubsumeLspWidgetRow(inlineEntry)) {
      const demoteInline = inlineEntry.demote;
      const demoteWidget = extra.demote;
      inlineEntry.demote = () => {
        const inlineChanged = demoteInline();
        const widgetChanged = demoteWidget();
        return inlineChanged || widgetChanged;
      };
      continue;
    }
    population.push({
      filePath: extra.filePath,
      stale: false,
      recordedAtMs: extra.recordedAtMs,
      sources: ["lsp"],
      demote: extra.demote,
      // A widget row is pure-LSP by construction, so it takes the import
      // axis and never reaches the self axis. No `setSelfDrift` (#2982):
      // the widget store has no re-arming self-drift setter, and an entry
      // without one is not eligible for that axis.
      staleReason: void 0,
      recordedSize: void 0,
      recordedHash: void 0
    });
  }
  counts.total = population.length;
  const hashBudget = {
    bytesLeft: SELF_DRIFT_HASH_BUDGET_BYTES,
    exhausted: false
  };
  for (const entry of population) {
    try {
      const selfDriftDemoted = entry.stale && entry.staleReason === "self-drift";
      if (entry.stale && !selfDriftDemoted) {
        counts.alreadyStale += 1;
        continue;
      }
      if (entry.recordedAtMs === void 0) {
        counts.kept += 1;
        continue;
      }
      const recordedSources = entry.sources !== void 0 && entry.sources.length > 0 ? entry.sources : void 0;
      if (recordedSources === void 0) {
        counts.kept += 1;
        continue;
      }
      const setSelfDrift = entry.setSelfDrift;
      const isLspSourced = isAllLspSourced(recordedSources);
      let ownVerdict;
      if (setSelfDrift) {
        const hashBudgetWasExhausted = hashBudget.exhausted;
        const selfDrift = await bounded(detectSelfDrift({
          filePath: entry.filePath,
          recordedSize: entry.recordedSize,
          recordedHash: entry.recordedHash,
          signal: options?.signal,
          budget: hashBudget
        }), {
          ms: HOOK_WALL_BUDGET_MS.turn_end,
          signal: options?.signal,
          hook: "turn_end",
          label: "detectSelfDrift"
        }) ?? {
          verdict: "unverifiable",
          unverifiableReason: "bound-expired"
        };
        ownVerdict = selfDrift.verdict;
        if (ownVerdict === "unverifiable") {
          counts.selfUnverifiable += 1;
          const reason = selfDrift.unverifiableReason ?? (hashBudgetWasExhausted || hashBudget.exhausted ? "hash-budget-exhausted" : "hash-unavailable");
          recordDegradationOnce({
            kind: "self-drift-unverifiable",
            subject: `inline-blocker:${toRunnerDisplayPath(cwd, entry.filePath)}#${reason}`,
            reason: `the self-drift check was unverifiable: ${reason}`
          });
          if (reason === "hash-budget-exhausted") {
            recordDegradationOnce({
              kind: "self-drift-hash-budget-exhausted",
              subject: `inline-blocker:${toRunnerDisplayPath(cwd, entry.filePath)}`,
              reason: "the aggregate self-drift hash budget was exhausted"
            });
          }
        }
      }
      if (!isLspSourced) {
        if (!setSelfDrift || ownVerdict === void 0) {
          counts.kept += 1;
          continue;
        }
        if (ownVerdict === "unverifiable") {
          if (selfDriftDemoted)
            counts.alreadyStale += 1;
          else
            counts.kept += 1;
          continue;
        }
        const shouldDemote = ownVerdict === "drift";
        const transitioned = setSelfDrift(shouldDemote);
        if (shouldDemote) {
          if (transitioned)
            counts.revalidated += 1;
          else
            counts.alreadyStale += 1;
        } else if (transitioned) {
          counts.selfHealed += 1;
        } else {
          counts.kept += 1;
        }
        continue;
      }
      let contentDecidedOwnFile = false;
      if (setSelfDrift !== void 0 && ownVerdict !== void 0 && entry.recordedSize !== void 0) {
        if (ownVerdict === "drift") {
          const transitioned = setSelfDrift(true);
          if (transitioned)
            counts.revalidated += 1;
          else
            counts.alreadyStale += 1;
          continue;
        }
        if (ownVerdict === "unchanged") {
          contentDecidedOwnFile = true;
          const transitioned = setSelfDrift(false);
          if (transitioned)
            counts.selfHealed += 1;
        } else {
          if (selfDriftDemoted) {
            counts.alreadyStale += 1;
            continue;
          }
        }
      }
      const skipOwnFile = contentDecidedOwnFile;
      const { drifted, truncated } = await detectDrift(cwd, entry.filePath, entry.recordedAtMs, resolveForwardImports, turnIndex, implicitScope, skipOwnFile);
      if (truncated)
        counts.truncatedImports += 1;
      if (drifted.length > 0) {
        entry.demote();
        counts.revalidated += 1;
      } else {
        counts.kept += 1;
      }
    } catch {
      counts.kept += 1;
    }
  }
  counts.hashBudgetExhausted = hashBudget.exhausted ? 1 : 0;
  return counts;
}

export {
  getRunnerTimeoutFloorMs,
  RUNTIME_CONFIG,
  scanDocumentContent,
  lineTextAt,
  exceedsLspSyncLimits,
  loadAstGrepNapi,
  isGoSourceFile,
  goPackageFiles,
  implicitScopeOf,
  goPackageChangedAt,
  feedsJsTsGlobalScope,
  pathBirthtimeMs,
  jsTsCandidatePaths,
  resolveAliasedImport,
  resolveProjectReferenceImport,
  resolveWorkspacePackageImport,
  importSourceNameParts,
  fileAnswerNames,
  resolveImportToFiles,
  symbolExtractionGrammar,
  TreeSitterSymbolExtractor,
  DEPENDENCY_DRIFT_MAX_DELIVERIES,
  SELF_DRIFT_MAX_DELIVERIES,
  _getForwardImportParsesForTests,
  extractForwardImports,
  extractForwardImportPaths,
  collectForwardImportMtimes,
  sweepInlineBlockerFreshness
};
