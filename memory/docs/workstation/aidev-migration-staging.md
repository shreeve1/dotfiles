---
title: Aidev project preservation staging on wrk
summary: ~/migration-aidev on wrk holds verified read-only copies of eight aidev projects plus state stores and unit definitions (2026-10-31); integration decisions open.
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

- Round 2 (same day, separate approval): durable-bot and homelab staged too, including homelab's infrastructure-wazuh worktree, 12 systemd unit/timer reference copies, james-readable service config, and two live state stores: ~/.local/state/durable-bot (SQLite; use session.sqlite.consistent-backup, not the raw trio) and ~/.local/state/homelab-ops-integrator. durable-bot had NO git remote; homelab is 37 ahead of origin with unmerged branches homelab-ops-integration/t_b2041392 and infrastructure-wazuh, stash preserved.
- Name traps in homelab service config: /etc/homelab-stack's james-owned env is langgraph.env (not langfuse.env); ~/.config/homelab-stack holds ops-agent.env — the paperclip.env named in the alert-dispatch unit comment does not exist.
- /etc/homelab-stack was observed changing during staging (other actors); root-owned key material there (router/temporal-worker envs, HMAC keys, mtls/, ssh/) was NOT staged — service-owner cutover owns it. wrk has no sqlite3 CLI.
- Round 3 (w3:pX request, James-approved): 28 more reference files — unit-definitions/ now 34 (24 system+user units incl. dpi-backend, cliproxyapi, herdr-web-tls), system-config/ (netconsole logrotate, podium-backup cron), liveness-scripts/ (apt-update-check.sh, wan_failover_state_exporter.py; the other four liveness scripts are already byte-identical in the staged homelab repo's scripts/monitoring/).
- Quiesced re-sync after w3:pX's 15:38 UTC service freeze (verified independently): every previously-live tree re-verified first-pass clean, so all staging copies are now consistent quiesced snapshots, not running-state ones. Fresh durable-bot sqlite .backup (integrity ok). aidev services remain stopped per the shutdown log at ~/.local/state/herdr-handoff/20261031-1538-aidev-shutdown-log.md (rollback commands inside; cliproxyapi/herdr/NetBird deliberately kept running).
- Residual writer on aidev is five idle pi panes kept per the preserve-active-pi directive (3 in ~/homelab, 1 ~/pi-durable, 1 ~): they can still touch homelab .pi/fabric/mesh state.json. Homelab staging last refreshed+verified 15:44:09 UTC; run a drift re-check (or have James close the panes) before relying on homelab .pi state at cutover.
- FINAL: panes closed 15:56 UTC (their exit flushed mesh state once); homelab refreshed and verified 15:58 UTC. All four previously-live trees now match staging exactly — staging is authoritative and immutable. agent-browser daemon (excluded from migration) still runs with cwd pi-durable but writes nothing there; flagged to w3:pX for later stop/retire.
- Tattoo project: aidev ~/tatoo (ONE t — why searches missed it); tattoo-artist client site planned as Proxmox LXC at tattoo.testytech.net. James approved full-minus-caches; staged and verified 99 files MATCH post-netbird-restoration. No git, no credentials, no services, no wrk counterpart.
- Placement round 1 (James-approved): metarig+transcripts, starter-agent, testy-bot, pi-durable-template + re-attached web-ui worktree (identical /home/james paths made .git pointers resolve), tatoo, durable-bot files, ops-integrator state now live in wrk home — all manifest-verified, fsck clean, no services started. ~/homelab repo + ~/.config/homelab-stack were placed by another workstream mid-round (not me). Still staged-only: pi-durable + 3cx-web-chat (merge decisions pending).
- pi-durable merge decision (2026-10-31 evening): James approved merging wrk's 4 commits into the aidev lineage; bots workstream (p0) did it in a scratch clone only — ~/migration-aidev/pi-durable-merge at merge commit 33aa041, no conflicts, all 5 tips ancestors; wrk safety bundle at ~/migration-aidev/wrk-originals/pi-durable-wrk-all.bundle. My verified staging tree and wrk ~/pi-durable untouched; adoption is a later step. wrk's untracked youtube/ (11M) stays in ~/pi-durable.
- Ownership (2026-10-31 22:5x): ~/homelab on wrk is pX's live alerting/chat tree (B-phase placement at 9794d43, router runs from its fresh venv; infrastructure-wazuh worktree came with the lineage). Activation of durable-bot/testy-bot/pi-durable belongs to p0 (bots-migration, handed off from pX 22:50 UTC); pX activations are alerting-side only. p0 should run a wrk-side sqlite3 check on durable-bot state before first start (wrk currently lacks sqlite3).
- pi-durable adoption (2026-10-31 late): p0 swapped wrk ~/pi-durable to the merged lineage (5b12488); original wrk tree preserved at ~/pi-durable.wrk-pre-merge; my staged ~/migration-aidev/pi-durable untouched as the pre-merge aidev-side preservation. p0 re-verified all my placements (HEADs, 0600 env, session.sqlite integrity ok). I confirmed a write-freeze on all placed trees: my remaining checks read aidev + staging only, never the placed wrk trees.

## Reference

- Full inspection report: `~/.local/state/herdr-handoff/20261031-070818-project-preservation-FINDINGS.md`
- Migration plans owned by the main session: `plans/2026-10-31-aidev-to-wrk-migration.md`, `plans/2026-10-31-aidev-service-data-manifest.md`
