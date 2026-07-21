/**
 * gap-review — automatic completeness review at turn end (Pi extension).
 *
 * Companion to pi-duo. pi-duo is the GROUNDING gate: it catches answers with
 * false or unsupported claims. It cannot catch COMPLETENESS failures — material
 * behaviors the work omits — because its verifier prompt explicitly says "do not
 * demand extra work beyond the user's request". See
 * docs/adr/0001-verification-two-layers.md.
 *
 * At each TERMINAL turn (a final text answer, not a mid-loop tool step) that is
 * non-trivial and touched files, this extension spawns a DETACHED, fresh
 * `pi -p` reviewer (deepseek-v4-flash, read-only tools, --no-extensions/
 * --no-skills/--no-session so it carries none of the actor's framing and cannot
 * recurse into this extension) and asks: "what does the work MISS relative to
 * the original request?" It writes a review file and, on the next turn, notifies
 * the user (interactive only; automated / no-UI runs get the file silently).
 *
 * This is an asynchronous AUDIT, not an acceptance gate: it never blocks the
 * turn, and a detached reviewer can be killed if the host (CI/container) exits
 * before it finishes — the review file is the durable artifact either way.
 *
 * File paths come from `tool_call` events (read/write/edit only). Files created
 * or modified via `bash` are NOT captured (the bash tool's args are a command,
 * not a path) — a known blind spot. The original request is captured from
 * `before_agent_start` (event.prompt).
 *
 * Env:
 *   PI_GAP_REVIEW=0    disable (default: on)
 *   PI_GAP_MODEL        reviewer model        (default deepseek/deepseek-v4-flash)
 *   PI_GAP_THINKING     reviewer thinking     (default low)
 *   PI_GAP_MIN_CHARS    min answer chars      (default 200)
 */

