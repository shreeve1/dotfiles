---
title: PAI Delegation System Source Summary
type: source-summary
status: candidate
created: 2026-05-16
updated: 2026-05-16
sources:
  - wiki/raw/pai-delegation-system.md
confidence: medium
tags:
  - pai
  - delegation
  - agents
  - parallelism
---

# PAI Delegation System Source Summary

## Summary

The Delegation System source is a reference for delegation and parallelization patterns extracted from a prior `SKILL.md`. It states that whenever a task can be parallelized, multiple agents should be used, and it emphasizes speed-aware model selection for delegated work. Source: `wiki/raw/pai-delegation-system.md`.

The source defines a model-selection matrix that maps simple lookup and verification work to `haiku`, standard implementation and research to `sonnet`, and deep architecture or strategic decisions to `opus`. It also says parallel work should normally use custom agents composed through the Agents skill and should include a spotcheck agent afterward. Source: `wiki/raw/pai-delegation-system.md`.

The source distinguishes custom agents from agent teams or swarms, lists full-context requirements for delegated prompts, and requires a timing scope in every agent prompt. Some Task-tool examples and subagent names may be historical relative to the current OpenCode tool schema and subagent catalog, so promotion should reconcile this source with `wiki/candidates/source-opencode-subagents.md` and live agent definitions. Source: `wiki/raw/pai-delegation-system.md`.

## Extracted Entities

| Entity | Description | Source |
|---|---|---|
| DelegationReference | Reference material for delegation and agent parallelization patterns. | `wiki/raw/pai-delegation-system.md` |
| Agents Skill | Skill used to compose custom task-specific agents. | `wiki/raw/pai-delegation-system.md` |
| ComposeAgent | Custom-agent composition workflow referenced for parallel workers. | `wiki/raw/pai-delegation-system.md` |
| Task Tool | Tool used to launch delegated agents in examples. | `wiki/raw/pai-delegation-system.md` |
| Agent Teams | Persistent coordinated teams distinct from one-shot custom agents. | `wiki/raw/pai-delegation-system.md` |

## Extracted Concepts

| Concept | Description | Source |
|---|---|---|
| Parallel-first delegation | Parallelizable work should be split across multiple agents. | `wiki/raw/pai-delegation-system.md` |
| Model selection matrix | Delegated model choice should match task complexity and timing scope. | `wiki/raw/pai-delegation-system.md` |
| Full-context prompts | Delegated prompts must include why, current state, exact work, success criteria, and timing scope. | `wiki/raw/pai-delegation-system.md` |
| Custom agents vs teams | Custom agents are one-shot workers; teams are persistent coordinated groups. | `wiki/raw/pai-delegation-system.md` |
| Spotcheck pattern | A separate verifier should check consistency after parallel work. | `wiki/raw/pai-delegation-system.md` |

## Decisions And Policies

- Use multiple agents when a task can be parallelized. Source: `wiki/raw/pai-delegation-system.md`.
- Match delegated model/timing choices to task complexity. Source: `wiki/raw/pai-delegation-system.md`.
- Include complete context and success criteria in every delegated prompt. Source: `wiki/raw/pai-delegation-system.md`.
- Do not confuse custom agents with agent teams or swarms. Source: `wiki/raw/pai-delegation-system.md`.

## Candidate Promotion Notes

If promoted, this page should become `wiki/sources/pai-delegation-system.md` with medium confidence and explicit reconciliation against current OpenCode Task schema and `wiki/candidates/source-opencode-subagents.md`. It should route to Skills And Agents, OpenCode Runtime, PAI Runtime, and Decisions.
