---
name: homelab-ops-troubleshoot
description: Use when troubleshooting, inspecting, or maintaining the HomeLab Paperclip company — agents, routines, goals, instructions, or overall operation. Triggers on "why isn't patrol running", "fix the agents", "tune the routines", "update agent instructions", "check the company", "homelab ops health", "release stuck issue", "agent is stuck", "routine not firing", or any question about HomeLab agent/company state.
---

# HomeLab Ops Troubleshoot

Diagnose and fix problems with the HomeLab Paperclip company — the agents, routines, goals, instructions, and operational plumbing that manage the homelab infrastructure. This skill is about the **control plane** (Paperclip), not the homelab hosts themselves.

Do not use this skill for direct homelab infrastructure work (SSH, patching, service restarts). That is the agents' job. Use this when the agents or their coordination is not working.

---

## Company Reference

```
Company ID:  4068464a-69cf-4078-89a2-8ebaa8a9e217
API:         http://localhost:3100
DB:          postgres://paperclip:paperclip@localhost:<port>/paperclip
```

Find the DB port with:
```bash
ps aux | grep postgres | grep '\-D' | grep -oP '\-p \K\d+' 2>/dev/null || ps aux | grep postgres | grep -o '\-p [0-9]*' | awk '{print $2}' | head -1
```

For the full agent/project/goal/routine inventory, see [references/company-inventory.md](references/company-inventory.md).

If you need a `$BOARD_KEY`, see [references/board-api-key.md](references/board-api-key.md).

---

## Phase 1: Understand What's Wrong

Start by identifying what the user is asking about:

| Symptom | Category | Jump to |
|---------|----------|---------|
| Agent not running, stuck, error status | Agent health | Phase 2A |
| Routine not firing, missed runs | Routine health | Phase 2B |
| Agent doing wrong thing, bad instructions | Instructions | Phase 2C |
| Goals not connected, dashboard empty | Goals/structure | Phase 2D |
| Want to add/remove/change agents | Company changes | Phase 2E |
| Need to pause/wake/terminate an agent | Agent operations | Phase 2F |
| Stuck checkout, manage issues directly | Issue operations | Phase 2G |
| Cost tracking, activity log, dashboard | Observability | Phase 2H |
| General "how's it going" health check | Full audit | Phase 2I |

If the request is ambiguous, ask one clarifying question. Don't block on a long interview — investigate and report what you find.

---

## Phase 2A: Agent Health

An agent might be in `error`, `paused`, `idle` when it should be running, or `running` and stuck.

### Gather state

```bash
# All agents with status
curl -s "http://localhost:3100/api/companies/4068464a-69cf-4078-89a2-8ebaa8a9e217/agents" \
  -H "Authorization: Bearer $BOARD_KEY" | python3 -m json.tool

# Specific agent
curl -s "http://localhost:3100/api/agents/<agent-id>" \
  -H "Authorization: Bearer $BOARD_KEY" | python3 -m json.tool
```

### Diagnose

| Status | Meaning | Common fixes |
|--------|---------|-------------|
| `idle` | Waiting for next trigger | Normal. Check heartbeat enabled or relies on routines. |
| `running` | Currently executing | Check if stuck — look at `lastHeartbeatAt` age. |
| `error` | Last run failed | Check server logs, adapter logs. Often model API error or instructions parse failure. |
| `paused` | Manually or auto-paused | Check `pauseReason`. Budget exhaustion causes auto-pause. |

### Check recent runs

```bash
curl -s "http://localhost:3100/api/agents/<agent-id>/runs?limit=5" \
  -H "Authorization: Bearer $BOARD_KEY" | python3 -m json.tool
```

Look at the most recent run's `status`, `startedAt`, `completedAt`, and any `error` field.

### Common fixes

- **Error from model failure**: Check the model is available. Try changing `adapterConfig.model`.
- **Agent never runs**: Check `runtimeConfig.heartbeat.enabled` — if false, it only wakes from routines or on-demand.
- **Agent paused (budget)**: Check `spentMonthlyCents` vs `budgetMonthlyCents`. A budget of 0 means unlimited.
- **Instructions parse error**: Read the agent's AGENTS.md file and check for syntax issues.

### Fix agent config

```bash
curl -s -X PATCH "http://localhost:3100/api/agents/<agent-id>" \
  -H "Authorization: Bearer $BOARD_KEY" \
  -H "Content-Type: application/json" \
  -d '{"field": "newValue"}'
```

