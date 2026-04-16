---
name: CreateSpecialAgent
description: Analyze an implementation plan and create specialized sub-agents for complex implementations. Identifies domain expertise gaps, generates agent definitions, and updates plans with agent assignments. USE WHEN create agents, specialized agents, domain expert, need specialist, what agents do I need, special agent, create specialist agent.
---

# CreateSpecialAgent

Analyze an implementation plan and determine what specialized sub-agents should be created to effectively execute it. Designed to run after `/dev-plan` to ensure the right team composition before building.

## Customization

**Before executing, check for user customizations at:**
`~/.claude/PAI/USER/SKILLCUSTOMIZATIONS/Development/CreateSpecialAgent/`

If this directory exists, load and apply any PREFERENCES.md or configurations found there. If it does not exist, proceed with skill defaults.

## MANDATORY: Voice Notification (REQUIRED BEFORE ANY ACTION)

**You MUST send this notification BEFORE doing anything else when this skill is invoked.**

1. **Send voice notification**:
   ```bash
   curl -s -X POST http://localhost:8888/notify \
     -H "Content-Type: application/json" \
     -d '{"message": "Running the CreateAgents workflow in the CreateSpecialAgent skill to create specialized agents"}' \
     > /dev/null 2>&1 &
   ```

2. **Output text notification**:
   ```
   Running the **CreateAgents** workflow in the **CreateSpecialAgent** skill to create specialized agents...
   ```

**Full documentation:** `~/.claude/PAI/THENOTIFICATIONSYSTEM.md`

## Model Recommendation

**Recommended model: opus** — This skill requires understanding complex plans, reasoning about team composition, making strategic decisions about agent scope and capabilities, and generating complete agent definitions. Opus provides the strongest reasoning for agent design work.

## Workflow Routing

| Trigger | Workflow |
|---------|----------|
| Create specialized agents from a plan | `Workflows/CreateAgents.md` |

## Pipeline Position

**Where this skill fits in the development pipeline:**

- **Before:** `/dev-plan` (plan must exist first)
- **After:** `/dev-build` (use the created agents during execution)
- **Optional:** Can be skipped if existing agents are sufficient

**Workflow chain:**
```
/dev-plan -> [CreateSpecialAgent/CreateAgents] -> /dev-build -> /dev-test -> /commit
```

## Context Files

| File | Content |
|------|---------|
| `AgentTemplate.md` | Agent definition format template for generating new agents |
| `../PipelineReference.md` | Full pipeline flow documentation and conventions |

## Examples

### Example 1: Database-heavy plan

```
User: "Create agents for plans/migrate-db.md"
-> Invokes CreateAgents workflow
-> Analyzes plan, finds existing agents, identifies gaps
-> Suggests postgres-migration-expert, query-optimizer, data-validator
-> User selects which to create and scope
-> Agents written to .claude/agents/team/
-> Plan updated with agent assignments
```

### Example 2: Full-stack feature

```
User: "What agents do I need for the auth plan?"
-> Invokes CreateAgents workflow
-> Discovers existing frontend-developer plugin agent
-> Suggests fastapi-specialist and integration-test-writer
-> User approves both as project-specific
-> Agents created and plan updated
```

### Example 3: No new agents needed

```
User: "Create special agents for the styling plan"
-> Invokes CreateAgents workflow
-> Analyzes plan requirements against existing agents
-> Determines existing agents cover all requirements
-> Reports "No new agents needed" with justification
```
