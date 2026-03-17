---
description: Merge feature branch into primary branch and clean up worktree
agent: build
---

Merge the current feature branch into the primary branch and optionally clean up the worktree and branch. $ARGUMENTS

## Step 1 — Gather State

```bash
CURRENT_BRANCH=$(git branch --show-current)
IS_LINKED_WORKTREE (check if git-dir != git-common-dir)
PRIMARY (detect from origin/HEAD, or fall back to main/master)
```

Run `git worktree list` and `git status --porcelain`.

If not in a git repo, stop. If already on the primary branch, stop.

## Step 2 — Pre-Merge Checks

### Uncommitted changes
If there are uncommitted changes, commit them first using the `/commit push` workflow. Feature work should not be lost.

### Check merge feasibility
Fetch the primary branch and check for conflicts. If conflicts detected, report which files and ask: resolve manually or abort.

### Summarize what will be merged
Show commits and files changed:
```
Ready to merge into <primary>:
  Branch: <current>
  Commits: <N>
  Files changed: <N>
  Insertions: +<N>  Deletions: -<N>
```

## Step 3 — Confirm and Merge

Ask once:
- "Yes — merge, delete branch, remove worktree"
- "Merge only — keep branch and worktree"
- "Cancel"

If in a worktree, switch to the primary checkout first. Then:
```bash
git checkout <primary>
git pull origin <primary>
git merge <feature> --no-ff -m "Merge <feature> into <primary>"
```

If merge fails, abort and report.

## Step 4 — Push

```bash
git push origin <primary>
```

Do not force-push.

## Step 5 — Clean Up (if full cleanup selected)

1. Remove the worktree: `git worktree remove <path> --force && git worktree prune`
2. Delete local branch: `git branch -d <feature>` (use `-D` if needed, note in report)
3. Delete remote branch if it exists: `git push origin --delete <feature>`

## Report

```
Merge Complete

Branch: <feature> -> <primary>
Commits merged: <N>
Files changed: <N>

Cleanup:
  Worktree removed: <path>
  Local branch deleted: <feature>
  Remote branch deleted: <feature>
  Pushed to origin/<primary>

Current state:
  Branch: <primary>
  Status: clean
```

## Error Recovery

| Situation | Action |
|---|---|
| Uncommitted changes | Auto-commit before merge |
| Merge conflicts | Report files, ask user |
| Push rejected | Report error, do not force-push |
| Worktree remove fails | Prune and retry once |
| Branch delete fails with -d | Use -D, note in report |
