import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  createAvailabilityChecker,
  resolveAvailableOrInstall
} from "./chunk-ZFORSIED.js";
import {
  ruffConfigArgs
} from "./chunk-5F3XF3SX.js";
import "./chunk-XYLC35E4.js";
import "./chunk-DYRZGUMA.js";
import "./chunk-FHEV6T4L.js";
import "./chunk-ZZDIOAAJ.js";
import "./chunk-7ANZ7XDD.js";
import "./chunk-WC6WRNQT.js";
import "./chunk-HHR7WGCI.js";
import "./chunk-HKIL6DCL.js";
import "./chunk-PPKECBPP.js";
import "./chunk-5RNB4HVK.js";
import "./chunk-CKEQFGLT.js";
import "./chunk-JYLOYTZD.js";
import "./chunk-HUAM7QG3.js";
import "./chunk-HXFUTMX2.js";
import "./chunk-2BEMIWEW.js";
import "./chunk-IJYGIDF4.js";
import "./chunk-BQG2QFVO.js";
import {
  resolveToolCwd
} from "./chunk-IYVYZQRL.js";
import "./chunk-VOP4PJKA.js";
import "./chunk-JBP7KESM.js";
import "./chunk-UYXV5NIS.js";
import "./chunk-JZRP4DGP.js";
import "./chunk-SDFKOLSF.js";
import "./chunk-BBET6HD6.js";
import "./chunk-G6JKM4O7.js";
import "./chunk-O2ARHQKF.js";
import {
  safeSpawnAsync
} from "./chunk-WMDUT4KH.js";
import "./chunk-AWQWXSW4.js";
import "./chunk-QYF5S6P6.js";
import {
  isFileKind
} from "./chunk-G5GV2Q7K.js";
import "./chunk-X35S7HSB.js";
import "./chunk-SQC7K3SP.js";
import "./chunk-JE6HKLC7.js";
import "./chunk-2453RRJ2.js";
import {
  createSubsystemLogger
} from "./chunk-WQV6BI4Q.js";
import "./chunk-S26LC76R.js";
import "./chunk-565VRUP4.js";
import "./chunk-VLQ7UKZH.js";
import "./chunk-LJDODBBZ.js";
import {
  pathsEqual
} from "./chunk-GMROJJRN.js";
import "./chunk-NXL4FFQQ.js";

