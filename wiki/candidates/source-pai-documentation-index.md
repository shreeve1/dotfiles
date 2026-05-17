---
title: PAI Documentation Index Source Summary
type: source-summary
status: candidate
created: 2026-05-16
updated: 2026-05-16
sources:
  - wiki/raw/pai-documentation-index.md
confidence: medium
tags:
  - pai
  - documentation
  - routing
  - skills
---

# PAI Documentation Index Source Summary

## Summary

The Documentation Index source is a CORE documentation index extracted from SKILL.md context-loading material. It says PAI documentation files live in `~/.pai/PAI/`, with `USER/` as the subdirectory for personal overrides, and it provides route triggers for deeper context loading. Source: `wiki/raw/pai-documentation-index.md`.

The source lists core architecture and philosophy references, including system architecture, feed system, actions, pipelines, flows, Arbol, CLI, SYSTEM/USER extendability, CLI-first architecture, and skill system docs. Several referenced docs are not present in the current `.pai/PAI/` snapshot, so this page should be treated as a routing reference that requires live-path reconciliation before promotion. Source: `wiki/raw/pai-documentation-index.md`.

The source also reiterates the mandatory `USE WHEN` skill-description format, intent-based trigger guidance, and skill execution rule to follow `SKILL.md` instructions and workflow routing step by step. Source: `wiki/raw/pai-documentation-index.md`.

## Extracted Entities

| Entity | Description | Source |
|---|---|---|
| DocumentationIndex | CORE documentation routing and trigger reference. | `wiki/raw/pai-documentation-index.md` |
| CORE Documentation Index | Map from topics/triggers to PAI docs. | `wiki/raw/pai-documentation-index.md` |
| `USER/` | Personal override and private context directory. | `wiki/raw/pai-documentation-index.md` |
| `USE WHEN` | Mandatory skill-description routing keyword. | `wiki/raw/pai-documentation-index.md` |

## Extracted Concepts

| Concept | Description | Source |
|---|---|---|
| Route triggers | Topic phrases that indicate which PAI docs to read. | `wiki/raw/pai-documentation-index.md` |
| Intent-based skill routing | Skill descriptions should use intent triggers rather than exact phrase lists. | `wiki/raw/pai-documentation-index.md` |
| Documentation reconciliation | Some referenced files may be historical or absent and need live-path checks. | `wiki/raw/pai-documentation-index.md` |

## Decisions And Policies

- Read deeper PAI context files when task triggers indicate they are relevant. Source: `wiki/raw/pai-documentation-index.md`.
- Skill descriptions must include `USE WHEN`, use intent-based triggers, and stay under 1024 characters. Source: `wiki/raw/pai-documentation-index.md`.
- When a skill is invoked, follow `SKILL.md` and workflow routing step by step. Source: `wiki/raw/pai-documentation-index.md`.

## Candidate Promotion Notes

If promoted, this page should become `wiki/sources/pai-documentation-index.md` with medium confidence and a broken-reference reconciliation pass. It should route to PAI Runtime, Skills And Agents, Extensibility And Customization, and Decisions.
