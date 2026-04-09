# Verifier: Cross-Agent Handoff Chain

## Target Agent
planner (from agents/planner.md)

## Context Files
- agents/teams/1-full/context.md

## Scoring Rubric

### Criterion 1: Scout Finding Utilization (weight: 3)
- 5: References at least 4 specific file:line findings from the scout report (e.g., WebhookHandler.ts:14, WebhookHandler.ts:8, payments.ts:45, types.ts:12). Uses scout's findings as the basis for the plan rather than re-deriving them.
- 3: References 2-3 scout findings but misses key ones (e.g., the cron job or the type extension need).
- 1: Vaguely references the scout report ("as the scout found...") without citing specific findings.
- 0: Ignores scout findings entirely and plans from scratch.

### Criterion 2: Modification Target Alignment (weight: 3)
- 5: Plan targets exactly the files the scout identified — WebhookHandler.ts (add refund and failure cases), types.ts (extend WebhookEvent), webhooks.ts (route already exists, may need updates). Each file has specific, concrete changes described.
- 3: Targets the right files but changes are vaguely described ("update WebhookHandler").
- 1: Targets some correct files but misses key ones or adds unnecessary files.
- 0: Plans modification of files not in the scout report without justification.

### Criterion 3: Watch-Out Incorporation (weight: 2)
- 5: Explicitly addresses the scout's cron deprecation warning. Plan includes a strategy to run both webhook and cron poller in parallel initially, with a later task to deprecate the cron after webhook reliability is proven. Does NOT include immediate removal of refund-poller.ts.
- 3: Mentions the cron job but plans immediate removal or doesn't address the parallel-running strategy.
- 1: Ignores the cron job entirely.
- 0: Plans to delete refund-poller.ts in the same change.

### Criterion 4: Pattern Reuse (weight: 2)
- 5: Leverages the existing signature verification pattern at WebhookHandler.ts:8 — plan states that new webhook event handlers should reuse the same `constructEvent()` verification, not add a separate verification step. May reference the existing switch-case structure at :14 as the extension point.
- 3: Mentions signature verification exists but doesn't explicitly plan to reuse it.
- 1: Plans to add new signature verification instead of reusing existing.
- 0: Doesn't address signature verification at all.

## Required Elements
- [ ] References at least 3 specific file:line findings from the scout report
- [ ] Plan includes WebhookHandler.ts, types.ts, and webhooks.ts as modification targets
- [ ] Explicitly addresses refund-poller.ts deprecation strategy (don't remove immediately)
- [ ] Does NOT include a "Step 1: Explore the codebase" or "scout the payment system" step
- [ ] Plan includes adding both `charge.refunded` and `charge.failed` (or `payment_intent.payment_failed`) event handling
- [ ] Validation commands include testing both new webhook event types

## Anti-Patterns
- Includes "Explore the codebase" step (duplicates scout's completed work)
- Ignores scout findings and plans from scratch as if no exploration was done
- Plans immediate removal of refund-poller.ts cron job
- References files not mentioned in the scout report without justification
- Adds separate signature verification instead of reusing the existing pattern
