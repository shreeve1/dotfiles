---
id: 051
title: Fix tralph launcher and live ralph paths after Claude-lane archive
status: pending
blocked_by: []
parent: null
created: 2026-09-10
updated: 2026-09-10
actor: to-tickets

## What to build

`tralph` works again. The Claude lane moved to `archive/claude/` today, so
every live (non-archive) caller of `~/.claude/skills/ralph/...` is broken.
Repoint them at the canonical `~/.agents/skills/ralph/...` lane:

1. The `tralph()` function in `.zshrc` (currently calls the dead path).
2. `bin/gralph`'s `GRALPH_RALPH_SKILL` default (currently
   `$HOME/.claude/skills/ralph/SKILL.md`).
3. Sweep the repo for any other live `~/.claude/skills/ralph` reference
   outside `archive/` and fix those too. Do not touch `archive/claude/`.

## Acceptance criteria

- [ ] `tralph()` in `.zshrc` invokes the `.agents` lane script
- [ ] `bin/gralph` skill default resolves to an existing file
- [ ] No live (non-archive) reference to `.claude/skills/ralph` remains

## Verification

`grep -n "agents/skills/ralph/ralph-loop.sh" .zshrc` and `bash -n .agents/skills/ralph/ralph-loop.sh` and `! grep -rn --exclude-dir=archive --exclude-dir=graphify-out --exclude-dir=.git "claude/skills/ralph" .zshrc bin/ .agents/`
