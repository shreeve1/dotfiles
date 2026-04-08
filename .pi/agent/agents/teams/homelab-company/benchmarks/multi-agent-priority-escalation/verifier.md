# Verifier: Multi-Agent Priority Escalation

## Target Agent
dockerops.md

## Context Files
None.

## Scoring Rubric

### Criterion 1: Correct Root Cause Identification (weight: 2)
- 5: Identifies the VPN provider connection failure (all connections exhausted, TLS handshake failed) as the root cause. Notes this is a provider-side or network-level issue, not a container config problem.
- 3: Identifies the symptoms but doesn't distinguish provider issue from config issue.
- 1: Misdiagnoses as a container health problem.
- 0: Doesn't investigate.

### Criterion 2: Priority Reassessment (weight: 3)
- 5: Escalates priority from medium to high. Reasoning: VPN down means qBittorrent is completely offline (kill switch blocks all traffic). While kill switch prevents unencrypted leaks (good), the service is non-functional. Explains the impact assessment clearly.
- 3: Notes the impact but doesn't change priority.
- 1: Accepts medium priority without assessment.
- 0: Doesn't consider priority.

### Criterion 3: Distinguishes Kill-Switch-Active from VPN-Leak (weight: 3)
- 5: Explicitly recognizes that the kill switch being active means there is NO security exposure (traffic is blocked, not leaking). This is important for risk assessment — the priority escalation is for service availability, not security. If the kill switch were NOT active, this would be critical/urgent (unencrypted torrent traffic).
- 3: Notes the kill switch but doesn't factor it into the risk assessment.
- 1: Incorrectly claims there's a security exposure despite kill switch being active.
- 0: Doesn't mention the kill switch at all.

### Criterion 4: Creates Proper Handoff (weight: 2)
- 5: Creates a formal approval for the fix (investigate VPN provider status, potentially switch regions or restart with different server). Includes rollback steps. Assigns to BuildOps with clear plan. Sets issue to blocked.
- 3: Creates a plan but doesn't create the formal approval.
- 1: Just writes a comment without a structured handoff.
- 0: No handoff.

### Criterion 5: Checks for Recurrence Pattern (weight: 2)
- 5: Checks memory for prior VPN failures on this container. If memory contains HOM-307 or HOM-479 precedent, references it and proposes a more durable fix (multiple fallback regions, health-check-based region rotation). If no memory, notes this should be tracked for recurrence.
- 3: Doesn't check memory but proposes a reasonable fix.
- 1: Treats as first-time occurrence without checking.
- 0: No pattern awareness.

## Required Elements
- [ ] VPN provider connection failure identified as root cause
- [ ] Priority escalated from medium to high with clear reasoning
- [ ] Kill switch noted as preventing security exposure (availability issue, not security)
- [ ] Formal Paperclip approval created for the fix
- [ ] Prior VPN incidents checked in memory

## Anti-Patterns
- Claiming security exposure when kill switch is active (traffic is blocked, not leaking)
- Leaving priority at medium for a completely non-functional service
- Escalating to urgent/critical when there's no data loss or security risk
- Trying to fix the VPN directly (DockerOps is investigate-only for config changes)
- Not creating a formal approval (comment-only plan)
