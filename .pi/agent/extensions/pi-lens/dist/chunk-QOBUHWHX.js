import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  getSourceFiles
} from "./chunk-QILIYSJF.js";
import {
  readDirEntriesSafe,
  shouldRecurseIntoDir
} from "./chunk-5NGR67U5.js";
import {
  getProjectIgnoreMatcher
} from "./chunk-C34ZXZ7O.js";
import {
  CODE_KINDS,
  DOTNET_CSHARP_ROOT_MARKERS,
  DOTNET_FSHARP_ROOT_MARKERS,
  KIND_EXTENSIONS,
  LEAN_ROOT_MARKERS,
  TERRAGRUNT_FILENAMES,
  detectFileKind
} from "./chunk-PHDMFAKM.js";
import {
  findNearestDirWithAnyBasename,
  registerWorkspaceTopologyReset
} from "./chunk-XVF2VVXP.js";
import {
  BoundedLruCache
} from "./chunk-ABBOA7UD.js";
import {
  direntsHaveMarkerGlobMatch,
  normalizeMapKey
} from "./chunk-N2H3ZPZY.js";

// dist/clients/language-profile.js
import * as fs from "node:fs";
import * as path from "node:path";

// dist/clients/language-policy.js
var LANGUAGE_POLICY = {
  jsts: {
    lspCapable: true,
    startup: {
      defaults: ["typescript-language-server", "biome"],
      heavyScansRequireConfig: true
    }
  },
  python: {
    lspCapable: true,
    startup: {
      defaults: ["pyright", "ruff"]
    }
  },
  go: { lspCapable: true },
  rust: { lspCapable: true },
  cxx: { lspCapable: true },
  cmake: { lspCapable: true },
  fish: { lspCapable: true },
  shell: { lspCapable: true, startup: { defaults: ["shellcheck"] } },
  json: { lspCapable: true },
  markdown: { lspCapable: true },
  css: { lspCapable: true },
  yaml: {
    lspCapable: true,
    startup: {
      defaults: ["yamllint"],
      heavyScansRequireConfig: true
    }
  },
  sql: {
    lspCapable: false,
    startup: {
      defaults: ["sqlfluff"],
      heavyScansRequireConfig: true
    }
  },
  ruby: {
    lspCapable: true,
    startup: {
      defaults: ["rubocop"],
      heavyScansRequireConfig: true
    }
  },
  html: { lspCapable: true },
  docker: { lspCapable: true },
  php: { lspCapable: true },
  powershell: { lspCapable: true },
  prisma: { lspCapable: true },
  csharp: { lspCapable: true },
  fsharp: { lspCapable: true },
  java: { lspCapable: true },
  kotlin: { lspCapable: true, startup: { defaults: ["ktlint"] } },
  lean: { lspCapable: true },
  swift: { lspCapable: true },
  dart: { lspCapable: true },
  lua: { lspCapable: true },
  zig: { lspCapable: true },
  haskell: { lspCapable: true },
  "helm-template": { lspCapable: false },
  elixir: { lspCapable: true },
  gleam: { lspCapable: true },
  ocaml: { lspCapable: true },
  clojure: { lspCapable: true },
  cue: { lspCapable: true },
  terraform: { lspCapable: true },
  terragrunt: { lspCapable: false },
  nix: { lspCapable: true },
  toml: { lspCapable: true, startup: { defaults: ["taplo"] } }
};
var PRIMARY_DISPATCH_GROUPS = {
  jsts: {
    mode: "fallback",
    runnerIds: ["lsp"],
    filterKinds: ["jsts"]
  },
  python: {
    mode: "all",
    runnerIds: ["lsp", "pyright"],
    filterKinds: ["python"]
  },
  go: { mode: "all", runnerIds: ["lsp", "go-vet"], filterKinds: ["go"] },
  rust: {
    mode: "all",
    runnerIds: ["lsp", "rust-clippy"],
    filterKinds: ["rust"]
  },
  ruby: {
    mode: "all",
    runnerIds: ["lsp", "rubocop"],
    filterKinds: ["ruby"]
  },
  cxx: {
    mode: "all",
    runnerIds: ["lsp", "cpp-check"],
    filterKinds: ["cxx"]
  },
  cmake: { mode: "fallback", runnerIds: ["lsp"], filterKinds: ["cmake"] },
  fish: {
    mode: "all",
    runnerIds: ["lsp", "fish-indent"],
    filterKinds: ["fish"]
  },
  shell: {
    mode: "all",
    runnerIds: ["lsp", "shellcheck"],
    filterKinds: ["shell"]
  },
  json: { mode: "fallback", runnerIds: ["lsp"], filterKinds: ["json"] },
  markdown: {
    // marksman (primary LSP) adds cross-file checks the cold spellcheck/vale
    // runners can't see; all three run so prose + structural coverage coexist.
    mode: "all",
    runnerIds: ["lsp", "spellcheck", "vale"],
    filterKinds: ["markdown"]
  },
  css: {
    mode: "all",
    runnerIds: ["lsp", "stylelint"],
    filterKinds: ["css"]
  },
  yaml: {
    mode: "all",
    runnerIds: ["lsp", "yamllint", "trivy-config", "helm-lint", "helm-render"],
    filterKinds: ["yaml"]
  },
  sql: {
    mode: "fallback",
    runnerIds: ["sqlfluff"],
    filterKinds: ["sql"]
  },
  html: {
    mode: "all",
    runnerIds: ["lsp", "htmlhint"],
    filterKinds: ["html"]
  },
  docker: {
    mode: "all",
    runnerIds: ["lsp", "hadolint", "trivy-config"],
    filterKinds: ["docker"]
  },
  php: {
    mode: "fallback",
    runnerIds: ["lsp", "php-lint", "phpstan"],
    filterKinds: ["php"]
  },
  powershell: {
    mode: "all",
    runnerIds: ["lsp", "psscriptanalyzer"],
    filterKinds: ["powershell"]
  },
  prisma: {
    mode: "all",
    runnerIds: ["lsp", "prisma-validate"],
    filterKinds: ["prisma"]
  },
  csharp: {
    mode: "fallback",
    runnerIds: ["lsp", "dotnet-build"],
    filterKinds: ["csharp"]
  },
  fsharp: { mode: "fallback", runnerIds: ["lsp"], filterKinds: ["fsharp"] },
  java: {
    mode: "fallback",
    runnerIds: ["lsp", "javac"],
    filterKinds: ["java"]
  },
  kotlin: {
    mode: "all",
    runnerIds: ["lsp", "ktlint"],
    filterKinds: ["kotlin"]
  },
  lean: { mode: "fallback", runnerIds: ["lsp"], filterKinds: ["lean"] },
  swift: {
    mode: "all",
    runnerIds: ["lsp", "swiftlint"],
    filterKinds: ["swift"]
  },
  dart: {
    mode: "all",
    runnerIds: ["lsp", "dart-analyze"],
    filterKinds: ["dart"]
  },
  lua: { mode: "fallback", runnerIds: ["lsp"], filterKinds: ["lua"] },
  zig: { mode: "all", runnerIds: ["lsp", "zig-check"], filterKinds: ["zig"] },
  haskell: { mode: "fallback", runnerIds: ["lsp"], filterKinds: ["haskell"] },
  "helm-template": {
    mode: "all",
    // helm-render is opt-in (`helm.renderValidation.enabled`) and skips itself
    // when the switch is absent, so it costs nothing when unconfigured (#1283).
    runnerIds: ["helm-lint", "helm-render"],
    filterKinds: ["helm-template"]
  },
  elixir: {
    mode: "all",
    runnerIds: ["lsp", "elixir-check", "credo"],
    filterKinds: ["elixir"]
  },
  gleam: {
    mode: "all",
    runnerIds: ["lsp", "gleam-check"],
    filterKinds: ["gleam"]
  },
  ocaml: { mode: "fallback", runnerIds: ["lsp"], filterKinds: ["ocaml"] },
  clojure: { mode: "fallback", runnerIds: ["lsp"], filterKinds: ["clojure"] },
  // #1522: cuelsp reports syntax/parse errors only; cue-vet covers the
  // evaluation-error class the language server deliberately doesn't publish.
  cue: { mode: "all", runnerIds: ["lsp", "cue-vet"], filterKinds: ["cue"] },
  terraform: {
    mode: "all",
    runnerIds: ["lsp", "tflint", "trivy-config"],
    filterKinds: ["terraform"]
  },
  terragrunt: {
    mode: "all",
    runnerIds: ["terragrunt"],
    filterKinds: ["terragrunt"]
  },
  nix: { mode: "fallback", runnerIds: ["lsp"], filterKinds: ["nix"] },
  toml: {
    mode: "all",
    runnerIds: ["lsp", "taplo"],
    filterKinds: ["toml"]
  }
};
function getLspCapableKinds() {
  return Object.keys(LANGUAGE_POLICY).filter((kind) => LANGUAGE_POLICY[kind].lspCapable);
}
function getPrimaryDispatchGroup(kind, lspEnabled) {
  const base = PRIMARY_DISPATCH_GROUPS[kind];
  if (!base)
    return void 0;
  const ids = lspEnabled ? [...base.runnerIds] : base.runnerIds.filter((id) => id !== "lsp");
  if (ids.length === 0)
    return void 0;
  return {
    mode: base.mode,
    runnerIds: ids,
    filterKinds: base.filterKinds,
    semantic: base.semantic
  };
}
function canRunStartupHeavyScans(profile, kind) {
  if (!profile.present[kind])
    return false;
  const needsConfig = LANGUAGE_POLICY[kind].startup?.heavyScansRequireConfig;
  if (!needsConfig)
    return true;
  return !!profile.configured[kind];
}

