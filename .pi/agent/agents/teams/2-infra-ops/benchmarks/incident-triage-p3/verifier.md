# Verifier: P3 Incident Triage

## Target Agent
dispatcher.md (from teams/2-infra-ops/)

## Context Files
context.md (from teams/2-infra-ops/)

## Scoring Rubric

### Criterion 1: Severity Assessment (weight: 3)
- 5: Correctly identifies as P3/low but time-bounded — no current outage, but a hard 14-day deadline before it becomes P1. Notes that auto-renewal failure is the real issue (not just the certificate).
- 3: Identifies as low severity and notes the deadline, but doesn't recognize the auto-renewal failure as a deeper issue
- 1: Overreacts (treats as P1) or underreacts (defers indefinitely)
- 0: No severity assessment

### Criterion 2: Correct Agent Routing (weight: 3)
- 5: Routes to operator (preventive maintenance — fix the renewal, renew the cert) as primary. May include analyst to investigate WHY auto-renewal failed.
- 3: Routes to an appropriate agent but not the optimal one (e.g., responder for a non-outage)
- 1: Routes to documenter or scout as primary (wrong priority — fix first, document after)
- 0: Routes to hardener only (security review isn't the immediate need)

### Criterion 3: Root Cause Awareness (weight: 2)
- 5: Recognizes that the real problem is the failed auto-renewal (certbot cron job), not just the expiring certificate. Task addresses both the immediate renewal AND investigating why auto-renewal stopped working.
- 3: Addresses the immediate renewal but not the auto-renewal failure investigation
- 1: Only addresses the immediate certificate without considering why renewal failed
- 0: Misidentifies the root problem

### Criterion 4: Task Specificity (weight: 2)
- 5: Task includes specific actions: check certbot cron job/timer status, check certbot logs, attempt manual renewal, verify certificate post-renewal, fix the auto-renewal mechanism
- 3: Reasonable task but missing specific diagnostic steps
- 1: Vague task like "fix the SSL certificate"
- 0: No task description

### Criterion 5: Proportionate Response (weight: 1)
- 5: Response is proportionate — no emergency escalation, but scheduled promptly within 1-2 days (not deferred to "next maintenance window" which might be too late)
- 3: Slightly over or under responds to the urgency
- 1: Major mismatch — either emergency response for a non-emergency, or deferring a time-bounded issue
- 0: No timing consideration

## Required Elements
- [ ] Severity is P3/low (not P1 or P2)
- [ ] Operator is the primary agent dispatched
- [ ] Auto-renewal failure is identified as the underlying issue
- [ ] Immediate certificate renewal is part of the task
- [ ] Investigation of why certbot auto-renewal failed is part of the task

## Anti-Patterns
- Treating as P1 emergency (no current outage)
- Deferring without a timeline (14-day hard deadline)
- Only fixing the symptom (renew cert) without investigating the cause (broken cron)
- Dispatching responder (this is maintenance, not incident response)
- Over-engineering with full pipeline (operator can handle this directly)
