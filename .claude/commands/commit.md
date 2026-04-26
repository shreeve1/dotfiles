---
name: commit
description: Git operations — commit, push, pull, merge, or status with safety checks
model: sonnet
---

# Git Operations Command

Handle all common git operations with safety checks: commit & push, pull & merge, sync (pull + commit + push), or status review.

## Usage

- `/cc-commit` or `/cc-commit:sync` — Full sync (pull → commit → push)
- `/cc-commit:push` — Stage, commit, and push changes
- `/cc-commit:pull` — Pull from remote and merge
- `/cc-commit:status` — Show current git state

## Safety Checks (All Actions)

Before any operation:

1. Run `git status` to see working tree state
2. Confirm current branch name
3. Check if branch tracks a remote and whether it's ahead/behind
4. Scan for sensitive files in unstaged changes:
   - `.env`, `.env.*`, `credentials*`, `secret*`, `*.pem`, `*.key`
   - If found, **warn the user** and exclude from staging
5. Scan for temp files (`tmp*`, `*.tmp`, `*.swp`, `*.swo`, `*~`, `.DS_Store`)
   - Exclude these from staging silently

## Actions

### status
Show current state without changing anything:
- Branch, tracking info, ahead/behind count
- Staged, unstaged, and untracked files
- Last 5 commit messages

### pull
Pull from remote and merge:
- Run `git pull origin <current-branch>`
- If merge conflict occurs: list files and ask how to proceed

### push
Stage, commit, and push:
1. Run `git diff --stat` to review changes
2. Run `git log --oneline -5` to match commit message style
3. Stage files individually (never `git add .` or `git add -A`)
4. Draft concise commit message (focus on "why", not "what")
5. Commit with HEREDOC format, appending:
   ```
   Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
   ```
6. Push to remote: `git push origin <current-branch>`

### sync (default)
Execute pull first, then commit/push if there are local changes.

## Output

After completion, provide a summary:

```
Git <action> complete (<branch> → origin/<branch>)

Commit: <short-hash> (if applicable)
Files: <N> changed, +<insertions> / -<deletions>

Skipped: <list of excluded files> (if any)
```

## Rules

- NEVER commit `.env` files or anything containing secrets/credentials
- NEVER use `git add .` or `git add -A` — always stage specific files
- NEVER use `--force` push unless explicitly requested
- NEVER amend previous commits — always create new commits
- NEVER skip pre-commit hooks (`--no-verify`)
- If working tree is clean, report "Already in sync"
- If pull results in merge conflicts, stop and ask the user
