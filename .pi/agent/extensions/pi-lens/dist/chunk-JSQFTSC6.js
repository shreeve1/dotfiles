import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  collectSourceFiles
} from "./chunk-6C7JWPCP.js";
import "./chunk-5NGR67U5.js";
import "./chunk-C34ZXZ7O.js";
import "./chunk-QYF5S6P6.js";
import "./chunk-PHDMFAKM.js";
import "./chunk-2BBLFX75.js";
import "./chunk-XVF2VVXP.js";
import "./chunk-2EECBNC5.js";
import "./chunk-JAU72XNY.js";
import "./chunk-XTMJ7XDT.js";
import "./chunk-JMYYOTQG.js";
import "./chunk-QQNQ7SJW.js";
import "./chunk-AOHZU2BM.js";
import "./chunk-LJDODBBZ.js";
import "./chunk-ABBOA7UD.js";
import "./chunk-N2H3ZPZY.js";
import "./chunk-NXL4FFQQ.js";

// dist/clients/todo-scanner.js
import * as fs from "node:fs";
import * as path from "node:path";
var MAX_SCAN_FILE_BYTES = 512 * 1024;
var MARKDOWN_FILE_RE = /\.(?:md|mdx|markdown)$/i;
var TodoScanner = class {
  /**
   * Pattern matches actionable annotations only.
   * Excludes NOTE and DEPRECATED — these are documentation, not work items.
   * Case-sensitive to avoid matching "Note:" in prose.
   */
  pattern = /\b(TODO|FIXME|HACK|XXX|BUG)\b\s*[(:]?\s*(.+)/g;
  /**
   * Check if a match position is inside a comment context.
   * Handles: // line comments, star-slash block comments, * JSDoc lines, # Python comments
   */
  isInComment(line, matchIndex, markdown = false) {
    if (markdown) {
      const beforeMatch2 = line.slice(0, matchIndex);
      const open = beforeMatch2.lastIndexOf("<!--");
      return open !== -1 && beforeMatch2.lastIndexOf("-->") < open;
    }
    const trimmed = line.trimStart();
    if (/^\/\/|^\/\*|^\*|^#/.test(trimmed))
      return true;
    const beforeMatch = line.slice(0, matchIndex);
    const lineCommentPos = beforeMatch.lastIndexOf("//");
    if (lineCommentPos !== -1) {
      const beforeComment = beforeMatch.slice(0, lineCommentPos);
      const singleQuotes = (beforeComment.match(/'/g) || []).length;
      const doubleQuotes = (beforeComment.match(/"/g) || []).length;
      const backticks = (beforeComment.match(/`/g) || []).length;
      if (singleQuotes % 2 === 0 && doubleQuotes % 2 === 0 && backticks % 2 === 0) {
        return true;
      }
    }
    const blockOpen = beforeMatch.lastIndexOf("/*");
    const blockClose = beforeMatch.lastIndexOf("*/");
    if (blockOpen !== -1 && blockClose < blockOpen)
      return true;
    const hashPos = beforeMatch.lastIndexOf("#");
    if (hashPos !== -1) {
      const beforeHash = beforeMatch.slice(0, hashPos);
      const singleQuotes = (beforeHash.match(/'/g) || []).length;
      const doubleQuotes = (beforeHash.match(/"/g) || []).length;
      if (singleQuotes % 2 === 0 && doubleQuotes % 2 === 0) {
        return true;
      }
    }
    return false;
  }
  /**
   * Scan a single file for TODOs.
   */
  scanFile(filePath) {
    const absolutePath = path.resolve(filePath);
    try {
      const stat = fs.statSync(absolutePath);
      if (!stat.isFile() || stat.size > MAX_SCAN_FILE_BYTES)
        return [];
    } catch {
      return [];
    }
    let content;
    try {
      content = fs.readFileSync(absolutePath, "utf-8");
    } catch {
      return [];
    }
    const markdown = MARKDOWN_FILE_RE.test(absolutePath);
    const lines = content.split("\n");
    const items = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const matches = line.matchAll(this.pattern);
      for (const match of matches) {
        if (!this.isInComment(line, match.index ?? 0, markdown))
          continue;
        const type = match[1];
        const message = (match[2] || "").trim().replace(/\s*\*\/\s*$/, "");
        items.push({
          type,
          message: message.slice(0, 200),
          // Limit message length
          file: path.relative(process.cwd(), absolutePath),
          line: i + 1,
          column: match.index || 0
        });
      }
    }
    return items;
  }
  /**
   * Scan a list of pre-filtered files (recommended — uses source-filter module).
   * Callers should use collectSourceFiles() to get deduplicated source files.
   */
  scanFiles(filePaths) {
    const items = [];
    for (const filePath of filePaths) {
      if (filePath.endsWith("todo-scanner.ts") || filePath.endsWith("todo-scanner.js"))
        continue;
      if (/\.(test|spec)\.[jt]sx?$/.test(filePath))
        continue;
      items.push(...this.scanFile(filePath));
    }
    return this.groupResults(items);
  }
  /**
   * Scan a directory recursively using the source-filter module to exclude build artifacts.
   * This is the preferred entry point for new callers.
   */
  scanDirectory(dirPath) {
    const sourceFiles = collectSourceFiles(dirPath);
    return this.scanFiles(sourceFiles);
  }
  /**
   * Group scan results by type and file.
   */
  groupResults(items) {
    const byType = /* @__PURE__ */ new Map();
    for (const item of items) {
      const existing = byType.get(item.type) || [];
      existing.push(item);
      byType.set(item.type, existing);
    }
    const byFile = /* @__PURE__ */ new Map();
    for (const item of items) {
      const existing = byFile.get(item.file) || [];
      existing.push(item);
      byFile.set(item.file, existing);
    }
    return { items, byType, byFile };
  }
  /**
   * Format scan results for LLM consumption.
   */
  formatResult(result, maxItems = 30) {
    if (result.items.length === 0)
      return "";
    let output = `[TODOs] ${result.items.length} annotation(s) found`;
    const typeCounts = [];
    for (const [type, items] of result.byType) {
      typeCounts.push(`${items.length} ${type}`);
    }
    if (typeCounts.length > 0) {
      output += ` (${typeCounts.join(", ")})`;
    }
    output += ":\n";
    const priorityOrder = [
      "FIXME",
      "HACK",
      "BUG",
      "TODO",
      "XXX"
    ];
    const sorted = [...result.items].sort((a, b) => {
      const aIdx = priorityOrder.indexOf(a.type);
      const bIdx = priorityOrder.indexOf(b.type);
      return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
    });
    for (const item of sorted.slice(0, maxItems)) {
      const icon = this.getIcon(item.type);
      output += `  ${icon} ${item.file}:${item.line} \u2014 ${item.type}: ${item.message}
`;
    }
    if (result.items.length > maxItems) {
      output += `  ... and ${result.items.length - maxItems} more
`;
    }
    return output;
  }
  getIcon(type) {
    switch (type) {
      case "FIXME":
        return "\u{1F534}";
      case "HACK":
        return "\u{1F7E0}";
      case "BUG":
        return "\u{1F41B}";
      case "TODO":
        return "\u{1F4DD}";
      case "XXX":
        return "\u274C";
      default:
        return "\u2022";
    }
  }
};
export {
  TodoScanner
};
