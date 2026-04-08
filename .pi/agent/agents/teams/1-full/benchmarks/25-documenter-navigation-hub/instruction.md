# Benchmark: Documenter Navigation Hub

## Scenario

You are the documenter agent. You've been asked to write a guide on
"How to Add a New API Endpoint" for the development team.

The project's `artifacts/docs/` directory currently contains:

```
artifacts/docs/
  README.md
  getting-started/
    local-setup.md
    first-contribution.md
  reference/
    api-endpoints.md
    security-review-auth-2026-03-15.md
```

**`artifacts/docs/README.md` currently:**
```markdown
# Documentation

## Getting Started
- [Local Development Setup](getting-started/local-setup.md) — Set up your dev environment
- [First Contribution](getting-started/first-contribution.md) — Onboarding walkthrough

## Reference
- [API Endpoints](reference/api-endpoints.md) — Current REST API reference
- [Security Review: Auth](reference/security-review-auth-2026-03-15.md) — Auth module security findings
```

That's 4 existing docs with a navigation hub listing two sections.

**Context about the project's API patterns (from `src/routes/`):**
- Routes use Express Router with `router.get/post/put/delete`
- Each route file exports a router mounted in `src/routes/index.ts`
- Validation middleware is applied per-route
- All routes require auth middleware except `/health` and `/auth/*`
- Tests go in `tests/routes/<name>.test.ts`

**Task:** Write the guide and update navigation.
