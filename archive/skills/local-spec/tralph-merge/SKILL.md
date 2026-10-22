---
disable-model-invocation: true
name: tralph-merge
description: Land a finished tralph batch — merge the worktree's run branch (ralph/run) into the base repo's main, then remove the worktree, delete the branch, and clear the merge-needed marker. Also handles board-mode batches where `finish_board` dropped a `ralph-merge-needed-board-<parent>` marker and left a `gralph/<parent>/batch` integration branch for manual merge. USE WHEN user says "tralph-merge", "merge the tralph batch/worktree", "land ralph/run", "the finalizer deferred", or the auto-finalizer left a ralph-merge-needed marker for manual merge. Interactive — confirms before merging, never forces, resolves conflicts with the user. The manual counterpart to ralph-finalize.sh.
---

# tralph-merge

The manual landing step for the **tralph worktree loop** (legacy path) and the
**board-mode gralph coordinator** (ADR 0009 path).

## Which path am I on?

| Indicator | Legacy tralph worktree | Board-mode gralph |
|-----------|------------------------|-------------------|
| Marker file | `~/.cache/ralph-merge-needed-<SESSION>` | `~/.cache/ralph-merge-needed-board-<KEY>` |
| Branch to land | `ralph/run` (or configured `RALPH_BRANCH`) | `gralph/<KEY>/batch` |
| Source of truth | `$WORKTREE/.kanban/` (live board in worktree) | the run report (`.kanban/run-report.md`, or `run-report-<KEY>.md` for a spec run) + `.gralph/runs/<KEY>/manifest.json` |
| Worktree to remove after merge | `$WORKTREE` (the tralph worktree) | None — board-mode coordinator already removed landed lane worktrees |

Read the marker file name to determine which path to follow. Both paths share
the same hard rules and the same Phase 4 merge procedure.

**Legacy path** (`$ARGUMENTS` is optional):
- empty — use the live `ralph-loop.service` config (or the defaults below).
- a path — treat it as the base repo (`RALPH_BASE_REPO`).

**Board-mode path** (`$ARGUMENTS`):
- `--board <key>` — board-mode merge for the named run key: `0` for a whole-board
  run, or the spec slug for a `tralph --spec <slug>` run. (Older runs used a parent
  number; that is just a numeric key.)
- `--board <key> <repo>` — override the repo root.

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
7. **Coordinate with the live supervisor.** This skill is for the *deferred*
   case: a `ralph-merge-needed` marker means the supervisor has gone idle, so a
   manual merge is safe and you leave the service running. If there is **no
   marker** and the batch is clean, the supervisor will **auto-finalize it
   itself** — a manual merge then races its `$SESSION-merge` session and the
   driver. Only force a manual merge of a non-deferred batch after
   `systemctl --user stop ralph-loop` (and restart it after). Always verify no
   `$SESSION-merge` finalize session is running before you merge.

## Phase 1 — Derive config

### Legacy tralph worktree path

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

### Board-mode path

```bash
KEY="$2"            # required: run key after --board ("0" or the spec slug)
BASE_REPO="${3:-$(git rev-parse --show-toplevel)}"
BRANCH="gralph/$KEY/batch"
BASE_BRANCH="$(git -C "$BASE_REPO" rev-parse --abbrev-ref HEAD)"
MARKER="$HOME/.cache/ralph-merge-needed-board-$KEY"
MANIFEST="$BASE_REPO/.gralph/runs/$KEY/manifest.json"
RUN_REPORT="$BASE_REPO/.kanban/run-report.md"
[ "$KEY" = 0 ] || RUN_REPORT="$BASE_REPO/.kanban/run-report-$KEY.md"
```

Confirm the marker exists (if not, the coordinator may not have deferred —
check `.orchestration.boardFinish.status` in the manifest). Confirm `BRANCH`
exists. Confirm `MANIFEST` is readable. If the branch is gone or the manifest
is absent, say so and stop. No worktree to check in board mode — the
coordinator already removed landed lane worktrees on success; only
bounced/blocked lanes have worktrees remaining and they are not affected by
this merge.

## Phase 2 — Status: why are we here, and is it safe to merge?

Report, from `BASE_REPO`:

