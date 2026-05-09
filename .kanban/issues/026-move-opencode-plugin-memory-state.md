---
id: 026
title: Move OpenCode plugin memory state
status: in_progress
type: AFK
priority: 26
blocked_by: [023]
parent: 022
created: 2026-05-09
updated: 2026-05-09
actor: ralph
---

## Parent

#022

## What to build

Move OpenCode PAI runtime plugin state for mode routing and ISA sync from Claude memory paths to the shared PAI memory substrate at `~/.pai/memory/`.

## Acceptance criteria

- [ ] `pai-mode-router` writes router state and work artifacts under `~/.pai/memory/`.
- [ ] `pai-isa-sync` writes `STATE/work.json` under `~/.pai/memory/`.
- [ ] Plugin prompts no longer inject a required `~/.claude/PAI/Algorithm/v6.3.0.md` read.
- [ ] Source-grep tests prove these two plugins contain no `~/.claude` references.
- [ ] No broader OpenCode/Codex auth behavior is removed.
- [ ] Relevant `.pai` tests pass and `.pai` typecheck passes.
- [ ] This slice does not modify or delete files under `dotfiles/.claude/`.

## Blocked by

- Blocked by #023
