# Interview Skill Reference

## Skill Configuration

- **Name**: `interview`
- **Activation Phrase**: "interview me" or "interview me about [topic]"
- **Scope**: General-purpose project planning and design interviews
- **Tools Used**: `AskUserQuestion`, `Read`, `Glob`, `Grep`
- **Context Sources**: `CLAUDE.md`, codebase exploration

## Implementation Guidelines

### 1. Context Gathering Phase

Before starting the interview, always:

1. **Read CLAUDE.md** (if it exists):
   ```bash
   Read file_path: ./CLAUDE.md
   ```
   This provides project context, architecture, constraints, and documentation links.

2. **Explore the codebase** (if needed):
   - Use `Glob` to understand project structure
   - Use `Grep` to find relevant code patterns
   - Use `Read` to examine key files

3. **Identify the interview scope**:
   - General project interview (no specific topic)
   - Feature-specific interview (user mentions a feature/topic)
   - Architecture decision interview
   - Troubleshooting/pre-mortem interview

### 2. Question Generation Strategy

**Avoid** obvious questions like:
- "What programming language will you use?"
- "What framework are you using?"
- "How many users do you expect?"
- "What's the timeline?"

**Ask** probing questions like:
- "How will you handle [failure mode]?"
- "What's your strategy for [edge case]?"
- "What happens if [assumption] is wrong?"
- "How does this approach handle [constraint]?"
- "What are the tradeoffs between [option A] and [option B]?"
- "Have you considered [non-obvious implication]?"
- "How will you test [complex scenario]?"
- "What's your rollback strategy if [change] fails?"

### 3. Question Categories

#### Technical Implementation
- Architecture patterns and design choices
- Technology selection and tradeoffs
- Integration points and dependencies
- Data flow and state management
- Error handling and edge cases

#### Operational Concerns
- Deployment and rollback strategies
- Monitoring and observability
- Performance under load
- Resource utilization and scaling
- Maintenance and updates

#### Security & Reliability
- Security implications of design choices
- Attack surface considerations
- Data protection and privacy
- Failure modes and recovery
- Backup and disaster recovery

#### User Experience
- Edge cases in user workflows
- Performance perceptions
- Error messages and handling
- Accessibility considerations

#### Testing & Validation
- How to test complex scenarios
- Integration testing strategy
- Performance testing approach
- Security validation

#### Business & Requirements
- Alignment with project goals
- Cost implications (infrastructure, time)
- Priority tradeoffs
- Success metrics

### 4. Using the AskUserQuestion Tool

```javascript
AskUserQuestion({
  question: "Your question here?",
  options: ["Option A", "Option B", "Option C", "Let me think about this"]
})
```

**Best practices:**
- Ask one question at a time
- Provide relevant options when appropriate
- Include "I need to think about this" as an option
- Follow up on answers with deeper questions
- Acknowledge good insights

### 5. Interview Flow

```
START
  ↓
Read CLAUDE.md & explore codebase
  ↓
Identify interview scope
  ↓
Ask first question (using AskUserQuestion)
  ↓
Process answer → Ask follow-up or move to next topic
  ↓
Continue until comprehensive coverage
  ↓
User signals completion or no more questions
  ↓
Generate comprehensive summary
  ↓
END
```

### 6. Completion Signals

Stop the interview when:
- User says "that's enough," "we're done," "good enough"
- All major topics have been covered
- User indicates they need to implement before planning more
- Conversation naturally reaches a good stopping point

### 7. Summary Format

At the end, provide:

```markdown
## Interview Summary

### Topic: [What we discussed]

### Key Discussion Points
- [Point 1]
- [Point 2]

### Decisions Made
- [Decision 1]
- [Decision 2]

### Concerns & Risks Identified
- [Concern 1]
- [Concern 2]

### Action Items / Follow-up
- [ ] [Action 1]
- [ ] [Action 2]

### Open Questions to Revisit
- [Question 1]
- [Question 2]
```

## Tips for Effective Interviews

1. **Be Context-Aware**: Use information from CLAUDE.md to ask relevant questions
2. **Think Several Steps Ahead**: Consider second-order effects of decisions
3. **Challenge Assumptions**: Ask "what if the opposite is true?"
4. **Consider Failure Modes**: "What could go wrong?" is often more important than "what could go right?"
5. **Think About Operations**: It's not just about building it, but running it
6. **Security Mindset": Every decision has security implications
7. **Testability**: How will you know it works? How will you test it?
8. **Maintainability**: Will future-you (or someone else) understand this?
9. **Scalability**: What happens when load increases 10x?
10. **Cost**: Not just money, but time, complexity, and technical debt

## Common Interview Patterns

### The "Five Whys" Approach
Keep asking "why?" to dig deeper into the reasoning behind decisions.

### The "Premortem" Approach
"Pretend this has failed in production. What likely went wrong?"

### The "Constraint" Challenge
"What if you couldn't use [technology X]? How would you solve it?"

### The "Edge Case" Hunt
"What happens when [unexpected input/condition] occurs?"

### The "Alternative" Challenge
"Why not [completely different approach]? What's wrong with that?"

## Troubleshooting

**Problem**: Skill doesn't activate
- **Solution**: Ensure you say "interview me" exactly, or use the Skill tool directly

**Problem**: Questions are too generic
- **Solution**: Make sure CLAUDE.md exists and has good project context

**Problem**: Interview feels endless
- **Solution**: User can say "that's enough" to stop at any point

**Problem**: Questions are too obvious
- **Solution**: Deeper questions come from understanding the codebase - explore more files first
