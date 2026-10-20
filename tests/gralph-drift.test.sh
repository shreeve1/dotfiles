#!/usr/bin/env bash
# Board mode (bin/gralph --board) runs the driver-side drift check after a lane worker
# reports DONE, before the lane can land:
#   1. DRIFT: the lane does not land; it is recorded failed (sentinel blocked, reason drift),
#      the findings are saved, the lane branch is KEPT for inspection, and a
#      ready-for-human repair ticket carrying the findings goes on the board (like a
#      bounced lane); the original ticket gets status: blocked so it is not re-picked
#   2. a mixed run (one lane PASS, one DRIFT) still finishes: the PASS lane lands on main,
#      and the run exits non-zero naming the repair ticket; nothing needs --replan
#   3. PASS lands, no spec skips the reviewer and lands
#   4. an uncommitted board (ticket, spec, ledger written but not committed) is still
#      checked: the reviewer gets the live ticket, spec and ledger
#   5. a ticket whose spec vanished is refused (ERROR never lands)
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
git commit -qm "feat(#$n): ticket $n"
echo "RALPH_RESULT: DONE #$n"
EOF
# Drift reviewer (ralph-drift-check.sh calls pi with context on stdin). DRIFT for the
# ticket ids listed in $DRIFT_IDS, PASS otherwise; stdin is appended to $DRIFT_STDIN.
cat >"$BIN/pi" <<'EOF'
#!/usr/bin/env bash
in="$(cat)"
printf '%s\n' "$in" >>"$DRIFT_STDIN"
echo call >>"$DRIFT_LOG"
id="$(printf '%s\n' "$in" | sed -n 's/^id: //p' | head -1)"
case " ${DRIFT_IDS:-} " in
*" $id "*)
  echo "1. worker-output-$id.txt:1 contradicts D2 'no export'"
  echo "DRIFT_CHECK: DRIFT"
  ;;
*) echo "DRIFT_CHECK: PASS" ;;
esac
EOF
chmod +x "$BIN/agent" "$BIN/pi"
export DRIFT_LOG="$TMP/drift.log" DRIFT_STDIN="$TMP/drift.stdin" RALPH_DRIFT_MODELS=stub/drift

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
  : >"$DRIFT_STDIN"
}

# ticket ID SPEC-LINE (whole frontmatter line, or empty)
ticket() {
  {
    printf -- '---\nid: %s\ntitle: Ticket %s\nstatus: pending\nlabels: [ready-for-agent]\nblocked_by: []\n' "$1" "$1"
    [ -n "${2-}" ] && printf '%s\n' "$2"
    printf -- 'created: 2026-10-20\n---\n\n## What to build\n\nBuild it.\n\n## Verification\n\n`test -f worker-output-%s.txt`\n' "$1"
  } >"$REPO/.kanban/issues/$(printf '%03d' "$1")-t$1.md"
}

