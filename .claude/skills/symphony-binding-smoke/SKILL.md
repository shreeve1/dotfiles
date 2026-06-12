---
name: symphony-binding-smoke
description: File a low-risk Plane smoke ticket against a Symphony binding, watch one Run land in its worktree, and report verdict. Use to prove a freshly bound or freshly authored repo actually dispatches end-to-end. Plane write requires explicit James approval at the moment of action. Refuses if the binding's WORKFLOW.md is still the scaffold stub.
---

# Symphony Binding Smoke

Files a single low-risk smoke ticket on a binding's Plane project, watches the dispatcher loop pick it up, locates the worktree, and reports the `SYMPHONY_RESULT` verdict. Today this is a multi-step manual sequence (Plane API call, journal watching, comment scraping). This skill codifies it.

## Prerequisites

- Target binding exists in `/home/james/symphony/bindings.yml`.
- Binding's `WORKFLOW.md` is **not** the scaffold stub. The agent on a stub WORKFLOW.md produces noise.
- `symphony-host.service` is `active/running` (check with `symphony-bindings-status` first).
- Plane env sourced (`PLANE_API_URL`, `PLANE_API_KEY`, `PLANE_WORKSPACE_SLUG`) — same sourcing block as `symphony-project-scaffold` / `symphony-bindings-status`.

## Safety rules

- Plane ticket creation is a write. **Ask James** for explicit approval at the moment of the API call. Show the full payload first.
- Refuse to smoke against a binding whose `WORKFLOW.md` is still the scaffold stub:
  ```bash
  grep -q 'Describe this repository.s Symphony workflow' "$REPO_PATH/WORKFLOW.md" 2>/dev/null \
    && { echo "stub WORKFLOW.md detected — author it first via symphony-workflow-author"; exit 1; }
  ```
- Default disposition is **persist** (smoke tickets stay in Plane as an audit trail). `--archive-on-success` opts into auto-archive after green — still requires James's typed-slug confirmation, mirroring `symphony-plane-recover archive`.
- Never print `PLANE_API_KEY` or env file contents.
- If the worktree creation lands on a non-default base branch or wanders outside the binding's configured location, surface that — don't normalize silently.

## Out of scope

- Restarting the service (see `symphony-restart`).
- Authoring `WORKFLOW.md` (see `symphony-workflow-author`).
- Archiving non-smoke Plane projects (see `symphony-plane-recover archive`).

## Interactive workflow

### 1. Resolve binding

- Required arg: `--binding <name>` (or first positional).
- Validate it exists in `bindings.yml`. Capture `project_id`, `repo_path`, `default_agent`, and the state UUID for "Todo".

```bash
python3 - <<PY
import yaml, sys
bindings = yaml.safe_load(open("/home/james/symphony/bindings.yml"))
[b] = [x for x in bindings.get("bindings", bindings) if x["name"] == "$NAME"]
print(b["project_id"], b["repo_path"], b.get("default_agent","pi"))
print(b["states"]["todo"])  # state uuid for Todo
PY
```

### 2. Workflow sanity

Read `$REPO_PATH/WORKFLOW.md`:

- If it does not exist, stop and point at `symphony-workflow-author`.
- If the stub sentinel is present, stop and point at `symphony-workflow-author`.

### 3. Build the smoke ticket payload

```
title:        [smoke] <ISO8601-Z timestamp> Symphony binding verification
description:  | Symphony binding smoke test.
              | No code changes expected. The agent should orient on the repo,
              | confirm it can read WORKFLOW.md, and emit SYMPHONY_RESULT.
state:        <todo-uuid>
labels:       [<mode-label-uuid>]   # default mode the binding's workflow expects (e.g. 'mode:execute')
```

Show the full payload to James for sanity-check before mutating.

### 4. Ask James to approve the Plane write

