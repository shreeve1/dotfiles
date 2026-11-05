import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  normalizeHostToolPath,
  normalizeMapKey,
  relativeInside,
  toPosix,
  walkUpDirs
} from "./chunk-GMROJJRN.js";

// dist/clients/content-stamp.js
import { createHash } from "node:crypto";
import * as fs from "node:fs";
var CONTENT_HASH_MAX_BYTES = 4 * 1024 * 1024;
function hashContentBytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}
function hashFileBytes(filePath) {
  return hashContentBytes(fs.readFileSync(filePath));
}
function stampContentBytes(bytes, mtimeMs) {
  return {
    size: bytes.byteLength,
    mtimeMs,
    ...bytes.byteLength <= CONTENT_HASH_MAX_BYTES ? { sha256: hashContentBytes(bytes) } : {}
  };
}

// dist/clients/dispatch/runner-context.js
import * as fs2 from "node:fs";
import * as path from "node:path";
function resolveAgainstAncestors(cwd, filePath) {
  filePath = normalizeHostToolPath(filePath);
  if (path.isAbsolute(filePath)) {
    return filePath;
  }
  const normalizedRelative = toPosix(filePath);
  const cwdBaseName = toPosix(path.basename(path.resolve(cwd)));
  if (cwdBaseName && (normalizedRelative === cwdBaseName || normalizedRelative.startsWith(`${cwdBaseName}/`))) {
    const trimmedRelative = normalizedRelative === cwdBaseName ? "" : normalizedRelative.slice(cwdBaseName.length + 1);
    const trimmedCandidate = trimmedRelative ? path.resolve(cwd, trimmedRelative) : path.resolve(cwd);
    if (fs2.existsSync(trimmedCandidate)) {
      return trimmedCandidate;
    }
  }
  const directCandidate = path.resolve(cwd, filePath);
  if (fs2.existsSync(directCandidate)) {
    return directCandidate;
  }
  for (const dir of walkUpDirs(cwd)) {
    const candidate = path.resolve(dir, filePath);
    if (fs2.existsSync(candidate)) {
      return candidate;
    }
  }
  return directCandidate;
}
function resolveRunnerPath(cwd, filePath) {
  return normalizeMapKey(resolveAgainstAncestors(cwd, filePath));
}
function toRunnerDisplayPath(cwd, filePath) {
  const cwdKey = normalizeMapKey(path.resolve(cwd));
  const fileKey = resolveRunnerPath(cwd, filePath);
  return relativeInside(cwdKey, fileKey) || fileKey;
}

export {
  CONTENT_HASH_MAX_BYTES,
  hashContentBytes,
  hashFileBytes,
  stampContentBytes,
  resolveRunnerPath,
  toRunnerDisplayPath
};
