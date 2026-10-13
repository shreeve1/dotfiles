import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  getGlobalPiLensDir
} from "./chunk-C34ZXZ7O.js";
import {
  SPECIAL_FILENAMES
} from "./chunk-PHDMFAKM.js";
import {
  getTurnId
} from "./chunk-AOHZU2BM.js";
import {
  BoundedFifoMap
} from "./chunk-ABBOA7UD.js";

// dist/clients/custom-rule-locations.js
import * as path from "node:path";
function getUserRuleRoot() {
  return path.join(getGlobalPiLensDir(), "rules");
}
var RULE_CORPUS_CYCLE_ENTRIES = 16;
var ruleCorpusCycleFingerprints = new BoundedFifoMap(RULE_CORPUS_CYCLE_ENTRIES);
var cycleSlot;
function ruleCorpusFingerprintForCycle(family, root, compute, force = false) {
  const cycle = getTurnId();
  if (!force && cycleSlot !== void 0 && cycleSlot.cycle === cycle && cycleSlot.family === family && cycleSlot.root === root) {
    return cycleSlot.fingerprint;
  }
  const key = `${cycle}\0${family}\0${root}`;
  let fingerprint = force ? void 0 : ruleCorpusCycleFingerprints.get(key);
  if (fingerprint === void 0) {
    fingerprint = compute(root);
    ruleCorpusCycleFingerprints.set(key, fingerprint);
  }
  cycleSlot = { cycle, family, root, fingerprint };
  return fingerprint;
}

