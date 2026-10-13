import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  getGlobalPiLensDir,
  safeSpawnAsync
} from "./chunk-C34ZXZ7O.js";
import {
  createSingleFlight
} from "./chunk-BW5KFIQC.js";

// dist/clients/tool-probe.js
import * as fs from "node:fs";
import { join } from "node:path";
function getIsolatedNpxSpawnOptions() {
  const cwd = join(getGlobalPiLensDir(), "tools");
  fs.mkdirSync(cwd, { recursive: true });
  return { cwd, stripNpmConfig: true };
}
async function probeToolAsync(command, args, options) {
  const { cwd: _strippedCwd, ...rest } = options ?? {};
  return safeSpawnAsync(command, [...args], { ...rest });
}

// dist/clients/availability-probe-flight.js
function createAvailabilityProbeFlight(options = {}) {
  const flights = createSingleFlight(options);
  return {
    run(key, probe) {
      const joined = flights.has(key);
      return { promise: flights.run(key, probe), joined };
    },
    clear: () => flights.clear()
  };
}

export {
  getIsolatedNpxSpawnOptions,
  probeToolAsync,
  createAvailabilityProbeFlight
};
