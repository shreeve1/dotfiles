---
title: Dotfiles Git Sync Across Machines
summary: Any machine may commit to dotfiles, so pull --rebase --autostash before committing; committing first rewrites origin/main and makes the others rebase.
type: doc
status: promoted
created: 2026-10-31
updated: 2026-10-31
topics: [workstation]
---

## Active memory

- Any machine may commit to the shared `origin/main`. Pull with `git pull --rebase --autostash` **before** committing: the working tree usually carries unrelated machine-local edits, and `--autostash` carries them across the rebase.
- Committing first and pulling afterwards rewrites `origin/main`: the rebase replays commits that were already on the remote, so the push lands as a forced update and every other machine then rebases its own local work on top of it. It resolves, but it churns all the checkouts.
- On the Linux machines `~/.pi/agent` is a symlink to the repo's `.pi/agent` and `~/.agents/skills` to the repo's `.agents/skills`, so a pi extension, pi skill or AGENTS skill in the repo *is* the installed one. A file under `~/.pi/agent/skills/` that is not in the repo is machine-local; itan8n's task skills are.

## Related

- [Herdr Projects Board Removed](memory/decisions/workstation/decision-herdr-projects-removed.md): a repo-wide removal that still had to be applied per machine.
