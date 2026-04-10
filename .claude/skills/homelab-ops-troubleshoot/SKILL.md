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
| Approval approved but nothing happened | Approval flow | Phase 2J |
| Executor not executing after approval | Approval flow | Phase 2J |
| Agent confused on wake, wrong behavior | Agent confusion | Phase 2K |

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

### Check session health (Pi agents)

```bash
curl -s "http://localhost:3100/api/agents/<agent-id>/runtime-state" \
  -H "Authorization: Bearer $BOARD_KEY" | python3 -m json.tool
```

Look at `totalCachedInputTokens`:
- **>10M tokens** — session dangerously large, preemptive reset recommended
- **>20M tokens** — reset immediately, agent is likely producing garbled output

Reset a corrupted session:
```bash
curl -s -X POST "http://localhost:3100/api/agents/<agent-id>/runtime-state/reset-session" \
  -H "Authorization: Bearer $BOARD_KEY" \
  -H "Content-Type: application/json" -d '{}'
```

### Common fixes

- **Error from model failure**: Check the model is available. Try changing `adapterConfig.model`.
- **Agent never runs**: Check `runtimeConfig.heartbeat.enabled` — if false, it only wakes from routines or on-demand.
- **Agent paused (budget)**: Check `spentMonthlyCents` vs `budgetMonthlyCents`. A budget of 0 means unlimited.
- **Instructions parse error**: Read the agent's AGENTS.md file and check for syntax issues.
- **Session corrupted (garbled output, stuttering, bailing early)**: Reset the Pi session (see above). The agent picks up fresh on next run.

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
- **Wake procedure missing or outdated**: Check the standard structure below.

### Wake procedure audit checklist

All agents should have a "Wake Procedure" section. Check for:

- [ ] Named "Wake Procedure" (not "Heartbeat Procedure" or "Heartbeat Workflow")
- [ ] **Step 0 — Fresh start**: "Discard any context from prior sessions"
- [ ] **Step 1 — Identity**: `GET /api/agents/me`
- [ ] **Step 2 — Approval follow-up** (analysts): Branches on `PAPERCLIP_APPROVAL_ID`, reads `PAPERCLIP_APPROVAL_STATUS` and `PAPERCLIP_LINKED_ISSUE_IDS`, reassigns to executor and sets `todo`
- [ ] **Step 2 — Approval context** (executors): Notes `PAPERCLIP_APPROVAL_ID` for use in "Finding the Approval"
- [ ] **Step 3 — Comment context**: Checks `PAPERCLIP_WAKE_COMMENT_ID`
- [ ] **Step 4 — Assignments**: Checks inbox, prioritizes `PAPERCLIP_TASK_ID`
- [ ] **No premature reassignment** (analysts): Planning handoff says "keep assigned to you" and "set to blocked", NOT "reassign to executor"

Agent roles for reference:

| Role | Agents | Wake procedure type |
|------|--------|-------------------|
| Analyst | DockerOps, SecOps, MediaOps, NetOps, StorageOps | Standard analyst (Steps 0-4 + domain work) |
| Executor | BuildOps, PatchOps | Executor (Steps 0-4 + Finding the Approval + execute) |
| Manager | CEO, OpsLead | Custom (multi-phase audit + delegation) |
| Detector | Patrol | Minimal (Step 0 + task ID + runbook dispatch) |
| Observer | Observer | Minimal (Step 0 + routine execution issue) |
| Responder | Responder | Two modes (Paperclip task + webhook) |

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
6. **Instructions**: Spot-check that deployed instructions match source copies. Verify all agents have the standard Wake Procedure (Step 0 fresh start, approval follow-up, comment context, assignments).
7. **Approvals**: Check for stale pending approvals. Check for approved approvals whose linked issues are still `blocked` (analyst didn't follow up).
8. **Approval flow**: Verify no analyst has reassigned an issue to an executor without an approved approval (Option A violation).

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

```bash
# Approved approvals with blocked linked issues (analyst didn't follow up)
curl -s "http://localhost:3100/api/companies/4068464a-69cf-4078-89a2-8ebaa8a9e217/approvals?status=approved" \
  -H "Authorization: Bearer $BOARD_KEY" | python3 -c "
import sys, json
for a in json.load(sys.stdin):
    ids = a.get('issueIds', [])
    if ids:
        print(f'Approval {a[\"id\"][:8]}  type={a[\"type\"]:20} linkedIssues={ids}')
"

# Cross-check: are any linked issues still blocked?
# For each issue ID from above, check status
```

Present findings as a structured report with status indicators (healthy, warning, broken) and recommended actions.

---

## Phase 2J: Approval Flow

When an approval was approved but nothing happened — the executor never executed.

### Expected flow (Option A)

```
Patrol → issue assigned to analyst → analyst investigates → creates approval → blocks issue (keeps assigned to self)
→ board approves → analyst wakes (PAPERCLIP_APPROVAL_ID set) → reassigns to executor, sets to todo → executor wakes → executes
```

### Diagnose the break point

1. **Was the approval actually approved?**
   ```bash
   curl -s "http://localhost:3100/api/approvals/<approval-id>" \
     -H "Authorization: Bearer $BOARD_KEY" | python3 -m json.tool
   ```
   Check `status`. If still `pending` — the board hasn't acted yet.

2. **Was the analyst woken?** Check activity log for the analyst after approval time:
   ```bash
   curl -s "http://localhost:3100/api/companies/4068464a-69cf-4078-89a2-8ebaa8a9e217/activity?agentId=<analyst-agent-id>&limit=10" \
     -H "Authorization: Bearer $BOARD_KEY" | python3 -m json.tool
   ```

3. **Is the issue still blocked and assigned to the analyst?** This means the analyst woke but didn't follow through on Step 2 (approval follow-up), or didn't wake at all.
   ```bash
   curl -s "http://localhost:3100/api/issues/<issue-id>" \
     -H "Authorization: Bearer $BOARD_KEY" | python3 -c "
   import sys, json
   i = json.load(sys.stdin)
   print(f'status={i[\"status\"]}  assignee={i[\"assigneeAgentId\"]}')
   "
   ```

4. **Is the issue assigned to the executor but still blocked/todo?** The executor may have failed or not woken.

### Common fixes

- **Analyst didn't wake**: Check agent status (error? paused?). Reset if needed, then wake manually.
- **Analyst woke but didn't follow up**: Check the run log — likely the wake procedure is missing or the agent was confused. Verify instructions have the standard Wake Procedure Step 2.
- **Executor didn't wake after reassignment**: Manually wake the executor, or add a comment on the issue to trigger an `issue_commented` wake.
- **Manual unblock**: Reassign the issue to the executor, set to `todo`, and comment with the approval ID. This is what the analyst's Step 2 should have done.

---

## Phase 2K: Agent Confusion

When an agent wakes but behaves incorrectly — stuttering, ignoring context, doing the wrong thing.

### Symptoms and causes

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Same thought repeated 3+ times before acting | Model behavior (MiniMax-M2.5 prone to this) | Change `effort`/`thinking` settings or switch model |
| "I've just completed the previous task" | Session state bleed from prior run | Add Step 0 to instructions; reset session for immediate relief |
| Checks inbox first, ignores wake reason | Wake procedure is a suggestion list, not a decision tree | Rewrite as numbered steps with explicit env var checks |
| Agent confused about what to do with `approval_approved` | Missing or vague approval follow-up in wake procedure | Add standard Step 2 with `PAPERCLIP_APPROVAL_ID` branching |
| Agent tries to checkout an issue assigned to someone else (409) | Approval follow-up tries to checkout linked issues | Add "Do NOT checkout" to Step 2 |
| Garbled output, single-character responses, meta-commentary | Session corruption (token count too high) | Reset session via `POST /api/agents/{id}/runtime-state/reset-session` |

### Diagnostic steps

1. **Read the run log** — most useful single diagnostic. Shows exactly what the agent did.
2. **Check session health** — `GET /api/agents/{id}/runtime-state` → `totalCachedInputTokens`
3. **Read the instructions** — does the agent have the standard Wake Procedure? Is Step 0 present?
4. **Check the wake context** — what env vars were set for this run? The activity log shows the contextSnapshot.

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

## Verify Against Paperclip Documentation

Before proposing instruction changes or diagnosing wake/approval/lifecycle issues, **check the Paperclip source code and docs** to confirm how the platform actually works. Do not rely on assumptions or agent instructions alone — the runtime behavior is defined in the codebase.

**Paperclip repo:** `https://github.com/paperclipai/paperclip`
**Local checkout:** `/Users/james/1-testytech/paperclip`

### Key reference files

| Topic | Where to look |
|-------|--------------|
| Wake reasons, issue statuses, approval statuses, invocation sources | `packages/shared/src/constants.ts` |
| Heartbeat protocol (official agent contract) | `docs/guides/agent-developer/heartbeat-protocol.md` |
| Approval handling (agent-side) | `docs/guides/agent-developer/handling-approvals.md` |
| Env var injection (what agents actually receive) | `packages/adapters/pi-local/src/server/execute.ts` (or `claude-local`) |
| Approval wake trigger (what happens on approve/reject) | `server/src/routes/approvals.ts` |
| Issue assignment wake trigger | `server/src/services/issue-assignment-wakeup.ts` |
| Comment/mention wake triggers | `server/src/routes/issues.ts` |

### When to verify

- **Editing wake/heartbeat procedures** — check which env vars are actually injected and under what conditions
- **Changing approval flows** — check whether approvals/rejections trigger wakes, and who gets woken
- **Modifying issue lifecycle** — check valid statuses and transitions
- **Adding new env var references to instructions** — confirm the adapter actually sets them

---

## Best Practices (Lessons Learned)

### Wake procedure design

- **Name it "Wake Procedure", not "Heartbeat Procedure."** Agents wake from many triggers (assignment, approval, comment, routine), not just heartbeats. Calling it "heartbeat" causes agents to skip the procedure on non-heartbeat wakes.
- **Step 0: Always start fresh.** Pi agents carry session state across runs. Without an explicit "discard prior context" instruction, agents bleed state from previous runs ("I've just completed the previous task...") and waste cycles on stale context.
- **Branch on `PAPERCLIP_APPROVAL_ID`, not `PAPERCLIP_WAKE_REASON`.** The approval ID is the primary signal for approval follow-up. `PAPERCLIP_WAKE_REASON` may be empty for assignment wakes (the contextSnapshot doesn't always include it).
- **Rejections don't trigger wakes.** Only `approved` triggers an agent wake. `rejected` and `revision_requested` do not. Don't write "if rejected" branches in wake procedures — they're dead code. CEO and OpsLead catch rejections via polling.
- **Approval wakes target the requester, not the executor.** When a board approves, the agent who *requested* the approval is woken — not the agent the issue is assigned to. Design the follow-up flow accordingly.

### Approval handoff flow (Option A)

- **Don't reassign to executors before approval.** If you reassign an issue to BuildOps/PatchOps while the approval is still pending, the executor wakes, finds no approved plan, posts noise ("Approval still pending"), and exits — wasting a run. Instead: analyst creates approval → blocks issue → keeps it assigned to self. On approval wake, the analyst reassigns to the executor and sets the issue to `todo`.
- **The comment is the wake mechanism.** When the analyst comments on a linked issue during approval follow-up, it triggers an `issue_commented` wake for the current assignee (the executor). This is how the executor gets activated after approval.
- **"Do NOT checkout" on approval follow-up.** During Step 2 (approval follow-up), the analyst must not try to checkout the linked issue — it may be assigned to someone else or already checked out, causing a 409.

### Env vars available to agents

All adapters (pi_local, claude_local, codex_local) inject these from the contextSnapshot:

| Env Var | Set When | Contains |
|---------|----------|----------|
| `PAPERCLIP_TASK_ID` | Always (if context has taskId or issueId) | Primary issue ID |
| `PAPERCLIP_WAKE_REASON` | Approval/comment wakes (NOT assignment wakes) | `approval_approved`, `issue_assigned`, `issue_commented`, `issue_comment_mentioned`, `issue_reopened_via_comment` |
| `PAPERCLIP_WAKE_COMMENT_ID` | Comment-triggered wakes | Comment ID that triggered wake |
| `PAPERCLIP_APPROVAL_ID` | Approval wakes only | Resolved approval ID |
| `PAPERCLIP_APPROVAL_STATUS` | Approval wakes only | `approved` (rejections don't wake) |
| `PAPERCLIP_LINKED_ISSUE_IDS` | Approval wakes only | Comma-separated issue IDs |

### Instruction consistency

- **All analyst agents should have identical wake procedure structure** (Steps 0-4) with only the executor routing customized. SecOps routes to PatchOps or BuildOps depending on work type; all others route to BuildOps only.
- **All executor agents should have identical wake procedure structure** with a "Finding the Approval" section that has 3 fallback mechanisms (env var → company approvals query → issue comments).
- **When editing instructions for one agent, audit all agents** for the same section to keep them in sync.
- **Source files live in `homelab/agent-instructions/<name>/`; deployed copies in the managed instructions path.** Always edit source first, then deploy. Never edit only the deployed copy.

### Troubleshooting agent confusion

- **Repeated reasoning (stuttering)** — agent outputs the same thought 3+ times before acting. Usually a model behavior issue (MiniMax-M2.5 is prone to this). Consider changing `effort`/`thinking` settings or switching models.
- **"I've just completed the previous task"** — session state bleed from a prior run. Fix: add Step 0 (Fresh start) to instructions. For immediate relief: reset the Pi session via `POST /api/agents/{id}/runtime-state/reset-session`.
- **Agent checks inbox first, ignoring wake reason** — instructions don't strongly signal "read env vars BEFORE checking inbox." Fix: make the wake procedure a decision tree with numbered steps, not a suggestion list.

---

## Guidance

**Query the API, don't guess.** Agent IDs, goal IDs, and routine IDs change. Always verify against live state.

**The source of truth is the API, not files.** If an agent's DB record says model X but the instructions reference model Y, the DB wins for runtime config.

**Don't fix what isn't broken.** If the user asks about one agent, don't audit the entire company unless asked.

**Instructions take effect on the agent's next run.** No restart needed after editing AGENTS.md.

**When in doubt about Paperclip API**, the `paperclip` skill has the full API reference.

**When in doubt about Paperclip runtime behavior**, check the source code at `/Users/james/1-testytech/paperclip` or `https://github.com/paperclipai/paperclip`.
