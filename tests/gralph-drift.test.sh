#!/usr/bin/env bash
# Board mode (bin/gralph --board) runs the driver-side drift check after a lane worker
# reports DONE, before the lane can land:
#   1. DRIFT: the lane does not land; it is recorded failed with sentinel blocked and
#      reason drift; the findings and the drifted commit sha are saved, the run's
#      output names the findings file, and the lane branch is removed
#   2. PASS: the lane lands as before
#   3. no spec: the reviewer is never called and the lane lands
#   4. a drift-blocked lane can be retried after the fix with --replan and then lands
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GRALPH="$ROOT/bin/gralph"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
command -v jq >/dev/null 2>&1 || {
  echo "FAIL: jq is required" >&2
  exit 1
}

PASS=0
FAILN=0
ok() { PASS=$((PASS + 1)); }
fail() {
  FAILN=$((FAILN + 1))
  echo "FAIL: $1" >&2
  if [ -n "${2-}" ]; then echo "  $2" >&2; fi
}
expect_eq() { if [ "$2" = "$3" ]; then ok; else fail "$1" "expected [$2] got [$3]"; fi; }

BIN="$TMP/bin"
mkdir -p "$BIN"
# Lane worker: commits worker-output-N.txt and reports DONE.
cat >"$BIN/agent" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
prompt_file="${!#}"
n="$(grep -oE 'Ticket: #[0-9]+' "$prompt_file" | head -1 | grep -oE '[0-9]+')"
printf 'implemented\n' >"worker-output-$n.txt"
git add "worker-output-$n.txt"
git commit -qm "feat: ticket $n"
echo "RALPH_RESULT: DONE #$n"
EOF
# Drift reviewer (ralph-drift-check.sh calls pi): verdict from $DRIFT_VERDICT.
cat >"$BIN/pi" <<'EOF'
#!/usr/bin/env bash
echo call >>"$DRIFT_LOG"
echo "1. worker-output.txt:1 contradicts D2 'no export'"
echo "DRIFT_CHECK: $DRIFT_VERDICT"
EOF
chmod +x "$BIN/agent" "$BIN/pi"
export DRIFT_LOG="$TMP/drift.log" RALPH_DRIFT_MODELS=stub/drift

new_repo() {
  REPO="$TMP/repo-$1"
  mkdir -p "$REPO/.kanban/issues" "$REPO/.kanban/specs" "$REPO/.kanban/grilling"
  git -C "$REPO" init -q -b main
  printf '.gralph/\n' >"$REPO/.gitignore"
  git -C "$REPO" config user.name test
  git -C "$REPO" config user.email test@example.com
  printf '## Decisions\n- D2: no export\n' >"$REPO/.kanban/grilling/t.md"
  printf -- '---\nslug: alpha\nledger: .kanban/grilling/t.md\n---\n## Out of Scope\n- export\n' >"$REPO/.kanban/specs/alpha.md"
  : >"$DRIFT_LOG"
}

# ticket ID SPEC-LINE (whole frontmatter line, or empty)
ticket() {
  {
    printf -- '---\nid: %s\ntitle: Ticket %s\nstatus: pending\nlabels: [ready-for-agent]\nblocked_by: []\n' "$1" "$1"
    [ -n "${2-}" ] && printf '%s\n' "$2"
    printf -- 'created: 2026-10-20\n---\n\n## What to build\n\nBuild it.\n\n## Verification\n\n`test -f worker-output-%s.txt`\n' "$1"
  } >"$REPO/.kanban/issues/$(printf '%03d' "$1")-t$1.md"
}

run_board() { # extra plan args...
  git -C "$REPO" add -A
  git -C "$REPO" commit -qm board --allow-empty
  (cd "$REPO" && PATH="$BIN:$PATH" "$GRALPH" 7 --board .kanban --dry-run --verify true "$@" >/dev/null 2>&1)
  (cd "$REPO" && PATH="$BIN:$PATH" "$GRALPH" 7 --board .kanban --jobs 1 --verify true \
    --agent-cmd "$BIN/agent" >"$TMP/out" 2>&1) || true
}
child() { jq -r --argjson n "$1" ".children[] | select(.number == \$n) | $2 // \"\"" "$REPO/.gralph/runs/7/manifest.json"; }
calls() { wc -l <"$DRIFT_LOG" | tr -d ' '; }

# --- 1. DRIFT blocks the lane ---
new_repo drift
ticket 1 'spec: alpha'
DRIFT_VERDICT=DRIFT run_board
expect_eq "drift: reviewer called once" "1" "$(calls)"
expect_eq "drift: lane not landed" "" "$(child 1 .merge.status)"
expect_eq "drift: execution failed" "failed" "$(child 1 .execution.status)"
expect_eq "drift: reason drift" "drift" "$(child 1 .execution.reason)"
expect_eq "drift: sentinel blocked" "blocked" "$(child 1 .sentinel)"
if grep -q '^status: done' "$REPO/.kanban/issues/001-t1.md"; then fail "drift: ticket must not be marked done"; else ok; fi
findings="$(find "$REPO/.gralph/runs/7" -maxdepth 1 -name '.child-1-*-drift.txt' | head -1)"
if [ -n "$findings" ] && grep -q "contradicts D2" "$findings"; then ok; else fail "drift: findings saved in the run dir"; fi
if [ -n "$findings" ] && grep -qF "$(child 1 .execution.commitSha)" "$findings"; then ok; else fail "drift: findings file names the drifted commit"; fi
if [ -n "$findings" ] && grep -qF "$findings" "$TMP/out"; then ok; else fail "drift: run output names the findings file" "$(tail -5 "$TMP/out")"; fi
if git -C "$REPO" show-ref --verify --quiet refs/heads/gralph/7/issue-1; then fail "drift: lane branch removed so --replan can retry"; else ok; fi

# --- 4. after the fix, --replan retries and the lane lands ---
DRIFT_VERDICT=PASS run_board --replan
expect_eq "retry: lane lands after --replan" "landed" "$(child 1 .merge.status)"

# --- 2. PASS lands ---
new_repo pass
ticket 2 'spec: alpha'
DRIFT_VERDICT=PASS run_board
expect_eq "pass: reviewer called once" "1" "$(calls)"
expect_eq "pass: lane landed" "landed" "$(child 2 .merge.status)"

# --- 3. no spec: no reviewer, lands ---
new_repo nospec
ticket 3 ''
DRIFT_VERDICT=DRIFT run_board
expect_eq "no spec: reviewer not called" "0" "$(calls)"
expect_eq "no spec: lane landed" "landed" "$(child 3 .merge.status)"

echo "gralph-drift: $PASS passed, $FAILN failed"
[ "$FAILN" -eq 0 ]
