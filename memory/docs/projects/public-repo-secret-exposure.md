---
title: Public GitHub Secret Exposure in dotfiles
summary: Which credentials leaked into the public shreeve1/dotfiles repo history, which are still live, and what is still exposed in HEAD.
type: doc
status: promoted
created: 2026-10-30
updated: 2026-10-30
topics: [projects]
---

## Active memory

- Scan run 2026-10-30 on `shreeve1/dotfiles` (public). Method: gitleaks 8.30.1 over `--all` (93 findings, 40 distinct values) plus an independent custom blob scanner (163 hits, 14 distinct) that caught URL-embedded credentials gitleaks missed. 90 of the 93 gitleaks findings are doc examples, lint-rule fixtures or sha256 checksums. Every 20 repos in the `shreeve1` account are public.
- **Telegram bot token — still live.** Committed 2026-04-19 in `.claude/MEMORY/LEARNING/FAILURES/2026-04/2026-04-17-225505_explicit-low-rating-210/tool-calls.json` and `transcript.jsonl` (commit 9ed98d71, blob 9eea2a71), dropped from the tree 2026-04-24 (1db04bd2). The bot is `@QpbEh48E9kILrinbbot` ("Loop"), a Claude Code Telegram bot scoped to `~/1-testytech/homelab`; getMe returns 200. It has been public since April: anyone can read that bot's traffic and drive Claude Code on that Mac. Revoke via BotFather.
- **z.ai / GLM API key — still live.** `archive/claude/settings-zai.json`, commit b11face0 (2026-09-11), removed 2026-09-19 (070f0fca). GET `/api/paas/v4/models` returns 200. Revoke in the z.ai console.
- **OpenRouter key — dead.** `archive/claude/settings-openrouter.json`, same two commits; GET `/api/v1/key` returns 401 "User not found". Same retired key as the inventory note below.
- **Moonshot/Kimi key — dead.** `archive/claude/settings-moonshot.json`, same two commits; 401 invalid authentication.
- **Uptime-Kuma webhook authToken (64 hex) — probably real, unverified.** `.claude/skills/Automation/References/webhook-routes.json` and its `.config/opencode` copy, commits 3edf5c67 (2026-04-17) to 317e8c3d (2026-05-21). The same file exposes the Telegram chat id. Rotate if that service still runs.
- **PostHog project key — in HEAD right now.** `phc_` key in `.agents/skills/media-use/scripts/lib/telemetry.mjs` (commit ab3bf891, 2026-10-22); the same value is in the public `starter-agent` and `Claude-Cowork` repos. A PostHog project key is a client-side identifier by design, not a credential, but it exposes internal usage telemetry — move it to an env var.
- No other leaked credential turned up in the 19 sibling public repos (HEAD tarball scan); their history was not scanned.
- `paperclip://paperclip:paperclip@localhost` in the homelab skill docs is a local default, not a leak.

## Related

- [OpenRouter Key Inventory Across Machines](memory/docs/workstation/openrouter-key-inventory.md)
