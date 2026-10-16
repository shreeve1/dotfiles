#!/usr/bin/env bash
# The repo's check command: the test suite plus the cheap structural guards for
# the drift the suite exists to catch.
#
#   bash tests/run-all.sh          # everything (the full check, ~2.5 min)
#   bash tests/run-all.sh --fast   # guards + only the test files this branch
#                                  # changed (seconds; what the pre-push hook runs)
#   TEST_TIMEOUT=60 bash tests/run-all.sh
#
# Two modes, deliberately. The guard against a red main is the structural part
# (formatting + a test file left out of a commit) plus running whatever test
# file you just changed; that is cheap enough to run on every push. The full
# suite is a maintenance cost, not a guard -- run it before declaring work done.
# Do not widen --fast into the full run: a hook that takes minutes gets skipped
# with `--no-verify`, and that is exactly how the suite went red for 22 commits.
#
# Exits non-zero when a test file fails, when a shell file pi-lens will reformat
# on its next edit has drifted from .editorconfig, or when a test file is
# sitting untracked while a commit is staged (or at all, in --fast).
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" || exit 1

MODE=full
case "${1-}" in
--fast) MODE=fast ;;
--help | -h)
  sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'
  exit 0
  ;;
"") ;;
*)
  echo "unknown argument: $1 (expected --fast, --help, or nothing)" >&2
  exit 2
  ;;
esac

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

# Test files this branch touched, against the last fetched remote base. A stale
# origin/main only widens the set, which errs safe.
changed_test_files() {
  local base
  base="$(git merge-base HEAD origin/main 2>/dev/null || true)"
  {
    [ -n "$base" ] && git diff --name-only "$base" HEAD
    git diff --name-only
    git diff --name-only --cached
  } 2>/dev/null | sort -u | while IFS= read -r f; do
    case "$f" in
    tests/*.test.sh | .agents/skills/ralph/tests/*.sh)
      [ -f "$f" ] && printf '%s\n' "$f"
      ;;
    esac
  done
}

SELECTED=()
if [ "$MODE" = fast ]; then
  while IFS= read -r f; do
    [ -n "$f" ] && SELECTED+=("$f")
  done < <(changed_test_files)
  if [ "${#SELECTED[@]}" -eq 0 ]; then
    echo "run-all --fast: no test file changed on this branch; running the guards only"
  fi
else
  SELECTED=("${TEST_FILES[@]}")
fi

# --- 1. the suite -----------------------------------------------------------
# Capture to a file, never to `$(...)`. A test that leaves a background process
# holding its stdout (gralph's review watchdog used to leak a `sleep 600` per
# review) keeps a pipe open after the test exits, and a pipe capture blocks on
# it for the whole timeout.
for t in ${SELECTED[@]+"${SELECTED[@]}"}; do
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
# --fast runs pre-push, where the commit already exists, so check unconditionally.
if [ -n "$(git diff --cached --name-only 2>/dev/null)" ] || [ "$MODE" = fast ]; then
  missing=""
  for t in "${TEST_FILES[@]}"; do
    [ -f "$t" ] || continue
    if ! git ls-files --error-unmatch "$t" >/dev/null 2>&1; then missing="$missing $t"; fi
  done
  if [ -z "$missing" ]; then
    ok
  else
    fail "a test file exists but is untracked" "stage it:$missing"
  fi
fi

# --- summary ----------------------------------------------------------------
echo
if [ "$FAILN" -eq 0 ]; then
  if [ "$MODE" = fast ]; then
    echo "run-all --fast: $PASS passed, 0 failed (run the full suite before calling work done)"
  else
    echo "run-all: $PASS passed, 0 failed"
  fi
  exit 0
fi
echo "run-all: $PASS passed, $FAILN failed"
for f in ${FAILED[@]+"${FAILED[@]}"}; do echo "  - $f"; done
exit 1
