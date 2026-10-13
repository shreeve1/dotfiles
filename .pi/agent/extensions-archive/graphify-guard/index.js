/**
 * graphify-guard — Pi equivalent of graphify's Claude Code PreToolUse hook.
 *
 * graphify's `graphify claude install` registers a PreToolUse hook that, when
 * `graphify-out/graph.json` exists, injects a "query the graph before you grep
 * or read raw files" nudge into every Bash-search / Read / Glob tool call.
 *
 * Pi has no per-tool context-injection channel (ToolCallEventResult only carries
 * block/reason), so the faithful, non-hostile equivalent is a system-prompt
 * injection via `before_agent_start` — the same always-on mechanism ponytail
 * uses. It is gated on a graph existing: no graphify-out/graph.json in the
 * project → silent no-op, exactly like the Claude hook.
 */

import { existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";

// Walk up from cwd to the nearest .git; fall back to cwd. Mirrors the
// project-root discovery harness-gates uses so the check works from subdirs.
export function findProjectRoot(cwd) {
	let dir = resolve(cwd || process.cwd());
	const stop = dirname(dir);
	while (true) {
		if (existsSync(join(dir, ".git"))) return dir;
		if (dir === stop) return resolve(cwd || process.cwd());
		dir = dirname(dir);
	}
}

export function hasGraph(projectRoot) {
	return existsSync(join(projectRoot, "graphify-out", "graph.json"));
}

const GUIDANCE = [
	"## graphify knowledge graph is available",
	"",
	"This project has a graphify knowledge graph (`graphify-out/graph.json`).",
	"Before grepping or reading raw source files to understand the codebase,",
	"query the graph first — it is faster and already resolves cross-file links:",
	"",
	'- `graphify query "<question>"` — scoped subgraph for a plain-language question',
	'- `graphify explain "<concept>"` — one node and its neighbors',
	'- `graphify path "<A>" "<B>"` — how two things connect',
	"",
	"Only read/grep raw files after graphify has oriented you, or to modify or",
	"debug specific lines. This applies to subagents too — include it in every",
	"subagent prompt involving code exploration.",
].join("\n");

export default function graphifyGuardExtension(pi) {
	pi.on("before_agent_start", async (event, ctx) => {
		const projectRoot = findProjectRoot(ctx?.cwd);
		if (!hasGraph(projectRoot)) return undefined;
		return { systemPrompt: `${event.systemPrompt}\n\n${GUIDANCE}` };
	});
}
