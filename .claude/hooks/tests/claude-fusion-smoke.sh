#!/usr/bin/env bash
# claude-fusion-smoke — offline assert-based smoke for Claude Fusion (ADR 0003).
# No live `pi` launch: drives the block hook with crafted stdin and pi-delegate
# with --dry-run, asserting exit codes + stdout. Run: bash .claude/hooks/tests/claude-fusion-smoke.sh
set -u

HERE=$(cd "$(dirname "$0")" && pwd)
REPO=$(cd "$HERE/../../.." && pwd)
BLK="$HERE/../claude-fusion-block.sh"
HARNESS_BLK="$HERE/../block-bash-pattern.sh"
PD="$REPO/bin/pi-delegate"
# Hermetic: read role settings/personas from THIS repo, not the ~/.pi symlink.
export PI_CODING_AGENT_DIR="$REPO/.pi/agent"

pass=0
fail=0
ok() { pass=$((pass + 1)); }
bad() {
  fail=$((fail + 1))
  echo "FAIL: $1"
}

ONCFG=$(mktemp)
printf '{"claude":"on"}' >"$ONCFG"
OFFCFG=$(mktemp)
printf '{"claude":"off"}' >"$OFFCFG"
# .fusion-off escape-hatch project dir
OFFDIR=$(mktemp -d)
mkdir -p "$OFFDIR/.claude"
touch "$OFFDIR/.claude/.fusion-off"
NODIR=/nonexistent
trap 'rm -f "$ONCFG" "$OFFCFG"; rm -rf "$OFFDIR"' EXIT

# block-hook exit code for a given stdin JSON / config / project dir
blk() { # <json> <config> <projectdir>
  printf '%s' "$1" | FUSION_CONFIG="$2" CLAUDE_PROJECT_DIR="$3" bash "$BLK" >/dev/null 2>&1
  echo $?
}
blk_all() { # <json> <config> <projectdir>
  printf '%s' "$1" | CLAUDE_PROJECT_DIR="$3" bash "$HARNESS_BLK" >/dev/null 2>&1 || {
    echo 2
    return
  }
  blk "$1" "$2" "$3"
}
expect() { # <label> <got> <want>
  [ "$2" = "$3" ] && ok || bad "$1 (got $2, want $3)"
}

EDIT='{"tool_name":"Edit","tool_input":{"file_path":"a"}}'
bash_json() { printf '{"tool_name":"Bash","tool_input":{"command":%s}}' "$1"; }

echo "== T.1 block-hook decisions =="
# T.1.1 claude=on + Edit -> 2
expect "T.1.1 on+Edit" "$(blk "$EDIT" "$ONCFG" "$NODIR")" 2
# T.1.2 claude=off + Edit -> 0
expect "T.1.2 off+Edit" "$(blk "$EDIT" "$OFFCFG" "$NODIR")" 0
# T.1.3 .fusion-off present + Edit -> 0
expect "T.1.3 fusion-off+Edit" "$(blk "$EDIT" "$ONCFG" "$OFFDIR")" 0
# NotebookEdit is a writer too
expect "on+NotebookEdit" "$(blk '{"tool_name":"NotebookEdit","tool_input":{}}' "$ONCFG" "$NODIR")" 2

echo "== T.1.4 bash write-paths denied =="
for c in '"sed -i s/a/b/ f"' '"python -c print(1)"' '"echo x > f"' '"rm f"' '"git diff --output=/etc/x"'; do
  expect "deny $c" "$(blk "$(bash_json "$c")" "$ONCFG" "$NODIR")" 2
done

echo "== T.1.5 bash allowlist allowed =="
for c in '"pi-delegate worker \"do x\""' '"git diff"' '"npm test"' "\"git commit -m 'x'\"" '"herdr-fork"'; do
  expect "allow $c" "$(blk "$(bash_json "$c")" "$ONCFG" "$NODIR")" 0
done
expect "deny herdr-fork arguments" "$(blk "$(bash_json '"'"'herdr-fork extra'"'"')" "$ONCFG" "$NODIR")" 2
expect "allow herdr-fork through full hook chain" "$(blk_all "$(bash_json '"herdr-fork"')" "$ONCFG" "$NODIR")" 0

echo "== T.2 pi-delegate role resolution (--dry-run) =="
# T.2.1 worker: model + tools incl edit,write
out=$("$PD" worker --dry-run "x" 2>&1)
echo "$out" | grep -q "minimax/MiniMax-M3" && echo "$out" | grep -Eq "tools: .*edit.*write" &&
  ok || bad "T.2.1 worker model/tools"
# T.2.2 reviewer: tools have NO write/edit; args include --no-extensions
out=$("$PD" reviewer --dry-run "x" 2>&1)
echo "$out" | grep -q "tools: read,grep,find,ls,bash" && ! echo "$out" | grep -Eq "tools:.*(write|edit)" &&
  echo "$out" | grep -q -- "--no-extensions" && ok || bad "T.2.2 reviewer tools/no-extensions"
# T.2.5 planner: no tools key -> omit --tools (never "--tools null"). Check the
# args line only (the human-readable "tools:" line legitimately says "(no --tools)").
out=$("$PD" planner --dry-run "x" 2>&1)
! echo "$out" | grep '^args:' | grep -q -- "--tools" && ok || bad "T.2.5 planner omits --tools"
# T.2.3 researcher: args include --extension ...rpiv-web-tools
out=$("$PD" researcher --dry-run "x" 2>&1)
echo "$out" | grep -q -- "--extension" && echo "$out" | grep -q "rpiv-web-tools" &&
  ok || bad "T.2.3 researcher web-tools extension"
# T.2.4 bogus role -> nonzero
"$PD" bogus "x" >/dev/null 2>&1 && bad "T.2.4 bogus should be nonzero" || ok

echo "== T.3 claude-fusion toggle (against a temp config) =="
CF="$REPO/bin/claude-fusion"
TCFG=$(mktemp)
printf '{"defaultMode":"on"}' >"$TCFG"
# T.3.1 defaultMode on, no claude key -> status resolves on
FUSION_CONFIG="$TCFG" "$CF" status | grep -q "Fusion: on" && ok || bad "T.3.1 default resolves on"
# T.3.2 off sets claude=off (defaultMode preserved) -> status off
FUSION_CONFIG="$TCFG" "$CF" off >/dev/null
{ FUSION_CONFIG="$TCFG" "$CF" status | grep -q "Fusion: off" && grep -q '"defaultMode"' "$TCFG"; } &&
  ok || bad "T.3.2 off -> off, defaultMode preserved"
# T.3.3 on sets claude=on -> status on
FUSION_CONFIG="$TCFG" "$CF" on >/dev/null
FUSION_CONFIG="$TCFG" "$CF" status | grep -q "Fusion: on" && ok || bad "T.3.3 on -> on"
# T.3.4 status exits 0
FUSION_CONFIG="$TCFG" "$CF" status >/dev/null
[ $? -eq 0 ] && ok || bad "T.3.4 status exit 0"
# T.3.5 bogus subcommand -> nonzero
FUSION_CONFIG="$TCFG" "$CF" bogus >/dev/null 2>&1 && bad "T.3.5 bogus should be nonzero" || ok
rm -f "$TCFG"

echo "--- $pass passed, $fail failed ---"
[ "$fail" -eq 0 ]
