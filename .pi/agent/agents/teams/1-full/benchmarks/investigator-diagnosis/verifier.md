# Verifier: Investigator Diagnosis

## Target Agent
investigator.md (from agents/full/)

## Context Files
context.md (from teams/1-full/)

## Scoring Rubric

### Criterion 1: Root Cause Identification (weight: 3)
The actual root cause has two parts:
(a) PR #247 modified the default scope on order.model.ts, which changed what findOrders() returns — breaking existing tests that depended on the old default scope
(b) The CI environment doesn't reseed the database between test suites, so the order history tests (which create new records) pollute the shared state for existing order tests

- 5: Identifies BOTH the default scope change AND the CI shared state / test isolation issue
- 4: Identifies one root cause clearly and mentions the other as a possibility
- 3: Identifies one root cause but misses the other entirely
- 1: Vaguely points at PR #247 without specific mechanism
- 0: Wrong root cause or no diagnosis

### Criterion 2: Evidence-Based Reasoning (weight: 3)
- 5: Connects each piece of evidence to the diagnosis: pagination returns 0 (scope change), TypeError on createdAt (model association change), permission test returning 200 (scope removing permission filter), local-vs-CI difference (seeding difference)
- 3: Uses some evidence but doesn't connect all symptoms to the root cause
- 1: States a root cause without referencing the provided evidence
- 0: Ignores the evidence entirely

### Criterion 3: Systematic Approach (weight: 2)
- 5: Follows a structured diagnostic method — gathers symptoms, forms hypotheses, tests hypotheses against evidence, narrows to root cause
- 3: Reasonable approach but jumps to conclusions without exhausting hypotheses
- 1: Ad-hoc analysis without clear methodology
- 0: No visible diagnostic method

### Criterion 4: Stops at Diagnosis (weight: 1)
- 5: Clearly stops at diagnosis as instructed — presents root cause and evidence, does NOT propose code changes or a fix plan
- 3: Mostly stops at diagnosis but includes minor fix suggestions
- 1: Produces a full fix plan despite being told to stop at diagnosis
- 0: Skips diagnosis and jumps directly to fixing

### Criterion 5: Reporting Clarity (weight: 1)
- 5: Clear, structured report with: confirmed root cause, evidence chain, affected files/lines, confidence level
- 3: Report is understandable but not well-structured
- 1: Disorganized or hard to follow
- 0: No clear report structure

## Required Elements
- [ ] Identifies the default scope change in order.model.ts as a contributing factor
- [ ] Identifies the CI vs local environment difference (database seeding)
- [ ] References specific test failures and connects them to the root cause
- [ ] References PR #247 and the specific files it changed
- [ ] Does NOT include a fix plan (instruction said diagnosis only)

## Anti-Patterns
- Blaming "flaky tests" without identifying the specific mechanism
- Suggesting "just rerun the CI pipeline" without root cause
- Proposing a fix instead of stopping at diagnosis
- Ignoring the local-vs-CI environment difference (it's a key clue)
- Focusing only on the test file and not the source code changes
