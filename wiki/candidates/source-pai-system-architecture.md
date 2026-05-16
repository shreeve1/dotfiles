---
title: PAI System Architecture Source Summary
type: source-summary
status: candidate
created: 2026-05-16
updated: 2026-05-16
sources:
  - wiki/raw/pai-system-architecture.md
confidence: medium
tags:
  - pai
  - architecture
  - principles
  - runtime
  - system-design
---

# PAI System Architecture Source Summary

## Summary

The PAI System Architecture source defines generic architecture patterns and founding principles for Personal AI Infrastructure. It explicitly excludes user-specific skill counts, agent rosters, API keys, personal projects, and user-specific changelog entries, directing user customizations to `USER/ARCHITECTURE.md`. Source: `wiki/raw/pai-system-architecture.md`.

The source frames PAI as scaffolding for AI rather than a replacement for human intelligence. It emphasizes personalization, a continuously upgrading Algorithm, clear thinking, scaffolding over model choice, deterministic behavior, code before prompts, spec/test/evals-first practice, UNIX-style modular tooling, SRE rigor, CLI access, and the pipeline from goal to code to CLI to prompts to agents. Source: `wiki/raw/pai-system-architecture.md`.

The source also sketches subsystem architecture for skills, hooks, agents, memory, notifications, cloud execution, security, self-management, naming conventions, and the OpenCode host runtime appendix. Some sections are template or historical; claims from this source should be reconciled against newer subsystem docs when they overlap. Source: `wiki/raw/pai-system-architecture.md`.

## Extracted Entities

| Entity | Description | Source |
|---|---|---|
| PAI System Architecture | Generic architecture and founding-principles document for PAI. | `wiki/raw/pai-system-architecture.md` |
| The Algorithm | Centerpiece continuously upgraded by memory, hooks, learning, and feedback systems. | `wiki/raw/pai-system-architecture.md` |
| Skills | Organizational unit for domain expertise and self-activating capabilities. | `wiki/raw/pai-system-architecture.md` |
| Arbol | Cloudflare Workers deployment model for PAI actions and pipelines. | `wiki/raw/pai-system-architecture.md` |
| System skill | Central mechanism described for integrity, security, documentation, and repo management. | `wiki/raw/pai-system-architecture.md` |

## Extracted Concepts

| Concept | Description | Source |
|---|---|---|
| PAI as scaffolding | PAI provides structure that makes AI assistance dependable, maintainable, and effective. | `wiki/raw/pai-system-architecture.md` |
| Continuously upgrading Algorithm | Memory, hooks, learning directories, sentiment analysis, and ratings feed back into improving the Algorithm. | `wiki/raw/pai-system-architecture.md` |
| Scaffolding over model | Organized workflows, routing, quality gates, history, and feedback are more important than raw model choice. | `wiki/raw/pai-system-architecture.md` |
| Code before prompts | Deterministic code should solve problems, with prompts orchestrating code rather than replacing it. | `wiki/raw/pai-system-architecture.md` |
| CLI as interface | Operations should be accessible by command line for discoverability, scriptability, testability, and transparency. | `wiki/raw/pai-system-architecture.md` |
| OpenCode host runtime | Appendix describes OpenCode wiring through instructions, AGENTS.md, modes, agents, plugins, and CLIProxy. | `wiki/raw/pai-system-architecture.md` |

## Decisions And Policies

- Generic architecture belongs in this document; user-specific customizations belong in `USER/ARCHITECTURE.md`. Source: `wiki/raw/pai-system-architecture.md`.
- PAI should favor deterministic behavior and version-controlled explicit changes. Source: `wiki/raw/pai-system-architecture.md`.
- AI infrastructure should be treated as production software with monitoring, observability, graceful degradation, and fallback strategies. Source: `wiki/raw/pai-system-architecture.md`.
- USER and WORK content are described as protected and should not appear outside protected areas or in public PAI repositories. Source: `wiki/raw/pai-system-architecture.md`.

## Candidate Promotion Notes

If promoted, this page should become `wiki/sources/pai-system-architecture.md`. Because parts are template or historical, promote with medium confidence and reconcile overlapping runtime claims against `wiki/candidates/source-pai-readme.md`, `wiki/candidates/source-pai-algorithm-v6.4.0.md`, and `wiki/candidates/source-pai-memory-system.md`.
