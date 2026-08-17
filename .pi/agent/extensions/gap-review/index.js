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
 * turn. Durability note: a detached reviewer that gets killed because the host
 * (CI/container) exited before it finishes leaves NO review behind; otherwise
 * the `.md` is the durable artifact. The `.input.md` is deleted by the runner
 * after the reviewer consumes it (D7) to keep the sensitive-data retention
 * surface tight.
 *
 * File paths come from `tool_call` events (read/write/edit only). Files created
 * or modified via `bash` are NOT captured (the bash tool's args are a command,
 * not a path) — a known blind spot. The original request is captured from the
 * FIRST `before_agent_start` of the turn (that event fires per agent-step, so
 * later steps must not overwrite the original user request). Captured file
 * paths are resolved absolute against `ctx.cwd` before being handed to the
 * reviewer (D5): the reviewer itself runs from the git root, so a relative
 * path captured from a subdir would otherwise resolve to the wrong file under
 * the reviewer.
 *
 * Env:
 *   PI_GAP_REVIEW=0          disable BOTH flavors (default: on)
 *   PI_GAP_MODEL             completeness reviewer model  (default deepseek/deepseek-v4-flash)
 *   PI_GAP_GROUNDING_MODEL   grounding reviewer model    (default deepseek/deepseek-v4-flash)
 *   PI_GAP_GROUNDING=0       disable grounding flavor only (default: on)
 *   PI_GAP_THINKING          reviewer thinking           (default low; shared by both flavors)
 *   PI_GAP_MIN_CHARS         min answer chars            (default 200)
 *   PI_GAP_RETAIN_DAYS       prune age (days)            (default 14)
 *   PI_GAP_TIMEOUT_MS        stale-reviewer reap         (default 300000 = 5 min)
 *
 * Two flavors share the engine (completeness + grounding):
 *   - completeness — fires on repo mutation; finds material omissions (OMISSIONS:).
 *   - grounding    — fires on every substantive terminal turn; grounds the answer's
 *                    factual claims about the code (GROUNDING:). See
 *                    docs/adr/0001-verification-two-layers.md for the two-layer split.
 */

import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
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
import { dirname, isAbsolute, join, resolve } from "node:path";

const DEFAULT_MODEL = "deepseek/deepseek-v4-flash";
const DEFAULT_GROUNDING_MODEL = "deepseek/deepseek-v4-flash";
const DEFAULT_THINKING = "low";
const DEFAULT_GROUNDING_THINKING = DEFAULT_THINKING; // reuse "low"; no new env
const DEFAULT_MIN_CHARS = 200;
const DEFAULT_RETAIN_DAYS = 14;
const DEFAULT_TIMEOUT_MS = 300000; // D4: reap a hung reviewer after 5 min
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

// Cheap git-porcelain-derived signature of repo state. The auto-review
// uses start-vs-end delta to detect worker mutation; the same comparison
// can produce zero diff for read-only turns, plain chat, and design
// analysis (those fall through to the manual /gap-review command).
// Mirrors the same shape used by .pi/agent/extensions/pi-subagents/
// src/watchdog/change-signature.ts so the comparison semantics agree.
const SIG_IGNORED_PREFIXES = [".pi-subagents/", "tmp/", "node_modules/"];
const SIG_IGNORED_NAMES = new Set([".pi-subagents", "tmp", "node_modules"]);

