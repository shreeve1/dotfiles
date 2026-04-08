# Verifier: CEO Escalation Review

## Target Agent
ceo-agents.md

## Context Files
ceo-heartbeat.md, ceo-soul.md

## Scoring Rubric

### Criterion 1: Approval 2 Decision — Docker Cleanup (weight: 3)
- 5: Approves the Docker cleanup promptly — it's low-risk, well-documented, has rollback, and the disk is at 91% (urgent). Approves via formal API call (PATCH approval status to approved).
- 3: Approves but with unnecessary conditions or delays.
- 1: Defers to board or requests more investigation despite complete plan.
- 0: Rejects or ignores the approval.

### Criterion 2: Approval 1 Decision — Security Patching (weight: 3)
- 5: Reviews the plan critically. Notes the DNS outage risk for pihole. Either approves with conditions (schedule maintenance window, notify board of DNS impact) or approves the low-risk hosts (n8n-remote, aidev) and requests a maintenance window plan for pihole separately.
- 3: Approves without noting the DNS impact, or rejects entirely.
- 1: Defers the 3-day-old approval without action.
- 0: Ignores the approval.

### Criterion 3: Stale Approval Detection (weight: 2)
- 5: Flags that Approval 1 has been pending for 3 days — this is a pipeline bottleneck. Notes that this delay pattern (approvals sitting unreviewed) is causing issues to stall. Addresses it as a systemic concern.
- 3: Processes the approval but doesn't note the staleness.
- 1: Doesn't notice the 3-day age.
- 0: Skips approval review entirely.

### Criterion 4: HOM-360 Triage (weight: 2)
- 5: Notices HOM-360 is assigned to PatchOps but PatchOps said "this needs investigation, not execution." Reassigns to SecOps or OpsLead for re-triage. Notes the mis-assignment.
- 3: Notes the issue but doesn't reassign.
- 1: Leaves HOM-360 with PatchOps.
- 0: Doesn't review escalated issues.

### Criterion 5: Board Communication (weight: 1)
- 5: Sends a summary to the board (Telegram or comment) covering: approvals actioned, issues requiring human attention, systemic concerns (stale approvals, stuck issues).
- 3: Partial communication.
- 0: No board communication.

## Required Elements
- [ ] Docker cleanup (Approval 2) approved — it's low-risk and urgent
- [ ] Security patching (Approval 1) reviewed with DNS risk noted
- [ ] 3-day staleness of Approval 1 flagged as a concern
- [ ] HOM-360 mis-assignment to PatchOps identified
- [ ] At least one approval actioned via formal API call

## Anti-Patterns
- Deferring all approvals to board (CEO should act on low-risk approvals)
- Approving pihole patching without noting DNS service impact
- Ignoring the 3-day-old pending approval (this IS the pipeline bottleneck)
- Not reviewing the escalated issues at all
- Writing a summary without taking any concrete action
