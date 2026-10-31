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

## Windows pi rules

- wrk Windows and surftop have `~/.pi/agent` and `~/.agents/skills` linked into their native dotfiles checkout. With `core.symlinks=false`, the tracked inner `.pi/agent/AGENTS.md` can be a plain file containing only `../../.agents/AGENTS.md`; pi then reads a path instead of the global guidance. A successful pull alone does not verify installation.
- On both machines the inner file was backed up next to itself as `AGENTS.md.herdr-sync-<timestamp>.bak` and replaced with a real symbolic link to the checkout's `.agents/AGENTS.md`. Verify installed content (or its hash), not just repository HEAD. Keep this a machine-local repair; Git may show `.pi/agent/AGENTS.md` modified while `core.symlinks=false`. Do not commit that local representation change.

## Related

- [Herdr Projects Board Removed](memory/decisions/workstation/decision-herdr-projects-removed.md): a repo-wide removal that still had to be applied per machine.
