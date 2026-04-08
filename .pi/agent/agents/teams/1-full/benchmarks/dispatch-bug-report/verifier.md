# Verifier: Dispatch Bug Report

## Target Agent
dispatcher.md (from ~/.pi/agent/agents/teams/1-full/)

## Context Files
- ~/.pi/agent/agents/teams/1-full/context.md

## Scoring Rubric

### Criterion 1: Correct Pipeline Selection (weight: 3)
- 5: Routes to investigator first (debugging pipeline), explicitly because root cause is unknown
- 3: Routes to investigator but doesn't clearly follow the debugging pipeline pattern
- 1: Skips investigation, routes directly to planner or builder
- 0: Routes to scout, documenter, or web-searcher as the primary action

### Criterion 2: Task Description Quality (weight: 2)
- 5: Gives the investigator a specific, actionable task with all known symptoms (endpoint, error code, timing pattern, customer impact)
- 3: Gives a reasonable task but misses key details from the user's report
- 1: Gives a vague task like "look into the 500 errors"
- 0: No task description, or task is for the wrong problem

### Criterion 3: Pipeline Continuation (weight: 2)
- 5: Explicitly states the post-investigation plan (investigator → planner → builder → reviewer → tester) or appropriate subset
- 3: Mentions next steps after investigation but doesn't specify the full pipeline
- 1: Only dispatches the investigator with no mention of what happens after diagnosis
- 0: No pipeline thinking at all

### Criterion 4: Clarification Judgment (weight: 1)
- 5: Proceeds without unnecessary clarification questions (enough info exists to dispatch) OR asks 1 focused question that genuinely adds value
- 3: Asks 1-2 questions that are reasonable but not strictly necessary
- 1: Asks 3+ questions before dispatching, over-clarifying
- 0: Asks no questions AND misses critical ambiguity, OR blocks entirely on clarification

### Criterion 5: Urgency Awareness (weight: 1)
- 5: Recognizes this is an active production issue affecting customers and treats it with appropriate urgency (bias toward action)
- 3: Acknowledges the issue but doesn't convey urgency in dispatch priority
- 1: Treats it like a routine feature request
- 0: Deprioritizes or suggests deferring

## Required Elements
- [ ] Investigator is the first agent dispatched
- [ ] The debugging pipeline pattern is followed or referenced
- [ ] The task description includes the endpoint (/api/orders)
- [ ] The task description includes the error type (500)
- [ ] The intermittent/peak-hours pattern is mentioned

## Anti-Patterns
- Routing to planner first (unknown root cause — can't plan a fix yet)
- Routing to builder first (nothing to build yet)
- Asking more than 2 clarification questions (enough info to start)
- Dispatching scout for a bug report (scout is for exploration, not debugging)
