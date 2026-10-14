#!/usr/bin/env bash
# Runs the REAL .agents/skills/ralph/ralph-loop.sh against fixture boards with a
# stub `tmux` (runs the driver synchronously) and a stub `omp` worker, to prove
# the sequential loop honours triage labels via board.sh:
#   1. a lower-id ticket that is not agent-ready is never handed to a worker
#   2. the DRIVER selects the ticket and names it in the worker prompt
#   3. priority / id ordering, one ticket per worker turn
#   4. --spec narrows the candidate set
#   5. archived done blocker releases a dependent; cancelled / missing do not
#   6. a board with only not-ready tickets ends cleanly without launching a worker
#   7. conflicting labels fail closed

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOOP="$ROOT/.agents/skills/ralph/ralph-loop.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

command -v jq >/dev/null 2>&1 || { echo "FAIL: jq is required" >&2; exit 1; }

PASS=0
FAILN=0
ok() { PASS=$((PASS + 1)); }
fail() {
  FAILN=$((FAILN + 1))
  echo "FAIL: $1" >&2
  [ -n "${2-}" ] && echo "  $2" >&2
}
expect_eq() { if [ "$2" = "$3" ]; then ok; else fail "$1" "want '$2' got '$3'"; fi; }

# --- stubs ------------------------------------------------------------------
BIN="$TMP/bin"
mkdir -p "$BIN"
# tmux: `new-session -d -s NAME CMD` runs CMD synchronously; everything else is a no-op.
cat >"$BIN/tmux" <<'EOF'
#!/usr/bin/env bash
case "${1-}" in
new-session)
  eval "${*: -1}" </dev/null
  exit $?
  ;;
