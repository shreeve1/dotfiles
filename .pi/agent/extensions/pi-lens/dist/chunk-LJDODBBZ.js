import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);

// dist/clients/atomic-write-staging.js
import * as fs from "node:fs";
import * as path from "node:path";
import { threadId } from "node:worker_threads";
var stageSeq = 0;
var STAGE_TMP_PATTERN = /\.tmp-(0|[1-9]\d*)-(0|[1-9]\d*)-(0|[1-9]\d*)$/;
var STAGE_TMP_PID_PATTERN = /\.tmp-(0|[1-9]\d*)-(?:0|[1-9]\d*)-(?:0|[1-9]\d*)$/;
function stagePathFor(targetPath) {
  return `${targetPath}.tmp-${process.pid}-${threadId}-${stageSeq++}`;
}
function stageOwnerPidFromName(name) {
  if (!STAGE_TMP_PATTERN.test(name))
    return void 0;
  const match = STAGE_TMP_PID_PATTERN.exec(name);
  if (!match)
    return void 0;
  const pid = Number(match[1]);
  return Number.isSafeInteger(pid) && pid > 0 ? pid : void 0;
}
async function sweepOwnStagingFiles(directories, options) {
  const uniqueDirectories = [...new Set(directories)].filter(Boolean);
  const result = {
    directories: uniqueDirectories.length,
    scanned: 0,
    removed: 0,
    liveSkipped: 0,
    truncated: false
  };
  for (const directory of uniqueDirectories) {
    let handle;
    try {
      handle = await fs.promises.opendir(directory);
    } catch {
      continue;
    }
    try {
      let reachedEntryCap = true;
      for (let i = 0; i < options.maxEntries; i++) {
        const entry = await handle.read();
        if (entry === null) {
          reachedEntryCap = false;
          break;
        }
        result.scanned++;
        if (!entry.isFile())
          continue;
        const pid = stageOwnerPidFromName(entry.name);
        if (pid === void 0)
          continue;
        if (pid === process.pid || options.isPidAlive(pid)) {
          result.liveSkipped++;
          continue;
        }
        try {
          await fs.promises.rm(path.join(directory, entry.name), {
            force: true
          });
          result.removed++;
        } catch {
        }
      }
      result.truncated ||= reachedEntryCap;
    } catch {
    } finally {
      await handle.close().catch(() => {
      });
    }
  }
  return result;
}

export {
  STAGE_TMP_PATTERN,
  stagePathFor,
  sweepOwnStagingFiles
};
