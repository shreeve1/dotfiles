import { randomUUID } from "node:crypto";
import { access, appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE_PATH_SEGMENTS = ["artifacts", "self-improving-agent", "memory"];
const AUTO_PATTERN_THRESHOLD = 2;
const DIAGNOSTIC_FILE = "plugin-diagnostics.jsonl";

function truncate(value, limit = 4000) {
  if (typeof value !== "string") return value;
  if (value.length <= limit) return value;
  return `${value.slice(0, limit)}\n...[truncated]`;
}

function safeSerialize(value) {
  try {
    return JSON.parse(JSON.stringify(value ?? null));
  } catch {
    return {
      unserializable: true,
      type: typeof value,
    };
  }
}

function normalizeWhitespace(value) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim();
}

function slugify(value, fallback = "pattern") {
  const slug = normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return slug || fallback;
}

function extractText(parts) {
  if (!Array.isArray(parts)) return "";

  return truncate(
    parts
      .map((part) => {
        if (!part || typeof part !== "object") return String(part);
        if (typeof part.text === "string") return part.text;
        if (typeof part.type === "string") return `[${part.type}]`;
        return "[part]";
      })
      .join("\n")
      .trim(),
  );
}

function getExitCode(metadata) {
  if (!metadata || typeof metadata !== "object") return undefined;
  if (typeof metadata.exitCode === "number") return metadata.exitCode;
  if (typeof metadata.exit_code === "number") return metadata.exit_code;
  if (typeof metadata.exit === "number") return metadata.exit;
  return undefined;
}

function getToolDedupeKey(callID, status, exitCode) {
  return `${callID}:${status}:${typeof exitCode === "number" ? exitCode : "na"}`;
}

function getOutcomeSummary(tool, args, title) {
  const normalizedTitle = normalizeWhitespace(title);
  if (normalizedTitle) return normalizedTitle;

  if (tool === "bash" && args && typeof args.command === "string") {
    return normalizeWhitespace(args.command).slice(0, 80);
  }

  return tool;
}

