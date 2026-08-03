/**
 * Resume support: re-run a prior failed or aborted workflow while satisfying
 * any `agent()` calls that already succeeded from its journal. The prior run
 * dir is read-only; the resumed run gets a new runId and its own journal so
 * it is itself resumable.
 */

import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { readJournal, type JournalEntry } from "./journal.ts";
import type { WorkflowDetails } from "./model.ts";

export interface ResumeSource {
  priorRunId: string;
  priorRunDir: string;
  source: string;
  argsJson?: string;
  entries: JournalEntry[];
  priorDetails: WorkflowDetails;
}

const RUN_ID_PATTERN = /^wf_[0-9a-f]{12}$/;

/** Path-traversal guard: model supply must match the strict runId shape. */
export function resolveWorkflowRunDir(runsRoot: string, runId: string): string {
  if (!runId || !RUN_ID_PATTERN.test(runId)) {
    throw new Error(
      `workflow resume: invalid run id "${runId}" (expected wf_<12 hex chars>)`,
    );
  }
  return path.join(runsRoot, runId);
}

function readJsonFile<T>(filePath: string, label: string): T {
  let text: string;
  try {
    text = fs.readFileSync(filePath, "utf8");
  } catch (error) {
    throw new Error(
      `workflow resume: ${label} missing or unreadable at ${filePath}: ${(error as Error).message}`,
    );
  }
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new Error(
      `workflow resume: ${label} at ${filePath} is not valid JSON: ${(error as Error).message}`,
    );
  }
}

export function prepareResume(
  runsRoot: string,
  runId: string,
  currentLaunchCwd: string,
): ResumeSource {
  const priorRunDir = resolveWorkflowRunDir(runsRoot, runId);
  if (!fs.existsSync(priorRunDir)) {
    throw new Error(
      `workflow resume: prior run ${runId} not found at ${priorRunDir}`,
    );
  }

  const priorDetails = readJsonFile<WorkflowDetails>(
    path.join(priorRunDir, "workflow.json"),
    "workflow.json",
  );
  // Status allowlist: ONLY failed and aborted are resumable. Anything else
  // — completed, running, or a garbage value read from a corrupted disk —
  // is rejected. The completed and running branches keep their specific
  // messages because those are the two cases users actually hit; every
  // other non-resumable status falls through to one tagged message.
  if (priorDetails.status === "completed") {
    throw new Error(
      `workflow resume: prior run ${runId} already completed; nothing to resume`,
    );
  }
  if (priorDetails.status === "running") {
    throw new Error(
      `workflow resume: prior run ${runId} may still be active (status: running); wait for it to settle or pick a different run`,
    );
  }
  if (priorDetails.status !== "failed" && priorDetails.status !== "aborted") {
    throw new Error(
      `workflow resume: prior run ${runId} has unresumable status "${priorDetails.status ?? "unknown"}"; only failed or aborted runs can be resumed`,
    );
  }

  // Cross-cwd guard: a resumed run executes under the CURRENT ctx.cwd, which
  // must match the prior run's cwd or the per-agent results (and any
  // journal-sourced file paths the script reads back) will be misinterpreted.
  // `launchCwd` is absent on legacy runs; same leniency as `scriptHash`.
  if (
    priorDetails.launchCwd !== undefined &&
    priorDetails.launchCwd !== currentLaunchCwd
  ) {
    throw new Error(
      `workflow resume: prior run ${runId} was launched from ${priorDetails.launchCwd} but resume was requested from ${currentLaunchCwd}; resume must run in the original project`,
    );
  }

  const scriptPath = path.join(priorRunDir, "script.js");
  if (!fs.existsSync(scriptPath)) {
    throw new Error(
      `workflow resume: prior run ${runId} is missing script.js at ${scriptPath}`,
    );
  }
  const source = fs.readFileSync(scriptPath, "utf8");
  const actualHash = createHash("sha256").update(source).digest("hex");
  if (priorDetails.scriptHash !== undefined) {
    if (actualHash !== priorDetails.scriptHash) {
      const short = (h: string) => h.slice(0, 12);
      throw new Error(
        `workflow resume: script.js hash mismatch for ${runId} (expected ${short(priorDetails.scriptHash)}, got ${short(actualHash)}); the prior run's script was modified after launch`,
      );
    }
  }

  const argsPath = path.join(priorRunDir, "args.json");
  const argsJson = fs.existsSync(argsPath)
    ? fs.readFileSync(argsPath, "utf8")
    : undefined;

  const entries = readJournal(priorRunDir);

  return {
    priorRunId: runId,
    priorRunDir,
    source,
    ...(argsJson !== undefined ? { argsJson } : {}),
    entries,
    priorDetails,
  };
}
