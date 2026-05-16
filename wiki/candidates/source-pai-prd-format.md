---
title: PAI PRD Format Source Summary
type: source-summary
status: candidate
created: 2026-05-16
updated: 2026-05-16
sources:
  - wiki/raw/pai-prd-format.md
confidence: low
tags:
  - pai
  - prd
  - algorithm
  - criteria
---

# PAI PRD Format Source Summary

## Summary

The PAI PRD Format source defines a v2.0 Product Requirements Document format and states that a PRD is the single source of truth for every Algorithm run. This conflicts with the newer Algorithm and OpenCode agent guidance that identify the ISA as the source of truth, so this page should be treated as historical or requiring reconciliation until reviewed. Source: `wiki/raw/pai-prd-format.md`.

The source defines YAML frontmatter fields for task, slug, effort, phase, progress, mode, started, updated, and optional iteration. It also defines four populated-only body sections: Context, Criteria, Decisions, and Verification. Source: `wiki/raw/pai-prd-format.md`.

The source includes ISC checkbox rules for binary, atomic, state-based criteria, anti-criteria, immediate progress updates, effort-tier count floors, continuation/rework behavior, a hook-driven PRD sync pipeline, and design rationale from external spec and product-document formats. Source: `wiki/raw/pai-prd-format.md`.

## Extracted Entities

| Entity | Description | Source |
|---|---|---|
| PRD | Product Requirements Document format described as a per-run source of truth. | `wiki/raw/pai-prd-format.md` |
| ISC | Ideal State Criteria checkbox format used for task verification. | `wiki/raw/pai-prd-format.md` |
| PRDSync hook | Hook described as deriving work state from PRD frontmatter and criteria. | `wiki/raw/pai-prd-format.md` |
| work.json | Derived state file keyed by slug in the PRD sync pipeline. | `wiki/raw/pai-prd-format.md` |

## Extracted Concepts

| Concept | Description | Source |
|---|---|---|
| Populated-only sections | Body sections appear only when populated, not as empty boilerplate. | `wiki/raw/pai-prd-format.md` |
| Atomic criteria | Criteria should be binary testable and contain one verifiable thing. | `wiki/raw/pai-prd-format.md` |
| Anti-criteria | `ISC-A-` criteria define things that must not happen. | `wiki/raw/pai-prd-format.md` |
| Continuation tracking | Rework increments iteration and re-enters Algorithm phases. | `wiki/raw/pai-prd-format.md` |
| Derived hook state | Hooks read PRDs and derive `work.json`; the AI is the sole writer. | `wiki/raw/pai-prd-format.md` |

## Decisions And Policies

- PRD frontmatter includes eight required fields and optional iteration. Source: `wiki/raw/pai-prd-format.md`.
- Criteria should be 8-12 words, binary testable, atomic, and state-oriented rather than action-oriented. Source: `wiki/raw/pai-prd-format.md`.
- Criterion progress should be updated immediately when a criterion passes. Source: `wiki/raw/pai-prd-format.md`.
- Hooks should read PRDs only; the AI is the sole PRD writer. Source: `wiki/raw/pai-prd-format.md`.

## Contradictions And Reconciliation Notes

- The PRD source says PRD is the single source of truth for every Algorithm run. This contradicts `C-0014` and `C-0026`, which identify ISA as the Algorithm source of truth in newer OpenCode/Algorithm guidance. Source: `wiki/raw/pai-prd-format.md`.
- Promotion should decide whether this PRD format is historical, superseded by ISA, or still relevant for a separate legacy dashboard path. Source: `wiki/raw/pai-prd-format.md`.

## Candidate Promotion Notes

If promoted, this page should likely become `wiki/sources/pai-prd-format.md` as a historical/legacy source unless reconciled with current Algorithm v6.4.0. It should route to PAI Runtime and Decisions.
