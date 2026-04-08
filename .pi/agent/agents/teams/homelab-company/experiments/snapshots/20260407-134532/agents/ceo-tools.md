# Tools

## Paperclip API

Use the `paperclip` skill for all coordination: task management, approvals, routines, agent management.

Key endpoints for your strategic role:

### Agent Health & Cost
- `GET /api/companies/{companyId}/agents` — all agents with status, spend, last heartbeat, model config
- `GET /api/agents/{agentId}` — detailed agent state
- `PATCH /api/agents/{agentId}` — fix agent config (reset status, change model, adjust heartbeat)

### Routine Health
- `GET /api/companies/{companyId}/routines` — all routines with triggers, last run, status
- `GET /api/routines/{routineId}/runs?limit=10` — recent run history (look for failures, coalescing)
- `PATCH /api/routine-triggers/{triggerId}` — adjust schedule

### Backlog & Approvals
- `GET /api/companies/{companyId}/issues?status=blocked` — blocked work
- `GET /api/companies/{companyId}/issues?status=todo` — pending backlog
- `GET /api/companies/{companyId}/approvals?status=pending` — stale approvals

### Your Inbox
- `GET /api/agents/me` — your identity, budget, spend
- `GET /api/agents/me/inbox-lite` — your assignments
- `POST /api/issues/{id}/checkout` — claim a task
- `PATCH /api/issues/{id}` — update status, add comments

### Agent Management
- `POST /api/companies/{companyId}/agent-hires` — hire new agents
- `DELETE /api/agents/{agentId}` — decommission agents (confirm with board first)

## OpsLead

Your operations manager (`7c040a50-5b26-4849-83f7-a110f07f6059`) handles day-to-day task triage and delegation. If operational tasks are misrouted to you, reassign to OpsLead.

## Observer Daily Digest

Your primary input for operational decisions. Observer (`1bb2554c-9ec3-4360-9413-41bf6043587f`) produces a daily report covering:
- Agent performance and health
- Issue backlog per project
- Routine execution status
- Anomaly detection
- Trend analysis (improving/worsening)
- Recommendations for your action

Find the latest digest by checking Observer's most recently completed routine execution issue.

## Telegram Notifications

Send critical notifications to James via Telegram:

```bash
TMPFILE=$(mktemp)
cat > "$TMPFILE" << 'EOF'
⚠️ <b>CEO Alert</b>

BuildOps in error state for 12h — model tool-calling failures.
Recommend switching to grok-4.1-fast.

Patrol projected at $170/month (62% of total).
Recommend reducing Security Patrol from every 30min to every 2h.

<b>Action needed:</b> Approve changes?
EOF
/Users/james/1-testytech/homelab/scripts/send-telegram.sh "$TMPFILE"
rm -f "$TMPFILE"
```

Use HTML formatting: `<b>bold</b>`, `<i>italic</i>`, `<code>code</code>`.

Send for: cost anomalies, agent errors, stuck approvals, strategic recommendations.
Do NOT send for: routine status updates (Observer handles the daily digest via Telegram).

## Memory

Use `para-memory-files` skill for persistent memory across heartbeats. Critical for:
- Cost snapshots (track spend over time to detect trends)
- Agent health events (error history, model changes)
- Weekly strategic reviews

## Hiring

Use `paperclip-create-agent` skill when you need to hire new agents.

## Infrastructure Reference

These files are your source of truth for the homelab. Read them — do not SSH to hosts yourself.

| Reference | Path |
|-----------|------|
| **Full host inventory** | `/Users/james/1-testytech/homelab/AGENTS.md` |
| **Service docs** | `/Users/james/1-testytech/homelab/services/*.md` |
| **Host docs** | `/Users/james/1-testytech/homelab/hosts/*.md` |
| **Runbooks** | `/Users/james/1-testytech/homelab/artifacts/runbooks/` |
| **Wazuh admin guide** | `/Users/james/1-testytech/homelab/artifacts/docs/guides/wazuh-administration-guide.md` |
| **Ansible playbooks** | `/Users/james/1-testytech/homelab/ansible/` |
