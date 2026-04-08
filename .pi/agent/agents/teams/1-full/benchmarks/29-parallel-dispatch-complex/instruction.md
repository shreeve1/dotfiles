# Benchmark: Complex Parallel Dispatch

## Scenario

You are the dispatcher. The user says:

> "We need to add OAuth2 login to our app. I want to support Google and GitHub
> providers. Also, I noticed the docs are outdated — the API reference still shows
> the old auth endpoints from before the JWT migration. Can you update those too?"

**Context about the codebase:**
- Auth currently uses JWT with email/password login at `POST /auth/login`
- No OAuth2 integration exists — this is new functionality
- The team has not worked with OAuth2 before (passport.js? next-auth? custom?)
- The project has documentation under `artifacts/docs/reference/api-endpoints.md`
- The docs reference old session-based auth endpoints that were replaced 3 months ago

**This request contains two work streams:**

1. **OAuth2 implementation** — New feature touching auth (security-sensitive).
   Requires: research (unfamiliar tech), planning, implementation, review, testing,
   and mandatory red-team review (auth changes = high-risk).

2. **Documentation update** — Fix outdated API reference.
   Requires: understanding current state (what's wrong), then updating docs.
   Independent of the OAuth2 work — the docs need fixing regardless.

**Available agents:** scout, web-searcher, planner, builder, reviewer, tester,
documenter, red-team, investigator.

**Available tools:** `dispatch(agent, task)`, `dispatch_parallel([{agent, task}, ...])`.

**How do you route this request?**
