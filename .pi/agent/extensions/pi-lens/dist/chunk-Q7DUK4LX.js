import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  rootMarkersForFile
} from "./chunk-QOBUHWHX.js";
import {
  createGenerationMap,
  createGenerationSource
} from "./chunk-C34ZXZ7O.js";
import {
  getDegradationLedgerGeneration,
  recordDegradationOnce
} from "./chunk-JAU72XNY.js";
import {
  logExtension
} from "./chunk-XTMJ7XDT.js";
import {
  isAtOrAboveHomeDir,
  isRealGitMarker,
  isUnderDir,
  isWindowsPath,
  nameMatchesMarkerGlob,
  normalizeEphemeralMapKey
} from "./chunk-N2H3ZPZY.js";

// dist/clients/tool-cwd.js
import * as os from "node:os";
import { existsSync, readdirSync } from "node:fs";
import * as path from "node:path";
var FORMATTER_MARKERS = {
  biome: ["biome.json", "biome.jsonc", "package.json", ".gitignore"],
  prettier: [
    ".prettierrc",
    ".prettierrc.json",
    ".prettierrc.yaml",
    ".prettierrc.yml",
    ".prettierrc.js",
    ".prettierrc.cjs",
    ".prettierrc.mjs",
    "prettier.config.js",
    "prettier.config.cjs",
    "prettier.config.mjs",
    ".prettierignore",
    "package.json",
    ".gitignore"
  ],
  ruff: ["pyproject.toml", "ruff.toml", ".ruff.toml", ".gitignore"],
  black: ["pyproject.toml", "black.toml", ".black", ".gitignore"],
  "php-cs-fixer": [".php-cs-fixer.php", ".php-cs-fixer.dist.php", ".gitignore"],
  sqlfluff: [".sqlfluff", "pyproject.toml", "setup.cfg", ".gitignore"],
  oxfmt: [
    "oxfmt.toml",
    ".oxfmtrc.json",
    "vite-plus.json",
    "package.json",
    ".gitignore"
  ],
  rustfmt: ["rustfmt.toml", ".rustfmt.toml", "Cargo.toml", ".gitignore"],
  rubocop: [".rubocop.yml", ".rubocop.yaml", ".gitignore"],
  standardrb: [".standard.yml", ".standard.yaml", ".gitignore"],
  "clang-format": [".clang-format", "_clang-format", ".gitignore"],
  stylua: ["stylua.toml", ".stylua.toml", ".gitignore"],
  ocamlformat: [".ocamlformat", ".gitignore"],
  "google-java-format": [".google-java-format", ".editorconfig", ".gitignore"],
  cljfmt: [".cljfmt.edn", "cljfmt.edn", ".cljfmt", ".gitignore"],
  "cmake-format": [
    ".cmake-format",
    ".cmake-format.yaml",
    ".cmake-format.yml",
    ".cmake-format.json",
    ".cmake-format.py",
    "cmake-format.yaml",
    "cmake-format.yml",
    ".editorconfig",
    ".gitignore"
  ],
  "psscriptanalyzer-format": [
    "PSScriptAnalyzerSettings.psd1",
    "ScriptAnalyzerSettings.psd1",
    ".gitignore"
  ],
  csharpier: [
    ".csharpierrc",
    ".csharpierrc.json",
    ".csharpierrc.yaml",
    ".csharpierrc.yml",
    ".gitignore"
  ],
  ormolu: [".ormolu", ".gitignore"],
  taplo: ["taplo.toml", ".taplo.toml", ".gitignore"],
  terraform: [".terraform.lock.hcl", ".gitignore"],
  swiftformat: [".swiftformat", ".gitignore"],
  fantomas: [".fantomasignore", ".editorconfig", ".gitignore"],
  mix: [".formatter.exs", ".gitignore"],
  shfmt: [".editorconfig", ".gitignore"],
  ktlint: [".editorconfig", ".gitignore"],
  ktfmt: [
    ".editorconfig",
    ".ktfmt",
    ".ktfmt.kts",
    "build.gradle",
    "build.gradle.kts",
    "settings.gradle",
    "settings.gradle.kts",
    ".gitignore"
  ],
  typstyle: [".gitignore"]
};
var toolCwdGeneration = createGenerationSource("tool-cwd");
var logged = createGenerationMap("tool-cwd-resolution-log");
function _toolCwdEphemeralKey(parts) {
  return parts.map(normalizeEphemeralMapKey).join("\0");
}
function syncGeneration() {
  if (toolCwdGeneration.current() === getDegradationLedgerGeneration())
    return;
  logged.clear();
  while (toolCwdGeneration.current() < getDegradationLedgerGeneration()) {
    toolCwdGeneration.bump();
  }
}
function walkMarkerRoot(startDir, markers, homeDir) {
  let current = path.resolve(startDir);
  for (let depth = 0; depth < 64; depth++) {
    if (isAtOrAboveHomeDir(current, homeDir))
      break;
    for (const marker of markers) {
      const slash = marker.replace(/\\/g, "/").lastIndexOf("/");
      const parent = slash >= 0 ? marker.slice(0, slash) : "";
      const basename = slash >= 0 ? marker.slice(slash + 1) : marker;
      const target = parent ? path.join(current, ...parent.split("/").filter(Boolean)) : current;
      let found = false;
      if (basename.includes("*")) {
        try {
          found = readdirSync(target, { withFileTypes: true }).some((entry) => (entry.isFile() || entry.isSymbolicLink()) && nameMatchesMarkerGlob(entry.name, basename));
        } catch {
          found = false;
        }
      } else {
        found = existsSync(path.join(target, basename));
      }
      if (found)
        return { root: current, marker };
    }
    const parentDir = path.dirname(current);
    if (parentDir === current)
      break;
    current = parentDir;
  }
  return { root: null };
}
function findMarkerRoot(startDir, markers, homeDir) {
  syncGeneration();
  return walkMarkerRoot(startDir, markers, homeDir);
}
function markersFor(kind, tool, file, ctx) {
  if (kind === "lsp")
    return ctx.rootMarkers ?? [];
  if (kind === "runner")
    return ctx.rootMarkers ?? rootMarkersForFile(file, tool);
  return FORMATTER_MARKERS[tool] ?? [".gitignore"];
}
function emitResolution(kind, tool, cwd, reason) {
  syncGeneration();
  const key = _toolCwdEphemeralKey([kind, tool, cwd, reason]);
  if (logged.current(key) !== 0)
    return;
  logged.bump(key);
  logExtension({
    subsystem: "tool-cwd",
    level: "debug",
    message: `cwd ${kind} ${tool} cwd=${cwd} reason=${reason}`
  });
}
function logRunnerAdvisoryOnce(ctx, tool, root, message) {
  syncGeneration();
  const key = _toolCwdEphemeralKey(["runner-advisory", tool, root]);
  if (logged.current(key) !== 0)
    return;
  logged.bump(key);
  ctx.log(message, "debug");
}
function resolveToolCwd(kind, tool, file, ctx) {
  const dispatchRoot = path.resolve(ctx.cwd ?? process.cwd());
  const absoluteFile = path.resolve(file);
  const fileDir = path.dirname(absoluteFile);
  const homeDir = ctx.homeDir ?? os.homedir();
  const insideDispatch = isUnderDir(absoluteFile, dispatchRoot);
  if (ctx.serverRoot) {
    const rootPath = isWindowsPath(ctx.serverRoot) ? path.win32 : path;
    const serverRoot = rootPath.resolve(ctx.serverRoot);
    if (!ctx.suppressTelemetry)
      emitResolution(kind, tool, serverRoot, "server-root");
    return { cwd: serverRoot };
  }
  const markers = markersFor(kind, tool, absoluteFile, ctx);
  const markerResult = markers.length ? findMarkerRoot(fileDir, markers, ctx.allowHomeMarker ? path.parse(homeDir).root : homeDir) : { root: null };
  const markerRoot = markerResult.root;
  if (markerRoot && (insideDispatch ? isUnderDir(markerRoot, dispatchRoot) : true)) {
    const finalReason = `marker:${markerResult.marker ?? markers[0]}`;
    if (!ctx.suppressTelemetry)
      emitResolution(kind, tool, markerRoot, finalReason);
    return {
      cwd: markerRoot,
      ...markerResult.marker !== void 0 ? { marker: markerResult.marker } : {}
    };
  }
  const memo = ctx.toolCwdMemo;
  if (memo && memo.gitRoot === void 0) {
    const gitResult = findMarkerRoot(fileDir, [".git"], homeDir);
    memo.gitRoot = gitResult.root && isRealGitMarker(path.join(gitResult.root, ".git")) ? gitResult.root : null;
  }
  const gitRoot = memo && memo.gitRoot !== void 0 ? memo.gitRoot : (() => {
    const gitResult = findMarkerRoot(fileDir, [".git"], homeDir);
    return gitResult.root && isRealGitMarker(path.join(gitResult.root, ".git")) ? gitResult.root : null;
  })();
  if (gitRoot && (insideDispatch ? isUnderDir(gitRoot, dispatchRoot) : true)) {
    if (!ctx.suppressTelemetry)
      emitResolution(kind, tool, gitRoot, "git-root");
    return { cwd: gitRoot, marker: ".git" };
  }
  if (insideDispatch) {
    if (kind === "formatter") {
      if (!ctx.suppressTelemetry)
        emitResolution(kind, tool, fileDir, "file-dir-fallback");
      if (!ctx.suppressTelemetry && !isUnderDir(fileDir, homeDir)) {
        recordDegradationOnce({
          kind: "tool-cwd-resolution",
          subject: tool,
          reason: `${kind}:home-cap:${absoluteFile}`
        });
      }
      return { cwd: fileDir };
    }
    if (!ctx.suppressTelemetry)
      emitResolution(kind, tool, dispatchRoot, "dispatch-root");
    return { cwd: dispatchRoot };
  }
  const reason = isUnderDir(fileDir, homeDir) ? "file-dir-fallback" : "home-cap";
  const fallback = isUnderDir(fileDir, homeDir) ? fileDir : homeDir;
  if (!ctx.suppressTelemetry)
    recordDegradationOnce({
      kind: "tool-cwd-resolution",
      subject: tool,
      reason: `${kind}:${reason}:${absoluteFile}`
    });
  if (!ctx.suppressTelemetry)
    emitResolution(kind, tool, fallback, reason);
  return { cwd: fallback };
}
function resolveRunnerCwd(ctx, tool) {
  return resolveToolCwd("runner", tool, ctx.filePath, ctx).cwd;
}
function resolveRunnerCwdWithReason(ctx, tool) {
  return resolveToolCwd("runner", tool, ctx.filePath, ctx);
}

export {
  logRunnerAdvisoryOnce,
  resolveToolCwd,
  resolveRunnerCwd,
  resolveRunnerCwdWithReason
};
