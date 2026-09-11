#!/bin/bash
# ralph-worktree.sh ensure — make sure the Ralph run worktree exists, print path.
#
# Used by ralph-supervise.sh in worktree mode. Creates the worktree
# ($RALPH_WORKTREE, default ~/symphony-ralph) on $RALPH_BRANCH (default
# ralph/run), branched from $RALPH_BASE_BRANCH (default main) of $RALPH_BASE_REPO
# (default ~/symphony), committing any queued .kanban changes on the base branch
# first so the fresh worktree picks up newly-dropped issues. The board (.kanban)
# must be git-tracked in the base repo for it to travel into the worktree. If the
# worktree already exists it is reused as-is (in-flight batch). Removal + merge
# are owned by ralph-finalize.sh, so this script never deletes anything.
#
# Prints the worktree path on stdout (success); logs detail to
# ~/.cache/ralph-worktree.log.
set -uo pipefail

cmd="${1:-ensure}"
BASE_REPO="${RALPH_BASE_REPO:-$HOME/symphony}"
WORKTREE="${RALPH_WORKTREE:-$HOME/symphony-ralph}"
BRANCH="${RALPH_BRANCH:-ralph/run}"
BASE_BRANCH="${RALPH_BASE_BRANCH:-main}"
LOG="$HOME/.cache/ralph-worktree.log"

mkdir -p "$HOME/.cache"
log() { printf '[%s] %s\n' "$(date '+%F %T')" "$*" >>"$LOG"; }

cd "$BASE_REPO" 2>/dev/null || { echo "FATAL: base repo not found: $BASE_REPO" >&2; exit 1; }
git rev-parse --git-dir >/dev/null 2>&1 || { echo "FATAL: not a git repo: $BASE_REPO" >&2; exit 1; }

worktree_exists() {
	git worktree list --porcelain | awk '$1=="worktree"{print $2}' | grep -Fxq "$WORKTREE"
}

case "$cmd" in
ensure)
	if worktree_exists; then
		log "reusing existing worktree $WORKTREE (branch $BRANCH)"
		echo "$WORKTREE"
		exit 0
	fi
	# Commit any queued board changes so a worktree branched from the base
	# branch picks up newly-dropped issues. Requires .kanban to be tracked.
	if [[ -n "$(git status --porcelain -- .kanban 2>/dev/null)" ]]; then
		log "committing queued .kanban changes on $BASE_BRANCH"
		git add -- .kanban && git commit -q -m "chore(kanban): queue issues for ralph run" \
			|| log "WARN: .kanban commit failed (continuing)"
	fi
	if git worktree add -B "$BRANCH" "$WORKTREE" "$BASE_BRANCH" >>"$LOG" 2>&1; then
		log "created worktree $WORKTREE on $BRANCH from $BASE_BRANCH"
		echo "$WORKTREE"
		exit 0
	fi
	echo "FATAL: worktree add failed (is $BRANCH checked out elsewhere?)" >&2
	exit 1
	;;
*)
	echo "usage: ${0##*/} ensure" >&2
	exit 2
	;;
esac
