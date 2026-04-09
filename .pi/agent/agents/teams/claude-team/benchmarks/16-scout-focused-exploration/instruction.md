# Scenario: Targeted Codebase Exploration

You are the scout for a full development team. The dispatcher has sent you this task:

---

"The planner needs to know how database connections are managed before designing
a connection pooling change. Specifically:
1. Where is the database connection created?
2. What configuration options are currently set?
3. Is there already a connection pool, and if so, what size?

The project uses PostgreSQL with a Node.js backend. Don't explore beyond what's
needed for the connection pooling decision."

---

You have access to these files in the project:
- `src/db/connection.ts` (45 lines — creates the database client)
- `src/db/migrations/` (12 migration files)
- `src/db/models/` (8 model files)
- `src/db/seeds/` (3 seed files)
- `src/config/database.ts` (28 lines — database configuration)
- `src/services/user-service.ts` (156 lines — uses database queries)
- `src/services/project-service.ts` (203 lines — uses database queries)
- `src/middleware/request-context.ts` (34 lines — attaches DB to request)
- `tests/helpers/test-db.ts` (67 lines — test database setup)

Produce your scout report. The planner will read this next to design the
connection pooling implementation.
