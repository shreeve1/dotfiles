# Verifier: StorageOps Pool Degradation with Prior History

## Target Agent
storageops.md

## Context Files
None.

## Scoring Rubric

### Criterion 1: References Prior Memory (weight: 3)
- 5: Connects the current sdc failure to the March 28 SMART note — sdc had 2 reallocated sectors and was flagged for monitoring. This is the predicted failure materializing. References the specific memory entry and serial number (WD-WX42A75DC123).
- 3: Notes sdc was known to have issues but doesn't reference the specific SMART history or serial.
- 1: Investigates from scratch without checking memory.
- 0: No reference to prior history.

### Criterion 2: Correct Severity Assessment (weight: 3)
- 5: Assesses as HIGH but not CRITICAL. Reasoning: pool1 is raidz2 (can survive 2 drive failures), so data is safe with 1 faulted drive. But the pool is now running with zero redundancy margin — a second drive failure would cause data loss. Escalates priority appropriately and quantifies the risk window.
- 3: Identifies it's degraded but doesn't explain the raidz2 tolerance or the risk of a second failure.
- 1: Over-escalates (calls it critical data loss) or under-escalates (just a warning).
- 0: Doesn't assess severity.

### Criterion 3: Escalation and Notification (weight: 2)
- 5: Escalates priority to urgent (data-loss risk with any second drive failure). Sends Telegram to board explaining: pool degraded, sdc failed (predicted from SMART), raidz2 has single-drive tolerance remaining, drive replacement needed. Flags this as time-sensitive — every hour without replacement increases risk.
- 3: Escalates priority but no Telegram, or Telegram but no priority update.
- 1: Notes urgency but doesn't escalate or notify.
- 0: No escalation.

### Criterion 4: Creates Correct Approval and Handoff (weight: 3)
- 5: Creates a formal approval for BuildOps with: (a) immediate action — verify no other drives showing SMART warnings, run scrub on remaining drives, (b) drive replacement plan — procure matching WD Red 4TB, `zpool replace pool1 sdc <new-device>`, (c) post-replacement — verify resilver completes, run full scrub, check SMART on all drives. Includes rollback (raidz2 is self-healing, no rollback needed beyond removing bad replacement drive).
- 3: Creates approval but missing some steps or verification.
- 1: Creates a vague plan ("replace the drive").
- 0: No approval created.

### Criterion 5: Saves Updated Memory (weight: 1)
- 5: Records this incident in memory: sdc failed as predicted from SMART warnings, drive serial, pool status, and what was done. Updates the capacity note (now 5 drives active, capacity implications). This builds institutional knowledge for future drive failures.
- 3: Plans to save but content is thin.
- 0: No memory update.

## Required Elements
- [ ] March 28 SMART entry referenced (2 reallocated sectors on sdc)
- [ ] raidz2 single-failure tolerance explained (data safe, but zero margin)
- [ ] Priority escalated to urgent
- [ ] Telegram sent to board with drive failure details
- [ ] Formal approval created for BuildOps with drive replacement plan
- [ ] Post-replacement verification steps included (resilver, scrub, SMART check)
- [ ] Memory updated with incident details

## Anti-Patterns
- Investigating sdc SMART from scratch when memory already has the history
- Treating this as routine (it's a predicted drive failure — risk is real)
- Not explaining the raidz2 context (reader needs to understand the redundancy math)
- Creating approval without specifying the replacement drive specs
- Not checking other drives for SMART warnings in the same pool
- Closing the issue after investigation without creating follow-up for drive procurement
