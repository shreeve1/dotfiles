---
name: windmill
description: Diagnose and troubleshoot the local Windmill CE instance and Peppermint ticketing layer for the paperclip2 automation pipeline. Use when Codex needs to check Windmill health, Peppermint health, failing flows, schedules, job/run errors, container status, logs, DB state, API endpoints, compose changes, or anything related to Windmill on localhost:8100 / Peppermint on localhost:8201 in /home/james/windmill.
---

# Windmill

Use this skill for Windmill CE diagnostics and small, explicit remediation tasks on the local instance.

## Connection

- Workdir: `/home/james/windmill`
- Base URL: `http://localhost:8100`
- Workspace: `admins`
- DB command: `docker exec windmill-db-1 psql -U postgres -d windmill`
- Peppermint UI/API: host `:8201` -> container `3000`, host `:8202` -> container `5003`
- Peppermint DB command: `docker exec windmill-db-1 psql -U postgres -d peppermint`
- Token source order:
  1. Use `WINDMILL_TOKEN` if it is already set.
  2. Otherwise read the legacy Claude memory file at `~/.claude/projects/-home-james-windmill/memory/windmill-api-key.md`.
  3. If no token is available, ask the user for one or use DB/log-only checks.
- Never print the API token in user-facing output or logs.

When setting a token for commands:

```bash
TOKEN="${WINDMILL_TOKEN:-$(grep -oE 'V7Jz[[:alnum:]_]+' ~/.claude/projects/-home-james-windmill/memory/windmill-api-key.md | head -1)}"
```

## Safety Rules

- Prefer read-only checks first: `docker compose ps`, API GETs, logs, and SELECT queries.
- Before changing flows, schedules, or DB rows, explain the intended mutation and verify a backup/export path.
- Do not use direct SQL to insert or update Windmill flow JSON unless the user explicitly asks. Prefer the API because it preserves Windmill serialization expectations.
- If a remediation deletes/recreates a flow, export the original row first and verify the API can read the recreated flow.
- Do not remove containers, volumes, or database state unless the user explicitly asks. Preserve `windmill_peppermint_uploads` when recreating Peppermint.
- Peppermint shares the same Postgres container as Windmill but uses a separate `peppermint` database and `peppermint` role. Treat Peppermint image upgrades as database-migration events.

## Health Check

```bash
cd /home/james/windmill
docker compose ps
curl -s http://localhost:8100/api/version
curl -sS -o /dev/null -w 'peppermint-ui %{http_code}\n' http://localhost:8201
curl -sS -o /dev/null -w 'peppermint-api %{http_code}\n' http://localhost:8202
docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}'
```

Expected Peppermint responses: UI `200`, unauthenticated API root `401`.

For server and worker errors:

```bash
docker logs windmill-windmill_server-1 --tail 200 2>&1 | grep -v "ping update" | tail -40
docker logs windmill-windmill_worker-1 --tail 80 2>&1
docker logs windmill-peppermint-1 --tail 120 2>&1
docker logs windmill-windmill_server-1 --since 1h 2>&1 | grep -i error
```

## Docker Compose

- To pause or resume the same containers, use `docker compose stop` and `docker compose start`.
- Do not use `docker compose up -d` as a resume command; it reconciles image/config changes and may recreate containers.
- Use `docker compose pull && docker compose up -d` only when intentionally upgrading or applying Compose configuration changes.
- Peppermint is pinned in `docker-compose.yml` by digest. Do not switch it back to `pepperlabs/peppermint:latest` or add `pull_policy: always` unless intentionally upgrading after reviewing migrations.
- To apply Peppermint-only config changes, use `docker compose up -d peppermint`.
- If `up -d` fails with `failed to unmount /tmp/containerd-mount...: device or resource busy`, check for stale containerd mounts and clear only that exact mount point before retrying.

## Peppermint

Current compose facts:

- Service/container: `peppermint` / `windmill-peppermint-1`
- Image: pinned digest in `docker-compose.yml`
- Database: existing `windmill-db-1` Postgres container, separate `peppermint` database, `peppermint` role
- Compose env: `DB_USERNAME=peppermint`, `DB_PASSWORD=${PEPPERMINT_DB_PASSWORD}`, `DB_HOST=db`, `SECRET=${PEPPERMINT_SECRET}`
- Upload persistence: named volume `windmill_peppermint_uploads` mounted at `/apps/api/uploads`
- Host ports: `8201:3000` for UI, `8202:5003` for API. User has firewall rules blocking direct `8201`; verify firewall posture before assuming public exposure, and check `8202` similarly.
- Internal Docker DNS from Windmill containers can use service name `peppermint`.