Common patches: `adapterConfig.model`, `runtimeConfig.heartbeat`, `status` (set to `idle` to clear error).

---

## Phase 2B: Routine Health

Routines are the scheduled triggers of the company. If they stop firing, agents stop working.

### List all routines

```bash
curl -s "http://localhost:3100/api/companies/4068464a-69cf-4078-89a2-8ebaa8a9e217/routines" \
  -H "Authorization: Bearer $BOARD_KEY" | python3 -m json.tool
```

### Check a specific routine

```bash
curl -s "http://localhost:3100/api/routines/<routine-id>" \
  -H "Authorization: Bearer $BOARD_KEY" | python3 -m json.tool
```

Look at:
- `status`: must be `active`
- `triggers[].enabled`: must be `true`
- `triggers[].nextRunAt`: when will it fire next?
- `triggers[].lastFiredAt`: when did it last fire?
- `recentRuns`: did recent runs succeed or fail?

### Check routine runs

```bash
curl -s "http://localhost:3100/api/routines/<routine-id>/runs?limit=10" \
  -H "Authorization: Bearer $BOARD_KEY" | python3 -m json.tool
```

Run statuses: `pending`, `dispatched`, `completed`, `failed`, `coalesced`, `skipped`.

- **coalesced**: previous run was still active when this one fired — normal with `coalesce_if_active` policy.
- **skipped**: `skip_if_active` policy prevented a new run.
- **failed**: something went wrong dispatching. Check `failureReason`.

### Common fixes

- **Not firing**: Check `status` is `active` and trigger `enabled` is `true`. Check `nextRunAt` is in the future.
- **Runs coalescing**: Agent takes longer than the interval. Increase the interval or switch to `always_enqueue`.
- **Wrong schedule**:
  ```bash
  curl -s -X PATCH "http://localhost:3100/api/routine-triggers/<trigger-id>" \
    -H "Authorization: Bearer $BOARD_KEY" \
    -H "Content-Type: application/json" \
    -d '{"cronExpression": "*/30 * * * *", "timezone": "America/Chicago"}'
  ```

---

## Phase 2C: Agent Instructions

Instructions are markdown files that define what each agent does. Problems here mean agents behave incorrectly.

### Locate instructions

```
Deployed:  /Users/james/.paperclip/instances/default/companies/4068464a-69cf-4078-89a2-8ebaa8a9e217/agents/<agent-id>/instructions/
Source:    /Users/james/1-testytech/homelab/agent-instructions/<agent-name>/AGENTS.md
```

CEO agents have multiple instruction files: `AGENTS.md`, `HEARTBEAT.md`, `SOUL.md`, `TOOLS.md`. Specialists have `AGENTS.md` only.

### Read current instructions

Use the Read tool to open deployed or source files directly, or use bash:

```bash
cat "/Users/james/.paperclip/instances/default/companies/4068464a-69cf-4078-89a2-8ebaa8a9e217/agents/<agent-id>/instructions/AGENTS.md"
```

The homelab infrastructure index (hosts, services, runbooks) is at:
```
/Users/james/1-testytech/homelab/AGENTS.md
```

### Common instruction issues

- **Wrong IDs**: Agent IDs, project IDs, or goal IDs changed but instructions weren't updated. Cross-check against the API.
- **Terminology drift**: Instructions reference API endpoints that don't exist.
- **Missing context**: Agent doesn't know about a new host, service, or runbook.
- **Safety gaps**: Destructive action not gated by approval flow.

### Edit and deploy

1. Edit the source file in `homelab/agent-instructions/<name>/AGENTS.md`
2. Copy to the deployed location:
   ```bash
   cp /Users/james/1-testytech/homelab/agent-instructions/<name>/AGENTS.md \
      /Users/james/.paperclip/instances/default/companies/4068464a-69cf-4078-89a2-8ebaa8a9e217/agents/<agent-id>/instructions/AGENTS.md
   ```
3. The agent picks up changes on its next run — no restart needed.

---

## Phase 2D: Goals and Structure

Goals organize issues into a strategic hierarchy.

### List goals

```bash
curl -s "http://localhost:3100/api/companies/4068464a-69cf-4078-89a2-8ebaa8a9e217/goals" \
  -H "Authorization: Bearer $BOARD_KEY" | python3 -m json.tool
```

