# HomeLab Company — Improvement Program

You are a meta-agent improving the Paperclip HomeLab company's agent harness. Your job is NOT to manage homelab infrastructure directly. Your job is to improve the agent instruction files — their routing rules, handoff procedures, approval workflows, investigation depth, and follow-through behavior — so the 12-agent company operates more effectively with less human intervention.

## Platform Config

platform: paperclip
runner: pi -p
apply_method: file-edit (symlinks to live Paperclip instructions)
agent_dir: ~/.pi/agent/agents/teams/homelab-company/agents/
instructions_deployed: /Users/james/.paperclip/instances/default/companies/4068464a-69cf-4078-89a2-8ebaa8a9e217/agents/
api_base: http://localhost:3100
company_id: 4068464a-69cf-4078-89a2-8ebaa8a9e217

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

### 5. No agent distinguishes autonomous vs. approval-required actions precisely
MediaOps has vague guidance ("low risk" / "hand off everything else") but no concrete decision rules for what it can do autonomously (restart, cache clear) vs. what requires approval (device permissions, memory limits, config file changes). Other specialist agents have similar ambiguity. **Add specific decision-rule checklists to: MediaOps, DockerOps, and any agent with an autonomous action boundary.**

### 6. No agent has root cause analysis procedures for cascading failures
When a service fails due to a chain reaction (e.g., hardware encoder permission denied → software transcoding fallback → OOM kill), agents have no guidance on tracing from surface symptom to root cause. They may fix the symptom (restart) without identifying what needs to change (device permissions + memory limit). **Add cascading-failure investigation guidance to: MediaOps, SecOps, StorageOps.**

### 7. DockerOps has no update risk grouping or CVSS-based priority
DockerOps scans for image updates and creates approvals, but treats all updates identically. It has no logic for: separating breaking changes (which need human review), grouping security patches by CVSS severity, or excluding high-risk updates from automated batches. **Add risk-tier grouping, breaking-change exclusion, and CVSS→priority mapping to DockerOps.**

### 8. Observer lacks pattern recognition and anomaly prioritization
Observer has anomaly detection triggers but no instruction on: (a) connecting related anomalies into systemic patterns (e.g., PatchOps errors + stale approval = pipeline stall), (b) prioritizing anomalies by severity (P0 critical infrastructure → P3 capacity), (c) detecting agent extended silence (0 runs over multiple cycles), (d) flagging approval queue age as a pipeline health indicator. **Add systemic pattern recognition, severity-based prioritization, and expanded anomaly triggers to Observer.**

## Completed Axes

These axes have been addressed by previous experiments and score 5.00 on existing benchmarks.
The improver should NOT re-target these unless new benchmarks expose regressions.

### [DONE] Axis 1 — Pipeline Completion / Approval Gate Resolution
Addressed by experiments 20260407-120917 through 20260407-130430. Investigating agents now create formal Paperclip approvals. OpsLead has approval creation. CEO sweeps pending approvals.

