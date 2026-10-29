#!/usr/bin/env bash
# The recommendation check: `verify-final --recommend` (fake `pi` checker, no model).
# Checks the script keeps sourced IMPOSSIBLE/WRONG/EXISTS lines and drops unsourced
# ones, asks for visible Revised:/Kept: lines, handles NO_RECOMMENDATIONS and
# NO_FINDINGS, caches a clean answer, skips short answers, honours VERIFY_RECOMMEND=0,
# loads the web tools with Exa only when the extension folder exists, and logs rec_*.
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
printf '%s\n' "$@" >"$FAKE_PI_ARGV"
printf '%s' "${WEB_SEARCH_PROVIDER:-}" >"$FAKE_PI_ENV"
printf '%s\n' "$FAKE_PI_OUTPUT"
EOF
chmod +x "$TMP/bin/pi"

pass=0
failures=()
check() {
  if [ "$2" = "yes" ]; then pass=$((pass + 1)); else failures+=("$1"); fi
}
contains() { case "$1" in *"$2"*) echo yes ;; *) echo no ;; esac }
lacks() { case "$1" in *"$2"*) echo no ;; *) echo yes ;; esac }
slurp() { cat "$1" 2>/dev/null || true; }
last_log() { tail -1 "$TMP/home/.cache/verify-final.log" 2>/dev/null || true; }
rec_run() {
  rm -f "$TMP/stdin" "$TMP/argv" "$TMP/env"
  env PATH="$TMP/bin:$PATH" HOME="$TMP/home" FAKE_PI_OUTPUT="$1" FAKE_PI_STDIN="$TMP/stdin" \
    FAKE_PI_ARGV="$TMP/argv" FAKE_PI_ENV="$TMP/env" "$BIN" --harness pi --recommend -
}
event() {
  python3 -c 'import json,sys; print(json.dumps({"requests": sys.argv[1:-1], "answer": sys.argv[-1]}))' "$@"
}

ANSWER="I recommend a systemd timer. $(head -c 600 /dev/zero | tr '\0' 'a')"
WRONG_LINE='WRONG | https://docs.syncthing.net/users/syncing.html | .tmp means stuck -- every transfer writes one'

