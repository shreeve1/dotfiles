#!/usr/bin/env bash
# The correction message verify-final sends when a claim is FALSE. A fake `pi` stands in for
# the checker, so no model runs. Checks that the message tells the agent the user reads only the
# final answer (so it must stand alone, open with a visible "Corrected:" line per changed claim, and
# not address the checker), in both the manual --check path and the Stop-hook JSON path, that clean
# and UNSURE-only results never block, that UNSURE is hidden by default, and that --harness names
# the log entry of a --check run.
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
cat >"$FAKE_PI_STDIN"
printf '%s\n' "$@" >"$FAKE_PI_ARGS"
printf '%s\n' "$FAKE_PI_OUTPUT"
EOF
chmod +x "$TMP/bin/pi"

# Long enough to pass the 500-character minimum; the fake checker ignores it.
ANSWER="$(head -c 600 /dev/zero | tr '\0' 'a')"

pass=0
failures=()
check() {
  if [ "$2" = "yes" ]; then pass=$((pass + 1)); else failures+=("$1"); fi
}
last_log() { tail -1 "$TMP/home/.cache/verify-final.log"; }
json_field() { python3 -c 'import json,sys; print(json.load(sys.stdin).get(sys.argv[1], ""))' "$1"; }
contains() { case "$1" in *"$2"*) echo yes ;; *) echo no ;; esac }
lacks() { case "$1" in *"$2"*) echo no ;; *) echo yes ;; esac }

verify() {
  local output="$1"
  shift
  env PATH="$TMP/bin:$PATH" HOME="$TMP/home" FAKE_PI_OUTPUT="$output" \
    FAKE_PI_STDIN="$TMP/stdin" FAKE_PI_ARGS="$TMP/args" "$BIN" "$@"
}

FINDING='FALSE | a.txt:1 | the claim -- the fix'

manual="$(printf '%s' "$ANSWER" | verify "$FINDING" --check -)"
check "manual: names the findings" "$(contains "$manual" "$FINDING")"
check "manual: asks for a standalone final answer" "$(contains "$manual" "complete, standalone message")"
check "manual: says the user reads only that message" "$(contains "$manual" "the user reads only that message")"
check "manual: forbids addressing the checker" "$(contains "$manual" "Do not address the checker")"
check "manual: forbids a you're-right opener" "$(contains "$manual" "you're right")"
check "manual: opens with a visible Corrected: line" "$(contains "$manual" "Corrected: I said")"
check "manual: lets the agent push back on a wrong finding" "$(contains "$manual" "stands; <your evidence>")"
check "manual: no longer hides the correction" "$(lacks "$manual" "do not mention a fact-check")"
# On Windows pi is a .cmd shim and cmd.exe cuts an argument at its first newline, so the
# multi-line prompt must reach the checker on stdin, never as an argument.
check "prompt: the answer reaches the checker on stdin" "$(contains "$(cat "$TMP/stdin")" "$ANSWER")"
check "prompt: the answer is not passed as an argument" "$(lacks "$(cat "$TMP/args")" "$ANSWER")"
check "prompt: the checker runs at low thinking by default" "$(contains "$(tr '\n' ' ' <"$TMP/args")" "--thinking low ")"

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
check "UNSURE only: hidden by default" "$(lacks "$unsure" "UNSURE")"
check "UNSURE only: hidden lines are logged" "$(contains "$(cat "$TMP/home/.cache/verify-final.log")" "unsure_hidden")"
shown="$(printf '%s' "$event" | VERIFY_FINAL_WARN=all verify 'UNSURE | cannot confirm | a claim')"
check "UNSURE only: shown with VERIFY_FINAL_WARN=all" "$(contains "$shown" "UNSURE")"
check "UNSURE only: not cached as clean" "$(lacks "$(last_log)" " cached ")"

printf '%s' "$ANSWER pi" | verify NO_CLAIMS --harness pi --check - >/dev/null
check "--check --harness pi: logged as pi" "$(contains "$(last_log)" " pi no_claims ")"
printf '%s' "$ANSWER manual" | verify NO_CLAIMS --check - >/dev/null
check "--check alone: still logged as manual" "$(contains "$(last_log)" " manual no_claims ")"

# A clean answer is not re-sent to the model in the same directory; a FALSE one always is.
rm -f "$TMP/args"
again="$(printf '%s' "$ANSWER pi" | verify NO_CLAIMS --harness pi --check -)"
check "cache: a repeated clean answer is not re-checked" "$([ ! -e "$TMP/args" ] && echo yes || echo no)"
check "cache: the repeat is logged as cached" "$(contains "$(last_log)" " pi cached ")"
check "cache: the repeat still reports no findings" "$(contains "$again" "verify-final: no findings")"
rm -f "$TMP/args"
(cd "$TMP/home" && printf '%s' "$ANSWER pi" | verify NO_CLAIMS --harness pi --check - >/dev/null)
check "cache: another directory is checked afresh" "$([ -e "$TMP/args" ] && echo yes || echo no)"
printf '%s' "$ANSWER false" | verify "$FINDING" --check - >/dev/null
rm -f "$TMP/args"
printf '%s' "$ANSWER false" | verify "$FINDING" --check - >/dev/null
check "cache: a FALSE answer is re-checked every time" "$([ -e "$TMP/args" ] && echo yes || echo no)"

rm -f "$TMP/args"
short="$(head -c 450 /dev/zero | tr '\0' 'b' | verify "$FINDING" --check -)"
check "minimum: a 450-character answer is skipped" "$([ ! -e "$TMP/args" ] && echo yes || echo no)"
check "minimum: the skip names 500" "$(contains "$short" "under 500 chars")"

for f in "${failures[@]+"${failures[@]}"}"; do echo "FAIL: $f" >&2; done
echo "verify-final-wording: $pass passed, ${#failures[@]} failed"
[ "${#failures[@]}" -eq 0 ]
