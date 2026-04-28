#!/usr/bin/env bun
import {
  classifyPrompt,
  enforcementContext,
  finalizationSignals,
  missingFinalizationSignals,
  readActiveState,
  stateAppliesToInput,
  stopFinalizationReminder,
  writeActiveState,
} from "../lib/algorithm-state";
import { appendJsonLine, readJsonStdin, sessionContext, stopBlock, writeJson } from "../lib/hook-io";
import { paiMemoryPath } from "../lib/paths";

function explicitRating(prompt: string): { rating: number; comment?: string } | null {
  const match = prompt.trim().match(/^(10|[1-9])(?:\s*[-:]\s*|\s+)?(.*)$/);
  if (!match) return null;
  const suffix = prompt.trim().slice(match[1].length);
  if (suffix && /^[/.\dA-Za-z]/.test(suffix)) return null;
  const rating = Number(match[1]);
  const comment = match[2]?.trim();
  return { rating, comment: comment || undefined };
}

const input = readJsonStdin();
const event = input.hook_event_name ?? "Stop";
const timestamp = new Date().toISOString();

appendJsonLine(paiMemoryPath("state", "sessions.jsonl"), {
  timestamp,
  event,
  session_id: input.session_id ?? null,
  turn_id: input.turn_id ?? null,
  cwd: input.cwd ?? null,
  model: (input as Record<string, unknown>).model ?? null,
});

if (event === "UserPromptSubmit" && input.prompt) {
  const rating = explicitRating(input.prompt);
  if (rating) {
    appendJsonLine(paiMemoryPath("learning", "signals", "ratings.jsonl"), {
      timestamp,
      session_id: input.session_id ?? null,
      turn_id: input.turn_id ?? null,
      source: "explicit",
      ...rating,
    });
  }

  const classification = classifyPrompt(input.prompt);
  appendJsonLine(paiMemoryPath("state", "algorithm-prompts.jsonl"), {
    timestamp,
    session_id: input.session_id ?? null,
    turn_id: input.turn_id ?? null,
    promptPreview: input.prompt.slice(0, 300),
    ...classification,
  });

  if (classification.classification === "substantive") {
    writeActiveState({
      active: true,
      classification: classification.classification,
      reason: classification.reason,
      requiresPrd: classification.requiresPrd,
      suppliedArtifact: classification.suppliedArtifact,
      suggestedArtifact: classification.suggestedArtifact,
      session_id: input.session_id ?? null,
      turn_id: input.turn_id ?? null,
      promptPreview: input.prompt.slice(0, 300),
      phase: "observe",
      artifactTouched: false,
      updatedAt: timestamp,
    });
    sessionContext("UserPromptSubmit", enforcementContext(classification));
  }
}

if (event === "Stop") {
  const active = readActiveState();
  const lastAssistantMessage =
    typeof input.last_assistant_message === "string" ? input.last_assistant_message : "";
  if (stateAppliesToInput(active, input.session_id)) {
    const signals = finalizationSignals(lastAssistantMessage);
    appendJsonLine(paiMemoryPath("state", "algorithm-stop-review.jsonl"), {
      timestamp,
      session_id: input.session_id ?? null,
      turn_id: input.turn_id ?? null,
      activeSession: active.session_id ?? null,
      artifactTouched: active.artifactTouched,
      hasVerificationSignal: signals.verification,
      hasReviewSignal: signals.review,
      hasLearningSignal: signals.learning,
      messagePreview: lastAssistantMessage.slice(0, 500),
    });
    const missingSignals = missingFinalizationSignals(signals);
    if (missingSignals.length > 0 && !input.stop_hook_active) {
      stopBlock(stopFinalizationReminder(active, missingSignals));
    } else {
      writeJson({ continue: true });
    }
  } else {
    writeJson({ continue: true });
  }
}
