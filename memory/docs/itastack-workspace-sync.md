---
title: itastack Workspace Has No Git, Synced by Syncthing
summary: Since 2026-10-22 itastack has no git; on wrk agents work in the WSL copy, synced by Syncthing with the Windows copy; .stversions is the only undo.
type: doc
status: promoted
created: 2026-10-25
updated: 2026-10-26
topics: []
---

## Active memory

- Since 2026-10-22 the itastack workspace has no git. Agents do not commit, and `sd.py` has no commit command.
- On wrk, agents work in the WSL copy `~/Documents/itastack`, not `/mnt/c`. A WSL Syncthing (user service, device `wrk-wsl`, GUI `127.0.0.1:8385`, listen 22001) syncs it with the Windows folder Obsidian uses.
- The only undo is Syncthing's `.stversions` on the Windows copy (30 days). History up to commit `43d70a9` is archived on wrk at `~/itastack-git-archive-2026-10-22.tar.gz`.
- Recorded from wrk; not checkable from aidev. Re-check on wrk before relying on it.
- itan8n's `~/itastack` is a different copy: still a git checkout of `itanoc/itastack` (70 commits ahead of origin on 2026-10-26), not synced by Syncthing, and still on the old wiki. Don't assume it matches wrk's copy.

## Related

- [pi footer git polling](memory/docs/pi-footer-git-polling.md) - the `/mnt/c` slowdown that moved agents to the WSL copy.
