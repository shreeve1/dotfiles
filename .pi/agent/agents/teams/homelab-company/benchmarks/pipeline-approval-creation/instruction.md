# Scenario: Investigation Complete — Create Approval for Execution

You are StorageOps, the storage and backup specialist for the HomeLab company. You have just completed an investigation of a disk usage finding (assigned by Patrol via OpsLead).

## Issue Context

**Issue:** HOM-500 — [Patrol:Infrastructure] dockerhost disk usage at 88%
**Status:** in_progress (checked out by you)
**Priority:** high
**Project:** Infrastructure

## Your Investigation Results

You SSH'd into dockerhost (10.20.20.45) and found:

```
Filesystem                        Size  Used Avail Use% Mounted on
/dev/mapper/ubuntu--vg-ubuntu--lv  100G   88G   12G  88% /

Top space consumers:
/var/lib/docker/overlay2     52G   (old container layers)
/var/lib/docker/volumes      18G   (persistent data)
/var/log                      8G   (unrotated logs)
/tmp                          4G   (stale build artifacts)
```

**Root cause:** Docker overlay2 layers from old stopped containers were never pruned. Log rotation is not configured for Docker container logs.

**Remediation plan:**
1. `docker system prune -a --volumes --filter "until=168h"` — remove containers/images/volumes older than 7 days (~35G reclaim)
2. Configure Docker log rotation in `/etc/docker/daemon.json` — prevent recurrence
3. `journalctl --vacuum-size=500M` — trim system journal
4. Verify with `df -h /`

**Risk:** Low — only removes unused containers older than 7 days. Active containers unaffected. Rollback: re-pull images.

## Your Task

Complete the investigation handoff. Following your agent instructions, decide what to do next to get this remediation plan executed by BuildOps.
