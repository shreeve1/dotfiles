---
name: DelegationReference
description: Comprehensive delegation and agent parallelization patterns. Reference material extracted from SKILL.md for on-demand loading.
created: 2025-12-17
extracted_from: SKILL.md lines 535-627
---

# Delegation & Parallelization Reference

**Quick reference in SKILL.md** → For full details, see this file

---

## 🤝 Delegation & Parallelization (Always Active)

**WHENEVER A TASK CAN BE PARALLELIZED, USE MULTIPLE AGENTS!**

### Context Preservation for Agents (CRITICAL FOR SPEED)

**Use subagents to keep the primary context clean.** Broad searches, exploratory reads, research retrieval, browser diagnostics, and verification output should happen in isolated worker contexts when possible.

OpenCode subagents have models configured in their agent definitions. Do not pass a per-call `model` argument unless the active Task tool schema exposes it in the current environment.

**Routing Matrix:**

| Task Type | Subagent | Why |
|-----------|----------|-----|
| Broad codebase exploration, quick file discovery | `explorer` | Keeps search noise out of primary context |
| Focused implementation packet | `pai-engineer` | Bounded code work with TDD discipline |
| Deep multi-file implementation at E3+ | `forge` | GPT-family producer for completeness |
| Architecture/design/specification | `pai-architect` | Strategic planning in isolated context |
| Post-change verification | `validator` | Independent acceptance check |
| Research/current-source work | researcher agents | Keeps source retrieval out of primary context |

**Rule of Thumb:**
- If it is broad exploration → `explorer`
- If it is focused implementation → `pai-engineer`
- If it is verification → `validator`
- If it needs current sources → researcher agents
- If it is multi-file production-grade coding at E3+ → `forge`

### Agent Types

**Default for parallel work: Custom agents via Agents skill (ComposeAgent).**

Use the Agents skill to compose task-specific agents with unique traits, voices, and expertise:
- Use a SINGLE message with MULTIPLE Task tool calls
- Each agent gets FULL CONTEXT and DETAILED INSTRUCTIONS via ComposeAgent prompt
- Launch as many as needed (no artificial limit)
- **ALWAYS launch a spotcheck agent after parallel work completes**

**Agent routing by task type:**
- **Research tasks** → Use the Research skill (has dedicated researcher agents)
- **Code implementation** → Use `pai-engineer`
- **Architecture/design** → Use `pai-architect`
- **Everything else** → Use Agents skill → ComposeAgent → `subagent_type: "general"`

### 🚨 AGENT ROUTING (Always Active)

**Two COMPLETELY Different Systems — custom agents vs agent teams:**

| User Says | System | Tool | What Happens |
|-------------|--------|------|-------------|
| "**custom agents**", "spin up agents", "launch agents" | **Agents Skill** (ComposeAgent) | `Task(subagent_type="general", prompt=<ComposeAgent output>)` | Unique personalities, voices, colors via trait composition |
| "**create an agent team**", "**agent team**", "**swarm**" | **OpenCode agent orchestration** | `Task` subagents plus shared ISA/todo state | Persistent team with shared criteria, message coordination, multi-turn collaboration |

**These are NOT the same thing:**
- **Custom agents** = one-shot parallel workers with unique identities, launched via `Task()`, no shared state
- **Agent teams** = runtime-dependent coordinated teams when team tools exist; otherwise use parallel `Task(...)` calls and reconcile in the primary context

**Additional routing by task type:**

| User Says | What to Use | Why |
|-------------|-------------|-----|
| "**custom agents**", "spin up **custom** agents" | **ComposeAgent** → `general` | Unique prompts, unique voices |
| "spin up agents", "bunch of agents", "launch agents" | **ComposeAgent** → `general` | Task-specific agents with proper expertise |
| "research X", "investigate Y" | **Research skill** | Dedicated researcher agents |
| Code implementation tasks | **`pai-engineer`** | Specialized for TDD/code |
| Architecture/design tasks | **`pai-architect`** | Specialized for system design |

**For ALL parallel work:**
1. Invoke the Agents skill → ComposeAgent for EACH agent with appropriate traits
2. Use DIFFERENT trait combinations to get unique voices and expertise
3. Launch with the full ComposeAgent-generated prompt as `subagent_type: "general"`
4. Each agent gets a personality-matched ElevenLabs voice

**For research specifically:** Use the Research skill, which has dedicated researcher agents (`claude-researcher`, `gemini-researcher`, `perplexity-researcher`, `grok-researcher`, etc.)

**Reference:** Agents skill (`~/.config/opencode/skills/Agents/SKILL.md`)

**Full Context Requirements:**
When delegating, ALWAYS include:
1. WHY this task matters (business context)
2. WHAT the current state is (existing implementation)
3. EXACTLY what to do (precise actions, file paths, patterns)
4. SUCCESS CRITERIA (what output should look like)
5. TIMING SCOPE (fast|standard|deep) — controls agent output verbosity

### Timing Scope in Agent Prompts

Every agent prompt MUST include a `## Scope` section that matches the validated timing tier from the Algorithm's THINK phase. This prevents agents from over-producing on simple tasks or under-delivering on complex ones.

**Timing Scope:**

| Timing | Agent Output | Example |
|--------|--------------|---------|
| **fast** | <500 words, direct answer | "Check if server is running" |
| **standard** | <1500 words, focused work | "Implement login validation" |
| **deep** | No limit, thorough analysis | "Comprehensive security audit" |

**Examples:**

```typescript
// FAST — simple check, minimal output
Task({
  prompt: `Check if the auth middleware exports are correct.
## Scope
Timing: FAST — direct answer only.
- Under 500 words
- Answer the question, report the result, done`,
  subagent_type: "explorer"
})

// STANDARD — typical implementation work
Task({
  prompt: `Implement input validation for the login form.
## Scope
Timing: STANDARD — focused implementation.
- Under 1500 words
- Stay on task, deliver the work, verify it works`,
  subagent_type: "pai-engineer"
})

// DEEP — comprehensive analysis
Task({
  prompt: `Perform a thorough security review of all auth flows.
## Scope
Timing: DEEP — comprehensive analysis.
- No word limit
- Explore alternatives, consider edge cases
- Thorough verification and documentation`,
  subagent_type: "devtools-inspector"
})
```

---

**See Also:**
- SKILL.md > Delegation (Quick Reference) - Condensed trigger table
- Workflows/Delegation.md - Operational delegation procedures
- Workflows/BackgroundDelegation.md - Background agent patterns
- skills/Agents/SKILL.md - Custom agent creation system
