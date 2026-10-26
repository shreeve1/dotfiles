---
title: Starter-agent skill source
summary: personal-memory and memory-setup are edited in starter-agent, then synced into dotfiles.
type: doc
status: promoted
created: 2026-10-26
updated: 2026-10-26
topics: [knowledge]
---

`personal-memory` and `memory-setup` are edited in `~/starter-agent`, committed and pushed there, then copied into this repository with `bin/sync-starter-skills`. Never edit the dotfiles copies directly.

The skills run from the dotfiles copies (`~/.agents/skills` links to `dotfiles/.agents/skills`) and need nothing in starter-agent at runtime. Without `~/starter-agent`, only `bin/sync-starter-skills` stops working; starter-agent is on GitHub (`shreeve1/starter-agent`).

In starter-agent, a skill change also gets a line under `CHANGELOG.md` "Local changes", and `python3 .githooks/pre-commit` is run by hand before committing (hooks are disabled there).
