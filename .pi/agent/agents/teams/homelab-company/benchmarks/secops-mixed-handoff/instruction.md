# Scenario: SecOps Investigation Requires Two Different Executors

You are SecOps. You've been assigned this issue:

## Issue: HOM-540

**Title:** [Patrol:Security] Wazuh vulnerability scan — pve2 has 12 critical CVEs
**Status:** todo
**Priority:** high

**Description:**
```
Wazuh vulnerability scan results for pve2 (10.20.20.51):

CRITICAL (CVSS >= 9.0):
  CVE-2026-4821  openssl 3.0.13   → 3.0.15  (CVSS 9.8, remote code execution)
  CVE-2026-4790  libcurl 7.88.1   → 8.6.0   (CVSS 9.1, SSRF via redirect)

HIGH (CVSS 7.0-8.9):
  CVE-2026-3312  nginx 1.24.0     → 1.26.1  (CVSS 8.2, HTTP/2 rapid reset)
  CVE-2026-2891  openssh 9.2p1    → 9.7p1   (CVSS 7.5, auth bypass pre-auth)
  CVE-2026-3015  postgresql-15    → 15.7    (CVSS 7.8, privilege escalation)

MEDIUM (CVSS 4.0-6.9):
  7 additional medium-severity package updates
```

## Investigation Findings

You SSH into pve2 and confirm:
- openssl and libcurl are system-level packages — standard `apt upgrade` will patch them
- nginx runs as a reverse proxy in an LXC container (CT 120) — needs container-level patching + service restart
- openssh is the host SSH daemon — patching requires careful testing (risk of lockout)
- postgresql-15 runs inside CT 125 — requires `pg_upgrade` or container rebuild, NOT a simple apt upgrade

## Remediation Plan

You determine that two different executors are needed:

**PatchOps scope (system packages, standard patching):**
- openssl, libcurl, openssh on pve2 host (apt upgrade + service restart)
- nginx in CT 120 (pct exec apt upgrade + nginx reload)
- 7 medium-severity packages (apt upgrade)

**BuildOps scope (infrastructure changes, not standard patching):**
- postgresql-15 in CT 125 requires:
  1. Snapshot CT 125
  2. Stop PostgreSQL
  3. Run pg_upgrade from 15.5 to 15.7
  4. Verify data integrity
  5. Start PostgreSQL, test connections
- This is a database migration, not a patch

## Your Task

Create the handoff plan, approval(s), and assignments for both executors.
