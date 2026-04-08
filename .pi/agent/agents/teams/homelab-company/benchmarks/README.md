# HomeLab Company — Benchmark Suite

These benchmarks test the HomeLab Paperclip company's agent harness against the systemic failure modes identified during initial analysis. Each benchmark is a realistic scenario drawn from actual issues (HOM-131, HOM-360, HOM-366, HOM-453) and observed agent behavior patterns.

## Benchmark Inventory

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

## Agent Coverage

| Agent | Benchmarks | Role Tested |
|-------|-----------|-------------|
| **Patrol** | 1 | Finding creation, routing, priority |
| **OpsLead** | 4 | Triage, stuck detection, delegation |
| **SecOps** | 5, 7 | Investigation depth, handoff quality |
| **NetOps** | 3 | Follow-through on recommendations |
| **StorageOps** | 2, 6 | Approval creation, severity escalation |
| **CEO** | 8 | Approval review, escalation oversight |
| **DockerOps** | 9 | Update risk grouping, breaking change handling, approval handoff |
| **MediaOps** | 10 | Root cause analysis, autonomy boundaries, config change handoff |
| **Observer** | 11 | Anomaly detection, pattern recognition, digest quality |

## Failure Modes Covered

- **F1: Approval Gate Deadlock** — Benchmarks 2, 4, 5, 7, 8, 9, 10
- **F2: Wrong Initial Routing** — Benchmarks 1, 4
- **F3: No Follow-Through on Recommendations** — Benchmarks 3, 7
- **F4: Security Finding Lacks Depth/Priority** — Benchmarks 1, 5
- **F5: No Escalation on Severity Change** — Benchmarks 6, 8
- **F6: Update Risk Awareness** — Benchmark 9
- **F7: Autonomy Boundary Confusion** — Benchmark 10
- **F8: Operational Visibility** — Benchmark 11

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
