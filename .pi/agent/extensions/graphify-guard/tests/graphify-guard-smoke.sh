#!/usr/bin/env bash
# graphify-guard-smoke.sh — behavioral smoke for the Pi-side graphify guard.
#
# Cases:
#   (1) project WITHOUT graphify-out/graph.json -> before_agent_start no-op
#       (returns undefined; system prompt untouched)
#   (2) project WITH graphify-out/graph.json    -> guidance appended to the
#       system prompt (and original prompt preserved)
#   (3) findProjectRoot resolves to the repo root
#
# Drives the extension by importing its ESM exports from Node and synthesizing
# a before_agent_start event. Offline only — never touches the network or the
# real pi runner.

set -u
script_dir=$(cd "$(dirname "$0")" && pwd)
ext="$script_dir/../index.js"

[ -f "$ext" ] || { echo "FAIL: extension not found at $ext" >&2; exit 1; }

# --- (a) Static checks ----------------------------------------------------
node --check "$ext" || { echo "FAIL: extension failed node --check" >&2; exit 1; }
grep -q 'findProjectRoot' "$ext" || { echo "FAIL: missing findProjectRoot export" >&2; exit 1; }
grep -q 'hasGraph'        "$ext" || { echo "FAIL: missing hasGraph export" >&2; exit 1; }
grep -q 'before_agent_start' "$ext" || { echo "FAIL: missing before_agent_start handler" >&2; exit 1; }

# --- (b) Throwaway repo ---------------------------------------------------
repo=$(mktemp -d)
trap 'rm -rf "$repo"' EXIT
cd "$repo" || exit 1
git init -q -b main 2>/dev/null || git init -q

fail() { echo "FAIL: $1" >&2; exit 1; }
ok()   { echo "OK:   $1"; }

# Driver: register the extension, capture its before_agent_start handler, and
# invoke it with a synthetic event. Prints "undefined" for a no-op, else the
# returned systemPrompt.
driver=$(mktemp --suffix=.mjs)
ext_url="file://$ext"
cat >"$driver" <<'DRIVER_EOF'
import graphifyGuard from '__EXT_URL__';
const projectRoot = process.argv[2];
let handler;
graphifyGuard({ on: (event, cb) => { if (event === "before_agent_start") handler = cb; } });
const result = await handler(
	{ type: "before_agent_start", systemPrompt: "BASE_PROMPT", prompt: "hi" },
	{ cwd: projectRoot },
);
if (result === undefined) console.log("undefined");
else console.log(JSON.stringify(result));
DRIVER_EOF
sed -i "s|__EXT_URL__|$ext_url|g" "$driver"

# --- Case 1: no graph -> no-op -------------------------------------------
out=$(node "$driver" "$repo")
[ "$out" = "undefined" ] || fail "case 1: expected no-op without graph (got '$out')"
ok "case 1 (no graph -> no-op)"

# --- Case 2: graph present -> guidance appended --------------------------
mkdir -p "$repo/graphify-out"
echo '{"nodes":[]}' > "$repo/graphify-out/graph.json"
out=$(node "$driver" "$repo")
case "$out" in
	*"BASE_PROMPT"*) : ;;
	*) fail "case 2: original system prompt not preserved (got '$out')" ;;
esac
case "$out" in
	*"graphify query"*) ok "case 2 (graph present -> guidance appended)" ;;
	*) fail "case 2: guidance not injected (got '$out')" ;;
esac

# --- Case 3: findProjectRoot ---------------------------------------------
root=$(cd "$repo" && node -e "import('$ext').then(m => console.log(m.findProjectRoot(process.cwd())))")
[ "$root" = "$repo" ] || fail "findProjectRoot did not resolve to repo (got '$root', want '$repo')"
ok "case 3 (findProjectRoot resolves to repo root)"

echo "PASS: graphify-guard extension smoke"
