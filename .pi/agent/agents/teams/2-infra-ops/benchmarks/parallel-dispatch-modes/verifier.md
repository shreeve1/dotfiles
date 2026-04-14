# Verifier: Parallel Dispatch Modes

## Target Agent
dispatcher.md (from teams/2-infra-ops/)

## Context Files
context.md (from teams/2-infra-ops/)

## Scoring Rubric

### Criterion 1: P1 Routes to Act-Class Agent Immediately (weight: 3)
- 5: P1 (Apache down, revenue impact, 1-hour deadline) routes to infra-responder immediately. Speed over Depth applied. Responder gets specific task: check Apache/PHP-FPM status, attempt restart, verify site responds. No observe-first delay for the P1
- 3: Routes to responder but with unnecessary investigation step first, or does not convey urgency
- 1: Routes to observe-class agent first for P1 (investigator before responder when site is down)
- 0: Does not prioritize P1 or treats both alerts equally

### Criterion 2: P3 Routes to Observe-Class Agents (weight: 3)
- 5: P3 (cert expiring in 8 days, certbot renewal failing) routes to infra-investigator + infra-searcher. Observe-first because: not urgent (8 days), needs root cause (why is renewal failing for 3 weeks?), no immediate action needed. Investigate before fixing
- 3: Routes to observe agents but does not articulate why observe-first is appropriate for P3
- 1: Routes P3 to act-class agent immediately (e.g., responder to "just renew the cert")
- 0: Ignores P3 entirely to focus on P1

### Criterion 3: Parallel Dispatch Explicit (weight: 2)
- 5: Explicitly states both P1 and P3 are handled in parallel — P1 responder dispatched simultaneously with P3 investigator + searcher. Does not serialize (handle P1 completely before starting P3)
- 3: Handles both but sequentially (P1 first, then P3 after P1 resolves)
- 1: Only addresses one alert, defers the other indefinitely
- 0: No parallel thinking

### Criterion 4: P1 Has Escalation Branches (weight: 2)
- 5: Defines escalation path for P1 — if Apache restart fails: check PHP-FPM, check disk space, check VM health on Proxmox. If site still down after service restart: investigate deeper (dispatch investigator). Time-boxed given 1-hour deadline
- 3: Mentions escalation but without specific branches or time-boxing
- 1: Only dispatches responder with no follow-up plan
- 0: No escalation thinking for P1

### Criterion 5: P3 Identifies Dual Problem (weight: 1)
- 5: Recognizes P3 has two issues: (1) the immediate symptom (cert expiring in 8 days) and (2) the underlying automation failure (certbot renewal has been failing for 3 weeks). Investigation should cover both — why certbot is failing, not just renew the cert
- 3: Mentions the renewal failure but focuses only on getting a new cert
- 1: Only addresses cert expiry without investigating why automation broke
- 0: No dual-problem recognition

## Required Elements
- [ ] P1 classified as P1/critical with business impact and time pressure noted
- [ ] P3 classified as P3/low with 8-day runway noted
- [ ] infra-responder dispatched for P1 (act-class, immediate)
- [ ] infra-investigator + infra-searcher dispatched for P3 (observe-class, parallel)
- [ ] Both alerts handled in parallel, not sequentially
- [ ] P1 escalation path defined with fallback steps
- [ ] P3 investigation covers both cert expiry symptom AND certbot automation failure
- [ ] Speed vs Depth tension referenced for P1 routing decision

## Anti-Patterns
- Treating P3 like P1 and dispatching responder to immediately renew cert (skips root cause)
- Treating P1 like P3 and dispatching investigator first when site is down and CEO is calling
- Serializing: "Let's handle P1 first, then we'll look at P3" (wastes the 8-day runway)
- Dispatching the same agent class for both (all observe or all act)
- Not noting that P3's certbot has been failing for 3 weeks (the real problem is the automation, not the cert)
- Ignoring the 1-hour deadline on P1
