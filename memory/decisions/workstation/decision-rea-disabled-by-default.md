---
title: REA Disabled by Default Across the Pi Fleet
summary: Keep REA MCP off by default on all active systems to reduce per-session RAM; leave code-analysis helpers enabled.
type: decision
status: promoted
created: 2026-11-04
updated: 2026-11-04
topics: [workstation]
---

## Decision

James chose REA-only disabling across all active systems on 2026-11-04. Keep REA installed but do not automatically start its MCP reverse-engineering server in Pi. Code-analysis helpers remain enabled. Fabric session actors are governed by the separate [automatic-helper policy](memory/docs/workstation/pi-fabric-mesh-preference.md). Re-enable REA only for an explicitly requested need.

## Applied state

- WSL and itan8n: `~/.pi/agent/mcp.json` has `mcpServers.rea.enabled: false`; existing REA MCP processes were stopped and absence verified.
- wrk native Windows and surftop: no global `mcp.json` or running REA helper was present. Their itastack project overrides already set REA disabled.
- WSL itastack also has a project override disabling REA.
- These MCP files are machine-local/ignored. Preserve this decision during future REA setup or machine sync; do not rely on a Git pull to apply it.
- Existing Pi sessions can refresh their tool lists with `/reload`; new sessions read the disabled flag. No Pi sessions were closed for this change.

## Related

- [Dotfiles Git Sync Across Machines](memory/docs/workstation/dotfiles-git-sync.md): linked installations still have machine-local configuration that must be checked separately.
