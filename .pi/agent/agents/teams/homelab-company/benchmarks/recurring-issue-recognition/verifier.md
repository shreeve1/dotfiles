# Verifier: Recurring Issue Recognition

## Target Agent
dockerops.md

## Context Files
None.

## Scoring Rubric

### Criterion 1: Recognizes the Recurrence (weight: 3)
- 5: Explicitly identifies this as the same root cause as HOM-307 — PIA Montreal server unreachable, same IP range (84.247.105.x), same symptoms (TLS handshake failure, ENETUNREACH). References the prior fix from memory.
- 3: Notes similarity to a previous issue but doesn't connect them definitively.
- 1: Investigates from scratch without checking memory.
- 0: Treats this as a novel issue.

### Criterion 2: Reuses the Known Fix (weight: 3)
- 5: Proposes the same fix (change SERVER_REGIONS away from Montreal) or a better one (add server region failover). References the exact commands and file path from the prior fix. Does not re-investigate what is already known.
- 3: Proposes a similar fix but re-derives it from scratch.
- 1: Proposes a different fix that doesn't address the root cause.
- 0: Says it needs more investigation before proposing anything.

### Criterion 3: Creates Approval Immediately (weight: 3)
- 5: Creates a formal Paperclip approval request in the same run — doesn't punt to OpsLead or wait for another agent. The approval payload references HOM-307 as precedent, includes the fix commands, risk assessment (low — identical to prior approved fix), and rollback steps.
- 3: Creates an approval but doesn't reference the prior precedent.
- 1: Writes a comment with the plan but doesn't create the formal approval.
- 0: Hands off without creating an approval.

### Criterion 4: Priority Escalation (weight: 2)
- 5: Escalates priority from medium to high — VPN down means qBittorrent traffic is unencrypted (security exposure). Explains the impact.
- 3: Notes the priority might be wrong but doesn't change it.
- 1: Accepts medium priority without question.
- 0: Doesn't consider priority.

### Criterion 5: Efficiency (weight: 1)
- 5: Completes investigation + approval creation in minimal steps. No unnecessary SSH commands since the root cause is already known from memory.
- 3: Does some redundant investigation but still resolves quickly.
- 0: Full re-investigation as if no prior knowledge exists.

## Required Elements
- [ ] HOM-307 referenced as prior identical incident
- [ ] Same root cause identified (PIA Montreal unreachable)
- [ ] Fix proposed matches or improves on prior fix
- [ ] Formal Paperclip approval created (not just a comment)
- [ ] Approval references HOM-307 as precedent
- [ ] Priority escalated to high with security rationale

## Anti-Patterns
- Investigating from scratch when memory contains the answer
- Writing a comment-only plan without creating a formal approval
- Leaving priority at medium when VPN-down has security implications
- Proposing a different fix without explaining why the prior fix is insufficient
- Handing off to another agent for investigation that's already complete
