import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  parseJsonc
} from "./chunk-7ANZ7XDD.js";
import {
  extractTomlTableSection,
  hasTomlTable,
  parseTomlScalarString,
  parseTomlStringArray
} from "./chunk-WC6WRNQT.js";
import {
  resolveLanguage
} from "./chunk-PPKECBPP.js";
import {
  getProjectTrustState
} from "./chunk-JE6HKLC7.js";
import {
  incrementDegradationCount,
  recordDegradationOnce
} from "./chunk-2453RRJ2.js";
import {
  logExtension
} from "./chunk-WQV6BI4Q.js";
import {
  logLatency
} from "./chunk-565VRUP4.js";
import {
  UV_WORKSPACE_EXCLUDE_DIALECT,
  UV_WORKSPACE_MEMBERS_DIALECT,
  matchesWorkspaceMemberPattern,
  realpathOrResolve,
  relativeInside,
  walkUpDirs
} from "./chunk-GMROJJRN.js";

// dist/clients/bounded-telemetry.js
var MAX_TRACKED_TURN_CAPS = 64;
var turnCounts = /* @__PURE__ */ new Map();
var latestCountedTurnIndex;
var retiredThroughTurnIndex = Number.NEGATIVE_INFINITY;
function admitBounded(phase, identity, options = {}) {
  try {
    let isRisingEdge = true;
    if (options.ledgerKind !== void 0) {
      isRisingEdge = incrementDegradationCount({
        kind: options.ledgerKind,
        subject: identity,
        reason: options.reason ?? phase
      });
    }
    if (options.risingEdgePer !== void 0 && !isRisingEdge)
      return false;
    return admitAgainstTurnCap(phase, options.capPerTurn);
  } catch {
    return true;
  }
}
function emitBounded(phase, identity, payload, options = {}) {
  try {
    if (!admitBounded(phase, identity, options))
      return false;
    logLatency({
      ...payload,
      type: payload.type ?? "phase",
      phase,
      // `filePath` is what existing latency.log queries filter on, so a site
      // may keep a coarser one; `metadata.identity` below always carries the
      // full discriminating identity. Aggregation that loses WHICH subject
      // is stuck is the failure AGENTS.md names.
      filePath: payload.filePath ?? identity,
      metadata: { ...payload.metadata, identity }
    });
    return true;
  } catch {
    return false;
  }
}
function admitAgainstTurnCap(phase, cap) {
  if (cap === void 0)
    return true;
  if (cap.turnIndex <= retiredThroughTurnIndex)
    return false;
  let counts = turnCounts.get(cap.turnIndex);
  if (!counts) {
    if (turnCounts.size >= MAX_TRACKED_TURN_CAPS) {
      const oldestTrackedTurn = Math.min(...turnCounts.keys());
      if (cap.turnIndex < oldestTrackedTurn)
        return false;
      turnCounts.delete(oldestTrackedTurn);
      retiredThroughTurnIndex = Math.max(retiredThroughTurnIndex, oldestTrackedTurn);
    }
    counts = /* @__PURE__ */ new Map();
    turnCounts.set(cap.turnIndex, counts);
  }
  latestCountedTurnIndex = Math.max(latestCountedTurnIndex ?? cap.turnIndex, cap.turnIndex);
  const used = counts.get(phase) ?? 0;
  if (used >= cap.limit)
    return false;
  counts.set(phase, used + 1);
  return true;
}
function resetBoundedTelemetry() {
  turnCounts = /* @__PURE__ */ new Map();
  latestCountedTurnIndex = void 0;
  retiredThroughTurnIndex = Number.NEGATIVE_INFINITY;
}

