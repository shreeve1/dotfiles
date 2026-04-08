# API Operations Reference

Detailed API commands for HomeLab Paperclip operations. The main SKILL.md tells you when to use these — this file has the exact commands.

All commands require `$BOARD_KEY` — see [board-api-key.md](board-api-key.md) if you need one.

Company ID: `4068464a-69cf-4078-89a2-8ebaa8a9e217`

---

## Agent Operations

### Pause an agent

```bash
curl -s -X POST "http://localhost:3100/api/agents/<agent-id>/pause" \
  -H "Authorization: Bearer $BOARD_KEY" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Paused for maintenance"}'
```

### Resume a paused agent

```bash
curl -s -X POST "http://localhost:3100/api/agents/<agent-id>/resume" \
  -H "Authorization: Bearer $BOARD_KEY"
```

### Manually wake an agent (trigger immediate run)

```bash
curl -s -X POST "http://localhost:3100/api/agents/<agent-id>/wakeup" \
  -H "Authorization: Bearer $BOARD_KEY" \
  -H "Content-Type: application/json" \
  -d '{"source": "manual", "triggerDetail": "troubleshoot-session", "reason": "manual_trigger"}'
```

### Terminate a stuck running agent

```bash
curl -s -X POST "http://localhost:3100/api/agents/<agent-id>/terminate" \
  -H "Authorization: Bearer $BOARD_KEY"
```

### Cancel a specific run

```bash
curl -s -X POST "http://localhost:3100/api/heartbeat-runs/<run-id>/cancel" \
  -H "Authorization: Bearer $BOARD_KEY"
```

### Reset agent session

```bash
curl -s -X POST "http://localhost:3100/api/agents/<agent-id>/runtime-state/reset-session" \
  -H "Authorization: Bearer $BOARD_KEY" \
  -H "Content-Type: application/json" -d '{}'
```

### View run history

```bash
curl -s "http://localhost:3100/api/companies/4068464a-69cf-4078-89a2-8ebaa8a9e217/heartbeat-runs?agentId=<agent-id>&limit=10" \
  -H "Authorization: Bearer $BOARD_KEY" | python3 -m json.tool
```

### Get run log (most useful for debugging)

```bash
curl -s "http://localhost:3100/api/heartbeat-runs/<run-id>/log" \
  -H "Authorization: Bearer $BOARD_KEY"
```

### Get run events

```bash
curl -s "http://localhost:3100/api/heartbeat-runs/<run-id>/events" \
  -H "Authorization: Bearer $BOARD_KEY" | python3 -m json.tool
```

### Update agent config

```bash
curl -s -X PATCH "http://localhost:3100/api/agents/<agent-id>" \
  -H "Authorization: Bearer $BOARD_KEY" \
  -H "Content-Type: application/json" \
  -d '{"adapterConfig": {"model": "new-model"}}'
```

Common patches: `adapterConfig.model`, `runtimeConfig.heartbeat`, `title`, `capabilities`.

To clear error status: patch the agent or terminate + resume.

---

## Issue Operations

### Release a stuck checkout

```bash
curl -s -X POST "http://localhost:3100/api/issues/<issue-id>/release" \
  -H "Authorization: Bearer $BOARD_KEY"
```

### View comment thread

```bash
curl -s "http://localhost:3100/api/issues/<issue-id>/comments" \
  -H "Authorization: Bearer $BOARD_KEY" | python3 -m json.tool
```

### Add a comment

```bash
curl -s -X POST "http://localhost:3100/api/issues/<issue-id>/comments" \
  -H "Authorization: Bearer $BOARD_KEY" \
  -H "Content-Type: application/json" \
  -d '{"body": "Manual intervention: <reason>"}'
```

### Update issue status

```bash
curl -s -X PATCH "http://localhost:3100/api/issues/<issue-id>" \
  -H "Authorization: Bearer $BOARD_KEY" \
  -H "Content-Type: application/json" \
  -d '{"status": "cancelled", "comment": "Cancelled by operator"}'
```

Statuses: `backlog`, `todo`, `in_progress`, `in_review`, `done`, `blocked`, `cancelled`.

### Delete an issue (**destructive**)

```bash
curl -s -X DELETE "http://localhost:3100/api/issues/<issue-id>" \
  -H "Authorization: Bearer $BOARD_KEY"
```

### View issue documents

```bash
curl -s "http://localhost:3100/api/issues/<issue-id>/documents" \
  -H "Authorization: Bearer $BOARD_KEY" | python3 -m json.tool
```

---

## Routine Operations

### Run a routine manually (outside schedule)

```bash
curl -s -X POST "http://localhost:3100/api/routines/<routine-id>/run" \
  -H "Authorization: Bearer $BOARD_KEY" \
  -H "Content-Type: application/json" \
  -d '{"source": "manual"}'
```

### Update routine config

```bash
curl -s -X PATCH "http://localhost:3100/api/routines/<routine-id>" \
  -H "Authorization: Bearer $BOARD_KEY" \
  -H "Content-Type: application/json" \
  -d '{"status": "paused"}'
```

### Update trigger schedule

```bash
curl -s -X PATCH "http://localhost:3100/api/routine-triggers/<trigger-id>" \
  -H "Authorization: Bearer $BOARD_KEY" \
  -H "Content-Type: application/json" \
  -d '{"cronExpression": "0 */6 * * *", "timezone": "America/Chicago"}'
```

