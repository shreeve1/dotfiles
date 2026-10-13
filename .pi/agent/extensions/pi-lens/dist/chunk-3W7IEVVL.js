import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  tryLazyInstallForFormatter
} from "./chunk-OXXKQCSV.js";
import {
  stripAnsi
} from "./chunk-FC4RP4I2.js";
import {
  OXFMT_SUPPORTED_EXTENSIONS,
  findPSScriptAnalyzerConfigPath,
  getAutoInstallToolIdForFormatter,
  getFormatterPolicyForFile,
  getSmartDefaultFormatterName,
  gradleBlockRanges,
  hasBiomeConfig,
  hasBlackConfig,
  hasClangFormatConfig,
  hasCljfmtConfig,
  hasCmakeFormatConfig,
  hasCsharpierConfig,
  hasDetektConfig,
  hasFantomasConfig,
  hasGolangciConfig,
  hasGoogleJavaFormatConfig,
  hasGradleKtlintPlugin,
  hasKtfmtConfig,
  hasKtlintConfig,
  hasMarkdownlintConfig,
  hasMixFormatConfig,
  hasNearestPackageJsonDependency,
  hasNearestPackageJsonField,
  hasOcamlformatConfig,
  hasOrmoluConfig,
  hasOxfmtConfig,
  hasOxfmtSvelteConfig,
  hasPSScriptAnalyzerConfig,
  hasPhpCsFixerConfig,
  hasPrettierConfig,
  hasRubocopConfig,
  hasRuffConfig,
  hasSqlfluffConfig,
  hasStandardrbConfig,
  hasStyluaConfig,
  hasSwiftformatConfig,
  hasTaploConfig,
  hasTerraformConfig,
  hasVitePlusConfig,
  stripGradleCommentsAndStrings
} from "./chunk-RPLINGVB.js";
import {
  load
} from "./chunk-QOZXJ4NA.js";
import {
  readTextFileOrUndefined,
  resolveCargoPackageEdition
} from "./chunk-P7266HLM.js";
import {
  getToolPath
} from "./chunk-ACXEQZOU.js";
import {
  resolveToolCwd
} from "./chunk-Q7DUK4LX.js";
import {
  VENDOR_BIN_DIRS,
  VENV_BIN_DIRS,
  findGlobalBinary,
  findLocalBinUpwards,
  localBinPath
} from "./chunk-AW7R2GWG.js";
import {
  getIsolatedNpxSpawnOptions,
  probeToolAsync
} from "./chunk-RWWYJ623.js";
import {
  classifyProbeFailure,
  createAvailabilityLatch,
  logAvailabilityDecision,
  startHostStallSampler
} from "./chunk-VRZP76YM.js";
import {
  createGenerationSource,
  safeSpawnAsync
} from "./chunk-C34ZXZ7O.js";
import {
  TERRAGRUNT_FILENAMES
} from "./chunk-PHDMFAKM.js";
import {
  assertInstallAllowed
} from "./chunk-ZANLILYD.js";
import {
  compareOrdinal,
  getDegradationLedgerGeneration,
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
  BoundedFifoMap,
  BoundedLruCache
} from "./chunk-ABBOA7UD.js";
import {
  findNearestContaining,
  findNearestMarkerRoot,
  normalizeMapKey,
  toPosix
} from "./chunk-N2H3ZPZY.js";

// dist/clients/formatters.js
import { AsyncLocalStorage } from "node:async_hooks";
import * as fs2 from "node:fs/promises";
import * as os2 from "node:os";
import * as path4 from "node:path";

