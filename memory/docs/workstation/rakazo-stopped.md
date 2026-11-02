---
title: Rakazo Stopped on wrk WSL
summary: James turned Rakazo off on 2026-11-02; its bot-team container left stale Chromium sessions running at ~2 cores. Containers stopped, not removed.
type: doc
status: promoted
created: 2026-11-02
updated: 2026-11-02
topics: [workstation]
---

## Active memory

- Rakazo (compose project `rakazo`, `/home/james/rakazo`) runs in native Docker on wrk WSL. On 2026-11-02 James asked to turn it off because WSL was using a lot of resources.
- Cause: the per-team bot container (`rakazo-bot-team-<hash>`, image `rakazo/computer`) started a new Xvfb + Chromium for each session and never closed the old ones; idle Chromium renderers used ~2 cores.
- Done: `docker stop` on the bot container and `docker compose -p rakazo stop`. Nothing was removed; data in the postgres volume is intact. `docker compose -p rakazo start` (from `/home/james/rakazo`) brings it back.
- The worker, api, supervisor, web and postgres services have `restart: unless-stopped`, so a manual stop survives WSL and Docker restarts.
- The `rakazo-tab-wake` crontab lines (`~/bots/tab-wake.sh`, every 5 min) were already commented out.
