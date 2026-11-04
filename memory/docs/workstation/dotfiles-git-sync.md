---
title: Dotfiles Git Sync Across Machines
summary: Any machine may commit to dotfiles, so pull --rebase --autostash before committing; committing first rewrites origin/main and makes the others rebase.
type: doc
status: promoted
created: 2026-10-31
updated: 2026-11-04
topics: [workstation]
---

## Active memory

- Any machine may commit to the shared `origin/main`. Pull with `git pull --rebase --autostash` **before** committing: the working tree usually carries unrelated machine-local edits, and `--autostash` carries them across the rebase.
- Committing first and pulling afterwards rewrites `origin/main`: the rebase replays commits that were already on the remote, so the push lands as a forced update and every other machine then rebases its own local work on top of it. It resolves, but it churns all the checkouts.
- On the Linux machines `~/.pi/agent` is a symlink to the repo's `.pi/agent` and `~/.agents/skills` to the repo's `.agents/skills`, so a pi extension, pi skill or AGENTS skill in the repo *is* the installed one. A file under `~/.pi/agent/skills/` that is not in the repo is machine-local; itan8n's task skills are.

## Windows pi rules

- wrk Windows and surftop have `~/.pi/agent` and `~/.agents/skills` linked into their native dotfiles checkout. With `core.symlinks=false`, the tracked inner `.pi/agent/AGENTS.md` can be a plain file containing only `../../.agents/AGENTS.md`; pi then reads a path instead of the global guidance. A successful pull alone does not verify installation.
- On both machines the inner file was backed up next to itself as `AGENTS.md.herdr-sync-<timestamp>.bak` and replaced with a real symbolic link to the checkout's `.agents/AGENTS.md`. Verify installed content (or its hash), not just repository HEAD. Keep this a machine-local repair; Git may show `.pi/agent/AGENTS.md` modified while `core.symlinks=false`. Do not commit that local representation change.
- Reaching the Windows checkouts: from wsl, drive wrk Windows through interop (`"/mnt/c/Program Files/Git/cmd/git.exe" -C C:/Users/james/dotfiles ...`); wsl has no known_hosts entry for wrk Windows sshd, so `ssh james@100.95.235.60` fails host-key verification. Over ssh to surftop, write the git.exe path with forward slashes: backslashes are stripped in the ssh-to-cmd hop (`C:Program`).
- A pull blocked by an uncommitted root `AGENTS.md` edit (the same pi-fabric pin line on every machine, 2026-11-04): `git stash push -- AGENTS.md`, `git pull --ff-only`, `git stash pop`; check the edit applies on origin/main first.
- `.agents/skills/ego-browser` remains git-ignored, not tracked. James had the skill removed from all active systems on 2026-11-04; do not restore it during sync. Ego may recreate Windows junctions to `C:\Users\james\.local\share\ego\ego-skills`; unlink the junction itself, never delete through it into the app. Tracking it briefly (`d71fda81` to its removal) made pulls fail with `Invalid argument`. [Removal and retained CLI access](memory/docs/workstation/ego-browser-wsl-access.md) records the scope.

## Related

- [Herdr Projects Board Removed](memory/decisions/workstation/decision-herdr-projects-removed.md): a repo-wide removal that still had to be applied per machine.
