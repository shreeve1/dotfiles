# Windmill CE DB and API Reference

Use this reference for deeper inspection after the main skill's quick checks are insufficient.

## Key Tables

### `v2_job_completed`

Completed job history for scripts and flows.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `status` | `text` | `success`, `failure`, `canceled` |
| `started_at` | `timestamptz` | Execution start |
| `completed_at` | `timestamptz` | Execution finish |
| `duration_ms` | `bigint` | Wall-clock duration |
| `result` | `jsonb` | Output or error JSON |

Recent failures:

```sql
SELECT id, started_at, duration_ms, LEFT(result::text, 300) AS error
FROM v2_job_completed
WHERE status = 'failure'
  AND started_at >= NOW() - INTERVAL '24 hours'
ORDER BY started_at DESC;
```

Failure rate by hour:

```sql
SELECT date_trunc('hour', started_at) AS hour,
       COUNT(*) FILTER (WHERE status = 'success') AS successes,
       COUNT(*) FILTER (WHERE status = 'failure') AS failures
FROM v2_job_completed
WHERE started_at >= NOW() - INTERVAL '48 hours'
GROUP BY hour
ORDER BY hour;
```

Find a specific error pattern:

```sql
SELECT id, started_at, result::text
FROM v2_job_completed
WHERE result::text LIKE '%flow not found%'
ORDER BY started_at DESC
LIMIT 20;
```

### `flow`

Flow definitions from the visual pipeline builder.

| Column | Type | Notes |
| --- | --- | --- |
| `path` | `text` | Primary key, for example `f/admins/paperclip2/f/secops_executor` |
| `value` | `jsonb` | Flow structure: modules, input transforms, flow env |
| `schema` | `jsonb` | Input schema |
| `summary` | `text` | Human-readable description |
| `archived` | `boolean` | Soft delete flag |
| `edited_by` | `text` | Last editor |
| `edited_at` | `timestamptz` | Last edit timestamp |
| `version_id` | `bigint` | Optimistic concurrency version |

List flows:

```sql
SELECT path, summary, archived
FROM flow
ORDER BY path;
```

Inspect value keys for a flow:

```sql
SELECT path, jsonb_object_keys(value) AS keys
FROM flow
WHERE path = '{PATH}';
```

Extract sub-flow references:

```sql
SELECT path, jsonb_path_query(value, '$.modules[*].value.path')::text AS ref
FROM flow
WHERE path = '{PATH}';
```

Compare two flow structures:

```sql
SELECT path, jsonb_object_keys(value) AS value_keys
FROM flow
WHERE path IN ('{PATH1}', '{PATH2}')
ORDER BY path, value_keys;
```

### `schedule`

Scheduled job configurations.

| Column | Type | Notes |
| --- | --- | --- |
| `path` | `text` | Primary key |
| `schedule` | `text` | Cron expression |
| `enabled` | `boolean` | Whether the schedule is active |
| `script_path` | `text` | Script or flow path |
| `is_flow` | `boolean` | `true` for flow, `false` for script |
| `args` | `jsonb` | Static job arguments |
| `summary` | `text` | Description |

All schedules:

```sql
SELECT path, schedule, enabled, script_path, is_flow
FROM schedule
ORDER BY path;
```

Enabled schedules and their latest completed job timestamp:

```sql
SELECT s.path, s.schedule, s.script_path, MAX(c.started_at) AS last_run
FROM schedule s
LEFT JOIN v2_job_completed c ON true
WHERE s.enabled = true
GROUP BY s.path, s.schedule, s.script_path;
```

### `script`

Registered scripts.

| Column | Type | Notes |
| --- | --- | --- |
| `path` | `text` | Primary key |
| `language` | `text` | `python3`, `deno`, etc. |
| `content` | `text` | Source code |
| `created_at` | `timestamptz` | Registration time |

Recent scripts:

```sql
SELECT path, language, created_at
FROM script
ORDER BY created_at DESC
LIMIT 20;
```

Find paperclip2 scripts:

```sql
SELECT path, language
FROM script
WHERE path LIKE '%paperclip2%'
ORDER BY path;
```

## Flow Value JSON

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

Common module types:

- `script`: runs a script; requires `path` and `input_transforms`.
- `flow`: runs a sub-flow; requires `path` and `input_transforms`.
- `forloopflow`: iterates over an array and contains nested `modules`.
- `branchone`: conditional branch with `branches` and `default`.
- `identity`: pass-through, sometimes with `suspend` for approvals.

## Flow Recreate Pattern

Use this only when the API reports flow serde corruption, such as `unexpected null; try decoding as Option`.

1. Export the existing flow JSON:

```bash
docker exec windmill-db-1 psql -U postgres -d windmill -t -A -c \
  "SELECT value::text FROM flow WHERE path = 'f/admins/paperclip2/f/MY_FLOW';" > /tmp/flow_backup.json
```

2. Delete the corrupted row only after confirming the backup exists and is non-empty:

```bash
docker exec windmill-db-1 psql -U postgres -d windmill -c \
  "DELETE FROM flow WHERE path = 'f/admins/paperclip2/f/MY_FLOW';"
```

3. Recreate through the API:

```bash
python3 -c "
import json
value = json.load(open('/tmp/flow_backup.json'))
payload = {
    'path': 'f/admins/paperclip2/f/MY_FLOW',
    'summary': 'My flow summary',
    'value': value,
    'schema': {'type': 'object', 'properties': {}, 'required': []}
}
print(json.dumps(payload))
" > /tmp/flow_create.json

curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "http://localhost:8100/api/w/admins/flows/create" \
  -d @/tmp/flow_create.json
```

4. Verify:

```bash
curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8100/api/w/admins/flows/get/f/admins/paperclip2/f/MY_FLOW"
```

## Known Issues

- Flow serde corruption: direct DB SQL inserts/updates can create JSON that Windmill CE cannot deserialize. Prefer API create/update.
- `same_worker`: adding `"same_worker": false` to flow value JSON can break deserialization in Windmill CE `v1.691.0`. Avoid it unless current API docs and instance behavior prove it is accepted.

## Containers

| Container | Role | Key port |
| --- | --- | --- |
| `windmill-windmill_server-1` | API server | `8000` internal |
| `windmill-windmill_worker-{1,2,3}` | Script and flow execution | none |
| `windmill-windmill_worker_native-1` | Native script execution | none |
| `windmill-windmill_extra-1` | Extra tooling | none |
| `windmill-db-1` | PostgreSQL 16 | `5433 -> 5432` |
| `windmill-dind-1` | Docker-in-Docker | none |
| `windmill-caddy-1` | Reverse proxy | `8100 -> 80` |
