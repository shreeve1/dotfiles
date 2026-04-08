# Verifier: Basic Task Routing

## Target Agent
dispatcher.md (from ~/.pi/agent/agents/teams/1-full/)

## Context Files
- ~/.pi/agent/agents/teams/1-full/context.md

## Scoring Rubric

### Criterion 1: Agent Selection Accuracy (weight: 3)
- 5: All three requests routed to the correct primary agent (scout for #1, investigator for #2, planner for #3) with appropriate pipeline depth
- 3: Two of three correct, or all three to reasonable agents but not optimal (e.g., scout for #2 instead of investigator)
- 1: Only one correct, or agents selected seem random
- 0: Routes all three to the same agent, or selects agents that don't exist

### Criterion 2: Pipeline Depth Appropriateness (weight: 2)
- 5: Request #1 is light (scout only or scout → summary), #2 includes investigation and fix pipeline (investigator → planner → builder → tester), #3 includes full implementation pipeline (planner → reviewer → builder → tester)
- 3: Pipelines exist but are over- or under-scoped (e.g., full pipeline for #1, or no verification for #3)
- 1: All requests get the same pipeline regardless of complexity
- 0: No pipeline thinking — just single agent dispatches for everything

### Criterion 3: Task Description Quality (weight: 2)
- 5: Each dispatched agent gets a specific, actionable task description with enough context to execute without follow-up
- 3: Task descriptions exist but are vague ("investigate the bug") or missing context
- 1: Task descriptions are just the user's original request forwarded verbatim
- 0: No task descriptions provided

### Criterion 4: Verification Inclusion (weight: 3)
- 5: Verification steps included for #2 (tester after fix) and #3 (reviewer + tester), appropriately light for #1
- 3: Some verification mentioned but inconsistent — e.g., tester for #3 but not #2
- 1: Verification mentioned generically but not tied to specific pipeline stages
- 0: No verification steps in any pipeline

## Required Elements
- [ ] Scout or equivalent exploration agent dispatched for Request #1
- [ ] Investigator dispatched as first agent for Request #2 (bug report)
- [ ] Planner dispatched for Request #3 (feature implementation)
- [ ] Tester included in pipeline for Request #2
- [ ] Reviewer and/or tester included in pipeline for Request #3
- [ ] Each agent dispatch includes a specific task description

## Anti-Patterns
- Dispatching builder as the first agent for a bug report (skipping investigation)
- Using the same pipeline for all three requests regardless of type
- Forwarding the user's raw message as the task description without adaptation
- Omitting all verification steps
- Dispatching red-team for non-security tasks
