# HomeLab Company — Benchmark Suite

These benchmarks test the HomeLab Paperclip company's agent harness against systemic failure modes identified from initial analysis AND live production behavior (126 issues, 50+ experiments). Each benchmark is a realistic scenario drawn from actual issues (HOM-131, HOM-283, HOM-307, HOM-360, HOM-370, HOM-453, HOM-479) and observed agent behavior patterns.

## Benchmark Inventory

### Original Benchmarks (1-11)

| # | Benchmark | Tests | Target Agent | Failure Mode |
|---|-----------|-------|-------------|---------------|
| 1 | `patrol-routing-security` | Does Patrol route security findings to SecOps (not executors) with correct priority? | Patrol | F2: Wrong routing, F4: Security depth |
| 2 | `pipeline-approval-creation` | Does an investigator create a formal Paperclip approval after completing a plan? | StorageOps | F1: Approval deadlock |
| 3 | `investigation-follow-through` | Does an investigator create follow-up issues from recommendations? | NetOps | F3: Recommendations evaporate |
| 4 | `opslead-triage-stuck-issue` | Does OpsLead detect bouncing/stuck issues and re-route them? | OpsLead | F1: Approval deadlock, F2: Wrong routing |
| 5 | `security-finding-depth` | Does SecOps produce deep, exploitability-aware vulnerability analysis? | SecOps | F4: Security depth |
| 6 | `escalation-on-severity` | Does an agent escalate priority and alert when severity increases? | StorageOps | F5: No escalation |
| 7 | `executor-handoff-quality` | Does an agent create clean handoffs distinguishing human vs. agent work? | SecOps | F1: Approval deadlock, F3: Follow-through |
| 8 | `ceo-escalation-review` | Does CEO review stale approvals, approve low-risk changes, and catch mis-assignments? | CEO | F1: Approval deadlock, F5: No escalation |
| 9 | `dockerops-scan-and-handoff` | Does DockerOps group updates by risk, flag breaking changes, and create approvals? | DockerOps | F1: Approval deadlock, F6: Update risk awareness |
| 10 | `mediaops-service-triage` | Does MediaOps distinguish autonomous fixes from config changes requiring approval? | MediaOps | F1: Approval deadlock, F7: Autonomy boundaries |
| 11 | `observer-daily-digest` | Does Observer detect anomalies, connect patterns, and produce actionable digests? | Observer | F8: Operational visibility |

### Live-System Benchmarks (12-19) — Added 2026-04-08

Derived from production issue analysis of 126 issues over 3 days of live operation.

| # | Benchmark | Tests | Target Agent | Failure Mode | Source Issue |
|---|-----------|-------|-------------|---------------|-------------|
| 12 | `patrol-duplicate-detection` | Does Patrol update existing issues instead of creating duplicates? | Patrol | F9: Duplicate findings | 31 wrk-disconnected dupes |
| 13 | `recurring-issue-recognition` | Does an agent recognize a recurring failure and reference the prior fix? | DockerOps | F10: No pattern memory | HOM-479 vs HOM-307 |
| 14 | `opslead-idle-agent-detection` | Does OpsLead detect agents that check out but produce zero work? | OpsLead | F11: Idle after checkout | HOM-370, HOM-283 |
| 15 | `investigation-wrong-diagnosis` | Does an agent cleanly supersede a wrong prior approval? | NetOps | F12: Wrong diagnosis cycle | HOM-283 |
| 16 | `cross-issue-dependency` | Does OpsLead prioritize a blocker when it blocks a time-sensitive issue? | OpsLead | F13: Dependency blindness | HOM-370 blocking HOM-283 |
| 17 | `observer-coalesce-detection` | Does Observer flag high coalesce rates as monitoring degradation? | Observer | F14: Monitoring blind spots | 66% coalesce rate |
| 18 | `board-approval-sla-escalation` | Does CEO re-escalate when board hasn't acted on recommended approvals? | CEO | F15: Board latency | HOM-283, HOM-479 |
| 19 | `multi-agent-priority-escalation` | Does an agent reassess priority based on impact analysis? | DockerOps | F16: Priority mismatch | HOM-479 at medium |
| 20 | `secops-mixed-handoff` | Does SecOps split work across two executors with self-contained approvals? | SecOps | F17: Handoff quality | HOM-360 mixed remediation |
| 21 | `storageops-pool-recurrence` | Does StorageOps reference prior SMART history and escalate degraded pool? | StorageOps | F10: No pattern memory, F5: Escalation | Predicted drive failure |

