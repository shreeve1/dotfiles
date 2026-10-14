#!/usr/bin/env bash
# Runs the REAL .agents/skills/ralph/ralph-supervise.sh (legacy cwd mode and
# worktree mode) against fixture boards with a stub tmux and a stub loop script,
# for a few poll cycles, and checks WHEN it launches the driver.
#
#   1. only not-agent-ready pending tickets  -> no launch, idle reason logged
#   2. an eligible ticket                    -> launch
#   3. an active (in-progress) ticket        -> launch (resume)
#   4. --spec narrows what counts as work
#   5. worktree mode: waiting tickets do not trigger the launch / finalize path
#      wrongly; an eligible ticket does launch
#   6. unreadable board (board.sh error)     -> no launch, warning logged

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILL_SRC="$ROOT/.agents/skills"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

PASS=0
FAILN=0
ok() { PASS=$((PASS + 1)); }
fail() {
  FAILN=$((FAILN + 1))
  echo "FAIL: $1" >&2
  [ -n "${2-}" ] && echo "  $2" >&2
}
expect_eq() { if [ "$2" = "$3" ]; then ok; else fail "$1" "want '$2' got '$3'"; fi; }

# Copy ralph + kanban skills so the supervisor resolves board.sh beside it, and
# swap ralph-loop.sh for a stub that just records that it was launched.
SK="$TMP/skills"
mkdir -p "$SK"
cp -r "$SKILL_SRC/ralph" "$SKILL_SRC/kanban" "$SK/"
cat >"$SK/ralph/ralph-loop.sh" <<'EOF'
#!/bin/bash
echo "LAUNCHED in $(pwd) args=$*" >>"$LAUNCH_LOG"
EOF
chmod +x "$SK/ralph/ralph-loop.sh"

BIN="$TMP/bin"
mkdir -p "$BIN"
# tmux: no sessions exist; new-session records the finalize command.
cat >"$BIN/tmux" <<'EOF'
#!/usr/bin/env bash
case "${1-}" in
has-session) exit 1 ;;
new-session) echo "TMUX new-session $*" >>"$LAUNCH_LOG" ;;
esac
exit 0
EOF
chmod +x "$BIN/tmux"

new_board() { # name -> dir with .kanban
  D="$TMP/$1"
  rm -rf "$D"
  mkdir -p "$D/.kanban/issues"
  LAUNCH_LOG="$TMP/$1.launch"
  : >"$LAUNCH_LOG"
  HOMEDIR="$TMP/$1.home"
  rm -rf "$HOMEDIR"
  mkdir -p "$HOMEDIR/.cache"
}
ticket() { # id status labels-line [extra...]
  local id="$1" status="$2" labels="$3"
  shift 3
  {
    printf '%s\n' '---'
    printf 'id: %s\ntitle: T%s\nstatus: %s\n' "$id" "$id" "$status"
    [ "$labels" = "-" ] || printf '%s\n' "$labels"
    printf 'blocked_by: []\ncreated: 2026-10-14\n'
    for l in "$@"; do printf '%s\n' "$l"; done
    printf '%s\n' '---'
  } >"$D/.kanban/issues/$(printf '%03d' "$id")-t$id.md"
}

# supervise <cwd> <extra env...> -- <args...>: run ~4s of poll cycles then stop.
supervise() {
  local cwd="$1"
  shift
  local envs=()
  while [ "$#" -gt 0 ] && [ "$1" != "--" ]; do
    envs+=("$1")
    shift
  done
  shift
  (cd "$cwd" && env HOME="$HOMEDIR" PATH="$BIN:$PATH" LAUNCH_LOG="$LAUNCH_LOG" \
    RALPH_SUPERVISE_INTERVAL=1 RALPH_SUPERVISE_COOLDOWN=100 RALPH_SESSION_NAME=sup-test \
    "${envs[@]}" timeout 4 bash "$SK/ralph/ralph-supervise.sh" "$@" >"$TMP/sup.out" 2>&1 || true)
}
launches() { grep -c '^LAUNCHED' "$LAUNCH_LOG" || true; }
suplog() { cat "$HOMEDIR/.cache/ralph-supervise-sup-test.log" 2>/dev/null || true; }

