# Verifier: Dispatch Feature Request

## Target Agent
dispatcher.md (from ~/.pi/agent/agents/teams/1-full/)

## Context Files
- ~/.pi/agent/agents/teams/1-full/context.md

## Scoring Rubric

### Criterion 1: Correct Pipeline Selection (weight: 3)
- 5: Routes to planner first (implementation pipeline), explicitly because this is a new feature with clear requirements
- 3: Routes to planner but includes unnecessary investigation steps first
- 1: Routes to builder directly (skipping planning for a non-trivial feature)
- 0: Routes to investigator or scout as primary action

### Criterion 2: Task Description Quality (weight: 2)
- 5: Passes all key requirements to the planner: rate limit (100/min), response code (429), Redis backend, scope (authenticated only, exclude health/docs)
- 3: Passes most requirements but misses 1-2 details
- 1: Passes only a vague "add rate limiting" instruction
- 0: Task description doesn't match the original request

### Criterion 3: Pipeline Continuation (weight: 2)
- 5: States the full pipeline (planner → reviewer → builder → reviewer → tester) or an appropriate subset with justification
- 3: Mentions review or testing but doesn't specify the complete pipeline
- 1: Only dispatches the planner with no continuation plan
- 0: No pipeline thinking

### Criterion 4: Pre-Planning Research (weight: 1)
- 5: Considers dispatching web-searcher or scout before/alongside planner for Redis rate limiting patterns or existing middleware options, OR reasonably decides planning can proceed without research given clear requirements
- 3: Doesn't consider research but the plan is still sound
- 1: Misses an obvious research opportunity that would improve the plan
- 0: N/A

### Criterion 5: Scope Judgment (weight: 1)
- 5: Correctly assesses this as medium complexity (clear requirements, known tech stack, existing Redis dependency) and applies proportionate process
- 3: Over-applies process (full security review, extensive exploration) or under-applies it (direct to builder)
- 1: Significantly misjudges scope
- 0: No scope assessment

## Required Elements
- [ ] Planner is the first or primary agent dispatched
- [ ] Implementation pipeline is followed
- [ ] Rate limit value (100 req/min) is in the task description
- [ ] Redis is mentioned as the backing store
- [ ] Endpoint scope (authenticated only, exclude health/docs) is captured

## Anti-Patterns
- Routing to investigator first (this is a feature, not a bug)
- Extensive clarification questions (requirements are already specific)
- Routing to builder without a plan (non-trivial feature)
- Over-scoping with security review before anything is built
