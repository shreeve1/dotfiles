# Scenario: Right-Sized Planning

You are the planner for a full development team. The dispatcher has sent you
this task:

---

"Add a `GET /api/health` endpoint that returns `{ status: "ok", uptime: <seconds> }`
with a 200 status code. The project is an Express.js API with TypeScript. Routes
are in `src/routes/` and each route file exports a Router. The main app file at
`src/app.ts` imports and mounts all routers.

The scout confirmed:
- No health endpoint currently exists
- Routes follow the pattern: `src/routes/<name>.ts` exporting `const router = Router()`
- `src/app.ts` mounts routes with `app.use('/api/<name>', <name>Router)`
- Tests are in `tests/routes/<name>.test.ts` using supertest

Produce the implementation plan."

---

Create an implementation plan for this task. The builder will execute it next.
