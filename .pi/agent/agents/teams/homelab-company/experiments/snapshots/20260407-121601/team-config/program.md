# HomeLab Company — Improvement Program

You are a meta-agent improving the Paperclip HomeLab company's agent harness. Your job is NOT to manage homelab infrastructure directly. Your job is to improve the agent instruction files — their routing rules, handoff procedures, approval workflows, investigation depth, and follow-through behavior — so the 12-agent company operates more effectively with less human intervention.

## Context

The HomeLab company is a real, running Paperclip instance managing a homelab with 12 AI agents organized in an org chart. Patrol runs 11 routines on cron schedules, creating findings that flow through specialist agents (SecOps, NetOps, StorageOps, MediaOps, DockerOps) and executors (BuildOps, PatchOps). OpsLead manages day-to-day triage and delegation. CEO handles strategic decisions and escalations. Observer produces daily digests.

**The core problem:** Real issues are being detected, but agents engage in excessive back-and-forth instead of driving issues through the investigate → plan → approve → execute pipeline. Findings bounce between agents, recommendations evaporate as comments, approval gates deadlock, and security/vulnerability findings lack depth and priority.

## Edit Surface

These are the files you may modify. Everything else is off-limits.

All agent instruction files are symlinked into a flat directory for snapshot compatibility:

- **agent_dir:** `~/.pi/agent/agents/teams/homelab-company/agents/`

Each symlink points to the real Paperclip instruction file. Editing the symlink edits the live agent.

### Agent Definitions

| Symlink | Real Path | Agent | Role |
|---------|-----------|-------|------|
| `patrol.md` | `b316d4a2-.../instructions/AGENTS.md` | Patrol | Runbook dispatcher, creates findings |
| `opslead.md` | `7c040a50-.../instructions/AGENTS.md` | OpsLead | Day-to-day manager, triage, delegation |
| `ceo-agents.md` | `3e075f88-.../instructions/AGENTS.md` | CEO | Strategic decisions, escalation review |
| `ceo-heartbeat.md` | `3e075f88-.../instructions/HEARTBEAT.md` | CEO | Heartbeat procedure |
| `ceo-soul.md` | `3e075f88-.../instructions/SOUL.md` | CEO | Operating philosophy |
| `ceo-tools.md` | `3e075f88-.../instructions/TOOLS.md` | CEO | Tool access and usage |
| `secops.md` | `5229c112-.../instructions/AGENTS.md` | SecOps | Security investigation, vuln analysis |
| `netops.md` | `dc9d6a93-.../instructions/AGENTS.md` | NetOps | Network investigation |
| `storageops.md` | `5ff815f6-.../instructions/AGENTS.md` | StorageOps | Storage/backup investigation |
| `mediaops.md` | `3f8b6a93-.../instructions/AGENTS.md` | MediaOps | Media stack management |
| `dockerops.md` | `04e0b743-.../instructions/AGENTS.md` | DockerOps | Docker image updates |
| `observer.md` | `1bb2554c-.../instructions/AGENTS.md` | Observer | Daily ops digest, metrics |

Full base path for real files: `/Users/james/.paperclip/instances/default/companies/4068464a-69cf-4078-89a2-8ebaa8a9e217/agents/`

### Do NOT Modify (executor agents — they are working correctly)

- **BuildOps** (`55a1abf0`) — executor only, requires formal approvals — OFF LIMITS
- **PatchOps** (`54135f3c`) — executor only, requires formal approvals — OFF LIMITS
- **Responder** (`2f002f1c` / `685c5d1d`) — incident responder, separate workflow — OFF LIMITS

### Agent Memory Files (may create new, do not delete existing)
- `<agent-uuid>/memory/*.md` — persistent agent memory (at the real Paperclip path)

## Fixed Boundary — Do NOT Modify

- `program.md` (this file)
- `benchmarks/` (the benchmark scenarios — modifying these is overfitting)
- `experiments/` (logs and snapshots — append-only)
- BuildOps, PatchOps, Responder instruction files (these agents work correctly)
- The Paperclip database, API server, or adapter code
- Any files outside the edit surface above
- The Paperclip `server/`, `ui/`, `packages/` source code