// dist/clients/gradle-ktfmt-style.js
import * as os from "node:os";
import * as path from "node:path";
var KTFMT_GRADLE_ROOT_FILES = [
  "build.gradle.kts",
  "build.gradle",
  "settings.gradle.kts",
  "settings.gradle"
];
var MAX_GRADLE_ANCESTOR_HOPS = 16;
var MAX_SPOTLESS_KTFMT_CALL_CHARS = 4096;
var KTFMT_STYLE_CLI_FLAG = {
  google: "--google-style",
  kotlinlang: "--kotlinlang-style"
};
function styleFromKtfmtBlockBody(body) {
  let style;
  let lastIndex = -1;
  for (const [call, candidate] of [
    [/\bgoogleStyle\s*\(\s*\)/g, "google"],
    [/\bkotlinLangStyle\s*\(\s*\)/g, "kotlinlang"]
  ]) {
    for (const match of body.matchAll(call)) {
      if (match.index > lastIndex) {
        lastIndex = match.index;
        style = candidate;
      }
    }
  }
  return style;
}
function findBalancedCallEnd(source, openingParen) {
  let depth = 0;
  const limit = Math.min(source.length, openingParen + MAX_SPOTLESS_KTFMT_CALL_CHARS);
  for (let index = openingParen; index < limit; index += 1) {
    if (source[index] === "(")
      depth += 1;
    if (source[index] !== ")")
      continue;
    depth -= 1;
    if (depth === 0)
      return index + 1;
  }
  return void 0;
}
function styleFromSpotlessKotlinBody(body) {
  let style;
  for (const call of body.matchAll(/\bktfmt\s*(?=\()/g)) {
    const callOpenParen = call.index + call[0].length;
    const closeParen = findBalancedCallEnd(body, callOpenParen);
    if (closeParen === void 0)
      continue;
    const chain = /^\s*((?:\.\s*(?:googleStyle|kotlinlangStyle|dropboxStyle)\s*\(\s*\)\s*)+)/.exec(body.slice(closeParen));
    if (!chain)
      continue;
    const chainBody = chain[1];
    if (!chainBody)
      continue;
    for (const method of chainBody.matchAll(/\.\s*(googleStyle|kotlinlangStyle|dropboxStyle)\s*\(\s*\)/g)) {
      if (method[1] === "googleStyle")
        style = "google";
      if (method[1] === "kotlinlangStyle")
        style = "kotlinlang";
      if (method[1] === "dropboxStyle")
        style = "spotless-dropbox-unsupported";
    }
  }
  return style;
}
var SCOPE_BY_ENCLOSING_BLOCK = {
  subprojects: "descendants",
  allprojects: "both"
};
function scopeOfGradleStyleBlock(range, ranges) {
  const enclosing = ranges.filter((outer) => outer.start < range.start && outer.end >= range.end);
  if (enclosing.length === 0)
    return "own";
  if (enclosing.length > 1)
    return void 0;
  return SCOPE_BY_ENCLOSING_BLOCK[enclosing[0].name];
}
function styleSelectionForGradleBlock(block, source, allBlockRanges, nonSpotlessRanges) {
  if (block.name === "ktfmt") {
    const scope2 = scopeOfGradleStyleBlock(block, allBlockRanges);
    if (!scope2)
      return void 0;
    const style2 = styleFromKtfmtBlockBody(source.slice(block.start, block.end));
    return style2 ? { scope: scope2, style: style2 } : void 0;
  }
  if (block.name !== "kotlin")
    return void 0;
  const enclosingSpotless = [];
  for (const outer of allBlockRanges) {
    if (outer.name === "spotless" && outer.start < block.start && outer.end >= block.end) {
      enclosingSpotless.push(outer);
    }
  }
  if (enclosingSpotless.length !== 1)
    return void 0;
  const scope = scopeOfGradleStyleBlock(block, nonSpotlessRanges);
  if (!scope)
    return void 0;
  const style = styleFromSpotlessKotlinBody(source.slice(block.start, block.end));
  return style ? { scope, style } : void 0;
}
function stylesFromGradleContent(content) {
  const stripped = stripGradleCommentsAndStrings(content);
  const blocks = gradleBlockRanges(stripped);
  const scopeRanges = [];
  for (const range of blocks) {
    if (range.name !== "spotless")
      scopeRanges.push(range);
  }
  const styles = {};
  for (const range of blocks) {
    const selection = styleSelectionForGradleBlock(range, stripped, blocks, scopeRanges);
    if (!selection)
      continue;
    if (selection.scope !== "descendants")
      styles.own = selection.style;
    if (selection.scope !== "own")
      styles.descendants = selection.style;
  }
  return styles;
}
async function stylesForGradleDir(gradleDir) {
  for (const gradleFile of KTFMT_GRADLE_ROOT_FILES) {
    const content = await readTextFileOrUndefined(path.join(gradleDir, gradleFile));
    if (content === void 0)
      continue;
    const styles = stylesFromGradleContent(content);
    if (styles.own || styles.descendants)
      return styles;
  }
  return {};
}
async function resolveKtfmtGradleStyle(filePath, homeDir = os.homedir()) {
  let searchDir = path.dirname(path.resolve(filePath));
  for (let hop = 0; hop < MAX_GRADLE_ANCESTOR_HOPS; hop += 1) {
    const gradleDir = findNearestMarkerRoot(searchDir, KTFMT_GRADLE_ROOT_FILES, {
      homeDir
    });
    if (!gradleDir)
      return void 0;
    const styles = await stylesForGradleDir(gradleDir);
    const style = hop === 0 ? styles.own : styles.descendants;
    if (style === "spotless-dropbox-unsupported") {
      const reason = "Spotless ktfmt dropboxStyle(): pi-lens standalone CLI cannot express the style; falling back to bare ktfmt";
      const firstOccurrence = incrementDegradationCount({
        kind: "formatter-skip",
        subject: "ktfmt:spotless-dropbox",
        reason,
        metadata: { filePath, gradleDir }
      });
      if (firstOccurrence) {
        logExtension({
          subsystem: "format",
          level: "debug",
          message: reason,
          metadata: { filePath, gradleDir }
        });
      }
      return void 0;
    }
    if (style)
      return KTFMT_STYLE_CLI_FLAG[style];
    const parent = path.dirname(gradleDir);
    if (parent === gradleDir)
      return void 0;
    searchDir = parent;
  }
  return void 0;
}

// dist/clients/php-cs-fixer-config.js
import { existsSync } from "node:fs";
import * as path2 from "node:path";
var PHP_CS_FIXER_CONFIG_NAMES = [
  ".php-cs-fixer.php",
  ".php-cs-fixer.dist.php"
];
function resolvePhpCsFixerConfig(filePath) {
  const absolute = path2.resolve(filePath);
  const startDir = resolveToolCwd("formatter", "php-cs-fixer", absolute, {
    cwd: path2.parse(absolute).root,
    allowHomeMarker: true
  }).cwd;
  return PHP_CS_FIXER_CONFIG_NAMES.map((name) => path2.join(startDir, name)).find(existsSync);
}

// dist/clients/dispatch/indent-detect.js
var DEFAULT_INDENTATION = { style: "space", width: 2 };
function detectIndentation(content) {
  const lines = structuralLines(content.split(/\r?\n/));
  const tabs = lines.filter((line) => /^\t+\S/.test(line)).length;
  const spaceCounts = lines.map((line) => line.match(/^ +(?=\S)/)?.[0].length ?? 0).filter((count) => count > 0);
  if (tabs === 0 && spaceCounts.length === 0) {
    return hasDetectableIndentation(content) ? void 0 : DEFAULT_INDENTATION;
  }
  if (tabs > spaceCounts.length)
    return { style: "tab", width: 1 };
  if (spaceCounts.length > tabs) {
    const minimum = Math.min(...spaceCounts);
    const gcd = spaceCounts.reduce((unit, count) => greatestCommonDivisor(unit, count), 0);
    const nonBlank = lines.map((line) => line.match(/^( *)\S/)?.[1]?.length).filter((count) => count !== void 0);
    const hasStructuralBoundary = nonBlank.some((count, index) => {
      const previous = nonBlank[index - 1];
      return count === minimum && previous !== void 0 && previous < minimum;
    });
    if (hasStructuralBoundary && minimum <= 8) {
      return { style: "space", width: minimum };
    }
    if (gcd < minimum && gcd <= 8) {
      return { style: "space", width: gcd };
    }
    return void 0;
  }
  return DEFAULT_INDENTATION;
}
function opensBlockComment(line) {
  const blockAt = line.indexOf("/*");
  if (blockAt < 0)
    return false;
  const lineAt = line.indexOf("//");
  if (lineAt >= 0 && lineAt < blockAt)
    return false;
  return line.indexOf("*/", blockAt + 2) < 0;
}
function blockCommentInteriorMask(lines) {
  const mask = Array.from({ length: lines.length }, () => false);
  let pendingStart = -1;
  for (const [i, line] of lines.entries()) {
    if (pendingStart >= 0) {
      mask[i] = true;
      if (line.includes("*/"))
        pendingStart = -1;
      continue;
    }
    if (opensBlockComment(line))
      pendingStart = i;
  }
  if (pendingStart >= 0) {
    for (let i = pendingStart + 1; i < lines.length; i += 1)
      mask[i] = false;
  }
  return mask;
}
function hasLiveFrame(stack) {
  return stack.some((frame) => frame.kind !== "block");
}
function advanceTemplateState(line, stack) {
  let j = 0;
  while (j < line.length) {
    const top = stack[stack.length - 1];
    if (top?.kind === "template") {
      if (line[j] === "\\") {
        j += 2;
        continue;
      }
      if (line.startsWith("${", j)) {
        stack.push({ kind: "expr", braceDepth: 1 });
        j += 2;
        continue;
      }
      if (line[j] === "`") {
        stack.pop();
        j += 1;
        continue;
      }
      j += 1;
      continue;
    }
    if (top?.kind === "block") {
      const closeAt = line.indexOf("*/", j);
      if (closeAt < 0)
        return;
      stack.pop();
      j = closeAt + 2;
      continue;
    }
    if (line.startsWith("//", j))
      return;
    if (line.startsWith("/*", j)) {
      stack.push({ kind: "block" });
      j += 2;
      continue;
    }
    if (line[j] === "/" && isRegexOpenerPosition(line, j)) {
      const after = skipRegexLiteral(line, j);
      if (after >= 0) {
        j = after;
        continue;
      }
    }
    const ch = line[j];
    if (ch === '"' || ch === "'") {
      j = skipQuoted(line, j, ch);
      continue;
    }
    if (ch === "`") {
      stack.push({ kind: "template" });
      j += 1;
      continue;
    }
    if (top?.kind === "expr") {
      if (ch === "{") {
        top.braceDepth += 1;
        j += 1;
        continue;
      }
      if (ch === "}") {
        top.braceDepth -= 1;
        j += 1;
        if (top.braceDepth === 0)
          stack.pop();
        continue;
      }
    }
    j += 1;
  }
}
function skipQuoted(line, start, quote) {
  let j = start + 1;
  while (j < line.length) {
    if (line[j] === "\\") {
      j += 2;
      continue;
    }
    if (line[j] === quote)
      return j + 1;
    j += 1;
  }
  return line.length;
}
var REGEX_OPENER_PUNCTUATION = /* @__PURE__ */ new Set([
  "(",
  ",",
  "=",
  ":",
  "[",
  "!",
  "&",
  "|",
  "?"
]);
var REGEX_OPENER_KEYWORD = /(?:^|[^A-Za-z0-9_$])(?:return|typeof|case)$/;
function isRegexOpenerPosition(line, at) {
  const before = line.slice(0, at).replace(/[ \t]+$/, "");
  if (before === "")
    return true;
  if (REGEX_OPENER_KEYWORD.test(before))
    return true;
  return REGEX_OPENER_PUNCTUATION.has(before.at(-1) ?? "");
}
var REGEX_FLAG_CHARS = "dgimsuvy";
function skipRegexLiteral(line, start) {
  let j = start + 1;
  let inClass = false;
  while (j < line.length) {
    const c = line[j];
    if (c === "\\") {
      j += 2;
      continue;
    }
    if (inClass) {
      if (c === "]")
        inClass = false;
      j += 1;
      continue;
    }
    if (c === "[") {
      inClass = true;
      j += 1;
      continue;
    }
    if (c === "/") {
      let k = j + 1;
      while (k < line.length && REGEX_FLAG_CHARS.includes(line[k] ?? ""))
        k += 1;
      if (k < line.length && /[A-Za-z0-9_$]/.test(line[k] ?? ""))
        return -1;
      return j + 1;
    }
    j += 1;
  }
  return -1;
}
function templateLiteralInteriorMask(lines) {
  const mask = Array.from({ length: lines.length }, () => false);
  const stack = [];
  let openLine = -1;
  for (const [i, line] of lines.entries()) {
    if (hasLiveFrame(stack)) {
      mask[i] = true;
    } else {
      openLine = i;
    }
    advanceTemplateState(line, stack);
  }
  if (hasLiveFrame(stack)) {
    for (let i = openLine + 1; i < lines.length; i += 1)
      mask[i] = false;
  }
  return mask;
}
function structuralLines(lines) {
  const blockCommentMask = blockCommentInteriorMask(lines);
  const templateMask = templateLiteralInteriorMask(lines);
  return lines.filter((_, index) => !blockCommentMask[index] && !templateMask[index]);
}
function greatestCommonDivisor(left, right) {
  while (right !== 0)
    [left, right] = [right, left % right];
  return left;
}
function hasDetectableIndentation(content) {
  return /^(?:\t+| {1,})\S/m.test(content);
}

// dist/clients/tool-agreement.js
import * as fs from "node:fs";
import * as path3 from "node:path";
var NODE_PACKAGES = {
  biome: "@biomejs/biome",
  eslint: "eslint",
  markdownlint: "markdownlint-cli2",
  oxfmt: "oxfmt",
  oxlint: "oxlint",
  prettier: "prettier",
  stylelint: "stylelint"
};
var NODE_LOCKFILE_PRECEDENCE = [
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock"
];
var NODE_LOCKFILE_MAX_BYTES = 16 * 1024 * 1024;
var TOOL_AGREEMENT_POLICIES = {
  biome: { bucket: "node-lockfile", withoutEvidence: "decline" },
  eslint: { bucket: "node-lockfile", withoutEvidence: "decline" },
  markdownlint: {
    bucket: "node-lockfile",
    withoutEvidence: "decline",
    check: hasMarkdownlintConfig
  },
  oxfmt: { bucket: "node-lockfile", withoutEvidence: "decline" },
  oxlint: { bucket: "node-lockfile", withoutEvidence: "decline" },
  prettier: { bucket: "node-lockfile", withoutEvidence: "decline" },
  stylelint: { bucket: "node-lockfile", withoutEvidence: "decline" },
  ruff: {
    bucket: "project-config",
    withoutEvidence: "decline",
    check: hasRuffConfig
  },
  black: {
    bucket: "project-config",
    withoutEvidence: "decline",
    check: hasBlackConfig
  },
  sqlfluff: {
    bucket: "project-config",
    withoutEvidence: "decline",
    check: hasSqlfluffConfig
  },
  rubocop: {
    bucket: "project-config",
    withoutEvidence: "decline",
    check: hasRubocopConfig
  },
  standardrb: {
    bucket: "project-config",
    withoutEvidence: "decline",
    check: hasStandardrbConfig
  },
  ktlint: { bucket: "standalone-cli", withoutEvidence: "decline" },
  // typstyle is a standalone formatter binary. Its smart-default policy is
  // autonomous, so PATH or managed-install availability is sufficient
  // agreement; it is not owned by a project manifest (#3037).
  typstyle: { bucket: "standalone-cli", withoutEvidence: "decline" },
  ktfmt: {
    bucket: "project-config",
    withoutEvidence: "decline",
    check: hasKtfmtConfig
  },
  "rust-clippy": {
    bucket: "project-config",
    withoutEvidence: "decline",
    check: (cwd) => hasMarker(cwd, ["Cargo.toml"])
  },
  "dart-analyze": {
    bucket: "project-config",
    withoutEvidence: "decline",
    check: (cwd) => hasMarker(cwd, ["pubspec.yaml"])
  },
  "golangci-lint": {
    bucket: "project-config",
    withoutEvidence: "decline",
    check: hasGolangciConfig
  },
  detekt: {
    bucket: "project-config",
    withoutEvidence: "decline",
    check: hasDetektConfig
  },
  gofmt: {
    bucket: "project-config",
    withoutEvidence: "decline",
    check: (cwd) => hasMarker(cwd, ["go.mod"])
  },
  rustfmt: {
    bucket: "project-config",
    withoutEvidence: "decline",
    check: (cwd) => hasMarker(cwd, ["Cargo.toml"])
  },
  zig: {
    bucket: "project-config",
    withoutEvidence: "decline",
    check: (cwd) => hasMarker(cwd, ["build.zig"])
  },
  dart: {
    bucket: "project-config",
    withoutEvidence: "decline",
    check: (cwd) => hasMarker(cwd, ["pubspec.yaml"])
  },
  shfmt: {
    bucket: "project-config",
    withoutEvidence: "decline",
    check: (cwd) => hasMarker(cwd, [".editorconfig"])
  },
  // nixfmt has no honest project marker. It remains in the population and is
  // declined by the conservative absent-evidence path below.
  nixfmt: { bucket: "project-config", withoutEvidence: "decline" },
  mix: {
    bucket: "project-config",
    withoutEvidence: "decline",
    check: hasMixFormatConfig
  },
  ocamlformat: {
    bucket: "project-config",
    withoutEvidence: "decline",
    check: hasOcamlformatConfig
  },
  "clang-format": {
    bucket: "project-config",
    withoutEvidence: "decline",
    check: hasClangFormatConfig
  },
  gleam: {
    bucket: "project-config",
    withoutEvidence: "decline",
    check: (cwd) => hasMarker(cwd, ["gleam.toml"])
  },
  terraform: {
    bucket: "project-config",
    withoutEvidence: "decline",
    check: hasTerraformConfig
  },
  "terragrunt-hcl": {
    bucket: "project-config",
    withoutEvidence: "decline",
    check: (cwd) => hasMarker(cwd, ["terragrunt.hcl", "terragrunt.hcl.json"])
  },
  "php-cs-fixer": {
    bucket: "project-config",
    withoutEvidence: "decline",
    check: hasPhpCsFixerConfig
  },
  csharpier: {
    bucket: "project-config",
    withoutEvidence: "decline",
    check: hasCsharpierConfig
  },
  fantomas: {
    bucket: "project-config",
    withoutEvidence: "decline",
    check: hasFantomasConfig
  },
  swiftformat: {
    bucket: "project-config",
    withoutEvidence: "decline",
    check: hasSwiftformatConfig
  },
  stylua: {
    bucket: "project-config",
    withoutEvidence: "decline",
    check: hasStyluaConfig
  },
  ormolu: {
    bucket: "project-config",
    withoutEvidence: "decline",
    check: hasOrmoluConfig
  },
  taplo: {
    bucket: "project-config",
    withoutEvidence: "decline",
    check: hasTaploConfig
  },
  "google-java-format": {
    bucket: "project-config",
    withoutEvidence: "decline",
    check: hasGoogleJavaFormatConfig
  },
  cljfmt: {
    bucket: "project-config",
    withoutEvidence: "decline",
    check: hasCljfmtConfig
  },
  "cmake-format": {
    bucket: "project-config",
    withoutEvidence: "decline",
    check: hasCmakeFormatConfig
  },
  "psscriptanalyzer-format": {
    bucket: "project-config",
    withoutEvidence: "decline",
    check: (cwd) => hasMarker(cwd, [
      "PSScriptAnalyzerSettings.psd1",
      "ScriptAnalyzerSettings.psd1"
    ])
  },
  cue: {
    bucket: "project-config",
    withoutEvidence: "decline",
    check: (cwd) => hasMarker(cwd, ["cue.mod"])
  }
};
function hasMarker(cwd, markers) {
  return findNearestMarkerRoot(cwd, markers, {
    boundaries: [".git", ".hg", ".svn"]
  }) !== null;
}
function readJson(filePath) {
  if (!fs.existsSync(filePath))
    return { kind: "missing" };
  try {
    const value = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return value && typeof value === "object" ? { kind: "value", value } : { kind: "unparseable" };
  } catch (error) {
    return {
      kind: error instanceof SyntaxError ? "unparseable" : "unreadable"
    };
  }
}
function declaredRange(pkg, name) {
  for (const field of [
    "dependencies",
    "devDependencies",
    "optionalDependencies"
  ]) {
    const deps = pkg[field];
    if (deps && typeof deps === "object") {
      const range = deps[name];
      if (typeof range === "string")
        return range;
    }
  }
  return void 0;
}
function parseCoreVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match)
    return void 0;
  const parts = match.slice(1).map(Number);
  if (parts.some((part) => !Number.isSafeInteger(part)))
    return void 0;
  return parts;
}
function exactOrSimpleRangeMatches(range, version) {
  const clean = range.trim().replace(/^v/, "");
  const actual = parseCoreVersion(version);
  if (!actual)
    return { matches: false, unsupported: version.includes("+") };
  if (/^\d+\.\d+\.\d+$/.test(clean))
    return { matches: clean === version, unsupported: false };
  const caret = clean.match(/^\^(\d+)\.(\d+)\.(\d+)$/);
  if (caret) {
    const [major, minor, patch] = caret.slice(1).map(Number);
    return {
      matches: actual[0] === major && (major !== 0 || actual[1] === minor) && (major !== 0 || minor !== 0 || actual[2] === patch) && (actual[1] > minor || actual[1] === minor && actual[2] >= patch),
      unsupported: false
    };
  }
  const tilde = clean.match(/^~(\d+)\.(\d+)\.(\d+)$/);
  if (tilde) {
    const [major, minor, patch] = tilde.slice(1).map(Number);
    return {
      matches: actual[0] === major && actual[1] === minor && actual[2] >= patch,
      unsupported: false
    };
  }
  return { matches: false, unsupported: true };
}
function pnpmEvidence(doc, packageName, importerKey) {
  if (doc && typeof doc === "object" && !Array.isArray(doc)) {
    const docRecord = doc;
    const importers = docRecord.importers;
    if (importers && typeof importers === "object" && !Array.isArray(importers)) {
      const importer = importers[importerKey];
      if (importer && typeof importer === "object") {
        for (const field of ["dependencies", "devDependencies"]) {
          const deps = importer[field];
          if (deps && typeof deps === "object") {
            const entry = deps[packageName];
            if (entry && typeof entry === "object") {
              return {
                kind: "resolved",
                version: entry.version
              };
            }
          }
        }
      }
      return { kind: "resolved", version: void 0 };
    }
    let sawTopLevelMaps = false;
    let v6version;
    let v6found = false;
    for (const field of ["dependencies", "devDependencies"]) {
      const deps = docRecord[field];
      if (deps && typeof deps === "object" && !Array.isArray(deps)) {
        sawTopLevelMaps = true;
        const entry = deps[packageName];
        if (entry && typeof entry === "object") {
          v6version = entry.version;
          v6found = true;
          break;
        }
      }
    }
    if (v6found || sawTopLevelMaps) {
      return { kind: "resolved", version: v6found ? v6version : void 0 };
    }
  }
  return { kind: "unsupported-shape" };
}
function decideNodeVersionAgreement(tool, packageName, range, version, supplier) {
  const comparison = typeof version === "string" ? exactOrSimpleRangeMatches(range, version) : { matches: false, unsupported: false };
  if (typeof version !== "string" || !comparison.matches) {
    const reasonCode = typeof version === "string" && comparison.unsupported ? "evidence-unsupported" : typeof version === "string" && version.includes("+") ? "evidence-unsupported" : "evidence-unparseable";
    const reason = typeof version === "string" && comparison.unsupported ? `the project declares ${packageName}@${range} in package.json, but the lockfile shape ${packageName}@${version} in ${supplier} or its range is unsupported; tool agreement cannot be established` : typeof version === "string" && parseCoreVersion(version) ? `the project declares ${packageName}@${range} in package.json, but the lockfile resolves ${packageName}@${version} in ${supplier}; agreement disagrees` : `the project declares ${packageName}@${range} in package.json, but ${supplier} does not establish its resolved version; tool agreement cannot be established`;
    return {
      decision: "decline",
      subject: `node:${tool}`,
      reason,
      reasonCode
    };
  }
  return { decision: "established", lockfile: supplier };
}
function readLockfileBounded(filePath) {
  let fd;
  try {
    fd = fs.openSync(filePath, "r");
    const buffer = Buffer.allocUnsafe(Math.min(fs.fstatSync(fd).size, NODE_LOCKFILE_MAX_BYTES) + 1);
    let total = 0;
    while (total < buffer.length) {
      const read = fs.readSync(fd, buffer, total, buffer.length - total, null);
      if (read === 0)
        break;
      total += read;
    }
    return total > NODE_LOCKFILE_MAX_BYTES ? { kind: "too-large" } : { kind: "text", text: buffer.toString("utf8", 0, total) };
  } catch {
    return { kind: "unreadable" };
  } finally {
    if (fd !== void 0) {
      try {
        fs.closeSync(fd);
      } catch {
      }
    }
  }
}
function lockfileReadDecline(tool, lockfile, read) {
  return read.kind === "too-large" ? {
    decision: "decline",
    subject: `node:${tool}`,
    reason: `the project ${lockfile} exceeds the ${NODE_LOCKFILE_MAX_BYTES}-byte lockfile read bound; tool agreement cannot be established`,
    reasonCode: "evidence-too-large"
  } : {
    decision: "decline",
    subject: `node:${tool}`,
    reason: `the project ${lockfile} is unreadable; tool agreement cannot be established`,
    reasonCode: "evidence-unreadable"
  };
}
function stripPnpmPeerSuffix(version) {
  const core = /^\d+\.\d+\.\d+/.exec(version)?.[0];
  if (!core || core.length === version.length)
    return version;
  let depth = 0;
  for (let i = core.length; i < version.length; i += 1) {
    const char = version[i];
    if (char === "(") {
      depth += 1;
    } else if (char === ")") {
      if (depth === 0 || version[i - 1] === "(")
        return version;
      depth -= 1;
    } else if (depth === 0) {
      return version;
    }
  }
  return depth === 0 ? core : version;
}
function pnpmAgreement(tool, packageName, range, root, lockDir) {
  const filePath = path3.join(lockDir, "pnpm-lock.yaml");
  const read = readLockfileBounded(filePath);
  if (read.kind !== "text") {
    return lockfileReadDecline(tool, "pnpm-lock.yaml", read);
  }
  let doc;
  try {
    doc = load(read.text);
  } catch {
    return {
      decision: "decline",
      subject: `node:${tool}`,
      reason: "the project pnpm-lock.yaml is unparseable; tool agreement cannot be established",
      reasonCode: "evidence-unparseable"
    };
  }
  const importerKey = lockDir === path3.resolve(root) ? "." : toPosix(path3.relative(lockDir, root));
  const evidence = pnpmEvidence(doc, packageName, importerKey);
  if (evidence.kind === "unsupported-shape") {
    return {
      decision: "decline",
      subject: `node:${tool}`,
      reason: "the project pnpm-lock.yaml has an unsupported lockfile shape; tool agreement cannot be established",
      reasonCode: "evidence-unsupported"
    };
  }
  return decideNodeVersionAgreement(tool, packageName, range, typeof evidence.version === "string" ? stripPnpmPeerSuffix(evidence.version) : evidence.version, "pnpm-lock.yaml");
}
function yarnV1Blocks(text, packageName) {
  const found = [];
  for (const block of text.split(/\n[ \t]*\n/)) {
    const lines = block.split("\n");
    const header = (lines[0] ?? "").trim();
    if (!header.endsWith(":"))
      continue;
    const prefix = `${packageName}@`;
    const descriptors = [];
    for (const rawPart of header.slice(0, -1).split(",")) {
      const part = rawPart.trim().replace(/^"|"$/g, "").trim();
      if (part.startsWith(prefix) && !part.slice(prefix.length).includes(":")) {
        descriptors.push(part);
      }
    }
    if (descriptors.length === 0)
      continue;
    let version;
    for (const line of lines.slice(1)) {
      const match = /^\s*version\s+"([^"]*)"/.exec(line);
      if (match) {
        version = match[1];
        break;
      }
    }
    found.push({ descriptors, version });
  }
  return found;
}
function yarnBerryEntries(doc, packageName) {
  if (!doc || typeof doc !== "object" || Array.isArray(doc))
    return void 0;
  const docRecord = doc;
  if (!docRecord.__metadata || typeof docRecord.__metadata !== "object")
    return void 0;
  const found = [];
  const marker = "@npm:";
  for (const [key, entry] of Object.entries(docRecord)) {
    const unquoted = key.replace(/^"|"$/g, "");
    const at = unquoted.lastIndexOf(marker);
    if (at < 0)
      continue;
    if (unquoted.slice(0, at) !== packageName)
      continue;
    const version = entry && typeof entry === "object" ? entry.version : void 0;
    found.push({ descriptors: [unquoted.slice(at + marker.length)], version });
  }
  return found;
}
function selectNodeCandidate(candidates, range) {
  for (const candidate of candidates) {
    if (candidate.descriptors.some((descriptor) => descriptor === range)) {
      return typeof candidate.version === "string" ? candidate.version : void 0;
    }
  }
  const first = candidates.length > 0 ? candidates[0]?.version : void 0;
  return typeof first === "string" ? first : void 0;
}
function yarnAgreement(tool, packageName, range, filePath) {
  const read = readLockfileBounded(filePath);
  if (read.kind !== "text")
    return lockfileReadDecline(tool, "yarn.lock", read);
  const raw = read.text.replace(/\r\n?/g, "\n");
  let doc;
  let yamlOk = true;
  try {
    doc = load(raw);
  } catch {
    yamlOk = false;
  }
  if (yamlOk) {
    const berry = yarnBerryEntries(doc, packageName);
    if (berry) {
      return decideNodeVersionAgreement(tool, packageName, range, selectNodeCandidate(berry, range), "yarn.lock");
    }
  }
  const v1 = yarnV1Blocks(raw, packageName);
  if (v1.length > 0) {
    return decideNodeVersionAgreement(tool, packageName, range, selectNodeCandidate(v1, range), "yarn.lock");
  }
  if (!yamlOk) {
    return {
      decision: "decline",
      subject: `node:${tool}`,
      reason: "the project yarn.lock is unparseable; tool agreement cannot be established",
      reasonCode: "evidence-unparseable"
    };
  }
  return {
    decision: "decline",
    subject: `node:${tool}`,
    reason: "the project yarn.lock has an unsupported lockfile shape; tool agreement cannot be established",
    reasonCode: "evidence-unsupported"
  };
}
function nodeAgreement(tool, root) {
  const packageName = NODE_PACKAGES[tool];
  if (!packageName)
    return void 0;
  const pkg = readJson(path3.join(root, "package.json"));
  if (pkg.kind === "unreadable" || pkg.kind === "unparseable") {
    return {
      decision: "decline",
      subject: `node:${tool}`,
      reason: `the project package.json is ${pkg.kind}; tool agreement cannot be established`,
      reasonCode: `evidence-${pkg.kind}`
    };
  }
  const range = pkg.kind === "value" ? declaredRange(pkg.value, packageName) : void 0;
  if (!range)
    return void 0;
  const lockDir = findNearestMarkerRoot(root, [...NODE_LOCKFILE_PRECEDENCE], {
    boundaries: [".git", ".hg", ".svn"]
  });
  if (!lockDir) {
    return {
      decision: "decline",
      subject: `node:${tool}`,
      reason: `the project declares ${packageName}@${range} in package.json, but no lockfile (package-lock.json, pnpm-lock.yaml, yarn.lock) establishes its resolved version; tool agreement cannot be established`,
      reasonCode: "evidence-absent"
    };
  }
  const supplier = fs.existsSync(path3.join(lockDir, "package-lock.json")) ? "package-lock.json" : fs.existsSync(path3.join(lockDir, "pnpm-lock.yaml")) ? "pnpm-lock.yaml" : "yarn.lock";
  if (supplier === "package-lock.json") {
    const lock = readJson(path3.join(lockDir, "package-lock.json"));
    if (lock.kind === "unreadable" || lock.kind === "unparseable") {
      return {
        decision: "decline",
        subject: `node:${tool}`,
        reason: `the project package-lock.json is ${lock.kind}; tool agreement cannot be established`,
        reasonCode: `evidence-${lock.kind}`
      };
    }
    const packages = lock.kind === "value" ? lock.value.packages : void 0;
    const entry = packages && typeof packages === "object" ? packages[`node_modules/${packageName}`] : void 0;
    const version = entry && typeof entry === "object" ? entry.version : void 0;
    const comparison = typeof version === "string" ? exactOrSimpleRangeMatches(range, version) : { matches: false, unsupported: false };
    if (typeof version !== "string" || !comparison.matches) {
      const reasonCode = typeof version === "string" && comparison.unsupported ? "evidence-unsupported" : typeof version === "string" && version.includes("+") ? "evidence-unsupported" : "evidence-unparseable";
      const reason = typeof version === "string" && comparison.unsupported ? `the project declares ${packageName}@${range}, but the lockfile shape ${packageName}@${version} or its range is unsupported; tool agreement cannot be established` : typeof version === "string" && parseCoreVersion(version) ? `the project declares ${packageName}@${range} in package.json, but the lockfile resolves ${packageName}@${version} in package-lock.json; agreement disagrees` : `the project declares ${packageName}@${range} in package.json, but package-lock.json does not establish its resolved version; tool agreement cannot be established`;
      return {
        decision: "decline",
        subject: `node:${tool}`,
        reason,
        reasonCode
      };
    }
    return { decision: "established", lockfile: supplier };
  }
  if (supplier === "pnpm-lock.yaml") {
    return pnpmAgreement(tool, packageName, range, root, lockDir);
  }
  return yarnAgreement(tool, packageName, range, path3.join(lockDir, "yarn.lock"));
}
function establishToolAgreement(tool, cwd) {
  const key = `${getDegradationLedgerGeneration()}\0${path3.resolve(cwd)}\0${tool}`;
  const cached = agreementCache.get(key);
  if (cached)
    return cached;
  agreementResolutionCount += 1;
  const policy = TOOL_AGREEMENT_POLICIES[tool];
  if (!policy) {
    const agreement2 = {
      decision: "decline",
      subject: `tool:${tool}`,
      reason: "the autonomous writer is not registered with a project-evidence policy; tool agreement cannot be established",
      reasonCode: "evidence-unsupported"
    };
    agreementCache.set(key, agreement2);
    return agreement2;
  }
  let agreement = { decision: "established" };
  if (tool === "ktlint") {
    const ownership = hasGradleKtlintPlugin(cwd);
    if (ownership.kind === "owned" || hasKtlintConfig(cwd)) {
      agreement = {
        decision: "decline",
        subject: "kotlin:gradle-ktlint",
        reason: "the project resolves ktlint through Gradle, so CLI agreement cannot be established from project data",
        reasonCode: "evidence-unsupported"
      };
    } else if (ownership.kind === "indeterminate") {
      agreement = {
        decision: "decline",
        subject: "kotlin:gradle-ktlint",
        reason: "Gradle ownership evidence is unreadable or exceeded its scan budget; tool agreement cannot be established",
        reasonCode: "evidence-unreadable"
      };
    }
  }
  if (agreement.decision === "established" && policy.bucket === "node-lockfile") {
    const root = findNearestMarkerRoot(cwd, ["package.json"], {
      boundaries: [".git", ".hg", ".svn"]
    });
    const node = root ? nodeAgreement(tool, root) : void 0;
    agreement = node ?? {
      decision: "decline",
      subject: `node:${tool}`,
      reason: "the project has no package declaration and lockfile evidence for this tool",
      reasonCode: "evidence-absent"
    };
  } else if (agreement.decision === "established" && policy.bucket === "project-config" && (!policy.check || !policy.check(cwd))) {
    agreement = {
      decision: "decline",
      subject: `project:${tool}`,
      reason: "the project has no readable configuration or manifest evidence selecting this tool",
      reasonCode: "evidence-absent"
    };
  }
  if (agreement.decision === "established" && !policy.bucket) {
    agreement = {
      decision: "decline",
      subject: `tool:${tool}`,
      reason: "the tool evidence bucket is unsupported",
      reasonCode: "evidence-unsupported"
    };
  }
  agreementCache.set(key, agreement);
  return agreement;
}
var agreementCache = new BoundedFifoMap(512);
var agreementResolutionCount = 0;