## Agent Coverage

| Agent | Benchmarks | Role Tested |
|-------|-----------|-------------|
| **Patrol** | 1, 12 | Finding creation, routing, priority, deduplication |
| **OpsLead** | 4, 14, 16 | Triage, stuck detection, idle agent detection, dependency awareness |
| **SecOps** | 5, 7, 20 | Investigation depth, handoff quality, multi-executor split |
| **NetOps** | 3, 15 | Follow-through, superseding wrong approvals |
| **StorageOps** | 2, 6, 21 | Approval creation, severity escalation, memory-informed investigation |
| **CEO** | 8, 18 | Approval review, escalation oversight, board SLA |
| **DockerOps** | 9, 13, 19 | Update risk grouping, recurrence recognition, priority reassessment |
| **MediaOps** | 10 | Root cause analysis, autonomy boundaries, config change handoff |
| **Observer** | 11, 17 | Pattern recognition, digest quality, coalesce detection |

## Failure Modes Covered

- **F1: Approval Gate Deadlock** — Benchmarks 2, 4, 5, 7, 8, 9, 10
- **F2: Wrong Initial Routing** — Benchmarks 1, 4
- **F3: No Follow-Through on Recommendations** — Benchmarks 3, 7
- **F4: Security Finding Lacks Depth/Priority** — Benchmarks 1, 5
- **F5: No Escalation on Severity Change** — Benchmarks 6, 8
- **F6: Update Risk Awareness** — Benchmark 9
- **F7: Autonomy Boundary Confusion** — Benchmark 10
- **F8: Operational Visibility** — Benchmarks 11, 17
- **F9: Duplicate Finding Noise** — Benchmark 12
- **F10: No Recurring Pattern Memory** — Benchmark 13
- **F11: Idle After Checkout** — Benchmark 14
- **F12: Wrong Diagnosis / Approval Supersession** — Benchmark 15
- **F13: Cross-Issue Dependency Blindness** — Benchmark 16
- **F14: Monitoring Degradation (Coalesce)** — Benchmark 17
- **F15: Board Approval Latency** — Benchmark 18
- **F16: Priority Mismatch on Impact** — Benchmark 19
- **F17: Poor Handoff Quality / Non-Self-Contained Approvals** — Benchmark 20

## Agents NOT Benchmarked (by design)

- **BuildOps** / **PatchOps** — Executor agents working correctly; off-limits in edit surface
- **Responder** — Separate incident workflow; off-limits

## Format

Each benchmark has:
- `instruction.md` — A realistic scenario the target agent would face
- `verifier.md` — Scoring rubric with weighted criteria (0-5), required elements, and anti-patterns

Verifier target agents use the symlinked filenames from `agents/` (e.g., `patrol.md`, `opslead.md`, `ceo-agents.md`).

## Adding New Benchmarks

1. Create a new directory under `benchmarks/`
2. Write `instruction.md` with a realistic scenario (draw from real issues)
3. Write `verifier.md` with weighted criteria, required elements, and anti-patterns
4. Set Target Agent to the symlink filename (e.g., `patrol.md`)
5. Update this README
6. Do NOT modify existing benchmarks to make the current harness score higher

## Scoring

Each criterion is scored 0-5 and weighted 1-3. The benchmark score is:
```
weighted_avg = Σ(score × weight) / Σ(weight)
final = max(0, weighted_avg - 0.25 × missing_required - 0.25 × anti_patterns_triggered)
```