### Check goal hierarchy

Goals have `parentId` forming a tree. Verify:
- Company goal at the root
- Team goals under company
- Agent goals under team
- No orphans (goals with `parentId` pointing to deleted goals)

### Create a new goal

```bash
curl -s -X POST "http://localhost:3100/api/companies/4068464a-69cf-4078-89a2-8ebaa8a9e217/goals" \
  -H "Authorization: Bearer $BOARD_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Goal Title",
    "description": "What this goal means",
    "level": "team",
    "status": "active",
    "parentId": "<parent-goal-id>",
    "ownerAgentId": "<agent-id>"
  }'
```

Levels: `company`, `team`, `agent`, `task`. Statuses: `planned`, `active`, `achieved`, `cancelled`.

### Update a goal

```bash
curl -s -X PATCH "http://localhost:3100/api/goals/<goal-id>" \
  -H "Authorization: Bearer $BOARD_KEY" \
  -H "Content-Type: application/json" \
  -d '{"status": "achieved"}'
```

After changing goals, update agent instructions to reference the correct `goalId` values.

---

## Phase 2E: Company Changes

### Create a new agent

```bash
curl -s -X POST "http://localhost:3100/api/companies/4068464a-69cf-4078-89a2-8ebaa8a9e217/agent-hires" \
  -H "Authorization: Bearer $BOARD_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AgentName",
    "role": "engineer",
    "title": "Human-readable title",
    "icon": "wrench",
    "reportsTo": "<ceo-agent-id>",
    "capabilities": "What this agent does",
    "adapterType": "pi_local",
    "adapterConfig": {"cwd": "/Users/james/1-testytech/homelab", "model": "glm-4.7"},
    "runtimeConfig": {"heartbeat": {"enabled": true, "intervalSec": 86400, "wakeOnDemand": true, "maxConcurrentRuns": 1, "cooldownSec": 10}}
  }'
```

Then approve:
```bash
curl -s -X POST "http://localhost:3100/api/approvals/<approval-id>/approve" \
  -H "Authorization: Bearer $BOARD_KEY" \
  -H "Content-Type: application/json" -d '{}'
```

After creation, write AGENTS.md and copy to the managed instructions path.

### Delete an agent

```bash
curl -s -X DELETE "http://localhost:3100/api/agents/<agent-id>" \
  -H "Authorization: Bearer $BOARD_KEY"
```

**Destructive** — confirm with the user first. Also clean up any routines assigned to the deleted agent.

### Create a project

```bash
curl -s -X POST "http://localhost:3100/api/companies/4068464a-69cf-4078-89a2-8ebaa8a9e217/projects" \
  -H "Authorization: Bearer $BOARD_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Project Name",
    "description": "What this project covers",
    "status": "in_progress",
    "workspace": {"sourceType": "non_git_path", "cwd": "/Users/james/1-testytech/homelab"}
  }'
```

---

## Phase 2F: Agent Operations (Pause/Resume/Wake/Terminate)

For exact API commands, see [references/api-operations.md](references/api-operations.md).

| Action | When to use |
|--------|------------|
| **Pause** | Stop an agent from running (maintenance, misbehaving) |
| **Resume** | Unpause an agent |
| **Wakeup** | Trigger an immediate run (test after fixing) |
| **Terminate** | Kill a stuck `running` agent |
| **Cancel run** | Cancel a specific run |
| **Reset session** | Clear Pi session state (agent confused/stuck) |
| **View run log** | Most useful diagnostic — shows exactly what happened |

Common troubleshooting flow:
1. Check agent status and last run time
2. If `running` and stuck → **terminate**, then check run log for errors
3. If `error` → check run log, fix the issue, **wakeup** to test
4. If confused/looping → **reset session**, then **wakeup**

---

## Phase 2G: Issue Operations

For managing issues directly. Full API commands in [references/api-operations.md](references/api-operations.md).

Common operations:
- **Release stuck checkout** — agent crashed mid-work, issue is locked
- **Add comment** — inject manual context into an issue thread
- **Cancel stale issues** — bulk-close blocked/stale work
- **Delete issues** — remove test/duplicate issues (destructive, confirm first)
- **View comments** — read the full conversation thread on an issue

---

## Phase 2H: Observability and Costs

Full API commands in [references/api-operations.md](references/api-operations.md).