export function computeRepoChangeSignature(cwd) {
	const gitRoot = (() => {
		try {
			const out = spawnSync("git", ["-C", cwd, "rev-parse", "--show-toplevel"], {
				encoding: "utf8",
			});
			return out.status === 0 ? out.stdout.trim() : undefined;
		} catch {
			return undefined;
		}
	})();
	if (!gitRoot) return undefined;
	const status = (() => {
		try {
			const out = spawnSync(
				"git",
				["-C", gitRoot, "status", "--porcelain=v1", "-z", "--untracked-files=all"],
				{ encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
			);
			return out.status === 0 ? out.stdout : undefined;
		} catch {
			return undefined;
		}
	})();
	if (status == null) return undefined;
	const filtered = status
		.split("\0")
		.filter(Boolean)
		.filter((tok) => {
			if (tok.length < 4) return false;
			const p = tok.slice(3);
			if (SIG_IGNORED_NAMES.has(p)) return false;
			return !SIG_IGNORED_PREFIXES.some((pre) => p.startsWith(pre));
		})
		.sort()
		.join("\0");
	const key = createHash("sha256").update(filtered).digest("hex");
	return { root: gitRoot, key };
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

// Delete completed reviews older than `retainDays` (all their sibling files:
// .input.md, .md, .err, .done, .notified). Bounds growth of the review dir
// for always-on / unattended use. A review is prune-eligible when its marker
// file (`.notified` for interactive runs, `.done` for headless `pi -p` runs)
// is older than the cutoff. Headless runs never create `.notified`, so they
// were unbounded before D2 — this fix targets the unattended regime.
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
		let base, marker;
		if (n.endsWith(".notified")) {
			base = n.slice(0, -".notified".length);
			marker = ".notified";
		} else if (n.endsWith(".done")) {
			base = n.slice(0, -".done".length);
			marker = ".done";
		} else {
			continue;
		}
		let st;
		try {
			st = statSync(join(dir, base + marker));
		} catch {
			continue;
		}
		if (st.mtimeMs < cutoff) bases.add(base);
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

// Reap reviewers whose `.input.md` is older than `timeoutMs` and that have
// no `.done`/`.notified` sibling. Without this, a hung detached reviewer
// never finishes and pins `pendingCount` at `MAX_PENDING`, which silently
// disables the layer forever — fatal for unattended use. We mtime-check
// (not a shell `timeout`, which macOS lacks) so this is cross-platform and
// survives host restarts. Writing an ERROR `.md` + a `.done` marker frees
// the pending slot and surfaces the failure visibly on the next turn.
export function reapStaleReviews(dir, timeoutMs) {
	if (!existsSync(dir)) return 0;
	let names = [];
	try {
		names = readdirSync(dir);
	} catch {
		return 0;
	}
	const cutoff = Date.now() - timeoutMs;
	const finished = new Set();
	for (const n of names) {
		if (n.endsWith(".done")) finished.add(n.slice(0, -5));
		else if (n.endsWith(".notified"))
			finished.add(n.slice(0, -".notified".length));
	}
	let reaped = 0;
	for (const n of names) {
		if (!n.endsWith(".input.md")) continue;
		const base = n.slice(0, -".input.md".length);
		if (finished.has(base)) continue;
		let st;
		try {
			st = statSync(join(dir, n));
		} catch {
			continue;
		}
		if (st.mtimeMs >= cutoff) continue;
		try {
			writeFileSync(
				join(dir, `${base}.md`),
				`ERROR: gap-review reviewer timed out after ${timeoutMs}ms; no completion marker.\n`,
			);
		} catch {
			// non-fatal — keep going
		}
		try {
			writeFileSync(join(dir, `${base}.done`), "done");
		} catch {
			// non-fatal
		}
		reaped++;
	}
	return reaped;
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

// Grounding prompt — same shape as reviewPrompt (request block + TOUCHED FILES
// + FINAL ANSWER tail) so it slots into the same runner unchanged. The reviewer
// reads the actual files and tags each claim extracted from the FINAL ANSWER
// as Verified / Weakened / Falsified / Unsure. Used by the second flavor
// (grounding) that fires on every substantive terminal turn regardless of
// repo change. Distinct by design (per ADR 0001): completeness = omission
// scan; grounding = claim-truth scan. Do NOT collapse.
export function groundingPrompt(answer, files, request) {
	const reqBlock =
		request && request.trim()
			? ["", "ORIGINAL REQUEST:", request.trim(), ""]
			: [];
	return [
		"You are an adversarial grounding reviewer. Another agent produced the FINAL",
		"ANSWER below about THIS repository. Your job is NOT to judge completeness or",
		"style — it is to check whether the answer's factual claims about the code are",
		"TRUE against the actual files on disk.",
		"",
		"Do this:",
		"1. From the FINAL ANSWER text (and the TOUCHED / CITED FILES listed below),",
		"   extract the concrete, checkable claims the answer makes about THIS",
		"   repository — what a function does, where something is defined, how control",
		"   flows, what a value is, whether a behavior exists. Ignore opinions, plans,",
		"   and generic advice; extract only claims that can be checked by reading code.",
		"2. For each claim, READ the cited or relevant files with read/grep/find/ls.",
		"   Ground the claim in the actual source. Never trust the answer's paraphrase —",
		"   the code is your only witness.",
		"3. Tag each claim exactly one of:",
		"   - Verified  — the code confirms the claim (or the claim is broader / worse",
		"     than stated: say so and give the broader consequence).",
		"   - Weakened  — same direction but narrower than stated (e.g. a guard the claim",
		"     ignored).",
		"   - Falsified — the code does the opposite, the cited quote/symbol is absent,",
		"     or the claim's direction is wrong.",
		"   - Unsure    — you could not find evidence either way. Do NOT speculate;",
		"     prefer Unsure over guessing.",
		"",
		"Be adversarial and specific. Every row cites at least one file:line.",
		"",
		"FIRST LINE of your reply must be exactly one of:",
		"  GROUNDING: <count> issues   (count = number of Weakened + Falsified claims)",
		"  GROUNDING: clean            (no checkable claim found, or every claim Verified)",
		"Then a blank line, then one row per claim:",
		"  - <tag> | <file:line> | <claim> — <one-sentence justification>",
		...reqBlock,
		"TOUCHED / CITED FILES:",
		...files.map((f) => "- " + f),
		"",
		"FINAL ANSWER (the agent's answer to check):",
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
	'--model "$GR_MODEL" --thinking "$GR_THINKING" "$(cat "$GR_IN")"',
	'> "$GR_OUT" 2> "$GR_ERR"',
	"; rc=$?",
	'; if [ $rc -ne 0 ] || [ ! -s "$GR_OUT" ]; then',
	'  { echo "ERROR: gap-review reviewer failed (pi exit=$rc).";',
	'    echo "STDERR:"; cat "$GR_ERR" 2>/dev/null; } > "$GR_OUT"',
	"; fi",
	'; rm -f "$GR_ERR"',
	'; rm -f "$GR_IN"', // D7: drop .input.md after consumption to reduce retention surface
	'; printf done > "$GR_DONE"',
].join(" ");

// Decide + prepare everything for a single terminal-turn review EXCEPT the
// detached spawn itself (which is exercised in `turn_end` so it can stay
// wrapped in its own try/catch). Returns the spawn params object or `null`
// to skip. Pure-ish: takes `cwd` and `env` as inputs (so tests can drive it
// offline with a tmpdir + a stub process.env). Any throw here is the caller's
// problem — the wrap in `turn_end` swallows it so a FS error never disrupts
// the turn (D3).
export function prepareReview({
	message,
	files,
	request,
	cwd,
	env,
	allowEmptyFiles = false,
	kind = "completeness",
}) {
	const procEnv = env || process.env;
	// D5: resolved against `cwd` (the actor's cwd at turn_end), not against
	// `process.cwd()` — the detached reviewer runs from the git root.
	let absFiles = (files || []).map((f) =>
		isAbsolute(f) ? f : resolve(cwd || process.cwd(), f),
	);

	// Repo-mutation-only flow: when the caller has no per-file hook data
	// (Fusion worker mutations live inside child subprocesses), fall back to
	// the changed paths reported by `git status`. The signature diff is
	// checked at the call site; here we just supply a representative file
	// list when none was captured. Without a changed-paths list the
	// reviewer has nothing to anchor on. `allowEmptyFiles` (used by the
	// manual /gap-review command) skips this fallback so read-only
	// architecture / design turns can still be reviewed against the
	// capture-time files + the answer alone.
	if (absFiles.length === 0 && cwd && !allowEmptyFiles) {
		try {
			const gitRoot = (() => {
				const o = spawnSync("git", ["-C", cwd, "rev-parse", "--show-toplevel"], {
					encoding: "utf8",
				});
				return o.status === 0 ? o.stdout.trim() : undefined;
			})();
			if (gitRoot) {
				const o = spawnSync(
					"git",
					["-C", gitRoot, "status", "--porcelain=v1", "-z", "--untracked-files=all"],
					{ encoding: "utf8" },
				);
				if (o.status === 0) {
					const paths = o.stdout
						.split("\0")
						.filter(Boolean)
						.filter((tok) => {
							if (tok.length < 4) return false;
							const p = tok.slice(3);
							if (SIG_IGNORED_NAMES.has(p)) return false;
							return !SIG_IGNORED_PREFIXES.some((pre) => p.startsWith(pre));
						})
						.map((tok) => join(gitRoot, tok.slice(3)));
					if (paths.length > 0) {
						absFiles = absFiles.concat(paths);
					}
				}
			}
		} catch {
			// signature fallback failure: keep absFiles empty; prepareReview
			// returns null below and the caller skips the spawn.
		}
	}
	if (!allowEmptyFiles && absFiles.length === 0) return null;
	if (!message || !isTerminal(message)) return null;
	const root = findProjectRoot(cwd);
	const dir = join(root, REVIEW_DIRNAME);
	const answer = answerText(message);
	const minChars = Number(procEnv.PI_GAP_MIN_CHARS || DEFAULT_MIN_CHARS);
	if (answer.length < minChars) return null;
	mkdirSync(dir, { recursive: true });
	pruneOldReviews(
		dir,
		Number(procEnv.PI_GAP_RETAIN_DAYS || DEFAULT_RETAIN_DAYS),
	);
	reapStaleReviews(dir, Number(procEnv.PI_GAP_TIMEOUT_MS || DEFAULT_TIMEOUT_MS));
	if (pendingCount(dir) >= MAX_PENDING) return null;
	// Base uniqueness across flavors: -c for completeness, -g for grounding.
	// Two flavors firing in the same millisecond get distinct suffixed bases
	// so the .done check downstream cannot collide. The runner, prune/reap/
	// pendingCount all match on the suffixes BEFORE -c/-g, so adding the
	// flavor suffix here is the only change needed for them to keep working.
	const suffix = kind === "grounding" ? "g" : "c";
	const base = join(dir, `${Date.now()}-${suffix}`);
	if (existsSync(`${base}.done`) || existsSync(`${base}.notified`)) return null;
	const inFile = `${base}.input.md`;
	const outFile = `${base}.md`;
	const errFile = `${base}.err`;
	const doneFile = `${base}.done`;
	const prompt =
		kind === "grounding"
			? groundingPrompt(answer, absFiles, request)
			: reviewPrompt(answer, absFiles, request);
	writeFileSync(inFile, prompt);
	const model =
		kind === "grounding"
			? procEnv.PI_GAP_GROUNDING_MODEL || DEFAULT_GROUNDING_MODEL
			: procEnv.PI_GAP_MODEL || DEFAULT_MODEL;
	const reviewEnv = {
		...procEnv,
		GR_MODEL: model,
		GR_THINKING: procEnv.PI_GAP_THINKING || DEFAULT_THINKING,
		GR_IN: inFile,
		GR_OUT: outFile,
		GR_ERR: errFile,
		GR_DONE: doneFile,
	};
	return { root, inFile, outFile, errFile, doneFile, env: reviewEnv };
}

export default function gapReviewExtension(pi) {
	const enabled = () => process.env.PI_GAP_REVIEW !== "0";

	// Per-user-turn state. Cleared together at the terminal `turn_end` (D6):
	// `currentRequest` so the NEXT user turn's before_agent_start captures
	// fresh, `turnFiles` so the next turn accumulates from zero.
	let currentRequest = "";
	const turnFiles = new Set();
	let startSigKey; // git porcelain key captured at turn_start
	let startSigRoot;

	// Latest non-trivial terminal-turn candidate retained for one revision so
	// the manual /gap-review command can re-review read-only architecture /
	// design turns after the user asked.
	let lastCandidate;

	function spawnReviewFor(params) {
		try {
			const child = spawn("sh", ["-c", RUNNER_SCRIPT], {
				env: params.env,
				detached: true,
				stdio: "ignore",
				cwd: params.root,
			});
			child.unref();
		} catch {
			// spawn failure is non-fatal — the turn already completed.
		}
	}

	pi.on("before_agent_start", (event) => {
		// Capture the original request: only the FIRST before_agent_start of a
		// turn carries the user's prompt (later per-agent-step fires — retries,
		// follow-ups — would overwrite it with a non-user prompt and cause the
		// reviewer to be judged against the wrong request, D6). turnFiles is
		// accumulated across the whole turn and cleared at the terminal turn_end.
		if (currentRequest) return;
		currentRequest = (event && event.prompt) || "";
	});

	pi.on("tool_call", (event) => {
		if (!enabled()) return;
		const p = extractFilePath(event && event.toolName, event && event.input);
		if (p) turnFiles.add(p);
	});

	pi.on("turn_start", async (_event, ctx) => {
		// Snapshot the repo change signature so the terminal turn_end can
		// detect worker mutation that happened via child subprocess (Fusion's
		// default — parent is read-only, worker writes). Outside git the
		// signature is undefined and the gate degrades to the legacy file-path
		// check only (legacy non-Fusion with parent write tools).
		const sig = computeRepoChangeSignature(ctx && ctx.cwd);
		startSigKey = sig ? sig.key : undefined;
		startSigRoot = sig ? sig.root : undefined;

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
			// Fallback default is per-flavor (the .md first line / sentinel
			// usually overrides it; this is only for unreadable/missing .md).
			// The base suffix identifies the flavor: -g = grounding, anything
			// else (legacy -c, or unsuffixed) = completeness.
			let headline = base.endsWith("-g")
				? "grounding review ready"
				: "completeness review ready";
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

	pi.on("turn_end", async (event, ctx) => {
		if (!enabled()) return;
		const message = event && event.message;
		if (!message || !isTerminal(message)) return; // only final answers

		// pi fires turn_end per assistant step, so a tool step (turnIndex N) and
		// the terminal answer (turnIndex N+1) are separate events. Consume +
		// clear here so files accumulated across the whole user turn are reviewed
		// with the final answer. currentRequest is cleared in lockstep (D6) so
		// the next user-turn's before_agent_start captures fresh.
		const files = [...turnFiles];
		const request = currentRequest;
		const answer = answerText(message);
		const minChars = Number(process.env.PI_GAP_MIN_CHARS || DEFAULT_MIN_CHARS);
		turnFiles.clear();
		currentRequest = "";

		// Decide whether the AUTOMATIC review should fire. Trigger only on
		// repo state change during the turn (worker mutation signature, OR
		// legacy parent direct write via tool_call) — never on plain chat /
		// design / read-only turns.
		let repoChanged = false;
		try {
			const endSig = computeRepoChangeSignature(ctx && ctx.cwd);
			if (startSigKey !== undefined && endSig) {
				repoChanged = endSig.key !== startSigKey;
			} else if (files.length > 0 && startSigKey === undefined) {
				// Outside git: fall back to the legacy file-path trigger so
				// non-Fusion / non-repo sessions still get reviewed.
				repoChanged = true;
			}
		} catch {
			// signature failure: don't break the turn
		}
		const shouldAutoReview = repoChanged && answer.length >= minChars;
		// Grounding flavor: fires on every substantive terminal turn
		// regardless of repo change. The completeness gate is unchanged
		// (still repo-changed only); grounding is its own independent
		// branch. Both flavors may fire on the same turn — they are
		// separate prompts, models, and artifacts (…-c.* vs …-g.*).
		const groundingOn = process.env.PI_GAP_GROUNDING !== "0";
		const substantive = answer.length >= minChars;

		// Retain the latest candidate for manual /gap-review invocation
		// regardless of whether the automatic review fired. Stashing the
		// candidate after terminal turn_end lets a user ask "now review my
		// read-only architecture analysis" without rerunning the whole turn.
		if (request && request.trim() && answer.length >= minChars) {
			const cwdAbs = ctx && ctx.cwd ? ctx.cwd : process.cwd();
			const absFiles = files.map((f) => (isAbsolute(f) ? f : resolve(cwdAbs, f)));
			lastCandidate = {
				request: request,
				answer,
				files: absFiles,
				root: startSigRoot || cwdAbs,
			};
		}

		// Completeness flavor — unchanged condition (repo changed this turn).
		if (shouldAutoReview) {
			let params;
			try {
				// prepareReview can throw (mkdir / writeFile on a read-only root or
				// a parent-is-a-file blocker, full disk, etc.). Wrap the whole
				// decide-and-prepare phase in ONE try/catch so nothing leaks into
				// pi's turn_end dispatcher — the turn has already completed (D3).
				params = prepareReview({
					message,
					files,
					request,
					cwd: ctx && ctx.cwd,
					env: process.env,
					kind: "completeness",
				});
			} catch {
				params = null;
			}
			if (params) spawnReviewFor(params);
		}

		// Grounding flavor — fires on every substantive terminal turn, repo
		// change or not. allowEmptyFiles: true so a read-only analysis turn
		// (no file_write captured, but files were read) is not rejected by
		// the empty-files gate and does not trigger the git-status fallback
		// (we want the capture-time files + the answer, not noisy
		// unrelated diffs). The grounding reviewer still has read/grep/
		// find/ls to anchor on.
		if (groundingOn && substantive) {
			let gparams;
			try {
				gparams = prepareReview({
					message,
					files,
					request,
					cwd: ctx && ctx.cwd,
					env: process.env,
					kind: "grounding",
					allowEmptyFiles: true,
				});
			} catch {
				gparams = null;
			}
			if (gparams) spawnReviewFor(gparams);
		}
	});

	// Manual /gap-review command. Replay the latest retained candidate
	// (read-only architecture / design analysis, a turn that did not mutate
	// anything). Notifies plainly when there is nothing eligible.
	pi.registerCommand("gap-review", {
		description:
			"Review the latest non-trivial turn for completeness (manual trigger; auto only fires on repo mutation).",
		handler: async (_args, ctx) => {
			if (!enabled()) {
				if (ctx.hasUI)
					ctx.ui.notify("gap-review: disabled (PI_GAP_REVIEW=0)", "info");
				return;
			}
			if (!lastCandidate) {
				if (ctx.hasUI)
					ctx.ui.notify(
						"gap-review: no eligible latest turn (answer < min chars or no request captured yet)",
						"info",
					);
				return;
			}
			const cwd = ctx.cwd || lastCandidate.root;
			// For the manual trigger, low the size gate: the user explicitly asked,
			// so don't reject for short answers. We still enforce answer>=1 char
			// (otherwise there is nothing to review).
			if (!lastCandidate.answer || lastCandidate.answer.length < 1) {
				if (ctx.hasUI)
					ctx.ui.notify("gap-review: latest candidate is empty", "info");
				return;
			}
			const params = prepareReview({
				message: { role: "assistant", content: lastCandidate.answer },
				files: lastCandidate.files,
				request: lastCandidate.request,
				cwd,
				env: process.env,
				allowEmptyFiles: true,
			});
			if (!params) {
				if (ctx.hasUI)
					ctx.ui.notify(
						"gap-review: latest candidate not eligible (no files / no git context to anchor the review on)",
						"info",
					);
				return;
			}
			spawnReviewFor(params);
			if (ctx.hasUI) ctx.ui.notify("gap-review: manual review launched", "info");
		},
	});
}
