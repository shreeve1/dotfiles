---
name: symphony-bindings-status
description: Read-only "what's running" report on Symphony bindings. Combines bindings.yml, the systemd journal, and Plane reads into one compact table — binding name, project, repo, last reconcile, last dispatch, open issue count. Use before any restart, scaffold, or binding edit. Safe by construction (no mutations, no env file reads).
---

# Symphony Bindings Status

Read-only situational awareness. Answers "what bindings exist, are they reconciling, are they dispatching, and how many open issues each one has". Run this before any restart, scaffold, smoke, or binding edit so the operator has a baseline.

## Prerequisites

- Read access to `/home/james/plane/symphony/bindings.yml`.
- Read access to the journal: `journalctl -u symphony-host.service` works without sudo.
- Plane env (for the open-issue count column): `PLANE_API_URL`, `PLANE_API_KEY`, `PLANE_WORKSPACE_SLUG`. If unset in the shell, source them the same way `symphony-project-scaffold` does:
  ```bash
  [ -r /home/james/plane/symphony-host.env ] && set -a && . /home/james/plane/symphony-host.env && set +a
  if [ -z "$PLANE_API_URL" ] || [ -z "$PLANE_WORKSPACE_SLUG" ]; then
    eval "$(systemctl show symphony-host.service --property=Environment --no-pager \
      | sed 's/^Environment=//' | tr ' ' '\n' \
      | grep -E '^(PLANE_API_URL|PLANE_WORKSPACE_SLUG)=' | sed 's/^/export /')"
  fi
  ```
  Do not print the values. If the Plane env can't be sourced, render the table with `?` in the project / open-issue columns and surface a warning.

## Safety rules

- Read-only by construction. No writes to Plane, bindings.yml, the unit, or the journal.
- Never print env file values. If a query path would expose a secret (e.g. echoing the API key in a `curl -v`), redact or restructure.
- Never invoke `systemctl restart/stop/start`.
- If `bindings.yml` is missing or malformed, surface the parse error and stop — do not attempt to "fix" it.

## Out of scope

- Restarting the service (see `symphony-restart`).
- Adding or removing bindings (see `symphony-project-scaffold`).
- Filing tickets (see `symphony-binding-smoke`).

## Interactive workflow

### 1. Locate bindings.yml

- Default: `/home/james/plane/symphony/bindings.yml`.
- Override: `$SYMPHONY_BINDINGS_PATH` if set.

Parse with `python3 -c "import yaml,sys; print(yaml.safe_load(open(sys.argv[1])))" <path>` or equivalent.

### 2. Read service state

```bash
systemctl show symphony-host.service \
  --property=ActiveState,SubState,MainPID,ActiveEnterTimestamp --no-pager
```

If `ActiveState != active`, surface that prominently at the top of the report — every "last X" column will read `service-down`.

### 3. Per-binding facts

For each entry in `bindings.yml`, collect:

- `name` — from the binding.
- `project_id` — from the binding (Plane project UUID).
- `repo_path` — from the binding.
- `project_name` + `open_issue_count` — from Plane, via:
  ```bash
  curl -sS -H "X-Api-Key: $PLANE_API_KEY" \
    "$PLANE_API_URL/api/v1/workspaces/$PLANE_WORKSPACE_SLUG/projects/$PROJECT_ID/" \
    | jq -r '.name'
  curl -sS -H "X-Api-Key: $PLANE_API_KEY" \
    "$PLANE_API_URL/api/v1/workspaces/$PLANE_WORKSPACE_SLUG/projects/$PROJECT_ID/issues/?state__group=unstarted,started&per_page=1" \
    | jq -r '.total_count // (.results | length)'
  ```
  (Field names may need adjusting if the Plane response shape differs; treat the first call as the source of truth for the project name and the second for an open-issue tally limited to Todo + Running groups. If the API errors, render `?` in that column.)
- `last_reconcile_done` — most recent `reconcile_startup_done binding=<name>` in last 10 minutes.
- `last_reconcile_status` — `ok` if a matching `_done` exists after the most recent `_begin`, `failed` if the most recent line is `reconcile_startup_failed`, `pending` if `_begin` with no matching `_done`, `stale` if nothing in the last 10 minutes.
- `last_dispatch` — most recent `dispatch_completed` line with `binding=<name>` in last 10 minutes. Capture `dispatched=<bool>` and `reason=<...>` if not dispatched, or `issue_id=<id>` if dispatched.
- `running_count` — most recent `dispatched=true` count since the service started (best-effort; if the log line doesn't expose this, omit the column).

Journal query template (per binding):

```bash
journalctl -u symphony-host.service --since=10m --no-pager \
  | grep -E "binding=$NAME"
```

### 4. Render the table

Default human-readable form:

```
service        active/running  pid=12345  uptime=2h13m
bindings       2

name        project              repo                          last_reconcile  last_dispatch                      open
homelab     Homelab              /home/james/homelab           done 12s ago    false reason=no-candidates 7s ago    3
trading     Crypto Trading...    /home/james/trading/crypto-…  done 12s ago    false reason=no-candidates 7s ago    0
```

Truncate `project` and `repo` to keep the table to terminal width. Right-align numeric columns. Use age strings (`12s ago`, `4m ago`) instead of full timestamps.

### 5. Optional JSON output

If `--json` was passed, emit a single JSON object on stdout for piping into other tools:

```json
{
  "service": {"active": true, "pid": 12345, "uptime_seconds": 7980},
  "bindings": [
    {
      "name": "homelab",
      "project_id": "uuid",
      "project_name": "Homelab",
      "repo_path": "/home/james/homelab",
      "open_issue_count": 3,
      "last_reconcile_status": "ok",
      "last_reconcile_done_seconds_ago": 12,
      "last_dispatch": {
        "dispatched": false,
        "reason": "no-candidates",
        "seconds_ago": 7
      }
    }
  ]
}
```

Pretty-print only if stdout is a terminal (default to compact otherwise).

### 6. Verdict / hand off

Add a one-line verdict at the bottom:

- All bindings green (`reconcile=ok`, dispatcher loop alive within last 2× reconcile cadence): `ok — N bindings healthy`.
- Any binding stale or failed: `warn: <name> <reason>` per row; suggest `symphony-restart` if multiple bindings are stale.
- Service down: `service down — every column is service-down; start with: systemctl status symphony-host.service`.

Never recommend a restart unprompted. The verdict points at the next skill (`symphony-restart`, `symphony-binding-smoke`) but does not run it.
