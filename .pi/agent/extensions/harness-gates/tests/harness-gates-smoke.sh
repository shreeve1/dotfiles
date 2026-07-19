#!/usr/bin/env bash
# harness-gates-smoke.sh — behavioral smoke for the Pi-side harness-gates adapter.
#
# Plan T.1 cases (mirrors the smoke pattern used by staged-static-check.sh):
#   (1) bash tool_call carrying a "git commit" with a dirty gate script
#       in $CLAUDE_PROJECT_DIR/.claude/hooks/                 -> block (exit 2)
#   (2) bash tool_call carrying a "git commit" with a clean gate
#       in $CLAUDE_PROJECT_DIR/.claude/hooks/                 -> pass
#   (3) bash tool_call carrying a non-git command (e.g. "ls")  -> pass
#   (4) tool_call carrying a write to a protected path         -> block (exit 2)
#   (5) bash tool_call with passing-gate stderr                 -> warn, don't block
#
# Drives the adapter by importing its exported functions (ESM) from Node,
# then synthesizing tool_call event payloads. Offline only — never touches
# the network, never invokes the real pi runner.

set -u
script_dir=$(cd "$(dirname "$0")" && pwd)
adapter="$script_dir/../index.js"
global_path_hook="$script_dir/../../../../../.claude/hooks/block-path-access.sh"

[ -f "$adapter" ] || {
	echo "FAIL: adapter not found at $adapter" >&2
	exit 1
}
[ -f "$global_path_hook" ] || {
	echo "FAIL: global path hook not found at $global_path_hook" >&2
	exit 1
}

# --- (a) Static checks ----------------------------------------------------
node --check "$adapter" || { echo "FAIL: adapter failed node --check" >&2; exit 1; }
grep -q 'findProjectRoot' "$adapter"  || { echo "FAIL: missing findProjectRoot export" >&2; exit 1; }
grep -q 'runHook'          "$adapter"  || { echo "FAIL: missing runHook export"          >&2; exit 1; }
grep -q 'runBashGates'     "$adapter"  || { echo "FAIL: missing runBashGates export"     >&2; exit 1; }
grep -q 'runPathGate'      "$adapter"  || { echo "FAIL: missing runPathGate export"      >&2; exit 1; }
# Must contain zero gate logic — only event→script mapping + spawning.
# Quick heuristic: gate scripts themselves reference `patterns=(` / `ruff` /
# `git diff --cached`. The adapter must NOT.
if grep -qE 'ruff|git diff --cached|patterns=\(' "$adapter"; then
	echo "FAIL: adapter appears to contain gate logic (forbidden)" >&2
	exit 1
fi

# --- (b) Build a throwaway git repo + temp hooks dir ----------------------
repo=$(mktemp -d)
hooks_dir="$repo/.claude/hooks"
mkdir -p "$hooks_dir"
cd "$repo" || exit 1
git init -q -b main 2>/dev/null || git init -q
git config user.email smoke@test
git config user.name smoke
git commit --allow-empty -q -m init

fail() { echo "FAIL: $1" >&2; rm -rf "$repo"; exit 1; }
ok()   { echo "OK:   $1"; }
trap 'rm -rf "$repo"' EXIT

# Driver: import the ESM adapter, run a single async fn, print the result.
# The driver prints a single JSON object on stdout ({"block":true,"reason":"..."})
# or the literal string "undefined" when no gate fires.
driver=$(mktemp --suffix=.mjs)
adapter_url="file://$adapter"
project_root="$repo"
# Heredoc with single-quoted sentinel disables ALL bash expansion so the JS
# template literals stay intact; we sed-substitute the sentinels afterward.
cat >"$driver" <<'DRIVER_EOF'
import harnessGatesExtension, {
	runBashGates,
	runPathGate,
	runResultGates,
	findProjectRoot,
} from '__ADAPTER_URL__';

const mode   = process.argv[2];
const payload = JSON.parse(process.argv[3]);
const projectRoot = '__PROJECT_ROOT__';

