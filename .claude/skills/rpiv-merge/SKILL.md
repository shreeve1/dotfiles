---
name: rpiv-merge
description: Review the branches an rpiv-run pipeline left behind, pick one, inspect its diff, test it, and merge it into the base branch. USE WHEN user says "rpiv-merge", "merge the rpiv work", "merge the worktree the pipeline made", "which rpiv branches are open", or wants to land a finished rpiv-run pipeline branch. Interactive — confirms before the merge.
---

# rpiv-merge

The post-pipeline landing step. `rpiv-run` finishes each run on a fresh
`rpiv/<TS>` branch, committed but **not merged and not pushed** — testing is the
real checkpoint. This skill walks that last mile: enumerate the candidate
branches, let the user pick one, review the diff, test it, then merge.

`$ARGUMENTS` is optional:
- empty — operate on the current repo (cwd).
- a path — `cd` there first (the repo where the pipeline ran).
- an `rpiv/<TS>` branch name — skip the picker and go straight to that branch.

> **Terminology:** `rpiv-run` creates a **branch** (`git checkout -b rpiv/<TS>`),
> not a git worktree, in the repo's own working directory. The user may call it a
> "worktree" — they mean the pipeline branch.

## Hard rules

1. **Confirm before merging.** A merge mutates the base branch (shared state).
   Show the user exactly what will merge into what, and get a yes before running
   `git merge`. Never merge silently.
2. **Never push unless asked.** Landing the branch locally is the default. Only
   `git push` if the user explicitly says so.
3. **Never force, never discard.** No `--force`, no `reset --hard`, no
   `checkout --` over uncommitted work. If the merge conflicts, *resolve* it with
   the user — do not abort-and-overwrite or pick a side blindly.
4. **Never delete a branch without confirmation.** Offer cleanup after a
   successful merge; only delete if the user agrees.
5. **Testing is the user's gate.** Don't push toward merge until the user has
   seen the diff and is satisfied with testing. If tests fail, stop and report —
   do not merge a red branch.

## Phase 1 — Locate repo and enumerate candidate branches

If `$ARGUMENTS` is a path, `cd` there. Confirm it's a git repo.

List the pipeline branches, newest first:

```bash
git for-each-ref --sort=-committerdate refs/heads/ \
  --format='%(refname:short)|%(committerdate:relative)' \
  | grep -E '^rpiv/'
```

(If the user set a custom `RPIV_BRANCH_PREFIX`, branches use that prefix instead
of `rpiv/`. If none match, also try `git worktree list` in case the user made a
real worktree by hand.)

**Determine the base branch per candidate — do not assume `main`.** The driver
records the exact fork point at kickoff in `.rpiv/run/<TS>/.base`; read it back.
If that file is absent (older run, or logs not present on this machine), derive
the repo default and confirm it with the user *before* showing any diff:

```bash
B=rpiv/<TS>; TS=${B#rpiv/}
BASE="$(cat ".rpiv/run/$TS/.base" 2>/dev/null)"          # exact, if recorded
[ -n "$BASE" ] || BASE="$(git symbolic-ref --short -q refs/remotes/origin/HEAD | sed 's@^origin/@@')"
[ -n "$BASE" ] || BASE="$(git config --get init.defaultBranch || echo main)"
```

A wrong base makes the Phase 2 diff misleading, so when `.base` was missing, state
the base you derived and let the user override before continuing. For each
candidate, gather:

```bash
git rev-list --count "$BASE..$B"        # commits ahead
git diff --stat "$BASE...$B" | tail -1  # files / lines changed
git branch --merged "$BASE" | grep -qxF "  $B" && echo "ALREADY MERGED into $BASE"
```

Check whether the run actually **completed**: its log dir is `.rpiv/run/<TS>/`
(TS = the branch name after the prefix). A finished run has a `commit.log` whose
tail contains a `RPIV_DONE_` marker and `Working tree: clean`.

```bash
tail -20 ".rpiv/run/$TS/commit.log" 2>/dev/null
```

These logs are git-ignored and local: on a different machine they will be absent.
Treat a missing log as **completed? = unknown**, not as a failed run.

If exactly one candidate exists, name it and move on. If several, present a short
table (branch, age, commits ahead, files changed, completed?, **already merged?**)
and use **AskUserQuestion** to let the user pick which one to work on. Flag any
already-merged branch so the user doesn't re-merge stale work. If zero, say so
and stop.

## Phase 2 — Review the diff

For the chosen branch, give the user a real look before any merge:

```bash
git --no-pager diff "$BASE...$B" --stat      # the shape
git --no-pager log --oneline "$BASE..$B"     # the commits
git --no-pager diff "$BASE...$B"             # full diff (or per-file on request)
```

Summarize what the change does in a sentence or two grounded in the diff (not in
the pipeline's own logs). Surface anything that looks off — unrelated files,
secrets, large generated blobs, deletions the user might not expect. Read the
FRD (`.rpiv/artifacts/discover/`) and the run's `code-review.log` /
`validate.log` if useful context, but trust the diff over the logs.

## Phase 3 — Test

Check out the branch so the user can exercise it. **Guard the working tree
first** — switching branches with uncommitted changes either fails or drags them
across:

```bash
git status --porcelain | grep -q . && echo "DIRTY: stash or commit before switching"
git checkout "$B"
```

If the tree is dirty, stop and surface it — let the user stash or commit; never
force the checkout or discard their changes.

Detect the project's test/build command rather than guessing — check
`package.json` scripts, `Makefile`, `pyproject.toml`, CI config, or ask. Offer to
run the cheap checks (typecheck / unit tests / build). For anything that needs a
running app or a browser, say so explicitly and let the user drive — don't claim
a UI works without exercising it.

If tests fail: stop. Report what failed. Do **not** proceed to merge. Offer to
help fix on the branch, or hand back to `/revise` + `/implement`.

## Phase 4 — Merge

Only after the user is satisfied with the diff and testing. Confirm the exact
operation first ("merge `rpiv/<TS>` into `main`?"), then:

```bash
git checkout "$BASE"
git merge --no-ff "$B"     # --no-ff keeps the pipeline branch legible in history
```

- If it conflicts: present the conflicting files, resolve **with** the user, then
  complete the merge. Never `merge --abort` and silently fall back, never pick a
  side without asking.
- After a clean merge, report the new HEAD and the merged file list.

## Phase 5 — Cleanup (offer, don't assume)

Ask whether to:
- **Delete the merged branch** (`git branch -d "$B"` — the safe `-d`, never `-D`
  unless the user insists after seeing it's unmerged).
- **Push the base branch** (`git push`) — only if the user asks. Default is no.
- Leave the `.rpiv/run/<TS>/` logs as-is (they're git-ignored, local, harmless).

## Source of truth

- Driver: `~/dotfiles/bin/rpiv-run` — branch is `${RPIV_BRANCH_PREFIX:-rpiv}/<TS>`,
  created at `git checkout -b` (~line 175); logs land in `.rpiv/run/<TS>/`.
- Pipeline philosophy: memory `feedback_rpiv_pipeline.md` — commit always, never
  push, testing post-pipeline is the real checkpoint (this skill *is* that
  checkpoint).
- Diagnose a *running* pipeline with the `rpiv-monitor` skill instead.
