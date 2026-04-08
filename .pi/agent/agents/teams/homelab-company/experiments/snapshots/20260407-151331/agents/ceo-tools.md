# Tools

## Paperclip Coordination

Use the `paperclip` skill for all coordination: tasks, approvals, routines, agent management.

### Agent Health & Config
- `GET /api/companies/{companyId}/agents` — all agents with status, spend, last heartbeat, model config
- `GET /api/agents/{agentId}` — detailed agent state
- `PATCH /api/agents/{agentId}` — fix agent config (reset status, change model, adjust heartbeat)

### Routine Health
- `GET /api/companies/{companyId}/routines` — all routines with triggers, last run, status
- `GET /api/routines/{routineId}/runs?limit=10` — recent run history (failures, coalescing)

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

**OpsLead** (`7c040a50-5b26-4849-83f7-a110f07f6059`) handles operational triage. Reassign misrouted operational tasks there.

## Telegram Notifications

Send critical alerts to James via the Telegram script:

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

Use HTML: `<b>bold</b>`, `<i>italic</i>`, `<code>code</code>`.

**Send for:** cost anomalies, agent errors, stuck approvals, strategic recommendations.  
**Do NOT send for:** routine status updates (Observer's daily digest handles those).

## Memory

Use `para-memory-files` skill for persistent memory across heartbeats:
- **Cost snapshots** — track spend to detect trends
- **Agent health events** — error history, model changes
- **Weekly strategic reviews** — produce and record once per week

## Hiring

Use `paperclip-create-agent` skill when recommending new hires to the board.

## Infrastructure Reference

Read these local files — do not SSH to hosts directly.

| Reference | Path |
|-----------|------|
| **Host inventory** | `/Users/james/1-testytech/homelab/AGENTS.md` |
| **Service docs** | `/Users/james/1-testytech/homelab/services/*.md` |
| **Host docs** | `/Users/james/1-testytech/homelab/hosts/*.md` |
| **Runbooks** | `/Users/james/1-testytech/homelab/artifacts/runbooks/` |
| **Wazuh admin** | `/Users/james/1-testytech/homelab/artifacts/docs/guides/wazuh-administration-guide.md` |
| **Ansible playbooks** | `/Users/james/1-testytech/homelab/ansible/` |

## API Rules

- Always include `X-Paperclip-Run-Id: $PAPERCLIP_RUN_ID` header on mutating calls
- Always set `goalId` and `projectId` when creating issues
- Comment in concise markdown: status line + bullets + links
