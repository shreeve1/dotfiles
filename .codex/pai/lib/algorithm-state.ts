import { existsSync, readFileSync, writeFileSync } from "fs";
import { dirname } from "path";
import { mkdirSync } from "fs";
import { paiMemoryPath } from "./paths";

export type AlgorithmClassification = "trivial" | "substantive";

export interface PromptClassification {
  classification: AlgorithmClassification;
  reason: string;
  requiresPrd: boolean;
  suppliedArtifact: string | null;
  suggestedArtifact: string;
}

export interface AlgorithmState {
  active: boolean;
  classification: AlgorithmClassification;
  reason: string;
  requiresPrd: boolean;
  suppliedArtifact: string | null;
  suggestedArtifact: string;
  session_id: string | null;
  turn_id: string | null;
  promptPreview: string;
  phase: "observe" | "think" | "plan" | "build" | "execute" | "verify" | "review" | "learn";
  artifactTouched: boolean;
  updatedAt: string;
}

export interface FinalizationSignals {
  verification: boolean;
  review: boolean;
  learning: boolean;
}

const SUBSTANTIVE_PATTERNS = [
  /\b(add|build|create|implement|fix|repair|debug|diagnose|investigate|review|plan|design|port|migrate|refactor|test|validate|deploy|harden|enforce|proceed)\b/i,
  /\b(issue|bug|regression|failure|failing|broken|crash|error|risk|gap|workflow|system|algorithm|prd)\b/i,
  /\$dev-(build|plan|prd|review|test|validate|investigate|team)\b/i,
];

const TRIVIAL_PATTERNS = [
  /^(continue|go on|ok|okay|yes|no|thanks|thank you|status|\?|help)$/i,
  /^(what directory should i try this in\??|any directory\??)$/i,
];

const ARTIFACT_PATTERN = /\b(?:artifacts\/(?:plans|specs)\/[^\s`'")]+|[A-Za-z0-9._/-]*(?:PRD|prd|plan)\.md)\b/;

function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .replace(/[`'"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
    .replace(/-+$/g, "");
  return slug || "pai-work";
}

export function artifactMention(text: string): string | null {
  const match = text.match(ARTIFACT_PATTERN);
  return match ? match[0] : null;
}

export function touchesPlanningArtifact(text: string): boolean {
  return /(?:artifacts\/(?:plans|specs)\/|(?:^|\/)(?:PRD|prd|plan)\.md\b)/.test(text);
}

export function classifyPrompt(prompt: string | undefined | null): PromptClassification {
  const text = (prompt ?? "").trim();
  const suppliedArtifact = artifactMention(text);
  const suggestedArtifact = `artifacts/specs/${slugify(text).slice(0, 48) || "pai-work"}/PRD.md`;
  if (!text) {
    return {
      classification: "trivial",
      reason: "empty prompt",
      requiresPrd: false,
      suppliedArtifact,
      suggestedArtifact,
    };
  }
  if (TRIVIAL_PATTERNS.some((pattern) => pattern.test(text))) {
    return {
      classification: "trivial",
      reason: "short continuation or acknowledgement",
      requiresPrd: false,
      suppliedArtifact,
      suggestedArtifact,
    };
  }
  const isSubstantive = SUBSTANTIVE_PATTERNS.some((pattern) => pattern.test(text)) || Boolean(suppliedArtifact);
  return {
    classification: isSubstantive ? "substantive" : "trivial",
    reason: isSubstantive ? "prompt matches planning/build/investigation language" : "no substantive trigger matched",
    requiresPrd: isSubstantive,
    suppliedArtifact,
    suggestedArtifact,
  };
}

export function activeStatePath(): string {
  return paiMemoryPath("state", "algorithm-active.json");
}

export function readActiveState(): AlgorithmState | null {
  const path = activeStatePath();
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as AlgorithmState;
  } catch {
    return null;
  }
}

export function writeActiveState(state: AlgorithmState): void {
  const path = activeStatePath();
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(state, null, 2)}\n`);
}

export function stateAppliesToInput(state: AlgorithmState | null, sessionId: unknown): state is AlgorithmState {
  if (!state?.active) return false;
  if (!state.session_id || !sessionId) return true;
  return state.session_id === sessionId;
}

export function finalizationSignals(message: string): FinalizationSignals {
  return {
    verification: /\b(test|tests|verified|verification|passed|failed|checked)\b/i.test(message),
    review: /\b(review|criteria|acceptance|risk|gap|constraint)\b/i.test(message),
    learning: /\b(learn|learning|memory|durable note)\b/i.test(message),
  };
}

export function missingFinalizationSignals(signals: FinalizationSignals): Array<keyof FinalizationSignals> {
  return (["verification", "review", "learning"] as const).filter((signal) => !signals[signal]);
}

export function enforcementContext(classification: PromptClassification): string {
  const artifact = classification.suppliedArtifact ?? classification.suggestedArtifact;
  return [
    "PAI Algorithm enforcement:",
    `- This prompt appears substantive (${classification.reason}).`,
    `- Before Build/Execute, create or update the planning artifact: \`${artifact}\`.`,
    "- Fill it with requested outcome, current state, ideal state criteria, scope, assumptions, risks, approach, and verification plan.",
    "- Keep the PRD or supplied plan current as decisions change.",
    "- Before the final response, review the result against the PRD/plan, acceptance criteria, tests, and constraints; report unresolved gaps.",
    "- During Learn, write a short durable note only for reusable corrections, decisions, user preferences, or workflow failures.",
  ].join("\n");
}

export function postEditReminder(state: AlgorithmState): string {
  const artifact = state.suppliedArtifact ?? state.suggestedArtifact;
  return [
    "PAI Algorithm correction:",
    "- This session is marked as substantive, but the last edit did not touch a PRD or plan artifact.",
    `- Create or update \`${artifact}\` before continuing implementation unless the user explicitly supplied a different artifact or the task has become trivial.`,
    "- Keep verification, review, and learning notes current before finalizing.",
  ].join("\n");
}

export function stopFinalizationReminder(
  state: AlgorithmState,
  missingSignals: Array<keyof FinalizationSignals>,
): string {
  const artifact = state.suppliedArtifact ?? state.suggestedArtifact;
  const missing = missingSignals.join(", ");
  return [
    "PAI Algorithm finalization required:",
    `- This substantive session is missing finalization signal(s): ${missing}.`,
    `- Review the work against \`${artifact}\` or the supplied plan, including acceptance criteria, constraints, risks, and unresolved gaps.`,
    "- Include verification evidence: tests/checks run and pass/fail status, or explain why verification was not run.",
    "- Include Learn: write a durable note only if reusable, otherwise state that no durable learning was warranted.",
    "- Then provide the final response.",
  ].join("\n");
}
