---
name: symphony-troubleshooter
description: "Real-time Symphony diagnostic copilot for safe log review, binding/run correlation, hypotheses, and handoffs."
---

# Symphony Troubleshooter

Real-time diagnostic copilot for Symphony incidents. Use when James says Symphony is not dispatching, a Plane ticket is stuck, a binding looks stale, a run failed/blocked, logs look odd, or he wants a future AI session prepped to debug Symphony with him.

This skill is not only context gathering. It actively drives a live investigation: collect evidence, explain what it means, keep a hypothesis list, ask focused questions, recommend next safe action, and hand off any mutation to the proper Symphony skill.

## Scope

### Use for

- `symphony-host.service` health checks.
- Binding status, reconcile status, dispatch loop liveness.
- Plane ticket not picked up.
- Run stuck, crashed, timed out, or marked `blocked` / `review`.
- `WORKFLOW.md` missing, stubbed, or mode mismatch.
- Agent runner issues (`pi`, Claude tmux adapter, tool denial, approval gate, silent exit).
- Worktree and branch correlation under `.symphony-runs`.
- Preparing a future AI session with enough context to continue without rediscovery.

### Out of scope

- Restarting service directly. Hand off to `symphony-restart`.
- Filing smoke tickets directly. Hand off to `symphony-binding-smoke`.
- Creating/editing bindings. Hand off to `symphony-project-scaffold`.
- Authoring repository workflow files. Hand off to `symphony-workflow-author`.
- Plane project/state mutation. Hand off to `symphony-plane-recover`.
- Unit-file edits. James owns `/etc/systemd/system/symphony-host.service`.

## Safety rules

- Read-only by default.
- Never print values from `/home/james/symphony-host.env`.
- Never echo `PLANE_API_KEY`, curl with `-v`, or show request headers containing secrets.
- Never run `systemctl restart`, `start`, `stop`, `daemon-reload`, or unit edits inside this skill.
- Never mutate Plane, `bindings.yml`, repo worktrees, or issue states inside this skill.
- If a fix needs mutation, show evidence and ask James. Then invoke correct handoff skill.
- Treat `/home/james/symphony` as live infrastructure source. Read before changing anything. This skill should not edit code unless James explicitly pivots to implementation.

## Key locations

- Symphony repo: `/home/james/symphony/`
- Bindings file: `/home/james/symphony/bindings.yml`
- Secret env: `/home/james/symphony-host.env` (do not print)
- Service: `symphony-host.service`
- Unit file: `/etc/systemd/system/symphony-host.service` (read only unless James explicitly asks outside this skill)
- Run worktrees: usually near each bound repo at `<repo>/../.symphony-runs/`
- Bound repos: verify current paths from `bindings.yml` before relying on remembered values.
- Known current examples: `/home/james/homelab/`, `/home/james/trading/crypto-trading-agents/`.
- Runbook: `/home/james/homelab/docs/runbooks/automation/symphony.md`

## Related skills

- `symphony-bindings-status` — first-line read-only health table.
- `symphony-restart` — controlled restart after evidence says restart is needed.
- `symphony-binding-smoke` — end-to-end dispatch proof for a binding.
- `symphony-workflow-author` — replace stub/missing `WORKFLOW.md`.
- `symphony-project-scaffold` — add or repair binding ownership through scaffold flow.
- `symphony-plane-recover state-fill` — repair Plane state/label drift.
- `diagnose` — deeper code bug loop if evidence points to source defect.

## Real-time operator loop

Run this loop with James. Do not dump raw logs without interpretation.

1. **Frame symptom**
   - Ask for one concrete symptom if missing: service down, binding stale, ticket stuck, run failed, or unknown.
   - Ask for binding name or Plane issue identifier if James has one.
   - State success criterion for this troubleshooting session.

2. **Capture safe baseline**
   - Use `symphony-bindings-status` first when available; it is the fastest safe health table.
   - If that skill cannot run, use the manual commands below.
   - Run read-only service state and recent logs.
   - Parse bindings.
   - Produce compact table: service state, binding names, last reconcile, last dispatch, recent errors.

3. **Correlate target**
   - If binding known: filter logs by `binding=<name>`.
   - If issue known: filter logs by `issue_id=<uuid>` and identifier-derived run id.
   - If Plane identifier known but UUID unknown: ask James whether to allow safe Plane reads using sourced env; never print env values.

4. **Hypothesize**
   - Maintain 2-4 hypotheses ranked by evidence.
   - For each hypothesis, name one confirming check and one falsifying check.
   - Do not recommend restart until logs support stale process, service failure, or new code not loaded.

5. **Ask for operator decision**
   - If next action is mutation, stop and hand off.
   - If next action is more log review, run bounded queries and summarize.
   - If multiple paths exist, ask James which path matters most.

