---
title: Remote Agent Servers per Machine
summary: OpenCode serves remotely on NetBird :4096 on aidev, itan8n and surftop; wrk has none. Codex app-server is a local unix-socket helper, not remote.
type: doc
status: promoted
created: 2026-10-26
updated: 2026-10-26
topics: []
---

## Active memory

Verified 2026-10-26 by probing each machine:

- aidev: `opencode-server.service` (enabled) runs `opencode serve --hostname 100.95.230.15 --port 4096`; a second `opencode serve --service` also runs. Codex `app-server`, `app-server proxy` and `codex-code-mode-host` run as local background processes.
- itan8n: same shape — `opencode-server.service` on 100.95.224.218:4096, plus the codex background trio.
- surftop (Windows): `opencode-cli.exe` listens on 0.0.0.0:4096; a `codex-windows-sandbox` service process runs.
- wrk: none of it — no unit files, processes or scheduled tasks on either the WSL or Windows side; `~/.codex` config exists but no server runs.
- Codex `app-server` listens on a unix socket only: it is a local helper for Codex sessions, not a remote-management endpoint. Remote management goes through OpenCode :4096.
- From aidev there is no `wrk` ssh alias; bare `ssh wrk` falls back to defaults (port 22) and fails. Use the `wsl-wrk` alias (100.95.235.60:2222). From WSL, `tasklist.exe` checks the Windows side without ssh.

## Related

- Informs [OpenCode plugin reload](memory/docs/opencode-plugin-reload.md): which machines run the server that needs restarting after plugin edits.
- Alongside [Retired agent services](memory/decisions/workstation/decision-retired-agent-services.md): which agent services are deliberately off.