```bash
git -C "$BASE_REPO" rev-list --count "$BASE_BRANCH..$BRANCH"        # commits to land
git -C "$BASE_REPO" rev-list --count "$BRANCH..$BASE_BRANCH"        # how far main moved
git -C "$BASE_REPO" merge-base --is-ancestor "$BRANCH" "$BASE_BRANCH" 2>/dev/null && echo "ALREADY MERGED (branch is an ancestor of $BASE_BRANCH)"
[ -e "$MARKER" ] && echo "marker present (finalizer deferred): $MARKER"
git -C "$BASE_REPO" status --porcelain -- . ':(exclude).pi-lens' | head   # base dirty?
git -C "$WORKTREE" status --porcelain -- . ':(exclude).pi-lens' | head    # worktree dirty?
tmux has-session -t "${SESSION}-merge" 2>/dev/null && echo "FINALIZE SESSION RUNNING — wait, do not merge"
```

**Already merged?** If the `ALREADY MERGED` check fired (the branch's commits
are already in `$BASE_BRANCH`), there is nothing to merge — skip straight to
Phase 5 cleanup (remove worktree, delete branch, clear marker).

**Worktree dirty?** If `git -C "$WORKTREE" status` is non-empty, the run branch
is **missing uncommitted work** (e.g. a driver died mid-write) — merging would
silently drop it. Surface it; with the user's OK, checkpoint it onto the branch
first, then merge:

```bash
git -C "$WORKTREE" add -A -- . ':(exclude).pi-lens'
git -C "$WORKTREE" commit -m "chore(ralph): checkpoint worktree before manual merge"
```

Otherwise stop and investigate. Never merge a half-written branch silently.

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
Pre-check for conflicts without touching the tree (needs git ≥ 2.38; if
unsupported just skip — Phase 4 surfaces conflicts anyway):

```bash
git -C "$BASE_REPO" merge-tree --write-tree "$BASE_BRANCH" "$BRANCH" >/dev/null 2>&1 \
  && echo "clean merge" || echo "CONFLICTS likely — will resolve interactively"
```

Per-issue work was already reviewed by its worker, so a full re-review is
optional — but always show the diff summary and let the user decide.

## Phase 4 — Merge (after explicit confirmation)

First gate, then merge. **Both gates must pass before `git merge` runs** — do
not proceed if either fails; tell the user the one thing to fix.

```bash
cur="$(git -C "$BASE_REPO" rev-parse --abbrev-ref HEAD)"
dirty="$(git -C "$BASE_REPO" status --porcelain -- . ':(exclude).pi-lens')"
if [ "$cur" != "$BASE_BRANCH" ]; then
  echo "STOP: base repo is on '$cur', not '$BASE_BRANCH' (another session owns it — do not checkout)"
elif [ -n "$dirty" ]; then
  echo "STOP: base working tree dirty — let the user commit/stash their session work first"
else
  # Gates passed: fast-forward first, else a merge commit.
  git -C "$BASE_REPO" merge --ff-only "$BRANCH" \
    || git -C "$BASE_REPO" merge --no-ff --no-edit -m "merge(tralph): land $BRANCH batch" "$BRANCH"
fi
```

- Gate 1 fails (base on another branch) → **stop**. Do not switch it; the other
  session owns that working tree.
- Gate 2 fails / `merge` reports **local changes would be overwritten** → base
  has uncommitted work (likely your other session). Stop; let them commit or
  stash it, then retry. Do not stash it for them without asking.
- If it **conflicts** → resolve with the user (show conflicted files, edit, `git
  add`, `git commit`). Never `--abort` and force a side. If the user wants to
  back out, `git merge --abort` returns to the pre-merge state cleanly — that is
  the only allowed abort, and it leaves the branch intact for later.

## Phase 5 — Clean up (after a successful merge, with confirmation)

### Legacy tralph worktree path

```bash
git -C "$BASE_REPO" worktree remove --force "$WORKTREE"
git -C "$BASE_REPO" branch -d "$BRANCH"          # safe delete; only if merged
rm -f "$MARKER"
```

Clearing the marker and removing the worktree is what lets the **supervisor pick
up the next batch** — until then it idles. Confirm before deleting.

If you left the service running (the normal deferred-merge case), the supervisor
now starts the next batch on its own. If you had `systemctl --user stop
ralph-loop` to force a manual merge of a non-deferred batch, `systemctl --user
start ralph-loop` to resume.

### Board-mode path

