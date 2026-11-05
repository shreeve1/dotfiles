import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  createToolchainAvailability
} from "./chunk-BUZIQDFS.js";
import {
  createSubsystemLogger
} from "./chunk-WQV6BI4Q.js";

// dist/clients/rust-client.js
import * as path from "node:path";
var PROBE_TIMEOUT_MS = 3e3;
var RustClient = class {
  /**
   * Availability lifecycle, behind the shared transient-aware latch (#1476).
   * The PATH candidate is resolved by spawning `cargo --version` with a 3 s
   * budget, so a host stall could latch "no cargo" for the session and silently
   * disable every Rust diagnostic until restart.
   */
  availability;
  log;
  constructor(verbose = false) {
    this.log = verbose ? createSubsystemLogger("rust") : () => {
    };
    this.availability = createToolchainAvailability({
      tool: "cargo",
      label: "Cargo",
      // Common install paths, read when the client is built rather than at
      // import, so the home they name is the one the client runs under.
      windowsPaths: [
        path.join(process.env.USERPROFILE || "", ".cargo", "bin", "cargo.exe"),
        path.join(process.env.SYSTEMDRIVE || "C:", "\\cargo", "bin", "cargo.exe"),
        "cargo.exe"
        // PATH
      ],
      unixPaths: [
        path.join(process.env.HOME || "", ".cargo", "bin", "cargo"),
        "/usr/local/cargo/bin/cargo",
        "/usr/bin/cargo",
        "cargo"
        // PATH
      ],
      probeArgs: ["--version"],
      budgetMs: PROBE_TIMEOUT_MS,
      log: (msg) => this.log(msg)
    });
  }
  /**
   * Find cargo executable path (async — probes PATH candidates off the event loop).
   */
  async findCargoPathAsync() {
    return this.availability.findPath();
  }
  /**
   * Check if cargo is installed (cached)
   */
  async isAvailableAsync() {
    return this.availability.isAvailable();
  }
  /**
   * Check if a file is a Rust file
   */
  isRustFile(filePath) {
    return path.extname(filePath).toLowerCase() === ".rs";
  }
  /** Forget the memoized cargo path and latched availability verdict — #2455. */
  resetAvailability() {
    this.availability.reset();
  }
};
var rustClient = new RustClient();
function resetRustAvailability() {
  rustClient.resetAvailability();
}

export {
  RustClient,
  rustClient,
  resetRustAvailability
};
