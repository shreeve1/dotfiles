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

- Inventory taken 2026-10-30 by searching every reachable host for the literal key prefix, then re-checked after the credential cleanup the same day. Five distinct OpenRouter keys existed; no value is stored here. "itan8n" is the alias for the box whose hostname is n8n.
- The `main` key (73 chars, sha `75280a04ed`) is DEAD — OpenRouter returns 401 "User not found" (confirmed 2026-10-30). Its export left itan8n `~/.zshrc.secrets` that day, and the cleanup session deleted every other copy: itan8n and aidev `dotfiles/.pi/agent/auth.json` entries, both hermes `.env` sets, itan8n `~/.claude/litellm-env`, the aidev cliproxy backups, `~/.dsh/.credentials.yaml`, aidev `/etc/homelab-stack/langgraph.env`, `~/pi-rmm`, and the `~/.zshrc.secrets.bak-*` copies. The only copies left are the Jev reads in wrk and aidev `~/pi-durable/.env`.
- The `proxy` key (sha `9d297bc8ac`) is the one live OpenRouter credential behind cliproxy: aidev's live `~/cliproxyapi/config.yaml` openrouter provider block, and itan8n's too since 2026-10-30 via `OPENROUTER_PROXY_API_KEY` in `~/.zshrc.secrets` that the launcher substitutes. Two aidev backups still hold it (`config.yaml.bak-claude-code-haiku-*`, `config.yaml.bak-deepseek-v41-only-*`); the seven backups that held the dead key are deleted, so restoring a backup no longer swaps the live key.
- The `medium` (sha `d4babaca1b`) and `high` (sha `a804d7c7ad`) keys lived only in itan8n `~/.claude/litellm-env`, which the cleanup deleted, so neither key is on disk now. Both still validate 200 at OpenRouter: revoke them in the dashboard.
- A retired key sat in `dotfiles/.pi/agent/auth.json.bak-cponly-20261015` on aidev and itan8n; both copies are deleted. It was committed to the dotfiles repo as `archive/claude/settings-openrouter.json` (commits b11face0, 070f0fca), both in origin/main, so it remains in public GitHub history; it is dead.
- Consumers after the cleanup: the cliproxy openrouter provider block on aidev and itan8n, both on the `proxy` key. pi has no openrouter credential on any host (the auth.json entries are gone) and reaches models through cliproxy; Claude Code on every host points at cliproxy directly rather than litellm; the itastack temporal worker no longer calls OpenRouter (it uses TypeSafe's native Jev API since 2026-10-30).
- aidev's cliproxy journal showed five OpenRouter 401s in the week to 2026-10-30 (dead-`main`-key era); the proxy key validates 200 and deepseek-v4.1-flash works through both proxies.
- Transcript leaks: keys appear in pi session files, `.omp` sessions, `.pi-subagents` artifacts and `paperclips` on wrk, aidev and itan8n; only provider-side revocation makes that harmless.
- Clean or unverified: the homelab hosts (jellyfin, sonarr, radarr, prowlarr, qbittorrent, pve1, pve4) hold no OpenRouter key and set no OPENROUTER env, and n8n's own credentials hold none. wrk's Windows side, scanned through `/mnt/c`, holds none. surftop (100.95.222.42) was unreachable from wrk and aidev, so it is unverified; wrk's Windows sshd on port 22 refused the connection.

## Related

- [Adding a CLIProxy Model to the pi Fleet](memory/docs/workstation/pi-cliproxy-model-fleet.md) - the proxy's openrouter provider block and itan8n's config template plus launcher are where these keys are read.
- [Public GitHub Secret Exposure in dotfiles](memory/docs/projects/public-repo-secret-exposure.md) - the full leak scan: which credentials went public, which are still live, and the commits that carried them.
