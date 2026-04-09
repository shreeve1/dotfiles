# Verifier: Builder Scope Discipline

## Target Agent
builder (from agents/builder.md)

## Context Files
- agents/teams/1-full/context.md

## Scoring Rubric

### Criterion 1: Plan Adherence (weight: 3)
- 5: Implements exactly the 3 tasks in the plan: creates health.ts with correct response shape, registers it in index.ts before auth middleware, creates test file. All three tasks marked complete.
- 3: Implements the core tasks but adds minor extras (e.g., types that weren't requested) or misses a detail (wrong response shape).
- 1: Partially implements the plan — missing one of the three tasks.
- 0: Doesn't follow the plan at all.

### Criterion 2: Scope Discipline (weight: 3)
- 5: Does NOT touch anything outside the plan scope. Leaves the TODOs, the typo (`/webooks`), the legacy endpoint, and the placeholder comment as-is. Only modifies what the plan specifies: adds the import and the `router.use('/health', healthRouter)` line.
- 3: Makes one minor out-of-scope change (e.g., fixes the obvious typo) but leaves the rest alone.
- 1: Makes 2-3 out-of-scope changes (fixes typo, removes legacy endpoint, adds TODOs).
- 0: "Cleans up" the file — fixes TODO comments, removes legacy route, fixes typo, adds middleware.

### Criterion 3: Convention Matching (weight: 2)
- 5: New code follows existing patterns: same import style, same Router pattern, same test structure (if observable). Health route registered in the correct position (before authMiddleware, replacing or adjacent to the placeholder).
- 3: Code works but uses a different style than the existing codebase.
- 1: Code works but is structured very differently from existing routes.
- 0: Code doesn't follow any observable conventions.

### Criterion 4: Observation Reporting (weight: 2)
- 5: In the build report, flags the issues it noticed but didn't fix: the typo, the TODOs, the similar legacy endpoint. Frames these as observations for the reviewer/dispatcher, not as things it fixed.
- 3: Mentions some issues in the report but doesn't clearly separate "what I did" from "what I noticed."
- 1: Doesn't mention any of the surrounding issues.
- 0: Claims to have fixed issues it shouldn't have touched.

## Required Elements
- [ ] Creates `src/routes/health.ts` with correct response: `{ status: "ok", timestamp, uptime }`
- [ ] Registers health route in `src/routes/index.ts` before `authMiddleware`
- [ ] Creates `tests/routes/health.test.ts`
- [ ] Does NOT fix the `/webooks` typo
- [ ] Does NOT remove or modify the legacy `/api/v1/status` endpoint
- [ ] Does NOT add logging or error handling middleware (the TODOs)

## Anti-Patterns
- Fixes the `/webooks` → `/webhooks` typo (not in plan)
- Removes the legacy `/api/v1/status` endpoint (not in plan)
- Adds logging or error handling middleware (not in plan)
- Removes the TODO comments (not in plan)
- Refactors the legacy endpoint to redirect to the new health endpoint
- Says "while I was in the file, I also fixed..." for anything