let result;
if (mode === "bash") {
	result = await runBashGates(payload, projectRoot);
} else if (mode === "extension-bash") {
	let handler;
	harnessGatesExtension({ on: (event, callback) => { if (event === "tool_call") handler = callback; } });
	const notifications = [];
	const eventResult = await handler(
		{ toolName: "bash", input: payload.tool_input },
		{ cwd: projectRoot, hasUI: true, ui: { notify: (message, level) => notifications.push({ message, level }) } },
	);
	result = { eventResult, notifications };
} else if (mode === "path") {
	result = await runPathGate(payload.tool_name, payload.tool_input.file_path, projectRoot);
} else if (mode === "result") {
	result = await runResultGates(payload.tool_input.file_path, projectRoot);
} else {
	console.error("unknown mode:", mode);
	process.exit(2);
}
if (result === undefined) console.log("undefined");
else console.log(JSON.stringify(result));
DRIVER_EOF
sed -i "s|__ADAPTER_URL__|$adapter_url|g; s|__PROJECT_ROOT__|$project_root|g" "$driver"

# --- (c) Case 3 (non-git passes BEFORE any gate script exists) -----------
# Even with NO gate scripts installed, "ls" must not be blocked.
out=$(node "$driver" bash '{"tool_input":{"command":"ls -la"}}')
[ "$out" = "undefined" ] || fail "case 3: non-git command not ignored (got '$out')"
ok "case 3 (non-git passes without gates)"

# --- (d) Install a gate script: any "git commit" command blocks ----------
# A minimal block-bash-pattern equivalent: matches any command containing the
# substring "git commit" and exits 2. The adapter should hand it the payload
# and surface its exit code.
cat >"$hooks_dir/block-bash-pattern.sh" <<'GATE_EOF'
#!/usr/bin/env bash
set -u
input=$(cat)
cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // empty')
echo "$cmd" | grep -qE '(^|[;&|[:space:]])git[[:space:]]+commit([[:space:]]|$)' || exit 0
echo "Blocked by test gate: git commit detected." >&2
exit 2
GATE_EOF
chmod +x "$hooks_dir/block-bash-pattern.sh"

# Case 1 (block on dirty / matched): "git commit -m wip" must now be blocked.
out=$(node "$driver" bash '{"tool_input":{"command":"git commit -m wip"}}')
case "$out" in
	*"\"block\":true"*) ok "case 1 (block-on-dirty/matched)" ;;
	*) fail "case 1: expected block, got '$out'" ;;
esac

# Case 2 (pass on clean / unmatched): a benign command must NOT be blocked
# by the gate script. The script above only matches git commit; "echo hi"
# should pass through.
out=$(node "$driver" bash '{"tool_input":{"command":"echo hi"}}')
[ "$out" = "undefined" ] || fail "case 2: clean/benign command wrongly blocked (got '$out')"
ok "case 2 (pass-on-clean/benign)"

# Advisory stderr must surface without blocking.
cat >"$hooks_dir/pre-git-checks.sh" <<'GATE_EOF'
#!/usr/bin/env bash
echo "Advisory boundary check failed" >&2
exit 0
GATE_EOF
chmod +x "$hooks_dir/pre-git-checks.sh"
out=$(node "$driver" extension-bash '{"tool_input":{"command":"git push"}}')
case "$out" in
	*'"message":"Advisory boundary check failed","level":"warning"'*) ok "bash-gate: advisory stderr surfaced" ;;
	*) fail "bash-gate: advisory stderr was dropped (got '$out')" ;;
esac
rm -f "$hooks_dir/pre-git-checks.sh"

# Case 4 (path gate): install block-path-access.sh that blocks writes whose
# basename starts with a dot, mirroring the protected-path arm. A write
# targeting `.env` must be blocked; a write to `src.txt` must pass.
cat >"$hooks_dir/block-path-access.sh" <<'GATE_EOF'
#!/usr/bin/env bash
set -u
input=$(cat)
tool=$(printf '%s' "$input" | jq -r '.tool_name // empty')
[ "$tool" = "Write" ] || exit 0
path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')
base=$(basename "$path")
case "$base" in
	.*) echo "Blocked by test gate: protected path '$base'." >&2; exit 2 ;;
