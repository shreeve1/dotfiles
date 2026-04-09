# Tools

## Default Tooling

- `paperclip` — all coordination: tasks, approvals, routines, and agent management
- `para-memory-files` — cost snapshots, agent health history, weekly reviews
- `paperclip-create-agent` — hiring and staffing changes
- Misrouted operational work goes to **OpsLead** (`7c040a50-5b26-4849-83f7-a110f07f6059`)

## Paperclip Endpoints

### Self / Work
- `GET /api/agents/me` — identity, budget, spend
- `GET /api/agents/me/inbox-lite` — assigned work
- `POST /api/issues/{id}/checkout` — claim assigned work
- `PATCH /api/issues/{id}` — update status or comment

### Company State
- `GET /api/companies/{companyId}/issues?status=blocked` — blocked work
- `GET /api/companies/{companyId}/issues?status=todo` — backlog
- `GET /api/companies/{companyId}/approvals?status=pending` — pending / stale approvals
- `GET /api/companies/{companyId}/agents` — status, spend, heartbeat, model config
- `GET /api/agents/{agentId}` — detailed agent state
- `PATCH /api/agents/{agentId}` — reset status, change model, adjust heartbeat
- `GET /api/companies/{companyId}/routines` — routine status overview
- `GET /api/routines/{routineId}/runs?limit=10` — recent failures or coalescing

### Lifecycle
- `POST /api/companies/{companyId}/agent-hires` — hire agents
- `DELETE /api/agents/{agentId}` — decommission agents (board confirmation required)

## Board Alerts

Use `/Users/james/1-testytech/homelab/scripts/send-telegram.sh`.

- HTML only: `<b>bold</b>`, `<i>italic</i>`, `<code>code</code>`
- Send for cost anomalies, agent errors, stuck approvals, strategic recommendations
- Skip routine status updates (Observer covers those)

## Local References

Read local docs before any SSH.

| Reference | Path |
|-----------|------|
| Host inventory | `/Users/james/1-testytech/homelab/AGENTS.md` |
| Service docs | `/Users/james/1-testytech/homelab/services/*.md` |
| Host docs | `/Users/james/1-testytech/homelab/hosts/*.md` |
| Runbooks | `/Users/james/1-testytech/homelab/artifacts/runbooks/` |
| Wazuh admin | `/Users/james/1-testytech/homelab/artifacts/docs/guides/wazuh-administration-guide.md` |
| Ansible playbooks | `/Users/james/1-testytech/homelab/ansible/` |

## API Rules

- Always include `X-Paperclip-Run-Id: $PAPERCLIP_RUN_ID` on mutating calls
- Always set `goalId` and `projectId` when creating issues
- Comment in concise markdown: status line + bullets + links
