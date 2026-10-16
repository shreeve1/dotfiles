#!/usr/bin/env bash
# The repo's check command: the whole test suite plus the two cheap structural
# guards for the drift this suite exists to catch.
#
#   bash tests/run-all.sh
#   TEST_TIMEOUT=60 bash tests/run-all.sh    # cap each file (default 900s)
#
# Exits non-zero when a test file fails, when a shell file pi-lens will reformat
# on its next edit has drifted from .editorconfig, or when a test file is
# sitting untracked while a commit is staged.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" || exit 1

TEST_TIMEOUT="${TEST_TIMEOUT:-900}"
# The surface this suite guards, and the set pi-lens reformats on edit. Widen
# once the rest of the live tree is swept (bin/*, dsh-repro/, omarchy/ drift).
FORMAT_TARGETS=(tests/run-all.sh tests/*.test.sh .agents/skills/ralph/*.sh)
TEST_FILES=(tests/*.test.sh .agents/skills/ralph/tests/*.sh)

PASS=0
FAILN=0
FAILED=()

ok() { PASS=$((PASS + 1)); }
fail() {
  FAILN=$((FAILN + 1))
  FAILED+=("$1")
  printf 'FAIL: %s\n' "$1" >&2
  [ -n "${2-}" ] && printf '  %s\n' "$2" >&2
  return 0
}

# --- 1. the suite -----------------------------------------------------------
# Capture to a file, never to `$(...)`. A test that leaves a background process
# holding its stdout (gralph's review watchdog used to leak a `sleep 600` per
# review) keeps a pipe open after the test exits, and a pipe capture blocks on
# it for the whole timeout.
for t in "${TEST_FILES[@]}"; do
  [ -f "$t" ] || continue
  start=$(date +%s)
  log="$(mktemp)"
  if timeout "$TEST_TIMEOUT" bash "$t" >"$log" 2>&1; then
    ok
    printf 'ok   %3ss  %s\n' "$(($(date +%s) - start))" "$t"
  else
    fail "$t" "$(tail -8 "$log")"
    printf 'FAIL %3ss  %s\n' "$(($(date +%s) - start))" "$t"
  fi
  rm -f "$log"
done

# --- 2. shell formatting ----------------------------------------------------
# pi-lens runs `shfmt -w` on every .sh/.bash it edits, so a file that is not
# already conforming comes back as a whole-file reflow mixed into the real
# change. Catch them here instead of in someone's diff.
if ! command -v shfmt >/dev/null 2>&1; then
  fail "shfmt is not on PATH; cannot check shell formatting"
else
  drifted="$(shfmt -l "${FORMAT_TARGETS[@]}" 2>/dev/null || true)"
  if [ -z "$drifted" ]; then
    ok
  else
    fail "shell formatting has drifted from .editorconfig" "$drifted
  fix: shfmt -w $(printf '%s' "$drifted" | tr '\n' ' ')"
  fi
fi

# --- 3. a test file must not be silently left out of a commit ---------------
# .gitignore once excluded tests/*, so `git add -A` could skip a brand-new test
# file and the commit still looked complete. Guard the class, not the instance.
if [ -n "$(git diff --cached --name-only 2>/dev/null)" ]; then
  missing=""
  for t in "${TEST_FILES[@]}"; do
    [ -f "$t" ] || continue
    if ! git ls-files --error-unmatch "$t" >/dev/null 2>&1; then missing="$missing $t"; fi
  done
  if [ -z "$missing" ]; then
    ok
  else
    fail "a test file exists but is untracked while a commit is staged" "stage it:$missing"
  fi
fi

# --- summary ----------------------------------------------------------------
echo
if [ "$FAILN" -eq 0 ]; then
  echo "run-all: $PASS passed, 0 failed"
  exit 0
fi
echo "run-all: $PASS passed, $FAILN failed"
for f in ${FAILED[@]+"${FAILED[@]}"}; do echo "  - $f"; done
exit 1
