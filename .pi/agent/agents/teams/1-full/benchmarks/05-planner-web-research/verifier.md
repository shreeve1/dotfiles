# Verifier: Planning with Best Practices Gap

## Target Agent
planner.md (from ~/.pi/agent/agents/)

## Context Files
- ~/.pi/agent/agents/teams/1-full/context.md

## Scoring Rubric

### Criterion 1: Research Awareness (weight: 3)
- 5: Explicitly identifies that rate limiting best practices, library options, or configuration standards should be researched before finalizing the plan — recommends web-searcher consultation or flags knowledge gaps
- 3: Mentions specific libraries or approaches but acknowledges uncertainty about whether they're current best practice
- 1: Proceeds with a plan using assumed libraries/approaches without noting any knowledge gaps
- 0: Plans a fully custom rate limiting implementation from scratch without considering existing solutions

### Criterion 2: Technical Completeness (weight: 2)
- 5: Plan covers middleware setup, storage backend (Redis vs. in-memory), per-endpoint configuration, different limits for public vs. authenticated, response headers (X-RateLimit-*), and error responses (429)
- 3: Covers the core middleware and storage but misses 2+ of the listed aspects
- 1: Only covers basic middleware setup
- 0: Plan is too vague to implement

### Criterion 3: Codebase Grounding (weight: 2)
- 5: Plan references specific project files (Express app setup, middleware chain, route definitions) and describes where rate limiting hooks into the existing architecture
- 3: Plan describes the general approach but doesn't reference specific project files
- 1: Plan is generic and could apply to any Express project
- 0: Plan contradicts the stated project setup

### Criterion 4: Validation Strategy (weight: 2)
- 5: Includes specific test scenarios (burst requests, per-IP tracking, authenticated vs. public limits, 429 response format) and validation commands
- 3: Includes general testing guidance but not specific scenarios
- 1: Mentions "add tests" without specifics
- 0: No testing or validation strategy

## Required Elements
- [ ] Mentions or recommends researching rate limiting libraries (e.g., express-rate-limit, rate-limiter-flexible)
- [ ] Addresses the Redis availability for distributed rate limiting
- [ ] Distinguishes between public and authenticated endpoint treatment
- [ ] Includes a validation or testing section
- [ ] References at least one specific project file or directory

## Anti-Patterns
- Building rate limiting from scratch without considering established libraries
- Ignoring Redis entirely despite it being available
- Same rate limit configuration for all endpoints regardless of type
- No mention of needing or benefiting from current best practices research
- Plan that could apply to any Express project without codebase-specific details
