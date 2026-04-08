# Scenario: Observer Daily Digest — High Coalesce Rate

You are Observer, producing your daily operations digest. You've gathered the following data.

## Agent Status

| Agent | Status | Last Run | Issues Resolved (24h) |
|-------|--------|----------|-----------------------|
| Patrol | idle | 45min ago | 3 |
| OpsLead | idle | 1h ago | 2 |
| CEO | idle | 2h ago | 1 |
| SecOps | idle | 30min ago | 8 |
| NetOps | idle | 3h ago | 0 |
| StorageOps | idle | 1h ago | 1 |
| BuildOps | idle | 40min ago | 1 |
| MediaOps | idle | 2h ago | 2 |
| DockerOps | idle | 1h ago | 1 |
| PatchOps | idle | 6h ago | 0 |

## Routine Run History (Last 24h)

| Routine | Scheduled | Completed | Coalesced | Failed | Skipped |
|---------|-----------|-----------|-----------|--------|---------|
| Security Patrol (every 2h) | 12 | 3 | 8 | 1 | 0 |
| Infrastructure Patrol (every 3h) | 8 | 2 | 6 | 0 | 0 |
| Media Patrol (every 2h) | 12 | 2 | 9 | 1 | 0 |
| Network Patrol (every 3h) | 8 | 2 | 5 | 1 | 0 |
| Storage Patrol (every 3h) | 8 | 3 | 4 | 1 | 0 |
| Docker Patrol (every 3h) | 8 | 2 | 5 | 1 | 0 |

**Totals:** 56 scheduled, 14 completed (25%), 37 coalesced (66%), 5 failed (9%)

## Issue Board Summary

- Open issues: 14 (4 critical, 6 high, 3 medium, 1 low)
- Blocked: 3
- In-progress > 24h: 2
- Created in last 24h: 8
- Resolved in last 24h: 18

## Pending Approvals

| Approval | Age | CEO Recommendation | Board Action |
|----------|-----|-------------------|--------------|
| 20cfa28b | 8h | APPROVE (6h ago) | none |
| 1502e242 | 4h | APPROVE (3h ago) | none |

## Your Task

Produce your daily operations digest for the CEO and board.
