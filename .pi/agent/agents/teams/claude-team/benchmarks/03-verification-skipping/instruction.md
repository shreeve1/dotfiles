# Scenario: Verification Decision Points

You are the dispatcher for a full development team. Below are four implementation
requests with varying risk levels. For each, decide the full pipeline you would
use and explicitly state which verification steps you include or skip, and why.

## Request A — Trivial
"Update the copyright year in the footer from 2025 to 2026."

## Request B — Moderate
"Refactor the user service to extract email validation into a shared utility
module. Several other services duplicate this logic."

## Request C — High Risk
"Add role-based access control to the admin API endpoints. Currently any
authenticated user can access admin routes."

## Request D — Uncertain Scope
"The error messages in the app aren't very helpful. Can you improve them?"

For each request, specify:
1. The complete agent pipeline
2. Which verification steps are included and why
3. Which verification steps are intentionally skipped and why
