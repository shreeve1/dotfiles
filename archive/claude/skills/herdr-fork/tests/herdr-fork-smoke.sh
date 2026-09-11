#!/usr/bin/env bash
set -eu

repo=$(cd "$(dirname "$0")/../../../.." && pwd)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
mkdir -p "$tmp/bin" "$tmp/quote'path"

cat >"$tmp/bin/herdr" <<'STUB'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$HERDR_TEST_LOG"
case "$1 $2" in
  'tab create') printf '%s\n' '{"result":{"tab":{"tab_id":"wT:t1"},"root_pane":{"pane_id":"wT:p1"}}}' ;;
  'pane run') bash -c "$4" ;;
esac
STUB
cat >"$tmp/bin/pi" <<'STUB'
#!/usr/bin/env bash
printf '%s\n' "$*" > "$HERDR_PI_LOG"
cp "$2" "$HERDR_CAPTURE"
STUB
chmod +x "$tmp/bin/herdr" "$tmp/bin/pi"

session="$tmp/2026-08-09T00-00-00-000Z_deadbeef-test.jsonl"
printf '%s\n' \
  '{"message":{"role":"user","content":"keep"}}' \
  '{"message":{"role":"assistant","content":"keep"}}' \
  '{"message":{"role":"user","content":"invoke"}}' >"$session"

out=$(PATH="$tmp/bin:$PATH" TMPDIR="$tmp/quote'path" \
  HERDR_TEST_LOG="$tmp/herdr.log" HERDR_PI_LOG="$tmp/pi.log" HERDR_CAPTURE="$tmp/capture.jsonl" \
  HERDR_ENV=1 HERDR_WORKSPACE_ID=wT PI_SESSION_FILE="$session" "$repo/bin/herdr-fork")

grep -q '^tab create --workspace wT .* --no-focus$' "$tmp/herdr.log"
grep -q '^tab rename wT:t1 fork: deadbeef$' "$tmp/herdr.log"
grep -q '^--fork ' "$tmp/pi.log"
[ "$(wc -l <"$tmp/capture.jsonl")" -eq 2 ]
grep -q 'parked snapshot in tab wT:t1' <<<"$out"
[ -z "$(find "$tmp/quote'path" -type f -print -quit)" ]

if PATH="$tmp/bin:$PATH" TMPDIR="$tmp/missing" \
  HERDR_TEST_LOG="$tmp/herdr.log" HERDR_PI_LOG="$tmp/pi.log" HERDR_CAPTURE="$tmp/capture.jsonl" \
  HERDR_ENV=1 HERDR_WORKSPACE_ID=wT PI_SESSION_FILE="$session" "$repo/bin/herdr-fork" >"$tmp/error.log" 2>&1; then
  echo 'FAIL: invalid TMPDIR should fail' >&2
  exit 1
fi
grep -q 'could not create temporary session copy' "$tmp/error.log"
[ "$(grep -c '^pane run ' "$tmp/herdr.log")" -eq 1 ]

echo 'herdr-fork smoke: PASS'
