import { createRequire as __pilensCreateRequire } from "node:module"; const require = __pilensCreateRequire(import.meta.url);
import {
  truncatedByOutputCap
} from "./chunk-2EECBNC5.js";
import {
  LEDGER_FIELD_MAX
} from "./chunk-JAU72XNY.js";

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
  if (result.error || signal)
    return { kind: "did-not-run", ...base };
  if (status === null)
    return { kind: "did-not-run", ...base };
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

export {
  firstOutputLine,
  classifyRunOutcome,
  spawnFailedWithNoOutput
};
