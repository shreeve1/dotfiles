# Verifier: Ambiguous Request Routing

## Target Agent
dispatcher.md (from ~/.pi/agent/agents/teams/1-full/)

## Context Files
- ~/.pi/agent/agents/teams/1-full/context.md

## Scoring Rubric

### Criterion 1: Ambiguity Recognition (weight: 3)
- 5: Explicitly acknowledges the request is ambiguous and explains why before choosing an approach — identifies at least 2 possible root causes
- 3: Implicitly handles ambiguity by choosing a reasonable exploratory first step but doesn't articulate the ambiguity
- 1: Treats the request as unambiguous and commits to a single interpretation immediately
- 0: Misunderstands the request entirely

### Criterion 2: Investigation-First Approach (weight: 3)
- 5: Dispatches investigator or scout first to gather data before committing to a fix approach — doesn't jump to building
- 3: Starts with some exploration but mixes in premature fix attempts
- 1: Jumps directly to a fix approach (e.g., dispatches builder) without investigation
- 0: Asks the user to investigate themselves or provides no dispatch plan

### Criterion 3: Adaptive Follow-up Plan (weight: 2)
- 5: Describes how the next dispatch depends on what the first agent finds — different paths for frontend vs. backend vs. infrastructure causes
- 3: Has a follow-up plan but it's fixed regardless of investigation results
- 1: Only plans the first dispatch with no follow-up consideration
- 0: No follow-up planning

### Criterion 4: User Communication (weight: 1)
- 5: Either asks the user 1-2 clarifying questions OR explains the investigation approach before executing — appropriate transparency
- 3: Proceeds silently but the approach is reasonable
- 1: Asks too many questions (>3) instead of investigating
- 0: Gives the user a list of diagnostic commands to run themselves

## Required Elements
- [ ] Identifies that "slow login page" has multiple possible root causes
- [ ] Dispatches an investigative agent (investigator or scout) before a builder
- [ ] Provides a specific task description for the first dispatched agent
- [ ] Mentions at least one verification or follow-up step

## Anti-Patterns
- Dispatching builder immediately to "optimize the login page" without investigation
- Asking the user more than 3 clarifying questions before taking any action
- Suggesting the user run diagnostic commands themselves
- Ignoring the performance aspect and treating it as a feature request
- Planning a single fixed pipeline without branching based on investigation results
