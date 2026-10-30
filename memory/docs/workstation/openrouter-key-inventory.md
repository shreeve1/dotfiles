---
title: OpenRouter Key Inventory Across Machines
summary: Where OpenRouter keys sit on wrk, aidev and itan8n, which apps consume them, which one leaked into git history, and which hosts are clean or offline.
type: doc
status: promoted
created: 2026-10-30
updated: 2026-10-30
topics: [workstation]
---

## Active memory

- Inventory taken 2026-10-30 by searching every reachable host for the literal key prefix. Five distinct keys exist; no value is stored here. "itan8n" is the alias for the box whose hostname is n8n.
- The `main` key (73 chars, sha `75280a04ed`) is DEAD — OpenRouter returns 401 "User not found" (confirmed 2026-10-30); its export was removed from itan8n `~/.zshrc.secrets` that day. Remaining copies: itan8n `~/.claude/litellm-env` (deletion underway by the cleanup session), `~/.hermes/.env`, `~/cliproxyapi/config.yaml` backups, `~/.dsh/.credentials.yaml`, `dotfiles/.pi/agent/auth.json`; aidev `dotfiles/.pi/agent/auth.json`, `~/.hermes/.env` plus six hermes profiles (genops, netops, projectlean, responder, secops, storageops), `/etc/homelab-stack/langgraph.env` (root-owned), `pi-rmm/.secrets/openrouter.key`, `~/.dsh/.credentials.yaml`; wrk WSL `~/pi-durable/.env` only.
- The `proxy` key (sha `9d297bc8ac`) is the one live OpenRouter credential behind cliproxy: aidev's live `~/cliproxyapi/config.yaml` openrouter provider block, and since 2026-10-30 itan8n's too, via `OPENROUTER_PROXY_API_KEY` in `~/.zshrc.secrets` that the launcher substitutes (wired after the dead `main` key broke deepseek-v4.1-flash with 503 auth_unavailable / upstream 401). Every backup config on aidev and itan8n still holds the `main` key, so restoring a backup swaps the live key.
- itan8n `~/.claude/litellm-env` holds four OpenRouter key variables (main plus daily, medium, high) covering three distinct keys; `~/.claude/litellm-config.yaml` maps Claude Code tiers to `openai/openrouter/auto`, one key per tier.
- Liveness checked 2026-10-30: `main` 401 dead; `proxy`, `medium` (`d4babaca1b`) and `high` (`a804d7c7ad`) all validate 200. Everything still pointed at `main` (temporal worker, wrk pi-durable, pi's own openrouter provider, hermes fallbacks) fails silently until repointed or replaced.
- A retired key is still in `dotfiles/.pi/agent/auth.json.bak-cponly-20261015` on aidev and itan8n, and it was committed to the dotfiles repo as `archive/claude/settings-openrouter.json` (commits b11face0, 070f0fca), both in origin/main. It sat in the public GitHub history and is confirmed dead: the key returns 401 "User not found" at the OpenRouter API (checked 2026-10-30). The copies on those two hosts are still on disk.
- Consumers: the cliproxy `openrouter` provider block on aidev and itan8n (both on the `proxy` key since 2026-10-30); pi's openrouter provider on aidev and itan8n (wrk's pi has no openrouter credential and uses cliproxy); the Jev classifier via `OPENROUTER_API_KEY` (pi-durable on wrk); hermes agent profiles on aidev; the itastack temporal worker container on itan8n; Claude Code via litellm on itan8n.
- aidev's cliproxy journal showed five OpenRouter 401s in the week to 2026-10-30 (dead-`main`-key era); as of 2026-10-30 aidev's live `proxy` key validates 200 and its deepseek-v4.1-flash route works.
- Transcript leaks: keys appear in pi session files, `.omp` sessions, `.pi-subagents` artifacts and `paperclips` on wrk, aidev and itan8n, and on wrk also in `~/.pi-lens/latency.log` and `dotfiles/.pi/agent/fabric/entropy/observation-pool.json`.
- Clean or unverified: the homelab hosts (jellyfin, sonarr, radarr, prowlarr, qbittorrent, pve1, pve4) hold no OpenRouter key and set no OPENROUTER env, and n8n's own credentials hold none. wrk's Windows side, scanned through `/mnt/c`, holds none. surftop (100.95.222.42) was unreachable from wrk and aidev, so it is unverified; wrk's Windows sshd on port 22 refused the connection.

## Related

- [Adding a CLIProxy Model to the pi Fleet](memory/docs/workstation/pi-cliproxy-model-fleet.md) - the proxy's openrouter provider block and itan8n's config template plus launcher are where these keys are read.
- [Public GitHub Secret Exposure in dotfiles](memory/docs/projects/public-repo-secret-exposure.md) - the full leak scan: which credentials went public, which are still live, and the commits that carried them.
