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
function routingFields(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return `not a routable object (${value === null ? "null" : Array.isArray(value) ? "array" : typeof value})`;
  }
  const wire = value;
  const missing = [];
  const id = requiredNumber(wire, "id", missing);
  const generation = requiredNumber(wire, "generation", missing);
  if (missing.length > 0)
    return `no numeric ${missing.join(" and ")}`;
  return {
    id,
    generation,
    ...fieldEntry(wire, "stagePath", "string", [])
  };
}
function requiredNumber(wire, key, missing) {
  const field = wire[key];
  if (typeof field === "number")
    return field;
  missing.push(key);
  return Number.NaN;
}
function fieldEntry(wire, key, type, malformed) {
  const field = wire[key];
  if (typeof field === type) {
    return { [key]: field };
  }
  if (field !== void 0)
    malformed.push(key);
  return {};
}
function readGzipStageWorkerResult(value) {
  const routing = routingFields(value);
  if (typeof routing === "string")
    return routing;
  const wire = value;
  const malformed = [];
  const result = {
    ...routing,
    ...fieldEntry(wire, "rawBytes", "number", malformed),
    ...fieldEntry(wire, "gzBytes", "number", malformed),
    ...fieldEntry(wire, "serializeMs", "number", malformed),
    ...fieldEntry(wire, "writeMs", "number", malformed),
    ...fieldEntry(wire, "durationMs", "number", malformed),
    ...fieldEntry(wire, "semanticFingerprint", "string", malformed),
    ...fieldEntry(wire, "skippedUnchanged", "boolean", malformed),
    ...fieldEntry(wire, "error", "string", malformed)
  };
  if (malformed.length === 0)
    return result;
  return {
    ...routing,
    error: `malformed worker result: ${malformed.join(", ")}`
  };
}
function isGzipStageWorkerRequest(value) {
  const routing = routingFields(value);
  return typeof routing !== "string" && routing.stagePath !== void 0;
}
function reapStageFile(stagePath) {
  try {
    fs.rmSync(stagePath, { force: true });
    return void 0;
  } catch (err) {
    return err instanceof Error ? err : new Error(String(err));
  }
}
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
  port.on("message", (message) => {
    void (async () => {
      try {
        if (!isGzipStageWorkerRequest(message)) {
          const routing = routingFields(message);
          throw new Error(`malformed persist request: ${typeof routing === "string" ? routing : "no stage path"}`);
        }
        const request = message;
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
      } catch (err) {
        const routing = routingFields(message);
        port.postMessage({
          ...typeof routing === "string" ? {} : routing,
          error: err instanceof Error ? err.message : String(err)
        });
      }
    })();
  });
}

export {
  readGzipStageWorkerResult,
  reapStageFile,
  serveGzipStageWorker
};