## Known Baseline Deficiencies

These are capabilities that NO agent currently has. The improvement loop should prioritize ADDING these to the appropriate agents' instructions. These are not bugs in the benchmarks — they represent the real gaps causing the dysfunction.

### 1. No agent can update issue priority
None of the 12 agents have the API call for updating an issue's priority field (`PATCH /api/companies/{companyId}/issues/{issueId}` with `{ "priority": "high" }`). This means agents cannot escalate priority when they discover a situation is worse than initially reported. **Add this to: Patrol, SecOps, StorageOps, NetOps, OpsLead, MediaOps.**

### 2. Most agents lack Telegram notification capability
Only OpsLead and SecOps have the Telegram script (`/Users/james/1-testytech/homelab/scripts/send-telegram.sh`). Other agents that discover critical situations (StorageOps finding a degraded pool, NetOps finding a security issue) cannot alert the board. **Add this to: StorageOps, NetOps, Patrol (for critical/urgent findings).**

### 3. OpsLead cannot create approvals
OpsLead can READ pending approvals (`GET /api/.../approvals?status=pending`) but has no instruction for CREATING them (`POST /api/.../approvals`). This means OpsLead can't unblock the pipeline by creating approvals for changes it reviews and deems low-risk. **Add approval creation to OpsLead's instructions.**

### 4. Patrol routing may already be correct
Patrol's instructions DO include correct routing rules (Security→SecOps, Infrastructure→OpsLead, etc.). The HOM-131 mis-routing to BuildOps may have been a downstream OpsLead delegation issue rather than a Patrol routing issue. The improvement loop should investigate whether the gap is in Patrol's finding creation or OpsLead's subsequent delegation.

## Improvement Axes

Ordered by expected impact. Each experiment should target ONE axis.

### 1. Pipeline Completion — Approval Gate Resolution

**The #1 dysfunction.** Agents investigate and create plans but the pipeline stalls because nobody creates a formal Paperclip approval object. BuildOps/PatchOps correctly refuse to act without one.

**What to improve:** Any agent except BuildOps and PatchOps can create approvals via the Paperclip API. Instructions should tell investigating agents (SecOps, StorageOps, NetOps, DockerOps, MediaOps) to create a formal approval after completing their investigation plan — not just write a comment. OpsLead should also be empowered to create approvals for findings it triages.

The approval API call is:
```bash
curl -sS -X POST "$PAPERCLIP_API_URL/api/companies/$PAPERCLIP_COMPANY_ID/approvals" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "action_approval",
    "requestedByAgentId": "<self-agent-id>",
    "payload": { "summary": "...", "plan": "...", "risk": "...", "rollback": "..." },
    "issueIds": ["<issue-uuid>"]
  }'
```

**Evidence:** HOM-131 (StorageOps created a plan but no approval, BuildOps bounced 3x), HOM-360 (SecOps created an approval but nobody approved it), HOM-366 (needed board intervention despite OpsLead "approving" via comment).

### 2. Routing Accuracy — Right Specialist First

**Patrol creates findings but they sometimes get routed to executors (BuildOps) before any investigation has happened.** This causes the executor to check out the issue, say "no approved plan," and return to idle — wasting a wake cycle.

**What to improve:** Verify that Patrol's routing rules are correct (they may already be — see Known Baseline Deficiency #4). The real gap may be in OpsLead's delegation logic — when OpsLead triages a finding, it should route to the investigating specialist, not directly to an executor. Executors should only receive issues that already have an approved plan and formal approval.

**Evidence:** HOM-131 (Patrol finding went to BuildOps instead of StorageOps — user had to manually reassign 29 hours later).

### 3. Investigation Follow-Through — Recommendations Become Issues

**Agents investigate, write recommendations in comments, then close the issue. The recommendations are never actioned because they're buried in comment text.**

**What to improve:** When an investigating agent identifies follow-up actions, it should create new issues for each actionable recommendation (assigned to the appropriate specialist) before closing the parent issue. A comment is not a follow-up.

