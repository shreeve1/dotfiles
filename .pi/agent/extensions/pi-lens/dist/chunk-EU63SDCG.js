import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  resolveOpengrepConfig
} from "./chunk-VWCXW2E7.js";
import {
  augmentPythonEnvironment,
  detectPythonEnvironment,
  detectPythonVenv,
  pythonEnvironmentToolCandidates
} from "./chunk-FCSOVF55.js";
import {
  resolveGitCheckout,
  resolveLinkedWorktreeOwner
} from "./chunk-PNQDPDRC.js";
import {
  extensionsForLanguage,
  getUserRuleRoot,
  ruleCorpusFingerprintForCycle
} from "./chunk-724UL2TJ.js";
import {
  load,
  resolvePackagePath
} from "./chunk-QOZXJ4NA.js";
import {
  hasCargoWorkspaceTable,
  readCargoWorkspaceExclude,
  readCargoWorkspaceMembers,
  readTextFileOrUndefined
} from "./chunk-P7266HLM.js";
import {
  HOOK_WALL_BUDGET_MS,
  bounded
} from "./chunk-52FUZI6K.js";
import {
  ensureTool,
  findManagedToolBinary,
  getInstallAttempt,
  getToolEnvironment,
  getToolPath,
  isZizmorAuditTarget,
  logSessionStart,
  resolveZizmorGitHubToken
} from "./chunk-ACXEQZOU.js";
import {
  resolveToolCwd
} from "./chunk-Q7DUK4LX.js";
import {
  findGlobalBinary,
  isProjectLocalBinPath
} from "./chunk-AW7R2GWG.js";
import {
  classifyProbeFailure,
  createAvailabilityLatch,
  describeInstallAttempt,
  logAvailabilityDecision,
  startHostStallSampler
} from "./chunk-VRZP76YM.js";
import {
  OWNER_TAG_ENV,
  SpawnFailureError,
  classifySpawnFailure,
  createGenerationSource,
  ephemeralStagingRoot,
  getGlobalPiLensDir,
  getProjectIgnoreGlobs,
  hasSpawnFailureKind,
  holdOwnChildPid,
  isCommandAvailableAsync,
  isPathIgnoredByProject,
  isPiLensInternalPath,
  ownerTagForChildren,
  resolveWindowsCommandForEnvironment,
  safeSpawnAsync
} from "./chunk-C34ZXZ7O.js";
import {
  DOTNET_CSHARP_ROOT_MARKERS,
  DOTNET_FSHARP_ROOT_MARKERS,
  KIND_EXTENSIONS,
  LEAN_ROOT_MARKERS
} from "./chunk-PHDMFAKM.js";
import {
  isRepoTier,
  lspSectionOf,
  migrationSubject,
  provenanceFor,
  reportConfigReadFailure,
  reportPiLensConfigRecords,
  resolvePiLensConfig,
  summarizeConfigResolution
} from "./chunk-2BBLFX75.js";
import {
  FRESHNESS_CADENCE_MS,
  LSP_NAMESPACE_KEY,
  dirMtimeRecordsAsync,
  dirMtimesStillFreshAsync,
  getPiLensGlobalConfigPath,
  unknownDirMtimeRecords
} from "./chunk-XVF2VVXP.js";
import {
  getProjectTrustState
} from "./chunk-ZANLILYD.js";
import {
  getDegradationLedgerGeneration,
  incrementDegradationCount,
  recordDegradationOnce
} from "./chunk-JAU72XNY.js";
import {
  logExtension
} from "./chunk-XTMJ7XDT.js";
import {
  claimPhaseOncePerSession,
  currentSessionRecordId,
  logLatency,
  releasePhaseClaim
} from "./chunk-QQNQ7SJW.js";
import {
  getGlobalPiLensLogDir,
  getProcessSingleton,
  isTestMode,
  redactSecrets
} from "./chunk-AOHZU2BM.js";
import {
  STAGE_TMP_PATTERN
} from "./chunk-LJDODBBZ.js";
import {
  BoundedFifoMap,
  BoundedLruCache
} from "./chunk-ABBOA7UD.js";
import {
  CARGO_WORKSPACE_MEMBER_DIALECT,
  direntsHaveMarkerGlobMatch,
  findLocalToolConfig,
  isAtOrAboveHomeDir,
  isFullyQualified,
  isUnderDir,
  isVendorPath,
  isWindowsPath,
  matchesWorkspaceMemberPattern,
  normalizeEphemeralMapKey,
  normalizeFilePath,
  normalizeMapKey,
  pathsEqual,
  toPosix
} from "./chunk-N2H3ZPZY.js";
import {
  __require
} from "./chunk-NXL4FFQQ.js";

// dist/clients/analysis-root.js
import * as fs from "node:fs";
import * as os from "node:os";
import * as nodePath from "node:path";
var PROJECT_MARKERS = [
  ".git",
  "package.json",
  "pyproject.toml",
  "Cargo.toml",
  "go.mod",
  "pom.xml",
  "build.gradle",
  "Gemfile",
  "mix.exs",
  "composer.json"
];
function hasProjectMarker(dir) {
  return PROJECT_MARKERS.some((marker) => {
    try {
      const stat2 = fs.statSync(nodePath.join(dir, marker));
      return stat2.isFile() || marker === ".git";
    } catch {
      return false;
    }
  });
}
function nearestProjectRoot(filePath) {
  let dir = nodePath.dirname(nodePath.resolve(filePath));
  const filesystemRoot = nodePath.parse(dir).root;
  while (dir !== filesystemRoot) {
    if (hasProjectMarker(dir))
      return dir;
    dir = nodePath.dirname(dir);
  }
  return hasProjectMarker(filesystemRoot) ? filesystemRoot : void 0;
}
function realPathOrResolved(filePath) {
  const resolved = nodePath.resolve(filePath);
  let current = resolved;
  const missing = [];
  while (true) {
    try {
      const real = fs.realpathSync.native(current);
      return nodePath.join(real, ...missing.reverse());
    } catch {
      const parent = nodePath.dirname(current);
      if (parent === current)
        return resolved;
      missing.push(nodePath.basename(current));
      current = parent;
    }
  }
}
function resolveAnalysisRootPath(filePath, sessionRoot, homeDirOverride) {
  const resolved = realPathOrResolved(filePath);
  const session = realPathOrResolved(sessionRoot);
  const tmp = realPathOrResolved(os.tmpdir());
  const data = process.env.PI_LENS_HOME ? realPathOrResolved(process.env.PI_LENS_HOME) : void 0;
  if (isVendorPath(resolved))
    return void 0;
  if (resolved === tmp || resolved === session || isUnderDir(session, resolved) || !isUnderDir(resolved, session) && (isPiLensInternalPath(resolved, session) || data !== void 0 && (resolved === data || isUnderDir(resolved, data))))
    return void 0;
  if (isUnderDir(resolved, session))
    return session;
  const checkout = resolveGitCheckout(session);
  const linked = checkout && resolveLinkedWorktreeOwner(checkout, resolved);
  if (linked && !isVendorPath(resolved))
    return linked.root;
  const candidate = nearestProjectRoot(resolved);
  if (!candidate || candidate === nodePath.parse(candidate).root)
    return void 0;
  const home = realPathOrResolved(homeDirOverride ?? os.homedir());
  if (isAtOrAboveHomeDir(candidate, home))
    return void 0;
  if (candidate === tmp || isUnderDir(session, candidate))
    return void 0;
  if (isVendorPath(candidate))
    return void 0;
  return candidate;
}
function resolveAnalysisRoot(filePath, sessionRoot, homeDirOverride) {
  const resolved = realPathOrResolved(filePath);
  if (isVendorPath(resolved))
    return "none";
  const checkout = resolveGitCheckout(sessionRoot);
  if (checkout && resolveLinkedWorktreeOwner(checkout, resolved)) {
    return "linked-worktree";
  }
  const root = resolveAnalysisRootPath(filePath, sessionRoot, homeDirOverride);
  if (!root)
    return "none";
  if (root === nodePath.resolve(sessionRoot))
    return "session";
  return "adopted";
}
function canWriteAnalysisRoot(mode) {
  return mode === "session" || mode === "linked-worktree";
}

// dist/clients/lsp/server.js
import { existsSync as existsSync3, mkdirSync as mkdirSync2, statSync as statSync4 } from "node:fs";
import { access, readFile, readdir, stat } from "node:fs/promises";
import os7 from "node:os";
import path6 from "node:path";

// dist/clients/sgconfig.js
import { createHash } from "node:crypto";
import * as fs2 from "node:fs";
import * as os2 from "node:os";
import * as path from "node:path";
var SGCONFIG_NAMES = ["sgconfig.yml", "sgconfig.yaml"];
function findLocalSgconfig(startDir) {
  return findLocalToolConfig(startDir, SGCONFIG_NAMES);
}
function canonicalDir(dir) {
  try {
    return fs2.realpathSync.native(dir);
  } catch {
    return path.resolve(dir);
  }
}
function getAstGrepRuleSources(projectRoot = process.cwd()) {
  const root = path.resolve(projectRoot || process.cwd());
  const packageRoot = resolvePackagePath(import.meta.url);
  const candidates = [];
  if (canonicalDir(root) !== canonicalDir(packageRoot)) {
    candidates.push({
      dir: path.join(root, "rules", "ast-grep-rules", "rules"),
      origin: "project",
      tier: "primary"
    }, {
      dir: path.join(root, "rules", "ast-grep-rules", "coderabbit", "rules"),
      origin: "project",
      tier: "secondary"
    });
  }
  const userRoot = getUserRuleRoot();
  if (canonicalDir(userRoot) !== canonicalDir(root)) {
    candidates.push({
      dir: path.join(userRoot, "ast-grep-rules", "rules"),
      origin: "user",
      tier: "primary"
    }, {
      dir: path.join(userRoot, "ast-grep-rules", "coderabbit", "rules"),
      origin: "user",
      tier: "secondary"
    });
  }
  candidates.push({
    dir: path.join(packageRoot, "rules", "ast-grep-rules", "rules"),
    origin: "bundled",
    tier: "primary"
  }, {
    dir: path.join(packageRoot, "rules", "ast-grep-rules", "coderabbit", "rules"),
    origin: "bundled",
    tier: "secondary"
  });
  const seen = /* @__PURE__ */ new Set();
  return candidates.filter((source) => {
    if (!fs2.existsSync(source.dir))
      return false;
    const key = canonicalDir(source.dir);
    if (seen.has(key))
      return false;
    seen.add(key);
    return true;
  });
}
function findYamlFiles(dir) {
  const files = [];
  let entries;
  try {
    entries = fs2.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return files;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findYamlFiles(full));
    } else if (entry.isFile() && /\.ya?ml$/i.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}
