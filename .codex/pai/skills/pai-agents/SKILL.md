---
name: "pai-agents"
description: "PAI Codex port: Codex port of PAI Agents."
---

# Agents

This is a Codex-native port of an upstream PAI skill. Codex instructions, local tools, and higher-priority AGENTS.md guidance take precedence.

Use local Codex skills, shell tools, subagents, and web access only when the current session permits them. Do not assume external providers are configured.

## Gated Dependencies

- External media processing tools

## Ported Workflow

##  SCOPE BOUNDARY - This Skill vs Agent Teams

| {PRINCIPAL.NAME} Says | Which System | NOT This Skill? |
|-------------|-------------|-----------------|
| "**custom agents**", "spin up agents", "launch agents" | **THIS SKILL** (Agents) -> ComposeAgent -> `spawn_agent(subagent_type="general-purpose")` | |
| "**create an agent team**", "**agent team**", "**swarm**" | **Delegation skill** -> `TeamCreate` tool | **YES - NOT this skill** |

**If {PRINCIPAL.NAME} says "agent team" or "swarm", do NOT use this skill. Use the Delegation skill which routes to `TeamCreate`.**

- **This skill** = one-shot parallel workers with unique identities, NO shared state, fire-and-forget
- **Agent teams** (Delegation -> TeamCreate) = persistent coordinated teams with shared task lists, messaging, multi-turn collaboration

---

# Agents - Custom Agent Composition System

**Auto-routes when user mentions custom agents, agent creation, or specialized personalities.**
**Does NOT handle agent teams/swarms - that's Delegation skill -> TeamCreate.**

## Configuration: Base + User Merge

The Agents skill uses the standard PAI SYSTEM/USER two-tier pattern:

| Location | Purpose | Updates With PAI? |
|----------|---------|-------------------|

**How it works:** ComposeAgent.ts loads base traits, then merges user customizations over them. Your customizations are never overwritten by PAI updates.

### User Customization Directory

Create your customizations at:
```
.codex/pai/PAI/USER/SKILLCUSTOMIZATIONS/Agents/
 NamedAgents.md    # Your named agent backstories (optional)
```

### Personality -> Prosody Guidelines

| Personality | stability | style | speed | Rationale |
|-------------|-----------|-------|-------|-----------|
| Skeptical | 0.60 | 0.10 | 0.95 | Measured, precise |
| Enthusiastic | 0.35 | 0.40 | 1.10 | High energy |
| Analytical | 0.65 | 0.08 | 0.95 | Clear, structured |
| Bold | 0.45 | 0.35 | 1.05 | Confident, dynamic |
| Cautious | 0.70 | 0.05 | 0.90 | Careful, deliberate |


## Overview

The Agents skill is a complete agent composition and management system:
- Dynamic agent composition from traits (expertise + personality + approach)
- Parallel agent orchestration patterns

## Workflow Routing

**Available Workflows:**
- **CREATECUSTOMAGENT** - Create specialized custom agents -> `Workflows/CreateCustomAgent.md`
- **LISTTRAITS** - Show available agent traits -> `Workflows/ListTraits.md`
- **SPAWNPARALLEL** - Launch parallel agents -> `Workflows/SpawnParallelAgents.md`

## Route Triggers

**CRITICAL: The word "custom" is the KEY trigger for unique agent identities:**

| User Says | What to Use | Why |
|-----------|-------------|-----|
| "agents", "launch agents", "bunch of agents" | SpawnParallel workflow | Same identity, parallel grunt work |
| "use [named agent]" | Named agent | Pre-defined personality from USER config |

**avoid use static agent types (Architect, Engineer, etc.) for custom agents - always use `general-purpose` with ComposeAgent prompts.**

## Components

### Data

**Traits.yaml** (`Data/Traits.yaml`) - Base configuration:
- Core expertise areas: security, technical, research
- Core personalities: skeptical, analytical, enthusiastic
- Core approaches: thorough, rapid, systematic

### Tools

