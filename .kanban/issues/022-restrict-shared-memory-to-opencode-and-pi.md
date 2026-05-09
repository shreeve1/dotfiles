---
id: 022
title: Restrict shared memory to OpenCode and Pi
status: in_progress
type: AFK
blocked_by: []
parent: null
created: 2026-05-09
updated: 2026-05-09
actor: opencode
---

## What to build

Restrict the shared PAI memory harness so OpenCode and Pi are the only active shared-memory writers. Claude Code and Codex stay installed and usable, but their harness tracers become disabled-by-default historical adapters and bridge-only archive sources.

Move active OpenCode plugin state that participates in shared memory from `~/.claude/MEMORY/` to the canonical `~/.pai/memory/` substrate.

## Acceptance criteria

- [ ] Claude install plan fixtures default to `enabled: false`.
- [ ] Codex install plan fixtures default to `enabled: false`.
- [ ] OpenCode and Pi install plan fixtures remain enabled by default.
- [ ] `session-wrapper.ts` keeps Claude/Codex as recognized targets but skips shared-memory lifecycle writes for them.
- [ ] Bridge #008 returns a hard structured error for new Claude/Codex bridge-read writes while preserving historical reads.
- [ ] `pai-mode-router` and `pai-isa-sync` write state under `~/.pai/memory/` and contain no `~/.claude` references.
- [ ] `progress.md` records the scope change and disposition of #008-#012.
- [ ] No files under `dotfiles/.claude/` are modified.
- [ ] `bun test` and `bun typecheck` pass in `.pai/`.

## Blocked by

- Prerequisites #008, #011, #012, #017, and #018 are complete.
- Child slices #023-#027 carry the remaining implementation and documentation work.
