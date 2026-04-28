# PAI Agent System

**Authoritative reference for agent routing in PAI. Three distinct systems exist-never confuse them.**

---

##  THREE AGENT SYSTEMS - CRITICAL DISTINCTION

PAI has three agent systems that serve different purposes. Confusing them causes routing failures.

|--------|-----------|-------------|-------------------|
| **spawn_agent Tool Subagent Types** | Pre-built agents in Codex (Architect, Designer, Engineer, Explore, etc.) | Internal workflow use ONLY | No |
| **Custom Agents** | Dynamic agents composed via ComposeAgent from traits | When user says "custom agents" | Yes (trait-mapped) |

---

##  FORBIDDEN PATTERNS

**When user says "custom agents":**

```typescript
//  WRONG - These are Codex subagent tools subagent_types, NOT custom agents
spawn_agent({ subagent_type: "Architect", prompt: "..." })
spawn_agent({ subagent_type: "Designer", prompt: "..." })
spawn_agent({ subagent_type: "Engineer", prompt: "..." })

//  RIGHT - Invoke the Agents skill for custom agents
Skill("Agents")  // -> CreateCustomAgent workflow
// OR follow the workflow directly:
// 1. Run ComposeAgent with different trait combinations
// 2. Launch agents with the generated prompts
```

---

## Routing Rules

### The Word "Custom" Is the Trigger

| User Says | Action | Implementation |
|-----------|--------|----------------|
| "**custom agents**", "spin up **custom** agents" | Invoke Agents skill | `Skill("Agents")` -> CreateCustomAgent workflow |
| "agents", "launch agents", "parallel agents" | Custom agents via Agents skill | `Skill("Agents")` -> ComposeAgent -> `spawn_agent({ subagent_type: "general-purpose" })` |
| "research X", "investigate Y" | Research skill | `Skill("Research")` -> appropriate researcher agents |
| "use Remy", "get Ava to" | Named agent | Use appropriate researcher subagent_type |
| (Code implementation) | Engineer | `spawn_agent({ subagent_type: "Engineer" })` |
| (Architecture/design) | Architect | `spawn_agent({ subagent_type: "Architect" })` |

### Custom Agent Creation Flow

When user requests custom agents:

1. **Invoke Agents skill** via `Skill("Agents")` or follow CreateCustomAgent workflow
2. **Run ComposeAgent** for EACH agent with DIFFERENT trait combinations
4. **Launch agents** with Codex subagent tools using the composed prompts

```bash
# Example: 3 custom research agents
bun run .codex/pai/skills/Agents/Tools/ComposeAgent.ts --traits "research,enthusiastic,exploratory"
bun run .codex/pai/skills/Agents/Tools/ComposeAgent.ts --traits "research,skeptical,systematic"
bun run .codex/pai/skills/Agents/Tools/ComposeAgent.ts --traits "research,analytical,synthesizing"
```

---

## spawn_agent Tool Subagent Types (Internal Use Only)

These are pre-built agents in the Codex Codex subagent tools. They are for **internal workflow use**, not for user-requested "custom agents."

| Subagent Type | Purpose | When Used |
|---------------|---------|-----------|
| `Architect` | System design | Development skill workflows |
| `Designer` | UX/UI design | Development skill workflows |
| `Engineer` | Code implementation | Development skill workflows |
| `general-purpose` | Custom agents via ComposeAgent | Parallel work with task-specific prompts |
| `Explore` | Codebase exploration | Finding files, understanding structure |
| `Plan` | Implementation planning | Plan mode |
| `QATester` | Quality assurance | Browser testing workflows |
| `Pentester` | Security testing | WebAssessment workflows |
| `ClaudeResearcher` | Codex-based research | Research skill workflows |
| `GeminiResearcher` | Gemini-based research | Research skill workflows |
| `GrokResearcher` | Grok-based research | Research skill workflows |


---

## Named Agents (Persistent Identities)


|-------|------|-------|---------|
| Serena Blackwood | Architect | Premium UK Female | Long-term architecture decisions |
| Marcus Webb | Engineer | Premium Male | Strategic technical leadership |
| Rook Blackburn | Pentester | Enhanced UK Male | Security testing with personality |
| Ava Sterling | Codex Researcher | Premium US Female | Strategic research |
| Alex Rivera | Gemini Researcher | Multi-perspective | Comprehensive analysis |


---

## Custom Agents (Dynamic Composition)


### Trait Categories

**Expertise** (domain knowledge):
`security`, `legal`, `finance`, `medical`, `technical`, `research`, `creative`, `business`, `data`, `communications`

**Personality** (behavior style):
`skeptical`, `enthusiastic`, `cautious`, `bold`, `analytical`, `creative`, `empathetic`, `contrarian`, `pragmatic`, `meticulous`

**Approach** (work style):
`thorough`, `rapid`, `systematic`, `exploratory`, `comparative`, `synthesizing`, `adversarial`, `consultative`

## Model Selection

Always specify the appropriate model for agent work:

| spawn_agent Type | Model | Speed |
|-----------|-------|-------|
| Simple checks, grunt work | `haiku` | 10-20x faster |
| Standard analysis, implementation | `sonnet` | Balanced |
| Deep reasoning, architecture | `opus` | Maximum intelligence |

```typescript
// Parallel custom agents benefit from haiku/sonnet for speed
spawn_agent({ prompt: agentPrompt, subagent_type: "general-purpose", model: "sonnet" })
```

---

## Spotcheck Pattern

**Always launch a spotcheck agent after parallel work:**

```typescript
spawn_agent({
  prompt: "Verify consistency across all agent outputs: [results]",
  subagent_type: "general-purpose",
  model: "haiku"
})
```

---

## References

- **Agents Skill:** `skills/Agents/SKILL.md` - Custom agent creation, workflows
- **ComposeAgent:** `skills/Agents/Tools/ComposeAgent.ts` - Dynamic composition tool

---

*Last updated: 2026-01-14*