**ComposeAgent.ts** (`Tools/ComposeAgent.ts`)
- Dynamic agent composition engine
- Merges base + user configurations
- Supports persistent custom agents via `--save` / `--load` / `--delete`

```bash
# Compose and use immediately
bun run .codex/pai/skills/Agents/Tools/ComposeAgent.ts --task "Review security"
bun run .codex/pai/skills/Agents/Tools/ComposeAgent.ts --traits "security,skeptical,thorough"

# Persistent custom agents
bun run .codex/pai/skills/Agents/Tools/ComposeAgent.ts --task "Security review" --save
bun run .codex/pai/skills/Agents/Tools/ComposeAgent.ts --list-saved
bun run .codex/pai/skills/Agents/Tools/ComposeAgent.ts --load "security-expert-skeptical-thorough"
bun run .codex/pai/skills/Agents/Tools/ComposeAgent.ts --delete "security-expert-skeptical-thorough"

# Other options
bun run .codex/pai/skills/Agents/Tools/ComposeAgent.ts --list
bun run .codex/pai/skills/Agents/Tools/ComposeAgent.ts --output json
```

**JSON output includes:**
```json
{
  "name": "Security Expert Skeptical Thorough",
    "stability": 0.70,
    "similarity_boost": 0.85,
    "style": 0.05,
    "speed": 0.95,
  },
  "prompt": "..."
}
```

### Templates

**DynamicAgent.hbs** (`Templates/DynamicAgent.hbs`)
- Handlebars template for dynamic agent prompts
- Includes operational guidelines and response format

## Architecture

### Hybrid Agent Model

| Type | Definition | Best For |
|------|------------|----------|
| **Named Agents** | Persistent identities defined in USER config | Recurring work, relationships |
| **Dynamic Agents** | spawn_agent-specific specialists composed from traits | One-off tasks, parallel work |

### The Agent Spectrum

```

   NAMED AGENTS          HYBRID USE          DYNAMIC AGENTS
   (Relationship)        (Best of Both)      (spawn_agent-Specific)

 Defined in USER     "Security expert       Ephemeral specialist
 NamedAgents.md      with [named agent]'s   composed from traits
                      skepticism"

```

## Examples

**Example 1: Create custom agents**
```
User: "Spin up 3 custom security agents"
-> Invokes CREATECUSTOMAGENT workflow
-> Runs ComposeAgent 3 times with DIFFERENT trait combinations
-> Launches agents in parallel
```

**Example 2: List available traits**
```
User: "What agent personalities can you create?"
-> Invokes LISTTRAITS workflow
-> Shows merged base + user traits
```

## Extending the Skill

### Adding Your Own Traits

In `USER/SKILLCUSTOMIZATIONS/Agents/Traits.yaml`:

```yaml
# Add new expertise areas
expertise:
  marketing:
    name: "Marketing Expert"
    description: "Brand strategy, campaigns, market positioning"
    keywords:
      - marketing
      - brand
      - campaign
      - positioning

# Add new personalities
personality:
  visionary:
    name: "Visionary"
    description: "Forward-thinking, sees the big picture"
    prompt_fragment: |
      You think in terms of future possibilities and long-term vision.
      Connect today's work to tomorrow's potential.
```

### Adding Named Agents

In `USER/SKILLCUSTOMIZATIONS/Agents/NamedAgents.md`:

```markdown
## Alex - The Strategist

**Prosody:** stability: 0.55, style: 0.20, speed: 0.95

Alex is a strategic thinker who sees patterns others miss...
```

## Model Selection

| spawn_agent Type | Model | Speed |
|-----------|-------|-------|
| Grunt work, simple checks | `haiku` | 10-20x faster |
| Standard analysis, research | `sonnet` | Balanced |
| Deep reasoning, architecture | `opus` | Maximum quality |

## Version History

- **v2.0.0** (2026-01): Restructured to base + user merge pattern, added prosody support
- **v1.0.0** (2025-12): Initial creation
