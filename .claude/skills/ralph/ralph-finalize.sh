#!/bin/bash
# ralph-finalize.sh — land a fully-drained Ralph batch.
#
# Merges the run branch ($RALPH_BRANCH, default ralph/run) into the base branch
# (default main) of the base repo, then removes the worktree and deletes the
# branch. Deterministic git only — NO agent. The Ralph supervisor spawns this in
# its own tmux session ($SESSION-merge) once a batch is fully clean (every issue
# done, none blocked/failed); each issue was already implemented + reviewed by
# its worker, so there is no extra test gate here.
#
# Safety:
#   - Refuses unless the branch is ahead of base and the worktree tree is clean.
#   - Tries --ff-only first (main unmoved), else a --no-ff merge commit.
#   - On conflict: `git merge --abort`, drop a marker, leave worktree+branch for
#     manual merge. Never force, never reset the base branch.
set -uo pipefail

BASE_REPO="${RALPH_BASE_REPO:-$HOME/symphony}"
WORKTREE="${RALPH_WORKTREE:-$HOME/symphony-ralph}"
BRANCH="${RALPH_BRANCH:-ralph/run}"
BASE_BRANCH="${RALPH_BASE_BRANCH:-main}"
SESSION_NAME="${RALPH_SESSION_NAME:-ralph-loop}"
MARKER="$HOME/.cache/ralph-merge-needed-$SESSION_NAME"
LOG="$HOME/.cache/ralph-finalize-$SESSION_NAME.log"

mkdir -p "$HOME/.cache"
log() { printf '[%s] %s\n' "$(date '+%F %T')" "$*" | tee -a "$LOG"; }

cd "$BASE_REPO" 2>/dev/null || { log "FATAL: base repo not found: $BASE_REPO"; exit 1; }
git rev-parse --git-dir >/dev/null 2>&1 || { log "FATAL: not a git repo: $BASE_REPO"; exit 1; }

# Guards ----------------------------------------------------------------------
git rev-parse --verify "$BRANCH" >/dev/null 2>&1 || { log "branch $BRANCH gone; nothing to finalize"; exit 0; }
ahead=$(git rev-list --count "$BASE_BRANCH..$BRANCH" 2>/dev/null || echo 0)
[[ "$ahead" -gt 0 ]] || { log "$BRANCH not ahead of $BASE_BRANCH; nothing to merge"; exit 0; }

cur=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
[[ "$cur" == "$BASE_BRANCH" ]] || { : > "$MARKER"; log "base repo HEAD is '$cur', expected '$BASE_BRANCH'; refusing (marker set)"; exit 1; }

if [[ -d "$WORKTREE" ]] && [[ -n "$(git -C "$WORKTREE" status --porcelain -- . ':(exclude).pi-lens' 2>/dev/null)" ]]; then
	: > "$MARKER"
	log "worktree $WORKTREE is dirty; refusing to finalize (marker set)"
	exit 1
fi

# Merge -----------------------------------------------------------------------
log "merging $BRANCH into $BASE_BRANCH ($ahead commit(s) ahead)"
if git merge --ff-only "$BRANCH" >>"$LOG" 2>&1; then
	log "fast-forward merge ok"
elif git merge --no-ff --no-edit -m "merge(ralph): land $BRANCH batch" "$BRANCH" >>"$LOG" 2>&1; then
	log "merge commit ok"
else
	git merge --abort 2>/dev/null || true
	: > "$MARKER"
	log "MERGE CONFLICT — aborted; left worktree+branch for manual merge (marker: $MARKER)"
	exit 1
fi
rm -f "$MARKER"

# Cleanup ---------------------------------------------------------------------
if git worktree remove --force "$WORKTREE" >>"$LOG" 2>&1; then
	log "removed worktree $WORKTREE"
else
	log "WARN: worktree remove failed for $WORKTREE"
fi
if git branch -d "$BRANCH" >>"$LOG" 2>&1; then
	log "deleted branch $BRANCH"
else
	log "WARN: branch delete failed for $BRANCH (not fully merged?)"
fi
log "finalize complete: $BRANCH landed on $BASE_BRANCH"
