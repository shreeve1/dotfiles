# Agent Template

Use this format when creating agent definitions.

## Format

```md
---
name: <agent-name>
description: <action-oriented description starting with "Use for..." or "Specialist in...">
tools: <comma-separated list of required tools>
model: <haiku|sonnet|opus> (default: sonnet)
color: <red|blue|green|yellow|purple|orange|pink|cyan>
---

# Purpose

You are a <role definition> specialized in <domain/task>.

## Instructions

When invoked, follow these steps:

1. <First step>
2. <Second step>
3. <Continue as needed>

**Best Practices:**
- <Domain-specific best practice>
- <Continue as needed>

## Workflow

1. **Understand** - <what to analyze>
2. **Execute** - <what to do>
3. **Verify** - <how to validate>
4. **Report** - <what to output>

## Report

<template for agent's output format>
```

## Tool Selection Guide

Select tools based on agent purpose:

| Agent Type | Typical Tools |
|------------|---------------|
| Code reviewer | Read, Grep, Glob |
| Builder/coder | Read, Write, Edit, Bash |
| Validator | Read, Grep, Glob, Bash (read-only commands) |
| Researcher | Read, Grep, Glob, WebFetch, WebSearch |
| Debugger | Read, Bash, Grep, Glob |
| Architect | Read, Grep, Glob, Write |

## Scope Decision Guide

Help users decide between global and project-specific:

**Choose Global (`~/.claude/agents/`) when:**
- Agent represents general expertise (e.g., `python-expert`, `security-reviewer`)
- Skills are transferable across projects
- You want to reuse across multiple codebases

**Choose Project-Specific (`.claude/agents/team/`) when:**
- Agent is tailored to project conventions
- Agent has project-specific context in its instructions
- Agent is for a temporary or project-bound role

## Model Selection Guide

| Model | When to Use |
|-------|-------------|
| **opus** | Complex reasoning, multi-step analysis, architectural decisions |
| **sonnet** | General-purpose coding, balanced speed and quality |
| **haiku** | Simple, fast tasks, formatting, boilerplate generation |
