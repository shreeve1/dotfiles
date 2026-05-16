---
title: PAI CLI-First Architecture Source Summary
type: source-summary
status: candidate
created: 2026-05-16
updated: 2026-05-16
sources:
  - wiki/raw/pai-cli-first-architecture.md
confidence: high
tags:
  - pai
  - architecture
  - cli
  - tools
---

# PAI CLI-First Architecture Source Summary

## Summary

The CLI-First Architecture source is marked as an active standard for all new PAI tools, skills, and systems. Its core principle is to build deterministic CLI tools first and then wrap them with AI prompting. Source: `wiki/raw/pai-cli-first-architecture.md`.

The source frames CLI-first as a three-step process: understand requirements, build deterministic CLI commands, and wrap those commands with a prompting layer. The prompting layer should map user intent to commands, execute them in order, handle errors, summarize results, and avoid replicating CLI functionality ad hoc. Source: `wiki/raw/pai-cli-first-architecture.md`.

The source also defines CLI design guidelines, including command hierarchy, output formats, idempotency, validation, error handling, progressive disclosure, configuration flags, workflow-to-tool intent mapping, migration strategy, and implementation checklists. Source: `wiki/raw/pai-cli-first-architecture.md`.

## Extracted Entities

| Entity | Description | Source |
|---|---|---|
| CLI-First Architecture | Active PAI standard for deterministic tool-first system design. | `wiki/raw/pai-cli-first-architecture.md` |
| CLI Tool | Deterministic command-line implementation layer. | `wiki/raw/pai-cli-first-architecture.md` |
| Prompting Layer | AI orchestration layer that maps intent to CLI commands. | `wiki/raw/pai-cli-first-architecture.md` |
| Configuration Flags | CLI flags used to control behavior without code changes. | `wiki/raw/pai-cli-first-architecture.md` |

## Extracted Concepts

| Concept | Description | Source |
|---|---|---|
| Deterministic execution | Same CLI command should produce the same result. | `wiki/raw/pai-cli-first-architecture.md` |
| Intent-to-command mapping | Prompting workflows translate natural language into precise CLI commands. | `wiki/raw/pai-cli-first-architecture.md` |
| Intent-to-flag mapping | Workflows expose tool flexibility by translating user intent into CLI flags. | `wiki/raw/pai-cli-first-architecture.md` |
| Idempotent commands | Re-running a command should produce the same stable result when appropriate. | `wiki/raw/pai-cli-first-architecture.md` |
| Progressive disclosure | CLI tools should be simple for common cases while exposing advanced options. | `wiki/raw/pai-cli-first-architecture.md` |

## Decisions And Policies

- New PAI tools, skills, and systems should use deterministic CLI tools before AI prompting layers. Source: `wiki/raw/pai-cli-first-architecture.md`.
- AI should orchestrate CLI commands rather than replace them with ad hoc prompting. Source: `wiki/raw/pai-cli-first-architecture.md`.
- CLI tools should expose behavior through discoverable configuration flags. Source: `wiki/raw/pai-cli-first-architecture.md`.
- CLI-first is most appropriate for repeated, deterministic, stateful, queryable, testable, or scriptable operations. Source: `wiki/raw/pai-cli-first-architecture.md`.

## Candidate Promotion Notes

If promoted, this page should become `wiki/sources/pai-cli-first-architecture.md`. It should route to PAI Runtime, Decisions, and future tool/skill architecture pages.
