#!/usr/bin/env bash
# full-gate-test — tests herdr-issue-frontier's scripts/full-gate.sh:
# command resolution (HERDR_FRONTIER_TEST_CMD → ./.herdr-frontier-gate) and
# pass/fail/opt-out semantics. (Auto-detect path is not exercised — it needs a
# real toolchain; env + file + opt-out cover the logic.)
#
# Run: bash full-gate-test.sh   ·   Exits 0 on pass, 1 on fail. Self-contained.
set -uo pipefail

SCRIPT="$(cd "$(dirname "$0")/.." && pwd)/scripts/full-gate.sh"
[[ -x "$SCRIPT" ]] || { echo "FAIL: full-gate.sh not found at $SCRIPT" >&2; exit 1; }
bash -n "$SCRIPT" || { echo "FAIL: bash -n full-gate.sh" >&2; exit 1; }

TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT; cd "$TMP"
pass=0; fail=0
ck() { if eval "$1"; then pass=$((pass+1)); else fail=$((fail+1)); echo "FAIL: $2" >&2; fi; }

# 1. env override runs the command and exits 0.
o=$(HERDR_FRONTIER_TEST_CMD="echo GATEOK" bash "$SCRIPT" 2>&1); rc=$?
ck "(( rc == 0 ))"      "env-override should exit 0"
ck "[[ \"\$o\" == *GATEOK* ]]" "env-override should run the command"

# 2. a FAILING gate command exits non-zero (the merge must abort).
HERDR_FRONTIER_TEST_CMD="exit 7" bash "$SCRIPT" >/dev/null 2>&1; rc=$?
ck "(( rc == 7 ))"      "failing gate should propagate non-zero exit"

# 3. opt-out: skipped, exit 0.
o=$(HERDR_FRONTIER_NO_GATE=1 bash "$SCRIPT" 2>&1); rc=$?
ck "(( rc == 0 ))"      "HERDR_FRONTIER_NO_GATE=1 should exit 0"
ck "[[ \"\$o\" == *skipped* ]]" "NO_GATE should print 'skipped'"

# 4. ./.herdr-frontier-gate file (first line) is used when env is unset.
printf 'echo FROMFILE\n' > .herdr-frontier-gate
o=$(bash "$SCRIPT" 2>&1); rc=$?
ck "(( rc == 0 ))"      "file gate should exit 0"
ck "[[ \"\$o\" == *FROMFILE* ]]" "file gate should run the file's command"
rm -f .herdr-frontier-gate

# 5. env takes priority over the file.
printf 'echo FROMFILE\n' > .herdr-frontier-gate
o=$(HERDR_FRONTIER_TEST_CMD="echo FROMENV" bash "$SCRIPT" 2>&1)
ck "[[ \"\$o\" == *FROMENV* ]]" "env should override .herdr-frontier-gate"
ck "[[ \"\$o\" != *FROMFILE* ]]" "env override should suppress the file command"
rm -f .herdr-frontier-gate

echo "full-gate-test: $pass passed, $fail failed"
(( fail == 0 )) || { echo "FAIL: full-gate.sh" >&2; exit 1; }
echo "PASS: full-gate.sh resolution + pass/fail/opt-out semantics."
