# Verifier: Scout Discovery

## Target Agent
investigator.md (from agents/infra-ops/)

## Context Files
context.md (from teams/2-infra-ops/)

## Scoring Rubric

### Criterion 1: Completeness of Host Inventory (weight: 3)
- 5: All 6 hosts documented with IP, OS, role, key services, and storage. Nothing missed. Includes both VMs and LXC containers. Notes the Proxmox node itself.
- 4: 5 of 6 hosts fully documented
- 3: All hosts mentioned but some missing key details (IPs, services, storage)
- 1: Major hosts missing from inventory
- 0: Incomplete or no inventory

### Criterion 2: Service Dependency Mapping (weight: 3)
- 5: Identifies the key dependency chains: app-01 → db-01 (PostgreSQL), app-01 → Dentrix cloud (OpenVPN), dc-01 → all hosts (AD/DNS/DHCP), backup-01 ← dc-01 + db-01 (backup targets), docker-host-01 pihole → all hosts (DNS). Notes which services are critical path (Dentrix connector, AD, DNS) vs. supporting.
- 3: Some dependencies identified but missing critical ones (e.g., OpenVPN to Dentrix cloud, or pihole as DNS for the network)
- 1: Services listed in isolation without dependency relationships
- 0: No dependency mapping

### Criterion 3: Concern Identification — Security (weight: 3)
Must flag these security concerns:
- PostgreSQL listening on 0.0.0.0 with no pg_hba.conf restrictions and SSL disabled (HIGH)
- Watchtower auto-updating containers with no approval or version pinning (HIGH)
- Docker socket exposed to Portainer (MEDIUM-HIGH)
- Windows Defender definitions 5 days stale (MEDIUM)
- Windows Firewall public profile OFF (MEDIUM)
- dc-01 uptime 112 days — likely missing security patches (MEDIUM)

- 5: Flags 5+ of 6 security concerns with appropriate severity
- 4: Flags 4 concerns
- 3: Flags 3 concerns
- 1: Flags 1-2 concerns
- 0: No security concerns identified

### Criterion 4: Concern Identification — Operational (weight: 2)
Must flag these operational concerns:
- dc-01 backup last successful 3 days ago (should be daily — what failed?)
- No off-site backup replication (single point of failure)
- No backup restore testing ever documented
- Duplicate Uptime Kuma instances (docker-host-01 and monitoring-01)
- DHCP lease time 4h is short for a 6-person office
- db-01 uptime 200 days — likely missing OS patches

- 5: Flags 5+ of 6 operational concerns
- 4: Flags 4 concerns
- 3: Flags 3 concerns
- 1: Flags 1-2 concerns
- 0: No operational concerns identified

### Criterion 5: Severity Categorization (weight: 1)
- 5: Concerns are categorized by severity (Critical/High/Medium/Low or equivalent) with clear reasoning. PostgreSQL open access is rated higher than stale Defender definitions. Prioritization reflects actual risk, not alphabetical listing.
- 3: Some severity indication but inconsistent or missing reasoning
- 1: Flat list of concerns without severity
- 0: No categorization

## Required Elements
- [ ] All 6 hosts documented with IP addresses and OS
- [ ] Key services listed per host (AD, DNS, DHCP, PostgreSQL, nginx, Docker containers)
- [ ] At least one dependency chain identified (e.g., app-01 → db-01)
- [ ] PostgreSQL 0.0.0.0 / no restrictions flagged as high severity
- [ ] Watchtower auto-update without approval flagged
- [ ] Backup gap on dc-01 flagged (3 days, should be daily)
- [ ] No off-site backup replication flagged
- [ ] Concerns have severity ratings

## Anti-Patterns
- Listing hosts without services (just an IP inventory)
- Missing the PostgreSQL security issue (it's the highest-risk finding)
- Not flagging Watchtower (automatic uncontrolled updates in production)
- Treating all concerns as equal severity
- Missing the duplicate Uptime Kuma (indicates ad-hoc tooling sprawl)
- Not noting the 200-day and 112-day uptimes as patch currency concerns
