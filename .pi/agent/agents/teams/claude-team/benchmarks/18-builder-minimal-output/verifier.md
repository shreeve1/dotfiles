# Verifier: Concise Build Report

## Target Agent
builder.md (from ~/.pi/agent/agents/)

## Context Files
- ~/.pi/agent/agents/teams/1-full/context.md

## Scoring Rubric

### Criterion 1: Report Density (weight: 3)
- 5: Report contains all essential information (files changed, what changed, verification results, assumptions) in ≤25 lines of substantive content. No filler sentences, no restating the plan, no "In this implementation I..." preamble.
- 3: Report has the right information but padded to 25–50 lines with preamble, plan restatement, or verbose descriptions of trivial changes
- 1: Report exceeds 50 lines for a 3-file change, with extensive narration
- 0: Report is either a one-liner missing key info OR a multi-page essay

### Criterion 2: Information Completeness (weight: 3)
- 5: All 5 elements present: (1) files changed with paths, (2) what changed in each, (3) test/build results with counts, (4) new vs modified distinction, (5) assumptions or "none needed"
- 3: 3–4 of the 5 elements present
- 1: 1–2 elements present
- 0: Report is just "Done, all tests pass"

### Criterion 3: No Plan Restatement (weight: 2)
- 5: Report describes what was DONE, not what was planned. Does not copy or restate the plan's tasks — assumes the reviewer has the plan and just needs to know the implementation specifics and results.
- 3: Minor plan restatement (one sentence summarizing the goal) but mostly focused on results
- 1: Significant plan restatement — half the report repeats what was already in the plan
- 0: Report is essentially the plan with "done" appended to each step

### Criterion 4: Reviewer/Tester Guidance (weight: 2)
- 5: Includes a brief "review focus" or "what to verify" note that helps the reviewer know where to look — e.g., "check the parseInt fallback handles non-numeric PORT values"
- 3: Informative report but no explicit guidance for downstream agents
- 1: Report requires the reviewer to re-derive what to check
- 0: No awareness of downstream agents

## Required Elements
- [ ] All 3 modified files listed with paths
- [ ] Specific change described for each file (not just "updated")
- [ ] Test count (47/47) and compilation status included
- [ ] Manual verification result mentioned
- [ ] Report is structured (sections or clear formatting), not a narrative paragraph

## Anti-Patterns
- Starting with "I have completed the implementation of..." (preamble padding)
- Restating each plan step before saying what was done
- Including the full content of changed files instead of describing changes
- Omitting test results to keep the report short (wrong kind of conciseness)
- Adding suggestions for future improvements unrelated to the task
