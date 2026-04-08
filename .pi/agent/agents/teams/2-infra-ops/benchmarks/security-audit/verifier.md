# Verifier: Security Audit

## Target Agent
hardener.md (from agents/infra-ops/)

## Context Files
context.md (from teams/2-infra-ops/)

## Scoring Rubric

### Criterion 1: Root Cause Analysis — What Allowed This (weight: 3)
- 5: Identifies all contributing factors: (a) RDP exposed to the internet with no source restriction, (b) service account with weak password and unnecessary local admin, (c) stale/unused service account not decommissioned, (d) no MFA on RDP, (e) no brute-force detection/lockout at the firewall level. Explains how each factor contributed to the attack chain.
- 3: Identifies 3 of 5 contributing factors
- 1: Only identifies the weak password without analyzing the broader attack surface
- 0: Misidentifies the root cause

### Criterion 2: Defense Analysis — What Prevented Escalation (weight: 2)
- 5: Credits the defenses that worked: (a) NLA on dc-01 blocked the extracted credentials, (b) SSH key-only auth on app-01 blocked lateral movement, (c) svc-backup was NOT a domain admin (principle of least privilege held), (d) Wazuh detected the lateral movement attempts. Explains why each mattered in the kill chain.
- 3: Mentions some defenses but doesn't explain why they mattered
- 1: Only negative findings, doesn't acknowledge what worked
- 0: No defense analysis

### Criterion 3: Hardening Recommendations — Prioritized (weight: 3)
Must include these recommendations, roughly in priority order:

**Immediate (before jump-01 comes back online):**
- Block inbound RDP at the firewall (or restrict to VPN-only access)
- Audit and rotate all service account passwords
- Disable or delete unused service accounts (svc-backup confirmed unused)
- Force password reset for any accounts that had cached credentials on jump-01

**Short-term (within 1 week):**
- Implement MFA for any remaining remote access
- Configure account lockout policy in AD (brute-force protection)
- Review and tighten Wazuh alerting rules to reduce the 23-minute detection gap
- Implement firewall geo-blocking or rate-limiting on exposed services

**Medium-term (within 1 month):**
- Implement a PAM (Privileged Access Management) solution or at minimum, remove local admin from service accounts
- Conduct a full service account audit across AD
- Establish a regular credential hygiene review process

- 5: Includes 8+ recommendations across all three timeframes, correctly prioritized (firewall fix and credential rotation before MFA rollout)
- 3: 5-7 recommendations with reasonable priority
- 1: Generic "improve security" without specific actions
- 0: No recommendations

### Criterion 4: Detection Gap Analysis (weight: 2)
- 5: Explicitly addresses the 23-minute detection gap (03:12 login to 03:35 Wazuh alert). Analyzes why: Wazuh triggered on lateral movement attempts, not on the initial RDP login from an unusual source. Recommends specific improvements: alert on RDP login from non-allowlisted IPs, alert on service account interactive login, reduce the detection-to-alert latency.
- 3: Notes the 23-minute gap but doesn't analyze what specifically should have triggered earlier
- 1: Mentions detection in passing
- 0: Doesn't address the detection gap

### Criterion 5: Scope Discipline (weight: 1)
- 5: Recommendations are proportionate to a 15-person accounting firm (not an enterprise). Doesn't recommend a SIEM migration, zero-trust architecture, or full EDR deployment that would be out of scope/budget. Focuses on pragmatic wins with existing tools (pfSense rules, AD policies, Wazuh tuning).
- 3: Mostly proportionate but one or two enterprise-grade recommendations
- 1: Enterprise recommendations for a small business
- 0: Completely out of scope

## Required Elements
- [ ] RDP internet exposure identified as primary enabler
- [ ] Unused service account with weak password identified
- [ ] NLA on dc-01 and SSH key auth on app-01 credited as effective defenses
- [ ] Firewall rule change recommended (block or restrict inbound RDP)
- [ ] Service account audit recommended
- [ ] 23-minute detection gap analyzed with improvement recommendations
- [ ] Recommendations are prioritized by timeframe (immediate / short-term / medium-term)

## Anti-Patterns
- Only recommending "change the password" without addressing the firewall exposure (the password was the symptom, the exposure was the cause)
- Not crediting defenses that worked (this was a partial success story, not just a failure)
- Recommending enterprise solutions for a 15-person firm (PAM suite, zero-trust, full SOC)
- Ignoring the other 4 service accounts (if svc-backup was weak, others may be too)
- Not addressing the detection gap (23 minutes is an eternity in an active breach)
- Treating this as "resolved" because the attacker was stopped — the conditions that allowed it still exist
