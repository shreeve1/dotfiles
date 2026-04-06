# Verifier: Agent Definition

## Target Agent
agent-expert.md (from agents/pi-pi/)

## Context Files
context.md (from teams/pi-pi/)

## Scoring Rubric

### Criterion 1: Frontmatter Correctness (weight: 3)
Pi agent definitions require YAML frontmatter with `name`, `description`, `model`, and `tools`.
- 5: Valid YAML frontmatter with all 4 fields. Name is kebab-case (`database-expert`). Model is a real model identifier (e.g., `anthropic/claude-sonnet-4-6`, `openrouter/qwen/qwen3-coder-plus`). Tools are comma-separated from the valid set.
- 3: Frontmatter present with all fields but model isn't a real identifier, or tools include non-existent ones
- 1: Frontmatter missing 1-2 required fields
- 0: No frontmatter or completely wrong format

### Criterion 2: Tool Assignment Appropriateness (weight: 3)
The user wants: read codebase (read, grep, find), run EXPLAIN ANALYZE (bash), suggest improvements. NOT modify production data.
- 5: Tools include read, bash, grep, find, ls (can read and run queries). Does NOT include write or edit (user said no direct data modification). The constraint about not modifying production data is addressed in the instructions.
- 3: Reasonable tools but includes write/edit without justification, or missing bash (can't run queries)
- 1: Wrong tool set (e.g., only write/edit, or web_search for a database agent)
- 0: No tools specified

### Criterion 3: Instruction Quality (weight: 2)
- 5: Clear role definition covering all 4 requested areas (query optimization, index design, schema migrations, performance diagnostics). Includes specific guidance on how to approach each area. Has constraints about read-only behavior.
- 3: Covers most areas but some are vague, or missing the read-only constraint
- 1: Generic "you are a database expert" without specific guidance
- 0: Instructions don't match the requested role

### Criterion 4: Model Selection Reasoning (weight: 1)
- 5: Chooses an appropriate model for the role (reasoning-heavy analysis suggests a stronger model like Opus/GPT-5, not Haiku) with brief justification
- 3: Reasonable model choice but no justification
- 1: Inappropriate model choice (e.g., Haiku for complex query analysis)
- 0: No model specified or nonsensical choice

### Criterion 5: Team Integration (weight: 1)
- 5: Considers how this agent fits with existing team agents — when it would be dispatched (query performance issues, migration planning, schema reviews), how it relates to other agents (builder implements its suggestions, planner references its analysis)
- 3: Some team context but not specific
- 1: Standalone agent with no team integration guidance
- 0: N/A

## Required Elements
- [ ] Valid YAML frontmatter with name, description, model, tools
- [ ] Name is kebab-case: `database-expert`
- [ ] Tools include `read` and `bash` (needed for EXPLAIN ANALYZE)
- [ ] Tools do NOT include `write` or `edit` (or this is explicitly constrained)
- [ ] PostgreSQL-specific guidance is included (not generic SQL)
- [ ] Read-only / no production data modification constraint is present

## Anti-Patterns
- Including `write` and `edit` without addressing the "no direct data modification" requirement
- Generic SQL advice instead of PostgreSQL-specific guidance
- Choosing Haiku for complex analytical work
- Missing YAML frontmatter entirely
- Inventing tools that don't exist in pi (e.g., `sql_query`, `database_connect`)
