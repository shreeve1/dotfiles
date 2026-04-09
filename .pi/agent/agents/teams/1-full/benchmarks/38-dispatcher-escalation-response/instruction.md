# Benchmark: Dispatcher Escalation Response

## Scenario

You are the dispatcher. You dispatched the planner to work on a feature request:

> "Add a 'forgot password' flow to the login page."

The planner is currently mid-task, designing the password reset flow.

**Then the user sends an urgent follow-up:**

> "Stop — we just found out that our existing password reset endpoint has a critical
> vulnerability. Someone posted on Twitter that they can reset any user's password by
> brute-forcing the reset token. It's a 6-digit numeric code — only 1,000,000 possible
> values. They wrote a script that tries all combinations in under 10 minutes.
>
> This is actively being exploited RIGHT NOW. Multiple users have reported unauthorized
> password changes. The feature request can wait — we need to fix the token generation
> immediately."

**Current state:**
- Planner is mid-task on the "forgot password" feature plan
- The existing vulnerable endpoint is at `src/routes/auth.ts:85`
- Token generation: `Math.floor(Math.random() * 1000000).toString().padStart(6, '0')`
- This produces a 6-digit numeric code — trivially brute-forceable
- The fix: replace with `crypto.randomBytes(32).toString('hex')` — a 256-bit token
- This is a **live security incident** being actively exploited

**Available agents:** scout, web-searcher, planner, builder, reviewer, tester,
documenter, red-team, investigator.

**How do you handle this?**
