---
title: dsh-superagent Test Install on wsl
summary: dsh 0.2.1-rc.3 reinstalled on wsl 2026-11-03 only to test dsh-superagent; profile superagent, port 3082. Its status script misreads the process name.
type: doc
status: promoted
created: 2026-11-03
updated: 2026-11-03
topics: [workstation]
---

## Active memory

- James approved reinstalling dsh on wsl on 2026-11-03, as a test only, to try `deepseek-ai/dsh-superagent-prototype`. The fleet note "dsh is retired" still describes the long-term state; update it if James keeps dsh.
- James asked for no extra dsh plugins: only `dsh-superagent` (linked from `~/src/dsh-superagent`) is in profile `~/.dsh/profiles/superagent`. dsh's 12 `dsh-experimental-*` bundles ship switched off; leave them off. Don't reinstall the old aidev plugin set from `docs/deepseek-harness.md`.
- GitHub setup (agent account, repo, allowed list) is on hold at James's request; the service runs and waits with setup problem `repositoryUnset`.
- Install gotchas: `npm install -g @deepseek-ai/dsh` skips install scripts under npm's allow-scripts policy; rerun with `--allow-scripts=@deepseek-ai/dsh-subprocess-local,koffi,node-pty,@google/genai,protobufjs` (dsh's own native parts). pnpm comes from `corepack enable --install-directory ~/.local/bin pnpm`.
- `scripts/dsh-superagent status/start` reports "not running" (exit 1) even while it serves: it matches `ps` ucomm `node`/`dsh`, but dsh shows as `MainThread`. Check with `curl -H 'x-orchestrator-request: 1' http://127.0.0.1:3082/orchestrator/api/state` instead. The script's `stop` and its hourly restart check are unreliable until this is fixed.
- Runs in tmux session `dsh-superagent`; the panel URL with its login token is the first line of the newest `~/src/dsh-superagent/.artifacts/dsh-superagent-superagent-*.log`. State dir `~/.dsh/state/superagent`.

## Related

- [Remote Agent Servers per Machine](memory/docs/workstation/remote-agent-servers.md): another record of which agent servers run on which machine.
