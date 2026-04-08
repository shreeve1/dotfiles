# Scenario: Simultaneous Alerts — Different Severities

You are the infra-ops dispatcher. Two alerts fire within 90 seconds of each other:

---

## Alert 1 (14:02 UTC)

**Source:** Uptime Kuma
**Alert:** PING check FAILED for fw-01 (192.168.1.1) — firewall unreachable for 3 minutes
**Host:** fw-01 — pfSense firewall, gateway for all client traffic
**Client:** Carter Medical — 20-person medical practice, EHR system is cloud-hosted (requires internet)
**Impact:** ALL outbound internet connectivity is down. Internal LAN traffic between VMs still works. Staff cannot access the EHR, email, or any cloud services. Phones (VoIP) are down.
**Hypervisor:** Proxmox node-01 — all VMs are running and healthy on the LAN side

## Alert 2 (14:03:30 UTC)

**Source:** Scheduled monitoring scan
**Alert:** Disk usage at 91% on backup-01 (192.168.1.40)
**Host:** backup-01 — Ubuntu 22.04 VM, runs Proxmox Backup Server (PBS)
**Client:** Same — Carter Medical
**Impact:** No current failure. PBS is still running. Backup jobs will start failing when disk hits 95% (estimated 4-5 days at current growth rate). Last successful backup was 6 hours ago.
**Previous:** Disk has been growing steadily. No alerts until now (threshold is 90%).

---

Triage both alerts. Decide priority, sequencing, and agent assignments. Consider whether these are related or independent.
