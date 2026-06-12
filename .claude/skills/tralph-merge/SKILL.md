---
name: tralph-merge
description: Land a finished tralph batch — merge the worktree's run branch (ralph/run) into the base repo's main, then remove the worktree, delete the branch, and clear the merge-needed marker. USE WHEN user says "tralph-merge", "merge the tralph batch/worktree", "land ralph/run", "the finalizer deferred", or the auto-finalizer left a ralph-merge-needed marker for manual merge. Interactive — confirms before merging, never forces, resolves conflicts with the user. The manual counterpart to ralph-finalize.sh.
---

# tralph-merge

The manual landing step for the **tralph worktree loop**. `tralph` (the
`ralph-loop` systemd service) runs each batch in an isolated worktree on a run
branch, then `ralph-finalize.sh` auto-merges that branch into base `main` and
removes the worktree **only when the batch is fully clean and the merge is
safe**. When it can't merge safely — a true conflict, a dirty/ moved base
`main` (e.g. you have another session working on `main`), or a wrong base HEAD —
it aborts, drops a marker, and **leaves the batch for you**. This skill walks
that last mile by hand: review the branch, merge it into `main`, resolve any
conflict with you, then clean up so the supervisor resumes.

This is **not** `rpiv-merge` — that lands `rpiv/<TS>` branches the rralph
pipeline makes in-place. This lands the tralph **worktree** batch.

`$ARGUMENTS` is optional:
- empty — use the live `ralph-loop.service` config (or the defaults below).
- a path — treat it as the base repo (`RALPH_BASE_REPO`).

## Hard rules

1. **Confirm before merging.** The merge mutates base `main` — shared state,
   and the user may have another session on `main`. Show exactly what merges
   into what and get a yes. Never merge silently.
2. **Never force, never discard.** No `--force`, no `reset --hard`, no
   `merge --abort`-then-overwrite, no `checkout --` over uncommitted work. If the
   merge conflicts, *resolve it with the user*. Never pick a side blindly.
3. **Never push unless asked.** Landing locally is the default.
4. **Don't merge a batch that is still running.** If the worktree board still has
   `pending`/`in-progress`/`review` issues, or a driver/worker session is live,
   the batch isn't done — warn and stop unless the user explicitly wants a
   partial merge.
5. **Don't delete the worktree/branch without confirmation**, and only after a
   successful merge.
6. **Mind the base working tree.** If base `main` has uncommitted changes that
   the merge would touch, `git merge` will refuse — surface that and let the user
   commit/stash their other-session work first. Do not stash or discard it for
   them without asking.

## Phase 1 — Derive config

Read the loop's configuration from the service unit; fall back to defaults.

```bash
UNIT="$HOME/.config/systemd/user/ralph-loop.service"
val() { grep -oP "Environment=$1=\K.*" "$UNIT" 2>/dev/null | tail -1; }
BASE_REPO="${1:-$(val RALPH_BASE_REPO)}"; BASE_REPO="${BASE_REPO:-$HOME/symphony}"
WORKTREE="$(val RALPH_WORKTREE)"; WORKTREE="${WORKTREE:-$HOME/symphony-ralph}"
BRANCH="$(val RALPH_BRANCH)"; BRANCH="${BRANCH:-ralph/run}"
SESSION="$(val RALPH_SESSION_NAME)"; SESSION="${SESSION:-ralph-loop}"
BASE_BRANCH="$(val RALPH_BASE_BRANCH)"; BASE_BRANCH="${BASE_BRANCH:-main}"
MARKER="$HOME/.cache/ralph-merge-needed-$SESSION"
```

Confirm `BASE_REPO` is a git repo and `BRANCH` exists. If the branch is gone,
there is nothing to land — say so and stop.

## Phase 2 — Status: why are we here, and is it safe to merge?

Report, from `BASE_REPO`:

```bash
git -C "$BASE_REPO" rev-list --count "$BASE_BRANCH..$BRANCH"        # commits to land
git -C "$BASE_REPO" rev-list --count "$BRANCH..$BASE_BRANCH"        # how far main moved
git -C "$BASE_REPO" branch --merged "$BASE_BRANCH" | grep -qxF "  $BRANCH" && echo "ALREADY MERGED"
[ -e "$MARKER" ] && echo "marker present (finalizer deferred): $MARKER"
git -C "$BASE_REPO" status --porcelain -- . ':(exclude).pi-lens' | head   # base dirty?
```

Batch completeness — count the worktree board (it is the live board):

```bash
for s in pending in-progress review blocked done; do
  printf '%s: ' "$s"; find "$WORKTREE/.kanban/issues" -name '*.md' -exec grep -l "^status: $s$" {} \; 2>/dev/null | wc -l
done
```

Apply Hard rule 4: if `pending+in-progress+review > 0`, or a `ralph-$SESSION-*`
worker / the `$SESSION` driver session is live (`tmux has-session`), the batch is
still running — warn and stop unless told otherwise. A batch left by the
finalizer for manual merge is the normal case; a `blocked` straggler is fine to
land (its committed work + state come along).

## Phase 3 — Review the diff

Show what will land and let the user inspect before any merge:

```bash
git -C "$BASE_REPO" log --oneline "$BASE_BRANCH..$BRANCH"
git -C "$BASE_REPO" diff --stat "$BASE_BRANCH...$BRANCH"
```

Offer the full diff (`git -C "$BASE_REPO" diff "$BASE_BRANCH...$BRANCH"`).
Pre-check for conflicts without touching the tree:

```bash
git -C "$BASE_REPO" merge-tree --write-tree "$BASE_BRANCH" "$BRANCH" >/dev/null 2>&1 \
  && echo "clean merge" || echo "CONFLICTS likely — will resolve interactively"
```

Per-issue work was already reviewed by its worker, so a full re-review is
optional — but always show the diff summary and let the user decide.

## Phase 4 — Merge (after explicit confirmation)

From `BASE_REPO`, on `BASE_BRANCH`. Try fast-forward first, then a merge commit:

```bash
git -C "$BASE_REPO" rev-parse --abbrev-ref HEAD          # must be $BASE_BRANCH
git -C "$BASE_REPO" merge --ff-only "$BRANCH" \
  || git -C "$BASE_REPO" merge --no-ff --no-edit -m "merge(tralph): land $BRANCH batch" "$BRANCH"
```

- If `merge` reports **local changes would be overwritten** → base has
  uncommitted work (likely the user's other session). Stop; let them commit or
  stash it, then retry. Do not stash it for them without asking.
- If it **conflicts** → resolve with the user (show conflicted files, edit, `git
  add`, `git commit`). Never `--abort` and force a side. If the user wants to
  back out, `git merge --abort` returns to the pre-merge state cleanly — that is
  the only allowed abort, and it leaves the branch intact for later.

## Phase 5 — Clean up (after a successful merge, with confirmation)

```bash
git -C "$BASE_REPO" worktree remove --force "$WORKTREE"
git -C "$BASE_REPO" branch -d "$BRANCH"          # safe delete; only if merged
rm -f "$MARKER"
```

Clearing the marker and removing the worktree is what lets the **supervisor pick
up the next batch** — until then it idles. Confirm before deleting. Do **not**
restart or stop the service; the running supervisor handles the rest.

Only `git push` if the user explicitly asks.

## Report

Summarize: commits landed, files changed, any conflicts resolved, cleanup done,
and whether the supervisor is now free to start the next batch (worktree gone +
marker cleared). If you stopped early (batch still running, base dirty, conflict
the user wants to defer), say exactly what is blocking and the one command to
resume.
