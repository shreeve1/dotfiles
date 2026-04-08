# Verifier: OpsLead Triage — Stuck Issues

## Target Agent
opslead.md

## Context Files
None — OpsLead should have triage logic in its own instructions.

## Scoring Rubric

### Criterion 1: Detects and Fixes HOM-480 Bounce Pattern (weight: 3)
- 5: Recognizes that BuildOps has bounced 3 times in 36 hours (the exact HOM-131 pattern). Reassigns to StorageOps or appropriate investigator for disk analysis. Does NOT leave it with BuildOps.
- 3: Recognizes the bounce but only adds a comment asking BuildOps to try again.
- 1: Notes the issue is old but doesn't reassign.
- 0: Skips HOM-480 or leaves it with BuildOps.

### Criterion 2: Detects HOM-481 Silent Failure (weight: 2)
- 5: Recognizes SecOps checked out 23h ago with no update. Flags as potentially stuck. Either pings SecOps or reassigns and notes the gap.
- 3: Notes the issue is stale but doesn't take action.
- 1: Doesn't notice the 23h silence.
- 0: Skips the issue.

### Criterion 3: Detects HOM-485 Stall (weight: 2)
- 5: Recognizes in_progress for 18h with zero comments. Either pings MediaOps or releases the checkout.
- 3: Notes the issue but doesn't act.
- 0: Skips or doesn't notice.

### Criterion 4: Handles HOM-492 Approval Request (weight: 2)
- 5: Reviews DockerOps' request, assesses risk, and either creates a formal approval or escalates to CEO/board if risk is high. Doesn't just acknowledge.
- 3: Acknowledges the request but defers decision.
- 1: Ignores the approval request.
- 0: Rejects or mishandles.

### Criterion 5: Prioritization (weight: 1)
- 5: Handles HOM-480 (high priority, 91% disk, 36h stuck) FIRST before lower-priority items. Recognizes urgency ordering.
- 3: Handles all issues but in random order.
- 1: Handles low-priority items before the critical stuck issue.
- 0: Doesn't prioritize.

## Required Elements
- [ ] HOM-480 reassigned away from BuildOps to an investigating agent
- [ ] HOM-481 flagged as potentially stuck (23h no update)
- [ ] HOM-485 flagged as stalled (18h in_progress, no comments)
- [ ] HOM-492 approval request reviewed and acted on
- [ ] Issues handled in priority order (480 first)

## Anti-Patterns
- Leaving HOM-480 with BuildOps (the bounce will continue)
- Not recognizing the 3x bounce pattern as a systemic issue
- Treating all issues as equal priority
- Just writing status update comments without taking corrective action
- Creating approvals for issues that haven't been investigated yet
