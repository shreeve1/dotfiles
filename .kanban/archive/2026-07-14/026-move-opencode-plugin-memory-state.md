---
id: 026
title: Move OpenCode plugin memory state
status: done
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

- [x] `pai-mode-router` writes router state and work artifacts under `~/.pai/memory/`.
- [x] `pai-isa-sync` writes `STATE/work.json` under `~/.pai/memory/`.
- [x] Plugin prompts no longer inject a required `~/.claude/PAI/Algorithm/v6.3.0.md` read.
- [x] Source-grep tests prove these two plugins contain no `~/.claude` references.
- [x] No broader OpenCode/Codex auth behavior is removed.
- [x] Relevant `.pai` tests pass and `.pai` typecheck passes.
- [x] This slice does not modify or delete files under `dotfiles/.claude/`.

## Blocked by

- Blocked by #023

## Implementation Notes

Updated `pai-isa-sync` to detect ISA/PRD artifacts under the actual `~/.pai/memory/WORK/` runtime path instead of the legacy `MEMORY/WORK/` string. Updated the injected OpenCode Algorithm mode prompt so it no longer requires reading `~/.claude/PAI/Algorithm/v6.3.0.md` and points ad-hoc ISA storage at `~/.pai/memory/WORK/{slug}/ISA.md`. Added source-grep tests proving the target plugins use shared PAI memory and do not contain `~/.claude` references.