### [DONE] Axis 2 — Routing Accuracy
Patrol routing was already correct (Known Baseline Deficiency #4 confirmed). OpsLead delegation improved in experiment 20260407-130430.

### [DONE] Axis 3 — Investigation Follow-Through
Addressed by experiment 20260407-121601. NetOps now creates follow-up issues from multi-recommendation investigations.

### [DONE] Axis 4 — Security Finding Depth and Priority
Addressed by experiment 20260407-125526. SecOps now produces per-CVE exploitability assessments with CVSS-based priority.

### [DONE] Axis 5 — OpsLead Stuck-Issue Detection
Addressed by experiments 20260407-130430 and 20260407-140836. OpsLead detects bounce/stale patterns and creates approvals.

### [DONE] Axis 6 — Escalation on Severity Change
Addressed by experiment 20260407-120917. StorageOps escalates priority and sends Telegram for critical findings.

### [DONE] Axis 8 — Update Risk Awareness (DockerOps)
Addressed by experiment 20260407-163500. DockerOps now groups by risk tier with CVSS mapping.

### [DONE] Axis 9 — Autonomy Boundary Precision (MediaOps)
Addressed by experiment 20260407-163811. MediaOps has explicit autonomous/approval checklists.

### [DONE] Axis 10 — Operational Digest Quality (Observer)
Addressed by experiment 20260407-164102. Observer now detects systemic patterns and ranks anomalies P0-P3.

---

## Improvement Axes

Ordered by expected impact. Each experiment should target ONE axis.
Axes 11-17 are NEW, derived from live system analysis on 2026-04-08.

### 7. Cross-Agent Context Handoff Quality

**When an issue is reassigned between agents, the receiving agent should be able to understand the full context from the issue description and comments without re-investigating.** Currently, handoff comments are sometimes vague or missing key information.

**What to improve:** Agent instructions should include a "handoff checklist" — when reassigning an issue, include: what was tried, what was found, what specifically needs to happen next, and what approval/access is needed.

**Evidence:** HOM-283 bounced between 7 agents over 50+ hours. Each handoff lost context, requiring re-investigation.

### 11. Patrol Duplicate Finding Prevention

**Patrol creates a new issue every patrol cycle for the same persistent condition.** In production, the Wazuh wrk agent disconnected finding generated 31 separate issues across patrol cycles. Each one gets picked up by SecOps, investigated, and closed as "informational" — burning agent cycles and creating noise.

**What to improve:** Before creating a new issue, Patrol must search for existing open issues matching the same finding (same host, same check, same condition). If a match exists, Patrol should add a comment to the existing issue with fresh diagnostic data instead of creating a duplicate. Only create a new issue if the condition is genuinely new or the existing issue has been closed.

**Evidence:** 31 duplicate "Wazuh agent 029 (wrk) disconnected" issues in production. SecOps avg resolution time on these is 1.2 min — they're just closing duplicates. Benchmark `patrol-duplicate-detection` tests this directly.

### 12. Recurring Issue Pattern Recognition

**When the same infrastructure failure recurs (identical root cause, identical fix), agents re-investigate from scratch instead of referencing prior solutions.** In production, HOM-479 was identical to HOM-307 (same VPN server unreachable, same fix) but took 3+ hours because no agent recognized the pattern or referenced the prior fix.

**What to improve:** Investigating agents (DockerOps, NetOps, StorageOps, MediaOps, SecOps) should check their `para-memory-files` for prior incidents with matching symptoms. If a match is found, the agent should reference the prior fix, skip redundant investigation, and create an approval immediately with the prior incident as precedent.

**Evidence:** HOM-479 vs HOM-307 — identical root cause (PIA Montreal unreachable), identical fix (change SERVER_REGIONS), but HOM-479 took 3+ hours and required OpsLead intervention. Benchmark `recurring-issue-recognition` tests this. *(Also requires agents that don't use para-memory-files to adopt it — see Known Baseline Deficiency #2 gap for NetOps, MediaOps.)*

### 13. Idle-After-Checkout Detection

**Agents check out issues then go idle with zero progress, blocking critical work for hours.** In production, NetOps checked out HOM-370 and HOM-283 then produced zero work for 3-4 hours. OpsLead's heartbeat didn't catch the stall quickly enough.

**What to improve:** OpsLead's heartbeat should compare each in_progress issue's last comment timestamp against the checkout time. If an agent checked out > 1 hour ago with no comments/updates, OpsLead should: release the checkout, reset the agent's session, and reassign or escalate. The threshold should be shorter (30 min) for critical/high priority issues.

**Evidence:** NetOps idle on HOM-370 for 3h, HOM-283 for 4h. Both required CEO intervention. Benchmark `opslead-idle-agent-detection` tests this.

### 14. Cross-Issue Dependency Awareness

**When Issue A blocks Issue B, the system doesn't prioritize resolving the blocker.** In production, HOM-370 (NPM API down) blocked HOM-283 (SSL cert expiry, 3-day deadline) for 36+ hours. HOM-370 sat unassigned while the time-critical HOM-283 waited.

**What to improve:** OpsLead should detect blocked-by dependencies (from issue comments or status). When a blocked issue has a time-sensitive deadline, OpsLead should escalate the blocking issue's priority and assign it immediately. The blocker effectively inherits the urgency of the issues it blocks.

**Evidence:** HOM-370 unassigned 38h while blocking critical HOM-283. Benchmark `cross-issue-dependency` tests this.

### 15. Investigation Superseding Prior Approvals

**When a re-investigation reveals the original diagnosis was wrong, agents don't cleanly supersede the old approved plan.** In production, HOM-283's first diagnosis (install certbot) was wrong. The real root cause (missing env var) required a new approval, but the old approval was still active, causing confusion.

**What to improve:** When an investigating agent discovers that an existing approved plan is wrong, it should: (a) comment on the issue explaining the correction, (b) flag the old approval as superseded, (c) create a new approval with the correct fix, (d) escalate urgency since time was lost on the wrong plan.

**Evidence:** HOM-283 had two approval cycles (9b762cad wrong, 20cfa28b correct). The transition was messy — 7 reassignments over 50+ hours. Benchmark `investigation-wrong-diagnosis` tests this.

### 16. Board Approval SLA Escalation

**CEO recommends approval but the board takes hours to act. No re-escalation happens.** In production, HOM-283's approval sat 4.5 hours after CEO recommendation. HOM-479's approval also stalled at the board gate.

**What to improve:** CEO's heartbeat should track approval age since recommendation. If a recommended approval hasn't been acted on within 2 hours, CEO should re-escalate via Telegram with increased urgency. For critical/urgent issues, the threshold should be 1 hour. Each re-escalation should reference the prior one and the deadline.

**Evidence:** HOM-283 approval pending 16.5h total, 4.5h after CEO recommendation. Benchmark `board-approval-sla-escalation` tests this.

### 17. Monitoring Coalesce Rate Awareness

**When 66%+ of patrol runs are coalesced, the system has monitoring blind spots. Nobody detects this.** In production, only 25% of scheduled patrol runs complete — the rest are coalesced because the previous run is still active. This means findings may be missed for hours or days.

**What to improve:** Observer should track coalesce rates per routine. When the rate exceeds 50%, Observer should flag it as "monitoring degradation" in the digest with a specific recommendation (increase patrol interval, reduce runbook scope, or investigate why runs are slow). OpsLead should also detect high coalesce rates during its routine health check.

**Evidence:** Production shows 66% coalesce rate across all patrols. Media Patrol: 75% coalesced. Infrastructure Patrol: 75% coalesced. Benchmark `observer-coalesce-detection` tests this.

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

This is a LIVE production system. Improvements validated by benchmarks should also be checked against real agent behavior.

**Run logs:** `/Users/james/.paperclip/instances/default/data/run-logs/4068464a-69cf-4078-89a2-8ebaa8a9e217/`

**Validation process for behavioral changes (not simplification-only):**
1. After applying the change, wait for the affected agent's next 3 real runs
2. Check run logs for the expected behavior (e.g., did Patrol actually deduplicate? did OpsLead catch the idle checkout?)
3. If the real behavior doesn't match the benchmark improvement, investigate why and adjust
4. Record validation results in the experiment log entry

**Simplification-only changes** (reducing word count without changing behavior) do not require real-world validation.
