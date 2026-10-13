import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  stagePathFor
} from "./chunk-LJDODBBZ.js";

// dist/clients/gzip-stage-write.js
import * as fs from "node:fs";
import * as path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { parentPort } from "node:worker_threads";
import { createGzip } from "node:zlib";
async function writeGzipStageFile(data, stagePath, testDelayMs, options) {
  const startedAt = performance.now();
  const tmpPath = stagePathFor(stagePath);
  try {
    if (testDelayMs) {
      await new Promise((resolve) => setTimeout(resolve, testDelayMs));
    }
    const serializeStarted = performance.now();
    const body = data instanceof Uint8Array ? data : JSON.stringify(data);
    const serializeMs = performance.now() - serializeStarted;
    const rawBytes = Buffer.byteLength(body);
    const semanticFingerprint = options?.semanticFingerprint?.(body);
    if (semanticFingerprint !== void 0 && options?.skipIfFingerprints?.includes(semanticFingerprint)) {
      return {
        rawBytes,
        gzBytes: 0,
        serializeMs,
        writeMs: 0,
        durationMs: performance.now() - startedAt,
        semanticFingerprint,
        skippedUnchanged: true
      };
    }
    const writeStarted = performance.now();
    await fs.promises.mkdir(path.dirname(stagePath), { recursive: true });
    const chunks = function* () {
      const chunkSize = 256 * 1024;
      let offset = 0;
      while (offset < body.length) {
        let end = Math.min(offset + chunkSize, body.length);
        if (typeof body === "string" && end < body.length) {
          const last = body.charCodeAt(end - 1);
          if (last >= 55296 && last <= 56319)
            end--;
        }
        yield typeof body === "string" ? body.slice(offset, end) : body.subarray(offset, end);
        offset = end;
      }
    };
    await pipeline(Readable.from(chunks()), createGzip(), fs.createWriteStream(tmpPath));
    await fs.promises.rename(tmpPath, stagePath);
    const writeMs = performance.now() - writeStarted;
    const gzBytes = (await fs.promises.stat(stagePath)).size;
    return {
      rawBytes,
      gzBytes,
      serializeMs,
      writeMs,
      durationMs: performance.now() - startedAt,
      semanticFingerprint
    };
  } catch (err) {
    await fs.promises.rm(tmpPath, { force: true }).catch(() => {
    });
    throw err;
  }
}
function serveGzipStageWorker(buildBaseResult, options) {
  const port = parentPort;
  if (!port) {
    throw new Error("gzip stage persist worker requires a parent port");
  }
  port.on("message", (request) => {
    void (async () => {
      const result = {
        ...buildBaseResult(request)
      };
      try {
        const fingerprint = options?.semanticFingerprint;
        const metrics = await writeGzipStageFile(request.data, request.stagePath, request.testDelayMs, {
          semanticFingerprint: fingerprint ? (body) => fingerprint(request, body) : void 0,
          skipIfFingerprints: options?.skipIfFingerprints?.(request)
        });
        result.rawBytes = metrics.rawBytes;
        result.gzBytes = metrics.gzBytes;
        result.serializeMs = metrics.serializeMs;
        result.writeMs = metrics.writeMs;
        result.durationMs = metrics.durationMs;
        result.semanticFingerprint = metrics.semanticFingerprint;
        result.skippedUnchanged = metrics.skippedUnchanged;
      } catch (err) {
        result.error = err instanceof Error ? err.message : String(err);
      }
      port.postMessage(result);
    })();
  });
}

export {
  serveGzipStageWorker
};
