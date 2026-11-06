#!/usr/bin/env bash
# No-Git mode must adopt configs without touching sources and restrict every fix
# to explicit regular files in the chosen workspace, never a Git checkout.
set -euo pipefail
ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
export HOME="$TMP/home"
mkdir -p "$HOME/.local/bin" "$TMP/tools/bin" "$TMP/tools/.config/style"
# Use installed pinned binaries with an isolated HOME and ownership list.
for tool in shfmt shellcheck ruff biome markdownlint-cli2; do
  binary=$(command -v "$tool")
  ln -s "$binary" "$HOME/.local/bin/$tool"
done
cp "$ROOT/bin/style-init" "$ROOT/bin/style-check" "$TMP/tools/bin/"
if [ -f "$ROOT/bin/style-workspace.sh" ]; then cp "$ROOT/bin/style-workspace.sh" "$TMP/tools/bin/"; fi
cp -r "$ROOT/.config/style/template" "$ROOT/.config/style/tools.env" "$TMP/tools/.config/style/"
INIT="$TMP/tools/bin/style-init"
CHECK="$TMP/tools/bin/style-check"
workspace="$HOME/work space"
mkdir -p "$workspace"
printf 'path:~/work space\n' >"$TMP/tools/.config/style/owned-repos"
expect() {
  local want="$1" rc=0
  shift
  output=$(bash "$@" 2>&1) || rc=$?
  if [ "$rc" != "$want" ]; then
    printf 'FAIL expected exit %s, got %s: %s\n%s\n' "$want" "$rc" "$*" "$output" >&2
    exit 1
  fi
}
# No-Git cannot silently use cwd or reinterpret an option as the root.
expect 2 "$CHECK" --no-git
expect 2 "$INIT" --no-git
expect 2 "$CHECK" --no-git --fix
expect 2 "$INIT" --no-git "$TMP/absent"
expect 2 "$INIT" --no-git "$workspace" extra-root
expect 2 "$CHECK" --no-git "$workspace" --fix
printf 'def probe( value ):\n return {"value":value}\n' >"$workspace/a file.py"
printf '#!/bin/sh\nif true;then\necho ok\nfi\n' >"$workspace/a file.sh"
printf '# Document\n\n##Bad heading\n' >"$workspace/a file.md"
printf 'const value={a:1};\nconsole.log(value)\n' >"$workspace/a file.ts"
cp "$workspace/a file.py" "$TMP/original.py"
expect 3 "$INIT" --no-git "$workspace" --check
[[ "$output" == *ruff.toml* && "$output" == *biome.json* && "$output" == *.markdownlint-cli2.jsonc* ]]
test ! -e "$workspace/.editorconfig"
expect 0 "$INIT" --no-git "$workspace"
for config in .editorconfig ruff.toml biome.json .markdownlint-cli2.jsonc; do test -f "$workspace/$config"; done
cmp "$workspace/a file.py" "$TMP/original.py"
test ! -e "$workspace/.git"
test ! -e "$workspace/.git-blame-ignore-revs"
printf '\n# local customization\n' >>"$workspace/ruff.toml"
cp "$workspace/ruff.toml" "$TMP/original-ruff.toml"
expect 0 "$INIT" --no-git "$workspace"
cmp "$workspace/ruff.toml" "$TMP/original-ruff.toml"
expect 0 "$INIT" --no-git "$workspace" --check
expect 1 "$CHECK" --no-git "$workspace" --format-only
cp "$workspace/a file.md" "$TMP/original.md"
expect 0 "$CHECK" --no-git "$workspace" --fix --format-only 'a file.py' 'a file.sh' 'a file.ts' 'a file.md'
expect 0 "$CHECK" --no-git "$workspace" --format-only
cmp "$workspace/a file.md" "$TMP/original.md"
expect 1 "$CHECK" --no-git "$workspace" 'a file.md'
[[ "$output" == *MD018* ]]
# Validate the entire explicit list before formatting any member.
cp "$TMP/original.py" "$workspace/a file.py"
expect 2 "$CHECK" --no-git "$workspace" --fix --format-only 'a file.py' missing.py
cmp "$workspace/a file.py" "$TMP/original.py"
expect 2 "$CHECK" --no-git "$workspace" --fix --format-only .
printf 'bad python [\n' >"$TMP/outside.py"
ln -s "$TMP/outside.py" "$workspace/link.py"
ln -s "$TMP" "$workspace/linked-dir"
expect 2 "$CHECK" --no-git "$workspace" --fix --format-only link.py
expect 2 "$CHECK" --no-git "$workspace" --fix --format-only linked-dir/outside.py
expect 2 "$CHECK" --no-git "$workspace" --fix --format-only "$TMP/outside.py"
expect 0 "$CHECK" --no-git "$workspace" --fix --format-only 'a file.py'
# Exclusions cover both enumeration and named files, including nested caches.
for dir in node_modules .venv venv __pycache__ .stversions .cache .ruff_cache .pytest_cache .mypy_cache .superpowers vendor dist build tmp artifacts .sessions .sync .pi/fabric nested/node_modules; do
  mkdir -p "$workspace/$dir"
  printf 'invalid python [\n' >"$workspace/$dir/ignored.py"
