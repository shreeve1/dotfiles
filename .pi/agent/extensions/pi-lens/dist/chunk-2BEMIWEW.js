import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);

// dist/clients/project-snapshot-fingerprint.js
import { createHash } from "node:crypto";
var QUOTE = 34;
var BACKSLASH = 92;
var OPEN_BRACE = 123;
var CLOSE_BRACE = 125;
function fingerprintProjectSnapshotJson(json, generatedAt) {
  const bytes = typeof json === "string" ? Buffer.from(json) : Buffer.from(json.buffer, json.byteOffset, json.byteLength);
  const marker = Buffer.from(`"generatedAt":${JSON.stringify(generatedAt)}`);
  let markerIndex = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = 0; index < bytes.length; index++) {
    const byte = bytes[index];
    if (inString) {
      if (escaped)
        escaped = false;
      else if (byte === BACKSLASH)
        escaped = true;
      else if (byte === QUOTE)
        inString = false;
      continue;
    }
    if (byte === QUOTE) {
      if (depth === 1 && index + marker.length <= bytes.length && bytes.compare(marker, 0, marker.length, index, index + marker.length) === 0) {
        markerIndex = index;
        break;
      }
      inString = true;
    } else if (byte === OPEN_BRACE)
      depth++;
    else if (byte === CLOSE_BRACE)
      depth--;
  }
  const hash = createHash("sha256");
  if (markerIndex < 0) {
    hash.update(bytes);
  } else {
    hash.update(bytes.subarray(0, markerIndex));
    hash.update('"generatedAt":""');
    hash.update(bytes.subarray(markerIndex + marker.length));
  }
  return hash.digest("hex");
}

export {
  fingerprintProjectSnapshotJson
};
