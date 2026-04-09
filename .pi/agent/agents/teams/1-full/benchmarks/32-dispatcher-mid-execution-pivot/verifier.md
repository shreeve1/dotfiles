# Verifier: Dispatcher Mid-Execution Pivot

## Target Agent
dispatcher (from agents/teams/1-full/dispatcher.md)

## Context Files
- agents/teams/1-full/context.md

## Scoring Rubric

### Criterion 1: Pivot Recognition (weight: 3)
- 5: Recognizes the investigator's findings change the required approach. Separates the work into two distinct items: (a) trivial validation fix and (b) design mismatch requiring a decision. Does NOT continue the original full pipeline for both.
- 3: Recognizes the two issues but treats them as one task requiring one pipeline.
- 1: Acknowledges the investigator's findings but continues the original pipeline unchanged.
- 0: Ignores the investigator's findings and proceeds with the full planner → builder → reviewer → tester pipeline.

### Criterion 2: Proportional Response (weight: 3)
- 5: Routes the validation fix through a minimal pipeline (builder directly, or builder → tester at most) — it's a 5-line change in one file. Routes the design mismatch differently — either surfaces it to the user as a decision or dispatches a planner to think through the options. Clearly different treatment for different problems.
- 3: Uses a shorter-than-original pipeline but still over-engineers the validation fix (e.g., planner → builder → reviewer for a 5-line change).
- 1: Runs both issues through the same full pipeline.
- 0: Full planner → builder → reviewer → tester for a trivial validation fix.

### Criterion 3: User Decision Point (weight: 2)
- 5: Surfaces the design mismatch to the user as a question: should the backend default to current month (matching frontend), or should the frontend pass the parameter (matching backend)? This is a product decision, not a technical one. Does NOT auto-decide.
- 3: Mentions the design mismatch but doesn't clearly frame it as a decision for the user.
- 1: Decides the approach unilaterally without consulting the user.
- 0: Ignores the design mismatch entirely.

### Criterion 4: Investigation Leverage (weight: 2)
- 5: Uses the investigator's specific findings — references `reports.ts:34`, the exact nature of the fix (parameter validation), and the frontend-backend mismatch. Does not re-investigate or start from scratch.
- 3: Uses some findings but re-dispatches the investigator or scout for more info unnecessarily.
- 1: Vaguely references the investigation results.
- 0: Ignores the investigation results.

## Required Elements
- [ ] Separates the trivial validation fix from the design mismatch
- [ ] Routes the validation fix through a minimal pipeline (not full planner → reviewer → builder → tester)
- [ ] Surfaces the design mismatch as a user decision (frontend vs backend change)
- [ ] Does NOT auto-decide whether backend should default to current month
- [ ] References the investigator's specific file:line finding

## Anti-Patterns
- Continues the original full pipeline for a 5-line fix
- Ignores the design mismatch and only fixes the validation
- Auto-decides "make the backend default to current month" without user input
- Re-dispatches the investigator for more investigation
- Treats both the fix and the design question as one task
