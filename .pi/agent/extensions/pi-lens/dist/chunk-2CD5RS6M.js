import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  classifyRunOutcome,
  firstOutputLine
} from "./chunk-UZ3TUTRV.js";
import {
  incrementDegradationCount,
  truncateForLedger
} from "./chunk-JAU72XNY.js";

// dist/clients/dispatch/types.js
var RUNNER_SKIP_REASONS = [
  "no-files-matched",
  "configured-non-biome-linter",
  "dialect-unsupported",
  "covered-by-primary"
];
function isRunnerSkipReason(value) {
  return RUNNER_SKIP_REASONS.some((reason) => reason === value);
}
var RUNNER_CLAIM_SOURCES = ["declared", "builtin-fact"];
function isRunnerClaimSource(value) {
  return RUNNER_CLAIM_SOURCES.some((source) => source === value);
}
var BLOCKING_DIAGNOSTICS_FAILURE_KIND = "blocking_diagnostics";
function findingsResult(diagnostics, verdict) {
  if (verdict.status === "failed") {
    return {
      ...verdict,
      diagnostics,
      failureKind: BLOCKING_DIAGNOSTICS_FAILURE_KIND
    };
  }
  return { ...verdict, diagnostics };
}
function hasUsableResult(result) {
  return result.status === "succeeded" || result.status === "failed" && result.failureKind === BLOCKING_DIAGNOSTICS_FAILURE_KIND;
}

// dist/clients/dispatch/runners/utils/tool-failure.js
function describeEnding(input) {
  if (input.outputCapped)
    return "was stopped at its output cap";
  if (input.signal)
    return `was killed by ${input.signal}`;
  if (input.status === null)
    return "did not run (spawn failure)";
  return `exited ${input.status}`;
}
function formatToolFailure(input) {
  const entries = Object.entries(input.fields ?? {}).filter(([, value]) => value !== void 0 && value !== "");
  const identity = entries.length ? `${input.tool} (${entries.map(([key, value]) => `${key}=${value}`).join(", ")})` : input.tool;
  const what = describeEnding(input);
  const missing = input.reportMissing ? "no report file" : "no output";
  const detail = firstOutputLine(input.stderr) || firstOutputLine(input.stdout) || "no stderr";
  return truncateForLedger(`${identity} ${what} with ${missing}: ${detail}`);
}
function formatRunOutcomeFailure(tool, outcome, fields) {
  return formatToolFailure({
    tool,
    status: outcome.status,
    signal: outcome.signal,
    outputCapped: outcome.outputCapped,
    stderr: outcome.firstOutputLine,
    reportMissing: outcome.kind === "report-missing",
    fields: { outcome: outcome.kind, ...fields }
  });
}
function skipUnlessToolRan(tool, input, fields) {
  const outcome = classifyRunOutcome(input);
  if (outcome.kind === "ran")
    return null;
  incrementDegradationCount({
    kind: "runner-empty-result",
    subject: tool,
    reason: formatRunOutcomeFailure(tool, outcome, fields)
  });
  return { status: "skipped", diagnostics: [], semantic: "none" };
}
function recordParsedNothing(input) {
  const { tool, status, output, parsedCount } = input;
  if (parsedCount > 0)
    return false;
  if (!status)
    return false;
  const text = output ?? "";
  if (!text.trim())
    return false;
  const entries = Object.entries(input.fields ?? {}).filter(([, value]) => value !== void 0 && value !== "");
  const identity = entries.length ? `${tool} (${entries.map(([key, value]) => `${key}=${value}`).join(", ")})` : tool;
  incrementDegradationCount({
    kind: "runner-parsed-nothing",
    subject: tool,
    reason: truncateForLedger(`${identity} exited ${status} with ${text.length} chars of output but the parser read 0 diagnostics: ${firstOutputLine(text) || "no first line"}`)
  });
  return true;
}
function parseToolRun(tool, input, parse, options = {}) {
  const skipped = skipUnlessToolRan(tool, input, options.fields);
  if (skipped)
    return { skipped, diagnostics: [], parsedNothing: false };
  const output = options.parseOutput ?? input.output ?? input.result.stdout ?? "";
  const diagnostics = [...parse(output)];
  const parsedNothing = recordParsedNothing({
    tool,
    status: input.result.status ?? null,
    output,
    parsedCount: diagnostics.length,
    fields: options.fields
  });
  if (parsedNothing && options.skipWhenParsedNothing) {
    return {
      skipped: { status: "skipped", diagnostics: [], semantic: "none" },
      diagnostics: [],
      parsedNothing
    };
  }
  return { skipped: null, diagnostics, parsedNothing };
}
function finishParsedRun(input) {
  const raw = `${input.result.stdout ?? ""}${input.result.stderr ?? ""}`;
  const status = input.result.status ?? null;
  if (input.diagnostics.length === 0) {
    if (status !== 0 && raw.trim().length > 0) {
      const message = `${input.tool} exited ${status} but its output could not be parsed`;
      return {
        status: "failed",
        diagnostics: [
          {
            id: `${input.tool}:parse-error:1`,
            message,
            filePath: input.ctx.filePath,
            line: 1,
            column: 1,
            severity: "warning",
            semantic: "warning",
            tool: input.tool
          }
        ],
        semantic: "warning",
        failureKind: "parser_error",
        failureMessage: message
      };
    }
    return { status: "succeeded", diagnostics: [], semantic: "none" };
  }
  const mapped = input.classify?.(input.diagnostics);
  if (mapped) {
    return findingsResult(input.diagnostics, mapped);
  }
  const hasBlocking = input.diagnostics.some((d) => d.semantic === "blocking");
  return findingsResult(input.diagnostics, {
    status: hasBlocking ? "failed" : "succeeded",
    semantic: hasBlocking ? "blocking" : "warning"
  });
}

export {
  isRunnerSkipReason,
  isRunnerClaimSource,
  findingsResult,
  hasUsableResult,
  formatToolFailure,
  skipUnlessToolRan,
  parseToolRun,
  finishParsedRun
};