has-session) exit 1 ;;
esac
exit 0
EOF
# omp worker: finds "Operate only on ticket <path> (issue #<id>)" in the prompt,
# records it, flips that ticket to done, prints the sentinel. If the prompt names
# no ticket it records NONE and reports NO_WORK.
cat >"$BIN/omp" <<'EOF'
#!/usr/bin/env bash
prompt=""
while [ $# -gt 0 ]; do
  if [ "$1" = "-p" ]; then prompt="$2"; shift; fi
  shift
done
path="$(printf '%s' "$prompt" | sed -n 's/.*Operate only on ticket \([^ ]*\) (issue #\([0-9A-Za-z]*\)).*/\1/p' | head -1)"
id="$(printf '%s' "$prompt" | sed -n 's/.*Operate only on ticket \([^ ]*\) (issue #\([0-9A-Za-z]*\)).*/\2/p' | head -1)"
if [ -z "$path" ]; then
  echo "NONE" >>"$WORKER_LOG"
  echo "RALPH_RESULT: NO_WORK"
  exit 0
fi
echo "$id" >>"$WORKER_LOG"
sed -i 's/^status: pending$/status: done/' "$path"
git add -A >/dev/null 2>&1 && git commit -qm "feat(#$id): stub worker" >/dev/null 2>&1
echo "worked on #$id"
echo "RALPH_RESULT: DONE #$id"
EOF
chmod +x "$BIN/tmux" "$BIN/omp"

# --- fixture helpers --------------------------------------------------------
new_repo() {
  REPO="$TMP/$1"
  rm -rf "$REPO"
  mkdir -p "$REPO/.kanban/issues" "$REPO/.kanban/archive/2026-01-01"
  printf '# Progress\n' >"$REPO/.kanban/progress.md"
  git -C "$REPO" init -q
  git -C "$REPO" config user.name test
  git -C "$REPO" config user.email test@example.com
  WORKER_LOG="$TMP/$1.workers"
  : >"$WORKER_LOG"
  FAKEHOME="$TMP/$1.home"
  rm -rf "$FAKEHOME"
  mkdir -p "$FAKEHOME"
}

# ticket <id> <status> <labels-line|-> <blocked_by> [dir] [extra frontmatter...]
ticket() {
  local id="$1" status="$2" labels="$3" blocked="$4" dir="${5:-issues}"
  shift 5 || shift $#
  local f="$REPO/.kanban/$dir/$(printf '%03d' "$id")-t$id.md"
  {
    printf '%s\n' '---'
    printf 'id: %s\ntitle: Ticket %s\nstatus: %s\n' "$id" "$id" "$status"
    [ "$labels" = "-" ] || printf '%s\n' "$labels"
    printf 'blocked_by: %s\ncreated: 2026-10-14\n' "$blocked"
    for l in "$@"; do printf '%s\n' "$l"; done
    printf '%s\n\n## What to build\n\nx\n' '---'
  } >"$f"
}

run_loop() { # extra args...
  (cd "$REPO" && git add -A && git commit -qm fixture --allow-empty &&
    env HOME="$FAKEHOME" PATH="$BIN:$PATH" WORKER_LOG="$WORKER_LOG" RALPH_MODEL=stub \
      bash "$LOOP" --force --unattended --sleep-interval 0 --no-checkpoint-dirty "$@" omp t1) \
    >"$TMP/last.out" 2>&1 || true
}
workers() { tr '\n' ' ' <"$WORKER_LOG" | sed 's/ $//'; }
status_of() { sed -n 's/^status: //p' "$REPO/.kanban/issues/$(printf '%03d' "$1")-t$1.md" | head -1; }

R='labels: [ready-for-agent]'

# --- 1+2+3. not-ready lower id is skipped; driver selects; ordering ----------
new_repo order
ticket 1 pending 'labels: [needs-info]' '[]'
ticket 2 pending "$R" '[]' issues 'priority: 5'
ticket 3 pending "$R" '[]' issues 'priority: 0'
ticket 4 pending 'labels: [ready-for-human]' '[]'
run_loop
expect_eq "workers got only ready tickets, priority 0 before 5" "3 2" "$(workers)"
expect_eq "needs-info ticket untouched" "pending" "$(status_of 1)"
expect_eq "ready-for-human ticket untouched" "pending" "$(status_of 4)"
expect_eq "ready ticket 2 done" "done" "$(status_of 2)"
expect_eq "ready ticket 3 done" "done" "$(status_of 3)"
grep -q "Selected ticket:" "$TMP/last.out" && ok || fail "driver logs the ticket it selected" "$(tail -5 "$TMP/last.out")"
grep -q "not agent-ready" "$TMP/last.out" && ok || fail "loop explains why pending tickets were left" "$(tail -8 "$TMP/last.out")"

# --- 6. only not-ready tickets: clean end, no worker ------------------------
new_repo idle
ticket 1 pending 'labels: [needs-triage]' '[]'
ticket 2 pending 'labels: []' '[]'
ticket 3 pending - '[]'
ticket 4 pending 'labels: [wontfix]' '[]'
run_loop
expect_eq "no worker launched when nothing is agent-ready" "" "$(workers)"
grep -q "No active or eligible pending issues" "$TMP/last.out" && ok || fail "loop reports nothing eligible" "$(tail -8 "$TMP/last.out")"
grep -q "Ralph loop complete" "$TMP/last.out" && ok || fail "loop completes cleanly" "$(tail -8 "$TMP/last.out")"

# --- 7. conflicting labels fail closed --------------------------------------
new_repo conflict
ticket 1 pending 'labels: [ready-for-agent, needs-info]' '[]'
run_loop
expect_eq "conflicting labels are never worked" "" "$(workers)"
expect_eq "conflicting ticket untouched" "pending" "$(status_of 1)"

# --- 4. --spec narrows ------------------------------------------------------
new_repo spec
ticket 1 pending "$R" '[]' issues 'spec: alpha'
ticket 2 pending "$R" '[]' issues 'spec: beta'
ticket 3 pending "$R" '[]' issues 'spec: beta'
run_loop --spec beta
expect_eq "--spec beta works only beta tickets" "2 3" "$(workers)"
expect_eq "alpha ticket untouched" "pending" "$(status_of 1)"

# --- 5. archive blockers ----------------------------------------------------
new_repo archive
ticket 5 done - '[]' archive/2026-01-01
ticket 6 cancelled - '[]' archive/2026-01-01
ticket 10 pending "$R" '[5]'
ticket 11 pending "$R" '[6]'
ticket 12 pending "$R" '[999]'
run_loop
expect_eq "archived done releases dependent; cancelled and missing do not" "10" "$(workers)"
expect_eq "cancelled-blocked ticket untouched" "pending" "$(status_of 11)"
expect_eq "missing-blocked ticket untouched" "pending" "$(status_of 12)"

echo "ralph-loop-labels: $PASS passed, $FAILN failed"
[ "$FAILN" -eq 0 ]
