---
title: REA Lives Only in ~/rea-lab
summary: REA MCP and its skill exist only in ~/rea-lab; no global registration in pi or Codex on any machine.
type: decision
status: promoted
created: 2026-11-04
updated: 2026-11-05
topics: [workstation]
---

## Decision

James chose on 2026-11-05 to scope REA (`https://github.com/morluto/rea`) to one folder, `~/rea-lab` on wsl, a starter-agent workspace opened with pi. This replaces the 2026-11-04 "installed but disabled globally" setting. Do not add REA to any global MCP config again; open `~/rea-lab` instead. Code-analysis helpers stay enabled.

## Why

A disabled entry in `~/.pi/agent/mcp.json` did not stop REA: pi-fabric's mcporter fallback also imports `~/.codex/config.toml`, which had `[mcp_servers.rea]`, so every pi session (and dsh's pi-based superagent) started its own `rea mcp` (~270 MB each). Removing the Codex entry stopped it; verified 2026-11-05 with a fresh pi session in dotfiles.

## Applied state (2026-11-05)

- wsl and itan8n: `[mcp_servers.rea]` removed from `~/.codex/config.toml`; `rea` removed from `~/.pi/agent/mcp.json`. Backups: `<file>.bak-rea-lab-2026-11-05`. These files are machine-local, not in Git.
- wrk native Windows and surftop: no REA registration found.
- The `reverse-engineer-anything` skill moved from `.agents/skills/` here to `~/rea-lab/.agents/skills/`; other machines lose it on their next pull.
- `~/rea-lab/.pi/mcp.json` registers REA. pi reads it only when started from `~/rea-lab` itself, not a subfolder.
- The itastack project override (`rea.enabled: false`) is now a harmless no-op.
- Gotcha: pi-fabric keeps per-project tool lists in `<project>/.pi/fabric/mcp-cache.json`. Old caches still list REA tools even though REA can no longer start there.
- The REA CLI (`rea-agents` 6.7.0) stays installed globally; it starts nothing on its own.

## Related

- Design: `docs/superpowers/specs/2026-11-05-rea-lab-design.md`.
- [Dotfiles Git Sync Across Machines](memory/docs/workstation/dotfiles-git-sync.md): machine-local configuration must be checked separately.
