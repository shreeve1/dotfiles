---
title: Retired Agent Services on aidev and itan8n
summary: 2026-10-25 James retired genops/ops-team Hermes, RUDR9, LiteLLM, aidev-mcp, Honcho and stale itan8n services; on aidev only the media Hermes profile runs.
type: decision
status: promoted
created: 2026-10-25
updated: 2026-10-25
topics: [workstation]
---

## Decision

On 2026-10-25 James decided these stay off. Do not restart or re-enable them without asking.

**aidev**
- Hermes: only the `media` profile gateway (`hermes-gateway-media.service`) runs. No genops or ops-team kanban workers. Five ops-team/kanban jobs in `~/.hermes/cron/jobs.json` are paused (`hermes cron pause`), not deleted.
- RUDR9 (separate Hermes, `rud9` alias) is deleted everywhere, including the alias in `.zshrc`.
- `litellm-proxy`, `litellm-socat` and `aidev-mcp-http` user services are stopped and disabled. OpenCode uses CLIProxyAPI (8317), not LiteLLM.
- Honcho (`~/honcho`, 4 containers) is stopped with restart policy `no`; data kept. The compose file still says `unless-stopped`, so `docker compose up -d` would bring it back on boot.
- `ralph-loop.service` is kept (linked, not enabled) for possible future use.

**itan8n**
- RUDR9 gateway and `~/.hermes-rudr9` deleted.
- pm2 `cleon-ui` and `cleon-ui-pi` deleted (crashed on `better-sqlite3` ERR_DLOPEN_FAILED); `pm2 save --force` stored the empty list.
- `paperclip-postgres` stopped, restart policy `no`, data kept.
- `open-terminal.service` (shell API on 0.0.0.0:8001) stopped and disabled.
- Crontab line restarting nonexistent `agent-zero-admin`/`agent-zero-ita` removed; backup at `~/crontab.bak-*`.

## Notes

- Not yet reviewed with James: itan8n default `hermes-gateway`, Langfuse, qdrant, itastack Honcho, `rmm-windows-override`, `cpa-manager-plus`.
