---
id: 051
title: Fix tralph launcher and live ralph paths after Claude-lane archive
status: done
blocked_by: []
parent: null
created: 2026-09-10
updated: 2026-09-12
actor: ralph

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

- [x] `tralph()` in `.zshrc` invokes the `.agents` lane script
- [x] `bin/gralph` skill default resolves to an existing file
- [x] No live (non-archive) reference to `.claude/skills/ralph` remains

## Verification

`grep -n "agents/skills/ralph/ralph-loop.sh" .zshrc` and `bash -n .agents/skills/ralph/ralph-loop.sh` and `! grep -rn --exclude-dir=archive --exclude-dir=graphify-out --exclude-dir=.git "claude/skills/ralph" .zshrc bin/ .agents/`

## Implementation Notes

All four live callers repointed from `~/.claude/skills/ralph/...` to
`~/.agents/skills/ralph/...`:

- `.zshrc:342` — `tralph()` function now invokes the agents lane
- `bin/gralph:182` — `GRALPH_RALPH_SKILL` default
- `.agents/skills/ralph/ralph-loop.service.example:38` — `ExecStart`
- `.config/systemd/user/ralph-loop.service:3,25` — `Documentation` + `ExecStart`

Plus removed stale `.agents/skills/tralph-shepherd/SKILL.md.bak`
(untracked, gitignored `*.bak`) — it was a pre-`#047` backup of
`SKILL.md` and contained stale references that would have failed the
sweep verification clause.

## Review notes

Fresh review (PASS_WITH_NOTES) surfaced three out-of-scope findings,
all correctly left alone: (1) historical plan docs
(`plans/ralph-omp-migration.md`, `plans/ralph-remove-planner-review-each.md`)
keep pre-move paths because they record what was verified at the time;
(2) other `~/.claude/skills` callers (finish-spec in `bin/gralph:1243`,
`.pi/agent/settings.json.template`, and several `.agents/skills/*/SKILL.md`
prose references) are dead-lane but pre-existing and outside #051's
ralph-only scope — worth a follow-up ticket; (3) host-local
`~/.config/systemd/user/ralph-loop.service-bak-20260821T164544Z` is
not a unit (no `.service` suffix) and per
`plans/ralph-remove-planner-review-each.md` is correctly untouched.