done
mkdir -p "$workspace/skip"
printf 'invalid python [\n' >"$workspace/skip/ignored.py"
printf 'skip/**\n' >"$workspace/.styleignore"
expect 0 "$CHECK" --no-git "$workspace" --format-only
expect 0 "$CHECK" --no-git "$workspace" --format-only node_modules/ignored.py skip/ignored.py
# Literal metacharacters and leading hyphens are filenames, not tool flags/globs.
printf 'value={"a":1}\n' >"$workspace/-[literal].py"
expect 0 "$CHECK" --no-git "$workspace" --fix --format-only -- '-[literal].py'
expect 0 "$CHECK" --no-git "$workspace" --format-only -- '-[literal].py'
# Syntax/tool errors must never look clean in format-only mode.
printf 'invalid python [\n' >"$workspace/broken.py"
expect 1 "$CHECK" --no-git "$workspace" --format-only broken.py
rm "$workspace/broken.py"
printf '#!/bin/sh\nif\n' >"$workspace/broken.sh"
expect 1 "$CHECK" --no-git "$workspace" --format-only broken.sh
rm "$workspace/broken.sh"
# Unowned init cannot write; symlink config must never be overwritten.
mkdir "$HOME/unowned"
expect 4 "$INIT" --no-git "$HOME/unowned"
test ! -e "$HOME/unowned/.editorconfig"
# Git checkout bypass is refused before config copying, even when dirty.
git init -q "$workspace/git-child"
printf 'dirty\n' >"$workspace/git-child/file"
expect 2 "$INIT" --no-git "$workspace/git-child"
expect 2 "$CHECK" --no-git "$workspace/git-child" --fix --format-only file
expect 2 "$CHECK" --no-git "$workspace/git-child/subdirectory"
test ! -e "$workspace/git-child/.editorconfig"
# Language discovery shares exclusions; ignored languages do not add configs.
other="$HOME/only docs"
mkdir -p "$other/node_modules"
printf 'path:~/only docs\n' >>"$TMP/tools/.config/style/owned-repos"
printf '# Note\n' >"$other/note.md"
printf 'invalid [\n' >"$other/node_modules/ignored.py"
expect 0 "$INIT" --no-git "$other"
test ! -e "$other/ruff.toml"
test -f "$other/.markdownlint-cli2.jsonc"
# The chosen root is not an excluded child directory, even if named "build".
root_named_build="$HOME/build"
mkdir "$root_named_build"
printf 'path:~/build\n' >>"$TMP/tools/.config/style/owned-repos"
printf 'def probe( value ):\n return value\n' >"$root_named_build/probe.py"
expect 3 "$INIT" --no-git "$root_named_build" --check
[[ "$output" == *ruff.toml* ]]
expect 0 "$INIT" --no-git "$root_named_build"
expect 1 "$CHECK" --no-git "$root_named_build" --format-only
# Environment-limited Git discovery must not bypass the structural Git guard.
mkdir -p "$workspace/git-child/deep"
(
  export GIT_CEILING_DIRECTORIES="$workspace/git-child"
  expect 2 "$CHECK" --no-git "$workspace/git-child/deep" --format-only
  expect 2 "$INIT" --no-git "$workspace/git-child/deep"
)
git init --bare -q "$HOME/bare"
expect 2 "$CHECK" --no-git "$HOME/bare" --format-only
# Existing dangling configs are data, never missing files to replace.
rm "$other/.editorconfig"
ln -s "$TMP/missing-editorconfig" "$other/.editorconfig"
expect 2 "$INIT" --no-git "$other"
test -L "$other/.editorconfig"
test ! -e "$TMP/missing-editorconfig"
printf 'ok: no-Git adoption, report checks, named fixes and safety boundaries\n'
