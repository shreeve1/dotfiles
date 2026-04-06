# Verifier: P1 Incident Triage

## Target Agent
dispatcher.md (from teams/2-infra-ops/)

## Context Files
context.md (from teams/2-infra-ops/)

## Scoring Rubric

### Criterion 1: Severity Assessment (weight: 3)
- 5: Correctly identifies as P1/critical — production down, client-facing, business impact, time pressure (2-hour meeting)
- 3: Identifies as high severity but doesn't articulate the business urgency
- 1: Underrates severity (treats as P2/P3)
- 0: No severity assessment

### Criterion 2: First Responder Routing (weight: 3)
- 5: Routes to responder first (Speed wins for P1) with explicit reasoning that restoration takes priority over root cause analysis
- 3: Routes to responder but doesn't clearly articulate the Speed vs Depth tension resolution
- 1: Routes to analyst first (Depth — wrong priority for P1)
- 0: Routes to scout, documenter, or operator first

### Criterion 3: Task Description Quality (weight: 2)
- 5: Gives responder a specific task: check if VM is running, check Apache/PHP-FPM status, attempt service restart, verify recovery — with the host details (IP, services, OS)
- 3: Gives a reasonable task but missing specific service or host details
- 1: Vague task like "fix the web server"
- 0: No task description

### Criterion 4: Escalation Path (weight: 2)
- 5: Defines what happens after responder: if restored → analyst for root cause → documenter for runbook; if not restored → escalate (VM-level check, hypervisor check, network path)
- 3: Mentions next steps but not a complete escalation path
- 1: Only dispatches responder with no continuation
- 0: No escalation thinking

### Criterion 5: Tension Framework Application (weight: 1)
- 5: Explicitly references Speed vs Depth tension, correctly defaults to Speed for P1, and notes that Depth (analyst) follows after service is restored
- 3: Implicitly applies the right tension but doesn't reference the framework
- 1: No tension awareness
- 0: Applies the wrong tension default

## Required Elements
- [ ] Severity is P1/critical
- [ ] Responder is dispatched first
- [ ] Speed over Depth is the explicit or implicit choice
- [ ] Host details are included (192.168.1.10, Apache, PHP-FPM)
- [ ] Post-restoration plan includes analyst and/or documenter

## Anti-Patterns
- Dispatching analyst before responder for a P1 (Depth over Speed when site is down)
- Spending time on root cause before attempting restoration
- No urgency conveyed (the client has a 2-hour deadline)
- Dispatching scout to "explore" when the issue is clear (web server down)
