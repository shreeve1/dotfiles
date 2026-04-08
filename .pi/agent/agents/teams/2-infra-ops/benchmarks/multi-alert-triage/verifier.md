# Verifier: Multi-Alert Triage

## Target Agent
dispatcher.md (from teams/2-infra-ops/)

## Context Files
context.md (from teams/2-infra-ops/)

## Scoring Rubric

### Criterion 1: Correct Priority Ordering (weight: 3)
- 5: Firewall down is P1 (all internet connectivity lost, VoIP down, EHR inaccessible for a medical practice). Disk usage is P3 (no current failure, 4-5 days before impact). P1 is handled first with full urgency. The medical context (EHR access) adds regulatory/patient-safety weight.
- 3: Correct ordering but doesn't articulate why firewall is P1 (misses the medical/EHR/VoIP angle)
- 1: Treats both as equal priority, or handles disk first
- 0: No priority assessment

### Criterion 2: Independent vs. Related Assessment (weight: 2)
- 5: Correctly identifies these as independent issues. The firewall being down doesn't cause disk growth on the backup server, and high disk usage doesn't cause firewall failures. Notes that the timing is coincidental. Does NOT waste time trying to find a common root cause.
- 3: States they're likely independent but hedges unnecessarily or suggests investigating a connection
- 1: Assumes they're related and tries to find a common cause (wastes time during a P1)
- 0: Doesn't consider the relationship at all

### Criterion 3: Parallel vs. Serial Dispatch (weight: 3)
- 5: Dispatches agents in parallel — responder to fw-01 immediately (P1), and operator to backup-01 concurrently (P3, independent issue). Does not make the disk cleanup wait for the firewall to be resolved. Recognizes that these are independent issues on different hosts that different specialists can handle simultaneously.
- 3: Handles them serially (firewall first, then disk) — correct priority but inefficient
- 1: Only addresses the firewall and defers disk entirely ("we'll deal with it later")
- 0: Only addresses the disk issue

### Criterion 4: P1 Task Quality (weight: 2)
- 5: Gives responder specific tasks for the firewall: check if pfSense VM/appliance is running, check WAN interface, attempt console access via hypervisor, check for recent config changes, attempt service restart. Includes the urgency context (medical practice, EHR, VoIP).
- 3: Dispatches to responder but task is generic
- 1: Vague dispatch ("fix the firewall")
- 0: No task description

### Criterion 5: P3 Task Quality (weight: 1)
- 5: Gives operator a specific task for disk: identify largest consumers (old backups, verify retention policy), clean up safely, verify PBS backup jobs still work after cleanup. Notes the 4-5 day window — not urgent but should be handled today.
- 3: Reasonable task but missing specifics
- 1: Defers entirely without a timeline
- 0: No task for disk issue

## Required Elements
- [ ] Firewall identified as P1 (with medical/EHR/VoIP urgency)
- [ ] Disk identified as P3 (no current failure, days of runway)
- [ ] Alerts assessed as independent (not related)
- [ ] Responder dispatched to firewall immediately
- [ ] Operator dispatched to disk (either parallel or promptly after)
- [ ] Both agents receive specific task descriptions

## Anti-Patterns
- Spending time looking for a common root cause during a P1 outage
- Serial handling when parallel is possible (different hosts, different agents, independent issues)
- Ignoring the disk alert entirely because the firewall is more urgent
- Not conveying the medical practice context to the responder (EHR and VoIP are critical for a medical office)
- Treating the disk alert as P1 (no current failure, days of runway)
