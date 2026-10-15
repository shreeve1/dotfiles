#!/usr/bin/env bash
# Re-vendor the language standards for post-work-cleanup from a pinned upstream commit.
#
# Stages the whole set under a temp directory, validates it, then swaps it in, so a failed fetch or a
# partial copy never replaces a good tree. Leaves the locally authored content alone:
# references/standards/_INDEX.md, references/standards/common/_INDEX.md, powershell/ and shell/.
#
# Update COMMIT to move the pin, then update SOURCES.md.
set -euo pipefail

UPSTREAM="https://github.com/HoangNguyen0403/agent-skills-standard"
COMMIT="4bb499408a18f87f0efc5bf89325dec61432b54f"

# Upstream-managed language categories. Intentionally bounded: when vendoring a new category, add it here
# and to SOURCES.md and references/standards/_INDEX.md.
CATEGORIES=(python typescript javascript)
COMMON_SUBSET=(common-best-practices common-error-handling common-performance-engineering \
  common-security-standards common-code-review common-documentation common-debugging common-git-collaboration)

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DST="$SKILL_DIR/references/standards"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
STAGE="$TMP/stage"

git init -q "$TMP/repo"
git -C "$TMP/repo" remote add origin "$UPSTREAM"
git -C "$TMP/repo" fetch -q --depth 1 --filter=blob:none origin "$COMMIT"
git -C "$TMP/repo" sparse-checkout init --cone
git -C "$TMP/repo" sparse-checkout set skills
git -C "$TMP/repo" checkout -q FETCH_HEAD
SRC="$TMP/repo/skills"

# Copy one skill dir into the staged tree: rules + references only, SKILL.md -> RULES.md. `cp -r` fails
# loudly under `set -e`, so a copy error aborts the refresh instead of being swallowed.
copy_skill() {
  local cat="$1" skill="$2"
  local dest="$STAGE/$cat/$skill"
  cp -r "$SRC/$cat/$skill" "$dest"
  rm -rf "$dest/scripts" "$dest/assets" "$dest/evals" "$dest/LICENSE"
  if [ -f "$dest/SKILL.md" ]; then
    mv "$dest/SKILL.md" "$dest/RULES.md"
  fi
}

# 1. Stage every upstream-managed category.
for cat in "${CATEGORIES[@]}"; do
  mkdir -p "$STAGE/$cat"
  cp "$SRC/$cat/_INDEX.md" "$STAGE/$cat/_INDEX.md"
  if [ -d "$SRC/$cat/references" ]; then
    cp -r "$SRC/$cat/references" "$STAGE/$cat/references"
  fi
  for skill in "$SRC/$cat"/*/; do
    name="$(basename "$skill")"
    if [ "$name" != "references" ]; then
      copy_skill "$cat" "$name"
    fi
  done
  # Upstream _INDEX.md points at SKILL.md; rewrite to RULES.md (portable, no `sed -i`).
  sed 's|/SKILL\.md|/RULES.md|g' "$STAGE/$cat/_INDEX.md" > "$STAGE/$cat/_INDEX.md.tmp"
  mv "$STAGE/$cat/_INDEX.md.tmp" "$STAGE/$cat/_INDEX.md"
done

mkdir -p "$STAGE/common"
for skill in "${COMMON_SUBSET[@]}"; do
  copy_skill common "$skill"
done

# 2. Validate the staged tree before touching the live one.
fail=0
for cat in "${CATEGORIES[@]}"; do
  for skill in "$STAGE/$cat"/*/; do
    if [ "$(basename "$skill")" = "references" ]; then
      continue
    fi
    if [ ! -f "$skill/RULES.md" ]; then
      echo "missing RULES.md: $skill" >&2
      fail=1
    fi
  done
done
for skill in "${COMMON_SUBSET[@]}"; do
  if [ ! -f "$STAGE/common/$skill/RULES.md" ]; then
    echo "missing RULES.md: common/$skill" >&2
    fail=1
  fi
done
if [ "$fail" -ne 0 ]; then
  echo "staged tree invalid; live tree untouched" >&2
  exit 1
fi

# 3. Swap in. Replace each language category wholesale; for common remove only the vendored skill dirs so
#    the locally authored common/_INDEX.md survives, and so a skill dropped from COMMON_SUBSET is removed.
for cat in "${CATEGORIES[@]}"; do
  rm -rf "$DST/$cat"
  mv "$STAGE/$cat" "$DST/$cat"
done
mkdir -p "$DST/common"
find "$DST/common" -mindepth 1 -maxdepth 1 -type d -exec rm -rf {} +
for skill in "${COMMON_SUBSET[@]}"; do
  mv "$STAGE/common/$skill" "$DST/common/$skill"
done

cp "$TMP/repo/LICENSE" "$DST/LICENSE"

echo "Re-vendored standards from $COMMIT into $DST"
echo "Left untouched (locally authored): references/standards/_INDEX.md, references/standards/common/_INDEX.md, powershell/, shell/."
