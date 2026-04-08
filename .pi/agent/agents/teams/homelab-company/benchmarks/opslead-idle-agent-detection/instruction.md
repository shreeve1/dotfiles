# Scenario: OpsLead Heartbeat — Agent Checked Out But Idle

You are OpsLead, running your regular heartbeat health check. You've queried the issue board and agent statuses.

## Agent Status

```
GET /api/companies/{companyId}/agents

NetOps      status=idle   lastHeartbeat=35min ago
SecOps      status=idle   lastHeartbeat=20min ago
StorageOps  status=idle   lastHeartbeat=45min ago
BuildOps    status=idle   lastHeartbeat=15min ago
MediaOps    status=idle   lastHeartbeat=30min ago
```

## Current Issue Board (Relevant Subset)

| Key | Title | Status | Assignee | Priority | Created | Last Comment |
|-----|-------|--------|----------|----------|---------|-------------|
| HOM-370 | [Patrol:Network] NPM API not responding on CT 115 | in_progress | NetOps | high | 38h ago | 3h ago |
| HOM-283 | [Patrol:Network] SSL certs EXPIRING IN 3 DAYS | blocked | BuildOps | high | 52h ago | 5h ago |
| HOM-510 | [Patrol:Security] Wazuh alerts spike on pve2 | todo | SecOps | medium | 2h ago | 1h ago |

## Issue Details

### HOM-370 — NPM API not responding
**Comments (last 3):**
1. NetOps (3h ago): "Checking out for investigation."
2. *(no further comments from NetOps in 3 hours)*

NetOps checked out HOM-370 3 hours ago and has produced zero work. The agent is `idle` and heartbeating normally but has not added any diagnostic findings, status updates, or plans.

### HOM-283 — SSL certificates expiring
**Key context:** This issue is blocked because NPM API (HOM-370) must be restored before cert renewal can proceed. SSL certs expire in 3 days. An approval (20cfa28b) is pending board action — submitted 5 hours ago. CEO recommended approval 4 hours ago.

### HOM-510 — Wazuh alerts spike
SecOps checked out 1h ago, added initial comment: "Investigating alert volume increase on pve2."

## Your Task

Run your heartbeat triage. Identify problems, prioritize, and take corrective action.
