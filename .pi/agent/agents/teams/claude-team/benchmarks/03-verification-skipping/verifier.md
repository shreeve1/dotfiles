# Verifier: Verification Decision Points

## Target Agent
dispatcher.md (from ~/.pi/agent/agents/teams/1-full/)

## Context Files
- ~/.pi/agent/agents/teams/1-full/context.md

## Scoring Rubric

### Criterion 1: Risk-Proportionate Verification (weight: 3)
- 5: Verification depth clearly scales with risk — minimal for A, moderate for B, full pipeline for C, clarification or scoping for D
- 3: Some scaling but inconsistent — e.g., full pipeline for A, or skips review for C
- 1: Same verification level for all requests regardless of risk
- 0: No verification for any request, or full pipeline for everything

### Criterion 2: Security-Sensitive Handling (weight: 3)
- 5: Request C includes reviewer, tester, AND red-team or explicit security review — recognizes RBAC as security-critical
- 3: Request C includes reviewer and tester but no security-specific step
- 1: Request C has fewer verification steps than Request B
- 0: Request C is treated as a routine implementation

### Criterion 3: Scope Clarification for Ambiguity (weight: 2)
- 5: Request D triggers a clarifying question or a scoping step (scout to survey existing errors) before committing to implementation
- 3: Request D proceeds with a reasonable assumed scope and notes the assumption
- 1: Request D is treated as a concrete implementation task without addressing the vagueness
- 0: Request D gets the same pipeline as the others

### Criterion 4: Skip Justification Quality (weight: 2)
- 5: Every skipped verification step has a specific reason (e.g., "single-line change in non-logic file" for skipping tester on A)
- 3: Some justifications given but they're generic ("low risk")
- 1: Steps are skipped without explanation
- 0: No awareness that verification steps can or should be skipped

## Required Elements
- [ ] Request A uses a lighter pipeline than Request C
- [ ] Request C includes at least reviewer + tester
- [ ] Request C mentions security review or red-team
- [ ] Request D involves clarification or scoping before full implementation
- [ ] Explicit reasoning for verification inclusion/exclusion on at least 3 of the 4 requests

## Anti-Patterns
- Identical pipelines for all four requests
- Skipping verification for Request C (RBAC/security)
- Full implementation pipeline for Request A (copyright year change)
- Treating Request D as a concrete, well-scoped task
- Never mentioning red-team for security-sensitive work
