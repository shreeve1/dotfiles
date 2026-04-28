# SpawnParallelAgents Workflow

**Launches multiple parallel agents for grunt work - same task, different inputs.**

## When to Use

{PRINCIPAL.NAME} says:
- "Launch 5 agents to research these companies"
- "Spin up agents to process this list"
- "Create agents to analyze these files" (no "custom")

**KEY: No "custom" keyword = simple parallel workers for grunt work (fast execution)**


## The Workflow

### Step 1: Identify spawn_agent List

Extract what needs to be done in parallel:
- List of companies to research
- Files to analyze
- URLs to check
- Data points to investigate

### Step 2: Create spawn_agent-Specific Prompts

**Each agent gets a DETAILED prompt with FULL CONTEXT and TIMING SCOPE:**

```typescript
const agent1Prompt = `
## Context
We're researching competitors in the AI security space for strategic planning.

## Current State
We have 10 companies identified. You're analyzing Company A.

## spawn_agent
1. Research Company A's recent product launches (last 6 months)
2. Identify their target market and positioning
3. Note any key partnerships or acquisitions
4. Assess their technical approach

## Success Criteria
- Specific product names and launch dates
- Clear target market definition
- List of partnerships with dates
- Technical stack/approach summary

## Scope
Timing: STANDARD - focused implementation.
- Under 1500 words
- Stay on task, minimal tangents
- Deliver the work, verify it works

Company A: Acme AI Security Corp
`;
```

### Step 3: Launch ALL Agents in SINGLE Message

**CRITICAL: Use ONE message with MULTIPLE spawn_agent calls for true parallel execution:**

```typescript
// Send as a SINGLE message with all spawn_agent calls:
spawn_agent({
  description: "Research Company A",
  prompt: agent1Prompt,
  subagent_type: "general-purpose",
  model: "haiku"  // or "sonnet" depending on complexity
})
spawn_agent({
  description: "Research Company B",
  prompt: agent2Prompt,
  subagent_type: "general-purpose",
  model: "haiku"
})
spawn_agent({
  description: "Research Company C",
  prompt: agent3Prompt,
  subagent_type: "general-purpose",
  model: "haiku"
})
// ... up to N agents
```

**All agents run simultaneously and return results together.**

## Timing & Model Selection

**Timing flows from the Algorithm.** The main agent validates a timing tier (fast|standard|deep) in the THINK phase. Every agent prompt should include a `## Scope` section:

| Timing | Model | Scope |
|--------|-------|-------|
| `fast` | `haiku` | Under 500 words, direct answer only |
| `standard` | `sonnet` | Focused work, under 1500 words |
| `deep` | `opus` | Comprehensive analysis, no limit |

**Choose model based on timing tier AND task complexity:**

| spawn_agent Type | Model | Reason |
|-----------|-------|--------|
| Simple checks (URL validation, file existence, basic lookups) | `haiku` | 10-20x faster, more than sufficient |
| Standard research/analysis (company research, code review) | `sonnet` | Balanced capability and speed |
| Deep reasoning (strategic analysis, architectural decisions) | `opus` | Maximum intelligence required |

**Parallel execution especially benefits from `haiku` - spawning 10 haiku agents is both faster AND cheaper than 1 opus agent doing sequential work.**

## Example: Research 5 Companies

**{PRINCIPAL.NAME}:** "Launch agents to research these 5 AI security companies"

**{DAIDENTITY.NAME}'s Execution:**
```typescript
// Single message with 5 spawn_agent calls:
spawn_agent({
  description: "Research Acme AI Security",
  prompt: "Research Acme AI Security Corp: products, market, partnerships, tech stack",
  subagent_type: "general-purpose",
  model: "sonnet"
})
spawn_agent({
  description: "Research Bolt Security AI",
  prompt: "Research Bolt Security AI: products, market, partnerships, tech stack",
  subagent_type: "general-purpose",
  model: "sonnet"
})
spawn_agent({
  description: "Research Cipher AI Defense",
  prompt: "Research Cipher AI Defense: products, market, partnerships, tech stack",
  subagent_type: "general-purpose",
  model: "sonnet"
})
spawn_agent({
  description: "Research Delta Threat Intel",
  prompt: "Research Delta Threat Intelligence: products, market, partnerships, tech stack",
  subagent_type: "general-purpose",
  model: "sonnet"
})
spawn_agent({
  description: "Research Echo AI Protection",
  prompt: "Research Echo AI Protection Systems: products, market, partnerships, tech stack",
  subagent_type: "general-purpose",
  model: "sonnet"
})

// After results return, spotcheck:
spawn_agent({
  description: "Spotcheck company research",
  prompt: "Review these 5 company research results for consistency and gaps: [results]",
  subagent_type: "general-purpose",
  model: "haiku"
})
```

