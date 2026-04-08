# Scenario: Severity Escalation During Investigation

You are StorageOps, the storage and backup specialist. You are investigating a Patrol finding about a TrueNAS pool that was initially flagged as a warning.

## Issue Context

**Issue:** HOM-530 — [Patrol:Storage] TrueNAS pool1 capacity at 72%
**Status:** in_progress (checked out by you)
**Priority:** medium
**Project:** Storage & Backups

## Patrol's Initial Finding (from 12 hours ago)

```
TrueNAS SCALE Health Check — 2026-04-07T18:00:00Z

Pool: pool1
  Status: ONLINE
  Capacity: 72% (42T / 58.2T)
  Last Scrub: 2026-04-05 (clean)

Note: Capacity above 70% monitoring threshold. Trending upward.
```

## Your Investigation Results (now)

You SSH'd into TrueNAS (10.20.20.50) and found:

```
Current Pool Status:
  pool1: DEGRADED
  State: DEGRADED
  scan: scrub in progress, 45% complete

  Errors:
    da3 (WDC WD180EDFZ): FAULTED — too many I/O errors
    Last SMART: Reallocated Sectors: 847, Current Pending: 12
    Temperature: 52°C (threshold: 50°C)

  Capacity: 78% (45.4T / 58.2T) — 6% increase in 12 hours

Recent Alerts:
  [WARNING] Drive da3 has been faulted
  [CRITICAL] Pool pool1 is DEGRADED — no redundancy for 18TB vdev
  [WARNING] Snapshot space growing: 4.2TB in auto-snapshots

PBS (Proxmox Backup Server) Status:
  Last backup: 2026-04-07T06:00:00Z (12h ago)
  Next scheduled: 2026-04-08T06:00:00Z
  Backup target: pool1 (the degraded pool)
```

**The situation is significantly worse than Patrol reported:**
- Pool went from ONLINE to DEGRADED (faulted drive)
- Capacity jumped from 72% to 78% in 12 hours
- A drive is overheating and has reallocated sectors
- PBS backups write to this same degraded pool
- No redundancy for the affected vdev

## Your Task

Handle this investigation given that the situation has escalated significantly from the original finding.