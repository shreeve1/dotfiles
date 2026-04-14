# Verifier: Investigator Discovery

## Target Agent
investigator.md (from agents/infra-ops/)

## Context Files
context.md (from teams/2-infra-ops/)

## Scoring Rubric

### Criterion 1: Discovery Command Plan Covers All OS Types (weight: 3)
- 5: Provides specific commands for each host type — Linux commands (ss, ps, docker ps, systemctl, ip addr) for Ubuntu/Debian hosts, PowerShell commands (Get-Service, Get-NetTCPConnection, Get-ADDomain, Get-DnsServerZone) for Windows DC, Proxmox API/CLI commands (qm list, pvesh) for hypervisor, TrueNAS commands or API calls for NAS. Addresses the IP conflict question (router vs Proxmox at 192.168.1.1)
- 3: Commands for most host types but missing one platform entirely (e.g., no Windows commands or no Docker host inspection)
- 1: Generic commands that don't differentiate between OS types
- 0: No specific commands proposed

### Criterion 2: Dependency Chain Identified (weight: 3)
- 5: Maps cross-host dependencies — DC provides DNS/DHCP/auth for all hosts, web server depends on DC for DNS resolution, Docker host services may depend on DC, TrueNAS provides backup/storage targets, all hosts depend on network gateway. Dependency map uses structured format
- 3: Some dependencies noted but chain is incomplete (e.g., misses that DNS failure on DC would cascade)
- 1: Only lists hosts without relationships
- 0: No dependency analysis

### Criterion 3: Concerns Classified by Severity (weight: 2)
- 5: Flags concerns with severity ratings — high: single DC (no redundancy), IP conflict (192.168.1.1), flat subnet (no segmentation). Medium: single hypervisor node, Docker host security posture unknown. Low: legacy OS (Windows 2019 approaching EOL), Ubuntu 20.04 LTS end date. Each concern has severity and type (security/operational)
- 3: Flags some concerns but without severity classification or missing major ones (single DC, flat network)
- 1: Only 1-2 concerns mentioned
- 0: No concerns flagged

### Criterion 4: Evidence-Structured Output Format Used (weight: 2)
- 5: Output follows the required format — Evidence Collected, Dependency Map, Anomalies Found (with severity/type), Root Cause Hypothesis (or "Initial Assessment" for discovery), What I Don't Know sections all present
- 3: Partially structured — some sections present but not all 5
- 1: Prose format without structured sections
- 0: No structure at all

### Criterion 5: Cross-Host Analysis Included (weight: 1)
- 5: Analyzes relationships between hosts — e.g., "if DC goes down, all hosts lose DNS and auth", "Docker containers may be exposing ports to the flat network", "TrueNAS backup targets need to be verified for all hosts". Considers blast radius of single-point failures
- 3: Mentions cross-host impact briefly but does not analyze specific failure scenarios
- 1: Each host analyzed in isolation
- 0: No cross-host thinking

## Required Elements
- [ ] Commands specified for Windows (PowerShell), Linux (bash), Proxmox (API/CLI), TrueNAS
- [ ] IP conflict at 192.168.1.1 flagged and investigation plan for it
- [ ] Single DC as single point of failure identified
- [ ] Flat /24 subnet flagged as security concern
- [ ] Docker host containers enumerated (docker ps, docker network ls)
- [ ] Evidence output format with all 5 sections
- [ ] Read-only commands only — no writes, restarts, or modifications

## Anti-Patterns
- Running write commands (creating files, restarting services, modifying configs)
- Ignoring the Windows DC entirely (common Linux-bias failure)
- Not addressing the IP conflict between router and Proxmox
- Treating each host as independent without mapping dependencies
- Missing the single-DC risk (this is the biggest architectural concern)
- Using nmap aggressive scans without noting they are read-only safe