function parseRuleId(raw) {
  const scalar = raw.match(/^id:\s*(.*?)\s*$/m)?.[1];
  if (!scalar)
    return void 0;
  const withoutComment = scalar.replace(/\s+#.*$/, "").trim();
  const unquoted = withoutComment.startsWith('"') && withoutComment.endsWith('"') || withoutComment.startsWith("'") && withoutComment.endsWith("'") ? withoutComment.slice(1, -1) : withoutComment;
  if (/^[A-Za-z0-9_.:-]+$/.test(unquoted))
    return unquoted;
  try {
    const parsed = load(raw);
    if (!parsed || typeof parsed !== "object" || !("id" in parsed)) {
      return void 0;
    }
    const id = parsed.id;
    return typeof id === "string" ? id : void 0;
  } catch {
    return void 0;
  }
}
function parseRuleDocuments(content) {
  return content.split(/^---\s*$/m).filter((document) => document.trim()).map((raw) => ({ raw, id: parseRuleId(raw) }));
}
var bundledSnapshots = /* @__PURE__ */ new Map();
function snapshotRuleSource(source) {
  const cacheKey = canonicalDir(source.dir);
  if (source.origin === "bundled") {
    const cached = bundledSnapshots.get(cacheKey);
    if (cached)
      return cached;
  }
  const hash = createHash("sha256");
  const files = [];
  for (const file of findYamlFiles(source.dir)) {
    const relativePath = path.relative(source.dir, file);
    hash.update(relativePath);
    hash.update("\0");
    let content;
    try {
      content = fs2.readFileSync(file, "utf8");
    } catch {
      hash.update("missing");
      hash.update("\0");
      continue;
    }
    hash.update(content);
    hash.update("\0");
    const documents = parseRuleDocuments(content);
    if (source.origin === "user" && documents.some((document) => !document.id)) {
      recordDegradationOnce({
        kind: "ast-grep-rule-invalid",
        subject: file,
        reason: "user ast-grep rule has no valid rule id"
      });
    }
    files.push({ file, relativePath, documents });
  }
  const snapshot = { ...source, files, digest: hash.digest("hex") };
  if (source.origin === "bundled")
    bundledSnapshots.set(cacheKey, snapshot);
  return snapshot;
}
function sourceFingerprint(sources) {
  const hash = createHash("sha256");
  for (const source of sources) {
    hash.update(source.origin);
    hash.update("\0");
    hash.update(source.tier);
    hash.update("\0");
    hash.update(canonicalDir(source.dir));
    hash.update("\0");
    hash.update(source.digest);
    hash.update("\0");
  }
  return hash.digest("hex");
}
function getAstGrepRuleFingerprint(projectRoot = process.cwd(), options = {}) {
  const root = path.resolve(projectRoot || process.cwd());
  return ruleCorpusFingerprintForCycle("ast-grep", root, (fingerprintRoot) => sourceFingerprint(getAstGrepRuleSources(fingerprintRoot).map(snapshotRuleSource)), options.force);
}
function materializeMergedRuleDir(sources, mergedDir) {
  fs2.rmSync(mergedDir, { recursive: true, force: true });
  fs2.mkdirSync(mergedDir, { recursive: true });
  const claimedByEarlierSource = /* @__PURE__ */ new Set();
  for (const [sourceIndex, source] of sources.entries()) {
    const claimedThisSource = /* @__PURE__ */ new Set();
    for (const [fileIndex, file] of source.files.entries()) {
      const survivingDocuments = file.documents.filter((document) => {
        if (!document.id)
          return true;
        if (claimedByEarlierSource.has(document.id))
          return false;
        claimedThisSource.add(document.id);
        return true;
      });
      if (survivingDocuments.length === 0)
        continue;
      const destination = path.join(mergedDir, `source${sourceIndex}-${String(fileIndex).padStart(5, "0")}.yml`);
      if (survivingDocuments.length === file.documents.length) {
        fs2.copyFileSync(file.file, destination);
      } else {
        fs2.writeFileSync(destination, `${survivingDocuments.map((document) => document.raw.trim()).join("\n---\n")}
`);
      }
    }
    for (const id of claimedThisSource)
      claimedByEarlierSource.add(id);
  }
}
var cachedBaselines = /* @__PURE__ */ new Map();
function rootArtifactKey(root) {
  return createHash("sha256").update(root).digest("hex").slice(0, 12);
}
function resolveBaselineSgconfig(projectRoot = process.cwd()) {
  const root = canonicalDir(path.resolve(projectRoot || process.cwd()));
  const fingerprint = getAstGrepRuleFingerprint(root, { force: true });
  const cached = cachedBaselines.get(root);
  if (cached?.fingerprint === fingerprint && fs2.existsSync(cached.path) && fs2.existsSync(cached.mergedDir)) {
    return cached.path;
  }
  const sources = getAstGrepRuleSources(root).map(snapshotRuleSource);
  if (sources.length === 0)
    return void 0;
  const dir = path.join(os2.tmpdir(), "pi-lens-ast-grep");
  fs2.mkdirSync(dir, { recursive: true });
  const artifactKey = rootArtifactKey(root);
  const file = path.join(dir, `baseline-${process.pid}-${artifactKey}.sgconfig.yml`);
  const mergedDir = path.join(dir, `baseline-${process.pid}-${artifactKey}.rules`);
  const protectedArtifacts = /* @__PURE__ */ new Set([file, mergedDir]);
  for (const baseline of cachedBaselines.values()) {
    protectedArtifacts.add(baseline.path);
    protectedArtifacts.add(baseline.mergedDir);
  }
  cleanupStaleBaselines(dir, protectedArtifacts);
  materializeMergedRuleDir(sources, mergedDir);
  const ruleDirForYaml = mergedDir.split(path.sep).join("/");
  fs2.writeFileSync(file, `ruleDirs:
  - ${JSON.stringify(ruleDirForYaml)}
`);
  cachedBaselines.set(root, { fingerprint, path: file, mergedDir });
  enforceBaselineEntryCap(dir, /* @__PURE__ */ new Set([file, mergedDir]));
  return file;
}
var SG_BASELINE_RETAINED_ENTRIES = 24;
function enforceBaselineEntryCap(dir, keep) {
  let names;
  try {
    names = fs2.readdirSync(dir);
  } catch {
    return;
  }
  const candidates = [];
  for (const name of names) {
    const isConfig = /^baseline(?:-\d+(?:-[a-f0-9]+)?)?\.sgconfig\.yml$/.test(name);
    const isMergedDir = /^baseline-\d+(?:-[a-f0-9]+)?\.rules$/.test(name);
    if (!isConfig && !isMergedDir)
      continue;
    const full = path.join(dir, name);
    if (keep.has(full))
      continue;
    try {
      candidates.push({
        full,
        mtimeMs: fs2.statSync(full).mtimeMs,
        recursive: isMergedDir
      });
    } catch {
    }
  }
  const over = candidates.length + keep.size - SG_BASELINE_RETAINED_ENTRIES;
  if (over <= 0)
    return;
  candidates.sort((a, b) => a.mtimeMs - b.mtimeMs);
  let evicted = 0;
  for (const candidate of candidates.slice(0, over)) {
    try {
      fs2.rmSync(candidate.full, {
        recursive: candidate.recursive,
        force: true
      });
      evicted += 1;
      for (const [root, baseline] of cachedBaselines) {
        if (baseline.path === candidate.full || baseline.mergedDir === candidate.full) {
          cachedBaselines.delete(root);
        }
      }
    } catch {
    }
  }
  if (evicted > 0) {
    recordDegradationOnce({
      kind: "sgconfig-baseline-cap-evict",
      subject: dir,
      reason: `evicted ${evicted} oldest baseline entries over the ${SG_BASELINE_RETAINED_ENTRIES}-entry cap`
    });
  }
}
function cleanupStaleBaselines(dir, keep) {
  try {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1e3;
    for (const name of fs2.readdirSync(dir)) {
      const isConfig = /^baseline(?:-\d+(?:-[a-f0-9]+)?)?\.sgconfig\.yml$/.test(name);
      const isMergedDir = /^baseline-\d+(?:-[a-f0-9]+)?\.rules$/.test(name);
      if (!isConfig && !isMergedDir)
        continue;
      const full = path.join(dir, name);
      if (keep.has(full))
        continue;
      try {
        const stat2 = fs2.statSync(full);
        if (stat2.mtimeMs < cutoff) {
          fs2.rmSync(full, { recursive: stat2.isDirectory(), force: true });
        }
      } catch {
      }
    }
  } catch {
  }
}

// dist/clients/typos-config.js
var LOCAL_TYPOS_CONFIG_NAMES = [
  "typos.toml",
  "_typos.toml",
  ".typos.toml"
];
function findLocalTyposConfig(startDir) {
  return findLocalToolConfig(startDir, LOCAL_TYPOS_CONFIG_NAMES);
}

// dist/clients/lsp/server-traits.js
var ROLE_MEMBERS = {
  language: "language",
  auxiliary: "auxiliary"
};
var DEFAULT_LSP_SERVER_ROLE = "language";
function isAuxiliary(bearer) {
  const declared = bearer?.role;
  const role = typeof declared === "string" && Object.hasOwn(ROLE_MEMBERS, declared) ? ROLE_MEMBERS[declared] : DEFAULT_LSP_SERVER_ROLE;
  switch (role) {
    case "auxiliary":
      return true;
    case "language":
      return false;
  }
}
var DEFAULT_NOTIFY_INFLIGHT_LIMIT = 8;
var DEFAULT_REPLY_ORDERING = "unmeasured";
function serverTraits(declaration) {
  const declaredLimit = declaration.notifyInflightLimit;
  if (typeof declaredLimit === "number" && Number.isFinite(declaredLimit) && declaredLimit > 0) {
    return {
      role: declaration.role,
      notifyInflightLimit: Math.floor(declaredLimit),
      replyOrdering: declaration.replyOrdering ?? DEFAULT_REPLY_ORDERING
    };
  }
  const envLimit = Number(process.env.PI_LENS_LSP_AUX_NOTIFY_INFLIGHT);
  return {
    role: declaration.role,
    notifyInflightLimit: Number.isFinite(envLimit) && envLimit > 0 ? Math.floor(envLimit) : DEFAULT_NOTIFY_INFLIGHT_LIMIT,
    replyOrdering: declaration.replyOrdering ?? DEFAULT_REPLY_ORDERING
  };
}

// dist/clients/lsp/config.js
import * as os4 from "node:os";
import path3 from "node:path";

// dist/clients/dispatch/known-runner-ids.js
var knownRunnerIds = /* @__PURE__ */ new Set();
function registerRunnerId(id) {
  knownRunnerIds.add(id);
}
function runnerIdentityPopulated() {
  return knownRunnerIds.size > 0;
}
function isKnownRunnerId(id) {
  return knownRunnerIds.has(id);
}

// dist/clients/lsp/launch.js
import { AsyncLocalStorage } from "node:async_hooks";
import { execFileSync, spawn as nodeSpawn } from "node:child_process";
import fs4 from "node:fs";
import os3 from "node:os";
import path2 from "node:path";

// dist/clients/lsp/ruby-drive-dirs.js
import * as fs3 from "node:fs";
var RUBY_VERSION_DIR = /^ruby\d/i;
var rubyDirNamesCache = new BoundedLruCache(16);
function rubyDriveKey(driveRoot) {
  return normalizeMapKey(driveRoot);
}
function filterRubyDirNames(entries) {
  return entries.filter((name) => RUBY_VERSION_DIR.test(name));
}
function getRubyVersionDirNamesSync(driveRoot) {
  const key = rubyDriveKey(driveRoot);
  const cached = rubyDirNamesCache.get(key);
  if (cached !== void 0)
    return cached;
  let names;
  try {
    names = filterRubyDirNames(fs3.readdirSync(driveRoot));
  } catch {
    names = [];
  }
  rubyDirNamesCache.set(key, names);
  return names;
}
async function getRubyVersionDirNamesAsync(driveRoot) {
  const key = rubyDriveKey(driveRoot);
  const cached = rubyDirNamesCache.get(key);
  if (cached !== void 0)
    return cached;
  let names;
  try {
    names = filterRubyDirNames(await fs3.promises.readdir(driveRoot));
  } catch {
    names = [];
  }
  rubyDirNamesCache.set(key, names);
  return names;
}

// dist/clients/lsp/launch.js
var isWindows = process.platform === "win32";
var OWNER_TAG_READ_MS = 5e3;
function computeNeedsShell(resolvedCommand) {
  return isWindows && (resolvedCommand.includes(" ") || /\.(cmd|bat)$/i.test(resolvedCommand) || !/\.(exe|cmd|bat)$/i.test(resolvedCommand));
}
var DEFAULT_STARTUP_FAILURE_WINDOW_MS = 50;
var WINDOWS_NAV_STARTUP_FAILURE_WINDOW_MS = 500;
var SESSIONSTART_LOG_DIR = getGlobalPiLensLogDir();
var SESSIONSTART_LOG = path2.join(SESSIONSTART_LOG_DIR, "sessionstart.log");
var PI_LENS_BIN_DIR = path2.join(getGlobalPiLensDir(), "bin");
var PI_LENS_TOOLS_BIN_DIR = path2.join(getGlobalPiLensDir(), "tools", "node_modules", ".bin");
function logSessionStart2(msg) {
  if (isTestMode()) {
    return;
  }
  const line = redactSecrets(`[${(/* @__PURE__ */ new Date()).toISOString()}] ${msg}
`);
  try {
    fs4.mkdirSync(SESSIONSTART_LOG_DIR, { recursive: true });
    fs4.appendFileSync(SESSIONSTART_LOG, line);
  } catch {
  }
}
function compactLogValue(value, max = 280) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized)
    return "";
  return normalized.length > max ? `${normalized.slice(0, max)}...` : normalized;
}
function delimiterForPlatform(platform) {
  return platform === "win32" ? ";" : ":";
}
function splitPathEntries(value, delimiter) {
  if (!value)
    return [];
  return value.split(delimiter).map((entry) => entry.trim()).filter((entry) => entry.length > 0);
}
function normalizePathEntry(entry, platform) {
  if (platform !== "win32")
    return path2.posix.normalize(entry);
  return path2.win32.normalize(entry).toLowerCase();
}
function combinePathValuesForPlatform(values, platform = process.platform) {
  const unique = [];
  const seen = /* @__PURE__ */ new Set();
  const delimiter = delimiterForPlatform(platform);
  for (const value of values) {
    for (const entry of splitPathEntries(value, delimiter)) {
      const key = normalizePathEntry(entry, platform);
      if (seen.has(key))
        continue;
      seen.add(key);
      unique.push(entry);
    }
  }
  return unique.join(delimiter);
}
function resolvePathValue(env) {
  return combinePathValuesForPlatform([env.PATH, env.Path, env.path]);
}
function runStderrGuardedProbe(command, args) {
  try {
    const { execFileSync: execFileSync2 } = __require("node:child_process");
    const out = execFileSync2(command, args, {
      timeout: 3e3,
      encoding: "utf8",
      // #2095 sibling: execFileSync inherits stderr to the parent by
      // default (only stdout is captured into `out`), so a failed
      // powershell.exe launch would print raw diagnostics into the pi
      // TUI even though the surrounding catch already returns "" (read as
      // "unknown" PATH by every caller). Pipe stderr instead of inheriting it.
      stdio: ["ignore", "pipe", "ignore"]
    });
    return out.trim();
  } catch {
    return "";
  }
}
function readWindowsRegistryPath() {
  return runStderrGuardedProbe("powershell.exe", [
    "-NoProfile",
    "-NonInteractive",
    "-Command",
    "[System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')"
  ]);
}
var _liveWindowsPath = null;
function getLiveWindowsPath() {
  if (_liveWindowsPath === null) {
    _liveWindowsPath = readWindowsRegistryPath();
  }
  return _liveWindowsPath;
}
async function buildAugmentedPath(basePath) {
  const candidates = [];
  const nodeDir = path2.dirname(process.execPath);
  if (nodeDir) {
    candidates.push(nodeDir);
  }
  if (isWindows) {
    const home = os3.homedir();
    const driveRoot = path2.parse(home).root;
    candidates.push(path2.join(home, ".cargo", "bin"));
    candidates.push(path2.join(home, "go", "bin"));
    candidates.push(path2.join(home, ".dotnet", "tools"));
    candidates.push(PI_LENS_BIN_DIR);
    candidates.push(PI_LENS_TOOLS_BIN_DIR);
    candidates.push(path2.join(driveRoot, "Program Files", "Go", "bin"));
    candidates.push(path2.join(driveRoot, "Go", "bin"));
    for (const entry of await getRubyVersionDirNamesAsync(driveRoot)) {
      candidates.push(path2.join(driveRoot, entry, "bin"));
    }
  }
  const effectiveBase = isWindows ? combinePathValuesForPlatform([basePath, getLiveWindowsPath()]) : basePath;
  const existing = /* @__PURE__ */ new Set();
  for (const entry of splitPathEntries(effectiveBase, path2.delimiter)) {
    if (!entry)
      continue;
    existing.add(normalizePathEntry(entry, process.platform));
  }
  const toAppend = [];
  for (const candidate of candidates) {
    if (!candidate || !fs4.existsSync(candidate))
      continue;
    const normalized = normalizePathEntry(candidate, process.platform);
    if (existing.has(normalized))
      continue;
    toAppend.push(candidate);
    existing.add(normalized);
  }
  if (toAppend.length === 0)
    return basePath ?? "";
  if (!basePath)
    return toAppend.join(path2.delimiter);
  return `${basePath}${path2.delimiter}${toAppend.join(path2.delimiter)}`;
}
function isCmdShimValid(cmdPath) {
  try {
    const content = fs4.readFileSync(cmdPath, "utf-8");
    const match = content.match(/"%~dp0[/\\]\.\.[/\\]((?:[\w./@-]|\\)+\.(?:mjs|cjs|js))"/i);
    if (!match)
      return true;
    const relPath = match[1].replace(/[/\\]/g, path2.sep);
    const target = path2.resolve(path2.dirname(cmdPath), "..", relPath);
    return fs4.existsSync(target);
  } catch {
    return true;
  }
}
function isMissingWindowsStartupCommand(command, spawnCommand, cwd, env) {
  if (!isWindows)
    return false;
  if (/\.(cmd|bat)$/i.test(spawnCommand) && !isCmdShimValid(spawnCommand)) {
    return true;
  }
  if (spawnCommand !== command)
    return false;
  return resolveWindowsCommandForEnvironment(command, cwd, env) === null;
}
function bypassPs1OnWindows(ps1Path, args) {
  const cmdPath = `${ps1Path.slice(0, -4)}.cmd`;
  if (fs4.existsSync(cmdPath)) {
    return { command: cmdPath, args, needsShell: true };
  }
  try {
    const content = fs4.readFileSync(ps1Path, "utf-8");
    const match = content.match(/"\$basedir[/\\]\.\.[/\\]((?:[\w./@-]|\\)+\.(?:mjs|cjs|js))"/i);
    if (match) {
      const relPath = match[1].replace(/[/\\]/g, path2.sep);
      const jsPath = path2.resolve(path2.dirname(ps1Path), "..", relPath);
      if (fs4.existsSync(jsPath)) {
        return {
          command: process.execPath,
          args: [jsPath, ...args],
          needsShell: false
        };
      }
    }
  } catch {
  }
  return void 0;
}
function findBinaryOnPath(command, env) {
  try {
    const result = execFileSync(isWindows ? "where" : "which", [command], {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
      env,
      // #1980 population sweep: this was the one synchronous
      // child-process site in the repo with no bound at all. It runs on
      // the LSP server spawn path, so an unresponsive `where`/`which` — a
      // stale network PATH entry is the classic cause — parked the event
      // loop with no ceiling, and read as ordinary compute in
      // `loop_block`. 5s matches `isCommandAvailable`/`findCommand` in
      // clients/safe-spawn.ts, which run these same two binaries.
      timeout: 5e3
    }).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    for (const candidate of result) {
      if (fs4.existsSync(candidate)) {
        return candidate;
      }
    }
  } catch {
  }
  return void 0;
}
var lspProjectCodePermission = new AsyncLocalStorage();
function withLspProjectCodePermission(allowed, spawn) {
  return lspProjectCodePermission.run(allowed, spawn);
}
var unknownProjectLocalNoticeGeneration = -1;
function recordUntrustedLspExecution(request, trust) {
  const generation = getDegradationLedgerGeneration();
  const subject = request.kind === "project-code-server" ? `project-code-server:g${generation}:${request.serverId}:${request.root}` : `project-local-binary:g${generation}:${path2.basename(request.command)}`;
  const metadata = request.kind === "project-code-server" ? {
    field: request.kind,
    serverId: request.serverId,
    root: request.root,
    trust
  } : {
    field: request.kind,
    trust
  };
  recordDegradationOnce({
    kind: "lsp-registry-decision",
    subject,
    reason: (request.kind === "project-local-binary" ? request.reason : void 0) ?? `LSP execution refused: ${request.kind} and project trust is ${trust}`,
    metadata
  });
  if (unknownProjectLocalNoticeGeneration !== generation) {
    unknownProjectLocalNoticeGeneration = generation;
    const label = request.kind === "project-code-server" ? "project-code LSP server" : "project-local LSP binary";
    logExtension({
      subsystem: "lsp-registry",
      level: "warn",
      message: `${label} refused: mark the project trusted in pi or upgrade pi`,
      metadata: { field: request.kind }
    });
  }
}
function refuseUntrustedLspExecution(request) {
  const trust = getProjectTrustState();
  const needsTrust = request.kind === "project-code-server" ? trust !== "trusted" : !admitProjectSuppliedTsserver(request.resolvedCommand, request.cwd, true);
  if (!needsTrust)
    return;
  if (request.kind === "project-code-server")
    recordUntrustedLspExecution(request, trust);
  throw new SpawnFailureError("spawn-failed", `LSP ${request.kind === "project-code-server" ? "project-code server" : "project-local binary"} refused: project trust is ${trust}`, new Error(`project trust is ${trust}`));
}
function admitProjectSuppliedTsserver(tsserverPath, cwd, projectSupplied, projectCodeAllowed = lspProjectCodePermission.getStore() ?? false) {
  const trust = getProjectTrustState();
  if (tsserverPath && (!projectSupplied || projectCodeAllowed && trust === "trusted"))
    return tsserverPath;
  recordUntrustedLspExecution({
    kind: "project-local-binary",
    command: tsserverPath ?? "tsserver.js",
    resolvedCommand: tsserverPath ?? "tsserver.js",
    cwd,
    reason: tsserverPath ? "LSP execution refused: project compiler requires trusted session ownership" : "LSP execution refused: no admitted absolute TypeScript compiler"
  }, trust);
  return void 0;
}
function isProjectLocalLspBinary(resolvedCommand, cwd) {
  return isProjectLocalBinPath(resolvedCommand, cwd);
}
function trySpawn(command, args, cwd, env, needsShell) {
  let proc;
  if (needsShell) {
    const escapeCmdArg = (s) => {
      const escaped = s.replace(/([&|<>^()!])/g, "^$1");
      return /[\s"]/.test(escaped) ? `"${escaped.replace(/"/g, '""')}"` : escaped;
    };
    const shellCommand = `"${command}" ${args.map(escapeCmdArg).join(" ")}`;
    proc = nodeSpawn(shellCommand, [], {
      cwd,
      env,
      stdio: ["pipe", "pipe", "pipe"],
      detached: !isWindows,
      windowsHide: true,
      shell: true
    });
  } else {
    proc = nodeSpawn(command, args, {
      cwd,
      env,
      stdio: ["pipe", "pipe", "pipe"],
      detached: !isWindows,
      windowsHide: isWindows
    });
  }
  if (!proc.stdin || !proc.stdout || !proc.stderr) {
    throw new Error(`Failed to spawn LSP server: ${command}`);
  }
  holdOwnChildPid(proc.pid, "lsp-spawn");
  return proc;
}
function unrefLspProcessHandles(proc) {
  try {
    proc.unref();
  } catch {
  }
  for (const stream of [proc.stdin, proc.stdout, proc.stderr]) {
    try {
      stream?.unref?.();
    } catch {
    }
  }
}
function _attachErrorHandler(proc, context, logContext, rejectOnImmediateError) {
  let stderrPreview = "";
  let closeLogged = false;
  const onStderr = (chunk) => {
    if (stderrPreview.length >= 4e3)
      return;
    stderrPreview += chunk.toString();
  };
  proc.stderr?.on("data", onStderr);
  proc.on("error", (err) => {
    if (logContext) {
      logSessionStart2("lsp process " + context + ": spawn-error command=" + logContext.command + " args=" + JSON.stringify(logContext.args) + " cwd=" + logContext.cwd + " pid=" + (logContext.pid ?? 0) + " error=" + err.message + (stderrPreview ? " stderr=" + compactLogValue(stderrPreview) : ""));
    }
    if (rejectOnImmediateError && logContext) {
      void classifySpawnFailure(err, {
        command: logContext.command,
        cwd: logContext.cwd
      }).then(rejectOnImmediateError);
    }
  });
  proc.on("close", (code, signal) => {
    if (closeLogged)
      return;
    closeLogged = true;
    proc.stderr?.off("data", onStderr);
    if (code !== 0 && code !== null) {
      if (logContext) {
        logSessionStart2("lsp process " + context + ": closed code=" + code + (signal ? " signal=" + signal : "") + " command=" + logContext.command + " args=" + JSON.stringify(logContext.args) + " cwd=" + logContext.cwd + " pid=" + (logContext.pid ?? 0) + (stderrPreview ? " stderr=" + compactLogValue(stderrPreview) : ""));
      }
    } else if (signal && logContext) {
      logSessionStart2("lsp process " + context + ": closed signal=" + signal + " command=" + logContext.command + " args=" + JSON.stringify(logContext.args) + " cwd=" + logContext.cwd + " pid=" + (logContext.pid ?? 0) + (stderrPreview ? " stderr=" + compactLogValue(stderrPreview) : ""));
    }
  });
}
async function launchLSP(command, args = [], options = {}) {
  const cwd = String(options.cwd ?? process.cwd());
  const mergedEnv = { ...process.env, ...options.env };
  const augmentedPath = await buildAugmentedPath(resolvePathValue(mergedEnv));
  const ownerTag = await ownerTagForChildren({ timeoutMs: OWNER_TAG_READ_MS });
  const env = {
    ...mergedEnv,
    PATH: augmentedPath,
    ...isWindows ? { Path: augmentedPath } : {}
  };
  if (ownerTag === void 0)
    delete env[OWNER_TAG_ENV];
  else
    env[OWNER_TAG_ENV] = ownerTag;
  const isRelativePath = !isFullyQualified(command) && (command.includes(path2.sep) || command.includes("/"));
  const explicitCommand = isRelativePath ? path2.resolve(cwd, command) : command;
  const resolvedCommand = !isFullyQualified(command) && !command.includes(path2.sep) && !command.includes("/") ? findBinaryOnPath(command, env) ?? explicitCommand : explicitCommand;
  let needsShell = computeNeedsShell(resolvedCommand);
  let spawnCommand = resolvedCommand;
  if (!isFullyQualified(command) && !command.includes(path2.sep) && !command.includes("/")) {
    const globalBinPath = await findGlobalBinary(command);
    if (globalBinPath) {
      spawnCommand = globalBinPath;
      needsShell = computeNeedsShell(spawnCommand);
    }
  }
  if (isProjectLocalLspBinary(spawnCommand, cwd)) {
    refuseUntrustedLspExecution({
      kind: "project-local-binary",
      command,
      resolvedCommand: spawnCommand,
      cwd
    });
  }
  if (isWindows && /\.(cmd|bat)$/i.test(spawnCommand) && !isCmdShimValid(spawnCommand)) {
    logSessionStart2(`lsp cmd-shim-invalid: ${spawnCommand} target missing \u2014 skipping candidate`);
    const cause = Object.assign(new Error(`LSP .cmd shim target not found: ${spawnCommand}`), { code: "ENOENT" });
    throw await classifySpawnFailure(cause, { command, cwd });
  }
  if (isWindows && /\.ps1$/i.test(spawnCommand)) {
    const bypass = bypassPs1OnWindows(spawnCommand, args);
    if (bypass) {
      logSessionStart2(`lsp ps1-bypass: ${spawnCommand} \u2192 ${bypass.command} shell=${bypass.needsShell}`);
      spawnCommand = bypass.command;
      args = bypass.args;
      needsShell = bypass.needsShell;
    } else {
      logSessionStart2(`lsp ps1-bypass: no .cmd or JS entry found for ${spawnCommand}, spawn may hang`);
    }
  }
  let proc;
  try {
    proc = trySpawn(spawnCommand, args, cwd, env, needsShell);
  } catch (err) {
    if (!isFullyQualified(command) && !command.includes(path2.sep) && !command.includes("/")) {
      const globalBinPath = await findGlobalBinary(command);
      if (globalBinPath && globalBinPath !== spawnCommand) {
        const needsShellGlobal = computeNeedsShell(globalBinPath);
        proc = trySpawn(globalBinPath, args, cwd, env, needsShellGlobal);
      } else {
        throw await classifySpawnFailure(err, { command, cwd });
      }
    } else {
      throw await classifySpawnFailure(err, { command, cwd });
    }
  }
  if (!proc.stdin || !proc.stdout || !proc.stderr) {
    throw new Error(`Failed to spawn LSP server: ${command}`);
  }
  if (proc.exitCode !== null || proc.killed) {
    const message = `LSP server ${command} exited immediately (code: ${proc.exitCode}). The binary may be missing or corrupted.`;
    const failure = new Error(message);
    if (proc.exitCode === 1 && isMissingWindowsStartupCommand(command, spawnCommand, cwd, env)) {
      throw new SpawnFailureError("tool-not-found", message, failure);
    }
    throw failure;
  }
  logSessionStart2(`lsp launch: command=${command} resolved=${spawnCommand} args=${JSON.stringify(args)} cwd=${cwd} shell=${needsShell ? "true" : "false"} pid=${proc.pid ?? 0}`);
  const formatStartupStderr = (stderr) => {
    const normalized = compactLogValue(stderr);
    if (!normalized)
      return "";
    return ` stderr=${normalized}`;
  };
  let startupStderr = "";
  const onStartupStderr = (chunk) => {
    if (startupStderr.length >= 4e3)
      return;
    startupStderr += chunk.toString();
  };
  proc.stderr?.on("data", onStartupStderr);
  try {
    await new Promise((resolve4, reject) => {
      let settled = false;
      proc.on("error", (err) => {
        if (!settled) {
          settled = true;
          void classifySpawnFailure(err, { command, cwd }).then((failure) => {
            const detail = formatStartupStderr(startupStderr);
            reject(detail ? new SpawnFailureError(failure.kind, `${failure.message}${detail}`, failure.cause) : failure);
          });
        }
      });
      proc.on("exit", (code) => {
        if (!settled && code !== null) {
          settled = true;
          const isWindowsCmd = isWindows && command.endsWith(".cmd");
          const errorMsg = isWindowsCmd && code === 1 ? `npm .cmd shim failed (underlying binary not installed). Run 'npm install' in this project or use a global installation.` : `The binary may be missing or corrupted.`;
          const message = `LSP server ${command} exited immediately with code ${code}. ${errorMsg}${formatStartupStderr(startupStderr)}`;
          const failure = new Error(message);
          if (code === 1 && isMissingWindowsStartupCommand(command, spawnCommand, cwd, env)) {
            reject(new SpawnFailureError("tool-not-found", message, failure));
            return;
          }
          reject(failure);
        }
      });
      const startupFailureWindowMs = (() => {
        if (options?.startupFailureWindowMs) {
          return options.startupFailureWindowMs;
        }
        if (isWindows && needsShell) {
          return WINDOWS_NAV_STARTUP_FAILURE_WINDOW_MS;
        }
        return DEFAULT_STARTUP_FAILURE_WINDOW_MS;
      })();
      setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve4();
        }
      }, startupFailureWindowMs);
    });
  } finally {
    proc.stderr?.off("data", onStartupStderr);
  }
  _attachErrorHandler(proc, command, {
    command: spawnCommand,
    args,
    cwd,
    pid: proc.pid ?? 0
  });
  unrefLspProcessHandles(proc);
  return {
    process: proc,
    stdin: proc.stdin,
    stdout: proc.stdout,
    stderr: proc.stderr,
    pid: proc.pid ?? 0,
    command: spawnCommand,
    args
  };
}

// dist/clients/lsp/config.js
function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : void 0;
}
var CONFIG_RESOLVED_PHASE = "config_resolved";
function configResolutionKey(cwd) {
  return normalizeFilePath(path3.resolve(normalizeFilePath(cwd)));
}
function publishConfigResolutionPending(cwd) {
  logSessionStart(`session_start config_resolution_pending session=${currentSessionRecordId()} root=${configResolutionKey(cwd)}`);
}
function recordConfigResolved(cwd, resolution, lspConfig, homeDir, resolveMs) {
  const root = configResolutionKey(cwd);
  if (!claimPhaseOncePerSession(CONFIG_RESOLVED_PHASE, root)) {
    return;
  }
  const summary = summarizeConfigResolution(resolution, homeDir);
  const sessionId = currentSessionRecordId();
  const deniedServers = lspConfig.disabledServers?.length ?? 0;
  const legacyDocuments = summary.documents.filter((document) => document.legacy).length;
  logLatency({
    type: "phase",
    phase: CONFIG_RESOLVED_PHASE,
    filePath: root,
    durationMs: resolveMs,
    metadata: {
      sessionId,
      documents: summary.documents,
      countsByTier: summary.countsByTier,
      recordCount: summary.recordCount,
      deniedServers,
      resolveMs
    }
  });
  logSessionStart(`config resolved documents=${summary.documents.length} legacy=${legacyDocuments} records=${summary.recordCount} deniedServers=${deniedServers} resolveMs=${resolveMs} session=${sessionId} root=${root}`);
}
async function loadLSPConfig(cwd, homeDir = os4.homedir(), options = {}) {
  const reporting = options.report !== false;
  publishConfigResolutionPending(cwd);
  const resolveStartedAt = Date.now();
  const resolution = resolvePiLensConfig({
    cwd,
    globalDir: getGlobalPiLensDir(),
    // The global tier reads the PRODUCTION resolution (global-config-location
    // PR, refs #2457): which file supplies it is an env fact (PI_LENS_CONFIG_PATH,
    // then a legacy default, then PI_CODING_AGENT_DIR, then the
    // PI_LENS_HOME-relocated canonical default), not a property of the
    // `$HOME` this call's project walk is ceiling-bounded by. `homeDir`
    // stays threaded below for the walk and `globalDir`; a test redirecting
    // the global tier does it through the env, the same way production is
    // controlled.
    globalConfigPath: getPiLensGlobalConfigPath(),
    homeDir,
    // The subsystem comes from the failing DOCUMENT, not from this loader
    // (#2445). This resolution opens `~/.pi-lens/config.json` and
    // `.pi-lens.json` as well as the LSP-scoped files, and reporting all of
    // them as `lsp-config` announced an "invalid LSP config" for a file whose
    // contents are pi-lens settings. An LSP-scoped file still reports here.
    ...reporting ? { onReadError: reportConfigReadFailure } : {}
  });
  const coversProblems = newCoversClaimProblems();
  const config = lspConfigOf(resolution.value, coversProblems);
  Object.defineProperty(config, "__provenance", {
    value: resolution.provenance,
    enumerable: false
  });
  if (reporting) {
    reportPiLensConfigRecords([
      ...resolution.records,
      ...coversClaimRecords(resolution, coversProblems)
    ]);
  }
  recordCoversUnvalidated(resolution, coversProblems);
  recordConfigResolved(cwd, resolution, config, homeDir, Date.now() - resolveStartedAt);
  return config;
}
function newCoversClaimProblems() {
  return { refusals: [], unvalidated: [] };
}
function coversPointer(serverId) {
  return `/${LSP_NAMESPACE_KEY}/servers/${serverId}/covers`;
}
function coversClaimSource(resolution, pointer) {
  let candidate = pointer;
  while (candidate !== void 0) {
    const entry = resolution.provenance.get(candidate);
    if (entry) {
      return {
        file: entry.file ?? "",
        ...entry.tier ? { tier: entry.tier } : {}
      };
    }
    const cut = candidate.lastIndexOf("/");
    candidate = cut > 0 ? candidate.slice(0, cut) : void 0;
  }
  return { file: resolution.documents.at(-1)?.file ?? "" };
}
function coversClaimRecords(resolution, problems) {
  return problems.refusals.map((refusal) => {
    const pointer = coversPointer(refusal.serverId);
    const { file, tier } = coversClaimSource(resolution, pointer);
    const dropped = refusal.declaredCount - refusal.keptCount;
    return {
      code: "PILENS_CFG_0005",
      file,
      key: pointer,
      subject: migrationSubject(file, pointer),
      reason: `lsp.servers.${refusal.serverId}.covers declares member(s) that are not recognized dispatch runner ids; ${dropped} of ${refusal.declaredCount} member(s) dropped, the server still ` + keptTail(refusal.keptCount),
      ...tier ? { tier } : {}
    };
  });
}
function keptTail(keptCount) {
  return keptCount > 0 ? "registers with the remaining covers claim" : "registers with no covers claim";
}
function recordCoversUnvalidated(resolution, problems) {
  for (const unvalidated of problems.unvalidated) {
    const pointer = coversPointer(unvalidated.serverId);
    const { file } = coversClaimSource(resolution, pointer);
    recordDegradationOnce({
      kind: "lsp-covers-unvalidated",
      subject: `${file}\0${pointer}`,
      reason: "no runner registry has populated this process yet; the covers claim was accepted without runner-id validation and the next config load validates it",
      metadata: { pointer }
    });
  }
}
function coversValidatedServers(servers, problems = void 0) {
  const out = {};
  for (const [id, raw] of Object.entries(servers)) {
    const entry = raw;
    if (!entry.covers?.length) {
      out[id] = entry;
      continue;
    }
    if (!runnerIdentityPopulated()) {
      problems?.unvalidated.push({ serverId: id });
      out[id] = entry;
      continue;
    }
    const kept = [];
    for (const member of entry.covers) {
      if (isKnownRunnerId(member))
        kept.push(member);
    }
    if (kept.length === entry.covers.length) {
      out[id] = entry;
      continue;
    }
    problems?.refusals.push({
      serverId: id,
      declaredCount: entry.covers.length,
      keptCount: kept.length
    });
    const { covers: _dropped, ...rest } = entry;
    out[id] = kept.length > 0 ? { ...rest, covers: kept } : rest;
  }
  return out;
}
function customServerSpecsOf(value) {
  const servers = asRecord(lspSectionOf(value).servers);
  return servers ? coversValidatedServers(servers) : {};
}
function lspConfigOf(value, problems, provenance) {
  const section = lspSectionOf(value);
  const config = {};
  const servers = asRecord(section.servers);
  if (servers)
    config.servers = coversValidatedServers(servers, problems);
  const serverOverrides = asRecord(section.serverOverrides);
  if (serverOverrides) {
    config.serverOverrides = serverOverrides;
  }
  if (Array.isArray(section.disabledServers)) {
    config.disabledServers = section.disabledServers;
  }
  if (Array.isArray(section.warmFiles)) {
    config.warmFiles = section.warmFiles;
  }
  if (provenance) {
    Object.defineProperty(config, "__provenance", {
      value: provenance,
      enumerable: false
    });
  }
  return config;
}
function createCustomServer(config, id) {
  return {
    id,
    name: config.name,
    custom: true,
    // The own-command token the runner-coverage seam gates this row's
    // covers claim on (#3968 F2): the declared covering lane's binary must
    // be probeable before the claim can defer a CLI runner.
    command: config.command,
    extensions: config.extensions,
    // A config-declared server is a language server. The public
    // `lsp.servers.<id>.role` field is validated and projected by
    // `ResolvedLspConfig` (clients/lsp/resolved-config.ts) but stays
    // RESERVED and inert here: honouring it would change which servers a
    // file selects as primary, and that is the catalog slice's call, not
    // this loader's (#2416 slice 1). The stated default is applied rather
    // than left absent (#1488).
    role: DEFAULT_LSP_SERVER_ROLE,
    idleEviction: "unmeasured",
    // The config-declared covers channel (#3968): the claim the loader
    // validated (`lspConfigOf`'s projection drops unknown runner ids) rides
    // the server entry into the runner-coverage seam.
    ...config.covers ? { covers: config.covers } : {},
    ...config.rootMarkers ? { rootMarkers: config.rootMarkers } : {},
    root: config.rootMarkers ? async (file) => resolveToolCwd("lsp", id, file, {
      cwd: process.cwd(),
      ...config.rootMarkers ? { rootMarkers: config.rootMarkers } : {}
    }).cwd : async (file) => resolveToolCwd("lsp", id, file, { cwd: process.cwd() }).cwd,
    async spawn(root) {
      const proc = await launchLSP(config.command, config.args ?? ["--stdio"], {
        cwd: root,
        env: config.env ? { ...process.env, ...config.env } : process.env
      });
      return {
        process: proc,
        ...config.initializationOptions ? { initialization: config.initializationOptions } : {}
      };
    }
  };
}
var EMPTY_CONFIG = {
  customServers: [],
  // Avoid reading LSP_SERVERS during the config/server module cycle. The
  // selection helper falls back to the live builtin table after evaluation.
  registeredServers: [],
  disabledServerIds: /* @__PURE__ */ new Set(),
  serverOverrides: /* @__PURE__ */ new Map()
};
var configInFlight = /* @__PURE__ */ new Map();
function normalizeWorkspacePath(cwd) {
  return path3.resolve(cwd);
}
var unknownTrustNoticeGeneration = -1;
function sourceFor(provenance, key) {
  const direct = provenanceFor({ value: void 0, provenance }, key);
  if (direct)
    return direct;
  let fallback;
  for (const [candidate, entry] of provenance) {
    if (!candidate.startsWith(`${key}/`))
      continue;
    if (isRepoTier(entry.tier))
      return entry;
    fallback ??= entry;
  }
  return fallback;
}
function executableAllowed(provenance, trust) {
  return !provenance || !isRepoTier(provenance.tier) || trust === "trusted";
}
function registryDecision(id, field, provenance, trust, allowed) {
  if (allowed || !provenance || !isRepoTier(provenance.tier))
    return;
  const subject = `${id}:${field}:${provenance.tier}`;
  const reason = `project LSP ${field} refused for ${id}: pi project trust is ${trust}`;
  recordDegradationOnce({
    kind: "lsp-registry-decision",
    subject,
    reason,
    metadata: { serverId: id, field, tier: provenance.tier, trust }
  });
  if (trust === "unknown") {
    const generation = getDegradationLedgerGeneration();
    if (unknownTrustNoticeGeneration !== generation) {
      unknownTrustNoticeGeneration = generation;
      logExtension({
        subsystem: "lsp-registry",
        level: "warn",
        message: "project LSP executables refused: mark the project trusted in pi or upgrade pi",
        metadata: { serverId: id, field }
      });
    }
  }
}
function isSameOrChildPath(filePath, candidateRoot) {
  if (filePath === candidateRoot)
    return true;
  return filePath.startsWith(`${candidateRoot}${path3.sep}`);
}
function getConfigForFile(filePath) {
  const resolvedFilePath = path3.resolve(filePath);
  let bestMatch;
  for (const [root, config] of sessionRootConfigEntries()) {
    if (config === void 0)
      continue;
    if (!isSameOrChildPath(resolvedFilePath, root))
      continue;
    if (!bestMatch || root.length > bestMatch.root.length) {
      bestMatch = { root, config };
    }
  }
  return bestMatch?.config ?? EMPTY_CONFIG;
}
function registerLSPConfig(config) {
  return compileLspRegistry(config, config.__provenance);
}
function compileLspRegistry(config, provenance = /* @__PURE__ */ new Map()) {
  const trust = getProjectTrustState();
  const customServers = [];
  const disabledServerIds = new Set(config.disabledServers ?? []);
  if (config.servers) {
    for (const [id, serverConfig] of Object.entries(config.servers)) {
      const commandSource = sourceFor(provenance, `/lsp/servers/${id}/command`);
      const commandAllowed = executableAllowed(commandSource, trust);
      registryDecision(id, "command", commandSource, trust, commandAllowed);
      if (!commandAllowed)
        continue;
      const envSource = sourceFor(provenance, `/lsp/servers/${id}/env`);
      const initSource = sourceFor(provenance, `/lsp/servers/${id}/initializationOptions`);
      const envAllowed = executableAllowed(envSource, trust);
      const initAllowed = executableAllowed(initSource, trust);
      registryDecision(id, "env", envSource, trust, envAllowed);
      registryDecision(id, "initializationOptions", initSource, trust, initAllowed);
      const admitted = { ...serverConfig };
      if (!envAllowed)
        delete admitted.env;
      if (!initAllowed)
        delete admitted.initializationOptions;
      try {
        const server = createCustomServer(admitted, id);
        customServers.push({ ...server, trustAllowed: true });
      } catch {
      }
    }
  }
  const serverOverrides = /* @__PURE__ */ new Map();
  if (config.serverOverrides) {
    for (const [id, entry] of Object.entries(config.serverOverrides)) {
      if (entry && typeof entry === "object" && !Array.isArray(entry)) {
        const initOpts = entry.initializationOptions;
        const command = entry.command;
        const commandSource = sourceFor(provenance, `/lsp/serverOverrides/${id}/command`);
        const envSource = sourceFor(provenance, `/lsp/serverOverrides/${id}/env`);
        const initSource = sourceFor(provenance, `/lsp/serverOverrides/${id}/initializationOptions`);
        const commandAllowed = executableAllowed(commandSource, trust);
        const envAllowed = executableAllowed(envSource, trust);
        const overrideInitAllowed = executableAllowed(initSource, trust);
        registryDecision(id, "command override", commandSource, trust, commandAllowed);
        registryDecision(id, "env override", envSource, trust, envAllowed);
        registryDecision(id, "initializationOptions", initSource, trust, overrideInitAllowed);
        if (command !== void 0 || entry.env !== void 0 || initOpts !== void 0 && typeof initOpts === "object" && initOpts !== null && !Array.isArray(initOpts)) {
          serverOverrides.set(id, {
            ...overrideInitAllowed && initOpts !== void 0 ? { initializationOptions: initOpts } : {},
            ...commandAllowed && command !== void 0 ? { command } : {},
            ...envAllowed && entry.env ? { env: entry.env } : {}
          });
        }
      }
    }
  }
  const overriddenBuiltins = LSP_SERVERS.map((server) => {
    const override = serverOverrides.get(server.id);
    if (!override?.command)
      return { ...server };
    const argv = Array.isArray(override.command) ? override.command : [override.command, "--stdio"];
    return {
      ...server,
      trustAllowed: true,
      async spawn(root, options) {
        void options;
        const program = argv[0];
        if (!program)
          throw new Error(`empty command override for ${server.id}`);
        const proc = await launchLSP(program, argv.slice(1), {
          cwd: root,
          env: override.env ? { ...process.env, ...override.env } : process.env
        });
        return { process: proc };
      }
    };
  });
  return {
    customServers,
    registeredServers: overriddenBuiltins,
    disabledServerIds,
    serverOverrides
  };
}
function forgetConfigResolvedClaims(evictedRoots) {
  for (const root of evictedRoots) {
    releasePhaseClaim(CONFIG_RESOLVED_PHASE, configResolutionKey(root));
  }
}
async function initLSPConfig(cwd) {
  const normalizedCwd = normalizeWorkspacePath(cwd);
  forgetConfigResolvedClaims(registerSessionRoot(normalizedCwd));
  const existing = configInFlight.get(normalizedCwd);
  if (existing)
    return existing;
  const promise = (async () => {
    const config = registerLSPConfig(await loadLSPConfig(cwd, os4.homedir()));
    forgetConfigResolvedClaims(setSessionRootConfig(normalizedCwd, config));
  })();
  configInFlight.set(normalizedCwd, promise);
  try {
    await promise;
  } finally {
    if (configInFlight.get(normalizedCwd) === promise) {
      configInFlight.delete(normalizedCwd);
    }
  }
}
function registeredServers(config) {
  const builtins = config.registeredServers.length ? config.registeredServers : LSP_SERVERS;
  return [...builtins, ...config.customServers];
}
function selectionReason(server, config, filePath, ext, base) {
  if (config.disabledServerIds.has(server.id))
    return "disabled-by-config";
  let matched = false;
  for (const value of server.extensions) {
    const lower = value.toLowerCase();
    if (lower === ext || lower === base) {
      matched = true;
      break;
    }
  }
  if (!matched)
    return "extension-mismatch";
  if (server.pathFilter && !server.pathFilter(filePath))
    return "path-filter";
  return "selected";
}
function explainServersForFile(filePath, config = getConfigForFile(filePath)) {
  const ext = path3.extname(filePath).toLowerCase();
  const base = path3.basename(filePath).toLowerCase();
  return registeredServers(config).map((server) => {
    const reason = selectionReason(server, config, filePath, ext, base);
    return { server, selected: reason === "selected", reason };
  });
}
function getServersForFileWithConfig(filePath) {
  const config = getConfigForFile(filePath);
  const ext = path3.extname(filePath).toLowerCase();
  const base = path3.basename(filePath).toLowerCase();
  return registeredServers(config).filter((server) => selectionReason(server, config, filePath, ext, base) === "selected");
}
function primaryServerEntry(filePath) {
  return getServersForFileWithConfig(filePath).find((s) => !isAuxiliary(s));
}
function primaryServerId(filePath) {
  return primaryServerEntry(filePath)?.id;
}
async function resolveLspCwdForFile(filePath, sessionCwd, onRootFallback) {
  const primary = primaryServerEntry(filePath);
  if (!primary)
    return void 0;
  return resolveLspServerCwd(primary, filePath, sessionCwd, void 0, onRootFallback);
}
function getServerInitOverride(serverId, filePath) {
  return getConfigForFile(filePath).serverOverrides.get(serverId);
}

// dist/clients/lsp/wait-policy/strategies.js
import { createRequire } from "node:module";
var _require = createRequire(import.meta.url);
function astGrepNativePackageName(platform, arch) {
  switch (platform) {
    case "win32":
      if (arch === "x64")
        return "@ast-grep/cli-win32-x64-msvc";
      if (arch === "arm64")
        return "@ast-grep/cli-win32-arm64-msvc";
      if (arch === "ia32")
        return "@ast-grep/cli-win32-ia32-msvc";
      return void 0;
    case "darwin":
      if (arch === "arm64")
        return "@ast-grep/cli-darwin-arm64";
      if (arch === "x64")
        return "@ast-grep/cli-darwin-x64";
      return void 0;
    case "linux":
      if (arch === "x64")
        return "@ast-grep/cli-linux-x64-gnu";
      if (arch === "arm64")
        return "@ast-grep/cli-linux-arm64-gnu";
      return void 0;
    default:
      return void 0;
  }
}
function resolveAstGrepNativeExe(platform = process.platform, arch = process.arch) {
  const pkgName = astGrepNativePackageName(platform, arch);
  if (!pkgName)
    return void 0;
  const binaryName = platform === "win32" ? "ast-grep.exe" : "ast-grep";
  try {
    return _require.resolve(`${pkgName}/${binaryName}`);
  } catch {
    return void 0;
  }
}
var SERVER_DIAGNOSTIC_STRATEGIES = {
  typescript: {
    seedFirstPush: false,
    pullRetryBudgetMs: 0,
    debounceMs: 50,
    aggregateWaitMs: 1e3,
    expectSemanticSecondPush: false,
    // #3310 / nightly run 37930006227: the clean TypeScript fixture
    // published an empty pre-index result before its settled result.
    // Hold that first publish so it cannot resolve a push wait as clean.
    emptyFirstPublish: "indexing",
    // Tier 3 (#458): typescript-language-server publishes nothing on a
    // clean→clean edit (docs/lsp-capability-matrix.md, re-confirmed
    // 2026-07-12). It's the lone core-set tier-3 server, which is exactly
    // why the cascade lane's in-lane wait is worth skipping for it
    // specifically. Applies to the CLASSIC server only (#524/#529/#558)
    // — TS7's native `tsc --lsp --stdio` variant shares this
    // "typescript" server id but the 2026-07-12 dual-environment
    // re-measurement found it now publishes on clean (a drift from the
    // #541 measurement); wait-policy/classification.ts's classifier checks the live
    // snapshot's launchVariant and never applies this flag to a
    // native-ts7 instance.
    silentOnClean: true
  },
  "rust-analyzer": {
    seedFirstPush: false,
    pullRetryBudgetMs: 500,
    debounceMs: 150,
    aggregateWaitMs: 3e3,
    expectSemanticSecondPush: true
  },
  // PythonServer (pyright / basedpyright) — openFilesOnly mode: lazy per-file
  // analysis, startup similar to jedi. seedFirstPush: true because pyright's
  // first publishDiagnostics after didOpen is the complete result for that file.
  python: {
    seedFirstPush: true,
    pullRetryBudgetMs: 0,
    debounceMs: 100,
    aggregateWaitMs: 1500,
    expectSemanticSecondPush: false
  },
  // jedi-language-server is push-only (no pull diagnostics) and its FIRST
  // publishDiagnostics is the complete result (seedFirstPush). But that first
  // push lands just after didOpen+~1s on cold start (Python/parso import) —
  // measured ~1011ms — so a 1000ms aggregate budget misses it by a hair and
  // returns zero. 3000ms gives cold-start headroom without stalling the warm path.
  "python-jedi": {
    seedFirstPush: true,
    pullRetryBudgetMs: 0,
    debounceMs: 100,
    aggregateWaitMs: 3e3,
    expectSemanticSecondPush: false
  },
  eslint: {
    seedFirstPush: true,
    pullRetryBudgetMs: 0,
    debounceMs: 200,
    aggregateWaitMs: 2e3,
    expectSemanticSecondPush: false
  },
  // Opengrep security scanner (cross-language LSP). It pushes an EMPTY result
  // during the one-time rule-load window at startup, then the real scan after
  // `semgrep/rulesRefreshed` — so never seed the first push. Push-only (no pull
  // diagnostics). Warm per-file scan ~1.3s; the first touch in a session may
  // also pay rule-load (~3.5s cold). aggregateWaitMs is 3500: it's this
  // server's OWN deadline, bounded by the per-edit caller cap as a ceiling
  // (#242), so on a 2500ms-capped edit opengrep waits min(2500, 3500)=2500
  // and on uncapped paths it gets its full 3500. 3500 covers warm and most
  // cold; a cold scan that overruns isn't lost — late diagnostics are cached
  // and surface on the next unchanged-content read through the content-bound
  // auxiliary carry-over path.
  opengrep: {
    seedFirstPush: false,
    pullRetryBudgetMs: 0,
    debounceMs: 250,
    aggregateWaitMs: 3500,
    expectSemanticSecondPush: false,
    // Opengrep re-scans only on a fresh didOpen — didChange is a no-op for it.
    reopenOnResync: true,
    rescansOnSave: true
  },
  // ast-grep structural linter (sgconfig-gated auxiliary LSP). Push-only,
  // compiles the project rules on the first scan of a session, and — like
  // Opengrep — is re-synced via didClose+didOpen so edits trigger a re-scan.
  // Conservative budget until measured against real projects (#239).
  // ast-grep re-scans on didChange (verified: toggling the violation count
  // 3→1→4→2 returns the correct fresh count each touch, with matching doc
  // versions), so reopen isn't needed and didChange is the lighter path.
  // aggregateWaitMs is 1800: its warm scan is ~1.3s, so 1000 was under-budgeted
  // (only masked before because the old with-auxiliary deadline was a global
  // max() floor; now each server has its own caller-cap-bounded deadline, #242,
  // so the budget must actually cover the scan).
  "ast-grep": {
    seedFirstPush: false,
    pullRetryBudgetMs: 0,
    debounceMs: 150,
    aggregateWaitMs: 1800,
    expectSemanticSecondPush: false,
    reopenOnResync: false
  },
  // zizmor (GitHub Actions security scanner, auxiliary LSP #272). Push-only
  // (no pull diagnostics). Its audit set is compiled-in — there's no rule-load
  // window like Opengrep — so the FIRST publishDiagnostics after didOpen IS the
  // complete result: seedFirstPush. It re-scans on didChange (FULL sync), so no
  // reopen-on-resync. A native single-workflow audit is sub-second offline;
  // online mode may add a GitHub-API round-trip, so 2000ms gives headroom
  // (bounded by the per-edit caller cap as a ceiling, #242), and any late online
  // finding can surface on the next unchanged-content read through the
  // content-bound auxiliary carry-over path.
  zizmor: {
    seedFirstPush: true,
    pullRetryBudgetMs: 0,
    debounceMs: 150,
    aggregateWaitMs: 2e3,
    expectSemanticSecondPush: false,
    reopenOnResync: false,
    // #3548: zizmor@main `crates/zizmor/src/lsp.rs` `initialized()`
    // registers `textDocument/didSave` DYNAMICALLY (`include_text: true`),
    // and `did_save` re-audits and republishes with `version: None` — the
    // same surplus shape as opengrep's static save rescan (#3482). This is
    // presently INERT: `applyDynamicCapabilities` (client.ts) does not map
    // a dynamic didSave registration to anything, and `negotiateSaveOptions`
    // (sync-kind.ts) reads only the static `initialize` reply, so
    // `state.saveOptions` never gets set for zizmor and `sendDidSave` never
    // fires (its `if (!save) return;` guard). Set now anyway, measured
    // fact style (like `silentOnClean`'s launch-variant scoping above): the
    // day dynamic registration is honoured, this is the correct value with
    // no further plumbing, and `expectSaveRescan`/`rescansOnSave`'s
    // counting logic does not care how `saveOptions` got set — proven by
    // `ZIZMOR-SAVE-RESCAN-EXPECTED` in
    // tests/clients/lsp/late-auxiliary-findings.test.ts, which sets
    // `state.saveOptions` directly (the same shape as the pre-existing
    // `SAVE-RESCAN-EXPECTED` opengrep test) rather than through the
    // unbuilt dynamic-capability path.
    rescansOnSave: true
  },
  // typos (source-code spell checker, auxiliary LSP #283). Push-only (no pull
  // diagnostics). Its dictionary is compiled in — there's NO rule-load window
  // like Opengrep — so the FIRST publishDiagnostics after didOpen IS the
  // complete result: seedFirstPush. It re-scans on didChange (FULL sync), so no
  // reopen-on-resync. A native single-file spell scan is sub-100ms, so the seed
  // arrives near-instantly; aggregateWaitMs is a generous ceiling (bounded by
  // the per-edit caller cap, #242) that the early seed resolves well under.
  typos: {
    seedFirstPush: true,
    pullRetryBudgetMs: 0,
    debounceMs: 150,
    aggregateWaitMs: 1500,
    expectSemanticSecondPush: false,
    reopenOnResync: false,
    // #3548: see `publishesOnClose`'s doc comment above — typos'
    // `did_close` always publishes an empty, version-less set.
    publishesOnClose: true
  },
  // marksman (Markdown LSP, #274). Push-based; native binary so the per-file
  // parse is fast, but its value is CROSS-file (broken intra-repo links,
  // missing anchors/heading refs) which needs the workspace index — so the
  // first push after didOpen can be empty before indexing completes. Don't
  // seed it (like opengrep/rust-analyzer); a modest 1500ms aggregate covers
  // warm edits, and any late cross-file finding surfaces on the next touch.
  marksman: {
    seedFirstPush: false,
    pullRetryBudgetMs: 0,
    debounceMs: 150,
    aggregateWaitMs: 1500,
    expectSemanticSecondPush: false,
    // #645: a full-tree sweep opens every markdown file, all racing the
    // SAME one-time workspace index build — pay the 1500ms budget once
    // per sweep (the first markdown file touched), not once per file.
    // 250ms covers a warm per-file publish (native binary, fast parse)
    // once the index has already had a full aggregateWaitMs window.
    workspaceIndexing: true,
    workspaceIndexingWarmWaitMs: 250,
    // #799 / run 35914033696: marksman is push-only and publishes NOTHING on
    // a clean transition — there is no pull fallback and no sync-confirm protocol (unlike
    // typescript's tsserver commands), so a clean markdown file's touch
    // waits its full budget with zero signal either way. Marking it
    // `silentOnClean` lets the generic push-only clean-confirm gate
    // (`touchFile`, the `classifyCascadeWaitTier`-driven fallback next to
    // the tsserver sync-confirm block) treat "no publish within budget,
    // notify succeeded" as CONFIRMED clean instead of inconclusive/timed
    // out — closing the observed 2x20s-per-sweep burn on clean markdown
    // (evidence: agents.md timed out at 20009ms/20014ms on both the
    // warm-up attempt and its retry, with zero diagnostics either time).
    silentOnClean: true
  },
  // cue lsp serve (#1522, #1519, #1520). Measured directly against the real
  // v0.17.1 binary (`getWorkspaceDiagnosticsSupport` reports
  // `mode: "push-only"`; no pull support advertised).
  //
  // It reports load/parse (syntax) errors as you type, but leaves
  // conflicting-value/constraint-failure (evaluation) errors to `cue vet`
  // — the #1522 cue-vet auxiliary runner covers that gap. So the syntax
  // diagnostics this strategy governs are a REAL but PARTIAL signal, not
  // full CUE validation.
  //
  // The repaired clean-signal probe measured cue as publishing a versioned
  // clean-transition set (run 35914033696), so this marker stays absent:
  // the cascade must retain its normal early-publish path.
  //
  // seedFirstPush: true — the one cold-open case that DOES publish (a
  // file that is already broken) sends the complete single diagnostic on
  // its first push; there is no observed partial-then-complete sequence to
  // wait out.
  //
  // aggregateWaitMs: 2000 covers the measured warm edit-to-publish latency
  // (~930ms, syntax reparse) with margin; a cold spawn's first push (~2.1s
  // end-to-end including process start) is bounded separately by
  // maxClientWaitMs, not this per-diagnostics budget.
  // intelephense (php, #3310). Measured directly against the real v1.18.5
  // binary over a raw JSON-RPC session answering `workspace/configuration`
  // the way pi-lens does (2026-09-23, linux):
  //
  //   +284ms  initialize response — NO diagnosticProvider (push-only)
  //   +295ms  publishDiagnostics diags=0  version=undefined   <- pre-index
  //   +301ms  indexingStarted
  //   +689ms  indexingEnded
  //   +696ms  publishDiagnostics diags=2  version=undefined   <- the answer
  //
  // so `emptyFirstPublish: "indexing"`: the first publish is an artifact of
  // the cold index, not an answer. The same session on a genuinely CLEAN
  // file publishes `[]` at +304ms and `[]` AGAIN at +663ms (right after
  // `indexingEnded`), which is what lets the held publish be released by
  // the server's own second publish instead of by a timer — and a WARM
  // touch (a second file, index already built) publishes the real set
  // FIRST at +5ms, so the hold costs nothing once the session is warm.
  //
  // seedFirstPush: false — the measurement above is the direct refutation
  // of "the first push is complete" for this server.
  // pullRetryBudgetMs: 0 — no pull provider is advertised at all.
  // aggregateWaitMs: 8000 — the budget must cover the cold index window,
  // which is what the second (real) publish waits on: ~0.4s for a 139-file
  // index on the dev box, ~5s on the nightly ubuntu runner (#3217's
  // transcript). Per-edit callers cap this as a CEILING (#242), so an
  // interactive edit still waits only its own cap; the uncapped paths (the
  // tool-smoke LSP gate, which itself caps at 8000ms) get the full budget,
  // and the cold index is paid once per session, not once per touch.
  php: {
    seedFirstPush: false,
    pullRetryBudgetMs: 0,
    debounceMs: 150,
    aggregateWaitMs: 8e3,
    expectSemanticSecondPush: false,
    emptyFirstPublish: "indexing",
    // #3484: the fence reply (+2..4 ms) precedes the publish (~+1 s).
    diagnosticsFence: "reply-first"
  },
  // terraform-ls (#3310). The nightly tool-smoke measurement was identical
  // on 2026-09-27, 2026-09-28, and 2026-09-29:
  //
  //   [terraform] clean-behavior=publishes-unversioned (tier 2*)
  //   dirtyPubs=2(v:0) cleanPubs=2(v:0) first-publish=empty-first
  //   provisional pre-index publish
  //
  // The first empty, unversioned publish is the cold-index artifact, so hold
  // it once and let terraform-ls's next publish resolve the wait. A held
  // clean-only trace therefore reaches the caller as unanswered/indeterminate
  // at the wait ceiling rather than a false clean, by design (#3310). The
  // marker is measured policy, not a blanket rule for Tier 2* push servers.
  terraform: {
    seedFirstPush: false,
    pullRetryBudgetMs: 0,
    debounceMs: 150,
    aggregateWaitMs: 1500,
    expectSemanticSecondPush: false,
    emptyFirstPublish: "indexing"
  },
  // yaml-language-server (#3484): the default strategy plus the measured
  // fence order — reply +3..6 ms, publish +207..242 ms after didChange.
  yaml: {
    seedFirstPush: false,
    pullRetryBudgetMs: 250,
    debounceMs: 150,
    aggregateWaitMs: 1500,
    expectSemanticSecondPush: false,
    diagnosticsFence: "reply-first"
  },
  // Svelte's pull diagnostics settle after the default 1500ms budget on a
  // cold server. The tool-smoke gate caps waits at 8000ms, so give this
  // server enough aggregate budget to return its seeded findings (#3311).
  svelte: {
    seedFirstPush: false,
    pullRetryBudgetMs: 0,
    debounceMs: 150,
    aggregateWaitMs: 4e3,
    expectSemanticSecondPush: false
  },
  // csharp-ls loads (design-time-builds) the restored project AFTER
  // `initialize` returns, so the publish for a seeded CS0029 lands inside
  // `waitForDiagnostics`, not inside the client wait. MEASURED A/B over two
  // nightly Tool-smoke runs of the same fixture with `dotnet restore` already
  // done — the ONLY difference between them was this budget:
  //   * `aggregateWaitMs` 1500 (the default): run 36054901266 →
  //     `[csharp] touched=0`, 4.05s after `Restored …/toolsmoke.csproj`.
  //     A real compiler error read as clean.
  //   * 8000: run 36058292424 → `[csharp] touched=1`, 6.49s after the same
  //     line; gate run 36059988117 → `lsp_diagnostics returned 1 primary
  //     finding`, 4.86s after it.
  // Both windows INCLUDE workspace bootstrap + spawn + initialize, so they
  // bound the wait from above: the required budget is in (1500, 4860] ms.
  // 6000 covers the measured gate window with margin and stays under the
  // tool-smoke gate's own 8000ms ceiling (that relation is pinned by
  // tests/config/lsp-gate-population.test.ts), so the gate can still witness
  // this budget. CONFIRMED at 6000 by run 36064829436: `✓ csharp csharp-ls 1
  // lsp_diagnostics returned 1 primary finding`, 4.78s after `Restored
  // …csproj`, census unchanged at gated 31 / handshake-only 8 / unavailable 6
  // — so 6000 is measured as sufficient, not merely inferred from the 8000
  // runs above. It is deliberately NOT the ceiling: an `lsp_diagnostics` call
  // that passes no `waitMs` pays this budget in full on a file the server never
  // publishes for (`tools/lsp-diagnostics.ts` leaves `maxClientWaitMs`
  // undefined → `perServerTimeout` has no caller cap), so every 1000ms here
  // is 1000ms of turn latency on the no-publication path (#3402 review r2).
  // Every other field is DEFAULT_STRATEGY's value on purpose: csharp-ls is
  // `mode=pull`/tier-1 authoritative-clean (#3311 investigator table), and
  // nothing has measured its pull retry, so this entry moves the one field
  // that was measured and no other (pinned in
  // tests/clients/lsp/server-strategies.test.ts).
  // fsharp/expert/vue deliberately have NO entry: the same two runs show
  // `touched=0` at BOTH 1500 and 8000, so the budget is not what stops them
  // publishing and an 8000 entry would buy nothing while costing every
  // uncapped production call 6.5 extra seconds. Their fixture rows carry the
  // observed-behavior exemption instead (`scripts/smoke-tools.mjs`), and a
  // probe that wants a long window sets `PI_LENS_LSP_DIAGNOSTICS_MAX_WAIT_MS`
  // — a flat harness override that needs no production budget.
  csharp: {
    seedFirstPush: false,
    pullRetryBudgetMs: 250,
    debounceMs: 150,
    aggregateWaitMs: 6e3,
    expectSemanticSecondPush: false
  },
  cue: {
    seedFirstPush: true,
    pullRetryBudgetMs: 0,
    debounceMs: 150,
    aggregateWaitMs: 2e3,
    expectSemanticSecondPush: false,
    reopenOnResync: false
  },
  // lua-language-server is push-only and was silent on clean transitions in
  // the repaired probe (run 35914033696). Keep the marker on the measured
  // server id so the cascade can skip its in-lane wait safely.
  lua: {
    seedFirstPush: true,
    pullRetryBudgetMs: 0,
    debounceMs: 150,
    aggregateWaitMs: 2e3,
    expectSemanticSecondPush: false,
    silentOnClean: true
  }
};
var NATIVE_TS7_DIAGNOSTIC_STRATEGY = {
  ...SERVER_DIAGNOSTIC_STRATEGIES.typescript,
  seedFirstPush: false,
  // Native TS7 demonstrably publishes on clean, so the classic-only marker
  // must not leak through the shared server id.
  silentOnClean: false
};
var DEFAULT_STRATEGY = {
  seedFirstPush: false,
  pullRetryBudgetMs: 250,
  debounceMs: 150,
  aggregateWaitMs: 1500,
  expectSemanticSecondPush: false
};
function getStrategy(serverId, launchVariant) {
  if (serverId === "typescript" && launchVariant === "native-ts7") {
    return NATIVE_TS7_DIAGNOSTIC_STRATEGY;
  }
  return SERVER_DIAGNOSTIC_STRATEGIES[serverId] ?? DEFAULT_STRATEGY;
}

// dist/clients/lsp/wait-policy/classification.js
function classifyServerWaitTier(serverId, snapshot) {
  if (!snapshot)
    return "waits";
  const mode = snapshot.workspaceDiagnosticsSupport?.mode;
  if (mode === "pull")
    return "pull-capable";
  if (snapshot.customServer === true && mode === "push-only" && snapshot.diagnosticsUnsupported === true && snapshot.diagnosticsPublished !== true) {
    return "diagnostics-unsupported";
  }
  if (mode !== "push-only")
    return "waits";
  const strategy = getStrategy(serverId, snapshot.launchVariant);
  if (strategy.silentOnClean !== true)
    return "waits";
  if (snapshot.launchVariant === "native-ts7")
    return "waits";
  return "tier3-silent";
}
function resolvePrimaryServerForWaitPolicy(filePath, snapshots) {
  const servers = getServersForFileWithConfig(filePath).filter((s) => !isAuxiliary(s));
  const primary = servers[0];
  if (!primary)
    return void 0;
  return {
    serverId: primary.id,
    snapshot: snapshots.find((s) => s.serverId === primary.id)
  };
}
function classifyCascadeWaitTier(lspService, filePath, snapshots) {
  void lspService;
  const primary = resolvePrimaryServerForWaitPolicy(filePath, snapshots);
  if (!primary)
    return "waits";
  return classifyServerWaitTier(primary.serverId, primary.snapshot);
}

// dist/clients/lsp/lombok.js
import * as fs5 from "node:fs";
import * as os5 from "node:os";
import * as path4 from "node:path";
var LOMBOK_ENV_KEYS = ["PI_LENS_LOMBOK_JAR", "LOMBOK_JAR"];
var LOMBOK_PROJECT_FILES = [
  "lombok.config",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  path4.join("gradle", "libs.versions.toml")
];
function fileExists(filePath) {
  if (!filePath)
    return false;
  try {
    return fs5.statSync(filePath).isFile();
  } catch {
    return false;
  }
}
function readTextIfSmall(filePath, maxBytes = 512 * 1024) {
  try {
    const stat2 = fs5.statSync(filePath);
    if (!stat2.isFile() || stat2.size > maxBytes)
      return "";
    return fs5.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}
function containsLombokDependency(text) {
  return /\borg\.projectlombok\b/i.test(text) || /<artifactId>\s*lombok\s*<\/artifactId>/i.test(text) || /\b(annotationProcessor|compileOnly|testCompileOnly|testAnnotationProcessor)\b[^\n]*\blombok\b/i.test(text);
}
function hasLombokProject(root) {
  const lombokConfig = path4.join(root, "lombok.config");
  if (fileExists(lombokConfig))
    return true;
  for (const name of LOMBOK_PROJECT_FILES) {
    if (name === "lombok.config")
      continue;
    const text = readTextIfSmall(path4.join(root, name));
    if (text && containsLombokDependency(text))
      return true;
  }
  return false;
}
function envJarCandidate(env) {
  for (const key of LOMBOK_ENV_KEYS) {
    const value = env[key]?.trim();
    if (fileExists(value))
      return path4.resolve(value);
  }
  return void 0;
}
function localJarCandidates(root) {
  return [
    path4.join(root, "lombok.jar"),
    path4.join(root, ".lombok", "lombok.jar"),
    path4.join(root, "lib", "lombok.jar"),
    path4.join(root, "libs", "lombok.jar")
  ];
}
function newestExistingJar(candidates) {
  let best;
  for (const candidate of candidates) {
    try {
      const stat2 = fs5.statSync(candidate);
      if (!stat2.isFile())
        continue;
      if (!best || stat2.mtimeMs > best.mtimeMs) {
        best = { filePath: candidate, mtimeMs: stat2.mtimeMs };
      }
    } catch {
    }
  }
  return best?.filePath;
}
function mavenLocalLombokJar(home = os5.homedir()) {
  const base = path4.join(home, ".m2", "repository", "org", "projectlombok", "lombok");
  let versions = [];
  try {
    versions = fs5.readdirSync(base);
  } catch {
    return void 0;
  }
  return newestExistingJar(versions.map((version) => path4.join(base, version, `lombok-${version}.jar`)));
}
function gradleCacheLombokJar(home = os5.homedir()) {
  const base = path4.join(home, ".gradle", "caches", "modules-2", "files-2.1", "org.projectlombok", "lombok");
  const candidates = [];
  let versions = [];
  try {
    versions = fs5.readdirSync(base);
  } catch {
    return void 0;
  }
  for (const version of versions) {
    const versionDir = path4.join(base, version);
    let hashes = [];
    try {
      hashes = fs5.readdirSync(versionDir);
    } catch {
      continue;
    }
    for (const hash of hashes) {
      candidates.push(path4.join(versionDir, hash, `lombok-${version}.jar`));
    }
  }
  return newestExistingJar(candidates);
}
function resolveLombokJar(root, env = process.env) {
  const explicit = envJarCandidate(env);
  if (explicit)
    return explicit;
  return newestExistingJar(localJarCandidates(root)) ?? mavenLocalLombokJar() ?? gradleCacheLombokJar();
}
function hasLombokJavaAgent(jvmArgs) {
  return /(^|\s)-javaagent:(?:"[^"]*lombok[^"]*\.jar"|\S*lombok\S*\.jar)/i.test(jvmArgs ?? "");
}
function resolveLombokJavaAgentArg(root, baseEnv = process.env) {
  if (baseEnv.PI_LENS_JAVA_LOMBOK === "0")
    return void 0;
  if (hasLombokJavaAgent(baseEnv.JDTLS_JVM_ARGS))
    return void 0;
  const explicitJar = envJarCandidate(baseEnv);
  if (!explicitJar && !hasLombokProject(root))
    return void 0;
  const jar = explicitJar ?? resolveLombokJar(root, baseEnv);
  return jar ? `-javaagent:${jar}` : void 0;
}
function createLombokJdtlsArgs(root, baseEnv = process.env) {
  const javaAgent = resolveLombokJavaAgentArg(root, baseEnv);
  return javaAgent ? [`--jvm-arg=${javaAgent}`] : [];
}

// dist/clients/lsp/jvm-runtime.js
import { existsSync as existsSync2, readdirSync as readdirSync4 } from "node:fs";
import os6 from "node:os";
import path5 from "node:path";
var JAVA_EXE = process.platform === "win32" ? "java.exe" : "java";
var JAVA_PROBE_TIMEOUT_MS = 5e3;
var MIN_JAVA_MAJOR = 17;
function jdkHomeFrom(dir) {
  if (existsSync2(path5.join(dir, "bin", JAVA_EXE)))
    return dir;
  const macHome = path5.join(dir, "Contents", "Home");
  if (existsSync2(path5.join(macHome, "bin", JAVA_EXE)))
    return macHome;
  return void 0;
}
function parseMajorVersion(name) {
  const legacy = name.match(/(?<!\d)1\.(\d+)/);
  if (legacy)
    return Number.parseInt(legacy[1], 10);
  const modern = name.match(/(?<!\d)(\d{1,2})/);
  return modern ? Number.parseInt(modern[1], 10) : 0;
}
function childDirs(base) {
  try {
    return readdirSync4(base, { withFileTypes: true }).filter((e) => e.isDirectory() || e.isSymbolicLink()).map((e) => path5.join(base, e.name));
  } catch {
    return [];
  }
}
function candidateRoots() {
  const home = os6.homedir();
  const roots = [];
  roots.push(path5.join(home, ".jdks"));
  roots.push(path5.join(getGlobalPiLensDir(), "tools"));
  if (process.platform === "win32") {
    const progFiles = [
      process.env.ProgramFiles,
      process.env["ProgramFiles(x86)"],
      process.env.ProgramW6432,
      path5.join(process.env.LOCALAPPDATA ?? path5.join(home, "AppData", "Local"), "Programs")
    ].filter((p) => Boolean(p));
    for (const base of progFiles) {
      roots.push(path5.join(base, "Eclipse Adoptium"));
      roots.push(path5.join(base, "Java"));
      roots.push(path5.join(base, "Microsoft"));
      roots.push(path5.join(base, "Zulu"));
      roots.push(path5.join(base, "Amazon Corretto"));
      roots.push(path5.join(base, "BellSoft"));
    }
  } else if (process.platform === "darwin") {
    roots.push("/Library/Java/JavaVirtualMachines");
    roots.push(path5.join(home, "Library", "Java", "JavaVirtualMachines"));
    roots.push("/opt/homebrew/opt");
    roots.push("/usr/local/opt");
  } else {
    roots.push("/usr/lib/jvm");
    roots.push("/usr/java");
    roots.push("/opt/java");
  }
  return roots;
}
function discoverJdkHome(roots = candidateRoots(), javaHome = process.env.JAVA_HOME) {
  const found = [];
  if (javaHome) {
    const resolved = jdkHomeFrom(javaHome);
    if (resolved)
      found.push({ home: resolved, major: Number.MAX_SAFE_INTEGER });
  }
  for (const root of roots) {
    for (const dir of childDirs(root)) {
      const resolved = jdkHomeFrom(dir);
      if (!resolved)
        continue;
      found.push({
        home: resolved,
        major: parseMajorVersion(path5.basename(dir))
      });
    }
  }
  const usable = found.filter((c) => c.major >= MIN_JAVA_MAJOR);
  if (usable.length === 0)
    return void 0;
  usable.sort((a, b) => b.major - a.major);
  return usable[0].home;
}
var _cachedEnv;
var javaAvailabilityLatch = createAvailabilityLatch();
var inFlightJavaProbe = null;
function probeJavaOnPath() {
  const memo = javaAvailabilityLatch.read();
  if (memo !== null) {
    if (javaAvailabilityLatch.getOutcome() === "transient") {
      logAvailabilityDecision({
        tool: "java",
        verdict: "unavailable",
        outcome: "transient",
        cause: javaAvailabilityLatch.getCause() ?? "probe-timeout",
        elapsedMs: 0,
        latched: false,
        retryAfterMs: Math.max(0, javaAvailabilityLatch.getRetryAtMs() - Date.now()),
        budgetMs: JAVA_PROBE_TIMEOUT_MS,
        // No probe ran here: the latch's own remembered cause is replayed
        // as-is, so the call site is the one asserting it (#2209).
        classifiedBy: "caller"
      });
      return Promise.resolve(void 0);
    }
    return Promise.resolve(memo);
  }
  if (inFlightJavaProbe)
    return inFlightJavaProbe;
  inFlightJavaProbe = runJavaProbe().finally(() => {
    inFlightJavaProbe = null;
  });
  return inFlightJavaProbe;
}
async function runJavaProbe() {
  const finder = process.platform === "win32" ? "where" : "which";
  const startedAt = Date.now();
  const sampler = startHostStallSampler();
  let result;
  let hostStallMs;
  try {
    result = await safeSpawnAsync(finder, ["java"], {
      timeout: JAVA_PROBE_TIMEOUT_MS
    });
  } finally {
    hostStallMs = sampler.stop();
  }
  const elapsedMs = Date.now() - startedAt;
  if (result.status === 0 && !result.error) {
    javaAvailabilityLatch.noteAvailable();
    logAvailabilityDecision({
      tool: "java",
      verdict: "available",
      outcome: "success",
      cause: "ok",
      elapsedMs,
      latched: true,
      hostStallMs,
      budgetMs: JAVA_PROBE_TIMEOUT_MS,
      classifiedBy: "probe"
    });
    return true;
  }
  const { outcome, cause } = classifyProbeFailure(result, {
    hostStallMs,
    unclassifiedFailureOutcome: "missing"
  });
  const retryAfterMs = javaAvailabilityLatch.noteUnavailable(outcome, cause);
  logAvailabilityDecision({
    tool: "java",
    verdict: "unavailable",
    outcome,
    cause,
    elapsedMs,
    latched: outcome !== "transient",
    hostStallMs,
    ...retryAfterMs > 0 && { retryAfterMs },
    budgetMs: JAVA_PROBE_TIMEOUT_MS,
    classifiedBy: "probe"
  });
  return outcome === "transient" ? void 0 : false;
}
async function resolveJavaRuntimeEnv() {
  if (_cachedEnv)
    return _cachedEnv.value;
  const javaOnPath = await probeJavaOnPath();
  if (javaOnPath === true) {
    _cachedEnv = { value: void 0 };
    return void 0;
  }
  const home = discoverJdkHome();
  if (home) {
    const binDir = path5.join(home, "bin");
    const currentPath = process.env.PATH ?? process.env.Path ?? "";
    _cachedEnv = {
      value: {
        JAVA_HOME: home,
        PATH: binDir + path5.delimiter + currentPath
      }
    };
    return _cachedEnv.value;
  }
  if (javaOnPath === false) {
    _cachedEnv = { value: void 0 };
  }
  return void 0;
}

// dist/clients/lsp/server-covers.js
var BUILTIN_SERVER_RUNNER_COVERS = /* @__PURE__ */ new Map([
  [
    "bash",
    { runnerIds: ["shellcheck"], gateCommands: ["bash-language-server"] }
  ],
  ["shuck", { runnerIds: ["shellcheck"], gateCommands: ["shuck"] }],
  ["toml", { runnerIds: ["taplo"], gateCommands: ["taplo"] }]
]);

// dist/clients/lsp/server.js
function withRootMarkers(root, markers) {
  root.rootMarkers = markers;
  return root;
}
function describeRootFallback(fallback) {
  const tail = "so pi-lens cannot confirm the server analysed the file";
  if (fallback.cause === "failed") {
    return `${fallback.serverName}: resolving the project root for this file failed, ${tail}`;
  }
  if (fallback.cause === "unselected") {
    return `${fallback.serverName}: found ${fallback.marker} for this file but pi-lens did not select it as the project root (a test-fixture or git-ignored directory is never used as one), ${tail}`;
  }
  return `${fallback.serverName}: no project root found for this file (looked for ${fallback.rootMarkers.join(" / ")}); the server was started at the file's directory and may not have analysed it`;
}
async function resolveLspServerCwd(server, filePath, sessionCwd, onRootFailure, onRootFallback) {
  const stagingRoot = ephemeralStagingRoot(filePath);
  if (stagingRoot) {
    recordDegradationOnce({
      kind: "lsp-root-declined",
      subject: stagingRoot,
      reason: "LSP root declined for host pi-agent staging directory"
    });
    return void 0;
  }
  const rootMarkers = server.rootMarkers ?? server.root.rootMarkers;
  let serverRoot;
  let rootFailed = false;
  try {
    serverRoot = await server.root(filePath);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    rootFailed = true;
    onRootFailure?.(reason);
  }
  const isFileDirFallback = serverRoot !== void 0 && rootMarkers?.length && path6.resolve(serverRoot) === path6.resolve(path6.dirname(filePath));
  if (!serverRoot || isFileDirFallback) {
    const probedMarker = onRootFallback && !rootFailed && rootMarkers?.length ? resolveToolCwd("lsp", server.id, filePath, {
      cwd: sessionCwd,
      rootMarkers,
      suppressTelemetry: true
    }).marker : void 0;
    const refusedMarker = probedMarker !== void 0 && rootMarkers?.includes(probedMarker) ? probedMarker : void 0;
    const fallbackCwd = rootMarkers?.length ? resolveToolCwd("lsp", server.id, filePath, {
      cwd: path6.dirname(path6.resolve(filePath)),
      rootMarkers
    }) : void 0;
    if (!serverRoot) {
      recordDegradationOnce({
        kind: "tool-cwd-resolution",
        subject: server.id,
        reason: `lsp:server-root-${rootFailed ? "failed" : "fallback"}:${filePath}`
      });
      onRootFallback?.({
        serverId: server.id,
        serverName: server.name ?? server.id,
        rootMarkers: rootMarkers ?? [],
        requiresProjectRoot: server.requiresProjectRoot === true,
        cause: rootFailed ? "failed" : refusedMarker !== void 0 ? "unselected" : "none",
        ...refusedMarker !== void 0 && { marker: refusedMarker }
      });
    }
    return fallbackCwd?.cwd;
  }
  const boundedServerRoot = enforceLspRootCeiling(serverRoot, sessionCwd, filePath);
  return resolveToolCwd("lsp", server.id, filePath, {
    cwd: sessionCwd,
    rootMarkers,
    serverRoot: boundedServerRoot
  }).cwd;
}
var FIXTURE_ROOT_SEGMENTS = /* @__PURE__ */ new Set(["__fixtures__", "testdata"]);
var FALLBACK_PROJECT_MARKERS = [
  ".git",
  "package.json",
  "go.work",
  "go.mod",
  "Cargo.toml",
  "pyproject.toml",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "mix.exs",
  "pubspec.yaml",
  "Package.swift"
];
var PROJECT_BOUNDARY_MARKERS = [
  "package.json",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "bun.lock",
  "bun.lockb",
  "go.work",
  "go.mod",
  "Cargo.toml",
  "Cargo.lock",
  "pyproject.toml",
  "uv.lock",
  "poetry.lock",
  "Pipfile",
  "Pipfile.lock",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "settings.gradle",
  "settings.gradle.kts",
  "mix.exs",
  "pubspec.yaml",
  "Package.swift"
];
var loggedRootCeilingClamps = /* @__PURE__ */ new Set();
var posixCaseInsensitiveByPath = /* @__PURE__ */ new Map();
function posixFilesystemIsCaseInsensitive(root) {
  const resolved = path6.resolve(root);
  const cached = posixCaseInsensitiveByPath.get(resolved);
  if (cached !== void 0)
    return cached;
  if (!existsSync3(resolved)) {
    return false;
  }
  const name = path6.basename(resolved);
  const alternate = name.toLowerCase() === name ? name.toUpperCase() : name.toLowerCase();
  let insensitive = false;
  const alternatePath = path6.join(path6.dirname(resolved), alternate);
  if (alternate !== name && existsSync3(alternatePath)) {
    try {
      const actual = statSync4(resolved);
      const alternateStat = statSync4(alternatePath);
      insensitive = actual.dev === alternateStat.dev && actual.ino === alternateStat.ino;
    } catch {
      insensitive = false;
    }
  }
  posixCaseInsensitiveByPath.set(resolved, insensitive);
  return insensitive;
}
function resetLSPCaseSensitivityState() {
  posixCaseInsensitiveByPath.clear();
}
function isSameOrWithin(ancestor, candidate, deps = {}) {
  const windowsShaped = isWindowsPath(ancestor) || isWindowsPath(candidate);
  const pathApi = windowsShaped ? path6.win32 : path6;
  const resolvedAncestor = pathApi.resolve(ancestor);
  const resolvedCandidate = pathApi.resolve(candidate);
  let caseInsensitive = false;
  if (!windowsShaped) {
    if (deps.caseInsensitiveProbe) {
      const cached = posixCaseInsensitiveByPath.get(resolvedAncestor);
      caseInsensitive = cached ?? deps.caseInsensitiveProbe(resolvedAncestor);
      if (cached === void 0) {
        posixCaseInsensitiveByPath.set(resolvedAncestor, caseInsensitive);
      }
    } else {
      caseInsensitive = posixFilesystemIsCaseInsensitive(resolvedAncestor);
    }
  }
  const relative2 = pathApi.relative(caseInsensitive ? resolvedAncestor.toLowerCase() : resolvedAncestor, caseInsensitive ? resolvedCandidate.toLowerCase() : resolvedCandidate);
  return relative2 === "" || !relative2.startsWith("..") && !pathApi.isAbsolute(relative2);
}
function enforceLspRootCeiling(root, sessionCwd, filePath) {
  const windowsShaped = isWindowsPath(root) || isWindowsPath(sessionCwd);
  const pathApi = windowsShaped ? path6.win32 : path6;
  const resolvedRoot = pathApi.resolve(root);
  const resolvedCwd = pathApi.resolve(sessionCwd);
  if (filePath && !isSameOrWithin(resolvedCwd, pathApi.resolve(filePath))) {
    return resolvedRoot;
  }
  if (isSameOrWithin(resolvedCwd, resolvedRoot))
    return resolvedRoot;
  const logKey = `${normalizeMapKey(resolvedCwd)}:${normalizeMapKey(resolvedRoot)}`;
  if (!loggedRootCeilingClamps.has(logKey)) {
    loggedRootCeilingClamps.add(logKey);
    logSessionStart(`lsp root clamped to session cwd: candidate=${resolvedRoot} cwd=${resolvedCwd}`);
  }
  return resolvedCwd;
}
async function hasProjectBoundaryMarker(dir) {
  if (await markerExists(dir, ".git"))
    return true;
  for (const marker of PROJECT_BOUNDARY_MARKERS) {
    if (await markerExists(dir, marker))
      return true;
  }
  return false;
}
function pathSegments(dir) {
  const parsed = path6.parse(path6.resolve(dir));
  return path6.relative(parsed.root, path6.resolve(dir)).split(path6.sep).filter(Boolean).map((segment) => segment.toLowerCase());
}
function hasFixtureConvention(dir) {
  const segments = pathSegments(dir);
  if (segments.some((segment) => FIXTURE_ROOT_SEGMENTS.has(segment)))
    return true;
  return segments.some((segment, index) => segment === "tests" && segments[index + 1] === "fixtures");
}
function hasAtomicStageSegment(dir) {
  return pathSegments(dir).some((segment) => STAGE_TMP_PATTERN.test(segment));
}
async function findGitBoundary(dir) {
  let current = path6.resolve(dir);
  const fsRoot = path6.parse(current).root;
  while (true) {
    if (await markerExists(current, ".git"))
      return current;
    if (current === fsRoot)
      return void 0;
    current = path6.dirname(current);
  }
}
async function isExcludedLspRoot(dir) {
  const candidate = path6.resolve(dir);
  if (hasFixtureConvention(candidate) || hasAtomicStageSegment(candidate))
    return true;
  const gitRoot = await findGitBoundary(candidate);
  if (!gitRoot || gitRoot === candidate)
    return false;
  if (getProjectIgnoreGlobs(gitRoot).length === 0)
    return false;
  return isPathIgnoredByProject(candidate, gitRoot, true);
}
async function nearestNonExcludedFallbackRoot(candidate) {
  if (!await isExcludedLspRoot(candidate))
    return path6.resolve(candidate);
  let current = path6.dirname(path6.resolve(candidate));
  const fsRoot = path6.parse(current).root;
  let nearestAllowed;
  while (true) {
    if (!await isExcludedLspRoot(current)) {
      nearestAllowed ??= current;
      for (const marker of FALLBACK_PROJECT_MARKERS) {
        if (await markerExists(current, marker))
          return current;
      }
    }
    if (current === fsRoot)
      break;
    current = path6.dirname(current);
  }
  return nearestAllowed ?? fsRoot;
}
function isLspInstallDisabled() {
  return process.env.PI_LENS_DISABLE_LSP_INSTALL === "1";
}
function canInstall(allowInstall) {
  return allowInstall !== false && !isLspInstallDisabled();
}
var DIRECT_LSP_NEGATIVE_TTL_MS = Math.max(3e4, Number.parseInt(process.env.PI_LENS_DIRECT_LSP_NEGATIVE_TTL_MS ?? "600000", 10) || 6e5);
var directLspCommandUnavailableUntil = /* @__PURE__ */ new Map();
var directLspCommandSkipLoggedUntil = /* @__PURE__ */ new Map();
var LSP_SERVICE_GENERATION_FAMILY = "lsp.service.generation";
var LSP_SERVICE_GENERATION_VERSION = 1;
function lspServiceGenerationCell() {
  let seed = 0;
  return getProcessSingleton(LSP_SERVICE_GENERATION_FAMILY, LSP_SERVICE_GENERATION_VERSION, () => ({ generation: seed }), (previous) => {
    const value = previous?.generation;
    seed = typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : 0;
  });
}
var lspLaunchAvailabilityGeneration = createGenerationSource("lsp-launch-availability", lspServiceGenerationCell);
function resetLspLaunchAvailabilityGeneration() {
  lspLaunchAvailabilityGeneration.bump();
}
function staleLaunch(generation, subject, proc) {
  if (generation.isCurrent())
    return false;
  try {
    proc?.process?.kill();
  } catch {
  }
  generation.guardedWrite(subject, () => void 0);
  return true;
}
async function installEvidenceForLaunch(toolId, installed, attempt) {
  const evidence = describeInstallAttempt(attempt);
  const confirmedManagedPath = await findManagedToolBinary(toolId);
  return {
    ...evidence,
    binary: path6.basename(installed),
    ...confirmedManagedPath !== void 0 && pathsEqual(confirmedManagedPath, installed) && {
      source: "managed-dir"
    }
  };
}
function captureInstallAttempt(toolId) {
  try {
    return getInstallAttempt?.(toolId);
  } catch {
  }
  return void 0;
}
function resetDirectLspCommandAvailability() {
  directLspCommandUnavailableUntil.clear();
  directLspCommandSkipLoggedUntil.clear();
}
function pruneExpiredDirectLspNegativeEntries(now = Date.now()) {
  for (const [command, until] of directLspCommandUnavailableUntil) {
    if (until <= now) {
      directLspCommandUnavailableUntil.delete(command);
      directLspCommandSkipLoggedUntil.delete(command);
    }
  }
  for (const [command, until] of directLspCommandSkipLoggedUntil) {
    if (until <= now)
      directLspCommandSkipLoggedUntil.delete(command);
  }
}
function isSimpleCommand(command) {
  return !isFullyQualified(command) && !command.includes("/") && !command.includes("\\");
}
function isDirectLspCommandTemporarilyUnavailable(command) {
  const now = Date.now();
  pruneExpiredDirectLspNegativeEntries(now);
  const until = directLspCommandUnavailableUntil.get(command);
  if (!until || until <= now) {
    directLspCommandUnavailableUntil.delete(command);
    return false;
  }
  const loggedUntil = directLspCommandSkipLoggedUntil.get(command) ?? 0;
  if (loggedUntil <= now) {
    logSessionStart(`lsp direct command ${command}: skipped by negative availability cache (${Math.max(0, until - now)}ms remaining)`);
    directLspCommandSkipLoggedUntil.set(command, until);
  }
  return true;
}
function markDirectLspCommandUnavailable(command) {
  if (!isSimpleCommand(command))
    return;
  directLspCommandUnavailableUntil.set(command, Date.now() + DIRECT_LSP_NEGATIVE_TTL_MS);
  directLspCommandSkipLoggedUntil.delete(command);
}
var PI_LENS_BIN_DIR2 = path6.join(getGlobalPiLensDir(), "bin");
async function resolveAndLaunch(spec, allowInstall) {
  const generation = lspLaunchAvailabilityGeneration.capture();
  const toolLabel = spec.managedToolId ?? spec.candidates[spec.candidates.length - 1] ?? "unknown";
  let lastRuntimeFailure;
  const trackRuntimeFailure = (err) => {
    const message = err instanceof Error ? err.message : String(err);
    if (!hasSpawnFailureKind(err, "tool-not-found")) {
      lastRuntimeFailure = err instanceof Error ? err : new Error(message);
    }
  };
  const managedProbeStartedAt = Date.now();
  const managedCandidate = spec.managedToolId ? await findManagedToolBinary(spec.managedToolId) : void 0;
  if (staleLaunch(generation, `${toolLabel}:findManagedToolBinary`)) {
    return void 0;
  }
  const candidates = managedCandidate && !spec.candidates.includes(managedCandidate) ? [managedCandidate, ...spec.candidates] : spec.candidates;
  const candidateFailures = [];
  for (const [index, command] of candidates.entries()) {
    logLatency({
      type: "phase",
      phase: "lsp_launch_candidate_attempt",
      filePath: spec.cwd,
      durationMs: 0,
      metadata: {
        tool: toolLabel,
        command,
        index,
        totalCandidates: candidates.length,
        allowInstall: canInstall(allowInstall)
      }
    });
    logSessionStart(`lsp launch candidate attempt tool=${toolLabel} idx=${index}/${candidates.length - 1} command=${command} cwd=${spec.cwd}`);
    try {
      const proc = await launchLSP(command, spec.args, {
        cwd: spec.cwd,
        env: spec.env
      });
      if (staleLaunch(generation, `${toolLabel}:launchLSP:${command}`, proc)) {
        return void 0;
      }
      logLatency({
        type: "phase",
        phase: "lsp_launch_candidate_success",
        filePath: spec.cwd,
        durationMs: 0,
        metadata: {
          tool: toolLabel,
          command,
          index,
          source: "direct"
        }
      });
      logSessionStart(`lsp launch candidate success tool=${toolLabel} idx=${index} command=${command} source=direct`);
      if (managedCandidate !== void 0 && command === managedCandidate) {
        logAvailabilityDecision({
          tool: toolLabel,
          verdict: "available",
          outcome: "success",
          cause: "ok",
          elapsedMs: Date.now() - managedProbeStartedAt,
          latched: false,
          producer: "lsp-launch",
          classifiedBy: "probe",
          evidence: {
            binary: path6.basename(managedCandidate),
            source: "managed-dir",
            correctsLatchedRow: false
          }
        });
      }
      return { process: proc, source: "direct" };
    } catch (err) {
      if (staleLaunch(generation, `${toolLabel}:launchLSP:${command}`)) {
        return void 0;
      }
      const message = err instanceof Error ? err.message : String(err);
      candidateFailures.push({ index, command, message, err });
    }
  }
  for (const failure of candidateFailures) {
    logLatency({
      type: "phase",
      phase: "lsp_launch_candidate_failed",
      filePath: spec.cwd,
      durationMs: 0,
      metadata: {
        tool: toolLabel,
        command: failure.command,
        index: failure.index,
        error: failure.message
      }
    });
    logSessionStart(`lsp launch candidate failed tool=${toolLabel} idx=${failure.index} command=${failure.command} error=${failure.message}`);
    trackRuntimeFailure(failure.err);
  }
  const hasOnlyRepairableCandidateFailures = candidateFailures.every((failure) => hasSpawnFailureKind(failure.err, "tool-not-found"));
  if (!hasOnlyRepairableCandidateFailures) {
    if (lastRuntimeFailure)
      throw lastRuntimeFailure;
    return void 0;
  }
  if (!canInstall(allowInstall)) {
    logSessionStart(`lsp launch install blocked tool=${toolLabel} cwd=${spec.cwd} allowInstall=${allowInstall !== false} globalDisabled=${isLspInstallDisabled()}`);
    logLatency({
      type: "phase",
      phase: "lsp_launch_install_blocked",
      filePath: spec.cwd,
      durationMs: 0,
      metadata: {
        tool: toolLabel,
        allowInstall,
        globalInstallDisabled: isLspInstallDisabled()
      }
    });
    return void 0;
  }
  if (spec.managedToolId) {
    const failedCandidate = candidateFailures.at(-1);
    const classifiedFailure = classifyProbeFailure({
      error: failedCandidate?.err instanceof Error ? failedCandidate.err : void 0,
      spawnFailure: {
        kind: hasSpawnFailureKind(failedCandidate?.err, "tool-not-found") ? "tool-not-found" : void 0
      }
    }, { command: failedCandidate?.command });
    logAvailabilityDecision({
      tool: spec.managedToolId,
      verdict: "unavailable",
      outcome: classifiedFailure.outcome,
      cause: classifiedFailure.cause,
      elapsedMs: Date.now() - managedProbeStartedAt,
      latched: false,
      classifiedBy: "probe",
      producer: "lsp-launch",
      evidence: classifiedFailure.evidence
    });
    logSessionStart(`lsp launch ensure-tool start tool=${spec.managedToolId} cwd=${spec.cwd}`);
    const installStartedAt = Date.now();
    const installed = await ensureTool(spec.managedToolId);
    const installAttempt = captureInstallAttempt(spec.managedToolId);
    if (staleLaunch(generation, `${toolLabel}:ensureTool`)) {
      return void 0;
    }
    logSessionStart(`lsp launch ensure-tool result tool=${spec.managedToolId} installed=${installed ? "yes" : "no"} path=${installed ?? ""}`);
    logLatency({
      type: "phase",
      phase: "lsp_launch_ensure_tool_result",
      filePath: spec.cwd,
      durationMs: 0,
      metadata: {
        tool: spec.managedToolId,
        installed: Boolean(installed),
        path: installed
      }
    });
    if (installed) {
      try {
        const proc = await launchLSP(installed, spec.args, {
          cwd: spec.cwd,
          env: spec.env
        });
        if (staleLaunch(generation, `${toolLabel}:launchLSP:managed`, proc)) {
          return void 0;
        }
        logSessionStart(`lsp launch managed success tool=${spec.managedToolId} command=${installed} source=managed`);
        logLatency({
          type: "phase",
          phase: "lsp_launch_managed_success",
          filePath: spec.cwd,
          durationMs: 0,
          metadata: {
            tool: spec.managedToolId,
            command: installed
          }
        });
        const evidence = await installEvidenceForLaunch(spec.managedToolId, installed, installAttempt);
        if (staleLaunch(generation, `${toolLabel}:managed-evidence`, proc)) {
          return void 0;
        }
        logAvailabilityDecision({
          tool: spec.managedToolId,
          verdict: "available",
          outcome: "success",
          cause: "ok",
          elapsedMs: Date.now() - installStartedAt,
          latched: false,
          classifiedBy: "caller",
          producer: "lsp-launch",
          evidence: {
            ...evidence,
            correctsLatchedRow: false
          }
        });
        return { process: proc, source: "managed" };
      } catch (err) {
        if (staleLaunch(generation, `${toolLabel}:launchLSP:managed-rejection`)) {
          return void 0;
        }
        const message = err instanceof Error ? err.message : String(err);
        logSessionStart(`lsp launch managed failed tool=${spec.managedToolId} command=${installed} error=${message}`);
        logLatency({
          type: "phase",
          phase: "lsp_launch_managed_failed",
          filePath: spec.cwd,
          durationMs: 0,
          metadata: {
            tool: spec.managedToolId,
            command: installed,
            error: message
          }
        });
        trackRuntimeFailure(err);
        const looksPathResolved = !installed.includes("/") && !installed.includes("\\");
        if (looksPathResolved && hasSpawnFailureKind(err, "tool-not-found")) {
          logSessionStart(`lsp launch managed retry force-reinstall tool=${spec.managedToolId}`);
          const reinstalled = await ensureTool(spec.managedToolId, {
            forceReinstall: true
          });
          const reinstallAttempt = captureInstallAttempt(spec.managedToolId);
          if (staleLaunch(generation, `${toolLabel}:forceReinstall`)) {
            return void 0;
          }
          if (reinstalled) {
            try {
              const proc = await launchLSP(reinstalled, spec.args, {
                cwd: spec.cwd,
                env: spec.env
              });
              if (staleLaunch(generation, `${toolLabel}:launchLSP:forceReinstall`, proc)) {
                return void 0;
              }
              logSessionStart(`lsp launch managed force-reinstall success tool=${spec.managedToolId} command=${reinstalled}`);
              logLatency({
                type: "phase",
                phase: "lsp_launch_managed_force_reinstall_success",
                filePath: spec.cwd,
                durationMs: 0,
                metadata: {
                  tool: spec.managedToolId,
                  command: reinstalled
                }
              });
              const evidence = await installEvidenceForLaunch(spec.managedToolId, reinstalled, reinstallAttempt);
              if (staleLaunch(generation, `${toolLabel}:forceReinstall-evidence`, proc)) {
                return void 0;
              }
              logAvailabilityDecision({
                tool: spec.managedToolId,
                verdict: "available",
                outcome: "success",
                cause: "ok",
                elapsedMs: Date.now() - installStartedAt,
                latched: false,
                classifiedBy: "caller",
                producer: "lsp-launch",
                evidence: {
                  ...evidence,
                  correctsLatchedRow: false
                }
              });
              return { process: proc, source: "managed" };
            } catch (retryErr) {
              logSessionStart(`lsp launch managed force-reinstall failed tool=${spec.managedToolId} error=${retryErr instanceof Error ? retryErr.message : String(retryErr)}`);
            }
          }
        }
      }
    }
  }
  const runtimeInstall = spec.runtimeInstall;
  const runtimeAvailable = runtimeInstall ? await isOnPath(runtimeInstall.runtimeCommand) : false;
  if (staleLaunch(generation, `${toolLabel}:runtimeAvailability`)) {
    return void 0;
  }
  if (runtimeInstall && runtimeAvailable) {
    const ok = await runtimeInstall.install();
    if (staleLaunch(generation, `${toolLabel}:runtimeInstall`)) {
      return void 0;
    }
    if (ok) {
      const retry = runtimeInstall.retryCandidates ?? spec.candidates;
      for (const command of retry) {
        try {
          const proc = await launchLSP(command, spec.args, {
            cwd: spec.cwd,
            env: spec.env
          });
          if (staleLaunch(generation, `${toolLabel}:launchLSP:runtime`, proc)) {
            return void 0;
          }
          return { process: proc, source: "managed" };
        } catch (err) {
          if (staleLaunch(generation, `${toolLabel}:launchLSP:runtime`)) {
            return void 0;
          }
          trackRuntimeFailure(err);
        }
      }
    }
  }
  if (lastRuntimeFailure) {
    throw lastRuntimeFailure;
  }
  return void 0;
}
async function resolveAndLaunchBundle(spec, allowInstall) {
  let runtime;
  for (const candidate of spec.runtimeCandidates) {
    if (await isOnPath(candidate)) {
      runtime = candidate;
      break;
    }
  }
  if (!runtime) {
    logSessionStart(`lsp launch bundle skip tool=${spec.bundleToolId}: no runtime on PATH (tried ${spec.runtimeCandidates.join(", ")})`);
    return void 0;
  }
  let bundleDir = await getToolPath(spec.bundleToolId);
  if (!bundleDir && canInstall(allowInstall)) {
    bundleDir = await ensureTool(spec.bundleToolId);
  }
  if (!bundleDir) {
    logSessionStart(`lsp launch bundle skip tool=${spec.bundleToolId}: bundle not installed (allowInstall=${allowInstall !== false})`);
    return void 0;
  }
  try {
    const proc = await launchLSP(runtime, spec.args(bundleDir), {
      cwd: spec.cwd,
      env: spec.env
    });
    logSessionStart(`lsp launch bundle success tool=${spec.bundleToolId} runtime=${runtime} bundle=${bundleDir}`);
    return { process: proc, source: "managed" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logSessionStart(`lsp launch bundle failed tool=${spec.bundleToolId} runtime=${runtime} error=${message}`);
    return void 0;
  }
}
async function resolveAndLaunchTreeBinary(spec, allowInstall) {
  for (const command of spec.candidates) {
    try {
      const proc = await launchLSP(command, spec.args, {
        cwd: spec.cwd,
        env: spec.env
      });
      return { process: proc, source: "direct" };
    } catch {
    }
  }
  let bundleDir = await getToolPath(spec.bundleToolId);
  if (!bundleDir && canInstall(allowInstall)) {
    bundleDir = await ensureTool(spec.bundleToolId);
  }
  if (!bundleDir) {
    logSessionStart(`lsp launch tree-bin skip tool=${spec.bundleToolId}: not on PATH and bundle not installed (allowInstall=${allowInstall !== false})`);
    return void 0;
  }
  const suffix = process.platform === "win32" ? ".exe" : "";
  const binPath = path6.join(bundleDir, ...spec.binRelPath.split("/")) + suffix;
  try {
    const proc = await launchLSP(binPath, spec.args, {
      cwd: spec.cwd,
      env: spec.env
    });
    logSessionStart(`lsp launch tree-bin success tool=${spec.bundleToolId} bin=${binPath}`);
    return { process: proc, source: "managed" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logSessionStart(`lsp launch tree-bin failed tool=${spec.bundleToolId} bin=${binPath} error=${message}`);
    return void 0;
  }
}
function nodeBinLocalCandidates(root, baseName) {
  const localBase = path6.join(root, "node_modules", ".bin", baseName);
  if (process.platform === "win32") {
    return [`${localBase}.cmd`, `${localBase}.exe`];
  }
  return [localBase];
}
function nodeBinCandidates(root, baseName) {
  return [...nodeBinLocalCandidates(root, baseName), baseName];
}
function piAgentExtensionsRootKey(file) {
  const dirKey = normalizeEphemeralMapKey(path6.dirname(path6.resolve(file)));
  const marker = "/.pi/agent/extensions";
  const index = dirKey.indexOf(marker);
  if (index === -1)
    return void 0;
  return dirKey.slice(0, index + marker.length);
}
function IgnoreHomeRoot(primary) {
  const homeKey = normalizeEphemeralMapKey(path6.resolve(os7.homedir()));
  return withRootMarkers(async (file) => {
    const root = await primary(file);
    if (!root)
      return void 0;
    return normalizeEphemeralMapKey(path6.resolve(root)) === homeKey ? void 0 : root;
  }, primary.rootMarkers ?? []);
}
function rubyBinCandidates(baseName) {
  const candidates = [];
  const home = os7.homedir();
  const isWin = process.platform === "win32";
  const ext = isWin ? ".bat" : "";
  candidates.push(path6.join(home, ".local", "share", "mise", "installs", "ruby", "bin", `${baseName}${ext}`));
  candidates.push(path6.join(home, ".asdf", "installs", "ruby", "bin", `${baseName}${ext}`));
  if (isWin) {
    const driveRoot = path6.parse(home).root;
    for (const entry of getRubyVersionDirNamesSync(driveRoot)) {
      candidates.push(path6.join(driveRoot, entry, "bin", `${baseName}.bat`));
      candidates.push(path6.join(driveRoot, entry, "bin", baseName));
    }
  }
  return candidates;
}
function createInteractiveServer(spec) {
  return {
    id: spec.id,
    name: spec.name,
    extensions: spec.extensions,
    idleEviction: "unmeasured",
    // `InteractiveServerSpec` declares no role, so the factory applies the
    // stated default rather than leaving `role` absent for each consumer to
    // read by negation (#1488). An auxiliary would declare its role on a
    // row of its own, the way the four scanner rows do.
    role: DEFAULT_LSP_SERVER_ROLE,
    root: spec.root,
    rootMarkers: spec.root.rootMarkers,
    fallbackFor: spec.fallbackFor,
    requiresProjectRoot: spec.requiresProjectRoot,
    executesProjectCode: spec.executesProjectCode,
    availabilityKey: typeof spec.command === "string" && isSimpleCommand(spec.command) ? spec.command : void 0,
    async spawn(root) {
      const command = typeof spec.command === "function" ? spec.command(root) : spec.command;
      const args = typeof spec.args === "function" ? spec.args(root) : spec.args || [];
      if (isSimpleCommand(command) && isDirectLspCommandTemporarilyUnavailable(command)) {
        return void 0;
      }
      const runtimeEnv = spec.runtime === "java" ? await resolveJavaRuntimeEnv() : void 0;
      try {
        const proc = await launchLSP(command, args, {
          cwd: root,
          ...runtimeEnv ? { env: runtimeEnv } : {}
        });
        const initialization = typeof spec.initialization === "function" ? spec.initialization(root) : spec.initialization;
        return { process: proc, source: "direct", initialization };
      } catch (err) {
        if (hasSpawnFailureKind(err, "tool-not-found")) {
          markDirectLspCommandUnavailable(command);
        }
        return void 0;
      }
    }
  };
}
function PriorityRoot(markerGroups, excludePatterns, stopDir) {
  const resolvers = markerGroups.map((markers) => NearestRoot(markers, excludePatterns, stopDir));
  return withRootMarkers(async (file) => {
    for (const resolve4 of resolvers) {
      const root = await resolve4(file);
      if (root)
        return root;
    }
    return void 0;
  }, markerGroups.flat());
}
var FileDirRoot = async (file) => {
  const candidate = path6.resolve(path6.dirname(file));
  return nearestNonExcludedFallbackRoot(candidate);
};
function RootWithFallback(primary, fallback = FileDirRoot) {
  return withRootMarkers(async (file) => {
    const primaryRoot = await primary(file);
    if (primaryRoot)
      return primaryRoot;
    return fallback(file);
  }, primary.rootMarkers ?? []);
}
function WorkspacePriorityRoot(markerGroups, excludePatterns) {
  return withRootMarkers(async (file) => PriorityRoot(markerGroups, excludePatterns, process.cwd())(file), markerGroups.flat());
}
function isPermissionFsError(err) {
  const code = err?.code;
  return code === "EACCES" || code === "EPERM";
}
function markerProbeDir(dir, pattern) {
  const normalized = toPosix(pattern);
  const slash = normalized.lastIndexOf("/");
  const parentPattern = slash >= 0 ? normalized.slice(0, slash) : "";
  return parentPattern ? path6.join(dir, ...parentPattern.split("/").filter(Boolean)) : dir;
}
async function markerExists(dir, pattern) {
  if (!pattern.includes("*")) {
    try {
      await stat(path6.join(dir, pattern));
      return true;
    } catch (err) {
      if (isPermissionFsError(err)) {
        logSessionStart(`lsp root marker skipped: permission error stat ${path6.join(dir, pattern)}`);
      }
      return false;
    }
  }
  const normalized = pattern.replace(/\\/g, "/");
  const slash = normalized.lastIndexOf("/");
  const basenamePattern = slash >= 0 ? normalized.slice(slash + 1) : normalized;
  if (!basenamePattern)
    return false;
  const targetDir = markerProbeDir(dir, normalized);
  try {
    const entries = await readdir(targetDir, { withFileTypes: true });
    return direntsHaveMarkerGlobMatch(entries, basenamePattern);
  } catch (err) {
    if (isPermissionFsError(err)) {
      logSessionStart(`lsp root marker skipped: permission error read ${targetDir}`);
    }
    return false;
  }
}
var rootMtimeBound = (label) => ({
  ms: HOOK_WALL_BUDGET_MS.tool_result_edit,
  signal: void 0,
  hook: "tool_result_edit",
  label
});
function NearestRoot(includePatterns, excludePatterns, stopDir) {
  const cache = /* @__PURE__ */ new Map();
  const inFlight = /* @__PURE__ */ new Map();
  const subdirPatterns = [];
  for (const pattern of [...includePatterns, ...excludePatterns ?? []]) {
    if (markerProbeDir("", pattern))
      subdirPatterns.push(pattern);
  }
  return withRootMarkers(async (file) => {
    const startDir = path6.resolve(path6.dirname(file));
    const dirKey = normalizeMapKey(startDir);
    const cached = cache.get(dirKey);
    if (cached !== void 0 && Date.now() - cached.walkedAt < FRESHNESS_CADENCE_MS && await bounded(dirMtimesStillFreshAsync(cached.probedDirs), rootMtimeBound("lsp-root-memo-freshness")) === true)
      return cached.root;
    const flying = inFlight.get(dirKey);
    if (flying)
      return flying;
    const probedDirs = [];
    const walkedAt = Date.now();
    const promise = (async () => {
      let currentDir = startDir;
      const fsRoot = path6.parse(currentDir).root;
      const stop = stopDir ? path6.resolve(stopDir) : fsRoot;
      while (true) {
        if (stop !== fsRoot && currentDir.startsWith(stop + path6.sep) === false && currentDir !== stop) {
          break;
        }
        const stepDirs = [
          currentDir,
          ...subdirPatterns.map((pattern) => markerProbeDir(currentDir, pattern))
        ];
        const stepRecords = await bounded(dirMtimeRecordsAsync(stepDirs), rootMtimeBound("lsp-root-walk-dir-mtimes"));
        probedDirs.push(...stepRecords ?? unknownDirMtimeRecords(stepDirs));
        if (excludePatterns) {
          let excluded = false;
          for (const pattern of excludePatterns) {
            if (await markerExists(currentDir, pattern)) {
              excluded = true;
              break;
            }
          }
          if (excluded) {
            currentDir = path6.dirname(currentDir);
            continue;
          }
        }
        for (const pattern of includePatterns) {
          if (await markerExists(currentDir, pattern) && (pattern !== ".git" || currentDir !== os7.tmpdir()) && !await isExcludedLspRoot(currentDir)) {
            return enforceLspRootCeiling(currentDir, process.cwd(), file);
          }
        }
        if (currentDir === stop || currentDir === fsRoot) {
          break;
        }
        currentDir = path6.dirname(currentDir);
      }
      return void 0;
    })();
    inFlight.set(dirKey, promise);
    try {
      const result = await promise;
      if (result !== void 0)
        cache.set(dirKey, { root: result, probedDirs, walkedAt });
      return result;
    } finally {
      inFlight.delete(dirKey);
    }
  }, includePatterns);
}
var createRootDetector = NearestRoot;
function isOnPath(command) {
  return isCommandAvailableAsync(command);
}
async function tryGoInstallGopls() {
  const isWindows2 = process.platform === "win32";
  const result = await safeSpawnAsync(isWindows2 ? "go.exe" : "go", ["install", "golang.org/x/tools/gopls@latest"], { timeout: 18e4, ignoreAmbientSignal: true });
  return !result.error && result.status === 0;
}
async function tryDotnetToolInstall(tool) {
  mkdirSync2(PI_LENS_BIN_DIR2, { recursive: true });
  const result = await safeSpawnAsync("dotnet", ["tool", "install", "--tool-path", PI_LENS_BIN_DIR2, tool], { timeout: 18e4, ignoreAmbientSignal: true });
  if (!result.error && result.status === 0)
    return true;
  const stderr = result.stderr ?? "";
  if (stderr.includes("No NuGet sources are defined or enabled")) {
    logSessionStart(`lsp dotnet-install: NuGet sources missing \u2014 cannot install ${tool}. Run: dotnet nuget add source https://api.nuget.org/v3/index.json -n nuget.org`);
    return false;
  }
  const updateResult = await safeSpawnAsync("dotnet", ["tool", "update", "--tool-path", PI_LENS_BIN_DIR2, tool], { timeout: 18e4, ignoreAmbientSignal: true });
  return !updateResult.error && updateResult.status === 0;
}
async function findAncestorFile(startDir, ...relativeSegments) {
  return findAncestorFileAmong(startDir, [relativeSegments]);
}
async function findAncestorFileAmong(startDir, candidateSegmentLists) {
  const fs6 = await import("node:fs/promises");
  let currentDir = path6.resolve(startDir);
  while (!isAtOrAboveHomeDir(currentDir)) {
    for (const segments of candidateSegmentLists) {
      const candidate = path6.join(currentDir, ...segments);
      try {
        await fs6.access(candidate);
        return candidate;
      } catch {
      }
    }
    const parent = path6.dirname(currentDir);
    if (parent === currentDir)
      break;
    currentDir = parent;
  }
  return void 0;
}
var CLASSIC_TS_REPAIR_FAMILY = "lsp.classic-ts-repair-guard";
var CLASSIC_TS_REPAIR_VERSION = 1;
function classicTsRepairState() {
  return getProcessSingleton(CLASSIC_TS_REPAIR_FAMILY, CLASSIC_TS_REPAIR_VERSION, () => ({ attempted: false }));
}
function resetClassicTsRepairGuard() {
  classicTsRepairState().attempted = false;
}
function typescriptDirsForTsc(tscPath) {
  const binDir = path6.dirname(tscPath);
  return [
    path6.join(binDir, "..", "typescript"),
    path6.join(binDir, "..", "..", "typescript")
  ];
}
async function typescriptVersionForTsc(tscPath) {
  if (!path6.isAbsolute(tscPath))
    return void 0;
  for (const dir of typescriptDirsForTsc(tscPath)) {
    let manifest;
    try {
      manifest = await readFile(path6.join(dir, "package.json"), "utf8");
    } catch {
      continue;
    }
    let version;
    try {
      const parsed = JSON.parse(manifest);
      if (typeof parsed !== "object" || parsed === null || !("version" in parsed) || typeof parsed.version !== "string") {
        return void 0;
      }
      version = parsed.version;
    } catch {
      return void 0;
    }
    const majorText = version.split(".", 1)[0] ?? "";
    const major = /^\d+$/.test(majorText) ? Number(majorText) : Number.NaN;
    if (!Number.isFinite(major))
      return void 0;
    return { version, major };
  }
  return void 0;
}
async function findTsserverPath(root, allowInstall, options) {
  const fs6 = await import("node:fs/promises");
  const projectRoots = await Promise.all([root, options?.sessionRoot ?? process.cwd(), process.cwd()].map((dir) => fs6.realpath(dir).catch(() => path6.resolve(dir))));
  const admitCandidate = async (candidate, projectSupplied) => {
    try {
      const real = await fs6.realpath(candidate);
      if (path6.basename(real) !== "tsserver.js" || !(await fs6.stat(real)).isFile())
        return void 0;
      const manifest = JSON.parse(await fs6.readFile(path6.join(path6.dirname(real), "..", "package.json"), "utf8"));
      if (typeof manifest?.version !== "string" || !manifest.version)
        return void 0;
      return admitProjectSuppliedTsserver(real, options?.sessionRoot ?? process.cwd(), projectSupplied || projectRoots.some((dir) => isUnderDir(real, dir)), options?.projectCodeAllowed);
    } catch {
      return void 0;
    }
  };
  const ancestorHit = await findAncestorFile(root, "node_modules", "typescript", "lib", "tsserver.js");
  if (ancestorHit) {
    const admittedAncestor = await admitCandidate(ancestorHit, true);
    if (admittedAncestor)
      return admittedAncestor;
  }
  const cwdCandidate = path6.join(process.cwd(), "node_modules", "typescript", "lib", "tsserver.js");
  try {
    await fs6.access(cwdCandidate);
    const admittedCwd = await admitCandidate(cwdCandidate, false);
    if (admittedCwd)
      return admittedCwd;
  } catch {
  }
  const tsserverForTsc = async (tscPath) => {
    if (!tscPath || !path6.isAbsolute(tscPath))
      return void 0;
    for (const dir of typescriptDirsForTsc(tscPath)) {
      const candidate = path6.join(dir, "lib", "tsserver.js");
      try {
        const admitted = await admitCandidate(candidate, false);
        if (admitted)
          return admitted;
      } catch {
      }
    }
    return void 0;
  };
  const installAllowed = canInstall(allowInstall);
  const discoveredTsc = await ensureTool("typescript", {
    allowInstall: installAllowed
  });
  const discoveredTsserver = await tsserverForTsc(discoveredTsc);
  if (discoveredTsserver || !discoveredTsc || !installAllowed || classicTsRepairState().attempted) {
    return discoveredTsserver;
  }
  const discoveredVersion = await typescriptVersionForTsc(discoveredTsc);
  if (!discoveredVersion || discoveredVersion.major < 7)
    return void 0;
  classicTsRepairState().attempted = true;
  logSessionStart(`lsp typescript: managed compiler resolved to TypeScript ${discoveredVersion.version}, which ships no tsserver.js; reinstalling pinned classic fallback`);
  const repairedTsc = await ensureTool("typescript", {
    allowInstall: true,
    forceReinstall: true
  });
  return tsserverForTsc(repairedTsc);
}
async function findNativeTypeScriptLsp(root) {
  let currentDir = path6.resolve(root);
  while (!isAtOrAboveHomeDir(currentDir)) {
    const typescriptDir = path6.join(currentDir, "node_modules", "typescript");
    const packageJsonPath = path6.join(typescriptDir, "package.json");
    let packageJsonText;
    try {
      packageJsonText = await readFile(packageJsonPath, "utf8");
    } catch (error) {
      if (error.code !== "ENOENT") {
        return void 0;
      }
      try {
        const dirStat = await stat(typescriptDir);
        if (dirStat.isDirectory())
          return void 0;
      } catch {
      }
      const parent = path6.dirname(currentDir);
      if (parent === currentDir)
        return void 0;
      currentDir = parent;
      continue;
    }
    let version;
    try {
      const parsed = JSON.parse(packageJsonText);
      if (typeof parsed !== "object" || parsed === null || !("version" in parsed) || typeof parsed.version !== "string") {
        return void 0;
      }
      version = parsed.version;
    } catch {
      return void 0;
    }
    const majorText = version.split(".", 1)[0] ?? "";
    const major = /^\d+$/.test(majorText) ? Number(majorText) : Number.NaN;
    if (!Number.isFinite(major) || major < 7)
      return void 0;
    const localTsc = path6.join(currentDir, "node_modules", ".bin", "tsc");
    const candidates = process.platform === "win32" ? [`${localTsc}.cmd`, `${localTsc}.exe`, localTsc] : [localTsc];
    for (const command of candidates) {
      try {
        await access(command);
        return { command, version };
      } catch {
      }
    }
    return void 0;
  }
  return void 0;
}
function dotnetToolCandidates(tool) {
  const home = os7.homedir();
  return [
    path6.join(PI_LENS_BIN_DIR2, `${tool}.exe`),
    path6.join(PI_LENS_BIN_DIR2, tool),
    path6.join(home, ".dotnet", "tools", `${tool}.exe`),
    path6.join(home, ".dotnet", "tools", tool),
    tool
  ].filter(Boolean);
}
function binExeVariants(dir, tool) {
  return process.platform === "win32" ? [path6.join(dir, `${tool}.exe`), path6.join(dir, tool)] : [path6.join(dir, tool)];
}
function goBinCandidates(tool) {
  const gopath = process.env.GOPATH?.split(path6.delimiter)[0] || path6.join(os7.homedir(), "go");
  return [tool, ...binExeVariants(path6.join(gopath, "bin"), tool)];
}
function cargoBinCandidates(tool) {
  const cargoHome = process.env.CARGO_HOME || path6.join(os7.homedir(), ".cargo");
  return [tool, ...binExeVariants(path6.join(cargoHome, "bin"), tool)];
}
async function tryGemInstall(gem) {
  const { join: join4 } = await import("node:path");
  const binDir = join4(getGlobalPiLensDir(), "bin");
  const { mkdir } = await import("node:fs/promises");
  await mkdir(binDir, { recursive: true });
  const result = await safeSpawnAsync("gem", ["install", gem, "--bindir", binDir, "--no-document"], { timeout: 18e4, ignoreAmbientSignal: true });
  const ok = !result.error && result.status === 0;
  if (ok) {
    const sep2 = process.platform === "win32" ? ";" : ":";
    if (!process.env.PATH?.includes(binDir)) {
      process.env.PATH = `${binDir}${sep2}${process.env.PATH ?? ""}`;
    }
  }
  return ok;
}
function DenoExcludeRoot(primary) {
  const denoDetector = createRootDetector(["deno.json", "deno.jsonc"]);
  return async (file) => {
    const denoRoot = await denoDetector(file);
    if (denoRoot)
      return void 0;
    return primary(file);
  };
}
var JS_TS_LSP_EXTENSIONS = KIND_EXTENSIONS["jsts"].filter((ext) => ext !== ".svelte" && ext !== ".vue");
var TS_CONFIG_MARKERS = ["tsconfig.json", "jsconfig.json"];
var TS_TOOLING_MARKERS = [
  "package-lock.json",
  "bun.lockb",
  "bun.lock",
  "pnpm-lock.yaml",
  "yarn.lock",
  "package.json"
];
var TS_FAMILY_EXTENSIONS = /* @__PURE__ */ new Set([".ts", ".tsx", ".mts", ".cts"]);
function isTsFamilyFile(file) {
  return TS_FAMILY_EXTENSIONS.has(path6.extname(file).toLowerCase());
}
function tsConfigMarkersForFile(file) {
  return isTsFamilyFile(file) ? ["tsconfig.json"] : TS_CONFIG_MARKERS;
}
var TypeScriptConfigRootTsOnly = IgnoreHomeRoot(createRootDetector(["tsconfig.json"]));
var TypeScriptConfigRootEither = IgnoreHomeRoot(createRootDetector([...TS_CONFIG_MARKERS]));
var TypeScriptToolingRoot = IgnoreHomeRoot(createRootDetector([...TS_TOOLING_MARKERS]));
async function findTypeScriptProjectRoot(file) {
  const configDetector = isTsFamilyFile(file) ? TypeScriptConfigRootTsOnly : TypeScriptConfigRootEither;
  const [configRoot, toolingRoot] = await Promise.all([
    configDetector(file),
    TypeScriptToolingRoot(file)
  ]);
  if (!configRoot)
    return toolingRoot;
  if (!toolingRoot)
    return configRoot;
  return isSameOrWithin(toolingRoot, configRoot) ? configRoot : toolingRoot;
}
async function findExtensionBoundedRoot(file, extensionRootKey) {
  const startDir = path6.resolve(path6.dirname(file));
  let currentDir = startDir;
  const configMarkers = tsConfigMarkersForFile(file);
  while (true) {
    for (const pattern of configMarkers) {
      try {
        await stat(path6.join(currentDir, pattern));
        return currentDir;
      } catch {
      }
    }
    for (const pattern of TS_TOOLING_MARKERS) {
      try {
        await stat(path6.join(currentDir, pattern));
        return currentDir;
      } catch {
      }
    }
    const currentKey = normalizeEphemeralMapKey(path6.resolve(currentDir));
    if (currentKey === extensionRootKey)
      return void 0;
    const parent = path6.dirname(currentDir);
    if (parent === currentDir)
      return void 0;
    currentDir = parent;
  }
}
async function hasAgentLevelProjectMarker(extensionRootKey) {
  const agentDir = path6.dirname(extensionRootKey);
  if (!agentDir || agentDir === extensionRootKey)
    return false;
  for (const pattern of [...TS_CONFIG_MARKERS, ...TS_TOOLING_MARKERS]) {
    try {
      await stat(path6.join(agentDir, pattern));
      return true;
    } catch {
    }
  }
  return false;
}
var TypeScriptRoot = withRootMarkers(DenoExcludeRoot(async (file) => {
  const extensionRootKey = piAgentExtensionsRootKey(file);
  if (extensionRootKey) {
    const bounded2 = await findExtensionBoundedRoot(file, extensionRootKey);
    if (bounded2)
      return bounded2;
    if (await hasAgentLevelProjectMarker(extensionRootKey)) {
      return FileDirRoot(file);
    }
    return void 0;
  }
  const projectRoot = await findTypeScriptProjectRoot(file);
  if (projectRoot)
    return projectRoot;
  return FileDirRoot(file);
}), [...TS_CONFIG_MARKERS, ...TS_TOOLING_MARKERS]);
var TypeScriptServer = {
  id: "typescript",
  idleEviction: "transparent",
  role: "language",
  name: "TypeScript Language Server",
  projectLocalCommand: "typescript-language-server",
  extensions: JS_TS_LSP_EXTENSIONS,
  autoPropagateDiagnostics: true,
  root: TypeScriptRoot,
  rootMarkers: TypeScriptRoot.rootMarkers,
  async spawn(root, options) {
    const nativeLsp = await findNativeTypeScriptLsp(root);
    if (nativeLsp && admitProjectSuppliedTsserver(nativeLsp.command, root, true, options?.projectCodeAllowed)) {
      const env2 = await getToolEnvironment();
      logSessionStart(`lsp typescript-native: version=${nativeLsp.version} command=${nativeLsp.command}`);
      const proc2 = await launchLSP(nativeLsp.command, ["--lsp", "--stdio"], {
        cwd: root,
        env: env2
      });
      return { process: proc2, source: "direct", launchVariant: "native-ts7" };
    }
    let source = "direct";
    let lspPath = await findAncestorFileAmong(root, [
      ["node_modules", ".bin", "typescript-language-server.cmd"],
      ["node_modules", ".bin", "typescript-language-server"]
    ]);
    if (!lspPath) {
      lspPath = await ensureTool("typescript-language-server", {
        allowInstall: canInstall(options?.allowInstall)
      });
      if (lspPath)
        source = "managed";
      if (!lspPath) {
        return void 0;
      }
    }
    const tsserverPath = await findTsserverPath(root, options?.allowInstall, options);
    if (!tsserverPath) {
      admitProjectSuppliedTsserver(void 0, root, true, options?.projectCodeAllowed);
      return void 0;
    }
    if (tsserverPath)
      source = "managed";
    const env = await getToolEnvironment();
    const proc = await launchLSP(lspPath, ["--stdio"], {
      cwd: root,
      env: {
        ...env,
        TSSERVER_PATH: tsserverPath
      }
    });
    return {
      process: proc,
      source,
      initialization: tsserverPath ? { tsserver: { path: tsserverPath } } : void 0,
      launchVariant: "classic"
    };
  }
};
var DenoServer = {
  id: "deno",
  idleEviction: "transparent",
  role: "language",
  name: "Deno Language Server",
  fallbackFor: "typescript",
  extensions: JS_TS_LSP_EXTENSIONS,
  autoPropagateDiagnostics: true,
  root: createRootDetector(["deno.json", "deno.jsonc"]),
  async spawn(root, options) {
    return resolveAndLaunch({
      candidates: ["deno"],
      args: ["lsp"],
      cwd: root,
      managedToolId: "deno"
    }, options?.allowInstall);
  }
};
var PythonServer = {
  id: "python",
  idleEviction: "transparent",
  role: "language",
  name: "Pyright Language Server",
  extensions: KIND_EXTENSIONS["python"],
  root: RootWithFallback(createRootDetector([
    ".git",
    "pyproject.toml",
    "setup.py",
    "setup.cfg",
    "requirements.txt",
    "Pipfile",
    "poetry.lock"
  ])),
  async spawn(root, options) {
    const pythonEnvironment = await detectPythonEnvironment(root);
    const env = augmentPythonEnvironment(await getToolEnvironment(), pythonEnvironment);
    let source = "direct";
    const pyrightInit = (pythonPath) => ({
      ...pythonPath ? { pythonPath } : {},
      openFilesOnly: true
    });
    const projectPyright = await resolveAndLaunch({
      candidates: [
        ...pythonEnvironmentToolCandidates(pythonEnvironment, "pyright-langserver"),
        ...nodeBinLocalCandidates(root, "pyright-langserver"),
        ...pythonEnvironmentToolCandidates(pythonEnvironment, "basedpyright-langserver"),
        ...nodeBinLocalCandidates(root, "basedpyright-langserver")
      ],
      args: ["--stdio"],
      cwd: root,
      env
    }, false);
    if (projectPyright) {
      return {
        process: projectPyright.process,
        source: projectPyright.source,
        initialization: pyrightInit(pythonEnvironment?.pythonPath)
      };
    }
    const projectTy = await resolveAndLaunch({
      candidates: pythonEnvironmentToolCandidates(pythonEnvironment, "ty"),
      args: ["server"],
      cwd: root,
      env
    }, false);
    if (projectTy) {
      return { process: projectTy.process, source: projectTy.source };
    }
    const pathPyright = await resolveAndLaunch({
      candidates: ["pyright-langserver", "basedpyright-langserver"],
      args: ["--stdio"],
      cwd: root,
      env
    }, false);
    if (pathPyright) {
      return {
        process: pathPyright.process,
        source: pathPyright.source,
        initialization: pyrightInit(pythonEnvironment?.pythonPath)
      };
    }
    const pathTy = await resolveAndLaunch({
      candidates: ["ty"],
      args: ["server"],
      cwd: root,
      env
    }, false);
    if (pathTy) {
      return { process: pathTy.process, source: pathTy.source };
    }
    const pyrightPath = await ensureTool("pyright", {
      allowInstall: canInstall(options?.allowInstall)
    });
    if (!pyrightPath)
      return void 0;
    source = "managed";
    const binDir = path6.dirname(pyrightPath);
    const isWindows2 = process.platform === "win32";
    const managedCandidates = isWindows2 ? [
      path6.join(binDir, "pyright-langserver.cmd"),
      path6.join(binDir, "pyright-langserver"),
      "pyright-langserver"
    ] : [path6.join(binDir, "pyright-langserver"), "pyright-langserver"];
    const resolved = await resolveAndLaunch({ candidates: managedCandidates, args: ["--stdio"], cwd: root, env }, false);
    if (!resolved)
      return void 0;
    return {
      process: resolved.process,
      source,
      initialization: pyrightInit(pythonEnvironment?.pythonPath)
    };
  }
};
var PythonJediServer = {
  id: "python-jedi",
  idleEviction: "transparent",
  role: "language",
  name: "Jedi Language Server",
  fallbackFor: "python",
  extensions: KIND_EXTENSIONS["python"],
  root: RootWithFallback(createRootDetector([
    ".git",
    "pyproject.toml",
    "setup.py",
    "setup.cfg",
    "requirements.txt",
    "Pipfile",
    "poetry.lock"
  ])),
  async spawn(root, options) {
    const launched = await resolveAndLaunch({
      candidates: ["jedi-language-server"],
      args: [],
      cwd: root,
      managedToolId: "jedi-language-server"
    }, options?.allowInstall);
    if (!launched)
      return void 0;
    const pythonPath = await detectPythonVenv(root);
    return {
      ...launched,
      initialization: pythonPath ? { workspace: { environmentPath: pythonPath } } : {}
    };
  }
};
var GoServer = {
  id: "go",
  idleEviction: "unmeasured",
  role: "language",
  name: "gopls",
  extensions: KIND_EXTENSIONS["go"],
  root: RootWithFallback(WorkspacePriorityRoot([["go.work"], ["go.mod", "go.sum"], [".git"]])),
  async spawn(root, options) {
    const result = await resolveAndLaunch({
      // Canonical-bin discovery (#241): include $GOPATH/bin so a gopls that
      // `go install` dropped there resolves even when it isn't on PATH —
      // which is also the retry target after the runtimeInstall below.
      candidates: goBinCandidates("gopls"),
      args: [],
      cwd: root,
      runtimeInstall: {
        runtimeCommand: "go",
        install: tryGoInstallGopls
      }
    }, options?.allowInstall);
    if (!result)
      return void 0;
    return { ...result, initialization: { ui: { semanticTokens: true } } };
  }
};
function cargoWorkspaceDeclaresMember(workspaceContent, parentDir, childDir) {
  const relativePath = path6.relative(parentDir, childDir).split(path6.sep).join("/");
  if (relativePath === "" || relativePath.startsWith(".."))
    return false;
  const matches = (pattern) => matchesWorkspaceMemberPattern(pattern, relativePath, CARGO_WORKSPACE_MEMBER_DIALECT, () => recordDegradationOnce({
    kind: "workspace-glob-cap",
    subject: String(pattern.length),
    reason: "workspace glob matcher exceeded its memo-table cell cap"
  }));
  const excluded = readCargoWorkspaceExclude(workspaceContent);
  if (excluded.some(matches))
    return false;
  return readCargoWorkspaceMembers(workspaceContent).some(matches);
}
function sessionHoistCeiling(sessionCwd, file) {
  return isSameOrWithin(path6.resolve(sessionCwd), path6.resolve(file)) ? path6.resolve(sessionCwd) : void 0;
}
function RustWorkspaceRoot() {
  const crateRoot = createRootDetector(["Cargo.toml", "Cargo.lock"]);
  return withRootMarkers(async (file) => {
    const root = await crateRoot(file);
    if (!root)
      return void 0;
    const sessionCwd = process.cwd();
    const stop = sessionHoistCeiling(sessionCwd, file);
    let current = root;
    const fsRoot = path6.parse(current).root;
    while (true) {
      if (stop !== void 0 && current === stop)
        break;
      const parent = path6.dirname(current);
      if (parent === current || parent === fsRoot)
        break;
      const parentCargoPath = path6.join(parent, "Cargo.toml");
      const parentCargoContent = await readTextFileOrUndefined(parentCargoPath);
      if (parentCargoContent !== void 0 && hasCargoWorkspaceTable(parentCargoContent)) {
        if (cargoWorkspaceDeclaresMember(parentCargoContent, parent, root)) {
          return enforceLspRootCeiling(parent, sessionCwd, file);
        }
        break;
      }
      current = parent;
    }
    return root;
  }, crateRoot.rootMarkers ?? []);
}
function stripXmlComments(content) {
  let result = content;
  let previous;
  do {
    previous = result;
    result = result.replace(/<!--[\s\S]*?-->/g, "");
  } while (result !== previous);
  return result;
}
async function declaresMavenModule(parentDir, parentPomPath, childDir) {
  try {
    const content = stripXmlComments(await readFile(parentPomPath, "utf-8"));
    const modulesBlock = content.match(/<modules>([\s\S]*?)<\/modules>/);
    if (!modulesBlock)
      return false;
    const resolvedChild = path6.resolve(childDir);
    for (const match of modulesBlock[1].matchAll(/<module>\s*([^<]+?)\s*<\/module>/g)) {
      if (pathsEqual(path6.resolve(parentDir, match[1]), resolvedChild))
        return true;
    }
    return false;
  } catch {
    return false;
  }
}
function JavaWorkspaceRoot() {
  const moduleRoot = createRootDetector([
    "pom.xml",
    "build.gradle",
    ".classpath"
  ]);
  return withRootMarkers(async (file) => {
    const root = await moduleRoot(file);
    if (!root)
      return void 0;
    if (!await markerExists(root, "pom.xml"))
      return root;
    const sessionCwd = process.cwd();
    const stop = sessionHoistCeiling(sessionCwd, file);
    let current = root;
    let lastHop = root;
    const fsRoot = path6.parse(current).root;
    while (true) {
      if (stop !== void 0 && current === stop)
        break;
      const parent = path6.dirname(current);
      if (parent === current || parent === fsRoot)
        break;
      if (await markerExists(parent, "pom.xml")) {
        const parentPom = path6.join(parent, "pom.xml");
        if (!await declaresMavenModule(parent, parentPom, lastHop))
          break;
        current = parent;
        lastHop = parent;
        continue;
      }
      current = parent;
    }
    return enforceLspRootCeiling(lastHop, sessionCwd, file);
  }, moduleRoot.rootMarkers ?? []);
}
var RustServer = {
  id: "rust",
  idleEviction: "unmeasured",
  role: "language",
  // Measured (#3750): rust-analyzer answers an empty result for a detached file.
  requiresProjectRoot: true,
  name: "rust-analyzer",
  executesProjectCode: true,
  extensions: KIND_EXTENSIONS["rust"],
  // No FileDirRoot fallback (#201): rust-analyzer is a heavy workspace server
  // that is useless without a Cargo manifest. With the fallback, every .rs file
  // written before a Cargo.toml exists resolved to its OWN directory as the
  // root, and since clients dedup by `${serverId}:${root}`, each directory
  // spawned a separate rust-analyzer (one per file/dir during scaffolding).
  // Returning undefined here skips the spawn until a Cargo.toml gives a stable,
  // shared crate root — then all files share one server.
  root: RustWorkspaceRoot(),
  async spawn(root, options) {
    const result = await resolveAndLaunch({
      candidates: cargoBinCandidates("rust-analyzer"),
      args: [],
      cwd: root,
      managedToolId: "rust-analyzer"
    }, options?.allowInstall);
    if (!result)
      return void 0;
    return {
      ...result,
      initialization: {
        cargo: { buildScripts: { enable: true } },
        procMacro: { enable: true },
        diagnostics: { enable: true }
      }
    };
  }
};
var RubyServer = {
  id: "ruby",
  idleEviction: "unmeasured",
  role: "language",
  name: "Ruby LSP",
  executesProjectCode: true,
  extensions: KIND_EXTENSIONS["ruby"],
  root: RootWithFallback(PriorityRoot([["Gemfile", ".ruby-version"], [".git"]])),
  // Ruby LSP may need extra time to finish composed-bundle setup before it can
  // answer initialize/documentSymbol on cold start.
  initializeTimeoutMs: 3e4,
  clientWaitTimeoutMs: 3e4,
  async spawn(root, options) {
    const rubylsp = await resolveAndLaunch({
      candidates: ["ruby-lsp", ...rubyBinCandidates("ruby-lsp")],
      args: [],
      cwd: root,
      runtimeInstall: {
        runtimeCommand: "gem",
        install: () => tryGemInstall("ruby-lsp"),
        retryCandidates: ["ruby-lsp", ...rubyBinCandidates("ruby-lsp")]
      }
    }, options?.allowInstall);
    if (rubylsp)
      return rubylsp;
    const solargraph = await resolveAndLaunch({
      candidates: ["solargraph", ...rubyBinCandidates("solargraph")],
      args: ["stdio"],
      cwd: root
    }, false);
    if (solargraph)
      return solargraph;
    return resolveAndLaunch({
      candidates: ["rubocop", ...rubyBinCandidates("rubocop")],
      args: ["--lsp"],
      cwd: root
    }, false);
  }
};
var PHPServer = {
  id: "php",
  idleEviction: "transparent",
  role: "language",
  name: "Intelephense",
  extensions: KIND_EXTENSIONS["php"],
  root: RootWithFallback(createRootDetector(["composer.json", "composer.lock"])),
  async spawn(root, options) {
    const result = await resolveAndLaunch({
      candidates: nodeBinCandidates(root, "intelephense"),
      args: ["--stdio"],
      cwd: root,
      managedToolId: "intelephense"
    }, options?.allowInstall);
    if (!result)
      return void 0;
    return {
      ...result,
      initialization: {
        storagePath: path6.join(getGlobalPiLensDir(), "intelephense")
      }
    };
  }
};
function buildPsesArgs(bundleDir) {
  const script = path6.join(bundleDir, "PowerShellEditorServices", "Start-EditorServices.ps1");
  const sessionDir = path6.join(getGlobalPiLensDir(), "pses", `${process.pid}-${Date.now()}`);
  mkdirSync2(sessionDir, { recursive: true });
  const logPath = path6.join(sessionDir, "pses.log");
  const sessionDetailsPath = path6.join(sessionDir, "session.json");
  return [
    "-NoLogo",
    "-NoProfile",
    "-NonInteractive",
    // Unsigned bundled script + mark-of-the-web on Windows — Bypass so it runs;
    // ignored by non-Windows pwsh.
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    script,
    "-HostName",
    "pi-lens",
    "-HostProfileId",
    "pi-lens",
    "-HostVersion",
    "1.0.0",
    "-BundledModulesPath",
    bundleDir,
    "-LogPath",
    logPath,
    "-LogLevel",
    "Warning",
    "-SessionDetailsPath",
    sessionDetailsPath,
    "-Stdio",
    "-LanguageServiceOnly"
  ];
}
var PowerShellServer = {
  id: "powershell",
  idleEviction: "unmeasured",
  role: "language",
  name: "PowerShell Editor Services",
  executesProjectCode: true,
  extensions: KIND_EXTENSIONS["powershell"],
  // Index at the workspace (script modules reference siblings); fall back to the
  // file dir.
  root: RootWithFallback(createRootDetector([".git"])),
  spawn(root, options) {
    return resolveAndLaunchBundle({
      runtimeCandidates: ["pwsh", "powershell"],
      bundleToolId: "powershell-editor-services",
      cwd: root,
      args: buildPsesArgs
    }, options?.allowInstall);
  }
};
var CSharpServer = {
  id: "csharp",
  idleEviction: "unmeasured",
  role: "language",
  // Documented (#3750): csharp-ls needs a solution or project.
  requiresProjectRoot: true,
  name: "csharp-ls",
  executesProjectCode: true,
  extensions: KIND_EXTENSIONS["csharp"],
  // No FileDirRoot fallback (#201): csharp-ls is a workspace server and should
  // not spawn once per source directory before a .sln/.csproj exists. Glob root
  // markers match real project filenames such as `App.csproj` / `App.sln`
  // (shared marker list — see file-kinds.ts, refs #895).
  root: createRootDetector([...DOTNET_CSHARP_ROOT_MARKERS]),
  async spawn(root, options) {
    const candidates = dotnetToolCandidates("csharp-ls");
    return resolveAndLaunch({
      candidates,
      args: [],
      cwd: root,
      runtimeInstall: {
        runtimeCommand: "dotnet",
        install: () => tryDotnetToolInstall("csharp-ls"),
        retryCandidates: candidates
      }
    }, options?.allowInstall);
  }
};
var OmniSharpServer = createInteractiveServer({
  id: "omnisharp",
  name: "OmniSharp",
  executesProjectCode: true,
  // Documented (#3750): OmniSharp needs a solution or project.
  requiresProjectRoot: true,
  fallbackFor: "csharp",
  extensions: KIND_EXTENSIONS["csharp"],
  root: createRootDetector([...DOTNET_CSHARP_ROOT_MARKERS]),
  language: "csharp",
  command: "OmniSharp",
  args: ["--languageserver"]
});
var FSharpServer = {
  id: "fsharp",
  idleEviction: "unmeasured",
  role: "language",
  // Documented (#3750): FSAutocomplete needs a project.
  requiresProjectRoot: true,
  name: "FSAutocomplete",
  executesProjectCode: true,
  extensions: KIND_EXTENSIONS["fsharp"],
  root: createRootDetector([...DOTNET_FSHARP_ROOT_MARKERS]),
  async spawn(root, options) {
    const candidates = dotnetToolCandidates("fsautocomplete");
    return resolveAndLaunch({
      candidates,
      args: [],
      cwd: root,
      runtimeInstall: {
        runtimeCommand: "dotnet",
        install: () => tryDotnetToolInstall("fsautocomplete"),
        retryCandidates: candidates
      }
    }, options?.allowInstall);
  }
};
var JavaServer = createInteractiveServer({
  id: "java",
  name: "JDT Language Server",
  executesProjectCode: true,
  extensions: KIND_EXTENSIONS["java"],
  root: RootWithFallback(JavaWorkspaceRoot()),
  language: "java",
  command: () => process.env.JDTLS_PATH || "jdtls",
  args: (root) => createLombokJdtlsArgs(root),
  runtime: "java"
});
var KotlinServer = {
  id: "kotlin",
  idleEviction: "unmeasured",
  role: "language",
  name: "Kotlin Language Server",
  executesProjectCode: true,
  extensions: KIND_EXTENSIONS["kotlin"],
  root: RootWithFallback(createRootDetector(["build.gradle.kts", "build.gradle", "pom.xml"])),
  async spawn(root, options) {
    return resolveAndLaunch({
      candidates: ["kotlin-lsp", "kotlin-language-server"],
      args: [],
      cwd: root,
      // #3400: a managed fwcd install when no PATH candidate launches. The
      // managed shim is consulted FIRST, but only exists once no PATH
      // candidate answered, so a PATH `kotlin-lsp` wins on a box that had
      // it before the managed install; one added afterwards does not.
      managedToolId: "kotlin-language-server"
    }, options?.allowInstall);
  }
};
var LeanServer = createInteractiveServer({
  id: "lean",
  name: "Lean 4 Language Server",
  extensions: KIND_EXTENSIONS.lean,
  root: RootWithFallback(createRootDetector([...LEAN_ROOT_MARKERS])),
  language: "lean",
  // Documented (#3750): `lake serve` analyses a file only when a Lake project
  // roots it; a root-fallback empty answer is unconfirmed, not clean.
  requiresProjectRoot: true,
  // `lake serve` loads and interprets the project's `lakefile.lean` and its
  // imported build scripts, so it executes project-owned code: refuse it until
  // the host grants project trust (#4269).
  executesProjectCode: true,
  command: "lake",
  args: ["serve"]
});
var SwiftServer = createInteractiveServer({
  id: "swift",
  name: "SourceKit-LSP",
  executesProjectCode: true,
  extensions: KIND_EXTENSIONS["swift"],
  root: createRootDetector(["Package.swift"]),
  language: "swift",
  command: "sourcekit-lsp"
});
var DartServer = createInteractiveServer({
  id: "dart",
  executesProjectCode: true,
  name: "Dart Analysis Server",
  extensions: KIND_EXTENSIONS["dart"],
  root: RootWithFallback(createRootDetector(["pubspec.yaml"])),
  language: "dart",
  command: "dart",
  args: ["language-server", "--protocol=lsp"]
});
function createTreeBinaryServer(spec) {
  return {
    id: spec.id,
    name: spec.name,
    extensions: spec.extensions,
    idleEviction: spec.idleEviction ?? "unmeasured",
    // The spec declares no role, so the factory applies the stated default
    // (#1488) — see `createInteractiveServer`.
    role: DEFAULT_LSP_SERVER_ROLE,
    root: spec.root,
    spawn(root, options) {
      return resolveAndLaunchTreeBinary({
        candidates: [spec.binaryName],
        bundleToolId: spec.binaryName,
        binRelPath: spec.binRelPath,
        cwd: root,
        args: spec.args ?? []
      }, options?.allowInstall);
    }
  };
}
var LuaServer = createTreeBinaryServer({
  id: "lua",
  name: "Lua Language Server",
  extensions: KIND_EXTENSIONS["lua"],
  root: createRootDetector([".luarc.json", ".luacheckrc"]),
  binaryName: "lua-language-server",
  binRelPath: "bin/lua-language-server"
});
var CppServer = createTreeBinaryServer({
  id: "cpp",
  idleEviction: "transparent",
  name: "clangd",
  extensions: KIND_EXTENSIONS["cxx"],
  root: RootWithFallback(createRootDetector([
    "compile_commands.json",
    ".clangd",
    "CMakeLists.txt",
    "Makefile"
  ])),
  binaryName: "clangd",
  binRelPath: "bin/clangd",
  args: ["--background-index"]
});
var ZigServer = {
  id: "zig",
  executesProjectCode: true,
  idleEviction: "unmeasured",
  role: "language",
  name: "ZLS",
  extensions: KIND_EXTENSIONS["zig"],
  root: RootWithFallback(createRootDetector(["build.zig"])),
  spawn(root, options) {
    return resolveAndLaunch({
      candidates: ["zls"],
      args: [],
      cwd: root,
      managedToolId: "zls"
    }, options?.allowInstall);
  }
};
var HaskellServer = createInteractiveServer({
  id: "haskell",
  name: "Haskell Language Server",
  executesProjectCode: true,
  extensions: KIND_EXTENSIONS["haskell"],
  root: createRootDetector(["stack.yaml", "cabal.project", "*.cabal"]),
  language: "haskell",
  command: "haskell-language-server-wrapper",
  args: ["--lsp"]
});
var ElixirServer = createInteractiveServer({
  id: "elixir",
  name: "ElixirLS",
  executesProjectCode: true,
  extensions: KIND_EXTENSIONS["elixir"],
  root: RootWithFallback(createRootDetector(["mix.exs"])),
  language: "elixir",
  command: "elixir-ls"
});
var ElixirExpertServer = {
  id: "expert",
  idleEviction: "unmeasured",
  role: "language",
  name: "Expert",
  executesProjectCode: true,
  fallbackFor: "elixir",
  extensions: KIND_EXTENSIONS["elixir"],
  root: RootWithFallback(createRootDetector(["mix.exs"])),
  availabilityKey: "expert",
  async spawn(root, options) {
    return resolveAndLaunch({
      candidates: ["expert"],
      args: ["--stdio"],
      cwd: root,
      managedToolId: "expert"
    }, options?.allowInstall);
  },
  autoInstall: async () => Boolean(await ensureTool("expert"))
};
var GleamServer = {
  id: "gleam",
  idleEviction: "unmeasured",
  role: "language",
  name: "Gleam LSP",
  extensions: KIND_EXTENSIONS["gleam"],
  root: RootWithFallback(createRootDetector(["gleam.toml"])),
  async spawn(root, options) {
    return resolveAndLaunch({
      candidates: ["gleam"],
      args: ["lsp"],
      cwd: root,
      managedToolId: "gleam"
    }, options?.allowInstall);
  }
};
var TinymistServer = {
  id: "tinymist",
  executesProjectCode: true,
  idleEviction: "unmeasured",
  role: "language",
  name: "Tinymist",
  extensions: extensionsForLanguage("typst"),
  root: RootWithFallback(createRootDetector(["typst.toml", ".git"])),
  availabilityKey: "tinymist",
  async spawn(root, options) {
    return resolveAndLaunch({
      candidates: ["tinymist"],
      args: ["lsp"],
      cwd: root,
      managedToolId: "tinymist"
    }, options?.allowInstall);
  }
};
var MarksmanServer = {
  id: "marksman",
  idleEviction: "transparent",
  role: "language",
  name: "Marksman",
  extensions: KIND_EXTENSIONS["markdown"],
  // Index at the workspace root so cross-file checks (broken intra-repo links,
  // missing/renamed anchors, heading refs) see the whole tree; fall back to the
  // file's directory when there's no project marker.
  root: RootWithFallback(createRootDetector([".marksman.toml", ".git"])),
  spawn(root, options) {
    return resolveAndLaunch({
      candidates: ["marksman"],
      args: ["server"],
      cwd: root,
      managedToolId: "marksman"
    }, options?.allowInstall);
  }
};
var OCamlServer = createInteractiveServer({
  id: "ocaml",
  executesProjectCode: true,
  name: "ocamllsp",
  extensions: KIND_EXTENSIONS["ocaml"],
  root: createRootDetector(["dune-project", "opam"]),
  language: "ocaml",
  command: "ocamllsp"
});
var ClojureServer = {
  id: "clojure",
  executesProjectCode: true,
  idleEviction: "transparent",
  role: "language",
  name: "Clojure LSP",
  extensions: KIND_EXTENSIONS["clojure"],
  root: createRootDetector(["deps.edn", "project.clj"]),
  async spawn(root, options) {
    return resolveAndLaunch({
      candidates: ["clojure-lsp"],
      args: [],
      cwd: root,
      managedToolId: "clojure-lsp"
    }, options?.allowInstall);
  }
};
var CueServer = {
  id: "cue",
  idleEviction: "unmeasured",
  role: "language",
  name: "CUE Language Server",
  extensions: KIND_EXTENSIONS["cue"],
  root: RootWithFallback(createRootDetector(["cue.mod", ".git"])),
  async spawn(root, options) {
    return resolveAndLaunch({
      candidates: ["cue"],
      args: ["lsp", "serve"],
      cwd: root,
      managedToolId: "cue"
    }, options?.allowInstall);
  }
};
var TerraformServer = {
  id: "terraform",
  executesProjectCode: true,
  idleEviction: "unmeasured",
  role: "language",
  name: "Terraform LSP",
  extensions: KIND_EXTENSIONS["terraform"],
  root: RootWithFallback(createRootDetector([".terraform.lock.hcl", ".terraform"])),
  spawn(root, options) {
    return resolveAndLaunch({
      candidates: ["terraform-ls"],
      args: ["serve"],
      cwd: root,
      managedToolId: "terraform-ls"
    }, options?.allowInstall);
  }
};
var NixServer = createInteractiveServer({
  id: "nix",
  executesProjectCode: true,
  name: "nixd",
  extensions: KIND_EXTENSIONS["nix"],
  root: createRootDetector(["flake.nix"]),
  language: "nix",
  command: "nixd"
});
var BashServer = {
  id: "bash",
  idleEviction: "transparent",
  role: "language",
  name: "Bash Language Server",
  // #3968: narrowed from [".bash", ".sh", ".zsh"] — bash-language-server does
  // not support zsh (its own analyzer refuses the dialect), and its ≥5.7.0
  // lint flow even feeds shebang'd zsh to its embedded shellcheck, importing
  // SC1071-class noise through the LSP lane. `shuck` owns `.zsh` when
  // installed; when it is not, the shellcheck runner's dialect gate keeps
  // zsh quiet instead of falling back to a zsh-illiterate analyzer.
  extensions: [".bash", ".sh"],
  root: FileDirRoot,
  // #2194 bounded the installer's own verification at 20s; the dispatch
  // touch's client-wait floor stayed at the shared 5s default, so a cold
  // spawn could still race that budget and read as unavailable even after
  // installer verification cleared it. Match the installer bound (#2169).
  // `initializeTimeoutMs` matches it too: the measured cold start
  // (9,667ms, #2194) has headroom under the unraised 15s default, but
  // leaving the two fields mismatched is the same latent shape that made
  // the Prisma/Vue raise a no-op (fix-round F1, #2233) — a slower host
  // than the one measured would still hit the 15s inner kill despite the
  // caller being willing to wait 20s. Equalizing costs nothing on the
  // success path and removes the mismatch outright.
  clientWaitTimeoutMs: 2e4,
  initializeTimeoutMs: 2e4,
  spawn(root, options) {
    return resolveAndLaunch({
      candidates: nodeBinCandidates(root, "bash-language-server"),
      args: ["start"],
      cwd: root,
      managedToolId: "bash-language-server"
    }, options?.allowInstall);
  }
};
var ShuckServer = createInteractiveServer({
  id: "shuck",
  name: "Shuck",
  extensions: [".zsh"],
  root: FileDirRoot,
  language: "shell",
  command: "shuck",
  args: ["server"]
});
var FishServer = {
  id: "fish",
  idleEviction: "transparent",
  role: "language",
  name: "Fish Language Server",
  extensions: KIND_EXTENSIONS["fish"],
  root: RootWithFallback(createRootDetector([".git"])),
  spawn(root, options) {
    return resolveAndLaunch({
      candidates: nodeBinCandidates(root, "fish-lsp"),
      args: ["start", "--stdio"],
      cwd: root,
      managedToolId: "fish-lsp"
    }, options?.allowInstall);
  }
};
var CMakeServer = {
  id: "cmake",
  executesProjectCode: true,
  idleEviction: "unmeasured",
  role: "language",
  name: "CMake Language Server",
  // CMake's canonical project file has no .cmake suffix. The configured-server
  // matcher supports exact basenames as well as extensions.
  extensions: [...KIND_EXTENSIONS["cmake"], "CMakeLists.txt"],
  root: RootWithFallback(createRootDetector(["CMakeLists.txt", ".git"])),
  spawn(root, options) {
    return resolveAndLaunch({
      candidates: ["cmake-language-server"],
      args: [],
      cwd: root,
      managedToolId: "cmake-language-server"
    }, options?.allowInstall);
  }
};
var DockerServer = {
  id: "docker",
  idleEviction: "transparent",
  role: "language",
  name: "Dockerfile Language Server",
  extensions: [".dockerfile", "Dockerfile"],
  root: RootWithFallback(PriorityRoot([
    [
      "docker-compose.yml",
      "docker-compose.yaml",
      "compose.yml",
      "compose.yaml"
    ],
    [".git"]
  ])),
  spawn(root, options) {
    return resolveAndLaunch({
      candidates: nodeBinCandidates(root, "docker-langserver"),
      args: ["--stdio"],
      cwd: root,
      managedToolId: "dockerfile-language-server-nodejs"
    }, options?.allowInstall);
  }
};
var DockerOfficialServer = {
  id: "docker-official",
  idleEviction: "unmeasured",
  role: "language",
  name: "Docker Language Server (official)",
  fallbackFor: "docker",
  extensions: [".dockerfile", "Dockerfile"],
  root: RootWithFallback(PriorityRoot([
    [
      "docker-compose.yml",
      "docker-compose.yaml",
      "compose.yml",
      "compose.yaml"
    ],
    [".git"]
  ])),
  spawn(root, options) {
    return resolveAndLaunch({
      candidates: nodeBinCandidates(root, "docker-language-server"),
      args: ["start", "--stdio"],
      cwd: root
    }, options?.allowInstall);
  }
};
var YamlServer = {
  id: "yaml",
  idleEviction: "transparent",
  role: "language",
  name: "YAML Language Server",
  extensions: KIND_EXTENSIONS["yaml"],
  root: RootWithFallback(PriorityRoot([
    [".yamllint", "yamllint.yml", "yamllint.yaml", "pyproject.toml"],
    [".git"]
  ])),
  spawn(root, options) {
    return resolveAndLaunch({
      candidates: nodeBinCandidates(root, "yaml-language-server"),
      args: ["--stdio"],
      cwd: root,
      managedToolId: "yaml-language-server"
    }, options?.allowInstall);
  }
};
var JsonServer = {
  id: "json",
  idleEviction: "transparent",
  role: "language",
  name: "VSCode JSON Language Server",
  extensions: KIND_EXTENSIONS["json"],
  root: RootWithFallback(WorkspacePriorityRoot([
    ["package.json", "tsconfig.json", "jsconfig.json"],
    [".git"]
  ])),
  // See BashServer above: the installer's 20s verification bound (#2194)
  // does not, on its own, raise the dispatch touch's cold-spawn wait floor.
  // Mirror it here so a cold spawn cannot lose that race either (#2169).
  // `initializeTimeoutMs` matches it for the same reason as BashServer
  // above (fix-round F1, #2233).
  clientWaitTimeoutMs: 2e4,
  initializeTimeoutMs: 2e4,
  spawn(root, options) {
    return resolveAndLaunch({
      candidates: ["vscode-json-language-server"],
      args: ["--stdio"],
      cwd: root,
      managedToolId: "vscode-json-language-server"
    }, options?.allowInstall);
  }
};
var HtmlServer = {
  id: "html",
  idleEviction: "transparent",
  role: "language",
  name: "VSCode HTML Language Server",
  extensions: KIND_EXTENSIONS["html"],
  root: RootWithFallback(IgnoreHomeRoot(PriorityRoot([["package.json", "index.html", "vite.config.ts"]]))),
  spawn(root, options) {
    return resolveAndLaunch({
      candidates: nodeBinCandidates(root, "vscode-html-language-server"),
      args: ["--stdio"],
      cwd: root,
      managedToolId: "vscode-html-languageserver-bin"
    }, options?.allowInstall);
  }
};
var TomlServer = {
  id: "toml",
  idleEviction: "unmeasured",
  role: "language",
  name: "Taplo",
  extensions: KIND_EXTENSIONS["toml"],
  root: RootWithFallback(PriorityRoot([["pyproject.toml", "Cargo.toml", "taplo.toml"], [".git"]])),
  spawn(root, options) {
    return resolveAndLaunch({
      candidates: ["taplo"],
      args: ["lsp", "stdio"],
      cwd: root,
      managedToolId: "taplo"
    }, options?.allowInstall);
  }
};
var PrismaServer = {
  id: "prisma",
  idleEviction: "transparent",
  role: "language",
  name: "Prisma Language Server",
  extensions: KIND_EXTENSIONS["prisma"],
  root: RootWithFallback(createRootDetector(["prisma/schema.prisma", "schema.prisma"])),
  // Matches the installer's 40s verification bound above (#2169): the
  // dispatch touch's cold-spawn wait floor defaults to 5s and would
  // otherwise time the client out well before the binary answers.
  // `initializeTimeoutMs` MUST be set alongside it (RubyServer's own
  // precedent below): unset, it falls back to the 15s
  // `INITIALIZE_TIMEOUT_MS` default in `clients/lsp/client.ts`, which
  // hard-kills the child mid-handshake — a real cold Prisma run measured
  // up to 27.3s, so the spawn would die there before this wait ever gets
  // a chance to matter (fix-round F1, #2233).
  clientWaitTimeoutMs: 4e4,
  initializeTimeoutMs: 4e4,
  spawn(root, options) {
    return resolveAndLaunch({
      candidates: nodeBinCandidates(root, "prisma-language-server"),
      args: ["--stdio"],
      cwd: root,
      managedToolId: "@prisma/language-server"
    }, options?.allowInstall);
  }
};
var VueServer = {
  id: "vue",
  executesProjectCode: true,
  idleEviction: "unmeasured",
  role: "language",
  name: "Vue Language Server",
  extensions: [".vue"],
  root: RootWithFallback(IgnoreHomeRoot(createRootDetector([
    "package.json",
    "package-lock.json",
    "bun.lockb",
    "bun.lock",
    "pnpm-lock.yaml",
    "yarn.lock"
  ]))),
  // Vue's launcher loads the full language-service bundle before answering,
  // matching the installer's 30s verification bound (#2176). The dispatch
  // touch's cold-spawn wait floor defaults to 5s and needs the same raise so
  // a cold spawn cannot time out there instead. `initializeTimeoutMs` MUST
  // match: unset, it falls back to the 15s default in `clients/lsp/client.ts`
  // and hard-kills a cold spawn (measured up to 22.6s in #2188, 16.2s here)
  // mid-handshake before this wait can matter (fix-round F1, #2233).
  clientWaitTimeoutMs: 3e4,
  initializeTimeoutMs: 3e4,
  async spawn(root, options) {
    const tsserverPath = await findTsserverPath(root, options?.allowInstall, options);
    const hasPackageJson = existsSync3(path6.join(root, "package.json"));
    const hasNodeModules = existsSync3(path6.join(root, "node_modules"));
    if (hasPackageJson && !hasNodeModules) {
      logSessionStart(`lsp vue: node_modules missing in ${root} \u2014 Vue navigation may be limited. Run: npm install (or pnpm/yarn install) in this project.`);
    }
    const proc = await resolveAndLaunch({
      candidates: nodeBinCandidates(root, "vue-language-server"),
      args: ["--stdio"],
      cwd: root,
      managedToolId: "@vue/language-server"
    }, options?.allowInstall);
    if (!proc)
      return void 0;
    return {
      process: proc.process,
      source: proc.source,
      initialization: tsserverPath ? { typescript: { tsdk: path6.dirname(tsserverPath) } } : void 0
    };
  }
};
var SvelteServer = {
  id: "svelte",
  executesProjectCode: true,
  idleEviction: "unmeasured",
  role: "language",
  name: "Svelte Language Server",
  extensions: [".svelte"],
  root: RootWithFallback(IgnoreHomeRoot(createRootDetector([
    "package.json",
    "package-lock.json",
    "bun.lockb",
    "bun.lock",
    "pnpm-lock.yaml",
    "yarn.lock"
  ]))),
  // Matches the installer's 20s verification bound above (#2169): the
  // dispatch touch's cold-spawn wait floor defaults to 5s and would
  // otherwise time the client out well before the binary answers.
  // `initializeTimeoutMs` matches it for the same reason as BashServer
  // above (fix-round F1, #2233).
  clientWaitTimeoutMs: 2e4,
  initializeTimeoutMs: 2e4,
  async spawn(root, options) {
    const tsserverPath = await findTsserverPath(root, options?.allowInstall, options);
    const proc = await resolveAndLaunch({
      candidates: [
        ...nodeBinCandidates(root, "svelteserver"),
        ...nodeBinCandidates(root, "svelte-language-server")
      ],
      args: ["--stdio"],
      cwd: root,
      managedToolId: "svelte-language-server"
    }, options?.allowInstall);
    if (!proc)
      return void 0;
    return {
      process: proc.process,
      source: proc.source,
      initialization: tsserverPath ? { typescript: { tsdk: path6.dirname(tsserverPath) } } : void 0
    };
  }
};
var CssServer = {
  id: "css",
  idleEviction: "transparent",
  role: "language",
  name: "CSS Language Server",
  extensions: KIND_EXTENSIONS["css"],
  root: RootWithFallback(IgnoreHomeRoot(PriorityRoot([
    [
      "package.json",
      "postcss.config.js",
      "tailwind.config.js",
      "vite.config.ts"
    ]
  ]))),
  spawn(root, options) {
    return resolveAndLaunch({
      candidates: nodeBinCandidates(root, "vscode-css-language-server"),
      args: ["--stdio"],
      cwd: root,
      managedToolId: "vscode-css-languageserver"
    }, options?.allowInstall);
  }
};
var OPENGREP_KINDS = [
  "csharp",
  "css",
  "cxx",
  "dart",
  "docker",
  "go",
  "html",
  "java",
  "json",
  "jsts",
  "kotlin",
  "lua",
  "php",
  "python",
  "ruby",
  "rust",
  "shell",
  "swift",
  "terraform",
  "yaml"
];
var OPENGREP_EXTENSIONS = Array.from(new Set(OPENGREP_KINDS.flatMap((k) => KIND_EXTENSIONS[k] ?? [])));
function opengrepInitialization(root) {
  const resolved = resolveOpengrepConfig(root, { enabled: true });
  return {
    scan: {
      configuration: [resolved.configArg ?? "auto"],
      onlyGitDirty: false,
      jobs: 16
    },
    metrics: { enabled: false },
    doHover: false
  };
}
var OpengrepServer = {
  id: "opengrep",
  idleEviction: "transparent",
  role: "auxiliary",
  name: "Opengrep Security Scanner",
  extensions: OPENGREP_EXTENSIONS,
  // Stable per-repo root so ONE warm server serves the whole project (a
  // per-directory root would spawn a fresh server — and re-pay rule load —
  // for every folder).
  root: RootWithFallback(NearestRoot([".git"]), async () => process.cwd()),
  availabilityKey: "opengrep",
  // Rule compilation can take a few seconds on the first scan of a session.
  initializeTimeoutMs: 15e3,
  async spawn(root, options) {
    const launched = await resolveAndLaunch({
      candidates: ["opengrep"],
      args: ["lsp", "--experimental"],
      cwd: root,
      managedToolId: "opengrep"
    }, options?.allowInstall);
    if (!launched)
      return void 0;
    return { ...launched, initialization: opengrepInitialization(root) };
  },
  autoInstall: async () => Boolean(await ensureTool("opengrep"))
};
var AST_GREP_KINDS = [
  "csharp",
  "cxx",
  "css",
  "elixir",
  "go",
  "haskell",
  "html",
  "java",
  "json",
  "jsts",
  "kotlin",
  "lua",
  "nix",
  "php",
  "python",
  "ruby",
  "rust",
  "scala",
  "shell",
  "swift",
  "yaml"
];
var AST_GREP_EXTENSIONS = Array.from(new Set(AST_GREP_KINDS.flatMap((k) => KIND_EXTENSIONS[k] ?? [])));
var AstGrepServer = {
  id: "ast-grep",
  idleEviction: "unmeasured",
  role: "auxiliary",
  name: "ast-grep structural linter",
  extensions: AST_GREP_EXTENSIONS,
  // Attaches everywhere (#239 Phase 2): prefer a project `sgconfig.y[a]ml` root,
  // else the repo root (.git) or cwd — like Opengrep. When there's no project
  // sgconfig the spawn launches with `--config <shipped baseline>` so the team's
  // rules still run; the napi runner steps aside when this server is available
  // (it falls back to napi when the ast-grep binary is absent — Gate B).
  root: RootWithFallback(createRootDetector(["sgconfig.yml", "sgconfig.yaml"]), RootWithFallback(NearestRoot([".git"]), async () => process.cwd())),
  availabilityKey: "ast-grep",
  // #1714: the one auxiliary with a measured wedge ceiling. A `lens_diagnostics
  // mode=full` sweep of 225 files drove this server into an unrecoverable stall
  // twice in two exposures (writes outstanding 5.9 s and 9.4 s, then a forced
  // shutdown that timed out both the request and the exit notify). It re-parses
  // the whole file on every didOpen, so it absorbs a sweep more slowly than the
  // other scanners — hold it to half the shared default.
  notifyInflightLimit: 4,
  // #1722, measured against the real binary over 30 repository files rather
  // than assumed: ast-grep-lsp is tower-lsp-server and drains its message
  // stream in order on one task, so the notify barrier's round-trip proves
  // the backlog was scanned. Declared here because the barrier's soundness
  // rests on it (#1756 stage 1); the evidence table is on
  // `LspReplyOrdering`.
  replyOrdering: "single-task-ordered",
  // First scan of a session compiles the rules.
  initializeTimeoutMs: 15e3,
  async spawn(root, options) {
    const projectSgconfig = findLocalSgconfig(root);
    let args = ["lsp"];
    if (!projectSgconfig) {
      const baseline = resolveBaselineSgconfig(root);
      if (baseline)
        args = ["lsp", "--config", baseline];
    }
    const nativeExe = resolveAstGrepNativeExe();
    const candidates = nativeExe ? [nativeExe, "ast-grep"] : ["ast-grep"];
    return resolveAndLaunch({
      candidates,
      args,
      cwd: root,
      managedToolId: "ast-grep"
    }, options?.allowInstall);
  },
  autoInstall: async () => Boolean(await ensureTool("ast-grep"))
};
var ZIZMOR_EXTENSIONS = KIND_EXTENSIONS["yaml"];
var ZizmorServer = {
  id: "zizmor",
  idleEviction: "unmeasured",
  role: "auxiliary",
  name: "zizmor Actions Security Scanner",
  extensions: ZIZMOR_EXTENSIONS,
  pathFilter: isZizmorAuditTarget,
  // Stable per-repo root so ONE warm server serves the whole project (like
  // Opengrep) — config + workflow discovery is repo-relative.
  root: RootWithFallback(NearestRoot([".git"]), async () => process.cwd()),
  availabilityKey: "zizmor",
  async spawn(root, options) {
    const ghToken = await resolveZizmorGitHubToken();
    return resolveAndLaunch({
      candidates: ["zizmor"],
      args: ["--lsp"],
      cwd: root,
      managedToolId: "zizmor",
      ...ghToken ? { env: { GH_TOKEN: ghToken } } : {}
    }, options?.allowInstall);
  },
  autoInstall: async () => Boolean(await ensureTool("zizmor"))
};
var TYPOS_EXTENSIONS = Array.from(/* @__PURE__ */ new Set([...OPENGREP_EXTENSIONS, ...KIND_EXTENSIONS["markdown"]]));
function typosInitialization(root) {
  const localConfig = findLocalTyposConfig(root);
  if (localConfig) {
    logLatency({
      type: "phase",
      phase: "typos_config_resolved",
      filePath: root,
      durationMs: 0,
      metadata: { mode: "project_config", configPath: localConfig }
    });
    logSessionStart(`typos config resolved mode=project_config configPath=${localConfig}`);
    return void 0;
  }
  const configPath = resolvePackagePath(import.meta.url, "rules", "typos", "_typos.toml");
  logLatency({
    type: "phase",
    phase: "typos_config_resolved",
    filePath: root,
    durationMs: 0,
    metadata: { mode: "injected_default", configPath }
  });
  logSessionStart(`typos config resolved mode=injected_default configPath=${configPath}`);
  return { config: configPath };
}
var TyposServer = {
  id: "typos",
  idleEviction: "unmeasured",
  role: "auxiliary",
  name: "typos Spell Checker",
  extensions: TYPOS_EXTENSIONS,
  // Stable per-repo root so ONE warm server serves the whole project (like the
  // other auxiliaries) — typos.toml discovery is repo-relative.
  root: RootWithFallback(NearestRoot([".git"]), async () => process.cwd()),
  availabilityKey: "typos-lsp",
  async spawn(root, options) {
    const launched = await resolveAndLaunch({
      candidates: ["typos-lsp"],
      args: [],
      cwd: root,
      managedToolId: "typos-lsp"
    }, options?.allowInstall);
    if (!launched)
      return void 0;
    const initialization = typosInitialization(root);
    return initialization ? { ...launched, initialization } : launched;
  },
  autoInstall: async () => Boolean(await ensureTool("typos-lsp"))
};
var LSP_SERVERS = [
  TypeScriptServer,
  DenoServer,
  PythonServer,
  // pyright / basedpyright — preferred; openFilesOnly avoids cold-start; ty (#717) is a local-only opt-in fallback
  PythonJediServer,
  // fallback when neither pyright nor basedpyright is available
  GoServer,
  RustServer,
  RubyServer,
  PHPServer,
  PowerShellServer,
  // PowerShell Editor Services — pwsh-bootstrapped module bundle (#278)
  CSharpServer,
  OmniSharpServer,
  FSharpServer,
  JavaServer,
  KotlinServer,
  LeanServer,
  SwiftServer,
  DartServer,
  LuaServer,
  CppServer,
  ZigServer,
  HaskellServer,
  ElixirServer,
  ElixirExpertServer,
  GleamServer,
  TinymistServer,
  MarksmanServer,
  OCamlServer,
  ClojureServer,
  CueServer,
  TerraformServer,
  NixServer,
  BashServer,
  ShuckServer,
  FishServer,
  CMakeServer,
  DockerServer,
  DockerOfficialServer,
  // alternate of docker; acquired only when docker declines (#3939)
  YamlServer,
  JsonServer,
  HtmlServer,
  TomlServer,
  PrismaServer,
  // Web frameworks & styling
  VueServer,
  SvelteServer,
  CssServer,
  // Auxiliary (cross-cutting, diagnostic-only) servers go last — never primary.
  OpengrepServer,
  AstGrepServer,
  ZizmorServer,
  TyposServer
];
function getServerById(id) {
  return LSP_SERVERS.find((server) => server.id === id);
}

// dist/clients/lsp/session-roots.js
import path7 from "node:path";
var SESSION_ROOT_CAP = 128;
var sessionRoots = new BoundedFifoMap(SESSION_ROOT_CAP);
function noteEvictedRoots(evicted) {
  const roots = evicted.map(([root]) => root);
  if (roots.length > 0) {
    incrementDegradationCount({
      kind: "lsp-session-root-evicted",
      subject: `cap=${SESSION_ROOT_CAP}`,
      reason: `session root registry at capacity; will load the dropped root again on the next session start or tool call naming it (dropped: ${roots[0]})`
    });
  }
  return roots;
}
function registerSessionRoot(cwd) {
  const root = path7.resolve(cwd);
  if (sessionRoots.has(root))
    return [];
  return noteEvictedRoots(sessionRoots.set(root, void 0));
}
function setSessionRootConfig(cwd, config) {
  return noteEvictedRoots(sessionRoots.set(path7.resolve(cwd), config));
}
function sessionRootConfigEntries() {
  return sessionRoots;
}
function isSessionRootRegistered(cwd) {
  return sessionRoots.has(path7.resolve(cwd));
}
function shouldInitializeSessionRoot(cwd, readyRoots) {
  const normalized = path7.resolve(cwd);
  return !readyRoots.has(normalized) || !isSessionRootRegistered(normalized);
}
function isOutsideAllSessionRoots(filePath) {
  if (sessionRoots.size === 0)
    return false;
  const resolved = path7.resolve(filePath);
  for (const root of sessionRoots.keys()) {
    if (isSameOrWithin(root, resolved))
      return false;
  }
  return true;
}
function getSessionRootsForTelemetry(limit = 4) {
  return [...sessionRoots.keys()].sort((a, b) => Number(a > b) - Number(a < b)).slice(0, limit);
}

export {
  findLocalTyposConfig,
  getAstGrepRuleSources,
  getAstGrepRuleFingerprint,
  isAuxiliary,
  serverTraits,
  registerRunnerId,
  withLspProjectCodePermission,
  refuseUntrustedLspExecution,
  resolveAnalysisRootPath,
  resolveAnalysisRoot,
  canWriteAnalysisRoot,
  BUILTIN_SERVER_RUNNER_COVERS,
  describeRootFallback,
  resolveLspServerCwd,
  resetLSPCaseSensitivityState,
  isSameOrWithin,
  enforceLspRootCeiling,
  hasProjectBoundaryMarker,
  resetLspLaunchAvailabilityGeneration,
  resetDirectLspCommandAvailability,
  isDirectLspCommandTemporarilyUnavailable,
  resetClassicTsRepairGuard,
  LSP_SERVERS,
  getServerById,
  shouldInitializeSessionRoot,
  isOutsideAllSessionRoots,
  getSessionRootsForTelemetry,
  loadLSPConfig,
  customServerSpecsOf,
  lspConfigOf,
  registerLSPConfig,
  initLSPConfig,
  explainServersForFile,
  getServersForFileWithConfig,
  primaryServerId,
  resolveLspCwdForFile,
  getServerInitOverride,
  getStrategy,
  classifyServerWaitTier,
  classifyCascadeWaitTier
};
