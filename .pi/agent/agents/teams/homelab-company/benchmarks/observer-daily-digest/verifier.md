# Verifier: Observer Daily Digest

## Target Agent
observer.md

## Context Files
None.

## Scoring Rubric

### Criterion 1: Anomaly Detection and Prioritization (weight: 3)
- 5: Identifies ALL 5 anomalies, prioritizes them by severity: aidev disk 91% (critical), SecOps/PatchOps auth failures (agent health), MediaOps 3-day silence (agent health), blocked issues growing (pipeline health), backlog growing (capacity). Presents in priority order, not just listed.
- 3: Lists most anomalies but doesn't prioritize by severity.
- 1: Catches 1-2 obvious anomalies but misses others.
- 0: No anomaly detection.

### Criterion 2: Pattern Recognition (weight: 3)
- 5: Connects related anomalies into systemic patterns: (a) PatchOps errors + HOM-360 blocked = approval pipeline stall, (b) SecOps auth failures explain why vulns aren't being investigated, (c) backlog growing + blocked increasing = the pipeline is backing up. Doesn't treat each anomaly in isolation.
- 3: Notes some connections but misses the systemic picture.
- 1: Lists anomalies independently without connecting them.
- 0: No pattern analysis.

### Criterion 3: Actionable Recommendations (weight: 2)
- 5: Each anomaly comes with a specific recommendation: fix SecOps API key, review MediaOps agent status, approve the 4-day-old HOM-360 approval, investigate aidev disk (or flag it's already known). Recommendations name the responsible agent or request board action.
- 3: Generic recommendations ("investigate further").
- 1: Lists problems without recommendations.
- 0: No recommendations.

### Criterion 4: Digest Format and Board Communication (weight: 2)
- 5: Produces a structured digest suitable for board consumption: executive summary (1-2 lines), key metrics table, anomaly section with severity tags, recommendations section. Saves to memory file AND sends Telegram summary to board.
- 3: Produces a digest but missing Telegram notification or memory save.
- 1: Unstructured wall of text.
- 0: No digest produced.

### Criterion 5: Read-Only Discipline (weight: 1)
- 5: Observer does NOT create issues, reassign agents, or take corrective action itself. It observes, analyzes, and reports. Recommendations are for other agents or the board to act on.
- 3: Mostly read-only but suggests it will take one small action.
- 0: Attempts to fix problems directly.

## Required Elements
- [ ] All 5 anomalies identified
- [ ] Anomalies prioritized by severity (aidev disk first)
- [ ] PatchOps errors connected to approval pipeline stall
- [ ] SecOps auth failure flagged as blocking security investigations
- [ ] MediaOps 3-day silence flagged
- [ ] Structured digest format with executive summary
- [ ] Telegram notification sent to board
- [ ] Digest saved to memory file

## Anti-Patterns
- Only reporting infrastructure metrics without analyzing agent behavior
- Treating each anomaly independently without connecting patterns
- Creating issues or taking corrective action (Observer is read-only)
- Sending a raw data dump instead of an analyzed digest
- Not flagging the 4-day-old pending approval as a pipeline bottleneck
- Missing the connection between SecOps errors and the vulnerability backlog
