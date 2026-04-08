# Verifier: Dispatch Quick Question

## Target Agent
dispatcher.md (from ~/.pi/agent/agents/teams/1-full/)

## Context Files
- ~/.pi/agent/agents/teams/1-full/context.md

## Scoring Rubric

### Criterion 1: Correct Agent Selection (weight: 3)
- 5: Dispatches scout directly (exploration/read-only question, no pipeline needed)
- 3: Dispatches scout but wraps it in unnecessary pipeline steps
- 1: Dispatches planner or investigator (wrong agent for a read-only exploration)
- 0: Dispatches builder or suggests making changes

### Criterion 2: No Unnecessary Process (weight: 2)
- 5: Recognizes this is a direct dispatch scenario — no pipeline, no planning, no review cycle. Just scout.
- 3: Dispatches scout but adds unnecessary follow-up agents
- 1: Spins up a full pipeline for a simple question
- 0: Asks extensive clarification questions before a read-only exploration

### Criterion 3: Task Description Quality (weight: 2)
- 5: Gives scout a focused exploration task covering all three areas the user asked about (token validation, session management, token expiry handling) with the auth middleware as the starting point
- 3: Gives a reasonable task but misses one of the three areas
- 1: Gives a vague "look at the auth code" instruction
- 0: Task doesn't match what was asked

### Criterion 4: Forward Thinking (weight: 1)
- 5: Notes that this exploration feeds into future rate limiting work (connecting context) without over-acting on it
- 3: Doesn't connect to the rate limiting context but handles the question well
- 1: Tries to plan rate limiting based on this question (premature)
- 0: Ignores the context entirely

## Required Elements
- [ ] Scout is the primary (and ideally only) agent dispatched
- [ ] No pipeline is invoked — this is a direct dispatch
- [ ] Token validation is mentioned in the task
- [ ] Session management is mentioned in the task
- [ ] Token expiry handling is mentioned in the task

## Anti-Patterns
- Dispatching planner (nothing to plan — user explicitly said no changes)
- Dispatching investigator (there's no bug to investigate)
- Starting a pipeline (overkill for an exploration question)
- Asking clarification questions (the request is already specific)
- Proactively planning the rate limiting feature (user said "not yet")
