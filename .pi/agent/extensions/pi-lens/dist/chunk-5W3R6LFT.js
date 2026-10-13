import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);

// dist/clients/symbol-containment.js
function findOwnerName(candidates, targetStart, targetEnd) {
  let best;
  for (const candidate of candidates) {
    const span = candidate.endLine - candidate.startLine;
    const targetSpan = targetEnd - targetStart;
    const contains = candidate.startLine <= targetStart && candidate.endLine >= targetEnd && span > targetSpan;
    if (!contains)
      continue;
    if (!best || span < best.endLine - best.startLine)
      best = candidate;
  }
  return best?.name;
}
function buildQualifiedName(ownerName, symbolName) {
  return ownerName ? `${ownerName}.${symbolName}` : void 0;
}

export {
  findOwnerName,
  buildQualifiedName
};
