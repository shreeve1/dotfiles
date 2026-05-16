---
title: PAI Memory System Source Summary
type: source-summary
status: candidate
created: 2026-05-16
updated: 2026-05-16
sources:
  - wiki/raw/pai-memory-system.md
confidence: high
tags:
  - pai
  - memory
  - opencode
  - plugins
  - runtime
---

# PAI Memory System Source Summary

## Summary

The PAI Memory System source describes the OpenCode-native memory substrate for work artifacts, runtime state, verification, learning, observability, research, security, knowledge, and reviewed durable memory. It identifies version 8.0, runtime location `~/.pai/memory/`, and `PAI_RUNTIME_HOME` as the runtime override. Source: `wiki/raw/pai-memory-system.md`.

The source states that OpenCode is the active runtime and that PAI memory currently has partial automation: work state and ISA scaffolds are automatic, reflection files are automatic but substantive learning remains model-authored, and the canonical SQLite memory store exists and is tested but is not yet automatically distilled into sessions. Source: `wiki/raw/pai-memory-system.md`.

The source maps active OpenCode memory plugins, retrieval paths, reviewed-memory eligibility, known gaps, quick reference commands, migration notes, and related documentation. Source: `wiki/raw/pai-memory-system.md`.

## Extracted Entities

| Entity | Description | Source |
|---|---|---|
| PAI Memory System | Unified substrate for what happened, current work, verification, and recall. | `wiki/raw/pai-memory-system.md` |
| `pai-mode-router` | Plugin that writes mode-router state and creates Algorithm work ISA scaffolds. | `wiki/raw/pai-memory-system.md` |
| `pai-isa-sync` | Plugin that mirrors ISA state to `STATE/work.json`. | `wiki/raw/pai-memory-system.md` |
| `pai-config-audit` | Plugin that records OpenCode config edits in observability logs. | `wiki/raw/pai-memory-system.md` |
| Canonical SQLite Memory Store | Review-gated durable memory database at `~/.pai/memory/memories.sqlite`. | `wiki/raw/pai-memory-system.md` |

## Extracted Concepts

| Concept | Description | Source |
|---|---|---|
| Tool-neutral runtime root | Active PAI memory is stored under `~/.pai/memory`. | `wiki/raw/pai-memory-system.md` |
| Partial automation | Current plugins create work state and reflection markers, but not automatic substantive memory distillation. | `wiki/raw/pai-memory-system.md` |
| Review-gated memory injection | Only accepted, medium/high trust, non-inferred memories are eligible for instruction/context injection. | `wiki/raw/pai-memory-system.md` |
| Explicit context search | A prompt starting `context search:` must run ContextSearch before answering, planning, or editing. | `wiki/raw/pai-memory-system.md` |
| Known memory gaps | Missing pieces include memory-ingest plugin, startup context wiring, review UX, hook-doc split, and substantive LEARN authorship decision. | `wiki/raw/pai-memory-system.md` |

## Decisions And Policies

- Active runtime memory belongs under `~/.pai/memory/...`. Source: `wiki/raw/pai-memory-system.md`.
- Absence of a memory subdirectory can mean no active writer has needed it yet. Source: `wiki/raw/pai-memory-system.md`.
- In current OpenCode, `pai-memory` retrieval exists in code and tests but is not automatically injected into every session. Source: `wiki/raw/pai-memory-system.md`.
- Historical memory paths may exist as compatibility assets, but they are not active runtime reads. Source: `wiki/raw/pai-memory-system.md`.

## Candidate Promotion Notes

If promoted, this page should become `wiki/sources/pai-memory-system.md`. It should route to PAI Runtime, OpenCode Runtime, and Decisions.
