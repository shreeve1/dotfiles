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
- 2026-10-31, qdrant (vector DB, `~/qdrant`) stopped and deleted at James's request. Container, image, volume, network and project dir all gone; ports 6333/6334 free. It held two collections: `CMMC lvl2` (1902 points of embedded CMMC Level 2 control text) and `3CX-MAL-Profile` (8 points). The embedded text was not recoverable from any file on the host — only the vectors existed — so re-seeding needs the original CMMC source document. Backup of the compose file (which held a plaintext API key) at `~/qdrant.bak-deleted-20261031`.
- n8n's `docker-compose.yml` declared `qdrant_qdrant-network` as an external network, and the running `n8n-n8n-1` container was attached to it. The container was disconnected live (`docker network disconnect`, no restart) and the network removed, then the compose file edited to drop the reference. n8n stayed up throughout; backup `~/n8n-compose.yml.bak-noqdrant-20261031`.
- The n8n workflow `CMMC Bot` was active with two Qdrant vector-store nodes on the `CMMC lvl2` collection. It had **zero** executions ever and nothing on the host called its webhooks, so it was deactivated (not deleted) via the n8n API on 2026-10-31. The three orphaned Qdrant credentials remain in n8n and are harmless.

## Notes

- Still not reviewed with James: Langfuse, `rmm-windows-override`, `cpa-manager-plus` (all still running on itan8n).
- `rmm-windows-override.service` (started 2026-10-25) drives Chrome on CDP :9222 to force the `rmm.myitassurance.com` tab to report a Windows user agent, so the IT Assurance VSA portal sees a Windows browser. It has never once connected successfully — 6993 `Waiting for Chrome CDP: Connection refused` log lines and no success — and it logs every 2 seconds, about 1800 lines/hour. It depends on `chrome-cdp.service`, which was stopped on 2026-10-30, so it can only work again if that service comes back.
- `cpa-manager-plus.service` is a third-party panel (github.com/seakee/CPA-Manager-Plus) for CLIProxyAPI, the LLM proxy the agents use. It serves a dashboard on `0.0.0.0:18317`, reads the proxy at `127.0.0.1:8317`, and keeps request/cost history in `~/cpa-manager-plus/data/usage.sqlite` (35 MB).
- It is **not** watch-only. It is a management panel: it holds a CPA management key (`~/cpa-manager-plus/secrets/cpa_management_key`) and proxies the CPA `/v0/management/*` API, so it can read and change the proxy's providers, credentials, OAuth logins, API keys, plugins and config, and disable or restore auth files. Its own DB has `quota_cooldowns` (with `pre_disabled_state`/`disabled_at_ms`) and `account_action_candidates` (with `auto_disable_eligible`) for disabling credentials.
- Its credential-changing automation is currently **off**: the startup log reads `[automation] runtime settings loaded quotaCooldown=false accountActions=false accountActionsAutoDisable=false`, and both tables hold 0 rows.
- The panel is reachable over the tailnet and has been used that way. On 2026-10-14 the peer `omarchy-55-243` (100.95.55.243) called `/v0/management/*` through it, including `DELETE /v0/management/auth-files` twice (HTTP 200). The CPA `remote-management` block has `allow-remote: false`, so the CPA itself refuses non-localhost management calls; the panel on port 18317 is the reachable path.
- The stored `cpa_management_key` no longer matches the CPA's `secret-key` in `/home/itadmin/cliproxyapi/config.yaml` (a bcrypt `$2a$10$` hash; `crypt(panel_key)` does not equal it), so the panel's management calls currently fail. The CPA bans the source IP after repeated failures, so a wrong key can lock out management from that IP for several minutes.
