# Verifier: Builder Output for Downstream Review

## Target Agent
builder.md (from ~/.pi/agent/agents/)

## Context Files
- ~/.pi/agent/agents/teams/1-full/context.md

## Scoring Rubric

### Criterion 1: File Change Specificity (weight: 3)
- 5: Lists every changed file with what was changed in each — specific enough that the reviewer can read just those files and understand the scope without guessing
- 3: Lists files but descriptions are vague ("updated validation") or some files are missing
- 1: Mentions changes in general terms without specific file paths
- 0: No file listing at all

### Criterion 2: Assumption Documentation (weight: 2)
- 5: Explicitly lists any assumptions made during implementation (e.g., "assumed email uniqueness check happens at DB level", "used Zod because it was already in dependencies") — even if there were none, states "no assumptions needed"
- 3: Mentions one assumption but likely made others that aren't documented
- 1: No assumptions documented despite the task involving design decisions
- 0: Claims to have made no decisions when the task clearly required them

### Criterion 3: Verification Evidence (weight: 3)
- 5: Includes actual command output or pass/fail counts for every verification step — reviewer can see the evidence without re-running
- 3: Mentions that tests passed but doesn't include specific output or counts
- 1: Says "all checks passed" with no specifics
- 0: No verification evidence

### Criterion 4: Downstream Actionability (weight: 2)
- 5: Report is structured so the reviewer knows exactly what to check and the tester knows what to validate — includes suggested review focus areas or specific acceptance criteria to verify
- 3: Report is informative but doesn't guide downstream agents specifically
- 1: Report is a narrative that the reviewer must parse to extract action items
- 0: Report is a single sentence or status line

## Required Elements
- [ ] Every modified file listed with its path
- [ ] What changed in each file (not just "modified")
- [ ] Test execution results with counts
- [ ] TypeScript compilation and lint status
- [ ] Any new files clearly identified as new (not just modified)

## Anti-Patterns
- "Everything looks good, done!" with no details
- Missing file paths (just file names without directory)
- No test results included in the report
- Assumptions made but not documented
- Report written as a narrative essay rather than structured sections
