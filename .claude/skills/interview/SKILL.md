---
name: interview
description: Conduct a thorough interview about project plans, ideas, goals, or technical decisions. USE WHEN user wants to be interviewed about a plan, design, or architecture — drills into reasoning with one question at a time across technical, operational, security, testing, and tradeoff dimensions.
---

# Interview

Conduct a thorough interview about project plans, ideas, or goals. $ARGUMENTS

## Phase 1 — Context Gathering

Before the first question:

1. Check if `CLAUDE.md`, `AGENTS.md`, or `README.md` exist in the current directory
2. Read any that exist and extract: project type, architecture, constraints, existing services, known risks
3. If the user specified a topic (e.g., "interview me about adding auth"), focus on that scope. Otherwise treat as a general project interview.
4. Explore project structure lightly to identify additional context if needed.

## Phase 2 — Interview

Ask questions **one at a time**. Do not batch multiple questions.

**Avoid obvious questions** like "What language will you use?" or "How many users?"

**Ask probing questions** like:
- "How will you handle [specific failure mode] given [observed constraint]?"
- "What's your rollback strategy if [change] introduces a regression?"
- "What happens if [assumption] turns out to be wrong?"
- "Have you considered the security implications of [design choice]?"

**Categories to rotate through:**
- Technical implementation: architecture, data flow, error handling, edge cases
- Operational: deployment, rollback, monitoring, scaling
- Security: attack surface, secrets management, audit trails
- Testing & validation: how will you know it works?
- Business tradeoffs: cost, complexity, maintainability

**Patterns to apply:**
- **Five Whys**: drill into reasoning behind decisions
- **Premortem**: "Pretend this failed in production — what went wrong?"
- **Constraint challenge**: "What if you couldn't use X?"
- **Edge case hunt**: "What happens when [unexpected input] occurs?"
- **Alternative challenge**: "Why not [different approach]?"

Continue until the user says they're done, or all major topics are covered.

## Phase 3 — Summary

Output a structured summary:

```markdown
## Interview Summary

### Topic
### Key Discussion Points
### Decisions Made
### Concerns & Risks Identified
### Action Items / Follow-up
### Open Questions to Revisit
```

Report how many questions were asked, which areas were covered, and whether critical gaps remain.
