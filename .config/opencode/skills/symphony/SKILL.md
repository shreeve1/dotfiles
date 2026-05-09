---
name: symphony
description: Troubleshoot and safely modify the Plane-backed Symphony automation service. Use when diagnosing Symphony polling, Plane ticket pickup, Windmill ticket creation, systemd health, OpenCode agent dispatch, Plane state transitions, or changing files under /home/james/plane/symphony or related homelab integration.
---

# Symphony

Use this skill for future Symphony troubleshooting or modification sessions. Symphony is a live automation path: Windmill creates Plane Todo tickets, the `symphony-host.service` systemd service polls Plane, claims eligible tickets, runs OpenCode against `/home/james/homelab`, and updates Plane states/comments.

## Safety Gate

Start by classifying the request.

- Read-only diagnostics are allowed without approval.
- Code edits are allowed after reading the relevant files first.
- Live mutations require explicit James approval before execution.
- Secret values must never be printed, copied, committed, or summarized.
- Do not edit `.env` files unless James explicitly asks.
- Stop if Symphony is in a restart loop, Plane API mutations are ambiguous, or the homelab worktree is unexpectedly dirty.

Live mutations include `systemctl start`, `restart`, `stop`, `enable`, `disable`, direct Plane `PATCH`/`POST`, Windmill job execution, smoke ticket requeueing, unit-file edits, daemon reloads, and environment-file edits.

## Component Map

Primary Symphony repo: `/home/james/plane/symphony`.

- `config.py`: loads `PLANE_API_URL`, `PLANE_API_KEY`, `PLANE_WORKSPACE_SLUG`, `PLANE_PROJECT_ID`, `HOMELAB_REPO_PATH`, `OPENCODE_BIN`, optional `SYMPHONY_OPENCODE_AGENT`/`SYMPHONY_OPENCODE_MODEL`, poll/run timeouts, and `/tmp/symphony.lock`; repr redacts the key.
- `plane_poller.py`: polls Plane Todo issues, caps pagination at `MAX_PAGES_PER_TICK = 3`, uses `X-API-Key`, follows redirects, appends trailing slash for writes, and builds a configured `PlaneAdapter`.
- `scheduler.py`: locks each tick, reconciles stale Running tickets, refuses dirty homelab worktrees, claims Todo issues, runs agents, transitions Done/In Review/Blocked, and logs `tick_completed`.
- `agent_runner.py`: verifies `opencode run --agent`, injects `plane_cli.py` as `plane`, sets `SYMPHONY_*` environment variables, and runs OpenCode in `/home/james/homelab`; when `SYMPHONY_OPENCODE_MODEL` is set, it passes `--model` explicitly to avoid OpenCode state leakage.
- `plane_cli.py`: helper available to dispatched agents as `plane done`, `plane review`, `plane blocked`, and `plane comment`; uses `X-API-Key` and trailing slash Plane paths.
- `main.py`: service entrypoint; wires config, HTTP transport, configured Plane adapter, agent runner, prompt renderer, and scheduler loop.
- The active deployment is the `symphony-host.service` systemd unit; there is no Docker image or compose entry for Symphony.

Related homelab repo: `/home/james/homelab`.

- `automation/homelab-stack/src/homelab_router/plane_adapter.py`: shared Plane adapter and transport contract.
- `automation/homelab-stack/src/homelab_router/plane_contract.py`: Plane project UUID and state UUIDs.
- `automation/homelab-stack/deploy/windmill/create_plane_ticket.py`: self-contained Windmill script that creates/updates Plane Todo tickets by stable external ID.
- `automation/homelab-stack/src/homelab_router/prompt_renderer.py`: renders Plane issue content into the OpenCode agent prompt using `/home/james/homelab/WORKFLOW.md`.

Live systemd service: `symphony-host.service`.

- Unit file: `/etc/systemd/system/symphony-host.service`.
- Working directory: `/home/james/plane/symphony`.
- Runtime user/group: `james:james`.
- Environment file: `/home/james/plane/symphony-host.env`; inspect variable names or booleans only, not secret values.
- Key unit environment: `HOME=/home/james`, `PYTHONPATH=/home/james/plane/symphony:/home/james/homelab/automation/homelab-stack/src`, `HOMELAB_REPO_PATH=/home/james/homelab`, `OPENCODE_BIN=/home/james/.opencode/bin/opencode`, `SYMPHONY_LOCK_PATH=/run/symphony/symphony.lock`, `SYMPHONY_OPENCODE_AGENT=build`, optional `SYMPHONY_OPENCODE_MODEL=zai-coding-plan/glm-5.1`, `PLANE_API_URL=http://127.0.0.1:8000`, `PLANE_WORKSPACE_SLUG=homelab`, and `PLANE_PROJECT_ID=cff68c17-bff6-452f-89b3-9b570613cfaa`.
- Runtime directory: `/run/symphony` with lock path `/run/symphony/symphony.lock`.

## Diagnostic Workflow

Use read-only checks first.

```bash
# Systemd service health
systemctl status symphony-host.service --no-pager
systemctl show symphony-host.service --property=ActiveState,SubState,ExecMainPID,RestartUSec,NRestarts
journalctl -u symphony-host.service --since='5 minutes ago' --no-pager

# Run from /home/james/plane/symphony
git status --porcelain

# Run from /home/james/homelab
git status --porcelain
```

Use the correct working directory for each command. A clean `git status` from
`/home/james` does not verify either Symphony or homelab repo state.