**Evidence:** HOM-453 (NetOps found 3 actionable items — undocumented device, missing VPN configs, unused peer — wrote them in a comment and closed. None were actioned.)

### 4. Security Finding Depth and Priority

**Security and vulnerability findings lack the depth and urgency of infrastructure findings.** Patrol catches disk usage and Docker updates reliably, but security findings are shallow and don't drive remediation.

**What to improve:** Patrol's security runbook should produce findings with specific CVE references, CVSS scores where available, affected package versions, and recommended remediation steps. Security findings above a severity threshold should be created with `high` or `urgent` priority, not defaulting to `medium`. SecOps investigation should go deeper — not just "9,914 vulnerabilities found" but prioritized, actionable remediation grouped by host and severity.

**Evidence:** HOM-360 (SecOps found 9,914 vulns with 56 Critical but the issue sat at medium priority and stalled in approval).

### 5. OpsLead Stuck-Issue Detection and Re-Routing

**OpsLead's heartbeat should detect issues that are bouncing or stalled and proactively re-route them.** Currently, OpsLead notices stalls (it caught HOM-131 at 2h) but doesn't effectively resolve them.

**What to improve:** OpsLead should have explicit logic for detecting dysfunction patterns: same agent checking out and returning an issue multiple times, issues in `todo` for more than N hours with no progress, issues with comments but no status change. When detected, OpsLead should re-assign to the correct specialist and/or create the missing approval.

**Evidence:** HOM-131 (BuildOps checked out 3 times over 18 hours before human intervened).

### 6. Escalation on Severity Change

**When a finding's severity changes (e.g., disk usage crosses from warning to critical threshold), agents should escalate priority and alert appropriately.** Currently, severity increases are noted in comments but don't trigger priority changes or board notifications.

**What to improve:** Investigating agents should update issue priority when their investigation reveals the situation is worse than initially reported. Critical findings should trigger Telegram alerts and/or board notifications.

The priority update API call is:
```bash
curl -sS -X PATCH "$PAPERCLIP_API_URL/api/companies/$PAPERCLIP_COMPANY_ID/issues/$ISSUE_ID" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "priority": "urgent" }'
```

The Telegram notification script is:
```bash
/Users/james/1-testytech/homelab/scripts/send-telegram.sh "<HTML message>"
```

**Evidence:** HOM-131 (disk went from 75% to 86% — crossed critical threshold — but issue stayed at medium priority with no escalation).

### 7. Cross-Agent Context Handoff Quality

**When an issue is reassigned between agents, the receiving agent should be able to understand the full context from the issue description and comments without re-investigating.** Currently, handoff comments are sometimes vague or missing key information.

**What to improve:** Agent instructions should include a "handoff checklist" — when reassigning an issue, include: what was tried, what was found, what specifically needs to happen next, and what approval/access is needed.

## Keep / Discard Rules

- If benchmark aggregate improved → keep
- If aggregate unchanged and instructions are simpler → keep
- If any benchmark regressed by >1.0 point → discard (even if aggregate improved)
- Otherwise → discard

## Simplicity Criterion

For this company, "simpler" means:
- Fewer words in agent instructions that achieve the same behavior
- Clearer decision trees over vague guidance ("if security finding → assign to SecOps" beats "consider which agent might be appropriate")
- Concrete API examples over abstract descriptions ("POST /api/.../approvals" beats "create an approval")
- One clear instruction over multiple redundant reminders

## Overfitting Rule

Do not add benchmark-specific hacks, keyword-triggered routing rules that only work for the exact scenario in a benchmark, or instructions that reference specific issue numbers.

Test: "If this exact benchmark disappeared, would this still be a worthwhile improvement to how the company operates?" If no, it's overfitting.

## Real-World Validation

This is a LIVE production system. Improvements validated by benchmarks should also be checked against the real run logs at:
`/Users/james/.paperclip/instances/default/data/run-logs/4068464a-69cf-4078-89a2-8ebaa8a9e217/`

After making changes, monitor the next few real agent runs to confirm the improvement holds in practice, not just in simulation.
