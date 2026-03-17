---
description: Answer a question about the project without making changes
subtask: true
---

Answer this question about the current project in read-only mode. Do NOT modify any files.

Question: $ARGUMENTS

## Approach

1. **Clarify** — Identify exactly what needs to be understood (structure, location, behavior, configuration, documentation)
2. **Explore** — Use a task agent to search the codebase for relevant code, config, and documentation. Return exact file paths and line references.
3. **Verify** — Review the findings yourself. Read the primary source files that support the answer.
4. **Synthesize** — Answer directly and clearly.

## Guidelines

- Lead with the answer, not the investigation process
- Cite concrete evidence from files using `file:line` references
- Explain relationships between modules, config, and docs when helpful
- Mention uncertainty plainly if the codebase doesn't fully answer the question
- If the user is really asking "how would I change this?", explain the approach conceptually without implementing it

## Response Format

```markdown
## Answer
<direct answer>

## Evidence
- `<path>:<line>` — <why it supports the answer>

## Related Context
<nearby architecture, config, or docs that help orient the user>
```
