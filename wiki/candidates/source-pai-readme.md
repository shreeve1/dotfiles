---
title: PAI README Source Summary
type: source-summary
status: candidate
created: 2026-05-16
updated: 2026-05-16
sources:
  - wiki/raw/pai-readme.md
confidence: high
tags:
  - pai
  - runtime
  - architecture
  - opencode
  - subsystems
---

# PAI README Source Summary

## Summary

The PAI README defines PAI as a general problem-solving system that runs inside OpenCode as interconnected skills, plugins, tools, memory, and configuration orchestrated by The Algorithm. Source: `wiki/raw/pai-readme.md`.

The source describes `~/.config/opencode/` as the active runtime surface, responsible for execution modes, The Algorithm, context routing, plugins, agents, skills, providers, and permissions. The `PAI/` directory contains system documentation, tools, user context, and the PAI `SKILL.md`; supporting runtime state lives under `~/.pai/`. Source: `wiki/raw/pai-readme.md`.

Core subsystems include the Algorithm, Skills, Hooks, Memory, Tools, Agents, Security, Notifications, and Configuration. The source also notes startup/context-loading behavior, a legacy `CLAUDE.md` build-system target, and extension paths for skills, hooks, startup files, and user context. Source: `wiki/raw/pai-readme.md`.

## Extracted Entities

| Entity | Description | Source |
|---|---|---|
| PAI | Personal AI Infrastructure running in OpenCode through skills, plugins, tools, memory, and configuration. | `wiki/raw/pai-readme.md` |
| OpenCode configuration | Active runtime surface under `~/.config/opencode/`. | `wiki/raw/pai-readme.md` |
| Algorithm | Seven-phase execution engine for moving current state to ideal state using verifiable criteria. | `wiki/raw/pai-readme.md` |
| Skills | Capability units in `~/.config/opencode/skills/` with triggers, workflows, and tools. | `wiki/raw/pai-readme.md` |
| Memory | Persistent session storage under `~/.pai/memory/`. | `wiki/raw/pai-readme.md` |

## Extracted Concepts

| Concept | Description | Source |
|---|---|---|
| OpenCode as active runtime | OpenCode configuration owns modes, context routing, plugins, agents, skills, providers, and permissions. | `wiki/raw/pai-readme.md` |
| PAI subsystem map | PAI is decomposed into Algorithm, Skills, Hooks, Memory, Tools, Agents, Security, Notifications, and Configuration. | `wiki/raw/pai-readme.md` |
| On-demand context loading | Session startup loads configured files and runtime components; other documentation loads based on routing instructions. | `wiki/raw/pai-readme.md` |
| Extensible PAI | PAI can be extended by adding skills, hooks, startup files, or user context. | `wiki/raw/pai-readme.md` |

## Decisions And Policies

- PAI's active runtime surface is OpenCode configuration under `~/.config/opencode/`. Source: `wiki/raw/pai-readme.md`.
- PAI system documentation and user context live under `PAI/`, while runtime memory and related directories live under `~/.pai/`. Source: `wiki/raw/pai-readme.md`.
- Skills are the primary capability unit. Source: `wiki/raw/pai-readme.md`.

## Candidate Promotion Notes

If promoted, this page should become `wiki/sources/pai-readme.md`. It should route to PAI Runtime, OpenCode Runtime, Skills And Agents, and Decisions.
