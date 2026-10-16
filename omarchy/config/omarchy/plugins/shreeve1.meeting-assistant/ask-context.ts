import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";

const CARDS_ENV = "MEETING_ASSISTANT_CARDS_FILE";
const MESSAGE_TYPE = "meeting-assistant-cards";

interface Entry {
  id: string;
  text: string;
  body: string;
}

// The helper appends one entry per send that has cards; this side only reads them and records delivered ids in `<file>.sent`.
function readEntries(path: string): Entry[] {
  if (!existsSync(path)) return [];
  const raw = readFileSync(path, "utf8");
  if (raw.trim() === "") return [];
  const data: unknown = JSON.parse(raw);
  if (
    typeof data !== "object" ||
    data === null ||
    !("entries" in data) ||
    !Array.isArray(data.entries)
  )
    return [];
  const entries: Entry[] = [];
  for (const item of data.entries as unknown[]) {
    if (typeof item !== "object" || item === null) continue;
    const { id, text, header, cards } = item as Record<string, unknown>;
    if (
      typeof id !== "string" ||
      typeof text !== "string" ||
      typeof header !== "string"
    )
      continue;
    if (
      !Array.isArray(cards) ||
      cards.length === 0 ||
      !cards.every((c: unknown) => typeof c === "string")
    )
      continue;
    entries.push({
      id,
      text,
      body: `${header}\n<untrusted-cards>\n${cards.join("\n")}\n</untrusted-cards>`,
    });
  }
  return entries;
}

function readSent(path: string): string[] {
  try {
    if (!existsSync(path)) return [];
    const data: unknown = JSON.parse(readFileSync(path, "utf8"));
    return Array.isArray(data)
      ? data.filter((id: unknown): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

// A batch dequeued from the follow-up queue joins its texts with a blank line; a text matches when it is one of those parts.
function pick(unsent: Entry[], prompt: string): Entry | undefined {
  const exact = unsent.find((e) => e.text === prompt);
  if (exact) return exact;
  const part = unsent.find((e) =>
    `\n\n${prompt}\n\n`.includes(`\n\n${e.text}\n\n`),
  );
  if (part) return part;
  if (prompt.startsWith("/") && unsent.length === 1) return unsent[0];
  return undefined;
}

export default function askContext(pi: ExtensionAPI) {
  let offered: string | undefined;
  const published = new Set<string>();

  pi.registerCommand("meeting-assistant-ask-context", {
    description:
      "Marker: the Meeting Assistant ask-context extension is loaded",
    handler: async () => {},
  });

  pi.on("before_agent_start", async (event) => {
    const path = process.env[CARDS_ENV];
    if (!path) return;
    let entry: Entry | undefined;
    try {
      const sent = new Set(readSent(`${path}.sent`));
      const unsent = readEntries(path).filter(
        (e) => !sent.has(e.id) && !published.has(e.id),
      );
      entry = pick(unsent, event.prompt);
    } catch (err) {
      pi.logger.warn("meeting-assistant ask-context: cards file unreadable", {
        err: String(err),
      });
      return;
    }
    if (!entry) return;
    offered = entry.id;
    return {
      message: {
        customType: MESSAGE_TYPE,
        content: entry.body,
        display: false,
      },
    };
  });

  // A follow-up batch dequeued inside the same run fires before_agent_start before agent_end, so in-run dedupe needs the published set.
  pi.on("message_end", async (event) => {
    const message = event.message;
    if (
      message.role === "custom" &&
      message.customType === MESSAGE_TYPE &&
      offered !== undefined
    ) {
      published.add(offered);
      offered = undefined;
    }
  });

  pi.on("agent_end", async (event) => {
    if ("willContinue" in event && event.willContinue === true) return;
    const path = process.env[CARDS_ENV];
    if (!path || published.size === 0) return;
    const file = `${path}.sent`;
    const ids = new Set(readSent(file));
    if ([...published].every((id) => ids.has(id))) return;
    for (const id of published) ids.add(id);
    try {
      writeFileSync(`${file}.tmp`, JSON.stringify([...ids]), { mode: 0o600 });
      renameSync(`${file}.tmp`, file);
    } catch (err) {
      pi.logger.warn(
        "meeting-assistant ask-context: cannot write sent marker",
        { err: String(err) },
      );
    }
  });
}