out="$(event "why is sync stuck" "fix it" "$ANSWER one" | rec_run "$WRONG_LINE")"
check "script: reports a sourced WRONG line" "$(contains "$out" "$WRONG_LINE")"
check "script: has the header" "$(contains "$out" "An independent check of the recommendations in an earlier answer found problems:")"
check "script: asks for Revised:" "$(contains "$out" "Revised: <recommendation>")"
check "script: asks for Kept:" "$(contains "$out" "Kept: <recommendation>")"
check "script: says it is about an earlier answer" "$(contains "$out" "earlier answer")"
check "script: logs rec_found" "$(contains "$(last_log)" " pi rec_found ")"
check "script: logs the WRONG count" "$(contains "$(last_log)" "wrong=1")"
check "prompt: latest request judged" "$(contains "$(slurp "$TMP/stdin")" $'LATEST REQUEST:\n<<<\nfix it')"
check "prompt: earlier requests are context" "$(contains "$(slurp "$TMP/stdin")" $'EARLIER REQUESTS (context only):\n<<<\nwhy is sync stuck')"
prompt="$(slurp "$TMP/stdin")"
local_at="${prompt%%memory/*}"
official_at="${prompt%%official documentation*}"
check "prompt: local sources first" "$([ "${#local_at}" -lt "${#official_at}" ] && [ "$(contains "$prompt" "docs/")" = yes ] && echo yes || echo no)"

unsourced="$(event "q" "$ANSWER two" | rec_run 'WRONG |  | x -- y')"
check "script: an unsourced line is dropped" "$(contains "$unsourced" "verify-final: recommendations hold")"
check "script: dropped line logged rec_clean" "$(contains "$(last_log)" " pi rec_clean ")"
check "script: dropped count logged" "$(contains "$(last_log)" "dropped=1")"

none="$(event "q" "$ANSWER three" | rec_run "NO_RECOMMENDATIONS")"
check "script: NO_RECOMMENDATIONS prints no recommendations" "$(contains "$none" "verify-final: no recommendations")"
check "script: NO_RECOMMENDATIONS logs rec_none" "$(contains "$(last_log)" " pi rec_none ")"

clean="$(event "q" "$ANSWER four" | rec_run "NO_FINDINGS")"
check "script: NO_FINDINGS prints recommendations hold" "$(contains "$clean" "verify-final: recommendations hold")"
check "script: NO_FINDINGS logs rec_clean" "$(contains "$(last_log)" " pi rec_clean ")"
again="$(event "q" "$ANSWER four" | rec_run "NO_FINDINGS")"
check "cache: a clean answer is not re-checked" "$([ ! -e "$TMP/stdin" ] && echo yes || echo no)"
check "cache: logged rec_cached" "$(contains "$(last_log)" " pi rec_cached ")"
check "cache: still reports recommendations hold" "$(contains "$again" "recommendations hold")"

bad="$(event "q" "$ANSWER five" | rec_run "thinking...")"
check "error: no verdict and no sentinel" "$(contains "$bad" "verify-final: recommendation check could not run")"
check "error: logged rec_error" "$(contains "$(last_log)" " pi rec_error ")"

short="$(event "q" "too short" | rec_run "$WRONG_LINE")"
check "minimum: a short answer is skipped" "$([ ! -e "$TMP/stdin" ] && echo yes || echo no)"
check "minimum: logged rec_skip_short" "$(contains "$(last_log)" " pi rec_skip_short ")"
check "minimum: reports nothing to check" "$(contains "$short" "nothing to check")"

off="$(event "q" "$ANSWER six" | VERIFY_RECOMMEND=0 rec_run "$WRONG_LINE")"
check "off: VERIFY_RECOMMEND=0 prints off" "$(contains "$off" "verify-final: recommendation check off")"
check "off: checker not called" "$([ ! -e "$TMP/stdin" ] && echo yes || echo no)"

event "q" "$ANSWER seven" | rec_run "NO_FINDINGS" >/dev/null
check "argv: no web tools folder means no web_search" "$(lacks "$(slurp "$TMP/argv")" "web_search")"
check "argv: no web tools folder keeps the four local tools" "$(contains "$(slurp "$TMP/argv")" "read,grep,find,ls")"
check "prompt: says web search is unavailable" "$(contains "$(slurp "$TMP/stdin")" "Web search is not available")"
check "log: web=0 without the folder" "$(contains "$(last_log)" "web=0")"

mkdir -p "$TMP/home/.pi/agent/extensions/rpiv-web-tools"
event "q" "$ANSWER eight" | rec_run "NO_FINDINGS" >/dev/null
argv="$(slurp "$TMP/argv")"
check "argv: loads the web tools extension" "$(contains "$argv" $'-e\n'"$TMP/home/.pi/agent/extensions/rpiv-web-tools")"
check "argv: web tools enabled" "$(contains "$argv" "read,grep,find,ls,web_search,web_fetch")"
check "argv: still no other extensions" "$(contains "$argv" "--no-extensions")"
check "env: search provider is exa" "$([ "$(slurp "$TMP/env")" = exa ] && echo yes || echo no)"
check "prompt: states the search budget" "$(contains "$(slurp "$TMP/stdin")" "at most 3 web_search")"
check "prompt: states the fetch budget" "$(contains "$(slurp "$TMP/stdin")" "at most 3 web_fetch")"
check "log: web=1 with the folder" "$(contains "$(last_log)" "web=1")"

for f in "${failures[@]+"${failures[@]}"}"; do echo "FAIL: $f" >&2; done
echo "verify-final-recommend: $pass passed, ${#failures[@]} failed"
[ "${#failures[@]}" -eq 0 ]
