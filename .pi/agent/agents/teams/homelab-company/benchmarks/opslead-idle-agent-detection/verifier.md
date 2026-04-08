# Verifier: OpsLead Idle Agent Detection

## Target Agent
opslead.md

## Context Files
None.

## Scoring Rubric

### Criterion 1: Detects NetOps Idle-After-Checkout (weight: 3)
- 5: Identifies that NetOps checked out HOM-370 3 hours ago with zero progress. Recognizes this as a stale checkout — agent is idle/heartbeating but not working. Takes corrective action: releases the checkout, resets NetOps session, or reassigns the issue.
- 3: Notices the 3h gap but only adds a comment asking NetOps for an update.
- 1: Notes the issue is old but doesn't connect it to NetOps's inactivity.
- 0: Doesn't detect the idle-after-checkout pattern.

### Criterion 2: Recognizes HOM-370 Blocks HOM-283 (weight: 3)
- 5: Explicitly connects that HOM-283 (SSL cert, 3 days to expiry) is blocked by HOM-370 (NPM API down). Prioritizes fixing HOM-370 because it unblocks the time-sensitive HOM-283. Escalates urgency of HOM-370 accordingly.
- 3: Handles both issues but doesn't connect the dependency.
- 1: Addresses HOM-283 without recognizing it depends on HOM-370.
- 0: Doesn't notice the dependency.

### Criterion 3: Escalates Board Approval Delay (weight: 2)
- 5: Flags that HOM-283's approval has been pending 5 hours despite CEO recommendation 4 hours ago. Sends Telegram alert to board about the stale approval with the SSL expiry deadline context.
- 3: Notes the stale approval but doesn't send Telegram.
- 1: Doesn't notice the approval delay.
- 0: Ignores HOM-283 entirely.

### Criterion 4: Leaves HOM-510 Appropriately (weight: 1)
- 5: Recognizes HOM-510 is being actively worked (SecOps checked out 1h ago, added a comment). Leaves it alone — this is normal progress.
- 3: Checks on HOM-510 unnecessarily but doesn't interfere.
- 0: Reassigns or escalates HOM-510 despite it being actively worked.

### Criterion 5: Priority-Ordered Actions (weight: 1)
- 5: Handles HOM-370/283 (high priority, time-sensitive, interconnected) before HOM-510 (medium, being worked). Explicitly states the priority rationale.
- 3: Handles all issues but in arbitrary order.
- 0: Handles low-priority items first.

## Required Elements
- [ ] NetOps 3h idle-after-checkout detected and corrected (release/reset/reassign)
- [ ] HOM-370 → HOM-283 dependency explicitly identified
- [ ] Stale board approval flagged with Telegram alert
- [ ] HOM-510 left alone (active, normal progress)
- [ ] Actions taken in priority order

## Anti-Patterns
- Only commenting "please update" without taking corrective action on the stale checkout
- Treating HOM-370 and HOM-283 as independent issues
- Reassigning HOM-510 despite active progress (1h ago)
- Not sending Telegram for the 5h stale approval on a time-critical issue
- Resetting NetOps without releasing the HOM-370 checkout first
