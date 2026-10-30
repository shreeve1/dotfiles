---
title: OpenRouter Key Inventory Across Machines
summary: Where OpenRouter keys sit on wrk, aidev and itan8n, which apps consume them, which one leaked into git history, and which hosts are clean or offline.
type: doc
status: promoted
created: 2026-10-30
updated: 2026-10-30
topics: []
---

## Active memory

- Inventory taken 2026-10-30 by searching every reachable host for the literal key prefix. Five distinct keys exist; no value is stored here. "itan8n" is the alias for the box whose hostname is n8n.
- The `main` key (73 chars) is shared: itan8n `~/.zshrc.secrets` (exported, so every shell, pi, the MCP servers and the temporal worker inherit it), `~/.claude/litellm-env`, `~/.hermes/.env`, `~/cliproxyapi/config.yaml` backups, `~/.dsh/.credentials.yaml`, `dotfiles/.pi/agent/auth.json`; aidev `dotfiles/.pi/agent/auth.json`, `~/.hermes/.env` plus six hermes profiles (genops, netops, projectlean, responder, secops, storageops), `/etc/homelab-stack/langgraph.env` (root-owned), `pi-rmm/.secrets/openrouter.key`, `~/.dsh/.credentials.yaml`; wrk WSL `~/pi-durable/.env` only.
- A different key sits in aidev's live `~/cliproxyapi/config.yaml` openrouter provider block; every backup config on aidev and itan8n holds the `main` key instead, so restoring a backup swaps the live key.
- itan8n `~/.claude/litellm-env` holds four OpenRouter key variables (main plus daily, medium, high) covering three distinct keys; `~/.claude/litellm-config.yaml` maps Claude Code tiers to `openai/openrouter/auto`, one key per tier.
- A retired key is still in `dotfiles/.pi/agent/auth.json.bak-cponly-20261015` on aidev and itan8n, and it was committed to the dotfiles repo as `archive/claude/settings-openrouter.json` (commits b11face0, 070f0fca), both in origin/main. It is exposed in GitHub history and should be revoked.
- Consumers: the cliproxy `openrouter` provider block on aidev and itan8n; pi's openrouter provider on aidev and itan8n (wrk's pi has no openrouter credential and uses cliproxy); the Jev classifier via `OPENROUTER_API_KEY` (pi-durable on wrk); hermes agent profiles on aidev; the itastack temporal worker container on itan8n; Claude Code via litellm on itan8n.
- aidev's cliproxy journal shows OpenRouter requests answering 401 (five in the week to 2026-10-30), so that route is live but the key is not working.
- Transcript leaks: keys appear in pi session files, `.omp` sessions, `.pi-subagents` artifacts and `paperclips` on wrk, aidev and itan8n, and on wrk also in `~/.pi-lens/latency.log` and `dotfiles/.pi/agent/fabric/entropy/observation-pool.json`.
- Clean or unverified: the homelab hosts (jellyfin, sonarr, radarr, prowlarr, qbittorrent, pve1, pve4) hold no OpenRouter key and set no OPENROUTER env, and n8n's own credentials hold none. wrk's Windows side, scanned through `/mnt/c`, holds none. surftop (100.95.222.42) was unreachable from wrk and aidev, so it is unverified; wrk's Windows sshd on port 22 refused the connection.

## Related

- [Adding a CLIProxy Model to the pi Fleet](memory/docs/pi-cliproxy-model-fleet.md) - the proxy's openrouter provider block and itan8n's config template plus launcher are where these keys are read.
