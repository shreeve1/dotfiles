#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

starter="$TMP/starter"
dest="$TMP/destination with spaces"
mkdir -p "$starter/.agents/skills/personal-memory/scaffold" \
  "$starter/.agents/skills/memory-setup" \
  "$dest/.agents/skills/personal-memory" \
  "$dest/.agents/skills/memory-setup" \
  "$dest/.agents/skills/other"
printf '%s\n' personal-memory >"$starter/.agents/skills/personal-memory/SKILL.md"
printf '%s\n' scaffold >"$starter/.agents/skills/personal-memory/scaffold/x.md"
printf '%s\n' memory-setup >"$starter/.agents/skills/memory-setup/SKILL.md"
printf '%s\n' old >"$dest/.agents/skills/memory-setup/removed.md"
printf '%s\n' other >"$dest/.agents/skills/other/SKILL.md"
mkdir "$starter/.agents/skills/personal-memory/__pycache__"
printf '%s\n' ignored >"$starter/.agents/skills/personal-memory/__pycache__/ignored.pyc"

run_sync() {
  python3 "$ROOT/bin/sync-starter-skills" --starter "${1:-$starter}" --dest "$dest"
}

run_sync
diff -r --exclude='__pycache__' \
  "$starter/.agents/skills/personal-memory" \
  "$dest/.agents/skills/personal-memory"
diff -r --exclude='__pycache__' \
  "$starter/.agents/skills/memory-setup" \
  "$dest/.agents/skills/memory-setup"
test ! -e "$dest/.agents/skills/memory-setup/removed.md"
test "$(cat "$dest/.agents/skills/other/SKILL.md")" = other
test ! -e "$dest/.agents/skills/personal-memory/__pycache__"

cp -a "$dest" "$TMP/before-missing"
if run_sync "$TMP/missing"; then
  echo "missing starter unexpectedly succeeded" >&2
  exit 1
else
  status=$?
  test "$status" -eq 2
fi
diff -r "$TMP/before-missing" "$dest"

echo "sync-starter-skills tests: PASS"
