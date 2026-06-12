#!/bin/bash
# Ralph worktree launcher.
#
# Runs a Ralph loop in an isolated git worktree so it never mutates the live
# base checkout (e.g. ~/symphony, from which symphony-host.service runs). The
# service runs THIS instead of ralph-supervise.sh directly; it prepares the
# worktree, cd's into it, then execs the supervisor (which then drives
# ralph-loop.sh in that worktree).
#
# Flow per service start:
#   1. Commit any queued .kanban changes on the base branch (only .kanban), so a
#      worktree branched from base picks up newly-dropped issues. Harmless to
#      anything running from the base checkout (board files only).
#   2. Fresh batch  -> create worktree on $BRANCH from latest $BASE_BRANCH.
#      Reuse         -> worktree exists with unmerged work: keep it (don't lose
#                       in-flight commits).
#      Recreate      -> worktree's branch already merged into base (finished
#                       batch): rebuild it from latest base.
#   3. exec the supervisor in the worktree.
#
# After a batch completes, land it with the `rpiv-merge` skill (merges $BRANCH
# into $BASE_BRANCH). The next service start then detects "merged" and recreates
# a fresh worktree from the updated base.
#
# Env:
#   RALPH_BASE_REPO    base checkout (default: $HOME/symphony)
#   RALPH_WORKTREE     worktree path  (default: $HOME/symphony-ralph)
#   RALPH_BRANCH       run branch     (default: ralph/run)
#   RALPH_BASE_BRANCH  base branch    (default: main)
#   RALPH_SUPERVISE_BIN supervisor path (default: sibling ralph-supervise.sh; test seam)
set -uo pipefail

BASE_REPO="${RALPH_BASE_REPO:-$HOME/symphony}"
WORKTREE="${RALPH_WORKTREE:-$HOME/symphony-ralph}"
BRANCH="${RALPH_BRANCH:-ralph/run}"
BASE_BRANCH="${RALPH_BASE_BRANCH:-main}"
SELF_DIR="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
SUPERVISE_BIN="${RALPH_SUPERVISE_BIN:-$SELF_DIR/ralph-supervise.sh}"
LOG="$HOME/.cache/ralph-worktree.log"

mkdir -p "$HOME/.cache"
log() { printf '[%s] %s\n' "$(date '+%F %T')" "$*" | tee -a "$LOG"; }

cd "$BASE_REPO" 2>/dev/null || { log "FATAL: base repo not found: $BASE_REPO"; exit 1; }
git rev-parse --git-dir >/dev/null 2>&1 || { log "FATAL: not a git repo: $BASE_REPO"; exit 1; }

# 1. Commit queued board changes (only .kanban) on the base branch.
if [[ -n "$(git status --porcelain -- .kanban 2>/dev/null)" ]]; then
	log "committing queued .kanban changes on $BASE_BRANCH"
	git add -- .kanban && git commit -q -m "chore(kanban): queue issues for ralph run" \
		|| log "WARN: .kanban commit failed (continuing)"
fi

# 2. Fresh / reuse / recreate.
worktree_exists() {
	git worktree list --porcelain | awk '$1=="worktree"{print $2}' | grep -Fxq "$WORKTREE"
}
branch_merged() {
	git branch --merged "$BASE_BRANCH" --format='%(refname:short)' 2>/dev/null | grep -Fxq "$BRANCH"
}

if worktree_exists; then
	if branch_merged; then
		log "previous batch on $BRANCH already merged into $BASE_BRANCH; recreating fresh worktree"
		git worktree remove --force "$WORKTREE" 2>/dev/null || true
		git branch -D "$BRANCH" 2>/dev/null || true
		git worktree add -B "$BRANCH" "$WORKTREE" "$BASE_BRANCH" >>"$LOG" 2>&1 \
			|| { log "FATAL: worktree add failed"; exit 1; }
	else
		log "reusing worktree $WORKTREE (unmerged work on $BRANCH; rpiv-merge to land it)"
	fi
else
	log "creating worktree $WORKTREE on $BRANCH from $BASE_BRANCH"
	git worktree add -B "$BRANCH" "$WORKTREE" "$BASE_BRANCH" >>"$LOG" 2>&1 \
		|| { log "FATAL: worktree add failed (is $BASE_BRANCH valid? is $BRANCH checked out elsewhere?)"; exit 1; }
fi

cd "$WORKTREE" 2>/dev/null || { log "FATAL: cannot cd into worktree $WORKTREE"; exit 1; }
log "starting supervisor in $WORKTREE (branch $BRANCH)"
exec "$SUPERVISE_BIN" "$@"
