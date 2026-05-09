# Windmill CE — DB Schema & Query Reference

## Key Tables

### v2_job_completed
Completed job history (both script and flow runs).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| status | text | `success`, `failure`, `canceled` |
| started_at | timestamptz | When execution began |
| completed_at | timestamptz | When execution finished |
| duration_ms | bigint | Wall-clock duration |
| result | jsonb | Success output or `{"error": {"name": ..., "message": ...}}` |

**Common queries:**

```sql
-- Recent failures with error messages
SELECT id, started_at, duration_ms, LEFT(result::text, 300) as error
FROM v2_job_completed
WHERE status = 'failure' AND started_at >= NOW() - INTERVAL '24 hours'
ORDER BY started_at DESC;

-- Failure rate by time bucket
SELECT date_trunc('hour', started_at) as hour,
       COUNT(*) FILTER (WHERE status = 'success') as successes,
       COUNT(*) FILTER (WHERE status = 'failure') as failures
FROM v2_job_completed
WHERE started_at >= NOW() - INTERVAL '48 hours'
GROUP BY hour ORDER BY hour;

-- Find all runs with a specific error pattern
SELECT id, started_at, result::text
FROM v2_job_completed
WHERE result::text LIKE '%flow not found%'
ORDER BY started_at DESC LIMIT 20;
```

### flow
Flow definitions (visual pipeline builder).

| Column | Type | Notes |
|--------|------|-------|
| path | text | Primary key (e.g. `f/admins/homelab_patrols/f/my_flow`) |
| value | jsonb | Flow structure: modules, input_transforms, flow_env |
| schema | jsonb | Input schema for the flow |
| summary | text | Human-readable description |
| archived | boolean | Soft delete flag |
| edited_by | text | Last editor |
| edited_at | timestamptz | Last edit timestamp |
| version_id | bigint | Optimistic concurrency version |

**Common queries:**

```sql
-- List all flows
SELECT path, summary, archived FROM flow ORDER BY path;

-- Check if a flow's value is valid (no null fields Windmill expects)
SELECT path, jsonb_object_keys(value) as keys FROM flow WHERE path = '{PATH}';

-- Extract sub-flow references from a flow
SELECT path, jsonb_path_query(value, '$.modules[*].value.path')::text as ref
FROM flow WHERE path = '{PATH}';

-- Compare two flows' top-level structure
SELECT path, jsonb_object_keys(value) as value_keys
FROM flow WHERE path IN ('{PATH1}', '{PATH2}') ORDER BY path, value_keys;
```

### schedule
Scheduled job configurations.

| Column | Type | Notes |
|--------|------|-------|
| path | text | Primary key |
| schedule | text | Cron expression |
| enabled | boolean | Whether the schedule is active |
| script_path | text | Script or flow to run |
| is_flow | boolean | true = flow, false = script |
| args | jsonb | Static arguments passed to the job |
| summary | text | Description |

**Common queries:**

```sql
-- All schedules with status
SELECT path, schedule, enabled, script_path, is_flow FROM schedule ORDER BY path;

-- Find schedules that haven't produced runs recently
SELECT s.path, s.schedule, s.script_path,
       MAX(c.started_at) as last_run
FROM schedule s
LEFT JOIN v2_job_completed c ON true
WHERE s.enabled = true
GROUP BY s.path, s.schedule, s.script_path;
```

### script
Registered Python/other scripts.

| Column | Type | Notes |
|--------|------|-------|
| path | text | Primary key |
| language | text | `python3`, `deno`, etc. |
| content | text | Source code |
| created_at | timestamptz | Registration time |

```sql
-- Recent scripts
SELECT path, language, created_at FROM script ORDER BY created_at DESC LIMIT 20;

-- Find scripts by path pattern
SELECT path, language FROM script WHERE path LIKE '%patrol%' ORDER BY path;
```

## Flow Value JSON Structure

A typical flow value:

```json
{
  "modules": [
    {
      "id": "module_name",
      "value": {
        "path": "f/admins/script_path",
        "type": "script",
        "input_transforms": {
          "param_name": {"expr": "results.prev_module", "type": "javascript"}
        }
      },
      "summary": "description"
    }
  ],
  "flow_env": {
    "ENV_VAR": "$var:f/admins/variable_path"
  }
}
```

