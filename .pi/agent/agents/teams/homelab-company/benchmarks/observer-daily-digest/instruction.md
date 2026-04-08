# Scenario: Observer Daily Digest — Anomalies and Patterns

You are Observer, the daily operations digest agent for the HomeLab company. You are running your daily heartbeat to produce the ops digest.

## Data You've Collected

### Agent Activity (last 24h)

| Agent | Runs | Issues Created | Issues Closed | Errors | Avg Duration |
|-------|------|---------------|---------------|--------|--------------|
| Patrol | 12 | 8 | 0 | 0 | 45s |
| OpsLead | 4 | 2 | 5 | 0 | 180s |
| SecOps | 3 | 1 | 0 | 2 | 120s |
| BuildOps | 6 | 0 | 3 | 0 | 90s |
| StorageOps | 2 | 1 | 1 | 0 | 150s |
| NetOps | 1 | 0 | 1 | 0 | 60s |
| MediaOps | 0 | 0 | 0 | 0 | — |
| DockerOps | 1 | 1 | 0 | 0 | 200s |
| PatchOps | 2 | 0 | 0 | 2 | 30s |
| CEO | 1 | 0 | 0 | 0 | 300s |

### Issue Pipeline

| Status | Count | Change from Yesterday |
|--------|-------|-----------------------|
| Backlog | 18 | +3 |
| In Progress | 2 | −1 |
| Blocked | 4 | +2 |
| Done (today) | 9 | +4 |

### Anomalies Detected

1. **SecOps error rate: 67%** (2 errors out of 3 runs) — both errors were API auth failures (401)
2. **PatchOps error rate: 100%** (2 errors out of 2 runs) — errors were "no approved approval found"
3. **MediaOps: 0 runs in 24h** — last run was 3 days ago. Agent may be idle or broken.
4. **Blocked issues increased +2** — HOM-360 (vulns, pending approval 4 days) and HOM-131 (disk, pending approval 2 days)
5. **Backlog growing: +3 net** — 8 new issues created, only 5 closed by OpsLead

### Infrastructure Health

| Host | CPU | Memory | Disk | Status |
|------|-----|--------|------|--------|
| pve1 | 23% | 68% | 45% | ✅ |
| pve2 | 15% | 42% | 52% | ✅ |
| pve3 | 45% | 71% | 67% | ⚠️ Memory |
| pihole | 8% | 35% | 38% | ✅ |
| truenas | 12% | 44% | 78% | ⚠️ Disk |
| aidev | 67% | 82% | 91% | 🔴 Disk critical |

## Your Task

Produce your daily ops digest. Follow your Observer instructions to analyze the data, detect patterns, and report to the board.
