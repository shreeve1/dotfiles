---
name: symphony
description: Troubleshoot and safely modify the Plane-backed Symphony automation service. Use when diagnosing Symphony polling, Plane ticket pickup, Windmill ticket creation, Docker health, OpenCode agent dispatch, Plane state transitions, or changing files under /home/james/plane/symphony or related homelab integration.
---

# Symphony

Use this skill for future Symphony troubleshooting or modification sessions. Symphony is a live automation path: Windmill creates Plane Todo tickets, the `plane-symphony-1` Docker service polls Plane, claims eligible tickets, runs OpenCode against `/home/james/homelab`, and updates Plane states/comments.

## Safety Gate

Start by classifying the request.

- Read-only diagnostics are allowed without approval.
- Code edits are allowed after reading the relevant files first.
- Live mutations require explicit James approval before execution.
- Secret values must never be printed, copied, committed, or summarized.
- Do not edit `.env` files unless James explicitly asks.
- Stop if Symphony is in a restart loop, Plane API mutations are ambiguous, or the homelab worktree is unexpectedly dirty.

Live mutations include `docker compose up`, `restart`, `stop`, direct Plane `PATCH`/`POST`, Windmill job execution, smoke ticket requeueing, container deletion, and environment-file edits.

## Component Map

Primary Symphony repo: `/home/james/plane/symphony`.

- `config.py`: loads `PLANE_API_URL`, `PLANE_API_KEY`, `PLANE_WORKSPACE_SLUG`, `PLANE_PROJECT_ID`, `HOMELAB_REPO_PATH`, `OPENCODE_BIN`, poll/run timeouts, and `/tmp/symphony.lock`; repr redacts the key.
- `plane_poller.py`: polls Plane Todo issues, caps pagination at `MAX_PAGES_PER_TICK = 3`, uses `X-API-Key`, follows redirects, appends trailing slash for writes, and builds a configured `PlaneAdapter`.
- `scheduler.py`: locks each tick, reconciles stale Running tickets, refuses dirty homelab worktrees, claims Todo issues, runs agents, transitions Done/In Review/Blocked, and logs `tick_completed`.
- `agent_runner.py`: verifies `opencode run --agent`, injects `plane_cli.py` as `plane`, sets `SYMPHONY_*` environment variables, and runs OpenCode in `/home/james/homelab`.
- `plane_cli.py`: helper available to dispatched agents as `plane done`, `plane review`, `plane blocked`, and `plane comment`; uses `X-API-Key` and trailing slash Plane paths.
- `main.py`: container entrypoint; wires config, HTTP transport, configured Plane adapter, agent runner, prompt renderer, and scheduler loop.
- `Dockerfile`: Python 3.12 slim image, installs `git`, runs non-root UID/GID `1001`, uses `PYTHONPATH=/app/symphony:/home/james/homelab/automation/homelab-stack/src`, and healthchecks the Plane project issues endpoint plus OpenCode binary.

Related homelab repo: `/home/james/homelab`.

- `automation/homelab-stack/src/homelab_router/plane_adapter.py`: shared Plane adapter and transport contract.
- `automation/homelab-stack/src/homelab_router/plane_contract.py`: Plane project UUID and state UUIDs.
- `automation/homelab-stack/deploy/windmill/create_plane_ticket.py`: self-contained Windmill script that creates/updates Plane Todo tickets by stable external ID.
- `automation/homelab-stack/src/homelab_router/prompt_renderer.py`: renders Plane issue content into the OpenCode agent prompt using `/home/james/homelab/WORKFLOW.md`.

Live compose root: `/home/james/plane`.

- `/home/james/plane/docker-compose.yml` is not inside a git repo.
- The `symphony` service uses host networking, builds `./symphony`, mounts `/home/james/homelab` read-write, mounts OpenCode paths read-only, reads `variables.env` and `/home/james/homelab/.env`, and overrides `PLANE_PROJECT_ID` to UUID `cff68c17-bff6-452f-89b3-9b570613cfaa` unless the shell supplies another value.

## Diagnostic Workflow

Use read-only checks first.

