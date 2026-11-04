---
title: Fabric Automatic Helpers Off; Mesh On
summary: Automatic advisor, supervisor and specialist are disabled fleet-wide for now; Fabric, manual agents and mesh remain enabled.
type: doc
status: promoted
created: 2026-10-30
updated: 2026-11-04
topics: [workstation]
---

James asked on 2026-11-04 to disable automatic Fabric advisor, supervisor and specialist helpers on all active systems for now. Keep Fabric itself, manually requested agents and code-analysis helpers enabled. Do not restart automatic reviewers without James asking.

Each active installation (wrk WSL, wrk native Windows, surftop and itan8n) has `"-extensions/fabric-auto-start.ts"` in its global `~/.pi/agent/settings.json` extension exclusions. The seed template carries the same exclusion; retain the extension source so this is reversible. The existing `tests/pi-verify-final-disabled.test.sh` guard checks both automatic-reviewer and verify-final exclusions.

Six live automatic actors in the two dotfiles WSL sessions were stopped through Fabric's owner-acknowledged stop API and verified stopped. Other already-open sessions need `/reload` or restart to unload the extension; they were not interrupted. The exclusion applies immediately to new sessions.

Keep `mesh.enabled: true` and `mesh.peerNotices: false`; disabling the reviewers does not require changing either. Trusted project `.pi/fabric.json` can override global mesh settings. Fabric's settings screen defaults to project scope; Ctrl+G switches to global.

## Related

- [REA Off by Default](memory/decisions/workstation/decision-rea-disabled-by-default.md): separate REA MCP disabling; neither policy disables code-analysis helpers.
