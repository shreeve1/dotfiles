---
title: Retired Agent Services on aidev and itan8n
summary: 2026-10-25 genops/RUDR9/Honcho retired; 2026-10-26 opencode/codex off; 2026-10-30 itan8n Hermes gateway, MCP HTTP, Chrome, cron and Honcho all stopped.
type: decision
status: promoted
created: 2026-10-25
updated: 2026-10-30
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
- `opencode-server` (OpenCode on NetBird :4096) stopped and disabled 2026-10-26 at James's request; codex `app-server` helpers killed. Re-enable: `systemctl --user enable --now opencode-server`.

**itan8n**
- RUDR9 gateway and `~/.hermes-rudr9` deleted.
- pm2 `cleon-ui` and `cleon-ui-pi` deleted (crashed on `better-sqlite3` ERR_DLOPEN_FAILED); `pm2 save --force` stored the empty list.
- `paperclip-postgres` stopped, restart policy `no`, data kept.
- `open-terminal.service` (shell API on 0.0.0.0:8001) stopped and disabled; its unit file has since been removed, so `systemctl --user` reports `not-found`.
- Crontab line restarting nonexistent `agent-zero-admin`/`agent-zero-ita` removed; backup at `~/crontab.bak-*`.
- `opencode-server` stopped and disabled 2026-10-26 at James's request; codex `app-server` helpers killed. Re-enable: `systemctl --user enable --now opencode-server`.
- 2026-10-30, James said he no longer uses Hermes much, and chose to stop the whole stack on itan8n. Default `hermes-gateway.service` (Slack bot, webhook :8644) disabled and stopped; `itastack-mcp-http.service` (OpenWork MCP HTTP :8765) disabled and stopped; `chrome-cdp.service` (shared CDP Chrome :9222) disabled and stopped. Re-enable each with `systemctl --user enable --now <unit>`.
- `openwork-mcp-health-watchdog.timer` disabled and stopped with them — it restarts `itastack-mcp-http.service` whenever it finds it down, so it must stay off for that service to stay off. It is an ITAStack watchdog, not a Hermes one.
- All 9 Hermes cron jobs in `~/.hermes/cron/jobs.json` paused with `hermes cron pause` (0 active). The OpenWork MCP watchdog job duplicated the systemd timer above.
- itastack Honcho (4 containers, `docker-compose.honcho.yml`) stopped; restart policy `no` on the live containers and in the compose file, which said `unless-stopped` before. Data kept. Backup `docker-compose.honcho.yml.bak-stopped-20261030`.
- `chrome-cdp.service` also served the browser-control skill (3CX console) and the Chrome window on the Sunshine display `:1`. Sunshine itself captures x11 and was unaffected. The browser comes back with `systemctl --user enable --now chrome-cdp.service`, not the `chrome-cdp` script, which needs Wayland that itan8n does not have.

## Notes

- Still not reviewed with James: Langfuse, qdrant, `rmm-windows-override`, `cpa-manager-plus` (all still running on itan8n).
