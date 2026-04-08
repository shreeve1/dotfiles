# Verifier: Focused Root Cause Analysis

## Target Agent
investigator.md (from ~/.pi/agent/agents/)

## Context Files
- ~/.pi/agent/agents/teams/1-full/context.md

## Scoring Rubric

### Criterion 1: Diagnosis Speed (weight: 3)
- 5: Identifies the root cause (missing cache invalidation on update) directly from the scout's findings without requesting additional exploration or re-reading files the scout already mapped. The scout gave enough information — the investigator should recognize this and diagnose immediately.
- 3: Reaches the correct diagnosis but first requests or simulates additional exploration (re-reading cache.ts, checking other middleware, looking at database queries) before concluding what the scout already revealed
- 1: Conducts extensive exploration across multiple files before reaching a diagnosis that was available from the scout summary alone
- 0: Fails to identify cache invalidation as the root cause, or proposes multiple competing hypotheses without committing

### Criterion 2: Root Cause Precision (weight: 3)
- 5: Identifies the specific mechanism: (1) cache middleware intercepts GET requests, (2) cached responses keyed by URL, (3) PUT handler updates the database but doesn't invalidate the cache entry for the same URL, (4) subsequent GETs serve the stale cached response. All 4 elements of the causal chain present.
- 3: Identifies "caching problem" with 2–3 elements of the chain but missing one link
- 1: Says "it's a caching issue" without explaining the specific mechanism
- 0: Misidentifies the root cause (e.g., database transaction issues, race condition)

### Criterion 3: Diagnosis Conciseness (weight: 2)
- 5: Diagnosis is ≤20 lines of substantive content. States the root cause, the evidence, and the causal chain without padding, background explanation of how caching works, or exploration of tangential possibilities.
- 3: Diagnosis is 20–40 lines — correct but includes unnecessary background ("Caching is a technique that...") or explores unlikely alternatives before settling on the obvious cause
- 1: Diagnosis exceeds 40 lines with extensive exploration narrative
- 0: Diagnosis is buried in a long exploration log that the planner must parse

### Criterion 4: Actionability for Planner (weight: 2)
- 5: Diagnosis tells the planner exactly which file and which flow needs to change (the PUT handler in users.ts or the cache middleware needs invalidation), plus the cache key pattern so the planner knows what to invalidate. Does NOT propose the fix itself.
- 3: Points to the right area but doesn't specify the cache key pattern or which file is the right place for the fix
- 1: Says "fix the cache" without specifics
- 0: Proposes a full fix instead of just diagnosing (scope creep)

## Required Elements
- [ ] Cache invalidation identified as the root cause
- [ ] cache.ts identified as containing the caching logic
- [ ] The PUT/update flow identified as the location missing invalidation
- [ ] The URL-based cache key pattern noted (explains why same-URL GET serves stale data)
- [ ] Diagnosis does NOT include a fix proposal (stays in diagnostic scope)

## Anti-Patterns
- Re-exploring files the scout already summarized (wasting a prior agent's work)
- Exploring database queries or transaction isolation when the scout already pointed to caching
- Proposing multiple hypotheses when the evidence clearly points to one cause
- Including a "Recommended Fix" section (investigator diagnoses, planner plans)
- Lengthy exploration narrative before reaching an obvious conclusion
