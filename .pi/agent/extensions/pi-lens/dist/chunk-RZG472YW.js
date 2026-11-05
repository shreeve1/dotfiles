import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  truncatedByOutputCap
} from "./chunk-JE6HKLC7.js";
import {
  LEDGER_FIELD_MAX,
  incrementDegradationCount,
  truncateForLedger
} from "./chunk-2453RRJ2.js";

// dist/clients/dispatch/runners/utils/spawn-outcome.js
function firstOutputLine(text, max = LEDGER_FIELD_MAX) {
  for (const line of String(text ?? "").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed)
      continue;
    return trimmed.length > max ? `${trimmed.slice(0, max)}\u2026` : trimmed;
  }
  return "";
}
function processCutShort(result) {
  return Boolean(result.error || result.signal) || (result.status ?? null) === null;
}
function classifyRunOutcome(input) {
  const { result, exitCodes, reportMissing } = input;
  const status = result.status ?? null;
  const signal = result.signal ?? null;
  const output = input.output ?? result.stdout;
  const base = {
    status,
    signal,
    firstOutputLine: firstOutputLine(result.stderr) || firstOutputLine(result.stdout) || firstOutputLine(result.error?.message),
    // Evidence carried alongside the verdict, never part of deciding it — the
    // branches below are byte-for-byte the pre-#2100 rules.
    outputCapped: truncatedByOutputCap(result)
  };
  if (processCutShort(result) || status === null) {
    return { kind: "did-not-run", ...base };
  }
  if (reportMissing) {
    return status === 0 ? { kind: "ran", ...base } : { kind: "report-missing", ...base };
  }
  if (status !== 0 && exitCodes && !exitCodes.ran.includes(status)) {
    return { kind: "rejected-invocation", ...base };
  }
  if (status !== 0 && !output?.trim()) {
    return { kind: "did-not-run", ...base };
  }
  return { kind: "ran", ...base };
}
function spawnFailedWithNoOutput(result, output = result.stdout) {
  return classifyRunOutcome({ result, output }).kind !== "ran" && !output?.trim();
}

// dist/clients/dispatch/types.js
function spanOverlapsModifiedRanges(startLine, endLine, ranges) {
  if (!ranges || ranges.length === 0)
    return true;
  return ranges.some((r) => startLine <= r.end && endLine >= r.start);
}
var RUNNER_SKIP_REASONS = [
  "no-files-matched",
  "configured-non-biome-linter",
  "dialect-unsupported",
  "covered-by-primary",
  "disabled-by-config",
  "not-enabled"
];
var NOT_APPLICABLE_SKIP_REASONS = [
  "no-files-matched",
  "configured-non-biome-linter",
  "dialect-unsupported",
  "not-enabled"
];
function isNotApplicableSkipReason(value) {
  return NOT_APPLICABLE_SKIP_REASONS.some((reason) => reason === value);
}
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
function faultResult(fault, diagnostic) {
  return {
    status: "failed",
    diagnostics: [
      {
        ...diagnostic,
        severity: "warning",
        semantic: "warning",
        runnerFault: true
      }
    ],
    semantic: "warning",
    failureKind: fault.kind,
    failureMessage: fault.failureMessage.slice(0, 200)
  };
}
function faultSkip(fault) {
  return {
    status: "skipped",
    diagnostics: [],
    semantic: "none",
    skipFault: fault
  };
}
function hasUsableResult(result) {
  return result.status === "succeeded" || result.status === "failed" && result.failureKind === BLOCKING_DIAGNOSTICS_FAILURE_KIND;
}
function reachedNoVerdict(result) {
  if (result.inconclusive === true)
    return true;
  switch (result.status) {
    case "failed":
      return !hasUsableResult(result);
    case "deferred":
      return true;
    case "skipped":
      return !isRunnerSkipReason(result.skipReason) || result.skipReason === "not-enabled";
    default:
      return false;
  }
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
  const kind = outcome.kind;
  if (kind === "ran")
    return null;
  incrementDegradationCount({
    kind: "runner-empty-result",
    subject: tool,
    reason: formatRunOutcomeFailure(tool, outcome, fields)
  });
  return faultSkip(kind);
}
function faultIfCutShort(result, diagnostics) {
  if (!processCutShort(result))
    return null;
  if (diagnostics.length === 0)
    return faultSkip("did-not-run");
  const hasBlocking = diagnostics.some((d) => d.semantic === "blocking");
  return {
    status: "failed",
    diagnostics: [...diagnostics],
    semantic: hasBlocking ? "blocking" : "warning",
    failureKind: "did-not-run"
  };
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
      return faultResult({ kind: "parser_error", failureMessage: message }, {
        id: `${input.tool}:parse-error:1`,
        message,
        filePath: input.ctx.filePath,
        line: 1,
        column: 1,
        tool: input.tool
      });
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
  spanOverlapsModifiedRanges,
  isNotApplicableSkipReason,
  isRunnerSkipReason,
  isRunnerClaimSource,
  findingsResult,
  faultResult,
  faultSkip,
  hasUsableResult,
  reachedNoVerdict,
  firstOutputLine,
  processCutShort,
  spawnFailedWithNoOutput,
  formatToolFailure,
  skipUnlessToolRan,
  faultIfCutShort,
  parseToolRun,
  finishParsedRun
};
