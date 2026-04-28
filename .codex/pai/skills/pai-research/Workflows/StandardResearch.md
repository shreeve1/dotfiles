# Standard Research Workflow

**Mode:** 2 different researcher types, 1 query each | **Timeout:** 1 minute

##  CRITICAL: URL Verification Required

**BEFORE delivering any research results with URLs:**
1. Verify EVERY URL using web access or curl
2. Confirm the content matches what you're citing
3. avoid include unverified URLs - research agents HALLUCINATE URLs
4. A single broken link is a CATASTROPHIC FAILURE

See `SKILL.md` for full URL Verification Protocol.

## When to Use

- Default mode for most research requests
- User says "do research" or "research this"
- Need multiple perspectives quickly

## Workflow

### Step 1: Craft One Query Per Researcher

Create ONE focused query optimized for each researcher's strengths:
- **Codex**: Academic depth, detailed analysis, scholarly sources
- **Gemini**: Multi-perspective synthesis, cross-domain connections

### Step 2: Launch 2 Agents in Parallel (1 of each type)

**SINGLE message with 2 spawn_agent calls:**

```typescript
spawn_agent({
  subagent_type: "ClaudeResearcher",
  description: "[topic] analysis",
  prompt: "Do ONE search for: [query optimized for depth/analysis]. Return findings immediately."
})

spawn_agent({
  subagent_type: "GeminiResearcher",
  description: "[topic] perspectives",
  prompt: "Do ONE search for: [query optimized for breadth/perspectives]. Return findings immediately."
})
```

**Each agent:**
- Gets ONE query
- Does ONE search
- Returns immediately

### Step 3: Quick Synthesis

Combine the two perspectives:
- Note where they agree (high confidence)
- Note unique contributions from each
- Flag any conflicts

### Step 4: VERIFY ALL URLs (important)

**Before delivering results, verify EVERY URL:**

```bash
# For each URL returned by agents:
# Must return 200

# Then verify content:
web access(url, "Confirm article exists and summarize main point")
# Must return actual content, not error
```

**If URL fails verification:**
- Remove it from results
- Find alternative source via web search
- Verify the replacement URL
- avoid include unverified URLs

### Step 5: Return Results

```markdown
 SUMMARY: Research on [topic]
 ANALYSIS: [Key findings from 2 perspectives]
 ACTIONS: 2 researchers  1 query each
 RESULTS: [Synthesized answer]
 STATUS: Standard mode - 2 agents, 1 query each
 CAPTURE: [Key facts]
 NEXT: [Suggest extensive if more depth needed]
 STORY EXPLANATION: [5-8 numbered points]
 COMPLETED: Research on [topic] complete
```

## Speed Target

~15-30 seconds for results