```
About to file ticket on Plane project <project_name> (binding=<name>):

  POST $PLANE_API_URL/api/v1/workspaces/$PLANE_WORKSPACE_SLUG/projects/<project_id>/issues/

  title:       [smoke] 2026-06-08T19:42:00Z Symphony binding verification
  state:       <todo-uuid>
  labels:      [<mode-label-uuid>]
  description: <as above>

Proceed? (y/n)
```

Wait for explicit y. Then:

```bash
curl -sS -X POST -H "X-Api-Key: $PLANE_API_KEY" -H "Content-Type: application/json" \
  "$PLANE_API_URL/api/v1/workspaces/$PLANE_WORKSPACE_SLUG/projects/$PROJECT_ID/issues/" \
  -d @smoke-payload.json \
  | jq -r '{id, identifier, name}'
```

Capture the issue `id` and `identifier` (e.g. `TRADING-7`) and the create timestamp.

### 5. Watch for dispatch

The reconcile/dispatch cadence is ~30s. Watch up to ~3 minutes:

```bash
deadline=$((SECONDS + 180))
while [ $SECONDS -lt $deadline ]; do
  journalctl -u symphony-host.service --since=2m --no-pager -n 200 \
    | grep -E "dispatch_completed.*issue_id=$ISSUE_ID" && break
  sleep 10
done
```

Expect: `dispatch_completed dispatched=true issue_id=<id> binding=<name>`.

If 3 minutes elapse with no matching dispatch line:

- Check the binding's most recent `dispatch_completed dispatched=false reason=<...>` to surface why (e.g. `binding-blocked`, `workflow-missing`, `plane-unreachable`).
- Report failure, leave the ticket in place, do **not** auto-cleanup.

### 6. Locate the worktree

```bash
ls -la "$REPO_PATH/../.symphony-runs/" 2>/dev/null \
  | grep -i "$ISSUE_IDENTIFIER\|$ISSUE_ID" | head -5
```

Symphony creates worktrees under the binding's configured location (typically `<repo>/../.symphony-runs/<run-id>/`). Report the worktree path. If the layout has moved (binding overrides), surface the actual path from the journal:

```bash
journalctl -u symphony-host.service --since=3m --no-pager \
  | grep -E "worktree=.*issue_id=$ISSUE_ID" | tail -1
```

### 7. Verdict scrape

Wait for the run to finish — bounded by the binding's `run_timeout_ms` (default 30min). Poll the journal for `run_completed issue_id=<id>` or equivalent, then scrape the verdict:

```bash
journalctl -u symphony-host.service --since=30m --no-pager \
  | grep -E "issue_id=$ISSUE_ID" | grep -E 'SYMPHONY_RESULT|SYMPHONY_SUMMARY'
```

`SYMPHONY_RESULT: done|review|blocked` — last occurrence wins. Also fetch the Plane comment thread:

```bash
curl -sS -H "X-Api-Key: $PLANE_API_KEY" \
  "$PLANE_API_URL/api/v1/workspaces/$PLANE_WORKSPACE_SLUG/projects/$PROJECT_ID/issues/$ISSUE_ID/comments/" \
  | jq -r '.results[] | "[\(.created_at)] \(.comment_stripped // .comment_html)"'
```

### 8. Report

```
binding         <name>
ticket          <identifier> (id=<id>)  url=<plane-url>
dispatched      <iso>  (after Ns)
worktree        <path>
duration        <s>
result          done | review | blocked
summary         <SYMPHONY_SUMMARY line>
plane_comment   <one-line excerpt from the last Plane comment>
```

### 9. Cleanup (opt-in)

If `--archive-on-success` was passed AND `result == done`:

- Show James the archive command and a typed-slug confirmation prompt (mirrors `symphony-plane-recover archive`).
- After typed approval, archive via the Plane API:
  ```bash
  curl -sS -X POST -H "X-Api-Key: $PLANE_API_KEY" \
    "$PLANE_API_URL/api/v1/workspaces/$PLANE_WORKSPACE_SLUG/projects/$PROJECT_ID/issues/$ISSUE_ID/archive/"
  ```

Default (no flag) persists the ticket. The audit trail is more valuable than a clean Plane board.
