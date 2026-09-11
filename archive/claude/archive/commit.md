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
- Do not add AI attribution or co-author trailers unless the user explicitly asks.

Modes:
- `status`: read-only git state summary.
- `pull`: pull current branch after checking tracking state.
- `push`: commit requested local changes, then push.
- `sync`: pull first, then commit and push requested local changes.

## Pre-commit hygiene check

Before staging, scan the working tree against the ignore list below.

1. Run `git status --untracked-files=all` and `git ls-files` to enumerate working-tree paths.
2. Match paths against the patterns below.
3. Classify each match:
   - **Untracked + matches**: offer to append the pattern to `.gitignore`.
   - **Tracked + matches**: warn the user. Go to the **Cleanup** section.
   - **Secret + tracked**: STOP. Require explicit user confirmation before any further action. Recommend rotating the credential.
4. Skip patterns already present in `.gitignore` or any parent global ignore (`git check-ignore -v <path>`).

### Ignore list

**AI/coding tool artifacts**
- `.pi-lens/`, `.gitnexus/`, `.aider*`, `.cursor/`, `.continue/`, `.windsurf/`, `.codeium/`, `.tabnine/`, `.zed/`, `.specstory/`
- `.claude/projects/`, `.claude/todos/`, `.claude/shell-snapshots/`, `.claude/statsig/`, `.claude/settings.local.json`, `.claude/worktrees/`
- `.pi/agent-sessions/`, `.pi/todos/`
- `CLAUDE.local.md`, `AGENTS.local.md`

**Secrets/credentials** (CRITICAL — block, don't just warn)
- `.env`, `.env.*` (keep `.env.example`, `.env.sample`)
- `*.pem`, `*.key`, `*.p12`, `*.pfx`
- `id_rsa`, `id_ed25519`, `*.ppk`, `.ssh/`
- `.netrc`, `.npmrc` (only if it contains `_authToken`)
- `secrets.json`, `credentials.json`, `service-account*.json`
- `.aws/credentials`, `.kube/config`, `kubeconfig`
- `*.tfstate`, `*.tfstate.backup`, `.terraform/`

**OS/editor cruft**
- `.DS_Store`, `Thumbs.db`, `desktop.ini`
- `.idea/`, `.vs/`, `*.swp`, `*.swo`, `*~`

**Language caches/builds**
- Python: `__pycache__/`, `*.pyc`, `.pytest_cache/`, `.mypy_cache/`, `.ruff_cache/`, `.tox/`, `.coverage`, `htmlcov/`, `*.egg-info/`, `.venv/`, `venv/`, `.venv-*/`
- JS/TS: `node_modules/`, `.next/`, `.nuxt/`, `.turbo/`, `.parcel-cache/`, `.vite/`, `dist/`, `build/`, `.pnpm-store/`
- Rust/Java/Go: `target/`, `.gradle/`
- Ruby: `.bundle/`, `vendor/bundle/`
- Generic: `.cache/`, `coverage/`

**Logs/temp**
- `*.log`, `logs/`, `tmp/`, `.tmp/`, `*.pid`

**Ambiguous — ask, don't auto-add**
- `.vscode/` (sometimes shared team config)
- `vendor/` (intentionally tracked in some Go/PHP projects)
- `*.crt`, `*.pub` (often public, not secret)

## Cleanup (tracked files that match the ignore list)

When the hygiene check finds tracked files that should be ignored, propose the following cleanup. Never run without explicit user confirmation.

1. Show the user the full list of paths to be untracked.
2. Append the matching patterns to `.gitignore`.
3. Run `git rm -r --cached <path>` for each path (or pattern). This removes the path from the index but leaves the working-tree file in place.
4. Stage `.gitignore` plus the removals: `git add .gitignore && git add -u`.
5. Verify with `git status` that the working-tree files are now untracked and ignored.
6. Include the cleanup in the upcoming commit, or commit separately as `chore: untrack files now in .gitignore`.

Safety rules:
- Never use `git rm` (without `--cached`) — that deletes the file on disk.
- If a tracked file is a **secret**, do not just untrack. Warn the user that the secret remains in git history and recommend rotation plus history rewrite (e.g. `git filter-repo`) as a separate task.
- If the path is large or load-bearing (e.g. `vendor/`, `logs/` with content the project depends on), confirm with the user before untracking.
