#!/bin/bash
# Ralph loop supervisor.
#
# Runs as a systemd user service. Keeps a Ralph loop alive across the
# intermittent reaping of its tmux pane scope on this host (and across logout,
# with lingering). The driver + workers run on the user's default tmux server so
# they stay attachable (tmux attach -t ralph-loop; workers ralph-<session>-N).
#
# Two modes:
#   Worktree mode (RALPH_BASE_REPO + RALPH_WORKTREE set) — owns the full batch
#     lifecycle from the BASE repo so it can safely remove the worktree:
#       1. base has pending work, no worktree   -> ensure worktree, launch driver
#       2. worktree has pending/active work      -> (re)launch driver in worktree
#       3. worktree batch fully clean (all done, none blocked) + branch ahead
#                                                -> finalize: merge + remove (own
#                                                   tmux session $SESSION-merge)
#       4. worktree has blocked/failed stragglers or a merge marker -> idle,
#          leave for manual review (rpiv-merge / git)
#   Legacy mode (no RALPH_WORKTREE) — relaunch the driver in $PWD whenever its
#     session dies while pending work remains.
#
# Stop a run by stopping the SERVICE (systemctl --user stop ralph-loop), not the
# tmux session — killing the session alone just triggers a relaunch.
set -uo pipefail

SESSION_NAME="${RALPH_SESSION_NAME:-ralph-loop}"
POLL_INTERVAL="${RALPH_SUPERVISE_INTERVAL:-15}"
RELAUNCH_COOLDOWN="${RALPH_SUPERVISE_COOLDOWN:-30}"
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOOP_SCRIPT="$SKILL_DIR/ralph-loop.sh"
WT_SCRIPT="$SKILL_DIR/ralph-worktree.sh"
FINALIZE_SCRIPT="$SKILL_DIR/ralph-finalize.sh"
LOG="$HOME/.cache/ralph-supervise-$SESSION_NAME.log"
RALPH_ARGS=("$@")

BASE_REPO="${RALPH_BASE_REPO:-}"
WORKTREE="${RALPH_WORKTREE:-}"
BRANCH="${RALPH_BRANCH:-ralph/run}"
BASE_BRANCH="${RALPH_BASE_BRANCH:-main}"
MERGE_SESSION="${SESSION_NAME}-merge"
MARKER="$HOME/.cache/ralph-merge-needed-$SESSION_NAME"

WORKTREE_MODE=false
[[ -n "$WORKTREE" && -n "$BASE_REPO" ]] && WORKTREE_MODE=true

mkdir -p "$HOME/.cache"
log() { printf '[%s] %s\n' "$(date '+%F %T')" "$*" | tee -a "$LOG"; }