// dist/clients/formatters.js
async function tryLazyInstallFormatterTool(tool, cwd) {
  const ok = await tryLazyInstallForFormatter(tool, cwd);
  if (ok)
    resetWhichLatches();
  return ok;
}
var SKIP_FORMATTING = "skip-formatting";
var FORMATTER_UNAVAILABLE = "formatter-unavailable";
var FORMATTER_AGREEMENT_UNAVAILABLE = "formatter-agreement-unavailable";
async function fileExists(filePath) {
  try {
    await fs2.access(filePath);
    return true;
  } catch {
    return false;
  }
}
async function findUp(targets, startDir, stopDir = path4.parse(startDir).root) {
  const found = [];
  let currentDir = startDir;
  while (currentDir !== stopDir) {
    let entries;
    try {
      entries = await fs2.readdir(currentDir);
    } catch {
      entries = [];
    }
    if (entries.length > 0) {
      const foldCase = process.platform === "win32" || process.platform === "darwin";
      const entrySet = new Set(foldCase ? entries.map((e) => e.toLowerCase()) : entries);
      for (const target of targets) {
        if (target.includes("/") || target.includes("\\"))
          continue;
        if (entrySet.has(foldCase ? target.toLowerCase() : target)) {
          const candidate = path4.join(currentDir, target);
          if (await fileExists(candidate))
            found.push(candidate);
        }
      }
    }
    for (const target of targets) {
      if (!target.includes("/") && !target.includes("\\"))
        continue;
      const candidate = path4.join(currentDir, target);
      if (await fileExists(candidate))
        found.push(candidate);
    }
    const parent = path4.dirname(currentDir);
    if (parent === currentDir)
      break;
    currentDir = parent;
  }
  return found;
}
function _findUpForTests(targets, startDir, stopDir) {
  return findUp(targets, startDir, stopDir);
}
var WHICH_BUDGET_MS = 5e3;
var whichLatchByCommand = /* @__PURE__ */ new Map();
var whichTransientCommands = /* @__PURE__ */ new Set();
var probedCommandsStorage = new AsyncLocalStorage();
async function detectCandidate(formatter, cwd) {
  const probed = /* @__PURE__ */ new Set();
  let detected = false;
  let error;
  try {
    detected = await probedCommandsStorage.run(probed, () => formatter.detect(cwd));
  } catch (err) {
    error = err;
  }
  const stalledCommands = [...probed].filter((command) => whichTransientCommands.has(command));
  return {
    detected,
    ...error !== void 0 && { error },
    outcome: {
      name: formatter.name,
      verdict: detected ? "available" : stalledCommands.length > 0 ? "unreachable" : "missing",
      stalledCommands
    }
  };
}
function resetWhichLatches() {
  whichLatchByCommand.clear();
  whichTransientCommands.clear();
  cooldownRecordedForRetryAtMs.clear();
}
var cooldownRecordedForRetryAtMs = /* @__PURE__ */ new Map();
function noteCooldownServedVerdict(command, latch) {
  if (latch.getOutcome() !== "transient")
    return;
  const retryAtMs = latch.getRetryAtMs();
  if (retryAtMs <= 0)
    return;
  if (cooldownRecordedForRetryAtMs.get(command) === retryAtMs)
    return;
  cooldownRecordedForRetryAtMs.set(command, retryAtMs);
  const cause = latch.getCause();
  if (cause === null) {
    logExtension({
      subsystem: "format",
      message: `which latch: transient outcome with no cause for ${command}; cooldown-served record dropped`,
      metadata: { tool: command, retryAtMs }
    });
    return;
  }
  logAvailabilityDecision({
    tool: command,
    verdict: "unavailable",
    outcome: "transient",
    cause,
    elapsedMs: 0,
    latched: false,
    retryAfterMs: Math.max(1, retryAtMs - Date.now()),
    budgetMs: WHICH_BUDGET_MS,
    servedFromCooldown: true,
    // No probe ran here: the latch's own remembered cause is replayed
    // as-is, so the call site is the one asserting it (#2209).
    classifiedBy: "caller"
  });
}
async function which(command) {
  probedCommandsStorage.getStore()?.add(command);
  let entry = whichLatchByCommand.get(command);
  if (!entry) {
    entry = { latch: createAvailabilityLatch(), resolved: null };
    whichLatchByCommand.set(command, entry);
  }
  const memo = entry.latch.read();
  if (memo !== null) {
    if (!memo)
      noteCooldownServedVerdict(command, entry.latch);
    return memo ? entry.resolved : null;
  }
  const stallSampler = startHostStallSampler();
  const startedAt = Date.now();
  const result = await safeSpawnAsync(process.platform === "win32" ? "where" : "which", [command], { timeout: WHICH_BUDGET_MS });
  const hostStallMs = stallSampler.stop();
  const elapsedMs = Date.now() - startedAt;
  const resolved = !result.error && result.status === 0 ? result.stdout?.trim().split(/\r?\n/)[0] ?? null : null;
  if (resolved) {
    entry.resolved = resolved;
    entry.latch.noteAvailable();
    whichTransientCommands.delete(command);
    cooldownRecordedForRetryAtMs.delete(command);
    logAvailabilityDecision({
      tool: command,
      verdict: "available",
      outcome: "success",
      cause: "ok",
      elapsedMs,
      latched: true,
      hostStallMs,
      budgetMs: WHICH_BUDGET_MS,
      classifiedBy: "probe"
    });
    return resolved;
  }
  entry.resolved = null;
  const proberRan = !result.error;
  const classified = classifyProbeFailure(result, {
    hostStallMs,
    ...proberRan && { unclassifiedFailureOutcome: "missing" }
  });
  let { outcome, cause } = classified;
  let outcomeForced = false;
  if (!proberRan && outcome !== "transient") {
    outcome = "transient";
    cause = "probe-rejected";
    outcomeForced = true;
  }
  const retryAfterMs = entry.latch.noteUnavailable(outcome, cause);
  if (outcome === "transient")
    whichTransientCommands.add(command);
  else
    whichTransientCommands.delete(command);
  cooldownRecordedForRetryAtMs.delete(command);
  logAvailabilityDecision({
    tool: command,
    verdict: "unavailable",
    outcome,
    cause,
    elapsedMs,
    latched: retryAfterMs === 0,
    hostStallMs,
    ...retryAfterMs > 0 && { retryAfterMs },
    budgetMs: WHICH_BUDGET_MS,
    classifiedBy: outcomeForced ? "caller" : "probe"
  });
  return null;
}
async function resolveGoFmtBinary() {
  const inPath = await which("gofmt");
  if (inPath)
    return inPath;
  const goCheck = await probeToolAsync("go", ["env", "GOROOT"], {
    timeout: 5e3
  });
  if (goCheck.error || goCheck.status !== 0)
    return null;
  const goroot = (goCheck.stdout ?? "").trim();
  if (!goroot)
    return null;
  const binary = path4.join(goroot, "bin", process.platform === "win32" ? "gofmt.exe" : "gofmt");
  return await fileExists(binary) ? binary : null;
}
async function findInVenv(binary, cwd) {
  return localBinPath(findLocalBinUpwards(binary, cwd, {
    windowsExt: ".exe",
    binDirs: VENV_BIN_DIRS
  })) ?? null;
}
async function findInVendorBin(binary, cwd) {
  return localBinPath(findLocalBinUpwards(binary, cwd, {
    windowsExt: ".bat",
    binDirs: VENDOR_BIN_DIRS
  })) ?? null;
}
async function findInNodeModules(binary, cwd) {
  return localBinPath(findLocalBinUpwards(binary, cwd)) ?? null;
}
async function canUseBundleExec(cwd) {
  if (await which("bundle") === null)
    return false;
  const lockfiles = await findUp(["Gemfile.lock"], cwd);
  return lockfiles.length > 0;
}
async function resolveManagedSmartDefaultCommand(formatterName, filePath, args) {
  const toolId = getAutoInstallToolIdForFormatter(formatterName);
  if (!toolId)
    return FORMATTER_UNAVAILABLE;
  const { ensureTool } = await import("./probes/installer.js");
  const installed = await ensureTool(toolId);
  if (!installed) {
    recordDegradationOnce({
      kind: "formatter-unavailable",
      subject: formatterName,
      reason: "managed formatter lookup and installation returned no executable"
    });
    return FORMATTER_UNAVAILABLE;
  }
  return [installed, ...args, filePath];
}
async function resolveManagedFormatterCommand(toolId, filePath, args, findLocal, cwd) {
  const local = findLocal && cwd ? await findLocal(toolId, cwd) : null;
  const installed = local ?? await which(toolId) ?? await getToolPath(toolId);
  return installed ? [installed, ...args, filePath] : FORMATTER_UNAVAILABLE;
}
function managedFormatterResolver(toolId, args, findLocal) {
  return (filePath, cwd) => resolveManagedFormatterCommand(toolId, filePath, args, findLocal, cwd);
}
function managedToolDetect(toolId, configDetect, nativeDetect) {
  return async (cwd) => {
    const available = nativeDetect && await nativeDetect(cwd) || Boolean(await getToolPath(toolId));
    return available && (configDetect ? await configDetect(cwd) : true);
  };
}
var EXPLICIT_FORMATTER_CONFIG_CHECKS = /* @__PURE__ */ new Map([
  ["biome", (cwd) => hasBiomeConfig(cwd)],
  [
    "prettier",
    (cwd) => hasPrettierConfig(cwd) || hasNearestPackageJsonField(cwd, "prettier")
  ],
  // .svelte is conditional beyond "an oxfmt config exists": oxfmt requires the
  // `svelte` package installed AND the config's `svelte` flag enabled
  // (verified empirically — see hasOxfmtSvelteConfig). The generic checks
  // below are NOT sufficient for .svelte — an oxfmt.toml with no svelte flag,
  // or an oxfmt dependency alone, both fail at runtime for .svelte
  // specifically (other extensions are unaffected by this stricter gate).
  [
    "oxfmt",
    (cwd, ext) => ext === ".svelte" ? hasOxfmtSvelteConfig(cwd) : hasOxfmtConfig(cwd) || hasVitePlusConfig(cwd) || // The published package is `oxfmt`; `@oxc-project/oxfmt` does not
    // exist on npm. Accept both (scoped kept for forward-compat).
    hasNearestPackageJsonDependency(cwd, "oxfmt") || hasNearestPackageJsonDependency(cwd, "@oxc-project/oxfmt")
  ],
  ["ruff", (cwd) => hasRuffConfig(cwd)],
  ["black", (cwd) => hasBlackConfig(cwd)],
  ["sqlfluff", (cwd) => hasSqlfluffConfig(cwd)],
  ["rubocop", (cwd) => hasRubocopConfig(cwd)],
  ["standardrb", (cwd) => hasStandardrbConfig(cwd)],
  ["clang-format", (cwd) => hasClangFormatConfig(cwd)],
  ["php-cs-fixer", (cwd) => hasPhpCsFixerConfig(cwd)],
  ["stylua", (cwd) => hasStyluaConfig(cwd)],
  ["ocamlformat", (cwd) => hasOcamlformatConfig(cwd)],
  ["google-java-format", (cwd) => hasGoogleJavaFormatConfig(cwd)],
  ["ktfmt", (cwd) => hasKtfmtConfig(cwd)],
  ["ktlint", (cwd) => hasKtlintConfig(cwd)],
  ["cljfmt", (cwd) => hasCljfmtConfig(cwd)],
  ["cmake-format", (cwd) => hasCmakeFormatConfig(cwd)],
  ["psscriptanalyzer-format", (cwd) => hasPSScriptAnalyzerConfig(cwd)],
  // #1595 sweep — see the comment above hasCsharpierConfig et al. in
  // tool-policy.ts for why nixfmt (the 8th formatter #1572 flagged) is NOT
  // wired here: it has no config-file convention and no manifest-marker
  // equivalent to `.terraform.lock.hcl`, so there is no honest opt-in signal.
  ["csharpier", (cwd) => hasCsharpierConfig(cwd)],
  ["ormolu", (cwd) => hasOrmoluConfig(cwd)],
  ["taplo", (cwd) => hasTaploConfig(cwd)],
  ["terraform", (cwd) => hasTerraformConfig(cwd)],
  ["swiftformat", (cwd) => hasSwiftformatConfig(cwd)],
  ["fantomas", (cwd) => hasFantomasConfig(cwd)],
  ["mix", (cwd) => hasMixFormatConfig(cwd)]
]);
function hasExplicitFormatterConfig(formatterName, cwd, ext) {
  return EXPLICIT_FORMATTER_CONFIG_CHECKS.get(formatterName)?.(cwd, ext) ?? false;
}
var FORMATTERS_WITH_EXPLICIT_CONFIG_CHECK = new Set(EXPLICIT_FORMATTER_CONFIG_CHECKS.keys());
async function hasEditorConfig(cwd) {
  return findNearestContaining(cwd, [".editorconfig"]) !== void 0;
}
async function indentationArgs(filePath, tool, cwd) {
  if (await hasEditorConfig(cwd) || hasExplicitFormatterConfig(tool, cwd, path4.extname(filePath))) {
    return [];
  }
  let content;
  try {
    content = await fs2.readFile(filePath, "utf8");
  } catch {
    return [];
  }
  if (!hasDetectableIndentation(content))
    return null;
  const indentation = detectIndentation(content);
  if (!indentation) {
    recordDegradationOnce({
      kind: "formatter-skip",
      subject: tool,
      reason: "indentation evidence is ambiguous; formatter style not pinned"
    });
    return null;
  }
  if (tool === "shfmt")
    return indentation.style === "tab" ? ["-i", "0"] : ["-i", String(indentation.width)];
  if (tool === "prettier") {
    return [
      indentation.style === "tab" ? "--use-tabs" : "--no-use-tabs",
      "--tab-width",
      String(indentation.width)
    ];
  }
  if (tool === "ruff") {
    return [
      "--config",
      `indent-width=${indentation.width}`,
      "--config",
      `format.indent-style='${indentation.style}'`
    ];
  }
  return [
    "--indent-style",
    indentation.style,
    "--indent-width",
    String(indentation.width)
  ];
}
function resolveFormatterCwd(absolutePath, formatterName, homeDir = os2.homedir()) {
  return resolveToolCwd("formatter", formatterName ?? "unknown", absolutePath, {
    // Formatter discovery historically walks above the file directory. The
    // filesystem root is the neutral dispatch boundary; the seam's `$HOME`
    // ceiling prevents it from escaping the user's workspace.
    cwd: path4.parse(path4.resolve(absolutePath)).root,
    homeDir
  }).cwd;
}
var BIOME_UNMATCHED_FLAG = "--no-errors-on-unmatched";
var biomeFormatter = {
  name: "biome",
  command: [
    "npx",
    "@biomejs/biome",
    "format",
    "--write",
    BIOME_UNMATCHED_FLAG,
    "$FILE"
  ],
  async resolveCommand(filePath, cwd) {
    const editorConfigFlag = await hasEditorConfig(cwd) ? ["--use-editorconfig=true"] : [];
    const styleArgs = await indentationArgs(filePath, "biome", cwd);
    if (styleArgs === null)
      return SKIP_FORMATTING;
    const args = [
      "format",
      "--write",
      BIOME_UNMATCHED_FLAG,
      ...editorConfigFlag,
      ...styleArgs
    ];
    const local = await findInNodeModules("biome", cwd);
    if (local)
      return [local, ...args, filePath];
    const global = await findGlobalBinary("biome");
    if (global)
      return [global, ...args, filePath];
    const toolId = getAutoInstallToolIdForFormatter("biome");
    if (!toolId)
      return null;
    const { ensureTool } = await import("./probes/installer.js");
    const installed = await ensureTool(toolId);
    if (installed)
      return [installed, ...args, filePath];
    return null;
  },
  extensions: [
    ".js",
    ".jsx",
    ".mjs",
    ".cjs",
    ".ts",
    ".tsx",
    ".mts",
    ".cts",
    ".json",
    ".jsonc",
    ".css",
    ".scss",
    ".sass",
    ".vue",
    ".svelte",
    ".html",
    ".htm"
  ],
  async detect(cwd) {
    return hasBiomeConfig(cwd) || hasNearestPackageJsonDependency(cwd, "@biomejs/biome");
  }
};
var prettierFormatter = {
  name: "prettier",
  command: ["npx", "prettier", "--write", "$FILE"],
  async resolveCommand(filePath, cwd) {
    const styleArgs = await indentationArgs(filePath, "prettier", cwd);
    if (styleArgs === null)
      return SKIP_FORMATTING;
    const args = ["--write", ...styleArgs];
    const local = await findInNodeModules("prettier", cwd);
    if (local)
      return [local, ...args, filePath];
    const global = await findGlobalBinary("prettier");
    if (global)
      return [global, ...args, filePath];
    return resolveManagedSmartDefaultCommand("prettier", filePath, args);
  },
  extensions: [
    ".js",
    ".jsx",
    ".mjs",
    ".cjs",
    ".ts",
    ".tsx",
    ".mts",
    ".cts",
    ".json",
    ".jsonc",
    ".css",
    ".scss",
    ".sass",
    ".less",
    ".vue",
    ".svelte",
    ".html",
    ".htm",
    ".md",
    ".mdx",
    ".yaml",
    ".yml",
    ".graphql",
    ".gql"
  ],
  async detect(cwd) {
    return hasPrettierConfig(cwd) || hasNearestPackageJsonDependency(cwd, "prettier") || hasNearestPackageJsonField(cwd, "prettier");
  }
};
var OXFMT_NO_ERROR_ON_UNMATCHED = "--no-error-on-unmatched-pattern";
var oxfmtFormatter = {
  name: "oxfmt",
  command: ["oxfmt", OXFMT_NO_ERROR_ON_UNMATCHED, "$FILE"],
  // #1337 audit: oxfmt (and the `vp fmt --write` path) publish no exit-code
  // table. `--write` is the default and `--check` is the separate verification
  // mode, so there is no documented nonzero-on-reformat. Absent a documented
  // benign-nonzero mode, it stays strict — the safe direction, since the failure
  // mode of guessing wrong the other way is a silent no-op (#1336).
  async resolveCommand(filePath, cwd) {
    if (hasVitePlusConfig(cwd)) {
      const localVp = await findInNodeModules("vp", cwd);
      if (localVp)
        return [localVp, "fmt", filePath, "--write"];
      const globalVp = await which("vp");
      if (globalVp)
        return [globalVp, "fmt", filePath, "--write"];
    }
    const local = await findInNodeModules("oxfmt", cwd);
    if (local)
      return [local, OXFMT_NO_ERROR_ON_UNMATCHED, filePath];
    const found = await which("oxfmt");
    if (found)
      return [found, OXFMT_NO_ERROR_ON_UNMATCHED, filePath];
    return await resolveManagedFormatterCommand("oxfmt", filePath, [OXFMT_NO_ERROR_ON_UNMATCHED], findInNodeModules, cwd) ?? FORMATTER_UNAVAILABLE;
  },
  // Single source of truth: OXFMT_SUPPORTED_EXTENSIONS in tool-policy.ts.
  // Do not hand-maintain a second copy of this list (#1134 — previously two
  // parallel hand-maintained lists, the #883 single-source-of-truth class).
  extensions: [...OXFMT_SUPPORTED_EXTENSIONS],
  async detect(cwd) {
    return hasOxfmtConfig(cwd) || hasVitePlusConfig(cwd) || // Published package is `oxfmt` (the scoped name does not exist on npm).
    hasNearestPackageJsonDependency(cwd, "oxfmt") || hasNearestPackageJsonDependency(cwd, "@oxc-project/oxfmt");
  }
};
var ruffFormatter = {
  name: "ruff",
  command: ["ruff", "format", "$FILE"],
  extensions: [".py", ".pyi"],
  // Strict (the #1337 default): `ruff format` exits 0 on a successful in-place
  // rewrite and 2 on argument rejection / syntax error (verified, ruff 0.x:
  // well-formed → 0, reformatted → 0, unparseable → 2). The exit-2 no-op is
  // exactly what hid the bad --indent-style flags for a full release cycle.
  async resolveCommand(filePath, cwd) {
    const styleArgs = await indentationArgs(filePath, "ruff", cwd);
    if (styleArgs === null)
      return SKIP_FORMATTING;
    const args = ["format", ...styleArgs];
    const venv = await findInVenv("ruff", cwd);
    if (venv)
      return [venv, ...args, filePath];
    const toolId = getAutoInstallToolIdForFormatter("ruff");
    if (!toolId)
      return null;
    const { ensureTool } = await import("./probes/installer.js");
    const installed = await ensureTool(toolId);
    if (installed)
      return [installed, ...args, filePath];
    return FORMATTER_UNAVAILABLE;
  },
  async detect(cwd) {
    if (hasRuffConfig(cwd))
      return true;
    return Boolean(await getToolPath("ruff"));
  }
};
var blackFormatter = {
  name: "black",
  command: ["black", "$FILE"],
  extensions: [".py", ".pyi"],
  resolveCommand: managedFormatterResolver("black", [], findInVenv),
  async detect(cwd) {
    return hasBlackConfig(cwd);
  }
};
var sqlfluffFormatter = {
  name: "sqlfluff",
  command: ["sqlfluff", "fix", "--force", "$FILE"],
  extensions: [".sql"],
  lenientExitCode: "lint-autofix: `sqlfluff fix` writes the corrected file and then exits 1 when unfixable violations remain (its documented exit codes are 0 = all clean, 1 = violations remain, 2 = command/config failure), so a nonzero exit routinely accompanies a successful rewrite.",
  lenientStatuses: [1],
  async resolveCommand(filePath, cwd) {
    const venv = await findInVenv("sqlfluff", cwd);
    if (venv)
      return [venv, "fix", "--force", filePath];
    return null;
  },
  async detect(cwd) {
    return hasSqlfluffConfig(cwd);
  }
};
var gofmtFormatter = {
  name: "gofmt",
  command: ["gofmt", "-w", "$FILE"],
  extensions: [".go"],
  async resolveCommand(filePath, _cwd) {
    const gofmtBinary = await resolveGoFmtBinary();
    if (!gofmtBinary)
      return null;
    return [gofmtBinary, "-w", filePath];
  },
  async detect(_cwd) {
    return await resolveGoFmtBinary() !== null;
  }
};
var rustfmtFormatter = {
  name: "rustfmt",
  command: ["rustfmt", "$FILE"],
  extensions: [".rs"],
  // #2466: rustfmt defaults to an OLDER edition than the file's actual Cargo
  // package when invoked bare, so it can reject valid newer-edition syntax
  // (e.g. Rust 2024). Carry the nearest package's `edition` (honoring
  // `edition.workspace = true` inheritance) through `--edition`; `undefined`
  // (unreadable/unparseable manifest) falls back to the static command
  // above, unchanged from pre-#2466 behavior.
  async resolveCommand(filePath, _cwd) {
    const edition = await resolveCargoPackageEdition(filePath);
    if (edition === void 0)
      return null;
    return ["rustfmt", "--edition", edition, filePath];
  },
  async detect(cwd) {
    if (await which("rustfmt") !== null)
      return true;
    const rustProject = (await findUp(["Cargo.toml"], cwd)).length > 0;
    if (!rustProject)
      return false;
    if (await which("rustup") === null)
      return false;
    await tryLazyInstallFormatterTool("rustfmt", cwd);
    return await which("rustfmt") !== null;
  }
};
var zigFormatter = {
  name: "zig",
  command: ["zig", "fmt", "$FILE"],
  extensions: [".zig", ".zon"],
  async detect(_cwd) {
    return await which("zig") !== null;
  }
};
var dartFormatter = {
  name: "dart",
  command: ["dart", "format", "$FILE"],
  extensions: [".dart"],
  async detect(_cwd) {
    return await which("dart") !== null;
  }
};
var shfmtFormatter = {
  name: "shfmt",
  command: ["shfmt", "-w", "$FILE"],
  extensions: [".sh", ".bash"],
  async resolveCommand(filePath, cwd) {
    const styleArgs = await indentationArgs(filePath, "shfmt", cwd);
    if (styleArgs === null)
      return SKIP_FORMATTING;
    const inPath = await which("shfmt");
    if (inPath)
      return [inPath, "-w", ...styleArgs, filePath];
    return resolveManagedSmartDefaultCommand("shfmt", filePath, [
      "-w",
      ...styleArgs
    ]);
  },
  detect: managedToolDetect("shfmt", void 0, async () => await which("shfmt") !== null)
};
var nixfmtFormatter = {
  name: "nixfmt",
  command: ["nixfmt", "$FILE"],
  // #1337 audit: nixfmt's README documents in-place formatting but has no
  // exit-code section and no change-detection mode, so nothing documents a
  // benign nonzero. Strict by default (see oxfmt above for the rationale).
  extensions: [".nix"],
  async detect(_cwd) {
    return await which("nixfmt") !== null;
  }
};
var mixFormatter = {
  name: "mix",
  command: ["mix", "format", "$FILE"],
  extensions: [".ex", ".exs", ".eex", ".heex", ".leex"],
  async detect(_cwd) {
    return await which("mix") !== null;
  }
};
var ocamlformatFormatter = {
  name: "ocamlformat",
  command: ["ocamlformat", "-i", "$FILE"],
  extensions: [".ml", ".mli"],
  async detect(cwd) {
    const hasBinary = await which("ocamlformat") !== null;
    if (!hasBinary)
      return false;
    const configs = [".ocamlformat"];
    const found = await findUp(configs, cwd);
    return found.length > 0;
  }
};
var clangFormatFormatter = {
  name: "clang-format",
  command: ["clang-format", "-i", "$FILE"],
  extensions: [".c", ".cc", ".cpp", ".cxx", ".h", ".hpp", ".ino"],
  async detect(cwd) {
    const hasBinary = await which("clang-format") !== null;
    if (!hasBinary)
      return false;
    const configs = [".clang-format", "_clang-format"];
    const found = await findUp(configs, cwd);
    return found.length > 0;
  }
};
var ktlintFormatter = {
  name: "ktlint",
  command: ["ktlint", "-F", "$FILE"],
  extensions: [".kt", ".kts"],
  lenientExitCode: "lint-autofix: `ktlint -F` autocorrects what it can and then exits 1 if any lint error remains unfixed \u2014 the documented CLI contract (ktlint exits nonzero whenever violations are reported, and -F does not suppress the ones it cannot correct).",
  lenientStatuses: [1],
  async resolveCommand(filePath, _cwd) {
    const inPath = await which("ktlint");
    if (inPath)
      return [inPath, "-F", filePath];
    return resolveManagedSmartDefaultCommand("ktlint", filePath, ["-F"]);
  },
  detect: managedToolDetect("ktlint", void 0, async () => await which("ktlint") !== null)
};
var ktfmtFormatter = {
  name: "ktfmt",
  // ktfmt formats in place when given a file path (no flag needed).
  command: ["ktfmt", "$FILE"],
  extensions: [".kt", ".kts"],
  // #2468: ktfmt's CLI never reads a project's Gradle `ktfmt { googleStyle()
  // | kotlinLangStyle() }` selection — style is CLI-flag-only
  // (`--google-style`/`--kotlinlang-style`, verified against ktfmt v0.63's
  // own arg parser). Carry the nearest module's declared style through;
  // `undefined` (no declaration, unreadable/unparseable manifest, or an
  // unsupported style like the removed `dropboxStyle()`) falls back to the
  // bare invocation, unchanged from pre-#2468 behavior.
  async resolveCommand(filePath, _cwd) {
    const styleFlag = await resolveKtfmtGradleStyle(filePath);
    const inPath = await which("ktfmt");
    if (inPath)
      return styleFlag ? [inPath, styleFlag, filePath] : [inPath, filePath];
    const { ensureTool } = await import("./probes/installer.js");
    const installed = await ensureTool("ktfmt");
    if (!installed)
      return FORMATTER_UNAVAILABLE;
    return styleFlag ? [installed, styleFlag, filePath] : [installed, filePath];
  },
  async detect(cwd) {
    return hasKtfmtConfig(cwd);
  }
};
var rubocopFormatter = {
  name: "rubocop",
  command: ["rubocop", "-a", "--no-color", "$FILE"],
  extensions: [".rb", ".rake", ".gemspec", ".ru"],
  lenientExitCode: "lint-autofix: `rubocop -a` exits 1 whenever ANY offense remains after it has already rewritten the file. Verified locally (rubocop on Ruby 3.4): a file with an unfixable Lint/UselessAssignment exits 1, and even a tidy file exits 1 on an unfixable Style/Documentation offense \u2014 nonzero is the normal outcome, not a failure.",
  lenientStatuses: [1],
  async resolveCommand(filePath, cwd) {
    if (await canUseBundleExec(cwd))
      return ["bundle", "exec", "rubocop", "-a", "--no-color", filePath];
    return null;
  },
  async detect(cwd) {
    if (!hasRubocopConfig(cwd))
      return false;
    if (await which("rubocop") !== null)
      return true;
    await tryLazyInstallFormatterTool("rubocop", cwd);
    return await which("rubocop") !== null;
  }
};
var standardrbFormatter = {
  name: "standardrb",
  command: ["standardrb", "--fix", "$FILE"],
  extensions: [".rb", ".rake"],
  lenientExitCode: "lint-autofix: standardrb is a RuboCop wrapper and inherits its exit contract \u2014 `--fix` exits 1 when offenses remain after the rewrite.",
  lenientStatuses: [1],
  async resolveCommand(filePath, cwd) {
    if (await canUseBundleExec(cwd))
      return ["bundle", "exec", "standardrb", "--fix", filePath];
    return null;
  },
  async detect(cwd) {
    if (!hasStandardrbConfig(cwd))
      return false;
    return await which("standardrb") !== null;
  }
};
var gleamFormatter = {
  name: "gleam",
  command: ["gleam", "format", "$FILE"],
  extensions: [".gleam"],
  async detect(cwd) {
    const found = await findUp(["gleam.toml"], cwd);
    if (found.length > 0)
      return await which("gleam") !== null;
    return false;
  }
};
var typstyleFormatter = {
  name: "typstyle",
  command: ["typstyle", "-i", "$FILE"],
  extensions: [".typ", ".typc"],
  async resolveCommand(filePath) {
    const inPath = await which("typstyle");
    if (inPath)
      return [inPath, "-i", filePath];
    return resolveManagedSmartDefaultCommand("typstyle", filePath, ["-i"]);
  },
  detect: managedToolDetect("typstyle", void 0, async () => await which("typstyle") !== null)
};
var terraformFormatter = {
  name: "terraform",
  command: ["terraform", "fmt", "$FILE"],
  extensions: [".tf", ".tfvars"],
  async detect(_cwd) {
    return await which("terraform") !== null;
  }
};
var terragruntHclFormatter = {
  name: "terragrunt-hcl",
  command: ["terragrunt", "hcl", "fmt", "--file", "$FILE"],
  extensions: [],
  filenames: TERRAGRUNT_FILENAMES,
  // Strict (the #1337 default): verified exit 0 on a successful in-place format
  // against terragrunt v1.1.2. A binary predating the `hcl` command group exits
  // nonzero and touches nothing, which unguarded reads as "already formatted".
  async detect(_cwd) {
    return await which("terragrunt") !== null;
  }
};
var phpCsFixerFormatter = {
  name: "php-cs-fixer",
  command: ["php-cs-fixer", "fix", "$FILE"],
  extensions: [".php"],
  // #2472: php-cs-fixer does NOT walk up parent directories looking for its
  // own config the way prettier/biome/eslint do (verified against upstream
  // `computeConfigFiles()` — see `resolvePhpCsFixerConfig`'s doc comment),
  // and `formatFile` spawns with cwd = the FILE's own directory, which is
  // not necessarily where the ancestor config `detect()` found actually
  // lives. Always resolve the binary explicitly here (vendor/bin first,
  // then global) rather than falling through to the static `command` above
  // — that static command can never carry `--config`, so a config found at
  // an ancestor would silently be dropped whenever the vendor lookup here
  // missed but a global binary still resolved. `--config` is attached
  // whenever a config resolves, even when it sits in the file's own
  // directory (AC3): unlike the pre-#2472 code, correctness no longer
  // depends on php-cs-fixer's own (nonexistent) upward search.
  async resolveCommand(filePath, cwd) {
    const configPath = resolvePhpCsFixerConfig(filePath);
    const binary = await findInVendorBin("php-cs-fixer", cwd) ?? await which("php-cs-fixer");
    const managed = await resolveManagedFormatterCommand("php-cs-fixer", filePath, [], findInVendorBin, cwd);
    if (managed === FORMATTER_UNAVAILABLE)
      return FORMATTER_UNAVAILABLE;
    const resolved = binary ?? managed[0];
    if (!resolved)
      return FORMATTER_UNAVAILABLE;
    return configPath ? [resolved, "fix", "--config", configPath, filePath] : [resolved, "fix", filePath];
  },
  detect: managedToolDetect("php-cs-fixer", async (cwd) => (await findUp([".php-cs-fixer.php", ".php-cs-fixer.dist.php"], cwd)).length > 0, async (cwd) => Boolean(await findInVendorBin("php-cs-fixer", cwd) || await which("php-cs-fixer")))
};
var csharpierFormatter = {
  name: "csharpier",
  // CSharpier ≥1.0 is a standalone `csharpier format <file>`; the `dotnet
  // csharpier <file>` form was removed (a bare `dotnet csharpier` now errors
  // "a dotnet-prefixed executable with this name could not be found"). Keep the
  // legacy form as a fallback for CSharpier 0.x via resolveCommand.
  command: ["csharpier", "format", "$FILE"],
  extensions: [".cs"],
  async resolveCommand(filePath, _cwd) {
    if (await which("csharpier") !== null) {
      return ["csharpier", "format", filePath];
    }
    if (await which("dotnet") !== null) {
      const legacy = await probeToolAsync("dotnet", ["csharpier", "--version"], { timeout: 5e3 });
      if (!legacy.error && legacy.status === 0) {
        return ["dotnet", "csharpier", filePath];
      }
    }
    return null;
  },
  async detect(_cwd) {
    if (await which("csharpier") !== null)
      return true;
    if (await which("dotnet") === null)
      return false;
    const result = await probeToolAsync("dotnet", ["csharpier", "--version"], {
      timeout: 5e3
    });
    return !result.error && result.status === 0;
  }
};
var fantomasFormatter = {
  name: "fantomas",
  command: ["fantomas", "$FILE"],
  extensions: [".fs", ".fsi", ".fsx"],
  async detect(_cwd) {
    return await which("fantomas") !== null;
  }
};
var swiftformatFormatter = {
  name: "swiftformat",
  command: ["swiftformat", "$FILE"],
  extensions: [".swift"],
  async detect(_cwd) {
    return await which("swiftformat") !== null;
  }
};
var styluaFormatter = {
  name: "stylua",
  command: ["stylua", "$FILE"],
  extensions: [".lua"],
  resolveCommand: managedFormatterResolver("stylua", [], (binary, cwd) => localBinPath(findLocalBinUpwards(binary, cwd))),
  detect: managedToolDetect("stylua", async (cwd) => (await findUp(["stylua.toml", ".stylua.toml"], cwd)).length > 0, async (cwd) => Boolean(localBinPath(findLocalBinUpwards("stylua", cwd)) || await which("stylua")))
};
var ormoluFormatter = {
  name: "ormolu",
  command: ["ormolu", "--mode", "inplace", "$FILE"],
  extensions: [".hs", ".lhs"],
  async detect(_cwd) {
    return await which("ormolu") !== null;
  }
};
var taploFormatter = {
  name: "taplo",
  command: ["taplo", "fmt", "$FILE"],
  extensions: [".toml"],
  async resolveCommand(filePath, _cwd) {
    const inPath = await which("taplo");
    if (inPath)
      return [inPath, "fmt", filePath];
    return resolveManagedSmartDefaultCommand("taplo", filePath, ["fmt"]);
  },
  detect: managedToolDetect("taplo", void 0, async () => await which("taplo") !== null)
};
var googleJavaFormatFormatter = {
  name: "google-java-format",
  command: ["google-java-format", "--replace", "$FILE"],
  extensions: [".java"],
  resolveCommand: managedFormatterResolver("google-java-format", ["--replace"]),
  detect: managedToolDetect("google-java-format", hasGoogleJavaFormatConfig, async () => await which("google-java-format") !== null)
};
var cljfmtFormatter = {
  name: "cljfmt",
  command: ["cljfmt", "fix", "$FILE"],
  extensions: [".clj", ".cljc", ".cljs"],
  resolveCommand: managedFormatterResolver("cljfmt", ["fix"]),
  detect: managedToolDetect("cljfmt", hasCljfmtConfig, async () => await which("cljfmt") !== null)
};
var cmakeFormatFormatter = {
  name: "cmake-format",
  command: ["cmake-format", "-i", "$FILE"],
  extensions: [".cmake"],
  resolveCommand: managedFormatterResolver("cmake-format", ["-i"]),
  detect: managedToolDetect("cmake-format", hasCmakeFormatConfig, async () => await which("cmake-format") !== null)
};
var cueFormatter = {
  name: "cue",
  // `cue fmt <file>` rewrites in place already. There is no `-w`: the only
  // flags are --check, -d/--diff and --files, so `cue fmt -w` aborts with
  // "unknown shorthand flag: 'w'" on every .cue write (verified on cue
  // v0.17.1).
  command: ["cue", "fmt", "$FILE"],
  extensions: [".cue"],
  async detect(_cwd) {
    return await which("cue") !== null;
  }
};
function psScriptAnalyzerCommand(filePath, settingsPath) {
  const quoted = filePath.replace(/'/g, "''");
  const settingsArg = settingsPath ? ` -Settings '${settingsPath.replace(/'/g, "''")}'` : "";
  return [
    "$ErrorActionPreference = 'Stop'",
    `$p = '${quoted}'`,
    "$content = Get-Content -Raw -LiteralPath $p",
    "if ([string]::IsNullOrWhiteSpace($content)) { exit 0 }",
    `$formatted = Invoke-Formatter -ScriptDefinition $content${settingsArg}`,
    "if ($null -eq $formatted) { throw 'Invoke-Formatter returned no output' }",
    "Set-Content -LiteralPath $p -Value $formatted"
  ].join("; ");
}
var psscriptanalyzerFormatFormatter = {
  name: "psscriptanalyzer-format",
  command: ["pwsh", "-NoProfile", "-Command", psScriptAnalyzerCommand("$FILE")],
  extensions: [".ps1", ".psm1", ".psd1"],
  async resolveCommand(filePath, cwd) {
    const pwsh = await which("pwsh") ?? await which("powershell");
    if (!pwsh)
      return null;
    const settingsPath = findPSScriptAnalyzerConfigPath(cwd);
    return [
      pwsh,
      "-NoProfile",
      "-Command",
      psScriptAnalyzerCommand(filePath, settingsPath)
    ];
  },
  async detect(_cwd) {
    const pwsh = await which("pwsh") ?? await which("powershell");
    if (!pwsh)
      return false;
    const result = await probeToolAsync(pwsh, [
      "-NoProfile",
      "-Command",
      "Get-Module -ListAvailable PSScriptAnalyzer | Select-Object -First 1 -ExpandProperty Name"
    ], { timeout: 5e3 });
    return (result.stdout ?? "").includes("PSScriptAnalyzer");
  }
};
var ALL_FORMATTERS = [
  biomeFormatter,
  prettierFormatter,
  oxfmtFormatter,
  ruffFormatter,
  blackFormatter,
  sqlfluffFormatter,
  gofmtFormatter,
  rustfmtFormatter,
  zigFormatter,
  dartFormatter,
  shfmtFormatter,
  nixfmtFormatter,
  mixFormatter,
  ocamlformatFormatter,
  clangFormatFormatter,
  ktlintFormatter,
  ktfmtFormatter,
  terraformFormatter,
  terragruntHclFormatter,
  phpCsFixerFormatter,
  csharpierFormatter,
  fantomasFormatter,
  swiftformatFormatter,
  styluaFormatter,
  ormoluFormatter,
  rubocopFormatter,
  standardrbFormatter,
  gleamFormatter,
  typstyleFormatter,
  taploFormatter,
  googleJavaFormatFormatter,
  cljfmtFormatter,
  cmakeFormatFormatter,
  cueFormatter,
  psscriptanalyzerFormatFormatter
];
var FILENAME_FORMATTER_BASENAMES = new Set(ALL_FORMATTERS.flatMap((f) => f.filenames ?? []));
var detectionCache = new BoundedLruCache(32);
var formatterSignatureFlights = new BoundedLruCache(32);
var formatterCacheGeneration = createGenerationSource("formatter-cache");
var FORMATTER_CONFIG_FILES = [
  "package.json",
  "biome.json",
  "biome.jsonc",
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
  "prettier.config.ts",
  "pyproject.toml",
  "ruff.toml",
  ".ruff.toml",
  "black.toml",
  ".black",
  "tox.ini",
  "setup.cfg",
  "requirements.txt",
  "Pipfile",
  ".sqlfluff",
  ".rubocop.yml",
  ".rubocop.yaml",
  "Gemfile",
  ".clang-format",
  "_clang-format",
  ".php-cs-fixer.php",
  ".php-cs-fixer.dist.php",
  "stylua.toml",
  ".stylua.toml",
  ".ocamlformat",
  ".editorconfig",
  ".google-java-format",
  ".ktfmt",
  ".ktfmt.kts",
  "build.gradle.kts",
  "build.gradle",
  "settings.gradle.kts",
  "settings.gradle",
  ".cljfmt.edn",
  "cljfmt.edn",
  ".cljfmt",
  ".cmake-format",
  ".cmake-format.yaml",
  ".cmake-format.yml",
  ".cmake-format.json",
  ".cmake-format.py",
  "cmake-format.py",
  "cmake-format.yaml",
  "cmake-format.yml",
  "oxfmt.toml",
  ".oxfmtrc.json",
  "vite-plus.json",
  "vite.config.ts",
  "vite.config.mts",
  "vite.config.cts",
  "vite.config.js",
  "vite.config.mjs",
  "vite.config.cjs",
  "PSScriptAnalyzerSettings.psd1",
  "ScriptAnalyzerSettings.psd1",
  // #1595 sweep additions.
  ".csharpierrc",
  ".csharpierrc.json",
  ".csharpierrc.yaml",
  ".csharpierrc.yml",
  ".ormolu",
  "taplo.toml",
  ".taplo.toml",
  ".terraform.lock.hcl",
  ".swiftformat",
  ".fantomasignore",
  ".formatter.exs"
];
async function formatterConfigSignature(cwd) {
  const paths = await findUp(FORMATTER_CONFIG_FILES, cwd);
  const parts = await Promise.all(paths.sort(compareOrdinal).map(async (filePath) => {
    try {
      const stat2 = await fs2.stat(filePath);
      return `${filePath}:${stat2.mtimeMs}:${stat2.size}`;
    } catch {
      return `${filePath}:missing`;
    }
  }));
  return parts.join("|");
}
async function getFormatterConfigSignature(cwd, normalizedCwd) {
  const existing = formatterSignatureFlights.get(normalizedCwd);
  if (existing)
    return existing.promise;
  const promise = formatterConfigSignature(cwd).finally(() => {
    const current = formatterSignatureFlights.get(normalizedCwd);
    if (current?.promise === promise)
      formatterSignatureFlights.delete(normalizedCwd);
  });
  formatterSignatureFlights.set(normalizedCwd, { promise });
  return promise;
}
async function getFormattersForFile(filePath, cwd) {
  const ext = path4.extname(filePath).toLowerCase();
  const base = path4.basename(filePath).toLowerCase();
  const normalizedCwd = normalizeMapKey(cwd);
  const cacheKey = FILENAME_FORMATTER_BASENAMES.has(base) ? `${normalizedCwd}:${ext}:${base}` : `${normalizedCwd}:${ext}`;
  let cached = detectionCache.get(normalizedCwd);
  if (cached?.entries.has(cacheKey)) {
    const enabledNames2 = cached.entries.get(cacheKey);
    const selectedFormatterName = enabledNames2 && enabledNames2.length > 0 ? enabledNames2[0] : null;
    logLatency({
      type: "phase",
      phase: "formatter_selected",
      filePath,
      durationMs: 0,
      metadata: {
        formatter: selectedFormatterName,
        reason: "cache",
        cached: true,
        outcome: "hit",
        cwd
      }
    });
    if (!enabledNames2 || enabledNames2.length === 0)
      return [];
    return ALL_FORMATTERS.filter((f) => enabledNames2.includes(f.name));
  }
  if (!cached) {
    const generation = formatterCacheGeneration.capture();
    const configSignature = await getFormatterConfigSignature(cwd, normalizedCwd);
    if (!generation.isCurrent()) {
      return getFormattersForFile(filePath, cwd);
    }
    cached = detectionCache.get(normalizedCwd);
    if (!cached) {
      cached = { signature: configSignature, entries: /* @__PURE__ */ new Map() };
      detectionCache.set(normalizedCwd, cached);
    }
  }
  const matching = ALL_FORMATTERS.filter((f) => f.extensions.includes(ext) || f.filenames?.includes(base));
  const formatterPolicy = getFormatterPolicyForFile(filePath);
  const smartDefaultFormatterName = getSmartDefaultFormatterName(filePath);
  const candidateFormatters = formatterPolicy?.formatterNames?.length ? matching.filter((f) => formatterPolicy.formatterNames.includes(f.name)) : matching;
  let selected;
  const candidateOutcomes = [];
  if (formatterPolicy) {
    const explicitlyConfigured = candidateFormatters.filter((formatter) => hasExplicitFormatterConfig(formatter.name, cwd, ext));
    if (explicitlyConfigured.length > 0) {
      selected = formatterPolicy.defaultFormatter ? explicitlyConfigured.find((f) => f.name === formatterPolicy.defaultFormatter) ?? explicitlyConfigured[0] : explicitlyConfigured[0];
    } else if (smartDefaultFormatterName) {
      const smartDefaultFormatter = candidateFormatters.find((f) => f.name === smartDefaultFormatterName);
      if (smartDefaultFormatter) {
        const autoInstallToolId = getAutoInstallToolIdForFormatter(smartDefaultFormatter.name);
        if (autoInstallToolId) {
          selected = smartDefaultFormatter;
        } else {
          const { detected, error, outcome } = await detectCandidate(smartDefaultFormatter, cwd);
          candidateOutcomes.push(outcome);
          if (error !== void 0)
            throw error;
          if (detected)
            selected = smartDefaultFormatter;
        }
      }
    }
  } else {
    for (const formatter of candidateFormatters) {
      const { detected, error, outcome } = await detectCandidate(formatter, cwd);
      candidateOutcomes.push(outcome);
      if (error !== void 0) {
        logExtension({
          subsystem: "format",
          message: `Detection failed for ${formatter.name}: ${error instanceof Error ? error.message : String(error)}`,
          metadata: { formatter: formatter.name, cwd }
        });
        continue;
      }
      if (detected) {
        selected = formatter;
        break;
      }
    }
  }
  const enabled = selected ? [selected] : [];
  const stalledCandidateCommands = [
    ...new Set(candidateOutcomes.flatMap((outcome) => outcome.stalledCommands))
  ];
  const poisonedByTransientProbe = enabled.length === 0 && stalledCandidateCommands.length > 0;
  const winnerIndex = selected ? candidateOutcomes.findIndex((outcome) => outcome.name === selected.name) : -1;
  const unreachablePreferred = candidateOutcomes.slice(0, winnerIndex === -1 ? 0 : winnerIndex).filter((outcome) => outcome.verdict === "unreachable").map((outcome) => outcome.name);
  const degradedSelection = unreachablePreferred.length > 0;
  let selectionReason;
  if (poisonedByTransientProbe) {
    selectionReason = "probe-timeout";
  } else if (degradedSelection) {
    selectionReason = "preferred-unreachable";
  } else if (!selected) {
    selectionReason = "none";
  } else if (!formatterPolicy) {
    selectionReason = "detect";
  } else {
    selectionReason = candidateFormatters.some((f) => hasExplicitFormatterConfig(f.name, cwd, ext)) ? "explicit-config" : "smart-default";
  }
  const provisional = poisonedByTransientProbe || degradedSelection;
  logLatency({
    type: "phase",
    phase: "formatter_selected",
    filePath,
    durationMs: 0,
    metadata: {
      formatter: selected?.name ?? null,
      reason: selectionReason,
      outcome: "miss",
      cwd,
      ...provisional && {
        cached: false,
        stalledProbes: stalledCandidateCommands
      },
      ...degradedSelection && { unreachablePreferred }
    }
  });
  if (provisional)
    return enabled;
  const enabledNames = enabled.map((f) => f.name);
  if (detectionCache.get(normalizedCwd) === cached) {
    cached.entries.set(cacheKey, enabledNames);
  }
  return enabled;
}
function clearFormatterCache() {
  formatterCacheGeneration.bump();
  formatterSignatureFlights.clear();
  detectionCache.clear();
  resetWhichLatches();
}
var formatterConfigBasenames = new Set(FORMATTER_CONFIG_FILES.map((fileName) => fileName.toLowerCase()));
function invalidateFormatterCacheForPath(filePath) {
  const basename2 = filePath.includes("\\") ? path4.win32.basename(filePath) : path4.basename(filePath);
  if (!formatterConfigBasenames.has(basename2.toLowerCase()))
    return;
  clearFormatterCache();
}
function _getFormatterResetStateForTests() {
  return {
    whichLatchByCommand,
    whichTransientCommands,
    cooldownRecordedForRetryAtMs,
    detectionCache,
    formatterSignatureFlights
  };
}
function clearFormatterRuntimeState() {
  clearFormatterCache();
}
var BOX_DRAWING_GLOBAL = /[\u2500-\u257F]/g;
var DECORATION_RULE = /^[\u2500-\u257F\s]*$/;
var DECORATION_HEADING = /^\S+[ \t]+[\u2500-\u257F][\u2500-\u257F\s]*$/;
function firstDiagnosticLine(text) {
  for (const raw of (text ?? "").split("\n")) {
    const line = stripAnsi(raw).trimEnd();
    if (isDecorativeLine(line))
      continue;
    return line.replace(BOX_DRAWING_GLOBAL, "").trim().slice(0, 300);
  }
  return void 0;
}
function isDecorativeLine(line) {
  return DECORATION_RULE.test(line) || DECORATION_HEADING.test(line);
}
var FORMATTER_ERROR_TAIL_LINES = 20;
function diagnosticTail(text, maxLines = FORMATTER_ERROR_TAIL_LINES) {
  const lines = [];
  for (const raw of (text ?? "").split("\n")) {
    const line = stripAnsi(raw).trimEnd();
    if (isDecorativeLine(line))
      continue;
    lines.push(line.slice(0, 300));
  }
  if (lines.length === 0)
    return void 0;
  return lines.slice(-maxLines).join("\n");
}
async function resolveNpxFallback(formatterName, fallback) {
  const toolId = getAutoInstallToolIdForFormatter(formatterName);
  if (!toolId)
    return fallback;
  const { ensureTool } = await import("./probes/installer.js");
  const installed = await ensureTool(toolId);
  if (!installed)
    return fallback;
  return [installed, ...fallback.slice(2)];
}
async function resolveFormatterCommand(formatter, absolutePath, cwd) {
  const agreement = establishToolAgreement(formatter.name, cwd);
  if (agreement.decision === "decline") {
    recordDegradationOnce({
      kind: "formatter-agreement-unavailable",
      subject: agreement.subject,
      reason: agreement.reason
    });
    return FORMATTER_AGREEMENT_UNAVAILABLE;
  }
  const resolved = formatter.resolveCommand ? await formatter.resolveCommand(absolutePath, cwd) : null;
  if (resolved === SKIP_FORMATTING)
    return SKIP_FORMATTING;
  if (resolved === FORMATTER_UNAVAILABLE)
    return FORMATTER_UNAVAILABLE;
  if (resolved !== null)
    return resolved;
  const fallback = formatter.command.map((c) => c.replace("$FILE", absolutePath));
  if (fallback[0] === "npx") {
    if (!assertInstallAllowed(`formatter npx fallback: ${formatter.name}`)) {
      return SKIP_FORMATTING;
    }
    return resolveNpxFallback(formatter.name, fallback);
  }
  return fallback;
}
async function formatFile(filePath, formatter, enter) {
  try {
    const absolutePath = path4.resolve(filePath);
    const cwd = path4.dirname(absolutePath);
    const formatterCwd = resolveToolCwd("formatter", formatter.name, absolutePath, { cwd: path4.parse(absolutePath).root }).cwd;
    const cmd = await resolveFormatterCommand(formatter, absolutePath, cwd);
    if (cmd === SKIP_FORMATTING) {
      return { success: true, changed: false, outcome: "skipped" };
    }
    if (cmd === FORMATTER_UNAVAILABLE) {
      return {
        success: true,
        changed: false,
        outcome: "unavailable",
        error: `${formatter.name}: formatter executable not found`
      };
    }
    if (cmd === FORMATTER_AGREEMENT_UNAVAILABLE) {
      return {
        success: true,
        changed: false,
        outcome: "unavailable",
        error: `${formatter.name}: project tool agreement could not be established`
      };
    }
    await enter?.();
    const contentBefore = await fs2.readFile(absolutePath, "utf-8");
    const result = await safeSpawnAsync(cmd[0], cmd.slice(1), {
      timeout: 15e3,
      cwd: formatterCwd,
      ...cmd[0] === "npx" || cmd[0] === "bunx" ? getIsolatedNpxSpawnOptions() : {}
    });
    if (result.spawnFailure?.kind === "tool-not-found") {
      return {
        success: true,
        changed: false,
        outcome: "unavailable",
        error: result.spawnFailure.message
      };
    }
    const lenientOk = formatter.lenientExitCode !== void 0 && result.status !== null && (formatter.lenientStatuses ?? []).includes(result.status);
    if (result.error || result.status !== 0 && !lenientOk) {
      return {
        success: false,
        changed: false,
        outcome: "failed",
        error: result.error?.message || diagnosticTail(result.stderr) || // biome, ktlint and `mix format` report on STDOUT; without this
        // their diagnostic is discarded and the user is told only that
        // the tool "exited with status 1".
        diagnosticTail(result.stdout) || `${formatter.name} exited with status ${result.status}`
      };
    }
    const contentAfter = await fs2.readFile(absolutePath, "utf-8");
    const changed = contentBefore !== contentAfter;
    return {
      success: true,
      changed,
      outcome: changed ? "formatted" : "unchanged"
    };
  } catch (err) {
    return {
      success: false,
      changed: false,
      outcome: "failed",
      error: err instanceof Error ? err.message : String(err)
    };
  }
}
function listAllFormatters() {
  return ALL_FORMATTERS.map((f) => f.name);
}

export {
  tryLazyInstallFormatterTool,
  SKIP_FORMATTING,
  FORMATTER_UNAVAILABLE,
  FORMATTER_AGREEMENT_UNAVAILABLE,
  _findUpForTests,
  FORMATTERS_WITH_EXPLICIT_CONFIG_CHECK,
  resolveFormatterCwd,
  biomeFormatter,
  prettierFormatter,
  oxfmtFormatter,
  ruffFormatter,
  blackFormatter,
  sqlfluffFormatter,
  gofmtFormatter,
  rustfmtFormatter,
  zigFormatter,
  dartFormatter,
  shfmtFormatter,
  nixfmtFormatter,
  mixFormatter,
  ocamlformatFormatter,
  clangFormatFormatter,
  ktlintFormatter,
  ktfmtFormatter,
  rubocopFormatter,
  standardrbFormatter,
  gleamFormatter,
  typstyleFormatter,
  terraformFormatter,
  terragruntHclFormatter,
  phpCsFixerFormatter,
  csharpierFormatter,
  fantomasFormatter,
  swiftformatFormatter,
  styluaFormatter,
  ormoluFormatter,
  taploFormatter,
  googleJavaFormatFormatter,
  cljfmtFormatter,
  cmakeFormatFormatter,
  cueFormatter,
  psscriptanalyzerFormatFormatter,
  ALL_FORMATTERS,
  getFormattersForFile,
  clearFormatterCache,
  invalidateFormatterCacheForPath,
  _getFormatterResetStateForTests,
  clearFormatterRuntimeState,
  firstDiagnosticLine,
  diagnosticTail,
  formatFile,
  listAllFormatters
};
