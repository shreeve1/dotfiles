---
title: PAI Skill System Source Summary
type: source-summary
status: candidate
created: 2026-05-16
updated: 2026-05-16
sources:
  - wiki/raw/pai-skill-system.md
confidence: high
tags:
  - pai
  - skills
  - canonicalization
  - opencode
  - workflows
---

# PAI Skill System Source Summary

## Summary

The PAI Skill System source identifies itself as the mandatory configuration system and authoritative structure reference for all PAI skills. It defines canonicalization as restructuring a skill to match the required format, including TitleCase naming. Source: `wiki/raw/pai-skill-system.md`.

The source requires TitleCase naming for system skills, workflow files, reference docs, tool files, help files, and YAML skill names, with `SKILL.md` as the uppercase exception. It distinguishes shareable system skills from personal `_ALLCAPS` skills and states that system skills should reference `~/.pai/PAI/USER/` for personalization rather than hardcoding personal data. Source: `wiki/raw/pai-skill-system.md`.

The source also defines skill customization through `~/.pai/PAI/USER/SKILLCUSTOMIZATIONS/{SkillName}/`, required YAML frontmatter shape, `USE WHEN` description rules, dynamic loading patterns, flat folder structure, workflow-to-tool integration, CLI tool requirements, and recommended output requirements. Source: `wiki/raw/pai-skill-system.md`.

## Extracted Entities

| Entity | Description | Source |
|---|---|---|
| PAI Skill System | Authoritative structure and configuration reference for PAI skills. | `wiki/raw/pai-skill-system.md` |
| System Skills | Shareable TitleCase skills that contain no personal data and can reference USER files for personalization. | `wiki/raw/pai-skill-system.md` |
| Personal Skills | `_ALLCAPS` skills that may contain personal configuration and are never shared publicly. | `wiki/raw/pai-skill-system.md` |
| Skill Customization System | User customization directory under `~/.pai/PAI/USER/SKILLCUSTOMIZATIONS/{SkillName}/`. | `wiki/raw/pai-skill-system.md` |
| `EXTEND.yaml` | Required manifest for customization directories. | `wiki/raw/pai-skill-system.md` |

## Extracted Concepts

| Concept | Description | Source |
|---|---|---|
| TitleCase naming | Skill system files and directories use PascalCase naming, except `SKILL.md`. | `wiki/raw/pai-skill-system.md` |
| `USE WHEN` descriptions | Skill descriptions must include `USE WHEN` and use intent-based triggers. | `wiki/raw/pai-skill-system.md` |
| Dynamic loading | Large skills should keep `SKILL.md` minimal and load additional root context files on demand. | `wiki/raw/pai-skill-system.md` |
| Flat folder structure | Skill folders allow limited direct subdirectories such as `Tools/`, `Workflows/`, `Tests/`, `Data/`, `References/`, and `Templates/`. | `wiki/raw/pai-skill-system.md` |
| Skills as scripts to follow | Skills are operational procedures that should be followed step by step when invoked. | `wiki/raw/pai-skill-system.md` |

## Decisions And Policies

- All skill creation must follow the required structure in this source. Source: `wiki/raw/pai-skill-system.md`.
- System skills must not hardcode personal data. Source: `wiki/raw/pai-skill-system.md`.
- YAML descriptions must be single-line, include `USE WHEN`, and avoid separate trigger/workflow arrays. Source: `wiki/raw/pai-skill-system.md`.
- Context/resource files go in the skill root, not in a `Context/` subdirectory. Source: `wiki/raw/pai-skill-system.md`.

## Candidate Promotion Notes

If promoted, this page should become `wiki/sources/pai-skill-system.md`. It should route to Skills And Agents, PAI Runtime, and Decisions.
