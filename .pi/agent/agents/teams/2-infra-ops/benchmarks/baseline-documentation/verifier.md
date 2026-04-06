# Verifier: Baseline Documentation

## Target Agent
documenter.md (from agents/infra-ops/)

## Context Files
context.md (from teams/2-infra-ops/)

## Scoring Rubric

### Criterion 1: Completeness (weight: 3)
All provided information should be captured. Score based on coverage:
- 5: Captures all categories: host identity, OS details, roles/services, network config, storage, users/security, backup status, and scout's concerns
- 4: Misses 1 category
- 3: Misses 2 categories
- 1: Captures only half the information
- 0: Major gaps — missing 4+ categories

### Criterion 2: Structure and Navigability (weight: 2)
- 5: Well-organized with clear sections, headers, and consistent formatting. A team member could quickly find "What's the DHCP scope?" or "When was the last backup?" without reading the whole document.
- 3: Organized but some information is buried or sections are inconsistently structured
- 1: Wall of text or poorly organized
- 0: Not usable as reference documentation

### Criterion 3: Actionable Concerns (weight: 2)
Scout flagged 4 concerns. The baseline should surface these prominently:
- RDP without NLA
- Stale Defender definitions
- Short DHCP lease time
- No secondary DNS

- 5: All 4 concerns are documented in a dedicated section with severity/priority and recommended actions
- 4: 3 of 4 concerns documented with recommendations
- 3: Concerns listed but without severity or recommendations
- 1: 1-2 concerns mentioned in passing
- 0: Concerns not captured

### Criterion 4: Operational Usefulness (weight: 2)
- 5: Document includes specific values a responder would need during an incident: IP addresses, service names, backup location, credential count, gateway, DNS. Not just "DHCP is configured" but "DHCP scope 192.168.1.100-200, lease 8h"
- 3: Most specific values present but some important ones missing
- 1: Vague summaries instead of specific values
- 0: Not useful for incident response

### Criterion 5: Monitoring Baseline (weight: 1)
- 5: Includes what "normal" looks like — expected uptime patterns, backup schedule, expected service states — so future deviations are detectable
- 3: Some baseline expectations but not systematic
- 1: No "normal state" definition
- 0: N/A

## Required Elements
- [ ] Host identity: hostname, IP, OS version, domain
- [ ] All services listed with status
- [ ] DHCP scope details (range, lease time)
- [ ] Backup configuration (schedule, destination, last successful)
- [ ] Storage details (drives, capacity, free space)
- [ ] User/security summary (account counts, admin count)
- [ ] Network configuration (IP, gateway, DNS)
- [ ] Scout's 4 concerns captured with recommendations
- [ ] Document is structured with sections/headers

## Anti-Patterns
- Parroting scout's findings without organizing them (just copy-paste)
- Missing specific values (IP addresses, scope ranges, paths)
- Burying concerns in the middle of the document without priority
- Not including the backup verification (last successful backup)
- Generic template that doesn't use the actual provided data
