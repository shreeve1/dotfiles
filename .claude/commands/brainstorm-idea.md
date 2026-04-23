---
name: brainstorm-idea
description: Purely creative idea exploration with research and codebase context
argument-hint: "[idea-to-explore] [optional-project-path]"
model: sonnet
---

# Brainstorm Idea

A purely creative idea exploration session - free-form generative thinking with research and codebase context as reference. Unlike `/cc-brainstorm`, this is NOT solution-oriented. It's about expanding on ideas, making connections, and exploring possibilities.

## Variables

IDEA: $1 — The core idea to explore and expand upon
PROJECT_PATH: $2 — Optional path to a local project for context reference

## Checklist

You MUST create a task for each of these items and complete them in order:
1. **Gather context** — use explorer agent to understand codebase if PROJECT_PATH provided
2. **Interview for depth** — invoke interview skill to understand the idea fully
3. **Research exploration** — spawn research agents on emerging directions
4. **Generative riffing** — build on ideas, make connections, explore tangents
5. **Capture session** — save ideas, research findings, and potential directions

## Instructions

IMPORTANT: If no IDEA is provided, ask the user to describe their idea before proceeding.

This command is about **creative exploration**, not solving problems. Think of it as a brainstorming partner that helps you expand on ideas, find connections, and discover new directions through research and conversation.

### Phase 1: Context Gathering (if PROJECT_PATH provided)

If the user provided a project path, use the `explorer` subagent type to get quick context:

Use the Task tool with `subagent_type: explorer` to:
- Understand what the project does
- Identify architecture patterns, tech stack, key features
- Note any obvious pain points or gaps

Goal: Establish a frame of reference for idea exploration - NOT to solve problems or generate solutions.

If no project path provided, skip to Phase 2.

### Phase 2: Interview for Depth

This is where we dig deep into the idea using the `interview` skill.

Use the **Skill tool** to invoke the `interview` skill:
```
Skill: interview
args: about exploring the idea: [IDEA]
```

The interview skill will:
- Read CLAUDE.md if available for project context
- Ask non-obvious, probing questions
- Explore motivations, constraints, edge cases
- Continue until you signal completion

Let the interview run its course - the skill handles the flow.

### Phase 3: Research Exploration

Based on what emerged from the interview, spawn 1-3 research agents using `general-purpose` subagent type.

**Adaptive agent count:**
- 1 agent for simple, focused ideas
- 2-3 agents for complex ideas requiring multiple angles

Research directions should emerge organically from the conversation, not be pre-defined.

Launch agents in parallel (single message with multiple Task tool calls):
```
Task with subagent_type: general-purpose:
Research the following concept for an idea exploration session:

Concept: [what emerged from interview]

Context: [brief project context if any]

Instructions:
1. Use WebSearch to find relevant information
2. Look for similar implementations, innovative approaches, or novel takes on this concept
3. Note any surprising discoveries or contrarian viewpoints
4. Keep response concise - bullet points preferred

Return your findings in this format:
## [Concept/Theme]
- Insight 1
- Insight 2
- Insight 3
**Surprising finding:** [if any]
```

### Phase 4: Generative Riffing

This is the core creative phase - free-form exploration where ideas emerge and evolve.

1. **Seed the conversation** with 2-3 initial ideas inspired by the research and interview

2. **Use AskUserQuestion for structured exploration**:
   ```
   AskUserQuestion:
   - question: "Oh, that's interesting! What if we approached this from [angle]?"
     options: [Direction 1, Direction 2, "That doesn't feel right, let's go another way"]
   - question: "Does [insight] spark any connections?"
     options: ["Yes, it connects to X", "No, doesn't click for me", "It makes me think of something else"]
   ```

3. **Follow interesting tangents** - don't force structure. If something sparks, chase it!

4. **Build on user responses** - riff, combine, explore alternatives
   - "Oh, I like that! What if we took it further..."
   - "Or alternatively, what about..."
   - "Here's another angle on that..."

5. **Make unexpected connections** - that's the whole point!
   - Connect the idea to seemingly unrelated domains
   - Draw parallels to other systems or patterns
   - Flip assumptions on their head

6. **Use multiSelect: true** when exploring multiple possibilities

**Tone Guidelines:**
- **Energetic**: "Oh, that's interesting! What if we..."
- **Collaborative**: Build together, don't present finished ideas
- **Open**: "Or alternatively...", "Here's another angle...", "Have you considered..."
- **Curious**: Always ask "what about..." and "what if..."

**Keep momentum**: Use AskUserQuestion to keep the conversation flowing - don't just output questions as text.

### Phase 5: Capture Session

When the session naturally winds down or you signal completion:

1. Create the output directory:
   ```
   mkdir -p architect/brainstorm-idea
   ```

2. Save the session to: `architect/brainstorm-idea/idea-[slug]-[date].md`

   Slug format: lowercase, hyphens for spaces, no special chars
   Date format: use `date +%Y-%m-%d` command

3. Content format:
   ```markdown
   # Idea Exploration: [IDEA]

   **Date:** [date]

   ## Core Concept
   [Brief description of the original idea]

   ## Context
   [Project context if PROJECT_PATH was provided, otherwise "No project context"]

   ## Interview Highlights
   [Key insights from the interview phase]

   ## Research Findings
   - [Finding 1]
   - [Finding 2]
   - [Surprising discovery if any]

   ## Ideas Explored
   1. [Idea 1 - brief description]
   2. [Idea 2 - brief description]
   3. [Idea 3 - brief description]
   [continue as needed]

   ## Connections Made
   [Unexpected connections between ideas, domains, or concepts]

   ## Promising Directions
   - [Direction 1 - why it's interesting]
   - [Direction 2 - why it's interesting]

   ## Open Questions
   - [Question 1 to explore further]
   - [Question 2 to explore further]
   ```

4. Print the next step for easy copy-paste:
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Saved: architect/brainstorm-idea/idea-[slug]-[date].md

   Next step - brainstorm implementation:
   /brainstorm-code "[idea summary]" /path/to/project
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ```

## Interaction Guidelines

- **Be generative, not directive**: You're exploring possibilities, not prescribing solutions
- **Follow energy**: If something sparks, chase it. If it dies, move on
- **Use AskUserQuestion**: For structured exploration - keeps momentum and gives options
- **Be collaborative**: Build on what the user says, don't just present your own ideas
- **Keep it flowing**: Use short, conversational responses. Walls of text kill creativity
- **Embrace the unexpected**: The best ideas often come from tangents

## Key Differences from `/cc-brainstorm`

| `/cc-brainstorm` | `/cc-brainstorm-idea` |
|---------------|-------------------|
| Solution-oriented | Purely creative |
| 7 structured phases | Free-flowing |
| 5 fixed research angles | 1-3 adaptive agents |
| Uses AskUserQuestion for decisions | Uses interview skill for depth |
| Structured briefing format | Ideas, connections, possibilities |
| Professional tone | Energetic, collaborative |

## What This Is NOT

- NOT a problem-solving session (use `/cc-brainstorm` or `/investigate` for that)
- NOT a requirements gathering exercise (use `/dev-prd` or `/interview` for that)
- NOT a planning session (use `/plan` for that)

This is for: "I have this idea and I want to explore it, expand on it, research it, and see where it goes."
