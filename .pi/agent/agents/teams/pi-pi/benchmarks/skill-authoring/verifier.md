# Verifier: Skill Authoring

## Target Agent
skill-expert.md (from agents/pi-pi/)

## Context Files
context.md (from teams/pi-pi/)

## Scoring Rubric

### Criterion 1: YAML Frontmatter Correctness (weight: 3)
Pi skills require YAML frontmatter with `name` and `description`. The description should include trigger phrases.
- 5: Valid YAML frontmatter with `name` (kebab-case), `description` (includes trigger phrases like "review PR", "check pull request")
- 3: Frontmatter present but missing trigger phrases in description, or name not kebab-case
- 1: Frontmatter present but wrong fields or invalid YAML
- 0: No frontmatter, or completely wrong format

### Criterion 2: Skill Structure (weight: 3)
Pi skills should have a clear workflow with numbered phases, be self-contained, and include tool usage guidance.
- 5: Well-structured with clear phases (fetch PR, analyze, report, optionally post), each phase describes what tools to use and what output to produce
- 3: Has phases but some are vague or missing tool guidance
- 1: Unstructured wall of instructions
- 0: Not recognizable as a skill

### Criterion 3: Tool Usage Accuracy (weight: 2)
The skill should reference pi's actual tools (bash for gh CLI, read for file inspection, write for output) rather than inventing tools that don't exist.
- 5: Uses correct pi tools (bash for `gh pr diff`, `gh pr view`, write for saving output, bash for `gh pr comment`). Doesn't invent non-existent tools.
- 3: Mostly correct but includes 1-2 tools that don't exist in pi
- 1: Invents a custom tool API that doesn't exist
- 0: No tool guidance, or completely wrong tool references

### Criterion 4: Report Format (weight: 2)
The skill should define a clear output format for the review.
- 5: Defines a structured report format with severity categories (Critical/Important/Minor), file:line references, and a summary verdict — similar to existing pi review patterns
- 3: Has a report format but missing severity categories or not structured
- 1: Vague "produce a review" without format specification
- 0: No output format defined

### Criterion 5: Practical Completeness (weight: 1)
- 5: Handles edge cases: what if gh CLI isn't installed, what if the PR number is invalid, what if the diff is too large for context. Includes error handling guidance.
- 3: Handles the happy path well but no error handling
- 1: Only covers the basic case
- 0: Incomplete — missing major workflow steps

## Required Elements
- [ ] Valid YAML frontmatter with `name` and `description`
- [ ] `name` is kebab-case (e.g., `pr-review`)
- [ ] `description` includes trigger phrases
- [ ] Workflow has numbered phases
- [ ] Uses `bash` tool for gh CLI commands (not invented tools)
- [ ] Defines a structured output/report format
- [ ] Covers the core flow: fetch diff → analyze → report

## Anti-Patterns
- Inventing MCP tools or custom APIs that don't exist in pi
- Using Claude Code / Cursor specific syntax instead of pi syntax
- Missing YAML frontmatter entirely
- Producing a generic "prompt engineering" document instead of a pi skill
- No trigger phrases in the description (skill won't be discovered)
