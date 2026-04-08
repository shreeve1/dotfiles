# Verifier: Cross-Issue Dependency Resolution

## Target Agent
opslead.md

## Context Files
None.

## Scoring Rubric

### Criterion 1: Identifies the Dependency Chain (weight: 3)
- 5: Explicitly states that HOM-283 (critical, SSL expiry) is blocked by HOM-370 (NPM API down), and that resolving HOM-370 is the highest-priority action because it unblocks a critical time-sensitive issue. Frames HOM-370 as effectively critical despite its own "high" priority.
- 3: Handles both issues but doesn't explicitly connect the dependency.
- 1: Addresses HOM-283 and HOM-370 independently.
- 0: Doesn't notice the relationship.

### Criterion 2: Prioritizes the Blocker (weight: 3)
- 5: Assigns HOM-370 to NetOps immediately and escalates its effective priority. Makes it the #1 action item — before HOM-515 (medium CPU) and HOM-520 (low storage). Explains that unblocking HOM-283 is time-critical.
- 3: Assigns HOM-370 but doesn't prioritize it over other items.
- 1: Assigns HOM-370 but treats it as routine priority.
- 0: Doesn't assign HOM-370 or assigns a lower-priority issue first.

### Criterion 3: Escalation for 38h Unassigned Critical Blocker (weight: 2)
- 5: Flags that HOM-370 has been unassigned for 38 hours as a triage failure. Sends Telegram alert noting: "Critical blocker unworked for 38h — SSL certs expire in 3 days." Considers escalating to CEO if NetOps is unavailable.
- 3: Notes the age but doesn't escalate.
- 1: Assigns without noting the 38h delay.
- 0: Doesn't notice the issue has been unassigned for 38h.

### Criterion 4: Leaves Low-Priority Work Appropriately (weight: 1)
- 5: HOM-515 and HOM-520 are acknowledged but explicitly deprioritized in favor of the HOM-370/283 chain. Not ignored, but handled after the critical path.
- 3: Handles all issues in arbitrary order.
- 0: Spends time on HOM-515 or HOM-520 before addressing the critical chain.

## Required Elements
- [ ] HOM-370 identified as the blocker for HOM-283
- [ ] HOM-370 assigned to NetOps (or appropriate network specialist)
- [ ] HOM-370 treated as top priority (even above its nominal "high" rating)
- [ ] Telegram alert sent about the 38h unassigned critical blocker
- [ ] SSL expiry deadline (3 days) mentioned as urgency driver

## Anti-Patterns
- Treating HOM-370 and HOM-283 as independent issues
- Assigning HOM-370 at normal priority without urgency escalation
- Working on HOM-515 or HOM-520 before the critical blocker chain
- Not sending Telegram despite a 38h unassigned blocker with a hard deadline
- Trying to fix HOM-283 directly without resolving HOM-370 first
