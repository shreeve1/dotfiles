# CreateCustomAgent Workflow


## When to Use

{PRINCIPAL.NAME} says:
- "Create custom agents to do X"
- "Spin up custom agents for Y"
- "I need specialized agents with Z expertise"
- "Generate N custom agents to analyze..."

**KEY TRIGGER: The word "custom" means truly unique agents - NOT static types (Architect, Engineer, etc.) - always use `general-purpose` with ComposeAgent prompts.**

## The Workflow

### Step 1: Determine Agent Count & Requirements

Extract from {PRINCIPAL.NAME}'s request:
- How many agents? (Default: 1 if not specified)
- What's the task?
- Are specific traits mentioned? (security, legal, skeptical, thorough, etc.)

### Step 2: For EACH Agent, Run ComposeAgent with DIFFERENT Traits


```bash
# Example for 3 custom research agents:

# Agent 1 - Enthusiastic Explorer
bun run .codex/pai/skills/Agents/Tools/ComposeAgent.ts \
  --traits "research,enthusiastic,exploratory" \
  --task "Research quantum computing applications" \
  --output json

# Agent 2 - Skeptical Analyst
bun run .codex/pai/skills/Agents/Tools/ComposeAgent.ts \
  --traits "research,skeptical,systematic" \
  --task "Research quantum computing applications" \
  --output json

# Agent 3 - Thorough Synthesizer
bun run .codex/pai/skills/Agents/Tools/ComposeAgent.ts \
  --traits "research,analytical,synthesizing" \
  --task "Research quantum computing applications" \
  --output json
```

### Step 4: Launch Agents with spawn_agent Tool

**Use a SINGLE message with MULTIPLE spawn_agent calls for parallel execution.**

**CRITICAL: Use `subagent_type: "general-purpose"` - avoid use static types like "Architect" or "Engineer" for custom agents.**

```typescript
// Send all in ONE message:
spawn_agent({
  description: "Research agent 1 - enthusiastic",
  prompt: <agent1_full_prompt>,
  subagent_type: "general-purpose",
  model: "sonnet"  // or "haiku" for speed
})
spawn_agent({
  description: "Research agent 2 - skeptical",
  prompt: <agent2_full_prompt>,
  subagent_type: "general-purpose",
  model: "sonnet"
})
spawn_agent({
  description: "Research agent 3 - analytical",
  prompt: <agent3_full_prompt>,
  subagent_type: "general-purpose",
  model: "sonnet"
})
```


### Step 6: Spotcheck (Optional but Recommended)

After all agents complete, launch one more to verify consistency:

```typescript
spawn_agent({
  description: "Spotcheck custom agent results",
  prompt: "Review these results for consistency and completeness: [results]",
  subagent_type: "general-purpose",
  model: "haiku"
})
```

## Trait Variation Strategies


**For Research Tasks:**
- Agent 1: research + enthusiastic + exploratory -> Jeremy (energetic)
- Agent 2: research + skeptical + thorough -> George (intellectual)
- Agent 3: research + analytical + systematic -> Drew (professional)
- Agent 4: research + creative + bold -> Fin (charismatic)
- Agent 5: research + empathetic + synthesizing -> Thomas (gentle)

**For Security Analysis:**
- Agent 1: security + adversarial + bold -> Callum (edgy hacker)
- Agent 2: security + skeptical + meticulous -> Sam (gritty authentic)
- Agent 3: security + cautious + systematic -> Bill (trustworthy)

**For Business Strategy:**
- Agent 1: business + bold + rapid -> Domi (assertive CEO)
- Agent 2: business + analytical + comparative -> Drew (balanced news)
- Agent 3: business + pragmatic + consultative -> Charlie (casual laid-back)

## Timing & Model Selection

**Timing flows from the Algorithm.** The main agent validates a timing tier (fast|standard|deep) and passes it to ComposeAgent via `--timing`:

```bash
# Pass timing to ComposeAgent for automatic scope in agent prompt:
bun run ComposeAgent.ts --traits "research,enthusiastic" --task "Quick status check" --timing fast --output json
bun run ComposeAgent.ts --traits "security,thorough" --task "Full security audit" --timing deep --output json
```

If `--timing` is omitted, agents get no scope section (backward compatible).

| Timing | Model | Agent Output |
|--------|-------|-------------|
| `fast` | `haiku` | Under 500 words, direct answer |
| `standard` | `sonnet` | Focused work, under 1500 words |
| `deep` | `opus` | Comprehensive analysis, no limit |

**Parallel custom agents benefit from `sonnet` or `haiku` for speed.**

## Example Execution

**{PRINCIPAL.NAME}:** "Create 5 custom science agents to analyze this climate data"

**{DAIDENTITY.NAME}'s Internal Execution:**
```bash
# Agent 1 - Climate Science Enthusiast
bun run ComposeAgent.ts --traits "research,enthusiastic,thorough" --task "Analyze climate data patterns" --output json
# Agent 2 - Skeptical Data Analyst
bun run ComposeAgent.ts --traits "data,skeptical,systematic" --task "Analyze climate data patterns" --output json
# Agent 3 - Creative Pattern Finder
bun run ComposeAgent.ts --traits "data,creative,exploratory" --task "Analyze climate data patterns" --output json
# Agent 4 - Meticulous Validator
bun run ComposeAgent.ts --traits "research,meticulous,comparative" --task "Analyze climate data patterns" --output json
# Agent 5 - Synthesizing Strategist
bun run ComposeAgent.ts --traits "research,analytical,synthesizing" --task "Analyze climate data patterns" --output json
# Launch all 5 in parallel (single message, 5 spawn_agent calls)
## Related Workflows

- **ListTraits** - Show available traits for composition

## References

- Trait definitions: `.codex/pai/skills/Agents/Data/Traits.yaml`
- Agent template: `.codex/pai/skills/Agents/Templates/DynamicAgent.hbs`
- ComposeAgent tool: `.codex/pai/skills/Agents/Tools/ComposeAgent.ts`