Peppermint Windmill variables used by paperclip2 scripts:

- `f/admins/peppermint_url`
- `f/admins/peppermint_admin_email`
- `f/admins/peppermint_admin_password`
- `f/admins/peppermint_dsn`

Never print Peppermint passwords, DSNs, admin credentials, or `.env` secret values. Use key-only checks when verifying environment configuration.

Useful read-only checks:

```bash
docker compose ps db peppermint
docker inspect windmill-peppermint-1 --format 'Image={{.Image}} Mounts={{range .Mounts}}{{.Name}}:{{.Destination}} {{end}}'
docker volume inspect windmill_peppermint_uploads
docker exec windmill-peppermint-1 sh -lc 'find /apps/api/uploads -mindepth 1 -maxdepth 1 2>/dev/null | wc -l'
docker exec windmill-db-1 psql -U postgres -d peppermint -c '\dt'
```

Peppermint is the operator-facing ticket narrative for paperclip2. The `paperclip2` tables in the Windmill database remain the operational source of truth; Peppermint stores the human-readable ticket/comment trail and is keyed by incident fingerprint in integration code.

## Run History

Recent completed runs:

```bash
docker exec windmill-db-1 psql -U postgres -d windmill -c "
SELECT id, status, started_at, duration_ms, LEFT(result::text, 200) AS result
FROM v2_job_completed
ORDER BY started_at DESC
LIMIT 20;"
```

24-hour status summary:

```bash
docker exec windmill-db-1 psql -U postgres -d windmill -c "
SELECT status, COUNT(*), MIN(started_at), MAX(started_at)
FROM v2_job_completed
WHERE started_at >= NOW() - INTERVAL '24 hours'
GROUP BY status;"
```

## Flow Diagnostics

List flows and verify each flow loads through the API. A `200` is healthy; a `400` can indicate flow serde corruption.

```bash
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8100/api/w/admins/flows/list" |
  python3 -c "import sys,json; [print(f.get('path','')) for f in json.load(sys.stdin)]" |
  while read fp; do
    curl -s -o /dev/null -w "%{http_code} $fp\n" \
      -H "Authorization: Bearer $TOKEN" \
      "http://localhost:8100/api/w/admins/flows/get/$fp"
  done
```

If a flow returns `400` with `unexpected null; try decoding as Option`, use the flow recreate pattern in [references/windmill-reference.md](references/windmill-reference.md). Back up first, then delete and recreate through the API.

## Schedule Check

```bash
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8100/api/w/admins/schedules/list" |
  python3 -c "import sys,json; [print(f\"{s['path']:55} enabled={s['enabled']}  sched={s['schedule']}\") for s in json.load(sys.stdin)]"
```

Or via DB:

```bash
docker exec windmill-db-1 psql -U postgres -d windmill -c "
SELECT path, schedule, enabled, script_path, is_flow
FROM schedule
ORDER BY path;"
```

## Paperclip2 Pipeline

The six domain executors are `secops`, `infraops`, `netops`, `mediaops`, `storageops`, and `dockerops`. Each domain chain is:

```text
domain_executor -> decision_executor -> executor
```

`approval_timeout` is standalone and runs every 5 minutes.

## API Endpoints

Use plural list endpoints:

| Purpose | Method | Path |
| --- | --- | --- |
| List flows | GET | `/api/w/admins/flows/list` |
| Get flow | GET | `/api/w/admins/flows/get/{path}` |
| Create flow | POST | `/api/w/admins/flows/create` |
| Update flow | POST | `/api/w/admins/flows/update/{path}` |
| List schedules | GET | `/api/w/admins/schedules/list` |
| Get schedule | GET | `/api/w/admins/schedules/get/{path}` |
| Version | GET | `/api/version` |

Known wrong endpoints: `/runs`, `/jobs`, and `/schedule` singular.

## Deeper Reference

Read [references/windmill-reference.md](references/windmill-reference.md) when you need DB schema details, common SQL queries, flow JSON structure, the flow recreate pattern, or container roles.
