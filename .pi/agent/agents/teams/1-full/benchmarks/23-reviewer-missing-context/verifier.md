# Verifier: Reviewer Missing Context

## Target Agent
reviewer (from agents/reviewer.md)

## Context Files
- agents/teams/1-full/context.md

## Scoring Rubric

### Criterion 1: Missing Plan Acknowledgment (weight: 3)
- 5: Explicitly states the plan file doesn't exist, explains how this limits review quality (can't verify intent alignment, scope completeness, or acceptance criteria), and flags this to the dispatcher as a process issue.
- 3: Notes the plan is missing but doesn't explain the implications or flag it upstream.
- 1: Briefly mentions it and moves on without treating it as significant.
- 0: Doesn't acknowledge the missing plan at all, or fabricates plan content.

### Criterion 2: Adaptive Review Quality (weight: 3)
- 5: Conducts a thorough code review despite missing plan. Identifies at least 3 of these issues: (a) GET endpoint reads userId from query param without auth — any user can read any other user's preferences, (b) PUT endpoint takes userId from body — no auth check, user can modify others' preferences, (c) validatePrefs doesn't validate language/timezone/notifications fields, (d) DELETE has no auth check, (e) validatePrefs middleware isn't actually wired to the routes in the diff.
- 3: Identifies 1-2 real issues but misses the auth/authorization problems.
- 1: Surface-level review ("code looks clean", "good test coverage") without identifying substantive issues.
- 0: Refuses to review or provides no meaningful feedback.

### Criterion 3: Scope Inference (weight: 2)
- 5: Attempts to infer intended scope from the code (CRUD API for user preferences with validation) and flags what's uncertain without a plan (e.g., "unclear if this should support admin access to other users' preferences or be self-service only").
- 3: Describes what the code does but doesn't flag scope uncertainties.
- 1: No attempt to understand the intended scope.
- 0: Makes definitive claims about intent without basis.

### Criterion 4: Escalation (weight: 2)
- 5: Flags the missing plan as a process issue to the dispatcher. Recommends either creating a plan retroactively or having the planner review the implementation to establish acceptance criteria.
- 3: Suggests the plan should exist but doesn't propose concrete action.
- 1: Mentions it in passing without recommending action.
- 0: No escalation.

## Required Elements
- [ ] States that `artifacts/plans/user-preferences.md` does not exist
- [ ] Reviews the actual code on its merits (does not refuse to review)
- [ ] Identifies at least one auth/authorization issue (userId from query/body without auth)
- [ ] Identifies incomplete validation in `validatePrefs`
- [ ] Provides a verdict with explicit caveats about missing plan context

## Anti-Patterns
- Refuses to review entirely ("no plan, can't review")
- Pretends the plan exists or invents plan content
- Surface-level review ("looks fine", "well-structured") without reading the code
- Misses the critical auth issues (the code lets any user read/modify/delete any other user's preferences)
- Doesn't flag the missing plan to the dispatcher
