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
| path | text | Primary key (e.g. `f/admins/paperclip2/f/secops_executor`) |
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
SELECT path, language FROM script WHERE path LIKE '%paperclip2%' ORDER BY path;
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
  "SELECT value::text FROM flow WHERE path = 'f/admins/paperclip2/f/MY_FLOW';" > /tmp/flow_backup.json

# 2. Delete the corrupted row
docker exec windmill-db-1 psql -U postgres -d windmill -c \
  "DELETE FROM flow WHERE path = 'f/admins/paperclip2/f/MY_FLOW';"

# 3. Recreate via API (enforces correct serialization)
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

curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "http://localhost:8100/api/w/admins/flows/create" \
  -d @/tmp/flow_create.json

# 4. Verify
curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8100/api/w/admins/flows/get/f/admins/paperclip2/f/MY_FLOW"
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

## Peppermint Schema (`peppermint` database)

Peppermint is the ticket surface for paperclip2. All tables use double-quoted PascalCase names (Prisma convention). Connect with:

```bash
docker exec windmill-db-1 psql -U postgres -d peppermint
```

Web UI: `http://10.20.20.16:8201` (internal) / `homelab.testytech.net` (external, behind Authelia).
Admin login: `jamesschriever@gmail.com` — password in `windmill/.env` as `PEPPERMINT_DB_PASSWORD`.

### "Ticket"

| Column | Type | Notes |
|--------|------|-------|
| id | text | UUID primary key |
| Number | integer | Auto-increment, human-readable ticket number |
| title | text | `<domain>:<check_type>:<target> — <message>` |
| detail | text | First-occurrence finding full message |
| isComplete | boolean | false = open, true = closed |
| status | TicketStatus | `needs_support`, `in_progress`, `in_review`, `done` |
| priority | text | `low`, `medium`, `high` |
| clientId | text | FK → `"Client".id` (maps to domain) |
| linked | jsonb | `{"paperclip2_fingerprint": "<16-hex>"}` — used for idempotent lookup |
| createdAt | timestamptz | |
| updatedAt | timestamptz | Bumped on every comment append |

Key index: `idx_ticket_paperclip2_fingerprint` on `linked->>'paperclip2_fingerprint'`
Unique constraint: `uniq_open_ticket_paperclip2_fingerprint` — only one open ticket per fingerprint at a time.

### "Comment"

| Column | Type | Notes |
|--------|------|-------|
| id | text | UUID primary key |
| ticketId | text | FK → `"Ticket".id` |
| text | text | Comment body (plain text, newlines allowed; NUL bytes rejected by Postgres) |
| public | boolean | Always `true` for paperclip2-written comments |
| reply | boolean | `false` for paperclip2-written comments (true would mark as a reply thread) |
| edited | boolean | `false` for paperclip2-written comments |
| createdAt | timestamptz | |

### "Client"

One row per domain. Seeded at deploy time:

| name | (maps to domain) |
|------|-----------------|
| secops | secops |
| infraops | infraops |
| netops | netops |
| mediaops | mediaops |
| storageops | storageops |
| dockerops | dockerops |

**Common Peppermint queries:**

```sql
-- Open ticket count by domain
SELECT c.name AS domain, COUNT(*) AS open
FROM "Ticket" t JOIN "Client" c ON t."clientId" = c.id
WHERE t."isComplete" = false GROUP BY c.name ORDER BY open DESC;

-- All open tickets with age
SELECT t."Number", t.title, t.status,
       NOW() - t."createdAt" AS age,
       t.linked->>'paperclip2_fingerprint' AS fingerprint
FROM "Ticket" t WHERE t."isComplete" = false ORDER BY t."createdAt";

-- Most recent comment on each open ticket
SELECT t."Number", t.title, MAX(cm."createdAt") AS last_comment
FROM "Ticket" t LEFT JOIN "Comment" cm ON cm."ticketId" = t.id
WHERE t."isComplete" = false GROUP BY t."Number", t.title ORDER BY last_comment DESC;

-- Tickets closed in the last 24h
SELECT t."Number", t.title, t."updatedAt",
       t.linked->>'paperclip2_fingerprint' AS fingerprint
FROM "Ticket" t WHERE t."isComplete" = true AND t."updatedAt" >= NOW() - INTERVAL '24 hours'
ORDER BY t."updatedAt" DESC;

-- Full comment trail for a ticket
SELECT cm."createdAt", cm.text
FROM "Comment" cm JOIN "Ticket" t ON cm."ticketId" = t.id
WHERE t."Number" = <N> ORDER BY cm."createdAt";
```

**Peppermint → paperclip2 cross-DB join** (incidents table lives in `paperclip2` DB — use two queries, not a join):

```bash
# Step 1: get fingerprint from Peppermint
FINGERPRINT=$(docker exec windmill-db-1 psql -U postgres -d peppermint -t -A -c \
  "SELECT linked->>'paperclip2_fingerprint' FROM \"Ticket\" WHERE \"Number\" = <N>;")

# Step 2: look up the incident in paperclip2
docker exec windmill-db-1 psql -U postgres -d paperclip2 -c \
  "SELECT id, domain, check_type, target, state, last_seen FROM paperclip2.incidents WHERE fingerprint = '$FINGERPRINT';"
```

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
