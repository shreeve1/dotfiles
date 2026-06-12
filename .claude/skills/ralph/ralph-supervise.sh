#!/bin/bash
# Ralph loop supervisor.
#
# Keeps the Ralph driver alive across the intermittent reaping of its tmux pane
# scope on this host. Designed to run as a systemd user service (Restart on
# failure, with lingering enabled) so it survives both logout and its own death.
#
# The driver itself still runs in a normal tmux session (default: ralph-loop) on
# the user's existing tmux server, so it stays attachable
# (`tmux attach -t ralph-loop`) and workers still appear as
# `ralph-<session>-<n>`. If that driver session vanishes while pending work
# remains, the supervisor relaunches ralph-loop.sh within POLL_INTERVAL seconds.
#
# To STOP a run, stop the SERVICE (`systemctl --user stop ralph-loop`), not the
# tmux session -- killing only the tmux session would just trigger a relaunch.
#
# Usage: ralph-supervise.sh [ralph-loop.sh options/args...]
#   All arguments are forwarded verbatim to ralph-loop.sh on each launch.
#
# Env:
#   RALPH_SESSION_NAME        driver tmux session name (default: ralph-loop)
#   RALPH_SUPERVISE_INTERVAL  poll seconds between checks (default: 15)
#   RALPH_SUPERVISE_COOLDOWN  min seconds between relaunches (default: 30)
set -uo pipefail

SESSION_NAME="${RALPH_SESSION_NAME:-ralph-loop}"
POLL_INTERVAL="${RALPH_SUPERVISE_INTERVAL:-15}"
RELAUNCH_COOLDOWN="${RALPH_SUPERVISE_COOLDOWN:-30}"
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOOP_SCRIPT="$SKILL_DIR/ralph-loop.sh"
LOG="$HOME/.cache/ralph-supervise-$SESSION_NAME.log"
RALPH_ARGS=("$@")

mkdir -p "$HOME/.cache"
log() { printf '[%s] %s\n' "$(date '+%F %T')" "$*" | tee -a "$LOG"; }

# Pending = issues the driver can actually pick up. Blocked/done issues do not
# count, so a board with only blocked/done work leaves the supervisor idle
# rather than relaunching the driver in a loop. The driver's own auto-review
# drains blocked issues within a single run; the supervisor only ensures a
# driver is running while fresh pending work exists.
pending_count() {
	[[ -d .kanban/issues ]] || { echo 0; return; }
	# `todo` is treated as an alias for `pending` (the driver normalizes it on
	# launch); count both so the supervisor still launches for a todo-only board.
	find .kanban/issues -name '*.md' -exec grep -lE '^status: (pending|todo)$' {} \; 2>/dev/null | wc -l | tr -d ' '
}

if [[ ! -x "$LOOP_SCRIPT" ]]; then
	log "FATAL: loop script not executable: $LOOP_SCRIPT"
	exit 1
fi

log "supervisor up: session=$SESSION_NAME interval=${POLL_INTERVAL}s cwd=$(pwd) loop=$LOOP_SCRIPT args=[${RALPH_ARGS[*]:-}]"

last_launch=0
while true; do
	now=$(date +%s)
	if tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
		: # driver session present (running or idle-complete); nothing to do
	else
		pend=$(pending_count)
		if [[ "$pend" -gt 0 ]]; then
			if ((now - last_launch < RELAUNCH_COOLDOWN)); then
				log "driver gone, $pend pending, within ${RELAUNCH_COOLDOWN}s cooldown; waiting"
			else
				log "driver session '$SESSION_NAME' absent with $pend pending issue(s) -> launching ralph-loop.sh"
				last_launch=$now
				if bash "$LOOP_SCRIPT" "${RALPH_ARGS[@]}" >>"$LOG" 2>&1; then
					log "ralph-loop.sh launch returned 0"
				else
					log "ralph-loop.sh launch returned $?"
				fi
			fi
		fi
	fi
	sleep "$POLL_INTERVAL"
done