6. **Drive next action**
   - Read logs/config/source as needed.
   - Explain finding in plain terms.
   - Recommend: wait, smoke, restart, recover Plane state, author workflow, or open code diagnosis.

7. **Prepare future session handoff**
   - End with durable facts: symptom, commands run, key log lines, binding/issue IDs, hypotheses, recommended next skill, and exact safety boundary.

## First 10 minutes checklist

Use these commands from any directory unless command says otherwise.

### Service snapshot

```bash
systemctl show symphony-host.service \
  --property=ActiveState,SubState,MainPID,ActiveEnterTimestamp,WorkingDirectory --no-pager
```

### Repo and disk code snapshot

```bash
git -C /home/james/symphony log --oneline -1
git -C /home/james/symphony status --porcelain
```

Dirty tree does not prove service is broken. It does affect restart safety.

### Bindings parse

```bash
python3 - <<'PY'
import yaml
path = "/home/james/symphony/bindings.yml"
data = yaml.safe_load(open(path, encoding="utf-8"))
bindings = data.get("bindings", data) if isinstance(data, dict) else data
for b in bindings:
    contract = b.get('tracker_contract') or {}
    project_id = b.get('plane_project_id') or b.get('project_id') or contract.get('project_id') or '?'
    print(f"{b['name']}\tproject={project_id}\trepo={b.get('repo_path','?')}\tagent={b.get('default_agent','pi')}")
PY
```

### Config snapshot

Capture operational knobs that affect dispatch gates. This avoids rediscovering mode/state/label mapping later.

```bash
python3 - <<'PY'
import yaml
path = "/home/james/symphony/bindings.yml"
data = yaml.safe_load(open(path, encoding="utf-8"))
bindings = data.get("bindings", data) if isinstance(data, dict) else data
for b in bindings:
    c = b.get("tracker_contract") or {}
    project_id = b.get("plane_project_id") or b.get("project_id") or c.get("project_id") or "?"
    print(f"\n## {b['name']}")
    print(f"repo={b.get('repo_path','?')} base={b.get('base_branch','?')} agent={b.get('default_agent','pi')} project={project_id}")
    print(f"approval_enabled={(b.get('approval') or {}).get('enabled','?')} landing={(b.get('landing') or {}).get('mode','?')}")
    print("states=" + ", ".join(f"{k}:{v.get('name','?')}" for k,v in (c.get('state_roles') or {}).items()))
    print("labels=" + ", ".join(f"{k}:{v.get('name','?')}" for k,v in (c.get('label_roles') or {}).items()))
PY
```

### Recent error slice

```bash
journalctl -u symphony-host.service --since=15m --no-pager \
  | grep -E 'ERROR|Traceback|ConfigError|reconcile_startup_failed|dispatch_failed|plane_poll_failed|Plane authentication failed|workflow-missing|permission-gate|approval-gate|pi_silent_exit|agent-crashed|timeout|nonzero' \
  || echo "no recent matched errors"
```

### Lifecycle slice

```bash
journalctl -u symphony-host.service --since=15m --no-pager \
  | grep -E 'symphony_started|reconcile_startup_(begin|done|failed)|dispatch_completed|issue_claimed|run_worktree_created|worktree_created|agent_exited|state_transitioned|auto_commit_|worktree_removed' \
  | tail -120
```

### Per-binding slice

Current log limitation: `dispatch_completed`, `issue_claimed`, `agent_exited`, and `state_transitioned` are issue-scoped, not binding-scoped. `reconcile_startup_*` includes `binding=<name>`. For dispatch/run events, correlate binding through Plane project, issue ID, or worktree path.

```bash
NAME=<binding-name>
journalctl -u symphony-host.service --since=30m --no-pager \
  | grep -E "binding=$NAME|reconcile_startup_(begin|done|failed)" \
  | tail -120
```

If binding attribution blocks diagnosis, recommend source improvement: add `binding=<name>` to `dispatch_completed`, `issue_claimed`, `agent_exited`, `state_transitioned`, and worktree lifecycle logs.

### Per-issue slice

```bash
ISSUE_ID=<plane-issue-uuid>
journalctl -u symphony-host.service --since=2h --no-pager \
  | grep -E "issue_id=$ISSUE_ID|run_worktree_created|agent_exited|state_transitioned|auto_commit_|worktree_removed" \
  | tail -160
```

## Log line meanings

