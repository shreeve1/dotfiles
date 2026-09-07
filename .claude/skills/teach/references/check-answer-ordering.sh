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

if ! grep -F -q "Randomise where the correct option sits" "$TARGET"; then
  fail "strong rule phrase 'Randomise where the correct option sits' missing from $TARGET"
fi

if ! grep -F -q "never put the correct option first" "$TARGET"; then
  fail "strong rule phrase 'never put the correct option first' missing from $TARGET"
fi

if grep -F -q "put it first on purpose" "$TARGET"; then
  fail "weak leak-prone phrase 'put it first on purpose' still present in $TARGET"
fi

exit 0