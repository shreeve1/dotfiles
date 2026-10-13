import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  loadProjectSnapshotWithoutWordIndex
} from "./chunk-ZXYDQ3TZ.js";
import {
  resolvePackagePath
} from "./chunk-QOZXJ4NA.js";
import {
  TERRAGRUNT_FILENAMES
} from "./chunk-PHDMFAKM.js";
import {
  recordDegradationOnce
} from "./chunk-JAU72XNY.js";
import {
  logLatency
} from "./chunk-QQNQ7SJW.js";
import {
  findNearestContaining,
  normalizeMapKey,
  walkUpDirs
} from "./chunk-N2H3ZPZY.js";

// dist/clients/tool-policy.js
import * as fs from "node:fs";
import * as path from "node:path";
var FORMATTER_POLICY_BY_EXTENSION = /* @__PURE__ */ new Map([
  [
    ".js",
    {
      formatterNames: ["biome", "prettier", "oxfmt"],
      defaultFormatter: "biome",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    }
  ],
  [
    ".jsx",
    {
      formatterNames: ["biome", "prettier", "oxfmt"],
      defaultFormatter: "biome",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    }
  ],
  [
    ".mjs",
    {
      formatterNames: ["biome", "prettier", "oxfmt"],
      defaultFormatter: "biome",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    }
  ],
  [
    ".cjs",
    {
      formatterNames: ["biome", "prettier", "oxfmt"],
      defaultFormatter: "biome",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    }
  ],
  [
    ".ts",
    {
      formatterNames: ["biome", "prettier", "oxfmt"],
      defaultFormatter: "biome",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    }
  ],
  [
    ".tsx",
    {
      formatterNames: ["biome", "prettier", "oxfmt"],
      defaultFormatter: "biome",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    }
  ],
  [
    ".mts",
    {
      formatterNames: ["biome", "prettier", "oxfmt"],
      defaultFormatter: "biome",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    }
  ],
  [
    ".cts",
    {
      formatterNames: ["biome", "prettier", "oxfmt"],
      defaultFormatter: "biome",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    }
  ],
  [
    ".py",
    {
      formatterNames: ["black", "ruff"],
      defaultFormatter: "ruff",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    }
  ],
  [
    ".pyi",
    {
      formatterNames: ["black", "ruff"],
      defaultFormatter: "ruff",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    }
  ],
  [
    ".json",
    {
      formatterNames: ["biome", "prettier"],
      defaultFormatter: "biome",
      defaultWhenUnconfigured: false,
      gate: "mixed"
    }
  ],
  [
    ".jsonc",
    {
      formatterNames: ["biome", "prettier"],
      defaultFormatter: "biome",
      defaultWhenUnconfigured: false,
      gate: "mixed"
    }
  ],
  [
    ".css",
    {
      formatterNames: ["biome", "prettier", "oxfmt"],
      defaultFormatter: "biome",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    }
  ],
  [
    ".scss",
    {
      formatterNames: ["biome", "prettier", "oxfmt"],
      defaultFormatter: "biome",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    }
  ],
  [
    ".sass",
    {
      // #1135: no oxfmt (see map header comment).
      formatterNames: ["biome", "prettier"],
      defaultFormatter: "biome",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    }
  ],
  [
    ".less",
    {
      formatterNames: ["prettier"],
      defaultFormatter: "prettier",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    }
  ],
  [
    ".html",
    {
      formatterNames: ["prettier"],
      defaultFormatter: "prettier",
      // HTML commonly carries template markers ({{JS}} embeds, Handlebars,
      // Helm-adjacent Go templates). Prettier reinterprets them as code and
      // corrupts them. Opt in via project prettier config; do not run by default.
      defaultWhenUnconfigured: false,
      gate: "smart-default"
    }
  ],
  [
    ".htm",
    {
      formatterNames: ["prettier"],
      defaultFormatter: "prettier",
      defaultWhenUnconfigured: false,
      gate: "smart-default"
    }
  ],
  [
    ".yaml",
    {
      formatterNames: ["prettier"],
      defaultFormatter: "prettier",
      // YAML commonly carries template markers (Helm `{{ .Values.x }}`,
      // Ansible `{{ var }}`). Prettier splits `{{` into `{ {` and reindents
      // embedded templates. Opt in via project prettier config.
      defaultWhenUnconfigured: false,
      gate: "smart-default"
    }
  ],
  [
    ".yml",
    {
      formatterNames: ["prettier"],
      defaultFormatter: "prettier",
      defaultWhenUnconfigured: false,
      gate: "smart-default"
    }
  ],
  [
    ".md",
    {
      formatterNames: ["prettier"],
      defaultFormatter: "prettier",
      // Prettier's markdown defaults reflow lines, normalize emphasis (* -> _),
      // and restyle lists. Opt-in via project prettier config; do not run by default.
      defaultWhenUnconfigured: false,
      gate: "smart-default"
    }
  ],
  [
    ".mdx",
    {
      formatterNames: ["prettier"],
      defaultFormatter: "prettier",
      defaultWhenUnconfigured: false,
      gate: "smart-default"
    }
  ],
  [
    ".graphql",
    {
      formatterNames: ["prettier"],
      defaultFormatter: "prettier",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    }
  ],
  [
    ".gql",
    {
      formatterNames: ["prettier"],
      defaultFormatter: "prettier",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    }
  ],
  [
    // ktfmt is offered alongside ktlint but only wins when the project opts in
    // (hasExplicitFormatterConfig("ktfmt")); otherwise ktlint stays the
    // smart-default. #129
    ".kt",
    {
      formatterNames: ["ktfmt", "ktlint"],
      defaultFormatter: "ktlint",
      defaultWhenUnconfigured: false,
      gate: "smart-default"
    }
  ],
  [
    ".kts",
    {
      formatterNames: ["ktfmt", "ktlint"],
      defaultFormatter: "ktlint",
      defaultWhenUnconfigured: false,
      gate: "smart-default"
    }
  ],
  [
    ".swift",
    {
      formatterNames: ["swiftformat"],
      defaultFormatter: "swiftformat",
      defaultWhenUnconfigured: false,
      gate: "config-first"
    }
  ],
  [
    ".fs",
    {
      formatterNames: ["fantomas"],
      defaultFormatter: "fantomas",
      defaultWhenUnconfigured: false,
      gate: "config-first"
    }
  ],
  [
    ".fsi",
    {
      formatterNames: ["fantomas"],
      defaultFormatter: "fantomas",
      defaultWhenUnconfigured: false,
      gate: "config-first"
    }
  ],
  [
    ".fsx",
    {
      formatterNames: ["fantomas"],
      defaultFormatter: "fantomas",
      defaultWhenUnconfigured: false,
      gate: "config-first"
    }
  ],
  [
    ".nix",
    {
      formatterNames: ["nixfmt"],
      defaultFormatter: "nixfmt",
      defaultWhenUnconfigured: false,
      gate: "smart-default"
    }
  ],
  [
    ".ex",
    {
      formatterNames: ["mix"],
      defaultFormatter: "mix",
      defaultWhenUnconfigured: false,
      gate: "config-first"
    }
  ],
  [
    ".exs",
    {
      formatterNames: ["mix"],
      defaultFormatter: "mix",
      defaultWhenUnconfigured: false,
      gate: "config-first"
    }
  ],
  [
    ".eex",
    {
      formatterNames: ["mix"],
      defaultFormatter: "mix",
      defaultWhenUnconfigured: false,
      gate: "config-first"
    }
  ],
  [
    ".heex",
    {
      formatterNames: ["mix"],
      defaultFormatter: "mix",
      defaultWhenUnconfigured: false,
      gate: "config-first"
    }
  ],
  [
    ".leex",
    {
      formatterNames: ["mix"],
      defaultFormatter: "mix",
      defaultWhenUnconfigured: false,
      gate: "config-first"
    }
  ],
  [
    ".gleam",
    {
      formatterNames: ["gleam"],
      defaultFormatter: "gleam",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    }
  ],
  [
    ".typ",
    {
      formatterNames: ["typstyle"],
      defaultFormatter: "typstyle",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    }
  ],
  [
    ".typc",
    {
      formatterNames: ["typstyle"],
      defaultFormatter: "typstyle",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    }
  ],
  [
    ".c",
    {
      formatterNames: ["clang-format"],
      defaultFormatter: "clang-format",
      defaultWhenUnconfigured: false,
      gate: "config-first"
    }
  ],
  [
    ".cc",
    {
      formatterNames: ["clang-format"],
      defaultFormatter: "clang-format",
      defaultWhenUnconfigured: false,
      gate: "config-first"
    }
  ],
  [
    ".cpp",
    {
      formatterNames: ["clang-format"],
      defaultFormatter: "clang-format",
      defaultWhenUnconfigured: false,
      gate: "config-first"
    }
  ],
  [
    ".cxx",
    {
      formatterNames: ["clang-format"],
      defaultFormatter: "clang-format",
      defaultWhenUnconfigured: false,
      gate: "config-first"
    }
  ],
  [
    ".h",
    {
      formatterNames: ["clang-format"],
      defaultFormatter: "clang-format",
      defaultWhenUnconfigured: false,
      gate: "config-first"
    }
  ],
  [
    ".hpp",
    {
      formatterNames: ["clang-format"],
      defaultFormatter: "clang-format",
      defaultWhenUnconfigured: false,
      gate: "config-first"
    }
  ],
  [
    ".ino",
    {
      formatterNames: ["clang-format"],
      defaultFormatter: "clang-format",
      defaultWhenUnconfigured: false,
      gate: "config-first"
    }
  ],
  [
    ".php",
    {
      formatterNames: ["php-cs-fixer"],
      defaultFormatter: "php-cs-fixer",
      defaultWhenUnconfigured: false,
      gate: "config-first"
    }
  ],
  [
    ".cs",
    {
      formatterNames: ["csharpier"],
      defaultFormatter: "csharpier",
      defaultWhenUnconfigured: false,
      gate: "config-first"
    }
  ],
  [
    ".lua",
    {
      formatterNames: ["stylua"],
      defaultFormatter: "stylua",
      defaultWhenUnconfigured: false,
      gate: "config-first"
    }
  ],
  [
    ".hs",
    {
      formatterNames: ["ormolu"],
      defaultFormatter: "ormolu",
      defaultWhenUnconfigured: false,
      gate: "config-first"
    }
  ],
  [
    ".lhs",
    {
      formatterNames: ["ormolu"],
      defaultFormatter: "ormolu",
      defaultWhenUnconfigured: false,
      gate: "config-first"
    }
  ],
  [
    ".ml",
    {
      formatterNames: ["ocamlformat"],
      defaultFormatter: "ocamlformat",
      defaultWhenUnconfigured: false,
      gate: "config-first"
    }
  ],
  [
    ".mli",
    {
      formatterNames: ["ocamlformat"],
      defaultFormatter: "ocamlformat",
      defaultWhenUnconfigured: false,
      gate: "config-first"
    }
  ],
  [
    ".go",
    {
      formatterNames: ["gofmt"],
      defaultFormatter: "gofmt",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    }
  ],
  [
    ".rs",
    {
      formatterNames: ["rustfmt"],
      defaultFormatter: "rustfmt",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    }
  ],
  [
    ".sh",
    {
      formatterNames: ["shfmt"],
      defaultFormatter: "shfmt",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    }
  ],
  [
    ".bash",
    {
      formatterNames: ["shfmt"],
      defaultFormatter: "shfmt",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    }
  ],
  [
    ".toml",
    {
      formatterNames: ["taplo"],
      defaultFormatter: "taplo",
      defaultWhenUnconfigured: false,
      gate: "config-first"
    }
  ],
  [
    ".tf",
    {
      formatterNames: ["terraform"],
      defaultFormatter: "terraform",
      defaultWhenUnconfigured: false,
      gate: "config-first"
    }
  ],
  [
    ".tfvars",
    {
      formatterNames: ["terraform"],
      defaultFormatter: "terraform",
      defaultWhenUnconfigured: false,
      gate: "config-first"
    }
  ],
  [
    ".dart",
    {
      formatterNames: ["dart"],
      defaultFormatter: "dart",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    }
  ],
  [
    ".zig",
    {
      formatterNames: ["zig"],
      defaultFormatter: "zig",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    }
  ],
  [
    ".zon",
    {
      formatterNames: ["zig"],
      defaultFormatter: "zig",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    }
  ],
  [
    ".java",
    {
      formatterNames: ["google-java-format"],
      defaultFormatter: "google-java-format",
      defaultWhenUnconfigured: false,
      gate: "config-first"
    }
  ],
  [
    ".clj",
    {
      formatterNames: ["cljfmt"],
      defaultFormatter: "cljfmt",
      defaultWhenUnconfigured: false,
      gate: "config-first"
    }
  ],
  [
    ".cljc",
    {
      formatterNames: ["cljfmt"],
      defaultFormatter: "cljfmt",
      defaultWhenUnconfigured: false,
      gate: "config-first"
    }
  ],
  [
    ".cljs",
    {
      formatterNames: ["cljfmt"],
      defaultFormatter: "cljfmt",
      defaultWhenUnconfigured: false,
      gate: "config-first"
    }
  ],
  [
    ".cmake",
    {
      formatterNames: ["cmake-format"],
      defaultFormatter: "cmake-format",
      defaultWhenUnconfigured: false,
      gate: "config-first"
    }
  ],
  [
    ".ps1",
    {
      formatterNames: ["psscriptanalyzer-format"],
      defaultFormatter: "psscriptanalyzer-format",
      defaultWhenUnconfigured: false,
      gate: "smart-default"
    }
  ],
  [
    ".psm1",
    {
      formatterNames: ["psscriptanalyzer-format"],
      defaultFormatter: "psscriptanalyzer-format",
      defaultWhenUnconfigured: false,
      gate: "smart-default"
    }
  ],
  [
    ".psd1",
    {
      formatterNames: ["psscriptanalyzer-format"],
      defaultFormatter: "psscriptanalyzer-format",
      defaultWhenUnconfigured: false,
      gate: "smart-default"
    }
  ],
  [
    ".cue",
    {
      formatterNames: ["cue"],
      defaultFormatter: "cue",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    }
  ]
]);
var OXFMT_SUPPORTED_EXTENSIONS = /* @__PURE__ */ new Set([
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".vue",
  ".svelte",
  ".css",
  ".scss",
  ".less",
  ".html",
  ".htm",
  ".json",
  ".jsonc",
  ".yaml",
  ".yml",
  ".md",
  ".mdx",
  ".graphql",
  ".gql",
  ".toml"
]);
FORMATTER_POLICY_BY_EXTENSION.set(".vue", {
  formatterNames: ["prettier"],
  defaultFormatter: "prettier",
  defaultWhenUnconfigured: false,
  gate: "config-first"
});
FORMATTER_POLICY_BY_EXTENSION.set(".svelte", {
  formatterNames: [],
  defaultFormatter: "oxfmt",
  defaultWhenUnconfigured: false,
  gate: "config-first"
});
for (const [ext, policy] of FORMATTER_POLICY_BY_EXTENSION) {
  if (OXFMT_SUPPORTED_EXTENSIONS.has(ext) && !policy.formatterNames.includes("oxfmt")) {
    policy.formatterNames.push("oxfmt");
  }
}
var AUTO_INSTALLABLE_DEFAULT_FORMATTERS = /* @__PURE__ */ new Map([
  ["biome", "biome"],
  ["ruff", "ruff"],
  ["prettier", "prettier"],
  ["shfmt", "shfmt"],
  ["taplo", "taplo"],
  ["ktlint", "ktlint"],
  ["typstyle", "typstyle"]
]);
var TERRAGRUNT_FORMATTER_POLICY = {
  formatterNames: ["terragrunt-hcl"],
  defaultFormatter: "terragrunt-hcl",
  defaultWhenUnconfigured: true,
  gate: "smart-default"
};
var FORMATTER_POLICY_BY_FILENAME = new Map(TERRAGRUNT_FILENAMES.map((name) => [name, TERRAGRUNT_FORMATTER_POLICY]));
function getFormatterPolicyForExtension(ext) {
  return FORMATTER_POLICY_BY_EXTENSION.get(ext.toLowerCase());
}
function getFormatterPolicyForFile(filePath) {
  const byFilename = FORMATTER_POLICY_BY_FILENAME.get(path.basename(filePath).toLowerCase());
  if (byFilename)
    return byFilename;
  return getFormatterPolicyForExtension(path.extname(filePath));
}
function getSmartDefaultFormatterName(filePath) {
  const policy = getFormatterPolicyForFile(filePath);
  if (!policy?.defaultWhenUnconfigured)
    return void 0;
  return policy.defaultFormatter;
}
function getAutoInstallToolIdForFormatter(formatterName) {
  return AUTO_INSTALLABLE_DEFAULT_FORMATTERS.get(formatterName);
}
function getToolExecutionPolicy(toolId) {
  return TOOL_EXECUTION_POLICY.get(toolId);
}
function shouldAutoInstallTool(toolId) {
  return getToolExecutionPolicy(toolId)?.autoInstall ?? false;
}
function getAutofixCapability(toolId) {
  return AUTOFIX_CAPABILITIES.get(toolId);
}
function getToolCommandSpec(toolId) {
  return TOOL_COMMAND_SPECS.get(toolId);
}
var AUTOFIX_CAPABILITIES = /* @__PURE__ */ new Map([
  [
    "biome",
    { toolSupportsFix: true, safePipelineAutofix: true, fixKind: "pipeline" }
  ],
  [
    "eslint",
    { toolSupportsFix: true, safePipelineAutofix: true, fixKind: "pipeline" }
  ],
  [
    "ruff",
    { toolSupportsFix: true, safePipelineAutofix: true, fixKind: "pipeline" }
  ],
  [
    "stylelint",
    { toolSupportsFix: true, safePipelineAutofix: true, fixKind: "pipeline" }
  ],
  [
    "sqlfluff",
    { toolSupportsFix: true, safePipelineAutofix: true, fixKind: "pipeline" }
  ],
  [
    "rubocop",
    { toolSupportsFix: true, safePipelineAutofix: true, fixKind: "pipeline" }
  ],
  [
    "ktlint",
    { toolSupportsFix: true, safePipelineAutofix: true, fixKind: "pipeline" }
  ],
  [
    "ktfmt",
    { toolSupportsFix: true, safePipelineAutofix: true, fixKind: "pipeline" }
  ],
  [
    "rust-clippy",
    { toolSupportsFix: true, safePipelineAutofix: true, fixKind: "pipeline" }
  ],
  [
    "dart-analyze",
    { toolSupportsFix: true, safePipelineAutofix: true, fixKind: "pipeline" }
  ],
  [
    "golangci-lint",
    { toolSupportsFix: true, safePipelineAutofix: true, fixKind: "pipeline" }
  ],
  [
    "detekt",
    { toolSupportsFix: true, safePipelineAutofix: true, fixKind: "pipeline" }
  ],
  [
    "markdownlint",
    { toolSupportsFix: true, safePipelineAutofix: true, fixKind: "pipeline" }
  ],
  [
    "oxlint",
    { toolSupportsFix: true, safePipelineAutofix: true, fixKind: "pipeline" }
  ]
]);
var TOOL_EXECUTION_POLICY = /* @__PURE__ */ new Map([
  // Dispatch/LSP runners use the shared availability/install seam. These
  // managed tools are missing-command repair candidates; probe failures still
  // fail closed before this policy is consulted.
  ["pyright", { gate: "smart-default", autoInstall: true }],
  ["shellcheck", { gate: "smart-default", autoInstall: true }],
  ["shfmt", { gate: "smart-default", autoInstall: true }],
  ["tflint", { gate: "smart-default", autoInstall: true }],
  ["terragrunt", { gate: "smart-default", autoInstall: true }],
  ["trivy", { gate: "config-first", autoInstall: true }],
  ["biome", { gate: "smart-default", autoInstall: true }],
  ["ruff", { gate: "smart-default", autoInstall: true }],
  ["jscpd", { gate: "smart-default", autoInstall: true }],
  ["madge", { gate: "smart-default", autoInstall: true }],
  ["knip", { gate: "smart-default", autoInstall: true }],
  ["ast-grep", { gate: "smart-default", autoInstall: true }],
  ["oxlint", { gate: "smart-default", autoInstall: true }],
  ["stylelint", { gate: "smart-default", autoInstall: true }],
  ["sqlfluff", { gate: "smart-default", autoInstall: true }],
  ["rubocop", { gate: "smart-default", autoInstall: true }],
  ["yamllint", { gate: "smart-default", autoInstall: true }],
  ["actionlint", { gate: "smart-default", autoInstall: true }],
  ["markdownlint", { gate: "smart-default", autoInstall: true }],
  ["mypy", { gate: "config-first", autoInstall: true }],
  ["taplo", { gate: "smart-default", autoInstall: true }],
  ["hadolint", { gate: "smart-default", autoInstall: true }],
  ["helm", { gate: "smart-default", autoInstall: true }],
  ["htmlhint", { gate: "smart-default", autoInstall: true }],
  ["ktlint", { gate: "smart-default", autoInstall: true }],
  // ktfmt is opt-in (a project's explicit formatting choice), so it only runs
  // when its config marker is present — config-first, but auto-installable via
  // the maven-JAR strategy once elected (#129).
  ["ktfmt", { gate: "config-first", autoInstall: true }],
  ["golangci-lint", { gate: "config-first", autoInstall: true }],
  // SpotBugs is opt-in (lens-spotbugs flag) + config-first (needs a Java build
  // descriptor + compiled .class files), auto-installed via the archive
  // strategy when elected (#133).
  ["spotbugs", { gate: "config-first", autoInstall: true }],
  // Opengrep is opt-in (lens-opengrep flag or a discovered rule file) and
  // config-first, but auto-installable via the GitHub single-binary strategy
  // once elected — no login/token required, unlike Semgrep (#111).
  ["opengrep", { gate: "config-first", autoInstall: true }],
  ["phpstan", { gate: "config-first", autoInstall: false }],
  ["eslint", { gate: "config-first", autoInstall: false }],
  ["prettier", { gate: "smart-default", autoInstall: true }],
  ["vale", { gate: "config-first", autoInstall: false }],
  ["swiftlint", { gate: "smart-default", autoInstall: true }]
]);
var TOOL_COMMAND_SPECS = /* @__PURE__ */ new Map([
  [
    "eslint",
    {
      command: "eslint",
      windowsExt: ".cmd",
      versionArgs: ["--version"],
      managedToolId: "eslint"
    }
  ],
  [
    "stylelint",
    {
      command: "stylelint",
      windowsExt: ".cmd",
      versionArgs: ["--version"],
      managedToolId: "stylelint"
    }
  ],
  [
    "sqlfluff",
    {
      command: "sqlfluff",
      windowsExt: ".exe",
      versionArgs: ["--version"],
      managedToolId: "sqlfluff"
    }
  ],
  [
    "oxlint",
    {
      command: "oxlint",
      windowsExt: ".exe",
      versionArgs: ["--version"],
      managedToolId: "oxlint"
    }
  ],
  [
    "ruff",
    {
      command: "ruff",
      windowsExt: ".exe",
      versionArgs: ["--version"],
      managedToolId: "ruff"
    }
  ],
  [
    "biome",
    {
      command: "biome",
      windowsExt: ".cmd",
      versionArgs: ["--version"],
      managedToolId: "biome"
    }
  ],
  [
    "rubocop",
    {
      command: "rubocop",
      versionArgs: ["--version"],
      managedToolId: "rubocop"
    }
  ],
  [
    "yamllint",
    {
      command: "yamllint",
      windowsExt: ".exe",
      versionArgs: ["--version"],
      managedToolId: "yamllint"
    }
  ],
  [
    "actionlint",
    {
      command: "actionlint",
      windowsExt: ".exe",
      versionArgs: ["--version"],
      managedToolId: "actionlint"
    }
  ],
  [
    "markdownlint",
    {
      command: "markdownlint-cli2",
      windowsExt: ".cmd",
      versionArgs: ["--no-globs", "-"],
      managedToolId: "markdownlint"
    }
  ],
  [
    "vale",
    {
      command: "vale",
      windowsExt: ".exe",
      versionArgs: ["--version"],
      managedToolId: "vale"
    }
  ],
  [
    "swiftlint",
    {
      command: "swiftlint",
      versionArgs: ["--version"],
      managedToolId: "swiftlint"
    }
  ],
  [
    "mypy",
    {
      command: "mypy",
      versionArgs: ["--version"],
      managedToolId: "mypy"
    }
  ],
  [
    "phpstan",
    {
      command: "phpstan",
      windowsExt: ".bat",
      versionArgs: ["--version"],
      managedToolId: "phpstan"
    }
  ],
  [
    "taplo",
    {
      command: "taplo",
      windowsExt: ".exe",
      versionArgs: ["--version"],
      managedToolId: "taplo"
    }
  ],
  [
    "hadolint",
    {
      command: "hadolint",
      windowsExt: ".exe",
      versionArgs: ["--version"],
      managedToolId: "hadolint"
    }
  ],
  [
    "htmlhint",
    {
      command: "htmlhint",
      versionArgs: ["--version"],
      managedToolId: "htmlhint"
    }
  ],
  [
    "ktlint",
    {
      command: "ktlint",
      windowsExt: ".exe",
      versionArgs: ["--version"],
      managedToolId: "ktlint"
    }
  ],
  [
    "prettier",
    {
      command: "prettier",
      windowsExt: ".cmd",
      versionArgs: ["--version"],
      managedToolId: "prettier"
    }
  ]
]);
var STYLELINT_CONFIGS = [
  ".stylelintrc",
  ".stylelintrc.json",
  ".stylelintrc.jsonc",
  ".stylelintrc.yaml",
  ".stylelintrc.yml",
  ".stylelintrc.js",
  ".stylelintrc.cjs",
  "stylelint.config.js",
  "stylelint.config.cjs",
  "stylelint.config.mjs"
];
var SQLFLUFF_CONFIGS = [
  ".sqlfluff",
  "pyproject.toml",
  "setup.cfg",
  "tox.ini"
];
var RUBOCOP_CONFIGS = [".rubocop.yml", ".rubocop.yaml"];
var MYPY_CONFIGS = ["mypy.ini", ".mypy.ini", "setup.cfg", "pyproject.toml"];
var YAMLLINT_CONFIGS = [
  ".yamllint",
  ".yamllint.yml",
  ".yamllint.yaml",
  "pyproject.toml",
  "setup.cfg",
  "tox.ini"
];
var MARKDOWNLINT_CONFIGS = [
  // markdownlint-cli2's built-in config names (keep this list in sync with
  // the installed CLI's supported configuration file names).
  ".markdownlint-cli2.jsonc",
  ".markdownlint-cli2.yaml",
  ".markdownlint-cli2.yml",
  ".markdownlint-cli2.cjs",
  ".markdownlint-cli2.mjs",
  ".markdownlint.jsonc",
  ".markdownlint.json",
  ".markdownlint.yaml",
  ".markdownlint.yml",
  ".markdownlint.cjs",
  ".markdownlint.mjs",
  // Retain the legacy detector name for compatibility with existing policy
  // behavior, even though current markdownlint-cli2 versions do not prefer it.
  ".markdownlintrc"
];
var PRETTIER_CONFIGS = [
  ".prettierrc",
  ".prettierrc.json",
  ".prettierrc.yml",
  ".prettierrc.yaml",
  ".prettierrc.js",
  ".prettierrc.cjs",
  ".prettierrc.mjs",
  "prettier.config.js",
  "prettier.config.cjs",
  "prettier.config.mjs",
  "prettier.config.ts"
];
var RUFF_PROJECT_CONFIGS = ["ruff.toml", ".ruff.toml"];
var GOLANGCI_CONFIGS = [
  ".golangci.yml",
  ".golangci.yaml",
  ".golangci.toml",
  ".golangci.json"
];
var PHPSTAN_CONFIGS = [
  "phpstan.neon",
  "phpstan.neon.dist",
  "phpstan.dist.neon"
];
var VITE_CONFIGS = [
  "vite.config.ts",
  "vite.config.mts",
  "vite.config.cts",
  "vite.config.js",
  "vite.config.mjs",
  "vite.config.cjs"
];
function getLinterPolicyForFile(filePath, context = {}) {
  const ext = path.extname(filePath).toLowerCase();
  if ([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"].includes(ext)) {
    const policy = getJstsLintPolicy({
      hasEslintConfig: context.hasEslintConfig,
      hasOxlintConfig: context.hasOxlintConfig,
      hasBiomeConfig: context.hasBiomeConfig
    });
    return {
      runnerNames: ["eslint", "oxlint", "biome-check-json"],
      preferredRunners: policy.preferredRunners,
      defaultRunner: policy.preferredRunners[0],
      defaultWhenUnconfigured: !policy.hasEslintConfig && !policy.hasOxlintConfig,
      gate: policy.hasEslintConfig ? "config-first" : "smart-default"
    };
  }
  if ([".py", ".pyi"].includes(ext)) {
    const preferredRunners = ["ruff-lint"];
    if (context.hasMypyConfig)
      preferredRunners.push("mypy");
    return {
      runnerNames: ["ruff-lint", "mypy"],
      preferredRunners,
      defaultRunner: "ruff-lint",
      defaultWhenUnconfigured: true,
      gate: context.hasMypyConfig ? "mixed" : "smart-default"
    };
  }
  if ([".css", ".scss", ".sass", ".less"].includes(ext)) {
    return {
      runnerNames: ["stylelint"],
      preferredRunners: ["stylelint"],
      defaultRunner: "stylelint",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    };
  }
  if (ext === ".sql") {
    return {
      runnerNames: ["sqlfluff"],
      preferredRunners: ["sqlfluff"],
      defaultRunner: "sqlfluff",
      defaultWhenUnconfigured: false,
      gate: "config-first"
    };
  }
  if ([".rb", ".rake", ".gemspec", ".ru"].includes(ext)) {
    return {
      runnerNames: ["rubocop"],
      preferredRunners: ["rubocop"],
      defaultRunner: "rubocop",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    };
  }
  if ([".yaml", ".yml"].includes(ext)) {
    return {
      runnerNames: ["yamllint"],
      preferredRunners: ["yamllint"],
      defaultRunner: "yamllint",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    };
  }
  if ([".md", ".mdx"].includes(ext)) {
    return {
      runnerNames: ["markdownlint"],
      preferredRunners: ["markdownlint"],
      defaultRunner: "markdownlint",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    };
  }
  if ([".html", ".htm"].includes(ext)) {
    return {
      runnerNames: ["htmlhint"],
      preferredRunners: ["htmlhint"],
      defaultRunner: "htmlhint",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    };
  }
  if (path.basename(filePath).toLowerCase() === "dockerfile") {
    return {
      runnerNames: ["hadolint"],
      preferredRunners: ["hadolint"],
      defaultRunner: "hadolint",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    };
  }
  if (TERRAGRUNT_FILENAMES.includes(path.basename(filePath).toLowerCase())) {
    return {
      runnerNames: ["terragrunt"],
      preferredRunners: ["terragrunt"],
      defaultRunner: "terragrunt",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    };
  }
  if ([".kt", ".kts"].includes(ext)) {
    const preferredRunners = [];
    if (!context.hasKtfmtConfig)
      preferredRunners.push("ktlint");
    if (context.hasDetektConfig)
      preferredRunners.push("detekt");
    return {
      runnerNames: ["ktlint", "detekt"],
      preferredRunners,
      defaultRunner: preferredRunners[0],
      defaultWhenUnconfigured: true,
      gate: context.hasKtfmtConfig ? "config-first" : context.hasDetektConfig ? "mixed" : "smart-default"
    };
  }
  if (ext === ".toml") {
    return {
      runnerNames: ["taplo"],
      preferredRunners: ["taplo"],
      defaultRunner: "taplo",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    };
  }
  if (ext === ".go") {
    return {
      runnerNames: ["golangci-lint"],
      preferredRunners: context.hasGolangciConfig ? ["golangci-lint"] : [],
      defaultRunner: "golangci-lint",
      defaultWhenUnconfigured: false,
      gate: "config-first"
    };
  }
  if (ext === ".php") {
    return {
      runnerNames: ["phpstan"],
      preferredRunners: context.hasPhpstanConfig ? ["phpstan"] : [],
      defaultRunner: "phpstan",
      defaultWhenUnconfigured: false,
      gate: "config-first"
    };
  }
  if (ext === ".rs") {
    return {
      runnerNames: ["rust-clippy"],
      preferredRunners: ["rust-clippy"],
      defaultRunner: "rust-clippy",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    };
  }
  if ([".sh", ".bash"].includes(ext)) {
    return {
      runnerNames: ["shellcheck"],
      preferredRunners: ["shellcheck"],
      defaultRunner: "shellcheck",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    };
  }
  if (ext === ".fish") {
    return {
      runnerNames: ["fish-indent"],
      preferredRunners: ["fish-indent"],
      defaultRunner: "fish-indent",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    };
  }
  if ([".tf", ".tfvars"].includes(ext)) {
    return {
      runnerNames: ["tflint"],
      preferredRunners: ["tflint"],
      defaultRunner: "tflint",
      defaultWhenUnconfigured: true,
      gate: context.hasTflintConfig ? "config-first" : "smart-default"
    };
  }
  if ([".ex", ".exs", ".eex", ".heex", ".leex"].includes(ext)) {
    return {
      runnerNames: ["credo"],
      preferredRunners: ["credo"],
      defaultRunner: "credo",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    };
  }
  if ([".c", ".cc", ".cpp", ".cxx", ".h", ".hpp", ".ino"].includes(ext)) {
    return {
      runnerNames: ["cpp-check"],
      preferredRunners: ["cpp-check"],
      defaultRunner: "cpp-check",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    };
  }
  if (ext === ".dart") {
    return {
      runnerNames: ["dart-analyze"],
      preferredRunners: ["dart-analyze"],
      defaultRunner: "dart-analyze",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    };
  }
  if (ext === ".gleam") {
    return {
      runnerNames: ["gleam-check"],
      preferredRunners: ["gleam-check"],
      defaultRunner: "gleam-check",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    };
  }
  if ([".ps1", ".psm1", ".psd1"].includes(ext)) {
    return {
      runnerNames: ["psscriptanalyzer"],
      preferredRunners: ["psscriptanalyzer"],
      defaultRunner: "psscriptanalyzer",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    };
  }
  if (ext === ".prisma") {
    return {
      runnerNames: ["prisma-validate"],
      preferredRunners: ["prisma-validate"],
      defaultRunner: "prisma-validate",
      defaultWhenUnconfigured: true,
      gate: "smart-default"
    };
  }
  return void 0;
}
function getCachedProjectConventions(cwd) {
  const snapshot = loadProjectSnapshotWithoutWordIndex(cwd);
  return snapshot?.conventions;
}
function getLinterPolicyForCwd(filePath, cwd) {
  const context = {
    hasEslintConfig: hasEslintConfig(cwd),
    hasOxlintConfig: hasOxlintConfig(cwd),
    hasBiomeConfig: hasBiomeConfig(cwd),
    hasStylelintConfig: hasStylelintConfig(cwd),
    hasSqlfluffConfig: hasSqlfluffConfig(cwd),
    hasRubocopConfig: hasRubocopConfig(cwd),
    hasYamllintConfig: hasYamllintConfig(cwd),
    hasMarkdownlintConfig: hasMarkdownlintConfig(cwd),
    hasGolangciConfig: hasGolangciConfig(cwd),
    hasPhpstanConfig: hasPhpstanConfig(cwd),
    hasMypyConfig: hasMypyConfig(cwd),
    hasDetektConfig: hasDetektConfig(cwd),
    hasKtfmtConfig: hasKtfmtConfig(cwd),
    // From the file's directory, not cwd: a `.tflint.hcl` in a terraform
    // subdirectory is invisible to an upward walk that starts at the repo root.
    hasTflintConfig: hasTflintConfig(path.dirname(path.resolve(cwd, filePath)))
  };
  const policy = getLinterPolicyForFile(filePath, context);
  if (policy) {
    const conventions = getCachedProjectConventions(cwd);
    if (conventions && conventions.frameworks.length > 0) {
      policy.frameworkHints = conventions.frameworks.map((f) => f.id);
    }
  }
  logLatency({
    type: "phase",
    phase: "linter_selected",
    filePath,
    durationMs: 0,
    metadata: {
      runner: policy?.defaultRunner ?? null,
      gate: policy?.gate ?? null,
      cwd,
      context,
      frameworkHints: policy?.frameworkHints ?? null
    }
  });
  return policy;
}
var ESLINT_FLAT_CONFIGS = [
  "eslint.config.js",
  "eslint.config.mjs",
  "eslint.config.cjs",
  "eslint.config.ts",
  "eslint.config.mts",
  "eslint.config.cts"
];
var ESLINT_LEGACY_CONFIGS = [
  ".eslintrc",
  ".eslintrc.js",
  ".eslintrc.cjs",
  ".eslintrc.json",
  ".eslintrc.yaml",
  ".eslintrc.yml"
];
function* walkUpDirsUntilPackageJson(cwd) {
  for (const dir of walkUpDirs(cwd)) {
    yield dir;
    if (fs.existsSync(path.join(dir, "package.json")))
      return;
  }
}
function findNearestPackageJsonPath(cwd) {
  let dir = cwd;
  const root = path.parse(dir).root;
  while (true) {
    const pkgPath = path.join(dir, "package.json");
    if (fs.existsSync(pkgPath))
      return pkgPath;
    if (dir === root)
      break;
    const parent = path.dirname(dir);
    if (parent === dir)
      break;
    dir = parent;
  }
  return void 0;
}
function hasNearestPackageJsonDependency(cwd, dependencyName) {
  const pkgPath = findNearestPackageJsonPath(cwd);
  if (!pkgPath)
    return false;
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    return Boolean(pkg.dependencies?.[dependencyName] ?? pkg.devDependencies?.[dependencyName]);
  } catch {
  }
  return false;
}
function hasNearestPackageJsonField(cwd, fieldName) {
  const pkgPath = findNearestPackageJsonPath(cwd);
  if (!pkgPath)
    return false;
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    return pkg[fieldName] !== void 0;
  } catch {
  }
  return false;
}
function hasEslintConfig(cwd) {
  for (const dir of walkUpDirs(cwd)) {
    for (const cfg of ESLINT_FLAT_CONFIGS) {
      if (fs.existsSync(path.join(dir, cfg)))
        return true;
    }
  }
  for (const dir of walkUpDirsUntilPackageJson(cwd)) {
    for (const cfg of ESLINT_LEGACY_CONFIGS) {
      if (fs.existsSync(path.join(dir, cfg)))
        return true;
    }
    const pkgPath = path.join(dir, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        if (JSON.parse(fs.readFileSync(pkgPath, "utf-8")).eslintConfig)
          return true;
      } catch {
      }
    }
  }
  return false;
}
function hasBiomeConfig(cwd) {
  return getBiomeConfigPath(cwd) !== void 0;
}
function getBiomeConfigPath(cwd) {
  for (const dir of walkUpDirs(cwd)) {
    const jsoncPath = path.join(dir, "biome.jsonc");
    if (fs.existsSync(jsoncPath))
      return jsoncPath;
    const jsonPath = path.join(dir, "biome.json");
    if (fs.existsSync(jsonPath))
      return jsonPath;
  }
  return void 0;
}
function hasOxfmtConfig(cwd) {
  for (const dir of walkUpDirs(cwd)) {
    if (fs.existsSync(path.join(dir, "oxfmt.toml")))
      return true;
    if (fs.existsSync(path.join(dir, ".oxfmtrc.json")))
      return true;
    if (hasVitePlusConfig(dir))
      return true;
    const pkgPath = path.join(dir, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
        const deps = {
          ...pkg.dependencies,
          ...pkg.devDependencies
        };
        if (deps["oxfmt"] || deps["@oxc-project/oxfmt"])
          return true;
      } catch {
      }
    }
  }
  return false;
}
var OXFMT_SVELTE_TOML_TRUE = /(^|\n)\s*svelte\s*=\s*true\s*(\s*#.*)?(\r?\n|$)/;
function hasOxfmtSvelteConfig(cwd) {
  if (!hasNearestPackageJsonDependency(cwd, "svelte"))
    return false;
  for (const dir of walkUpDirs(cwd)) {
    const rcPath = path.join(dir, ".oxfmtrc.json");
    if (fs.existsSync(rcPath)) {
      try {
        const cfg = JSON.parse(fs.readFileSync(rcPath, "utf-8"));
        if (cfg.svelte === true)
          return true;
      } catch {
      }
    }
    const tomlPath = path.join(dir, "oxfmt.toml");
    if (fs.existsSync(tomlPath)) {
      try {
        const content = fs.readFileSync(tomlPath, "utf-8");
        if (OXFMT_SVELTE_TOML_TRUE.test(content))
          return true;
      } catch {
      }
    }
  }
  return false;
}
function hasStylelintConfig(cwd) {
  for (const dir of walkUpDirs(cwd)) {
    if (STYLELINT_CONFIGS.some((cfg) => fs.existsSync(path.join(dir, cfg)))) {
      return true;
    }
    const pkgPath = path.join(dir, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
        if (pkg.stylelint)
          return true;
      } catch {
      }
    }
  }
  return false;
}
function hasSqlfluffConfig(cwd) {
  for (const dir of walkUpDirs(cwd)) {
    for (const cfg of SQLFLUFF_CONFIGS) {
      const cfgPath = path.join(dir, cfg);
      if (!fs.existsSync(cfgPath))
        continue;
      if (cfg === "pyproject.toml") {
        try {
          const content = fs.readFileSync(cfgPath, "utf-8");
          if (content.includes("[tool.sqlfluff]"))
            return true;
        } catch {
        }
        continue;
      }
      if (cfg === "setup.cfg" || cfg === "tox.ini") {
        try {
          const content = fs.readFileSync(cfgPath, "utf-8");
          if (content.includes("[sqlfluff]"))
            return true;
        } catch {
        }
        continue;
      }
      return true;
    }
  }
  for (const dir of walkUpDirs(cwd)) {
    for (const depFile of ["requirements.txt", "Pipfile", "pyproject.toml"]) {
      const depPath = path.join(dir, depFile);
      if (!fs.existsSync(depPath))
        continue;
      try {
        const content = fs.readFileSync(depPath, "utf-8").toLowerCase();
        if (content.includes("sqlfluff"))
          return true;
      } catch {
      }
    }
  }
  return false;
}
function hasRubocopConfig(cwd) {
  for (const dir of walkUpDirs(cwd)) {
    for (const cfg of RUBOCOP_CONFIGS) {
      if (fs.existsSync(path.join(dir, cfg)))
        return true;
    }
    const gemfile = path.join(dir, "Gemfile");
    if (fs.existsSync(gemfile)) {
      try {
        const content = fs.readFileSync(gemfile, "utf-8");
        if (content.includes("rubocop"))
          return true;
      } catch {
      }
    }
  }
  return false;
}
function hasMypyConfig(cwd) {
  for (const dir of walkUpDirs(cwd)) {
    for (const cfg of MYPY_CONFIGS) {
      const cfgPath = path.join(dir, cfg);
      if (!fs.existsSync(cfgPath))
        continue;
      if (cfg === "setup.cfg") {
        try {
          if (fs.readFileSync(cfgPath, "utf-8").includes("[mypy]"))
            return true;
        } catch {
        }
        continue;
      }
      if (cfg === "pyproject.toml") {
        try {
          if (fs.readFileSync(cfgPath, "utf-8").includes("[tool.mypy]"))
            return true;
        } catch {
        }
        continue;
      }
      return true;
    }
  }
  return false;
}
function hasYamllintConfig(cwd) {
  for (const dir of walkUpDirs(cwd)) {
    for (const cfg of YAMLLINT_CONFIGS) {
      const cfgPath = path.join(dir, cfg);
      if (!fs.existsSync(cfgPath))
        continue;
      if (cfg === "pyproject.toml") {
        try {
          const content = fs.readFileSync(cfgPath, "utf-8");
          if (content.includes("[tool.yamllint]"))
            return true;
        } catch {
        }
        continue;
      }
      if (cfg === "setup.cfg" || cfg === "tox.ini") {
        try {
          const content = fs.readFileSync(cfgPath, "utf-8");
          if (content.includes("[yamllint]"))
            return true;
        } catch {
        }
        continue;
      }
      return true;
    }
  }
  for (const dir of walkUpDirs(cwd)) {
    for (const depFile of ["requirements.txt", "Pipfile", "pyproject.toml"]) {
      const depPath = path.join(dir, depFile);
      if (!fs.existsSync(depPath))
        continue;
      try {
        const content = fs.readFileSync(depPath, "utf-8").toLowerCase();
        if (content.includes("yamllint"))
          return true;
      } catch {
      }
    }
  }
  return false;
}
function hasMarkdownlintConfig(cwd) {
  return findNearestContaining(cwd, MARKDOWNLINT_CONFIGS) !== void 0;
}
function hasPrettierConfig(cwd) {
  for (const dir of walkUpDirs(cwd)) {
    if (PRETTIER_CONFIGS.some((cfg) => fs.existsSync(path.join(dir, cfg))))
      return true;
    const pkgPath = path.join(dir, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
        if (Object.hasOwn(pkg, "prettier"))
          return true;
      } catch {
      }
    }
  }
  return false;
}
function hasBlackConfig(cwd) {
  for (const dir of walkUpDirs(cwd)) {
    const pyproject = path.join(dir, "pyproject.toml");
    if (fs.existsSync(pyproject)) {
      try {
        if (fs.readFileSync(pyproject, "utf-8").includes("[tool.black]"))
          return true;
      } catch {
      }
    }
  }
  for (const dir of walkUpDirs(cwd)) {
    for (const depFile of ["requirements.txt", "Pipfile"]) {
      const depPath = path.join(dir, depFile);
      if (!fs.existsSync(depPath))
        continue;
      try {
        if (fs.readFileSync(depPath, "utf-8").toLowerCase().includes("black"))
          return true;
      } catch {
      }
    }
  }
  return false;
}
function hasRuffConfig(cwd) {
  for (const dir of walkUpDirs(cwd)) {
    for (const cfg of RUFF_PROJECT_CONFIGS) {
      if (fs.existsSync(path.join(dir, cfg)))
        return true;
    }
    const pyproject = path.join(dir, "pyproject.toml");
    if (fs.existsSync(pyproject)) {
      try {
        if (fs.readFileSync(pyproject, "utf-8").includes("[tool.ruff]"))
          return true;
      } catch {
      }
    }
  }
  return false;
}
function configArgsWithFallback(hasConfig, toolArgs, packageConfigPath) {
  return hasConfig ? [] : [...toolArgs, resolvePackagePath(import.meta.url, packageConfigPath)];
}
function markdownlintConfigArgs(cwd) {
  return configArgsWithFallback(hasMarkdownlintConfig(cwd), ["--config"], "config/markdownlint/core.json");
}
function ruffConfigArgs(cwd) {
  return configArgsWithFallback(hasRuffConfig(cwd), ["--config"], "config/ruff/core.toml");
}
function biomeConfigArgs(cwd) {
  if (getBiomeConfigPath(cwd))
    return [];
  return [
    "--config-path=" + resolvePackagePath(import.meta.url, "config/biome/core.jsonc")
  ];
}
function hasGolangciConfig(cwd) {
  return findNearestContaining(cwd, GOLANGCI_CONFIGS) !== void 0;
}
function hasTflintConfig(startDir) {
  return findNearestContaining(startDir, [".tflint.hcl"]) !== void 0;
}
function hasClangFormatConfig(cwd) {
  return findNearestContaining(cwd, [".clang-format", "_clang-format"]) !== void 0;
}
function hasPhpCsFixerConfig(cwd) {
  return findNearestContaining(cwd, [
    ".php-cs-fixer.php",
    ".php-cs-fixer.dist.php"
  ]) !== void 0;
}
function hasStyluaConfig(cwd) {
  return findNearestContaining(cwd, ["stylua.toml", ".stylua.toml"]) !== void 0;
}
function hasOcamlformatConfig(cwd) {
  return findNearestContaining(cwd, [".ocamlformat"]) !== void 0;
}
function hasGoogleJavaFormatConfig(cwd) {
  return findNearestContaining(cwd, [".google-java-format", ".editorconfig"]) !== void 0;
}
function hasCljfmtConfig(cwd) {
  return findNearestContaining(cwd, [".cljfmt.edn", "cljfmt.edn", ".cljfmt"]) !== void 0;
}
function hasCmakeFormatConfig(cwd) {
  return findNearestContaining(cwd, [
    ".cmake-format",
    ".cmake-format.yaml",
    ".cmake-format.yml",
    ".cmake-format.json",
    ".cmake-format.py",
    "cmake-format.yaml",
    "cmake-format.yml"
  ]) !== void 0;
}
var PSSCRIPTANALYZER_SETTINGS_FILES = [
  "PSScriptAnalyzerSettings.psd1",
  "ScriptAnalyzerSettings.psd1"
];
function findPSScriptAnalyzerConfigPath(cwd) {
  for (const dir of walkUpDirs(cwd)) {
    for (const name of PSSCRIPTANALYZER_SETTINGS_FILES) {
      const candidate = path.join(dir, name);
      if (fs.existsSync(candidate))
        return candidate;
    }
  }
  return void 0;
}
function hasPSScriptAnalyzerConfig(cwd) {
  return findPSScriptAnalyzerConfigPath(cwd) !== void 0;
}
function hasCsharpierConfig(cwd) {
  return findNearestContaining(cwd, [
    ".csharpierrc",
    ".csharpierrc.json",
    ".csharpierrc.yaml",
    ".csharpierrc.yml"
  ]) !== void 0;
}
function hasOrmoluConfig(cwd) {
  return findNearestContaining(cwd, [".ormolu"]) !== void 0;
}
function hasTaploConfig(cwd) {
  return findNearestContaining(cwd, ["taplo.toml", ".taplo.toml"]) !== void 0;
}
function hasTerraformConfig(cwd) {
  return findNearestContaining(cwd, [".terraform.lock.hcl"]) !== void 0;
}
function hasSwiftformatConfig(cwd) {
  return findNearestContaining(cwd, [".swiftformat"]) !== void 0;
}
function hasFantomasConfig(cwd) {
  return findNearestContaining(cwd, [".fantomasignore", ".editorconfig"]) !== void 0;
}
function hasMixFormatConfig(cwd) {
  return findNearestContaining(cwd, [".formatter.exs"]) !== void 0;
}
function hasPhpstanConfig(cwd) {
  return findNearestContaining(cwd, PHPSTAN_CONFIGS) !== void 0;
}
var DETEKT_CONFIGS = [
  "detekt.yml",
  ".detekt.yml",
  path.join("config", "detekt", "detekt.yml"),
  path.join("detekt", "detekt.yml")
];
function hasDetektConfig(cwd) {
  for (const dir of walkUpDirs(cwd)) {
    if (DETEKT_CONFIGS.some((cfg) => fs.existsSync(path.join(dir, cfg))))
      return true;
  }
  return false;
}
var KTFMT_CONFIG_FILES = [".ktfmt", ".ktfmt.kts"];
var KTFMT_GRADLE_FILES = [
  "build.gradle.kts",
  "build.gradle",
  "settings.gradle.kts",
  "settings.gradle"
];
var KOTLIN_GRADLE_FILES = [
  "build.gradle.kts",
  "build.gradle",
  "settings.gradle.kts",
  "settings.gradle"
];
var GRADLE_KTLINT_PLUGIN_PATTERN = /(?:id\s*\(\s*|id\s+|apply\s+plugin\s*:\s*)["']org\.jlleitschuh\.gradle\.ktlint["']/g;
var GRADLE_BUILD_LOGIC_DIRS = ["buildSrc", "build-logic"];
var GRADLE_BUILD_LOGIC_EXTENSIONS = [".gradle", ".gradle.kts", ".kt"];
var GRADLE_INCLUDE_BUILD_PATTERN = /\bincludeBuild\s*\(\s*["']([^"']+)["']/g;
var GRADLE_BUILD_LOGIC_SCAN_MAX_ENTRIES = 1e4;
var spotlessKotlinConfigCache = /* @__PURE__ */ new Map();
var spotlessGradleReadCount = 0;
function stripGradleCommentsAndStrings(source) {
  let result = "";
  let state = "code";
  let quote = "";
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (state === "code") {
      if (char === "/" && next === "/") {
        result += "  ";
        index += 1;
        state = "line-comment";
      } else if (char === "/" && next === "*") {
        result += "  ";
        index += 1;
        state = "block-comment";
      } else if (char === '"' || char === "'") {
        result += " ";
        quote = char;
        state = "string";
      } else {
        result += char;
      }
      continue;
    }
    if (state === "line-comment") {
      if (char === "\n" || char === "\r") {
        result += char;
        state = "code";
      } else {
        result += " ";
      }
      continue;
    }
    if (state === "block-comment") {
      if (char === "*" && next === "/") {
        result += "  ";
        index += 1;
        state = "code";
      } else {
        result += char === "\n" || char === "\r" ? char : " ";
      }
      continue;
    }
    if (char === "\\") {
      result += " ";
      if (index + 1 < source.length) {
        result += source[index + 1] === "\n" ? "\n" : " ";
        index += 1;
      }
    } else if (char === quote) {
      result += " ";
      state = "code";
    } else {
      result += char === "\n" || char === "\r" ? char : " ";
    }
  }
  return result;
}
var GRADLE_IDENTIFIER_CHAR = /[A-Za-z0-9_$]/;
function gradleBlockNameBefore(source, open) {
  let index = open - 1;
  while (index >= 0 && /\s/.test(source[index]))
    index -= 1;
  const end = index + 1;
  while (index >= 0 && GRADLE_IDENTIFIER_CHAR.test(source[index]))
    index -= 1;
  return source.slice(index + 1, end);
}
function gradleBlockRanges(source) {
  const ranges = [];
  const opens = [];
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") {
      opens.push(index);
      continue;
    }
    if (char !== "}")
      continue;
    const open = opens.pop();
    if (open === void 0)
      continue;
    ranges.push({
      name: gradleBlockNameBefore(source, open),
      start: open + 1,
      end: index
    });
  }
  return ranges.sort((a, b) => a.start - b.start);
}
function namedGradleBlockRanges(source, name) {
  return gradleBlockRanges(source).filter((range) => range.name === name);
}
function namedGradleBlockBodies(source, name) {
  return namedGradleBlockRanges(source, name).map((range) => source.slice(range.start, range.end));
}
function getSpotlessKotlinFormatter(cwd) {
  for (const dir of walkUpDirs(cwd)) {
    for (const gradle of KOTLIN_GRADLE_FILES) {
      const filePath = path.join(dir, gradle);
      if (!fs.existsSync(filePath))
        continue;
      try {
        const mtime = fs.statSync(filePath).mtimeMs;
        let config = spotlessKotlinConfigCache.get(filePath);
        if (!config || config.mtime !== mtime) {
          const source = stripGradleCommentsAndStrings(fs.readFileSync(filePath, "utf-8"));
          spotlessGradleReadCount += 1;
          const kotlinBodies = namedGradleBlockBodies(source, "spotless").flatMap((spotless) => namedGradleBlockBodies(spotless, "kotlin"));
          config = {
            mtime,
            ktlintConfig: kotlinBodies.some((body) => /\bktlint\s*\(/.test(body)),
            ktfmtConfig: kotlinBodies.some((body) => /\bktfmt\s*\(/.test(body))
          };
          spotlessKotlinConfigCache.set(filePath, config);
        }
        if (config.ktlintConfig)
          return "ktlint";
        if (config.ktfmtConfig)
          return "ktfmt";
      } catch {
      }
    }
  }
  return void 0;
}
function hasKtlintConfig(cwd) {
  return getSpotlessKotlinFormatter(cwd) === "ktlint";
}
function hasGradleKtlintPlugin(cwd) {
  const files = /* @__PURE__ */ new Set();
  const scan = { entries: 0, exceeded: false, indeterminate: false };
  for (const dir of walkUpDirs(cwd)) {
    for (const gradle of KOTLIN_GRADLE_FILES) {
      const filePath = path.join(dir, gradle);
      if (fs.existsSync(filePath))
        files.add(filePath);
    }
    for (const buildLogicDir of GRADLE_BUILD_LOGIC_DIRS) {
      if (!addGradleBuildLogicFiles(path.join(dir, buildLogicDir), files, scan)) {
        scan.exceeded = true;
      }
    }
    for (const settings of ["settings.gradle.kts", "settings.gradle"]) {
      const settingsPath = path.join(dir, settings);
      if (!fs.existsSync(settingsPath))
        continue;
      try {
        const raw = fs.readFileSync(settingsPath, "utf-8");
        const stripped = stripGradleCommentsAndStrings(raw);
        GRADLE_INCLUDE_BUILD_PATTERN.lastIndex = 0;
        let match;
        while ((match = GRADLE_INCLUDE_BUILD_PATTERN.exec(raw)) !== null) {
          const code = stripped.slice(match.index, match.index + match[0].length);
          const includedBuild = match[1];
          if (includedBuild && /^\s*includeBuild\s*\(\s*/.test(code)) {
            if (!addGradleBuildLogicFiles(path.resolve(dir, includedBuild), files, scan)) {
              scan.exceeded = true;
            }
          }
        }
      } catch {
        scan.indeterminate = true;
      }
    }
  }
  if (scan.exceeded) {
    recordDegradationOnce({
      kind: "gradle-ktlint-scan-budget-exceeded",
      subject: "ktlint:gradle-build-logic",
      reason: `Gradle build-logic ownership scan exceeded its ${GRADLE_BUILD_LOGIC_SCAN_MAX_ENTRIES}-entry budget; ownership cannot be established, so ktlint autofix is declined`
    });
    return { kind: "indeterminate" };
  }
  if (scan.indeterminate)
    return { kind: "indeterminate" };
  for (const filePath of files) {
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const stripped = stripGradleCommentsAndStrings(raw);
      GRADLE_KTLINT_PLUGIN_PATTERN.lastIndex = 0;
      let match;
      while ((match = GRADLE_KTLINT_PLUGIN_PATTERN.exec(raw)) !== null) {
        const code = stripped.slice(match.index, match.index + match[0].length);
        if (!/^\s*$/.test(code))
          return { kind: "owned" };
      }
    } catch {
      return { kind: "indeterminate" };
    }
  }
  return { kind: "not-owned" };
}
function addGradleBuildLogicFiles(root, files, scan) {
  if (!fs.existsSync(root))
    return true;
  const pending = [root];
  while (pending.length > 0) {
    const dir = pending.pop();
    if (!dir)
      continue;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      scan.indeterminate = true;
      continue;
    }
    for (const entry of entries) {
      scan.entries += 1;
      if (scan.entries > GRADLE_BUILD_LOGIC_SCAN_MAX_ENTRIES)
        return false;
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        pending.push(entryPath);
      } else if (entry.isFile() && GRADLE_BUILD_LOGIC_EXTENSIONS.some((extension) => entry.name.endsWith(extension))) {
        files.add(entryPath);
      }
    }
  }
  return true;
}
function hasKtfmtConfig(cwd) {
  const spotlessFormatter = getSpotlessKotlinFormatter(cwd);
  if (spotlessFormatter)
    return spotlessFormatter === "ktfmt";
  for (const dir of walkUpDirs(cwd)) {
    if (KTFMT_CONFIG_FILES.some((cfg) => fs.existsSync(path.join(dir, cfg))))
      return true;
    for (const gradle of KTFMT_GRADLE_FILES) {
      const p = path.join(dir, gradle);
      if (fs.existsSync(p)) {
        try {
          if (/ktfmt|com\.facebook\.ktfmt/i.test(fs.readFileSync(p, "utf-8")))
            return true;
        } catch {
        }
      }
    }
  }
  return false;
}
var JAVA_BUILD_DESCRIPTORS = [
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "settings.gradle",
  "settings.gradle.kts"
];
var COMPILED_CLASSES_DIRS = [
  path.join("target", "classes"),
  path.join("build", "classes"),
  path.join("out", "production"),
  path.join("bin", "main")
];
function hasJavaBuildDescriptor(cwd, ceiling) {
  const normalizedCeiling = ceiling ? normalizeMapKey(path.resolve(ceiling)) : void 0;
  for (const dir of walkUpDirs(cwd)) {
    if (JAVA_BUILD_DESCRIPTORS.some((d) => fs.existsSync(path.join(dir, d))))
      return true;
    if (normalizedCeiling && normalizeMapKey(path.resolve(dir)) === normalizedCeiling)
      break;
  }
  return false;
}
function findCompiledClassesDir(cwd) {
  for (const dir of walkUpDirs(cwd)) {
    for (const rel of COMPILED_CLASSES_DIRS) {
      const candidate = path.join(dir, rel);
      if (fs.existsSync(candidate))
        return candidate;
    }
  }
  return void 0;
}
function hasStandardrbConfig(cwd) {
  for (const dir of walkUpDirs(cwd)) {
    const gemfile = path.join(dir, "Gemfile");
    if (fs.existsSync(gemfile)) {
      try {
        if (fs.readFileSync(gemfile, "utf-8").includes("standard"))
          return true;
      } catch {
      }
    }
  }
  return false;
}
function getRubocopCommand(cwd) {
  const gemfile = path.join(cwd, "Gemfile");
  if (fs.existsSync(gemfile)) {
    try {
      const content = fs.readFileSync(gemfile, "utf-8");
      if (content.includes("rubocop")) {
        return { cmd: "bundle", args: ["exec", "rubocop"] };
      }
    } catch {
    }
  }
  return { cmd: "rubocop", args: [] };
}
function hasVitePlusConfig(cwd) {
  for (const dir of walkUpDirs(cwd)) {
    if (fs.existsSync(path.join(dir, "vite-plus.json")))
      return true;
    const pkgPath = path.join(dir, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (deps["vite-plus"] || deps["@voidzero-dev/vite-plus-core"]) {
          return true;
        }
      } catch {
      }
    }
    for (const cfg of VITE_CONFIGS) {
      const cfgPath = path.join(dir, cfg);
      if (!fs.existsSync(cfgPath))
        continue;
      try {
        const content = fs.readFileSync(cfgPath, "utf-8");
        if (content.includes("vite-plus"))
          return true;
      } catch {
      }
    }
  }
  return false;
}
var OXLINT_CONFIGS = [
  ".oxlintrc.json",
  ".oxlintrc.jsonc",
  "oxlint.json",
  "oxlint.config.ts",
  "oxlint.config.mts"
];
function hasOxlintConfig(cwd) {
  for (const dir of walkUpDirs(cwd)) {
    for (const cfg of OXLINT_CONFIGS) {
      if (fs.existsSync(path.join(dir, cfg)))
        return true;
    }
  }
  return hasVitePlusConfig(cwd);
}
function getPreferredJstsLintRunners(context) {
  if (context.hasEslintConfig)
    return ["eslint"];
  if (context.hasOxlintConfig)
    return ["oxlint"];
  if (context.hasBiomeConfig)
    return ["biome-check-json"];
  return ["oxlint", "biome-check-json"];
}
function getJstsLintPolicy(context) {
  const hasEslint = !!context.hasEslintConfig;
  const hasOxlint = !!context.hasOxlintConfig;
  const hasBiome = !!context.hasBiomeConfig;
  return {
    hasEslintConfig: hasEslint,
    hasOxlintConfig: hasOxlint,
    hasBiomeConfig: hasBiome,
    preferredRunners: getPreferredJstsLintRunners({
      hasEslintConfig: hasEslint,
      hasOxlintConfig: hasOxlint,
      hasBiomeConfig: hasBiome
    }),
    hasExplicitNonBiomeLinter: hasEslint || hasOxlint
  };
}
function getJstsLintPolicyForCwd(cwd) {
  return getJstsLintPolicy({
    hasEslintConfig: hasEslintConfig(cwd),
    hasOxlintConfig: hasOxlintConfig(cwd),
    hasBiomeConfig: hasBiomeConfig(cwd)
  });
}

