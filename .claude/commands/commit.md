---
description: Git status, commit, push, pull, or sync with safety checks
---

Perform the requested git operation in Claude Code. If no explicit commit/push/pull/sync action is requested, show status and ask before changing anything.

Arguments: $ARGUMENTS

Rules:
- Inspect `git status`, `git diff`, and recent commits before committing.
- Stage only intended files explicitly; never use `git add .` or `git add -A`.
- Never commit `.env`, credentials, tokens, private keys, or secrets.
- Never force-push, amend, skip hooks, or auto-commit without explicit user request.
- Use the canonical `caveman-commit` skill to draft the commit message when useful.
- Do not add AI attribution or co-author trailers unless the user explicitly asks.

Modes:
- `status`: read-only git state summary.
- `pull`: pull current branch after checking tracking state.
- `push`: commit requested local changes, then push.
- `sync`: pull first, then commit and push requested local changes.
