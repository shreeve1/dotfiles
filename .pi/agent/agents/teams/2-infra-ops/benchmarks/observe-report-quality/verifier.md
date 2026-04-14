# Verifier: Observe Report Quality

## Target Agent
dispatcher.md (from teams/2-infra-ops/)

## Context Files
context.md (from teams/2-infra-ops/)

## Scoring Rubric

### Criterion 1: All Report Sections Present (weight: 3)
- 5: Report contains all required sections: Evidence Collected, Vendor Context, Likely Causes (ranked), Blast Radius, Recommended Actions, What I Don't Know. Header includes issue summary, date, host, and mode (observe/read-only)
- 3: Most sections present but missing 1-2 (e.g., Blast Radius or What I Don't Know)
- 1: Only 2-3 sections present, report feels incomplete
- 0: No structured report produced, just a summary paragraph

### Criterion 2: Vendor Citations Included (weight: 3)
- 5: Vendor Context section incorporates searcher findings — Veeam KB4438, KB5034441, and Veeam guest processing docs all referenced with URLs. Citations are woven into the analysis, not just listed
- 3: Citations listed but not connected to the root cause analysis
- 1: Only one citation mentioned or citations without URLs
- 0: No vendor citations despite searcher providing them

### Criterion 3: Likely Causes Ranked with Confidence (weight: 2)
- 5: Likely Causes section lists hypotheses ranked by confidence (high/medium/low) with evidence references. Primary cause (Veeam KB4438 race condition after Windows Update reboot) is ranked highest
- 3: Causes listed but not ranked, or ranked without evidence references
- 1: Only one cause mentioned with no ranking framework
- 0: No root cause synthesis

### Criterion 4: Recommended Actions with Exact Commands (weight: 2)
- 5: Recommended Actions section includes specific commands (Set-Service for delayed start, Start-Service, manual backup trigger) with risk levels. Explicitly notes these are recommendations, NOT executed
- 3: Actions described in prose but missing exact commands or risk levels
- 1: Vague recommendations like "fix the service"
- 0: No recommended actions

### Criterion 5: Blast Radius Identified (weight: 1)
- 5: Blast Radius section identifies that dc-01 provides AD/DNS/DHCP for the subnet, lists affected services and hosts, and notes risk timeline (compliance audit, RPO violation)
- 3: Mentions dc-01 is important but does not map dependencies
- 1: Brief mention of impact without specifics
- 0: No blast radius analysis

## Required Elements
- [ ] Report header with issue summary, host (dc-01 / 172.16.20.15), and "observe" mode label
- [ ] Evidence from investigator integrated (Windows Event logs, service status, port check)
- [ ] Veeam KB4438 cited as matching the exact symptom
- [ ] KB5034441 cited as the reboot trigger
- [ ] Primary root cause: Veeam Agent race condition after Windows Update reboot
- [ ] Recommended action: change to Automatic (Delayed Start)
- [ ] Explicit statement that no changes were made (observe mode)

## Anti-Patterns
- Executing commands instead of just reporting
- Ignoring the searcher's Veeam KB4438 finding (this is the key citation)
- Producing a flat summary instead of using the structured report template
- Omitting the "What I Don't Know" section (gaps drive follow-up)
- Recommending actions without specifying they are NOT yet executed
