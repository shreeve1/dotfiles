---
name: dev-create-special-agent
description: Analyze implementation plans and create specialized sub-agents for complex implementations. Use after dev-plan when you need specialized agents, the plan requires domain expertise, or when asked to 'create agents', 'need specialist agents', 'what agents do I need', or 'set up the team'. Automatically inventories existing agents, suggests purpose-built agents for the plan, and updates the plan with agent assignments.
---

# Create Special Agents for Implementation Plans

Use this skill after `dev-plan` produces an implementation plan that requires specialized sub-agents to execute effectively. Analyzes the plan's technical domains, inventories existing agents, identifies capability gaps, creates purpose-built agents, and updates the plan with agent assignments. This prepares the right team composition before `dev-build` executes the plan.

Do not use this skill when:
- No plan exists yet (use `dev-plan` first)
- The plan is simple enough for existing generic agents
- The user just wants to create a single ad-hoc agent (use `meta-agent` task instead)

---

## Input

The user provides either:
- A **file path** to an implementation plan (e.g., `artifacts/plans/add-user-auth.md`)
- A **free-text request** — in which case, find the most recently modified `.md` file in `artifacts/plans/`

If no plan can be located, use `question` to ask the user to provide a path or run `dev-plan` first.

---

## Variables

- `PLAN_PATH` — path to the implementation plan file
- `GLOBAL_AGENTS_DIR` — `~/.config/opencode/agents/`

---

## Workflow Overview

Use `todowrite` to create a task for each phase and update status as you progress through them:

1. Gather Context — locate plan, inventory existing agents
2. Analyze Plan Requirements — extract domains, identify gaps
3. Generate Suggestions — create agent recommendations
4. User Decision — present options, gather selections via `question`
5. Create Agents — write agent files in OpenCode format
6. Update Plan — add agents to plan, reassign tasks

---

## Phase 1: Gather Context

### 1.1 Locate the Plan

- If the user provides a file path, use `read` to load it
- Otherwise, use `bash` to find the most recent `.md` in `artifacts/plans/`:
  ```bash
  ls -t artifacts/plans/*.md 2>/dev/null | head -5
  ```
- If no plan found, use `question`:
  - Provide a path to a plan file
  - Or run `dev-plan` first to create one

Read and parse the plan thoroughly. Understand its:
- Core objective and scope
- Technical domains and technologies
- Task structure and dependencies
- Any existing team/agent assignments

### 1.2 Inventory Existing Agents

Scan all available agent locations:

1. **Global agents** — use `bash` to list `~/.config/opencode/agents/*.md`
2. **Project agents** — use `glob` to find any project-level agent files (e.g., `.opencode/agents/*.md`)

For each agent found, use `read` to extract:
- **Name**: from filename (strip `.md` extension)
- **Description**: from frontmatter `description:` field
- **Tools**: from frontmatter `tools:` section (YAML map of tool names)
- **Capabilities**: from the first paragraph after `## Purpose` heading

Build a comprehensive inventory of what's already available.

---

## Phase 2: Analyze Plan Requirements

### 2.1 Extract Technical Domains

Scan the plan systematically for:
- **Technology names** in prose and task descriptions (PostgreSQL, React, SOPS, Docker, etc.)
- **File extensions** referenced (`.py`, `.sh`, `.yml`, `.env`, etc.)
- **Task verbs** indicating activity types (migrate, encrypt, validate, deploy, refactor)
- **Phase boundaries** with distinct technical concerns
- **Dependency patterns** between tasks that suggest domain groupings
- **Complexity indicators** (multiple phases, cross-cutting concerns, many files)

### 2.2 Identify Agent Gaps

Compare plan requirements against existing agents:

- Which domains lack coverage?
- Where would specialized expertise improve quality?
- Consider two categories:
  - **Domain specialists**: Deep expertise in specific technology (e.g., `postgres-expert`, `react-hooks-specialist`)
  - **Task specialists**: Expertise in specific activities (e.g., `migration-validator`, `api-tester`)

Only suggest agents that would provide meaningful improvement over generic builders.

---

