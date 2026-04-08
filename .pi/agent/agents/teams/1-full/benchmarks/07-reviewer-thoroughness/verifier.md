# Verifier: Reviewing a Plan with Subtle Issues

## Target Agent
reviewer.md (from ~/.pi/agent/agents/)

## Context Files
- ~/.pi/agent/agents/teams/1-full/context.md

## Scoring Rubric

### Criterion 1: Issue Detection Depth (weight: 3)
- 5: Identifies at least 4 of these issues: (a) no cache invalidation for DELETE endpoint, (b) no handling of Redis connection failure/fallback, (c) no cache invalidation for admin updates or other mutation paths, (d) validation commands are too vague (just "npm test"), (e) no consideration of cache stampede/thundering herd, (f) serialization format not specified, (g) no monitoring or cache hit/miss metrics
- 3: Identifies 2-3 of the listed issues
- 1: Identifies only 1 issue or only surface-level formatting concerns
- 0: Finds no issues or only praises the plan

### Criterion 2: Severity Classification (weight: 2)
- 5: Issues are clearly categorized (Critical/Important/Minor) with appropriate severity — cache invalidation gaps are Critical or Important, metrics are Minor
- 3: Some categorization but severity assignments are inconsistent
- 1: Issues listed without any severity or priority indication
- 0: All issues treated as the same severity

### Criterion 3: Actionable Fix Suggestions (weight: 3)
- 5: Each issue includes a specific, implementable fix — not just "consider caching edge cases" but "add cache invalidation to DELETE /api/users/:id in step [1.3]"
- 3: Most issues include suggestions but some are vague
- 1: Issues identified but no fixes suggested
- 0: Neither issues nor fixes

### Criterion 4: Feasibility Verification (weight: 2)
- 5: Checks that referenced files exist, that redis.ts is actually used for sessions as claimed, that the PUT handler exists for cache invalidation, and that npm test is sufficient validation
- 3: Some feasibility checking but not comprehensive
- 1: Accepts all file references and commands at face value
- 0: No feasibility consideration

## Required Elements
- [ ] Identifies missing cache invalidation for DELETE operations
- [ ] Identifies missing Redis failure/fallback handling
- [ ] Notes that validation commands are insufficient (just "npm test")
- [ ] Provides at least one specific, implementable fix
- [ ] Uses severity categories (Critical/Important/Minor or equivalent)
- [ ] Provides a clear verdict (safe to build / needs fixes)

## Anti-Patterns
- "Plan looks good, safe to build" without identifying any issues
- Identifying only formatting or style issues while missing logical gaps
- Listing issues without any suggested fixes
- Not checking whether referenced files would actually exist
- Treating all issues as equally severe
