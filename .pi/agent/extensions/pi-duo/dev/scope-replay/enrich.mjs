// Bridge: build the scope-gate evidence transcript for one session turn using
// the REAL duo-core.ts functions (enrichment + project-instructions extraction),
// so the replay harness tests shipped code rather than Python fakes.
//
// Usage: node enrich.mjs <session.jsonl> <turnIndex> <cutAfterSteps> [conventionsFile]
// Emits JSON: { req, conventions, transcript, steps }
import { readFileSync } from "node:fs";
import {
	textFromMessage,
	extractProjectInstructions,
} from "../../src/duo-core.ts";

const [session, turnIdxRaw, cutRaw, conventionsFile] = process.argv.slice(2);
const turnIdx = Number(turnIdxRaw);
const cut = Number(cutRaw);

const lines = readFileSync(session, "utf8")
	.split("\n")
	.filter((l) => l.trim())
	.map((l) => JSON.parse(l));

// Extract user turns (message role === user).
const msgs = lines.map((o) => o.message).filter(Boolean);
const userIdxs = [];
msgs.forEach((m, i) => {
	if (m.role === "user") userIdxs.push(i);
});
const start = userIdxs[turnIdx];
const end = turnIdx + 1 < userIdxs.length ? userIdxs[turnIdx + 1] : msgs.length;

const req = textFromMessage(msgs[start], {});

// Enriched evidence: thinking + tool args surfaced, tool results included.
const ev = [];
let steps = 0;
for (let i = start + 1; i < end; i++) {
	const m = msgs[i];
	if (m.role === "assistant") {
		steps++;
		if (steps > cut) break;
		const text = textFromMessage(m, {
			includeToolCalls: true,
			includeToolArgs: true,
			includeThinking: true,
			maxToolArgChars: 200,
		});
		if (text.trim()) ev.push(`### actor step ${steps}\n${text}`);
	} else if (m.role === "toolResult" || m.toolName || m.name) {
		const text = textFromMessage(m, {
			includeToolResults: true,
			maxToolResultChars: 400,
		});
		if (text.trim()) ev.push(text);
	}
}

// Conventions: from an explicit file if given, else extracted from the
// session's OWN cross-agent-guidance message — the exact <project_instructions>
// text pi assembled for that run, frozen at run time (immune to later file
// drift). This is the faithful runtime source; a file arg is a manual override.
let conventions = "";
if (conventionsFile) {
	const raw = readFileSync(conventionsFile, "utf8");
	const wrapped = `<project_instructions path="${conventionsFile}">\n${raw}\n</project_instructions>`;
	conventions = extractProjectInstructions(wrapped);
} else {
	const guidance = lines.find(
		(o) => o.customType === "cross-agent-guidance" && typeof o.content === "string",
	);
	if (guidance) conventions = extractProjectInstructions(guidance.content);
}

process.stdout.write(
	JSON.stringify({ req, conventions, transcript: ev.join("\n\n"), steps }),
);
