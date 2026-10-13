import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  createToolchainAvailability
} from "./chunk-7DYBLXYA.js";
import {
  createSubsystemLogger
} from "./chunk-XTMJ7XDT.js";

// dist/clients/go-client.js
import * as path from "node:path";
var GO_WINDOWS_PATHS = [
  "C:\\Program Files\\Go\\bin\\go.exe",
  "C:\\Go\\bin\\go.exe",
  "go.exe"
  // PATH
];
var PROBE_TIMEOUT_MS = 3e3;
var GO_UNIX_PATHS = [
  "/usr/local/go/bin/go",
  "/usr/bin/go",
  "go"
  // PATH
];
var GoClient = class {
  /**
   * Availability lifecycle, behind the shared transient-aware latch (#1476).
   * The PATH candidate is resolved by spawning `go version` with a 3 s budget,
   * so a host stall could latch "no Go toolchain" for the whole session and
   * silently disable every Go diagnostic until restart.
   */
  availability;
  log;
  constructor(verbose = false) {
    this.log = verbose ? createSubsystemLogger("go") : () => {
    };
    this.availability = createToolchainAvailability({
      tool: "go",
      label: "Go",
      windowsPaths: GO_WINDOWS_PATHS,
      unixPaths: GO_UNIX_PATHS,
      probeArgs: ["version"],
      budgetMs: PROBE_TIMEOUT_MS,
      log: (msg) => this.log(msg)
    });
  }
  /**
   * Find go executable path (async — probes PATH candidates off the event loop).
   */
  async findGoPathAsync() {
    return this.availability.findPath();
  }
  /**
   * Check if Go is installed (cached)
   */
  async isGoAvailableAsync() {
    return this.availability.isAvailable();
  }
  /**
   * Check if a file is a Go file
   */
  isGoFile(filePath) {
    return path.extname(filePath).toLowerCase() === ".go";
  }
  /** Forget the memoized go path and latched availability verdict — #2455. */
  resetAvailability() {
    this.availability.reset();
  }
};
var goClient = new GoClient();
function resetGoAvailability() {
  goClient.resetAvailability();
}

export {
  GoClient,
  goClient,
  resetGoAvailability
};