```bash
# Run from /home/james/plane
docker compose ps symphony
docker inspect --format='{{.State.Health.Status}}' plane-symphony-1
docker compose logs --since=5m symphony

# Run from /home/james/plane/symphony
git status --porcelain

# Run from /home/james/homelab
git status --porcelain
```

Use the correct working directory for each command. A clean `git status` from
`/home/james` does not verify either Symphony or homelab repo state.

Check environment safely by listing variable names or booleans only. Do not print values from `/home/james/homelab/.env`, `/home/james/plane/variables.env`, Windmill variables, or Plane API keys.

Healthy baseline evidence looks like this:

- `plane-symphony-1` is `Up` and `healthy`.
- Logs show Plane GETs returning `200 OK` after redirects.
- Logs show `plane_poll_page_limit_reached pages=3 candidates=0` or candidates found.
- Logs show `tick_completed dispatched=false reason=no-candidates issue_id=` when idle.
- `/home/james/homelab` is clean before dispatch.

## Failure Signatures

Use these known fixes before inventing new approaches.

- Missing env: `Missing required environment variables` means the compose service cannot see required var names; inspect names only.
- `301 Moved Permanently`: use trailing slash for Plane write paths and `follow_redirects=True` for read transport.
- `401 Unauthorized`: Plane local API expects `X-API-Key`, not `Authorization: Bearer`.
- `404 Not Found`: check project ID; live Symphony uses UUID `cff68c17-bff6-452f-89b3-9b570613cfaa`, not slug-like values.
- `429 Too Many Requests`: keep pagination capped with `MAX_PAGES_PER_TICK` or add narrower filtering.
- `No such file or directory: git`: Docker image must install `git` because scheduler checks homelab dirtiness.
- `worktree_dirty` with `.symphony.lock`: lock path should be `/tmp/symphony.lock`, not inside `/home/james/homelab`.
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
- For `docker-compose.yml`, remember the file is non-git; record the on-disk caveat in the final report.
- Keep changes surgical; do not restructure modules or delete components as a fix.

Verification commands:

```bash
python3 -m pytest
git diff --check
docker compose config --quiet
docker compose build symphony
```

Run `python3 -m pytest` from `/home/james/plane/symphony` for Symphony changes. If homelab integration changed, run `uv run pytest tests/test_windmill_create_plane_ticket.py` or full `uv run pytest` from `/home/james/homelab/automation/homelab-stack`.

Docker image export can hit transient containerd locks. Retry `docker compose build symphony` once before treating it as a code failure.

## Live Restart And Smoke

Ask James before restarting or requeueing tickets. After approval:

```bash
docker compose up -d symphony
docker compose ps symphony
docker inspect --format='{{.State.Health.Status}}' plane-symphony-1
docker compose logs --since=2m symphony
```

For a live smoke, use a read-only Todo ticket with a stable external ID. Verify all of these before declaring success:

- The ticket appears as Todo before dispatch.
- Logs show `issue_claimed` and `agent_started`.
- Logs show agent exit code and `tick_completed dispatched=true`.
- The Plane issue reaches Done, In Review, or Blocked intentionally.
- Claim and terminal summary comments exist when expected.
- `/home/james/homelab` remains clean for read-only smoke.
- `plane-symphony-1` remains healthy after the run.

Stop the service if it enters a crash loop or starts repeatedly failing live API calls.

## Git Boundaries

There are two git repos and one non-git live directory.

- Commit Symphony source changes in `/home/james/plane/symphony` only when James explicitly asks in the current session.
- Commit homelab integration and kanban changes in `/home/james/homelab` separately.
- Do not initialize git in `/home/james/plane`.
- Do not commit `.env` files or secret-bearing files.
- Before any commit, run `git status --porcelain` and inspect `git diff` for secrets and unrelated files.

## Report

End with concise evidence:

- Service health and latest relevant log signal.
- Files changed by repo.
- Tests and Docker checks run with pass/fail output.
- Live actions taken, if any, and whether James approved them.
- Plane issue state/comment evidence for smoke runs.
- Worktree cleanliness for `/home/james/plane/symphony` and `/home/james/homelab`.
- Any non-git `/home/james/plane/docker-compose.yml` changes that remain on disk.