## Phase 3: Generate Suggestions

For each recommended agent, prepare:
- **Name** — kebab-case, descriptive
- **Role** — one-sentence description
- **Justification** — specific reference to plan tasks this agent would improve
- **Suggested scope** — global (reusable across projects) vs project-specific
- **Key capabilities** — tools and domain knowledge needed

Present a formatted summary showing:
1. The plan being analyzed
2. Existing agents available for use
3. Recommended new agents with justification

### 3.1 No Agents Needed Path

If analysis shows existing agents provide sufficient coverage for all plan tasks:
- Skip to Phase 4 with only "None - existing agents are sufficient" selected
- Output a brief report explaining why existing coverage is adequate
- Suggest proceeding directly to `dev-build` with current agents

---

## Phase 4: User Decision

Use `question` to gather decisions:

**Question 1**: Which agents should be created?
- Present each suggested agent as an option with description
- Allow multiple selections (`multiple: true`)
- Include "None - existing agents are sufficient" as an option

**Question 2** (for each selected agent): Scope selection
- **Global** (`~/.config/opencode/agents/`): Available across all projects, good for general-purpose specialists
- **Project-specific** (`.opencode/agents/`): Only for this project, good for project-tailored roles

**If user selects "None":** Skip Phases 5 and 6 entirely. Jump directly to the Report section and note that no agents were created, existing coverage is sufficient, and the user can proceed to `dev-build`.

---

## Phase 5: Create Agents

For each approved agent, generate a complete OpenCode agent file.

### OpenCode Agent Format

```md
---
description: <action-oriented description starting with verb phrase — e.g., "Specialist in PostgreSQL schema design and migration safety. Use for database-heavy implementation tasks.">
mode: subagent
model: <read from existing agent — see Model Selection below>
tools:
  read: true
  glob: true
  grep: true
  # Add others based on agent purpose — see Tool Selection Guide
permission:
  edit: allow
  bash:
    "*": ask
---

# <Agent Title>

## Purpose

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

1. **Understand** — <what to analyze>
2. **Execute** — <what to do>
3. **Verify** — <how to validate>
4. **Report** — <what to output>

## Report

<template for agent's output format>
```

### Tool Selection Guide

Select tools based on agent purpose:

| Agent Type | Typical Tools |
|------------|---------------|
| Code reviewer | read, grep, glob |
| Builder/coder | read, write, edit, bash |
| Validator | read, grep, glob, bash |
| Researcher | read, grep, glob, webfetch, google_search |
| Debugger | read, bash, grep, glob |
| Architect | read, grep, glob, write |

### Permission Selection Guide

Set `permission:` based on what the agent needs to do:

| Agent Type | edit | bash |
|------------|------|------|
| Builder/coder | `allow` | `"*": ask` |
| Validator (read-only) | `deny` | `"*": ask` |
| Researcher | `deny` | `deny` |
| Code reviewer | `deny` | `deny` |
| Debugger | `allow` | `"*": ask` |
| Architect/planner | `allow` | `deny` |

- `edit: allow` — agent can modify files
- `edit: deny` — agent can only read, not write or edit
- `bash: "*": ask` — bash commands require user approval
- `bash: "*": allow` — bash runs without approval (use sparingly)
- `bash: deny` — no bash access

### Model Selection

To get current model strings, read the `model:` field from an existing agent (e.g., `~/.config/opencode/agents/builder.md`) rather than hardcoding. General guidance:

- **Sonnet** (default) — good balance of speed and quality; use for most agents
- **Opus** — for agents requiring deep reasoning or complex analysis
- **Haiku** — for fast, lightweight tasks (linting, simple validation)

### Write Agent Files

For each agent:

1. **Determine target path**:
   - Global: `~/.config/opencode/agents/<agent-name>.md`
   - Project-specific: `.opencode/agents/<agent-name>.md` (relative to project root)

2. **Ensure directory exists**:
   ```bash
   mkdir -p <target-directory>
   ```

3. **Check for naming collisions** — use `glob` to verify no file already exists at the target path. If a collision is found, use `question` to ask the user whether to overwrite, rename, or skip.

