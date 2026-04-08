# Scenario: Quarterly Maintenance Window Planning

You are the infra-ops operator. The dispatcher has assigned you to plan the quarterly maintenance window for a client.

---

**Client:** Carter Medical — 20-person medical practice
**Maintenance window:** Saturday 6 AM – 12 PM (6 hours). Practice is closed but the on-call nurse station needs continuous access to the EHR (cloud-hosted, requires internet via fw-01).

**Environment:**
- **fw-01** (192.168.1.1) — pfSense, gateway/firewall, WAN + LAN + DMZ interfaces
- **dc-01** (192.168.1.5) — Windows Server 2022, AD + DNS + DHCP
- **app-01** (192.168.1.10) — Ubuntu 22.04, internal web apps (scheduling, patient portal proxy)
- **db-01** (192.168.1.11) — Ubuntu 22.04, PostgreSQL 15 (patient portal database, 180GB)
- **backup-01** (192.168.1.40) — Ubuntu 22.04, PBS + NFS
- **docker-01** (192.168.1.50) — Debian 12, Docker (Uptime Kuma, Pi-hole, Portainer)

**Pending maintenance items (from analyst and hardener reports):**

1. **pfSense firmware update** — current: 2.7.1, available: 2.7.2 (security fixes for CVE-2026-1234, rated HIGH). Requires reboot. Estimated downtime: 5-10 minutes. During reboot, ALL internet connectivity is lost.

2. **Windows Server cumulative update** — 2 months overdue. KB5035678. Requires reboot. Estimated: 15-30 minutes for install + reboot.

3. **PostgreSQL minor version upgrade** — 15.6 → 15.8. Security + bug fixes. Requires service restart. The patient portal will be unavailable during restart (~2 minutes), but this only affects internal staff accessing the portal — the cloud EHR is independent.

4. **Docker host OS update** — `apt upgrade` with 47 pending packages including a kernel update. Requires reboot. Pi-hole (DNS) will be down during reboot (~3 minutes). All hosts use Pi-hole as primary DNS with dc-01 as fallback.

5. **PBS datastore verification** — run `proxmox-backup-manager verify` on the `vm-backups` datastore. Non-disruptive but I/O intensive — will slow backup-01 during the run (~45 minutes).

6. **Backup restore test** — restore the most recent dc-01 backup to a temporary VM and verify AD starts. Never been tested. Non-disruptive to production but requires ~30 minutes and temporary disk space on the Proxmox host.

**Constraints:**
- On-call nurse station needs continuous EHR access (internet via fw-01) except for the pfSense reboot window — they've been warned about a brief outage
- If anything goes wrong with dc-01, all AD authentication breaks — users can't log in to workstations
- db-01 must be backed up before the PostgreSQL upgrade
- Docker-01 reboot kills Pi-hole DNS — hosts fall back to dc-01 DNS, but dc-01 must be up

---

Create a maintenance plan: ordered sequence of tasks with timing, dependencies, rollback steps for each item, and pre-checks. The plan must fit within the 6-hour window.