- `symphony_started service=symphony code_sha=<sha> bindings=<N>` — process loaded config and started.
- `reconcile_startup_begin binding=<name>` — binding startup cleanup began.
- `reconcile_startup_done binding=<name> cleaned=<N>` — binding startup cleanup finished.
- `reconcile_startup_failed binding=<name> error=<...>` — binding failed startup cleanup. Dispatch may still start for other bindings.
- `dispatch_completed dispatched=false reason=no-candidates issue_id=` — loop alive; no eligible Todo issue.
- `dispatch_completed dispatched=false reason=plane-unreachable` — Plane read failed or transient network/API issue.
- `dispatch_completed dispatched=false reason=workflow-missing issue_id=<id>` — `WORKFLOW.md` missing/unreadable; ticket should be blocked.
- `dispatch_completed dispatched=true reason=<...> issue_id=<id>` — run started and completed one dispatch path.
- `issue_claimed issue_id=<id>` — issue moved to Running and agent run began.
- `run_worktree_created issue_id=<id> run_id=<id> path=<path>` — run branch/worktree created.
- `agent_exited issue_id=<id> exit_code=<n> duration_ms=<n> timed_out=<bool>` — agent process ended.
- `pi_silent_exit issue_id=<id>` — Pi exited 0 with empty output; treated as failure.
- `state_transitioned issue_id=<id> state=done|blocked|in-review` — final Plane state transition.
- `auto_commit_succeeded issue_id=<id> sha=<sha>` — Symphony committed worktree changes.
- `auto_commit_failed issue_id=<id>` — agent made changes, but commit failed.
- `worktree_removed run_id=<id> path=<path>` — cleanup completed; branch remains.

## Known log attribution limitation

Some run lifecycle logs are issue-scoped without binding name. Do not assume a `dispatch_completed` line belongs to the binding being inspected unless correlated by issue ID or Plane project. If multiple bindings are active and ambiguity matters, log attribution is itself a source-improvement finding.

## Common triage paths

### Service down

Evidence:
- `ActiveState` not `active`, or `SubState` not `running`.
- Recent journal contains traceback near startup.

Do:
- Capture `systemctl show` and last 80 journal lines.
- Identify first traceback/config error.
- Hand off to `symphony-restart` only if James wants restart after cause understood.

### Running code stale

Evidence:
- `git log --oneline -1` sha differs from latest `symphony_started code_sha=...`.
- Service otherwise healthy.

Do:
- Tell James running process has old code.
- Hand off to `symphony-restart`.

### Binding stale

Evidence:
- No recent `reconcile_startup_done binding=<name>` after service start.
- Recent `reconcile_startup_failed binding=<name>`.
- Other bindings healthy.

Do:
- Filter by binding.
- Inspect binding entry in `bindings.yml`.
- Check repo path exists and has `WORKFLOW.md`.
- If config/binding issue exists, ask James before edits; `bindings.yml` belongs to scaffold skill.

### Ticket not picked up

Evidence:
- Dispatcher alive with `no-candidates` while James expects one.

Do:
- Confirm target binding/project.
- Check issue state group and labels by safe Plane read if James allows.
- Check `WORKFLOW.md` exists and is not scaffold stub.
- Check mode labels match binding workflow contract.
- If needing proof, hand off to `symphony-binding-smoke`.

### Unexpected no-candidates

Likely causes:
- Ticket is in wrong Plane project.
- Ticket state is not mapped to `state:todo`.
- Ticket has mode label mismatch or missing required mode label.
- Ticket is scheduled for future and not yet eligible.
- Ticket is waiting on approval/review instead of Todo.
- Plane pagination/filtering missed it.

Do:
- Compare issue project/state/labels against `bindings.yml` tracker contract.
- Check schedule fields if present.
- Inspect recent `blocked_reconcile_*` lines for dependency/schedule movement.
- If data contradicts logs, open `diagnose` against `PlaneTrackerAdapter.list_candidates()` and scheduler filtering.

### Workflow missing or stubbed

Evidence:
- `workflow-missing` reason.
- Missing `<repo>/WORKFLOW.md`.
- Stub sentinel: `Describe this repository's Symphony workflow before enabling dispatch.`

Do:
- Stop dispatch debugging. Root cause is workflow readiness.
- Hand off to `symphony-workflow-author`.

### Plane unreachable or auth error

Evidence:
- `plane_poll_failed`, `plane-unreachable`, `Plane authentication failed`.

Do:
- Do not print env.
- Check whether service env exposes non-secret `PLANE_API_URL` / workspace via `systemctl show`.
- Test API only with redacted headers and no verbose curl if James allows safe Plane reads.
- If auth failed, likely `/home/james/symphony-host.env` or Plane key issue; ask James how to proceed.

### Run started but no completion

Evidence:
- `issue_claimed` and `run_worktree_created`, but no `agent_exited` or `state_transitioned` after expected run timeout.

Do:
- Check active process age and journal after claim time.
- Locate worktree path from `run_worktree_created`.
- Check tmux session only if Claude adapter involved.
- Do not kill process/session inside this skill. Ask James and hand off if cleanup needed.

Safe read-only checks:

```bash
ps -ef | grep -E 'pi|claude|symphony' | grep -v grep
TMUX_TMPDIR=${TMUX_TMPDIR:-/tmp} tmux ls 2>/dev/null || true
git -C <bound-repo> worktree list --porcelain
```

