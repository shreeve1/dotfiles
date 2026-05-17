---
title: PAI SYSTEM USER Extendability Source Summary
type: source-summary
status: candidate
created: 2026-05-16
updated: 2026-05-16
sources:
  - wiki/raw/pai-system-user-extendability.md
confidence: high
tags:
  - pai
  - extensibility
  - user-overrides
  - privacy
---

# PAI SYSTEM USER Extendability Source Summary

## Summary

The SYSTEM/USER Extendability source defines PAI's two-tier architecture for extensibility and personalization. The SYSTEM tier provides base functionality, defaults, and updates; the USER tier provides personal customizations, private policies, and overrides. Source: `wiki/raw/pai-system-user-extendability.md`.

The source defines a cascading lookup pattern: check USER first, fall back to SYSTEM/root, then use hardcoded defaults or fail open. It states that USER always wins and completely replaces the SYSTEM equivalent when present. Source: `wiki/raw/pai-system-user-extendability.md`.

The source applies the pattern to security, response format, skills, identity, and configuration files, and gives implementation guidance for new components: create SYSTEM defaults, document the USER location, implement cascading lookup, and fail gracefully. Source: `wiki/raw/pai-system-user-extendability.md`.

## Extracted Entities

| Entity | Description | Source |
|---|---|---|
| SYSTEM tier | Base functionality, defaults, and PAI updates. | `wiki/raw/pai-system-user-extendability.md` |
| USER tier | Personal customizations, private policies, and overrides. | `wiki/raw/pai-system-user-extendability.md` |
| Cascading lookup | USER-first fallback pattern for configuration. | `wiki/raw/pai-system-user-extendability.md` |
| Private skills | `_ALLCAPS` USER-tier skills never synced publicly. | `wiki/raw/pai-system-user-extendability.md` |

## Extracted Concepts

| Concept | Description | Source |
|---|---|---|
| USER wins | USER files replace SYSTEM equivalents when present. | `wiki/raw/pai-system-user-extendability.md` |
| Replacement not merge | USER overrides are complete replacements, not partial merges. | `wiki/raw/pai-system-user-extendability.md` |
| Privacy separation | USER content is excluded from public PAI sync. | `wiki/raw/pai-system-user-extendability.md` |
| Fail-open defaults | Missing configs should use sensible defaults or fail gracefully. | `wiki/raw/pai-system-user-extendability.md` |

## Decisions And Policies

- SYSTEM tier must provide working defaults. Source: `wiki/raw/pai-system-user-extendability.md`.
- USER configurations override SYSTEM equivalents completely. Source: `wiki/raw/pai-system-user-extendability.md`.
- USER content should remain private and outside public PAI sync. Source: `wiki/raw/pai-system-user-extendability.md`.
- New configurable components should document USER locations and implement cascading lookup. Source: `wiki/raw/pai-system-user-extendability.md`.

## Candidate Promotion Notes

If promoted, this page should become `wiki/sources/pai-system-user-extendability.md`. It should route to PAI Runtime, Extensibility And Customization, Skills And Agents, Installation And Operations, and Decisions.
