#!/usr/bin/env bash
# style-init --check must not misreport a language as absent in a big repo:
# has_lang once used "grep -q" under pipefail, so grep exited at the first match,
# git got SIGPIPE and the pipeline failed.
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

repo="$TMP/repo"
git init -q "$repo"
git -C "$repo" remote add origin git@github.com:shreeve1/style-init-test.git
printf '%s\n' 'root = true' >"$repo/.editorconfig"
printf '%s\n' '# doc' >"$repo/README.md"
git -C "$repo" add README.md
blob=$(git -C "$repo" hash-object -w /dev/null)
# Enough long paths that git is still writing when grep has found its first match.
for i in $(seq 1 4000); do
  printf '100644 %s\t%s\n' "$blob" "some/long/directory/name/for/padding/module_$i.py"
done | git -C "$repo" update-index --add --index-info

for run in $(seq 1 15); do
  rc=0
  out=$(bash "$ROOT/bin/style-init" --check "$repo" 2>&1) || rc=$?
  if [ "$rc" != 3 ] || [[ "$out" != *"ruff.toml"* ]] || [[ "$out" != *".markdownlint-cli2.jsonc"* ]]; then
    echo "run $run: rc=$rc: $out" >&2
    exit 1
  fi
done
echo "ok: style-init --check sees every language in a large repo"
