import { serveGzipStageWorker, } from "./gzip-stage-write.js";
serveGzipStageWorker((request) => ({
    id: request.id,
    generation: request.generation,
    stagePath: request.stagePath,
}));
