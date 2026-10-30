---
title: Retired Agent Services on aidev and itan8n
summary: 2026-10-25 genops/RUDR9/Honcho retired; 2026-10-26 opencode/codex off; 2026-10-30 itan8n Hermes stack and qdrant all stopped and deleted.
type: decision
status: promoted
created: 2026-10-25
updated: 2026-10-31
topics: [workstation]
---

## Decision

On 2026-10-25 James decided these stay off. Do not restart or re-enable without asking him.

**aidev**
- Hermes: only the `media` profile gateway (`hermes-gateway-media.service`) runs. No genops or ops-team kanban workers. Five ops-team/kanban jobs in `~/.hermes/cron/jobs.json` are paused, not deleted.
- RUDR9 (separate Hermes, `rud9` alias) deleted everywhere, including the alias in `.zshrc`.
- `litellm-proxy`, `litellm-socat` and `aidev-mcp-http` user services stopped and disabled. OpenCode uses CLIProxyAPI (8317), not LiteLLM.
- Honcho (`~/honcho`, 4 containers) is stopped with restart policy `no`; data kept. The compose file still says `unless-stopped`, so `docker compose up -d` would bring it back on boot.
- `ralph-loop.service` kept (linked, not enabled) for possible future use.
- `opencode-server` (OpenCode on NetBird :4096) stopped and disabled 2026-10-26 at James's request; codex `app-server` helpers killed. Re-enable: `systemctl --user enable --now opencode-server`.

**itan8n**
- RUDR9 gateway and `~/.hermes-rudr9` deleted.
- pm2 `cleon-ui` and `cleon-ui-pi` deleted (crashed on `better-sqlite3` ERR_DLOPEN_FAILED); `pm2 save --force` stored an empty list.
- `paperclip-postgres` stopped, restart policy `no`, data kept.
- `open-terminal.service` (shell API on 0.0.0.0:8001) stopped and disabled; its unit file has since been removed, so `systemctl --user` reports `not-found`.
- Crontab line restarting nonexistent `agent-zero-admin`/`agent-zero-ita` removed; backup `~/crontab.bak-*`.
- `opencode-server` stopped and disabled 2026-10-26, same as aidev; codex `app-server` helpers killed.
- 2026-10-30, James said he no longer uses Hermes much, and chose to stop the whole stack on itan8n. `hermes-gateway.service` (Slack bot, webhook :8644), `itastack-mcp-http.service` (OpenWork MCP HTTP :8765) and `chrome-cdp.service` (shared CDP Chrome :9222) disabled and stopped. Re-enable each with `systemctl --user enable --now <unit>`.
- `openwork-mcp-health-watchdog.timer` disabled and stopped with them. It restarts `itastack-mcp-http.service` when it finds it down, so it must stay off for that service to stay off. It is an ITAStack watchdog, not a Hermes one.
- All 9 Hermes cron jobs in `~/.hermes/cron/jobs.json` paused with `hermes cron pause` (0 active). The OpenWork MCP watchdog job duplicated the timer above.
- itastack Honcho (4 containers, `docker-compose.honcho.yml`) stopped; restart policy `no` on the live containers and in the compose file, which said `unless-stopped` before. Data kept. Backup `docker-compose.honcho.yml.bak-stopped-20261030`.
- `chrome-cdp.service` also served the browser-control skill (3CX console) and the Chrome window on the Sunshine display `:1` (Sunshine captures x11 and was unaffected). It comes back with `systemctl --user enable --now chrome-cdp.service`, not the `chrome-cdp` script, which needs Wayland that itan8n lacks.
- 2026-10-31, qdrant (vector DB, `~/qdrant`) stopped and deleted at James's request. Container, image, volume, network and project dir all gone; ports 6333/6334 free. It held `CMMC lvl2` (1902 points of embedded CMMC Level 2 control text) and `3CX-MAL-Profile` (8 points). The text existed only as vectors, so re-seeding needs the original CMMC document. Compose backup (it held a plaintext API key) at `~/qdrant.bak-deleted-20261031`.
- n8n's compose declared `qdrant_qdrant-network` as external and its container was attached to it. Disconnected live (`docker network disconnect`, no restart), network removed, compose reference dropped. n8n stayed up; backup `~/n8n-compose.yml.bak-noqdrant-20261031`.
- The n8n workflow `CMMC Bot` was active with Qdrant nodes on `CMMC lvl2`. It had **zero** executions ever and no callers, so it was deactivated (not deleted) via the n8n API on 2026-10-31. Orphaned Qdrant credentials remain in n8n, harmless.

## Notes

- Still running on itan8n, awaiting James's decision: Langfuse, `rmm-windows-override`, `cpa-manager-plus`.
- `rmm-windows-override.service` (started 2026-10-25) drives Chrome on CDP :9222 to force the `rmm.myitassurance.com` tab to report a Windows user agent, so the IT Assurance VSA portal sees a Windows browser. It has **never** connected successfully (6993 `Waiting for Chrome CDP: Connection refused`) and logs every 2 seconds, about 1800 lines/hour. It needs `chrome-cdp.service`, stopped 2026-10-30.
- `cpa-manager-plus.service` is a third-party panel (github.com/seakee/CPA-Manager-Plus) for CLIProxyAPI, the LLM proxy the agents use. Dashboard on `0.0.0.0:18317`, reads the proxy at `127.0.0.1:8317`, keeps request/cost history in `~/cpa-manager-plus/data/usage.sqlite` (35 MB).
- It is **not** watch-only. It is a management panel: it holds a CPA management key (`~/cpa-manager-plus/secrets/cpa_management_key`) and proxies the CPA `/v0/management/*` API, so it can change the proxy's providers, credentials, OAuth logins, API keys, plugins and config, and disable or restore auth files. Its DB has `quota_cooldowns` and `account_action_candidates` tables for disabling credentials.
- Its credential-changing automation is currently **off**: startup log reads `[automation] runtime settings loaded quotaCooldown=false accountActions=false accountActionsAutoDisable=false`, and both tables hold 0 rows.
- Reachable over the tailnet and used that way: on 2026-10-14 the peer `omarchy-55-243` (100.95.55.243) called `/v0/management/*` through it, including `DELETE /v0/management/auth-files` twice (HTTP 200). The CPA's own `remote-management` has `allow-remote: false`, so the panel on 18317 is the reachable path.
- The stored `cpa_management_key` no longer matches the CPA `secret-key` in `cliproxyapi/config.yaml` (bcrypt), so its management calls now fail. The CPA bans the source IP after repeated failures, so a wrong key locks out management for minutes.
