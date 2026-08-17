/**
 * Ruff Client for pi-lens
 *
 * Fast Python linting and formatting via Ruff CLI.
 * Replaces flake8, pylint, isort, black, pyupgrade.
 *
 * Requires: pip install ruff
 * Docs: https://docs.astral.sh/ruff/
 */
import { createSubsystemLogger } from "./extension-log.js";
import * as fs from "node:fs";
import * as path from "node:path";
import { createAvailabilityChecker, resolveAvailableOrInstall } from "./dispatch/runners/utils/runner-helpers.js";
import { isFileKind } from "./file-kinds.js";
import { safeSpawnAsync } from "./safe-spawn.js";
import { ruffConfigArgs } from "./tool-policy.js";
// --- Client ---
const ruffAvailability = createAvailabilityChecker("ruff", ".exe");
export class RuffClient {
    ruffCommand = "ruff";
    log;
    constructor(verbose = false) {
        this.log = verbose
            ? createSubsystemLogger("ruff")
            : () => { };
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
     * `cwd` is the dispatch language root (used for config discovery); when
     * omitted it defaults to the file's directory.
     */
    async fixFileAsync(filePath, cwd) {
        if (!(await this.ensureAvailable())) {
            return {
                success: false,
                changed: false,
                fixed: 0,
                error: "Ruff not available",
            };
        }
        const absolutePath = path.resolve(filePath);
        if (!fs.existsSync(absolutePath)) {
            return {
                success: false,
                changed: false,
                fixed: 0,
                error: "File not found",
            };
        }
        try {
            const before = await fs.promises.readFile(absolutePath, "utf-8");
            // Shared config-args seam (#1247): the lint runner consumes the same
            // builder, so `check --fix` can never drift to ruff's default rule
            // set when the project lacks its own config and the package-owned
            // core.toml fallback applies.
            const configArgs = ruffConfigArgs(cwd ?? path.dirname(absolutePath));
            const spawnOpts = { timeout: 10000, cwd: cwd ?? path.dirname(absolutePath) };
            const pre = await safeSpawnAsync(this.ruffCommand, [
                "check",
                "--output-format",
                "json",
                "--target-version",
                "py310",
                ...configArgs,
                absolutePath,
            ], spawnOpts);
            const beforeDiags = pre.stdout?.trim()
                ? this.parseOutput(pre.stdout, absolutePath)
                : [];
            const fixableCount = beforeDiags.filter((d) => d.fixable).length;
            const fix = await safeSpawnAsync(this.ruffCommand, ["check", "--fix", ...configArgs, absolutePath], { timeout: 15000, cwd: cwd ?? path.dirname(absolutePath) });
            if (fix.error) {
                return {
                    success: false,
                    changed: false,
                    fixed: 0,
                    error: fix.error.message,
                };
            }
            const after = await fs.promises.readFile(absolutePath, "utf-8");
            const changed = before !== after;
            if (changed) {
                this.log(`Fixed ${fixableCount} issue(s) in ${path.basename(filePath)}`);
            }
            return { success: true, changed, fixed: fixableCount };
        }
        catch (err) {
            return { success: false, changed: false, fixed: 0, error: err.message };
        }
    }
    // --- Internal ---
    parseOutput(output, filterFile) {
        if (!output.trim())
            return [];
        try {
            const items = JSON.parse(output);
            const diagnostics = [];
            for (const item of items) {
                // Filter to single file if requested
                if (filterFile && path.resolve(item.filename) !== filterFile)
                    continue;
                diagnostics.push({
                    line: item.location.row - 1, // ruff is 1-indexed
                    column: item.location.column - 1,
                    endLine: item.end_location.row - 1,
                    endColumn: item.end_location.column - 1,
                    severity: item.code?.startsWith("E") ? "error" : "warning",
                    message: item.message,
                    rule: item.code || "unknown",
                    file: item.filename,
                    fixable: item.fix !== null,
                });
            }
            return diagnostics;
        }
        catch (err) {
            void err;
            this.log("Failed to parse ruff JSON output");
            return [];
        }
    }
}
