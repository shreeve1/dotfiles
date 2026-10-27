#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

starter="$TMP/starter"
dest="$TMP/destination with spaces"
mkdir -p "$starter/.agents/skills/personal-memory/scaffold" \
  "$starter/.agents/skills/memory-setup/nested" \
  "$starter/.agents/skills/memory-setup" \
  "$starter/.agents/skills/drawio/reference" \
  "$starter/.agents/skills/drawio/scripts" \
  "$dest/.agents/skills/personal-memory" \
  "$dest/.agents/skills/memory-setup" \
  "$dest/.agents/skills/drawio" \
  "$dest/.agents/skills/other"
printf '%s\n' personal-memory >"$starter/.agents/skills/personal-memory/SKILL.md"
printf '%s\n' scaffold >"$starter/.agents/skills/personal-memory/scaffold/x.md"
printf '%s\n' memory-setup >"$starter/.agents/skills/memory-setup/SKILL.md"
printf '%s\n' nested >"$starter/.agents/skills/memory-setup/nested/x.md"
printf '%s\n' drawio >"$starter/.agents/skills/drawio/SKILL.md"
printf '%s\n' format >"$starter/.agents/skills/drawio/reference/format.md"
printf '%s\n' script >"$starter/.agents/skills/drawio/scripts/drawio.mjs"
mkdir -p "$dest/.agents/skills/personal-memory/__pycache__"
printf '%s\n' destination-cache >"$dest/.agents/skills/personal-memory/__pycache__/x.pyc"
printf '%s\n' old >"$dest/.agents/skills/memory-setup/removed.md"
printf '%s\n' other >"$dest/.agents/skills/other/SKILL.md"
printf '%s\n' file >"$dest/.agents/skills/personal-memory/scaffold"
printf '%s\n' file >"$dest/.agents/skills/memory-setup/nested"
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
diff -r --exclude='__pycache__' \
  "$starter/.agents/skills/drawio" \
  "$dest/.agents/skills/drawio"
test ! -e "$dest/.agents/skills/memory-setup/removed.md"
test "$(cat "$dest/.agents/skills/other/SKILL.md")" = other
test "$(cat "$dest/.agents/skills/personal-memory/__pycache__/x.pyc")" = destination-cache
test -f "$dest/.agents/skills/personal-memory/scaffold/x.md"
test -f "$dest/.agents/skills/memory-setup/nested/x.md"
test -f "$dest/.agents/skills/drawio/reference/format.md"
test -f "$dest/.agents/skills/drawio/scripts/drawio.mjs"

outside="$TMP/outside.txt"
printf '%s\n' outside >"$outside"
ln -s "$outside" "$starter/.agents/skills/personal-memory/source-link"
cp -a "$dest" "$TMP/before-source-symlink"
if run_sync; then
  echo "source symlink unexpectedly succeeded" >&2
  exit 1
else
  status=$?
  test "$status" -eq 2
fi
diff -r --exclude='__pycache__' "$TMP/before-source-symlink" "$dest"
rm "$starter/.agents/skills/personal-memory/source-link"

outside_target="$TMP/outside-target.txt"
printf '%s\n' untouched >"$outside_target"
rm "$dest/.agents/skills/personal-memory/SKILL.md"
ln -s "$outside_target" "$dest/.agents/skills/personal-memory/SKILL.md"
run_sync
test -f "$dest/.agents/skills/personal-memory/SKILL.md"
test ! -L "$dest/.agents/skills/personal-memory/SKILL.md"
test "$(cat "$outside_target")" = untouched

cp -a "$dest" "$TMP/before-missing"
if run_sync "$TMP/missing"; then
  echo "missing starter unexpectedly succeeded" >&2
  exit 1
else
  status=$?
  test "$status" -eq 2
fi
diff -r "$TMP/before-missing" "$dest"

source_root_target="$TMP/source-root-target"
mkdir "$source_root_target"
printf '%s\n' source-root >"$source_root_target/SKILL.md"
mv "$starter/.agents/skills/memory-setup" "$starter/.agents/skills/memory-setup-real"
ln -s "$source_root_target" "$starter/.agents/skills/memory-setup"
cp -a "$dest" "$TMP/before-source-root"
if run_sync; then
  echo "source skill root symlink unexpectedly succeeded" >&2
  exit 1
else
  status=$?
  test "$status" -eq 2
fi
diff -r --exclude='__pycache__' "$TMP/before-source-root" "$dest"
rm "$starter/.agents/skills/memory-setup"
mv "$starter/.agents/skills/memory-setup-real" "$starter/.agents/skills/memory-setup"

destination_root_target="$TMP/destination-root-target"
mkdir "$destination_root_target"
printf '%s\n' outside >"$destination_root_target/untouched.txt"
rm -rf "$dest/.agents/skills/memory-setup"
ln -s "$destination_root_target" "$dest/.agents/skills/memory-setup"
if run_sync; then
  echo "destination skill root symlink unexpectedly succeeded" >&2
  exit 1
else
  status=$?
  test "$status" -eq 2
fi
test "$(cat "$destination_root_target/untouched.txt")" = outside

echo "sync-starter-skills tests: PASS"
