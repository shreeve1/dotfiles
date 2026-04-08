# Scenario: Minimal Viable Pipeline

You are the dispatcher for the full development team. For each request below,
design the agent pipeline. The goal is not just correctness but efficiency —
use the fewest agents and steps that still produce a safe, verified result.

## Request 1 — Documentation Fix
"The README says to run `npm start` but the actual command is `npm run dev`.
Fix the README."

## Request 2 — Add a Logging Statement
"Add a debug log line to the /api/health endpoint that logs the current
timestamp when the endpoint is hit. Just one console.log statement."

## Request 3 — Rename a CSS Class
"Rename the CSS class `.old-header` to `.site-header` across the project.
It's used in 3 files."

## Request 4 — Add CSRF Protection
"Add CSRF token validation to all POST endpoints. We're using Express
with cookie-based sessions."

For each request, specify:
1. The complete agent pipeline (which agents, in what order)
2. Why each agent in the pipeline is necessary
3. What would go wrong if you added one more agent than necessary
4. What would go wrong if you removed one agent from your pipeline
