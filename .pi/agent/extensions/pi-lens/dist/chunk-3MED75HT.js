import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);

// dist/clients/review-graph/symbol-id.js
function buildSymbolId(filePath, name, kind, startLine) {
  return `${filePath}:${name}:${kind}:${startLine}`;
}
var KIND_TOKEN_RE = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
function parseSymbolKey(key, knownFilePath) {
  if (key.startsWith("file:")) {
    return { filePath: key.slice("file:".length) };
  }
  const canonical = /^(.*):([^:]*):([^:]+):(\d+)$/.exec(key);
  if (canonical && KIND_TOKEN_RE.test(canonical[3])) {
    return {
      filePath: canonical[1],
      symbolName: canonical[2] || void 0,
      kind: canonical[3],
      line: Number(canonical[4])
    };
  }
  if (knownFilePath && key.startsWith(`${knownFilePath}:`)) {
    return {
      filePath: knownFilePath,
      symbolName: key.slice(knownFilePath.length + 1) || void 0
    };
  }
  const separator = key.lastIndexOf(":");
  return separator < 0 ? { filePath: key } : {
    filePath: key.slice(0, separator),
    symbolName: key.slice(separator + 1) || void 0
  };
}

export {
  buildSymbolId,
  parseSymbolKey
};
