# Tools

## Use the Right Tool

- `paperclip` — all coordination: tasks, approvals, routines, and agent management
- `para-memory-files` — cost snapshots, agent health events, weekly strategic reviews
- `paperclip-create-agent` — hiring recommendations
- Misrouted operational work goes to **OpsLead** (`7c040a50-5b26-4849-83f7-a110f07f6059`)

## Paperclip Quick Reference

### Self / Inbox
- `GET /api/agents/me` — identity, budget, spend
- `GET /api/agents/me/inbox-lite` — current assignments
- `POST /api/issues/{id}/checkout` — claim assigned work
- `PATCH /api/issues/{id}` — update status or comment

### Backlog / Approvals
- `GET /api/companies/{companyId}/issues?status=blocked` — blocked work
- `GET /api/companies/{companyId}/issues?status=todo` — pending backlog
- `GET /api/companies/{companyId}/approvals?status=pending` — pending / stale approvals

### Agents / Routines
- `GET /api/companies/{companyId}/agents` — status, spend, last heartbeat, model config
- `GET /api/agents/{agentId}` — detailed agent state
- `PATCH /api/agents/{agentId}` — reset status, change model, adjust heartbeat
- `GET /api/companies/{companyId}/routines` — trigger + status overview
- `GET /api/routines/{routineId}/runs?limit=10` — recent failures or coalescing

### Hiring / Lifecycle
- `POST /api/companies/{companyId}/agent-hires` — hire new agents
- `DELETE /api/agents/{agentId}` — decommission agents (board confirmation required)

## Board Alerts

Use `/Users/james/1-testytech/homelab/scripts/send-telegram.sh` for critical board notifications.

- HTML only: `<b>bold</b>`, `<i>italic</i>`, `<code>code</code>`
- **Send for:** cost anomalies, agent errors, stuck approvals, strategic recommendations
- **Do not send for:** routine status updates (Observer covers those)

## Local References

Read local docs first — do not SSH to hosts directly.

| Reference | Path |
|-----------|------|
| **Host inventory** | `/Users/james/1-testytech/homelab/AGENTS.md` |
| **Service docs** | `/Users/james/1-testytech/homelab/services/*.md` |
| **Host docs** | `/Users/james/1-testytech/homelab/hosts/*.md` |
| **Runbooks** | `/Users/james/1-testytech/homelab/artifacts/runbooks/` |
| **Wazuh admin** | `/Users/james/1-testytech/homelab/artifacts/docs/guides/wazuh-administration-guide.md` |
| **Ansible playbooks** | `/Users/james/1-testytech/homelab/ansible/` |

## API Rules

- Always include `X-Paperclip-Run-Id: $PAPERCLIP_RUN_ID` on mutating calls
- Always set `goalId` and `projectId` when creating issues
- Comment in concise markdown: status line + bullets + links