commit_board() { git -C "$REPO" add -A && git -C "$REPO" commit -qm board --allow-empty; }
run_board() { # jobs
  RC=0
  (cd "$REPO" && PATH="$BIN:$PATH" "$GRALPH" 7 --board .kanban --dry-run --verify true >/dev/null 2>&1)
  (cd "$REPO" && PATH="$BIN:$PATH" "$GRALPH" 7 --board .kanban --jobs "${1:-1}" --verify true \
    --agent-cmd "$BIN/agent" >"$TMP/out" 2>&1) || RC=$?
}
child() { jq -r --argjson n "$1" ".children[] | select(.number == \$n) | $2 // \"\"" "$REPO/.gralph/runs/7/manifest.json"; }
calls() { wc -l <"$DRIFT_LOG" | tr -d ' '; }
status_of() { sed -n 's/^status: //p' "$REPO/.kanban/issues/$(printf '%03d' "$1")-t$1.md" | head -1; }
repair_for() { grep -l "^title: Drift check blocked ticket #$1\$" "$REPO"/.kanban/issues/*.md 2>/dev/null | head -1 || true; }

# --- 1. DRIFT blocks the lane and files a repair ticket ---
new_repo drift
ticket 1 'spec: alpha'
commit_board
DRIFT_IDS=1 run_board
expect_eq "drift: reviewer called once" "1" "$(calls)"
expect_eq "drift: lane not landed" "" "$(child 1 .merge.status)"
expect_eq "drift: execution failed" "failed" "$(child 1 .execution.status)"
expect_eq "drift: reason drift" "drift" "$(child 1 .execution.reason)"
expect_eq "drift: sentinel blocked" "blocked" "$(child 1 .sentinel)"
expect_eq "drift: original ticket parked blocked" "blocked" "$(status_of 1)"
if git -C "$REPO" show-ref --verify --quiet refs/heads/gralph/7/issue-1; then ok; else fail "drift: lane branch kept for inspection"; fi
rep="$(repair_for 1)"
if [ -n "$rep" ]; then ok; else fail "drift: a repair ticket was filed" "$(ls "$REPO/.kanban/issues")"; fi
if [ -n "$rep" ] && grep -q '^labels: \[ready-for-human\]' "$rep"; then ok; else fail "drift: repair ticket is ready-for-human"; fi
if [ -n "$rep" ] && grep -q "contradicts D2" "$rep"; then ok; else fail "drift: repair ticket carries the findings"; fi
if [ -n "$rep" ] && grep -qF "gralph/7/issue-1" "$rep"; then ok; else fail "drift: repair ticket names the kept branch"; fi
if grep -qF "$(basename "${rep:-none}")" "$TMP/out"; then ok; else fail "drift: run output names the repair ticket" "$(tail -5 "$TMP/out")"; fi

# --- 2. mixed run: PASS lane lands on main, DRIFT lane becomes a repair ticket ---
new_repo mixed
ticket 1 'spec: alpha'
ticket 2 'spec: alpha'
commit_board
DRIFT_IDS=2 run_board 2
expect_eq "mixed: PASS lane landed" "landed" "$(child 1 .merge.status)"
if git -C "$REPO" cat-file -e main:worker-output-1.txt 2>/dev/null; then ok; else fail "mixed: PASS lane reached main"; fi
expect_eq "mixed: PASS ticket done on main" "done" "$(git -C "$REPO" show main:.kanban/issues/001-t1.md | sed -n 's/^status: //p' | head -1)"
expect_eq "mixed: DRIFT ticket blocked" "blocked" "$(status_of 2)"
if [ -n "$(repair_for 2)" ]; then ok; else fail "mixed: repair ticket for the drifted lane"; fi
if [ "$RC" -ne 0 ]; then ok; else fail "mixed: run exits non-zero so the block is noticed"; fi

# --- 3. PASS lands; no spec: no reviewer, lands ---
new_repo pass
ticket 2 'spec: alpha'
commit_board
run_board
expect_eq "pass: reviewer called once" "1" "$(calls)"
expect_eq "pass: lane landed" "landed" "$(child 2 .merge.status)"

new_repo nospec
ticket 3 ''
commit_board
DRIFT_IDS=3 run_board
expect_eq "no spec: reviewer not called" "0" "$(calls)"
expect_eq "no spec: lane landed" "landed" "$(child 3 .merge.status)"

# --- 4. uncommitted board: ticket, spec and ledger exist only in the working tree ---
new_repo uncommitted
git -C "$REPO" add .gitignore && git -C "$REPO" commit -qm init
ticket 4 'spec: alpha'
printf '## Decisions\n- live-ledger-marker\n' >>"$REPO/.kanban/grilling/t.md"
run_board
expect_eq "uncommitted: reviewer called" "1" "$(calls)"
if grep -q 'live-ledger-marker' "$DRIFT_STDIN"; then ok; else fail "uncommitted: reviewer got the live ledger"; fi
if grep -q '^id: 4' "$DRIFT_STDIN"; then ok; else fail "uncommitted: reviewer got the live ticket"; fi

# --- 5. spec vanished after planning: ERROR, lane refused ---
new_repo specgone
ticket 5 'spec: alpha'
commit_board
(cd "$REPO" && PATH="$BIN:$PATH" "$GRALPH" 7 --board .kanban --dry-run --verify true >/dev/null 2>&1)
cat >"$BIN/agent-rm" <<EOF
#!/usr/bin/env bash
rm -f "$REPO/.kanban/specs/alpha.md"
exec "$BIN/agent" "\$@"
EOF
chmod +x "$BIN/agent-rm"
(cd "$REPO" && PATH="$BIN:$PATH" "$GRALPH" 7 --board .kanban --jobs 1 --verify true \
  --agent-cmd "$BIN/agent-rm" >"$TMP/out" 2>&1) || true
expect_eq "spec gone: lane not landed" "" "$(child 5 .merge.status)"
expect_eq "spec gone: reason drift_check_error" "drift_check_error" "$(child 5 .execution.reason)"

echo "gralph-drift: $PASS passed, $FAILN failed"
[ "$FAILN" -eq 0 ]
