#!/usr/bin/env bash
# gap-review-smoke.sh — behavioral smoke for the gap-review Pi extension.
#
# Tests the pure decision logic offline (no model, no network, no real pi):
#   (1) node --check + required exports/handlers present
#   (2) isTerminal: text-only answer -> true; tool_use present -> false
#   (3) answerText: extracts text from content blocks
#   (4) filesThisTurn: collects read/write/edit file_paths since the last user
#       message, ignores other tools, and excludes prior-turn files
#   (5) pendingCount: counts spawned-but-not-finished reviewers
#   (6) findProjectRoot: resolves to the repo root
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
for sym in isTerminal answerText extractFilePath pendingCount pruneOldReviews findProjectRoot reviewPrompt \
	'pi.on("turn_end"' 'pi.on("turn_start"' 'pi.on("tool_call"' 'pi.on("before_agent_start"'; do
	grep -q "$sym" "$ext" || {
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
cat >"$driver" <<DRIVER_EOF
import * as gap from "__EXT_URL__";

let fail = 0;
const ok = (name) => console.log("OK:   " + name);
const check = (name, cond) => {
	if (cond) ok(name); else { console.log("FAIL: " + name); fail++; }
};

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
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const d = mkdtempSync(join(tmpdir(), "gap-"));
writeFileSync(join(d, "1.input.md"), "x");                // pending
writeFileSync(join(d, "2.input.md"), "y");
writeFileSync(join(d, "2.done"), "done");                 // 2 finished, not notified
writeFileSync(join(d, "3.input.md"), "z");
writeFileSync(join(d, "3.notified"), "n");                 // 3 finished AND notified
check("pendingCount: .done and .notified both excluded -> 1 pending", gap.pendingCount(d) === 1);
check("pendingCount: missing dir -> 0", gap.pendingCount(join(d, "nope")) === 0);

// (5b) pruneOldReviews — deletes old .notified + siblings, keeps recent
import { utimesSync, existsSync as pathExists } from "node:fs";
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

// (6) reviewPrompt shape (request-relative)
const p = gap.reviewPrompt("THE_ANSWER", ["/a.py"], "UNIQUE_REQ_MARKER_X");
check("reviewPrompt: includes answer + files + request content + contract",
	p.includes("THE_ANSWER") && p.includes("/a.py") && p.includes("UNIQUE_REQ_MARKER_X")
		&& p.includes("ORIGINAL REQUEST") && p.includes("OMISSIONS:"));
const p2 = gap.reviewPrompt("ANS", ["/b.py"], "");
check("reviewPrompt: no request -> request content absent",
	!p2.includes("UNIQUE_REQ_MARKER_X") && p2.includes("ANS"));

if (fail > 0) { console.log("FAILURES: " + fail); process.exit(1); }
console.log("PASS: gap-review pure-logic smoke");
DRIVER_EOF
sed -i "s|__EXT_URL__|$ext_url|g" "$driver"

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
