# Verifier: Runbook Quality

## Target Agent
documenter.md (from agents/infra-ops/)

## Context Files
context.md (from teams/2-infra-ops/)

## Scoring Rubric

### Criterion 1: Exact Commands with Expected Output (weight: 3)
- 5: Every diagnostic and remediation step includes the exact command to run AND what the output should look like (both success and failure cases). A team member can copy-paste and know immediately if the result is right or wrong.
- 4: Most commands have expected output, 1-2 missing
- 3: Commands are present but expected output is inconsistent or vague ("you should see the certificate info")
- 1: Commands listed without expected output
- 0: No specific commands — just prose descriptions

### Criterion 2: Decision Points (weight: 3)
- 5: Runbook includes clear decision forks: "If port 80 is blocked by a container, stop it. If port 80 is blocked by another system service, investigate before stopping." Covers the branching logic a responder would face, not just the happy path.
- 3: Some branching but key decision points are missing (e.g., what if certbot renewal fails for a different reason?)
- 1: Linear steps only — assumes everything goes exactly as it did in this incident
- 0: No decision logic

### Criterion 3: Verification Steps (weight: 2)
- 5: Includes explicit verification after each major action: confirm nginx is running, confirm certbot renewed, confirm Postfix is using the new cert, confirm external email delivery works. Final verification proves the issue is fully resolved.
- 3: Final verification present but intermediate verifications missing
- 1: "Verify it works" without specifying how
- 0: No verification

### Criterion 4: Rollback / Escalation (weight: 2)
- 5: Includes what to do if the runbook steps don't work: escalation path (to analyst for deeper investigation), rollback steps if an action made things worse, and criteria for when to stop and escalate vs. continue troubleshooting.
- 3: Mentions escalation but no specific criteria or rollback steps
- 1: No escalation or rollback guidance
- 0: N/A

### Criterion 5: Prevention / Root Cause Note (weight: 1)
- 5: Includes a section on preventing recurrence: don't run test containers on ports used by system services, consider adding a port-conflict check to the operator's maintenance routine, monitor nginx uptime as a proxy for cert renewal health.
- 3: Mentions prevention but vaguely
- 1: No prevention section
- 0: N/A

## Required Elements
- [ ] Title and scope clearly stated (cert renewal failure due to port conflict)
- [ ] Symptoms listed (external email bouncing, TLS handshake errors)
- [ ] Step-by-step commands with expected output for each
- [ ] At least one decision point / branch ("if X, then Y; if Z, then W")
- [ ] Verification that email delivery works after remediation
- [ ] Escalation criteria (when to stop and ask for help)

## Anti-Patterns
- Copy-pasting the incident timeline as the runbook (narrative != procedure)
- Commands without context ("run `certbot renew`" without checking port 80 first)
- No expected output — reader can't tell success from failure
- Happy-path only — assumes the exact same root cause every time
- Missing the restart of Postfix (cert renewed but mail server still using old cert)
