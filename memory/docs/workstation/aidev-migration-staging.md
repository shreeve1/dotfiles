---
title: Aidev project preservation staging on wrk
summary: ~/migration-aidev on wrk holds verified read-only copies of six aidev projects (2026-10-31); integration decisions open.
type: doc
status: promoted
created: 2026-10-31
updated: 2026-10-31
topics: [workstation]
---

## Active memory

- Staging at `~/migration-aidev` (0700, 1.3G): full copies of metarig, starter-agent, testy-bot, pi-durable-template, pi-durable, 3cx-web-chat plus every worktree, two small extras, six git bundles and per-tree sha256 manifests in `manifests/`. Created 2026-10-31 with James's approval: credential files included, node_modules/.venv/venv excluded, testy-bot's 604M projects/ included.
- pi-durable collision unresolved: merge-base ae04ec4. wrk main had 4 unique commits + untracked youtube/; aidev main had 432 unique commits, 8 branches, 7 worktrees and ran dpi-backend/dpi-playground-hub from that tree. Neither copy was overwritten; integration is an open decision.
- 3cx-web-chat: aidev was 3 commits ahead of wrk HEAD (fast-forwardable), 1 stash, live chat-api + mallory-poc containers. Docker volume chat-api_chat-data is NOT in staging (service workstream owns it).
- The two live-service trees were copied while running: preservation snapshots, not quiesced backups; consistent final copies happen at each service cutover.
- metarig, testy-bot and pi-durable-template had no git remote: aidev was the only holder of their history until this staging existed.
- Gotcha: comparing per-host file manifests requires LC_ALL=C sort on both sides; different host locales otherwise produce phantom diffs (re-rsync transferred zero bytes).

## Reference

- Full inspection report: `~/.local/state/herdr-handoff/20261031-070818-project-preservation-FINDINGS.md`
- Migration plans owned by the main session: `plans/2026-10-31-aidev-to-wrk-migration.md`, `plans/2026-10-31-aidev-service-data-manifest.md`
