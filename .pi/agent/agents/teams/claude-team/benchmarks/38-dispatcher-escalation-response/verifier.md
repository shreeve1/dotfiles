# Verifier: Dispatcher Escalation Response

## Target Agent
dispatcher (from agents/teams/1-full/dispatcher.md)

## Context Files
- agents/teams/1-full/context.md

## Scoring Rubric

### Criterion 1: Priority Shift (weight: 3)
- 5: Immediately drops the feature request and pivots to the security fix. Explicitly deprioritizes the planner's in-progress work. Does NOT say "let the planner finish first" or try to combine the security fix with the feature request. Treats this as a separate, higher-priority emergency.
- 3: Pivots to security but doesn't explicitly deprioritize the feature work (leaves it ambiguous).
- 1: Acknowledges the urgency but tries to combine both tasks.
- 0: Continues with the feature request or asks the user to wait.

### Criterion 2: Proportional Pipeline (weight: 3)
- 5: Routes the security fix through a fast but safe pipeline. The core fix is replacing `Math.random()` with `crypto.randomBytes()` — a 1-2 line change in one file. Should dispatch builder directly (or builder → red-team at most). Does NOT run through a full planner → reviewer → builder → reviewer → tester pipeline for what is essentially a single line change. But DOES include some verification — at minimum tester or red-team to confirm the fix.
- 3: Includes verification but over-engineers the pipeline (e.g., planner before builder for a known 1-line fix).
- 1: Dispatches only builder with no verification on a security-critical change.
- 0: Full heavyweight pipeline or no dispatch at all.

### Criterion 3: Incident Awareness (weight: 2)
- 5: Acknowledges this is an active exploit (not just a vulnerability). May suggest interim mitigation while the fix is being built: rate-limiting the reset endpoint, temporarily disabling password reset, adding account lockout after failed attempts. Shows awareness that every minute matters.
- 3: Treats it as urgent but doesn't suggest interim mitigation.
- 1: Treats it as a normal high-priority bug without incident awareness.
- 0: No urgency in the response.

### Criterion 4: Feature Request Handling (weight: 2)
- 5: Explicitly addresses the in-progress planner work: pauses it, notes it will resume after the security fix, or explains how the security fix changes the feature plan (the forgot-password flow should use the new secure token generation). Clean handoff.
- 3: Mentions the feature request will resume "later" without specifics.
- 1: Ignores the in-progress work entirely.
- 0: Tries to continue both in parallel.

## Required Elements
- [ ] Immediately pivots to the security fix (drops the feature request)
- [ ] Does NOT combine the security fix with the feature request
- [ ] Dispatches builder for the fix (known change, known file)
- [ ] Includes at least one verification agent (tester or red-team)
- [ ] Acknowledges active exploitation urgency
- [ ] Addresses what happens to the in-progress planner work

## Anti-Patterns
- Lets the planner finish the feature plan before addressing the security issue
- Runs a full planner → reviewer → builder → reviewer → tester pipeline for a 1-line fix
- Combines the security fix and feature request into one task
- Dispatches builder with zero verification on a security-critical change
- No interim mitigation suggestion (endpoint is being exploited NOW)
- Ignores the active exploitation ("we should fix this soon")
