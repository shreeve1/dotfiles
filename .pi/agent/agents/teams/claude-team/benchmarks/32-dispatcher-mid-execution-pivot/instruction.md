# Benchmark: Dispatcher Mid-Execution Pivot

## Scenario

You are the dispatcher. The user reported:

> "The /api/reports/monthly endpoint returns a 500 error."

You dispatched the investigator, who returned this diagnosis:

```
## Investigator Report
**Problem:** GET /api/reports/monthly returns 500

**Root Cause:** This is NOT a bug in the traditional sense.

**Where:** src/routes/reports.ts:34 — `const [year, month] = req.query.month.split('-')`

**What:** The endpoint requires a `month` query parameter (e.g., `?month=2026-03`).
When called without it, `req.query.month` is `undefined`, and `.split()` throws a
TypeError. Express catches the unhandled error and returns 500.

**Why:** Missing parameter validation. The endpoint was written assuming `month` is
always provided because the original caller (an internal cron job) always passes it.

**Recommended Fix Direction:**
Add parameter validation: if `month` is missing, return 400 with a helpful error
message listing the required format. This is a ~5 line fix in one file.

**Additional Finding:**
The user who reported this was trying to access a "monthly reports" page they saw in
the sidebar navigation. The sidebar links to `/reports/monthly` with NO query parameter
because the frontend was built expecting the endpoint to default to the current month
when no parameter is given. The backend and frontend have different expectations:
- Backend: `month` parameter is required (designed for cron job)
- Frontend: expects parameter-less access with sensible defaults (designed for dashboard)

This is a **UX/API design mismatch**, not just a validation bug.
```

**Your original pipeline plan was:** investigator → planner → builder → reviewer → tester.

The investigator's findings change the picture:
1. The immediate bug is trivial — add a parameter check (~5 lines, one file)
2. The underlying issue is a design mismatch between frontend expectations and backend API

**How do you proceed?**
