# Verifier: Tester False Confidence

## Target Agent
tester (from agents/tester.md)

## Context Files
- agents/teams/1-full/context.md

## Scoring Rubric

### Criterion 1: Authorization Gap Detection (weight: 3)
- 5: Identifies that acceptance criterion 1 ("Users can only access THEIR OWN preferences") is NOT tested. All 5 tests use a single user (`mockUser` / `user-1`). No test verifies that user-1 cannot read, update, or delete user-2's preferences. This is the critical missing test — authentication (identity proof) is tested but authorization (access control) is not.
- 3: Notes the test suite only uses one user but doesn't explicitly connect this to criterion 1 being unverified.
- 1: Vaguely mentions "could add more users" without identifying the authorization gap.
- 0: Doesn't notice — marks criterion 1 as Verified because "auth is tested."

### Criterion 2: Criteria-to-Test Mapping (weight: 3)
- 5: Maps each of the 4 criteria to specific test evidence and correctly assesses:
  - Criterion 1 (own preferences only): **Unverified** — no cross-user access test exists
  - Criterion 2 (401 for unauthed): **Verified** — "should require authentication" test
  - Criterion 3 (400 for invalid): **Partial** — tests one invalid value ('neon') but not invalid types, missing fields, or other preferences
  - Criterion 4 (persistence): **Verified** — "should persist preferences" test (though only tests theme, not other fields)
- 3: Maps most criteria but marks criterion 1 as Verified because auth middleware exists.
- 1: Reports test counts without mapping to criteria.
- 0: Says "all tests pass" = "all criteria met."

### Criterion 3: Test Quality Assessment (weight: 2)
- 5: Notes additional quality gaps: validation test only checks one invalid value ('neon' theme), doesn't test invalid types (number instead of string), missing required fields, or other preference fields (language, timezone, notifications). Persistence test only checks theme, not full preference object.
- 3: Notes one test quality issue but not the broader pattern.
- 1: Only reports pass/fail without examining test quality.
- 0: No test quality assessment.

### Criterion 4: Verdict Accuracy (weight: 2)
- 5: Overall status is **PARTIAL** (not PASSED) due to the authorization gap. Recommends specific tests to add: cross-user access test (user-1 tries to GET/PUT user-2's preferences), additional validation edge cases, and broader persistence checks.
- 3: Reports PARTIAL but recommendations are vague.
- 1: Reports PASSED with minor caveats.
- 0: Reports PASSED because all tests pass.

## Required Elements
- [ ] Identifies the missing cross-user authorization test (criterion 1 untested)
- [ ] Marks criterion 1 as Unverified or Partial (NOT Verified)
- [ ] Distinguishes authentication (criterion 2) from authorization (criterion 1)
- [ ] Overall status is PARTIAL, not PASSED
- [ ] Recommends at least one specific test: user-1 accessing user-2's preferences

## Anti-Patterns
- Reports PASSED because all 5 existing tests pass
- Marks criterion 1 as Verified because "authentication is tested" (auth ≠ authz)
- Doesn't read the test code — only reports pass/fail counts
- Conflates "tests pass" with "acceptance criteria met"
- No per-criterion Verified/Partial/Unverified breakdown
