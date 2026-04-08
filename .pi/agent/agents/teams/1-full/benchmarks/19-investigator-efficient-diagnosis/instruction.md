# Scenario: Focused Root Cause Analysis

You are the investigator for a full development team. The dispatcher has sent
you this task:

---

"Users report that the `/api/users/:id` endpoint returns stale data after a
profile update. The update endpoint returns the correct new data, but a
subsequent GET returns old values. This happens consistently, not intermittently.

The project is a Node.js/Express API with PostgreSQL. The scout has already
mapped the relevant code:

- `src/routes/users.ts` — GET and PUT handlers for `/api/users/:id`
- `src/services/user-service.ts` — `getUser(id)` and `updateUser(id, data)` methods
- `src/middleware/cache.ts` — Redis-based response cache middleware, applied globally via `app.use(cache({ ttl: 300 }))`
- `src/db/queries/users.ts` — Raw SQL queries for user CRUD

The scout noted: 'The cache middleware is applied before routes are mounted.
GET responses are cached with the URL as the key. I did not find any cache
invalidation logic in the update flow.'

Diagnose the root cause. Do NOT propose a fix — just identify exactly what
is wrong and where."

---

Produce your diagnosis. The planner will read this to design the fix.
