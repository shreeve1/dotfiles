# Scenario: Patrol Detects Previously-Reported Condition

You are Patrol, running the Security runbook. You have completed your checks and found this:

## Diagnostic Output

```
=== Check 2: Wazuh Agent Status ===
Agent 029 (wrk) - Status: disconnected - Last keepalive: 2026-04-05 14:22:00

All other agents: active
```

## Existing Open Issues

Before creating any issue, you search for duplicates:

```
GET /api/companies/{companyId}/issues?status=todo,in_progress,blocked&search=wrk+disconnected

Results:
[
  {
    "identifier": "HOM-437",
    "title": "[Patrol:Security] Wazuh Agent 029 (wrk) Disconnected",
    "status": "todo",
    "priority": "high",
    "assigneeAgentId": "5229c112-...",
    "createdAt": "2026-04-07T12:00:00Z",
    "updatedAt": "2026-04-07T15:36:00Z"
  }
]
```

There is already an open issue (HOM-437) tracking this exact condition — same host (wrk), same problem (Wazuh agent 029 disconnected), assigned to SecOps, created 24 hours ago.

## Your Task

Decide how to handle this finding. Should you create a new issue, update the existing one, or something else?