Module types:
- `script` — runs a script, requires `path` and `input_transforms`
- `flow` — runs a sub-flow, requires `path` and `input_transforms`
- `forloopflow` — iterates over an array, contains nested `modules`
- `branchone` — conditional branching with `branches` array and `default`
- `identity` — pass-through with optional `suspend` for approval flows

## API Authentication

Token stored in memory: `~/.claude/projects/-home-james-windmill/memory/windmill-api-key.md`

```bash
TOKEN=$(grep -oP 'V7Jz\w+' ~/.claude/projects/-home-james-windmill/memory/windmill-api-key.md | head -1)
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8100/api/w/admins/flows/list"
```

## Flow Recreate Pattern

When a flow has serde corruption:

```bash
# 1. Export the value JSON
docker exec windmill-db-1 psql -U postgres -d windmill -t -A -c \
  "SELECT value::text FROM flow WHERE path = 'f/admins/homelab_patrols/f/MY_FLOW';" > /tmp/flow_backup.json

# 2. Delete the corrupted row
docker exec windmill-db-1 psql -U postgres -d windmill -c \
  "DELETE FROM flow WHERE path = 'f/admins/homelab_patrols/f/MY_FLOW';"

# 3. Recreate via API (enforces correct serialization)
python3 -c "
import json
value = json.load(open('/tmp/flow_backup.json'))
payload = {
    'path': 'f/admins/homelab_patrols/f/MY_FLOW',
    'summary': 'My flow summary',
    'value': value,
    'schema': {'type': 'object', 'properties': {}, 'required': []}
}
print(json.dumps(payload))
" > /tmp/flow_create.json

curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "http://localhost:8100/api/w/admins/flows/create" \
  -d @/tmp/flow_create.json

# 4. Verify
curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8100/api/w/admins/flows/get/f/admins/homelab_patrols/f/MY_FLOW"
```

## Container Architecture

| Container | Role | Key Port |
|-----------|------|----------|
| windmill-windmill_server-1 | API server | 8000 (internal) |
| windmill-windmill_worker-{1,2,3} | Script/flow execution | — |
| windmill-windmill_worker_native-1 | Native script execution | — |
| windmill-windmill_extra-1 | Extra tooling | — |
| windmill-db-1 | PostgreSQL 16 | 5433→5432 |
| windmill-dind-1 | Docker-in-Docker | — |
| windmill-caddy-1 | Reverse proxy | 8100→80 |

## API Endpoints

| Purpose | Method | Path |
|---------|--------|------|
| List flows | GET | `/api/w/admins/flows/list` |
| Get flow | GET | `/api/w/admins/flows/get/{path}` |
| Create flow | POST | `/api/w/admins/flows/create` |
| Update flow | POST | `/api/w/admins/flows/update/{path}` |
| List schedules | GET | `/api/w/admins/schedules/list` |
| Get schedule | GET | `/api/w/admins/schedules/get/{path}` |
| List variables | GET | `/api/w/admins/variables/list` |
| Get variable | GET | `/api/w/admins/variables/get/{path}` |
| Version | GET | `/api/version` |

**Known 404s**: `/runs`, `/jobs`, `/schedule` (singular). Always use plural `/list` endpoints.

## Known Bugs

- **Flow serde corruption**: Flows inserted via direct DB SQL can cause `SqlErr: unexpected null; try decoding as Option`. Fix: delete and recreate via API.
- **`same_worker` field**: Adding `"same_worker": false` to flow value JSON can break deserialization in CE v1.691.0. Avoid it.

## Schema Verification

This reference was written for Windmill CE v1.691.0. After upgrades, verify schema accuracy:

```bash
# Check current version
curl -s http://localhost:8100/api/version

# Dump live table schemas
for t in v2_job_completed flow schedule script v2_job_runtime; do
  docker exec windmill-db-1 psql -U postgres -d windmill -c "\d $t"
done
```
