---
id: 022
title: Restrict shared memory to OpenCode and Pi
status: done
type: AFK
priority: 22
blocked_by: []
parent: null
created: 2026-05-09
updated: 2026-05-09
actor: ralph
---

## What to build

Restrict the shared PAI memory harness so OpenCode and Pi are the only active shared-memory writers. Claude Code and Codex stay installed and usable, but their harness tracers become disabled-by-default historical adapters and bridge-only archive sources.

Move active OpenCode plugin state that participates in shared memory from `~/.claude/MEMORY/` to the canonical `~/.pai/memory/` substrate.

## Acceptance criteria

- [x] Claude install plan fixtures default to `enabled: false`.
- [x] Codex install plan fixtures default to `enabled: false`.
- [x] OpenCode and Pi install plan fixtures remain enabled by default.
- [x] `session-wrapper.ts` keeps Claude/Codex as recognized targets but skips shared-memory lifecycle writes for them.
- [x] Bridge #008 returns a hard structured error for new Claude/Codex bridge-read writes while preserving historical reads.
- [x] `pai-mode-router` and `pai-isa-sync` write state under `~/.pai/memory/` and contain no `~/.claude` references.
- [x] `progress.md` records the scope change and disposition of #008-#012.
- [x] No files under `dotfiles/.claude/` are modified.
- [x] `bun test` and `bun typecheck` pass in `.pai/`.

## Blocked by

- Prerequisites #008, #011, #012, #017, and #018 are complete.
- Child slices #023-#027 carry the remaining implementation and documentation work.

## Implementation Notes

Verified the parent scope issue against completed child slices #023 through #027. No source-code changes were needed: installer fixtures already disable Claude/Codex and enable OpenCode/Pi, `session-wrapper.ts` already recognizes Claude/Codex while skipping shared-memory lifecycle writes, `legacy-bridge.ts` already hard-errors new Claude/Codex bridge writes, OpenCode mode-router and ISA sync state already target `~/.pai/memory/`, and progress/docs already record the narrowed scope. Review reran `.pai` tests and typecheck successfully before closing.
