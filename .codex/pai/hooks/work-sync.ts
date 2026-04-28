#!/usr/bin/env bun
import {
  postEditReminder,
  readActiveState,
  stateAppliesToInput,
  touchesPlanningArtifact,
  writeActiveState,
} from "../lib/algorithm-state";
import { appendJsonLine, readJsonStdin, sessionContext } from "../lib/hook-io";
import { paiMemoryPath } from "../lib/paths";

function textFromInput(input: unknown): string {
  if (typeof input === "string") return input;
  if (!input || typeof input !== "object") return "";
  const record = input as Record<string, unknown>;
  return [
    record.command,
    record.patch,
    record.file_path,
    record.path,
    record.content,
  ]
    .filter((value) => typeof value === "string")
    .join("\n");
}

const input = readJsonStdin();
const toolText = textFromInput(input.tool_input);
const touchedPlanningArtifact = touchesPlanningArtifact(toolText);

if (touchedPlanningArtifact) {
  appendJsonLine(paiMemoryPath("work", "sync-events.jsonl"), {
    timestamp: new Date().toISOString(),
    session_id: input.session_id ?? null,
    turn_id: input.turn_id ?? null,
    tool: input.tool_name ?? null,
    commandPreview: toolText.slice(0, 500),
  });
}

const active = readActiveState();
if (stateAppliesToInput(active, input.session_id)) {
  if (touchedPlanningArtifact) {
    writeActiveState({
      ...active,
      artifactTouched: true,
      phase: "plan",
      updatedAt: new Date().toISOString(),
    });
  } else if (active.requiresPrd && !active.artifactTouched) {
    appendJsonLine(paiMemoryPath("work", "algorithm-reminders.jsonl"), {
      timestamp: new Date().toISOString(),
      session_id: input.session_id ?? null,
      turn_id: input.turn_id ?? null,
      tool: input.tool_name ?? null,
      reason: "substantive edit before planning artifact",
      commandPreview: toolText.slice(0, 500),
    });
    sessionContext("PostToolUse", postEditReminder(active));
  }
}
