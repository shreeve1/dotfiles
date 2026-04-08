# Verifier: Observer Coalesce/Backlog Detection

## Target Agent
observer.md

## Context Files
None.

## Scoring Rubric

### Criterion 1: Detects Monitoring Degradation (weight: 3)
- 5: Identifies the 66% coalesce rate as a critical operational problem — the company is only completing 25% of scheduled patrols. Frames this as "monitoring blind spots" — the system cannot reliably detect infrastructure problems when 2 out of 3 patrol runs are skipped. Names specific patrols with worst rates (Media: 75% coalesced, Infrastructure: 75%).
- 3: Reports coalesce numbers but doesn't frame them as a monitoring reliability problem.
- 1: Lists routine run counts without noting the coalesce pattern.
- 0: Doesn't report on routine health.

### Criterion 2: Identifies Root Cause of Coalescing (weight: 2)
- 5: Connects the high coalesce rate to Patrol run duration exceeding the schedule interval. Recommends a specific action: increase patrol intervals, reduce runbook scope per run, or investigate why Patrol runs take so long. Notes that Patrol resolved only 3 issues in 24h despite being scheduled 56 times.
- 3: Notes coalescing but doesn't analyze why.
- 1: Lists it as a metric without analysis.
- 0: Doesn't connect coalesce rate to operational impact.

### Criterion 3: Board Approval Pipeline Stall (weight: 3)
- 5: Flags both stale approvals (8h and 4h old, both CEO-recommended) as a pipeline bottleneck. Calculates that 2 issues are blocked waiting on board action. Connects this to the "3 blocked issues" count. Frames as urgent — board inaction is the top bottleneck.
- 3: Reports stale approvals but doesn't connect to blocked issues.
- 1: Mentions approvals exist without noting the staleness.
- 0: Doesn't flag pending approvals.

### Criterion 4: NetOps/PatchOps Zero Resolution (weight: 2)
- 5: Flags NetOps (0 issues resolved, last run 3h ago) and PatchOps (0 issues resolved, last run 6h ago) as potentially underperforming or blocked. Distinguishes from agents with low but non-zero output.
- 3: Notes agent activity counts but doesn't flag zero-output agents.
- 0: Doesn't analyze per-agent performance.

### Criterion 5: Digest Structure and Communication (weight: 1)
- 5: Structured digest with: executive summary (1-2 lines capturing the two biggest issues), metrics table, anomalies ranked by severity, systemic patterns section, specific recommendations. Sends Telegram summary. Saves to memory.
- 3: Has structure but missing Telegram or memory save.
- 1: Unstructured report.
- 0: No digest.

## Required Elements
- [ ] 66% coalesce rate identified as monitoring degradation
- [ ] Specific recommendation to address coalescing (interval/scope change)
- [ ] Both stale approvals flagged with age and CEO recommendation status
- [ ] Approval stall connected to blocked issue count
- [ ] NetOps and PatchOps zero-output flagged
- [ ] Telegram summary sent
- [ ] Digest saved to memory

## Anti-Patterns
- Reporting coalesce rate as a raw number without explaining operational impact
- Not connecting stale approvals to the blocked issue pipeline
- Treating all agents equally when some have zero output
- Producing a data dump instead of an analyzed, prioritized digest
- Not recommending specific actions for the monitoring degradation
