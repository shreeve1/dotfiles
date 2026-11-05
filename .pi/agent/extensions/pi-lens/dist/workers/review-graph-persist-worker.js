import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  serveGzipStageWorker
} from "../chunk-IJYGIDF4.js";
import "../chunk-LJDODBBZ.js";
import "../chunk-NXL4FFQQ.js";

// dist/clients/review-graph/persist-worker.js
serveGzipStageWorker((request) => ({
  id: request.id,
  cwd: request.cwd,
  generation: request.generation,
  stagePath: request.stagePath,
  elements: request.elements
}));
