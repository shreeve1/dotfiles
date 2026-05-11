---
name: windmill
description: Diagnose and troubleshoot the Windmill CE instance on aidev (10.20.20.16:8100). Provides health checks, run history analysis, flow diagnostics, schedule verification, log inspection, DB query patterns, and Plane ticket inspection. Use when user asks about Windmill status, failing flows, schedule problems, job errors, container health, Plane tickets, or anything related to the homelab patrol pipeline.
---

# Windmill CLI

## Connection

Read API token from memory: `~/.pai/projects/-home-james-windmill/memory/windmill-api-key.md`
- Base URL: `http://localhost:8100` (assumes execution on aidev; if remote, use `10.20.20.16:8100` or SSH tunnel)
- Workspace: `admins`
- Auth: load into env var — `TOKEN=$(grep ... | head -1)` — never print or log the token value
- DB: `docker exec windmill-db-1 psql -U postgres -d windmill`

## Workflow 1: Health Check

```bash
cd ~/windmill && docker compose ps
curl -s http://localhost:8100/api/version
docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}'
```

## Workflow 2: Run History

Check recent completions and error messages:
```bash
docker exec windmill-db-1 psql -U postgres -d windmill -c "
SELECT id, status, started_at, duration_ms, LEFT(result::text, 200) as result
FROM v2_job_completed ORDER BY started_at DESC LIMIT 20;"
```

Success/failure summary:
```bash
docker exec windmill-db-1 psql -U postgres -d windmill -c "
SELECT status, COUNT(*), MIN(started_at), MAX(started_at)
FROM v2_job_completed WHERE started_at >= NOW() - INTERVAL '24 hours' GROUP BY status;"
```

## Workflow 3: Flow Diagnostics

Test if all flows load (200 = OK, 400 = corrupted):
```bash
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8100/api/w/admins/flows/list" | \
  python3 -c "import sys,json; [print(f.get('path','')) for f in json.load(sys.stdin)]" | \
  while read fp; do curl -s -o /dev/null -w "%{http_code} $fp\n" -H "Authorization: Bearer $TOKEN" "http://localhost:8100/api/w/admins/flows/get/$fp"; done
```

If a flow returns 400 with "unexpected null; try decoding as Option":
1. Back up: `docker exec windmill-db-1 psql -U postgres -d windmill -t -A -c "SELECT value::text FROM flow WHERE path = '{PATH}';" > /tmp/backup.json`
2. Delete: `docker exec windmill-db-1 psql -U postgres -d windmill -c "DELETE FROM flow WHERE path = '{PATH}';"`
3. Recreate via API: POST to `/api/w/admins/flows/create` with the backed-up value
4. Verify: `curl -s -o /dev/null -w "%{http_code}" ... /flows/get/{PATH}`

## Workflow 4: Schedule Check

```bash
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8100/api/w/admins/schedules/list" | \
  python3 -c "import sys,json; [print(f\"{s['path']:55} enabled={s['enabled']}  sched={s['schedule']}\") for s in json.load(sys.stdin)]"
```

Or via DB:
```bash
docker exec windmill-db-1 psql -U postgres -d windmill -c "
SELECT path, schedule, enabled, script_path, is_flow FROM schedule ORDER BY path;"
```

## Workflow 5: Logs

```bash
docker logs windmill-windmill_server-1 --tail 200 2>&1 | grep -v "ping update" | tail -40
docker logs windmill-windmill_worker-1 --tail 50 2>&1
docker logs windmill-windmill_server-1 --since 1h 2>&1 | grep -i error
```

## Workflow 6: Queued/Running/Suspended Jobs

Check for stuck jobs that aren't completing:
```bash
docker exec windmill-db-1 psql -U postgres -d windmill -c "
SELECT id, status, started_at, worker FROM v2_job_runtime
WHERE status IN ('running', 'queued') ORDER BY started_at;"
```

For suspended flows awaiting approval (Tier 3):
```bash
docker exec windmill-db-1 psql -U postgres -d windmill -c "
SELECT id, started_at, permissioned_as FROM v2_job_runtime
WHERE status = 'waiting_for_event' ORDER BY started_at;"
```

