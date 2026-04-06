# Verifier: Tension Resolution

## Target Agent
dispatcher.md (from teams/2-infra-ops/)

## Context Files
context.md (from teams/2-infra-ops/)

## Scoring Rubric

### Criterion 1: Correct Tension Identification (weight: 2)
- 5: Explicitly identifies this as the Speed vs Depth tension, notes that the default for recurring issues is Depth (not Speed), and references the team's tension framework
- 3: Identifies the disagreement but doesn't explicitly reference the tension framework
- 1: Treats it as a simple routing decision without recognizing the tension
- 0: Doesn't acknowledge the disagreement

### Criterion 2: Evidence-Based Decision (weight: 3)
- 5: Decision is grounded in analyst's evidence: 3 incidents in 10 days, memory trending upward (62%→84%), MaxRequestWorkers warnings. Uses specific data points to justify the decision, not just general principles.
- 3: References some evidence but doesn't use all the key data points
- 1: Makes a decision based on general principles without referencing the specific evidence
- 0: Ignores the evidence entirely

### Criterion 3: Synthesized Resolution (weight: 3)
The best mediation synthesizes both positions, not just picks one side:
- 5: Acknowledges responder's success in restoration AND sides with analyst on root cause investigation. Creates a plan that satisfies both: keep the service running (responder's concern) AND investigate now, not deferred to next week (analyst's concern). For example: "Service is restored — good. But 3 incidents in 10 days with a clear memory trend means investigation starts now, not next week."
- 3: Picks the right side (analyst/Depth) but doesn't synthesize — dismisses the responder's valid concern about uptime
- 1: Picks the wrong side (responder/Speed) for a recurring issue, OR defers investigation to next week
- 0: No resolution — just restates both positions

### Criterion 4: Concrete Next Steps (weight: 2)
- 5: Specifies exactly what happens next: which agent does what (analyst investigates memory leak, operator implements preventive monitoring, documenter updates runbook), with actionable task descriptions
- 3: Mentions next steps but they're vague
- 1: Resolution without any follow-up plan
- 0: No next steps

### Criterion 5: Pattern Recognition (weight: 1)
- 5: Explicitly calls out the escalating pattern (3 in 10 days, memory trending up) as evidence this will get worse — uses the pattern to justify urgency beyond "we should investigate sometime"
- 3: Notes the pattern but doesn't use it to justify urgency
- 1: Treats this as an isolated incident despite the recurrence data
- 0: No pattern recognition

## Required Elements
- [ ] Speed vs Depth tension is identified (explicitly or implicitly)
- [ ] Decision favors Depth (investigation) because this is a recurring issue
- [ ] Analyst's evidence is referenced (3 incidents, memory trend, MaxRequestWorkers)
- [ ] Responder's restoration is acknowledged positively
- [ ] Investigation is NOT deferred to "next week" — it starts soon/immediately
- [ ] At least one concrete next step with an agent assignment

## Anti-Patterns
- Simply siding with the responder and closing the ticket (ignores recurrence)
- Deferring investigation to the maintenance window (the trend suggests urgency)
- Not acknowledging responder's contribution (they did restore service)
- Making a decision without referencing any of the provided evidence
- Treating this as a one-off when it's clearly a pattern
