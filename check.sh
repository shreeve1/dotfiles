#!/usr/bin/env bash
# Read-only regression gate for this repo. Never writes, never touches $HOME.
# This is the `gate:` command the dsh build board runs at Verify.
#
# Checks, in order:
#   1. every link_path/seed_path source named in install.sh exists in the repo
#   2. tracked shell files parse (bash -n)
#   3. tracked JSON files parse
#   4. installed ~/... symlinks that point into this repo still resolve
#
# Exit 0 = clean. Exit 1 = at least one failure, each printed as "FAIL: ...".

set -uo pipefail

DOTFILES_DIR="${DOTFILES_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"
cd "$DOTFILES_DIR" || exit 1

fails=0
fail() {
  printf 'FAIL: %s\n' "$1"
  fails=$((fails + 1))
}

# ─── 1. install.sh sources resolve ─────────────────────────
# Lines like: link_path "src" "target"  /  seed_path "src" "target"
# Sources built from a variable (e.g. "$skill_name") are skipped — their value
# is only known at install time.
#
# Only TRACKED sources are required to exist. This gate runs inside a git
# worktree (that is where Verify runs it), and a worktree materialises only
# tracked content — so an untracked or gitignored source is absent there BY
# CONSTRUCTION, not because anything regressed. Demanding it made the gate exit
# 1 on a pristine tree, which would have bounced every card out of Verify
# forever, blaming files the card never touched and that cannot be committed.
# install.sh already agrees with this reading: a missing source prints
# "skip: missing source" and returns 0, so it is not an install failure either.
# A TRACKED source that is missing is still a hard failure — that is the real
# regression this check exists to catch.
checked_sources=0
skipped_untracked=0
while read -r src; do
  case "$src" in
  *'$'*) continue ;;
  esac
  if ! git ls-files --error-unmatch "$src" >/dev/null 2>&1; then
    skipped_untracked=$((skipped_untracked + 1))
    continue
  fi
  checked_sources=$((checked_sources + 1))
  [ -e "$src" ] || fail "install.sh references missing tracked source: $src"
done < <(grep -oP '^\s*(link_path|seed_path)\s+"\K[^"]+' install.sh)

if [ "$checked_sources" -eq 0 ]; then
  fail "parsed 0 tracked link_path sources from install.sh — the parser is broken, not the repo"
fi

# ─── 2. shell syntax ───────────────────────────────────────
# Selected by CONTENT, not extension. Extension globbing missed exactly the
# files that matter most: bin/* are extension-less (pi-delegate carries every
# Fusion mutation), and .zshrc/.bashrc have neither extension nor shebang
# because they are sourced, not executed. Demonstrated 2026-09-03: a syntax
# error in either passed the old gate with exit 0, and a broken .bashrc breaks
# every new shell on both machines.
#
# ONE list, built once, used for both the check and its own coverage guard --
# two copies of the selector would drift apart, which is the defect class this
# repo has been filing cards about all session.
shell_files() {
  {
    git ls-files '*.sh' '*.bash' '.bashrc' '.zshrc' '.bash_profile' '.zprofile'
    git grep -l -I -E '^#!.*\b(bash|sh|dash)\b' -- ':!*.md' 2>/dev/null
  } | sort -u
}

checked_sh=0
while read -r f; do
  [ -n "$f" ] && [ -f "$f" ] || continue
  checked_sh=$((checked_sh + 1))
  err="$(bash -n "$f" 2>&1)" || fail "shell syntax: $f: $err"
done < <(shell_files)

# A typo in the selector would silently shrink coverage to zero and still
# report ok. Assert it still reaches the extension-less files this check
# exists for.
while read -r must; do
  [ -e "$must" ] || continue
  shell_files | grep -qxF "$must" ||
    fail "shell-file scan no longer reaches $must — the selector is broken, not the repo"
done <<'MUST'
bin/pi-delegate
.bashrc
.zshrc
MUST

# ─── 3. JSON parses ────────────────────────────────────────
# lazy: jq is already installed and used elsewhere in this repo.
# .template files included: seed_path copies them verbatim into live config,
# so a malformed one breaks a fresh machine silently.
checked_json=0
while read -r f; do
  checked_json=$((checked_json + 1))
  err="$(jq empty "$f" 2>&1)" || fail "invalid JSON: $f: $err"
done < <(git ls-files '*.json' '*.json.template' | grep -v -e 'lock\.json$' -e '/node_modules/')

# ─── 4. currently-declared links still resolve ─────────────
# Scoped deliberately to the mappings install.sh declares TODAY. A link in
# $HOME pointing at a path install.sh no longer mentions is old residue, not a
# regression in the change under test — the gate must not fail on ambient state
# that no card caused. This still catches the case that matters: a repo file
# renamed here while the installed link still points at the old name.
dangling=0
while read -r pair; do
  src="${pair%%|*}"
  tgt="${pair##*|}"
  case "$src$tgt" in
  *'$'*) continue ;;
  esac
  target="$HOME/$tgt"
  [ -L "$target" ] || continue
  if [ ! -e "$target" ]; then
    fail "declared link is dangling: $target -> $(readlink "$target")"
    dangling=$((dangling + 1))
  fi
done < <(grep -oP '^\s*(link_path|seed_path)\s+"\K[^"]+"\s+"[^"]+' install.sh |
  sed 's/"[[:space:]]*"/|/')

printf 'checked: %d tracked install sources (%d untracked skipped), %d shell files, %d json files, %d dangling links\n' \
  "$checked_sources" "$skipped_untracked" "$checked_sh" "$checked_json" "$dangling"

if [ "$fails" -gt 0 ]; then
  printf '%d failure(s)\n' "$fails"
  exit 1
fi
printf 'ok\n'
