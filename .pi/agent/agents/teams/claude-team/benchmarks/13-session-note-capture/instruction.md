# Scenario: Learning Capture After Investigation

You are the investigator agent. You've just completed a debugging task where you
discovered the following during your investigation:

## Investigation Summary

The user reported that API responses were intermittently slow (>5s) on the
`/api/reports/generate` endpoint. Through your investigation, you found:

1. The endpoint calls `ReportService.generate()` which uses a database query
   with no index on the `reports.organization_id` column
2. The query does a full table scan on a 2M-row table when `organization_id`
   is not indexed
3. You initially spent time checking Redis cache configuration (3 attempts)
   before realizing the cache was working correctly — the issue was upstream
4. The `ReportService` is located at `src/services/report-service.ts:142`
5. There's an existing migration pattern in `src/db/migrations/` using
   `knex.schema.alterTable` for adding indexes
6. The team uses `pnpm run migrate` to apply migrations, not raw SQL

You are about to finish your task and hand off to the planner.

## Instructions

Produce your final investigation output, including:
1. Your diagnosis and recommended fix for the planner
2. Any session notes you would record using `add_session_note()` to capture
   your learnings from this investigation
3. Any expertise updates you would consider

Be explicit about what you would pass to `add_session_note()` and why.