4. **Write the agent file** using `write`

5. **Verify** the file was written correctly with `read`

---

## Phase 6: Update the Plan

After creating agents, update the original plan file using `edit`.

### 6.0 Detect Plan Structure

Before updating, use `grep` and `read` to scan the plan for existing structure:

- Look for `## Team Orchestration` or `### Team Members` — append to existing section
- Look for `## Step by Step Tasks` — insert new section BEFORE this
- Look for `## Acceptance Criteria` — insert new section BEFORE this
- Look for `## Implementation Phases` — insert after this section
- If none of these exist — append to end of file

Also check for existing agent assignments:
- Look for `Assigned To:` fields in tasks
- Look for agent references in task descriptions
- If assignments exist, merge (don't replace) unless user confirms

### 6.1 If plan has a `### Team Members` section:

Add each new agent following the existing format:

```markdown
- Builder
  - Name: <agent-name>
  - Role: <role description based on plan requirements>
  - Agent Type: <agent-name>
  - Resume: true
```

### 6.2 If plan has a `## Team Orchestration` section but no Team Members:

Create a `### Team Members` subsection under Team Orchestration and add all new agents.

### 6.3 If plan has none of the above sections:

Add a `## Specialized Agents` section. Placement priority:
1. Before `## Step by Step Tasks` (if it exists)
2. Before `## Acceptance Criteria` (if it exists)
3. After `## Solution Approach` or `## Implementation Phases` (if they exist)
4. At end of file (fallback)

```markdown
## Specialized Agents

The following specialized agents were created for this plan:

| Agent | Scope | Description | Plan Tasks |
|-------|-------|-------------|------------|
| <name> | <global/project> | <description> | <specific tasks from plan> |
```

### 6.4 Update Task Assignments (Optional)

Only update task assignments if the plan uses structured task fields (e.g., `Assigned To:`, `Agent:`). If tasks are plain checkboxes or prose descriptions, add a note in the Specialized Agents table mapping agents to task IDs instead.

- Use `edit` for targeted updates to avoid disrupting the plan structure
- Only reassign where the specialist is clearly more appropriate than a generic builder
- When uncertain, prefer adding the mapping table over modifying individual tasks

---

## Scope Decision Guide

Help users decide between global and project-specific:

**Choose Global when:**
- Agent represents general expertise (e.g., `python-expert`, `security-reviewer`)
- Skills are transferable across projects
- You want to reuse across multiple codebases

**Choose Project-Specific when:**
- Agent is tailored to project conventions
- Agent has project-specific context in its instructions
- Agent is for a temporary or project-bound role

---

## Report

After completing agent creation and plan update, output:

```
Agent Creation Summary

Plan Analyzed: <plan path>

Existing Agents Found:
- Global: <count> agents
- Project: <count> agents

Agents Created:
| Name | Scope | Location |
|------|-------|----------|
| <name> | <global/project> | <path> |

Plan Updated:
- Added <count> agents to team section
- Updated <count> task assignments
- <list specific changes>

Next Steps:
- Review the updated plan to verify agent assignments
- Run dev-build to execute the plan with the new team
- Workflow: dev-plan -> dev-create-special-agent -> dev-build -> dev-test
```

---

## Examples

### Example 1: Database-Heavy Plan

**Plan requires**: PostgreSQL migrations, query optimization, data validation
**Existing agents**: builder, validator
**Suggestions**:
1. `postgres-migration-expert` — Handles schema migrations safely
2. `query-optimizer` — Reviews and optimizes SQL queries
3. `data-validator` — Validates data integrity during migrations

### Example 2: Full-Stack Feature

**Plan requires**: React frontend, FastAPI backend, integration tests
**Existing agents**: builder, validator
**Suggestions**:
1. `fastapi-specialist` — Backend API implementation expert
2. `integration-test-writer` — Creates end-to-end test scenarios

### Example 3: Security-Focused Task

**Plan requires**: Authentication implementation, security audit
**Existing agents**: builder, validator
**Suggestions**:
- None needed if existing agents already cover security review capabilities
