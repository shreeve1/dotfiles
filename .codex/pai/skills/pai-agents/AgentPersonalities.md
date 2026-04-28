# Agent Personalities

**Canonical source of truth for all PAI agent personality definitions.**


## Hybrid Agent Model

PAI uses a **hybrid agent system** that combines:


### When to Use Each

| Scenario | Use | Why |
|----------|-----|-----|
| Recurring research | Named Agent (Remy, Ava) | Relationship continuity, known behavior |
| Deep character interaction | Named Agent | Rich backstory, personality depth |
| One-off specialized task | Dynamic Agent | Perfect task-fit, no bloat |
| Novel trait combination | Dynamic Agent | Compose exactly what's needed |
| Parallel grunt work | Dynamic Agent | No personality overhead |

### The Agent Spectrum

```

                         AGENT SPECTRUM

   NAMED AGENTS        HYBRID USE            DYNAMIC AGENTS
   (Relationship)      (Best of Both)        (spawn_agent-Specific)

 Remy, Ava,         "Security expert      Ephemeral specialist
 Johannes, Marcus   with Johannes's       composed from traits
                    skepticism"

 Use for:           Use for:              Use for:
 - Recurring work   - Named + trait mix   - One-off tasks
 - Continuity         specialized         - Novel combinations

```

### Dynamic Agent Composition

**How {PRINCIPAL.NAME} uses it:** Just ask naturally.

| {PRINCIPAL.NAME} Says | {DAIDENTITY.NAME} Does |
|-------------|----------|
| "I need a legal expert to review this" | Composes legal + analytical + thorough agent |
| "Get me someone skeptical about security" | Composes security + skeptical + adversarial agent |
| "Quick business assessment" | Composes business + pragmatic + rapid agent |

**{PRINCIPAL.NAME} never touches tools.** {DAIDENTITY.NAME} composes agents internally based on the request.

###  CRITICAL TRIGGER: Agent Type Selection

**THREE DISTINCT PATTERNS - KNOW THE DIFFERENCE:**

| {PRINCIPAL.NAME} Says | What to Use | Why |
|-------------|-------------|-----|
| "spin up agents", "bunch of agents", "launch 5 agents to do X" | **Parallel agents** | Same identity, grunt work |
| Named agents like "use Marcus" or "ask Serena" | **Named Agent** | Persistent identity from this file |

**CRITICAL: Custom agents avoid use static agent types (Architect, Engineer, etc.) - always use `general-purpose` with ComposeAgent prompts.**

---

### Pattern 1: CUSTOM AGENTS -> ComposeAgent + general-purpose

**Trigger words:** "custom agents", "custom", "specialized agents with different expertise"

**What happens:**
1. Run `bun run .codex/pai/skills/Agents/Tools/ComposeAgent.ts` for EACH agent
4. Launch with `subagent_type: "general-purpose"` - avoid use static types

**Why this matters:**
- Custom agents have unique identities - NOT static types (Architect, Engineer, etc.)

**Example - CORRECT:**
```bash
# {PRINCIPAL.NAME}: "Spin up 5 CUSTOM science agents"
# {DAIDENTITY.NAME} runs ComposeAgent 5 times with DIFFERENT trait combos:
bun run ComposeAgent.ts --traits "research,enthusiastic,exploratory" --task "Astrophysicist" --output json
bun run ComposeAgent.ts --traits "medical,meticulous,systematic" --task "Molecular biologist" --output json
bun run ComposeAgent.ts --traits "technical,creative,bold" --task "Quantum physicist" --output json
bun run ComposeAgent.ts --traits "medical,empathetic,consultative" --task "Neuroscientist" --output json
bun run ComposeAgent.ts --traits "research,bold,adversarial" --task "Marine biologist" --output json

# Then launch each with their custom prompt (avoid use static agent types):
spawn_agent(prompt=<ComposeAgent output>, subagent_type="general-purpose", model="sonnet")
# {PRINCIPAL.NAME}: "Spin up 5 agents to research these companies"
# {DAIDENTITY.NAME} launches 5 parallel agents:
spawn_agent(prompt="Research Company A...", subagent_type="general-purpose", model="haiku")
spawn_agent(prompt="Research Company B...", subagent_type="general-purpose", model="haiku")
# etc.
```

---

###  WRONG PATTERNS (avoid DO THESE)

```bash
# WRONG: User says "custom agents" but you use a static agent type
spawn_agent(prompt="...", subagent_type="Architect")  # NO - custom agents get "general-purpose"
spawn_agent(prompt="...", subagent_type="Engineer") # NO - custom agents are NOT static types

# WRONG: Describing custom agents as "intern agents" or "architect agents"
"Spinning up 3 intern agents..." # NO - they're CUSTOM agents, not interns

# WRONG: Not using ComposeAgent for custom agents
spawn_agent(prompt="You are Dr. Nova...", subagent_type="general-purpose")
## Expressiveness Philosophy


### Design Principles:

2. **Dramatic Differentiation**: 97% increase in speaking rate range, 54% increase in similarity range, 42% increase in stability range
3. **Extreme Variation**: From chaotic creative (Rook 0.18, Priya 0.20) to measured wisdom (Marcus 0.72, Serena 0.75)

## Usage


1. Edit JSON configuration above
2. Update character descriptions and backstories as personalities evolve

## Version History

- **v1.3.0** (2025-11-16): Centralized in PAI, increased expressiveness for all agents
- **v1.2.1** (2025-11-16): Enhanced DA expressiveness specifically
- **v1.2.0** (2025-11-16): Added character personalities for 5 key agents
- **v1.1.0** (2025-11-16): Initial agent personality system
