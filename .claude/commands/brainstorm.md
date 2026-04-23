---
name: brainstorm
description: Use when exploring ideas, solving problems creatively, or planning new features. Triggers on 'brainstorm', 'explore ideas', 'need ideas', 'what if', 'how might we', 'creative thinking', 'ideate', or when user wants generative exploration before committing to implementation. Combines project context with parallel web research.
argument-hint: "[topic] [optional-project-path]"
model: sonnet
---

# Brainstorm

An interactive brainstorming session that combines project understanding with parallel web research to generate high-quality ideas.

## Variables

TOPIC: $1 — The brainstorming topic or question to explore
PROJECT_PATH: $2 — Optional path to a local project to review for context

## Pre-flight

1. **Verify required input:**
   - If no TOPIC provided, use AskUserQuestion: "What topic would you like to brainstorm?"
   - Options can include common brainstorming themes or let user type their own

2. **Verify project path:**
   - If PROJECT_PATH provided but doesn't exist, ask user to correct the path

3. **Ensure artifact directory exists:**
   ```bash
   mkdir -p artifacts/brainstorming/
   ```

## Instructions

### Phase 1: Project Review (if PROJECT_PATH provided)

If the user provided a project path, perform a comprehensive review:

1. **Explore the codebase** using the Explore agent to understand:
   - Architecture and structure (how is it organized?)
   - Technical stack (languages, frameworks, dependencies)
   - Pain points and gaps (what's missing, incomplete, or problematic?)
   - Opportunities and strengths (what's working well? where can we build?)

2. **Summarize findings** in a brief overview covering:
   - What the project does
   - Key architectural decisions
   - Notable patterns or approaches
   - Areas that could benefit from improvement

If no project path provided, skip to Phase 2.

### Phase 2: Understand the User's Question

Before generating research angles, use the **AskUserQuestion tool** to clarify the user's intent interactively.

1. **Restate understanding** first as text: "Based on your topic, it sounds like you want to explore [interpretation]."

2. **Use AskUserQuestion** to gather context with 2-4 focused questions. Example:

```
AskUserQuestion with questions like:
- "What's driving this question?" with options: ["Solving a specific problem", "Exploring an opportunity", "General curiosity/learning", "Planning a new project"]
- "What constraints matter most?" with options: ["Time/speed to implement", "Budget/cost", "Technical complexity", "Team size/skills"]
- "What does success look like?" with options: ["Working prototype", "Strategic direction", "List of options to evaluate", "Detailed implementation plan"]
```

3. **Adapt follow-up questions** based on responses. Use AskUserQuestion again if needed to clarify focus areas.

Keep this brief (1-2 AskUserQuestion calls max) - gather enough context to make research targeted, then move on.

### Phase 3: Generate Research Angles

Based on TOPIC, project context, AND clarified user intent, generate 5 distinct research angles. These should be:

- **Diverse**: Cover different perspectives (technical, user, market, innovation, best practices)
- **Specific**: Focused enough to yield actionable insights
- **Relevant**: Directly tied to the brainstorming topic AND user's stated priorities
- **Informed**: Shaped by what you learned in Phases 1 and 2

Present the 5 angles to the user and use **AskUserQuestion** for approval:

```
AskUserQuestion:
- question: "I've identified these 5 research angles. How should I proceed?"
- options: ["Looks good, proceed with research", "I want to adjust some angles", "Add a specific angle I have in mind", "Reduce to 3 most important angles"]
```

If user wants changes, adjust based on their feedback and confirm before proceeding.

### Phase 4: Parallel Research

Spawn 5 sub-agents in parallel using the Task tool with `subagent_type: general-purpose`. Each agent should:

1. Perform web searches on their assigned angle
2. Synthesize findings into 3-5 key insights
3. Note any surprising discoveries or contrarian viewpoints

**Critical**: Launch all 5 agents in a SINGLE message with multiple Task tool calls to maximize parallelism.

Example agent prompt structure:
```
Research the following angle for a brainstorming session about [TOPIC]:

Angle: [specific research angle]

Context: [brief project/topic context]

Instructions:
1. Use WebSearch to find relevant information
2. Synthesize into 3-5 key insights
3. Note any surprising or contrarian findings
4. Keep response concise - bullet points preferred

Return your findings in this format:
## [Angle Name]
- Insight 1
- Insight 2
- Insight 3
**Surprising finding:** [if any]
```

### Phase 5: Synthesize Research

Once all agents complete, consolidate findings into a unified briefing:

```
## Research Briefing: [TOPIC]

### Key Themes
- [Theme 1 across multiple angles]
- [Theme 2]
- [Theme 3]

### Notable Insights
- [Most actionable insight 1]
- [Most actionable insight 2]
- [Most actionable insight 3]

### Contrarian or Surprising Perspectives
- [Anything that challenges assumptions]

### Research Gaps
- [What we didn't find but might matter]
```

### Phase 6: Interactive Brainstorming

Now engage in highly interactive, free-form exploration using **AskUserQuestion** to keep momentum:

1. **Seed the conversation** with 2-3 initial ideas inspired by the research

2. **Use AskUserQuestion for structured exploration**:
   ```
   AskUserQuestion:
   - question: "Which direction resonates most with you?"
   - options: [Idea A summary, Idea B summary, Idea C summary, "None of these - let me share my own"]
   ```

3. **Follow up with probing questions** using AskUserQuestion:
   - "What if we approached this from [angle]?" with concrete options
   - "Does [insight] change how you think about this?" with Yes/No/Partially options
   - Use multiSelect: true when exploring constraints or priorities

4. **Build on user responses** - riff on their ideas, combine concepts, explore tangents

5. **Synthesize periodically** with AskUserQuestion:
   ```
   AskUserQuestion:
   - question: "We've explored X, Y, Z - which direction should we dig deeper into?"
   - options: [Direction 1, Direction 2, Direction 3, "Let's wrap up and summarize"]
   ```

Maintain an energetic, collaborative tone. The goal is generative exploration, not convergence.

### Phase 7: Wrap-Up

When the user signals they're done (or conversation naturally winds down):

1. **Summarize key ideas** that emerged

2. **Use AskUserQuestion** for wrap-up preferences:
   ```
   AskUserQuestion:
   - question: "How would you like to capture this brainstorming session?"
   - options: ["Save full summary as markdown", "Extract action items only", "Both summary and action items", "No file needed - we're done"]
   ```

If saving, create a markdown file:
- Location: `artifacts/brainstorming/`
- Filename: `brainstorm-[topic-slug]-[date].md`
- Content: Key ideas, themes explored, potential next steps

After saving, provide a wrap-up summary:

```
✅ Brainstorming Session Complete

**Topic:** <topic>
**File:** artifacts/brainstorming/<filename>.md

**Key Ideas Generated:**
- <idea 1>
- <idea 2>
- <idea 3>

**Next Steps:**
- Ready to act on these ideas? Run `/dev-plan artifacts/brainstorming/<filename>.md` to create an implementation plan
- Need formal requirements? Run `/dev-prd` to create a PRD from your brainstorming
- Want to explore further? Continue the conversation to dig deeper
```

## Interaction Guidelines

- **Be interactive**: Use the AskUserQuestion tool for structured decisions and choices - don't just output questions as text
- **Be curious**: Ask follow-up questions, don't just accept surface answers
- **Be generative**: Offer multiple variations, "what about...", "or alternatively..."
- **Be flexible**: Follow interesting tangents, don't force structure
- **Be concise**: Keep individual responses focused, avoid walls of text
- **Be collaborative**: This is a dialogue, not a presentation

## AskUserQuestion Best Practices

- Use for decision points, not open-ended exploration
- Provide 2-4 concrete options that cover the realistic choices
- Include an "Other" escape hatch option when appropriate (the tool adds this automatically)
- Use `multiSelect: true` when asking about priorities or constraints where multiple can apply
- Keep option labels short (1-5 words) with descriptions for context
- Don't overuse - balance structured questions with free-form text responses

