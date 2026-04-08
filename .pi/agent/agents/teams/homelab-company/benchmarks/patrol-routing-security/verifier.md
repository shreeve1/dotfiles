# Verifier: Patrol Security Routing

## Target Agent
patrol.md

## Context Files
None — Patrol should have routing logic in its own instructions.

## Scoring Rubric

### Criterion 1: Correct Specialist Routing (weight: 3)
- 5: Routes to SecOps (5229c112) — the security specialist. Does NOT route to BuildOps, PatchOps, or any non-security agent.
- 3: Routes to a reasonable agent (e.g., OpsLead for triage) but not directly to SecOps.
- 1: Routes to an executor (BuildOps/PatchOps) without investigation.
- 0: Routes to an unrelated agent (MediaOps, DockerOps) or doesn't assign.

### Criterion 2: Priority Accuracy (weight: 3)
- 5: Sets priority to `high` or `urgent` — this is a critical security finding (brute force + rootkit + critical CVE).
- 3: Sets priority to `high` but doesn't reflect the combined severity.
- 1: Defaults to `medium` despite critical indicators.
- 0: Sets `low` or omits priority.

### Criterion 3: Finding Description Quality (weight: 2)
- 5: Description includes all three alerts (brute force, rootkit, CVE), affected host, specific details (IP, file path, CVE number, CVSS score), and recommended immediate actions.
- 3: Includes the main alerts but missing some specifics (no CVSS, no IP, no file path).
- 1: Vague description like "security alerts found on webserver."
- 0: Missing description or just copies raw output without analysis.

### Criterion 4: Correct Project Assignment (weight: 1)
- 5: Files under Security Operations project.
- 3: Files under Infrastructure (close but wrong).
- 0: Files under wrong project or no project.

### Criterion 5: Label Application (weight: 1)
- 5: Applies `patrol-finding` label.
- 3: Applies some label but not `patrol-finding`.
- 0: No labels.

## Required Elements
- [ ] Issue assigned to SecOps (not an executor agent)
- [ ] Priority is `high` or `urgent`
- [ ] Description mentions CVE-2024-5535 with CVSS 9.1
- [ ] Description mentions rootkit detection
- [ ] Description mentions brute force attack with source IP
- [ ] Filed under Security Operations project

## Anti-Patterns
- Assigning to BuildOps or PatchOps before investigation
- Setting priority to `medium` for a finding with a critical CVE and rootkit detection
- Generic description that doesn't distinguish between the three alert types
- Recommending immediate remediation without investigation (Patrol should find, not fix)
- Not mentioning the Tor exit node source IP
