# Experiment: 20260408-161928

**Status:** keep
**Change:** Add ZFS pool degradation depth requirements to StorageOps: redundancy tolerance explanation (raidz topology + failure tolerance), check remaining drives SMART, reference prior memory for faulted drive, specify replacement drive specs in approval, post-replacement verification plan, and save findings to memory. StorageOps 987→1226 words (+239, +24.2%).
**Score:** 4.75 → 4.90 (delta: +0.15)

## Per-Benchmark Comparison
| Benchmark | Before | After | Delta |
|-----------|--------|-------|-------|
| patrol-duplicate-detection | 5.00 | 5.00 | +0.00 |
| investigation-wrong-diagnosis | 4.73 | 4.73 | +0.00 |
| board-approval-sla-escalation | 4.82 | 4.82 | +0.00 |
| secops-mixed-handoff | 4.42 | 4.42 | +0.00 |
| opslead-idle-agent-detection | 4.60 | 4.60 | +0.00 |
| cross-issue-dependency | 5.00 | 5.00 | +0.00 |
| recurring-issue-recognition | 5.00 | 5.00 | +0.00 |
| storageops-pool-recurrence | 4.55 | 5.00 | +0.45 |
| multi-agent-priority-escalation | 4.42 | 4.42 | +0.00 |
| observer-coalesce-detection | 5.00 | 5.00 | +0.00 |

**Aggregate: 4.90**

## Analysis
StorageOps previously lacked structured guidance for pool degradation investigations. When a drive faulted, the agent had escalation and approval workflows but no depth requirements specific to ZFS topology. The new "ZFS Pool Degradation — Depth Requirements" section adds 5 mandatory investigation steps:

1. **Redundancy tolerance explanation** — Forces the agent to state the raidz level and remaining failure tolerance. Previously, StorageOps might just say "pool degraded" without quantifying the risk window (e.g., "zero redundancy margin until replaced"). This is critical context for the board and for priority assessment.

2. **Check remaining drives SMART** — When one drive fails, the others in the same vdev are often the same age/batch. Checking them catches pre-failure conditions before a second drive dies and causes data loss. This was a missing anti-pattern in the verifier.

3. **Reference prior memory for faulted drive** — Connects SMART history to current failure (e.g., "sdc had 2 reallocated sectors in March, predicted failure now materializing"). This transforms a generic "drive failed" into a pattern-recognized event.

4. **Specify replacement drive specs** — The approval must include model, capacity, interface, and serial. Without this, BuildOps can't procure or select the right replacement.

5. **Post-replacement verification plan** — Resilver monitoring, full scrub, and SMART check. Prevents "drive replaced, done" without verifying data integrity.

Also added Escalation step 6 (save findings to memory) and expanded Telegram field guidance to include redundancy tolerance and risk window.

The storageops-pool-recurrence score improved from 4.55 to 5.00, going from the weakest benchmark to a perfect score. The +239 word cost is moderate — the depth requirements are structured and actionable rather than verbose.

## Next Improvement Ideas
1. **SecOps risk-per-executor assessment (secops-mixed-handoff at 4.42)** — SecOps already has split-approval capability but may lack explicit risk differentiation between PatchOps (openssh lockout risk) and BuildOps (database migration risk). A per-executor risk assessment requirement would lift this score.

2. **DockerOps/multi-agent-priority-escalation (4.42)** — DockerOps now has priority reassessment but the recurrence pattern check (criterion 5) still scores ~3 when no prior memory exists. Could add "note for recurrence tracking" language.

3. **StorageOps simplification pass** — The new +239 words could be compressed in a future simplification pass once behavior is validated in production.
