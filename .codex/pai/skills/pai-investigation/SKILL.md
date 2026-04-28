---
name: "pai-investigation"
description: "PAI Codex port: OSINT and people-finding - structured investigations, company intel, due diligence, and ethical people search across public records and social media. USE WHEN OSINT, due diligence, company intel, background check, find..."
---

# Investigation

This is a Codex-native port of an upstream PAI skill. Codex instructions, local tools, and higher-priority AGENTS.md guidance take precedence.

Use local Codex skills, shell tools, subagents, and web access only when the current session permits them. Do not assume external providers are configured.

## Gated Dependencies

- External media processing tools

## Ported Workflow

# Investigation

Unified skill for OSINT and investigation workflows.

## Workflow Routing

| Request Pattern | Route To |
|---|---|
| OSINT, due diligence, company intel, background check, entity intel, threat intel | `OSINT/SKILL.md` |
| Find person, locate, people search, reconnect, public records, reverse lookup | `PrivateInvestigator/SKILL.md` |