// dist/clients/python-environment.js
import { access, readFile } from "node:fs/promises";
import os from "node:os";
import path, { dirname, join } from "node:path";
var UV_WORKSPACE_TABLE = "tool\\.uv\\.workspace";
async function findUvWorkspace(startDir, homeDir) {
  let walkStart;
  let nearestProject;
  for (const dir of walkUpDirs(startDir, { homeDir })) {
    walkStart ??= dir;
    let content;
    try {
      content = await readFile(path.join(dir, "pyproject.toml"), "utf8");
    } catch {
      continue;
    }
    if (!nearestProject)
      nearestProject = dir;
    if (hasTomlTable(content, UV_WORKSPACE_TABLE)) {
      const workspaceTable = extractTomlTableSection(content, UV_WORKSPACE_TABLE);
      return {
        root: dir,
        explicit: true,
        projectRoot: nearestProject,
        isStartDir: nearestProject === walkStart,
        members: parseTomlStringArray(workspaceTable, "members"),
        exclude: parseTomlStringArray(workspaceTable, "exclude")
      };
    }
  }
  return nearestProject ? {
    root: nearestProject,
    explicit: false,
    projectRoot: nearestProject,
    isStartDir: nearestProject === walkStart,
    members: [],
    exclude: []
  } : void 0;
}
function isUvWorkspaceMember(workspace, projectRoot) {
  const relative = relativeInside(workspace.root, projectRoot);
  if (!relative)
    return false;
  const matches = (dialect) => (pattern) => matchesWorkspaceMemberPattern(pattern, relative, dialect, () => recordDegradationOnce({
    kind: "workspace-glob-cap",
    subject: String(pattern.length),
    reason: "workspace glob matcher exceeded its memo-table cell cap"
  }));
  return !workspace.exclude.some(matches(UV_WORKSPACE_EXCLUDE_DIALECT)) && workspace.members.some(matches(UV_WORKSPACE_MEMBERS_DIALECT));
}
var PROJECT_SOURCED_PYTHON_SOURCES = /* @__PURE__ */ new Set([
  "project-dot-venv",
  "project-venv",
  "uv-workspace"
]);
var PROJECT_VENV_DIRS = [
  { dir: ".venv", source: "project-dot-venv" },
  { dir: "venv", source: "project-venv" }
];
var PROJECT_VENV_DIR_NAMES = PROJECT_VENV_DIRS.map((venv) => venv.dir);
var AMBIENT_ENVIRONMENT_VARIABLES = {
  "uv-project-environment": "UV_PROJECT_ENVIRONMENT",
  "virtual-env": "VIRTUAL_ENV",
  conda: "CONDA_PREFIX"
};
function hasAmbientPythonEnvironment(env = process.env) {
  return Object.values(AMBIENT_ENVIRONMENT_VARIABLES).some((name) => Boolean(env[name]));
}
async function detectPythonEnvironment(projectRoot, homeDir = os.homedir(), options = {}) {
  const root = realpathOrResolve(projectRoot);
  const uvWorkspace = await findUvWorkspace(root, homeDir);
  const isProjectRoot = uvWorkspace?.isStartDir === true;
  const memberWorkspaceRoot = isProjectRoot && uvWorkspace.explicit && isUvWorkspaceMember(uvWorkspace, root) ? uvWorkspace.root : void 0;
  const uvEnvironmentRoot = isProjectRoot ? memberWorkspaceRoot ?? uvWorkspace.projectRoot : void 0;
  const uvProjectEnvironment = process.env.UV_PROJECT_ENVIRONMENT;
  const allowAmbient = options.allowAmbient ?? true;
  const isWithinProjectRoot = (candidateRoot) => {
    return relativeInside(root, realpathOrResolve(candidateRoot)) !== void 0;
  };
  const candidates = [
    ...uvEnvironmentRoot !== void 0 && uvProjectEnvironment ? [
      {
        // `path.resolve` leaves an absolute value untouched and
        // anchors a relative one at the project's workspace root.
        root: path.resolve(uvEnvironmentRoot, uvProjectEnvironment),
        source: "uv-project-environment"
      }
    ] : [],
    ...memberWorkspaceRoot !== void 0 ? [
      {
        root: path.join(memberWorkspaceRoot, ".venv"),
        source: "uv-workspace"
      }
    ] : [],
    { root: process.env.VIRTUAL_ENV, source: "virtual-env" },
    { root: process.env.CONDA_PREFIX, source: "conda" },
    ...PROJECT_VENV_DIRS.map((venv) => ({
      root: path.join(root, venv.dir),
      source: venv.source
    }))
  ];
  for (const candidate of candidates) {
    if (!candidate.root)
      continue;
    if (!allowAmbient && candidate.source in AMBIENT_ENVIRONMENT_VARIABLES && !isWithinProjectRoot(candidate.root))
      continue;
    if (PROJECT_SOURCED_PYTHON_SOURCES.has(candidate.source) && getProjectTrustState() !== "trusted") {
      if (recordDegradationOnce({
        kind: "trust-refusal",
        subject: `python-environment:${candidate.root}`,
        reason: `project Python environment refused: pi project trust is ${getProjectTrustState()}`
      })) {
        logExtension({
          subsystem: "project-trust",
          level: "warn",
          message: "project Python environment refused: mark the project trusted in pi or upgrade pi",
          metadata: { source: candidate.source }
        });
      }
      continue;
    }
    const binDir = path.join(candidate.root, process.platform === "win32" ? "Scripts" : "bin");
    const pythonPath = path.join(binDir, process.platform === "win32" ? "python.exe" : "python");
    try {
      await access(pythonPath);
      return {
        root: candidate.root,
        binDir,
        pythonPath,
        source: candidate.source
      };
    } catch {
    }
  }
  return void 0;
}
function augmentPythonEnvironment(baseEnvironment, environment) {
  if (!environment)
    return baseEnvironment;
  const inheritedPath = baseEnvironment.PATH ?? baseEnvironment.Path ?? baseEnvironment.path ?? "";
  const augmentedPath = inheritedPath ? `${environment.binDir}${path.delimiter}${inheritedPath}` : environment.binDir;
  const childEnvironment = {
    ...baseEnvironment,
    PATH: augmentedPath,
    VIRTUAL_ENV: environment.root
  };
  if (process.platform === "win32")
    childEnvironment.Path = augmentedPath;
  return childEnvironment;
}
function pythonEnvironmentToolCandidates(environment, command) {
  if (!environment)
    return [];
  if (process.platform !== "win32") {
    return [path.join(environment.binDir, command)];
  }
  return [
    path.join(environment.binDir, `${command}.exe`),
    path.join(environment.binDir, `${command}.cmd`),
    path.join(environment.binDir, command)
  ];
}
var PYTHON_DECLARATION_CONCURRENCY = 8;
var PYTHON_COMPILE_VERDICT_SERVER_ID = "python-jedi";
var PYTHON_COMPILE_VERDICT_FLOOR = { major: 3, minor: 14 };
function isJediCompileVerdict(diagnostic) {
  const server = diagnostic.serverId ?? diagnostic.tool;
  const source = diagnostic.source ?? diagnostic.rule?.split(":")[0];
  return server === PYTHON_COMPILE_VERDICT_SERVER_ID && source === "compile";
}
function isJediCompileVerdictOutranked(diagnostic, declared) {
  if (declared === void 0)
    return false;
  if (!isJediCompileVerdict(diagnostic))
    return false;
  return declared.major > PYTHON_COMPILE_VERDICT_FLOOR.major || declared.major === PYTHON_COMPILE_VERDICT_FLOOR.major && declared.minor >= PYTHON_COMPILE_VERDICT_FLOOR.minor;
}
function partitionOutrankedPythonCompileVerdicts(diagnostics, declared) {
  const kept = [];
  let dropped = 0;
  for (const diagnostic of diagnostics) {
    if (isJediCompileVerdictOutranked(diagnostic, declared))
      dropped += 1;
    else
      kept.push(diagnostic);
  }
  return { kept, dropped };
}
function recordPythonCompileVerdictDrop(file, declared, dropped) {
  recordDegradationOnce({
    kind: "python-compile-target-mismatch",
    subject: file,
    reason: `${dropped} jedi compile ${dropped === 1 ? "finding" : "findings"} dropped: declared Python ${declared.major}.${declared.minor} (${declared.source}) in ${declared.file}`,
    metadata: {
      declared: `${declared.major}.${declared.minor}`,
      source: declared.source,
      declarationFile: declared.file,
      dropped
    }
  });
}
function describePythonCompileWithheld(count, declared) {
  return `${count} python-jedi compile finding${count === 1 ? "" : "s"} withheld: the project declares Python ${declared.major}.${declared.minor} (${declared.source}) in ${declared.file}`;
}
var BARE_VERSION_PREFIX = /^v?(\d+)\.(\d+)/i;
var VERSION_SUFFIX = /^[-+._a-z0-9]*$/i;
var SPECIFIER_LOWER_BOUND = /^(?:>=|==|~=)\s*v?(\d+)\.(\d+)/;
var RUFF_LEVEL = /^py(\d)(\d+)$/i;
function reducePythonVersion(match) {
  if (!match)
    return void 0;
  return { major: Number(match[1]), minor: Number(match[2]) };
}
function reduceBarePythonVersion(text) {
  const trimmed = text.trim();
  const prefix = BARE_VERSION_PREFIX.exec(trimmed);
  if (!prefix)
    return void 0;
  if (!VERSION_SUFFIX.test(trimmed.slice(prefix[0].length)))
    return void 0;
  return reducePythonVersion(prefix);
}
function reducePythonSpecifier(text) {
  let strongest;
  for (const clause of text.split(",")) {
    const lowerBound = reducePythonVersion(SPECIFIER_LOWER_BOUND.exec(clause.trim()));
    if (!lowerBound)
      continue;
    if (!strongest || lowerBound.major > strongest.major || lowerBound.major === strongest.major && lowerBound.minor > strongest.minor) {
      strongest = lowerBound;
    }
  }
  return strongest ?? reduceBarePythonVersion(text);
}
function reduceRuffTargetVersion(text) {
  return reducePythonVersion(RUFF_LEVEL.exec(text.trim()));
}
function withSource(level, source, file) {
  return level ? { ...level, source, file } : void 0;
}
async function readDeclarationFile(filePath) {
  try {
    return await readFile(filePath, "utf-8");
  } catch (err) {
    const code = err.code;
    if (code === "ENOENT" || code === "ENOTDIR") {
      return void 0;
    }
    recordDegradationOnce({
      kind: "python-target-version-unreadable",
      subject: filePath,
      reason: `Python syntax-level declaration could not be read: ${err instanceof Error ? err.message : String(err)}`
    });
    return void 0;
  }
}
function parsePyrightJsonVersion(content) {
  let parsed;
  try {
    parsed = parseJsonc(content);
  } catch {
    return void 0;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return void 0;
  }
  const value = parsed.pythonVersion;
  return typeof value === "string" ? reduceBarePythonVersion(value) : void 0;
}
async function readRuffTier(dir, pyproject, pyprojectPath) {
  let configPath;
  let config;
  for (const name of [".ruff.toml", "ruff.toml"]) {
    const candidatePath = join(dir, name);
    config = await readDeclarationFile(candidatePath);
    if (config !== void 0) {
      configPath = candidatePath;
      break;
    }
  }
  if (config === void 0) {
    if (pyproject === void 0 || !hasTomlTable(pyproject, String.raw`tool\.ruff`)) {
      return { declaration: void 0, owned: false };
    }
    configPath = pyprojectPath;
    config = extractTomlTableSection(pyproject, String.raw`tool\.ruff`);
  }
  if (configPath === void 0 || config === void 0) {
    return { declaration: void 0, owned: false };
  }
  const target = parseTomlScalarString(config, "target-version");
  return {
    declaration: withSource(target ? reduceRuffTargetVersion(target) : void 0, "ruff-target-version", configPath),
    owned: true
  };
}
async function readPyrightTier(dir, pyproject, pyprojectPath) {
  const configPath = join(dir, "pyrightconfig.json");
  const config = await readDeclarationFile(configPath);
  if (config !== void 0) {
    return {
      declaration: withSource(parsePyrightJsonVersion(config), "pyright-python-version", configPath),
      owned: true
    };
  }
  if (pyproject === void 0)
    return { declaration: void 0, owned: false };
  const section = extractTomlTableSection(pyproject, String.raw`tool\.pyright`);
  if (section === void 0)
    return { declaration: void 0, owned: false };
  const raw = parseTomlScalarString(section, "pythonVersion");
  return {
    declaration: withSource(raw ? reduceBarePythonVersion(raw) : void 0, "pyright-python-version", pyprojectPath),
    owned: true
  };
}
function readRequiresPythonTier(pyproject, pyprojectPath) {
  if (pyproject === void 0)
    return { declaration: void 0, owned: false };
  const projectSection = extractTomlTableSection(pyproject, "project");
  const raw = projectSection !== void 0 ? parseTomlScalarString(projectSection, "requires-python") : void 0;
  return {
    declaration: withSource(raw ? reducePythonSpecifier(raw) : void 0, "requires-python", pyprojectPath),
    owned: raw !== void 0
  };
}
async function readVersionFileTier(dir) {
  const levelFilePath = join(dir, ".python-version");
  const content = await readDeclarationFile(levelFilePath);
  if (content === void 0)
    return { declaration: void 0, owned: false };
  const firstLine = (content.split(/\r?\n/, 1)[0] ?? "").trim();
  return {
    declaration: withSource(reduceBarePythonVersion(firstLine), "python-version-file", levelFilePath),
    owned: true
  };
}
var PYTHON_DECLARATION_SOURCES = [
  "ruff-target-version",
  "pyright-python-version",
  "requires-python",
  "python-version-file"
];
async function readPythonDeclarationInDirectory(dir, open) {
  const pyprojectPath = join(dir, "pyproject.toml");
  const pyproject = await readDeclarationFile(pyprojectPath);
  const tiers = [
    ["ruff-target-version", () => readRuffTier(dir, pyproject, pyprojectPath)],
    [
      "pyright-python-version",
      () => readPyrightTier(dir, pyproject, pyprojectPath)
    ],
    [
      "requires-python",
      async () => readRequiresPythonTier(pyproject, pyprojectPath)
    ],
    ["python-version-file", () => readVersionFileTier(dir)]
  ];
  const closed = [];
  for (const [source, read] of tiers) {
    if (!open.has(source))
      continue;
    const { declaration, owned } = await read();
    if (declaration)
      return { declaration, closed: [] };
    if (owned)
      closed.push(source);
  }
  return { declaration: void 0, closed };
}
async function detectPythonTargetVersion(filePath, homeDir = os.homedir()) {
  if (resolveLanguage(filePath)?.id !== "python")
    return void 0;
  const open = new Set(PYTHON_DECLARATION_SOURCES);
  for (const dir of walkUpDirs(dirname(realpathOrResolve(filePath)), {
    homeDir
  })) {
    const { declaration, closed } = await readPythonDeclarationInDirectory(dir, open);
    if (declaration)
      return declaration;
    for (const source of closed)
      open.delete(source);
    if (open.size === 0)
      return void 0;
  }
  return void 0;
}

export {
  emitBounded,
  resetBoundedTelemetry,
  PROJECT_VENV_DIR_NAMES,
  hasAmbientPythonEnvironment,
  detectPythonEnvironment,
  augmentPythonEnvironment,
  pythonEnvironmentToolCandidates,
  PYTHON_DECLARATION_CONCURRENCY,
  PYTHON_COMPILE_VERDICT_SERVER_ID,
  isJediCompileVerdict,
  partitionOutrankedPythonCompileVerdicts,
  recordPythonCompileVerdictDrop,
  describePythonCompileWithheld,
  detectPythonTargetVersion
};
