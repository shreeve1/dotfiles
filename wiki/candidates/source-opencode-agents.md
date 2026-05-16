---
title: OpenCode Global Agent Notes Source Summary
type: source-summary
status: candidate
created: 2026-05-16
updated: 2026-05-16
sources:
  - wiki/raw/opencode-agents.md
confidence: high
tags:
  - opencode
  - pai
  - modes
  - algorithm
  - delegation
---

# OpenCode Global Agent Notes Source Summary

## Summary

The OpenCode global agent notes define high-priority safety rules, user preferences, the PAI response mode system, identity rules, context routing, PiPerspective boundaries, verbosity behavior, and subagent delegation invariants. Source: `wiki/raw/opencode-agents.md`.

The source states that every response must use exactly one of MINIMAL, NATIVE, or ALGORITHM format. It classifies greetings/ratings/acknowledgments as MINIMAL, quick single-step tasks as NATIVE, and multi-step, complex, debugging, design, or multi-file work as ALGORITHM. Source: `wiki/raw/opencode-agents.md`.

For ALGORITHM mode, the source identifies `~/.pai/PAI/Algorithm/v6.4.0.md` as the Algorithm source of truth and requires the visible seven-phase banner and phase labels. It also describes the ISA as the single source of truth for ideal-state articulation, criteria, verification, and the system of record. Source: `wiki/raw/opencode-agents.md`.

The delegation section instructs agents to pass complete prompts, parallelize independent work, avoid delegation when direct tool use is faster, and use a scout/planner/review/executor/validator sequence for infrastructure changes. Source: `wiki/raw/opencode-agents.md`.

## Extracted Entities

| Entity | Description | Source |
|---|---|---|
| OpenCode global agent notes | Always-loaded instruction file for global PAI/OpenCode behavior. | `wiki/raw/opencode-agents.md` |
| PAI Mode System | Response-format classifier with MINIMAL, NATIVE, and ALGORITHM modes. | `wiki/raw/opencode-agents.md` |
| Algorithm v6.4.0 | Source of truth for Algorithm execution. | `wiki/raw/opencode-agents.md` |
| ISA | System of record for ideal-state articulation, criteria, verification, and completion. | `wiki/raw/opencode-agents.md` |
| PiPerspective | Structured second-mind review system with explicit memory-boundary rules. | `wiki/raw/opencode-agents.md` |

## Extracted Concepts

| Concept | Description | Source |
|---|---|---|
| One response mode | Every response must use exactly one of MINIMAL, NATIVE, or ALGORITHM. | `wiki/raw/opencode-agents.md` |
| Algorithm visible phase contract | ALGORITHM responses must visibly include the seven phases in order. | `wiki/raw/opencode-agents.md` |
| Context routing | PAI internals, user context, and project context should be loaded on demand using `~/.pai/PAI/CONTEXT_ROUTING.md`. | `wiki/raw/opencode-agents.md` |
| PiPerspective memory boundary | Pi does not auto-receive PAI memory; relevant memory must be copied into ISA or plan explicitly. | `wiki/raw/opencode-agents.md` |
| Complete-context delegation | Subagents need complete prompts because they do not inherit conversation context. | `wiki/raw/opencode-agents.md` |

## Decisions And Policies

- Never publish secrets, commit `.env`, or lock yourself out of a remote system. Source: `wiki/raw/opencode-agents.md`.
- New agents must use global `"*": "allow"` permissions, not `ask` or `deny`. Source: `wiki/raw/opencode-agents.md`.
- The global file should not duplicate behavioral rules that live in `~/.pai/PAI/AISTEERINGRULES.md` and `~/.pai/PAI/USER/AISTEERINGRULES.md`. Source: `wiki/raw/opencode-agents.md`.
- Infrastructure changes should follow scout, planner, human review, executor, validator sequencing. Source: `wiki/raw/opencode-agents.md`.

## Candidate Promotion Notes

If promoted, this page should become `wiki/sources/opencode-agents.md`. It should route to OpenCode Runtime, PAI Runtime, Skills And Agents, and Decisions.
