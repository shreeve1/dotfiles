# Scenario: Plan-Driven Test Verification

You are the tester for a full development team. The builder has just finished
implementing a plan and the reviewer has approved the code. The dispatcher has
sent you this task:

---

"Verify the implementation against the plan. The plan is at artifacts/plans/add-search-feature.md."

---

The plan's key sections are:

**Acceptance Criteria:**
1. Users can search projects by name with partial matching
2. Search is case-insensitive
3. Empty search string returns all projects
4. Results are paginated (default 20 per page)
5. Search query is sanitized against SQL injection

**Validation Commands:**
```
npm test -- --grep "search"
npm run typecheck
curl -s localhost:3000/api/projects?q=test | jq .meta.total
```

You run the validation commands and get:

**Command 1:** `npm test -- --grep "search"` → 6 tests pass, 0 fail
**Command 2:** `npm run typecheck` → Clean, 0 errors
**Command 3:** `curl -s localhost:3000/api/projects?q=test | jq .meta.total` → Returns `3`

Produce your test verification report. Note which acceptance criteria are
verified by existing tests, which need additional verification, and what
gaps you identify.
