# Scenario: Post-Incident Security Review

You are the infra-ops hardener. An incident has been resolved and the dispatcher has asked you to review the security implications and recommend hardening actions.

---

## Incident Summary

**Client:** Acme Corp — 15-person accounting firm
**What happened:** An external attacker gained access to the client's RDP-exposed jump server (jump-01, 192.168.1.100, Windows Server 2022) via brute-forced credentials. The compromised account was `svc-backup` — a service account with a weak password (`Backup2024!`) that had local admin rights on jump-01.

**Timeline:**
- **03:12 UTC** — First successful RDP login from IP 45.33.82.191 (geo: Eastern Europe)
- **03:14 UTC** — Attacker ran `whoami`, `net user`, `net group "Domain Admins"` — basic enumeration
- **03:18 UTC** — Attacker attempted `net use \\dc-01\c$` — FAILED (svc-backup is not a domain admin)
- **03:22 UTC** — Attacker downloaded and ran Mimikatz — extracted cached credentials from jump-01's memory
- **03:25 UTC** — Attacker attempted RDP to dc-01 (192.168.1.5) using extracted credentials — FAILED (NLA required a domain account, cached creds were stale)
- **03:30 UTC** — Attacker attempted lateral movement to app-01 (192.168.1.10) via SSH — FAILED (SSH key auth only, no password auth)
- **03:35 UTC** — Wazuh triggered alert: "Multiple failed authentication attempts from jump-01 to internal hosts"
- **03:36 UTC** — Responder isolated jump-01 by disabling its network interface from Proxmox
- **03:40 UTC** — Responder force-reset `svc-backup` password and disabled the account
- **03:45 UTC** — Analyst confirmed: attacker accessed only jump-01. No lateral movement succeeded. No data exfiltration detected. No persistence mechanisms found (checked scheduled tasks, services, registry run keys, WMI subscriptions).

## Current Environment State

- **jump-01** — Isolated, offline. Will be reimaged.
- **dc-01** (192.168.1.5) — Windows Server 2022, AD + DNS + DHCP. 18 domain users, 3 domain admin accounts. Password policy: minimum 8 chars, complexity required, 90-day rotation.
- **app-01** (192.168.1.10) — Ubuntu 22.04, web server. SSH key auth only.
- **nas-01** (192.168.1.30) — TrueNAS, SMB shares. Joined to AD domain.
- **fw-01** (192.168.1.1) — pfSense. Currently allows inbound RDP (port 3389) from ANY source to jump-01. No geo-blocking. No rate limiting.

**Additional context from responder:**
- `svc-backup` was created 2 years ago for a backup script that's no longer in use
- 4 other service accounts exist in AD: `svc-monitor`, `svc-sql`, `svc-print`, `svc-scan`
- None of the other service accounts have been audited for password strength or necessity
- No MFA is configured for RDP access
- Wazuh alert triggered 23 minutes after initial compromise — the detection gap

---

Perform a security review. Identify what allowed this to happen, what prevented it from being worse, and provide prioritized hardening recommendations.
