import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  fingerprintProjectSnapshotJson
} from "../chunk-2BEMIWEW.js";
import {
  serveGzipStageWorker
} from "../chunk-UOPVJQ4N.js";
import "../chunk-LJDODBBZ.js";
import "../chunk-NXL4FFQQ.js";

// dist/clients/project-snapshot-persist-worker.js
function semanticSnapshotFingerprint(request, body) {
  return fingerprintProjectSnapshotJson(body, request.generatedAt);
}
serveGzipStageWorker((request) => ({
  id: request.id,
  generation: request.generation,
  stagePath: request.stagePath
}), {
  semanticFingerprint: semanticSnapshotFingerprint,
  skipIfFingerprints: (request) => request.priorFingerprints
});
