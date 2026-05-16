---
title: PAI Context Routing Source Summary
type: source-summary
status: candidate
created: 2026-05-16
updated: 2026-05-16
sources:
  - wiki/raw/pai-context-routing.md
confidence: high
tags:
  - pai
  - context
  - routing
  - runtime
---

# PAI Context Routing Source Summary

## Summary

The Context Routing source defines the on-demand context loading map for PAI. It instructs agents to load context by reading the listed file path and to load only what the current task requires. Source: `wiki/raw/pai-context-routing.md`.

The PAI system routing table maps major system topics to canonical documentation paths, including system architecture, memory, skills, hooks, agents, delegation, notifications, CLI architecture, tools, actions, pipelines, flows, behavioral rules, and PRD format. Source: `wiki/raw/pai-context-routing.md`.

The personal context routing table directs user-specific context through `PAI/USER/` indexes for all USER context, projects, business context, and Telos/life goals. Source: `wiki/raw/pai-context-routing.md`.

## Extracted Entities

| Entity | Description | Source |
|---|---|---|
| Context Routing | On-demand map from task topic to PAI documentation path. | `wiki/raw/pai-context-routing.md` |
| PAI System | Shared PAI runtime and doctrine documentation branch. | `wiki/raw/pai-context-routing.md` |
| USER Context | Personal context branch under `PAI/USER/`. | `wiki/raw/pai-context-routing.md` |
| Telos | User life-goals context branch under `PAI/USER/TELOS/README.md`. | `wiki/raw/pai-context-routing.md` |

## Extracted Concepts

| Concept | Description | Source |
|---|---|---|
| On-demand loading | Read only the context path needed for the current task. | `wiki/raw/pai-context-routing.md` |
| Topic-to-path routing | Each topic maps to one or more canonical Markdown source files. | `wiki/raw/pai-context-routing.md` |
| Personal context boundary | User-specific context is routed through `PAI/USER/` rather than the shared system docs. | `wiki/raw/pai-context-routing.md` |

## Decisions And Policies

- Agents should load context on demand rather than reading all PAI docs by default. Source: `wiki/raw/pai-context-routing.md`.
- Shared PAI system context and USER personal context have separate routing tables. Source: `wiki/raw/pai-context-routing.md`.
- Personal project, business, and Telos context should be reached through their USER indexes. Source: `wiki/raw/pai-context-routing.md`.

## Candidate Promotion Notes

If promoted, this page should become `wiki/sources/pai-context-routing.md`. It should route to PAI Runtime and Decisions.
