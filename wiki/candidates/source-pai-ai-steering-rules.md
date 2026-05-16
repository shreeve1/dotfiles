---
title: PAI AI Steering Rules Source Summary
type: source-summary
status: candidate
created: 2026-05-16
updated: 2026-05-16
sources:
  - wiki/raw/pai-ai-steering-rules.md
confidence: high
tags:
  - pai
  - steering-rules
  - behavior
  - safety
  - verification
---

# PAI AI Steering Rules Source Summary

## Summary

The PAI AI Steering Rules source defines universal behavioral rules for PAI. It says the rules are force-loaded at session start and that personal overrides live in `USER/AISTEERINGRULES.md`. Source: `wiki/raw/pai-ai-steering-rules.md`.

The source emphasizes surgical, verified, minimal work: make targeted corrections, verify before asserting success, read before modifying, isolate one debugging change at a time, and avoid bonus refactoring. Source: `wiki/raw/pai-ai-steering-rules.md`.

It also defines approval and interaction rules: ask before destructive actions, stop when asked for a plan, use structured AskUserQuestion for choices, do not modify user-written content without asking, and recover from errors by reviewing the session and capturing learning. Source: `wiki/raw/pai-ai-steering-rules.md`.

## Extracted Entities

| Entity | Description | Source |
|---|---|---|
| AI Steering Rules | Universal behavior rules for PAI. | `wiki/raw/pai-ai-steering-rules.md` |
| `USER/AISTEERINGRULES.md` | Personal override file for steering rules. | `wiki/raw/pai-ai-steering-rules.md` |
| PAI Inference Tool | Required tool path for AI calls, invoked as `bun Tools/Inference.ts fast|standard|smart`. | `wiki/raw/pai-ai-steering-rules.md` |

## Extracted Concepts

| Concept | Description | Source |
|---|---|---|
| Surgical fixes | Prefer precise targeted corrections over broad removal, rewrites, or scaffolding. | `wiki/raw/pai-ai-steering-rules.md` |
| Verification before assertion | Claims of success require direct evidence from tools. | `wiki/raw/pai-ai-steering-rules.md` |
| Minimal scope | Do only what was asked, without bonus refactors or cleanup. | `wiki/raw/pai-ai-steering-rules.md` |
| Destructive-action approval | Deletes, force pushes, and prod deploys require explicit approval. | `wiki/raw/pai-ai-steering-rules.md` |
| Plan means stop | A request for a plan means present the plan and do not execute without approval. | `wiki/raw/pai-ai-steering-rules.md` |

## Decisions And Policies

- Read before modifying existing code, imports, and patterns. Source: `wiki/raw/pai-ai-steering-rules.md`.
- Debugging should isolate one change and verify before proceeding. Source: `wiki/raw/pai-ai-steering-rules.md`.
- Do not modify user-written content without asking. Source: `wiki/raw/pai-ai-steering-rules.md`.
- For AI calls, use `bun Tools/Inference.ts fast|standard|smart` rather than importing Anthropic SDK directly. Source: `wiki/raw/pai-ai-steering-rules.md`.

## Candidate Promotion Notes

If promoted, this page should become `wiki/sources/pai-ai-steering-rules.md`. It should route to PAI Runtime and Decisions.
