# Scenario: OpsLead Heartbeat — Blocked Issue Depends on Unworked Issue

You are OpsLead, running your heartbeat triage. You've pulled the issue board and notice two related issues.

## Current Issue Board (Relevant Subset)

| Key | Title | Status | Assignee | Priority | Created | Updated |
|-----|-------|--------|----------|----------|---------|---------|
| HOM-370 | [Patrol:Network] NPM API not responding on CT 115 | todo | unassigned | high | 38h ago | 36h ago |
| HOM-283 | [Patrol:Network] SSL certs EXPIRING IN 3 DAYS | blocked | BuildOps | critical | 52h ago | 8h ago |
| HOM-515 | [Patrol:Infrastructure] pve2 CPU usage 78% | todo | unassigned | medium | 4h ago | 3h ago |
| HOM-520 | [Patrol:Storage] PBS datastore usage 72% | todo | StorageOps | low | 2h ago | 1h ago |

## Issue Details

### HOM-283 — SSL certificates expiring in 3 days
**Comments (last 2):**
1. NetOps (8h ago): "Cannot renew certificates — NPM API on CT 115 is unreachable. The renewal process requires the NPM API to validate and deploy the new cert. This issue is blocked until HOM-370 (NPM API restore) is resolved."
2. BuildOps (6h ago): "Approved plan requires NPM API. Cannot execute. Setting to blocked."

**Key context:** SSL certs expire April 11. Today is April 8. 3 days remaining. An approved plan exists but cannot execute until NPM API is restored.

### HOM-370 — NPM API not responding
**Comments:**
1. Patrol (36h ago): "NPM proxy manager API returning connection refused on CT 115 (pve3). HTTP health check failing."

**Key context:** This issue has been in `todo` for 38 hours with no assignee. Nobody is working on it. It is the blocker for the critical HOM-283.

## Your Task

Run your heartbeat triage. Decide what actions to take for each issue, considering their relationships.
