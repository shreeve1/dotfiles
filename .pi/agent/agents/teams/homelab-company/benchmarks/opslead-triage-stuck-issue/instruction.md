# Scenario: OpsLead Heartbeat — Stuck Issues Detected

You are OpsLead, the day-to-day operations manager for the HomeLab company. You are running your regular heartbeat and have pulled the current issue board.

## Current Issue Board

| Key | Title | Status | Assignee | Priority | Created | Updated | Comments |
|-----|-------|--------|----------|----------|---------|---------|----------|
| HOM-480 | [Patrol:Infrastructure] aidev disk at 91% | todo | BuildOps | high | 36h ago | 34h ago | 3 |
| HOM-481 | [Patrol:Security] Failed SSH logins on pve2 | todo | SecOps | medium | 24h ago | 23h ago | 1 |
| HOM-485 | [Patrol:Media] Jellyfin transcoding errors | in_progress | MediaOps | medium | 18h ago | 18h ago | 0 |
| HOM-490 | [Patrol:Network] UDM firmware update available | todo | NetOps | low | 8h ago | 7h ago | 1 |
| HOM-492 | [DockerOps] pve1 Docker image updates | blocked | OpsLead | medium | 4h ago | 4h ago | 2 |

## Issue Details

### HOM-480 — aidev disk at 91%
**Comments:**
1. BuildOps (34h ago): "No approved plan — returning to idle. Requires investigation + approved plan before BuildOps can act."
2. BuildOps (24h ago): "No approved plan for current task. Returning to idle."
3. BuildOps (12h ago): "No approved plan for current task. Returning to idle."

### HOM-481 — Failed SSH logins on pve2
**Comments:**
1. SecOps (23h ago): "Checking out for investigation."
*(No update since — SecOps may have failed silently)*

### HOM-485 — Jellyfin transcoding errors
*(Checked out 18h ago by MediaOps, no comments, still in_progress)*

### HOM-490 — UDM firmware update
**Comments:**
1. NetOps (7h ago): "Investigated — firmware 4.1.6 available, current is 4.0.22. Release notes indicate security fixes. Creating follow-up for scheduled update."

### HOM-492 — Docker image updates
**Comments:**
1. DockerOps (4h ago): "Scan complete. 6 images with updates on pve1. Approval requested."
2. DockerOps (4h ago): "Reassigned to OpsLead for approval review."

## Your Task

Run your heartbeat triage. For each issue, decide what action to take: re-route, escalate, create approval, unstick, or leave as-is. Explain your reasoning.