### Delete a trigger

```bash
curl -s -X DELETE "http://localhost:3100/api/routine-triggers/<trigger-id>" \
  -H "Authorization: Bearer $BOARD_KEY"
```

### Add a webhook trigger to a routine

```bash
curl -s -X POST "http://localhost:3100/api/routines/<routine-id>/triggers" \
  -H "Authorization: Bearer $BOARD_KEY" \
  -H "Content-Type: application/json" \
  -d '{"kind": "webhook", "label": "Wazuh alerts", "signingMode": "bearer"}'
```

Response includes `webhookUrl` and `webhookSecret` for configuring the external system.

### Rotate webhook secret

```bash
curl -s -X POST "http://localhost:3100/api/routine-triggers/<trigger-id>/rotate-secret" \
  -H "Authorization: Bearer $BOARD_KEY" \
  -H "Content-Type: application/json" -d '{}'
```

---

## Observability

### Activity log

```bash
curl -s "http://localhost:3100/api/companies/4068464a-69cf-4078-89a2-8ebaa8a9e217/activity?limit=20" \
  -H "Authorization: Bearer $BOARD_KEY" | python3 -c "
import sys, json
for e in json.load(sys.stdin):
    ts = e.get('createdAt','')[:16]
    print(f'{ts} {e[\"action\"]:30} {e.get(\"entityType\",\"?\"):15} agent={e.get(\"agentId\",\"-\")[:8]}')
"
```

### Live running agents

```bash
curl -s "http://localhost:3100/api/companies/4068464a-69cf-4078-89a2-8ebaa8a9e217/live-runs" \
  -H "Authorization: Bearer $BOARD_KEY" | python3 -m json.tool
```

### Dashboard data

```bash
curl -s "http://localhost:3100/api/companies/4068464a-69cf-4078-89a2-8ebaa8a9e217/dashboard" \
  -H "Authorization: Bearer $BOARD_KEY" | python3 -m json.tool
```

### Cost summary

```bash
curl -s "http://localhost:3100/api/companies/4068464a-69cf-4078-89a2-8ebaa8a9e217/costs/summary" \
  -H "Authorization: Bearer $BOARD_KEY" | python3 -m json.tool
```

### Cost by agent

```bash
curl -s "http://localhost:3100/api/companies/4068464a-69cf-4078-89a2-8ebaa8a9e217/costs/by-agent" \
  -H "Authorization: Bearer $BOARD_KEY" | python3 -m json.tool
```

### Budget overview

```bash
curl -s "http://localhost:3100/api/companies/4068464a-69cf-4078-89a2-8ebaa8a9e217/budgets/overview" \
  -H "Authorization: Bearer $BOARD_KEY" | python3 -m json.tool
```

---

## Goal Operations

### Create a goal

```bash
curl -s -X POST "http://localhost:3100/api/companies/4068464a-69cf-4078-89a2-8ebaa8a9e217/goals" \
  -H "Authorization: Bearer $BOARD_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Goal Title",
    "description": "Purpose",
    "level": "team",
    "status": "active",
    "parentId": "<parent-goal-id>",
    "ownerAgentId": "<agent-id>"
  }'
```

Levels: `company`, `team`, `agent`, `task`.
Statuses: `planned`, `active`, `achieved`, `cancelled`.

### Update a goal

```bash
curl -s -X PATCH "http://localhost:3100/api/goals/<goal-id>" \
  -H "Authorization: Bearer $BOARD_KEY" \
  -H "Content-Type: application/json" \
  -d '{"status": "achieved"}'
```

### Delete a goal

```bash
curl -s -X DELETE "http://localhost:3100/api/goals/<goal-id>" \
  -H "Authorization: Bearer $BOARD_KEY"
```

---

## Agent Hiring

### Create + approve in one flow

```bash
# Create (returns pending_approval agent + approval)
RESULT=$(curl -s -X POST "http://localhost:3100/api/companies/4068464a-69cf-4078-89a2-8ebaa8a9e217/agent-hires" \
  -H "Authorization: Bearer $BOARD_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AgentName",
    "role": "engineer",
    "title": "Title",
    "icon": "wrench",
    "reportsTo": "3e075f88-b276-4e9f-8a61-6b2eaa962aa3",
    "capabilities": "What it does",
    "adapterType": "pi_local",
    "adapterConfig": {"cwd": "/Users/james/1-testytech/homelab", "model": "glm-4.7"},
    "runtimeConfig": {"heartbeat": {"enabled": true, "intervalSec": 86400, "wakeOnDemand": true, "maxConcurrentRuns": 1, "cooldownSec": 10}}
  }')

# Extract IDs
AGENT_ID=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['agent']['id'])")
APPROVAL_ID=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['approval']['id'])")

# Approve
curl -s -X POST "http://localhost:3100/api/approvals/$APPROVAL_ID/approve" \
  -H "Authorization: Bearer $BOARD_KEY" \
  -H "Content-Type: application/json" -d '{}'
```

After approval: write AGENTS.md and copy to the managed instructions path.

Available icons: `bot cpu brain zap rocket code terminal shield eye search wrench hammer lightbulb sparkles star heart flame bug cog database globe lock mail message-square file-code git-branch package puzzle target wand atom circuit-board radar swords telescope microscope crown`

Available roles: `ceo cto cmo cfo engineer designer pm qa devops researcher general`
