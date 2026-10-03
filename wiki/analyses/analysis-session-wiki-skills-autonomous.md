---
type: analysis
title: Wiki skills operate autonomously
description: llm-wiki-setup and wiki-update now verify and auto-promote candidates in the same run with zero approval questions; guards are checks, not asks.
status: promoted
created: 2026-10-03
updated: 2026-10-03
sources:
  - wiki/raw/sessions/2026-10-03-wiki-skills-autonomous.md
  - .agents/skills/llm-wiki-setup/Workflows/Promote.md
  - .agents/skills/wiki-update/Workflows/SessionUpdate.md
confidence: high
tags: [wiki, skills, autonomy, promotion]
---

# Wiki skills operate autonomously

As of 2026-10-03 the `llm-wiki-setup` and `wiki-update` skills run the full wiki update cycle without asking James. The candidate stage is a verification checkpoint, not a review queue: frontmatter, OKF conformance, citations, and duplicate checks run, then the page is promoted in the same run.

## Rules that replaced the approval gates

- **Promotion is same-run and autonomous.** Ingest (step 13), Query Save-Back (step 5), and SessionUpdate (§7 step 3) all route candidates through `llm-wiki-setup` `Workflows/Promote.md`; no successful workflow ends with candidates awaiting human review. Candidates that fail verification stay in `wiki/candidates/` for a later retry run.
- **Guards are checks, not questions.** `gate.py` (claim schema/budget), the independent claim verify, and Promote's verification decide what is written. Sensitive material is omitted automatically and logged (SessionUpdate §8). Lint defers drift, supersession, and broad rewrites as evidence-based findings for a future explicit fix run.
- **Crash-safe promotion.** Duplicate target: surgical merge, verify merged content, then remove candidate (Branch A). Fresh target: copy → verify → delete, never `git mv` (it deletes the source before verification); a failed verification also deletes the unverified target copy (Branch B). Failed candidates stay retryable in `wiki/candidates/` with a logged failure — never auto-discarded.
- **Setup refactors project AGENTS.md/CLAUDE.md autonomously**, injecting a compact section that mandates running `/wiki-update` before reporting any task complete instead of proposing or deferring.

## What asking survives

Only data-loss blockers: initializing a wiki inside the dotfiles install repo, and an existing unrelated `wiki/` directory.

## Citations

- `wiki/raw/sessions/2026-10-03-wiki-skills-autonomous.md`
