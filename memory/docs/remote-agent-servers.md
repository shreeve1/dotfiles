---
title: Remote Agent Servers per Machine
summary: All opencode/codex remote servers stopped and disabled 2026-10-26 at James's request; re-enable commands per machine inside.
type: doc
status: promoted
created: 2026-10-26
updated: 2026-10-26
topics: []
---

## Active memory

State since 2026-10-26 (James asked for everything stopped, disabled, reversible):

- aidev, itan8n: `opencode-server.service` stopped and disabled (`systemctl --user disable --now opencode-server`). Codex `app-server` helpers killed; they have no unit and only respawn when a codex/code-mode session runs.
- surftop: `opencode-cli.exe` killed; it had no autostart entry (Run keys, Startup folders, scheduled tasks all clean), so it will not return on reboot. Codex sandbox service `CodexSandboxService.OpenAI.Codex` stopped, but still AUTO_START: `sc config` was denied over unelevated ssh. To keep it off reboot, run as admin on surftop: `sc config CodexSandboxService.OpenAI.Codex start= demand` (MSIX servicing may revert it); or accept it boots — it is inert until the Codex app runs and listens on nothing remote.
- wrk: never had any of it.

Turn back on:
- aidev, itan8n: `systemctl --user enable --now opencode-server`
- surftop: `opencode-cli service start` from a one-off scheduled task with `/it` so it survives the ssh session (see [OpenCode plugin reload](memory/docs/opencode-plugin-reload.md)).
- codex helpers: nothing to re-enable; they spawn when codex is next used.

Gotchas:
- After `disable --now` the aidev unit shows "failed" (opencode exits non-zero on SIGTERM); that is the stopped state, not a fault.
- itan8n has a cron (`~/scripts/cleanup/opencode-cleanup.sh`, 11:30 UTC daily) that only kills stale opencode processes; it starts nothing.
- From aidev there is no `wrk` ssh alias; use `wsl-wrk` (100.95.235.60:2222). From WSL, `tasklist.exe` checks the Windows side without ssh.

## Related

- Shares restart mechanics with [OpenCode plugin reload](memory/docs/opencode-plugin-reload.md).
- Policy: [Retired agent services](memory/decisions/workstation/decision-retired-agent-services.md) — these stay off unless James asks.
