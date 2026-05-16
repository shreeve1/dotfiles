---
title: OpenCode Subagent Reference Source Summary
type: source-summary
status: candidate
created: 2026-05-16
updated: 2026-05-16
sources:
  - wiki/raw/opencode-subagents.md
confidence: high
tags:
  - opencode
  - subagents
  - delegation
  - routing
  - agents
---

# OpenCode Subagent Reference Source Summary

## Summary

The OpenCode Subagent Reference is an on-demand catalog for subagent routing. It says always-loaded prompts should stay limited to delegation invariants: pass complete context, parallelize independent work, and avoid delegation when direct Glob/Grep/Edit is faster. Source: `wiki/raw/opencode-subagents.md`.

The source maps task triggers to subagents across code execution, investigation/review, browser/UI/web, infrastructure, and research/framework work. It also documents parallel patterns and cases where delegation should not be used. Source: `wiki/raw/opencode-subagents.md`.

The source explicitly states the infrastructure pipeline rule: infrastructure work goes scout, planner, human review, executor, validator. Source: `wiki/raw/opencode-subagents.md`.

## Extracted Entities

| Entity | Description | Source |
|---|---|---|
| OpenCode Subagent Reference | On-demand catalog for subagent routing. | `wiki/raw/opencode-subagents.md` |
| `forge` | GPT-family code producer for multi-file implementation, refactor, or feature build at E3+. | `wiki/raw/opencode-subagents.md` |
| `validator` | Read-only acceptance-check subagent for completed work. | `wiki/raw/opencode-subagents.md` |
| `cato` | Read-only GPT-family auditor for E4/E5 final cross-vendor gate. | `wiki/raw/opencode-subagents.md` |
| `infra-scout`, `infra-planner`, `infra-validator` | Read-only discovery/planning/validation infrastructure subagents. | `wiki/raw/opencode-subagents.md` |

## Extracted Concepts

| Concept | Description | Source |
|---|---|---|
| Complete-context delegation | Subagent prompts must include complete context because subagents do not inherit hidden context. | `wiki/raw/opencode-subagents.md` |
| Direct-tool preference | Do not delegate when direct Glob/Grep/Edit can finish faster than agent setup. | `wiki/raw/opencode-subagents.md` |
| Infrastructure execution chain | Infra changes follow scout to planner to human review to executor to validator. | `wiki/raw/opencode-subagents.md` |
| Parallel review | Cross-vendor review can run `quick-review-opus` and `quick-review-codex` together. | `wiki/raw/opencode-subagents.md` |
| Browser bug triage fan-out | Console, network, and performance specialists can run in parallel for browser bug triage. | `wiki/raw/opencode-subagents.md` |

## Decisions And Policies

- Avoid delegation when direct local search/editing is faster. Source: `wiki/raw/opencode-subagents.md`.
- Avoid delegation when the task needs unstated conversation context. Source: `wiki/raw/opencode-subagents.md`.
- `anvil` is disabled in this OpenCode port; use `forge` for GPT-family code production. Source: `wiki/raw/opencode-subagents.md`.

## Candidate Promotion Notes

If promoted, this page should become `wiki/sources/opencode-subagents.md`. It should route to Skills And Agents, OpenCode Runtime, and Decisions.
