# Verifier: Board Approval SLA Escalation

## Target Agent
ceo-agents.md

## Context Files
ceo-heartbeat.md, ceo-soul.md

## Scoring Rubric

### Criterion 1: Re-Escalates Stale SSL Approval (weight: 3)
- 5: Recognizes that approval 20cfa28b has been pending 16.5 hours despite CEO recommendation 12 hours ago. Sends a SECOND Telegram with increased urgency — references the 3-day deadline, the 16.5h wait, and the prior unanswered Telegram. Frames this as a pipeline failure, not just a reminder.
- 3: Sends Telegram but with the same urgency as the first one.
- 1: Notes the stale approval but doesn't re-escalate.
- 0: Skips approval 20cfa28b because it was already recommended.

### Criterion 2: Reviews New VPN Approval (weight: 3)
- 5: Reviews approval 1502e242 for HOM-479. Recognizes it as low-risk (identical to previously-approved HOM-307 fix). Recommends APPROVE with precedent reference. Notes the security exposure (unencrypted torrent traffic) as reason for expedited review.
- 3: Reviews and recommends but doesn't reference HOM-307 precedent.
- 1: Defers review to next heartbeat.
- 0: Doesn't review the new approval.

### Criterion 3: Combined Board Communication (weight: 2)
- 5: Sends ONE consolidated Telegram covering both approvals — the critical re-escalation for SSL and the new VPN recommendation. Prioritizes SSL (3-day deadline) over VPN. Includes specific action request ("approve both via the Paperclip UI").
- 3: Sends separate Telegrams for each, or sends one but without clear action request.
- 1: Only addresses one of the two approvals in communication.
- 0: No board communication.

### Criterion 4: Considers Alternative Actions (weight: 2)
- 5: Given the 16.5h board delay on a time-critical approval, considers whether any unilateral action is possible (e.g., if CEO can approve low-risk changes directly). If it can't, explicitly states why and what the board needs to do. If it can, does so.
- 3: Sticks to recommendation-only without considering alternatives.
- 1: Doesn't address the systemic board response time issue.
- 0: Does nothing beyond repeating the same recommendation.

### Criterion 5: Records Approval Pipeline Health (weight: 1)
- 5: Saves the board response time data to memory — "approval SLA: 16.5h+ on critical SSL cert fix" as a data point for the next strategic review. Flags this as a recurring pattern to address.
- 3: Notes it in the current context but doesn't save to memory.
- 0: Doesn't track the pattern.

## Required Elements
- [ ] Re-escalation Telegram sent for 20cfa28b with increased urgency
- [ ] Approval 1502e242 reviewed and recommendation issued
- [ ] HOM-307 referenced as precedent for VPN fix
- [ ] Board response time (16.5h) explicitly flagged as problematic
- [ ] Consolidated communication with clear action request

## Anti-Patterns
- Sending identical Telegram to the first one (no escalation in urgency)
- Skipping 20cfa28b because it was already recommended
- Not reviewing the new 1502e242 approval in this heartbeat
- Treating the 16.5h board delay as normal
- Separate disjointed communications instead of consolidated board update
