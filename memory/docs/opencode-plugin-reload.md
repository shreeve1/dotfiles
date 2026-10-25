---
title: OpenCode Plugin Edits Need a Server Restart
summary: Edited OpenCode plugins run only after the server restarts: systemctl --user restart opencode-server on Linux; on Windows end opencode-cli.exe.
type: doc
status: promoted
created: 2026-10-25
updated: 2026-10-25
topics: []
---

## Active memory

- Why a restart is needed, and the load-twice dedupe: `docs/adr/0015-end-of-turn-verify-hooks.md` (OpenCode addendum).
- Linux (aidev, itan8n): the server is the user unit `opencode-server`; `systemctl --user restart opencode-server` loads the new plugin code.
- Windows: reopening the desktop app does not reload plugins; ending `opencode-cli.exe` does.
- Windows over ssh: `opencode-cli service start` exits when the ssh session closes. Start it from a one-off scheduled task with `/it` so it runs in the logged-in session.