// dist/clients/ruff-client.js
import * as fs from "node:fs";
import * as path from "node:path";
var ruffAvailability = createAvailabilityChecker("ruff", ".exe");
var RuffClient = class {
  ruffCommand = "ruff";
  log;
  constructor(verbose = false) {
    this.log = verbose ? createSubsystemLogger("ruff") : () => {
    };
  }
  /**
   * Check if ruff CLI is available, auto-install if not.
   *
   * Re-entrancy safe: the shared availability seam deduplicates the complete
   * probe/auto-install transaction per cwd and tool, so concurrent callers do
   * not duplicate installation attempts.
   */
  async ensureAvailable() {
    const resolved = await resolveAvailableOrInstall(ruffAvailability, "ruff", process.cwd());
    if (!resolved)
      return false;
    this.ruffCommand = resolved;
    return true;
  }
  /**
   * Check if a file is a Python file
   */
  isPythonFile(filePath) {
    return isFileKind(filePath, "python");
  }
  /**
   * Async auto-fix variant for pipeline use (non-blocking spawn).
   * `cwd` is the dispatch language root. It is the seam's starting point,
   * not the answer: `resolveToolCwd` walks from the file to the nearest
   * `pyproject.toml`/`ruff.toml`/`.ruff.toml` at or above it, capped inside
   * `cwd` (and at `$HOME` when there is none), so a file in a nested package
   * gets that package's config rather than the workspace-root one.
   */
  async fixFileAsync(filePath, cwd) {
    if (!await this.ensureAvailable()) {
      return {
        success: false,
        changed: false,
        fixed: 0,
        error: "Ruff not available"
      };
    }
    const absolutePath = path.resolve(filePath);
    if (!fs.existsSync(absolutePath)) {
      return {
        success: false,
        changed: false,
        fixed: 0,
        error: "File not found"
      };
    }
    try {
      const before = await fs.promises.readFile(absolutePath, "utf-8");
      const ruffCwd = resolveToolCwd("runner", "ruff", absolutePath, {
        ...cwd !== void 0 && { cwd }
      }).cwd;
      const configArgs = ruffConfigArgs(ruffCwd);
      const pre = await safeSpawnAsync(this.ruffCommand, [
        "check",
        // `--no-fix --no-fix-only` (#5119): the count below must see the
        // findings; a project `fix = true` / `fix-only = true` made this
        // pass fix them first.
        "--no-fix",
        "--no-fix-only",
        "--output-format",
        "json",
        // No target-version override here (#4638): one made the pre-check
        // parse at py310 while `check --fix` below (and the lint runner)
        // read the project's own setting, so a 3.12-only line looked
        // fixable to one pass and unparseable to the other. Ruff
        // discovers the level from the project config itself; a value
        // derived here would be a second owner of that decision.
        ...configArgs,
        absolutePath
      ], { timeout: 1e4, cwd: ruffCwd });
      const beforeDiags = pre.stdout?.trim() ? this.parseOutput(pre.stdout, ruffCwd, absolutePath) : [];
      const fixableCount = beforeDiags.filter((d) => d.fixable).length;
      const fix = await safeSpawnAsync(this.ruffCommand, ["check", "--fix", ...configArgs, absolutePath], { timeout: 15e3, cwd: ruffCwd });
      if (fix.error) {
        return {
          success: false,
          changed: false,
          fixed: 0,
          error: fix.error.message
        };
      }
      const after = await fs.promises.readFile(absolutePath, "utf-8");
      const changed = before !== after;
      if (changed) {
        this.log(`Fixed ${fixableCount} issue(s) in ${path.basename(filePath)}`);
      }
      return { success: true, changed, fixed: fixableCount };
    } catch (err) {
      return { success: false, changed: false, fixed: 0, error: err.message };
    }
  }
  // --- Internal ---
  /**
   * `cwd` is the directory ruff RAN in, and it is REQUIRED: a default would
   * hide the wrong base at a call site that forgot it (#3284's D11).
   *
   * ruff's JSON `filename` is the `SourceFile`'s name verbatim — the JSON
   * renderer reads `span.file().path(resolver)` (ruff 0.16.8
   * `crates/ruff_db/src/diagnostic/render/json.rs:58,120`), which for a ruff
   * (not `ty`) diagnostic is `file.name()` (`crates/ruff_db/src/diagnostic/
   * mod.rs:1187-1193`), NOT the cwd-relative `relative_path` the text
   * renderers use (`mod.rs:1195-1204`). That name is
   * `SourceFileBuilder::new(path.to_string_lossy(), …)`
   * (`crates/ruff_linter/src/linter.rs:1049`) over a path the resolver has
   * already absolutized ("Normalize every path (e.g., convert from relative to
   * absolute)", `crates/ruff_workspace/src/resolver.rs:484`). So ruff echoes
   * the absolute path we hand it as argv: the BASE was already right here and
   * the fold deletes a `path.resolve` with no base — which silently meant the
   * EXTENSION's `process.cwd()`, not ruff's — rather than leaving it for a
   * future relative invocation to re-enable.
   */
  parseOutput(output, cwd, filterFile) {
    if (!output.trim())
      return [];
    try {
      const items = JSON.parse(output);
      const diagnostics = [];
      for (const item of items) {
        if (filterFile && !pathsEqual(path.resolve(cwd, item.filename), filterFile))
          continue;
        diagnostics.push({
          line: item.location.row - 1,
          // ruff is 1-indexed
          column: item.location.column - 1,
          endLine: item.end_location.row - 1,
          endColumn: item.end_location.column - 1,
          severity: item.code?.startsWith("E") ? "error" : "warning",
          message: item.message,
          rule: item.code || "unknown",
          file: item.filename,
          fixable: item.fix !== null
        });
      }
      return diagnostics;
    } catch (err) {
      void err;
      this.log("Failed to parse ruff JSON output");
      return [];
    }
  }
};
export {
  RuffClient
};
