import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  fingerprintProjectSnapshotJson
} from "../chunk-2BEMIWEW.js";
import {
  serveGzipStageWorker
} from "../chunk-IJYGIDF4.js";
import "../chunk-LJDODBBZ.js";
import "../chunk-NXL4FFQQ.js";

// dist/clients/project-snapshot-persist-worker.js
import { parentPort } from "node:worker_threads";
function semanticSnapshotFingerprint(request, body) {
  return fingerprintProjectSnapshotJson(body, request.generatedAt);
}
function serveForcedFailure() {
  parentPort?.on("message", (message) => {
    try {
      if (typeof message !== "object" || message === null || !("id" in message) || !("generation" in message))
        return;
      parentPort?.postMessage({
        id: message.id,
        generation: message.generation,
        error: "forced snapshot worker failure (PI_LENS_TEST_SNAPSHOT_WORKER_FAIL)"
      });
    } catch {
    }
  });
}
if (process.env.PI_LENS_TEST_SNAPSHOT_WORKER_FAIL === "no-stage-path") {
  serveForcedFailure();
} else {
  serveGzipStageWorker((request) => ({
    id: request.id,
    generation: request.generation,
    stagePath: request.stagePath
  }), {
    semanticFingerprint: semanticSnapshotFingerprint,
    skipIfFingerprints: (request) => request.priorFingerprints
  });
}
