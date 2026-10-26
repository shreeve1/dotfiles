---
title: Plannotator Agent Terminal Stays Off
summary: 2026-10-26 James chose to keep Plannotator's annotate-page agent terminal off; never set PLANNOTATOR_AGENT_TERMINAL_REMOTE.
type: decision
status: promoted
created: 2026-10-26
updated: 2026-10-26
topics: [workstation]
---

## Decision

Plannotator's agent terminal (a panel on annotate pages that starts a new agent process on the host) stays off, in local and remote mode. Do not set `PLANNOTATOR_AGENT_TERMINAL_REMOTE=1` and do not install a compiler just to build its `node-pty` dependency. Why: in remote mode the pages have no login, so any NetBird peer could start an agent with James's rights; and the pi session that opened the page already acts on his feedback.

## Notes

- On Linux `node-pty` has no prebuilt binary and needs `g++`; wrk has none. Installing the pi extension with `npm_config_ignore_scripts=true` skips that build, and only the agent terminal loses anything.

## Related

- The NetBird reach this rests on: [wrk WSL port exposure](memory/docs/wrk-wsl-port-exposure.md) describes how remote-mode pages on wrk are reachable from NetBird peers.
