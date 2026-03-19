---
name: merge
description: Merge a feature branch into its base branch with optional worktree cleanup, remote push, and branch deletion. Use after dev-build or dev-test completes successfully, when the user says "merge", "merge and clean up", "wrap up this branch", or when any skill hands off to the merge step.
---

# Merge and Clean Up

Use this skill to merge a completed feature branch into its base branch, push to remote, remove the worktree if one was used, and delete the feature branch. Designed as the final step in the dev-plan → dev-build → dev-test pipeline, but works standalone for any branch-based workflow. Do not use for complex merge conflict resolution, interactive rebasing, or merging between two non-default branches - those need direct user involvement.

---

## Phase 1 - Assess Workspace State

Run diagnostics to understand the current situation:

```bash
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null)
GIT_DIR=$(git rev-parse --git-dir 2>/dev/null)
GIT_COMMON=$(git rev-parse --git-common-dir 2>/dev/null)
IS_LINKED_WORKTREE="no"
[ "$GIT_DIR" != "$GIT_COMMON" ] && IS_LINKED_WORKTREE="yes"

echo "REPO_ROOT=$REPO_ROOT"
echo "CURRENT_BRANCH=$CURRENT_BRANCH"
echo "IS_LINKED_WORKTREE=$IS_LINKED_WORKTREE"
echo "--- worktree list ---"
git worktree list 2>/dev/null
echo "--- commits ahead of base ---"
DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@')
[ -z "$DEFAULT_BRANCH" ] && DEFAULT_BRANCH="main"
git log --oneline "$DEFAULT_BRANCH".."$CURRENT_BRANCH" 2>/dev/null
echo "--- uncommitted changes ---"
git status --porcelain 2>/dev/null
echo "--- remote tracking ---"
git rev-parse --abbrev-ref @{upstream} 2>/dev/null || echo "NO_UPSTREAM"
```

Determine:
- **Feature branch**: the branch to merge (usually the current branch)
- **Base branch**: where to merge into (detect from tracking info, or default to `main`/`master`)
- **Worktree path**: if currently in a linked worktree, note the path for cleanup
- **Commits ahead**: how many commits will be merged
- **Uncommitted changes**: staged or unstaged work that needs handling

If not in a git repo, stop and report.

If on `main` or `master` already, ask what branch to merge - do not assume.

If there are uncommitted changes, use `question` to ask whether to commit first, stash, or abort.

---

## Phase 2 - Confirm the Merge

Present a single confirmation showing exactly what will happen. Use `question` with a select prompt:

```
Ready to merge and clean up?

  Branch:    feat/my-feature → main
  Commits:   3 ahead
  Worktree:  .worktrees/feat-my-feature (will be removed)
  Remote:    will push to origin/main

Options:
  - "Merge, push, and clean up" (Recommended)
  - "Merge only (no push, keep worktree)"
  - "Cancel"
```

Adapt the details to the actual state. If there is no worktree, omit the worktree line. If there is no remote, omit the push line.

This is the only confirmation needed. Do not ask again during subsequent phases.

---

## Phase 3 - Merge

If currently in a worktree, navigate to the primary checkout before merging. The primary checkout path can be derived from `git rev-parse --git-common-dir`.

```bash
# If in a worktree, find and move to the primary checkout
if [ "$IS_LINKED_WORKTREE" = "yes" ]; then
  PRIMARY=$(cd "$(git rev-parse --git-common-dir)/.." && pwd)
else
  PRIMARY="$REPO_ROOT"
fi
```

Execute the merge from the primary checkout using `bash`:

```bash
git checkout <base-branch>
git merge <feature-branch> --no-edit
```

If the merge has conflicts:
- Report the conflicting files clearly
- Do NOT attempt automatic conflict resolution
- Ask whether to resolve manually, abort the merge, or stop entirely

---

## Phase 4 - Push (if requested)

```bash
git push origin <base-branch>
```

If push fails:
- Report the error
- Do not force push unless the user explicitly requests it
- If the remote is ahead, suggest `git pull --rebase origin <base-branch>` then retry

---

## Phase 5 - Worktree Cleanup (if applicable)

Only run this phase if the work was done in a linked worktree.

```bash
git worktree remove <worktree-path> --force
git worktree prune
```

If removal fails (e.g., modified files remain), report the error and suggest manual cleanup.

---

## Phase 6 - Branch Cleanup

Delete the feature branch locally:

```bash
git branch -d <feature-branch>
```

If the branch has been pushed to remote, also delete it there:

```bash
git push origin --delete <feature-branch>
```

If `-d` fails because git does not consider the branch fully merged, report this and use `question` to ask whether to force-delete with `-D`.

---

## Report

On success:

```text
## Merge Complete

Feature:  <feature-branch>
Into:     <base-branch>
Commits:  <N> merged
Push:     <pushed to origin | skipped>
Worktree: <removed <path> | not applicable>
Branch:   <deleted local + remote | deleted local only | kept>

Status: ✅ Done
```

On partial failure:

```text
## Merge Incomplete

Completed:
- <steps that succeeded>

Failed at:
- <step and error details>

Next steps:
- <what the user should do>

Status: ❌ Needs attention
```

---

## Integration

**Called by:**
- `dev-build` (Phase 10) - after successful implementation
- `dev-test` (Post-Test Merge Decision) - after tests pass

**Pairs with:**
- `worktree` - creates the workspaces this skill cleans up
