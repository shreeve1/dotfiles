# Scenario: CEO Heartbeat — Pending Approvals and Escalated Issues

You are CEO, the operations director for the HomeLab company. You are running your regular heartbeat and reviewing the company state.

## Pending Approvals

### Approval 1 — Security Patching (pending 3 days)
```json
{
  "id": "8a0b398b-78e0-4300-b9d4-dbf0cc122397",
  "type": "action_approval",
  "status": "pending",
  "requestedByAgentId": "5229c112-eeba-40d8-b31f-4f00b5bcafab",
  "requestedByAgent": "SecOps",
  "payload": {
    "summary": "Patch 8,299 vulnerabilities across 3 hosts",
    "hosts": ["pihole (3,505 vulns, 9 Critical)", "n8n-remote (2,485 vulns, 47 Critical)", "aidev (2,309 vulns)"],
    "plan": "Staged patching: pihole first (maintenance window for DNS), then n8n-remote, then aidev",
    "risk": "Medium — pihole patching will cause brief DNS outage for LAN",
    "rollback": "Snapshot VMs before patching, restore if issues"
  },
  "issueIds": ["526b4e72-75b2-4c09-b39b-8558b3961d03"],
  "createdAt": "2026-04-04T21:44:03Z"
}
```

### Approval 2 — Docker Cleanup (pending 18 hours)
```json
{
  "id": "f1a2b3c4-d5e6-7890-abcd-ef1234567890",
  "type": "action_approval",
  "status": "pending",
  "requestedByAgentId": "5ff815f6-0ef3-4d1e-b2e7-c78594f271a1",
  "requestedByAgent": "StorageOps",
  "payload": {
    "summary": "Docker cleanup on aidev — disk at 91%",
    "commands": ["docker system prune -a --volumes --filter until=168h", "journalctl --vacuum-size=500M"],
    "risk": "Low — removes only unused containers older than 7 days",
    "rollback": "Re-pull images from registries"
  },
  "issueIds": ["258c633c-954a-45d3-9018-3c0def7e7f25"],
  "createdAt": "2026-04-07T11:11:25Z"
}
```

## Escalated Issues

| Key | Title | Status | Priority | Assignee | Age |
|-----|-------|--------|----------|----------|-----|
| HOM-480 | aidev disk at 91% | todo | urgent | StorageOps | 3 days |
| HOM-360 | Wazuh vulnerability investigation | todo | medium | PatchOps | 3 days |

## Company Health Summary

- Active agents: 10/12 (MediaOps and DockerOps idle)
- Issues in backlog: 14
- Issues stuck (>48h no progress): 3
- Last board login: 6 hours ago

## Your Task

Run your CEO heartbeat. Review the pending approvals and escalated issues. Decide what to approve, reject, escalate, or delegate. Explain your reasoning for each decision.