R='labels: [ready-for-agent]'

# --- 1. only waiting tickets: no launch, reason logged ----------------------
new_board waiting
ticket 1 pending 'labels: [needs-info]'
ticket 2 pending 'labels: [ready-for-human]'
ticket 3 pending -
ticket 4 pending 'labels: [wontfix]'
supervise "$D" -- tmux ralph-loop
expect_eq "no launch when nothing is agent-ready" "0" "$(launches)"
suplog | grep -q 'not agent-ready' && ok || fail "supervisor logs why it is idle" "$(suplog | tail -3)"
suplog | grep -q '2 need triage/info' && ok || fail "idle reason breaks the count down" "$(suplog | tail -3)"

# --- 2. eligible ticket: launch ---------------------------------------------
new_board eligible
ticket 1 pending 'labels: [needs-info]'
ticket 2 pending "$R"
supervise "$D" -- tmux ralph-loop
expect_eq "launches once for an eligible ticket (cooldown holds the rest)" "1" "$(launches)"
grep -q 'LAUNCHED in' "$LAUNCH_LOG" && ok || fail "launch recorded"

# --- 3. active ticket: launch (resume) --------------------------------------
new_board active
ticket 1 in-progress -
supervise "$D" -- tmux ralph-loop
expect_eq "launches to resume an in-progress ticket" "1" "$(launches)"

# --- 4. --spec narrows -------------------------------------------------------
new_board spec
ticket 1 pending "$R" 'spec: alpha'
supervise "$D" -- --spec beta tmux ralph-loop
expect_eq "--spec beta: alpha-only board has no work" "0" "$(launches)"
supervise "$D" -- --spec alpha tmux ralph-loop
expect_eq "--spec alpha: launches" "1" "$(launches)"
grep -q -- '--spec alpha' "$LAUNCH_LOG" && ok || fail "spec flag reaches the loop" "$(cat "$LAUNCH_LOG")"

# --- 5. worktree mode --------------------------------------------------------
new_board wt
mkdir -p "$TMP/wtbase"
ticket 1 pending 'labels: [needs-info]'
WT_ENV=("RALPH_BASE_REPO=$TMP/wtbase" "RALPH_WORKTREE=$D")
supervise "$D" "${WT_ENV[@]}" -- tmux ralph-loop
expect_eq "worktree mode: waiting ticket does not launch" "0" "$(launches)"
suplog | grep -q 'not agent-ready' && ok || fail "worktree mode logs the idle reason" "$(suplog | tail -3)"
new_board wt2
ticket 1 pending 'labels: [needs-info]'
ticket 2 pending "$R"
WT_ENV=("RALPH_BASE_REPO=$TMP/wtbase" "RALPH_WORKTREE=$D")
supervise "$D" "${WT_ENV[@]}" -- tmux ralph-loop
expect_eq "worktree mode: eligible ticket launches" "1" "$(launches)"

# --- 6. unreadable board -----------------------------------------------------
new_board broken
ticket 1 pending "$R"
cp "$SK/kanban/board.sh" "$SK/kanban/board.sh.bak"
printf '#!/bin/sh\necho boom >&2\nexit 3\n' >"$SK/kanban/board.sh"
chmod +x "$SK/kanban/board.sh"
WT_ENV=("RALPH_BASE_REPO=$TMP/wtbase" "RALPH_WORKTREE=$D")
supervise "$D" "${WT_ENV[@]}" -- tmux ralph-loop
expect_eq "board.sh failure never launches the driver" "0" "$(launches)"
suplog | grep -q 'could not read' && ok || fail "board.sh failure is logged" "$(suplog | tail -3)"
mv "$SK/kanban/board.sh.bak" "$SK/kanban/board.sh"

echo "ralph-supervise-labels: $PASS passed, $FAILN failed"
[ "$FAILN" -eq 0 ]