```bash
git -C "$BASE_REPO" branch -d "$BRANCH"   # safe delete; only if merged
rm -f "$MARKER"

# Sweep the lane worktrees and branches. finish_board prunes landed lanes only
# when it runs to the end; if the coordinator exited early (non-zero, "unlanded
# children remain") every lane is still here. Remove a lane only when its branch
# is merged into $BASE_BRANCH AND its worktree is clean (pi's own .pi/ scratch
# folder does not count as dirty). Bounced, failed and dirty lanes are kept and
# reported: a repair ticket or the user still needs them.
kept=""
for b in $(git -C "$BASE_REPO" for-each-ref --format='%(refname:short)' "refs/heads/gralph/$KEY/issue-*"); do
  wt="$(git -C "$BASE_REPO" worktree list --porcelain | awk -v r="refs/heads/$b" '/^worktree /{w=$2} $0=="branch "r{print w}')"
  if git -C "$BASE_REPO" merge-base --is-ancestor "$b" "$BASE_BRANCH" \
     && { [ -z "$wt" ] || [ -z "$(git -C "$wt" status --porcelain | grep -v '^?? .pi')" ]; }; then
    [ -z "$wt" ] || git -C "$BASE_REPO" worktree remove --force "$wt"
    git -C "$BASE_REPO" branch -d "$b"
  else
    kept="$kept $b(+$(git -C "$BASE_REPO" cherry "$BASE_BRANCH" "$b" | grep -c '^+') unmatched)"
  fi
done
git -C "$BASE_REPO" worktree prune
echo "kept (unmerged or dirty):$kept"
# A lane landed by cherry-pick or rebase (e.g. by a fix-up agent) is NOT an ancestor,
# and `git cherry` also reports it unmatched once a conflict was resolved. The sweep
# cannot tell that from unmerged work, so it keeps it. To clear such a lane, check by
# hand that every line it added is in $BASE_BRANCH (or that its changes were replaced
# on purpose), confirm with the user, then `git branch -D` it.
# Any other worktree left under the run dir (e.g. one a fix-up agent created):
git -C "$BASE_REPO" worktree list | grep "/.gralph/runs/$KEY/"

# Record the merge in the manifest. finish_board did not (it deferred), and gralph
# decides "resume the saved run" vs "plan fresh" from boardFinish.status: left as
# "deferred", the next `tralph` with this key would resume a run whose base SHA
# predates this merge and could never fast-forward onto the new main.
MERGED_SHA="$(git -C "$BASE_REPO" rev-parse HEAD)"
tmp="$MANIFEST.tmp.$$"
jq --arg sha "$MERGED_SHA" --arg at "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --arg main "$BASE_BRANCH" --arg br "$BRANCH" \
  '.orchestration.boardFinish = ((.orchestration.boardFinish // {}) + {status:"merged", mainBranch:$main, batchBranch:$br, mergeSha:$sha, mergedAt:$at, mergedBy:"tralph-merge"})' \
  "$MANIFEST" >"$tmp" && mv "$tmp" "$MANIFEST"
```

The merge also lands each ticket's `status: done` commit (gralph commits it on
the batch branch as `chore(kanban): mark #N done`), so after this the board
itself shows those tickets done — nothing else to edit by hand.

No supervisor to restart in board mode: `finish_board` is a one-shot that runs
at the end of the coordinator. After a successful manual merge, the run is
complete. To start the next board run, invoke `tralph` again (with the same
`--spec`, if any); because the manifest now records the merge, it plans fresh.

**No marker, coordinator exited early?** Merging only the verified commits (by hash, not the branch name) leaves `$BRANCH` unmerged, so `branch -d` correctly refuses it: keep it. The lane sweep above still applies; run it after that merge.

Only `git push` if the user explicitly asks.

**Spec runs: check for completion.** A deferred merge never got the `## Spec complete` section that `gralph` writes into the run report on a clean finish, so check it here once the batch has landed (skip for a whole-board run, `KEY=0`):

```bash
if [ "$KEY" != 0 ] && ~/.agents/skills/kanban/board.sh --board "$BASE_REPO/.kanban" --spec "$KEY" spec-done; then
  echo "Spec $KEY is complete: every ticket is done. Each was reviewed alone; run /finish-spec $KEY to check they compose into the spec."
fi
```

If it prints, include that line in your report.

## Report

Summarize: commits landed, files changed, any conflicts resolved, cleanup done
(lanes removed; lanes and extra worktrees kept, each with its reason; `du -sh .gralph`
so the user sees what is left),
and whether the supervisor is now free to start the next batch (worktree gone +
marker cleared). If you stopped early (batch still running, base dirty, conflict
the user wants to defer), say exactly what is blocking and the one command to
resume.