BOARD_SH="$(dirname "$SKILL_DIR")/kanban/board.sh"
READY_LABEL="${RALPH_READY_LABEL:-ready-for-agent}"
SPEC="${RALPH_SPEC:-}"
# --spec SLUG may arrive in the loop args; honour it so the supervisor and the
# loop it launches agree on which tickets count as work.
for ((i = 0; i < ${#RALPH_ARGS[@]}; i++)); do
  [[ "${RALPH_ARGS[$i]}" == "--spec" ]] && SPEC="${RALPH_ARGS[$((i + 1))]:-}"
done

# board_counts DIR -> key=value lines from board.sh (empty output + rc!=0 if the
# board is missing or unreadable). Eligibility is decided by board.sh so the
# supervisor, the loop, gralph and the shepherd cannot disagree.
board_counts() {
  local d="$1"
  [[ -d "$d/.kanban" ]] || return 1
  "$BOARD_SH" --board "$d/.kanban" ${SPEC:+--spec "$SPEC"} --ready-label "$READY_LABEL" counts 2>>"$LOG"
}
count_of() { # key, counts-text -> the number, or 0 when absent/empty
  local v
  v=$(printf '%s\n' "$2" | sed -n "s/^$1=//p" | head -1)
  [[ "$v" =~ ^[0-9]+$ ]] || v=0
  printf '%s' "$v"
}
# waiting_summary COUNTS -> human reason a pending ticket is not being worked.
waiting_summary() {
  local c="$1"
  printf '%s need triage/info, %s for a human, %s wontfix, %s conflicting labels, %s waiting on blockers' \
    "$(count_of waiting_triage "$c")" "$(count_of waiting_human "$c")" "$(count_of wontfix "$c")" \
    "$(count_of conflict "$c")" "$(count_of waiting_deps "$c")"
}
waiting_total() {
  local c="$1"
  echo $(($(count_of waiting_triage "$c") + $(count_of waiting_human "$c") + $(count_of wontfix "$c") + $(count_of conflict "$c") + $(count_of waiting_deps "$c")))
}
branch_ahead() {
  local n
  n=$(git -C "$BASE_REPO" rev-list --count "$BASE_BRANCH..$BRANCH" 2>/dev/null || echo 0)
  [[ "$n" -gt 0 ]]
}
launch_driver() {
  local dir="$1"
  log "launching driver in $dir"
  (cd "$dir" && bash "$LOOP_SCRIPT" "${RALPH_ARGS[@]}") >>"$LOG" 2>&1 || log "driver launch returned $?"
}

[[ -x "$LOOP_SCRIPT" ]] || {
  log "FATAL: loop script not executable: $LOOP_SCRIPT"
  exit 1
}
[[ -x "$BOARD_SH" ]] || {
  log "FATAL: board.sh not executable: $BOARD_SH"
  exit 1
}
log "supervisor up: session=$SESSION_NAME worktree_mode=$WORKTREE_MODE base=$BASE_REPO wt=$WORKTREE interval=${POLL_INTERVAL}s args=[${RALPH_ARGS[*]:-}]"

last_launch=0
idle_logged=false
while true; do
  now=$(date +%s)

  # A finalize/merge session or a live driver session means: nothing to do.
  if tmux has-session -t "$MERGE_SESSION" 2>/dev/null || tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    sleep "$POLL_INTERVAL"
    continue
  fi

  if [[ "$WORKTREE_MODE" == "true" ]]; then
    if [[ -d "$WORKTREE/.kanban" ]]; then
      if ! counts=$(board_counts "$WORKTREE"); then
        $idle_logged || log "WARN: board.sh could not read $WORKTREE/.kanban; not launching on an unreadable board"
        idle_logged=true
        sleep "$POLL_INTERVAL"
        continue
      fi
      elig=$(count_of eligible "$counts")
      act=$(count_of active "$counts")
      blk=$(count_of blocked "$counts")
      donec=$(count_of "done" "$counts")
      tot=$(count_of total "$counts")
      wait=$(waiting_total "$counts")
      if ((elig + act > 0)); then
        if ((now - last_launch >= RELAUNCH_COOLDOWN)); then
          last_launch=$now
          idle_logged=false
          launch_driver "$WORKTREE"
        fi
      elif [[ -e "$MARKER" ]]; then
        $idle_logged || log "merge marker present ($MARKER); a prior finalize hit a conflict — leaving worktree for manual merge"
        idle_logged=true
      elif ((tot > 0 && blk == 0 && donec == tot)) && branch_ahead; then
        log "batch fully clean ($donec/$tot done); finalizing in session $MERGE_SESSION"
        idle_logged=false
        # tmux spawns the pane from the server's environment, so env set as
        # a command prefix to `tmux new-session` does NOT reach the pane.
        # Inline the config as %q-quoted assignments in the command string.
        printf -v fcmd 'RALPH_SESSION_NAME=%q RALPH_BASE_REPO=%q RALPH_WORKTREE=%q RALPH_BRANCH=%q RALPH_BASE_BRANCH=%q bash %q' \
          "$SESSION_NAME" "$BASE_REPO" "$WORKTREE" "$BRANCH" "$BASE_BRANCH" "$FINALIZE_SCRIPT"
        tmux new-session -d -s "$MERGE_SESSION" "$fcmd" 2>>"$LOG" ||
          log "WARN: could not start finalize session"
      else
        if ((wait > 0)); then
          $idle_logged || log "idle: $wait pending ticket(s) are not agent-ready ($(waiting_summary "$counts")); triage them or add $READY_LABEL"
        else
          $idle_logged || log "worktree not actionable (eligible=$elig active=$act blocked=$blk done=$donec of $tot); leaving for manual review"
        fi
        idle_logged=true
      fi
    else
      # No worktree: create one only if the base board has fresh pending work.
      base_counts=$(board_counts "$BASE_REPO" || true)
      base_pend=$(count_of eligible "$base_counts")
      if ((base_pend > 0)); then
        log "base has $base_pend eligible issue(s); ensuring worktree"
        if RALPH_BASE_REPO="$BASE_REPO" RALPH_WORKTREE="$WORKTREE" RALPH_BRANCH="$BRANCH" \
          RALPH_BASE_BRANCH="$BASE_BRANCH" bash "$WT_SCRIPT" ensure >/dev/null 2>>"$LOG"; then
          last_launch=$now
          idle_logged=false
          launch_driver "$WORKTREE"
        else
          log "WARN: worktree ensure failed"
        fi
      else
        $idle_logged || log "no worktree and no eligible base issue; idle"
        idle_logged=true
      fi
    fi
  else
    # Legacy cwd mode.
    counts=$(board_counts "$PWD" || true)
    work=$(($(count_of eligible "$counts") + $(count_of active "$counts")))
    if ((work > 0)) && ((now - last_launch >= RELAUNCH_COOLDOWN)); then
      last_launch=$now
      idle_logged=false
      launch_driver "$PWD"
    elif ((work == 0)) && [[ -n "$counts" ]] && (($(waiting_total "$counts") > 0)); then
      $idle_logged || log "idle: $(waiting_total "$counts") pending ticket(s) are not agent-ready ($(waiting_summary "$counts"))"
      idle_logged=true
    fi
  fi

  sleep "$POLL_INTERVAL"
done
