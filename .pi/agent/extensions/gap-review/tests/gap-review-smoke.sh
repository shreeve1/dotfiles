#!/usr/bin/env bash
# gap-review-smoke.sh — behavioral smoke for the gap-review Pi extension.
#
# Tests the pure decision logic offline (no model, no network, no real pi):
#   (1)  node --check + required exports/handlers present
#   (2)  isTerminal: text-only answer -> true; tool_use present -> false
#   (3)  answerText: extracts text from content blocks
#   (4)  extractFilePath: read/write/edit file_paths, ignores other tools
#   (5)  pendingCount: counts spawned-but-not-finished reviewers
#   (5b) pruneOldReviews: ages out old .notified + siblings, keeps recent
#   (5c) pruneOldReviews: ages out old .done-only (D2 headless) reviews
#   (6)  reviewPrompt shape (request-relative)
#   (7)  reapStaleReviews: reaps an old .input.md (D4)
#   (8)  handler harness drives prepareReview indirectly (Wave 0)
#        - D3: turn_end does not throw on unwritable cwd
#        - D5: relative file path is resolved absolute in the prompt
#        - D6: currentRequest captured once per turn, cleared at terminal turn_end
#   (9)  D1: every $GR_<X> token in the runner script has a matching GR_<X>
#        env key produced by prepareReview (catches the GR_THINK vs GR_THINKING
#        spelling drift).
#
# Does NOT exercise the live spawn (that needs a real pi turn + model); this
# only guarantees the gating logic that decides whether to spawn is correct.

set -u
script_dir=$(cd "$(dirname "$0")" && pwd)
ext="$script_dir/../index.js"

[ -f "$ext" ] || {
	echo "FAIL: extension not found at $ext" >&2
	exit 1
}

# --- (1) static checks ---------------------------------------------------
node --check "$ext" || {
	echo "FAIL: node --check" >&2
	exit 1
}
for sym in isTerminal answerText extractFilePath pendingCount pruneOldReviews reapStaleReviews findProjectRoot reviewPrompt prepareReview \
	'pi.on("turn_end"' 'pi.on("turn_start"' 'pi.on("tool_call"' 'pi.on("before_agent_start"' \
	'rm -f "$GR_IN"' '$GR_THINKING'; do
	grep -qF "$sym" "$ext" || {
		echo "FAIL: missing $sym" >&2
		exit 1
	}
done
echo "OK:   static checks (node --check + exports/handlers)"

# --- driver ---------------------------------------------------------------
repo=$(mktemp -d)
trap 'rm -rf "$repo"' EXIT
cd "$repo" || exit 1
git init -q -b main 2>/dev/null || git init -q

driver=$(mktemp --suffix=.mjs)
ext_url="file://$ext"
# Quoted heredoc so backslashes survive verbatim into the JS source (we need
# \$GR_ in the regex literal — without the quoting, bash eats the backslash).
cat >"$driver" <<'DRIVER_EOF'
import * as gap from "__EXT_URL__";

let fail = 0;
const ok = (name) => console.log("OK:   " + name);
const check = (name, cond) => {
	if (cond) ok(name); else { console.log("FAIL: " + name); fail++; }
};

