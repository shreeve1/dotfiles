---
title: Public GitHub Secret Exposure in dotfiles
summary: Credentials that leaked into the public shreeve1/dotfiles repo, the 2026-10-30 history rewrite that purged them, and what still needs rotating.
type: doc
status: promoted
created: 2026-10-30
updated: 2026-10-30
topics: []
---

## Active memory

- Scan 2026-10-30 on `shreeve1/dotfiles` (public; all 20 repos in the `shreeve1` account are public). gitleaks 8.30.1 over all refs (93 findings, 40 distinct values) plus an independent blob scanner (14 distinct values) that caught URL-embedded credentials gitleaks missed. 90 of the 93 were doc examples, lint-rule fixtures or sha256 checksums.
- Six real values were in the history: a Telegram bot token (`.claude/MEMORY/LEARNING/FAILURES/2026-04/2026-04-17-225505_explicit-low-rating-210/`, commits 9ed98d71 to 1db04bd2), z.ai and OpenRouter and Moonshot keys (`archive/claude/settings-*.json`, commits b11face0 to 070f0fca), an Uptime-Kuma webhook token (`.claude/skills/Automation/References/webhook-routes.json`, commits 3edf5c67 to 317e8c3d), and a PostHog project key (`.agents/skills/media-use/scripts/lib/telemetry.mjs`, commit ab3bf891).
- **History rewritten 2026-10-30** with `git filter-repo --replace-text` (six literal values replaced by `***REMOVED-<NAME>***`) across all refs; the rewritten main tip is now d8b5fa73 (the old tip was 30001615). `fix/team-comms-critical-issues` was unchanged because it forked 2026-03-29, before the leaks. Verified: all 17,331 blobs in all refs scanned, none of the six values remain; gitleaks on the rewritten repo reports 80 findings, all doc examples and fixtures.
- **Rotation is still the thing that matters, not the rewrite.** At the time of the scan the Telegram bot token and the z.ai key were live (getMe and the models endpoint both answered 200); the OpenRouter and Moonshot keys were already dead (401). The Uptime-Kuma token was a real internal credential and was never verified.
- The PostHog value is still hardcoded in the public `starter-agent` and `Claude-Cowork` repos, so it remains public whatever happens here. It now lives per machine in `~/.hyperframes/config.json` as `posthogApiKey`, or in `MEDIA_USE_POSTHOG_KEY`; rotate it in PostHog and distribute the new value.
- GitHub keeps unreachable objects until Support garbage-collects them, so the pre-rewrite commits can still resolve by SHA for a while; the Support request is the remaining step. Any clone, fork or scraper that read the repo before 2026-10-30 keeps its own copy.
- Every clone of this repo must be re-cloned or reset after the force-push, or the next push restores the old history: wrk, aidev, itan8n and surftop each have one.
- Pre-rewrite history backup: `~/backups/dotfiles-pre-rewrite-20261030.bundle` (0600, contains the old values, local only).

## Related

- [OpenRouter Key Inventory Across Machines](memory/docs/workstation/openrouter-key-inventory.md)
