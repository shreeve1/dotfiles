---
title: PAI Agent System Source Summary
type: source-summary
status: candidate
created: 2026-05-16
updated: 2026-05-16
sources:
  - wiki/raw/pai-agent-system.md
confidence: medium
tags:
  - pai
  - agents
  - delegation
  - custom-agents
  - routing
---

# PAI Agent System Source Summary

## Summary

The PAI Agent System source is an authoritative reference for distinguishing three agent systems: Task Tool subagent types, Named Agents, and Custom Agents. It warns that confusing these systems causes routing failures. Source: `wiki/raw/pai-agent-system.md`.

The source states that when a user says "custom agents," agents should invoke the Agents skill or follow the custom agent workflow rather than directly using Task tool subagent types like Architect, Designer, or Engineer. Custom agents are composed through ComposeAgent from trait combinations and then launched through the Task tool with generated prompts. Source: `wiki/raw/pai-agent-system.md`.

The source also documents named agents, custom-agent trait categories, voice mapping examples, model selection by task type, and a spotcheck pattern after parallel work. Some subagent type names may be historical relative to the current OpenCode subagent catalog, so routing should be reconciled against `wiki/candidates/source-opencode-subagents.md`. Source: `wiki/raw/pai-agent-system.md`.

## Extracted Entities

| Entity | Description | Source |
|---|---|---|
| PAI Agent System | Reference for routing among task subagents, named agents, and custom agents. | `wiki/raw/pai-agent-system.md` |
| Task Tool Subagent Types | Pre-built OpenCode agents intended for internal workflow use. | `wiki/raw/pai-agent-system.md` |
| Named Agents | Persistent identities with backstories and voice mappings. | `wiki/raw/pai-agent-system.md` |
| Custom Agents | Dynamic agents composed from traits through ComposeAgent. | `wiki/raw/pai-agent-system.md` |
| ComposeAgent | Tool/workflow for generating custom-agent prompts and voice mappings. | `wiki/raw/pai-agent-system.md` |

## Extracted Concepts

| Concept | Description | Source |
|---|---|---|
| Three agent systems | Task subagent types, named agents, and custom agents have distinct purposes and should not be confused. | `wiki/raw/pai-agent-system.md` |
| Custom-agent trigger | The word "custom" triggers the Agents skill/custom-agent workflow. | `wiki/raw/pai-agent-system.md` |
| Trait-based composition | Custom agents combine expertise, personality, and approach traits. | `wiki/raw/pai-agent-system.md` |
| Agent model selection | Simple checks use haiku, standard work uses sonnet, and deep reasoning uses opus. | `wiki/raw/pai-agent-system.md` |
| Spotcheck pattern | A spotcheck agent should verify consistency after parallel work. | `wiki/raw/pai-agent-system.md` |

## Decisions And Policies

- Do not treat Task tool subagent types as custom agents when James asks for custom agents. Source: `wiki/raw/pai-agent-system.md`.
- Custom agents should be created via Agents skill/ComposeAgent with different trait combinations. Source: `wiki/raw/pai-agent-system.md`.
- Task subagent types are for internal workflow use, not user-requested custom agents. Source: `wiki/raw/pai-agent-system.md`.
- Always specify an appropriate model for agent work. Source: `wiki/raw/pai-agent-system.md`.

## Candidate Promotion Notes

If promoted, this page should become `wiki/sources/pai-agent-system.md` with medium confidence and reconciliation against `wiki/candidates/source-opencode-subagents.md`. It should route to Skills And Agents, OpenCode Runtime, and Decisions.
