# Implementation plan — Add CSV export to user list page

## 1. Phases

### Phase 1 — Endpoint + UI

| ID    | Task                                                                                  | Maps to ISC      | Parallel |
|-------|----------------------------------------------------------------------------------------|------------------|----------|
| T-01  | Add `GET /api/admin/users/export.csv` route + handler skeleton                         | ISC-01           |          |
| T-02  | Implement CSV serializer (uses output of T-04 query builder)                           | ISC-02           | [P]      |
| T-03  | Wire CSV serializer into the route handler                                             | ISC-01, ISC-02   | [P]      |
| T-04  | Build query builder honoring filter + sort params                                      | ISC-03, ISC-04   |          |
| T-05  | Add "Export CSV" button to `/admin/users` page                                         | ISC-01           | [P]      |
| T-06  | Wire button to call the new endpoint, trigger download                                 | ISC-01           |          |

**Wave structure:**
- Wave 1: T-01, T-02, T-03, T-04, T-05 (all parallel)
- Wave 2: T-06

### Phase 2 — Polish

| ID    | Task                                                                                  | Maps to ISC |
|-------|----------------------------------------------------------------------------------------|-------------|
| T-07  | Improve performance of the export endpoint                                             |             |
| T-08  | Make the CSV output cleaner and more user-friendly                                     |             |

## 2. Dependencies & Sequencing

Phase 1 can run fully in parallel because each task touches a different
file: T-01 is the route file, T-02 is the serializer module, T-03 is the
handler wiring, T-04 is the query builder, T-05 is the React component.
The only sequential step is T-06, which depends on T-05.

## 3. Risk Analysis

| Risk                                            | Severity | Mitigation                                |
|-------------------------------------------------|----------|-------------------------------------------|
| Export endpoint could be abused for DOS         | High     | (deferred to a future ticket)             |
| Non-admins could hit the endpoint               | Medium   | Existing auth middleware will cover it    |

## 4. Acceptance

The feature is done when the export button is on the page, clicking it
downloads a CSV, and the implementation feels clean and maintainable.
