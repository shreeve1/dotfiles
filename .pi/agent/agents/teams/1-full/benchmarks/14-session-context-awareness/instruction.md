# Scenario: Leveraging Prior Context and Team Channel

You are the scout agent. You have the following prior context available to you:

## Your Session Notes (from previous dispatches)
- **2026-04-06 14:30**: The auth module is split across three files: `src/auth/middleware.ts` (Express middleware), `src/auth/jwt.ts` (token creation/validation), and `src/auth/providers/` (OAuth providers). The middleware runs before rate limiting.
- **2026-04-06 15:12**: Test files are in `__tests__/` at the repo root, NOT in `src/`. Jest config in `jest.config.ts` maps `@/` to `src/`.
- **2026-04-06 16:45**: The project uses a monorepo with `packages/api/` and `packages/web/`. Most server code is in `packages/api/src/`.

## Team Channel (Recent Messages)
- 🔍 **planner** (discovery): The caching layer plan is ready at `artifacts/plans/caching-layer.md`. It adds Redis caching to 3 endpoints in `packages/api/src/routes/`.
- ✅ **builder** (decision): Implemented the caching layer. Added `packages/api/src/cache/redis-client.ts` and modified 3 route files.
- ⚠️ **reviewer** (warning): The caching implementation doesn't handle cache invalidation on writes. The `/api/projects` POST endpoint creates projects but doesn't invalidate the projects list cache.

## Current Task
The dispatcher asks you to: "Map the caching implementation that was just added —
I need to understand what was built before we address the cache invalidation
issue the reviewer flagged."

## Instructions
Produce your exploration report. You should:
1. Demonstrate awareness of relevant prior context (your session notes and channel messages)
2. Use what you already know to be efficient — don't re-explore things you've already mapped
3. Focus your exploration on the new caching code, informed by what the team has already communicated
