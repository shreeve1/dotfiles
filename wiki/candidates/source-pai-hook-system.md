---
title: PAI Hook System Source Summary
type: source-summary
status: candidate
created: 2026-05-16
updated: 2026-05-16
sources:
  - wiki/raw/pai-hook-system.md
confidence: medium
tags:
  - pai
  - hooks
  - plugins
  - opencode
  - observability
---

# PAI Hook System Source Summary

## Summary

The PAI Hook System source describes event-driven automation infrastructure and notes its OpenCode status as primarily a legacy hook reference. It states that the active OpenCode runtime uses plugins under `~/.config/opencode/plugins/` and memory under `~/.pai/memory/`. Source: `wiki/raw/pai-hook-system.md`.

The source documents hook/event concepts such as SessionStart, SessionEnd, UserPromptSubmit, Stop, PreToolUse, PostToolUse, and PreCompact, along with common patterns for voice notifications, history capture, agent detection, tab state, async execution, and graceful failure. Source: `wiki/raw/pai-hook-system.md`.

The source also includes configuration notes, hook input format, development best practices, troubleshooting, advanced topics, shared libraries, unified event system concepts, and an OpenCode port-status appendix. Because the source is explicitly legacy in places, current runtime claims should be reconciled against `wiki/candidates/source-pai-memory-system.md` and live plugin files before promotion. Source: `wiki/raw/pai-hook-system.md`.

## Extracted Entities

| Entity | Description | Source |
|---|---|---|
| Hook System | Event-driven automation infrastructure reference. | `wiki/raw/pai-hook-system.md` |
| OpenCode plugins | Active runtime mechanism under `~/.config/opencode/plugins/`. | `wiki/raw/pai-hook-system.md` |
| SessionStart | Hook/event type for session initialization and context loading. | `wiki/raw/pai-hook-system.md` |
| UserPromptSubmit | Hook/event type for prompt preprocessing and capture. | `wiki/raw/pai-hook-system.md` |
| Unified Event Stream | Structured event stream concept for observability. | `wiki/raw/pai-hook-system.md` |

## Extracted Concepts

| Concept | Description | Source |
|---|---|---|
| Legacy hook reference | The document says it is primarily the legacy OpenCode hook reference. | `wiki/raw/pai-hook-system.md` |
| Graceful failure | Hooks should enhance experience without blocking OpenCode core functionality. | `wiki/raw/pai-hook-system.md` |
| Async non-blocking execution | Long work should not block primary interaction paths. | `wiki/raw/pai-hook-system.md` |
| Hook troubleshooting | The source includes troubleshooting for hooks, voice notifications, work capture, agent detection, and context loading. | `wiki/raw/pai-hook-system.md` |
| Hook-to-plugin migration | The appendix maps reachable OpenCode hook behavior into plugin status and tombstoned patterns. | `wiki/raw/pai-hook-system.md` |

## Decisions And Policies

- Active OpenCode runtime uses plugins under `~/.config/opencode/plugins/`, not the legacy hook paths alone. Source: `wiki/raw/pai-hook-system.md`.
- Hooks/plugins should fail gracefully and not block OpenCode core functionality. Source: `wiki/raw/pai-hook-system.md`.
- Hook code should be fast, non-blocking, read stdin properly, use file I/O carefully, and log to stderr for debugging. Source: `wiki/raw/pai-hook-system.md`.

## Candidate Promotion Notes

If promoted, this page should become `wiki/sources/pai-hook-system.md` with medium confidence and explicit legacy/current-runtime caveats. It should route to OpenCode Runtime, PAI Runtime, and Decisions.
