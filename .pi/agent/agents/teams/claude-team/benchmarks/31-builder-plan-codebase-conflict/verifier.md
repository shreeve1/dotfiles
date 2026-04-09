# Verifier: Builder Plan-Codebase Conflict

## Target Agent
builder (from agents/builder.md)

## Context Files
- agents/teams/1-full/context.md

## Scoring Rubric

### Criterion 1: Conflict Detection (weight: 3)
- 5: Identifies that task [1.2] conflicts with the auto-discovery pattern in index.ts. Specifically explains the double-mount bug: adding manual `router.use('/analytics', analyticsRouter)` while auto-discovery also mounts it means the route handles requests twice.
- 3: Notices the auto-discovery pattern and hesitates, but doesn't clearly articulate the double-mount risk.
- 1: Mentions the file uses dynamic loading but proceeds with the manual import anyway.
- 0: Doesn't notice the conflict at all.

### Criterion 2: Resolution Strategy (weight: 3)
- 5: Skips task [1.2] and documents exactly why — the auto-discovery makes manual registration unnecessary and harmful. Still completes [1.1] and [1.3]. Reports the deviation prominently, not buried in a footnote.
- 3: Skips [1.2] but explanation is vague ("wasn't needed") without explaining the double-mount risk.
- 1: Modifies [1.2] to do something different without explaining the original conflict.
- 0: Executes [1.2] as written (causing the double-mount bug) or refuses to proceed with any tasks.

### Criterion 3: Convention Matching (weight: 2)
- 5: Creates `analytics.ts` following the existing pattern — `const router = Router()`, route handlers, `export default router`. Matches the style of users.ts/payments.ts/reports.ts so auto-discovery works correctly.
- 3: Creates a working route file but uses a different export pattern (named export instead of default) that might break auto-discovery.
- 1: Creates the file but with a structure incompatible with auto-discovery.
- 0: Doesn't create the route file.

### Criterion 4: Communication Quality (weight: 2)
- 5: Build report clearly separates what was done from what was skipped and why. Frames the plan-codebase conflict as a finding for the reviewer/dispatcher, not a unilateral decision. Suggests the plan should be updated.
- 3: Reports the deviation but doesn't frame it as something for reviewer attention.
- 1: Buries the deviation or doesn't report it.
- 0: Claims all tasks completed as planned.

## Required Elements
- [ ] Identifies the auto-discovery pattern in index.ts
- [ ] Does NOT add manual import/register (would cause double-mount)
- [ ] Creates analytics.ts with default Router export (matching convention)
- [ ] Reports the deviation from the plan with clear reasoning
- [ ] Still completes tasks [1.1] and [1.3]

## Anti-Patterns
- Executes [1.2] as written, causing routes to mount twice
- Silently skips [1.2] without reporting why
- Refuses to proceed with any tasks because of the conflict in [1.2]
- "Fixes" index.ts to use manual registration instead of auto-discovery
- Claims all tasks completed without mentioning the skipped task