esac
exit 0
GATE_EOF
chmod +x "$hooks_dir/block-path-access.sh"

# Block-on-dirty path: write to .env -> exit 2 -> block=true.
out=$(node "$driver" path '{"tool_name":"Write","tool_input":{"file_path":"$repo/.env"}}')
case "$out" in
	*"\"block\":true"*) ok "case 4 (block-on-protected-path)" ;;
	*) fail "case 4: protected-path write not blocked (got '$out')" ;;
esac

# Pass-on-clean path: write to src.txt -> block=undefined.
out=$(node "$driver" path '{"tool_name":"Write","tool_input":{"file_path":"$repo/src.txt"}}')
[ "$out" = "undefined" ] || fail "case 4: benign path wrongly blocked (got '$out')"
ok "case 4 (pass-on-benign-path)"

# The real global policy is shared by Claude and Pi: ordinary out-of-tree
# writes pass, but secret writes remain blocked. Remove the project override
# and copy the tracked global hook into an isolated HOME for this check.
rm -f "$hooks_dir/block-path-access.sh"
global_home=$(mktemp -d)
outside=$(mktemp -d)
mkdir -p "$global_home/.claude/hooks"
cp "$global_path_hook" "$global_home/.claude/hooks/block-path-access.sh"
payload=$(jq -nc --arg path "$outside/src.txt" '{tool_name:"Write",tool_input:{file_path:$path}}')
out=$(HOME="$global_home" node "$driver" path "$payload")
[ "$out" = "undefined" ] || fail "global out-of-tree write wrongly blocked (got '$out')"
ok "global path gate allows out-of-tree write"
payload=$(jq -nc --arg path "$outside/.env" '{tool_name:"Write",tool_input:{file_path:$path}}')
out=$(HOME="$global_home" node "$driver" path "$payload")
case "$out" in
	*"\"block\":true"*) ok "global path gate retains secret protection" ;;
	*) fail "global protected out-of-tree write not blocked (got '$out')" ;;
esac
rm -rf "$global_home" "$outside"

# --- (d.5) Result gates: fail-open vs fail-closed distinction -----------
# format-on-edit.sh and lint-on-edit.sh are fail-open (notification only,
# NOT isError). validate-syntax.sh is fail-closed (exit-2 -> isError=true).
cat >"$hooks_dir/format-on-edit.sh" <<'GATE_EOF'
#!/usr/bin/env bash
echo "Formatted (notification)" >&2
exit 2
GATE_EOF
chmod +x "$hooks_dir/format-on-edit.sh"

# fail-open exit-2: stderr surfaces but isError MUST stay false.
out=$(node "$driver" result '{"tool_input":{"file_path":"$repo/x.js"}}')
case "$out" in
	*"\"isError\":false"*) ok "result-gate: fail-open exit-2 -> isError=false" ;;
	*) fail "result-gate: fail-open wrongly flipped isError (got '$out')" ;;
esac

rm -f "$hooks_dir/format-on-edit.sh"
cat >"$hooks_dir/validate-syntax.sh" <<'GATE_EOF'
#!/usr/bin/env bash
echo "Syntax error" >&2
exit 2
GATE_EOF
chmod +x "$hooks_dir/validate-syntax.sh"

# fail-closed exit-2: isError MUST be true.
out=$(node "$driver" result '{"tool_input":{"file_path":"$repo/x.js"}}')
case "$out" in
	*"\"isError\":true"*) ok "result-gate: fail-closed exit-2 -> isError=true" ;;
	*) fail "result-gate: fail-closed exit-2 not surfaced (got '$out')" ;;
esac

# --- (e) findProjectRoot sanity ------------------------------------------
# Test directly via Node since it isn't async.
root=$(cd "$repo" && node -e "import('$adapter').then(m => console.log(m.findProjectRoot(process.cwd())))")
[ "$root" = "$repo" ] || fail "findProjectRoot did not resolve to repo (got '$root', want '$repo')"
ok "findProjectRoot resolves to repo root"

echo "PASS: harness-gates adapter smoke"