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

count_status() { # dir, extended-regex of statuses
	local d="$1" re="$2"
	[[ -d "$d/.kanban/issues" ]] || { echo 0; return; }
	find "$d/.kanban/issues" -name '*.md' -exec grep -lE "^status: ($re)$" {} \; 2>/dev/null | wc -l | tr -d ' '
}
total_issues() {
	local d="$1"
	[[ -d "$d/.kanban/issues" ]] || { echo 0; return; }
	find "$d/.kanban/issues" -name '*.md' 2>/dev/null | wc -l | tr -d ' '
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

[[ -x "$LOOP_SCRIPT" ]] || { log "FATAL: loop script not executable: $LOOP_SCRIPT"; exit 1; }
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
			pend=$(count_status "$WORKTREE" 'pending|todo')
			act=$(count_status "$WORKTREE" 'in-progress|review')
			blk=$(count_status "$WORKTREE" 'blocked')
			donec=$(count_status "$WORKTREE" 'done')
			tot=$(total_issues "$WORKTREE")
			if ((pend + act > 0)); then
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
				tmux new-session -d -s "$MERGE_SESSION" "$fcmd" 2>>"$LOG" \
					|| log "WARN: could not start finalize session"
			else
				$idle_logged || log "worktree not actionable (pend=$pend act=$act blocked=$blk done=$donec of $tot); leaving for manual review"
				idle_logged=true
			fi
		else
			# No worktree: create one only if the base board has fresh pending work.
			base_pend=$(count_status "$BASE_REPO" 'pending|todo')
			if ((base_pend > 0)); then
				log "base has $base_pend pending issue(s); ensuring worktree"
				if RALPH_BASE_REPO="$BASE_REPO" RALPH_WORKTREE="$WORKTREE" RALPH_BRANCH="$BRANCH" \
					RALPH_BASE_BRANCH="$BASE_BRANCH" bash "$WT_SCRIPT" ensure >/dev/null 2>>"$LOG"; then
					last_launch=$now
					idle_logged=false
					launch_driver "$WORKTREE"
				else
					log "WARN: worktree ensure failed"
				fi
			else
				$idle_logged || log "no worktree and no base pending; idle"
				idle_logged=true
			fi
		fi
	else
		# Legacy cwd mode.
		pend=$(count_status "$PWD" 'pending|todo')
		if ((pend > 0)) && ((now - last_launch >= RELAUNCH_COOLDOWN)); then
			last_launch=$now
			launch_driver "$PWD"
		fi
	fi

	sleep "$POLL_INTERVAL"
done
