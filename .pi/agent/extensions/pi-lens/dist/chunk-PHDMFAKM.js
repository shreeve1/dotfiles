import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  findNearestDirWithMarker
} from "./chunk-XVF2VVXP.js";
import {
  isWindowsPath
} from "./chunk-N2H3ZPZY.js";

// dist/clients/file-kinds.js
import { basename, extname, win32 } from "node:path";
import * as path from "node:path";
var KIND_EXTENSIONS = {
  clojure: [".clj", ".cljc", ".cljs", ".edn"],
  cmake: [".cmake"],
  csharp: [".cs"],
  css: [".css", ".less", ".sass", ".scss"],
  cue: [".cue"],
  // From llvm-project/clang/lib/Driver/Types.cpp clang::driver::types::lookupTypeForExtension:
  cxx: [
    // C
    ".c",
    ".h",
    // C++
    ".c++",
    ".cc",
    ".cp",
    ".cpp",
    ".cxx",
    ".hh",
    ".hpp",
    ".hxx",
    // C++ include files
    ".inl",
    ".ipp",
    ".tpp",
    ".txx",
    // C++20 module interface files
    ".c++m",
    ".cppm",
    ".cxxm",
    ".ixx",
    // CUDA
    ".cu",
    // HIP
    ".hip",
    // CUDA/HIP header convention; clang's driver table omits `.cuh`, but
    // projects use it for C++ headers that must remain in the cxx kind (#2986).
    ".cuh",
    // Objective-C
    ".m",
    ".mm",
    // OpenCL
    ".cl",
    ".clcpp"
  ],
  dart: [".dart"],
  docker: [".dockerfile"],
  elixir: [".ex", ".exs"],
  fish: [".fish"],
  fsharp: [".fs", ".fsi", ".fsx"],
  gleam: [".gleam"],
  go: [".go"],
  haskell: [".hs", ".lhs"],
  "helm-template": [".tpl"],
  html: [".htm", ".html"],
  java: [".java"],
  json: [".json", ".json5", ".jsonc"],
  jsts: [
    ".cjs",
    ".cts",
    ".js",
    ".jsx",
    ".mjs",
    ".mts",
    ".svelte",
    ".ts",
    ".tsx",
    ".vue"
  ],
  kotlin: [".kt", ".kts"],
  lean: [".lean"],
  lua: [".lua"],
  markdown: [".md", ".mdx"],
  nix: [".nix"],
  ocaml: [".ml", ".mli"],
  php: [".php"],
  powershell: [".ps1", ".psm1", ".psd1"],
  prisma: [".prisma"],
  python: [".py", ".pyi"],
  ruby: [".gemspec", ".rake", ".rb", ".ru"],
  rust: [".rs"],
  shell: [".bash", ".sh", ".zsh"],
  sql: [".sql"],
  swift: [".swift"],
  terraform: [".tf", ".tfvars"],
  terragrunt: [],
  toml: [".toml"],
  yaml: [".yaml", ".yml"],
  zig: [".zig", ".zon"]
};
function hasKindExtension(filePath, kind) {
  const extension = extname(filePath).toLowerCase();
  return KIND_EXTENSIONS[kind].some((candidate) => candidate === extension);
}
var JSTS_FACT_EXTENSIONS = new Set(KIND_EXTENSIONS.jsts.filter((extension) => ![".vue", ".svelte"].includes(extension)));
function isJstsFactFile(filePath) {
  return JSTS_FACT_EXTENSIONS.has(extname(filePath).toLowerCase());
}
var NON_KIND_READABLE_EXTENSIONS = /* @__PURE__ */ new Set([
  ".txt",
  ".env",
  ".cfg",
  ".conf",
  ".ini",
  ".xml"
]);
function isReadableSourceFile(filePath) {
  const extension = extname(filePath).toLowerCase();
  return Object.keys(KIND_EXTENSIONS).some((kind) => hasKindExtension(filePath, kind)) || NON_KIND_READABLE_EXTENSIONS.has(extension);
}
var LEAN_ROOT_MARKERS = [
  "lakefile.lean",
  "lakefile.toml",
  "lean-toolchain"
];
var DOTNET_CSHARP_ROOT_MARKERS = [
  "*.csproj",
  "*.sln",
  "*.slnx"
];
var DOTNET_FSHARP_ROOT_MARKERS = [
  "*.fsproj",
  "*.sln"
];
var TERRAGRUNT_FILENAMES = [
  "terragrunt.hcl",
  "root.hcl"
];
var EXT_TO_KIND = /* @__PURE__ */ new Map();
for (const [kind, exts] of Object.entries(KIND_EXTENSIONS)) {
  for (const ext of exts) {
    EXT_TO_KIND.set(ext.toLowerCase(), kind);
  }
  for (const ext of exts) {
    if (ext.startsWith(".")) {
      EXT_TO_KIND.set(ext.slice(1).toLowerCase(), kind);
    }
  }
}
var SPECIAL_FILENAMES = [
  { pattern: /^CMakeLists\.txt$/i, kind: "cmake" },
  { pattern: /^Makefile$/i, kind: "shell" },
  { pattern: /^Dockerfile(\.\w+)?$/i, kind: "docker" },
  ...TERRAGRUNT_FILENAMES.map((name) => ({
    pattern: new RegExp(`^${name.replaceAll(".", "\\.")}$`, "i"),
    kind: "terragrunt"
  }))
];
function isHelmYamlTemplatePath(filePath) {
  const templatesSegment = isWindowsPath(filePath) ? /[\\/]templates[\\/]/i : /\/templates\//i;
  if (!templatesSegment.test(filePath) || !/\.ya?ml$/i.test(filePath)) {
    return false;
  }
  const pathApi = isWindowsPath(filePath) ? win32 : path;
  return Boolean(findNearestDirWithMarker(pathApi.dirname(filePath), "chartYamlPath"));
}
function detectFileKind(filePath) {
  if (!filePath || typeof filePath !== "string") {
    return void 0;
  }
  if (isHelmYamlTemplatePath(filePath)) {
    return "helm-template";
  }
  const base = basename(filePath);
  for (const { pattern, kind } of SPECIAL_FILENAMES) {
    if (pattern.test(base)) {
      return kind;
    }
  }
  const ext = extname(filePath).toLowerCase();
  return EXT_TO_KIND.get(ext);
}
function isFileKind(filePath, kind) {
  const detected = detectFileKind(filePath);
  if (!detected)
    return false;
  if (Array.isArray(kind)) {
    return kind.includes(detected);
  }
  return detected === kind;
}
function getFileKindsForExtension(ext) {
  const normalizedExt = ext.startsWith(".") ? ext : `.${ext}`;
  const kind = EXT_TO_KIND.get(normalizedExt.toLowerCase());
  return kind ? [kind] : [];
}
var CODE_KINDS = /* @__PURE__ */ new Set([
  "clojure",
  "cmake",
  "csharp",
  "cue",
  "cxx",
  "dart",
  "docker",
  "elixir",
  "fish",
  "fsharp",
  "gleam",
  "go",
  "haskell",
  "helm-template",
  "java",
  "jsts",
  "kotlin",
  "lean",
  "lua",
  "nix",
  "ocaml",
  "php",
  "powershell",
  "prisma",
  "python",
  "ruby",
  "rust",
  "shell",
  "sql",
  "swift",
  "terraform",
  "terragrunt",
  "zig"
]);
var NON_CODE_KINDS = /* @__PURE__ */ new Set([
  "css",
  "html",
  "json",
  "markdown",
  "toml",
  "yaml"
]);
function isCodeKindFile(filePath) {
  const kind = detectFileKind(filePath);
  return kind !== void 0 && CODE_KINDS.has(kind);
}
function getFileKindLabel(kind) {
  const labels = {
    jsts: "JavaScript/TypeScript",
    python: "Python",
    go: "Go",
    rust: "Rust",
    cxx: "C/C++",
    cmake: "CMake",
    shell: "Shell",
    json: "JSON",
    markdown: "Markdown",
    css: "CSS",
    yaml: "YAML",
    sql: "SQL",
    ruby: "Ruby",
    html: "HTML",
    docker: "Dockerfile",
    php: "PHP",
    powershell: "PowerShell",
    prisma: "Prisma",
    csharp: "C#",
    fish: "Fish shell",
    fsharp: "F#",
    java: "Java",
    kotlin: "Kotlin",
    lean: "Lean 4",
    swift: "Swift",
    dart: "Dart",
    lua: "Lua",
    zig: "Zig",
    haskell: "Haskell",
    "helm-template": "Helm template",
    elixir: "Elixir",
    gleam: "Gleam",
    ocaml: "OCaml",
    clojure: "Clojure",
    cue: "CUE",
    terraform: "Terraform",
    terragrunt: "Terragrunt",
    nix: "Nix",
    toml: "TOML"
  };
  return labels[kind] ?? kind;
}
function getLanguageId(kind) {
  const languageIds = {
    jsts: "typescript",
    python: "python",
    go: "go",
    rust: "rust",
    cxx: "cpp",
    cmake: "cmake",
    shell: "shell",
    json: "json",
    markdown: "markdown",
    css: "css",
    yaml: "yaml",
    sql: "sql",
    ruby: "ruby",
    html: "html",
    docker: "dockerfile",
    php: "php",
    powershell: "powershell",
    prisma: "prisma",
    csharp: "csharp",
    fish: "fish",
    fsharp: "fsharp",
    java: "java",
    kotlin: "kotlin",
    lean: "lean",
    swift: "swift",
    dart: "dart",
    lua: "lua",
    zig: "zig",
    haskell: "haskell",
    "helm-template": "helm",
    elixir: "elixir",
    gleam: "gleam",
    ocaml: "ocaml",
    clojure: "clojure",
    cue: "cue",
    terraform: "terraform",
    terragrunt: "terragrunt",
    nix: "nix",
    toml: "toml"
  };
  return languageIds[kind] ?? "plaintext";
}

export {
  KIND_EXTENSIONS,
  isJstsFactFile,
  isReadableSourceFile,
  LEAN_ROOT_MARKERS,
  DOTNET_CSHARP_ROOT_MARKERS,
  DOTNET_FSHARP_ROOT_MARKERS,
  TERRAGRUNT_FILENAMES,
  SPECIAL_FILENAMES,
  isHelmYamlTemplatePath,
  detectFileKind,
  isFileKind,
  getFileKindsForExtension,
  CODE_KINDS,
  NON_CODE_KINDS,
  isCodeKindFile,
  getFileKindLabel,
  getLanguageId
};