**Result:** 5 agents research in parallel, spotcheck validates consistency.

## Common Patterns

### Pattern 1: List Processing

**Input:** List of items (companies, files, URLs, people)
**Action:** Create one agent per item, identical task structure
**Model:** `haiku` for simple tasks, `sonnet` for analysis

```typescript
const items = ["Item1", "Item2", "Item3", "Item4", "Item5"];

// Single message with all agents:
items.forEach(item => {
  spawn_agent({
    description: `Process ${item}`,
    prompt: `Analyze ${item} for: [criteria]`,
    subagent_type: "general-purpose",
    model: "haiku"
  });
});
```

### Pattern 2: Multi-File Analysis

**Input:** Multiple files to analyze
**Action:** One agent per file, same analysis criteria
**Model:** `sonnet` for code analysis, `haiku` for simple checks

```typescript
const files = ["src/auth.ts", "src/db.ts", "src/api.ts"];

// Single message:
files.forEach(file => {
  spawn_agent({
    description: `Analyze ${file}`,
    prompt: `Review ${file} for security issues, focusing on: [checklist]`,
    subagent_type: "general-purpose",
    model: "sonnet"
  });
});
```

### Pattern 3: Data Point Investigation

**Input:** Multiple data points/questions
**Action:** One agent per question, independent research
**Model:** `sonnet` for research, `haiku` for fact-checking

```typescript
const questions = [
  "What is OpenAI's current revenue?",
  "How many employees does Anthropic have?",
  "What's Google's AI chip roadmap?",
  "When is GPT-5 releasing?",
  "What's the latest on AI regulation in EU?"
];

// Single message:
questions.forEach(q => {
  spawn_agent({
    description: `Research: ${q}`,
    prompt: `Find reliable answer to: ${q}. Include sources.`,
    subagent_type: "general-purpose",
    model: "haiku"
  });
});
```

## Common Mistakes to Avoid

** WRONG: Sequential execution**
```typescript
await spawn_agent({ ... }); // Agent 1 (blocks)
await spawn_agent({ ... }); // Agent 2 (waits for 1)
await spawn_agent({ ... }); // Agent 3 (waits for 2)
// Takes 3x as long!
```

** RIGHT: Parallel execution**
```typescript
// Send ONE message with multiple spawn_agent calls:
spawn_agent({ ... })  // Agent 1
spawn_agent({ ... })  // Agent 2
spawn_agent({ ... })  // Agent 3
// All run simultaneously
```

** WRONG: Using the deprecated Intern agent type**
```typescript
// Intern type has been removed from the system
spawn_agent({
  description: "Research X",
  prompt: "Research X and report findings",
  subagent_type: "Intern",  // DOES NOT EXIST - removed from system
  model: "haiku"
})
```

** RIGHT: Use general-purpose agents or agents composed via ComposeAgent**
```typescript
// For simple parallel work, use general-purpose type
spawn_agent({
  description: "Research X",
  prompt: "Research X and report findings",
  subagent_type: "general-purpose",
  model: "haiku"
})
// For specialized parallel work, compose a custom agent first via ComposeAgent
// or use a specialized type like "Engineer", "Architect", etc.
```

** WRONG: Skipping spotcheck**
```typescript
// Launch agents, get results, done
// No validation = potential inconsistencies
```

** RIGHT: Always spotcheck**
```typescript
// Launch agents
// Get results
// Spotcheck for consistency
// THEN report as complete
```

** WRONG: Using opus for simple parallel tasks**
```typescript
// Each agent uses opus = slow + expensive
spawn_agent({ ..., model: "opus" })
spawn_agent({ ..., model: "opus" })
spawn_agent({ ..., model: "opus" })
```

** RIGHT: Use haiku for grunt work**
```typescript
// 10-20x faster, sufficient for simple tasks
spawn_agent({ ..., model: "haiku" })
spawn_agent({ ..., model: "haiku" })
spawn_agent({ ..., model: "haiku" })
```

## When to Use Custom Agents Instead

Use **CreateCustomAgent workflow** when:
- User says "custom agents" (the key trigger)
- You need distinct personalities/perspectives
- Different analytical approaches required
- Each agent brings unique expertise

Use **SpawnParallelAgents workflow** when:
- Simple parallel processing (no "custom" keyword)
- Same task, different inputs
- Speed matters more than personality
- Identity diversity not needed

## Related Workflows

- **ListTraits** - Show available traits for custom agents

## References

- Agent personalities: `.codex/pai/skills/Agents/AgentPersonalities.md`
