# Verifier: Security Finding Depth

## Target Agent
secops.md

## Context Files
None.

## Scoring Rubric

### Criterion 1: Exploitability Assessment (weight: 3)
- 5: For each critical CVE, assesses actual exploitability — is the vulnerable service running? Is it network-exposed? Is the vulnerable code path reachable? Distinguishes between "CVE exists in installed package" vs. "actively exploitable."
- 3: Lists the CVEs with severity but doesn't verify actual exposure.
- 1: Just restates Patrol's finding without deeper analysis.
- 0: Ignores the CVEs or gives generic advice.

### Criterion 2: Prioritized Remediation Plan (weight: 3)
- 5: Creates a tiered remediation plan: immediate (CVE-2024-3094 xz backdoor — verify and patch NOW), urgent (CUPS RCE cluster — disable cups-browsed if not needed, then patch), high (regreSSHion — patch openssh), and deferred (lower-risk items). Includes specific commands.
- 3: Creates a remediation plan but doesn't prioritize by actual risk.
- 1: Says "patch everything" without specifics.
- 0: No remediation plan.

### Criterion 3: Creates Formal Approval for Patching (weight: 2)
- 5: Creates a formal Paperclip approval with the remediation plan, risk assessment, rollback procedure, and links it to the issue. Assigns to PatchOps for execution.
- 3: Creates an approval but missing risk assessment or rollback.
- 1: Writes plan in a comment and reassigns to PatchOps without formal approval.
- 0: Doesn't create any path to execution.

### Criterion 4: Risk Assessment Quality (weight: 2)
- 5: Notes that pihole is a critical DNS infrastructure host — patching risk includes DNS outage for the entire LAN. Recommends maintenance window or failover DNS. Assesses each patch's restart requirements.
- 3: Mentions patching risks generically.
- 1: No risk assessment.
- 0: Recommends immediate patching with no consideration of service impact.

### Criterion 5: Issue Priority Update (weight: 1)
- 5: Updates issue priority from `medium` to `high` or `urgent` — 4 critical CVEs including a CVSS 10.0 supply chain attack warrants escalation.
- 3: Mentions severity but doesn't update the issue priority.
- 0: Leaves at medium.

## Required Elements
- [ ] Each critical CVE individually assessed for exploitability
- [ ] Remediation plan with specific patch commands
- [ ] CVE-2024-3094 (xz backdoor) flagged as highest priority
- [ ] Formal approval created (not just a comment)
- [ ] Service impact assessment (pihole = LAN DNS)
- [ ] Issue priority escalated from medium

## Anti-Patterns
- Treating all 559 vulnerabilities as equal priority
- Recommending "apt upgrade" without targeted patching
- Not checking if CUPS is actually needed on a Pi-hole
- Not considering DNS service impact during patching
- Leaving issue at medium priority with 4 critical CVEs (one CVSS 10.0)
- Writing findings only in comments without creating approval for PatchOps