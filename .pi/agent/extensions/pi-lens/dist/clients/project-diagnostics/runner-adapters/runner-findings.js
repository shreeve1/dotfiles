import * as fs from "node:fs";
import * as path from "node:path";
import { advisoryPathKey, validateAdvisoryProvenance, } from "../../advisory-provenance.js";
function failureMessage(failure) {
    const firstLine = failure.message.split("\n")[0]?.slice(0, 300) ?? "";
    return firstLine ? `${failure.name}: ${firstLine}` : failure.name;
}
/**
 * `TestFailure.location` (`test-runner-client.ts`) is a free-form string that
 * varies by parser: the vitest/jest JSON parser emits a real `"relPath:line"`
 * (line only — its own `test.location.column` is dropped before it reaches
 * this string, so column is never available from that source either), while
 * the pytest text parser abuses the same field for `"file:testName"` (no
 * digits) and the mix/ExUnit parser puts a bare module name in it (no colon
 * at all). Only pull a `line`/`column` out when the trailing segment(s) are
 * actually numeric, so pytest/mix locations are left alone (no line, same as
 * before this change) instead of misparsing part of a name as a line number.
 */
const LOCATION_LINE_COL_RE = /:(\d+)(?::(\d+))?$/;
function parseLocation(location) {
    if (!location)
        return {};
    const match = LOCATION_LINE_COL_RE.exec(location);
    if (!match)
        return {};
    return {
        line: Number.parseInt(match[1], 10),
        ...(match[2] ? { column: Number.parseInt(match[2], 10) } : {}),
    };
}
/**
 * One diagnostic per test failure, attributed to the test file that reported
 * it (not the source file the agent edited — that's `sourceFile` on
 * `TestResult`, but the failure itself lives in the test file). A result with
 * no individual failures listed (a parser that couldn't extract them, or a
 * runner error) still gets one diagnostic so the file isn't silently blank.
 *
 * `stale` (from the cache's own `stale` flag, set at turn_end when the turn
 * advanced before the test run finished — `runtime-turn.ts`) is surfaced as a
 * message prefix, mirroring the one-shot turn-context-injection message's own
 * stale wording (`consumeTestFindings`'s cached `content`) — a mode=full
 * caller deserves the same "this may already be superseded" honesty the
 * per-edit path already gives.
 */
export function testResultToProjectDiagnostics(result, stale = false) {
    if (result.failed === 0 && !result.error)
        return [];
    const stalePrefix = stale ? "[stale — from a prior turn] " : "";
    if (result.failures.length > 0) {
        return result.failures.map((failure) => ({
            filePath: result.file,
            ...parseLocation(failure.location),
            severity: "error",
            semantic: "blocking",
            tool: "test-runner",
            runner: result.runner,
            rule: `test:${result.runner}`,
            message: `${stalePrefix}${failureMessage(failure)}`,
            source: "project-scan",
        }));
    }
    return [
        {
            filePath: result.file,
            severity: "error",
            semantic: "blocking",
            tool: "test-runner",
            runner: result.runner,
            rule: `test:${result.runner}`,
            message: `${stalePrefix}${result.error
                ? `Test run error: ${result.error}`
                : `${result.failed} test(s) failed`}`,
            source: "project-scan",
        },
    ];
}
export function testRunnerFindingsToProjectDiagnostics(cache, cwd, runtime) {
    if (!cache.results || cache.results.length === 0)
        return [];
    const validation = cwd
        ? validateAdvisoryProvenance(cache, cwd, runtime)
        : { status: "unknown", reasons: ["validation-context-missing"] };
    const root = cwd ?? process.cwd();
    const missingKeys = new Set((cache.provenance?.files ?? [])
        .filter((file) => !fs.existsSync(path.resolve(root, file.path)))
        .map((file) => advisoryPathKey(file.path, root)));
    const historical = cache.superseded === true || cache.stale === true || validation.status !== "current";
    return cache.results
        .filter((result) => !missingKeys.has(advisoryPathKey(result.file, root)))
        .flatMap((result) => testResultToProjectDiagnostics(result, historical))
        .map((diagnostic) => historical ? {
        ...diagnostic,
        severity: "info",
        semantic: "none",
        message: diagnostic.message.startsWith("[stale")
            ? diagnostic.message
            : `[historical — re-run to confirm] ${diagnostic.message}`,
    } : diagnostic);
}
