---
description: Git commit, push, pull, or sync with safety checks
agent: build
---

Perform git operations based on what the user asked for. Default to **sync** mode if not specified. $ARGUMENTS

## Modes

- **sync** (default) — Pull from remote, then commit and push any local changes
- **push** — Stage, commit, and push local changes
- **pull** — Pull from remote and merge
- **status** — Show current git state without making changes

## Phase 1 — Safety Checks (All Modes)

Run these checks first:

1. `git status` — inspect working tree state
2. `git branch --show-current` — confirm current branch
3. `git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null` — check remote tracking
4. `git rev-list --left-right --count HEAD...@{u} 2>/dev/null` — ahead/behind counts

**Sensitive file check** — scan unstaged changes for `.env`, `.env.*`, `credentials*`, `secret*`, `*.pem`, `*.key`. If found: warn the user and exclude from staging.

**Temp file check** — silently exclude `tmp*`, `*.tmp`, `*.swp`, `*.swo`, `*~`, `.DS_Store`.

## Phase 2 — Execute Mode

### status
Show branch name, remote tracking info, ahead/behind count, staged/unstaged/untracked files, and last 5 commit messages.

### pull
Run `git pull origin <current-branch>`. If merge conflict occurs, list conflicting files and ask how to proceed.

### push
1. Run `git diff --stat` and `git log --oneline -5` to review changes and observe commit style
2. Stage files **individually** using `git add <file>` — NEVER `git add .` or `git add -A`
3. Draft a concise commit message focused on *why*, not *what*
4. Commit with a co-author trailer:
   ```
   git commit -m "$(cat <<'EOF'
   <commit message>

   Co-Authored-By: OpenCode <noreply@opencode.ai>
   EOF
   )"
   ```
5. Push with `git push origin <current-branch>`

### sync
Execute **pull** first, then **push** if there are local changes after the pull.

## Rules

- NEVER commit `.env` files or anything containing secrets
- NEVER use `git add .` or `git add -A` — always stage specific files
- NEVER use `--force` push unless the user explicitly requests it
- NEVER amend previous commits — always create new commits
- NEVER skip pre-commit hooks (`--no-verify`)
- If the working tree is clean, report "Already in sync" and stop

## Report

```
Git <action> complete (<branch> -> origin/<branch>)

Commit: <short-hash>  (if applicable)
Files:  <N> changed, +<insertions> / -<deletions>

Skipped: <list of excluded files>  (if any)
```
