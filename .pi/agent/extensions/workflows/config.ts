import * as fs from "node:fs";
import * as path from "node:path";
import { getAgentDir } from "@earendil-works/pi-coding-agent";

export const DEFAULT_MAX_AGENT_CALLS = 128;
export const DEFAULT_CONCURRENCY = 8;
/** Hard ceilings: a config typo should not let one run exhaust the account. */
export const MAX_CONFIGURABLE_AGENT_CALLS = 1_000;
export const MAX_CONFIGURABLE_CONCURRENCY = 32;

export interface WorkflowsConfig {
  maxAgentCalls?: number;
  concurrency?: number;
}

export function getConfigPath(): string {
  return path.join(getAgentDir(), "extensions", "workflows", "config.json");
}

/** Missing/unreadable/invalid config is not an error; callers fall back to defaults. */
export function loadWorkflowsConfig(
  configPath = getConfigPath(),
): WorkflowsConfig {
  try {
    const parsed: unknown = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return parsed && typeof parsed === "object"
      ? (parsed as WorkflowsConfig)
      : {};
  } catch {
    return {};
  }
}

function normalizePositiveInt(
  value: unknown,
  ceiling: number,
): number | undefined {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n)) return undefined;
  const floored = Math.floor(n);
  if (floored < 1) return undefined;
  return Math.min(floored, ceiling);
}

export function resolveMaxAgentCalls(
  config: WorkflowsConfig = loadWorkflowsConfig(),
): number {
  return (
    normalizePositiveInt(
      process.env.PI_WORKFLOWS_MAX_AGENT_CALLS,
      MAX_CONFIGURABLE_AGENT_CALLS,
    ) ??
    normalizePositiveInt(config.maxAgentCalls, MAX_CONFIGURABLE_AGENT_CALLS) ??
    DEFAULT_MAX_AGENT_CALLS
  );
}

export function resolveConcurrency(
  config: WorkflowsConfig = loadWorkflowsConfig(),
): number {
  return (
    normalizePositiveInt(
      process.env.PI_WORKFLOWS_CONCURRENCY,
      MAX_CONFIGURABLE_CONCURRENCY,
    ) ??
    normalizePositiveInt(config.concurrency, MAX_CONFIGURABLE_CONCURRENCY) ??
    DEFAULT_CONCURRENCY
  );
}