Check environment safely by listing variable names or booleans only. Do not print values from `/home/james/homelab/.env`, `/home/james/plane/symphony-host.env`, Windmill variables, or Plane API keys.

Healthy baseline evidence looks like this:

- `symphony-host.service` is `active (running)`.
- Logs show Plane GETs returning `200 OK` after redirects.
- Logs show `plane_poll_page_limit_reached pages=3 candidates=0` or candidates found.
- Logs show `tick_completed dispatched=false reason=no-candidates issue_id=` when idle.
- `/home/james/homelab` is clean before dispatch.

## Failure Signatures

Use these known fixes before inventing new approaches.

- Missing env: `Missing required environment variables` means the systemd unit or `/home/james/plane/symphony-host.env` cannot see required var names; inspect names only.
- `301 Moved Permanently`: use trailing slash for Plane write paths and `follow_redirects=True` for read transport.
- `401 Unauthorized`: Plane local API expects `X-API-Key`, not `Authorization: Bearer`.
- `404 Not Found`: check project ID; live Symphony uses UUID `cff68c17-bff6-452f-89b3-9b570613cfaa`, not slug-like values.
- `429 Too Many Requests`: keep pagination capped with `MAX_PAGES_PER_TICK` or add narrower filtering.
- `No such file or directory: git`: host service PATH or unit environment cannot find `git`; scheduler checks homelab dirtiness.
- `worktree_dirty` with stale lock: lock path is `/run/symphony/symphony.lock` (set via `SYMPHONY_LOCK_PATH`); if the file persists after a crash, remove it manually and restart.
- `worktree_dirty` with `/run/symphony/symphony.lock`: lock cleanup or runtime-directory permissions may be wrong; verify the lock is not inside `/home/james/homelab`.
- `status=217/USER` or `status=203/EXEC`: systemd cannot resolve the configured user or `ExecStart`; inspect `systemctl status` and `systemctl cat`.
- Rapid restart loop: stop and ask James before further live actions; review `journalctl -u symphony-host.service` first.
- `NotImplementedError` on `post` or `patch`: live transport must implement Plane writes.
- Smoke ticket stuck Running: scheduler or injected `plane` helper may not transition terminal states.
- Missing Plane comments: ensure POST paths include trailing slash before request.
- Invalid label UUID: omit arbitrary label strings unless using real Plane label UUIDs.
- OpenCode dispatch failure: verify `opencode run --agent` is supported by the mounted binary.
- Dirty homelab after agent: Symphony should transition In Review and comment a diff stat.

## Modification Workflow

Read the file you will edit and the closest tests before patching.

- For Symphony code changes, edit only `/home/james/plane/symphony` and add or update tests there.
- For Windmill ticket creation changes, edit `automation/homelab-stack/deploy/windmill/create_plane_ticket.py` and its tests.
- For Plane adapter/contract changes, inspect impact in both Symphony and homelab tests.
- For `symphony-host.service` or `/home/james/plane/symphony-host.env`, remember they are live host configuration outside the Symphony git repo; ask James before editing and record the on-disk caveat in the final report.
- Keep changes surgical; do not restructure modules or delete components as a fix.

Verification commands:

```bash
python3 -m pytest
git diff --check
python3 -m py_compile *.py
systemctl cat symphony-host.service
```

Run `python3 -m pytest` from `/home/james/plane/symphony` for Symphony changes. If homelab integration changed, run `uv run pytest tests/test_windmill_create_plane_ticket.py` or full `uv run pytest` from `/home/james/homelab/automation/homelab-stack`.

Do not run `systemctl daemon-reload` or restart the service unless James explicitly approves the live mutation.

## Live Restart And Smoke

Ask James before restarting or requeueing tickets. After approval:

```bash
systemctl restart symphony-host.service
systemctl status symphony-host.service --no-pager
systemctl show symphony-host.service --property=ActiveState,SubState,ExecMainPID,NRestarts
journalctl -u symphony-host.service --since='2 minutes ago' --no-pager
```

For a live smoke, use a read-only Todo ticket with a stable external ID. Verify all of these before declaring success:

- The ticket appears as Todo before dispatch.
- Logs show `issue_claimed` and `agent_started`.
- Logs show agent exit code and `tick_completed dispatched=true`.
- The Plane issue reaches Done, In Review, or Blocked intentionally.
- Claim and terminal summary comments exist when expected.
- `/home/james/homelab` remains clean for read-only smoke.
- `symphony-host.service` remains active after the run.

Stop the service if it enters a crash loop or starts repeatedly failing live API calls.

## Git Boundaries

There are two git repos and live host configuration outside git.

- Commit Symphony source changes in `/home/james/plane/symphony` only when James explicitly asks in the current session.
- Commit homelab integration and kanban changes in `/home/james/homelab` separately.
- Do not initialize git in `/home/james/plane` or `/etc/systemd/system`.
- Do not commit `.env` files or secret-bearing files.
- Before any commit, run `git status --porcelain` and inspect `git diff` for secrets and unrelated files.

## Report

End with concise evidence:

- Service health and latest relevant log signal.
- Files changed by repo.
- Tests and systemd checks run with pass/fail output.
- Live actions taken, if any, and whether James approved them.
- Plane issue state/comment evidence for smoke runs.
- Worktree cleanliness for `/home/james/plane/symphony` and `/home/james/homelab`.
- Any non-git `symphony-host.service` or `/home/james/plane/symphony-host.env` changes that remain on disk.
