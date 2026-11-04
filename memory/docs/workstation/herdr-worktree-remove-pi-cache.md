---
title: herdr worktree remove and the live pi mesh cache
summary: A task pane's live pi session rewrites .pi/fabric/mesh/state.json, so herdr worktree remove refuses a "clean" worktree; delete .pi and remove in one command, then clear the dir it leaves.
type: doc
status: promoted
created: 2026-11-04
updated: 2026-11-04
topics: [workstation]
---

## Active memory

- While a task's pi session still runs in the worktree pane, pi-fabric rewrites `.pi/fabric/mesh/state.json` within seconds of it being deleted. Deleting `.pi/` in one call and running `herdr worktree remove --workspace <id>` in the next fails with git's "contains modified or untracked files, use --force".
- Working sequence (no `--force`): in one shell command, check that the only untracked content is under `.pi/fabric/`, `rm -rf <worktree>/.pi`, then `herdr worktree remove --workspace <id>`. It returns `worktree_removed` and closes the workspace's panes.
- The closing session writes the mesh cache once more, so `<worktree>/.pi/fabric/mesh/state.json` can reappear in an otherwise empty directory after removal. Check that it is the only file, then delete the directory.
- A plain `git worktree remove` of a worktree with no live pi pane (for example a fanout integration copy whose reviewer tabs were already closed) needs none of this.
- Seen 2026-11-04 cleaning up fanout run-41MF9E (dsh-superagent W1/W2 worktrees).

## Related

- [Herdr Two-Way Collaboration](memory/preferences/herdr-two-way-collaboration.md): the parent session owns this cleanup, which section 7 of the herdr-handoff skill describes.
