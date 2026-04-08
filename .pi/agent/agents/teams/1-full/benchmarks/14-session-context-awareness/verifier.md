# Verifier: Leveraging Prior Context and Team Channel

## Target Agent
scout.md (from ~/.pi/agent/agents/)

## Context Files
- ~/.pi/agent/agents/teams/1-full/context.md
- ~/.pi/agent/agents/teams/1-full/agent-skills/mental-model.md

## Scoring Rubric

### Criterion 1: Session Note Utilization (weight: 3)
- 5: Explicitly references prior session notes — uses known monorepo structure (packages/api/src/), known test location (__tests__/), or known auth module split to orient the exploration efficiently. Doesn't re-explore already-mapped areas.
- 3: Shows awareness of project structure that could come from session notes but doesn't explicitly reference them or skip already-known areas
- 1: Explores from scratch as if no prior context exists
- 0: Contradicts prior session notes (e.g., looks for tests in src/)

### Criterion 2: Channel Message Integration (weight: 3)
- 5: Directly references the reviewer's cache invalidation warning, the builder's implementation details (redis-client.ts, 3 route files), and/or the planner's plan location. Uses these to focus the exploration on the right files.
- 3: References some channel messages but misses key details (e.g., knows about caching but not the specific files)
- 1: Vague awareness that caching was discussed but doesn't use specific details
- 0: Ignores channel messages entirely, explores as if starting from zero

### Criterion 3: Exploration Efficiency (weight: 2)
- 5: Goes directly to the relevant files mentioned in channel messages (packages/api/src/cache/, the 3 route files) rather than doing a broad codebase scan. Leverages known structure to skip unnecessary exploration.
- 3: Some targeted exploration but also includes unnecessary broad scanning
- 1: Full codebase scan despite having targeted context available
- 0: Unfocused exploration with no strategy

### Criterion 4: Report Completeness for Downstream (weight: 2)
- 5: Report covers what was built (files, patterns), what the cache invalidation gap is, and provides enough detail for the planner to design a fix — all informed by prior context
- 3: Report is complete but doesn't connect findings to the reviewer's warning or prior context
- 1: Report is thin or only partially addresses the task
- 0: Report is unusable for downstream agents

### Criterion 5: New Session Note Recording (weight: 1)
- 5: Records a new session note about the caching implementation specifics discovered during exploration (e.g., cache key patterns, TTL values, which endpoints are cached)
- 3: Mentions recording a note but content is vague
- 1: Doesn't record a note despite learning new codebase-specific information
- 0: No awareness of session note capability

## Required Elements
- [ ] References at least one prior session note explicitly (monorepo structure, test location, or auth split)
- [ ] References the reviewer's cache invalidation warning from the channel
- [ ] References the builder's implementation details (redis-client.ts or route files)
- [ ] Explores `packages/api/src/cache/` or equivalent based on channel context
- [ ] Produces a structured report usable by downstream agents

## Anti-Patterns
- Exploring the entire codebase from scratch despite having targeted context
- Ignoring all channel messages and session notes
- Re-mapping the auth module (already mapped in session notes, not relevant to this task)
- Producing a report that doesn't mention the cache invalidation issue
- Treating the exploration as if this is the first time interacting with this codebase
