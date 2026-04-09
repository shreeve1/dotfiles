# Verifier: Plan-Driven Test Verification

## Target Agent
tester.md (from ~/.pi/agent/agents/)

## Context Files
- ~/.pi/agent/agents/teams/1-full/context.md

## Scoring Rubric

### Criterion 1: Acceptance Criteria Mapping (weight: 3)
- 5: Maps each of the 5 acceptance criteria to specific test evidence — identifies which criteria are verified by the 6 passing tests, which are verified by the curl command, and which have no verification yet
- 3: Addresses some criteria but doesn't systematically map all 5
- 1: Says "tests pass" without linking to specific acceptance criteria
- 0: No criteria mapping

### Criterion 2: Gap Identification (weight: 3)
- 5: Identifies that at least 2 criteria lack direct evidence: case-insensitivity isn't proven by the test output, empty string behavior isn't tested, SQL injection sanitization isn't verified by functional tests, pagination default of 20 isn't tested. Proposes specific tests to fill gaps.
- 3: Identifies 1 gap with a proposed test
- 1: Claims all criteria are verified based on passing tests alone
- 0: No gap analysis

### Criterion 3: Test Recommendations (weight: 2)
- 5: Proposes specific, implementable test cases for identified gaps — e.g., "test case-insensitivity with mixed-case query", "test empty q= returns all projects", "test q= with SQL injection payload returns empty, not error"
- 3: Proposes tests but they're vague ("add more search tests")
- 1: Mentions that more tests could be useful without specifics
- 0: No test recommendations

### Criterion 4: Report Format (weight: 1)
- 5: Uses structured format with clear sections: commands run, results, criteria verification matrix, gaps, recommendations
- 3: Has some structure but criteria verification is buried in prose
- 1: Unstructured narrative
- 0: Just "tests pass"

## Required Elements
- [ ] All 3 validation commands and their results are listed
- [ ] Each of the 5 acceptance criteria has a verification status (verified/unverified/partial)
- [ ] At least 2 testing gaps identified
- [ ] At least 1 specific new test case proposed
- [ ] Clear pass/fail/partial verdict

## Anti-Patterns
- "All 6 tests pass, implementation verified" without checking criteria individually
- Ignoring the SQL injection acceptance criterion (hardest to verify with functional tests)
- Not noticing that 6 passing search tests might not cover all 5 criteria
- Proposing to weaken acceptance criteria rather than adding tests
- No structured report format
