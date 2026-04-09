# Verifier: Risk-Proportionate Review Depth

## Target Agent
reviewer.md (from ~/.pi/agent/agents/)

## Context Files
- ~/.pi/agent/agents/teams/1-full/context.md

## Scoring Rubric

### Criterion 1: Depth Proportionality (weight: 3)
- 5: Change A gets a brief, focused review (3–8 lines of findings, mostly approval). Change B gets a thorough review with multiple specific findings. The depth difference is clearly visible — not the same template applied to both.
- 3: Some depth difference but Change A is over-reviewed (listing many nitpicks on a 1-line change) or Change B is under-reviewed (just "looks good")
- 1: Both changes receive the same review depth regardless of risk
- 0: Change A gets more scrutiny than Change B

### Criterion 2: Critical Issue Detection in Change B (weight: 3)
- 5: Identifies at least 2 of these issues in Change B: (1) missing migration file for the new column, (2) unique constraint on email doesn't account for soft-deleted users (re-registration blocked), (3) admin/reporting queries may need to see deleted users, (4) other services that query users may not filter by deletedAt
- 3: Identifies 1 critical issue
- 1: Notes something is off but can't articulate the specific issue
- 0: Approves Change B without finding any issues

### Criterion 3: Change A Efficiency (weight: 2)
- 5: Change A review is ≤10 lines of substantive content. Acknowledges the status code improvement (409 is correct for conflict), notes any minor concerns briefly, and approves. Does NOT over-analyze a 1-line error message change.
- 3: Change A review is 10–20 lines — correct but spends time on tangential concerns (test coverage for error messages, i18n considerations)
- 1: Change A review exceeds 20 lines for a 1-line diff
- 0: Change A review is longer than Change B review

### Criterion 4: Actionable Fix Suggestions (weight: 2)
- 5: Every issue found in Change B includes a specific fix (not just "this needs attention" but "add a migration file for the deletedAt column" or "add a compound unique index on (email, deletedAt)")
- 3: Issues identified with general fix direction but not specific enough to act on
- 1: Issues identified without fixes
- 0: No issues found or no fixes suggested

## Required Elements
- [ ] Change A approved (it's a correct, low-risk improvement)
- [ ] Change B has at least 1 Critical finding (missing migration is a deployment blocker)
- [ ] Review for Change A is visibly shorter than review for Change B
- [ ] The missing migration file is identified as an issue in Change B
- [ ] At least one finding about soft-delete's impact on other queries or constraints

## Anti-Patterns
- Same-length review for both changes (template-driven, not risk-driven)
- Nitpicking Change A's wording or suggesting alternative error messages at length
- Approving Change B without noting the missing migration
- Flagging Change A's status code change as risky (409 is standard and correct)
- Reviewing both changes without acknowledging the builder's assumption about ORM schema handling
