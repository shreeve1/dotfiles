# Verifier: Review Flawed Plan

## Target Agent
reviewer.md (from ~/.pi/agent/agents/)

## Context Files
- ~/.pi/agent/agents/teams/1-full/context.md

## Scoring Rubric

### Criterion 1: Critical Issue Detection (weight: 3)
The plan has these critical issues. Score based on how many are caught:
- Dependency order wrong (migration must come before model update and API endpoint)
- No authorization check (any user can modify any user's avatar)
- No file type validation (security: arbitrary file upload)

- 5: Catches all 3 critical issues
- 4: Catches 2 of 3
- 3: Catches 1 of 3
- 1: Catches none of the critical issues
- 0: Doesn't identify any issues at all

### Criterion 2: Important Issue Detection (weight: 2)
The plan has these important issues:
- No file size limit
- S3 credentials/config not addressed
- AWS SDK not in dependency installation
- Acceptance criteria too vague
- Validation commands insufficient (no typecheck, no build)
- [3.3] misorganized under "API Endpoint" instead of "Database"

- 5: Catches 5-6 of these
- 4: Catches 3-4
- 3: Catches 2
- 1: Catches 1
- 0: Catches none

### Criterion 3: Issue Categorization (weight: 2)
- 5: Correctly categorizes findings as Critical / Important / Minor with clear rationale
- 3: Uses severity categories but some misclassification (e.g., authorization as "Minor")
- 1: Lists issues but without severity categorization
- 0: No structure to findings

### Criterion 4: Actionable Fix Suggestions (weight: 2)
- 5: Every finding includes what's wrong, why it matters, and how to fix it
- 3: Most findings include fix suggestions but some are vague
- 1: Identifies problems but doesn't suggest fixes
- 0: No actionable guidance

### Criterion 5: Feasibility Assessment (weight: 1)
- 5: Checks that referenced files could plausibly exist, validates dependency assumptions, confirms the plan is technically executable
- 3: Some feasibility checking but not systematic
- 1: No feasibility assessment
- 0: N/A

### Criterion 6: Verdict Clarity (weight: 1)
- 5: Clear "Safe to build?" verdict (should be "With fixes" or "No") with concise reasoning
- 3: Verdict present but reasoning is vague
- 1: No clear verdict
- 0: Incorrectly says "Yes — safe to build"

## Required Elements
- [ ] Authorization gap is identified (any user can modify any user's avatar)
- [ ] Dependency ordering issue is identified (migration before model/API)
- [ ] File type validation gap is identified
- [ ] Findings are categorized by severity
- [ ] At least one fix suggestion is concrete (not just "fix this")
- [ ] Verdict is NOT "Yes — safe to build" (the plan has critical issues)

## Anti-Patterns
- Approving the plan without catching critical issues
- Only finding minor/cosmetic issues and missing the security gaps
- Listing issues without severity categorization
- Saying "the plan looks good overall" when it has critical security flaws
- Rewriting the entire plan instead of identifying specific issues
