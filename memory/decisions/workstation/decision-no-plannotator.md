---
title: Plannotator Tried and Dropped
summary: 2026-10-26 James trialled Plannotator (pi extension, browser brainstorming, Inbox) on wrk and decided not to use it; everything was removed.
type: decision
status: promoted
created: 2026-10-26
updated: 2026-10-26
topics: [workstation]
---

## Decision

On 2026-10-26 James trialled Plannotator on wrk: its pi extension, a draft `plannotator-browser` skill that ran superpowers brainstorming as browser rounds over NetBird, and the Plannotator Inbox. All of it worked, but he decided not to adopt it and had it all removed. Don't propose Plannotator again unless he raises it.

## Notes

- What the trial established, in case he comes back to it: remote mode pages on wrk are reachable from NetBird peers ([wrk WSL port exposure](memory/docs/wrk-wsl-port-exposure.md)); the Inbox listens on loopback only and can't be reached over NetBird; its per-session switch is machine-wide (env var or `~/.plannotator/config.json`), not per project.
