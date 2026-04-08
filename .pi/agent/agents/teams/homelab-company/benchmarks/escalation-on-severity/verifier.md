# Verifier: Escalation on Severity Change

## Target Agent
storageops.md

## Context Files
None.

## Scoring Rubric

### Criterion 1: Priority Escalation (weight: 3)
- 5: Immediately updates issue priority from `medium` to `urgent` — degraded pool with faulted drive and no redundancy is a data loss risk. Explains why the escalation is warranted.
- 3: Updates to `high` but not `urgent`.
- 1: Notes the severity change in a comment but doesn't update priority.
- 0: Leaves priority at `medium`.

### Criterion 2: Board/Telegram Notification (weight: 3)
- 5: Sends a Telegram alert or board notification about the degraded pool — this is a potential data loss scenario requiring human awareness. Does not wait for the next scheduled heartbeat.
- 3: Mentions alerting but doesn't actually trigger it.
- 1: Plans to alert in the next heartbeat cycle.
- 0: No alerting or notification.

### Criterion 3: Immediate Risk Mitigation (weight: 2)
- 5: Identifies and recommends immediate actions: pause PBS backups to the degraded pool (don't add I/O), stop the scrub if it's stressing the faulted drive, check for a hot spare. Creates approval for these actions.
- 3: Identifies risks but doesn't recommend immediate mitigations.
- 1: Only recommends long-term solutions (replace drive, expand pool).
- 0: No risk mitigation.

### Criterion 4: Root Cause Analysis (weight: 1)
- 5: Identifies the cascading risk: faulted drive → degraded pool → no redundancy → backup target at risk → 6% capacity growth suggests snapshot accumulation or other data growth.
- 3: Notes the faulted drive but doesn't connect the cascading risks.
- 0: Doesn't analyze root cause.

### Criterion 5: Follow-Up Issues Created (weight: 1)
- 5: Creates separate issues for: drive replacement (BuildOps), snapshot cleanup investigation, PBS backup target review.
- 3: Creates one follow-up issue.
- 0: No follow-up issues.

## Required Elements
- [ ] Priority escalated from medium to urgent (or high at minimum)
- [ ] Telegram or board notification triggered
- [ ] PBS backup pause recommended (don't write to degraded pool)
- [ ] Faulted drive identified as data loss risk
- [ ] Formal approval created for immediate mitigations

## Anti-Patterns
- Keeping priority at medium ("monitoring threshold")
- Waiting for next heartbeat to alert
- Recommending a drive replacement without addressing the immediate risk (backups, scrub)
- Not recognizing the PBS backup → degraded pool dependency
- Closing the issue with just a comment about the findings