#!/usr/bin/env bash
# The correction message verify-final sends when a claim is FALSE. A fake `pi` stands in for
# the checker, so no model runs. Checks that the message tells the agent the user reads only the
# final answer (so it must stand alone and not address the checker), in both the manual
# --check path and the Stop-hook JSON path, and that clean and UNSURE-only results never block.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BIN="$ROOT/.agents/bin/verify-final"

command -v python3 >/dev/null || {
  echo "SKIP: python3 not installed"
  exit 0
}

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/home" "$TMP/bin"
cat >"$TMP/bin/pi" <<'EOF'
#!/bin/sh
printf '%s\n' "$FAKE_PI_OUTPUT"
EOF
chmod +x "$TMP/bin/pi"

# Long enough to pass the 200-character minimum; the fake checker ignores it.
ANSWER="$(head -c 300 /dev/zero | tr '\0' 'a')"

pass=0
failures=()
check() {
  if [ "$2" = "yes" ]; then pass=$((pass + 1)); else failures+=("$1"); fi
}
json_field() { python3 -c 'import json,sys; print(json.load(sys.stdin).get(sys.argv[1], ""))' "$1"; }
contains() { case "$1" in *"$2"*) echo yes ;; *) echo no ;; esac }
lacks() { case "$1" in *"$2"*) echo no ;; *) echo yes ;; esac }

verify() {
  local output="$1"
  shift
  env PATH="$TMP/bin:$PATH" HOME="$TMP/home" FAKE_PI_OUTPUT="$output" "$BIN" "$@"
}

FINDING='FALSE | a.txt:1 | the claim -- the fix'

manual="$(printf '%s' "$ANSWER" | verify "$FINDING" --check -)"
check "manual: names the findings" "$(contains "$manual" "$FINDING")"
check "manual: asks for a standalone final answer" "$(contains "$manual" "complete, standalone message")"
check "manual: says the user reads only that message" "$(contains "$manual" "the user reads only that message")"
check "manual: forbids addressing the checker" "$(contains "$manual" "Do not address the checker")"
check "manual: forbids a you're-right opener" "$(contains "$manual" "you're right")"
check "manual: no longer asks to say what changed up front" "$(lacks "$manual" "and say in one line what you changed")"

event="$(python3 -c 'import json,sys; print(json.dumps({"last_assistant_message": sys.argv[1], "cwd": sys.argv[2]}))' "$ANSWER" "$TMP")"
hook="$(printf '%s' "$event" | verify "$FINDING")"
decision="$(printf '%s' "$hook" | json_field decision)"
reason="$(printf '%s' "$hook" | json_field reason)"
check "hook: a FALSE finding blocks" "$([ "$decision" = block ] && echo yes || echo no)"
check "hook: the reason carries the same instruction" "$(contains "$reason" "complete, standalone message")"
check "hook: the reason forbids addressing the checker" "$(contains "$reason" "Do not address the checker")"

clean="$(printf '%s' "$ANSWER" | verify NO_CLAIMS --check -)"
check "clean: reports no findings" "$(contains "$clean" "verify-final: no findings")"

unsure="$(printf '%s' "$event" | verify 'UNSURE | cannot confirm | a claim')"
check "UNSURE only: does not block" "$(lacks "$unsure" '"decision"')"

for f in "${failures[@]+"${failures[@]}"}"; do echo "FAIL: $f" >&2; done
echo "verify-final-wording: $pass passed, ${#failures[@]} failed"
[ "${#failures[@]}" -eq 0 ]
