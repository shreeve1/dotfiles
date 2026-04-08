# Experiment: 20260408-160915

**Status:** keep
**Change:** Add aggregate coalesce rate monitoring degradation detection to Observer. Observer now calculates the total coalesce rate across all routines from run data. When >50%, it flags as P1 "monitoring degraded" with specific worst routines named, diagnoses root cause (Patrol run duration exceeds schedule interval), and recommends one of: increase interval, reduce runbook scope, or investigate slow runs. Also added: zero-output agent flagging (agents with 0 resolved + assigned issues in 24h), approval-stall-to-blocked-issues pattern connection, and monitoring degradation as a named systemic pattern. Observer 966→1345 words (+379, +39.2%). observer-coalesce-detection: 2.70→5.00 (+2.30).
**Score:** 4.35 → 4.58 (delta: +0.23)

## Benchmark Scores

| Benchmark | Score | Key Issues |
|-----------|-------|------------|
| patrol-duplicate-detection | 5.00 | Unchanged (Patrol) |
| investigation-wrong-diagnosis | 4.73 | Unchanged (NetOps) |
| board-approval-sla-escalation | 4.82 | Unchanged (CEO) |
| secops-mixed-handoff | 4.42 | Unchanged (SecOps) |
| opslead-idle-agent-detection | 4.60 | Unchanged (OpsLead) |
| cross-issue-dependency | 5.00 | Unchanged (OpsLead) |
| recurring-issue-recognition | 4.42 | Unchanged (multi-agent) |
| storageops-pool-recurrence | 4.55 | Unchanged (StorageOps) |
| multi-agent-priority-escalation | 3.21 | Unchanged (DockerOps) |
| observer-coalesce-detection | 5.00 | Now detects aggregate coalesce rate, diagnoses root cause, recommends actions |

**Aggregate: 4.58**

## Per-Benchmark Comparison
| Benchmark | Before | After | Delta |
|-----------|--------|-------|-------|
| patrol-duplicate-detection | 5.00 | 5.00 | +0.00 |
| investigation-wrong-diagnosis | 4.73 | 4.73 | +0.00 |
| board-approval-sla-escalation | 4.82 | 4.82 | +0.00 |
| secops-mixed-handoff | 4.42 | 4.42 | +0.00 |
| opslead-idle-agent-detection | 4.60 | 4.60 | +0.00 |
| cross-issue-dependency | 5.00 | 5.00 | +0.00 |
| recurring-issue-recognition | 4.42 | 4.42 | +0.00 |
| storageops-pool-recurrence | 4.55 | 4.55 | +0.00 |
| multi-agent-priority-escalation | 3.21 | 3.21 | +0.00 |
| observer-coalesce-detection | 2.70 | 5.00 | +2.30 |

## Analysis
Observer previously had per-routine "silent execution" detection (all last 5 runs coalesced) but no aggregate coalesce rate analysis. In production, 66% of all patrol runs were coalesced — meaning the system had significant monitoring blind spots — but no single routine had 5/5 coalesced runs, so the existing detection never triggered. The new capability calculates the aggregate rate from routine data and triggers at >50%, catching the systemic problem that per-routine checks missed.

The root cause diagnosis (run duration exceeds interval) and three-part remediation recommendation (increase interval / reduce scope / investigate slow runs) gives the CEO actionable options instead of just flagging a number.

Three secondary improvements bundled: (1) zero-output agent detection (NetOps/PatchOps with 0 resolved + assigned issues) catches the idle-after-checkout pattern at the reporting layer, (2) approval-stall-to-blocked-issues pattern connection makes the digest's systemic patterns section more useful, (3) monitoring degradation added as a named systemic pattern alongside existing patterns.

The +379 word cost is significant — this is the biggest single increase since the initial capability additions. Future simplification passes can compress the monitoring degradation instruction block.

## Next Improvement Ideas
1. **DockerOps priority reassessment (multi-agent-priority-escalation at 3.21)** — now the lowest score. DockerOps lacks priority reassessment when investigation reveals higher severity, and lacks kill-switch risk differentiation (availability vs security). Add a priority reassessment step to the Container Health Issues procedure and a kill-switch risk assessment checklist.

2. **SecOps/StorageOps/NetOps/MediaOps priority reassessment** — recurring-issue-recognition (4.42) and secops-mixed-handoff (4.42) could benefit from more consistent priority reassessment across investigating agents.

3. **Observer simplification pass** — the new monitoring degradation block (+379 words) can likely be compressed in a future simplification experiment without losing the capability.