import { spawn } from "node:child_process";
import {
	existsSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	renameSync,
	statSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";

const DEFAULT_MODEL = "deepseek/deepseek-v4-flash";
const DEFAULT_THINKING = "low";
const DEFAULT_MIN_CHARS = 200;
const DEFAULT_RETAIN_DAYS = 14;
const REVIEW_DIRNAME = ".gap-reviews";
const MAX_PENDING = 3; // backpressure: don't pile up detached reviewers
const FILE_TOOLS = new Set(["read", "write", "edit"]);

// Walk up to the nearest .git; fall back to cwd. Mirrors graphify-guard so the
// review dir lands at the project root even from subdirs.
export function findProjectRoot(cwd) {
	let dir = resolve(cwd || process.cwd());
	const stop = dirname(dir);
	while (true) {
		if (existsSync(join(dir, ".git"))) return dir;
		if (dir === stop) return resolve(cwd || process.cwd());
		dir = dirname(dir);
	}
}

// A turn is terminal when its final assistant message carries no tool calls.
// pi content block type is "toolCall" (pi-ai ToolCall: { type, name, arguments }).
export function isTerminal(message) {
	const c = message && message.content;
	if (Array.isArray(c)) return !c.some((b) => b && b.type === "toolCall");
	return typeof c === "string"; // plain-string content is a final answer
}

export function answerText(message) {
	const c = message && message.content;
	if (typeof c === "string") return c.trim();
	if (!Array.isArray(c)) return "";
	return c
		.filter((b) => b && b.type === "text")
		.map((b) => b.text || "")
		.join("\n")
		.trim();
}

// Extract a file path from a tool-call event, or null if it is not a
// file-bearing tool. `input` is the tool's argument object (pi ToolCallEvent).
// `path` is tolerated as an alias (the read tool reports `path`, not file_path).
export function extractFilePath(toolName, input) {
	if (!FILE_TOOLS.has(toolName)) return null;
	const arg = input && typeof input === "object" ? input : {};
	const p = arg.file_path || arg.path;
	return typeof p === "string" && p.length ? p : null;
}

// Count spawned-but-not-finished reviewers. A review is "finished" once it has
// EITHER a .done (completed, not yet notified) OR a .notified (completed and
// surfaced). Counting only .done (and not .notified) would re-count every
// notified review as pending and deadlock the extension after MAX_PENDING.
export function pendingCount(dir) {
	if (!existsSync(dir)) return 0;
	let names = [];
	try {
		names = readdirSync(dir);
	} catch {
		return 0;
	}
	const finished = new Set();
	for (const n of names) {
		if (n.endsWith(".done")) finished.add(n.slice(0, -5));
		else if (n.endsWith(".notified"))
			finished.add(n.slice(0, -".notified".length));
	}
	return names
		.filter((n) => n.endsWith(".input.md"))
		.filter((n) => !finished.has(n.slice(0, -".input.md".length))).length;
}

// Delete completed-and-notified reviews older than `retainDays` (all their
// sibling files: .input.md, .md, .err, .done, .notified). Bounds growth of the
// review dir for always-on / unattended use. Only prunes .notified (already
// surfaced) reviews — never a pending or unnotified one.
export function pruneOldReviews(dir, retainDays) {
	if (!existsSync(dir)) return 0;
	let names = [];
	try {
		names = readdirSync(dir);
	} catch {
		return 0;
	}
	const cutoff = Date.now() - retainDays * 86400000;
	const bases = new Set();
	for (const n of names) {
		if (!n.endsWith(".notified")) continue;
		const p = join(dir, n);
		let st;
		try {
			st = statSync(p);
		} catch {
			continue;
		}
		if (st.mtimeMs < cutoff) bases.add(n.slice(0, -".notified".length));
	}
	for (const base of bases) {
		for (const ext of [".input.md", ".md", ".err", ".done", ".notified"]) {
			try {
				unlinkSync(join(dir, base + ext));
			} catch {
				// already gone — fine
			}
		}
	}
	return bases.size;
}

export function reviewPrompt(answer, files, request) {
	const reqBlock =
		request && request.trim()
			? ["", "ORIGINAL REQUEST:", request.trim(), ""]
			: [];
	return [
		"You are a completeness reviewer. Another agent did the work described below.",
		"Read the ACTUAL files on disk — do not trust the answer. Judge the work",
		"relative to the ORIGINAL REQUEST: what MATERIAL thing does the implemented",
		"work MISS? Real requirements, behaviors, edge cases, error handling, or",
		"conditions the request implies but the work does not address. Do not check",
		"style, do not invent issues, and cite file:line for each finding. If the work",
		"fully addresses the request, say so.",
		"",
		"FIRST LINE of your reply must be exactly one of:",
		"  OMISSIONS: <count> (<short gist>)",
		"  OMISSIONS: none",
		"Then a blank line, then each omission as: - <file:line> <what is missing>",
		...reqBlock,
		"TOUCHED FILES:",
		...files.map((f) => "- " + f),
		"",
		"FINAL ANSWER (the agent's summary of its work):",
		answer,
	].join("\n");
}

// Detached wrapper: runs the reviewer, captures stdout to the review file and
// stderr to a temp; on non-zero exit OR empty output, overwrites the review file
// with a visible ERROR line (so a failed reviewer is never silently reported as
// a successful empty review). All variable parts are passed via env (GR_*) so
// the answer text — which may contain quotes, backticks, $, etc. — is read via
// `cat` and never re-parsed by the shell.
const RUNNER_SCRIPT = [
	"pi -p --no-extensions --no-skills --no-session --tools read,grep,find,ls",
	'--model "$GR_MODEL" --thinking "$GR_THINK" "$(cat "$GR_IN")"',
	'> "$GR_OUT" 2> "$GR_ERR"',
	"; rc=$?",
	'; if [ $rc -ne 0 ] || [ ! -s "$GR_OUT" ]; then',
	'  { echo "ERROR: gap-review reviewer failed (pi exit=$rc).";',
	'    echo "STDERR:"; cat "$GR_ERR" 2>/dev/null; } > "$GR_OUT"',
	"; fi",
	'; rm -f "$GR_ERR"',
	'; printf done > "$GR_DONE"',
].join(" ");

export default function gapReviewExtension(pi) {
	const enabled = () => process.env.PI_GAP_REVIEW !== "0";

	// Per-user-turn state. Reset at before_agent_start (reliable user-turn
	// boundary); turnFiles also cleared after the terminal turn_end consumes it.
	let currentRequest = "";
	const turnFiles = new Set();

	pi.on("before_agent_start", (event) => {
		// Capture the original request. NOTE: this event fires per agent-step,
		// not per user-turn, so we must NOT clear turnFiles here — doing so wipes
		// files accumulated during the tool step before the terminal turn_end
		// consumes them. turnFiles is cleared only at the terminal turn_end.
		currentRequest = (event && event.prompt) || "";
	});

	pi.on("tool_call", (event) => {
		if (!enabled()) return;
		const p = extractFilePath(event && event.toolName, event && event.input);
		if (p) turnFiles.add(p);
	});

	pi.on("turn_end", async (event, ctx) => {
		if (!enabled()) return;
		const message = event && event.message;
		if (!message || !isTerminal(message)) return; // only final answers

		const root = findProjectRoot(ctx && ctx.cwd);
		const dir = join(root, REVIEW_DIRNAME);

		// pi fires turn_end per assistant step, so a tool step (turnIndex N) and
		// the terminal answer (turnIndex N+1) are separate events. Consume +
		// clear here so files accumulated across the whole user turn are reviewed
		// with the final answer.
		const files = [...turnFiles];
		turnFiles.clear();
		if (files.length === 0) return; // nothing to check the work against

		const answer = answerText(message);
		const minChars = Number(process.env.PI_GAP_MIN_CHARS || DEFAULT_MIN_CHARS);
		if (answer.length < minChars) return; // trivial turn

		mkdirSync(dir, { recursive: true });
		pruneOldReviews(
			dir,
			Number(process.env.PI_GAP_RETAIN_DAYS || DEFAULT_RETAIN_DAYS),
		);
		if (pendingCount(dir) >= MAX_PENDING) return; // backpressure

		const base = join(
			dir,
			`${event.turnIndex != null ? event.turnIndex : "t"}-${Date.now()}`,
		);
		if (existsSync(`${base}.done`) || existsSync(`${base}.notified`)) return;

		const inFile = `${base}.input.md`;
		const outFile = `${base}.md`;
		const errFile = `${base}.err`;
		const doneFile = `${base}.done`;
		writeFileSync(inFile, reviewPrompt(answer, files, currentRequest));

		const env = {
			...process.env,
			GR_MODEL: process.env.PI_GAP_MODEL || DEFAULT_MODEL,
			GR_THINKING: process.env.PI_GAP_THINKING || DEFAULT_THINKING,
			GR_IN: inFile,
			GR_OUT: outFile,
			GR_ERR: errFile,
			GR_DONE: doneFile,
		};
		try {
			const child = spawn("sh", ["-c", RUNNER_SCRIPT], {
				env,
				detached: true,
				stdio: "ignore",
				cwd: root,
			});
			child.unref();
		} catch {
			// spawn failure is non-fatal — the turn already completed.
		}
	});

	pi.on("turn_start", async (_event, ctx) => {
		// Surface any completed reviews from prior turns (interactive only).
		// Automated / no-UI runs get the review file silently.
		if (!enabled() || !ctx || !ctx.hasUI) return;
		const dir = join(findProjectRoot(ctx.cwd), REVIEW_DIRNAME);
		let names = [];
		try {
			names = readdirSync(dir);
		} catch {
			return;
		}
		for (const name of names) {
			if (!name.endsWith(".done")) continue;
			const base = name.slice(0, -".done".length);
			let headline = "completeness review ready";
			try {
				const first = (
					readFileSync(join(dir, `${base}.md`), "utf8").split("\n")[0] || ""
				).trim();
				if (first) headline = first;
			} catch {
				// leave default headline
			}
			try {
				ctx.ui.notify(`gap review: ${headline}`, "info");
				renameSync(join(dir, name), join(dir, `${base}.notified`));
			} catch {
				// notify/rename failure is non-fatal
			}
		}
	});
}
