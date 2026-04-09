# Verifier: Complex Parallel Dispatch

## Target Agent
dispatcher (from agents/teams/1-full/dispatcher.md)

## Context Files
- agents/teams/1-full/context.md

## Scoring Rubric

### Criterion 1: Work Stream Separation (weight: 3)
- 5: Clearly identifies two independent work streams (OAuth2 implementation + docs update) and explains why they're independent. Plans each stream separately with its own agent sequence.
- 3: Recognizes both tasks but merges them into a single pipeline or doesn't clearly separate them.
- 1: Treats the entire request as one linear task.
- 0: Ignores one of the two work streams entirely.

### Criterion 2: Parallel Dispatch (weight: 3)
- 5: Uses `dispatch_parallel` for the initial context-gathering phase — launches at least two agents concurrently (e.g., web-searcher for OAuth2 research + scout for docs audit). Explicitly identifies which work can run in parallel vs. must be sequential.
- 3: Identifies opportunities for parallelism but dispatches everything sequentially.
- 1: Mentions parallelism but doesn't use `dispatch_parallel`.
- 0: All dispatches are sequential with no consideration of parallelism.

### Criterion 3: OAuth2 Pipeline Completeness (weight: 2)
- 5: OAuth2 stream includes: web-searcher (research library options) → planner → reviewer → builder → reviewer → tester → red-team. Verification chain is complete and red-team is included as mandatory for auth changes.
- 3: Includes most pipeline stages but skips one critical step (e.g., no reviewer before builder, or missing tester).
- 1: Minimal pipeline (e.g., just planner → builder) without proper verification.
- 0: No coherent pipeline for OAuth2.

### Criterion 4: Security Mandate (weight: 2)
- 5: Explicitly identifies OAuth2 as high-risk (auth-related) and mandates red-team review. States why: new auth flow, external providers, token handling, session security.
- 3: Includes red-team but doesn't explicitly flag the auth-related risk or explain why it's mandatory.
- 1: Mentions security in passing but doesn't include red-team in the pipeline.
- 0: No security consideration despite auth changes.

## Required Elements
- [ ] Identifies at least 2 independent work streams
- [ ] Uses `dispatch_parallel` for initial agents across streams
- [ ] OAuth2 stream includes web-searcher for library research (unfamiliar tech)
- [ ] OAuth2 stream includes red-team (mandatory for auth changes)
- [ ] Docs stream uses scout (or similar exploration) then documenter
- [ ] Does not exceed 6 total dispatches per stream (hard cap)

## Anti-Patterns
- Treats everything as one sequential pipeline (no parallelism)
- Skips web-searcher for OAuth2 (team hasn't worked with OAuth2 before — needs research)
- Skips red-team for OAuth2 (auth changes = mandatory security review per dispatcher rules)
- Dispatches documenter for OAuth2 docs before OAuth2 is implemented (premature)
- Runs all agents sequentially when initial context-gathering can be parallel