export {
  OXFMT_SUPPORTED_EXTENSIONS,
  getFormatterPolicyForFile,
  getSmartDefaultFormatterName,
  getAutoInstallToolIdForFormatter,
  shouldAutoInstallTool,
  getAutofixCapability,
  getToolCommandSpec,
  getLinterPolicyForCwd,
  hasNearestPackageJsonDependency,
  hasNearestPackageJsonField,
  hasEslintConfig,
  hasBiomeConfig,
  hasOxfmtConfig,
  hasOxfmtSvelteConfig,
  hasStylelintConfig,
  hasSqlfluffConfig,
  hasRubocopConfig,
  hasMypyConfig,
  hasYamllintConfig,
  hasMarkdownlintConfig,
  hasPrettierConfig,
  hasBlackConfig,
  hasRuffConfig,
  markdownlintConfigArgs,
  ruffConfigArgs,
  biomeConfigArgs,
  hasGolangciConfig,
  hasClangFormatConfig,
  hasPhpCsFixerConfig,
  hasStyluaConfig,
  hasOcamlformatConfig,
  hasGoogleJavaFormatConfig,
  hasCljfmtConfig,
  hasCmakeFormatConfig,
  findPSScriptAnalyzerConfigPath,
  hasPSScriptAnalyzerConfig,
  hasCsharpierConfig,
  hasOrmoluConfig,
  hasTaploConfig,
  hasTerraformConfig,
  hasSwiftformatConfig,
  hasFantomasConfig,
  hasMixFormatConfig,
  hasPhpstanConfig,
  hasDetektConfig,
  stripGradleCommentsAndStrings,
  gradleBlockRanges,
  hasKtlintConfig,
  hasGradleKtlintPlugin,
  hasKtfmtConfig,
  hasJavaBuildDescriptor,
  findCompiledClassesDir,
  hasStandardrbConfig,
  getRubocopCommand,
  hasVitePlusConfig,
  getJstsLintPolicyForCwd
};
