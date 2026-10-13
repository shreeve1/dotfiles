import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  stagePathFor
} from "./chunk-LJDODBBZ.js";

// dist/clients/atomic-write.js
import * as fs from "node:fs";
function writeFileAtomic(targetPath, data, options) {
  const bestEffort = options?.bestEffort ?? true;
  const tmpPath = stagePathFor(targetPath);
  try {
    fs.writeFileSync(tmpPath, data, {
      encoding: typeof data === "string" ? "utf-8" : void 0,
      mode: options?.mode
    });
    fs.renameSync(tmpPath, targetPath);
  } catch (err) {
    try {
      fs.rmSync(tmpPath, { force: true });
    } catch {
    }
    if (!bestEffort)
      throw err;
  }
}
async function writeFileAtomicAsync(targetPath, data, options) {
  const bestEffort = options?.bestEffort ?? true;
  const tmpPath = stagePathFor(targetPath);
  try {
    await fs.promises.writeFile(tmpPath, data, {
      encoding: typeof data === "string" ? "utf-8" : void 0,
      mode: options?.mode
    });
    await fs.promises.rename(tmpPath, targetPath);
  } catch (err) {
    try {
      await fs.promises.rm(tmpPath, { force: true });
    } catch {
    }
    if (!bestEffort)
      throw err;
  }
}

// dist/clients/spawn-output-cap.js
var DEFAULT_MAX_OUTPUT_BYTES = 32 * 1024 * 1024;
function createBoundedOutputSink(maxBytes = DEFAULT_MAX_OUTPUT_BYTES) {
  let text = "";
  let retained = 0;
  let truncated = false;
  let observed = 0;
  return {
    append(chunk) {
      const part = typeof chunk === "string" ? chunk : chunk.toString();
      const bytes = Buffer.byteLength(part);
      observed += bytes;
      if (retained + bytes <= maxBytes) {
        retained += bytes;
        text += part;
        return;
      }
      truncated = true;
    },
    get text() {
      return text;
    },
    get truncated() {
      return truncated;
    },
    get observedBytes() {
      return observed;
    }
  };
}
function truncatedByOutputCap(result) {
  return result.outputTruncated === true && result.failure !== "timeout" && result.failure !== "aborted";
}
function killedForOutputCap(result) {
  return result.killedForOutputCap === true && result.failure !== "timeout" && result.failure !== "aborted";
}

export {
  writeFileAtomic,
  writeFileAtomicAsync,
  DEFAULT_MAX_OUTPUT_BYTES,
  createBoundedOutputSink,
  truncatedByOutputCap,
  killedForOutputCap
};
