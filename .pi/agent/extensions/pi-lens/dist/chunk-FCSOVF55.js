import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  extractTomlTableSection,
  hasTomlTable,
  parseTomlStringArray
} from "./chunk-P7266HLM.js";
import {
  getProjectTrustState
} from "./chunk-ZANLILYD.js";
import {
  incrementDegradationCount,
  recordDegradationOnce
} from "./chunk-JAU72XNY.js";
import {
  logExtension
} from "./chunk-XTMJ7XDT.js";
import {
  logLatency
} from "./chunk-QQNQ7SJW.js";
import {
  UV_WORKSPACE_EXCLUDE_DIALECT,
  UV_WORKSPACE_MEMBERS_DIALECT,
  isAtOrAboveHomeDir,
  matchesWorkspaceMemberPattern,
  toPosix,
  walkUpDirs
} from "./chunk-N2H3ZPZY.js";

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
import path from "node:path";
var UV_WORKSPACE_TABLE = "tool\\.uv\\.workspace";
async function findUvWorkspace(startDir, homeDir) {
  const resolvedStart = path.resolve(startDir);
  let nearestProject;
  for (const dir of walkUpDirs(startDir)) {
    if (isAtOrAboveHomeDir(dir, homeDir))
      break;
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
        isStartDir: nearestProject === resolvedStart,
        members: parseTomlStringArray(workspaceTable, "members"),
        exclude: parseTomlStringArray(workspaceTable, "exclude")
      };
    }
  }
  return nearestProject ? {
    root: nearestProject,
    explicit: false,
    projectRoot: nearestProject,
    isStartDir: nearestProject === resolvedStart,
    members: [],
    exclude: []
  } : void 0;
}
function isUvWorkspaceMember(workspace, projectRoot) {
  const relative = toPosix(path.relative(workspace.root, projectRoot));
  if (relative.length === 0 || relative === ".." || relative.startsWith("../") || path.isAbsolute(relative)) {
    return false;
  }
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
var AMBIENT_ENVIRONMENT_VARIABLES = {
  "uv-project-environment": "UV_PROJECT_ENVIRONMENT",
  "virtual-env": "VIRTUAL_ENV",
  conda: "CONDA_PREFIX"
};
function hasAmbientPythonEnvironment(env = process.env) {
  return Object.values(AMBIENT_ENVIRONMENT_VARIABLES).some((name) => Boolean(env[name]));
}
async function detectPythonEnvironment(projectRoot, homeDir = os.homedir(), options = {}) {
  const root = path.resolve(projectRoot);
  const uvWorkspace = await findUvWorkspace(root, homeDir);
  const isProjectRoot = uvWorkspace?.isStartDir === true;
  const memberWorkspaceRoot = isProjectRoot && uvWorkspace.explicit && isUvWorkspaceMember(uvWorkspace, root) ? uvWorkspace.root : void 0;
  const uvEnvironmentRoot = isProjectRoot ? memberWorkspaceRoot ?? uvWorkspace.projectRoot : void 0;
  const uvProjectEnvironment = process.env.UV_PROJECT_ENVIRONMENT;
  const allowAmbient = options.allowAmbient ?? true;
  const isWithinProjectRoot = (candidateRoot) => {
    const relative = path.relative(root, path.resolve(candidateRoot));
    return relative !== ".." && !relative.startsWith(`..${path.sep}`) && // #3871 V1: another Windows drive has no relative path, so
    // `path.relative` returns the absolute target: no `..`, not inside.
    !path.isAbsolute(relative);
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
    { root: path.join(root, ".venv"), source: "project-dot-venv" },
    { root: path.join(root, "venv"), source: "project-venv" }
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
async function detectPythonVenv(projectRoot) {
  return (await detectPythonEnvironment(projectRoot))?.pythonPath;
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

export {
  emitBounded,
  resetBoundedTelemetry,
  hasAmbientPythonEnvironment,
  detectPythonEnvironment,
  detectPythonVenv,
  augmentPythonEnvironment,
  pythonEnvironmentToolCandidates
};