Key queries:
- **Activity log** — recent actions by all agents (who did what, when)
- **Live runs** — which agents are running right now
- **Dashboard** — aggregated company stats
- **Cost summary** — total spend across the company
- **Cost by agent** — which agents are most expensive
- **Budget overview** — spend vs budget per agent

These are read-only and safe to run anytime.

---

## Phase 2I: Full Health Audit

When the user wants an overall check, run through everything:

1. **Agents**: List all, check status, last run, any errors
2. **Routines**: List all, check triggers, recent runs, any failures
3. **Goals**: List hierarchy, check for orphans
4. **Projects**: List all, verify workspace paths
5. **Issues**: Check for stale blocked/in_progress issues
6. **Instructions**: Spot-check that deployed instructions match source copies
7. **Approvals**: Check for stale pending approvals

```bash
# Quick agent health
curl -s "http://localhost:3100/api/companies/4068464a-69cf-4078-89a2-8ebaa8a9e217/agents" \
  -H "Authorization: Bearer $BOARD_KEY" | python3 -c "
import sys, json
for a in json.load(sys.stdin):
    hb = a.get('lastHeartbeatAt', 'never')
    print(f'{a[\"name\"]:15} status={a[\"status\"]:10} lastRun={hb}')
"

# Quick routine health
curl -s "http://localhost:3100/api/companies/4068464a-69cf-4078-89a2-8ebaa8a9e217/routines" \
  -H "Authorization: Bearer $BOARD_KEY" | python3 -c "
import sys, json
for r in json.load(sys.stdin):
    t = r.get('triggers',[{}])[0] if r.get('triggers') else {}
    print(f'{r[\"title\"]:30} status={r[\"status\"]:8} lastFired={t.get(\"lastFiredAt\",\"never\")}')
"

# Stale issues
curl -s "http://localhost:3100/api/companies/4068464a-69cf-4078-89a2-8ebaa8a9e217/issues?status=blocked,in_progress" \
  -H "Authorization: Bearer $BOARD_KEY" | python3 -c "
import sys, json
issues = json.load(sys.stdin)
if isinstance(issues, list):
    for i in issues:
        print(f'{i.get(\"identifier\",\"?\"):10} {i[\"status\"]:12} {i[\"title\"][:50]}')
elif isinstance(issues, dict) and 'items' in issues:
    for i in issues['items']:
        print(f'{i.get(\"identifier\",\"?\"):10} {i[\"status\"]:12} {i[\"title\"][:50]}')
"

# Pending approvals
curl -s "http://localhost:3100/api/companies/4068464a-69cf-4078-89a2-8ebaa8a9e217/approvals?status=pending" \
  -H "Authorization: Bearer $BOARD_KEY" | python3 -c "
import sys, json
for a in json.load(sys.stdin):
    print(f'{a[\"type\"]:25} {a[\"createdAt\"][:10]}  {a.get(\"payload\",{}).get(\"name\",\"\")}')
"
```

Present findings as a structured report with status indicators (healthy, warning, broken) and recommended actions.

---

## Phase 3: Apply Fixes

After diagnosing, apply fixes. Always:

1. **Explain what you're going to change** before changing it
2. **Confirm destructive actions** with the user (deleting agents, archiving routines, clearing error state)
3. **Verify after fixing** — re-query the API to confirm the change took effect
4. **Sync source copies** — if you edit deployed instructions, copy back to `homelab/agent-instructions/`

For bulk instruction updates across multiple agents (e.g. updating a shared ID or endpoint), use a Python script to make consistent changes rather than editing each file manually.

---

## Phase 4: Report

Summarize what was found and fixed:

```
## HomeLab Ops Report

### Investigated
- <what was checked>

### Findings
- <what was wrong>

### Actions Taken
- <what was fixed>

### Verified
- <confirmation that fixes work>

### Recommendations
- <anything that should be done but wasn't in scope>
```

---

## Guidance

**Query the API, don't guess.** Agent IDs, goal IDs, and routine IDs change. Always verify against live state.

**The source of truth is the API, not files.** If an agent's DB record says model X but the instructions reference model Y, the DB wins for runtime config.

**Don't fix what isn't broken.** If the user asks about one agent, don't audit the entire company unless asked.

**Instructions take effect on the agent's next run.** No restart needed after editing AGENTS.md.

**When in doubt about Paperclip API**, the `paperclip` skill has the full API reference.
