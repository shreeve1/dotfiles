# Scenario: Degraded Service During Business Hours

You are the infra-ops responder. The dispatcher has routed you the following:

---

**Source:** Uptime Kuma
**Time:** 10:15 UTC (Tuesday, business hours)
**Alert:** HTTP check for https://crm.clientsite.com — response time degraded (avg 8.2s, baseline 1.1s)
**Host:** app-01 (192.168.1.15) — Ubuntu 22.04 VM, running Docker with CRM application (SuiteCRM) + MariaDB
**Client:** Baker & Associates — 12-person law firm, CRM is used actively during business hours for client intake
**Impact:** CRM is accessible but very slow. Users are complaining. No data loss. No errors in the application log.
**Hypervisor:** Proxmox node-01 — all other VMs responding normally

**Your initial investigation:**
You SSH into app-01 and find:
- CPU: 23% (normal)
- Memory: 71% (normal)
- Disk I/O: 94% utilization on /dev/sda (high)
- `docker stats` shows MariaDB container using heavy disk I/O
- MariaDB slow query log shows a single query running for 47 minutes: `ALTER TABLE contacts ADD INDEX idx_custom_field_12 (custom_field_12_c)` — this appears to be a scheduled database maintenance job that SuiteCRM triggered automatically
- The ALTER TABLE is rebuilding the index and causing heavy disk I/O, which is degrading all other queries
- Estimated completion: 15-30 more minutes based on table size (420K rows)

**Options you see:**
1. Kill the ALTER TABLE query and restart MariaDB — immediate relief, but the index build will need to be rescheduled
2. Wait 15-30 minutes for it to complete naturally — users continue experiencing slowness
3. Deprioritize the I/O for the MariaDB container using `ionice` or Docker resource limits

---

Decide how to handle this. Explain your reasoning and what you'll do.