function buildAutoPattern(signature, tracker) {
  const created = new Date().toISOString().slice(0, 10);
  const patternId = `pat-auto-${slugify(signature, tracker.tool)}`;
  const isError = tracker.status === "error";
  const summary = tracker.summary;
  const confidence = Math.min(0.65 + Math.max(tracker.occurrences - AUTO_PATTERN_THRESHOLD, 0) * 0.1, 0.95);

  return {
    id: patternId,
    name: `${tracker.tool} ${tracker.status}: ${summary}`,
    source: "auto_tool_outcome",
    confidence,
    applications: tracker.occurrences,
    created,
    category: isError ? "workflow-errors" : "workflow-successes",
    pattern: isError
      ? `Repeated ${tracker.tool} failures were observed for \"${summary}\".`
      : `Repeated ${tracker.tool} successes were observed for \"${summary}\".`,
    problem: isError
      ? `The same ${tracker.tool} workflow keeps failing when handling \"${summary}\".`
      : `The same ${tracker.tool} workflow recurs often enough to preserve as a repeatable approach for \"${summary}\".`,
    solution: {
      summary: isError
        ? `Inspect the recurring ${tracker.tool} failure mode for \"${summary}\" before retrying, and add prechecks or narrower validation where possible.`
        : `Reuse the established ${tracker.tool} workflow for \"${summary}\" when the same task appears again.`,
    },
    quality_rules: isError
      ? [
          `Review the latest ${tracker.tool} output before repeating \"${summary}\".`,
          "Tighten prechecks or scope before rerunning the same workflow.",
        ]
      : [
          `Prefer the known-good ${tracker.tool} workflow for \"${summary}\".`,
          "Keep the same scope and ordering when repeating this task.",
        ],
    target_skills: [],
    auto_generated: true,
    signature,
    evidence: {
      tool: tracker.tool,
      status: tracker.status,
      summary,
      first_seen: tracker.first_seen,
      last_seen: tracker.last_seen,
    },
  };
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureJson(filePath, initialValue) {
  if (await exists(filePath)) return;
  await writeFile(filePath, `${JSON.stringify(initialValue, null, 2)}\n`, "utf8");
}

async function ensureMemoryLayout(root) {
  const year = new Date().getUTCFullYear().toString();
  const episodicYearDir = path.join(root, "episodic", year);
  const workingDir = path.join(root, "working");

  await mkdir(episodicYearDir, { recursive: true });
  await mkdir(workingDir, { recursive: true });

  await ensureJson(path.join(root, "semantic-patterns.json"), {
    patterns: {},
    metadata: {
      schema_version: 1,
      created_by: "self-improving-agent-plugin",
      updated_at: new Date().toISOString(),
      auto_patterns: {},
      auto_pattern_threshold: AUTO_PATTERN_THRESHOLD,
    },
  });
}

async function appendDiagnostic(root, entry) {
  const filePath = path.join(root, "working", DIAGNOSTIC_FILE);
  await appendFile(filePath, `${JSON.stringify(entry)}\n`, "utf8");
}

async function updateSemanticMetadata(root) {
  const filePath = path.join(root, "semantic-patterns.json");
  try {
    const raw = await readFile(filePath, "utf8");
    const data = JSON.parse(raw);
    data.metadata = {
      ...(data.metadata ?? {}),
      updated_at: new Date().toISOString(),
    };
    await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  } catch {
    await ensureJson(filePath, {
      patterns: {},
      metadata: {
        schema_version: 1,
        created_by: "self-improving-agent-plugin",
        updated_at: new Date().toISOString(),
      },
    });
  }
}

async function loadSemanticData(root) {
  const filePath = path.join(root, "semantic-patterns.json");

  try {
    const raw = await readFile(filePath, "utf8");
    const data = JSON.parse(raw);
    data.patterns = data.patterns ?? {};
    data.metadata = data.metadata ?? {};
    data.metadata.auto_patterns = data.metadata.auto_patterns ?? {};
    return data;
  } catch {
    return {
      patterns: {},
      metadata: {
        schema_version: 1,
        created_by: "self-improving-agent-plugin",
        updated_at: new Date().toISOString(),
        auto_patterns: {},
      },
    };
  }
}

async function saveSemanticData(root, data) {
  const filePath = path.join(root, "semantic-patterns.json");
  data.metadata = {
    ...(data.metadata ?? {}),
    updated_at: new Date().toISOString(),
  };
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function promoteAutoPattern(root, event) {
  const summary = getOutcomeSummary(event.tool, event.args, event.title);
  const signature = `${event.tool}::${event.status}::${summary}`;
  const data = await loadSemanticData(root);
  const trackers = data.metadata.auto_patterns ?? {};
  const tracker = trackers[signature] ?? {
    tool: event.tool,
    status: event.status,
    summary,
    first_seen: event.timestamp,
    last_seen: event.timestamp,
    occurrences: 0,
    latest_event_id: event.id,
  };

  tracker.occurrences += 1;
  tracker.last_seen = event.timestamp;
  tracker.latest_event_id = event.id;
  trackers[signature] = tracker;
  data.metadata.auto_patterns = trackers;
  data.metadata.auto_pattern_threshold = AUTO_PATTERN_THRESHOLD;

  let promotedPattern = null;

  if (tracker.occurrences >= AUTO_PATTERN_THRESHOLD) {
    const nextPattern = buildAutoPattern(signature, tracker);
    const existing = data.patterns[nextPattern.id];

    data.patterns[nextPattern.id] = {
      ...existing,
      ...nextPattern,
      created: existing?.created ?? nextPattern.created,
      confidence: nextPattern.confidence,
      applications: tracker.occurrences,
      evidence: {
        ...(existing?.evidence ?? {}),
        ...nextPattern.evidence,
        latest_event_id: event.id,
      },
    };

    promotedPattern = data.patterns[nextPattern.id];
  }

  await saveSemanticData(root, data);
  return promotedPattern;
}

async function appendEpisode(root, event) {
  const date = new Date().toISOString().slice(0, 10);
  const year = date.slice(0, 4);
  const dir = path.join(root, "episodic", year);
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${date}-${event.session_id}.jsonl`);
  await appendFile(filePath, `${JSON.stringify(event)}\n`, "utf8");
}

async function writeWorkingFile(root, name, value) {
  const filePath = path.join(root, "working", name);
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function buildToolEventFromAfterHook(input, output) {
  const exitCode = getExitCode(output.metadata);
  const status = typeof exitCode === "number" ? (exitCode === 0 ? "success" : "error") : "completed";

  return {
    dedupeKey: getToolDedupeKey(input.callID, status, exitCode),
    event: {
      id: `ep-${randomUUID()}`,
      timestamp: new Date().toISOString(),
      session_id: input.sessionID,
      call_id: input.callID,
      tool: input.tool,
      status,
      exit_code: exitCode,
      title: output.title ?? null,
      args: safeSerialize(input.args),
      output_preview: truncate(output.output ?? ""),
      metadata: safeSerialize(output.metadata),
      source_hook: "tool.execute.after",
    },
  };
}

function buildToolEventFromMessagePart(part) {
  if (!part || part.type !== "tool") return null;

  const state = part.state;
  if (!state || (state.status !== "completed" && state.status !== "error")) {
    return null;
  }

  const exitCode = getExitCode(state.metadata);
  const status = state.status === "error"
    ? "error"
    : (exitCode === 0 ? "success" : (typeof exitCode === "number" ? "error" : "completed"));
  const timestamp = new Date().toISOString();

  return {
    dedupeKey: getToolDedupeKey(part.callID, status, exitCode),
    event: {
      id: `ep-${randomUUID()}`,
      timestamp,
      session_id: part.sessionID,
      message_id: part.messageID,
      call_id: part.callID,
      tool: part.tool,
      status,
      exit_code: exitCode,
      title: state.status === "completed" ? state.title ?? null : null,
      args: safeSerialize(state.input),
      output_preview: truncate(state.status === "completed" ? state.output ?? "" : state.error ?? ""),
      metadata: safeSerialize(state.metadata),
      source_hook: "event:message.part.updated",
    },
  };
}

async function persistToolOutcome(root, processedEvents, payload) {
  if (!payload) return null;
  if (processedEvents.has(payload.dedupeKey)) return null;

  processedEvents.add(payload.dedupeKey);
  const event = payload.event;

  await appendEpisode(root, event);
  const promotedPattern = await promoteAutoPattern(root, event);

  await writeWorkingFile(root, "last_tool_event.json", event);

  if (event.status === "error") {
    await writeWorkingFile(root, "last_error.json", event);
  }

  if (promotedPattern) {
    await writeWorkingFile(root, "last_promotion.json", promotedPattern);
  }

  await appendDiagnostic(root, {
    timestamp: new Date().toISOString(),
    type: "tool-outcome",
    dedupeKey: payload.dedupeKey,
    tool: event.tool,
    status: event.status,
    source_hook: event.source_hook,
  });

  return event;
}

export default async function SelfImprovingAgentPlugin({ directory }) {
  const root = path.join(directory, ...BASE_PATH_SEGMENTS);
  await ensureMemoryLayout(root);
  const processedToolEvents = new Set();

  return {
    async event(input) {
      try {
        if (input?.event?.type === "message.part.updated") {
          const payload = buildToolEventFromMessagePart(input.event.properties?.part);
          if (payload) {
            await persistToolOutcome(root, processedToolEvents, payload);
          }
        }

        if (input?.event?.type === "session.error") {
          await writeWorkingFile(root, "last_session_error.json", {
            timestamp: new Date().toISOString(),
            event: safeSerialize(input.event),
          });
        }
      } catch (error) {
        await appendDiagnostic(root, {
          timestamp: new Date().toISOString(),
          type: "hook-error",
          hook: "event",
          message: error instanceof Error ? error.message : String(error),
        });
      }
    },

    async "chat.message"(input, output) {
      try {
        await ensureMemoryLayout(root);

        const record = {
          id: `sess-${input.sessionID}`,
          timestamp: new Date().toISOString(),
          session_id: input.sessionID,
          agent: input.agent ?? null,
          model: input.model
            ? `${input.model.providerID}/${input.model.modelID}`
            : null,
          variant: input.variant ?? null,
          message_preview: extractText(output.parts),
        };

        await writeWorkingFile(root, "current_session.json", record);
        await appendDiagnostic(root, {
          timestamp: record.timestamp,
          type: "chat.message",
          session_id: input.sessionID,
        });
      } catch (error) {
        await appendDiagnostic(root, {
          timestamp: new Date().toISOString(),
          type: "hook-error",
          hook: "chat.message",
          message: error instanceof Error ? error.message : String(error),
        });
      }
    },

    async "tool.execute.before"(input, output) {
      try {
        await ensureMemoryLayout(root);

        const record = {
          id: `tool-${input.callID}`,
          timestamp: new Date().toISOString(),
          session_id: input.sessionID,
          call_id: input.callID,
          tool: input.tool,
          args: safeSerialize(output.args),
        };

        await writeWorkingFile(root, "last_tool_before.json", record);
        await appendDiagnostic(root, {
          timestamp: record.timestamp,
          type: "tool.execute.before",
          session_id: input.sessionID,
          call_id: input.callID,
          tool: input.tool,
        });
      } catch (error) {
        await appendDiagnostic(root, {
          timestamp: new Date().toISOString(),
          type: "hook-error",
          hook: "tool.execute.before",
          message: error instanceof Error ? error.message : String(error),
        });
      }
    },

    async "tool.execute.after"(input, output) {
      try {
        await ensureMemoryLayout(root);
        await persistToolOutcome(root, processedToolEvents, buildToolEventFromAfterHook(input, output));
      } catch (error) {
        await appendDiagnostic(root, {
          timestamp: new Date().toISOString(),
          type: "hook-error",
          hook: "tool.execute.after",
          message: error instanceof Error ? error.message : String(error),
        });
      }
    },

    async "command.execute.before"(input) {
      try {
        await ensureMemoryLayout(root);

        const record = {
          id: `cmd-${randomUUID()}`,
          timestamp: new Date().toISOString(),
          session_id: input.sessionID,
          command: input.command,
          arguments: input.arguments,
        };

        await writeWorkingFile(root, "last_command.json", record);
        await appendDiagnostic(root, {
          timestamp: record.timestamp,
          type: "command.execute.before",
          session_id: input.sessionID,
          command: input.command,
        });
      } catch (error) {
        await appendDiagnostic(root, {
          timestamp: new Date().toISOString(),
          type: "hook-error",
          hook: "command.execute.before",
          message: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}
