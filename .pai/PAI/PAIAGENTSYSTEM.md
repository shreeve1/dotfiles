# PAI Agent System

**Authoritative reference for agent routing in PAI. Three distinct systems exist—never confuse them.**

---

## 🚨 THREE AGENT SYSTEMS — CRITICAL DISTINCTION

PAI has three agent systems that serve different purposes. Confusing them causes routing failures.

| System | What It Is | When to Use | Has Unique Voice? |
|--------|-----------|-------------|-------------------|
| **Task Tool Subagent Types** | Pre-built OpenCode agents (architect, engineer, explorer, reviewer, etc.) | Internal workflow use ONLY | No |
| **Named Agents** | Persistent identities with backstories and ElevenLabs voices (Serena, Marcus, Rook, etc.) | Recurring work, voice output, relationships | Yes |
| **Custom Agents** | Dynamic agents composed via ComposeAgent from traits | When user says "custom agents" | Yes (trait-mapped) |

---

## 🚫 FORBIDDEN PATTERNS

**When user says "custom agents":**

```typescript
// ❌ WRONG - These are Task tool subagent_types, NOT custom agents
Task({ subagent_type: "pai-architect", prompt: "..." })
Task({ subagent_type: "general", prompt: "..." })
Task({ subagent_type: "pai-engineer", prompt: "..." })

// ✅ RIGHT - Invoke the Agents skill for custom agents
Skill("Agents")  // → CreateCustomAgent workflow
// OR follow the workflow directly:
// 1. Run ComposeAgent with different trait combinations
// 2. Launch agents with the generated prompts
// 3. Each gets unique personality + voice
```

---

## Routing Rules

### The Word "Custom" Is the Trigger

| User Says | Action | Implementation |
|-----------|--------|----------------|
| "**custom agents**", "spin up **custom** agents" | Invoke Agents skill | `Skill("Agents")` → CreateCustomAgent workflow |
| "agents", "launch agents", "parallel agents" | Custom agents via Agents skill | `Skill("Agents")` → ComposeAgent → `Task({ subagent_type: "general" })` |
| "research X", "investigate Y" | Research skill | `Skill("Research")` → appropriate researcher agents |
| "use Ava", "get Alex to" | Named agent | Use appropriate researcher subagent_type |
| (Code implementation) | `pai-engineer` | `Task({ subagent_type: "pai-engineer" })` |
| (Architecture/design) | `pai-architect` | `Task({ subagent_type: "pai-architect" })` |

### Custom Agent Creation Flow

When user requests custom agents:

1. **Invoke Agents skill** via `Skill("Agents")` or follow CreateCustomAgent workflow
2. **Run ComposeAgent** for EACH agent with DIFFERENT trait combinations
3. **Extract prompt and voice_id** from ComposeAgent output
4. **Launch agents** with Task tool using the composed prompts
5. **Voice results** using each agent's unique voice_id

```bash
# Example: 3 custom research agents
bun run ~/.config/opencode/skills/Agents/Tools/ComposeAgent.ts --traits "research,enthusiastic,exploratory"
bun run ~/.config/opencode/skills/Agents/Tools/ComposeAgent.ts --traits "research,skeptical,systematic"
bun run ~/.config/opencode/skills/Agents/Tools/ComposeAgent.ts --traits "research,analytical,synthesizing"
```

---

## Task Tool Subagent Types (Internal Use Only)

These are pre-built agents available through OpenCode's task/subagent mechanism. They are for **internal workflow use**, not for user-requested "custom agents."

| Subagent Type | Purpose | When Used |
|---------------|---------|-----------|
| `pai-architect` | System design | Development skill workflows |
| `general` | Custom agents via ComposeAgent | Parallel work with task-specific prompts |
| `pai-engineer` | Code implementation | Development skill workflows |
| `explorer` | Codebase exploration | Finding files, understanding structure |
| `browser-qa` | Quality assurance | Browser testing workflows |
| `devtools-inspector` | Browser/security inspection | WebAssessment workflows |
| `claude-researcher` | Claude-based research | Research skill workflows |
| `gemini-researcher` | Gemini-based research | Research skill workflows |
| `perplexity-researcher` | Source-verifying research | Research skill workflows |
| `grok-researcher` | Contrarian fact research | Research skill workflows |

**These do NOT have unique voices or ComposeAgent composition.**

---

## Named Agents (Persistent Identities)

Named agents have rich backstories, personality traits, and mapped ElevenLabs voices. They provide relationship continuity across sessions.

| Agent | Role | Voice | Use For |
|-------|------|-------|---------|
| Serena Blackwood | Architecture advisor | Premium UK Female | Long-term architecture decisions |
| Marcus Webb | Engineering advisor | Premium Male | Strategic technical leadership |
| Rook Blackburn | Security tester | Enhanced UK Male | Security testing with personality |
| Ava Sterling | Strategic researcher | Premium US Female | Strategic research |
| Alex Rivera | Multi-perspective researcher | Multi-perspective | Comprehensive analysis |

**Full backstories and voice settings:** Individual `agents/*.md` files (persona frontmatter + body)

---

## Custom Agents (Dynamic Composition)

Custom agents are composed on-the-fly from traits using ComposeAgent. Each unique trait combination maps to a different ElevenLabs voice.

### Trait Categories

**Expertise** (domain knowledge):
`security`, `legal`, `finance`, `medical`, `technical`, `research`, `creative`, `business`, `data`, `communications`

**Personality** (behavior style):
`skeptical`, `enthusiastic`, `cautious`, `bold`, `analytical`, `creative`, `empathetic`, `contrarian`, `pragmatic`, `meticulous`

**Approach** (work style):
`thorough`, `rapid`, `systematic`, `exploratory`, `comparative`, `synthesizing`, `adversarial`, `consultative`

### Voice Mapping Examples

| Trait Combo | Voice | Why |
|-------------|-------|-----|
| contrarian + skeptical | Clyde (gravelly) | Challenging intensity |
| enthusiastic + creative | Jeremy (energetic) | High-energy creativity |
| security + adversarial | Callum (edgy) | Hacker character |
| analytical + meticulous | Charlotte (sophisticated) | Precision analysis |

**Full trait definitions and voice mappings:** `skills/Agents/Data/Traits.yaml`

---

## Agent Selection

Use the appropriate OpenCode subagent for agent work. OpenCode subagents carry their configured models in their agent definitions; do not pass a per-call `model` field unless the active Task tool schema exposes it.

| Task Type | Subagent | Why |
|-----------|----------|-----|
| Simple checks, codebase scouting | `explorer` | Fast isolated reconnaissance |
| Standard implementation | `pai-engineer` | Focused TDD/code execution |
| Deep reasoning, architecture | `pai-architect` | Maximum design focus |

```typescript
// Parallel custom agents use the general OpenCode subagent.
Task({ prompt: agentPrompt, subagent_type: "general" })
```

---

## Spotcheck Pattern

**Always launch a spotcheck agent after parallel work:**

```typescript
Task({
  prompt: "Verify consistency across all agent outputs: [results]",
  subagent_type: "general"
})
```

---

## References

- **Agents Skill:** `skills/Agents/SKILL.md` — Custom agent creation, workflows
- **ComposeAgent:** `skills/Agents/Tools/ComposeAgent.ts` — Dynamic composition tool
- **Traits:** `skills/Agents/Data/Traits.yaml` — Trait definitions and voice mappings
- **Agent Personalities:** Individual `agents/*.md` files — Named agent backstories and voice settings

---

*Last updated: 2026-01-14*