### Stale Running or orphan worktree

Evidence:
- Plane issue remains Running after no active agent process.
- Worktree exists without live run.
- Startup logs contain `reconcile_startup_reaped_issue` or `reconcile_startup_reaped_worktree`.

Do:
- Check `reconcile_startup_reaped_issue`, `reconcile_startup_reaped_worktree`, `worktree_removed`, and retained branch name.
- Do not delete worktrees or branches manually.
- If startup reconcile is needed, hand off to `symphony-restart` after sanity.

### Blocked reconciler issue

Evidence:
- Logs contain `blocked_reconcile_*`.
- Ticket moves between Blocked/Todo based on dependencies or schedule.

Do:
- Capture `blocked_reconcile_*` lines.
- Identify dependency chain, schedule gate, or stale blocked issue.
- If Plane state/labels are missing, hand off to `symphony-plane-recover state-fill`.

### Agent adapter mismatch

Evidence:
- Binding `default_agent` differs from expected runner.
- Pi support check fails during runtime build.
- Claude adapter uses tmux but no session appears, or Pi command exits silently.

Do:
- Confirm `default_agent` in `bindings.yml`.
- Check `pi_dispatch`, `agent_exited`, `pi_silent_exit`, and Claude tmux logs.
- Do not switch agents in `bindings.yml` inside this skill.

### Agent blocked/review result

Evidence:
- `state_transitioned state=blocked` or `state=in-review`.
- `dispatch_completed reason=agent-blocked|agent-review|agent-marker-blocked|agent-marker-review|approval-gate|permission-gate`.

Do:
- Fetch or inspect Plane comments only if safe Plane reads are allowed.
- Summarize agent reason.
- Decide with James: unblock ticket, approve/review branch, revise WORKFLOW.md, or open code diagnosis.

### Auto-commit failed

Evidence:
- `auto_commit_failed issue_id=<id> repo=<path> error=<...>`.

Do:
- Inspect worktree/branch status if still present.
- Do not force commit, reset, or delete.
- Preserve branch name and error for future landing.

## Safe Plane read pattern

Only use if James needs issue/comment details and agrees. Never print env values.

```bash
[ -r /home/james/symphony-host.env ] && set -a && . /home/james/symphony-host.env && set +a
if [ -z "$PLANE_API_URL" ] || [ -z "$PLANE_WORKSPACE_SLUG" ]; then
  eval "$(systemctl show symphony-host.service --property=Environment --no-pager \
    | sed 's/^Environment=//' | tr ' ' '\n' \
    | grep -E '^(PLANE_API_URL|PLANE_WORKSPACE_SLUG)=' | sed 's/^/export /')"
fi
: "${PLANE_API_KEY:?missing PLANE_API_KEY}"
: "${PLANE_API_URL:?missing PLANE_API_URL}"
: "${PLANE_WORKSPACE_SLUG:?missing PLANE_WORKSPACE_SLUG}"
: "${PROJECT_ID:?set PROJECT_ID first}"
: "${ISSUE_ID:?set ISSUE_ID first}"
curl -sS -H "X-Api-Key: $PLANE_API_KEY" \
  "$PLANE_API_URL/api/v1/workspaces/$PLANE_WORKSPACE_SLUG/projects/$PROJECT_ID/issues/$ISSUE_ID/" \
  | jq '{id, identifier, name, state, labels, created_at, updated_at}'
```

Optional comment read for blocked/review diagnosis:

```bash
curl -sS -H "X-Api-Key: $PLANE_API_KEY" \
  "$PLANE_API_URL/api/v1/workspaces/$PLANE_WORKSPACE_SLUG/projects/$PROJECT_ID/issues/$ISSUE_ID/comments/" \
  | jq -r '.results[]? | "[\(.created_at)] \(.comment_stripped // .comment_html // "")"'
```

Do not run this with `set -x` or `curl -v`.

## Handoff format for future AI session

End every troubleshooting session with this block when possible:

```text
SYMPHONY_TROUBLESHOOT_HANDOFF
symptom: <what James observed>
time_window: <journal window inspected>
service: <active/substate pid started>
code_sha: disk=<sha> running=<sha-or-unknown>
bindings: <name: status, name: status>
target: binding=<name-or-none> issue_id=<uuid-or-none> identifier=<key-or-none>
key_logs:
  - <timestamp> <short exact log line>
  - <timestamp> <short exact log line>
hypotheses:
  1. <ranked hypothesis> evidence=<...> next_check=<...>
  2. <ranked hypothesis> evidence=<...> next_check=<...>
recommended_next: <wait|symphony-restart|symphony-binding-smoke|symphony-workflow-author|symphony-plane-recover|diagnose|manual Plane review>
safety_boundary: <what was not mutated and what needs James approval>
```
