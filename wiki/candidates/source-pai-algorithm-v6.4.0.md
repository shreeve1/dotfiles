---
title: PAI Algorithm v6.4.0 Source Summary
type: source-summary
status: candidate
created: 2026-05-16
updated: 2026-05-16
sources:
  - wiki/raw/pai-algorithm-v6.4.0.md
confidence: high
tags:
  - pai
  - algorithm
  - isa
  - isc
  - doctrine
---

# PAI Algorithm v6.4.0 Source Summary

## Summary

The PAI Algorithm v6.4.0 source defines the doctrine for Algorithm runs: transition from current state to ideal state by articulating testable criteria, pursuing them through phases, and verifying each criterion. Source: `wiki/raw/pai-algorithm-v6.4.0.md`.

The source defines the ISA as the system-of-record primitive for ideal-state articulation, test harness, build verification, done condition, and persistent thing being articulated. It also defines two ISA homes: project ISAs in the project repo and task ISAs under `MEMORY/WORK/{slug}/ISA.md`. Source: `wiki/raw/pai-algorithm-v6.4.0.md`.

The source specifies fixed twelve-section ISA structure, ID-stability for ISCs, effort levels, canonical thinking capability names, classifier-driven mode/tier handling, phase execution, deliverable manifest and parallelism scan requirements, inline verification, verification doctrine, re-read check, and LEARN routing. Source: `wiki/raw/pai-algorithm-v6.4.0.md`.

## Extracted Entities

| Entity | Description | Source |
|---|---|---|
| Algorithm v6.4.0 | Current doctrine file for Algorithm execution. | `wiki/raw/pai-algorithm-v6.4.0.md` |
| ISA | Ideal State Artifact and system of record for the thing being articulated. | `wiki/raw/pai-algorithm-v6.4.0.md` |
| ISC | Atomic ideal-state criterion that must be verifiable by a single named tool probe. | `wiki/raw/pai-algorithm-v6.4.0.md` |
| Mode router | OpenCode mechanism that decides mode and tier before execution. | `wiki/raw/pai-algorithm-v6.4.0.md` |
| ISA Skill | Skill that owns canonical ISA templates and workflows. | `wiki/raw/pai-algorithm-v6.4.0.md` |

## Extracted Concepts

| Concept | Description | Source |
|---|---|---|
| Current state to ideal state | Every Algorithm run transitions current state to ideal state through verifiable criteria. | `wiki/raw/pai-algorithm-v6.4.0.md` |
| ISA five identities | The ISA is ideal-state articulation, test harness, build verification, done condition, and system of record. | `wiki/raw/pai-algorithm-v6.4.0.md` |
| Twelve-section ISA | ISA sections are fixed: Problem, Vision, Out of Scope, Principles, Constraints, Goal, Criteria, Test Strategy, Features, Decisions, Changelog, Verification. | `wiki/raw/pai-algorithm-v6.4.0.md` |
| ID-stable ISCs | ISC IDs are never renumbered; splits use `ISC-N.M` and drops become tombstones. | `wiki/raw/pai-algorithm-v6.4.0.md` |
| Canonical thinking capabilities | Thinking capabilities must use exact canonical names or bounded `OTHER:` escapes. | `wiki/raw/pai-algorithm-v6.4.0.md` |
| Verification doctrine | Criteria pass only with tool-verified evidence and re-read checks before LEARN. | `wiki/raw/pai-algorithm-v6.4.0.md` |

## Decisions And Policies

- Do not invent parallel acceptance artifacts when the ISA already covers acceptance, verification, and done conditions. Source: `wiki/raw/pai-algorithm-v6.4.0.md`.
- Project ISAs live with persistent things; task ISAs live under memory work directories for ad-hoc work. Source: `wiki/raw/pai-algorithm-v6.4.0.md`.
- Capability names are audited against the canonical enumeration, with limited `OTHER:` escapes. Source: `wiki/raw/pai-algorithm-v6.4.0.md`.
- Verification must use tool-probe evidence before marking work complete. Source: `wiki/raw/pai-algorithm-v6.4.0.md`.

## Candidate Promotion Notes

If promoted, this page should become `wiki/sources/pai-algorithm-v6.4.0.md`. It should route to PAI Runtime, OpenCode Runtime, and Decisions.