## Workflow 7: Worker Debugging

Check worker health and job distribution:
```bash
docker stats --no-stream --format '{{.Name}}: CPU={{.CPUPerc}} MEM={{.MemUsage}}' | grep windmill
docker logs windmill-windmill_worker-1 --since 30m 2>&1 | grep -i -E "error|fail|timeout|oom" | tail -20
```

Check for zombie jobs (running > 30 min):
```bash
docker exec windmill-db-1 psql -U postgres -d windmill -c "
SELECT id, started_at, NOW() - started_at as age, worker
FROM v2_job_runtime WHERE status = 'running' AND started_at < NOW() - INTERVAL '30 minutes';"
```

## Workflow 8: Variable/Resource Checks

Patrol failures often come from missing variables. Check without printing secrets:
```bash
# List variable paths (no values)
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8100/api/w/admins/variables/list" | \
  python3 -c "import sys,json; [print(v.get('path','')) for v in json.load(sys.stdin)]"

# Check if a specific variable exists
curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8100/api/w/admins/variables/get/f/admins/plane_api_key"
```

Key variables for patrol Plane tickets: `f/admins/plane_base_url`, `f/admins/plane_api_key`, `f/admins/plane_workspace_slug`, `f/admins/plane_project_id`

## Workflow 9: Plane Ticket Inspection

Plane is the project management tool where patrol scripts create Todo tickets for failures. Symphony (`plane-symphony-1`) polls Plane for eligible Todo tickets and dispatches OpenCode to work them. Plane API runs on `10.20.20.16:8000`.

**Check Symphony health:**
```bash
cd /home/james/plane && docker compose ps symphony
docker inspect --format='{{.State.Health.Status}}' plane-symphony-1
docker compose logs --since=5m symphony
```

Expected idle state: `plane-symphony-1` is `Up` and `healthy`. Logs show `tick_completed dispatched=false reason=no-candidates` when no Todo tickets are ready.

**List open Plane issues via API (patrol-created tickets have domain labels):**
```bash
curl -s -H "X-API-Key: $PLANE_API_KEY" \
  "http://10.20.20.16:8000/api/v1/workspaces/homelab/projects/$PLANE_PROJECT_ID/issues/?state_group=unstarted" | \
  python3 -c "import sys,json; [print(i['sequence_id'], i['name'], i.get('labels',[])) for i in json.load(sys.stdin).get('results',[])]"
```

**Check patrol script run history for ticket creation:**
```bash
docker exec windmill-db-1 psql -U postgres -d windmill -c "
SELECT started_at, duration_ms, status, LEFT(result::text, 300) as result
FROM v2_job_completed
WHERE script_path LIKE '%_patrol' AND started_at >= NOW() - INTERVAL '24 hours'
ORDER BY started_at DESC LIMIT 20;"
```

**Check recent ticket-related patrol results:**
```bash
docker exec windmill-db-1 psql -U postgres -d windmill -c "
SELECT started_at, script_path, status, LEFT(result::text, 200) as result
FROM v2_job_completed
WHERE result::text LIKE '%plane%' OR result::text LIKE '%ticket%'
ORDER BY started_at DESC LIMIT 10;"
```

See [docs/runbooks/automation/symphony.md](/home/james/homelab/docs/runbooks/automation/symphony.md) for full Symphony runbook.

## Patrol Pipeline

6 domain patrol scripts (secops/infraops/netops/mediaops/storageops/dockerops) run on Windmill schedules. Each executes health checks, and on failure calls `create_plane_ticket.py` to open a Plane Todo ticket. Symphony polls Plane for eligible Todo tickets and dispatches OpenCode sessions against the homelab repo to resolve them.

Patrol scripts in Windmill: `f/admins/homelab_patrols/scripts/*_patrol`
Source in repo: `automation/homelab-stack/deploy/windmill/*_patrol.py`
Ticket creation: `automation/homelab-stack/deploy/windmill/create_plane_ticket.py`
Symphony runbook: `docs/runbooks/automation/symphony.md`

See [REFERENCE.md](REFERENCE.md) for Windmill DB schema and query patterns.
