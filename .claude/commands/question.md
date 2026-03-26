---
name: question
allowed-tools: Bash(git ls-files:*), Read, Task
description: Answer questions about the project structure and documentation without coding
---

# Question

Answer the user's question by delegating exploration to the explorer agent, then synthesizing findings into a clear response.

## Instructions

- **IMPORTANT: This is a question-answering task only - DO NOT write, edit, or create any files**
- **IMPORTANT: Focus on understanding and explaining existing code and project structure**
- **IMPORTANT: Provide clear, informative answers based on project analysis**
- **IMPORTANT: If the question requires code changes, explain what would need to be done conceptually without implementing**

## Checklist
You MUST create a task for each of these items and complete them in order:
1. **Delegate to explorer agent** — use Task tool to spawn explorer agent for targeted query on user's question
2. **Verify with git** — run git ls-files as backup/verification if needed
3. **Synthesize answer** — review explorer findings, read relevant files, connect findings to answer question comprehensively

## Execute

1. **Delegate to explorer agent** - Use Task tool with subagent_type: "general-purpose" to spawn the explorer agent:

```
Use the explorer agent in targeted query mode to answer:
$ARGUMENTS

Search for relevant code, configuration, and documentation that addresses this question.
```

2. `git ls-files` (as backup/verification if needed)

## Analysis Approach

- Let the explorer agent gather relevant information
- Review the explorer's structured findings
- Read any specific files the explorer identified as relevant
- Connect the findings to answer the question comprehensively

## Response Format

```markdown
## Answer
<Direct answer to the question>

## Evidence
- <file:line reference supporting the answer>
- <relevant code snippet if applicable>

## Related Context
<additional relevant information from project structure>

## Conceptual Explanation
<if the question involves "how would I..." explain the approach without implementing>
```

## Question

$ARGUMENTS
