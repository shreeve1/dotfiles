# CreateAgents Workflow

Six-phase agent creation: **gather context -> analyze requirements -> generate suggestions -> user decision -> create agents -> update plan**.

## Variables

PLAN_PATH: Path to the plan file (optional — defaults to most recent in `plans/`, `specs/`, or `artifacts/plans/`).
GLOBAL_AGENTS_DIR: `~/.claude/agents/`
PROJECT_AGENTS_DIR: `.claude/agents/team/`
PLUGIN_AGENTS_DIR: `~/.claude/plugins/marketplaces/claude-code-workflows/plugins/*/agents/`
PLAN_DIRECTORIES: `plans/`, `specs/`, `artifacts/plans/`

## Pre-flight

1. **Verify plan file exists:**
   - If `PLAN_PATH` provided, check it exists
   - Otherwise, find most recent `.md` file in `PLAN_DIRECTORIES`
   - If no plan found, ask user to provide path or run `/dev-plan` first

2. **Ensure agents directory exists:**
   ```bash
   mkdir -p .claude/agents/team/
   ```

## Checklist

You MUST create a task for each of these items and complete them in order:
1. **Gather context** — locate plan file, inventory all existing agents across global, project, and plugin directories
2. **Analyze plan requirements** — extract technical domains, identify agent gaps, note where specialized expertise would help
3. **Generate suggestions** — create agent recommendations with name, role, justification, scope, and capabilities
4. **Present and gather decisions** — show summary to user, use AskUserQuestion to gather decisions on which agents to create and their scope
5. **Create selected agents** — generate complete agent definitions with proper frontmatter and structure, write to appropriate directory
6. **Update plan file** — add new agents to Team Members section, reassign relevant tasks, save updated plan

## Instructions

- If no PLAN_PATH is provided, find and use the most recently modified `.md` file in `PLAN_DIRECTORIES`
- Thoroughly read and understand the plan's requirements, tasks, and technical domains
- Scan all existing agents to avoid suggesting duplicates
- Analyze the plan to identify gaps where specialized agents would improve execution
- Present suggestions to the user with clear reasoning
- Use AskUserQuestion to gather user decisions on which agents to create and their scope
- Create selected agents following the template in `AgentTemplate.md`
- **IMPORTANT**: After creating agents, update the original plan file to reference the new agents
- Update both the Team Members section AND reassign relevant tasks to use the new specialized agents

## Workflow

### Phase 1: Gather Context

1. **Locate the Plan**
   - If PLAN_PATH provided, use it directly
   - Otherwise, find most recent `.md` file in `PLAN_DIRECTORIES`
   - Read and parse the plan thoroughly

2. **Inventory Existing Agents**
   - Scan `GLOBAL_AGENTS_DIR` for global agents (available across all projects)
   - Scan `PROJECT_AGENTS_DIR` for project-specific team agents
   - Scan `PLUGIN_AGENTS_DIR` for plugin-provided agents (reference only)
   - Build a comprehensive list with name, description, and capabilities

### Phase 2: Analyze Plan Requirements

3. **Extract Technical Domains**
   - Identify all technical areas mentioned in the plan (e.g., database, API, frontend, security)
   - Note specific technologies referenced (e.g., PostgreSQL, React, FastAPI)
   - List the types of tasks in the plan (building, testing, validation, deployment)

4. **Identify Agent Gaps**
   - Compare plan requirements against existing agents
   - Identify domains or tasks not covered by existing agents
   - Note where specialized expertise would improve quality or efficiency
   - Consider both:
     - **Domain specialists**: Deep expertise in specific technology (e.g., `postgres-expert`, `react-hooks-specialist`)
     - **Task specialists**: Expertise in specific activities (e.g., `migration-validator`, `api-tester`)

### Phase 3: Generate Suggestions

5. **Create Agent Recommendations**
   For each suggested agent, prepare:
   - Proposed name (kebab-case)
   - Role description (one sentence)
   - Why this agent would help (specific reference to plan tasks)
   - Suggested scope (global vs project-specific)
   - Key capabilities it would have

6. **Present Suggestions to User**
   Display a summary showing:
   - The plan being analyzed
   - Existing agents that could be used
   - Recommended new agents with justification

### Phase 4: User Decision

7. **Gather User Input**
   Use AskUserQuestion to ask:

   **Question 1**: Which suggested agents should be created?
   - Present each suggested agent as an option
   - Allow multi-select
   - Include "None - existing agents are sufficient" as an option

   **Question 2** (for each selected agent): Should this agent be global or project-specific?
   - **Global** (`~/.claude/agents/`): Available across all projects, good for general-purpose specialists
   - **Project-specific** (`.claude/agents/team/`): Only for this project, good for project-specific roles

### Phase 5: Create Agents

8. **Create Selected Agents**
   For each approved agent:
   - Generate complete agent definition following the template in `AgentTemplate.md`
   - Write to appropriate directory based on user's scope selection
   - Include:
     - Proper frontmatter (name, description, tools, model, color)
     - Clear purpose statement
     - Detailed instructions
     - Workflow steps
     - Report format

### Phase 6: Update the Plan

9. **Update Plan to Reference New Agents**
   After creating agents, automatically update the plan file:

   **If plan has a `### Team Members` section:**
   - Add each newly created agent to the Team Members list
   - Follow the existing format in the plan
   - Include: Name, Role, Agent Type, and Resume status

   **If plan has NO Team Members section but has a `## Team Orchestration` section:**
   - Create a new `### Team Members` subsection under Team Orchestration
   - Add all newly created agents with their roles

   **If plan has neither section:**
   - Add a new `## Specialized Agents` section before `## Step by Step Tasks` (or at end if no tasks section)
   - List all newly created agents with their names, descriptions, and when to use them

   **Update format for Team Members:**
   ```markdown
   - Builder
     - Name: <agent-name>
     - Role: <role description based on plan requirements>
     - Agent Type: <agent-name>
     - Resume: true
   ```

   **Update format for Specialized Agents section:**
   ```markdown
   ## Specialized Agents

   The following specialized agents were created for this plan:

   | Agent | Type | Description | When to Use |
   |-------|------|-------------|-------------|
   | <name> | <global/project> | <description> | <specific tasks from plan> |
   ```

10. **Update Step by Step Tasks (if applicable)**
    If the plan has specific tasks that would benefit from the new agents:
    - Identify tasks that align with the new agent's expertise
    - Update the `Assigned To` field to use the new agent
    - Update the `Agent Type` field to match the new agent's name
    - Only update tasks where the new agent is clearly more appropriate than a generic builder

## Report

After completing agent creation and plan update, provide:

```
## Agent Creation Summary

**Plan Analyzed**: <plan path>

**Existing Agents Found**:
- Global: <count> agents
- Project Team: <count> agents
- Plugins: <count> agents (reference)

**Agents Created**:
| Name | Scope | Location |
|------|-------|----------|
| <name> | <global/project> | <path> |

**Plan Updated**:
- Added <count> agents to Team Members section
- Updated <count> task assignments to use new agents
- <list specific changes made to the plan>

**Next Steps**:
- Run `/dev-build <plan-path>` to execute the plan with your new team
- The plan has been updated with agent assignments - no further changes needed

**Workflow Chain**:
/dev-plan -> /dev-create-special-agent -> /dev-build -> /dev-test -> /commit
```