import {
	mkdtempSync, mkdirSync, writeFileSync, readFileSync,
	readdirSync, utimesSync, existsSync as pathExists,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// (2) isTerminal
check("isTerminal: text-only -> true",
	gap.isTerminal({ content: [{ type: "text", text: "done" }] }) === true);
check("isTerminal: toolCall present -> false",
	gap.isTerminal({ content: [{ type: "toolCall", name: "read", arguments: {} }] }) === false);
check("isTerminal: plain string content -> true",
	gap.isTerminal({ content: "plain answer" }) === true);

// (3) answerText
check("answerText: joins text blocks",
	gap.answerText({ content: [
		{ type: "text", text: "a" }, { type: "toolCall", name: "x" }, { type: "text", text: "b" },
	] }) === "a\nb");

// (4) extractFilePath — the file-path source for the accumulator
check("extractFilePath: read -> file_path",
	gap.extractFilePath("read", { file_path: "/a.py" }) === "/a.py");
check("extractFilePath: write -> file_path",
	gap.extractFilePath("write", { file_path: "/b.py" }) === "/b.py");
check("extractFilePath: edit -> path alias",
	gap.extractFilePath("edit", { path: "/c.py" }) === "/c.py");
check("extractFilePath: grep -> null",
	gap.extractFilePath("grep", { pattern: "x" }) === null);
check("extractFilePath: read with no path -> null",
	gap.extractFilePath("read", {}) === null);
check("extractFilePath: null args -> null",
	gap.extractFilePath("read", null) === null);
check("extractFilePath: undefined toolName -> null",
	gap.extractFilePath(undefined, { file_path: "/a.py" }) === null);

// (5) pendingCount — .done AND .notified both count as finished
const d = mkdtempSync(join(tmpdir(), "gap-"));
writeFileSync(join(d, "1.input.md"), "x");                // pending
writeFileSync(join(d, "2.input.md"), "y");
writeFileSync(join(d, "2.done"), "done");                 // 2 finished, not notified
writeFileSync(join(d, "3.input.md"), "z");
writeFileSync(join(d, "3.notified"), "n");                 // 3 finished AND notified
check("pendingCount: .done and .notified both excluded -> 1 pending", gap.pendingCount(d) === 1);
check("pendingCount: missing dir -> 0", gap.pendingCount(join(d, "nope")) === 0);

// (5b) pruneOldReviews — deletes old .notified + siblings, keeps recent
const pd = mkdtempSync(join(tmpdir(), "gap-prune-"));
for (const b of ["1", "2"]) {
	writeFileSync(join(pd, b + ".input.md"), "x");
	writeFileSync(join(pd, b + ".md"), "r");
	writeFileSync(join(pd, b + ".notified"), "n");
}
const ancient = new Date(Date.now() - 30 * 86400000);
utimesSync(join(pd, "1.notified"), ancient, ancient);   // 1 is 30 days old
const pruned = gap.pruneOldReviews(pd, 14);
check("pruneOldReviews: prunes old (1) + siblings, keeps recent (2)",
	pruned === 1 && !pathExists(join(pd, "1.md")) && !pathExists(join(pd, "1.notified"))
		&& pathExists(join(pd, "2.md")) && pathExists(join(pd, "2.notified")));
check("pruneOldReviews: missing dir -> 0 (no throw)", gap.pruneOldReviews(join(pd, "nope"), 14) === 0);

// (5c) pruneOldReviews D2 — ages out old .done-only (headless) reviews too.
const hd = mkdtempSync(join(tmpdir(), "gap-headless-"));
writeFileSync(join(hd, "old.input.md"), "x");
writeFileSync(join(hd, "old.md"), "r");
writeFileSync(join(hd, "old.done"), "d");                  // headless-mode: done only, no notified
writeFileSync(join(hd, "fresh.input.md"), "y");
writeFileSync(join(hd, "fresh.done"), "d");                // recent .done-only
utimesSync(join(hd, "old.done"), ancient, ancient);        // backdate 30 days
const headlessPruned = gap.pruneOldReviews(hd, 14);
check("pruneOldReviews: prunes old .done-only (headless) + siblings",
	headlessPruned >= 1 && !pathExists(join(hd, "old.done"))
		&& !pathExists(join(hd, "old.md")) && !pathExists(join(hd, "old.input.md")));
check("pruneOldReviews: keeps recent .done-only",
	pathExists(join(hd, "fresh.done")) && pathExists(join(hd, "fresh.input.md")));

// (6) reviewPrompt shape (request-relative)
const p = gap.reviewPrompt("THE_ANSWER", ["/a.py"], "UNIQUE_REQ_MARKER_X");
check("reviewPrompt: includes answer + files + request content + contract",
	p.includes("THE_ANSWER") && p.includes("/a.py") && p.includes("UNIQUE_REQ_MARKER_X")
		&& p.includes("ORIGINAL REQUEST") && p.includes("OMISSIONS:"));
const p2 = gap.reviewPrompt("ANS", ["/b.py"], "");
check("reviewPrompt: no request -> request content absent",
	!p2.includes("UNIQUE_REQ_MARKER_X") && p2.includes("ANS"));

// (7) reapStaleReviews — reaps an old .input.md without .done/.notified (D4).
const rd = mkdtempSync(join(tmpdir(), "gap-reap-"));
writeFileSync(join(rd, "stale.input.md"), "pending-but-stale");
const stale = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
utimesSync(join(rd, "stale.input.md"), stale, stale);
check("reapStaleReviews: an old .input.md is reaped",
	gap.reapStaleReviews(rd, 300000) === 1
		&& pathExists(join(rd, "stale.done"))
		&& pathExists(join(rd, "stale.md"))
		&& readFileSync(join(rd, "stale.md"), "utf8").startsWith("ERROR: gap-review reviewer timed out"));
check("reapStaleReviews: after reap, pendingCount sees it as finished",
	gap.pendingCount(rd) === 0);

const rd2 = mkdtempSync(join(tmpdir(), "gap-reap-"));
writeFileSync(join(rd2, "fresh.input.md"), "fresh");
check("reapStaleReviews: a recent .input.md is NOT reaped",
	gap.reapStaleReviews(rd2, 300000) === 0 && !pathExists(join(rd2, "fresh.done")));
check("reapStaleReviews: missing dir -> 0 (no throw)",
	gap.reapStaleReviews(join(rd2, "nope"), 300000) === 0);

// (8) Wave-0 handler harness — drives prepareReview indirectly via turn_end.
const newHarness = () => {
	const handlers = {};
	const pi = { on(name, fn) { handlers[name] = fn; } };
	gap.default(pi);
	return handlers;
};
const makeRepo = () => {
	const d = mkdtempSync(join(tmpdir(), "gap-h-"));
	writeFileSync(join(d, ".git"), "gitdir: nope\n");
	return d;
};
const longAns = "x".repeat(300);

// D5: a relative path captured from a subdir is resolved absolute in the prompt.
{
	const h = newHarness();
	const root = makeRepo();
	const sub = join(root, "sub");
	mkdirSync(sub);
	h.before_agent_start({ prompt: "req5" });
	h.tool_call({ toolName: "read", input: { file_path: "rel.py" } });
	await h.turn_end(
		{ message: { content: [{ type: "text", text: longAns }] }, turnIndex: 1 },
		{ cwd: sub, hasUI: false },
	);
	const reviewsDir = join(root, ".gap-reviews");
	const ins = readdirSync(reviewsDir).filter((n) => n.endsWith(".input.md"));
	check("D5: at least one .input.md is written to the repo's .gap-reviews",
		ins.length >= 1);
	const txt = readFileSync(join(reviewsDir, ins[ins.length - 1]), "utf8");
	const expectedAbs = join(sub, "rel.py");
	check("D5: relative path was resolved absolute against ctx.cwd",
		txt.includes(expectedAbs));
	check("D5: prompt does NOT list the bare relative path",
		!/^- rel\.py$/m.test(txt));
}

// D3: an unwritable cwd (parent of .gap-reviews is a file) does not throw.
{
	const h = newHarness();
	const parent = mkdtempSync(join(tmpdir(), "gap-block-"));
	const blocker = join(parent, "blocker");
	writeFileSync(blocker, "");      // file, not dir — mkdirSync on blocker/.gap-reviews must throw
	h.before_agent_start({ prompt: "req3" });
	h.tool_call({ toolName: "read", input: { file_path: "f.py" } });
	let threw = false;
	try {
		await h.turn_end(
			{ message: { content: [{ type: "text", text: longAns }] }, turnIndex: 1 },
			{ cwd: blocker, hasUI: false },
		);
	} catch {
		threw = true;
	}
	check("D3: turn_end does not throw on unwritable cwd", !threw);
}

// D6: currentRequest is captured once per turn; cleared at terminal turn_end.
{
	const h = newHarness();
	const root = makeRepo();
	h.before_agent_start({ prompt: "FIRST_REQ" });
	h.before_agent_start({ prompt: "SECOND_REQ" });
	h.tool_call({ toolName: "read", input: { file_path: "f.py" } });
	await h.turn_end(
		{ message: { content: [{ type: "text", text: longAns }] }, turnIndex: 1 },
		{ cwd: root, hasUI: false },
	);
	const reviewsDir = join(root, ".gap-reviews");
	const ins = readdirSync(reviewsDir).filter((n) => n.endsWith(".input.md")).sort();
	const first = readFileSync(join(reviewsDir, ins[0]), "utf8");
	check("D6: first turn uses FIRST_REQ (capture-once)",
		first.includes("FIRST_REQ"));
	check("D6: later before_agent_start did NOT overwrite",
		!first.includes("SECOND_REQ"));

	// After terminal turn_end, the next before_agent_start captures fresh.
	h.before_agent_start({ prompt: "THIRD_REQ" });
	h.tool_call({ toolName: "read", input: { file_path: "g.py" } });
	await h.turn_end(
		{ message: { content: [{ type: "text", text: longAns }] }, turnIndex: 2 },
		{ cwd: root, hasUI: false },
	);
	const ins2 = readdirSync(reviewsDir).filter((n) => n.endsWith(".input.md")).sort();
	const second = readFileSync(join(reviewsDir, ins2[ins2.length - 1]), "utf8");
	check("D6: after terminal turn_end, next before_agent_start captures fresh",
		second.includes("THIRD_REQ"));
}

// (9) D1: \$GR_<X> tokens in the source match GR_<X> keys built by prepareReview.
{
	const src = readFileSync("__EXT_PATH__", "utf8");
	const tokens = new Set();
	const tokenRe = /\$GR_([A-Z_]+)/g;
	let m;
	while ((m = tokenRe.exec(src)) !== null) tokens.add(m[1]);
	const out = gap.prepareReview({
		message: { content: [{ type: "text", text: longAns }] },
		files: ["/abs/x.py"],
		request: "req",
		cwd: ".",
		env: {},
	});
	const envKeys = new Set();
	for (const k of Object.keys(out.env)) {
		if (k.startsWith("GR_")) envKeys.add(k.slice(3));
	}
	for (const t of tokens) {
		check("D1: \$GR_" + t + " in source has matching env GR_" + t,
			envKeys.has(t));
	}
	check("D1: env has GR_THINKING (runner uses \$GR_THINKING)", envKeys.has("THINKING"));
	check("D1: env does NOT have the stale GR_THINK key", !envKeys.has("THINK"));
}

if (fail > 0) { console.log("FAILURES: " + fail); process.exit(1); }
console.log("PASS: gap-review pure-logic smoke");
DRIVER_EOF
sed -i "s|__EXT_URL__|$ext_url|g; s|__EXT_PATH__|$ext|g" "$driver"

node "$driver" || {
	echo "FAIL: driver assertions" >&2
	exit 1
}

# --- findProjectRoot resolves to the repo root ----------------------------
root=$(node -e "import('$ext_url').then(m => console.log(m.findProjectRoot(process.cwd())))")
[ "$root" = "$repo" ] || {
	echo "FAIL: findProjectRoot got '$root', want '$repo'" >&2
	exit 1
}
echo "OK:   findProjectRoot resolves to repo root"

echo "PASS: gap-review extension smoke"
