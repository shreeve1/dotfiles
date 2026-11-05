import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  logExtension
} from "./chunk-WQV6BI4Q.js";
import {
  findNearestMarkerRoot,
  realpathOrResolve,
  walkUpDirs
} from "./chunk-GMROJJRN.js";

// dist/clients/cargo-manifest.js
import { readFile } from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
async function readTextFileOrUndefined(filePath) {
  try {
    return await readFile(filePath, "utf-8");
  } catch {
    return void 0;
  }
}
function stripTomlLineComment(line) {
  let quote = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quote) {
      if (ch === quote)
        quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === "#")
      return line.slice(0, i);
  }
  return line;
}
function normalizeToml(content) {
  return content.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").split("\n").map(stripTomlLineComment).join("\n");
}
function extractTomlTableSection(content, tableName) {
  const normalized = normalizeToml(content);
  const heading = new RegExp(`^[ \\t]*\\[${tableName}\\][ \\t]*(?:#.*)?$`, "m");
  const match = heading.exec(normalized);
  if (!match)
    return void 0;
  const rest = normalized.slice(match.index + match[0].length);
  const nextHeading = rest.match(/^[ \t]*\[{1,2}[^\]]+\]{1,2}[ \t]*(?:#.*)?$/m);
  return nextHeading?.index !== void 0 ? rest.slice(0, nextHeading.index) : rest;
}
function parseTomlStringArray(content, key) {
  if (content === void 0)
    return [];
  const normalized = normalizeToml(content);
  const open = normalized.match(new RegExp(`^[ \\t]*${key}[ \\t]*=[ \\t]*\\[`, "m"));
  if (open?.index === void 0)
    return [];
  const from = open.index + open[0].length;
  const to = indexOfArrayEnd(normalized, from);
  if (to < 0)
    return [];
  return [...normalized.slice(from, to).matchAll(/"([^"]*)"|'([^']*)'/g)].map((m) => (m[1] ?? m[2] ?? "").trim());
}
function indexOfArrayEnd(text, from) {
  let quote = null;
  for (let i = from; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      if (ch === "\\" && quote === '"')
        i++;
      else if (ch === quote)
        quote = null;
    } else if (ch === '"' || ch === "'")
      quote = ch;
    else if (ch === "]")
      return i;
  }
  return -1;
}
function parseTomlScalarString(content, key) {
  if (content === void 0)
    return void 0;
  const match = content.match(new RegExp(`^[ \\t]*${key}[ \\t]*=[ \\t]*(?:"""(?:\\r?\\n)?([\\s\\S]*?)"""|'''(?:\\r?\\n)?([\\s\\S]*?)'''|"([^"]*)"|'([^']*)')`, "m"));
  if (!match)
    return void 0;
  return match[1] ?? match[2] ?? match[3] ?? match[4];
}
function hasCargoWorkspaceTable(content) {
  return hasTomlTable(content, "workspace");
}
function hasTomlTable(content, tableName) {
  return extractTomlTableSection(content, tableName) !== void 0;
}
function readCargoPackageName(content) {
  const packageSection = extractTomlTableSection(content, "package");
  return parseTomlScalarString(packageSection, "name");
}
function readCargoWorkspaceMembers(content) {
  return parseTomlStringArray(extractTomlTableSection(content, "workspace"), "members");
}
function readCargoWorkspaceExclude(content) {
  return parseTomlStringArray(extractTomlTableSection(content, "workspace"), "exclude");
}
function readCargoDependencyNames(content) {
  const section = extractTomlTableSection(content, "dependencies");
  if (section === void 0)
    return [];
  const names = [];
  for (const rawLine of section.split(/\r?\n/)) {
    const line = rawLine.trim();
    const match = line.match(/^([A-Za-z0-9_-]+)\s*=/);
    if (match)
      names.push(match[1]);
  }
  return names;
}
function isTomlKeyWorkspaceInherited(content, key) {
  if (content === void 0)
    return false;
  const dotted = new RegExp(`^[ \\t]*${key}\\.workspace[ \\t]*=[ \\t]*true`, "m");
  const inline = new RegExp(`^[ \\t]*${key}[ \\t]*=[ \\t]*\\{[^}\\n]*\\bworkspace[ \\t]*=[ \\t]*true`, "m");
  return dotted.test(content) || inline.test(content);
}
var SUPPORTED_RUSTFMT_EDITIONS = /* @__PURE__ */ new Set(["2015", "2018", "2021", "2024"]);
function validatedEdition(value, filePath) {
  if (value === void 0)
    return void 0;
  if (SUPPORTED_RUSTFMT_EDITIONS.has(value))
    return value;
  logExtension({
    subsystem: "format",
    message: "resolveCargoPackageEdition: manifest edition is not a rustfmt-supported value; falling back to the static rustfmt command",
    level: "debug",
    metadata: { rejectedEdition: value, filePath }
  });
  return void 0;
}
function readWorkspacePackageEdition(content) {
  const workspaceSection = extractTomlTableSection(content, "workspace.package");
  return parseTomlScalarString(workspaceSection, "edition");
}
async function resolveCargoPackageEdition(filePath, homeDir = os.homedir()) {
  const startDir = path.dirname(realpathOrResolve(filePath));
  const packageDir = findNearestMarkerRoot(startDir, ["Cargo.toml"], {
    homeDir
  });
  if (!packageDir)
    return void 0;
  const packageContent = await readTextFileOrUndefined(path.join(packageDir, "Cargo.toml"));
  if (packageContent === void 0)
    return void 0;
  const packageSection = extractTomlTableSection(packageContent, "package");
  const direct = parseTomlScalarString(packageSection, "edition");
  if (direct !== void 0)
    return validatedEdition(direct, filePath);
  if (!isTomlKeyWorkspaceInherited(packageSection, "edition"))
    return void 0;
  if (hasCargoWorkspaceTable(packageContent)) {
    return validatedEdition(readWorkspacePackageEdition(packageContent), filePath);
  }
  for (const current of walkUpDirs(path.dirname(packageDir), {
    homeDir,
    maxDepth: 64
  })) {
    const ancestorContent = await readTextFileOrUndefined(path.join(current, "Cargo.toml"));
    if (ancestorContent !== void 0 && hasCargoWorkspaceTable(ancestorContent)) {
      return validatedEdition(readWorkspacePackageEdition(ancestorContent), filePath);
    }
  }
  return void 0;
}

export {
  readTextFileOrUndefined,
  extractTomlTableSection,
  parseTomlStringArray,
  parseTomlScalarString,
  hasCargoWorkspaceTable,
  hasTomlTable,
  readCargoPackageName,
  readCargoWorkspaceMembers,
  readCargoWorkspaceExclude,
  readCargoDependencyNames,
  resolveCargoPackageEdition
};