// dist/clients/language-registry.js
var LANGUAGES = [
  { id: "ada", extensions: [".adb", ".ads"] },
  { id: "astro", extensions: [".astro"] },
  { id: "c", kind: "cxx", extensions: [".c", ".h"], grammar: "c" },
  {
    id: "clojure",
    kind: "clojure",
    extensions: [".clj", ".cljc", ".cljs", ".edn"]
  },
  {
    id: "cmake",
    kind: "cmake",
    extensions: [".cmake"],
    filenames: ["CMakeLists.txt"]
  },
  { id: "cobol", extensions: [".cob", ".cbl"] },
  {
    id: "cpp",
    kind: "cxx",
    // The clang extension table (file-kinds.ts KIND_EXTENSIONS.cxx) minus the
    // C header/source pair, which the `c` entry owns. `.cuh` deliberately
    // diverges from clang's table: CUDA/HIP projects use it for C++ headers,
    // so it must reach the same cpp grammar and clangd path as `.cu`/`.hip`.
    extensions: [
      ".c++",
      ".c++m",
      ".cc",
      ".cl",
      ".clcpp",
      ".cp",
      ".cpp",
      ".cppm",
      ".cu",
      ".cuh",
      ".cxx",
      ".cxxm",
      ".hh",
      ".hip",
      ".hpp",
      ".hxx",
      ".inl",
      ".ipp",
      ".ixx",
      ".m",
      ".mm",
      ".tpp",
      ".txx"
    ],
    grammar: "cpp",
    // The module-interface (.c++m/.cppm/.cxxm/.ixx), Objective-C (.m/.mm),
    // OpenCL (.cl/.clcpp) and .cp tail is classified cxx but has never been
    // routed to the cpp grammar by extension; kind-keyed consumers still
    // reach cpp through `kindFallback`.
    grammarExtensions: [
      ".c++",
      ".cc",
      ".cpp",
      ".cu",
      ".cuh",
      ".cxx",
      ".hh",
      ".hip",
      ".hpp",
      ".hxx",
      ".inl",
      ".ipp",
      ".tpp",
      ".txx"
    ],
    kindFallback: true
  },
  { id: "csharp", kind: "csharp", extensions: [".cs"], grammar: "csharp" },
  { id: "css", kind: "css", extensions: [".css"], grammar: "css" },
  {
    id: "cue",
    kind: "cue",
    extensions: [".cue"],
    grammar: "cue",
    // The cue grammar and its symbol queries ship, but no extension resolver
    // has ever routed `.cue` to them; kind-keyed consumers reach it anyway.
    grammarExtensions: []
  },
  { id: "dart", kind: "dart", extensions: [".dart"], grammar: "dart" },
  {
    id: "dockerfile",
    kind: "docker",
    extensions: [".dockerfile"],
    filenames: ["Dockerfile"]
  },
  {
    id: "elixir",
    kind: "elixir",
    extensions: [".ex", ".exs"],
    grammar: "elixir"
  },
  { id: "erlang", extensions: [".erl", ".hrl"] },
  { id: "fish", kind: "fish", extensions: [".fish"] },
  { id: "fortran", extensions: [".f", ".f90", ".f95"] },
  { id: "fsharp", kind: "fsharp", extensions: [".fs", ".fsi", ".fsx"] },
  { id: "gleam", kind: "gleam", extensions: [".gleam"] },
  { id: "go", kind: "go", extensions: [".go"], grammar: "go" },
  // go.mod / go.sum: the LSP id is plain `go`, but they are not Go source and
  // file-kinds.ts deliberately does not classify them.
  { id: "go-mod", extensions: [".mod", ".sum"], lspId: "go" },
  { id: "graphql", extensions: [".graphql", ".gql"] },
  { id: "haskell", kind: "haskell", extensions: [".hs", ".lhs"] },
  { id: "helm", kind: "helm-template", extensions: [".tpl"] },
  {
    id: "html",
    kind: "html",
    extensions: [".htm", ".html"],
    grammar: "html",
    grammarExtensions: []
  },
  { id: "java", kind: "java", extensions: [".java"], grammar: "java" },
  {
    id: "javascript",
    kind: "jsts",
    extensions: [".js", ".mjs", ".cjs"],
    grammar: "javascript"
  },
  // `.jsx` is JSX-flavoured JavaScript: its own LSP id, but the plain
  // javascript grammar (which parses JSX) rather than the tsx one.
  {
    id: "javascriptreact",
    kind: "jsts",
    extensions: [".jsx"],
    grammar: "javascript"
  },
  {
    id: "json",
    kind: "json",
    extensions: [".json", ".json5"],
    grammar: "json",
    grammarExtensions: []
  },
  { id: "jsonc", kind: "json", extensions: [".jsonc"] },
  { id: "julia", extensions: [".jl"] },
  {
    id: "kotlin",
    kind: "kotlin",
    extensions: [".kt", ".kts"],
    grammar: "kotlin"
  },
  { id: "lean", kind: "lean", extensions: [".lean"] },
  { id: "less", kind: "css", extensions: [".less"] },
  { id: "lua", kind: "lua", extensions: [".lua"], grammar: "lua" },
  { id: "markdown", kind: "markdown", extensions: [".md", ".mdx"] },
  { id: "nix", kind: "nix", extensions: [".nix"] },
  {
    id: "ocaml",
    kind: "ocaml",
    extensions: [".ml", ".mli"],
    grammar: "ocaml"
  },
  { id: "pascal", extensions: [".pas", ".pp"] },
  { id: "perl", extensions: [".pl", ".pm"] },
  {
    id: "php",
    kind: "php",
    extensions: [".php", ".phtml", ".php3", ".php4", ".php5"],
    grammar: "php"
  },
  {
    id: "powershell",
    kind: "powershell",
    extensions: [".ps1", ".psm1", ".psd1"]
  },
  { id: "prisma", kind: "prisma", extensions: [".prisma"] },
  { id: "proto", extensions: [".proto"] },
  {
    id: "python",
    kind: "python",
    extensions: [".py", ".pyi"],
    grammar: "python",
    // `.pyi` stubs are not routed to the grammar by extension today.
    grammarExtensions: [".py"]
  },
  { id: "r", extensions: [".r"] },
  // Rusty Object Notation: served as `rust` by the LSP seam, not Rust source.
  { id: "ron", extensions: [".ron"], lspId: "rust" },
  {
    id: "ruby",
    kind: "ruby",
    extensions: [".rb", ".rake", ".gemspec", ".ru"],
    grammar: "ruby",
    grammarExtensions: [".rb"]
  },
  { id: "rust", kind: "rust", extensions: [".rs"], grammar: "rust" },
  { id: "sass", kind: "css", extensions: [".sass"] },
  { id: "scala", extensions: [".scala", ".sc"] },
  { id: "scss", kind: "css", extensions: [".scss"] },
  {
    id: "shell",
    kind: "shell",
    extensions: [".sh", ".bash", ".zsh"],
    filenames: ["Makefile"],
    // The LSP spec spells it `shellscript`; the tree-sitter grammar is `bash`.
    lspId: "shellscript",
    grammar: "bash",
    grammarExtensions: [".sh", ".bash"]
  },
  { id: "sql", kind: "sql", extensions: [".sql"] },
  { id: "svelte", kind: "jsts", extensions: [".svelte"] },
  { id: "swift", kind: "swift", extensions: [".swift"], grammar: "swift" },
  { id: "systemverilog", extensions: [".sv"] },
  { id: "terraform", kind: "terraform", extensions: [".tf", ".tfvars"] },
  {
    id: "terragrunt",
    kind: "terragrunt",
    extensions: [],
    filenames: ["terragrunt.hcl", "root.hcl"]
  },
  {
    id: "toml",
    kind: "toml",
    extensions: [".toml"],
    grammar: "toml",
    grammarExtensions: []
  },
  {
    id: "typescript",
    kind: "jsts",
    extensions: [".ts", ".mts", ".cts"],
    grammar: "typescript"
  },
  // `.tsx` needs the tsx grammar (the typescript grammar ERRORs on JSX) and
  // the LSP spec's `typescriptreact` id.
  {
    id: "typescriptreact",
    kind: "jsts",
    extensions: [".tsx"],
    grammar: "tsx"
  },
  { id: "typst", extensions: [".typ", ".typc"] },
  { id: "verilog", extensions: [".v"] },
  { id: "vhdl", extensions: [".vhd", ".vhdl"] },
  {
    id: "vue",
    kind: "jsts",
    extensions: [".vue"],
    grammar: "vue",
    // The vue grammar ships as wasm but no extension resolver routes to it;
    // the jsts fact providers deliberately skip .vue/.svelte (file-kinds.ts).
    grammarExtensions: []
  },
  {
    id: "yaml",
    kind: "yaml",
    extensions: [".yaml", ".yml"],
    grammar: "yaml",
    grammarExtensions: []
  },
  {
    id: "zig",
    kind: "zig",
    extensions: [".zig", ".zon"],
    grammar: "zig",
    grammarExtensions: [".zig"]
  }
];
function lspLanguageId(entry) {
  return entry.lspId ?? entry.id;
}
function grammarExtensionsOf(entry) {
  if (!entry.grammar)
    return [];
  return entry.grammarExtensions ?? entry.extensions;
}
var BY_EXTENSION = /* @__PURE__ */ new Map();
var BY_FILENAME = /* @__PURE__ */ new Map();
for (const entry of LANGUAGES) {
  for (const extension of entry.extensions) {
    BY_EXTENSION.set(extension.toLowerCase(), entry);
  }
  for (const filename of entry.filenames ?? []) {
    BY_FILENAME.set(filename.toLowerCase(), entry);
  }
}
var BY_ID = new Map(LANGUAGES.map((entry) => [entry.id, entry]));
function extensionsForLanguage(id) {
  return BY_ID.get(id)?.extensions ?? [];
}
var GRAMMAR_TO_EXTENSIONS = Object.freeze((() => {
  const byGrammar = /* @__PURE__ */ new Map();
  for (const entry of LANGUAGES) {
    if (!entry.grammar)
      continue;
    const list = byGrammar.get(entry.grammar) ?? [];
    list.push(...entry.extensions);
    byGrammar.set(entry.grammar, list);
  }
  return Object.fromEntries([...byGrammar].map(([grammar, extensions]) => [
    grammar,
    Object.freeze([...new Set(extensions)])
  ]));
})());
function extensionsForLanguageToken(token) {
  return GRAMMAR_TO_EXTENSIONS[token] ?? extensionsForLanguage(token);
}
function basenameOf(filePath) {
  const cut = Math.max(filePath.lastIndexOf("/"), filePath.lastIndexOf("\\"));
  return cut === -1 ? filePath : filePath.slice(cut + 1);
}
function extensionOf(filePath) {
  const base = basenameOf(filePath);
  const dot = base.lastIndexOf(".");
  return dot <= 0 ? "" : base.slice(dot).toLowerCase();
}
var BY_KIND = /* @__PURE__ */ new Map();
{
  const owners = /* @__PURE__ */ new Map();
  for (const entry of LANGUAGES) {
    if (!entry.kind)
      continue;
    const list = owners.get(entry.kind) ?? [];
    list.push(entry);
    owners.set(entry.kind, list);
  }
  for (const [kind, list] of owners) {
    const resolved = list.length === 1 ? list[0] : list.find((entry) => entry.kindFallback);
    if (resolved)
      BY_KIND.set(kind, resolved);
  }
}
function resolveLanguage(filePath) {
  if (!filePath)
    return void 0;
  const base = basenameOf(filePath);
  const byName = BY_FILENAME.get(base.toLowerCase());
  if (byName)
    return byName;
  const byExtension = BY_EXTENSION.get(extensionOf(filePath));
  if (byExtension)
    return byExtension;
  for (const { pattern, kind } of SPECIAL_FILENAMES) {
    if (pattern.test(base))
      return BY_KIND.get(kind);
  }
  return void 0;
}
var EXTENSION_TO_LSP_ID = Object.freeze(Object.fromEntries(LANGUAGES.flatMap((entry) => entry.extensions.map((extension) => [extension, lspLanguageId(entry)]))));
var EXTENSION_TO_GRAMMAR = Object.freeze(Object.fromEntries(LANGUAGES.flatMap((entry) => grammarExtensionsOf(entry).map((extension) => [extension, entry.grammar]))));
var KIND_TO_GRAMMAR = Object.freeze(Object.fromEntries([...BY_KIND.entries()].filter(([, entry]) => Boolean(entry.grammar)).map(([kind, entry]) => [kind, entry.grammar])));
var SCAN_LANGUAGE_PRIORITY = [
  ["typescript", "typescriptreact"],
  ["javascript", "javascriptreact"],
  ["python"],
  ["rust"],
  ["go"],
  ["ruby"],
  ["java"],
  ["kotlin"],
  ["swift"],
  ["csharp"],
  ["cpp"],
  ["c"],
  ["zig"],
  ["haskell"],
  ["elixir"],
  ["gleam"],
  ["terraform"],
  ["nix"],
  ["shell"],
  ["php"],
  ["lua"],
  ["dart"],
  ["vue"],
  ["svelte"],
  ["css", "scss", "less"],
  ["html"],
  ["json", "jsonc"],
  ["yaml"],
  ["toml"],
  ["prisma"],
  ["lean"]
];

export {
  getUserRuleRoot,
  ruleCorpusFingerprintForCycle,
  extensionsForLanguage,
  extensionsForLanguageToken,
  resolveLanguage,
  EXTENSION_TO_LSP_ID,
  EXTENSION_TO_GRAMMAR,
  KIND_TO_GRAMMAR,
  SCAN_LANGUAGE_PRIORITY
};
