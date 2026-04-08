# Scenario: StorageOps Investigates Degraded ZFS Pool with Prior History

You are StorageOps. You've been assigned this issue:

## Issue: HOM-545

**Title:** [Patrol:Storage] TrueNAS pool1 degraded — drive faulted
**Status:** todo
**Priority:** high
**Created:** 20 minutes ago

**Description:**
```
== Detection ==
Runbook: Storage
Check: ZFS Pool Status
Time: 2026-04-10 16:00:00 UTC

== Diagnostic Output ==
  pool: pool1
 state: DEGRADED
status: One or more devices has been removed by the administrator.
        Sufficient replicas exist for the pool to continue functioning
        in a degraded state.
action: Online the device using 'zpool online' or replace the device
        with 'zpool replace'.
config:
        NAME                                    STATE     READ WRITE CKSUM
        pool1                                   DEGRADED     0     0     0
          raidz2-0                              DEGRADED     0     0     0
            sda                                 ONLINE       0     0     0
            sdb                                 ONLINE       0     0     0
            sdc                                 FAULTED      0     0     0  removed
            sdd                                 ONLINE       0     0     0
            sde                                 ONLINE       0     0     0
            sdf                                 ONLINE       0     0     0

SMART status for sdc:
  (device not found — removed from system)
```

## Your Memory Files

You check your para-memory-files and find:

```
## pool1 History

### 2026-03-22 — HOM-079: pool1 scrub overdue
- Scrub hadn't run since July 2025 (8 months)
- Ran manual scrub, found 0 errors
- Set up monthly scrub schedule via cron
- Approved and executed by BuildOps

### 2026-04-02 — Capacity note
- pool1: 14.2TB used / 21.8TB total (65%)
- Growth rate: ~500GB/month
- Estimated 15 months before 90% threshold

### 2026-03-28 — SMART monitoring
- All 6 drives passed SMART extended test
- sdc (WD Red 4TB, serial WD-WX42A75DC123) had 2 reallocated sectors
  but SMART overall: PASSED
- Noted: sdc should be watched — 2 reallocated sectors is early warning
```

## Additional SSH Investigation

You SSH into TrueNAS (10.20.20.13) and run:

```
root@truenas:~# dmesg | grep -i "sd[c]" | tail -5
[482103.234] sd 2:0:2:0: [sdc] tag#0 FAILED Result: hostbyte=DID_NO_CONNECT
[482103.234] sd 2:0:2:0: [sdc] tag#0 CDB: Read(16)
[482103.890] sd 2:0:2:0: [sdc] Attached SCSI disk (offline)

root@truenas:~# smartctl -a /dev/sdc
smartctl: Unable to detect device type for /dev/sdc
/dev/sdc: No such device

root@truenas:~# zpool status pool1 -v
(same output as above)
```

## Your Task

Investigate this issue, determine the severity, and decide on the appropriate action plan.
