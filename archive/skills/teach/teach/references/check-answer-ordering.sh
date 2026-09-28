#!/usr/bin/env bash
# Guard for k1002: enforce that the teach quiz-authoring rule
# (.claude/skills/teach/references/quiz-ui.md) carries the strong
# answer-ordering instruction and no longer carries the weak, leak-prone
# wording that let the correct option sit first.
#
# Exit 0 when all three assertions hold; exit 1 (with a single-line message
# naming the failed assertion) on any failure.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="$SCRIPT_DIR/quiz-ui.md"

if [ ! -f "$TARGET" ]; then
  printf 'FAIL: target file missing: %s\n' "$TARGET"
  exit 1
fi

fail() {
  printf 'FAIL: %s\n' "$1"
  exit 1
}

assert_present() {
  if ! grep -F -q "$1" "$TARGET"; then
    fail "strong rule phrase '$1' missing from $TARGET"
  fi
}

assert_absent() {
  if grep -F -q "$1" "$TARGET"; then
    fail "weak leak-prone phrase '$1' still present in $TARGET"
  fi
}

assert_present "Randomise where the correct option sits"
assert_present "never put the correct option first"
assert_absent "put it first on purpose"

exit 0
