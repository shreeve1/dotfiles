---
slug: 2026-01-10_user-export-csv
name: "Add CSV export to user list page"
tier: E3
phase: PLAN
created: 2026-01-10T00:00:00.000Z
---

# Add CSV export to user list page

## Problem

The user list page (`/admin/users`) currently only renders an HTML table.
Admin users have repeatedly asked for a way to export the visible list as
CSV so they can import it into their existing spreadsheet workflow. There
is no current export path.

## Goal

Admin users can click an "Export CSV" button on `/admin/users` and
download a CSV of the currently visible (filtered, sorted) user list.

## Criteria

- [ ] ISC-01: Clicking "Export CSV" downloads a `.csv` file named
  `users-<YYYYMMDD>.csv`.
- [ ] ISC-02: The CSV columns match the visible columns in the same order
  as the on-page table.
- [ ] ISC-03: Filters (search query, role filter, status filter) applied
  in the UI are honored in the export.
- [ ] ISC-04: Sort order applied in the UI is honored in the export.
- [ ] ISC-05: Export of 10,000 rows completes in <5s P95 on production.
- [ ] ISC-06: Export is rate-limited to 10 requests per admin per minute
  to prevent accidental DOS of the DB.
- [ ] ISC-07: Endpoint requires `admin:read` permission; non-admins get
  403.

## Test Strategy

- ISC-01, ISC-02: Playwright E2E click-and-download test.
- ISC-03, ISC-04: Unit test on the query builder, plus E2E test with a
  filter+sort applied.
- ISC-05: Load test on staging with 10k seeded users.
- ISC-06: Integration test against the rate-limit middleware.
- ISC-07: Integration test asserting 403 for non-admin tokens.

## Decisions

- D-01: Server-side generation. We do not stream from the existing API
  + render in browser, because that bypasses the rate-limit and the
  permission gate.
- D-02: New endpoint `GET /api/admin/users/export.csv`, not a query
  parameter on the existing JSON endpoint.

## Changelog

- 2026-01-10: ISA scaffolded.