// dist/clients/language-profile.js
var SUPPORTED_FILE_KINDS = Object.keys(KIND_EXTENSIONS);
var PROJECT_MARKERS_BY_KIND = {
  jsts: ["package.json", "tsconfig.json", "jsconfig.json"],
  python: ["pyproject.toml", "requirements.txt", "setup.py", "setup.cfg"],
  go: ["go.mod"],
  rust: ["Cargo.toml"],
  cxx: [
    "compile_commands.json",
    "compile_flags.txt",
    ".clangd",
    "CMakeLists.txt",
    "Makefile",
    "makefile",
    "meson.build",
    "build.ninja"
  ],
  ruby: ["Gemfile", "Rakefile"],
  yaml: [".yamllint", "yamllint.yaml", "yamllint.yml", "pyproject.toml"],
  sql: [".sqlfluff", "pyproject.toml"],
  php: ["composer.json", "composer.lock"],
  prisma: ["schema.prisma", "prisma/schema.prisma"],
  // #2870: `build.gradle.kts` is the Kotlin-DSL spelling of `build.gradle`
  // and marks a Java module just as well — its absence here (and in
  // ROOT_MARKERS_BY_KIND below) is what left a `.java` file in a
  // Kotlin-DSL Gradle module resolving to the workspace root, where a
  // polyglot repo's go.mod then claimed it. `kotlin` already lists both
  // spellings; java listed only the Groovy one.
  java: ["pom.xml", "build.gradle", "build.gradle.kts", ".classpath"],
  kotlin: ["build.gradle.kts", "build.gradle", "pom.xml"],
  lean: LEAN_ROOT_MARKERS,
  swift: ["Package.swift"],
  dart: ["pubspec.yaml"],
  elixir: ["mix.exs"],
  cue: ["cue.mod"],
  gleam: ["gleam.toml"],
  terraform: [".terraform.lock.hcl"],
  terragrunt: TERRAGRUNT_FILENAMES,
  nix: ["flake.nix"],
  toml: ["pyproject.toml", "Cargo.toml", "taplo.toml"],
  csharp: DOTNET_CSHARP_ROOT_MARKERS,
  fsharp: DOTNET_FSHARP_ROOT_MARKERS
};
var ROOT_MARKERS_BY_KIND = {
  jsts: [
    "biome.json",
    "biome.jsonc",
    "package.json",
    "tsconfig.json",
    "jsconfig.json",
    "pnpm-workspace.yaml"
  ],
  python: [
    "pyproject.toml",
    "requirements.txt",
    "setup.py",
    "setup.cfg",
    "Pipfile"
  ],
  go: ["go.work", "go.mod", "go.sum"],
  rust: ["Cargo.toml"],
  cxx: [
    "compile_commands.json",
    "compile_flags.txt",
    ".clangd",
    "CMakeLists.txt",
    "Makefile",
    "makefile",
    "meson.build",
    "build.ninja",
    ".git"
  ],
  ruby: ["Gemfile", "Rakefile"],
  yaml: [".yamllint", ".yamllint.yml", ".yamllint.yaml"],
  sql: [".sqlfluff", "pyproject.toml", "setup.cfg", "tox.ini"],
  php: ["composer.json", "composer.lock"],
  prisma: ["prisma/schema.prisma", "schema.prisma"],
  // #2870: see PROJECT_MARKERS_BY_KIND.java above — this is the table
  // `resolveLanguageRootForFile` walks, so the missing Kotlin-DSL spelling
  // is what anchored a nested Gradle module's `.java` file at the
  // workspace root.
  java: ["pom.xml", "build.gradle", "build.gradle.kts", ".classpath"],
  kotlin: ["build.gradle.kts", "build.gradle", "pom.xml"],
  lean: LEAN_ROOT_MARKERS,
  swift: ["Package.swift"],
  dart: ["pubspec.yaml"],
  elixir: ["mix.exs"],
  cue: ["cue.mod", ".git"],
  gleam: ["gleam.toml"],
  terraform: [".terraform.lock.hcl"],
  terragrunt: TERRAGRUNT_FILENAMES,
  nix: ["flake.nix"],
  toml: ["pyproject.toml", "Cargo.toml", "taplo.toml"],
  csharp: DOTNET_CSHARP_ROOT_MARKERS,
  fsharp: DOTNET_FSHARP_ROOT_MARKERS
};
var TOOL_MARKERS_BY_RUNNER = {
  ruff: ["ruff.toml", ".ruff.toml"],
  oxlint: [".oxlintrc.json", "oxlint.config.js"],
  "spellcheck/typos": ["_typos.toml", "typos.toml"],
  yamllint: ["yamllint.yaml", "yamllint.yml"],
  prettier: [".prettierignore"]
};
function rootMarkersForFile(filePath, runner) {
  const kind = detectFileKind(path.resolve(filePath));
  const languageMarkers = kind ? ROOT_MARKERS_BY_KIND[kind] ?? [] : [];
  const toolMarkers = runner ? TOOL_MARKERS_BY_RUNNER[runner] ?? [] : [];
  return toolMarkers.length ? [.../* @__PURE__ */ new Set([...languageMarkers, ...toolMarkers])] : languageMarkers;
}
function hasProjectMarker(projectRoot, marker) {
  if (!marker.includes("*"))
    return fs.existsSync(path.join(projectRoot, marker));
  try {
    return direntsHaveMarkerGlobMatch(fs.readdirSync(projectRoot, { withFileTypes: true }), marker);
  } catch {
    return false;
  }
}
var languageProfileCache = new BoundedLruCache(32);
registerWorkspaceTopologyReset(() => languageProfileCache.clear());
function detectProjectLanguageProfile(projectRoot, sourceFiles) {
  if (sourceFiles === void 0) {
    const cached = languageProfileCache.get(normalizeMapKey(projectRoot));
    if (cached)
      return cached;
  }
  const result = computeProjectLanguageProfile(projectRoot, sourceFiles);
  if (sourceFiles === void 0) {
    languageProfileCache.set(normalizeMapKey(projectRoot), result);
  }
  return result;
}
function computeProjectLanguageProfile(projectRoot, sourceFiles) {
  const present = Object.fromEntries(SUPPORTED_FILE_KINDS.map((kind) => [kind, false]));
  const counts = {};
  const configured = {};
  for (const [kind, markers] of Object.entries(PROJECT_MARKERS_BY_KIND)) {
    if (!markers)
      continue;
    for (const marker of markers) {
      if (hasProjectMarker(projectRoot, marker)) {
        present[kind] = true;
        configured[kind] = true;
        break;
      }
    }
  }
  let files = sourceFiles;
  if (!files) {
    try {
      files = getSourceFiles(projectRoot, true);
    } catch {
      files = [];
    }
  }
  for (const file of files) {
    const kind = detectFileKind(file);
    if (!kind)
      continue;
    present[kind] = true;
    counts[kind] = (counts[kind] ?? 0) + 1;
  }
  const detectedKinds = SUPPORTED_FILE_KINDS.filter((kind) => present[kind]);
  return {
    present,
    configured,
    counts,
    detectedKinds
  };
}
function getDefaultStartupTools(profile) {
  const tools = /* @__PURE__ */ new Set();
  for (const kind of Object.keys(LANGUAGE_POLICY)) {
    if (!profile.present[kind])
      continue;
    const defaults = LANGUAGE_POLICY[kind].startup?.defaults ?? [];
    for (const tool of defaults) {
      if (LANGUAGE_POLICY[kind].startup?.heavyScansRequireConfig && !profile.configured[kind]) {
        continue;
      }
      tools.add(tool);
    }
  }
  return [...tools];
}
function resolveLanguageRootForFile(filePath, workspaceRoot) {
  const absoluteFilePath = path.resolve(filePath);
  const startDir = path.dirname(absoluteFilePath);
  const kind = detectFileKind(absoluteFilePath);
  if (!kind)
    return path.resolve(workspaceRoot);
  const markers = rootMarkersForFile(absoluteFilePath);
  if (!markers || markers.length === 0) {
    return path.resolve(workspaceRoot);
  }
  const found = findNearestDirWithAnyBasename(startDir, markers);
  if (!found)
    return path.resolve(workspaceRoot);
  const workspace = path.resolve(workspaceRoot);
  const relative2 = path.relative(workspace, found);
  if (relative2.startsWith("..") || path.isAbsolute(relative2)) {
    return workspace;
  }
  return found;
}
var WARMUP_SOURCE_EXTS = new Set(SUPPORTED_FILE_KINDS.flatMap((kind) => KIND_EXTENSIONS[kind]));
var WARMUP_CODE_EXTS = new Set(SUPPORTED_FILE_KINDS.filter((kind) => CODE_KINDS.has(kind)).flatMap((kind) => KIND_EXTENSIONS[kind]));
var MAX_WARMUP_SOURCE_FILES = 2500;
var MATCHED_FILES_CEILING_FACTOR = 10;
async function collectSourceFilesForWarmup(rootDir, maxFiles = MAX_WARMUP_SOURCE_FILES, yieldEvery = 100) {
  const root = path.resolve(rootDir);
  const ignoreMatcher = getProjectIgnoreMatcher(root);
  await ignoreMatcher.ensureTrackedIndex();
  const stack = [root];
  const codeOut = [];
  const nonCodeOut = [];
  let matchedSeen = 0;
  let processedSinceYield = 0;
  walk: while (stack.length > 0) {
    const current = stack.pop();
    if (!current)
      continue;
    const entries = readDirEntriesSafe(current);
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (!shouldRecurseIntoDir(entry, fullPath, {
          ignoreMatcher,
          followSymlinks: true
        })) {
          continue;
        }
        stack.push(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (!WARMUP_SOURCE_EXTS.has(ext))
          continue;
        if (ignoreMatcher.isIgnored(fullPath, false))
          continue;
        matchedSeen += 1;
        const bucket = WARMUP_CODE_EXTS.has(ext) ? codeOut : nonCodeOut;
        if (bucket.length < maxFiles)
          bucket.push(fullPath);
        if (codeOut.length >= maxFiles || matchedSeen >= MATCHED_FILES_CEILING_FACTOR * maxFiles) {
          break walk;
        }
      }
      if (++processedSinceYield % yieldEvery === 0) {
        await new Promise((resolve2) => setImmediate(resolve2));
      }
    }
  }
  return [...codeOut, ...nonCodeOut];
}
async function detectProjectLanguageProfileAsync(projectRoot) {
  const cached = languageProfileCache.get(normalizeMapKey(projectRoot));
  if (cached)
    return cached;
  const files = await collectSourceFilesForWarmup(projectRoot);
  const result = detectProjectLanguageProfile(projectRoot, files);
  languageProfileCache.set(normalizeMapKey(projectRoot), result);
  return result;
}

export {
  getLspCapableKinds,
  getPrimaryDispatchGroup,
  canRunStartupHeavyScans,
  SUPPORTED_FILE_KINDS,
  rootMarkersForFile,
  detectProjectLanguageProfile,
  getDefaultStartupTools,
  resolveLanguageRootForFile,
  WARMUP_SOURCE_EXTS,
  collectSourceFilesForWarmup,
  detectProjectLanguageProfileAsync
};
